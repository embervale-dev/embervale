// ================= GAMEPLAY =================
const G = {
  mode: 'title', menu: null, t: 0, ens: [], pp: [], eb: [], zones: [], tele: [], allies: [], pick: [], parts: [], rings: [], bolts: [], swings: [], txt: [], later: [],
  chests: [], shrines: [], npcs: [], traps: [], shake: 0, cam: { x: 0, y: 0 }, region: 0, floor: 0, abyss: false, depth: 1, pw: 0, killed: 0, total: 0, boss: null,
  warp: 0, slow: 0, chan: 0, inTown: true, exit: null, stairs: null, stairsOpen: false, banner: null, hurtFlash: 0, flowT: 0, msgT: {}, saveT: 0, achT: 0, lostGold: 0, mod: null, levelId: 0,
};
let P = null;
const ARRS = ['ens', 'pp', 'eb', 'zones', 'tele', 'allies', 'pick', 'parts', 'rings', 'bolts', 'swings', 'txt', 'later', 'chests', 'shrines', 'npcs', 'traps'];
function resetLevel() { G.memory = null; G.revUsed = false; G.vill = []; G.dps = []; for (const k of ARRS) G[k] = []; G.boss = null; G.warp = 0; G.slow = 0; G.chan = 0; G.exit = null; G.stairs = null; G.stairsOpen = false; G.killed = 0; G.total = 0; G.hurtFlash = 0; G.mod = null; G.levelId++; }
function curReg() { return G.inTown ? TOWN : G.abyss ? ABYSS : REG[G.region]; }
function calcPw() { return G.abyss ? 80 + G.depth + S.diff * 28 : G.region * 7 + G.floor + S.diff * 28; }
function maxPw() {
  let best = 0;
  for (let d = 0; d <= S.maxDiff; d++) for (let r = 0; r < NREG; r++) if (S.prog[d][r] > 0 || S.done[d][r] || r === 0) best = Math.max(best, r * 7 + S.prog[d][r] + d * 28);
  for (let d = 0; d < 4; d++) if (S.abyssBest[d]) best = Math.max(best, 80 + S.abyssBest[d] + d * 28);
  return best;
}
function reqLvl(r, d) { return Math.min(MAXLVL, REG[r].req + d * 25); }

function newPlayer() {
  P = { x: 0, y: 0, r: 14, hp: ST.maxHp, mp: ST.maxMp, face: 0, atkCd: 0, dodgeCd: 0, dodgeT: 0, dvx: 0, dvy: 0, inv: 0, cds: {}, buffs: {}, hitN: 0, whirl: 0, whirlT: 0, whirlD: 0, blades: 0, bladeN: 0, bladeD: 0, air: 0, phx: true, nextCrit: false, walk: 0, swingT: 0, swingA: 0, swingK: '', combo: 0, comboT: 0, surge: 0, pdUsed: false, moving: false, atkAnim: 0, sigN: 0 };
}
function placePlayer(tx, ty) { P.x = (tx + .5) * TILE; P.y = (ty + .5) * TILE; G.cam.x = P.x; G.cam.y = P.y; }

// ---------- feedback helpers ----------
function toast(msg, col) {
  const k = msg.slice(0, 24); if (G.msgT[k] && G.t - G.msgT[k] < 1.2) return; G.msgT[k] = G.t;
  const d = document.createElement('div'); d.innerHTML = msg; if (col) d.style.color = col; $('toast').appendChild(d); setTimeout(() => d.remove(), 2800);
  while ($('toast').children.length > 5) $('toast').firstChild.remove();
}
function feed(html, col) {
  const f = $('lootfeed'); if (!f) return; const d = document.createElement('div'); d.innerHTML = html; if (col) d.style.borderLeftColor = col;
  f.appendChild(d); setTimeout(() => d.remove(), 4500); while (f.children.length > 5) f.firstChild.remove();
}
function banner(a, b, col) { G.banner = { a, b, t: 3.2, col: col || '#ffd27a' }; }
function dmgText(x, y, v, col, big, z) { const nm = S.opts.numMode | 0; if (typeof v !== 'string' && col !== '#ff5050' && (nm === 2 || (nm === 1 && !big))) return; if (G.txt.length > 160) G.txt.shift(); G.txt.push({ x: x + rnd(-10, 10), y, z: z || 1.6, s: typeof v === 'string' ? v : fmt(v), col, t: .9, big }); }
function burst(x, y, col, n = 8, spd = 160, life = .5, size = 3, z = .6) {
  for (let i = 0; i < n; i++) {
    if (G.parts.length > 1400) break; const a = rnd(0, 6.283), s = spd * rnd(.3, 1);
    G.parts.push({ x, y, z: z + rnd(-.2, .25), vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(.5, 3.5) * spd / 160, g: 7, life, max: life, col, size: rnd(size * .6, size * 1.4) });
  }
}
function ringFx(x, y, r, col, t = .35) { G.rings.push({ x, y, r, col, t, max: t }); }
function healP(v) { if (v <= 0) return; P.hp = Math.min(ST.maxHp, P.hp + v); }
function shake(v) { if (S.opts.shake) G.shake = Math.max(G.shake, v); }

// ---------- floors ----------
function enterFloor(reg, fl, depth) {
  resetLevel(); G.inTown = false; G.abyss = reg === ABYSS_R; G.region = G.abyss ? 11 : reg; G.floor = fl; if (G.abyss) G.depth = depth;
  G.pw = calcPw(); S.shopStale = true;
  const R = curReg();
  const bossFloor = G.abyss ? depth % 5 === 0 : fl === BOSS_F;
  if (bossFloor) {
    M = genArena(); placePlayer(20, 21);
    const key = G.abyss ? pick(Object.keys(BOSS)) : R.boss;
    G.boss = mkBoss(key, 20.5 * TILE, 11 * TILE);
    banner(BOSS[key].n, G.abyss ? `Abyss Depth ${depth}` : R.n, '#ff6a5a'); sfx('boss');
  } else {
    if ((G.region > 0 || fl >= 2 || G.abyss) && Math.random() < .28) G.mod = pick(MODS).k;
    M = genDungeon(G.abyss ? Math.min(6, 2 + depth % 5) : fl);
    populate(R);
    banner(R.n, (G.abyss ? `Depth ${depth}` : `Floor ${fl + 1} of ${FLOORS}`) + (G.mod ? ` — ${modDef().n}` : ''), G.abyss ? '#ff5a8a' : '#ffd27a');
    if (G.mod) toast(`<b>${modDef().n}</b>: ${modDef().d}`, modDef().col);
  }
  S.last = { r: reg, f: fl, d: depth, diff: S.diff };
  if (!G.abyss) S.prog[S.diff][reg] = Math.max(S.prog[S.diff][reg], fl);
  else S.abyssBest[S.diff] = Math.max(S.abyssBest[S.diff], depth);
  P.phx = true; P.air = 0; P.dodgeT = 0; G.mode = 'play'; computeFlow();
  if (typeof buildLevel === 'function') buildLevel();
  if (!G.abyss && S.diff === 0 && RSTORY[reg]) {
    if (fl === 0) G.later.push({ t: .9, fn: () => playStory('arrive' + reg, RSTORY[reg].arrive) });
    if (bossFloor) G.later.push({ t: 1, fn: () => playStory('pre' + reg, [['boss', RSTORY[reg].pre]]) });
  }
  if (G.abyss && ABYSS_STORY[depth]) G.later.push({ t: 1, fn: () => playStory('abyss' + depth, ABYSS_STORY[depth]) });
  saveGame();
}
function modDef() { return MODS.find(m => m.k === G.mod); }
function populate(R) {
  const m = M, start = m.rooms[0]; placePlayer(start.cx, start.cy);
  const sr = m.stairRoom; G.stairs = { x: (sr.cx + .5) * TILE, y: (sr.cy + .5) * TILE };
  const fl = G.abyss ? 4 : G.floor;
  let eliteC = .06 + fl * .012 + S.diff * .03 + (G.abyss ? .05 : 0); if (G.mod === 'elite') eliteC *= 3;
  const occupied = new Set([`${sr.cx},${sr.cy}`]);
  const freeTile = r => { for (let i = 0; i < 20; i++) { const tx = ri(r.x + 1, r.x + r.w - 2), ty = ri(r.y + 1, r.y + r.h - 2); const k = `${tx},${ty}`; if (!occupied.has(k) && !(r === sr && Math.abs(tx - sr.cx) < 2 && Math.abs(ty - sr.cy) < 2)) { occupied.add(k); return { x: (tx + .5) * TILE, y: (ty + .5) * TILE }; } } return null; };
  for (const r of m.rooms) {
    if (r === start) continue;
    const n = Math.max(2, Math.round(r.w * r.h / 20 * rnd(.75, 1.25) * (1 + fl * .05) * (G.mod === 'swarm' ? 1.4 : 1)));
    const types = [pick(R.en), pick(R.en)];
    for (let i = 0; i < n; i++) { const p = freeTile(r); if (!p) continue; const e = mkEnemy(pick(types), p.x, p.y, { elite: Math.random() < eliteC }); e.counted = true; G.total++; }
    if (Math.random() < .3) { const p = freeTile(r); if (p) G.chests.push({ ...p, open: false, mimic: Math.random() < .1, t: 0 }); }
    const np = ri(0, 3); for (let i = 0; i < np; i++) { const p = freeTile(r); if (p) mkEnemy(Math.random() < .45 ? 'barrel' : 'crate', p.x, p.y, { prop: true }); }
    if ((G.region >= 2 || G.abyss) && Math.random() < .3) { const nt = ri(2, 5); for (let i = 0; i < nt; i++) { const p = freeTile(r); if (p) G.traps.push({ ...p, off: rnd(0, 3) }); } }
  }
  if (Math.random() < .6 && m.rooms.length > 2) {
    const r = m.rooms[ri(1, m.rooms.length - 1)]; const s = pick(SHRINES);
    G.shrines.push({ x: (r.x + 1.5) * TILE, y: (r.y + 1.5) * TILE, s, used: false });
  }
  if (!G.abyss && G.floor === 2 && RMEM[G.region] && !S.story['mem' + G.region] && m.rooms.length > 2) { const r = m.rooms[ri(1, m.rooms.length - 1)]; const p = freeTile(r); if (p) G.memory = { ...p, used: false }; }
  const missing = PAGES.map((_, i) => i).filter(i => !S.pages.includes(i));
  if (missing.length && Math.random() < .3) { const r = m.rooms[ri(1, m.rooms.length - 1)]; const p = freeTile(r); if (p) G.pick.push({ k: 'page', v: pick(missing), x: p.x, y: p.y, vx: 0, vy: 0, t: 1, z: 0, vz: 0 }); }
  const imps = G.mod === 'gild' ? 2 : Math.random() < .14 ? 1 : 0;
  for (let i = 0; i < imps; i++) { const r = m.rooms[ri(1, m.rooms.length - 1)]; const p = freeTile(r); if (p) mkEnemy('gimp', p.x, p.y, {}); }
}
function mkEnemy(type, x, y, o = {}) {
  const d = EN[type], pw = G.pw;
  const e = {
    type, d, x, y, r: d.r, hp: d.hp * Math.pow(1.15, pw) * (o.minion ? .5 : 1) * (G.mod === 'swarm' ? .8 : 1), dmg: d.dmg * Math.pow(1.105, pw) * (pw < 4 ? .7 + .075 * pw : 1) * (G.mod === 'blood' ? 1.3 : 1), spd: d.spd * rnd(.9, 1.1),
    xp: d.xp * Math.pow(1.13, pw) * (o.minion ? .4 : 1), gold: Math.pow(1.12, pw) * (o.minion ? .3 : 1), t: rnd(0, 10), st: 'idle', st_t: rnd(.5, 1.5), awake: !!o.awake,
    elite: null, burn: 0, burnD: 0, psn: 0, psnD: 0, frz: 0, shk: 0, stun: 0, flash: 0, kx: 0, ky: 0, ang: rnd(0, 6.28), fireT: rnd(.6, d.fire || 2), side: Math.random() < .5 ? 1 : -1,
    bcd: 0, ocd: 0, dacc: 0, dtt: 0, boss: false, dead: false, minion: !!o.minion, mimic: !!o.mimic, prop: d.ai === 'prop', life: 24, face: rnd(0, 6.28), mv: 0, hx: x, hy: y, wT: rnd(.5, 4), wA: null, wD: 0,
  };
  if (o.elite && !e.prop && type !== 'gimp') {
    e.elite = pick(Object.keys(ELITES)); e.hp *= 3.5; e.r *= 1.25; e.xp *= 4; e.gold *= 4; e.dmg *= 1.3;
    if (e.elite === 'Swift') e.spd *= 1.45; if (e.elite === 'Giant') { e.r *= 1.3; e.hp *= 1.5; }
  }
  if (e.prop) e.hp = 1;
  e.maxHp = e.hp; G.ens.push(e); return e;
}
function mkBoss(key, x, y) {
  const b = BOSS[key], pw = G.pw;
  const e = {
    type: key, d: { n: b.n, col: b.col, sh: b.sh, pc: b.pc, ai: 'boss' }, bd: b, x, y, r: b.r, hp: b.hp * Math.pow(1.15, pw), dmg: b.dmg * Math.pow(1.105, pw), spd: b.spd,
    xp: 120 * Math.pow(1.13, pw), gold: 25 * Math.pow(1.12, pw), t: 0, st: 'idle', st_t: 0, awake: true, elite: null, burn: 0, burnD: 0, psn: 0, psnD: 0, frz: 0, shk: 0, stun: 0, flash: 0,
    kx: 0, ky: 0, ang: 0, boss: true, dead: false, pat: null, patT: 2, pi: 0, pt: 0, pc: 0, enr: false, des: false, bcd: 0, ocd: 0, dacc: 0, dtt: 0, spA: 0, side: 1, face: Math.PI / 2, mv: 0,
  };
  e.maxHp = e.hp; G.ens.push(e); seeE(e); return e;
}
function nextFloor() {
  sfx('stairs'); quest('floor'); S.stats.floors++;
  if (G.abyss) enterFloor(ABYSS_R, 0, G.depth + 1);
  else if (G.floor < BOSS_F) enterFloor(G.region, G.floor + 1);
  else goTown();
}
function goTown() {
  resetLevel(); G.inTown = true; G.abyss = false; M = genTown();
  G.npcs = [
    { n: 'Merchant Orla', x: 9, y: 9, col: '#d8a040', menu: 'shop', ic: '💰', kind: 'shop' },
    { n: 'Blacksmith Brann', x: 29, y: 9, col: '#c05030', menu: 'smith', ic: '⚒️', kind: 'smith' },
    { n: 'Bounty Board', x: 9, y: 20, col: '#a07850', menu: 'quests', ic: '📜', kind: 'board' },
    { n: 'Sage Elowen', x: 29, y: 20, col: '#7080e0', menu: 'sage', ic: '📘', kind: 'sage' },
    { n: 'Waystone', x: 19, y: 6, col: '#ff9a3a', menu: 'portal', ic: '🌀', kind: 'portal' },
    { n: 'Stash', x: 14, y: 21, col: '#b08040', menu: 'stash', ic: '🧰', kind: 'stash' },
    { n: 'Jeweler Sefa', x: 24, y: 21, col: '#40b0b0', menu: 'jewel', ic: '💎', kind: 'jewel' },
    { n: 'Quartermaster Ilse', x: 14, y: 9, col: '#b050b0', menu: 'curio', ic: '🔶', kind: 'curio' },
  ].map(n => ({ ...n, x: (n.x + .5) * TILE, y: (n.y + .5) * TILE, near: false }));
  placePlayer(19, 18);
  G.vill = VILLAGERS.map((v, i) => ({ ...v, x: (12 + i * 5) * TILE, y: (15 + (i % 2) * 2) * TILE, r: 12, tx: 0, ty: 0, wt: rnd(0, 3), face: 0, mv: 0, sayT: rnd(2, 8), say: '', sayLeft: 0 }));
  calcStats(); P.hp = ST.maxHp; P.mp = ST.maxMp; S.pots = S.potMax; P.cds = {}; P.buffs = {}; P.whirl = 0; P.blades = 0; P.air = 0; P.dodgeT = 0; P.combo = 0;
  if (S.shopStale || !S.shop.length) { S.shop = genShop(); S.shopStale = false; }
  while (S.quests.length < 3) S.quests.push(genQuest());
  G.mode = 'play'; banner('Haven', 'The last ember still burns here');
  if (typeof buildLevel === 'function') buildLevel();
  saveGame();
}
function genShop() { const pw = maxPw(); const a = []; for (let i = 0; i < 10; i++) a.push(genItem(pw + ri(-1, 1), { maxR: 3, bonus: .5 })); return a; }

