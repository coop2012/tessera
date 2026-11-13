function main(r, p) {
  // Under-desk headphone hook. Top plate screws to the desk underside with two countersunk M4 / #8 wood screws;
  // cradle is 46 mm wide (headbands are 30–45 mm) with a 8 mm lip so the headband can't slide off.
  const W = 46, t = 5;
  // J-profile in the XZ plane (x = forward, z = up), extruded across the width
  const prof = r.draw([0, 50]).lineTo([62, 50]).lineTo([62, 45]).lineTo([t, 45]).lineTo([t, t])
    .lineTo([48, t]).lineTo([48, 13]).lineTo([48 + t, 13]).lineTo([48 + t, 0]).lineTo([0, 0]).close();
  let hook = prof.sketchOnPlane("XZ").extrude(W).translate([0, W / 2, 0]);
  try { hook = hook.fillet(1.5, (e) => e.inDirection("Y")); } catch (e) { /* keep sharp edges */ }
  // countersunk screw holes: Ø4.5 clearance + 90° cone lofted from Ø9 at the face
  for (const x of [22, 50]) {
    hook = hook.cut(r.makeCylinder(2.25, 10, [x, 0, 40]));
    hook = hook.cut(r.drawCircle(4.6).sketchOnPlane("XY", 45.01).loftWith([r.drawCircle(2.25).sketchOnPlane("XY", 42.6)]));
  }
  // soft pad groove in the cradle (2 mm deep) for a felt strip
  hook = hook.cut(r.makeBox([12, -W / 2 + 6, t - 1.2], [44, W / 2 - 6, t + 1]));
  const desk = r.makeBox([-10, -40, 50], [80, 40, 68]);
  return [
    { name: "headphone_hook", shape: hook, color: "#1b1b1b" },
    { name: "desk_underside", shape: desk, color: "#c9c9c7", printable: false },
  ];
}
