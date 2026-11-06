// ================= MORE STALLS (unlocked by level) + their long-term systems =================
Object.assign(SPK, { vael: { n: 'Alchemist Vael', ic: ico('alchemist'), col: '#7aff9a' }, oren: { n: 'Enchanter Oren', ic: ico('enchanter'), col: '#c08aff' }, kael: { n: 'Beastmaster Kael', ic: ico('paw'), col: '#e0a060' }, wren: { n: 'Cartographer Wren', ic: ico('map'), col: '#8ad0ff' }, tyr: { n: 'Arena Master Tyr', ic: ico('arena'), col: '#ff8a6a' }, gold: { n: 'Banker Goldwyn', ic: ico('bank'), col: '#ffd54a' }, ysolde: { n: 'Oracle Ysolde', ic: ico('oracle'), col: '#b0a0ff' } });
const NEW_STALLS = {
  alch:   { n: 'Alchemist Vael', ic: ico('alchemist'), col: '#3a9a5a', menu: 'alch', lvl: 6, pos: [12, 4], who: 'vael', role: 'Brew elixirs', task: 'Brew an elixir', tip: 'Pick an elixir and press Brew',
    intro: ['Bubbles and fumes — mind the green one. I brew elixirs that strengthen you for your next stretch of adventuring.', 'One of each kind can be active at a time. They last a while, but only tick down while you are out in the wilds.'] },
  ench:   { n: 'Enchanter Oren', ic: ico('enchanter'), col: '#7a4ab0', menu: 'ench', lvl: 14, pos: [26, 4], who: 'oren', role: 'Reroll one chosen bonus', task: 'Enchant a bonus on your gear', tip: 'Pick an item, then a bonus to reroll',
    intro: ['Brann rerolls everything at once. I am more… precise. Choose a single bonus on one of your items and I will reweave only that one.', 'Each item grows harder to enchant the more you work on it. Choose wisely.'] },
  tamer:  { n: 'Beastmaster Kael', ic: ico('paw'), col: '#a06a30', menu: 'tamer', lvl: 16, pos: [12, 11], who: 'kael', role: 'Train your companion', task: 'Train your companion', tip: 'Pick a training session for your pet',
    intro: ['That critter of yours has potential. Bring it here and I will train it — faster levels, stronger bonuses.', 'Companions also learn on their own as you fight together.'] },
  carto:  { n: 'Cartographer Wren', ic: ico('map'), col: '#3a7ab0', menu: 'carto', lvl: 18, pos: [27, 11], who: 'wren', role: 'Region stars & map scrolls', task: 'Earn a region star or buy a Map Scroll', tip: 'Check your Atlas or buy a scroll',
    intro: ['I chart every region you conquer. Earn up to three stars in each one, on every difficulty, and I will reward your thoroughness.', 'My Map Scrolls reveal a whole floor the moment you arrive.'] },
  arena:  { n: 'Arena Master Tyr', ic: ico('arena'), col: '#b04a3a', menu: 'arena', lvl: 20, pos: [33, 4], who: 'tyr', role: 'Endless Arena & multiplayer', task: 'Fight in the Endless Arena', tip: 'Start an Arena run',
    intro: ['The crowd wants blood! Step into the Endless Arena: wave after wave until you fall. Every five waves earns a prize.', 'And if you have friends, the arena is where heroes meet — duel each other or form a party.'] },
  bank:   { n: 'Banker Goldwyn', ic: ico('bank'), col: '#a08a20', menu: 'bank', lvl: 25, pos: [23, 20], who: 'gold', role: 'Vault that earns interest', task: 'Deposit gold in the vault', tip: 'Deposit some gold',
    intro: ['Gold in your pocket buys nothing tomorrow. Gold in my vault earns 2% interest every day you are away — up to thirty days.', 'I can also expand your stash, for a fee.'] },
  oracle: { n: 'Oracle Ysolde', ic: ico('oracle'), col: '#5a4ab0', menu: 'oracle', lvl: 30, pos: [4, 4], who: 'ysolde', role: 'Weekly prophecy & Rebirth', task: 'Accept a prophecy', tip: 'Choose one of this week\'s prophecies',
    intro: ['I see the week ahead. Each week, three prophecies — choose one and it will hold true for you until the week turns.', 'And when you have grown very strong, I can return you to the beginning… stronger than before. We call it Rebirth.'] },
};
for (const k in NEW_STALLS) { const s = NEW_STALLS[k]; STALLS[k] = { pos: s.pos, role: s.role, who: s.who, intro: s.intro, task: s.task, tip: s.tip }; UNLOCK[k] = { n: s.n, ic: s.ic, kind: 'npc', how: `Reach level ${s.lvl}`, ok: () => S.lvl >= s.lvl }; }
{ const _btY = buildTown; buildTown = function () {
  if (G.npcs) for (const k in NEW_STALLS) if (!G.npcs.some(n => n.kind === k)) { const s = NEW_STALLS[k]; G.npcs.push({ n: s.n, x: 0, y: 0, col: s.col, menu: s.menu, ic: s.ic, kind: k, roof: s.col, near: false }); }
  _btY(); const L = R3.lvl;
  for (const n of G.npcs) { const s = NEW_STALLS[n.kind]; if (!s) continue; const g = new T3.Group(); g.position.set(n.x * U, 0, n.y * U); L.add(g);
    const h = makeHumanoid({ body: s.col, hatType: 'hair', hair: '#3a2a1a' }); h.g.position.set(0, 0, -.1); h.g.scale.setScalar(.9); h.g.rotation.y = -Math.atan2(13.5 - n.y * U, 19.5 - n.x * U); g.add(h.g);
    const prop = { alch: () => { for (let i = 0; i < 3; i++) mk(GEO.sph, mat(['#7aff9a', '#ff7a9a', '#7ab0ff'][i], { em: 1.6, op: .85 }), .1, .14, .1, -.5 + i * .35, .85, .5, g, false); },
      ench: () => { const o = mk(GEO.oct, mat('#c08aff', { em: 2.2, flat: true }), .16, .22, .16, 0, 1.05, .5, g, false); R3.anim.push(() => { o.rotation.y = G.t * 1.6; o.position.y = 1.05 + Math.sin(G.t * 2) * .06; }); },
      tamer: () => { const p = makeEnemyModel({ sh: 'beast', col: '#c8a070' }); p.g.scale.setScalar(.18); p.g.position.set(.6, .72, .5); g.add(p.g); },
      carto: () => { mk(GEO.box, mat('#e8d8b0'), .9, .02, .5, 0, .72, .5, g); mk(GEO.cylL, mat('#c8b080'), .05, .5, .05, -.5, .78, .5, g).rotation.z = Math.PI / 2; },
      arena: () => { for (const x of [-.4, .4]) { const sw = mk(GEO.box, mat('#c8c8d8', { metal: .8 }), .05, .7, .05, x, 1.05, .45, g); sw.rotation.z = x > 0 ? -.5 : .5; } mk(GEO.cyl, mat('#b04a3a'), .3, .05, .3, 0, 1.25, .5, g).rotation.x = Math.PI / 2; },
      bank: () => { for (let i = 0; i < 4; i++) mk(GEO.cyl, mat('#ffd54a', { metal: .9, rough: .25, em: .3 }), .12, .04 + i * .03, .12, -.4 + i * .27, .72 + i * .015, .5, g); },
      oracle: () => { const b = mk(GEO.sph, mat('#b0a0ff', { em: 2, op: .8 }), .2, .2, .2, 0, .95, .5, g, false); R3.anim.push(() => { b.material.emissiveIntensity = 1.6 + Math.sin(G.t * 2) * .6; }); } }[n.kind]; if (prop) prop(); }
}; }
// ---------- ALCHEMIST: elixirs (tick only while adventuring) ----------
const ELIXIRS = {
  might:  { n: 'Elixir of Might', ic: ico('might'), d: '+15% damage', f: s => s.dmg += 15 },
  iron:   { n: 'Ironhide Tonic', ic: ico('shield'), d: '+12% max life, +5% damage reduction', f: s => { s.hpPct += 12; s.dr += 5; } },
  wisdom: { n: 'Draught of Wisdom', ic: ico('book'), d: '+30% experience', f: s => s.xp += 30 },
  fortune:{ n: 'Lucky Brew', ic: ico('clover'), d: '+40% gold find, +25% magic find', f: s => { s.gold += 40; s.luck += 25; } },
  swift:  { n: 'Quicksilver', ic: ico('wind'), d: '+10% attack & move speed', f: s => { s.atkSpd += 10; s.moveSpd += 10; } },
};
const ELIX_DUR = 600;
function elixCost() { return Math.round(120 * Math.pow(1.12, Math.min(maxPw(), 110))); }
function brew(k) { const c = elixCost(); if (S.gold < c) { toast('Not enough gold', '#ff8a8a'); sfx('error'); return; } S.gold -= c; S.elix = S.elix || {}; S.elix[k] = ELIX_DUR; calcStats(); sfx('legend'); toast(`${ELIXIRS[k].ic} ${ELIXIRS[k].n}: ${ELIXIRS[k].d} for 10 minutes of adventuring`, '#7aff9a'); stallDone('alch'); S.stats.elix = (S.stats.elix || 0) + 1; saveGame(); renderMenu(); }
MENUS.alch = () => { const c = elixCost(); return `<h2>${ico('alchemist')} Alchemist Vael</h2><div class="dim">Each elixir lasts 10 minutes of adventuring (it only ticks down outside Haven). Brewing again refreshes it. Cost: <span class="gold">${fmt(c)} gold</span> each.</div><div class="regcards">${Object.keys(ELIXIRS).map(k => { const E = ELIXIRS[k], t = (S.elix || {})[k] || 0; return `<div class="card ${t > 0 ? 'done' : ''}"><b>${E.ic} ${E.n}</b> <span class="up">${E.d}</span><br>${t > 0 ? `<span class="dim">Active — ${Math.ceil(t / 60)} min left</span> ` : ''}<span class="btn ${S.gold < c ? 'dis' : ''}" onclick="brew('${k}')">${t > 0 ? 'Refresh' : 'Brew'}</span></div>`; }).join('')}</div><span class="btn" onclick="closeMenu()">Leave</span>`; };
// ---------- ENCHANTER: reroll one chosen affix ----------
let ENC_SL = 'weapon';
function encCost(it) { const n = it.enc || 0; return { sh: 25 + n * 20, g: Math.round((60 + n * 60) * Math.pow(1.1, Math.min(maxPw(), 110))) }; }
function enchant(sl, ai) { const it = S.eq[sl]; if (!it || !it.aff[ai]) return; const c = encCost(it); if (S.shards < c.sh || S.gold < c.g) { toast('Not enough shards or gold', '#ff8a8a'); sfx('error'); return; }
  S.shards -= c.sh; S.gold -= c.g; const used = it.aff.map(a => a.k); const pool = [...new Set(it.slot === 'weapon' ? AFF_W : AFF_A)].filter(k => !used.includes(k) || k === it.aff[ai].k); const k = pick(pool), A = AFF[k];
  let v = rnd(A.min, A.max) * (1 + .12 * it.r); if (A.sc) v *= Math.pow(A.sc, it.il); it.aff[ai] = { k, v: v >= 100 ? Math.round(v) : Math.round(v * 10) / 10 }; it.enc = (it.enc || 0) + 1; it.name = (it.awk ? '✧ ' : '') + itemName(it).replace(/^[\u272A✧★] /, '');
  calcStats(); sfx('lvl'); toast(`${ico('enchanter')} New bonus: <b>${statLine(k, it.aff[ai].v)}</b>`, '#c08aff'); stallDone('ench'); S.stats.enchants = (S.stats.enchants || 0) + 1; saveGame(); renderMenu(); }
