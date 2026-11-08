// ================= LONG-TERM PACK 2: gear refresh, lineage, nemesis, expeditions, weekly hunts, ledger, renown, haven 4-5, pet evolution, challenge totems, kill streaks =================
// ---------- one-time gear refresh: bring every owned item up to the current rules ----------
const GEAR_VER = 4;
function refreshItem(it) {
  if (!it || it.art) return;
  if (WGT_SLOTS.includes(it.slot) && !it.wgt) it.wgt = ['light', 'medium', 'heavy'][it.id % 3];
  const want = RAR[it.r] ? RAR[it.r].aff : it.aff.length;
  for (const a of it.aff) { const A = AFF[a.k]; if (!A) continue; let lo = A.min * (1 + .12 * it.r), hi = A.max * (1 + .12 * it.r); if (A.sc) { lo *= Math.pow(A.sc, it.il); hi *= Math.pow(A.sc, it.il); } a.v = clamp(a.v, lo, hi); a.v = a.v >= 100 ? Math.round(a.v) : Math.round(a.v * 10) / 10; }
  if (it.aff.length < want) { const old = it.aff.slice(); rollAffixes(it); it.aff = old.concat(it.aff.filter(a => !old.some(o => o.k === a.k))).slice(0, want); }
  if (it.r >= 4 && !it.u) it.u = pick(it.slot === 'weapon' ? UNQ_W : UNQ_A);
  if (it.r >= 7 && !it.u2) it.u2 = pick((it.slot === 'weapon' ? UNQ_W : UNQ_A).filter(u => u !== it.u));
  const cap = maxPw() + 3; if (it.il > cap) it.il = cap;
  const awk = it.awk; it.name = (awk ? '✧ ' : '') + itemName(it).replace(/^(\u272A|✧) /, '');
}
function refreshGear(force) {
  if (!S || (!force && (S.gearVer || 0) >= GEAR_VER)) return 0; let n = 0;
  for (const it of [...S.inv, ...S.stash, ...Object.values(S.eq)]) if (it) { refreshItem(it); n++; }
  S.gearVer = GEAR_VER; calcStats(); if (P) { P.hp = Math.min(P.hp, ST.maxHp); }
  if (n && !force) G.later.push({ t: 1.5, fn: () => toast(`${ico('gears')} Your ${n} items were updated to the new weapon & armor balance`, '#9ad0ff') });
  saveGame(); return n;
}
{ const _cgL = continueGame; continueGame = function () { _cgL(); refreshGear(); }; }
{ const _ngL = newGame; newGame = function (c) { _ngL(c); if (S) S.gearVer = GEAR_VER; }; }

// ---------- Weapon Lineage & Battle-worn armor: your own items grow with you ----------
const LIN_T = [[100, 'Blooded', 2], [500, 'Veteran', 4], [2000, 'Storied', 7], [10000, 'Legendary', 10], [40000, 'Mythic', 14]];
const WORN_T = [[60, 'Scuffed', 2], [300, 'Battle-worn', 4], [1200, 'Hardened', 7], [5000, 'Unbreakable', 10], [20000, 'Eternal', 14]];
function tierOf(T, n) { let t = null; for (const x of T) if (n >= x[0]) t = x; return t; }
{ const _isL = itemStats; itemStats = function (it) { const o = _isL(it);
  if (it.slot === 'weapon' && it.kills) { const t = tierOf(LIN_T, it.kills); if (t && o.wdmg) o.wdmg *= 1 + t[2] / 100; }
  if (WGT_SLOTS.includes(it.slot) && it.worn) { const t = tierOf(WORN_T, it.worn); if (t && o.hp) o.hp *= 1 + t[2] / 100; }
  return o; }; }
function bumpLineage(it, key, T, label) { const t0 = tierOf(T, it[key] || 0); it[key] = (it[key] || 0) + 1; const t1 = tierOf(T, it[key]); if (t1 && t1 !== t0) { calcStats(); toast(`${label} <span style="color:${RAR[it.r].c}">${it.name}</span> is now <b>${t1[1]}</b> (+${t1[2]}%)`, '#ffd27a'); sfx('shrine'); } }
{ const _itL = itemTip; itemTip = function (it, cmp) { let h = _itL(it, cmp);
  if (it.slot === 'weapon') { const t = tierOf(LIN_T, it.kills || 0), nx = LIN_T.find(x => (it.kills || 0) < x[0]); h += `<div style="font-size:12px;color:#e8b070">${ico('swords')} Lineage: ${t ? `<b>${t[1]}</b> (+${t[2]}% damage)` : 'Fresh'} — ${fmt(it.kills || 0)} kills${nx ? ` <span class="dim">• ${nx[1]} at ${fmt(nx[0])}</span>` : ''}</div>`; }
  if (WGT_SLOTS.includes(it.slot)) { const t = tierOf(WORN_T, it.worn || 0), nx = WORN_T.find(x => (it.worn || 0) < x[0]); h += `<div style="font-size:12px;color:#a8c0e0">${ico('shield')} Battle-worn: ${t ? `<b>${t[1]}</b> (+${t[2]}% life)` : 'Pristine'} — ${fmt(it.worn || 0)} hits taken${nx ? ` <span class="dim">• ${nx[1]} at ${fmt(nx[0])}</span>` : ''}</div>`; }
  return h; }; }

