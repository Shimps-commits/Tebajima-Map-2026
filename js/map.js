// 地図の初期化・背景地図・表示範囲の制御。
// 座標は暫定（README参照）。出羽島 約33.633N,134.424E／牟岐大島 約33.636N,134.492E。
// 国土地理院の地図で確認した値に直したら、ここを書き換える。
const AREAS = {
  deba:   { center: [33.633, 134.424], zoom: 15 },
  oshima: { center: [33.636, 134.492], zoom: 15 }
};

const GSI = 'https://cyberjapandata.gsi.go.jp/xyz';
const GSI_ATTR = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院 / GSI of Japan</a>';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

// 背景地図。国土地理院の一括取得は行わず、閲覧したタイルだけをSWが端末に保存する。
const BASES = [
  { id: 'pale',   url: GSI + '/pale/{z}/{x}/{y}.png',          native: 18, attr: GSI_ATTR },
  { id: 'std',    url: GSI + '/std/{z}/{x}/{y}.png',           native: 18, attr: GSI_ATTR },
  { id: 'photo',  url: GSI + '/seamlessphoto/{z}/{x}/{y}.jpg', native: 18, attr: GSI_ATTR },
  { id: 'relief', url: GSI + '/relief/{z}/{x}/{y}.png',        native: 15, attr: GSI_ATTR },
  { id: 'osm',    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', native: 19, attr: OSM_ATTR }
];

let map = null, baseLayer = null, baseId = 'pale';
try { baseId = localStorage.getItem('base') || baseId; } catch (e) {}
if (!BASES.some(b => b.id === baseId)) baseId = 'pale';

function lngLatToTile(lng, lat, z) {
  const n = Math.pow(2, z), r = lat * Math.PI / 180;
  return {
    x: Math.floor((lng + 180) / 360 * n),
    y: Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n)
  };
}
function thumbUrl(b) {                           // 切替メニューの見本（出羽島付近のタイル1枚）
  const z = 15, tl = lngLatToTile(134.424, 33.633, z);
  return b.url.replace('{z}', z).replace('{x}', tl.x).replace('{y}', tl.y);
}

function makeLayer(b) {
  return L.tileLayer(b.url, { attribution: b.attr, maxNativeZoom: b.native, maxZoom: 19, crossOrigin: false });
}

function setBase(id) {
  const b = BASES.find(x => x.id === id) || BASES[0];
  if (baseLayer) baseLayer.remove();
  baseLayer = makeLayer(b).addTo(map);
  baseLayer.bringToBack();
  baseId = b.id;
  try { localStorage.setItem('base', baseId); } catch (e) {}
  document.documentElement.dataset.base = baseId;
}

function createMap() {
  map = L.map('map', {
    zoomControl: false, attributionControl: false,
    minZoom: 9, maxZoom: 19, zoomSnap: 1, wheelPxPerZoomLevel: 80, tap: true
  }).setView(AREAS.deba.center, AREAS.deba.zoom);
  L.control.attribution({ position: 'bottomleft', prefix: '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft', maxWidth: 110 }).addTo(map);
  setBase(baseId);
  return map;
}

// 指定の点を、パネルやバーに隠れない範囲の中央に表示する
function focusLatLng(latlng, zoom, animate) {
  const z = zoom || map.getZoom();
  const ins = visibleInsets();
  const size = map.getSize();
  const cx = ins.left + (size.x - ins.left - ins.right) / 2;
  const cy = ins.top + (size.y - ins.top - ins.bottom) / 2;
  const p = map.project(L.latLng(latlng), z);
  const center = map.unproject(p.add([size.x / 2 - cx, size.y / 2 - cy]), z);
  if (animate === false || reducedMotion()) map.setView(center, z, { animate: false });
  else map.flyTo(center, z, { duration: 0.7 });
}

function goArea(key) {
  const a = AREAS[key];
  if (!a) return;
  if (reducedMotion()) map.setView(a.center, a.zoom, { animate: false });
  else map.flyTo(a.center, a.zoom, { duration: 0.9 });
}

function currentAreaKey() {                       // 地図の中心が近いエリア（強調表示用）
  const c = map.getCenter();
  let best = null, bd = 2500;
  Object.keys(AREAS).forEach(k => {
    const d = haversine([c.lat, c.lng], AREAS[k].center);
    if (d < bd) { bd = d; best = k; }
  });
  return best;
}
