function main(r, p) {
  // Desktop tape dispenser for Scotch Magic 3/4" tape: 19.05 mm wide, 25.4 mm (1") core, ~53 mm OD (1000" roll).
  // Blade: 25 x 8 x 0.5 mm serrated steel blade, 2 x Ø2.5 holes 16 mm apart. Removable under a screwed clamp plate.
  const c = p.clearance ?? 0.3;
  const tape = { w: 19.05, id: 25.4, od: 53 };
  const roll = [-25, 0, 45];                 // roll centre
  const cheekIn = tape.w / 2 + 1.0, cheekOut = cheekIn + 3.5;
  const baseH = 14, L = 130, W = 58;

  // ---- body: weighted base + two cheeks with U-slots for the hub axle + front nose ----
  let body = r.drawRoundedRectangle(L, W, 10).sketchOnPlane("XY").extrude(baseH);
  try { body = body.fillet(3, (e) => e.inPlane("XY", baseH)); } catch (e) {}
  const cheekProfile = r.draw([-55, baseH - 1]).lineTo([15, baseH - 1]).lineTo([15, 40])
    .sagittaArcTo([-55, 40], -26).close();
  for (const s of [-1, 1]) {
    const y0 = s > 0 ? cheekIn : -cheekOut;
    body = body.fuse(cheekProfile.clone().sketchOnPlane("XZ", -y0).extrude(-3.5));
  }
  // U-slot: drop-in axle seat, Ø6 axle + clearance
  const slotR = 3 + c;
  body = body.cut(r.makeBox([roll[0] - slotR, -cheekOut - 1, roll[2]], [roll[0] + slotR, cheekOut + 1, 90]));
  body = body.cut(r.makeCylinder(slotR, 2 * cheekOut + 2, [roll[0], -cheekOut - 1, roll[2]], [0, 1, 0]));
  // nose with roller pocket
  let nose = r.makeBox([30, -14, baseH - 1], [60, 14, 40]);
  try { nose = nose.fillet(4, (e) => e.inDirection("Y").inPlane("YZ", 60)); } catch (e) {}
  body = body.fuse(nose);
  const rollerC = [37, 0, 36.5];
  body = body.cut(r.makeBox([32.5, -cheekIn - 0.5, 32], [41.5, cheekIn + 0.5, 41]));
  body = body.cut(r.makeCylinder(1.6, 30, [rollerC[0], -15, rollerC[2]], [0, 1, 0]));        // M3 pin hole
  // blade seat (open to the front) + clamp screw pilots
  body = body.cut(r.makeBox([53.35, -12.7, 39.45], [62, 12.7, 40.05]));
  for (const y of [-8, 8]) body = body.cut(r.makeCylinder(1.25, 10, [57.5, y, 31]));
  // weight pockets (M20 washers) + rubber-foot recesses underneath
  for (const x of [-25, 35]) body = body.cut(r.makeCylinder(15.2, 6, [x, 0, -0.01]));
  for (const [x, y] of [[-55, -20], [-55, 20], [55, -20], [55, 20]]) body = body.cut(r.makeCylinder(5.2, 1.2, [x, y, -0.01]));

  // ---- hub: drum that the core slides onto + axle stubs into the U-slots ----
  let hub = r.makeCylinder(tape.id / 2 - 0.2, tape.w - 0.05, [roll[0], -(tape.w - 0.05) / 2, roll[2]], [0, 1, 0]);
  hub = hub.fuse(r.makeCylinder(3, 2 * cheekOut + 1, [roll[0], -cheekOut - 0.5, roll[2]], [0, 1, 0]));
  hub = hub.cut(r.makeCylinder(8, tape.w - 6, [roll[0], -(tape.w - 6) / 2, roll[2]], [0, 1, 0]));  // lighten

  // ---- guide roller on an M3 pin ----
  const rollerW = 2 * cheekIn - 1.0;
  const roller = r.makeCylinder(4, rollerW, [rollerC[0], -rollerW / 2, rollerC[2]], [0, 1, 0])
    .cut(r.makeCylinder(1.75, rollerW + 2, [rollerC[0], -rollerW / 2 - 1, rollerC[2]], [0, 1, 0]));

  // ---- blade clamp plate ----
  let clamp = r.makeBox([50, -14, 40.05], [59.5, 14, 43]);
  try { clamp = clamp.fillet(1, (e) => e.inPlane("XY", 43)); } catch (e) {}
  for (const y of [-8, 8]) clamp = clamp.cut(r.makeCylinder(1.7, 5, [57.5, y, 39]));

  // ---- reference parts ----
  const tapeRoll = r.makeCylinder(tape.od / 2, tape.w, [roll[0], -tape.w / 2, roll[2]], [0, 1, 0])
    .cut(r.makeCylinder(tape.id / 2, tape.w + 2, [roll[0], -tape.w / 2 - 1, roll[2]], [0, 1, 0]));
  const blade = r.makeBox([53.5, -12.5, 39.5], [61.5, 12.5, 40]);
  const pin = r.makeCylinder(1.5, 28, [rollerC[0], -14, rollerC[2]], [0, 1, 0]);

  return [
    { name: "body", shape: body, color: "#202020" },
    { name: "hub", shape: hub, color: "#9b9b99" },
    { name: "guide_roller", shape: roller, color: "#9b9b99" },
    { name: "blade_clamp", shape: clamp, color: "#c4c4c2" },
    { name: "tape_roll", shape: tapeRoll, color: "#e6e6e4", printable: false },
    { name: "serrated_blade", shape: blade, color: "#bdbdbb", printable: false },
    { name: "m3x28_pin", shape: pin, color: "#8a8a8a", printable: false },
  ];
}