// ---------- quests ----------
function genQuest() {
  const pw = maxPw(); const t = pick(['kill', 'kill', 'kill', 'elite', 'floor', 'gold', 'boss', 'combo', 'barrel']);
  const pool = []; for (let r = 0; r < NREG; r++) if (r === 0 || S.done[S.diff][r - 1]) REG[r].en.forEach(e => { if (!pool.includes(e)) pool.push(e); });
  const q = { t, have: 0, rw: { gold: Math.round(70 * Math.pow(1.12, pw) * rnd(.8, 1.3)), ore: ri(1, 3), shards: ri(2, 6), item: Math.random() < .55 } };
  if (t === 'kill') { q.target = pick(pool); q.need = ri(12, 30); q.txt = `Slay ${q.need} ${EN[q.target].n}s`; }
  else if (t === 'elite') { q.need = ri(3, 8); q.txt = `Slay ${q.need} elite monsters`; q.rw.ore += 2; }
  else if (t === 'floor') { q.need = ri(3, 6); q.txt = `Descend ${q.need} floors`; }
  else if (t === 'gold') { q.need = Math.round(150 * Math.pow(1.12, pw)); q.txt = `Collect ${fmt(q.need)} gold`; }
  else if (t === 'combo') { q.need = ri(4, 8) * 10; q.txt = `Reach a ${q.need}-hit combo`; q.rw.shards += 4; }
  else if (t === 'barrel') { q.need = ri(10, 20); q.txt = `Smash ${q.need} barrels or crates`; }
  else { q.need = 1; q.txt = 'Defeat any guardian'; q.rw.gold *= 2; q.rw.ore += 4; q.rw.item = true; }
  return q;
}
function quest(ev, arg, n = 1) {
  for (const q of S.quests) {
    if (q.have >= q.need) continue;
    if (q.t === ev && (ev !== 'kill' || q.target === arg)) {
      q.have = ev === 'combo' ? Math.max(q.have, Math.min(q.need, n)) : Math.min(q.need, q.have + n);
      if (q.have >= q.need) { toast(`📜 Bounty complete: ${q.txt}`, '#ffd27a'); sfx('shrine'); }
    }
  }
}
function hint(k) {
  if (!S.opts.hints || S.hints[k] || !HINTS[k]) return; S.hints[k] = 1;
  const h = $('hintbox'); if (!h) return; h.innerHTML = '💡 ' + HINTS[k]; h.classList.remove('show'); void h.offsetWidth; h.classList.add('show');
}
function checkHints() {
  if (G.inTown || !P) return;
  if (G.stairs && !G.stairsOpen && dist(P, G.stairs) < 320) hint('stairs');
  if (G.chests.some(c => !c.open && dist(P, c) < 240)) hint('chest');
  if (G.shrines.some(s => !s.used && dist(P, s) < 260)) hint('shrine');
  if (G.traps.some(t => dist(P, t) < 200)) hint('trap');
  if (P.hp < ST.maxHp * .35 && S.pots > 0) hint('lowhp');
  if (S.sp > 0 && S.lvl >= 2) hint('sp');
  if (P.surge >= 100) hint('surge');
  for (const e of G.ens) { if (!e.awake || dist(e, P) > 500) continue; if (e.type === 'gimp') hint('imp'); else if (e.elite) hint('elite'); }
}
function offerBoon(next) {
  if (!S.boonPend) { if (next) next(); return; }
  const pool = BOONS.slice().sort(() => Math.random() - .5); G.boonOpts = pool.slice(0, 2).map(b => b.k); G.boonNext = next; openMenu('boon');
}
function takeBoon(k) { S.boons.push(k); S.boonPend = Math.max(0, S.boonPend - 1); calcStats(); P.hp = Math.min(P.hp, ST.maxHp); sfx('legend'); const B = BOONS.find(b => b.k === k); toast(`${B.ic} <b>${B.n}</b> — ${B.d} (permanent)`, '#ffe9a0'); saveGame(); const n = G.boonNext; G.boonNext = null; closeMenu(); if (S.boonPend > 0) offerBoon(n); else if (n) n(); }
function playStory(key, lines, onEnd) {
  if (S.story[key] || !lines || G.mode !== 'play') { if (onEnd) onEnd(); return; }
  S.story[key] = 1; saveGame(); startDialog(lines, onEnd);
}
function checkAch() {
  for (const a of ACH) {
    if (S.ach[a.id]) continue;
    if (a.c() >= a.need) {
      S.ach[a.id] = 1; const g = Math.round(100 * Math.pow(1.12, maxPw())); S.gold += g; S.shards += 10; S.sp += a.sp;
      toast(`🏆 Achievement: <b>${a.n}</b> — +${fmt(g)}g, +10 shards${a.sp ? `, +${a.sp} skill point${a.sp > 1 ? 's' : ''}` : ''}`, '#ffd54a'); sfx('legend');
    }
  }
}

