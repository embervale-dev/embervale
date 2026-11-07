// ================= LONG-TERM SYSTEMS: logic =================
MODS.push({ k: 'vault', n: 'Treasure Vault', d: 'Chests everywhere and Gilded Imps abound — but more Mimics too', col: '#ffd54a' });
const SEASON_BUFF = [['+10% freeze chance', s => s.frz += 10], ['+1% life steal', s => s.ls += 1], ['+15% magic find', s => s.luck += 15], ['+10% shock chance', s => s.shk += 10], ['+5% max life', s => s.hpPct += 5], ['+10% burn chance', s => s.burn += 10],
  ['+3% crit chance', s => s.critC += 3], ['+20% Ember Surge gain', s => s.surge += 20], ['+20% gold find', s => s.gold += 20], ['+10% damage to elites', s => s.elite += 10], ['+3% damage reduction', s => s.dr += 3], ['+10% experience', s => s.xp += 10]];

// ---------- time & randomness ----------
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function dayId() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function weekId() { const d = new Date(); const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return m.getFullYear() * 10000 + (m.getMonth() + 1) * 100 + m.getDate(); }
function seasonId() { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); }
function seasonInfo(id = seasonId()) { const m = id % 12, y = Math.floor(id / 12); return { id, m, n: 'Season of ' + SEASONS[m][0], col: SEASONS[m][1], month: new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }), ends: new Date(y, m + 1, 1) }; }
function untilStr(date) { const ms = date - Date.now(); const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60; return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`; }
function nextDay() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); }
function nextWeek() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 - ((d.getDay() + 6) % 7)); }

// ---------- stats from long-term systems ----------
function trule(k) { return !!(G.trial && G.trial.rules.includes(k)); }
function wmLvl(t) { const k = (S.wm && S.wm[t]) || 0; return Math.min(40, Math.floor(Math.sqrt(k / 8))); }
function wmNext(t) { const l = wmLvl(t); return l >= 40 ? null : (l + 1) * (l + 1) * 8; }
function extraStats(s) {
  const pn = (S.para && S.para.n) || {}; for (const p of PARA) if (pn[p.k]) p.f(s, pn[p.k]);
  applyPet(s);
  const ml = wmLvl(s.wt); if (ml) { s.dmg += ml * .5; s.critD += ml * .25; }
  SEASON_BUFF[seasonId() % 12][1](s);
  if (trule('blood')) s.ls += 5;
}
function addMarks(n, why) { S.marks += n; feed(`${ico('marks')} +${n} Ember Marks${why ? ' — ' + why : ''}`, '#ff9a6a'); }

// ---------- experience: rested bonus & the Ember Constellation ----------
const _gainXP = gainXP;
gainXP = function (x) {
  let bonus = 0; if (S.rested > 0) { bonus = Math.min(S.rested, x); S.rested -= bonus; }
  const tot = x + bonus;
  if (S.lvl >= PARA_UNLOCK) paraXP(tot * (1 + ST.xp / 100) * (buff('wisdom') ? 1.5 : 1));
  _gainXP(tot);
};
// one Constellation level ~= 150 kills at your current frontier, growing 1% per level (endless, but never instant)
function paraNeed() { return Math.floor(150 * 2.8 * Math.pow(1.13, maxPw()) * (1 + S.para.lvl * .01)); }
function paraXP(v) {
  const p = S.para; p.xp += v * (S.lvl >= MAXLVL ? 1.5 : .6);
  let n = 0; while (p.xp >= paraNeed() && n < 50) { p.xp -= paraNeed(); p.lvl++; p.pts++; n++; }
  if (n) { feed(`✦ Constellation level ${p.lvl} — +${n} star point${n > 1 ? 's' : ''} [P]`, '#ffd27a'); sfx('shrine'); if (p.lvl === 1) toast('✦ The Ember Constellation awakens! Press P to spend star points.', '#ffd27a'); }
}
function spendStar(k, n = 1) {
  const p = S.para, cur = p.n[k] || 0; n = Math.min(n, p.pts, PARA_MAX - cur); if (n <= 0) return;
  p.n[k] = cur + n; p.pts -= n; sfx('click'); calcStats(); renderMenu();
}
function resetStars() { let t = 0; for (const k in S.para.n) t += S.para.n[k]; S.para.n = {}; S.para.pts += t; calcStats(); sfx('magic'); toast(`Refunded ${t} star points`); renderMenu(); }
function grantRested() {
  const h = (Date.now() - (S.lastPlay || Date.now())) / 3.6e6; if (h < 1) return;
  const unit = xpNeed(Math.min(S.lvl, MAXLVL)), add = Math.min(unit * (3 + innL()) - S.rested, h / 24 * unit * .8 * (1 + .25 * innL()));
  if (add > 1) { S.rested += add; setTimeout(() => toast(`${ico('rest')} Well rested! +${fmt(add)} bonus experience — kills grant double XP until it runs out.`, '#9ad0ff'), 2500); }
}

// ---------- kills: mastery, gems, pets, marks ----------
const _killEnemy = killEnemy;
killEnemy = function (e) {
  if (e.dead) return;
  const firstBoss = e.boss && !G.abyss && !S.done[S.diff][G.region];
  _killEnemy(e);
  if (e.prop) return;
  const t = ST.wt, l0 = wmLvl(t); S.wm[t] = (S.wm[t] || 0) + 1; const l1 = wmLvl(t);
  if (l1 > l0) { feed(`${WT[t].ic} ${WT[t].n} Mastery ${l1} — +${(l1 * .5).toFixed(1)}% damage with ${WT[t].n}s`, '#ffd27a'); calcStats(); }
  if (Math.random() < (e.boss ? 1 : e.elite ? .08 : e.minion ? 0 : .006)) dropGem(e.x, e.y);
  if (e.boss) {
    dropGem(e.x, e.y);
    if (Math.random() < .015 + S.diff * .006) { const p = pick(BOSS_PETS); if (!S.cos.pets.includes(p)) G.pick.push({ k: 'pet', v: p, x: e.x, y: e.y, vx: 0, vy: 0, t: 0, z: .5, vz: 3 }); }
    if (G.abyss) addMarks(5, 'Abyss guardian'); else addMarks(firstBoss ? 15 : 3, firstBoss ? 'first victory' : 'guardian');
  }
  if (trule('volatile')) for (let k = 0; k < 8; k++) ebullet(e, k * .785, 190, { r: 6 });
  if (e.cursed && G.cursed) G.cursed.left--;
};
function gemTier() { let t = 1 + S.diff + (G.abyss ? Math.floor(G.depth / 12) : 0) + (G.region >= 6 ? 1 : 0); if (Math.random() < .12) t++; return clamp(t, 1, 6); }
function dropGem(x, y) { G.pick.push({ k: 'gem', v: { g: pick(Object.keys(GEMS)), t: gemTier() }, x, y, vx: rnd(-100, 100), vy: rnd(-100, 100), t: 0, z: .4, vz: 3 }); }
function addGem(g, t, n = 1) { S.gems[g][t] += n; S.stats.gemMax = Math.max(S.stats.gemMax || 0, t); }
const _updPick = updPick;
updPick = function (dt) {
  for (const p of G.pick) {
    if (p.dead || p.t < .35) continue;
    if (S.cos.pet && p.k === 'gold' && dist(p, P) < 300) { const a = ang(p, P); p.vx = Math.cos(a) * 560; p.vy = Math.sin(a) * 560; }
    if ((p.k === 'gem' || p.k === 'pet') && dist(p, P) < P.r + 14) {
      p.dead = true;
      if (p.k === 'gem') { addGem(p.v.g, p.v.t); S.stats.gems++; feed(`${GEMS[p.v.g].ic} <span style="color:${GEMS[p.v.g].col}">${GEM_TN[p.v.t]} ${GEMS[p.v.g].n}</span> <span class="dim">(socket at the Jeweler)</span>`, GEMS[p.v.g].col); sfx('item'); }
      else { unlockPet(p.v); }
    }
  }
  _updPick(dt);
};
function unlockPet(k) {
  if (S.cos.pets.includes(k)) return; S.cos.pets.push(k); sfx('legend');
  banner('New Companion!', `${PETS[k].n} — ${PETS[k].b}`, '#ffe9a0'); if (!S.cos.pet) { S.cos.pet = k; calcStats(); }
  toast(`${ico('paw')} ${PETS[k].n} joins you! Change companions in the ${ico('crown')} Wardrobe.`, '#ffe9a0');
}

// ---------- level setup: trials & floor events ----------
const _resetLevel = resetLevel;
resetLevel = function () { _resetLevel(); G.cursed = null; G.merch = null; G.trial = G.trialNext || null; G.trialNext = null; };
const _calcPw = calcPw;
calcPw = function () { return G.trial ? Math.max(_calcPw(), maxPw() + 2) : _calcPw(); };
const _mkEnemy = mkEnemy;
mkEnemy = function (type, x, y, o = {}) {
  const d0 = EN[type];
  if (G.trial && d0.ai !== 'prop' && type !== 'gimp') {
    if (trule('marks') && !RANGED_AI.includes(d0.ai)) type = pick(ABYSS.en.filter(t => RANGED_AI.includes(EN[t].ai)));
    if (trule('elites')) o = { ...o, elite: true };
  }
  const e = _mkEnemy(type, x, y, o);
  if (G.trial && !e.prop) { if (trule('haste')) e.spd *= 1.35; if (trule('giants')) { e.r *= 1.3; e.hp *= 2; e.maxHp *= 2; } if (trule('blood')) e.dmg *= 1.5; }
  return e;
};
const _populate = populate;
populate = function (R) {
  _populate(R);
  const rooms = M.rooms.slice(1);
  const spot = () => { for (let i = 0; i < 40; i++) { const r = pick(rooms); const tx = ri(r.x + 1, r.x + r.w - 2), ty = ri(r.y + 1, r.y + r.h - 2); const q = { x: (tx + .5) * TILE, y: (ty + .5) * TILE }; if (!G.chests.some(c => dist(c, q) < 70) && (!G.stairs || dist(q, G.stairs) > 90)) return q; } return null; };
  if (G.trial) {
    G.stairs = null;
    if (trule('swarm')) for (const e of G.ens.slice()) if (e.counted) { const p = randFloorNear(e.x, e.y, 20, 60, 14); const n = mkEnemy(e.type, p.x, p.y, { elite: !!e.elite }); n.counted = true; G.total++; }
    return;
  }
  if (G.mod === 'vault') { for (let i = 0; i < 8; i++) { const p = spot(); if (p) G.chests.push({ ...p, open: false, mimic: Math.random() < .15, t: 0 }); } for (let i = 0; i < 2; i++) { const p = spot(); if (p) mkEnemy('gimp', p.x, p.y, {}); } }
  if (Math.random() < .09) { const p = spot(); if (p) G.cursed = { ...p, st: 'idle', wave: 0, left: 0, t: 0 }; }
  if (Math.random() < .06) { const p = spot(); if (p) G.merch = { ...p, items: genWander(), near: false }; }
};
function genWander() { const a = []; for (let i = 0; i < 4; i++) a.push(genItem(G.pw + 2, { minR: 3, bonus: .6 })); if (Math.random() < .1) a[3] = genItem(G.pw + 2, { r: 4 }); return a; }

// ---------- trials ----------
function trialDef(kind) {
  const id = kind === 'd' ? dayId() : weekId(), rng = mulberry(id * 7 + (kind === 'd' ? 1 : 2));
  const un = []; for (let r = 0; r < NREG; r++) if (r === 0 || S.done[S.diff][r - 1]) un.push(r);
  const reg = un[Math.floor(rng() * un.length)], keys = Object.keys(TRULES), rules = [], n = kind === 'd' ? 2 : 3;
  while (rules.length < n) { const k = keys[Math.floor(rng() * keys.length)]; if (!rules.includes(k) && !(k === 'swarm' && rules.includes('elites')) && !(k === 'elites' && rules.includes('swarm'))) rules.push(k); }
  return { kind, id, reg, rules, time: kind === 'd' ? 300 : 420 };
}
function trialDone(kind) { return S.trials[kind] === (kind === 'd' ? dayId() : weekId()); }
function startTrial(kind) {
  const T = trialDef(kind); G.trialNext = { ...T, left: T.time, done: false, reward: !trialDone(kind) };
  const keepLast = S.last, keepProg = S.prog[S.diff][T.reg]; closeMenu(); sfx('boss');
  enterFloor(T.reg, 3); S.last = keepLast; S.prog[S.diff][T.reg] = keepProg;
  banner(kind === 'd' ? 'DAILY TRIAL' : 'WEEKLY TRIAL', T.rules.map(k => TRULES[k].ic + ' ' + TRULES[k].n).join('  •  '), '#ff9a6a');
}
function updTrial(dt) {
  const tr = G.trial; if (!tr || tr.done) return;
  tr.left -= dt;
  if (G.total > 0 && G.killed >= G.total) { tr.done = true; trialWin(tr); }
  else if (tr.left <= 0) { tr.done = true; banner('TRIAL FAILED', 'Time ran out. Try again from the Waystone!', '#ff5a5a'); sfx('error'); G.exit = randFloorNear(P.x, P.y, 90, 160, 20); }
}
function trialWin(tr) {
  G.exit = randFloorNear(P.x, P.y, 90, 160, 20); sfx('legend'); S.stats.trials++;
  if (!tr.reward) { banner('TRIAL COMPLETE', 'Practice run — rewards already claimed this ' + (tr.kind === 'd' ? 'day' : 'week'), '#7aff7a'); return; }
  S.trials[tr.kind] = tr.id; const wk = tr.kind === 'w';
  banner(wk ? 'WEEKLY TRIAL COMPLETE!' : 'DAILY TRIAL COMPLETE!', 'The Ember rewards your mettle', '#7aff7a');
  addMarks(wk ? 120 : 30, wk ? 'Weekly Trial' : 'Daily Trial');
  for (let i = 0; i < (wk ? 3 : 2); i++) dropItem(genItem(G.pw + 2, { minR: 3, bonus: .6 }), P.x, P.y);
  if (wk) { dropItem(genItem(G.pw + 2, { r: 4 }), P.x, P.y); drop('frag', 3, P.x, P.y); }
  for (let i = 0; i < (wk ? 5 : 3); i++) dropGem(P.x, P.y);
  if (S.stats.trials >= 10) unlockPet('trialfox');
  saveGame();
}

// ---------- cursed chests & wandering merchants ----------
function spawnWave() {
  const c = G.cursed, R = curReg(); c.wave++; const n = 4 + c.wave * 2; c.left = 0;
  for (let i = 0; i < n; i++) { const p = randFloorNear(c.x, c.y, 90, 230, 16); const e = mkEnemy(pick(R.en), p.x, p.y, { awake: true, elite: Math.random() < .2 + c.wave * .12 }); e.cursed = true; c.left++; burst(p.x, p.y, '#c060ff', 14, 160, .6, 3); }
  toast(`${ico('skull')} Wave ${c.wave} / 3`, '#c060ff'); sfx('boss');
}
function updCursed(dt) {
  const c = G.cursed; if (!c) return;
  if (c.st === 'idle' && dist(P, c) < 40) { c.st = 'active'; c.t = 60; banner('CURSED CHEST', 'Survive 3 waves of cursed foes within 60 seconds!', '#c060ff'); spawnWave(); }
  else if (c.st === 'active') {
    c.t -= dt;
    if (c.left <= 0) { if (c.wave >= 3) cursedWin(c); else spawnWave(); }
    else if (c.t <= 0) { c.st = 'failed'; toast('The cursed chest crumbles to ash...', '#9a8aaa'); burst(c.x, c.y, '#555', 30, 160, 1, 5); }
  }
}
function cursedWin(c) {
  c.st = 'done'; S.stats.cursed++; sfx('legend'); banner('CURSE BROKEN', 'The chest spills its treasure!', '#c060ff'); shake(10);
  for (let i = 0; i < 2; i++) dropItem(genItem(G.pw + 2, { minR: 3, bonus: .5 }), c.x, c.y);
  if (Math.random() < .1) dropItem(genItem(G.pw + 2, { r: 4 }), c.x, c.y);
  for (let i = 0; i < 2; i++) dropGem(c.x, c.y);
  for (let i = 0; i < 12; i++) coin(c.x, c.y, Math.pow(1.12, G.pw) * rnd(2, 4) * (1 + goldEff() / 100));
  if (Math.random() < .15) drop('frag', ri(1, 2), c.x, c.y);
}
function updMerch() {
  const m = G.merch; if (!m) return; const d = dist(P, m);
  if (d < 46 && !m.near) { m.near = true; openMenu('wander'); } else if (d > 80) m.near = false;
}
const _update = update;
update = function (dt) {
  _update(dt);
  if (G.mode !== 'play' || G.menu || !S) return;
  if (!G.inTown) { updTrial(dt); updCursed(dt); updMerch(); }
  if (S.season && P) S.season.combo = Math.max(S.season.combo || 0, P.combo);
};

// ---------- trial rule hooks ----------
const _pdmg = pdmg; pdmg = function () { return _pdmg() * (trule('glass') ? 2 : 1); };
const _hurtPlayer = hurtPlayer; hurtPlayer = function (a, src) { if (S.opts.relaxed) a *= .65; if (G.tutorial) a *= .5; return _hurtPlayer(trule('glass') ? a * 2 : a, src); };
const _drink = drinkPotion; drinkPotion = function () { if (trule('nopot')) { toast('Potions are forbidden in this Trial!', '#ff8a8a'); return; } _drink(); };

// ---------- seasons ----------
function snapStats() { const b = {}; for (const t of SJ_T) if (!t.max) b[t.k] = S.stats[t.k] || 0; return b; }
function seasonState() {
  const id = seasonId();
  if (!S.season || S.season.id !== id) { const old = S.season; S.season = { id, base: snapStats(), claimed: [], chap: [], combo: 0 }; if (old) setTimeout(() => toast(`${ico('medal')} A new season has begun: <b>${seasonInfo().n}</b>! New Season Journey available (Y).`, seasonInfo().col), 3000); }
  return S.season;
}
function seasonObjs() {
  const ss = seasonState(), rng = mulberry(ss.id * 131 + 7), out = [];
  for (let c = 0; c < 5; c++) { const pool = SJ_T.slice(); for (let i = 0; i < 5; i++) { const t = pool.splice(Math.floor(rng() * pool.length), 1)[0]; out.push({ c, i, t, need: t.base[c], id: c * 10 + i }); } }
  return out;
}
function sjProg(o) { const ss = S.season; return Math.max(0, Math.min(o.need, o.t.max ? (ss.combo || 0) : (S.stats[o.t.k] || 0) - (ss.base[o.t.k] || 0))); }
function chapOpen(c) { return c === 0 || S.season.chap.includes(c - 1); }
const CHAP_RW = [40, 70, 100, 140, 220];
function claimSJ(id) {
  const ss = seasonState(), objs = seasonObjs(), o = objs.find(x => x.id === id);
  if (!o || ss.claimed.includes(id) || sjProg(o) < o.need || !chapOpen(o.c)) return;
  ss.claimed.push(id); S.marks += 8; S.gold += Math.round(60 * Math.pow(1.12, maxPw())); sfx('gold');
  if (objs.filter(x => x.c === o.c).every(x => ss.claimed.includes(x.id)) && !ss.chap.includes(o.c)) {
    ss.chap.push(o.c); addMarks(CHAP_RW[o.c], `Season chapter ${o.c + 1}`); sfx('legend');
    if (o.c === 2) unlockPet('crowned');
    if (o.c === 4) { const si = seasonInfo(); const tt = `Champion of ${si.n.replace('Season of ', '')}`; if (!S.cos.stitles.includes(tt)) S.cos.stitles.push(tt); const ak = 'season' + ss.id; if (!S.cos.auras.includes(ak)) S.cos.auras.push(ak); banner('SEASON COMPLETE!', `Title "${tt}" and the ${si.n} aura unlocked`, si.col); }
    else banner(`Chapter ${o.c + 1} complete!`, `+${CHAP_RW[o.c]} Ember Marks`, '#ffd27a');
  }
  saveGame(); renderMenu();
}
function auraCol(k) { if (typeof k !== 'string') return null; if (k.startsWith('season')) return SEASONS[(+k.slice(6)) % 12][1]; return AURAS[k] ? AURAS[k][1] : ''; }
function auraName(k) { if (k.startsWith('season')) return seasonInfo(+k.slice(6)).n + ' Aura'; return AURAS[k] ? AURAS[k][0] : k; }

// ---------- session hooks ----------
const _continueGame = continueGame;
continueGame = function () { _continueGame(); if (!S) return; grantRested(); seasonState(); calcStats(); saveGame(); };
const _newGame = newGame;
newGame = function (cls) { _newGame(cls); if (G.relaxNew) S.opts.relaxed = true; seasonState(); saveGame(); };

ACH.push(
  { id: 'para25', n: 'Starlit', d: 'Reach Constellation level 25', c: () => S.para.lvl, need: 25, sp: 1 },
  { id: 'para150', n: 'Living Constellation', d: 'Reach Constellation level 150', c: () => S.para.lvl, need: 150, sp: 3 },
  { id: 'wm10', n: 'Practiced', d: 'Reach Mastery 10 with any weapon', c: () => Math.max(0, ...Object.keys(S.wm).map(wmLvl)), need: 10, sp: 1 },
  { id: 'wm40', n: 'Perfected', d: 'Reach Mastery 40 with any weapon', c: () => Math.max(0, ...Object.keys(S.wm).map(wmLvl)), need: 40, sp: 3 },
  { id: 'wm5', n: 'Arms Collector', d: 'Reach Mastery 10 with 5 different weapon types', c: () => Object.keys(S.wm).filter(t => wmLvl(t) >= 10).length, need: 5, sp: 2 },
  { id: 'gem8', n: 'Royal Jeweler', d: 'Create a Royal (tier 8) gem', c: () => S.stats.gemMax || 0, need: 8, sp: 2 },
  { id: 'tr5', n: 'Tested', d: 'Complete 5 Trials', c: () => S.stats.trials, need: 5, sp: 1 },
  { id: 'tr50', n: 'Unbreakable', d: 'Complete 50 Trials', c: () => S.stats.trials, need: 50, sp: 2 },
  { id: 'curse10', n: 'Curse Breaker', d: 'Conquer 10 Cursed Chests', c: () => S.stats.cursed, need: 10, sp: 1 },
  { id: 'pets6', n: 'Menagerie', d: 'Befriend 6 companions', c: () => S.cos.pets.length, need: 6, sp: 1 },
);
