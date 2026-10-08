// 起動処理：画面部品の組み立てとイベントの接続。
applyTheme();
if (EDIT) {                                   // 地図を作る前に、編集モードのレイアウトを決める
  document.body.classList.add('edit');
  document.body.classList.toggle('edit-wide', isWide());
}
createMap();
initPlace();
buildChrome();
setLang(lang);
updateNetPill();
renderLocUI();

const PANEL_OF = { list: 'list', filter: 'filter', offline: 'offline', info: 'info', edit: 'edit-home' };
const FORM_PANELS = ['form', 'mine-form'];

function guard(fn) { Panel.requestClose().then(ok => { if (ok) fn(); }); }

function buildChrome() {
  // エリア切替
  $('#areas').innerHTML = Object.keys(AREAS).map(k => '<button type="button" data-area="' + k + '" data-i18n="' + k + '"></button>').join('');
  $$('#areas button').forEach(b => b.addEventListener('click', () => goArea(b.dataset.area)));
  map.on('moveend', syncArea);

  // 注意書き
  $('#strip').innerHTML = ic('alert', 15) + '<span data-i18n="strip"></span>' + ic('chevR', 14);
  $('#strip').addEventListener('click', () => guard(openInfo));

  // 右側のツール（地図の種類・危険個所／見どころの表示・ズーム）
  $('#map-tools').innerHTML =
    '<button id="btn-layers" class="fab glass" type="button" data-i18n-aria="mapType" aria-haspopup="true" aria-expanded="false">' + ic('layers', 20) + '</button>' +
    '<div class="kind-toggles glass">' +
    '<button type="button" class="fab-kind" data-kind="hazard" aria-pressed="true" data-i18n-aria="toggleHazard">' + ic('alert', 19) + '<span data-i18n="kindHazardShort"></span></button>' +
    '<button type="button" class="fab-kind" data-kind="spot" aria-pressed="true" data-i18n-aria="toggleSpot">' + ic('star', 19) + '<span data-i18n="kindSpotShort"></span></button></div>' +
    '<div class="zoom glass"><button id="zoom-in" type="button" data-i18n-aria="zoomIn">' + ic('plus', 20) + '</button>' +
    '<button id="zoom-out" type="button" data-i18n-aria="zoomOut">' + ic('minus', 20) + '</button></div>';
  $('#zoom-in').onclick = () => map.zoomIn();
  $('#zoom-out').onclick = () => map.zoomOut();
  $('#btn-layers').onclick = e => { e.stopPropagation(); toggleLayersPop(); };
  $$('.fab-kind').forEach(b => b.addEventListener('click', () => {
    setKindOn(b.dataset.kind, !kindOn[b.dataset.kind]);
    renderHazards();
    if (Panel.isOpen('filter') || Panel.isOpen('list')) Panel.refresh();
  }));
  buildLayersPop();

  // 現在地ボタン
  $('#btn-locate').innerHTML = ic('locate', 24);
  $('#btn-locate').setAttribute('data-i18n-aria', 'locate');
  $('#btn-locate').addEventListener('click', onLocateButton);

  // ドック（下のメニュー）。中央の「＋」：閲覧＝見どころを追加（マイピン）／編集＝危険個所か見どころを追加
  const items = [
    { act: 'list', icon: 'list', key: 'dockList' },
    { act: 'filter', icon: 'filter', key: 'dockFilter', badge: true },
    { act: 'add', icon: 'plus', key: EDIT ? 'dockAdd' : 'dockAddSpot', fab: true },
    EDIT ? { act: 'edit', icon: 'edit', key: 'dockEdit', badge: true } : { act: 'offline', icon: 'offline', key: 'dockOffline' },
    { act: 'info', icon: 'info', key: 'dockInfo' }
  ];
  $('#dock').innerHTML = items.map(i =>
    '<button type="button" class="dock-btn' + (i.fab ? ' dock-fab' : '') + '" data-act="' + i.act + '" aria-pressed="false"' + (i.fab ? ' data-i18n-aria="' + i.key + '"' : '') + '>' +
    '<span class="dock-ic">' + ic(i.icon, i.fab ? 26 : 22) + (i.badge ? '<i class="dock-badge" hidden></i>' : '') + '</span>' +
    '<span class="dock-lb" data-i18n="' + i.key + '"></span></button>').join('');
  $('#dock').addEventListener('click', e => {
    const b = e.target.closest('.dock-btn');
    if (!b) return;
    const act = b.dataset.act, pid = PANEL_OF[act];
    if (act === 'add') { EDIT ? toggleAddChooser() : (Place.on ? Place.cancel() : MyPins.startPlacing()); return; }
    if (pid && Panel.isOpen(pid) && !Panel.current.noClose) { Panel.requestClose(); return; }   // もう一度押すと閉じる
    const run = { list: openList, filter: openFilter, offline: openOffline, info: openInfo, edit: () => Edit.openHome() }[act];
    guard(run);
  });
  Panel.onChange = cur => {
    $$('#dock .dock-btn').forEach(b => b.setAttribute('aria-pressed', String(!!cur && PANEL_OF[b.dataset.act] === cur.id)));
    document.body.classList.toggle('form-open', !!cur && FORM_PANELS.includes(cur.id));
  };

  // 編集モード：「＋」を押したときの選択（危険個所／見どころ）
  if (EDIT) {
    const pop = document.createElement('div');
    pop.id = 'add-pop'; pop.className = 'glass'; pop.hidden = true;
    pop.innerHTML = '<button type="button" class="btn btn-md btn-add-hazard" data-kind="hazard">' + ic('alert', 17) + '危険個所を追加</button>' +
      '<button type="button" class="btn btn-md btn-add-spot" data-kind="spot">' + ic('star', 17) + '見どころを追加</button>';
    document.body.appendChild(pop);
    $$('button', pop).forEach(b => b.addEventListener('click', () => { pop.hidden = true; Edit.startPlacing(b.dataset.kind); }));
    document.addEventListener('pointerdown', e => { if (!pop.hidden && !e.target.closest('#add-pop') && !e.target.closest('.dock-fab')) pop.hidden = true; });
  }

  // 言語
  $$('#lang-seg [data-lang]').forEach(b => b.addEventListener('click', () => changeLang(b.dataset.lang)));
}

