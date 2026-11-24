/* Kaizen Service Ontology · graph2d.js — 2D knowledge graph powered by D3 (v7), SVG.
   d3-force with concentric rings per layer (goal at the center), d3-zoom pan/zoom, d3-drag to move nodes,
   SVG glow filter, and flowing dashes along the selected chain. */
(function (G) {
"use strict";
const RM = G.matchMedia && G.matchMedia("(prefers-reduced-motion: reduce)").matches;

G.KZO.graph2d = (host, o) => {
  const d3 = G.d3, { layers } = o;
  const nodes = o.nodes.map(n => ({ ...n })), byId = new Map(nodes.map(n => [n.id, n]));
  const links = o.links.filter(l => byId.has(l.s) && byId.has(l.t)).map(l => ({ ...l, source: l.s, target: l.t }));
  nodes.forEach(n => { n.deg = 0; }); links.forEach(l => { byId.get(l.s).deg++; byId.get(l.t).deg++; });
  const RING = [0, 200, 320, 440, 550, 660];
  const r = n => n.big ? 11 : 4 + Math.min(6, Math.sqrt(n.deg) * 1.1);

  const svg = d3.select(host).append("svg").attr("class", "g2").attr("role", "img").attr("aria-label", "2D knowledge graph of the ontology. The side panel lists every node as text.");
  const defs = svg.append("defs");
  const glow = defs.append("filter").attr("id", "g2glow").attr("x", "-200%").attr("y", "-200%").attr("width", "500%").attr("height", "500%");
  glow.append("feGaussianBlur").attr("stdDeviation", 4.5).attr("result", "b");
  const fm = glow.append("feMerge"); fm.append("feMergeNode").attr("in", "b"); fm.append("feMergeNode").attr("in", "SourceGraphic");
  const root = svg.append("g");
  const gRings = root.append("g").attr("class", "g2-rings");
  const gLinks = root.append("g").attr("class", "g2-links");
  const gNodes = root.append("g").attr("class", "g2-nodes");

  gRings.selectAll("circle").data(layers.slice(1).map((name, i) => ({ name, R: RING[i + 1] }))).join("circle").attr("r", d => d.R);
  gRings.selectAll("text").data(layers.slice(1).map((name, i) => ({ name, R: RING[i + 1] }))).join("text").attr("x", 0).attr("y", d => -d.R - 8).attr("text-anchor", "middle").text(d => d.name.toUpperCase());

  const col = n => n._c || "#9DAAF2";
  function readPalette() { const cs = getComputedStyle(host); nodes.forEach(n => { n._c = cs.getPropertyValue(n.col).trim() || "#9DAAF2"; }); paint(); o.onTheme && o.onTheme(); }

  const linkSel = gLinks.selectAll("line").data(links).join("line").attr("class", d => "g2-l r-" + d.r + (d.kind === "weak" ? " weak" : ""));
  const relOff = new Set();
  const SYM = { sq: d3.symbolSquare, tri: d3.symbolTriangle, hex: d3.symbolWye, dia: d3.symbolDiamond, c: d3.symbolCircle };
  const hexPath = s => { let p = ""; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; p += (i ? "L" : "M") + (Math.cos(a) * s).toFixed(2) + "," + (Math.sin(a) * s).toFixed(2); } return p + "Z"; };
  const shapePath = n => n.shape === "hex" ? hexPath(r(n) * 1.15) : d3.symbol(SYM[n.shape] || d3.symbolCircle, Math.PI * r(n) * r(n) * (n.shape === "dia" ? 1.3 : 1.1))();
  const nodeSel = gNodes.selectAll("g").data(nodes).join("g").attr("class", "g2-n");
  nodeSel.append("path").attr("class", "halo").attr("d", n => d3.symbol(d3.symbolCircle, Math.PI * (r(n) * 2.6) ** 2)());
  nodeSel.append("path").attr("class", "core").attr("d", shapePath);
  const lab = nodeSel.append("g").attr("class", "lbl").attr("transform", n => `translate(${r(n) + 8},0)`);
  lab.append("rect").attr("class", "pill").attr("rx", 10).attr("ry", 10).attr("y", -10).attr("height", 20);
  lab.append("circle").attr("class", "tick").attr("cx", 9).attr("r", 3);
  const codeOf = n => n.code || (/^(R|P|Q)\d\d /.test(n.label) ? n.label.slice(0, 3) : "");
  const tx = lab.append("text").attr("x", 17).attr("y", 0).attr("dy", ".35em");
  tx.append("tspan").attr("class", "code").text(n => codeOf(n) ? codeOf(n) + "  " : "");
  tx.append("tspan").attr("class", "nm").text(n => { const c = codeOf(n), t = c ? n.label.slice(c.length + 1) : n.label; return t.length > 40 ? t.slice(0, 39).trimEnd() + "…" : t; });
  function sizePills() { lab.each(function () { const t = this.querySelector("text"); let w = 0; try { w = t.getComputedTextLength(); } catch (e) {} if (!w) return; this.querySelector("rect").setAttribute("width", w + 28); }); }

  // seed every layer evenly around its ring so the rings fill all the way round
  d3.groups(nodes, n => n.layer).forEach(([ly, arr]) => arr.forEach((n, i) => { const t = i / arr.length * Math.PI * 2 + ly * .37; n.x = Math.cos(t) * RING[ly]; n.y = Math.sin(t) * RING[ly]; if (ly === 0) { n.fx = 0; n.fy = 0; } }));
  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(l => l.kind === "weak" ? 140 : 90).strength(l => l.kind === "weak" ? .01 : .06))
    .force("charge", d3.forceManyBody().strength(-60).distanceMax(300))
    .force("collide", d3.forceCollide(n => r(n) + (n.big ? 26 : 9)))
    .force("ring", d3.forceRadial(n => RING[n.layer], 0, 0).strength(n => n.layer === 0 ? 1 : .9))
    .alphaDecay(.03).on("tick", ticked);
  if (RM) { sim.stop(); for (let i = 0; i < 300; i++) sim.tick(); ticked(); }
  function ticked() { linkSel.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y); nodeSel.attr("transform", n => `translate(${n.x},${n.y})`); }

  let K = 1;
  const zoom = d3.zoom().extent(() => [[0, 0], [host.clientWidth || 1, host.clientHeight || 1]]).scaleExtent([.25, 4]).on("zoom", e => { root.attr("transform", e.transform); K = e.transform.k; counterScale(); });
  function counterScale() { const inv = 1 / Math.max(.35, K); lab.attr("transform", n => `translate(${r(n) + 8 * inv},0) scale(${inv})`); gRings.selectAll("text").attr("font-size", 10 * inv).attr("y", d => -d.R - 8 * inv); }
  svg.call(zoom).on("dblclick.zoom", null);
  function fit(ms = 600) { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; const k = Math.min(w, h) / (RING[RING.length - 1] * 2 + 120); const t = d3.zoomIdentity.translate(w / 2, h / 2).scale(k); (ms && !RM && host.offsetParent ? svg.interrupt().transition().duration(ms) : svg.interrupt()).call(zoom.transform, t); }

  let moved = false;
  nodeSel.call(d3.drag().on("start", (e, n) => { moved = false; if (!e.active) sim.alphaTarget(.2).restart(); n.fx = n.x; n.fy = n.y; })
    .on("drag", (e, n) => { moved = true; n.fx = e.x; n.fy = e.y; })
    .on("end", (e, n) => { if (!e.active) sim.alphaTarget(0); if (n.layer !== 0) { n.fx = null; n.fy = null; } if (!moved) o.onPick && o.onPick(n); }));
  nodeSel.on("pointerenter", (e, n) => o.onHover && o.onHover(n, e)).on("pointermove", e => o.onMove && o.onMove(e)).on("pointerleave", () => o.onHover && o.onHover(null));
  svg.on("click", e => { if (e.target === svg.node()) o.onPick && o.onPick(null); });

  let hl = null, sel = null, hidden = null, focus = null;
  function paint() {
    const vis = n => !hidden || !hidden(n);
    nodeSel.attr("display", n => vis(n) ? null : "none")
      .classed("dim", n => hl ? !hl.has(n.id) : focus ? n.cls !== focus : false)
      .classed("lit", n => !!(hl && hl.has(n.id)) || n.big)
      .classed("sel", n => n.id === sel)
      .classed("showlabel", n => n.big || n.id === sel || !!(hl && hl.has(n.id) && hl.size <= 50) || (!hl && focus === n.cls));
    nodeSel.select(".core").style("fill", n => n.hollow ? "var(--kg-solid)" : col(n)).style("stroke", n => n.hollow ? col(n) : "none");
    nodeSel.select(".halo").attr("fill", col);
    nodeSel.select(".tick").style("fill", col); nodeSel.select(".pill").style("stroke", n => n.id === sel ? col(n) : null); if (host.clientWidth) sizePills();
    linkSel.attr("display", l => vis(l.source) && vis(l.target) && !relOff.has(l.r) ? null : "none")
      .classed("on", l => !!(hl && hl.has(l.source.id) && hl.has(l.target.id)))
      .classed("off", l => !!hl && !(hl.has(l.source.id) && hl.has(l.target.id)))
;
  }
  readPalette(); requestAnimationFrame(sizePills);
  new MutationObserver(readPalette).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  G.matchMedia && G.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readPalette);
  new ResizeObserver(() => { if (host.clientWidth) fit(0); }).observe(host);
  fit(0);
  const glowOn = () => getComputedStyle(host).getPropertyValue("--kg-mode").trim() === "dark";
  return {
    iconSVG(shape, colVar, hollow) { const n = { shape, deg: 9, big: false }, c = getComputedStyle(host).getPropertyValue(colVar).trim() || "#999";
      return `<svg width="22" height="22" viewBox="-11 -11 22 22" aria-hidden="true"><path d="${d3.symbol(d3.symbolCircle, Math.PI * 81)()}" fill="${c}" opacity=".18"/><path d="${shapePath(n)}" style="fill:${hollow ? "var(--kg-solid)" : c};stroke:${c};stroke-width:${hollow ? 1.6 : 0}" ${glowOn() && !hollow ? 'filter="url(#g2glow)"' : ""}/></svg>`; },
    highlight(set) { hl = set; paint(); }, select(id) { sel = id; paint(); }, setFocus(c) { focus = c; paint(); },
    setHidden(fn) { hidden = fn; paint(); }, setRelOff(set) { relOff.clear(); set.forEach(x => relOff.add(x)); paint(); }, reset() { fit(); },
    frame(id) { const n = byId.get(id); if (!n || !host.clientWidth || !isFinite(n.x)) return; const w = host.clientWidth, h = host.clientHeight, k = 1.25; (RM ? svg.interrupt() : svg.interrupt().transition().duration(700)).call(zoom.transform, d3.zoomIdentity.translate(w / 2 - n.x * k, h / 2 - n.y * k).scale(k)); }
  };
};
})(window);
