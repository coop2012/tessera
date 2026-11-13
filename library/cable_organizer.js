function main(r, p) {
  // Desk-top cable block, 5 keyhole slots. Seats Ø5.4 fit cables up to ~5 mm (USB-C laptop leads);
  // 3.4 mm throat grips 3-4.5 mm phone cables; connector heads (≥ 8 mm) can't pull through.
  const n = 5, pitch = 18, L = n * pitch + 8, Dp = 34, H = 26;
  // softer silhouette: top edge rounded, back slightly higher than front via a lofted top
  let block = r.drawRoundedRectangle(L, Dp, 6).sketchOnPlane("XY").extrude(H);
  try { block = block.fillet(3, (e) => e.inPlane("XY", H)); } catch (e) {}
  const zSeat = H - 9;
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 4 + pitch / 2 + i * pitch;
    block = block.cut(r.makeCylinder(2.7, Dp + 2, [x, -Dp / 2 - 1, zSeat], [0, 1, 0]));
    block = block.cut(r.makeBox([x - 1.7, -Dp / 2 - 1, zSeat], [x + 1.7, Dp / 2 + 1, H + 1]));
    // V lead-in so cables snap in instead of being forced
    const v = r.draw([-4.2, H + 0.5]).lineTo([4.2, H + 0.5]).lineTo([1.7, H - 3.5]).lineTo([-1.7, H - 3.5]).close()
      .sketchOnPlane("XZ", Dp / 2 + 1).extrude(Dp + 2).translate([x, 0, 0]);
    block = block.cut(v);
    // label groove on the front face under each slot
    block = block.cut(r.makeBox([x - 6, -Dp / 2 - 0.1, 4], [x + 6, -Dp / 2 + 0.6, 9]));
  }
  // 4 recesses for 10 x 2 mm rubber feet + 2 pockets for 20 mm steel washers (weight)
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) block = block.cut(r.makeCylinder(5.2, 1.2, [sx * (L / 2 - 9), sy * (Dp / 2 - 8), -0.01]));
  for (const sx of [-1, 1]) block = block.cut(r.makeCylinder(10.3, 4, [sx * 22, 0, -0.01]));
  try { block = block.chamfer(0.6, (e) => e.inPlane("XY", 0)); } catch (e) {}
  return [{ name: "cable_block", shape: block, color: "#2a2a2a" }];
}
