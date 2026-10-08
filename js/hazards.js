// ピン描画と詳細表示。危険度は形（丸/ひし形/八角形）＋「!」の数＋文字で表し、色だけに依存しない。
let CATS = { categories: [], severities: [] };
let hazardLayer = null;
let hazardData = null;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function catOf(id) { return CATS.categories.find(c => c.id === id) || { id, ja: id, en: id, color: '#374151', icon: '❗' }; }
function sevOf(lv) { return CATS.severities.find(s => s.level === Number(lv)) || { level: lv, ja: '', en: '', mark: '!' }; }

// 編集モード（?edit=1）。本物の認証ではなく、URLを知る人のみの運用。
const EDIT = new URLSearchParams(location.search).get('edit') === '1';

// 危険度バッジの色（背景色に合わせて文字色を白/黒に切替）
function sevStyle(s) {
  const col = /^#[0-9a-f]{6}$/i.test(s.color || '') ? s.color : '#000000';
  const [r, g, b] = [1, 3, 5].map(i => parseInt(col.substr(i, 2), 16));
  const dark = (0.299 * r + 0.587 * g + 0.114 * b) < 150;
  return `background:${col};color:${dark ? '#fff' : '#000'}`;
}
function sevShape(lv) { return 'sev' + Math.min(Number(lv) || 1, 3); }

function pinIcon(p) {
  const c = catOf(p.category), s = sevOf(p.severity);
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin ${sevShape(s.level)}" style="background:${esc(c.color)}"><span class="pi">${esc(c.icon)}</span><b class="pm" style="${esc(sevStyle(s))}">${esc(s.mark)}</b></div>`,
    iconSize: [48, 48], iconAnchor: [24, 24]
  });
}

function renderHazards() {
  if (hazardLayer) hazardLayer.remove();
  hazardLayer = L.layerGroup();
  hazardData.features.filter(f => passesFilter(f.properties)).forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const m = L.marker([lat, lng], { icon: pinIcon(f.properties), keyboard: true, draggable: EDIT,
      title: pick(f.properties, 'name') || f.properties.name_ja || f.properties.name_en || '' });
    m.on('click', () => EDIT ? openHazardForm(f, false) : showDetail(f.properties));
    if (EDIT) m.on('dragend', () => {
      const ll = m.getLatLng();
      f.geometry.coordinates = [+ll.lng.toFixed(6), +ll.lat.toFixed(6)];
      f.properties.updated_at = today();
      saveState();
    });
    m.addTo(hazardLayer);
  });
  hazardLayer.addTo(map);
}

function showDetail(p) {
  const c = catOf(p.category), s = sevOf(p.severity);
  const el = document.getElementById('detail');
  el.innerHTML = `
    <button class="close" id="detail-close" aria-label="${esc(t('close'))}">✕</button>
    ${p.dummy ? `<span class="badge-sample">${esc(t('sample'))}</span>` : ''}
    <h2>${esc(pick(p, 'name'))}</h2>
    <p class="meta"><span class="tag" style="background:${esc(c.color)}">${esc(c.icon)} ${esc(c[lang])}</span>
      <span class="tag sevtag" style="${esc(sevStyle(s))}">${esc(s.mark)} ${esc(s[lang])}</span></p>
    <h3>${esc(t('desc'))}</h3><p>${esc(pick(p, 'desc'))}</p>
    <h3>${esc(t('action'))}</h3><p>${esc(pick(p, 'action'))}</p>
    ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(t('photo'))}">` : ''}
    <p class="upd">${esc(t('updated'))}: ${esc(p.updated_at)}</p>`;
  el.hidden = false;
  document.getElementById('detail-close').onclick = () => { el.hidden = true; };
}

async function loadHazards() {
  const [cats, data] = await Promise.all([
    fetch('data/categories.json').then(r => r.json()),
    fetch('data/hazards.geojson').then(r => r.json())
  ]);
  CATS = cats; hazardData = data;
  if (EDIT) {                       // 編集モードは、このブラウザに保存済みの編集内容を優先
    const s = loadSaved();
    if (s) { CATS = s.cats; hazardData = s.hazards; }
  }
  renderHazards();
}
