// ================= MORE CONTENT: systems =================
// ---------- new weapon models ----------
const _mwM = makeWeapon;
makeWeapon = function (t) {
  const w = WT[t]; if (!['rapier', 'glaive', 'shuriken', 'scepter'].includes(t)) return _mwM(t);
  const g = new T3.Group(), metal = mat(w.col, { metal: .8, rough: .25 }), gold = mat('#d8b040', { metal: .9, rough: .25 });
  const X = (geo, m, l, r, x) => { const o = mk(geo, m, r, l, r, x, 0, 0, g); o.rotation.z = -Math.PI / 2; return o; };
  if (t === 'rapier') { X(GEO.cyl, mat('#3a2418'), .14, .025, .03); mk(GEO.tor, gold, .07, .07, .07, .12, 0, 0, g).rotation.y = Math.PI / 2; X(GEO.cyl, metal, .75, .012, .52); }
  if (t === 'glaive') { X(GEO.cyl, mat('#4a3a5a'), 1.2, .025, .45); const b = mk(GEO.halfTor, mat(w.col, { metal: .8, rough: .2, em: .3 }), .22, .22, .4, 1.1, 0, .12, g); b.rotation.x = Math.PI / 2; }
  if (t === 'shuriken') { for (let i = 0; i < 4; i++) { const c = mk(GEO.coneL, metal, .05, .16, .015, .15, 0, 0, g); c.rotation.z = i * Math.PI / 2; } mk(GEO.cyl, mat('#222'), .03, .02, .03, .15, 0, 0, g).rotation.x = Math.PI / 2; }
  if (t === 'scepter') { X(GEO.cyl, gold, .55, .025, .27); mk(GEO.oct, mat(w.col, { em: 2 }), .07, .1, .07, .6, 0, 0, g, false); mk(GEO.torThin, gold, .09, .09, .09, .6, 0, 0, g, false).rotation.y = Math.PI / 2; }
  return g;
};
// ---------- new skills ----------
const NEWSK = { warcry: 1, snare: 1, fblink: 1, singularity: 1 };
const _csM = castSkill;
castSkill = function (id) {
  if (!id || !NEWSK[id]) return _csM(id);
  const sk = SKI[id], r = S.sk[id] || 0; if (!r || (P.cds[id] || 0) > 0) return;
  if (P.mp < sk.mp) { toast('Not enough mana', '#7ab0ff'); sfx('error'); return; }
  P.mp -= sk.mp; P.cds[id] = sk.cd * (1 - ST.cdr / 100); G.chan = 0; P.atkAnim = .3; P.swingK = 'cast'; S.stats.casts = (S.stats.casts || 0) + 1;
  const W = mouseWorld(), pct = x => pdmg() * x / 100;
  if (id === 'warcry') { aoe(P.x, P.y, 190, pct(50), { skill: 1, kb: 420, stun: 1.5 }); P.buffs.warcry = 6; P.warcryR = r; ringFx(P.x, P.y, 190, '#ffb04a', .5); ringFx(P.x, P.y, 120, '#ff6a2a', .4); shake(10); sfx('boss'); }
  if (id === 'snare') { aoe(W.x, W.y, 115, pct(100 + 30 * r), { skill: 1 }); for (const e of G.ens) if (!e.dead && !e.boss && !e.prop && dist(e, W) < 115 + e.r) e.stun = Math.max(e.stun, 2 + .3 * r); ringFx(W.x, W.y, 115, '#c8e8a0', .5); burst(W.x, W.y, '#d8f0b0', 26, 200, .6, 2, .3); sfx('swing'); }
  if (id === 'fblink') {
    aoe(P.x, P.y, 100, pct(80 + 20 * r), { skill: 1, frz: 2.5 }); ringFx(P.x, P.y, 100, '#9ae8ff');
    let tx = W.x, ty = W.y; const d = Math.hypot(tx - P.x, ty - P.y); if (d > 340) { tx = P.x + (tx - P.x) / d * 340; ty = P.y + (ty - P.y) / d * 340; }
    for (let i = 0; i < 20 && hitsWall(tx, ty, P.r); i++) { tx += (P.x - tx) * .15; ty += (P.y - ty) * .15; }
    if (!hitsWall(tx, ty, P.r) && los(P, { x: tx, y: ty })) { burst(P.x, P.y, '#c8f4ff', 20, 180, .5, 3); P.x = tx; P.y = ty; }
    aoe(P.x, P.y, 100, pct(80 + 20 * r), { skill: 1, frz: 2.5 }); ringFx(P.x, P.y, 100, '#9ae8ff'); burst(P.x, P.y, '#c8f4ff', 24, 220, .5, 3); P.inv = .3; sfx('magic');
  }
  if (id === 'singularity') { G.zones.push({ kind: 'rift', x: W.x, y: W.y, r: 135, t: 0, dur: 4, tick: .25, tt: 0, dmg: pct(40 + 10 * r) * (1 + ST.skill / 100) }); sfx('boss'); }
};
const _pdM = pdmg; pdmg = function () { return _pdM() * (buff('warcry') ? 1 + (15 + 5 * (P.warcryR || 1)) / 100 : 1); };

