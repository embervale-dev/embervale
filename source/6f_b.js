// ================= FEATURE PACK B: hazards, secret rooms, braziers, captives, trophies, exploration =================
EN.cage = { n: 'Prisoner Cage', ai: 'prop', hp: 1, dmg: 0, spd: 0, r: 21, col: '#6a6a74', xp: 0, sh: 'cage' };
const _memB = makeEnemyModel;
makeEnemyModel = function (d, isBoss) {
  if (d.sh !== 'cage') return _memB(d, isBoss);
  const g = new T3.Group(), inner = new T3.Group(); g.add(inner); const iron = mat('#5a5a64', { metal: .8, rough: .4 });
  mk(GEO.cyl, iron, 1.1, .15, 1.1, 0, .07, 0, inner); mk(GEO.cyl, iron, 1.1, .12, 1.1, 0, 2.3, 0, inner); mk(GEO.cone, iron, 1.15, .5, 1.15, 0, 2.6, 0, inner);
  for (let i = 0; i < 10; i++) { const a = i * .628; mk(GEO.cylL, iron, .05, 2.2, .05, Math.cos(a) * 1.05, 1.15, Math.sin(a) * 1.05, inner); }
  const h = makeHumanoid({ body: pick(['#7a8a5a', '#c07a9a', '#6a6a8a', '#5aa0a0']), hatType: 'hair', hair: '#3a2a1a' }); h.g.scale.setScalar(1.6); h.g.rotation.y = rnd(0, 6.28); inner.add(h.g);
  h.armL.rotation.z = 2.4; h.armR.rotation.z = 2.4; h.armR.rotation.y = .4;
  const parts = { g, inner, body: mat('#888').clone(), legs: [], wings: [], spin: [], human: h }; return parts;
};
// ---------- per-floor setup ----------
const _rlB = resetLevel; resetLevel = function () { _rlB(); G.haz = []; G.secret = null; G.braz = null; G.floorTiles = 0; G.explored = false; G.expT = 0; G.expPct = 0; G.trophies = []; G.hzT = 0; };
function hazDef() { return G.abyss ? HAZ[(G.depth * 7) % HAZ.length] : HAZ[G.region]; }
function planSecret() {
  const rooms = M.rooms.slice(1);
  for (let tries = 0; tries < 200; tries++) {
    const r = pick(rooms), side = ri(0, 3); let x, y, dx = 0, dy = 0;
    if (side === 0) { x = ri(r.x + 1, r.x + r.w - 2); y = r.y - 1; dy = -1; } else if (side === 1) { x = ri(r.x + 1, r.x + r.w - 2); y = r.y + r.h; dy = 1; }
    else if (side === 2) { x = r.x - 1; y = ri(r.y + 1, r.y + r.h - 2); dx = -1; } else { x = r.x + r.w; y = ri(r.y + 1, r.y + r.h - 2); dx = 1; }
    const rx = dx ? (dx > 0 ? x + 1 : x - 4) : x - 1, ry = dy ? (dy > 0 ? y + 1 : y - 4) : y - 1;
    if (rx < 3 || ry < 3 || rx + 5 >= M.w - 2 || ry + 5 >= M.h - 2 || !solid(x, y)) continue;
    let okR = true; for (let j = ry - 1; j <= ry + 4 && okR; j++) for (let i = rx - 1; i <= rx + 4; i++) if (M.t[j * M.w + i]) { okR = false; break; }
    if (okR) return { wx: x, wy: y, rect: { x: rx, y: ry, w: 4, h: 4 }, c: { x: (x + .5) * TILE, y: (y + .5) * TILE }, opened: false, name: pick(ROOM_SECRETS) };
  }
  return null;
}
const _popB = populate;
populate = function (R) {
  _popB(R);
  for (let i = 0; i < M.t.length; i++) if (M.t[i]) G.floorTiles++;
  if (G.trial || G.tutorial) return;
  const hd = hazDef(), n = ri(3, 6); for (let i = 0; i < n; i++) { const p = spotM(); if (p) G.haz.push({ ...p, r: rnd(48, 88), h: hd, ang: rnd(0, 6.283), t: rnd(0, 3.5), hit: false }); }
  if (Math.random() < .35) G.secret = planSecret();
  if (Math.random() < .14 && M.rooms.length >= 4) { const list = []; for (let i = 0; i < 3; i++) { const p = spotM(); if (p) list.push({ ...p, lit: false }); } if (list.length === 3) G.braz = { list, done: false }; }
  if ((S.rescued || []).length < CAPTIVES.length && Math.random() < .12) { const p = spotM(); if (p) { mkEnemy('cage', p.x, p.y, {}); G.later.push({ t: 2, fn: () => toast(ico('lock') + ' You hear someone calling for help on this floor...', '#ffd27a') }); } }
};
// ---------- hazards in play ----------
function hazDmg() { return ST.maxHp * .07 * (S.opts.relaxed ? .65 : 1) * (1 - Math.min(60, ST.dr) / 200) * (1 + S.diff * .15); }
let hazSlow = 0, hazSlide = false, lastDX = 0, lastDY = 0;
const _upB = updPlayer;
updPlayer = function (dt) {
  const x0 = P.x, y0 = P.y; _upB(dt);
  if (G.inTown || P.dodgeT > 0 || P.air > 0) { lastDX = P.x - x0; lastDY = P.y - y0; return; }
  if (hazSlow > 0) { const nx = x0 + (P.x - x0) * (1 - hazSlow), ny = y0 + (P.y - y0) * (1 - hazSlow); P.x = nx; P.y = ny; }
  const ownX = P.x - x0, ownY = P.y - y0;
  if (hazSlide) { const mv = Math.hypot(ownX, ownY); if (mv < .5) moveEnt(P, lastDX * .85, lastDY * .85); else moveEnt(P, lastDX * .25, lastDY * .25); }
  lastDX = hazSlide && Math.hypot(ownX, ownY) < .5 ? lastDX * .85 : ownX; lastDY = hazSlide && Math.hypot(ownX, ownY) < .5 ? lastDY * .85 : ownY;
};
function updHazards(dt) {
  hazSlow = 0; hazSlide = false; G.inHaz = null;
  for (const h of G.haz) {
    const H_ = h.h; h.t += dt;
    if (H_.burst) { const c = h.t % 3.5; h.warn = c > 2.6 && c < 3.2; h.on = c >= 3.2; if (h.on && !h.hit) { h.hit = true; if (dist(P, h) < h.r + P.r * .5 && P.dodgeT <= 0) { G.lastHitBy = H_.n; hurtPlayer(Math.min(ST.maxHp * .16 * (1 + S.diff * .15), 10 * Math.pow(1.105, G.pw) * 1.3), null); } for (const e of G.ens) if (!e.dead && !e.prop && dist(e, h) < h.r) hurtEnemy(e, pdmg() * 1.2, { noProc: true, col: '#ddd' }); burst(h.x, h.y, '#e8e8e8', 30, 220, .8, 6, .2); } if (!h.on) h.hit = false; continue; }
    if (H_.en) for (const e of G.ens) if (!e.dead && !e.prop && !e.boss && dist(e, h) < h.r) { dot(e, pdmg() * .6 * (H_.dps || .5) * dt, H_.col, dt); if (H_.slow) e.frz = Math.max(e.frz, .2); }
    if (dist(P, h) > h.r + P.r * .4 || P.dodgeT > 0 || P.air > 0) continue;
    G.inHaz = H_;
    if (H_.dps) { P.hp -= H_.dps * hazDmg() * dt; G.lastHitBy = H_.n; if (P.hp <= 0) { P.hp = .01; P.inv = 0; hurtPlayer(1e12, null); } }
    if (H_.slow) hazSlow = Math.max(hazSlow, H_.slow);
    if (H_.mana) P.mp = Math.max(0, P.mp - H_.mana * dt);
    if (H_.push) { const a = H_.k === 'gust' ? h.ang + Math.sin(G.t * .8) * 1.2 : h.ang; moveEnt(P, Math.cos(a) * H_.push * dt, Math.sin(a) * H_.push * dt); }
    if (H_.slide) hazSlide = true;
  }
}
// ---------- secret rooms ----------
function openSecret() {
  const s = G.secret; if (!s || s.opened) return; s.opened = true;
  const r = s.rect; carve(M, r.x, r.y, r.w, r.h); M.t[s.wy * M.w + s.wx] = 1;
  const cx = (r.x + 2) * TILE, cy = (r.y + 2) * TILE;
  G.chests.push({ x: cx - 30, y: cy, open: false, mimic: false, t: 0 }, { x: cx + 30, y: cy, open: false, mimic: false, t: 0 });
  if (Math.random() < .5) dropGem(cx, cy - 30); if (Math.random() < .3) drop('frag', 1, cx, cy + 30);
  const missing = PAGES.map((_, i) => i).filter(i => !S.pages.includes(i)); if (missing.length && Math.random() < .5) G.pick.push({ k: 'page', v: pick(missing), x: cx, y: cy + 40, vx: 0, vy: 0, t: 1, z: 0, vz: 0 });
  burst(s.c.x, s.c.y, '#8a7a6a', 50, 260, 1, 6, .6); shake(12); sfx('boom'); S.stats.secrets = (S.stats.secrets || 0) + 1;
  banner('Secret Room!', s.name, '#ffd27a'); computeFlow(); buildLevel();
}
// ---------- per-frame hook ----------
let atkPrevB = 0;
const _uB = update;
update = function (dt) {
  _uB(dt);
  if (G.mode !== 'play' || G.menu || !S || !P || G.inTown) { atkPrevB = P ? P.atkCd : 0; return; }
  updHazards(dt);
  const s = G.secret;
  if (s && !s.opened) { if ((P.atkCd > atkPrevB + .01 && dist(P, s.c) < 110) || G.pp.some(b => Math.hypot(b.x - s.c.x, b.y - s.c.y) < 36) || G.rings.some(r => r.r > 60 && dist(r, s.c) < r.r)) openSecret(); }
  atkPrevB = P.atkCd;
  const B = G.braz;
  if (B && !B.done) { for (const b of B.list) if (!b.lit && dist(P, b) < 42) { b.lit = true; sfx('shrine'); burst(b.x, b.y, '#ff9a3a', 24, 160, .7, 3, 1.2); const n = B.list.filter(x => x.lit).length; toast(`${ico('fire')} Brazier lit (${n}/3)`, '#ffb04a'); }
    if (B.list.every(b => b.lit)) { B.done = true; S.stats.braziers = (S.stats.braziers || 0) + 1; banner('The Ember Vault Opens!', 'All three braziers burn', '#ffb04a'); sfx('legend'); shake(8);
      for (let i = 0; i < 2; i++) dropItem(G.tutorial ? genItem(1, { maxR: 1 }) : genItem(G.pw + 2, { minR: 2, bonus: .3 }), P.x, P.y); dropGem(P.x, P.y); dropGem(P.x, P.y); for (let i = 0; i < 14; i++) coin(P.x, P.y, Math.pow(1.12, G.pw) * rnd(2, 5) * (1 + goldEff() / 100)); if (Math.random() < .25) drop('frag', 1, P.x, P.y); } }
  G.expT -= dt;
  if (G.expT <= 0 && G.floorTiles && !G.boss && !G.trial && !G.tutorial) { G.expT = 1; let seen = 0; for (let i = 0; i < M.t.length; i++) if (M.t[i] && M.seen[i]) seen++; G.expPct = seen / G.floorTiles;
    if (G.expPct >= .95 && !G.explored) { G.explored = true; S.stats.mapped = (S.stats.mapped || 0) + 1; const x = Math.round(xpNeed(S.lvl) * .12); gainXP(x / (1 + ST.xp / 100)); const g = Math.round(Math.pow(1.12, G.pw) * 40 * (1 + goldEff() / 100)); S.gold += g; feed(`${ico('map')} Floor fully explored! <span class="gold">+${fmt(g)} gold</span> +${fmt(x)} XP`, '#9ad0ff'); sfx('shrine'); } }
};
// captives freed
const _kB = killEnemy;
killEnemy = function (e) {
  if (e.dead) return; const cage = e.type === 'cage'; _kB(e);
  if (cage && G.tutorial) { dmgText(e.x, e.y - 30, 'Freed!', '#ffe9a0', true, 2.4); sfx('legend'); burst(e.x, e.y, '#ffe9a0', 30, 200, .9, 3, 1); if (G.tut) G.tut.T.cage = true; return; }
  if (cage) { S.rescued = S.rescued || []; const C = CAPTIVES[S.rescued.length]; if (!C) return; S.rescued.push(C[0]); S.stats.rescued = S.rescued.length;
    dmgText(e.x, e.y - 30, 'Thank you!', '#ffe9a0', true, 2.4); sfx('legend'); burst(e.x, e.y, '#ffe9a0', 30, 200, .9, 3, 1);
    const x = Math.round(xpNeed(S.lvl) * .2); gainXP(x / (1 + ST.xp / 100)); S.gold += Math.round(Math.pow(1.12, G.pw) * 60);
    SPK.captive = { n: C[0], ic: ico('person'), col: '#ffe9a0' }; G.later.push({ t: .6, fn: () => startDialog([['you', `(You pry open the cage. ${C[0]} stumbles out.)`], ['captive', `${C[3][0]} I'll make my way to Haven — find me there!`]]) }); }
};
const _gtB = goTown;
goTown = function () { _gtB(); rescuedVillagers().forEach((v, i) => G.vill.push({ ...v, x: (10 + i * 3.4) * TILE, y: (19 + (i % 2)) * TILE, r: 12, tx: 0, ty: 0, wt: rnd(0, 3), face: 0, mv: 0, sayT: rnd(2, 8), say: '', sayLeft: 0, rescued: 1 })); };
function rescuedVillagers() { return (S.rescued || []).map(n => { const C = CAPTIVES.find(c => c[0] === n); return C ? { n: C[0], body: C[1], hair: C[2], lines: C[3] } : null; }).filter(Boolean); }
// ---------- rendering ----------
const _beB = buildExtras;
buildExtras = function () {
  _beB(); const L = R3.lvl;
  for (const h of G.haz) {
    const H_ = h.h, g = new T3.Group(); g.position.set(h.x * U, .015, h.y * U); L.add(g);
    const em = { lava: 2.2, null: .8, shards: .6, spores: .4, ice: .2 }[H_.k] || .15;
    const disc = mk(GEO.circ, new T3.MeshStandardMaterial({ color: H_.col, emissive: H_.col, emissiveIntensity: em, roughness: H_.k === 'ice' ? .05 : .9, metalness: H_.k === 'ice' ? .6 : 0, transparent: true, opacity: ['spores', 'gust', 'current', 'null'].includes(H_.k) ? .45 : .85 }), h.r * U, 1, h.r * U, 0, 0, 0, g, false); disc.receiveShadow = true;
    const edge = mk(GEO.ring, basic(H_.col, { op: .6, add: 1, unique: 1 }), h.r * U * 1.02, 1, h.r * U * 1.02, 0, .01, 0, g, false);
    if (H_.k === 'thorns') for (let i = 0; i < 9; i++) { const a = rnd(0, 6.28), d = rnd(0, h.r * U * .85); const c = mk(GEO.coneL, mat('#2a4a18'), .05, .25, .05, Math.cos(a) * d, .12, Math.sin(a) * d, g); c.rotation.z = rnd(-.4, .4); }
    if (H_.k === 'shards') for (let i = 0; i < 7; i++) { const a = rnd(0, 6.28), d = rnd(0, h.r * U * .8); mk(GEO.oct, mat('#c0a0ff', { em: 1, flat: true }), .07, .2, .07, Math.cos(a) * d, .1, Math.sin(a) * d, g, false); }
    if (H_.k === 'steam') { mk(GEO.box, mat('#4a4a50', { metal: .7 }), h.r * U * 1.2, .04, h.r * U * 1.2, 0, .02, 0, g); }
    R3.anim.push(() => {
      if (H_.k === 'lava' && Math.random() < .08) G.parts.push({ x: h.x + rnd(-h.r, h.r) * .7, y: h.y + rnd(-h.r, h.r) * .7, z: .05, vx: 0, vy: 0, vz: 1.5, g: 3, life: .6, max: .6, col: '#ffb040', size: 4 });
      if (H_.k === 'spores' && Math.random() < .1) G.parts.push({ x: h.x + rnd(-h.r, h.r) * .7, y: h.y + rnd(-h.r, h.r) * .7, z: .2, vx: 0, vy: 0, vz: .5, g: 0, life: 1.2, max: 1.2, col: '#c0ff60', size: 6, amb: 1 });
      if ((H_.k === 'current' || H_.k === 'gust') && Math.random() < .25) { const a = H_.k === 'gust' ? h.ang + Math.sin(G.t * .8) * 1.2 : h.ang; G.parts.push({ x: h.x + rnd(-h.r, h.r) * .6, y: h.y + rnd(-h.r, h.r) * .6, z: .3, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, vz: 0, g: 0, life: .7, max: .7, col: H_.k === 'gust' ? '#ffffff' : '#a0e8ff', size: 2.5, streak: 1, amb: 1 }); }
      if (H_.k === 'steam') { edge.material.color.set(h.warn ? '#ff4a3a' : '#b0b0b0'); edge.material.opacity = h.warn ? .6 + .4 * Math.sin(G.t * 30) : .4; if (h.on && Math.random() < .6) G.parts.push({ x: h.x + rnd(-h.r, h.r) * .5, y: h.y + rnd(-h.r, h.r) * .5, z: .2, vx: 0, vy: 0, vz: 4, g: 0, life: .7, max: .7, col: '#f0f0f0', size: 9 }); }
      if (H_.k === 'null' && Math.random() < .1) G.parts.push({ x: h.x + rnd(-h.r, h.r) * .7, y: h.y + rnd(-h.r, h.r) * .7, z: .1, vx: 0, vy: 0, vz: .8, g: 0, life: 1, max: 1, col: '#a050ff', size: 3 });
      disc.material.emissiveIntensity = em * (H_.k === 'lava' ? .85 + .15 * Math.sin(G.t * 3 + h.x) : 1);
    });
  }
  if (G.secret && !G.secret.opened) {
    const s = G.secret, g = new T3.Group(); g.position.set(s.c.x * U, 0, s.c.y * U); L.add(g);
    const box = mk(GEO.box, mat('#6a5a4a', { rough: 1 }), 1.04, 1.4, 1.04, 0, .7, 0, g);
    const crk = mat('#ffb050', { em: 1.4 }); for (let i = 0; i < 6; i++) { const c = mk(GEO.box, crk, .02, rnd(.25, .5), .02, rnd(-.45, .45), rnd(.3, 1.2), .53 * (i % 2 ? 1 : -1), g, false); c.rotation.z = rnd(-.8, .8); const c2 = mk(GEO.box, crk, .02, rnd(.25, .5), .02, .53 * (i % 2 ? 1 : -1), rnd(.3, 1.2), rnd(-.45, .45), g, false); c2.rotation.x = rnd(-.8, .8); }
    R3.anim.push(() => { crk.emissiveIntensity = .9 + .6 * Math.sin(G.t * 3); });
  }
  if (G.braz) for (const b of G.braz.list) {
    const g = new T3.Group(); g.position.set(b.x * U, 0, b.y * U); L.add(g);
    for (let i = 0; i < 3; i++) { const a = i * 2.09; const l = mk(GEO.cylL, mat('#3a3a40', { metal: .7 }), .035, .8, .035, Math.cos(a) * .18, .4, Math.sin(a) * .18, g); l.rotation.z = Math.cos(a) * .25; l.rotation.x = -Math.sin(a) * .25; }
    mk(GEO.hemi, mat('#4a4a54', { metal: .8, rough: .3 }), .3, .18, .3, 0, .82, 0, g).rotation.x = Math.PI;
    const fl = mk(GEO.sph, mat('#ff8a2a', { em: 3.5 }), .16, .28, .16, 0, 1.0, 0, g, false); const fl2 = mk(GEO.sph, mat('#ffe080', { em: 3 }), .08, .16, .08, 0, .98, 0, g, false);
    R3.anim.push(() => { fl.visible = fl2.visible = b.lit; if (b.lit) { fl.scale.y = .28 * (1 + .25 * Math.sin(G.t * 14 + b.x)); if (Math.random() < .2) G.parts.push({ x: b.x, y: b.y, z: 1.2, vx: rnd(-10, 10), vy: rnd(-10, 10), vz: 1.5, g: -1, life: .6, max: .6, col: '#ffa040', size: 3 }); } });
  }
};
const _btB = buildTown;
buildTown = function () {
  _btB(); const L = R3.lvl; G.trophies = []; let i = 0;
  for (const k in BOSS) {
    if (!(S.best[k] && S.best[k].k > 0)) { i++; continue; }
    const x = 6 + i * 2.45, z = 23.3; i++;
    const g = new T3.Group(); g.position.set(x, 0, z); L.add(g);
    mk(GEO.cyl, mat('#6a6070', { rough: .9 }), .42, .5, .42, 0, .25, 0, g); mk(GEO.cyl, mat('#d8b040', { metal: .85, rough: .3 }), .45, .06, .45, 0, .52, 0, g);
    const p = makeEnemyModel({ ...BOSS[k] }, true); p.g.scale.setScalar(.28); p.g.position.y = .55; p.g.rotation.y = -Math.PI / 2; g.add(p.g);
    R3.anim.push(() => { p.g.rotation.y = -Math.PI / 2 + Math.sin(G.t * .5 + x) * .6; p.spin.forEach(o => o.rotation.y = G.t); });
    G.trophies.push({ x: x * TILE, y: z * TILE, n: BOSS[k].n });
  }
};
const _doB = drawOverlay;
drawOverlay = function () {
  _doB(); if (!R3 || !P || G.mode === 'title' || !M || G.hideHud) return;
  const lab = (o, z, t, col, dmax = 320) => { if (!o || dist(o, P) > dmax) return; const s = proj(o.x, o.y, z); if (!s.vis) return; X.font = 'bold 12px "Trebuchet MS",sans-serif'; X.textAlign = 'center'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(t, s.x, s.y); X.fillStyle = col; X.fillText(t, s.x, s.y); };
  if (G.secret && !G.secret.opened) lab(G.secret.c, 1.7, 'Cracked wall — strike it!', '#ffb050', 260);
  if (G.braz && !G.braz.done) for (const b of G.braz.list) lab(b, 1.6, b.lit ? 'Lit' : 'Unlit brazier — walk to it', b.lit ? '#ffb04a' : '#c8a070', 300);
  for (const h of G.haz) lab(h, .5, h.h.n, h.h.col === '#2a1040' ? '#c080ff' : h.h.col, 160);
  for (const t of G.trophies || []) lab(t, 1.6, '★ ' + t.n, '#ffd27a', 140);
  for (const e of G.ens) if (e.type === 'cage' && !e.dead) lab(e, 1.9, 'Prisoner — break the cage!', '#ffe9a0', 360);
};
const _dmB = drawMini;
drawMini = function () {
  _dmB(); const c = H.mctx, s = miniS(), R = Math.floor(190 / s / 2), ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
  const mark = (o, col, ch) => { if (!o) return; const dx = o.x / TILE - ptx, dy = o.y / TILE - pty; if (Math.abs(dx) >= R || Math.abs(dy) >= R) return; c.fillStyle = col; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText(ch, (dx + R) * s, (dy + R) * s + 4); };
  if (G.braz && !G.braz.done) for (const b of G.braz.list) if (!b.lit) mark(b, '#ffb04a', '◇');
  for (const e of G.ens) if (e.type === 'cage' && !e.dead) mark(e, '#ffe9a0', '!');
};
const _uhB = updateHUD;
updateHUD = function (dt) {
  _uhB(dt); if (!S || !P || G.mode === 'title' || !M) return;
  let el = $('h-exp'); if (!el) { el = document.createElement('div'); el.id = 'h-exp'; el.style.cssText = 'font-size:12px;margin-top:4px;color:#b8c8e0'; const tl = $('h-tl'); if (tl) tl.appendChild(el); }
  if (G.inTown || G.tutorial) { setH(el, 'hexp', ''); return; }
  const parts = [];
  if (G.floorTiles && !G.boss) parts.push(G.explored ? ico('map') + ' Fully explored ' + ico('check') : `${ico('map')} Explored ${Math.floor((G.expPct || 0) * 100)}%`);
  if (G.braz && !G.braz.done) parts.push(`${ico('fire')} Braziers ${G.braz.list.filter(b => b.lit).length}/3`);
  if (G.inHaz) parts.push(`<span style="color:#ff9a6a">${ico('warn')} ${G.inHaz.n}</span>`);
  setH(el, 'hexp', parts.join(' • '));
};