MENUS.ench = () => { const it = S.eq[ENC_SL];
  let h = `<h2>${ico('enchanter')} Enchanter Oren</h2><div class="dim">Pick one bonus on an equipped item to reroll — only that one changes. Each enchant on the same item costs more.</div><div>${SLOTS.map(sl => `<span class="btn ${ENC_SL === sl ? 'on' : ''}" style="font-size:12px" onclick="ENC_SL='${sl}';renderMenu()">${SLOTN[sl]}</span>`).join('')}</div>`;
  if (!it) h += '<div class="dim" style="margin:10px 0">Nothing equipped there.</div>';
  else { const c = encCost(it); h += `<div class="card"><b style="color:${RAR[it.r].c}">${it.name}</b> <span class="dim">— enchanted ${it.enc || 0}× • next costs ${c.sh} ✦ + ${fmt(c.g)} gold</span>${it.aff.length ? it.aff.map((a, i) => `<div class="smrow"><div style="flex:1">${statLine(a.k, a.v)}</div><span class="btn" onclick="enchant('${ENC_SL}',${i})">${ico('enchanter')} Reroll this</span></div>`).join('') : '<div class="dim">This item has no bonuses to enchant.</div>'}</div>`; }
  return h + `<span class="btn" onclick="closeMenu()">Leave</span>`; };
