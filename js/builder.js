/* =========================================================================
   Site Intelligence — report builder
   1 Property type → 2 Property location → 3 Site boundary (required /
   optional / skipped by property-type config) → 4 Report sections →
   5 Confirm → [Generate report] → generation sequence → report
   Steps 2, 3 and 5 live in js/location.js.
   ========================================================================= */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const B = PF.builder = {};
  const S = () => PF.state;

  /* ---------- step 1: categories ---------- */
  function renderCats() {
    $('#catGrid').classList.toggle('is-compact', !!S().category);
    $('#catGrid').innerHTML = PF.taxonomy.map(c => `
      <button class="cat" role="radio" aria-checked="${S().category === c.id}" data-cat="${c.id}">
        <span class="ci">${PF.icon(c.icon)}</span>
        <b>${c.name}</b>
      </button>`).join('');
  }
  function renderSubs() {
    const c = PF.taxonomy.find(t => t.id === S().category);
    const p = $('#subPanel');
    if (!c) { p.innerHTML = ''; return; }
    p.innerHTML = `
      <div class="sub-head"><h3>${c.name} <span class="muted">\u00B7 choose the asset type</span></h3><p>${c.blurb}</p></div>
      <div class="sub-grid" role="radiogroup" aria-label="${c.name} asset types">
        ${c.items.map(([n, d], i) => `
          <button class="sub" role="radio" aria-checked="${S().subtype === n}" data-sub="${n}" style="animation-delay:${i * 35}ms">
            <span class="radio"></span><span><b>${n}</b></span>
          </button>`).join('')}
      </div>`;
  }

  /* ---------- step 2: sections ---------- */
  function renderSections() {
    $('#secList').innerHTML = PF.sections.map((s, i) => `
      <button class="secopt${s.pages ? '' : ' is-soon'}" role="checkbox" aria-checked="${S().sections.has(s.id)}" ${s.pages ? '' : 'aria-disabled="true"'} data-sec="${s.id}" style="animation-delay:${i * 50}ms">
        <span class="cb">${PF.icon('check')}</span>
        <span class="si">${PF.icon(s.icon)}</span>
        <span>
          <span class="so-top"><span class="so-num">${s.num}</span><b>${s.title}</b>${!s.pages ? '<span class="chip chip-soon">In preparation</span>' : ''}${s.pages ? '' : '<span class="so-meta">Coming soon</span>'}</span>
          <p>${s.desc}</p>
          <span class="so-inc">${s.includes.map(x => `<span>${x}</span>`).join('')}</span>
        </span>
      </button>`).join('');
    updateSecCount();
  }
  function updateSecCount() {
    const n = S().sections.size;
    const avail = PF.sections.filter(s => s.pages).length;
    $('#secCount').textContent = `${n} of ${avail} selected`;
    $('#selAll').textContent = n === avail ? 'Clear all' : 'Select all';
  }

  /* ---------- rail ---------- */
  function renderRail() {
    const L0 = S().location, LOC = PF.loc;
    $('#railSite').hidden = !L0.confirmed;
    if (L0.confirmed) $('#railSite').innerHTML = `<span class="rs-ic">${PF.icon('pin')}</span><div><b>${(L0.address || 'Your property').split(',')[0]}</b><small>${L0.latitude.toFixed(5)}, ${L0.longitude.toFixed(5)}</small></div>`;
    $('#railLoc').innerHTML = L0.confirmed ? `<span class="ok-tick">${PF.icon('check')}</span>Confirmed <span class="muted">\u00B7 ${({ map: 'map', link: 'Google Maps link', coordinates: 'coordinates' })[L0.source]}</span>` : '<span class="muted">Not set yet</span>';
    const bs = S().subtype ? LOC.boundaryStatus() : null;
    $('#railBd').innerHTML = !bs ? '<span class="muted">\u2013</span>' : bs.key === 'defined' ? `<span class="ok-tick">${PF.icon('check')}</span>${bs.area.text} <span class="muted">(approx.)</span>` : `<span class="${bs.key === 'missing' && LOC.mode() === 'required' ? 'warn-t' : 'muted'}">${bs.text}</span>`;
    const cat = PF.taxonomy.find(t => t.id === S().category);
    $('#railType').innerHTML = S().subtype ? `${S().subtype} <span class="muted">· ${cat.name}</span>` : '<span class="muted">Not selected</span>';
    const secs = PF.sections.filter(x => S().sections.has(x.id));
    $('#railSecs').innerHTML = secs.length ? `<span class="rail-chips">${secs.map(x => `<span title="${x.title}"><b class="mono">${x.num}</b>${x.short}</span>`).join('')}</span>` : '<span class="muted">Choose in step 4</span>';
    const pages = secs.reduce((a, x) => a + x.pages, 0);
    const next = $('#bNext'), st = S().step, arrow = ' <span class="btn-arrow"></span>';
    const cfg = {
      1: ['Continue to location', !S().subtype],
      2: LOC.locationDone() && !LOC.hasPending() ? ['Continue', false] : LOC.hasPending() ? ['Confirm location', false] : ['Select a location to continue', true],
      3: LOC.boundaryDone() && !LOC.canConfirmBoundary() ? ['Continue', false] : LOC.canConfirmBoundary() ? ['Confirm boundary', false] : [$('#bdAsk').hidden ? 'Draw the boundary first' : 'Choose an option above', true],
      4: ['Continue', S().sections.size === 0],
      5: ['Generate report', false],
    }[st];
    next.innerHTML = cfg[0] + (cfg[1] && st === 2 ? '' : arrow); next.disabled = cfg[1];
    $('#bPrev').hidden = st === 1;
  }

  /* ---------- stepper + step switching ---------- */
  const reachable = k => {
    const LOC = PF.loc;
    if (k <= 1) return true;
    if (k === 2) return !!S().subtype;
    if (k === 3) return reachable(2) && LOC.locationDone() && LOC.mode() !== 'not_applicable';
    if (k === 4) return reachable(2) && LOC.locationDone() && LOC.boundaryDone();
    if (k === 5) return reachable(4) && S().sections.size > 0;
    return false;
  };
  function setStep(n) {
    PF.loc.syncType();
    if (n === 3 && PF.loc.mode() === 'not_applicable') n = 4;
    S().step = n;
    $$('.b-step').forEach(el => el.hidden = +el.dataset.bstep !== n);
    const na = PF.loc.mode() === 'not_applicable';
    $$('#stepper li').forEach(li => {
      const k = +li.dataset.step, done = k < n && (k !== 3 || !na);
      li.classList.toggle('is-current', k === n); li.classList.toggle('is-done', done);
      li.classList.toggle('is-skip', k === 3 && na);
      li.title = k === 3 && na ? 'Not needed for this property type' : '';
      if (done) li.querySelector('.st-n').innerHTML = PF.icon('check'); else li.querySelector('.st-n').textContent = k;
    });
    if (n === 2) PF.loc.enterLocation();
    if (n === 3) PF.loc.enterBoundary();
    if (n === 4) renderSections();
    if (n === 5) PF.loc.enterConfirm();
    renderRail();
    const top = $('#view-build').getBoundingClientRect().top + scrollY;
    if (scrollY > top + 40) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  B.setStep = setStep;
  B.renderRail = () => renderRail();
  B.next = () => {
    const st = S().step;
    if (st === 1) return setStep(2);
    if (st === 2) { if (PF.loc.hasPending()) return PF.loc.confirmPending(); return PF.loc.locationDone() && setStep(3); }
    if (st === 3) { if (PF.loc.canConfirmBoundary()) return PF.loc.confirmBoundary(); return PF.loc.boundaryDone() && setStep(4); }
    if (st === 4) { if (!S().sections.size) return PF.loc.showValidation(PF.loc.validate()); return setStep(5); }
    if (st === 5) return B.generateChecked();
  };
  B.generateChecked = () => { const v = PF.loc.validate(); if (!v.ok) return PF.loc.showValidation(v); generate(); };

  /* ---------- generation sequence ---------- */
  function generate() {
    const st = S();
    st.ref = 'RPT-' + Date.now().toString(36).toUpperCase().slice(-6);
    PF._generating = true;
    PF.go('generating');
    const secs = PF.sections.filter(x => st.sections.has(x.id));
    const lines = [
      st.boundary.defined ? `Reading your mapped boundary \u00B7 ${PF.geo.fmtArea(st.boundary.area).text}` : `Locating the property at ${st.location.latitude.toFixed(4)}, ${st.location.longitude.toFixed(4)}`,
      `Loading ${st.subtype} data profile`,
      ...secs.map(x => ({
        overview: 'Pulling land records and the 30-year encumbrance trail',
        infra: 'Measuring access to 14 transport and utility layers',
        regulatory: 'Intersecting parcel with master-plan zoning layers',
        records: 'Searching encumbrance, CERSAI and litigation records',
        market: 'Matching 212 registered transactions within 3 km',
        site: 'Sampling elevation, flood and groundwater rasters',
      }[x.id])),
      'Composing PDF and charts',
    ];
    setTimeout(() => {
      if (!PF._genCity) PF._genCity = PF.createCity($('#genCity'), { scan: true, cx: .5, cy: .56, zoom: 1.35, seed: 11 });
      else { PF._genCity.resize(); PF._genCity.restart(); }
    }, 60);
    $('#genCoord').textContent = `${st.location.latitude.toFixed(4)} N \u00B7 ${st.location.longitude.toFixed(4)} E`;
    const log = $('#genLog'), bar = $('#genBar'), pct = $('#genPct');
    log.innerHTML = ''; bar.style.width = '0%'; pct.textContent = '0%';
    $('#genTitle').textContent = `Reading the ground at ${st.site.label}…`;
    const total = PF.config.generateMs, per = total / lines.length;
    let i = 0;
    const tick = () => {
      const prev = log.querySelector('li.now');
      if (prev) { prev.classList.remove('now'); prev.querySelector('.spinner').outerHTML = PF.icon('check'); }
      if (i >= lines.length) {
        bar.style.width = '100%'; pct.textContent = '100% · Report ready';
        setTimeout(() => { PF._generating = false; st.generated = true; PF.go('report'); }, 450);
        return;
      }
      log.insertAdjacentHTML('beforeend', `<li class="now"><span class="spinner"></span>${lines[i]}</li>`);
      i++;
      const p = Math.round((i / (lines.length + .4)) * 100);
      bar.style.width = p + '%'; pct.textContent = p + '%';
      setTimeout(tick, per * (0.7 + Math.random() * 0.6));
    };
    setTimeout(tick, 250);
  }

  /* ---------- events ---------- */
  B.init = () => {
    renderCats(); renderSubs();
    $('#catGrid').addEventListener('click', e => {
      const b = e.target.closest('.cat'); if (!b) return;
      if (S().category !== b.dataset.cat) { S().category = b.dataset.cat; S().subtype = null; }
      renderCats(); renderSubs(); renderRail();
      if (matchMedia('(max-width: 899px)').matches) setTimeout(() => $('#subPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
    $('#subPanel').addEventListener('click', e => {
      const b = e.target.closest('.sub'); if (!b) return;
      if (S().subtype !== b.dataset.sub) PF.loc._wantBoundary = false;
      S().subtype = b.dataset.sub;
      PF.loc.syncType();
      $$('#subPanel .sub').forEach(x => x.setAttribute('aria-checked', x === b));
      renderRail();
    });
    $('#subPanel').addEventListener('dblclick', e => { if (e.target.closest('.sub')) setStep(2); });
    $('#secList').addEventListener('click', e => {
      const b = e.target.closest('.secopt'); if (!b) return;
      if (b.getAttribute('aria-disabled') === 'true') { PF.toast('This section is being prepared and will be available soon'); return; }
      const id = b.dataset.sec, on = !S().sections.has(id);
      on ? S().sections.add(id) : S().sections.delete(id);
      b.setAttribute('aria-checked', on);
      updateSecCount(); renderRail();
    });
    $('#selAll').addEventListener('click', () => {
      const avail = PF.sections.filter(s => s.pages).map(s => s.id);
      const all = avail.every(id => S().sections.has(id));
      S().sections = new Set(all ? [] : avail);
      $$('#secList .secopt').forEach(b => b.setAttribute('aria-checked', !all && b.getAttribute('aria-disabled') !== 'true'));
      updateSecCount(); renderRail();
    });
    $('#bNext').addEventListener('click', () => B.next());
    $('#bPrev').addEventListener('click', () => { const st = S().step; let k = st - 1; if (k === 3 && PF.loc.mode() === 'not_applicable') k = 2; setStep(Math.max(1, k)); });
    $$('#stepper li').forEach(li => li.addEventListener('click', () => { const k = +li.dataset.step; if (k !== S().step && reachable(k)) setStep(k); }));
  };
  B.onShow = () => { renderCats(); renderSubs(); setStep(S().step || 1); };
})();
