// 現在地表示。位置情報は端末内の表示にのみ使い、外部へ送信しない。
let locWatchId = null, locMarker = null, locCircle = null, firstFix = true;

function showLocMsg(key) {
  const el = document.getElementById('loc-msg');
  el.textContent = t(key); el.dataset.key = key; el.hidden = false;
}
function hideLocMsg() { document.getElementById('loc-msg').hidden = true; }

function stopLocate() {
  if (locWatchId !== null) navigator.geolocation.clearWatch(locWatchId);
  locWatchId = null;
  if (locMarker) { locMarker.remove(); locMarker = null; }
  if (locCircle) { locCircle.remove(); locCircle = null; }
  document.getElementById('locate-btn').classList.remove('on');
  hideLocMsg();
}

function startLocate() {
  if (!('geolocation' in navigator)) return showLocMsg('locUnsupported');
  if (!window.isSecureContext) return showLocMsg('locInsecure');
  showLocMsg('locating');
  firstFix = true;
  document.getElementById('locate-btn').classList.add('on');
  locWatchId = navigator.geolocation.watchPosition(pos => {
    const ll = [pos.coords.latitude, pos.coords.longitude];
    if (!locMarker) {
      locMarker = L.circleMarker(ll, { radius: 9, color: '#fff', weight: 3, fillColor: '#1d4ed8', fillOpacity: 1 }).addTo(map);
      locCircle = L.circle(ll, { radius: pos.coords.accuracy, color: '#1d4ed8', weight: 1, fillOpacity: .1 }).addTo(map);
    } else { locMarker.setLatLng(ll); locCircle.setLatLng(ll).setRadius(pos.coords.accuracy); }
    if (firstFix) { map.setView(ll, Math.max(map.getZoom(), 16)); firstFix = false; }
    showLocMsg('located');
  }, err => {
    const key = err.code === 1 ? 'locDenied' : err.code === 3 ? 'locTimeout' : 'locUnavailable';
    stopLocate();
    showLocMsg(key);
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
}

document.getElementById('locate-btn').addEventListener('click', () => {
  locWatchId === null ? startLocate() : stopLocate();
});
