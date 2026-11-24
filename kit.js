/* Civic Services Kit — behaviour. Global CSK. No libraries. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- icons (stroke, 24 grid) ---------- */
  const ICONS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    cart: '<path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    pavilion: '<path d="M3 10 12 5l9 5M5 10v9M19 10v9M9 19v-5h6v5"/>',
    person: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    cake: '<path d="M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M5 16c2 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3 1.5 4 0M12 12V8.5M12 6.5c-.8-.7-.8-1.8 0-3 .8 1.2.8 2.3 0 3Z"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    warn: '<path d="M12 4 2.8 19.5h18.4L12 4Z"/><path d="M12 10v4.5M12 17v.01"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    map: '<path d="m9 4.5-5 2v13l5-2 6 2 5-2v-13l-5 2-6-2ZM9 4.5v13M15 6.5v13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    category: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    locate: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="7"/>',
    ticket: '<path d="M4 7.5a1.5 1.5 0 0 0 1.5-1.5h13A1.5 1.5 0 0 0 20 7.5v3a1.5 1.5 0 0 0 0 3v3a1.5 1.5 0 0 0-1.5 1.5h-13A1.5 1.5 0 0 0 4 16.5v-3a1.5 1.5 0 0 0 0-3v-3Z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    car: '<path d="M5 16.5V12l2-5h10l2 5v4.5M5 16.5h14M5 16.5V19M19 16.5V19M7.5 13.5h.01M16.5 13.5h.01"/>',
    home: '<path d="M4 11 12 4l8 7M6 9.5V20h12V9.5"/>',
    users: '<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M16 6.5a3 3 0 0 1 0 5.5M17.5 14.7c1.6.6 2.7 2 3 4.3"/>',
    card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18M7 15h4"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Z"/><path d="m9 12 2 2 4-4"/>',
    trail: '<path d="M5 20c3-2 2-5 5-6.5s6-1 7-4.5M17 4.5v.01M7 6.5v.01M12 3.5v.01"/>'
  };
  const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  function hydrateIcons(root = document) { $$('[data-i]', root).forEach(el => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.i, el.dataset.isz || '')); el.removeAttribute('data-i'); }); }

  /* ---------- theme ---------- */
  function initTheme() {
    const btns = $$('[data-set-theme]');
    const apply = (t) => {
      if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
      const eff = t === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTheme === eff)));
      try { localStorage.setItem('csk-theme', t); } catch (e) {}
      CSK.maps.forEach(m => m.draw());
    };
    let saved = 'system'; try { saved = localStorage.getItem('csk-theme') || 'system'; } catch (e) {}
    btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.setTheme)));
    apply(saved);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { let t = 'system'; try { t = localStorage.getItem('csk-theme') || 'system'; } catch (e) {} if (t === 'system') apply('system'); else CSK.maps.forEach(m => m.draw()); });
  }

  /* ---------- rail scrollspy ---------- */
  function initRail() {
    const links = $$('.rail a[href^="#"]');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-30% 0px -65% 0px' });
    $$('section.sheet[id]').forEach(s => io.observe(s));
  }

  /* ---------- small interactions ---------- */
  function toast(msg) {
    const t = $('#live-toast'); if (!t) return;
    $('span', t).textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function initBits() {
    $$('.acc > button').forEach(b => b.addEventListener('click', () => { const a = b.parentElement; const open = a.dataset.open !== 'false'; a.dataset.open = String(!open); b.setAttribute('aria-expanded', String(!open)); }));
    $$('.fbtn[data-toggle]').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));
    $$('.stepper').forEach(s => { const o = $('output', s); const [m, p] = $$('button', s); const min = +(s.dataset.min || 0), max = +(s.dataset.max || 9); const set = v => { o.textContent = Math.max(min, Math.min(max, v)); }; m.onclick = () => set(+o.textContent - 1); p.onclick = () => set(+o.textContent + 1); });
    $$('.tabs').forEach(t => $$('button', t).forEach(b => b.addEventListener('click', () => $$('button', t).forEach(x => x.setAttribute('aria-selected', String(x === b))))));
    $$('.pager').forEach(p => $$('button[data-p]', p).forEach(b => b.addEventListener('click', () => $$('button[data-p]', p).forEach(x => x === b ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current')))));
    $$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)));
    const tb = $('#live-toast button'); if (tb) tb.onclick = () => $('#live-toast').classList.remove('show');
  }

  /* ---------- calendar ---------- */
  function calendar(el) {
    const today = new Date(2026, 10, 20);
    let view = new Date(today.getFullYear(), today.getMonth(), 1), sel = null;
    const few = new Set([22, 27, 28]);
    function draw() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      let g = 'SMTWTFS'.split('').map(d => `<span>${d}</span>`).join('') + '<i></i>'.repeat(first);
      for (let d = 1; d <= days; d++) {
        const dt = new Date(y, m, d), past = dt < today, far = (dt - today) / 864e5 > 30, closed = dt.getDay() === 1;
        const dis = past || far || closed;
        const cls = [dt.getTime() === today.getTime() ? 'today' : '', !dis && m === 10 && few.has(d) ? 'few' : ''].join(' ');
        g += `<button type="button" class="${cls}" ${dis ? 'disabled' : ''} aria-pressed="${sel && sel.getTime() === dt.getTime()}" data-d="${d}" aria-label="${dt.toDateString()}${dis ? ', unavailable' : ''}">${d}</button>`;
      }
      el.innerHTML = `<div class="cal-h"><span>${view.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span><span><button class="ibtn" style="width:32px;height:32px" data-nav="-1" aria-label="Previous month">${icon('left')}</button><button class="ibtn" style="width:32px;height:32px" data-nav="1" aria-label="Next month">${icon('right')}</button></span></div><div class="cal-g">${g}</div>`;
      $$('[data-nav]', el).forEach(b => b.onclick = () => { view = new Date(y, m + +b.dataset.nav, 1); draw(); });
      $$('[data-d]', el).forEach(b => b.onclick = () => { sel = new Date(y, m, +b.dataset.d); draw(); const f = document.getElementById(el.dataset.for); if (f) f.value = sel.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }); });
    }
    draw();
  }

  /* ---------- reservation timeline ---------- */
  function timeline(el, opts = {}) {
    const venues = opts.venues || [
      { n: 'Ramada #1', park: 'Cienega Wash Park', price: '$25.00/day', rule: 'Min 2 hours · Max 11 hours', booked: [[9, 13]] },
      { n: 'Ramada #2', park: 'Cienega Wash Park', price: '$40.00/day', rule: 'Min 4 hours · Max 11 hours', booked: [[11, 15], [17, 19]] },
      { n: 'Group Pavilion', park: 'Mesquite Flats Regional Park', price: '$85.00/day', rule: 'Min 4 hours · 120 people', booked: [], closed: [[8, 10]] },
      { n: 'Ballfield B', park: 'Mesquite Flats Regional Park', price: '$18.00/hour', rule: 'Lights after 6:00 PM', booked: [[8, 12], [16, 19]] }
    ];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const fmt = h => `${((h + 11) % 12) + 1}:00${h < 12 ? 'AM' : 'PM'}`;
    let day = opts.day || new Date(2026, 10, 21); const sel = new Set(opts.sel || []);
    function draw() {
      let g = `<div class="h first">Venue</div>` + hours.map(h => `<div class="h">${fmt(h)}</div>`).join('');
      venues.forEach((v, vi) => {
        g += `<div class="v"><div class="thumbs"><i></i><i></i><i></i></div><a href="#maps">${v.n}</a><span class="faint">${v.park}</span><span>${v.price}</span><span class="faint">${v.rule}</span></div>`;
        hours.forEach(h => {
          const inR = rs => (rs || []).some(([a, b]) => h >= a && h < b);
          const st = inR(v.closed) ? 'closed' : inR(v.booked) ? 'booked' : 'free';
          const k = vi + ':' + h;
          g += `<button type="button" class="slot ${st} ${sel.has(k) ? 'sel' : ''}" data-k="${k}" ${st !== 'free' ? 'disabled' : ''} aria-label="${v.n} ${fmt(h)} ${st}"></button>`;
        });
      });
      el.innerHTML = `<div class="tl-bar"><span class="tl-date"><button aria-label="Previous day" data-step="-1">${icon('left', 'sm')}</button><b>${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</b><button aria-label="Next day" data-step="1">${icon('right', 'sm')}</button></span><span style="display:flex;gap:8px;align-items:center"><span class="faint t-small num">${sel.size ? sel.size + ' hour' + (sel.size > 1 ? 's' : '') + ' selected' : 'Select open hours'}</span><button class="btn btn-primary sm" ${sel.size ? '' : 'disabled'} data-toast="Added to cart">Add to cart</button></span></div><div class="scroll-x"><div class="tl-grid" style="--cols:${hours.length}">${g}</div></div><div class="tl-legend"><span><i style="background:var(--surface)"></i>Open</span><span><i style="background:var(--accent)"></i>Selected</span><span><i style="background:repeating-linear-gradient(135deg,var(--surface-2) 0 3px,transparent 3px 6px)"></i>Reserved</span><span><i style="background:var(--surface-2)"></i>Closed</span></div>`;
      $$('[data-step]', el).forEach(b => b.onclick = () => { day = new Date(day.getTime() + b.dataset.step * 864e5); sel.clear(); draw(); });
      $$('.slot.free', el).forEach(b => b.onclick = () => { sel.has(b.dataset.k) ? sel.delete(b.dataset.k) : sel.add(b.dataset.k); draw(); });
      $$('[data-toast]', el).forEach(b => b.onclick = () => { toast(`Added ${sel.size} hour${sel.size > 1 ? 's' : ''} to cart`); sel.clear(); draw(); });
    }
    draw();
  }

  /* ---------- sample QR (decorative pattern, not a scannable code) ---------- */
  function qr(c) {
    const n = 25, s = 4, x = c.getContext('2d'); c.width = c.height = n * s;
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#0B0D10';
    let seed = 7; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const finder = (a, b) => { x.fillRect(a * s, b * s, 7 * s, 7 * s); x.fillStyle = '#fff'; x.fillRect((a + 1) * s, (b + 1) * s, 5 * s, 5 * s); x.fillStyle = '#0B0D10'; x.fillRect((a + 2) * s, (b + 2) * s, 3 * s, 3 * s); };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const inF = (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9); if (!inF && r() > .52) x.fillRect(i * s, j * s, s, s); }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  }

  /* ---------- maps ---------- */
  // World is 1000 x 700 units. Sample geography for a fictional county.
  const GEO = {
    water: [[[0, 520], [120, 500], [230, 540], [300, 610], [280, 700], [0, 700]], [[690, 120], [760, 95], [835, 120], [850, 185], [790, 215], [715, 195]]],
    parks: [[[140, 160], [300, 130], [345, 230], [250, 300], [150, 270]], [[520, 380], [640, 360], [690, 450], [600, 520], [500, 480]], [[760, 430], [900, 410], [940, 520], [830, 560], [770, 520]], [[380, 70], [470, 60], [490, 130], [400, 150]]],
    roads: [[[0, 340], [250, 350], [480, 320], [720, 330], [1000, 300]], [[430, 0], [440, 200], [470, 330], [455, 520], [470, 700]], [[600, 0], [640, 160], [720, 330], [820, 480], [1000, 610]], [[0, 120], [180, 100], [430, 110]]],
    minor: [[[250, 350], [260, 470], [330, 560]], [[720, 330], [760, 240], [870, 220]], [[470, 330], [560, 260], [640, 160]], [[100, 340], [110, 230]], [[600, 520], [640, 620], [760, 690]], [[880, 300], [900, 410]]],
    labels: [{ t: 'Cienega Wash', x: 225, y: 215 }, { t: 'Mesquite Flats', x: 595, y: 445 }, { t: 'Saguaro Ridge', x: 855, y: 490 }, { t: 'Rillito Lake', x: 780, y: 160, water: 1 }, { t: 'Route 10', x: 880, y: 292, road: 1 }]
  };
  const PLACES = [
    { id: 'p1', n: 'Cienega Wash Park', a: '4200 N Cienega Rd', x: 210, y: 200, type: 'Park', status: 'ok', s: 'Open', amen: ['Ramadas', 'Trails'], scene: 'desert' },
    { id: 'p2', n: 'Cienega Community Center', a: '4350 N Cienega Rd', x: 280, y: 250, type: 'Community center', status: 'ok', s: 'Open', amen: ['Classes', 'Gym'], scene: 'field' },
    { id: 'p3', n: 'Mesquite Flats Regional Park', a: '1801 E Flats Dr', x: 580, y: 430, type: 'Regional park', status: 'warn', s: 'Few spots', amen: ['Ballfields', 'Pavilion'], scene: 'field' },
    { id: 'p4', n: 'Mesquite Aquatic Center', a: '1900 E Flats Dr', x: 630, y: 470, type: 'Pool', status: 'bad', s: 'Closed for season', amen: ['Pool'], scene: 'lake' },
    { id: 'p5', n: 'Saguaro Ridge Trailhead', a: '9500 E Ridge Rd', x: 850, y: 470, type: 'Trailhead', status: 'ok', s: 'Open', amen: ['Parking', 'Trails'], scene: 'desert' },
    { id: 'p6', n: 'Rillito Lake Day-Use Area', a: '700 Lakeview Ave', x: 720, y: 220, type: 'Day-use', status: 'warn', s: 'Reservation required', amen: ['Beach', 'Parking'], scene: 'lake' },
    { id: 'p7', n: 'North Mesa Archery Range', a: '12 Mesa Spur', x: 430, y: 100, type: 'Range', status: 'ok', s: 'Open', amen: ['Archery'], scene: 'forest' },
    { id: 'p8', n: 'Bayfront Picnic Grounds', a: '55 Shore Ln', x: 150, y: 470, type: 'Park', status: 'ok', s: 'Open', amen: ['Ramadas', 'Beach'], scene: 'lake' }
  ];
  const css = (k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  const poly = (pts) => 'M' + pts.map(p => p.join(',')).join('L') + 'Z';
  const line = (pts) => 'M' + pts.map(p => p.join(',')).join('L');

  function baseSVG(vb) {
    const lab = GEO.labels.map(l => `<text x="${l.x}" y="${l.y}" font-size="${l.road ? 11 : 13}" fill="var(--map-label)" text-anchor="middle" font-family="var(--font)" ${l.water ? 'font-style="italic"' : ''} letter-spacing="${l.road ? 1 : .2}">${l.t}</text>`).join('');
    return `<svg class="base" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect x="-2000" y="-2000" width="5000" height="5000" fill="var(--map-land)"/>${GEO.parks.map(p => `<path d="${poly(p)}" fill="var(--map-park)"/>`).join('')}${GEO.water.map(p => `<path d="${poly(p)}" fill="var(--map-water)"/>`).join('')}${GEO.minor.map(p => `<path d="${line(p)}" fill="none" stroke="var(--map-road-2)" stroke-width="5" stroke-linecap="round"/>`).join('')}${GEO.roads.map(p => `<path d="${line(p)}" fill="none" stroke="var(--map-road-2)" stroke-width="12" stroke-linecap="round"/><path d="${line(p)}" fill="none" stroke="var(--map-road)" stroke-width="8" stroke-linecap="round"/>`).join('')}${lab}</svg>`;
  }
  const pinSVG = `<svg viewBox="0 0 30 38"><path class="body" d="M15 37s-13-11-13-21a13 13 0 0 1 26 0c0 10-13 21-13 21Z"/><circle class="dot" cx="15" cy="15" r="5"/></svg>`;

  function facilityMap(root, opts = {}) {
    const mapEl = $('.map', root), list = $('.maplist .items', root), count = $('.maplist .count', root);
    const st = { cx: 500, cy: 350, z: opts.z || 1, sel: opts.sel || null };
    if (st.sel) { const p0 = PLACES.find(q => q.id === st.sel); if (p0) { st.cx = p0.x; st.cy = p0.y - 40; } }
    const ref = { w: 1000, h: 700 };
    function geom() { const r = { width: mapEl.clientWidth, height: mapEl.clientHeight }; const k = Math.max(r.width / ref.w, r.height / ref.h) * st.z; return { r, k }; }
    function toScreen(x, y) { const { r, k } = geom(); return [(x - st.cx) * k + r.width / 2, (y - st.cy) * k + r.height / 2]; }
    function draw() {
      const { r, k } = geom(); if (!r.width) return;
      const w = r.width / k, h = r.height / k;
      let html = baseSVG([st.cx - w / 2, st.cy - h / 2, w, h]);
      // cluster at screen distance
      const pts = PLACES.map(p => ({ p, s: toScreen(p.x, p.y) }));
      const used = new Set(), groups = [];
      pts.forEach((a, i) => { if (used.has(i)) return; const g = [a]; used.add(i); pts.forEach((b, j) => { if (!used.has(j) && Math.hypot(a.s[0] - b.s[0], a.s[1] - b.s[1]) < 44) { g.push(b); used.add(j); } }); groups.push(g); });
      groups.forEach(g => {
        if (g.length > 1) { const x = g.reduce((t, q) => t + q.s[0], 0) / g.length, y = g.reduce((t, q) => t + q.s[1], 0) / g.length; html += `<button class="cluster" style="left:${x}px;top:${y}px" data-zoom="${g.map(q => q.p.id).join(',')}" aria-label="${g.length} places, zoom in">${g.length}</button>`; }
        else { const { p, s } = g[0]; html += `<button class="pin ${p.status === 'bad' ? 'full' : ''} ${st.sel === p.id ? 'on' : ''}" style="left:${s[0]}px;top:${s[1]}px" data-id="${p.id}" aria-label="${p.n}">${pinSVG}</button>`; }
      });
      const sp = PLACES.find(p => p.id === st.sel);
      if (sp && groups.some(g => g.length === 1 && g[0].p.id === sp.id)) { const [x, y] = toScreen(sp.x, sp.y); html += `<div class="pop" style="left:${x}px;top:${y}px"><div class="ph" data-scene="${sp.scene}"></div><div class="pb"><b>${sp.n}</b><span class="faint">${sp.a}</span><span><span class="chip ${sp.status}">${sp.s}</span></span><a href="#maps" class="link-ext">View facility ${icon('arrow', 'sm')}</a></div></div>`; }
      const kmPx = 80 / k * 0.02; // fictional scale: 1 unit = 20 m
      html += `<div class="ctrls"><button data-z="1" aria-label="Zoom in">${icon('plus')}</button><button data-z="-1" aria-label="Zoom out">${icon('minus')}</button><button data-z="0" aria-label="Reset view">${icon('locate')}</button></div><div class="scalebar"><span>${kmPx < 1 ? Math.round(kmPx * 1000) + ' m' : kmPx.toFixed(1) + ' km'}</span><i></i></div><div class="attrib">Sample basemap</div>`;
      mapEl.innerHTML = html;
      $$('.pin', mapEl).forEach(b => b.onclick = (e) => { e.stopPropagation(); select(b.dataset.id, false); });
      $$('.cluster', mapEl).forEach(b => b.onclick = (e) => { e.stopPropagation(); const ids = b.dataset.zoom.split(','); const ps = PLACES.filter(p => ids.includes(p.id)); st.cx = ps.reduce((t, p) => t + p.x, 0) / ps.length; st.cy = ps.reduce((t, p) => t + p.y, 0) / ps.length; st.z = Math.min(4, st.z * 2); draw(); });
      $$('[data-z]', mapEl).forEach(b => b.onclick = (e) => { e.stopPropagation(); const d = +b.dataset.z; if (!d) { st.z = 1; st.cx = 500; st.cy = 350; st.sel = null; } else st.z = Math.max(.8, Math.min(4, st.z * (d > 0 ? 1.5 : 1 / 1.5))); draw(); renderList(); });
    }
    function select(id, pan) { st.sel = st.sel === id && !pan ? null : id; const p = PLACES.find(q => q.id === id); if (pan && p) { st.cx = p.x; st.cy = p.y - 60 / geom().k; if (st.z < 1.6) st.z = 1.6; } draw(); renderList(); }
    function renderList() {
      count.textContent = `${PLACES.length} results`;
      list.innerHTML = PLACES.map(p => `<button class="it ${st.sel === p.id ? 'on' : ''}" data-id="${p.id}"><div class="ph" data-scene="${p.scene}"></div><span><b>${p.n}</b><span class="sub">${p.a} · ${p.type}</span><span class="chip ${p.status}">${p.s}</span></span></button>`).join('');
      $$('.it', list).forEach(b => b.onclick = () => select(b.dataset.id, true));
    }
    // drag to pan, wheel to zoom
    let drag = null;
    mapEl.addEventListener('pointerdown', e => { if (e.target.closest('button,.pop,a')) return; drag = { x: e.clientX, y: e.clientY, cx: st.cx, cy: st.cy }; mapEl.setPointerCapture(e.pointerId); });
    mapEl.addEventListener('pointermove', e => { if (!drag) return; const { k } = geom(); st.cx = drag.cx - (e.clientX - drag.x) / k; st.cy = drag.cy - (e.clientY - drag.y) / k; draw(); });
    mapEl.addEventListener('pointerup', () => { drag = null; });
    mapEl.addEventListener('wheel', e => { e.preventDefault(); st.z = Math.max(.8, Math.min(4, st.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); draw(); }, { passive: false });
    new ResizeObserver(draw).observe(mapEl);
    renderList(); draw();
    return { draw };
  }

  function capacityMap(el, opts = {}) {
    const lots = opts.lots || [{ n: 'Beach Lot A', x: 160, y: 470, p: 96, cap: 220 }, { n: 'Lakeview Lot', x: 720, y: 240, p: 71, cap: 140 }, { n: 'Ridge Trailhead', x: 850, y: 470, p: 38, cap: 60 }, { n: 'Flats Overflow', x: 560, y: 430, p: 12, cap: 300 }];
    function draw() {
      const r = { width: el.clientWidth, height: el.clientHeight }; if (!r.width) return;
      const k = Math.max(r.width / 1000, r.height / 700), w = r.width / k, h = r.height / k;
      let html = baseSVG([500 - w / 2, 350 - h / 2, w, h]);
      lots.forEach(l => { const x = (l.x - 500) * k + r.width / 2, y = (l.y - 350) * k + r.height / 2; const c = l.p >= 90 ? 'var(--bad)' : l.p >= 65 ? 'var(--warn)' : 'var(--ok)'; html += `<div class="lot" style="left:${x}px;top:${y}px"><div class="ring" style="--p:${l.p};--c:${c}"><b>${l.p}%</b></div><span class="name">${l.n} · ${Math.round(l.cap * (1 - l.p / 100))} left</span></div>`; });
      html += `<div class="legend"><b style="font-weight:500">Lot capacity, live</b><span><i style="background:var(--ok)"></i>Under 65%</span><span><i style="background:var(--warn)"></i>65–89%</span><span><i style="background:var(--bad)"></i>90% and up</span></div><div class="attrib">Sample data · updated 10:42 AM</div>`;
      el.innerHTML = html;
    }
    new ResizeObserver(draw).observe(el); draw();
    return { draw };
  }

  function miniMap(el) {
    const p = PLACES.find(q => q.id === el.dataset.place) || PLACES[0];
    function draw() {
      const r = { width: el.clientWidth, height: el.clientHeight }; if (!r.width) return;
      const k = Math.max(r.width / 1000, r.height / 700) * 2.2, w = r.width / k, h = r.height / k;
      el.innerHTML = baseSVG([p.x - w / 2, p.y - h / 2, w, h]) + `<span class="pin on" style="left:50%;top:50%;position:absolute;transform:translate(-50%,-100%)">${pinSVG}</span>`;
      el.classList.add('map');
    }
    new ResizeObserver(draw).observe(el); draw();
    return { draw };
  }

  const CSK = window.CSK = { icon, toast, maps: [], PLACES, hydrateIcons, calendar, timeline, qr, facilityMap, capacityMap, miniMap };
  document.addEventListener('DOMContentLoaded', () => {
    hydrateIcons();
    initBits();
    $$('.cal[data-cal]').forEach(calendar);
    $$('[data-timeline]').forEach(timeline);
    $$('canvas.qr').forEach(qr);
    $$('[data-facility-map]').forEach(r => CSK.maps.push(facilityMap(r)));
    $$('[data-capacity-map]').forEach(r => CSK.maps.push(capacityMap(r)));
    $$('[data-mini-map]').forEach(r => CSK.maps.push(miniMap(r)));
    initTheme();
    initRail();
  });
})();
