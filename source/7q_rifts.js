// ================= THE RIFT ATLAS: a structured endgame after The Unmaker =================
// Tiers of short Rift runs. Every Rift has a different OBJECTIVE (purge, survive, hunt champions, siphon a crystal,
// chase a thief, close anchors, slay Wardens), a biome and a few MODIFIERS that raise the reward.
// Clear any node to open the next tier; clear all three to master it. Every 4th tier is a Warden gate.
// Foes are tuned to YOUR damage and life (like the Abyss), so every weapon gets the same fair, rising challenge.
// Atlas Shards buy permanent Atlas passives. A no-death streak raises shard income.
const RIFT_OBJ = {
  purge:  { n: 'Purge', ic: 'skull', col: '#ff7a5a', room: 'dungeon', d: 'Slay the marked foes of this floor', par: 110 },
  survive:{ n: 'Survival', ic: 'hourglass', col: '#ffb85a', room: 'arena', d: 'Hold out against endless waves for 60 seconds', par: 60 },
  hunt:   { n: 'Champion Hunt', ic: 'target', col: '#ffd27a', room: 'dungeon', d: 'Find and slay 3 roaming Champions', par: 120 },
  siphon: { n: 'Siphon', ic: 'gem', col: '#7ae0ff', room: 'arena', d: 'Stand in the crystal\'s circle to charge it — foes nearby slow the charge', par: 70 },
  chase:  { n: 'Gilded Thief', ic: 'gold', col: '#ffd54a', room: 'dungeon', d: 'Catch the fleeing thief before it escapes (it keeps coming back, but each escape costs reward)', par: 75 },
  ritual: { n: 'Anchor Ritual', ic: 'portal', col: '#c08aff', room: 'dungeon', d: 'Close 3 rift anchors: stand in each for 4 seconds while foes pour out', par: 120 },
  warden: { n: 'Warden Gate', ic: 'crown', col: '#ff5a8a', room: 'arena', d: 'Two Guardians, one after the other', par: 120 },
};
const RIFT_MODS = [
  { k: 'swift', n: 'Swift', d: 'foes move 20% faster', rw: .15 },
  { k: 'ruth', n: 'Elite Pack', d: 'many more elites', rw: .25 },
  { k: 'regen', n: 'Unyielding', d: 'foes regenerate 1% life per second', rw: .15 },
  { k: 'hard', n: 'Hardened', d: 'foes take 15% less damage', rw: .2 },
  { k: 'hail', n: 'Hailstorm', d: 'enemy projectiles fly 30% faster', rw: .15 },
  { k: 'thin', n: 'Thin Potions', d: 'potions heal 40% less', rw: .2 },
  { k: 'wither', n: 'Withering', d: 'you do not regenerate life', rw: .2 },
  { k: 'blood', n: 'Bloodless', d: 'your life steal is halved', rw: .15 },
  { k: 'horde', n: 'Horde', d: '40% more foes, each a little weaker', rw: .2 },
  { k: 'brutal', n: 'Brutal', d: 'foes hit 20% harder', rw: .25 },
];
const RIFT_BONUS = { gear: { n: 'Extra gear', ic: 'swords', d: '+1 item in the cache' }, gems: { n: 'Gem cache', ic: 'gem', d: '+2 gems' }, gold: { n: 'Gold vault', ic: 'gold', d: 'a big pile of gold' }, shards: { n: 'Shard surge', ic: 'sparkle', d: '+50% Atlas Shards' }, xp: { n: 'Insight', ic: 'book', d: '+15% of a level in XP' } };
const ATLAS_PAS = [
  { k: 'might', n: 'Might', ic: 'might', d: '+3% damage per rank', f: (s, r) => { s.dmg += 3 * r; } },
  { k: 'bulwark', n: 'Bulwark', ic: 'shield', d: '+4% life per rank', f: (s, r) => { s.hpPct += 4 * r; } },
  { k: 'fortune', n: 'Fortune', ic: 'clover', d: '+8% magic find and gold per rank', f: (s, r) => { s.luck += 8 * r; s.gold += 8 * r; } },
  { k: 'swift', n: 'Rift Walker', ic: 'steps', d: '+2% move speed and +2% cooldown speed per rank', f: (s, r) => { s.moveSpd += 2 * r; s.cdr += 2 * r; } },
  { k: 'lore', n: 'Rift Lore', ic: 'book', d: '+10% Atlas Shards and better Rift caches per rank', f: () => {} },
];
const ATLAS_MAXR = 5, ATLAS_ACT = ['I', 'II', 'III'];
function atlasOn() { return !!(S && S.done && S.done.some(d => d && d[NREG - 1])); }
function atlas() { if (!S.atlas) S.atlas = { tier: 1, clr: {}, sh: 0, pas: {}, seed: (Math.random() * 1e9) | 0, streak: 0, best: {}, runs: 0, rr: {} }; const A = S.atlas; A.clr = A.clr || {}; A.pas = A.pas || {}; A.best = A.best || {}; A.rr = A.rr || {}; return A; }
function pasR(k) { return S && S.atlas && S.atlas.pas ? S.atlas.pas[k] | 0 : 0; }
function pasCost(k) { return 10 + 8 * pasR(k); }
function isWardenT(t) { return t % 4 === 0; }
function riftRng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function tierNodes(t) { const A = atlas(), rnd_ = riftRng(A.seed + t * 7919 + (A.rr[t] | 0) * 104729), pk = a => a[Math.floor(rnd_() * a.length)];
  const nm = t < 3 ? 0 : t < 7 ? 1 : t <= 12 ? 2 : 3, out = [];
  const objs = isWardenT(t) ? ['warden'] : (() => { const pool = Object.keys(RIFT_OBJ).filter(k => k !== 'warden'), o = []; while (o.length < 3) o.push(pool.splice(Math.floor(rnd_() * pool.length), 1)[0]); return o; })();
  for (const ob of objs) { const pool = RIFT_MODS.slice(), mods = []; while (mods.length < nm + (ob === 'warden' ? 0 : 0)) mods.push(pool.splice(Math.floor(rnd_() * pool.length), 1)[0].k);
    out.push({ t, ob, reg: Math.floor(rnd_() * NREG), mods, bonus: pk(Object.keys(RIFT_BONUS)) }); }
  return out; }
function featOb() { const k = Object.keys(RIFT_OBJ).filter(x => x !== 'warden'); return k[(typeof weekId === 'function' ? weekId() : 0) % k.length]; }
function nodeRw(n) { return 1 + n.mods.reduce((a, k) => a + (RIFT_MODS.find(m => m.k === k) || { rw: 0 }).rw, 0); }
function tierCleared(t) { const c = atlas().clr[t]; return !!c && Object.values(c).some(Boolean); }
function tierMastered(t) { const c = atlas().clr[t] || {}, n = tierNodes(t).length; return Object.values(c).filter(Boolean).length >= n; }
// ---------- tuning: always a real challenge for YOUR strength, never a wall ----------
function riftFit(T, kind) { const life = myLife(), dps = myDps(), drk = Math.max(.4, 1 - Math.min(60, (ST && ST.dr) || 0) / 100);
  const t = kind === 'boss' ? 22 + T * 2.2 : kind === 'champ' ? 9 + T * .9 : (1.6 + T * .32) * (kind === 'elite' ? 3 : 1);
  const hit = kind === 'boss' ? Math.min(.5, .1 + Math.min(T, 12) * .014 + Math.max(0, T - 12) * .007) : Math.min(.36, .06 + Math.min(T, 12) * .011 + Math.max(0, T - 12) * .005) * (kind === 'elite' || kind === 'champ' ? 1.3 : 1);
  return { hp: dps * t, dmg: life * hit / drk }; }
