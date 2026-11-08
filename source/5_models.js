// ================= 3D MODELS: shared geometry/materials and model builders =================
const T3 = THREE;
const U = 1 / TILE; // px -> world units (1 tile = 1 unit)
const GEO = {};
function initGeo() {
  GEO.box = new T3.BoxGeometry(1, 1, 1);
  GEO.sph = new T3.SphereGeometry(1, 18, 12);
  GEO.sphL = new T3.SphereGeometry(1, 8, 6);
  GEO.cyl = new T3.CylinderGeometry(1, 1, 1, 14);
  GEO.cylL = new T3.CylinderGeometry(1, 1, 1, 7);
  GEO.cone = new T3.ConeGeometry(1, 1, 12);
  GEO.coneL = new T3.ConeGeometry(1, 1, 6);
  GEO.hemi = new T3.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  GEO.tor = new T3.TorusGeometry(1, .12, 8, 28);
  GEO.torThin = new T3.TorusGeometry(1, .05, 6, 40);
  GEO.halfTor = new T3.TorusGeometry(1, .1, 6, 16, Math.PI);
  GEO.oct = new T3.OctahedronGeometry(1);
  GEO.ico = new T3.IcosahedronGeometry(1, 0);
  GEO.dod = new T3.DodecahedronGeometry(1, 0);
  GEO.ring = new T3.RingGeometry(.9, 1, 48); GEO.ring.rotateX(-Math.PI / 2);
  GEO.circ = new T3.CircleGeometry(1, 40); GEO.circ.rotateX(-Math.PI / 2);
  GEO.rect = new T3.PlaneGeometry(1, 1); GEO.rect.rotateX(-Math.PI / 2); GEO.rect.translate(.5, 0, 0);
  GEO.plane = new T3.PlaneGeometry(1, 1); GEO.plane.rotateX(-Math.PI / 2);
  GEO.caps = new T3.CapsuleGeometry(.5, 1, 4, 10);
  GEO.cylT = new T3.CylinderGeometry(1, .8, 1, 16);
  // wall box with darker bottom (fake ambient occlusion)
  const wb = new T3.BoxGeometry(1, 1, 1); wb.translate(0, .5, 0);
  const pos = wb.attributes.position, cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const v = y > .5 ? 1 : .45; cols[i * 3] = cols[i * 3 + 1] = cols[i * 3 + 2] = v; }
  wb.setAttribute('color', new T3.BufferAttribute(cols, 3)); GEO.wall = wb;
}
const MATC = {};
function mat(hex, o = {}) {
  const k = hex + '|' + (o.rough ?? '') + '|' + (o.metal ?? '') + '|' + (o.em ?? '') + '|' + (o.op ?? '') + '|' + (o.flat ? 'f' : '') + '|' + (o.emc || '');
  if (MATC[k]) return MATC[k];
  const m = new T3.MeshStandardMaterial({ color: hex, roughness: o.rough ?? .72, metalness: o.metal ?? .05, flatShading: !!o.flat });
  if (o.em) { m.emissive = new T3.Color(o.emc || hex); m.emissiveIntensity = o.em; }
  if (o.op !== undefined) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
  return MATC[k] = m;
}
function basic(hex, o = {}) {
  const k = 'B' + hex + (o.op ?? 1) + (o.add ? 'a' : '') + (o.nd ? 'n' : '');
  if (MATC[k] && !o.unique) return MATC[k];
  const m = new T3.MeshBasicMaterial({ color: hex, transparent: true, opacity: o.op ?? 1, depthWrite: false, blending: o.add ? T3.AdditiveBlending : T3.NormalBlending, side: T3.DoubleSide, fog: !o.nofog });
  if (o.nd) m.depthTest = false;
  if (o.unique) return m;
  return MATC[k] = m;
}
function mk(geo, m, sx, sy, sz, x = 0, y = 0, z = 0, parent, shadow = true) {
  const o = new T3.Mesh(geo, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z);
  if (shadow) { o.castShadow = true; o.receiveShadow = true; }
  if (parent) parent.add(o); return o;
}
function eyes(g, x, y, sep, r, col = '#ffffff', pup = '#111111', glow) {
  const em = glow ? mat(col, { em: 2.2 }) : mat(col, { rough: .2 });
  for (const s of [-1, 1]) {
    mk(GEO.sphL, em, r, r, r, x, y, s * sep, g, false);
    if (!glow) mk(GEO.sphL, mat(pup, { rough: .2 }), r * .55, r * .55, r * .55, x + r * .65, y, s * sep, g, false);
  }
}
function shade3(hex, f) { const c = new T3.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }

// ---------- humanoid (player / NPC) ----------
function makeHumanoid(o) {
  const g = new T3.Group(), root = new T3.Group(); g.add(root);
  const body = mat(o.body, { rough: .6 }).clone(), dark = mat(shade3(o.body, .55)), trim = mat(shade3(o.body, 1.35), { rough: .5 });
  const skin = mat(o.skin || '#f0c8a0', { rough: .55 }), boot = mat('#3a2a1e', { rough: .8 }), leather = mat('#5a3a22', { rough: .7 }), gold = mat('#d8b040', { metal: .85, rough: .3 });
  // legs with knee-high boots
  const legL = new T3.Group(), legR = new T3.Group(); legL.position.set(0, .44, .1); legR.position.set(0, .44, -.1); root.add(legL, legR);
  for (const l of [legL, legR]) { mk(GEO.caps, dark, .15, .3, .15, 0, -.16, 0, l); mk(GEO.cylT, boot, .085, .2, .085, 0, -.33, 0, l); mk(GEO.box, boot, .2, .07, .14, .04, -.42, 0, l); }
  // torso: tapered tunic, belt with buckle and pouch, collar
  const torso = mk(GEO.cylT, body, .23, .44, .2, 0, .7, 0, root); torso.rotation.x = Math.PI;
  mk(GEO.cylT, body, .2, .2, .2, 0, .44, 0, root);
  mk(GEO.box, trim, .02, .36, .1, .2, .7, 0, root, false);
  mk(GEO.cyl, leather, .215, .06, .215, 0, .52, 0, root); mk(GEO.box, gold, .03, .06, .07, .215, .52, 0, root, false);
  mk(GEO.box, leather, .08, .1, .1, .12, .46, .17, root);
  mk(GEO.tor, trim, .16, .16, .16, 0, .93, 0, root).rotation.x = Math.PI / 2;
  // head: neck, face, nose, brows, eyes
  mk(GEO.cyl, skin, .06, .08, .06, 0, .98, 0, root);
  mk(GEO.sph, skin, .155, .165, .15, 0, 1.12, 0, root);
  mk(GEO.sphL, skin, .025, .03, .025, .16, 1.1, 0, root, false);
  for (const z of [.055, -.055]) { mk(GEO.sphL, mat('#ffffff', { rough: .2 }), .028, .03, .028, .135, 1.145, z, root, false); mk(GEO.sphL, mat('#1a1a1a'), .016, .02, .016, .155, 1.145, z, root, false); mk(GEO.box, mat(o.hair || '#4a3020'), .02, .012, .045, .14, 1.185, z, root, false); }
  const hc = mat(o.hat || shade3(o.body, .8));
  if (o.hatType === 'helm') { const m = mat('#a8a8b8', { metal: .85, rough: .3 }); mk(GEO.hemi, m, .18, .19, .18, 0, 1.13, 0, root); mk(GEO.box, mat('#c83a2a'), .24, .1, .03, -.02, 1.31, 0, root); mk(GEO.box, m, .035, .12, .19, .165, 1.11, 0, root); for (const z of [.15, -.15]) mk(GEO.coneL, m, .03, .08, .03, 0, 1.25, z, root, false); }
  else if (o.hatType === 'hood') { mk(GEO.hemi, hc, .2, .21, .2, -.01, 1.12, 0, root); mk(GEO.cylT, hc, .2, .14, .2, -.02, 1.04, 0, root); const c = mk(GEO.cone, hc, .1, .24, .1, -.18, 1.22, 0, root); c.rotation.z = 1.2; }
  else if (o.hatType === 'wizard') { mk(GEO.cyl, hc, .28, .03, .28, 0, 1.24, 0, root); const c = mk(GEO.cone, hc, .17, .5, .17, -.05, 1.49, 0, root); c.rotation.z = .25; mk(GEO.tor, gold, .17, .17, .1, 0, 1.27, 0, root).rotation.x = Math.PI / 2; mk(GEO.oct, mat('#ffe080', { em: 2 }), .045, .045, .045, .08, 1.38, 0, root, false); mk(GEO.box, mat('#e8e8e8'), .1, .14, .14, .1, .98, 0, root); }
  else if (o.hatType === 'hair') { mk(GEO.hemi, mat(o.hair || '#6a4a2a'), .17, .15, .17, -.015, 1.15, 0, root); mk(GEO.box, mat(o.hair || '#6a4a2a'), .08, .12, .26, -.12, 1.08, 0, root); }
  // shoulder pads
  for (const z of [.25, -.25]) { mk(GEO.hemi, trim, .11, .08, .11, 0, .9, z, root); }
  // cape in two hanging panels
  let cape = null;
  if (o.cape) { cape = new T3.Group(); cape.position.set(-.17, .92, 0); root.add(cape); const cm = mat(o.cape, { rough: .8 }); mk(GEO.box, cm, .03, .36, .38, -.02, -.18, 0, cape); const low = new T3.Group(); low.position.set(-.02, -.36, 0); cape.add(low); mk(GEO.box, cm, .03, .3, .36, 0, -.15, 0, low); mk(GEO.box, mat(shade3(o.cape, 1.4)), .035, .03, .37, 0, -.3, 0, low, false); cape.userData.low = low; }
  const arm = (z) => { const a = new T3.Group(); a.rotation.order = 'YZX'; a.position.set(0, .88, z); root.add(a); mk(GEO.caps, body, .1, .2, .1, 0, -.15, 0, a); mk(GEO.cylT, leather, .055, .1, .055, 0, -.3, 0, a); mk(GEO.sphL, skin, .055, .055, .055, 0, -.37, 0, a); const h = new T3.Group(); h.position.set(0, -.38, 0); h.rotation.z = -Math.PI / 2; a.add(h); return { a, h }; };
  const R = arm(-.27), L = arm(.27);
  mk(GEO.circ, basic('#000000', { op: .32 }), .3, 1, .3, 0, .012, 0, g, false);
  return { g, root, legL, legR, armR: R.a, hand: R.h, armL: L.a, torso, body, cape };
}
// ---------- weapons (point along +X of the hand) ----------
function makeWeapon(t) {
  const g = new T3.Group(), w = WT[t];
  const metal = mat(w.col, { metal: .75, rough: .28 }), wood = mat('#6a4a2a'), grip = mat('#3a2418'), gold = mat('#d8b040', { metal: .9, rough: .25 });
  const X = (geo, m, l, r, x) => { const o = mk(geo, m, r, l, r, x, 0, 0, g); o.rotation.z = -Math.PI / 2; return o; };
  switch (t) {
    case 'sword': X(GEO.cyl, grip, .14, .03, .02); mk(GEO.box, gold, .04, .04, .24, .1, 0, 0, g); mk(GEO.box, metal, .62, .03, .08, .43, 0, 0, g); mk(GEO.box, metal, .08, .03, .05, .76, 0, 0, g); break;
    case 'katana': X(GEO.cyl, mat('#202030'), .2, .028, .05); X(GEO.cyl, gold, .02, .07, .16); mk(GEO.box, mat(w.col, { metal: .9, rough: .15, em: .25 }), .78, .02, .055, .56, 0, 0, g); break;
    case 'dagger': X(GEO.cyl, grip, .1, .025, .02); mk(GEO.box, gold, .03, .03, .14, .07, 0, 0, g); const b = mk(GEO.cone, metal, .05, .3, .015, .24, 0, 0, g); b.rotation.z = -Math.PI / 2; break;
    case 'axe': X(GEO.cyl, wood, .95, .03, .4); mk(GEO.box, metal, .12, .05, .34, .78, 0, .12, g); mk(GEO.cyl, metal, .16, .05, .16, .78, 0, .26, g).rotation.x = Math.PI / 2; break;
    case 'hammer': X(GEO.cyl, wood, .85, .03, .36); mk(GEO.box, metal, .22, .22, .38, .82, 0, 0, g); mk(GEO.box, gold, .24, .05, .4, .82, 0, 0, g); break;
    case 'spear': X(GEO.cyl, wood, 1.35, .025, .5); X(GEO.cone, metal, .26, .05, 1.28); mk(GEO.tor, mat('#c83a2a'), .04, .04, .04, 1.12, 0, 0, g).rotation.y = Math.PI / 2; break;
    case 'scythe': X(GEO.cyl, mat('#2a2030'), 1.15, .025, .45); { const bl = mk(GEO.halfTor, mat(w.col, { metal: .8, rough: .2, em: .2 }), .32, .32, .5, .95, 0, .3, g); bl.rotation.x = Math.PI / 2; } break;
    case 'flail': X(GEO.cyl, wood, .38, .03, .15); for (let i = 0; i < 4; i++) mk(GEO.tor, metal, .035, .035, .035, .38 + i * .07, -.02 * i, 0, g, false); mk(GEO.sph, metal, .12, .12, .12, .72, -.1, 0, g); for (let i = 0; i < 6; i++) { const c = mk(GEO.coneL, metal, .03, .1, .03, .72 + Math.cos(i) * .12, -.1 + Math.sin(i) * .12, (i % 2 - .5) * .1, g, false); c.rotation.z = i; } break;
    case 'fists': mk(GEO.sph, mat(w.col, { metal: .4 }), .09, .08, .1, .06, 0, 0, g); break;
    case 'bow': { const a = mk(GEO.halfTor, wood, .45, .45, .45, .1, 0, 0, g); a.rotation.z = -Math.PI / 2; a.scale.z = .3; mk(GEO.box, mat('#eeeeee'), .005, .9, .005, .1, 0, 0, g, false); break; }
    case 'xbow': mk(GEO.box, wood, .55, .06, .08, .25, 0, 0, g); { const a = mk(GEO.halfTor, metal, .3, .3, .3, .48, 0, 0, g); a.rotation.x = Math.PI / 2; a.rotation.z = Math.PI / 2; } mk(GEO.box, mat('#aaa'), .4, .02, .02, .3, .04, 0, g); break;
    case 'cannon': X(GEO.cyl, mat('#3a3a40', { metal: .8, rough: .35 }), .55, .09, .3); X(GEO.tor, gold, .1, .1, .56); mk(GEO.box, wood, .18, .2, .08, .05, -.1, 0, g); break;
    case 'staff': { const s = mk(GEO.cyl, wood, .03, 1.3, .03, .05, .35, 0, g); s.rotation.z = -.2; mk(GEO.sph, mat(w.col, { em: 2.2 }), .1, .1, .1, .18, 1.0, 0, g, false); mk(GEO.torThin, gold, .14, .14, .14, .18, .96, 0, g, false); break; }
    case 'wand': X(GEO.cyl, mat('#5a2a4a'), .38, .02, .19); mk(GEO.oct, mat(w.col, { em: 2.5 }), .05, .05, .05, .42, 0, 0, g, false); break;
    case 'tome': mk(GEO.box, mat('#8a2a2a'), .26, .07, .32, .12, 0, 0, g); mk(GEO.box, mat('#f0e0b0'), .24, .075, .28, .13, 0, 0, g); mk(GEO.oct, mat(w.col, { em: 2 }), .05, .05, .05, .13, .12, 0, g, false); break;
    case 'chakram': { const c = mk(GEO.tor, mat(w.col, { metal: .8, rough: .2, em: .4 }), .18, .18, .18, .18, 0, 0, g); c.rotation.x = Math.PI / 2; break; }
  }
  return g;
}


