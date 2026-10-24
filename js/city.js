/* =========================================================================
   Site Intelligence — 3D night city (canvas 2D, no libraries)
   An orthographic isometric city: buildings rise on load, metro lines glow
   and carry light pulses, the subject parcel gets a beam and a wireframe
   "buildable envelope". Exposes projected anchor points so the page can pin
   HTML callouts to 3D positions.

   const city = PF.createCity(canvas, { scan: false, onFrame: (project) => {} })
   ========================================================================= */

window.PF = window.PF || {};

PF.createCity = function (canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = opts.size || 34, AV = 6;               // grid size, avenue every 6 cells
  const half = N / 2;
  let seed = opts.seed || 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* ---------- parcel (subject site) ---------- */
  const P = { x0: 25 - half, y0: 19 - half, w: 3.2, d: 2.6 };
  P.cx = P.x0 + P.w / 2; P.cy = P.y0 + P.d / 2;
  const inParcel = (i, j) => i >= 25 && i <= 28 && j >= 19 && j <= 21;

  /* ---------- buildings ---------- */
  const B = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i % AV === 0 || j % AV === 0 || inParcel(i, j)) continue;
    const X = i - half, Y = j - half;
    const d = Math.hypot(X + 3, Y + 4);
    let h = 0.2 + 5.2 * Math.exp(-(d * d) / 60) + rnd() * 0.9;
    if (rnd() > 0.965) h += 3 + rnd() * 4;               // occasional tower
    if (rnd() > 0.9) h *= 0.35;                           // low-rise pockets
    if (Math.hypot(X + .5 - (P.cx), Y + .5 - (P.cy)) < 3.2) h = Math.min(h, 0.5 + rnd() * 0.5); // clear view of the site
    const inset = 0.12 + rnd() * 0.08;
    B.push({ x: X + inset, y: Y + inset, w: 1 - inset * 2, d: 1 - inset * 2, h, hue: rnd() > 0.82 ? 262 : 228, glow: h > 5 ? (rnd() > .5 ? 'c' : 'v') : null, delay: d * 0.045 + rnd() * 0.25 });
  }

  /* ---------- lines along avenues ---------- */
  const A = k => k * AV - half;
  const lines = [
    { color: '#0E2A55', w: 2.4, pts: [[-half, A(2)], [A(3), A(2)], [A(3), A(4)], [half, A(4)]] },
    { color: '#A1232B', w: 2.4, pts: [[A(4), -half], [A(4), A(3)], [A(2), A(3)], [A(2), half]] },
    { color: '#B48A3C', w: 2.2, dash: [6, 7], pts: [[-half, A(5)], [A(1), A(5)], [A(1), A(1)], [half, A(1)]] },
  ];
  lines.forEach(l => { let L = 0; l.seg = l.pts.slice(1).map((p, k) => { const a = l.pts[k], len = Math.hypot(p[0] - a[0], p[1] - a[1]); L += len; return { a, b: p, len }; }); l.len = L; l.pulses = Array.from({ length: 3 }, (_, k) => k / 3 + rnd() * .1); });
  const along = (l, t) => { let d = ((t % 1) + 1) % 1 * l.len; for (const s of l.seg) { if (d <= s.len) { const f = d / s.len; return [s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f]; } d -= s.len; } return l.pts[l.pts.length - 1]; };

  /* ---------- camera ---------- */
  let w = 0, h = 0, dpr = 1, S = 20, cx = 0, cy = 0;
  let yaw = 0.7, yawT = 0.7, tilt = 0.5, t0 = performance.now(), time = 0, running = true, raf = 0, mouseX = 0.5, mouseY = 0.5;
  const HK = 0.92;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 1.6);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = w > 900;
    S = Math.max(w / (N * (wide ? 1.12 : 1.1)), h / (N * 0.7)) * (opts.zoom || 1);
    cx = w * (opts.cx ?? (wide ? 0.64 : 0.5));
    cy = h * (opts.cy ?? (wide ? 0.56 : 0.8));
  }
  const cosA = () => Math.cos(yaw), sinA = () => Math.sin(yaw);
  let ca = 1, sa = 0;
  const proj = (X, Y, Z = 0) => { const xr = X * ca - Y * sa, yr = X * sa + Y * ca; return [cx + xr * S, cy + yr * S * tilt - Z * S * HK, yr]; };
  const fog = (X, Y) => { const r = Math.hypot(X, Y) / (half * 1.02); return Math.max(0, Math.min(1, 1 - Math.pow(r, 3))); };

  function poly(pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]); ctx.closePath(); }

  function drawGround() {
    // avenue grid
    ctx.lineWidth = 1;
    for (let k = 0; k <= N / AV; k++) {
      const v = A(k);
      const a = proj(v, -half), b = proj(v, half), c = proj(-half, v), d = proj(half, v);
      ctx.strokeStyle = 'rgba(14,42,85,0.10)';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
    }
    // fine grid
    ctx.strokeStyle = 'rgba(14,42,85,0.035)';
    ctx.beginPath();
    for (let k = -half; k <= half; k += 1) { const a = proj(k, -half), b = proj(k, half), c = proj(-half, k), d = proj(half, k); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); }
    ctx.stroke();
    // soft building shadows (architectural model look)
    ctx.fillStyle = 'rgba(14,34,64,0.06)';
    B.forEach(b => {
      const H = b.h * (b.eg || 0); if (H < 0.05) return;
      const f = fog(b.x + b.w / 2, b.y + b.d / 2); if (f <= 0.02) return;
      const vx = H * 0.42, vy = H * 0.26, x0 = b.x, y0 = b.y, x1 = b.x + b.w, y1 = b.y + b.d;
      ctx.globalAlpha = f;
      poly([proj(x0, y0), proj(x1, y0), proj(x1 + vx, y0 + vy), proj(x1 + vx, y1 + vy), proj(x0 + vx, y1 + vy), proj(x0, y1)]); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // transit lines with glow
    lines.forEach(l => {
      const pts = l.pts.map(p => proj(p[0], p[1]));
      ctx.save(); ctx.setLineDash(l.dash || []);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = l.color; ctx.globalAlpha = 0.07; ctx.lineWidth = l.w * 4;
      ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.lineWidth = l.w;
      if (l.dash) ctx.lineDashOffset = -time * 14;
      ctx.stroke(); ctx.restore();
      // pulses
      l.pulses.forEach(p0 => {
        for (let tr = 0; tr < 7; tr++) {
          const q = along(l, p0 + time * 0.035 - tr * 0.004), s = proj(q[0], q[1]);
          const f = fog(q[0], q[1]); if (f <= 0) continue;
          ctx.fillStyle = l.color; ctx.globalAlpha = (1 - tr / 7) * f;
          ctx.beginPath(); ctx.arc(s[0], s[1], (3.2 - tr * 0.35), 0, 7); ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    });
    // parcel ground
    const pc = [proj(P.x0, P.y0), proj(P.x0 + P.w, P.y0), proj(P.x0 + P.w, P.y0 + P.d), proj(P.x0, P.y0 + P.d)];
    const g = ctx.createLinearGradient(pc[0][0], pc[0][1], pc[2][0], pc[2][1]);
    g.addColorStop(0, 'rgba(161,35,43,0.30)'); g.addColorStop(1, 'rgba(113,21,40,0.22)');
    poly(pc); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.shadowColor = 'rgba(161,35,43,0.45)'; ctx.shadowBlur = 10; ctx.strokeStyle = '#A1232B'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    // ping rings
    for (let r = 0; r < 2; r++) {
      const ph = ((time * 0.45 + r * 0.5) % 1), rad = 1.4 + ph * 4.5, c0 = proj(P.cx, P.cy);
      ctx.strokeStyle = `rgba(161,35,43,${(1 - ph) * 0.55})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rad * S, rad * S * tilt, 0, 0, 7); ctx.stroke();
    }
  }

  function drawBox(b, grow) {
    const H = b.h * grow; if (H <= 0.01) return;
    const f = fog(b.x + b.w / 2, b.y + b.d / 2); if (f <= 0.02) return;
    const x0 = b.x, y0 = b.y, x1 = b.x + b.w, y1 = b.y + b.d;
    const g0 = [proj(x0, y0), proj(x1, y0), proj(x1, y1), proj(x0, y1)];
    const g1 = [proj(x0, y0, H), proj(x1, y0, H), proj(x1, y1, H), proj(x0, y1, H)];
    const warm = b.hue === 262, HUE = warm ? 34 : 215, SAT = warm ? 20 : 16;
    ctx.globalAlpha = f;
    // side faces: normals (0,-1),(1,0),(0,1),(-1,0)
    const faces = [[0, 1, 0, -1], [1, 2, 1, 0], [2, 3, 0, 1], [3, 0, -1, 0]];
    for (const [a, c, nx, ny] of faces) {
      const nyr = nx * sa + ny * ca; if (nyr <= 0) continue;
      const nxr = nx * ca - ny * sa;
      const lum = nxr > 0 ? 97 : 87;
      const grd = ctx.createLinearGradient(0, g1[a][1], 0, g0[a][1]);
      grd.addColorStop(0, `hsl(${HUE} ${SAT}% ${Math.min(99, lum + 1)}%)`); grd.addColorStop(1, `hsl(${HUE} ${SAT}% ${lum - 6}%)`);
      poly([g0[a], g0[c], g1[c], g1[a]]); ctx.fillStyle = grd; ctx.fill();
      ctx.strokeStyle = `rgba(14,34,64,${0.10 + (nxr > 0 ? 0 : .04)})`; ctx.lineWidth = 0.6; ctx.stroke();
      // window strips on taller buildings
      if (H > 2.2 && S > 12) {
        ctx.fillStyle = warm ? 'rgba(120,90,50,0.16)' : 'rgba(14,42,85,0.13)';
        const rows = Math.floor(H * 1.6);
        for (let r = 1; r < rows; r++) {
          if (((r * 7 + (b.x * 13 | 0)) % 5) === 0) continue;
          const z = (r / rows) * H, p1 = proj(nx === 0 ? x0 + 0.15 * b.w : (nx > 0 ? x1 : x0), ny === 0 ? y0 + 0.15 * b.d : (ny > 0 ? y1 : y0), z);
          const p2 = proj(nx === 0 ? x1 - 0.15 * b.w : (nx > 0 ? x1 : x0), ny === 0 ? y1 - 0.15 * b.d : (ny > 0 ? y1 : y0), z);
          ctx.globalAlpha = f; ctx.fillRect(Math.min(p1[0], p2[0]), (p1[1] + p2[1]) / 2 - 0.6, Math.abs(p2[0] - p1[0]), 1.2);
        }
        ctx.globalAlpha = f;
      }
    }
    // top
    poly(g1);
    ctx.fillStyle = `hsl(${HUE} ${SAT}% 99.5%)`; ctx.fill();
    if (b.lit) { ctx.fillStyle = `rgba(161,35,43,${0.38 * b.lit})`; ctx.fill(); }
    ctx.strokeStyle = 'rgba(14,34,64,0.16)'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawParcelVolume() {
    // light beam
    const c0 = proj(P.cx, P.cy), c1 = proj(P.cx, P.cy, 16);
    const bw = S * 1.6;
    const g = ctx.createLinearGradient(0, c0[1], 0, c1[1]);
    g.addColorStop(0, 'rgba(161,35,43,0.20)'); g.addColorStop(0.55, 'rgba(161,35,43,0.06)'); g.addColorStop(1, 'rgba(161,35,43,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c0[0] - bw, c0[1]); ctx.lineTo(c1[0] - bw * 0.4, c1[1]); ctx.lineTo(c1[0] + bw * 0.4, c1[1]); ctx.lineTo(c0[0] + bw, c0[1]); ctx.closePath(); ctx.fill();
    // wireframe buildable envelope
    const H = 3.4 + Math.sin(time * 1.2) * 0.25;
    const x0 = P.x0 + .25, y0 = P.y0 + .25, x1 = P.x0 + P.w - .25, y1 = P.y0 + P.d - .25;
    const bot = [proj(x0, y0), proj(x1, y0), proj(x1, y1), proj(x0, y1)], top = [proj(x0, y0, H), proj(x1, y0, H), proj(x1, y1, H), proj(x0, y1, H)];
    ctx.save(); ctx.setLineDash([4, 4]); ctx.lineDashOffset = -time * 10; ctx.strokeStyle = 'rgba(161,35,43,0.9)'; ctx.lineWidth = 1.3;
    poly(top); ctx.stroke();
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(bot[k][0], bot[k][1]); ctx.lineTo(top[k][0], top[k][1]); ctx.stroke(); }
    ctx.restore();
    poly(top); ctx.fillStyle = 'rgba(161,35,43,0.07)'; ctx.fill();
  }

  function frame(now) {
    time = (now - t0) / 1000;
    const drift = reduced ? 0 : Math.sin(time * 0.06) * 0.18;
    yawT = (opts.baseYaw ?? 0.72) + drift + (mouseX - 0.5) * 0.28 + (opts.spin ? time * 0.25 : 0);
    yaw += (yawT - yaw) * 0.06;
    tilt += ((opts.tilt ?? 0.5) + (mouseY - 0.5) * 0.06 - tilt) * 0.06;
    ca = Math.cos(yaw); sa = Math.sin(yaw);
    ctx.clearRect(0, 0, w, h);
    B.forEach(b => { const g = reduced ? 1 : Math.max(0, Math.min(1, (time - b.delay) / 1.1)); b.eg = 1 - Math.pow(1 - g, 3); });
    drawGround();
    // painter's sort by depth
    const items = B.map(b => ({ b, z: (b.x + b.w / 2) * sa + (b.y + b.d / 2) * ca }));
    items.push({ parcel: true, z: P.cx * sa + P.cy * ca + 0.01 });
    items.sort((a, b) => a.z - b.z);
    const scanPos = opts.scan ? ((time * 0.35) % 1) * N * 1.4 - N * 0.7 : null;
    for (const it of items) {
      if (it.parcel) { drawParcelVolume(); continue; }
      const b = it.b;
      const eg = b.eg;
      if (scanPos !== null) { const xr = (b.x) * ca - (b.y) * sa; const dd = Math.abs(xr - scanPos); b.lit = dd < 1.6 ? 1 - dd / 1.6 : 0; }
      drawBox(b, eg);
    }
    // x-ray pass: transit lines glow through buildings
    ctx.save();
    lines.forEach(l => { const pts = l.pts.map(p => proj(p[0], p[1])); ctx.setLineDash(l.dash || []); ctx.strokeStyle = l.color; ctx.globalAlpha = 0.16; ctx.lineWidth = l.w; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); });
    ctx.restore();
    if (scanPos !== null) {
      // scanning plane
      const a = proj(scanPos * ca, -scanPos * sa), g = ctx.createLinearGradient(a[0] - 80, 0, a[0] + 10, 0);
      g.addColorStop(0, 'rgba(161,35,43,0)'); g.addColorStop(1, 'rgba(161,35,43,0.10)');
      ctx.fillStyle = g; ctx.fillRect(a[0] - 80, 0, 90, h);
      ctx.fillStyle = 'rgba(161,35,43,0.6)'; ctx.fillRect(a[0] + 9, 0, 1.5, h);
    }
    opts.onFrame && opts.onFrame(project);
    if (running) raf = requestAnimationFrame(frame);
  }

  /* anchors the page can pin DOM callouts to */
  const anchors = {
    parcel: () => [P.cx, P.cy, 3.6],
    tower: () => { const c = B.filter(b => Math.abs(b.x + 1) < 5 && Math.abs(b.y + 6) < 5); const t = c.reduce((m, b) => b.h > m.h ? b : m, c[0] || B[0]); return [t.x + t.w / 2, t.y + t.d / 2, t.h]; },
    metro: () => [A(3), A(3.4), 0],
    upcoming: () => [A(1), A(3), 0],
    violet: () => [A(4), A(1.5), 0],
  };
  function project(name) { const a = anchors[name] && anchors[name](); if (!a) return null; const p = proj(a[0], a[1], a[2]); return { x: p[0], y: p[1], vis: fog(a[0], a[1]) }; }

  const onMove = e => { const r = canvas.getBoundingClientRect(); mouseX = (e.clientX - r.left) / r.width; mouseY = (e.clientY - r.top) / r.height; };
  (opts.pointerTarget || canvas).addEventListener('pointermove', onMove);
  addEventListener('resize', size);
  size();
  raf = requestAnimationFrame(frame);

  return {
    start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    restart() { t0 = performance.now(); this.start(); },
    resize: size,
    project,
  };
};
