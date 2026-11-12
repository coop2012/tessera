function main(r, p) {
  // Original owl: ellipsoid body + head, tufts, wings, eyes, beak, revolved base
  const body = r.makeEllipsoid(18, 15, 22).translate([0, 0, 24]);
  const head = r.makeEllipsoid(15, 13, 12).translate([0, 0, 50]);
  let owl = body.fuse(head);
  for (const s of [-1, 1]) {
    owl = owl.fuse(r.makeEllipsoid(5, 3, 6).rotate(s * 25, [0, 0, 0], [0, 1, 0]).translate([s * 8, -4, 60])); // ear tufts
    owl = owl.cut(r.makeSphere(4).translate([s * 6, -12, 52]));                                            // eye sockets
    owl = owl.fuse(r.makeSphere(2.6).translate([s * 6, -10.5, 52]));                                       // pupils
    owl = owl.fuse(r.makeEllipsoid(4, 10, 16).rotate(s * 12, [0, 0, 0], [0, 1, 0]).translate([s * 16, 0, 26])); // wings
  }
  owl = owl.fuse(r.drawEllipse(3, 2.4).sketchOnPlane("XZ", 10).loftWith([r.drawCircle(0.5).sketchOnPlane("XZ", 15.5)])
    .rotate(-12, [0, 0, 0], [1, 0, 0]).translate([0, 0, 46]));                                            // lofted beak
  owl = owl.cut(r.makeBaseBox(80, 80, 10).translate([0, 0, -8]));                                        // flat bottom
  const base = r.draw([0, 0]).lineTo([22, 0]).lineTo([22, 3]).smoothSplineTo([18, 6]).lineTo([0, 6]).close()
    .sketchOnPlane("XZ").revolve([0, 0, 1]);
  owl = owl.fuse(base);
  return [{ name: "desk_owl", shape: owl, color: "#c9803e" }];
}