/* =========================================================================
   Site Intelligence — SiteMap: a small, dependency-free slippy map used by the
   Property Location and Boundary steps. Web-Mercator tiles, drag to pan,
   wheel / pinch / buttons to zoom, click events, and an SVG + HTML overlay
   that consumers redraw on every render (markers, polygons, handles).

   const m = PF.createSiteMap(el, { center: {lat, lng}, zoom: 14, basemap: 'map' | 'satellite' })
   m.on('click', ll => …)  m.on('hover', (ll, pt) => …)  m.on('render', () => …)
   m.setView(ll, zoom, { animate })  m.fitBounds([ll, …])  m.toPoint(ll)  m.toLatLng(pt)
   ========================================================================= */

window.PF = window.PF || {};

PF.createSiteMap = function (el, opts = {}) {
  const TILE = 256, MIN_Z = 3, MAX_Z = 19;
  /* Each basemap lists tile sources in order of preference. If a source fails to
     load (blocked network, outage, a page that doesn't allow external images) the
     map falls through to the next one, and finally to an offline grid so that
     placing the pin and drawing the boundary always keep working. */
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
  const ESRI2 = 'https://services.arcgisonline.com/ArcGIS/rest/services/';
  const ESRI_ATTR = 'Powered by Esri \u00B7 Esri, HERE, Garmin, USGS, NGA, OpenStreetMap contributors';
  const SAT_ATTR = 'Powered by Esri \u00B7 Esri, Maxar, Earthstar Geographics, GIS User Community';
  const sat = E => [E + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', E + 'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', E + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'];
  const STREET_SOURCES = [
    { layers: [ESRI + 'World_Street_Map/MapServer/tile/{z}/{y}/{x}'], attr: ESRI_ATTR },
    { layers: [ESRI2 + 'World_Street_Map/MapServer/tile/{z}/{y}/{x}'], attr: ESRI_ATTR },
    { layers: ['https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'], attr: '\u00A9 OpenStreetMap contributors \u00A9 CARTO', maxZ: 20 },
    { layers: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], attr: '\u00A9 OpenStreetMap contributors' },
  ];
  const BASEMAPS = {
    map: { sources: STREET_SOURCES },
    satellite: { sources: [{ layers: sat(ESRI), attr: SAT_ATTR }, { layers: sat(ESRI2), attr: SAT_ATTR }, ...STREET_SOURCES] },
  };
  let center = { ...(opts.center || { lat: 20.59, lng: 78.96 }) };
  let zoom = opts.zoom ?? 5;
  let basemap = opts.basemap || 'map';
  let interactive = opts.interactive !== false;
  const handlers = { click: [], hover: [], render: [], move: [] };

  /* ---------- DOM ---------- */
  el.classList.add('sm');
  el.innerHTML = `
    <div class="sm-tiles"></div>
    <canvas class="sm-grid" aria-hidden="true"></canvas>
    <svg class="sm-svg" xmlns="http://www.w3.org/2000/svg"></svg>
    <div class="sm-html"></div>
    <div class="sm-ctrl">
      <button type="button" class="sm-btn" data-z="1" aria-label="Zoom in">+</button>
      <button type="button" class="sm-btn" data-z="-1" aria-label="Zoom out">−</button>
    </div>
    <div class="sm-layers" role="group" aria-label="Basemap">
      <button type="button" data-bm="map">Streets</button><button type="button" data-bm="satellite">Satellite</button>
    </div>
    <div class="sm-attr"></div>
    <p class="sm-offmsg" hidden><b>Map imagery unavailable here.</b> <span>Clicking and drawing still work; coordinates stay exact.</span></p>`;
  const tilesEl = el.querySelector('.sm-tiles'), svg = el.querySelector('.sm-svg'), html = el.querySelector('.sm-html');
  const attrEl = el.querySelector('.sm-attr'), gridEl = el.querySelector('.sm-grid'), offMsg = el.querySelector('.sm-offmsg');
  if (!interactive) el.classList.add('sm-static');

  /* ---------- projection ---------- */
  const world = z => TILE * Math.pow(2, z);
  const project = (ll, z) => {
    const W = world(z), s = Math.min(Math.max(Math.sin(ll.lat * Math.PI / 180), -0.9999), 0.9999);
    return { x: (ll.lng + 180) / 360 * W, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * W };
  };
  const unproject = (p, z) => {
    const W = world(z), n = Math.PI - 2 * Math.PI * p.y / W;
    return { lat: 180 / Math.PI * Math.atan(Math.sinh(n)), lng: p.x / W * 360 - 180 };
  };
  const size = () => ({ w: el.clientWidth, h: el.clientHeight });
  function toPoint(ll) { const { w, h } = size(), c = project(center, zoom), p = project(ll, zoom); return { x: p.x - c.x + w / 2, y: p.y - c.y + h / 2 }; }
  function toLatLng(pt) { const { w, h } = size(), c = project(center, zoom); return unproject({ x: c.x + pt.x - w / 2, y: c.y + pt.y - h / 2 }, zoom); }
  const clampZ = z => Math.max(MIN_Z, Math.min(MAX_Z, z));

  /* ---------- tiles ---------- */
  const pool = new Map();
  let loadedAny = false, srcIdx = 0, fails = 0, offline = false, failTimer = 0;
  const SUBS = 'abcd';
  const tileUrl = (tpl, z, x, y) => tpl.replace('{s}', SUBS[(x + y) % 4]).replace('{z}', z).replace('{x}', x).replace('{y}', y);
  let layerEls = [];
  const source = () => BASEMAPS[basemap].sources[srcIdx];
  function tileFailed() {
    if (loadedAny || offline) return;
    if (++fails >= 3) nextSource();
  }
  function nextSource() {
    clearTimeout(failTimer);
    if (srcIdx < BASEMAPS[basemap].sources.length - 1) { srcIdx++; resetLayers(); }
    else goOffline();
  }
  function goOffline() {
    offline = true; el.classList.add('sm-offline'); el.classList.remove('sm-nobase');
    tilesEl.innerHTML = ''; pool.clear(); offMsg.hidden = false; attrEl.textContent = '';
    render();
  }
  function resetLayers() {
    loadedAny = false; fails = 0; el.classList.add('sm-nobase');
    tilesEl.innerHTML = ''; pool.clear();
    layerEls = source().layers.map((_, i) => { const d = document.createElement('div'); d.className = 'sm-layer' + (i ? ' sm-ref' : ''); tilesEl.appendChild(d); return d; });
    attrEl.textContent = source().attr;
    clearTimeout(failTimer);
    // a source that neither loads nor errors (hung network) is skipped after 9 s
    failTimer = setTimeout(() => { if (!loadedAny && !offline && size().w) nextSource(); }, 9000);
    render();
  }
  function renderGrid() {
    const { w, h } = size();
    if (!offline) { if (gridEl.width) { gridEl.width = 0; gridEl.height = 0; } return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    gridEl.width = w * dpr; gridEl.height = h * dpr; gridEl.style.width = w + 'px'; gridEl.style.height = h + 'px';
    const g = gridEl.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const tl = toLatLng({ x: 0, y: 0 }), br = toLatLng({ x: w, y: h });
    const span = Math.max(br.lng - tl.lng, 1e-6);
    const steps = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
    const st = steps.find(s => span / s <= 8) || 10, dec = Math.max(0, -Math.floor(Math.log10(st)));
    g.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'; g.fillStyle = 'rgba(14,42,85,.45)';
    for (let k = Math.ceil(tl.lng / st); k * st <= br.lng; k++) {
      const x = toPoint({ lat: tl.lat, lng: k * st }).x;
      g.strokeStyle = k % 5 ? 'rgba(14,42,85,.07)' : 'rgba(14,42,85,.16)'; g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke();
      g.fillText((k * st).toFixed(dec) + '\u00B0E', x + 4, h - 8);
    }
    for (let k = Math.ceil(br.lat / st); k * st <= tl.lat; k++) {
      const y = toPoint({ lat: k * st, lng: tl.lng }).y;
      g.strokeStyle = k % 5 ? 'rgba(14,42,85,.07)' : 'rgba(14,42,85,.16)'; g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke();
      g.fillText((k * st).toFixed(dec) + '\u00B0N', 6, y - 4);
    }
  }
  function renderTiles() {
    const { w, h } = size(); if (!w || !h) return;
    renderGrid();
    if (offline) return;
    const z0 = Math.min(MAX_Z, Math.floor(zoom)), s = Math.pow(2, zoom - z0), n = Math.pow(2, z0);
    const c = project(center, z0), tlx = c.x - w / 2 / s, tly = c.y - h / 2 / s;
    const x0 = Math.floor(tlx / TILE), x1 = Math.floor((tlx + w / s) / TILE), y0 = Math.max(0, Math.floor(tly / TILE)), y1 = Math.min(n - 1, Math.floor((tly + h / s) / TILE));
    const used = new Set();
    source().layers.forEach((tpl, li) => { for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) {
      const wx = ((tx % n) + n) % n, key = `${basemap}/${srcIdx}/${li}/${z0}/${tx}/${ty}`;
      used.add(key);
      let img = pool.get(key);
      if (!img) {
        img = new Image(); img.alt = ''; img.draggable = false; img.decoding = 'async';
        img.onload = () => { img.classList.add('on'); if (!loadedAny && li === 0) { loadedAny = true; clearTimeout(failTimer); el.classList.remove('sm-nobase'); } };
        img.onerror = () => { img.remove(); if (li === 0) tileFailed(); };
        img.src = tileUrl(tpl, z0, wx, ty);
        pool.set(key, img); (layerEls[li] || tilesEl).appendChild(img);
      }
      const T = TILE * s;
      img.style.transform = `translate3d(${((tx * TILE - tlx) * s).toFixed(2)}px, ${((ty * TILE - tly) * s).toFixed(2)}px, 0)`;
      img.style.width = img.style.height = (T + 0.6) + 'px';
    } });
    pool.forEach((img, key) => { if (!used.has(key)) { img.remove(); pool.delete(key); } });
  }

  /* ---------- render loop (batched) ---------- */
  let queued = false;
  function render() {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const { w, h } = size();
      svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      renderTiles();
      handlers.render.forEach(f => f());
    });
  }
  function emit(type, ...a) { handlers[type].forEach(f => f(...a)); }

  /* ---------- view ---------- */
  let anim = 0;
  function setView(ll, z = zoom, o = {}) {
    cancelAnimationFrame(anim);
    z = clampZ(z);
    if (!o.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) { center = { ...ll }; zoom = z; render(); emit('move'); return; }
    const c0 = { ...center }, z0 = zoom, t0 = performance.now(), D = o.duration || 650;
    const step = now => {
      const t = Math.min(1, (now - t0) / D), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      center = { lat: c0.lat + (ll.lat - c0.lat) * e, lng: c0.lng + (ll.lng - c0.lng) * e };
      zoom = z0 + (z - z0) * e; render();
      if (t < 1) anim = requestAnimationFrame(step); else emit('move');
    };
    anim = requestAnimationFrame(step);
  }
  function zoomAround(pt, z) {
    z = clampZ(z); const ll = toLatLng(pt);
    zoom = z;
    const p = toPoint(ll), c = project(center, zoom);
    center = unproject({ x: c.x + (p.x - pt.x), y: c.y + (p.y - pt.y) }, zoom);
    render();
  }
  function fitBounds(lls, o = {}) {
    if (!lls.length) return;
    const { w, h } = size(), pad = o.padding ?? 60;
    let lo = { lat: 90, lng: 180 }, hi = { lat: -90, lng: -180 };
    lls.forEach(p => { lo.lat = Math.min(lo.lat, p.lat); lo.lng = Math.min(lo.lng, p.lng); hi.lat = Math.max(hi.lat, p.lat); hi.lng = Math.max(hi.lng, p.lng); });
    let z = o.maxZoom ?? 18;
    for (; z > MIN_Z; z -= 0.25) { const a = project({ lat: hi.lat, lng: lo.lng }, z), b = project({ lat: lo.lat, lng: hi.lng }, z); if (b.x - a.x <= w - pad * 2 && b.y - a.y <= h - pad * 2) break; }
    const mid = unproject({ x: (project(lo, z).x + project(hi, z).x) / 2, y: (project(lo, z).y + project(hi, z).y) / 2 }, z);
    setView(mid, z, o);
  }

  /* ---------- input ---------- */
  const pointers = new Map();
  let drag = null, pinch = null, dragEnabled = true;
  const rel = e => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  el.addEventListener('pointerdown', e => {
    if (!interactive || e.target.closest('.sm-ctrl, .sm-layers, [data-stop]')) return;
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, rel(e));
    if (pointers.size === 1) drag = { start: rel(e), last: rel(e), moved: false };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; drag = null; }
  });
  el.addEventListener('pointermove', e => {
    const p = rel(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAround({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, pinch.z + Math.log2(d / pinch.d)); return;
    }
    if (drag && dragEnabled) {
      if (!drag.moved && Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 4) { drag.moved = true; el.classList.add('sm-dragging'); }
      if (drag.moved) {
        const c = project(center, zoom);
        center = unproject({ x: c.x - (p.x - drag.last.x), y: c.y - (p.y - drag.last.y) }, zoom);
        drag.last = p; render();
      }
    }
    if (interactive) emit('hover', toLatLng(p), p, e);
  });
  const end = e => {
    const wasDrag = drag && drag.moved, p = rel(e);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      el.classList.remove('sm-dragging');
      if (drag && !wasDrag && e.type === 'pointerup') emit('click', toLatLng(p), p, e);
      if (wasDrag) emit('move');
      drag = null;
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', e => {
    if (!interactive) return;
    e.preventDefault();
    zoomAround(rel(e), zoom - Math.sign(e.deltaY) * Math.min(0.6, Math.abs(e.deltaY) / 180));
    clearTimeout(el._wt); el._wt = setTimeout(() => emit('move'), 200);
  }, { passive: false });
  el.addEventListener('dblclick', e => { if (!interactive || opts.noDblZoom || e.target.closest('.sm-ctrl, .sm-layers, [data-stop]')) return; e.preventDefault(); zoomAround(rel(e), zoom + 1); });
  el.querySelectorAll('.sm-btn').forEach(b => b.addEventListener('click', () => setView(center, Math.round(zoom) + +b.dataset.z, { animate: true, duration: 300 })));
  const setBase = b => {
    basemap = b; el.dataset.basemap = b;
    if (offline) { render(); return; }
    srcIdx = 0; resetLayers();
  };
  el.querySelectorAll('[data-bm]').forEach(b => b.addEventListener('click', () => setBase(b.dataset.bm)));
  setBase(basemap);
  if ('ResizeObserver' in window) new ResizeObserver(render).observe(el);

  return {
    el, svg, html,
    on(type, fn) { handlers[type].push(fn); return this; },
    setView, fitBounds, toPoint, toLatLng, render,
    getCenter: () => ({ ...center }), getZoom: () => zoom,
    setBasemap: setBase,
    setDragging(v) { dragEnabled = v; },
    setInteractive(v) { interactive = v; el.classList.toggle('sm-static', !v); },
  };
};

