function main(r, p) {
  // Lathed bud vase: spline profile revolved around Z, hollowed to a 2 mm wall with a 3 mm floor.
  const wall = Math.max(p.wall ?? 2, 1.6);
  const outer = r.draw([0, 0]).lineTo([28, 0]).smoothSplineTo([40, 42]).smoothSplineTo([18, 104])
    .lineTo([23, 120]).lineTo([0, 120]).close();
  let vase = outer.sketchOnPlane("XZ").revolve([0, 0, 1]);
  try { vase = vase.shell(wall, (f) => f.inPlane("XY", 120)); }
  catch (e) {
    const inner = r.draw([0, 3]).lineTo([28 - wall, 3]).smoothSplineTo([40 - wall, 42]).smoothSplineTo([18 - wall, 104])
      .lineTo([23 - wall, 121]).lineTo([0, 121]).close();
    vase = vase.cut(inner.sketchOnPlane("XZ").revolve([0, 0, 1]));
  }
  // 12 shallow decorative rings around the belly
  for (let i = 0; i < 6; i++) vase = vase.cut(
    r.makeCylinder(60, 0.8, [0, 0, 20 + i * 6]).cut(r.makeCylinder(38.6 + Math.sin(i / 2) * 1.2, 2, [0, 0, 19 + i * 6])));
  return [{ name: "bud_vase", shape: vase, color: "#e9e9e9" }];
}