// ---------- helpers ----------
function pick2(a) { return a[Math.floor(Math.random() * a.length)]; }
function spotM() { const rooms = M.rooms.slice(1); for (let i = 0; i < 40; i++) { const r = pick2(rooms); const tx = ri(r.x + 1, r.x + r.w - 2), ty = ri(r.y + 1, r.y + r.h - 2); const q = { x: (tx + .5) * TILE, y: (ty + .5) * TILE }; if (!G.chests.some(c => dist(c, q) < 70) && (!G.stairs || dist(q, G.stairs) > 90) && dist(q, P) > 200) return q; } return null; }
function petLvl(k) { return Math.min(10, Math.floor(Math.sqrt(((S.petXp || {})[k] || 0) / 20))); }
function applyPet(s) { const k = S.cos && S.cos.pet; if (!k || !PETS[k]) return; const z = { xp: 0, gold: 0, moveSpd: 0, ls: 0, hpPct: 0, cdr: 0, luck: 0, skill: 0, elite: 0, atkSpd: 0, dmg: 0, critD: 0, critC: 0 }; PETS[k].f(z); const m = 1 + .1 * petLvl(k); for (const q in z) s[q] += z[q] * m; }
function havenL(k) { return (S.haven && S.haven[k]) || 0; }
function sellMul() { return 1 + .15 * havenL('market'); }
function innL() { return havenL('inn'); }
const _xsM = extraStats; extraStats = function (s) { _xsM(s); for (const k in HAVEN_B) if (havenL(k)) HAVEN_B[k].f(s, havenL(k)); };
function spawnChampion(name) {
  const p = spotM(); if (!p) return null;
  const pool = curReg().en.filter(t => !['icet', 'ftur', 'steam', 'prism', 'watcher', 'urchin', 'barrel', 'crate'].includes(t) && EN[t].ai !== 'turret');
  const e = mkEnemy(pick2(pool.length ? pool : ['skel']), p.x, p.y, { elite: true });
  e.hp *= 3; e.maxHp = e.hp; e.r *= 1.15; e.xp *= 3; e.gold *= 5; e.d = { ...e.d, n: name }; e.champ = true; return e;
}

// ---------- level setup: fonts, altars, digs, champions, wanted marks ----------
const _rlM = resetLevel; resetLevel = function () { _rlM(); G.font = null; G.altar = null; G.dig = null; G.hauntT = 12; G.tempT = 0; G.kt = []; };
const _popM = populate;
populate = function (R) {
  _popM(R);
  if (G.trial) return;
  if (Math.random() < .18) { const p = spotM(); if (p) G.font = { ...p, used: false }; }
  if (Math.random() < .08) { const p = spotM(); if (p) G.altar = { ...p, used: false, near: false }; }
  if ((S.tmaps || 0) > 0 && Math.random() < .7) { const p = spotM(); if (p) { G.dig = { ...p, used: false }; toast(ico('map') + ' Your treasure map marks a spot on this floor! (gold ✕ on the minimap)', '#e0c080'); } }
  if (G.mod === 'bounty') for (let i = 0; i < 4; i++) { const p = spotM(); if (p) G.chests.push({ ...p, open: false, mimic: Math.random() < .08, t: 0 }); }
  if (!G.abyss && G.floor === 3) { const e = spawnChampion(pick2(CHAMP_NAMES[G.region])); if (e) G.later.push({ t: 1.5, fn: () => toast(`${ico('swords')} A champion stalks this floor: <b>${e.d.n}</b>`, '#ffb07a') }); }
  if (!G.abyss) for (const q of S.quests) if (q.t === 'wanted' && q.have < q.need && q.reg === G.region && G.floor >= 1 && G.floor < BOSS_F) { const e = spawnChampion(q.name); if (e) { e.wanted = 1; G.later.push({ t: 2, fn: () => toast(`${ico('scroll')} Your wanted target is here: <b>${q.name}</b>!`, '#ffd27a') }); } }
};
const _mkM = mkEnemy;
mkEnemy = function (type, x, y, o = {}) {
  const e = _mkM(type, x, y, o);
  if (!e.prop && !e.boss && !e.minion && !['gimp', 'dummy', 'tsentry'].includes(type) && Math.random() < 1 / 350) { e.golden = true; e.hp *= 3; e.maxHp = e.hp; e.gold *= 10; e.xp *= 3; e.d = { ...e.d, n: 'Golden ' + e.d.n, col: '#ffd54a' }; }
  return e;
};
const _enM = enterFloor; enterFloor = function (r, f, d) { _enM(r, f, d); const l = havenL('infirmary'); if (l && S.pots < S.potMax) S.pots = Math.min(S.potMax, S.pots + l); };

