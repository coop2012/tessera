/* Tessera page logic. Geometry runs in cad-worker.js; Claude runs through the `sample` capability. */

/* ---------- examples (pre-built so the page opens in a working state) ---------- */
const EXAMPLES = {
  pi: {
    instructions: "A two-piece case for a Raspberry Pi 4 with a 30 mm fan on the lid. Leave the USB and Ethernet end open, raise the board on its mounting holes, and add vent slots under the CPU.",
    parts: "Raspberry Pi 4 Model B\n30x30x10 mm 5V fan\n4x M2.5 x 6 screws",
    spec: {
      title: "Raspberry Pi 4 case (example)",
      components: [
        { name: "Raspberry Pi 4 Model B", dims: "PCB 85 × 56 × 1.4 mm; holes Ø2.7 mm on 58 × 49 mm, 3.5 mm from edge", source: "", basis: "Raspberry Pi mechanical drawing" },
        { name: "30 mm fan", dims: "30 × 30 × 10 mm; screw holes 24 mm apart", source: "", basis: "Common 3010 fan standard" },
        { name: "M2.5 × 6 screw", dims: "Pilot hole Ø2.2 mm for self-tapping in plastic", source: "", basis: "ISO 7380 / printing practice" },
      ],
      assumptions: ["Example: only the USB/Ethernet end is cut open; the side ports are left for the designer to add."],
      print_notes: ["Base upright, lid upside down; no supports.", "0.2 mm layers, 3 walls, 20% gyroid."],
      design_notes: ["0.6 mm clearance around the PCB.", "4 mm standoffs so parts under the board clear the floor."],
      hardware: ["4 × M2.5 × 6 self-tapping screws", "1 × 30 mm 5 V fan"],
    },
    code: `function main(r, p) {
  // Raspberry Pi 4: 85 x 56 x 1.4 mm PCB, M2.5 holes on a 58 x 49 mm pattern, 3.5 mm in from the corner
  const pcb = { w: 85, d: 56, t: 1.4 };
  const wall = p.wall ?? 2, gap = 0.6, floor = 2, standoff = 4, inner = 22;
  const W = pcb.w + 2 * gap + 2 * wall, D = pcb.d + 2 * gap + 2 * wall, H = floor + inner;

  let base = r.drawRoundedRectangle(W, D, 3).sketchOnPlane("XY").extrude(H);
  base = base.shell(wall, (f) => f.inPlane("XY", H));
  const ox = -pcb.w / 2 + 3.5, oy = -pcb.d / 2 + 3.5;
  for (const [x, y] of [[0, 0], [58, 0], [0, 49], [58, 49]]) {
    base = base.fuse(r.makeCylinder(3, standoff, [ox + x, oy + y, floor]).cut(r.makeCylinder(1.1, standoff, [ox + x, oy + y, floor])));
  }
  base = base.cut(r.makeBaseBox(10, 50, 16).translate([W / 2, 0, floor + standoff + pcb.t]));
  for (let i = -3; i <= 3; i++) base = base.cut(r.makeBaseBox(2, 24, floor + 1).translate([-10 + i * 4, 0, -0.5]));

  let lid = r.drawRoundedRectangle(W, D, 3).sketchOnPlane("XY", H + 4).extrude(2);
  const lip = r.drawRoundedRectangle(W - 2 * wall - 0.4, D - 2 * wall - 0.4, 1.5)
    .cut(r.drawRoundedRectangle(W - 2 * wall - 3.6, D - 2 * wall - 3.6, 1))
    .sketchOnPlane("XY", H + 1).extrude(3);
  lid = lid.fuse(lip).cut(r.makeCylinder(14, 10, [-8, 0, H]));
  for (const [x, y] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) lid = lid.cut(r.makeCylinder(1.6, 10, [-8 + x, y, H]));

  const board = r.makeBaseBox(pcb.w, pcb.d, pcb.t).translate([0, 0, floor + standoff]);
  return [
    { name: "case_base", shape: base },
    { name: "case_lid", shape: lid, color: "#29335c" },
    { name: "pi4_board", shape: board, color: "#2e7d32", printable: false },
  ];
}`,
  },
  owl: {
    instructions: "A small desk owl figurine about 65 mm tall: round body, big eyes, ear tufts, folded wings, sitting on a turned round base. Prints in one piece without supports.",
    parts: "",
    spec: {
      title: "Desk owl (example)",
      components: [],
      assumptions: ["Example: an original figurine built from ellipsoids, a revolved base and a lofted crest."],
      design_notes: ["Body and head are overlapping ellipsoids, so they fuse into one smooth solid.", "Flat 6 mm base keeps it stable and gives a clean first layer."],
      print_notes: ["Print upright on the base.", "Supports off; the eye sockets and beak stay under 45°.", "0.12–0.16 mm layers for the curves."],
      hardware: [],
    },
    code: `function main(r, p) {
  // Original owl: ellipsoid body + head, tufts, wings, eyes, beak, revolved base
  const body = r.makeEllipsoid(18, 15, 22).translate([0, 0, 24]);
  const head = r.makeEllipsoid(15, 13, 12).translate([0, 0, 50]);
  let owl = body.fuse(head);
  for (const s of [-1, 1]) {
    owl = owl.fuse(r.makeEllipsoid(5, 3, 6).rotate(s * 25, [0, 0, 0], [0, 1, 0]).translate([s * 8, -4, 60])); // ear tufts
    owl = owl.cut(r.makeSphere(4).translate([s * 6, -12, 52]));                                            // eye sockets
    owl = owl.fuse(r.makeSphere(2.6).translate([s * 6, -10.5, 52]));                                       // pupils
    owl = owl.fuse(r.makeEllipsoid(4, 10, 16).rotate(s * 12, [0, 0, 0], [0, 1, 0]).translate([s * 16, 0, 26])); // wings
  }
  owl = owl.fuse(r.drawEllipse(3, 2.4).sketchOnPlane("XZ", 10).loftWith([r.drawCircle(0.5).sketchOnPlane("XZ", 15.5)])
    .rotate(-12, [0, 0, 0], [1, 0, 0]).translate([0, 0, 46]));                                            // lofted beak
  owl = owl.cut(r.makeBaseBox(80, 80, 10).translate([0, 0, -8]));                                        // flat bottom
  const base = r.draw([0, 0]).lineTo([22, 0]).lineTo([22, 3]).smoothSplineTo([18, 6]).lineTo([0, 6]).close()
    .sketchOnPlane("XZ").revolve([0, 0, 1]);
  owl = owl.fuse(base);
  return [{ name: "desk_owl", shape: owl, color: "#c9803e" }];
}`,
  },
};

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ICON = {
  dot: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3" fill="currentColor"/></svg>',
  ok: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="var(--ok)" stroke-width="1.6"/><path d="M4.8 8.2 7 10.3l4.2-4.6" fill="none" stroke="var(--ok)" stroke-width="1.6"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1z" fill="none" stroke="var(--warn)" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v4M8 11.6v.6" stroke="var(--warn)" stroke-width="1.6"/></svg>',
  bad: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="var(--bad)" stroke-width="1.6"/><path d="M5.5 5.5l5 5m0-5-5 5" stroke="var(--bad)" stroke-width="1.6"/></svg>',
  search: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M7.7 7.7 11 11" stroke="currentColor" stroke-width="1.4"/></svg>',
  page: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1h5l2 2v8h-7z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  cube: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1 11 3.5v5L6 11 1 8.5v-5z M1 3.5 6 6l5-2.5M6 6v5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  eye: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6s2-3.5 5-3.5S11 6 11 6 9 9.5 6 9.5 1 6 1 6z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/></svg>',
  think: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="2 2"/></svg>',
};
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 3400); }
function chip(id, state, text) { const c = $(id); c.className = "chip " + state; c.lastChild.textContent = text; }
function logLine(icon, html, cls = "") {
  $("logBox").hidden = false;
  const li = document.createElement("li"); if (cls) li.className = cls;
  li.innerHTML = `${ICON[icon] || ICON.dot}<span>${html}</span>`;
  $("log").append(li); $("logBox").scrollTop = 1e6; return li;
}
const settings = () => ({
  bed: [+$("bedX").value, +$("bedY").value, +$("bedZ").value], nozzle: +$("nozzle").value,
  wall: +$("wall").value, clearance: +$("clear").value, material: $("material").value.trim() || "PLA",
});
const store = {
  get() { try { return JSON.parse(localStorage.getItem("tessera-v1") || localStorage.getItem("partsmith-v2") || "null"); } catch { return null; } },
  set(v) { try { localStorage.setItem("tessera-v1", JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const errText = (e) => String(e?.message || e?.code || e).slice(0, 700);

/* ---------- activity: always show that work is moving ---------- */
const HINTS = {
  research: ["Working out what the brief implies", "Looking for real dimensions", "Comparing common design styles", "Choosing a direction"],
  design: ["Planning the geometry", "Placing parts and clearances", "Writing the model", "Checking it builds"],
  review: ["Studying the renders", "Looking for weak or crude areas", "Refining shape and detail", "Rebuilding"],
};
const STEP_NAMES = { research: "Research", design: "Design", review: "Review" };
const activity = {
  start(steps) {
    this.steps = steps; this.t0 = Date.now(); this.mark = Date.now(); this.detail = ""; this.stage = null;
    $("actSteps").innerHTML = steps.map((k) => `<li data-s="${k}">${STEP_NAMES[k]}</li>`).join("");
    $("activity").hidden = false; $("plate").classList.add("working");
    clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 500); this.tick();
  },
  go(stage, title) {
    this.stage = stage; this.title = title; this.mark = Date.now(); this.detail = "";
    let seen = false;
    $("actSteps").querySelectorAll("li").forEach((li) => {
      const here = li.dataset.s === stage; if (here) seen = true;
      li.className = here ? "on" : seen ? "" : "done";
    });
    this.tick();
  },
  set(detail) { this.detail = detail; this.mark = Date.now(); this.tick(); },
  tick() {
    const now = Date.now(), all = Math.floor((now - this.t0) / 1000), quiet = Math.floor((now - this.mark) / 1000);
    $("actTime").textContent = `${Math.floor(all / 60)}:${String(all % 60).padStart(2, "0")}`;
    $("actStage").textContent = this.title || "Working";
    let d = this.detail;
    if (!d || quiet > 8) {
      const hints = HINTS[this.stage] || ["Working"];
      d = `Claude is thinking · ${hints[Math.floor(all / 7) % hints.length]}…`;
    }
    $("actDetail").textContent = d;
  },
  stop() {
    clearInterval(this.timer);
    $("actSteps").querySelectorAll("li").forEach((li) => (li.className = "done"));
    $("plate").classList.remove("working");
    setTimeout(() => { if (!busy) $("activity").hidden = true; }, 1200);
  },
};
const streaming = (label) => ({ onText: ({ text }) => activity.set(`${label} · ${text.length.toLocaleString()} characters`) });

/* ---------- state ---------- */
let viewer, engine, kernelReady = false, current = null, sampleFn = null, canSeeImages = false, mcp = null, webOn = false, busy = null;
const visibility = {};

/* ---------- tabs ---------- */
document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
  document.querySelectorAll(".tabpanel").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
}));

