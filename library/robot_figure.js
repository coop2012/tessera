function main(r, p) {
  // Original desk robot figurine, ~70 mm tall, one piece, flat feet, no supports beyond 45°.
  const rbox = (x, y, z, rad) => { let b = r.makeBaseBox(x, y, z); try { b = b.fillet(rad); } catch (e) {} return b; };
  let bot = rbox(20, 14, 6, 2).translate([-8, 0, 0]).fuse(rbox(20, 14, 6, 2).translate([8, 0, 0]));   // feet
  for (const x of [-8, 8]) bot = bot.fuse(r.makeCylinder(4, 12, [x, 0, 5]));                          // legs
  bot = bot.fuse(rbox(34, 24, 26, 5).translate([0, 0, 15]));                                          // body
  bot = bot.cut(rbox(18, 4, 12, 1.5).translate([0, -12.5, 22]));                                      // chest panel
  for (const x of [-4, 0, 4]) bot = bot.fuse(r.makeCylinder(1.4, 3, [x, -10.5, 28], [0, -1, 0]));     // buttons
  for (const s of [-1, 1]) {
    bot = bot.fuse(r.makeSphere(4.5).translate([s * 18, 0, 36]));                                      // shoulders
    bot = bot.fuse(r.makeCylinder(3.2, 16, [s * 18, 0, 36], [s * 0.35, -0.2, -1]));                    // arms
    bot = bot.fuse(r.makeSphere(3.6).translate([s * 23.5, -3.2, 21]));                                 // hands
  }
  bot = bot.fuse(r.makeCylinder(4, 4, [0, 0, 40]));                                                     // neck
  let head = rbox(30, 22, 18, 5).translate([0, 0, 43]);
  for (const s of [-1, 1]) {
    head = head.cut(r.makeSphere(4.2).translate([s * 7, -11.5, 53]));                                   // eye sockets
    head = head.fuse(r.makeSphere(2.4).translate([s * 7, -10.2, 53]));                                  // pupils
    head = head.fuse(r.makeCylinder(3, 5, [s * 15, 0, 52], [s, 0, 0]));                                 // ear bolts
  }
  head = head.cut(r.makeBox([-5, -12, 46.5], [5, -10, 48]));                                            // mouth slot
  head = head.fuse(r.makeCylinder(1.2, 9, [0, 0, 60])).fuse(r.makeSphere(2.6).translate([0, 0, 70]));  // antenna
  return [{ name: "desk_robot", shape: bot.fuse(head), color: "#d9d9d9" }];
}