function riftApply(e) { const R = G.rift; if (!R || !e || e.prop || e.riftFit) return; e.riftFit = 1; const kind = e.boss ? 'boss' : e.champ ? 'champ' : e.elite ? 'elite' : 'n';
  if (e.type === 'gimp') { e.hp = e.maxHp = myDps() * (3 + R.T * .25); e.life = 22; e.spd *= 1.1; return; }
  const f = riftFit(R.T, kind), horde = R.mods.includes('horde') ? .75 : 1, brutal = R.mods.includes('brutal') ? 1.2 : 1;
  e.hp = e.maxHp = f.hp * horde * rnd(.9, 1.1); e.dmg = f.dmg * brutal; if (R.mods.includes('swift')) e.spd *= 1.2; e.counted = true; }
// ---------- starting / ending ----------
let RIFT_PEND = null;
function startRift(t, i) { const A = atlas(); if (!atlasOn()) return toast('Defeat The Unmaker to open the Rift Atlas', '#ff8a8a');
  if (t > A.tier) return toast('Clear a Rift on the tier before to open this one', '#ff8a8a'); if (typeof NET !== 'undefined' && NET.coopGuest) return toast('Only the party leader can open a Rift', '#ff8a8a');
  const n = tierNodes(t)[i]; if (!n) return; const O = RIFT_OBJ[n.ob]; closeMenu(); RIFT_PEND = { ...n, i };
  enterFloor(n.reg, O.room === 'arena' ? BOSS_F : ri(1, 4)); }
{ const _rlR = resetLevel; resetLevel = function () { _rlR(); G.rift = null; if (RIFT_PEND) { const n = RIFT_PEND; RIFT_PEND = null; G.rift = { T: n.t, i: n.i, ob: n.ob, mods: n.mods, bonus: n.bonus, reg: n.reg, st: 'go', time: 0, prog: 0, need: 1, wT: 2, wave: 0, esc: 0, items: [] }; } }; }
{ const _cpR = calcPw; calcPw = function () { if (G.rift && S) return Math.max(1, regionPw() + Math.floor(G.rift.T / 2)); return _cpR(); }; }
{ const _gdR = genDungeon; genDungeon = function (f) { if (G.rift) G.mod = null; return _gdR(f); }; }
{ const _blR = buildLevel; buildLevel = function () { if (G.rift && !G.inTown) { G.stairs = null; G.totem = null; G.memory = null; G.mod = null; } return _blR.apply(this, arguments); }; }
{ const _mkR = mkEnemy; mkEnemy = function (type, x, y, o = {}) { if (G.rift && !o.prop && EN[type] && EN[type].ai !== 'prop' && !o.elite && type !== 'gimp' && Math.random() < (G.rift.mods.includes('ruth') ? .22 : .06) + G.rift.T * .006) o = { ...o, elite: true };
  const e = _mkR(type, x, y, o); if (G.rift && e && !e.prop) riftApply(e); return e; }; }
{ const _mbR = mkBoss; mkBoss = function (k, x, y) { const e = _mbR(k, x, y); if (G.rift && e) riftApply(e); return e; }; }
// Rift modifiers reuse the curse effects
{ const _cuR = curse; curse = function (k) { return _cuR(k) || !!(G.rift && G.rift.mods.includes(k)); }; }
{ const _xsR = extraStats; extraStats = function (s) { _xsR(s); if (!S) return; for (const P_ of ATLAS_PAS) { const r = pasR(P_.k); if (r) P_.f(s, r); } if (!G.rift) return; if (G.rift.mods.includes('blood')) s.ls *= .5; if (G.rift.mods.includes('wither')) { s.hpReg = 0; s.regPct = 0; } }; }
let RIFT_SNAP = 0; // true while the co-op floor snapshot is taken (the party may follow you; saves still skip Rifts)
{ const _crR = canResume; canResume = function () { return _crR() && (!G.rift || RIFT_SNAP); }; }
{ const _dieR = die; die = function () { const R = G.rift; _dieR(); if (R && G.mode === 'dead') { R.st = 'fail'; atlas().streak = 0; toast(`${ico('portal')} The Rift collapses — no gold lost in a Rift, but your streak resets.`, '#ff8a8a'); G.retry = null; if (G.lostGold) { S.gold += G.lostGold; G.lostGold = 0; } saveGame(); } }; }
{ const _bdR = bossDefeated; bossDefeated = function (e) { if (!G.rift) return _bdR(e); G.boss = null; shake(18); G.slow = .8; sfx('bossdown'); dropItem(genItem(G.pw + 1, { minR: 2, bonus: .3 }), e.x, e.y); drop('ore', ri(3, 6), e.x, e.y); G.rift.prog++; if (G.rift.prog < G.rift.need) { banner('Warden Slain!', 'The second Warden approaches…', '#ff5a8a'); G.later.push({ t: 3, fn: () => riftWarden() }); } }; }
function riftWarden() { const R = G.rift; if (!R || R.st !== 'go') return; const keys = Object.keys(BOSS), k = keys[(R.T * 3 + R.prog * 5 + R.reg) % keys.length]; const b = mkBoss(k, 20.5 * TILE, 11 * TILE); G.boss = b; banner(BOSS[k].n, `Warden ${R.prog + 1} of ${R.need}`, '#ff5a8a'); sfx('boss'); }
function riftSpawn(n, near, eliteC) { const R = G.rift, pool = REG[R.reg].en, alive = G.ens.filter(e => !e.dead && !e.prop).length; n = Math.min(n, 30 - alive); let k = 0;
  for (let i = 0; i < n; i++) { const p = randFloorNear(near.x, near.y, 210, 340, 14); if (!p) continue; const e = mkEnemy(pick(pool), p.x, p.y, { awake: true, elite: Math.random() < eliteC }); if (e) { e.riftW = 1; k++; } }
  if (k) ringFx(near.x, near.y, 260, RIFT_OBJ[R.ob].col, .5); return k; }
