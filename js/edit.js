// 編集モード（?edit=1）。編集内容はこのブラウザのlocalStorageにだけ自動保存する。
// 公開データへの反映は「書き出し」→ GitHub上のファイル置換で行う。（編集画面は日本語のみ）
const LS_KEY = 'hazmap_edit_v1';

const Edit = {
  on: EDIT,
  undo: [], redo: [],
  exportedAt: null, changedAt: null, saveOk: true,
  placing: false, ghost: null, form: null, last: null
};

function nowISO() { return new Date().toISOString(); }
function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function newId() {
  let id;
  do { id = 'h' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36); }
  while (hazardData.features.some(f => f.properties.id === id));
  return id;
}

// ---------- 保存・元に戻す ----------
function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if (s && s.hazards && s.hazards.features && s.cats && s.cats.categories) {
      Edit.exportedAt = s.exportedAt || null;
      Edit.changedAt = s.changedAt || s.savedAt || null;
      return s;
    }
  } catch (e) { /* 保存データなし・使用不可 */ }
  return null;
}
function persist() {
  if (!EDIT) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ hazards: hazardData, cats: CATS, savedAt: nowISO(), changedAt: Edit.changedAt, exportedAt: Edit.exportedAt }));
    Edit.saveOk = true;
  } catch (e) { Edit.saveOk = false; }
}
function hasUnexported() { return !!Edit.changedAt && (!Edit.exportedAt || Edit.changedAt > Edit.exportedAt); }

function snapshot() { return JSON.stringify({ h: hazardData, c: CATS }); }
function pushUndo() { Edit.undo.push(snapshot()); if (Edit.undo.length > 40) Edit.undo.shift(); Edit.redo.length = 0; }
function applySnap(s) { const o = JSON.parse(s); hazardData = o.h; CATS = o.c; }

function updateEditUI() {
  const dot = $('#dock [data-act="edit"] .dock-badge');
  if (dot) dot.hidden = !hasUnexported();
}
function afterChange() {
  renderHazards();
  updateEditUI();
  ['edit-home', 'list', 'filter'].forEach(id => { if (Panel.isOpen(id)) Panel.refresh(); });
}
Edit.mutate = function (fn) {
  pushUndo(); fn();
  Edit.changedAt = nowISO(); persist(); afterChange();
};
Edit.doUndo = function () {
  if (!Edit.undo.length || Panel.isOpen('form') || Panel.isOpen('cats')) return;
  Edit.redo.push(snapshot()); applySnap(Edit.undo.pop());
  Edit.changedAt = nowISO(); persist(); afterChange(); toast('元に戻しました');
};
Edit.doRedo = function () {
  if (!Edit.redo.length || Panel.isOpen('form') || Panel.isOpen('cats')) return;
  Edit.undo.push(snapshot()); applySnap(Edit.redo.pop());
  Edit.changedAt = nowISO(); persist(); afterChange(); toast('やり直しました');
};

// ---------- ピンを置く（場所の指定） ----------
function showPlaceBanner(on) {
  const b = $('#place-banner');
  b.hidden = !on;
  if (!on) return;
  const touch = !hoverCapable();
  b.innerHTML = '<span class="pb-ic">' + ic('pin', 18) + '</span><span class="pb-t"><b>' + (touch ? '地図をタップして場所を指定' : '地図をクリックして場所を指定') +
    '</b><small>置いたあとも、ドラッグで位置を直せます</small></span>' +
    '<button type="button" class="btn btn-sm" id="pb-center">中央に置く</button><button type="button" class="btn btn-sm btn-ghost" id="pb-cancel">キャンセル</button>';
  $('#pb-center').onclick = () => Edit.dropAt(map.getCenter());
  $('#pb-cancel').onclick = () => Edit.cancelPlacing();
}

