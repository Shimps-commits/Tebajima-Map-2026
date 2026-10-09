// UI文言（日英）・言語・テーマ。設定はlocalStorageに記憶する（使えなくても動く）。
// 編集モードの画面は日本語のみ（edit.js などに直接書いている）。
const STRINGS = {
  ja: {
    title: '出羽島・牟岐大島マップ', subtitle: '危険個所と見どころ', sample: 'サンプル',
    areaLabel: 'エリア', deba: '出羽島', oshima: '牟岐大島',
    strip: '参考情報です。出発前の確認とガイドの案内が前提です。',
    close: '閉じる', langLabel: '言語',
    dockList: '一覧', dockFilter: '絞り込み', dockOffline: 'オフライン', dockInfo: '情報', dockEdit: '編集', dockAdd: 'ピン追加',
    locate: '現在地', zoomIn: '拡大', zoomOut: '縮小', mapType: '地図の種類',
    base_pale: '淡色地図', base_std: '標準地図', base_photo: '航空写真', base_relief: '地形図', base_osm: 'OpenStreetMap',
    desc: '説明', action: '対処法', severity: '危険度', category: '種別', updated: '更新日', coords: '座標',
    fromYou: '現在地から約 {d}', copy: 'コピー', copied: '座標をコピーしました', photo: '写真',
    listTitle: '危険個所の一覧', listSearch: '名称・説明で検索', items: '{n} 件', csv: 'CSVで保存', noMatch: '条件に合う危険個所はありません。',
    filterTitle: '絞り込み', byCategory: '種別', bySeverity: '危険度', filterAll: 'すべて表示', showN: '{n} 件を表示',
    locating: '現在地を取得中…', located: '現在地を表示中', accuracy: '精度 ±{n} m', localOnly: '端末内のみで使用', locStop: '停止',
    locDenied: '位置情報の利用が許可されていません。端末とブラウザの設定で、このサイトの位置情報を許可してください。',
    locUnavailable: '現在地を取得できません。屋外で、空の見える場所でもう一度お試しください。',
    locTimeout: '現在地の取得に時間がかかっています。しばらくしてからもう一度お試しください。',
    locUnsupported: 'このブラウザは現在地の取得に対応していません。',
    locInsecure: '現在地の取得には https 接続が必要です。',
    offTitle: 'オフライン準備', offApp: 'アプリ本体と危険個所データ', offAppOk: '保存済み', offAppNo: '未保存',
    offAppNoHint: '電波のある場所で、このページを開き直してください。',
    offTiles: '保存済みの地図', offTilesUnit: '{n} 枚', offUsage: '端末内の使用量（目安）', offNet: '通信状態', offOnline: 'オンライン', offOffline: 'オフライン',
    offSteps: '出発前の準備（電波のある港などで）',
    offS1: 'このページを開いたまま、上の「アプリ本体と危険個所データ」が「保存済み」になるのを確認します。',
    offS2: '出羽島と牟岐大島の周辺を、拡大・移動しながら一通り見ます。見た範囲の地図だけが端末に保存されます。',
    offS3: '機内モードにして、地図・ピン・現在地が表示されることを確認します。',
    offHome: 'ホーム画面に追加すると、アプリのように起動できます。',
    offHomeIos: 'iPhone：共有ボタン →「ホーム画面に追加」', offHomeAndroid: 'Android：メニュー →「ホーム画面に追加」', offInstall: 'ホーム画面に追加',
    offNote: '見ていない範囲の地図は、オフラインでは表示されません。端末の容量不足や、長期間開かなかった場合は、保存内容が消えることがあります。出発前に必ず確認してください。',
    offUnsupported: 'この環境ではオフライン保存を利用できません（https 接続が必要です）。',
    infoTitle: '安全のご注意・情報', safetyTitle: '安全のご注意',
    safety1: '出発前に、危険個所の一覧を必ず確認してください。',
    safety2: '現地では、ガイドの口頭案内に従ってください。',
    safety3: 'このマップは参考情報です。安全を保証するものではありません。スマホの画面だけに頼らないでください。',
    safety4: '接近を知らせる通知機能はありません。「通知がないから安全」ではありません。',
    safety5: '現在地は、スマホのGPSで端末内だけに表示します。外部へは送信しません。電波や空の状況により、位置がずれたり表示されなかったりします。',
    safety6: '地図は、事前に見た範囲だけがオフラインで表示されます。',
    sampleNote: '表示中のピンは、すべて「サンプル（ダミー）」です。実在の危険個所を示すものではありません。',
    themeTitle: '表示設定', themeAuto: '自動', themeLight: 'ライト', themeDark: 'ダーク', langTitle: '言語',
    creditsTitle: '出典・ライセンス', creditGSI: '地図：国土地理院（地理院タイル）', creditOSM: '地図：© OpenStreetMap contributors', creditLeaflet: '地図ライブラリ：Leaflet',
    noindexNote: 'このページは検索エンジンに載せない設定です。URLは、参加者だけにお渡しください。',
    updateReady: '新しいバージョンがあります', reload: '再読み込み', dataError: 'データを読み込めませんでした',

    // ---- 見どころ・マイピン ----
    kindHazard: '危険個所', kindSpot: '見どころ', kindHazardShort: '危険', kindSpotShort: '見どころ',
    toggleHazard: '危険個所の表示', toggleSpot: '見どころの表示', showKinds: '表示する', fHazards: '危険個所', fSpots: '見どころ',
    tabAll: 'すべて', spotDesc: 'おすすめポイント', spotTip: 'ヒント・楽しみ方', author: '投稿：{n}',
    chipMine: 'マイピン', chipVisitor: 'みんなの投稿', mineNoteShort: 'あなたの端末の中だけに保存されています',
    btnEdit: '編集', btnDelete: '削除', btnSend: '運営に送る', btnSave: '保存', btnCancel: 'キャンセル',
    dockAddSpot: '見どころを追加',
    placeTap: '地図をタップして場所を指定', placeClick: '地図をクリックして場所を指定',
    placeSub: '置いたあとも、ドラッグで位置を直せます', placeCenter: '中央に置く',
    mineTitleNew: '見どころを追加', mineTitleEdit: 'マイピンを編集',
    fType: '種別', fName: 'なまえ', fNamePh: '例：朝日がきれいな岬', fComment: 'おすすめポイント', fCommentPh: '例：朝日が海から昇るのが見えます',
    fNick: 'ニックネーム（任意）', fPos: '位置', fDrag: 'ドラッグで微調整', needName: 'なまえを入力してください',
    mineIntro: 'このピンは、あなたの端末の中だけに保存されます。「運営に送る」と、みんなの地図に載せる提案ができます。',
    mineSaved: 'マイピンを保存しました', mineDeleted: 'マイピンを削除しました', mineDelAsk: 'このマイピンを削除しますか？',
    discardAsk: '入力内容を破棄しますか？', discardMsg: '保存していない内容は失われます。', keepEditing: '編集を続ける', discard: '破棄する', delete: '削除する',
    sendTitle: '運営に送る', sendMsg: '提案文を作りました。送り方を選んでください。あなたが送るまで、内容はどこにも送信されません。',
    sendShare: '共有する', sendMail: 'メールで送る', sendCopy: 'コピーする', sendCopied: 'コピーしました。メッセージなどに貼り付けて送ってください',
    sendHeader: '【見どころの提案】出羽島・牟岐大島マップ', sendPlace: '場所', sendName: 'なまえ', sendNote: 'おすすめ', sendNick: 'ニックネーム',
    sendData: '以下は運営用のデータです（消さないでください）',
    mineSection: 'マイピン', mineCount: '{n} 件（この端末の中だけ）', mineSendAll: 'すべて運営に送る', mineExport: 'ファイルで保存',
    mineClear: 'すべて削除', mineClearAsk: 'マイピンをすべて削除しますか？', mineNone: 'まだありません。下の「＋」から、見どころを追加できます。',
    sendNow: '送信する', sendMsgDirect: '運営に送ります。内容を確認したうえで、みんなの地図に載る場合があります。',
    sendSending: '送信中…', sendOk: '送信しました。確認後、みんなの地図に載る場合があります', sendFail: '送信できませんでした。電波のある場所で、もう一度お試しください',
    sentNote: '運営に送信済みです（確認後に、みんなの地図に載る場合があります）',
    dataUpdated: 'データの更新：{d}', dataCached: '前回取得したデータを表示しています'
  },
  en: {
    title: 'Tebajima & Mugi-Oshima', subtitle: 'Hazards & spots', sample: 'SAMPLE',
    areaLabel: 'Area', deba: 'Tebajima', oshima: 'Mugi-Oshima',
    strip: 'Reference only. Check before you go and follow your guide.',
    close: 'Close', langLabel: 'Language',
    dockList: 'List', dockFilter: 'Filter', dockOffline: 'Offline', dockInfo: 'Info', dockEdit: 'Edit', dockAdd: 'Add pin',
    locate: 'My location', zoomIn: 'Zoom in', zoomOut: 'Zoom out', mapType: 'Map type',
    base_pale: 'Pale map', base_std: 'Standard map', base_photo: 'Aerial photo', base_relief: 'Relief map', base_osm: 'OpenStreetMap',
    desc: 'Description', action: 'What to do', severity: 'Level', category: 'Type', updated: 'Updated', coords: 'Coordinates',
    fromYou: 'About {d} from you', copy: 'Copy', copied: 'Coordinates copied', photo: 'Photo',
    listTitle: 'All hazards', listSearch: 'Search by name or description', items: '{n} items', csv: 'Save as CSV', noMatch: 'No hazards match.',
    filterTitle: 'Filter', byCategory: 'Type', bySeverity: 'Level', filterAll: 'Show all', showN: 'Show {n}',
    locating: 'Getting your location…', located: 'Showing your location', accuracy: 'Accuracy ±{n} m', localOnly: 'Used on this device only', locStop: 'Stop',
    locDenied: 'Location access is not allowed. Please allow location for this site in your device and browser settings.',
    locUnavailable: 'Your location is unavailable. Please try again outdoors with a clear view of the sky.',
    locTimeout: 'Getting your location is taking too long. Please try again in a moment.',
    locUnsupported: 'This browser does not support location.',
    locInsecure: 'Location requires an https connection.',
    offTitle: 'Offline preparation', offApp: 'App and hazard data', offAppOk: 'Saved', offAppNo: 'Not saved yet',
    offAppNoHint: 'Reopen this page where you have a signal.',
    offTiles: 'Saved map tiles', offTilesUnit: '{n} tiles', offUsage: 'Storage used on this device (approx.)', offNet: 'Connection', offOnline: 'Online', offOffline: 'Offline',
    offSteps: 'Before departure (where you have a signal, e.g. at the port)',
    offS1: 'Keep this page open and confirm that "App and hazard data" above shows "Saved".',
    offS2: 'Zoom and pan around Tebajima and Mugi-Oshima. Only the map areas you view are saved to your device.',
    offS3: 'Turn on airplane mode and confirm that the map, pins and your location still work.',
    offHome: 'Add this page to your home screen to launch it like an app.',
    offHomeIos: 'iPhone: Share button → "Add to Home Screen"', offHomeAndroid: 'Android: menu → "Add to Home screen"', offInstall: 'Add to home screen',
    offNote: 'Map areas you have not viewed will not appear offline. Saved data may be deleted if your device runs low on storage or the app is not opened for a long time. Always check before you depart.',
    offUnsupported: 'Offline saving is not available here (https is required).',
    infoTitle: 'Safety notice & info', safetyTitle: 'Safety notice',
    safety1: 'Review the list of hazards before departure.',
    safety2: "On site, follow your guide's spoken instructions.",
    safety3: 'This map is for reference only and does not guarantee safety. Do not rely on your phone screen alone.',
    safety4: 'There are no approach alerts. Never assume you are safe just because nothing has warned you.',
    safety5: 'Your location is shown on this device only and is never sent anywhere. It may be inaccurate or unavailable depending on signal and sky view.',
    safety6: 'Only the map areas you have viewed beforehand are available offline.',
    sampleNote: 'All pins shown are SAMPLE (dummy) data and do not represent real hazards.',
    themeTitle: 'Appearance', themeAuto: 'Auto', themeLight: 'Light', themeDark: 'Dark', langTitle: 'Language',
    creditsTitle: 'Credits', creditGSI: 'Map: Geospatial Information Authority of Japan (GSI tiles)', creditOSM: 'Map: © OpenStreetMap contributors', creditLeaflet: 'Map library: Leaflet',
    noindexNote: 'This page is not indexed by search engines. Share the URL only with participants.',
    updateReady: 'A new version is available', reload: 'Reload', dataError: 'Failed to load data',

    // ---- Spots & My pins ----
    kindHazard: 'Hazards', kindSpot: 'Spots', kindHazardShort: 'Hazards', kindSpotShort: 'Spots',
    toggleHazard: 'Show hazards', toggleSpot: 'Show spots', showKinds: 'Show', fHazards: 'Hazards', fSpots: 'Spots',
    tabAll: 'All', spotDesc: "Why it's special", spotTip: 'Tips', author: 'By {n}',
    chipMine: 'My pin', chipVisitor: 'Visitor pick', mineNoteShort: 'Saved only on your device',
    btnEdit: 'Edit', btnDelete: 'Delete', btnSend: 'Send to organizers', btnSave: 'Save', btnCancel: 'Cancel',
    dockAddSpot: 'Add a spot',
    placeTap: 'Tap the map to choose a place', placeClick: 'Click the map to choose a place',
    placeSub: 'You can drag the pin to adjust it afterwards', placeCenter: 'Place at center',
    mineTitleNew: 'Add a spot', mineTitleEdit: 'Edit my pin',
    fType: 'Type', fName: 'Name', fNamePh: 'e.g. Sunrise point', fComment: "Why it's special", fCommentPh: 'e.g. You can watch the sun rise over the sea',
    fNick: 'Nickname (optional)', fPos: 'Location', fDrag: 'Drag to fine-tune', needName: 'Please enter a name',
    mineIntro: 'This pin is saved only on your device. Use "Send to organizers" to suggest it for the shared map.',
    mineSaved: 'Saved to My pins', mineDeleted: 'My pin deleted', mineDelAsk: 'Delete this pin?',
    discardAsk: 'Discard your changes?', discardMsg: 'Unsaved changes will be lost.', keepEditing: 'Keep editing', discard: 'Discard', delete: 'Delete',
    sendTitle: 'Send to organizers', sendMsg: 'Your suggestion is ready. Choose how to send it. Nothing is sent anywhere until you send it yourself.',
    sendShare: 'Share', sendMail: 'Send by email', sendCopy: 'Copy', sendCopied: 'Copied. Paste it into a message to send it.',
    sendHeader: '[Spot suggestion] Tebajima & Mugi-Oshima Map', sendPlace: 'Place', sendName: 'Name', sendNote: 'Why it\'s special', sendNick: 'Nickname',
    sendData: 'The data below is for the organizers (please do not delete it)',
    mineSection: 'My pins', mineCount: '{n} on this device only', mineSendAll: 'Send all to organizers', mineExport: 'Save as file',
    mineClear: 'Delete all', mineClearAsk: 'Delete all of your pins?', mineNone: 'None yet. Tap "+" below to add a spot.',
    sendNow: 'Send', sendMsgDirect: 'This will be sent to the organizers. After review, it may appear on the shared map.',
    sendSending: 'Sending…', sendOk: 'Sent. After review, it may appear on the shared map.', sendFail: 'Could not send. Please try again where you have a signal.',
    sentNote: 'Sent to the organizers (it may appear on the shared map after review)',
    dataUpdated: 'Data updated: {d}', dataCached: 'Showing the data fetched last time'
  }
};