// ---------- player ----------
function updPlayer(dt) {
  const p = P;
  let mx = 0, my = 0;
  if (keys.w || keys.arrowup) my--; if (keys.s || keys.arrowdown) my++; if (keys.a || keys.arrowleft) mx--; if (keys.d || keys.arrowright) mx++;
  const ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; }
  p.moving = !!ml;
  const W = mouseWorld(); p.face = Math.atan2(W.y - p.y, W.x - p.x);
  const cdm = G.mod === 'arcane' ? 1.4 : 1;
  for (const k in p.cds) if (p.cds[k] > 0) p.cds[k] -= dt * cdm;
  for (const k in p.buffs) if (p.buffs[k] > 0) p.buffs[k] -= dt;
  p.atkCd -= dt; p.dodgeCd -= dt; p.inv -= dt; p.swingT -= dt; p.atkAnim -= dt;
  if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
  p.hp = Math.min(ST.maxHp, p.hp + (ST.hpReg + (buff('regen') ? ST.maxHp * .03 : 0)) * dt);
  p.mp = Math.min(ST.maxMp, p.mp + 5 * (1 + ST.mpReg / 100) * dt);
  if (p.air > 0) {
    p.air -= dt; const k = clamp(1 - p.air / .45, 0, 1);
    p.x = p.lx0 + (p.lx1 - p.lx0) * k; p.y = p.ly0 + (p.ly1 - p.ly0) * k;
    if (p.air <= 0) { p.x = p.lx1; p.y = p.ly1; aoe(p.x, p.y, 135, p.leapD, { skill: 1, kb: 300, stun: .6 }); ringFx(p.x, p.y, 135, '#ffb04a'); burst(p.x, p.y, '#c8a070', 24, 300, .6, 4, .1); shake(12); sfx('boom'); }
    return;
  }
  if (p.dodgeT > 0) { p.dodgeT -= dt; moveEnt(p, p.dvx * dt, p.dvy * dt); if (Math.random() < .7) G.parts.push({ x: p.x, y: p.y, z: .6, vx: 0, vy: 0, vz: 0, g: 0, life: .3, max: .3, col: CLS[S.cls].col, size: 12 }); }
  else {
    const spd = 215 * (1 + (ST.moveSpd + (buff('haste') ? 35 : 0) + (buff('windrun') ? 30 : 0)) / 100) * (p.whirl > 0 ? .85 : 1);
    moveEnt(p, mx * spd * dt, my * spd * dt); if (ml) p.walk += dt * 11;
  }
  if ((pressed[' '] || pressed.rmb || pressed.shift) && p.dodgeCd <= 0 && p.dodgeT <= 0) {
    let dx = mx, dy = my; if (!ml) { dx = Math.cos(p.face); dy = Math.sin(p.face); }
    p.dvx = dx * 640; p.dvy = dy * 640; p.dodgeT = .24; p.dodgeCd = .75; p.pdUsed = false; sfx('dodge'); G.chan = 0;
  }
  if (pressed.tab || pressed.x) swapWeapons();
  if (G.inTown) return;
  if (mouse.down && p.atkCd <= 0 && p.whirl <= 0 && p.dodgeT <= 0 && !G.menu) doAttack();
  ['q', 'e', 'r', 'f'].forEach((k, i) => { if (pressed[k]) castSkill(S.bind[i]); });
  if (pressed['1']) drinkPotion();
  if (pressed.v || pressed.mmb) unleashSurge();
  if (pressed.t && G.chan <= 0) { G.chan = 1.5; toast('Channeling town portal... (moving cancels)'); }
  if (G.chan > 0) { if (ml) { G.chan = 0; } else { G.chan -= dt; if (G.chan <= 0) { sfx('stairs'); goTown(); return; } } }
  if (p.whirl > 0) {
    p.whirl -= dt; p.whirlT -= dt;
    if (p.whirlT <= 0) { p.whirlT = .16; aoe(p.x, p.y, 118, p.whirlD, { skill: 1, kb: 60 }); clearBullets(p.x, p.y, 118); sfx('swing'); }
  }
  if (p.blades > 0) {
    p.blades -= dt;
    for (let k = 0; k < p.bladeN; k++) { const a = G.t * 5 + k * 6.283 / p.bladeN; orbHit(p.x + Math.cos(a) * 88, p.y + Math.sin(a) * 88, 18, p.bladeD, 'bcd', '#c8e0ff'); }
  }
  if (ST.u.orbit) for (let k = 0; k < 2; k++) { const a = -G.t * 3 + k * Math.PI; orbHit(p.x + Math.cos(a) * 66, p.y + Math.sin(a) * 66, 14, pdmg() * .5, 'ocd', '#ff8a3a', true); }
}
function addSurge(v) { if (P.surge < 100) { P.surge = Math.min(100, P.surge + v * (1 + ST.surge / 100)); if (P.surge >= 100) { toast('🔥 Ember Surge ready — press V!', '#ffb04a'); sfx('shrine'); } } }
function unleashSurge() {
  if (P.surge < 100) { if (P.surge > 0) toast(`Ember Surge charging (${Math.floor(P.surge)}%)`); return; }
  P.surge = 0; S.stats.surges++;
  aoe(P.x, P.y, 330, pdmg() * 8, { kb: 520, stun: 1 }); clearBullets(P.x, P.y, 400);
  healP(ST.maxHp * .3); P.buffs.surge = 8; P.inv = .8;
  for (let i = 0; i < 4; i++) G.later.push({ t: i * .08, fn: () => ringFx(P.x, P.y, 330 - i * 60, i % 2 ? '#ffd27a' : '#ff6a1a', .6) });
  burst(P.x, P.y, '#ff9a2a', 80, 520, 1, 5, .3); burst(P.x, P.y, '#ffe080', 40, 300, 1.2, 4, 1);
  shake(22); sfx('boom'); sfx('legend'); banner('EMBER SURGE', '+50% damage • +30% attack speed', '#ff9a2a');
}
function orbHit(x, y, r, dmg, cdk, col, burn) {
  for (const e of G.ens) {
    if (e.dead || e[cdk] > 0) continue;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 < (r + e.r) ** 2) { e[cdk] = .35; hitE(e, dmg, { skill: 1, kb: 80, ang: ang(P, e), burn }); burst(x, y, col, 3, 100, .2, 2); }
  }
  for (const b of G.eb) if (!b.dead && (b.x - x) ** 2 + (b.y - y) ** 2 < (r + b.r) ** 2) { b.dead = true; burst(b.x, b.y, b.col, 3, 80, .2, 2); }
}
function swapWeapons() {
  if (!S.eq.weapon2 && !S.eq.weapon) return;
  [S.eq.weapon, S.eq.weapon2] = [S.eq.weapon2, S.eq.weapon]; calcStats(); P.hp = Math.min(P.hp, ST.maxHp);
  toast(`Wielding: ${S.eq.weapon ? S.eq.weapon.name : 'Bare fists'}`); sfx('click');
}
function drinkPotion() {
  if (S.pots <= 0) { toast('No potions left! Refill in Haven.', '#ff8a8a'); return; }
  if (P.hp >= ST.maxHp) return;
  S.pots--; healP(ST.maxHp * (.4 + .05 * S.potLvl)); sfx('potion'); burst(P.x, P.y, '#ff5a6a', 18, 120, .7, 3, 1);
}
function perfectDodge() {
  if (P.pdUsed) return; P.pdUsed = true; S.stats.pd++;
  G.slow = .8; P.nextCrit = true; addSurge(8); P.dodgeT = Math.max(P.dodgeT, .12);
  dmgText(P.x, P.y - 30, 'PERFECT!', '#7affff', true, 2.2); ringFx(P.x, P.y, 70, '#7affff', .4); sfx('zap');
}

