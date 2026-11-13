function main(r, p) {
  // 60 x 40 x 30 mm box with a lid held by two cantilever snap hooks that click into windows in the end walls.
  const c = p.clearance ?? 0.3, w = 2, L = 60, D = 40, H = 30, beam = 1.6;
  let box = r.drawRoundedRectangle(L, D, 4).sketchOnPlane("XY").extrude(H);
  box = box.shell(w, (f) => f.inPlane("XY", H));
  for (const s of [-1, 1]) {                                   // snap windows, 3 mm below the rim
    box = box.cut(r.makeBox([s * (L / 2 + 1), -6, H - 7], [s * (L / 2 - w - 1), 6, H - 4]));
  }
  // lid: plate + locating lip (gapped at the hooks so they can flex)
  let lid = r.drawRoundedRectangle(L, D, 4).sketchOnPlane("XY", H).extrude(2);
  const outerL = L - 2 * w - 2 * c, outerD = D - 2 * w - 2 * c;
  let lip = r.drawRoundedRectangle(outerL, outerD, 2).cut(r.drawRoundedRectangle(outerL - 3.2, outerD - 3.2, 1))
    .sketchOnPlane("XY", H - 4).extrude(4);
  for (const s of [-1, 1]) lip = lip.cut(r.makeBox([s * (L / 2), -7, H - 5], [s * (L / 2 - 6), 7, H + 1]));
  lid = lid.fuse(lip);
  for (const s of [-1, 1]) {
    const xi = s * (L / 2 - w - c), xb = s * (L / 2 - w - c - beam);
    lid = lid.fuse(r.makeBox([xb, -5, H - 9], [xi, 5, H]));                         // flexing beam
    lid = lid.fuse(r.makeBox([xb, -5, H - 6.6], [s * (L / 2 - w + 1.0), 5, H - 4.6])); // barb in the window
  }
  return [
    { name: "box", shape: box, color: "#1b1b1b" },
    { name: "snap_lid", shape: lid, color: "#d8d8d8" },
  ];
}
