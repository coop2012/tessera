function main(r, p) {
  // Arduino Uno R3: 68.6 x 53.4 mm, holes Ø3.2 at (14.0,2.5) (15.3,50.7) (66.1,7.6) (66.1,35.5) from the USB-side lower-left corner
  // LCD1602 module: PCB 80 x 36 x 1.6, holes Ø3.0 on 75 x 31, glass 71 x 24 x 7 centred; header strip on the left edge
  // EC11 encoder: body 12 x 12 x 6.5, shaft Ø6, bushing M7 Ø7 x 7 mm
  const c = p.clearance ?? 0.3, w = Math.max(p.wall ?? 2, 2), floor = 2.4;
  const W = 96, D = 68, H = 40;                  // outer box
  const uno = { w: 68.6, d: 53.4, t: 1.6, x0: -W / 2 + w + 3, y0: -D / 2 + w + 4, z: floor + 5 };
  let box = r.drawRoundedRectangle(W, D, 4).sketchOnPlane("XY").extrude(H);
  box = box.shell(w, (f) => f.inPlane("XY", H));
  // Uno standoffs (M3 self-tap pilot 2.5)
  const unoHoles = [[14.0, 2.5], [15.3, 50.7], [66.1, 7.6], [66.1, 35.5]];
  for (const [hx, hy] of unoHoles) {
    const x = uno.x0 + hx, y = uno.y0 + hy;
    box = box.fuse(r.makeCylinder(3.2, uno.z - floor, [x, y, floor]).cut(r.makeCylinder(1.25, uno.z, [x, y, floor])));
  }
  // USB-B and barrel jack openings on the -X wall (USB-B 12 x 11 at y 38.1..50.1, jack 9 x 11 at y 3.3..12.3)
  box = box.cut(r.makeBox([-W / 2 - 1, uno.y0 + 38.1 - c - 1, uno.z + uno.t - 0.5], [-W / 2 + w + 1, uno.y0 + 50.1 + c + 1, uno.z + uno.t + 11 + c]));
  box = box.cut(r.makeBox([-W / 2 - 1, uno.y0 + 3.3 - c - 1, uno.z + uno.t - 0.5], [-W / 2 + w + 1, uno.y0 + 12.3 + c + 1, uno.z + uno.t + 11 + c]));
  // lid: plate + locating lip, LCD window, encoder hole, LCD standoffs underneath
  const lidZ = H;
  let lid = r.drawRoundedRectangle(W, D, 4).sketchOnPlane("XY", lidZ).extrude(2.4);
  lid = lid.fuse(r.drawRoundedRectangle(W - 2 * w - 2 * c, D - 2 * w - 2 * c, 2).cut(r.drawRoundedRectangle(W - 2 * w - 2 * c - 3.2, D - 2 * w - 2 * c - 3.2, 1))
    .sketchOnPlane("XY", lidZ - 3).extrude(3));
  const lcdC = [-8, 6];
  lid = lid.cut(r.makeBaseBox(71 + 2 * c, 24 + 2 * c, 10).translate([lcdC[0], lcdC[1], lidZ - 2]));
  const enc = [36, -18];
  lid = lid.cut(r.makeCylinder(3.5 + c, 10, [enc[0], enc[1], lidZ - 2]));
  return [
    { name: "box", shape: box },
    { name: "lid", shape: lid, color: "#29335c" },
    { name: "arduino_uno", shape: r.makeBox([uno.x0, uno.y0, uno.z], [uno.x0 + uno.w, uno.y0 + uno.d, uno.z + uno.t]), color: "#1f6fb2", printable: false },
  ];
}
