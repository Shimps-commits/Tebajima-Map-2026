// Service Worker：アプリ本体とデータを保存し、閲覧した地図タイルを端末内に残す。
// ファイルを更新して公開したら、VERSION を上げると端末側が入れ替わる。
const VERSION = 'v3';
const APP_CACHE = 'app-' + VERSION;
const TILE_CACHE = 'tiles-v1';          // タイルは版を上げても消さない
const MAX_TILES = 3000;
const TILE_HOST = 'cyberjapandata.gsi.go.jp';

const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css',
  'js/i18n.js', 'js/icons.js', 'js/ui.js', 'js/map.js', 'js/hazards.js', 'js/place.js', 'js/mypins.js', 'js/filters.js', 'js/list.js',
  'js/locate.js', 'js/offline.js', 'js/info.js', 'js/edit.js', 'js/categories.js', 'js/geoio.js', 'js/app.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'data/hazards.geojson', 'data/categories.json', 'data/config.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('app-') && k !== APP_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === TILE_HOST) return e.respondWith(tileHandler(req));
  if (url.origin === location.origin) return e.respondWith(networkFirst(req));
});

// 同一オリジン：通信できれば最新、できなければ保存済みを返す
async function networkFirst(req) {
  const cache = await caches.open(APP_CACHE);
  try {
    const res = await Promise.race([
      fetch(req, { cache: 'no-cache' }),      // 毎回サーバーに最新か確認する（新旧のファイルが混ざらないように）
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  }
}

// 地図タイル：保存済みを優先。なければ取得して保存（CORSで取得し、容量を正しく数える）
let putCount = 0;
async function tileHandler(req) {
  const cache = await caches.open(TILE_CACHE);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req.url, { mode: 'cors', credentials: 'omit' });
    if (res.ok) {
      await cache.put(req.url, res.clone());
      if (++putCount % 50 === 0) trimTiles(cache);
    }
    return res;
  } catch (err) {
    return Response.error();
  }
}

async function trimTiles(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);   // 古い順に削除
}
