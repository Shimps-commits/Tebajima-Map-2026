// 一覧パネルとCSV書き出し（出発前の確認・補助金の報告資料用）
let listKind = 'all';                       // 一覧のタブ：all | hazard | spot

// 危険個所は危険度の高い順、そのあとに見どころ。kind を渡すと、その種類だけ
function sortedHazards(kind) {
  const feats = hazardData.features.concat(EDIT || typeof MyPins === 'undefined' ? [] : MyPins.features);
  const hz = feats.filter(f => kindOf(f.properties) === 'hazard').sort((a, b) =>
    Number(b.properties.severity) - Number(a.properties.severity) ||
    String(a.properties.category).localeCompare(String(b.properties.category)));
  const sp = feats.filter(f => kindOf(f.properties) === 'spot').sort((a, b) =>
    String(a.properties.category).localeCompare(String(b.properties.category)));
  return kind === 'hazard' ? hz : kind === 'spot' ? sp : hz.concat(sp);
}

// 一覧の1行（編集メニューでも使う）
function hazardRowHTML(f) {
  const p = f.properties, c = catOf(p.category), spot = kindOfCat(c) === 'spot';
  const name = pick(p, 'name') || p.name_ja || p.name_en || '（名称なし）';
  const text = [p.name_ja, p.name_en, p.desc_ja, p.desc_en, p.author].join(' ').toLowerCase();
  const sub = spot
    ? '<span class="sevdot spotdot" style="background:' + safeColor(c.color) + '"></span>' + esc(c[lang] || c.ja) + (p.author ? ' · ' + esc(p.author) : '')
    : '<span class="sevdot" style="background:' + safeColor(sevOf(p.severity).color, '#111827') + '"></span>' + esc(sevOf(p.severity).mark) + ' ' + esc(sevOf(p.severity)[lang] || sevOf(p.severity).ja) + ' · ' + esc(c[lang] || c.ja);
  return '<button type="button" class="row" data-id="' + esc(p.id) + '" data-text="' + esc(text) + '">' +
    '<span class="row-pin' + (spot ? ' spot' : '') + '">' + pinHtml(p, { size: 40, badge: false }) + '</span>' +
    '<span class="row-main"><span class="row-name">' + (p.dummy ? sampleChip() : '') + sourceChip(p) + '<b>' + esc(name) + '</b></span>' +
    '<span class="row-sub">' + sub + '</span></span>' +
    '<span class="row-chev">' + ic('chevR', 16) + '</span></button>';
}
function wireRows(root, onPick) {
  $$('.row', root).forEach(b => b.addEventListener('click', () => {
    const f = allFeatures().find(x => x.properties.id === b.dataset.id) || hazardData.features.find(x => x.properties.id === b.dataset.id);
    if (f) onPick(f);
  }));
}

function openList() {
  Panel.open({
    id: 'list', title: t('listTitle'), icon: 'list',
    render(body, foot) {
      const all = sortedHazards('all');
      const nH = all.filter(f => kindOf(f.properties) === 'hazard').length, nS = all.length - nH;
      const fs = sortedHazards(listKind);
      const stats = listKind === 'spot' ? '' : '<div class="stats">' + CATS.severities.slice().sort((a, b) => b.level - a.level).map(s => {
        const n = fs.filter(f => kindOf(f.properties) === 'hazard' && Number(f.properties.severity) === Number(s.level)).length;
        return '<span class="stat"><span class="sevdot" style="background:' + safeColor(s.color, '#111827') + '"></span>' + esc(s[lang] || s.ja) + ' <b>' + n + '</b></span>';
      }).join('') + '</div>';
      const tab = (k, label, n) => '<button type="button" data-v="' + k + '" aria-pressed="' + (listKind === k) + '">' + esc(label) + ' <b>' + n + '</b></button>';
      body.innerHTML =
        '<div class="seg seg-md" id="l-tabs">' + tab('all', t('tabAll'), nH + nS) + tab('hazard', t('kindHazard'), nH) + tab('spot', t('kindSpot'), nS) + '</div>' +
        '<div class="searchbox">' + ic('search', 17) + '<input type="search" id="l-q" class="input" placeholder="' + esc(t('listSearch')) + '" autocomplete="off"></div>' +
        stats +
        '<div class="rows" id="l-rows">' + fs.map(hazardRowHTML).join('') + '</div>' +
        '<p class="empty" id="l-empty" hidden>' + esc(t('noMatch')) + '</p>';
      foot.innerHTML = '<span class="foot-count" id="l-count"></span><button type="button" class="btn btn-md btn-primary" id="l-csv">' + ic('download', 16) + esc(t('csv')) + '</button>';
      const rows = $$('.row', body), cnt = $('#l-count', foot);
      const sync = n => { cnt.textContent = t('items', { n: n }); $('#l-empty', body).hidden = n !== 0; };
      sync(rows.length);
      $$('#l-tabs button', body).forEach(b => b.addEventListener('click', () => { listKind = b.dataset.v; Panel.refresh(); }));
      $('#l-q', body).addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase();
        let n = 0;
        rows.forEach(r => { const show = !q || r.dataset.text.indexOf(q) >= 0; r.hidden = !show; if (show) n++; });
        sync(n);
      });
      wireRows(body, f => selectHazard(f));
      $('#l-csv', foot).onclick = exportCSV;
    }
  });
}

function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;      // 表計算ソフトでの式実行を防ぐ
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// 公式データ（マイピンは含めない）を、種類つきで書き出す
function exportCSV() {
  const head = ['id', 'kind', 'sample', 'name_ja', 'name_en', 'category_ja', 'category_en', 'severity', 'severity_ja', 'severity_en',
    'desc_ja', 'desc_en', 'action_ja', 'action_en', 'author', 'source', 'lat', 'lng', 'warn_radius_m', 'updated_at'];
  const lines = [head.join(',')];
  const feats = hazardData.features.slice().sort((a, b) => (kindOf(a.properties) === 'hazard' ? 0 : 1) - (kindOf(b.properties) === 'hazard' ? 0 : 1) ||
    Number(b.properties.severity || 0) - Number(a.properties.severity || 0));
  feats.forEach(f => {
    const p = f.properties, c = catOf(p.category), spot = kindOfCat(c) === 'spot', s = spot ? null : sevOf(p.severity);
    lines.push([p.id, spot ? 'spot' : 'hazard', p.dummy ? 'yes' : '', p.name_ja, p.name_en, c.ja, c.en, spot ? '' : p.severity, s ? s.ja : '', s ? s.en : '',
      p.desc_ja, p.desc_en, p.action_ja, p.action_en, p.author, p.source, f.geometry.coordinates[1], f.geometry.coordinates[0],
      spot ? '' : p.warn_radius_m, p.updated_at].map(csvCell).join(','));
  });
  downloadText('hazards.csv', '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');   // BOM付きでExcelの文字化けを防ぐ
}
