// 種別・危険度の定義エディタ（追加・変更・色変更・削除）。使用中の定義は削除できない。
let draft = null;

function draftKey() { return JSON.stringify({ c: draft.categories, s: draft.severities }); }

function openCategoryEditor() {
  draft = JSON.parse(JSON.stringify({ categories: CATS.categories, severities: CATS.severities }));
  const original = draftKey();
  Panel.open({
    id: 'cats', title: '種別・危険度の編集', icon: 'tag', modal: true,
    render: renderCats,
    canClose: async () => !draft || draftKey() === original || await confirmBox('変更を破棄しますか？', '保存していない変更は失われます。', '破棄する', true, '編集を続ける'),
    onClose() { draft = null; }
  });
}

function catRowHTML(c, i) {
  const col = safeColor(c.color);
  const glyphBtns = Object.keys(GLYPHS).map(k => '<button type="button" class="gbtn" data-glyph="' + k + '" title="' + esc(GLYPH_LABELS[k] || k) + '" aria-pressed="' + (c.icon === k) + '">' + ic(k, 20) + '</button>').join('');
  return '<div class="edrow" data-kind="categories" data-i="' + i + '">' +
    '<button type="button" class="ed-prev" data-act="icons" aria-label="アイコンを選ぶ">' + pinHtmlRaw(c, { level: 1, mark: '!', color: '#111827' }, false, { size: 40, badge: false }) + '</button>' +
    '<div class="ed-fields"><input class="input" data-f="ja" value="' + esc(c.ja) + '" placeholder="日本語の名称"><input class="input" data-f="en" value="' + esc(c.en) + '" placeholder="English name"></div>' +
    '<div class="ed-side"><label class="ed-color" title="色"><input type="color" data-f="color" value="' + col + '" aria-label="色"></label>' +
    '<button type="button" class="btn-icon btn-danger-ghost" data-act="del" aria-label="削除">' + ic('trash', 17) + '</button></div>' +
    '<div class="ed-icons" hidden><div class="gbtns">' + glyphBtns + '</div><label class="fld"><span>または、絵文字・文字</span><input class="input" data-f="icon" value="' + (GLYPHS[c.icon] ? '' : esc(c.icon)) + '" maxlength="2" placeholder="例：🚧"></label></div></div>';
}

function sevRowHTML(s, i) {
  const col = safeColor(s.color, '#111827');
  return '<div class="edrow sev" data-kind="severities" data-i="' + i + '">' +
    '<span class="ed-mark" style="background:' + col + ';color:' + textOn(col) + '">' + sevShapeSvg(s.level, 12) + '</span>' +
    '<input class="input w-mark" data-f="mark" value="' + esc(s.mark) + '" maxlength="5" aria-label="記号">' +
    '<div class="ed-fields"><input class="input" data-f="ja" value="' + esc(s.ja) + '" placeholder="日本語"><input class="input" data-f="en" value="' + esc(s.en) + '" placeholder="English"></div>' +
    '<div class="ed-side"><label class="ed-color" title="色"><input type="color" data-f="color" value="' + col + '" aria-label="色"></label>' +
    '<button type="button" class="btn-icon btn-danger-ghost" data-act="del" aria-label="削除">' + ic('trash', 17) + '</button></div>' +
    '<label class="ed-radius">警告半径（m）<input class="input" type="number" min="0" data-f="warn_radius_m" value="' + esc(s.warn_radius_m) + '"></label></div>';
}

