// ================= 3D RENDERER =================
let R3 = null;
const _v3 = new T3.Vector3(), _m4 = new T3.Matrix4(), _q = new T3.Quaternion(), _s3 = new T3.Vector3(), _c3 = new T3.Color(), _e3 = new T3.Euler();
function Pool(make) { this.make = make; this.items = []; this.i = 0; }
Pool.prototype.get = function () { let m = this.items[this.i]; if (!m) { m = this.make(); this.items.push(m); R3.fx.add(m); } this.i++; m.visible = true; return m; };
Pool.prototype.end = function () { for (let k = this.i; k < this.items.length; k++) this.items[k].visible = false; this.i = 0; };
function quality() { return (S && S.opts.quality) || 'high'; }

function init3D() {
  initGeo();
  const renderer = new T3.WebGLRenderer({ canvas: cv3, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!window.PDB });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFSoftShadowMap;
  renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = T3.SRGBColorSpace;
  const scene = new T3.Scene();
  const cam = new T3.PerspectiveCamera(42, VW / VH, .1, 120);
  const hemi = new T3.HemisphereLight('#9ac0ff', '#2a3a1a', 1.2); scene.add(hemi);
  const sun = new T3.DirectionalLight('#ffe8c0', 1.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 1; sc.far = 50; sun.shadow.bias = -.0005; sun.shadow.normalBias = .05;
  scene.add(sun, sun.target);
  const plight = new T3.PointLight('#ffb070', 22, 10, 1.6); scene.add(plight);
  const lights = []; for (let i = 0; i < 6; i++) { const l = new T3.PointLight('#ffa040', 0, 8, 1.8); scene.add(l); lights.push(l); }
  const lvl = new T3.Group(), dyn = new T3.Group(), fx = new T3.Group(); scene.add(lvl, dyn, fx);
  // enemy bullets (instanced)
  const MAXB = 2500;
  const ebCore = new T3.InstancedMesh(GEO.sph, new T3.MeshBasicMaterial({ color: '#ffffff' }), MAXB);
  const ebGlow = new T3.InstancedMesh(GEO.sph, new T3.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .32, blending: T3.AdditiveBlending, depthWrite: false }), MAXB);
  ebCore.frustumCulled = ebGlow.frustumCulled = false; ebCore.count = ebGlow.count = 0;
  ebGlow.setColorAt(0, new T3.Color('#fff')); scene.add(ebCore, ebGlow);
  // particles
  const MAXP = 2200, pg = new T3.BufferGeometry();
  const ppos = new Float32Array(MAXP * 3), pcol = new Float32Array(MAXP * 4), psz = new Float32Array(MAXP);
  pg.setAttribute('position', new T3.BufferAttribute(ppos, 3)); pg.setAttribute('pcolor', new T3.BufferAttribute(pcol, 4)); pg.setAttribute('size', new T3.BufferAttribute(psz, 1));
  const pmat = new T3.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T3.AdditiveBlending,
    vertexShader: 'attribute float size; attribute vec4 pcolor; varying vec4 vC; uniform float uScale; void main(){ vC=pcolor; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*uScale/-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec4 vC; void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard; float a=smoothstep(.5,.0,d); gl_FragColor=vec4(vC.rgb*1.6, vC.a*a); }',
    uniforms: { uScale: { value: 300 } },
  });
  const points = new T3.Points(pg, pmat); points.frustumCulled = false; scene.add(points);
  // player
  const pl = makeHumanoid({ body: '#d8643c', cape: '#7a2a1a', hatType: 'helm' });
  scene.add(pl.g);
  const marker = new T3.Mesh(GEO.ring, basic('#ffffff', { op: .5, nd: 1, unique: 1 })); marker.renderOrder = 20; marker.scale.set(.45, 1, .45); scene.add(marker);
  const aim = new T3.Mesh(GEO.coneL, basic('#ffffff', { op: .55, nd: 1, unique: 1 })); aim.renderOrder = 20; aim.scale.set(.09, .22, .05); scene.add(aim);
  const reticle = new T3.Mesh(GEO.ring, basic('#ffd27a', { op: .6, nd: 1, unique: 1 })); reticle.renderOrder = 20; reticle.scale.set(.22, 1, .22); scene.add(reticle);
  let composer = null, bloom = null;
  try {
    composer = new THREEX.EffectComposer(renderer);
    composer.addPass(new THREEX.RenderPass(scene, cam));
    bloom = new THREEX.UnrealBloomPass(new T3.Vector2(VW, VH), .5, .4, .9); composer.addPass(bloom);
    composer.addPass(new THREEX.OutputPass());
  } catch (e) { composer = null; }
  R3 = {
    renderer, scene, cam, hemi, sun, plight, lights, lvl, dyn, fx, ebCore, ebGlow, MAXB, points, ppos, pcol, psz, MAXP, pmat, pl, marker, aim, reticle, composer, bloom,
    ray: new T3.Raycaster(), aimPlane: new T3.Plane(new T3.Vector3(0, 1, 0), -.7), ndc: new T3.Vector2(), frame: 0, torches: [], flames: [], anim: [], lightT: 0, wtype: null, levelId: -1, exitM: null,
    pools: {}, objs: new Map(), q: '',
  };
  const P_ = (geo, m) => () => { const o = new T3.Mesh(geo, m()); o.renderOrder = 5; return o; };
  const bm = (add) => () => new T3.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 1, depthWrite: false, blending: add ? T3.AdditiveBlending : T3.NormalBlending, side: T3.DoubleSide });
  R3.pools = {
    circ: new Pool(P_(GEO.circ, bm(false))), ring: new Pool(P_(GEO.ring, bm(true))), rect: new Pool(P_(GEO.rect, bm(false))), arc: new Pool(P_(GEO.circ, bm(true))),
    glow: new Pool(P_(GEO.sph, bm(true))), seg: new Pool(P_(GEO.cylL, () => new T3.MeshBasicMaterial({ color: '#ffffa0' }))), solid: new Pool(() => new T3.Mesh(GEO.sph, new T3.MeshStandardMaterial({ color: '#fff', roughness: .4 }))),
    arrow: new Pool(() => { const g = new T3.Group(); const s = mk(GEO.cylL, mat('#c8a070'), .02, .55, .02, 0, 0, 0, g, false); s.rotation.z = Math.PI / 2; const t = mk(GEO.coneL, mat('#dddddd', { metal: .8 }), .05, .14, .05, .3, 0, 0, g, false); t.rotation.z = -Math.PI / 2; mk(GEO.box, mat('#e8e8e8'), .12, .01, .08, -.24, 0, 0, g, false); return g; }),
    coin: new Pool(() => { const o = new T3.Mesh(GEO.cyl, mat('#ffd040', { metal: .9, rough: .25, em: .35 })); o.scale.set(.11, .025, .11); o.castShadow = true; return o; }),
    gem: new Pool(() => { const o = new T3.Mesh(GEO.oct, new T3.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: 1.2, roughness: .2, metalness: .3 })); o.scale.set(.13, .2, .13); return o; }),
    beam: new Pool(() => { const o = new T3.Mesh(GEO.cylL, new T3.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: .35, blending: T3.AdditiveBlending, depthWrite: false })); return o; }),
    torus: new Pool(() => new T3.Mesh(GEO.tor, new T3.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: .8, metalness: .7, roughness: .25 }))),
    box: new Pool(() => new T3.Mesh(GEO.box, new T3.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: .5 }))),
  };
  resize3D();
}
function resize3D() {
  if (!R3) return;
  const q = quality(), pr = q === 'low' ? 1 : q === 'medium' ? Math.min(DPR, 1.25) : Math.min(DPR, 1.75);
  R3.renderer.setPixelRatio(pr); R3.renderer.setSize(VW, VH, false); cv3.style.width = VW + 'px'; cv3.style.height = VH + 'px';
  if (R3.composer) { R3.composer.setPixelRatio(pr); R3.composer.setSize(VW, VH); }
  R3.cam.aspect = VW / VH; R3.cam.updateProjectionMatrix();
  R3.pmat.uniforms.uScale.value = VH * pr * .55;
  R3.renderer.shadowMap.enabled = q !== 'low';
  R3.sun.castShadow = q !== 'low';
  R3.q = q;
}
function mouseWorld() {
  if (!R3 || !P) return { x: P ? P.x : 0, y: P ? P.y : 0 };
  R3.ndc.set(mouse.x / VW * 2 - 1, -(mouse.y / VH) * 2 + 1); R3.ray.setFromCamera(R3.ndc, R3.cam);
  if (R3.ray.ray.intersectPlane(R3.aimPlane, _v3)) return { x: _v3.x * TILE, y: _v3.z * TILE };
  return { x: P.x + Math.cos(P.face) * 100, y: P.y + Math.sin(P.face) * 100 };
}
function proj(x, y, z) { _v3.set(x * U, z, y * U).project(R3.cam); return { x: (_v3.x + 1) / 2 * VW, y: (1 - _v3.y) / 2 * VH, vis: _v3.z < 1 && _v3.z > -1 }; }

// ---------- procedural texture ----------
const TEXC = {};
function noiseTex(kind) {
  if (TEXC[kind]) return TEXC[kind];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, 128, 128);
  const img = x.getImageData(0, 0, 128, 128), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = 200 + Math.random() * 55 - (Math.random() < .04 ? 50 : 0); d[i] = d[i + 1] = d[i + 2] = n; }
  x.putImageData(img, 0, 0);
  x.globalAlpha = .18;
  for (let i = 0; i < 14; i++) { x.fillStyle = Math.random() < .5 ? '#000' : '#fff'; x.beginPath(); x.ellipse(rnd(0, 128), rnd(0, 128), rnd(6, 26), rnd(4, 16), rnd(0, 3), 0, 6.3); x.fill(); }
  x.globalAlpha = .35; x.strokeStyle = '#555'; x.lineWidth = 1.2;
  if (kind === 'stone') { for (let i = 0; i < 5; i++) { x.beginPath(); let px = rnd(0, 128), py = rnd(0, 128); x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rnd(-20, 20); py += rnd(-20, 20); x.lineTo(px, py); } x.stroke(); } }
  if (kind === 'grass') { x.globalAlpha = .3; for (let i = 0; i < 160; i++) { x.strokeStyle = Math.random() < .5 ? '#fff' : '#666'; const px = rnd(0, 128), py = rnd(0, 128); x.beginPath(); x.moveTo(px, py); x.lineTo(px + rnd(-2, 2), py - rnd(3, 7)); x.stroke(); } }
  if (kind === 'wall') { x.globalAlpha = .4; x.strokeStyle = '#444'; x.lineWidth = 2; for (let r = 0; r < 4; r++) { x.beginPath(); x.moveTo(0, r * 32); x.lineTo(128, r * 32); x.stroke(); for (let k = 0; k < 3; k++) { const px = (k * 48 + (r % 2) * 24) % 128; x.beginPath(); x.moveTo(px, r * 32); x.lineTo(px, r * 32 + 32); x.stroke(); } } }
  const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 4;
  return TEXC[kind] = t;
}