// ---------- BEASTMASTER: pet training ----------
function trainCost(m) { return Math.round(m * 90 * Math.pow(1.1, Math.min(maxPw(), 110))); }
function trainPet(m) { const k = S.cos.pet; if (!k) { toast('Summon a companion in the Wardrobe first', '#ff8a8a'); return; } if (petLvl(k) >= 10) { toast('Your companion is already fully trained (level 10)', '#e0a060'); return; } const c = trainCost(m); if (S.gold < c) { toast('Not enough gold'); sfx('error'); return; } S.gold -= c; S.petXp = S.petXp || {}; const l0 = petLvl(k); S.petXp[k] = (S.petXp[k] || 0) + m * 40; const l1 = petLvl(k); calcStats(); sfx(l1 > l0 ? 'legend' : 'click'); toast(`${ico('paw')} ${PETS[k].n} trained${l1 > l0 ? ` — now level ${l1}!` : ''}`, '#e0a060'); stallDone('tamer'); saveGame(); renderMenu(); }
MENUS.tamer = () => { const k = S.cos.pet; return `<h2>${ico('paw')} Beastmaster Kael</h2>${k ? `<div class="card"><b>${PETS[k].n}</b> — level ${petLvl(k)} / 10 <span class="dim">(${fmt((S.petXp || {})[k] || 0)} XP)</span><div class="dim">${PETS[k].b}</div></div><div>${[[1, 'Short session'], [3, 'Day of training'], [8, 'Week-long camp']].map(([m, n]) => `<span class="btn ${S.gold < trainCost(m) ? 'dis' : ''}" onclick="trainPet(${m})">${n}: +${m * 40} XP — ${fmt(trainCost(m))}g</span>`).join('')}</div>` : '<div class="dim">You have no companion following you. Choose one in the Wardrobe (G) first.</div>'}<span class="btn" onclick="closeMenu()">Leave</span>`; };
// ---------- CARTOGRAPHER: region stars + map scrolls ----------
function regStars(r, d) { let n = 0; if (S.done[d][r]) n++; if ((S.prog[d][r] || 0) >= BOSS_F && S.done[d][r]) n++; if (((S.regClr || {})[d + '_' + r] || 0) >= 3) n++; return n; }
function totalStars() { let n = 0; for (let d = 0; d < 4; d++) for (let r = 0; r < NREG; r++) n += regStars(r, d); return n; }
{ const _uY = update; update = function (dt) { const c0 = G.cleared; _uY(dt); if (!c0 && G.cleared && !G.abyss && !G.trial) { S.regClr = S.regClr || {}; const k = S.diff + '_' + G.region; S.regClr[k] = (S.regClr[k] || 0) + 1; } }; }
function claimStars() { const t = totalStars(), got = S.starClaim || 0, tier = Math.floor(t / 5); if (tier <= got) return; for (let i = got; i < tier; i++) { S.marks += 15; addGem(pick2(Object.keys(GEMS)), gemTier()); } S.starClaim = tier; calcStats(); sfx('legend'); toast(`★ Atlas reward: +${(tier - got) * 15} Marks and ${tier - got} gem${tier - got > 1 ? 's' : ''}`, '#8ad0ff'); stallDone('carto'); saveGame(); renderMenu(); }
function scrollCost() { return Math.round(70 * Math.pow(1.12, Math.min(maxPw(), 110))); }
function buyScroll() { const c = scrollCost(); if (S.gold < c) { toast('Not enough gold'); return; } S.gold -= c; S.scrolls = (S.scrolls || 0) + 1; sfx('click'); toast(ico('map') + ' Map Scroll bought — it reveals your next dungeon floor', '#8ad0ff'); stallDone('carto'); saveGame(); renderMenu(); }
{ const _efY = enterFloor; enterFloor = function (r, f, d) { _efY(r, f, d); if ((S.scrolls || 0) > 0 && !G.tutorial && !G.trial && !G.arena && !G.boss && G.floor !== BOSS_F && M) { S.scrolls--; M.seen.fill(1); G.explored = true; toast(`${ico('map')} Map Scroll used — floor revealed (${S.scrolls} left)`, '#8ad0ff'); } }; }
{ const _xsY = extraStats; extraStats = function (s) { _xsY(s); if (!S) return; const t = totalStars(); s.dmg += Math.floor(t / 10); for (const k in S.elix || {}) if (S.elix[k] > 0 && ELIXIRS[k]) ELIXIRS[k].f(s); if (S.prophecy && S.prophecy.w === weekId() && PROPH[S.prophecy.k]) PROPH[S.prophecy.k].f(s); const rb = S.rebirth || 0; s.dmg += rb * 4; s.hpPct += rb * 4; s.xp += rb * 5; }; }
MENUS.carto = () => { const t = totalStars(), tier = Math.floor(t / 5), can = tier > (S.starClaim || 0);
  let h = `<h2>${ico('map')} Cartographer Wren</h2><div class="dim">Earn up to 3 ★ per region on each difficulty: ★ defeat the Guardian • ★ clear all 7 floors • ★ fully clear 3 floors there. Every 5 stars: 15 Marks + a gem. Every 10 stars: +1% damage forever.</div>
  <div class="card"><b>★ ${t} / ${NREG * 3 * 4} stars</b> <span class="dim">(+${Math.floor(t / 10)}% damage)</span> ${can ? `<span class="btn" onclick="claimStars()">Claim ${tier - (S.starClaim || 0)} reward${tier - (S.starClaim || 0) > 1 ? 's' : ''}</span>` : `<span class="dim">next reward at ${(tier + 1) * 5} stars</span>`}</div>
  <div class="atlas">${REG.map((R, r) => `<div class="atl"><b style="color:${R.torch}">${r + 1}. ${R.n}</b>${[0, 1, 2, 3].map(d => `<span title="${DIFF[d]}" style="color:${DIFFC[d]}">${'★'.repeat(regStars(r, d))}<span class="dim">${'☆'.repeat(3 - regStars(r, d))}</span></span>`).join(' ')}</div>`).join('')}</div>
  <div class="card">${ico('scroll')} <b>Map Scroll</b> — reveals the whole map of your next floor. You have ${S.scrolls || 0}. <span class="btn ${S.gold < scrollCost() ? 'dis' : ''}" onclick="buyScroll()">Buy: ${fmt(scrollCost())}g</span></div><span class="btn" onclick="closeMenu()">Leave</span>`; return h; };
