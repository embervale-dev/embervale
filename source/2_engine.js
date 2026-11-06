// ================= ENGINE: utils, input, audio, save, stats, items =================
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function fmt(n) {
  n = Math.round(n); const a = Math.abs(n);
  if (a >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return '' + n;
}
function hash(x, y) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; const l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = clamp(t, 0, 1); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }

// ---------- canvas ----------
const cv = $('c'), X = cv.getContext('2d'), cv3 = $('g3');
let VW = 0, VH = 0, DPR = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1); VW = innerWidth; VH = innerHeight;
  cv.width = VW * DPR; cv.height = VH * DPR; cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  if (typeof resize3D === 'function') resize3D();
}
addEventListener('resize', resize);

// ---------- input ----------
const keys = {}, mouse = { x: 0, y: 0, down: false };
let pressed = {};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
  if (k === 'tab' || k === ' ' || k.startsWith('arrow')) e.preventDefault();
  if (!e.repeat) onKey(k, e);
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
let camZoom = 1;
addEventListener('wheel', e => { if (G && G.menu) return; camZoom = clamp(camZoom * (e.deltaY > 0 ? 1.08 : .926), .65, 1.5); }, { passive: true });
cv.addEventListener('mousedown', e => { initAudio(); if (e.button === 0) mouse.down = true; if (e.button === 1) { pressed.mmb = true; e.preventDefault(); } if (e.button === 2) pressed.rmb = true; });
addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.down = false; });

// ---------- audio ----------
let AC = null, master = null, noiseBuf = null;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = S ? S.opts.vol : .5; master.connect(AC.destination); } catch (e) { AC = null; }
}
function setVol(v) { if (S) S.opts.vol = v; if (master) master.gain.value = v; }
function tone(f, d, type = 'square', v = .2, slide = 0, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02);
}
function noise(d, v = .3, f = 1000) {
  if (!AC) return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = noiseBuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f;
  const g = AC.createGain(), t = AC.currentTime; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + d + .02);
}
const sfxT = {};
function sfx(n) {
  if (!AC) return; const now = performance.now(); if (sfxT[n] && now - sfxT[n] < 45) return; sfxT[n] = now;
  switch (n) {
    case 'swing': noise(.08, .12, 2500); break;
    case 'shoot': tone(700, .08, 'triangle', .07, -300); break;
    case 'magic': tone(500, .15, 'sine', .1, 400); break;
    case 'hit': noise(.06, .16, 1500); tone(160, .06, 'square', .04, -60); break;
    case 'crit': noise(.1, .22, 3000); tone(900, .1, 'square', .05, -500); break;
    case 'kill': tone(300, .12, 'triangle', .09, -200); break;
    case 'hurt': tone(200, .2, 'sawtooth', .13, -120); noise(.15, .18, 800); break;
    case 'gold': tone(1200, .06, 'sine', .05); tone(1600, .08, 'sine', .04, 0, .05); break;
    case 'item': tone(600, .1, 'triangle', .1); tone(900, .15, 'triangle', .08, 0, .08); break;
    case 'legend': [523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'triangle', .12, 0, i * .09)); break;
    case 'lvl': [392, 523, 659, 784].forEach((f, i) => tone(f, .25, 'square', .07, 0, i * .1)); break;
    case 'boom': noise(.4, .35, 600); tone(90, .4, 'sine', .22, -50); break;
    case 'dodge': noise(.12, .09, 4000); break;
    case 'zap': tone(1500, .12, 'sawtooth', .05, -1200); break;
    case 'eshoot': tone(420, .05, 'square', .025, -150); break;
    case 'click': tone(800, .04, 'square', .04); break;
    case 'stairs': [300, 400, 500, 700].forEach((f, i) => tone(f, .2, 'sine', .1, 0, i * .07)); break;
    case 'boss': tone(70, 1.4, 'sawtooth', .18, -30); noise(1, .18, 300); break;
    case 'potion': tone(400, .2, 'sine', .1, 500); break;
    case 'shrine': [660, 880, 1100].forEach((f, i) => tone(f, .4, 'sine', .08, 0, i * .08)); break;
    case 'error': tone(150, .15, 'square', .06); break;
  }
}