// ---------- Renown: a long ladder of ranks from everything you accomplish ----------
const RENOWN = ['Unknown', 'Wanderer', 'Ember-Sworn', 'Torchbearer', 'Warden\'s Hand', 'Hero of Haven', 'Valley Champion', 'Flamekeeper', 'Ashbreaker', 'Legend of Embervale', 'Living Myth', 'The Undying Ember'];
const REN_STEP = 150;
function renownRank() { return Math.min(RENOWN.length - 1 + 20, Math.floor((S.renown || 0) / REN_STEP)); }
function renownName(r) { return r < RENOWN.length ? RENOWN[r] : `${RENOWN[RENOWN.length - 1]} ${r - RENOWN.length + 2}`; }
function addRenown(n, why) { const r0 = renownRank(); S.renown = (S.renown || 0) + n; const r1 = renownRank(); if (why) feed(`${ico('renown')} +${n} Renown — ${why}`, '#e0c070'); if (r1 > r0) { banner('Renown Rank Up!', `${renownName(r1)} — +1% damage & +1% life`, '#e0c070'); sfx('legend'); calcStats(); } }
{ const _cqL = claimQuest; claimQuest = function (i) { const q = S.quests[i]; _cqL(i); if (q && S.quests[i] !== q) addRenown(6, 'bounty'); }; }
{ const _stL = sqTurnIn; sqTurnIn = function (q) { _stL(q); addRenown(30, 'Haven request'); }; }

// ---------- Collector's Ledger: permanent bonuses for collecting everything ----------
const LEDGER = [
  { k: 'wt', n: 'Weapon types found', ic: ico('swords'), c: () => Object.keys(S.found.w || {}).length, t: [5, 10, 15, 20], b: '+1% damage', f: s => s.dmg += 1 },
  { k: 'un', n: 'Legendary powers found', ic: ico('star'), c: () => Object.keys(S.found.u || {}).length, t: [5, 12, 18, Object.keys(UNQ).length], b: '+3% crit damage', f: s => s.critD += 3 },
  { k: 'mo', n: 'Monster types slain', ic: ico('wolf-head'), c: () => Object.keys(S.best || {}).filter(k => S.best[k].k > 0).length, t: [10, 25, 45, 70], b: '+2% experience', f: s => s.xp += 2 },
  { k: 'ra', n: 'Rarities discovered', ic: ico('gem'), c: () => Object.keys(S.stats.rar || {}).filter(r => S.stats.rar[r] > 0).length + (S.found.art && Object.keys(S.found.art).length ? 1 : 0), t: [4, 6, 8, 10], b: '+4% magic find', f: s => s.luck += 4 },
  { k: 'se', n: 'Set pieces found', ic: ico('set-piece'), c: () => Object.values(S.found.set || {}).reduce((a, o) => a + Object.keys(o).length, 0), t: [3, 8, 14, 24], b: '+2% max life', f: s => s.hpPct += 2 },
  { k: 'pg', n: 'Lost Pages read', ic: ico('book'), c: () => S.pages.length, t: [6, 12, 18, 24], b: '+2% skill damage', f: s => s.skill += 2 },
  { k: 'fl', n: 'Floors fully cleared', ic: ico('broom'), c: () => S.stats.cleared || 0, t: [10, 50, 200, 800], b: '+1% damage reduction', f: s => s.dr += 1 },
  { k: 'ne', n: 'Nemeses defeated', ic: ico('skull'), c: () => S.stats.nemesis || 0, t: [1, 3, 8, 20], b: '+2% damage to elites', f: s => s.elite += 2 },
  { k: 'ex', n: 'Expeditions completed', ic: ico('compass'), c: () => S.stats.exped || 0, t: [3, 15, 50, 150], b: '+3% gold find', f: s => s.gold += 3 },
  { k: 'hu', n: 'Weekly Hunts completed', ic: ico('hunt'), c: () => S.stats.hunts || 0, t: [1, 6, 20, 60], b: '+1% attack speed', f: s => s.atkSpd += 1 },
];
function ledgerClaimed(k) { return (S.ledger && S.ledger[k]) || 0; }
function claimLedger(k) { const L = LEDGER.find(x => x.k === k), n = ledgerClaimed(k); if (!L || n >= L.t.length || L.c() < L.t[n]) return; S.ledger = S.ledger || {}; S.ledger[k] = n + 1; const m = 15 + n * 15; S.marks += m; addRenown(20 + n * 10, 'ledger tier'); calcStats(); sfx('legend'); toast(`${ico('ledger')} Ledger: ${L.n} tier ${n + 1} — ${L.b} & ${ico('marks')} ${m} Marks`, '#ffd27a'); saveGame(); renderMenu(); }
const _xsL = extraStats;
extraStats = function (s) {
  _xsL(s); if (!S) return;
  for (const L of LEDGER) for (let i = 0; i < ledgerClaimed(L.k); i++) L.f(s);
  const r = renownRank(); s.dmg += r; s.hpPct += r;
  const k = S.cos && S.cos.pet; if (k && PETS[k] && S.petEvo && S.petEvo[k]) { const z = { xp: 0, gold: 0, moveSpd: 0, ls: 0, hpPct: 0, cdr: 0, luck: 0, skill: 0, elite: 0, atkSpd: 0, dmg: 0, critD: 0, critC: 0 }; PETS[k].f(z); for (const q in z) s[q] += z[q] * .8; }
};
MENUS.ledger = () => { const r = renownRank(), into = (S.renown || 0) - r * REN_STEP;
  let h = `<h2>${ico('ledger')} Collector's Ledger & Renown</h2><div class="card"><b style="color:#e0c070;font-size:16px">${ico('renown')} ${renownName(r)}</b> <span class="dim">Rank ${r} • ${fmt(S.renown || 0)} Renown</span><div class="qbar"><div style="width:${into / REN_STEP * 100}%"></div></div><span class="dim">${fmt(REN_STEP - into)} to the next rank. Each rank: +1% damage and +1% max life (now +${r}%). Earn Renown from bounties, Haven requests, Weekly Hunts, Nemesis kills, Challenge Totems, expeditions and Ledger tiers.</span></div>
  <div class="dim">Collect everything Embervale has to offer. Each tier you claim grants a permanent bonus and Ember Marks.</div><div class="regcards">`;
  for (const L of LEDGER) { const n = ledgerClaimed(L.k), v = L.c(), nx = L.t[n], can = nx !== undefined && v >= nx;
    h += `<div class="card ${n >= L.t.length ? 'done' : ''}"><b>${L.ic} ${L.n}</b> <span class="dim">${fmt(v)}${nx !== undefined ? ' / ' + fmt(nx) : ''}</span><div style="font-size:12px">Tier ${n} / ${L.t.length} — each tier: <span class="up">${L.b}</span></div><div class="qbar"><div style="width:${nx !== undefined ? Math.min(100, v / nx * 100) : 100}%"></div></div>${can ? `<span class="btn" onclick="claimLedger('${L.k}')">Claim tier ${n + 1}</span>` : n >= L.t.length ? '<span class="up">★ Complete</span>' : ''}</div>`; }
  return h + `</div><span class="btn" onclick="backHub()">Back</span>`; };