let lang = (navigator.language || '').startsWith('ja') ? 'ja' : 'en';
try { lang = localStorage.getItem('lang') || lang; } catch (e) {}
if (!STRINGS[lang]) lang = 'ja';

function t(key, vars) {
  let s = STRINGS[lang] && STRINGS[lang][key];
  if (s == null) s = STRINGS.ja[key];
  if (s == null) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}
function pick(obj, base) { return obj[base + '_' + lang] || obj[base + '_ja'] || obj[base + '_en'] || ''; }

function applyI18n(root) {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  r.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  r.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', t(el.dataset.i18nTitle)));
  r.querySelectorAll('[data-i18n-ph]').forEach(el => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
}

function setLang(l) {
  lang = STRINGS[l] ? l : 'ja';
  try { localStorage.setItem('lang', lang); } catch (e) {}
  document.documentElement.lang = lang;
  document.title = lang === 'ja' ? '出羽島・牟岐大島マップ' : 'Tebajima & Mugi-Oshima Map';
  applyI18n();
  document.querySelectorAll('#lang-seg [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

// ---- テーマ（自動／ライト／ダーク） ----
let themePref = 'auto';
try { themePref = localStorage.getItem('theme') || 'auto'; } catch (e) {}
const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
function effectiveTheme() { return themePref === 'dark' || (themePref === 'auto' && mqDark.matches) ? 'dark' : 'light'; }
function applyTheme() {
  const eff = effectiveTheme();
  document.documentElement.dataset.theme = themePref;
  document.documentElement.dataset.eff = eff;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', eff === 'dark' ? '#0b1220' : '#0b3d5c');
}
function setTheme(p) {
  themePref = ['auto', 'light', 'dark'].includes(p) ? p : 'auto';
  try { localStorage.setItem('theme', themePref); } catch (e) {}
  applyTheme();
}
if (mqDark.addEventListener) mqDark.addEventListener('change', applyTheme);
