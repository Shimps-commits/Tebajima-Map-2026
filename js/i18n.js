// UI文言（日英）と言語切替。言語はlocalStorageに記憶（失敗しても動く）。
const STRINGS = {
  ja: {
    title: '危険個所マップ', sample: 'サンプル', desc: '説明', action: '対処法', severity: '危険度',
    category: '種別', close: '閉じる', photo: '写真', updated: '更新日',
    notice: '【ご注意】このマップは参考情報です。安全の保証ではありません。出発前に危険個所の一覧を確認し、現地ではガイドの案内に従ってください。スマホの表示だけに頼らないでください。',
    deba: '出羽島', oshima: '牟岐大島', lang: 'English',
    offline: 'オフライン', offTitle: 'オフライン準備', offApp: 'アプリ本体と危険個所データ', offTiles: '保存済みの地図', offTilesUnit: '枚', offOn: '保存済み ✓', offOff: 'まだ保存されていません（電波のある場所で、このページを開き直してください）',
    offOnline: '現在の通信状態', offOnlineY: 'オンライン', offOnlineN: 'オフライン', offUsage: '端末内の使用量（目安）',
    offSteps: '出発前の準備（電波のある港などで）', offS1: 'このページを開いたままにして、上の「アプリ本体」が「保存済み ✓」になるのを確認します。',
    offS2: '出羽島と牟岐大島の周辺を、拡大・移動しながら一通り見ます。見た範囲の地図だけが端末に保存されます（保存枚数が増えます）。',
    offS3: '機内モードにして、地図・ピン・現在地が表示されることを確認します。',
    offHome: 'ホーム画面に追加すると、アプリのように起動できます。iPhone：共有ボタン →「ホーム画面に追加」／Android：メニュー →「ホーム画面に追加」。',
    offNote: '見ていない範囲の地図は、オフラインでは表示されません。端末の容量不足や、長期間開かなかった場合は、保存内容が消えることがあります。出発前に必ず確認してください。',
    list: '一覧', csv: 'CSVで保存', listHint: '行をタップすると地図で場所を表示します。', name: '名称', count: '件', noData: '危険個所はまだ登録されていません。',
    filter: '絞り込み', filterAll: 'すべて表示', locate: '現在地', locating: '現在地を取得中…', located: '現在地を表示しています（端末内のみで使用。外部へは送信しません）',
    locDenied: '位置情報の利用が許可されていません。端末の設定とブラウザの設定で、このサイトの位置情報を許可してください。',
    locUnavailable: '現在地を取得できません。屋外で空が見える場所でもう一度お試しください。',
    locTimeout: '現在地の取得に時間がかかっています。しばらくしてからもう一度お試しください。',
    locUnsupported: 'このブラウザは現在地の取得に対応していません。', locInsecure: '現在地の取得には https 接続が必要です。'
  },
  en: {
    title: 'Hazard Map', sample: 'SAMPLE', desc: 'Description', action: 'What to do', severity: 'Level',
    category: 'Type', close: 'Close', photo: 'Photo', updated: 'Updated',
    notice: 'Notice: This map is for reference only and does not guarantee safety. Review the list of hazards before departure, and follow your guide\'s instructions on site. Do not rely on your phone screen alone.',
    deba: 'Tebajima', oshima: 'Mugi-Oshima', lang: '日本語',
    offline: 'Offline', offTitle: 'Offline preparation', offApp: 'App and hazard data', offTiles: 'Saved map tiles', offTilesUnit: ' tiles', offOn: 'Saved ✓', offOff: 'Not saved yet (reopen this page where you have a signal)',
    offOnline: 'Connection', offOnlineY: 'Online', offOnlineN: 'Offline', offUsage: 'Storage used on this device (approx.)',
    offSteps: 'Before departure (where you have a signal, e.g. at the port)', offS1: 'Keep this page open and confirm that "App and hazard data" above shows "Saved ✓".',
    offS2: 'Zoom and pan around Tebajima and Mugi-Oshima. Only the map areas you view are saved to your device (the tile count will increase).',
    offS3: 'Turn on airplane mode and confirm that the map, pins and your location still work.',
    offHome: 'Add this page to your home screen to launch it like an app. iPhone: Share button → "Add to Home Screen". Android: menu → "Add to Home screen".',
    offNote: 'Map areas you have not viewed will not appear offline. Saved data may be deleted if your device runs low on storage or the app is not opened for a long time. Always check before you depart.',
    list: 'List', csv: 'Save as CSV', listHint: 'Tap a row to show its location on the map.', name: 'Name', count: ' items', noData: 'No hazards have been registered yet.',
    filter: 'Filter', filterAll: 'Show all', locate: 'My location', locating: 'Getting your location…', located: 'Showing your location (used on this device only; never sent anywhere).',
    locDenied: 'Location access is not allowed. Please allow location for this site in your device and browser settings.',
    locUnavailable: 'Your location is unavailable. Please try again outdoors with a clear view of the sky.',
    locTimeout: 'Getting your location is taking too long. Please try again in a moment.',
    locUnsupported: 'This browser does not support location.', locInsecure: 'Location requires an https connection.'
  }
};

let lang = (navigator.language || '').startsWith('ja') ? 'ja' : 'en';
try { lang = localStorage.getItem('lang') || lang; } catch (e) {}
if (!STRINGS[lang]) lang = 'ja';

function t(key) { return STRINGS[lang][key] || key; }
function pick(obj, base) { return obj[base + '_' + lang] || obj[base + '_ja'] || ''; }
function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch (e) {}
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}
