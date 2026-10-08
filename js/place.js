// 「地図をタップ／クリックして場所を指定する」共通の仕組み。
// 管理者のピン追加（編集モード）と、利用者のマイピン追加（閲覧モード）の両方で使う。
const Place = { on: false, owner: null, ghost: null, spec: null };

function placeBannerHTML(text) {
  return '<span class="pb-ic">' + ic('pin', 18) + '</span><span class="pb-t"><b>' + esc(text.title) + '</b><small>' + esc(text.sub) + '</small></span>' +
    '<button type="button" class="btn btn-sm" id="pb-center">' + esc(text.center) + '</button>' +
    '<button type="button" class="btn btn-sm btn-ghost" id="pb-cancel">' + esc(text.cancel) + '</button>';
}

// spec: { owner, ghostProps, text: {title, sub, center, cancel}, onDrop(latlng), onEnd() }
Place.start = async function (spec) {
  if (Place.on) Place.cancel();
  if (Panel.current && !Panel.current.noClose) { if (!(await Panel.requestClose())) return false; }
  closeAddChooser();
  Place.on = true; Place.owner = spec.owner; Place.spec = spec;
  document.body.classList.add('placing');
  $('#map').classList.add('placing');
  const b = $('#place-banner');
  b.innerHTML = placeBannerHTML(spec.text);
  b.hidden = false;
  $('#pb-center').onclick = () => Place.drop(map.getCenter());
  $('#pb-cancel').onclick = () => Place.cancel();
  if (hoverCapable() && spec.ghostProps) {
    Place.ghost = L.marker(map.getCenter(), { icon: pinIcon(spec.ghostProps, { ghost: true, badge: false }), interactive: false, keyboard: false, zIndexOffset: 900, opacity: 0 }).addTo(map);
  }
  if (Panel.isOpen('edit-home')) Panel.refresh();
  return true;
};

Place.end = function () {
  const spec = Place.spec;
  Place.on = false; Place.owner = null; Place.spec = null;
  document.body.classList.remove('placing');
  $('#map').classList.remove('placing');
  $('#place-banner').hidden = true;
  if (Place.ghost) { Place.ghost.remove(); Place.ghost = null; }
  if (Panel.isOpen('edit-home')) Panel.refresh();
  return spec;
};
Place.cancel = function () {
  if (!Place.on) return;
  const spec = Place.end();
  if (spec && spec.onEnd) spec.onEnd();
};
Place.drop = function (ll) {
  if (!Place.on) return;
  const spec = Place.end();
  if (spec && spec.onDrop) spec.onDrop(ll);
};

function initPlace() {
  map.on('click', e => { if (Place.on) Place.drop(e.latlng); });
  map.on('mousemove', e => { if (Place.ghost) { Place.ghost.setLatLng(e.latlng); Place.ghost.setOpacity(1); } });
  map.on('mouseout', () => { if (Place.ghost) Place.ghost.setOpacity(0); });
}

// ---- 「追加」ボタンから出る、危険個所／見どころの選択（編集モード）----
function closeAddChooser() { const p = $('#add-pop'); if (p) p.hidden = true; }
function toggleAddChooser() {
  const p = $('#add-pop');
  if (!p) return;
  if (!p.hidden) { p.hidden = true; return; }
  if (Place.on) { Place.cancel(); return; }
  p.hidden = false;
}
