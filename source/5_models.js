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
  const k = hex + '|' + (o.rough ?? '') + (o.metal ?? '') + (o.em ?? '') + (o.op ?? '') + (o.flat ? 'f' : '') + (o.emc || '');
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
    case 'staff': { const s = mk(GEO.cyl, wood, .03, 1.3, .03, .05, .35, 0, g); s.rotation.z = -.2; mk(GEO.sph, mat(w.col, { em: 2.2 }), .1, .1, .1, -.08, 1.0, 0, g, false); mk(GEO.torThin, gold, .14, .14, .14, -.08, 1.0, 0, g, false); break; }
    case 'wand': X(GEO.cyl, mat('#5a2a4a'), .38, .02, .19); mk(GEO.oct, mat(w.col, { em: 2.5 }), .05, .05, .05, .42, 0, 0, g, false); break;
    case 'tome': mk(GEO.box, mat('#8a2a2a'), .26, .07, .32, .12, 0, 0, g); mk(GEO.box, mat('#f0e0b0'), .24, .075, .28, .13, 0, 0, g); mk(GEO.oct, mat(w.col, { em: 2 }), .05, .05, .05, .13, .12, 0, g, false); break;
    case 'chakram': { const c = mk(GEO.tor, mat(w.col, { metal: .8, rough: .2, em: .4 }), .18, .18, .18, .18, 0, 0, g); c.rotation.x = Math.PI / 2; break; }
  }
  return g;
}

