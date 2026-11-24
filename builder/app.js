/* Kaizen Product Builder · app.js — prompt, config panel, summary, flow player, outputs, spec.
   Two modes. Open: any prompt → Claude (via the `sample` capability) → a product spec rendered with the kit.
   Preset: the ontology-driven engine (agency type + team + capabilities), used offline or by choice. */
(function (G) {
"use strict";
const B = G.KZB, S = G.KZS, O = G.KZO, X = G.KZOPEN;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let root, cfg, bp, cur = { flow: null, step: 0 }, notes = [], mode = "preset", spec = null, sample = null, ctl = null, busy = false;
const $ = s => root.querySelector(s);
const PROMPTS = [
  ["Library room booking", "Let residents book study rooms and maker-space equipment at the city library, with a waitlist, staff check-in and a no-show rule."],
  ["Snow plow requests", "A city app where residents report unplowed streets on a map, see crews' progress, and staff dispatch and close requests."],
  ["Food truck permits", "Food truck vendors apply for a city permit, upload health inspection documents, pay the fee, and inspectors review and approve."],
  ["Veteran benefits tracker", "Veterans check the status of a disability claim, upload evidence, and get text updates; caseworkers triage and request more information."],
  ["Youth sports league", "Parents register kids for a county youth soccer league, pick a team practice slot, volunteer to coach, and pay with a sibling discount."],
  ["Counter-drone marketplace", "Military buyers compare validated counter-drone products and request them; vendors submit listings for validation."]
];

function load() { try { const s = JSON.parse(localStorage.getItem("kzb.cfg") || "null"); if (s && B.PRESETS[s.preset]) return { ...s, users: new Set(s.users), caps: new Set(s.caps) }; } catch (e) {} return B.configFor("parks"); }
function save() { try { localStorage.setItem("kzb.cfg", JSON.stringify({ ...cfg, users: [...cfg.users], caps: [...cfg.caps] })); } catch (e) {} }
function loadSpec() { try { const s = JSON.parse(localStorage.getItem("kzb.spec") || "null"); if (s) return X.normalize(s); } catch (e) {} return null; }
function saveSpec() { try { spec ? localStorage.setItem("kzb.spec", JSON.stringify(spec)) : localStorage.removeItem("kzb.spec"); } catch (e) {} }

function shell() {
  root.innerHTML = `<div class="bgrid"><aside class="bcfg" aria-label="Product settings">
    <div class="bsec"><span class="over">Describe any product</span><textarea id="bdesc" aria-label="Describe the product" placeholder="Who is it for, what do they need to get done, and who runs it?">${esc(PROMPTS[0][1])}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="bgo" type="button">Design it</button><button class="btn btn-secondary" id="bchange" type="button" hidden>Change current</button><button class="btn btn-ghost" id="bstop" type="button" hidden>Stop</button></div>
      <div class="bprog" id="bprog" hidden></div>
      <div class="pp">${PROMPTS.map((p, i) => `<button type="button" data-pp="${i}">${esc(p[0])}</button>`).join("")}</div><div class="bnotes" id="bnotes"></div></div>
    <div id="bpresetcfg">
    <div class="bsec" id="bpresets"></div>
    <div class="bsec"><div class="bin"><label for="bname">Product name</label><input id="bname" maxlength="48"></div><div class="bin"><label for="bagency">Agency</label><input id="bagency" maxlength="48"></div><span class="over">Agency color</span><div class="swatches-row" id="bacc"></div></div>
    <div class="bsec"><span class="over">Team</span><div class="pills" id="busers"></div></div>
    <div class="bsec"><span class="over">Capabilities <em id="bcapn"></em></span><div id="bcaps"></div></div>
    </div>
    <div class="bsec" id="bopencfg" hidden></div>
  </aside>
  <div class="bout">
    <section class="bsum" id="bsum"></section>
    <section class="bplay"><div class="btabs" role="tablist" id="btabs"></div><ol class="bsteps" id="bsteps"></ol><div class="bstage" id="bstage"><div class="pf-frame" id="bframe"></div></div><div class="bcap" id="bcap"></div></section>
    <div class="bcols"><section class="bcard"><h3>Navigation</h3><div class="ia" id="bia"></div></section><section class="bcard"><h3 id="bneedsh">Team needs</h3><div class="nlist" id="bneeds"></div></section><section class="bcard"><h3>Requirements</h3><ul class="rlist" id="breqs"></ul></section></div>
    <div class="bcols"><section class="bcard"><h3 id="bblocksh">Platform blocks</h3><div id="bblocks" class="ia"></div></section><section class="bcard"><h3>Kit patterns</h3><div id="bpats" class="ia"></div></section><section class="bcard"><h3>Open questions</h3><div id="bgaps" class="nlist"></div></section></div>
    <section class="bcard"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>Product spec</h3><span style="display:flex;gap:10px;align-items:center"><span class="t-small faint" id="bcopymsg"></span><button class="btn btn-secondary sm" id="bcopy" type="button">Copy Markdown</button></span></div><pre class="spec-md" id="bspec"></pre></section>
  </div></div>`;
}

/* ================= preset mode ================= */
function renderCfg() {
  $("#bpresetcfg").hidden = mode === "open"; $("#bopencfg").hidden = mode !== "open"; $("#bchange").hidden = !(mode === "open" && spec && sample);
  $("#bnotes").innerHTML = notes.map(n => `<span>${esc(n)}</span>`).join("");
  if (mode === "open") {
    $("#bopencfg").innerHTML = `<span class="over">Designed from your prompt</span><p class="t-small muted" style="margin:0">${esc(spec.tagline)}</p><span class="over">Agency color</span><div class="swatches-row">${[spec.accent, ...B.ACCENTS.map(a => a[0])].filter((c, i, a) => a.indexOf(c) === i).slice(0, 6).map(c => `<button type="button" data-oacc="${esc(c)}" aria-pressed="${c === spec.accent}" aria-label="Color ${esc(c)}" style="background:${esc(c)}"></button>`).join("")}</div><button class="btn btn-secondary sm" type="button" id="bpreset">Use the preset builder instead</button>`;
    return;
  }
  $("#bpresets").innerHTML = `<span class="over">Or start from an agency type</span>` + Object.entries(B.PRESETS).map(([id, p]) => `<button type="button" class="rad" data-preset="${id}" aria-pressed="${cfg.preset === id}"><b>${esc(p.name)}</b><small>${esc(p.blurb)}</small></button>`).join("");
  $("#bname").value = cfg.name; $("#bagency").value = cfg.agency;
  $("#bacc").innerHTML = B.ACCENTS.map(([c, n]) => `<button type="button" data-acc="${c}" aria-pressed="${cfg.accent === c}" title="${n}" aria-label="${n}" style="background:${c}"></button>`).join("");
  $("#busers").innerHTML = O.USERS.map(u => `<button type="button" class="pill" data-user="${u.id}" aria-pressed="${cfg.users.has(u.id)}" title="${esc(u.doc)}">${esc(u.n)}</button>`).join("");
  $("#bcapn").textContent = `${cfg.caps.size} on`;
  $("#bcaps").innerHTML = B.CAPS.filter(c => !c.core).map(c => `<button type="button" class="swr" role="switch" data-cap="${c.id}" aria-checked="${cfg.caps.has(c.id)}"><span><b>${esc(c.name)}</b><small>${esc(c.doc)}</small></span><i aria-hidden="true"></i></button>`).join("");
}
function renderSum() {
  if (mode === "open") {
    const steps = spec.flows.reduce((n, f) => n + f.steps.length, 0), m = spec.requirements.filter(r => r.matches).length;
    $("#bsum").innerHTML = `<div><span class="over">Designed from your prompt · ${esc(spec.agency)}</span><h2>${esc(spec.name)}</h2><div class="surf">${spec.surfaces.map(s => `<span class="chip ok plain">${esc(s.name)}</span>`).join("")}</div></div>
      <div class="bmet"><div><b>${spec.users.length}</b><span>kinds of user</span></div><div><b>${spec.requirements.length}</b><span>requirements</span></div><div><b>${spec.flows.length}</b><span>flows · ${steps} screens</span></div><div><b>${spec.objects.length}</b><span>data objects</span></div><div><b>${m}</b><span>reuse the Kaizen ontology</span></div></div><div class="bwarn"></div>`;
    return;
  }
  const steps = bp.flows.reduce((n, f) => n + f.steps.length, 0), todo = bp.patterns.filter(p => !p.inKit).length;
  $("#bsum").innerHTML = `<div><span class="over">${esc(B.PRESETS[cfg.preset].name)} · ${esc(cfg.agency)}</span><h2>${esc(cfg.name)}</h2><div class="surf">${bp.surfaces.map(s => `<span class="chip ok plain">${B.SURFACE_NAME[s]}</span>`).join("")}</div></div>
    <div class="bmet"><div><b>${bp.coverage}%</b><span>team needs met</span><div class="meter ${bp.coverage < 60 ? "bad" : bp.coverage < 100 ? "warn" : ""}" style="width:90px"><i style="width:${bp.coverage}%"></i></div></div><div><b>${bp.inReqs.length}</b><span>of ${O.REQ.length} requirements</span></div><div><b>${bp.flows.length}</b><span>flows · ${steps} screens</span></div><div><b>${bp.blocks.length}</b><span>platform blocks</span></div><div><b>${todo}</b><span>patterns to design</span></div></div>
    <div class="bwarn">${bp.warnings.map(w => `<div class="alert warn"><svg class="i" viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4L12 4Z"/><path d="M12 10v4.5M12 17v.01"/></svg><div>${esc(w)}</div></div>`).join("")}</div>`;
}
function renderOut() {
  if (mode === "open") {
    $("#bia").innerHTML = spec.surfaces.map(s => `<div><b>${esc(s.name)}</b><ul>${s.nav.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("");
    $("#bneedsh").textContent = "People and needs";
    $("#bneeds").innerHTML = spec.users.map(u => `<div class="ok"><i></i><span><b style="font-weight:500">${esc(u.name)}</b>${u.needs.length ? " · " + esc(u.needs.join("; ")) : ""}</span></div>`).join("");
    $("#breqs").innerHTML = spec.requirements.map(r => { const m = r.matches && O.REQ.find(x => x.code === r.matches); return `<li class="in"><i></i><code>${esc(r.id)}</code><span>${esc(r.name)}</span><small>${m ? `<button type="button" class="linkbtn" data-oreq="${m.id}">= ${esc(r.matches)}</button>` : "New"}</small></li>`; }).join("");
    $("#bblocksh").textContent = "Data objects";
    $("#bblocks").innerHTML = spec.objects.map(o => `<div><b>${esc(o.name)}${o.matches ? ` <button type="button" class="linkbtn" data-oobj="${esc(o.matches)}">= Kaizen ${esc((O.DOMAIN.objects.find(x => x.id === o.matches) || {}).n || o.matches)}</button>` : ""}</b><ul>${o.fields.map(f => `<li>${esc(f)}</li>`).join("")}</ul>${o.states.length ? `<span class="t-small faint">${esc(o.states.join(" → "))}</span>` : ""}</div>`).join("");
    const kinds = [...new Set(spec.flows.flatMap(f => f.steps.map(s => s.screen.kind)))];
    $("#bpats").innerHTML = `<ul>${kinds.map(k => `<li>${esc(X.KIT_OF[k] || k)}</li>`).join("")}</ul>`;
    $("#bgaps").innerHTML = spec.questions.map((q, i) => `<div class="un"><i style="background:var(--o-gap)"></i><span><b style="font-weight:500">Q${i + 1}</b> ${esc(q)}</span></div>`).join("") || `<p class="t-small faint">None.</p>`;
    $("#bspec").textContent = X.markdown(spec);
    return;
  }
  $("#bneedsh").textContent = "Team needs"; $("#bblocksh").textContent = "Platform blocks";
  $("#bia").innerHTML = bp.surfaces.map(s => `<div><b>${B.SURFACE_NAME[s]}</b><ul>${bp.ia[s].map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("") || `<p class="t-small faint">Add someone to the team to get a surface.</p>`;
  $("#bneeds").innerHTML = bp.needs.map(n => `<div class="${n.met.length ? "ok" : "un"}"><i></i><span>${esc(n.n)}</span>${n.met.length ? `<code>${n.met.join(" ")}</code>` : n.suggest.map(c => `<button type="button" class="linkbtn" data-addcap="${c}">Turn on ${esc(B.capName(c))}</button>`).join(" ")}</div>`).join("") || `<p class="t-small faint">No one on the team yet.</p>`;
  const order = { in: 0, nouser: 1, off: 2 };
  $("#breqs").innerHTML = [...bp.reqs].sort((a, b) => order[a.state] - order[b.state]).map(r => `<li class="${r.state}"><i></i><code>${r.code}</code><span>${esc(r.n)}</span><small>${r.state === "in" ? (r.status === "stated" ? "In · public" : "In · modeled") : r.state === "off" ? esc(B.capName(r.cap)) + " off" : "No user on team"}</small></li>`).join("");
  $("#bblocks").innerHTML = `<ul>${bp.blocks.map(b => `<li>${esc(b.n)}</li>`).join("")}</ul>`;
  $("#bpats").innerHTML = `<ul>${bp.patterns.map(p => `<li style="${p.inKit ? "" : "background:var(--warn-soft);color:var(--warn)"}">${esc(p.n)}${p.inKit ? "" : " · to design"}</li>`).join("")}</ul>`;
  $("#bgaps").innerHTML = bp.gaps.map(g => `<div class="un"><i style="background:var(--o-gap)"></i><span><b style="font-weight:500">${g.code}</b> ${esc(g.n)}</span></div>`).join("") || `<p class="t-small faint">None for this product.</p>`;
  $("#bspec").textContent = B.spec(cfg, bp);
}

/* ================= flow player (both modes) ================= */
const flows = () => mode === "open" ? spec.flows : bp.flows;
function curFS() {
  const F = flows(); let f = F.find(x => x.id === cur.flow) || F[0];
  if (!f) return [null, null];
  if (cur.flow !== f.id) cur = { flow: f.id, step: 0 };
  cur.step = Math.max(0, Math.min(cur.step, f.steps.length - 1));
  return [f, f.steps[cur.step]];
}
function fit() { const st = $("#bstage"), fr = $("#bframe"); if (!st || !fr) return; const s = Math.min(1, st.clientWidth / 1280); fr.style.transform = `scale(${s})`; st.style.height = Math.round(800 * s) + "px"; }
const surfName = (s) => mode === "open" ? ((spec.surfaces.find(x => x.id === s) || {}).name || s) : B.SURFACE_NAME[s];
function renderPlayer() {
  const [f, s] = curFS();
  $("#btabs").innerHTML = flows().map(x => `<button type="button" role="tab" data-flow="${esc(x.id)}" aria-selected="${f && x.id === f.id}"><span>${esc(x.name)}</span><small>${x.steps.length} steps · ${[...new Set(x.steps.map(y => surfName(y.surface)))].map(esc).join(", ")}</small></button>`).join("");
  if (!f) { $("#bsteps").innerHTML = ""; $("#bframe").innerHTML = `<div class="pf-wrap pf-pad"><div class="empty"><b>No flows yet</b><span>Turn on a capability and add the people who use it.</span></div></div>`; $("#bcap").innerHTML = ""; fit(); return; }
  $("#bsteps").innerHTML = f.steps.map((x, i) => `<li class="${i < cur.step ? "done" : i === cur.step ? "now" : ""}"><button type="button" data-step="${i}" ${i === cur.step ? 'aria-current="step"' : ""}><i>${i + 1}</i>${esc(x.title)}</button></li>`).join("");
  const fr = $("#bframe");
  fr.style.setProperty("--pf-accent", mode === "open" ? spec.accent : cfg.accent);
  if (mode === "open") {
    fr.innerHTML = X.render(spec, s); fr.scrollTop = 0;
    X.after(fr, spec, s, () => X.markHot(fr, s.last ? "" : s.hot));
    fit();
    const who = s.actor === "system" ? "System" : (spec.users.find(u => u.id === s.actor) || { name: s.actor }).name;
    const reqChips = s.reqs.map(id => { const r = spec.requirements.find(x => x.id === id); if (!r) return ""; const m = r.matches && O.REQ.find(x => x.code === r.matches); return m ? `<button type="button" class="rq" data-oreq="${m.id}" title="${esc(r.name)} · same as ${esc(r.matches)}">${esc(r.id)} = ${esc(r.matches)}</button>` : `<span class="rq" title="${esc(r.name)}">${esc(r.id)}</span>`; }).join("");
    const objChips = s.objects.map(id => { const o = spec.objects.find(x => x.id === id); if (!o) return ""; return o.matches ? `<button type="button" class="rq" data-oobj="${esc(o.matches)}">${esc(o.name)}</button>` : `<span class="rq">${esc(o.name)}</span>`; }).join("");
    $("#bcap").innerHTML = `<div><span class="over">Step ${cur.step + 1} of ${f.steps.length} · ${esc(who)} · ${esc(surfName(s.surface))} · ${esc(X.KIT_OF[s.screen.kind] || s.screen.kind)}</span><h3>${esc(s.title)}</h3><p>${esc(s.action)}</p>
      ${reqChips ? `<div class="meta">${reqChips}</div>` : ""}${objChips ? `<div class="meta"><span class="t-small faint">Shows</span>${objChips}</div>` : ""}</div>
      <div style="display:grid;gap:8px;justify-items:end"><div class="nav"><button class="btn btn-secondary sm" data-nav="-1" ${cur.step === 0 ? "disabled" : ""}>Back</button><button class="btn btn-primary sm" data-nav="1">${s.last ? "Start over" : "Next"}</button></div><span class="hint">${s.last ? "End of the flow." : "Or click the highlighted control."}</span></div>`;
    return;
  }
  const ctx = { cfg, bp, st: { ...(s.st || {}), cart: ["cart", "pay"].includes(s.screen) ? (s.st && s.st.kind === "camp" ? 2 : 1) : 0 }, who: s.actor === "reviewer" ? "Priya Raman" : s.actor === "coord" ? "Dana Whitfield" : s.actor === "desk" ? "Sam Ortega" : "Ana Ruiz" };
  const r = S.render(s.screen, ctx);
  fr.innerHTML = r.html; fr.scrollTop = 0;
  ctx.mark = () => { fr.querySelectorAll(".is-hot").forEach(e => e.classList.remove("is-hot")); const h = s.hot && fr.querySelector(`[data-hot="${s.hot}"]`); if (h) h.classList.add("is-hot"); };
  if (r.after) r.after(fr, ctx);
  ctx.mark();
  fit();
  const checks = [...new Set(s.reqs.flatMap(c => (O.REQ.find(r => r.code === c) || { checks: [] }).checks))];
  const actor = s.actor === "system" ? "System" : B.userName(s.actor);
  $("#bcap").innerHTML = `<div><span class="over">Step ${cur.step + 1} of ${f.steps.length} · ${esc(actor)} · ${B.SURFACE_NAME[s.surface]} · ${esc(S.NAMES[s.screen] || s.screen)}</span><h3>${esc(s.title)}</h3><p>${esc(s.action)}</p>
    <div class="meta">${s.reqs.map(c => { const q = O.REQ.find(r => r.code === c); return `<button type="button" class="rq" data-oreq="${q.id}" title="${esc(q.n)}">${c}</button>`; }).join("")}${checks.map(c => `<span class="tag" title="${esc((O.CHECKS.find(x => x[0] === c) || [])[2])}">${c} ${esc((O.CHECKS.find(x => x[0] === c) || [])[1])}</span>`).join("")}</div>${(O.DOMAIN.screens[s.screen] || []).length ? `<div class="meta"><span class="t-small faint">Shows</span>${O.DOMAIN.screens[s.screen].map(id => `<button type="button" class="rq" data-oobj="${id}">${esc(O.DOMAIN.objects.find(o => o.id === id).n)}</button>`).join("")}</div>` : ""}</div>
    <div style="display:grid;gap:8px;justify-items:end"><div class="nav"><button class="btn btn-secondary sm" data-nav="-1" ${cur.step === 0 ? "disabled" : ""}>Back</button><button class="btn btn-primary sm" data-nav="1">${s.last ? "Start over" : "Next"}</button></div><span class="hint">${s.last ? "End of the flow." : "Or click the highlighted control."}</span></div>`;
}
function go(d) { const [f, s] = curFS(); if (!f) return; if (s.last && d > 0) cur.step = 0; else cur.step += d; renderPlayer(); }

function rebuild(keepFlow = true) {
  if (mode === "preset") { bp = B.derive(cfg); save(); }
  if (!keepFlow || !flows().some(f => f.id === cur.flow)) cur = { flow: flows()[0] ? flows()[0].id : null, step: 0 };
  renderCfg(); renderSum(); renderPlayer(); renderOut();
}

/* ================= open mode: ask Claude ================= */
const ERR = { not_granted: "Claude isn't allowed for this page, so I used the closest preset instead.", sampling_disabled: "Claude isn't available on this account, so I used the closest preset instead.", rate_limited: "Too many requests right now. Wait a minute and try again.", session_expired: "Sign in again to design from a prompt.", refused: "Claude declined that prompt. Try describing the service differently.", invalid_json: "The design came back incomplete. Try again, or ask for something a little smaller.", empty_completion: "Nothing came back. Try a shorter prompt.", prompt_too_large: "That prompt is too long. Shorten it and try again." };
function progress(on, text) { const p = $("#bprog"); p.hidden = !on; if (on) p.innerHTML = `<span class="bspin" aria-hidden="true"></span><span>${esc(text)}</span>`; $("#bstop").hidden = !on; $("#bgo").disabled = on; $("#bchange").disabled = on; }
async function design(change) {
  const text = $("#bdesc").value.trim(); if (!text || busy) return;
  if (!sample) { const r = B.resolve(text); mode = "preset"; cfg = r.cfg; notes = ["Open design needs Claude, which isn't available here. Built the closest preset instead.", ...r.notes]; rebuild(false); return; }
  busy = true; ctl = new AbortController(); notes = [];
  progress(true, change ? "Applying your change…" : "Designing your product… this usually takes 20–60 seconds.");
  let seen = 0;
  try {
    const raw = await sample.json(X.buildPrompt(text, change ? spec : null), { signal: ctl.signal, cache: false, onText: ({ text: t }) => {
      const flowsN = (t.match(/"steps"\s*:/g) || []).length, screensN = (t.match(/"kind"\s*:/g) || []).length;
      if (screensN !== seen) { seen = screensN; progress(true, `Drafting… ${flowsN} flow${flowsN === 1 ? "" : "s"}, ${screensN} screen${screensN === 1 ? "" : "s"} so far`); }
    } });
    spec = X.normalize(raw); mode = "open"; saveSpec();
    notes = [change ? "Change applied." : `Designed ${spec.flows.length} flows and ${spec.flows.reduce((n, f) => n + f.steps.length, 0)} screens from your prompt.`];
    rebuild(false);
  } catch (e) {
    const code = e && e.code;
    if (code === "cancelled") notes = ["Stopped."];
    else if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") { sample = null; const r = B.resolve(text); mode = "preset"; cfg = r.cfg; notes = [ERR[code] || ERR.not_granted, ...r.notes]; rebuild(false); }
    else notes = [ERR[code] || (e && e.message && !code ? "The design couldn't be read. Try again." : "Something went wrong reaching Claude. Try again.")];
    renderCfg();
  } finally { busy = false; ctl = null; progress(false); }
}

function bind() {
  root.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#bframe")) { const h = t.closest(".is-hot"); if (h) { e.preventDefault(); e.stopPropagation(); go(1); } return; }
    const pp = t.closest("[data-pp]"); if (pp) { $("#bdesc").value = PROMPTS[+pp.dataset.pp][1]; design(false); return; }
    if (t.closest("#bgo")) { design(false); return; }
    if (t.closest("#bchange")) { design(true); return; }
    if (t.closest("#bstop")) { ctl && ctl.abort(); return; }
    if (t.closest("#bpreset")) { mode = "preset"; notes = []; rebuild(false); return; }
    const oa = t.closest("[data-oacc]"); if (oa && spec) { spec.accent = oa.dataset.oacc; saveSpec(); rebuild(); return; }
    const pr = t.closest("[data-preset]"); if (pr) { mode = "preset"; cfg = B.configFor(pr.dataset.preset); notes = [`Switched to ${B.PRESETS[pr.dataset.preset].name}.`]; rebuild(false); return; }
    const ac = t.closest("[data-acc]"); if (ac) { cfg.accent = ac.dataset.acc; rebuild(); return; }
    const u = t.closest("[data-user]"); if (u) { const id = u.dataset.user; cfg.users.has(id) ? cfg.users.delete(id) : cfg.users.add(id); notes = []; rebuild(); return; }
    const c = t.closest("[data-cap]"); if (c) { notes = B.toggleCap(cfg, c.dataset.cap, !cfg.caps.has(c.dataset.cap)); rebuild(); return; }
    const a = t.closest("[data-addcap]"); if (a) { notes = B.toggleCap(cfg, a.dataset.addcap, true); notes.unshift(`Turned on ${B.capName(a.dataset.addcap)}.`); rebuild(); return; }
    const fl = t.closest("[data-flow]"); if (fl) { cur = { flow: fl.dataset.flow, step: 0 }; renderPlayer(); return; }
    const st = t.closest("[data-step]"); if (st) { cur.step = +st.dataset.step; renderPlayer(); return; }
    const nv = t.closest("[data-nav]"); if (nv) { go(+nv.dataset.nav); return; }
    if (t.closest("#bcopy")) { const m = $("#bcopymsg"); try { navigator.clipboard.writeText($("#bspec").textContent).then(() => { m.textContent = "Copied"; }, () => { m.textContent = "Couldn't copy. Select the text instead."; }); } catch (er) { m.textContent = "Couldn't copy. Select the text instead."; } }
  }, true);
  $("#bdesc").addEventListener("keydown", e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); design(false); } });
  $("#bname").addEventListener("change", e => { cfg.name = e.target.value.trim() || cfg.name; rebuild(); });
  $("#bagency").addEventListener("change", e => { cfg.agency = e.target.value.trim() || cfg.agency; rebuild(); });
  new ResizeObserver(fit).observe($("#bstage"));
}

