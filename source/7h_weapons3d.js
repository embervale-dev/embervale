// ================= WEAPON MODELS v3: detailed models for all 20 weapon types =================
// Every weapon points along +X of the hand group (hand at the origin). Blades lie flat in the XZ plane
// (edges along Z, thickness along Y) so their broad face is seen by the top-down camera mid-swing.
// Geometry is built once per type and cached; materials are cached; only Mesh objects are made per call.
{
  const _mwV3 = makeWeapon;
  const WG = {}, WMC = {};
  const cg = (k, f) => WG[k] || (WG[k] = f());
  const V3 = (x, y, z) => new T3.Vector3(x, y, z);
  const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, ord = 'XYZ') => { const sc = Array.isArray(s) ? V3(s[0], s[1], s[2]) : V3(s, s, s); return new T3.Matrix4().compose(V3(x, y, z), new T3.Quaternion().setFromEuler(new T3.Euler(rx, ry, rz, ord)), sc); };

  // ---------- small neutral environment so polished metal reads as metal without a scene env map ----------
  let ENV = null;
  function envTex() {
    if (ENV) return ENV;
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#f2f4fa'); gr.addColorStop(.38, '#a8adb8'); gr.addColorStop(.5, '#7a7068'); gr.addColorStop(.62, '#544a40'); gr.addColorStop(1, '#2a241e');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 128);
    for (const [px, py, r, a] of [[60, 26, 26, 1], [190, 38, 34, .55], [128, 14, 16, .8]]) { const rg = x.createRadialGradient(px, py, 0, px, py, r); rg.addColorStop(0, `rgba(255,248,232,${a})`); rg.addColorStop(1, 'rgba(255,248,232,0)'); x.fillStyle = rg; x.fillRect(0, 0, 256, 128); }
    ENV = new T3.CanvasTexture(c); ENV.mapping = T3.EquirectangularReflectionMapping; ENV.colorSpace = T3.SRGBColorSpace;
    return ENV;
  }
  // material cache: metal (metal > .5) gets the env map; keeps metalness > .5 so rarity tint applies
  function wm(hex, o = {}) {
    const k = hex + '|' + JSON.stringify(o); if (WMC[k]) return WMC[k];
    const m = new T3.MeshStandardMaterial({ color: hex, roughness: o.rough ?? .7, metalness: o.metal ?? 0, flatShading: !!o.flat });
    if (o.em) { m.emissive = new T3.Color(o.emc || hex); m.emissiveIntensity = o.em; }
    if (o.op !== undefined) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
    if (o.side) m.side = T3.DoubleSide;
    if ((o.metal ?? 0) > .3) { try { m.envMap = envTex(); m.envMapIntensity = o.env ?? 1; } catch (e) {} }
    return WMC[k] = m;
  }
  const metal = (hex, rough = .3, o = {}) => wm(hex, { metal: .88, rough, ...o });
  const lighten = (hex, f) => { const c = new T3.Color(hex); c.lerp(new T3.Color('#ffffff'), f); return '#' + c.getHexString(); };

  // ---------- geometry builders ----------
  // loft along X: stations [[x, [[y,z], ...]], ...] (closed cross-section loops, same point count). Flat-shaded, auto-oriented.
  function loft(st) {
    const n = st[0][1].length, pos = [];
    const ctr = st.map(([x, p]) => [x, p.reduce((s, q) => s + q[0], 0) / n, p.reduce((s, q) => s + q[1], 0) / n]);
    const tri = (a, b, c, d) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * nx + ny * ny + nz * nz < 1e-16) return;
      if (nx * d[0] + ny * d[1] + nz * d[2] < 0) pos.push(...a, ...c, ...b); else pos.push(...a, ...b, ...c);
    };
    for (let s = 0; s < st.length - 1; s++) for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, P = (k, q) => [st[k][0], st[k][1][q][0], st[k][1][q][1]];
      const a = P(s, i), b = P(s, j), c = P(s + 1, j), d = P(s + 1, i);
      const cy = (ctr[s][1] + ctr[s + 1][1]) / 2, cz = (ctr[s][2] + ctr[s + 1][2]) / 2;
      const dir = [0, (a[1] + b[1] + c[1] + d[1]) / 4 - cy, (a[2] + b[2] + c[2] + d[2]) / 4 - cz];
      if (Math.abs(dir[1]) + Math.abs(dir[2]) < 1e-9) dir[0] = 1;
      tri(a, b, c, dir); tri(a, c, d, dir);
    }
    for (const [s, dx] of [[0, -1], [st.length - 1, 1]]) { const c = ctr[s]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(c, [st[s][0], ...st[s][1][i]], [st[s][0], ...st[s][1][j]], [dx, 0, 0]); } }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  // lathe around X: pts [[r, x], ...] in increasing x
  function latheX(pts, seg = 16, flat) { let g = new T3.LatheGeometry(pts.map(p => new T3.Vector2(Math.max(p[0], 1e-4), p[1])), seg); g.rotateZ(-Math.PI / 2); if (flat) { g = g.toNonIndexed(); g.computeVertexNormals(); } return g; }
  // cylinder along X from 0..len
  function cylX(r0, r1, len, seg = 12, open) { const g = new T3.CylinderGeometry(r1, r0, len, seg, 1, !!open); g.rotateZ(-Math.PI / 2); g.translate(len / 2, 0, 0); return g; }
  // flat shape in the XZ plane from [x,z] points (thickness along Y)
  function shapeOf(pts) { const s = new T3.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]); } s.closePath(); return s; }
  const symPts = half => half.concat(half.slice(1, -1).reverse().map(([x, z]) => [x, -z]));
  function extXZ(shape, depth, bev, curve = 10) {
    const g = new T3.ExtrudeGeometry(shape, { depth, bevelEnabled: !!bev, bevelThickness: bev ? bev[0] : 0, bevelSize: bev ? bev[1] : 0, bevelSegments: bev ? (bev[2] || 1) : 1, curveSegments: curve });
    g.translate(0, 0, -depth / 2); g.rotateX(Math.PI / 2); return g;
  }
  function extXY(shape, depth, bev, curve = 10) {
    const g = new T3.ExtrudeGeometry(shape, { depth, bevelEnabled: !!bev, bevelThickness: bev ? bev[0] : 0, bevelSize: bev ? bev[1] : 0, bevelSegments: bev ? (bev[2] || 1) : 1, curveSegments: curve });
    g.translate(0, 0, -depth / 2); return g;
  }
  // tube through points with radius profile f(t) and optional flattening relative to plane normal N: [inPlane, alongN]
  function ttube(pts, r, f, seg = 24, rad = 6, N, flat) {
    const cur = new T3.CatmullRomCurve3(pts.map(p => V3(p[0], p[1], p[2])));
    const g = new T3.TubeGeometry(cur, seg, r, rad, false), pa = g.attributes.position, c = V3(0, 0, 0), d = V3(0, 0, 0);
    for (let i = 0; i <= seg; i++) {
      cur.getPointAt(i / seg, c); const k = f ? f(i / seg) : 1;
      for (let j = 0; j <= rad; j++) {
        const id = i * (rad + 1) + j; d.fromBufferAttribute(pa, id).sub(c);
        if (N) { const dn = d.dot(N); d.addScaledVector(N, -dn).multiplyScalar(flat[0]).addScaledVector(N, dn * flat[1]); }
        d.multiplyScalar(k); pa.setXYZ(id, c.x + d.x, c.y + d.y, c.z + d.z);
      }
    }
    g.computeVertexNormals(); return g;
  }
  // grip wrap: helix(es) along +X from 0..len
  function wrapGeo(len, r, turns, tr, dbl) {
    const mk1 = (ph, dir) => { const pts = [], n = Math.ceil(turns * 10); for (let i = 0; i <= n; i++) { const t = i / n, a = ph + dir * t * turns * Math.PI * 2; pts.push([t * len, Math.cos(a) * r, Math.sin(a) * r]); } return ttube(pts, tr, null, Math.ceil(turns * 12), 4); };
    return dbl ? merge([[mk1(0, 1)], [mk1(Math.PI, -1)]]) : mk1(0, 1);
  }
  // merge geometries [[geo, matrix?], ...] into one non-indexed geometry (position + normal)
  function merge(list) {
    const pos = [], nor = [];
    for (const [g0, m] of list) {
      const g = g0.index ? g0.toNonIndexed() : g0.clone(); if (m) g.applyMatrix4(m); if (!g.attributes.normal) g.computeVertexNormals();
      pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    }
    const o = new T3.BufferGeometry(); o.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); return o;
  }
  const SPH = () => cg('sph', () => new T3.SphereGeometry(1, 14, 10));
  const SPHL = () => cg('sphL', () => new T3.SphereGeometry(1, 8, 6));
  const OCT = () => cg('oct', () => new T3.OctahedronGeometry(1));
  const ringX = (r, tube, arc = Math.PI * 2, rs = 6, ts = 24) => { const g = new T3.TorusGeometry(r, tube, rs, ts, arc); g.rotateY(Math.PI / 2); return g; }; // torus around the X axis
  // cross sections (arrays of [y,z])
  const secFuller = (w, t, f) => [[0, w], [t, .55 * w], [t, .22 * w], [t * f, 0], [t, -.22 * w], [t, -.55 * w], [0, -w], [-t, -.55 * w], [-t, -.22 * w], [-t * f, 0], [-t, .22 * w], [-t, .55 * w]];
  const secDiamond = (w, t) => [[0, w], [t, 0], [0, -w], [-t, 0]];
  const secD6 = (w, t) => [[0, w], [t, 0], [t, 0], [0, -w], [-t, 0], [-t, 0]];
  const secHex = (w, t) => [[0, w], [t, .45 * w], [t, -.45 * w], [0, -w], [-t, -.45 * w], [-t, .45 * w]];
  // single-edged section: edge at ze (+z), spine at zs
  const secKatana = (ze, zs, t) => { const zr = zs + (ze - zs) * .3; return [[0, ze], [t, zr], [t * .7, zs], [-t * .7, zs], [-t, zr]]; };
  const domes = (list, r = .008) => merge(list.map(([x, y, z, s]) => [new T3.SphereGeometry(1, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M4(x, y, z, y < 0 ? Math.PI : 0, 0, 0, s || r)]));
  // spike pointing along +Y, base at origin
  const spikeGeo = (r, h, seg = 6) => { const g = new T3.ConeGeometry(r, h, seg); g.translate(0, h / 2, 0); return g; };
  const alignY = (d) => new T3.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());

  // ---------- shared materials ----------
  const MAT = () => ({
    gold: metal('#d8ac48', .28), brass: metal('#b48a48', .35), steel: metal('#c8ced8', .26), dsteel: metal('#7a7e88', .38), iron: metal('#4a4c54', .42),
    leather: wm('#3e2416', { rough: .85 }), leatherL: wm('#7a4c2a', { rough: .75 }), wood: wm('#6e4a2a', { rough: .72 }), woodD: wm('#4a3020', { rough: .75 }), woodL: wm('#8e6438', { rough: .65 }),
    cloth: wm('#a8262a', { rough: .9 }), cream: wm('#efe2bc', { rough: .85 }), black: wm('#141218', { rough: .6 }),
  });

  // ---------- per-type builders: (g, w, M, add) ----------
  const B = {
    sword(g, w, M, add) {
      const blade = cg('sw_blade', () => loft([[.095, secFuller(.03, .011, 1)], [.13, secFuller(.043, .012, 1)], [.155, secFuller(.043, .012, .4)], [.42, secFuller(.04, .011, .4)], [.63, secFuller(.036, .010, .45)], [.7, secFuller(.031, .009, 1)], [.765, secFuller(.016, .006, 1)], [.805, secFuller(0, 0, 1)]]));
      add(blade, metal(w.col, .2));
      add(cg('sw_guard', () => extXZ(shapeOf(symPts([[.08, 0], [.083, .05], [.074, .115], [.079, .142], [.097, .15], [.109, .137], [.1, .112], [.104, .05], [.118, .024], [.128, 0]])), .022, [.005, .004, 2])), M.gold);
      add(SPH(), M.gold, .1, 0, 0, 0, 0, 0, [.016, .021, .016], false);
      add(cg('sw_core', () => cylX(.021, .019, .145)), M.leather, -.058);
      add(cg('sw_wrap', () => wrapGeo(.14, .02, 6, .0075)), M.leatherL, -.055, 0, 0, 0, 0, 0, 1, false);
      add(cg('sw_pom', () => latheX([[0, -.118], [.016, -.116], [.03, -.106], [.036, -.092], [.033, -.078], [.022, -.068], [.014, -.062], [.018, -.058], [.018, -.052]], 14)), M.gold);
    },
    katana(g, w, M, add) {
      const zc = x => -.05 * Math.pow((x - .17) / .8, 2);
      const blade = cg('ka_blade', () => loft([[.17, .026, -.026, .0085], [.4, .026, -.025, .0085], [.7, .024, -.023, .008], [.86, .022, -.021, .0075], [.905, .019, -.02, .007], [.935, .01, -.019, .0055], [.955, .0, -.018, .004], [.972, -.012, -.016, 0]].map(([x, e, s, t]) => [x, secKatana(e + zc(x), s + zc(x), t)])));
      add(blade, metal(w.col, .14));
      add(cg('ka_hamon', () => loft([[.19, [[0, .027], [.0035, .021], [-.0035, .021]]], [.7, [[0, .0242 + zc(.7)], [.0033, .019 + zc(.7)], [-.0033, .019 + zc(.7)]]], [.9, [[0, .0195 + zc(.9)], [.003, .015 + zc(.9)], [-.003, .015 + zc(.9)]]], [.94, [[0, .008 + zc(.94)], [.002, .005 + zc(.94)], [-.002, .005 + zc(.94)]]]])), metal(lighten(w.col, .6), .08, { env: 1.4 }), 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('ka_habaki', () => cylX(.03, .028, .03, 8)), M.gold, .155, 0, 0, 0, 0, 0, [1, .5, 1]);
      add(cg('ka_tsuba', () => latheX([[0, .14], [.06, .14], [.066, .145], [.066, .152], [.06, .157], [0, .157]], 20)), M.iron, 0, 0, 0, 0, 0, 0, [1, 1, .85]);
      add(cg('ka_tsrim', () => ringX(.062, .005, Math.PI * 2, 4, 28)), M.gold, .149, 0, 0, 0, 0, 0, [1, 1, .85], false);
      add(cg('ka_fuchi', () => latheX([[.024, .118], [.026, .125], [.026, .14]], 12)), M.gold);
      add(cg('ka_tsuka', () => cylX(.024, .023, .17, 10)), wm('#ece6d6', { rough: .6 }), -.052);
      add(cg('ka_ito', () => wrapGeo(.165, .024, 5, .0085, true)), wm('#1c2244', { rough: .8 }), -.05, 0, 0, 0, 0, 0, [1, 1, 1], false);
      add(cg('ka_kashira', () => latheX([[0, -.072], [.018, -.07], [.025, -.062], [.025, -.05]], 12)), M.iron);
      add(SPHL(), M.gold, .04, .024, 0, 0, 0, 0, [.018, .008, .01], false);
    },
    dagger(g, w, M, add) {
      add(cg('da_blade', () => loft([[.085, secHex(.016, .008)], [.1, secD6(.024, .009)], [.17, secD6(.031, .009)], [.28, secD6(.026, .008)], [.36, secD6(.015, .006)], [.415, secD6(0, 0)]])), metal(w.col, .2));
      add(cg('da_guard', () => extXZ(shapeOf([[.07, 0], [.072, .04], [.064, .08], [.072, .095], [.083, .085], [.08, .06], [.088, .02], [.092, 0], [.088, -.02], [.096, -.06], [.104, -.082], [.094, -.095], [.08, -.08], [.073, -.04]]), .018, [.004, .003, 1])), M.gold);
      add(cg('da_core', () => cylX(.018, .02, .1)), M.leather, -.03);
      add(cg('da_wrap', () => wrapGeo(.095, .019, 4, .0072)), M.leatherL, -.028, 0, 0, 0, 0, 0, 1, false);
      add(cg('da_pom', () => latheX([[0, -.07], [.018, -.066], [.025, -.054], [.022, -.042], [.014, -.034], [.016, -.028]], 12)), M.gold);
    },
    axe(g, w, M, add) {
      add(cg('ax_haft', () => ttube([[-.075, 0, 0], [.2, 0, -.012], [.55, 0, -.008], [.92, 0, 0]], .027, t => t < .05 ? 1.2 : 1.05 - .15 * t, 24, 8)), M.wood);
      add(cg('ax_butt', () => latheX([[0, -.115], [.022, -.11], [.034, -.095], [.032, -.075], [.028, -.068]], 12)), M.dsteel);
      add(cg('ax_wrap', () => wrapGeo(.25, .03, 7, .009)), M.leather, -.06, 0, 0, 0, 0, 0, 1, false);
      add(cg('ax_lang', () => merge([[new T3.BoxGeometry(.13, .006, .022), M4(.665, .028, 0)], [new T3.BoxGeometry(.13, .006, .022), M4(.665, -.028, 0)]])), M.dsteel);
      add(cg('ax_lriv', () => domes([[.63, .031, 0], [.68, .031, 0], [.63, -.031, 0], [.68, -.031, 0]], .007)), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      const inEdge = [.79, .34, .965, .27];
      add(cg('ax_head', () => extXZ(shapeOf([[.858, -.03], [.85, -.06], [.8, -.135], [.772, -.06], [.728, -.03], [.718, .025], [.745, .06, .73, .1], [.7, .2, .605, .25], inEdge, [.86, .17, .86, .07], [.866, .03]]), .03, [.012, .01, 2], 14)), wm(shade3(w.col, .55), { metal: .75, rough: .55 }));
      add(cg('ax_edge', () => extXZ(shapeOf([[.59, .265], [.795, .385, .995, .29], [.965, .27], [inEdge[0], inEdge[1], .605, .25]]), .008, [.007, .004, 1], 14)), metal(lighten(w.col, .4), .14, { env: 1.2 }));
      add(cg('ax_riv', () => domes([[.785, .028, .045], [.785, -.028, .045], [.765, .028, .12], [.765, -.028, .12]], .011)), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('ax_boss', () => merge([[new T3.TorusGeometry(.032, .006, 5, 18), M4(.79, .029, 0, Math.PI / 2)], [new T3.TorusGeometry(.032, .006, 5, 18), M4(.79, -.029, 0, Math.PI / 2)]])), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('ax_cap', () => latheX([[.03, .9], [.036, .91], [.03, .935], [0, .94]], 10)), M.dsteel);
    },
    hammer(g, w, M, add) {
      add(cg('hm_haft', () => ttube([[-.07, 0, 0], [.4, 0, 0], [.76, 0, 0]], .028, t => 1.1 - .12 * t, 12, 8)), M.woodD);
      add(cg('hm_butt', () => latheX([[0, -.13], [.012, -.125], [.03, -.1], [.036, -.085], [.032, -.072], [.03, -.064]], 10, true)), M.dsteel);
      add(cg('hm_wrap', () => wrapGeo(.26, .03, 6, .0095)), M.leatherL, -.058, 0, 0, 0, 0, 0, 1, false);
      add(cg('hm_lang', () => merge([0, 1, 2, 3].map(i => [new T3.BoxGeometry(.18, .007, .02), M4(.66, Math.cos(i * Math.PI / 2) * .03, Math.sin(i * Math.PI / 2) * .03, i * Math.PI / 2)]))), M.dsteel);
      // octagonal double-faced head along Z, flared striking faces
      add(cg('hm_head', () => { const g = new T3.LatheGeometry([[0, -.205], [.088, -.205], [.104, -.195], [.106, -.17], [.09, -.158], [.086, -.06], [.086, .06], [.09, .158], [.106, .17], [.104, .195], [.088, .205], [0, .205]].map(p => new T3.Vector2(Math.max(p[0], 1e-4), p[1])), 8); g.rotateY(Math.PI / 8); g.rotateX(Math.PI / 2); const n = g.toNonIndexed(); n.computeVertexNormals(); return n; }), metal(w.col, .34), .82);
      add(cg('hm_band', () => { const g = new T3.CylinderGeometry(.096, .096, .1, 8); g.rotateY(Math.PI / 8); g.rotateX(Math.PI / 2); const n = g.toNonIndexed(); n.computeVertexNormals(); return n; }), M.gold, .82);
      add(cg('hm_riv', () => domes([-.035, 0, .035].flatMap(z => [[.82, .089, z], [.82, -.089, z]]), .009)), M.dsteel, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('hm_spike', () => { const g = spikeGeo(.03, .09, 4); g.rotateZ(-Math.PI / 2); g.rotateX(Math.PI / 4); g.translate(.91, 0, 0); return g; }), metal(w.col, .3, { flat: true }));
    },
    spear(g, w, M, add) {
      add(cg('sp_shaft', () => ttube([[-.18, 0, 0], [.5, 0, 0], [1.1, 0, 0]], .022, t => 1.05 - .2 * t, 12, 8)), M.wood);
      add(cg('sp_butt', () => latheX([[0, -.26], [.012, -.24], [.024, -.2], [.026, -.185], [.024, -.175]], 10, true)), M.dsteel);
      add(cg('sp_wrap', () => wrapGeo(.32, .022, 9, .0075)), M.leather, -.06, 0, 0, 0, 0, 0, 1, false);
      add(cg('sp_bands', () => merge([[ringX(.023, .005, Math.PI * 2, 4, 16), M4(.6)], [ringX(.022, .005, Math.PI * 2, 4, 16), M4(.64)]])), M.brass, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('sp_sock', () => latheX([[.02, 1.06], [.027, 1.07], [.027, 1.085], [.022, 1.095], [.02, 1.15], [.016, 1.18]], 10, true)), M.dsteel);
      add(cg('sp_head', () => loft([[1.165, secDiamond(.012, .011)], [1.215, secDiamond(.05, .012)], [1.27, secDiamond(.046, .011)], [1.35, secDiamond(.022, .008)], [1.43, secDiamond(0, 0)]])), metal(w.col, .2));
      add(cg('sp_lugs', () => merge([1, -1].map(s => [spikeGeo(.008, .04, 4), M4(1.135, 0, s * .022, s * Math.PI / 2, 0, 0)]))), M.dsteel);
      add(cg('sp_tassel', () => merge([[ringX(.023, .007, Math.PI * 2, 5, 14), M4(1.05)], ...[[-.03, .012], [.0, -.012], [.03, .006], [-.012, .022], [.015, -.026]].map(([z, y]) => [ttube([[1.055, y * .5, z * .5], [1.0, y, z], [.92, y * 1.6 - .02, z * 1.5]], .009, t => 1 - .8 * t, 8, 4)])])), M.cloth, 0, 0, 0, 0, 0, 0, 1, false);
    },
    scythe(g, w, M, add) {
      add(cg('sc_snath', () => ttube([[-.13, 0, 0], [.2, 0, .03], [.6, 0, -.025], [1.0, 0, 0]], .024, t => 1.05 - .1 * t, 28, 8)), wm('#2e2232', { rough: .7 }));
      add(cg('sc_nib', () => merge([[cylX(.014, .012, .11, 8), M4(.43, 0, .015, 0, -Math.PI / 2, 0)], [new T3.SphereGeometry(.016, 8, 6), M4(.43, 0, .125)]])), M.woodD);
      add(cg('sc_wrap', () => wrapGeo(.2, .025, 6, .008)), wm('#5a2a3a', { rough: .8 }), -.08, 0, 0, 0, 0, 0, 1, false);
      add(cg('sc_coll', () => latheX([[.026, .94], [.031, .95], [.031, .975], [.028, .985], [.03, 1.03], [.02, 1.045]], 10, true)), M.dsteel);
      const sp = [1.105, .38, .76, .69], ed = [.935, .37, .95, .05], inr = [.965, .36, .978, .05];
      const bodyM = wm(shade3(w.col, .6), { metal: .75, rough: .5, em: .12, emc: w.col }), edgeM = metal(lighten(w.col, .3), .16, { env: 1, em: .2, emc: w.col });
      add(cg('sc_blade', () => extXZ(shapeOf([[.975, -.03], [1.06, -.03], [sp[0], sp[1], sp[2], sp[3]], [inr[0], inr[1], inr[2], inr[3]]]), .012, [.006, .005, 1], 16)), bodyM);
      add(cg('sc_edge', () => extXZ(shapeOf([[.76, .69], [ed[0], ed[1], ed[2], ed[3]], [.978, .05], [inr[0], inr[1], .76, .69]]), .004, [.004, .003, 1], 16)), edgeM);
      add(cg('sc_tang', () => merge([[new T3.BoxGeometry(.08, .03, .05), M4(1.01, 0, .005)], ...[[.99, .016, -.005], [1.03, .016, -.005], [.99, -.016, -.005], [1.03, -.016, -.005]].map(([x, y, z]) => [new T3.SphereGeometry(.008, 8, 5), M4(x, y, z)])])), M.iron);
    },
    flail(g, w, M, add) {
      add(cg('fl_haft', () => latheX([[.03, -.045], [.028, .0], [.026, .2], [.03, .23], [.03, .25], [.026, .26], [.025, .33]], 12)), M.wood);
      add(cg('fl_pom', () => latheX([[0, -.1], [.016, -.096], [.032, -.08], [.034, -.064], [.028, -.05], [.03, -.042]], 8, true)), M.dsteel);
      add(cg('fl_wrap', () => wrapGeo(.19, .029, 5, .0095)), M.leather, -.035, 0, 0, 0, 0, 0, 1, false);
      add(cg('fl_cap', () => merge([[latheX([[.028, .32], [.034, .33], [.034, .36], [.02, .38], [.01, .385]], 8, true)], [new T3.TorusGeometry(.016, .005, 5, 12), M4(.395)]])), M.dsteel);
      add(cg('fl_chain', () => { const L = [], a = V3(.41, 0, 0), b = V3(.655, -.07, 0), n = 5; for (let i = 0; i < n; i++) { const t = (i + .5) / n, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * .03; const t2 = (i + 1) / n, p2 = a.clone().lerp(b, t2); p2.y -= Math.sin(t2 * Math.PI) * .03; const ang = Math.atan2(p2.y - p.y, p2.x - p.x); L.push([new T3.TorusGeometry(.017, .0055, 5, 12), M4(p.x, p.y, p.z, i % 2 ? Math.PI / 2 : 0, 0, ang, [1.5, 1, 1], 'ZYX')]); } return merge(L); }), M.iron, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('fl_ball', () => { const L = [[new T3.SphereGeometry(.092, 16, 12), null]], phi = (1 + Math.sqrt(5)) / 2; for (const [x, y, z] of [[0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi], [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0], [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]]) { const d = V3(x, y, z).normalize(), m = new T3.Matrix4().compose(d.clone().multiplyScalar(.082), alignY(d), V3(1, 1, 1)); L.push([spikeGeo(.022, .075, 6), m]); } return merge(L); }), metal(w.col, .34), .72, -.1, 0);
      add(cg('fl_band', () => new T3.TorusGeometry(.094, .009, 6, 24)), M.brass, .72, -.1, 0, Math.PI / 2, 0, .5, 1, false);
      add(cg('fl_eye', () => new T3.TorusGeometry(.016, .005, 5, 12)), M.iron, .72, -.002, 0, 0, 0, .3, 1, false);
    },
    fists(g, w, M, add) {
      const glove = wm(shade3(w.col, .45), { rough: .75 });
      add(cg('fi_cuff', () => latheX([[.074, -.15], [.078, -.142], [.07, -.125], [.06, -.08], [.056, -.045]], 16)), wm('#9a9eaa', { metal: .88, rough: .3, side: 1 }));
      add(cg('fi_rim', () => ringX(.077, .007, Math.PI * 2, 5, 24)), M.gold, -.146, 0, 0, 0, 0, 0, 1, false);
      add(cg('fi_criv', () => domes([0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3 + .5; return [-.1, Math.cos(a) * .067, Math.sin(a) * .067]; }).map(([x, y, z]) => [x, y, z]), .007)), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(SPH(), glove, .02, -.004, 0, 0, 0, 0, [.085, .058, .07]);
      add(cg('fi_plates', () => merge([-.05, -.012, .026].map((x, i) => { const g = new T3.CylinderGeometry(.076 - i * .003, .076 - i * .003, .046, 12, 1, true, Math.PI * 1.5 - 1.2, 2.4); g.rotateZ(-Math.PI / 2); return [g, M4(x, -.008, 0, 0, 0, .06)]; }))), wm('#9a9eaa', { metal: .88, rough: .3, side: 1 }));
      add(cg('fi_knuck', () => merge([[(() => { const g = new T3.CylinderGeometry(.064, .064, .034, 10, 1, true, Math.PI * 1.5 - 1.1, 2.2); g.rotateZ(-Math.PI / 2); return g; })(), M4(.083, -.006, 0)], ...[-.045, -.015, .015, .045].flatMap(z => [[new T3.SphereGeometry(.019, 10, 8), M4(.1, .03, z, 0, 0, 0, [1, .8, 1])], [spikeGeo(.011, .055, 6), M4(.112, .032, z, 0, 0, -Math.PI / 2 + .25)]])])), wm('#9a9eaa', { metal: .88, rough: .3, side: 1 }));
      add(cg('fi_fing', () => merge([-.045, -.015, .015, .045].map(z => [new T3.CapsuleGeometry(.016, .02, 3, 8), M4(.1, -.018, z, 0, 0, .9)]))), glove);
      add(cg('fi_thumb', () => new T3.CapsuleGeometry(.017, .05, 3, 8)), glove, .06, -.02, .065, .3, 0, -1.1);
      add(cg('fi_strap', () => cylX(.064, .064, .014, 14)), M.leather, -.03, -.004, 0, 0, 0, 0, [1, .92, 1.12], false);
      add(cg('fi_buck', () => new T3.BoxGeometry(.016, .02, .006)), M.gold, -.023, -.004, .079, 0, 0, 0, 1, false);
    },
    bow(g, w, M, add) {
      const b = new T3.Group(); b.rotation.x = -.9; g.add(b); const addB = (geo, m, x, y, z, rx, ry, rz, s, sh) => add(geo, m, x, y, z, rx, ry, rz, s, sh, b);
      const P = [[-.085, -.47], [-.1, -.44], [-.06, -.355], [0, -.24], [.045, -.12], [.06, 0], [.045, .12], [0, .24], [-.06, .355], [-.1, .44], [-.085, .47]];
      addB(cg('bo_limb', () => ttube(P.map(([x, y]) => [x, y, 0]), .018, t => { const s = Math.abs(t - .5) * 2; return 1.25 - .8 * s; }, 48, 6, V3(0, 0, 1), [.65, 1.45])), wm(w.col, { rough: .55 }));
      addB(cg('bo_belly', () => ttube(P.slice(2, 9).map(([x, y]) => [x + .009, y, 0]), .01, t => 1 - Math.abs(t - .5) * 1.2, 32, 4, V3(0, 0, 1), [.4, 1.8])), wm('#4a2a18', { rough: .6 }), 0, 0, 0, 0, 0, 0, 1, false);
      addB(cg('bo_grip', () => cylX(.025, .025, .15, 10)), M.leather, .052, -.075, 0, 0, 0, Math.PI / 2);
      addB(cg('bo_wrap', () => wrapGeo(.14, .025, 5, .008)), M.leatherL, .052, -.07, 0, 0, 0, Math.PI / 2, 1, false);
      addB(cg('bo_nock', () => merge([[new T3.SphereGeometry(.012, 8, 6), M4(-.086, .468, 0)], [new T3.SphereGeometry(.012, 8, 6), M4(-.086, -.468, 0)], [ringX(.025, .004, Math.PI * 2, 4, 14), M4(.052, .075, 0, 0, 0, Math.PI / 2)], [ringX(.025, .004, Math.PI * 2, 4, 14), M4(.052, -.075, 0, 0, 0, Math.PI / 2)]])), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      addB(cg('bo_str', () => { const g = new T3.CylinderGeometry(.0022, .0022, .93, 4); g.translate(-.097, 0, 0); return g; }), wm('#f0ece0', { rough: .5 }), 0, 0, 0, 0, 0, 0, 1, false);
      // nocked arrow
      addB(cg('bo_shaft', () => cylX(.0045, .0045, .44, 6)), M.woodL, -.1, 0, .026, 0, 0, 0, 1, false);
      addB(cg('bo_head', () => loft([[.335, secDiamond(.007, .006)], [.36, secDiamond(.018, .004)], [.415, secDiamond(0, 0)]])), metal('#c8ced8', .2), 0, 0, .026, 0, 0, 0, 1, false);
      addB(cg('bo_fl', () => { const s = shapeOf([[-.095, 0], [-.03, 0], [-.045, .016], [-.09, .02]]); const L = []; for (let i = 0; i < 3; i++) { const e = extXY(s, .002); L.push([e, M4(0, 0, 0, i * Math.PI * 2 / 3)]); } return merge(L); }), wm('#c8302a', { rough: .8, side: 1 }), 0, 0, .026, 0, 0, 0, 1, false);
    },
    xbow(g, w, M, add) {
      add(cg('xb_stock', () => extXY(shapeOf([[-.11, .022], [.56, .032], [.565, -.004], [.2, -.018], [.13, -.024], [.085, -.03], [.04, -.03], [-.02, -.042], [-.1, -.075], [-.13, -.068], [-.125, -.01]]), .046, [.008, .007, 2])), wm(w.col, { rough: .6 }));
      add(cg('xb_rail', () => merge([[new T3.BoxGeometry(.4, .008, .024), M4(.36, .043, 0)], [new T3.BoxGeometry(.04, .03, .07), M4(.55, .015, 0)], [new T3.BoxGeometry(.035, .022, .056), M4(.27, .052, 0)]])), M.dsteel);
      add(cg('xb_prod', () => ttube([[.43, 0, -.31], [.477, 0, -.22], [.517, 0, -.11], [.533, 0, 0], [.517, 0, .11], [.477, 0, .22], [.43, 0, .31]], .016, t => 1.25 - .7 * Math.abs(t - .5) * 2, 40, 6, V3(0, 1, 0), [.6, 1.6])), metal('#8a8e98', .3), 0, .03, 0);
      add(cg('xb_str', () => { const L = [], n = V3(.27, .046, 0); for (const s of [-1, 1]) { const t = V3(.432, .03, s * .305), d = t.clone().sub(n), len = d.length(); const c = new T3.CylinderGeometry(.0022, .0022, len, 4); c.translate(0, len / 2, 0); L.push([c, new T3.Matrix4().compose(n, alignY(d), V3(1, 1, 1))]); } return merge(L); }), wm('#efe8d8', { rough: .5 }), 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('xb_bolt', () => merge([[cylX(.005, .005, .3, 6), M4(.27, .053, 0)], [spikeGeo(.009, .05, 4), M4(.57, .053, 0, 0, 0, -Math.PI / 2)]])), M.dsteel, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('xb_fl', () => merge([1, -1].map(s => [extXY(shapeOf([[.275, 0], [.33, 0], [.315, .014], [.28, .016]]), .002), M4(0, .053, 0, s * Math.PI / 2)]))), wm('#c8302a', { rough: .8, side: 1 }), 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('xb_stir', () => { const t = new T3.TorusGeometry(.055, .007, 5, 16, Math.PI); t.rotateZ(-Math.PI / 2); t.rotateX(Math.PI / 2); t.translate(.57, .01, 0); return t; }), M.dsteel);
      add(cg('xb_trig', () => { const t = ttube([[.12, -.02, 0], [.115, -.05, 0], [.1, -.07, 0]], .006, null, 8, 4); return merge([[t], [new T3.TorusGeometry(.03, .004, 4, 12, Math.PI), M4(.12, -.03, 0, 0, 0, Math.PI)]]); }), M.brass, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('xb_riv', () => merge([[.45, .02, .03], [.45, .02, -.03], [.34, .02, .03], [.34, .02, -.03], [-.05, -.01, .031], [-.05, -.01, -.031]].map(([x, y, z]) => [new T3.SphereGeometry(.006, 6, 4), M4(x, y, z)]))), M.brass, 0, 0, 0, 0, 0, 0, 1, false);
    },
    cannon(g, w, M, add) {
      const Y = .075;
      add(cg('cn_barrel', () => latheX([[0, -.075], [.022, -.073], [.03, -.06], [.022, -.046], [.018, -.04], [.06, -.035], [.088, -.022], [.1, 0], [.1, .2], [.094, .23], [.082, .47], [.088, .5], [.1, .545], [.1, .585], [.062, .585], [.056, .5], [.05, .3], [0, .3]], 22)), metal('#4a4c56', .36), 0, Y, 0);
      add(cg('cn_rings', () => merge([.04, .215, .52, .57].map((x, i) => [latheX([[.102 - (i > 1 ? .005 : 0), x - .012], [.108 - (i > 1 ? .005 : 0), x - .008], [.108 - (i > 1 ? .005 : 0), x + .008], [.102 - (i > 1 ? .005 : 0), x + .012]], 22)]))), M.brass, 0, Y, 0, 0, 0, 0, 1, false);
      add(cg('cn_ember', () => new T3.CircleGeometry(.05, 16)), wm(w.col, { em: 2.4 }), .31, Y, 0, 0, Math.PI / 2, 0, 1, false);
      add(cg('cn_stock', () => extXY(shapeOf([[-.07, .02], [.25, .02], [.25, -.008], [.07, -.014], [.06, -.05, .07, -.12], [-.02, -.13], [-.035, -.04, -.08, -.005]]), .05, [.008, .008, 2])), wm('#5a3a20', { rough: .6 }));
      add(cg('cn_fit', () => merge([[new T3.BoxGeometry(.06, .012, .062), M4(.2, .02, 0)], [new T3.BoxGeometry(.02, .02, .066), M4(.018, -.12, 0)]])), M.brass);
      add(cg('cn_fuse', () => merge([[cylX(.008, .008, .03, 6), M4(.035, Y + .095, 0, 0, 0, Math.PI / 2)], [new T3.SphereGeometry(.012, 8, 6), M4(.53, Y + .1, 0)]])), M.brass, 0, 0, 0, 0, 0, 0, 1, false);
      add(SPHL(), wm('#ffd27a', { em: 3 }), .035, Y + .13, 0, 0, 0, 0, .008, false);
      add(cg('cn_trig', () => new T3.TorusGeometry(.026, .004, 4, 12, Math.PI)), M.brass, .09, -.02, 0, 0, 0, Math.PI, 1, false);
    },
    staff(g, w, M, add) {
      const top = [.152, .86, 0], orb = [.18, 1.0, 0];
      add(cg('st_shaft', () => ttube([[-.085, -.31, 0], [-.04, -.05, .012], [.02, .25, -.012], [.09, .58, .012], [.152, .86, 0]], .03, t => .82 + .3 * t + .08 * Math.sin(t * 23), 40, 8)), wm('#5a3a22', { rough: .78 }));
      add(cg('st_knots', () => merge([[-.035, -.02, .02, .022], [.06, .42, -.018, .02], [.11, .7, .02, .018]].map(([x, y, z, s]) => [new T3.SphereGeometry(1, 8, 6), M4(x, y, z, 0, 0, 0, [s, s * 1.3, s])]))), wm('#4a2e1a', { rough: .8 }), 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('st_butt', () => { const g = latheX([[0, -.06], [.02, -.05], [.03, -.02], [.028, .02]], 8, true); g.rotateZ(Math.PI / 2 - .2); g.translate(-.085, -.32, 0); return g; }), M.dsteel);
      add(cg('st_wrap', () => wrapGeo(.2, .029, 5, .009)), M.leather, -.065, -.13, 0, 0, 0, Math.atan2(.98, .2), 1, false);
      add(cg('st_bands', () => merge([[ringX(.034, .007, Math.PI * 2, 5, 16), M4(.135, .78, 0, 0, 0, Math.atan2(.98, .2))], [ringX(.032, .006, Math.PI * 2, 5, 16), M4(.115, .7, 0, 0, 0, Math.atan2(.98, .2))]])), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('st_prong', () => merge([0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3 + .3, c = Math.cos(a), s = Math.sin(a); return [ttube([top, [orb[0] + c * .07, .93, s * .07], [orb[0] + c * .1, 1.01, s * .1], [orb[0] + c * .07, 1.09, s * .07], [orb[0] + c * .02, 1.12, s * .02]], .016, t => 1 - .75 * t, 16, 6)]; }))), wm('#5a3a22', { rough: .78 }));
      add(SPH(), wm(w.col, { em: 2.2 }), orb[0], orb[1], 0, 0, 0, 0, .078, false);
      add(SPH(), wm(lighten(w.col, .5), { op: .28, rough: .1, em: .6 }), orb[0], orb[1], 0, 0, 0, 0, .1, false);
      add(cg('st_rune', () => new T3.TorusGeometry(.135, .004, 4, 40)), M.gold, orb[0], orb[1] - .03, 0, Math.PI / 2 - .25, 0, 0, 1, false);
      add(cg('st_shard', () => merge([[0, .14], [2.1, .12], [4.2, .13]].map(([a, h]) => [new T3.OctahedronGeometry(1), M4(orb[0] + Math.cos(a) * .135, orb[1] - .03 + Math.sin(a) * .02, Math.sin(a) * .135, 0, 0, 0, [.012, .022, .012])]))), wm(w.col, { em: 1.6, flat: true }), 0, 0, 0, 0, 0, 0, 1, false);
    },
    wand(g, w, M, add) {
      add(cg('wa_shaft', () => latheX([[0, -.045], [.012, -.044], [.02, -.034], [.018, -.022], [.014, -.016], [.018, -.008], [.019, .1], [.016, .112], [.0115, .34], [.0135, .352], [.012, .362]], 12)), wm('#4a2040', { rough: .5 }));
      add(cg('wa_pom', () => new T3.SphereGeometry(.02, 10, 8)), M.gold, -.05, 0, 0, 0, 0, 0, 1, false);
      add(cg('wa_coll', () => merge([[ringX(.02, .005, Math.PI * 2, 4, 14), M4(.105)], [ringX(.019, .004, Math.PI * 2, 4, 14), M4(.12)], [ringX(.019, .004, Math.PI * 2, 4, 14), M4(-.012)]])), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('wa_fil', () => { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, x = .125 + t * .225, r = .017 - t * .005, a = t * Math.PI * 8; pts.push([x, Math.cos(a) * r, Math.sin(a) * r]); } return ttube(pts, .0032, null, 64, 4); }), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('wa_claw', () => merge([[latheX([[.012, .355], [.02, .368], [.016, .378]], 10)], ...[0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3, c = Math.cos(a), s = Math.sin(a); return [ttube([[.37, c * .016, s * .016], [.405, c * .03, s * .03], [.44, c * .022, s * .022], [.455, c * .008, s * .008]], .0045, t => 1 - .6 * t, 10, 4)]; })])), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(OCT(), wm(w.col, { em: 2.6, flat: true }), .425, 0, 0, 0, 0, -Math.PI / 2, [.03, .055, .03], false);
      add(SPH(), wm(lighten(w.col, .4), { op: .25, em: .8 }), .425, 0, 0, 0, 0, 0, .05, false);
    },
    tome(g, w, M, add) {
      const cover = wm('#6a1c22', { rough: .65 });
      add(cg('to_pages', () => new T3.BoxGeometry(.262, .062, .31)), M.cream, .135);
      add(cg('to_lines', () => merge([-.02, -.008, .004, .016].map(y => [new T3.BoxGeometry(.004, .003, .3), M4(.267, y, 0)]).concat([-.02, -.008, .004, .016].map(y => [new T3.BoxGeometry(.25, .003, .004), M4(.135, y, .156)])))), wm('#c8b890', { rough: .9 }), 0, 0, 0, 0, 0, 0, 1, false);
      const cv = cg('to_cover', () => { const s = new T3.Shape(), W = .29, H = .345, r = .018, x0 = -.01, z0 = -H / 2; s.moveTo(x0, z0); s.lineTo(x0 + W - r, z0); s.quadraticCurveTo(x0 + W, z0, x0 + W, z0 + r); s.lineTo(x0 + W, z0 + H - r); s.quadraticCurveTo(x0 + W, z0 + H, x0 + W - r, z0 + H); s.lineTo(x0, z0 + H); s.closePath(); return extXZ(s, .006, [.004, .004, 1], 4); });
      add(cv, cover, 0, .038); add(cv, cover, 0, -.038);
      add(cg('to_spine', () => { const g = new T3.CylinderGeometry(.045, .045, .345, 12, 1, false, Math.PI, Math.PI); g.rotateX(Math.PI / 2); g.scale(.45, 1, 1); g.translate(-.008, 0, 0); return g; }), cover);
      add(cg('to_sbands', () => merge([-.12, -.04, .04, .12].map(z => { const g = new T3.CylinderGeometry(.047, .047, .012, 12, 1, true, Math.PI, Math.PI); g.rotateX(Math.PI / 2); g.scale(.45, 1, 1); return [g, M4(-.008, 0, z)]; }))), wm('#d8ac48', { metal: .88, rough: .28, side: 1 }), 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('to_corn', () => { const s = shapeOf([[0, 0], [.05, 0], [.05, .012], [.012, .05], [0, .05]]), e = extXZ(s, .004, [.003, .003, 1], 2); const L = []; for (const y of [.043, -.043]) for (const [x, z, ry] of [[.282, -.174, -Math.PI / 2], [.282, .174, Math.PI]]) L.push([e, M4(x, y, z, 0, ry, 0)]); return merge(L); }), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('to_emb', () => merge([[new T3.TorusGeometry(.05, .006, 5, 28), M4(.15, .045, 0, Math.PI / 2)], ...[0, 1, 2, 3].map(i => [new T3.BoxGeometry(.05, .004, .007), M4(.15 + Math.cos(i * Math.PI / 2 + Math.PI / 4) * .063, .045, Math.sin(i * Math.PI / 2 + Math.PI / 4) * .063, 0, -(i * Math.PI / 2 + Math.PI / 4), 0)])])), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(OCT(), wm(w.col, { em: 2.3, flat: true }), .15, .05, 0, 0, Math.PI / 4, 0, [.03, .016, .03], false);
      add(cg('to_clasp', () => merge([[new T3.BoxGeometry(.05, .092, .045), M4(.27, 0, 0)]])), M.leather);
      add(cg('to_buck', () => new T3.BoxGeometry(.022, .01, .05)), M.gold, .272, .045, 0, 0, 0, 0, 1, false);
      add(cg('to_ribbon', () => ttube([[.12, -.03, .155], [.12, -.04, .19], [.13, -.07, .215]], .007, null, 8, 4, V3(1, 0, 0), [.4, 1.6])), M.cloth, 0, 0, 0, 0, 0, 0, 1, false);
      add(OCT(), wm(w.col, { em: 1.4, op: .7 }), .13, .19, .06, 0, 0, 0, .022, false);
    },
    chakram(g, w, M, add) {
      const C = .18;
      add(cg('ch_ring', () => { const s = new T3.Shape(), N = 8, R0 = .182; for (let k = 0; k < N; k++) { const a = k * Math.PI * 2 / N, st = Math.PI * 2 / N, P = (r, b) => [C + Math.cos(b) * r, Math.sin(b) * r]; const p0 = P(R0, a), p1 = P(.2, a + st * .5), p2 = P(.232, a + st * .82), p3 = P(R0, a + st * .78); if (k === 0) s.moveTo(...p0); else s.lineTo(...p0); s.quadraticCurveTo(...P(.198, a + st * .2), ...p1); s.lineTo(...p2); s.lineTo(...p3); } s.closePath(); const h = new T3.Path(); h.absarc(C, 0, .13, 0, Math.PI * 2, true); s.holes.push(h); return extXZ(s, .006, [.008, .012, 1], 6); }), metal(w.col, .2, { em: .12, emc: w.col }));
      add(cg('ch_inlay', () => new T3.TorusGeometry(.155, .006, 5, 48)), M.gold, C, 0, 0, Math.PI / 2, 0, 0, [1, 1, 2.2], false);
      add(cg('ch_inner', () => new T3.TorusGeometry(.132, .009, 6, 48)), M.dsteel, C, 0, 0, Math.PI / 2, 0, 0, [1, 1, 1.6], false);
      add(cg('ch_gems', () => merge([0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return [new T3.OctahedronGeometry(1), M4(C + Math.cos(a) * .156, 0, Math.sin(a) * .156, 0, a, 0, [.016, .014, .016])]; }))), wm(w.col, { em: 2.2, flat: true }), 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('ch_grip', () => { const t = new T3.TorusGeometry(.15, .022, 8, 14, 1.1); t.rotateZ(Math.PI - .55); t.rotateX(Math.PI / 2); t.translate(C, 0, 0); return t; }), M.leather);
      add(cg('ch_gwrap', () => merge([-.4, -.2, 0, .2, .4].map(d => { const a = Math.PI + d; return [new T3.TorusGeometry(.024, .005, 4, 10), M4(C + Math.cos(a) * .15, 0, Math.sin(a) * .15, 0, -a, 0)]; }))), M.leatherL, 0, 0, 0, 0, 0, 0, 1, false);
    },
    rapier(g, w, M, add) {
      add(cg('ra_blade', () => loft([[.15, secHex(.009, .006)], [.2, secHex(.009, .006)], [.215, secD6(.013, .006)], [.6, secD6(.01, .005)], [.84, secD6(.007, .004)], [.905, secD6(0, 0)]])), metal(w.col, .16));
      add(cg('ra_cup', () => latheX([[.004, .112], [.03, .118], [.048, .132], [.054, .148], [.052, .152]], 18)), wm('#d8ac48', { metal: .88, rough: .28, side: 1 }));
      add(cg('ra_hilt', () => merge([
        [cylX(.0065, .0065, .24, 6), M4(.112, 0, -.12, 0, -Math.PI / 2, 0)], [new T3.SphereGeometry(.012, 8, 6), M4(.112, 0, .12)], [new T3.SphereGeometry(.012, 8, 6), M4(.112, 0, -.12)],
        [ttube([[.112, 0, .015], [.11, 0, .06], [.07, 0, .088], [.0, 0, .085], [-.045, 0, .05], [-.058, 0, .012]], .0062, null, 24, 5)],
        [ttube([[.112, 0, -.012], [.13, .03, -.03], [.15, .045, 0], [.13, .03, .03], [.112, 0, .012]], .0045, null, 16, 4)], [ttube([[.112, 0, -.012], [.13, -.03, -.03], [.15, -.045, 0], [.13, -.03, .03], [.112, 0, .012]], .0045, null, 16, 4)],
        [ttube([[.112, 0, .02], [.07, .022, .05], [.03, .0, .06]], .0045, null, 12, 4)],
      ])), M.gold);
      add(cg('ra_core', () => cylX(.017, .015, .15, 10)), M.black, -.04);
      add(cg('ra_wire', () => wrapGeo(.148, .0165, 9, .0035, true)), M.gold, -.039, 0, 0, 0, 0, 0, 1, false);
      add(cg('ra_pom', () => latheX([[0, -.092], [.012, -.09], [.024, -.078], [.026, -.066], [.02, -.052], [.012, -.044], [.015, -.04]], 14)), M.gold);
    },
    glaive(g, w, M, add) {
      add(cg('gl_shaft', () => ttube([[-.08, 0, 0], [.5, 0, 0], [.97, 0, 0]], .025, t => 1.05 - .12 * t, 12, 8)), wm('#4a3a5a', { rough: .65 }));
      add(cg('gl_butt', () => latheX([[0, -.15], [.012, -.14], [.024, -.105], [.028, -.09], [.026, -.075]], 8, true)), M.dsteel);
      add(cg('gl_wrap', () => wrapGeo(.26, .026, 7, .0085)), wm('#2a2034', { rough: .8 }), -.06, 0, 0, 0, 0, 0, 1, false);
      add(cg('gl_bands', () => merge([.45, .49, .8].map(x => [ringX(.026, .0055, Math.PI * 2, 4, 16), M4(x)]))), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('gl_sock', () => latheX([[.022, .95], [.028, .96], [.028, .98], [.024, .99], [.03, 1.05], [.034, 1.06], [.024, 1.07]], 10, true)), M.dsteel);
      const inr = [[1.25, .085, 1.38, .085], [1.47, .07, 1.5, -.075]];
      add(cg('gl_blade', () => extXZ(shapeOf([[1.05, -.03], [1.125, -.03], [1.13, -.095], [1.15, -.1], [1.16, -.032], [1.32, -.035, 1.5, -.075], [inr[1][0], inr[1][1], inr[0][2], inr[0][3]], [inr[0][0], inr[0][1], 1.05, .04]]), .016, [.008, .006, 1], 14)), wm(shade3(w.col, .6), { metal: .75, rough: .5, em: .14, emc: w.col }));
      add(cg('gl_edge', () => extXZ(shapeOf([[1.05, .04], [1.25, .118, 1.38, .114], [1.505, .094, 1.525, -.082], [1.5, -.075], inr[1], inr[0]]), .005, [.005, .003, 1], 14)), metal(lighten(w.col, .45), .12, { env: 1.1, em: .3, emc: w.col }));
      add(cg('gl_rune', () => merge([[new T3.BoxGeometry(.13, .004, .006), M4(1.27, 0, .025, 0, 0, 0)]])), wm(w.col, { em: 2.4 }), 0, .017, 0, 0, 0, 0, [1, 1, 1], false);
      add(cg('gl_rune2', () => new T3.BoxGeometry(.13, .004, .006)), wm(w.col, { em: 2.4 }), 1.27, -.017, .025, 0, 0, 0, 1, false);
      add(cg('gl_riv', () => domes([[1.075, .018, .0], [1.11, .018, .03], [1.075, -.018, .0], [1.11, -.018, .03]], .007)), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
    },
    shuriken(g, w, M, add) {
      const C = .15;
      add(cg('sh_star', () => { const s = new T3.Shape(), P = (r, a) => [C + Math.cos(a) * r, Math.sin(a) * r]; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; const tip = P(.165, a), mid = P(.085, a + Math.PI / 4); if (k === 0) s.moveTo(...tip); s.quadraticCurveTo(...P(.045, a + Math.PI / 8), ...mid); s.quadraticCurveTo(...P(.045, a + Math.PI * 3 / 8), ...P(.165, a + Math.PI / 2)); } s.closePath(); const h = new T3.Path(); h.absarc(C, 0, .022, 0, Math.PI * 2, true); s.holes.push(h); return extXZ(s, .003, [.007, .014, 1], 8); }), metal(w.col, .22));
      add(cg('sh_ring', () => new T3.TorusGeometry(.03, .007, 6, 24)), M.iron, C, 0, 0, Math.PI / 2, 0, 0, [1, 1, 1.6], false);
      add(cg('sh_cord', () => new T3.TorusGeometry(.04, .005, 4, 24)), M.cloth, C, 0, 0, Math.PI / 2, 0, 0, [1, 1, 1.8], false);
      add(cg('sh_riv', () => domes([0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return [C + Math.cos(a) * .052, .009, Math.sin(a) * .052]; }).concat([0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return [C + Math.cos(a) * .052, -.009, Math.sin(a) * .052]; })), .006)), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
    },
    scepter(g, w, M, add) {
      add(cg('sc2_shaft', () => latheX([[0, -.095], [.014, -.093], [.024, -.082], [.028, -.07], [.022, -.058], [.014, -.052], [.018, -.045], [.018, .17], [.026, .18], [.03, .195], [.026, .21], [.015, .22], [.015, .4], [.022, .43], [.03, .47], [.036, .495], [.03, .505]], 14)), M.gold);
      add(cg('sc2_grip', () => cylX(.022, .022, .2, 12)), wm('#4a1a5a', { rough: .85 }), -.035);
      add(cg('sc2_wire', () => wrapGeo(.2, .022, 6, .0035, true)), M.gold, -.035, 0, 0, 0, 0, 0, 1, false);
      add(cg('sc2_fl', () => { const s = shapeOf([[.49, .02], [.55, .03, .6, .072], [.665, .06, .705, .02], [.68, .03], [.63, .052, .6, .052], [.545, .04, .505, .015]]), e = extXY(s, .007, [.003, .003, 1], 8); return merge([0, 1, 2, 3, 4, 5].map(i => [e, M4(0, 0, 0, i * Math.PI / 3)])); }), M.gold);
      add(cg('sc2_crown', () => merge([[ringX(.04, .007, Math.PI * 2, 5, 20), M4(.5)], [ringX(.024, .005, Math.PI * 2, 5, 16), M4(.7)]])), M.gold, 0, 0, 0, 0, 0, 0, 1, false);
      add(cg('sc2_fin', () => merge([[spikeGeo(.014, .07, 6), M4(.7, 0, 0, 0, 0, -Math.PI / 2)], [new T3.SphereGeometry(.014, 10, 8), M4(.712, 0, 0)]])), M.gold);
      add(OCT(), wm(w.col, { em: 2.2, flat: true }), .6, 0, 0, 0, 0, -Math.PI / 2, [.04, .065, .04], false);
      add(SPH(), wm(lighten(w.col, .4), { op: .22, em: .8 }), .6, 0, 0, 0, 0, 0, .07, false);
      add(cg('sc2_halo', () => ringX(.095, .0035, Math.PI * 2, 4, 40)), M.gold, .6, 0, 0, 0, 0, 0, 1, false);
    },
  };

  makeWeapon = function (t) {
    const w = WT[t], build = B[t];
    if (!w || !build) return _mwV3(t);
    try {
      const g = new T3.Group(), M = MAT();
      const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, sh = true, parent = g) => {
        const o = new T3.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
        if (Array.isArray(s)) o.scale.set(s[0], s[1], s[2]); else o.scale.setScalar(s);
        if (sh) o.castShadow = true; parent.add(o); return o;
      };
      build(g, w, M, add);
      return g;
    } catch (e) { console.warn('weapon v3', t, e); return _mwV3(t); }
  };

  // ---------- makeWeaponFull: same contract as 6g_weapons.js, tip table updated for the new models ----------
  const TIP = { sword: .8, katana: .95, dagger: .41, axe: .82, hammer: .95, spear: 1.42, scythe: 1.05, flail: .72, fists: .14, bow: .4, xbow: .58, cannon: .6, staff: 0, wand: .45, tome: .13, chakram: .18, rapier: .9, glaive: 1.3, shuriken: .15, scepter: .66 };
  const TIPPOS = { staff: [.18, 1.0, 0], cannon: [.6, .075, 0], flail: [.72, -.1, 0] };
  const GEM = { sword: [-.092, 0, 0], katana: [-.062, 0, 0], dagger: [-.055, 0, 0], axe: [-.1, 0, 0], hammer: [-.11, 0, 0], spear: [1.07, 0, 0], scythe: [1.01, 0, .0], flail: [-.085, 0, 0], fists: [-.03, 0, .08], bow: [.06, 0, .03], xbow: [.27, .065, 0], cannon: [.0, .02, .03], staff: [.135, .78, 0], wand: [-.05, 0, 0], tome: [.27, 0, .026], chakram: [.03, 0, 0], rapier: [-.08, 0, 0], glaive: [1.08, 0, 0], shuriken: [.15, 0, 0], scepter: [-.083, 0, 0] };
  makeWeaponFull = function (it) {
    const g = makeWeapon(it.t), r = it.r, inf = it.inf && INFUSE[it.inf], mastered = it.mast !== undefined ? !!it.mast : wmLvl(it.t) >= W_GLOW;
    const tip = TIP[it.t] ?? .5, tp = TIPPOS[it.t] || [tip, 0, 0], gp = GEM[it.t] || [-.02, 0, 0];
    const rc = RAR[r].c;
    if (r >= 2) { mk(GEO.oct, mat(rc, { em: 1.6 + r * .3, flat: true }), .03, .04, .03, gp[0], gp[1], gp[2], g, false); }
    if (r >= 3) g.traverse(o => { if (o.isMesh && o.material && o.material.metalness > .5 && o.material.emissive && o.material.emissive.getHex() === 0 && o.material.color.getHSL({}).l > .2) { o.material = o.material.clone(); o.material.emissive = new T3.Color(rc); o.material.emissiveIntensity = Math.min(.2, .04 + .02 * (r - 3)); } });
    if (r >= 4 || inf || mastered) { const col = inf ? inf.col : mastered ? '#ffd27a' : rc; const glow = mk(GEO.sph, basic(col, { op: .35, add: 1 }), .09, .09, .09, tp[0], tp[1], tp[2], g, false); glow.userData.wglow = 1;
      if (it.t !== 'staff') { const line = mk(GEO.box, basic(col, { op: .3, add: 1 }), Math.max(.1, tip * .85), .012, .012, tip * .5, .03, 0, g, false); line.userData.wglow = 1; } }
    g.userData.fx = { col: inf ? inf.col : (r >= 4 || mastered) ? (mastered ? '#ffd27a' : rc) : null, tip };
    return g;
  };
}