// ---------- shared custom geometry for creatures (built once, cached in GEO) ----------
function gx(k, f) { return GEO[k] || (GEO[k] = f()); }
// double-sided copy of a cached material (wing membranes, leaves, capes)
function matD(hex, o = {}) { const k = 'D' + hex + JSON.stringify(o); if (MATC[k]) return MATC[k]; const m = mat(hex, o).clone(); m.side = T3.DoubleSide; return MATC[k] = m; }
// bend a geometry spanning y 0..1 along an arc toward +X
function bendGeo(geo, b) {
  const p = geo.attributes.position, R = 1 / b;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), th = y * b; p.setXYZ(i, R * (1 - Math.cos(th)) + x * Math.cos(th), R * Math.sin(th) - x * Math.sin(th), p.getZ(i)); }
  geo.computeVertexNormals(); return geo;
}
// tapered, curved tube: base radius rb at the origin, tip radius rt at length 1, curling toward local +X
function bentG(b, rt, rb, seg = 8) { return gx('bt' + b + '_' + rt + '_' + rb + '_' + seg, () => { const g = new T3.CylinderGeometry(rt, rb, 1, seg, 6); g.translate(0, .5, 0); return b ? bendGeo(g, b) : g; }); }
function latheG(k, pts, seg = 18) { return gx(k, () => new T3.LatheGeometry(pts.map(([x, y]) => new T3.Vector2(x, y)), seg)); }
// point a bent piece: local +Y along dir, local +X (the curl) toward bend
const _oX = new T3.Vector3(), _oY = new T3.Vector3(), _oZ = new T3.Vector3(), _oM = new T3.Matrix4();
function orient(o, dir, bend) {
  _oY.set(dir[0], dir[1], dir[2]).normalize(); _oX.set(bend[0], bend[1], bend[2]);
  _oZ.crossVectors(_oX, _oY).normalize(); _oX.crossVectors(_oY, _oZ).normalize();
  o.quaternion.setFromRotationMatrix(_oM.makeBasis(_oX, _oY, _oZ)); return o;
}
function orientY(o, dir) { _oY.set(dir[0], dir[1], dir[2]).normalize(); o.quaternion.setFromUnitVectors(new T3.Vector3(0, 1, 0), _oY); return o; }
// mesh from a bent tube placed at (x,y,z), pointing along dir and curling toward bend
function bent(geo, m, s, x, y, z, dir, bend, parent, shadow = false) { const o = mk(geo, m, s, s, s, x, y, z, parent, shadow); return orient(o, dir, bend); }
// ================= creature sculpting kit (cr3_*): sculpted parts are baked once per shape/variant, =================
// merged into one geometry per material slot and cached, so each creature is a handful of meshes.
const cr3_C = {};
const cr3_M4 = new T3.Matrix4(), cr3_Q = new T3.Quaternion(), cr3_E = new T3.Euler(), cr3_P = new T3.Vector3(), cr3_S = new T3.Vector3();
const cr3_X = new T3.Vector3(), cr3_Y = new T3.Vector3(), cr3_Z = new T3.Vector3(), cr3_I4 = new T3.Matrix4();
const cr3_n = (x, y, z) => Math.sin(x * 5.1 + y * 1.7 + 1.3) * Math.sin(y * 4.3 + z * 2.9 + .4) * Math.sin(z * 3.7 + x * 2.3 + 2.1);
const cr3_cl = (v, a, b) => v < a ? a : v > b ? b : v;
function cr3_rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// smooth normals across coincident vertices (hides the seams of sculpted spheres, lathes and tubes)
function cr3_smooth(g) {
  g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal, map = new Map();
  for (let i = 0; i < p.count; i++) { const k = Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4); let a = map.get(k); if (!a) map.set(k, a = []); a.push(i); }
  for (const a of map.values()) if (a.length > 1) { let x = 0, y = 0, z = 0; for (const i of a) { x += n.getX(i); y += n.getY(i); z += n.getZ(i); } const l = Math.hypot(x, y, z) || 1; for (const i of a) n.setXYZ(i, x / l, y / l, z / l); }
  return g;
}
// sculpted unit sphere: f(v, x, y, z) moves each vertex
function cr3_sph(key, f, w = 24, h = 16) { return gx('c3s_' + key, () => { const g = new T3.SphereGeometry(1, w, h), p = g.attributes.position, v = new T3.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const x = v.x, y = v.y, z = v.z; f(v, x, y, z); p.setXYZ(i, v.x, v.y, v.z); } return cr3_smooth(g); }); }
// sculpted lathe: profile [[r,y]...] bottom to top; f(v, angle, r, y)
function cr3_lathe(key, pts, seg, f) { return gx('c3l_' + key, () => { const g = new T3.LatheGeometry(pts.map(([x, y]) => new T3.Vector2(x, y)), seg); if (f) { const p = g.attributes.position, v = new T3.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); f(v, Math.atan2(v.z, v.x), Math.hypot(v.x, v.z), v.y); p.setXYZ(i, v.x, v.y, v.z); } } return cr3_smooth(g); }); }
// tapered tube through points; r = number | [radii along the tube] | t=>radius; fy squashes the cross-section vertically
function cr3_tube(pts, r, rad = 7, seg = 0, fy = 1) {
  const c = new T3.CatmullRomCurve3(pts.map(q => new T3.Vector3(q[0], q[1], q[2])), false, 'centripetal');
  seg = seg || Math.max(6, (pts.length - 1) * 5);
  const rf = typeof r === 'function' ? r : Array.isArray(r) ? (t => { const n = r.length - 1, x = t * n, i = Math.min(n - 1, Math.floor(x)); return r[i] + (r[i + 1] - r[i]) * (x - i); }) : () => r;
  const fr = c.computeFrenetFrames(seg, false), P = [], I = [], o = new T3.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg; c.getPointAt(t, o); const k = rf(t), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= rad; j++) { const a = j / rad * Math.PI * 2, cs = -Math.cos(a), sn = Math.sin(a); P.push(o.x + k * (cs * N.x + sn * B.x), o.y + k * (cs * N.y + sn * B.y) * fy, o.z + k * (cs * N.z + sn * B.z)); }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setIndex(I); return cr3_smooth(g);
}
// leaf / feather / petal strip along +X (length 1) with a folded midrib; w = half width, serr = edge teeth, curl lifts the tip
function cr3_leaf(key, w = .3, serr = 0, curl = .3, fold = .5, N = 12, pw = .8) { return gx('c3f_' + key, () => {
  const P = [], I = [];
  for (let i = 0; i <= N; i++) { const x = i / N, ww = w * Math.pow(Math.sin(Math.PI * Math.min(.999, x * .92 + .04)), pw) * (1 + (i % 2 ? serr : -serr)) * (i === N ? 0 : 1), y = curl * x * x;
    P.push(x, y + fold * ww, -ww, x + .02, y, 0, x, y + fold * ww, ww); }
  for (let i = 0; i < N; i++) { const a = i * 3, b = a + 3; I.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g; }); }
// irregular faceted crystal shard, base at origin, tip at y=1
function cr3_shard(seed) { return gx('c3sh' + seed, () => {
  const R = cr3_rng(seed * 97 + 13), n = 5 + (seed % 3), P = [0, 1.0 + R() * .15, 0], I = [], top = .62 + R() * .2;
  for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R() * .5, r = .3 + R() * .14; P.push(Math.cos(a) * r, top + R() * .1, Math.sin(a) * r, Math.cos(a) * r * .8, 0, Math.sin(a) * r * .8); }
  for (let i = 0; i < n; i++) { const a = 1 + i * 2, b = 1 + ((i + 1) % n) * 2; I.push(0, b, a, a, b, a + 1, b, b + 1, a + 1); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setIndex(I); return g.toNonIndexed(); }); }
const cr3_cone = () => gx('c3cn', () => { const g = new T3.ConeGeometry(1, 1, 7); g.translate(0, .5, 0); return g; });
const cr3_hemi = up => gx('c3hm' + up, () => { const g = new T3.SphereGeometry(1, 20, 8, 0, Math.PI * 2, up ? 0 : Math.PI / 2, Math.PI / 2); g.translate(1, 0, 0); return g; });
function cr3_rrect(w, h, r) { const s = new T3.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function cr3_plate(key, w, h, d, r = .08, bev = .03) { return gx('c3p_' + key, () => { const g = new T3.ExtrudeGeometry(cr3_rrect(w, h, r), { depth: d, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -d / 2); return g; }); }
function cr3_flip(g) { const a = g.attributes; for (const k in a) { const A = a[k].array, s = a[k].itemSize; for (let i = 0; i < A.length; i += 3 * s) for (let j = 0; j < s; j++) { const t = A[i + s + j]; A[i + s + j] = A[i + 2 * s + j]; A[i + 2 * s + j] = t; } } }
function cr3_merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0;
  for (const g of list) { P.set(g.attributes.position.array, o); N.set(g.attributes.normal.array, o); o += g.attributes.position.count * 3; g.dispose(); }
  const r = new T3.BufferGeometry(); r.setAttribute('position', new T3.BufferAttribute(P, 3)); r.setAttribute('normal', new T3.BufferAttribute(N, 3)); r.computeBoundingSphere(); return r;
}
// collector: parts go into material slots; a = place by scale/pos/euler, d = orient local +Y along dir, sp = spike from b to t, t = tube
function cr3_K() {
  const L = {};
  const add = (s, geo, m4) => { const g = geo.index ? geo.toNonIndexed() : geo.clone(); for (const k in g.attributes) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(m4); if (m4.determinant() < 0) cr3_flip(g); (L[s] || (L[s] = [])).push(g); };
  const K = {
    L,
    a(s, geo, sx, sy, sz, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { cr3_E.set(rx, ry, rz); cr3_Q.setFromEuler(cr3_E); cr3_M4.compose(cr3_P.set(x, y, z), cr3_Q, cr3_S.set(sx, sy, sz)); add(s, geo, cr3_M4); return K; },
    d(s, geo, sc, x, y, z, dir, bend) {
      const [sx, sy, sz] = typeof sc === 'number' ? [sc, sc, sc] : sc;
      cr3_Y.set(dir[0], dir[1], dir[2]).normalize(); if (bend) cr3_X.set(bend[0], bend[1], bend[2]); else cr3_X.set(Math.abs(cr3_Y.y) < .9 ? 0 : 1, Math.abs(cr3_Y.y) < .9 ? 1 : 0, 0);
      cr3_Z.crossVectors(cr3_X, cr3_Y); if (cr3_Z.lengthSq() < 1e-8) cr3_Z.set(0, 0, 1); cr3_Z.normalize(); cr3_X.crossVectors(cr3_Y, cr3_Z).normalize();
      cr3_M4.makeBasis(cr3_X.multiplyScalar(sx), cr3_Y.multiplyScalar(sy), cr3_Z.multiplyScalar(sz)); cr3_M4.setPosition(x, y, z); add(s, geo, cr3_M4); return K;
    },
    sp(s, b, t, r, geo) { const dx = t[0] - b[0], dy = t[1] - b[1], dz = t[2] - b[2]; return K.d(s, geo || cr3_cone(), [r, Math.hypot(dx, dy, dz), r], b[0], b[1], b[2], [dx, dy, dz]); },
    t(s, pts, r, rad = 7, fy = 1, seg = 0) { const g = cr3_tube(pts, r, rad, seg, fy); add(s, g, cr3_I4); g.dispose(); const r0 = typeof r === 'function' ? r(0) : Array.isArray(r) ? r[0] : r, r1 = typeof r === 'function' ? r(1) : Array.isArray(r) ? r[r.length - 1] : r, a = pts[0], b = pts[pts.length - 1];
      if (r0 > .025 && (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2])) K.a(s, GEO.sphL, r0, r0 * fy, r0, a[0], a[1], a[2]); if (r1 > .025) K.a(s, GEO.sphL, r1, r1 * fy, r1, b[0], b[1], b[2]); return K; },
    g(s, geo) { add(s, geo, cr3_I4); return K; },
  };
  return K;
}
function cr3_bake(key, fn) { if (cr3_C[key]) return cr3_C[key]; const K = cr3_K(); fn(K); const o = {}; for (const s in K.L) o[s] = cr3_merge(K.L[s]); return cr3_C[key] = o; }
// bake (once) and instantiate one mesh per material slot under parent
function cr3_put(key, fn, M, parent) { const B = cr3_bake(key, fn); for (const s in B) { const m = M[s]; if (!m) continue; const o = new T3.Mesh(B[s], m); o.castShadow = !(s[0] === 'g' || m.transparent); parent.add(o); } return parent; }
function cr3_grp(parent, x, y, z) { const g = new T3.Group(); g.position.set(x, y, z); parent.add(g); return g; }
// shared face bits: slanted glowing eyes under angry brows, fang rows
function cr3_eyes(K, x, y, sep, r, tilt = .4, brow = 'd', yaw = .5, sock) { for (const s of [-1, 1]) { K.a('g', GEO.sph, r * .8, r * .55, r, x, y, s * sep, -s * tilt, s * yaw, 0); if (sock) K.a(sock, GEO.sph, r * .8, r * .95, r * 1.5, x - r * .2, y, s * sep, -s * tilt, s * yaw, 0); if (brow) K.a(brow, GEO.sph, r * 1.3, r * .5, r * 1.9, x - r * .1, y + r * .75, s * sep * 1.02, -s * (tilt + .1), s * yaw, -.1); } }
function cr3_fangs(K, s, x0, x1, y, z0, z1, n, len, r, up) { for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) : .5, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, l = len * (i === 0 || i === n - 1 ? 1.4 : .8 + .4 * ((i * 7) % 3) / 2); K.sp(s, [x, y, z], [x + .01, y + (up ? l : -l), z], r); } }

