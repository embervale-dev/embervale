// ================= HAVEN v3: detailed town buildings and props =================
// The base buildTown() (5_render3d.js) hands off to havenBuild() below, so every later wrapper
// (unlock filter, stall layout, extra stalls, Haven flags, trophies) still runs around it.
// Static parts are collected into a handful of InstancedMeshes (few draw calls).
const TWN = { geo: null, ims: [], mats: {} };
// own material cache for the persistent town materials (never disposed)
function twMat(k, col, o = {}) {
  if (TWN.mats[k]) return TWN.mats[k];
  const m = new T3.MeshStandardMaterial({ color: col, roughness: o.rough ?? .85, metalness: o.metal ?? .02, flatShading: !!o.flat });
  if (o.em) { m.emissive = new T3.Color(col); m.emissiveIntensity = o.em; }
  if (o.op !== undefined) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
  return TWN.mats[k] = m;
}
function townGeo() {
  if (TWN.geo) return TWN.geo;
  const g = {}, V2 = (a) => a.map(p => new T3.Vector2(p[0], p[1]));
  const sh = new T3.Shape(); sh.moveTo(-.5, 0); sh.lineTo(.5, 0); sh.lineTo(0, 1); sh.lineTo(-.5, 0);
  g.prism = new T3.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); g.prism.rotateY(Math.PI / 2); g.prism.translate(-.5, 0, 0); // gable: base 1x1 on y=0, ridge along x at y=1
  g.pyr = new T3.ConeGeometry(.7071, 1, 4); g.pyr.rotateY(Math.PI / 4); // square pyramid, 1x1 base
  g.oct = new T3.CylinderGeometry(1, 1, 1, 8);
  g.disc8 = new T3.CircleGeometry(1, 8); g.disc8.rotateX(-Math.PI / 2);
  g.trunk = new T3.CylinderGeometry(.62, 1, 1, 7); g.trunk.translate(0, .5, 0);
  g.barrel = new T3.LatheGeometry(V2([[0, 0], [.42, 0], [.5, .5], [.42, 1], [0, 1]]), 10);
  g.bowl = new T3.LatheGeometry(V2([[0, 0], [.5, .03], [.82, .2], [1, .48], [1.07, .55], [1.02, .6], [.92, .5], [0, .46]]), 20);
  g.lid = new T3.CylinderGeometry(1, 1, 1, 12, 1, false, 0, Math.PI); g.lid.rotateZ(Math.PI / 2); // half drum, axis x, dome up
  return TWN.geo = g;
}
function townKit() {
  const G3 = townGeo(), Q = [], E = new T3.Euler(0, 0, 0, 'YXZ'), Qt = new T3.Quaternion(), V = new T3.Vector3(), S3 = new T3.Vector3(), Mx = new T3.Matrix4(), C = new T3.Color();
  const W = '#ffffff';
  const L = (geo, m, shadow = true) => { const l = { geo, m, shadow, mats: [], cols: [] }; Q.push(l); return l; };
  const K = {
    b: L(GEO.box, twMat('b', W, { rough: .88 })),                       // everything boxy (plaster, timber, stone, roofs)
    bf: L(GEO.box, twMat('bf', W, { rough: .95 }), false),               // flat ground bits (cobbles), no shadow
    c: L(GEO.cylL, twMat('b', W, { rough: .88 })),                      // posts, logs
    cy: L(GEO.cyl, twMat('b', W)),                       // round stonework, discs
    m: L(GEO.box, twMat('m', W, { metal: .6, rough: .45 })),            // iron
    mc: L(GEO.cylL, twMat('m', W)),
    mt: L(GEO.torThin, twMat('m', W)),       // hoops, rings
    mp: L(G3.pyr, twMat('m', W)),            // lantern caps
    gl: L(GEO.box, twMat('gl', '#ffcf80', { em: 1.5 }), false),          // lit windows / lantern glass
    rune: L(GEO.box, twMat('rune', '#ff9a3a', { em: 2.4 }), false),
    fol: L(GEO.ico, twMat('fol', W, { flat: true, rough: .9 })),          // foliage
    sph: L(GEO.sphL, twMat('sph', W, { rough: .7 })),                     // flowers, fruit, sacks
    pr: L(G3.prism, twMat('b', W)),
    pyr: L(G3.pyr, twMat('b', W)),
    oct: L(G3.oct, twMat('b', W)),
    bar: L(G3.barrel, twMat('b', W)),
    cone: L(GEO.coneL, twMat('bf', W), false),            // grass tufts
    rf: L(GEO.cone, twMat('fol', W)),         // tower roofs
    bowl: L(G3.bowl, twMat('b', W)),
    lid: L(G3.lid, twMat('b', W)),
    mlid: L(G3.lid, twMat('m', W)),
    trunk: L(G3.trunk, twMat('bf', W)),
    ember: L(GEO.dod, twMat('ember', '#ff7a2a', { em: 1.2, flat: true }), false),
    flo: L(GEO.ico, twMat('fol', W), false),
  };
  // put(list, frame, x,y,z, sx,sy,sz, colour, ry, rx, rz) -- rotation applied roll, pitch, then yaw (YXZ)
  const put = (l, F, x, y, z, sx, sy, sz, col, ry = 0, rx = 0, rz = 0) => {
    E.set(rx, ry, rz); Qt.setFromEuler(E); Mx.compose(V.set(x, y, z), Qt, S3.set(sx, sy, sz));
    l.mats.push(F ? new T3.Matrix4().multiplyMatrices(F, Mx) : Mx.clone()); l.cols.push(col || W);
  };
  const flush = (grp) => {
    for (const l of Q) {
      if (!l.mats.length) continue;
      const im = new T3.InstancedMesh(l.geo, l.m, l.mats.length);
      for (let i = 0; i < l.mats.length; i++) { im.setMatrixAt(i, l.mats[i]); im.setColorAt(i, C.set(l.cols[i])); }
      im.castShadow = l.shadow; im.receiveShadow = true; grp.add(im); TWN.ims.push(im);
    }
  };
  return { K, put, flush, G3 };
}
const twFr = (x, z, ry = 0, y = 0) => new T3.Matrix4().compose(new T3.Vector3(x, y, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, ry, 0)), new T3.Vector3(1, 1, 1));
const twSub = (F, x, z, ry = 0, y = 0) => new T3.Matrix4().multiplyMatrices(F, twFr(x, z, ry, y));
const twPt = (F, x, y, z) => new T3.Vector3(x, y, z).applyMatrix4(F);

