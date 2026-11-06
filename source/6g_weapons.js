// ================= WEAPONS: signature arts, mastery, infusions, ratings, richer models =================
let ART_MUL = 1, IN_ATK = 0, ART = { n: 0, last: -9, heavy: 0, reso: 0, fist: 0, glaiveHits: 0 };
const _pdW = pdmg; pdmg = function () { return _pdW() * ART_MUL; };
function wArt() { return ST.wt; }
// mastery uses the existing 40-level weapon mastery (4b_long.js): the Art is empowered at Mastery 15
const ART_EMP = 15, W_GLOW = 40;
function artPow() { return wmLvl(ST.wt) >= ART_EMP ? 1.25 : 1; }
// ---------- attack hooks ----------
const _daW = doAttack;
doAttack = function () {
  const t = ST.wt, now = G.t, idle = now - ART.last; ART.last = now; ART_MUL = 1; ART.fin = 0;
  if (idle < (WT[t].cd / atkRate()) * 1.8 + .25) ART.n++; else ART.n = 1;
  const ap = artPow();
  if (t === 'sword' && ART.n % 3 === 0) { ART_MUL = 1 + .35 * ap; ART.fin = 1; }
  if (t === 'katana' && idle >= 1) { ART_MUL = 1 + .5 * ap; P.nextCrit = true; dmgText(P.x, P.y - 30, 'Quickdraw!', '#f0f4ff', true, 2); }
  if (t === 'rapier' && (P.ripo || 0) > 0) { P.ripo--; P.nextCrit = true; }
  if (t === 'fists' && ART.n % 5 === 0) { ART_MUL = 1 + 1.0 * ap; ART.fist = 1; }
  if (t === 'scythe' && (P.souls || 0) >= 10) { P.souls = 0; healP(ST.maxHp * .08 * ap); dmgText(P.x, P.y - 30, 'Soul Feast', '#c0a0ff', true, 2); burst(P.x, P.y, '#a89ad8', 20, 160, .6, 3, 1); }
  if (t === 'flail') P.mom = Math.min(5, ART.n - 1);
  if (t === 'xbow') ART.heavy = (ART.heavy + 1) % 4;
  if (t === 'staff') ART.reso = (ART.reso + 1) % 4;
  if (t === 'scepter') ART.dec = ((ART.dec || 0) + 1) % 5;
  if (t === 'tome') ART.storm = ((ART.storm || 0) + 1) % 4;
  IN_ATK = 1; ART.glaiveHits = 0;
  try { _daW(); } finally { IN_ATK = 0; ART_MUL = 1; ART.fist = 0; }
  if (t === 'glaive' && ART.glaiveHits >= 3) { healP(ST.maxHp * .02 * ap); burst(P.x, P.y, '#c0b0ff', 10, 120, .4, 3, 1); }
};
const _aoW = attackOnce;
attackOnce = function (w, a, base, giant) {
  const t = ST.wt, sw0 = G.swings.length, pp0 = G.pp.length; _aoW(w, a, base, giant);
  const inf = S.eq.weapon && S.eq.weapon.inf, ic = inf && INFUSE[inf].col;
  for (let i = sw0; i < G.swings.length; i++) { if (ic) G.swings[i].col = ic; if (ART.fin || ART.fist) { G.swings[i].r *= 1.15; G.swings[i].max = G.swings[i].t = .24; } }
  for (let i = pp0; i < G.pp.length; i++) { const b = G.pp[i]; b.atk = 1; b.wt = t; b.ox = b.x; b.oy = b.y; if (ic && !b.skill) b.col = ic;
    if (t === 'xbow' && ART.heavy === 0) { b.splash = 60; b.heavy = 1; b.r = 8; b.col = ic || '#ffb060'; }
    if (t === 'staff' && ART.reso === 0) { b.splash *= 2; b.dmg *= 1.5 * artPow(); b.r *= 1.5; b.reso = 1; }
    if (t === 'scepter' && ART.dec === 0) b.decree = 1; }
  const cs = Math.cos(a), sn = Math.sin(a);
  if (t === 'sword' && ART.fin) { pshot(a, { kind: 'wave', dmg: base * .4, spd: 640, pr: 999, life: .32, r: 18, col: ic || '#e8f0ff' }); const b = G.pp[G.pp.length - 1]; if (b) { b.atk = 1; b.wt = t; b.ox = b.x; b.oy = b.y; } dmgText(P.x, P.y - 30, 'Finisher!', '#e8f0ff', true, 2); }
  if (t === 'hammer' && ART.n % 3 === 0) { const r = w.rng * 1.5 * giant, cx = P.x + cs * w.rng * .55, cy = P.y + sn * w.rng * .55; G.later.push({ t: .12, fn: () => { IN_ATK = 1; try { aoe(cx, cy, r, base * .4 * artPow(), { kb: 260 }); } finally { IN_ATK = 0; } ringFx(cx, cy, r, ic || '#ffd27a', .45); shake(8); burst(cx, cy, '#c8b088', 26, 260, .6, 4, .1); } }); }
  if (t === 'tome' && ART.storm === 0) for (let k = 0; k < 6; k++) { pshot(a + (k - 2.5) * .35, { dmg: base, spd: 520, kind: 'page', life: 1.3, col: ic || '#ffe9a0', r: 6, home: 4 }); const b = G.pp[G.pp.length - 1]; if (b) { b.atk = 1; b.wt = t; } }
  if (t === 'fists' && ART.fist) { burst(P.x + cs * 40, P.y + sn * 40, '#ffd27a', 16, 220, .4, 3, 1); shake(5); dmgText(P.x, P.y - 30, 'Uppercut!', '#ffb070', true, 2); }
};
// ---------- per-hit effects ----------
const _hitW = hitE;
hitE = function (e, base, o = {}) {
  if (e.dead) return;
  const wb = o.wb, src = wb ? (wb.atk ? wb.wt : null) : (IN_ATK ? ST.wt : null);
  if (!src || e.prop) return _hitW(e, base, o);
  const ap = artPow(); let m = 1; const hp0 = e.hp;
  if (src === 'spear' && !wb && dist(P, e) > WT.spear.rng * .5) { m *= 1 + .35 * ap; o = { ...o, col: '#ffe9a0' }; }
  if (src === 'bow' && wb) m *= 1 + Math.min(.5 * ap, Math.hypot(e.x - wb.ox, e.y - wb.oy) / 800);
  if (src === 'chakram' && wb && wb.ret) m *= 1 + .4 * ap;
  if (src === 'fists' && ART.fist && !e.boss) o = { ...o, stun: .6, kb: 520 };
  if (src === 'hammer' && !wb && !e.boss) o = { ...o, stun: .5 };
  if (src === 'cannon' && wb) o = { ...o, burn: true };
  _hitW(e, base * m, o);
  if (src === 'glaive' && !wb) ART.glaiveHits++;
  if (src === 'dagger' && !e.dead) { e.bleedN = Math.min(5, (e.bleedN || 0) + 1); e.bleedT = 3; e.bleedD = Math.max(e.bleedD || 0, base * .08 * ap); }
  if (src === 'shuriken' && !e.dead) { e.mark = (e.mark || 0) + 1; if (e.mark >= 4) { e.mark = 0; const v = base * .7 * ap; G.later.push({ t: .05, fn: () => { if (!e.dead) { hurtEnemy(e, v, { noProc: true, col: '#ff5a8a' }); ringFx(e.x, e.y, 40, '#ff5a8a', .3); burst(e.x, e.y, '#ff5a8a', 14, 180, .4, 3, 1); sfx('crit'); } } }); } }
  if (src === 'wand' && wb && !wb.chain && Math.random() < .25 * ap) { const n = nearestEnemy(e.x, e.y, 180, e); if (n) { G.bolts.push({ x1: e.x, y1: e.y, x2: n.x, y2: n.y, t: .15 }); G.later.push({ t: .04, fn: () => { if (!n.dead) _hitW(n, base * .7, { noProc: true, col: '#ff8af0' }); } }); } }
  if (src === 'scepter' && wb && !e.dead) { e.shk = Math.max(e.shk, 2.5); if (wb.decree && !wb.decreeDone) { wb.decreeDone = 1; const x = e.x, y = e.y; G.bolts.push({ x1: x + 10, y1: y - 10, x2: x, y2: y, z1: 6, z2: .2, t: .2, w: 3 }); G.later.push({ t: .08, fn: () => { aoe(x, y, 70, base * .8 * ap, { noProc: true, kb: 90 }); ringFx(x, y, 70, '#fff0a0', .3); shake(4); sfx('boom'); } }); } }
  const inf = S.eq.weapon && S.eq.weapon.inf;
  if (inf && !e.dead && Math.random() < .2) {
    if (inf === 'fire') { e.burn = 3; e.burnD = Math.max(e.burnD, base * .3); }
    if (inf === 'frost') e.frz = Math.max(e.frz, e.boss ? .3 : .9);
    if (inf === 'storm') e.shk = Math.max(e.shk, 3);
    if (inf === 'venom') { e.psn = 3; e.psnD = Math.max(e.psnD, base * .3); }
    if (inf === 'holy') healP(ST.maxHp * .005);
  }
  if (e.dead && hp0 > 0) artKill(src, e);
};
function artKill(t, e) {
  if (e.type === 'dummy') return;
  if (t === 'scythe') { P.souls = Math.min(10, (P.souls || 0) + 1); P.soulT = 6; }
  if (t === 'axe') { P.blust = Math.min(5, (P.blust || 0) + 1); P.blustT = 5; }
}
const _arW = atkRate; atkRate = function () { let r = _arW(); if (!ST || !P) return r; if (ST.wt === 'axe' && P.blust > 0) r += .06 * P.blust * artPow(); if (ST.wt === 'flail' && P.mom > 0) r += .04 * P.mom * artPow(); return r; };
const _pdmW = pdmg; pdmg = function () { const d = _pdmW(); return ST.wt === 'scythe' && P && P.souls ? d * (1 + .03 * P.souls * artPow()) : d; };
const _ueW = updEnemy;
updEnemy = function (e, edt, dt) { if (e.bleedT > 0 && !e.dead) { e.bleedT -= dt; dot(e, e.bleedD * e.bleedN * dt, '#e03a3a', dt); if (e.bleedT <= 0) e.bleedN = 0; if (e.dead) return; } _ueW(e, edt, dt); };
const _upW = updPlayer;
updPlayer = function (dt) {
  const d0 = P.dodgeT; _upW(dt);
  if (d0 <= 0 && P.dodgeT > 0 && ST.wt === 'rapier') { P.ripo = 3; dmgText(P.x, P.y - 30, 'Riposte ready', '#e8eef8', false, 2); }
  if (P.soulT > 0) { P.soulT -= dt; if (P.soulT <= 0) P.souls = 0; }
  if (P.blustT > 0) { P.blustT -= dt; if (P.blustT <= 0) P.blust = 0; }
  if (ST.wt === 'flail' && G.t - ART.last > 1.2) P.mom = 0;
};
// ---------- art status in the buff bar ----------
const _uhW = updateHUD;
updateHUD = function (dt) {
  _uhW(dt); if (!S || !P || G.mode === 'title') return; const el = H['h-buffs']; if (!el) return;
  let h = ''; const B = (ic, n, col, tt) => h += `<div class="buff wart" title="${tt}" style="border-color:${col}">${ic}<span>${n}</span></div>`;
  if (ST.wt === 'scythe' && P.souls) B('👻', P.souls, '#a89ad8', `Souls: +${3 * P.souls}% damage${P.souls >= 10 ? ' — next swing heals' : ''}`);
  if (ST.wt === 'axe' && P.blust) B('🩸', P.blust, '#ff5a3a', `Bloodlust: +${6 * P.blust}% attack speed`);
  if (ST.wt === 'flail' && P.mom) B('🌀', P.mom, '#9a9aa8', `Momentum: +${4 * P.mom}% attack speed`);
  if (ST.wt === 'rapier' && P.ripo) B('🤺', P.ripo, '#e8eef8', 'Riposte: guaranteed crits');
  if (ST.wt === 'katana' && G.t - ART.last >= 1 && !G.inTown) B('🎋', '!', '#f0f4ff', 'Quickdraw ready: next swing crits for +50%');
  const old = el.querySelectorAll('.wart'); old.forEach(x => x.remove()); if (h) el.insertAdjacentHTML('beforeend', h);
};
// ---------- infusions at the forge ----------
function infCost() { return { ore: 12, sh: 60, g: Math.round(80 * Math.pow(1.12, Math.min(maxPw(), 120))) }; }
function doInfuse(k) {
  const it = S.eq.weapon; if (!it) { toast('Equip a weapon first', '#ff8a8a'); return; } const c = infCost();
  if (S.ore < c.ore || S.shards < c.sh || S.gold < c.g) { toast('Not enough materials', '#ff8a8a'); sfx('error'); return; }
  S.ore -= c.ore; S.shards -= c.sh; S.gold -= c.g; it.inf = k; R3.wtype = null; S.stats.infused = (S.stats.infused || 0) + 1;
  sfx('legend'); burst(P.x, P.y, INFUSE[k].col, 30, 200, .7, 3, 1); toast(`${INFUSE[k].ic} ${it.name} is now <b>${INFUSE[k].n}</b>!`, INFUSE[k].col); saveGame(); renderMenu();
}
{ const _smW = MENUS.smith; MENUS.smith = () => { const it = S.eq.weapon, c = infCost();
  return _smW() + `<h3>🔥 Elemental Infusion</h3><div class="dim">Bathe your main-hand weapon in an element. It glows with that element's color and its attacks gain a 20% chance to apply it. Re-infusing replaces the old element. Cost: ${c.ore} ◆ ore, ${c.sh} ✦ shards, ${fmt(c.g)} gold.</div>
  ${it ? `<div style="margin:4px 0">Weapon: <span style="color:${RAR[it.r].c}">${it.name}</span>${it.inf ? ` — currently <span style="color:${INFUSE[it.inf].col}">${INFUSE[it.inf].ic} ${INFUSE[it.inf].n}</span>` : ''}</div>${Object.keys(INFUSE).map(k => `<span class="btn ${it.inf === k ? 'on' : ''}" title="${INFUSE[k].d}" onclick="doInfuse('${k}')" style="border-color:${INFUSE[k].col}">${INFUSE[k].ic} ${INFUSE[k].n}</span>`).join('')}<div class="dim">${Object.keys(INFUSE).map(k => `${INFUSE[k].ic} ${INFUSE[k].d}`).join(' • ')}</div>` : '<div class="dim">Equip a weapon to infuse it.</div>'}`; }; }