// ---------- combat hooks ----------
let recT = -99;
const _heM = hurtEnemy;
hurtEnemy = function (e, amt, o = {}) {
  if (!e.dead && !e.prop) {
    if (ST.u.executioner && e.hp < e.maxHp * .3) amt *= 1.5;
    S.stats.dmg = (S.stats.dmg || 0) + amt;
    if (amt > (S.stats.maxHit || 0)) { const old = S.stats.maxHit || 0; S.stats.maxHit = amt; if (old > 0 && G.t - recT > 25 && amt > old * 1.1) { recT = G.t; feed(`${ico('explosion')} New record hit: <b>${fmt(amt)}</b>!`, '#ffd54a'); } }
    if (buff('sanguine')) healP(Math.min(amt * .05, ST.maxHp * .03));
  }
  _heM(e, amt, o);
};
const _hpM = hurtPlayer;
hurtPlayer = function (a, src) {
  if (ST.u && ST.u.bulwark && P.inv <= 0 && P.dodgeT <= 0 && P.air <= 0 && a > 0 && G.mode === 'play' && Math.random() < .15) { P.inv = .25; dmgText(P.x, P.y - 24, 'BLOCKED', '#c8e0ff', true, 2); sfx('click'); ringFx(P.x, P.y, 40, '#c8e0ff', .25); return; }
  return _hpM(a, src);
};
const MK = [[3, 'Triple Kill!', '#ffd27a'], [5, 'Rampage!', '#ff9a3a'], [8, 'Massacre!!', '#ff5a5a'], [12, 'EMBERSTORM!!!', '#ff3aff']];
const _kmM = killEnemy;
killEnemy = function (e) {
  if (e.dead) return; _kmM(e); if (e.prop || ['dummy', 'tsentry'].includes(e.type)) return;
  if (ST.u.soulleech) { P.mp = Math.min(ST.maxMp, P.mp + ST.maxMp * .05); healP(ST.maxHp * .01); }
  if (buff('plenty')) for (let i = 0; i < 2; i++) coin(e.x, e.y, e.gold * rnd(1, 2.4) * (1 + goldEff() / 100));
  const pk = S.cos.pet; if (pk) { S.petXp = S.petXp || {}; const l0 = petLvl(pk); S.petXp[pk] = (S.petXp[pk] || 0) + (e.boss ? 40 : e.elite ? 4 : 1); if (petLvl(pk) > l0) { feed(`${ico('paw')} ${PETS[pk].n} reached level ${petLvl(pk)}! (+${petLvl(pk) * 10}% companion bonus)`, '#ffe9a0'); calcStats(); } }
  G.kt.push(G.t); G.kt = G.kt.filter(t => G.t - t < 1.3); const n = G.kt.length, m = MK.find(x => x[0] === n);
  if (m) { dmgText(P.x, P.y - 50, m[1], m[2], true, 2.8); if (n >= 5) sfx('lvl'); if (n >= 12) S.stats.storms = (S.stats.storms || 0) + 1; }
  if (e.golden) { S.stats.golden = (S.stats.golden || 0) + 1; const b = S.best[e.type]; if (b) b.g = (b.g || 0) + 1; for (let i = 0; i < 2; i++) dropItem(genItem(G.pw + 2, { minR: 2, bonus: .5 }), e.x, e.y); dropGem(e.x, e.y); toast(ico('sparkle') + ' You slew a Golden monster!', '#ffd54a'); sfx('legend'); }
  if (e.champ) { S.stats.champs = (S.stats.champs || 0) + 1; dropItem(genItem(G.pw + 2, { minR: 2, bonus: .3 }), e.x, e.y); dropGem(e.x, e.y); banner('Champion Slain!', e.d.n, '#ffb07a'); }
  if (e.wanted) for (const q of S.quests) if (q.t === 'wanted' && q.name === e.d.n && q.have < q.need) { q.have = q.need; toast(`${ico('scroll')} Bounty complete: ${q.txt}`, '#ffd27a'); }
  if (e.elite && Math.random() < .025) G.pick.push({ k: 'tmap', v: 1, x: e.x, y: e.y, vx: rnd(-80, 80), vy: rnd(-80, 80), t: 0, z: .4, vz: 3 });
};
const _gxM = gainXP; gainXP = function (x) { _gxM(G.mod === 'haunted' ? x * 1.4 : x); };
const _udpM = updPick;
updPick = function (dt) {
  for (const p of G.pick) {
    if (p.dead || p.t < .35 || dist(p, P) > P.r + 14) continue;
    if (p.k === 'tmap') { p.dead = true; S.tmaps = (S.tmaps || 0) + 1; feed(ico('map') + ' <span style="color:#e0c080">Treasure Map found!</span> <span class="dim">It will reveal a dig spot on a later floor</span>', '#e0c080'); sfx('shrine'); }
    if (p.k === 'ore' && G.mod === 'bounty' && !p.dbl) { p.dbl = 1; p.v *= 2; }
  }
  _udpM(dt);
};
const _upM = updPlayer;
updPlayer = function (dt) {
  const d0 = P.dodgeT, x0 = P.x, y0 = P.y; _upM(dt);
  if (d0 <= 0 && P.dodgeT > 0) { S.stats.dodges = (S.stats.dodges || 0) + 1; if (ST.u.swiftstep) { P.dodgeCd *= .6; P.buffs.windrun = Math.max(P.buffs.windrun || 0, 1); } }
  if (buff('echo')) for (const k in P.cds) if (P.cds[k] > 0) P.cds[k] -= dt;
  S.stats.dist = (S.stats.dist || 0) + Math.hypot(P.x - x0, P.y - y0) / TILE;
};
const _dpM = drinkPotion; drinkPotion = function () { const p0 = S.pots; _dpM(); if (S.pots < p0) S.stats.potions = (S.stats.potions || 0) + 1; };
const _nfM = noteFound; noteFound = function (it) { _nfM(it); if (!G.inTown) { S.stats.foundR = S.stats.foundR || [0, 0, 0, 0, 0, 0, 0]; S.stats.foundR[it.r]++; } };
const _atM = addTele; addTele = function (o) { _atM(S.opts.hc ? { ...o, col: '#fff04a' } : o); };
// ---------- per-frame world hooks ----------
let goldLast = null;
const _updM = update;
update = function (dt) {
  if (G.mode === 'play' && !G.menu && S && pressed.u) { G.hideHud = !G.hideHud; toast(G.hideHud ? 'HUD hidden — press U to show it again' : 'HUD visible'); }
  _updM(dt);
  if (G.mode !== 'play' || G.menu || !S || !P) return;
  if (goldLast !== null && S.gold > goldLast && !G.inTown) S.stats.goldEarned = (S.stats.goldEarned || 0) + S.gold - goldLast; goldLast = S.gold;
  if (G.inTown) return;
  if (G.mod === 'haunted') { G.hauntT -= dt; if (G.hauntT <= 0) { G.hauntT = 18; for (let i = 0; i < 2; i++) { const p = randFloorNear(P.x, P.y, 180, 280, 14); const e = mkEnemy(G.region >= 8 ? 'shade' : 'ghost', p.x, p.y, { awake: true, minion: true }); burst(p.x, p.y, '#a0b0ff', 14, 160, .6, 3); } } }
  if (buff('tempest')) { G.tempT -= dt; if (G.tempT <= 0) { G.tempT = .8; const near = G.ens.filter(e => !e.dead && !e.prop && e.awake && dist(e, P) < 450); if (near.length) { const e = pick2(near); strike(e.x, e.y, pdmg() * 1.2); } } }
  for (const e of G.ens) {
    if (e.dead || !e.awake || e.stun > 0) continue;
    if (e.elite === 'Arcane') { e.arcT = (e.arcT ?? rnd(1, 3)) - dt; if (e.arcT <= 0) { e.arcT = 3.5; ringShot(e, 8, rnd(0, 1), 190); } }
    if (e.elite === 'Blinking') { e.blT = (e.blT ?? rnd(2, 5)) - dt; if (e.blT <= 0 && dist(e, P) < 650) { e.blT = 5; burst(e.x, e.y, '#80ffe0', 14, 150, .5, 3); const p = randFloorNear(P.x, P.y, 120, 220, Math.min(e.r, 20)); e.x = p.x; e.y = p.y; burst(e.x, e.y, '#80ffe0', 14, 150, .5, 3); } }
  }
  const f = G.font; if (f && !f.used && dist(P, f) < 36) { f.used = true; P.hp = ST.maxHp; P.mp = ST.maxMp; S.pots = Math.min(S.potMax, S.pots + 1); burst(f.x, f.y, '#7affff', 40, 220, 1, 3, .6); ringFx(f.x, f.y, 90, '#7affff', .6); sfx('potion'); toast(ico('mana') + ' Ember Font: life and mana restored, +1 potion', '#7affff'); }
  const a = G.altar; if (a && !a.used) { const d = dist(P, a); if (d < 42 && !a.near) { a.near = true; openMenu('altar'); } else if (d > 80) a.near = false; }
  const g = G.dig; if (g && !g.used && dist(P, g) < 36) { g.used = true; S.tmaps = Math.max(0, (S.tmaps || 0) - 1); S.stats.digs = (S.stats.digs || 0) + 1; sfx('legend'); shake(8); banner('Buried Treasure!', 'X marks the spot', '#e0c080'); for (let i = 0; i < 16; i++) coin(g.x, g.y, Math.pow(1.12, G.pw) * rnd(3, 6) * (1 + goldEff() / 100)); for (let i = 0; i < 2; i++) dropItem(genItem(G.pw + 2, { minR: 3, bonus: .5 }), g.x, g.y); dropGem(g.x, g.y); dropGem(g.x, g.y); if (Math.random() < .12) drop('frag', 1, g.x, g.y); }
};
// ---------- quests: wanted posters ----------
const _gqM = genQuest;
genQuest = function () {
  if (Math.random() < .22) {
    const un = []; for (let r = 0; r < NREG; r++) if (r === 0 || S.done[S.diff][r - 1]) un.push(r);
    const reg = pick2(un), name = pick2(CHAMP_NAMES[reg]), pw = maxPw();
    return { t: 'wanted', reg, name, need: 1, have: 0, txt: `Wanted: ${name} — ${REG[reg].n} (floors 2–6)`, rw: { gold: Math.round(140 * Math.pow(1.12, pw)), ore: ri(3, 5), shards: ri(6, 10), item: true, marks: 15 } };
  }
  return _gqM();
};
const _cqM = claimQuest; claimQuest = function (i) { const q = S.quests[i]; const ok = q && q.have >= q.need; _cqM(i); if (ok && q.rw.marks) addMarks(q.rw.marks, 'wanted bounty'); if (ok && q.t === 'wanted') S.stats.wanted = (S.stats.wanted || 0) + 1; };