function renderCats(body, foot) {
  body.innerHTML =
    '<p class="muted small">種別と危険度は、あとからいつでも変えられます。使われている項目は、削除できません。</p>' +
    '<h3 class="sec">種別（アイコン・名称・色）</h3><div class="edlist">' + draft.categories.map(catRowHTML).join('') + '</div>' +
    '<button type="button" class="btn btn-md btn-block btn-dashed" id="c-addcat">' + ic('plus', 16) + '種別を追加</button>' +
    '<h3 class="sec">危険度（記号・名称・色）</h3>' +
    '<p class="muted small">危険度は、形（丸・ひし形・八角形）と「!」の数でも区別されます。4段階目以降は、3段階目と同じ形になります。</p>' +
    '<div class="edlist">' + draft.severities.map(sevRowHTML).join('') + '</div>' +
    '<button type="button" class="btn btn-md btn-block btn-dashed" id="c-addsev">' + ic('plus', 16) + '危険度を追加</button>';
  foot.innerHTML = '<button type="button" class="btn btn-md" id="c-cancel">キャンセル</button><button type="button" class="btn btn-md btn-primary grow" id="c-save">保存</button>';

  const objOf = row => draft[row.dataset.kind][Number(row.dataset.i)];
  const updatePreview = row => {
    if (row.dataset.kind !== 'categories') {
      const s = objOf(row), m = $('.ed-mark', row), col = safeColor(s.color, '#111827');
      m.style.background = col; m.style.color = textOn(col);
      return;
    }
    $('.ed-prev', row).innerHTML = pinHtmlRaw(objOf(row), { level: 1, mark: '!', color: '#111827' }, false, { size: 40, badge: false });
  };

  body.addEventListener('input', e => {
    const row = e.target.closest('.edrow'), f = e.target.dataset && e.target.dataset.f;
    if (!row || !f) return;
    const o = objOf(row);
    o[f] = e.target.type === 'number' ? (Number(e.target.value) || 0) : e.target.value;
    if (f === 'icon' && !e.target.value) o.icon = 'alert';
    if (f === 'icon') $$('.gbtn', row).forEach(b => b.setAttribute('aria-pressed', 'false'));
    if (f === 'color' || f === 'icon') updatePreview(row);
  });
  body.addEventListener('click', e => {
    const row = e.target.closest('.edrow');
    if (!row) return;
    const g = e.target.closest('[data-glyph]');
    if (g) {
      objOf(row).icon = g.dataset.glyph;
      $$('.gbtn', row).forEach(b => b.setAttribute('aria-pressed', String(b === g)));
      $('[data-f="icon"]', row).value = '';
      updatePreview(row);
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'icons') { const p = $('.ed-icons', row); p.hidden = !p.hidden; return; }
    if (act.dataset.act === 'del') {
      const kind = row.dataset.kind, o = objOf(row);
      const used = hazardData.features.filter(f => kind === 'categories' ? f.properties.category === o.id : Number(f.properties.severity) === Number(o.level)).length;
      if (used) { noticeBox('削除できません', 'この定義は ' + used + ' 件の危険個所で使われています。先に、危険個所側の種別・危険度を変更してください。'); return; }
      if (draft[kind].length <= 1) { noticeBox('削除できません', '最低1つは必要です。'); return; }
      draft[kind].splice(Number(row.dataset.i), 1);
      Panel.refresh();
    }
  });
  $('#c-addcat', body).onclick = () => {
    draft.categories.push({ id: 'c' + Date.now().toString(36), ja: '新しい種別', en: 'New type', color: '#475569', icon: 'alert' });
    Panel.refresh();
    const rows = $$('.edrow[data-kind="categories"]', Panel.el); const last = rows[rows.length - 1];
    if (last) last.scrollIntoView({ block: 'center' });
  };
  $('#c-addsev', body).onclick = () => {
    const lv = Math.max(0, ...draft.severities.map(s => Number(s.level))) + 1;
    draft.severities.push({ level: lv, ja: '新しい危険度', en: 'New level', mark: '!'.repeat(Math.min(lv, 5)), color: '#dc2626', warn_radius_m: 50 });
    Panel.refresh();
  };
  $('#c-cancel', foot).onclick = () => Panel.requestClose();
  $('#c-save', foot).onclick = saveCats;
}

function saveCats() {
  const clean = o => { const c = Object.assign({}, o); if (!c.ja) c.ja = c.en; if (!c.en) c.en = c.ja; return c; };
  if (draft.categories.some(c => !(c.ja || c.en)) || draft.severities.some(s => !(s.ja || s.en))) {
    noticeBox('名称が空の項目があります', '日本語または English のどちらかを入力してください。');
    return;
  }
  if (draft.severities.some(s => !String(s.mark || '').trim())) { noticeBox('記号が空の危険度があります', '「!」などの記号を入力してください。'); return; }
  const cats = draft.categories.map(clean);
  const sevs = draft.severities.map(clean).sort((a, b) => Number(a.level) - Number(b.level));
  Edit.mutate(() => { CATS.categories = cats; CATS.severities = sevs; });
  draft = null;
  Panel.close();
  toast('種別・危険度を保存しました');
}