// ---------- BANKER: vault with daily interest, stash expansion ----------
function bankTick() { if (!S.vault) return; const now = Date.now(), days = Math.min(30, Math.floor((now - (S.vault.t || now)) / 864e5)); if (days > 0) { const earned = Math.floor(S.vault.g * (Math.pow(1.02, days) - 1)); S.vault.g += earned; S.vault.t = days >= 30 ? now : S.vault.t + days * 864e5; if (earned > 0) G.later.push({ t: 1.5, fn: () => toast(`${ico('bank')} Your vault earned ${fmt(earned)} gold in interest`, '#ffd54a') }); } }
{ const _gtY = goTown; goTown = function () { _gtY(); bankTick(); }; }
function bankDep(f) { const a = Math.floor(S.gold * f); if (a <= 0) return; S.gold -= a; S.vault = S.vault || { g: 0, t: Date.now() }; S.vault.g += a; if (!S.vault.t) S.vault.t = Date.now(); sfx('gold'); stallDone('bank'); saveGame(); renderMenu(); }
function bankWd() { if (!S.vault || !S.vault.g) return; S.gold += S.vault.g; toast(`${ico('bank')} Withdrew ${fmt(S.vault.g)} gold`, '#ffd54a'); S.vault.g = 0; sfx('gold'); saveGame(); renderMenu(); }
function stashCost() { return Math.round(5000 * Math.pow(1.6, ((S.stashMax || 40) - 40) / 10)); }
function buyStash() { const c = stashCost(); if (S.gold < c) { toast('Not enough gold'); return; } S.gold -= c; S.stashMax = (S.stashMax || 40) + 10; sfx('legend'); toast(`${ico('chest')} Stash expanded to ${S.stashMax} slots`, '#ffd54a'); saveGame(); renderMenu(); }
MENUS.bank = () => { const v = S.vault || { g: 0 }; return `<h2>${ico('bank')} Banker Goldwyn</h2><div class="dim">Gold in the vault earns <b>2% interest per real day</b> (up to 30 days at a time). It is safe there — you never lose vault gold when you fall.</div>
  <div class="card"><b>Vault: <span class="gold">${fmt(v.g)} gold</span></b><br>${[[.25, '25%'], [.5, '50%'], [1, 'All']].map(([f, n]) => `<span class="btn" onclick="bankDep(${f})">Deposit ${n}</span>`).join('')}<span class="btn ${v.g ? '' : 'dis'}" onclick="bankWd()">Withdraw all</span></div>
  <div class="card">${ico('chest')} Stash: ${S.stashMax || 40} slots <span class="btn ${S.gold < stashCost() ? 'dis' : ''}" onclick="buyStash()">+10 slots: ${fmt(stashCost())}g</span></div><span class="btn" onclick="closeMenu()">Leave</span>`; };
