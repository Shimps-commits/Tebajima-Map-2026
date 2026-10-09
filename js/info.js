// 情報パネル：安全のご注意、表示設定（言語・テーマ）、出典。
function segHTML(id, items, current) {
  return '<div class="seg seg-md" id="' + id + '" role="group">' + items.map(i =>
    '<button type="button" data-v="' + esc(i.v) + '" aria-pressed="' + (i.v === current) + '">' + esc(i.label) + '</button>').join('') + '</div>';
}

function openInfo() {
  Panel.open({
    id: 'info', title: t('infoTitle'), icon: 'info',
    render(body) {
      const hasSample = hazardData && hazardData.features.some(f => f.properties.dummy);
      const nMine = EDIT ? 0 : MyPins.features.length;
      const mineSec = EDIT ? '' :
        '<section class="mine-sec"><h3>' + ic('user', 17) + esc(t('mineSection')) + '</h3>' +
        (nMine ? '<p>' + esc(t('mineCount', { n: nMine })) + '</p><div class="btn-row">' +
          '<button type="button" class="btn btn-sm btn-primary" id="i-msend">' + ic('send', 15) + esc(t('mineSendAll')) + '</button>' +
          '<button type="button" class="btn btn-sm" id="i-mexp">' + ic('download', 15) + esc(t('mineExport')) + '</button>' +
          '<button type="button" class="btn btn-sm btn-danger-ghost" id="i-mclr">' + ic('trash', 15) + esc(t('mineClear')) + '</button></div>'
          : '<p class="muted">' + esc(t('mineNone')) + '</p>') + '</section>';
      body.innerHTML =
        (hasSample ? '<div class="note note-sample">' + sampleChip() + ' ' + esc(t('sampleNote')) + '</div>' : '') +
        '<section class="safety"><h3>' + ic('shield', 18) + esc(t('safetyTitle')) + '</h3><ol>' +
        [1, 2, 3, 4, 5, 6].map(n => '<li>' + esc(t('safety' + n)) + '</li>').join('') + '</ol></section>' +
        '<div style="height:12px"></div>' + mineSec +
        '<h3 class="sec">' + esc(t('themeTitle')) + '</h3>' +
        segHTML('i-theme', [{ v: 'auto', label: t('themeAuto') }, { v: 'light', label: t('themeLight') }, { v: 'dark', label: t('themeDark') }], themePref) +
        '<h3 class="sec">' + esc(t('langTitle')) + '</h3>' +
        segHTML('i-lang', [{ v: 'ja', label: '日本語' }, { v: 'en', label: 'English' }], lang) +
        '<h3 class="sec">' + esc(t('creditsTitle')) + '</h3><ul class="credits">' +
        '<li><a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">' + esc(t('creditGSI')) + ic('external', 12) + '</a></li>' +
        '<li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">' + esc(t('creditOSM')) + ic('external', 12) + '</a></li>' +
        '<li><a href="https://leafletjs.com" target="_blank" rel="noopener">' + esc(t('creditLeaflet')) + ic('external', 12) + '</a></li></ul>' +
        (Sheet.info.source !== 'file' && Sheet.info.at
          ? '<p class="muted small">' + esc(t('dataUpdated', { d: new Date(Sheet.info.at).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) })) +
            (Sheet.info.source === 'cache' ? ' · ' + esc(t('dataCached')) : '') + '</p>' : '') +
        '<p class="muted small">' + esc(t('noindexNote')) + '</p>';
      if (nMine) {
        $('#i-msend', body).onclick = () => MyPins.send(MyPins.features);
        $('#i-mexp', body).onclick = () => MyPins.exportFile();
        $('#i-mclr', body).onclick = () => MyPins.clearAll();
      }
      $$('#i-theme button', body).forEach(b => b.addEventListener('click', () => { setTheme(b.dataset.v); Panel.refresh(); }));
      $$('#i-lang button', body).forEach(b => b.addEventListener('click', () => changeLang(b.dataset.v)));
    }
  });
}