// ================= shape builders: each fills a collector (inner group) and may add animated groups =================
const CR3 = {};
// ---------- quadruped beast (wolves, hounds, fox, crawler) ----------
CR3.beast = (C, V) => {
  const topY = x => { const ch = Math.exp(-1 * (((x + .1) - .42) / .42) ** 2), hn = Math.exp(-1 * (((x + .1) + .62) / .3) ** 2); return 1.02 + .1 * ch + .02 * hn + (.3 + .2 * ch + .1 * hn); };
  cr3_put('beast' + V.k, K => {
    K.a('b', cr3_sph('bTorso', (v, x, y, z) => {
      const ch = Math.exp(-1 * ((x - .42) / .42) ** 2), hn = Math.exp(-1 * ((x + .62) / .3) ** 2), ws = Math.exp(-1 * ((x + .1) / .3) ** 2);
      const h = .3 + .2 * ch + .1 * hn - .03 * ws, w = .25 + .15 * ch + .13 * hn - .03 * ws, tuck = y < 0 ? 1 - .38 * ws - .12 * hn : 1;
      v.set(x * 1.02 + (y > .2 ? .05 * ch : 0), .1 * ch + .02 * hn + y * h * tuck, z * w * (1 + .1 * Math.max(0, y) * hn));
    }), 1, 1, 1, -.1, 1.02, 0);
    K.t('b', [[.45, 1.3, 0], [.78, 1.52, 0], [1.05, 1.64, 0]], [.36, .3, .24]);
    // head: skull, long snout, open lower jaw, fangs, ears
    K.a('b', GEO.sph, .3, .25, .26, 1.1, 1.67, 0);
    K.a('b', cr3_sph('bSnout', (v, x, y, z) => { const t = (x + 1) / 2; v.set(t * .56, y * .15 * (1 - .32 * t) * (y > 0 ? .85 : 1), z * .16 * (1 - .38 * t)); }), 1, 1, 1, 1.15, 1.62, 0, 0, 0, -.2);
    K.a('k', GEO.sph, .065, .05, .075, 1.69, 1.53, 0);
    K.a('b', cr3_sph('bJaw', (v, x, y, z) => { const t = (x + 1) / 2; v.set(t * .48, y * .055, z * .13 * (1 - .32 * t)); }), 1, 1, 1, 1.12, 1.46, 0, 0, 0, -.42);
    K.a('m', GEO.sph, .25, .07, .11, 1.35, 1.44, 0, 0, 0, -.3);
    for (const s of [-1, 1]) {
      K.sp('w', [1.6, 1.5, s * .07], [1.61, 1.36, s * .065], .026); K.sp('w', [1.45, 1.31, s * .085], [1.46, 1.43, s * .085], .022);
      for (let i = 0; i < 3; i++) K.sp('w', [1.28 + i * .09, 1.55 - i * .015, s * (.12 - i * .012)], [1.285 + i * .09, 1.49 - i * .015, s * (.12 - i * .012)], .014);
      K.d('b', cr3_cone(), [.06, .4, .15], 1.0, 1.84, s * .16, [-.4, 1, s * .32], [1, .3, 0]);
      K.d('d', cr3_cone(), [.04, .3, .1], 1.03, 1.85, s * .16, [-.4, 1, s * .32], [1, .3, 0]);
      for (let i = 0; i < 3; i++) K.sp('d', [1.05 - i * .04, 1.62 - i * .06, s * .22], [.82 - i * .05, 1.6 - i * .1, s * (.36 + i * .03)], .07);
    }
    cr3_eyes(K, 1.33, 1.72, .14, .055, .45, 'd', .6);
    // mane ruff and spine fur
    for (let i = 0; i < 9; i++) { const a = -1.4 + i * .35, c = Math.cos(a), s = Math.sin(a); K.sp('d', [.78, 1.5 + c * .26, s * .3], [.5, 1.55 + c * .4, s * .44], .1); }
    for (let i = 0; i < 9; i++) { const x = .55 - i * .17, y = topY(x) - .06, L = .32 - i * .022; K.sp('d', [x, y, 0], [x - L * .9, y + L * .55, 0], .07 - i * .004); if (i % 2 === 0) for (const s of [-1, 1]) K.sp('d', [x, y - .06, s * .12], [x - L * .8, y + L * .3, s * .2], .05); }
    // bushy tail
    K.t('b', [[-1.02, 1.3, 0], [-1.38, 1.4, 0], [-1.66, 1.22, 0], [-1.8, .92, 0]], [.11, .17, .14, .02]);
    K.t('d', [[-1.6, 1.28, 0], [-1.74, 1.1, 0], [-1.82, .88, 0]], [.12, .1, .0]);
    if (V.boss) {   // Tyrant hound: bone horns, armoured back plates
      for (const s of [-1, 1]) K.t('w', [[1.02, 1.82, s * .14], [.86, 2.02, s * .3], [.62, 2.08, s * .44], [.5, 1.94, s * .56]], [.07, .06, .045, 0]);
      for (let i = 0; i < 4; i++) { const x = .4 - i * .32; K.a('w', GEO.sph, .2, .06, .26, x, topY(x) - .02, 0, 0, 0, .2); K.sp('w', [x, topY(x) + .02, 0], [x - .28, topY(x) + .42, 0], .07); }
    }
  }, C.M, C.inner);
  for (const [x, z, f] of [[.55, .27, 1], [.55, -.27, 1], [-.62, .3, 0], [-.62, -.3, 0]]) {
    const l = cr3_grp(C.inner, x, 1.05, z); C.p.legs.push(l);
    cr3_put('bLeg' + f, K => {
      if (f) K.t('b', [[0, .25, 0], [.05, -.12, 0], [0, -.55, 0], [.05, -.9, 0]], [.19, .14, .085, .075]);
      else { K.a('b', GEO.sph, .3, .38, .22, .02, -.08, 0); K.t('b', [[0, 0, 0], [.16, -.38, 0], [-.14, -.66, 0], [-.04, -.96, 0]], [.2, .13, .075, .07]); }
      K.a('d', GEO.sph, .12, .07, .11, .1, -.97, 0);
      for (const z of [-.06, 0, .06]) K.sp('w', [.18, -.99, z], [.28, -1.02, z], .022);
    }, C.M, l);
  }
};
// ---------- serpent (eels, sandworm, leviathan) ----------
CR3.serpent = (C, V) => {
  cr3_put('serp' + V.k, K => {
    const path = [[-1.9, .22, -.55], [-1.3, .26, .45], [-.55, .32, -.35], [.05, .55, .2], [.42, 1.1, 0], [.62, 1.55, 0]];
    K.t('b', path, t => .1 + .28 * Math.sin(Math.min(1, t * 1.25) * Math.PI * .5) * (t > .88 ? 1 - (t - .88) * 2.5 : 1), 10, 1, 60);
    const c = new T3.CatmullRomCurve3(path.map(q => new T3.Vector3(...q)), false, 'centripetal'), q = new T3.Vector3(), tg = new T3.Vector3();
    for (let i = 2; i < 17; i++) { const t = i / 18; c.getPointAt(t, q); c.getTangentAt(t, tg); const r = .1 + .28 * Math.sin(Math.min(1, t * 1.25) * Math.PI * .5);
      K.sp('f', [q.x, q.y + r * .7, q.z], [q.x - tg.x * .25, q.y + r * .7 + .22 + .06 * Math.sin(i), q.z - tg.z * .25], .07);   // dorsal fin spines
      if (i % 2 === 0) K.a('g', GEO.sph, .05, .05, .05, q.x + tg.z * r * .85, q.y + .04, q.z - tg.x * r * .85);                  // glowing flank lights
      if (i % 2 === 1) K.a('g', GEO.sph, .05, .05, .05, q.x - tg.z * r * .85, q.y + .04, q.z + tg.x * r * .85);
    }
    // head with open jaws
    K.a('b', cr3_sph('srpHead', (v, x, y, z) => { const t = (x + 1) / 2; v.set(t * .7, y * .2 * (1 - .4 * t) * (y > 0 ? 1 : .6), z * .26 * (1 - .45 * t) * (1 + .15 * Math.max(0, -x))); }), 1, 1, 1, .45, 1.62, 0, 0, 0, -.25);
    K.a('b', cr3_sph('srpJaw', (v, x, y, z) => { const t = (x + 1) / 2; v.set(t * .6, y * .06, z * .2 * (1 - .4 * t)); }), 1, 1, 1, .48, 1.5, 0, 0, 0, -.62);
    K.a('m', GEO.sph, .3, .07, .15, .76, 1.45, 0, 0, 0, -.45);
    for (const s of [-1, 1]) {
      K.sp('w', [1.03, 1.42, s * .08], [1.04, 1.26, s * .08], .03); K.sp('w', [.92, 1.2, s * .1], [.93, 1.32, s * .1], .025);
      K.t('f', [[.5, 1.7, s * .2], [.25, 1.82, s * .42], [.05, 1.8, s * .55]], [.05, .03, 0]);   // head frills
      K.t('f', [[.55, 1.62, s * .22], [.32, 1.6, s * .48], [.12, 1.5, s * .6]], [.04, .025, 0]);
      if (V.lev) K.t('f', [[1.0, 1.43, s * .1], [1.12, 1.25, s * .3], [1.0, 1.0, s * .45]], [.025, .015, 0]);   // whiskers
    }
    cr3_eyes(K, .72, 1.72, .17, .07, .4, 'd', .8);
  }, C.M, C.inner);
};
// ---------- slime (translucent, visible core and swallowed bones) ----------
CR3.blob = (C, V) => {
  cr3_put('blob' + V.k, K => {
    K.a('b', cr3_lathe('blobB', [[0, 0], [.92, 0], [1.08, .1], [1.13, .38], [1.04, .78], [.82, 1.1], [.52, 1.33], [.22, 1.44], [0, 1.47]], 30, (v, a, r, y) => {
      const k = 1 + .05 * Math.sin(3 * a + y * 4) + .035 * Math.sin(5 * a - y * 3) + (y < .25 ? .07 * Math.max(0, Math.sin(7 * a + 1)) * (1 - y / .25) : 0);
      v.x *= k; v.z *= k; v.x -= .14 * (y / 1.47) ** 2; v.y += y > .9 ? .04 * Math.sin(4 * a) : 0;
    }), 1, 1, 1);
    K.a('g2', cr3_sph('blobCore', (v, x, y, z) => v.multiplyScalar(1 + .14 * cr3_n(x * 1.4, y * 1.4, z * 1.4))), .3, .3, .3, -.08, .62, 0);
    if (V.bones) { K.a('w', GEO.sph, .17, .15, .15, -.42, .5, .36, 0, .5, .3); for (const s of [-1, 1]) K.a('k', GEO.sph, .045, .05, .04, -.29, .52, .36 + s * .06 + .06, 0, .5, 0);
      K.t('w', [[.25, .32, -.5], [.05, .4, -.3], [-.12, .5, -.12]], .035); K.a('w', GEO.sph, .06, .06, .06, .25, .32, -.5); K.a('w', GEO.sph, .06, .06, .06, -.12, .5, -.12); }
    // snarling face
    for (const s of [-1, 1]) { K.a('g', GEO.sph, .12, .065, .11, .88, 1.02, s * .27, -s * .5, s * .35, 0); K.a('k', GEO.sph, .1, .04, .14, .86, 1.1, s * .26, -s * .6, s * .35, 0); }
    K.a('k', GEO.sph, .06, .14, .38, .95, .62, 0);
    for (let i = 0; i < 7; i++) { const z = -.3 + i * .1, l = i % 2 ? .07 : .11; K.sp('w', [.97, .74, z], [.995, .74 - l, z], .025); if (i % 2) K.sp('w', [.96, .5, z], [.985, .56, z], .02); }
    K.a('h', GEO.sph, .32, .1, .24, .1, 1.36, .25, 0, 0, .35);
    for (let i = 0; i < 5; i++) { const a = i * 1.27 + .5; K.a('b', GEO.sph, .1, .16, .1, Math.cos(a) * 1.05, .1, Math.sin(a) * 1.05); }
    if (V.spore) for (let i = 0; i < 7; i++) { const a = i * .9, e = .35 + (i % 3) * .3; K.a('g2', GEO.sph, .12, .12, .12, Math.cos(a) * Math.cos(e) * .95 - .1, .2 + Math.sin(e) * 1.2, Math.sin(a) * Math.cos(e) * .95); }
    if (V.weed) for (let i = 0; i < 6; i++) { const a = i * 1.05; K.t('d', [[Math.cos(a) * .4, 1.38, Math.sin(a) * .4], [Math.cos(a) * .75, 1.3, Math.sin(a) * .75], [Math.cos(a) * 1.0, .9, Math.sin(a) * 1.0]], [.05, .03, 0]); }
    if (V.crust) for (let i = 0; i < 6; i++) { const a = i * 1.05 + .3; K.a('d', GEO.dod, .32, .1, .26, Math.cos(a) * .55 - .1, 1.22, Math.sin(a) * .55, .2, a, .3); }
    if (V.crown) { K.t('r', Array.from({ length: 13 }, (_, i) => [Math.cos(i / 12 * 6.283) * .32, 1.5, Math.sin(i / 12 * 6.283) * .32]), .05); for (let i = 0; i < 5; i++) { const a = i * 1.257; K.sp('r', [Math.cos(a) * .32, 1.5, Math.sin(a) * .32], [Math.cos(a) * .36, 1.78, Math.sin(a) * .36], .06); } }
  }, C.M, C.inner);
};
// ---------- giant toad ----------
CR3.toad = (C, V) => {
  cr3_put('toad', K => {
    K.a('b', cr3_sph('toadB', (v, x, y, z) => { const f = x > 0 ? 1 + .15 * x : 1 - .1 * x; v.set(x * 1.0, (y > 0 ? y * .62 : y * .42) * (1 - .15 * x) + .03 * cr3_n(x * 3, y * 3, z * 3), z * .9 * f); }), 1, 1, 1, -.05, .72, 0);
    K.a('l', GEO.sph, .62, .24, .62, .35, .5, 0);
    K.a('k', cr3_tube([[.55, .6, -.72], [.95, .66, -.3], [1.05, .66, 0], [.95, .66, .3], [.55, .6, .72]], .035).rotateY(0), 1, 1, 1);
    for (const s of [-1, 1]) {
      K.a('b', GEO.sph, .26, .24, .26, .45, 1.2, s * .42); K.a('g', GEO.sph, .14, .12, .14, .6, 1.25, s * .47, 0, s * .4, 0); K.a('k', GEO.sph, .04, .1, .05, .73, 1.25, s * .5, 0, s * .4, 0);
      K.a('d', GEO.sph, .28, .08, .3, .48, 1.4, s * .4, -s * .3, 0, -.2);
      K.a('b', GEO.sph, .4, .3, .3, -.6, .45, s * .7); K.t('b', [[-.3, .2, s * .85], [.2, .06, s * .95], [.42, .04, s * .9]], [.14, .1, .07]);
      K.t('b', [[.5, .55, s * .55], [.75, .25, s * .7], [.85, .05, s * .7]], [.12, .09, .07]);
      for (const k of [-1, 0, 1]) { K.sp('d', [.85, .05, s * .7 + k * .05], [.98, .03, s * .7 + k * .1], .03); K.sp('d', [.42, .04, s * .9 + k * .06], [.55, .02, s * .9 + k * .13], .035); }
    }
    for (let i = 0; i < 14; i++) { const a = i * 2.4, e = .3 + (i % 4) * .2; K.a('d', GEO.sph, .07, .05, .07, Math.cos(a) * .85 * Math.cos(e) - .1, .72 + Math.sin(e) * .55, Math.sin(a) * .8 * Math.cos(e)); }
  }, C.M, C.inner);
};
// ---------- carnivorous plant (flytrap maw on a thorned stalk) ----------
CR3.plant = (C, V) => {
  const hx = .12, hy = 1.42, op = .42, sx = .34, sz = .58;
  const rim = (a, up, o) => { const x = sx * (1 + Math.cos(a)), z = sz * Math.sin(a), c = Math.cos(o * (up ? 1 : -1)), s = Math.sin(o * (up ? 1 : -1)); return [hx + x * c, hy + x * s, z]; };
  const shell = (e, up, ry) => { const x = sx * (1 + Math.cos(e)), y = ry * Math.sin(e) * (up ? 1 : -1), o = up ? op : -op; return [hx + x * Math.cos(o) - y * Math.sin(o), hy + x * Math.sin(o) + y * Math.cos(o), 0]; };
  cr3_put('plant' + V.k, K => {
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + .3; K.a('lf', cr3_leaf('pl', .3, .25, .5, .45), 1.25 - (i % 2) * .2, 1, 1, Math.cos(a) * .12, .05, Math.sin(a) * .12, 0, -a, .12); }
    K.t('b', [[-.32, 0, 0], [-.4, .45, 0], [-.18, .95, 0], [.02, 1.28, 0], [hx + .05, hy, 0]], [.2, .16, .13, .12, .12], 8);
    for (let i = 0; i < 6; i++) { const a = i * 2.2, y = .3 + i * .17, x = -.4 + Math.sin(y * 2.4) * .2 + .05; K.sp('d', [x + Math.cos(a) * .12, y, Math.sin(a) * .12], [x + Math.cos(a) * .32, y + .12, Math.sin(a) * .32], .04); }
    K.a('b', cr3_hemi(1), sx, .5, sz, hx, hy, 0, 0, 0, op); K.a('b', cr3_hemi(0), sx, .36, sz * .96, hx, hy, 0, 0, 0, -op);
    K.a('m', cr3_hemi(1), sx * .95, .45, sz * .92, hx + .02, hy, 0, 0, 0, op); K.a('m', cr3_hemi(0), sx * .95, .32, sz * .9, hx + .02, hy, 0, 0, 0, -op);
    K.a('g', GEO.sph, .14, .14, .14, hx + .14, hy + .02, 0);
    for (const up of [1, 0]) for (let i = 0; i < 11; i++) {
      const a = -1.35 + i * .27, p = rim(a, up, op), dn = up ? -1 : 1, c = Math.cos(a), s = Math.sin(a);
      K.sp('w', [p[0] - c * .02, p[1], p[2] - s * .02], [p[0] - c * .07, p[1] + dn * (.15 + (i % 2) * .07), p[2] - s * .06], .026);
      K.sp('l', p, [p[0] + c * .32, p[1] - dn * .12, p[2] + s * .3], .02);
    }
    for (let i = 0; i < 4; i++) { const p = shell(.5 + i * .3, 1, .5); K.sp('d', [p[0], p[1] - .03, 0], [p[0] - .18, p[1] + .22, 0], .05); }
    for (const s of [-1, 1]) { const p = shell(1.2, 1, .5); K.a('g', GEO.sph, .06, .04, .06, p[0] + .1, p[1] - .06, s * .28, -s * .4, s * .3, 0); K.a('d', GEO.sph, .09, .03, .12, p[0] + .09, p[1] - .01, s * .29, -s * .5, s * .3, 0); }
    for (let i = 0; i < 6; i++) { const a = 1.9 + i * .5; K.a('lf2', cr3_leaf('pp', .22, 0, .4, .3), .6, 1, 1, hx - .02, hy, Math.sin(a) * .05, Math.cos(a) * .9 + .2, Math.PI, Math.sin(a) * .9 - .3); }
    for (let i = 0; i < 3; i++) { const a = i * 2.09 + 1.1, c = Math.cos(a), s = Math.sin(a); K.t('d', [[c * .25, .05, s * .25], [c * .7, .35, s * .7], [c * 1.0, .2, s * 1.0], [c * 1.15, .45, s * 1.15]], [.07, .05, .03, 0]); for (let j = 0; j < 3; j++) K.sp('w', [c * (.5 + j * .2), .3, s * (.5 + j * .2)], [c * (.5 + j * .2), .48, s * (.5 + j * .2)], .02); }
    if (V.boss) {   // Thornmaw: crown of thorn spires and glowing seed pods
      for (let i = 0; i < 8; i++) { const a = i * .785, c = Math.cos(a), s = Math.sin(a); K.t('d', [[c * .5, 0, s * .5], [c * 1.0, .6, s * 1.0], [c * 1.15, 1.25, s * 1.15], [c * .95, 1.7, s * .95]], [.13, .1, .06, 0]); K.a('g2', GEO.sph, .1, .14, .1, c * 1.0, .62, s * 1.0); }
      for (let i = 0; i < 5; i++) { const p = shell(.2 + i * .28, 1, .5); K.sp('d', [p[0], p[1], 0], [p[0] - .3, p[1] + .45, 0], .07); }
    }
  }, C.M, C.inner);
};
// ---------- sea urchin ----------
CR3.urchin = (C, V) => {
  cr3_put('urchin', K => {
    K.a('b', cr3_sph('urchB', (v, x, y, z) => v.set(x, y * .75 + Math.abs(Math.sin(Math.atan2(z, x) * 5)) * .05, z)), .9, .9, .9, 0, .75, 0);
    const R = cr3_rng(7);
    for (let i = 0; i < 46; i++) { const u = R() * 2 - 1, a = R() * 6.283, y = Math.abs(u) * .9 + .1, r = Math.sqrt(1 - Math.min(1, y * y)), d = [Math.cos(a) * r, y, Math.sin(a) * r], L = .55 + R() * .5;
      K.sp(i % 3 ? 'd' : 'l', [d[0] * .82, .75 + d[1] * .62, d[2] * .82], [d[0] * (.82 + L), .75 + d[1] * (.62 + L), d[2] * (.82 + L)], .05); }
    cr3_eyes(K, .82, .9, .2, .08, .4, null, .5); K.a('k', GEO.sph, .05, .08, .2, .86, .62, 0);
  }, C.M, C.inner);
};
// ---------- bat / winged swarmers ----------
function cr3_membrane(s) { return gx('c3wm' + s, () => {
  const W = [[0, 0, 0], [.18, .12, .5], [0, .22, .95]], tips = [[.32, .28, 1.68], [-.22, .12, 1.8], [-.6, 0, 1.38], [-.62, -.08, .78], [-.45, -.25, .06]], wr = W[2], E = [W[0], W[1]];
  let prev = null; for (const t of tips) { if (prev) { const m = [(prev[0] + t[0]) / 2, (prev[1] + t[1]) / 2, (prev[2] + t[2]) / 2], c = [m[0] + (wr[0] - m[0]) * .32, m[1] + (wr[1] - m[1]) * .32 - .05, m[2] + (wr[2] - m[2]) * .32];
    for (const f of [.25, .5, .75]) { const u = 1 - f; E.push([u * u * prev[0] + 2 * u * f * c[0] + f * f * t[0], u * u * prev[1] + 2 * u * f * c[1] + f * f * t[1], u * u * prev[2] + 2 * u * f * c[2] + f * f * t[2]]); } } E.push(t); prev = t; }
  const P = [], I = [], R = 3; P.push(...wr);
  for (const e of E) for (let k = 1; k <= R; k++) { const f = k / R; P.push(wr[0] + (e[0] - wr[0]) * f, wr[1] + (e[1] - wr[1]) * f - Math.sin(f * Math.PI) * .07, (wr[2] + (e[2] - wr[2]) * f) * s); }
  P[2] *= s;
  const n = E.length, id = (i, k) => k === 0 ? 0 : 1 + i * R + (k - 1);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (i === n - 1) continue; for (let k = 0; k < R; k++) { if (k === 0) I.push(0, id(i, 1), id(j, 1)); else I.push(id(i, k), id(i, k + 1), id(j, k + 1), id(i, k), id(j, k + 1), id(j, k)); } }
  I.push(0, id(n - 1, 1), id(0, 1)); for (let k = 1; k < R; k++) I.push(id(n - 1, k), id(n - 1, k + 1), id(0, k + 1), id(n - 1, k), id(0, k + 1), id(0, k));
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g; }); }
CR3.bat = (C, V) => {
  cr3_put('bat' + V.k, K => {
    K.a('b', cr3_sph('batBody', (v, x, y, z) => v.multiplyScalar(1 + .08 * cr3_n(x * 3, y * 3, z * 3))), .36, .5, .34, 0, 1.72, 0, 0, 0, -.25);
    K.a('l', GEO.sph, .22, .3, .22, .16, 1.66, 0, 0, 0, -.25);
    K.a('b', cr3_sph('batHead', (v, x, y, z) => v.set(x * (1 + .1 * Math.max(0, x)), y * (y < 0 ? .85 : 1), z)), .3, .27, .3, .3, 2.12, 0);
    K.a('b', GEO.sph, .15, .11, .14, .52, 2.06, 0); K.sp('d', [.62, 2.08, 0], [.66, 2.22, 0], .05);
    K.a('m', GEO.sph, .07, .05, .1, .6, 1.97, 0);
    for (const s of [-1, 1]) {
      K.sp('w', [.63, 2.0, s * .05], [.64, 1.88, s * .05], .022);
      K.d('b', cr3_cone(), [.07, .55, .19], .22, 2.3, s * .16, [-.15, 1, s * .5], [1, 0, 0]); K.d('l', cr3_cone(), [.04, .4, .11], .26, 2.33, s * .17, [-.15, 1, s * .5], [1, 0, 0]);
      K.t('d', [[.02, 1.32, s * .1], [.05, 1.12, s * .13], [.12, 1.02, s * .14]], [.05, .035, .01]);
    }
    cr3_eyes(K, .57, 2.17, .12, .055, .5, 'd', .6);
    if (V.feather) for (let i = 0; i < 5; i++) K.a('f', cr3_leaf('fth', .14, 0, .1, .1), .55, 1, 1, -.22, 1.45 - i * .02, (i - 2) * .07, 0, Math.PI - (i - 2) * .25, -.5);
    if (V.halo) K.t('g', Array.from({ length: 21 }, (_, i) => [.18 + Math.cos(i / 20 * 6.283) * .32, 2.62, Math.sin(i / 20 * 6.283) * .32]), .03, 5);
    if (V.horns) for (const s of [-1, 1]) K.t('w', [[.3, 2.3, s * .1], [.2, 2.55, s * .2], [.0, 2.7, s * .22]], [.04, .03, 0]);
    if (V.shell) for (const s of [-1, 1]) K.a('d', GEO.sph, .45, .14, .3, -.15, 1.86, s * .2, 0, 0, -.8);
  }, C.M, C.inner);
  for (const s of [-1, 1]) {
    const wg = cr3_grp(C.inner, 0, 1.95, s * .26); C.p.wings.push({ g: wg, s });
    cr3_put('batW' + s + V.k, K => {
      K.t('b', [[0, 0, 0], [.18, .12, s * .5], [0, .22, s * .95]], [.08, .055, .04]);
      if (V.feather) {
        for (let i = 0; i < 9; i++) { const f = i / 8, z = .2 + f * 1.0, L = .55 + Math.sin(f * 2.6) * .55; K.a('f', cr3_leaf('fth2', .2, 0, -.05, .12), L, 1, 1, .05 - f * .05, .18 * f, s * z, 0, -s * (Math.PI / 2 + .9 * (1 - f)), 0); }
        for (let i = 0; i < 6; i++) { const f = i / 5; K.a('l', cr3_leaf('fth3', .22, 0, -.05, .12), .5, 1, 1, .05, .2 * f + .03, s * (.2 + f * .8), 0, -s * (Math.PI / 2 + .9 * (1 - f) + .2), 0); }
      } else {
        K.g('wm', cr3_membrane(s));
        for (const t of [[.32, .28, 1.68], [-.22, .12, 1.8], [-.6, 0, 1.38], [-.62, -.08, .78]]) K.t('d', [[0, .22, s * .95], [(t[0]) * .5, .22 + (t[1] - .22) * .5 + .03, s * (.95 + (t[2] - .95) * .5)], [t[0], t[1], s * t[2]]], [.035, .022, .006], 5);
        K.sp('w', [0, .24, s * .95], [.16, .3, s * .98], .03);
      }
    }, C.M, wg);
  }
};
// ---------- skeleton ----------
CR3.skull = (C, V) => {
  cr3_put('skel' + V.k, K => {
    K.a('b', cr3_sph('skCran', (v, x, y, z) => { v.set(x * (x < 0 ? 1.08 : .95), y * (y < -.2 ? .8 : 1) + (x < 0 ? .06 * Math.max(0, y) : 0), z * (y < 0 && x > .2 ? .78 : 1) * (1 - .12 * Math.max(0, x) * Math.max(0, -y))); }), .26, .27, .24, .02, 2.08, 0);
    K.a('b', GEO.sph, .07, .035, .22, .25, 2.1, 0);   // brow ridge
    K.a('b', GEO.sph, .17, .13, .19, .19, 1.9, 0);   // cheeks / maxilla
    for (const s of [-1, 1]) { K.a('k', GEO.sph, .065, .075, .06, .27, 2.03, s * .1, -s * .3, 0, 0); K.a('b', GEO.sph, .1, .05, .06, .16, 1.94, s * .2); }
    K.sp('k', [.33, 1.87, 0], [.37, 1.97, 0], .035, gx('c3tri', () => { const g = new T3.ConeGeometry(1, 1, 3); g.translate(0, .5, 0); return g; }));
    K.t('b', [[.0, 1.94, -.17], [.12, 1.78, -.15], [.27, 1.74, 0], [.12, 1.78, .15], [.0, 1.94, .17]], [.05, .045, .05, .045, .05], 6);
    for (let i = 0; i < 6; i++) { const a = -.75 + i * .3; K.a('w', GEO.box, .03, .05, .035, .27 + Math.cos(a) * .06 - .06, 1.835, Math.sin(a) * .13); K.a('w', GEO.box, .03, .04, .035, .26 + Math.cos(a) * .06 - .06, 1.77, Math.sin(a) * .12); }
    // spine, ribs, sternum, clavicles, pelvis
    K.t('b', [[-.04, .98, 0], [-.13, 1.35, 0], [-.07, 1.72, 0], [.0, 1.88, 0]], .045, 6);
    for (let i = 0; i < 5; i++) K.a('b', GEO.sph, .05, .035, .05, -.17 + Math.abs(i - 2) * .02, 1.1 + i * .14, 0);
    for (let i = 0; i < 4; i++) { const y = 1.66 - i * .12, w = .23 - Math.abs(i - 1.2) * .03; for (const s of [-1, 1]) K.t('b', [[-.12, y, s * .03], [-.1, y - .02, s * w], [.08, y - .08, s * (w - .02)], [.19, y - .12, s * .04]], .026, 5); }
    K.a('b', GEO.sph, .035, .17, .05, .2, 1.5, 0, 0, 0, -.12);
    for (const s of [-1, 1]) K.t('b', [[.08, 1.73, s * .04], [.06, 1.76, s * .2], [.02, 1.72, s * .34]], .03, 5);
    K.a('b', cr3_sph('skPel', (v, x, y, z) => v.set(x * .6, y * (1 - .4 * Math.abs(z)), z * (1 + .2 * y))), .16, .12, .22, -.03, 1.0, 0);
    // arms
    for (const s of [-1, 1]) { K.t('b', [[.02, 1.72, s * .36], [.08, 1.42, s * .42], [.15, 1.3, s * .42], [.4, 1.25, s * .4]], [.045, .035, .04, .03], 6);
      K.a('b', GEO.sph, .07, .07, .07, .02, 1.72, s * .36); K.a('b', GEO.sph, .05, .05, .05, .11, 1.38, s * .42);
      for (let k = -1; k <= 1; k++) K.t('b', [[.42, 1.25, s * .4 + k * .03], [.5, 1.22, s * .4 + k * .035], [.54, 1.16, s * .4 + k * .035]], [.018, .014, .008], 4); }
    // armour scraps: rusted pauldron and ragged loincloth
    K.a('r', cr3_hemi(1), .14, .14, .2, -.12, 1.74, -.38, -.2, 0, 0); K.sp('r', [.02, 1.86, -.4], [-.05, 2.05, -.45], .04);
    for (let i = 0; i < 6; i++) { const a = -1.2 + i * .48; K.a('c', cr3_leaf('rag', .14, .3, -.1, 0, 6), .45, 1, 1, Math.cos(a) * .17, .98, Math.sin(a) * .22, 0, -a, -1.35); }
    if (V.archer) {   // bow in the left hand, quiver and hood
      K.t('o', [[.42, 2.0, -.42], [.55, 1.62, -.44], [.42, 1.25, -.42], [.55, .88, -.44], [.42, .5, -.42]], [.02, .035, .04, .035, .02], 5);
      K.t('w', [[.42, 2.0, -.42], [.42, .5, -.42]], .006, 3, 1, 2);
      K.t('o', [[-.22, 1.25, .1], [-.32, 1.8, -.06]], .09, 7); for (let i = 0; i < 4; i++) K.sp('w', [-.3, 1.75, -.04 + i * .03 - .05], [-.36, 2.0, -.05 + i * .035 - .05], .01);
      K.a('c', cr3_sph('skHood', (v, x, y, z) => { if (x > .25) v.x = .25 - (x - .25) * .6; if (y > .3 && x < 0) { v.x -= (y - .3) * .4; v.y += (y - .3) * .2; } }), .34, .36, .32, .0, 2.08, 0);
    } else {
      K.d('r', GEO.box, [.1, .8, .025], .52, 1.68, .36, [.2, .8, -.07]); K.sp('r', [.61, 2.06, .33], [.65, 2.2, .32], .05, gx('c3tri', () => { const g = new T3.ConeGeometry(1, 1, 3); g.translate(0, .5, 0); return g; }));   // notched sword
      K.d('o', GEO.box, [.26, .05, .05], .42, 1.27, .39, [.2, .8, -.07]); K.a('o', GEO.box, .05, .14, .05, .39, 1.2, .4, 0, 0, -.25);
      K.a('o', GEO.cyl, .3, .05, .3, .3, 1.32, -.5, Math.PI / 2, 0, -.2); K.a('r', GEO.tor, .3, .3, .3, .3, 1.32, -.5, 0, 0, 0); K.a('r', GEO.sph, .07, .07, .07, .33, 1.32, -.53);
    }
    cr3_eyes(K, .3, 2.03, .1, .045, .3, null, .2);
  }, C.M, C.inner);
  for (const s of [-1, 1]) { const l = cr3_grp(C.inner, 0, .95, s * .14); C.p.legs.push(l); cr3_put('skLeg', K => { K.t('b', [[0, 0, 0], [.07, -.44, 0], [.02, -.86, 0]], [.045, .038, .035], 6); K.a('b', GEO.sph, .06, .06, .06, .07, -.44, 0); K.a('b', GEO.sph, .09, .04, .06, .12, -.91, 0); }, C.M, l); }
};
// ---------- ghost / wraith ----------
CR3.ghost = (C, V) => {
  cr3_put('ghost' + V.k, K => {
    K.a('b', cr3_lathe('ghB', [[.86, -1.0], [.78, -.7], [.68, -.4], [.62, -.1], [.66, .2], [.7, .5], [.6, .78], [.38, .95], [0, 1.0]], 30, (v, a, r, y) => {
      const t = cr3_cl((.1 - y) / 1.1, 0, 1);
      if (y < -.99) { const dr = .55 * Math.pow(Math.max(0, Math.sin(a * 5 + .5)), .6) + .22 * Math.max(0, Math.sin(a * 11 + 2)); v.y -= dr; v.x *= 1 - .35 * dr; v.z *= 1 - .35 * dr; }
      v.x -= t * t * .6; v.z += t * .1 * Math.sin(v.y * 5); v.y += t * t * .25 * Math.max(0, -Math.cos(a));
    }), .95, 1, .95, 0, 1.5, 0);
    // hollow face: dark sockets and a gaping mouth
    for (const s of [-1, 1]) K.a('k', GEO.sph, .09, .15, .07, .63, 2.0, s * .19, -s * .4, s * .4, 0);
    cr3_eyes(K, .69, 2.0, .2, .04, .4, null, .4);
    K.a('k', cr3_sph('ghMouth', (v, x, y, z) => v.set(x, y * (1 + .3 * Math.sin(z * 9)), z)), .07, .2, .13, .66, 1.68, 0);
    // reaching arms with claws and broken shackles
    for (const s of [-1, 1]) {
      K.t('b', [[.05, 2.05, s * .45], [.45, 1.88, s * .65], [.9, 1.72, s * .5]], [.18, .12, .055], 8);
      for (let k = -1; k <= 1; k++) K.t('d', [[.88, 1.72, s * .5 + k * .04], [1.05, 1.68, s * .5 + k * .07], [1.12, 1.55, s * .5 + k * .08]], [.025, .018, 0], 4);
      K.a('r', GEO.tor, .1, .1, .14, .72, 1.78, s * .58, 0, Math.PI / 2 - s * .3, .4);
      for (let i = 0; i < 3; i++) K.a('r', GEO.tor, .055, .055, .09, .7 - i * .03, 1.64 - i * .11, s * .6, 0, i % 2 ? Math.PI / 2 : 0, 0);
    }
  }, C.M, C.inner);
};
// ---------- jellyfish ----------
CR3.jelly = (C, V) => {
  cr3_put('jelly', K => {
    K.a('b', cr3_lathe('jlB', [[.95, 0], [1.0, .1], [.95, .35], [.75, .62], [.42, .8], [0, .85]], 28, (v, a, r, y) => { if (y < .05) { const k = 1 + .08 * Math.sin(a * 8); v.x *= k; v.z *= k; v.y -= .08 * Math.abs(Math.sin(a * 8)); } }), 1, 1, 1, 0, 1.55, 0);
    K.a('g', cr3_sph('jlCore', (v, x, y, z) => v.multiplyScalar(1 + .15 * cr3_n(x * 2, y * 2, z * 2))), .38, .26, .38, 0, 1.78, 0);
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + .4; K.t('l', [[Math.cos(a) * .2, 1.55, Math.sin(a) * .2], [Math.cos(a) * .3, 1.0, Math.sin(a) * .3], [Math.cos(a) * .1, .45, Math.sin(a) * .1], [Math.cos(a) * .25, .1, Math.sin(a) * .25]], [.1, .08, .05, .02], 6); }
    for (let i = 0; i < 12; i++) { const a = i * .524, r = .85; K.t('b', [[Math.cos(a) * r, 1.52, Math.sin(a) * r], [Math.cos(a + .3) * (r + .05), 1.1, Math.sin(a + .3) * (r + .05)], [Math.cos(a - .1) * r * .9, .6, Math.sin(a - .1) * r * .9], [Math.cos(a + .2) * r, .25, Math.sin(a + .2) * r]], [.035, .03, .02, 0], 4); }
    cr3_eyes(K, .9, 1.7, .25, .07, .4, null, .4);
  }, C.M, C.inner);
};
// ---------- hooded caster ----------
CR3.hood = (C, V) => {
  cr3_put('hood' + V.k, K => {
    K.a('b', cr3_lathe('robe', [[0, .02], [1.0, .02], [1.04, .1], [.86, .4], [.66, .95], [.5, 1.45], [.4, 1.78], [.2, 1.92], [0, 1.95]], 30, (v, a, r, y) => {
      const t = 1 - cr3_cl(y / 1.6, 0, 1), k = 1 + (.08 * Math.sin(9 * a) + .035 * Math.sin(17 * a + 1)) * t; v.x *= k; v.z *= k;
      if (y < .12) v.y += .1 * Math.max(0, Math.sin(11 * a)) + .05 * Math.max(0, Math.sin(23 * a));
      if (Math.cos(a) < 0) v.x += Math.cos(a) * .18 * t * t;
    }), V.hunch ? .95 : .88, 1, .88, 0, 0, 0);
    K.a('d', cr3_lathe('mantle', [[.76, 1.08], [.72, 1.22], [.62, 1.45], [.5, 1.62], [.32, 1.75], [0, 1.8]], 24, (v, a, r, y) => { if (y < 1.1) v.y += .14 * Math.max(0, Math.sin(7 * a)) - .05; }), 1, 1, 1, 0, .05, 0);
    // deep cowl with a lip around a dark void
    K.a('b', cr3_sph('cowl', (v, x, y, z) => { if (x > .18) v.x = .18 - (x - .18) * .7; if (y > .2 && x < .1) { v.x -= (y - .2) * .45; v.y += (y - .2) * .35; } }), .48, .52, .46, -.02, 2.06, 0);
    K.t('b', Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 6.283; return [.13 + .02 * Math.cos(a), 2.03 + Math.sin(a) * .34, Math.cos(a) * .3]; }), .07, 6);
    K.a('k', GEO.sph, .2, .3, .26, .1, 2.02, 0);
    K.t('b', [[-.25, 2.35, 0], [-.55, 2.38, 0], [-.78, 2.15, 0], [-.85, 1.85, 0]], [.16, .11, .06, 0], 7);
    cr3_eyes(K, .25, 2.06, .1, .05, .45, null, .3);
    // sleeves with bony hands
    for (const s of [-1, 1]) {
      K.t('b', [[0, 1.68, s * .38], [.3, 1.42, s * .58], [.6, 1.3, s * .58]], [.14, .17, .24], 9);
      K.a('k', GEO.sph, .06, .2, .2, .6, 1.3, s * .58, 0, 0, .1);
      for (let k = -1; k <= 1; k++) K.t('w', [[.58, 1.3, s * .58 + k * .07], [.74, 1.3, s * .6 + k * .09], [.82, 1.2, s * .6 + k * .1]], [.03, .022, .006], 4);
    }
    K.t('r', Array.from({ length: 21 }, (_, i) => { const a = i / 20 * 6.283; return [Math.cos(a) * .62, 1.08 + .03 * Math.sin(a * 3), Math.sin(a) * .62]; }), .045, 5);
    K.a('r', GEO.box, .08, .16, .14, .62, 1.08, 0);
    for (const z of [-.25, .3]) { K.t('d', [[.56, 1.05, z], [.6, .8, z + .03], [.58, .6, z]], .01, 3); K.a('g', GEO.oct, .05, .08, .05, .58, .55, z); }
    // gnarled staff with a caged focus
    const sx = .62, sz = .66;
    K.t('o', [[sx + .04, 0, sz], [sx - .03, .8, sz + .03], [sx + .04, 1.6, sz - .02], [sx, 2.35, sz]], [.06, .05, .045, .05], 6);
    for (let i = 0; i < 4; i++) { const a = i * 1.57; K.t('o', [[sx, 2.32, sz], [sx + Math.cos(a) * .2, 2.55, sz + Math.sin(a) * .2], [sx + Math.cos(a + .6) * .13, 2.85, sz + Math.sin(a + .6) * .13], [sx, 2.95, sz]], [.035, .03, .022, .01], 4); }
    if (V.hat) {   // bog witch: crooked wide-brim hat, hanging charms
      K.a('o', cr3_lathe('wHatB', [[.95, -.02], [.95, .02], [.5, .05], [0, .06]], 24, (v, a) => { v.y += .05 * Math.sin(a * 3); }), 1, 1, 1, -.05, 2.38, 0, 0, 0, .1);
      K.t('o', [[-.05, 2.4, 0], [-.1, 2.85, 0], [-.3, 3.25, 0], [-.6, 3.35, .1]], [.4, .25, .1, 0], 12);
      for (let i = 0; i < 5; i++) { const a = i * 1.26 + .3; K.t('d', [[Math.cos(a) * .85, 2.4, Math.sin(a) * .85], [Math.cos(a) * .85, 2.2, Math.sin(a) * .85]], .008, 3); K.a('g2', GEO.sph, .05, .07, .05, Math.cos(a) * .85, 2.16, Math.sin(a) * .85); }
      K.t('r', Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 6.283; return [-.07 + Math.cos(a) * .43, 2.48, Math.sin(a) * .43]; }), .035, 5);
    }
    if (V.mitre) {   // hollow bishop: tall mitre, gold-trimmed stole, halo of candles
      K.a('o', cr3_lathe('mitre', [[0, 0], [.32, 0], [.36, .25], [.3, .55], [.16, .82], [0, .95]], 16, (v, a, r, y) => { v.z *= .75; v.x *= 1 + .1 * y; }), 1, 1, 1, -.08, 2.4, 0, 0, 0, -.1);
      K.a('r', GEO.box, .04, .5, .05, .16, 2.85, 0, 0, 0, -.3); K.a('r', GEO.box, .04, .05, .28, .2, 2.95, 0, 0, 0, -.3);
      K.t('r', Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 6.283; return [-.07 + Math.cos(a) * .33, 2.42, Math.sin(a) * .25]; }), .035, 5);
      for (const s of [-1, 1]) K.t('r', [[.25, 1.75, s * .2], [.55, 1.1, s * .26], [.68, .5, s * .3], [.8, .1, s * .34]], .04, 5, .4);
      for (let i = 0; i < 6; i++) { const a = i * 1.047; K.a('w', GEO.cyl, .05, .22, .05, -.3 + Math.cos(a) * .7, 2.9, Math.sin(a) * .7); K.a('g', GEO.sph, .045, .08, .045, -.3 + Math.cos(a) * .7, 3.06, Math.sin(a) * .7); }
    }
  }, C.M, C.inner);
  const orb = mk(GEO.sph, C.M.g2 || C.M.g, .17, .17, .17, .62, 2.66, .66, C.inner, false); C.p.spin.push(orb);
  const r = mk(GEO.torThin, C.M.g, 1.3, 1.3, 1.3, 0, .05, 0, C.inner, false); r.rotation.x = Math.PI / 2; C.p.spin.push(r);
};
// ---------- brute (imps, golems, yeti, mummy, treant, horror) ----------
CR3.horn = (C, V) => {
  cr3_put('horn' + V.k, K => {
    K.a('b', cr3_sph('bruteT' + (V.wrap ? 'w' : ''), (v, x, y, z) => {
      const t = (y + 1) / 2, w = .5 + .45 * t * t * (3 - 2 * t), dp = .5 + .18 * t;
      const rg = V.wrap ? 1 + .035 * Math.abs(Math.sin(y * 26 + z * 2 + x)) : 1;
      v.set((x * dp + .14 * t * t + (x > 0 && t > .5 ? .08 * Math.cos(z * 2.4) * (t - .5) : 0)) * rg, y * .66 + (t > .75 ? .12 * (t - .75) * (1 - Math.abs(z)) * 4 * Math.max(0, -x) : 0), z * w * rg);
    }), 1, 1, 1, -.1, 1.4, 0);
    K.a('l', GEO.sph, .36, .42, .5, .22, 1.35, 0, 0, 0, -.25);
    if (!V.rock) for (const z of [-.15, .15]) K.a('c', cr3_leaf('loin', .16, .2, -.1, 0, 6), .55, 1, 1, .42, .92, z, 0, 0, -1.25);
    for (const s of [-1, 1]) K.a('b', GEO.sph, .42, .38, .4, .08, 1.82, s * .62);
    // head set low and forward under a heavy brow, tusked underbite
    const H = .14;
    K.a('b', cr3_sph('bruteH', (v, x, y, z) => v.set(x * (1 + .2 * Math.max(0, x)), y * (y < 0 ? 1.1 : .85), z * (1 + .12 * Math.max(0, -y)))), .3, .28, .3, .62 + H, 1.82, 0);
    K.a('d', GEO.sph, .1, .05, .26, .9 + H, 1.95, 0, 0, 0, -.25);
    K.a('b', GEO.sph, .2, .12, .24, .8 + H, 1.66, 0);
    K.a('m', GEO.sph, .03, .05, .16, .98 + H, 1.7, 0);
    for (const s of [-1, 1]) { K.t('w', [[.9 + H, 1.64, s * .13], [.98 + H, 1.76, s * .16], [.95 + H, 1.89, s * .2]], [.045, .03, 0], 6); K.a('d', GEO.sph, .1, .03, .14, .86 + H, 1.9, s * .12, -s * .4, 0, -.2); }
    cr3_eyes(K, .96 + H, 1.87, .12, V.wrap ? .065 : .055, .35, null, .5);
    if (V.wrap) for (let i = 0; i < 4; i++) K.a('c', cr3_leaf('band', .07, .15, -.2, 0, 6), .5 + i * .1, 1, 1, -.2 + i * .15, 1.1 + (i % 2) * .5, (i % 2 ? .45 : -.5), 0, i * 1.3, -1.3);
    if (V.horns) for (const s of [-1, 1]) K.t('w', [[.62 + H, 2.02, s * .16], [.45 + H, 2.24, s * .42], [.55 + H, 2.46, s * .68], [.85 + H, 2.52, s * .66], [.98 + H, 2.4, s * .56]], [.12, .1, .075, .04, 0], 8);
    if (V.spikes) for (let i = 0; i < 5; i++) { const x = .25 - i * .17, y = 2.0 - i * .1; K.sp('d', [x, y, 0], [x - .32, y + .3 - i * .03, 0], .1 - i * .01); for (const s of [-1, 1]) K.sp('d', [x - .05, y - .05, s * .3], [x - .3, y + .15, s * .42], .07); }
    for (const s of [-1, 1]) K.t('b', [[-.05, .95, s * .32], [.12, .5, s * .4], [-.02, .12, s * .38]], [.24, .2, .16], 8);
    for (const s of [-1, 1]) { K.a('d', GEO.sph, .26, .1, .2, .08, .07, s * .38); for (const k of [-1, 0, 1]) K.sp('w', [.3, .06, s * .38 + k * .08], [.4, .04, s * .38 + k * .09], .035); }
    if (V.wings) for (const s of [-1, 1]) K.g('wm', cr3_membrane(s).clone().scale(.6, .6, .6).rotateX(s * -.6).translate(-.35, 1.9, s * .35));
    if (V.tail) K.t('b', [[-.45, .95, 0], [-.85, .7, .1], [-1.15, .6, -.1], [-1.3, .85, 0]], [.08, .05, .035, .02], 6), K.sp('d', [-1.3, .85, 0], [-1.3, 1.08, 0], .1, gx('c3tri', () => { const g = new T3.ConeGeometry(1, 1, 3); g.translate(0, .5, 0); return g; }));
    if (V.cracks) for (let i = 0; i < 9; i++) { const a = i * .7, y = 1.0 + (i % 4) * .25; K.t('g2', [[.35 + Math.cos(a) * .05, y, Math.sin(a) * .5], [.42, y + .12, Math.sin(a + .4) * .45], [.38, y + .26, Math.sin(a) * .35]], .02, 3); }
    if (V.rock) for (let i = 0; i < 8; i++) { const a = i * 1.3, y = 1.1 + (i % 3) * .3; K.a('d', GEO.dod, .2, .14, .2, -.2 + Math.cos(a) * .35, y + .2, Math.sin(a) * .5, a, a * 2, 0); }
    if (V.fur) for (let i = 0; i < 24; i++) { const a = i * 2.4, y = .9 + (i % 6) * .2, r = .5 + .4 * ((y - .9) / 1.1); K.sp('l', [Math.cos(a) * r * .7, y, Math.sin(a) * r], [Math.cos(a) * r * 1.0 - .1, y - .25, Math.sin(a) * r * 1.25], .09); }
    if (V.branch) for (const s of [-1, 1]) { K.t('o', [[.55, 1.95, s * .15], [.4, 2.3, s * .35], [.2, 2.6, s * .3], [.0, 2.75, s * .45]], [.07, .05, .035, 0], 6); K.t('o', [[.4, 2.3, s * .35], [.55, 2.55, s * .6], [.5, 2.75, s * .75]], [.035, .025, 0], 5); K.a('lf', GEO.ico, .28, .2, .28, .1, 2.68, s * .4); K.a('lf', GEO.ico, .22, .16, .22, -.2, 2.1, s * .35); }
    if (V.boss) {   // Forgelord: armoured pauldrons, forge helm crest, giant hammer resting on the shoulder
      for (const s of [-1, 1]) { K.a('r', cr3_hemi(1), .26, .32, .46, -.15, 1.95, s * .66, s * -.3, 0, 0); for (let i = 0; i < 3; i++) K.sp('r', [.0 - i * .16, 2.2, s * (.7 + i * .03)], [-.05 - i * .16, 2.5 - i * .05, s * (.82 + i * .03)], .06); }
      K.t('r', [[.5, 2.0, 0], [.3, 2.28, 0], [.0, 2.36, 0], [-.3, 2.2, 0]], [.05, .1, .08, 0], 6, .6);
    }
  }, C.M, C.inner);
  for (const s of [-1, 1]) {
    const a = cr3_grp(C.inner, .08, 1.82, s * .74); C.p.legs.push(a);
    cr3_put('bruteA' + V.k + s, K => {
      K.t('b', [[0, 0, 0], [.1, -.48, s * .06], [.28, -.92, s * .03]], V.wrap ? (t => (.22 - .05 * Math.sin(t * 3.1)) * (1 + .1 * Math.abs(Math.sin(t * 40)))) : [.22, .17, .23], 9);
      K.a('d', cr3_sph('fist', (v, x, y, z) => v.multiplyScalar(1 + .12 * Math.max(0, x) * Math.abs(Math.sin(z * 6)))), .26, .24, .24, .32, -1.08, 0);
      for (let k = -1; k <= 1; k++) K.sp('w', [.5, -1.1, k * .1], [.62, -1.16, k * .12], .04);
      if (V.boss && s > 0) { K.t('o', [[.3, -1.08, 0], [.15, -.3, 0], [0, .5, 0]], .06, 6); K.a('d', cr3_plate('hamH', .6, .38, .46, .05, .03), 1, 1, 1, -.02, .66, 0, 0, Math.PI / 2, .1); for (const z of [-.25, .25]) K.a('g2', GEO.box, .4, .05, .03, -.02, .66, z); }
    }, C.M, a);
  }
};
// ---------- elemental orb ----------
CR3.orb = (C, V) => {
  cr3_put('orb' + V.k, K => {
    K.a('b', cr3_sph('orbCore', (v, x, y, z) => v.multiplyScalar(1 + .1 * cr3_n(x * 2.2, y * 2.2, z * 2.2))), .62, .62, .62, 0, 1.4, 0);
    for (let i = 0; i < 9; i++) { const a = i * .7, e = -.5 + (i % 3) * .45, c = Math.cos(a), s = Math.sin(a);   // flame tongues licking backward
      K.t('h', [[c * .4 * Math.cos(e), 1.4 + Math.sin(e) * .45, s * .4 * Math.cos(e)], [c * .62 - .35, 1.55 + Math.sin(e) * .55, s * .62], [-.9 - .15 * (i % 3), 1.75 + Math.sin(e) * .4, s * .4]], [.2, .12, 0], 6); }
    K.t('h', [[-.3, 1.4, 0], [-.9, 1.5, 0], [-1.5, 1.75, 0]], [.4, .22, 0], 8);
    if (!V.gear) { const R = cr3_rng(5); for (let i = 0; i < 11; i++) { const a = i * 2.4 + 1.2, e = Math.asin(-.8 + (i / 10) * 1.6), c = Math.cos(e); if (Math.cos(a) * c > .55 && Math.abs(Math.sin(e)) < .4) continue; K.d('d', GEO.dod, [.3 + R() * .1, .1, .3 + R() * .1], Math.cos(a) * c * .62, 1.4 + Math.sin(e) * .62, Math.sin(a) * c * .62, [Math.cos(a) * c, Math.sin(e), Math.sin(a) * c]); }
      K.a('d', GEO.sph, .1, .1, .5, .5, 1.62, 0, 0, 0, -.2); for (const s of [-1, 1]) K.sp('d', [.35, 1.82, s * .25], [.2, 2.25, s * .4], .09); }
    for (const s of [-1, 1]) K.a('g', GEO.sph, .06, .055, .16, .57, 1.5, s * .2, -s * .55, s * .35, 0);
    K.t('k', [[.5, 1.3, -.24], [.58, 1.22, -.12], [.6, 1.27, 0], [.58, 1.22, .12], [.5, 1.3, .24]], [.02, .04, .05, .04, .02], 5);
    if (V.gear) { K.a('r', GEO.tor, .64, .64, 1.2, 0, 1.4, 0, Math.PI / 2, 0, 0); for (let i = 0; i < 12; i++) { const a = i * .524; K.a('r', GEO.box, .16, .1, .12, Math.cos(a) * .76, 1.4, Math.sin(a) * .76, 0, -a, 0); } }
  }, C.M, C.inner);
  const sg = cr3_grp(C.inner, 0, 1.4, 0); C.p.spin.push(sg);
  cr3_put('orbSh' + V.k, K => { for (let i = 0; i < (V.boss ? 8 : 4); i++) { const a = i * 6.283 / (V.boss ? 8 : 4); K.d('g', cr3_shard(i), [.22, .45, .22], Math.cos(a) * (V.boss ? 1.55 : 1.15), Math.sin(i * 2) * .3 - .2, Math.sin(a) * (V.boss ? 1.55 : 1.15), [Math.cos(a) * .3, 1, Math.sin(a) * .3]); } }, C.M, sg);
  if (V.boss) { const r = mk(GEO.torThin, C.M.g, 1.25, 1.25, 1.25, 0, 1.4, 0, C.inner, false); r.rotation.set(1.1, 0, .3); C.p.spin.push(r);
    cr3_put('orbCrown', K => { for (let i = 0; i < 7; i++) { const a = i * .9; K.d('w', cr3_shard(i + 3), [.2, .8 + (i % 2) * .3, .2], Math.cos(a) * .35, 1.85, Math.sin(a) * .35, [Math.cos(a) * .6, 1, Math.sin(a) * .6]); } }, C.M, C.inner); }
};
// ---------- turret / totem ----------
CR3.turret = (C, V) => {
  cr3_put('turB', K => {
    K.a('s', gx('c3oct', () => { const g = new T3.CylinderGeometry(1, 1.08, 1, 8); g.translate(0, .5, 0); return g; }), 1.0, .32, 1.0, 0, 0, 0);
    K.a('s', gx('c3oct2', () => { const g = new T3.CylinderGeometry(.8, .9, 1, 8); g.translate(0, .5, 0); return g; }), .82, .26, .82, 0, .32, 0, 0, .39, 0);
    K.a('d', cr3_lathe('turCol', [[.5, 0], [.46, .1], [.38, .2], [.36, .6], [.4, .72], [.46, .8], [0, .82]], 12), 1, 1, 1, 0, .5, 0);
    for (let i = 0; i < 8; i++) { const a = i * .785 + .39; K.a('g', GEO.box, .2, .04, .03, Math.cos(a) * .93, .2, Math.sin(a) * .93, 0, -a + Math.PI / 2, 0); }
    for (let i = 0; i < 4; i++) { const a = i * 1.571 + .5; K.a('s', GEO.dod, .18, .13, .18, Math.cos(a) * 1.1, .07, Math.sin(a) * 1.1, a, a, 0); }
  }, C.M, C.g);
  const head = cr3_grp(C.g, 0, 1.55, 0); C.p.head = head;
  cr3_put('turH', K => {
    K.a('b', cr3_lathe('turDome', [[0, -.3], [.52, -.28], [.62, -.12], [.64, .05], [.56, .28], [.36, .46], [0, .52]], 16), 1, 1, 1);
    K.t('d', Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 6.283; return [Math.cos(a) * .64, -.06, Math.sin(a) * .64]; }), .06, 5);
    for (const s of [-1, 1]) { K.a('d', cr3_plate('turFin', .7, .36, .06, .1, .02), 1, 1, 1, -.25, .1, s * .62, 0, 0, .25); K.sp('d', [-.55, .2, s * .64], [-.95, .45, s * .68], .06); }
    K.a('r', cr3_lathe('turBar', [[.17, 0], [.2, .2], [.15, .3], [.15, .8], [.22, .86], [.24, 1.0], [.16, 1.02], [.12, .95], [0, .95]], 14), 1, 1, 1, .32, 0, 0, 0, 0, -Math.PI / 2);
    for (const x of [.6, .8]) K.a('d', GEO.cyl, .21, .05, .21, x, 0, 0, 0, 0, Math.PI / 2);
    K.a('g', GEO.cyl, .12, .02, .12, 1.29, 0, 0, 0, 0, Math.PI / 2);
    K.a('g', GEO.sph, .12, .09, .12, .45, .3, 0);
    K.a('g2', GEO.oct, .16, .3, .16, 0, .72, 0);
  }, C.M, head);
  const r = mk(GEO.torThin, C.M.g, 1, 1, 1, 0, .64, 0, C.g, false); r.rotation.x = Math.PI / 2;
};
// ---------- mushroom fiend ----------
CR3.shroom = (C, V) => {
  cr3_put('shroom' + V.k, K => {
    K.a('p', cr3_lathe('stalk', [[0, 0], [.56, 0], [.6, .12], [.5, .3], [.42, .6], [.4, .9], [.36, 1.08], [0, 1.1]], 16, (v, a, r, y) => { v.x += .12 * (y / 1.1) ** 2; v.x *= 1 + .05 * Math.sin(a * 5 + y * 3); }), 1, 1.25, 1);
    K.a('b', cr3_lathe('shCap', [[.0, .02], [.7, .06], [1.06, .0], [1.14, .1], [1.12, .34], [.98, .6], [.72, .86], [.38, .98], [0, 1.02]], 28, (v, a, r, y) => {
      if (y < .2) { v.y -= .1 * Math.max(0, Math.cos(a)) + .05 * Math.sin(a * 7); }
      const k = 1 + .04 * Math.sin(a * 6 + y * 2); v.x *= k; v.z *= k; v.x -= .08 * y;
    }), 1.1, .85, 1.1, 0, 1.24, 0);
    K.a('d', cr3_lathe('gills', [[.08, 0], [.6, .05], [1.08, .12], [1.1, .14]], 48, (v, a) => { v.y -= .04 * Math.abs(Math.sin(a * 24)); }), 1.05, 1, 1.05, 0, 1.22, 0, Math.PI, 0, 0);
    const R = cr3_rng(3); for (let i = 0; i < 9; i++) { const a = R() * 6.283, e = .2 + R() * .9, r = Math.cos(e * .9) * 1.02; K.d('w', cr3_sph('wart', (v, x, y, z) => v.set(x, Math.max(y, -.2) * .5, z)), .1 + R() * .13, Math.cos(a) * r - .05, 1.34 + Math.sin(e) * .8, Math.sin(a) * r, [Math.cos(a) * Math.cos(e), Math.sin(e) + .3, Math.sin(a) * Math.cos(e)]); }
    K.t('p', Array.from({ length: 21 }, (_, i) => { const a = i / 20 * 6.283; return [.1 + Math.cos(a) * .46, 1.04 - .05 * Math.abs(Math.sin(a * 5)), Math.sin(a) * .46]; }), .06, 5, .5);
    // face in the stalk: glaring eyes, jagged grin
    cr3_eyes(K, .5, .82, .15, .075, .5, 'd', .6, 'k');
    K.a('k', cr3_sph('shMouth', (v, x, y, z) => v.set(x, y * (1 - .4 * Math.abs(z)) + .3 * Math.sin(z * 14) * .2, z)), .06, .1, .28, .47, .5, 0);
    for (let i = 0; i < 5; i++) { const z = -.18 + i * .09; K.sp('w', [.52, .58, z], [.53, .5, z], .022); }
    // root arms and toes
    for (const s of [-1, 1]) { K.t('p', [[.1, .72, s * .38], [.3, .45, s * .62], [.45, .2, s * .7]], [.1, .07, .04], 6); for (let k = -1; k <= 1; k++) K.t('p', [[.45, .2, s * .7], [.55, .1, s * (.7 + k * .06)], [.6, .02, s * (.72 + k * .1)]], [.03, .02, 0], 4); }
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + .3; K.t('p', [[Math.cos(a) * .45, .08, Math.sin(a) * .45], [Math.cos(a) * .75, .03, Math.sin(a) * .75], [Math.cos(a + .2) * .95, .02, Math.sin(a + .2) * .95]], [.08, .05, 0], 5); }
    for (const [x, z, k] of [[-.8, .62, .8], [.55, -.85, .6], [-.6, -.7, .5]]) { K.a('p', GEO.cyl, .07 * k, .3 * k, .07 * k, x, .15 * k, z); K.a('b', cr3_hemi(1), .12 * k, .17 * k, .24 * k, x - .24 * k, .3 * k, z); }
    if (V.boss) for (let i = 0; i < 6; i++) { const a = i * 1.047 + .2; K.a('g2', GEO.sph, .17, .17, .17, Math.cos(a) * .75, 2.05, Math.sin(a) * .75); K.t('p', [[Math.cos(a) * .66, 1.95, Math.sin(a) * .66], [Math.cos(a) * .76, 2.05, Math.sin(a) * .76]], .05, 4); }
  }, C.M, C.inner);
};
// ---------- floating eye (beholder) ----------
CR3.eye = (C, V) => {
  const eg = cr3_grp(C.inner, 0, 1.4, 0); C.p.eye = eg;
  cr3_put('eye' + V.k, K => {
    K.a('w', GEO.sph, .87, .87, .87);
    K.a('i', cr3_lathe('iris', [[.47, -.12], [.38, -.05], [.22, -.01], [0, 0]], 24), 1, 1, 1, .86, 0, 0, 0, 0, -Math.PI / 2);
    K.a('k', GEO.sph, .06, .3, .12, .86, 0, 0);
    K.a('h', GEO.sph, .06, .06, .06, .85, .16, .16);
    const lid = (t0, k, up) => { const th = z => t0 + k * z * z; K.a('b', cr3_sph('lid' + t0, (v, x, y, z) => { if (x > 0 && (up ? y < th(z) : y > th(z))) v.y = th(z); v.multiplyScalar(1 + .025 * cr3_n(x * 5, y * 5, z * 5)); }, 30, 22), .93, .93, .93);
      K.t('b', Array.from({ length: 17 }, (_, i) => { const a = -Math.PI / 2 + i / 16 * Math.PI, z = .9 * Math.sin(a), y = th(z) * .93, x = Math.sqrt(Math.max(0, .93 * .93 - y * y - z * z * .86)); return [x, y, z * .93]; }), .055, 6); };
    lid(.1, .5, 1); lid(-.42, -.1, 0);
    for (let i = 0; i < 6; i++) { const a = -1.3 + (i % 3) * 1.3, b = i < 3 ? .14 : -.32; K.t('m', [[-.3, b + .1, Math.sin(a) * .8], [.25, b, Math.sin(a) * .82], [.55, b * .6, Math.sin(a) * .62]], [.012, .01, .004], 3); }
    for (let i = 0; i < 7; i++) { const a = -1.1 + i * .37, c = Math.cos(a), s = Math.sin(a); K.sp('d', [-.2 + c * .1, .82, s * .5], [-.55 + c * .1, 1.2, s * .7], .08); }
    for (let i = 0; i < 9; i++) { const a = -1 + i * .25; K.sp('w', [Math.cos(a) * .7 + .05, -.42, Math.sin(a) * .62], [Math.cos(a) * .7 + .07, -.3, Math.sin(a) * .62], .03); }
    K.a('m', GEO.sph, .3, .07, .5, .6, -.5, 0);
    for (let i = 0; i < 3; i++) { const a = -.9 + i * .9; K.t('b', [[-.1 + Math.cos(a) * .2, .78, Math.sin(a) * .4], [-.15 + Math.cos(a) * .3, 1.18, Math.sin(a) * .6], [.0 + Math.cos(a) * .35, 1.38, Math.sin(a) * .75]], [.07, .05, .045], 6); K.a('w', GEO.sph, .1, .1, .1, Math.cos(a) * .35 + .02, 1.42, Math.sin(a) * .75); K.a('g', GEO.sph, .045, .045, .045, Math.cos(a) * .35 + .1, 1.44, Math.sin(a) * .75); }
    if (V.boss) { for (let i = 0; i < 10; i++) { const a = i * .628, c = Math.cos(a), s = Math.sin(a); K.t('d', [[-.3, c * .7, s * .7], [-.7, c * 1.0, s * 1.0], [-1.1, c * 1.15, s * 1.15]], [.08, .05, 0], 5); }
      for (let i = 0; i < 5; i++) { const a = -1.4 + i * .7; K.t('b', [[-.1, .7 * Math.cos(a), .7 * Math.sin(a)], [-.1, 1.15 * Math.cos(a), 1.15 * Math.sin(a)], [.15, 1.4 * Math.cos(a), 1.4 * Math.sin(a)]], [.06, .045, .04], 6); K.a('w', GEO.sph, .1, .1, .1, .2, 1.45 * Math.cos(a), 1.45 * Math.sin(a)); K.a('g', GEO.sph, .045, .045, .045, .28, 1.45 * Math.cos(a), 1.45 * Math.sin(a)); } }
  }, C.M, eg);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.047 + .5, c = Math.cos(a), s = Math.sin(a);
    const t = cr3_grp(C.inner, c * .5, .85, s * .5); t.rotation.x = Math.PI; C.p.legs.push(t);
    cr3_put('eyeT' + i, K => { K.t('b', [[0, 0, 0], [c * .25, .35, -s * .25], [c * .55, .6, -s * .55], [c * .8, .78, -s * .7], [c * .75, .95, -s * .55]], [.15, .11, .07, .04, 0], 7); for (let j = 1; j < 4; j++) K.a('l', GEO.sph, .035, .035, .035, c * (.12 + j * .17) * 1.0, .2 + j * .17, -s * (.12 + j * .17)); }, C.M, t);
  }
};
// ---------- crab / scorpion / clockwork spider ----------
CR3.crab = (C, V) => {
  cr3_put('crab' + V.k, K => {
    K.a('b', cr3_sph('carap', (v, x, y, z) => { const ridge = .05 * Math.abs(Math.sin(x * 7)) * (y > 0 ? 1 : 0); v.set(x * (V.scorp ? .7 : 1) * (1 + .06 * Math.abs(Math.sin(Math.atan2(z, x) * 6))), y > 0 ? y * .5 + ridge : y * .25, z * (1 - .15 * Math.max(0, -x))); }), 1, 1, .9, 0, .78, 0);
    K.a('d', GEO.sph, .78, .2, .7, 0, .62, 0);
    for (let i = 0; i < 9; i++) { const a = -1.1 + i * .275, c = Math.cos(a), s = Math.sin(a); K.sp('l', [c * (V.scorp ? .66 : .94), .82, s * .85], [c * (V.scorp ? .78 : 1.1), .86, s * 1.0], .05); }
    for (let i = 0; i < 5; i++) K.sp('d', [-.3 + i * .15, 1.18, (i % 2 ? .25 : -.25)], [-.4 + i * .15, 1.38, (i % 2 ? .3 : -.3)], .06);
    K.a('m', GEO.box, .08, .1, .3, V.scorp ? .7 : .98, .7, 0);
    for (const s of [-1, 1]) {
      K.t('d', [[.66, .7, s * .07], [.78, .6, s * .1], [.84, .62, s * .04]], [.04, .03, 0], 4);
      K.t('d', [[.7, 1.0, s * .2], [.8, 1.2, s * .22], [.82, 1.32, s * .23]], [.05, .04, .04], 5); K.a('k', GEO.sph, .08, .08, .08, .83, 1.36, s * .23); K.a('g', GEO.sph, .04, .04, .04, .89, 1.38, s * .23);
      for (let i = 0; i < (V.scorp ? 4 : 3); i++) { const x = .35 - i * (V.scorp ? .27 : .35); K.t('d', [[x, .74, s * .55], [x + .05, 1.06, s * 1.05], [x - .05, .55, s * 1.4], [x - .1, 0, s * 1.55]], [.09, .07, .05, .01], 6); K.sp('l', [x + .05, 1.06, s * 1.05], [x + .05, 1.22, s * 1.08], .04); }
    }
    if (V.scorp) {   // segmented tail arched over the back, glowing stinger
      const pts = []; for (let i = 0; i < 9; i++) { const a = i / 8 * 3.3; pts.push([-.62 - Math.sin(a) * .55, .85 + (1 - Math.cos(a)) * .62, 0]); }
      K.t('d', pts, .1, 6); pts.forEach((p, i) => K.a('b', GEO.sph, .21 - i * .012, .18 - i * .01, .21 - i * .012, p[0], p[1], 0)); const e = pts[8];
      K.a('d', GEO.sph, .16, .13, .13, e[0] + .12, e[1] - .05, 0); K.t('g', [[e[0] + .2, e[1] - .08, 0], [e[0] + .38, e[1] - .2, 0], [e[0] + .42, e[1] - .4, 0]], [.06, .035, 0], 5);
      for (let i = 0; i < 4; i++) K.a('d', GEO.box, .35, .04, .55 - i * .06, -.15 - i * .17, 1.12 - i * .02, 0, 0, 0, -.15);
    }
    if (V.gems) for (let i = 0; i < 5; i++) { const a = i * 1.25; K.d('g2', cr3_shard(i), [.15, .4 + (i % 2) * .2, .15], Math.cos(a) * .35 - .1, 1.1, Math.sin(a) * .35, [Math.cos(a) * .4, 1, Math.sin(a) * .4]); }
    if (V.clock) { K.a('g2', GEO.cyl, .3, .03, .3, -.1, 1.2, 0); for (let i = 0; i < 8; i++) { const a = i * .785; K.a('r', GEO.box, .1, .05, .08, -.1 + Math.cos(a) * .32, 1.2, Math.sin(a) * .32, 0, -a, 0); } }
    if (V.boss) {   // Sandtyrant: gilded headdress plates and back spikes
      K.a('r', cr3_plate('kHead', .8, .7, .06, .1, .03), 1, 1, 1, .45, 1.12, 0, Math.PI / 2, 0, .3);
      for (let i = 0; i < 4; i++) K.sp('r', [.2 - i * .25, 1.2, 0], [.1 - i * .25, 1.55, 0], .07);
    }
  }, C.M, C.inner);
  for (const s of [-1, 1]) {
    const big = s > 0 ? 1.12 : .95, cl = cr3_grp(C.inner, V.scorp ? .55 : .72, .78, s * (V.scorp ? .55 : .8)); C.p.legs.push(cl);
    cr3_put('claw' + V.k + s, K => {
      K.t('b', [[0, 0, 0], [.25, .12, s * .12], [.48, .05, s * .05]], [.11, .1, .1], 6);
      K.a('b', cr3_sph('pincer', (v, x, y, z) => v.set(x * (1 + .2 * Math.max(0, x)), y * (1 - .3 * Math.max(0, x)), z * .8)), .34 * big, .26 * big, .26 * big, .62, .07, 0);
      K.t('b', [[.8, .13, 0], [1.08, .18, 0], [1.28, .06, 0]], [.11 * big, .08 * big, 0], 7, .7);
      K.t('d', [[.82, -.03, 0], [1.05, -.08, 0], [1.22, .02, 0]], [.08 * big, .06 * big, 0], 7, .7);
      for (let i = 0; i < 3; i++) { K.sp('w', [.95 + i * .1, .1, 0], [.96 + i * .1, .04, 0], .02); K.sp('w', [.95 + i * .1, -.04, 0], [.96 + i * .1, .02, 0], .018); }
    }, C.M, cl);
  }
};
// ---------- construct (automaton, knight, colossus) ----------
CR3.robot = (C, V) => {
  cr3_put('robot' + V.k, K => {
    K.a('b', cr3_plate('rChest', .9, .78, .46, .14, .05), 1, 1, 1, .2, 1.42, 0, 0, Math.PI / 2, 0);
    K.a('b', cr3_plate('rBack', .9, .82, .4, .14, .05), 1, 1, 1, -.12, 1.42, 0, 0, Math.PI / 2, 0);
    K.a('j', cr3_lathe('rWaist', [[.0, 0], [.32, 0], [.36, .1], [.28, .2], [.36, .3], [.28, .4], [0, .42]], 12), 1, 1, 1, 0, .86, 0);
    K.a('b', cr3_plate('rHip', .72, .2, .5, .06, .03), 1, 1, 1, 0, .82, 0, 0, Math.PI / 2, 0);
    // glowing seams and reactor core
    for (const z of [-.28, .28]) K.a('g', GEO.box, .02, .6, .04, .48, 1.42, z);
    K.a('g', GEO.box, .02, .04, .52, .48, 1.62, 0);
    K.a('j', GEO.cyl, .2, .06, .2, .5, 1.36, 0, 0, 0, Math.PI / 2); K.a('g', GEO.cyl, .14, .07, .14, .51, 1.36, 0, 0, 0, Math.PI / 2);
    // shoulders, boiler and pipes
    for (const s of [-1, 1]) {
      K.a('b', cr3_hemi(1), .2, .34, .4, -.18, 1.74, s * .56, s * -.35, 0, 0);
      for (let i = 0; i < 3; i++) K.a('d', GEO.box, .4 - i * .06, .03, .04, .02, 1.77 - i * .09, s * (.78 + i * .02), s * -.4, 0, 0);
      K.t('j', [[-.35, 1.7, s * .2], [-.55, 1.5, s * .25], [-.42, 1.05, s * .2]], .05, 6);
    }
    K.a('d', GEO.cyl, .26, .7, .26, -.48, 1.5, 0); K.a('j', GEO.cyl, .1, .3, .1, -.48, 2.0, .12); K.a('g2', GEO.cyl, .08, .02, .08, -.48, 2.15, .12);
    // helmet with visor slit
    K.a('b', cr3_plate('rHelm', .42, .44, .48, .12, .04), 1, 1, 1, .18, 2.0, 0, 0, Math.PI / 2, 0);
    K.a('d', GEO.box, .1, .08, .42, .42, 2.0, 0);
    K.a('g', GEO.box, .04, .05, .36, .47, 2.0, 0);
    K.a('j', GEO.cyl, .14, .1, .14, .15, 1.8, 0);
    // heavy arms with plated forearms and claws
    for (const s of [-1, 1]) {
      K.t('j', [[-.05, 1.62, s * .7], [.05, 1.3, s * .75], [.15, 1.1, s * .74]], .08, 6); K.a('j', GEO.sph, .12, .12, .12, .05, 1.3, s * .75);
      K.a('b', cr3_plate('rArm', .5, .3, .3, .08, .03), 1, 1, 1, .25, .95, s * .74, 0, 0, -1.2);
      K.a('g', GEO.box, .3, .02, .02, .27, .95, s * .9, 0, 0, -1.2);
      for (let k = -1; k <= 1; k++) K.t('d', [[.38, .66, s * .74 + k * .08], [.5, .55, s * .74 + k * .09], [.5, .42, s * .74 + k * .09]], [.04, .03, 0], 4);
    }
    if (V.knight) {   // knight: horned great-helm, tattered tabard, broken greatsword
      for (const s of [-1, 1]) K.t('r', [[.15, 2.18, s * .2], [.0, 2.4, s * .38], [.12, 2.6, s * .48]], [.06, .045, 0], 6);
      K.a('c', cr3_leaf('tab', .26, .2, .2, 0, 8), .9, 1, 1, .5, 1.25, 0, 0, 0, -1.45);
      K.t('r', [[.42, .62, -.74], [.62, 1.4, -.82], [.8, 2.05, -.88]], [.06, .055, .03], 4, .3); K.a('o', GEO.box, .08, .06, .4, .42, .64, -.74);
    }
    if (V.bomb) { K.a('k', GEO.sph, .4, .4, .4, -.25, 1.95, 0); K.t('o', [[-.25, 2.32, 0], [-.18, 2.48, .06], [-.25, 2.58, 0]], .025, 4); K.a('g2', GEO.sph, .07, .07, .07, -.25, 2.62, 0); }
    if (V.boss) {   // Colossus: twin shoulder cannons, smokestacks
      for (const s of [-1, 1]) { K.a('j', GEO.cyl, .14, .7, .14, .15, 2.0, s * .62, 0, 0, -Math.PI / 2); K.a('d', GEO.cyl, .18, .12, .18, .5, 2.0, s * .62, 0, 0, -Math.PI / 2); K.a('g', GEO.cyl, .1, .02, .1, .57, 2.0, s * .62, 0, 0, Math.PI / 2); }
      for (const z of [-.2, .2]) { K.a('d', GEO.cyl, .09, .7, .09, -.55, 2.1, z); K.a('g2', GEO.cyl, .07, .02, .07, -.55, 2.46, z); }
    }
  }, C.M, C.inner);
  const gr = cr3_grp(C.inner, -.48, 1.9, 0); gr.scale.setScalar(.8); C.p.spin.push(gr);
  cr3_put('rGear', K => { K.a('j', GEO.cyl, .3, .06, .3, 0, 0, 0); for (let i = 0; i < 10; i++) { const a = i * .628; K.a('j', GEO.box, .1, .06, .08, Math.cos(a) * .32, 0, Math.sin(a) * .32, 0, -a, 0); } }, C.M, gr);
  for (const s of [-1, 1]) { const l = cr3_grp(C.inner, 0, .8, s * .3); C.p.legs.push(l);
    cr3_put('rLeg', K => { K.t('j', [[0, 0, 0], [.04, -.35, 0]], .1, 6); K.a('j', GEO.sph, .12, .12, .12, .04, -.35, 0); K.a('b', cr3_plate('rShin', .3, .42, .3, .07, .03), 1, 1, 1, .06, -.55, 0, 0, Math.PI / 2, 0); K.a('b', cr3_plate('rFoot', .34, .14, .48, .05, .03), 1, 1, 1, .1, -.76, 0, 0, Math.PI / 2, 0); K.a('g', GEO.box, .02, .2, .02, .23, -.55, 0); }, C.M, l); }
};
// ---------- crystal cluster ----------
CR3.crystal = (C, V) => {
  cr3_put('crys' + V.k, K => {
    for (let i = 0; i < 7; i++) { const a = i * .9, r = .38 + (i % 2) * .25; K.a('s', GEO.dod, .32 + (i % 3) * .06, .18, .3, Math.cos(a) * r, .1, Math.sin(a) * r, a, a * 1.7, 0); }
    K.d('b', cr3_shard(1), [.55, 2.3, .55], 0, .1, 0, [.08, 1, 0]);
    const R = cr3_rng(11); for (let i = 0; i < 9; i++) { const a = i * .7 + R() * .3, r = .3 + R() * .35, L = .6 + R() * .7; K.d('b', cr3_shard(i + 2), [.25 + R() * .1, L, .25 + R() * .1], Math.cos(a) * r, .15, Math.sin(a) * r, [Math.cos(a) * (.5 + R() * .5), 1, Math.sin(a) * (.5 + R() * .5)]); }
    K.a('g', cr3_sph('crCore', (v, x, y, z) => v.multiplyScalar(1 + .2 * cr3_n(x * 2, y * 2, z * 2))), .22, .3, .22, 0, .45, 0);
    for (const s of [-1, 1]) K.a('k', GEO.sph, .05, .05, .12, .43, 1.45, s * .14, -s * .5, s * .3, 0);
    if (V.boss) { for (let i = 0; i < 6; i++) { const a = i * 1.047 + .5; K.d('b', cr3_shard(i + 20), [.4, 1.5 + (i % 2) * .5, .4], Math.cos(a) * .85, .1, Math.sin(a) * .85, [Math.cos(a) * .55, 1, Math.sin(a) * .55]); } }
  }, C.M, C.inner);
  const sg = cr3_grp(C.inner, 0, V.boss ? 2.4 : 2.15, 0); C.p.spin.push(sg);
  cr3_put('crysS' + V.k, K => { const n = V.boss ? 7 : 3; for (let i = 0; i < n; i++) { const a = i * 6.283 / n, r = V.boss ? 1.2 : .62; K.d('b', cr3_shard(i + 30), [.12, .4, .12], Math.cos(a) * r, Math.sin(i * 2) * .15 - .2, Math.sin(a) * r, [Math.cos(a) * .2, 1, Math.sin(a) * .2]); } }, C.M, sg);
};
// ---------- mimic ----------
CR3.chest = (C, V) => {
  cr3_put('mimic', K => {
    for (let i = 0; i < 5; i++) K.a('b', GEO.box, 1.5, .155, 1.1, 0, .1 + i * .16, 0);
    for (const x of [-.72, .72]) for (const z of [-.52, .52]) K.a('r', GEO.box, .1, .82, .1, x, .42, z);
    for (const x of [-.4, .4]) { K.a('r', GEO.box, .08, .84, 1.14, x, .42, 0); for (const y of [.15, .42, .7]) for (const z of [-.57, .57]) K.a('r', GEO.sph, .03, .03, .03, x, y, z); }
    K.a('m', GEO.box, 1.34, .06, .92, 0, .8, 0);
    for (let i = 0; i < 7; i++) { const z = -.42 + i * .14, L = .14 + (i % 3) * .06; K.sp('w', [.66, .8, z], [.67, .8 + L, z], .045); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) K.sp('w', [.45 - i * .3, .8, s * .48], [.45 - i * .3, .95, s * .47], .04);
    K.t('m', [[.15, .82, 0], [.65, .9, 0], [.92, .72, .05], [1.02, .35, -.1], [1.25, .06, .05], [1.5, .05, -.05]], [.14, .15, .13, .11, .08, .04], 9, .45);
    for (const s of [-1, 1]) K.a('g', GEO.sph, .09, .07, .09, -.15, .9, s * .3, 0, 0, 0);
    for (const s of [-1, 1]) for (const x of [-.55, .45]) K.t('d', [[x, .2, s * .52], [x + .1, .25, s * .78], [x + .18, 0, s * .85]], [.06, .045, .02], 5);
  }, C.M, C.inner);
  const lid = cr3_grp(C.inner, -.75, .84, 0); C.p.lid = lid;
  cr3_put('mimicL', K => {
    for (let i = 0; i < 5; i++) { const a = (i + .5) / 5 * Math.PI; K.a('b', GEO.box, 1.5, .03, .26, .75, Math.sin(a) * .5, Math.cos(a) * .52, Math.PI / 2 - a, 0, 0); }
    for (const [x, r] of [[1.5, Math.PI / 2], [0, -Math.PI / 2]]) K.a('b', gx('c3hd', () => new T3.CircleGeometry(1, 12, 0, Math.PI)), 1, .5, .52, x, 0, 0, 0, r, 0);
    for (const x of [.35, 1.15]) K.a('r', gx('c3lidB', () => new T3.CylinderGeometry(1, 1, 1, 14, 1, true, 0, Math.PI)), .58, .09, .58, x, 0, 0, 0, 0, Math.PI / 2);
    K.a('d', GEO.box, 1.5, .06, 1.08, .75, .02, 0);
    K.a('r', cr3_plate('lock', .2, .26, .05, .04, .02), 1, 1, 1, 1.53, .12, 0, 0, Math.PI / 2, 0); K.a('k', GEO.box, .02, .07, .03, 1.57, .1, 0);
    for (let i = 0; i < 8; i++) { const z = -.45 + i * .13, L = .14 + ((i * 5) % 3) * .06; K.sp('w', [1.42, .0, z], [1.43, -L, z], .045); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) K.sp('w', [1.2 - i * .3, .0, s * .48], [1.2 - i * .3, -.14, s * .47], .04);
  }, C.M, lid);
};
// ---------- props ----------
CR3.barrel = (C) => cr3_put('barrel', K => {
  K.a('o', cr3_lathe('brl', [[0, 0], [.7, 0], [.8, .3], [.84, .75], [.8, 1.2], [.7, 1.5], [0, 1.5]], 16, (v, a) => { const k = 1 - .02 * Math.abs(Math.sin(a * 8)); v.x *= k; v.z *= k; }), 1, 1, 1);
  for (const [y, r] of [[.2, .79], [.55, .85], [1.0, .85], [1.32, .78]]) K.t('r', Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 6.283; return [Math.cos(a) * r, y, Math.sin(a) * r]; }), .035, 4);
  K.a('g', GEO.cyl, .84, .2, .84, 0, .78, 0); K.a('k', GEO.box, .1, .32, .1, .84, .78, 0, 0, 0, .785);
}, C.M, C.inner);
CR3.crate = (C) => cr3_put('crate', K => {
  K.a('b', GEO.box, 1.3, 1.3, 1.3, 0, .68, 0);
  for (const [x, z, sx, sz] of [[.66, 0, .1, 1.42], [-.66, 0, .1, 1.42], [0, .66, 1.42, .1], [0, -.66, 1.42, .1]]) { K.a('d', GEO.box, sx, .14, sz, x, .08, z); K.a('d', GEO.box, sx, .14, sz, x, 1.3, z); }
  for (const [x, z] of [[.66, .66], [-.66, .66], [.66, -.66], [-.66, -.66]]) K.a('d', GEO.box, .12, 1.36, .12, x, .68, z);
  K.a('d', GEO.box, .08, 1.7, .14, .67, .68, 0, .78, 0, 0); K.a('d', GEO.box, .14, 1.7, .08, 0, .68, .67, 0, 0, .78); K.a('d', GEO.box, .14, 1.7, .08, 0, .68, -.67, 0, 0, -.78);
  for (const [x, z] of [[.68, .68], [-.68, .68], [.68, -.68], [-.68, -.68]]) for (const y of [.08, 1.3]) K.a('r', GEO.box, .16, .16, .16, x, y, z);
}, C.M, C.inner);
CR3.dummy = (C) => cr3_put('dummy', K => {
  const st = 'o';
  K.a(st, GEO.cyl, .12, 2.2, .12, 0, 1.1, 0); K.a(st, GEO.box, .12, .12, 1.6, 0, 1.55, 0);
  K.a('b', cr3_sph('dmB', (v, x, y, z) => v.set(x * (1 + .05 * Math.sin(y * 20)), y, z)), .6, .62, .55, 0, 1.25, 0);
  for (const y of [.95, 1.5]) K.t('d', Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 6.283; return [Math.cos(a) * .58 * (y > 1.2 ? .9 : 1), y, Math.sin(a) * .54 * (y > 1.2 ? .9 : 1)]; }), .04, 4);
  K.a('l', GEO.sph, .4, .42, .4, 0, 2.05, 0); for (const z of [-.13, .13]) K.a('k', GEO.box, .05, .06, .06, .38, 2.1, z);
  K.a('g', GEO.tor, .5, .5, .5, .58, 1.3, 0, 0, Math.PI / 2, 0); K.a('k', GEO.cyl, .7, .1, .7, 0, .05, 0);
}, C.M, C.inner);

