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
      body.innerHTML =
        (hasSample ? '<div class="note note-sample">' + sampleChip() + ' ' + esc(t('sampleNote')) + '</div>' : '') +
        '<section class="safety"><h3>' + ic('shield', 18) + esc(t('safetyTitle')) + '</h3><ol>' +
        [1, 2, 3, 4, 5, 6].map(n => '<li>' + esc(t('safety' + n)) + '</li>').join('') + '</ol></section>' +
        '<h3 class="sec">' + esc(t('themeTitle')) + '</h3>' +
        segHTML('i-theme', [{ v: 'auto', label: t('themeAuto') }, { v: 'light', label: t('themeLight') }, { v: 'dark', label: t('themeDark') }], themePref) +
        '<h3 class="sec">' + esc(t('langTitle')) + '</h3>' +
        segHTML('i-lang', [{ v: 'ja', label: '日本語' }, { v: 'en', label: 'English' }], lang) +
        '<h3 class="sec">' + esc(t('creditsTitle')) + '</h3><ul class="credits">' +
        '<li><a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">' + esc(t('creditGSI')) + ic('external', 12) + '</a></li>' +
        '<li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">' + esc(t('creditOSM')) + ic('external', 12) + '</a></li>' +
        '<li><a href="https://leafletjs.com" target="_blank" rel="noopener">' + esc(t('creditLeaflet')) + ic('external', 12) + '</a></li></ul>' +
        '<p class="muted small">' + esc(t('noindexNote')) + '</p>';
      $$('#i-theme button', body).forEach(b => b.addEventListener('click', () => { setTheme(b.dataset.v); Panel.refresh(); }));
      $$('#i-lang button', body).forEach(b => b.addEventListener('click', () => changeLang(b.dataset.v)));
    }
  });
}