G.KZB_APP = {
  mount(el) {
    root = el; cfg = load(); spec = loadSpec(); if (spec) mode = "open";
    shell(); bind(); rebuild(false);
    if (G.claude && G.claude.use) G.claude.use("sample").then(s => { sample = s; if (s) { $("#bgo").textContent = "Design it"; renderCfg(); } else $("#bgo").textContent = "Build closest preset"; }).catch(() => { sample = null; });
    else $("#bgo").textContent = "Build closest preset";
  },
  mounted: () => !!root,
  build(cap, reqId) {
    mode = "preset";
    const r = reqId && O.REQ.find(x => x.id === reqId);
    if (cap && cap !== "core") notes = B.toggleCap(cfg, cap, true); else notes = [];
    if (r) r.users.forEach(u => cfg.users.add(u));
    notes.unshift(r ? `Built a product that meets ${r.code}.` : `Turned on ${B.capName(cap)}.`);
    rebuild();
    const f = bp.flows.find(x => (r ? x.steps.some(s => s.reqs.includes(r.code)) : x.cap === cap)) || bp.flows[0];
    if (f) { cur = { flow: f.id, step: r ? Math.max(0, f.steps.findIndex(s => s.reqs.includes(r.code))) : 0 }; renderPlayer(); }
    root.querySelector(".bplay").scrollIntoView({ block: "start" });
  },
  redraw: () => fit(),
  /* test hook: load a spec object as if Claude returned it */
  _loadSpec(raw) { spec = X.normalize(raw); mode = "open"; saveSpec(); notes = ["Loaded a spec."]; rebuild(false); }
};
})(window);
