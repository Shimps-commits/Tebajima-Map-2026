// マイピン：利用者が「見どころ」を地図に記録する。保存先は、その人の端末の中だけ。
// みんなの地図に載せたいときは、利用者が自分で「運営に送る」。運営が確認して、公開データに取り込む。
const MyPins = { key: 'hazmap_mine_v1', features: [], form: null, lastCat: null, lastNick: '' };

function validPoint(f) {
  const c = f && f.geometry && f.geometry.coordinates;
  return !!(f && f.properties && f.geometry.type === 'Point' && Array.isArray(c) && isFinite(c[0]) && isFinite(c[1]));
}

MyPins.load = function () {
  MyPins.features = [];
  try {
    const s = JSON.parse(localStorage.getItem(MyPins.key));
    if (s && Array.isArray(s.features)) s.features.forEach(f => { if (validPoint(f)) { f.properties.mine = true; MyPins.features.push(f); } });
    if (s && s.lastNick) MyPins.lastNick = s.lastNick;
  } catch (e) { /* 保存データなし・使用不可 */ }
};
MyPins.save = function () {
  try {
    localStorage.setItem(MyPins.key, JSON.stringify({ features: MyPins.features, lastNick: MyPins.lastNick }));
    return true;
  } catch (e) { toast(t('dataError'), { tone: 'warn' }); return false; }
};
MyPins.newId = function () { return 'm' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36); };

// ---- 場所を指定する ----
MyPins.startPlacing = function () {
  const cats = catsOfKind('spot');
  if (!cats.length) return;
  const cat = cats.some(c => c.id === MyPins.lastCat) ? MyPins.lastCat : cats[0].id;
  Place.start({
    owner: 'mine', ghostProps: { category: cat, mine: true },
    text: { title: t(hoverCapable() ? 'placeClick' : 'placeTap'), sub: t('placeSub'), center: t('placeCenter'), cancel: t('btnCancel') },
    onDrop: ll => MyPins.openForm(null, ll)
  });
};

// ---- 入力フォーム（日英どちらの画面でも使える）----
MyPins.updateFormCoords = function () {
  const el = $('#mf-coord');
  if (el && MyPins.form) el.textContent = MyPins.form.coords[1].toFixed(6) + ',  ' + MyPins.form.coords[0].toFixed(6);
};
function mineProps(form) {                                  // 入力中の内容を、ピンの形にする（プレビュー用）
  const v = form.vals;
  const p = { id: form.id, category: form.cat, mine: true, dummy: false };
  p['name_' + lang] = v.name; p['desc_' + lang] = v.comment;
  return p;
}
MyPins.previewForm = function () {
  const form = MyPins.form;
  if (!form) return;
  const p = mineProps(form);
  form.w = p;
  if (form.isNew) { if (form.marker) form.marker.setIcon(pinIcon(p, { draft: true })); }
  else refreshMarker(form.f.properties.id, p);
};

MyPins.openForm = async function (f, ll) {
  if (MyPins.form) {
    if (f && MyPins.form.f === f) return;
    if (!(await Panel.requestClose())) return;
  }
  const cats = catsOfKind('spot');
  if (!cats.length) return;
  const isNew = !f;
  const cat = isNew ? (cats.some(c => c.id === MyPins.lastCat) ? MyPins.lastCat : cats[0].id) : (cats.some(c => c.id === f.properties.category) ? f.properties.category : cats[0].id);
  const form = {
    f: f || null, isNew, id: isNew ? MyPins.newId() : f.properties.id, cat, dirty: false, marker: null,
    coords: isNew ? [+ll.lng.toFixed(6), +ll.lat.toFixed(6)] : f.geometry.coordinates.slice(),
    vals: isNew ? { name: '', comment: '', author: MyPins.lastNick || '' }
      : { name: pick(f.properties, 'name'), comment: pick(f.properties, 'desc'), author: f.properties.author || '' }
  };
  form.w = mineProps(form);                                   // 地図の描画が参照する（編集中のピン）
  MyPins.form = form;
  if (isNew) {
    form.marker = L.marker([form.coords[1], form.coords[0]], { icon: pinIcon(form.w, { draft: true }), draggable: true, zIndexOffset: 1000, keyboard: false }).addTo(map);
    form.marker.on('drag', e => {
      const p = e.target.getLatLng();
      form.coords = [+p.lng.toFixed(6), +p.lat.toFixed(6)];
      MyPins.updateFormCoords();
    });
    form.marker.on('dragend', () => { form.dirty = true; });
  } else {
    setSelected(f.properties.id);
    renderHazards();
  }
  Panel.open({
    id: 'mine-form', title: t(isNew ? 'mineTitleNew' : 'mineTitleEdit'), icon: 'pin', modal: false,
    render: renderMineForm,
    canClose: async () => !MyPins.form || !MyPins.form.dirty || await confirmBox(t('discardAsk'), t('discardMsg'), t('discard'), true, t('keepEditing')),
    onClose() {
      const fm = MyPins.form;
      MyPins.form = null;
      if (fm && fm.marker) fm.marker.remove();
      setSelected(null);
      renderHazards();
    }
  });
  if (!isWide()) focusLatLng([form.coords[1], form.coords[0]], Math.max(map.getZoom(), isNew ? 17 : 16));
};