// ---------- save ----------
const SAVE_KEY = 'embervale_save_v2', OLD_SAVE_KEY = 'embervale_save_v1';
let S = null, ST = {}, IID = 1;
function newSave(cls) {
  const z = () => new Array(NREG).fill(0), f = () => new Array(NREG).fill(false);
  const gems = {}; for (const g in GEMS) gems[g] = new Array(11).fill(0);
  return {
    v: 1, cls, lvl: 1, xp: 0, gold: 0, ore: 0, shards: 0, sp: 0, sk: {}, bind: [null, null, null, null], inv: [], invMax: 30,
    eq: { weapon: null, weapon2: null, helm: null, armor: null, gloves: null, boots: null, ring: null, amulet: null },
    diff: 0, maxDiff: 0, prog: [z(), z(), z(), z()], done: [f(), f(), f(), f()], abyssBest: [0, 0, 0, 0],
    quests: [], potMax: 3, potLvl: 0, pots: 3, shop: [], shopStale: true,
    stats: { kills: 0, elites: 0, bosses: 0, deaths: 0, time: 0, legend: 0, mythic: 0, pd: 0, maxCombo: 0, imps: 0, surges: 0, maxPlus: 0, barrels: 0, floors: 0, celestial: 0, trials: 0, gems: 0, cursed: 0, upgrades: 0, gemMax: 0 },
    para: { lvl: 0, xp: 0, pts: 0, n: {} }, gems, wm: {}, marks: 0, rested: 0, lastPlay: Date.now(), season: null, trials: { d: null, w: null },
    cos: { color: null, aura: 'none', title: 'kindled', pet: null, colors: [], auras: ['none'], pets: [], stitles: [] },
    ach: {}, story: {}, hints: {}, pages: [], frag: 0, best: {}, found: { w: {}, a: {}, u: {}, art: {}, r: {} }, boons: [], boonPend: 0, stash: [], stashMax: 40, last: null,
    opts: { vol: .5, quality: 'high', shake: true, nums: true, autoEq: false, autoSalv: 0, hints: true, labels: 0 },
  };
}
function migrateV1(s) {
  // v1 had 8 regions; map them into the new 12-region world
  const map = [0, 1, 2, 4, 5, 7, 9, 11];
  const z = () => new Array(NREG).fill(0), f = () => new Array(NREG).fill(false);
  const prog = [z(), z(), z(), z()], done = [f(), f(), f(), f()];
  for (let d = 0; d < 4; d++) for (let r = 0; r < 8; r++) {
    const nr = map[r], wasDone = s.done && s.done[d] && s.done[d][r];
    prog[d][nr] = wasDone ? BOSS_F : Math.min(BOSS_F, (s.prog && s.prog[d] ? s.prog[d][r] : 0));
    done[d][nr] = !!wasDone;
    if (wasDone) for (let k = 0; k < nr; k++) { done[d][k] = true; prog[d][k] = BOSS_F; }
  }
  s.prog = prog; s.done = done; s.v = 2;
  return s;
}
function fixSave(s) {
  if (!s.v || s.v < 2) s = migrateV1(s);
  const d = newSave(s.cls || 'warrior');
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  for (const k in d.opts) if (s.opts[k] === undefined) s.opts[k] = d.opts[k];
  if (s.opts.numMode === undefined) s.opts.numMode = s.opts.nums === false ? 2 : 0;
  if (s.opts.autoSalv === true) s.opts.autoSalv = 1; if (s.opts.autoSalv === false) s.opts.autoSalv = 0;
  for (const k of ['w', 'a', 'u', 'art', 'r']) if (!s.found[k]) s.found[k] = {};
  for (const k in d.cos) if (s.cos[k] === undefined) s.cos[k] = d.cos[k];
  for (const g in GEMS) if (!s.gems[g]) s.gems[g] = new Array(11).fill(0);
  const freed = s.done[0].filter(Boolean).length; if (s.boons.length + s.boonPend < freed) s.boonPend = freed - s.boons.length;
  for (let i = 0; i < 4; i++) { while (s.prog[i].length < NREG) s.prog[i].push(0); while (s.done[i].length < NREG) s.done[i].push(false); }
  for (const k in d.eq) if (s.eq[k] === undefined) s.eq[k] = null;
  for (const k in d.stats) if (s.stats[k] === undefined) s.stats[k] = 0;
  let mx = 0; const scan = it => { if (it && it.id > mx) mx = it.id; };
  s.inv.forEach(scan); Object.values(s.eq).forEach(scan); s.shop.forEach(scan); s.stash.forEach(scan); IID = mx + 1;
  return s;
}
let SLOT = +(localStorage.getItem('embervale_lastslot') || 0);
const slotKey = i => 'embervale_slot' + i;
function saveGame() { if (!S || S._temp) return; S.lastPlay = Date.now(); try { localStorage.setItem(slotKey(SLOT), JSON.stringify(S)); localStorage.setItem('embervale_lastslot', SLOT); } catch (e) { } }
function loadGame(slot = SLOT) {
  try {
    let d = localStorage.getItem(slotKey(slot));
    if (!d && slot === 0) d = localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY); // older single-save versions
    return d ? JSON.parse(d) : null;
  } catch (e) { return null; }
}
function deleteSlot(i) { localStorage.removeItem(slotKey(i)); if (i === 0) { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_SAVE_KEY); } }

