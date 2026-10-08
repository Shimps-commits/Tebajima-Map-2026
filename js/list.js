// 一覧表とCSV書き出し（出発前の確認・補助金の報告資料用）
function sortedHazards() {
  return hazardData.features.slice().sort((a, b) =>
    Number(b.properties.severity) - Number(a.properties.severity) ||
    String(a.properties.category).localeCompare(String(b.properties.category)));
}

function renderList() {
  const el = document.getElementById('list-panel');
  const fs = sortedHazards();
  const rows = fs.map((f, i) => {
    const p = f.properties, c = catOf(p.category), s = sevOf(p.severity);
    return `<tr data-i="${i}" tabindex="0">
      <td><b class="mk" style="${esc(sevStyle(s))}">${esc(s.mark)}</b><br><small>${esc(s[lang])}</small></td>
      <td><i class="dot" style="background:${esc(c.color)}">${esc(c.icon)}</i><br><small>${esc(c[lang])}</small></td>
      <td>${p.dummy ? `<span class="badge-sample">${esc(t('sample'))}</span> ` : ''}${esc(pick(p, 'name'))}</td></tr>`;
  }).join('');
  el.innerHTML = `
    <div class="list-head">
      <h2>${esc(t('list'))} <small>(${fs.length}${esc(t('count'))})</small></h2>
      <button id="list-csv" class="primary">${esc(t('csv'))}</button>
      <button id="list-close" aria-label="${esc(t('close'))}">✕</button>
    </div>
    <p class="hint">${esc(t('listHint'))}</p>
    ${fs.length ? `<table><thead><tr><th>${esc(t('severity'))}</th><th>${esc(t('category'))}</th><th>${esc(t('name'))}</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${esc(t('noData'))}</p>`}`;
  document.getElementById('list-close').onclick = () => { el.hidden = true; };
  document.getElementById('list-csv').onclick = exportCSV;
  el.querySelectorAll('tbody tr').forEach(tr => {
    const go = () => {
      const f = fs[Number(tr.dataset.i)];
      el.hidden = true;
      map.setView([f.geometry.coordinates[1], f.geometry.coordinates[0]], Math.max(map.getZoom(), 17));
      EDIT ? openHazardForm(f, false) : showDetail(f.properties);
    };
    tr.onclick = go;
    tr.onkeydown = e => { if (e.key === 'Enter') go(); };
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

document.getElementById('list-btn').addEventListener('click', () => {
  renderList();
  document.getElementById('list-panel').hidden = false;
});