function renderMineForm(body, foot) {
  const form = MyPins.form, v = form.vals;
  const chips = catsOfKind('spot').map(c => {
    const col = safeColor(c.color);
    return '<button type="button" class="pick" data-cat="' + esc(c.id) + '" role="radio" aria-checked="' + (c.id === form.cat) + '" style="--cc:' + col + ';--ct:' + textOn(col) + '">' +
      '<span class="pick-ic">' + ic(GLYPHS[c.icon] ? c.icon : 'star', 15) + '</span>' + esc(c[lang] || c.ja) + '</button>';
  }).join('');
  body.innerHTML =
    '<div class="note note-info">' + ic('user', 15) + '<span>' + esc(t('mineIntro')) + '</span></div>' +
    '<div class="loc-card"><span class="loc-ic">' + ic('pin', 18) + '</span><div><small>' + esc(t('fPos')) + '</small><b class="mono" id="mf-coord"></b></div>' +
    '<span class="loc-hint">' + ic('tap', 14) + esc(t('fDrag')) + '</span></div>' +
    '<div class="fld-label">' + esc(t('fType')) + '</div><div class="picks" role="radiogroup">' + chips + '</div>' +
    '<label class="fld"><span>' + esc(t('fName')) + '</span><input class="input" data-k="name" maxlength="60" value="' + esc(v.name) + '" placeholder="' + esc(t('fNamePh')) + '" autocomplete="off"></label>' +
    '<label class="fld"><span>' + esc(t('fComment')) + '</span><textarea class="input textarea" data-k="comment" rows="3" maxlength="400" placeholder="' + esc(t('fCommentPh')) + '">' + esc(v.comment) + '</textarea></label>' +
    '<label class="fld"><span>' + esc(t('fNick')) + '</span><input class="input" data-k="author" maxlength="30" value="' + esc(v.author) + '" autocomplete="off"></label>' +
    '<p class="form-err" id="mf-err" role="alert" hidden></p>';
  foot.innerHTML = (form.isNew ? '' : '<button type="button" class="btn btn-md btn-danger-ghost" id="mf-del">' + ic('trash', 16) + '</button>') +
    '<button type="button" class="btn btn-md" id="mf-cancel">' + esc(t('btnCancel')) + '</button>' +
    '<button type="button" class="btn btn-md btn-primary grow" id="mf-save">' + esc(t('btnSave')) + '</button>';
  MyPins.updateFormCoords();

  body.addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.k;
    if (!k) return;
    v[k] = e.target.value; form.dirty = true;
    $('#mf-err', body).hidden = true;
    if (k === 'name' || k === 'comment') MyPins.previewForm();
  });
  $$('.pick', body).forEach(b => b.addEventListener('click', () => {
    form.cat = b.dataset.cat; form.dirty = true;
    $$('.pick', body).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    MyPins.previewForm();
  }));
  $('#mf-cancel', foot).onclick = () => Panel.requestClose();
  $('#mf-save', foot).onclick = MyPins.saveForm;
  const del = $('#mf-del', foot);
  if (del) del.onclick = () => MyPins.remove(form.f);
}

MyPins.saveForm = function () {
  const form = MyPins.form;
  if (!form) return;
  const v = form.vals, name = (v.name || '').trim();
  if (!name) {
    const err = $('#mf-err');
    err.textContent = t('needName'); err.hidden = false;
    const i = $('#panel [data-k="name"]'); if (i) i.focus();
    return;
  }
  const props = Object.assign({}, form.isNew ? {} : form.f.properties, {
    id: form.id, category: form.cat, name_ja: '', name_en: '', desc_ja: '', desc_en: '', photo: '',
    author: (v.author || '').trim(), updated_at: today(), mine: true, dummy: false, lang: lang
  });
  props['name_' + lang] = name;
  props['desc_' + lang] = (v.comment || '').trim();
  let feat = form.f;
  if (form.isNew) {
    feat = { type: 'Feature', geometry: { type: 'Point', coordinates: form.coords }, properties: props };
    MyPins.features.push(feat);
  } else {
    feat.properties = props; feat.geometry.coordinates = form.coords;
  }
  MyPins.lastCat = form.cat; MyPins.lastNick = props.author;
  MyPins.save();
  form.dirty = false;
  Panel.close();
  toast(t('mineSaved'), { action: { label: t('btnSend'), fn: () => MyPins.send([feat]) }, ms: 7000 });
};