// ---------- level building ----------
function disposeGroup(g) {
  g.traverse(o => { if (o.isMesh || o.isInstancedMesh) { if (o.userData.ownGeo) o.geometry.dispose(); if (o.userData.ownMat) o.material.dispose(); } });
  while (g.children.length) g.remove(g.children[0]);
}
function addInst(list, geo, material, shadow = true) {
  if (!list.length) return { userData: {} };
  const im = new T3.InstancedMesh(geo, material, list.length); im.userData.ownMat = false;
  const anyC = list.some(it => it.c);
  list.forEach((it, i) => {
    _e3.set(it.rx || 0, it.ry || 0, it.rz || 0); _q.setFromEuler(_e3);
    _m4.compose(_v3.set(it.x, it.y, it.z), _q, _s3.set(it.sx, it.sy, it.sz)); im.setMatrixAt(i, _m4);
    if (anyC) im.setColorAt(i, _c3.set(it.c || '#ffffff'));
  });
  im.castShadow = shadow; im.receiveShadow = true; R3.lvl.add(im); return im;
}
function tileFloor(x, y) { return x >= 0 && y >= 0 && x < M.w && y < M.h && M.t[y * M.w + x] === 1; }
function buildLevel() {
  if (!R3 || !M) return;
  disposeGroup(R3.lvl);
  // remove every per-entity model from the previous area (Map is mesh -> entity)
  R3.objs.forEach((obj, m) => { R3.dyn.remove(m); const pt = m.userData.parts; if (pt && pt.body && pt.body.dispose) pt.body.dispose(); if (obj) obj._m3 = null; });
  R3.objs.clear(); while (R3.dyn.children.length) R3.dyn.remove(R3.dyn.children[0]);
  if (R3.exitM) R3.fx.remove(R3.exitM); R3.exitM = null; R3.torches = []; R3.flames = []; R3.anim = [];
  for (const k in R3.pools) R3.pools[k].end();
  const R = curReg(), town = G.inTown;
  R3.scene.background = new T3.Color(R.bg);
  R3.scene.fog = new T3.Fog(R.bg, town ? 22 : 15, town ? 48 : 34);
  R3.hemi.color.set(R.sky); R3.hemi.groundColor.set(R.gnd); R3.hemi.intensity = town ? 1.2 : .8;
  R3.sun.color.set(R.sun); R3.sun.intensity = town ? 1.8 : 1.0;
  const stairT = G.stairs ? [Math.floor(G.stairs.x / TILE), Math.floor(G.stairs.y / TILE)] : null;
  // floor quads with vertex colors + grout
  const pos = [], col = [], uv = [], idx = []; let vi = 0;
  const cA = new T3.Color(R.fl), cB = new T3.Color(R.fl2), tmp = new T3.Color();
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
    if (!M.t[y * M.w + x]) continue;
    if (stairT && x === stairT[0] && y === stairT[1]) continue;
    const h = hash(x, y); tmp.copy(h & 1 ? cA : cB).multiplyScalar(.88 + (h % 100) / 400);
    if (h % 13 === 0) tmp.lerp(new T3.Color('#000'), .15);
    const in_ = .012, x0 = x + in_, x1 = x + 1 - in_, z0 = y + in_, z1 = y + 1 - in_;
    pos.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1);
    const r = (h >> 3) & 3, uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let k = 0; k < 4; k++) { const q = uvs[(k + r) % 4]; uv.push(q[0], q[1]); col.push(tmp.r, tmp.g, tmp.b); }
    idx.push(vi, vi + 2, vi + 1, vi, vi + 3, vi + 2); vi += 4;
  }
  const fg = new T3.BufferGeometry(); fg.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); fg.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); fg.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); fg.setIndex(idx); fg.computeVertexNormals();
  const ftex = noiseTex(R.dec === 'grass' || R.dec === 'reeds' ? 'grass' : 'stone');
  const floor = new T3.Mesh(fg, new T3.MeshStandardMaterial({ vertexColors: true, map: ftex, roughness: .92, metalness: 0 })); floor.receiveShadow = true; floor.userData.ownGeo = floor.userData.ownMat = true; R3.lvl.add(floor);
  const base = new T3.Mesh(new T3.PlaneGeometry(M.w + 40, M.h + 40).rotateX(-Math.PI / 2), new T3.MeshStandardMaterial({ color: shade3(R.fl, .5), roughness: 1 }));
  base.position.set(M.w / 2, -.02, M.h / 2); base.receiveShadow = true; base.userData.ownGeo = base.userData.ownMat = true; R3.lvl.add(base);
  // stairs pit
  if (stairT) {
    const sx = stairT[0], sz = stairT[1];
    const pit = new T3.Mesh(GEO.box, mat('#050508')); pit.scale.set(1, .1, 1); pit.position.set(sx + .5, -1.6, sz + .5); R3.lvl.add(pit);
    for (let i = 0; i < 5; i++) mk(GEO.box, mat(shade3(R.fl, .8 - i * .12)), 1, .3, .2, sx + .5, -.15 - i * .28, sz + .1 + i * .2, R3.lvl);
    for (const [dx, dz, w, d] of [[.5, -.04, 1.1, .12], [.5, 1.04, 1.1, .12], [-.04, .5, .12, 1.1], [1.04, .5, .12, 1.1]]) mk(GEO.box, mat(R.wt, { rough: .8 }), w, .14, d, sx + dx, .07, sz + dz, R3.lvl);
    const seal = new T3.Mesh(GEO.circ, basic('#ff3a3a', { op: .55, add: 1, unique: 1 })); seal.scale.set(.55, 1, .55); seal.position.set(sx + .5, .05, sz + .5); R3.lvl.add(seal);
    const beam = new T3.Mesh(GEO.cylL, basic('#ffb04a', { op: .0, add: 1, unique: 1 })); beam.scale.set(.5, 6, .5); beam.position.set(sx + .5, 3, sz + .5); R3.lvl.add(beam);
    R3.anim.push(() => { const o = G.stairsOpen; seal.material.color.set(o ? '#ffd27a' : '#ff3a3a'); seal.material.opacity = (o ? .5 : .35) + .2 * Math.sin(G.t * 4); beam.material.opacity = o ? .12 + .05 * Math.sin(G.t * 3) : 0; });
    R3.torches.push({ x: sx + .5, y: .8, z: sz + .5, col: '#ffb050', stair: 1 });
  }
  // walls + caps + wall decor
  const walls = [], caps = [], deco = {};
  const D = (k, it) => (deco[k] = deco[k] || []).push(it);
  const wallH = { tree: 1.0, column: .9, deadtree: 1.1, none: 1.6 }[R.wd] || 1.5;
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
    if (M.t[y * M.w + x]) continue;
    let adj = false; for (let oy = -1; oy <= 1 && !adj; oy++) for (let ox = -1; ox <= 1; ox++) if (tileFloor(x + ox, y + oy)) { adj = true; break; }
    if (!adj) continue;
    const h = hash(x, y), hh = wallH + ((h >> 4) % 100) / 100 * .5;
    const c = new T3.Color(R.wl).multiplyScalar(.85 + (h % 50) / 160);
    walls.push({ x: x + .5, y: 0, z: y + .5, sx: 1, sy: hh, sz: 1, c: '#' + c.getHexString() });
    caps.push({ x: x + .5, y: hh, z: y + .5, sx: 1.03, sy: .1, sz: 1.03, c: R.wt });
    const cx = x + .5, cz = y + .5, r1 = (h >> 8) % 100 / 100;
    const nearSide = tileFloor(x, y - 1) || tileFloor(x, y - 2) || tileFloor(x - 1, y - 1) || tileFloor(x + 1, y - 1); // walls between the camera and the room
    switch (nearSide && R.wd !== 'lava' && R.wd !== 'pipe' && R.wd !== 'rock' ? 'none' : R.wd) {
      case 'tree': if (h % 3 !== 0) { const s = .8 + r1 * .8; D('trunk', { x: cx, y: hh + .4 * s, z: cz, sx: .12 * s, sy: .8 * s, sz: .12 * s }); D('leafA', { x: cx, y: hh + 1.1 * s, z: cz, sx: .62 * s, sy: 1.1 * s, sz: .62 * s, c: pick(['#2e5a24', '#3a6a2a', '#2a4e20', '#46742e']) }); D('leafB', { x: cx, y: hh + 1.7 * s, z: cz, sx: .42 * s, sy: .9 * s, sz: .42 * s, c: pick(['#3a6a2a', '#4a7a30', '#355f26']) }); } break;
      case 'pillar': if (h % 5 === 0) { D('pillar', { x: cx, y: hh + .6, z: cz, sx: .28, sy: 1.2, sz: .28 }); } if (h % 11 === 0) D('candle', { x: cx + .2, y: hh + .15, z: cz, sx: .04, sy: .15, sz: .04 }); break;
      case 'rock': if (h % 3 === 0) D('rock', { x: cx, y: hh + .2, z: cz, sx: .5 + r1 * .4, sy: .35 + r1 * .5, sz: .5 + r1 * .3, ry: r1 * 6, c: pick(['#8a7050', '#7a6040', '#9a8058']) }); break;
      case 'deadtree': if (h % 4 === 0) { const s = .9 + r1; D('dtrunk', { x: cx, y: hh + .9 * s, z: cz, sx: .09 * s, sy: 1.8 * s, sz: .09 * s, rz: (r1 - .5) * .3 }); D('dbranch', { x: cx + .25, y: hh + 1.3 * s, z: cz, sx: .05, sy: .8, sz: .05, rz: -.9 }); D('dbranch', { x: cx - .2, y: hh + 1.0 * s, z: cz + .1, sx: .05, sy: .6, sz: .05, rz: .9 }); } break;
      case 'ice': if (h % 3 === 0) D('ice', { x: cx + (r1 - .5) * .4, y: hh + .5, z: cz, sx: .25 + r1 * .2, sy: .6 + r1 * .7, sz: .25, rz: (r1 - .5) * .5, ry: r1 * 3 }); break;
      case 'bigshroom': if (h % 4 === 0) { const s = .8 + r1 * .9; D('mstem', { x: cx, y: hh + .5 * s, z: cz, sx: .12 * s, sy: s, sz: .12 * s }); D('mcap', { x: cx, y: hh + s, z: cz, sx: .6 * s, sy: .4 * s, sz: .6 * s, c: pick(['#a050d0', '#50c0b0', '#d05090', '#7a60ff']) }); } break;
      case 'coral': if (h % 3 === 0) { D('coral', { x: cx, y: hh + .4, z: cz, sx: .1 + r1 * .1, sy: .8 + r1 * .6, sz: .1 + r1 * .1, rz: (r1 - .5) * .6, c: pick(['#ff6a8a', '#ffa040', '#c060ff', '#40e0d0']) }); D('coralb', { x: cx + .2, y: hh + .15, z: cz - .1, sx: .2, sy: .2, sz: .2, c: pick(['#ff80b0', '#ffd060', '#80ffd0']) }); } break;
      case 'lava': if (h % 4 === 0) D('lavaV', { x: cx + (r1 - .5) * .5, y: hh + .06, z: cz, sx: .5 + r1 * .3, sy: .02, sz: .07, ry: r1 * 6 }); if (h % 7 === 0) D('rock', { x: cx, y: hh + .2, z: cz, sx: .4, sy: .3, sz: .35, ry: r1 * 6, c: '#3a2420' }); break;
      case 'pipe': if (h % 4 === 0) D('pipe', { x: cx, y: hh + .2, z: cz, sx: .14, sy: 1, sz: .14, rz: Math.PI / 2, ry: (h % 2) * Math.PI / 2 }); if (h % 9 === 0) D('gear', { x: cx, y: hh + .35, z: cz, sx: .35, sy: .35, sz: .35, rx: Math.PI / 2 }); break;
      case 'column': if (h % 4 === 0) { const ch = .6 + r1 * 1.8; D('column', { x: cx, y: hh + ch / 2, z: cz, sx: .26, sy: ch, sz: .26 }); D('colcap', { x: cx, y: hh + ch, z: cz, sx: .5, sy: .12, sz: .5 }); } break;
      case 'crystal': case 'voidcrystal': if (h % 3 === 0) D('crys', { x: cx + (r1 - .5) * .3, y: hh + .45 + (R.wd === 'voidcrystal' ? .6 + r1 : 0), z: cz, sx: .18 + r1 * .15, sy: .5 + r1 * .7, sz: .18, rz: (r1 - .5) * .7, ry: r1 * 4 }); break;
    }
    // torches on faces next to floor
    if (!town && h % 17 === 0) {
      for (const [ox, oy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (tileFloor(x + ox, y + oy)) {
        const tx = cx + ox * .55, tz = cz + oy * .55;
        mk(GEO.box, mat('#3a2a1a'), .08, .3, .08, tx, 1.05, tz, R3.lvl, false);
        R3.flames.push(mk(GEO.sphL, mat(R.torch, { em: 3.5 }), .09, .14, .09, tx, 1.28, tz, R3.lvl, false));
        R3.torches.push({ x: tx + ox * .3, y: 1.4, z: tz + oy * .3, col: R.torch }); break;
      }
    }
  }
  const wallMat = new T3.MeshStandardMaterial({ vertexColors: true, map: noiseTex('wall'), roughness: .88 });
  addInst(walls, GEO.wall, wallMat).userData.ownMat = true;
  addInst(caps, GEO.box, R.wd === 'lava' ? mat('#ffffff', { rough: .9, em: .07, emc: '#ff3a10' }) : mat('#ffffff', { rough: .85 }));
  const DM = {
    trunk: [GEO.cylL, mat('#4a3020')], leafA: [GEO.coneL, mat('#ffffff', { flat: true })], leafB: [GEO.coneL, mat('#ffffff', { flat: true })],
    pillar: [GEO.cyl, mat(R.wt)], candle: [GEO.cylL, mat('#ffe0a0', { em: 2.5 })], rock: [GEO.dod, mat('#ffffff', { flat: true })],
    dtrunk: [GEO.cylL, mat('#2a2018')], dbranch: [GEO.cylL, mat('#2a2018')], ice: [GEO.oct, mat('#a8e0ff', { em: .5, rough: .1, op: .85, flat: true })],
    mstem: [GEO.cylL, mat('#e8e0d0')], mcap: [GEO.hemi, mat('#ffffff', { em: .14 })], coral: [GEO.cylL, mat('#ffffff', { em: .25 })], coralb: [GEO.sphL, mat('#ffffff', { em: .2 })],
    pipe: [GEO.cyl, mat('#9a7a40', { metal: .8, rough: .35 })], gear: [GEO.tor, mat('#c8a050', { metal: .85, rough: .3 })],
    column: [GEO.cyl, mat('#e0e0f0')], colcap: [GEO.box, mat('#d0d0e8')], lavaV: [GEO.box, mat('#ff6020', { em: 2.4 })], crys: [GEO.oct, mat(R.wd === 'voidcrystal' ? '#b050ff' : '#a090ff', { em: 1.6, rough: .1, flat: true })],
  };
  for (const k in deco) if (DM[k]) addInst(deco[k], DM[k][0], DM[k][1]);
  // floor decor
  const fdec = {}; const F = (k, it) => (fdec[k] = fdec[k] || []).push(it);
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
    if (!M.t[y * M.w + x]) continue; const h = hash(x + 7, y + 3); if (h % 8) continue;
    const ox = x + .2 + (h >> 5) % 60 / 100, oz = y + .2 + (h >> 11) % 60 / 100, r1 = (h >> 7) % 100 / 100;
    if (G.stairs && Math.abs(ox - G.stairs.x * U) < 1 && Math.abs(oz - G.stairs.y * U) < 1) continue;
    switch (R.dec) {
      case 'grass': for (let i = 0; i < 3; i++) F('tuft', { x: ox + i * .06, y: .08, z: oz + (i % 2) * .05, sx: .03, sy: .16 + r1 * .1, sz: .03, rz: (i - 1) * .3, c: pick(['#5a8a3a', '#6a9a40', '#4a7a30']) }); if (h % 3 === 0) F('flower', { x: ox + .1, y: .18, z: oz, sx: .04, sy: .04, sz: .04, c: pick(['#ffe060', '#ff7090', '#a0a0ff', '#ffffff']) }); break;
      case 'bones': F('bone', { x: ox, y: .03, z: oz, sx: .03, sy: .3, sz: .03, rz: Math.PI / 2, ry: r1 * 6 }); if (h % 4 === 0) F('skull', { x: ox + .15, y: .08, z: oz, sx: .09, sy: .08, sz: .08 }); break;
      case 'sand': F('pebble', { x: ox, y: .03, z: oz, sx: .08 + r1 * .08, sy: .05, sz: .07, ry: r1 * 6, c: pick(['#7a6040', '#9a8058', '#6a5030']) }); break;
      case 'reeds': for (let i = 0; i < 4; i++) F('reed', { x: ox + i * .05, y: .25, z: oz + (i % 2) * .06, sx: .015, sy: .5 + r1 * .3, sz: .015, rz: (i - 1.5) * .12, c: pick(['#6a7a3a', '#5a6a2a', '#8a7a4a']) }); if (h % 3 === 0) F('pool', { x: ox, y: .01, z: oz, sx: .35, sy: .01, sz: .25 }); break;
      case 'snow': F('mound', { x: ox, y: 0, z: oz, sx: .14 + r1 * .12, sy: .06, sz: .12 + r1 * .08 }); break;
      case 'shroom': F('sstem', { x: ox, y: .06, z: oz, sx: .02, sy: .12, sz: .02 }); F('scap', { x: ox, y: .12, z: oz, sx: .07, sy: .05, sz: .07, c: pick(['#c060ff', '#40ffd0', '#ff60a0']) }); break;
      case 'coral': F('coral2', { x: ox, y: .12, z: oz, sx: .04, sy: .25, sz: .04, rz: (r1 - .5), c: pick(['#ff6a8a', '#ffa040', '#c060ff', '#40e0d0']) }); if (h % 4 === 0) F('shell', { x: ox + .1, y: .03, z: oz, sx: .07, sy: .04, sz: .07, c: '#f0d0c0' }); break;
      case 'ember': F('crack', { x: ox, y: .01, z: oz, sx: .4 + r1 * .3, sy: .01, sz: .04, ry: r1 * 6 }); break;
      case 'gear': F('fgear', { x: ox, y: .02, z: oz, sx: .14, sy: .14, sz: .14, rx: Math.PI / 2 }); break;
      case 'cloud': F('pebble', { x: ox, y: .03, z: oz, sx: .1, sy: .06, sz: .08, c: '#b0b0c8' }); break;
      case 'crystal': F('fcrys', { x: ox, y: .08, z: oz, sx: .05, sy: .14 + r1 * .1, sz: .05, rz: (r1 - .5) * .6, c: pick(['#a0a0ff', '#e0a0ff', '#80e0ff']) }); break;
      case 'void': F('vmote', { x: ox, y: .3 + r1 * .6, z: oz, sx: .04, sy: .04, sz: .04 }); break;
      case 'town': if (h % 4 === 0) F('flower', { x: ox, y: .12, z: oz, sx: .05, sy: .05, sz: .05, c: pick(['#ffe060', '#ff7090', '#ffffff']) }); break;
    }
    if (h % 37 === 0 && R.dec !== 'town') F('rockS', { x: ox, y: .08, z: oz, sx: .18, sy: .12, sz: .15, ry: r1 * 5, c: shade3(R.wl, 1.6) });
  }
  const FM = {
    tuft: [GEO.coneL, mat('#ffffff')], flower: [GEO.sphL, mat('#ffffff', { em: .1 })], bone: [GEO.cylL, mat('#d8d0c0')], skull: [GEO.sphL, mat('#e0d8c8')],
    pebble: [GEO.dod, mat('#ffffff', { flat: true })], reed: [GEO.cylL, mat('#ffffff')], pool: [GEO.cyl, mat('#3a1a1a', { rough: .05, metal: .3 })], mound: [GEO.sphL, mat('#dce6f0')],
    sstem: [GEO.cylL, mat('#e0e0d0')], scap: [GEO.hemi, mat('#ffffff', { em: .8 })], coral2: [GEO.coneL, mat('#ffffff', { em: .3 })], shell: [GEO.hemi, mat('#ffffff')],
    crack: [GEO.box, mat('#ff6020', { em: 2.2 })], fgear: [GEO.tor, mat('#a08040', { metal: .8 })], flavaV: [GEO.box, mat('#ff6020', { em: 2.4 })], crys: [GEO.oct, mat('#ffffff', { em: .45, flat: true })], vmote: [GEO.sphL, mat('#c070ff', { em: 1.5 })],
    rockS: [GEO.dod, mat('#ffffff', { flat: true })],
  };
  for (const k in fdec) if (FM[k]) addInst(fdec[k], FM[k][0], FM[k][1], k === 'rockS' || k === 'pebble');
  // chests, shrines, traps
  for (const c of G.chests) {
    const g = new T3.Group(); g.position.set(c.x * U, 0, c.y * U); g.rotation.y = hash(c.x | 0, c.y | 0) % 4 * Math.PI / 2;
    mk(GEO.box, mat('#8a5a20'), .55, .32, .38, 0, .16, 0, g); const gold = mat('#e0b040', { metal: .85, rough: .3 });
    for (const x of [-.2, .2]) mk(GEO.box, gold, .04, .34, .4, x, .17, 0, g);
    const lid = new T3.Group(); lid.position.set(0, .32, -.19); g.add(lid); mk(GEO.box, mat('#a06a28'), .55, .12, .38, 0, .06, .19, lid); mk(GEO.box, gold, .08, .1, .04, 0, .02, .39, lid);
    const glow = mk(GEO.sphL, basic('#ffd040', { op: 0, add: 1, unique: 1 }), .25, .15, .25, 0, .35, 0, g, false);
    R3.lvl.add(g); c._g = g;
    R3.anim.push(() => { g.visible = !c.gone; const tgt = c.open ? -1.9 : 0; lid.rotation.x += (tgt - lid.rotation.x) * .2; glow.material.opacity = c.open ? Math.max(0, glow.material.opacity - .02) : .25 + .1 * Math.sin(G.t * 3); });
  }
  for (const s of G.shrines) {
    const g = new T3.Group(); g.position.set(s.x * U, 0, s.y * U);
    mk(GEO.cyl, mat('#6a6470', { rough: .9 }), .38, .15, .38, 0, .07, 0, g); mk(GEO.cyl, mat('#7a7480'), .18, .8, .18, 0, .55, 0, g); mk(GEO.cyl, mat('#8a8490'), .3, .1, .3, 0, .98, 0, g);
    const orb = mk(GEO.ico, mat(s.s.col, { em: 2.5, flat: true }), .18, .18, .18, 0, 1.4, 0, g, false);
    const rg = mk(GEO.torThin, mat(s.s.col, { em: 2 }), .32, .32, .32, 0, 1.4, 0, g, false);
    R3.lvl.add(g); R3.torches.push({ x: s.x * U, y: 1.5, z: s.y * U, col: s.s.col, shrine: s });
    R3.anim.push(() => { orb.visible = rg.visible = !s.used; orb.rotation.y = G.t * 1.5; orb.position.y = 1.4 + Math.sin(G.t * 2) * .08; rg.rotation.x = G.t; rg.rotation.y = G.t * .7; });
  }
  for (const t of G.traps) {
    const g = new T3.Group(); g.position.set(t.x * U, 0, t.y * U);
    mk(GEO.box, mat('#4a4a50', { metal: .6, rough: .5 }), .82, .04, .82, 0, .02, 0, g);
    const warn = mk(GEO.box, basic('#ff3a2a', { op: 0, add: 1, unique: 1 }), .8, .01, .8, 0, .05, 0, g, false);
    const sp = new T3.Group(); g.add(sp);
    for (let i = 0; i < 9; i++) mk(GEO.coneL, mat('#c8c8d0', { metal: .85, rough: .25 }), .06, .4, .06, ((i % 3) - 1) * .25, .2, (Math.floor(i / 3) - 1) * .25, sp);
    R3.lvl.add(g);
    R3.anim.push(() => { const ty = t.up ? 0 : -.42; sp.position.y += (ty - sp.position.y) * .4; warn.material.opacity = t.warn ? .35 + .3 * Math.sin(G.t * 30) : 0; });
  }
  if (G.memory) {
    const mm = G.memory, h = makeHumanoid({ body: '#ffe9a0', hatType: 'hood', hat: '#fff4c0' });
    h.g.traverse(o => { if (o.isMesh) { o.material = new T3.MeshStandardMaterial({ color: '#ffe9a0', emissive: '#ffcf6b', emissiveIntensity: 1.4, transparent: true, opacity: .55, depthWrite: false }); o.castShadow = false; } });
    h.g.position.set(mm.x * U, 0, mm.y * U); h.g.scale.setScalar(1.1); R3.lvl.add(h.g);
    const ring = mk(GEO.ring, basic('#ffe9a0', { op: .7, add: 1, unique: 1 }), .6, 1, .6, mm.x * U, .04, mm.y * U, R3.lvl, false);
    R3.torches.push({ x: mm.x * U, y: 1.5, z: mm.y * U, col: '#ffe080' });
    R3.anim.push(() => { h.g.visible = ring.visible = !mm.used; h.g.position.y = .15 + Math.sin(G.t * 2) * .1; h.g.rotation.y = G.t * .5; if (Math.random() < .3 && !mm.used) G.parts.push({ x: mm.x + rnd(-14, 14), y: mm.y + rnd(-14, 14), z: rnd(0, 1.2), vx: 0, vy: 0, vz: .8, g: 0, life: 1, max: 1, col: '#ffe9a0', size: 3 }); });
  }
  if (town) buildTown();
  if (G.boss) { for (const [x, z] of [[8, 8], [32, 8], [8, 24], [32, 24], [20, 5]]) { mk(GEO.cyl, mat(R.wt), .2, 1.2, .2, x + .5, .6, z + .5, R3.lvl); R3.flames.push(mk(GEO.sphL, mat(R.torch, { em: 3.5 }), .15, .22, .15, x + .5, 1.35, z + .5, R3.lvl, false)); R3.torches.push({ x: x + .5, y: 1.6, z: z + .5, col: R.torch }); } }
  buildExtras();
  R3.levelId = G.levelId;
}
function buildTown() {
  const L = R3.lvl;
  // cobblestone plaza center + fountain
  const fx = 19.5, fz = 13.5;
  mk(GEO.cyl, mat('#7a7068'), 1.6, .4, 1.6, fx, .2, fz, L); mk(GEO.cyl, mat('#3a6a9a', { rough: .05, metal: .2 }), 1.4, .05, 1.4, fx, .4, fz, L);
  mk(GEO.cyl, mat('#8a8078'), .25, 1.2, .25, fx, .9, fz, L); mk(GEO.cyl, mat('#8a8078'), .6, .12, .6, fx, 1.5, fz, L);
  const fl = mk(GEO.sph, mat('#ff9a2a', { em: 3 }), .22, .32, .22, fx, 1.85, fz, L, false); R3.flames.push(fl);
  R3.torches.push({ x: fx, y: 2.2, z: fz, col: '#ffb050' });
  // houses around the edges
  const house = (x, z, w, d, wall, roof, rot = 0) => {
    const g = new T3.Group(); g.position.set(x, 0, z); g.rotation.y = rot; L.add(g);
    mk(GEO.box, mat(wall), w, 1.6, d, 0, .8, 0, g); mk(GEO.box, mat('#5a3a22'), w + .05, .12, d + .05, 0, 1.6, 0, g);
    const r = mk(GEO.cone, mat(roof, { flat: true }), w * .78, 1.2, d * .78, 0, 2.25, 0, g); r.rotation.y = Math.PI / 4;
    mk(GEO.box, mat('#4a2a16'), .35, .7, .05, 0, .35, d / 2 + .01, g); mk(GEO.box, mat('#ffd070', { em: 1.6 }), .3, .3, .05, w * .28, 1, d / 2 + .01, g, false);
  };
  for (let i = 0; i < 6; i++) { house(5 + i * 5.6, 1.2, 2.6, 2, pick(['#c8b090', '#b8a080', '#d0c0a0']), pick(['#8a3a2a', '#6a4a3a', '#4a5a7a'])); house(5 + i * 5.6, 26.8, 2.6, 2, pick(['#c8b090', '#b8a080']), pick(['#8a3a2a', '#5a6a3a']), Math.PI); }
  for (let i = 0; i < 4; i++) { house(1.2, 6 + i * 5.5, 2, 2.4, '#c0a888', '#7a3a2a', Math.PI / 2); house(36.8, 6 + i * 5.5, 2, 2.4, '#c0a888', '#4a5a7a', -Math.PI / 2); }
  // lamps & trees
  for (const [x, z] of [[13, 10], [26, 10], [13, 17.5], [26, 17.5], [19.5, 22], [7, 14], [32, 14]]) {
    mk(GEO.cyl, mat('#2a2a30', { metal: .6 }), .05, 1.8, .05, x, .9, z, L); mk(GEO.box, mat('#2a2a30'), .22, .05, .22, x, 1.82, z, L);
    R3.flames.push(mk(GEO.sphL, mat('#ffc060', { em: 3 }), .1, .12, .1, x, 1.72, z, L, false)); R3.torches.push({ x, y: 1.9, z, col: '#ffb060' });
  }
  for (const [x, z] of [[4.5, 4.5], [34, 4.5], [4.5, 24], [34, 24], [14, 4.2], [25, 4.2], [14, 24.5], [25, 24.5]]) { mk(GEO.cylL, mat('#4a3020'), .14, 1, .14, x, .5, z, L); mk(GEO.coneL, mat('#3a6a2a', { flat: true }), .8, 1.4, .8, x, 1.6, z, L); mk(GEO.coneL, mat('#4a7a30', { flat: true }), .6, 1.1, .6, x, 2.3, z, L); }
  // NPC structures + figures
  for (const n of G.npcs) {
    const g = new T3.Group(); g.position.set(n.x * U, 0, n.y * U); L.add(g);
    const fig = (o, x, z) => { const h = makeHumanoid(o); h.g.position.set(x, 0, z); h.g.rotation.y = -Math.atan2(17.5 - (n.y * U + z), 19.5 - (n.x * U + x)); g.add(h.g); const seed = x * 7 + n.x; R3.anim.push(() => npcAnim(h, n, seed)); return h; };
    if (n.kind === 'portal') {
      mk(GEO.cyl, mat('#5a5468', { rough: .9 }), 1.3, .2, 1.3, 0, .1, 0, g);
      for (const s of [-1, 1]) mk(GEO.box, mat('#6a6478', { flat: true }), .35, 2.6, .35, s * 1, 1.3, 0, g);
      mk(GEO.box, mat('#6a6478'), 2.4, .35, .4, 0, 2.7, 0, g);
      const pr = mk(GEO.circ, basic('#ff9a3a', { op: .65, add: 1, unique: 1 }), .82, 1, 1.15, 0, 1.3, 0, g, false); pr.rotation.x = Math.PI / 2;
      const r1 = mk(GEO.tor, mat('#ffb04a', { em: 2.5 }), .85, .85, .85, 0, 1.3, 0, g, false);
      R3.anim.push(() => { r1.rotation.z = G.t * 1.5; pr.material.opacity = .45 + .2 * Math.sin(G.t * 3); });
      R3.torches.push({ x: n.x * U, y: 1.4, z: n.y * U + .6, col: '#ff9a3a' });
    } else if (n.kind === 'stash') {
      mk(GEO.box, mat('#7a4a20'), 1.1, .6, .7, 0, .3, 0, g); for (const x of [-.4, .4]) mk(GEO.box, mat('#d8b040', { metal: .8, rough: .3 }), .08, .64, .74, x, .32, 0, g);
      const lid = mk(GEO.box, mat('#8a5a28'), 1.12, .2, .72, 0, .7, 0, g); mk(GEO.box, mat('#ffd040', { metal: .9, em: .5 }), .14, .16, .06, 0, .5, .37, g);
      const gl = mk(GEO.sphL, basic('#ffd27a', { op: .25, add: 1, unique: 1 }), .7, .4, .5, 0, .75, 0, g, false); R3.anim.push(() => { gl.material.opacity = .15 + .1 * Math.sin(G.t * 2); });
    } else if (n.kind === 'board') {
      for (const s of [-1, 1]) mk(GEO.box, mat('#5a3a20'), .12, 1.6, .12, s * .7, .8, 0, g);
      mk(GEO.box, mat('#8a6a40'), 1.7, 1, .08, 0, 1.2, 0, g); mk(GEO.box, mat('#5a3a20'), 1.9, .15, .3, 0, 1.78, 0, g);
      for (let i = 0; i < 5; i++) mk(GEO.box, mat('#f0e4c0'), .28, .36, .02, -.6 + i * .3, 1.2 + (i % 2) * .08, .05, g, false);
    } else {
      const roof = { shop: '#c84a3a', smith: '#5a5a6a', sage: '#4a5ab0', jewel: '#2a8a8a', curio: '#8a3a8a' }[n.kind];
      for (const [x, z] of [[-.9, -.6], [.9, -.6], [-.9, .6], [.9, .6]]) mk(GEO.box, mat('#5a3a22'), .1, 1.9, .1, x, .95, z, g);
      const awn = mk(GEO.box, mat(roof), 2.1, .08, 1.5, 0, 1.95, 0, g); awn.rotation.x = .12;
      mk(GEO.box, mat('#7a5030'), 1.8, .7, .5, 0, .35, .5, g);
      if (n.kind === 'shop') { for (let i = 0; i < 4; i++) mk(GEO.box, mat(pick(['#d8a040', '#a04030', '#4a8a4a'])), .2, .2, .2, -.6 + i * .4, .8, .5, g); fig({ body: '#c89040', hatType: 'hair', hair: '#8a3a1a' }, 0, -.15); }
      if (n.kind === 'smith') { mk(GEO.box, mat('#3a3a40', { metal: .7 }), .5, .3, .3, .5, .85, .5, g); const forge = mk(GEO.box, mat('#ff6020', { em: 2.5 }), .5, .2, .4, -.6, .8, .5, g, false); R3.flames.push(forge); R3.torches.push({ x: n.x * U - .6, y: 1.2, z: n.y * U + .6, col: '#ff6020' }); fig({ body: '#7a4030', hatType: 'hair', hair: '#2a2a2a' }, 0, -.15); }
      if (n.kind === 'jewel') { for (let i = 0; i < 5; i++) mk(GEO.oct, mat(pick(['#ff4a5a', '#4a8aff', '#4ae07a', '#ffd54a', '#b06aff']), { em: 1.5, flat: true }), .08, .12, .08, -.6 + i * .3, .82, .5, g, false); fig({ body: '#2a7a7a', hatType: 'hair', hair: '#e0e0e0' }, 0, -.15); }
      if (n.kind === 'curio') { mk(GEO.box, mat('#ff9a3a', { em: .8 }), .5, .25, .3, -.4, .82, .5, g, false); mk(GEO.sph, mat('#ffd54a', { em: 1 }), .1, .1, .1, .4, .85, .5, g, false); fig({ body: '#8a3a8a', hatType: 'helm' }, 0, -.15); }
      if (n.kind === 'sage') { for (let i = 0; i < 3; i++) mk(GEO.box, mat(pick(['#4a5ab0', '#8a3a6a', '#3a7a5a'])), .18, .25, .3, -.5 + i * .25, .82, .5, g); mk(GEO.sph, mat('#a0c0ff', { em: 2 }), .12, .12, .12, .5, .85, .5, g, false); fig({ body: '#5a6ad0', hatType: 'wizard', hat: '#3a4ab0' }, 0, -.15); }
    }
  }
}

