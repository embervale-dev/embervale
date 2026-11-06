// ================= POLISH: music, controller, game feel, reports, tooltips =================
// ---------- procedural soundtrack ----------
const DOR = [0, 2, 3, 5, 7, 9, 10], AEO = [0, 2, 3, 5, 7, 8, 10], LYD = [0, 2, 4, 6, 7, 9, 11], PHR = [0, 1, 3, 5, 7, 8, 10], MIX = [0, 2, 4, 5, 7, 9, 10], ION = [0, 2, 4, 5, 7, 9, 11];
const THEMES = {
  title: { root: 220, mode: AEO, bpm: 56, arp: .22, lp: 900 }, town: { root: 261.6, mode: ION, bpm: 66, arp: .32, lp: 1600, prog: [0, 5, 3, 4] },
  r0: { root: 293.7, mode: DOR, bpm: 74, arp: .4, lp: 1500 }, r1: { root: 220, mode: AEO, bpm: 58, arp: .22, lp: 800 }, r2: { root: 329.6, mode: [0, 1, 4, 5, 7, 8, 10], bpm: 82, arp: .45, lp: 1400 },
  r3: { root: 246.9, mode: PHR, bpm: 62, arp: .25, lp: 700 }, r4: { root: 370, mode: LYD, bpm: 68, arp: .5, lp: 2600 }, r5: { root: 392, mode: [0, 2, 4, 6, 8, 10], bpm: 70, arp: .42, lp: 1500 },
  r6: { root: 311.1, mode: LYD, bpm: 64, arp: .45, lp: 1800 }, r7: { root: 261.6, mode: PHR, bpm: 90, arp: .3, lp: 1100, drums: 1 }, r8: { root: 293.7, mode: MIX, bpm: 100, arp: .55, lp: 1700, drums: 2 },
  r9: { root: 440, mode: LYD, bpm: 72, arp: .45, lp: 2600 }, r10: { root: 329.6, mode: LYD, bpm: 78, arp: .55, lp: 2400 }, r11: { root: 277.2, mode: [0, 1, 3, 4, 6, 8, 9], bpm: 60, arp: .25, lp: 650 },
  abyss: { root: 233, mode: PHR, bpm: 70, arp: .3, lp: 800, drums: 1 }, boss: { root: 220, mode: AEO, bpm: 126, arp: .6, lp: 1600, drums: 3 }, trial: { root: 246.9, mode: DOR, bpm: 112, arp: .55, lp: 1700, drums: 2 },
};
const MUS = { gain: null, theme: null, next: 0, step: 0, timer: null };
function musicVol() { return S && S.opts.mvol !== undefined ? S.opts.mvol : .3; }
function setMusicVol(v) { if (S) S.opts.mvol = v; if (MUS.gain && AC) MUS.gain.gain.setTargetAtTime(v * .55, AC.currentTime, .1); }
function wantTheme() {
  if (G.mode === 'title' || !S) return 'title';
  if (G.inTown || G.tutorial) return 'town';
  if (G.trial) return 'trial';
  if (G.boss) return 'boss';
  if (G.abyss) return 'abyss';
  return 'r' + G.region;
}
function mnote(f, t, dur, type, vol, lp, attack = .01) {
  const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = lp;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(fl); fl.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + dur + .05);
}
function mdrum(kind, t) {
  if (kind === 'kick') { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + .18); g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + .25); return; }
  if (!noiseBuf) return; const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1800;
  const g = AC.createGain(), v = kind === 'hat' ? .05 : .12, d = kind === 'hat' ? .05 : .14; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f); f.connect(g); g.connect(MUS.gain); s.start(t, Math.random() * .5); s.stop(t + d + .02);
}
function musicTick() {
  if (!AC || AC.state !== 'running') return;
  if (!MUS.gain) { MUS.gain = AC.createGain(); MUS.gain.gain.value = 0; MUS.gain.connect(AC.destination); MUS.next = AC.currentTime + .1; }
  const want = wantTheme();
  if (want !== MUS.theme) { MUS.gain.gain.cancelScheduledValues(AC.currentTime); MUS.gain.gain.setTargetAtTime(0, AC.currentTime, .25); if (!MUS.pend || MUS.pend.k !== want) MUS.pend = { k: want, at: AC.currentTime + .9 }; }
  if (MUS.pend && AC.currentTime >= MUS.pend.at) { MUS.theme = MUS.pend.k; MUS.pend = null; MUS.step = 0; MUS.next = AC.currentTime + .05; MUS.gain.gain.setTargetAtTime(musicVol() * .55, AC.currentTime, .6); }
  const T = THEMES[MUS.theme]; if (!T || MUS.pend) return;
  const e8 = 30 / T.bpm, prog = T.prog || [0, 3, 4, 5], md = T.mode, sc = (deg, oct = 0) => T.root * Math.pow(2, (md[((deg % md.length) + md.length) % md.length] + 12 * (oct + Math.floor(deg / md.length))) / 12);
  while (MUS.next < AC.currentTime + .25) {
    const s = MUS.step, t = MUS.next, ch = prog[Math.floor(s / 16) % prog.length];
    if (s % 16 === 0) for (const k of [0, 2, 4]) { mnote(sc(ch + k, -1), t, e8 * 16, 'triangle', .045, T.lp, 1.2); mnote(sc(ch + k, -1) * 1.004, t, e8 * 16, 'sine', .03, T.lp, 1.4); }
    if (s % 8 === 0) mnote(sc(ch, -2), t, e8 * 7, 'sine', .09, 500, .05);
    if (Math.random() < T.arp) mnote(sc(ch + pick([0, 2, 4, 7, 9]), Math.random() < .3 ? 1 : 0), t, e8 * 3, 'sine', .04, T.lp * 1.6, .005);
    if (T.drums) { if (s % (T.drums >= 2 ? 2 : 4) === 0) mdrum('kick', t); if (T.drums >= 2 && s % 2 === 1) mdrum('hat', t); if (T.drums >= 3 && s % 4 === 2) mdrum('snare', t); }
    MUS.step++; MUS.next += e8;
  }
}
setInterval(() => { try { musicTick(); } catch (e) { } }, 60);

