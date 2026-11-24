/* Page wiring: hash views (#components / #ontology) and the ontology page sections. */
(function (G) {
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let OM = null;

function renderOntologyPage() {
  const O = G.KZO, D = O.build(), CL = new Map(O.CLASSES.map(c => [c.id, c]));
  const reqs = O.REQ, stated = reqs.filter(r => r.status === "stated").length;
  $("#ometrics").innerHTML = [[O.USERS.length, "users"], [Object.keys(O.NEEDS).length, "needs"], [reqs.length, "requirements"], [stated, "seen in public"], [O.BLOCKS.length, "platform blocks"], [O.GAPS.length, "open questions"]].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join("");
  const dot = (c, st) => `<i class="od ${st === "modeled" ? "hollow" : ""} ${c === "Gap" ? "tri" : ""} ${c === "Block" || c === "Pattern" ? "sq" : ""}" style="--c:var(${CL.get(c).col})"></i>`;
  $("#olegend").hidden = !!G.d3; $("#olegend").innerHTML = O.CLASSES.filter(c => c.id !== "Stage").map(c => `<span>${dot(c.id)}${esc(c.plural)}</span>`).join("") + `<span>${dot("Requirement", "modeled")}Modeled (not public)</span>`;

  const out = D.out;
  $("#ousers").innerHTML = O.USERS.map(u => {
    const needs = (out.get("u-" + u.id) || []).filter(l => l.r === "needs").map(l => D.byId.get(l.t));
    const frus = (out.get("u-" + u.id) || []).filter(l => l.r === "experiences").map(l => D.byId.get(l.t));
    const rs = reqs.filter(r => r.users.includes(u.id));
    return `<article class="ucard"><span class="ochip">${dot("User")}${u.primary ? "Primary user" : "User"}</span><h3>${esc(u.n)}</h3><p class="t-small muted" style="margin:0">${esc(u.doc)}</p><span class="surf">${esc(u.surface)}</span>
      <ul>${needs.map(n => `<li>${dot("Need")}${esc(n.n)}</li>`).join("")}${frus.map(f => `<li>${dot("Frustration", f.status)}${esc(f.n)}</li>`).join("")}</ul>
      <div>${rs.map(r => `<button type="button" class="rq" data-oreq="${r.id}" title="${esc(r.n)}">${r.code}</button>`).join("")}</div></article>`;
  }).join("");

  $("#oblocks").innerHTML = `<thead><tr><th>Block</th><th>What it does</th><th>Requirements</th><th>Live in</th></tr></thead><tbody>${O.BLOCKS.map(b => {
    const rs = reqs.filter(r => r.blocks.includes(b.id)), ev = [...new Set(rs.flatMap(r => r.evidence))].map(id => O.EVIDENCE.find(e => e.id === id).n);
    return `<tr><td>${dot("Block", b.status)} ${esc(b.n)}</td><td class="muted">${esc(b.doc)}</td><td>${rs.map(r => `<button type="button" class="rq" data-oreq="${r.id}" title="${esc(r.n)}">${r.code}</button>`).join("")}</td><td class="t-small muted">${ev.map(esc).join(" · ") || "Not yet seen in public"}</td></tr>`;
  }).join("")}</tbody>`;

  const ASK = ["How do you verify residency today, and where does it break?", "What should the gate do when the signal drops: trust the pass, or hold the line?", "Who owns refund rules: each agency, or the platform with agency overrides?", "Do residents see the transaction fee as a line item, and how do agencies decide?", "Which platform blocks can carry over into classified environments?", "How does a resident ask for an accommodation, and who sees that request?"];
  $("#oqs").innerHTML = O.GAPS.map((g, i) => `<div class="qcard"><span class="ochip">${dot("Gap")}Q${i + 1} · ${g[2].map(k => "R" + String(k).padStart(2, "0")).join(", ")}</span><b>${esc(g[0])}</b><p>${esc(g[1])}</p><p class="ask">Ask: “${esc(ASK[i])}”</p></div>`).join("");

  const srcs = [["Kaizen site", O.SRC.site], ["Maryland day-use app", O.SRC.mdApp], ["Maryland DNR, 2025", O.SRC.md], ["Maryland DNR, 2026", O.SRC.md26], ["Pima County app", O.SRC.pimaApp], ["Pima County launch, 2024", O.SRC.pima], ["Colorado SIPA partner listing", O.SRC.co], ["DoW: C-UAS Marketplace", O.SRC.dow], ["DefenseScoop: C-UAS contract", O.SRC.cuas], ["DefenseScoop: Army agreement", O.SRC.army], ["Business Wire: VA.gov", O.SRC.va], ["Potomac Officers Club: Taproot", O.SRC.taproot]];
  $("#osrc").innerHTML = srcs.map(([t, u]) => `<a class="link-ext" href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join("");

  const json = JSON.stringify({ goal: O.GOAL.n, users: O.USERS.map(u => ({ id: u.id, name: u.n, surface: u.surface })), needs: O.NEEDS, frustrations: Object.fromEntries(Object.entries(O.FRUS).map(([k, f]) => [k, f[0]])), stages: O.STAGES.map(s => s.n), blocks: O.BLOCKS.map(b => b.n), requirements: reqs.map(r => ({ code: r.code, name: r.n, status: r.status, users: r.users, needs: r.needs, stages: r.stages, blocks: r.blocks, patterns: r.patterns, checks: r.checks, capability: r.cap })), openQuestions: O.GAPS.map(g => g[0]) }, null, 2);
  $("#ojson").textContent = json;
  $("#ocopy").onclick = () => { const m = $("#ocopymsg"); try { navigator.clipboard.writeText(json).then(() => { m.textContent = "Copied"; }, () => { m.textContent = "Couldn't copy. Select the text instead."; }); } catch (e) { m.textContent = "Couldn't copy. Select the text instead."; } };

}
let pendingSel = null;
let pendingObj = null;
document.addEventListener("click", e => {
  const ob = e.target.closest("[data-oobj]");
  if (ob) { if (location.hash !== "#ontology") { pendingObj = ob.dataset.oobj; location.hash = "ontology"; } else if (OM) { OM.selectObj(ob.dataset.oobj); $("#omroot").scrollIntoView({ behavior: "smooth", block: "start" }); } return; }
  const b = e.target.closest("[data-oreq]"); if (!b) return;
  if (location.hash !== "#ontology") { pendingSel = b.dataset.oreq; location.hash = "ontology"; return; }
  OM && OM.select(b.dataset.oreq); $("#omroot").scrollIntoView({ behavior: "smooth", block: "start" });
});

function show() {
  const h = location.hash, view = h === "#ontology" ? "ontology" : h === "#builder" ? "builder" : "components";
  $("#v-ontology").hidden = view !== "ontology"; $("#v-builder").hidden = view !== "builder"; $("#v-components").hidden = view !== "components";
  document.querySelectorAll("[data-view]").forEach(a => a.dataset.view === view ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  if (view === "ontology") {
    if (!OM) { renderOntologyPage(); OM = G.KZO.mount($("#omroot"), { onGo: id => { location.hash = id; }, onBuild: (cap, req) => { pendingBuild = [cap, req]; location.hash = "builder"; } }); }
    else OM.redraw();
    G.scrollTo(0, 0);
    if (pendingObj) { const id = pendingObj; pendingObj = null; requestAnimationFrame(() => { OM.selectObj(id); $("#omroot").scrollIntoView({ block: "start" }); }); }
    if (pendingSel) { const id = pendingSel; pendingSel = null; requestAnimationFrame(() => { OM.select(id); $("#omroot").scrollIntoView({ block: "start" }); }); }
  } else if (view === "builder") {
    if (!G.KZB_APP.mounted()) G.KZB_APP.mount($("#broot")); else G.KZB_APP.redraw();
    G.scrollTo(0, 0);
    if (pendingBuild) { const [c, r] = pendingBuild; pendingBuild = null; requestAnimationFrame(() => G.KZB_APP.build(c, r)); }
  } else if (h === "#components") G.scrollTo(0, 0);
}
let pendingBuild = null;
G.addEventListener("hashchange", show);
document.addEventListener("DOMContentLoaded", show);
})(window);
