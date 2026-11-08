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

// ---------- environment: procedural textures (seamless, per region, cached) ----------
function envRng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// periodic value noise on an nx*ny lattice, sampled with u,v in [0,1)
function envVN(nx, ny, rr) {
  const g = new Float32Array(nx * ny); for (let i = 0; i < g.length; i++) g[i] = rr();
  return (u, v) => {
    const x = u * nx, y = v * ny, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % nx) + nx) % nx, y0 = ((yi % ny) + ny) % ny, x1 = (x0 + 1) % nx, y1 = (y0 + 1) % ny;
    const a = g[y0 * nx + x0], b = g[y0 * nx + x1], c = g[y1 * nx + x0], d = g[y1 * nx + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function envFbm(base, oct, rr) { const ns = []; for (let o = 0; o < oct; o++) ns.push(envVN(base << o, base << o, rr)); return (u, v) => { let s = 0, w = .5, t = 0; for (let o = 0; o < oct; o++) { s += ns[o](u, v) * w; t += w; w *= .5; } return s / t; }; }
// periodic worley noise -> writes [f1, f2, id] into out (grid-bucketed: searches the 5x5 cells around the sample)
function envWorley(cnt, rr) {
  const G = Math.max(1, Math.floor(Math.sqrt(cnt))), cells = []; for (let i = 0; i < G * G; i++) cells.push([]);
  for (let i = 0; i < cnt; i++) { const x = rr(), y = rr(), id = rr(); cells[Math.min(G - 1, Math.floor(y * G)) * G + Math.min(G - 1, Math.floor(x * G))].push(x, y, id); }
  const R_ = G >= 8 ? 1 : 2, all = G <= 5;
  return (u, v, out) => {
    let f1 = 9, f2 = 9, id = 0; const cx = Math.floor(u * G), cy = Math.floor(v * G), r = all ? 0 : R_;
    for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
      const list = all ? null : cells[((cy + oy + G) % G) * G + ((cx + ox + G) % G)];
      for (let ci = all ? 0 : -1; ci < (all ? cells.length : 0); ci++) {
        const c = all ? cells[ci] : list;
        for (let i = 0; i < c.length; i += 3) { let dx = Math.abs(u - c[i]), dy = Math.abs(v - c[i + 1]); if (dx > .5) dx = 1 - dx; if (dy > .5) dy = 1 - dy; const d = dx * dx + dy * dy; if (d < f1) { f2 = f1; f1 = d; id = c[i + 2]; } else if (d < f2) f2 = d; }
      }
    }
    out[0] = Math.sqrt(f1); out[1] = Math.sqrt(f2); out[2] = id;
  };
}
const envSS = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
function envHex(h) { const n = parseInt(String(h).slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function envMix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function envPut(o, c, k) { o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k; }
function envCanvasTex(c, srgb = true) { const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; if (srgb) t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8; return t; }
// paint a S*S texture with fn(u, v, out[r,g,b,emissive]) -> { map, em }
function envPaint(key, S, fn) {
  if (TEXC[key]) return TEXC[key];
  const mkc = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
  const c = mkc(), x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, ed = new Uint8ClampedArray(S * S * 4); let anyE = false;
  const o = [0, 0, 0, 0];
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    o[3] = 0; fn(px / S, py / S, o); const i = (py * S + px) * 4;
    d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255;
    if (o[3] > 0) { anyE = true; ed[i] = ed[i + 1] = ed[i + 2] = o[3] * 255; } ed[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  let em = null;
  if (anyE) { const c2 = mkc(); c2.getContext('2d').putImageData(new ImageData(ed, S, S), 0, 0); em = envCanvasTex(c2); }
  return TEXC[key] = { map: envCanvasTex(c), em };
}
// surface recipes. pal: { a, b (colours), g (grout/dark) } as [r,g,b]; opt: per-region tweaks. Each returns fn(u,v,o).
const ENV_RECIPE = {
  grass(pal, rr) {
    const n1 = envFbm(4, 4, rr), n2 = envFbm(16, 3, rr), bl = envVN(150, 34, rr), bl2 = envVN(96, 22, rr), pt = envFbm(3, 3, rr), dirt = [pal.a[0] * .9 + 20, pal.a[1] * .78 + 8, pal.a[2] * .6 + 4];
    return (u, v, o) => {
      const t = n1(u, v); let c = envMix(pal.a, pal.b, t); let k = (.78 + .32 * n2(u, v)) * (.88 + .1 * bl(u, v) + .08 * bl2(u, v));
      const p = pt(u, v); if (p < .4) { c = envMix(c, dirt, envSS(.4, .28, p) * .6); k *= .95; }
      if (Math.random() < .012) k *= 1.35; envPut(o, c, k);
    };
  },
  flag(pal, rr, opt) {
    const cells = opt.cells || 4, ty = [], val = new Float32Array(cells * cells * 8); for (let i = 0; i < cells * cells; i++) ty.push(Math.floor(rr() * 5)); for (let i = 0; i < val.length; i++) val[i] = rr();
    const n2 = envFbm(12, 4, rr), nm = envFbm(5, 3, rr), wv = envWorley(26, rr), vw = envFbm(3, 4, rr), w = [0, 0, 0], gr = pal.g, moss = opt.moss ? envHex(opt.moss) : null, px = 1 / (opt.size / cells);
    return (u, v, o) => {
      const cx = Math.floor(u * cells), cy = Math.floor(v * cells), fx = u * cells - cx, fy = v * cells - cy, ci = cy * cells + cx, t = ty[ci];
      let x0 = 0, x1 = 1, y0 = 0, y1 = 1, id = 0;
      if (t === 1) { if (fx < .5) x1 = .5; else { x0 = .5; id = 1; } }
      else if (t === 2) { if (fy < .5) y1 = .5; else { y0 = .5; id = 1; } }
      else if (t === 3) { if (fx < .5) x1 = .5; else { x0 = .5; id = 1; } if (fy < .5) y1 = .5; else { y0 = .5; id += 2; } }
      else if (t === 4) { if (fy < .5) y1 = .5; else { y0 = .5; if (fx < .5) { x1 = .5; id = 1; } else { x0 = .5; id = 2; } } }
      const e = Math.min(fx - x0, x1 - fx, fy - y0, y1 - fy) / px, sr = val[ci * 8 + id], sr2 = val[ci * 8 + id + 4];
      let c = envMix(pal.a, pal.b, sr), k = (.84 + .26 * sr2) * (.8 + .34 * n2(u, v));
      if (opt.vein) { const vv = Math.abs(Math.sin((u * 3 + v * 2 + vw(u, v) * 2.6) * 6.2832 * 2)); if (vv < .06) k *= .82 + vv * 2; }
      wv(u, v, w); const cd = w[1] - w[0];
      if (sr2 < (opt.crack ?? .3) && cd < .005) k *= .55;
      if (e < 1.7) { c = gr; k = .8 + .3 * n2(u, v); if (moss && nm(u, v) > .52) { c = moss; k = .9; } }
      else { k *= .6 + .4 * envSS(1.7, 8, e); if (moss && e < 9 && nm(u, v) > .62) c = envMix(c, moss, .55 * envSS(9, 2, e)); }
      if (opt.glow && cd < .006 && sr2 < .55) o[3] = envSS(.006, .001, cd) * envSS(.56, .66, nm(u, v));
      envPut(o, c, k);
    };
  },
  sand(pal, rr) {
    const wp = envFbm(3, 3, rr), n2 = envFbm(10, 4, rr), pt = envFbm(2, 3, rr);
    return (u, v, o) => {
      const r = Math.sin(6.2832 * (v * 14 + u + wp(u, v) * 2.8)); const c = envMix(pal.a, pal.b, pt(u, v));
      let k = .9 + .06 * r + .16 * (n2(u, v) - .5) + (Math.random() - .5) * .09; if (r > .82) k += .06; envPut(o, c, k);
    };
  },
  mud(pal, rr) {
    const n1 = envFbm(4, 5, rr), wt = envFbm(5, 3, rr), n3 = envFbm(6, 3, rr), moss = [pal.a[0] * .9 + 10, pal.a[1] * 1.15 + 14, pal.a[2] * .8];
    return (u, v, o) => {
      let c = envMix(pal.a, pal.b, n1(u, v)), k = .92 + .35 * n1(u, v); const w = wt(u, v);
      if (w < .42) { c = envMix(c, [pal.a[0] * .7, pal.a[1] * .72, pal.a[2] * .85 + 6], envSS(.42, .3, w)); k *= .9; }
      else if (w > .62) c = envMix(c, moss, envSS(.62, .75, w) * .7);
      if (Math.abs(n3(u, v) - .5) < .006) k *= .7; envPut(o, c, k);
    };
  },
  snow(pal, rr) {
    const n1 = envFbm(4, 5, rr), st = envVN(4, 60, rr), ice = envFbm(3, 3, rr), wh = [236, 242, 252], bl = [150, 180, 215];
    return (u, v, o) => {
      const n = n1(u, v); let c = envMix(pal.a, wh, .32 + .3 * n); const ic = ice(u, v); if (ic < .36) c = envMix(c, bl, envSS(.36, .26, ic) * .55);
      let k = .88 + .05 * (st(u, v) - .5) + .1 * n; if (Math.random() < .004) k = 1.25; envPut(o, c, k);
    };
  },
  moss(pal, rr) {
    const wv = envWorley(70, rr), w2 = envWorley(150, rr), n2 = envFbm(12, 3, rr), w = [0, 0, 0], q = [0, 0, 0];
    return (u, v, o) => {
      wv(u, v, w); const bulb = 1 - envSS(0, .065, w[0]); let c = envMix(pal.a, pal.b, w[2]), k = (.55 + .55 * bulb) * (.85 + .3 * n2(u, v));
      if (w[1] - w[0] < .006) k *= .6; w2(u, v, q); if (q[0] < .0045 && q[2] > .86) { c = [230, 255, 200]; k = 1; o[3] = 1; }
      envPut(o, c, k);
    };
  },
  seabed(pal, rr) {
    const wp = envFbm(3, 3, rr), n2 = envFbm(10, 4, rr), cw = envWorley(34, rr), pw = envWorley(90, rr), w = [0, 0, 0];
    return (u, v, o) => {
      const r = Math.sin(6.2832 * (v * 9 + u * 2 + wp(u, v) * 2)); let k = .86 + .06 * r + .18 * (n2(u, v) - .5); let c = envMix(pal.a, pal.b, wp(u, v));
      cw(u, v, w); k += .2 * envSS(.025, 0, w[1] - w[0]); pw(u, v, w); if (w[0] < .011) { c = envMix(c, [200, 190, 170], .35); k *= .85 + w[2] * .4; }
      envPut(o, c, k);
    };
  },
  basalt(pal, rr) {
    const wv = envWorley(38, rr), n2 = envFbm(12, 4, rr), gm = envFbm(3, 3, rr), w = [0, 0, 0];
    return (u, v, o) => {
      wv(u, v, w); const d = w[1] - w[0]; let k = (.7 + .35 * w[2]) * (.75 + .5 * n2(u, v)); const c = envMix(pal.a, pal.b, w[2]);
      if (d < .009) { k *= .3 + d * 40; const g = gm(u, v); o[3] = envSS(.009, .001, d) * envSS(.56, .68, g); }
      envPut(o, c, k);
    };
  },
  plate(pal, rr, opt) {
    const per = opt.plates || 8, rs = envFbm(4, 4, rr), n2 = envFbm(16, 3, rr), px = 1 / (opt.size / per), rust = [140, 80, 40];
    return (u, v, o) => {
      const cx = Math.floor(u * per), cy = Math.floor(v * per), fx = u * per - cx, fy = v * per - cy, e = Math.min(fx, 1 - fx, fy, 1 - fy) / px;
      const alt = (cx + cy) % 2 === 0 && hash(cx, cy) % 3 === 0;
      let c = pal.a, k = .82 + .2 * n2(u, v);
      if (e < 1.5) { c = pal.g; k = .7; } else if (e < 4) k *= 1.12;
      else if (alt) { const a = ((u * opt.size + v * opt.size) % 9 + 9) % 9, b = ((u * opt.size - v * opt.size) % 9 + 9) % 9; if (a < 1.6 || b < 1.6) k *= 1.15; else k *= .92; }
      for (const [rx, ry] of [[.12, .12], [.88, .12], [.12, .88], [.88, .88]]) { const dd = Math.hypot(fx - rx, fy - ry) / px; if (dd < 3.2) { k = dd < 2.2 ? 1.25 - dd * .08 : .55; } }
      const r = rs(u, v); if (r > .66) c = envMix(c, rust, envSS(.66, .8, r) * .4);
      envPut(o, c, k);
    };
  },
  // ---- walls (texture covers 2 x 2 world units: u along wall, v height) ----
  ashlar(pal, rr, opt) {
    const rows = opt.rows || 4, cols = opt.cols || 3, off = [], val = new Float32Array(rows * cols * 2 + 4); for (let i = 0; i < rows; i++) off.push(rr()); for (let i = 0; i < val.length; i++) val[i] = rr();
    const n2 = envFbm(10, 4, rr), nm = envFbm(4, 3, rr), wv = envWorley(16, rr), w = [0, 0, 0], moss = opt.moss ? envHex(opt.moss) : null, px = opt.size;
    return (u, v, o) => {
      const ry = Math.floor(v * rows), fy = v * rows - ry, xx = u * cols + off[ry], cx = Math.floor(xx), fx = xx - cx, bi = ry * cols + (((cx % cols) + cols) % cols);
      const e = Math.min(fx / cols, (1 - fx) / cols, fy / rows, (1 - fy) / rows) * px, sr = val[bi], sr2 = val[bi + rows * cols];
      let c = envMix(pal.a, pal.b, sr), k = (.8 + .3 * sr2) * (.78 + .38 * n2(u, v));
      wv(u, v, w); if (sr2 < .3 && w[1] - w[0] < .008) k *= .6;
      if (e < 1.4) { c = pal.g; k = .75; } else k *= .62 + .38 * envSS(1.4, 6, e);
      if (moss && nm(u, v) > .58) c = envMix(c, moss, envSS(.58, .7, nm(u, v)) * .6);
      envPut(o, c, k);
    };
  },
  strata(pal, rr, opt) {
    const wp = envFbm(3, 3, rr), n2 = envFbm(10, 4, rr), lay = new Float32Array(8), wv = envWorley(14, rr), w = [0, 0, 0], gm = envFbm(4, 3, rr); for (let i = 0; i < 8; i++) lay[i] = rr();
    return (u, v, o) => {
      const b = v * 8 + wp(u, v) * 1.4, li = ((Math.floor(b) % 8) + 8) % 8, fr = b - Math.floor(b);
      const c = envMix(pal.a, pal.b, lay[li]); let k = (.78 + .32 * lay[(li + 3) % 8]) * (.8 + .34 * n2(u, v));
      if (fr < .07) k *= .62; else if (fr > .9) k *= 1.1;
      wv(u, v, w); const d = w[1] - w[0]; if (d < .01) { k *= .45; if (opt.glow && gm(u, v) > .5) o[3] = envSS(.01, .001, d); }
      envPut(o, c, k);
    };
  },
  earth(pal, rr) {
    const n1 = envFbm(4, 5, rr), sw = envWorley(26, rr), rt = envFbm(5, 4, rr), rt2 = envFbm(7, 3, rr), w = [0, 0, 0], st = [128, 120, 108];
    return (u, v, o) => {
      let c = envMix(pal.a, pal.b, n1(u, v)), k = .72 + .45 * n1(u, v); sw(u, v, w);
      if (w[0] < .055 && w[2] > .45) { c = envMix(st, pal.a, .45); k = (.8 + .4 * w[2]) * (1 - envSS(.035, .055, w[0]) * .45); }
      if (Math.abs(rt(u, v) - .5) < .011 || Math.abs(rt2(u, v) - .5) < .008) { c = [70, 50, 32]; k = .9; }
      envPut(o, c, k);
    };
  },
  ice(pal, rr) {
    const n1 = envFbm(4, 4, rr), st = envVN(30, 3, rr), wv = envWorley(18, rr), w = [0, 0, 0], lb = [190, 225, 250];
    return (u, v, o) => {
      const c = envMix(pal.a, lb, .25 + .45 * n1(u, v)); let k = .85 + .25 * (st(u, v) - .5); wv(u, v, w); if (w[1] - w[0] < .007) k *= 1.3; envPut(o, c, k);
    };
  },
  organic(pal, rr) {
    const wv = envWorley(30, rr), pw = envWorley(120, rr), n2 = envFbm(10, 3, rr), w = [0, 0, 0];
    return (u, v, o) => {
      wv(u, v, w); const bulb = 1 - envSS(0, .11, w[0]); let c = envMix(pal.a, pal.b, w[2]), k = (.8 + .65 * bulb) * (.85 + .3 * n2(u, v));
      if (w[1] - w[0] < .01) k *= .5; pw(u, v, w); if (w[0] < .008) k *= .55; envPut(o, c, k);
    };
  },
  crystal(pal, rr) {
    const wv = envWorley(20, rr), n2 = envFbm(8, 3, rr), gm = envFbm(3, 3, rr), w = [0, 0, 0];
    return (u, v, o) => {
      wv(u, v, w); const d = w[1] - w[0]; const c = envMix(pal.a, pal.b, w[2]); let k = (.55 + .75 * w[2]) * (.85 + .3 * n2(u, v));
      if (d < .008) { k = 1.15; o[3] = envSS(.008, .001, d) * envSS(.52, .64, gm(u, v)); } envPut(o, c, k);
    };
  },
  cloud(pal, rr) { const n1 = envFbm(3, 5, rr); return (u, v, o) => { const n = n1(u, v); envPut(o, envMix(pal.a, pal.b, envSS(.35, .7, n)), .7 + .45 * n); }; },
};
// region theme: floor/wall/top recipe and options. Keyed by wall-decor style.
const ENV_THEME = {
  tree: { fl: 'grass', wall: 'earth', top: 'grass', nat: 1 },
  pillar: { fl: 'flag', flo: { moss: '#34402c', crack: .22 }, wall: 'ashlar', wo: { moss: '#34402c' }, top: 'flag', to: { cells: 2 } },
  rock: { fl: 'sand', wall: 'strata', top: 'sand', nat: 1 },
  deadtree: { fl: 'mud', wall: 'earth', top: 'mud', nat: 1 },
  ice: { fl: 'snow', wall: 'ice', top: 'snow', nat: 1, frough: .55 },
  bigshroom: { fl: 'moss', wall: 'organic', top: 'moss', nat: 1, fem: 1 },
  coral: { fl: 'seabed', wall: 'organic', top: 'seabed', nat: 1 },
  lava: { fl: 'basalt', wall: 'strata', wo: { glow: 1 }, top: 'basalt', nat: 1, fem: 1, lavaCol: '#ff5a14' },
  pipe: { fl: 'plate', wall: 'ashlar', wo: { rows: 8, cols: 4 }, top: 'plate', to: { plates: 4 }, metal: .45 },
  column: { fl: 'flag', flo: { vein: 1, moss: '#6a8a4a', crack: .25 }, wall: 'ashlar', wo: { rows: 3, cols: 2 }, top: 'flag', to: { cells: 2, vein: 1 }, float: 1 },
  crystal: { fl: 'flag', flo: { glow: 1, crack: .5 }, wall: 'crystal', top: 'flag', to: { cells: 2, glow: 1 }, fem: 1, frough: .35 },
  voidcrystal: { fl: 'flag', flo: { glow: 1, crack: .5 }, wall: 'crystal', top: 'flag', to: { cells: 2, glow: 1 }, fem: 1, float: 1, frough: .4 },
  none: { fl: 'flag', flo: { crack: .2 }, wall: 'ashlar', top: 'flag', to: { cells: 2 } },
};
const ENV_RECENT = [];
function envSurfTex(R, part) {
  if (ENV_RECENT[0] !== R.n) {
    const i = ENV_RECENT.indexOf(R.n); if (i >= 0) ENV_RECENT.splice(i, 1); ENV_RECENT.unshift(R.n);
    while (ENV_RECENT.length > 3) { const old = ENV_RECENT.pop(); for (const k in TEXC) if (k === 'envcloud|' + old || k.startsWith('env|' + old + '|')) { const t = TEXC[k]; if (t.map) t.map.dispose(); if (t.em) t.em.dispose(); delete TEXC[k]; } }
  }
  const th = ENV_THEME[R.wd] || ENV_THEME.none, kind = part === 'fl' ? th.fl : part === 'wall' ? th.wall : th.top, opt = Object.assign({}, part === 'fl' ? th.flo : part === 'wall' ? th.wo : th.to);
  const S = part === 'fl' ? 512 : 256; opt.size = S;
  const A = envHex, pal = part === 'fl' ? { a: A(R.fl), b: A(R.fl2), g: A(shade3(R.fl, .45)) } : part === 'wall' ? { a: A(R.wl), b: A(shade3(R.wl, 1.25)), g: A(shade3(R.wl, .5)) } : { a: A(R.wt), b: A(shade3(R.wt, .82)), g: A(shade3(R.wt, .5)) };
  if (part === 'wall' && (kind === 'strata' || kind === 'organic')) pal.b = A(R.wt);
  const key = 'env|' + R.n + '|' + part;
  return envPaint(key, S, ENV_RECIPE[kind](pal, envRng(hash(R.n.length * 31 + part.length, R.n.charCodeAt(0) * 7)), opt));
}
// alpha decal / cutout textures
function envAlphaTex(kind) {
  const key = 'envA|' + kind; if (TEXC[key]) return TEXC[key];
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), rr = envRng(kind.length * 977);
  const R_ = (a, b) => a + rr() * (b - a);
  if (kind === 'blot' || kind === 'puddle') {
    const f = envFbm(4, 4, rr), img = x.createImageData(S, S), d = img.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) { const dx = px / S - .5, dy = py / S - .5, r = Math.hypot(dx, dy) * 2 + (f(px / S, py / S) - .5) * .7; const a = kind === 'puddle' ? envSS(.92, .75, r) : envSS(1, .2, r) * .9; const i = (py * S + px) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a * 255; }
    x.putImageData(img, 0, 0);
  } else if (kind === 'crack') {
    x.strokeStyle = '#fff'; x.lineCap = 'round';
    const br = (px, py, a, len, w) => { if (len < 5 || w < .4) return; x.lineWidth = w; x.beginPath(); x.moveTo(px, py); let nx = px, ny = py; for (let i = 0; i < 4; i++) { a += R_(-.5, .5); nx += Math.cos(a) * len / 4; ny += Math.sin(a) * len / 4; x.lineTo(nx, ny); } x.stroke(); br(nx, ny, a + R_(-.8, .8), len * .6, w * .7); if (rr() < .6) br(nx, ny, a + R_(-1.4, 1.4), len * .5, w * .6); };
    for (let i = 0; i < 3; i++) br(64, 64, i * 2.1 + R_(0, 1), 36, 3);
  } else if (kind === 'vine') {
    for (let s = 0; s < 9; s++) {
      let px = 8 + s * 14 + R_(-4, 4), py = 0; const len = R_(50, 125);
      x.strokeStyle = `rgb(${150 + rr() * 60},${190 + rr() * 50},${140 + rr() * 50})`; x.lineWidth = R_(1.5, 2.8); x.beginPath(); x.moveTo(px, 0);
      while (py < len) { py += 6; px += R_(-2.2, 2.2); x.lineTo(px, py); } x.stroke();
      for (let l = 0; l < len / 9; l++) { const ly = R_(4, len), lx = px + R_(-6, 6); x.fillStyle = `rgb(${170 + rr() * 70},${210 + rr() * 45},${150 + rr() * 60})`; x.beginPath(); x.ellipse(lx, ly, R_(2.5, 5), R_(1.5, 3), R_(0, 3), 0, 6.3); x.fill(); }
    }
  } else if (kind === 'web') {
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.1; const spokes = 7;
    for (let i = 0; i < spokes; i++) { const a = i / (spokes - 1) * Math.PI / 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); x.stroke(); }
    for (let r = 18; r < 124; r += R_(12, 18)) { x.beginPath(); for (let i = 0; i < spokes; i++) { const a = i / (spokes - 1) * Math.PI / 2, rj = r * R_(.92, 1.04); const px = Math.cos(a) * rj, py = Math.sin(a) * rj; i ? x.quadraticCurveTo(Math.cos(a - .13) * r * .9, Math.sin(a - .13) * r * .9, px, py) : x.moveTo(px, py); } x.stroke(); }
  } else if (kind === 'banner') {
    x.fillStyle = '#d8d8d8'; x.fillRect(14, 0, 100, 128);
    x.fillStyle = '#ffffff'; x.fillRect(14, 0, 8, 128); x.fillRect(106, 0, 8, 128);
    x.fillStyle = '#f4e4a0'; x.beginPath(); x.moveTo(64, 26); x.lineTo(88, 54); x.lineTo(64, 82); x.lineTo(40, 54); x.closePath(); x.fill();
    x.fillStyle = '#9a9a9a'; x.beginPath(); x.arc(64, 54, 9, 0, 6.3); x.fill();
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(14, 128); for (let i = 0; i <= 6; i++) x.lineTo(14 + i * 100 / 6, 104 + (i % 2) * 22 - rr() * 6); x.lineTo(114, 128); x.closePath(); x.fill();
    for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(R_(20, 108), R_(60, 112), R_(2, 5), R_(2, 7), 0, 0, 6.3); x.fill(); }
  } else if (kind === 'lava') {
    const f = envFbm(4, 4, rr), g = envVN(6, 2, rr), img = x.createImageData(S, S), d = img.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) { const u = px / S, v = py / S, n = f(u, v * .5 + g(u, v) * .3), t = envSS(.3, .75, n); const i = (py * S + px) * 4; d[i] = 255; d[i + 1] = 60 + t * 190; d[i + 2] = t * t * 120; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
  } else if (kind === 'rune') {
    x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, 52, 0, 6.3); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(64, 64, 42, 0, 6.3); x.stroke();
    for (let i = 0; i < 6; i++) { const a = i * 1.047; x.beginPath(); x.moveTo(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42); x.lineTo(64 + Math.cos(a + 2.094) * 42, 64 + Math.sin(a + 2.094) * 42); x.stroke(); }
  }
  const t = envCanvasTex(c); if (kind === 'lava') t.wrapS = t.wrapT = T3.RepeatWrapping;
  return TEXC[key] = t;
}