// ---------- ORACLE: weekly prophecy + Rebirth ----------
const PROPH = {
  slayer: { n: 'Prophecy of the Slayer', d: '+20% damage to elites and guardians', f: s => s.elite += 20 },
  hoard:  { n: 'Prophecy of the Hoard', d: '+35% gold find', f: s => s.gold += 35 },
  sage:   { n: 'Prophecy of the Sage', d: '+20% experience', f: s => s.xp += 20 },
  bastion:{ n: 'Prophecy of the Bastion', d: '+8% damage reduction', f: s => s.dr += 8 },
  storm:  { n: 'Prophecy of the Storm', d: '+20% skill damage, +6% cooldown reduction', f: s => { s.skill += 20; s.cdr += 6; } },
  seeker: { n: 'Prophecy of the Seeker', d: '+30% magic find', f: s => s.luck += 30 },
};
function prophChoices() { const w = weekId(), ks = Object.keys(PROPH), out = []; let x = w; while (out.length < 3) { x = (x * 1103515245 + 12345) % 2147483648; const k = ks[(x >>> 16) % ks.length]; if (!out.includes(k)) out.push(k); } return out; }
function takeProph(k) { S.prophecy = { k, w: weekId() }; calcStats(); sfx('legend'); toast(`${ico('oracle')} ${PROPH[k].n}: ${PROPH[k].d} until the week turns`, '#b0a0ff'); stallDone('oracle'); saveGame(); renderMenu(); }
const REBIRTH_LVL = 60;
function doRebirth() { if (S.lvl < REBIRTH_LVL) return; S.lvlHi = Math.max(S.lvlHi || 0, S.lvl); let spent = 0; for (const k in S.sk) spent += S.sk[k]; const levelSP = (S.lvl - 1) + Math.floor(S.lvl / 10); S.rebirth = (S.rebirth || 0) + 1; S.sp = Math.max(0, S.sp + spent - levelSP) + 2; S.lvl = 1; S.xp = 0; S.sk = {}; S.bind = [null, null, null, null]; S.stats.rebirths = S.rebirth; calcStats(); P.hp = ST.maxHp; closeMenu();
  banner(`Rebirth ${S.rebirth}`, `+${S.rebirth * 4}% damage & life, +${S.rebirth * 5}% XP — forever`, '#b0a0ff'); sfx('legend'); screenFlash && screenFlash('rgba(176,160,255,.8)', .5); saveGame(); }
