// オフライン対応：Service Workerの登録と、「オフライン準備」画面
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service Worker を登録できません', e));
  });
}

async function offlineStatus() {
  const s = { app: false, tiles: 0, usage: null };
  try {
    s.app = !!(await caches.match('index.html', { ignoreSearch: true })) && !!navigator.serviceWorker.controller;
    const tc = await caches.open('tiles-v1');
    s.tiles = (await tc.keys()).length;
    if (navigator.storage && navigator.storage.estimate) s.usage = (await navigator.storage.estimate()).usage;
  } catch (e) { /* Cache API が使えない環境 */ }
  return s;
}

async function openOfflinePanel() {
  const st = await offlineStatus();
  const mb = st.usage == null ? '—' : (st.usage / 1048576).toFixed(1) + ' MB';
  const supported = 'serviceWorker' in navigator && window.isSecureContext;
  const el = document.getElementById('offline-panel');
  el.innerHTML = `
    <div class="list-head"><h2>${esc(t('offTitle'))}</h2><button id="off-close" aria-label="${esc(t('close'))}">✕</button></div>
    <dl class="off-stat">
      <dt>${esc(t('offApp'))}</dt><dd class="${st.app ? 'ok' : 'ng'}">${esc(supported ? (st.app ? t('offOn') : t('offOff')) : t('locInsecure'))}</dd>
      <dt>${esc(t('offTiles'))}</dt><dd>${st.tiles}${esc(t('offTilesUnit'))}</dd>
      <dt>${esc(t('offUsage'))}</dt><dd>${esc(mb)}</dd>
      <dt>${esc(t('offOnline'))}</dt><dd>${esc(navigator.onLine ? t('offOnlineY') : t('offOnlineN'))}</dd>
    </dl>
    <h3>${esc(t('offSteps'))}</h3>
    <ol><li>${esc(t('offS1'))}</li><li>${esc(t('offS2'))}</li><li>${esc(t('offS3'))}</li></ol>
    <p>${esc(t('offHome'))}</p>
    <p class="off-note">${esc(t('offNote'))}</p>`;
  el.hidden = false;
  document.getElementById('off-close').onclick = () => { el.hidden = true; };
}

document.getElementById('offline-btn').addEventListener('click', openOfflinePanel);