Edit.startPlacing = async function () {
  if (Edit.placing) return Edit.cancelPlacing();
  if (Panel.current && !Panel.current.noClose) { if (!(await Panel.requestClose())) return; }
  Edit.placing = true;
  document.body.classList.add('placing');
  $('#map').classList.add('placing');
  showPlaceBanner(true);
  if (hoverCapable()) {
    const last = Edit.last || {};
    Edit.ghost = L.marker(map.getCenter(), {
      icon: pinIcon({ category: last.category || (CATS.categories[0] || {}).id, severity: last.severity || 1 }, { ghost: true, badge: false }),
      interactive: false, keyboard: false, zIndexOffset: 900, opacity: 0
    }).addTo(map);
  }
  if (Panel.isOpen('edit-home')) Panel.refresh();
};
Edit.cancelPlacing = function () {
  if (!Edit.placing) return;
  Edit.placing = false;
  document.body.classList.remove('placing');
  $('#map').classList.remove('placing');
  showPlaceBanner(false);
  if (Edit.ghost) { Edit.ghost.remove(); Edit.ghost = null; }
  if (Panel.isOpen('edit-home')) Panel.refresh();
};
Edit.dropAt = function (ll) { Edit.cancelPlacing(); Edit.openForm(null, ll); };
Edit.pinClicked = function (f) { Edit.cancelPlacing(); Edit.openForm(f); };
Edit.movePin = function (f, coords) {
  Edit.mutate(() => { f.geometry.coordinates = coords; f.properties.updated_at = today(); });
  toast('位置を更新しました', { action: { label: '元に戻す', fn: Edit.doUndo } });
};

// ---------- 入力フォーム ----------
Edit.updateFormCoords = function () {
  const el = $('#f-coord');
  if (el && Edit.form) el.textContent = Edit.form.coords[1].toFixed(6) + ',  ' + Edit.form.coords[0].toFixed(6);
};
function previewForm() {
  const form = Edit.form;
  if (!form) return;
  if (form.isNew) { if (form.marker) form.marker.setIcon(pinIcon(form.w, { draft: true })); }
  else refreshMarker(form.f.properties.id, form.w);
}

Edit.openForm = async function (f, ll) {
  if (Edit.form) {
    if (f && Edit.form.f === f) return;
    if (!(await Panel.requestClose())) return;
  }
  const isNew = !f;
  const last = Edit.last || {};
  const w = isNew
    ? { dummy: false, category: last.category || (CATS.categories[0] || {}).id || '', severity: last.severity || (CATS.severities[0] || {}).level || 1,
        name_ja: '', name_en: '', desc_ja: '', desc_en: '', action_ja: '', action_en: '', photo: '', warn_radius_m: 0 }
    : JSON.parse(JSON.stringify(f.properties));
  if (isNew) w.warn_radius_m = sevOf(w.severity).warn_radius_m || 0;
  const coords = isNew ? [+ll.lng.toFixed(6), +ll.lat.toFixed(6)] : f.geometry.coordinates.slice();
  const form = { f: f || null, w, coords, isNew, dirty: false, marker: null, tab: 'ja', warnTouched: !isNew };
  Edit.form = form;

  if (isNew) {
    form.marker = L.marker([coords[1], coords[0]], { icon: pinIcon(w, { draft: true }), draggable: true, zIndexOffset: 1000, keyboard: false }).addTo(map);
    form.marker.on('drag', e => {
      const p = e.target.getLatLng();
      form.coords = [+p.lng.toFixed(6), +p.lat.toFixed(6)];
      Edit.updateFormCoords();
    });
    form.marker.on('dragend', () => { form.dirty = true; });
  } else {
    setSelected(f.properties.id);
    renderHazards();
  }

  Panel.open({
    id: 'form', title: isNew ? '新しい危険個所' : '危険個所を編集', icon: 'pin', modal: false,
    render: renderForm,
    canClose: async () => !Edit.form || !Edit.form.dirty || await confirmBox('入力内容を破棄しますか？', '保存していない変更は失われます。', '破棄する', true, '編集を続ける'),
    onClose() {
      const fm = Edit.form;
      Edit.form = null;
      if (fm && fm.marker) fm.marker.remove();
      setSelected(null);
      renderHazards();
    }
  });
  if (!isWide()) focusLatLng([coords[1], coords[0]], Math.max(map.getZoom(), isNew ? 17 : 16));
  if (isNew && hoverCapable()) setTimeout(() => { const i = $('#panel [data-k="name_ja"]'); if (i) i.focus(); }, 380);
};