MENUS.oracle = () => { const cur = S.prophecy && S.prophecy.w === weekId() ? S.prophecy.k : null;
  return `<h2>${ico('oracle')} Oracle Ysolde</h2><h3>This week's prophecies <span class="dim">— choose one, it lasts until ${untilStr(nextWeek())} from now</span></h3><div class="regcards">${prophChoices().map(k => `<div class="card ${cur === k ? 'done' : ''}"><b>${PROPH[k].n}</b><div class="up">${PROPH[k].d}</div>${cur === k ? '<span class="up">' + ico('check') + ' Active</span>' : `<span class="btn" onclick="takeProph('${k}')">${cur ? 'Switch to this' : 'Accept'}</span>`}</div>`).join('')}</div>
  <h3>${ico('loop')} Rebirth</h3><div class="dim">At level ${REBIRTH_LVL}+ you may be reborn: you return to level 1 and your skills reset, but you keep all your gear, gold and progress — and gain a permanent <b>+4% damage, +4% life and +5% experience</b> per Rebirth (plus 2 bonus skill points each time). Rebirths so far: <b>${S.rebirth || 0}</b>.</div>
  ${S.lvl >= REBIRTH_LVL ? `<span class="btn" onclick="if(confirm('Rebirth? You will return to level 1 (gear and progress are kept).'))doRebirth()">${ico('loop')} Be Reborn</span>` : `<span class="dim">Reach level ${REBIRTH_LVL} to be reborn (you are level ${S.lvl}).</span>`}<br><span class="btn" onclick="closeMenu()">Leave</span>`; };
