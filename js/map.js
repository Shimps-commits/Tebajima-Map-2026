// 地図の初期化とタイル層。座標は要確認（README参照）：
// 出羽島 約33.633N,134.424E（Wikipedia/Mapion）、牟岐大島 約33.636N,134.492E。
// 国土地理院地図で確認後に調整すること。
const AREAS = {
  deba:   { center: [33.633, 134.424], zoom: 15 },
  oshima: { center: [33.636, 134.492], zoom: 15 }
};

const GSI_ATTR = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院 / GSI of Japan</a>';

function createMap() {
  const map = L.map('map', { zoomControl: true }).setView(AREAS.deba.center, AREAS.deba.zoom);
  const layers = {
    '標準地図 / Standard': L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
      { attribution: GSI_ATTR, maxZoom: 18 }),
    '写真 / Photo': L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
      { attribution: GSI_ATTR, maxZoom: 18 }),
    '地形図 / Relief': L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
      { attribution: GSI_ATTR, maxZoom: 15 }),
    'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 })
  };
  layers['標準地図 / Standard'].addTo(map);
  L.control.layers(layers, null, { position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);
  return map;
}
