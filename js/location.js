/* =========================================================================
   Site Intelligence — Property Location & Boundary (builder steps 2, 3, 5)

   Data model (kept separate on purpose — a boundary never replaces a location):
     PF.state.location = { latitude, longitude, address, source: 'map'|'link'|'coordinates', confirmed }
     PF.state.boundary = { mode, required, defined, skipped, geometry (GeoJSON Polygon), area, areaUnit, areaAcres }
   PF.reportData() returns the full ReportData used by the report, PDF and map.
   ========================================================================= */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const S = () => PF.state;
  const LOC = PF.loc = {};
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => (+n).toFixed(6);
  const SOURCE_LABEL = { map: 'Map selection', link: 'Google Maps link', coordinates: 'Coordinates' };

  /* ---------------------------------------------------------------- state */
  LOC.initState = () => {
    S().location = { latitude: null, longitude: null, address: null, source: null, confirmed: false };
    LOC._wantBoundary = false;
    S().boundary = { mode: 'optional', required: false, defined: false, skipped: false, geometry: null, area: null, areaUnit: 'm2', areaAcres: null };
  };
  LOC.mode = () => PF.getTypeConfig(S().category, S().subtype).boundaryMode;
  LOC.syncType = () => { const m = LOC.mode(); S().boundary.mode = m; S().boundary.required = m === 'required'; };
  LOC.locationDone = () => !!S().location.confirmed;
  LOC.boundaryDone = () => { const m = LOC.mode(), b = S().boundary; return m === 'not_applicable' || b.defined || (m === 'optional' && b.skipped); };
  LOC.boundaryStatus = () => {
    const m = LOC.mode(), b = S().boundary;
    if (m === 'not_applicable') return { key: 'na', text: 'Not required for this property type' };
    if (b.defined) { const a = PF.geo.fmtArea(b.area); return { key: 'defined', text: `Defined · ${a.text}`, area: a }; }
    if (m === 'optional' && b.skipped) return { key: 'skipped', text: 'Skipped · no land parcel defined' };
    return { key: 'missing', text: m === 'required' ? 'Required · not defined yet' : 'Not decided yet' };
  };
  PF.reportData = () => ({
    propertyType: { category: S().category, subtype: S().subtype, config: PF.getTypeConfig(S().category, S().subtype) },
    sections: PF.sections.filter(s => S().sections.has(s.id)).map(s => s.id),
    location: { ...S().location },
    boundary: { ...S().boundary },
  });

  /* ---------------------------------------------------------------- Google Maps links */
  PF.parseMapsLink = raw => {
    const url = String(raw || '').trim();
    const fail = error => ({ ok: false, error });
    if (!url) return fail('Paste a Google Maps link first.');
    const ok = (lat, lng, address) => {
      lat = +lat; lng = +lng;
      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return { ok: true, lat, lng, address: address || null };
    };
    const geo = url.match(/^geo:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
    if (geo) return ok(geo[1], geo[2]) || fail('BAD');
    let u;
    try { u = new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url); } catch (e) { return fail('BAD'); }
    const host = u.hostname.toLowerCase();
    if (/(^|\.)(maps\.app\.goo\.gl|goo\.gl)$/.test(host)) return fail('SHORT');
    const isGoogle = /(^|\.)google\.[a-z.]+$/.test(host) && (host.startsWith('maps.') || u.pathname.startsWith('/maps'));
    if (!isGoogle) return fail('BAD');
    const full = decodeURIComponent(u.href);
    let place = null;
    const pm = u.pathname.match(/\/place\/([^/@]+)/);
    if (pm) { const name = decodeURIComponent(pm[1]).replace(/\+/g, ' ').trim(); if (!/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(name)) place = name; }
    // 1. exact place pin  !3d<lat>!4d<lng>
    let m = full.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (m) return ok(m[1], m[2], place) || fail('BAD');
    // 2. query parameters holding "lat,lng"
    for (const k of ['q', 'query', 'll', 'center', 'destination', 'daddr', 'sll', 'viewpoint']) {
      const v = u.searchParams.get(k);
      const mm = v && v.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (mm) return ok(mm[1], mm[2], place) || fail('BAD');
    }
    // 3. /place/<lat>,<lng> or /search/<lat>,<lng>
    m = u.pathname.match(/\/(?:place|search|dir)\/(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/);
    if (m) return ok(m[1], m[2], place) || fail('BAD');
    // 4. map viewport  @<lat>,<lng>,<zoom>
    m = full.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,[\d.]+[zm])?/);
    if (m) return ok(m[1], m[2], place) || fail('BAD');
    return fail(place || u.searchParams.get('q') ? 'NOCOORDS' : 'BAD');
  };
  const LINK_ERRORS = {
    BAD: 'We couldn’t identify a location from this link. Please try another Google Maps link or use Select on Map / Enter Coordinates.',
    SHORT: 'Short links (maps.app.goo.gl) can’t be read here. Open the link, then copy the full address-bar URL, or use Select on Map / Enter Coordinates.',
    NOCOORDS: 'This link names a place but doesn’t include its coordinates, so we can’t pin it exactly. In Google Maps, click the property’s pin and copy the new link, or use Select on Map / Enter Coordinates.',
  };

  /* ---------------------------------------------------------------- locality lookup */
  const knownPlace = ll => {
    const p = PF.places.map(p => ({ p, d: PF.dist(ll, p) })).sort((a, b) => a.d - b.d)[0];
    return p && p.d < 20 ? `Near ${p.p.name}, ${p.p.district}` : null;
  };
  async function lookupAddress(ll) {
    const r = await PF.geocoder.reverse(ll);   // Esri reverse geocoding
    return r || knownPlace(ll);
  }

  /* ---------------------------------------------------------------- shared drawing helpers */
  function pinEl(cls = '') { const d = document.createElement('div'); d.className = 'sm-pin ' + cls; d.innerHTML = '<span></span>'; return d; }
  const place = (el, map, ll) => { const p = map.toPoint(ll); el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`; };
  function polyPath(map, pts, close) { if (!pts.length) return ''; return pts.map((ll, i) => { const p = map.toPoint(ll); return `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join(' ') + (close ? ' Z' : ''); }
  const geomToPts = g => g && g.coordinates ? g.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng })) : [];
  const ptsToGeom = pts => ({ type: 'Polygon', coordinates: [[...pts.map(p => [+p.lng.toFixed(7), +p.lat.toFixed(7)]), [+pts[0].lng.toFixed(7), +pts[0].lat.toFixed(7)]]] });
  const inPoly = (pt, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if (((a.lat > pt.lat) !== (b.lat > pt.lat)) && (pt.lng < (b.lng - a.lng) * (pt.lat - a.lat) / (b.lat - a.lat) + a.lng)) c = !c; } return c; };
  const startCenter = () => {
    if (S().location.confirmed) return { lat: S().location.latitude, lng: S().location.longitude };
    if (PF._suggestSite) return PF._suggestSite;
    return null;
  };

  /* ================================================================ STEP 2 — LOCATION */
  let locMap = null, locPin = null, method = null, pending = null;

  const INDIA = { lat: 22.6, lng: 79.6 };
  function selectMethod(m, opts = {}) {
    method = m;
    $$('#locMethods .lm').forEach(c => { c.classList.toggle('is-active', c.dataset.method === m); c.setAttribute('aria-checked', c.dataset.method === m); });
    $$('.loc-panel').forEach(p => p.hidden = p.dataset.panel !== m);
    $('#gmErr').hidden = true; $('#coErr').hidden = true;
    $('#locStage').dataset.method = m;
    ensureLocMap();
    if (!opts.keepPending) { pending = null; renderResult(); }
    $('#locHint').hidden = !(m === 'map' && !pending);
    if (m === 'map' && !opts.keepPending && !opts.keepView) {
      const c = startCenter();
      locMap.setView(c || INDIA, c ? (S().location.confirmed ? 16 : 13) : 5, { animate: true });
    }
    setTimeout(() => { locMap.render(); const f = { map: '#locSearch', link: '#gmLink', coordinates: '#latIn' }[m]; if (opts.focus && f) $(f).focus(); }, 60);
  }

  function ensureLocMap() {
    if (locMap) return;
    const c = startCenter();
    locMap = PF.createSiteMap($('#locMap'), { center: c || INDIA, zoom: c ? 13 : 5, basemap: 'map' });
    locPin = pinEl(); locPin.hidden = true; locMap.html.appendChild(locPin);
    locMap.on('render', () => { if (pending) place(locPin, locMap, pending); });
    locMap.on('click', ll => {
      if (method !== 'map') selectMethod('map', { keepPending: true, keepView: true });
      $('#locHint').hidden = true;
      setPending({ lat: ll.lat, lng: ll.lng, source: 'map' });
    });
  }

  async function setPending(p, o = {}) {
    pending = { ...p, address: p.address || null };
    $('#locHint').hidden = true;
    locPin.hidden = false; locPin.classList.remove('drop'); void locPin.offsetWidth; locPin.classList.add('drop');
    if (o.fly) locMap.setView(pending, 16, { animate: true }); else locMap.render();
    renderResult();
    if (!pending.address) {
      const ref = pending; ref.addressLoading = true; renderResult();
      const a = await lookupAddress(ref);
      if (pending === ref) { ref.address = a; ref.addressLoading = false; renderResult(); }
    }
  }

  function renderResult() {
    const box = $('#locResult');
    if (!pending) {
      const how = { map: 'Search above or click the exact spot of the property on the map.', link: 'Paste a full Google Maps link above and click Locate.', coordinates: 'Enter the latitude and longitude above and click Locate.' }[method] || '';
      box.innerHTML = `<p class="lr-empty">${PF.icon('pin')}<span><b>No location selected yet</b>${how}</span></p>`;
      if (locPin) locPin.hidden = true;
      $('#locHint').hidden = method !== 'map';
      PF.builder && PF.builder.renderRail && PF.builder.renderRail();
      return;
    }
    const found = pending.source !== 'map';
    box.innerHTML = `
      <p class="lr-k">${found ? '<span class="dot-ok"></span>Location found' : 'Selected location'}</p>
      <dl class="lr-dl">
        <div><dt>Latitude</dt><dd class="mono">${fmt(pending.lat)}</dd></div>
        <div><dt>Longitude</dt><dd class="mono">${fmt(pending.lng)}</dd></div>
        <div class="wide"><dt>Address / locality</dt><dd>${pending.addressLoading ? '<span class="muted">Looking up…</span>' : esc(pending.address) || '<span class="muted">Not available</span>'}</dd></div>
        <div class="wide"><dt>Source</dt><dd>${SOURCE_LABEL[pending.source]}</dd></div>
      </dl>
      <p class="lr-note">Not quite right? Click elsewhere on the map to move the pin.</p>
      ${PF.gmaps.links(pending)}
      <div class="lr-actions">
        <button type="button" class="btn btn-quiet btn-block btn-sm" id="locChange">Clear selection</button>
      </div>`;
    $('#locChange').onclick = () => { pending = null; S().location.confirmed = false; renderResult(); const inp = { map: '#locSearch', link: '#gmLink', coordinates: '#latIn' }[method]; inp && $(inp).focus(); };
    PF.builder && PF.builder.renderRail && PF.builder.renderRail();
  }

  function confirmLocation() {
    if (!pending) return;
    const prev = S().location;
    const moved = prev.confirmed ? PF.dist({ lat: prev.latitude, lng: prev.longitude }, pending) : 0;
    S().location = { latitude: +pending.lat.toFixed(7), longitude: +pending.lng.toFixed(7), address: pending.address || null, source: pending.source, confirmed: true };
    S().site = PF.snapshot({ lat: pending.lat, lng: pending.lng }, pending.address ? pending.address.split(',')[0].replace(/^Near /, '') : 'Your property');
    S().site.isProperty = true;
    PF._suggestSite = null;
    // a boundary drawn for a different place no longer applies
    const b = S().boundary;
    if (b.defined && moved > 1.5) { const pts = geomToPts(b.geometry); if (pts.length && !inPoly(pending, pts)) { Object.assign(b, { defined: false, geometry: null, area: null, areaAcres: null }); PF.toast('Location moved, so the old boundary was cleared'); } }
    PF.toast('Location confirmed');
    PF.builder.setStep(3);
  }
  LOC.hasPending = () => { const L0 = S().location; return !!pending && !(L0.confirmed && Math.abs(L0.latitude - pending.lat) < 1e-7 && Math.abs(L0.longitude - pending.lng) < 1e-7); };
  LOC.confirmPending = confirmLocation;

  function locateFromLink() {
    const err = $('#gmErr'); err.hidden = true;
    const r = PF.parseMapsLink($('#gmLink').value);
    if (!r.ok) { err.textContent = LINK_ERRORS[r.error] || r.error; err.hidden = false; $('#gmLink').setAttribute('aria-invalid', 'true'); return; }
    $('#gmLink').removeAttribute('aria-invalid');
    selectMethod('link', { keepPending: true });
    setPending({ lat: r.lat, lng: r.lng, address: r.address, source: 'link' }, { fly: true });
  }

  function locateFromCoords() {
    const latEl = $('#latIn'), lngEl = $('#lngIn'), err = $('#coErr');
    // accept "28.45, 77.02" pasted into either box
    const both = (latEl.value + ' ' + lngEl.value).trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (both && !lngEl.value.trim()) { latEl.value = both[1]; lngEl.value = both[2]; }
    const lat = parseFloat(latEl.value), lng = parseFloat(lngEl.value), msgs = [];
    latEl.removeAttribute('aria-invalid'); lngEl.removeAttribute('aria-invalid');
    if (latEl.value.trim() === '' || !isFinite(lat) || !/^-?\d+(\.\d+)?$/.test(latEl.value.trim())) { msgs.push('Enter a latitude as a number, e.g. 28.4595.'); latEl.setAttribute('aria-invalid', 'true'); }
    else if (lat < -90 || lat > 90) { msgs.push('Latitude must be between -90 and 90.'); latEl.setAttribute('aria-invalid', 'true'); }
    if (lngEl.value.trim() === '' || !isFinite(lng) || !/^-?\d+(\.\d+)?$/.test(lngEl.value.trim())) { msgs.push('Enter a longitude as a number, e.g. 77.0266.'); lngEl.setAttribute('aria-invalid', 'true'); }
    else if (lng < -180 || lng > 180) { msgs.push('Longitude must be between -180 and 180.'); lngEl.setAttribute('aria-invalid', 'true'); }
    if (msgs.length) { err.innerHTML = msgs.join('<br>'); err.hidden = false; return; }
    err.hidden = true;
    selectMethod('coordinates', { keepPending: true });
    setPending({ lat, lng, source: 'coordinates' }, { fly: true });
  }

  function wireSearch() {
    PF.attachSearch($('#locSearch'), $('#locSuggest'), {
      near: () => locMap && locMap.getCenter(),
      onPick: r => {
        if (method !== 'map') selectMethod('map', { keepPending: true, keepView: true });
        setPending({ lat: r.lat, lng: r.lng, address: r.address, source: 'map' }, { fly: true });
        $('#locHint').hidden = false; $('#locHint').innerHTML = `${PF.icon('pin')}Pin placed at the search result. Click the exact spot to adjust`;
      },
    });
  }

  LOC.enterLocation = () => {
    ensureLocMap();
    const L0 = S().location;
    if (L0.confirmed) {
      pending = { lat: L0.latitude, lng: L0.longitude, address: L0.address, source: L0.source };
      if (L0.source === 'coordinates') { $('#latIn').value = L0.latitude; $('#lngIn').value = L0.longitude; }
      selectMethod(L0.source, { keepPending: true });
      locPin.hidden = false;
      setTimeout(() => { locMap.setView(pending, 16); renderResult(); }, 30);
    } else if (PF._suggestSite && !pending) {
      selectMethod('map', { keepView: true });
      setPending({ lat: PF._suggestSite.lat, lng: PF._suggestSite.lng, source: 'map' }, { fly: true });
    } else if (method) { selectMethod(method, { keepPending: true, keepView: true }); }
    else selectMethod('map');
  };

  /* ================================================================ STEP 3 — BOUNDARY */
  let bHint = null;
  let bMap = null, pts = [], closed = false, bmode = 'idle', hover = null, handles = [], bLocPin = null, dragIdx = -1;

  function ensureBMap() {
    if (bMap) return;
    bMap = PF.createSiteMap($('#bdMap'), { center: startCenter() || INDIA, zoom: 17, basemap: 'satellite', noDblZoom: true });
    bLocPin = pinEl('small'); bMap.html.appendChild(bLocPin);
    bHint = document.createElement('p'); bHint.className = 'bd-hint'; bHint.setAttribute('aria-live', 'polite'); bMap.el.appendChild(bHint);
    bMap.on('render', drawBoundary);
    bMap.on('hover', (ll, pt) => { if (bmode === 'draw' && !closed && pts.length) { hover = ll; drawBoundary(); } });
    bMap.on('click', (ll, pt) => {
      if (bmode !== 'draw' || closed) return;
      if (pts.length >= 3) { const f = bMap.toPoint(pts[0]); if (Math.hypot(f.x - pt.x, f.y - pt.y) < 14) return closeShape(); }
      pts.push(ll); rebuildHandles(); update();
    });
    bMap.el.addEventListener('dblclick', e => { if (bmode === 'draw' && !closed && pts.length >= 3 && !e.target.closest('[data-stop]')) { e.preventDefault(); pts.pop(); closeShape(); } });
  }

  function drawBoundary() {
    if (!bMap) return;
    const L0 = S().location;
    if (L0.confirmed) place(bLocPin, bMap, { lat: L0.latitude, lng: L0.longitude });
    const svg = bMap.svg;
    let h = '';
    if (pts.length) {
      h += `<path class="bd-poly ${closed ? 'closed' : ''}" d="${polyPath(bMap, pts, closed)}"/>`;
      if (!closed && bmode === 'draw' && hover) {
        const a = bMap.toPoint(pts[pts.length - 1]), c = bMap.toPoint(hover), f = bMap.toPoint(pts[0]);
        h += `<path class="bd-preview" d="M${a.x} ${a.y} L${c.x} ${c.y}${pts.length >= 2 ? ` L${f.x} ${f.y}` : ''}"/>`;
      }
    }
    svg.innerHTML = h;
    handles.forEach(hd => place(hd.el, bMap, hd.type === 'v' ? pts[hd.i] : mid(hd.i)));
  }
  const mid = i => { const a = pts[i], b = pts[(i + 1) % pts.length]; return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }; };

  function rebuildHandles() {
    handles.forEach(h => h.el.remove()); handles = [];
    const showV = bmode === 'edit' || (bmode === 'draw' && !closed);
    if (!showV) { drawBoundary(); return; }
    pts.forEach((_, i) => {
      const el = document.createElement('div'); el.className = 'bd-v' + (i === 0 && bmode === 'draw' && pts.length >= 3 ? ' first' : ''); el.dataset.stop = '1';
      el.title = bmode === 'edit' ? 'Drag to move. Double-click to delete.' : (i === 0 && pts.length >= 3 ? 'Click to close the shape' : '');
      bMap.html.appendChild(el); handles.push({ el, type: 'v', i });
      el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (bmode === 'draw' && !closed) { if (i === 0 && pts.length >= 3) closeShape(); return; }
        if (bmode !== 'edit') return;
        dragIdx = i; el.setPointerCapture(e.pointerId); el.classList.add('dragging');
      });
      el.addEventListener('pointermove', e => { if (dragIdx !== i) return; const r = bMap.el.getBoundingClientRect(); pts[i] = bMap.toLatLng({ x: e.clientX - r.left, y: e.clientY - r.top }); drawBoundary(); update(true); });
      el.addEventListener('pointerup', () => { if (dragIdx === i) { dragIdx = -1; el.classList.remove('dragging'); update(); } });
      el.addEventListener('dblclick', e => { e.stopPropagation(); if (bmode === 'edit' && pts.length > 3) { pts.splice(i, 1); rebuildHandles(); update(); } else if (bmode === 'edit') PF.toast('A boundary needs at least 3 points'); });
    });
    if (bmode === 'edit' && closed) pts.forEach((_, i) => {
      const el = document.createElement('div'); el.className = 'bd-m'; el.dataset.stop = '1'; el.title = 'Drag to add a point';
      bMap.html.appendChild(el); handles.push({ el, type: 'm', i });
      el.addEventListener('pointerdown', e => {
        e.stopPropagation(); pts.splice(i + 1, 0, mid(i)); rebuildHandles();
        const v = handles.find(h => h.type === 'v' && h.i === i + 1); dragIdx = i + 1; v.el.setPointerCapture(e.pointerId); v.el.classList.add('dragging');
      });
    });
    drawBoundary();
  }

  function closeShape() { if (pts.length < 3) return; closed = true; hover = null; setBMode('edit'); PF.toast('Shape closed. Drag points to adjust.'); }
  function setBMode(m) {
    bmode = m;
    bMap.setDragging(true);
    $('#bdMap').classList.toggle('is-drawing', m === 'draw' && !closed);
    rebuildHandles(); update();
  }

  function update(light) {
    const info = $('#bdInfo'), valid = closed && pts.length >= 3;
    const crossing = valid && PF.geo.selfIntersects(pts);
    const area = pts.length >= 3 ? PF.geo.fmtArea(PF.geo.area(pts)) : null;
    const L0 = S().location, outside = valid && L0.confirmed && !inPoly({ lat: L0.latitude, lng: L0.longitude }, pts);
    const tip = bmode === 'draw' && !closed
      ? (pts.length === 0 ? 'Click on the map to place the first corner of the property.' : pts.length < 3 ? 'Keep clicking to add corners.' : 'Click the first point (or double-click) to close the shape.')
      : bmode === 'edit' ? 'Drag a point to move it. Drag a small midpoint to add a corner. Double-click a point to delete it.'
      : valid ? 'Boundary ready. Confirm it, or edit it if needed.' : 'Click Draw Boundary to start.';
    if (bHint) { bHint.textContent = tip; bHint.hidden = !tip; }
    info.innerHTML = `
      <div class="bd-area">
        <span class="bd-k">Approx. land area</span>
        <b class="mono">${area ? area.text : '—'}</b>
        <small>${area ? area.alt : `${pts.length} point${pts.length === 1 ? '' : 's'} placed`}</small>
        <em>Approx. area based on mapped boundary. Not a legal survey.</em>
      </div>
      ${crossing ? '<p class="bd-warn bad">The boundary edges cross each other. Move the points so the shape doesn’t overlap itself.</p>' : ''}
      ${outside ? '<p class="bd-warn">The location pin is outside this boundary. That’s fine if intended; otherwise adjust the shape.</p>' : ''}`;
    if (light) return;
    $('#bdDraw').classList.toggle('is-on', bmode === 'draw');
    $('#bdEdit').classList.toggle('is-on', bmode === 'edit');
    $('#bdEdit').disabled = !closed;
    $('#bdClear').disabled = !pts.length;
    $('#bdUndo').hidden = !(bmode === 'draw' && !closed && pts.length);
    $('#bdFinish').hidden = !(bmode === 'draw' && !closed && pts.length >= 3);
    $('#bdConfirm').disabled = !valid || crossing || (area && area.m2 < 10);
    PF.builder && PF.builder.renderRail && PF.builder.renderRail();
  }

  function confirmBoundary() {
    if (!(closed && pts.length >= 3) || PF.geo.selfIntersects(pts)) return;
    const m2 = PF.geo.area(pts);
    Object.assign(S().boundary, { defined: true, skipped: false, geometry: ptsToGeom(pts), area: Math.round(m2), areaUnit: 'm2', areaAcres: +(m2 / 4046.8564224).toFixed(3) });
    PF.toast('Boundary confirmed');
    PF.builder.setStep(4);
  }

  function showBoundaryTools(show) {
    $('#bdAsk').hidden = show; $('#bdStage').hidden = !show;
    if (show) {
      ensureBMap();
      const L0 = S().location, c = { lat: L0.latitude, lng: L0.longitude };
      const b = S().boundary;
      pts = b.defined ? geomToPts(b.geometry) : pts.length && closed ? pts : [];
      closed = pts.length >= 3;
      setTimeout(() => {
        if (closed) bMap.fitBounds(pts, { padding: 70, maxZoom: 19 }); else bMap.setView(c, 17.5);
        setBMode(closed ? 'idle' : 'draw');
      }, 30);
    }
  }

  LOC.enterBoundary = () => {
    LOC.syncType();
    const m = LOC.mode(), b = S().boundary;
    $('#bdTitle').textContent = m === 'required' ? 'Define the land parcel' : 'Define the property boundary';
    $('#bdSub').textContent = m === 'required' ? 'Draw the boundary of the property on the map.' : 'Optional: outline the land the property sits on, so the report can analyse the whole site.';
    $('#bdSkipLater').hidden = m !== 'optional';
    const ask = m === 'optional' && !b.defined && !LOC._wantBoundary;
    showBoundaryTools(!ask);
  };

  LOC.canConfirmBoundary = () => !!bMap && !$('#bdStage').hidden && !$('#bdConfirm').disabled;
  LOC.confirmBoundary = confirmBoundary;
  LOC._dbg = () => ({ pts: pts.length, closed, bmode, crossing: PF.geo.selfIntersects(pts), p0: pts[0] && bMap.toPoint(pts[0]), rect: bMap.el.getBoundingClientRect().toJSON() });
  /* ================================================================ STEP 5 — CONFIRM */
  let cfMap = null, cfPin = null;
  LOC.enterConfirm = () => {
    const L0 = S().location, b = S().boundary, st = LOC.boundaryStatus(), m = LOC.mode();
    if (!cfMap) {
      cfMap = PF.createSiteMap($('#cfMap'), { center: { lat: L0.latitude, lng: L0.longitude }, zoom: 16, basemap: 'satellite', interactive: false });
      cfPin = pinEl(); cfMap.html.appendChild(cfPin);
      cfMap.on('render', () => {
        const L1 = S().location, bb = S().boundary;
        place(cfPin, cfMap, { lat: L1.latitude, lng: L1.longitude });
        cfMap.svg.innerHTML = bb.defined ? `<path class="bd-poly closed" d="${polyPath(cfMap, geomToPts(bb.geometry), true)}"/>` : '';
      });
    }
    setTimeout(() => { if (b.defined) cfMap.fitBounds(geomToPts(b.geometry), { padding: 50, maxZoom: 18.5 }); else cfMap.setView({ lat: L0.latitude, lng: L0.longitude }, 16.5); }, 30);
    const cat = PF.taxonomy.find(t => t.id === S().category);
    $('#cfDl').innerHTML = `
      <div><dt>Property</dt><dd>${esc(S().subtype)} <span class="muted">\u00B7 ${esc(cat ? cat.name : '')}</span></dd></div>
      <div><dt>Location</dt><dd><span class="ok-tick">${PF.icon('check')}</span><span class="mono">${fmt(L0.latitude)}, ${fmt(L0.longitude)}</span><small class="muted">${SOURCE_LABEL[L0.source]}</small></dd></div>
      <div class="wide"><dt>Locality</dt><dd>${esc(L0.address) || '<span class="muted">Not available</span>'}</dd></div>
      <div><dt>Land boundary</dt><dd>${st.key === 'defined' ? `<span class="ok-tick">${PF.icon('check')}</span><b class="mono">${st.area.text}</b> <span class="muted">/ ${st.area.acres.toFixed(2)} ac</span><small class="muted">Approx., from the mapped boundary</small>` : st.key === 'na' ? 'Not required for this type' : st.key === 'skipped' ? 'Skipped' : '<span class="warn-t">Not defined yet</span>'}</dd></div>
      <div><dt>Street View</dt><dd>${PF.gmaps.links({ lat: L0.latitude, lng: L0.longitude })}</dd></div>
      <div class="wide"><dt>Report sections</dt><dd>${PF.sections.filter(x => S().sections.has(x.id)).map(x => `<span class="mono">${x.num}</span> ${esc(x.title)}`).join('<br>') || '<span class="warn-t">None selected</span>'}</dd></div>`;
    $('#cfEditBoundary').hidden = m === 'not_applicable';
    $('#cfEditBoundary').textContent = b.defined ? 'Edit boundary' : 'Define boundary';
  };

  /* ================================================================ VALIDATION */
  LOC.validate = () => {
    const m = LOC.mode();
    const items = [
      { id: 'type', label: 'Property type', ok: !!S().subtype, step: 1, action: 'Choose property type' },
      { id: 'location', label: 'Property location', ok: LOC.locationDone(), step: 2, action: 'Complete location' },
    ];
    if (m === 'required') items.push({ id: 'boundary', label: 'Property boundary', ok: S().boundary.defined, step: 3, action: 'Define boundary' });
    items.push({ id: 'sections', label: 'Report sections', ok: S().sections.size > 0, step: 4, action: 'Choose sections' });
    return { ok: items.every(i => i.ok), items };
  };
  LOC.showValidation = v => {
    $('#valList').innerHTML = v.items.map(i => `<li class="${i.ok ? 'ok' : 'todo'}"><span class="vi">${i.ok ? PF.icon('check') : ''}</span>${i.label}</li>`).join('');
    const todo = v.items.filter(i => !i.ok);
    $('#valActions').innerHTML = todo.map((i, k) => `<button type="button" class="btn ${k ? 'btn-glass' : 'btn-primary'}" data-vstep="${i.step}">${i.action}</button>`).join('');
    $('#valModal').hidden = false;
    setTimeout(() => { const f = $('#valActions button'); f && f.focus(); }, 30);
  };

  /* ================================================================ WIRING */
  LOC.init = () => {
    LOC.initState();
    $('#locMethods').addEventListener('click', e => {
      const tab = e.target.closest('.lm'); if (!tab) return;
      selectMethod(tab.dataset.method, { keepPending: true, keepView: true, focus: true });
    });
    $('[data-act="locate-link"]').addEventListener('click', locateFromLink);
    $('[data-act="locate-coords"]').addEventListener('click', locateFromCoords);
    $('#gmLink').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); locateFromLink(); } });
    [$('#latIn'), $('#lngIn')].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); locateFromCoords(); } }));
    wireSearch();

    $('#bdYes').onclick = () => { LOC._wantBoundary = true; showBoundaryTools(true); };
    $('#bdSkip').onclick = () => { Object.assign(S().boundary, { skipped: true, defined: false, geometry: null, area: null, areaAcres: null }); LOC._wantBoundary = false; pts = []; closed = false; PF.builder.next(); };
    $('#bdDraw').onclick = () => { if (closed) { if (!confirmSwap()) return; } setBMode('draw'); };
    const confirmSwap = () => { pts = []; closed = false; return true; };
    $('#bdEdit').onclick = () => { if (closed) setBMode(bmode === 'edit' ? 'idle' : 'edit'); };
    $('#bdClear').onclick = () => { pts = []; closed = false; hover = null; Object.assign(S().boundary, { defined: false, geometry: null, area: null, areaAcres: null }); setBMode('draw'); };
    $('#bdUndo').onclick = () => { pts.pop(); rebuildHandles(); update(); };
    $('#bdFinish').onclick = closeShape;
    $('#bdConfirm').onclick = confirmBoundary;
    $('#bdSkipLater').onclick = () => { if (LOC.mode() === 'optional') $('#bdSkip').click(); };
    document.addEventListener('keydown', e => {
      if (S().step !== 3 || !bMap || $('#bdStage').hidden || e.target.closest('input')) return;
      if (bmode === 'draw' && !closed) {
        if (e.key === 'Enter' && pts.length >= 3) { e.preventDefault(); closeShape(); }
        if ((e.key === 'Backspace' || (e.key === 'z' && (e.metaKey || e.ctrlKey))) && pts.length) { e.preventDefault(); pts.pop(); rebuildHandles(); update(); }
        if (e.key === 'Escape') { pts = []; rebuildHandles(); update(); }
      }
    });

    $('#cfEditLocation').onclick = () => PF.builder.setStep(2);
    $('#cfEditBoundary').onclick = () => { LOC._wantBoundary = true; PF.builder.setStep(3); };
    $('#cfEditSections').onclick = () => PF.builder.setStep(4);
    $('#cfContinue').onclick = () => PF.builder.generateChecked();

    $('#valModal').addEventListener('click', e => {
      const b = e.target.closest('[data-vstep]');
      if (b) { $('#valModal').hidden = true; const k = +b.dataset.vstep; if (k === 3) LOC._wantBoundary = true; PF.builder.setStep(k); return; }
      if (e.target === $('#valModal') || e.target.closest('[data-close]')) $('#valModal').hidden = true;
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#valModal').hidden) $('#valModal').hidden = true; });
  };
})();