// ---------- attacks ----------
function doAttack() {
  const w = WT[ST.wt]; P.atkCd = w.cd / atkRate(); G.chan = 0; P.atkAnim = Math.min(.3, P.atkCd);
  const base = pdmg(), giant = ST.u.giant ? 1.4 : 1;
  attackOnce(w, P.face, base, giant);
  if (ST.art === 'starfall' && ++P.sigN % 3 === 0) { const W = mouseWorld(); G.zones.push({ kind: 'meteor', x: W.x, y: W.y, r: 110, t: 0, delay: .6, dmg: base * 2.5, small: 1 }); }
  if (ST.u.echo && Math.random() < .25) G.later.push({ t: .13, fn: () => attackOnce(w, P.face, base, giant) });
  P.nextCrit = false;
}
function attackOnce(w, a, base, giant) {
  const cs = Math.cos(a), sn = Math.sin(a);
  P.swingK = w.k; P.swingA = a;
  switch (w.k) {
    case 'arc': {
      const rng = w.rng * giant;
      for (const e of G.ens) { if (e.dead) continue; const d = dist(P, e); if (d < rng + e.r && Math.abs(angDiff(a, ang(P, e))) < w.arc / 2 + e.r / Math.max(d, 1)) hitE(e, base, { kb: w.kb, ang: ang(P, e) }); }
      for (const b of G.eb) if (!b.dead && dist(P, b) < rng * .85 && Math.abs(angDiff(a, ang(P, b))) < w.arc / 2) { b.dead = true; burst(b.x, b.y, '#fff', 3, 90, .2, 2); }
      G.swings.push({ x: P.x, y: P.y, a, arc: w.arc, r: rng, t: .16, max: .16, col: w.col }); P.swingT = .16; sfx('swing'); break;
    }
    case 'slam': {
      const cx = P.x + cs * w.rng * .55 * giant, cy = P.y + sn * w.rng * .55 * giant, r = w.rng * .8 * giant;
      aoe(cx, cy, r, base, { kb: w.kb }); clearBullets(cx, cy, r);
      ringFx(cx, cy, r, '#e0d0b0', .3); burst(cx, cy, '#b8a080', 14, 200, .5, 3, .1); shake(5); P.swingT = .22; sfx('boom'); break;
    }
    case 'thrust': {
      const len = w.rng * giant, wd = w.w * giant;
      for (const e of G.ens) if (!e.dead && segDist(e.x, e.y, P.x, P.y, P.x + cs * len, P.y + sn * len) < wd / 2 + e.r) hitE(e, base, { kb: w.kb, ang: a });
      G.swings.push({ x: P.x, y: P.y, a, thrust: len, w: wd, t: .14, max: .14, col: w.col }); P.swingT = .14; sfx('swing'); break;
    }
    case 'spin': {
      const r = w.rng * giant; aoe(P.x, P.y, r, base, { kb: w.kb }); clearBullets(P.x, P.y, r * .85);
      G.swings.push({ x: P.x, y: P.y, a, arc: 6.283, r, t: .22, max: .22, col: w.col }); P.swingT = .22; sfx('swing'); break;
    }
    case 'shot': pshot(a, { dmg: base, spd: w.spd, pr: w.pr, home: w.home, kind: w.pk, r: w.pk === 'bolt' ? 6 : w.pk === 'ball' ? 9 : 5, col: w.col, splash: w.splash }); sfx(w.pk === 'ball' ? 'boom' : 'shoot'); if (w.pk === 'ball') shake(3); break;
    case 'orb': pshot(a, { dmg: base, spd: w.spd, splash: w.splash * giant, kind: 'orb', home: 2.2, r: 9 * giant, col: w.col, life: 1.4 }); sfx('magic'); break;
    case 'fan': for (let k = 0; k < w.cnt; k++) pshot(a + (k - (w.cnt - 1) / 2) * .13, { dmg: base, spd: w.spd, kind: w.pr ? 'knife' : 'page', life: w.pr ? .7 : .55, col: w.col, r: 6 * giant, pr: w.pr || 0 }); sfx('magic'); break;
    case 'boom': pshot(a, { kind: 'boom', dmg: base, spd: w.spd, pr: 999, life: 3, r: 13 * giant, col: w.col }); sfx('shoot'); break;
  }
  if (ST.art === 'quake') for (let k = 0; k < 8; k++) pshot(a + k * .785, { kind: 'wave', dmg: base * .5, spd: 560, pr: 999, life: .5, r: 16, col: '#ffd27a' });
  if (ST.u.multi) {
    if (['shot', 'orb', 'fan', 'boom'].includes(w.k)) {
      for (const s of [-.22, .22]) {
        if (w.k === 'orb') pshot(a + s, { dmg: base * .7, spd: w.spd, splash: w.splash * giant, kind: 'orb', home: 2.2, r: 8, col: w.col, life: 1.4 });
        else if (w.k === 'boom') pshot(a + s, { kind: 'boom', dmg: base * .7, spd: w.spd, pr: 999, life: 3, r: 11, col: w.col });
        else pshot(a + s, { dmg: base * .7, spd: w.spd || 650, pr: w.pr || 0, kind: w.pk || 'page', r: 5, col: w.col, life: w.k === 'fan' ? .55 : 1.6, splash: w.splash });
      }
    } else pshot(a, { kind: 'wave', dmg: base * .6, spd: 620, pr: 999, life: .45, r: 18, col: w.col });
  }
}
function pshot(a, o) {
  const pierce = ST.u.pierce && o.kind !== 'boom' && !o.splash, sp = o.spd * (ST.u.pierce ? 1.3 : 1);
  G.pp.push({ x: P.x + Math.cos(a) * 16, y: P.y + Math.sin(a) * 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.r || 5, dmg: o.dmg, pr: (o.pr || 0) + (pierce ? 3 : 0), hit: new Set(), life: o.life || 1.6, kind: o.kind, home: o.home || 0, splash: o.splash || 0, skill: o.skill, col: o.col || '#fff', burn: o.burn, out: 0, ret: false, spin: 0 });
}
function hitE(e, base, o = {}) {
  if (e.dead) return;
  const crit = !e.prop && (Math.random() * 100 < ST.critC || P.nextCrit);
  let amt = base * (crit ? 1 + ST.critD / 100 : 1) * rnd(.92, 1.08);
  hurtEnemy(e, amt, { ...o, crit, ang: o.ang !== undefined ? o.ang : ang(P, e) });
  if (e.dead) return;
  if (o.stun && !e.boss) e.stun = o.stun;
  if (o.frz) e.frz = Math.max(e.frz, o.frz);
  if (o.burn) { e.burn = 3; e.burnD = Math.max(e.burnD, base * .25); }
  if (o.slow) e.frz = Math.max(e.frz, o.slow);
}
function aoe(x, y, r, dmg, o = {}) {
  for (const e of G.ens) { if (e.dead) continue; if ((e.x - x) ** 2 + (e.y - y) ** 2 < (r + e.r) ** 2) hitE(e, dmg, { ...o, ang: Math.atan2(e.y - y, e.x - x) }); }
}
function clearBullets(x, y, r) { for (const b of G.eb) if (!b.dead && (b.x - x) ** 2 + (b.y - y) ** 2 < r * r) { b.dead = true; burst(b.x, b.y, '#fff', 2, 80, .2, 2); } }
function hurtEnemy(e, amt, o = {}) {
  if (e.dead) return;
  if (e.prop) { e.hp = 0; killEnemy(e); return; }
  if (e.shk > 0) amt *= 1.2;
  if (e.elite === 'Shielded') amt *= .6;
  if (e.boss || e.elite) amt *= 1 + ST.elite / 100;
  if (o.skill) amt *= 1 + ST.skill / 100;
  if (ST.art === 'inferno' && e.burn > 0) amt *= 1.25;
  amt *= 1 + hunterBonus(e.type);
  e.hp -= amt; G.dps.push(G.t, amt); if (G.dps.length > 600) G.dps.splice(0, 200); e.flash = .1; if (!e.awake) wake(e);
  dmgText(e.x, e.y - e.r, amt, o.crit ? '#ffd54a' : (o.col || (o.skill ? '#9ae0ff' : '#ffffff')), o.crit, (e.r / TILE) * 3.2 + 1);
  if (ST.ls > 0) healP(Math.min(amt * ST.ls / 100, ST.maxHp * .025));
  if (o.kb && !e.boss && e.d.ai !== 'turret') { const k = o.kb * (e.elite ? .4 : 1); e.kx += Math.cos(o.ang) * k; e.ky += Math.sin(o.ang) * k; }
  burst(e.x, e.y, e.d.col, o.crit ? 6 : 3, 140, .35, 2.5, (e.r / TILE) * 1.2);
  sfx(o.crit ? 'crit' : 'hit');
  if (!o.noProc || o.combo) {
    P.combo++; P.comboT = 3; if (P.combo > S.stats.maxCombo) S.stats.maxCombo = P.combo;
    if (P.combo % 10 === 0) quest('combo', 0, P.combo);
    addSurge(.35);
  }
  if (!o.noProc) {
    if (Math.random() * 100 < ST.burn) { e.burn = 3; e.burnD = Math.max(e.burnD, amt * .3); }
    if (Math.random() * 100 < ST.psn) { e.psn = 4; e.psnD = Math.min(e.psnD + amt * .15, amt * 1.2); }
    if (Math.random() * 100 < ST.frz) e.frz = Math.max(e.frz, 1.6);
    if (ST.u.frost && Math.random() < .25) { e.frz = Math.max(e.frz, 2); if (!e.boss) e.stun = Math.max(e.stun, .7); }
    if (Math.random() * 100 < ST.shk) { e.shk = 3; const n = nearestEnemy(e.x, e.y, 200, e); if (n) { G.bolts.push({ x1: e.x, y1: e.y, x2: n.x, y2: n.y, t: .15 }); hurtEnemy(n, amt * .3, { noProc: true, col: '#ffff80' }); } }
    if (ST.u.chain && Math.random() < .3) chainLightning(e, amt * .5, 3, true);
    if (ST.u.thunder && ++P.hitN % 6 === 0) strike(e.x, e.y, amt * 2.2);
    if (ST.art) artifactHit(e, amt, o);
  }
  if (ST.u.reaper && !e.boss && e.hp > 0 && e.hp < e.maxHp * .15) { e.hp = 0; dmgText(e.x, e.y - e.r - 14, 'REAPED', '#c080ff', true); }
  if (e.hp <= 0) killEnemy(e);
}
function artifactHit(e, amt, o) {
  switch (ST.art) {
    case 'sunburst': if (++P.sigN % 5 === 0) { const x = e.x, y = e.y; G.later.push({ t: .05, fn: () => { aoe(x, y, 140, pdmg() * 3, { noProc: true, combo: 1, kb: 200 }); ringFx(x, y, 140, '#ffe680', .5); burst(x, y, '#ffe680', 30, 300, .6, 4, .5); sfx('boom'); } }); } break;
    case 'cleave': if (o.crit) { const x = e.x, y = e.y; G.later.push({ t: .02, fn: () => { aoe(x, y, 100, amt * .8, { noProc: true, kb: 120 }); ringFx(x, y, 100, '#c8e8ff', .25); } }); } break;
    case 'storm': chainLightning(e, amt * .4, 4, true); break;
    case 'inferno': e.burn = 3; e.burnD = Math.max(e.burnD, amt * .5); break;
  }
}
function strike(x, y, dmg) { G.bolts.push({ x1: x + rnd(-30, 30), y1: y, z1: 9, x2: x, y2: y, z2: 0, t: .3, w: 2 }); aoe(x, y, 90, dmg, { noProc: true }); ringFx(x, y, 90, '#ffff80'); burst(x, y, '#ffff80', 12, 220, .4, 3, .1); sfx('zap'); }
function nearestEnemy(x, y, maxD, not, set) {
  let best = null, bd = maxD;
  for (const e of G.ens) { if (e.dead || e.prop || e === not || (set && set.has(e))) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
  return best;
}
function chainLightning(start, dmg, n, fromHit, o = {}) {
  const hs = new Set([start]); let cur = start;
  if (!fromHit) { G.bolts.push({ x1: P.x, y1: P.y, x2: start.x, y2: start.y, t: .25 }); hurtEnemy(start, dmg * (Math.random() * 100 < ST.critC ? 1 + ST.critD / 100 : 1), { noProc: true, combo: 1, skill: o.skill, col: '#ffff80' }); }
  for (let i = 0; i < n; i++) {
    const nx = nearestEnemy(cur.x, cur.y, 230, null, hs); if (!nx) break;
    hs.add(nx); G.bolts.push({ x1: cur.x, y1: cur.y, x2: nx.x, y2: nx.y, t: .25 }); hurtEnemy(nx, dmg, { noProc: true, combo: 1, skill: o.skill, col: '#ffff80' }); cur = nx;
  }
  sfx('zap');
}
function seeE(e) { if (e.prop || e.type === 'dummy' || e.type === 'tsentry') return; const b = S.best[e.type]; if (!b) { S.best[e.type] = { s: 1, k: 0 }; feed(`📖 New Bestiary entry: <b>${e.d.n}</b>`, '#c0a0ff'); } }
function wake(e) { if (e.prop) return; seeE(e); e.awake = true; for (const o of G.ens) if (!o.awake && !o.prop && dist(o, e) < 260) o.awake = true; }
function coin(x, y, v) { G.pick.push({ k: 'gold', v: Math.max(1, v), x, y, vx: rnd(-170, 170), vy: rnd(-170, 170), t: 0, z: .3, vz: rnd(2, 4) }); }
function drop(k, v, x, y) { G.pick.push({ k, v, x, y, vx: rnd(-100, 100), vy: rnd(-100, 100), t: 0, z: .3, vz: rnd(2, 4) }); }
function killEnemy(e) {
  if (e.dead) return; e.dead = true;
  const gm = 1 + goldEff() / 100;
  if (e.prop) {
    S.stats.barrels++; quest('barrel');
    if (e.type === 'barrel') {
      G.later.push({ t: .05, fn: () => { aoe(e.x, e.y, 115, pdmg() * 2.5, { noProc: true, kb: 300, burn: true }); if (dist(P, e) < 90) { G.lastHitBy = 'an exploding barrel'; hurtPlayer(ST.maxHp * .08, null); } ringFx(e.x, e.y, 115, '#ff8a3a'); burst(e.x, e.y, '#ff8a3a', 30, 300, .6, 4, .3); burst(e.x, e.y, '#444', 12, 150, .9, 5, .3); shake(8); sfx('boom'); } });
    } else {
      burst(e.x, e.y, '#8a6a3a', 16, 200, .6, 4, .4); sfx('hit');
      const n = ri(1, 4); for (let i = 0; i < n; i++) coin(e.x, e.y, e.gold * rnd(1, 2) * gm);
      if (Math.random() < .08) dropItem(genItem(G.pw, {}), e.x, e.y);
      if (Math.random() < .15) drop('hp', 0, e.x, e.y);
    }
    return;
  }
  if (e.counted) G.killed++;
  if (e.type !== 'dummy' && e.type !== 'tsentry') { const b = S.best[e.type] || (S.best[e.type] = { s: 1, k: 0 }); b.k++; if ([25, 100, 500].includes(b.k)) feed(`🎯 Hunter's Knowledge: <b>${e.d.n}</b> ×${b.k} — +${hunterBonus(e.type) * 100}% damage vs them`, '#ffd27a'); }
  S.stats.kills++; gainXP(e.xp * (G.mod === 'blood' ? 1.5 : 1));
  addSurge(e.boss ? 30 : e.elite ? 8 : 1.5);
  const coins = e.boss ? 14 : e.type === 'gimp' ? 25 : ri(1, e.elite ? 5 : 2);
  for (let i = 0; i < coins; i++) if (Math.random() < (e.boss || e.elite || e.type === 'gimp' ? 1 : .75)) coin(e.x, e.y, e.gold * rnd(1, 2.4) * gm * (e.type === 'gimp' ? 4 : 1));
  if (!e.boss) {
    const ic = e.mimic ? 1 : e.elite ? .2 : e.minion ? .003 : .018 * (1 + Math.min(300, luckEff()) / 400);
    if (Math.random() < ic) dropItem(genItem(G.pw + ri(-1, 1), { minR: e.elite ? 1 : 0 }), e.x, e.y);
    if (e.mimic || e.type === 'gimp') { dropItem(genItem(G.pw + 1, { minR: 2 }), e.x, e.y); dropItem(genItem(G.pw + 1, { minR: 2 }), e.x, e.y); }
    if (e.type === 'gimp') { S.stats.imps++; toast('💰 You caught the Gilded Imp!', '#ffd54a'); sfx('legend'); }
    if (e.elite) drop('ore', ri(1, 2), e.x, e.y);
    else if (Math.random() < .025) drop('ore', 1, e.x, e.y);
    if (Math.random() < .05) drop('hp', 0, e.x, e.y);
    if (Math.random() < .06) drop('mp', 0, e.x, e.y);
  }
  burst(e.x, e.y, e.d.col, e.boss ? 80 : 16, e.boss ? 420 : 230, .8, 3.5, (e.r / TILE) * 1.2); sfx('kill');
  if (ST.u.explode) G.later.push({ t: .05, fn: () => { aoe(e.x, e.y, 85, pdmg() * .6, { noProc: true }); ringFx(e.x, e.y, 85, '#ff8a3a'); burst(e.x, e.y, '#ff8a3a', 12, 250, .4, 3); } });
  if (ST.u.storm) G.later.push({ t: .1, fn: () => { const hs = new Set(); for (let i = 0; i < 2; i++) { const n = nearestEnemy(e.x, e.y, 300, null, hs); if (n) { hs.add(n); strike(n.x, n.y, pdmg() * .8); } } } });
  if (ST.u.vamp) healP(ST.maxHp * .02);
  if (ST.u.haste) P.buffs.windrun = 3;
  if (ST.art === 'rift' && G.zones.filter(z => z.kind === 'rift').length < 4) G.zones.push({ kind: 'rift', x: e.x, y: e.y, r: 110, t: 0, dur: 3, tick: .3, tt: 0, dmg: pdmg() * .3 });
  if (ST.art === 'frenzy') for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - 1);
  if (e.boss || e.elite) celestialRoll(e);
  if (e.elite === 'Volatile') for (let k = 0; k < 10; k++) ebullet(e, k * .628, 200, { r: 7 });
  if (e.elite) { S.stats.elites++; quest('elite'); }
  quest('kill', e.type);
  if (e.boss) bossDefeated(e);
}
function celestialRoll(e) {
  let c, fr = 0;
  if (e.boss) { c = .006 + S.diff * .012 + (G.abyss ? .03 + G.depth * .0015 : 0); fr = ri(1, 3) + S.diff + (G.abyss ? 2 + Math.floor(G.depth / 10) : 0); }
  else { c = .0004 * (1 + S.diff); if (Math.random() < .02 * (1 + S.diff * .5)) fr = 1; }
  if (fr) drop('frag', fr, e.x, e.y);
  if (Math.random() < c) dropItem(genArtifact(pick(Object.keys(ARTI)), G.pw + 3), e.x, e.y);
}
function dropItem(it, x, y) {
  G.pick.push({ k: 'item', it, x, y, vx: rnd(-120, 120), vy: rnd(-120, 120), t: 0, z: .5, vz: 4 });
  if (it.art) { sfx('legend'); setTimeout(() => sfx('lvl'), 300); banner('✦ CELESTIAL ARTIFACT ✦', it.name, RAR[6].c); shake(14); G.slow = .8; }
  else if (it.r >= 4) { sfx('legend'); toast(`${RAR[it.r].n} item dropped!`, RAR[it.r].c); shake(4); }
}
function bossDefeated(e) {
  G.boss = null; G.exit = { x: e.x, y: e.y }; shake(24); G.slow = 1.2;
  const n = ri(2, 3); for (let i = 0; i < n; i++) dropItem(genItem(G.pw + 1, { minR: i === 0 ? 2 : 1, bonus: .25 }), e.x, e.y);
  drop('ore', ri(5, 8), e.x, e.y); drop('shard', ri(8, 14), e.x, e.y);
  S.stats.bosses++; quest('boss');
  if (!G.abyss) {
    const first = !S.done[S.diff][G.region];
    S.done[S.diff][G.region] = true; S.prog[S.diff][G.region] = BOSS_F;
    if (first && S.diff === 0) S.boonPend++;
    if (first) {
      S.sp += 2; banner('Ember Shard Recovered!', '+2 Skill Points • New region unlocked', '#ffb04a');
      const reg = G.region, last = reg === NREG - 1;
      if (last) { const nd = Math.min(3, S.diff + 1); const newD = nd > S.maxDiff; S.maxDiff = Math.max(S.maxDiff, nd); if (newD) toast(`${DIFF[nd]} difficulty unlocked!`, DIFFC[nd]); }
      const after = last ? () => openMenu('victory') : null;
      if (S.diff === 0) G.later.push({ t: 2.2, fn: () => playStory('post' + reg, RSTORY[reg].post, () => offerBoon(after)) });
      else if (last && S.diff === 3) G.later.push({ t: 2.2, fn: () => playStory('trueend', TRUE_END, after) });
      else if (last) G.later.push({ t: 2.5, fn: after });
    } else banner('Victory!', 'The guardian falls once more', '#ffb04a');
  } else banner('Abyssal Guardian Slain', 'Step into the portal to descend deeper', '#ff5a8a');
  saveGame();
}
function gainXP(x) {
  if (S.lvl >= MAXLVL) return;
  S.xp += x * (1 + ST.xp / 100) * (buff('wisdom') ? 1.5 : 1);
  while (S.lvl < MAXLVL && S.xp >= xpNeed(S.lvl)) {
    S.xp -= xpNeed(S.lvl); S.lvl++; S.sp++; calcStats(); P.hp = ST.maxHp; P.mp = ST.maxMp;
    banner(`Level ${S.lvl}!`, '+1 Skill Point — press K', '#7aff7a'); sfx('lvl'); burst(P.x, P.y, '#ffe080', 50, 260, 1.1, 3, .2); ringFx(P.x, P.y, 120, '#ffe080', .6);
  }
}
function hurtPlayer(amt, src) {
  if (P.dodgeT > 0 || P.air > 0) { if (P.dodgeT > 0) perfectDodge(); return; }
  if (P.inv > 0 || G.mode !== 'play' || amt <= 0) return;
  amt *= 1 - ST.dr / 100; if (buff('aegis')) amt *= .7;
  P.hp -= amt; P.inv = .45; shake(6); G.hurtFlash = .25; G.chan = 0; P.combo = Math.floor(P.combo / 2);
  dmgText(P.x, P.y - 22, amt, '#ff5050', true, 2); sfx('hurt');
  if (src && !src.dead) {
    if (ST.thorns > 0) hurtEnemy(src, pdmg() * ST.thorns / 100, { noProc: true, col: '#ffa0a0' });
    if (src.elite === 'Vampiric') src.hp = Math.min(src.maxHp, src.hp + src.maxHp * .08);
  }
  if (P.hp <= 0) {
    if (ST.u.phoenix && P.phx) { P.phx = false; P.hp = ST.maxHp * .5; P.inv = 2; burst(P.x, P.y, '#ff9a2a', 60, 300, 1, 4); ringFx(P.x, P.y, 200, '#ff9a2a', .6); toast('🔥 Phoenix rebirth!', '#ffb04a'); aoe(P.x, P.y, 200, pdmg() * 3, { noProc: true, kb: 400 }); return; }
    die();
  }
}
function die() {
  G.mode = 'dead'; P.hp = 0; S.stats.deaths++; G.lostGold = S.opts.relaxed || G.tutorial ? 0 : Math.floor(S.gold * .15); S.gold -= G.lostGold;
  burst(P.x, P.y, '#ff3030', 60, 260, 1.4, 4); sfx('boom'); saveGame();
  setTimeout(() => openMenu('dead'), 1100);
}

