function main(r, p) {
  // Print-in-place hinge: 5 knuckles on an X axis, the pin is part of leaf A and runs through leaf B's knuckles.
  // Every moving gap equals the fit clearance, so it prints assembled and breaks free by hand.
  const c = Math.max(p.clearance ?? 0.3, 0.35), R = 4, pin = 1.8, t = 2.4, len = 40, n = 5, seg = len / n, leafW = 24;
  const ax = (x0, x1, rad) => r.makeCylinder(rad, x1 - x0, [x0, 0, R], [1, 0, 0]);
  let a = r.makeBox([-len / 2, -leafW, 0], [len / 2, -1, t]);
  let b = r.makeBox([-len / 2, 1, 0], [len / 2, leafW, t]);
  for (let i = 0; i < n; i++) {
    const x0 = -len / 2 + i * seg, x1 = x0 + seg;
    if (i % 2 === 0) { b = b.cut(ax(x0 - 0.01, x1 + 0.01, R + c)); a = a.fuse(ax(x0, x1, R)); }
    else { a = a.cut(ax(x0, x1, R + c)); b = b.fuse(ax(x0 + c, x1 - c, R).cut(ax(x0 + c - 1, x1 - c + 1, pin + c))); }
  }
  a = a.fuse(ax(-len / 2, len / 2, pin));                       // continuous pin
  for (const [leaf, y] of [[0, -leafW / 2 - 2], [1, leafW / 2 + 2]]) for (const x of [-12, 12]) {
    const hole = r.makeCylinder(1.7, t + 2, [x, y, -1]);
    if (leaf === 0) a = a.cut(hole); else b = b.cut(hole);
  }
  return [
    { name: "leaf_with_pin", shape: a, color: "#1b1b1b" },
    { name: "leaf_with_holes", shape: b, color: "#9a9a9a" },
  ];
}