/* ---------- geometry helpers ---------- */
PF.geo = {
  /* Geodesic polygon area in m² (spherical excess approximation, as used by most web GIS tools) */
  area(latlngs) {
    const R = 6378137, rad = d => d * Math.PI / 180; let a = 0;
    for (let i = 0; i < latlngs.length; i++) {
      const p1 = latlngs[i], p2 = latlngs[(i + 1) % latlngs.length];
      a += rad(p2.lng - p1.lng) * (2 + Math.sin(rad(p1.lat)) + Math.sin(rad(p2.lat)));
    }
    return Math.abs(a * R * R / 2);
  },
  /* True when any two non-adjacent edges cross */
  selfIntersects(pts) {
    const n = pts.length; if (n < 4) return false;
    const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    const cross = (a, b, c, d) => ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
    const P = pts.map(p => ({ x: p.lng, y: p.lat }));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      if (cross(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return true;
    }
    return false;
  },
  fmtArea(m2) {
    const acres = m2 / 4046.8564224, ha = m2 / 10000;
    return { m2, acres, ha, text: `${Math.round(m2).toLocaleString('en-IN')} m²`, alt: `${acres < 10 ? acres.toFixed(2) : acres.toFixed(1)} acres · ${ha < 10 ? ha.toFixed(2) : ha.toFixed(1)} ha` };
  },
};
