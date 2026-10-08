// 現在地表示。位置情報は端末内の表示にだけ使い、外部へは送信しない。
const Locate = {
  state: 'off',            // off | searching | on | error
  watchId: null, marker: null, circle: null, pos: null, acc: null, first: true, errKey: null
};

function locateBtnHTML() { return ic('locate', 24); }

function renderLocUI() {
  const btn = $('#btn-locate'), chip = $('#loc-chip');
  btn.classList.toggle('on', Locate.state === 'on');
  btn.classList.toggle('searching', Locate.state === 'searching');
  btn.setAttribute('aria-pressed', String(Locate.state === 'on'));
  if (Locate.state === 'off') { chip.hidden = true; return; }
  chip.hidden = false;
  chip.className = 'glass' + (Locate.state === 'error' ? ' err' : '');
  if (Locate.state === 'searching') {
    chip.innerHTML = '<span class="spin"></span><span class="loc-t">' + esc(t('locating')) + '</span><button type="button" class="loc-x" aria-label="' + esc(t('locStop')) + '">' + ic('x', 16) + '</button>';
  } else if (Locate.state === 'on') {
    chip.innerHTML = '<span class="live"></span><span class="loc-t"><b>' + esc(t('located')) + '</b><small>' +
      (Locate.acc != null ? esc(t('accuracy', { n: Math.round(Locate.acc) })) + ' · ' : '') + esc(t('localOnly')) +
      '</small></span><button type="button" class="loc-stop">' + esc(t('locStop')) + '</button>';
  } else {
    chip.innerHTML = '<span class="loc-i">' + ic('alert', 18) + '</span><span class="loc-t">' + esc(t(Locate.errKey)) + '</span><button type="button" class="loc-x" aria-label="' + esc(t('close')) + '">' + ic('x', 16) + '</button>';
  }
  $$('.loc-x, .loc-stop', chip).forEach(b => b.addEventListener('click', stopLocate));
}

function stopLocate() {
  if (Locate.watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(Locate.watchId);
  Locate.watchId = null;
  if (Locate.marker) { Locate.marker.remove(); Locate.marker = null; }
  if (Locate.circle) { Locate.circle.remove(); Locate.circle = null; }
  Locate.state = 'off'; Locate.pos = null; Locate.acc = null; Locate.errKey = null;
  renderLocUI(); updateDetailDistance();
}

function locFail(key) {
  if (Locate.watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(Locate.watchId);
  Locate.watchId = null;
  if (Locate.marker) { Locate.marker.remove(); Locate.marker = null; }
  if (Locate.circle) { Locate.circle.remove(); Locate.circle = null; }
  Locate.state = 'error'; Locate.errKey = key; Locate.pos = null;
  renderLocUI();
}

function startLocate() {
  if (!('geolocation' in navigator)) return locFail('locUnsupported');
  if (!window.isSecureContext) return locFail('locInsecure');
  Locate.state = 'searching'; Locate.first = true; Locate.errKey = null;
  renderLocUI();
  Locate.watchId = navigator.geolocation.watchPosition(pos => {
    const ll = [pos.coords.latitude, pos.coords.longitude];
    Locate.pos = ll; Locate.acc = pos.coords.accuracy; Locate.state = 'on';
    if (!Locate.marker) {
      Locate.marker = L.marker(ll, { icon: L.divIcon({ className: 'me-wrap', html: '<div class="me"><i></i></div>', iconSize: [24, 24], iconAnchor: [12, 12] }), interactive: false, keyboard: false, zIndexOffset: 500 }).addTo(map);
      Locate.circle = L.circle(ll, { radius: pos.coords.accuracy, color: '#2563eb', weight: 1, fillColor: '#2563eb', fillOpacity: 0.1, interactive: false }).addTo(map);
    } else { Locate.marker.setLatLng(ll); Locate.circle.setLatLng(ll).setRadius(pos.coords.accuracy); }
    if (Locate.first) { Locate.first = false; focusLatLng(ll, Math.max(map.getZoom(), 16)); }
    renderLocUI(); updateDetailDistance();
  }, err => {
    locFail(err.code === 1 ? 'locDenied' : err.code === 3 ? 'locTimeout' : 'locUnavailable');
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
}

function onLocateButton() {
  if (Locate.state === 'off' || Locate.state === 'error') startLocate();
  else if (Locate.state === 'on' && Locate.pos) focusLatLng(Locate.pos, Math.max(map.getZoom(), 16));   // 現在地に戻る
}