function syncArea() {
  const k = currentAreaKey();
  $$('#areas button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.area === k)));
}

// ---- 地図の種類（背景地図）----
function buildLayersPop() {
  $('#layers-pop').innerHTML = BASES.map(b =>
    '<button type="button" class="base-card" data-id="' + b.id + '" aria-pressed="' + (b.id === baseId) + '">' +
    '<span class="base-thumb"><img alt="" data-src="' + esc(thumbUrl(b)) + '"></span><span class="base-name">' + esc(t('base_' + b.id)) + '</span></button>').join('');
  $$('#layers-pop .base-card').forEach(c => c.addEventListener('click', () => {
    setBase(c.dataset.id);
    $$('#layers-pop .base-card').forEach(x => x.setAttribute('aria-pressed', String(x === c)));
    closeLayersPop();
  }));
}
function toggleLayersPop() {
  const pop = $('#layers-pop');
  if (!pop.hidden) return closeLayersPop();
  $$('#layers-pop img').forEach(i => { if (!i.src && i.dataset.src) i.src = i.dataset.src; });   // 開いたときだけ見本を読み込む
  pop.hidden = false;
  $('#btn-layers').setAttribute('aria-expanded', 'true');
}
function closeLayersPop() {
  $('#layers-pop').hidden = true;
  $('#btn-layers').setAttribute('aria-expanded', 'false');
}
document.addEventListener('pointerdown', e => {
  if (!$('#layers-pop').hidden && !e.target.closest('#layers-pop') && !e.target.closest('#btn-layers')) closeLayersPop();
});

// ---- 言語切替 ----
function changeLang(l) {
  setLang(l);
  if (hazardData) renderHazards();
  buildLayersPop();
  renderLocUI();
  updateNetPill();
  const cur = Panel.current;
  if (cur && !['form', 'cats', 'mine-form', 'import'].includes(cur.id)) Panel.refresh();
}

// ---- キーボード ----
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (Dialog.cur) { Dialog.cur.cancel(); return; }
  if (!$('#layers-pop').hidden) { closeLayersPop(); return; }
  const ap = $('#add-pop');
  if (ap && !ap.hidden) { ap.hidden = true; return; }
  if (Place.on) { Place.cancel(); return; }
  if (Panel.current && !Panel.current.noClose) Panel.requestClose();
});

// ---- 起動 ----
loadHazards().then(() => {
  syncArea();
  if (EDIT) initEdit();
}).catch(err => {
  console.error(err);
  toast(t('dataError'), { tone: 'warn', ms: 9000 });
});