// ---------- stats ----------
function itemStats(it) {
  const o = {}; const rm = RAR[it.r].m * (1 + .1 * (it.plus || 0));
  if (it.slot === 'weapon') o.wdmg = WT[it.t].dmg * Math.pow(1.15, it.il) * rm;
  else {
    const b = AT[it.t].base;
    for (const k in b) { let v = b[k]; if (k === 'hp') v *= Math.pow(1.11, it.il); if (k === 'mp') v *= Math.pow(1.03, it.il); o[k] = v * rm; }
  }
  for (const a of it.aff) o[a.k] = (o[a.k] || 0) + a.v * (1 + .05 * (it.plus || 0));
  if (it.sock) for (const g of it.sock) if (g) o[GEMS[g.g].st] = (o[GEMS[g.g].st] || 0) + gemVal(g.g, g.t);
  return o;
}
function buff(k) { return P && P.buffs[k] > 0; }
function calcStats() {
  const L = S.lvl;
  const s = { maxHp: 90 + 12 * L, maxMp: 45 + 3 * L, dmg: 0, critC: 5, critD: 50, atkSpd: 0, moveSpd: 0, hpPct: 0, regPct: 0, hpReg: .4 + .1 * L, mpReg: 0, ls: 0, cdr: 0, dr: 0, luck: 0, gold: 0, skill: 0, burn: 0, frz: 0, shk: 0, psn: 0, thorns: 0, xp: 0, elite: 0, hp: 0, mp: 0, surge: 0, combo: 0, u: {} };
  for (const sl of ['weapon', ...ARMOR_SLOTS]) {
    const it = S.eq[sl]; if (!it) continue;
    const o = itemStats(it);
    for (const k in o) { if (k === 'wdmg') continue; s[k] = (s[k] || 0) + o[k]; }
    if (it.u) s.u[it.u] = 1;
    if (it.u2) s.u[it.u2] = 1;
    if (it.art && sl === 'weapon') s.art = ARTI[it.art].sig;
  }
  s.maxHp += s.hp; s.maxMp += s.mp;
  const r = id => S.sk[id] || 0;
  s.maxHp *= 1 + .08 * r('vit'); s.dmg += 4 * r('brut'); s.dr += 2 * r('iron'); s.ls += .6 * r('blood'); s.critD += 10 * r('fury');
  s.moveSpd += 3 * r('swift'); s.critC += 2 * r('prec'); s.atkSpd += 4 * r('quick'); s.elite += 6 * r('deadeye'); s.luck += 10 * r('fortune'); s.gold += 10 * r('fortune');
  s.maxMp *= 1 + .1 * r('arcane'); s.mpReg += 10 * r('arcane');
  const el = 3 * r('elem'); s.burn += el; s.frz += el; s.shk += el; s.psn += el;
  s.cdr += 3 * r('focus'); s.skill += 8 * r('power');
  for (const b of S.boons || []) { const B = BOONS.find(x => x.k === b); if (B) B.f(s); }
  if (s.u.vamp) s.ls += 3;
  if (s.u.colossus) { s.maxHp *= 1.2; s.dr += 5; }
  if (s.u.kindled) s.surge += 60;
  const w = S.eq.weapon;
  s.wdmg = w ? itemStats(w).wdmg : 4; s.wt = w ? w.t : 'fists';
  if (WT[s.wt].crit) s.critC += WT[s.wt].crit * 100;
  if (typeof extraStats === 'function') extraStats(s);
  s.maxHp *= 1 + s.hpPct / 100; s.hpReg += s.maxHp * s.regPct / 100; if (typeof trule === 'function' && trule('fragile')) s.hpReg = 0;
  s.critC = Math.min(60, s.critC); s.cdr = Math.min(45, s.cdr); s.dr = Math.min(60, s.dr); s.moveSpd = Math.min(70, s.moveSpd); s.atkSpd = Math.min(100, s.atkSpd); s.ls = Math.min(8, s.ls); s.critD = Math.min(300, s.critD);
  s.maxHp = Math.round(s.maxHp); s.maxMp = Math.round(s.maxMp);
  ST = s;
}
function luckEff() { return ST.luck + (buff('fortune') ? 100 : 0) + (G.mod === 'elite' ? 50 : 0) + (G.mod === 'dark' ? 60 : 0); }
function goldEff() { return ST.gold + (buff('fortune') ? 100 : 0) + (G.mod === 'gild' ? 100 : 0); }
function pdmg() {
  let d = ST.wdmg * (1 + ST.dmg / 100) * (1 + .015 * (S.lvl - 1));
  if (buff('fury')) d *= 1.5;
  if (buff('berserk')) d *= 1 + (20 + 5 * (S.sk.berserk || 0)) / 100;
  if (buff('surge')) d *= 1.5;
  if (P) d *= 1 + comboBonus();
  return d;
}
function atkRate() { return 1 + ST.atkSpd / 100 + (ST.art === 'frenzy' ? .5 : 0) + (buff('haste') ? .35 : 0) + (buff('surge') ? .3 : 0) + (buff('berserk') ? (40 + 5 * (S.sk.berserk || 0)) / 100 : 0); }
function comboBonus() { return Math.min(.4, Math.floor(P.combo / 5) * .01) * (1 + ST.combo / 100); }
function xpNeed(L) { return Math.floor(35 * Math.pow(1.15, L - 1) + 15 * L); }