// ---------- per-frame sync ----------
function syncObj(key, obj, create) {
  let m = obj._m3;
  if (!m || m._lvl !== R3.levelId) { m = create(obj); m._lvl = R3.levelId; obj._m3 = m; R3.dyn.add(m); R3.objs.set(m, obj); }
  m._seen = R3.frame; return m;
}
function VSC(e) { return e.prop ? 1.15 : e.boss ? 1.2 : (1.35 * e.r + 4) / e.r; }
function enemyMesh(e) {
  const parts = makeEnemyModel(e.d, e.boss);
  const g = parts.g; g.userData.parts = parts; g.userData.enemy = 1;
  const s = e.r * U * VSC(e); g.scale.setScalar(s);
  if (e.elite || e.boss) { const rg = new T3.Mesh(GEO.ring, basic(e.boss ? (e.d.pc || '#ff3a3a') : ELITES[e.elite], { op: .8, add: 1, unique: 1 })); rg.position.y = .04 / s; rg.scale.setScalar(1.35); g.add(rg); parts.ring = rg; }
  g.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); // avoids shadow-acne stripes on small curved models
  if (e.type === 'gimp') { parts.body.metalness = .9; parts.body.roughness = .2; parts.body.emissive = new T3.Color('#ffb020'); parts.body.emissiveIntensity = .5; }
  return g;
}
function animEnemy(e, g) {
  const p = g.userData.parts, t = G.t + e.t;
  g.position.set(e.x * U, 0, e.y * U);
  let sc = e.r * U * VSC(e); if (e.st === 'fuse') sc *= 1 + .15 * Math.sin(G.t * 40); if (e.st === 'wind' && e.d.ai === 'tank') sc *= 1.08;
  if (e.spawnT === undefined) e.spawnT = 0; if (e.spawnT < 1) { e.spawnT = Math.min(1, e.spawnT + .08); sc *= e.spawnT; }
  g.scale.setScalar(sc);
  if (e.d.sh !== 'turret' && !e.prop) { const tgt = -(e.face ?? 0); let dr = tgt - g.rotation.y; while (dr > Math.PI) dr -= 6.283; while (dr < -Math.PI) dr += 6.283; g.rotation.y += dr * .25; }
  const floaty = { bat: 1, ghost: 1, orb: 1 }[e.d.sh];
  p.inner.position.y = floaty ? Math.sin(t * 3) * .15 : Math.abs(Math.sin(e.mv * .05)) * .12;
  if (e.d.sh === 'blob') { const w = 1 + Math.sin(t * 7) * .07; p.inner.scale.set(w, 1 / w, w); }
  else { const br = 1 + Math.sin(t * 2.2) * .025 - (e.flash > 0 ? .08 : 0); p.inner.scale.set(1 / Math.sqrt(br), br, 1 / Math.sqrt(br)); }
  const lean = e.st === 'wind' || e.cast > 0 ? -.28 : e.st === 'dash' ? -.18 : e.flash > 0 ? .14 : 0; p.inner.rotation.z += (lean - p.inner.rotation.z) * .25;
  p.legs.forEach((l, i) => { if (e.d.sh === 'eye') l.rotation.x = Math.PI + Math.sin(t * 3 + i) * .4; else l.rotation.z = Math.sin(e.mv * .06 + i * Math.PI) * .6; });
  p.wings.forEach(w => w.g.rotation.x = w.s * Math.sin(t * 18) * .7);
  p.spin.forEach((o, i) => { o.rotation.y = t * (2 + i); });
  if (p.head) p.head.rotation.y = -e.ang;
  if (p.eye) { const a = ang(e, P); p.eye.rotation.y = -a - g.rotation.y; }
  if (p.lid) p.lid.rotation.z = e.mimic || e.d.sh === 'chest' ? .3 + Math.abs(Math.sin(t * 8)) * .5 : 0;
  if (p.ring) { p.ring.material.opacity = .5 + .3 * Math.sin(G.t * 5); p.ring.rotation.y = G.t; }
  const b = p.body;
  if (b.emissive) {
    if (e.flash > 0) { b.emissive.set('#ffffff'); b.emissiveIntensity = 1.4; }
    else if (e.frz > 0) { b.emissive.set('#60c0ff'); b.emissiveIntensity = .6; }
    else if (e.psn > 0) { b.emissive.set('#40ff20'); b.emissiveIntensity = .35; }
    else if (e.burn > 0) { b.emissive.set('#ff6010'); b.emissiveIntensity = .4 + .2 * Math.sin(G.t * 20); }
    else if (e.st === 'wind' || e.st === 'fuse' || e.cast > 0) { b.emissive.set('#ff2020'); b.emissiveIntensity = .5 + .4 * Math.sin(G.t * 25); }
    else if (e.boss && e.des) { b.emissive.set('#ff2050'); b.emissiveIntensity = .4 + .3 * Math.sin(G.t * 6); }
    else if (e.type === 'gimp') { b.emissive.set('#ffb020'); b.emissiveIntensity = .5; }
    else if (!b.userData.base) { b.userData.base = 1; b.emissive.set('#000000'); b.emissiveIntensity = 0; }
    else { b.emissiveIntensity = e.d.sh === 'orb' ? 1.6 : e.d.sh === 'crystal' ? .9 : e.d.sh === 'ghost' ? .5 : 0; b.emissive.set(e.d.sh === 'orb' || e.d.sh === 'crystal' || e.d.sh === 'ghost' ? e.d.col : '#000000'); }
  }
  if (e.stun > 0 && Math.random() < .3) G.parts.push({ x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 8), z: e.r * U * 2.6, vx: 0, vy: 0, vz: 0, g: 0, life: .3, max: .3, col: '#ffe060', size: 3 });
}
function animPlayer(dt) {
  const pl = R3.pl, p = P;
  const wt = ST.wt;
  if (R3.wtype !== wt) { while (pl.hand.children.length) pl.hand.remove(pl.hand.children[0]); pl.hand.add(makeWeapon(wt)); R3.wtype = wt; }
  const wantCol = S.cos && S.cos.color || CLS[S.cls].col;
  if (R3.cls !== S.cls || R3.colr !== wantCol) {
    R3.scene.remove(pl.g); const c = CLS[S.cls]; R3.colr = wantCol;
    R3.pl = makeHumanoid({ body: wantCol, cape: shade3(wantCol, .45), hatType: { warrior: 'helm', ranger: 'hood', mage: 'wizard' }[S.cls] }); R3.pl.g.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); R3.scene.add(R3.pl.g); R3.cls = S.cls; R3.wtype = null; return;
  }
  pl.g.visible = G.mode !== 'dead';
  let y = 0; if (p.air > 0) { const k = 1 - p.air / .45; y = Math.sin(k * Math.PI) * 2.2; }
  pl.g.position.set(p.x * U, y, p.y * U);
  let yaw = -p.face, roll = 0, spin = 0;
  if (p.dodgeT > 0) { yaw = -Math.atan2(p.dvy, p.dvx); roll = -(1 - p.dodgeT / .24) * 6.283; }
  if (p.whirl > 0) spin = G.t * 16;
  pl.g.rotation.y = yaw; pl.root.rotation.set(0, spin, roll);
  const mv = p.moving && p.dodgeT <= 0 ? 1 : 0, sw = Math.sin(p.walk);
  pl.legL.rotation.z = sw * .7 * mv; pl.legR.rotation.z = -sw * .7 * mv;
  if (pl.cape) { pl.cape.rotation.z += ((-.08 - mv * .35 - Math.sin(p.walk) * .04 * mv) - pl.cape.rotation.z) * .2; pl.cape.userData.low.rotation.z = -.2 * mv + Math.sin(G.t * 3) * .04; } pl.root.position.y = Math.abs(Math.cos(p.walk)) * .05 * mv;
  // arms
  const w = WT[wt]; let ry = 0, rz = .15, lx = 0;
  if (p.swingT > 0 && (p.swingK === 'arc' || p.swingK === 'spin')) { const mx = p.swingK === 'spin' ? .22 : .16, k = 1 - p.swingT / mx; rz = Math.PI / 2; ry = p.swingK === 'spin' ? 0 : (k - .5) * -(w.arc || 1.8) * 1.1; if (p.swingK === 'spin') pl.root.rotation.y = k * 6.283; }
  else if (p.swingT > 0 && p.swingK === 'thrust') { const k = 1 - p.swingT / .14; rz = Math.PI / 2; lx = Math.sin(k * Math.PI) * .35; }
  else if (p.swingT > 0 && p.swingK === 'slam') { const k = 1 - p.swingT / .22; rz = Math.PI * (1 - k * .75); }
  else if (p.atkAnim > 0) rz = Math.PI / 2;
  else if (w.k === 'shot' || w.k === 'orb' || w.k === 'boom' || w.k === 'fan') rz = .6;
  if (p.whirl > 0) { rz = Math.PI / 2; }
  pl.armR.rotation.y += (ry - pl.armR.rotation.y) * (p.swingT > 0 ? 1 : .3); pl.armR.rotation.z += (rz - pl.armR.rotation.z) * (p.swingT > 0 ? 1 : .35); pl.armR.position.x = lx;
  pl.armL.rotation.z = p.atkAnim > 0 && p.swingK === 'cast' ? Math.PI / 2 : -sw * .5 * mv + .1;
  // flash on hurt
  pl.body.emissive.set(p.inv > 0 && p.inv > .2 ? '#ff2020' : buff('surge') ? '#ff7020' : '#000000'); pl.body.emissiveIntensity = p.inv > .2 ? .8 : buff('surge') ? .5 + .3 * Math.sin(G.t * 8) : 0;
  // markers
  R3.marker.position.set(p.x * U, .03, p.y * U); R3.marker.material.color.set(CLS[S.cls].col);
  R3.aim.position.set(p.x * U + Math.cos(p.face) * .7, .04, p.y * U + Math.sin(p.face) * .7); R3.aim.rotation.set(-Math.PI / 2, 0, -p.face - Math.PI / 2);
  const W = mouseWorld(); R3.reticle.position.set(W.x * U, .72, W.y * U); R3.reticle.visible = !G.inTown && G.mode === 'play' && !G.menu;
  R3.marker.visible = R3.aim.visible = G.mode === 'play';
}
function render3D(dt) {
  if (!R3) return;
  R3.frame++;
  const r = R3, title = G.mode === 'title' || !P || !S;
  if (M && r.levelId !== G.levelId) buildLevel();
  // camera
  let tx, tz;
  if (title) { const rm = M ? M.rooms[0] : { cx: 0, cy: 0 }; const a = G.t * .08; tx = rm.cx + .5 + Math.cos(a) * 3; tz = rm.cy + .5 + Math.sin(a) * 3; r.cam.position.set(tx + Math.cos(a + 2) * 9, 8, tz + Math.sin(a + 2) * 9); r.cam.lookAt(tx, .5, tz); }
  else {
    tx = G.cam.x * U; tz = G.cam.y * U;
    const sh = G.shake * U * .6;
    r.cam.position.set(tx + rnd(-sh, sh), 11.2 * camZoom + rnd(-sh, sh), tz + 7.6 * camZoom); r.cam.lookAt(tx, .4, tz);
  }
  r.sun.position.set(tx - 6, 15, tz + 5); r.sun.target.position.set(tx, 0, tz); r.sun.target.updateMatrixWorld();
  const dark = G.mod === 'dark';
  r.plight.position.set((P ? P.x * U : tx), 3.2, (P ? P.y * U + .6 : tz)); r.plight.distance = dark ? 7 : G.inTown ? 9 : 13; r.plight.intensity = title ? 0 : dark ? 12 : G.inTown ? 8 : 20;
  if (!title && P) { r.plight.color.set(buff('surge') ? '#ff8030' : '#ffc890'); }
  r.hemi.intensity = (G.inTown ? 1.2 : .8) * (dark ? .45 : 1);
  // torch light pool
  r.lightT -= dt;
  if (r.lightT <= 0) {
    r.lightT = .25; const sorted = r.torches.slice().sort((a, b) => ((a.x - tx) ** 2 + (a.z - tz) ** 2) - ((b.x - tx) ** 2 + (b.z - tz) ** 2));
    r.lights.forEach((l, i) => { const t = sorted[i]; if (t && (t.x - tx) ** 2 + (t.z - tz) ** 2 < 400) { l.position.set(t.x, t.y, t.z); l.color.set(t.col); l.userData.t = t; } else l.userData.t = null; });
  }
  r.lights.forEach((l, i) => { const t = l.userData.t; l.intensity = !t ? 0 : t.shrine && t.shrine.used ? 0 : t.stair ? (G.stairsOpen ? 14 : 3) : 9 * (1 + .15 * Math.sin(G.t * 11 + i * 3) + .1 * Math.sin(G.t * 23 + i)); });
  for (const f of r.flames) { f.scale.y = (f.userData.sy || (f.userData.sy = f.scale.y)) * (1 + .2 * Math.sin(G.t * 14 + f.position.x * 7)); }
  for (const a of r.anim) a();
  // ambient atmosphere particles
  if (M && G.parts.length < 1200) {
    const R = curReg(), amb = { snow: ['#ffffff', -1.2, .9], ember: ['#ff8a3a', 1, .9], shroom: ['#c0ff80', .25, .6], coral: ['#a0e8ff', .9, .6], grass: ['#d0ff80', .12, .35], void: ['#c070ff', .3, .6], town: ['#ffb060', .7, .35], crystal: ['#d0c0ff', .2, .5], reeds: ['#ff6060', .15, .3] }[R.dec];
    if (amb && Math.random() < amb[2]) {
      const ax = (tx + rnd(-11, 11)) * TILE, az = (tz + rnd(-8, 7)) * TILE;
      G.parts.push({ x: ax, y: az, z: amb[1] < 0 ? rnd(3, 6) : rnd(0, 2), vx: rnd(-15, 15), vy: rnd(-10, 10), vz: amb[1], g: 0, life: 3, max: 3, col: amb[0], size: R.dec === 'snow' ? 2.5 : 2, amb: 1 });
    }
  }
  if (!title && P) animPlayer(dt);
  else r.pl.g.visible = r.marker.visible = r.aim.visible = r.reticle.visible = false;
  renderExtras(dt);
  // enemies & allies
  for (const e of G.ens) { const g = syncObj('e', e, enemyMesh); animEnemy(e, g); }
  for (const a of G.allies) {
    const g = syncObj('a', a, () => { const p = makeEnemyModel({ sh: 'beast', col: '#8ad8ff' }); p.body.emissive = new T3.Color('#4ab0ff'); p.body.emissiveIntensity = .9; p.body.transparent = true; p.body.opacity = .8; p.g.userData.parts = p; p.g.scale.setScalar(a.r * U); return p.g; });
    g.position.set(a.x * U, 0, a.y * U); g.rotation.y = -a.face; g.userData.parts.legs.forEach((l, i) => l.rotation.z = Math.sin(a.mv * .08 + i * Math.PI) * .6);
  }
  for (const v of G.vill || []) {
    const g = syncObj('v', v, () => { const h = makeHumanoid({ body: v.body, hatType: 'hair', hair: v.hair }); h.g.userData.h = h; h.g.scale.setScalar(.85); h.g.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); return h.g; });
    const h = g.userData.h, mvn = Math.hypot(v.tx - v.x, v.ty - v.y) > 20 && v.wt < 5;
    g.position.set(v.x * U, 0, v.y * U); g.rotation.y = -v.face; h.legL.rotation.z = Math.sin(v.mv) * .6 * mvn; h.legR.rotation.z = -Math.sin(v.mv) * .6 * mvn; h.armL.rotation.z = v.sayLeft > 0 ? 1.2 + Math.sin(G.t * 6) * .3 : .1; villagerAnim(h, v, mvn);
  }
  // dead/stale meshes: enemies shrink out, everything else removed
  for (const [m, obj] of r.objs) {
    if (m._seen === r.frame) continue;
    if (m.userData.enemy && m._lvl === r.levelId) { m.userData.dying = (m.userData.dying || 0) + dt; const k = 1 - m.userData.dying / .5; if (k > 0) { const u = 1 - k; m.rotation.x = Math.min(1.5, u * 3.2) * (m.userData.fallDir || (m.userData.fallDir = Math.random() < .5 ? 1 : -1)); m.position.y = -u * u * .35; if (u > .55) m.scale.multiplyScalar(.9); continue; } }
    r.dyn.remove(m); r.objs.delete(m); const pt = m.userData.parts; if (pt) { pt.body.dispose(); if (pt.ring) pt.ring.material.dispose(); }
  }
  // exit portal
  if (G.exit && !r.exitM) {
    const g = new T3.Group(); g.position.set(G.exit.x * U, 0, G.exit.y * U);
    const c = G.abyss ? '#ff5a8a' : '#7ab8ff';
    const t1 = mk(GEO.tor, mat(c, { em: 3 }), .7, .7, .7, 0, 1.1, 0, g, false), t2 = mk(GEO.tor, mat(c, { em: 2 }), .5, .5, .5, 0, 1.1, 0, g, false);
    const disc = mk(GEO.circ, basic(c, { op: .6, add: 1, unique: 1 }), .65, 1, .65, 0, 1.1, 0, g, false); disc.rotation.x = Math.PI / 2;
    r.fx.add(g); r.exitM = g; r.exitM.userData.tick = () => { t1.rotation.y = G.t * 2; t2.rotation.x = G.t * 2.6; disc.rotation.z = G.t; g.position.y = Math.sin(G.t * 2) * .05; };
    r.torches.push({ x: G.exit.x * U, y: 1.2, z: G.exit.y * U, col: c }); r.lightT = 0;
  }
  if (r.exitM) { if (!G.exit) { r.fx.remove(r.exitM); r.exitM = null; } else r.exitM.userData.tick(); }
  drawFx3D();
  if (r.composer && r.q !== 'low') { r.bloom.strength = .6 + (buff('surge') ? .25 : 0); r.composer.render(); } else r.renderer.render(r.scene, r.cam);
}
function drawFx3D() {
  const r = R3, PL = r.pools;
  // telegraphs
  for (const t of G.tele) {
    const k = clamp(t.t / t.delay, 0, 1);
    if (t.shape === 'c') {
      const a = PL.circ.get(); a.position.set(t.x * U, .04, t.y * U); a.scale.set(t.r * U, 1, t.r * U); a.material.color.set(t.col); a.material.opacity = .18;
      const b = PL.circ.get(); b.position.set(t.x * U, .05, t.y * U); b.scale.set(t.r * U * k, 1, t.r * U * k); b.material.color.set(t.col); b.material.opacity = .35;
      const c = PL.ring.get(); c.position.set(t.x * U, .06, t.y * U); c.scale.set(t.r * U, 1, t.r * U); c.material.color.set(t.col); c.material.opacity = .9;
      if (t.fall) { const m = PL.solid.get(); m.material.color.set('#ff7a2a'); m.material.emissive = m.material.emissive || new T3.Color(); m.material.emissive.set('#ff5010'); m.material.emissiveIntensity = 2; m.position.set(t.x * U, (1 - k) * 9 + .2, t.y * U); m.scale.setScalar(.2); }
    } else {
      const a = PL.rect.get(); a.position.set(t.x * U, .05, t.y * U); a.rotation.set(0, -t.a, 0); a.scale.set(t.len * U, 1, t.w * U); a.material.color.set(t.col); a.material.opacity = t.dmg > 0 ? .15 + k * .25 : .22;
      if (t.dmg > 0) { const b = PL.rect.get(); b.position.set(t.x * U, .06, t.y * U); b.rotation.set(0, -t.a, 0); b.scale.set(t.len * U, 1, t.w * U * k); b.material.color.set(t.col); b.material.opacity = .45; }
    }
  }
  // enemy telegraphs from AI state
  for (const e of G.ens) {
    if (e.st === 'wind' && e.d.ai === 'dash') { const a = PL.rect.get(); a.position.set(e.x * U, .05, e.y * U); a.rotation.set(0, -e.ang, 0); a.scale.set(230 * U, 1, e.r * 1.4 * U); a.material.color.set('#ff3a3a'); a.material.opacity = .3; }
    if (e.st === 'wind' && e.d.ai === 'tank') { const k = clamp(1 - e.st_t / .8, 0, 1); const a = PL.circ.get(); a.position.set(e.x * U, .04, e.y * U); a.scale.set(125 * U, 1, 125 * U); a.material.color.set('#ff3a3a'); a.material.opacity = .15; const b = PL.circ.get(); b.position.set(e.x * U, .05, e.y * U); b.scale.set(125 * U * k, 1, 125 * U * k); b.material.color.set('#ff3a3a'); b.material.opacity = .35; }
    if (e.st === 'fuse') { const a = PL.ring.get(); a.position.set(e.x * U, .05, e.y * U); a.scale.set(100 * U, 1, 100 * U); a.material.color.set('#d8ff70'); a.material.opacity = .5 + .4 * Math.sin(G.t * 30); }
  }
  // zones
  for (const z of G.zones) {
    if (z.kind === 'meteor') {
      const k = clamp(z.t / z.delay, 0, 1);
      const a = PL.circ.get(); a.position.set(z.x * U, .04, z.y * U); a.scale.set(z.r * U, 1, z.r * U); a.material.color.set('#ff6a1a'); a.material.opacity = .2;
      const b = PL.ring.get(); b.position.set(z.x * U, .06, z.y * U); const rr = z.r * U * (1 - k * .85) + .1; b.scale.set(rr, 1, rr); b.material.color.set('#ffb04a'); b.material.opacity = .9;
      const m = PL.solid.get(); m.material.color.set('#ff9a3a'); if (!m.material.emissive) m.material.emissive = new T3.Color(); m.material.emissive.set('#ff6010'); m.material.emissiveIntensity = 3; m.position.set(z.x * U + (1 - k) * 4, (1 - k) * 14 + .4, z.y * U - (1 - k) * 2); m.scale.setScalar(.7);
      const gl = PL.glow.get(); gl.position.copy(m.position); gl.scale.setScalar(1.3); gl.material.color.set('#ff7020'); gl.material.opacity = .5;
      continue;
    }
    if (z.kind === 'rift') { const a = PL.circ.get(); a.position.set(z.x * U, .04, z.y * U); a.scale.set(z.r * U, 1, z.r * U); a.material.color.set('#2a0040'); a.material.opacity = .6; for (let i = 0; i < 3; i++) { const b = PL.ring.get(); const rr = z.r * U * (((G.t * .8 + i / 3) % 1)); b.position.set(z.x * U, .06, z.y * U); b.scale.set(z.r * U - rr + .05, 1, z.r * U - rr + .05); b.material.color.set('#b060ff'); b.material.opacity = .7; } continue; }
    const col = z.kind === 'poison' ? '#5aff2a' : '#e8d8a0';
    const a = PL.circ.get(); a.position.set(z.x * U, .04, z.y * U); a.scale.set(z.r * U, 1, z.r * U); a.material.color.set(col); a.material.opacity = z.kind === 'poison' ? .2 + .05 * Math.sin(G.t * 6) : .12;
    const b = PL.ring.get(); b.position.set(z.x * U, .05, z.y * U); b.scale.set(z.r * U, 1, z.r * U); b.material.color.set(col); b.material.opacity = .6;
  }
  // ring fx
  for (const g of G.rings) { const k = 1 - g.t / g.max; const a = PL.ring.get(); const rr = g.r * U * (.3 + .7 * k); a.position.set(g.x * U, .08, g.y * U); a.scale.set(rr, 1, rr); a.material.color.set(g.col); a.material.opacity = (1 - k) * .9; }
  // swings
  for (const s of G.swings) {
    const k = s.t / s.max;
    if (s.thrust) { const a = PL.rect.get(); a.position.set(P.x * U, .7, P.y * U); a.rotation.set(0, -s.a, 0); a.scale.set(s.thrust * U, 1, s.w * U * .8); a.material.color.set(s.col); a.material.opacity = k * .5; a.material.blending = T3.AdditiveBlending; }
    else {
      const a = PL.arc.get(); const key = 'arc' + s.arc.toFixed(2);
      if (!GEO[key]) { const gg = new T3.RingGeometry(.35, 1, 28, 1, -s.arc / 2, s.arc); gg.rotateX(-Math.PI / 2); GEO[key] = gg; }
      a.geometry = GEO[key]; a.position.set(P.x * U, .65, P.y * U); a.rotation.set(0, -s.a, 0); a.scale.set(s.r * U, 1, s.r * U); a.material.color.set(s.col); a.material.opacity = k * .55;
    }
  }
  // bolts
  for (const b of G.bolts) {
    const n = 6, z1 = b.z1 ?? .9, z2 = b.z2 ?? .9; let px = b.x1 * U, py = z1, pz = b.y1 * U;
    if (!b.pts) { b.pts = []; for (let i = 1; i <= n; i++) { const k = i / n; b.pts.push([b.x1 + (b.x2 - b.x1) * k + (i < n ? rnd(-12, 12) : 0), z1 + (z2 - z1) * k + (i < n ? rnd(-.2, .2) : 0), b.y1 + (b.y2 - b.y1) * k + (i < n ? rnd(-12, 12) : 0)]); } }
    for (const q of b.pts) {
      const qx = q[0] * U, qy = q[1], qz = q[2] * U; const s = PL.seg.get();
      const dx = qx - px, dy = qy - py, dz = qz - pz, l = Math.hypot(dx, dy, dz) || .001;
      s.position.set((px + qx) / 2, (py + qy) / 2, (pz + qz) / 2); _v3.set(dx / l, dy / l, dz / l); s.quaternion.setFromUnitVectors(_s3.set(0, 1, 0), _v3); s.scale.set(.025 * (b.w || 1), l, .025 * (b.w || 1));
      s.material.color.setRGB(2, 2, 1.2); px = qx; py = qy; pz = qz;
    }
  }
  // player projectiles
  const _wcol = R3._wc || (R3._wc = new T3.Color('#ffffff'));
  for (const b of G.pp) {
    const a = Math.atan2(b.vy, b.vx), x = b.x * U, z = b.y * U;
    switch (b.kind) {
      case 'arrow': case 'bolt': case 'knife': { const m = PL.arrow.get(); m.position.set(x, .75, z); m.rotation.set(0, -a, 0); const s = b.kind === 'bolt' ? 1.3 : b.kind === 'knife' ? .6 : 1; m.scale.setScalar(s); break; }
      case 'spark': case 'orb': case 'fire': case 'page': case 'wave': {
        const big = b.r > 9, g = PL.glow.get(); g.position.set(x, .75, z); g.scale.setScalar(b.r * U * (b.kind === 'wave' ? 2.2 : big ? 1.6 : 2.2)); g.material.color.set(b.col); g.material.opacity = big ? .4 : .55;
        const c = PL.glow.get(); c.position.set(x, .75, z); c.scale.setScalar(b.r * U * (big ? .7 : .85)); c.material.color.set(b.col).lerp(_wcol, .45).multiplyScalar(1.25); c.material.opacity = .9;
        if (b.kind === 'page') { const m = PL.box.get(); m.position.set(x, .75, z); m.rotation.set(G.t * 9, G.t * 7, 0); m.scale.set(.18, .02, .24); m.material.color.set('#f0e0b0'); m.material.emissive.set(b.col); }
        break;
      }
      case 'ball': { const m = PL.solid.get(); m.material.color.set('#2a2a30'); if (!m.material.emissive) m.material.emissive = new T3.Color(); m.material.emissive.set('#ff6010'); m.material.emissiveIntensity = .4; m.position.set(x, .75, z); m.scale.setScalar(b.r * U * 1.1); break; }
      case 'boom': { const m = PL.torus.get(); m.position.set(x, .75, z); m.rotation.set(Math.PI / 2, 0, b.spin); m.scale.setScalar(b.r * U * 1.1); m.material.color.set(b.col); m.material.emissive.set(b.col); break; }
    }
  }
  // enemy bullets (instanced)
  let n = 0;
  for (const b of G.eb) {
    if (n >= r.MAXB) break;
    const s = b.r * U * 1.05;
    _m4.makeScale(s * .75, s * .75, s * .75); _m4.setPosition(b.x * U, .72, b.y * U); r.ebCore.setMatrixAt(n, _m4);
    _m4.makeScale(s * 1.5, s * 1.5, s * 1.5); _m4.setPosition(b.x * U, .72, b.y * U); r.ebGlow.setMatrixAt(n, _m4);
    _c3.set(b.col); r.ebGlow.setColorAt(n, _c3); _c3.multiplyScalar(1.15); r.ebCore.setColorAt(n, _c3); n++;
  }
  r.ebCore.count = r.ebGlow.count = n;
  r.ebCore.instanceMatrix.needsUpdate = r.ebGlow.instanceMatrix.needsUpdate = true;
  if (r.ebGlow.instanceColor) r.ebGlow.instanceColor.needsUpdate = true; if (r.ebCore.instanceColor) r.ebCore.instanceColor.needsUpdate = true;
  // pickups
  for (const p of G.pick) {
    const x = p.x * U, z = p.y * U, y = (p.z || 0) + .08 + (p.k === 'item' && !p.z ? Math.sin(G.t * 3 + p.x) * .05 + .15 : 0);
    if (p.k === 'gold') { const m = PL.coin.get(); m.position.set(x, y + .03, z); m.rotation.set(Math.PI / 2, G.t * 4 + p.x, 0); }
    else if (p.k === 'item') {
      const c = RAR[p.it.r].c, m = PL.gem.get(); m.scale.set(.13, .2, .13); m.position.set(x, y + .2, z); m.rotation.y = G.t * 2; m.material.color.set(c); m.material.emissive.set(c); m.material.emissiveIntensity = .8 + p.it.r * .3;
      if (p.it.r >= 2) { const b = PL.beam.get(); const bw = p.it.r >= 6 ? .5 : .08 + p.it.r * .03; b.position.set(x, p.it.r >= 6 ? 5 : 2, z); b.scale.set(bw, p.it.r >= 6 ? 10 : 4, bw); b.material.color.set(c); b.material.opacity = .2 + .08 * Math.sin(G.t * 4); }
      const g = PL.ring.get(); g.position.set(x, .04, z); g.scale.set(.3, 1, .3); g.material.color.set(c); g.material.opacity = .7;
    } else {
      const col = p.k === 'gem' ? GEMS[p.v.g].col : p.k === 'pet' ? '#ffe9a0' : p.k === 'tmap' ? '#e0c080' : { ore: '#6ab0ff', shard: '#ff7af0', hp: '#ff3a4a', mp: '#3a6aff', frag: '#7ffcff', page: '#f0e0b0' }[p.k] || '#ffffff';
      const m = PL.gem.get(); m.position.set(x, y + .15, z); m.rotation.y = G.t * 3; m.material.color.set(col); m.material.emissive.set(col); m.material.emissiveIntensity = 1.5; m.scale.set(.1, p.k === 'hp' || p.k === 'mp' ? .1 : .16, .1); if (p.k === 'page') { m.scale.set(.16, .02, .2); m.position.y = y + .35 + Math.sin(G.t * 2) * .08; m.rotation.set(.4, G.t, 0); const b = PL.beam.get(); b.position.set(x, 1.5, z); b.scale.set(.06, 3, .06); b.material.color.set('#f0e0b0'); b.material.opacity = .25; } if (p.k === 'frag') { m.scale.set(.14, .24, .14); const b = PL.beam.get(); b.position.set(x, 2, z); b.scale.set(.12, 4, .12); b.material.color.set('#7ffcff'); b.material.opacity = .3; }
      const g = PL.glow.get(); g.position.set(x, y + .15, z); g.scale.setScalar(.2); g.material.color.set(col); g.material.opacity = .5;
    }
  }
  // blade storm & sunwheel
  if (P && P.blades > 0) for (let k = 0; k < P.bladeN; k++) { const a = G.t * 5 + k * 6.283 / P.bladeN; const m = PL.box.get(); m.position.set((P.x + Math.cos(a) * 88) * U, .8, (P.y + Math.sin(a) * 88) * U); m.rotation.set(0, -a, G.t * 12); m.scale.set(.05, .55, .1); m.material.color.set('#c8e8ff'); m.material.emissive.set('#80c0ff'); }
  if (P && ST.u && ST.u.orbit) for (let k = 0; k < 2; k++) { const a = -G.t * 3 + k * Math.PI; const g = PL.glow.get(); g.position.set((P.x + Math.cos(a) * 66) * U, .8, (P.y + Math.sin(a) * 66) * U); g.scale.setScalar(.25); g.material.color.set('#ff8a2a'); g.material.opacity = .9; }
  if (P && P.whirl > 0) { const a = PL.ring.get(); a.position.set(P.x * U, .5, P.y * U); a.scale.set(110 * U, 1, 110 * U); a.rotation.y = G.t * 10; a.material.color.set('#e0e8ff'); a.material.opacity = .4; }
  if (P && G.chan > 0) { const a = PL.ring.get(); const k = 1 - G.chan / 1.5; a.position.set(P.x * U, .05 + k * 1.5, P.y * U); a.scale.set(.6, 1, .6); a.material.color.set('#7ab8ff'); a.material.opacity = .8; }
  if (P && buff('surge')) { const a = PL.ring.get(); a.position.set(P.x * U, .05, P.y * U); const s = .7 + .1 * Math.sin(G.t * 10); a.scale.set(s, 1, s); a.material.color.set('#ff8a2a'); a.material.opacity = .8; }
  for (const k in PL) PL[k].end();
  // particles
  let pc = 0; const pp = r.ppos, pcol = r.pcol, psz = r.psz;
  for (const p of G.parts) {
    if (pc >= r.MAXP) break;
    const k = clamp(p.life / p.max, 0, 1); _c3.set(p.col);
    pp[pc * 3] = p.x * U; pp[pc * 3 + 1] = p.z ?? .6; pp[pc * 3 + 2] = p.y * U;
    const fade = p.amb ? Math.min(1, k * 3) * Math.min(1, (1 - k) * 5) : k;
    pcol[pc * 4] = _c3.r; pcol[pc * 4 + 1] = _c3.g; pcol[pc * 4 + 2] = _c3.b; pcol[pc * 4 + 3] = fade * (p.amb ? .7 : 1);
    psz[pc] = p.size * U * (p.streak ? 1.5 : 2.2) * (p.amb ? 1 : .6 + .4 * k); pc++;
  }
  const g = r.points.geometry; g.setDrawRange(0, pc);
  g.attributes.position.needsUpdate = g.attributes.pcolor.needsUpdate = g.attributes.size.needsUpdate = true;
}