// ---------- skills ----------
function castSkill(id) {
  if (!id) return; const sk = SKI[id], r = S.sk[id] || 0; if (!r) return;
  if ((P.cds[id] || 0) > 0) return;
  if (P.mp < sk.mp) { toast('Not enough mana', '#7ab0ff'); sfx('error'); return; }
  P.mp -= sk.mp; P.cds[id] = sk.cd * (1 - ST.cdr / 100); G.chan = 0; P.atkAnim = .3; P.swingK = 'cast';
  const W = mouseWorld(), base = pdmg(), pct = x => base * x / 100, fa = P.face;
  switch (id) {
    case 'whirl': P.whirl = 2.5; P.whirlT = 0; P.whirlD = pct(35 + 8 * r); break;
    case 'slam': aoe(P.x, P.y, 175, pct(300 + 60 * r), { skill: 1, kb: 320, stun: 1.2 }); clearBullets(P.x, P.y, 175); ringFx(P.x, P.y, 175, '#e8c080', .45); burst(P.x, P.y, '#b89060', 34, 320, .7, 4, .1); shake(14); sfx('boom'); break;
    case 'berserk': P.buffs.berserk = 6; burst(P.x, P.y, '#ff3a3a', 30, 200, .7, 3); sfx('lvl'); break;
    case 'leap': {
      let tx = W.x, ty = W.y; const d = Math.hypot(tx - P.x, ty - P.y); if (d > 380) { tx = P.x + (tx - P.x) / d * 380; ty = P.y + (ty - P.y) / d * 380; }
      for (let i = 0; i < 20 && hitsWall(tx, ty, P.r); i++) { tx += (P.x - tx) * .15; ty += (P.y - ty) * .15; }
      if (hitsWall(tx, ty, P.r)) { tx = P.x; ty = P.y; }
      P.lx0 = P.x; P.ly0 = P.y; P.lx1 = tx; P.ly1 = ty; P.air = .45; P.leapD = pct(250 + 50 * r); break;
    }
    case 'blades': P.blades = 8; P.bladeN = 4 + Math.floor(r / 2); P.bladeD = pct(60 + 15 * r); sfx('magic'); break;
    case 'shadow': {
      let tx = W.x, ty = W.y; const d = Math.hypot(tx - P.x, ty - P.y); if (d > 320) { tx = P.x + (tx - P.x) / d * 320; ty = P.y + (ty - P.y) / d * 320; }
      for (let i = 0; i < 20 && hitsWall(tx, ty, P.r); i++) { tx += (P.x - tx) * .15; ty += (P.y - ty) * .15; }
      if (!hitsWall(tx, ty, P.r) && los(P, { x: tx, y: ty })) { burst(P.x, P.y, '#6a4a9a', 24, 180, .6, 4); P.x = tx; P.y = ty; }
      aoe(P.x, P.y, 105, pct(150 + 30 * r), { skill: 1, kb: 200 }); ringFx(P.x, P.y, 105, '#a070ff'); burst(P.x, P.y, '#a070ff', 24, 220, .6, 3);
      P.nextCrit = true; P.inv = .35; sfx('dodge'); break;
    }
    case 'arrows': G.zones.push({ kind: 'arrows', x: W.x, y: W.y, r: 135, t: 0, dur: 3, tick: .3, tt: 0, dmg: pct(50 + 10 * r) }); sfx('shoot'); break;
    case 'poison': G.zones.push({ kind: 'poison', x: W.x, y: W.y, r: 125, t: 0, dur: 5, tick: .5, tt: 0, dmg: pct(60 + 16 * r) * .5 }); sfx('magic'); break;
    case 'wolves': { const n = 1 + Math.floor((r + 1) / 2); for (let i = 0; i < n; i++) { const p = randFloorNear(P.x, P.y, 20, 60, 12); G.allies.push({ x: p.x, y: p.y, r: 12, t: 15, cd: 0, dmg: pct(50 + 12 * r), spd: 280, face: 0, mv: 0 }); burst(p.x, p.y, '#9ae0ff', 16, 160, .6, 3); } sfx('magic'); break; }
    case 'knives': { const n = 16 + 2 * r; for (let i = 0; i < n; i++) pshot(fa + i * 6.283 / n, { kind: 'knife', dmg: pct(80 + 20 * r), spd: 720, pr: 3, life: .6, skill: 1, col: '#e0e8f0', r: 5 }); sfx('swing'); break; }
    case 'fireball': pshot(Math.atan2(W.y - P.y, W.x - P.x), { kind: 'fire', dmg: pct(220 + 45 * r), spd: 640, splash: 105, skill: 1, burn: true, r: 12, col: '#ff7a2a', life: 1.5 }); sfx('magic'); break;
    case 'nova': aoe(P.x, P.y, 185, pct(120 + 25 * r), { skill: 1, frz: 2.5, kb: 150 }); clearBullets(P.x, P.y, 185); ringFx(P.x, P.y, 185, '#9ae8ff', .5); burst(P.x, P.y, '#c8f4ff', 50, 340, .7, 3, .3); sfx('magic'); break;
    case 'chain': { const t = nearestEnemy(W.x, W.y, 260) || nearestEnemy(P.x, P.y, 450); if (t) chainLightning(t, pct(150 + 30 * r), 5 + r, false, { skill: 1 }); else { P.mp += sk.mp; P.cds[id] = 0; toast('No target in range'); } break; }
    case 'heal': healP(ST.maxHp * (.25 + .03 * r)); P.buffs.regen = 5; burst(P.x, P.y, '#7aff9a', 40, 160, .9, 3, .2); ringFx(P.x, P.y, 80, '#7aff9a', .5); sfx('potion'); break;
    case 'meteor': G.zones.push({ kind: 'meteor', x: W.x, y: W.y, r: 185, t: 0, delay: 1.05, dmg: pct(600 + 120 * r) }); sfx('magic'); break;
    case 'warp': G.warp = 5 + .5 * r; ringFx(P.x, P.y, 600, '#c0a0ff', .8); sfx('boss'); break;
  }
}

