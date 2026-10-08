// 共通UI部品：DOMヘルパー、パネル（スマホ＝下のシート／PC＝横のパネル）、トースト、ダイアログ。
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const mqWide = window.matchMedia('(min-width: 900px)');
const isWide = () => mqWide.matches;
const hoverCapable = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function haversine(a, b) {                       // 2点間の距離(m)
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fmtDistance(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1) + ' km'; }

// ---------- パネル ----------
// 1つだけ開く。スマホ＝画面下のシート、PC＝右のパネル（編集モードは左の固定サイドバー）。
const Panel = (() => {
  const el = $('#panel'), titleEl = $('#panel-title'), subEl = $('#panel-sub'), iconEl = $('#panel-icon'),
    bodyEl = $('#panel-body'), footEl = $('#panel-foot'), closeBtn = $('#panel-close'),
    backdrop = $('#backdrop'), grip = $('#panel-grip');
  let cur = null, lastFocus = null, hideTimer = null;

  function paint() {
    el.dataset.panel = cur.id;
    el.classList.toggle('bare', !!cur.bare);
    titleEl.textContent = cur.title || '';
    subEl.textContent = cur.sub || ''; subEl.hidden = !cur.sub;
    iconEl.innerHTML = cur.icon ? ic(cur.icon, 18) : ''; iconEl.hidden = !cur.icon;
    closeBtn.hidden = !!cur.noClose;
    bodyEl.innerHTML = ''; footEl.innerHTML = '';
    const box = document.createElement('div');        // 描画のたびに新しい要素にする（イベントが重ならないように）
    bodyEl.appendChild(box);
    cur.render(box, footEl);
    footEl.hidden = !footEl.childNodes.length;
  }

  function open(spec) {
    if (cur && cur.id !== spec.id) { const old = cur; cur = null; old.onClose && old.onClose('replace'); }
    const first = !cur;
    const sameId = cur && cur.id === spec.id;
    cur = spec;
    if (first) lastFocus = document.activeElement;
    clearTimeout(hideTimer);
    paint();
    if (!sameId) bodyEl.scrollTop = 0;
    el.hidden = false;
    document.body.classList.add('panel-open');
    document.body.classList.toggle('panel-modal', spec.modal !== false && !isWide());
    backdrop.hidden = !(spec.modal !== false && !isWide());
    requestAnimationFrame(() => el.classList.add('open'));
    if (first && spec.focus !== false) setTimeout(() => { try { el.focus({ preventScroll: true }); } catch (e) {} }, 30);
    if (api.onChange) api.onChange(cur);
  }

  function refresh() {                           // 内容だけ作り直す（スクロール位置は維持）
    if (!cur) return;
    const st = bodyEl.scrollTop;
    paint();
    bodyEl.scrollTop = st;
  }

  function close(reason) {
    const c = cur;
    if (!c) return;
    cur = null;
    c.onClose && c.onClose(reason || 'close');
    if (api.onIdle) { api.onIdle(); if (cur) return; }   // 編集モード(PC)は、メニューに戻る
    el.classList.remove('open');
    document.body.classList.remove('panel-open', 'panel-modal');
    backdrop.hidden = true;
    hideTimer = setTimeout(() => { if (!cur) el.hidden = true; }, 340);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    if (api.onChange) api.onChange(null);
  }

  async function requestClose() {
    if (!cur) return true;
    if (cur.noClose) return true;
    if (cur.canClose && !(await cur.canClose())) return false;
    close();
    return true;
  }

  closeBtn.innerHTML = ic('x', 18);
  closeBtn.addEventListener('click', () => requestClose());
  backdrop.addEventListener('click', () => requestClose());

  // 下へスワイプして閉じる（スマホ）
  let startY = 0, dragging = false, dy = 0;
  grip.addEventListener('pointerdown', e => {
    if (isWide() || !cur) return;
    dragging = true; startY = e.clientY; dy = 0; el.style.transition = 'none';
    try { grip.setPointerCapture(e.pointerId); } catch (x) {}
  });
  grip.addEventListener('pointermove', e => {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - startY);
    el.style.transform = 'translateY(' + dy + 'px)';
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false; el.style.transition = ''; el.style.transform = '';
    if (dy > 90) requestClose();
  };
  grip.addEventListener('pointerup', endDrag);
  grip.addEventListener('pointercancel', endDrag);

  const api = {
    open, close, refresh, requestClose, onIdle: null, onChange: null,
    get current() { return cur; },
    isOpen: id => !!cur && (!id || cur.id === id),
    get el() { return el; }
  };
  return api;
})();

