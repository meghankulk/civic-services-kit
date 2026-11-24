/* Kaizen Service Ontology · onto.js
   Goal → users → needs and frustrations → requirements → what delivers each one
   (platform block, kit pattern, design check), the public evidence behind it, and the gaps.
   status "stated" = shown on a public page or a live Kaizen app; "modeled" = my design reading.
   Unofficial. Not affiliated with Kaizen. Exposes window.KZO. */
(function (G) {
"use strict";
const SRC = {
  md: "https://news.maryland.gov/dnr/2025/06/06/secretarys-message-maryland-state-parks-are-saving-a-space-for-you/",
  md26: "https://news.maryland.gov/dnr/2026/06/25/additional-maryland-state-parks-requiring-day-use-reservations-new-entrance-technology-starting-this-weekend/",
  mdApp: "https://www.parkdayuse.maryland.gov/",
  pima: "https://content.govdelivery.com/accounts/AZPIMA/bulletins/3add37e",
  pimaApp: "https://www.explore.pima.gov/",
  co: "https://sipa.colorado.gov/kaizen-labs",
  cuas: "https://defensescoop.com/2026/08/04/pentagon-counter-drone-hub-picks-software-startup-kaizen-to-develop-c-uas-marketplace-for-15m/",
  dow: "https://www.war.gov/News/Releases/Release/Article/4563104/department-of-war-enhances-c-uas-marketplace-to-expand-access-to-validated-tech/",
  va: "https://www.businesswire.com/news/home/20261111816249/en/Kaizen-Supports-VA.gov-Modernization-Making-it-Easier-for-Veterans-to-Access-Care-and-Benefits",
  army: "https://defensescoop.com/2026/10/05/kaizen-49m-contract-army-task-order-classified-work/",
  taproot: "https://www.potomacofficersclub.com/nikhil-reddy-kaizen-software-ai-cuas-uas-drones-taproot-blacksmith/",
  site: "https://www.kaizenlabs.co/"
};

const CLASSES = [
  { id: "Goal", label: "Goal", plural: "Goal", col: "--o-goal", doc: "What the platform exists to do." },
  { id: "User", label: "User", plural: "Users", col: "--o-user", doc: "People who use or run the service." },
  { id: "Need", label: "Need", plural: "Needs", col: "--o-need", doc: "What a user needs to get done." },
  { id: "Frustration", label: "Frustration", plural: "Frustrations", col: "--o-frus", doc: "What gets in the way today." },
  { id: "Requirement", label: "Requirement", plural: "Requirements", col: "--o-req", doc: "What the product must do to meet a need." },
  { id: "Block", label: "Platform block", plural: "Platform blocks", col: "--o-block", doc: "A reusable part every government program needs. Kaizen's Taproot is described as a library of these." },
  { id: "Pattern", label: "Kit pattern", plural: "Kit patterns", col: "--o-pattern", doc: "Where the requirement shows up in the Civic Services Kit." },
  { id: "Check", label: "Design check", plural: "Design checks", col: "--o-check", doc: "A rule every screen is reviewed against." },
  { id: "Evidence", label: "Program", plural: "Programs", col: "--o-evid", doc: "A public Kaizen program that shows the requirement in use." },
  { id: "Gap", label: "Open question", plural: "Open questions", col: "--o-gap", doc: "Something the public record doesn't answer. Ask before designing on it." },
  { id: "Stage", label: "Service stage", plural: "Service stages", col: "--o-stage", doc: "Where in a resident's or buyer's journey the requirement applies." }
];
const RELATIONS = [
  { id: "serves", out: "Serves", in: "Served by" },
  { id: "needs", out: "Needs", in: "Needed by" },
  { id: "experiences", out: "Experiences", in: "Experienced by" },
  { id: "realizedBy", out: "Met by", in: "Meets" },
  { id: "addresses", out: "Fixes", in: "Fixed by" },
  { id: "forUser", out: "For", in: "Requirements" },
  { id: "deliveredBy", out: "Built on", in: "Delivers" },
  { id: "presentedIn", out: "Shown in", in: "Shows" },
  { id: "checkedBy", out: "Checked by", in: "Checks" },
  { id: "evidencedBy", out: "Seen in", in: "Shows in use" },
  { id: "openQuestion", out: "Open question", in: "Open on" },
  { id: "inStage", out: "Stage", in: "Requirements" }
];

const GOAL = { id: "goal", n: "People finish a government task in minutes, and agencies run it with fewer staff", doc: "Kaizen's site says it powers America's mission-critical services and builds the infrastructure government runs on. Its civic apps replace staff-first legacy systems with phone-first booking, registration and payment.", status: "stated", src: SRC.site };

const USERS = [
  { id: "resident", n: "Resident", doc: "Books, registers or applies on a phone, often for a whole family.", primary: true, surface: "Resident web" },
  { id: "desk", n: "Front desk & gate staff", doc: "Checks people in, helps walk-ins and fixes bookings at the counter.", surface: "Staff console · Gate phone" },
  { id: "coord", n: "Program coordinator", doc: "Runs classes and camps: sessions, rosters, waitlists and families.", surface: "Staff console" },
  { id: "admin", n: "Agency admin & finance", doc: "Sets prices and rules, watches capacity and reconciles money.", surface: "Staff console" },
  { id: "reviewer", n: "Permit reviewer", doc: "Reviews applications and approves, denies or asks for changes.", surface: "Staff console" },
  { id: "buyer", n: "Military buyer", doc: "Finds, compares and requests validated counter-drone systems.", surface: "Marketplace" },
  { id: "vendor", n: "Technology vendor", doc: "Lists a product with specs and compliance for validation.", surface: "Marketplace" }
];
const NEEDS = {
  n1: "Find something open near me",
  n2: "Finish a booking on my phone in a few minutes",
  n3: "Know it's confirmed and what to bring",
  n4: "Pay once for the whole household",
  n5: "Use it in my language and with assistive tech",
  n6: "Check people in fast, even with bad signal",
  n7: "Help a walk-in at the counter",
  n8: "Fill programs and manage waitlists",
  n9: "Reach families when plans change",
  n10: "See capacity and revenue today",
  n11: "Change prices and rules without a developer",
  n12: "Review complete applications and ask for fixes",
  n13: "Compare validated products and request one",
  n14: "List a product and get it validated"
};
const USER_NEEDS = { resident: ["n1", "n2", "n3", "n4", "n5"], desk: ["n6", "n7"], coord: ["n8", "n9"], admin: ["n10", "n11"], reviewer: ["n12"], buyer: ["n13"], vendor: ["n14"] };
const FRUS = {
  f1: ["Popular parks fill up and the gate closes", "Visitors drive out and get turned away. Maryland reported zero capacity closures at its five pilot parks once timed entry was in place.", "stated", SRC.md],
  f2: ["A separate login and checkout for every program", "Families re-enter the same details for a camp, a pass and a picnic table.", "modeled"],
  f3: ["Legacy systems built for staff, not phones", "Pima County moved its registrations off its previous platform, ActiveNet, onto Kaizen in 2024.", "stated", SRC.pima],
  f4: ["Paper forms and phone tag for permits", "Applicants learn something is missing days later, by phone.", "modeled"],
  f5: ["Buying counter-drone tech takes too long", "The C-UAS Marketplace exists to shorten acquisition. Its first purchases came within months of launch.", "stated", SRC.dow],
  f6: ["A price or rule change needs a vendor ticket", "Staff wait on a release to change a fee or a session.", "modeled"],
  f7: ["Waitlists live in spreadsheets", "Coordinators call down a list when a spot opens.", "modeled"]
};
const USER_FRUS = { resident: ["f1", "f2", "f3"], desk: ["f3"], coord: ["f7"], admin: ["f1", "f6"], reviewer: ["f4"], buyer: ["f5"], vendor: ["f5"] };

const STAGES = [
  { id: "discover", n: "Discover", q: "What's available, and where?" },
  { id: "eligible", n: "Check eligibility", q: "Can I book this, and at what price?" },
  { id: "book", n: "Book or apply", q: "Can I finish it on my phone?" },
  { id: "pay", n: "Pay", q: "One payment for everything?" },
  { id: "confirm", n: "Confirm", q: "Do I know it's done and what's next?" },
  { id: "arrive", n: "Arrive & check in", q: "Does the gate let me in fast?" },
  { id: "change", n: "Change or cancel", q: "Can I fix it myself?" },
  { id: "review", n: "Review & approve", q: "Who decides, and how fast?" },
  { id: "report", n: "Report", q: "Did the agency hit its numbers?" }
];

const BLOCKS = [
  { id: "b-pay", n: "Payments & cart", doc: "One cart across programs, fees, discounts, refunds.", status: "stated", src: SRC.taproot },
  { id: "b-id", n: "Identity & household", doc: "One account for a family: participants, ages, residency.", status: "stated", src: SRC.taproot },
  { id: "b-res", n: "Reservations & capacity", doc: "Timed entry, venues by the hour, limits per lot or room.", status: "stated", src: SRC.co },
  { id: "b-reg", n: "Registrations & sessions", doc: "Programs, sessions, rosters, age rules, waitlists.", status: "stated", src: SRC.taproot },
  { id: "b-pos", n: "Point of sale & gate", doc: "Walk-in sales and entry at the gate or counter.", status: "stated", src: SRC.co },
  { id: "b-appr", n: "Applications, triage & approvals", doc: "Forms that branch, review queues, decisions with reasons.", status: "stated", src: SRC.taproot },
  { id: "b-msg", n: "Notifications", doc: "Email and text for confirmations and day-of changes.", status: "modeled" },
  { id: "b-bi", n: "Reporting & BI", doc: "Revenue, capacity and use, by day and by site.", status: "stated", src: SRC.taproot },
  { id: "b-cat", n: "Catalog & search", doc: "Searchable listings with filters, specs and comparisons.", status: "stated", src: SRC.dow },
  { id: "b-geo", n: "Maps & places", doc: "Facilities, venues and lots as places on a map.", status: "modeled" }
];
const PATTERNS = [
  { id: "k-band", n: "Search band & date picker", kit: "inputs", inKit: true },
  { id: "k-cards", n: "Service cards & result tiles", kit: "cards", inKit: true },
  { id: "k-filters", n: "Filter row & status chips", kit: "chips", inKit: true },
  { id: "k-dialog", n: "Register dialog", kit: "overlays", inKit: true },
  { id: "k-grid", n: "Booking grid & list view", kit: "booking", inKit: true },
  { id: "k-map", n: "Facility finder map", kit: "maps", inKit: true },
  { id: "k-cap", n: "Lot capacity map", kit: "maps", inKit: true },
  { id: "k-cart", n: "Cart & checkout", kit: "checkout", inKit: true },
  { id: "k-pass", n: "Entry pass", kit: "checkout", inKit: true },
  { id: "k-staff", n: "Staff console table", kit: "staff", inKit: true },
  { id: "k-permit", n: "Permit application", inKit: false },
  { id: "k-review", n: "Review queue", inKit: false },
  { id: "k-market", n: "Marketplace catalog", inKit: false }
];
const CHECKS = [
  ["P01", "One action color", "Only buttons and links use the action color. Nothing else competes with it."],
  ["P02", "Status is a color and a word", "Open, Few spots, Full and Closed always carry text, never color alone."],
  ["P03", "Plain language", "Say what happens next in words a 12-year-old could read. No system terms."],
  ["P04", "Phone first", "Every task finishes on a 390px screen with 40–48px targets."],
  ["P05", "Gray band to search, white to choose", "Search and filters sit on the gray band; results sit on white."],
  ["P06", "Prices carry their unit", "\"$25.00 per activity\", \"$40.00/day\". Fees appear before payment."],
  ["P07", "Closed says when it opens", "A closed state gives the reason and the reopening date."],
  ["P08", "The agency is the brand", "The agency's name and seal lead. The platform stays in the background."],
  ["P09", "Forms save as you go", "Long forms keep progress and only ask what applies."],
  ["P10", "Accessible by default", "WCAG 2.1 AA, Section 508, and English and Spanish on every screen."]
];
const EVIDENCE = [
  { id: "e-md", n: "Maryland Park Service day-use", doc: "Timed weekend entry built by Kaizen: 5 pilot parks in 2025, expanded in 2026, weekday entry at the gate.", src: SRC.md26 },
  { id: "e-pima", n: "Pima County Parks & Recreation", doc: "Programs, camps, ramadas, sports fields and memberships on Kaizen since August 2024.", src: SRC.pima },
  { id: "e-co", n: "Colorado municipal partner", doc: "State listing: facility reservations, point of sale and digital payments for towns.", src: SRC.co },
  { id: "e-cuas", n: "JIATF-401 C-UAS Marketplace", doc: "Search, filter and compare validated counter-drone products, then submit acquisition requests.", src: SRC.dow },
  { id: "e-va", n: "VA.gov modernization", doc: "Kaizen supports work to make it easier for Veterans to reach care and benefits.", src: SRC.va },
  { id: "e-army", n: "Army enterprise agreement", doc: "A common software platform, including classified work.", src: SRC.army }
];

/* Requirements: name, users, needs, frustrations, stages, blocks, patterns, checks, evidence, status, doc, source, capability */
const R = [
  ["One cart and one payment for the household", ["resident"], ["n4"], ["f2"], ["pay"], ["b-pay", "b-id"], ["k-cart"], ["P06"], ["e-md", "e-pima", "e-co"], "stated", "A cart in the app bar holds programs, passes and reservations together. Both live apps have it.", SRC.pimaApp, "core"],
  ["Confirmation says when, where and what to bring", ["resident"], ["n3"], [], ["confirm"], ["b-msg"], ["k-pass"], ["P03"], [], "modeled", "The pass and the email say the date, the entry time, the vehicle count and the address.", null, "core"],
  ["Weekend day-use needs a timed reservation, open 7 days ahead", ["resident", "admin"], ["n2", "n10"], ["f1"], ["book"], ["b-res"], ["k-band"], ["P07", "P04"], ["e-md"], "stated", "Reservations start seven days before each visit. Holidays and weekends are covered.", SRC.md26, "dayuse"],
  ["Weekday entry is handled at the gate, with no booking", ["desk"], ["n6"], [], ["arrive"], ["b-pos"], ["k-pass"], ["P03"], ["e-md"], "stated", "On weekdays entry is processed on-site in the same system.", SRC.md26, "gate"],
  ["Cap entries per park so it never closes for capacity", ["admin"], ["n10"], ["f1"], ["book", "report"], ["b-res", "b-bi"], ["k-cap"], ["P02"], ["e-md"], "stated", "Limits are set per park so the gate never has to close.", SRC.md, "dayuse"],
  ["Show venues by the hour with price and min/max time", ["resident", "desk"], ["n2"], [], ["book"], ["b-res"], ["k-grid"], ["P06", "P05"], ["e-pima"], "stated", "The pavilion page lists each ramada with its park, $/day and min and max hours against hour columns.", SRC.pimaApp, "rentals"],
  ["Switch between time view and list view", ["resident"], ["n1", "n2"], [], ["discover", "book"], ["b-res"], ["k-grid"], ["P04"], ["e-pima"], "stated", "A toggle swaps the hour grid for one card per park.", SRC.pimaApp, "rentals"],
  ["Register in a dialog without losing your filters", ["resident"], ["n2"], ["f3"], ["book"], ["b-reg"], ["k-dialog"], ["P04"], ["e-pima"], "stated", "\"Register for a program\" opens over the results list.", SRC.pimaApp, "programs"],
  ["Sessions grouped by location with spots left and price", ["resident", "coord"], ["n1", "n8"], [], ["discover", "eligible"], ["b-reg"], ["k-dialog"], ["P06", "P02"], ["e-pima"], "stated", "An accordion per community center, each with its sessions and \"per activity\" pricing.", SRC.pimaApp, "programs"],
  ["Filter by category, facility, instructor, date and age", ["resident"], ["n1"], [], ["discover"], ["b-reg", "b-cat"], ["k-filters"], ["P05"], ["e-pima"], "stated", "The Programs page has these five filters next to a search by name or ID.", SRC.pimaApp, "programs"],
  ["Map and list stay in sync, filters apply to both", ["resident"], ["n1"], [], ["discover"], ["b-geo"], ["k-map"], ["P05", "P04"], [], "modeled", "Today the detail page links out to Google Maps. A shared map would let people choose by distance.", null, "map"],
  ["Closed states say why and when they reopen", ["resident"], ["n3"], [], ["eligible", "book"], ["b-res", "b-reg"], ["k-grid", "k-filters"], ["P07"], ["e-pima"], "modeled", "The live app says \"Reservations closed\" but not when they reopen.", SRC.pimaApp, "core"],
  ["Passes work offline and scan at the gate in a second", ["resident", "desk"], ["n3", "n6"], [], ["arrive"], ["b-pos", "b-pay"], ["k-pass"], ["P04"], [], "modeled", "A wallet pass with a code the gate phone can verify with no signal.", null, "gate"],
  ["Offer freed spots to the waitlist automatically", ["coord"], ["n8"], ["f7"], ["change"], ["b-reg", "b-msg"], ["k-dialog", "k-staff"], ["P03"], [], "modeled", "The next family gets a 24-hour hold and a text.", null, "waitlist"],
  ["Text confirmations and day-of changes", ["resident", "coord"], ["n3", "n9"], [], ["confirm", "change"], ["b-msg"], ["k-pass"], ["P03"], [], "modeled", "Closures, weather and lot alerts reach people before they drive.", null, "notify"],
  ["Staff book for a walk-in and take cash or card", ["desk"], ["n7"], [], ["book", "pay"], ["b-pos", "b-pay"], ["k-staff", "k-grid"], ["P04"], ["e-co", "e-md"], "stated", "Point of sale appears in the Colorado listing and at Maryland parks with entry fees.", SRC.co, "counter"],
  ["Live lot capacity with an alert at 90%", ["admin", "desk"], ["n10"], ["f1"], ["arrive", "report"], ["b-res", "b-bi", "b-geo"], ["k-cap", "k-staff"], ["P02"], [], "modeled", "Staff see each lot fill and can point people to overflow.", null, "capacity"],
  ["Admins change prices, rules and sessions without a release", ["admin"], ["n11"], ["f6"], ["report"], ["b-res", "b-reg", "b-pay"], ["k-staff"], ["P06"], [], "modeled", "Seasons, blackout dates and fees are settings, not code.", null, "setup"],
  ["Daily deposits reconcile with the payment processor", ["admin"], ["n10"], [], ["report"], ["b-bi", "b-pay"], ["k-staff"], ["P06"], ["e-co"], "modeled", "Finance closes the day from one report.", null, "reports"],
  ["Permit forms save progress and only ask what applies", ["resident"], ["n2"], ["f4"], ["eligible", "book"], ["b-appr"], ["k-permit"], ["P09", "P03"], ["e-pima"], "modeled", "Pima planned special event permits on the platform. The form design is my model.", SRC.pima, "permits"],
  ["Reviewers see complete packets and ask for changes in-app", ["reviewer"], ["n12"], ["f4"], ["review"], ["b-appr", "b-msg"], ["k-review"], ["P03"], [], "modeled", "A queue sorted by deadline; \"Request changes\" sends the applicant a list.", null, "permits"],
  ["Search, filter and compare validated counter-drone products", ["buyer"], ["n13"], ["f5"], ["discover"], ["b-cat"], ["k-market", "k-filters"], ["P05"], ["e-cuas"], "stated", "Buyers search and filter products and compare performance data.", SRC.dow, "market"],
  ["Submit an acquisition request from the listing", ["buyer"], ["n13"], ["f5"], ["book", "review"], ["b-appr", "b-cat"], ["k-market"], ["P03"], ["e-cuas"], "stated", "Requests go from the listing to an approval flow.", SRC.dow, "market"],
  ["Vendors submit specs; listings are validated before they go live", ["vendor"], ["n14"], ["f5"], ["review"], ["b-appr", "b-cat"], ["k-market", "k-review"], ["P02"], ["e-cuas"], "stated", "JIATF-401 validates each listing independently.", SRC.dow, "market"],
  ["Describe a scenario and get a recommended package", ["buyer"], ["n13"], ["f5"], ["discover", "eligible"], ["b-cat"], ["k-market"], ["P03"], ["e-cuas"], "stated", "Announced as a planned layer: threat, budget, readiness and environment in, a configuration out.", SRC.dow, "market"],
  ["Every screen meets WCAG 2.1 AA and works in Spanish", ["resident"], ["n5"], [], ["discover", "book", "pay"], ["b-id"], ["k-cards", "k-dialog", "k-cart"], ["P10"], ["e-va"], "modeled", "Federal work needs Section 508. Counties like Pima serve large Spanish-speaking populations.", null, "i18n"],
  ["Resident pricing needs a verified address", ["resident", "admin"], ["n4"], [], ["eligible", "pay"], ["b-id", "b-pay"], ["k-cart"], ["P06"], [], "modeled", "Two price tiers, with the resident rate unlocked by a verified address.", null, "residency"]
];
const GAPS = [
  ["How residency is verified for resident rates", "No public screen shows it. Address match, ID upload or staff check?", [27, 1]],
  ["What the gate does with no signal", "Weekday gate entry is stated. Offline behavior isn't.", [4, 13]],
  ["How cancellations and refunds work, per agency", "Rules vary by agency and nothing public describes the self-serve path.", [1, 12]],
  ["How the transaction fee is shown to residents", "Maryland's contract is a revenue share on transactions. Is it a visible fee or built into the price?", [1, 19]],
  ["How shared blocks are accredited for classified work", "The Army agreement covers classified material. Which parts of the platform carry over?", [24, 23]],
  ["How people ask for an accessibility accommodation", "WCAG covers the screens. Requesting a ramp, an interpreter or an aide isn't shown.", [26]]
];

const REQ = R.map((r, i) => ({ id: "r" + (i + 1), code: "R" + String(i + 1).padStart(2, "0"), n: r[0], users: r[1], needs: r[2], frus: r[3], stages: r[4], blocks: r[5], patterns: r[6], checks: r[7], evidence: r[8], status: r[9], doc: r[10], src: r[11], cap: r[12] }));

function build() {
  const N = [], L = [], add = (c, id, n, doc, x = {}) => N.push({ c, id, n, doc, ...x }), link = (s, r, t) => L.push({ s, r, t });
  add("Goal", GOAL.id, GOAL.n, GOAL.doc, { status: GOAL.status, src: GOAL.src });
  USERS.forEach(u => add("User", "u-" + u.id, u.n, u.doc, { primary: u.primary, surface: u.surface }));
  Object.entries(NEEDS).forEach(([id, n]) => add("Need", id, n, ""));
  Object.entries(FRUS).forEach(([id, f]) => add("Frustration", id, f[0], f[1], { status: f[2], src: f[3] }));
  REQ.forEach(r => add("Requirement", r.id, r.n, r.doc, { code: r.code, status: r.status, src: r.src, cap: r.cap }));
  BLOCKS.forEach(b => add("Block", b.id, b.n, b.doc, { status: b.status, src: b.src }));
  PATTERNS.forEach(p => add("Pattern", p.id, p.n, p.inKit ? "In the Civic Services Kit." : "Not in the kit yet. The next component to design.", { kit: p.kit, inKit: p.inKit }));
  CHECKS.forEach(c => add("Check", c[0], c[1], c[2], { code: c[0] }));
  EVIDENCE.forEach(e => add("Evidence", e.id, e.n, e.doc, { src: e.src }));
  GAPS.forEach((g, i) => add("Gap", "g" + (i + 1), g[0], g[1], { code: "Q" + (i + 1) }));
  STAGES.forEach(s => add("Stage", "s-" + s.id, s.n, s.q));
  USERS.forEach(u => { link("u-" + u.id, "serves", "goal"); (USER_NEEDS[u.id] || []).forEach(n => link("u-" + u.id, "needs", n)); (USER_FRUS[u.id] || []).forEach(f => link("u-" + u.id, "experiences", f)); });
  REQ.forEach(r => {
    r.needs.forEach(n => link(n, "realizedBy", r.id)); r.frus.forEach(f => link(r.id, "addresses", f)); r.users.forEach(u => link(r.id, "forUser", "u-" + u));
    r.blocks.forEach(b => link(r.id, "deliveredBy", b)); r.patterns.forEach(p => link(r.id, "presentedIn", p)); r.checks.forEach(c => link(r.id, "checkedBy", c));
    r.evidence.forEach(e => link(r.id, "evidencedBy", e)); r.stages.forEach(s => link(r.id, "inStage", "s-" + s));
  });
  GAPS.forEach((g, i) => g[2].forEach(k => link("r" + k, "openQuestion", "g" + (i + 1))));
  const byId = new Map(N.map(n => [n.id, n]));
  const links = L.filter(l => byId.has(l.s) && byId.has(l.t));
  const out = new Map(), inn = new Map(), push = (m, k, v) => (m.get(k) || m.set(k, []).get(k)).push(v);
  links.forEach(l => { push(out, l.s, l); push(inn, l.t, l); });
  return { nodes: N, links, byId, out, inn };
}

/* ---------- Domain model: the parks & rec object model the screens are views of ---------- */
const DOMAIN = {
  groups: [["places", "Places"], ["offer", "Offerings"], ["people", "People"], ["tx", "Transactions"], ["rules", "Rules"]],
  objects: [
    { id: "agency", n: "Agency", g: "places", doc: "Owns everything: branding, rates, policies, staff.", attrs: ["name", "seal", "service area", "fee policy"], seen: "Both apps lead with the agency's name and seal." },
    { id: "facility", n: "Facility", g: "places", doc: "A park, center or trailhead with an address and hours.", attrs: ["name", "address", "photos", "hours", "type"], seen: "Facilities pages in both apps: name, address, photos." },
    { id: "venue", n: "Venue", g: "places", doc: "A bookable unit inside a facility: ramada, field, pool, room.", attrs: ["name", "facility", "price", "min / max time", "capacity"], seen: "Pima pavilion grid: Ramada #1 · $25.00/day · min and max hours." },
    { id: "amenity", n: "Amenity", g: "places", doc: "What a place offers. Search filters on it.", attrs: ["name", "icon"], seen: "Maryland: \"Learn about all the amenities we have to offer.\"" },
    { id: "lot", n: "Lot / entry point", g: "places", doc: "Where day-use capacity is counted and passes are checked.", attrs: ["name", "facility", "spaces", "fill %"], states: ["Open", "Filling", "Near full (90%)", "Full"] },
    { id: "program", n: "Program", g: "offer", doc: "A class, camp or lesson. Runs as one or more sessions.", attrs: ["title", "category", "age range", "coordinator", "photo"], seen: "Pima Programs: title, ages, coordinator." },
    { id: "session", n: "Session", g: "offer", doc: "One dated run of a program at one location.", attrs: ["program", "facility", "dates", "spots", "price"], states: ["Opens soon", "Open", "Few spots", "Full", "Closed"], seen: "Pima register dialog: sessions grouped by location, $25.00 per activity." },
    { id: "entry", n: "Day-use window", g: "offer", doc: "A timed entry into a park on a given day.", attrs: ["facility", "date", "window", "vehicles"], seen: "Maryland: weekend entry by reservation, 7 days ahead." },
    { id: "pass", n: "Membership / pass", g: "offer", doc: "Time-based entitlement to use a place or program.", attrs: ["name", "term", "price"], seen: "Pima \"Memberships and Access Passes\": Archery Pass." },
    { id: "permit", n: "Permit", g: "offer", doc: "An application to use a place for an event or business.", attrs: ["type", "event", "location", "date", "documents", "fee"], states: ["Draft", "Submitted", "Changes requested", "Approved / Denied", "Issued"] },
    { id: "household", n: "Household", g: "people", doc: "The account. Pays, holds bookings, has members.", attrs: ["name", "address", "residency", "phone", "payment methods"], seen: "Cart and account in both apps' app bar." },
    { id: "participant", n: "Participant", g: "people", doc: "A household member who attends.", attrs: ["name", "birth date", "notes"] },
    { id: "staff", n: "Staff", g: "people", doc: "Coordinators, gate staff, reviewers and admins.", attrs: ["name", "role", "facility"], seen: "Pima dialog: coordinator name and email." },
    { id: "reservation", n: "Reservation", g: "tx", doc: "A venue or entry window, for a time, for a household.", attrs: ["venue or window", "time", "household", "party size"], states: ["Held", "Confirmed", "Checked in / No-show", "Cancelled", "Refunded"] },
    { id: "registration", n: "Registration", g: "tx", doc: "A participant in a session.", attrs: ["participant", "session", "waiver"], states: ["Pending", "Enrolled", "Attended", "Withdrawn"] },
    { id: "waitlist", n: "Waitlist entry", g: "tx", doc: "A place in line for a full session.", attrs: ["participant", "session", "position", "hold expires"], states: ["Waiting", "Offered (24h)", "Claimed / Expired"] },
    { id: "cart", n: "Cart & order", g: "tx", doc: "Holds reservations, registrations and passes; becomes one order.", attrs: ["items", "discounts", "fees", "total"], seen: "Cart icon in both apps; \"payment plans apply in cart.\"" },
    { id: "payment", n: "Payment & refund", g: "tx", doc: "Money in and out, reconciled to the processor.", attrs: ["amount", "method", "processor id", "refunds"], states: ["Authorized", "Captured", "Settled", "Refunded"] },
    { id: "checkin", n: "Check-in", g: "tx", doc: "A pass or booking verified at the gate or front desk.", attrs: ["pass", "lot or desk", "time", "staff", "offline?"] },
    { id: "price", n: "Price rule", g: "rules", doc: "Resident or non-resident, per vehicle, per day, per activity, discounts.", attrs: ["unit", "resident rate", "non-resident rate", "discounts"], seen: "\"$25.00 per activity\", \"$40.00/day\"." },
    { id: "season", n: "Season & blackout", g: "rules", doc: "When places and programs are open.", attrs: ["start", "end", "blackout dates"], seen: "Maryland: Memorial Day to Labor Day weekends." },
    { id: "capacity", n: "Capacity rule", g: "rules", doc: "Limits per lot, window, venue or session.", attrs: ["scope", "limit", "release time"] },
    { id: "eligibility", n: "Eligibility rule", g: "rules", doc: "Age, residency and prerequisites.", attrs: ["age range", "residency", "prerequisite"], seen: "Pima: \"Ages 5 – 12\"." },
    { id: "listing", n: "Product listing", g: "offer", market: true, doc: "Marketplace: a validated product. Plays the role a program or venue plays in parks.", attrs: ["vendor", "category", "specs", "lead time", "validation"], states: ["Submitted", "In validation", "Validated", "Live"], seen: "C-UAS Marketplace: listings validated before buyers see them." },
    { id: "request", n: "Acquisition request", g: "tx", market: true, doc: "Marketplace: a buyer's request. Plays the role of cart + permit approval.", attrs: ["unit", "product", "quantity", "justification"], states: ["Draft", "Submitted", "Approved", "Ordered"], seen: "C-UAS Marketplace: buyers submit acquisition requests." }
  ],
  rels: [
    ["agency", "owns", "facility"], ["facility", "contains", "venue"], ["facility", "offers", "amenity"], ["facility", "has", "lot"],
    ["program", "runs as", "session"], ["session", "held at", "facility"], ["program", "led by", "staff"], ["entry", "into", "facility"],
    ["household", "has", "participant"], ["participant", "registers as", "registration"], ["registration", "in", "session"],
    ["household", "books", "reservation"], ["reservation", "for", "venue"], ["reservation", "for", "entry"], ["household", "holds", "pass"],
    ["waitlist", "for", "session"], ["waitlist", "becomes", "registration"], ["cart", "contains", "reservation"], ["cart", "contains", "registration"], ["cart", "contains", "pass"], ["cart", "paid by", "payment"],
    ["household", "applies for", "permit"], ["permit", "to use", "facility"], ["staff", "reviews", "permit"], ["checkin", "verifies", "reservation"], ["checkin", "at", "lot"], ["staff", "performs", "checkin"],
    ["price", "prices", "venue"], ["price", "prices", "session"], ["price", "prices", "entry"], ["season", "opens", "facility"], ["capacity", "limits", "lot"], ["capacity", "limits", "session"],
    ["eligibility", "gates", "session"], ["eligibility", "checks", "participant"], ["agency", "sets", "price"],
    ["listing", "same role as", "program"], ["request", "same role as", "cart"], ["request", "approved like", "permit"]
  ],
  req: { R01: ["cart", "payment", "household"], R02: ["reservation", "registration", "pass"], R03: ["entry", "lot", "capacity"], R04: ["checkin", "entry"], R05: ["capacity", "lot"], R06: ["venue", "price"], R07: ["venue", "facility"], R08: ["registration", "session"], R09: ["session", "facility"], R10: ["program", "session", "staff"], R11: ["facility", "amenity"], R12: ["session", "venue", "season"], R13: ["pass", "checkin"], R14: ["waitlist", "registration"], R15: ["reservation", "lot"], R16: ["reservation", "payment", "staff"], R17: ["lot", "capacity"], R18: ["price", "season", "capacity"], R19: ["payment"], R20: ["permit", "eligibility"], R21: ["permit", "staff"], R22: ["listing"], R23: ["request", "listing"], R24: ["listing"], R25: ["listing"], R26: ["household"], R27: ["household", "eligibility", "price"] },
  screens: { home: ["agency", "facility", "program"], dayuse: ["entry", "lot", "facility"], dayuseQty: ["entry", "price"], cart: ["cart", "household"], pay: ["payment"], pass: ["reservation", "pass"], sms: ["reservation", "lot"], scan: ["checkin", "pass"], facilities: ["facility", "amenity", "venue"], timeline: ["venue", "reservation", "price"], programs: ["program", "session"], dialog: ["session", "facility", "staff"], participants: ["participant", "eligibility"], permitStart: ["permit", "eligibility"], permitForm: ["permit"], permitDocs: ["permit", "payment"], permitStatus: ["permit"], today: ["lot", "capacity", "reservation"], counter: ["household", "reservation", "payment"], waitlist: ["waitlist", "session"], review: ["permit", "staff"], settings: ["price", "season", "capacity"], reports: ["payment"], scenario: ["listing"], catalog: ["listing"], compare: ["listing"], request: ["request"], vendor: ["listing"], validate: ["listing"] }
};

G.KZO = { SRC, CLASSES, RELATIONS, GOAL, USERS, NEEDS, FRUS, STAGES, BLOCKS, PATTERNS, CHECKS, EVIDENCE, REQ, GAPS, DOMAIN, build };
})(window);
