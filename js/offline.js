// オフライン対応：Service Workerの登録、更新通知、通信状態の表示、「オフライン準備」パネル。
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (Panel.isOpen('offline')) Panel.refresh(); });

if ('serviceWorker' in navigator && window.isSecureContext) {
  const hadController = !!navigator.serviceWorker.controller;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service Worker を登録できません', e));
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {     // 新しい版に入れ替わった
    if (hadController) toast(t('updateReady'), { ms: 12000, action: { label: t('reload'), fn: () => location.reload() } });
    if (Panel.isOpen('offline')) setTimeout(() => Panel.refresh(), 400);
  });
}

function updateNetPill() {
  const el = $('#pill-net');
  if (!el) return;
  el.hidden = navigator.onLine !== false;
  el.innerHTML = ic('wifiOff', 12) + esc(t('offOffline'));
}
window.addEventListener('online', () => { updateNetPill(); if (Panel.isOpen('offline')) Panel.refresh(); });
window.addEventListener('offline', () => { updateNetPill(); if (Panel.isOpen('offline')) Panel.refresh(); });

async function offlineStatus() {
  const s = { app: false, tiles: 0, usage: null, supported: 'serviceWorker' in navigator && window.isSecureContext };
  try {
    s.app = !!(await caches.match('index.html', { ignoreSearch: true })) && !!navigator.serviceWorker.controller;
    s.tiles = (await (await caches.open('tiles-v1')).keys()).length;
    if (navigator.storage && navigator.storage.estimate) s.usage = (await navigator.storage.estimate()).usage;
  } catch (e) { /* Cache API が使えない環境 */ }
  return s;
}

function openOffline() {
  Panel.open({
    id: 'offline', title: t('offTitle'), icon: 'offline',
    render(body) {
      body.innerHTML = '<div class="skeleton"></div>';
      offlineStatus().then(st => {
        if (!Panel.isOpen('offline')) return;
        const mb = st.usage == null ? '—' : (st.usage / 1048576).toFixed(1) + ' MB';
        const online = navigator.onLine !== false;
        const appOk = st.supported && st.app;
        body.innerHTML =
          '<div class="stat-card ' + (appOk ? 'ok' : 'ng') + '"><span class="stat-ic">' + ic(appOk ? 'check' : 'alert', 20) + '</span><div><b>' + esc(t('offApp')) + '</b>' +
          '<small>' + esc(!st.supported ? t('offUnsupported') : appOk ? t('offAppOk') : t('offAppNo') + ' — ' + t('offAppNoHint')) + '</small></div></div>' +
          '<div class="stat-grid">' +
          '<div class="stat-tile"><small>' + esc(t('offTiles')) + '</small><b>' + esc(t('offTilesUnit', { n: st.tiles })) + '</b></div>' +
          '<div class="stat-tile"><small>' + esc(t('offUsage')) + '</small><b>' + esc(mb) + '</b></div>' +
          '<div class="stat-tile"><small>' + esc(t('offNet')) + '</small><b class="' + (online ? 'okc' : 'ngc') + '">' + ic(online ? 'wifi' : 'wifiOff', 14) + ' ' + esc(online ? t('offOnline') : t('offOffline')) + '</b></div></div>' +
          '<h3 class="sec">' + esc(t('offSteps')) + '</h3>' +
          '<ol class="steps"><li><span>1</span><p>' + esc(t('offS1')) + '</p></li><li><span>2</span><p>' + esc(t('offS2')) + '</p></li><li><span>3</span><p>' + esc(t('offS3')) + '</p></li></ol>' +
          '<div class="card"><p><b>' + esc(t('offHome')) + '</b></p><p class="muted">' + esc(t('offHomeIos')) + '<br>' + esc(t('offHomeAndroid')) + '</p>' +
          (installPrompt ? '<button type="button" class="btn btn-md btn-primary" id="o-install">' + esc(t('offInstall')) + '</button>' : '') + '</div>' +
          '<p class="note">' + esc(t('offNote')) + '</p>';
        const ib = $('#o-install', body);
        if (ib) ib.onclick = () => { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; Panel.refresh(); }); };
      });
    }
  });
}
