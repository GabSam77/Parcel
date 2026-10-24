/* =========================================================================
   Location Intelligence — home page (hero, platform) and the map explorer page (#explore) with the Atlas chat
   ========================================================================= */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  const home = PF.home = {};
  let map, layers = {}, pinLayer, mapReady = false;

  /* =================================================== HERO CITY */
  let city = null;
  function heroCity() {
    const cv = $('#cityCanvas'); if (!cv || !PF.createCity) return;
    const callouts = $$('#callouts .callout');
    const hero = $('#hero');
    city = PF.createCity(cv, {
      pointerTarget: hero,
      onFrame: project => {
        const W = cv.clientWidth, H = cv.clientHeight;
        callouts.forEach(el => {
          const p = project(el.dataset.anchor); if (!p) return;
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
          el.style.visibility = (p.vis > .25 && p.x > 40 && p.x < W - 40 && p.y > 90 && p.y < H - 60) ? 'visible' : 'hidden';
        });
      },
    });
    setTimeout(() => callouts.forEach((el, i) => setTimeout(() => el.classList.add('on'), i * 220)), reduced ? 0 : 1500);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { e.isIntersecting && document.body.dataset.route === 'home' ? city.start() : city.stop(); }).observe(hero);
  }

  /* =================================================== BENTO SPOTLIGHT */
  function spotlight() {
    $$('.tile').forEach(t => t.addEventListener('pointermove', e => { const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));
    const onScroll = () => document.body.classList.toggle('scrolled', scrollY > 30);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* =================================================== COUNTERS */
  function counters() {
    const els = $$('.count');
    const run = el => {
      const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1300;
      const tick = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = (to * e).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    els.forEach(el => el.textContent = parseFloat(el.dataset.to).toLocaleString('en-IN', { minimumFractionDigits: +(el.dataset.dec || 0) }));
    if (reduced || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .6 });
    els.forEach(el => io.observe(el));
  }

  /* =================================================== SEARCH (hero + map) */
  /* Search boxes use PF.attachSearch (js/geocode.js): coordinates, local places and Esri results. */

  /* =================================================== MAP */
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches; };

  const INDIA = [22.6, 79.6];
  function initMap() {
    if (typeof L === 'undefined') { $('#mapFallback').hidden = false; return; }
    const el = $('#map');
    map = L.map(el, { zoomControl: false, center: INDIA, zoom: 5, minZoom: 4, maxZoom: 17, scrollWheelZoom: false, attributionControl: true, zoomSnap: .5 });
    map.attributionControl.setPrefix(false);
    el.classList.add('no-basemap');
    const tiles = L.tileLayer(PF.config.tiles.replace('{theme}', 'rastertiles/voyager'), { subdomains: 'abcd', maxZoom: 19, attribution: PF.config.tileAttribution });
    tiles.on('tileload', () => el.classList.remove('no-basemap'));
    tiles.addTo(map);

    // scroll-zoom only after the user engages with the map
    map.on('click focus', () => map.scrollWheelZoom.enable());
    el.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

    // base roads
    const roads = L.layerGroup(PF.roads.map(r => L.polyline(r.pts, { className: 'lf-road', weight: r.ring ? 2.5 : 2, interactive: false }))).addTo(map);

    // city labels (zoomed out) and micro-market labels (zoomed in)
    L.layerGroup(PF.cities.map(c => L.marker([c.lat, c.lng], { icon: L.divIcon({ className: 'mk mk-city-wrap', html: `<span class="mk-city"><i></i>${c.name}</span>`, iconSize: [0, 0], iconAnchor: [6, 6] }) })
      .on('click', () => map.flyTo([c.lat, c.lng], 10, { duration: .9 })))).addTo(map);
    L.layerGroup(PF.places.map(p => L.marker([p.lat, p.lng], { interactive: false, icon: L.divIcon({ className: 'mk mk-place-wrap', html: `<span class="mk-label">${p.name}</span>`, iconSize: [0, 0], iconAnchor: [-8, 18] }) }))).addTo(map);
    const zoomCls = () => { el.classList.toggle('z-far', map.getZoom() < 8); };
    map.on('zoomend', zoomCls); zoomCls();

    // metro
    layers.metro = L.layerGroup();
    PF.metro.forEach(line => {
      const up = line.status === 'upcoming';
      L.polyline(line.stations.map(s => [s[1], s[2]]), { color: line.color, weight: up ? 3.5 : 4.5, opacity: up ? .9 : .95, dashArray: up ? '8 8' : null, className: up ? 'lf-up' : '', lineCap: 'round' })
        .bindTooltip(`<b>${line.name}</b><small>${up ? 'Under construction · ETA ' + line.eta : 'Operational'}</small>`, { sticky: true })
        .addTo(layers.metro);
      line.stations.forEach(([n, lat, lng]) => L.marker([lat, lng], { icon: L.divIcon({ className: 'mk', html: `<div class="mk-station ${up ? 'upcoming' : ''}" style="--c:${line.color}"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] }) })
        .bindTooltip(`<b>${n}</b><small>${line.name}${up ? ' · ' + line.eta : ''}</small>`, { direction: 'top', offset: [0, -6] }).addTo(layers.metro));
    });

    // upcoming infra
    layers.upcoming = L.layerGroup();
    let k = 0;
    PF.upcoming.forEach(f => {
      const tip = `<b>${f.name}</b><small>ETA ${f.eta} · ${f.cost}</small>`;
      if (f.type === 'point') L.marker([f.lat, f.lng], { icon: L.divIcon({ className: 'mk', html: `<div class="mk-proj">${String(++k).padStart(2, '0')}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }) }).bindTooltip(tip, { direction: 'top', offset: [0, -14] }).addTo(layers.upcoming);
      else L.polyline(f.pts, { color: f.color, weight: f.type === 'rail' ? 3 : 4, dashArray: f.type === 'rail' ? '2 8' : '12 10', className: 'lf-up', lineCap: 'round' }).bindTooltip(tip, { sticky: true }).addTo(layers.upcoming);
    });

    // POIs
    layers.pois = L.layerGroup(PF.pois.map(p => L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'mk', html: `<div class="mk-poi" style="--c:${PF.poiCats[p.cat].color}"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] }) })
      .bindTooltip(`<b>${p.name}</b><small>${PF.poiCats[p.cat].label}</small>`, { direction: 'top', offset: [0, -6] })));

    const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
    layers.sat = L.layerGroup([
      L.tileLayer(ESRI + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Powered by Esri \u00B7 Maxar, Earthstar Geographics' }),
      L.tileLayer(ESRI + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    ]);
    ['metro', 'upcoming', 'pois'].forEach(l => layers[l].addTo(map));
    pinLayer = L.layerGroup().addTo(map);

    map.on('click', e => { dropPin(e.latlng, null, { announce: true }); });
    mapReady = true;

    // controls
    $('#zoomIn').onclick = () => map.zoomIn();
    $('#zoomOut').onclick = () => map.zoomOut();
    $('#recenter').onclick = () => map.flyTo(INDIA, 5, { duration: .8 });
    $$('#layerPills .pill').forEach(b => b.addEventListener('click', () => toggleLayer(b.dataset.layer)));

    // no pin until the user clicks, searches, or opens their own property
  }

  function toggleLayer(name, force) {
    if (!mapReady) return;
    const on = force !== undefined ? force : !map.hasLayer(layers[name]);
    on ? layers[name].addTo(map) : map.removeLayer(layers[name]);
    const pill = $(`#layerPills [data-layer="${name}"]`); pill && pill.classList.toggle('is-on', on);
  }

  function dropPin(ll, label, opts = {}) {
    const snap = PF.snapshot({ lat: ll.lat, lng: ll.lng }, label);
    if (opts.property) snap.isProperty = true;
    PF.state.site = snap;
    $('#chatFocus').textContent = snap.label;
    $('#mapHint').style.opacity = 0;
    if (mapReady) {
      pinLayer.clearLayers();
      [5000, 2000].forEach(r => L.circle([ll.lat, ll.lng], { radius: r, className: 'lf-ring', weight: 1.2, dashArray: '4 6', interactive: false }).addTo(pinLayer));
      L.marker([ll.lat, ll.lng], { icon: L.divIcon({ className: 'mk', html: '<div class="mk-pin"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }), interactive: false }).addTo(pinLayer);
      if (opts.fly !== false) map.flyTo([ll.lat, ll.lng], Math.max(map.getZoom(), 12), { duration: .9 });
    }
    renderSiteCard(snap);
    renderSuggestions();
    if (opts.announce) sysMsg(`Pin dropped · ${snap.pt.lat.toFixed(4)}, ${snap.pt.lng.toFixed(4)}`);
    return snap;
  }
  home.dropPin = dropPin;

  function renderSiteCard(s) {
    const card = $('#siteCard');
    const chips = Object.entries(s.counts).map(([c, n]) => `<span class="chip" style="--c:${PF.poiCats[c].color}"><i></i>${n} ${PF.poiCats[c].label.toLowerCase()}${n === 1 || c === 'retail' || c === 'industry' ? '' : 's'}</span>`).join('');
    card.innerHTML = `
      <div class="sc-head">
        <div><h4>${s.label}</h4><div class="sc-coord mono">${PF.dms(s.pt.lat, 'N', 'S')} · ${PF.dms(s.pt.lng, 'E', 'W')}</div></div>
        <button class="sc-close" aria-label="Close site card">${PF.icon('close')}</button>
      </div>
      ${s.isProperty ? propertyRows() : ''}
      <dl class="sc-grid">
        <div><dt>Zoning</dt><dd>${s.zone}</dd></div>
        <div><dt>Master plan</dt><dd>${s.city.plan}</dd></div>
        <div><dt>Nearest metro</dt><dd>${s.station.d < 40 ? `${s.station.name} <span class="mono muted" style="font-weight:400">${PF.fmtKm(s.station.d)}</span>${s.station.status === 'upcoming' ? `<span class="chip chip-accent" style="height:20px;margin-left:4px">${s.station.eta}</span>` : ''}` : '<span class="muted">None within 40 km</span>'}</dd></div>
        <div><dt>${s.city.airport.name}</dt><dd class="mono">${PF.fmtKm(s.dAir)}</dd></div>
        <div><dt>${s.city.cbd.name}</dt><dd class="mono">${PF.fmtKm(s.dCbd)}</dd></div>
        <div><dt>City</dt><dd>${s.city.name}</dd></div>
      </dl>
      <div class="sc-poi">${chips}</div>
      ${s.isProperty
        ? `<div class="sc-actions"><button class="btn btn-glass btn-sm" id="scEditLoc">${PF.icon('pin')}Edit location</button>${PF.state.boundary.mode !== 'not_applicable' ? `<button class="btn btn-glass btn-sm" id="scEditBd">${PF.state.boundary.defined ? 'Edit boundary' : 'Define boundary'}</button>` : ''}</div>
           ${PF.state.generated ? '<button class="btn btn-primary btn-block" data-go="report">Back to your report <span class="btn-arrow"></span></button>' : '<button class="btn btn-primary btn-block" data-go="build">Generate report <span class="btn-arrow"></span></button>'}`
        : '<button class="btn btn-primary btn-block" data-go="build" id="scGen">Generate report <span class="btn-arrow"></span></button>'}
      <div class="sc-gm">${PF.gmaps.links(s.pt)}</div>`;
    card.hidden = false;
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    card.querySelector('.sc-close').onclick = () => (card.hidden = true);
    const gen = card.querySelector('#scGen'); if (gen) gen.addEventListener('click', () => { PF._suggestSite = { lat: s.pt.lat, lng: s.pt.lng }; });
    const el = card.querySelector('#scEditLoc'); if (el) el.onclick = () => { PF.state.step = 2; PF.go('build'); };
    const eb = card.querySelector('#scEditBd'); if (eb) eb.onclick = () => { PF.loc._wantBoundary = true; PF.state.step = 3; PF.go('build'); };
  }

  /* =================================================== CHAT */
  const log = () => $('#chatLog');
  const scrollLog = () => { const l = log(); l.scrollTop = l.scrollHeight; };
  function addMsg(html, who) { const d = document.createElement('div'); d.className = `msg msg-${who}`; d.innerHTML = html; log().appendChild(d); scrollLog(); return d; }
  function sysMsg(t) { addMsg(t, 'sys'); }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function renderSuggestions() {
    const f = PF.state.site ? PF.state.site.label.replace(/^Near /, '') : 'this site';
    const list = [`What's coming up near ${f}?`, 'Hospitals and schools within 5 km', 'Nearest metro and airport', 'Zoning and FAR', 'Take me to GIFT City', 'Show me Panvel'];
    $('#chatSuggest').innerHTML = list.map(s => `<button type="button">${esc(s)}</button>`).join('');
  }

  const aliases = { gurugram: 'gurugram-99a', gurgaon: 'gurugram-99a', noida: 'noida-150', mumbai: 'bkc', 'navi mumbai': 'panvel', pune: 'hinjewadi', bengaluru: 'devanahalli', bangalore: 'devanahalli', hyderabad: 'hitec-city', chennai: 'omr', ahmedabad: 'sanand', gandhinagar: 'gift-city', kolkata: 'new-town', 'gift city': 'gift-city' };
  function findPlaces(q) {
    const t = q.toLowerCase(), hits = [];
    PF.places.forEach(p => { const n = p.name.toLowerCase(), i = Math.max(t.indexOf(n), t.indexOf(n.split(',')[0])); if (i >= 0) hits.push({ p, i }); });
    Object.entries(aliases).forEach(([a, id]) => { const i = t.indexOf(a); if (i >= 0 && !hits.some(h => h.p.id === id)) hits.push({ p: PF.places.find(p => p.id === id), i }); });
    return hits.sort((a, b) => a.i - b.i).map(h => h.p);
  }
  const drive = km => `${Math.round(km * 2.1 + 4)} min`;
  const row = (l, r, c) => `<li><span>${c ? `<i style="--c:${c}"></i>` : ''}${l}</span><span class="mono">${r}</span></li>`;

  function answer(q) {
    const t = q.toLowerCase();
    const places = findPlaces(q);
    if (places.length) dropPin({ lat: places[0].lat, lng: places[0].lng }, places[0].name);
    const s = PF.state.site, name = s.label;

    if (/^(hi|hello|hey|yo)\b/.test(t)) return `<p>Hi! I'm focused on <b>${name}</b>. Ask me about upcoming infrastructure, amenities, metro access or zoning, or name any city. You can also click the map to move me.</p>`;

    if (/upcoming|coming|planned|future|pipeline|under construction|new infra|proposed/.test(t)) {
      toggleLayer('upcoming', true); toggleLayer('metro', true);
      const ups = s.upcoming.slice(0, 4);
      const st = PF.nearestStations(s.pt, 'upcoming')[0];
      map && map.flyTo([s.pt.lat, s.pt.lng], 10.5, { duration: .9 });
      return `<p><b>${ups.length + 1} sanctioned projects</b> could change access to ${name}:</p><ul class="rows">
        ${row(`${st.line} – ${st.name}<span class="tag">${st.eta}</span>`, PF.fmtKm(st.d), st.color)}
        ${ups.map(u => row(`${u.name}<span class="tag">${u.eta}</span>`, PF.fmtKm(u.d), 'var(--amber)')).join('')}</ul>
        <p style="margin-top:8px">The closest, <b>${ups[0].name}</b>, is budgeted at ${ups[0].cost}. Upcoming projects are highlighted in amber on the map.</p>`;
    }

    const catHit = /hospital|clinic|medical/.test(t) ? 'hospital' : /school|college|education/.test(t) ? 'school' : /mall|retail|shop/.test(t) ? 'retail' : /office|it park|tech park|business/.test(t) ? 'office' : /industr|factory/.test(t) ? 'industry' : null;
    if (catHit || /amenit|poi|nearby|around|social infra/.test(t)) {
      toggleLayer('pois', true);
      if (map) map.flyToBounds(L.latLng(s.pt.lat, s.pt.lng).toBounds(10500), { duration: .9 });
      const cats = catHit ? [catHit] : /school/.test(t) ? ['hospital', 'school'] : ['hospital', 'school'];
      if (/hospital/.test(t) && /school/.test(t)) cats.splice(0, cats.length, 'hospital', 'school');
      const near = s.poisNear.filter(p => cats.includes(p.cat)).map(p => ({ ...p, d: PF.dist(s.pt, p) })).sort((a, b) => a.d - b.d).slice(0, 5);
      const summary = Object.entries(s.counts).map(([c, n]) => `${n} ${PF.poiCats[c].label.toLowerCase()}${n === 1 || c === 'retail' || c === 'industry' ? '' : 's'}`).join(', ');
      return `<p>Within 5 km of ${name}: ${summary}.</p>${near.length ? `<ul class="rows">${near.map(p => row(p.name, PF.fmtKm(p.d), PF.poiCats[p.cat].color)).join('')}</ul>` : `<p>No ${cats.join(' or ')} listed within 5 km. The nearest options are in ${s.place.name}.</p>`}`;
    }

    if (/metro|station|transit|connect|rail|airport|commute|drive|access/.test(t)) {
      toggleLayer('metro', true);
      const op = PF.nearestStations(s.pt, 'operational')[0], up = PF.nearestStations(s.pt, 'upcoming')[0];
      if (op.d > 40 && up.d > 40) return `<p>There's no metro within 40 km of ${name}.</p><ul class="rows">${row(s.city.airport.name, `${PF.fmtKm(s.dAir)} · ~${drive(s.dAir)}`)}${row(s.city.cbd.name, `${PF.fmtKm(s.dCbd)} · ~${drive(s.dCbd * 1.4)}`)}</ul>`;
      return `<p>Connectivity from ${name}:</p><ul class="rows">
        ${row(`${op.name} (${op.line})`, PF.fmtKm(op.d), op.color)}
        ${row(`${up.name} (${up.line})<span class="tag">${up.eta}</span>`, PF.fmtKm(up.d), up.color)}
        ${row(s.city.airport.name, `${PF.fmtKm(s.dAir)} · ~${drive(s.dAir)}`)}
        ${row(s.city.cbd.name, `${PF.fmtKm(s.dCbd)} · ~${drive(s.dCbd * 1.4)}`)}</ul>
        <p style="margin-top:8px">${up.d < op.d ? `When the ${up.line} opens, the walk-to-metro distance drops by ${PF.fmtKm(op.d - up.d)}.` : `The site is already closer to an operational line than to any upcoming one.`}</p>`;
    }

    if (/price|rate|value|guidance|cost|apprec|invest|trend|market|worth/.test(t)) {
      return `<p>I share data, not valuations. For <b>${name}</b>, the <b>Market &amp; Catchment</b> section of the report lists registered transactions, launches, absorption and catchment demographics from public sources.</p><div class="msg-cta"><button class="btn btn-primary btn-sm" data-go="build">Generate report <span class="btn-arrow"></span></button></div>`;
    }

    if (/zon|fsi|far|regulat|land use|conversion|setback|approv|build/.test(t)) {
      return `<p>Under ${s.city.plan}, ${name} falls in <b>${s.zone}</b>.</p><ul class="rows">
        ${row('Permissible FAR', s.far)}${row('Front setback', s.far === '0.25' ? 'n/a' : '6.0 m')}${row('Max ground coverage', s.far === '0.25' ? '10%' : '55%')}
        ${row('Conversion status', s.zone.includes('Agricultural') ? 'Eligible (Sec. 95)' : 'Converted')}</ul>
        <p style="margin-top:8px">The Regulatory &amp; Zoning section adds the approvals checklist and any CRZ, lake or airport-height restrictions.</p>`;
    }

    if (/report|pdf|download|export/.test(t)) {
      return `<p>I can put everything for <b>${name}</b> into a PDF. You'll choose the property type and sections next.</p><div class="msg-cta"><button class="btn btn-primary btn-sm" data-go="build">Generate report <span class="btn-arrow"></span></button></div>`;
    }

    if (places.length) {
      const p = places[0];
      return `<p><b>${p.name}</b>, ${p.district}. ${p.blurb}</p><ul class="rows">${row('Zoning', s.zone)}${row('Master plan', s.city.plan)}${row('Nearest metro', `${s.station.name} · ${PF.fmtKm(s.station.d)}`)}${row(s.city.airport.name, PF.fmtKm(s.dAir))}</ul><p style="margin-top:8px">Ask what's coming up, or about schools and hospitals here.</p>`;
    }

    return `<p>Here's what I have on <b>${name}</b>: ${s.zone}, ${PF.fmtKm(s.dAir)} from ${s.city.airport.name}. Nearest metro is ${s.station.name} (${PF.fmtKm(s.station.d)}).</p><p>Try asking about <b>upcoming infrastructure</b>, <b>hospitals and schools</b>, <b>metro access</b> or <b>zoning</b>, or name a city.</p>`;
  }

  function mapFit(pts) { if (!map) return; map.flyToBounds(L.latLngBounds(pts.map(p => [p.lat, p.lng])).pad(.4), { duration: .9 }); }

  let busy = false;
  function ask(q) {
    q = q.trim(); if (!q || busy) return;
    busy = true;
    addMsg(esc(q), 'user');
    const typing = addMsg('<span class="typing"><span></span><span></span><span></span></span>', 'bot');
    typing.style.padding = '0';
    setTimeout(() => {
      typing.remove(); busy = false;
      const d = addMsg(answer(q), 'bot');
      PF.paintIcons(d); scrollLog();
    }, 650 + Math.random() * 500);
  }

  function initChat() {
    const welcome = () => {
      log().innerHTML = '';
      addMsg(`<p>Hi, I'm <b>Atlas</b>, your location assistant.</p><p>Name a city or locality, or click anywhere on the map, then ask about nearby infrastructure, amenities, what's being built or zoning, anywhere in India.</p>`, 'bot');
    };
    welcome();
    renderSuggestions();
    $('#chatForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#chatInput'); ask(i.value); i.value = ''; });
    $('#chatSuggest').addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
    $('#chatReset').addEventListener('click', welcome);
  }

  /* =================================================== city quick-jumps */
  function renderCities() {
    $('#xpCities').innerHTML = `<button type="button" data-india>All India</button>` + PF.cities.map(c => `<button type="button" data-city="${c.id}">${c.name}</button>`).join('');
    $('#xpCities').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !mapReady) return;
      $$('#xpCities button').forEach(x => x.classList.toggle('is-on', x === b));
      if (b.dataset.india !== undefined) return map.flyTo(INDIA, 5, { duration: .9 });
      const c = PF.cities.find(x => x.id === b.dataset.city); map.flyTo([c.lat, c.lng], 10.5, { duration: .9 });
    });
  }

  /* =================================================== home report-preview list */
  function renderRpList() {
    if (!$('#rpList')) return;
    $('#rpList').innerHTML = PF.sections.map(s => `<li><span class="rp-n">${s.num}</span><div><h3>${s.title}</h3><p>${s.desc}</p></div><span class="rp-pages">${s.pages ? s.pages + ' pp' : 'Soon'}</span></li>`).join('');
  }

  /* =================================================== lifecycle */
  home.init = () => {
    heroCity();
    spotlight();
    counters();
    renderCities();
    initChat();
    const search = (formSel, inputSel, listSel, onPick) => {
      const input = $(inputSel);
      PF.attachSearch(input, $(listSel), { near: () => PF.state.site && PF.state.site.pt, onPick });
      $(formSel).addEventListener('submit', e => { e.preventDefault(); input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
    };
    search('#mapSearch', '#mapSearchInput', '#mapSuggest', r => dropPin(r, r.label));
  };
  /* ---------- the user's confirmed property (location + optional boundary) ---------- */
  function propertyRows() {
    const L0 = PF.state.location, b = PF.state.boundary;
    const bd = b.defined ? `${Math.round(b.area).toLocaleString('en-IN')} m\u00B2 <span class="muted">/ ${b.areaAcres.toFixed(2)} ac (approx.)</span>` : b.mode === 'not_applicable' ? '<span class="muted">Not required</span>' : '<span class="muted">Not defined</span>';
    return `<div class="sc-prop"><span class="chip chip-accent">Your property</span><span class="mono muted">${L0.latitude.toFixed(5)}, ${L0.longitude.toFixed(5)}</span></div>
      <dl class="sc-grid sc-grid-prop"><div><dt>Property type</dt><dd>${PF.state.subtype || '\u2013'}</dd></div><div><dt>Land boundary</dt><dd>${bd}</dd></div></dl>`;
  }
  const locKey = () => { const L0 = PF.state.location, b = PF.state.boundary; return L0 && L0.confirmed ? [L0.latitude, L0.longitude, b.defined ? b.area : 0, PF.state.subtype].join('|') : ''; };
  let shownKey = '';
  const b0 = () => PF.state.boundary;
  home.showProperty = () => {
    const L0 = PF.state.location; if (!L0 || !L0.confirmed) return;
    const ll = { lat: L0.latitude, lng: L0.longitude };
    const label = L0.address ? L0.address.split(',')[0].replace(/^Near /, '') : 'Your property';
    dropPin(ll, label, { fly: false, property: true });
    $('#chatFocus').textContent = label;
    sysMsg(`Your property \u00B7 ${L0.latitude.toFixed(5)}, ${L0.longitude.toFixed(5)}${b0().defined ? ' \u00B7 boundary shown' : ''}`);
    const b = PF.state.boundary;
    if (mapReady) {
      if (b.defined && b.geometry) {
        const poly = L.polygon(b.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]), { className: 'lf-parcel', weight: 2.5 }).addTo(pinLayer);
        map.fitBounds(poly.getBounds(), { padding: [90, 90], maxZoom: 17 });
      } else map.setView([ll.lat, ll.lng], 15);
    }
    shownKey = locKey();
  };
  home.onShow = () => { if (city) { city.resize(); city.start(); } };
  /* the map explorer page: Leaflet is created the first time the page is visible */
  home.onExploreShow = () => {
    setTimeout(() => {
      if (!map && !home._mapTried) { home._mapTried = true; initMap(); }
      if (!mapReady) return;
      map.invalidateSize();
      if (PF._focusProperty || (locKey() && locKey() !== shownKey)) home.showProperty();
      PF._focusProperty = false;
    }, 40);
  };
  home.onHide = () => { if (city) city.stop(); };
})();