// ---------- boss flourishes that are separate animated parts (static ones are baked inside the builders) ----------
function decorate(p, d, M, V) {
  if (!V.boss) return;
  const I = p.inner;
  if (d.sh === 'hood') { const r = mk(GEO.torThin, M.g, 1.75, 1.75, 1.75, 0, .04, 0, I, false); r.rotation.x = Math.PI / 2; p.spin.push(r); }
  if (d.sh === 'bat') {   // the Seraph gets a second, smaller pair of wings
    for (const s of [-1, 1]) { const wg = cr3_grp(I, -.1, 1.55, s * .22); wg.scale.setScalar(.65); wg.rotation.z = -.5; p.wings.push({ g: wg, s }); cr3_put('batW' + s + V.k, () => {}, M, wg); }
  }
  if (d.sh === 'beast' && V.lev) for (let i = 0; i < 3; i++) { const o = mk(GEO.sph, M.g, .09, .09, .09, .95 + i * .06, 2.0 + i * .1, 0, I, false); if (i === 2) p.spin.push(o); }
}
// ---------- enemies: built at radius 1, scaled by e.r; they face +X ----------
function makeEnemyModel(d, isBoss) {
  const g = new T3.Group(), inner = new T3.Group(); g.add(inner);
  const nm = d.n || '', col = d.col || '#888888', pc = d.pc, sh = d.sh;
  const parts = { g, inner, body: null, legs: [], wings: [], spin: [] };
  const V = { boss: !!isBoss, k: isBoss ? 'B' : '' };
  const fl = (k, re) => { if (re.test(nm)) { V[k] = 1; V.k += k; } };
  const dark = mat(shade3(col, .5), { rough: .78 }), light = mat(shade3(col, 1.3), { rough: .6 });
  const M = { d: dark, l: light, w: mat('#e8dcc0', { rough: .45 }), k: mat('#0a070c', { rough: .35 }), m: mat('#5a1420', { rough: .5, em: .25, emc: '#8a1020' }),
    g: mat(pc || '#ffc040', { em: 2.6 }), g2: mat(pc || '#ffc040', { em: 1.6 }), r: mat('#6a6458', { metal: .75, rough: .38 }), o: mat('#5a3a22', { rough: .85 }),
    c: matD('#4a3a30', { rough: .95 }), h: mat('#ffffff', { op: .45, rough: .1 }), s: mat('#4a4a54', { rough: .92, flat: true }), lf: matD(shade3(col, .7), { rough: .7 }), wm: matD(shade3(col, .45), { rough: .8 }) };
  const C = { g, inner, M, p: parts };
  let body = null, build = sh;
  switch (sh) {
    case 'blob':
      fl('toad', /toad/i); fl('spore', /spore/i); fl('crust', /magma/i); fl('weed', /bog|lurk/i); fl('crown', /crown/i); if (!V.spore && !V.crust) { V.bones = 1; V.k += 'bn'; }
      if (V.toad) { body = mat(col, { rough: .45 }).clone(); M.g = mat('#ffd040', { em: 2.2 }); build = 'toad'; }
      else { body = mat(col, { rough: .12, metal: .1, op: .76 }).clone(); M.g = mat(pc || '#fff07a', { em: 2.8 }); M.g2 = mat(shade3(col, 1.5), { em: 1.8 }); M.r = mat('#ffd040', { metal: .9, rough: .25, em: .3 }); if (V.crust) M.d = mat('#2a1a14', { rough: .95, flat: true }); }
      break;
    case 'beast':
      fl('scorp', /scorp|kesh/i); fl('serp', /eel|worm|leviathan/i); fl('lev', /leviathan/i);
      if (V.scorp) { build = 'crab'; M.g = mat(pc || '#ffd040', { em: 2.6 }); M.r = mat('#ffd040', { metal: .9, rough: .25, em: .2 }); }
      else if (V.serp) { build = 'serpent'; M.f = matD(shade3(col, .55), { rough: .6 }); M.g = mat(pc || '#9affff', { em: 2.4 }); }
      else M.g = mat(pc || '#ffd040', { em: 2.6 });
      body = mat(col, { rough: .7 }).clone(); break;
    case 'plant': fl('urchin', /urchin/i); if (V.urchin) build = 'urchin'; body = mat(col, { rough: .6 }).clone(); M.m = matD('#b02a44', { em: .45, rough: .5 }); M.lf2 = matD(shade3(col, 1.25), { rough: .6 }); M.g = mat(pc || '#e8ff60', { em: 2.6 }); M.g2 = mat(pc || '#e8ff60', { em: 1.8 }); M.l = mat('#f0e8b0', { rough: .6 }); break;
    case 'bat': fl('feather', /harpy|seraph|griffin/i); fl('halo', /seraph/i); fl('horns', /harpy|griffin/i); fl('shell', /scarab/i);
      body = mat(col, { rough: .8 }).clone(); M.l = mat(shade3(col, 1.18), { rough: .85 }); M.g = mat(pc || '#ff3030', { em: 3 }); M.f = matD(shade3(col, 1.1), { rough: .7 }); M.wm = matD(shade3(col, .42), { rough: .85 }); if (V.halo) M.g = mat(pc || '#ffe080', { em: 2.8 }); break;
    case 'skull': fl('archer', /arch/i); body = mat(col, { rough: .55 }).clone(); M.g = mat(pc || '#ff6a2a', { em: 3 }); M.r = mat('#9a948a', { metal: .35, rough: .5 }); M.o = mat('#5a3a22', { rough: .85 }); break;
    case 'ghost': fl('jelly', /jelly/i); fl('mirror', /mirror/i);
      body = mat(col, { op: .82, em: .5 }).clone(); body.depthWrite = true; body.side = T3.DoubleSide; if (V.jelly) build = 'jelly';
      M.d = mat(shade3(col, .45), { op: .9 }); M.g = mat(pc || '#9ae0ff', { em: 3 }); M.l = mat(shade3(col, 1.2), { op: .7, em: .6 }); M.r = mat('#4a4a54', { metal: .7, rough: .4 }); break;
    case 'hood': fl('hat', /morrow|hag|witch/i); fl('mitre', /bishop/i); fl('hunch', /hag|morrow/i);
      body = mat(col, { rough: .8 }).clone(); M.d = mat(shade3(col, .55), { rough: .85 }); M.g = mat(pc || '#c070ff', { em: 2.6 }); M.g2 = mat(pc || '#c070ff', { em: 1.6 });
      M.r = mat('#d8b040', { metal: .85, rough: .3 }); M.w = mat('#d8ccb0', { rough: .5 }); M.o = mat(V.mitre ? '#ece4d4' : '#3a2a1a', { rough: .8 }); if (V.hat) M.o = mat('#2a1a2a', { rough: .85 }); break;
    case 'horn':
      fl('imp', /imp/i); fl('golem', /golem/i); fl('yeti', /yeti/i); fl('mummy', /mummy/i); fl('treant', /treant|moss/i); fl('horror', /horror/i);
      if (V.imp) { V.wings = V.tail = V.horns = 1; } else if (V.golem) { V.rock = V.cracks = 1; } else if (V.yeti) { V.fur = 1; } else if (V.mummy) { V.wrap = 1; } else if (V.treant) { V.branch = 1; } else { V.horns = V.spikes = 1; }
      if (V.boss) { V.cracks = 1; V.horns = 1; V.spikes = 1; }
      body = mat(col, { rough: V.golem ? .9 : .65, flat: !!V.golem }).clone(); M.g = mat(pc || (V.golem || V.boss ? '#ff8a20' : '#ffe060'), { em: 2.8 }); M.g2 = mat(pc || '#ff7a20', { em: 2.2 });
      M.wm = matD(shade3(col, .5), { rough: .8 }); M.lf = mat('#4a7a2a', { rough: .8, flat: true }); M.o = mat('#5a3a22', { rough: .9 }); M.r = mat('#7a6a60', { metal: .6, rough: .4 }); if (V.wrap) M.l = mat('#e0d4b0', { rough: .9 }); if (V.fur) M.l = mat(shade3(col, .95), { rough: .9 }); break;
    case 'orb': fl('gear', /cog/i); body = mat(col, { em: 1.6 }).clone(); M.h = mat(pc || col, { op: .5, em: 1.5 }); M.g = mat('#ffffff', { em: 3, emc: pc || col }); M.d = mat(shade3(col, .3), { rough: .6, flat: true }); M.w = mat(shade3(col, 1.2), { em: 1, rough: .15, flat: true }); M.r = mat('#b08a40', { metal: .5, rough: .45 }); break;
    case 'turret': body = mat(col, { rough: .55, metal: .2 }).clone(); M.g = mat(pc || '#ffd27a', { em: 2.6 }); M.g2 = mat(pc || '#ffffff', { em: 2.5 }); M.r = mat('#2a2a30', { metal: .8, rough: .3 }); break;
    case 'shroom': body = mat(col, { rough: .55 }).clone(); M.p = mat('#e6dccb', { rough: .75 }); M.w = mat('#fff4e6', { rough: .5 }); M.d = mat(shade3(col, .45), { rough: .9 }); M.g = mat(pc || '#e8ff60', { em: 2.6 }); M.g2 = mat(pc || '#e8ff60', { em: 1.8 }); break;
    case 'eye': body = mat(col, { rough: .5 }).clone(); M.w = mat('#fff2dc', { rough: .3, em: .22 }); M.m = mat('#c02030', { em: .4 }); M.g = mat(pc || '#ff4060', { em: 2.4 }); M.i = mat(pc || '#ff4060', { em: .7, rough: .2 }); M.h = mat('#ffffff', { em: 1 }); M.l = mat(shade3(col, 1.4), { rough: .5 }); break;
    case 'crab': fl('gems', /gem/i); fl('clock', /clock/i);
      body = mat(col, { rough: V.clock ? .35 : .5, metal: V.clock ? .6 : .05, flat: !!V.clock }).clone(); M.g = mat(pc || '#ffd040', { em: 2.6 }); M.g2 = mat(pc || '#80ffff', { em: 1.6 }); M.r = mat('#c8a050', { metal: .85, rough: .3 }); break;
    case 'robot': fl('knight', /knight/i); fl('bomb', /boom/i);
      body = mat(col, { metal: .45, rough: .42 }).clone(); M.j = mat('#4a4a54', { metal: .6, rough: .4 }); M.d = mat(shade3(col, .5), { metal: .4, rough: .5 }); M.g = mat(pc || '#ffb040', { em: 2.8 }); M.g2 = mat(pc || '#ff6030', { em: 2.6 });
      M.r = mat('#8a8a94', { metal: .8, rough: .3 }); M.c = matD('#6a2020', { rough: .9 }); break;
    case 'crystal': body = mat(col, { em: .9, rough: .15, metal: .3, flat: true }).clone(); M.g = mat(pc || shade3(col, 1.4), { em: 2.6 }); M.s = mat('#34343f', { rough: .9, flat: true }); break;
    case 'chest': body = mat(col, { rough: .8 }).clone(); M.d = mat('#2a1a10', { rough: .85 }); M.r = mat('#3a3a40', { metal: .75, rough: .4 }); M.m = mat('#8a1a2a', { rough: .45, em: .2, emc: '#6a0a1a' }); M.g = mat('#ff3030', { em: 3 }); break;
    case 'barrel': body = mat('#8a3a22', { rough: .8 }).clone(); M.o = body; M.r = mat('#3a3a3a', { metal: .7 }); M.g = mat('#ffcc30', { em: .8 }); M.k = mat('#2a1a10'); break;
    case 'crate': body = mat(col, { rough: .85 }).clone(); M.d = mat('#5a4020', { rough: .9 }); M.r = mat('#4a4a50', { metal: .7, rough: .4 }); break;
    case 'dummy': body = mat(col, { rough: .9 }).clone(); M.o = mat('#6a4a2a'); M.d = mat('#8a3a2a'); M.l = mat('#d8b860', { rough: .95 }); M.k = mat('#2a1a10'); M.g = mat('#c83a2a', { em: .3 }); break;
    default: build = null;
  }
  if (!body) body = mat(col, { rough: .62 }).clone();
  M.b = body; parts.body = body;
  if (build && CR3[build]) CR3[build](C, V);
  else { mk(GEO.sph, body, 1, 1, 1, 0, 1, 0, inner); eyes(inner, .8, 1.2, .3, .15); }
  decorate(parts, d, M, V);
  if (sh !== 'turret') mk(GEO.circ, basic('#000000', { op: .3 }), 1.05, 1, 1.05, 0, .02, 0, g, false);
  return parts;
}