function renderForm(body, foot) {
  const form = Edit.form, w = form.w;
  const catChips = CATS.categories.map(c => {
    const col = safeColor(c.color);
    return '<button type="button" class="pick" data-cat="' + esc(c.id) + '" role="radio" aria-checked="' + (c.id === w.category) + '" style="--cc:' + col + ';--ct:' + textOn(col) + '">' +
      '<span class="pick-ic">' + ic(GLYPHS[c.icon] ? c.icon : 'alert', 15) + '</span>' + esc(c.ja) + '</button>';
  }).join('');
  const sevCards = CATS.severities.map(s => {
    const col = safeColor(s.color, '#111827');
    return '<button type="button" class="sevcard" data-sev="' + esc(s.level) + '" role="radio" aria-checked="' + (Number(s.level) === Number(w.severity)) + '" style="--sc:' + col + ';--st:' + textOn(col) + '">' +
      '<span class="sevcard-shape">' + sevShapeSvg(s.level, 20) + '</span><b>' + esc(s.mark) + '</b><span>' + esc(s.ja) + '</span></button>';
  }).join('');
  const fld = (k, label, ph, ta) => '<label class="fld"><span>' + label + '</span>' + (ta
    ? '<textarea class="input textarea" data-k="' + k + '" rows="3" placeholder="' + esc(ph) + '">' + esc(w[k]) + '</textarea>'
    : '<input class="input" data-k="' + k + '" value="' + esc(w[k]) + '" placeholder="' + esc(ph) + '" autocomplete="off">') + '</label>';

  body.innerHTML =
    '<div class="loc-card"><span class="loc-ic">' + ic('pin', 18) + '</span><div><small>位置</small><b class="mono" id="f-coord"></b></div>' +
    '<span class="loc-hint">' + ic('tap', 14) + 'ドラッグで微調整</span></div>' +
    '<div class="fld-label">① 種別</div><div class="picks" role="radiogroup" id="f-cats">' + catChips + '</div>' +
    '<div class="fld-label">② 危険度</div><div class="sevcards" role="radiogroup" id="f-sevs">' + sevCards + '</div>' +
    '<div class="fld-label">③ 内容 <small>日本語・英語の両方を入力します</small></div>' +
    '<div class="tabs" role="tablist"><button type="button" role="tab" data-tab="ja" aria-selected="true">日本語<i class="miss" data-miss="ja" hidden></i></button>' +
    '<button type="button" role="tab" data-tab="en" aria-selected="false">English<i class="miss" data-miss="en" hidden></i></button></div>' +
    '<div class="pane" data-pane="ja">' + fld('name_ja', '名称', '例：崖下の通路') + fld('desc_ja', '説明', '例：雨のあとは、足場が滑りやすくなることがあります。', true) +
    '<p class="hint">「〜することがあります」のように、断定しない表現で書きます。</p>' + fld('action_ja', '対処法', '例：手すりを使い、ゆっくり歩いてください。', true) + '</div>' +
    '<div class="pane" data-pane="en" hidden>' + fld('name_en', 'Name', 'e.g. Path below the cliff') + fld('desc_en', 'Description', 'e.g. The steps can become slippery after rain.', true) +
    fld('action_en', 'What to do', 'e.g. Use the handrail and walk slowly.', true) + '</div>' +
    '<label class="switch-row"><span><b>サンプル（ダミー）</b><small>画面に「サンプル」と表示します。実データではオフにします。</small></span>' +
    '<input type="checkbox" class="switch" data-k="dummy"' + (w.dummy ? ' checked' : '') + '></label>' +
    '<details class="adv"><summary>詳細設定</summary>' + fld('photo', '写真のファイルパス（任意）', '例：photos/h001.jpg') +
    '<label class="fld"><span>警告半径（m）<small>第2段階の接近アラート用</small></span><input class="input" type="number" min="0" data-k="warn_radius_m" value="' + esc(w.warn_radius_m) + '"></label></details>' +
    '<p class="form-err" id="f-err" role="alert" hidden></p>';

  foot.innerHTML = (form.isNew ? '' : '<button type="button" class="btn btn-md btn-danger-ghost" id="f-del">' + ic('trash', 16) + '削除</button>') +
    '<button type="button" class="btn btn-md" id="f-cancel">キャンセル</button><button type="button" class="btn btn-md btn-primary grow" id="f-save">保存</button>';

  Edit.updateFormCoords();
  const markDirty = () => { form.dirty = true; };
  const updateMiss = () => {
    $('[data-miss="ja"]', body).hidden = !!(w.name_ja || '').trim();
    $('[data-miss="en"]', body).hidden = !!(w.name_en || '').trim();
  };
  updateMiss();

  const showTab = tab => {
    form.tab = tab;
    $$('.tabs [data-tab]', body).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $$('.pane', body).forEach(p => { p.hidden = p.dataset.pane !== tab; });
  };
  $$('.tabs [data-tab]', body).forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

  body.addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.k;
    if (!k) return;
    w[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    markDirty();
    if (k === 'name_ja' || k === 'name_en') updateMiss();
    if (k === 'dummy') previewForm();
    if (k === 'warn_radius_m') form.warnTouched = true;
    $('#f-err', body).hidden = true;
  });
  $$('.pick', body).forEach(b => b.addEventListener('click', () => {
    w.category = b.dataset.cat; markDirty();
    $$('.pick', body).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    previewForm();
  }));
  $$('.sevcard', body).forEach(b => b.addEventListener('click', () => {
    w.severity = Number(b.dataset.sev); markDirty();
    $$('.sevcard', body).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    if (!form.warnTouched) { w.warn_radius_m = sevOf(w.severity).warn_radius_m || 0; $('[data-k="warn_radius_m"]', body).value = w.warn_radius_m; }
    previewForm();
  }));
  body.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveForm(); });

  $('#f-cancel', foot).onclick = () => Panel.requestClose();
  $('#f-save', foot).onclick = saveForm;
  const del = $('#f-del', foot);
  if (del) del.onclick = deleteFromForm;
}