// ---------- tooltips, arsenal, wiki ----------
function wBars(t) { const r = WROLE[t]; const bar = (n, v) => `<div style="display:flex;align-items:center;gap:6px;font-size:11px"><span style="width:76px;color:#aaa">${n}</span><span style="letter-spacing:1px;color:#ffd27a">${'■'.repeat(v)}<span style="color:#444">${'■'.repeat(5 - v)}</span></span></div>`;
  return `<div style="color:#ffd27a;font-size:12px;margin-top:3px">Role: <b>${r[0]}</b></div>${bar('Single target', r[1])}${bar('Crowds', r[2])}${bar('Reach', r[3])}${bar('Safety', r[4])}${bar('Speed', r[5])}`; }
function wArtHTML(t) { const l = wmLvl(t);
  return `<div style="color:#ffb05a;font-size:12px;margin-top:4px">◆ Art — <b>${WART[t][0]}</b>${l >= ART_EMP ? ' <span style="color:#7aff7a">(empowered)</span>' : ''}: ${WART[t][1]}</div><div class="dim" style="font-size:11px">${WT[t].n} Mastery ${l} / 40${l < ART_EMP ? ` — Art empowered (+25%) at Mastery ${ART_EMP}` : l < W_GLOW ? ` — weapon glows at Mastery ${W_GLOW}` : ' — Mastered ✔'}</div>`; }
