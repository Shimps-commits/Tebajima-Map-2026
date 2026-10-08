// 危険個所のデータ・ピン描画・詳細パネル。
// 危険度は「形（丸／ひし形／八角形）＋『!』の数＋文字」で表し、色だけに依存しない。
let CATS = { categories: [], severities: [] };
let hazardData = null;
let hazardLayer = null;
const markers = new Map();           // id -> L.Marker
let selectedId = null;
let introPlayed = false;

// 編集モード（?edit=1）。本物の認証ではなく、URLを知る人のみの運用。
const EDIT = new URLSearchParams(location.search).get('edit') === '1';

function safeColor(c, fb) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : (fb || '#475569'); }
function textOn(hex) {                                  // 背景色に対して読みやすい文字色
  const c = safeColor(hex);
  const r = parseInt(c.substr(1, 2), 16), g = parseInt(c.substr(3, 2), 16), b = parseInt(c.substr(5, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150 ? '#ffffff' : '#0b1220';
}
function catOf(id) { return CATS.categories.find(c => c.id === id) || { id: id, ja: id, en: id, color: '#475569', icon: 'alert' }; }
function sevOf(lv) { return CATS.severities.find(s => Number(s.level) === Number(lv)) || { level: Number(lv) || 1, ja: '', en: '', mark: '!', color: '#111827' }; }
function sevStyle(s) { const col = safeColor(s.color, '#111827'); return 'background:' + col + ';color:' + textOn(col); }
function sevShape(lv) { return Math.min(Number(lv) || 1, 3); }

function migrateCats(c) {                               // 旧版の絵文字アイコンを置き換える
  if (c && Array.isArray(c.categories)) c.categories.forEach(x => { if (LEGACY_GLYPH[x.icon]) x.icon = LEGACY_GLYPH[x.icon]; });
  return c;
}

// ---------- ピンの見た目（SVG） ----------
const OCT = '41.09,31.08 31.08,41.09 16.92,41.09 6.91,31.08 6.91,16.92 16.92,6.91 31.08,6.91 41.09,16.92';
function shapeEl(level, style) {
  if (level <= 1) return '<circle cx="24" cy="24" r="17.5" style="' + style + '"/>';
  if (level === 2) return '<rect x="10.5" y="10.5" width="27" height="27" rx="5" transform="rotate(45 24 24)" style="' + style + '"/>';
  return '<polygon points="' + OCT + '" style="' + style + '"/>';
}
function glyphInner(key, level) {
  const g = GLYPHS[key];
  const small = level === 2;
  if (g) {
    const pos = small ? 15.25 : 13, size = small ? 17.5 : 22;
    return '<svg x="' + pos + '" y="' + pos + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--pg)">' + g + '</svg>';
  }
  return '<text x="24" y="25" text-anchor="middle" dominant-baseline="central" font-size="' + (small ? 15 : 19) + '" style="fill:var(--pg)">' + esc(key) + '</text>';
}
function pinSvg(cat, severity, dummy) {
  const lv = sevShape(severity);
  return '<svg class="pinsvg" viewBox="0 0 48 48" aria-hidden="true">' +
    (dummy ? '<circle cx="24" cy="24" r="23" fill="none" stroke-width="1.3" stroke-dasharray="3 3" style="stroke:#334155"/>' : '') +
    shapeEl(lv, 'fill:#0f172a;stroke:#0f172a;stroke-width:8;stroke-linejoin:round') +
    shapeEl(lv, 'fill:var(--pc);stroke:#fff;stroke-width:5;stroke-linejoin:round;paint-order:stroke') +
    glyphInner(cat.icon, lv) + '</svg>';
}
function pinHtmlRaw(c, s, dummy, o) {                    // 種別(c)と危険度(s)のオブジェクトから描く
  o = o || {};
  const col = safeColor(c.color), size = o.size || 46;
  return '<div class="pin' + (dummy ? ' dummy' : '') + (o.draft ? ' draft' : '') + (o.ghost ? ' ghost' : '') +
    '" style="--pc:' + col + ';--pg:' + textOn(col) + ';width:' + size + 'px;height:' + size + 'px">' + pinSvg(c, s.level, dummy) +
    (o.badge === false ? '' : '<b class="pin-badge" style="' + sevStyle(s) + '">' + esc(s.mark) + '</b>') + '</div>';
}
function pinHtml(p, o) { return pinHtmlRaw(catOf(p.category), sevOf(p.severity), p.dummy, o); }
function pinIcon(p, o) { return L.divIcon({ className: 'pin-wrap', html: pinHtml(p, o), iconSize: [48, 48], iconAnchor: [24, 24] }); }

// 危険度の形だけのアイコン（チップ用）
function sevShapeSvg(level, size) {
  const lv = sevShape(level), sz = size || 12;
  const inner = lv <= 1 ? '<circle cx="12" cy="12" r="9"/>'
    : lv === 2 ? '<rect x="5.2" y="5.2" width="13.6" height="13.6" rx="2.2" transform="rotate(45 12 12)"/>'
    : '<polygon points="8.2,3 15.8,3 21,8.2 21,15.8 15.8,21 8.2,21 3,15.8 3,8.2"/>';
  return '<svg viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="currentColor" aria-hidden="true">' + inner + '</svg>';
}
function catChip(c) {
  const col = safeColor(c.color);
  return '<span class="chip chip-cat" style="--cc:' + col + ';--ct:' + textOn(col) + '">' + ic(GLYPHS[c.icon] ? c.icon : 'alert', 13) + esc(c[lang] || c.ja) + '</span>';
}
function sevChip(s) {
  const col = safeColor(s.color, '#111827');
  return '<span class="chip chip-sev" style="--sc:' + col + ';--st:' + textOn(col) + '">' + sevShapeSvg(s.level, 11) + esc(s.mark) + ' ' + esc(s[lang] || s.ja) + '</span>';
}
function sampleChip() { return '<span class="chip chip-sample">' + esc(t('sample')) + '</span>'; }

// ---------- 地図上のピン ----------
function renderHazards() {
  if (!hazardData || !map) return;
  if (hazardLayer) hazardLayer.remove();
  hazardLayer = L.layerGroup();
  markers.clear();
  hazardData.features.forEach((f, i) => {
    const p = f.properties;
    const editing = EDIT && Edit.form && Edit.form.f === f;
    if (!passesFilter(p) && !editing && p.id !== selectedId) return;
    const props = editing ? Edit.form.w : p;
    const co = editing ? Edit.form.coords : f.geometry.coordinates;
    const name = pick(props, 'name') || props.name_ja || props.name_en || '';
    const m = L.marker([co[1], co[0]], { icon: pinIcon(props), keyboard: true, draggable: EDIT, riseOnHover: true });
    if (hoverCapable() && name) m.bindTooltip(esc(name), { direction: 'top', offset: [0, -24], className: 'pin-tip', opacity: 1 });
    m.on('click', () => onPinClick(f));
    m.on('dragend', () => onPinDragEnd(f, m));
    m.on('add', () => {
      const el = m.getElement();
      if (!el) return;
      el.setAttribute('aria-label', name);
      if (p.id === selectedId) el.classList.add('is-selected');
      if (!introPlayed && !reducedMotion()) { el.style.setProperty('--i', i); el.classList.add('intro'); }
    });
    m.addTo(hazardLayer);
    markers.set(p.id, m);
  });
  hazardLayer.addTo(map);
  introPlayed = true;
  updateSamplePill();
  updateFilterBadge();
}

function refreshMarker(id, props) {                      // 見た目だけ更新（編集中のプレビュー用）
  const m = markers.get(id);
  if (!m) return;
  m.setIcon(pinIcon(props));
  markSelected();
}

function setSelected(id) { selectedId = id; markSelected(); }
function markSelected() {
  markers.forEach((m, id) => { const el = m.getElement(); if (el) el.classList.toggle('is-selected', id === selectedId); });
}

function onPinClick(f) {
  if (EDIT) Edit.pinClicked(f);
  else showDetail(f);
}
function onPinDragEnd(f, m) {
  const ll = m.getLatLng();
  const c = [+ll.lng.toFixed(6), +ll.lat.toFixed(6)];
  if (Edit.form && Edit.form.f === f) { Edit.form.coords = c; Edit.form.dirty = true; Edit.updateFormCoords(); return; }
  Edit.movePin(f, c);
}

function updateSamplePill() {
  const el = $('#pill-sample');
  if (el) el.hidden = !(hazardData && hazardData.features.some(f => f.properties.dummy));
}

// ---------- 詳細パネル ----------
function detailHTML(f) {
  const p = f.properties, c = catOf(p.category), s = sevOf(p.severity);
  const [lng, lat] = f.geometry.coordinates;
  return '<div class="d-head"><div class="d-pin">' + pinHtml(p, { size: 62, badge: false }) + '</div>' +
    '<div class="d-title"><div class="tags">' + (p.dummy ? sampleChip() : '') + catChip(c) + sevChip(s) + '</div>' +
    '<h2>' + esc(pick(p, 'name')) + '</h2></div></div>' +
    '<section class="card"><h3>' + esc(t('desc')) + '</h3><p>' + (esc(pick(p, 'desc')) || '—') + '</p></section>' +
    '<section class="card card-action"><h3>' + ic('check', 14) + esc(t('action')) + '</h3><p>' + (esc(pick(p, 'action')) || '—') + '</p></section>' +
    (p.photo ? '<img class="d-photo" src="' + esc(p.photo) + '" alt="' + esc(t('photo')) + '" loading="lazy">' : '') +
    '<div class="d-dist" id="d-dist" hidden></div>' +
    '<dl class="d-meta"><div><dt>' + esc(t('coords')) + '</dt><dd class="mono">' + lat.toFixed(5) + ', ' + lng.toFixed(5) +
    ' <button type="button" class="btn-link" id="d-copy">' + ic('copy', 13) + esc(t('copy')) + '</button></dd></div>' +
    '<div><dt>' + esc(t('updated')) + '</dt><dd>' + esc(p.updated_at || '—') + '</dd></div></dl>';
}

function updateDetailDistance() {
  const el = $('#d-dist');
  if (!el || !Panel.isOpen('detail') || !currentDetail) return;
  if (!Locate.pos) { el.hidden = true; return; }
  const [lng, lat] = currentDetail.geometry.coordinates;
  el.innerHTML = ic('locate', 15) + esc(t('fromYou', { d: fmtDistance(haversine(Locate.pos, [lat, lng])) }));
  el.hidden = false;
}

let currentDetail = null;
function showDetail(f, opts) {
  opts = opts || {};
  currentDetail = f;
  setSelected(f.properties.id);
  Panel.open({
    id: 'detail', bare: true, modal: false,
    render(body) {
      body.innerHTML = detailHTML(f);
      const img = $('.d-photo', body);
      if (img) img.addEventListener('error', () => img.remove());
      const cp = $('#d-copy', body);
      if (cp) cp.onclick = () => copyText(f.geometry.coordinates[1].toFixed(6) + ', ' + f.geometry.coordinates[0].toFixed(6));
      updateDetailDistance();
    },
    onClose() { currentDetail = null; setSelected(null); }
  });
  if (opts.fly !== false) focusLatLng([f.geometry.coordinates[1], f.geometry.coordinates[0]], Math.max(map.getZoom(), 16));
}

// 一覧などから選んだとき
function selectHazard(f) {
  if (EDIT) Edit.pinClicked(f);
  else showDetail(f);
}

async function loadHazards() {
  const [cats, data] = await Promise.all([
    fetch('data/categories.json').then(r => r.json()),
    fetch('data/hazards.geojson').then(r => r.json())
  ]);
  CATS = migrateCats(cats); hazardData = data;
  if (EDIT) {                         // 編集モードは、このブラウザに保存済みの編集内容を優先
    const s = loadSaved();
    if (s) { CATS = migrateCats(s.cats); hazardData = s.hazards; }
  }
  renderHazards();
}
