// ================= ANIMATION SYSTEM: articulated rig + procedural animations =================
// ---------- rig: hips > legs > knees, waist > chest > head & arms > hands ----------
makeHumanoid = function (o) {
  // shared sculpting kit (built once): parametric surfaces, merged vertex-coloured geometry, body profiles reused by the armour shells
  const L = window.HUM3 || (window.HUM3 = (() => {
    const C = new T3.Color(), PI2 = Math.PI * 2;
    const sm = t => t * t * (3 - 2 * t), cl = (x, a, b) => Math.max(a, Math.min(b, x)), lr = (a, b, k) => a + (b - a) * k;
    const crv = ks => x => { if (x <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (x <= ks[i][0]) { const a = ks[i - 1], b = ks[i]; return a[1] + (b[1] - a[1]) * sm((x - a[0]) / (b[0] - a[0])); } return ks[ks.length - 1][1]; };
    // indexed grid surface f(u,v,out); closed wraps u without a seam; normals are flipped outward when needed
    function grid(nu, nv, f, closed) {
      const cols = closed ? nu : nu + 1, n = cols * (nv + 1), P = new Float32Array(n * 3), I = [], q = [0, 0, 0];
      let k = 0; for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) { f(i / nu, j / nv, q); P[k++] = q[0]; P[k++] = q[1]; P[k++] = q[2]; }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * cols + i, b = j * cols + (closed ? (i + 1) % nu : i + 1), c = a + cols, d = b + cols; I.push(a, b, c, b, d, c); }
      const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      const N = g.attributes.normal.array; let cx = 0, cy = 0, cz = 0; for (let i = 0; i < n; i++) { cx += P[i * 3]; cy += P[i * 3 + 1]; cz += P[i * 3 + 2]; } cx /= n; cy /= n; cz /= n;
      let s = 0; for (let i = 0; i < n; i++) s += (P[i * 3] - cx) * N[i * 3] + (P[i * 3 + 1] - cy) * N[i * 3 + 1] + (P[i * 3 + 2] - cz) * N[i * 3 + 2];
      if (s < 0) { for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } g.setIndex(I); g.computeVertexNormals(); }
      return g;
    }
    // ellipsoid (or a patch of one): th from the top, ph around Y with ph=0 facing +X (the front)
    function ell(rx, ry, rz, p = {}) {
      const th0 = p.th0 || 0, th1 = p.th1 ?? Math.PI, ph0 = p.ph0 || 0, ph1 = p.ph1 ?? PI2, closed = ph1 - ph0 > PI2 - 1e-4;
      return grid(p.nu || 18, p.nv || 12, (u, v, q) => { const th = th0 + v * (th1 - th0), ph = ph0 + u * (ph1 - ph0), s = Math.sin(th);
        q[0] = rx * s * Math.cos(ph); q[1] = ry * Math.cos(th); q[2] = rz * s * Math.sin(ph); if (p.d) p.d(q, th, ph); }, closed);
    }
    // tube along Y from y0 to y1, radius rf(t, ph), depth scale dx; optional angular range for curved plates
    function tube(y0, y1, rf, p = {}) {
      const ph0 = p.ph0 || 0, ph1 = p.ph1 ?? PI2, closed = ph1 - ph0 > PI2 - 1e-4, dx = p.dx || 1, R = typeof rf === 'number' ? () => rf : rf;
      return grid(p.nu || 14, p.nv || 4, (u, v, q) => { const ph = ph0 + u * (ph1 - ph0), r = R(v, ph); q[0] = (p.x || 0) + Math.cos(ph) * r * dx; q[1] = lr(y0, y1, v); q[2] = Math.sin(ph) * r; if (p.d) p.d(q, v, ph); }, closed);
    }
    // rounded box with true rounded normals
    function rbox(w, h, d, r, seg = 3) {
      const g = new T3.BoxGeometry(w, h, d, seg, seg, seg), P = g.attributes.position, N = g.attributes.normal, ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), qx = cl(x, -ix, ix), qy = cl(y, -iy, iy), qz = cl(z, -iz, iz);
        let nx = x - qx, ny = y - qy, nz = z - qz; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; P.setXYZ(i, qx + nx * r, qy + ny * r, qz + nz * r); N.setXYZ(i, nx, ny, nz); }
      return g;
    }
    const _m = new T3.Matrix4(), _q = new T3.Quaternion(), _e = new T3.Euler(), _p = new T3.Vector3(), _s = new T3.Vector3();
    function xf(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sy) { return g.clone().applyMatrix4(_m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz))); }
    // tapered curved horn/plume/tip from 5_models bentG, pointed along dir and curling toward bend
    const _o = new T3.Object3D();
    function bt(b, rt, rb, s, x, y, z, dir, bend) { _o.position.set(x, y, z); _o.scale.setScalar(s); orient(_o, dir, bend); _o.updateMatrix(); return bentG(b, rt, rb).clone().applyMatrix4(_o.matrix); }
    // merge [geometry, hex, shade(x,y,z)?] parts into one vertex-coloured geometry
    function merge(parts) {
      let nv = 0, ni = 0; for (const [g] of parts) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
      const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), Cc = new Float32Array(nv * 3), I = nv > 65000 ? new Uint32Array(ni) : new Uint16Array(ni);
      let vo = 0, io = 0;
      for (const [g, hx, sh] of parts) { const p = g.attributes.position, n = g.attributes.normal; C.set(hx);
        for (let i = 0; i < p.count; i++) { const k = (vo + i) * 3, x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = sh ? sh(x, y, z) : 1;
          P[k] = x; P[k + 1] = y; P[k + 2] = z; N[k] = n.getX(i); N[k + 1] = n.getY(i); N[k + 2] = n.getZ(i); Cc[k] = C.r * f; Cc[k + 1] = C.g * f; Cc[k + 2] = C.b * f; }
        if (g.index) for (let i = 0; i < g.index.count; i++) I[io++] = g.index.getX(i) + vo; else for (let i = 0; i < p.count; i++) I[io++] = vo + i;
        vo += p.count; }
      const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(P, 3)); g.setAttribute('normal', new T3.BufferAttribute(N, 3)); g.setAttribute('color', new T3.BufferAttribute(Cc, 3)); g.setIndex(new T3.BufferAttribute(I, 1)); g.computeBoundingSphere(); return g;
    }
    // body profiles (chest-local Y): half width (Z) and half depth (X) of the torso
    const TW = crv([[-.07, .162], [.03, .146], [.12, .154], [.22, .174], [.3, .184], [.36, .178], [.41, .15], [.46, .09], [.5, .058]]);
    const TD = crv([[-.07, .118], [.03, .106], [.12, .11], [.22, .128], [.3, .136], [.36, .126], [.41, .104], [.46, .07], [.5, .05]]);
    function torsoP(ph, y, off, q) { const c = Math.cos(ph), s = Math.sin(ph), f = Math.max(0, c);
      const pec = .017 * f * f * Math.exp(-(((y - .29) / .065) ** 2)) * (1 - .55 * Math.exp(-((s / .2) ** 2)));
      const blade = .01 * Math.max(0, -c) * Math.exp(-(((y - .3) / .07) ** 2)) * Math.min(1, Math.abs(s) * 3);
      q[0] = c * (TD(y) + pec + blade + off); q[1] = y; q[2] = s * (TW(y) + off * .55); return q; }
    // patch of the torso surface (offset shell); off may be a function (ph, y)
    function tor(ph0, ph1, y0, y1, off, nu = 24, nv = 6) { const F = typeof off === 'number' ? () => off : off, closed = ph1 - ph0 > PI2 - 1e-4;
      return grid(nu, nv, (u, v, q) => { const ph = ph0 + u * (ph1 - ph0), y = lr(y0, y1, v); torsoP(ph, y, F(ph, y), q); }, closed); }
    // strap across the torso surface from (ph0,y0) to (ph1,y1)
    function strap(ph0, y0, ph1, y1, w, off, n = 12) { return grid(n, 1, (u, v, q) => torsoP(lr(ph0, ph1, u), lr(y0, y1, u) + (v - .5) * w, off, q), false); }
    // limb profiles: thigh (hip pivot, y .05 -> -.25), shin (knee pivot, y .03 -> -.17), upper arm and forearm (shoulder pivot)
    const thighR = crv([[0, .086], [.3, .089], [.75, .07], [1, .06]]), shinR = crv([[0, .068], [.35, .067], [1, .053]]);
    const uArmR = crv([[0, .066], [1, .057]]), fArmR = crv([[0, .054], [.3, .057], [.8, .049], [1, .05]]);
    const vc = { vertexColors: true, roughness: .72, metalness: .04 };
    const cloth = new T3.MeshStandardMaterial(vc), clothDS = new T3.MeshStandardMaterial({ ...vc, side: T3.DoubleSide });
    const metal = new T3.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: .6, side: T3.DoubleSide });
    const metalW = new T3.MeshStandardMaterial({ vertexColors: true, roughness: .48, metalness: .5, side: T3.DoubleSide });
    // one cached merged mesh per (part key, material)
    function put(parent, key, m, parts, shadow = true) { const me = new T3.Mesh(gx('h3|' + key, () => merge(parts())), m); me.castShadow = shadow; me.receiveShadow = shadow; parent.add(me); return me; }
    return { sm, cl, lr, crv, grid, ell, tube, rbox, xf, bt, merge, put, TW, TD, torsoP, tor, strap, thighR, shinR, uArmR, fArmR, cloth, clothDS, metal, metalW, PI2 };
  })());
  const { ell, tube, rbox, xf, bt, put, crv, tor, strap, torsoP, TD, thighR, shinR, uArmR, fArmR, PI2 } = L;
  const PI = Math.PI;
  const g = new T3.Group(), root = new T3.Group(); g.add(root);
  const cls = { helm: 'war', hood: 'rng', wizard: 'mag' }[o.hatType] || 'civ';
  const B = o.body, DK = shade3(B, .5), TR = shade3(B, 1.35), SK = o.skin || '#f0c8a0', BT = '#3a2a1e', LE = '#5a3a22', LD = '#3e2818', GD = '#d8b040', ST = '#c4c8d4';
  const HR = o.hair || '#4a3020', HC = o.hat || shade3(B, .8), EY = '#1a1414', CP = o.cape;
  const KB = '|' + [cls, B, SK, HR, HC, CP || '', o.hatType || ''].join('|');
  const body = L.cloth.clone(), metalM = L.metal, Q = [0, 0, 0];
  const grad = (y0, y1, a = .78) => (x, y) => a + (1 - a) * L.cl((y - y0) / (y1 - y0), 0, 1);
  // ---- hips, legs with knee joints and shaped boots ----
  const hips = new T3.Group(); hips.position.y = .46; root.add(hips);
  const leg = z => { const Lg = new T3.Group(); Lg.position.set(0, 0, z); hips.add(Lg);
    put(Lg, 'thigh' + KB, body, () => [[tube(.05, -.25, thighR, { nu: 12, nv: 6, dx: .95 }), DK, grad(-.25, .05, .82)]]);
    const K = new T3.Group(); K.position.y = -.23; Lg.add(K);
    put(K, 'shin' + KB, body, () => { const foot = rbox(.19, .075, .096, .033), fp = foot.attributes.position;
      for (let i = 0; i < fp.count; i++) { const x = fp.getX(i); if (x > .02) { const k = 1 - (x - .02) * 1.6; fp.setZ(i, fp.getZ(i) * k); if (fp.getY(i) > 0) fp.setY(i, fp.getY(i) * (1 - (x - .02) * 3)); } }
      return [[ell(.05, .05, .056, { nu: 10, nv: 6 }), DK], [xf(foot, .034, -.197, 0), BT], [rbox(.2, .022, .1, .01, 2), '#22160c', null], [tube(.03, -.17, shinR, { nu: 12, nv: 4 }), BT, grad(-.17, .03, .8)],
        [tube(.04, -.012, crv([[0, .079], [1, .074]]), { nu: 12, nv: 2 }), LE]].map((p, i) => i === 2 ? [xf(p[0], .034, -.228, 0), p[1]] : p); });
    return { L: Lg, K }; };
  const LL = leg(.1), LR = leg(-.1);
  put(hips, 'hips' + KB, body, () => { const fold = k => (t, ph) => 1 + k * t * Math.sin(ph * 9);
    const p = [[tube(.08, -.11, crv([[0, .158], [.5, .168], [1, .14]]), { nu: 18, nv: 3, dx: .74 }), DK]];
    if (cls === 'mag') { const f = (t, ph) => (.168 + .11 * t) * (1 + .045 * t * Math.sin(ph * 7)); p.push([tube(.055, -.43, f, { nu: 28, nv: 8, dx: .8 }), B, grad(-.43, .05, .7)], [tube(-.405, -.44, (t, ph) => f(.95, ph) + .006, { nu: 28, nv: 1, dx: .8 }), TR]); }
    else { const f = (t, ph) => (.168 + .05 * t) * fold(.035)(t, ph); p.push([tube(.055, -.13, f, { nu: 27, nv: 4, dx: .77 }), cls === 'war' ? shade3(B, .8) : B, grad(-.13, .05, .72)], [tube(-.11, -.14, (t, ph) => f(1, ph) + .005, { nu: 27, nv: 1, dx: .77 }), TR]); }
    return p; });
  // ---- chest / torso ----
  const chest = new T3.Group(); chest.position.y = .5; root.add(chest);
  const torso = put(chest, 'chest' + KB, body, () => {
    const p = [[tor(0, PI2, -.07, .5, 0, 26, 14), B, grad(-.07, .5, .74)], [tor(0, PI2, -.025, .05, .013, 26, 2), cls === 'mag' ? TR : LE],
      [new T3.CylinderGeometry(.056, .062, .18, 10, 1, true).translate(0, .47, 0), SK]];
    const pouch = torsoP(.8, -.035, .035, [0, 0, 0]); p.push([xf(rbox(.06, .075, .07, .022), pouch[0], pouch[1], pouch[2], 0, -.8, 0), LE]);
    if (cls === 'mag') { p.push([tor(-.2, .2, -.07, .44, .006, 4, 10), TR], [tube(.42, .54, crv([[0, .1], [1, .128]]), { nu: 16, nv: 2, ph0: .5, ph1: PI2 - .5 }), TR]); }
    else if (cls === 'rng') { p.push([tor(0, PI2, .02, .43, .008, 26, 8), shade3(LE, 1.15), grad(.02, .43, .8)], [strap(1.2, .44, -1.35, .02, .045, .016), LD], [strap(1.2, .44, PI2 - 1.35, .02, .045, .016), LD]);
      p.push([tube(.5, .3, (t, ph) => (.09 + .19 * t) * (1 + .05 * t * Math.sin(ph * 6)), { nu: 24, nv: 4, dx: .92 }), HC, grad(.3, .5, .8)]);
      const qv = [[new T3.CylinderGeometry(.055, .048, .34, 10), LE], [new T3.TorusGeometry(.055, .01, 5, 12).rotateX(PI / 2).translate(0, .17, 0), LD]];
      for (const z of [-.025, .002, .028]) qv.push([new T3.ConeGeometry(.02, .07, 4).translate(0, .21, z), '#f0ece0']);
      for (const [q, c] of qv) p.push([xf(q, -.18, .27, .07, -.45, 0, 0), c]); }
    else { p.push([new T3.TorusGeometry(.085, .022, 6, 18).rotateX(PI / 2).translate(0, .455, 0), TR]);
      p.push([tor(-.32, .32, -.02, .42, .007, 6, 10), cls === 'war' ? TR : shade3(B, .85), grad(-.02, .42, .8)]); if (cls === 'civ') p.push([strap(-.09, .43, -.09, .3, .025, .014, 3), '#e8dcc0'], [strap(.09, .43, .09, .3, .025, .014, 3), '#e8dcc0']); }
    return p; });
  put(chest, 'chestM' + KB, metalM, () => { const bk = torsoP(0, .012, .016, [0, 0, 0]), p = [[rbox(.016, .05, .066, .008, 2).translate(bk[0], bk[1], 0), GD]];
    if (CP) for (const s of [-1, 1]) { const c = torsoP(s * 1.1, .43, .014, [0, 0, 0]); p.push([new T3.SphereGeometry(.026, 8, 6).translate(c[0], c[1], c[2]), GD]); }
    if (cls === 'war') p.push([tube(.39, .48, crv([[0, .105], [1, .076]]), { nu: 16, nv: 2, dx: .95 }), ST], [new T3.TorusGeometry(.077, .01, 5, 16).rotateX(PI / 2).translate(0, .48, 0), GD]);
    if (cls === 'mag') for (const s of [-.2, .2]) p.push([tor(s - .02, s + .02, -.06, .44, .01, 1, 10), GD]);
    return p; });
  // ---- head: sculpted skull with jaw and chin, ears, brows, eyes, nose, mouth ----
  const head = new T3.Group(); head.position.y = .62; chest.add(head);
  const hsh = [...HR].reduce((a, c) => a + c.charCodeAt(0), 0) % 3;
  const face = put(head, 'face' + KB + hsh, body, () => {
    const jaw = q => { const y = q[1]; if (y < 0) { const s = Math.min(1, -y / .165); q[2] *= 1 - .3 * s * s; q[0] *= q[0] < 0 ? 1 - .4 * s * s : 1 - .05 * s * s; } else if (q[0] < 0) q[0] *= 1 + .06 * y / .165; };
    const p = [[ell(.148, .165, .138, { nu: 22, nv: 16, d: jaw }), SK]];
    for (const s of [-1, 1]) {
      p.push([xf(ell(.022, .04, .013, { nu: 8, nv: 6 }), -.008, -.008, s * .135, 0, s * .3, 0), SK]);
      p.push([xf(ell(.011, .028, .021, { nu: 8, nv: 6 }), .127, .022, s * .052, 0, s * -.4, 0), '#f4f0ea'], [xf(ell(.01, .022, .014, { nu: 8, nv: 6 }), .134, .02, s * .05, 0, s * -.4, 0), EY]);
      p.push([xf(rbox(.016, .016, .05, .007, 2), .14, .07, s * .05, s * -.3, s * -.4, 0), cls === 'mag' ? '#e8e8e8' : HR]);
    }
    p.push([xf(ell(.03, .036, .022, { nu: 8, nv: 6, d: q => { if (q[1] < 0) q[0] *= 1.2; } }), .132, -.024, 0, 0, 0, -.25), shade3(SK, .93)], [xf(rbox(.01, .012, .046, .005, 2), .124, -.084, 0), '#8a4a3a']);
    if (cls === 'mag') { p.push([ell(.08, .15, .105, { nu: 14, nv: 10, d: q => { if (q[1] < 0) { const k = 1 + q[1] / .15 * .75; q[0] *= k; q[2] *= k; } } }).translate(.075, -.165, 0), '#e8e8e8', grad(-.3, -.05, .82)]);
      for (const s of [-1, 1]) p.push([xf(ell(.022, .018, .05, { nu: 8, nv: 6 }), .14, -.058, s * .036, s * .5, 0, 0), '#f0f0f0'], [xf(ell(.05, .07, .035, { nu: 8, nv: 6 }), -.04, -.02, s * .13), '#e0e0e0']); }
    if (o.hatType === 'hair') {
      const hairD = (q, th, ph) => { const f = Math.cos(ph) * Math.sin(th), y = q[1], hl = L.lr(-.18, .085, L.sm(L.cl((f + .3) / 1.2, 0, 1))), k = L.sm(L.cl((y - hl) / .035, 0, 1));
        const vol = (.905 + .095 * k) * (1 + k * (.05 * (.5 + .5 * Math.sin(ph * 5 + th * 4)) + (Math.cos(ph) < 0 ? .05 : 0) + (y > .1 ? .04 : 0)));
        q[0] *= vol; q[1] = y * (y > 0 ? vol * 1.02 : vol); q[2] *= vol; };
      p.push([ell(.158, .18, .148, { nu: 28, nv: 18, d: hairD }).translate(-.004, .006, 0), HR, grad(-.2, .2, .7)]);
      p.push([xf(ell(.075, .035, .1, { nu: 12, nv: 6 }), .1, .135, .03, .3, 0, -.5), HR], [xf(ell(.06, .03, .07, { nu: 10, nv: 6 }), .11, .125, -.075, -.4, 0, -.6), HR]);
      if (hsh === 1) p.push([ell(.12, .15, .13, { nu: 14, nv: 10 }).translate(-.07, -.1, 0), HR, grad(-.25, .05, .7)], [bt(1.2, .1, .28, .26, -.14, -.02, 0, [-.4, -1, 0], [-1, 0, 0]), HR]);
      if (hsh === 2) for (let i = 0; i < 5; i++) { const a = (i - 2) * .55; p.push([bt(.8, .02, .4, .13, -.03 + .02 * Math.abs(i - 2), .15, Math.sin(a) * .09, [-.3 + .1 * Math.abs(i - 2), 1, Math.sin(a) * .9], [-1, 0, 0]), HR]); }
    }
    return p; });
  // ---- headwear (kept separate so a worn helm can replace it) ----
  const hat = [];
  if (o.hatType === 'helm') {
    hat.push(put(head, 'helmM' + KB, metalM, () => { const thm = ph => 1.42 + .5 * (1 - Math.cos(ph)) / 2, d = (q, th, ph) => {}; const p = [];
      p.push([L.grid(22, 7, (u, v, q) => { const ph = u * PI2, th = v * thm(ph), s = Math.sin(th); q[0] = .182 * s * Math.cos(ph); q[1] = .198 * Math.cos(th) + .012; q[2] = .172 * s * Math.sin(ph); }, true), ST, grad(-.15, .2, .72)]);
      p.push([L.grid(22, 1, (u, v, q) => { const ph = u * PI2, th = thm(ph) - .14 + v * .14, s = Math.sin(th), k = 1.05; q[0] = .182 * k * s * Math.cos(ph); q[1] = .198 * Math.cos(th) + .012; q[2] = .172 * k * s * Math.sin(ph); }, true), '#b89048']);
      p.push([new T3.TorusGeometry(.19, .013, 5, 20, PI - 1).rotateZ(.5).scale(1, 1.06, 1).translate(0, .012, 0), '#b89048'], [rbox(.018, .11, .028, .007, 2).translate(.19, -.035, 0), ST]);
      for (const s of [-1, 1]) p.push([ell(.19, .2, .182, { th0: 1.45, th1: 2.2, ph0: s > 0 ? .95 : -1.95, ph1: s > 0 ? 1.95 : -.95, nu: 6, nv: 4 }).translate(0, .012, 0), ST]);
      for (let i = 0; i < 8; i++) { const ph = i / 8 * PI2, th = thm(ph) - .07, s = Math.sin(th); p.push([new T3.SphereGeometry(.009, 5, 4).translate(.182 * 1.07 * s * Math.cos(ph), .198 * Math.cos(th) + .012, .172 * 1.07 * s * Math.sin(ph)), GD]); }
      return p; }));
    hat.push(put(head, 'helmC' + KB, L.clothDS, () => [[bt(1.4, .03, .085, .32, -.02, .19, 0, [-.25, 1, 0], [-1, 0, 0]), '#c83a2a', grad(.2, .45, .75)]], false));
  } else if (o.hatType === 'hood') {
    hat.push(put(head, 'hood' + KB, L.clothDS, () => [
      [L.grid(22, 12, (u, v, q) => { const th = v * 2.3, op = 1.02 * L.sm(L.cl((th - .5) / .6, 0, 1)), ph = op + u * (PI2 - 2 * op), s = Math.sin(th), k = 1 + .06 * Math.sin(th * 3) * Math.max(0, -Math.cos(ph)) + .03 * Math.sin(ph * 5) * v;
        q[0] = .205 * s * Math.cos(ph) * k - .015; q[1] = .215 * Math.cos(th) + .005; q[2] = .198 * s * Math.sin(ph) * k; }, false), HC, grad(-.25, .2, .7)],
      [xf(new T3.TorusGeometry(1, .11, 6, 26), .095, -.02, 0, 0, PI / 2, 0, .17, .2, .18), shade3(HC, .85)],
      [bt(1.4, 0, .11, .3, -.17, .07, 0, [-1, -.15, 0], [0, -1, 0]), HC]]));
  } else if (o.hatType === 'wizard') {
    hat.push(put(head, 'wiz' + KB, L.clothDS, () => {
      const brim = L.grid(28, 4, (u, v, q) => { const ph = u * PI2, r = .12 + .19 * v; q[0] = Math.cos(ph) * r; q[2] = Math.sin(ph) * r; q[1] = .12 - .035 * v * v + .012 * v * Math.sin(ph * 3); }, true);
      const cone = L.grid(16, 10, (u, v, q) => { const ph = u * PI2, r = .175 * Math.pow(1 - v, 1.1) + .004, bk = -.17 * v * v - .08 * Math.max(0, v - .7) / .3; q[0] = Math.cos(ph) * r + bk; q[2] = Math.sin(ph) * r; q[1] = .115 + .5 * v - .1 * Math.max(0, v - .7) / .3 * Math.max(0, v - .7) / .3; }, true);
      return [[brim, HC], [cone, HC, grad(.1, .6, .72)]]; }));
    hat.push(put(head, 'wizM' + KB, metalM, () => [[new T3.TorusGeometry(.166, .02, 5, 22).rotateX(PI / 2).translate(-.003, .15, 0), GD]]));
    const gem = mk(GEO.oct, mat('#ffe080', { em: 2 }), .04, .05, .03, .175, .15, 0, head, false); hat.push(gem);
  }
  // ---- cape: two curved panels with folds that drape around the back ----
  let cape = null;
  if (CP) {
    cape = new T3.Group(); cape.position.set(-.17, .42, 0); chest.add(cape);
    const panel = (y1, rx0, rx1, rz0, rz1, f0, f1, cx) => L.grid(16, 6, (u, v, q) => { const a = PI / 2 + .45 + u * (PI - .9), fo = 1 + L.lr(f0, f1, v) * Math.sin(a * 11);
      q[0] = cx + Math.cos(a) * L.lr(rx0, rx1, v) * fo; q[2] = Math.sin(a) * L.lr(rz0, rz1, v) * fo; q[1] = y1 * v; }, false);
    put(cape, 'capeU' + KB, L.clothDS, () => [[panel(-.37, .16, .19, .25, .29, .005, .045, .17), CP, grad(-.37, 0, .85)]]);
    const low = new T3.Group(); low.position.set(-.02, -.36, 0); cape.add(low);
    put(low, 'capeL' + KB, L.clothDS, () => { const f = (y1) => L.grid(16, 1, (u, v, q) => { const a = PI / 2 + .45 + u * (PI - .9), fo = 1 + .075 * Math.sin(a * 11), w = .97 + v * .03;
      q[0] = .19 + Math.cos(a) * .228 * fo * 1.01; q[2] = Math.sin(a) * .328 * fo * 1.01; q[1] = -.27 - .035 * v; }, false);
      return [[panel(-.3, .19, .228, .29, .328, .045, .075, .19), CP, grad(-.3, 0, .72)], [f(), shade3(CP, 1.5)]]; });
    cape.userData.low = low;
  }
  // ---- arms (weapon hand keeps the same pivot and orientation; the fist is part of the arm so swapping weapons never removes it) ----
  const arm = z => {
    const a = new T3.Group(); a.rotation.order = 'YZX'; a.position.set(0, .38, z); chest.add(a);
    put(a, 'arm' + KB, body, () => { const glove = cls === 'war' ? '#4a3426' : SK, p = [[ell(.074, .08, .074, { nu: 14, nv: 9 }).translate(0, -.03, 0), B], [tube(-.03, -.215, uArmR, { nu: 12, nv: 3 }), B, grad(-.215, -.03, .82)],
      [new T3.TorusGeometry(.058, .012, 5, 14).rotateX(PI / 2).translate(0, -.205, 0), TR], [tube(-.2, -.37, fArmR, { nu: 12, nv: 4 }), cls === 'war' || cls === 'rng' ? LE : SK],
      [rbox(.08, .088, .074, .028).translate(.004, -.366, 0), glove], [xf(ell(.021, .032, .019, { nu: 8, nv: 6 }), .043, -.347, 0, 0, 0, .4), glove]];
      if (cls === 'mag') p.push([tube(-.19, -.32, crv([[0, .062], [1, .09]]), { nu: 16, nv: 2 }), B], [new T3.TorusGeometry(.09, .011, 5, 16).rotateX(PI / 2).translate(0, -.32, 0), TR]);
      if (cls === 'rng') p.push([new T3.TorusGeometry(.057, .009, 5, 12).rotateX(PI / 2).translate(0, -.25, 0), LD], [new T3.TorusGeometry(.05, .009, 5, 12).rotateX(PI / 2).translate(0, -.32, 0), LD]);
      return p; });
    if (cls === 'war') put(a, 'armM' + KB, metalM, () => [[ell(.096, .078, .096, { th1: 1.35, nu: 14, nv: 5 }), ST], [new T3.TorusGeometry(.094, .01, 5, 16).rotateX(PI / 2).translate(0, .017, 0), GD]]);
    const h = new T3.Group(); h.position.set(0, -.38, 0); h.rotation.z = -Math.PI / 2; a.add(h); return { a, h };
  };
  const R = arm(-.232), Lf = arm(.232);   // shoulders tucked against the torso (at .27 a gap showed between body and arm)
  mk(GEO.circ, basic('#000000', { op: .32 }), .3, 1, .3, 0, .012, 0, g, false);
  return { g, root, hips, chest, head, legL: LL.L, legR: LR.L, kneeL: LL.K, kneeR: LR.K, armR: R.a, hand: R.h, armL: Lf.a, handL: Lf.h, torso, body, cape, hat, face, hatType: o.hatType };
};

