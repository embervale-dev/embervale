// ================= TUTORIAL — Chapter 0: The Ember Sanctum =================
const TUTREG = { n: 'The Ember Sanctum', fl: '#5a4a3e', fl2: '#62503f', wl: '#2e241c', wt: '#7a5e44', bg: '#120c08', sky: '#ffc890', gnd: '#3a2a1a', sun: '#ffd8a0', torch: '#ffa040', dec: 'town', wd: 'pillar', en: ['slime'] };
EN.dummy = { n: 'Training Dummy', ai: 'dummy', hp: 22, dmg: 0, spd: 0, r: 16, col: '#c8a060', xp: 1, sh: 'dummy' };
EN.tsentry = { n: 'Training Sentry', ai: 'turret', hp: 1e6, dmg: 4, spd: 0, r: 17, col: '#8a7a6a', xp: 0, sh: 'turret', pc: '#ffd27a' };
const _curReg = curReg; curReg = function () { return G.tutorial && !G.inTown ? TUTREG : _curReg(); };
const _rlT = resetLevel; resetLevel = function () { _rlT(); G.tutorial = false; };
function genTutorial() {
  const m = makeMap(64, 26); m.kind = 'tut';
  const R = [[2, 9, 9, 8], [15, 8, 10, 10], [29, 8, 10, 10], [43, 8, 10, 10], [56, 10, 6, 6]];
  m.rooms = R.map(([x, y, w, h]) => { carve(m, x, y, w, h); return { x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) }; });
  for (let i = 1; i < m.rooms.length; i++) { const a = m.rooms[i - 1], b = m.rooms[i]; carve(m, a.cx, a.cy - 1, b.cx - a.cx + 1, 3); }
  m.stairRoom = m.rooms[4]; return m;
}
const rpos = (i, ox = 0, oy = 0) => ({ x: (M.rooms[i].cx + ox + .5) * TILE, y: (M.rooms[i].cy + oy + .5) * TILE });
const alive = t => G.ens.some(e => !e.dead && e.type === t);
const nearestOf = t => { let b = null, bd = 1e9; for (const e of G.ens) if (!e.dead && e.type === t) { const d = dist(e, P); if (d < bd) { bd = d; b = e; } } return b; };
const npcOf = k => G.npcs.find(n => n.kind === k);
const nearNpc = k => { const n = npcOf(k); return n && dist(P, n) < 70; };
const tutInfo = (i) => G.tut && G.tut.T['ack' + i];
function tutAck() { const g = G.tut; if (!g) return; g.T['ack' + g.i] = true; sfx('click'); }
const ACKB = '<div style="margin-top:7px"><span class="btn" style="font-size:12px;padding:3px 12px" onclick="tutAck()">Got it ▶</span></div>';
const TIP = t => `<div class="ttip">💡 ${t}</div>`;
const TSTEPS = [
  { t: 'Move', d: () => 'Use <b>W A S D</b> (or the arrow keys) to walk. Follow the golden marker into the next room.' + TIP('The camera leans toward your mouse. Scroll the mouse wheel to zoom in or out.'), tgt: () => rpos(1, -3, 0), done: T => dist(P, rpos(1, -3, 0)) < 60 },
  { t: 'Attack', d: () => 'Aim with the <b>mouse</b> and hold <b>Left Click</b> to attack. Destroy the 3 training dummies.' + TIP('White numbers are normal hits, big yellow ones are critical hits. Melee swings also knock enemy bolts out of the air.'), start() { for (const [x, y] of [[1, -2], [2, 1], [-1, 2]]) { const p = rpos(1, x, y); mkEnemy('dummy', p.x, p.y, { awake: true }); } }, tgt: () => nearestOf('dummy'), done: () => !alive('dummy') },
  { t: 'Weapon Arts', d: () => { const t = ST.wt, w = WT[t]; return `Every weapon type plays differently. Your <b>${w.ic} ${w.n}</b> has the Art <b style="color:#ffb05a">${WART[t][0]}</b>: ${WART[t][1]}<br>Try it on these two tougher dummies.` + TIP('There are 20 weapon types. Hover any weapon to see its Art and its ratings (single target, crowds, reach, safety, speed). Using a weapon type levels up its <b>Mastery</b> for extra damage.'); }, start() { for (const [x, y] of [[2, -1], [2, 2]]) { const p = rpos(1, x, y); const e = mkEnemy('dummy', p.x, p.y, { awake: true }); e.hp = e.maxHp = e.maxHp * 5; } }, tgt: () => nearestOf('dummy'), done: () => !alive('dummy') },
  { t: 'Dodge', d: () => 'That sentry fires bolts! Press <b>Space</b> (or Right-Click) to <b>dodge roll</b> — you cannot be hurt mid-roll. Dodge 3 times while bolts fly toward you.' + TIP('Red circles and lines on the ground show where a big attack will land. Roll out of them!'), start(T) { const p = rpos(2, 2, 0); T.sentry = mkEnemy('tsentry', p.x, p.y, { awake: true }); T.dodges = 0; }, tgt: T => T.sentry, prog: T => `${Math.min(3, T.dodges)}/3 dodges`, done: T => T.dodges >= 3, end(T) { if (T.sentry) { T.sentry.dead = true; burst(T.sentry.x, T.sentry.y, '#ffd27a', 30, 200, .8, 4); } G.eb = []; } },
  { t: 'Floor Hazards', d: () => 'Every region has its own <b>floor hazard</b> — brambles, quicksand, black ice, lava and more. These <b>Brambles</b> slow and hurt you. Cross them to reach the marker — <b>dodge-rolling through a hazard avoids it</b>.' + TIP('Many hazards hurt monsters too. Lure foes into them!'), start(T) { const c = rpos(2, 7, 0); G.haz.push({ x: c.x, y: c.y, r: 70, h: HAZ[0], ang: 0, t: 0, hit: false }); buildLevel(); }, tgt: () => rpos(3, -3, 0), done: () => dist(P, rpos(3, -3, 0)) < 60 },
  { t: 'Skills', d: () => { const k = SKI[CLS[S.cls].sk]; return `Skills are special moves on <b>Q E R F</b>. Press <b>Q</b> to use <b>${k.ic} ${k.n}</b> and defeat the slimes. Skills cost mana (the blue globe) and recharge over time.` + TIP('Hover a skill slot at the bottom to see exactly what it does.'); }, start(T) { T.skill = false; P.mp = ST.maxMp; for (let i = 0; i < 4; i++) { const p = randFloorNear(P.x, P.y, 120, 200, 14); mkEnemy('slime', p.x, p.y, { awake: true }); } }, tgt: () => nearestOf('slime'), prog: T => T.skill ? '✔ skill used' : 'press Q', done: T => T.skill && !alive('slime') },
  { t: 'Skill Tree', d: () => 'Each level-up gives you <b>skill points</b>. Press <b>K</b> to open the Skill Tree, look around, then close it again (K or Esc).<br>Drag or click a skill to bind it to Q E R F. Once a skill reaches <b>rank 3</b> you can socket a <b>Rune</b> into it: 🔺 Empowered, ⏩ Swift or 💧 Efficient.', prog: T => T.sk ? '✔ opened' : 'press K', done: T => T.sk && !G.menu },
  { t: 'Loot', d: () => 'Defeated foes drop gold and gear. A weapon fell nearby — walk over the glowing item to pick it up.' + TIP('Item colors show rarity: white, green, <span style="color:#4fa3ff">blue</span>, <span style="color:#b04fff">purple</span>, <span style="color:#ff9a2a">orange Legendary</span> and red Mythic. Items with a <span style="color:#5ae0a0">green ◈ border</span> belong to a <b>Set</b> — wear 2 or 4 pieces for bonuses.'), start(T) { const t = S.eq.weapon ? S.eq.weapon.t : CLS[S.cls].w; const it = genItem(2, { slot: 'weapon', t, r: 2 }); T.item = it.id; const p = rpos(3, -2, 0); dropItem(it, p.x, p.y); }, tgt: T => G.pick.find(p => p.k === 'item' && p.it.id === T.item) || rpos(3, -2, 0), done: T => S.inv.some(i => i.id === T.item) || Object.values(S.eq).some(i => i && i.id === T.item) },
  { t: 'Equip', d: () => 'Press <b>I</b> to open your Inventory and <b>click the new item</b> to equip it — or press <b>⚡ Auto-equip best gear</b>, which weighs every stat for you.' + TIP('Hover any item to compare it with what you wear. Shift+Click salvages, Alt+Click locks. At the bottom you can save <b>Loadouts</b> to swap whole gear sets in one click.'), done: T => Object.values(S.eq).some(i => i && i.id === T.item) },
  { t: 'Potions', d: () => 'Ouch — you are badly hurt! Press <b>1</b> to drink a health potion. Potions refill every time you return to Haven.', start(T) { P.hp = ST.maxHp * .35; T.pot = false; S.pots = Math.max(1, S.pots); }, done: T => T.pot },
  { t: 'Chests', d: () => 'Chests hold gold and gear. Walk into the chest to open it.' + TIP('Out in the wilds, about 1 in 10 chests is a Mimic!'), tgt: () => G.chests[0], done: () => G.chests[0] && G.chests[0].open },
  { t: 'Secret Rooms', d: () => 'See the <b>cracked, glowing wall</b>? Some floors hide a secret room. <b>Attack the wall</b> (or hit it with a skill) to break it open, then grab what\'s inside.', start(T) { const r = M.rooms[3]; const x = r.cx, y = r.y - 1; G.secret = { wx: x, wy: y, rect: { x: x - 1, y: y - 4, w: 4, h: 4 }, c: { x: (x + .5) * TILE, y: (y + .5) * TILE }, opened: false, name: 'A forgotten Warden cache' }; buildLevel(); }, tgt: () => G.secret && !G.secret.opened ? G.secret.c : null, done: () => G.secret && G.secret.opened },
  { t: 'Ember Braziers', d: () => 'Some floors have <b>three unlit braziers</b> (▲ on the minimap). Walk up to all three to light them and open the <b>Ember Vault</b> full of loot.' + TIP('The top-left panel tracks braziers and how much of the floor you have explored. Explore 95% of a floor for bonus gold and XP.'), start() { const list = [[-3, -3], [3, -3], [3, 3]].map(([x, y]) => ({ ...rpos(3, x, y), lit: false })); G.braz = { list, done: false }; buildLevel(); }, tgt: () => G.braz && G.braz.list.find(b => !b.lit), done: () => G.braz && G.braz.done },
  { t: 'Captives', d: () => 'Morvane\'s forces lock villagers in <b>cages</b> deep in the dungeons. Break this practice cage to see how it works. Real captives you free move to <b>Haven</b> — there are 8 to find.', start(T) { const p = rpos(4, 0, -1); mkEnemy('cage', p.x, p.y, {}); T.cage = false; }, tgt: () => G.ens.find(e => e.type === 'cage' && !e.dead), done: T => T.cage },
  { t: 'Ember Surge', d: () => 'Fighting fills your 🔥 <b>Ember Surge</b> gauge (beside your skills). It is full right now — press <b>V</b> to unleash it on the wolves!', start(T) { P.surge = 100; T.surge = false; for (let i = 0; i < 4; i++) { const p = randFloorNear(P.x, P.y, 110, 170, 14); const e = mkEnemy('wolf', p.x, p.y, { awake: true }); e.hp = e.maxHp = 5; } }, tgt: () => nearestOf('wolf'), prog: T => T.surge ? '✔ Surge unleashed' : 'press V', done: T => T.surge && !alive('wolf') },
  { t: 'Elites & Guardians', d: () => 'Foes with a <b>colored ring</b> are <b>Elites</b> with special traits (named <b>Champions</b> are even tougher). The 7th floor of every region holds a <b>Guardian</b> boss — beat it to recover an Ember Shard and unlock the next region.' + TIP('Bosses telegraph their big attacks with red markings. Watch, then roll.') + ACKB, done: T => tutInfo(15) },
  { t: 'Stairs', d: () => 'Each floor has stairs that stay <b>sealed until you slay 70% of its foes</b> — the bar at the top-left tracks it. These stairs are open: step onto them to leave the Sanctum.', start() { G.stairs = G.tutStairs; G.total = 0; G.stairsOpen = true; }, tgt: () => G.stairs, done: () => false },
  { t: 'Haven', town: 1, d: () => 'This is <b>Haven</b>, your safe home. Life and potions refill here. Walk to <b>Merchant Orla</b> 💰 — she buys and sells gear.', tgt: () => npcOf('shop'), done: () => nearNpc('shop') },
  { t: 'Haven Grows', town: 1, d: () => 'Haven is still waking up. As you level, more people open stalls here: your <b>Stash</b> 🧰 (level 2), the <b>Bounty Board</b> 📜 (level 3), <b>Blacksmith Brann</b> ⚒️ (level 4), <b>Jeweler Sefa</b> 💎 (level 8) and <b>Quartermaster Ilse</b> 🔶 (level 11). Each one explains itself on your first visit and gives you a small task.' + ACKB, done: T => tutInfo(18) },
  { t: 'Haven Requests', town: 1, d: () => 'Villagers with a <b style="color:#ffd54a">❗</b> above their head have a personal request. Walk up to <b>Pip</b> and press <b>E</b> to talk. A <b style="color:#7aff7a">❓</b> means a request is ready to hand in.', tgt: () => (G.vill || []).find(v => v.n === 'Pip'), prog: T => T.talk ? '✔ talked' : 'press E near Pip', done: T => T.talk && !G.menu },
  { t: 'Sage Elowen', town: 1, d: () => '<b>Sage Elowen</b> 📘 always knows where you should go next. If you ever feel lost, visit her — or read the <b>Next:</b> line in the top-left corner, which always tells you what to do.', tgt: () => npcOf('sage'), done: () => nearNpc('sage') },
  { t: 'The Menu', town: 1, d: () => 'Press <b>Esc</b> (or the <b>☰</b> button at the bottom-left) to open the <b>Menu</b>. Everything lives there: Skills, Constellation, Bounties, Season, Feats, Journal, Bestiary, <b>Arsenal</b> (weapon mastery), <b>Message Log</b>, Wiki and Settings. Open it, then close it.' + TIP('Settings → Controls lets you change any combat key.'), prog: T => T.menu ? '✔ opened' : 'press Esc', done: T => T.menu && !G.menu },
  { t: 'Long-term Goals', town: 1, d: () => 'Embervale is a long journey, and it opens up as you play — new stalls appear in Haven and new pages in the Menu as you level up and defeat Guardians (you will get a 🔓 notice each time). The ☰ Menu always shows what unlocks next. The Wiki (<b>H</b>) explains everything.' + ACKB, done: T => tutInfo(22) },
  { t: 'Begin your journey', town: 1, d: () => 'You are ready, Kindled! Walk to the <b>Waystone</b> 🌀 north of the fountain and choose <b>Whispering Woods — Floor 1</b>. Trials and challenges live there too. Stuck at any time? Press <b>H</b> for the Wiki.', tgt: () => npcOf('portal'), done: () => nearNpc('portal') },
];
function startTutorial() {
  resetLevel(); G.inTown = false; G.abyss = false; G.tutorial = true; G.region = 0; G.floor = 0; G.pw = 0; G.mod = null;
  M = genTutorial(); const r0 = M.rooms[0]; placePlayer(r0.cx - 2, r0.cy);
  calcStats(); P.hp = ST.maxHp; P.mp = ST.maxMp; S.pots = S.potMax; P.surge = 0; P.cds = {};
  G.stairs = { x: (M.rooms[4].cx + .5) * TILE, y: (M.rooms[4].cy + .5) * TILE }; G.total = 9999; G.stairsOpen = false;
  const c = rpos(3, 2, -2); G.chests.push({ x: c.x, y: c.y, open: false, mimic: false, t: 0 });
  G.tut = { i: -1, T: {} }; G.mode = 'play'; computeFlow(); buildLevel();
  G.tutStairs = G.stairs; G.stairs = null;
  banner('Chapter 0', 'The Ember Sanctum', '#ffd27a'); tutNext();
  startDialog([['elowen', 'Before you face the wilds, walk the Ember Sanctum beneath Haven. Follow the golden marker and I will teach you everything you need.']]);
}
function tutNext() {
  const g = G.tut; if (!g) return; const cur = TSTEPS[g.i]; if (cur && cur.end) cur.end(g.T);
  g.i++; if (g.i >= TSTEPS.length) return tutDone();
  const st = TSTEPS[g.i]; if (st.start) st.start(g.T); if (g.i > 0) sfx('shrine'); HC.tutbox = null;
}
function tutDone() {
  G.tut = null; const first = !S.tutDone; S.tutDone = true; HC.tutbox = null; const tb = $('tutbox'); if (tb) tb.style.display = 'none';
  banner('Tutorial complete!', 'Your journey begins — free the twelve Wardens', '#7aff7a'); sfx('legend');
  if (first) { S.gold += 150; addMarks(25, 'tutorial complete'); }
  saveGame();
}
function tutSkip() { const inSanctum = G.tutorial; G.tut = null; S.tutDone = true; HC.tutbox = null; if (inSanctum) goTown(); toast('Tutorial skipped — replay it any time from the ☰ Menu.', '#9ad0ff'); saveGame(); }
// finishing the Sanctum: the stairs lead up into Haven
const _nextFloorT = nextFloor;
nextFloor = function () { if (G.tutorial) { sfx('stairs'); goTown(); if (G.tut) { tutNext(); startDialog([['elowen', 'Well done! Now, let me show you around Haven.']]); } return; } _nextFloorT(); };
// action hooks the tutorial listens for
const _updPlayerT = updPlayer; updPlayer = function (dt) { const d0 = P.dodgeT; _updPlayerT(dt); if (G.tut && d0 <= 0 && P.dodgeT > 0 && G.eb.some(b => dist(b, P) < 320)) G.tut.T.dodges = (G.tut.T.dodges || 0) + 1; };
const _castT = castSkill; castSkill = function (id) { const c0 = (id && P.cds[id]) || 0; _castT(id); if (G.tut && id && (P.cds[id] || 0) > c0) G.tut.T.skill = true; };
const _drinkT = drinkPotion; drinkPotion = function () { const p0 = S.pots; _drinkT(); if (G.tut && S.pots < p0) G.tut.T.pot = true; };
const _surgeT = unleashSurge; unleashSurge = function () { const s0 = P.surge; _surgeT(); if (G.tut && s0 >= 100) G.tut.T.surge = true; };
const _openT = openMenu; openMenu = function (n) { if (G.tut && n === 'pause') G.tut.T.menu = true; if (G.tut && n === 'skills') G.tut.T.sk = true; _openT(n); };
const _hurtT = hurtPlayer; hurtPlayer = function (a, src) { if (G.tutorial && P) a = Math.min(a, Math.max(0, P.hp - ST.maxHp * .2)); return _hurtT(a, src); };
const _updT = update;
update = function (dt) {
  _updT(dt);
  const g = G.tut; if (!g || G.mode !== 'play' || G.menu) return; const st = TSTEPS[g.i];
  if (st && (st.town ? G.inTown : G.tutorial) && st.done(g.T)) tutNext();
};
function tutTarget() { const g = G.tut; if (!g) return null; const st = TSTEPS[g.i]; if (!st || !st.tgt || !(st.town ? G.inTown : G.tutorial)) return null; return st.tgt(g.T); }
const _reT = renderExtras;
renderExtras = function (dt) {
  _reT(dt); const t = tutTarget(); if (!t || G.menu) return; const PL = R3.pools;
  const a = PL.ring.get(); a.position.set(t.x * U, .06, t.y * U); const s = .7 + Math.sin(G.t * 5) * .12; a.scale.set(s, 1, s); a.material.color.set('#ffd27a'); a.material.opacity = .9;
  const b = PL.beam.get(); b.position.set(t.x * U, 2.5, t.y * U); b.scale.set(.18, 5, .18); b.material.color.set('#ffd27a'); b.material.opacity = .22;
};
const _doT = drawOverlay;
drawOverlay = function () {
  _doT(); if (!R3 || G.mode === 'title' || !P || !M) return; let t = tutTarget(), col = '#ffd27a';
  if (!t && !G.inTown && G.mode === 'play') { if (G.stairsOpen && G.stairs) { t = G.stairs; col = '#7aff7a'; } else if (G.exit) { t = G.exit; col = '#7ab8ff'; } }
  if (!t) return;
  const s = proj(t.x, t.y, 1.6), m = 50;
  if (col !== '#ffd27a' && s.vis && s.x > m && s.x < VW - m && s.y > m && s.y < VH - m) return;
  if (s.vis && s.x > m && s.x < VW - m && s.y > m && s.y < VH - m) { X.font = 'bold 22px sans-serif'; X.textAlign = 'center'; X.fillStyle = col; X.strokeStyle = '#000'; X.lineWidth = 4; const by = s.y - 8 + Math.sin(G.t * 6) * 5; X.strokeText('▼', s.x, by); X.fillText('▼', s.x, by); }
  else { const cx = VW / 2, cy = VH / 2, a = Math.atan2(s.y - cy, s.x - cx), r = Math.min(VW, VH) / 2 - 70, ex = cx + Math.cos(a) * r, ey = cy + Math.sin(a) * r;
    X.save(); X.translate(ex, ey); X.rotate(a); X.fillStyle = col; X.strokeStyle = '#000'; X.lineWidth = 3; X.beginPath(); X.moveTo(22, 0); X.lineTo(-10, -14); X.lineTo(-4, 0); X.lineTo(-10, 14); X.closePath(); X.stroke(); X.fill(); X.restore(); }
};
const _hudT = updateHUD;
updateHUD = function (dt) {
  _hudT(dt);
  let tb = $('tutbox'); const g = G.tut;
  if (!tb) { tb = document.createElement('div'); tb.id = 'tutbox'; $('hud').appendChild(tb); }
  if (!g || G.mode === 'title' || !S) { tb.style.display = 'none'; return; }
  const st = TSTEPS[g.i]; if (!st) return; tb.style.display = 'block';
  if (G.tutorial) { HC.sub = null; HC.obj = null; H['h-sub'].innerHTML = '🎓 Chapter 0 — Tutorial'; H['h-obj'].innerHTML = ''; }
  const waiting = !(st.town ? G.inTown : G.tutorial), prog = st.prog ? st.prog(g.T) : '';
  setH(tb, 'tutbox', `<div class="th">🎓 Tutorial <span>Step ${g.i + 1} / ${TSTEPS.length}</span></div><div class="tt">${st.t}</div><div class="td">${waiting ? (st.town ? 'Return to Haven to continue the tutorial.' : 'You left the Sanctum. Replay the tutorial from the ☰ Menu to finish it, or skip it below.') : st.d()}</div>${prog ? `<div class="tp">${prog}</div>` : ''}
    <div class="tdots">${TSTEPS.map((_, i) => `<i class="${i < g.i ? 'd' : i === g.i ? 'c' : ''}"></i>`).join('')}</div><span class="tskip" onclick="tutSkip()">Skip tutorial</span>`);
};
WIKI_TXT.basics.unshift(['Tutorial', 'New characters start in Chapter 0: The Ember Sanctum, a 24-step guided tutorial: movement, attacking, weapon Arts, dodging, floor hazards, skills and the skill tree, loot and sets, equipping, potions, chests, secret rooms, Ember Braziers, captives, Ember Surge, elites and guardians, stairs, then a tour of Haven (merchant, blacksmith crafting & infusion, villager requests, bounties, the menu, long-term goals and the Waystone). Replay it any time from the ☰ Menu.']);