// ---------- screen fades between areas ----------
const FADE = document.createElement('div'); FADE.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:8;transition:opacity .7s'; document.body.appendChild(FADE);
function fadeIn() { FADE.style.transition = 'none'; FADE.style.opacity = 1; void FADE.offsetWidth; FADE.style.transition = 'opacity .8s ease-out'; FADE.style.opacity = 0; }

// ---------- expedition report & death recap ----------
const DEATH_TIPS = ['Red circles and lines show where attacks will land — step out or dodge through them.', 'Roll through an attack at the last moment for a Perfect Dodge: time slows and your next hit crits.', 'Upgrade your gear at Brann the Blacksmith with Ember Ore.', 'Use ⚡ Auto-equip in your Inventory to wear your strongest gear.', 'Kill summoners and archers first — they make fights much harder.', 'Spend skill points (K) and Constellation stars (P) for big power boosts.', 'Potion Belt and Potion Potency upgrades at Orla make you far sturdier.', 'Turn on 🌿 Relaxed mode in Settings for a calmer adventure.', 'Replay earlier floors to level up before tough guardians.', 'Socket gems into Rare+ gear at Jeweler Sefa for extra stats.'];
const _enterFloorP = enterFloor;
enterFloor = function (reg, fl, depth) {
  const fromTown = G.inTown || !G.expd || G.tutorial;
  if (fromTown) G.expd = { t0: S.stats.time, kills: S.stats.kills, gold: S.gold, lvl: S.lvl, xp: 0, floors: 0, best: null, bosses: S.stats.bosses };
  _enterFloorP(reg, fl, depth); G.expd.floors++; fadeIn();
};
const _goTownP = goTown;
goTown = function () {
  const e = G.expd, died = G.mode === 'dead', killer = G.lastHitBy; G.expd = null;
  _goTownP(); fadeIn();
  if (e && S && (S.stats.kills - e.kills > 0 || e.floors > 1)) G.later.push({ t: .9, fn: () => { G.report = { ...e, died, killer, time: S.stats.time - e.t0, k: S.stats.kills - e.kills, g: S.gold - e.gold, lv: S.lvl - e.lvl, b: S.stats.bosses - e.bosses }; if (!G.menu) openMenu('report'); } });
};
const _gxP = gainXP; gainXP = function (x) { if (G.expd) G.expd.xp += x; _gxP(x); };
const _nfP = noteFound; noteFound = function (it) { if (G.expd && !G.inTown && (!G.expd.best || it.r > G.expd.best.r || (it.r === G.expd.best.r && it.il > G.expd.best.il))) G.expd.best = it; _nfP(it); };
MENUS.report = () => {
  const r = G.report; if (!r) return '';
  const row = (ic, n, v) => `<div class="card" style="text-align:center;padding:8px"><div style="font-size:24px">${ic}</div><b style="font-size:18px;color:#ffe2a8">${v}</b><div class="dim">${n}</div></div>`;
  return `<div class="title" style="min-width:560px"><h2>${r.died ? '💀 Expedition Ended' : '🏕 Expedition Report'}</h2>
  ${r.died ? `<div class="dim" style="margin-bottom:6px">You were slain${r.killer ? ` by <b style="color:#ff8a6a">${r.killer}</b>` : ''}. Your gear and progress are safe.</div>` : '<div class="dim" style="margin-bottom:6px">Welcome back to Haven. Your life and potions have been restored.</div>'}
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${row('⏱', 'time', fmtTime(r.time).replace('0h ', ''))}${row('🗺', 'floors', r.floors)}${row('⚔', 'foes slain', fmt(r.k))}${row('●', 'gold', (r.g >= 0 ? '+' : '') + fmt(r.g))}${row('✨', 'experience', fmt(r.xp))}${row('⬆', 'levels gained', r.lv)}${row('👑', 'guardians', r.b)}${row('🎒', 'bag space', `${S.inv.length}/${S.invMax}`)}</div>
  ${r.best ? `<div class="card">Best find: <span style="color:${RAR[r.best.r].c};font-weight:bold">${icon(r.best)} ${r.best.name}</span> <span class="dim">(${RAR[r.best.r].n}, item level ${r.best.il})</span></div>` : ''}
  ${r.died ? `<div class="card" style="font-size:13px">💡 ${pick(DEATH_TIPS)}</div>` : ''}
  ${S.inv.length >= S.invMax - 3 ? '<div class="dim" style="color:#ffb07a">Your bag is nearly full — sell or salvage at Orla or in your Inventory.</div>' : ''}
  <div class="btn bigb" onclick="closeMenu()">Continue</div></div>`;
};
const _deadMenu = MENUS.dead;
MENUS.dead = () => _deadMenu().replace('</p>', `</p>${G.lastHitBy ? `<div class="dim">Slain by <b style="color:#ff8a6a">${G.lastHitBy}</b></div>` : ''}<div class="card" style="max-width:520px;margin:8px auto;font-size:13px">💡 ${pick(DEATH_TIPS)}</div>`);
const _ebP = ebullet; ebullet = function (e, a, spd, o) { _ebP(e, a, spd, o); const b = G.eb[G.eb.length - 1]; if (b) b.src = e.d.n; };
const _hpP = hurtPlayer; hurtPlayer = function (a, src) { if (src && src.d) G.lastHitBy = src.d.n; return _hpP(a, src); };