/* ---------- build + render ---------- */
async function build(code, spec, { keepView = false } = {}) {
  const res = await engine.run(code, settings());
  current = { ...(current || {}), code, spec: spec || current?.spec || {}, ...res };
  if (!keepView) viewer.framed = false;
  viewer.show(res.meshes, visibility);
  render();
  $("exportBtn").disabled = false;
  return res;
}
function bedChecks(res) {
  const s = settings(), out = [];
  const bed = [...s.bed].sort((a, b) => b - a);
  for (const r of res.report.filter((x) => x.printable)) {
    const sz = [...r.size_mm].sort((a, b) => b - a);
    if (sz.some((v, i) => v > bed[i])) out.push({ level: "bad", text: `<b>${esc(r.name)}</b> (${r.size_mm.join(" × ")} mm) does not fit a ${s.bed.join(" × ")} mm bed in any orientation.` });
    if (r.min_mm[2] < -0.05) out.push({ level: "warn", text: `<b>${esc(r.name)}</b> dips ${(-r.min_mm[2]).toFixed(1)} mm below the build plate.` });
  }
  return out;
}
function render() {
  const { spec, report, clashes, meshes } = current;
  $("modelTitle").textContent = spec.title || "Untitled design";
  const printable = report.filter((r) => r.printable);
  const vol = printable.reduce((a, r) => a + (r.volume_cm3 || 0), 0);
  const dens = { PLA: 1.24, PETG: 1.27, ABS: 1.04, ASA: 1.07, TPU: 1.21, NYLON: 1.14 }[settings().material.toUpperCase()] || 1.24;
  $("modelMeta").textContent = `${printable.length} printable · ${report.length - printable.length} reference · ≤${(vol * dens).toFixed(0)} g ${settings().material} at 100% infill`;
  const comps = spec.components || [];
  $("nParts").textContent = comps.length || "";
  $("specRows").innerHTML = comps.map((c) => {
    const src = c.source && /^https?:\/\//.test(c.source)
      ? `<span class="pill web">web</span> <a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(c.source.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60))}</a>`
      : `<span class="pill mem">known spec</span> ${esc(c.basis || "")}`;
    return `<tr><td>${esc(c.name)}${c.inferred ? ' <span class="pill inf" title="Not in your list; the brief implies it">inferred</span>' : ""}</td><td class="num" style="white-space:normal">${esc(c.dims)}</td><td>${src}</td></tr>`;
  }).join("") || `<tr><td colspan="3" class="note">No purchased parts — this is a free-form design.</td></tr>`;
  $("bodyRows").innerHTML = report.map((r, i) => `<tr>
    <td><span class="swatch" style="background:${esc(meshes[i].color)}"></span>${esc(r.name)}</td>
    <td><input type="checkbox" id="vis_${i}" data-name="${esc(r.name)}" ${visibility[r.name] === false ? "" : "checked"} aria-label="Show ${esc(r.name)}"></td>
    <td class="num">${r.size_mm.map((v) => v.toFixed(1)).join(" × ")}</td>
    <td class="num">${r.volume_cm3 == null ? "—" : r.volume_cm3.toFixed(1) + " cm³"}</td>
    <td>${r.printable ? '<span class="pill">print</span>' : '<span class="pill">reference</span>'}</td></tr>`).join("");
  $("bodyRows").querySelectorAll("input").forEach((cb) => cb.addEventListener("change", () => { visibility[cb.dataset.name] = cb.checked; viewer.setVisible(cb.dataset.name, cb.checked); }));
  const bc = bedChecks(current);
  const checks = [
    ...(clashes.length ? [] : [{ level: "ok", text: report.length > 1 ? "No bodies overlap; every reference part has room." : "Single solid body." }]),
    ...(bc.some((c) => c.level === "bad") ? [] : [{ level: "ok", text: `Every printable body fits the ${settings().bed.join(" × ")} mm bed.` }]),
    ...clashes.map((c) => ({ level: "bad", text: `<b>${esc(c.between[0])}</b> and <b>${esc(c.between[1])}</b> overlap by ${c.overlap_mm3} mm³.` })),
    ...bc,
    ...(spec.assumptions || []).map((a) => ({ level: "warn", text: esc(a) })),
  ];
  $("nChecks").textContent = checks.filter((c) => c.level !== "ok").length || "";
  $("checkList").innerHTML = checks.map((c) => `<li>${ICON[c.level]}<span>${c.text}</span></li>`).join("");
  const list = (h, a) => (a?.length ? `<div><h3>${h}</h3><ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "");
  const link = (u) => /^https?:\/\//.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 70))}</a>` : esc(u);
  const dir = spec.style?.chosen ? `<div><h3>Design direction</h3><p><b>${esc(spec.style.chosen)}</b>${spec.style.why ? ` ${esc(spec.style.why)}` : ""}</p>${spec.style.alternatives?.length ? `<p class="note">Also considered: ${spec.style.alternatives.map(esc).join(" · ")}</p>` : ""}${spec.style.sources?.length ? `<ul>${spec.style.sources.map((u) => `<li>${link(u)}</li>`).join("")}</ul>` : ""}</div>` : "";
  $("notes").innerHTML = ((spec.summary ? `<p>${esc(spec.summary)}</p>` : "") + dir + list("Requirements", spec.requirements) + list("Design decisions", spec.design_notes) + list("Printing", spec.print_notes) + list("Hardware to buy", spec.hardware)) || '<p class="note">No notes.</p>';
  $("code").value = current.code;
}

/* ---------- designer prompts ---------- */
const API = `REPLICAD API (OpenCascade B-rep). Units mm, Z up, build plate = XY plane at z=0. Plain synchronous JavaScript, no imports.
2D DRAWINGS (centered on origin): r.drawRectangle(w,h), r.drawRoundedRectangle(w,h,radius), r.drawCircle(rad), r.drawEllipse(rx,ry), r.drawPolysides(rad,sides)
  Free profiles with the pen: r.draw([x,y]).lineTo([x,y]).hLine(dx).vLine(dy).line(dx,dy).threePointsArcTo(end,mid).sagittaArcTo(end,sagitta)
    .smoothSplineTo([x,y]).cubicBezierCurveTo(end,ctrl1,ctrl2).close()
  Drawing ops: d.translate([x,y]), d.rotate(deg,[cx,cy]), d.scale(f), d.mirror([x,y]) , d.cut(d2), d.fuse(d2), d.offset(dist)
  To 3D: d.sketchOnPlane("XY"|"XZ"|"YZ", offsetOrOrigin) then
    .extrude(h)                         straight prism (on "XZ" the drawing's y is world Z)
    .revolve([0,0,1])                   lathe a profile drawn on "XZ" (x = radius, y = height) around the Z axis → vases, bases, knobs, bodies of revolution
    .loftWith([sketch2, sketch3], {ruled:false})   smooth blend through sketches at different heights → tapered, organic transitions
PRIMITIVES: r.makeBaseBox(x,y,z) (XY-centered, z 0→z), r.makeBox([x0,y0,z0],[x1,y1,z1]), r.makeCylinder(rad,h,[x,y,z],[dx,dy,dz]),
  r.makeSphere(rad), r.makeEllipsoid(a,b,c) (semi-axes along X,Y,Z; centered at origin)
SOLID OPS — every op RETURNS A NEW SHAPE and INVALIDATES the receiver and argument. Use s.clone() before reusing a shape.
  s.fuse(t), s.cut(t), s.intersect(t), s.translate([x,y,z]), s.rotate(deg,[cx,cy,cz],[ax,ay,az]), s.mirror("YZ"|"XZ"|"XY"), s.scale(f,[cx,cy,cz])
  s.shell(t, f => f.inPlane("XY", zTop)) hollow out leaving that face open
  s.fillet(rad, e => e.inDirection("Z"))  s.chamfer(d, e => e.inPlane("XY", z))   — fillet simple edges only; wrap in try/catch and skip if it throws
RETURN from main(r, p): [{ name: "snake_case", shape, color: "#hex", printable: true|false }]
  p = { bed:[x,y,z], nozzle, wall, clearance, material }.`;

const CRAFT = `DESIGN CRAFT
For things that hold or fit purchased parts: model every purchased part as a simple reference body (printable:false) in its installed position, apply the clearance to every fit, size screw bosses to the screw (self-tap pilot ≈ 0.85 × thread diameter), keep walls ≥ 3 × nozzle, add cable/port openings, avoid overhangs past 45°.
For sculpted or decorative things (figurines, creatures, toys, vases, ornaments): build the silhouette from overlapping ellipsoids and spheres, lathed (revolve) profiles and lofts; overlap pieces 20–40% so fused joints read as smooth; add the details that make it recognisable (eyes, brows, ears, limbs, texture lines, surface grooves cut with thin cylinders or tori-like revolves); give it a flat base or flat cut bottom for bed adhesion; minimum printable feature ≈ 1.2 mm, thin protrusions ≥ 2 mm thick; aim for the requested size and keep it printable without supports where possible.
Performance: each boolean on curved bodies costs time; keep it under ~120 operations; fuse small details into the main body as you go. A single build must finish in under 90 s.
Originality: design original creatures and objects. If the brief asks for a trademarked or copyrighted character, design an original character in a similar spirit instead and say so in assumptions.`;

function briefText() {
  const s = settings();
  return `INSTRUCTIONS:\n${$("instructions").value.trim()}\n\nPARTS TO USE / FIT:\n${$("parts").value.trim() || "(none — free-form design)"}\n\nPRINTER: bed ${s.bed.join(" x ")} mm, nozzle ${s.nozzle} mm, material ${s.material}, default wall ${s.wall} mm, fit clearance ${s.clearance} mm.`;
}

/* ---------- page tools offered to Claude ---------- */
let browserLock = Promise.resolve();
function viaBrowser(fn) { const run = browserLock.then(fn, fn); browserLock = run.catch(() => {}); return run; }
async function pageText(url, max) {
  try {
    await mcp.callTool("host:claude_browser", "navigate", { url });
    const res = await mcp.callTool("host:claude_browser", "get_page_text", { max_chars: max });
    const p = res.payload ?? res.content?.find?.((b) => b.type === "text")?.text;
    return (typeof p === "string" ? p : JSON.stringify(p)).slice(0, max);
  } catch (e) {
    throw new Error(`Browser lookup failed (${e?.code || e?.message || e}). Fall back to well-established published dimensions.`);
  }
}
const researchTools = () => [
  {
    name: "web_search",
    description: "Search the web for a part's datasheet or mechanical drawing. Returns result titles, URLs and snippets as plain text.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    async execute({ query }) {
      if (!webOn) throw new Error("Live web lookup is not available in this view. Use well-established published dimensions and say so in basis.");
      const q = String(query).slice(0, 200);
      logLine("search", `Searching <b>${esc(q)}</b>`); activity.set(`Searching the web: “${q.slice(0, 60)}”`);
      return viaBrowser(() => pageText("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), 5000));
    },
  },
  {
    name: "read_page",
    description: "Open a web page (datasheet, product page, spec sheet) and return its visible text, up to about 9000 characters.",
    inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] },
    async execute({ url }) {
      if (!webOn) throw new Error("Live web lookup is not available in this view.");
      const u = String(url); if (!/^https?:\/\//.test(u)) throw new Error("Pass a full http(s) URL.");
      logLine("page", `Reading <code>${esc(u.slice(0, 90))}</code>`); activity.set(`Reading ${u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 50)}`);
      return viaBrowser(() => pageText(u, 9000));
    },
  },
];
/** run_cad remembers the last code that built cleanly, so a bad final answer never loses a good model. */
function cadTool(track) {
  return {
    name: "run_cad",
    description: "Build the model from replicad source defining function main(r, p). Returns each body's bounding box (mm) and volume, overlaps between bodies, printer-bed problems — or the error if it failed. Call it, read the result, fix, call again.",
    inputSchema: { type: "object", properties: { code: { type: "string" } }, required: ["code"] },
    async execute({ code }, ctx) {
      track.n = (track.n || 0) + 1;
      const li = logLine("cube", "Building…"); activity.set(`Building in the CAD kernel · attempt ${track.n}`);
      try {
        const res = await build(String(code), null, { keepView: !!track.good });
        if (ctx?.signal?.aborted) return "cancelled";
        activity.set(`Attempt ${track.n} built in ${(res.ms / 1000).toFixed(1)} s${res.clashes.length ? ` · ${res.clashes.length} overlap(s) to fix` : " · clean"}`);
        track.good = String(code);
        li.innerHTML = `${ICON.cube}<span>Built ${res.report.length} ${res.report.length === 1 ? "body" : "bodies"} in ${(res.ms / 1000).toFixed(1)} s${res.clashes.length ? ` · <b>${res.clashes.length} overlap(s)</b>` : ""}</span>`;
        return { bodies: res.report, clashes: res.clashes, bed_problems: bedChecks(res).map((x) => x.text.replace(/<[^>]+>/g, "")) };
      } catch (e) {
        li.className = "err"; li.innerHTML = `${ICON.cube}<span>Build error: ${esc(errText(e).slice(0, 160))}</span>`;
        activity.set(`Attempt ${track.n} failed · Claude is fixing it`);
        throw new Error(errText(e));
      }
    },
  };
}

const SPEC_SHAPE = `{"title": string,
 "components": [{"name": string, "dims": string (every number in mm the model needs), "source": string (URL you read, or ""), "basis": string (document, standard or typical-value source), "inferred": boolean (true if the user did not list it but the brief implies it)}],
 "requirements": [string] (concrete design requirements you inferred from the brief, with numbers: counts, sizes, clearances, mounting),
 "style": {"chosen": string (the design style/approach you picked, one sentence), "why": string, "alternatives": [string], "sources": [string (URLs that informed it)]},
 "assumptions": [string], "hardware": [string]}`;
const RESULT_SHAPE = `{"title": string, "summary": string (2-3 sentences), "code": string (the final source that built cleanly), "cadquery": string (equivalent CadQuery Python script exporting each printable body to STL and the assembly to STEP), "design_notes": [string], "print_notes": [string (orientation, supports, layer height, infill)], "assumptions": [string], "hardware": [string]}`;

async function research(signal) {
  activity.go("research", "Researching the brief");
  logLine("think", `<b>${webOn ? "Researching dimensions and design styles" : "Working out dimensions and style (web lookup off)"}</b>`);
  const spec = await sampleFn.json(`You are the research step of a 3D-printing design assistant. The user's brief may be short or vague. Your job is to turn it into a precise, buildable spec using real data instead of guesses.

1. LISTED PARTS: find exact mechanical dimensions for every listed part (outline, mounting holes, connectors, keep-outs).
2. IMPLIED ITEMS: work out what the object must hold, fit or interface with even if not listed, and find REAL typical dimensions for them. Examples: "5-slot cable organizer" → typical diameters of USB-C, Lightning, micro-USB, laptop and HDMI cables, and connector head sizes so the head can't pull through; "phone stand" → common phone widths/thicknesses with cases and camera bump; "headphone hook" → headband widths; "desk clip" → common desk thicknesses; "spice rack" → standard jar diameters. Prefer measured/published numbers over guesses, and design for the common range.
3. STYLE: find how this kind of object is usually designed (e.g. popular 3D-print models, retail products) — the main styles and the design choices people like (mounting method, open vs enclosed, snap-fit vs screws, aesthetic). Pick the style that best fits the brief and explain why; list the strongest alternatives.
4. REQUIREMENTS: write concrete, numbered requirements with values (counts, sizes, clearances, wall thicknesses, mounting).
${webOn ? "Use web_search and read_page: search for datasheets/measurements AND for popular designs of this object (e.g. on printables.com, makerworld.com, product pages). Read at most 5 pages; keep queries specific." : "Live lookup is off: use well-established published specs and typical measured values, and say so in basis."}
Never ask the user questions: decide, and record each decision as an assumption.

${briefText()}

Reply with only JSON: ${SPEC_SHAPE}`, { tools: researchTools(), signal, modelTier: "complex", ...streaming("Writing up the research") });
  if (!spec || !Array.isArray(spec.components)) throw new Error("The research step returned an unreadable spec.");
  const inferred = spec.components.filter((c) => c.inferred).length;
  logLine("ok", `Spec ready: ${spec.components.length} component(s)${inferred ? `, ${inferred} inferred` : ""}${spec.style?.chosen ? ` · style: ${esc(spec.style.chosen.slice(0, 80))}` : ""}`);
  return spec;
}

async function design(spec, signal, changeRequest) {
  activity.go("design", changeRequest ? "Revising the model" : "Designing the model");
  logLine("think", `<b>${changeRequest ? "Revising the model" : "Designing and test-building"}</b>`);
  const track = { good: null };
  const prior = changeRequest ? `\nCURRENT MODEL SOURCE:\n${current.code}\n\nCHANGE REQUESTED: ${changeRequest}\nKeep everything else unless the change requires it.` : "";
  const comps = [
    spec.components?.length ? `COMPONENT DIMENSIONS (researched; "inferred" ones are implied by the brief):\n${JSON.stringify(spec.components, null, 1)}` : "No purchased parts: this is a free-form design. Decide the overall size and break the form into primitives, then build it.",
    spec.requirements?.length ? `REQUIREMENTS:\n- ${spec.requirements.join("\n- ")}` : "",
    spec.style?.chosen ? `CHOSEN STYLE: ${spec.style.chosen}\nWhy: ${spec.style.why || ""}` : "",
  ].filter(Boolean).join("\n\n");
  let out;
  try {
    out = await sampleFn.json(`You are an expert mechanical designer and digital sculptor making 3D-printable models with replicad (JavaScript over OpenCascade).
${briefText()}

${comps}
${prior}

${API}

${CRAFT}

Process: write the model, call run_cad, read the sizes/overlaps, fix and call again until it builds cleanly and matches the brief. Prefer one strong complete model over many small attempts.

Reply with only JSON: ${RESULT_SHAPE}`, { tools: [cadTool(track)], signal, modelTier: "complex", ...streaming("Writing the model") });
  } catch (e) {
    if (e?.code === "invalid_json" && track.good) { logLine("warn", "The designer's write-up was unreadable; keeping the last model that built."); out = { code: track.good }; }
    else throw e;
  }
  return finalize(out, track, spec);
}

async function finalize(out, track, spec) {
  const merged = {
    ...spec, ...out, components: spec.components || [],
    assumptions: [...new Set([...(spec.assumptions || []), ...(out.assumptions || [])])],
    hardware: out.hardware?.length ? out.hardware : spec.hardware,
  };
  delete merged.code; delete merged.cadquery;
  if (out.cadquery) current = { ...(current || {}), cadquery: out.cadquery };
  try {
    await build(out.code || track.good, merged, { keepView: true });
    return out.code || track.good;
  } catch (e) {
    if (!track.good || track.good === out.code) throw e;
    logLine("warn", `Final code failed (${esc(errText(e).slice(0, 100))}); using the last version that built.`);
    await build(track.good, merged, { keepView: true });
    return track.good;
  }
}

async function visualReview(signal, focus) {
  if (!canSeeImages) { logLine("warn", "Visual review needs image access, which this view doesn't have. Skipped."); return; }
  activity.go("review", "Reviewing the renders");
  activity.set("Rendering 5 views of the model");
  logLine("eye", "<b>Reviewing renders</b> from 5 angles");
  const images = await viewer.views(["iso", "back", "front", "side", "top"]);
  const track = { good: current.code };
  let out;
  try {
    out = await sampleFn.json(`You are reviewing a 3D-printable model against its brief. The 5 attached images are renders of the current model: 1 isometric from front-right, 2 isometric from back-left, 3 front (from -Y, slightly above), 4 right side (from +X, slightly above), 5 top-down. Z is up. Purchased parts appear translucent.
${briefText()}
${focus ? `\nUSER'S FOCUS FOR THIS PASS: ${focus}\n` : ""}
CURRENT MODEL SOURCE:
${current.code}

CURRENT MEASUREMENTS: ${JSON.stringify({ bodies: current.report, clashes: current.clashes })}

${API}

${CRAFT}

Look hard at the renders. List what is wrong or missing: proportions, missing recognisable features, crude or blocky areas that should be rounded, floating or disconnected pieces, parts sunk below z=0, fit problems, unprintable overhangs or thin bits. Then improve the model: refine shapes, add detail, fix every problem. Verify with run_cad (it must still build). Keep what already works.

Reply with only JSON: {"issues_found": [string], "code": string, "design_notes": [string], "print_notes": [string], "summary": string}`,
      { tools: [cadTool(track)], images, signal, modelTier: "complex", ...streaming("Writing the improvements") });
  } catch (e) {
    if (e?.code === "invalid_json" && track.good) out = { code: track.good }; else throw e;
  }
  (out.issues_found || []).slice(0, 6).forEach((t) => logLine("dot", esc(t)));
  const spec = { ...current.spec, ...(out.summary ? { summary: out.summary } : {}),
    design_notes: out.design_notes?.length ? out.design_notes : current.spec.design_notes,
    print_notes: out.print_notes?.length ? out.print_notes : current.spec.print_notes };
  await finalize({ ...spec, code: out.code }, track, spec);
}

/* ---------- run orchestration ---------- */
async function runDesigner(kind, text) {
  if (!sampleFn) { toast("The designer needs Claude, which isn't available in this view. You can still edit and run the source."); return; }
  if (!kernelReady) { toast("The CAD kernel is still loading."); return; }
  const ctl = new AbortController(); busy = ctl;
  setBusy(true);
  $("log").innerHTML = "";
  const t0 = Date.now();
  activity.start(kind === "new" ? ["research", "design", ...($("review").checked ? ["review"] : [])] : kind === "revise" ? ["design"] : ["review"]);
  try {
    if (kind === "new") {
      const spec = await research(ctl.signal);
      await design(spec, ctl.signal);
      if ($("review").checked) await visualReview(ctl.signal);
    } else if (kind === "revise") {
      await design(current.spec, ctl.signal, text);
    } else if (kind === "polish") {
      await visualReview(ctl.signal, text);
    }
    viewer.frame();
    logLine("ok", `<b>Done</b> in ${Math.round((Date.now() - t0) / 1000)} s.`);
    store.set({ instructions: $("instructions").value, parts: $("parts").value, spec: current.spec, code: current.code, cadquery: current.cadquery });
  } catch (e) {
    const code = e?.code;
    if (code === "cancelled") logLine("dot", "Stopped.");
    else if (code === "not_granted" || code === "sampling_disabled") { logLine("bad", "Claude access was declined for this page, so the designer is off. Editing and running the source still works.", "err"); chip("chipClaude", "err", "Designer: not allowed"); }
    else if (code === "rate_limited") logLine("bad", "Usage limit reached. Wait a while, then try again.", "err");
    else if (code === "refused") logLine("bad", "Claude declined this brief. Change what it asks for and try again.", "err");
    else logLine("bad", esc(errText(e)), "err");
  } finally { busy = null; setBusy(false); activity.stop(); }
}
function setBusy(on) {
  for (const id of ["designBtn", "refineBtn", "polishBtn", "runBtn"]) $(id).disabled = on;
  $("stopBtn").hidden = !on;
  $("designBtn").classList.toggle("loading", on);
  $("designLabel").textContent = on ? "Designing…" : "Design it";
}

/* ---------- wiring ---------- */
$("briefForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!$("instructions").value.trim()) { toast("Describe what you want to build first."); return; }
  $("briefNote").hidden = true;
  runDesigner("new");
});
$("refineForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("refine").value.trim(); if (!v || !current) return;
  $("refine").value = ""; runDesigner("revise", v);
});
$("polishBtn").addEventListener("click", () => { const v = $("refine").value.trim(); $("refine").value = ""; runDesigner("polish", v); });
$("stopBtn").addEventListener("click", () => busy?.abort());
$("runBtn").addEventListener("click", async () => {
  $("runNote").textContent = "Building…"; $("runBtn").disabled = true; $("plate").classList.add("working");
  try { const r = await build($("code").value, current?.spec, { keepView: true }); $("runNote").textContent = `Built ${r.report.length} bodies in ${(r.ms / 1000).toFixed(1)} s.`; }
  catch (e) { $("runNote").textContent = "Error: " + errText(e); }
  finally { $("runBtn").disabled = false; $("plate").classList.remove("working"); }
});
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("code").value); toast("Code copied"); }
  catch { $("code").select(); toast("Press Ctrl+C to copy"); }
});
$("edgesBtn").addEventListener("click", () => { const on = $("edgesBtn").getAttribute("aria-pressed") !== "true"; $("edgesBtn").setAttribute("aria-pressed", on); viewer.setEdges(on); });
$("frameBtn").addEventListener("click", () => viewer.frame());
["bedX", "bedY", "bedZ", "material"].forEach((id) => $(id).addEventListener("change", () => current && render()));
document.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => loadExample(b.dataset.ex)));

async function loadExample(key) {
  const ex = EXAMPLES[key];
  $("instructions").value = ex.instructions; $("parts").value = ex.parts;
  if (!kernelReady) return;
  current = { cadquery: null };
  try { await build(ex.code, ex.spec); } catch (e) { toast("Example failed to build: " + errText(e)); }
}

$("exportBtn").addEventListener("click", async () => {
  const downloads = await window.claude?.use?.("downloads");
  if (!downloads) { toast("Downloads aren't available in this view."); return; }
  $("exportBtn").disabled = true;
  try {
    const s = current.spec;
    const slug = (s.title || "design").toLowerCase().replace(/\(example\)/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "design";
    const li = (a) => (a || []).map((x) => `- ${x}`).join("\n") || "- none";
    const notes = `# ${s.title || slug}\n\n${s.summary || ""}\n\n## Files\n- stl/ — one STL per printable body, millimetres\n- ${slug}.step — whole assembly incl. reference parts (Fusion 360, FreeCAD, Onshape)\n- ${slug}.glb — assembly for web viewing (metres, Y-up)\n- source/${slug}.replicad.js — model source (runs in Tessera or replicad.xyz)\n${current.cadquery ? `- source/${slug}.cadquery.py — CadQuery port (generated by Claude, not test-run)\n` : ""}\n## Components\n${(s.components || []).map((c) => `- ${c.name}: ${c.dims}${c.source ? ` (${c.source})` : c.basis ? ` (${c.basis})` : ""}`).join("\n") || "- none"}\n\n## Printing\n${li(s.print_notes)}\n\n## Hardware\n${li(s.hardware)}\n\n## Assumptions\n${li(s.assumptions)}\n`;
    const blob = await CAD.buildZip({ engine, code: current.code, cadquery: current.cadquery, notes, slug, viewer });
    await downloads.save({ filename: `${slug}.zip`, data: blob });
    toast(`Saved ${slug}.zip`);
  } catch (e) {
    if (e?.code !== "declined") toast(e?.code === "unavailable" ? "Downloads aren't available here." : "Export failed: " + errText(e));
  } finally { $("exportBtn").disabled = false; }
});

/* ---------- boot ---------- */
const saved = store.get();
$("instructions").value = saved?.instructions ?? EXAMPLES.pi.instructions;
$("parts").value = saved?.parts ?? EXAMPLES.pi.parts;
for (const id of ["instructions", "parts"]) $(id).addEventListener("input", () => store.set({ ...(store.get() || {}), instructions: $("instructions").value, parts: $("parts").value }));
const themeDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };

