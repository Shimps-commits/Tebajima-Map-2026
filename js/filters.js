// 種別・危険度フィルター。状態は画面内のみ（非表示にした種別ID／危険度レベルの集合）。
const hiddenCats = new Set();
const hiddenSevs = new Set();

function passesFilter(p) { return !hiddenCats.has(p.category) && !hiddenSevs.has(Number(p.severity)); }
function activeFilterCount() { return hiddenCats.size + hiddenSevs.size; }

function updateFilterBadge() {
  const b = $('#dock [data-act="filter"] .dock-badge');
  if (!b) return;
  const n = activeFilterCount();
  b.hidden = n === 0; b.textContent = n;
}

function visibleCount() { return hazardData ? hazardData.features.filter(f => passesFilter(f.properties)).length : 0; }

function openFilter() {
  Panel.open({
    id: 'filter', title: t('filterTitle'), icon: 'filter',
    render(body, foot) {
      const feats = hazardData.features;
      const cntC = id => feats.filter(f => f.properties.category === id).length;
      const cntS = lv => feats.filter(f => Number(f.properties.severity) === Number(lv)).length;
      const catBtn = c => {
        const col = safeColor(c.color);
        return '<button type="button" class="fchip" data-kind="cat" data-id="' + esc(c.id) + '" aria-pressed="' + !hiddenCats.has(c.id) + '">' +
          '<span class="fchip-ic" style="--cc:' + col + ';--ct:' + textOn(col) + '">' + ic(GLYPHS[c.icon] ? c.icon : 'alert', 15) + '</span>' +
          '<span class="fchip-lb">' + esc(c[lang] || c.ja) + '</span><span class="fchip-n">' + cntC(c.id) + '</span></button>';
      };
      const sevBtn = s => {
        const col = safeColor(s.color, '#111827');
        return '<button type="button" class="fchip" data-kind="sev" data-id="' + esc(s.level) + '" aria-pressed="' + !hiddenSevs.has(Number(s.level)) + '">' +
          '<span class="fchip-ic" style="--cc:' + col + ';--ct:' + textOn(col) + '">' + sevShapeSvg(s.level, 13) + '</span>' +
          '<span class="fchip-lb">' + esc(s.mark) + ' ' + esc(s[lang] || s.ja) + '</span><span class="fchip-n">' + cntS(s.level) + '</span></button>';
      };
      body.innerHTML = '<h3 class="sec">' + esc(t('byCategory')) + '</h3><div class="fchips">' + CATS.categories.map(catBtn).join('') + '</div>' +
        '<h3 class="sec">' + esc(t('bySeverity')) + '</h3><div class="fchips">' + CATS.severities.map(sevBtn).join('') + '</div>';
      foot.innerHTML = '<button type="button" class="btn btn-md" id="f-all">' + esc(t('filterAll')) + '</button>' +
        '<button type="button" class="btn btn-md btn-primary grow" id="f-show"></button>';
      const sync = () => { $('#f-show', foot).textContent = t('showN', { n: visibleCount() }); };
      sync();
      $$('.fchip', body).forEach(b => b.addEventListener('click', () => {
        const set = b.dataset.kind === 'cat' ? hiddenCats : hiddenSevs;
        const key = b.dataset.kind === 'cat' ? b.dataset.id : Number(b.dataset.id);
        const on = b.getAttribute('aria-pressed') === 'true';
        on ? set.add(key) : set.delete(key);
        b.setAttribute('aria-pressed', String(!on));
        renderHazards(); sync();
      }));
      $('#f-all', foot).onclick = () => { hiddenCats.clear(); hiddenSevs.clear(); renderHazards(); Panel.refresh(); };
      $('#f-show', foot).onclick = () => Panel.close();
    }
  });
}
