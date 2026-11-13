function main(r, p) {
  // Phone stand: phone leans back 25° in a 12 mm channel (fits phones in cases up to ~11 mm), cable slot through the base.
  const W = 76, slot = 12, lean = 25;
  let base = r.drawRoundedRectangle(92, W, 6).sketchOnPlane("XY").extrude(6).translate([46, 0, 0]);
  base = base.fuse(r.makeBox([0, -W / 2 + 6, 0], [5, W / 2 - 6, 16]));                  // front lip
  let rest = r.makeBox([0, -W / 2 + 4, 0], [5, W / 2 - 4, 105]).rotate(lean, [0, 0, 0], [0, 1, 0]).translate([5 + slot, 0, 4]);
  let strut = r.makeBox([0, -4, 0], [5, 4, 70]).rotate(-35, [0, 0, 0], [0, 1, 0]).translate([86, 0, 4]);
  let stand = base.fuse(rest).fuse(strut);
  stand = stand.cut(r.makeBox([-10, -W, -20], [120, W, 0]));                            // flatten the bottom
  stand = stand.cut(r.makeBox([-1, -5, -1], [30, 5, 20]));                              // cable slot
  stand = stand.cut(r.makeCylinder(12, 20, [44, 0, 40], [1, 0, 0]).rotate(lean, [44, 0, 40], [0, 1, 0])); // cable/speaker window
  try { stand = stand.fillet(1.2, (e) => e.inDirection("Y")); } catch (e) {}
  const phone = r.makeBox([0, -36, 0], [9, 36, 150]).rotate(lean, [0, 0, 0], [0, 1, 0]).translate([9.4, 0, 10.1]);
  return [
    { name: "phone_stand", shape: stand, color: "#1b1b1b" },
    { name: "phone_in_case", shape: phone, color: "#9a9a98", printable: false },
  ];
}