(async function boot() {
  try {
    await import("./cad.js");
    viewer = new CAD.Viewer($("plate"));
    $("plate").prepend(viewer.renderer.domElement);
    viewer.setTheme(themeDark());
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => viewer.setTheme(themeDark()));
    new MutationObserver(() => viewer.setTheme(themeDark())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const wasm = await CAD.loadWasm("occt-gz.wasm", (f) => ($("bar").style.width = (f * 100).toFixed(0) + "%"));
    $("overlayText").textContent = "Starting OpenCascade…";
    engine = new CAD.Engine(new URL("cad-worker.js", location.href).href, wasm);
    await engine.start();
    kernelReady = true; chip("chipKernel", "on", "CAD kernel: ready");
    current = { cadquery: saved?.cadquery || null };
    if (saved?.code) {
      try { await build(saved.code, saved.spec); } catch { await build(EXAMPLES.pi.code, EXAMPLES.pi.spec); }
    } else await build(EXAMPLES.pi.code, EXAMPLES.pi.spec);
    $("overlay").hidden = true;
  } catch (e) {
    chip("chipKernel", "err", "CAD kernel: failed");
    $("overlayText").textContent = "The CAD kernel didn't load: " + errText(e) + ". Reload the page to try again.";
    $("bar").parentElement.hidden = true;
  }
})();

(async function connect() {
  if (!window.claude?.use) { chip("chipClaude", "err", "Designer: open in Claude"); chip("chipWeb", "off", "Web lookup: off"); return; }
  sampleFn = await window.claude.use("sample");
  if (sampleFn) {
    const lim = await sampleFn.limits().catch(() => null);
    if (lim && !lim.tools) { sampleFn = null; chip("chipClaude", "err", "Designer: unavailable here"); }
    else { canSeeImages = !!lim?.images; chip("chipClaude", "on", "Designer: Claude"); }
  } else chip("chipClaude", "err", "Designer: unavailable here");
  $("review").disabled = !canSeeImages;
  if (!canSeeImages) $("review").checked = false;
  mcp = await window.claude.use("mcp");
  if (mcp) {
    try { webOn = ((await mcp.listTools("host:claude_browser")).servers || []).some((s) => s.server === "host:claude_browser"); }
    catch { webOn = false; }
  }
  chip("chipWeb", webOn ? "on" : "off", webOn ? "Web lookup: browser" : "Web lookup: off (desktop app only)");
})();
