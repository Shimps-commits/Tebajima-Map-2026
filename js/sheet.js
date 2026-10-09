// Googleスプレッドシート連携。
//  ・読み込み：「ウェブに公開」した「ピン」シート（CSV）を読んで、地図に出す。
//  ・投稿：利用者の「運営に送る」を、Google Apps Script（ウェブアプリ）に送り、「提案」シートに追記する。
// data/config.json の sheetCsvUrl / submitUrl が空なら、何もしない（同梱の hazards.geojson を使う）。
const Sheet = {
  cacheKey: 'hazmap_sheet_v1',
  info: { source: 'file', at: null }          // source: file | sheet | cache
};

// ---------- CSV ----------
Sheet.parseCSV = function (text) {
  const rows = [];
  let row = [], cur = '', q = false;
  text = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
};

// 見出しの表記ゆれを吸収する（日本語の見出しも、英語のキーも使える）
const SHEET_HEAD = ['公開', 'id', '種類', '種別', '危険度', '名称（日本語）', '名称（English）', '説明（日本語）', '説明（English）',
  '対処法・ヒント（日本語）', '対処法・ヒント（English）', '緯度', '経度', '写真', '投稿者', 'サンプル', '出どころ', '更新日', '警告半径(m)'];
const SHEET_KEYS = ['publish', 'id', 'kind', 'category', 'severity', 'name_ja', 'name_en', 'desc_ja', 'desc_en',
  'action_ja', 'action_en', 'lat', 'lng', 'photo', 'author', 'dummy', 'source', 'updated_at', 'warn_radius_m'];
const SHEET_ALIAS = {
  publish: ['公開', 'publish', 'public', '公開する'], id: ['id'], kind: ['種類', 'kind'], category: ['種別', 'category'],
  severity: ['危険度', 'severity'], name_ja: ['名称日本語', 'nameja', '名称'], name_en: ['名称english', 'nameen', '名称英語'],
  desc_ja: ['説明日本語', 'descja', '説明'], desc_en: ['説明english', 'descen', '説明英語'],
  action_ja: ['対処法ヒント日本語', 'actionja', '対処法日本語'], action_en: ['対処法ヒントenglish', 'actionen', '対処法english'],
  lat: ['緯度', 'lat', 'latitude'], lng: ['経度', 'lng', 'lon', 'longitude'], photo: ['写真', 'photo'], author: ['投稿者', 'author'],
  dummy: ['サンプル', 'dummy', 'sample'], source: ['出どころ', 'source'], updated_at: ['更新日', 'updatedat', 'updated'],
  warn_radius_m: ['警告半径m', 'warnradiusm', '警告半径']
};
function sheetNorm(s) { return String(s || '').replace(/[\s　()（）・:：_\-\/]/g, '').toLowerCase(); }
function sheetHeaderKey(h) {
  const n = sheetNorm(h);
  for (const k in SHEET_ALIAS) if (SHEET_ALIAS[k].indexOf(n) >= 0) return k;
  return null;
}
function sheetTruthy(v) { return /^(true|1|yes|y|はい|公開|✓|✔|〇|○|サンプル)$/i.test(String(v || '').trim()); }

function sheetResolveCat(label, kindHint) {                // id・日本語名・英語名のどれでも指定できる
  const n = String(label || '').trim().toLowerCase();
  if (n) {
    const c = CATS.categories.find(x => String(x.id).toLowerCase() === n || String(x.ja).trim().toLowerCase() === n || String(x.en).trim().toLowerCase() === n);
    if (c) return c.id;
  }
  const list = catsOfKind(kindHint);
  return (list[0] || CATS.categories[0] || {}).id || 'other';
}