const _itW = itemTip; itemTip = function (it, cmp) { let h = _itW(it, cmp); if (it.slot === 'weapon') { h += `<hr>${wBars(it.t)}${wArtHTML(it.t)}`; if (it.inf) h += `<div style="color:${INFUSE[it.inf].col};font-size:12px">${INFUSE[it.inf].ic} ${INFUSE[it.inf].n}: ${INFUSE[it.inf].d}</div>`; } return h; };
const _wdW = wDps; wDps = function (it) { if (!it) return 0; const w = WT[it.t]; return itemStats(it).wdmg / w.cd * (w.cnt ? Math.min(w.cnt, 2) * .8 : 1) * (w.splash ? 1.25 : 1); };
{ const _arsW = MENUS.arsenal; MENUS.arsenal = () => { const h = _arsW(); const rows = Object.keys(WT).map(t => `<div class="card" style="padding:6px 10px"><b>${WT[t].ic} ${WT[t].n}</b> <span class="dim">${WROLE[t][0]}</span>${wmLvl(t) >= ART_EMP ? ' <span style="color:#7aff7a;font-size:11px">Art empowered</span>' : ''}<div style="font-size:12px;color:#ffb05a">◆ ${WART[t][0]}: <span class="dim">${WART[t][1]}</span></div></div>`).join('');
  return h.replace('<h3>Weapons</h3>', `<h3>◆ Weapon Arts <span class="dim">every weapon type has a signature Art — empowered by 25% at Mastery ${ART_EMP}</span></h3><div class="regcards">${rows}</div><h3>Weapons</h3>`); }; }