// ---------- Nemesis: the monster that kills you comes back stronger ----------
const NEM_NAMES = ['Grudgebearer', 'the Unforgiving', 'Doomhound', 'the Patient', 'Kindlebane', 'the Hollow Grin', 'Ashmaw', 'the Relentless', 'Gravecaller', 'the Last Laugh'];
let NEM_SRC = null;
{ const _hpL = hurtPlayer; hurtPlayer = function (amt, src) { NEM_SRC = src && !src.dead && !src.prop ? src : null; return _hpL(amt, src); }; }
{ const _rlN = resetLevel; resetLevel = function () { _rlN(); NEM_SRC = null; }; }
{ const _dieL = die; die = function () { const src = NEM_SRC; NEM_SRC = null; _dieL();
  if (G.tutorial || G.trial || !src || src.boss || !EN[src.type] || src.type === 'tsentry') return;
  const N = S.nemesis;
  if (N && src.nemesis) { N.lvl = Math.min(20, N.lvl + 1); N.kills = (N.kills || 0) + 1; toast(`${ico('skull')} ${N.n} grows stronger from your defeat (Nemesis Lv ${N.lvl})`, '#ff6a6a'); }
  else if (!N) { S.nemesis = { t: src.type, n: `${EN[src.type].n.split(' ').pop()} ${pick(NEM_NAMES)}`, lvl: 1, kills: 1 }; G.later.push({ t: .5, fn: () => toast(`${ico('skull')} <b>${S.nemesis.n}</b> has become your Nemesis. It will hunt you…`, '#ff6a6a') }); } }; }
function spawnNemesis() {
  const N = S.nemesis; const p = spotM(); if (!N || !p || !EN[N.t]) return;
  const e = mkEnemy(N.t, p.x, p.y, { elite: true }); if (!e) return; e.nemesis = 1; e.hp *= 2 + N.lvl * .5; e.maxHp = e.hp; e.dmg *= 1 + N.lvl * .12; e.r *= 1.2; e.d = { ...e.d, n: N.n }; e.xp *= 3 + N.lvl; e.gold *= 3 + N.lvl;
  G.later.push({ t: 2, fn: () => toast(`${ico('skull')} Your Nemesis <b>${N.n}</b> (Lv ${N.lvl}) is on this floor!`, '#ff6a6a') });
}
{ const _kL = killEnemy; killEnemy = function (e) { if (e.dead) return; _kL(e);
  if (!e.prop && e.type !== 'dummy') { const w = S.eq.weapon; if (w && !G.tutorial) bumpLineage(w, 'kills', LIN_T, ico('swords') + ' Your'); }
  if (e.nemesis && S.nemesis) { const N = S.nemesis; S.stats.nemesis = (S.stats.nemesis || 0) + 1; const m = 10 + N.lvl * 5; S.marks += m; for (let i = 0; i < 1 + Math.floor(N.lvl / 4); i++) dropItem(genItem(G.pw + 2, { minR: 3, bonus: .15 * N.lvl }), e.x, e.y); dropGem(e.x, e.y);
    banner('Nemesis Vanquished!', `${N.n} (Lv ${N.lvl}) — +${m} Marks`, '#ff6a6a'); addRenown(20 + N.lvl * 5, 'Nemesis slain'); S.nemesis = null; sfx('legend'); shake(12); }
  killStreak(e); }; }
{ const _hpL2 = hurtPlayer; hurtPlayer = function (amt, src) { const h0 = P.hp; const r = _hpL2(amt, src); if (P.hp < h0 && !G.tutorial) for (const sl of WGT_SLOTS) { const it = S.eq[sl]; if (it) bumpLineage(it, 'worn', WORN_T, ico('shield') + ' Your'); } return r; }; }