// ---------- items ----------
function rollRarity(minR = 0, bonus = 0) {
  const lm = 1 + luckEff() / 100 + bonus + S.diff * .15;
  const myth = (S.diff >= 2 || (G && G.abyss));
  const x = Math.random(); let r = 0;
  if (myth && x < .0025 * lm) r = 5;
  else if (x < .012 * lm) r = 4;
  else if (x < .05 * lm) r = 3;
  else if (x < .16 * lm) r = 2;
  else if (x < .42 * lm) r = 1;
  return Math.max(r, minR);
}
function genItem(il, o = {}) {
  const slot = o.slot || (Math.random() < .42 ? 'weapon' : pick(ARMOR_SLOTS));
  let r = o.r !== undefined ? o.r : rollRarity(o.minR || 0, o.bonus || 0);
  if (o.maxR !== undefined) r = Math.min(r, o.maxR);
  const t = slot === 'weapon' ? (o.t || pick(Object.keys(WT))) : slot;
  const it = { id: IID++, slot, t, r, il: Math.max(0, Math.round(il)), plus: 0, aff: [], u: null };
  rollAffixes(it);
  if (r >= 4) it.u = pick(slot === 'weapon' ? UNQ_W : UNQ_A);
  it.name = itemName(it);
  return it;
}
function rollAffixes(it) {
  it.aff = []; const pool = (it.slot === 'weapon' ? AFF_W : AFF_A).slice(); const n = RAR[it.r].aff; const used = {};
  for (let i = 0; i < n && pool.length; i++) {
    const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    if (used[k]) { i--; continue; } used[k] = 1;
    const A = AFF[k]; let v = rnd(A.min, A.max) * (1 + .12 * it.r); if (A.sc) v *= Math.pow(A.sc, it.il);
    it.aff.push({ k, v: v >= 100 ? Math.round(v) : Math.round(v * 10) / 10 });
  }
}
function baseName(it) { return it.slot === 'weapon' ? WT[it.t].n : AT[it.t].n; }
function itemName(it) {
  const b = baseName(it);
  if (it.art) return ARTI[it.art].n;
  if (it.r >= 4) return (it.r === 5 ? 'Mythic ' : it.r >= 7 ? RAR[it.r].n + ' ' : '') + UNQ[it.u].n + ' ' + b;
  return pick(PRE[it.r]) + ' ' + b + (it.aff.length ? ' ' + SUF[it.aff[0].k] : '');
}
function icon(it) { return it.slot === 'weapon' ? WT[it.t].ic : AT[it.t].ic; }
function itemVal(it) { return Math.round(6 * Math.pow(1.12, it.il) * Math.pow(it.r + 1, 1.6) * (1 + it.plus * .3)); }
function wDps(it) { if (!it) return 0; const w = WT[it.t]; return itemStats(it).wdmg / w.cd * (w.cnt ? 1.6 : 1); }