// ---------- enemies ----------
function ebullet(e, a, spd, o = {}) {
  spd = (spd || 230) * (1 + Math.min(11, G.region) * .03 + S.diff * .05);
  G.eb.push({ x: e.x + Math.cos(a) * e.r * .8, y: e.y + Math.sin(a) * e.r * .8, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: o.r || 7, dmg: o.dmg || e.dmg * .9, col: e.d.pc || '#ff6a6a', life: o.life || 4.5 });
  sfx('eshoot');
}
function ringShot(e, n, off, spd) { for (let k = 0; k < n; k++) ebullet(e, off + k * 6.283 / n, spd || 210); }
function step(e, a, s, dt) { if (s > 0) { e.face = a; e.mv += s * dt; } return moveEnt(e, Math.cos(a) * s * dt, Math.sin(a) * s * dt); }
function dot(e, a, col, dt) {
  e.hp -= a; e.dacc += a; e.dtt += dt;
  if (e.dtt > .5) { e.dtt = 0; dmgText(e.x, e.y - e.r, e.dacc, col); e.dacc = 0; }
  if (e.hp <= 0) killEnemy(e);
}
function updEnemy(e, edt, dt) {
  if (e.prop) return;
  if (e.flash > 0) e.flash -= dt; if (e.bcd > 0) e.bcd -= dt; if (e.ocd > 0) e.ocd -= dt;
  if (e.burn > 0) { e.burn -= dt; dot(e, e.burnD * dt, '#ff9a4a', dt); if (Math.random() < .25) G.parts.push({ x: e.x + rnd(-e.r, e.r), y: e.y + rnd(-e.r, e.r) * .5, z: .4, vx: 0, vy: 0, vz: 1.5, g: -1, life: .5, max: .5, col: '#ff8a2a', size: 4 }); } else e.burnD = 0;
  if (e.dead) return;
  if (e.psn > 0) { e.psn -= dt; dot(e, e.psnD * dt, '#9aff5a', dt); } else e.psnD = 0;
  if (e.dead) return;
  if (e.frz > 0) e.frz -= dt; if (e.shk > 0) e.shk -= dt;
  const slow = e.frz > 0 ? .5 : 1; edt *= slow;
  if (e.kx || e.ky) { moveEnt(e, e.kx * dt, e.ky * dt); const f = Math.pow(.0005, dt); e.kx *= f; e.ky *= f; if (Math.abs(e.kx) < 5 && Math.abs(e.ky) < 5) e.kx = e.ky = 0; }
  if (e.stun > 0) { e.stun -= dt; return; }
  const d = dist(e, P);
  if (Math.random() < .02) unstick(e);
  if (!e.awake) { if ((d < (G.mod === 'dark' ? 360 : 480) && los(e, P)) || d < 170) wake(e); else { idleWander(e, edt, d); return; } }
  e.t += edt;
  const fireMul = (e.elite === 'Frenzied' ? .55 : 1) * (G.mod === 'arcane' ? .75 : 1);
  if (e.boss) { updBoss(e, edt); }
  else {
    const ai = e.d.ai;
    switch (ai) {
      case 'chase': { const a = navDir(e); if (a !== null) step(e, a, e.spd, edt); else if (los(e, P)) step(e, ang(e, P), e.spd, edt); break; }
      case 'swarm': { const a = navDir(e); if (a !== null) step(e, a + Math.sin(e.t * 5) * .7, e.spd, edt); break; }
      case 'flee': {
        e.life -= dt;
        if (e.life <= 0) { e.dead = true; burst(e.x, e.y, '#ffd54a', 30, 200, .6, 4); toast('The Gilded Imp escaped with its gold!', '#c8a040'); break; }
        const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE); let best = -1, ba = null;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { if (!ox && !oy) continue; if (solid(tx + ox, ty + oy)) continue; const v = M.flow[(ty + oy) * M.w + tx + ox]; if (v > best) { best = v; ba = Math.atan2((ty + oy + .5) * TILE - e.y, (tx + ox + .5) * TILE - e.x); } }
        if (d < 420) step(e, ba !== null ? ba + Math.sin(e.t * 3) * .4 : ang(P, e), e.spd, edt);
        if (Math.random() < .1) G.parts.push({ x: e.x, y: e.y, z: .3, vx: 0, vy: 0, vz: 1, g: 2, life: .5, max: .5, col: '#ffd54a', size: 3 });
        break;
      }
      case 'dash': {
        e.st_t -= edt;
        if (e.st === 'idle') { const a = navDir(e); if (d < 270 && e.st_t <= 0 && los(e, P)) { e.st = 'wind'; e.st_t = .55 * fireMul; e.ang = ang(e, P); e.face = e.ang; } else if (a !== null) step(e, a, e.spd, edt); }
        else if (e.st === 'wind') { if (e.st_t <= 0) { e.st = 'dash'; e.st_t = .38; } }
        else if (e.st === 'dash') { if (step(e, e.ang, e.spd * 4.2, edt) || e.st_t <= 0) { e.st = 'idle'; e.st_t = 1; } }
        break;
      }
      case 'shoot': case 'spread': case 'summon': {
        const sees = d < 600 && los(e, P);
        if (!sees || d > 420) { const a = navDir(e); if (a !== null) step(e, a, e.spd, edt); }
        else if (d < 220) { step(e, ang(P, e), e.spd * .8, edt); e.face = ang(e, P); }
        else { step(e, ang(e, P) + Math.PI / 2 * e.side, e.spd * .4, edt); e.face = ang(e, P); if (Math.random() < .005) e.side *= -1; }
        e.fireT -= edt;
        if (e.fireT <= 0 && sees) {
          e.fireT = e.d.fire * rnd(.8, 1.2) * fireMul; const a0 = ang(e, P); e.flash = Math.max(e.flash, .05); e.cast = .25;
          if (ai === 'shoot') ebullet(e, a0, 260);
          else if (ai === 'spread') for (let k = 0; k < e.d.cnt; k++) ebullet(e, a0 + (k - (e.d.cnt - 1) / 2) * .24, 230);
          else if (G.ens.length < 100) { for (let k = 0; k < 2; k++) { const p = randFloorNear(e.x, e.y, 30, 70, 14); mkEnemy(e.d.minion, p.x, p.y, { minion: true, awake: true }); burst(p.x, p.y, e.d.col, 12, 120, .5, 3); } }
        }
        break;
      }
      case 'blink': {
        e.fireT -= edt;
        if (e.st === 'cast') { e.st_t -= edt; if (e.st_t <= 0) { e.st = 'idle'; ringShot(e, e.elite ? 12 : 8, rnd(0, 1), 200); } }
        else {
          if (d > 300) { const a = navDir(e); if (a !== null) step(e, a, e.spd, edt); } else step(e, ang(e, P) + Math.PI / 2 * e.side, e.spd * .5, edt);
          if (e.fireT <= 0 && d < 650) { e.fireT = e.d.fire * fireMul; burst(e.x, e.y, e.d.col, 14, 150, .5, 3); const p = randFloorNear(P.x, P.y, 160, 260, e.r); e.x = p.x; e.y = p.y; burst(e.x, e.y, e.d.col, 14, 150, .5, 3); e.st = 'cast'; e.st_t = .45; }
        }
        break;
      }
      case 'tank': {
        e.st_t -= edt;
        if (e.st === 'idle') { const a = navDir(e); if (a !== null) step(e, a, e.spd, edt); if (d < 125 && e.st_t <= 0) { e.st = 'wind'; e.st_t = .8 * fireMul; } }
        else if (e.st === 'wind' && e.st_t <= 0) { if (dist(e, P) < 125 + P.r) hurtPlayer(e.dmg * 1.6, e); ringFx(e.x, e.y, 125, '#ff6a4a'); burst(e.x, e.y, e.d.col, 20, 250, .5, 4, .1); shake(5); sfx('boom'); e.st = 'idle'; e.st_t = 2.2; }
        break;
      }
      case 'bomber': {
        if (e.st === 'idle') { const a = navDir(e); if (a !== null) step(e, a, e.spd, edt); if (d < 70) { e.st = 'fuse'; e.st_t = .6; } }
        else { e.st_t -= edt; if (e.st_t <= 0) { if (dist(e, P) < 100 + P.r) hurtPlayer(e.dmg, null); ringFx(e.x, e.y, 100, '#d8ff70'); burst(e.x, e.y, '#d8ff70', 34, 280, .6, 4); sfx('boom'); killEnemy(e); return; } }
        break;
      }
      case 'turret': {
        if (d < 650 && los(e, P)) {
          e.st_t -= edt; e.ang += edt * 2.1;
          if (e.st === 'idle') { if (e.st_t <= 0) { e.st = 'fire'; e.st_t = 2.4; e.fireT = 0; } }
          else { e.fireT -= edt; if (e.fireT <= 0) { e.fireT = .14 * fireMul; const arms = e.elite ? 4 : 2; for (let k = 0; k < arms; k++) ebullet(e, e.ang + k * 6.283 / arms, 190, { r: 6 }); } if (e.st_t <= 0) { e.st = 'idle'; e.st_t = 1.8; } }
        }
        break;
      }
    }
  }
  if (e.dead) return;
  if (e.cast > 0) e.cast -= dt;
  if (d < e.r + P.r + (P.dodgeT > 0 ? 10 : 0) && e.d.ai !== 'turret' && e.dmg > 0) hurtPlayer(e.dmg * (e.st === 'dash' || e.pat === 'charge' ? 1.4 : 1), e);
}
function idleWander(e, dt, d) {
  if (d > 1400) return;
  if (e.d.ai === 'turret') { e.ang += dt * .6; return; }
  e.wT -= dt;
  if (e.wT <= 0) { e.wT = rnd(2, 5); e.wD = rnd(.5, 1.3); e.wA = Math.hypot(e.x - e.hx, e.y - e.hy) > 80 ? Math.atan2(e.hy - e.y, e.hx - e.x) : rnd(0, 6.283); }
  if (e.wD > 0) { e.wD -= dt; if (step(e, e.wA, e.spd * .3, dt)) e.wD = 0; }
}
function updBoss(e, dt) {
  const b = e.bd;
  if (!e.enr && e.hp < e.maxHp * .5) { e.enr = true; banner('ENRAGED', b.n, '#ff4a3a'); sfx('boss'); ringShot(e, 24, 0, 240); shake(12); }
  if (!e.des && e.hp < e.maxHp * .2) { e.des = true; banner('DESPERATION', 'The guardian unleashes everything!', '#ff2a6a'); sfx('boss'); ringShot(e, 32, 0, 260); ringShot(e, 32, .1, 200); shake(16); e.pat = null; e.patT = .3; }
  const sp = e.des ? 1.6 : e.enr ? 1.35 : 1;
  if (e.pat === null) {
    const d = dist(e, P), a = ang(e, P);
    if (d > 260) step(e, a, e.spd, dt); else if (d < 160) step(e, a + Math.PI, e.spd * .6, dt); else step(e, a + Math.PI / 2 * e.side, e.spd * .5, dt);
    e.face = a;
    if (Math.random() < .01) e.side *= -1;
    e.patT -= dt * sp;
    if (e.patT <= 0) { e.pat = b.pats[e.pi % b.pats.length]; e.pi += Math.random() < .3 ? 2 : 1; e.pt = 0; e.pc = 0; e.st_t = 0; e.cast = .4; }
  } else runPat(e, dt * sp);
}
function endPat(e) { e.pat = null; e.patT = e.des ? .45 : e.enr ? .8 : 1.3; }
function addTele(o) { G.tele.push({ t: 0, col: '#ff4a3a', ...o }); }
function runPat(e, dt) {
  e.pt += dt; const [pat, arg] = e.pat.split(':'); const tier = Math.min(11, G.region + (G.abyss ? 2 : 0));
  switch (pat) {
    case 'ring':
      if (e.pc === 0 && e.pt > .3) { ringShot(e, 14 + tier * 2, rnd(0, 1)); e.pc = e.enr ? 1 : 2; }
      if (e.pc === 1 && e.pt > .75) { ringShot(e, 14 + tier * 2, rnd(0, 1)); e.pc = 2; }
      if (e.pt > 1.3) endPat(e); break;
    case 'spiral':
      e.st_t -= dt;
      if (e.st_t <= 0) { e.st_t = .08; e.spA += .23; const arms = e.des ? 5 : e.enr ? 4 : 3; for (let k = 0; k < arms; k++) ebullet(e, e.spA + k * 6.283 / arms, 190); }
      if (e.pt > 2.8) endPat(e); break;
    case 'aimed':
      if (e.pt > .35 * (e.pc + 1) && e.pc < (e.enr ? 5 : 3)) { e.pc++; const a0 = ang(e, P); e.face = a0; for (let k = -2; k <= 2; k++) ebullet(e, a0 + k * .17, 320); }
      if (e.pt > 2.1) endPat(e); break;
    case 'charge':
      if (e.pc === 0) { e.ang = ang(e, P); e.face = e.ang; e.pc = 1; e.pt = 0; addTele({ shape: 'l', x: e.x, y: e.y, a: e.ang, len: 650, w: e.r * 2, delay: .7, dmg: 0 }); }
      else if (e.pc === 1 && e.pt > .7) { e.pc = 2; e.pt = 0; }
      else if (e.pc === 2) {
        const hit = step(e, e.ang, 950, dt); if (Math.random() < .6) burst(e.x, e.y, e.d.col, 2, 80, .4, 4, .1);
        if (hit || e.pt > .7) { shake(9); sfx('boom'); if (e.enr && !e.c2) { e.c2 = true; e.pc = 0; } else { e.c2 = false; endPat(e); } }
      }
      break;
    case 'summon':
      if (e.pc === 0 && e.pt > .4) { e.pc = 1; const n = e.enr ? 5 : 3; for (let i = 0; i < n; i++) { const p = randFloorNear(e.x, e.y, 60, 140, 16); mkEnemy(arg, p.x, p.y, { minion: true, awake: true }); burst(p.x, p.y, e.d.col, 16, 160, .6, 3); } }
      if (e.pt > 1) endPat(e); break;
    case 'slam': {
      const n = e.enr ? 5 : 3;
      if (e.pt > .45 * e.pc && e.pc < n) { e.pc++; addTele({ shape: 'c', x: P.x, y: P.y, r: 115, delay: .85, dmg: e.dmg * 1.5 }); }
      if (e.pt > .45 * n + 1) endPat(e); break;
    }
    case 'rain':
      if (e.pc === 0) { e.pc = 1; const n = e.des ? 24 : e.enr ? 18 : 12; for (let i = 0; i < n; i++) { const p = i === 0 ? { x: P.x, y: P.y } : randFloorNear(P.x, P.y, 40, 380, 4); addTele({ shape: 'c', x: p.x, y: p.y, r: 70, delay: rnd(.8, 1.7), dmg: e.dmg * 1.3, col: '#ff8a3a', fall: 1 }); } }
      if (e.pt > 2) endPat(e); break;
    case 'beam':
      if (e.pc === 0) { e.pc = 1; const base = ang(e, P), n = e.des ? 6 : e.enr ? 5 : 3; for (let k = 0; k < n; k++) addTele({ shape: 'l', x: e.x, y: e.y, a: base + k * 6.283 / n, len: 1200, w: 46, delay: 1, dmg: e.dmg * 1.6, beam: 1 }); }
      if (e.pt > 1.6) endPat(e); break;
    case 'blink':
      if (e.pc === 0) { e.pc = 1; burst(e.x, e.y, e.d.col, 24, 200, .6, 4); const p = randFloorNear(P.x, P.y, 230, 320, e.r); e.x = p.x; e.y = p.y; burst(e.x, e.y, e.d.col, 24, 200, .6, 4); }
      if (e.pc === 1 && e.pt > .45) { e.pc = 2; ringShot(e, 18 + tier * 2, rnd(0, 1)); }
      if (e.pt > 1.1) endPat(e); break;
    default: endPat(e);
  }
}
function separate() {
  const a = G.ens; for (let i = 0; i < a.length; i++) {
    const e = a[i]; if (!e.awake || e.dead || e.prop) continue;
    for (let j = i + 1; j < a.length; j++) {
      const o = a[j]; if (!o.awake || o.dead || o.prop) continue;
      const dx = o.x - e.x, dy = o.y - e.y, rr = e.r + o.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > .01) {
        const d = Math.sqrt(d2), push = (rr - d) * .5, nx = dx / d * push, ny = dy / d * push;
        if (!e.boss && e.d.ai !== 'turret') moveEnt(e, -nx, -ny); if (!o.boss && o.d.ai !== 'turret') moveEnt(o, nx, ny);
      }
    }
  }
}

