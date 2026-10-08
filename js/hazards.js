// 地図上の点（危険個所・見どころ）のデータ・ピン描画・詳細パネル。
// 危険個所は「形（丸／ひし形／八角形）＋『!』の数＋文字」で危険度を表し、色だけに依存しない。
// 見どころは、しずく形のピンで表す（形で、危険個所と見分けられる）。
let CATS = { categories: [], severities: [] };
let hazardData = null;                 // 公式データ（data/hazards.geojson）。危険個所と見どころの両方が入る
let CONFIG = { contactEmail: '' };
let hazardLayer = null;
const markers = new Map();             // id -> L.Marker
let selectedId = null;
let introPlayed = false;

// 編集モード（?edit=1）。本物の認証ではなく、URLを知る人のみの運用。
const EDIT = new URLSearchParams(location.search).get('edit') === '1';

// 危険個所／見どころの表示切替（この端末に記憶）
const kindOn = { hazard: true, spot: true };
try { const k = JSON.parse(localStorage.getItem('kinds')); if (k) { kindOn.hazard = k.hazard !== false; kindOn.spot = k.spot !== false; } } catch (e) {}
function setKindOn(kind, on) {
  kindOn[kind] = on;
  try { localStorage.setItem('kinds', JSON.stringify(kindOn)); } catch (e) {}
}

