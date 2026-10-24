/* =========================================================================
   Site Intelligence — search & geocoding (Esri ArcGIS World Geocoding Service)
   Free, keyless use for interactive search (results are shown, not stored).
   Falls back to local results (coordinates + known localities) when offline.

   PF.geocoder.suggest(text, near) → [{ text, magicKey }]
   PF.geocoder.resolve(item)       → { lat, lng, address } | null
   PF.geocoder.reverse({lat,lng})  → 'Locality, City, State' | null
   PF.attachSearch(input, list, { near: () => ll, onPick: r => … })
   PF.gmaps.links(ll) / PF.gmaps.open(ll) → in-platform Street View viewer
   ========================================================================= */

(function () {
  const CFG = () => PF.config.geocoder || {};
  const BASE = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function getJSON(url, signal) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
    if (signal) signal.addEventListener('abort', () => ctl.abort());
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); if (j.error) throw new Error(j.error.message || 'Geocoder error'); return j; }
    finally { clearTimeout(t); }
  }
  const qs = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  const G = PF.geocoder = {
    online: true,
    async suggest(text, near, signal) {
      const j = await getJSON(`${BASE}/suggest?${qs({ f: 'json', text, maxSuggestions: 6, countryCode: CFG().countryCode, location: near ? `${near.lng},${near.lat}` : '' })}`, signal);
      return (j.suggestions || []).map(s => ({ text: s.text, magicKey: s.magicKey, collection: s.isCollection }));
    },
    async resolve(item, signal) {
      const j = await getJSON(`${BASE}/findAddressCandidates?${qs({ f: 'json', singleLine: item.text, magicKey: item.magicKey, maxLocations: 1, outFields: 'Match_addr,PlaceName,City,Region', countryCode: CFG().countryCode })}`, signal);
      const c = (j.candidates || [])[0];
      return c ? { lat: c.location.y, lng: c.location.x, address: c.address || item.text, extent: c.extent } : null;
    },
    async reverse(ll) {
      try {
        const j = await getJSON(`${BASE}/reverseGeocode?${qs({ f: 'json', location: `${ll.lng},${ll.lat}`, langCode: 'en' })}`);
        const a = j.address || {};
        const parts = [a.Neighborhood || a.District, a.City || a.Subregion, a.Region].filter(Boolean);
        const uniq = parts.filter((p, i) => parts.indexOf(p) === i);
        return uniq.length ? uniq.join(', ') : (a.LongLabel || a.Match_addr || null);
      } catch (e) { return null; }
    },
  };

  /* ---------- Street View, shown inside the platform (no redirect to Google Maps) ----------
     With PF.config.googleMapsEmbedKey set, the official Maps Embed API is used (free, needs a key).
     Without a key, Google's keyless Street View embed is used, which suits a prototype. */
  PF.gmaps = {
    embed: ll => {
      const lat = (+ll.lat).toFixed(6), lng = (+ll.lng).toFixed(6), key = PF.config.googleMapsEmbedKey;
      return key ? `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(key)}&location=${lat},${lng}&heading=0&pitch=0&fov=90`
                 : `https://www.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&output=svembed`;
    },
    links: ll => `<span class="gm-links"><button type="button" class="sv-open" data-sv="${(+ll.lat).toFixed(6)},${(+ll.lng).toFixed(6)}">${PF.icon('route')}Street View</button></span>`,
    open(ll) {
      const m = document.getElementById('svModal'); if (!m) return;
      m.querySelector('#svCoords').textContent = `${(+ll.lat).toFixed(5)}, ${(+ll.lng).toFixed(5)}`;
      const box = m.querySelector('#svFrame');
      box.innerHTML = `<iframe title="Street View" src="${PF.gmaps.embed(ll)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`;
      m.hidden = false; document.body.classList.add('sv-lock');
    },
    close() { const m = document.getElementById('svModal'); if (!m || m.hidden) return; m.hidden = true; m.querySelector('#svFrame').innerHTML = ''; document.body.classList.remove('sv-lock'); },
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-sv]');
    if (b) { e.preventDefault(); const [lat, lng] = b.dataset.sv.split(',').map(Number); return PF.gmaps.open({ lat, lng }); }
    if (e.target.closest('#svModal [data-close]') || e.target.id === 'svModal') PF.gmaps.close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') PF.gmaps.close(); });

  /* ---------- local results: coordinates + known localities ---------- */
  function localResults(q) {
    const out = [];
    const c = q.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (c && Math.abs(+c[1]) <= 90 && Math.abs(+c[2]) <= 180) out.push({ kind: 'coords', text: `${(+c[1]).toFixed(5)}, ${(+c[2]).toFixed(5)}`, sub: 'Coordinates', lat: +c[1], lng: +c[2] });
    const t = q.toLowerCase();
    PF.places.filter(p => p.name.toLowerCase().includes(t)).slice(0, 3).forEach(p => out.push({ kind: 'local', text: p.name, sub: p.district, lat: p.lat, lng: p.lng }));
    return out;
  }

  /* ---------- reusable search box ---------- */
  PF.attachSearch = (input, list, o = {}) => {
    let t, ctl, items = [], active = -1, q = '';
    const render = (state) => {
      if (!q) { list.hidden = true; return; }
      const rows = items.map((it, i) => `<li role="option" data-i="${i}" aria-selected="${i === active}"><span class="sg-ic">${PF.icon(it.kind === 'coords' ? 'locate' : it.kind === 'local' ? 'spark' : 'pin')}</span><span class="sg-t"><b>${esc(it.kind === 'esri' ? it.text.split(',')[0] : it.text)}</b><small>${esc(it.sub ?? it.text.split(',').slice(1).join(',').trim())}</small></span></li>`).join('');
      const foot = state === 'loading' ? '<li class="sg-foot"><span class="spinner"></span>Searching…</li>'
        : state === 'offline' ? '<li class="sg-foot">Online search unavailable here. Showing local matches; you can also type "lat, long".</li>'
        : '<li class="sg-foot sg-powered">Search powered by Esri</li>';
      list.innerHTML = (rows || (state === 'loading' ? '' : '<li class="none">No matches. Try a locality, landmark, address or "lat, long".</li>')) + foot;
      list.hidden = false;
    };
    const run = async () => {
      q = input.value.trim(); active = -1;
      if (ctl) ctl.abort();
      if (!q) { items = []; render(); return; }
      items = localResults(q); render('loading');
      if (q.length < 3 || items[0]?.kind === 'coords') { render('done'); return; }
      ctl = new AbortController();
      try {
        const s = await G.suggest(q, o.near && o.near(), ctl.signal);
        const seen = new Set(items.map(i => i.text.toLowerCase()));
        s.forEach(x => { if (!seen.has(x.text.toLowerCase())) items.push({ kind: 'esri', ...x }); });
        items = items.slice(0, 8); render('done');
      } catch (e) { if (e.name !== 'AbortError') render('offline'); }
    };
    const pick = async i => {
      const it = items[i]; if (!it) return;
      list.hidden = true; input.value = it.text;
      if (it.kind !== 'esri') return o.onPick({ lat: it.lat, lng: it.lng, address: it.kind === 'local' ? `${it.text}, ${it.sub}` : null, label: it.text });
      input.classList.add('is-loading');
      try {
        const r = await G.resolve(it);
        if (r) o.onPick({ ...r, label: it.text.split(',')[0] }); else PF.toast('We couldn’t find that place. Try another search.');
      } catch (e) { PF.toast('Search is unavailable right now. Try "lat, long" or pick on the map.'); }
      finally { input.classList.remove('is-loading'); }
    };
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false');
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 260); });
    input.addEventListener('focus', () => { if (input.value.trim() && items.length) render('done'); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' && items.length) { active = Math.min(items.length - 1, active + 1); render('done'); e.preventDefault(); }
      else if (e.key === 'ArrowUp' && items.length) { active = Math.max(0, active - 1); render('done'); e.preventDefault(); }
      else if (e.key === 'Enter') {
        e.preventDefault(); clearTimeout(t);
        if (active >= 0) pick(active);
        else if (items.length && q === input.value.trim()) pick(0);
        else run().then(() => items.length ? pick(0) : PF.toast('No matches. Try a locality, landmark or "lat, long".'));
      }
      else if (e.key === 'Escape') list.hidden = true;
    });
    input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 160));
    list.addEventListener('mousedown', e => { const li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
    new MutationObserver(() => input.setAttribute('aria-expanded', String(!list.hidden))).observe(list, { attributes: true, attributeFilter: ['hidden'] });
  };
})();