// ---------- helpers ----------
const ez = x => { x = clamp(x, 0, 1); return 1 - (1 - x) * (1 - x); };
const ezIn = x => { x = clamp(x, 0, 1); return x * x; };
const lrp = (a, b, k) => a + (b - a) * k;
const _vT = new T3.Vector3();
const POSE_KEYS = ['rootY', 'pitch', 'spin', 'hipYaw', 'chestYaw', 'chestLean', 'headYaw', 'headPitch', 'legL', 'legR', 'kneeL', 'kneeR', 'aRy', 'aRz', 'aRx', 'aLy', 'aLz', 'lunge'];
function blankPose() { const o = {}; for (const k of POSE_KEYS) o[k] = 0; o.aRz = .25; o.aLz = .12; return o; }
function applyPose(h, q) {
  h.root.position.y = q.rootY; h.root.rotation.set(0, q.spin, q.pitch);
  h.hips.rotation.y = q.hipYaw; h.chest.rotation.set(0, q.chestYaw, q.chestLean);
  h.head.rotation.set(0, q.headYaw, q.headPitch);
  h.legL.rotation.z = q.legL; h.legR.rotation.z = q.legR; h.kneeL.rotation.z = q.kneeL; h.kneeR.rotation.z = q.kneeR;
  h.armR.rotation.y = q.aRy; h.armR.rotation.z = q.aRz; h.armR.position.x = q.aRx; h.armL.rotation.y = q.aLy; h.armL.rotation.z = q.aLz;
}
// walk / run cycle shared by the player, villagers and NPCs
function walkPose(q, ph, a, back = 1, side = 0) {
  const s = Math.sin(ph);
  q.legL = s * a * back; q.legR = -s * a * back;
  q.kneeL = -Math.max(0, Math.sin(ph + 1.3 * back)) * a * 1.25 - .04; q.kneeR = -Math.max(0, Math.sin(ph + Math.PI + 1.3 * back)) * a * 1.25 - .04;
  q.rootY = Math.abs(Math.sin(ph)) * .055 * a; q.chestYaw = -s * .2 * a; q.hipYaw = s * .12 * a + side * .55;
  q.chestLean = -.13 * a * back; q.aLz = .12 - s * .6 * a; q.aRz = .25 + s * .4 * a; q.headPitch = .05 * a * back;
}
// ---------- the player ----------
const AN = { ph: 0, cur: blankPose(), prevAtk: 0, atk: null, dir: 1, cast: null, prevAnim: 0, hit: 0, prevInv: 0, drink: 0, cheer: 0, surge: 0, land: 0, prevAir: 0, death: 0, spawn: 0, lvlId: -1, idle: 0, fid: 0, px: 0, py: 0, spd: 0, stepS: 0, lastLvl: 0 };
const _drinkA = drinkPotion; drinkPotion = function () { const p0 = S.pots; _drinkA(); if (S.pots < p0) AN.drink = .7; };
const _surgeA = unleashSurge; unleashSurge = function () { const s0 = P.surge; _surgeA(); if (s0 >= 100) AN.surge = .75; };
const _bdA = bossDefeated; bossDefeated = function (e) { _bdA(e); AN.cheer = 1.4; };
const _sfxA = sfx; sfx = function (n) { if (n === 'step') { if (AC && S && G.mode === 'play') noise(.05, .02, 800); return; } _sfxA(n); };
function atkPose(q, a, k, wt) {
  const W = .28, Sx = .56, d = a.dir;
  const ph = k < W ? 0 : k < Sx ? 1 : 2, u = ph === 0 ? ez(k / W) : ph === 1 ? ez((k - W) / (Sx - W)) : ez((k - Sx) / (1 - Sx));
  const heavy = ['axe', 'glaive', 'hammer'].includes(wt);
  switch (a.k) {
    case 'arc':
      if (wt === 'fists') { const L = d > 0; const z = ph === 0 ? lrp(.3, .9, u) : ph === 1 ? lrp(.9, 1.62, u) : lrp(1.62, .3, u); if (L) q.aLz = z; else q.aRz = z; q.chestYaw = (L ? -.45 : .45) * (ph === 1 ? u : ph === 0 ? -u * .3 : 1 - u); q.lunge = ph === 1 ? .12 * u : ph === 2 ? .12 * (1 - u) : 0; break; }
      if (ph === 0) { q.aRz = lrp(.4, heavy ? 2.3 : 1.45, u); q.aRy = lrp(0, 1.25 * d, u); q.chestYaw = .5 * d * u; q.legL = .25 * u; q.legR = -.22 * u; q.kneeR = -.25 * u; }
      else if (ph === 1) { q.aRz = lrp(heavy ? 2.3 : 1.45, 1.4, u); q.aRy = lrp(1.25 * d, -1.5 * d, u); q.chestYaw = lrp(.5 * d, -.65 * d, u); q.lunge = .15 * u; q.chestLean = -.18 * u; q.legL = .3; q.legR = -.25; q.kneeR = -.3; }
      else { q.aRy = lrp(-1.5 * d, 0, u); q.aRz = lrp(1.4, .4, u); q.chestYaw = lrp(-.65 * d, 0, u); q.lunge = .15 * (1 - u); q.chestLean = -.18 * (1 - u); q.legL = .3 * (1 - u); q.legR = -.25 * (1 - u); }
      q.aLz = .5; q.aLy = -.3; break;
    case 'thrust':
      if (ph === 0) { q.aRz = 1.5; q.aRx = -.2 * u; q.chestYaw = .55 * u; q.legL = .35 * u; q.legR = -.3 * u; q.kneeR = -.3 * u; }
      else if (ph === 1) { q.aRz = 1.55; q.aRx = lrp(-.2, .34, u); q.chestYaw = lrp(.55, -.25, u); q.lunge = .24 * u; q.chestLean = -.28 * u; q.legL = .5; q.legR = -.35; q.kneeL = -.35; }
      else { q.aRz = lrp(1.55, .4, u); q.aRx = lrp(.34, 0, u); q.chestYaw = lrp(-.25, 0, u); q.lunge = .24 * (1 - u); q.chestLean = -.28 * (1 - u); q.legL = .5 * (1 - u); q.legR = -.35 * (1 - u); }
      q.aLz = .6; break;
    case 'slam':
      if (ph === 0) { q.aRz = lrp(.4, 3.0, u); q.aLz = lrp(.12, 2.7, u); q.aLy = -.4 * u; q.chestLean = .3 * u; q.kneeL = q.kneeR = -.25 * u; q.rootY = -.04 * u; }
      else if (ph === 1) { q.aRz = lrp(3.0, 1.0, u); q.aLz = lrp(2.7, 1.0, u); q.aLy = -.4; q.chestLean = lrp(.3, -.55, u); q.rootY = -.13 * u; q.kneeL = q.kneeR = lrp(-.25, -.8, u); q.legL = q.legR = .35 * u; q.lunge = .1 * u; }
      else { q.aRz = lrp(1.0, .4, u); q.aLz = lrp(1.0, .12, u); q.chestLean = -.55 * (1 - u); q.rootY = -.13 * (1 - u); q.kneeL = q.kneeR = -.8 * (1 - u); q.legL = q.legR = .35 * (1 - u); }
      break;
    case 'spin':
      q.aRz = 1.57; q.aLz = 1.4; q.aRy = .6; q.aLy = -.9; q.rootY = -.06; q.kneeL = q.kneeR = -.35; q.legL = .2; q.legR = -.2;
      if (ph === 1) q.spin = u * Math.PI * 2; if (ph === 0) q.spin = -.5 * u; break;
    case 'shot':
      if (wt === 'wand') { q.aRz = ph === 0 ? lrp(.6, 2.4, u) : ph === 1 ? lrp(2.4, 1.35, u) : lrp(1.35, .6, u); q.chestLean = ph === 1 ? -.1 * u : 0; break; }
      q.aRz = 1.5; q.aLz = 1.45; q.aLy = -.25; q.chestYaw = .35; q.legL = .3; q.legR = -.25;
      if (ph === 0) q.aRx = -.14 * u; else if (ph === 1) { q.aRx = lrp(-.14, .06, u); q.chestLean = .14 * (1 - u); } else { q.aRz = lrp(1.5, .6, u); q.aLz = lrp(1.45, .2, u); q.chestYaw = .35 * (1 - u); }
      break;
    case 'orb':
      if (ph === 0) { q.aRz = lrp(.5, 2.6, u); q.aLz = lrp(.12, 1.1, u); q.chestLean = .15 * u; }
      else if (ph === 1) { q.aRz = lrp(2.6, 1.3, u); q.aLz = 1.4; q.lunge = .08 * u; q.chestLean = lrp(.15, -.2, u); }
      else { q.aRz = lrp(1.3, .5, u); q.aLz = lrp(1.4, .12, u); q.lunge = .08 * (1 - u); q.chestLean = -.2 * (1 - u); }
      break;
    case 'fan':
      q.aRz = 1.45; q.aLz = .9; q.aRy = ph === 0 ? lrp(0, 1.0 * d, u) : ph === 1 ? lrp(1.0 * d, -1.0 * d, u) : lrp(-1.0 * d, 0, u); q.chestYaw = q.aRy * .35; break;
    case 'boom':
      if (ph === 0) { q.aRz = lrp(.4, -.6, u); q.chestYaw = .55 * u; q.legR = -.3 * u; }
      else if (ph === 1) { q.aRz = lrp(-.6, 1.9, u); q.chestYaw = lrp(.55, -.4, u); q.lunge = .12 * u; q.chestLean = -.2 * u; }
      else { q.aRz = lrp(1.9, .4, u); q.chestYaw = -.4 * (1 - u); q.lunge = .12 * (1 - u); }
      break;
  }
}
animPlayer = function (dt) {
  const r = R3, p = P, wt = ST.wt, w = WT[wt];
  const wantCol = (S.cos && S.cos.color) || CLS[S.cls].col;
  if (r.cls !== S.cls || r.colr !== wantCol) { r.scene.remove(r.pl.g); r.colr = wantCol; r.pl = makeHumanoid({ body: wantCol, cape: shade3(wantCol, .45), hatType: { warrior: 'helm', ranger: 'hood', mage: 'wizard' }[S.cls] }); r.pl.g.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); r.scene.add(r.pl.g); r.cls = S.cls; r.wtype = null; }
  const pl = r.pl;
  if (r.wtype !== wt) { while (pl.hand.children.length) pl.hand.remove(pl.hand.children[0]); pl.hand.add(makeWeapon(wt)); r.wtype = wt; }
  // ---- detect events ----
  if (AN.lvlId !== r.levelId) { AN.lvlId = r.levelId; AN.spawn = .6; AN.death = 0; burst(p.x, p.y, '#ffb04a', 24, 160, .7, 3, .2); }
  if (p.atkCd > AN.prevAtk + .01 && p.swingK !== 'cast') { AN.dir = -AN.dir; AN.atk = { k: w.k, t: 0, dur: clamp(w.cd / atkRate() * .92, .18, .6), dir: AN.dir }; }
  AN.prevAtk = p.atkCd;
  if (p.swingK === 'cast' && p.atkAnim > AN.prevAnim + .05) { const kind = (p.buffs.berserk > 5.8 || p.buffs.warcry > 5.8) ? 'roar' : p.buffs.regen > 4.8 ? 'heal' : 'cast'; AN.cast = { t: 0, dur: kind === 'cast' ? .42 : .7, kind }; AN.atk = null; }
  AN.prevAnim = p.atkAnim;
  if (p.inv > AN.prevInv + .2 && p.inv < .5 && G.mode === 'play') AN.hit = .32; AN.prevInv = p.inv;
  if (AN.prevAir > 0 && p.air <= 0) AN.land = .22; AN.prevAir = p.air;
  if (S.lvl > AN.lastLvl && AN.lastLvl) AN.cheer = 1.2; AN.lastLvl = S.lvl;
  // ---- locomotion ----
  const dx = p.x - AN.px, dy = p.y - AN.py; AN.px = p.x; AN.py = p.y;
  const inst = dt > 0 ? Math.hypot(dx, dy) / dt : 0; AN.spd += ((inst > 1500 ? AN.spd : inst) - AN.spd) * Math.min(1, dt * 12);
  const moving = AN.spd > 25 && p.dodgeT <= 0 && p.air <= 0 && G.mode === 'play';
  const a = clamp(AN.spd / 215, 0, 1.35) * .72;
  let back = 1, side = 0;
  if (moving) { const mvA = Math.atan2(dy, dx), rel = angDiff(p.face, mvA), f = Math.cos(rel); back = f < -.35 ? -1 : 1; side = Math.abs(f) < .5 ? Math.sign(Math.sin(rel)) * -1 : 0; const s0 = Math.sin(AN.ph); AN.ph += dt * (AN.spd / 215) * 11.5; if (Math.sign(Math.sin(AN.ph)) !== Math.sign(s0)) { sfx('step'); if (Math.random() < .7 && !G.inTown) burst(p.x - Math.cos(p.face) * 6, p.y - Math.sin(p.face) * 6, '#a89a84', 2, 40, .35, 2.5, .05); } }
  const q = blankPose();
  if (moving) walkPose(q, AN.ph, a, back, side);
  else {
    AN.idle += dt; const br = Math.sin(G.t * 2.2);
    q.rootY = br * .006; q.aRz = .25 + Math.sin(G.t * 1.3) * .04; q.aLz = .14 - Math.sin(G.t * 1.3) * .03; q.headYaw = Math.sin(G.t * .45) * .28; q.headPitch = Math.sin(G.t * .7) * .04; q.chestLean = br * .015;
    if (['shot', 'orb', 'fan', 'boom'].includes(w.k)) q.aRz = .6;
    if (AN.idle > 7 && !AN.fid && G.mode === 'play') AN.fid = 1.6;
  }
  if (moving || AN.atk || AN.cast) AN.idle = 0;
  if (AN.fid > 0) { AN.fid -= dt; const k = 1 - AN.fid / 1.6; q.aRz = 1.1 + Math.sin(k * Math.PI) * .5; q.aRy = Math.sin(k * Math.PI * 4) * .9; q.headYaw = -.3; if (AN.fid <= 0) { AN.fid = 0; AN.idle = 0; } }
  if (['shot', 'orb', 'fan', 'boom'].includes(w.k) && moving) q.aRz = Math.max(q.aRz, .55);
  let direct = false;
  // ---- actions (later ones override earlier) ----
  if (AN.atk) { AN.atk.t += dt; const k = AN.atk.t / AN.atk.dur; if (k >= 1) AN.atk = null; else { atkPose(q, AN.atk, k, wt); direct = true; if (k > .28 && k < .6 && ['arc', 'spin', 'thrust', 'slam'].includes(AN.atk.k)) trailFx(pl, w); } }
  if (AN.cast) { AN.cast.t += dt; const k = AN.cast.t / AN.cast.dur, c = AN.cast; if (k >= 1) AN.cast = null; else { direct = true; const u = k < .4 ? ez(k / .4) : 1 - ez((k - .4) / .6);
      if (c.kind === 'roar') { q.aRy = 1.3 * u; q.aLy = -1.3 * u; q.aRz = q.aLz = 1.45 * u + .2; q.headPitch = .45 * u; q.chestLean = .28 * u; q.rootY = -.05 * u; q.kneeL = q.kneeR = -.3 * u; }
      else if (c.kind === 'heal') { q.aRz = q.aLz = .2 + 2.6 * u; q.aRy = .3 * u; q.aLy = -.3 * u; q.headPitch = .35 * u; }
      else { q.aRz = q.aLz = k < .4 ? lrp(.3, 2.3, ez(k / .4)) : lrp(2.3, 1.5, ez((k - .4) / .6)); q.aLy = -.25; q.chestLean = k < .4 ? .15 * ez(k / .4) : -.2 * u; q.lunge = k > .4 ? .07 * u : 0; } } }
  if (p.whirl > 0) { q.spin = G.t * 16; q.aRz = q.aLz = 1.5; q.aRy = .7; q.aLy = -.7; q.rootY = -.05; q.kneeL = q.kneeR = -.3; direct = true; }
  if (G.chan > 0) { const u = ez((1.5 - G.chan) / .3); q.rootY = -.2 * u; q.legL = .85 * u; q.kneeL = -1.5 * u; q.legR = -.15 * u; q.kneeR = -1.3 * u; q.aRz = q.aLz = 2.7 * u; q.headPitch = .35 * u; direct = true; }
  if (AN.drink > 0) { AN.drink -= dt; const u = Math.sin(clamp(1 - AN.drink / .7, 0, 1) * Math.PI); q.aLz = lrp(q.aLz, 2.45, u); q.aLy = .55 * u; q.headPitch += .35 * u; }
  if (AN.surge > 0) { AN.surge -= dt; const k = 1 - AN.surge / .75; direct = true; if (k < .3) { const u = ez(k / .3); q.rootY = -.17 * u; q.kneeL = q.kneeR = -.9 * u; q.legL = q.legR = .4 * u; q.aRz = q.aLz = .3; q.chestLean = -.3 * u; } else { const u = 1 - ez((k - .3) / .7); q.aRz = q.aLz = 2.6 * u + .2; q.aRy = .9 * u; q.aLy = -.9 * u; q.chestLean = .3 * u; q.rootY = .12 * u; q.headPitch = .4 * u; } }
  if (AN.cheer > 0) { AN.cheer -= dt; const u = Math.min(1, AN.cheer * 3, (1.4 - AN.cheer) * 5); q.aRz = q.aLz = lrp(q.aRz, 2.9, u); q.aRy = .25 * u; q.aLy = -.25 * u; q.rootY += Math.abs(Math.sin(AN.cheer * 9)) * .12 * u; q.headPitch = .3 * u; }
  if (AN.hit > 0) { AN.hit -= dt; const u = Math.sin(clamp(1 - AN.hit / .32, 0, 1) * Math.PI); q.chestLean += .38 * u; q.headPitch += .3 * u; q.aRz -= .25 * u; q.aLz -= .2 * u; q.lunge -= .06 * u; }
  if (AN.land > 0) { AN.land -= dt; const u = Math.sin(clamp(1 - AN.land / .22, 0, 1) * Math.PI); q.rootY -= .15 * u; q.kneeL -= .9 * u; q.kneeR -= .9 * u; q.legL += .4 * u; q.legR += .4 * u; q.chestLean -= .25 * u; }
  if (p.air > 0) { const k = 1 - p.air / .45; q.kneeL = q.kneeR = -1.4; q.legL = q.legR = .75; q.aRz = q.aLz = 2.5; q.pitch = -k * Math.PI * 2; direct = true; }
  if (p.dodgeT > 0) { const k = 1 - p.dodgeT / .24; q.kneeL = q.kneeR = -1.7; q.legL = q.legR = 1.0; q.aRz = q.aLz = 1.0; q.chestLean = -.4; q.pitch = -ez(k) * Math.PI * 2; q.rootY = -.08; direct = true; }
  if (G.mode === 'dead') { AN.death = Math.min(1.3, AN.death + dt); const k1 = ez(AN.death / .4), k2 = ez((AN.death - .35) / .6); q.kneeL = q.kneeR = -1.4 * k1; q.legL = q.legR = .8 * k1; q.rootY = -.28 * k1 - .12 * k2; q.pitch = 1.45 * k2; q.aRz = q.aLz = 2.2 * k2; q.aRy = .6 * k2; q.aLy = -.6 * k2; q.headPitch = .3 * k2; direct = true; }
  else AN.death = 0;
  // ---- blend & apply ----
  const f = direct ? 1 : 1 - Math.exp(-dt * 15), cur = AN.cur;
  for (const k of POSE_KEYS) cur[k] = (k === 'spin' || k === 'pitch') && direct ? q[k] : cur[k] + (q[k] - cur[k]) * f;
  if (!direct) { cur.spin += (0 - cur.spin) * f; cur.pitch += (0 - cur.pitch) * f; }
  applyPose(pl, cur);
  pl.chest.scale.y = 1 + Math.sin(G.t * 2.2) * .015;
  let sc = 1, y = 0; if (AN.spawn > 0) { AN.spawn -= dt; const u = ez(1 - AN.spawn / .6); sc = .25 + .75 * u; y = -(1 - u) * .4; }
  if (p.air > 0) { const k = 1 - p.air / .45; y = Math.sin(k * Math.PI) * 2.2; }
  pl.g.visible = true; pl.g.scale.setScalar(sc);
  pl.g.position.set(p.x * U + Math.cos(p.face) * cur.lunge, y, p.y * U + Math.sin(p.face) * cur.lunge);
  pl.g.rotation.y = p.dodgeT > 0 ? -Math.atan2(p.dvy, p.dvx) : -p.face;
  if (pl.cape) { const sp = moving ? a : 0; pl.cape.rotation.z += ((-.08 - sp * .55 - Math.sin(G.t * 11) * .05 * sp - (p.dodgeT > 0 ? .5 : 0)) - pl.cape.rotation.z) * .2; pl.cape.userData.low.rotation.z = -.25 * sp + Math.sin(G.t * 3 + 1) * .05 + Math.sin(G.t * 13) * .04 * sp; }
  pl.body.emissive.set(p.inv > .2 ? '#ff2020' : buff('surge') ? '#ff7020' : '#000000'); pl.body.emissiveIntensity = p.inv > .2 ? .8 : buff('surge') ? .5 + .3 * Math.sin(G.t * 8) : 0;
  r.marker.position.set(p.x * U, .03, p.y * U); r.marker.material.color.set(CLS[S.cls].col);
  r.aim.position.set(p.x * U + Math.cos(p.face) * .7, .04, p.y * U + Math.sin(p.face) * .7); r.aim.rotation.set(-Math.PI / 2, 0, -p.face - Math.PI / 2);
  const Wm = mouseWorld(); r.reticle.position.set(Wm.x * U, .72, Wm.y * U); r.reticle.visible = !G.inTown && G.mode === 'play' && !G.menu;
  r.marker.visible = r.aim.visible = G.mode === 'play';
};
function trailFx(pl, w) {
  pl.g.updateMatrixWorld(true); const L = w.rng ? Math.min(.8, w.rng * U * .62) : .5;
  pl.hand.localToWorld(_vT.set(L, 0, 0));
  if (G.parts.length < 1300) G.parts.push({ x: _vT.x * TILE, y: _vT.z * TILE, z: _vT.y, vx: 0, vy: 0, vz: 0, g: 0, life: .2, max: .2, col: w.col, size: 5 });
}
// ---------- NPC & villager animation ----------
function npcAnim(h, n, seed) {
  const q = blankPose(), t = G.t + seed;
  q.rootY = Math.sin(t * 2) * .006; q.headYaw = Math.sin(t * .5) * .2; q.aRz = .2; q.aLz = .12;
  const near = P && dist(P, n) < 190;
  if (near) { h.g.getWorldPosition(_vT); const aa = Math.atan2(P.y * U - _vT.z, P.x * U - _vT.x); q.headYaw = clamp(angDiff(-h.g.rotation.y, aa), -.9, .9); }
  switch (n.kind) {
    case 'smith': { const c = (t * .9) % 1; q.aRz = c < .65 ? lrp(.6, 2.7, ez(c / .65)) : lrp(2.7, .7, ezIn((c - .65) / .35)); q.chestLean = c < .65 ? .1 : -.2; q.headPitch = -.2; if (c > .97 && Math.random() < .5) burst(n.x + 20, n.y + 25, '#ffb040', 5, 120, .4, 2, .8); break; }
    case 'shop': if (near) { q.aRz = 2.6; q.aRy = Math.sin(t * 8) * .35; } else { q.aLz = .9 + Math.sin(t * 3) * .1; q.aRz = .9 + Math.sin(t * 3 + 1) * .1; q.headPitch = -.25; } break;
    case 'sage': q.aLz = 1.3; q.aLy = -.45; q.aRz = 1.1; q.aRy = .35; q.headPitch = near ? 0 : -.35; break;
    case 'jewel': q.aRz = 1.9 + Math.sin(t * 1.5) * .1; q.aRy = -.35; if (!near) { q.headYaw = .3; q.headPitch = .1; } break;
    case 'curio': q.aRz = .95; q.aRy = -.95; q.aLz = .95; q.aLy = .95; q.rootY += Math.sin(t * .8) * .01; break;
  }
  applyPose(h, q); h.chest.scale.y = 1 + Math.sin(t * 2) * .012;
}
function villagerAnim(h, v, moving) {
  const q = blankPose();
  if (moving) walkPose(q, v.mv * 1.6, .45); else { q.headYaw = Math.sin(G.t * .5 + v.x) * .3; q.rootY = Math.sin(G.t * 2 + v.y) * .006; }
  if (v.sayLeft > 0) { q.aLz = 1.4 + Math.sin(G.t * 6) * .35; q.aLy = .3; q.aRz = .6 + Math.sin(G.t * 5 + 1) * .2; q.headPitch = .08; }
  applyPose(h, q);
}
// ---------- monsters: hop, gallop, recoil, lunge, rise from the ground ----------
const _aeA = animEnemy;
animEnemy = function (e, g) {
  _aeA(e, g); const p = g.userData.parts; if (!p || e.prop) return;
  if (e.spawnT < 1) p.inner.position.y -= (1 - e.spawnT) * 1.4;
  if (e.d.sh === 'blob' && e.awake) { const hop = Math.abs(Math.sin(e.mv * .045)); p.inner.position.y += hop * .4; p.inner.scale.y *= .9 + hop * .2; }
  if (e.d.sh === 'beast' && e.awake) p.inner.rotation.z += Math.sin(e.mv * .12) * .07;
  if (e.cast > 0) p.inner.position.x = -e.cast * 1.3; else p.inner.position.x *= .8;
  if (['chase', 'swarm', 'tank'].includes(e.d.ai) && e.awake && dist(e, P) < e.r + P.r + 26) p.inner.rotation.z += (-.38 - p.inner.rotation.z) * .3;
  if (e.boss && e.enr) p.inner.scale.multiplyScalar(1 + Math.sin(G.t * 7) * .025);
};