function safeColor(c, fb) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : (fb || '#475569'); }
function textOn(hex) {                                  // 背景色に対して読みやすい文字色
  const c = safeColor(hex);
  const r = parseInt(c.substr(1, 2), 16), g = parseInt(c.substr(3, 2), 16), b = parseInt(c.substr(5, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150 ? '#ffffff' : '#0b1220';
}
function catOf(id) { return CATS.categories.find(c => c.id === id) || { id: id, kind: 'hazard', ja: id, en: id, color: '#475569', icon: 'alert' }; }
function kindOfCat(c) { return c && c.kind === 'spot' ? 'spot' : 'hazard'; }
function kindOf(p) { return kindOfCat(catOf(p.category)); }
function catsOfKind(kind) { return CATS.categories.filter(c => kindOfCat(c) === kind); }
function isMine(f) { return !!(f && f.properties && f.properties.mine); }
function sevOf(lv) { return CATS.severities.find(s => Number(s.level) === Number(lv)) || { level: Number(lv) || 1, ja: '', en: '', mark: '!', color: '#111827' }; }
function sevStyle(s) { const col = safeColor(s.color, '#111827'); return 'background:' + col + ';color:' + textOn(col); }
function sevShape(lv) { return Math.min(Number(lv) || 1, 3); }

// 公式データ ＋ この端末の「マイピン」（閲覧モードのみ）
function allFeatures() {
  if (!hazardData) return [];
  return EDIT || typeof MyPins === 'undefined' ? hazardData.features : hazardData.features.concat(MyPins.features);
}
// いま入力中のフォーム（編集モード＝管理者のフォーム／閲覧モード＝マイピンのフォーム）
function currentForm() { return EDIT ? Edit.form : (typeof MyPins !== 'undefined' ? MyPins.form : null); }

function migrateCats(c) {                               // 旧版のデータを新しい形式にそろえる
  if (c && Array.isArray(c.categories)) c.categories.forEach(x => {
    if (LEGACY_GLYPH[x.icon]) x.icon = LEGACY_GLYPH[x.icon];
    if (x.kind !== 'spot') x.kind = 'hazard';
  });
  return c;
}
function mergeMissingCats(target, source) {             // 保存済みのデータに、新しい種別（見どころなど）を足す
  source.categories.forEach(sc => { if (!target.categories.some(c => c.id === sc.id)) target.categories.push(JSON.parse(JSON.stringify(sc))); });
}

// ---------- ピンの見た目（SVG） ----------
const OCT = '41.09,31.08 31.08,41.09 16.92,41.09 6.91,31.08 6.91,16.92 16.92,6.91 31.08,6.91 41.09,16.92';
const DROP = 'M24 45C24 45 9 30.5 9 19.5a15 15 0 0 1 30 0C39 30.5 24 45 24 45z';
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
function glyphSpot(key) {
  const g = GLYPHS[key];
  if (g) return '<svg x="14" y="9.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--pg)">' + g + '</svg>';
  return '<text x="24" y="20.5" text-anchor="middle" dominant-baseline="central" font-size="17" style="fill:var(--pg)">' + esc(key) + '</text>';
}
function pinSvg(cat, severity, dummy) {
  if (kindOfCat(cat) === 'spot') {                      // 見どころ：しずく形
    return '<svg class="pinsvg" viewBox="0 0 48 48" aria-hidden="true">' +
      (dummy ? '<circle cx="24" cy="19.5" r="21" fill="none" stroke-width="1.3" stroke-dasharray="3 3" style="stroke:#334155"/>' : '') +
      '<path d="' + DROP + '" style="fill:#0f172a;stroke:#0f172a;stroke-width:8;stroke-linejoin:round"/>' +
      '<path d="' + DROP + '" style="fill:var(--pc);stroke:#fff;stroke-width:5;stroke-linejoin:round;paint-order:stroke"/>' +
      glyphSpot(cat.icon) + '</svg>';
  }
  const lv = sevShape(severity);                        // 危険個所：丸／ひし形／八角形
  return '<svg class="pinsvg" viewBox="0 0 48 48" aria-hidden="true">' +
    (dummy ? '<circle cx="24" cy="24" r="23" fill="none" stroke-width="1.3" stroke-dasharray="3 3" style="stroke:#334155"/>' : '') +
    shapeEl(lv, 'fill:#0f172a;stroke:#0f172a;stroke-width:8;stroke-linejoin:round') +
    shapeEl(lv, 'fill:var(--pc);stroke:#fff;stroke-width:5;stroke-linejoin:round;paint-order:stroke') +
    glyphInner(cat.icon, lv) + '</svg>';
}
function pinHtmlRaw(c, s, dummy, o) {                    // 種別(c)と危険度(s)のオブジェクトから描く
  o = o || {};
  const spot = kindOfCat(c) === 'spot';
  const col = safeColor(c.color), size = o.size || 46;
  let badge = '';
  if (spot) { if (o.mine) badge = '<b class="pin-badge pin-mine">' + ic('user', 10) + '</b>'; }
  else if (o.badge !== false && s) badge = '<b class="pin-badge" style="' + sevStyle(s) + '">' + esc(s.mark) + '</b>';
  return '<div class="pin' + (spot ? ' spot' : '') + (dummy ? ' dummy' : '') + (o.draft ? ' draft' : '') + (o.ghost ? ' ghost' : '') +
    '" style="--pc:' + col + ';--pg:' + textOn(col) + ';width:' + size + 'px;height:' + size + 'px">' + pinSvg(c, s ? s.level : 1, dummy) + badge + '</div>';
}
function pinHtml(p, o) {
  const c = catOf(p.category), spot = kindOfCat(c) === 'spot';
  return pinHtmlRaw(c, spot ? null : sevOf(p.severity), p.dummy, Object.assign({ mine: !!p.mine }, o));
}
function pinIcon(p, o) {
  const spot = kindOf(p) === 'spot';
  return L.divIcon({ className: 'pin-wrap', html: pinHtml(p, o), iconSize: [48, 48], iconAnchor: spot ? [23, 42] : [24, 24] });
}

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
function sourceChip(p) {
  if (p.mine) return '<span class="chip chip-mine">' + ic('user', 12) + esc(t('chipMine')) + '</span>';
  if (p.source === 'visitor') return '<span class="chip chip-visitor">' + ic('heart', 12) + esc(t('chipVisitor')) + '</span>';
  return '';
}

// ---------- 地図上のピン ----------
function renderHazards() {
  if (!hazardData || !map) return;
  if (hazardLayer) hazardLayer.remove();
  hazardLayer = L.layerGroup();
  markers.clear();
  const af = currentForm();
  allFeatures().forEach((f, i) => {
    const p = f.properties;
    const editing = !!(af && af.f === f);
    if (!passesFilter(p) && !editing && p.id !== selectedId) return;
    const props = editing ? af.w : p;
    const co = editing ? af.coords : f.geometry.coordinates;
    const name = pick(props, 'name') || props.name_ja || props.name_en || '';
    const m = L.marker([co[1], co[0]], { icon: pinIcon(props), keyboard: true, draggable: EDIT || editing, riseOnHover: true });
    if (hoverCapable() && name) m.bindTooltip(esc(name), { direction: 'top', offset: [0, kindOf(props) === 'spot' ? -42 : -24], className: 'pin-tip', opacity: 1 });
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
  updateKindButtons();
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
  const af = currentForm();
  if (af && af.f === f) {
    af.coords = c; af.dirty = true;
    if (EDIT) Edit.updateFormCoords(); else MyPins.updateFormCoords();
    return;
  }
  if (EDIT) Edit.movePin(f, c);
}

function updateSamplePill() {
  const el = $('#pill-sample');
  if (el) el.hidden = !(hazardData && hazardData.features.some(f => f.properties.dummy));
}

// 右側の「危険／見どころ」表示ボタンの状態
function updateKindButtons() {
  $$('.fab-kind').forEach(b => b.setAttribute('aria-pressed', String(kindOn[b.dataset.kind])));
}

// ---------- 詳細パネル ----------
function detailHTML(f) {
  const p = f.properties, c = catOf(p.category), spot = kindOfCat(c) === 'spot';
  const [lng, lat] = f.geometry.coordinates;
  const author = p.author ? '<p class="d-author">' + ic('user', 13) + esc(t('author', { n: p.author })) + '</p>' : '';
  const actions = isMine(f)
    ? '<p class="d-mine-note">' + esc(t('mineNoteShort')) + '</p><div class="d-actions">' +
      '<button type="button" class="btn btn-sm" id="d-mine-edit">' + ic('edit', 15) + esc(t('btnEdit')) + '</button>' +
      '<button type="button" class="btn btn-sm btn-primary" id="d-mine-send">' + ic('send', 15) + esc(t('btnSend')) + '</button>' +
      '<button type="button" class="btn btn-sm btn-danger-ghost" id="d-mine-del">' + ic('trash', 15) + esc(t('btnDelete')) + '</button></div>'
    : '';
  return '<div class="d-head"><div class="d-pin' + (spot ? ' spot' : '') + '">' + pinHtml(p, { size: 62, badge: false }) + '</div>' +
    '<div class="d-title"><div class="tags">' + (p.dummy ? sampleChip() : '') + sourceChip(p) + catChip(c) + (spot ? '' : sevChip(sevOf(p.severity))) + '</div>' +
    '<h2>' + esc(pick(p, 'name')) + '</h2></div></div>' +
    '<section class="card"><h3>' + esc(t(spot ? 'spotDesc' : 'desc')) + '</h3><p>' + (esc(pick(p, 'desc')) || '—') + '</p></section>' +
    (spot && !pick(p, 'action') ? '' :
      '<section class="card ' + (spot ? 'card-tip' : 'card-action') + '"><h3>' + ic(spot ? 'sparkle' : 'check', 14) + esc(t(spot ? 'spotTip' : 'action')) + '</h3><p>' + (esc(pick(p, 'action')) || '—') + '</p></section>') +
    author +
    (p.photo ? '<img class="d-photo" src="' + esc(p.photo) + '" alt="' + esc(t('photo')) + '" loading="lazy">' : '') +
    '<div class="d-dist" id="d-dist" hidden></div>' +
    '<dl class="d-meta"><div><dt>' + esc(t('coords')) + '</dt><dd class="mono">' + lat.toFixed(5) + ', ' + lng.toFixed(5) +
    ' <button type="button" class="btn-link" id="d-copy">' + ic('copy', 13) + esc(t('copy')) + '</button></dd></div>' +
    '<div><dt>' + esc(t('updated')) + '</dt><dd>' + esc(p.updated_at || '—') + '</dd></div></dl>' + actions;
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
      if (isMine(f)) {
        $('#d-mine-edit', body).onclick = () => MyPins.openForm(f);
        $('#d-mine-send', body).onclick = () => MyPins.send([f]);
        $('#d-mine-del', body).onclick = () => MyPins.remove(f);
      }
      updateDetailDistance();
    },
    onClose() { currentDetail = null; setSelected(null); }
  });
  if (opts.fly !== false) {
    const spot = kindOf(f.properties) === 'spot';
    focusLatLng([f.geometry.coordinates[1], f.geometry.coordinates[0]], Math.max(map.getZoom(), 16), undefined, spot ? 14 : 0);
  }
}

// 一覧などから選んだとき
function selectHazard(f) {
  if (EDIT) Edit.pinClicked(f);
  else showDetail(f);
}

async function loadHazards() {
  const [cats, data, cfg] = await Promise.all([
    fetch('data/categories.json').then(r => r.json()),
    fetch('data/hazards.geojson').then(r => r.json()),
    fetch('data/config.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}))
  ]);
  CONFIG = Object.assign(CONFIG, cfg);
  CATS = migrateCats(cats); hazardData = data;
  if (EDIT) {                         // 編集モードは、このブラウザに保存済みの編集内容を優先
    const s = loadSaved();
    if (s) {
      CATS = migrateCats(s.cats); hazardData = s.hazards;
      if (s.ver !== 2) mergeMissingCats(CATS, migrateCats(JSON.parse(JSON.stringify(cats))));   // 見どころ導入前の保存データに、新しい種別を1回だけ足す
    }
  } else {
    MyPins.load();                    // この端末の「マイピン」
  }
  renderHazards();
}