// ---------- トースト ----------
function toast(msg, o) {
  o = o || {};
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast' + (o.tone ? ' toast-' + o.tone : '');
  const m = document.createElement('span');
  m.className = 'toast-msg'; m.textContent = msg;
  el.appendChild(m);
  let timer;
  const dismiss = () => { clearTimeout(timer); el.classList.remove('in'); setTimeout(() => el.remove(), 260); };
  if (o.action) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'toast-act'; b.textContent = o.action.label;
    b.onclick = () => { dismiss(); o.action.fn(); };
    el.appendChild(b);
  }
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  timer = setTimeout(dismiss, o.ms || 4500);
  return { dismiss };
}

// ---------- ダイアログ ----------
const Dialog = { cur: null };
function dialog(spec) {
  return new Promise(resolve => {
    const root = document.createElement('div');
    root.className = 'dlg-wrap';
    root.setAttribute('role', 'alertdialog'); root.setAttribute('aria-modal', 'true');
    const box = document.createElement('div'); box.className = 'dlg';
    const h = document.createElement('h3'); h.className = 'dlg-title'; h.textContent = spec.title || '';
    const p = document.createElement('p'); p.className = 'dlg-msg'; p.textContent = spec.message || '';
    const row = document.createElement('div'); row.className = 'dlg-btns';
    box.appendChild(h); if (spec.message) box.appendChild(p); box.appendChild(row);
    root.appendChild(box);
    const prev = document.activeElement;
    const done = v => {
      root.remove(); Dialog.cur = null;
      if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) {} }
      resolve(v);
    };
    Dialog.cur = { cancel: () => done(null) };
    spec.buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = b.label;
      btn.className = 'btn btn-md' + (b.variant ? ' btn-' + b.variant : '');
      btn.onclick = () => done(b.value);
      row.appendChild(btn);
    });
    root.addEventListener('pointerdown', e => { if (e.target === root) done(null); });
    document.body.appendChild(root);
    const last = row.lastElementChild;
    if (last) last.focus();
  });
}
function confirmBox(title, message, okLabel, danger, cancelLabel) {
  return dialog({
    title, message,
    buttons: [{ label: cancelLabel || 'キャンセル', value: false }, { label: okLabel || 'OK', value: true, variant: danger ? 'danger' : 'primary' }]
  }).then(v => v === true);
}
function noticeBox(title, message, okLabel) {
  return dialog({ title, message, buttons: [{ label: okLabel || 'OK', value: true, variant: 'primary' }] });
}

// ---------- 地図の見える範囲（パネルやバーに隠れない範囲） ----------
function visibleInsets() {
  const mr = $('#map').getBoundingClientRect();
  let top = 0;
  ['#topbar', '#row2', '#strip'].forEach(s => { const e = $(s); if (e && !e.hidden) top = Math.max(top, e.getBoundingClientRect().bottom - mr.top); });
  top += 10;
  let bottom = $('#dock').offsetHeight + 28, right = 0, left = 0;
  const p = Panel.el;
  if (Panel.current && !p.hidden) {
    if (isWide()) { if (!document.body.classList.contains('edit-wide')) right = p.offsetWidth + 24; }
    else bottom = p.offsetHeight + 20;
  }
  return { top, bottom, left, right };
}

function copyText(text) {
  const done = () => toast(t('copied'));
  if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, done); return; }
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  ta.remove(); done();
}