function waveN(R) { return Math.round((4 + Math.min(8, R.T * .4)) * (R.mods.includes('horde') ? 1.4 : 1)); }
// set the objective up once the floor exists
{ const _efR = enterFloor; enterFloor = function (r, f, d) { _efR(r, f, d); const R = G.rift; if (!R) return; const O = RIFT_OBJ[R.ob];
  G.later = []; S.atlas.runs = (S.atlas.runs || 0) + 1;
  if (O.room === 'arena') { G.ens = G.ens.filter(e => !e.boss); G.boss = null; }
  if (R.ob === 'purge') { const all = G.ens.filter(e => !e.prop && e.counted && e.type !== 'gimp'); R.need = Math.max(12, Math.ceil(all.length * .75)); G.killed = 0; }
  if (R.ob === 'survive') { R.need = 60; R.wT = 1.5; }
  if (R.ob === 'siphon') { R.need = 100; R.crys = { x: 20.5 * TILE, y: 15 * TILE }; R.wT = 2; }
  if (R.ob === 'hunt') { R.need = 3; for (let i = 0; i < 3; i++) { const p = spotM(); if (!p) continue; const e = mkEnemy(pick(REG[R.reg].en), p.x, p.y, { elite: true }); if (e) { e.champ = 1; e.riftFit = 0; riftApply(e); e.r *= 1.15; e.xp *= 3; e.gold *= 3; } } }
  if (R.ob === 'chase') { R.need = 1; riftThief(); }
  if (R.ob === 'ritual') { R.need = 3; R.anc = []; for (let i = 0; i < 6 && R.anc.length < 3; i++) { const p = spotM(); if (p && R.anc.every(a => dist(a, p) > 300) && dist(p, P) > 250) R.anc.push({ x: p.x, y: p.y, c: 0, done: false }); } while (R.anc.length < 3) { const p = spotM() || { x: P.x + 200, y: P.y }; R.anc.push({ x: p.x, y: p.y, c: 0, done: false }); } }
  if (R.ob === 'warden') { R.need = 2; G.later.push({ t: 2.2, fn: () => riftWarden() }); }
  banner(`Rift — ${O.n}`, `Tier ${R.T} • ${REG[R.reg].n}${R.mods.length ? ' • ' + R.mods.map(k => RIFT_MODS.find(m => m.k === k).n).join(', ') : ''}`, O.col); sfx('shrine');
  toast(`${ico(O.ic)} <b>${O.n}:</b> ${O.d}`, O.col); if (typeof buildLevel === 'function' && (R.anc || R.crys)) buildLevel(); }; }
function riftThief() { const R = G.rift; let p = null; for (let i = 0; i < 12; i++) { const q = spotM(); if (q && dist(q, P) > 380) { p = q; break; } } p = p || spotM(); if (!p) return; const e = mkEnemy('gimp', p.x, p.y, { awake: true }); if (e) { e.thief = 1; e.d = { ...e.d, n: 'Gilded Thief' }; R.thief = e; for (let i = 0; i < 3; i++) { const q = randFloorNear(p.x, p.y, 40, 120, 10); if (q) mkEnemy(pick(REG[R.reg].en), q.x, q.y, {}); } toast(`${ico('gold')} A Gilded Thief appears — catch it!`, '#ffd54a'); } }
// ---------- objective logic ----------
{ const _uR = update; update = function (dt) { _uR(dt); const R = G.rift; if (!R || G.mode !== 'play' || G.menu || G.inTown || !P) return;
  if (R.st === 'done') { if (R.exit && dist(P, R.exit) < 36) { R.exit = null; const got = riftCollect(); sfx('stairs'); goTown(); if (got) toast(`${ico('bag')} Picked up ${got} item${got > 1 ? 's' : ''} you left behind`, '#9ad0ff'); toast(`${ico('portal')} Back in Haven — pick your next Rift`, '#c08aff'); G.later.push({ t: .6, fn: () => { if (!G.menu && G.inTown) openMenu('atlas'); } }); } return; }
  if (R.st !== 'go') return; R.time += dt; R.wT -= dt; const eC = Math.min(.35, .08 + R.T * .015);
  if (R.ob === 'purge') { R.prog = Math.min(R.need, G.killed); }
  else if (R.ob === 'survive') { R.prog = Math.min(R.need, R.time); if (R.wT <= 0 && R.time < R.need - 4) { R.wT = 6.5; R.wave++; riftSpawn(waveN(R) + Math.floor(R.wave / 2), P, eC); } }
  else if (R.ob === 'siphon') { const C = R.crys, near = G.ens.filter(e => !e.dead && !e.prop && dist(e, C) < 170).length; const inside = dist(P, C) < 130;
    R.prog = clamp(R.prog + (inside ? 2.6 * Math.max(.3, 1 - .1 * near) : -1) * dt, 0, 100); R.inside = inside; R.near = near; if (R.wT <= 0) { R.wT = 7; R.wave++; riftSpawn(waveN(R), C, eC); } }
  else if (R.ob === 'hunt') { R.prog = 3 - G.ens.filter(e => e.champ && !e.dead).length; }
  else if (R.ob === 'chase') { const T_ = R.thief; if (T_ && T_.dead) { if (T_.hp > 0) { R.esc++; R.thief = null; G.later.push({ t: 4, fn: () => { if (G.rift === R && R.st === 'go') riftThief(); } }); toast(`The thief slipped away! Another one will show up (reward −${R.esc * 15}%)`, '#c8a040'); } else R.prog = 1; } }
  else if (R.ob === 'ritual') { for (const a of R.anc) { if (a.done) continue; const on = dist(P, a) < 72; if (on && !a.live) { a.live = 1; riftSpawn(waveN(R), a, eC); sfx('boss'); } if (a.c >= .5 && !a.half) { a.half = 1; riftSpawn(Math.ceil(waveN(R) * .6), a, eC); } a.c = clamp(a.c + (on ? dt / 4 : -dt / 8), 0, 1); if (a.c >= 1) { a.done = true; ringFx(a.x, a.y, 160, '#c08aff', .6); burst(a.x, a.y, '#c08aff', 40, 260, .8, 4, 1); sfx('shrine'); toast(`${ico('portal')} Anchor closed (${R.anc.filter(x => x.done).length}/3)`, '#c08aff'); } } R.prog = R.anc.filter(a => a.done).length; }
  if (R.prog >= R.need) riftDone(); }; }
function riftCollect() { let n = 0; for (const p of G.pick) { if (p.dead || p.k !== 'item') continue; const it = p.it; if (typeof pickSkip === 'function' && pickSkip(it)) continue; p.dead = true;
  if (typeof autoSalvOk === 'function' && autoSalvOk(it)) { noteFound(it); S.shards += SALV[it.r] || 0; continue; } it.isNew = true; (S.inv.length < S.invMax ? S.inv : S.stash).push(it); noteFound(it); n++; } return n; }