function saveForm() {
  const form = Edit.form;
  if (!form) return;
  const w = form.w;
  ['name_ja', 'name_en', 'desc_ja', 'desc_en', 'action_ja', 'action_en', 'photo'].forEach(k => { w[k] = (w[k] || '').trim(); });
  if (!w.name_ja && !w.name_en) {
    const err = $('#f-err');
    err.textContent = '名称を入力してください（日本語または English）。';
    err.hidden = false;
    const tab = $('#panel .tabs [data-tab="ja"]'); if (tab) tab.click();
    const i = $('#panel [data-k="name_ja"]'); if (i) i.focus();
    return;
  }
  w.severity = Number(w.severity) || 1;
  w.warn_radius_m = Math.max(0, Number(w.warn_radius_m) || 0);
  const wasNew = form.isNew;
  const enMissing = !w.name_en || (w.desc_ja && !w.desc_en) || (w.action_ja && !w.action_en);
  Edit.mutate(() => {
    if (wasNew) {
      hazardData.features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: form.coords },
        properties: Object.assign({}, w, { id: newId(), updated_at: today() }) });
    } else {
      Object.assign(form.f.properties, w, { updated_at: today() });
      form.f.geometry.coordinates = form.coords;
    }
  });
  Edit.last = { category: w.category, severity: w.severity };
  form.dirty = false;
  Panel.close();
  toast(wasNew ? 'ピンを追加しました' : '保存しました', wasNew ? { action: { label: '続けて追加', fn: Edit.startPlacing } } : {});
  if (enMissing) setTimeout(() => toast('英語の入力が空欄です。あとで追加できます。', { tone: 'warn', ms: 5000 }), 300);
}

async function deleteFromForm() {
  const form = Edit.form;
  if (!form || !form.f) return;
  const p = form.f.properties;
  const name = p.name_ja || p.name_en || 'このピン';
  if (!(await confirmBox('このピンを削除しますか？', '「' + name + '」を削除します。あとで「元に戻す」で復元できます。', '削除する', true))) return;
  const f = form.f;
  form.dirty = false;
  Edit.mutate(() => { hazardData.features = hazardData.features.filter(x => x !== f); });
  Panel.close();
  toast('ピンを削除しました', { action: { label: '元に戻す', fn: Edit.doUndo } });
}

// ---------- 編集メニュー ----------
Edit.openHome = function () {
  Panel.open({ id: 'edit-home', title: '編集メニュー', icon: 'edit', noClose: isWide(), modal: true, focus: false, render: renderHome });
};

