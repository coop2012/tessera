function main(r, p) {
  // Desk-top cable block, 5 keyhole slots. Seats Ø5.4 fit cables up to ~5 mm (USB-C laptop leads);
  // 3.4 mm throat with lead-in grips 3-4.5 mm phone cables; connector heads (≥ 8 mm) can't pull through.
  const n = 5, pitch = 18, L = n * pitch + 8, Dp = 34, H = 26;
  let block = r.drawRoundedRectangle(L, Dp, 6).sketchOnPlane("XY").extrude(H);
  const zSeat = H - 9;
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 4 + pitch / 2 + i * pitch;
    block = block.cut(r.makeCylinder(2.7, Dp + 2, [x, -Dp / 2 - 1, zSeat], [0, 1, 0]));          // cable seat, front to back
    block = block.cut(r.makeBox([x - 1.7, -Dp / 2 - 1, zSeat], [x + 1.7, Dp / 2 + 1, H + 1]));     // throat
  }
  return [{ name: "cable_block", shape: block }];
}