function buildTownV3() {
  const Lv = R3.lvl, { K, put, flush } = townKit();
  let sd = 1234567; const rr = () => { sd |= 0; sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pk = a => a[Math.floor(rr() * a.length)], sh = shade3, J = (a, b) => a + rr() * (b - a);
  const PLAST = ['#eadcc0', '#e2d0ae', '#d8c4a0', '#efe5d0', '#dcc8a2', '#e8d8c4', '#d2bc96'];
  const ROOFS = ['#8a3a2a', '#7a4232', '#5e4a3c', '#4a5a78', '#6a3a32', '#9a5a38', '#505a64', '#6e5a3a', '#7a3a3a'];
  const TIMB = ['#4a2e1c', '#3e2618', '#55361f'];
  const STONE = ['#8a8278', '#7d756b', '#968d80', '#857b6e', '#9a9084'];
  const DOORS = ['#6a3a22', '#4a5a3a', '#5a2a2a', '#3a4a5a', '#7a5a32', '#5a4030'];
  const SHUT = ['#3a5a3a', '#6a3a2a', '#3a4a6a', '#7a3a2a', '#4a6a5a', '#5a4a6a'];
  const FLOW = ['#e05a6a', '#f0d050', '#f0f0f8', '#c070e0', '#ff8a40', '#ff6a9a'];
  const GREENS = ['#3a6a2a', '#4a7a30', '#2e5a26', '#56843a', '#3e7034'];
  const smoke = [], fx = 19.5, fz = 13.5;

  // ---------- building parts ----------
  const win = (F, x, y, zf, o, w, h, tb, shc, lit, flowers) => {
    put(lit ? K.gl : K.b, F, x, y, zf + .006 * o, w, h, .03, lit ? null : '#262c34');
    put(K.b, F, x, y + h / 2 + .035, zf + .025 * o, w + .14, .07, .05, tb);
    put(K.b, F, x, y - h / 2 - .03, zf + .045 * o, w + .16, .06, .1, tb);
    for (const s of [-1, 1]) put(K.b, F, x + s * (w / 2 + .03), y, zf + .025 * o, .05, h, .05, tb);
    put(K.b, F, x, y, zf + .03 * o, .035, h, .03, tb); put(K.b, F, x, y + h * .12, zf + .03 * o, w, .035, .03, tb);
    if (shc) for (const s of [-1, 1]) { put(K.b, F, x + s * (w / 2 + .17), y, zf + .02 * o, .22, h + .04, .025, shc); put(K.b, F, x + s * (w / 2 + .17), y, zf + .036 * o, .2, .03, .01, sh(shc, .7)); }
    if (flowers) {
      put(K.b, F, x, y - h / 2 - .13, zf + .1 * o, w + .1, .12, .15, '#6a4a2a');
      for (let i = 0; i < 5; i++) { const fxx = x - w / 2 + .02 + i * (w - .04) / 4; put(K.flo, F, fxx, y - h / 2 - .045, zf + .1 * o, .06, .05, .06, pk(GREENS)); put(K.flo, F, fxx + .02, y - h / 2 - .01, zf + (.09 + (i % 2) * .03) * o, .04, .04, .04, pk(FLOW)); }
    }
  };
  const door = (F, x, zf, tb, st) => {
    const dc = pk(DOORS);
    put(K.b, F, x, .3 + .44, zf + .01, .52, .88, .05, dc);
    for (const s of [-.13, .13]) put(K.b, F, x + s, .74, zf + .04, .02, .84, .01, sh(dc, .7));
    for (const yy of [.5, 1.0]) put(K.m, F, x, yy, zf + .04, .46, .035, .01, '#2a2a2e');
    put(K.m, F, x + .16, .74, zf + .05, .04, .05, .03, '#c8a040');
    for (const s of [-1, 1]) put(K.b, F, x + s * .3, .3 + .48, zf + .03, .08, .96, .08, tb);
    put(K.b, F, x, 1.27, zf + .035, .72, .09, .09, tb);
    put(K.b, F, x, .08, zf + .17, .76, .16, .3, st);
    if (rr() < .55) { put(K.m, F, x + .46, 1.12, zf + .1, .03, .03, .18, '#2a2a30'); put(K.gl, F, x + .46, 1.0, zf + .19, .09, .13, .09); put(K.mp, F, x + .46, 1.1, zf + .19, .12, .08, .12, '#2a2a30'); }
  };
  const roof = (F, Wd, D, Ye, rc, pl, tb, chim, st, gableWin, ovx = .14, p = .95) => {
    const ovz = .3, rhR = D / 2 * p, hw = D / 2 + ovz, Ye0 = Ye - ovz * p, a = Math.atan2(p, 1), Ls = Math.hypot(hw, hw * p), t = .07, L = Wd + 2 * ovx;
    put(K.pr, F, 0, Ye - .001, 0, Wd, rhR, D, pl);
    for (const s of [-1, 1]) {
      const ny = Math.cos(a), nz = s * Math.sin(a), cy = (Ye0 + Ye + rhR) / 2, cz = s * hw / 2;
      put(K.b, F, 0, cy + ny * t / 2, cz + nz * t / 2, L, t, Ls + .04, sh(rc, .8), 0, s * a);
      const n = Math.max(4, Math.round(Ls / .27));
      for (let i = 0; i < n; i++) {
        const u = (i + .55) / n, py = Ye0 + (Ye + rhR - Ye0) * u, pz = s * hw * (1 - u), o = t + .02;
        put(K.b, F, 0, py + ny * o, pz + nz * o, L + .02, .045, Ls / n * 1.22, sh(rc, (i % 2 ? .9 : 1.06) * J(.95, 1.05)), 0, s * (a + .08));
      }
      for (const e of [-1, 1]) put(K.b, F, e * (L / 2 + .015), cy + ny * .03, cz + nz * .03, .05, .12, Ls + .08, tb, 0, s * a);
    }
    put(K.b, F, 0, Ye + rhR + .07, 0, L + .05, .09, .17, sh(rc, .7));
    for (const e of [-1, 1]) {
      if (gableWin && e === -1) continue;
      put(K.b, F, e * (Wd / 2 + .012), Ye + rhR * .42, 0, .03, rhR * .8, .07, tb);
      put(K.b, F, e * (Wd / 2 + .012), Ye + rhR * .38, 0, .03, .06, D * .55, tb);
    }
    if (chim) {
      const cx = chim * (Wd / 2 - .42), cz = -D * .2, top = Ye + rhR + .5, y0 = Ye - .2;
      put(K.b, F, cx, (y0 + top) / 2, cz, .42, top - y0, .42, st);
      put(K.b, F, cx, top + .04, cz, .5, .08, .5, sh(st, .75));
      put(K.c, F, cx, top + .17, cz, .08, .18, .08, '#7a4a32');
      if (rr() < .8) smoke.push(twPt(F, cx, top + .3, cz));
    }
    return Ye + rhR;
  };
  // one timber-framed house; front faces local +z, centred on footprint, ground at y=0
  const house = (F, w, d, fl, fg, back, opt = {}) => {
    const pl = opt.wall || pk(PLAST), tb = pk(TIMB), rc = opt.roof || pk(ROOFS), st = pk(STONE), shc = rr() < .7 ? pk(SHUT) : null, stoneH = opt.stone;
    put(K.b, F, 0, .15, 0, w + .08, .3, d + .08, st);
    for (let i = 0; i < Math.round(w / .5); i++) put(K.b, F, -w / 2 + .25 + i * .5 + (i % 2) * .05, .15, d / 2 + .045, .44, .12, .02, sh(st, i % 2 ? .85 : 1.08));
    let y = .3, dd = d; const SS = [];
    for (let i = 0; i < fl; i++) { const h = i ? .95 : (opt.h1 || 1.1); if (i) dd += .16; SS.push({ y0: y, h, dd }); y += h; }
    const Ye = y;
    SS.forEach((s, i) => {
      put(K.b, F, 0, s.y0 + s.h / 2, 0, w, s.h, s.dd, stoneH ? (i ? pl : st) : (i ? sh(pl, 1.03) : pl));
      if (!stoneH || i) {
        put(K.b, F, 0, s.y0 + .045, 0, w + .03, .09, s.dd + .03, tb);
        put(K.b, F, 0, s.y0 + s.h - .04, 0, w + .03, .08, s.dd + .03, tb);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(K.b, F, sx * w / 2, s.y0 + s.h / 2, sz * s.dd / 2, .11, s.h, .11, tb);
        for (const sx of [-1, 1]) put(K.b, F, sx * (w / 2 + .012), s.y0 + s.h / 2, 0, .03, s.h, .08, tb);
      } else for (const sx of [-1, 1]) for (let q = 0; q < 3; q++) put(K.b, F, sx * (w / 2 - .1), s.y0 + .18 + q * .36, s.dd / 2 + .01, .24 + (q % 2) * .12, .16, .04, sh(st, 1.15));
      const nb = Math.max(2, Math.round(w / 1.05)), bw = w / nb, faces = back ? [1, -1] : [1];
      const doorBay = Math.floor(nb / 2) - (nb % 2 === 0 && rr() < .5 ? 1 : 0);
      for (const o of faces) {
        const zf = o * (s.dd / 2 + .012);
        if (!stoneH || i) for (let k = 1; k < nb; k++) put(K.b, F, -w / 2 + k * bw, s.y0 + s.h / 2, zf, .08, s.h, .03, tb);
        for (let k = 0; k < nb; k++) {
          const cx = -w / 2 + (k + .5) * bw;
          if (i === 0 && o === 1 && k === doorBay) { door(F, cx, zf, tb, st); continue; }
          if (i > 0 && nb >= 3 && (k === 0 || k === nb - 1) && !stoneH) {
            const ang = Math.atan2(bw / 2, s.h - .1), Lb = Math.hypot(bw / 2, s.h - .1);
            for (const sgn of [-1, 1]) put(K.b, F, cx + sgn * bw / 4, s.y0 + s.h / 2, zf, .07, Lb, .03, tb, 0, 0, sgn * ang);
            continue;
          }
          win(F, cx, s.y0 + s.h * (i ? .52 : .56), zf, o, Math.min(.46, bw * .42), i ? .46 : .52, tb, o === 1 ? shc : null, rr() < .62, i === 0 && o === 1 && rr() < .6);
        }
      }
    });
    const top = SS[SS.length - 1], chim = !opt.noChim && rr() < .65 ? (rr() < .5 ? -1 : 1) : 0;
    let ridge;
    if (fg) {
      ridge = roof(twSub(F, 0, 0, Math.PI / 2), top.dd, w, Ye, rc, sh(pl, 1.03), tb, chim, st, true, .2);
      win(F, 0, Ye + w / 2 * .95 * .36, top.dd / 2 + .012, 1, .3, .36, tb, null, rr() < .7, false);
    } else ridge = roof(F, w, top.dd, Ye, rc, sh(pl, 1.03), tb, chim, st, false, .14, opt.pitch || .95);
    if (opt.sign) { put(K.m, F, .0, 2.0, d / 2 + .3, .03, .03, .55, '#2a2a30'); put(K.b, F, 0, 1.8, d / 2 + .5, .03, .34, .44, opt.sign); put(K.b, F, 0, 1.8, d / 2 + .5, .035, .26, .36, '#e8d8a8'); }
    return { Ye, ridge };
  };
  const barrel = (F, x, z, s = 1, c = '#7a5232') => { put(K.bar, F, x, 0, z, .62 * s, .78 * s, .62 * s, c); for (const yy of [.16, .62]) put(K.mt, F, x, yy * s, z, .29 * s, .29 * s, .29 * s, '#3a3a40', 0, Math.PI / 2); put(K.cy, F, x, .785 * s, z, .25 * s, .01, .25 * s, sh(c, .8)); };
  const crate = (F, x, z, s = 1, ry = 0, y = 0) => { const c = pk(['#9a7442', '#8a6838', '#a07a48']); put(K.b, F, x, y + .25 * s, z, .5 * s, .5 * s, .5 * s, c, ry); for (const yy of [.04, .46]) put(K.b, F, x, y + yy * s, z, .52 * s, .07 * s, .52 * s, sh(c, .75), ry); };
  const sack = (F, x, z, s = 1, c = '#c8b088') => { put(K.sph, F, x, .2 * s, z, .22 * s, .22 * s, .2 * s, c); put(K.sph, F, x, .4 * s, z, .1 * s, .08 * s, .1 * s, sh(c, .85)); };
  const hay = (F, x, z, ry = 0) => { put(K.b, F, x, .2, z, .7, .4, .42, '#d8b860', ry); for (const o of [-.18, .18]) put(K.b, F, x + Math.cos(ry) * o, .2, z - Math.sin(ry) * o, .03, .41, .43, '#a08040', ry); };
  const bush = (F, x, z, s = 1) => { for (let i = 0; i < 3; i++) put(K.fol, F, x + J(-.2, .2) * s, (.22 + i * .05) * s, z + J(-.15, .15) * s, J(.22, .32) * s, J(.2, .28) * s, J(.22, .3) * s, pk(GREENS), J(0, 6)); if (rr() < .5) for (let i = 0; i < 3; i++) put(K.sph, F, x + J(-.25, .25) * s, J(.3, .45) * s, z + J(-.1, .2) * s, .04, .04, .04, pk(FLOW)); };
  const tuft = (x, z) => { for (let i = 0; i < 3; i++) put(K.cone, null, x + J(-.08, .08), .07, z + J(-.08, .08), .035, J(.12, .2), .035, pk(GREENS), 0, J(-.3, .3), J(-.3, .3)); };
  const tree = (x, z, s = 1) => {
    put(K.trunk, null, x, 0, z, .14 * s, 1.25 * s, .14 * s, '#5a3a24');
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + J(0, .5); put(K.c, null, x + Math.cos(a) * .18 * s, .95 * s, z + Math.sin(a) * .18 * s, .04 * s, .45 * s, .04 * s, '#5a3a24', 0, Math.sin(a) * .7, -Math.cos(a) * .7); }
    put(K.fol, null, x, 1.75 * s, z, .78 * s, .7 * s, .78 * s, pk(GREENS), J(0, 6));
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + J(0, .6), r = J(.38, .55) * s; put(K.fol, null, x + Math.cos(a) * r, (1.35 + J(0, .6)) * s, z + Math.sin(a) * r, J(.42, .58) * s, J(.4, .52) * s, J(.42, .58) * s, pk(GREENS), J(0, 6)); }
    put(K.fol, null, x, 2.3 * s, z, .45 * s, .42 * s, .45 * s, pk(GREENS), J(0, 6));
    for (let i = 0; i < 4; i++) tuft(x + J(-.5, .5), z + J(-.5, .5));
  };
  const lamp = (x, z, armDir = 1) => {
    const ir = '#24242a';
    put(K.b, null, x, .12, z, .34, .24, .34, '#7a7268'); put(K.b, null, x, .26, z, .26, .06, .26, '#8a8278');
    put(K.mc, null, x, 1.35, z, .05, 2.1, .05, ir);
    for (const yy of [.42, 1.2, 2.25]) put(K.mc, null, x, yy, z, .08, .06, .08, ir);
    put(K.mp, null, x, 2.48, z, .1, .2, .1, ir);
    put(K.m, null, x + armDir * .22, 2.3, z, .44, .04, .04, ir); put(K.mt, null, x + armDir * .1, 2.2, z, .12, .12, .12, ir);
    const lx = x + armDir * .42;
    put(K.m, null, lx, 2.22, z, .02, .12, .02, ir);
    put(K.mp, null, lx, 2.12, z, .26, .12, .26, ir); put(K.m, null, lx, 1.8, z, .2, .03, .2, ir);
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(K.m, null, lx + ox * .085, 1.95, z + oz * .085, .02, .26, .02, ir);
    put(K.gl, null, lx, 1.95, z, .15, .24, .15, '#ffd89a');
    R3.flames.push(mk(GEO.sphL, mat('#ffc060', { em: 3 }), .06, .09, .06, lx, 1.95, z, Lv, false)); R3.torches.push({ x: lx, y: 1.9, z, col: '#ffb060' });
  };
  const bench = (x, z, ry) => { const F = twFr(x, z, ry), wd = '#7a5232'; put(K.b, F, 0, .36, 0, 1.1, .06, .32, wd); put(K.b, F, 0, .62, -.16, 1.1, .2, .04, wd); for (const s of [-1, 1]) { put(K.b, F, s * .45, .18, 0, .08, .36, .3, '#6a6258'); put(K.b, F, s * .45, .5, -.16, .05, .3, .05, wd); } };

  // ---------- perimeter: terraced houses (fronts sit over the boundary walls) ----------
  const split = (a, b) => { const out = []; let x = a; while (b - x > .05) { let w = J(2.5, 3.5); if (b - x - w < 2.3) w = b - x; if (w > 4.2) w = (b - x) / 2; out.push([x + w / 2, w]); x += w; } return out; };
  const rows = [['N', 3.3, 17.25], ['N', 21.75, 34.7], ['W', 3.3, 25], ['E', 3.3, 25]];
  // south edge is nearest the camera: a low crenellated town wall with a gate instead of houses
  for (let x = 2; x < 36; x++) {
    const c = sh('#8a8276', J(.9, 1.08)), cx = x + .5;
    if (Math.abs(cx - 19.5) < 1.2) continue;
    put(K.b, null, cx, 1.13, 25.5, 1.0, 2.26, 1.06, c); put(K.b, null, cx, 2.3, 25.5, 1.02, .08, 1.12, sh(c, 1.12));
    if (x % 2 === 0) put(K.b, null, cx, 2.54, 25.86, .5, .4, .3, c);
    for (let q = 0; q < 4; q++) { put(K.b, null, cx, .45 + q * .48, 26.035, 1.0, .03, .01, sh(c, .72)); put(K.b, null, x + (q % 2 ? .25 : .75), .69 + q * .48, 26.035, .03, .45, .01, sh(c, .72)); }
    put(K.b, null, cx, .08, 25.0, 1.0, .16, .08, sh(c, .85));
    if (rr() < .25) for (let i = 0; i < 4; i++) put(K.fol, null, cx + J(-.4, .4), J(.6, 1.9), 26.05, J(.12, .2), J(.12, .22), .05, pk(GREENS), 0, 0, J(0, 3));
    if (rr() < .3) tuft(cx + J(-.4, .4), 24.85);
  }
  for (const s of [-1, 1]) {
    const gx = 19.5 + s * 1.05, st = '#9a9084';
    put(K.b, null, gx, 1.25, 25.55, .5, 2.5, 1.2, st); put(K.b, null, gx, 2.55, 25.55, .62, .12, 1.32, sh(st, 1.1)); put(K.pyr, null, gx, 2.78, 25.55, .5, .36, .5, '#4e5662');
    put(K.m, null, gx - s * .2, 1.9, 24.75, .03, .03, .2, '#2a2a30'); put(K.gl, null, gx - s * .2, 1.75, 24.66, .1, .15, .1); put(K.mp, null, gx - s * .2, 1.87, 24.66, .14, .08, .14, '#2a2a30');
  }
  put(K.b, null, 19.5, 1.05, 25.55, 1.6, 2.1, .3, '#5a3a22'); for (let i = 0; i < 5; i++) put(K.b, null, 19.5 - .64 + i * .32, 1.05, 25.39, .02, 2.0, .02, '#3a2414');
  for (const yy of [.5, 1.5]) put(K.m, null, 19.5, yy, 25.39, 1.6, .08, .03, '#2a2a30');
  put(K.b, null, 19.5, 2.25, 25.55, 1.7, .3, .5, '#4a2e1c');
  const signs = ['#8a3a2a', '#2a5a7a', '#5a7a2a', '#7a5a2a'];
  for (const [side, a, b] of rows) {
    split(a, b).forEach(([s, w], i) => {
      const d = side === 'S' ? 1.7 + (i % 2) * .16 + J(0, .06) : 2.3 + (i % 2) * .22 + J(0, .08), fl = side === 'S' ? 1 : (rr() < .38 ? 3 : 2), fg = side !== 'S' && w < 3.3 && rr() < .4;
      const F = side === 'N' ? twFr(s, 3.04 - d / 2, 0) : side === 'S' ? twFr(s, 24.96 + d / 2, Math.PI) : side === 'W' ? twFr(3.04 - d / 2, s, Math.PI / 2) : twFr(34.96 + d / 2, s, -Math.PI / 2);
      house(F, w - .04, d, fl, fg, side === 'S', side === 'S' ? { h1: 1.92, pitch: .5, noChim: true } : { sign: rr() < .25 ? pk(signs) : null, stone: rr() < .12 });
      if (side === 'S') return;
      // front clutter
      const zf = d / 2 + .3, r = rr();
      if (r < .3) { barrel(F, -w / 2 + .35, zf, .9); if (rr() < .6) barrel(F, -w / 2 + .78, zf + .05, .8); }
      else if (r < .5) { crate(F, w / 2 - .4, zf, .9, J(-.3, .3)); if (rr() < .5) crate(F, w / 2 - .42, zf, .55, J(-.5, .5), .45); }
      else if (r < .7) bush(F, w / 2 - .4, zf);
      else if (r < .8) { put(K.b, F, -w / 2 + .5, .3, zf, .6, .06, .24, '#7a5232'); for (const q of [-1, 1]) put(K.b, F, -w / 2 + .5 + q * .24, .14, zf, .05, .28, .2, '#6a4428'); }
      for (let q = 0; q < 3; q++) { const p = twPt(F, J(-w / 2, w / 2), 0, d / 2 + J(.1, .25)); tuft(p.x, p.z); }
    });
  }
  // ---------- Ember Hall + bell tower behind the waystone ----------
  {
    const F = twFr(19.5, 3.04 - 1.35, 0), st = '#9a9084', sl = '#4e5662';
    house(F, 4.36, 2.7, 2, true, false, { wall: '#d8c8a8', roof: sl, stone: true });
    const T = twSub(F, 0, -.9);
    put(K.b, T, 0, 2.7, 0, 1.4, 5.4, 1.4, st);
    for (const yy of [1.2, 2.6, 3.9]) put(K.b, T, 0, yy, 0, 1.46, .12, 1.46, sh(st, .8));
    for (const [ry, o] of [[0, 1], [Math.PI / 2, 1], [Math.PI, 1], [-Math.PI / 2, 1]]) { const Q = twSub(T, 0, 0, ry); put(K.b, Q, 0, 4.65, .705, .5, .75, .02, '#1a1418'); put(K.b, Q, 0, 5.08, .72, .62, .1, .05, sh(st, .8)); for (const s of [-1, 1]) put(K.b, Q, s * .3, 4.65, .72, .08, .8, .05, sh(st, .85)); }
    put(K.cy, T, 0, 4.55, 0, .2, .3, .2, '#b08a3a'); put(K.b, T, 0, 5.47, 0, 1.6, .14, 1.6, sh(st, .75));
    put(K.pyr, T, 0, 6.24, 0, 1.6, 1.4, 1.6, sl);
    put(K.mc, T, 0, 7.1, 0, .03, .5, .03, '#2a2a30');
    const em = mk(GEO.sphL, mat('#ffb04a', { em: 3 }), .1, .14, .1, 19.5, 7.42, 3.04 - 1.35 - .9, Lv, false); R3.flames.push(em);
    for (const s of [-1, 1]) { put(K.m, F, s * 1.45, 2.6, 1.42, .04, .04, .2, '#2a2a30'); put(K.b, F, s * 1.45, 2.05, 1.5, .5, 1.1, .03, '#b0402a'); put(K.b, F, s * 1.45, 2.05, 1.515, .36, .9, .01, '#d8a040'); put(K.b, F, s * 1.45, 2.05, 1.52, .16, .5, .01, '#b0402a'); put(K.pr, F, s * 1.45, 1.5, 1.5, .03, .16, .5, '#b0402a', Math.PI / 2, Math.PI); }
  }
  // ---------- corner watchtowers (north) ----------
  for (const [tx, tz, dir] of [[2.3, 2.3, 1], [35.7, 2.3, -1]]) {
    const st = '#8a8276';
    put(K.cy, null, tx, 1.9, tz, 1.25, 3.8, 1.25, st);
    for (const yy of [.15, 1.3, 2.6]) put(K.cy, null, tx, yy, tz, 1.29, .12, 1.29, sh(st, .82));
    put(K.cy, null, tx, 3.95, tz, 1.42, .32, 1.42, sh(st, 1.08));
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; put(K.b, null, tx + Math.cos(a) * 1.3, 4.25, tz + Math.sin(a) * 1.3, .3, .3, .26, sh(st, J(.9, 1.1)), -a + Math.PI / 2); }
    put(K.rf, null, tx, 5.0, tz, 1.15, 1.7, 1.15, '#4e5662');
    put(K.mc, null, tx, 6.05, tz, .03, .6, .03, '#2a2a30');
    for (const a of [Math.PI * .5, Math.PI * (dir > 0 ? .25 : .75)]) { const ca = Math.cos(a), sa = Math.sin(a); put(K.b, null, tx + ca * 1.24, 2.0, tz + sa * 1.24, .1, .5, .16, '#1a1418', Math.atan2(ca, sa)); put(K.gl, null, tx + ca * 1.25, 3.2, tz + sa * 1.25, .2, .3, .1, null, Math.atan2(ca, sa)); }
    const flag = mk(GEO.box, mat('#c04a2a', { rough: .9 }), .5, .3, .02, tx + .27, 6.2, tz, Lv);
    R3.anim.push(() => { flag.rotation.y = Math.sin(G.t * 2.2 + tx) * .35; flag.position.x = tx + Math.cos(flag.rotation.y) * .27; flag.position.z = tz - Math.sin(flag.rotation.y) * .27; });
  }

  // ---------- plaza: cobbles, kerb, paths ----------
  const COB = ['#8a8274', '#7e7668', '#958a7a', '#857a6a', '#9a9282', '#78705f'];
  for (let r = 2.25; r < 4.3; r += .29) { const n = Math.floor(Math.PI * 2 * r / .3), o = rr(); for (let i = 0; i < n; i++) { const a = (i + o) / n * Math.PI * 2; put(K.bf, null, fx + Math.cos(a) * r, .015, fz + Math.sin(a) * r, J(.2, .25), .035, J(.18, .23), pk(COB), -a + J(-.15, .15)); } }
  { const n = 92; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; put(K.bf, null, fx + Math.cos(a) * 4.45, .03, fz + Math.sin(a) * 4.45, .27, .06, .2, i % 2 ? '#a89e8c' : '#9a907e', -a + Math.PI / 2); } }
  const path = (x0, z0, x1, z1, wid) => {
    const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, ry = Math.atan2(ux, uz);
    for (let t = .15; t < len; t += .3) { const row = Math.round(t / .3); for (let q = -wid / 2 + .15 + (row % 2) * .15; q < wid / 2 - .05; q += .3) put(K.bf, null, x0 + ux * t - uz * q + J(-.03, .03), .015, z0 + uz * t + ux * q + J(-.03, .03), J(.21, .26), .035, J(.2, .25), pk(COB), ry + J(-.12, .12)); }
    for (const s of [-1, 1]) for (let t = .2; t < len; t += .42) put(K.bf, null, x0 + ux * t - uz * s * wid / 2, .025, z0 + uz * t + ux * s * wid / 2, .14, .05, .36, '#a0968a', ry);
  };
  path(fx, fz - 4.55, fx, 7.0, 1.9); path(fx, fz + 4.55, fx, 25, 1.9); path(fx - 4.55, fz, 3.1, fz, 1.6); path(fx + 4.55, fz, 34.9, fz, 1.6);
  for (const [a, ry] of [[Math.PI * .25, Math.PI * 1.25], [Math.PI * .75, Math.PI * 1.75], [Math.PI * 1.25, Math.PI * .25], [Math.PI * 1.75, Math.PI * .75]]) {
    const x = fx + Math.cos(a) * 3.35, z = fz + Math.sin(a) * 3.35; bench(x, z, -a - Math.PI / 2);
    const px = fx + Math.cos(a + .42) * 3.5, pz = fz + Math.sin(a + .42) * 3.5;
    put(K.oct, null, px, .17, pz, .32, .34, .32, '#8a8276'); put(K.cy, null, px, .36, pz, .27, .04, .27, '#3a2818');
    for (let i = 0; i < 6; i++) put(K.sph, null, px + J(-.18, .18), J(.4, .5), pz + J(-.18, .18), .07, .07, .07, i < 3 ? pk(GREENS) : pk(FLOW));
  }
  // ---------- the Ember fountain ----------
  {
    const st = '#8e8474', st2 = '#a39888';
    put(K.oct, null, fx, .07, fz, 2.05, .14, 2.05, sh(st, .9)); put(K.oct, null, fx, .38, fz, 1.75, .48, 1.75, st);
    for (let k = 0; k < 8; k++) {
      const pa = Math.PI / 8 + k * Math.PI / 4, va = k * Math.PI / 4;
      put(K.b, null, fx + Math.sin(pa) * 1.62, .67, fz + Math.cos(pa) * 1.62, 1.36, .1, .28, st2, pa);
      put(K.b, null, fx + Math.sin(va) * 1.73, .74, fz + Math.cos(va) * 1.73, .22, .2, .22, sh(st2, 1.05), va);
      put(K.b, null, fx + Math.sin(pa) * 1.66, .38, fz + Math.cos(pa) * 1.66, .7, .22, .04, sh(st, .82), pa);
      put(K.rune, null, fx + Math.sin(pa) * 1.68, .38, fz + Math.cos(pa) * 1.68, .12, .1, .02, null, pa);
    }
    const poolM = new T3.MeshStandardMaterial({ color: '#4a1606', emissive: '#ff5a14', emissiveIntensity: 1.3, roughness: .7 });
    const pool = mk(GEO.circ, poolM, 1.56, 1, 1.56, fx, .64, fz, Lv, false); pool.userData.ownMat = true;
    for (let i = 0; i < 26; i++) { const a = rr() * 6.28, r = J(.4, 1.45); put(K.ember, null, fx + Math.cos(a) * r, .64, fz + Math.sin(a) * r, J(.05, .11), J(.03, .06), J(.05, .11), null, J(0, 6), J(0, 3)); }
    put(K.cy, null, fx, .9, fz, .42, .2, .42, st2); put(K.cy, null, fx, 1.15, fz, .26, .6, .26, st);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; put(K.b, null, fx + Math.cos(a) * .26, 1.05, fz + Math.sin(a) * .26, .12, .4, .12, st2, -a); }
    put(K.bowl, null, fx, 1.3, fz, .9, .5, .9, st2);
    const mid = mk(GEO.circ, poolM, .8, 1, .8, fx, 1.548, fz, Lv, false); mid.userData.ownMat = true;
    put(K.cy, null, fx, 1.8, fz, .13, .55, .13, st); put(K.mt, null, fx, 1.65, fz, .16, .16, .16, '#b08a3a', 0, Math.PI / 2);
    put(K.bowl, null, fx, 2.02, fz, .42, .34, .42, st2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; put(K.ember, null, fx + Math.cos(a) * .2, 2.18, fz + Math.sin(a) * .2, .07, .06, .07, null, a, a); }
    const fl = mk(GEO.sph, mat('#ff9a2a', { em: 3 }), .17, .3, .17, fx, 2.4, fz, Lv, false); R3.flames.push(fl);
    const core = mk(GEO.sphL, mat('#fff0b0', { em: 4 }), .08, .14, .08, fx, 2.34, fz, Lv, false);
    R3.torches.push({ x: fx, y: 2.4, z: fz, col: '#ffb050' });
    R3.anim.push(() => {
      poolM.emissiveIntensity = 1.15 + .25 * Math.sin(G.t * 1.7) + .1 * Math.sin(G.t * 4.3); core.scale.y = .14 * (1 + .25 * Math.sin(G.t * 11));
      if (G.parts.length < 1000) {
        if (Math.random() < .35) { const a = Math.random() * 6.28, r = Math.random() * 1.4; G.parts.push({ x: (fx + Math.cos(a) * r) * TILE, y: (fz + Math.sin(a) * r) * TILE, z: .7, vx: rnd(-6, 6), vy: rnd(-6, 6), vz: rnd(.6, 1.3), g: .15, life: 1.6, max: 1.6, col: pick(['#ffb050', '#ff7a2a', '#ffd27a']), size: 2 }); }
        if (Math.random() < .3) { const a = Math.random() * 6.28; G.parts.push({ x: (fx + Math.cos(a) * .42) * TILE, y: (fz + Math.sin(a) * .42) * TILE, z: 2.2, vx: Math.cos(a) * 14, vy: Math.sin(a) * 14, vz: .2, g: 4, life: .45, max: .45, col: '#ffa040', size: 2.2 }); }
        if (Math.random() < .3) { const a = Math.random() * 6.28; G.parts.push({ x: (fx + Math.cos(a) * .88) * TILE, y: (fz + Math.sin(a) * .88) * TILE, z: 1.55, vx: Math.cos(a) * 18, vy: Math.sin(a) * 18, vz: .1, g: 4, life: .4, max: .4, col: '#ff8a30', size: 2.2 }); }
      }
    });
  }
  // ---------- lamps, trees, greenery ----------
  for (const [x, z, d] of [[13, 10, 1], [26, 10, -1], [13, 17.5, 1], [26, 17.5, -1], [19.5 + 1.3, 22, 1], [5.4, 11.9, 1], [33.6, 11.9, -1]]) lamp(x, z, d);
  for (const [x, z, s] of [[4.3, 13.1, .85], [34.6, 13.1, .9], [16.1, 4.2, .9], [22.9, 4.2, .95], [4.3, 23.6, .85], [34.7, 23.6, .85], [4.5, 19.2, .95], [34.5, 19.2, .9]]) tree(x, z, s);
  for (const [x, z] of [[5.6, 6.4], [33.3, 6.6], [10.4, 4.0], [28.6, 4.0], [5.4, 17.6], [33.6, 17.6], [11.3, 23.9], [27.7, 23.9], [3.8, 15.5], [35.1, 9.5], [3.8, 8.6]]) bush(null, x, z, J(.9, 1.2));
  for (let i = 0; i < 70; i++) { const x = J(3.3, 34.7), z = J(3.3, 24.8); if (Math.hypot(x - fx, z - fz) < 4.8 || (Math.abs(x - fx) < 1.2) || Math.abs(z - fz) < 1.1) continue; if (G.npcs.some(n => Math.abs(n.x * U - x) < 1.3 && Math.abs(n.y * U - z) < 1.1)) continue; tuft(x, z); }
  // a hand cart and woodpile for life around the edges
  { const F = twFr(4.6, 10.0, .5); put(K.b, F, 0, .45, 0, .8, .08, 1.1, '#8a6438'); for (const s of [-1, 1]) put(K.b, F, s * .4, .58, 0, .04, .22, 1.1, '#7a5430'); put(K.b, F, 0, .58, .55, .8, .22, .04, '#7a5430'); for (const s of [-1, 1]) { put(K.mt, F, s * .45, .28, -.05, .27, .27, .27, '#5a3a22', Math.PI / 2, 0, 0); put(K.c, F, s * .45, .28, -.05, .04, .06, .04, '#3a2a1a', 0, 0, Math.PI / 2); } for (const s of [-1, 1]) put(K.c, F, s * .3, .4, -1.0, .03, 1.0, .03, '#7a5430', 0, Math.PI / 2 - .25); sack(F, -.15, .1, .9); sack(F, .2, -.2, .85, '#b8a070'); crate(F, .1, .25, .55, .3, .5); }

  // ---------- stalls ----------
  const CREAM = '#efe3c4';
  const stall = (F, ac, slate) => {
    const wd = '#6a4428';
    for (const [x, z, h] of [[-.95, .3, 2.12], [.95, .3, 2.12], [-.95, -.7, 2.38], [.95, -.7, 2.38]]) { put(K.c, F, x, h / 2, z, .06, h, .06, wd); put(K.b, F, x, .04, z, .16, .08, .16, '#5a5048'); }
    put(K.b, F, 0, 2.09, .3, 2.0, .07, .07, wd); put(K.b, F, 0, 2.35, -.7, 2.0, .07, .07, wd);
    const z0 = -.84, y0 = 2.44, z1 = .36, y1 = 2.14, a = Math.atan2(y0 - y1, z1 - z0), Ls = Math.hypot(z1 - z0, y0 - y1), N = 7, sw = 2.26 / N;
    for (let i = 0; i < N; i++) {
      const x = -1.13 + sw * (i + .5), c = slate ? sh(ac, i % 2 ? .85 : 1.05) : (i % 2 ? CREAM : ac);
      put(K.b, F, x, (y0 + y1) / 2 + .02, (z0 + z1) / 2, sw + .004, .035, Ls + .02, c, 0, a);
      put(K.b, F, x, y1 - .035, z1 + .012, sw, .07, .02, c); put(K.cy, F, x, y1 - .07, z1 + .012, sw * .38, .02, sw * .38, c, 0, Math.PI / 2);
    }
    put(K.b, F, 0, y0 + .04, z0 - .02, 2.3, .05, .06, sh(ac, .6));
    put(K.m, F, -1.07, 1.85, .3, .24, .03, .03, '#2a2a30'); put(K.gl, F, -1.17, 1.7, .3, .1, .14, .1); put(K.mp, F, -1.17, 1.81, .3, .14, .08, .14, '#2a2a30');
  };
  const counter = (F, ac, top = '#8a6038') => {
    put(K.b, F, 0, .33, .5, 1.86, .62, .5, '#7a5030'); put(K.b, F, 0, .69, .5, 2.0, .06, .64, top);
    for (let i = 0; i < 6; i++) put(K.b, F, -.93 + .31 * (i + .5), .44, .768, .31, .38, .02, i % 2 ? CREAM : ac);
    put(K.b, F, 0, .645, .775, 1.9, .05, .025, sh(ac, .65));
  };
  const shelves = (F, cols, kind) => {
    put(K.b, F, 0, 1.0, -.82, 1.86, 1.9, .03, '#4e3420');
    for (const y of [.8, 1.32]) { put(K.b, F, 0, y, -.68, 1.84, .045, .28, '#6a4428'); for (let i = 0; i < 7; i++) { const x = -.8 + i * .27 + J(-.03, .03), c = pk(cols); if (kind === 'book') put(K.b, F, x, y + .13, -.68, J(.06, .1), J(.18, .24), .2, c); else if (kind === 'jar') { put(K.cy, F, x, y + .1, -.68, .06, .16, .06, c); put(K.cy, F, x, y + .2, -.68, .035, .04, .035, '#8a6a4a'); } else put(K.b, F, x, y + .09, -.68, J(.12, .18), J(.12, .18), .16, c, J(-.3, .3)); } }
  };
  const fig = (g, n, o, x, z) => { const h = makeHumanoid(o); h.g.position.set(x, 0, z); h.g.rotation.y = -Math.atan2(17.5 - (n.y * U + z), 19.5 - (n.x * U + x)); g.add(h.g); const seed = x * 7 + n.x; R3.anim.push(() => npcAnim(h, n, seed)); return h; };
  for (const n of G.npcs) {
    const nx = n.x * U, nz = n.y * U, F = twFr(nx, nz), g = new T3.Group(); g.position.set(nx, 0, nz); Lv.add(g);
    if (n.kind === 'portal') {
      const st = '#6a6478', stD = '#5a5468';
      put(K.oct, F, 0, .08, 0, 1.75, .16, 1.75, stD); put(K.oct, F, 0, .21, 0, 1.4, .12, 1.4, st);
      for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; put(K.rune, F, Math.sin(a) * 1.52, .17, Math.cos(a) * 1.52, .16, .03, .05, null, a); }
      const rg = mk(GEO.ring, basic('#ff9a3a', { op: .5, add: 1 }), 1.2, 1, 1.2, 0, .28, 0, g, false);
      for (const s of [-1, 1]) {
        for (let q = 0; q < 3; q++) put(K.b, F, s * 1.25 + J(-.02, .02), .27 + .3 + q * .55, 0, .5 - q * .03, .55, .48 - q * .02, sh(st, J(.88, 1.1)), J(-.06, .06));
        for (let q = 0; q < 3; q++) put(K.rune, F, s * 1.25, .55 + q * .5, .25, .14, .08 + (q % 2) * .06, .02);
        put(K.b, F, s * 1.25, .3, 0, .62, .1, .6, stD);
      }
      for (let i = 0; i <= 8; i++) { const th = i / 8 * Math.PI, key = i === 4; put(K.b, F, Math.cos(th) * 1.25, 1.92 + Math.sin(th) * 1.25, 0, .5, key ? .42 : .34, key ? .56 : .48, sh(st, J(.9, 1.1)), 0, 0, th); if (i % 2 === 0) put(K.rune, F, Math.cos(th) * 1.26, 1.92 + Math.sin(th) * 1.26, .25, .1, .1, .02, null, 0, 0, th); }
      const pr = mk(GEO.circ, basic('#ff9a3a', { op: .65, add: 1, unique: 1 }), .86, 1, 1.22, 0, 1.6, 0, g, false); pr.rotation.x = Math.PI / 2; pr.userData.ownMat = true;
      const r1 = mk(GEO.tor, mat('#ffb04a', { em: 2.5 }), .92, .92, .92, 0, 1.6, 0, g, false);
      const orbs = [0, 1, 2].map(i => mk(GEO.oct, mat('#ffb04a', { em: 2.2, flat: true }), .07, .1, .07, 0, 0, 0, g, false));
      R3.anim.push(() => { r1.rotation.z = G.t * 1.5; pr.material.opacity = .45 + .2 * Math.sin(G.t * 3); orbs.forEach((o, i) => { const a = G.t * .8 + i * 2.094; o.position.set(Math.cos(a) * 1.6, 1.4 + Math.sin(G.t * 1.3 + i) * .35 + i * .3, Math.sin(a) * .5 + .1); o.rotation.y = G.t * 2; }); rg.rotation.y = G.t * .2; });
      R3.torches.push({ x: nx, y: 1.4, z: nz + .6, col: '#ff9a3a' });
      for (const s of [-1, 1]) { const bx = s * 2.05, bz = .9; for (let q = 0; q < 3; q++) { const a = q * 2.094; put(K.mc, F, bx + Math.cos(a) * .1, .3, bz + Math.sin(a) * .1, .02, .62, .02, '#2a2a30', 0, Math.sin(a) * .25, -Math.cos(a) * .25); } put(K.bowl, F, bx, .58, bz, .18, .16, .18, '#3a3a40'); R3.flames.push(mk(GEO.sphL, mat('#ff9a3a', { em: 3 }), .09, .16, .09, nx + bx, .76, nz + bz, Lv, false)); }
    } else if (n.kind === 'stash') {
      const wd = '#7a4a20', ir = '#3a3a42', gold = '#d8b040';
      put(K.b, F, 0, .01, 0, 1.9, .02, 1.3, '#7a2a2a'); put(K.b, F, 0, .012, 0, 1.7, .02, 1.1, '#9a3a30'); for (const s of [-1, 1]) put(K.b, F, 0, .015, s * .5, 1.7, .02, .05, '#d8a040');
      put(K.b, F, 0, .06, 0, 1.25, .12, .82, '#6a6258');
      put(K.b, F, 0, .41, 0, 1.12, .58, .72, wd); for (const y of [.25, .45]) put(K.b, F, 0, y, .362, 1.1, .015, .01, sh(wd, .7));
      put(K.lid, F, 0, .7, 0, 1.13, .22, .37, sh(wd, 1.12));
      for (const x of [-.42, 0, .42]) { put(K.m, F, x, .41, 0, .07, .6, .75, ir); put(K.mlid, F, x, .7, 0, .07, .235, .385, ir); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(K.m, F, sx * .55, .41, sz * .35, .06, .62, .06, ir);
      put(K.m, F, 0, .62, .375, .18, .2, .04, gold); put(K.m, F, 0, .6, .4, .05, .07, .02, '#2a2018');
      for (const x of [-.42, .42]) for (const y of [.2, .5]) put(K.sph, F, x, y, .38, .018, .018, .018, '#8a8a90');
      const gl = mk(GEO.sphL, basic('#ffd27a', { op: .25, add: 1, unique: 1 }), .7, .4, .5, 0, .8, 0, g, false); gl.userData.ownMat = true; R3.anim.push(() => { gl.material.opacity = .15 + .1 * Math.sin(G.t * 2); });
      barrel(F, -1.25, -.25, .85); crate(F, 1.2, -.2, .7, .3); crate(F, 1.25, -.15, .45, -.2, .35);
    } else if (n.kind === 'board') {
      const wd = '#5a3a20';
      for (const s of [-1, 1]) { put(K.c, F, s * .85, 1.0, 0, .07, 2.0, .07, wd); put(K.b, F, s * .85, .05, 0, .2, .1, .2, '#6a6258'); }
      put(K.b, F, 0, 1.22, 0, 1.64, 1.04, .06, '#9a7448');
      for (const [y, h] of [[1.76, .07], [.68, .07]]) put(K.b, F, 0, y, .02, 1.74, h, .08, wd);
      for (const s of [-1, 1]) put(K.b, F, s * .82, 1.22, .02, .07, 1.12, .08, wd);
      for (const s of [-1, 1]) { put(K.b, F, 0, 2.02, s * .2, 1.98, .05, .48, '#6a3a2a', 0, s * .62); for (let i = 0; i < 3; i++) put(K.b, F, 0, 1.95 + i * .08, s * (.33 - i * .11), 2.0, .03, .14, sh('#6a3a2a', i % 2 ? .85 : 1.1), 0, s * .7); }
      put(K.b, F, 0, 2.17, 0, 2.02, .06, .08, '#4a2a1a');
      const PAP = ['#f0e4c0', '#e8dcb0', '#f4ecd8', '#e0d0a0', '#f8f0e0'];
      for (const [x, y, w, h] of [[-.55, 1.42, .3, .38], [-.18, 1.5, .26, .3], [.15, 1.38, .32, .42], [.52, 1.5, .28, .32], [-.45, .98, .32, .3], [-.05, 1.02, .24, .34], [.36, .98, .34, .28]]) {
        const rz = J(-.12, .12); put(K.b, F, x, y, .045, w, h, .01, pk(PAP), 0, 0, rz);
        for (let l = 0; l < 3; l++) put(K.b, F, x, y + h * .25 - l * h * .18, .052, w * .7, .015, .004, '#6a5a48', 0, 0, rz);
        put(K.sph, F, x, y + h / 2 - .03, .056, .022, .022, .012, rr() < .5 ? '#b02a2a' : '#c8a040');
      }
      put(K.b, F, -.18, 1.55, .053, .12, .1, .004, '#5a4a3a');
      put(K.m, F, .98, 1.78, .05, .2, .03, .03, '#2a2a30'); put(K.gl, F, 1.06, 1.62, .05, .1, .14, .1); put(K.mp, F, 1.06, 1.73, .05, .14, .08, .14, '#2a2a30');
      crate(F, -1.25, .1, .6, .2); barrel(F, 1.3, -.1, .8);
    } else {
      const ac = { shop: '#c84a3a', smith: '#5a5a6a', sage: '#4a5ab0', jewel: '#2a8a8a', curio: '#8a3a8a' }[n.kind] || n.roof || '#6a5a3a';
      stall(F, ac, n.kind === 'smith');
      if (n.kind === 'smith') {
        const st = '#6a625a', ir = '#2e2e34';
        put(K.b, F, -.55, .32, .42, .78, .64, .66, st); for (let q = 0; q < 4; q++) put(K.b, F, -.55 + (q % 2 ? .2 : -.2), .15 + Math.floor(q / 2) * .3, .757, .34, .12, .02, sh(st, .82));
        put(K.b, F, -.55, .655, .42, .84, .05, .72, sh(st, 1.1));
        const forge = mk(GEO.box, mat('#ff6020', { em: 2.5 }), .56, .12, .44, -.6, .7, .45, g, false); R3.flames.push(forge);
        for (let i = 0; i < 7; i++) put(K.ember, F, -.55 + J(-.22, .22), .72, .42 + J(-.17, .17), .06, .04, .06, null, J(0, 6));
        R3.torches.push({ x: nx - .6, y: 1.2, z: nz + .6, col: '#ff6020' });
        put(K.mp, F, -.55, 1.2, .42, .8, .4, .7, ir); put(K.b, F, -.55, 1.85, .38, .24, 1.1, .24, sh(st, .9)); put(K.b, F, -.55, 2.44, .38, .3, .06, .3, sh(st, .7));
        smoke.push(new T3.Vector3(nx - .55, 2.6, nz + .38));
        put(K.c, F, .55, .19, .58, .17, .38, .17, '#6a4428');
        put(K.m, F, .55, .43, .58, .2, .1, .14, ir); put(K.m, F, .55, .51, .58, .12, .08, .1, ir); put(K.m, F, .55, .6, .58, .38, .1, .17, '#3a3a42');
        put(K.mc, F, .81, .6, .58, .05, .16, .05, '#3a3a42', 0, 0, Math.PI / 2); put(K.m, F, .48, .67, .6, .14, .05, .06, '#5a5a62'); put(K.c, F, .6, .67, .6, .015, .2, .015, '#6a4428', 0, 0, Math.PI / 2 - .3);
        put(K.b, F, -1.2, .32, .35, .22, .14, .5, '#6a4428', 0, .35); put(K.b, F, -1.2, .4, .35, .23, .08, .52, '#4a3020', 0, .1); put(K.mc, F, -1.2, .3, .65, .025, .2, .025, ir, 0, Math.PI / 2);
        barrel(F, 1.22, .25, .75, '#6a4a30'); put(K.cy, F, 1.22, .575, .25, .2, .01, .2, '#2a3a4a');
        put(K.b, F, 0, 1.25, -.78, 1.6, .06, .06, '#4a3020'); put(K.b, F, 0, .45, -.78, 1.6, .06, .06, '#4a3020');
        for (let i = 0; i < 4; i++) { const x = -.55 + i * .36; put(K.m, F, x, .95, -.74, .05, .82, .015, '#c8c8d4', 0, 0, J(-.06, .06)); put(K.m, F, x, 1.38, -.74, .16, .03, .03, '#8a7040'); put(K.mc, F, x, 1.48, -.74, .02, .14, .02, '#5a3a22'); }
        for (let i = 0; i < 6; i++) put(K.c, null, nx + 1.35, .1 + Math.floor(i / 3) * .17, nz - .55 + (i % 3) * .19 + Math.floor(i / 3) * .09, .08, .55, .08, '#8a6038', 0, 0, Math.PI / 2);
        fig(g, n, { body: '#7a4030', hatType: 'hair', hair: '#2a2a2a' }, 0, -.15);
      } else {
        counter(F, ac, n.kind === 'jewel' ? '#5a1a2a' : n.kind === 'sage' ? '#2a2a4a' : '#8a6038');
        const goods = { shop: [['#c8a060', '#8a5a3a', '#a04030', '#4a7a3a', '#d8c090'], 'box'], sage: [['#4a5ab0', '#8a3a6a', '#3a7a5a', '#a07a3a', '#6a3a2a'], 'book'], jewel: [['#a0d8e0', '#e0a0c0', '#c0e0a0'], 'jar'], curio: [['#8a3a8a', '#d8a040', '#4a8a9a', '#c05a3a'], 'jar'] }[n.kind] || [['#a08060', '#7a6040', '#c0a070', sh(ac, 1.2)], 'jar'];
        shelves(F, goods[0], goods[1]);
        if (n.kind === 'shop') {
          for (let i = 0; i < 5; i++) put(K.sph, F, -.75 + J(-.05, .05) + (i % 3) * .1, .78, .42 + Math.floor(i / 3) * .12, .05, .05, .05, pk(['#c83a2a', '#e0b030', '#7aaa3a']));
          put(K.b, F, -.4, .79, .5, .22, .12, .16, '#d8c090'); put(K.cy, F, .05, .79, .48, .1, .14, .1, '#a07040');
          for (let i = 0; i < 3; i++) { put(K.cy, F, .35 + i * .14, .8, .52, .045, .16, .045, pk(['#5a8a3a', '#8a3a3a', '#3a5a8a'])); put(K.cy, F, .35 + i * .14, .9, .52, .02, .04, .02, '#6a4a2a'); }
          put(K.c, F, .72, .77, .45, .05, .3, .05, '#7a3a5a', 0, 0, Math.PI / 2); put(K.c, F, .72, .83, .55, .05, .3, .05, '#3a6a7a', 0, 0, Math.PI / 2);
          crate(F, -1.3, .3, .65, .2); crate(F, -1.32, .3, .42, -.3, .33); sack(F, 1.3, .45); sack(F, 1.45, .1, .85, '#b8a070'); barrel(F, 1.3, -.35, .8);
          for (let i = 0; i < 3; i++) put(K.m, F, 1.3 + (i - 1) * .06, .9, -.35, .03, .55, .03, '#b8b8c4', 0, (i - 1) * .2, (i - 1) * .2);
          put(K.cy, F, -1.2, .45, -.45, .24, .03, .24, '#8a5a2a', 0, Math.PI / 2 - .25); put(K.cy, F, -1.2, .45, -.43, .1, .035, .1, '#c8a040', 0, Math.PI / 2 - .25);
          fig(g, n, { body: '#c89040', hatType: 'hair', hair: '#8a3a1a' }, 0, -.15);
        } else if (n.kind === 'jewel') {
          for (let i = 0; i < 5; i++) mk(GEO.oct, mat(['#ff4a5a', '#4a8aff', '#4ae07a', '#ffd54a', '#b06aff'][i], { em: 1.5, flat: true }), .08, .12, .08, -.6 + i * .3, .84, .5, g, false);
          for (let i = 0; i < 5; i++) put(K.b, F, -.6 + i * .3, .735, .5, .16, .03, .16, '#d8c8a0');
          const gc = mk(GEO.box, mat('#cfe8ff', { op: .18, rough: .05, metal: .1 }), 1.6, .28, .32, 0, .87, .5, g, false); gc.renderOrder = 2;
          for (const s of [-1, 1]) put(K.m, F, s * .8, .87, .5, .02, .28, .32, '#c8a040');
          put(K.m, F, 1.25, .45, .3, .05, .9, .05, '#c8a040'); put(K.m, F, 1.25, .9, .3, .4, .02, .02, '#c8a040'); for (const s of [-1, 1]) put(K.cy, F, 1.25 + s * .19, .78, .3, .08, .015, .08, '#d8b040');
          fig(g, n, { body: '#2a7a7a', hatType: 'hair', hair: '#e0e0e0' }, 0, -.15);
        } else if (n.kind === 'curio') {
          mk(GEO.box, mat('#ff9a3a', { em: .8 }), .5, .25, .3, -.4, .845, .5, g, false); mk(GEO.sph, mat('#ffd54a', { em: 1 }), .1, .1, .1, .4, .85, .5, g, false);
          put(K.cy, F, .4, .74, .5, .08, .04, .08, '#c8a040');
          for (let i = 0; i < 5; i++) { const x = -.8 + i * .4; put(K.c, F, x, 1.72, .7, .006, .28, .006, '#3a2a1a'); put(K.sph, F, x, 1.56, .7, .05, .06, .05, pk(['#8a3a8a', '#d8a040', '#4a9a9a', '#c05a3a', '#e0e0e0'])); }
          put(K.b, F, 1.25, .3, .2, .5, .6, .4, '#5a3a5a'); put(K.lid, F, 1.25, .6, .2, .51, .12, .2, '#6a4a6a'); put(K.m, F, 1.25, .4, .41, .08, .1, .02, '#c8a040');
          put(K.b, F, -1.25, .55, -.3, .3, .35, .03, '#d8c8b0', .3); put(K.b, F, -1.25, .55, -.28, .2, .04, .01, '#2a1a2a', .3);
          fig(g, n, { body: '#8a3a8a', hatType: 'helm' }, 0, -.15);
        } else if (n.kind === 'sage') {
          for (let i = 0; i < 3; i++) put(K.b, F, -.5 + i * .25, .84, .5, .18, .25, .3, ['#4a5ab0', '#8a3a6a', '#3a7a5a'][i]);
          put(K.b, F, -.15, .735, .45, .3, .03, .22, '#f0e4c0', .2); put(K.b, F, -.15, .75, .45, .02, .01, .2, '#8a6a4a', .2);
          put(K.cy, F, .5, .74, .5, .1, .04, .1, '#c8a040');
          mk(GEO.sph, mat('#a0c0ff', { em: 2 }), .12, .12, .12, .5, .87, .5, g, false);
          for (const x of [-.85, .82]) { put(K.cy, F, x, .79, .55, .03, .14, .03, '#f0e8d0'); R3.flames.push(mk(GEO.sphL, mat('#ffd080', { em: 3 }), .02, .04, .02, nx + x, .89, nz + .55, Lv, false)); }
          put(K.c, F, 1.25, .45, .2, .2, .9, .2, '#4a3a5a'); put(K.sph, F, 1.25, 1.0, .2, .2, .2, .2, '#3a4a8a');
          for (let i = 0; i < 6; i++) put(K.sph, F, 1.25 + Math.cos(i) * .19, 1.0 + Math.sin(i * 1.7) * .12, .2 + Math.sin(i) * .19, .025, .025, .025, '#ffe8a0');
          fig(g, n, { body: '#5a6ad0', hatType: 'wizard', hat: '#3a4ab0' }, 0, -.15);
        } else {
          // stalls added later (6y_stalls.js puts the keeper and table prop): themed side props only
          const k = n.kind;
          if (k === 'alch') { put(K.mc, F, 1.3, .2, .3, .04, .4, .04, '#2a2a30'); put(K.bowl, F, 1.3, .12, .3, .32, .5, .32, '#2e2e34'); const cm = mk(GEO.circ, mat('#4aff7a', { em: 1.6 }), .3, 1, .3, nx + 1.3, .36, nz + .3, Lv, false); R3.anim.push(() => { if (Math.random() < .08 && G.parts.length < 1000) G.parts.push({ x: (nx + 1.3 + rnd(-.2, .2)) * TILE, y: (nz + .3 + rnd(-.2, .2)) * TILE, z: .4, vx: 0, vy: 0, vz: .5, g: 0, life: .8, max: .8, col: '#7aff9a', size: 2.5 }); }); for (let q = 0; q < 3; q++) put(K.c, F, 1.3 + Math.cos(q * 2.1) * .2, .05, .3 + Math.sin(q * 2.1) * .2, .05, .12, .05, '#4a3020', 0, 0, Math.PI / 2); barrel(F, -1.3, .1, .7, '#5a6a3a'); }
          else if (k === 'ench') { for (let i = 0; i < 4; i++) mk(GEO.oct, mat('#b080ff', { em: 1.4, flat: true }), .06 + i * .015, .16 + i * .05, .06 + i * .015, 1.2 + Math.cos(i * 1.6) * .15, .1 + i * .02, .3 + Math.sin(i * 1.6) * .15, g, false).rotation.z = (i - 1.5) * .25; put(K.b, F, -1.25, .25, .1, .4, .5, .4, '#4a3a5a'); for (let i = 0; i < 3; i++) put(K.b, F, -1.25, .53 + i * .06, .1, .3 - i * .04, .05, .22, ['#6a3a8a', '#3a5a8a', '#8a3a4a'][i], i * .3); }
          else if (k === 'tamer') { hay(F, 1.35, .2, .3); hay(F, 1.4, .3, -.2); put(K.b, F, -1.3, .18, .25, .4, .14, .8, '#7a5432'); put(K.b, F, -1.3, .25, .25, .32, .02, .7, '#c8b070'); put(K.sph, F, -1.2, .05, .9, .1, .03, .04, '#e8e0d0'); }
          else if (k === 'carto') { barrel(F, 1.3, .2, .75); for (let i = 0; i < 4; i++) put(K.c, F, 1.3 + Math.cos(i * 1.6) * .1, .8, .2 + Math.sin(i * 1.6) * .1, .04, .45, .04, pk(['#e8d8b0', '#d8c8a0', '#c8b890']), 0, Math.sin(i) * .2, Math.cos(i) * .2); put(K.c, F, -1.25, .3, .2, .04, .6, .04, '#6a4428'); put(K.sph, F, -1.25, .74, .2, .17, .17, .17, '#3a7ab0'); put(K.sph, F, -1.23, .78, .27, .1, .08, .1, '#5a9a4a'); put(K.mt, F, -1.25, .74, .2, .19, .19, .19, '#c8a040'); }
          else if (k === 'arena') { put(K.c, F, 1.35, .7, .3, .05, 1.4, .05, '#6a4428'); put(K.c, F, 1.35, 1.05, .3, .04, .7, .04, '#6a4428', 0, 0, Math.PI / 2); put(K.sph, F, 1.35, 1.25, .3, .14, .16, .14, '#c8b088'); put(K.b, F, 1.35, .8, .3, .32, .45, .2, '#a08a60'); put(K.cy, F, -1.3, .45, .1, .3, .04, .3, '#8a3a2a', 0, Math.PI / 2 - .2); put(K.cy, F, -1.3, .45, .125, .12, .045, .12, '#c8a040', 0, Math.PI / 2 - .2); }
          else if (k === 'bank') { put(K.b, F, 1.3, .28, .2, .6, .5, .45, '#4a4a52'); for (const x of [-.2, .2]) put(K.m, F, 1.3 + x, .28, .2, .05, .52, .47, '#c8a040'); put(K.m, F, 1.3, .32, .43, .12, .14, .02, '#d8b040'); for (let i = 0; i < 3; i++) sack(F, -1.2 + i * .18, .3 + (i % 2) * .15, .7, '#b89a50'); }
          else if (k === 'oracle') { for (const s of [-1, 1]) { put(K.mc, F, s * 1.3, .35, .4, .03, .7, .03, '#3a3a42'); put(K.bowl, F, s * 1.3, .7, .4, .16, .14, .16, '#3a3a42'); R3.flames.push(mk(GEO.sphL, mat('#b090ff', { em: 3 }), .08, .14, .08, nx + s * 1.3, .86, nz + .4, Lv, false)); } }
          else { barrel(F, 1.3, .2, .75); crate(F, -1.3, .2, .6); }
        }
      }
    }
  }
  // ---------- chimney smoke (one instanced mesh, animated) ----------
  if (smoke.length) {
    const P3 = 3, im = new T3.InstancedMesh(GEO.sphL, mat('#9a948e', { op: .3, rough: 1 }), smoke.length * P3); im.frustumCulled = false; Lv.add(im); TWN.ims.push(im);
    const m4 = new T3.Matrix4(), q0 = new T3.Quaternion(), v = new T3.Vector3(), s3 = new T3.Vector3();
    R3.anim.push(() => {
      for (let c = 0; c < smoke.length; c++) for (let j = 0; j < P3; j++) {
        const p = smoke[c], ph = (G.t * .22 + j / P3 + c * .37) % 1, k = ph < .8 ? 1 : (1 - ph) / .2, r = (.1 + ph * .32) * k;
        m4.compose(v.set(p.x + ph * .5 + Math.sin(G.t + c + j) * .05, p.y + ph * 1.5, p.z - ph * .25), q0, s3.set(r, r * .85, r)); im.setMatrixAt(c * P3 + j, m4);
      }
      im.instanceMatrix.needsUpdate = true;
    });
  }
  flush(Lv);
}

// ---------- hook into the wrapper chain ----------
// The base buildTown() in 5_render3d.js hands off to havenBuild() when it exists, so every wrapper
// (Haven flags, trophies, unlock filter, stall positions, extra stalls) still runs around the new town.
function havenBuild() {
  for (const im of TWN.ims) { try { im.dispose(); } catch (e) {} } TWN.ims = [];
  buildTownV3();
}
