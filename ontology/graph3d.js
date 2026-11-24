/* Kaizen Service Ontology · graph3d.js — 3D knowledge graph powered by D3 (v7).
   d3-force lays out each layer as a ring (goal → users → needs → requirements → delivery → domain objects),
   d3-drag orbits, d3-zoom zooms, d3-timer animates, d3-interpolate + d3-ease fly the camera.
   Drawn on canvas with lit 3D node meshes and additive glow. */
(function (G) {
"use strict";
const RM = G.matchMedia && G.matchMedia("(prefers-reduced-motion: reduce)").matches;

G.KZO.graph3d = (cv, o) => {
  const d3 = G.d3, { nodes, links, layers } = o; // nodes {id, layer, col, shape, big, hollow, label, cls}; links {s, t, kind}
  const ctx = cv.getContext("2d");
  const byId = new Map(nodes.map(n => [n.id, n]));
  const L = links.map(l => ({ ...l, a: byId.get(l.s), b: byId.get(l.t) })).filter(l => l.a && l.b);
  nodes.forEach((n, i) => { n.deg = 0; n.phase = i * 1.7; }); L.forEach(l => { l.a.deg++; l.b.deg++; });

  /* ---------- D3 layout: each layer is a ring on the x/z plane, layers stacked on y ---------- */
  const RING = [0, 210, 320, 410, 480, 340], GAP = 140, mid = (layers.length - 1) / 2;
  const ring1 = nodes.filter(n => n.layer === 1); ring1.forEach((n, i) => { const a = i / ring1.length * Math.PI * 2; n.fx = Math.cos(a) * 210; n.fy = Math.sin(a) * 210; });
  nodes.filter(n => n.layer === 0).forEach(n => { n.fx = 0; n.fy = 0; });
  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(L.map(l => ({ source: l.s, target: l.t, kind: l.kind }))).id(d => d.id).distance(l => l.kind === "weak" ? 160 : 90).strength(l => l.kind === "weak" ? .02 : .12))
    .force("charge", d3.forceManyBody().strength(-38).distanceMax(320))
    .force("collide", d3.forceCollide(n => n.big ? 26 : 15))
    .force("ring", d3.forceRadial(n => RING[n.layer] || 300, 0, 0).strength(n => n.layer === 0 ? 1 : .55))
    .stop();
  for (let i = 0; i < 360; i++) sim.tick();
  nodes.forEach(n => { n.X = n.x; n.Z = n.y; n.Y = (n.layer - mid) * GAP; });

  /* ---------- scene extras ---------- */
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = d3.range(260).map(() => { const u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, r = 2400 + rnd() * 900, s = Math.sqrt(1 - u * u); return { X: Math.cos(t) * s * r, Y: u * r, Z: Math.sin(t) * s * r, a: .15 + rnd() * .5 }; });
  const rings = layers.map((name, i) => ({ name, Y: (i - mid) * GAP, R: (RING[i] || 300) + 34 }));

  /* ---------- camera + palette ---------- */
  const cam = { yaw: -.7, pitch: .42, dist: 1420, spin: !RM };
  const relOff = new Set();
  let W = 0, H = 0, DPR = 1, hl = null, focus = null, sel = null, hover = null, hidden = null, pal = {}, t0 = 0;
  function resize() { DPR = Math.min(2, G.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
  function readPalette() { const cs = getComputedStyle(cv), v = k => cs.getPropertyValue(k).trim(); pal = { dark: v("--kg-mode") === "dark", ink: v("--kg-ink") || "#F3F1EC", ink2: v("--kg-ink2") || "#aaa", halo: v("--kg-halo") || "rgba(0,0,0,.8)", ring: v("--kg-ring") || "rgba(255,255,255,.1)", star: v("--kg-star") || "#ccc", solid: v("--kg-solid") || "#0B0D10", chip: v("--kg-chip") || "rgba(17,22,30,.8)", rel: Object.fromEntries(["needs", "metBy", "fixes", "builtOn", "shownIn", "checkedBy", "seenIn", "openQ", "about", "domain", "context"].map(k => [k, d3.rgb(v("--rel-" + k) || "#888")])), chipLine: v("--kg-chip-line") || "rgba(255,255,255,.16)", font: v("--font") || "sans-serif", mono: v("--mono") || "monospace" }; nodes.forEach(n => { n.c = cs.getPropertyValue(n.col).trim() || "#9DAAF2"; n.rgb = d3.rgb(n.c); }); }
  readPalette();

  function P(X, Y, Z) { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), f = Math.min(W, H) * 1.1;
    const x1 = X * cy - Z * sy, z1 = X * sy + Z * cy, y1 = Y * cp - z1 * sp, z2 = Y * sp + z1 * cp, s = f / Math.max(60, cam.dist + z2); return [W / 2 + x1 * s, H / 2 + y1 * s, s, z2]; }
  const R = n => (n.big ? 12 : 4.6 + Math.min(6.5, Math.sqrt(n.deg) * 1.15)) * Math.max(.45, Math.min(1.8, n.ss * 1.7));
  const vis = n => !hidden || !hidden(n);
  function path(n, r) {
    ctx.beginPath();
    if (n.shape === "sq") ctx.rect(n.sx - r * .85, n.sy - r * .85, r * 1.7, r * 1.7);
    else if (n.shape === "tri") { ctx.moveTo(n.sx, n.sy - r * 1.15); ctx.lineTo(n.sx + r, n.sy + r * .75); ctx.lineTo(n.sx - r, n.sy + r * .75); ctx.closePath(); }
    else if (n.shape === "hex") { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? "lineTo" : "moveTo"](n.sx + Math.cos(a) * r * 1.15, n.sy + Math.sin(a) * r * 1.15); } ctx.closePath(); }
    else if (n.shape === "dia") { ctx.moveTo(n.sx, n.sy - r * 1.25); ctx.lineTo(n.sx + r * 1.25, n.sy); ctx.lineTo(n.sx, n.sy + r * 1.25); ctx.lineTo(n.sx - r * 1.25, n.sy); ctx.closePath(); }
    else ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2);
  }
  const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;

  /* ---------- real 3D node meshes: rotated with the camera, depth-sorted, lit per face ---------- */
  const MESH = (() => {
    const cube = { v: [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(p => p.map(x => x * .78)), f: [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[4,5,1,0],[3,2,6,7]] };
    const octa = { v: [[0,-1.25,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1],[0,1.25,0]], f: [[0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]] };
    const pyr = { v: [[0,-1.2,0],[-1,.8,-1],[1,.8,-1],[1,.8,1],[-1,.8,1]], f: [[0,2,1],[0,3,2],[0,4,3],[0,1,4],[1,2,3,4]] };
    const hv = []; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; hv.push([Math.cos(a), -.55, Math.sin(a)]); } for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; hv.push([Math.cos(a), .55, Math.sin(a)]); }
    const hf = [[5,4,3,2,1,0],[6,7,8,9,10,11]]; for (let k = 0; k < 6; k++) { const j = (k + 1) % 6; hf.push([k, j, j + 6, k + 6]); }
    return { sq: cube, dia: octa, tri: pyr, hex: { v: hv, f: hf } };
  })();
  const LIGHT = (() => { const l = [-.45, -.7, -.55], m = Math.hypot(...l); return l.map(x => x / m); })();
  function rot(p, yaw, pitch) { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch); const x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy; return [x1, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp]; }
  function drawSolid(n, r, el, X = ctx, yaw = cam.yaw, pitch = cam.pitch) {
    const c = n.rgb, hollow = n.hollow;
    if (!MESH[n.shape]) { // sphere: lit with a radial gradient, specular highlight and rim
      const g = X.createRadialGradient(n.sx - r * .38, n.sy - r * .42, r * .08, n.sx, n.sy, r);
      if (hollow) { X.fillStyle = rgba(c, pal.dark ? .12 : .1); X.beginPath(); X.arc(n.sx, n.sy, r, 0, Math.PI * 2); X.fill(); X.strokeStyle = n.c; X.lineWidth = 1.5; X.stroke(); return; }
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.18, d3.rgb(c).brighter(.9).formatRgb()); g.addColorStop(.6, n.c); g.addColorStop(1, d3.rgb(c).darker(1.3).formatRgb());
      X.fillStyle = g; X.beginPath(); X.arc(n.sx, n.sy, r, 0, Math.PI * 2); X.fill();
      X.strokeStyle = rgba(d3.rgb(c).darker(1.6), .55); X.lineWidth = .8; X.stroke(); return;
    }
    const M = MESH[n.shape], spin = n.phase, k = r * (n.shape === "hex" ? 1.05 : 1);
    const V = M.v.map(p => { const q = rot(rot(p, spin, 0), yaw, pitch); return [n.sx + q[0] * k, n.sy + q[1] * k, q[2]]; });
    const F = M.f.map(f => { const a = V[f[0]], b = V[f[1]], d = V[f[2]]; const ux = b[0] - a[0], uy = b[1] - a[1], uz = (b[2] - a[2]) * k, vx = d[0] - a[0], vy = d[1] - a[1], vz = (d[2] - a[2]) * k;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const m = Math.hypot(nx, ny, nz) || 1; nx /= m; ny /= m; nz /= m;
      return { f, nz, dif: Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]), z: f.reduce((t, i) => t + V[i][2], 0) / f.length }; });
    F.sort((a, b) => b.z - a.z).forEach(fc => {
      if (!hollow && fc.nz > 0) return; // back-face cull
      X.beginPath(); fc.f.forEach((i, j) => X[j ? "lineTo" : "moveTo"](V[i][0], V[i][1])); X.closePath();
      if (hollow) { X.fillStyle = rgba(c, fc.nz < 0 ? .16 : .05); X.fill(); X.strokeStyle = rgba(c, fc.nz < 0 ? .95 : .35); X.lineWidth = 1; X.stroke(); return; }
      const sh = .38 + .8 * fc.dif, spec = Math.pow(fc.dif, 12) * .55;
      X.fillStyle = `rgb(${Math.min(255, c.r * sh + 255 * spec) | 0},${Math.min(255, c.g * sh + 255 * spec) | 0},${Math.min(255, c.b * sh + 255 * spec) | 0})`; X.fill();
      X.strokeStyle = rgba(d3.rgb(c).darker(1.2), .45); X.lineWidth = .6; X.stroke();
    });
  }

  function rr(X, x, y, w, h, r) { X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath(); }
  function drawLabels(order, lit) {
    const want = order.filter(n => { const dim = lit ? !lit.has(n.id) : focus ? n.cls !== focus : false; return !dim && (n.big || n.id === hover || n.id === sel || (lit && lit.size <= 46) || (focus && n.cls === focus)); });
    const pri = n => n.id === sel ? 0 : n.id === hover ? 1 : n.cls === "Goal" ? 2 : n.big ? 3 : 4;
    want.sort((a, b) => pri(a) - pri(b) || a.sz - b.sz);
    const placed = [], hit = (b) => placed.some(q => b.x < q.x + q.w + 4 && b.x + b.w + 4 > q.x && b.y < q.y + q.h + 3 && b.y + b.h + 3 > q.y);
    ctx.textBaseline = "middle";
    want.forEach(n => {
      const code = n.code || (/^(R|P|Q)\d\d /.test(n.label) ? n.label.slice(0, 3) : ""), name0 = code ? n.label.slice(code.length + 1) : n.label;
      const name = name0.length > 40 ? name0.slice(0, 39).trimEnd() + "…" : name0, strong = n.id === sel || n.big;
      const fs = n.cls === "Goal" ? 13 : strong ? 12.5 : 11.5, f1 = `${strong ? 500 : 400} ${fs}px ${pal.font}`, f2 = `500 10px ${pal.mono}`;
      ctx.font = f2; const cw = code ? ctx.measureText(code).width + 7 : 0; ctx.font = f1; const tw = ctx.measureText(name).width;
      const w = 14 + cw + tw + 10, h = fs + 11, r = R(n), side = n.sx < W / 2 ? -1 : 1, off = r + 12;
      const cands = [[side * off, -h / 2], [side * off, -h - 4], [side * off, 4], [-side * off, -h / 2], [-w / 2 * 0, -r - h - 10]];
      let box = null;
      for (const [dx, dy] of cands) { const x = dx > 0 ? n.sx + dx : dx < 0 ? n.sx + dx - w : n.sx - w / 2, b = { x, y: n.sy + dy, w, h }; if (b.x < 4 || b.x + w > W - 4 || b.y < 4 || b.y + h > H - 4) continue; if (!hit(b) || pri(n) <= 1) { box = b; break; } }
      if (!box) return; placed.push(box);
      const depthA = Math.max(.55, Math.min(1, 1.25 - (n.sz + cam.dist * .2) / (cam.dist * 1.2)));
      ctx.globalAlpha = n.id === sel || n.id === hover ? 1 : depthA;
      // leader line
      const ax = box.x > n.sx ? box.x : box.x + w < n.sx ? box.x + w : n.sx, ay = box.y + h / 2 > n.sy + r ? box.y : box.y + h < n.sy - r ? box.y + h : box.y + h / 2;
      ctx.strokeStyle = n.c; ctx.lineWidth = 1; ctx.globalAlpha *= .8; ctx.beginPath(); ctx.moveTo(n.sx + Math.sign(ax - n.sx) * r * .9, n.sy); ctx.lineTo(ax, ay); ctx.stroke(); ctx.globalAlpha /= .8;
      // pill
      rr(ctx, box.x, box.y, w, h, h / 2); ctx.fillStyle = pal.chip; ctx.fill(); ctx.strokeStyle = n.id === sel ? n.c : pal.chipLine; ctx.lineWidth = n.id === sel ? 1.4 : 1; ctx.stroke();
      ctx.fillStyle = n.c; ctx.beginPath(); ctx.arc(box.x + 9, box.y + h / 2, 3, 0, Math.PI * 2); ctx.fill();
      let tx = box.x + 17;
      if (code) { ctx.font = f2; ctx.fillStyle = pal.ink2; ctx.fillText(code, tx, box.y + h / 2 + .5); tx += cw; }
      ctx.font = f1; ctx.fillStyle = strong || n.id === hover ? pal.ink : pal.ink2; ctx.fillText(name, tx, box.y + h / 2 + .5);
    });
  }

  function draw(elapsed) {
    nodes.forEach(n => { const p = P(n.X, n.Y, n.Z); n.sx = p[0]; n.sy = p[1]; n.ss = p[2]; n.sz = p[3]; });
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    // stars
    stars.forEach(s => { const p = P(s.X, s.Y, s.Z); if (p[2] <= 0) return; ctx.globalAlpha = s.a * (pal.dark ? .55 : .35); ctx.fillStyle = pal.star; ctx.fillRect(p[0], p[1], 1.2, 1.2); });
    // layer rings + labels
    ctx.lineWidth = 1;
    rings.forEach((rg, i) => {
      ctx.globalAlpha = hl ? .5 : 1; ctx.strokeStyle = pal.ring; ctx.beginPath();
      for (let k = 0; k <= 96; k++) { const a = k / 96 * Math.PI * 2, p = P(Math.cos(a) * rg.R, rg.Y, Math.sin(a) * rg.R); ctx[k ? "lineTo" : "moveTo"](p[0], p[1]); }
      ctx.stroke();
      const lp = P(-rg.R, rg.Y, 0); ctx.globalAlpha = hl ? .3 : .6; ctx.fillStyle = pal.ink; ctx.font = `10px ${pal.mono}`; ctx.textAlign = "right";
      ctx.fillText(rg.name.toUpperCase().split("").join(" "), lp[0] - 12, lp[1] + 3); ctx.textAlign = "left";
    });
    const lit = hl && hl.ns;
    // links, additive
    ctx.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
    L.forEach(l => {
      if (!vis(l.a) || !vis(l.b)) return;
      const on = lit && lit.has(l.a.id) && lit.has(l.b.id);
      if (relOff.has(l.r)) return;
      const ctxRel = l.r === "context";
      let a = on ? (pal.dark ? .9 : .95) : lit ? (pal.dark ? .02 : .05) : focus ? ((l.a.cls === focus || l.b.cls === focus) ? .35 : .02) : ctxRel ? (pal.dark ? .06 : .1) : (pal.dark ? .26 : .38);
      ctx.globalAlpha = 1; ctx.strokeStyle = rgba(pal.rel[l.r] || pal.rel.context, a); ctx.lineWidth = on ? 2 : ctxRel ? .7 : 1.05;
      ctx.setLineDash(l.r === "openQ" ? [5, 4] : l.r === "about" ? [2, 3] : []);
      ctx.beginPath(); ctx.moveTo(l.a.sx, l.a.sy); ctx.lineTo(l.b.sx, l.b.sy); ctx.stroke(); ctx.setLineDash([]);
    });
    // node glow halos (additive)
    const order = nodes.filter(vis).sort((a, b) => b.sz - a.sz), zs = order.map(n => n.sz), zmin = d3.min(zs), zmax = d3.max(zs);
    order.forEach(n => {
      const dim = lit ? !lit.has(n.id) : focus ? n.cls !== focus : false; if (dim) return;
      const r = R(n), hot = (lit && lit.has(n.id)) || n.id === sel || n.id === hover || n.big, gr = r * (hot ? 5 : 3.2), pulse = n.id === sel && !RM ? 1 + .18 * Math.sin(elapsed / 300) : 1;
      const g = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, gr * pulse); g.addColorStop(0, rgba(n.rgb, pal.dark ? (hot ? .55 : .22) : (hot ? .28 : .1))); g.addColorStop(1, rgba(n.rgb, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.sx, n.sy, gr * pulse, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
    // node cores
    order.forEach(n => {
      const dim = lit ? !lit.has(n.id) : focus ? n.cls !== focus : false, depth = .5 + .5 * (1 - (n.sz - zmin) / ((zmax - zmin) || 1)), r = R(n);
      ctx.globalAlpha = dim ? .14 : Math.min(1, depth + .25); drawSolid(n, r * (MESH[n.shape] ? 1.15 : 1), elapsed);
      if (n.id === sel || n.id === hover) { ctx.globalAlpha = 1; ctx.strokeStyle = pal.ink; ctx.lineWidth = 1.4; path(n, r + 5); ctx.stroke(); }
    });
    // labels: pills with a class tick, mono code, leader line; placed greedily without overlaps
    drawLabels(order, lit);
    ctx.globalAlpha = 1;
  }

  /* ---------- D3 interaction: drag orbits, wheel zooms, click picks ---------- */
  const pick = (x, y) => { let best = null, bd = 1e9; nodes.forEach(n => { if (!vis(n)) return; const d = Math.hypot(n.sx - x, n.sy - y); if (d < R(n) + 7 && d < bd) { bd = d; best = n; } }); return best; };
  let moved = 0, fly = null;
  function setSpin(v) { if (cam.spin === v) return; cam.spin = v; o.onSpin && o.onSpin(v); }
  const sel3 = d3.select(cv);
  sel3.call(d3.drag().on("start", () => { moved = 0; setSpin(false); fly && fly.stop(); }).on("drag", e => { moved += Math.abs(e.dx) + Math.abs(e.dy); cam.yaw += e.dx * .006; cam.pitch = Math.max(-1.25, Math.min(1.4, cam.pitch + e.dy * .005)); })
    .on("end", e => { if (moved < 5) { const [x, y] = d3.pointer(e.sourceEvent, cv); o.onPick && o.onPick(pick(x, y)); } }));
  const zoom = d3.zoom().scaleExtent([.45, 3.2]).filter(e => e.type === "wheel").on("zoom", e => { if (e.sourceEvent) setSpin(false); cam.dist = 1420 / e.transform.k; });
  sel3.call(zoom).on("dblclick.zoom", null);
  sel3.on("pointermove.pick", e => { if (e.buttons) return; const [x, y] = d3.pointer(e, cv), n = pick(x, y), id = n ? n.id : null; if (id !== hover) { hover = id; cv.style.cursor = n ? "pointer" : "grab"; o.onHover && o.onHover(n, e); } else if (n && o.onMove) o.onMove(e); })
    .on("pointerleave.pick", () => { if (hover) { hover = null; o.onHover && o.onHover(null); } });

  function flyTo(target, ms = 900) {
    fly && fly.stop(); setSpin(false);
    const from = { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist }, ip = d3.interpolate(from, target);
    if (RM) { Object.assign(cam, target); return; }
    fly = d3.timer(el => { const k = Math.min(1, el / ms); Object.assign(cam, ip(d3.easeCubicInOut(k))); if (k >= 1) { fly.stop(); fly = null; } });
  }
  const timer = d3.timer(el => { if (!cv.offsetParent) return; if (cam.spin) cam.yaw += .0018; draw(el); });
  resize(); new ResizeObserver(resize).observe(cv);
  const theme = () => { readPalette(); o.onTheme && o.onTheme(); };
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  G.matchMedia && G.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", theme);

  return {
    highlight(set) { hl = set ? { ns: set } : null; },
    setFocus(cls) { focus = cls; },
    setHidden(fn) { hidden = fn; },
    setRelOff(set) { relOff.clear(); set.forEach(x => relOff.add(x)); },
    select(id) { sel = id; },
    reset() { flyTo({ yaw: -.7, pitch: .42, dist: 1420 }); sel3.call(zoom.transform, d3.zoomIdentity); },
    toggleSpin() { setSpin(!cam.spin); return cam.spin; },
    spinning: () => cam.spin,
    frame(id) { const n = byId.get(id); if (!n) return; let yaw = Math.atan2(n.X, n.Z) + Math.PI; while (yaw - cam.yaw > Math.PI) yaw -= Math.PI * 2; while (cam.yaw - yaw > Math.PI) yaw += Math.PI * 2; flyTo({ yaw, pitch: .3 + n.layer * .02, dist: 1150 }); sel3.call(zoom.transform, d3.zoomIdentity.scale(1420 / 1150)); },
    stop() { timer.stop(); },
    /* Paint legend icons with the exact renderer and palette the graph uses */
    paintIcons(box) {
      box.querySelectorAll("canvas[data-ic]").forEach(c => {
        const d = Math.min(2, G.devicePixelRatio || 1), S = 22; c.width = S * d; c.height = S * d; c.style.width = c.style.height = S + "px";
        const X = c.getContext("2d"); X.setTransform(d, 0, 0, d, 0, 0); X.clearRect(0, 0, S, S);
        const col = getComputedStyle(cv).getPropertyValue(c.dataset.col).trim() || "#999";
        const n = { sx: S / 2, sy: S / 2, shape: c.dataset.ic, hollow: c.dataset.hollow === "1", c: col, rgb: d3.rgb(col), phase: 0 };
        drawSolid(n, MESH[n.shape] ? 6.6 : 7.2, 0, X, -.7, .42);
      });
    }
  };
};
})(window);