// ---------- extra detail for every creature type ----------
function decorate(p, d, dark, light) {
  const I = p.inner, white = mat('#f4f0e8', { rough: .4 }), glow = c => mat(c, { em: 2.2 });
  switch (d.sh) {
    case 'blob': mk(GEO.sph, mat(shade3(d.col, .7), { op: .55 }), .5, .45, .5, -.1, .75, 0, I, false); for (let i = 0; i < 5; i++) { const a = i * 1.256; mk(GEO.sphL, p.body, .16, .12, .16, Math.cos(a) * 1, .12, Math.sin(a) * 1, I, false); } mk(GEO.box, white, .06, .08, .06, 1.05, .8, .12, I, false); mk(GEO.box, white, .06, .08, .06, 1.05, .8, -.12, I, false); break;
    case 'beast': for (let i = 0; i < 6; i++) { const c = mk(GEO.coneL, dark, .1, .32, .1, .7 - i * .3, 1.55 - Math.abs(i - 1.5) * .04, 0, I, false); c.rotation.z = -.4; } for (const z of [-.12, .12]) { const t = mk(GEO.coneL, white, .04, .14, .04, 1.72, 1.02, z, I, false); t.rotation.x = Math.PI; } p.legs.forEach(l => mk(GEO.sphL, dark, .15, .1, .17, .04, -.75, 0, l, false)); mk(GEO.sphL, mat('#1a1010'), .07, .05, .1, 1.78, 1.2, 0, I, false); break;
    case 'plant': for (let i = 0; i < 4; i++) { const a = i * 1.57 + .4; const v = mk(GEO.halfTor, dark, .45, .45, .45, Math.cos(a) * .35, .55, Math.sin(a) * .35, I, false); v.rotation.y = -a; v.rotation.x = .3; } for (let i = 0; i < 5; i++) { const a = i * 1.256 + .3; mk(GEO.sphL, glow(pick(['#ffe060', '#ff80c0', '#ffffff'])), .07, .07, .07, Math.cos(a) * .7, 1.95, Math.sin(a) * .7, I, false); } break;
    case 'bat': for (const z of [-.12, .12]) { const f = mk(GEO.coneL, white, .035, .12, .035, .5, 1.62, z, I, false); f.rotation.x = Math.PI; mk(GEO.coneL, mat('#ff90a0'), .07, .22, .07, 0, 2.42, z * 2.1, I, false); } p.wings.forEach(w => { for (let i = 0; i < 3; i++) mk(GEO.box, mat(shade3(d.col, .4)), .04, .06, 1.2, -.3 + i * .3, .03, w.s * .7, w.g, false); }); break;
    case 'skull': { mk(GEO.box, p.body, .32, .1, .4, .2, 1.68, 0, I); for (let i = 0; i < 5; i++) mk(GEO.box, white, .04, .06, .04, .38, 1.75, -.16 + i * .08, I, false); const sw = new T3.Group(); sw.position.set(.35, 1.0, -.62); I.add(sw); mk(GEO.box, mat('#8a8a90', { metal: .7, rough: .5 }), .06, 1.0, .12, 0, .35, 0, sw); mk(GEO.box, mat('#6a4a2a'), .2, .06, .06, 0, -.15, 0, sw); sw.rotation.z = -.5; mk(GEO.box, white, .6, .14, .14, 0, .78, 0, I); break; }
    case 'ghost': for (let i = 0; i < 4; i++) mk(GEO.sphL, p.body, .25 - i * .05, .25 - i * .05, .25 - i * .05, -.6 - i * .35, .5 + i * .12, Math.sin(i) * .2, I, false); mk(GEO.torThin, glow(d.pc || '#9ab0ff'), .6, .6, .6, 0, .2, 0, I, false).rotation.x = Math.PI / 2; break;
    case 'hood': for (const z of [-.7, .7]) { const sl = mk(GEO.cylT, p.body, .22, .7, .22, .3, 1.3, z, I); sl.rotation.x = z > 0 ? -.7 : .7; mk(GEO.sphL, glow(d.pc || '#c070ff'), .12, .12, .12, .55, 1.0, z * 1.3, I, false); } { const r = mk(GEO.torThin, glow(d.pc || '#c070ff'), 1.3, 1.3, 1.3, 0, .05, 0, I, false); r.rotation.x = Math.PI / 2; p.spin.push(r); } mk(GEO.tor, mat('#d8b040', { metal: .8 }), .5, .5, .5, 0, 1.55, 0, I).rotation.x = Math.PI / 2; break;
    case 'horn': for (const z of [-1, 1]) { mk(GEO.hemi, dark, .4, .3, .4, 0, 1.75, z * .75, I); for (let i = 0; i < 3; i++) { const c = mk(GEO.coneL, mat('#e8dcc0'), .07, .25, .07, .3 + i * .1, .45, z * (1.05 + i * .08), I, false); c.rotation.z = -1.7; } } for (let i = 0; i < 3; i++) mk(GEO.box, light, .1, .14, .55, .95, .6 + i * .3, 0, I, false); break;
    case 'orb': { const sg = new T3.Group(); sg.position.y = 1.4; I.add(sg); for (let i = 0; i < 6; i++) { const a = i * 1.047; mk(GEO.oct, glow(d.col), .14, .24, .14, Math.cos(a) * 1.35, Math.sin(i * 2) * .3, Math.sin(a) * 1.35, sg, false); } p.spin.push(sg); break; }
    case 'turret': { const r = mk(GEO.torThin, glow(d.pc || '#ffd27a'), 1, 1, 1, 0, .6, 0, p.g, false); r.rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) { const a = i * 1.047; mk(GEO.dod, mat('#4a4a54', { flat: true }), .2, .16, .2, Math.cos(a) * 1.05, .1, Math.sin(a) * 1.05, p.g); } break; }
    case 'shroom': mk(GEO.cyl, mat(shade3(d.col, .55)), 1.1, .08, 1.1, 0, .96, 0, I, false); for (const z of [-.42, .42]) { const a = mk(GEO.caps, mat('#ece4d4'), .1, .3, .1, .1, .5, z, I); a.rotation.x = z > 0 ? -.6 : .6; } for (let i = 0; i < 4; i++) mk(GEO.sphL, mat('#a07060'), .05, .05, .05, .39, .5 + i * .1, -.1 + (i % 2) * .2, I, false); break;
    case 'eye': if (p.eye) { const lid = mk(GEO.hemi, dark, 1.02, .55, 1.02, 0, .05, 0, p.eye); lid.rotation.z = -.35; for (let i = 0; i < 4; i++) { const v = mk(GEO.torThin, mat('#c02030'), .9, .9, .9, 0, 0, 0, p.eye, false); v.rotation.set(i * .8, i * .5, .3); } } break;
    case 'crab': for (let i = 0; i < 4; i++) mk(GEO.box, dark, .12, .08, 1.6 - i * .2, -.4 + i * .3, 1.05, 0, I, false); mk(GEO.box, mat('#2a1010'), .1, .1, .4, 1.15, .7, 0, I, false); break;
    case 'robot': for (const z of [-.65, .65]) { const gr = mk(GEO.tor, mat('#c8a050', { metal: .85, rough: .3 }), .25, .25, .25, 0, 1.65, z, I); gr.rotation.x = Math.PI / 2; p.spin.push(gr); } for (let i = 0; i < 3; i++) mk(GEO.box, glow(d.pc || '#ff6030'), .02, .05, .5, .46, .95 + i * .12, 0, I, false); for (let i = 0; i < 4; i++) mk(GEO.sphL, mat('#555', { metal: .8 }), .05, .05, .05, .46, .75, -.35 + i * .23, I, false); break;
    case 'crystal': for (let i = 0; i < 4; i++) { const a = i * 1.57 + .7; const c = mk(GEO.oct, p.body, .18, .5, .18, Math.cos(a) * .45, 2.1, Math.sin(a) * .45, I, false); c.rotation.z = Math.cos(a) * .6; c.rotation.x = Math.sin(a) * .6; } break;
    case 'chest': for (let i = 0; i < 5; i++) { const c = mk(GEO.cone, white, .06, .2, .06, .78, .82, -.42 + i * .21, I, false); } mk(GEO.box, mat('#d8b040', { metal: .85 }), 1.65, .08, 1.2, 0, .02, 0, I, false); break;
  }
}
// ---------- enemies: built at radius 1, scaled by e.r ----------
function makeEnemyModel(d, isBoss) {
  const g = new T3.Group(), inner = new T3.Group(); g.add(inner);
  const body = mat(d.col, { rough: d.sh === 'blob' ? .25 : .7 }).clone();
  const dark = mat(shade3(d.col, .55)), light = mat(shade3(d.col, 1.25));
  const parts = { g, inner, body, legs: [], wings: [], spin: [] };
  switch (d.sh) {
    case 'blob': mk(GEO.sph, body, 1.1, .85, 1.1, 0, .85, 0, inner); mk(GEO.sphL, mat('#ffffff', { op: .35 }), .3, .18, .3, .3, 1.45, .3, inner, false); eyes(inner, .82, 1.1, .35, .2); mk(GEO.box, mat('#2a1a1a'), .1, .08, .4, 1.02, .75, 0, inner, false); break;
    case 'beast': {
      mk(GEO.sph, body, 1.2, .62, .7, 0, 1, 0, inner); mk(GEO.sph, light, .9, .45, .55, .1, .9, 0, inner);
      mk(GEO.sph, body, .55, .5, .5, 1.1, 1.3, 0, inner); mk(GEO.box, dark, .45, .28, .36, 1.55, 1.18, 0, inner);
      for (const s of [-1, 1]) { const c = mk(GEO.cone, dark, .18, .45, .14, 1.0, 1.85, s * .28, inner); c.rotation.x = s * .25; }
      eyes(inner, 1.5, 1.42, .22, .1, '#ffe060', '#000', true);
      for (const [x, z] of [[.65, .4], [.65, -.4], [-.65, .4], [-.65, -.4]]) { const l = new T3.Group(); l.position.set(x, .75, z); inner.add(l); mk(GEO.box, dark, .22, .75, .22, 0, -.37, 0, l); parts.legs.push(l); }
      const t = mk(GEO.cone, body, .14, .9, .14, -1.35, 1.2, 0, inner); t.rotation.z = 1.9; break;
    }
    case 'plant': {
      mk(GEO.cyl, dark, .25, 1, .25, 0, .5, 0, inner); mk(GEO.sph, body, .75, .7, .75, 0, 1.45, 0, inner);
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const c = mk(GEO.cone, light, .16, .7, .16, Math.cos(a) * .75, 1.45 + Math.sin(i * 2) * .2, Math.sin(a) * .75, inner); c.lookAt(Math.cos(a) * 3, 1.45, Math.sin(a) * 3); c.rotateX(Math.PI / 2); }
      mk(GEO.sph, mat('#e84a6a', { em: .4 }), .4, .3, .45, .55, 1.4, 0, inner); eyes(inner, .45, 1.85, .25, .14);
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + .7; mk(GEO.sph, dark, .6, .08, .3, Math.cos(a) * .5, .1, Math.sin(a) * .5, inner).rotation.y = -a; }
      break;
    }
    case 'bat': {
      mk(GEO.sph, body, .6, .65, .6, 0, 1.8, 0, inner); eyes(inner, .48, 1.9, .2, .12, '#ff4040', '#000', true);
      for (const s of [-1, 1]) { const c = mk(GEO.cone, body, .14, .4, .14, 0, 2.45, s * .25, inner); c.rotation.x = -s * .3; const wg = new T3.Group(); wg.position.set(0, 1.9, s * .45); inner.add(wg); mk(GEO.box, dark, .8, .05, 1.3, 0, 0, s * .65, wg); mk(GEO.box, dark, .4, .05, .7, -.35, 0, s * 1.1, wg); parts.wings.push({ g: wg, s }); }
      break;
    }
    case 'skull': {
      const bone = body;
      for (const s of [-1, 1]) { const l = new T3.Group(); l.position.set(0, .8, s * .28); inner.add(l); mk(GEO.box, bone, .14, .8, .14, 0, -.4, 0, l); parts.legs.push(l); }
      mk(GEO.box, bone, .3, .2, .7, 0, .85, 0, inner);
      for (let i = 0; i < 4; i++) mk(GEO.tor, bone, .35 - i * .03, .35 - i * .03, .35 - i * .03, 0, 1.05 + i * .18, 0, inner).rotation.x = Math.PI / 2;
      mk(GEO.cyl, bone, .06, .8, .06, 0, 1.3, 0, inner);
      for (const s of [-1, 1]) { const a = mk(GEO.box, bone, .12, .8, .12, .2, 1.3, s * .55, inner); a.rotation.z = -.6; }
      mk(GEO.sph, bone, .5, .5, .48, 0, 2.1, 0, inner); mk(GEO.box, bone, .3, .2, .4, .25, 1.8, 0, inner);
      for (const s of [-1, 1]) { mk(GEO.sphL, mat('#100808'), .14, .14, .14, .38, 2.15, s * .18, inner, false); mk(GEO.sphL, mat('#ff6a2a', { em: 3 }), .06, .06, .06, .48, 2.15, s * .18, inner, false); }
      break;
    }
    case 'ghost': {
      const gm = mat(d.col, { op: .78, em: .5 }).clone(); gm.depthWrite = true; parts.body = gm;
      const c = mk(GEO.cone, gm, .85, 1.6, .85, 0, 1.0, 0, inner, false); c.rotation.x = Math.PI;
      mk(GEO.sph, gm, .8, .75, .8, 0, 1.75, 0, inner, false);
      for (const s of [-1, 1]) { const a = mk(GEO.cone, gm, .18, .9, .18, .3, 1.4, s * .8, inner, false); a.rotation.x = s * 1.9; }
      eyes(inner, .65, 1.85, .25, .15, '#1a1a3a', '#9ae0ff');
      mk(GEO.sph, mat('#10102a'), .1, .15, .2, .75, 1.55, 0, inner, false); break;
    }
    case 'hood': {
      mk(GEO.cone, body, .95, 2, .95, 0, 1, 0, inner); mk(GEO.sph, dark, .55, .55, .55, 0, 2.0, 0, inner);
      mk(GEO.sph, mat('#08040c'), .38, .4, .38, .2, 1.95, 0, inner, false); eyes(inner, .5, 2.0, .13, .08, d.pc || '#c070ff', '#000', true);
      const st = mk(GEO.cyl, mat('#4a3020'), .05, 2.4, .05, .35, 1.2, .85, inner); st.rotation.x = .1;
      const orb = mk(GEO.sph, mat(d.pc || '#c070ff', { em: 2.5 }), .2, .2, .2, .35, 2.45, .95, inner, false); parts.spin.push(orb); break;
    }
    case 'horn': {
      mk(GEO.sph, body, 1, 1.05, 1, 0, 1.05, 0, inner); mk(GEO.sph, light, .6, .7, .7, .5, .95, 0, inner);
      for (const s of [-1, 1]) { const h = mk(GEO.cone, mat('#e8dcc0'), .17, .85, .17, .1, 2.05, s * .5, inner); h.rotation.x = -s * .55; h.rotation.z = -.2; const a = mk(GEO.box, body, .32, 1, .32, .2, 1, s * 1.05, inner); a.rotation.x = s * .25; parts.legs.push(a); }
      eyes(inner, .88, 1.45, .3, .13, '#ffe060', '#000', true); mk(GEO.box, mat('#2a0a0a'), .1, .12, .5, .95, 1.0, 0, inner, false);
      for (const s of [-1, 1]) mk(GEO.box, dark, .35, .5, .35, 0, .25, s * .45, inner);
      break;
    }
    case 'orb': {
      const om = mat(d.col, { em: 1.6 }).clone(); parts.body = om;
      mk(GEO.sph, om, .8, .8, .8, 0, 1.4, 0, inner, false); mk(GEO.sph, mat('#ffffff', { em: 2 }), .4, .4, .4, 0, 1.4, 0, inner, false);
      const r1 = mk(GEO.torThin, mat(d.col, { em: 2 }), 1.15, 1.15, 1.15, 0, 1.4, 0, inner, false); r1.rotation.x = 1.2; parts.spin.push(r1);
      eyes(inner, .7, 1.5, .25, .13, '#102030', '#ffffff'); break;
    }
    case 'turret': {
      mk(GEO.cyl, mat('#3a3a44', { rough: .9 }), .95, .55, .95, 0, .28, 0, g); mk(GEO.cyl, dark, .55, .8, .55, 0, .95, 0, g);
      const head = new T3.Group(); head.position.set(0, 1.55, 0); g.add(head); parts.head = head;
      mk(GEO.sph, body, .62, .55, .62, 0, 0, 0, head);
      for (const s of [-1, 1]) { const b = mk(GEO.cyl, mat('#2a2a30', { metal: .7, rough: .3 }), .14, 1, .14, s * .8, 0, 0, head); b.rotation.z = Math.PI / 2; }
      mk(GEO.oct, mat(d.pc || '#ffffff', { em: 2.5 }), .22, .3, .22, 0, .65, 0, head, false); break;
    }
    case 'shroom': {
      mk(GEO.cyl, mat('#ece4d4'), .42, 1.05, .42, 0, .52, 0, inner); mk(GEO.hemi, body, 1.25, .95, 1.25, 0, 1.0, 0, inner);
      mk(GEO.cyl, mat('#d8c8b8'), 1.2, .05, 1.2, 0, 1.0, 0, inner);
      for (let i = 0; i < 6; i++) { const a = i * 1.05; mk(GEO.sphL, mat('#ffffff', { em: .3 }), .17, .1, .17, Math.cos(a) * .75, 1.55, Math.sin(a) * .75, inner, false); }
      eyes(inner, .4, .72, .17, .1); break;
    }
    case 'eye': {
      const eg = new T3.Group(); eg.position.y = 1.4; inner.add(eg); parts.eye = eg;
      mk(GEO.sph, mat('#f0e8f0', { rough: .25 }), .95, .95, .95, 0, 0, 0, eg);
      mk(GEO.sph, body, .3, .5, .5, .8, 0, 0, eg); mk(GEO.sph, mat('#000000', { rough: .1 }), .12, .22, .22, .95, 0, 0, eg, false);
      for (let i = 0; i < 8; i++) { const a = i * .785; const t = mk(GEO.cone, dark, .14, 1.2, .14, Math.cos(a) * .6, .55, Math.sin(a) * .6, inner); t.rotation.x = Math.PI + Math.sin(a) * .5; t.rotation.z = Math.cos(a) * .5; parts.legs.push(t); }
      break;
    }
    case 'chest': {
      mk(GEO.box, body, 1.6, .9, 1.15, 0, .45, 0, inner); for (const x of [-.55, .55]) mk(GEO.box, mat('#d8b040', { metal: .8 }), .1, .95, 1.2, x, .47, 0, inner);
      const lid = new T3.Group(); lid.position.set(-.8, .9, 0); inner.add(lid); parts.lid = lid;
      mk(GEO.box, dark, 1.6, .35, 1.15, .8, .17, 0, lid);
      for (let i = 0; i < 6; i++) { const c = mk(GEO.cone, mat('#ffffff'), .07, .25, .07, 1.5, -.05, -.45 + i * .18, lid, false); c.rotation.x = Math.PI; }
      mk(GEO.box, mat('#c02a3a'), .6, .06, .4, .4, .92, 0, inner, false); eyes(inner, .6, 1.1, .3, .1, '#ff3030', '#000', true); break;
    }
    case 'crab': {
      mk(GEO.sph, body, 1.2, .5, 1, 0, .75, 0, inner); mk(GEO.sph, light, .9, .3, .75, .1, .9, 0, inner);
      for (const s of [-1, 1]) {
        const cl = new T3.Group(); cl.position.set(.8, .75, s * .85); inner.add(cl); parts.legs.push(cl);
        mk(GEO.sph, body, .45, .35, .35, .3, 0, 0, cl); mk(GEO.cone, body, .12, .45, .12, .7, .1, 0, cl).rotation.z = -1.6;
        for (let i = 0; i < 3; i++) { const l = mk(GEO.box, dark, .08, .7, .08, -.3 + i * .3, .35, s * 1, inner); l.rotation.x = s * .9; }
        mk(GEO.cyl, dark, .04, .4, .04, .5, 1.1, s * .2, inner); mk(GEO.sphL, mat('#111'), .09, .09, .09, .5, 1.32, s * .2, inner, false);
      }
      break;
    }
    case 'robot': {
      const m2 = mat(d.col, { metal: .8, rough: .35 }).clone(); parts.body = m2;
      for (const s of [-1, 1]) { const l = new T3.Group(); l.position.set(0, .7, s * .3); inner.add(l); mk(GEO.box, mat('#3a3a40', { metal: .7 }), .25, .7, .25, 0, -.35, 0, l); parts.legs.push(l); }
      mk(GEO.box, m2, .9, 1, 1, 0, 1.2, 0, inner); mk(GEO.cyl, mat('#ffb040', { em: 2 }), .15, .05, .15, .46, 1.3, 0, inner, false).rotation.z = Math.PI / 2;
      mk(GEO.box, m2, .55, .45, .6, 0, 1.98, 0, inner); mk(GEO.box, mat(d.pc || '#ff4030', { em: 3 }), .05, .1, .45, .28, 2.0, 0, inner, false);
      mk(GEO.cyl, mat('#555'), .03, .4, .03, 0, 2.38, 0, inner); mk(GEO.sphL, mat('#ff3030', { em: 3 }), .07, .07, .07, 0, 2.6, 0, inner, false);
      for (const s of [-1, 1]) mk(GEO.cyl, m2, .14, .9, .14, .1, 1.15, s * .65, inner);
      break;
    }
    case 'crystal': {
      const cm = mat(d.col, { em: .9, rough: .15, metal: .3, flat: true }).clone(); parts.body = cm;
      mk(GEO.oct, cm, .7, 1.4, .7, 0, 1.4, 0, inner, false);
      for (let i = 0; i < 5; i++) { const a = i * 1.256; const c = mk(GEO.oct, cm, .3, .7, .3, Math.cos(a) * .7, .6, Math.sin(a) * .7, inner, false); c.rotation.z = Math.cos(a) * .4; c.rotation.x = Math.sin(a) * .4; }
      const core = mk(GEO.sph, mat('#ffffff', { em: 3 }), .22, .22, .22, 0, 1.45, 0, inner, false); parts.spin.push(core); break;
    }
    case 'barrel': {
      mk(GEO.cyl, mat('#8a3a22'), .8, 1.5, .8, 0, .75, 0, inner);
      for (const y of [.25, 1.25]) { const r = mk(GEO.tor, mat('#3a3a3a', { metal: .7 }), .82, .82, .5, 0, y, 0, inner); r.rotation.x = Math.PI / 2; }
      mk(GEO.cyl, mat('#ffcc30', { em: .8 }), .81, .25, .81, 0, .75, 0, inner); mk(GEO.cyl, mat('#5a2a18'), .75, .05, .75, 0, 1.5, 0, inner); break;
    }
    case 'crate': {
      mk(GEO.box, body, 1.4, 1.4, 1.4, 0, .7, 0, inner);
      const e = mat('#5a4020'); for (const [x, z, sx, sz] of [[.68, 0, .08, 1.45], [-.68, 0, .08, 1.45], [0, .68, 1.45, .08], [0, -.68, 1.45, .08]]) mk(GEO.box, e, sx, 1.45, sz, x, .7, z, inner);
      const dg = mk(GEO.box, e, .1, 1.9, .08, .71, .7, 0, inner); dg.rotation.x = .78; break;
    }
    case 'dummy': {
      const straw = mat('#d8b860', { rough: .95 }), wood = mat('#6a4a2a');
      mk(GEO.cyl, wood, .12, 2.2, .12, 0, 1.1, 0, inner); mk(GEO.box, wood, .12, .12, 1.6, 0, 1.55, 0, inner);
      mk(GEO.caps, body, .7, .6, .6, 0, 1.25, 0, inner); mk(GEO.cyl, mat('#8a3a2a'), .62, .12, .62, 0, 1.0, 0, inner);
      mk(GEO.sph, straw, .4, .42, .4, 0, 2.05, 0, inner); for (const z of [-.13, .13]) mk(GEO.box, mat('#2a1a10'), .05, .06, .06, .36, 2.1, z, inner, false);
      mk(GEO.tor, mat('#c83a2a', { em: .3 }), .5, .5, .5, .62, 1.3, 0, inner, false).rotation.y = Math.PI / 2;
      mk(GEO.cyl, mat('#5a5a5a'), .7, .1, .7, 0, .05, 0, inner); break;
    }
    default: mk(GEO.sph, body, 1, 1, 1, 0, 1, 0, inner); eyes(inner, .8, 1.2, .3, .15);
  }
  decorate(parts, d, dark, light);
  if (d.sh !== 'turret') mk(GEO.circ, basic('#000000', { op: .3 }), 1.05, 1, 1.05, 0, .02, 0, g, false);
  if (isBoss) { const crown = new T3.Group(); crown.position.y = d.sh === 'turret' ? 2.4 : 2.6; inner.add(crown); for (let i = 0; i < 7; i++) { const a = i * .9; mk(GEO.cone, mat('#ffd040', { metal: .9, rough: .2, em: .4 }), .1, .35, .1, Math.cos(a) * .35, 0, Math.sin(a) * .35, crown, false); } parts.spin.push(crown); }
  return parts;
}
