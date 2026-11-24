/* Kaizen Product Builder · open.js — design from any prompt.
   The page asks Claude (the `sample` capability, on the viewer's own account) for a product spec in a
   fixed JSON shape, grounded in the Kaizen ontology. This file builds that prompt, cleans the reply, and
   renders every screen of the spec with Civic Services Kit components. All text from the spec is
   escaped before it joins the page. Exposes window.KZOPEN. */
(function (G) {
"use strict";
const O = G.KZO;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const I = (n, c = "") => G.CSK.icon(n, c);
const str = (v, max = 160) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const arr = (v, max = 12) => Array.isArray(v) ? v.slice(0, max) : [];
const TONES = new Set(["ok", "warn", "bad", "neutral"]);
const tone = t => TONES.has(t) ? t : "neutral";
const KINDS = ["home", "list", "detail", "form", "table", "dialog", "map", "confirm", "message", "scan", "schedule"];
const SURF = new Set(["public", "console", "mobile"]);

/* ---------- the prompt ---------- */
const SCHEMA = `type Spec = {
  name: string;            // product name, 2-5 words
  agency: string;          // fictional agency or org that runs it
  tagline: string;         // one sentence: what it does for whom
  accent: string;          // a calm hex color for the agency brand, e.g. "#0D5370"
  users: { id: string; name: string; doc: string; needs: string[] }[];          // 2-5 people
  surfaces: { id: string; name: string; kind: "public"|"console"|"mobile"; nav: string[] }[];  // 1-3
  objects: { id: string; name: string; fields: string[]; states?: string[]; matches?: string }[]; // 3-8 domain objects
  requirements: { id: string; name: string; users: string[]; matches?: string }[]; // 5-12, ids "G01".."G12"
  flows: { id: string; name: string; user: string; steps: Step[] }[];             // 2-4 flows, 3-6 steps each
  questions: string[];     // 2-4 open questions a designer should ask the team
};
type Step = { title: string; actor: string /* a user id or "system" */; surface: string /* a surface id */;
  action: string /* one sentence: what happens */; reqs: string[] /* requirement ids */; objects: string[] /* object ids */;
  screen: Screen; hot: string /* EXACT text of the control to click next on this screen; "" on the last step */ };
type Screen =
  | { kind: "home"; title: string; subtitle: string; cards: { title: string; text: string; cta: string }[] }
  | { kind: "list"; title: string; search: string; filters: string[]; count: string; items: { title: string; meta: string; status: string; tone: Tone; cta?: string }[] }
  | { kind: "detail"; title: string; status: string; tone: Tone; fields: [string, string][]; text: string; actions: string[] }
  | { kind: "form"; title: string; steps: string[]; stepIndex: number; fields: { label: string; value: string; help?: string; error?: boolean }[]; note?: string; primary: string; secondary?: string }
  | { kind: "table"; title: string; stats: { label: string; value: string; note?: string }[]; alert?: { title: string; text: string; tone: Tone; action?: string }; columns: string[]; rows: { cells: string[]; status: string; tone: Tone; action?: string }[] }
  | { kind: "dialog"; behind: string; title: string; subtitle: string; summary: { title: string; status: string; tone: Tone; price?: string }; rows: { label: string; meta: string; status: string; tone: Tone; action: string }[] }
  | { kind: "map"; title: string; places: { name: string; meta: string; status: string; tone: Tone }[]; cta: string }
  | { kind: "confirm"; title: string; status: string; details: [string, string][]; notes: string[]; primary: string; secondary?: string }
  | { kind: "message"; from: string; messages: string[]; action: string }
  | { kind: "scan"; title: string; result: string; tone: Tone; lines: string[]; action: string }
  | { kind: "schedule"; title: string; date: string; resources: { name: string; meta: string; price: string; booked: [number, number][] }[]; select: [number, number]; action: string };
type Tone = "ok" | "warn" | "bad" | "neutral";`;

function ontologyBrief() {
  const reqs = O.REQ.map(r => `${r.code} ${r.n}`).join("\n");
  const objs = O.DOMAIN.objects.map(o => `${o.id}: ${o.n}`).join(", ");
  const checks = O.CHECKS.map(c => `${c[0]} ${c[1]}`).join("; ");
  return `Kaizen ontology (reuse when the meaning truly matches):
Requirements:\n${reqs}
Domain objects: ${objs}
Design checks every screen follows: ${checks}`;
}

O.OPEN_SCHEMA = SCHEMA;
function buildPrompt(brief, previous) {
  const intro = `You are a senior product designer at Kaizen, a company that builds government services (parks and recreation, permits, licensing, benefits, defense procurement) on one shared platform. Design a complete product from the brief below.`;
  const rules = `Rules:
- Reply with ONLY one JSON object of type Spec. No prose, no Markdown.
- Plain language a resident would use. Realistic, clearly fictional sample data: invented agency, people and places; prices with their unit ("$25.00 per session").
- Every step's screen uses one of these kinds: ${KINDS.join(", ")}. Pick the kind that fits the moment; a staff step usually uses "table", "detail" or "dialog"; a text alert uses "message"; checking something at a door or gate uses "scan"; booking by time uses "schedule" (hours 6-21).
- "hot" must exactly equal one button or row action text on that step's screen, so the viewer can click through. On the last step of a flow, hot is "".
- Status words always pair with a tone. Closed or unavailable states say when they reopen.
- Set "matches" on a requirement to a Kaizen requirement code (e.g. "R14") only when it means the same thing; on an object, to a domain object id (e.g. "session") only when it is the same thing.
- Keep it tight: 2-4 flows, 3-6 steps each, at most 6 rows or items per screen.`;
  const base = `${intro}\n\n${rules}\n\n${ontologyBrief()}\n\nJSON shape (TypeScript):\n${SCHEMA}`;
  if (previous) return `${base}\n\nHere is the current product spec:\n${JSON.stringify(previous)}\n\nApply this change and return the FULL updated Spec JSON:\n${brief}`;
  return `${base}\n\nBrief:\n${brief}`;
}

/* ---------- clean the reply into a safe, renderable spec ---------- */
function normalize(raw) {
  if (!raw || typeof raw !== "object") throw new Error("No spec");
  const reqCodes = new Set(O.REQ.map(r => r.code)), objIds = new Set(O.DOMAIN.objects.map(o => o.id));
  const sp = {
    name: str(raw.name, 60) || "Untitled product", agency: str(raw.agency, 60) || "Sample agency", tagline: str(raw.tagline, 200),
    accent: /^#[0-9a-f]{6}$/i.test(raw.accent || "") ? raw.accent : "#0D5370",
    users: arr(raw.users, 6).map((u, i) => ({ id: str(u.id, 24) || "u" + i, name: str(u.name, 40) || "User", doc: str(u.doc, 160), needs: arr(u.needs, 5).map(n => str(n, 100)) })),
    surfaces: arr(raw.surfaces, 4).map((s, i) => ({ id: str(s.id, 24) || "s" + i, name: str(s.name, 40) || "Surface", kind: SURF.has(s.kind) ? s.kind : "public", nav: arr(s.nav, 7).map(n => str(n, 24)) })),
    objects: arr(raw.objects, 10).map((o, i) => ({ id: str(o.id, 24) || "o" + i, name: str(o.name, 40), fields: arr(o.fields, 8).map(f => str(f, 30)), states: arr(o.states, 7).map(f => str(f, 30)), matches: objIds.has(o.matches) ? o.matches : null })),
    requirements: arr(raw.requirements, 14).map((r, i) => ({ id: str(r.id, 8) || "G" + String(i + 1).padStart(2, "0"), name: str(r.name, 120), users: arr(r.users, 6).map(u => str(u, 24)), matches: reqCodes.has(r.matches) ? r.matches : null })),
    flows: [], questions: arr(raw.questions, 5).map(q => str(q, 200))
  };
  if (!sp.surfaces.length) sp.surfaces = [{ id: "web", name: "Web", kind: "public", nav: ["Home"] }];
  const sIds = new Set(sp.surfaces.map(s => s.id));
  sp.flows = arr(raw.flows, 5).map((f, fi) => ({
    id: str(f.id, 24) || "f" + fi, name: str(f.name, 60) || "Flow " + (fi + 1), user: str(f.user, 24),
    steps: arr(f.steps, 8).map(s => ({
      title: str(s.title, 60) || "Step", actor: str(s.actor, 24) || "system", surface: sIds.has(s.surface) ? s.surface : sp.surfaces[0].id,
      action: str(s.action, 240), reqs: arr(s.reqs, 6).map(x => str(x, 8)), objects: arr(s.objects, 6).map(x => str(x, 24)),
      screen: s.screen && KINDS.includes(s.screen.kind) ? s.screen : { kind: "detail", title: str(s.title, 60), status: "", fields: [], text: str(s.action, 200), actions: [] },
      hot: str(s.hot, 60)
    })).filter(s => s.title)
  })).filter(f => f.steps.length);
  sp.flows.forEach(f => { f.steps[f.steps.length - 1].last = true; });
  if (!sp.flows.length) throw new Error("The spec had no flows");
  return sp;
}

/* ---------- generic screen renderer, built from kit components ---------- */
const seal = (a, s = 40) => { const ini = esc(String(a).split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join("") || "A"); return `<svg width="${s}" height="${s}" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20.5" fill="none" stroke="var(--accent)" stroke-width="2"/><circle cx="22" cy="22" r="16" fill="var(--accent)"/><text x="22" y="26.5" text-anchor="middle" font-family="var(--font)" font-size="12" font-weight="600" fill="var(--accent-ink)">${ini}</text></svg>`; };
const chip = (t, tn) => t ? `<span class="chip ${tone(tn)}">${esc(t)}</span>` : "";
const arrow = `<svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const scenes = ["forest", "lake", "desert", "field"], scene = s => scenes[[...String(s)].reduce((t, c) => t + c.charCodeAt(0), 0) % 4];
const btn = (label, cls = "btn-primary", extra = "") => label ? `<button class="btn ${cls}" data-lbl="${esc(label)}" ${extra}>${esc(label)}</button>` : "";

function shell(sp, step, body) {
  const surf = sp.surfaces.find(s => s.id === step.surface) || sp.surfaces[0], scr = step.screen || {};
  const active = surf.nav.find(n => String(scr.title || "").toLowerCase().includes(n.toLowerCase())) || surf.nav[0];
  if (surf.kind === "mobile") return `<div class="pf-phwrap"><div class="pf-phone ${scr.kind === "scan" ? "dark" : ""}"><div class="pf-notch"><span>9:41</span><span>●●● ▮</span></div>${body}</div></div>`;
  if (surf.kind === "console") return `<div class="pf-staff"><aside class="pf-side"><div class="pf-side-h">${seal(sp.agency, 30)}<span><b>${esc(sp.agency)}</b><small>${esc(surf.name)}</small></span></div><nav>${surf.nav.map(n => `<a class="${n === active ? "on" : ""}">${I("list", "sm")}${esc(n)}</a>`).join("")}</nav><div class="pf-side-f">${I("person", "sm")}<span>${esc((sp.users.find(u => u.id === step.actor) || {}).name || "Staff")}</span></div></aside><main class="pf-smain"><header class="pf-stop"><h1>${esc(scr.title || step.title)}</h1></header><div class="pf-sbody">${body}</div></main></div>`;
  return `<header class="pf-bar"><button class="ibtn" aria-label="Menu">${I("menu")}</button><span class="pf-agency">${esc(sp.agency)}</span><nav class="pf-nav">${surf.nav.map(n => `<a class="${n === active ? "on" : ""}">${esc(n)}</a>`).join("")}</nav><button class="ibtn" aria-label="Account">${I("person")}</button><button class="ibtn" aria-label="Cart">${I("cart")}</button></header>${body}`;
}
const wrapPub = (sp, step, inner) => (sp.surfaces.find(s => s.id === step.surface) || {}).kind === "console" ? inner : `<div class="pf-wrap pf-pad">${inner}</div>`;

const R = {};
R.home = (sc, sp, st) => wrapPub(sp, st, `<div class="pf-hero">${seal(sp.agency, 60)}<h1 class="pf-h1 big">${esc(sc.title || sp.name)}</h1><p class="muted">${esc(sc.subtitle || sp.tagline)}</p></div><div class="cards pf-svc">${arr(sc.cards, 3).map(c => `<div class="cta-card"><div class="ph" data-scene="${scene(c.title)}"></div><div class="body"><h3>${esc(c.title)}</h3><p class="muted">${esc(c.text)}</p>${btn(c.cta, "btn-primary block")}</div></div>`).join("")}</div>`);
R.list = (sc, sp, st) => `${(sp.surfaces.find(s => s.id === st.surface) || {}).kind === "console" ? "" : `<section class="pf-band"><div class="pf-wrap"><h1 class="pf-h1">${esc(sc.title)}</h1>`}<div class="filters" style="${(sp.surfaces.find(s => s.id === st.surface) || {}).kind === "console" ? "" : "margin-top:16px"}"><div class="input short" style="width:260px">${I("search")}<span class="faint">${esc(sc.search || "Search")}</span></div>${arr(sc.filters, 5).map(f => `<button class="fbtn">${I("filter")} ${esc(f)}</button>`).join("")}</div>${(sp.surfaces.find(s => s.id === st.surface) || {}).kind === "console" ? "" : `</div></section>`}
  ${wrapPub(sp, st, `<p class="t-small" style="margin:0 0 12px">${esc(sc.count || "")}</p><div class="pf-rows">${arr(sc.items, 6).map(it => `<div class="pf-row" data-lbl="${esc(it.title)}"><div class="ph" data-scene="${scene(it.title)}" style="width:72px;border-radius:10px"></div><div class="pf-row-m"><b>${esc(it.title)}</b><span class="faint t-small">${esc(it.meta)}</span><div class="pf-wins">${chip(it.status, it.tone)}</div></div><div class="pf-row-r">${it.cta ? btn(it.cta, tone(it.tone) === "bad" ? "" : "btn-primary", tone(it.tone) === "bad" ? "disabled" : "") : ""}</div></div>`).join("")}</div>`)}`;
R.detail = (sc, sp, st) => wrapPub(sp, st, `<div class="pf-2col" style="align-items:start"><div style="display:grid;gap:14px">${chip(sc.status, sc.tone)}<h1 class="pf-h1">${esc(sc.title)}</h1><p class="muted" style="margin:0">${esc(sc.text)}</p><div style="display:flex;gap:10px;flex-wrap:wrap">${arr(sc.actions, 4).map((a, i) => btn(a, i ? "btn-secondary" : "btn-primary")).join("")}</div></div><div class="spec" style="margin:0"><div class="spec-b col" style="gap:10px">${arr(sc.fields, 8).map(f => `<div style="display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid var(--line);padding-bottom:8px"><span class="muted">${esc((f || [])[0])}</span><span>${esc((f || [])[1])}</span></div>`).join("")}</div></div></div>`);
R.form = (sc, sp, st) => wrapPub(sp, st, `<div style="max-width:860px">${arr(sc.steps, 6).length ? `<ol class="steps">${arr(sc.steps, 6).map((n, i) => `<li class="${i < (sc.stepIndex | 0) ? "done" : i === (sc.stepIndex | 0) ? "now" : ""}">${esc(n)}</li>`).join("")}</ol>` : ""}<h1 class="pf-h1" style="margin:20px 0 14px">${esc(sc.title)}</h1><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${arr(sc.fields, 8).map(f => `<div class="field ${f.error ? "err" : ""}"><label>${esc(f.label)}</label><div class="input"><span>${esc(f.value)}</span></div>${f.help ? `<span class="help">${esc(f.help)}</span>` : ""}</div>`).join("")}</div>${sc.note ? `<div class="alert info" style="margin-top:14px">${I("info")}<div>${esc(sc.note)}</div></div>` : ""}<div style="display:flex;gap:10px;margin-top:16px">${btn(sc.primary, "btn-primary lg")}${btn(sc.secondary, "btn-ghost")}</div></div>`);
R.table = (sc, sp, st) => wrapPub(sp, st, `${sc.alert ? `<div class="alert ${tone(sc.alert.tone) === "bad" ? "bad" : tone(sc.alert.tone) === "warn" ? "warn" : "info"}">${I("warn")}<div style="flex:1"><b>${esc(sc.alert.title)}</b>${esc(sc.alert.text)}</div>${btn(sc.alert.action, "btn-primary sm")}</div>` : ""}${arr(sc.stats, 4).length ? `<div class="cards" style="grid-template-columns:repeat(${Math.max(1, arr(sc.stats, 4).length)},1fr)">${arr(sc.stats, 4).map(s => `<div class="stat"><span class="over">${esc(s.label)}</span><b>${esc(s.value)}</b>${s.note ? `<span class="faint t-small">${esc(s.note)}</span>` : ""}</div>`).join("")}</div>` : ""}
  <div class="spec" style="margin:0"><table class="table" style="min-width:0"><thead><tr>${arr(sc.columns, 6).map(c => `<th>${esc(c)}</th>`).join("")}<th>Status</th><th></th></tr></thead><tbody>${arr(sc.rows, 7).map(r => `<tr>${arr(r.cells, 6).map(c => `<td>${esc(c)}</td>`).join("")}<td>${chip(r.status, r.tone)}</td><td>${r.action ? btn(r.action, "btn-secondary sm") : ""}</td></tr>`).join("")}</tbody></table></div>`);
R.dialog = (sc, sp, st) => `<div class="pf-under"><div class="pf-wrap pf-pad" style="opacity:.6"><h1 class="pf-h1">${esc(sc.behind || "")}</h1><div class="cards" style="grid-template-columns:repeat(4,1fr);margin-top:16px">${[1, 2, 3, 4].map(i => `<div class="tile"><div class="ph" data-scene="${scenes[i % 4]}"></div><span class="skel" style="height:14px;width:70%"></span></div>`).join("")}</div></div></div>
  <div class="pf-scrim"><div class="dialog"><div class="dh"><div><h3>${esc(sc.title)}</h3><p>${esc(sc.subtitle)}</p></div><button class="ibtn boxed">${I("close", "sm")}</button></div><div class="db">${sc.summary ? `<div class="summary"><div class="ph" data-scene="${scene(sc.summary.title)}"></div><div class="mid">${chip(sc.summary.status, sc.summary.tone)}<b>${esc(sc.summary.title)}</b></div>${sc.summary.price ? `<div class="price"><b>${esc(sc.summary.price)}</b></div>` : ""}</div>` : ""}
  <div class="acc"><div class="acc-b"><table class="sessions"><tbody>${arr(sc.rows, 5).map(r => `<tr><td><b style="font-weight:500">${esc(r.label)}</b><br><span class="faint t-small">${esc(r.meta)}</span></td><td>${chip(r.status, r.tone)}</td><td style="text-align:right">${btn(r.action, tone(r.tone) === "bad" ? "btn-secondary sm" : "btn-primary sm")}</td></tr>`).join("")}</tbody></table></div></div></div></div></div>`;
R.map = (sc, sp, st) => wrapPub(sp, st, `<h1 class="pf-h1" style="margin-bottom:14px">${esc(sc.title)}</h1><div class="spec" style="margin:0"><div class="mapwrap" style="height:520px"><div class="maplist"><div class="mh"><div class="input short">${I("search")}<span class="faint">Search</span></div></div><div class="items">${arr(sc.places, 7).map(p => `<button class="it" data-lbl="${esc(p.name)}"><div class="ph" data-scene="${scene(p.name)}"></div><span><b>${esc(p.name)}</b><span class="sub">${esc(p.meta)}</span>${chip(p.status, p.tone)}</span></button>`).join("")}</div></div><div class="map big" data-omap></div></div></div><div style="margin-top:12px">${btn(sc.cta)}</div>`);
R.confirm = (sc, sp, st) => wrapPub(sp, st, `<div class="pf-2col" style="align-items:start"><div style="display:grid;gap:14px">${chip(sc.status || "Confirmed", "ok")}<h1 class="pf-h1">${esc(sc.title)}</h1><div class="pass" style="max-width:none"><dl>${arr(sc.details, 6).map(d => `<dt>${esc((d || [])[0])}</dt><dd>${esc((d || [])[1])}</dd>`).join("")}</dl><canvas class="qr" aria-label="Sample code"></canvas></div><div style="display:flex;gap:10px">${btn(sc.primary, "btn-secondary")}${btn(sc.secondary, "btn-ghost")}</div></div><div class="spec" style="margin:0"><div class="spec-h"><b>What to know</b></div><div class="spec-b col" style="gap:10px">${arr(sc.notes, 5).map(n => `<div style="display:flex;gap:10px">${I("check", "sm")}<span>${esc(n)}</span></div>`).join("")}</div></div></div>`);
R.message = (sc) => `<div class="sms-h">${seal(sc.from || "A", 34)}<b>${esc(sc.from)}</b><small>Text message</small></div><div class="sms-body">${arr(sc.messages, 4).map(m => `<div class="bub">${esc(m)}</div>`).join("")}${btn(sc.action, "btn-primary block")}</div>`;
R.scan = (sc) => `<div class="scan-h"><b>${esc(sc.title)}</b></div><div class="scan-cam"><div class="scan-frame"></div><span>Point at the code</span></div><div class="scan-res"><div class="scan-ok" style="${tone(sc.tone) === "bad" ? "background:#FF9B92" : tone(sc.tone) === "warn" ? "background:#F0C56B" : ""}">${I(tone(sc.tone) === "ok" ? "check" : "warn")}</div><div><b style="${tone(sc.tone) === "bad" ? "color:#FF9B92" : tone(sc.tone) === "warn" ? "color:#F0C56B" : ""}">${esc(sc.result)}</b>${arr(sc.lines, 3).map(l => `<span>${esc(l)}</span>`).join("")}</div></div>${btn(sc.action, "btn-primary block lg")}`;
R.schedule = (sc, sp, st) => wrapPub(sp, st, `<h1 class="pf-h1" style="margin-bottom:14px">${esc(sc.title)}</h1><div data-osched></div>`);

function render(sp, step) {
  const sc = step.screen || {}, f = R[sc.kind] || R.detail;
  let body = "";
  try { body = f(sc, sp, step); } catch (e) { body = `<div class="pf-wrap pf-pad"><div class="empty"><b>This screen couldn't be drawn</b><span>${esc(step.title)}</span></div></div>`; }
  return shell(sp, step, body);
}
function after(el, sp, step, mark) {
  const sc = step.screen || {};
  el.querySelectorAll("canvas.qr").forEach(G.CSK.qr);
  const m = el.querySelector("[data-omap]");
  if (m) G.CSK.capacityMap(m, { lots: arr(sc.places, 5).map((p, i) => ({ n: str(p.name, 28), x: [180, 720, 850, 560, 380][i], y: [470, 230, 470, 430, 200][i], p: tone(p.tone) === "bad" ? 96 : tone(p.tone) === "warn" ? 78 : 30, cap: 100 })) });
  const sh = el.querySelector("[data-osched]");
  if (sh) {
    const rs = arr(sc.resources, 4).map(r => ({ n: str(r.name, 30), park: str(r.meta, 40), price: str(r.price, 20), rule: "", booked: arr(r.booked, 4).filter(b => Array.isArray(b)).map(b => [Number(b[0]) || 0, Number(b[1]) || 0]) }));
    const sel = Array.isArray(sc.select) ? sc.select : [11, 14], selKeys = []; for (let h = +sel[0]; h < +sel[1] && h < 22; h++) selKeys.push("0:" + h);
    if (rs.length) { G.CSK.timeline(sh, { venues: rs, sel: selKeys }); const b = sh.querySelector(".tl-bar .btn-primary"); if (b && sc.action) { b.textContent = str(sc.action, 30); b.dataset.lbl = str(sc.action, 30); } }
  }
  mark();
}
function markHot(el, hot) {
  el.querySelectorAll(".is-hot").forEach(e => e.classList.remove("is-hot"));
  if (!hot) return;
  const want = hot.toLowerCase().trim(), cands = [...el.querySelectorAll("[data-lbl]")];
  const hit = cands.find(c => c.dataset.lbl.toLowerCase().trim() === want) || cands.find(c => c.dataset.lbl.toLowerCase().includes(want) || want.includes(c.dataset.lbl.toLowerCase())) || cands.find(c => c.tagName === "BUTTON" && c.classList.contains("btn-primary") && !c.disabled);
  if (hit) hit.classList.add("is-hot");
}

/* ---------- Markdown spec ---------- */
function markdown(sp) {
  const L = [`# ${sp.name}`, ``, `**Agency:** ${sp.agency}  `, sp.tagline ? `**What it does:** ${sp.tagline}` : "", ``];
  L.push(`## People`); sp.users.forEach(u => L.push(`- **${u.name}**: ${u.doc}${u.needs.length ? ` Needs: ${u.needs.join("; ")}.` : ""}`)); L.push(``);
  L.push(`## Surfaces and navigation`); sp.surfaces.forEach(s => L.push(`- **${s.name}** (${s.kind}): ${s.nav.join(" · ")}`)); L.push(``);
  L.push(`## Objects`); sp.objects.forEach(o => L.push(`- **${o.name}**${o.matches ? ` (= Kaizen ${o.matches})` : ""}: ${o.fields.join(", ")}${o.states.length ? `. States: ${o.states.join(" → ")}` : ""}`)); L.push(``);
  L.push(`## Requirements`); sp.requirements.forEach(r => L.push(`- ${r.id} ${r.name}${r.matches ? ` (= ${r.matches})` : ""}`)); L.push(``);
  L.push(`## Flows`); sp.flows.forEach(f => { L.push(`### ${f.name}`); f.steps.forEach((s, i) => L.push(`${i + 1}. **${s.title}** (${(sp.users.find(u => u.id === s.actor) || { name: "System" }).name}, ${(sp.surfaces.find(x => x.id === s.surface) || {}).name}, ${s.screen.kind}): ${s.action}${s.reqs.length ? ` [${s.reqs.join(", ")}]` : ""}`)); L.push(``); });
  if (sp.questions.length) { L.push(`## Open questions`); sp.questions.forEach(q => L.push(`- ${q}`)); }
  return L.filter(x => x !== null).join("\n");
}
const KIT_OF = { home: "Service cards", list: "Search band, filter row & result rows", detail: "Detail page & status chip", form: "Form fields, steps & alerts", table: "Staff console table & stat tiles", dialog: "Register dialog", map: "Map & list", confirm: "Confirmation & pass", message: "Text message", scan: "Gate scanner", schedule: "Booking grid" };

G.KZOPEN = { buildPrompt, normalize, render, after, markHot, markdown, KIT_OF, esc };
})(window);