// ---------- render: new world objects, wheel, weather, minimap marks ----------
const _beM = buildExtras;
buildExtras = function () {
  _beM(); const L = R3.lvl;
  if (G.font) { const f = G.font, g = new T3.Group(); g.position.set(f.x * U, 0, f.y * U); L.add(g); mk(GEO.cyl, mat('#7a7a8a', { rough: .9 }), .45, .35, .45, 0, .17, 0, g); mk(GEO.cyl, mat('#5a5a6a'), .12, .5, .12, 0, .5, 0, g); const w = mk(GEO.cyl, mat('#4affff', { em: 1.8 }), .38, .04, .38, 0, .36, 0, g, false); const fl = mk(GEO.sphL, mat('#a0ffff', { em: 3 }), .1, .16, .1, 0, .85, 0, g, false); R3.torches.push({ x: f.x * U, y: 1, z: f.y * U, col: '#60ffff' }); R3.anim.push(() => { w.visible = fl.visible = !f.used; fl.position.y = .85 + Math.sin(G.t * 3) * .05; }); }
  if (G.altar) { const a = G.altar, g = new T3.Group(); g.position.set(a.x * U, 0, a.y * U); L.add(g); mk(GEO.box, mat('#4a4050', { rough: .9 }), .7, .5, .5, 0, .25, 0, g); mk(GEO.box, mat('#5a5060'), .8, .08, .6, 0, .52, 0, g); const orb = mk(GEO.ico, mat('#c070ff', { em: 2.5, flat: true }), .14, .14, .14, 0, .9, 0, g, false); const rg = mk(GEO.ring, basic('#c070ff', { op: .6, add: 1, unique: 1 }), .7, 1, .7, 0, .04, 0, g, false); R3.torches.push({ x: a.x * U, y: 1.2, z: a.y * U, col: '#a050ff' }); R3.anim.push(() => { orb.visible = rg.visible = !a.used; orb.rotation.y = G.t * 2; orb.position.y = .9 + Math.sin(G.t * 2) * .06; }); }
  if (G.dig) { const d = G.dig, g = new T3.Group(); g.position.set(d.x * U, .03, d.y * U); L.add(g); for (const r of [.78, -.78]) { const b = mk(GEO.box, mat('#c0402a', { em: .6 }), .7, .03, .1, 0, 0, 0, g, false); b.rotation.y = r; } const gl = mk(GEO.circ, basic('#e0c080', { op: .3, add: 1, unique: 1 }), .5, 1, .5, 0, .01, 0, g, false); R3.anim.push(() => { g.visible = !d.used; gl.material.opacity = .2 + .15 * Math.sin(G.t * 4); }); }
};
const _btM = buildTown;
buildTown = function () {
  _btM(); const L = R3.lvl; let n = 0;
  const cols = { library: '#4a6ad0', armory: '#c04a3a', infirmary: '#f0f0f0', market: '#e0b040', inn: '#8a5a2a' };
  for (const k in HAVEN_B) for (let l = 0; l < havenL(k); l++) { const a = Math.PI * .9 + n * (Math.PI * 1.2 / 24), x = 19.5 + Math.cos(a) * 6.8, z = 13.5 + Math.sin(a) * 5; n++; mk(GEO.cylL, mat('#3a2a1a'), .04, 2, .04, x, 1, z, L); const fl = mk(GEO.box, mat(cols[k], { rough: .8 }), .03, .45, .3, x, 1.7, z + .16, L); R3.anim.push(() => { fl.rotation.y = Math.sin(G.t * 2 + x) * .25; }); }
};
const _reM = renderExtras;
renderExtras = function (dt) {
  _reM(dt); if (!S || !P || G.mode !== 'play' || G.inTown || S.opts.weather === false || G.parts.length > 1300) return;
  const R = curReg(), tx = G.cam.x, ty = G.cam.y;
  const wx = { grass: ['rain', .5], reeds: ['rain', 1], sand: ['sand', .9], ember: ['ash', .8], cloud: ['wind', .6], coral: ['bubble', .5] }[R.dec];
  if (!wx || Math.random() > wx[1]) return;
  const x = tx + rnd(-560, 560), y = ty + rnd(-420, 340);
  if (wx[0] === 'rain') G.parts.push({ x, y, z: 6, vx: -30, vy: 0, vz: -22, g: 0, life: .28, max: .28, col: '#9ab8d8', size: 2, streak: 1, amb: 1 });
  if (wx[0] === 'sand') G.parts.push({ x: tx - 600, y, z: rnd(.2, 2), vx: rnd(320, 480), vy: rnd(-20, 20), vz: 0, g: 0, life: 3, max: 3, col: '#d8b880', size: 2, amb: 1 });
  if (wx[0] === 'ash') G.parts.push({ x, y, z: 5, vx: rnd(-10, 10), vy: rnd(-10, 10), vz: -.8, g: 0, life: 4, max: 4, col: '#8a8078', size: 2.5, amb: 1 });
  if (wx[0] === 'wind') G.parts.push({ x: tx - 600, y, z: rnd(1, 3), vx: rnd(500, 700), vy: 0, vz: 0, g: 0, life: 2, max: 2, col: '#e8eeff', size: 1.5, streak: 1, amb: 1 });
  if (wx[0] === 'bubble') G.parts.push({ x, y, z: 0, vx: 0, vy: 0, vz: rnd(.5, 1.2), g: 0, life: 3, max: 3, col: '#bff4ff', size: 3, amb: 1 });
};
const _dmM = drawMini;
drawMini = function () {
  _dmM(); const c = H.mctx, s = 3, R = Math.floor(190 / s / 2), ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
  const mark = (o, col, ch) => { if (!o || o.used) return; const dx = o.x / TILE - ptx, dy = o.y / TILE - pty; if (Math.abs(dx) >= R || Math.abs(dy) >= R) return; c.fillStyle = col; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText(ch, (dx + R) * s, (dy + R) * s + 4); };
  mark(G.dig, '#ffd27a', '✕'); mark(G.font, '#7affff', '●'); mark(G.altar, '#c070ff', '◆');
};
const _doM = drawOverlay;
drawOverlay = function () {
  _doM(); if (!R3 || !P || G.mode === 'title' || !M) return;
  if (G.hideHud) { X.setTransform(DPR, 0, 0, DPR, 0, 0); X.clearRect(0, 0, VW, VH); return; }
  const label = (o, z, t, col) => { if (!o || o.used || dist(o, P) > 380) return; const s = proj(o.x, o.y, z); if (!s.vis) return; X.font = 'bold 12px "Trebuchet MS",sans-serif'; X.textAlign = 'center'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(t, s.x, s.y); X.fillStyle = col; X.fillText(t, s.x, s.y); };
  label(G.font, 1.3, 'Ember Font — restores you', '#7affff'); label(G.altar, 1.3, '◆ Altar of Exchange', '#d090ff'); label(G.dig, .6, '✕ Dig here!', '#ffd27a');
};
const _uhM = updateHUD; updateHUD = function (dt) { _uhM(dt); const h = $('hud'); if (h && G.hideHud && G.mode === 'play') h.style.display = 'none'; };