function genArtifact(key, il) {
  const A = ARTI[key];
  const it = { id: IID++, slot: 'weapon', t: A.t, r: 6, il: Math.max(0, Math.round(il)), plus: 0, aff: [], u: A.u, u2: A.u2, art: key };
  rollAffixes(it); it.name = A.n; return it;
}
// ---------- gear scoring: estimates overall character power with everything an item gives ----------
function powerScore() {
  const w = WT[ST.wt], aps = (1 / w.cd) * (1 + ST.atkSpd / 100 + (ST.art === 'frenzy' ? .5 : 0));
  const d = ST.wdmg * (1 + ST.dmg / 100) * (1 + .015 * (S.lvl - 1));
  let off = d * aps * (w.cnt ? 1.6 : 1) * (1 + Math.min(ST.critC, 100) / 100 * ST.critD / 100);
  off *= 1 + (ST.burn * .75 + ST.psn * .6 + ST.shk * .35 + ST.frz * .15) / 100;
  off *= (1 + ST.skill / 100 * .45) * (1 + ST.elite / 100 * .3) * (1 + ST.combo / 100 * .15) * (1 + ST.cdr / 100 * .4);
  const ranged = ['shot', 'orb', 'fan', 'boom'].includes(w.k);
  for (const u in ST.u) off *= 1 + (u === 'pierce' && !ranged ? 0 : (UVAL[u] || 0));
  if (ST.art) off *= 1.35;
  const ehp = ST.maxHp / (1 - ST.dr / 100) * (1 + ST.ls / 100 * 4 + ST.hpReg / ST.maxHp * 8 + ST.thorns / 100 * .05) * (ST.u.phoenix ? 1.15 : 1) * (ST.u.vamp ? 1.05 : 1);
  const util = 1 + ST.moveSpd / 100 * .3 + ST.luck / 100 * .08 + ST.gold / 100 * .03 + ST.xp / 100 * .15 + ST.surge / 100 * .1 + ST.mpReg / 100 * .05 + Math.min(.15, ST.maxMp / 3000);
  return Math.sqrt(off) * Math.sqrt(ehp) * util;
}
function scoreWith(slot, it) {
  const old = S.eq[slot], idx = S.inv.indexOf(it);
  S.eq[slot] = it; calcStats(); const sc = powerScore(); S.eq[slot] = old; calcStats();
  return sc;
}
function curScore() { calcStats(); return powerScore(); }
function gainPct(it) { const slot = it.slot === 'weapon' ? 'weapon' : it.slot; const a = scoreWith(slot, it), b = curScore(); return (a / b - 1) * 100; }

function hunterBonus(type) { const k = (S.best[type] && S.best[type].k) || 0; return k >= 500 ? .15 : k >= 100 ? .1 : k >= 25 ? .05 : 0; }
function noteFound(it) {
  const f = S.found; if (it.slot === 'weapon') f.w[it.t] = Math.max(f.w[it.t] || 0, 0) + 1; else f.a[it.t] = (f.a[it.t] || 0) + 1;
  f.r[it.t] = Math.max(f.r[it.t] ?? -1, it.r);
  if (it.u) f.u[it.u] = (f.u[it.u] || 0) + 1; if (it.u2) f.u[it.u2] = (f.u[it.u2] || 0) + 1;
  if (it.art && !f.art[it.art]) { f.art[it.art] = 1; toast(`📚 New Arsenal entry: <span style="color:#7ffcff">${it.name}</span>`); }
}