function renderHome(body) {
  const n = hazardData.features.length;
  const un = hasUnexported();
  const fs = sortedHazards();
  body.innerHTML =
    '<div class="e-status"><span class="pill ' + (un ? 'pill-warn' : 'pill-ok') + '">' + (un ? '未書き出しの変更あり' : Edit.changedAt ? '書き出し済み' : '公開中のデータと同じ') +
    '</span><span class="muted">ピン ' + n + ' 件</span></div>' +
    (Edit.saveOk ? '' : '<div class="note note-warn">このブラウザに自動保存できません。こまめに「書き出し」してください。</div>') +
    '<button type="button" class="btn btn-lg btn-primary btn-block' + (Edit.placing ? ' is-active' : '') + '" id="h-add">' +
    (Edit.placing ? ic('x', 20) + 'キャンセル（場所を指定中）' : ic('plus', 20) + '新しいピンを追加') + '</button>' +
    '<ol class="steps steps-mini">' +
    '<li><span>1</span><p>「新しいピンを追加」を押す</p></li>' +
    '<li><span>2</span><p>地図をクリック（スマホはタップ）して場所を指定</p></li>' +
    '<li><span>3</span><p>種別・危険度・内容を入力して「保存」</p></li>' +
    '<li><span>4</span><p>最後に「書き出し」して、GitHubに上書き</p></li></ol>' +
    '<div class="btn-row"><button type="button" class="btn btn-sm" id="h-undo"' + (Edit.undo.length ? '' : ' disabled') + '>' + ic('undo', 15) + '元に戻す</button>' +
    '<button type="button" class="btn btn-sm" id="h-redo"' + (Edit.redo.length ? '' : ' disabled') + '>' + ic('redo', 15) + 'やり直す</button></div>' +
    '<h3 class="sec">データ</h3><div class="btn-grid">' +
    '<button type="button" class="btn btn-md btn-accent" id="h-export">' + ic('download', 16) + '書き出し</button>' +
    '<button type="button" class="btn btn-md" id="h-import">' + ic('upload', 16) + '読み込み</button>' +
    '<button type="button" class="btn btn-md" id="h-csv">' + ic('doc', 16) + 'CSV</button></div>' +
    '<p class="muted small">「書き出し」の2ファイル（hazards.geojson・categories.json）を、GitHub の data フォルダに上書きアップロードすると、公開版に反映されます。</p>' +
    '<h3 class="sec">設定</h3>' +
    '<button type="button" class="btn btn-md btn-block" id="h-cats">' + ic('tag', 16) + '種別・危険度の編集</button>' +
    '<button type="button" class="btn btn-md btn-block btn-danger-ghost" id="h-reset">' + ic('trash', 16) + '編集内容を破棄</button>' +
    '<h3 class="sec">登録済みのピン <span class="count">' + n + '</span></h3>' +
    '<div class="rows">' + fs.map(hazardRowHTML).join('') + '</div>' +
    '<p class="note">編集画面は本物の認証ではありません。URLを知っている人は誰でも開けますが、公開版は書き換わりません。編集内容は、このブラウザの中にだけ保存されます。</p>';

  $('#h-add', body).onclick = () => Edit.startPlacing();
  $('#h-undo', body).onclick = () => Edit.doUndo();
  $('#h-redo', body).onclick = () => Edit.doRedo();
  $('#h-export', body).onclick = exportAll;
  $('#h-import', body).onclick = importFiles;
  $('#h-csv', body).onclick = exportCSV;
  $('#h-cats', body).onclick = openCategoryEditor;
  $('#h-reset', body).onclick = async () => {
    if (!(await confirmBox('編集内容を破棄しますか？', 'このブラウザに保存した編集内容を消して、公開中のデータに戻します。先に「書き出し」で保存しておくことをおすすめします。', '破棄する', true))) return;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    location.reload();
  };
  wireRows(body, f => Edit.pinClicked(f));
}

// ---------- 初期化 ----------
function initEdit() {
  if (!EDIT) return;
  $('#pill-edit').hidden = false;
  map.on('click', e => { if (Edit.placing) Edit.dropAt(e.latlng); });
  map.on('mousemove', e => { if (Edit.ghost) { Edit.ghost.setLatLng(e.latlng); Edit.ghost.setOpacity(1); } });
  map.on('mouseout', () => { if (Edit.ghost) Edit.ghost.setOpacity(0); });
  Panel.onIdle = () => { if (isWide()) Edit.openHome(); };
  mqWide.addEventListener('change', () => {
    document.body.classList.toggle('edit-wide', isWide());
    setTimeout(() => map.invalidateSize(), 0);
    if (isWide() && !Panel.current) Edit.openHome();
  });
  document.addEventListener('keydown', e => {
    const tag = ((e.target && e.target.tagName) || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    const k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? Edit.doRedo() : Edit.doUndo(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); Edit.doRedo(); }
  });
  updateEditUI();
  if (isWide()) Edit.openHome();
}