// ---------- Kill streaks ----------
const STREAKS = [[5, 'Killing Spree', '#ffd27a'], [10, 'Rampage', '#ffb04a'], [20, 'Unstoppable', '#ff7a3a'], [35, 'Godlike', '#ff4aff'], [60, 'Legendary Massacre', '#7ffcff']];
let streakN = 0, streakT = 0, streakTop = 0;
function killStreak(e) { if (e.prop || e.type === 'dummy' || G.inTown) return; streakN = G.t - streakT < 3 ? streakN + 1 : 1; streakT = G.t;
  const s = STREAKS.find(x => x[0] === streakN); if (s) { addSurge(6 + streakN * .6); dmgText(P.x, P.y - 44, `${s[1]}!`, s[2], true, 3.2); sfx('crit'); S.stats.bestStreak = Math.max(S.stats.bestStreak || 0, streakN); if (streakN >= 20) shake(6); } }

// ---------- Weekly Hunts: three tough contracts every week ----------
const HUNT_POOL = [
  { k: 'champs', t: 'Slay {n} Champions', s: () => S.stats.champs || 0, n: 5 },
  { k: 'elites', t: 'Slay {n} elites', s: () => S.stats.elites || 0, n: 80 },
  { k: 'bosses', t: 'Defeat {n} Guardians', s: () => S.stats.bosses || 0, n: 6 },
  { k: 'cleared', t: 'Fully clear {n} floors', s: () => S.stats.cleared || 0, n: 12 },
  { k: 'secrets', t: 'Break open {n} secret rooms', s: () => S.stats.secrets || 0, n: 3 },
  { k: 'braziers', t: 'Open {n} Ember Vaults', s: () => S.stats.braziers || 0, n: 2 },
  { k: 'totems', t: 'Win {n} Challenge Totems', s: () => S.stats.totems || 0, n: 3 },
  { k: 'kills', t: 'Slay {n} foes', s: () => S.stats.kills || 0, n: 1500 },
  { k: 'floors', t: 'Descend {n} floors', s: () => S.stats.floors || 0, n: 40 },
  { k: 'golden', t: 'Slay {n} golden monsters', s: () => S.stats.golden || 0, n: 3 },
];
function huntState() { const w = weekId(); if (!S.hunt || S.hunt.w !== w) { let x = w; const pool = HUNT_POOL.slice(), list = []; while (list.length < 3) { x = (x * 9301 + 49297) % 233280; list.push(pool.splice(x % pool.length, 1)[0].k); } S.hunt = { w, list, base: Object.fromEntries(list.map(k => [k, HUNT_POOL.find(h => h.k === k).s()])), done: {} }; } return S.hunt; }
function huntProg(k) { const H_ = huntState(), h = HUNT_POOL.find(x => x.k === k); return Math.min(h.n, h.s() - (H_.base[k] || 0)); }
function claimHunt(k) { const H_ = huntState(), h = HUNT_POOL.find(x => x.k === k); if (H_.done[k] || huntProg(k) < h.n) return; H_.done[k] = 1; S.stats.hunts = (S.stats.hunts || 0) + 1; S.marks += 40; S.frag += 2;
  const it = genItem(maxPw() + 2, { minR: 3, bonus: .4 }); it.isNew = true; (S.inv.length < S.invMax ? S.inv : S.stash).push(it); noteFound(it); addGem(pick2(Object.keys(GEMS)), gemTier()); addRenown(40, 'Weekly Hunt');
  sfx('legend'); toast(`${ico('hunt')} Hunt complete! ${ico('marks')} 40 Marks, ✧ 2 Fragments, a gem and <span style="color:${RAR[it.r].c}">${it.name}</span>`, '#ffd27a'); saveGame(); renderMenu(); }
{ const _qmL = MENUS.quests; MENUS.quests = () => { const H_ = huntState();
  const rows = H_.list.map(k => { const h = HUNT_POOL.find(x => x.k === k), p = huntProg(k), d = H_.done[k]; return `<div class="card ${d ? 'done' : ''}"><b>${ico('hunt')} ${h.t.replace('{n}', fmt(h.n))}</b> <span class="dim">${fmt(p)} / ${fmt(h.n)}</span><div class="qbar"><div style="width:${p / h.n * 100}%"></div></div><span class="dim">Reward: ${ico('marks')} 40 Marks • ✧ 2 Fragments • ${ico('gem')} gem • Epic+ item • ${ico('renown')} 40 Renown</span><br>${d ? `<span class="up">${ico('check')} Claimed</span>` : p >= h.n ? `<span class="btn" onclick="claimHunt('${k}')">Claim</span>` : ''}</div>`; }).join('');
  return _qmL().replace('<h3>' + ico('haven') + ' Haven Requests', `<h3>${ico('hunt')} Weekly Hunts <span class="dim">new contracts in ${untilStr(nextWeek())}</span></h3><div class="regcards">${rows}</div><h3>${ico('haven')} Haven Requests`); }; }

