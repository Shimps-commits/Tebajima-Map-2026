// 種別・危険度の定義エディタ（追加・変更・色変更・削除）。使用中の定義は削除できない。
let draft = null;

function collectDraft() {
  const m = document.getElementById('modal');
  m.querySelectorAll('[data-row]').forEach(row => {
    const [kind, i] = row.dataset.row.split(':');
    const obj = draft[kind][Number(i)];
    row.querySelectorAll('[data-f]').forEach(el => {
      obj[el.dataset.f] = el.type === 'number' ? Number(el.value) || 0 : el.value.trim();
    });
  });
}

function renderCategoryEditor() {
  const row = (kind, o, i) => {
    const id = kind === 'categories' ? o.id : o.level;
    const fields = kind === 'categories'
      ? `<input data-f="icon" value="${esc(o.icon)}" class="w-icon" aria-label="アイコン">
         <input data-f="ja" value="${esc(o.ja)}" placeholder="日本語" aria-label="日本語">
         <input data-f="en" value="${esc(o.en)}" placeholder="English" aria-label="English">
         <input data-f="color" type="color" value="${esc(o.color)}" aria-label="色">`
      : `<input data-f="mark" value="${esc(o.mark)}" class="w-icon" aria-label="記号">
         <input data-f="ja" value="${esc(o.ja)}" placeholder="日本語" aria-label="日本語">
         <input data-f="en" value="${esc(o.en)}" placeholder="English" aria-label="English">
         <input data-f="color" type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(o.color || '') ? o.color : '#000000')}" aria-label="色">
         <input data-f="warn_radius_m" type="number" min="0" value="${esc(o.warn_radius_m)}" class="w-num" aria-label="警告半径m" title="警告半径(m)">`;
    return `<div class="crow" data-row="${kind}:${i}">${fields}<button data-del="${kind}:${i}" class="danger" aria-label="削除">✕</button></div>`;
  };
  const m = openModal(`
    <h2>種別・危険度の編集</h2>
    <h3>種別（アイコン・名称・色）</h3>
    ${draft.categories.map((o, i) => row('categories', o, i)).join('')}
    <button id="c-addcat">＋ 種別を追加</button>
    <h3>危険度（記号・名称・色・警告半径m）</h3>
    <p class="hint">危険度は形（丸・ひし形・八角形）と「!」の数でも区別されます。4段階目以降は3段階目と同じ形になります。</p>
    ${draft.severities.map((o, i) => row('severities', o, i)).join('')}
    <button id="c-addsev">＋ 危険度を追加</button>
    <div class="btns"><button id="c-save" class="primary">保存</button><button id="c-cancel">キャンセル</button></div>`);

  m.querySelector('#c-cancel').onclick = closeModal;
  m.querySelector('#c-addcat').onclick = () => {
    collectDraft();
    draft.categories.push({ id: 'c' + Date.now().toString(36), ja: '新しい種別', en: 'New type', color: '#555555', icon: '❗' });
    renderCategoryEditor();
  };
  m.querySelector('#c-addsev').onclick = () => {
    collectDraft();
    const lv = Math.max(0, ...draft.severities.map(s => s.level)) + 1;
    draft.severities.push({ level: lv, ja: '新しい危険度', en: 'New level', mark: '!'.repeat(Math.min(lv, 5)), color: '#dc2626', warn_radius_m: 50 });
    renderCategoryEditor();
  };
  m.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    collectDraft();
    const [kind, i] = b.dataset.del.split(':');
    const o = draft[kind][Number(i)];
    const used = hazardData.features.filter(f => kind === 'categories' ? f.properties.category === o.id : Number(f.properties.severity) === o.level).length;
    if (used) return alert(`この定義は ${used} 件の危険個所で使われているため削除できません。先に危険個所側を変更してください。`);
    if (draft[kind].length <= 1) return alert('最低1つは必要です。');
    draft[kind].splice(Number(i), 1);
    renderCategoryEditor();
  });
  m.querySelector('#c-save').onclick = () => {
    collectDraft();
    CATS.categories = draft.categories;
    CATS.severities = draft.severities.sort((a, b) => a.level - b.level);
    closeModal(); saveState(); renderHazards(); buildFilterPanel();
  };
}

function openCategoryEditor() {
  draft = JSON.parse(JSON.stringify({ categories: CATS.categories, severities: CATS.severities }));
  renderCategoryEditor();
}
