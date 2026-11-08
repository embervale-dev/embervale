// ================= BALANCE & QUALITY OF LIFE 3: a real Abyss, companion utility, lifestyle helpers =================
// ---------- THE ABYSS: your gear no longer grows with depth, and the dark fights back ----------
// Gear attunes to the power you have reached in the regions only. Abyss depth makes foes stronger, never your gear.
function regionPw() { let best = 0; if (!S || !S.prog) return 0; for (let d = 0; d < 4; d++) for (let r = 0; r < NREG; r++) { const f = S.prog[d] && S.prog[d][r]; if (f !== undefined && f !== null && (f > 0 || S.done[d][r] || (d === 0 && r === 0))) best = Math.max(best, r * 7 + Math.min(BOSS_F, f | 0) + d * 28); } return best; }
attuneLvl = function (it) { if (typeof S === 'undefined' || !S) return it.il | 0; return regionPw(); };
const ABYSS_CURSES = [
  { k: 'swift', n: 'Swift Dark', d: 'foes move 25% faster' }, { k: 'blood', n: 'Bloodless', d: 'your life steal is halved' },
  { k: 'thin', n: 'Thin Potions', d: 'potions heal 40% less' }, { k: 'ruth', n: 'Ruthless', d: '+15% more elites' },
  { k: 'regen', n: 'Unyielding', d: 'foes regenerate 1% life per second' }, { k: 'wither', n: 'Withering', d: 'you do not regenerate life' },
  { k: 'hail', n: 'Hailstorm', d: 'enemy projectiles fly 30% faster' }, { k: 'hard', n: 'Hardened', d: 'foes take 15% less damage' },
];
function abyssCurses(depth) { const n = Math.min(ABYSS_CURSES.length, Math.floor(depth / 4)); if (!n) return []; const out = []; let x = depth * 2654435761 >>> 0; const pool = ABYSS_CURSES.slice(); while (out.length < n && pool.length) { x = (x * 1103515245 + 12345) >>> 0; out.push(pool.splice((x >>> 16) % pool.length, 1)[0]); } return out; }
function curse(k) { return G.abyss && (G.curses || []).some(c => c.k === k); }
function abyssMul(depth) { return { hp: 1 + .06 * depth, dmg: 1 + .04 * depth }; }
{ const _cpC = calcPw; calcPw = function () { if (G.abyss && S) return 80 + Math.floor((G.depth | 0) * .5) + S.diff * 28 + (G.gauntlet ? 4 : 0); return _cpC(); }; }
{ const _efC = enterFloor; enterFloor = function (r, f, d) { _efC(r, f, d); G.curses = G.abyss ? abyssCurses(G.depth | 0) : []; if (G.abyss && G.curses.length) G.later.push({ t: 1.2, fn: () => toast(`${ico('skull')} Abyssal curses: ${G.curses.map(c => `<b>${c.n}</b> (${c.d})`).join(' • ')}`, '#ff7aa0') });
  if (G.abyss) { S.abyssRec = S.abyssRec || {}; const dp = G.depth | 0, key = S.diff + ':' + Math.floor(dp / 10) * 10; if (dp >= 10 && dp % 10 === 0 && !S.abyssRec[key]) { S.abyssRec[key] = 1; S.marks += 25 + dp; S.frag = (S.frag || 0) + Math.floor(dp / 10);
    const it = genItem(regionPw() + 2, { minR: 4, bonus: dp / 40 }); it.isNew = true; (S.inv.length < S.invMax ? S.inv : S.stash).push(it); noteFound(it);
    G.later.push({ t: 2.5, fn: () => { banner(`Abyss Depth ${dp} reached!`, `+${25 + dp} Marks, ${Math.floor(dp / 10)} Fragments and a ${RAR[it.r].n} item`, '#ff5a8a'); sfx('legend'); } }); } } }; }
{ const _rlC = resetLevel; resetLevel = function () { _rlC(); G.curses = []; }; }
// foes in the Abyss: stronger every depth, more elites
{ const _mkC = mkEnemy; mkEnemy = function (type, x, y, o = {}) { if (G.abyss && !o.prop && EN[type] && EN[type].ai !== 'prop' && !o.elite && Math.random() < Math.min(.35, G.depth * .01 + (curse('ruth') ? .15 : 0))) o = { ...o, elite: true };
  const e = _mkC(type, x, y, o); if (e && G.abyss && !e.prop) { const m = abyssMul(G.depth | 0); e.hp *= m.hp; e.maxHp = e.hp; e.dmg *= m.dmg; if (curse('swift')) e.spd *= 1.25; } return e; }; }
{ const _mbC = mkBoss; mkBoss = function (k, x, y) { const e = _mbC(k, x, y); if (e && G.abyss) { const m = abyssMul(G.depth | 0); e.hp *= m.hp * 1.2; e.maxHp = e.hp; e.dmg *= m.dmg; } return e; }; }
{ const _heC = hurtEnemy; hurtEnemy = function (e, a, o) { return _heC(e, curse('hard') && e && !e.prop ? a * .85 : a, o); }; }
{ const _xsC = extraStats; extraStats = function (s) { _xsC(s); if (!G.abyss) return; s.luck += Math.min(200, (G.depth | 0) * 3); s.gold += Math.min(200, (G.depth | 0) * 3); if (curse('blood')) s.ls *= .5; if (curse('wither')) { s.hpReg = 0; s.regPct = 0; } }; }
{ const _dpC = drinkPotion; drinkPotion = function () { if (!curse('thin')) return _dpC(); const h0 = P.hp; _dpC(); if (P.hp > h0) P.hp = h0 + (P.hp - h0) * .6; }; }
{ const _ueC = updEnemy; updEnemy = function (e, edt, dt) { if (curse('regen') && !e.dead && !e.prop && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * .01 * dt); _ueC(e, edt, dt); }; }
{ const _ebC = ebullet; ebullet = function (e, a, spd, o) { return _ebC(e, a, curse('hail') ? spd * 1.3 : spd, o); }; }
{ const _uhC = updateHUD; updateHUD = function (dt) { _uhC(dt); const el = typeof hudLine === 'function' && hudLine('h-curse'); if (el) setH(el, 'curse', G.abyss && G.curses && G.curses.length ? `<span style="color:#ff7aa0">${ico('skull')} ${G.curses.map(c => `<span title="${c.d}">${c.n}</span>`).join(' • ')}</span>` : ''); }; }
// ---------- COMPANIONS: less damage, more help ----------
// Companion sparks were nerfed (see 6f_a.js); in return companions now fetch loot from further away.
function pickR() { let r = 190; const k = S && S.cos && S.cos.pet; if (k && PETS[k]) { r += 12 * petLvl(k); if (S.petEvo && S.petEvo[k]) r += 60; } return r; }
// ---------- LIFESTYLE ----------
// 1) Clean bag: salvage everything that is a lower rarity than what you already wear in that slot (locked, set and Epic+ items are kept)
function cleanBag() { let n = 0, sh = 0; for (const it of S.inv.slice()) { const cur = S.eq[it.slot === 'weapon' ? 'weapon' : it.slot]; if (!cur || it.locked || it.set || it.art || it.r >= 3 || it.r >= (cur.r | 0)) continue; sh += SALV[it.r]; salvage(it); n++; }
  toast(n ? `${ico('broom')} Cleaned your bag: salvaged ${n} weaker item${n > 1 ? 's' : ''} for ${sh} shards` : 'Nothing to clean — every item is at least as rare as what you wear', n ? '#7aff7a' : '#c8b898'); if (n) { sfx('gold'); saveGame(); } renderMenu(); }
{ const _ivC = MENUS.inv; MENUS.inv = () => _ivC().replace('<span class="btn" onclick="sortInv()">', `<span class="btn" title="Salvage every Common–Rare item that is a lower rarity than what you wear in that slot. Locked and set items are kept." onclick="cleanBag()">${ico('broom')} Clean bag</span><span class="btn" onclick="sortInv()">`); }
// 2) After falling: try the same floor again instead of walking back from Haven
function retryFloor() { const L = G.retry; closeMenu(); if (!L) return goTown(); enterFloor(L.r, L.f, L.d); }
{ const _dieC = die; die = function () { G.retry = !G.trial && !G.arena && !G.gauntlet && !G.duel && !G.tutorial && !G.inTown ? { r: G.abyss ? ABYSS_R : G.region, f: G.floor, d: G.depth } : null; _dieC(); }; }
{ const _ddC = MENUS.dead; MENUS.dead = () => { const h = _ddC(); if (!G.retry) return h; const L = G.retry; const lbl = L.r === ABYSS_R ? `Abyss depth ${L.d}` : `${REG[L.r].n} — floor ${L.f + 1}`; return h.replace('onclick="revive()"', 'onclick="revive()"').replace(/(<div class="btn bigb"[^>]*onclick="revive\(\)"[^>]*>[^<]*<\/div>)/, `$1<div class="btn bigb" onclick="retryFloor()">${ico('play')} Try ${lbl} again</div>`); }; }
// 3) Full bag: when you walk onto a better item, the weakest unlocked Common/Uncommon makes room automatically (toggle in Settings)
{ const _uC = update; update = function (dt) { _uC(dt); if (!S || G.mode !== 'play' || G.menu || S.opts.noAutoRoom || S.inv.length < S.invMax) return;
  for (const p of G.pick) { if (p.k !== 'item' || !p.it || dist(p, P) > 40) continue; const junk = S.inv.filter(i => !i.locked && i.r <= 1 && !i.set).sort((a, b) => a.r - b.r)[0]; if (junk && junk.r < p.it.r) { salvage(junk); toast(`${ico('broom')} Bag full — salvaged ${junk.name} to make room`, '#c8b898'); } break; } }; }
{ const _stC = MENUS.settings; MENUS.settings = () => { const h = _stC(); if (!S) return h; const on = !S.opts.noAutoRoom; return h.replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card">${ico('bag')} Make room when the bag is full <span class="btn ${on ? 'on' : ''}" onclick="setOpt('noAutoRoom',${on})">${on ? 'On' : 'Off'}</span> <span class="dim">salvages your weakest Common/Uncommon when you walk onto a better item</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }; }
// 4) The Abyss card at the Waystone explains the danger and the rewards
{ const _ptC = MENUS.portal; MENUS.portal = () => _ptC().replace('Endless descent. Every 5th depth holds a guardian.', 'Endless descent — foes grow stronger every depth (your gear does not), curses pile up every 4 depths, and loot and gold improve the deeper you go. Every 10th depth pays a one-time reward. Every 5th depth holds a guardian.'); }
WIKI_TXT.world.push(
  ['The Abyss (reworked)', 'Your gear is attuned to the power you have reached in the regions, so diving deeper never makes your gear stronger — only the foes. Each depth makes foes stronger (power rises every 2 depths, plus +6% life and +4% damage per depth), more elites appear, and every 4 depths adds an Abyssal Curse (Swift Dark, Bloodless, Thin Potions, Ruthless, Unyielding, Withering, Hailstorm, Hardened). In return, magic find and gold find rise by 3% per depth, and every 10th depth pays Marks, Fragments and an item of Legendary rarity or better the first time. How deep can you go?'],
  ['Endless Arena', 'The first waves are a gentle warm-up with weak, non-elite foes. Every wave adds more foes and a little more life and damage; elites start at wave 4 and Guardians join every 5th wave from wave 10. After wave 30 the waves ramp up quickly.'],
  ['Companions & Fetch', 'Companions fight beside you with light homing sparks (a small boost, not a second weapon). They also fetch: every companion level widens the radius at which gold, ore and potions fly to you, and evolved companions reach even further.'],
  ['Quality of Life', 'Clean bag (Inventory) salvages every lower-rarity item than what you wear in that slot. After you fall you can try the same floor again. When your bag is full and you walk onto a better item, your weakest Common/Uncommon is salvaged to make room (toggle in Settings).'],
);
ACH.push({ id: 'abyss20', n: 'Into the Dark', d: 'Reach Abyss depth 20', c: () => Math.max(...S.abyssBest), need: 20, sp: 2 }, { id: 'arena50', n: 'Unbreakable', d: 'Survive 50 Arena waves', c: () => S.arenaBest || 0, need: 50, sp: 3 });
