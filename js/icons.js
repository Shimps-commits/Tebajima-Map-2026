// アイコン（インラインSVG）。UIアイコンと、種別用のピクトグラム（GLYPHS）。
// 24x24の線画。色は currentColor（ピン内では --pg）で決まる。
const UI_ICONS = {
  list: '<path d="M9 6.5h11.5M9 12h11.5M9 17.5h11.5"/><path d="M4 6.5h.01M4 12h.01M4 17.5h.01"/>',
  filter: '<path d="M4 6.5h8.5M17.5 6.5H20M4 12h2.5M11.5 12H20M4 17.5h10M19 17.5h1"/><circle cx="15" cy="6.5" r="2.5"/><circle cx="9" cy="12" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',
  offline: '<path d="M7 18.5a4.5 4.5 0 0 1-.7-8.95A6.5 6.5 0 0 1 18.9 10.6 4 4 0 0 1 17 18.5"/><path d="M12 11.5v8m0 0-2.8-2.8m2.8 2.8 2.8-2.8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>',
  shield: '<path d="M12 3 4.5 6v5.6c0 4.4 3.1 7.7 7.5 9.4 4.4-1.7 7.5-5 7.5-9.4V6L12 3z"/><path d="m8.8 12 2.2 2.3 4.2-4.6"/>',
  locate: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  layers: '<path d="m12 3.5-8.5 4.5 8.5 4.5L20.5 8 12 3.5z"/><path d="m3.5 12 8.5 4.5 8.5-4.5"/><path d="m3.5 16 8.5 4.5 8.5-4.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  upload: '<path d="M12 16V5m0 0-4 4m4-4 4 4M5 20h14"/>',
  undo: '<path d="M3.5 8v5h5"/><path d="M3.9 12.6A8.5 8.5 0 1 1 6.3 18"/>',
  redo: '<path d="M20.5 8v5h-5"/><path d="M20.1 12.6A8.5 8.5 0 1 0 17.7 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  wifi: '<path d="M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10.5 10.5 0 0 1 13 0M8.7 16a5.5 5.5 0 0 1 6.6 0"/><path d="M12 19.5v.01"/>',
  wifiOff: '<path d="M3 3l18 18"/><path d="M8.7 16a5.5 5.5 0 0 1 4.1-1.4M5.5 12.5a10.5 10.5 0 0 1 3.6-2.1M2.5 9a15 15 0 0 1 4.6-2.8M12 19.5v.01M15.5 6.4A15 15 0 0 1 21.5 9M16.6 10.4a10.5 10.5 0 0 1 1.9 2.1"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  tap: '<path d="M9 11V5.5a1.8 1.8 0 0 1 3.6 0V11"/><path d="M12.6 10.5a1.8 1.8 0 0 1 3.6.4v1.1a1.8 1.8 0 0 1 3.5.5V16a6 6 0 0 1-6 6h-1.4a6 6 0 0 1-4.7-2.3L5 15.6a1.7 1.7 0 0 1 2.5-2.3L9 14.8"/>',
  doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5A.5.5 0 0 1 6.5 20V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4M9 12.5h6M9 16h6"/>',
  tag: '<path d="M3.5 12.5v-8a1 1 0 0 1 1-1h8l8 8-9 9-8-8z"/><path d="M8 8h.01"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.8-6 7-6s6.2 2 7 6"/>',
  send: '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  sparkle: '<path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7L4.5 11 10.1 9 12 3.5z"/>'
};

const GLYPHS = {
  rock: '<path d="M3 20 9.5 8l4.2 7 2.3-3.6L21 20H3z"/><path d="M14.5 3.8h.01M18 6.5h.01M11.5 5h.01"/>',
  wave: '<path d="M2.5 9.5c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2"/><path d="M2.5 15.5c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2"/>',
  slip: '<path d="M3 20h18L3 9v11z"/><path d="M17 3.5c-1.7 2.3-2.8 3.6-2.8 4.9a2.8 2.8 0 0 0 5.6 0c0-1.3-1.1-2.6-2.8-4.9z"/>',
  paw: '<circle cx="6.5" cy="11" r="1.6"/><circle cx="10.5" cy="6.5" r="1.6"/><circle cx="15.5" cy="6.5" r="1.6"/><circle cx="19" cy="11" r="1.6"/><path d="M12.7 12.2c-2.9 0-5.1 2.7-4.3 5.1.6 1.8 2.3 1.7 4.3 1.7s3.7.1 4.3-1.7c.8-2.4-1.4-5.1-4.3-5.1z"/>',
  boat: '<path d="M3 15.5h18l-2.3 4.5H5.3L3 15.5z"/><path d="M12 3.5v12"/><path d="m12 5 6 8.5h-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  wind: '<path d="M3 8h10.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12h15.5a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16h7"/>',
  drop: '<path d="M12 3c-3.2 4.2-6 7.2-6 10.5a6 6 0 0 0 12 0C18 10.2 15.2 7.2 12 3z"/>',
  bolt: '<path d="M13 2.5 4.5 14h6.5l-1 7.5L19.5 10H13l0-7.5z"/>',
  alert: '<path d="M12 3.2 2.8 19.4a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L12 3.2z"/><path d="M12 10v4.2M12 17.4v.01"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  // ---- 見どころ用 ----
  mountain: '<path d="m3 19 6-10 4 6 2.5-3.5L21 19H3z"/>',
  leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>',
  cup: '<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8z"/><path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5v2M11 3.5v2"/>',
  torii: '<path d="M3.5 7.5c3 1 6 1.5 8.5 1.5s5.5-.5 8.5-1.5"/><path d="M5.5 9.5v10M18.5 9.5v10M8.5 12.5h7"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8L12 3.5z"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  fish: '<path d="M3 12c2.8-4.2 7.8-5.4 11.5-2.8L18 6.5v11l-3.5-2.7C10.8 17.4 5.8 16.2 3 12z"/><path d="M8 11.5h.01"/>',
  anchor: '<circle cx="12" cy="5.5" r="2"/><path d="M12 7.5V20M7.5 11h9M4.5 14c.5 3.5 3.5 6 7.5 6s7-2.5 7.5-6"/>'
};

const GLYPH_LABELS = {
  rock: '落石・崖', wave: '波・潮流', slip: '足場・斜面', paw: '生き物', boat: '船・航路',
  sun: '暑さ・日差し', wind: '風', drop: '水・雨', bolt: '雷・天候', alert: '注意', ban: '立入制限',
  mountain: '山・絶景', leaf: '自然・植物', cup: '食・休憩', torii: '歴史・文化', heart: 'お気に入り',
  star: 'おすすめ', camera: '写真', fish: '海の生き物', anchor: '港・船'
};

// 旧版（絵文字）で保存された種別アイコンを、ピクトグラムに置き換える
const LEGACY_GLYPH = { '🪨': 'rock', '🌊': 'wave', '⚠': 'slip', '🐍': 'paw', '⛴': 'boat', '❗': 'alert' };

function ic(name, size, cls) {
  const inner = UI_ICONS[name] || GLYPHS[name] || '';
  const s = size || 20;
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s +
    '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
}
