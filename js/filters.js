// 種別・危険度フィルター。状態は画面内のみ（非表示にしたID/レベルの集合）。
const hiddenCats = new Set();
const hiddenSevs = new Set();

function passesFilter(p) {
  return !hiddenCats.has(p.category) && !hiddenSevs.has(Number(p.severity));
}

function buildFilterPanel() {
  const el = document.getElementById('filter-panel');
  const row = (kind, key, label, extra) =>
    `<label class="frow"><input type="checkbox" data-kind="${kind}" data-key="${esc(key)}" ${(kind === 'cat' ? hiddenCats : hiddenSevs).has(key) ? '' : 'checked'}>
     <span>${extra}${esc(label)}</span></label>`;
  el.innerHTML =
    `<h3>${esc(t('category'))}</h3>` +
    CATS.categories.map(c => row('cat', c.id, c[lang], `<i class="dot" style="background:${esc(c.color)}">${esc(c.icon)}</i>`)).join('') +
    `<h3>${esc(t('severity'))}</h3>` +
    CATS.severities.map(s => row('sev', s.level, s[lang], `<b class="mk" style="${esc(sevStyle(s))}">${esc(s.mark)}</b>`)).join('') +
    `<button id="filter-all">${esc(t('filterAll'))}</button>`;
  el.querySelectorAll('input').forEach(i => i.addEventListener('change', () => {
    const set = i.dataset.kind === 'cat' ? hiddenCats : hiddenSevs;
    const key = i.dataset.kind === 'cat' ? i.dataset.key : Number(i.dataset.key);
    i.checked ? set.delete(key) : set.add(key);
    renderHazards();
  }));
  document.getElementById('filter-all').onclick = () => { hiddenCats.clear(); hiddenSevs.clear(); buildFilterPanel(); renderHazards(); };
}

document.getElementById('filter-btn').addEventListener('click', () => {
  const el = document.getElementById('filter-panel');
  el.hidden = !el.hidden;
});