// ---------- ARENA MASTER: Endless Arena (PvE waves) ----------
let ARENA = null;
function startArena() { closeMenu(); enterFloor(0, BOSS_F); G.later = []; G.banner = null; G.ens = []; G.boss = null; G.pw = Math.max(G.pw, Math.round(S.lvl * 1.08) + S.diff * 28); G.arena = ARENA = { wave: 0, next: 2, alive: 0 }; banner('The Endless Arena', 'Survive as many waves as you can', '#ff8a6a'); stallDone('arena'); }
{ const _rlY = resetLevel; resetLevel = function () { _rlY(); G.arena = null; }; }
{ const _uA2 = update; update = function (dt) { _uA2(dt); const A = G.arena; if (!A || G.mode !== 'play' || G.menu) return;
  A.alive = G.ens.filter(e => !e.dead && !e.prop).length;
  if (A.alive === 0) { A.next -= dt; if (A.next <= 0) { A.wave++; const pool = REG[Math.min(NREG - 1, Math.floor(A.wave / 3))].en, n = 4 + A.wave; for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), d = rnd(180, 300); const e = mkEnemy(pick(pool), P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, { awake: true, elite: Math.random() < .1 + A.wave * .02 }); if (e) { const k = 1 + A.wave * .12; e.hp *= k; e.maxHp = e.hp; } }
      if (A.wave % 5 === 0) { const M_ = mkBoss(pick(Object.keys(BOSS)), P.x, P.y - 220); M_.hp *= .35 + A.wave * .03; M_.maxHp = M_.hp; G.boss = M_; }
      banner(`Wave ${A.wave}`, A.wave % 5 === 0 ? 'A Guardian joins the fight!' : `${n} foes`, '#ff8a6a'); A.next = 3;
      const best = S.arenaBest || 0; if (A.wave - 1 > best) S.arenaBest = A.wave - 1;
      if ((A.wave - 1) % 5 === 0 && A.wave > 1 && !(S.arenaRw || {})[A.wave - 1]) { S.arenaRw = S.arenaRw || {}; S.arenaRw[A.wave - 1] = 1; S.marks += 10 + A.wave; dropItem(genItem(G.pw + Math.floor(A.wave / 3), { minR: 2, bonus: .2 + A.wave * .02 }), P.x, P.y); toast(`${ico('arena')} Arena milestone: wave ${A.wave - 1}! +${10 + A.wave} Marks and a prize`, '#ff8a6a'); } } } }; }
{ const _dieY = die; die = function () { if (G.arena) { const w = G.arena.wave; S.arenaBest = Math.max(S.arenaBest || 0, w - 1); toast(`${ico('arena')} You fell on wave ${w}. Best: ${S.arenaBest} — no gold lost in the arena`, '#ff8a6a'); } const ar = !!G.arena; _dieY(); if (ar && G.lostGold) { S.gold += G.lostGold; G.lostGold = 0; saveGame(); } }; }
{ const _uhY = updateHUD; updateHUD = function (dt) { _uhY(dt); const el = typeof hudLine === 'function' && hudLine('h-arena'); if (!el) return; setH(el, 'arena', G.arena ? `<span style="color:#ff8a6a">${ico('arena')} Arena wave ${G.arena.wave} • ${G.arena.alive} foes • best ${S.arenaBest || 0}</span>` : ''); }; }
MENUS.arena = () => `<h2>${ico('arena')} Arena Master Tyr</h2><h3>${ico('swords')} Endless Arena</h3><div class="dim">Waves of foes from across the valley, stronger each wave — a Guardian joins every 5th wave. Every 5 waves you survive (first time) earns Marks and a prize. Your best: <b>wave ${S.arenaBest || 0}</b>.</div><span class="btn bigb" onclick="startArena()">Enter the Arena</span>
  <h3>${ico('globe')} Play with friends</h3><div class="dim">Duel a friend or adventure together online.</div><span class="btn" onclick="openMenu('mp')">Open Multiplayer</span><br><span class="btn" onclick="closeMenu()">Leave</span>`;
