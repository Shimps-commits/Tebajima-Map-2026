// 編集モード（?edit=1）。編集内容はこのブラウザのlocalStorageにのみ自動保存する。
// 公開データへの反映は「書き出し」→ GitHub上のファイル置換で行う。
const LS_KEY = 'hazmap_edit_v1';
let addMode = false;

function today() { return new Date().toISOString().slice(0, 10); }

function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if (s && s.hazards && s.hazards.features && s.cats && s.cats.categories) return s;
  } catch (e) { /* 保存データなし・使用不可 */ }
  return null;
}

function setSaveStatus(msg, bad) {
  const el = document.getElementById('save-status');
  if (el) { el.textContent = msg; el.classList.toggle('bad', !!bad); }
}

function saveState() {
  if (!EDIT) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ hazards: hazardData, cats: CATS, savedAt: new Date().toISOString() }));
    setSaveStatus('このブラウザに自動保存済み ' + new Date().toLocaleTimeString('ja-JP'));
  } catch (e) {
    setSaveStatus('自動保存できません。こまめに「書き出し」してください', true);
  }
}

// ---- モーダル ----
function openModal(html) {
  let m = document.getElementById('modal');
  if (!m) { m = document.createElement('div'); m.id = 'modal'; document.body.appendChild(m); }
  m.innerHTML = `<div class="modal-box">${html}</div>`;
  m.hidden = false;
  return m;
}
function closeModal() { const m = document.getElementById('modal'); if (m) m.hidden = true; }

// ---- ピンの編集フォーム ----
function newHazard(lng, lat) {
  const s = CATS.severities[0] || { level: 1, warn_radius_m: 20 };
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [+lng.toFixed(6), +lat.toFixed(6)] },
    properties: { id: 'h' + Date.now().toString(36), dummy: false, category: (CATS.categories[0] || {}).id || '', severity: s.level,
      name_ja: '', name_en: '', desc_ja: '', desc_en: '', action_ja: '', action_en: '', photo: '',
      warn_radius_m: s.warn_radius_m || 0, updated_at: today() } };
}

function openHazardForm(f, isNew) {
  const p = f.properties;
  const inp = (k, label, tag) => tag === 'ta'
    ? `<label>${label}<textarea data-k="${k}" rows="3">${esc(p[k])}</textarea></label>`
    : `<label>${label}<input data-k="${k}" value="${esc(p[k])}"></label>`;
  const m = openModal(`
    <h2>${isNew ? '新しい危険個所' : '危険個所を編集'}</h2>
    <label class="chk"><input type="checkbox" data-k="dummy" ${p.dummy ? 'checked' : ''}> サンプル（ダミー）として表示する</label>
    <label>種別<select data-k="category">${CATS.categories.map(c => `<option value="${esc(c.id)}" ${c.id === p.category ? 'selected' : ''}>${esc(c.icon)} ${esc(c.ja)} / ${esc(c.en)}</option>`).join('')}</select></label>
    <label>危険度<select data-k="severity">${CATS.severities.map(s => `<option value="${esc(s.level)}" ${Number(s.level) === Number(p.severity) ? 'selected' : ''}>${esc(s.mark)} ${esc(s.ja)} / ${esc(s.en)}</option>`).join('')}</select></label>
    ${inp('name_ja', '名称（日本語）')}${inp('name_en', 'Name (English)')}
    ${inp('desc_ja', '説明（日本語）', 'ta')}${inp('desc_en', 'Description (English)', 'ta')}
    ${inp('action_ja', '対処法（日本語）', 'ta')}${inp('action_en', 'What to do (English)', 'ta')}
    ${inp('photo', '写真のファイルパス（任意。例: photos/h001.jpg）')}
    <label>警告半径（m・第2段階の接近アラート用）<input data-k="warn_radius_m" type="number" min="0" value="${esc(p.warn_radius_m)}"></label>
    <p class="coord">位置: ${esc(f.geometry.coordinates[1])}, ${esc(f.geometry.coordinates[0])}（地図上でピンをドラッグして調整）</p>
    <div class="btns">
      <button id="f-save" class="primary">保存</button>
      <button id="f-cancel">キャンセル</button>
      ${isNew ? '' : '<button id="f-del" class="danger">削除</button>'}
    </div>`);
  m.querySelector('#f-cancel').onclick = () => {
    if (isNew) { hazardData.features = hazardData.features.filter(x => x !== f); renderHazards(); }
    closeModal();
  };
  m.querySelector('#f-save').onclick = () => {
    m.querySelectorAll('[data-k]').forEach(el => {
      const k = el.dataset.k;
      p[k] = el.type === 'checkbox' ? el.checked : (k === 'severity' || k === 'warn_radius_m') ? Number(el.value) || 0 : el.value.trim();
    });
    p.updated_at = today();
    closeModal(); saveState(); renderHazards();
  };
  const del = m.querySelector('#f-del');
  if (del) del.onclick = () => {
    if (!confirm('この危険個所を削除します。よろしいですか？')) return;
    hazardData.features = hazardData.features.filter(x => x !== f);
    closeModal(); saveState(); renderHazards();
  };
}

// ---- ツールバー ----
function initEditMode() {
  document.body.classList.add('edit');
  const bar = document.createElement('section');
  bar.id = 'edit-bar';
  bar.innerHTML = `
    <p class="edit-note"><b>編集モード</b>：これは本物の認証ではありません。URLを知っている人は誰でもこの画面を開けます。
    編集内容はこのブラウザ内にだけ自動保存され、公開データには反映されません。反映するには「書き出し」したファイルをGitHubで置き換えてください。</p>
    <div class="edit-btns">
      <button id="e-add" class="primary">＋ ピンを追加</button>
      <button id="e-cats">種別・危険度の編集</button>
      <button id="e-export">書き出し</button>
      <button id="e-import">読み込み</button>
      <button id="e-reset" class="danger">編集内容を破棄</button>
    </div>
    <p id="save-status" role="status"></p>`;
  document.getElementById('notice').after(bar);

  document.getElementById('e-add').onclick = () => {
    addMode = !addMode;
    document.getElementById('e-add').textContent = addMode ? '地図をタップして位置を指定…（取消）' : '＋ ピンを追加';
    document.getElementById('map').classList.toggle('adding', addMode);
  };
  map.on('click', e => {
    if (!addMode) return;
    addMode = false;
    document.getElementById('map').classList.remove('adding');
    document.getElementById('e-add').textContent = '＋ ピンを追加';
    const f = newHazard(e.latlng.lng, e.latlng.lat);
    hazardData.features.push(f);
    renderHazards();
    openHazardForm(f, true);
  });
  document.getElementById('e-cats').onclick = openCategoryEditor;
  document.getElementById('e-export').onclick = exportAll;
  document.getElementById('e-import').onclick = importFiles;
  document.getElementById('e-reset').onclick = () => {
    if (!confirm('このブラウザに保存した編集内容を破棄し、公開中のデータに戻します。よろしいですか？\n（先に「書き出し」で保存しておくことをおすすめします）')) return;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    location.reload();
  };
  setSaveStatus(loadSaved() ? 'このブラウザに保存済みの編集内容を表示しています' : '公開中のデータを表示しています（変更すると自動保存されます）');
}
