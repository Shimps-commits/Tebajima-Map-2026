// 一覧パネルとCSV書き出し（出発前の確認・補助金の報告資料用）
function sortedHazards() {
  return hazardData.features.slice().sort((a, b) =>
    Number(b.properties.severity) - Number(a.properties.severity) ||
    String(a.properties.category).localeCompare(String(b.properties.category)));
}

// 一覧の1行（編集メニューでも使う）
function hazardRowHTML(f) {
  const p = f.properties, c = catOf(p.category), s = sevOf(p.severity);
  const name = pick(p, 'name') || p.name_ja || p.name_en || '（名称なし）';
  const text = [p.name_ja, p.name_en, p.desc_ja, p.desc_en].join(' ').toLowerCase();
  return '<button type="button" class="row" data-id="' + esc(p.id) + '" data-text="' + esc(text) + '">' +
    '<span class="row-pin">' + pinHtml(p, { size: 40, badge: false }) + '</span>' +
    '<span class="row-main"><span class="row-name">' + (p.dummy ? sampleChip() : '') + '<b>' + esc(name) + '</b></span>' +
    '<span class="row-sub"><span class="sevdot" style="background:' + safeColor(s.color, '#111827') + '"></span>' + esc(s.mark) + ' ' + esc(s[lang] || s.ja) + ' · ' + esc(c[lang] || c.ja) + '</span></span>' +
    '<span class="row-chev">' + ic('chevR', 16) + '</span></button>';
}
function wireRows(root, onPick) {
  $$('.row', root).forEach(b => b.addEventListener('click', () => {
    const f = hazardData.features.find(x => x.properties.id === b.dataset.id);
    if (f) onPick(f);
  }));
}

function openList() {
  Panel.open({
    id: 'list', title: t('listTitle'), icon: 'list',
    render(body, foot) {
      const fs = sortedHazards();
      const stats = CATS.severities.slice().sort((a, b) => b.level - a.level).map(s => {
        const n = fs.filter(f => Number(f.properties.severity) === Number(s.level)).length;
        return '<span class="stat"><span class="sevdot" style="background:' + safeColor(s.color, '#111827') + '"></span>' + esc(s[lang] || s.ja) + ' <b>' + n + '</b></span>';
      }).join('');
      body.innerHTML =
        '<div class="searchbox">' + ic('search', 17) + '<input type="search" id="l-q" class="input" placeholder="' + esc(t('listSearch')) + '" autocomplete="off"></div>' +
        '<div class="stats">' + stats + '</div>' +
        '<div class="rows" id="l-rows">' + fs.map(hazardRowHTML).join('') + '</div>' +
        '<p class="empty" id="l-empty" hidden>' + esc(t('noMatch')) + '</p>';
      foot.innerHTML = '<span class="foot-count" id="l-count"></span><button type="button" class="btn btn-md btn-primary" id="l-csv">' + ic('download', 16) + esc(t('csv')) + '</button>';
      const rows = $$('.row', body), cnt = $('#l-count', foot);
      const sync = n => { cnt.textContent = t('items', { n: n }); $('#l-empty', body).hidden = n !== 0; };
      sync(rows.length);
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

function exportCSV() {
  const head = ['id', 'sample', 'name_ja', 'name_en', 'category_ja', 'category_en', 'severity', 'severity_ja', 'severity_en',
    'desc_ja', 'desc_en', 'action_ja', 'action_en', 'lat', 'lng', 'warn_radius_m', 'updated_at'];
  const lines = [head.join(',')];
  sortedHazards().forEach(f => {
    const p = f.properties, c = catOf(p.category), s = sevOf(p.severity);
    lines.push([p.id, p.dummy ? 'yes' : '', p.name_ja, p.name_en, c.ja, c.en, p.severity, s.ja, s.en,
      p.desc_ja, p.desc_en, p.action_ja, p.action_en, f.geometry.coordinates[1], f.geometry.coordinates[0],
      p.warn_radius_m, p.updated_at].map(csvCell).join(','));
  });
  downloadText('hazards.csv', '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');   // BOM付きでExcelの文字化けを防ぐ
}