const _stP = startTutorial; startTutorial = function () { _stP(); fadeIn(); };
// ---------- game feel: hit-stop ----------
const _heP = hurtEnemy;
hurtEnemy = function (e, amt, o = {}) {
  const was = !e.dead; _heP(e, amt, o);
  if (e.prop) return;
  if (o.crit && amt > e.maxHp * .2) G.hitstop = Math.max(G.hitstop || 0, .04);
  if (was && e.dead && (e.boss || e.elite)) G.hitstop = Math.max(G.hitstop || 0, e.boss ? .14 : .06);
};

// ---------- per-frame hooks ----------
let fpsAcc = 0, fpsN = 0, fpsWarned = false, fpsShow = 0;
const FPSEL = document.createElement('div'); FPSEL.style.cssText = 'position:fixed;right:220px;top:14px;z-index:4;font:bold 12px monospace;color:#9f9;text-shadow:0 0 3px #000;pointer-events:none;display:none'; document.body.appendChild(FPSEL);
const _updP = update;
update = function (dt) {
  if (G.mode === 'play' && !G.menu && S) {
    if (G.inTown && pressed.t) { openMenu('portal'); pressed = {}; return; }
    if (G.hitstop > 0) { G.hitstop -= dt; return; }
    if (!G.inTown) { fpsAcc += dt; fpsN++; if (!fpsWarned && fpsN > 240) { const fps = fpsN / fpsAcc; if (fps < 32 && quality() !== 'low') { fpsWarned = true; toast(`Running at ~${Math.round(fps)} FPS. For smoother play try ⚙ Settings → Graphics: ${quality() === 'high' ? 'Medium' : 'Low'}.`, '#ffd27a'); } if (fpsN > 600) { fpsAcc = 0; fpsN = 0; } } }
  }
  _updP(dt);
  fpsShow += dt; if (S && S.opts.fps) { FPSEL.style.display = 'block'; if (fpsShow > .5) { fpsShow = 0; FPSEL.textContent = Math.round(1 / Math.max(.001, dt)) + ' FPS'; } } else FPSEL.style.display = 'none';
};