// ---------- menus: gifts, wheel, altar, stats, Haven ----------
function giftAvail() { return S && (!S.gift || S.gift.day !== dayId()); }
function claimGift() {
  if (!giftAvail()) return; S.gift = S.gift || { day: 0, n: 0 }; const i = S.gift.n % 7, pw = Math.min(maxPw(), 120);
  const [lbl, k] = GIFTS[i];
  if (k === 'gold') S.gold += Math.round(300 * Math.pow(1.12, pw)); if (k === 'gems') for (let j = 0; j < 2; j++) addGem(pick2(Object.keys(GEMS)), gemTier());
  if (k === 'marks') S.marks += 15; if (k === 'ore') S.ore += 6; if (k === 'shards') S.shards += 25; if (k === 'frag') S.frag += 2;
  if (k === 'big') { S.marks += 40; const it = genItem(maxPw() + 1, { r: 4 }); if (S.inv.length < S.invMax) { it.isNew = true; S.inv.push(it); noteFound(it); } else S.stash.push(it); }
  S.gift.n++; S.gift.day = dayId(); S.stats.gifts = (S.stats.gifts || 0) + 1; sfx('legend'); toast(`${ico('gift')} Daily gift: ${lbl}!`, '#ffd27a'); saveGame(); renderMenu();
}
MENUS.gift = () => { const n = (S.gift ? S.gift.n : 0) % 7, av = giftAvail();
  return `<div class="title" style="min-width:640px"><h2>${ico('gift')} Daily Ember Gift</h2><div class="dim">Every day you play, claim a gift. The seventh gift in each cycle is a big one! (Missing days never resets your progress.)</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:12px 0">${GIFTS.map((g, i) => `<div class="card ${i < n ? 'done' : ''}" style="text-align:center;padding:8px;${i === n && av ? 'border-color:#ffd27a;box-shadow:0 0 12px #ffb04a' : ''}"><div class="dim">Day ${i + 1}</div><div style="font-size:13px;margin-top:4px">${(g[1] === 'gold' ? `● ${fmt(Math.round(300 * Math.pow(1.12, Math.min(maxPw(), 120))))} Gold` : g[0])}</div>${i < n ? `<div class="up">${ico('check')}</div>` : ''}</div>`).join('')}</div>
  ${av ? `<div class="btn bigb" onclick="claimGift()">Claim today's gift</div>` : `<div class="dim">Come back tomorrow for the next gift (in ${untilStr(nextDay())}).</div>`}<span class="btn" onclick="backHub()">Back</span></div>`; };
function backHub() { if (G.mode === 'play') openMenu('pause'); else closeMenu(); }
MENUS.altar = () => { const a = G.altar; if (!a) return '';
  return `<h2>◆ Altar of Exchange</h2><p class="lore">"Offer an item to the Ember. It may return something greater... or only ash and coin." <span class="dim">(55% chance: a new item of the same type, one rarity higher. One offering per altar.)</span></p><div class="grid">${S.inv.filter(i => !i.locked && i.r < 6).map(it => cell(it, 'offerAltar')).join('') || '<div class="dim">You have nothing to offer.</div>'}</div><br><span class="btn" onclick="closeMenu()">Leave</span>`; };
function offerAltar(id) {
  const a = G.altar, i = S.inv.findIndex(x => x.id === id); if (!a || a.used || i < 0) return; const it = S.inv.splice(i, 1)[0]; a.used = true; hideTip(); S.stats.altars = (S.stats.altars || 0) + 1;
  if (Math.random() < .55) { const n = genItem(Math.max(it.il, G.pw), { slot: it.slot, t: it.slot === 'weapon' ? it.t : undefined, r: Math.min(5, it.r + 1) }); n.isNew = true; S.inv.push(n); noteFound(n); sfx('legend'); toast(`◆ The Ember answers: <span style="color:${RAR[n.r].c}">${n.name}</span>!`, '#d090ff'); }
  else { const g = itemVal(it) * 3; S.gold += g; S.shards += SALV[it.r] * 2; sfx('gold'); toast(`◆ Only ash... and ${fmt(g)} gold, ${SALV[it.r] * 2} shards.`, '#9a8aaa'); }
  burst(a.x, a.y, '#c070ff', 30, 200, .8, 3, 1); closeMenu();
}
MENUS.stats = () => { const st = S.stats, fr = st.foundR || [];
  const rows = [[ico('timer') + ' Playtime', fmtTime(st.time)], [ico('swords') + ' Foes slain', fmt(st.kills)], [ico('crown') + ' Elites / Champions', `${fmt(st.elites)} / ${fmt(st.champs || 0)}`], [ico('boss') + ' Guardians slain', st.bosses], [ico('sparkle') + ' Golden monsters', st.golden || 0], [ico('explosion') + ' Total damage dealt', fmt(st.dmg || 0)], [ico('target') + ' Highest single hit', fmt(st.maxHit || 0)], [ico('fire') + ' Best combo', st.maxCombo], [ico('dash') + ' Dodges / Perfect', `${fmt(st.dodges || 0)} / ${fmt(st.pd)}`], [ico('spellbook') + ' Skills cast', fmt(st.casts || 0)], [ico('potion') + ' Potions drunk', fmt(st.potions || 0)], [ico('steps') + ' Distance walked', fmt(st.dist || 0) + ' tiles'], [ico('gold') + ' Gold earned in the wilds', fmt(st.goldEarned || 0)], [ico('map') + ' Floors descended', fmt(st.floors)], [ico('bolt') + ' Trials / Cursed Chests', `${st.trials} / ${st.cursed}`], [ico('pickaxe') + ' Treasures dug / Altars', `${st.digs || 0} / ${st.altars || 0}`], [ico('skull') + ' Deaths', st.deaths]];
  return tabs('stats') + `<h2>${ico('chart')} Statistics</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;min-width:640px">${rows.map(r => `<div class="smrow"><div class="nm">${r[0]}</div><b style="color:#ffe2a8">${r[1]}</b></div>`).join('')}</div>
  <h3>Items found by rarity</h3><div class="row">${RAR.map((r, i) => `<div class="card" style="text-align:center;min-width:80px"><b style="color:${r.c}">${fmt(fr[i] || 0)}</b><div class="dim">${r.n}</div></div>`).join('')}</div>`; };
function havenCost(l) { return Math.round(HAVEN_COST[l] * Math.pow(1.07, Math.min(maxPw(), 110))); }
function buildHaven(k) { const l = havenL(k); if (l >= 3) return; const c = havenCost(l); if (S.gold < c) { toast('Not enough gold'); sfx('error'); return; } S.gold -= c; S.haven = S.haven || {}; S.haven[k] = l + 1; calcStats(); sfx('legend'); toast(`${ico('restore')} ${HAVEN_B[k].n} restored to level ${l + 1}!`, '#ffd27a'); saveGame(); if (G.inTown) buildLevel(); renderMenu(); }
MENUS.haven = () => { let h = `<h2>${ico('restore')} Restore Haven</h2><div class="dim">Pour your gold back into the last village. Every restored building gives a permanent bonus — and you'll see Haven come back to life with new banners around the fountain.</div>`;
  for (const k in HAVEN_B) { const B = HAVEN_B[k], l = havenL(k); h += `<div class="smrow" style="padding:6px 0"><div style="font-size:28px;width:40px">${B.ic}</div><div class="nm"><b>${B.n}</b> <span class="dim">Level ${l}/3</span><br>${l ? `<span class="up">${B.d(l)}</span>` : '<span class="dim">Ruined</span>'}${l < 3 ? ` <span class="dim">→ next: ${B.d(l + 1)}</span>` : ''}</div>${l < 3 ? `<span class="btn ${S.gold < havenCost(l) ? 'dis' : ''}" onclick="buildHaven('${k}')">Restore: ${fmt(havenCost(l))}g</span>` : '<span class="up">★ Fully restored</span>'}</div>`; }
  return h + `<br><span class="btn" onclick="backHub()">Back</span>`; };
// hub, tabs, sage & wardrobe/bestiary additions
TAB_GROUPS[1][1].push('stats'); TAB_NAMES.stats = [ico('chart') + ' Stats', ''];
HUB.push(['stats', ico('chart'), 'Statistics', 'Your records', ''], ['haven', ico('restore'), 'Restore Haven', 'Permanent town bonuses', ''], ['gift', ico('gift'), 'Daily Gift', 'A present every day', '']);
{ const _hubM = MENUS.pause; MENUS.pause = () => _hubM().replace('<b>Daily Gift</b>', `<b>Daily Gift</b>${giftAvail() ? '<i>!</i>' : ''}`); }
{ const _sgM = MENUS.sage; MENUS.sage = () => _sgM().replace('<div class="btn" onclick="talkNPC(\'sage\')">', `<div class="btn" onclick="openMenu('haven')">${ico('restore')} Restore Haven</div><div class="btn" onclick="talkNPC('sage')">`); }
{ const _wdM = MENUS.wardrobe; MENUS.wardrobe = () => _wdM().replace(/<div style="font-size:12px" class="up">([^<]*)<\/div>/g, (m, b) => { const k = Object.keys(PETS).find(x => PETS[x].b === b); return k ? `<div style="font-size:12px" class="up">${b} <span class="dim">• Lv ${petLvl(k)}/10</span></div>` : m; }); }
{ const _bcM = beastCard; beastCard = function (t, isBoss) { const h = _bcM(t, isBoss); const g = S.best[t] && S.best[t].g; return g ? h.replace('Slain: <b>', `<span style="color:#ffd54a">${ico('sparkle')} ${g} golden</span> • Slain: <b>`) : h; }; }
// settings
{ const _stM = MENUS.settings; MENUS.settings = () => { const o = S ? S.opts : {}; return _stM().replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card">Interface size ${[[.9, 'Small'], [1, 'Normal'], [1.15, 'Large']].map(([v, n]) => `<span class="btn ${(o.ui || 1) === v ? 'on' : ''}" onclick="setOpt('ui',${v})">${n}</span>`).join('')}</div>
  <div class="card">High-contrast attack warnings <span class="btn ${o.hc ? 'on' : ''}" onclick="setOpt('hc',${!o.hc})">${o.hc ? 'On' : 'Off'}</span> &nbsp; Weather <span class="btn ${o.weather !== false ? 'on' : ''}" onclick="setOpt('weather',${o.weather === false})">${o.weather !== false ? 'On' : 'Off'}</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }; }
function applyUI() { document.documentElement.style.setProperty('--ui', S && S.opts.ui ? S.opts.ui : 1); }
const _soM = setOpt; setOpt = function (k, v) { _soM(k, v); applyUI(); };
const _cgM = continueGame; continueGame = function () { _cgM(); applyUI(); if (S && giftAvail()) setTimeout(() => toast(ico('gift') + ' Your Daily Ember Gift is ready — open the ☰ Menu!', '#ffd27a'), 4000); };
// wiki & achievements
WIKI_TXT.world.push(
  ['Champions', 'Floor 4 of every region hides a named champion — a powerful elite worth great loot. Wanted posters on the Bounty Board send you after specific champions for extra rewards and Ember Marks.'],
  ['Golden monsters', 'About 1 in 350 monsters is Golden: tougher, but showering gold and gear. Your Bestiary counts them.'],
  ['Ember Fonts', 'Glowing fountains on some floors fully restore your life and mana and give a potion.'],
  ['Altars of Exchange', 'Offer an item: 55% chance to receive a new item of the same type one rarity higher; otherwise gold and shards.'],
  ['Treasure Maps', 'Elites sometimes drop maps. On a later floor a dig spot (gold ✕ on the minimap) appears — walk onto it for buried treasure.'],
  ['Companion levels', 'Your active companion grows with every kill, up to level 10 (+10% to its bonus per level).'],
  ['Restore Haven', 'Spend gold at the Sage (or ☰ Menu) to rebuild 5 buildings: Library, Armory, Infirmary, Market and Inn — each with 3 levels of permanent bonuses.'],
  ['Daily Gift', 'Claim a gift every day you play (a big one every 7th claim).'],
  ['Multi-kills', 'Slay foes in quick succession for Triple Kill, Rampage, Massacre and EMBERSTORM callouts.'],
  ['New shrines', 'Shrines of Echoes (skills recharge twice as fast), Blood (heal from damage dealt), Storms (lightning strikes foes) and Plenty (double gold).'],
  ['Photo mode', 'Press U to hide the HUD for screenshots.'],
);
WIKI_TXT.controls.push(['Hide HUD', 'Press U to hide or show the interface.']);
ACH.push(
  { id: 'golden', n: 'Gilded Hunter', d: 'Slay a Golden monster', c: () => S.stats.golden || 0, need: 1, sp: 1 },
  { id: 'champ10', n: 'Champion Slayer', d: 'Slay 10 champions', c: () => S.stats.champs || 0, need: 10, sp: 1 },
  { id: 'wanted3', n: 'Bounty Hunter', d: 'Complete 3 wanted bounties', c: () => S.stats.wanted || 0, need: 3, sp: 1 },
  { id: 'haven5', n: 'Haven Reborn', d: 'Restore all 5 Haven buildings to level 1', c: () => Object.keys(HAVEN_B).filter(k => havenL(k) >= 1).length, need: 5, sp: 1 },
  { id: 'haven15', n: 'Jewel of the Valley', d: 'Fully restore Haven', c: () => Object.keys(HAVEN_B).reduce((a, k) => a + havenL(k), 0), need: 15, sp: 2 },
  { id: 'dig5', n: 'X Marks the Spot', d: 'Dig up 5 buried treasures', c: () => S.stats.digs || 0, need: 5, sp: 1 },
  { id: 'storm', n: 'EMBERSTORM', d: 'Slay 12 foes within about a second', c: () => S.stats.storms || 0, need: 1, sp: 1 },
  { id: 'gifts30', n: 'Faithful', d: 'Claim 30 daily gifts', c: () => S.stats.gifts || 0, need: 30, sp: 2 },
  { id: 'pet10', n: 'Best Friends', d: 'Raise a companion to level 10', c: () => Math.max(0, ...Object.keys(PETS).map(petLvl)), need: 10, sp: 1 },
);
// ---------- credit ----------
const CREDIT = document.createElement('div');
CREDIT.innerHTML = 'Made by GrimL0ck &amp; neonxsl'; CREDIT.style.textAlign = 'right';
CREDIT.style.cssText = 'position:fixed;right:12px;bottom:8px;z-index:11;font:italic 11px Trebuchet MS,Segoe UI,sans-serif;color:rgba(232,220,192,.45);font-variant-numeric:lining-nums;text-shadow:0 1px 2px #000;pointer-events:none;letter-spacing:.5px;transition:opacity .4s';
document.body.appendChild(CREDIT);
setInterval(() => { CREDIT.style.opacity = (G.mode === 'title' || (G.inTown && G.mode === 'play' && !G.hideHud)) ? 1 : 0; }, 250);