// ---------- Expeditions: send villagers out while you play (or while you're away) ----------
const EXP_DUR = [[1, '1 hour'], [4, '4 hours'], [12, '12 hours']];
let EXP_SEL = { reg: 0, dur: 1 };
function expSlots() { return 1 + Math.min(2, Math.floor((S.rescued || []).length / 3)); }
function expWho() { return [...VILLAGERS.map(v => v.n), ...(S.rescued || [])]; }
function expReward(reg, h) { const pw = Math.min(reg * 7 + 3 + S.diff * 28, 120), m = Math.pow(1.12, pw) * Math.pow(h, .85); return { gold: Math.round(140 * m), ore: Math.round(2 + 1.6 * h), shards: Math.round(5 + 5 * h), gems: Math.floor(h / 4) + 1, marks: Math.round(2 * h), item: h >= 4 }; }
function expUnlocked() { const a = [0]; for (let r = 1; r < NREG; r++) if (S.done[0][r - 1]) a.push(r); return a; }
function startExped(who) { S.exped = S.exped || []; if (S.exped.length >= expSlots()) return; const { reg, dur } = EXP_SEL; S.exped.push({ who, reg, h: dur, t0: Date.now() }); sfx('click'); toast(`${ico('compass')} ${who} sets out for ${REG[reg].n} (${dur}h)`, '#9ad0ff'); saveGame(); renderMenu(); }
function collectExped(i) { const x = S.exped[i]; if (!x || Date.now() < x.t0 + x.h * 36e5) return; const r = expReward(x.reg, x.h);
  S.gold += r.gold; S.ore += r.ore; S.shards += r.shards; S.marks += r.marks; for (let g = 0; g < r.gems; g++) addGem(pick2(Object.keys(GEMS)), gemTier());
  let got = ''; if (r.item) { const it = genItem(x.reg * 7 + 4 + S.diff * 28, { minR: x.h >= 12 ? 3 : 2 }); it.isNew = true; (S.inv.length < S.invMax ? S.inv : S.stash).push(it); noteFound(it); got = ` and <span style="color:${RAR[it.r].c}">${it.name}</span>`; }
  S.exped.splice(i, 1); S.stats.exped = (S.stats.exped || 0) + 1; addRenown(4 + x.h, 'expedition'); sfx('legend');
  toast(`${ico('compass')} ${x.who} returns from ${REG[x.reg].n}: ${fmt(r.gold)} gold, ${r.ore} ore, ${r.shards} shards, ${r.gems} gem${r.gems > 1 ? 's' : ''}${got}`, '#9ad0ff'); saveGame(); renderMenu(); }
function expLeft(x) { const ms = x.t0 + x.h * 36e5 - Date.now(); if (ms <= 0) return null; const h = Math.floor(ms / 36e5), m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1000) % 60; return h ? `${h}h ${m}m` : `${m}m ${s}s`; }
MENUS.exped = () => { S.exped = S.exped || []; const busy = S.exped.map(x => x.who), free = expWho().filter(n => !busy.includes(n)), un = expUnlocked(); if (!un.includes(EXP_SEL.reg)) EXP_SEL.reg = un[un.length - 1]; const rw = expReward(EXP_SEL.reg, EXP_SEL.dur);
  let h = `<h2>${ico('compass')} Expeditions <span class="dim">${S.exped.length} / ${expSlots()} parties out</span></h2><div class="dim">Send Haven's villagers to scavenge regions you've opened. They travel in real time — even while the game is closed — and come back with gold, ore, shards, gems and Marks. Longer trips and deeper regions bring more. Rescue captives to unlock more parties (one per 3 rescued).</div>`;
  h += S.exped.map((x, i) => { const l = expLeft(x); return `<div class="card ${l ? '' : 'done'}"><b>${x.who}</b> → ${REG[x.reg].n} <span class="dim">(${x.h}h)</span> ${l ? `<span class="dim">returns in ${l}</span>` : `<span class="btn" onclick="collectExped(${i})">${ico('check')} Collect</span>`}</div>`; }).join('');
  if (S.exped.length < expSlots()) { h += `<h3>Plan a new expedition</h3><div>Destination: ${un.map(r => `<span class="btn ${EXP_SEL.reg === r ? 'on' : ''}" style="font-size:12px" onclick="EXP_SEL.reg=${r};renderMenu()">${REG[r].n}</span>`).join('')}</div><div>Duration: ${EXP_DUR.map(([d, n]) => `<span class="btn ${EXP_SEL.dur === d ? 'on' : ''}" onclick="EXP_SEL.dur=${d};renderMenu()">${n}</span>`).join('')}</div>
    <div class="dim">Expected haul: ${fmt(rw.gold)} gold • ${rw.ore} ore • ${rw.shards} shards • ${rw.gems} gem${rw.gems > 1 ? 's' : ''} • ${rw.marks} Marks${rw.item ? ` • a ${EXP_SEL.dur >= 12 ? 'Epic' : 'Rare'}+ item` : ''}</div><div>Send: ${free.length ? free.map(n => `<span class="btn" onclick="startExped('${n.replace(/'/g, "\\'")}')">${n}</span>`).join('') : '<span class="dim">everyone is out</span>'}</div>`; }
  return h + `<br><span class="btn" onclick="backHub()">Back</span>`; };
{ const _gtL = goTown; goTown = function () { _gtL(); const n = (S.exped || []).filter(x => !expLeft(x)).length; if (n) G.later.push({ t: 1.2, fn: () => toast(`${ico('compass')} ${n} expedition${n > 1 ? 's have' : ' has'} returned — open Expeditions in the ☰ Menu`, '#9ad0ff') }); }; }
HUB.push(['exped', ico('compass'), 'Expeditions', 'Send villagers out', ''], ['ledger', ico('ledger'), 'Ledger & Renown', 'Collect & rank up', '']);