function riftDone() { const R = G.rift, A = atlas(), O = RIFT_OBJ[R.ob]; R.st = 'done'; const fast = R.time <= O.par;
  for (const e of G.ens) if (!e.dead && !e.prop && (e.riftW || R.ob === 'survive' || R.ob === 'siphon')) { e.dead = true; burst(e.x, e.y, O.col, 10, 160, .5, 3, .5); }
  const first = !tierCleared(R.T), wasMaster = tierMastered(R.T); A.clr[R.T] = A.clr[R.T] || {}; A.clr[R.T][R.i] = 1; if (R.T >= A.tier) A.tier = R.T + 1; const mastered = !wasMaster && tierMastered(R.T);
  A.streak = (A.streak || 0) + 1; const lore = pasR('lore'), esc = Math.max(.4, 1 - R.esc * .15);
  let sh = Math.round((4 + R.T * 1.2) * nodeRw(R) * (1 + Math.min(.5, (A.streak - 1) * .1)) * (1 + lore * .1) * (R.bonus === 'shards' ? 1.5 : 1) * esc * (fast ? 1.2 : 1) * (R.ob === featOb() ? 1.5 : 1)); if (first) sh += 10 + R.T * 2; if (mastered) sh += 15 + R.T * 3; A.sh += sh;
  const best = A.best[R.ob]; if (!best || R.time < best) A.best[R.ob] = Math.round(R.time);
  const c = P, pw = regionPw() + 1 + Math.floor(R.T / 3), minR = R.T >= 13 ? 5 : R.T >= 9 ? 4 : R.T >= 5 ? 3 : 2, bon = .2 + R.T * .03 + lore * .04, nIt = (R.ob === 'warden' ? 3 : 2) + (R.bonus === 'gear' ? 1 : 0) + (fast ? 1 : 0);
  for (let i = 0; i < nIt; i++) dropItem(genItem(pw, { minR: i === 0 ? minR : Math.max(1, minR - 1), bonus: bon * esc }), c.x + rnd(-30, 30), c.y + rnd(-30, 30));
  G.chests.push({ x: c.x + 40, y: c.y, open: false, mimic: false, t: 0 });
  if (R.bonus === 'gems') for (let i = 0; i < 2; i++) addGem(pick2(Object.keys(GEMS)), gemTier());
  if (R.bonus === 'gold') for (let i = 0; i < 14; i++) coin(c.x + rnd(-40, 40), c.y + rnd(-40, 40), Math.pow(1.12, G.pw) * 30 * nodeRw(R));
  gainXP(xpNeed(S.lvl) * (R.bonus === 'xp' ? .25 : .1) / (1 + ST.xp / 100)); S.marks += 4 + Math.floor(R.T / 2); if (typeof addRenown === 'function') addRenown(5 + R.T, 'Rift cleared');
  R.exit = randFloorNear(c.x, c.y, 150, 210, 16) || { x: c.x - 150, y: c.y }; R.sh = sh; R.fast = fast; R.first = first; R.mastered = mastered;
  banner('Rift Sealed!', `+${sh} Atlas Shards${fast ? ' • Swift clear!' : ''}${first ? ` • Tier ${R.T + 1} opened` : ''}${mastered ? ' • Tier mastered!' : ''}`, '#c08aff'); sfx('legend');
  toast(`${ico('portal')} Rift cleared in ${fmtMS(R.time)}${fast ? ` (under par ${fmtMS(O.par)} — bonus item)` : ` (par ${fmtMS(O.par)})`}. Step into the portal to return.`, '#c08aff');
  if (isWardenT(R.T) && first) G.later.push({ t: 2.5, fn: () => banner(`Act ${ATLAS_ACT[R.T / 4 - 1] || 'Endless'} complete`, R.T >= 12 ? 'The Endless Atlas opens — tiers keep rising' : 'New biomes and harder modifiers await', '#ffd27a') });
  saveGame(); buildLevel(); }
// ---------- 3D: anchors, the crystal and the exit portal ----------
{ const _beR = buildExtras; buildExtras = function () { _beR(); const R = G.rift; if (!R || G.inTown) return;
  const portalAt = (o, col) => { const g = new T3.Group(); g.position.set(o.x * U, 0, o.y * U); R3.lvl.add(g); const disc = mk(GEO.circ, basic(col, { op: .6, add: 1, unique: 1 }), .75, 1, 1, 0, 1.1, 0, g, false); disc.rotation.x = Math.PI / 2; const ring = mk(GEO.tor, mat(col, { em: 2.4 }), .78, .78, .78, 0, 1.1, 0, g, false); return { g, disc, ring }; };
  if (R.crys) { const g = new T3.Group(); g.position.set(R.crys.x * U, 0, R.crys.y * U); R3.lvl.add(g); const cm = mat('#7ae0ff', { em: 2 }); const cr = mk(GEO.oct, cm, .45, .8, .45, 0, 1.3, 0, g, false); mk(GEO.cyl, mat('#2a3a4a', { rough: .9 }), .55, .25, .55, 0, .12, 0, g);
    R3.anim.push(() => { cr.rotation.y = G.t * 1.5; cr.position.y = 1.3 + Math.sin(G.t * 2) * .08; cm.emissiveIntensity = 1 + (R.prog / 100) * 3 + (R.inside ? Math.sin(G.t * 10) * .4 : 0); }); }
  for (const a of R.anc || []) { if (a.done) continue; const p = portalAt(a, '#c08aff'); R3.anim.push(() => { p.ring.rotation.z = G.t * 2; p.disc.material.opacity = a.done ? 0 : .35 + .35 * a.c + .1 * Math.sin(G.t * 5); p.g.visible = !a.done; }); }
  if (R.exit) { const p = portalAt(R.exit, '#ffd27a'); R3.anim.push(() => { p.ring.rotation.z = -G.t * 2.5; p.disc.material.opacity = .45 + .2 * Math.sin(G.t * 4); }); } }; }
// ---------- HUD + world labels + pointer to the next goal ----------
function riftGoalText(R) { const O = RIFT_OBJ[R.ob];
  return R.ob === 'purge' ? `Slay foes ${R.prog}/${R.need}` : R.ob === 'survive' ? `Survive ${Math.max(0, Math.ceil(R.need - R.prog))}s` : R.ob === 'siphon' ? `Siphon ${Math.floor(R.prog)}%${R.inside ? (R.near ? ` (slowed by ${R.near} foes)` : ' (charging)') : ' — stand in the circle'}` : R.ob === 'hunt' ? `Champions ${R.prog}/3` : R.ob === 'chase' ? `Catch the thief${R.esc ? ` (escaped ×${R.esc})` : ''}` : R.ob === 'ritual' ? `Anchors ${R.prog}/3` : R.ob === 'warden' ? `Wardens ${R.prog}/${R.need}` : O.n; }
{ const _uhR = updateHUD; updateHUD = function (dt) { _uhR(dt); const el = typeof hudLine === 'function' && hudLine('h-rift'); if (!el) return; const R = G.rift; let t = '';
  if (R && !G.inTown) { const O = RIFT_OBJ[R.ob]; t = R.st === 'done' ? `<span style="color:#ffd27a">${ico('portal')} Rift sealed — step into the golden portal</span>` : `<span style="color:${O.col}">${ico(O.ic)} Rift T${R.T} • ${riftGoalText(R)} • ${fmtMS(R.time)}</span>${R.mods.length ? `<br><span class="dim" style="font-size:11px">${R.mods.map(k => RIFT_MODS.find(m => m.k === k).n).join(' • ')}</span>` : ''}`; }
  setH(el, 'rift', t); const sub = document.getElementById('h-sub'); if (R && !G.inTown && sub) setH(sub, 'sub', `<span style="color:#c08aff">Rift Tier ${R.T}</span> • ${RIFT_OBJ[R.ob].n}`); }; }