// ---------- 2D overlay (labels, numbers, bars) ----------
function drawOverlay() {
  X.setTransform(DPR, 0, 0, DPR, 0, 0); X.clearRect(0, 0, VW, VH);
  if (!R3 || !P || G.mode === 'title' || !M) return;
  X.textAlign = 'center'; X.textBaseline = 'alphabetic';
  // enemy bars & names
  for (const e of G.ens) {
    if (e.dead || e.boss || e.prop || !(e.hp < e.maxHp || e.elite || e.type === 'gimp')) continue;
    const s = proj(e.x, e.y, e.r * U * VSC(e) * 2.4 + .2); if (!s.vis) continue;
    const w = Math.max(34, e.r * 2.2);
    X.fillStyle = 'rgba(0,0,0,.65)'; X.fillRect(s.x - w / 2 - 1, s.y - 1, w + 2, 6);
    X.fillStyle = e.elite ? ELITES[e.elite] : e.type === 'gimp' ? '#ffd54a' : '#e84a4a'; X.fillRect(s.x - w / 2, s.y, w * clamp(e.hp / e.maxHp, 0, 1), 4);
    if (e.elite || e.type === 'gimp') { X.font = 'bold 11px "Trebuchet MS",sans-serif'; X.fillStyle = e.elite ? ELITES[e.elite] : '#ffd54a'; X.strokeStyle = 'rgba(0,0,0,.8)'; X.lineWidth = 3; const t = e.elite ? `${eliteName(e)} ${e.d.n}` : `${e.d.n} — ${Math.ceil(e.life)}s`; X.strokeText(t, s.x, s.y - 5); X.fillText(t, s.x, s.y - 5); }
  }
  // labels
  const label = (x, y, z, txt, col, font = 'bold 12px "Trebuchet MS",sans-serif', glow) => { const s = proj(x, y, z); if (!s.vis) return; X.font = font; X.lineWidth = glow ? 4 : 3; X.strokeStyle = 'rgba(0,0,0,.9)'; X.strokeText(txt, s.x, s.y); X.fillStyle = col; X.fillText(txt, s.x, s.y); };
  for (const p of G.pick) if (p.k === 'item' && dist(p, P) < 230 && p.it.r >= (S.opts.labels || 0)) label(p.x, p.y, .85, `${icon(p.it)} ${p.it.name}${typeof pickMark === 'function' ? pickMark(p) : ''}`, RAR[p.it.r].c, p.it.r >= 7 ? 'bold 17px Georgia,serif' : p.it.r >= 4 ? 'bold 14px Georgia,serif' : p.it.r >= 2 ? 'bold 12px "Trebuchet MS",sans-serif' : undefined, p.it.r >= 4 ? RAR[p.it.r].c : null);
  for (const n of G.npcs) { label(n.x, n.y, 2.9, n.ic, '#fff', '22px "Apple Color Emoji","Segoe UI Emoji",sans-serif'); label(n.x, n.y, 2.5, n.n, '#ffe2a8', 'bold 14px Georgia,serif'); }
  for (const v of G.vill || []) {
    label(v.x, v.y, 1.55, v.n, '#d8ccb0', 'bold 11px sans-serif');
    if (v.sayLeft > 0) { const sp = proj(v.x, v.y, 2.0); if (sp.vis) { X.font = '13px "Trebuchet MS",sans-serif'; const w = Math.min(320, X.measureText(v.say).width + 20); X.globalAlpha = Math.min(1, v.sayLeft); X.fillStyle = 'rgba(250,244,230,.95)'; X.strokeStyle = '#7a5e2c'; X.lineWidth = 1.5; X.beginPath(); if (X.roundRect) X.roundRect(sp.x - w / 2, sp.y - 30, w, 24, 8); else X.rect(sp.x - w / 2, sp.y - 30, w, 24); X.fill(); X.stroke(); X.beginPath(); X.moveTo(sp.x - 6, sp.y - 6); X.lineTo(sp.x, sp.y + 2); X.lineTo(sp.x + 6, sp.y - 6); X.fill(); X.fillStyle = '#2a2018'; X.fillText(v.say, sp.x, sp.y - 13, 300); X.globalAlpha = 1; } }
  }
  if (G.memory && !G.memory.used && dist(G.memory, P) < 420) label(G.memory.x, G.memory.y, 2.1, '✨ Ember Memory — touch to remember', '#ffe9a0');
  for (const s of G.shrines) if (!s.used && dist(s, P) < 260) label(s.x, s.y, 2.1, s.s.n + ' — ' + s.s.d, s.s.col);
  if (G.stairs && dist(G.stairs, P) < 300) label(G.stairs.x, G.stairs.y, 1.2, G.stairsOpen ? '▼ Descend' : `🔒 Sealed (${Math.max(0, Math.ceil(G.total * .7) - G.killed)} more)`, G.stairsOpen ? '#ffd27a' : '#ff8a6a');
  if (G.exit) label(G.exit.x, G.exit.y, 2.3, G.abyss ? 'Descend Deeper' : 'Return to Haven', '#cfe4ff');
  for (const c of G.chests) if (!c.open && dist(c, P) < 200) label(c.x, c.y, .9, 'Chest', '#ffd54a', 'bold 11px sans-serif');
  // damage numbers
  for (const t of G.txt) {
    const s = proj(t.x, t.y, t.z); if (!s.vis) continue;
    const a = clamp(t.t / .4, 0, 1), pop = t.t > .75 ? 1 + (t.t - .75) * 3 : 1;
    X.globalAlpha = a; X.font = `bold ${Math.round((t.big ? 20 : 14) * pop)}px "Trebuchet MS",sans-serif`;
    X.lineWidth = 3.5; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(t.s, s.x, s.y); X.fillStyle = t.col; X.fillText(t.s, s.x, s.y);
  }
  X.globalAlpha = 1;
}
