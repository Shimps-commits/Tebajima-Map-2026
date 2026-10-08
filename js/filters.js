// 絞り込み。状態は画面内のみ（非表示にした種別ID／危険度レベルの集合）。
// 危険個所／見どころの表示切替は、kindOn（この端末に記憶）。
const hiddenCats = new Set();
const hiddenSevs = new Set();

function passesFilter(p) {
  const k = kindOf(p);
  if (!kindOn[k]) return false;
  if (hiddenCats.has(p.category)) return false;
  if (k === 'hazard' && hiddenSevs.has(Number(p.severity))) return false;
  return true;
}
function activeFilterCount() { return hiddenCats.size + hiddenSevs.size + (kindOn.hazard ? 0 : 1) + (kindOn.spot ? 0 : 1); }

function updateFilterBadge() {
  const b = $('#dock [data-act="filter"] .dock-badge');
  if (!b) return;
  const n = activeFilterCount();
  b.hidden = n === 0; b.textContent = n;
}

function visibleCount() { return allFeatures().filter(f => passesFilter(f.properties)).length; }

const KIND_STYLE = { hazard: { color: '#f59e0b', text: '#1a1300', icon: 'alert' }, spot: { color: '#e11d48', text: '#ffffff', icon: 'star' } };

function openFilter() {
  Panel.open({
    id: 'filter', title: t('filterTitle'), icon: 'filter',
    render(body, foot) {
      const feats = allFeatures();
      const cntC = id => feats.filter(f => f.properties.category === id).length;
      const cntS = lv => feats.filter(f => kindOf(f.properties) === 'hazard' && Number(f.properties.severity) === Number(lv)).length;
      const cntK = k => feats.filter(f => kindOf(f.properties) === k).length;
      const kindBtn = k => {
        const st = KIND_STYLE[k];
        return '<button type="button" class="fchip" data-kind="kind" data-id="' + k + '" aria-pressed="' + kindOn[k] + '">' +
          '<span class="fchip-ic" style="--cc:' + st.color + ';--ct:' + st.text + '">' + ic(st.icon, 15) + '</span>' +
          '<span class="fchip-lb">' + esc(t(k === 'hazard' ? 'fHazards' : 'fSpots')) + '</span><span class="fchip-n">' + cntK(k) + '</span></button>';
      };
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
      body.innerHTML =
        '<h3 class="sec">' + esc(t('showKinds')) + '</h3><div class="fchips">' + kindBtn('hazard') + kindBtn('spot') + '</div>' +
        '<h3 class="sec">' + esc(t('fHazards')) + ' · ' + esc(t('byCategory')) + '</h3><div class="fchips">' + catsOfKind('hazard').map(catBtn).join('') + '</div>' +
        '<h3 class="sec">' + esc(t('fHazards')) + ' · ' + esc(t('bySeverity')) + '</h3><div class="fchips">' + CATS.severities.map(sevBtn).join('') + '</div>' +
        '<h3 class="sec">' + esc(t('fSpots')) + ' · ' + esc(t('byCategory')) + '</h3><div class="fchips">' + catsOfKind('spot').map(catBtn).join('') + '</div>';
      foot.innerHTML = '<button type="button" class="btn btn-md" id="f-all">' + esc(t('filterAll')) + '</button>' +
        '<button type="button" class="btn btn-md btn-primary grow" id="f-show"></button>';
      const sync = () => { $('#f-show', foot).textContent = t('showN', { n: visibleCount() }); };
      sync();
      $$('.fchip', body).forEach(b => b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') === 'true';
        if (b.dataset.kind === 'kind') setKindOn(b.dataset.id, !on);
        else {
          const set = b.dataset.kind === 'cat' ? hiddenCats : hiddenSevs;
          const key = b.dataset.kind === 'cat' ? b.dataset.id : Number(b.dataset.id);
          on ? set.add(key) : set.delete(key);
        }
        b.setAttribute('aria-pressed', String(!on));
        renderHazards(); sync();
      }));
      $('#f-all', foot).onclick = () => { hiddenCats.clear(); hiddenSevs.clear(); setKindOn('hazard', true); setKindOn('spot', true); renderHazards(); Panel.refresh(); };
      $('#f-show', foot).onclick = () => Panel.close();
    }
  });
}