function riftTargets(R) { if (R.st === 'done') return R.exit ? [[R.exit, '#ffd27a', 'Exit portal']] : [];
  if (R.ob === 'hunt') return G.ens.filter(e => e.champ && !e.dead).map(e => [e, '#ffd27a', '★ Champion']);
  if (R.ob === 'chase') return R.thief && !R.thief.dead ? [[R.thief, '#ffd54a', 'Gilded Thief']] : [];
  if (R.ob === 'ritual') return R.anc.filter(a => !a.done).map(a => [a, '#c08aff', `Rift anchor${a.c > 0 ? ' ' + Math.round(a.c * 100) + '%' : ' — stand inside'}`]);
  if (R.ob === 'siphon') return [[R.crys, '#7ae0ff', `Crystal ${Math.floor(R.prog)}%`]];
  if (R.ob === 'purge' && R.prog >= R.need - 5) return G.ens.filter(e => e.counted && !e.dead && !e.prop).slice(0, 5).map(e => [e, '#ff7a5a', 'Last foes']);
  return []; }
function riftCircle(o, r, col, fill, k) { X.save(); X.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.2832, s = proj(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r, .04); if (i) X.lineTo(s.x, s.y); else X.moveTo(s.x, s.y); }
  X.globalAlpha = fill; X.fillStyle = col; X.fill(); X.globalAlpha = .9; X.strokeStyle = col; X.lineWidth = 2.5; X.setLineDash([10, 7]); X.lineDashOffset = -G.t * 30; X.stroke(); X.setLineDash([]);
  if (k > 0) { X.beginPath(); for (let i = 0; i <= 48 * k; i++) { const a = -Math.PI / 2 + i / 48 * 6.2832, s = proj(o.x + Math.cos(a) * (r + 8), o.y + Math.sin(a) * (r + 8), .04); if (i) X.lineTo(s.x, s.y); else X.moveTo(s.x, s.y); } X.lineWidth = 5; X.strokeStyle = '#fff'; X.globalAlpha = .85; X.stroke(); } X.restore(); }