// ---------- HUD hover tooltips ----------
function tipHTML(h, ev) { tip.innerHTML = `<div class="tc">${h}</div>`; tip.style.display = 'flex'; moveTip(ev); }
const _initHUDP = initHUD;
initHUD = function () {
  _initHUDP();
  const hov = (el, fn) => { if (!el) return; el.style.pointerEvents = 'auto'; el.onmouseenter = ev => { if (S && P) fn(ev); }; el.onmousemove = moveTip; el.onmouseleave = hideTip; };
  H.slots.forEach((el, i) => hov(el, ev => S.bind[i] ? tipSkill(S.bind[i], ev) : tipHTML(`<b>Empty skill slot [${'QERF'[i]}]</b><div class="dim">Learn skills in the Skill Tree (K) and bind them to Q / E / R / F.</div>`, ev)));
  hov(H.slv, ev => tipHTML(`<div class="tn" style="color:#ffb04a">🔥 Ember Surge [V]</div><div>${Math.floor(P.surge)}% charged</div><div class="dim">Fills as you fight (hits, kills, perfect dodges). At 100%, unleash a huge blast for 800% weapon damage, heal 30% and gain +50% damage & +30% attack speed for 8s.</div>`, ev));
  hov(H.slp, ev => tipHTML(`<div class="tn" style="color:#ff6a7a">🧪 Health Potion [1]</div><div>${S.pots} / ${S.potMax} left • heals ${40 + 5 * S.potLvl}% life</div><div class="dim">Refills in Haven. Buy more capacity and potency from Merchant Orla.</div>`, ev));
  hov(H.slw, ev => S.eq.weapon ? tipItem(S.eq.weapon.id, ev) : tipHTML('<b>Bare fists</b><div class="dim">Equip a weapon in your Inventory (I). Tab swaps main and off hand.</div>', ev));
  hov(document.querySelector('.globe.hp'), ev => tipHTML(`<div class="tn" style="color:#ff6a6a">❤ Life</div><div>${fmt(P.hp)} / ${fmt(ST.maxHp)}</div><div class="dim">Regen ${fmt(ST.hpReg)}/s • Damage reduction ${ST.dr.toFixed(1)}% • Life steal ${ST.ls.toFixed(1)}%</div>`, ev));
  hov(document.querySelector('.globe.mp'), ev => tipHTML(`<div class="tn" style="color:#7ab0ff">💧 Mana</div><div>${fmt(P.mp)} / ${fmt(ST.maxMp)}</div><div class="dim">Skills cost mana. Regenerates over time; blue orbs from foes restore 25%.</div>`, ev));
  // (XP bar tooltip lives in 6j_polish.js)
};

// ---------- settings additions ----------
const _setP = MENUS.settings;
MENUS.settings = () => {
  const o = S ? S.opts : {};
  return _setP().replace('<div class="card">Volume', `<div class="card">🎵 Music <input type="range" min="0" max="1" step="0.05" value="${musicVol()}" oninput="setMusicVol(+this.value)"></div><div class="card">🔊 Sound effects`)
    .replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card"><span class="dim">Mouse wheel zooms the camera in-game.</span><br>🎥 Camera follows your aim <span class="btn ${o.look !== false ? 'on' : ''}" onclick="setOpt('look',${o.look === false})">${o.look !== false ? 'On' : 'Off'}</span> &nbsp; Show FPS <span class="btn ${o.fps ? 'on' : ''}" onclick="setOpt('fps',${!o.fps})">${o.fps ? 'On' : 'Off'}</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`);
};
WIKI_TXT.controls = [
  ['Shortcuts', 'In Haven, press T to open the Waystone instantly. Hover your skill slots, potion, weapon, life and mana globes for details.'],
];
WIKI_TXT.world.push(['Expedition Report', 'When you return to Haven you get a summary of your trip: time, floors, foes slain, gold, experience, levels and your best find. If you fell, it shows what slew you and a tip.'], ['Music', 'Every region, Haven, trials and guardian fights have their own soundtrack. Adjust it under Settings → Music.']);