// ---------- richer weapon models: rarity accents, infusion glow, mastery shine ----------
function makeWeaponFull(it) {
  const g = makeWeapon(it.t), r = it.r, inf = it.inf && INFUSE[it.inf], mastered = it.mast !== undefined ? !!it.mast : wmLvl(it.t) >= W_GLOW;
  const tip = { sword: .8, katana: .9, dagger: .38, axe: .82, hammer: .9, spear: 1.4, scythe: 1.05, flail: .72, fists: .08, bow: .1, xbow: .5, cannon: .58, staff: 0, wand: .44, tome: .13, chakram: .18, rapier: .9, glaive: 1, shuriken: .1, scepter: .6 }[it.t] ?? .5;
  const rc = RAR[r].c;
  if (r >= 2) { mk(GEO.oct, mat(rc, { em: 1.6 + r * .3, flat: true }), .035, .045, .035, -.02, 0, 0, g, false); }
  if (r >= 3) g.traverse(o => { if (o.isMesh && o.material && o.material.metalness > .5 && !o.material.emissiveIntensity) { o.material = o.material.clone(); o.material.emissive = new T3.Color(rc); o.material.emissiveIntensity = .12 + .06 * (r - 3); } });
  if (r >= 4 || inf || mastered) { const col = inf ? inf.col : mastered ? '#ffd27a' : rc; const glow = mk(GEO.sph, basic(col, { op: .35, add: 1 }), .09, .09, .09, tip, 0, 0, g, false); glow.userData.wglow = 1;
    if (it.t !== 'staff') { const line = mk(GEO.box, basic(col, { op: .3, add: 1 }), Math.max(.1, tip * .85), .012, .012, tip * .5, .03, 0, g, false); line.userData.wglow = 1; } }
  g.userData.fx = { col: inf ? inf.col : (r >= 4 || mastered) ? (mastered ? '#ffd27a' : rc) : null, tip };
  return g;
}
const _rpW = render3D;
render3D = function (dt) {
  if (R3 && R3.pl && S && S.eq) { const it = S.eq.weapon, key = it ? `${it.t}|${it.r}|${it.inf || ''}|${wmLvl(it.t) >= W_GLOW ? 1 : 0}` : ''; if (it && (R3.wkey !== key || R3.wpl !== R3.pl || R3.wtype !== it.t)) { R3.wkey = key; R3.wpl = R3.pl; R3.wtype = it.t; const hand = R3.pl.hand; while (hand.children.length) hand.remove(hand.children[0]); hand.add(makeWeaponFull(it)); R3.wfx = hand.children[0].userData.fx; } }
  _rpW(dt);
};
const _uWfx = update;
update = function (dt) {
  _uWfx(dt); const fx = R3 && R3.wfx; if (!fx || !fx.col || !P || G.mode !== 'play' || G.menu || G.inTown) return;
  if (Math.random() < (P.swingT > 0 ? .9 : .2)) { const a = P.swingT > 0 ? P.swingA + rnd(-.6, .6) : P.face, d = rnd(10, 18 + fx.tip * 30);
    G.parts.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, z: rnd(.6, 1.1), vx: rnd(-15, 15), vy: rnd(-15, 15), vz: rnd(.2, .8), g: 0, life: .45, max: .45, col: fx.col, size: P.swingT > 0 ? 4 : 2.5 }); }
};
// ---------- feats & wiki ----------
ACH.push(
  { id: 'art15', n: 'Art Unleashed', d: 'Reach Mastery 15 with any weapon to empower its Art', c: () => Math.max(0, ...Object.keys(S.wm).map(wmLvl)), need: 15, sp: 1 },
  { id: 'inf1', n: 'Elemental Smith', d: 'Infuse a weapon at the forge', c: () => S.stats.infused || 0, need: 1, sp: 0 },
);
WIKI_TXT.weapons = WIKI_TXT.weapons || [];
WIKI_TXT.weapons.push(
  ['Weapon Roles & Balance', 'Every weapon type has a role and five ratings shown in its tooltip: single target, crowds, reach, safety and speed. Weapons are balanced so none is strictly best: close-range weapons hit hardest, ranged weapons trade some damage for safety, and area weapons shine against packs. Rarity still matters as much as ever.'],
  ['Weapon Arts', 'Each of the 20 weapon types has a signature Art that changes how it plays — Sword finishers, Katana quickdraws, Dagger bleeds, Shuriken death marks, Heavy crossbow bolts and more. Hover a weapon or open the Arsenal to read them. Active Art stacks (Souls, Bloodlust, Momentum, Riposte, Quickdraw) appear in your buff bar.'],
  ['Weapon Mastery & Arts', 'Every kill raises the Mastery (up to 40) of the weapon type you are holding, for extra damage and crit damage. At Mastery 15 the weapon\'s Art is empowered by 25%, and at Mastery 40 the weapon glows gold. Track it in the Arsenal.'],
  ['Elemental Infusion', 'At Brann\'s forge you can infuse your main-hand weapon with Fire, Frost, Storm, Venom or Holy light. The weapon and its swings take that element\'s color, and attacks gain a 20% chance to apply it.'],
);
// ---------- more detailed base models for the plainest weapons ----------
{ const _mwW = makeWeapon;
  makeWeapon = function (t) {
    if (!['fists', 'wand', 'tome', 'dagger', 'bow'].includes(t)) return _mwW(t);
    const g = new T3.Group(), w = WT[t], metal = mat(w.col, { metal: .75, rough: .28 }), gold = mat('#d8b040', { metal: .9, rough: .25 }), grip = mat('#3a2418'), wood = mat('#6a4a2a');
    const X = (geo, m, l, r, x, y = 0, z = 0) => { const o = mk(geo, m, r, l, r, x, y, z, g); o.rotation.z = -Math.PI / 2; return o; };
    if (t === 'fists') { const steel = mat('#8a8a98', { metal: .85, rough: .3 }); mk(GEO.box, mat(w.col, { rough: .6 }), .14, .1, .12, .02, 0, 0, g); mk(GEO.box, steel, .06, .11, .13, .1, 0, 0, g); for (let i = 0; i < 3; i++) { const c = mk(GEO.coneL, steel, .022, .07, .022, .15, 0, -.04 + i * .04, g); c.rotation.z = -Math.PI / 2; } mk(GEO.cyl, gold, .07, .02, .07, -.06, 0, 0, g).rotation.z = Math.PI / 2; }
    if (t === 'wand') { X(GEO.cyl, mat('#4a2040', { rough: .5 }), .34, .018, .17); for (let i = 0; i < 4; i++) X(GEO.torThin, gold, .006, .024, .05 + i * .07); X(GEO.cyl, gold, .03, .03, .36); mk(GEO.oct, mat(w.col, { em: 2.6, flat: true }), .05, .08, .05, .44, 0, 0, g, false).rotation.z = -Math.PI / 2; for (const s of [-1, 1]) { const p = mk(GEO.coneL, gold, .012, .06, .012, .38, s * .03, 0, g); p.rotation.z = -Math.PI / 2 + s * .5; } }
    if (t === 'tome') { mk(GEO.box, mat('#7a2020', { rough: .7 }), .27, .08, .33, .12, 0, 0, g); mk(GEO.box, mat('#f0e0b0'), .25, .07, .3, .135, 0, 0, g); mk(GEO.box, mat('#5a1818'), .03, .085, .33, -.005, 0, 0, g); for (const z of [-.15, .15]) mk(GEO.box, gold, .27, .084, .025, .12, 0, z, g); mk(GEO.box, gold, .05, .09, .06, .25, 0, 0, g); mk(GEO.oct, mat(w.col, { em: 2.2 }), .045, .045, .045, .13, .07, 0, g, false); mk(GEO.oct, mat(w.col, { em: 1.4, op: .7 }), .025, .025, .025, .13, .22, .06, g, false); }
    if (t === 'dagger') { X(GEO.cyl, grip, .11, .024, .02); for (let i = 0; i < 3; i++) X(GEO.torThin, mat('#2a1a10'), .006, .026, -.01 + i * .035); mk(GEO.sph, gold, .03, .03, .03, -.05, 0, 0, g); mk(GEO.box, gold, .03, .025, .16, .08, 0, 0, g); const b = mk(GEO.cone, metal, .05, .32, .012, .25, 0, 0, g); b.rotation.z = -Math.PI / 2; mk(GEO.box, mat('#606070', { metal: .9 }), .2, .004, .006, .2, .006, 0, g, false); }
    if (t === 'bow') { const limb = mat('#5a3a20', { rough: .6 }); for (const s of [-1, 1]) { const l = mk(GEO.halfTor, limb, .45, .45, .45, .1, 0, 0, g); l.rotation.z = -Math.PI / 2; l.scale.z = .3; break; } mk(GEO.cyl, grip, .035, .14, .035, .1, 0, 0, g); for (const y of [-.4, .4]) mk(GEO.sphL, gold, .025, .025, .025, .1, y, 0, g, false); mk(GEO.box, mat('#eeeeee'), .004, .9, .004, .1, 0, 0, g, false); X(GEO.cylL, wood, .55, .008, .3); const head = mk(GEO.coneL, metal, .02, .06, .02, .58, 0, 0, g); head.rotation.z = -Math.PI / 2; for (const s of [-1, 1]) { const f = mk(GEO.box, mat('#c83a2a'), .06, .03, .003, .07, s * .015, 0, g, false); f.rotation.z = s * .4; } }
    return g;
  }; }