Sheet.rowsToFeatures = function (rows) {
  if (!rows.length) return [];
  const idx = {};
  rows[0].forEach((h, i) => { const k = sheetHeaderKey(h); if (k && !(k in idx)) idx[k] = i; });
  if (!('lat' in idx) || !('lng' in idx)) throw new Error('緯度・経度の列が見つかりません');
  const out = [], seen = {};
  rows.slice(1).forEach((r, n) => {
    if (!r.some(c => String(c).trim())) return;
    const g = k => (k in idx && r[idx[k]] != null ? String(r[idx[k]]).trim() : '');
    if ('publish' in idx && !sheetTruthy(g('publish'))) return;
    const lat = parseFloat(g('lat')), lng = parseFloat(g('lng'));
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    const kindTxt = g('kind').toLowerCase();
    let kindHint = /見どころ|spot/.test(kindTxt) ? 'spot' : /危険|hazard/.test(kindTxt) ? 'hazard' : (g('severity') ? 'hazard' : 'spot');
    const cat = sheetResolveCat(g('category'), kindHint);
    const spot = kindOfCat(catOf(cat)) === 'spot';
    let id = g('id') || ('r' + (n + 2));
    if (seen[id]) id = id + '_' + (n + 2);
    seen[id] = 1;
    const p = { id: id, category: cat, dummy: sheetTruthy(g('dummy')) };
    ['name_ja', 'name_en', 'desc_ja', 'desc_en', 'action_ja', 'action_en', 'photo', 'author', 'updated_at'].forEach(k => { p[k] = g(k); });
    if (/visitor|みんな|投稿|提案/i.test(g('source'))) p.source = 'visitor';
    if (!spot) {
      const maxLv = Math.max.apply(null, CATS.severities.map(s => Number(s.level)).concat([1]));
      p.severity = Math.min(maxLv, Math.max(1, parseInt(g('severity'), 10) || 1));      // 定義にない危険度は、範囲内に丸める
      p.warn_radius_m = parseFloat(g('warn_radius_m')) || sevOf(p.severity).warn_radius_m || 0;
    }
    out.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: p });
  });
  return out;
};
Sheet.toCollection = function (text) {
  return { type: 'FeatureCollection', features: Sheet.rowsToFeatures(Sheet.parseCSV(text)) };
};

// ---------- 読み込み・端末内の控え ----------
Sheet.readCache = function () {
  try { const s = JSON.parse(localStorage.getItem(Sheet.cacheKey)); if (s && s.text) return s; } catch (e) {}
  return null;
};
Sheet.writeCache = function (text) {
  try { localStorage.setItem(Sheet.cacheKey, JSON.stringify({ text: text, at: new Date().toISOString() })); } catch (e) {}
};
Sheet.fetchText = async function (url, ms) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms || 8000);
  try {
    const r = await fetch(url, { cache: 'no-store', signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const text = await r.text();
    if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('CSVではありません（公開設定を確認してください）');
    return text;
  } finally { clearTimeout(timer); }
};

// ---------- 投稿を送る（Apps Script）----------
Sheet.submit = async function (feats) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(CONFIG.submitUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal,
      body: JSON.stringify({ v: 1, lang: lang, features: feats.map(mineClean) })
    });
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || 'error');
    return j;
  } finally { clearTimeout(timer); }
};

// ---------- 編集画面：シートに貼り付ける形式 ----------
function sheetCell(v) {
  const s = String(v == null ? '' : v);
  return /[\t\n\r"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
Sheet.toTSV = function (feats) {
  const lines = [SHEET_HEAD.map(sheetCell).join('\t')];
  feats.forEach(f => {
    const p = f.properties, c = catOf(p.category), spot = kindOfCat(c) === 'spot';
    const v = {
      publish: 'TRUE', id: p.id, kind: spot ? '見どころ' : '危険個所', category: c.ja, severity: spot ? '' : p.severity,
      name_ja: p.name_ja, name_en: p.name_en, desc_ja: p.desc_ja, desc_en: p.desc_en, action_ja: p.action_ja, action_en: p.action_en,
      lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], photo: p.photo, author: p.author,
      dummy: p.dummy ? 'TRUE' : 'FALSE', source: p.source === 'visitor' ? 'みんなの投稿' : '', updated_at: p.updated_at,
      warn_radius_m: spot ? '' : p.warn_radius_m
    };
    lines.push(SHEET_KEYS.map(k => sheetCell(v[k])).join('\t'));
  });
  return lines.join('\n');
};