// ---------- environment: cached procedural decor geometry (shared across levels, never disposed) ----------
const ENVG = {};
function envGeo(name, fn) { return ENVG[name] || (ENVG[name] = fn()); }
function envB() { return { p: [], n: [], c: [] }; }
// add a transformed copy of geo to builder B. o: {x,y,z,s|sx,sy,sz,rx,ry,rz,q}, col: [r,g,b] or fn(x,y,z), disp: fn(x,y,z)->radial scale (local space)
function envAdd(B, geo, o = {}, col, disp) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), P = g.attributes.position;
  if (disp) for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = disp(x, y, z); P.setXYZ(i, x * k, y * k, z * k); }
  _e3.set(o.rx || 0, o.ry || 0, o.rz || 0); if (o.q) _q.copy(o.q); else _q.setFromEuler(_e3);
  _m4.compose(_v3.set(o.x || 0, o.y || 0, o.z || 0), _q, _s3.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1)); g.applyMatrix4(_m4);
  if (disp || o.flat) g.computeVertexNormals();
  const N = g.attributes.normal;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); B.p.push(x, y, z); B.n.push(N.getX(i), N.getY(i), N.getZ(i)); const c = typeof col === 'function' ? col(x, y, z) : col || [1, 1, 1]; B.c.push(c[0], c[1], c[2]); }
  g.dispose(); geo !== g && geo.userData.tmp && geo.dispose();
}
// finish: optional height gradient multiplies vertex colours (fake AO / sun-lit tops)
function envEnd(B, grad) {
  if (grad) { let lo = 1e9, hi = -1e9; for (let i = 1; i < B.p.length; i += 3) { lo = Math.min(lo, B.p[i]); hi = Math.max(hi, B.p[i]); } for (let i = 1; i < B.p.length; i += 3) { const k = grad[0] + (grad[1] - grad[0]) * (B.p[i] - lo) / Math.max(1e-4, hi - lo); B.c[i - 1] *= k; B.c[i] *= k; B.c[i + 1] *= k; } }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(B.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(B.c, 3)); g.computeBoundingSphere(); return g;
}
const envT = g => (g.userData.tmp = 1, g);
const envLump = (amp, f, s) => (x, y, z) => 1 + amp * Math.sin(x * f + s) * Math.sin(y * f * 1.3 + s * 2.1) * Math.sin(z * f * .9 + s * 3.7) + amp * .5 * Math.sin((x + z) * f * 2.3 + s);
const _envUp = new T3.Vector3(0, 1, 0);
function envDirQ(dx, dy, dz) { return new T3.Quaternion().setFromUnitVectors(_envUp, new T3.Vector3(dx, dy, dz).normalize()); }
// tapered limb from (x,y,z) along dir, length len, base radius r
function envLimb(B, x, y, z, d, len, r, taper = .6, col, seg = 6) {
  const q = envDirQ(d[0], d[1], d[2]), c = envT(new T3.CylinderGeometry(r * taper, r, len, seg, 1)); c.translate(0, len / 2, 0);
  envAdd(B, c, { x, y, z, q }, col); const e = new T3.Vector3(0, len, 0).applyQuaternion(q); return [x + e.x, y + e.y, z + e.z];
}
const ENV_LIB = {
  canopy(v) { // broadleaf canopy: clustered lumpy icosahedra
    const B = envB(), rr = envRng(101 + v), ico = new T3.IcosahedronGeometry(1, 1), n = 3 + v;
    envAdd(B, ico, { y: .5, sx: .55, sy: .48, sz: .55 }, null, envLump(.16, 4, v));
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rr(), r = .3 + rr() * .2, s = .3 + rr() * .16; envAdd(B, ico, { x: Math.cos(a) * r, y: .3 + rr() * .45, z: Math.sin(a) * r, s, sy: s * .85 }, null, envLump(.2, 5, i + v)); }
    envAdd(B, ico, { y: .95, s: .3 }, null, envLump(.18, 4, 9 + v)); ico.dispose(); return envEnd(B, [.45, 1.15]);
  },
  canopyL() { const B = envB(), rr = envRng(9), ico = new T3.IcosahedronGeometry(1, 0); envAdd(B, ico, { y: .45, s: .5 }, null, envLump(.15, 3, 1)); for (let i = 0; i < 4; i++) { const a = i * 1.57 + rr(); envAdd(B, ico, { x: Math.cos(a) * .32, y: .3 + rr() * .3, z: Math.sin(a) * .32, s: .33 + rr() * .1 }, null, envLump(.2, 4, i)); } ico.dispose(); return envEnd(B, [.45, 1.1]); },
  pine() { const B = envB(); for (let i = 0; i < 4; i++) { const c = envT(new T3.ConeGeometry(.6 - i * .12, .7, 8, 1)); envAdd(B, c, { y: .35 + i * .38, ry: i * .4 }, null, envLump(.08, 6, i)); } return envEnd(B, [.45, 1.2]); },
  trunk() { const B = envB(), br = [.42, .3, .26]; envLimb(B, 0, 0, 0, [0, 1, 0], 1, .1, .6, br, 7); for (let i = 0; i < 4; i++) { const a = i * 1.57 + .4; envLimb(B, Math.cos(a) * .04, .12, Math.sin(a) * .04, [Math.cos(a), -.55, Math.sin(a)], .18, .05, .3, br, 4); } return envEnd(B, [.6, 1]); },
  rock(v) { const B = envB(), ico = new T3.IcosahedronGeometry(1, 1); envAdd(B, ico, { y: .25, sx: .55, sy: .42, sz: .5, ry: v }, null, envLump(.28, 2.6, v * 3 + 1)); if (v === 2) envAdd(B, ico, { x: .4, y: .12, z: .15, s: .22 }, null, envLump(.3, 4, 5)); ico.dispose(); return envEnd(B, [.55, 1.15]); },
  dead(v) {
    const B = envB(), rr = envRng(300 + v), br = [.5, .42, .36]; let p = [0, 0, 0], d = [0, 1, 0];
    for (let s = 0; s < 3; s++) { d = [d[0] + (rr() - .5) * .35, 1, d[2] + (rr() - .5) * .35]; const np = envLimb(B, p[0], p[1], p[2], d, .7, .1 - s * .025, .78, br, 6); if (s) { const a = rr() * 6.28; const bp = envLimb(B, p[0], p[1], p[2], [Math.cos(a), .7 + rr() * .4, Math.sin(a)], .55 - s * .1, .04, .35, br, 4); envLimb(B, bp[0], bp[1], bp[2], [Math.cos(a + 1), 1, Math.sin(a + 1)], .25, .015, .3, br, 3); } p = np; }
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + rr(); envLimb(B, p[0], p[1], p[2], [Math.cos(a), .8, Math.sin(a)], .35, .025, .3, br, 3); }
    return envEnd(B, [.7, 1.1]);
  },
  crys(v) { // pointed hex-prism cluster
    const B = envB(), rr = envRng(500 + v), n = 4 + v;
    const prism = (x, z, h, r, tx, tz) => { const q = new T3.Quaternion().setFromEuler(new T3.Euler(tx, rr() * 3, tz)); const c = envT(new T3.CylinderGeometry(r * .85, r, h, 6)); c.translate(0, h / 2, 0); envAdd(B, c, { x, z, q, flat: 1 }); const t = envT(new T3.ConeGeometry(r * .85, r * 2.2, 6)); t.translate(0, h + r * 1.1, 0); envAdd(B, t, { x, z, q, flat: 1 }); };
    prism(0, 0, .75, .14, 0, 0); for (let i = 0; i < n; i++) { const a = i / n * 6.28 + rr(); prism(Math.cos(a) * .1, Math.sin(a) * .1, .25 + rr() * .4, .06 + rr() * .06, Math.sin(a) * .5, -Math.cos(a) * .5); }
    return envEnd(B, [.55, 1.35]);
  },
  shroomStem() { const B = envB(), w = [.95, .92, .86]; const c = envT(new T3.CylinderGeometry(.09, .14, 1, 10, 3)); c.translate(0, .5, 0); envAdd(B, c, {}, w, (x, y) => 1 + .12 * Math.sin(y * 9)); const g = envT(new T3.ConeGeometry(.56, .16, 18, 1, true)); g.rotateX(Math.PI); envAdd(B, g, { y: .9 }, [.7, .62, .66]); const r = envT(new T3.TorusGeometry(.13, .03, 5, 12)); envAdd(B, r, { y: .62, rx: Math.PI / 2 }, [.85, .82, .78]); return envEnd(B, [.7, 1]); },
  shroomCap() { const B = envB(), s = envT(new T3.SphereGeometry(.6, 18, 7, 0, 6.283, 0, 1.75)); envAdd(B, s, { y: .78, sy: .55 }); return envEnd(B, [.65, 1.1]); },
  shroomSpots() { const B = envB(), rr = envRng(77), sp = new T3.SphereGeometry(1, 6, 4); for (let i = 0; i < 9; i++) { const a = rr() * 6.28, t = .35 + rr() * .85, x = Math.sin(t) * Math.cos(a) * .6, z = Math.sin(t) * Math.sin(a) * .6, y = .78 + Math.cos(t) * .33; envAdd(B, sp, { x, y: y + .01, z, s: .045 + rr() * .03, sy: .02 }); } sp.dispose(); return envEnd(B); },
  coralBranch(v) {
    const B = envB(), rr = envRng(700 + v);
    const grow = (p, d, len, r, depth) => { const e = envLimb(B, p[0], p[1], p[2], d, len, r, .75, null, depth < 2 ? 4 : 5); if (depth <= 0) { envAdd(B, envT(new T3.SphereGeometry(r * .9, 5, 4)), { x: e[0], y: e[1], z: e[2] }); return; } const k = 2 + (rr() < .4); for (let i = 0; i < k; i++) { const a = rr() * 6.28; grow(e, [d[0] + Math.cos(a) * .7, 1, d[2] + Math.sin(a) * .7], len * .72, r * .7, depth - 1); } };
    grow([0, 0, 0], [0, 1, 0], .32, .07, v === 3 ? 2 : 3); return envEnd(B, [.6, 1.3]);
  },
  brain() { const B = envB(), s = envT(new T3.SphereGeometry(.5, 20, 10, 0, 6.283, 0, 1.6)); envAdd(B, s, { sy: .7 }, null, (x, y, z) => 1 + .07 * Math.sin(Math.atan2(z, x) * 9 + y * 14) * Math.sin(y * 10)); return envEnd(B, [.6, 1.1]); },
  tubes() { const B = envB(), rr = envRng(9); for (let i = 0; i < 5; i++) { const a = i * 1.26 + rr(), h = .3 + rr() * .45, c = envT(new T3.CylinderGeometry(.08, .06, h, 9, 1, true)); c.translate(0, h / 2, 0); envAdd(B, c, { x: Math.cos(a) * .13, z: Math.sin(a) * .13, rz: Math.cos(a) * .2, rx: Math.sin(a) * .2 }); const c2 = envT(new T3.CylinderGeometry(.055, .055, h, 9, 1, true)); c2.translate(0, h / 2, 0); envAdd(B, c2, { x: Math.cos(a) * .13, z: Math.sin(a) * .13, rz: Math.cos(a) * .2, rx: Math.sin(a) * .2 }, [.4, .4, .4]); } return envEnd(B, [.55, 1.2]); },
  pipeRun() { const B = envB(), m = [1, 1, 1], d = [.75, .75, .75]; const p = envT(new T3.CylinderGeometry(.09, .09, 1, 12)); envAdd(B, p, { rz: Math.PI / 2 }, m); for (const x of [-.47, .47]) { const f = envT(new T3.CylinderGeometry(.135, .135, .06, 12)); envAdd(B, f, { x, rz: Math.PI / 2 }, d); for (let i = 0; i < 4; i++) { const a = i * 1.57 + .78; envAdd(B, envT(new T3.SphereGeometry(.018, 4, 3)), { x: x + (x > 0 ? .035 : -.035), y: Math.cos(a) * .1, z: Math.sin(a) * .1 }, [.5, .5, .5]); } } return envEnd(B); },
  pipeV() { const B = envB(); const p = envT(new T3.CylinderGeometry(.07, .07, 1, 10)); p.translate(0, .5, 0); envAdd(B, p); for (const y of [.03, .5, .97]) envAdd(B, envT(new T3.CylinderGeometry(.11, .11, .05, 10)), { y }, [.7, .7, .7]); return envEnd(B); },
  gear() { const sh = new T3.Shape(), n = 10; for (let i = 0; i < n * 4; i++) { const a = i / (n * 4) * 6.283, r = (i % 4 < 2) ? 1 : .8; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(r, 0); } const hole = new T3.Path(); hole.absarc(0, 0, .28, 0, 6.283, true); sh.holes.push(hole); const g = new T3.ExtrudeGeometry(sh, { depth: .18, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -.09); const B = envB(); envAdd(B, envT(g)); for (let i = 0; i < 4; i++) envAdd(B, envT(new T3.BoxGeometry(1.2, .1, .2)), { rz: i * .785, sx: .55 }, [.8, .8, .8]); return envEnd(B); },
  valve() { const B = envB(); envAdd(B, envT(new T3.TorusGeometry(.2, .03, 6, 16))); envAdd(B, envT(new T3.BoxGeometry(.4, .03, .03))); envAdd(B, envT(new T3.BoxGeometry(.03, .4, .03))); envAdd(B, envT(new T3.CylinderGeometry(.04, .04, .14, 8)), { rx: Math.PI / 2, z: -.06 }, [.6, .6, .6]); return envEnd(B); },
  gauge() { const B = envB(); envAdd(B, envT(new T3.CylinderGeometry(.13, .13, .05, 16)), { rx: Math.PI / 2 }, [.85, .7, .4]); envAdd(B, envT(new T3.CylinderGeometry(.1, .1, .01, 16)), { rx: Math.PI / 2, z: .03 }, [1.6, 1.5, 1.2]); envAdd(B, envT(new T3.BoxGeometry(.012, .085, .01)), { z: .04, y: .03, rz: -.7 }, [.15, .05, .05]); return envEnd(B); },
  colBase() { const B = envB(); envAdd(B, envT(new T3.BoxGeometry(.6, .16, .6)), { y: .08 }); envAdd(B, envT(new T3.CylinderGeometry(.24, .27, .1, 20)), { y: .21 }); envAdd(B, envT(new T3.TorusGeometry(.23, .035, 6, 20)), { y: .27, rx: Math.PI / 2 }); return envEnd(B, [.7, 1]); },
  colShaft() { const g = new T3.CylinderGeometry(.2, .22, 1, 24, 4), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z); if (r > .01) { const k = 1 - .07 * Math.max(0, Math.cos(a * 12)); P.setX(i, x * k); P.setZ(i, z * k); } } g.computeVertexNormals(); g.translate(0, .5, 0); return g; },
  colCap() { const B = envB(); envAdd(B, envT(new T3.CylinderGeometry(.3, .2, .16, 20)), { y: .08 }); envAdd(B, envT(new T3.BoxGeometry(.66, .12, .66)), { y: .22 }); return envEnd(B, [.75, 1.05]); },
  colBroken() { const g = new T3.CylinderGeometry(.2, .2, .14, 24, 1), P = g.attributes.position, rr = envRng(3); for (let i = 0; i < P.count; i++) if (P.getY(i) > 0 && Math.hypot(P.getX(i), P.getZ(i)) > .01) P.setY(i, .07 + rr() * .12); g.computeVertexNormals(); return g; },
  crypt() { const B = envB(); envAdd(B, envT(new T3.BoxGeometry(.46, .18, .46)), { y: .09 }); envAdd(B, envT(new T3.BoxGeometry(.3, 1.1, .3)), { y: .73 }); for (const s of [-1, 1]) envAdd(B, envT(new T3.BoxGeometry(.06, 1.1, .06)), { y: .73, x: s * .17, z: s * .17 }, [.8, .8, .8]); envAdd(B, envT(new T3.BoxGeometry(.42, .12, .42)), { y: 1.34 }); envAdd(B, envT(new T3.ConeGeometry(.24, .4, 4)), { y: 1.6, ry: .785 }); return envEnd(B, [.55, 1.1]); },
  candles() { const B = envB(), w = [1, .95, .85]; [[0, 0, .3], [.09, .05, .2], [-.06, .08, .14], [.03, -.09, .24]].forEach(([x, z, h]) => { const c = envT(new T3.CylinderGeometry(.035, .04, h, 7)); c.translate(0, h / 2, 0); envAdd(B, c, { x, z }, w); envAdd(B, envT(new T3.SphereGeometry(.045, 6, 4)), { x, z, y: h - .01, sy: .6 }, [.95, .9, .8]); }); return envEnd(B, [.75, 1]); },
  candleFl() { const B = envB(); [[0, 0, .3], [.09, .05, .2], [-.06, .08, .14], [.03, -.09, .24]].forEach(([x, z, h]) => envAdd(B, envT(new T3.SphereGeometry(.028, 6, 4)), { x, z, y: h + .04, sy: 1.8 })); return envEnd(B); },
  flame() { const g = new T3.SphereGeometry(1, 8, 6), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > 0) { const k = 1 - y * .75; P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); P.setY(i, y * 2.1); } } g.computeVertexNormals(); return g; },
  bracket() { const B = envB(), ir = [1, 1, 1]; envAdd(B, envT(new T3.BoxGeometry(.14, .22, .03)), { y: 0, z: 0 }, ir); envAdd(B, envT(new T3.BoxGeometry(.04, .04, .22)), { y: .02, z: .11 }, ir); envAdd(B, envT(new T3.CylinderGeometry(.1, .05, .1, 8, 1, true)), { y: .1, z: .22 }, ir); envAdd(B, envT(new T3.TorusGeometry(.1, .015, 4, 10)), { y: .15, z: .22, rx: Math.PI / 2 }, ir); return envEnd(B); },
  chain() { const B = envB(), t = new T3.TorusGeometry(.04, .012, 4, 8); for (let i = 0; i < 10; i++) envAdd(B, t, { y: -i * .065, ry: i % 2 ? Math.PI / 2 : 0, sy: 1.3 }); envAdd(B, envT(new T3.TorusGeometry(.08, .015, 4, 10)), { y: -10 * .065 - .05, ry: .4 }); t.dispose(); return envEnd(B); },
  icicles() { const B = envB(), rr = envRng(41); for (let i = 0; i < 7; i++) { const h = .1 + rr() * .3, c = envT(new T3.ConeGeometry(.035 + rr() * .02, h, 5)); c.rotateX(Math.PI); c.translate(0, -h / 2, 0); envAdd(B, c, { x: -.4 + i * .13 + rr() * .04, z: rr() * .04, flat: 1 }); } return envEnd(B, [.7, 1.2]); },
  shelf() { const B = envB(), rr = envRng(8); for (let i = 0; i < 3; i++) { const r = .08 + rr() * .07, c = envT(new T3.CylinderGeometry(r, r * .9, .035, 12, 1, false, 0, Math.PI)); envAdd(B, c, { x: (rr() - .5) * .3, y: i * .14, z: 0, ry: -Math.PI / 2 }); } return envEnd(B, [.75, 1.1]); },
  tuft() { const B = envB(), rr = envRng(5); for (let i = 0; i < 7; i++) { const a = rr() * 6.28, h = .12 + rr() * .14, c = envT(new T3.ConeGeometry(.018, h, 3)); c.translate(0, h / 2, 0); envAdd(B, c, { x: Math.cos(a) * .04, z: Math.sin(a) * .04, rx: Math.sin(a) * .45, rz: -Math.cos(a) * .45 }); } return envEnd(B, [.45, 1.25]); },
  flower() { const B = envB(); const s = envT(new T3.CylinderGeometry(.006, .008, .16, 3)); s.translate(0, .08, 0); envAdd(B, s, {}, [.35, .6, .3]); for (let i = 0; i < 5; i++) { const a = i * 1.257; envAdd(B, envT(new T3.SphereGeometry(.028, 5, 3)), { x: Math.cos(a) * .028, z: Math.sin(a) * .028, y: .165, sy: .35 }); } envAdd(B, envT(new T3.SphereGeometry(.016, 5, 3)), { y: .172 }, [1.4, 1.1, .4]); return envEnd(B); },
  bone() { const B = envB(); envAdd(B, envT(new T3.CylinderGeometry(.018, .018, .26, 5)), { rz: Math.PI / 2 }); for (const x of [-.13, .13]) for (const z of [-.02, .02]) envAdd(B, envT(new T3.SphereGeometry(.026, 5, 4)), { x, z }); return envEnd(B); },
  skull() { const B = envB(), d = [.12, .1, .1]; envAdd(B, envT(new T3.SphereGeometry(.09, 10, 8)), { y: .08, sz: .9 }); envAdd(B, envT(new T3.BoxGeometry(.1, .05, .07)), { y: .025, x: .045 }); for (const z of [-.03, .03]) envAdd(B, envT(new T3.SphereGeometry(.022, 5, 4)), { x: .075, y: .085, z }, d); envAdd(B, envT(new T3.SphereGeometry(.012, 4, 3)), { x: .09, y: .055 }, d); return envEnd(B); },
  ribs() { const B = envB(); envAdd(B, envT(new T3.CylinderGeometry(.03, .03, 1.1, 6)), { rz: Math.PI / 2, y: .05 }); for (let i = 0; i < 5; i++) envAdd(B, envT(new T3.TorusGeometry(.26 - Math.abs(i - 2) * .03, .022, 4, 10, Math.PI)), { x: -.4 + i * .2, y: .05, ry: Math.PI / 2 }); return envEnd(B); },
  reeds() { const B = envB(), rr = envRng(12); for (let i = 0; i < 7; i++) { const h = .35 + rr() * .4, a = rr() * 6.28, c = envT(new T3.ConeGeometry(.012, h, 3)); c.translate(0, h / 2, 0); const x = Math.cos(a) * .06, z = Math.sin(a) * .06, rx = Math.sin(a) * .2, rz = -Math.cos(a) * .2; envAdd(B, c, { x, z, rx, rz }); if (i < 3) envAdd(B, envT(new T3.CapsuleGeometry(.022, .08, 2, 5)), { x: x - rz * h * .8, z: z + rx * h * .8, y: h * .82 }, [.45, .3, .2]); } return envEnd(B, [.5, 1.2]); },
  mound() { const B = envB(); envAdd(B, envT(new T3.SphereGeometry(1, 10, 5, 0, 6.283, 0, 1.57)), { sy: .35 }, null, envLump(.15, 3, 2)); return envEnd(B, [.82, 1.05]); },
  minis() { const B = envB(), rr = envRng(66); for (let i = 0; i < 3; i++) { const x = (rr() - .5) * .16, z = (rr() - .5) * .16, h = .06 + rr() * .1; const s = envT(new T3.CylinderGeometry(.012, .016, h, 5)); s.translate(0, h / 2, 0); envAdd(B, s, { x, z }, [.85, .85, .8]); envAdd(B, envT(new T3.SphereGeometry(.04 + rr() * .03, 8, 4, 0, 6.283, 0, 1.6)), { x, z, y: h, sy: .6 }, [1.6, 1.6, 1.6]); } return envEnd(B); },
  shell() { const B = envB(); envAdd(B, envT(new T3.SphereGeometry(.07, 10, 4, 0, Math.PI, 0, 1.57)), { sy: .5 }, null, (x, y, z) => 1 + .12 * Math.abs(Math.sin(Math.atan2(z, x) * 7))); return envEnd(B, [.75, 1.1]); },
  star() { const sh = new T3.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, r = i % 2 ? .035 : .1; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(r, 0); } const g = new T3.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: true, bevelSize: .01, bevelThickness: .01, bevelSegments: 1 }); g.rotateX(-Math.PI / 2); return g; },
  shard() { const g = new T3.OctahedronGeometry(1, 0); g.scale(.5, 1.4, .5); return g; },
  blob0() { const B = envB(); envAdd(B, envT(new T3.IcosahedronGeometry(1, 0)), {}, null, envLump(.18, 2, 1)); return envEnd(B, [.55, 1.1]); },
};
function envG(name, v) { const k = v === undefined ? name : name + v; return envGeo(k, () => ENV_LIB[name](v)); }
function envVPlane() { return envGeo('vplane', () => { const g = new T3.PlaneGeometry(1, 1); g.translate(0, -.5, 0); return g; }); } // hangs down from its origin, faces +z
// cached vertex-coloured standard material
function envMat(hex, o = {}) {
  const k = 'ENV' + hex + JSON.stringify(o); if (MATC[k]) return MATC[k];
  const m = new T3.MeshStandardMaterial({ color: hex, roughness: o.rough ?? .8, metalness: o.metal ?? 0, flatShading: !!o.flat, vertexColors: o.vc !== false });
  if (o.em) { m.emissive = new T3.Color(o.emc || hex); m.emissiveIntensity = o.em; }
  if (o.em && !o.emc) { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n totalEmissiveRadiance *= vColor.rgb;\n#endif'); }; m.customProgramCacheKey = () => 'envTintEm'; }
  if (o.map) { m.map = envAlphaTex(o.map); m.side = T3.DoubleSide; if (o.cut) { m.alphaTest = .45; } else { m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; } }
  if (o.op !== undefined) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
  if (o.side) m.side = o.side;
  return MATC[k] = m;
}
// smooth value noise on the tile grid (non periodic)
function envSN(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), r = (a, b) => (hash(a + s * 131, b - s * 71) % 1000) / 1000; const a = r(xi, yi), b = r(xi + 1, yi), c = r(xi, yi + 1), d = r(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }


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
  const R = curReg(), town = G.inTown, lo = quality() === 'low', TH = ENV_THEME[town ? 'none' : R.wd] || ENV_THEME.none, WD = town ? 'none' : R.wd;
  R3.scene.background = new T3.Color(R.bg);
  R3.scene.fog = new T3.Fog(R.bg, town ? 22 : 15, town ? 48 : 34);
  R3.hemi.color.set(R.sky); R3.hemi.groundColor.set(R.gnd); R3.hemi.intensity = town ? 1.2 : .8;
  R3.sun.color.set(R.sun); R3.sun.intensity = town ? 1.8 : 1.0;
  const W = M.w, HH = M.h, L = R3.lvl;
  const stairT = G.stairs ? [Math.floor(G.stairs.x / TILE), Math.floor(G.stairs.y / TILE)] : null;
  const own = o => { if (o && o.userData) o.userData.ownGeo = o.userData.ownMat = true; return o; };
  const ownM = o => { if (o && o.userData) o.userData.ownMat = true; return o; };
  // distance (8-neighbour) from the nearest floor tile: 0 floor, 1 = wall ring, 2+ = deep rock
  const dist = new Uint8Array(W * HH).fill(9), qd = []; for (let i = 0; i < W * HH; i++) if (M.t[i] === 1) { dist[i] = 0; qd.push(i); }
  for (let qi = 0; qi < qd.length; qi++) { const i = qd[qi], x = i % W, y = (i / W) | 0, d = dist[i]; if (d >= 4) continue; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const nx = x + ox, ny = y + oy; if (nx < 0 || ny < 0 || nx >= W || ny >= HH) continue; const j = ny * W + nx; if (dist[j] > d + 1) { dist[j] = d + 1; qd.push(j); } } }
  const built = (x, y) => x >= 0 && y >= 0 && x < W && y < HH && dist[y * W + x] === 1;
  const fT = envSurfTex(R, 'fl'), wT = envSurfTex(R, 'wall'), tT = envSurfTex(R, 'top');
  const emCol = TH.lavaCol || R.torch, flagUV = TH.fl === 'flag' || TH.fl === 'plate';
  // ---- floor: 2x2 subdivided tiles, world-space UVs, vertex AO against walls ----
  {
    const pos = [], col = [], uv = [], nrm = [], idx = []; let vi = 0;
    const aoAt = (gx, gy) => { const xs = gx % 2 ? [(gx - 1) / 2] : [gx / 2 - 1, gx / 2], ys = gy % 2 ? [(gy - 1) / 2] : [gy / 2 - 1, gy / 2]; let n = 0, w = 0; for (const tx of xs) for (const ty of ys) { n++; if (!tileFloor(tx, ty)) w++; } return 1 - .55 * w / n; };
    for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
      if (!M.t[y * W + x]) continue;
      if (stairT && x === stairT[0] && y === stairT[1]) continue;
      const h = hash(x, y), rot = flagUV ? (h >> 3) & 3 : 0, tint = .86 + .24 * envSN(x / 5, y / 5, 1) + (flagUV ? ((h % 100) / 100 - .5) * .1 : 0);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        let lx = i / 2 - .5, ly = j / 2 - .5; for (let r = 0; r < rot; r++) { const t = lx; lx = -ly; ly = t; }
        pos.push(x + i / 2, 0, y + j / 2); nrm.push(0, 1, 0); uv.push((x + lx + .5) / 4, (y + ly + .5) / 4);
        const k = aoAt(2 * x + i, 2 * y + j) * tint; col.push(k, k, k);
      }
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const a = vi + j * 3 + i, b = a + 1, c = a + 4, d = a + 3; idx.push(a, c, b, a, d, c); }
      vi += 9;
    }
    const fg = new T3.BufferGeometry(); fg.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); fg.setAttribute('normal', new T3.Float32BufferAttribute(nrm, 3)); fg.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); fg.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); fg.setIndex(idx);
    const fm = new T3.MeshStandardMaterial({ vertexColors: true, map: fT.map, bumpMap: fT.map, bumpScale: 1.6, roughness: TH.frough ?? .9, metalness: TH.metal || 0 });
    if (fT.em) { fm.emissive = new T3.Color(emCol); fm.emissiveMap = fT.em; fm.emissiveIntensity = WD === 'lava' ? .8 : .8; const base = fm.emissiveIntensity; R3.anim.push(() => { fm.emissiveIntensity = base * (.8 + .22 * Math.sin(G.t * 1.6)); }); }
    const floor = new T3.Mesh(fg, fm); floor.receiveShadow = true; own(floor); L.add(floor);
  }
  // ---- base ground beyond the walls (cloud sea / starry void when the level floats) ----
  {
    const bw = W + 60, bh = HH + 60, bg = new T3.PlaneGeometry(bw, bh).rotateX(-Math.PI / 2), u = bg.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * bw / 6, u.getY(i) * bh / 6);
    let bm;
    if (TH.float && WD === 'column') { const ct = envPaint('envcloud|' + R.n, 256, ENV_RECIPE.cloud({ a: envHex(R.bg), b: envHex(shade3(R.wt, 1.1)) }, envRng(5))); bm = new T3.MeshStandardMaterial({ map: ct.map, color: '#ffffff', emissive: '#ffffff', emissiveMap: ct.map, emissiveIntensity: .35, roughness: 1 }); R3.anim.push(() => { ct.map.offset.x = G.t * .004; }); }
    else if (TH.float) { const st = envPaint('envstars', 256, (uu, vv, o) => { const n = Math.random(); o[0] = o[1] = o[2] = 8; if (n > .997) { o[0] = o[1] = o[2] = 255; o[3] = 1; } }); bm = new T3.MeshStandardMaterial({ color: '#000000', emissive: R.torch, emissiveMap: st.em || st.map, emissiveIntensity: 1.3, roughness: 1 }); }
    else bm = new T3.MeshStandardMaterial({ map: tT.map, color: shade3('#ffffff', .42), roughness: 1, emissive: TH.lavaCol ? TH.lavaCol : '#000000', emissiveMap: TH.lavaCol ? tT.em : null, emissiveIntensity: TH.lavaCol ? .35 : 0 });
    const base = new T3.Mesh(bg, bm); base.position.set(W / 2, TH.float ? -2.6 : -.02, HH / 2); base.receiveShadow = !TH.float; own(base); L.add(base);
  }
  // stairs pit
  if (stairT) {
    const sx = stairT[0], sz = stairT[1];
    const pit = new T3.Mesh(GEO.box, mat('#050508')); pit.scale.set(1, .1, 1); pit.position.set(sx + .5, -1.6, sz + .5); L.add(pit);
    for (let i = 0; i < 5; i++) mk(GEO.box, mat(shade3(R.fl, .8 - i * .12)), 1, .3, .2, sx + .5, -.15 - i * .28, sz + .1 + i * .2, L);
    for (const [dx, dz, w, d] of [[.5, -.04, 1.1, .12], [.5, 1.04, 1.1, .12], [-.04, .5, .12, 1.1], [1.04, .5, .12, 1.1]]) mk(GEO.box, mat(R.wt, { rough: .8 }), w, .14, d, sx + dx, .07, sz + dz, L);
    const seal = new T3.Mesh(GEO.circ, basic('#ff3a3a', { op: .55, add: 1, unique: 1 })); seal.scale.set(.55, 1, .55); seal.position.set(sx + .5, .05, sz + .5); L.add(seal);
    const beam = new T3.Mesh(GEO.cylL, basic('#ffb04a', { op: .0, add: 1, unique: 1 })); beam.scale.set(.5, 6, .5); beam.position.set(sx + .5, 3, sz + .5); L.add(beam);
    R3.anim.push(() => { const o = G.stairsOpen; seal.material.color.set(o ? '#ffd27a' : '#ff3a3a'); seal.material.opacity = (o ? .5 : .35) + .2 * Math.sin(G.t * 4); beam.material.opacity = o ? .12 + .05 * Math.sin(G.t * 3) : 0; });
    R3.torches.push({ x: sx + .5, y: .8, z: sz + .5, col: '#ffb050', stair: 1 });
  }
  // ---- walls: one merged mesh for faces, one for caps; only exposed faces, world UVs, AO bands, lip trim ----
  const wallH = { tree: 1.0, column: .9, deadtree: 1.1, none: 1.6 }[WD] || 1.5, nat = !!TH.nat;
  const hgt = new Float32Array(W * HH), capT = nat ? .06 : .1, lip = nat ? .035 : .06, yBot = TH.float ? -2.2 : 0;
  for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) if (built(x, y)) { const h = hash(x, y); hgt[y * W + x] = nat ? wallH + envSN(x * .3, y * .3, 3) * .75 + (h % 100) / 1000 : wallH + ((h >> 4) % 100) / 100 * .12; }
  {
    const WA = { p: [], n: [], u: [], c: [], i: [] }, TA = { p: [], n: [], u: [], c: [], i: [] };
    const quad = (A, pts, nr, uvs, cs) => {
      const b = A.p.length / 3; for (let k = 0; k < 4; k++) { A.p.push(pts[k][0], pts[k][1], pts[k][2]); A.n.push(nr[0], nr[1], nr[2]); A.u.push(uvs[k][0], uvs[k][1]); A.c.push(cs[k], cs[k], cs[k]); }
      const [p0, p1, p2] = pts, ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2], bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
      const dot = (ay * bz - az * by) * nr[0] + (az * bx - ax * bz) * nr[1] + (ax * by - ay * bx) * nr[2];
      if (dot > 0) A.i.push(b, b + 1, b + 2, b, b + 2, b + 3); else A.i.push(b, b + 2, b + 1, b, b + 3, b + 2);
    };
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // vertical face on side d of tile (x,y), pushed out by off, from y0 to y1, tangent extended by e0/e1, colour fn of height
    const vface = (A, x, y, d, off, y0, y1, e0, e1, cf) => {
      let pts, nr;
      if (d < 2) { const X = d === 0 ? x + 1 + off : x - off, t0 = y - e0, t1 = y + 1 + e1; pts = [[X, y0, t0], [X, y0, t1], [X, y1, t1], [X, y1, t0]]; nr = [d === 0 ? 1 : -1, 0, 0]; }
      else { const Z = d === 2 ? y + 1 + off : y - off, t0 = x - e0, t1 = x + 1 + e1; pts = [[t0, y0, Z], [t1, y0, Z], [t1, y1, Z], [t0, y1, Z]]; nr = [0, 0, d === 2 ? 1 : -1]; }
      quad(A, pts, nr, pts.map(p => [(d < 2 ? p[2] : p[0]) / 2, p[1] / 2]), pts.map(p => cf(p[1])));
    };
    const ao = y => y < 0 ? .42 + y * .1 : .42 + .58 * envSS(-.05, 1.1, y);
    for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
      if (!built(x, y)) continue;
      const h = hgt[y * W + x], hs = hash(x, y), tint = nat ? .82 + .3 * envSN(x * .4, y * .4, 5) : .86 + (hs % 50) / 170;
      const ext = DIRS.map(([dx, dy]) => { const nx = x + dx, ny = y + dy; return !built(nx, ny) || hgt[ny * W + nx] < h - .01 ? lip : 0; });
      DIRS.forEach(([dx, dy], d) => {
        const nx = x + dx, ny = y + dy, cf = yy => ao(yy) * tint;
        if (built(nx, ny)) { const hn = hgt[ny * W + nx]; if (hn < h - .01) vface(WA, x, y, d, 0, hn + capT, h, 0, 0, cf); }
        else {
          const fl = tileFloor(nx, ny), bot = fl ? 0 : yBot;
          if (bot < 0) vface(WA, x, y, d, 0, bot, 0, 0, 0, cf);
          if (h > .6) { vface(WA, x, y, d, 0, 0, .6, 0, 0, cf); vface(WA, x, y, d, 0, .6, h, 0, 0, cf); } else vface(WA, x, y, d, 0, 0, h, 0, 0, cf);
          if (fl && !nat) { // plinth trim along the floor
            vface(WA, x, y, d, .04, 0, .14, 0, 0, () => .5 * tint);
            const o0 = d === 0 ? x + 1 : d === 1 ? x - .04 : 0, pz = d === 2 ? y + 1 : d === 3 ? y - .04 : 0;
            const pts = d < 2 ? [[o0, .14, y], [o0 + .04, .14, y], [o0 + .04, .14, y + 1], [o0, .14, y + 1]] : [[x, .14, pz], [x + 1, .14, pz], [x + 1, .14, pz + .04], [x, .14, pz + .04]];
            quad(WA, pts, [0, 1, 0], pts.map(p => [p[0] / 2, p[2] / 2]), [.6 * tint, .6 * tint, .6 * tint, .6 * tint]);
          }
        }
        if (ext[d] > 0) { const e0 = d < 2 ? ext[3] : ext[1], e1 = d < 2 ? ext[2] : ext[0]; vface(TA, x, y, d, ext[d], h, h + capT, e0, e1, () => .78 * tint); }
      });
      const X0 = x - ext[1], X1 = x + 1 + ext[0], Z0 = y - ext[3], Z1 = y + 1 + ext[2], T = h + capT, pts = [[X0, T, Z0], [X1, T, Z0], [X1, T, Z1], [X0, T, Z1]];
      quad(TA, pts, [0, 1, 0], pts.map(p => [p[0] / 2, p[2] / 2]), [tint, tint, tint, tint]);
    }
    const mkG = A => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(A.n, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(A.u, 2)); g.setAttribute('color', new T3.Float32BufferAttribute(A.c, 3)); g.setIndex(A.i); g.computeBoundingSphere(); return g; };
    const wm = new T3.MeshStandardMaterial({ vertexColors: true, map: wT.map, bumpMap: wT.map, bumpScale: 2.2, roughness: WD === 'ice' ? .3 : .88, metalness: TH.metal ? .25 : 0 });
    if (wT.em) { wm.emissive = new T3.Color(emCol); wm.emissiveMap = wT.em; wm.emissiveIntensity = WD === 'lava' ? 1.6 : .9; }
    const tm = new T3.MeshStandardMaterial({ vertexColors: true, map: tT.map, bumpMap: tT.map, bumpScale: 1.6, roughness: WD === 'ice' ? .6 : .9, metalness: TH.metal || 0 });
    if (tT.em) { tm.emissive = new T3.Color(emCol); tm.emissiveMap = tT.em; tm.emissiveIntensity = WD === 'lava' ? .7 : .8; }
    if (WA.i.length) { const wmesh = new T3.Mesh(mkG(WA), wm); wmesh.castShadow = wmesh.receiveShadow = true; own(wmesh); L.add(wmesh); }
    if (TA.i.length) { const tmesh = new T3.Mesh(mkG(TA), tm); tmesh.castShadow = tmesh.receiveShadow = true; own(tmesh); L.add(tmesh); }
  }
  // ---- wall-top and wall-face decor (instanced) ----
  const deco = {}, D = (k, it) => { if (it.s !== undefined) it.sx = it.sy = it.sz = it.s; else { it.sx = it.sx ?? 1; it.sy = it.sy ?? 1; it.sz = it.sz ?? 1; } (deco[k] = deco[k] || []).push(it); };
  const flames = [], gears = [], floaters = [];
  const leafC = ['#4a8a34', '#3e7a2e', '#5a9a3a', '#6a8a2a', '#3a6a30', '#56882c'], tint = (hex, k) => shade3(hex, k);
  for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
    if (!built(x, y)) continue;
    const h = hash(x, y), hh = hgt[y * W + x], ht = hh + capT, cx = x + .5, cz = y + .5, r1 = (h >> 8) % 100 / 100, r2 = (h >> 15) % 100 / 100, v3 = (h >> 20) % 3, ry = r1 * 6.28;
    const jx = cx + (r2 - .5) * .3, jz = cz + (r1 - .5) * .3;
    const nearSide = tileFloor(x, y - 1) || tileFloor(x, y - 2) || tileFloor(x - 1, y - 1) || tileFloor(x + 1, y - 1); // walls between the camera and the room
    const faceS = tileFloor(x, y + 1) && !nearSide, fz = y + 1;
    switch (WD) {
      case 'tree':
        if (!nearSide && h % 3 !== 0) { const s = .8 + r1 * .7; if ((h >> 5) % 3 === 0) { D('trunk', { x: jx, y: ht, z: jz, sx: s * .9, sy: s * .6, sz: s * .9 }); D('pine', { x: jx, y: ht + .4 * s, z: jz, s: s * 1.15, ry, c: pick(['#2e6a3a', '#346e34', '#2a5e36']) }); } else { D('trunk', { x: jx, y: ht, z: jz, sx: s, sy: s * .8, sz: s }); D('canopy' + v3, { x: jx, y: ht + .5 * s, z: jz, s: s * 1.3, ry, c: h % 23 === 0 ? '#b08a30' : pick(leafC) }); } }
        else if (h % (nearSide ? 4 : 2) === 0) D('bush', { x: jx, y: ht - .04, z: jz, sx: .5 + r1 * .2, sy: nearSide ? .35 : .5, sz: .45 + r2 * .2, ry, c: pick(leafC) });
        if (faceS && h % 3 === 0) D('vine', { x: jx, y: ht - .01, z: fz + .012, sx: .8, sy: .45 + r2 * .45, sz: 1, c: '#7aa850' });
        break;
      case 'pillar':
        if (!nearSide && h % 5 === 0) D('cpillar', { x: cx, y: ht, z: cz, s: .9 + r1 * .2 });
        else if (h % (nearSide ? 9 : 6) === 1) { D('candles', { x: jx, y: ht, z: jz, s: 1, ry }); D('candleFl', { x: jx, y: ht, z: jz, s: 1, ry }); }
        else if (h % 11 === 3) D('skull', { x: jx, y: ht, z: jz, s: .9, ry: Math.PI / 2 + (r1 - .5) });
        if (faceS) { const m = h % 7; if (m === 0) { D('banner', { x: cx, y: ht - .13, z: fz + .02, sx: .44, sy: .82 + r2 * .2, sz: 1, c: pick(['#5a2a7a', '#2a5a4a', '#7a1e1e']) }); D('rod', { x: cx, y: ht - .12, z: fz + .035, sx: .018, sy: .56, sz: .018, rz: Math.PI / 2 }); } else if (m === 3) D('chain', { x: jx, y: ht - .1, z: fz + .05, s: 1 }); else if (m === 5 || m === 1) D('web', { x: r2 < .5 ? x + .25 : x + .75, y: hh, z: fz + .015, sx: r2 < .5 ? .5 : -.5, sy: .5, sz: 1 }); }
        break;
      case 'rock':
        if (h % 3 === 0) D('rock' + v3, { x: jx, y: ht - .06, z: jz, sx: .9 + r1 * .6, sy: nearSide ? .5 : .7 + r1 * .9, sz: .9 + r2 * .5, ry, c: pick(['#a8885a', '#9a7a4a', '#b89868', '#8a6a44']) });
        else if (!nearSide && h % 13 === 5) D('ribs', { x: cx, y: ht, z: cz, s: 1.1, ry, c: '#e8dcc0' });
        else if (h % 7 === 2) D('shrub', { x: jx, y: ht, z: jz, s: .32 + r1 * .15, ry });
        if (faceS && h % 5 === 0) D('vine', { x: jx, y: ht - .01, z: fz + .012, sx: .6, sy: .3 + r2 * .3, sz: 1, c: '#a89070' });
        break;
      case 'deadtree':
        if (!nearSide && h % 4 === 0) D('dead' + (v3 % 2), { x: jx, y: ht, z: jz, s: .9 + r1 * .6, ry });
        else if (h % 3 === 0) D('reedsT', { x: jx, y: ht, z: jz, s: 1.1 + r1 * .5, ry, c: pick(['#7a8a4a', '#6a7a3a', '#8a7a4a']) });
        else if (h % 5 === 1) D('rockM', { x: jx, y: ht - .05, z: jz, s: .4 + r1 * .3, ry, c: '#5a6a48' });
        if (faceS && h % 3 === 0) D('vine', { x: jx, y: ht - .01, z: fz + .012, sx: .85, sy: .55 + r2 * .5, sz: 1, c: '#8a9a7a' });
        break;
      case 'ice':
        if (!nearSide && h % 3 === 0) D('ice' + v3, { x: jx, y: ht - .03, z: jz, s: .8 + r1 * .9, ry, c: pick(['#a8e0ff', '#c8f0ff', '#88c8f0']) });
        if (h % 2 === 0) D('snowcap', { x: cx + (r2 - .5) * .2, y: ht - .02, z: cz, sx: .5 + r1 * .2, sy: .45, sz: .5 + r2 * .2, ry });
        if (faceS && h % 2 === 0) D('icicles', { x: cx, y: hh, z: fz + lip * .5, sx: 1, sy: .8 + r1 * .6, sz: 1 });
        break;
      case 'bigshroom':
        if (!nearSide && h % 4 === 0) { const s = .9 + r1, c = pick(['#a050d0', '#50c0b0', '#d05090', '#7a60ff']); D('mstem', { x: jx, y: ht, z: jz, s, ry }); D('mcap', { x: jx, y: ht, z: jz, s, ry, c }); D('mspot', { x: jx, y: ht, z: jz, s, ry }); }
        else if (h % 3 === 1) D('minis', { x: jx, y: ht, z: jz, s: 1.4 + r1, ry, c: pick(['#c060ff', '#40ffd0', '#ff60a0']) });
        if (faceS && h % 3 === 0) D('shelf', { x: jx, y: .35 + r2 * Math.max(0, hh - .7), z: fz, s: 1.2, c: pick(['#c0ff60', '#60ffd0', '#ff80c0']) });
        break;
      case 'coral':
        if (!nearSide && h % 3 === 0) { const c = pick(['#ff6a8a', '#ffa040', '#c060ff', '#40e0d0', '#ff8060']); const k = (h >> 6) % 3; D(k === 0 ? 'coralB' + v3 : k === 1 ? 'brain' : 'tubes', { x: jx, y: ht - .02, z: jz, s: .9 + r1 * .9, ry, c }); }
        else if (h % 4 === 1) D('brain', { x: jx, y: ht - .02, z: jz, s: .45, ry, c: pick(['#ffd060', '#80ffd0', '#ff80b0']) });
        if (faceS && h % 3 === 0) D('vine', { x: jx, y: 0, z: fz + .012, sx: .7, sy: -(.6 + r2 * .5), sz: 1, c: '#6aa070' });
        break;
      case 'lava':
        if (h % 4 === 0) D('lavaP', { x: jx, y: ht + .006, z: jz, sx: .3 + r1 * .12, sy: 1, sz: .24 + r2 * .1, ry });
        else if (h % 5 === 1) D('rockL', { x: jx, y: ht - .05, z: jz, sx: .6 + r1 * .3, sy: nearSide ? .5 : .8 + r1 * 1.6, sz: .6, ry, c: '#3a2420' });
        if (faceS && h % 9 === 0) { const w = .22 + r2 * .16; D('lavafall', { x: jx, y: hh, z: fz + .006, sx: w, sy: hh, sz: 1 }); D('lavaP', { x: jx, y: .012, z: fz + .16, sx: w * 1.1, sy: 1, sz: .16 }); R3.torches.push({ x: jx, y: .6, z: fz + .5, col: '#ff6020' }); }
        else if (faceS && h % 9 === 4) D('chain', { x: jx, y: hh - .02, z: fz + .05, s: 1 });
        break;
      case 'pipe': {
        const ew = built(x - 1, y) && built(x + 1, y), ns = built(x, y - 1) && built(x, y + 1);
        if (ew && h % 3 !== 2) D('pipeRun', { x: cx, y: ht + .1, z: cz + (r1 - .5) * .3, s: 1 }); else if (ns && h % 3 !== 2) D('pipeRun', { x: cx + (r1 - .5) * .3, y: ht + .1, z: cz, s: 1, ry: Math.PI / 2 });
        if (!nearSide && h % 11 === 0) { D('stack', { x: jx, y: ht + .45, z: jz, sx: .13, sy: .9, sz: .13 }); D('stackR', { x: jx, y: ht + .9, z: jz, sx: .16, sy: .16, sz: .16, rx: Math.PI / 2 }); }
        if (faceS) { const m = h % 6; if (m === 0) D('pipeV', { x: jx, y: 0, z: fz + .08, sx: 1, sy: hh, sz: 1 }); else if (m === 2) gears.push({ x: jx, y: Math.min(hh - .3, .55 + r2 * .4), z: fz + .05, s: .2 + r2 * .12, d: r1 < .5 ? 1 : -1 }); else if (m === 4) D('valve', { x: jx, y: .65, z: fz + .07, s: 1, rz: r1 }); else if (m === 5) D('gauge', { x: jx, y: .85, z: fz + .03, s: 1 }); }
        break;
      }
      case 'column':
        if (!nearSide && h % 4 === 0) { const ch = .5 + r1 * 1.7; D('colBase', { x: cx, y: ht, z: cz, s: 1 }); D('colShaft', { x: cx, y: ht + .26, z: cz, sx: 1, sy: ch, sz: 1 }); if (r1 > .45) D('colCap', { x: cx, y: ht + .26 + ch, z: cz, s: 1 }); else D('colBroken', { x: cx, y: ht + .26 + ch, z: cz, s: 1, ry }); }
        else if (h % 5 === 2) D('rubble', { x: jx, y: ht, z: jz, s: .25 + r1 * .15, ry, c: '#d8d8e8' });
        if (faceS && h % 3 === 0) D('vine', { x: jx, y: ht - .01, z: fz + .012, sx: .8, sy: .4 + r2 * .4, sz: 1, c: '#88b060' });
        else if (faceS && h % 7 === 2) { D('banner', { x: cx, y: ht - .13, z: fz + .02, sx: .4, sy: .7, sz: 1, c: pick(['#3a5ab0', '#e8e8f8', '#c8a040']) }); D('rod', { x: cx, y: ht - .12, z: fz + .035, sx: .018, sy: .5, sz: .018, rz: Math.PI / 2 }); }
        break;
      case 'crystal': case 'voidcrystal': {
        const vd = WD === 'voidcrystal';
        if (!nearSide && h % 3 === 0) { const it = { x: jx, y: ht + (vd ? .45 + r1 * .5 : -.03), z: jz, s: .7 + r1 * .9, ry, c: pick(vd ? [R.torch, shade3(R.torch, .7), '#ff70ff'] : ['#a090ff', '#c0a0ff', '#80c0ff', '#ff90e0']) }; D('crys' + v3, it); if (vd) floaters.push(it); }
        else if (h % 4 === 1) D('crys' + v3, { x: jx, y: ht - .02, z: jz, s: .35 + r1 * .2, ry, c: vd ? R.torch : '#b0a0ff' });
        if (vd && !nearSide && h % 7 === 3) D('obel', { x: jx, y: ht + .55, z: jz, sx: .16, sy: .4 + r2 * .3, sz: .16, ry });
        if (faceS && h % 3 === 1) D('crysF', { x: jx, y: .25 + r2 * Math.max(0, hh - .6), z: fz - .02, s: .45, rx: 1.15, ry: (r1 - .5) * .6, c: vd ? R.torch : '#b090ff' });
        else if (faceS && vd && h % 7 === 2) D('chain', { x: jx, y: hh - .02, z: fz + .05, s: 1 });
        break;
      }
    }
    // torches on faces next to floor: iron bracket + flame + glow
    if (!town && h % 17 === 0) {
      for (const [ox, oy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (tileFloor(x + ox, y + oy)) {
        const tx = cx + ox * .5, tz = cz + oy * .5, ty = Math.min(1.0, hh - .25), rr = Math.atan2(ox, oy);
        D('bracket', { x: tx, y: ty, z: tz, s: 1, ry: rr });
        flames.push({ x: tx + ox * .22, y: ty + .16, z: tz + oy * .22 });
        R3.torches.push({ x: tx + ox * .4, y: ty + .4, z: tz + oy * .4, col: R.torch }); break;
      }
    }
  }
  const leaf = envMat('#ffffff', { flat: true, rough: .85 }), stone = envMat('#ffffff', { flat: true, rough: .9 }), plain = envMat('#ffffff', { rough: .8 });
  const metal = envMat('#b08a48', { metal: .75, rough: .35 }), iron = envMat('#3a3634', { metal: .6, rough: .5 });
  const glowM = (c, em) => envMat(c, { em, emc: c, rough: .3 });
  const crysM = WD === 'ice' ? envMat('#ffffff', { flat: true, rough: .08, metal: .1, em: .35, emc: '#80c0ff', op: .88 }) : envMat('#ffffff', { flat: true, rough: .12, metal: .1, em: 1.2, emc: WD === 'voidcrystal' ? R.torch : '#9080ff' });
  const lavaTex = envAlphaTex('lava'), lavaM = MATC.ENVlava || (MATC.ENVlava = new T3.MeshStandardMaterial({ color: '#ff9040', map: lavaTex, emissive: '#ff5010', emissiveMap: lavaTex, emissiveIntensity: 1.4, roughness: .6, side: T3.DoubleSide }));
  const DM = {
    trunk: [envG('trunk'), envMat('#6a4a30', { rough: .9 }), 1], pine: [envG('pine'), leaf, 1], canopy0: [lo ? envG('canopyL') : envG('canopy', 0), leaf, 1], canopy1: [lo ? envG('canopyL') : envG('canopy', 1), leaf, 1], canopy2: [lo ? envG('canopyL') : envG('canopy', 2), leaf, 1], bush: [envG('canopy', 0), leaf, 1],
    vine: [envVPlane(), envMat('#ffffff', { map: 'vine', cut: 1, vc: false }), 0], web: [envVPlane(), envMat('#ffffff', { map: 'web', op: .55, vc: false }), 0],
    banner: [envVPlane(), envMat('#ffffff', { map: 'banner', cut: 1, vc: false, rough: .95 }), 1], rod: [GEO.cylL, mat('#8a6a30', { metal: .7, rough: .4 }), 0],
    cpillar: [envG('crypt'), envMat(shade3(R.wt, 1.1), { rough: .85 }), 1], candles: [envG('candles'), envMat('#f0e8d0', { rough: .6 }), 0], candleFl: [envG('candleFl'), glowM('#ffd080', 3), 0], skull: [envG('skull'), envMat('#e0d8c4'), 1],
    chain: [envG('chain'), iron, 0], rock0: [envG('rock', 0), stone, 1], rock1: [envG('rock', 1), stone, 1], rock2: [envG('rock', 2), stone, 1], rockM: [envG('rock', 1), stone, 1], rockL: [envG('rock', 2), envMat('#ffffff', { flat: true, rough: .8 }), 1], rubble: [envG('rock', 0), stone, 1],
    ribs: [envG('ribs'), envMat('#ffffff', { rough: .7 }), 1], shrub: [envG('dead', 1), envMat('#8a6a48', { rough: .9 }), 1],
    dead0: [envG('dead', 0), envMat('#4a3a2c', { rough: .95 }), 1], dead1: [envG('dead', 1), envMat('#4a3a2c', { rough: .95 }), 1], reedsT: [envG('reeds'), plain, 0],
    ice0: [envG('crys', 0), crysM, 1], ice1: [envG('crys', 1), crysM, 1], ice2: [envG('crys', 2), crysM, 1], snowcap: [envG('mound'), envMat('#eef4fc', { rough: .7 }), 1], icicles: [envG('icicles'), envMat('#d0ecff', { flat: true, rough: .1, em: .4, emc: '#80c8ff' }), 0],
    mstem: [envG('shroomStem'), envMat('#f0e8dc'), 1], mcap: [envG('shroomCap'), envMat('#ffffff', { em: .25, rough: .5 }), 1], mspot: [envG('shroomSpots'), envMat('#fff8e8', { em: .6, emc: '#ffffff' }), 0],
    minis: [envG('minis'), envMat('#ffffff', { em: .9, rough: .4 }), 0], shelf: [envG('shelf'), envMat('#ffffff', { em: 1.1, rough: .4 }), 0],
    coralB0: [envG('coralBranch', 0), envMat('#ffffff', { em: .25, flat: true }), 1], coralB1: [envG('coralBranch', 1), envMat('#ffffff', { em: .25, flat: true }), 1], coralB2: [envG('coralBranch', 2), envMat('#ffffff', { em: .25, flat: true }), 1],
    brain: [envG('brain'), envMat('#ffffff', { em: .2 }), 1], tubes: [envG('tubes'), envMat('#ffffff', { em: .2, side: 2 }), 1],
    lavaP: [GEO.circ, lavaM, 0], lavafall: [envVPlane(), lavaM, 0],
    pipeRun: [envG('pipeRun'), metal, 1], pipeV: [envG('pipeV'), metal, 1], stack: [GEO.cyl, mat('#3a3632', { metal: .6, rough: .5 }), 1], stackR: [GEO.tor, mat('#8a7040', { metal: .8, rough: .3 }), 0],
    valve: [envG('valve'), envMat('#b03a2a', { metal: .5, rough: .4 }), 0], gauge: [envG('gauge'), envMat('#ffffff', { metal: .6, rough: .3 }), 0],
    colBase: [envG('colBase'), envMat('#e4e4f0', { rough: .6 }), 1], colShaft: [envG('colShaft'), envMat('#e0e0ee', { rough: .55, vc: false }), 1], colCap: [envG('colCap'), envMat('#e4e4f0', { rough: .6 }), 1], colBroken: [envG('colBroken'), envMat('#d8d8e6', { rough: .7, vc: false }), 1],
    crys0: [envG('crys', 0), crysM, 1], crys1: [envG('crys', 1), crysM, 1], crys2: [envG('crys', 2), crysM, 1], crysF: [envG('crys', 1), crysM, 0],
    obel: [envG('shard'), envMat('#141018', { rough: .15, metal: .6, vc: false }), 1],
    bracket: [envG('bracket'), iron, 0],
  };
  const dIM = {};
  for (const k in deco) if (DM[k]) dIM[k] = addInst(deco[k], DM[k][0], DM[k][1], !!DM[k][2] && !lo);
  // torch flames (instanced, flickering) + soft glow
  if (flames.length) {
    const fim = addInst(flames.map(f => ({ x: f.x, y: f.y, z: f.z, sx: .07, sy: .07, sz: .07 })), envG('flame'), envMat(R.torch, { em: 3.5, vc: false }), false);
    addInst(flames.map(f => ({ x: f.x, y: f.y + .06, z: f.z, sx: .13, sy: .16, sz: .13 })), GEO.sphL, basic(R.torch, { op: .14, add: 1 }), false);
    R3.anim.push(() => { flames.forEach((f, i) => { const k = 1 + .25 * Math.sin(G.t * 14 + f.x * 7) + .1 * Math.sin(G.t * 23 + i); _m4.compose(_v3.set(f.x, f.y, f.z), _q.identity(), _s3.set(.07 / Math.sqrt(k), .07 * k, .07 / Math.sqrt(k))); fim.setMatrixAt(i, _m4); }); fim.instanceMatrix.needsUpdate = true; });
  }
  if (gears.length) {
    const gim = addInst(gears.map(g => ({ x: g.x, y: g.y, z: g.z, s: 1, sx: g.s, sy: g.s, sz: g.s })), envG('gear'), envMat('#c8a050', { metal: .85, rough: .3 }), !lo);
    R3.anim.push(() => { gears.forEach((g, i) => { _e3.set(0, 0, G.t * 1.1 * g.d / (g.s * 4)); _q.setFromEuler(_e3); _m4.compose(_v3.set(g.x, g.y, g.z), _q, _s3.set(g.s, g.s, g.s)); gim.setMatrixAt(i, _m4); }); gim.instanceMatrix.needsUpdate = true; });
  }
  if (floaters.length) {
    const lists = {}; for (const k of ['crys0', 'crys1', 'crys2']) if (deco[k]) lists[k] = deco[k].map((it, i) => ({ it, i })).filter(o => floaters.includes(o.it));
    R3.anim.push(() => { for (const k in lists) { const im = dIM[k]; if (!im || !im.setMatrixAt) continue; for (const { it, i } of lists[k]) { _e3.set(0, it.ry + G.t * .4, 0); _q.setFromEuler(_e3); _m4.compose(_v3.set(it.x, it.y + Math.sin(G.t * 1.3 + it.x * 3) * .1, it.z), _q, _s3.set(it.sx, it.sy, it.sz)); im.setMatrixAt(i, _m4); } im.instanceMatrix.needsUpdate = true; } });
  }
  if (deco.lavaP || deco.lavafall) R3.anim.push(() => { lavaTex.offset.y = (G.t * .18) % 1; });
  // ---- deep-rock filler beyond the wall ring (forest canopy, dunes, drifts...) ----
  if (!lo && !town) {
    const fill = [], fc = { tree: ['#2e5a24', '#3a6a2a', '#2a4e20', '#355f26'], rock: [shade3(R.wt, .9), shade3(R.wt, .75)], deadtree: ['#2a3420', '#323c26'], ice: ['#dce8f4', '#c8d8ea'], bigshroom: ['#3a2a52', '#4a3462'], coral: ['#1e4a5a', '#245262'], lava: ['#2a1612', '#3a1c14'] }[WD];
    if (fc) for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
      const d = dist[y * W + x]; if (d < 2 || d > 4) continue; const h = hash(x + 11, y + 5); if (h % 3 === 0) continue;
      const r1 = (h >> 8) % 100 / 100, tall = WD === 'tree' ? .9 + r1 * .9 : WD === 'lava' ? .6 + r1 * 1.4 : .4 + r1 * .7;
      fill.push(WD === 'tree' ? { x: x + .5 + (r1 - .5) * .5, y: .9 + r1 * .5, z: y + .5, sx: 1.3 + r1 * .4, sy: 1.1 + r1 * .4, sz: 1.3 + r1 * .4, ry: r1 * 6, c: pick(fc) } : { x: x + .5 + (r1 - .5) * .5, y: 0, z: y + .5, sx: .8 + r1 * .5, sy: tall, sz: .8 + r1 * .4, ry: r1 * 6, c: pick(fc) });
    }
    addInst(fill, WD === 'tree' ? envG('canopyL') : envG('blob0'), envMat('#ffffff', { flat: true, rough: .95 }), false);
  }
  // ---- floor decor ----
  const fdec = {}, F = (k, it) => { if (it.s !== undefined) it.sx = it.sy = it.sz = it.s; (fdec[k] = fdec[k] || []).push(it); };
  const stx = G.stairs ? G.stairs.x * U : -99, stz = G.stairs ? G.stairs.y * U : -99, decals = {}, DC = (k, it) => (decals[k] = decals[k] || []).push(it);
  const edgeD = { snow: 'drift', sand: 'drift', void: null, town: null }, nearWall = (x, y) => !tileFloor(x + 1, y) || !tileFloor(x - 1, y) || !tileFloor(x, y + 1) || !tileFloor(x, y - 1);
  for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
    if (!M.t[y * W + x]) continue; const h = hash(x + 7, y + 3);
    const ox = x + .2 + (h >> 5) % 60 / 100, oz = y + .2 + (h >> 11) % 60 / 100, r1 = (h >> 7) % 100 / 100, ry = r1 * 6.28;
    if (Math.abs(ox - stx) < 1.2 && Math.abs(oz - stz) < 1.2) continue;
    // debris / drifts along the wall bases
    if (!town && h % 4 === 1 && nearWall(x, y)) {
      for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) if (!tileFloor(x + dx, y + dy)) {
        const ex = x + .5 + dx * .38 + (r1 - .5) * .5 * (dx ? 0 : 1), ez = y + .5 + dy * .38 + (r1 - .5) * .5 * (dy ? 0 : 1);
        if (edgeD[R.dec] === 'drift') F('drift', { x: ex, y: 0, z: ez, sx: .45 + r1 * .2, sy: .5, sz: .3 + r1 * .1, ry: dx ? Math.PI / 2 : 0, c: R.dec === 'snow' ? '#eef4fc' : shade3(R.fl, 1.18) });
        else if (edgeD[R.dec] !== null) { F('debris', { x: ex, y: 0, z: ez, s: .12 + r1 * .1, ry, c: shade3(R.wl, 1.5 + r1 * .4) }); if (h % 3 === 0) F('debris', { x: ex + .15, y: 0, z: ez - .1, s: .07, ry: ry + 2, c: shade3(R.wl, 1.7) }); }
        break;
      }
    }
    // decals (cracks / stains / puddles / runes)
    if (!lo) {
      const h2 = hash(x + 31, y + 17), r2 = (h2 >> 9) % 100 / 100, dx = x + .5 + (r2 - .5) * .4, dz = y + .5 + (r1 - .5) * .4;
      if (h2 % 9 === 0 && flagUV) DC('crack', { x: dx, y: .004, z: dz, sx: .6 + r2 * .5, sy: 1, sz: .6 + r2 * .5, ry: r2 * 6 });
      else if (h2 % 7 === 0) { const bc = { grass: '#24361a', bones: '#4a6a3a', sand: shade3(R.fl, 1.25), reeds: '#3a5a2a', snow: '#f4f8ff', shroom: '#5a3a7a', coral: '#0e3a40', ember: '#0a0604', gear: '#14100c', cloud: '#6a8a4a', crystal: '#5a50b0', void: '#000000', town: '#4a4030' }[R.dec]; DC('blot', { x: dx, y: .006, z: dz, sx: .9 + r2 * .8, sy: 1, sz: .7 + r2 * .6, ry: r2 * 6, c: bc }); }
      const pk = { reeds: 5, bones: 13, coral: 8, gear: 12, snow: 7 }[R.dec];
      if (pk && h2 % pk === 1) DC('puddle', { x: dx, y: .008, z: dz, sx: .7 + r2 * .7, sy: 1, sz: .5 + r2 * .5, ry: r2 * 6 });
      if ((R.dec === 'void') && h2 % 23 === 2) DC('rune', { x: x + .5, y: .01, z: y + .5, sx: .8, sy: 1, sz: .8, ry: r2 * 6 });
      if (R.dec === 'reeds' && pk && h2 % pk === 1 && h2 % 2) F('lily', { x: dx + .1, y: .012, z: dz, sx: .09, sy: 1, sz: .08, c: '#4a7a3a' });
    }
    if (h % 6) continue;
    switch (R.dec) {
      case 'grass': F('tuft', { x: ox, y: 0, z: oz, s: .9 + r1 * .7, ry, c: pick(['#5a8a3a', '#6a9a40', '#4a7a30', '#7a9a3a']) }); if (h % 3 === 0) F('flower', { x: ox + .12, y: 0, z: oz - .05, s: 1 + r1 * .5, ry, c: pick(['#ffe060', '#ff7090', '#a0a0ff', '#ffffff']) }); if (h % 5 === 0) F('tuft', { x: ox - .15, y: 0, z: oz + .1, s: .7, ry: ry + 1, c: '#5a8a3a' }); break;
      case 'bones': F('bone', { x: ox, y: .025, z: oz, s: 1, ry }); if (h % 4 === 0) F('skull', { x: ox + .15, y: 0, z: oz, s: 1, ry }); if (h % 31 === 0) F('ribs', { x: ox, y: 0, z: oz, s: .5, ry }); break;
      case 'sand': F('pebble', { x: ox, y: 0, z: oz, s: .1 + r1 * .1, ry, c: pick(['#7a6040', '#9a8058', '#6a5030']) }); if (h % 5 === 0) F('shrubF', { x: ox + .2, y: 0, z: oz, s: .22, ry }); if (h % 23 === 0) F('skull', { x: ox, y: 0, z: oz + .2, s: 1.2, ry }); break;
      case 'reeds': F('reed', { x: ox, y: 0, z: oz, s: .8 + r1 * .5, ry, c: pick(['#6a7a3a', '#5a6a2a', '#8a7a4a']) }); break;
      case 'snow': F('mound', { x: ox, y: 0, z: oz, sx: .18 + r1 * .14, sy: .3, sz: .15 + r1 * .1, ry, c: '#eef4fc' }); if (h % 4 === 0) F('icy', { x: ox + .1, y: 0, z: oz, s: .2 + r1 * .1, ry, c: '#a8e0ff' }); break;
      case 'shroom': F('minisF', { x: ox, y: 0, z: oz, s: .9 + r1 * .5, ry, c: pick(['#c060ff', '#40ffd0', '#ff60a0']) }); break;
      case 'coral': { const k = h % 4; if (k === 0) F('shell', { x: ox, y: 0, z: oz, s: 1, ry, c: pick(['#f0d0c0', '#ffe0d0', '#e0c0b0']) }); else if (k === 1) F('star', { x: ox, y: .005, z: oz, s: 1, ry, c: pick(['#ff7040', '#ffa040', '#ff5080']) }); else F('coralF', { x: ox, y: 0, z: oz, s: .5 + r1 * .3, ry, c: pick(['#ff6a8a', '#ffa040', '#c060ff', '#40e0d0']) }); break; }
      case 'ember': F('pebble', { x: ox, y: 0, z: oz, s: .12 + r1 * .1, ry, c: '#2a1a16' }); if (h % 2 === 0) F('ember', { x: ox + .1, y: .02, z: oz, s: .025 }); break;
      case 'gear': F('fgear', { x: ox, y: .015, z: oz, s: .1 + r1 * .06, rx: Math.PI / 2, ry }); if (h % 3 === 0) F('bolt', { x: ox + .15, y: .02, z: oz, sx: .03, sy: .04, sz: .03 }); break;
      case 'cloud': if (h % 7 === 0) F('drum', { x: ox, y: .18, z: oz, sx: .85, sy: .45, sz: .85, rz: Math.PI / 2, ry }); else F('pebble', { x: ox, y: 0, z: oz, s: .1 + r1 * .1, ry, c: '#c8c8d8' }); F('tuft', { x: ox + .2, y: 0, z: oz - .1, s: .6, ry, c: '#7a9a5a' }); break;
      case 'crystal': F('fcrys', { x: ox, y: 0, z: oz, s: .22 + r1 * .15, ry, c: pick(['#a0a0ff', '#e0a0ff', '#80e0ff']) }); break;
      case 'void': F('vmote', { x: ox, y: .3 + r1 * .6, z: oz, sx: .04, sy: .04, sz: .04 }); if (h % 3 === 0) F('vshard', { x: ox + .1, y: .5 + r1 * .4, z: oz, sx: .05, sy: .09, sz: .05, ry }); break;
      case 'town': if (h % 4 === 0) F('flower', { x: ox, y: 0, z: oz, s: 1.2, ry, c: pick(['#ffe060', '#ff7090', '#ffffff']) }); break;
    }
  }
  const FM = {
    tuft: [envG('tuft'), plain, 0], flower: [envG('flower'), envMat('#ffffff', { em: .1 }), 0], bone: [envG('bone'), envMat('#d8d0c0'), 0], skull: [envG('skull'), envMat('#e0d8c8'), 1], ribs: [envG('ribs'), envMat('#d8d0c0'), 1],
    pebble: [envG('rock', 0), stone, 1], debris: [envG('rock', 1), stone, 1], drift: [envG('mound'), envMat('#ffffff', { rough: .9 }), 0], shrubF: [envG('dead', 1), envMat('#7a5a3a', { rough: .9 }), 1],
    reed: [envG('reeds'), plain, 0], lily: [GEO.circ, envMat('#ffffff', { rough: .6, vc: false }), 0], mound: [envG('mound'), envMat('#ffffff', { rough: .7 }), 0], icy: [envG('crys', 0), crysM, 0],
    minisF: [envG('minis'), envMat('#ffffff', { em: .9, rough: .4 }), 0], shell: [envG('shell'), envMat('#ffffff', { rough: .5 }), 0], star: [envG('star'), envMat('#ffffff', { rough: .7, vc: false }), 0], coralF: [envG('coralBranch', 3), envMat('#ffffff', { em: .3, flat: true }), 0],
    ember: [GEO.sphL, mat('#ff7020', { em: 3 }), 0], fgear: [envG('gear'), envMat('#a08040', { metal: .8, rough: .35 }), 0], bolt: [GEO.cylL, mat('#8a8070', { metal: .7, rough: .4 }), 0],
    drum: [envG('colShaft'), envMat('#d8d8e6', { rough: .6, vc: false }), 1], fcrys: [envG('crys', 2), envMat('#ffffff', { em: .9, flat: true, rough: .15 }), 0],
    vmote: [GEO.sphL, mat('#c070ff', { em: 1.5 }), 0], vshard: [GEO.oct, mat(R.torch, { em: 1.8, flat: true }), 0],
  };
  for (const k in fdec) if (FM[k]) addInst(fdec[k], FM[k][0], FM[k][1], !!FM[k][2] && !lo);
  const DCM = {
    crack: () => envMat('#000000', { map: 'crack', op: .5, vc: false }), blot: () => envMat('#ffffff', { map: 'blot', op: .32, vc: false }),
    puddle: () => envMat(R.dec === 'snow' ? '#a0c8e8' : R.dec === 'gear' ? '#0c0a08' : shade3(R.fl, .75), { map: 'puddle', op: R.dec === 'snow' ? .5 : .62, rough: .04, metal: .35, vc: false }),
    rune: () => { const m = basic(R.torch, { op: .5, add: 1, unique: 1 }); m.map = envAlphaTex('rune'); return m; },
  };
  for (const k in decals) { const m = DCM[k](); const im = addInst(decals[k], GEO.plane, m, false); im.receiveShadow = k === 'puddle'; im.renderOrder = 1; if (k === 'rune') ownM(im); }
  // ambient motes for regions the global atmosphere pass leaves bare
  if (!lo && !town) {
    const am = { bones: ['#b8c0d0', .2, .25, 2], sand: ['#e8c890', .1, .5, 1.6], gear: ['#ffd070', .9, .3, 1.6], cloud: ['#ffffff', .15, .45, 3] }[R.dec];
    if (am) R3.anim.push(() => { if (G.mode !== 'play' || G.parts.length > 1100 || Math.random() > am[2]) return; const tx = G.cam.x, tz = G.cam.y; G.parts.push({ x: tx + rnd(-11, 11) * TILE, y: tz + rnd(-8, 7) * TILE, z: rnd(.1, 1.8), vx: R.dec === 'sand' ? rnd(60, 110) : rnd(-12, 12), vy: rnd(-8, 8), vz: am[1], g: 0, life: 3, max: 3, col: am[0], size: am[3], amb: 1 }); });
  }
  // chests, shrines, traps
  for (const c of G.chests) {
    const g = new T3.Group(); g.position.set(c.x * U, 0, c.y * U); g.rotation.y = hash(c.x | 0, c.y | 0) % 4 * Math.PI / 2;
    mk(GEO.box, mat('#8a5a20'), .55, .32, .38, 0, .16, 0, g); const gold = mat('#e0b040', { metal: .85, rough: .3 });
    for (const x of [-.2, .2]) mk(GEO.box, gold, .04, .34, .4, x, .17, 0, g);
    const lid = new T3.Group(); lid.position.set(0, .32, -.19); g.add(lid); mk(GEO.box, mat('#a06a28'), .55, .12, .38, 0, .06, .19, lid); mk(GEO.box, gold, .08, .1, .04, 0, .02, .39, lid);
    const glow = mk(GEO.sphL, basic('#ffd040', { op: 0, add: 1, unique: 1 }), .25, .15, .25, 0, .35, 0, g, false);
    L.add(g); c._g = g;
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
      const roof = { shop: '#c84a3a', smith: '#5a5a6a', sage: '#4a5ab0', jewel: '#2a8a8a', curio: '#8a3a8a' }[n.kind] || n.roof || '#6a5a3a';
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
    const sx = s.ax ?? P.x, sy = s.ay ?? P.y;   // a friend's swing (multiplayer) follows them, yours follows you
    if (s.thrust) { const a = PL.rect.get(); a.position.set(sx * U, .7, sy * U); a.rotation.set(0, -s.a, 0); a.scale.set(s.thrust * U, 1, s.w * U * .8); a.material.color.set(s.col); a.material.opacity = k * .5; a.material.blending = T3.AdditiveBlending; }
    else {
      const a = PL.arc.get(); const key = 'arc' + s.arc.toFixed(2);
      if (!GEO[key]) { const gg = new T3.RingGeometry(.35, 1, 28, 1, -s.arc / 2, s.arc); gg.rotateX(-Math.PI / 2); GEO[key] = gg; }
      a.geometry = GEO[key]; a.position.set(sx * U, .65, sy * U); a.rotation.set(0, -s.a, 0); a.scale.set(s.r * U, 1, s.r * U); a.material.color.set(s.col); a.material.opacity = k * .55;
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
  for (const p of G.pick) if (p.k === 'item' && dist(p, P) < 230 && p.it.r >= (S.opts.labels || 0)) label(p.x, p.y, .85, `${p.it.name}${typeof pickMark === 'function' ? pickMark(p) : ''}`, RAR[p.it.r].c, p.it.r >= 7 ? 'bold 17px Georgia,serif' : p.it.r >= 4 ? 'bold 14px Georgia,serif' : p.it.r >= 2 ? 'bold 12px "Trebuchet MS",sans-serif' : undefined, p.it.r >= 4 ? RAR[p.it.r].c : null);
  for (const n of G.npcs) { { const s = proj(n.x, n.y, 2.9); if (s.vis) drawIco(X, icoKeyOf(n.ic), s.x, s.y - 8, 26, '#fff'); } label(n.x, n.y, 2.5, n.n, '#ffe2a8', 'bold 14px Georgia,serif'); }
  for (const v of G.vill || []) {
    label(v.x, v.y, 1.55, v.n, '#d8ccb0', 'bold 11px sans-serif');
    if (v.sayLeft > 0) { const sp = proj(v.x, v.y, 2.0); if (sp.vis) { X.font = '13px "Trebuchet MS",sans-serif'; const w = Math.min(320, X.measureText(v.say).width + 20); X.globalAlpha = Math.min(1, v.sayLeft); X.fillStyle = 'rgba(250,244,230,.95)'; X.strokeStyle = '#7a5e2c'; X.lineWidth = 1.5; X.beginPath(); if (X.roundRect) X.roundRect(sp.x - w / 2, sp.y - 30, w, 24, 8); else X.rect(sp.x - w / 2, sp.y - 30, w, 24); X.fill(); X.stroke(); X.beginPath(); X.moveTo(sp.x - 6, sp.y - 6); X.lineTo(sp.x, sp.y + 2); X.lineTo(sp.x + 6, sp.y - 6); X.fill(); X.fillStyle = '#2a2018'; X.fillText(v.say, sp.x, sp.y - 13, 300); X.globalAlpha = 1; } }
  }
  if (G.memory && !G.memory.used && dist(G.memory, P) < 420) label(G.memory.x, G.memory.y, 2.1, 'Ember Memory — touch to remember', '#ffe9a0');
  for (const s of G.shrines) if (!s.used && dist(s, P) < 260) label(s.x, s.y, 2.1, s.s.n + ' — ' + s.s.d, s.s.col);
  if (G.stairs && dist(G.stairs, P) < 300) label(G.stairs.x, G.stairs.y, 1.2, G.stairsOpen ? '↓ Descend' : `Sealed (${Math.max(0, Math.ceil(G.total * .7) - G.killed)} more)`, G.stairsOpen ? '#ffd27a' : '#ff8a6a');
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
