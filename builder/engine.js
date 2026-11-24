/* Kaizen Product Builder · engine.js
   A product = agency + team + capabilities. Everything else is derived from the ontology (KZO):
   which requirements are in, which needs are met, the surfaces and their navigation, the platform
   blocks it runs on, the kit patterns still to design, the open questions, and the click-through flows.
   Pure data in, data out. Exposes window.KZB. */
(function (G) {
"use strict";
const O = G.KZO;
const B = G.KZB = {};

B.CAPS = [
  { id: "core", name: "Cart, account & confirmation", doc: "One household account, one cart, a clear confirmation.", core: true },
  { id: "dayuse", name: "Day-use reservations", doc: "Timed entry so busy parks don't have to close the gate." },
  { id: "gate", name: "Gate check-in", doc: "Scan passes on a phone at the gate, even offline.", deps: ["dayuse"] },
  { id: "rentals", name: "Facility rentals", doc: "Ramadas, fields and rooms by the hour." },
  { id: "programs", name: "Programs & camps", doc: "Classes, camps and sessions with age rules." },
  { id: "waitlist", name: "Waitlists", doc: "Freed spots go to the next family automatically.", deps: ["programs"] },
  { id: "map", name: "Facility map", doc: "A map that stays in sync with the list." },
  { id: "capacity", name: "Live capacity", doc: "Lot fill for staff, with an alert at 90%.", deps: ["dayuse"] },
  { id: "notify", name: "Text alerts", doc: "Confirmations and day-of changes by text." },
  { id: "counter", name: "Counter sales", doc: "Staff book walk-ins and take cash or card." },
  { id: "setup", name: "Self-serve settings", doc: "Admins change prices, seasons and rules." },
  { id: "reports", name: "Finance reports", doc: "Daily deposits and refunds that reconcile." },
  { id: "permits", name: "Permits & review", doc: "Applications that branch, with an in-app review queue." },
  { id: "market", name: "Procurement marketplace", doc: "Validated listings, comparison and acquisition requests." },
  { id: "i18n", name: "Spanish & accessibility", doc: "WCAG 2.1 AA, English and Spanish on every screen." },
  { id: "residency", name: "Resident pricing", doc: "A resident rate unlocked by a verified address." }
];
B.ACCENTS = [["#0D5370", "Platform teal"], ["#2F5D3A", "Forest"], ["#8A4B2A", "Canyon"], ["#1F3A68", "Federal navy"], ["#5B2A6E", "Plum"]];
B.PRESETS = {
  parks: { name: "State park system", blurb: "Timed day-use entry for parks that fill up on summer weekends.", agency: "Chesapeake State Parks", accent: "#0D5370", users: ["resident", "desk", "admin"], caps: ["dayuse", "gate", "map", "capacity", "notify", "i18n"] },
  county: { name: "County parks & recreation", blurb: "Programs, camps, ramadas and fields for a whole county.", agency: "Saguaro County Parks & Recreation", accent: "#2F5D3A", users: ["resident", "desk", "coord", "admin"], caps: ["rentals", "programs", "waitlist", "map", "counter", "setup", "reports", "residency", "i18n"] },
  city: { name: "City permits", blurb: "Special event permits with an in-app review queue.", agency: "City of Harbor Point", accent: "#1F3A68", users: ["resident", "reviewer", "admin"], caps: ["permits", "notify", "rentals", "reports", "i18n"] },
  market: { name: "Defense marketplace", blurb: "Buyers compare validated counter-drone products and request them.", agency: "C-UAS Marketplace (sample)", accent: "#1F3A68", users: ["buyer", "vendor", "admin"], caps: ["market", "notify"] }
};
B.capName = id => (B.CAPS.find(c => c.id === id) || {}).name || id;
B.userName = id => (O.USERS.find(u => u.id === id) || {}).n || id;

B.configFor = preset => { const P = B.PRESETS[preset]; return { preset, name: P.agency.replace(/ \(sample\)$/, "") + " online", agency: P.agency, accent: P.accent, users: new Set(P.users), caps: new Set(P.caps) }; };
B.toggleCap = (cfg, id, on) => {
  const notes = [];
  if (on) { cfg.caps.add(id); (B.CAPS.find(c => c.id === id).deps || []).forEach(d => { if (!cfg.caps.has(d)) { cfg.caps.add(d); notes.push(`${B.capName(id)} needs ${B.capName(d)}, so that's on too.`); } }); }
  else { cfg.caps.delete(id); B.CAPS.forEach(c => { if ((c.deps || []).includes(id) && cfg.caps.has(c.id)) { cfg.caps.delete(c.id); notes.push(`${B.capName(c.id)} needs ${B.capName(id)}, so that's off too.`); } }); }
  return notes;
};

/* Describe-it: a sentence → config. Starts from the closest preset and adds what the sentence names. */
B.resolve = text => {
  const p = " " + String(text).toLowerCase() + " ", has = (...w) => w.some(x => p.includes(x)), notes = [];
  const preset = has("drone", "c-uas", "cuas", "defense", "procure", "acquisition", "military", "dod") ? "market" : has("permit", "license", "special event", "application") ? "city" : has("county", "camp", "class", "program", "recreation", "ramada", "swim") ? "county" : "parks";
  const cfg = B.configFor(preset); notes.push(`Starting from ${B.PRESETS[preset].name}.`);
  [["desk", ["staff", "gate", "front desk", "ranger"]], ["coord", ["coordinator", "instructor"]], ["admin", ["admin", "finance", "director", "manager"]], ["reviewer", ["review", "approv"]], ["buyer", ["buyer", "warfighter", "acquisition", "unit"]], ["vendor", ["vendor", "supplier", "manufacturer"]], ["resident", ["resident", "family", "visitor", "public"]]]
    .forEach(([id, w]) => { if (has(...w) && !cfg.users.has(id)) { cfg.users.add(id); notes.push(`Added ${B.userName(id)}.`); } });
  [["dayuse", ["day-use", "day use", "timed entry", "entry"]], ["gate", ["gate", "scan", "check in", "check-in"]], ["rentals", ["ramada", "pavilion", "field", "rent", "shelter", "room"]], ["programs", ["camp", "class", "program", "swim", "lesson"]], ["waitlist", ["waitlist", "wait list", "sold out", "full"]], ["map", ["map", "near me", "nearby"]], ["capacity", ["capacity", "parking", "lot", "crowd"]], ["notify", ["text", "sms", "notify", "alert"]], ["counter", ["walk-in", "walk in", "counter", "cash"]], ["setup", ["price", "rules", "season", "settings", "fee"]], ["reports", ["report", "deposit", "revenue", "reconcile"]], ["permits", ["permit", "license", "application"]], ["market", ["marketplace", "catalog", "procure", "drone"]], ["i18n", ["spanish", "language", "accessib", "508", "wcag"]], ["residency", ["resident rate", "residency", "non-resident", "resident pricing"]]]
    .forEach(([id, w]) => { if (has(...w) && !cfg.caps.has(id)) { B.toggleCap(cfg, id, true); notes.push(`Added ${B.capName(id)}.`); } });
  const nm = String(text).match(/(?:called|named)\s+"?([A-Z][\w\-' ]{2,40})"?/); if (nm) cfg.name = nm[1].trim();
  const ag = String(text).match(/for (?:the )?([A-Z][\w\-' ]{3,40}(?:Parks|County|City|Department|Recreation)[\w\-' ]*)/); if (ag) { cfg.agency = ag[1].trim(); notes.push(`Agency: ${cfg.agency}.`); }
  return { cfg, notes };
};

/* ---------- flows (steps reference ontology requirement codes) ---------- */
const S = (o) => o;
B.FLOWS = [
  { id: "dayuse", name: "Plan a weekend park visit", cap: "dayuse", users: ["resident"], steps: [
    S({ title: "Open the agency site", actor: "resident", action: "Day-use is the first service card. The agency's name leads; the platform stays out of the way.", screen: "home", hot: "svc-dayuse", reqs: ["R03"] }),
    S({ title: "Pick a Saturday", actor: "resident", action: "Each park shows its open entry windows and how many spots are left.", screen: "dayuse", hot: "reserve", reqs: ["R03", "R05", "R12"] }),
    S({ title: "Choose vehicles and a window", actor: "resident", action: "Two vehicles, 8–10 AM. The price says what it's per.", screen: "dayuseQty", hot: "addcart", reqs: ["R03"] }),
    S({ title: "Review the cart", actor: "resident", action: "One cart for the household.", screen: "cart", st: { kind: "dayuse" }, hot: "continue", reqs: ["R01"], plus: { residency: ["R27"] } }),
    S({ title: "Pay once", actor: "resident", action: "One payment, one receipt.", screen: "pay", hot: "pay", reqs: ["R01"] }),
    S({ title: "Get the pass", actor: "resident", action: "The pass says when, where and what to bring.", screen: "pass", st: { kind: "dayuse" }, hot: "next", reqs: ["R02"], plus: { gate: ["R13"] } }),
    S({ cap: "notify", title: "A day-of text", actor: "system", action: "Saturday morning Lot A fills. Everyone booked there gets a text before they drive.", screen: "sms", st: { kind: "lot" }, hot: "next", reqs: ["R15"] }),
    S({ cap: "gate", user: "desk", title: "Scan at the gate", actor: "desk", action: "Gate staff scan the pass. It verifies with no signal.", screen: "scan", hot: "done", reqs: ["R04", "R13"], surface: "phone" })
  ] },
  { id: "rentals", name: "Rent a ramada for a birthday", cap: "rentals", users: ["resident"], steps: [
    S({ title: "Find a facility", actor: "resident", action: "Ramadas and fields are a service card on the home page.", screen: "home", hot: "svc-rentals", reqs: ["R06"] }),
    S({ title: "Choose a park", actor: "resident", action: "The list and the map stay in sync. Pick Mesquite Flats.", screen: "facilities", hot: "fac", reqs: ["R07"], plus: { map: ["R11"] } }),
    S({ title: "Select hours", actor: "resident", action: "Venues are rows and hours are columns. 11 AM to 3 PM is open on Ramada #2.", screen: "timeline", hot: "addcart", reqs: ["R06", "R07"] }),
    S({ title: "Review the cart", actor: "resident", action: "Rental and any passes in one cart.", screen: "cart", st: { kind: "rental" }, hot: "continue", reqs: ["R01"], plus: { residency: ["R27"] } }),
    S({ title: "Confirmed", actor: "resident", action: "The confirmation names the ramada, the hours and the park address.", screen: "pass", st: { kind: "rental" }, hot: "done", reqs: ["R02"] })
  ] },
  { id: "programs", name: "Sign two kids up for winter camp", cap: "programs", users: ["resident"], steps: [
    S({ title: "Browse programs", actor: "resident", action: "Filter by age and date. Winter camp is near the top.", screen: "programs", hot: "prog", reqs: ["R10"] }),
    S({ title: "Pick a session", actor: "resident", action: "Registration opens in a dialog; sessions are grouped by location with spots left.", screen: "dialog", hot: "add-session", reqs: ["R08", "R09"] }),
    S({ title: "Add both kids", actor: "resident", action: "The household already has both kids. Ages are checked against the session.", screen: "participants", hot: "continue", reqs: ["R08"], plus: { residency: ["R27"] } }),
    S({ title: "One payment, sibling discount", actor: "resident", action: "Both registrations and the discount in one cart.", screen: "cart", st: { kind: "camp" }, hot: "continue", reqs: ["R01"] }),
    S({ title: "Confirmed", actor: "resident", action: "Drop-off time, what to pack and the coordinator's contact.", screen: "pass", st: { kind: "camp" }, hot: "done", reqs: ["R02"] })
  ] },
  { id: "waitlist", name: "Fill a spot from the waitlist", cap: "waitlist", users: ["resident", "coord"], steps: [
    S({ title: "Session is full", actor: "resident", action: "The full session offers the waitlist instead of a dead end.", screen: "dialog", st: { full: true }, hot: "join-wait", reqs: ["R14", "R12"] }),
    S({ user: "coord", title: "A spot opens", actor: "coord", action: "A family cancels. The next family on the list gets a 24-hour hold.", screen: "waitlist", hot: "offer", reqs: ["R14"] }),
    S({ title: "Claim the spot", actor: "resident", action: "The offer arrives with a link and a deadline.", screen: "sms", st: { kind: "wait" }, hot: "done", reqs: ["R14"], plus: { notify: ["R15"] } })
  ] },
  { id: "permits", name: "Apply for a special event permit", cap: "permits", users: ["resident", "reviewer"], steps: [
    S({ title: "Check what's needed", actor: "resident", action: "Three questions decide which sections apply.", screen: "permitStart", hot: "start", reqs: ["R20"] }),
    S({ title: "Event details", actor: "resident", action: "The form saves as you go and skips what doesn't apply.", screen: "permitForm", hot: "continue", reqs: ["R20"] }),
    S({ title: "Documents and fee", actor: "resident", action: "Upload the site plan and pay the application fee.", screen: "permitDocs", hot: "submit", reqs: ["R20", "R01"] }),
    S({ user: "reviewer", title: "Review the packet", actor: "reviewer", action: "The queue is sorted by event date. The packet is complete except the insurance certificate.", screen: "review", hot: "request", reqs: ["R21"] }),
    S({ title: "Fix it in the app", actor: "resident", action: "The applicant sees exactly what's missing and uploads it.", screen: "permitStatus", hot: "upload", reqs: ["R21"], plus: { notify: ["R15"] } }),
    S({ user: "reviewer", title: "Approve", actor: "reviewer", action: "Approved with conditions. The permit is issued.", screen: "review", st: { approved: true }, hot: "done", reqs: ["R21"] })
  ] },
  { id: "capacity", name: "Run a busy Saturday", cap: "capacity", users: ["admin", "desk"], steps: [
    S({ title: "Morning check", actor: "admin", action: "Every lot's fill, today's entries and revenue on one screen.", screen: "today", hot: "lot", reqs: ["R17", "R05"] }),
    S({ title: "Lot A hits 96%", actor: "admin", action: "The alert names the lot and the nearest one with room.", screen: "today", st: { alert: true }, hot: "overflow", reqs: ["R17"], plus: { notify: ["R15"] } }),
    S({ cap: "gate", user: "desk", title: "Keep the line moving", actor: "desk", action: "Gate staff scan passes; overflow visitors are directed on.", screen: "scan", hot: "done", reqs: ["R04", "R13"], surface: "phone" })
  ] },
  { id: "counter", name: "Book a walk-in at the counter", cap: "counter", users: ["desk"], steps: [
    S({ title: "Find the household", actor: "desk", action: "Search by name or phone. New households take one screen.", screen: "counter", hot: "household", reqs: ["R16"] }),
    S({ title: "Book and take cash", actor: "desk", action: "Same booking grid as residents; cash or card at the end.", screen: "counter", st: { pay: true }, hot: "cash", reqs: ["R16", "R06"] }),
    S({ title: "Receipt", actor: "desk", action: "Printed or texted. The booking shows in the resident's account.", screen: "pass", st: { kind: "counter" }, hot: "done", reqs: ["R02"] })
  ] },
  { id: "setup", name: "Change a fee without a release", cap: "setup", users: ["admin"], steps: [
    S({ title: "Edit the season", actor: "admin", action: "Ramada fees and the winter blackout are settings, with a preview of what residents see.", screen: "settings", hot: "save", reqs: ["R18"] }),
    S({ title: "Live now", actor: "admin", action: "Saved and published. No ticket, no release.", screen: "settings", st: { saved: true }, hot: "done", reqs: ["R18"] })
  ] },
  { id: "reports", name: "Close the day", cap: "reports", users: ["admin"], steps: [
    S({ title: "Reconcile deposits", actor: "admin", action: "Today's payments, refunds and fees match the processor's deposit.", screen: "reports", hot: "export", reqs: ["R19"] })
  ] },
  { id: "market", name: "Find and request a counter-drone system", cap: "market", users: ["buyer"], steps: [
    S({ title: "Describe the scenario", actor: "buyer", action: "Threat, budget, readiness and environment in; a recommended package out.", screen: "scenario", hot: "recommend", reqs: ["R25"] }),
    S({ title: "Compare validated products", actor: "buyer", action: "Only validated listings. Filters and side-by-side performance data.", screen: "catalog", hot: "compare", reqs: ["R22"] }),
    S({ title: "Side by side", actor: "buyer", action: "Detection range, defeat method and lead time in one table.", screen: "compare", hot: "request", reqs: ["R22"] }),
    S({ title: "Request it", actor: "buyer", action: "The request carries the unit, quantity and justification into approval.", screen: "request", hot: "done", reqs: ["R23"] })
  ] },
  { id: "vendor", name: "List and validate a product", cap: "market", users: ["vendor"], steps: [
    S({ title: "Submit a listing", actor: "vendor", action: "Specs, test data and compliance documents in one submission.", screen: "vendor", hot: "submit", reqs: ["R24"] }),
    S({ user: "admin", title: "Validate", actor: "admin", action: "The validator checks the test data before anything is visible to buyers.", screen: "validate", hot: "approve", reqs: ["R24"] }),
    S({ user: "buyer", title: "Live in the catalog", actor: "buyer", action: "The listing appears with a validated badge.", screen: "catalog", st: { fresh: true }, hot: "done", reqs: ["R22"] })
  ] }
];
B.SCREEN_SURFACE = s => s === "scan" ? "phone" : s === "sms" ? "sms" : ["home", "dayuse", "dayuseQty", "cart", "pay", "pass", "facilities", "timeline", "programs", "dialog", "participants", "permitStart", "permitForm", "permitDocs", "permitStatus"].includes(s) ? "resident" : ["scenario", "catalog", "compare", "request", "vendor", "validate"].includes(s) ? "market" : "staff";

/* ---------- derive the product ---------- */
B.derive = cfg => {
  const on = id => id === "core" || cfg.caps.has(id), team = cfg.users;
  const reqs = O.REQ.map(r => { const capOn = on(r.cap), who = r.users.some(u => team.has(u)); return { ...r, state: capOn && who ? "in" : !capOn ? "off" : "nouser" }; });
  const inReqs = reqs.filter(r => r.state === "in"), inCodes = new Set(inReqs.map(r => r.code));
  const needIds = [...new Set([...team].flatMap(u => (O.build().out.get("u-" + u) || []).filter(l => l.r === "needs").map(l => l.t)))];
  const needs = needIds.map(id => { const rs = reqs.filter(r => r.needs.includes(id)); const met = rs.filter(r => r.state === "in").map(r => r.code); return { id, n: O.NEEDS[id], met, suggest: met.length ? [] : [...new Set(rs.map(r => r.cap).filter(c => c !== "core" && !cfg.caps.has(c)))] }; });
  const coverage = needs.length ? Math.round(100 * needs.filter(n => n.met.length).length / needs.length) : 0;
  const flows = B.FLOWS.filter(f => on(f.cap) && f.users.some(u => team.has(u))).map(f => {
    const steps = f.steps.filter(s => (!s.cap || on(s.cap)) && (!s.user || team.has(s.user))).map(s => ({ ...s, reqs: [...s.reqs, ...Object.entries(s.plus || {}).filter(([c]) => on(c)).flatMap(([, rs]) => rs)].filter(c => inCodes.has(c) || reqs.find(r => r.code === c).cap === "core"), surface: s.surface || B.SCREEN_SURFACE(s.screen) }));
    if (steps.length) steps[steps.length - 1] = { ...steps[steps.length - 1], last: true };
    return { ...f, steps };
  }).filter(f => f.steps.length);
  const has = id => team.has(id);
  const surfaces = [];
  if (has("resident") && [...cfg.caps].some(c => !["market"].includes(c))) surfaces.push("resident");
  if (["desk", "coord", "reviewer"].some(has) || (has("admin") && [...cfg.caps].some(c => !["market", "notify", "i18n"].includes(c)))) surfaces.push("staff");
  if (has("desk") && on("gate")) surfaces.push("phone");
  if (on("market") && (has("buyer") || has("vendor"))) surfaces.push("market");
  const IA = {
    resident: [["Home", true], ["Day-use", on("dayuse")], ["Facilities", on("rentals") || on("map")], ["Programs", on("programs")], ["Permits", on("permits")], ["My account", true], ["Cart", true]],
    staff: [["Today", on("capacity") || on("reports") || on("dayuse")], ["Reservations", on("dayuse") || on("rentals")], ["Programs & rosters", on("programs") && (has("coord") || has("admin"))], ["Waitlists", on("waitlist") && has("coord")], ["Applications", on("permits") && has("reviewer")], ["Point of sale", on("counter") && has("desk")], ["Validation", on("market") && has("admin")], ["Reports", on("reports") && has("admin")], ["Settings", on("setup") && has("admin")]],
    phone: [["Scan", true], ["Today's list", true], ["Offline queue", true]],
    market: [["Scenario", has("buyer")], ["Catalog", has("buyer")], ["Compare", has("buyer")], ["My requests", has("buyer")], ["My listings", has("vendor")]]
  };
  const ia = Object.fromEntries(surfaces.map(s => [s, IA[s].filter(x => x[1]).map(x => x[0])]));
  const blocks = O.BLOCKS.filter(b => inReqs.some(r => r.blocks.includes(b.id)));
  const patterns = O.PATTERNS.filter(p => inReqs.some(r => r.patterns.includes(p.id)));
  const gaps = O.GAPS.map((g, i) => ({ code: "Q" + (i + 1), n: g[0], doc: g[1], reqs: g[2].map(k => "R" + String(k).padStart(2, "0")) })).filter(g => g.reqs.some(c => inCodes.has(c)));
  const warnings = [];
  if (!team.size) warnings.push("Add someone to the team to get a product.");
  if (on("gate") && !has("desk")) warnings.push("Gate check-in is on, but no gate staff are on the team. Add Front desk & gate staff to get the gate phone.");
  if (on("permits") && !has("reviewer")) warnings.push("Permits are on, but nobody reviews them. Add a Permit reviewer.");
  if (on("market") && !has("buyer") && !has("vendor")) warnings.push("The marketplace needs buyers or vendors on the team.");
  reqs.filter(r => r.state === "nouser").forEach(r => { if (!warnings.some(w => w.includes(r.code))) {} });
  return { reqs, inReqs, needs, coverage, flows, surfaces, ia, blocks, patterns, gaps, warnings };
};

B.SURFACE_NAME = { resident: "Resident web", staff: "Staff console", phone: "Gate phone", market: "Marketplace", sms: "Text message" };

/* ---------- spec ---------- */
B.spec = (cfg, bp) => {
  const L = [];
  L.push(`# ${cfg.name}`, ``, `**Agency:** ${cfg.agency}  `, `**Team:** ${[...cfg.users].map(B.userName).join(", ")}  `, `**Need coverage:** ${bp.coverage}%`, ``);
  L.push(`## Surfaces and navigation`); bp.surfaces.forEach(s => L.push(`- **${B.SURFACE_NAME[s]}:** ${bp.ia[s].join(" · ")}`)); L.push(``);
  L.push(`## Capabilities`); B.CAPS.filter(c => c.core || cfg.caps.has(c.id)).forEach(c => L.push(`- ${c.name}: ${c.doc}`)); L.push(``);
  L.push(`## Requirements in scope (${bp.inReqs.length})`); bp.inReqs.forEach(r => L.push(`- ${r.code} ${r.n} _(${r.status})_`)); L.push(``);
  L.push(`## Flows`); bp.flows.forEach(f => { L.push(`### ${f.name}`); f.steps.forEach((s, i) => L.push(`${i + 1}. **${s.title}** (${B.userName(s.actor) === s.actor ? "System" : B.userName(s.actor)}, ${B.SURFACE_NAME[s.surface]}): ${s.action} ${s.reqs.length ? "[" + s.reqs.join(", ") + "]" : ""}`)); L.push(``); });
  L.push(`## Platform blocks`); bp.blocks.forEach(b => L.push(`- ${b.n}`)); L.push(``);
  L.push(`## Kit patterns`); bp.patterns.forEach(p => L.push(`- ${p.n}${p.inKit ? "" : " — not in the kit yet, design it"}`)); L.push(``);
  L.push(`## Unmet needs`); const un = bp.needs.filter(n => !n.met.length); (un.length ? un : [{ n: "None" }]).forEach(n => L.push(`- ${n.n}${n.suggest && n.suggest.length ? ` (turn on ${n.suggest.map(B.capName).join(" or ")})` : ""}`)); L.push(``);
  L.push(`## Open questions`); bp.gaps.forEach(g => L.push(`- ${g.code} ${g.n}`));
  return L.join("\n");
};
})(window);
