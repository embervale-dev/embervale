// ================= ANIMATION SYSTEM: articulated rig + procedural animations =================
// ---------- rig: hips > legs > knees, waist > chest > head & arms > hands ----------
makeHumanoid = function (o) {
  const g = new T3.Group(), root = new T3.Group(); g.add(root);
  const body = mat(o.body, { rough: .6 }).clone(), dark = mat(shade3(o.body, .55)), trim = mat(shade3(o.body, 1.35), { rough: .5 });
  const skin = mat(o.skin || '#f0c8a0', { rough: .55 }), boot = mat('#3a2a1e', { rough: .8 }), leather = mat('#5a3a22', { rough: .7 }), gold = mat('#d8b040', { metal: .85, rough: .3 });
  const hips = new T3.Group(); hips.position.y = .46; root.add(hips);
  const leg = z => { const L = new T3.Group(); L.position.set(0, 0, z); hips.add(L); mk(GEO.caps, dark, .15, .17, .15, 0, -.12, 0, L); const K = new T3.Group(); K.position.y = -.23; L.add(K); mk(GEO.cylT, boot, .085, .17, .085, 0, -.08, 0, K); const ft = mk(GEO.box, boot, .2, .07, .14, .04, -.18, 0, K); return { L, K, ft }; };
  const LL = leg(.1), LR = leg(-.1);
  mk(GEO.cylT, body, .19, .14, .19, 0, .02, 0, hips);
  const chest = new T3.Group(); chest.position.y = .5; root.add(chest);
  const torso = mk(GEO.cylT, body, .23, .44, .2, 0, .2, 0, chest); torso.rotation.x = Math.PI;
  mk(GEO.box, trim, .02, .36, .1, .2, .2, 0, chest, false);
  mk(GEO.cyl, leather, .215, .06, .215, 0, .02, 0, chest); mk(GEO.box, gold, .03, .06, .07, .215, .02, 0, chest, false); mk(GEO.box, leather, .08, .1, .1, .12, -.04, .17, chest);
  mk(GEO.tor, trim, .16, .16, .16, 0, .43, 0, chest).rotation.x = Math.PI / 2;
  mk(GEO.cyl, skin, .06, .08, .06, 0, .48, 0, chest);
  for (const z of [.25, -.25]) mk(GEO.hemi, trim, .11, .08, .11, 0, .4, z, chest);
  const head = new T3.Group(); head.position.y = .62; chest.add(head);
  mk(GEO.sph, skin, .155, .165, .15, 0, 0, 0, head); mk(GEO.sphL, skin, .025, .03, .025, .16, -.02, 0, head, false);
  for (const z of [.055, -.055]) { mk(GEO.sphL, mat('#ffffff', { rough: .2 }), .028, .03, .028, .135, .025, z, head, false); mk(GEO.sphL, mat('#1a1a1a'), .016, .02, .016, .155, .025, z, head, false); mk(GEO.box, mat(o.hair || '#4a3020'), .02, .012, .045, .14, .065, z, head, false); }
  const hc = mat(o.hat || shade3(o.body, .8));
  if (o.hatType === 'helm') { const m = mat('#a8a8b8', { metal: .85, rough: .3 }); mk(GEO.hemi, m, .18, .19, .18, 0, .01, 0, head); mk(GEO.box, mat('#c83a2a'), .24, .1, .03, -.02, .19, 0, head); mk(GEO.box, m, .035, .12, .19, .165, -.01, 0, head); for (const z of [.15, -.15]) mk(GEO.coneL, m, .03, .08, .03, 0, .13, z, head, false); }
  else if (o.hatType === 'hood') { mk(GEO.hemi, hc, .2, .21, .2, -.01, 0, 0, head); mk(GEO.cylT, hc, .2, .14, .2, -.02, -.08, 0, head); const c = mk(GEO.cone, hc, .1, .24, .1, -.18, .1, 0, head); c.rotation.z = 1.2; }
  else if (o.hatType === 'wizard') { mk(GEO.cyl, hc, .28, .03, .28, 0, .12, 0, head); const c = mk(GEO.cone, hc, .17, .5, .17, -.05, .37, 0, head); c.rotation.z = .25; mk(GEO.tor, gold, .17, .17, .1, 0, .15, 0, head).rotation.x = Math.PI / 2; mk(GEO.oct, mat('#ffe080', { em: 2 }), .045, .045, .045, .08, .26, 0, head, false); mk(GEO.box, mat('#e8e8e8'), .1, .14, .14, .1, -.14, 0, head); }
  else if (o.hatType === 'hair') { mk(GEO.hemi, mat(o.hair || '#6a4a2a'), .17, .15, .17, -.015, .03, 0, head); mk(GEO.box, mat(o.hair || '#6a4a2a'), .08, .12, .26, -.12, -.04, 0, head); }
  let cape = null;
  if (o.cape) { cape = new T3.Group(); cape.position.set(-.17, .42, 0); chest.add(cape); const cm = mat(o.cape, { rough: .8 }); mk(GEO.box, cm, .03, .36, .38, -.02, -.18, 0, cape); const low = new T3.Group(); low.position.set(-.02, -.36, 0); cape.add(low); mk(GEO.box, cm, .03, .3, .36, 0, -.15, 0, low); mk(GEO.box, mat(shade3(o.cape, 1.4)), .035, .03, .37, 0, -.3, 0, low, false); cape.userData.low = low; }
  const arm = z => { const a = new T3.Group(); a.rotation.order = 'YZX'; a.position.set(0, .38, z); chest.add(a); mk(GEO.caps, body, .1, .2, .1, 0, -.15, 0, a); mk(GEO.cylT, leather, .055, .1, .055, 0, -.3, 0, a); mk(GEO.sphL, skin, .055, .055, .055, 0, -.37, 0, a); const h = new T3.Group(); h.position.set(0, -.38, 0); h.rotation.z = -Math.PI / 2; a.add(h); return { a, h }; };
  const R = arm(-.27), L = arm(.27);
  mk(GEO.circ, basic('#000000', { op: .32 }), .3, 1, .3, 0, .012, 0, g, false);
  return { g, root, hips, chest, head, legL: LL.L, legR: LR.L, kneeL: LL.K, kneeR: LR.K, armR: R.a, hand: R.h, armL: L.a, handL: L.h, torso, body, cape };
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