// ---------- Haven buildings go to level 5 ----------
HAVEN_COST.push(180000, 900000);
buildHaven = function (k) { const l = havenL(k); if (l >= 5) return; const c = havenCost(l); if (S.gold < c) { toast('Not enough gold'); sfx('error'); return; } S.gold -= c; S.haven = S.haven || {}; S.haven[k] = l + 1; calcStats(); sfx('legend'); toast(`${ico('restore')} ${HAVEN_B[k].n} restored to level ${l + 1}!`, '#ffd27a'); addRenown(10 + l * 5, 'Haven restored'); saveGame(); if (G.inTown) buildLevel(); renderMenu(); };
MENUS.haven = () => { let h = `<h2>${ico('restore')} Restore Haven</h2><div class="dim">Pour your gold back into the last village. Every level gives a permanent bonus. Levels 4 and 5 are grand restorations for the truly dedicated.</div>`;
  for (const k in HAVEN_B) { const B = HAVEN_B[k], l = havenL(k); h += `<div class="smrow" style="padding:6px 0"><div style="font-size:28px;width:40px">${B.ic}</div><div class="nm"><b>${B.n}</b> <span class="dim">Level ${l}/5</span><br>${l ? `<span class="up">${B.d(l)}</span>` : '<span class="dim">Ruined</span>'}${l < 5 ? ` <span class="dim">→ next: ${B.d(l + 1)}</span>` : ''}</div>${l < 5 ? `<span class="btn ${S.gold < havenCost(l) ? 'dis' : ''}" onclick="buildHaven('${k}')">Restore: ${fmt(havenCost(l))}g</span>` : '<span class="up">★ Grandly restored</span>'}</div>`; }
  return h + `<br><span class="btn" onclick="backHub()">Back</span>`; };

// ---------- Pet evolution ----------
function evoCost() { return { marks: 150, frag: 5 }; }
function evolvePet(k) { const c = evoCost(); if (petLvl(k) < 10 || (S.petEvo && S.petEvo[k])) return; if (S.marks < c.marks || S.frag < c.frag) { toast('Need ' + ico('marks') + ' 150 Marks and ✧ 5 Fragments', '#ff8a8a'); sfx('error'); return; }
  S.marks -= c.marks; S.frag -= c.frag; S.petEvo = S.petEvo || {}; S.petEvo[k] = 1; R3.petK = null; calcStats(); banner('Companion Evolved!', `${PETS[k].n} — bonus +80%, fetches loot from further away`, '#7affd0'); sfx('legend'); addRenown(25, 'pet evolved'); saveGame(); renderMenu(); }
{ const _wdL = MENUS.wardrobe; MENUS.wardrobe = () => { const k = S.cos.pet; let h = _wdL(); if (k && PETS[k]) { const ev = S.petEvo && S.petEvo[k];
  h = h.replace('<h3>Companion</h3>', `<h3>Companion</h3><div class="card" style="margin-bottom:6px">${ico('paw')} <b>${PETS[k].n}</b> — Lv ${petLvl(k)}/10 ${ev ? '<span style="color:#7affd0">✦ Evolved</span>' : petLvl(k) >= 10 ? `<span class="btn" onclick="evolvePet('${k}')">✦ Evolve (${ico('marks')} 150 Marks + ✧ 5 Fragments)</span>` : '<span class="dim">Reach level 10 to evolve: +80% bonus, faster & stronger attacks, bigger and glowing.</span>'}</div>`); } return h; }; }
{ const _rpL = render3D; render3D = function (dt) { _rpL(dt); const k = S && S.cos && S.cos.pet; if (R3 && R3.petM && k && S.petEvo && S.petEvo[k]) { R3.petM.scale.setScalar(.27); if (Math.random() < .3 && R3.petPos) G.parts.push({ x: R3.petPos.x + rnd(-8, 8), y: R3.petPos.y + rnd(-8, 8), z: .5, vx: 0, vy: 0, vz: .8, g: 0, life: .6, max: .6, col: PETS[k].col, size: 3 }); } }; }
{ const _uP = update; update = function (dt) { if (S && G.mode === 'play' && (S.gearVer || 0) < GEAR_VER) refreshGear(); const k = S && S.cos && S.cos.pet, evo = k && S.petEvo && S.petEvo[k]; if (evo && G.petT > 0) G.petT -= dt * .6; const n0 = G.pp ? G.pp.length : 0; _uP(dt); if (evo && G.pp) for (let i = n0; i < G.pp.length; i++) if (G.pp[i].kind === 'spark' && G.pp[i].child && G.pp[i].col === PETS[k].col) G.pp[i].dmg *= 1.2; }; }

