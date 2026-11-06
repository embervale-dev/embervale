// ================= SPECIAL EFFECTS: rare-loot sparkle, weapon auras, crit sparks, level-up shockwaves, screen flashes, boss confetti, dodge afterimages =================
const FXF = document.createElement('div'); FXF.id = 'fxflash'; document.body.appendChild(FXF);
let fxT = null;
function screenFlash(col, strength = .25, edge = false) {
  if (!S || (S.opts && S.opts.fxflash === false)) return;
  FXF.style.transition = 'none'; FXF.style.background = edge ? `radial-gradient(ellipse at center, transparent 45%, ${col} 100%)` : `radial-gradient(ellipse at center, ${col} 0%, transparent 75%)`;
  FXF.style.opacity = strength; void FXF.offsetWidth; FXF.style.transition = 'opacity .7s ease-out'; clearTimeout(fxT); fxT = setTimeout(() => { FXF.style.opacity = 0; }, 60);
}
const spark = (x, y, col, n = 1, o = {}) => { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), sp = rnd(o.smin ?? 20, o.smax ?? 90); G.parts.push({ x: x + rnd(-(o.spread ?? 6), o.spread ?? 6), y: y + rnd(-(o.spread ?? 6), o.spread ?? 6), z: o.z ?? rnd(.2, .9), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: o.vz ?? rnd(.4, 1.8), g: o.g ?? -.5, life: o.life ?? .8, max: o.life ?? .8, col, size: o.size ?? rnd(2, 4) }); } };
// ---------- continuous effects ----------
let fxClock = 0;
{ const _uF = update; update = function (dt) { _uF(dt); if (!S || !P || G.mode !== 'play' || G.menu || G.frozen > 0) return; fxClock += dt;
  // rare loot on the ground glitters, the rarest orbit with motes
  for (const p of G.pick) { if (p.k !== 'item' || !p.it || p.it.r < 4) continue; const r = p.it.r, col = RAR[p.it.art ? 6 : r].c;
    if (Math.random() < (r >= 7 ? .55 : .25)) spark(p.x, p.y, col, 1, { spread: 14, smin: 5, smax: 25, vz: rnd(1, 2.6), g: -.2, life: 1.1, size: r >= 7 ? 4 : 3 });
    if (r >= 7) for (let k = 0; k < 3; k++) { const a = fxClock * 2.4 + k * 2.094, rr = 22 + 4 * Math.sin(fxClock * 3); G.parts.push({ x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr, z: .55 + .25 * Math.sin(fxClock * 4 + k), vx: 0, vy: 0, vz: 0, g: 0, life: .12, max: .12, col, size: 4 }); }
    if (r >= 9 && Math.random() < .02) { ringFx(p.x, p.y, 60, col, .6); } }
  // Ancient+ main-hand weapons: orbiting motes around you; Legendary/Mythic: a soft trail
  const w = S.eq.weapon; if (w && !G.inTown) { const r = w.r;
    if (r >= 7) { const col = RAR[r].c; for (let k = 0; k < 2; k++) { const a = -fxClock * 3 + k * Math.PI, rr = 30; G.parts.push({ x: P.x + Math.cos(a) * rr, y: P.y + Math.sin(a) * rr, z: .9 + .2 * Math.sin(fxClock * 5 + k), vx: 0, vy: 0, vz: 0, g: 0, life: .1, max: .1, col, size: 4.5 }); } if (r >= 10 && Math.random() < .2) spark(P.x, P.y, col, 1, { spread: 18, smax: 30, vz: 2, life: .7 }); }
    else if (r >= 4 && Math.random() < .12) spark(P.x, P.y, RAR[r].c, 1, { spread: 12, smax: 20, vz: 1.2, life: .6, size: 2.5 }); }
}; }
// ---------- crit sparks ----------
let critCd = 0;
{ const _heF = hurtEnemy; hurtEnemy = function (e, amt, o = {}) { const r = _heF(e, amt, o); if (o && o.crit && e && G.t > critCd) { critCd = G.t + .06; spark(e.x, e.y, '#ffe9a0', 7, { smin: 80, smax: 200, vz: rnd(1, 3), g: 3, life: .4, size: 2.5 }); spark(e.x, e.y, '#ffffff', 3, { smin: 60, smax: 160, life: .3, size: 2 }); } return r; }; }
// ---------- level-up shockwaves ----------
{ const _gxF = gainXP; gainXP = function (x) { const l0 = S.lvl; _gxF(x); if (S.lvl > l0 && P) { for (let i = 0; i < 3; i++) G.later.push({ t: i * .14, fn: () => ringFx(P.x, P.y, 90 + i * 60, '#ffe080', .55) }); for (let i = 0; i < 26; i++) G.parts.push({ x: P.x + rnd(-14, 14), y: P.y + rnd(-14, 14), z: rnd(0, .4), vx: 0, vy: 0, vz: rnd(3, 6), g: -1, life: 1.2, max: 1.2, col: i % 3 ? '#ffd27a' : '#fff6d0', size: rnd(3, 5) }); screenFlash('rgba(255,210,120,.6)', .28); } }; }
// ---------- rare drops: screen flash ----------
{ const _diF = dropItem; dropItem = function (it, x, y) { _diF(it, x, y); if (!it || G.tutorial) return; const r = it.art ? 6 : it.r; if (r >= 7 || it.art) screenFlash(RAR[r].c, .45); else if (r >= 4) screenFlash(RAR[r].c, .18); }; }
// ---------- Ember Surge & kill streaks: edge pulses ----------
{ const _usF = unleashSurge; unleashSurge = function () { const s0 = P.surge; _usF(); if (s0 >= 100) { screenFlash('rgba(255,140,40,.9)', .5); for (let i = 0; i < 4; i++) G.later.push({ t: i * .1, fn: () => ringFx(P.x, P.y, 120 + i * 80, i % 2 ? '#ffd27a' : '#ff8a2a', .6) }); } }; }
if (typeof killStreak === 'function') { const _ksF = killStreak; killStreak = function (e) { const n0 = typeof streakN !== 'undefined' ? streakN : 0; _ksF(e); if (typeof STREAKS !== 'undefined' && typeof streakN !== 'undefined' && streakN !== n0) { const s = STREAKS.find(x => x[0] === streakN); if (s) screenFlash(s[2], .35, true); } }; }
// ---------- guardian defeated: ember confetti ----------
{ const _bdF = bossDefeated; bossDefeated = function (e) { _bdF(e); const cols = ['#ffd27a', '#ff8a2a', '#fff6d0', '#ff5a3a']; for (let i = 0; i < 90; i++) { const a = rnd(0, 6.283), sp = rnd(60, 320); G.parts.push({ x: e.x, y: e.y, z: rnd(.5, 1.5), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(3, 8), g: 7, life: rnd(1.2, 2.2), max: 2.2, col: cols[i % 4], size: rnd(3, 6) }); } screenFlash('rgba(255,200,90,.8)', .4); }; }
// ---------- perfect dodge: cyan afterimage ----------
{ const _pdF = perfectDodge; perfectDodge = function () { const x = P.x, y = P.y; _pdF(); ringFx(x, y, 70, '#7affff', .45); spark(x, y, '#9affff', 14, { smin: 40, smax: 120, life: .5, size: 3 }); screenFlash('rgba(120,240,255,.7)', .2, true); }; }
// ---------- settings toggle ----------
{ const _stF = MENUS.settings; MENUS.settings = () => { const h = _stF(); if (!S) return h; const on = S.opts.fxflash !== false; return h.replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card">${ico('sparkle')} Screen flashes <span class="btn ${on ? 'on' : ''}" onclick="setOpt('fxflash',${!on})">${on ? 'On' : 'Off'}</span> <span class="dim">Colored flashes for rare drops, level-ups, Surge and streaks</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }; }
