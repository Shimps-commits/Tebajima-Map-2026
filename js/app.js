const map = createMap();

document.querySelectorAll('#areas button').forEach(btn => {
  btn.addEventListener('click', () => {
    const a = AREAS[btn.dataset.area];
    map.setView(a.center, a.zoom);
    document.querySelectorAll('#areas button').forEach(b => b.classList.toggle('active', b === btn));
  });
});
document.querySelector('#areas button[data-area="deba"]').classList.add('active');

document.getElementById('lang-btn').addEventListener('click', () => {
  setLang(lang === 'ja' ? 'en' : 'ja');
  if (hazardData) { renderHazards(); buildFilterPanel(); }
  const lm = document.getElementById('loc-msg');
  if (lm.dataset.key) lm.textContent = t(lm.dataset.key);
  document.getElementById('detail').hidden = true;
  if (!document.getElementById('list-panel').hidden) renderList();
  if (!document.getElementById('offline-panel').hidden) openOfflinePanel();
});

setLang(lang);
loadHazards().then(() => { buildFilterPanel(); if (EDIT) initEditMode(); }).catch(e => {
  console.error(e);
  document.getElementById('notice').textContent = 'データを読み込めませんでした / Failed to load data';
});
