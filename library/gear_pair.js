function main(r, p) {
  // Spur gear pair, module 2, 20° pressure angle, 24:12 teeth (2:1), on a base plate with two pegs.
  const c = p.clearance ?? 0.3, m = 2, h = 8, backlash = 0.25;
  const inv = (a) => Math.tan(a) - a;
  function gear(z, rotate) {
    const rp = (m * z) / 2, rb = rp * Math.cos((20 * Math.PI) / 180), ra = rp + m, rf = rp - 1.25 * m;
    const half = Math.PI / (2 * z) + inv(Math.acos(rb / rp));
    const pol = (rr, th) => [rr * Math.cos(th + rotate), rr * Math.sin(th + rotate)];
    const pts = [];
    for (let k = 0; k < z; k++) {
      const cA = (k * 2 * Math.PI) / z, flank = [];
      for (let i = 0; i <= 6; i++) {
        const rr = Math.max(rb, rf) + ((ra - Math.max(rb, rf)) * i) / 6;
        flank.push([rr, half - inv(Math.acos(Math.min(1, rb / rr)))]);
      }
      pts.push(pol(rf, cA - half));
      flank.forEach(([rr, th]) => pts.push(pol(rr, cA - th)));
      flank.slice().reverse().forEach(([rr, th]) => pts.push(pol(rr, cA + th)));
      pts.push(pol(rf, cA + half));
    }
    let d = r.draw(pts[0]);
    for (const q of pts.slice(1)) d = d.lineTo(q);
    return d.close().sketchOnPlane("XY").extrude(h);
  }
  const zA = 24, zB = 12, dist = (m * (zA + zB)) / 2 + backlash;
  let A = gear(zA, Math.PI / zA).translate([0, 0, 3]);
  let B = gear(zB, 0).translate([dist, 0, 3]);
  A = A.cut(r.makeCylinder(2.5 + c, 20, [0, 0, 0]));
  B = B.cut(r.makeCylinder(2.5 + c, 20, [dist, 0, 0]));
  for (let i = 0; i < 4; i++) {                                          // lightening holes
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    A = A.cut(r.makeCylinder(4.5, 20, [11 * Math.cos(a), 11 * Math.sin(a), 0]));
  }
  let base = r.drawRoundedRectangle(dist + 40, 34, 6).sketchOnPlane("XY").extrude(3).translate([dist / 2 - 2, 0, 0]);
  for (const x of [0, dist]) base = base.fuse(r.makeCylinder(2.5, h + 2, [x, 0, 3]));
  return [
    { name: "gear_24t", shape: A, color: "#1b1b1b" },
    { name: "gear_12t", shape: B, color: "#8c8c8c" },
    { name: "base_with_pegs", shape: base, color: "#d8d8d8" },
  ];
}