// ---------- Challenge Totems: survive the waves for a reward ----------
{ const _popL = populate; populate = function (R) { _popL(R); if (G.trial || G.tutorial) return; if (S.nemesis && Math.random() < .25) spawnNemesis(); if (Math.random() < .14) { const p = spotM(); if (p) G.totem = { ...p, st: 0, t: 0, wave: 0 }; } }; }
{ const _rlL = resetLevel; resetLevel = function () { _rlL(); G.totem = null; }; }
function totemWave() { const T = G.totem, R = curReg(), n = 4 + T.wave + S.diff; for (let i = 0; i < n; i++) { const p = randFloorNear(P.x, P.y, 160, 280, 14); if (!p) continue; const e = mkEnemy(pick(R.en), p.x, p.y, { awake: true, elite: Math.random() < .2 + T.wave * .05 }); if (e) e.totem = 1; } T.wave++; ringFx(T.x, T.y, 200, '#ff6a3a', .5); sfx('boss'); }
{ const _uT = update; update = function (dt) { _uT(dt); const T = G.totem; if (!T || G.mode !== 'play' || G.menu || G.inTown) return;
  if (T.st === 0 && dist(P, T) < 46) { T.st = 1; T.t = 40; T.next = 0; banner('Challenge Accepted!', 'Survive 40 seconds of waves', '#ff6a3a'); }
  if (T.st === 1) { T.t -= dt; T.next -= dt; if (T.next <= 0 && T.t > 6) { T.next = 8; totemWave(); }
    if (T.t <= 0) { const left = G.ens.filter(e => e.totem && !e.dead).length; if (left === 0 || T.t < -20) { T.st = 2; S.stats.totems = (S.stats.totems || 0) + 1; G.chests.push({ x: T.x + 30, y: T.y, open: false, mimic: false, t: 0 }); for (let i = 0; i < 2; i++) dropItem(genItem(G.pw + 2, { minR: 2, bonus: .3 }), T.x, T.y); S.marks += 5; gainXP(xpNeed(S.lvl) * .08 / (1 + ST.xp / 100)); addRenown(10, 'Challenge Totem'); banner('Challenge Complete!', 'A reward chest appears', '#7aff7a'); sfx('legend'); buildLevel(); } } } }; }
{ const _beL = buildExtras; buildExtras = function () { _beL(); const T = G.totem; if (!T) return; const g = new T3.Group(); g.position.set(T.x * U, 0, T.y * U); R3.lvl.add(g);
  mk(GEO.cyl, mat('#3a2a2a', { rough: .9 }), .4, .2, .4, 0, .1, 0, g); const pil = mk(GEO.box, mat('#4a3030', { rough: .8 }), .32, 1.6, .32, 0, .9, 0, g); const rune = mat('#ff6a3a', { em: 2 });
  for (let i = 0; i < 4; i++) { const r = mk(GEO.box, rune, .06, .25, .01, 0, .6 + i * .3, .165, g, false); r.rotation.z = i % 2 ? .4 : -.4; } const top = mk(GEO.oct, rune, .2, .26, .2, 0, 1.9, 0, g, false);
  R3.anim.push(() => { top.rotation.y = G.t * 2; rune.emissiveIntensity = T.st === 1 ? 2.5 + Math.sin(G.t * 12) * 1.2 : T.st === 2 ? .3 : 1.6 + Math.sin(G.t * 3) * .4; }); }; }
{ const _doL = drawOverlay; drawOverlay = function () { _doL(); if (!R3 || !P || !S || G.inTown || G.hideHud || !M) return; const T = G.totem;
  const lab = (o, z, t, col) => { const s = proj(o.x, o.y, z); if (!s.vis) return; X.font = 'bold 12px "Trebuchet MS",sans-serif'; X.textAlign = 'center'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(t, s.x, s.y); X.fillStyle = col; X.fillText(t, s.x, s.y); };
  if (T && T.st === 0 && dist(P, T) < 380) lab(T, 2.3, 'Challenge Totem — touch to begin', '#ff8a5a');
  for (const e of G.ens) if (e.nemesis && !e.dead && dist(e, P) < 500) lab(e, 2.6, `Nemesis: ${e.d.n} (Lv ${S.nemesis ? S.nemesis.lvl : 1})`, '#ff5a5a'); }; }
{ const _uhL = updateHUD; updateHUD = function (dt) { _uhL(dt); const el = hudLine('h-tot'); if (!el) return; const T = G.totem; setH(el, 'tot', T && T.st === 1 && !G.inTown ? `<span style="color:#ff8a5a">${ico('swords')} Challenge: ${T.t > 0 ? Math.ceil(T.t) + 's — survive!' : 'slay the last foes!'}</span> <span class="dim">${G.ens.filter(e => e.totem && !e.dead).length} foes left</span>` : ''); }; }

