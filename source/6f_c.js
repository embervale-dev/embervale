// ================= FEATURE PACK C: Haven requests, Gauntlet, Invasion, loadouts, key binds, log, minimap zoom =================
const BUFF_D = { fury: 'Fury: +50% damage', haste: 'Haste: faster attacks and movement', fortune: 'Fortune: +100% gold found', wisdom: 'Wisdom: bonus experience', aegis: 'Aegis: take less damage', berserk: 'Berserk: more damage at low life', regen: 'Regeneration: restoring life', windrun: 'Windrun: much faster movement', surge: 'Ember Surge: empowered', echo: 'Echoes: skills recharge twice as fast', sanguine: 'Blood: heal 5% of damage dealt', tempest: 'Storms: lightning strikes nearby foes', plenty: 'Plenty: foes drop double gold', warcry: 'War Cry: bonus damage' };
function miniS() { return S && S.opts.mz ? 2 : 3; }
// ---------- minimap zoom ----------
{ const mc = $('mini'); if (mc) mc.addEventListener('mousedown', e => { e.stopPropagation(); if (!S) return; S.opts.mz = !S.opts.mz; sfx('click'); toast(ico('map') + (S.opts.mz ? ' Minimap: wide view' : ' Minimap: close view')); }); }

// one dedicated, self-updating HUD line per live status (never appended to)
function hudLine(id) { let el = $(id); if (!el) { const tl = $('h-tl'); if (!tl) return null; el = document.createElement('div'); el.id = id; el.className = 'hline'; tl.appendChild(el); } return el; }
// ---------- message log ----------
G.log = [];
function logPush(html, col) { const t = S ? fmtClock(S.stats.time) : ''; G.log.push({ h: html, col: col || '#d8c8a8', t }); if (G.log.length > 150) G.log.shift(); }
function fmtClock(s) { s = Math.floor(s || 0); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
const _toastC = toast; toast = function (msg, col) { const k = plain(msg).slice(0, 24); const dup = G.msgT[k] && G.t - G.msgT[k] < 1.2; _toastC(msg, col); if (!dup) logPush(msg, col); };
const _feedC = feed; feed = function (html, col) { _feedC(html, col); logPush(html, col); };
const _banC = banner; banner = function (a, b, col) { _banC(a, b, col); logPush(`<b>${a}</b> — ${b || ''}`, col || '#ffd27a'); };
MENUS.log = () => `<h2>${ico('notebook')} Message Log <span class="dim">last ${G.log.length} messages this session</span></h2><div class="dim">Every notice, find and announcement, so you never miss anything that flashed by mid-fight.</div>
  <div style="max-height:62vh;overflow:auto;min-width:640px;margin-top:6px">${G.log.length ? G.log.slice().reverse().map(l => `<div class="logl" style="border-left-color:${l.col}"><i>${l.t}</i>${l.h}</div>`).join('') : '<div class="dim">Nothing yet.</div>'}</div>
  <span class="btn" onclick="G.log=[];renderMenu()">Clear</span><span class="btn" onclick="openMenu('pause')">Back</span>`;
HUB.push(['log', ico('notebook'), 'Message Log', 'Everything that happened', '']);

// ---------- key rebinding ----------
const KB_ACT = [['s0', 'Skill slot 1', 'q'], ['s1', 'Skill slot 2', 'e'], ['s2', 'Skill slot 3', 'r'], ['s3', 'Skill slot 4', 'f'], ['pot', 'Drink potion', '1'], ['surge', 'Ember Surge', 'v'], ['dodge', 'Dodge roll', ' '], ['swap', 'Swap weapons', 'x'], ['tp', 'Town portal', 't']];
const KB_RESERVED = ['escape', 'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'i', 'c', 'k', 'm', 'j', 'o', 'l', 'b', 'n', 'h', 'p', 'y', 'g', 'u', 'enter', 'meta'];
function kbKey(id) { const a = KB_ACT.find(x => x[0] === id); return (S && S.opts.kb && S.opts.kb[id]) || a[2]; }
function kbName(k) { return k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k[0].toUpperCase() + k.slice(1); }
function kbSet(id, k) {
  S.opts.kb = S.opts.kb || {}; const old = kbKey(id), other = KB_ACT.find(a => a[0] !== id && kbKey(a[0]) === k);
  if (other) S.opts.kb[other[0]] = old; S.opts.kb[id] = k;
  for (const a of KB_ACT) if (S.opts.kb[a[0]] === a[2]) delete S.opts.kb[a[0]];
  saveGame();
}
function kbReset() { S.opts.kb = {}; saveGame(); renderMenu(); toast('Controls reset to defaults'); }
function kbStart(id) { G.rebind = id; renderMenu(); }
const _onKeyC = onKey;
onKey = function (k, e) {
  if (G.rebind) {
    const id = G.rebind; if (k === 'escape') { G.rebind = null; renderMenu(); return; }
    if (KB_RESERVED.includes(k)) { toast(`${kbName(k)} is used for movement or menus — pick another key`, '#ff8a8a'); sfx('error'); return; }
    kbSet(id, k); G.rebind = null; sfx('click'); renderMenu(); return;
  }
  return _onKeyC(k, e);
};
function kbTranslate() {
  const kb = S && S.opts.kb; if (!kb || !Object.keys(kb).length) return;
  const src = pressed, out = {};
  const moved = KB_ACT.filter(a => kb[a[0]] && kb[a[0]] !== a[2]);
  for (const k in src) out[k] = src[k];
  for (const a of moved) { delete out[a[2]]; delete out[kb[a[0]]]; }
  for (const a of moved) if (src[kb[a[0]]]) out[a[2]] = true;
  pressed = out;
}
{ const _stC = MENUS.settings; MENUS.settings = () => { const h = _stC(); if (!S) return h;
  const rows = KB_ACT.map(([id, n]) => `<span style="display:inline-block;margin:2px 8px 2px 0">${n} <span class="btn kbb ${G.rebind === id ? 'on' : ''}" onclick="kbStart('${id}')">${G.rebind === id ? 'press a key…' : kbName(kbKey(id))}</span></span>`).join('');
  return h.replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card">${ico('keyboard')} <b>Controls</b> <span class="dim">Click a button, then press the new key (Esc cancels). Movement (WASD / arrows) and menu keys can't be reassigned.</span><div>${rows}</div><span class="btn" onclick="kbReset()">Reset to defaults</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }; }
let kbShown = '';
function kbHudLabels() { const sig = ['s0', 's1', 's2', 's3'].map(kbKey).join('|'); if (sig === kbShown) return; kbShown = sig; for (let i = 0; i < 4; i++) { const el = document.querySelector(`#sl${i} .key`); if (el) el.textContent = kbName(kbKey('s' + i)); } }

// ---------- Haven requests (villager side quests) ----------
function sqState() { if (!S.sq) S.sq = { act: {}, done: {}, items: {} }; return S.sq; }
function sqFor(who) { const st = sqState(); const act = SIDEQ.find(q => q.who === who && st.act[q.id]); if (act) return act; return SIDEQ.find(q => q.who === who && !st.done[q.id] && (!q.after || st.done[q.after])); }
function plural(n) { return /f$/.test(n) ? n.slice(0, -1) + 'ves' : /(s|x|ch|sh)$/.test(n) ? n + 'es' : /[^aeiou]y$/.test(n) ? n.slice(0, -1) + 'ies' : n + 's'; }
function sqProg(q) {
  const st = sqState(), a = st.act[q.id]; if (!a) return 0; const g = q.goal;
  if (g.k === 'kill') return Math.min(g.n, ((S.best[g.t] && S.best[g.t].k) || 0) - a.base);
  if (g.k === 'find') return Math.min(g.n, st.items[q.id] || 0);
  if (g.k === 'pages') return Math.min(g.n, S.pages.length - a.base + (S.pages.length >= PAGES.length ? g.n : 0));
  return 0;
}
function sqGoalTxt(q) { const g = q.goal; return g.k === 'kill' ? `Slay ${g.n} ${g.t in BOSS ? BOSS[g.t].n : g.n > 1 ? plural(EN[g.t].n) : EN[g.t].n}` : g.k === 'find' ? `Find ${g.n > 1 ? g.n + '× ' : ''}${g.item} (${REG[g.reg].n})` : `Find ${g.n} Lost Pages`; }
function sqRewardTxt(rw) { return [rw.marks && `${ico('marks')} ${rw.marks} Marks`, rw.gold && `<span class="gold">● ${fmt(Math.round(rw.gold * Math.pow(1.1, Math.min(maxPw(), 100))))} gold</span>`, rw.gems && `${ico('gem')} ${rw.gems} gems`, rw.frag && `✧ ${rw.frag} Fragments`, rw.title && `${ico('crown')} title "${rw.title}"`, rw.color && `${ico('palette')} a new color`].filter(Boolean).join(' • '); }
function sqAccept(q) { const st = sqState(), g = q.goal; st.act[q.id] = { base: g.k === 'kill' ? ((S.best[g.t] && S.best[g.t].k) || 0) : g.k === 'pages' ? S.pages.length : 0 }; st.items[q.id] = 0; toast(`${ico('haven')} New Haven request: <b>${q.t}</b> — ${sqGoalTxt(q)}`, '#9ad0ff'); sfx('shrine'); saveGame(); }
function sqTurnIn(q) {
  const st = sqState(), rw = q.rw; delete st.act[q.id]; st.done[q.id] = 1; S.stats.sidequests = (S.stats.sidequests || 0) + 1;
  if (rw.marks) S.marks += rw.marks; if (rw.gold) S.gold += Math.round(rw.gold * Math.pow(1.1, Math.min(maxPw(), 100)));
  if (rw.gems) for (let i = 0; i < rw.gems; i++) addGem(pick2(Object.keys(GEMS)), gemTier()); if (rw.frag) S.frag += rw.frag;
  if (rw.title && !S.cos.stitles.includes(rw.title)) S.cos.stitles.push(rw.title); if (rw.color && !S.cos.colors.includes(rw.color)) S.cos.colors.push(rw.color);
  banner('Request Complete!', `${q.t} — ${sqRewardTxt(rw)}`, '#9ad0ff'); sfx('legend'); saveGame();
}
SPK.vill = { n: 'Villager', ic: ico('person'), col: '#9ad0ff' };
function talkVillager(v) {
  SPK.vill = { n: v.n, ic: v.rescued ? ico('person') : ico('haven'), col: '#9ad0ff' }; v.face = ang(v, P); v.wt = 4;
  const q = v.rescued ? null : sqFor(v.n), st = sqState();
  if (!q) { startDialog([['vill', pick(v.lines)]]); return; }
  if (!st.act[q.id]) { startDialog([['vill', q.give], ['you', `(${sqGoalTxt(q)} • Reward: ${sqRewardTxt(q.rw)})`]], () => sqAccept(q)); return; }
  if (sqProg(q) >= q.goal.n) { startDialog([['vill', q.done]], () => sqTurnIn(q)); return; }
  startDialog([['vill', `Any luck with "${q.t}"? (${sqProg(q)} / ${q.goal.n})`]]);
}
function nearVillager() { let best = null, bd = 64; for (const v of G.vill || []) { const d = dist(v, P); if (d < bd) { bd = d; best = v; } } return best; }
// quest items in dungeons
const _popC = populate;
populate = function (R) {
  _popC(R); G.qit = [];
  if (!G.trial && !G.tutorial && invaded()) spawnInvaders();
  if (G.trial || G.tutorial || G.abyss || !S.sq) return;
  for (const q of SIDEQ) { const g = q.goal; if (g.k !== 'find' || !S.sq.act[q.id] || g.reg !== G.region || sqProg(q) >= g.n) continue;
    const n = Math.min(g.n - sqProg(q), g.n > 1 ? 2 : 1); if (Math.random() < (g.n > 1 ? .8 : .45)) for (let i = 0; i < n; i++) { const p = spotM(); if (p) G.qit.push({ ...p, q: q.id, n: g.item }); } }
};
const _rlC = resetLevel; resetLevel = function () { _rlC(); G.qit = []; G.gauntlet = GA_NEXT; GA_NEXT = null; };

// ---------- Guardian Gauntlet ----------
let GA_NEXT = null;
function gaCleared() { return REG.map((r, i) => S.done[S.diff][i] ? r.boss : null).filter(Boolean); }
function startGauntlet() {
  const pool = gaCleared(); if (pool.length < 3) { toast('Defeat 3 guardians on this difficulty to unlock the Gauntlet', '#ff8a8a'); sfx('error'); return; }
  const list = []; const p2 = pool.slice(); while (list.length < 3) list.push(p2.splice(ri(0, p2.length - 1), 1)[0]);
  const ri_ = k => REG.findIndex(r => r.boss === k); list.sort((a, b) => ri_(a) - ri_(b));
  const reg = ri_(list[0]); GA_NEXT = { list, i: 0, t0: S.stats.time }; closeMenu();
  enterFloor(reg, BOSS_F); toast(`${ico('swords')} Guardian Gauntlet: ${list.map(k => BOSS[k].n.split(',')[0]).join(' → ')}`, '#ff8a6a');
}
const _cpC = calcPw; calcPw = function () { return _cpC() + (GA_NEXT || G.gauntlet ? 4 : 0); };
const _bdC = bossDefeated;
bossDefeated = function (e) {
  _bdC(e); const ga = G.gauntlet; if (!ga) return;
  if (ga.i < 2) { G.exit = null; ga.i++; const k = ga.list[ga.i]; banner(`Gauntlet ${ga.i + 1} / 3`, `${BOSS[k].n} approaches...`, '#ff8a6a');
    G.later.push({ t: 4, fn: () => { if (G.gauntlet !== ga || P.hp <= 0) return; G.boss = mkBoss(k, 20.5 * TILE, 11 * TILE); sfx('boss'); shake(10); P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * .25); toast(ico('heart') + ' You catch your breath (+25% life)', '#7aff9a'); } }); return; }
  const secs = Math.round(S.stats.time - ga.t0); S.stats.gauntlets = (S.stats.gauntlets || 0) + 1; if (!S.stats.gaBest || secs < S.stats.gaBest) S.stats.gaBest = secs;
  S.marks += 60; S.frag += 3; dropItem(genItem(G.pw + 2, { r: 4 }), e.x, e.y); dropItem(genItem(G.pw + 2, { minR: 3 }), e.x, e.y); dropGem(e.x, e.y); dropGem(e.x, e.y);
  banner('Gauntlet Conquered!', `Three guardians in ${Math.floor(secs / 60)}m ${secs % 60}s • +60 Marks, 3 Fragments, a Legendary and an Epic+`, '#ffd27a'); G.gauntlet = null; saveGame();
};

// ---------- Weekly Invasion ----------
function invReg() { return weekId() % NREG; }
function invState() { const w = weekId(); if (!S.invasion || S.invasion.w !== w) S.invasion = { w, k: 0, claimed: false }; return S.invasion; }
function invaded() { return !G.abyss && !G.inTown && !G.trial && !G.tutorial && G.region === invReg(); }
function spawnInvaders() {
  const from = REG[(invReg() + 6) % NREG].en.filter(k => EN[k] && EN[k].ai !== 'prop'), n = ri(3, 5);
  for (let i = 0; i < n; i++) { const p = spotM(); if (!p) continue; const e = mkEnemy(pick(from), p.x, p.y, { elite: true }); if (e) e.invader = 1; }
  G.later.push({ t: 2.5, fn: () => toast(`${ico('warn')} Invasion! Foes from ${REG[(invReg() + 6) % NREG].n} roam this floor (+50% XP & gold here this week)`, '#ff8a6a') });
}
const _xsC = extraStats; extraStats = function (s) { _xsC(s); if (G && M && invaded()) { s.xp += 50; s.gold += 50; } };
const _efC = enterFloor; enterFloor = function (r, f, d) { _efC(r, f, d); calcStats(); };
const _kC = killEnemy;
killEnemy = function (e) { if (e.dead) return; _kC(e); if (e.invader) { const st = invState(); st.k++; S.marks += 2; S.stats.invaders = (S.stats.invaders || 0) + 1; if (st.k === 30) toast(ico('swords') + ' Invasion repelled! Claim your reward at the Waystone', '#ffd27a'); } };
function claimInvasion() { const st = invState(); if (st.k < 30 || st.claimed) return; st.claimed = true; S.marks += 80; const it = genItem(maxPw() + 2, { r: 4 }); it.isNew = true; if (S.inv.length < S.invMax) S.inv.push(it); else S.stash.push(it); noteFound(it); addGem(pick2(Object.keys(GEMS)), gemTier()); sfx('legend'); toast(ico('trophy') + ' Invasion reward: 80 Marks, a Legendary and a gem!', '#ffd27a'); saveGame(); renderMenu(); }
{ const _ptC = MENUS.portal; MENUS.portal = () => {
  const h = _ptC(), st = invState(), ir = invReg(), ok = gaCleared().length >= 3;
  const inv = `<div class="card" style="border-color:#ff6a4a"><b style="font-family:Georgia;font-size:16px;color:#ff8a6a">${ico('warn')} Weekly Invasion</b> <span class="dim">ends in ${untilStr(nextWeek())}</span><div>Foes from ${REG[(ir + 6) % NREG].n} have invaded <b>${REG[ir].n}</b>. All floors there give <b>+50% XP and gold</b>, and elite invaders roam each floor (+2 Marks each).</div>
    <div class="qbar"><div style="width:${Math.min(100, st.k / 30 * 100)}%"></div></div><span class="dim">Invaders slain: ${Math.min(st.k, 30)} / 30 — reward: ${ico('marks')} 80 Marks, a Legendary and a gem</span><br>${st.claimed ? `<span class="dim">Reward claimed ${ico('check')}</span>` : `<span class="btn ${st.k >= 30 ? '' : 'dis'}" onclick="claimInvasion()">Claim</span>`}</div>`;
  const ga = `<div class="card" style="border-color:#ffb04a"><b style="font-family:Georgia;font-size:16px;color:#ffc070">${ico('swords')} Guardian Gauntlet</b><div>Fight three guardians you've already beaten, back to back, a little stronger than usual. You recover 25% life between fights.</div><div class="dim">Reward: ${ico('marks')} 60 Marks, 3 Celestial Fragments, 2 Legendaries and gems.${S.stats.gauntlets ? ` Completed ${S.stats.gauntlets}× • best ${Math.floor(S.stats.gaBest / 60)}m ${S.stats.gaBest % 60}s` : ''}</div>
    <span class="btn ${ok ? '' : 'dis'}" onclick="startGauntlet()">${ok ? 'Begin the Gauntlet' : `Defeat ${3 - gaCleared().length} more guardian(s) on this difficulty`}</span></div>`;
  return h.replace('<h3>Regions</h3>', `<h3>Challenges</h3><div class="regcards">${inv}${ga}</div><h3>Regions</h3>`);
}; }

// ---------- gear loadouts ----------
function loSave(i) { S.lo = S.lo || []; const eq = {}; for (const sl of SLOTS) eq[sl] = S.eq[sl] ? S.eq[sl].id : null; S.lo[i] = { eq, bind: S.bind.slice(), n: (S.lo[i] && S.lo[i].n) || `Loadout ${i + 1}` }; sfx('click'); toast(`${ico('save')} Saved ${S.lo[i].n}`); saveGame(); renderMenu(); }
function loLoad(i) {
  const L = S.lo && S.lo[i]; if (!L) return; let miss = 0;
  const freed = []; for (const sl of SLOTS) if (S.eq[sl]) { freed.push(S.eq[sl]); S.eq[sl] = null; }
  for (const sl of SLOTS) { const id = L.eq[sl]; if (!id) continue;
    let k = freed.findIndex(x => x.id === id); if (k >= 0) { S.eq[sl] = freed.splice(k, 1)[0]; continue; }
    k = S.inv.findIndex(x => x.id === id); if (k >= 0) { S.eq[sl] = S.inv.splice(k, 1)[0]; continue; }
    k = S.stash.findIndex(x => x.id === id); if (k >= 0) { S.eq[sl] = S.stash.splice(k, 1)[0]; continue; }
    miss++; }
  for (const it of freed) (S.inv.length < S.invMax ? S.inv : S.stash).push(it);
  S.bind = L.bind.map(b => b && S.sk[b] ? b : null); while (S.bind.length < 4) S.bind.push(null);
  afterGear(); sfx('click'); toast(`${ico('loadout')} Equipped ${L.n}${miss ? ` (${miss} item${miss > 1 ? 's' : ''} no longer owned)` : ''}`); saveGame(); renderMenu();
}
{ const _ivC = MENUS.inv; MENUS.inv = () => { const lo = S.lo || [];
  return _ivC() + `<div class="card" style="margin-top:6px">${ico('loadout')} <b>Loadouts</b> <span class="dim">Save your current gear and skill bar, and swap back in one click.</span><br>${[0, 1, 2].map(i => `<span style="display:inline-block;margin-right:12px">${lo[i] ? `<span class="btn" onclick="loLoad(${i})">Wear ${lo[i].n}</span>` : `<span class="dim">Slot ${i + 1} empty</span>`}<span class="btn" style="font-size:12px" onclick="loSave(${i})">${ico('save')} Save</span></span>`).join('')}</div>`; }; }

// ---------- per-frame: talk, quest items, key translation ----------
const _uC = update;
update = function (dt) {
  if (G.mode === 'play' && !G.menu && S) {
    const rawE = pressed.e; kbTranslate();
    if (G.inTown && rawE) { const v = nearVillager(); if (v) { pressed.e = false; talkVillager(v); } }
  }
  _uC(dt);
  if (G.mode !== 'play' || G.menu || !S || !P || G.inTown) return;
  for (const q of G.qit || []) if (!q.got && dist(P, q) < 44) { q.got = true; const st = sqState(); st.items[q.q] = (st.items[q.q] || 0) + 1; const Q = SIDEQ.find(x => x.id === q.q); sfx('legend'); burst(q.x, q.y, '#9ad0ff', 24, 160, .7, 3, 1); toast(`${ico('haven')} Found <b>${q.n}</b> (${sqProg(Q)} / ${Q.goal.n}) — return to ${Q.who} in Haven`, '#9ad0ff'); }
};
// ---------- rendering ----------
const _beC = buildExtras;
buildExtras = function () {
  _beC(); const L = R3.lvl;
  for (const q of G.qit || []) {
    const g = new T3.Group(); g.position.set(q.x * U, 0, q.y * U); L.add(g);
    const it = q.n.includes('Mushroom') ? (() => { const s = new T3.Group(); mk(GEO.cylL, mat('#e8e0c8'), .06, .25, .06, 0, .12, 0, s); mk(GEO.hemi, mat('#40ff9a', { em: 1.6 }), .18, .12, .18, 0, .25, 0, s); return s; })()
      : (() => { const s = new T3.Group(); mk(GEO.cyl, mat('#e0c060', { metal: .9, rough: .25, em: .4 }), .14, .03, .14, 0, 0, 0, s).rotation.x = Math.PI / 2; mk(GEO.sphL, mat('#ffffff', { em: 2 }), .04, .04, .04, 0, .16, 0, s, false); return s; })();
    it.position.y = .5; g.add(it); const beam = mk(GEO.cylL, basic('#9ad0ff', { op: .25, add: 1 }), .12, 3, .12, 0, 1.5, 0, g, false);
    R3.anim.push(() => { g.visible = !q.got; it.rotation.y = G.t * 2; it.position.y = .5 + Math.sin(G.t * 3) * .08; beam.scale.x = beam.scale.z = .12 * (1 + .2 * Math.sin(G.t * 4)); });
  }
};
const _doC = drawOverlay;
drawOverlay = function () {
  _doC(); if (!R3 || !P || G.mode === 'title' || !M || G.hideHud || !S) return;
  const lab = (o, z, t, col, font = 'bold 12px "Trebuchet MS",sans-serif') => { const s = proj(o.x, o.y, z); if (!s.vis) return; X.font = font; X.textAlign = 'center'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(t, s.x, s.y); X.fillStyle = col; X.fillText(t, s.x, s.y); };
  if (G.inTown) { const nv = nearVillager(); for (const v of G.vill || []) { if (dist(v, P) > 520) continue; const q = v.rescued ? null : sqFor(v.n);
      if (q) { const a = sqState().act[q.id]; lab(v, 2.05, !a ? '!' : sqProg(q) >= q.goal.n ? '?' : '…', !a ? '#ffd54a' : sqProg(q) >= q.goal.n ? '#7aff7a' : '#aaa', 'bold 22px sans-serif'); }
      if (v === nv) lab(v, 1.75, `[E] Talk to ${v.n}`, '#9ad0ff'); } }
  else { for (const q of G.qit || []) if (!q.got && dist(q, P) < 420) lab(q, 1.2, q.n, '#9ad0ff');
    for (const e of G.ens) if (e.invader && !e.dead && dist(e, P) < 420) lab(e, 2.3, '! Invader', '#ff8a6a'); }
};
const _dmC = drawMini;
drawMini = function () {
  _dmC(); const c = H.mctx, s = miniS(), R = Math.floor(190 / s / 2), ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
  for (const q of G.qit || []) { if (q.got) continue; const dx = q.x / TILE - ptx, dy = q.y / TILE - pty; if (Math.abs(dx) >= R || Math.abs(dy) >= R) continue; c.fillStyle = '#9ad0ff'; c.beginPath(); c.arc((dx + R) * s, (dy + R) * s, 3.5, 0, 6.283); c.fill(); }
};
const _uhC = updateHUD;
updateHUD = function (dt) {
  _uhC(dt); if (!S || G.mode === 'title') return; kbHudLabels();
  const el = hudLine('h-ga'); if (el) setH(el, 'ga', G.gauntlet && !G.inTown ? `<span style="color:#ff8a6a">${ico('swords')} Gauntlet ${G.gauntlet.i + 1} / 3</span>` : '');
};
// ---------- Bounties: Haven requests section ----------
{ const _qmC = MENUS.quests; MENUS.quests = () => { const st = sqState(); const who = [...new Set(SIDEQ.map(q => q.who))];
  const rows = who.map(w => { const q = sqFor(w); if (!q) return `<div class="card done"><b>${w}</b> <span class="dim">All requests complete ${ico('check')}</span></div>`; const a = st.act[q.id], p = sqProg(q);
    return `<div class="card ${a && p >= q.goal.n ? 'done' : ''}"><b>${a ? '' : '! '}${q.t}</b> <span class="dim">from ${w}</span><br>${a ? `${sqGoalTxt(q)} <span class="dim">${p} / ${q.goal.n}</span><div class="qbar"><div style="width:${p / q.goal.n * 100}%"></div></div>${p >= q.goal.n ? `<span style="color:#7aff7a">Return to ${w} in Haven!</span>` : ''}` : `<span class="dim">Talk to ${w} in Haven (walk up and press E) to hear their request.</span>`}<br><span class="dim">Reward: ${sqRewardTxt(q.rw)}</span></div>`; }).join('');
  return _qmC() + `<h3>${ico('haven')} Haven Requests <span class="dim">${Object.keys(st.done).length} / ${SIDEQ.length} complete • rescued villagers: ${(S.rescued || []).length} / ${CAPTIVES.length}</span></h3>${rows}`; }; }

// ---------- feats ----------
ACH.push(
  { id: 'sec1', n: 'Something Behind the Wall', d: 'Break open a secret room', c: () => S.stats.secrets || 0, need: 1, sp: 0 },
  { id: 'sec15', n: 'Wall Whisperer', d: 'Break open 15 secret rooms', c: () => S.stats.secrets || 0, need: 15, sp: 1 },
  { id: 'brz1', n: 'Keeper of Flames', d: 'Light all three braziers on a floor', c: () => S.stats.braziers || 0, need: 1, sp: 0 },
  { id: 'brz10', n: 'Vaultbreaker', d: 'Open 10 Ember Vaults', c: () => S.stats.braziers || 0, need: 10, sp: 1 },
  { id: 'res1', n: 'Cagebreaker', d: 'Rescue a captive villager', c: () => (S.rescued || []).length, need: 1, sp: 0 },
  { id: 'res8', n: 'Haven Reborn', d: 'Rescue all 8 captives', c: () => (S.rescued || []).length, need: 8, sp: 2 },
  { id: 'map10', n: 'Cartographer', d: 'Fully explore 10 floors', c: () => S.stats.mapped || 0, need: 10, sp: 0 },
  { id: 'map100', n: 'Every Corner', d: 'Fully explore 100 floors', c: () => S.stats.mapped || 0, need: 100, sp: 1 },
  { id: 'sq1', n: 'Good Neighbour', d: 'Complete a Haven request', c: () => S.stats.sidequests || 0, need: 1, sp: 0 },
  { id: 'sq8', n: 'Pillar of the Community', d: 'Complete every Haven request', c: () => S.stats.sidequests || 0, need: 8, sp: 2 },
  { id: 'cr1', n: 'Apprentice Smith', d: 'Craft an item at the workbench', c: () => S.stats.crafted || 0, need: 1, sp: 0 },
  { id: 'cr25', n: 'Master Smith', d: 'Craft 25 items', c: () => S.stats.crafted || 0, need: 25, sp: 1 },
  { id: 'set4', n: 'Fully Matched', d: 'Wear all 4 pieces of an item set', c: () => Math.max(0, ...Object.values(setCounts())), need: 4, sp: 1 },
  { id: 'ga1', n: 'Run the Gauntlet', d: 'Complete the Guardian Gauntlet', c: () => S.stats.gauntlets || 0, need: 1, sp: 1 },
  { id: 'ga10', n: 'Gauntlet Veteran', d: 'Complete the Guardian Gauntlet 10 times', c: () => S.stats.gauntlets || 0, need: 10, sp: 2 },
  { id: 'inv50', n: 'Border Guard', d: 'Slay 50 invaders', c: () => S.stats.invaders || 0, need: 50, sp: 1 },
);
// ---------- wiki ----------
WIKI_TXT.world.push(
  ['Item Sets', 'Green-bordered ' + ico('set-piece') + ' Set items drop from guardians, champions and (rarely) elites in their home regions. Wearing 2 pieces of a set gives a bonus, and 4 pieces gives a much bigger one. Hover a set item to see which pieces you have. Six sets exist: Warden\'s Vigil, Ashen Hunter, Stormcaller\'s Regalia, Tidebound Plate, Clockwork Precision and Voidwalker Shroud.'],
  ['Crafting', 'Brann\'s workbench (' + ico('craft') + ' Craft gear in the blacksmith menu) lets you choose the slot, weapon type, rarity and one guaranteed bonus that rolls 15% stronger than normal. Legendary crafts need Legendary Essence ' + ico('essence') + ', which you get by salvaging Legendary (1) and Mythic (2) items. Pay one extra essence to choose the legendary power yourself.'],
  ['Skill Runes', 'Once an active skill reaches rank 3 you can socket one rune into it from the skill tree: ' + RUNES.emp.ic + ' Empowered (+35% damage, +25% mana cost), ' + RUNES.swift.ic + ' Swift (-30% cooldown) or ' + RUNES.eff.ic + ' Efficient (-45% mana cost). Swap freely.'],
  ['Fighting Companions', 'Your pet now fights beside you, firing a homing spark at nearby foes. Higher pet levels fire faster and hit harder.'],
  ['Floor Hazards', 'Each region has its own hazard: bramble patches, cursed ground, quicksand, blood bogs, black ice, spore clouds, riptides, lava, steam vents, gales, shard fields and null zones. Some slow you, some hurt, some push you around — and many hurt monsters too, so lure foes into them. Dodging through a hazard avoids it.'],
  ['Secret Rooms', 'Some floors hide a cracked, glowing wall. Strike it with your weapon or a skill to break into a hidden room with two chests and maybe a gem, a fragment or a Lost Page.'],
  ['Ember Braziers', 'Occasionally a floor has three unlit braziers (◇ on the minimap). Walk up to all three to open the Ember Vault: two Epic+ items, gems and a pile of gold.'],
  ['Captives', 'Villagers taken by Morvane\'s forces are locked in cages in the dungeons. Break the cage to free them — they move to Haven and you get experience and gold. There are 8 to find.'],
  ['Trophy Hall', 'Every guardian you defeat leaves a small golden trophy along the south edge of Haven.'],
  ['Exploration Bonus', 'The HUD shows how much of the floor you\'ve explored. Uncover 95% of it for bonus gold and experience.'],
  ['Haven Requests', 'Pip, Old Hennik, Marla and Tomas have personal requests: monsters to slay and lost things to find. A ! above a villager means a new request, ? means it\'s ready to hand in. Walk up and press E. Track them under Bounties. Rewards include unique titles, a color, Marks, gems and fragments.'],
  ['Guardian Gauntlet', 'At the Waystone, once you\'ve beaten 3 guardians on a difficulty: fight three of them back to back at slightly higher power for big rewards. Your best time is recorded.'],
  ['Weekly Invasion', 'Each week one region is invaded by monsters from the other side of the valley. Its floors give +50% XP and gold, and elite Invaders roam each floor. Slay 30 for a weekly reward at the Waystone.'],
  ['Loadouts', 'In the inventory, save up to 3 loadouts (gear plus skill bar) and swap between them in one click.'],
  ['Custom Controls', 'Settings → Controls lets you rebind skills, potion, Ember Surge, dodge, weapon swap and town portal.'],
  ['Message Log & Minimap', 'The Message Log (in the ☰ menu) keeps every notice from this session. Click the minimap to switch between close and wide views. Hover buff icons to see what they do.'],
);