// ---------- elixirs tick while adventuring ----------
let elixT = 0;
{ const _uE = update; update = function (dt) { _uE(dt); if (!S || G.mode !== 'play' || G.menu || G.inTown || !S.elix) return; elixT += dt; if (elixT < 1) return; let ch = false; for (const k in S.elix) if (S.elix[k] > 0) { S.elix[k] -= elixT; if (S.elix[k] <= 0) { S.elix[k] = 0; ch = true; toast(`${ELIXIRS[k].ic} ${ELIXIRS[k].n} has worn off`, '#a8b8a0'); } } elixT = 0; if (ch) calcStats(); }; }
{ const _uhE = updateHUD; updateHUD = function (dt) { _uhE(dt); const el = H && H['h-buffs']; if (!el || !S || G.mode === 'title') return; let h = ''; for (const k in S.elix || {}) if (S.elix[k] > 0) h += `<div class="buff wart" title="${ELIXIRS[k].n}: ${ELIXIRS[k].d}" style="border-color:#7aff9a">${ELIXIRS[k].ic}<span>${Math.ceil(S.elix[k] / 60)}m</span></div>`; if (S.prophecy && S.prophecy.w === weekId()) h += `<div class="buff wart" title="${PROPH[S.prophecy.k].n}: ${PROPH[S.prophecy.k].d}" style="border-color:#b0a0ff">${ico('oracle')}<span>wk</span></div>`; if (h) el.insertAdjacentHTML('beforeend', h); }; }
// ---------- tips, feats, wiki ----------
Object.assign(MENU_TIP, { alch: 'Elixirs give a strong bonus for 10 minutes of adventuring. One of each kind can be active.', ench: 'Choose a slot, then reroll just one bonus. Costs rise with each enchant on the same item.', carto: 'Stars come from beating, completing and clearing regions on every difficulty.', bank: 'Vault gold grows 2% per real day and is never lost when you fall.', oracle: 'Pick one prophecy per week. Rebirth unlocks at level 60.', arena: 'The Endless Arena is a survival challenge — how many waves can you last?' });
ACH.push(
  { id: 'elix10', n: 'Apprentice Alchemist', d: 'Brew 10 elixirs', c: () => S.stats.elix || 0, need: 10, sp: 0 },
  { id: 'ench10', n: 'Weaver of Fate', d: 'Enchant 10 bonuses', c: () => S.stats.enchants || 0, need: 10, sp: 1 },
  { id: 'star25', n: 'Seasoned Explorer', d: 'Earn 25 region stars', c: () => totalStars(), need: 25, sp: 1 },
  { id: 'star100', n: 'Master Cartographer', d: 'Earn 100 region stars', c: () => totalStars(), need: 100, sp: 3 },
  { id: 'arena10', n: 'Crowd Favourite', d: 'Survive 10 Arena waves', c: () => S.arenaBest || 0, need: 10, sp: 1 },
  { id: 'arena30', n: 'Champion of the Pit', d: 'Survive 30 Arena waves', c: () => S.arenaBest || 0, need: 30, sp: 2 },
  { id: 'reb1', n: 'Born Again', d: 'Be reborn once', c: () => S.rebirth || 0, need: 1, sp: 2 },
  { id: 'reb5', n: 'Eternal Flame', d: 'Be reborn 5 times', c: () => S.rebirth || 0, need: 5, sp: 4 },
  { id: 'vault', n: 'Compound Interest', d: 'Hold 1,000,000 gold in the vault', c: () => (S.vault && S.vault.g) || 0, need: 1e6, sp: 1 },
);
WIKI_TXT.world.push(
  ['Haven Stalls (later)', Object.values(NEW_STALLS).map(s => `${s.ic} ${s.n} (level ${s.lvl}) — ${s.role}`).join(' • ') + '.'],
  ['Elixirs', 'Alchemist Vael brews 5 elixirs (Might, Ironhide, Wisdom, Lucky Brew, Quicksilver). Each lasts 10 minutes of adventuring — the timer only runs outside Haven.'],
  ['Enchanting', 'Enchanter Oren rerolls ONE chosen bonus on an equipped item. Every enchant on the same item costs more shards and gold.'],
  ['Region Stars', 'Each region has 3 stars per difficulty (48 regions×difficulties, 144 stars): defeat its Guardian, clear all 7 floors, and fully clear 3 floors there. Cartographer Wren pays 15 Marks + a gem every 5 stars, and every 10 stars gives +1% damage permanently. Map Scrolls reveal a whole floor.'],
  ['Vault & Interest', 'Banker Goldwyn holds gold that earns 2% per real day (up to 30 days at a time) and is never lost on death. He also sells stash expansions.'],
  ['Prophecies & Rebirth', 'Oracle Ysolde offers 3 prophecies each week; choose one for a week-long bonus. From level 60 you can be Reborn: back to level 1 with skills reset, keeping all gear and progress, for +4% damage, +4% life and +5% XP per Rebirth, forever.'],
  ['Endless Arena', 'Arena Master Tyr runs a survival arena: endless, ever-stronger waves with a Guardian every 5th wave. Each 5-wave milestone pays Marks and an item the first time. Your best wave is recorded.'],
);
const stY = document.createElement('style'); stY.textContent = `.atlas{display:grid;grid-template-columns:repeat(2,1fr);gap:3px 14px;margin:6px 0}.atl{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;padding:3px 8px;border-radius:8px;background:rgba(0,0,0,.18)}.atl span{letter-spacing:1px}`; document.head.appendChild(stY);
