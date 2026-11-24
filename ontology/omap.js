/* Kaizen Service Ontology · omap.js
   Three views of KZO: Map (columns with drawn relations), Blueprint (users × service stages) and Matrix.
   Hover lights a node's whole chain; click pins it and opens its detail. No libraries. */
(function (G) {
"use strict";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const RANK = { Goal: 0, User: 1, Need: 2, Frustration: 2, Requirement: 3, Block: 4, Pattern: 4, Check: 4, Evidence: 4, Gap: 4, Stage: 4 };
const COLS = [
  { h: "Goal & users", cls: ["Goal", "User"] },
  { h: "Needs & frustrations", cls: ["Need", "Frustration"] },
  { h: "Requirements", cls: ["Requirement"] },
  { h: "Built on · shown in", cls: ["Block", "Pattern"] },
  { h: "Checked by · seen in · open", cls: ["Check", "Evidence", "Gap"] }
];
const DRAW = new Set(["needs", "experiences", "realizedBy", "addresses", "deliveredBy", "presentedIn", "checkedBy", "evidencedBy", "openQuestion"]);

G.KZO.mount = (root, opts = {}) => {
  const O = G.KZO, D = O.build(), { nodes, links, byId, out, inn } = D;
  const CL = new Map(O.CLASSES.map(c => [c.id, c])), REL = new Map(O.RELATIONS.map(r => [r.id, r]));
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  let view = G.d3 ? "3d" : "map", selected = null, hover = null, focusClass = null, domSel = null, domHover = null;
  const DM = O.DOMAIN, OBJ = new Map(DM.objects.map(o => [o.id, o]));
  const label = n => n.code ? `${n.code} ${n.n}` : n.n;
  const dot = n => `<i class="od ${n.status === "modeled" ? "hollow" : ""} ${n.c === "Gap" ? "tri" : ""} ${n.c === "Block" || n.c === "Pattern" ? "sq" : ""}" style="--c:var(${CL.get(n.c).col})"></i>`;
  const chip = c => `<span class="ochip">${dot({ c: c.id })}${esc(c.label)}</span>`;

  root.innerHTML = `<div class="om">
    <div class="om-h">
      <div class="seg" role="group" aria-label="View">${[["3d", "3D graph"], ["2d", "2D graph"], ["map", "Map"], ["domain", "Domain model"], ["blueprint", "Blueprint"], ["matrix", "Matrix"]].map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${v === view}">${t}</button>`).join("")}</div>
      <span class="om-count faint t-small">${nodes.length} nodes · ${links.length} relations</span>
      <span style="flex:1"></span>
      <div class="input short om-q"><svg class="i sm" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg><input id="omq" list="omnames" placeholder="Find a user, need or requirement" autocomplete="off" aria-label="Find a node"><datalist id="omnames">${nodes.map(n => `<option value="${esc(label(n))}"></option>`).join("")}</datalist></div>
    </div>
    <div class="om-b">
      <div class="om-stage" id="omstage">
        <div class="om-map" id="ommap" ${view === "3d" ? "hidden" : ""}><svg class="om-links" id="omsvg" aria-hidden="true"></svg>${COLS.map(col => `<div class="om-col"><span class="over">${col.h}</span>${col.cls.map(c => nodes.filter(n => n.c === c).map(n => `<button type="button" class="on-node k-${n.c} ${n.primary ? "primary" : ""} ${n.inKit === false ? "notkit" : ""}" data-id="${n.id}">${dot(n)}<span>${n.code && n.c !== "Gap" ? `<b class="mono">${n.code}</b> ` : ""}${esc(n.n)}${n.inKit === false ? ` <em>not in kit</em>` : ""}</span></button>`).join("")).join("")}</div>`).join("")}</div>
        <div class="om-3d" id="om3d"><canvas id="om3c" aria-label="3D knowledge graph of the ontology. The side panel lists every node and relation as text."></canvas>
          <div class="om-title"><span>Knowledge graph · D3</span><b>Kaizen service ontology</b></div>
          <div class="om-hud"><button type="button" class="spinbtn" data-h3="spin" aria-pressed="true"><span class="sp-ic" aria-hidden="true"><i class="sp-ring"></i><svg viewBox="0 0 16 16" class="sp-pause"><rect x="4" y="3.5" width="2.6" height="9" rx=".8"/><rect x="9.4" y="3.5" width="2.6" height="9" rx=".8"/></svg><svg viewBox="0 0 16 16" class="sp-play"><path d="M5 3.4v9.2a.6.6 0 0 0 .9.5l7.2-4.6a.6.6 0 0 0 0-1L5.9 2.9a.6.6 0 0 0-.9.5Z"/></svg></span><span class="sp-t">Pause spin</span></button><button type="button" data-h3="reset">Reset view</button></div>
          <div class="om-3legend" id="om3legend"></div><div class="om-tip" id="om3tip" hidden></div></div>
        <div class="om-3d om-2d" id="om2d" hidden><div class="g2host" id="om2host"></div><div class="om-title"><span>Knowledge graph · D3 · 2D</span><b>Kaizen service ontology</b></div>
          <div class="om-hud"><button type="button" data-h2="reset">Fit</button></div>
          <div class="om-3legend" id="om2legend"></div><div class="om-tip" id="om2tip" hidden></div></div>
        <div class="om-dm" id="omdm" hidden></div>
        <div class="om-bp" id="ombp" hidden></div>
        <div class="om-mx" id="ommx" hidden></div>
      </div>
      <aside class="om-panel" id="ompanel" aria-live="polite"></aside>
    </div>
  </div>`;

  /* ---------- chain: everything upstream and downstream ---------- */
  const neighbors = id => [...(out.get(id) || []).map(l => [l, l.t]), ...(inn.get(id) || []).map(l => [l, l.s])];
  function chainOf(id) {
    const ns = new Set([id]), ls = new Set(), start = byId.get(id);
    [-1, 1].forEach(dir => {
      let fr = [start];
      while (fr.length) {
        const nx = [];
        fr.forEach(n => neighbors(n.id).forEach(([l, oid]) => {
          const o = byId.get(oid); if (!o) return;
          const ok = dir < 0 ? RANK[o.c] < RANK[n.c] : RANK[o.c] > RANK[n.c];
          const sideways = n === start && RANK[o.c] === RANK[n.c] && o.c !== n.c;
          if (ok || sideways) { ls.add(l); if (!ns.has(o.id)) { ns.add(o.id); if (ok) nx.push(o); } }
        }));
        fr = nx;
      }
    });
    return { ns, ls };
  }

  /* ---------- map: draw relations between node edges ---------- */
  const map = $("#ommap"), svg = $("#omsvg");
  let paths = [];
  function drawLinks() {
    if (view !== "map") return;
    const box = map.getBoundingClientRect(); if (!box.width) return;
    const pos = new Map($$(".on-node").map(el => { const r = el.getBoundingClientRect(); return [el.dataset.id, { l: r.left - box.left, r: r.right - box.left, y: r.top - box.top + r.height / 2 }]; }));
    svg.setAttribute("width", map.scrollWidth); svg.setAttribute("height", map.scrollHeight);
    paths = links.filter(l => DRAW.has(l.r)).map(l => {
      let a = pos.get(l.s), b = pos.get(l.t); if (!a || !b) return null;
      let s = l.s, t = l.t; if (a.l > b.l) { [a, b] = [b, a]; [s, t] = [t, s]; }
      const x1 = a.r, x2 = b.l, dx = Math.max(30, (x2 - x1) / 2);
      return { l, d: `M${x1},${a.y} C${x1 + dx},${a.y} ${x2 - dx},${b.y} ${x2},${b.y}` };
    }).filter(Boolean);
    svg.innerHTML = paths.map((p, i) => `<path d="${p.d}" data-i="${i}" class="r-${p.l.r}"/>`).join("");
    restyle();
  }

  function restyle() {
    const pivot = hover || selected, ch = pivot ? chainOf(pivot) : null;
    $$(".on-node").forEach(el => {
      const n = byId.get(el.dataset.id);
      el.classList.toggle("dim", !!(ch ? !ch.ns.has(n.id) : focusClass && n.c !== focusClass));
      el.classList.toggle("sel", n.id === selected);
      el.classList.toggle("lit", !!(ch && ch.ns.has(n.id)));
    });
    [...svg.children].forEach(el => { const p = paths[+el.dataset.i]; if (!p) return; const on = ch && ch.ls.has(p.l); el.classList.toggle("on", !!on); el.classList.toggle("off", !!ch && !on); });
    if (view === "domain") styleDomain();
    if (view === "3d" || view === "2d") style3d();
    if (view === "blueprint") renderBlueprint();
    if (view === "matrix") renderMatrix();
  }

  /* ---------- panel ---------- */
  function overview() {
    const reqs = nodes.filter(n => n.c === "Requirement"), stated = reqs.filter(n => n.status === "stated").length;
    return `<span class="over">Overview</span><h3>Kaizen Service Ontology</h3>
      <p>The goal, the people who use and run Kaizen's services, what they need, and every requirement that follows. Each requirement links to the platform block that builds it, the kit pattern that shows it, the design check that guards it and the public program that proves it.</p>
      <div class="om-classes">${O.CLASSES.map(c => { const k = nodes.filter(n => n.c === c.id).length; return `<button type="button" data-class="${c.id}" aria-pressed="${focusClass === c.id}">${chip(c).replace(esc(c.label), esc(c.plural))}<b class="num">${k}</b></button>`; }).join("")}</div>
      <p class="note"><b>${stated}</b> of ${reqs.length} requirements are shown on a public page or a live Kaizen app (filled dot). <b>${reqs.length - stated}</b> are my modeling (hollow). <b>${nodes.filter(n => n.c === "Gap").length}</b> open questions.</p>
      <p class="note">Hover a node to light its chain. Click to pin it.</p>`;
  }
  function detail(n) {
    const groups = new Map(), addG = (k, x) => (groups.get(k) || groups.set(k, []).get(k)).push(x);
    (out.get(n.id) || []).forEach(l => addG(REL.get(l.r).out, byId.get(l.t)));
    (inn.get(n.id) || []).forEach(l => addG(REL.get(l.r).in, byId.get(l.s)));
    const c = CL.get(n.c);
    const kitLink = n.c === "Pattern" && n.inKit ? `<a class="btn btn-secondary sm" href="#${n.kit}" data-go="${n.kit}">See it in the kit</a>` : "";
    const build = opts.onBuild && n.c === "Requirement" && n.cap ? `<button type="button" class="btn btn-primary sm" data-build="${n.cap}">Build a product that meets it</button>` : "";
    return `<button type="button" class="btn btn-ghost sm om-back" data-id="">← Overview</button>${chip(c)}
      <h3>${esc(label(n))}</h3>${n.doc ? `<p>${esc(n.doc)}</p>` : ""}
      ${n.status ? `<p class="note">${n.status === "stated" ? "Shown on a public page or a live Kaizen app." : "Modeled: my design reading, not a public claim."}${n.src ? ` <a href="${n.src}" target="_blank" rel="noopener">Source ↗</a>` : ""}</p>` : n.src ? `<p class="note"><a href="${n.src}" target="_blank" rel="noopener">Source ↗</a></p>` : ""}
      ${n.surface ? `<p class="note">Works in: <b>${esc(n.surface)}</b></p>` : ""}
      ${kitLink || build ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${kitLink}${build}</div>` : ""}
      ${[...groups].map(([k, arr]) => `<div class="om-grp"><span class="over">${esc(k)} · ${arr.length}</span>${arr.map(x => `<button type="button" data-id="${x.id}">${dot(x)}<span>${esc(label(x))}</span></button>`).join("")}</div>`).join("")}`;
  }
  const renderPanel = () => { const p = $("#ompanel"), n = selected && byId.get(selected); p.innerHTML = (view === "domain" || view === "3d" || view === "2d") && domSel ? objDetail(OBJ.get(domSel)) : n ? detail(n) : view === "domain" ? domOverview() : overview(); p.scrollTop = 0; };
  function select(id) {
    domSel = null; selected = id || null; focusClass = null; hover = null; restyle(); renderPanel();
    if (G3 && view === "3d" && selected) G3.frame(selected);
    if (G2 && view === "2d" && selected) G2.frame(selected);
    const el = selected && view === "map" && root.querySelector(`.on-node[data-id="${selected}"]`);
    if (el) { const st = $("#omstage"), r = el.getBoundingClientRect(), s = st.getBoundingClientRect(); if (r.top < s.top || r.bottom > s.bottom) st.scrollBy({ top: r.top - s.top - s.height / 3, behavior: "smooth" }); }
  }

  /* ---------- 3D knowledge graph (D3) ---------- */
  const LAYERS = ["Goal", "Users", "Needs & frustrations", "Requirements", "Delivery & evidence", "Domain objects"];
  const LAYER_OF = { Goal: 0, User: 1, Need: 2, Frustration: 2, Requirement: 3, Block: 4, Pattern: 4, Check: 4, Evidence: 4, Gap: 4, Stage: 4 };
  const SHAPE_OF = { Goal: "dia", Block: "sq", Pattern: "sq", Gap: "tri", Check: "dia" };
  let G3 = null, hover3 = null, objsOn = true;
  function gdata() {
    const n3 = nodes.map(n => ({ id: n.id, layer: LAYER_OF[n.c], cls: n.c, col: CL.get(n.c).col, shape: SHAPE_OF[n.c] || "c", big: n.c === "Goal" || n.c === "User", hollow: n.status === "modeled", label: label(n) }))
      .concat(DM.objects.map(ob => ({ id: "o:" + ob.id, layer: 5, cls: "Object", col: "--g-" + ob.g, shape: "hex", big: false, hollow: !ob.seen, label: ob.n })));
    const l3 = links.map(l => ({ s: l.s, t: l.t, r: REL_OF[l.r] || "context", kind: ["forUser", "inStage", "serves"].includes(l.r) ? "weak" : "" }))
      .concat(DM.rels.map(([a, , b]) => ({ s: "o:" + a, t: "o:" + b, r: "domain", kind: "" })))
      .concat(O.REQ.flatMap(r => (DM.req[r.code] || []).map(ob => ({ s: r.id, t: "o:" + ob, r: "about", kind: "weak" }))));
    return { n3, l3 };
  }
  const REL_OF = { needs: "needs", experiences: "needs", realizedBy: "metBy", addresses: "fixes", deliveredBy: "builtOn", presentedIn: "shownIn", checkedBy: "checkedBy", evidencedBy: "seenIn", openQuestion: "openQ", serves: "context", forUser: "context", inStage: "context" };
  const RELKEY = [["needs", "Needs / feels", "User → need or frustration"], ["metBy", "Met by", "Need → requirement"], ["fixes", "Fixes", "Requirement → frustration"], ["builtOn", "Built on", "Requirement → platform block"], ["shownIn", "Shown in", "Requirement → kit pattern"], ["checkedBy", "Checked by", "Requirement → design check"], ["seenIn", "Seen in", "Requirement → public program"], ["openQ", "Open question", "Requirement → open question"], ["about", "Is about", "Requirement → domain object"], ["domain", "Domain link", "Object → object, e.g. Session held at Facility"], ["context", "Context", "Serves the goal, for a user, in a stage"]];
  const relOff = new Set();
  const relKeyHTML = () => `<div class="relkey"><span class="relh">Connections</span>${RELKEY.map(([id, name, doc]) => `<button type="button" data-rel="${id}" aria-pressed="${!relOff.has(id)}" title="${esc(doc)}"><i class="rl r-${id}"></i>${esc(name)}</button>`).join("")}</div>`;
  const LEG = () => [...O.CLASSES.map(c => [SHAPE_OF[c.id] || "c", c.col, c.plural, false]), ...DM.groups.map(g => ["hex", "--g-" + g[0], g[1] + " (domain)", false]), ["c", "--o-req", "Modeled, not public", true]];
  const legendHTML = kind => LEG().map(([sh, col, name, hol]) => `<span>${kind === "3d" ? `<canvas data-ic="${sh}" data-col="${col}" data-hollow="${hol ? 1 : 0}" aria-hidden="true"></canvas>` : G2 ? G2.iconSVG(sh, col, hol) : ""}${esc(name)}</span>`).join("");
  const paint3Legend = () => { if (!G3) return; $("#om3legend").innerHTML = `<div class="nodekey">${legendHTML("3d")}</div>` + relKeyHTML(); G3.paintIcons($("#om3legend")); };
  const paint2Legend = () => { if (G2) $("#om2legend").innerHTML = `<div class="nodekey">${legendHTML("2d")}</div>` + relKeyHTML(); };
  let G2 = null, hover2 = null;
  function mount2d() {
    if (G2 || !G.d3 || !G.KZO.graph2d) return;
    const { n3, l3 } = gdata();
    G2 = G.KZO.graph2d($("#om2host"), { nodes: n3, links: l3, layers: LAYERS, onTheme: () => paint2Legend(),
      onHover: (n, e) => { hover2 = n ? n.id : null; style3d(); const tip = $("#om2tip"); if (n) { tip.innerHTML = `<b>${esc(n.label)}</b>${n.cls === "Object" ? "Domain object" : esc(CL.get(n.cls).label)}${n.hollow ? " · modeled" : ""}`; tip.hidden = false; moveTip(e, "#om2d", "#om2tip"); } else tip.hidden = true; },
      onMove: e => moveTip(e, "#om2d", "#om2tip"),
      onPick: n => { if (!n) { domSel = null; select(null); return; } if (n.id.startsWith("o:")) { selected = null; domSel = n.id.slice(2); style3d(); renderPanel(); } else select(n.id === selected ? null : n.id); G2.frame(n.id); }
    });
    paint2Legend();
    style3d();
  }
  function mount3d() {
    if (G3 || !G.d3) return;
    const { n3, l3 } = gdata();
    G3 = G.KZO.graph3d($("#om3c"), { nodes: n3, links: l3, layers: LAYERS, onTheme: () => paint3Legend(), onSpin: v => spinUI(v),
      onHover: (n, e) => { hover3 = n ? n.id : null; style3d(); const tip = $("#om3tip"); if (n) { tip.innerHTML = `<b>${esc(n.label)}</b>${n.cls === "Object" ? "Domain object" : esc(CL.get(n.cls).label)}${n.hollow ? " · modeled" : ""}`; tip.hidden = false; moveTip(e); } else tip.hidden = true; },
      onMove: e => moveTip(e),
      onPick: n => { if (!n) { domSel = null; select(null); return; } if (n.id.startsWith("o:")) { selected = null; domSel = n.id.slice(2); style3d(); renderPanel(); } else select(n.id === selected ? null : n.id); G3.frame(n.id); }
    });
    paint3Legend(); spinUI(G3.spinning());
    style3d();
  }
  function spinUI(v) { const b = root.querySelector('[data-h3="spin"]'); if (!b) return; b.setAttribute("aria-pressed", String(v)); b.querySelector(".sp-t").textContent = v ? "Pause spin" : "Play spin"; b.setAttribute("aria-label", v ? "Pause spin" : "Play spin"); }
  function moveTip(e, host = "#om3d", tipSel = "#om3tip") { const tip = $(tipSel), r = $(host).getBoundingClientRect(); let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14; if (x + 300 > r.width) x -= 320; tip.style.left = x + "px"; tip.style.top = y + "px"; }
  function chain3(id) {
    if (!id) return null;
    if (id.startsWith("o:")) { const ob = id.slice(2), ns = new Set([id]); DM.rels.forEach(([a, , b]) => { if (a === ob) ns.add("o:" + b); if (b === ob) ns.add("o:" + a); });
      O.REQ.filter(r => (DM.req[r.code] || []).includes(ob)).forEach(r => { ns.add(r.id); (out.get(r.id) || []).forEach(l => { if (["realizedBy"].includes(l.r)) ns.add(l.t); }); (inn.get(r.id) || []).forEach(l => { if (l.r === "realizedBy") ns.add(l.s); }); }); return ns; }
    const ns = new Set(chainOf(id).ns); [...ns].forEach(x => { const n = byId.get(x); if (n && n.c === "Requirement") (DM.req[n.code] || []).forEach(ob => ns.add("o:" + ob)); }); return ns;
  }
  function style3d() { const sid = domSel ? "o:" + domSel : selected;
    if (G3) { const pivot = hover3 || sid; G3.highlight(chain3(pivot)); G3.select(sid); G3.setFocus(pivot ? null : focusClass); }
    if (G2) { const pivot = hover2 || sid; G2.highlight(chain3(pivot)); G2.select(sid); G2.setFocus(pivot ? null : focusClass); } }

  /* ---------- domain model: the parks & rec object model ---------- */
  const reqObjs = id => { const n = byId.get(id); return n && n.c === "Requirement" ? (DM.req[n.code] || []) : []; };
  const odot = o => `<i class="od ${o.seen ? "" : "hollow"} ${o.market ? "sq" : ""}" style="--c:var(--g-${o.g})"></i>`;
  function renderDomain() {
    const col = g => DM.objects.filter(o => o.g === g[0]);
    $("#omdm").innerHTML = `<div class="dm-cols" id="dmcols"><svg class="om-links" id="dmsvg" aria-hidden="true"></svg>${DM.groups.map(g => `<div class="om-col"><span class="over">${g[1]}</span>${col(g).filter(o => !o.market).map(objCard).join("")}${col(g).some(o => o.market) ? `<span class="over dm-sub">Marketplace · same model</span>${col(g).filter(o => o.market).map(objCard).join("")}` : ""}</div>`).join("")}</div>
      <div class="dm-states"><span class="over">State machines · these drive every status chip</span>${DM.objects.filter(o => o.states).map(o => `<div class="dm-sm" data-obj="${o.id}"><b>${esc(o.n)}</b><span>${o.states.map(st => `<em>${esc(st)}</em>`).join('<i>→</i>')}</span></div>`).join("")}</div>`;
    requestAnimationFrame(drawDomain);
  }
  const objCard = o => `<button type="button" class="dm-obj g-${o.g} ${o.market ? "market" : ""}" data-obj="${o.id}">${odot(o)}<span><b>${esc(o.n)}</b><small>${esc(o.attrs.slice(0, 3).join(" · "))}</small></span>${o.states ? `<em>${o.states.length} states</em>` : ""}</button>`;
  let dpaths = [];
  function drawDomain() {
    const box = $("#dmcols"); if (!box || view !== "domain") return; const b = box.getBoundingClientRect(), svgD = $("#dmsvg");
    const pos = new Map([...box.querySelectorAll(".dm-obj")].map(el => { const r = el.getBoundingClientRect(); return [el.dataset.obj, { l: r.left - b.left, r: r.right - b.left, y: r.top - b.top + r.height / 2 }]; }));
    svgD.setAttribute("width", box.scrollWidth); svgD.setAttribute("height", box.scrollHeight);
    dpaths = DM.rels.map(([s0, lab, t0]) => { let a = pos.get(s0), c = pos.get(t0); if (!a || !c) return null; let d;
      if (Math.abs(a.l - c.l) < 4) { const x = a.r, bend = 26 + Math.min(40, Math.abs(c.y - a.y) / 6); d = `M${x},${a.y} C${x + bend},${a.y} ${x + bend},${c.y} ${x},${c.y}`; return { s0, t0, lab, d, mx: x + bend * .75, my: (a.y + c.y) / 2 }; }
      if (a.l > c.l) [a, c] = [c, a]; const dx = Math.max(24, (c.l - a.r) / 2); d = `M${a.r},${a.y} C${a.r + dx},${a.y} ${c.l - dx},${c.y} ${c.l},${c.y}`; return { s0, t0, lab, d, mx: (a.r + c.l) / 2, my: (a.y + c.y) / 2 }; }).filter(Boolean);
    svgD.innerHTML = dpaths.map((p, i) => `<path d="${p.d}" data-i="${i}"/><text x="${p.mx}" y="${p.my - 4}" data-t="${i}" text-anchor="middle">${esc(p.lab)}</text>`).join("");
    styleDomain();
  }
  function styleDomain() {
    const box = $("#dmcols"); if (!box) return;
    const pivot = domHover || domSel, rq = !pivot && selected ? new Set(reqObjs(selected)) : null;
    const near = new Set(pivot ? [pivot] : []); if (pivot) DM.rels.forEach(([a, , b]) => { if (a === pivot) near.add(b); if (b === pivot) near.add(a); });
    box.querySelectorAll(".dm-obj").forEach(el => { const id = el.dataset.obj; el.classList.toggle("dim", pivot ? !near.has(id) : rq ? !rq.has(id) : false); el.classList.toggle("sel", id === domSel || (rq && rq.has(id))); });
    const svgD = $("#dmsvg"); dpaths.forEach((p, i) => { const on = pivot && (p.s0 === pivot || p.t0 === pivot) || (rq && rq.has(p.s0) && rq.has(p.t0)); const el = svgD.querySelector(`[data-i="${i}"]`), tx = svgD.querySelector(`[data-t="${i}"]`); if (!el) return; el.classList.toggle("on", !!on); el.classList.toggle("off", !!(pivot || rq) && !on); tx.classList.toggle("show", !!on); });
    $$("#omdm .dm-sm").forEach(el => el.classList.toggle("dim", !!(pivot || rq) && !(near.has(el.dataset.obj) || (rq && rq.has(el.dataset.obj)))));
  }
  function domOverview() {
    return `<span class="over">Domain model</span><h3>The parks & rec object model</h3><p>The things every Kaizen parks screen is a view of: places, what people sign up for, who they are, what they buy, and the rules that govern it. The requirements say why a screen exists; these objects say what it shows.</p>
      <div class="om-classes">${DM.groups.map(g => `<button type="button" data-dg="${g[0]}"><span class="ochip"><i class="od" style="--c:var(--g-${g[0]})"></i>${g[1]}</span><b class="num">${DM.objects.filter(o => o.g === g[0]).length}</b></button>`).join("")}</div>
      <p class="note"><b>${DM.objects.filter(o => o.seen).length}</b> of ${DM.objects.length} objects are visible in a live app or public page (filled dot). <b>${DM.rels.length}</b> relationships. <b>${DM.objects.filter(o => o.states).length}</b> state machines.</p>
      <p class="note">The marketplace objects reuse the same model: a listing plays the role of a program, and a request plays cart plus approval. That reuse is what makes platform blocks work.</p>
      <p class="note">Hover an object to see what it connects to. Pick a requirement in search to see the objects it touches.</p>`;
  }
  function objDetail(o) {
    const outs = DM.rels.filter(r => r[0] === o.id), ins = DM.rels.filter(r => r[2] === o.id);
    const reqs = O.REQ.filter(r => (DM.req[r.code] || []).includes(o.id));
    const scr = Object.entries(DM.screens).filter(([, os]) => os.includes(o.id)).map(([k]) => (G.KZS && G.KZS.NAMES[k]) || k);
    const grp = DM.groups.find(g => g[0] === o.g)[1];
    return `<button type="button" class="btn btn-ghost sm om-back" data-obj="">← Domain model</button><span class="ochip">${odot(o)}Domain object · ${grp}</span><h3>${esc(o.n)}</h3><p>${esc(o.doc)}</p>
      <p class="note">${o.seen ? `Seen: ${esc(o.seen)}` : "Modeled: implied by the apps, not shown directly."}</p>
      <div class="om-grp"><span class="over">Attributes</span><div style="display:flex;flex-wrap:wrap;gap:6px">${o.attrs.map(a => `<span class="tag">${esc(a)}</span>`).join("")}</div></div>
      ${o.states ? `<div class="om-grp"><span class="over">States</span><div class="dm-sm flat"><span>${o.states.map(st => `<em>${esc(st)}</em>`).join("<i>→</i>")}</span></div></div>` : ""}
      ${outs.length ? `<div class="om-grp"><span class="over">Relates to · ${outs.length}</span>${outs.map(r => `<button type="button" data-obj="${r[2]}">${odot(OBJ.get(r[2]))}<span><span class="faint">${esc(r[1])}</span> ${esc(OBJ.get(r[2]).n)}</span></button>`).join("")}</div>` : ""}
      ${ins.length ? `<div class="om-grp"><span class="over">Referenced by · ${ins.length}</span>${ins.map(r => `<button type="button" data-obj="${r[0]}">${odot(OBJ.get(r[0]))}<span>${esc(OBJ.get(r[0]).n)} <span class="faint">${esc(r[1])}</span></span></button>`).join("")}</div>` : ""}
      ${reqs.length ? `<div class="om-grp"><span class="over">Requirements · ${reqs.length}</span>${reqs.map(r => `<button type="button" data-id="${r.id}">${dot(byId.get(r.id))}<span><b class="mono" style="font-weight:400">${r.code}</b> ${esc(r.n)}</span></button>`).join("")}</div>` : ""}
      ${scr.length ? `<div class="om-grp"><span class="over">Builder screens · ${scr.length}</span><div style="display:flex;flex-wrap:wrap;gap:6px">${scr.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div></div>` : ""}`;
  }
  function selectObj(id) { if (!["domain", "3d", "2d"].includes(view)) setView("domain"); domSel = id || null; selected = null; hover = null; styleDomain(); style3d(); if (G3 && view === "3d" && id) G3.frame("o:" + id); if (G2 && view === "2d" && id) G2.frame("o:" + id); renderPanel(); const el = id && root.querySelector(`.dm-obj[data-obj="${id}"]`); if (el) el.scrollIntoView({ block: "nearest" }); }

  /* ---------- blueprint: users × stages ---------- */
  function renderBlueprint() {
    const ch = (hover || selected) ? chainOf(hover || selected) : null;
    const head = `<tr><th></th>${O.STAGES.map(s => `<th data-id="s-${s.id}" class="${selected === "s-" + s.id ? "on" : ""}"><b>${esc(s.n)}</b><span>${esc(s.q)}</span></th>`).join("")}</tr>`;
    const rows = O.USERS.map(u => `<tr><th data-id="u-${u.id}" class="${selected === "u-" + u.id ? "on" : ""}"><b>${esc(u.n)}</b><span>${esc(u.surface)}</span></th>${O.STAGES.map(s => {
      const rs = O.REQ.filter(r => r.users.includes(u.id) && r.stages.includes(s.id));
      return `<td>${rs.map(r => `<button type="button" class="bp-r ${r.status} ${ch && !ch.ns.has(r.id) ? "dim" : ""} ${selected === r.id ? "sel" : ""}" data-id="${r.id}" title="${esc(r.n)}"><b class="mono">${r.code}</b> ${esc(r.n)}</button>`).join("")}</td>`;
    }).join("")}</tr>`).join("");
    $("#ombp").innerHTML = `<div class="scroll-x"><table class="bp"><thead>${head}</thead><tbody>${rows}</tbody></table></div><p class="note" style="padding:0 16px 16px">A service blueprint built from the ontology: each requirement sits where its user meets it. Solid = shown in public, dashed = modeled.</p>`;
  }

  /* ---------- matrix ---------- */
  function renderMatrix() {
    const groups = [["Users", O.USERS.map(u => byId.get("u-" + u.id)), "forUser"], ["Platform blocks", O.BLOCKS.map(b => byId.get(b.id)), "deliveredBy"], ["Kit patterns", O.PATTERNS.map(p => byId.get(p.id)), "presentedIn"]];
    const has = (r, t, rel) => (out.get(r.id) || []).some(l => l.r === rel && l.t === t.id);
    const selN = selected && byId.get(selected);
    const colOn = t => selN && selN.id === t.id, rowOn = r => selN && (selN.id === r.id || (selN.c !== "Requirement" && (out.get(r.id) || []).some(l => l.t === selN.id)));
    const head = `<tr><th class="rh">Requirement</th>${groups.map(([h, list]) => list.map((t, i) => `<th class="vh ${i === 0 ? "gstart" : ""} ${colOn(t) ? "on" : ""}" data-id="${t.id}" title="${esc(h + ": " + t.n)}"><span>${esc(t.n)}</span></th>`).join("")).join("")}<th class="vh gstart"><span>Open question</span></th></tr>`;
    const grpRow = `<tr class="grp"><th></th>${groups.map(([h, list]) => `<th colspan="${list.length}" class="gstart">${h}</th>`).join("")}<th class="gstart"></th></tr>`;
    const body = O.REQ.map(r => { const n = byId.get(r.id), gap = (out.get(r.id) || []).filter(l => l.r === "openQuestion").map(l => byId.get(l.t).code); return `<tr class="${rowOn(n) ? "on" : ""}"><th class="rh" data-id="${r.id}">${dot(n)}<b class="mono">${r.code}</b> ${esc(r.n)}</th>${groups.map(([, list, rel]) => list.map((t, i) => `<td class="${i === 0 ? "gstart" : ""} ${colOn(t) ? "on" : ""}">${has(n, t, rel) ? `<i style="--c:var(${CL.get(t.c).col})"></i>` : ""}</td>`).join("")).join("")}<td class="gstart q">${gap.join(" ")}</td></tr>`; }).join("");
    $("#ommx").innerHTML = `<div class="scroll-x"><table class="mx"><thead>${grpRow}${head}</thead><tbody>${body}</tbody></table></div><p class="note" style="padding:0 16px 16px">Read across to see what a requirement touches; read down to see everything a block or pattern carries. Click a row or column to trace it.</p>`;
  }

  /* ---------- events ---------- */
  root.addEventListener("click", e => {
    const v = e.target.closest("[data-v]"); if (v) return setView(v.dataset.v);
    const c = e.target.closest("[data-class]"); if (c) { focusClass = focusClass === c.dataset.class ? null : c.dataset.class; selected = null; restyle(); renderPanel(); return; }
    const rk = e.target.closest("[data-rel]"); if (rk) { const id = rk.dataset.rel; relOff.has(id) ? relOff.delete(id) : relOff.add(id); G3 && G3.setRelOff(relOff); G2 && G2.setRelOff(relOff); root.querySelectorAll(`[data-rel="${id}"]`).forEach(b => b.setAttribute("aria-pressed", String(!relOff.has(id)))); return; }
    const h2 = e.target.closest("[data-h2]"); if (h2 && G2) { if (h2.dataset.h2 === "reset") G2.reset(); else { const on = h2.getAttribute("aria-pressed") !== "true"; h2.setAttribute("aria-pressed", String(on)); G2.setHidden(on ? null : n => n.id.startsWith("o:")); } return; }
    const h3 = e.target.closest("[data-h3]"); if (h3 && G3) { const k = h3.dataset.h3; if (k === "spin") G3.toggleSpin(); else if (k === "reset") G3.reset(); else { objsOn = !objsOn; h3.setAttribute("aria-pressed", String(objsOn)); G3.setHidden(objsOn ? null : n => n.id.startsWith("o:")); } return; }
    const ob = e.target.closest("[data-obj]"); if (ob && root.contains(ob)) { const id = ob.dataset.obj; selectObj(id && id !== domSel ? id : null); return; }
    const dg = e.target.closest("[data-dg]"); if (dg) { const f = DM.objects.find(o => o.g === dg.dataset.dg); selectObj(f.id); return; }
    const b = e.target.closest("[data-build]"); if (b) { opts.onBuild && opts.onBuild(b.dataset.build, selected); return; }
    const g = e.target.closest("[data-go]"); if (g) { opts.onGo && opts.onGo(g.dataset.go); return; }
    const n = e.target.closest("[data-id]"); if (n && root.contains(n)) { const id = n.dataset.id; select(id && id !== selected ? id : null); return; }
    if (e.target.closest("#ommap") && !e.target.closest(".on-node")) select(null);
  });
  root.addEventListener("pointerover", e => { if (view === "domain") { const o = e.target.closest(".dm-obj"); const id = o ? o.dataset.obj : null; if (id !== domHover) { domHover = id; styleDomain(); } return; } const n = e.target.closest(".on-node,.bp-r"); const id = n ? n.dataset.id : null; if (id !== hover && view === "map") { hover = id; restyle(); } });
  root.addEventListener("pointerleave", () => { if (hover) { hover = null; restyle(); } if (domHover) { domHover = null; styleDomain(); } });
  $("#ommap").addEventListener("pointerleave", () => { if (hover) { hover = null; restyle(); } });
  $("#omq").addEventListener("change", e => { const q = e.target.value.trim().toLowerCase(); const n = nodes.find(x => label(x).toLowerCase() === q) || nodes.find(x => label(x).toLowerCase().includes(q)); if (n) select(n.id); });
  function setView(v) {
    view = v; const pl = document.getElementById("olegend"); if (pl) pl.hidden = v === "3d" || v === "2d"; $$("[data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
    $("#ommap").hidden = v !== "map"; $("#om3d").hidden = v !== "3d"; $("#om2d").hidden = v !== "2d"; $("#omdm").hidden = v !== "domain"; $("#ombp").hidden = v !== "blueprint"; $("#ommx").hidden = v !== "matrix";
    $("#omstage").scrollTop = 0; if (v === "map") requestAnimationFrame(drawLinks); else if (v === "domain") { renderDomain(); } else if (v === "3d") { mount3d(); style3d(); } else if (v === "2d") { mount2d(); style3d(); } else restyle(); renderPanel();
  }
  new ResizeObserver(() => { drawLinks(); drawDomain(); }).observe($("#omstage"));
  renderPanel(); requestAnimationFrame(() => { if (view === "3d") mount3d(); else drawLinks(); });
  return { select, selectObj, setView, redraw: () => { drawLinks(); drawDomain(); }, D };
};
})(window);
