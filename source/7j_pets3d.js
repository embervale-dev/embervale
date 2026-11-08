// ================= PETS v3: dedicated companion models =================
// makePetModel(key) -> { g, legs: [], wings: [], tick(t, d) }. Models face +x, feet at y=0,
// built about 2.6 units tall so the game's .2 scale reads ~.5 units next to the 1.3-unit player.
// tick(t, d): idle animation; d = distance to the follow target (> 8 means the pet is moving).
const makePetModel = (() => {
  const GC = {}, MC = {};
  const geo = (k, fn) => GC[k] || (GC[k] = fn());
  const V2 = (x, y) => new T3.Vector2(x, y);
  // smooth lathe through control points [[r, y], ...]
  const sLathe = (ctrl, seg = 26, n = 28) => new T3.LatheGeometry(new T3.SplineCurve(ctrl.map(p => V2(p[0], p[1]))).getPoints(n).map(v => V2(Math.max(v.x, .001), v.y)), seg);
  // material with vertex colours / double-sided variants
  const vcm = (rough = .6) => MC['vc' + rough] || (MC['vc' + rough] = new T3.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: .02 }));
  const dbl = (hex, o = {}) => { const k = 'd' + hex + JSON.stringify(o); if (MC[k]) return MC[k]; const m = mat(hex, o).clone(); m.side = T3.DoubleSide; return MC[k] = m; };
  const paint = (g, fn) => { const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new T3.Color(); for (let i = 0; i < p.count; i++) { fn(col, p.getX(i), p.getY(i), p.getZ(i)); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } g.setAttribute('color', new T3.BufferAttribute(c, 3)); return g; };
  const extr = (shape, depth, bev = .04) => { const g = new T3.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 10 }); g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g; };
  const grp = (parent, x = 0, y = 0, z = 0) => { const o = new T3.Group(); o.position.set(x, y, z); parent.add(o); return o; };
  const EYE = () => mat('#1c1424', { rough: .08, metal: .1 }), HI = () => basic('#ffffff');
  // a group sitting on a sphere (centre c, radius R) at azimuth az (0 = front/+x, + toward +z) and elevation el; local +x points outward
  const onSurf = (parent, c, R, az, el, sink = .97) => { const o = grp(parent, c[0] + R * sink * Math.cos(el) * Math.cos(az), c[1] + R * sink * Math.sin(el), c[2] + R * sink * Math.cos(el) * Math.sin(az)); o.rotation.set(0, -az, el); return o; };
  // geometries shared by every pet
  const smileG = () => geo('smile', () => { const g = new T3.TorusGeometry(1, .3, 6, 14, Math.PI); g.rotateZ(Math.PI); g.rotateY(Math.PI / 2); return g; });
  const fangG = () => geo('fang', () => { const g = new T3.ConeGeometry(1, 1, 8); g.rotateX(Math.PI); return g; });
  // big glossy chibi face
  function face(parent, c, R, o = {}) {
    const az = o.az ?? .42, el = o.el ?? 0, ew = o.ew ?? R * .27, eh = o.eh ?? ew * 1.3;
    const em = o.glow ? mat(o.glow, { em: 1.1, rough: .2 }) : EYE();
    for (const s of [-1, 1]) {
      const e = onSurf(parent, c, R, s * az, el, o.sink ?? .93);
      mk(GEO.sph, em, ew * .5, eh, ew, 0, 0, 0, e, false);
      if (o.iris) mk(GEO.sph, mat(o.iris, { rough: .1, em: .35 }), ew * .28, eh * .45, ew * .62, ew * .26, -eh * .4, 0, e, false);
      mk(GEO.sphL, HI(), ew * .1, ew * .34, ew * .3, ew * .44, eh * .36, -ew * .24, e, false);
      mk(GEO.sphL, HI(), ew * .08, ew * .14, ew * .14, ew * .42, -eh * .42, ew * .3, e, false);
      if (o.blush) { const b = onSurf(parent, c, R, s * (az + .3), el - .36, .99); mk(GEO.sph, mat(o.blush, { op: .55, rough: .9 }), .015, ew * .42, ew * .72, 0, 0, 0, b, false); }
    }
    if (o.mouth) { const m = onSurf(parent, c, R, 0, o.mEl ?? el - .34, 1.0); const mw = (o.mw ?? ew * .38) * 1.5;
      if (o.mouth === 'open') mk(GEO.sph, mat('#5a1a2a', { rough: .5 }), mw * .3, mw * .75, mw * .8, 0, 0, 0, m, false);
      else { mk(smileG(), mat(o.mcol || '#3a1a22', { rough: .6 }), mw, mw, mw, mw * .3, mw * .45, 0, m, false);
        if (o.mouth === 'fang') for (const s of [-1, 1]) mk(fangG(), basic('#ffffff'), mw * .22, mw * .5, mw * .22, 0, -mw * 1.05, s * mw * .55, m, false); }
    }
  }
  // ---------- shapes ----------
  const earShape = (w, h, round) => { const s = new T3.Shape(); s.moveTo(-w / 2, 0); s.quadraticCurveTo(-w * .45, h * .6, round ? -w * .1 : 0, h); if (round) s.quadraticCurveTo(w * .1, h * 1.08, w * .2, h * .9); s.quadraticCurveTo(w * .45, h * .55, w / 2, 0); s.quadraticCurveTo(0, -h * .08, -w / 2, 0); return s; };
  const earG = (k, w, h, round, d = .12) => geo('ear' + k, () => { const g = extr(earShape(w, h, round), d, .04); g.rotateY(Math.PI / 2); return g; });
  // bat wing: span along +u (outward), v up; scalloped trailing edge
  const batWingG = () => geo('batw', () => { const s = new T3.Shape(); s.moveTo(0, .1); s.quadraticCurveTo(.6, .75, 1.35, .55); s.lineTo(1.25, .1); s.quadraticCurveTo(1.05, .02, .95, -.18); s.quadraticCurveTo(.78, -.08, .62, -.28); s.quadraticCurveTo(.45, -.12, .3, -.3); s.quadraticCurveTo(.15, -.1, 0, -.15); s.lineTo(0, .1);
    const g = extr(s, .03, .015); g.rotateY(-Math.PI / 2); return g; });
  // feathered wing: rounded top, three scalloped feather tips
  const featherWingG = (k, sc) => geo('fw' + k, () => { const s = new T3.Shape(); s.moveTo(0, .15); s.bezierCurveTo(.35, .7, 1.0, .85, 1.3, .6); s.quadraticCurveTo(1.38, .3, 1.15, .2); s.quadraticCurveTo(1.2, -.08, .9, -.08); s.quadraticCurveTo(.88, -.36, .58, -.3); s.quadraticCurveTo(.48, -.55, .22, -.4); s.quadraticCurveTo(.05, -.3, 0, -.12); s.lineTo(0, .15);
    const g = extr(s, .06, .04); g.scale(sc, sc, 1); g.rotateY(-Math.PI / 2); return g; });
  // bushy tail along +y with a coloured tip, gently curved
  const tailG = (k, len, rad, base, tip, tipFrom) => geo('tail' + k, () => { const g = sLathe([[0, 0], [rad * .35, len * .05], [rad * .85, len * .35], [rad, len * .6], [rad * .7, len * .86], [0, len]], 18, 22);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + .3 * (y / len) ** 2 * len); } g.computeVertexNormals();
    const a = new T3.Color(base), b = new T3.Color(tip); return paint(g, (c, x, y) => c.copy(a).lerp(b, T3.MathUtils.smoothstep(y / len, tipFrom, tipFrom + .08))); });
  const slimeG = () => geo('slime', () => sLathe([[0, 0], [.92, .05], [1.12, .34], [1.06, .86], [.8, 1.36], [.4, 1.68], [0, 1.76]], 30, 30));
  const crownG = () => geo('crown', () => { const g = new T3.CylinderGeometry(.55, .48, .4, 20, 1, true); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, .2 + Math.abs(((a / (Math.PI * 2 / 5)) % 1 + 1) % 1 - .5) * 2 * .45); } g.computeVertexNormals(); return g; });
  const flameG = () => geo('flame', () => { const g = sLathe([[0, 0], [.55, .1], [.86, .5], [.82, 1.0], [.56, 1.5], [.24, 2.0], [0, 2.5]], 24, 30); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) - .38 * (y / 2.5) ** 2.4); } g.computeVertexNormals(); return g; });
  const ghostG = (k, hem) => geo('ghost' + k, () => { const g = sLathe([[0, 2.3], [.55, 2.22], [.86, 1.9], [.9, 1.35], [.96, .8], [1.06, .3]], 30, 30); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < .8) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, y + Math.sin(a * hem) * .16 * (1 - y / .8)); } } g.computeVertexNormals(); return g; });
  const gemG = () => geo('gem', () => new T3.LatheGeometry([V2(.001, 0), V2(.5, .85), V2(.68, 1.3), V2(.5, 1.95), V2(.001, 2.5)], 6));
  const furG = () => geo('fur', () => { const g = new T3.SphereGeometry(1, 30, 22), p = g.attributes.position, v = new T3.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + .035 * Math.sin(v.x * 17 + v.y * 9) * Math.sin(v.z * 15 - v.y * 11) + .02 * Math.sin(v.y * 31); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; });
  const rockG = (k, seed) => geo('rock' + k, () => { const g = new T3.IcosahedronGeometry(1, 1), p = g.attributes.position, v = new T3.Vector3(), H = {};
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const key = v.x.toFixed(3) + v.y.toFixed(3) + v.z.toFixed(3); const n = H[key] || (H[key] = .86 + .16 * Math.abs(Math.sin(v.x * 4.1 + seed) * Math.cos(v.y * 3.3 - seed) + Math.sin(v.z * 5.7 + seed * 2) * .5)); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; });
  const hornG = () => geo('horn', () => { const g = sLathe([[.16, 0], [.14, .2], [.08, .45], [0, .62]], 10, 8); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) - .5 * y * y); } g.computeVertexNormals(); return g; });
  const leafG = () => geo('leaf', () => { const s = new T3.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(.32, .3, 0, .9); s.quadraticCurveTo(-.32, .3, 0, 0); const g = extr(s, .03, .02); g.rotateX(-Math.PI / 2); return g; });
  const spadeG = () => geo('spade', () => { const s = new T3.Shape(); s.moveTo(0, .32); s.quadraticCurveTo(.26, .02, .2, -.08); s.quadraticCurveTo(.1, -.14, 0, -.02); s.quadraticCurveTo(-.1, -.14, -.2, -.08); s.quadraticCurveTo(-.26, .02, 0, .32); return extr(s, .05, .02); });
  const tubeG = (k, pts, r) => geo('tube' + k, () => new T3.TubeGeometry(new T3.CatmullRomCurve3(pts.map(p => new T3.Vector3(...p))), 20, r, 7));

  // ---------- quadruped (Wolf Pup, Trial Fox) ----------
  function quad(root, o) {
    const A = { legs: [] }, fur = mat(o.col, { rough: .8 }), lite = mat(o.lite, { rough: .85 });
    const body = mk(GEO.caps, fur, .78, .62, .7, -.1, .78, 0, root); body.rotation.z = Math.PI / 2;
    mk(GEO.sph, lite, .36, .42, .42, .32, .8, 0, root);                          // chest fluff
    for (let i = 0; i < 4; i++) { const lg = grp(root, i < 2 ? .25 : -.42, .62, i % 2 ? .24 : -.24); mk(GEO.caps, i < 2 ? lite : fur, .2, .3, .2, 0, -.3, 0, lg); A.legs.push(lg); }
    const tg = grp(root, -.62, .9, 0), tl = mk(tailG(o.k, o.tl, o.tr, o.col, o.tip, o.tf), vcm(.85), 1, 1, 1, 0, 0, 0, tg); tl.rotation.z = o.ta; A.tail = tg;
    const hd = grp(root, .45, 1.62, 0); A.head = hd; const R = .74;
    mk(GEO.sph, fur, R, R * .94, R * 1.02, 0, 0, 0, hd);
    mk(GEO.sph, lite, .36, .26, .34, .56, -.24, 0, hd);                           // muzzle
    mk(GEO.sph, mat('#1a1416', { rough: .25 }), .1, .08, .12, .9, -.16, 0, hd, false);
    mk(GEO.sph, lite, .5, .34, .62, .18, -.38, 0, hd);                            // cheek fluff
    for (const s of [-1, 1]) { const eg = grp(hd, -.12, .5, s * .4); eg.rotation.set(s * o.ex, 0, -.12);
      mk(earG(o.k, o.ew, o.eh, o.round), fur, 1, 1, 1, 0, 0, 0, eg); mk(earG(o.k + 'i', o.ew * .55, o.eh * .66, o.round, .06), mat(o.ein, { rough: .9 }), 1, 1, 1, .07, .04, 0, eg, false); }
    face(hd, [0, 0, 0], R, { az: .5, el: .08, ew: .2, eh: .26, iris: o.iris, blush: '#ff8aa0', mouth: 'smile', mEl: -.42, mw: .07 });
    return A;
  }

  const B = {
    sprite(root) { const A = {}, core = mat('#ff8a2a', { em: .75, emc: '#ff5a10', rough: .4 });
      const f = grp(root, 0, .45, 0); A.flame = f;
      mk(flameG(), core, 1, 1, 1, 0, 0, 0, f);
      A.shell = mk(flameG(), basic('#ff7a2a', { op: .22, add: true }), 1.2, 1.12, 1.2, 0, -.08, 0, f, false);
      A.tongues = [-1, 1].map(s => { const t = mk(flameG(), core, .28, .32, .28, -.1, 1.25, s * .62, f, false); t.rotation.x = s * .7; return t; });
      face(f, [0, .78, 0], .84, { az: .4, el: 0, ew: .21, eh: .28, mouth: 'smile', mcol: '#7a2a10', blush: '#ff5a3a' });
      A.embers = [0, 1, 2].map(i => mk(GEO.sphL, basic('#ffe080', { add: true }), .08, .08, .08, 0, 0, 0, root, false));
      A.tick = (t, d) => { f.position.y = .55 + Math.sin(t * 2.6) * .14; const fl = 1 + Math.sin(t * 13) * .04 + Math.sin(t * 7.3) * .03; f.scale.set(1 / Math.sqrt(fl), fl, 1 / Math.sqrt(fl)); f.rotation.x = Math.sin(t * 3) * .06;
        A.shell.scale.y = 1.12 + Math.sin(t * 17) * .06; A.tongues.forEach((m, i) => m.scale.y = .32 + Math.sin(t * 11 + i * 2) * .07);
        A.embers.forEach((e, i) => { const a = t * 1.8 + i * 2.1, h = (t * .6 + i / 3) % 1; e.position.set(Math.cos(a) * 1.05, .6 + h * 2.4, Math.sin(a) * 1.05); e.scale.setScalar(.09 * (1 - h)); }); };
      A.fly = 1; return A; },

    slimelet(root, o = {}) { const A = {}, col = o.col || '#6fdc5a', b = grp(root); A.body = b;
      mk(slimeG(), mat(col, { rough: .16, em: .12 }), 1, 1, 1, 0, 0, 0, b);
      mk(GEO.sph, basic('#ffffff', { op: .5 }), .2, .12, .3, .3, 1.44, -.38, b, false).rotation.x = -.5;  // gloss
      mk(GEO.sph, basic('#ffffff', { op: .35 }), .07, .07, .07, .62, 1.3, -.5, b, false);
      mk(GEO.sph, mat(o.inner || '#3fae3a', { rough: .3, op: .5 }), .26, .26, .26, -.25, .5, .5, b, false); // a bubble inside
      face(b, [0, .9, 0], 1.08, { az: .3, el: .14, ew: .24, eh: .3, iris: o.iris || '#4a9a3a', blush: '#ff7a9a', mouth: 'smile', mw: .1 });
      if (!o.crown) { const sp = grp(b, -.05, 1.7, 0); A.sprout = sp; mk(GEO.cylL, mat('#4a8a2a'), .04, .3, .04, 0, .12, 0, sp);
        for (const s of [-1, 1]) { const l = mk(leafG(), dbl('#8ae860', { rough: .6 }), .7, 1, .7, 0, .26, 0, sp, false); l.rotation.set(0, s > 0 ? 0 : Math.PI, .6); } }
      A.tick = (t, d) => { const sq = Math.sin(t * (d > 8 ? 9 : 3.2)) * (d > 8 ? .1 : .05); b.scale.set(1 - sq * .6, 1 + sq, 1 - sq * .6); if (A.sprout) A.sprout.rotation.x = Math.sin(t * 3.2 + 1) * .2; if (A.crown) A.crown.rotation.y = Math.sin(t * 1.5) * .15; };
      return A; },

    crowned(root) { const A = B.slimelet(root, { col: '#ff6af0', inner: '#c040b0', iris: '#b03aa0', crown: 1 }); root.scale.setScalar(1.08);
      const c = grp(A.body, -.05, 1.62, 0); c.rotation.z = -.16; A.crown = c; const gold = mat('#ffcf40', { metal: .85, rough: .25, em: .15 });
      mk(crownG(), dbl('#ffcf40', { metal: .85, rough: .25, em: .15 }), 1, 1, 1, 0, .18, 0, c);
      mk(GEO.tor, gold, .52, .52, .7, 0, .02, 0, c).rotation.x = Math.PI / 2;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; mk(GEO.sphL, mat('#fff0a0', { metal: .6, rough: .2, em: .4 }), .07, .07, .07, Math.cos(a) * .52, .85, Math.sin(a) * .52, c, false); }
      mk(GEO.oct, mat('#ff3a6a', { rough: .1, em: .6 }), .1, .14, .08, .52, .2, 0, c, false);
      mk(GEO.oct, mat('#5ad0ff', { rough: .1, em: .6 }), .07, .1, .06, .37, .2, .37, c, false).rotation.y = -.8;
      return A; },

    pup(root) { const A = quad(root, { k: 'pup', col: '#a8a39a', lite: '#ece6dc', tip: '#ece6dc', tf: .78, tl: .9, tr: .2, ta: 1.0, ew: .42, eh: .52, round: 1, ex: .35, ein: '#e8a0a8', iris: '#5a8ad0' });
      mk(GEO.tor, mat('#d84a3a', { rough: .6 }), .44, .44, .7, .3, 1.12, 0, root).rotation.set(Math.PI / 2, .35, 0);
      mk(GEO.cyl, mat('#ffd040', { metal: .8, rough: .3 }), .1, .03, .1, .62, 1.0, 0, root, false).rotation.z = Math.PI / 2;
      A.tick = (t, d) => { A.tail.rotation.y = Math.sin(t * 14) * .5; A.head.rotation.z = Math.sin(t * 1.3) * .05; A.head.rotation.x = Math.sin(t * .8) * .12;
        A.legs.forEach((l, i) => l.rotation.z = Math.sin(t * 12 + (i === 0 || i === 3 ? 0 : Math.PI)) * .55 * (d > 8 ? 1 : 0)); };
      return A; },

    trialfox(root) { const A = quad(root, { k: 'fox', col: '#f07a2a', lite: '#fff4e8', tip: '#ffffff', tf: .7, tl: 1.5, tr: .38, ta: 1.05, ew: .44, eh: .72, round: 0, ex: .22, ein: '#3a2420', iris: '#c88a20' });
      for (const s of [-1, 1]) mk(GEO.sph, mat('#3a2420', { rough: .9 }), .11, .1, .11, 0, .05, 0, A.legs[s > 0 ? 0 : 1].children[0].parent, false).position.y = -.56;  // dark socks
      mk(GEO.tor, mat('#2ab0a0', { rough: .6 }), .42, .42, .9, .3, 1.12, 0, root).rotation.set(Math.PI / 2, .35, 0);   // scarf
      mk(GEO.cyl, mat('#ffcf40', { metal: .85, rough: .25, em: .2 }), .15, .035, .15, .6, .96, 0, root, false).rotation.z = Math.PI / 2 - .3;  // trial medal
      mk(GEO.oct, mat('#ff4a4a', { em: .8, rough: .1 }), .05, .07, .05, .63, .97, 0, root, false);
      A.tick = (t, d) => { A.tail.rotation.y = Math.sin(t * 4.5) * .45; A.tail.rotation.x = Math.sin(t * 2.2) * .08; A.head.rotation.x = Math.sin(t * .9) * .14; A.head.rotation.z = Math.sin(t * 1.7) * .04;
        A.legs.forEach((l, i) => l.rotation.z = Math.sin(t * 12 + (i === 0 || i === 3 ? 0 : Math.PI)) * .55 * (d > 8 ? 1 : 0)); };
      return A; },

    batling(root) { const A = {}, b = grp(root, 0, 1.2, 0); A.b = b; const fur = mat('#8a5aa0', { rough: .85 });
      mk(furG(), fur, .95, .9, .95, 0, 0, 0, b);
      mk(GEO.sph, mat('#e8d0e8', { rough: .9 }), .5, .5, .62, .55, -.35, 0, b);            // belly
      mk(GEO.sph, fur, .24, .2, .24, -.05, .88, 0, b).rotation.z = .5;                  // tuft
      for (const s of [-1, 1]) { const e = grp(b, -.05, .6, s * .42); e.rotation.set(s * .45, 0, -.15); mk(earG('bat', .5, .8, 0), fur, 1, 1, 1, 0, 0, 0, e); mk(earG('bati', .28, .5, 0, .06), mat('#f0a0c8', { rough: .9 }), 1, 1, 1, .07, .06, 0, e, false);
        mk(GEO.sph, mat('#4a2a50'), .14, .1, .14, .1, -.88, s * .3, b); }
      A.wings = [-1, 1].map(s => { const w = grp(b, -.2, .05, s * .7); w.rotation.y = s * -.35; const m = mk(batWingG(), dbl('#5a3a70', { rough: .7 }), 1.1, 1.1, s, 0, 0, 0, w); return { w, s }; });
      face(b, [0, 0, 0], .95, { az: .42, el: .12, ew: .22, eh: .28, iris: '#d070ff', blush: '#ff8ac0', mouth: 'fang', mw: .09, mEl: -.22 });
      A.tick = (t, d) => { b.position.y = 1.25 + Math.sin(t * 4) * .14; const f = Math.sin(t * (d > 8 ? 22 : 14)); A.wings.forEach(({ w, s }) => w.rotation.x = s * f * .65); b.rotation.z = Math.sin(t * 2) * .06; };
      A.fly = 1; return A; },

    golemite(root) { const A = {}, rock = mat('#8a4a30', { rough: .95, flat: true }), dark = mat('#5e3020', { rough: .95, flat: true }), glow = mat('#ffb040', { em: 2.2 });
      const b = grp(root); A.b = b;
      mk(rockG('b', 1), rock, .72, .66, .66, 0, .82, 0, b);
      for (const s of [-1, 1]) { mk(rockG('l', 3), dark, .26, .3, .26, 0, .22, s * .34, b); }
      A.arms = [-1, 1].map(s => { const a = grp(b, 0, 1.15, s * .74); mk(rockG('a', 2), dark, .26, .4, .26, 0, -.3, 0, a); return a; });
      mk(GEO.box, glow, .02, .4, .06, .7, .85, .12, b, false).rotation.x = .5;          // glowing cracks
      mk(GEO.box, glow, .02, .26, .05, .66, .7, -.22, b, false).rotation.x = -.6;
      const h = grp(b, .08, 1.95, 0); A.h = h;
      mk(rockG('h', 5), rock, .8, .72, .82, 0, 0, 0, h);
      mk(GEO.sph, mat('#5a8a3a', { rough: 1, flat: true }), .45, .14, .42, -.12, .64, 0, h);   // moss cap
      for (const s of [-1, 1]) { const hn = mk(hornG(), mat('#d8c8a8', { rough: .7 }), 1, 1, 1, -.05, .5, s * .48, h); hn.rotation.set(s * .45, 0, .15); }
      mk(GEO.oct, mat('#ffb040', { em: 1.2, rough: .1 }), .12, .22, .12, -.1, 1.3, -.6, b, false).rotation.x = -.4;
      face(h, [0, 0, 0], .78, { glow: '#ff8a10', iris: '#fff0b0', az: .38, el: .02, ew: .2, eh: .24, mouth: 'smile', mcol: '#2a140a', mw: .09 });
      A.tick = (t, d) => { const w = d > 8 ? 1 : .25; b.rotation.x = Math.sin(t * 6 * (d > 8 ? 1.4 : .5)) * .08 * w * 2; A.arms.forEach((a, i) => a.rotation.z = Math.sin(t * 8 + i * Math.PI) * .5 * w); h.rotation.y = Math.sin(t * .7) * .15; };
      return A; },

    ghostling(root, o = {}) { const A = {}, col = o.col || '#a6c4ff', b = grp(root, 0, .6, 0); A.b = b;
      const sy = o.shade ? .62 : 1; A.body = mk(ghostG('g', 7), dbl(col, { em: o.em ?? .2, rough: .45 }), 1, sy, 1, 0, 0, 0, b);
      mk(ghostG('g', 7), basic(o.aura || '#c8dcff', { op: .16, add: true }), 1.12, sy * 1.06, 1.12, 0, -.05, 0, b, false);
      A.arms = [-1, 1].map(s => { const a = mk(GEO.sph, mat(col, { em: o.em ?? .2, rough: .45 }), .22, .32, .2, .1, 1.05, s * .92, b); a.rotation.x = s * .6; return a; });
      if (!o.shade) face(b, [0, 1.5, 0], .92, { sink: 1, az: .34, el: .08, ew: .22, eh: .3, iris: '#6a8ae0', blush: '#ff9ac8', mouth: 'open', mw: .1 });
      A.tick = (t, d) => { b.position.y = .55 + Math.sin(t * 2.2) * .16; A.body.rotation.y = t * .8; b.rotation.z = Math.sin(t * 1.6) * .07 - (d > 8 ? .12 : 0); A.arms.forEach((a, i) => a.position.y = (o.shade ? .8 : 1.05) + Math.sin(t * 3 + i * Math.PI) * .07); };
      A.fly = 1; return A; },

    shade(root) { const A = B.ghostling(root, { col: '#4a2e78', em: .25, aura: '#8a4aff', shade: 1 }), b = A.b, cloak = dbl('#2a1a48', { rough: .7 });
      const hood = mk(geo('hood', () => new T3.SphereGeometry(1, 24, 16, Math.PI + .95, Math.PI * 2 - 1.9, 0, Math.PI * .72)), cloak, .8, .84, .8, -.04, 1.72, 0, b); hood.rotation.z = .12;
      mk(GEO.sph, mat('#0a0612', { rough: 1 }), .66, .66, .68, 0, 1.68, 0, b, false);     // the void inside the hood
      mk(GEO.hemi, cloak, .6, .3, .64, -.14, 2.24, 0, b).rotation.z = -.5;                   // hood peak
      face(b, [0, 1.68, 0], .68, { glow: '#c070ff', az: .34, el: .02, ew: .18, eh: .2, sink: 1 });
      const c = grp(b, -.1, 2.4, 0); c.rotation.z = -.25; mk(crownG(), dbl('#8a7a4a', { metal: .7, rough: .4 }), .7, .7, .7, 0, 0, 0, c);   // tarnished circlet
      mk(GEO.oct, mat('#b060ff', { em: 1.6 }), .08, .12, .07, .35, .05, 0, c, false);
      A.wisps = [0, 1].map(i => mk(flameG(), basic('#9a5aff', { op: .4, add: true }), .22, .3, .22, 0, 0, 0, b, false));
      const _t = A.tick; A.tick = (t, d) => { _t(t, d); A.wisps.forEach((w, i) => { const a = t * 1.4 + i * Math.PI; w.position.set(Math.cos(a) * 1.15, .5 + Math.sin(t * 2 + i) * .4, Math.sin(a) * 1.15); w.scale.y = .3 + Math.sin(t * 9 + i) * .06; }); };
      return A; },

    mote(root) { const A = {}, b = grp(root, 0, .6, 0); A.b = b; const cm = mat('#a0a0ff', { rough: .06, metal: .25, em: .55, emc: '#7a7aff', flat: true });
      mk(gemG(), cm, .9, .9, .9, 0, 0, 0, b);
      mk(gemG(), basic('#c8c8ff', { op: .18, add: true }), 1.1, 1.05, 1.1, 0, -.06, 0, b, false);
      face(b, [0, 1.2, 0], .54, { az: .4, el: .05, ew: .17, eh: .23, iris: '#e0b0ff', blush: '#ff9ad0', mouth: 'smile', mw: .07, sink: 1.0 });
      A.ring = mk(GEO.torThin, basic('#d0c8ff', { op: .55, add: true }), 1.1, 1.1, 1.1, 0, .6, 0, b, false); A.ring.rotation.x = Math.PI / 2 + .25;
      A.shards = [0, 1, 2].map(i => mk(GEO.oct, mat(['#c0a0ff', '#90c0ff', '#ffa0e0'][i], { rough: .05, em: .8, flat: true }), .12, .22, .12, 0, 0, 0, b, false));
      A.tick = (t, d) => { b.position.y = .65 + Math.sin(t * 2) * .15; b.rotation.y = Math.sin(t * .9) * .35; A.ring.rotation.z = t * .9;
        A.shards.forEach((s, i) => { const a = t * 1.6 + i * 2.09; s.position.set(Math.cos(a) * 1.15, 1.15 + Math.sin(a * 2) * .2, Math.sin(a) * 1.15); s.rotation.y = t * 3; }); };
      A.fly = 1; return A; },

    drone(root) { const A = {}, b = grp(root, 0, 1.25, 0); A.b = b; const brass = mat('#c8a050', { metal: .85, rough: .3 }), copper = mat('#b0603a', { metal: .8, rough: .35 }), dk = mat('#3a3028', { metal: .6, rough: .4 });
      mk(GEO.sph, brass, .85, .8, .85, 0, 0, 0, b);
      mk(GEO.tor, copper, .86, .86, 1.2, 0, -.05, 0, b).rotation.x = Math.PI / 2;            // equator band
      mk(GEO.torThin, dk, .84, .84, .84, 0, 0, 0, b).rotation.y = Math.PI / 2;               // panel seam
      mk(GEO.hemi, copper, .5, .3, .5, 0, -.72, 0, b).rotation.x = Math.PI;                  // belly cap
      mk(GEO.sph, mat('#141820', { rough: .05, metal: .3 }), .3, .42, .62, .66, .08, 0, b);  // visor glass
      face(b, [.06, .08, 0], .9, { glow: '#20c8ff', az: .3, el: 0, ew: .16, eh: .22, sink: .98 });
      for (const s of [-1, 1]) { mk(GEO.cyl, copper, .16, .34, .16, -.05, -.2, s * .9, b).rotation.x = s * .3; mk(GEO.cylL, basic('#6ae0ff', { add: true, op: .8 }), .12, .04, .12, -.05, -.38, s * .95, b, false);
        mk(GEO.sphL, brass, .05, .05, .05, .55, .45, s * .45, b, false); }
      mk(GEO.cylL, dk, .05, .35, .05, 0, .9, 0, b); mk(GEO.sphL, copper, .1, .08, .1, 0, 1.08, 0, b);
      const pr = grp(b, 0, 1.1, 0); A.prop = pr;
      for (const s of [-1, 1]) { const bl = mk(GEO.sph, brass, .62, .03, .14, s * .6, 0, 0, pr); bl.rotation.x = s * .3; }
      const an = grp(b, -.3, .65, -.35); an.rotation.set(-.4, 0, .4); mk(GEO.cylL, dk, .025, .4, .025, 0, .2, 0, an, false); mk(GEO.sphL, mat('#ff4a3a', { em: 2 }), .07, .07, .07, 0, .42, 0, an, false); A.ant = an.children[1];
      A.tick = (t, d) => { pr.rotation.y = t * 24; b.position.y = 1.3 + Math.sin(t * 3) * .1; b.rotation.z = d > 8 ? -.18 : Math.sin(t * 1.3) * .05; b.rotation.x = Math.sin(t * 1.1) * .06; A.ant.material.emissiveIntensity = Math.sin(t * 5) > 0 ? 2.4 : .5; };
      A.fly = 1; return A; },

    thorny(root) { const A = {}, g = mat('#5c8a2e', { rough: .6 }), dg = mat('#3e6a1e', { rough: .7 }), pink = dbl('#ff7a9a', { rough: .6 });
      for (let i = 0; i < 4; i++) { const l = mk(leafG(), dbl(i % 2 ? '#6aa03a' : '#4e8228', { rough: .6 }), 1.1, 1, 1.1, 0, .06, 0, root); l.rotation.set(0, i * Math.PI / 2 + .6, .25); }
      const st = mk(tubeG('stem', [[0, 0, 0], [-.08, .4, 0], [.06, .8, 0]], .13), dg, 1, 1, 1, 0, 0, 0, root);
      const h = grp(root, .06, 1.15, 0); A.h = h;
      mk(GEO.hemi, g, .85, .45, .8, 0, 0, 0, h).rotation.x = Math.PI;                       // lower jaw
      mk(GEO.circ, pink, .8, 1, .76, 0, .005, 0, h, false);
      const up = grp(h, -.62, 0, 0); A.up = up;                                               // upper jaw hinged at the back
      mk(GEO.hemi, g, .86, .82, .82, .62, 0, 0, up);
      const ui = mk(GEO.circ, pink, .8, 1, .76, .62, -.005, 0, up, false); ui.rotation.x = Math.PI;
      for (let i = -1; i <= 1; i++) mk(GEO.cone, basic('#fffaf0'), .07, .16, .07, .62 + .8 * Math.cos(i * .5), -.07, .76 * Math.sin(i * .5), up, false).rotation.x = Math.PI;
      for (const s of [-1, 1]) mk(GEO.cone, basic('#fffaf0'), .06, .14, .06, .8 * Math.cos(s * .3), .06, .76 * Math.sin(s * .3), h, false);
      for (let i = 0; i < 3; i++) { const a = (i - 1) * .7; const th = mk(GEO.cone, mat('#e8d890', { rough: .5 }), .07, .26, .07, .62 - .7 * Math.cos(a) * .9, .55, .7 * Math.sin(a) * .8, up); th.rotation.z = .9; th.rotation.x = Math.sin(a) * -.6; }
      face(up, [.62, 0, 0], .84, { az: .38, el: .5, ew: .2, eh: .26, iris: '#c0e040', blush: '#ff7a9a' });
      A.tick = (t, d) => { const ch = Math.max(0, Math.sin(t * 2.4)) ** 6; up.rotation.z = .12 + ch * .35; h.rotation.z = Math.sin(t * 1.2) * .08; h.position.x = .06 + Math.sin(t * 1.2) * .06; h.rotation.x = Math.sin(t * .9) * .08; };
      return A; },

    seraphling(root) { const A = {}, b = grp(root, 0, .5, 0); A.b = b; const robe = mat('#e8e2f8', { rough: .6 }), skin = mat('#ffe8e4', { rough: .5 }), gold = mat('#ffd860', { em: .8, metal: .5, rough: .3 });
      mk(geo('gown', () => sLathe([[0, 0], [.62, .08], [.58, .45], [.42, .9], [.25, 1.1], [0, 1.18]], 22, 20)), robe, 1, 1, 1, 0, 0, 0, b);
      const h = grp(b, .05, 1.72, 0); A.h = h;
      mk(GEO.sph, skin, .76, .74, .76, 0, 0, 0, h);
      mk(GEO.sph, mat('#f0cf78', { rough: .75 }), .7, .42, .74, -.2, .4, 0, h);               // soft hair cap
      mk(GEO.tor, mat('#f0cf78', { rough: .75 }), .14, .14, .14, .05, .78, 0, h).rotation.y = Math.PI / 2;   // little curl
      A.halo = mk(GEO.tor, gold, .46, .46, .8, -.3, 1.0, 0, h, false); A.halo.rotation.set(Math.PI / 2, -.45, 0);
      A.haloG = mk(GEO.tor, basic('#fff0a0', { op: .18, add: true }), .48, .48, 1.4, -.3, 1.0, 0, h, false); A.haloG.rotation.set(Math.PI / 2, -.45, 0);
      face(h, [0, 0, 0], .76, { az: .4, el: -.08, ew: .2, eh: .26, iris: '#8a90ff', blush: '#ff9ab0', mouth: 'smile', mw: .07 });
      for (const s of [-1, 1]) mk(GEO.sph, skin, .14, .14, .14, .35, .75, s * .42, b);
      A.wings = [-1, 1].map(s => { const w = grp(b, -.3, .95, s * .25); w.rotation.y = s * -.55;
        mk(featherWingG('a', 1), dbl('#f4f2fa', { rough: .65 }), 1, 1, s, 0, 0, 0, w);
        mk(featherWingG('b', .7), dbl('#d8d0ff', { rough: .6, em: .1 }), 1, 1, s, .05, .05, 0, w, false); return { w, s }; });
      A.tick = (t, d) => { b.position.y = .55 + Math.sin(t * 2.4) * .14; const f = Math.sin(t * (d > 8 ? 12 : 6)); A.wings.forEach(({ w, s }) => w.rotation.x = s * (f * .45 - .15)); A.halo.position.y = A.haloG.position.y = 1.0 + Math.sin(t * 3) * .05; h.rotation.z = Math.sin(t * 1.4) * .06; };
      A.fly = 1; return A; },

    impling(root) { const A = {}, b = grp(root); A.b = b; const skin = mat('#ffd54a', { rough: .35, metal: .45 }), dk = mat('#7a2a1a', { rough: .5 }), coinM = mat('#ffe070', { metal: .9, rough: .2, em: .3 });
      mk(geo('belly', () => sLathe([[0, 0], [.42, .08], [.5, .4], [.36, .78], [0, .88]], 18, 14)), skin, 1, 1, 1, 0, .35, 0, b);
      for (const s of [-1, 1]) mk(GEO.caps, skin, .18, .22, .18, 0, .2, s * .22, b);
      const h = grp(b, .05, 1.65, 0); A.h = h;
      mk(GEO.sph, skin, .78, .72, .8, 0, 0, 0, h);
      for (const s of [-1, 1]) { const hn = mk(hornG(), dk, 1.1, 1.1, 1.1, -.05, .55, s * .36, h); hn.rotation.set(s * .35, 0, -.1);
        const e = mk(GEO.cone, skin, .14, .5, .1, -.05, .05, s * .82, h); e.rotation.x = s * 1.5; e.rotation.z = -.2; }
      face(h, [0, 0, 0], .78, { az: .4, el: .05, ew: .2, eh: .26, iris: '#e04a1a', mouth: 'fang', mw: .1, mcol: '#5a1a10' });
      mk(GEO.sph, dk, .5, .08, .14, .62, .28, 0, h, false).rotation.y = Math.PI / 2;          // mischievous brow
      const cg = grp(b, .5, .85, 0); A.coin = cg;                                               // the gold coin, held up
      const c = mk(GEO.cyl, coinM, .3, .06, .3, 0, 0, 0, cg); c.rotation.z = Math.PI / 2;
      mk(GEO.box, mat('#c89a20', { metal: .9, rough: .3 }), .02, .22, .06, .035, 0, 0, cg, false);
      for (const s of [-1, 1]) mk(GEO.sph, skin, .11, .11, .11, -.08, -.08, s * .26, cg);
      mk(tubeG('imptail', [[-.3, .45, 0], [-.7, .35, 0], [-.85, .7, 0], [-.75, 1.05, 0]], .05), dk, 1, 1, 1, 0, 0, 0, b);
      A.tip = mk(spadeG(), dk, 1, 1, 1, -.72, 1.17, 0, b); A.tip.rotation.y = Math.PI / 2;
      A.wings = [-1, 1].map(s => { const w = grp(b, -.3, 1.0, s * .3); w.rotation.y = s * -.6; mk(batWingG(), dbl('#b03a2a', { rough: .6 }), .55, .55, s, 0, 0, 0, w); return { w, s }; });
      A.tick = (t, d) => { A.coin.rotation.x = t * 3; A.coin.position.y = .85 + Math.sin(t * 3) * .05; A.wings.forEach(({ w, s }) => w.rotation.x = s * Math.sin(t * 18) * .5); A.tip.rotation.z = Math.sin(t * 3) * .3; h.rotation.z = Math.sin(t * 2) * .07; b.rotation.y = Math.sin(t * 1.1) * .12; };
      return A; },
  };

  return function makePetModel(key) {
    const g = new T3.Group(), root = grp(g), fn = B[key] || B.slimelet;
    const A = fn(root) || {};
    const tick = (t, d = 0) => { if (A.tick) A.tick(t, d); if (!A.fly) root.position.y = -.25 / (g.scale.x || .2); };   // walkers sit on the ground
    tick(1.3, 0);   // settle the pose once (portraits never tick)
    return { g, legs: [], wings: [], tick };
  };
})();
// pet portraits (wardrobe / shop cards): 6b passes a PETS entry through EN; tag each so it renders this model
for (const k in PETS) PETS[k]._pk3 = k;
{ const _meL = makeEnemyModel; makeEnemyModel = function (d, b) { if (d && d._pk3 && PETS[d._pk3]) return makePetModel(d._pk3); return _meL(d, b); }; }