MyPins.remove = async function (f) {
  if (!(await confirmBox(t('mineDelAsk'), '', t('delete'), true, t('btnCancel')))) return;
  if (MyPins.form) MyPins.form.dirty = false;
  MyPins.features = MyPins.features.filter(x => x !== f);
  MyPins.save();
  if (Panel.current && ['detail', 'mine-form'].includes(Panel.current.id)) Panel.close();
  renderHazards();
  if (Panel.isOpen('info') || Panel.isOpen('list')) Panel.refresh();
  toast(t('mineDeleted'));
};
MyPins.clearAll = async function () {
  if (!(await confirmBox(t('mineClearAsk'), '', t('delete'), true, t('btnCancel')))) return;
  MyPins.features = [];
  MyPins.save();
  renderHazards();
  if (Panel.isOpen('info') || Panel.isOpen('list')) Panel.refresh();
  toast(t('mineDeleted'));
};

// ---- 運営に送る ----
function mineClean(f) {                                      // 送るデータから、端末だけの印を外す
  const p = Object.assign({}, f.properties);
  delete p.mine; delete p.dummy; delete p.sentAt;
  return { type: 'Feature', geometry: f.geometry, properties: p };
}
MyPins.buildMessage = function (feats) {
  const lines = [t('sendHeader'), ''];
  feats.forEach((f, i) => {
    const p = f.properties, lng = f.geometry.coordinates[0], lat = f.geometry.coordinates[1];
    const pre = feats.length > 1 ? (i + 1) + '. ' : '';
    lines.push(pre + t('sendName') + ': ' + pick(p, 'name'));
    lines.push(t('sendPlace') + ': ' + lat.toFixed(5) + ', ' + lng.toFixed(5) + '  https://maps.gsi.go.jp/#17/' + lat.toFixed(5) + '/' + lng.toFixed(5) + '/');
    if (pick(p, 'desc')) lines.push(t('sendNote') + ': ' + pick(p, 'desc'));
    if (p.author) lines.push(t('sendNick') + ': ' + p.author);
    lines.push('');
  });
  lines.push('--- ' + t('sendData') + ' ---');
  lines.push('HAZMAP1:' + JSON.stringify({ type: 'FeatureCollection', features: feats.map(mineClean) }));
  return lines.join('\n');
};
MyPins.send = async function (feats) {
  if (!feats || !feats.length) return;
  const text = MyPins.buildMessage(feats);
  const canShare = !!navigator.share, direct = !!CONFIG.submitUrl;       // submitUrl があれば、アプリから直接送れる
  const buttons = [{ label: t('btnCancel'), value: null }];
  if (direct) {
    buttons.push({ label: t('sendCopy'), value: 'copy' });
    buttons.push({ label: t('sendNow'), value: 'post', variant: 'primary' });
  } else {
    if (CONFIG.contactEmail) buttons.push({ label: t('sendMail'), value: 'mail' });
    buttons.push({ label: t('sendCopy'), value: 'copy', variant: canShare ? '' : 'primary' });
    if (canShare) buttons.push({ label: t('sendShare'), value: 'share', variant: 'primary' });
  }
  const v = await dialog({ title: t('sendTitle'), message: t(direct ? 'sendMsgDirect' : 'sendMsg'), buttons });
  if (v === 'post') {
    const sending = toast(t('sendSending'), { ms: 20000 });
    try {
      await Sheet.submit(feats);
      feats.forEach(f => { f.properties.sentAt = nowISO(); });
      MyPins.save();
      sending.dismiss();
      toast(t('sendOk'), { ms: 8000 });
      if (Panel.isOpen('detail') || Panel.isOpen('info')) Panel.refresh();
    } catch (e) {
      console.warn(e);
      sending.dismiss();
      toast(t('sendFail'), { tone: 'warn', ms: 9000 });
    }
  }
  else if (v === 'copy') copyText(text, t('sendCopied'));
  else if (v === 'mail') location.href = 'mailto:' + CONFIG.contactEmail + '?subject=' + encodeURIComponent(t('sendHeader')) + '&body=' + encodeURIComponent(text);
  else if (v === 'share') {
    try { await navigator.share({ title: t('sendHeader'), text: text }); }
    catch (e) { if (!e || e.name !== 'AbortError') copyText(text, t('sendCopied')); }
  }
};
MyPins.exportFile = function () {
  downloadText('my-pins.geojson', JSON.stringify({ type: 'FeatureCollection', features: MyPins.features.map(mineClean) }, null, 2));
};