// ---------- feats & wiki ----------
ACH.push(
  { id: 'nem1', n: 'Grudge Settled', d: 'Defeat your Nemesis', c: () => S.stats.nemesis || 0, need: 1, sp: 1 },
  { id: 'nem10', n: 'Nemesis of Nemeses', d: 'Defeat 10 Nemeses', c: () => S.stats.nemesis || 0, need: 10, sp: 2 },
  { id: 'exp10', n: 'Quartermaster General', d: 'Complete 10 expeditions', c: () => S.stats.exped || 0, need: 10, sp: 1 },
  { id: 'hunt10', n: 'Master Hunter', d: 'Complete 10 Weekly Hunts', c: () => S.stats.hunts || 0, need: 10, sp: 2 },
  { id: 'ren5', n: 'Hero of Haven', d: 'Reach Renown rank 5', c: () => renownRank(), need: 5, sp: 1 },
  { id: 'ren11', n: 'The Undying Ember', d: 'Reach Renown rank 11', c: () => renownRank(), need: 11, sp: 3 },
  { id: 'lin3', n: 'Storied Blade', d: 'Raise a weapon to Storied lineage (2,000 kills)', c: () => Math.max(0, ...[...S.inv, ...S.stash, ...Object.values(S.eq)].filter(Boolean).map(i => i.kills || 0)), need: 2000, sp: 1 },
  { id: 'tot10', n: 'Unbowed', d: 'Win 10 Challenge Totems', c: () => S.stats.totems || 0, need: 10, sp: 1 },
  { id: 'str35', n: 'Godlike', d: 'Reach a 35 kill streak', c: () => S.stats.bestStreak || 0, need: 35, sp: 1 },
  { id: 'pevo', n: 'Bonded', d: 'Evolve a companion', c: () => Object.keys(S.petEvo || {}).length, need: 1, sp: 1 },
  { id: 'hav25', n: 'Haven Resplendent', d: 'Raise every Haven building to level 5', c: () => Object.keys(HAVEN_B).reduce((a, k) => a + havenL(k), 0), need: 25, sp: 3 },
);
WIKI_TXT.world.push(
  ['Weapon Lineage & Battle-worn Armor', 'Every weapon remembers its kills: at 100 / 500 / 2,000 / 10,000 / 40,000 kills it becomes Blooded, Veteran, Storied, Legendary and Mythic, gaining +2 / 4 / 7 / 10 / 14% damage. Helms, chestplates, gloves and boots grow from hits taken (60 / 300 / 1,200 / 5,000 / 20,000) into Scuffed, Battle-worn, Hardened, Unbreakable and Eternal for up to +14% life. Your favorite gear grows with you.'],
  ['Nemesis', 'When a monster kills you it can become your Nemesis. It then stalks later floors (about 1 in 4), stronger than a normal elite. Each time it kills you again it levels up (to Lv 20) — and the higher its level, the bigger the reward when you finally destroy it.'],
  ['Expeditions', 'From the ☰ Menu, send Haven villagers to regions you have opened for 1, 4 or 12 real-time hours. They return with gold, ore, shards, gems, Marks and (on longer trips) gear — even if the game was closed. Rescue captives for more parties (up to 3).'],
  ['Weekly Hunts', 'Every week brings three tough contracts (shown in Bounties): slay champions, clear floors, defeat guardians, win Challenge Totems and more. Each pays Marks, Fragments, a gem, an Epic+ item and Renown.'],
  ['Collector\'s Ledger & Renown', 'The Ledger (☰ Menu) rewards collecting: weapon types, legendary powers, monster types, rarities, set pieces, pages, cleared floors, Nemeses, expeditions and hunts. Each claimed tier is a permanent bonus. Renown is earned from nearly everything you accomplish; every rank gives +1% damage and +1% life, through 30+ ranks.'],
  ['Challenge Totems', 'Some floors hold a red Challenge Totem. Touch it to start 40 seconds of escalating waves. Survive and slay the stragglers for a chest, two items, XP, Marks and Renown.'],
  ['Kill Streaks', 'Slaying foes within 3 seconds of each other builds a streak: Killing Spree (5), Rampage (10), Unstoppable (20), Godlike (35), Legendary Massacre (60). Each milestone feeds your Ember Surge.'],
  ['Pet Evolution & Haven 5', 'A level 10 companion can be Evolved in the Wardrobe (150 Marks + 5 Fragments): +80% bonus, slightly faster and harder sparks, a wider loot-fetch radius, bigger and glowing. Haven buildings now go up to level 5.'],
);