function fmtMS(t) { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
{ const _doR = drawOverlay; drawOverlay = function () { _doR(); const R = G.rift; if (!R || !R3 || !P || G.inTown || G.hideHud || !M || G.menu) return; const ps = proj(P.x, P.y, 1);
  if (R.st === 'go' && R.crys && dist(P, R.crys) < 700) riftCircle(R.crys, 130, '#7ae0ff', R.inside ? .16 : .07, R.prog / 100);
  if (R.st === 'go') for (const a of R.anc || []) if (!a.done && dist(P, a) < 700) riftCircle(a, 72, '#c08aff', dist(P, a) < 72 ? .2 : .08, a.c);
  for (const [o, col, label] of riftTargets(R)) { const d = dist(P, o); const s = proj(o.x, o.y, 2.4);
    if (s.vis && d < 520) { X.textAlign = 'center'; X.font = 'bold 12px "Trebuchet MS",sans-serif'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(label, s.x, s.y); X.fillStyle = col; X.fillText(label, s.x, s.y); }
    if (d > 300 && ps.vis) { const a = Math.atan2(o.y - P.y, o.x - P.x), rx = ps.x + Math.cos(a) * 64, ry = ps.y + Math.sin(a) * 48; X.save(); X.translate(rx, ry); X.rotate(a); X.globalAlpha = .85; X.fillStyle = col; X.strokeStyle = 'rgba(0,0,0,.8)'; X.lineWidth = 2; X.beginPath(); X.moveTo(10, 0); X.lineTo(-6, -7); X.lineTo(-2, 0); X.lineTo(-6, 7); X.closePath(); X.stroke(); X.fill(); X.restore(); } } }; }
// ---------- co-op: the party follows the leader into a Rift, sees the objective and shares the reward ----------
if (typeof floorSnap === 'function') { const _fsR = floorSnap; floorSnap = function () { RIFT_SNAP = 1; try { return _fsR(); } finally { RIFT_SNAP = 0; } }; }
let RIFT_NT = 0;
{ const _uR2 = update; update = function (dt) { _uR2(dt); const R = G.rift; if (!R || typeof NET === 'undefined' || !NET.host || !NET.conns || !NET.conns.size) return; RIFT_NT -= dt; if (RIFT_NT > 0) return; RIFT_NT = 1;
  bcast({ t: 'rift', ob: R.ob, T: R.T, s: R.st === 'done' ? 'done' : riftGoalText(R).replace(/<[^>]*>/g, '').slice(0, 80) }); }; }
if (typeof netRecv === 'function') { const _nrR = netRecv; netRecv = function (c, m) { _nrR(c, m); if (!m || !NET.coopGuest) return;
  if (m.t === 'rift' && RIFT_OBJ[m.ob]) { NET.rift = { ob: m.ob, T: clamp(m.T | 0, 1, 999), s: String(m.s || '').slice(0, 80), at: G.t }; }
  if (m.t === 'riftDone' && S) { const T = clamp(m.T | 0, 1, 999), sh = clamp(m.sh | 0, 0, 600); const A = atlas(); A.sh += sh; if (T >= A.tier && atlasOn()) A.tier = T + 1; const pw = regionPw() + 1 + Math.floor(T / 3), minR = T >= 13 ? 5 : T >= 9 ? 4 : T >= 5 ? 3 : 2;
    for (let i = 0; i < 2; i++) dropItem(genItem(pw, { minR: i ? minR - 1 : minR, bonus: .2 + T * .03 }), P.x + rnd(-30, 30), P.y + rnd(-30, 30)); banner('Rift Sealed!', `Party clear • +${sh} Atlas Shards`, '#c08aff'); sfx('legend'); saveGame(); } }; }
{ const _rdR = riftDone; riftDone = function () { _rdR(); const R = G.rift; if (R && typeof NET !== 'undefined' && NET.host && NET.conns && NET.conns.size) bcast({ t: 'riftDone', T: R.T, sh: R.sh }); }; }
{ const _uhR2 = updateHUD; updateHUD = function (dt) { _uhR2(dt); if (G.rift || typeof NET === 'undefined' || !NET.coopGuest || !NET.rift || G.inTown || G.t - NET.rift.at > 3) return; const el = typeof hudLine === 'function' && hudLine('h-rift'); if (!el) return; const O = RIFT_OBJ[NET.rift.ob];
  setH(el, 'rift', NET.rift.s === 'done' ? `<span style="color:#ffd27a">${ico('portal')} Rift sealed — your leader can take everyone home</span>` : `<span style="color:${O.col}">${ico(O.ic)} Party Rift T${NET.rift.T} • ${esc(NET.rift.s)}</span>`); }; }
// ---------- the Atlas menu ----------
let ATLAS_VIEW = 0;
function rerollTier(t) { const A = atlas(), c = 4 + t; if (isWardenT(t)) return; if (A.sh < c) return toast(`Rerolling costs ${c} Atlas Shards`, '#ff8a8a'); A.sh -= c; A.rr[t] = (A.rr[t] | 0) + 1; if (A.clr[t]) A.clr[t] = Object.values(A.clr[t]).some(Boolean) ? { done: 1 } : {}; sfx('click'); saveGame(); renderMenu(); }
function buyPas(k) { const A = atlas(), c = pasCost(k); if (pasR(k) >= ATLAS_MAXR) return; if (A.sh < c) return toast(`Needs ${c} Atlas Shards`, '#ff8a8a'); A.sh -= c; A.pas[k] = pasR(k) + 1; calcStats(); sfx('lvl'); toast(`${ico('sparkle')} ${ATLAS_PAS.find(p => p.k === k).n} rank ${A.pas[k]}`, '#c08aff'); saveGame(); renderMenu(); }
MENUS.atlas = () => { if (!atlasOn()) return `<h2>${ico('portal')} The Rift Atlas</h2><div class="card">Defeat <b>The Unmaker</b> to open the Rift Atlas — a structured endgame of short, varied Rifts.</div><span class="btn" onclick="backMenu()">Back</span>`;
  const A = atlas(), top = A.tier, view = clamp(ATLAS_VIEW || top, 1, top); ATLAS_VIEW = view; const nodes = tierNodes(view), act = view > 12 ? 'Endless' : 'Act ' + ATLAS_ACT[Math.floor((view - 1) / 4)];
  const lo = Math.max(1, Math.min(view - 5, top - 10)), hi = Math.max(top, lo + 11);
  const track = Array.from({ length: hi - lo + 1 }, (_, j) => lo + j).map(t => `<span class="atk ${t === view ? 'on' : ''} ${tierMastered(t) ? 'ms' : tierCleared(t) ? 'cl' : ''} ${isWardenT(t) ? 'wd' : ''} ${t > top ? 'lk' : ''}" ${t <= top ? `onclick="ATLAS_VIEW=${t};renderMenu()"` : ''} title="Tier ${t}${isWardenT(t) ? ' — Warden gate' : ''}">${isWardenT(t) ? ico('crown') : t}</span>`).join('');
  const card = (n, i) => { const O = RIFT_OBJ[n.ob], B = RIFT_BONUS[n.bonus], done = (A.clr[view] || {})[i]; return `<div class="card rnode" style="--oc:${O.col}">
    <div class="rnh">${ico(O.ic)} <b>${O.n}</b>${done ? ' <span class="up">✓ cleared</span>' : ''}${n.ob === featOb() ? ' <span class="rfeat" title="Featured this week">★ +50% shards</span>' : ''}</div><div class="dim">${O.d}</div>
    <div class="rnm">${ico('map')} ${REG[n.reg].n}</div>${n.mods.length ? `<div class="rnm">${n.mods.map(k => { const m = RIFT_MODS.find(x => x.k === k); return `<span class="rmod" title="${m.d}">${m.n}</span>`; }).join('')}<span class="dim">+${Math.round((nodeRw(n) - 1) * 100)}% reward</span></div>` : '<div class="rnm dim">No modifiers</div>'}
    <div class="rnm">${ico(B.ic)} <span style="color:#ffd27a">${B.n}</span> <span class="dim">${B.d}</span></div><div class="dim" style="font-size:11px">Par ${fmtMS(O.par)}${A.best[n.ob] ? ` • your best ${fmtMS(A.best[n.ob])}` : ''}</div>
    <span class="btn" onclick="startRift(${view},${i})">${ico('portal')} Enter Rift</span></div>`; };
  const pas = ATLAS_PAS.map(p => { const r = pasR(p.k), c = pasCost(p.k); return `<div class="apas">${ico(p.ic)} <b>${p.n}</b> <span class="apip">${Array.from({ length: ATLAS_MAXR }, (_, j) => `<i class="${j < r ? 'on' : ''}"></i>`).join('')}</span> <span class="dim">${p.d}</span> ${r < ATLAS_MAXR ? `<span class="btn ${A.sh >= c ? '' : 'dis'}" onclick="buyPas('${p.k}')">+1 (${c} ${ico('sparkle')})</span>` : '<span class="up">max</span>'}</div>`; }).join('');
  return `<h2>${ico('portal')} The Rift Atlas <span class="dim" style="font-size:14px">${act} • Tier ${view}${view === top ? ' (newest)' : ''}</span></h2>
  <div class="card ahd"><span><b style="color:#c08aff">${ico('sparkle')} ${fmt(A.sh)}</b> Atlas Shards</span><span>${ico('fire')} Streak <b>${A.streak || 0}</b> <span class="dim">(+${Math.min(50, Math.max(0, (A.streak || 0)) * 10)}% shards, resets if you fall)</span></span><span>${ico('trophy')} Highest tier <b>${Math.max(0, top - 1)}</b></span><span>${ico('star')} Featured this week: <b style="color:#ffd27a">${RIFT_OBJ[featOb()].n}</b> <span class="dim">(+50% shards)</span></span><span class="dim">Clear any Rift to open the next tier • clear all three to master it • every 4th tier is a Warden gate</span></div>
  <div class="atrack">${track}</div>
  <div class="rgrid">${nodes.map(card).join('')}</div>
  ${isWardenT(view) ? '' : `<div style="margin:4px 0"><span class="btn" onclick="rerollTier(${view})">${ico('dice')} Reroll this tier's Rifts (${4 + view} ${ico('sparkle')})</span> <span class="dim">Foes are tuned to your own damage and life: every tier is a fair, rising fight with any weapon.</span></div>`}
  <h3>${ico('star')} Atlas Passives <span class="dim" style="font-size:12px">permanent, everywhere</span></h3>${pas}
  <span class="btn" onclick="backMenu()">Back</span>`; };
HUB.push(['atlas', ico('portal'), 'Rift Atlas', 'Endgame Rifts & passives', '']);
if (typeof HUB_GROUPS !== 'undefined' && HUB_GROUPS[1]) HUB_GROUPS[1][1].push('atlas');
UNLOCK.atlas = { n: 'Rift Atlas', ic: ico('portal'), kind: 'menu', how: 'Defeat The Unmaker', ok: () => atlasOn() };
{ const _ptR = MENUS.portal; MENUS.portal = () => { const h = _ptR(); if (!atlasOn()) return h; const A = atlas(); const card = `<div class="card" style="border-color:#c08aff"><b style="color:#c08aff">${ico('portal')} The Rift Atlas</b> <span class="dim">Tier ${A.tier} open • ${fmt(A.sh)} shards • streak ${A.streak || 0}</span><div>Short, varied Rifts — purge, survive, hunt champions, siphon crystals, chase thieves, close anchors and face Warden gates. Structured tiers, permanent passives.</div><span class="btn" onclick="openMenu('atlas')">Open the Atlas</span></div>`;
  return h.includes('<h3>Regions</h3>') ? h.replace('<h3>Regions</h3>', card + '<h3>Regions</h3>') : card + h; }; }
if (typeof MENU_TIP !== 'undefined') MENU_TIP.atlas = 'Pick a Rift: each has its own objective, biome and modifiers. Modifiers make it harder but raise the reward.';
ACH.push({ id: 'atlas4', n: 'Gatebreaker', d: 'Clear the first Warden gate of the Rift Atlas (tier 4)', c: () => S.atlas ? S.atlas.tier - 1 : 0, need: 4, sp: 2 },
  { id: 'atlas12', n: 'Atlas Conqueror', d: 'Clear Atlas tier 12', c: () => S.atlas ? S.atlas.tier - 1 : 0, need: 12, sp: 3 },
  { id: 'atlasStreak', n: 'Unbroken', d: 'Reach a Rift streak of 10', c: () => S.atlas ? S.atlas.streak || 0 : 0, need: 10, sp: 2 });
WIKI_TXT.world.push(['The Rift Atlas', 'Opens after you defeat The Unmaker (Waystone or the menu). Each tier offers three Rifts with different objectives — Purge, Survival, Champion Hunt, Siphon, Gilded Thief and Anchor Ritual — plus a biome, modifiers that raise the reward, and a bonus reward. Clear any one to open the next tier; clear all three to master it. Every 4th tier is a Warden gate (two Guardians back to back); after tier 12 the Endless Atlas keeps going. Rift foes are tuned to your own damage and life, so every weapon gets a fair, rising fight. Atlas Shards buy permanent passives; a streak of clears without falling boosts shard income. Beating par time adds a bonus item. Falling in a Rift costs no gold but resets your streak.']);
{ const st = document.createElement('style'); st.textContent = `
.atrack{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.atk{min-width:30px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid rgba(214,168,82,.3);background:rgba(0,0,0,.25);cursor:pointer;font:700 13px var(--f-num,'Trebuchet MS'),sans-serif;color:#c8b898}
.atk.cl{border-color:#7aff9a;color:#bfffcf}.atk.ms{background:rgba(122,255,154,.18);border-color:#7aff9a;color:#fff}.atk.wd{color:#ff7aa0}.atk.on{outline:2px solid #c08aff;box-shadow:0 0 10px rgba(192,138,255,.6)}.atk.lk{opacity:.35;cursor:default}
.rgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px}.rnode{margin:0!important;border-color:color-mix(in srgb,var(--oc) 55%,transparent)!important;display:flex;flex-direction:column;gap:4px}
.rnh{font-size:16px;color:var(--oc)}.rnm{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:12.5px}.rmod{padding:1px 7px;border-radius:9px;background:rgba(255,90,138,.14);border:1px solid rgba(255,90,138,.45);color:#ffb0c8;font-size:11.5px}
.rnode .btn{align-self:flex-start;margin-top:auto}.ahd{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center}
.rfeat{font-size:11px;padding:1px 6px;border-radius:8px;background:rgba(255,210,122,.16);border:1px solid rgba(255,210,122,.5);color:#ffd27a;vertical-align:middle}
.apas{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(214,168,82,.15)}.apip{display:inline-flex;gap:3px}.apip i{width:12px;height:7px;border-radius:4px;background:rgba(255,255,255,.12)}.apip i.on{background:#c08aff;box-shadow:0 0 6px #c08aff}`;
  document.head.appendChild(st); }
// ================= ABYSS EVENTS: optional bonus objectives so no two Abyss floors feel the same =================
// ~35% of normal Abyss floors roll one: a Champion Pack, a Gilded Thief, a Rift Tear (stand inside while foes pour out) or a Treasure Hoard guarded by elites.
const AEV = {
  champs: { n: 'Champion Pack', col: '#ffd27a', d: 'Three Champions roam this floor — slay them all for a cache' },
  thief:  { n: 'Gilded Thief', col: '#ffd54a', d: 'A thief with a sack of treasure is loose — catch it before it escapes' },
  tear:   { n: 'Rift Tear', col: '#c08aff', d: 'Close the tear (stand inside it) while the Abyss fights back' },
  hoard:  { n: 'Guarded Hoard', col: '#ff9a5a', d: 'A treasure hoard sits behind a ring of elites — break through' },
};
{ const _rlA = resetLevel; resetLevel = function () { _rlA(); G.aev = null; }; }
function aevReward(E, big) { const pw = G.pw + 1, d = G.depth | 0; for (let i = 0; i < (big ? 3 : 2); i++) dropItem(genItem(pw, { minR: d >= 20 ? 4 : 3, bonus: .25 + d * .01 }), P.x + rnd(-30, 30), P.y + rnd(-30, 30)); G.chests.push({ x: P.x + 40, y: P.y, open: false, mimic: false, t: 0 });
  S.marks += 3 + Math.floor(d / 4); S.stats.aev = (S.stats.aev || 0) + 1; banner(`${AEV[E.k].n} complete!`, 'A cache and treasure appear', AEV[E.k].col); sfx('legend'); E.done = 1; buildLevel(); }
{ const _efA = enterFloor; enterFloor = function (r, f, d) { _efA(r, f, d); if (!G.abyss || G.boss || G.rift || NET.coopGuest || !M || !M.rooms || M.rooms.length < 3 || Math.random() > .35) return;
  const k = pick(Object.keys(AEV)), E = G.aev = { k, done: 0, t: 0 };
  if (k === 'champs') { for (let i = 0; i < 3; i++) { const p = spotM(); if (!p) continue; const e = mkEnemy(pick(curReg().en), p.x, p.y, { elite: true }); if (e) { e.champ = 1; e.hp *= 1.25; e.maxHp = e.hp; e.r *= 1.15; e.xp *= 3; e.gold *= 3; } } }
  if (k === 'thief') { let p = null; for (let i = 0; i < 12 && !p; i++) { const q = spotM(); if (q && dist(q, P) > 380) p = q; } p = p || spotM(); if (p) { const e = mkEnemy('gimp', p.x, p.y, {}); if (e) { e.thief = 1; e.hp = e.maxHp = myDps() * (3 + Math.min(5, (G.depth | 0) * .1)); e.life = 26; E.thief = e; } } }
  if (k === 'tear') { const p = spotM(); if (p) { E.anc = { x: p.x, y: p.y, c: 0 }; } else G.aev = null; }
  if (k === 'hoard') { const p = spotM(); if (p) { E.hoard = { x: p.x, y: p.y }; for (let i = 0; i < 4; i++) { const q = randFloorNear(p.x, p.y, 40, 110, 10); if (q) { const e = mkEnemy(pick(curReg().en), q.x, q.y, {}); if (e) { e.guard = 1; e.hp *= 1.8; e.maxHp = e.hp; e.r *= 1.1; } } } } else G.aev = null; }
  if (G.aev) { G.later.push({ t: 2.4, fn: () => { if (G.aev === E) toast(`${ico('skull')} <b>Abyss Event — ${AEV[k].n}:</b> ${AEV[k].d}`, AEV[k].col); } }); if (E.anc || E.hoard) buildLevel(); } }; }
{ const _uA = update; update = function (dt) { _uA(dt); const E = G.aev; if (!E || E.done || G.mode !== 'play' || G.menu || !P) return; E.t += dt;
  if (E.k === 'champs' && E.t > 1 && !G.ens.some(e => e.champ && !e.dead)) aevReward(E, true);
  if (E.k === 'thief' && E.thief && E.thief.dead) { if (E.thief.hp <= 0) aevReward(E, true); else { E.done = 1; } }
  if (E.k === 'hoard' && E.hoard && E.t > 1 && !G.ens.some(e => e.guard && !e.dead) && dist(P, E.hoard) < 60) aevReward(E, true);
  if (E.k === 'tear' && E.anc) { const a = E.anc, on = dist(P, a) < 72; if (on && !a.live) { a.live = 1; for (let i = 0; i < 6; i++) { const q = randFloorNear(a.x, a.y, 200, 320, 12); if (q) mkEnemy(pick(curReg().en), q.x, q.y, { awake: true, elite: Math.random() < .25 }); } sfx('boss'); }
    a.c = clamp(a.c + (on ? dt / 5 : -dt / 10), 0, 1); if (a.c >= 1) aevReward(E, false); } }; }
{ const _beA = buildExtras; buildExtras = function () { _beA(); const E = G.aev; if (!E || E.done || G.inTown) return;
  if (E.anc) { const g = new T3.Group(); g.position.set(E.anc.x * U, 0, E.anc.y * U); R3.lvl.add(g); const disc = mk(GEO.circ, basic('#c08aff', { op: .5, add: 1, unique: 1 }), .7, 1, 1, 0, 1.1, 0, g, false); disc.rotation.x = Math.PI / 2; const ring = mk(GEO.tor, mat('#c08aff', { em: 2.4 }), .74, .74, .74, 0, 1.1, 0, g, false); R3.anim.push(() => { ring.rotation.z = G.t * 2; g.visible = !E.done; }); }
  if (E.hoard) { const g = new T3.Group(); g.position.set(E.hoard.x * U, 0, E.hoard.y * U); R3.lvl.add(g); const gm = mat('#ffd54a', { em: 1.2, metal: .8 }); for (let i = 0; i < 7; i++) mk(GEO.cyl, gm, .12, .03, .12, rnd(-.3, .3), .03 + i * .03, rnd(-.3, .3), g); mk(GEO.box, mat('#6a4428'), .5, .35, .35, 0, .2, .35, g); R3.anim.push(() => { g.visible = !E.done; }); } }; }
{ const _doA = drawOverlay; drawOverlay = function () { _doA(); const E = G.aev; if (!E || E.done || !R3 || !P || G.inTown || G.hideHud || G.menu) return; const col = AEV[E.k].col, ps = proj(P.x, P.y, 1);
  const tg = E.k === 'champs' ? G.ens.filter(e => e.champ && !e.dead).map(e => [e, '★ Champion']) : E.k === 'thief' ? (E.thief && !E.thief.dead ? [[E.thief, 'Gilded Thief']] : []) : E.k === 'tear' ? [[E.anc, `Rift Tear${E.anc.c ? ' ' + Math.round(E.anc.c * 100) + '%' : ' — stand inside'}`]] : [[E.hoard, G.ens.some(e => e.guard && !e.dead) ? 'Guarded Hoard' : 'Hoard — claim it']];
  if (E.anc && dist(P, E.anc) < 700) riftCircle(E.anc, 72, col, dist(P, E.anc) < 72 ? .2 : .08, E.anc.c);
  for (const [o, label] of tg) { const d = dist(P, o), s = proj(o.x, o.y, 2.4); if (s.vis && d < 520) { X.textAlign = 'center'; X.font = 'bold 12px "Trebuchet MS",sans-serif'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(label, s.x, s.y); X.fillStyle = col; X.fillText(label, s.x, s.y); }
    if (d > 300 && ps.vis) { const a = Math.atan2(o.y - P.y, o.x - P.x); X.save(); X.translate(ps.x + Math.cos(a) * 64, ps.y + Math.sin(a) * 48); X.rotate(a); X.globalAlpha = .8; X.fillStyle = col; X.strokeStyle = 'rgba(0,0,0,.8)'; X.lineWidth = 2; X.beginPath(); X.moveTo(10, 0); X.lineTo(-6, -7); X.lineTo(-2, 0); X.lineTo(-6, 7); X.closePath(); X.stroke(); X.fill(); X.restore(); } } }; }
{ const _uhA = updateHUD; updateHUD = function (dt) { _uhA(dt); const el = typeof hudLine === 'function' && hudLine('h-aev'); if (!el) return; const E = G.aev; let t = '';
  if (E && !E.done && !G.inTown) { const A_ = AEV[E.k]; const p = E.k === 'champs' ? ` ${3 - G.ens.filter(e => e.champ && !e.dead).length}/3` : E.k === 'tear' && E.anc.c ? ` ${Math.round(E.anc.c * 100)}%` : E.k === 'hoard' ? ` • guards ${G.ens.filter(e => e.guard && !e.dead).length}` : ''; t = `<span style="color:${A_.col}">${ico('skull')} ${A_.n}${p}</span>`; }
  setH(el, 'aev', t); }; }
WIKI_TXT.world.push(['Abyss Events', 'About a third of normal Abyss floors carry an optional event: a Champion Pack (three roaming Champions), a Gilded Thief, a Rift Tear to close by standing inside it, or a Guarded Hoard behind a ring of elites. Finish it for a cache, extra Rare+ items and Marks. A marker points the way.']);

// side-menu key hints: sit inside the button instead of on its rim
{ const st = document.createElement('style'); st.textContent = `#hud #h-menu .mb span{left:4px!important;bottom:3px!important;font:700 9px/10px var(--f-num,'Trebuchet MS'),sans-serif!important;padding:0 2px;border-radius:3px;background:rgba(11,9,16,.7);color:#cdbf9f!important}`; document.head.appendChild(st); }
// U opens the Rift Atlas (once unlocked); after falling in a Rift you land back at the Atlas
{ const _okR = onKey; onKey = function (k, e) { if (k === 'u' && !G.rebind && S && G.mode === 'play' && atlasOn() && (!G.menu || G.menu === 'atlas' || G.menu === 'pause')) { if (G.menu === 'atlas') closeMenu(); else openMenu('atlas'); return; } return _okR(k, e); }; }
let RIFT_BACK = 0;
{ const _dieR2 = die; die = function () { const r = !!G.rift; _dieR2(); if (r && G.mode === 'dead') RIFT_BACK = 1; }; }
{ const _gtR = goTown; goTown = function () { _gtR(); if (RIFT_BACK) { RIFT_BACK = 0; G.later.push({ t: .8, fn: () => { if (!G.menu && G.inTown && atlasOn()) openMenu('atlas'); } }); } }; }
if (typeof MENU_TIP !== 'undefined') MENU_TIP.atlas += ' Press U to open the Atlas anywhere.';
