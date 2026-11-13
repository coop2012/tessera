function main(r, p) {
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
    { name: "case_lid", shape: lid, color: "#d6d6d4" },
    { name: "pi4_board", shape: board, color: "#7d7d7b", printable: false },
  ];
}