// ---------- updates ----------
function updProj(dt) {
  for (const b of G.pp) {
    b.life -= dt; if (b.life <= 0) { if (b.splash) explode(b); b.dead = true; continue; }
    if (b.home) {
      const t = nearestEnemy(b.x, b.y, 320);
      if (t) { const sp = Math.hypot(b.vx, b.vy), ca = Math.atan2(b.vy, b.vx), na = ca + clamp(angDiff(ca, ang(b, t)), -b.home * dt, b.home * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
    }
    if (b.kind === 'boom') {
      b.out += dt; b.spin += dt * 20;
      if (b.out > .42 && !b.ret) { b.ret = true; b.hit.clear(); }
      if (b.ret) { const a = ang(b, P), sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; if (dist(b, P) < 22) { b.dead = true; continue; } }
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.kind === 'fire' || b.kind === 'orb' || b.kind === 'ball') if (Math.random() < .7) G.parts.push({ x: b.x, y: b.y, z: .75, vx: rnd(-20, 20), vy: rnd(-20, 20), vz: rnd(0, 1), g: 0, life: .35, max: .35, col: b.kind === 'ball' ? '#888' : b.col, size: b.r * .7 });
    if (solidAt(b.x, b.y)) {
      if (b.kind === 'boom') { if (!b.ret) { b.ret = true; b.hit.clear(); } }
      else { if (b.splash) explode(b); else burst(b.x, b.y, '#bbb', 4, 80, .25, 2, .75); b.dead = true; continue; }
    }
    for (const e of G.ens) {
      if (e.dead || b.hit.has(e)) continue;
      if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + b.r) ** 2) {
        if (b.splash) { explode(b); b.dead = true; break; }
        b.hit.add(e); hitE(e, b.dmg, { kb: b.kind === 'bolt' ? 160 : 70, ang: Math.atan2(b.vy, b.vx), skill: b.skill, burn: b.burn, wb: b });
        if (ST.art === 'split' && !b.child && !b.skill) for (let k = 0; k < 2; k++) { const a = rnd(0, 6.283); G.pp.push({ x: e.x, y: e.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 5, dmg: b.dmg * .5, pr: 0, hit: new Set([e]), life: .9, kind: 'spark', home: 6, splash: 0, col: '#7ffcff', out: 0, ret: false, spin: 0, child: 1 }); }
        if (b.pr-- <= 0) { b.dead = true; break; }
      }
    }
  }
  G.pp = G.pp.filter(b => !b.dead);
}
function explode(b) {
  aoe(b.x, b.y, b.splash, b.dmg, { skill: b.skill, burn: b.burn, kb: 130, wb: b });
  ringFx(b.x, b.y, b.splash, b.col); burst(b.x, b.y, b.col, 20, 220, .5, 3.5, .7); sfx(b.kind === 'fire' || b.kind === 'ball' ? 'boom' : 'magic');
  if (b.kind === 'fire' || b.kind === 'ball') shake(5);
}
function updEB(dt) {
  const s = (G.warp > 0 ? .4 : 1);
  for (const b of G.eb) {
    if (b.dead) continue; b.life -= dt; b.x += b.vx * dt * s; b.y += b.vy * dt * s;
    if (b.life <= 0 || solidAt(b.x, b.y)) { b.dead = true; continue; }
    const d2 = (b.x - P.x) ** 2 + (b.y - P.y) ** 2;
    if (P.dodgeT > 0) { if (d2 < (b.r + P.r + 14) ** 2) perfectDodge(); continue; }
    if (P.air > 0) continue;
    if (d2 < (b.r + P.r - 3) ** 2) { G.lastHitBy = b.src; hurtPlayer(b.dmg, null); b.dead = true; }
  }
  G.eb = G.eb.filter(b => !b.dead);
}
function updTele(dt) {
  for (const t of G.tele) {
    t.t += dt * (G.warp > 0 ? .6 : 1);
    if (t.t >= t.delay) {
      t.dead = true; if (!(t.dmg > 0)) continue;
      const hit = t.shape === 'c' ? dist(t, P) < t.r + P.r * .5 : segDist(P.x, P.y, t.x, t.y, t.x + Math.cos(t.a) * t.len, t.y + Math.sin(t.a) * t.len) < t.w / 2 + P.r * .6;
      if (hit) { G.lastHitBy = G.boss ? G.boss.d.n + ' (telegraphed attack)' : 'a telegraphed attack'; hurtPlayer(t.dmg, null); }
      if (t.shape === 'c') { ringFx(t.x, t.y, t.r, t.col, .3); burst(t.x, t.y, t.col, 12, 200, .4, 3, .1); }
      else for (let k = 0; k < 18; k++) { const q = k / 18 * t.len; burst(t.x + Math.cos(t.a) * q, t.y + Math.sin(t.a) * q, t.col, 2, 120, .35, 3, .5); }
      shake(3);
    }
  }
  G.tele = G.tele.filter(t => !t.dead);
}
function updZones(dt) {
  for (const z of G.zones) {
    z.t += dt;
    if (z.kind === 'meteor') {
      if (z.t >= z.delay) { z.dead = true; aoe(z.x, z.y, z.r, z.dmg, { skill: 1, burn: true, kb: 280 }); clearBullets(z.x, z.y, z.r); ringFx(z.x, z.y, z.r, '#ff7a2a', .5); burst(z.x, z.y, '#ff9a3a', 70, 420, .9, 5, .2); burst(z.x, z.y, '#555', 24, 200, 1.1, 6, .2); shake(16); sfx('boom'); }
      continue;
    }
    if (z.kind === 'rift') { for (const e of G.ens) if (!e.dead && !e.prop && !e.boss) { const d = dist(e, z); if (d < z.r * 1.7 && d > 8) { const a = ang(e, z); moveEnt(e, Math.cos(a) * 140 * dt, Math.sin(a) * 140 * dt); } } if (Math.random() < .7) { const a = rnd(0, 6.283); G.parts.push({ x: z.x + Math.cos(a) * z.r, y: z.y + Math.sin(a) * z.r, z: .3, vx: -Math.cos(a) * 160, vy: -Math.sin(a) * 160, vz: 0, g: 0, life: .6, max: .6, col: '#b060ff', size: 4 }); } }
    z.tt -= dt;
    if (z.tt <= 0) { z.tt = z.tick; aoe(z.x, z.y, z.r, z.dmg, z.kind === 'poison' ? { skill: 1, slow: 1, noProc: true, combo: 1 } : z.kind === 'rift' ? { noProc: true, combo: 1 } : { skill: 1, kb: 20 }); }
    if (z.kind === 'arrows' && Math.random() < .9) { const a = rnd(0, 6.283), d = Math.sqrt(Math.random()) * z.r; G.parts.push({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: 5, vx: 0, vy: 0, vz: -22, g: 0, life: .22, max: .22, col: '#e8d8a0', size: 3, streak: 1 }); }
    if (z.kind === 'poison' && Math.random() < .6) { const a = rnd(0, 6.283), d = Math.sqrt(Math.random()) * z.r; G.parts.push({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: .2, vx: 0, vy: 0, vz: .6, g: 0, life: 1, max: 1, col: '#6aff3a', size: 14 }); }
    if (z.t >= z.dur) z.dead = true;
  }
  G.zones = G.zones.filter(z => !z.dead);
}
function updTraps(dt) {
  const dmg = 12 * Math.pow(1.105, G.pw);
  for (const t of G.traps) {
    const ph = (G.t + t.off) % 3; t.up = ph < .6; t.warn = ph > 2.5;
    if (t.up && Math.abs(t.x - P.x) < 24 && Math.abs(t.y - P.y) < 24) { G.lastHitBy = 'a spike trap'; hurtPlayer(dmg, null); }
    if (t.up) for (const e of G.ens) if (!e.dead && !e.prop && !e.boss && Math.abs(t.x - e.x) < 22 && Math.abs(t.y - e.y) < 22 && e.bcd <= 0) { e.bcd = .5; hurtEnemy(e, pdmg() * .5, { noProc: true, col: '#ccc' }); }
  }
}
function updAllies(dt) {
  for (const a of G.allies) {
    a.t -= dt; a.cd -= dt;
    if (a.t <= 0) { a.dead = true; burst(a.x, a.y, '#9ae0ff', 16, 160, .6, 3); continue; }
    const tgt = nearestEnemy(a.x, a.y, 520);
    if (tgt) {
      const d = dist(a, tgt); a.face = ang(a, tgt);
      if (d > a.r + tgt.r + 4) { moveEnt(a, Math.cos(a.face) * a.spd * dt, Math.sin(a.face) * a.spd * dt); a.mv += a.spd * dt; }
      else if (a.cd <= 0) { a.cd = .55; hitE(tgt, a.dmg, { skill: 1, kb: 80, ang: a.face }); }
    } else if (dist(a, P) > 90) { a.face = ang(a, P); moveEnt(a, Math.cos(a.face) * a.spd * dt, Math.sin(a.face) * a.spd * dt); a.mv += a.spd * dt; }
  }
  G.allies = G.allies.filter(a => !a.dead);
}
function updPick(dt) {
  for (const p of G.pick) {
    p.t += dt; const f = Math.pow(.02, dt); p.vx *= f; p.vy *= f;
    if (p.z > 0 || p.vz > 0) { p.z += p.vz * dt; p.vz -= 14 * dt; if (p.z < 0) { p.z = 0; p.vz = Math.abs(p.vz) > 2 ? -p.vz * .35 : 0; } }
    const d = dist(p, P);
    if (p.k !== 'item' && d < 150 && p.t > .35) { const a = ang(p, P), s = 560; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt; if (!solidAt(nx, ny)) { p.x = nx; p.y = ny; } else { p.vx = 0; p.vy = 0; }
    if (d < P.r + 14 && p.t > .35) {
      if (p.k === 'gold') { const v = Math.round(p.v); S.gold += v; quest('gold', 0, v); sfx('gold'); p.dead = true; G.goldAcc = (G.goldAcc || 0) + v; }
      else if (p.k === 'ore') { S.ore += p.v; feed(`<span class="ore">◆ +${p.v} Ember Ore</span>`, '#9ad0ff'); sfx('item'); p.dead = true; }
      else if (p.k === 'frag') { S.frag += p.v; feed(`<span style="color:#7ffcff">✧ +${p.v} Celestial Fragment${p.v > 1 ? 's' : ''}</span> <span class="dim">(${S.frag}/${FORGE_COST})</span>`, '#7ffcff'); sfx('legend'); p.dead = true; hint('frag'); }
      else if (p.k === 'page') { if (!S.pages.includes(p.v)) S.pages.push(p.v); feed(`📜 <span style="color:#f0e0b0">Lost Page found (${S.pages.length}/${PAGES.length})</span>`, '#f0e0b0'); toast(`<i>"${PAGES[p.v]}"</i>`, '#f0e0b0'); sfx('shrine'); p.dead = true; hint('page'); }
      else if (p.k === 'shard') { S.shards += p.v; feed(`<span class="shard">✦ +${p.v} Shards</span>`, '#ff8af0'); sfx('item'); p.dead = true; }
      else if (p.k === 'hp') { healP(ST.maxHp * .1); sfx('potion'); p.dead = true; }
      else if (p.k === 'mp') { P.mp = Math.min(ST.maxMp, P.mp + ST.maxMp * .25); sfx('potion'); p.dead = true; }
      else if (p.k === 'item') {
        if (S.opts.autoSalv && p.it.r < S.opts.autoSalv && !p.it.u) { noteFound(p.it); S.shards += SALV[p.it.r]; p.dead = true; sfx('gold'); feed(`<span class="dim">Auto-salvaged ${p.it.name}</span> <span class="shard">+${SALV[p.it.r]} ✦</span>`, '#888'); }
        else if (S.inv.length < S.invMax) {
          const it = p.it; S.inv.push(it); it.isNew = true; p.dead = true; sfx('item'); hint('item'); noteFound(it);
          if (it.r >= 4) S.stats.legend++; if (it.r >= 5) S.stats.mythic++; if (it.r >= 6) S.stats.celestial++;
          const gp = gainPct(it), slot = it.slot === 'weapon' ? 'weapon' : it.slot;
          const sameStyle = it.slot !== 'weapon' || !S.eq.weapon || isRanged(it.t) === isRanged(S.eq.weapon.t);
          if (S.opts.autoEq && gp > .5 && sameStyle) { equip(it, slot); afterGear(); it.isNew = false; feed(`⚡ Auto-equipped <span style="color:${RAR[it.r].c}">${it.name}</span> <span class="up">+${gp.toFixed(1)}% power</span>`, RAR[it.r].c); }
          else feed(`${icon(it)} <span style="color:${RAR[it.r].c}">${it.name}</span>${gp > .5 ? ` <span class="up">▲ +${gp.toFixed(1)}% power</span>` : ''}`, RAR[it.r].c);
        }
        else toast('Inventory full! Salvage items (I, Shift+Click).', '#ff8a8a');
      }
    }
  }
  G.pick = G.pick.filter(p => !p.dead);
}
function isRanged(t) { return ['shot', 'orb', 'fan', 'boom'].includes(WT[t].k); }
function upgradeHint(it) {
  const cur = it.slot === 'weapon' ? S.eq.weapon : S.eq[it.slot];
  if (!cur) return ' <span class="up">▲ empty slot</span>';
  if (it.slot === 'weapon') return wDps(it) > wDps(cur) * 1.02 ? ' <span class="up">▲ upgrade</span>' : '';
  return (itemStats(it).hp || 0) > (itemStats(cur).hp || 0) * 1.05 && it.r >= cur.r ? ' <span class="up">▲</span>' : '';
}
function updFx(dt) {
  for (const p of G.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; p.z += p.vz * dt; p.vz -= p.g * dt; if (p.z < 0) { p.z = 0; p.vz *= -.3; } }
  G.parts = G.parts.filter(p => p.life > 0);
  for (const r of G.rings) r.t -= dt; G.rings = G.rings.filter(r => r.t > 0);
  for (const b of G.bolts) b.t -= dt; G.bolts = G.bolts.filter(b => b.t > 0);
  for (const s of G.swings) s.t -= dt; G.swings = G.swings.filter(s => s.t > 0);
  for (const t of G.txt) { t.t -= dt; t.z += 1.1 * dt; } G.txt = G.txt.filter(t => t.t > 0);
  for (const l of G.later) { l.t -= dt; if (l.t <= 0) { l.dead = true; l.fn(); } } G.later = G.later.filter(l => !l.dead);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  G.shake = Math.max(0, G.shake - dt * 40); G.hurtFlash -= dt;
}
function checkInteract() {
  if (G.stairs) {
    const need = Math.ceil(G.total * .7);
    if (!G.stairsOpen && G.killed >= need) { G.stairsOpen = true; toast('✨ The stairs have unsealed!', '#7aff7a'); sfx('shrine'); }
    if (dist(P, G.stairs) < 30) { if (G.stairsOpen) { nextFloor(); return; } else toast(`The stairs are sealed — slay ${need - G.killed} more foes`, '#ff9a6a'); }
  }
  if (G.memory && !G.memory.used && dist(P, G.memory) < 36) {
    G.memory.used = true; const reg = G.region; sfx('shrine'); burst(G.memory.x, G.memory.y, '#ffe9a0', 40, 200, 1, 3, 1);
    playStory('mem' + reg, RMEM[reg], () => { const x = Math.round(xpNeed(S.lvl) * .3); gainXP(x / (1 + ST.xp / 100)); toast(`✨ Ember Memory witnessed — +${fmt(x)} XP`, '#ffe9a0'); });
  }
  if (G.exit && dist(P, G.exit) < 34) { if (typeof bossExit === 'function') { if (bossExit()) return; } else { if (G.abyss) nextFloor(); else { sfx('stairs'); goTown(); } return; } }
  for (const c of G.chests) {
    if (c.open || dist(P, c) > 36) continue;
    c.open = true;
    if (c.mimic) { const e = mkEnemy('mimic', c.x, c.y, { awake: true, mimic: true, elite: true }); e.elite = 'Frenzied'; c.gone = true; toast('It was a Mimic!', '#ff6a4a'); sfx('boss'); }
    else {
      sfx('item'); burst(c.x, c.y, '#ffd54a', 26, 200, .7, 3, .6);
      for (let i = 0; i < 5; i++) coin(c.x, c.y, Math.pow(1.12, G.pw) * rnd(2, 4) * (1 + goldEff() / 100));
      const n = Math.random() < .35 ? 2 : 1; for (let i = 0; i < n; i++) dropItem(genItem(G.pw + 1, { minR: Math.random() < .5 ? 1 : 0, bonus: .3 }), c.x, c.y);
      if (Math.random() < .5) drop('ore', 1, c.x, c.y);
    }
  }
  for (const s of G.shrines) {
    if (s.used || dist(P, s) > 32) continue;
    s.used = true; P.buffs[s.s.k] = 40; toast(`${s.s.n}: ${s.s.d} for 40s`, s.s.col); sfx('shrine'); ringFx(s.x, s.y, 120, s.s.col, .6); burst(s.x, s.y, s.s.col, 36, 200, .9, 3, 1);
  }
}
function updVillagers(dt) {
  for (const v of G.vill) {
    v.wt -= dt; v.sayT -= dt; if (v.sayLeft > 0) v.sayLeft -= dt;
    if (v.wt <= 0) { v.wt = rnd(3, 7); v.tx = rnd(7, 31) * TILE; v.ty = rnd(11, 22) * TILE; }
    const d = Math.hypot(v.tx - v.x, v.ty - v.y);
    if (d > 20 && v.wt < 5) { const a = Math.atan2(v.ty - v.y, v.tx - v.x); v.face = a; moveEnt(v, Math.cos(a) * 55 * dt, Math.sin(a) * 55 * dt); v.mv += dt * 6; }
    if (dist(v, P) < 130 && v.sayT <= 0) { v.say = pick(v.lines); v.sayLeft = 4.5; v.sayT = 9; v.face = ang(v, P); }
  }
}
function townInteract() {
  updVillagers(1 / 60);
  for (const n of G.npcs) {
    const d = dist(P, n);
    if (d < 56 && !n.near) { n.near = true; sfx('click'); openMenu(n.menu); }
    else if (d > 84) n.near = false;
  }
}
function update(dt) {
  G.t += dt;
  if (G.mode !== 'play' || G.menu) { if (G.mode === 'dead' || G.menu === 'title') updFx(dt); if (G.menu === 'dialog') dlgTick(dt); pressed = {}; return; }
  S.stats.time += dt;
  G.saveT += dt; if (G.saveT > 30) { G.saveT = 0; saveGame(); }
  G.achT += dt; if (G.achT > 1.5) { G.achT = 0; checkAch(); }
  G.hintT = (G.hintT || 0) + dt; if (G.hintT > .5) { G.hintT = 0; checkHints(); }
  updPlayer(dt); if (Math.random() < .02) unstick(P);
  if (G.mode !== 'play') { pressed = {}; return; }
  if (!G.inTown) {
    G.flowT -= dt; if (G.flowT <= 0) { G.flowT = .25; computeFlow(); }
    let wdt = dt; if (G.slow > 0) { G.slow -= dt; wdt *= .3; }
    const edt = wdt * (G.warp > 0 ? .4 : 1);
    for (const e of G.ens) if (!e.dead) updEnemy(e, edt, wdt);
    separate(); G.ens = G.ens.filter(e => !e.dead);
    updProj(dt); updEB(wdt); updZones(dt); updTele(wdt); updAllies(dt); updTraps(dt);
    if (G.warp > 0) G.warp -= dt;
    if (G.mode === 'play' && !G.inTown) checkInteract();
  } else townInteract();
  updPick(dt); updFx(dt); markSeen();
  let lx = 0, ly = 0;
  if (S.opts.look !== false && !G.inTown && typeof R3 !== 'undefined' && R3) { const W = mouseWorld(), dx = W.x - P.x, dy = W.y - P.y, dl = Math.hypot(dx, dy) || 1, m = Math.min(110, dl * .22); lx = dx / dl * m; ly = dy / dl * m; }
  if (G.boss && !G.boss.dead) { const bx = G.boss.x - P.x, by = G.boss.y - P.y, bd = Math.hypot(bx, by); if (bd > 200 && bd < 1100) { const f = Math.min(.5, (bd - 200) / 800 * .65); lx = lx * .5 + bx * f; ly = ly * .5 + by * f; } }
  const k = Math.min(1, dt * 7); G.cam.x += (P.x + lx - G.cam.x) * k; G.cam.y += (P.y + ly - G.cam.y) * k;
  pressed = {};
}

function eliteName(e) { return e.elite === 'Giant' && e.d.n.startsWith('Giant') ? 'Colossal' : e.elite; }
