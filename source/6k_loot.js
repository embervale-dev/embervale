// ================= RARITY & DANGER PACK logic =================
// ---------- rarity rolls: much stingier, with five new tiers above Mythic ----------
rollRarity = function (minR = 0, bonus = 0) {
  const lm = 1 + Math.min(400, Math.max(0, luckEff())) / 250 + bonus + S.diff * .1;
  const x = Math.random(); let acc = 0, r = 0;
  for (const [ri_, ch, ok] of RAR_ODDS) { if (!ok()) continue; acc += ch * lm; if (x < acc) { r = ri_; break; } }
  return Math.max(r, minR);
};
{ const _isK = itemStats; itemStats = function (it) { const o = _isK(it); if (o.wdmg) o.wdmg *= WDMG_MUL; return o; }; }
// ---------- double legendary powers on the new tiers ----------
{ const _giK = genItem; genItem = function (il, o = {}) { const it = _giK(il, o); if (it.r >= 7 && !it.art) { const pool = (it.slot === 'weapon' ? UNQ_W : UNQ_A).filter(u => u !== it.u); it.u2 = pick(pool); it.name = itemName(it); } return it; }; }
{ const _itK = itemTip; itemTip = function (it, cmp) { let h = _itK(it, cmp); if (it.u2 && UNQ[it.u2] && !h.includes(UNQ[it.u2].d)) h = h.replace(/(<div class="uq">★[^<]*<\/div>)/, `$1<div class="uq">★ ${UNQ[it.u2].d}</div>`); if (it.r >= 7 && !it.art) h = h.replace('<hr>', `<div style="color:${RAR[it.r].c};font-size:12px;letter-spacing:1px">✦ ${RAR[it.r].n.toUpperCase()} — two legendary powers ✦</div><hr>`); return h; }; }
// ---------- dramatic drop announcements ----------
{ const _diK = dropItem; dropItem = function (it, x, y) { _diK(it, x, y); if (!it || it.art || G.tutorial) return;
  S.stats.rar = S.stats.rar || {}; S.stats.rar[it.r] = (S.stats.rar[it.r] || 0) + 1;
  if (it.r >= 7) { banner(`✦ ${RAR[it.r].n.toUpperCase()} DROP ✦`, it.name, RAR[it.r].c); sfx('legend'); setTimeout(() => sfx('lvl'), 250); setTimeout(() => sfx('legend'), 600); shake(16); G.slow = 1; ringFx(x, y, 160, RAR[it.r].c, .9); burst(x, y, RAR[it.r].c, 70, 340, 1.4, 5, .6); }
  else if (it.r >= 4) { sfx('legend'); ringFx(x, y, 90, RAR[it.r].c, .6); burst(x, y, RAR[it.r].c, 30, 220, .9, 4, .6); toast(`<span style="color:${RAR[it.r].c}">★ ${RAR[it.r].n} drop!</span>`, RAR[it.r].c); } }; }
// ---------- salvage: the new tiers give much more essence ----------
{ const _svK = salvage; salvage = function (it) { const r = it.r, art = it.art; _svK(it); if (r >= 7 && !art) S.ess = (S.ess || 0) + (r - 5); }; }
// ---------- tougher, nastier monsters ----------
{ const _mkK = mkEnemy; mkEnemy = function (type, x, y, o = {}) {
  if (!o.elite && !o.minion && !o.prop && !G.tutorial && type !== 'gimp' && type !== 'dummy' && type !== 'tsentry' && type !== 'cage' && EN[type] && EN[type].ai !== 'prop' && Math.random() < .04 + S.diff * .02) o = { ...o, elite: true };
  return _mkK(type, x, y, o); }; }
{ const _hiK = hitE; hitE = function (e, base, o = {}) { _hiK(e, base, o); if (e && !e.dead && e.elite === 'Unstoppable') { e.stun = 0; e.frz = Math.min(e.frz, .1); e.kx = e.ky = 0; } }; }
{ const _ueK = updEnemy; updEnemy = function (e, edt, dt) { if (e.elite === 'Enraged' && !e.rage && e.hp < e.maxHp * .5 && !e.dead) { e.rage = 1; e.spd *= 1.45; e.dmg *= 1.4; dmgText(e.x, e.y - e.r - 10, 'ENRAGED!', '#ff2a2a', true, 3); ringFx(e.x, e.y, 70, '#ff2a2a', .4); sfx('boss'); } _ueK(e, edt, dt); }; }
{ const _kK = killEnemy; killEnemy = function (e) { if (e.dead) return; const split = e.elite === 'Splitting' && !e.splitChild; _kK(e);
  if (split) for (let i = 0; i < 2; i++) { const a = i * Math.PI + rnd(-.5, .5); const c = mkEnemy(e.type, e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20, { minion: true, awake: true }); if (c) { c.hp = c.maxHp = e.maxHp * .3; c.splitChild = 1; c.r *= .85; c.awake = true; } }
  if (e.champ && Math.random() < .04) { S.hearts = (S.hearts || 0) + 1; toast(ico('ember-heart') + ' An Ember Heart!', '#ff6a4a'); } }; }
// ---------- Ember Hearts from guardians ----------
{ const _bdK = bossDefeated; bossDefeated = function (e) { _bdK(e); const first = !S.heartOnce || !S.heartOnce[G.region + '_' + S.diff];
  if (!G.trial && (first || Math.random() < .2)) { S.heartOnce = S.heartOnce || {}; S.heartOnce[G.region + '_' + S.diff] = 1; S.hearts = (S.hearts || 0) + 1; G.later.push({ t: 1.8, fn: () => toast(ico('ember-heart') + ' The guardian left an <b>Ember Heart</b> — used to Ascend items at the forge', '#ff6a4a') }); } }; }
// ---------- Ascension at the forge ----------
function ascCost(it) { const c = ASCEND[it.r]; return c ? { ore: c.ore, ess: c.ess, heart: c.heart, g: Math.round(c.g * 80 * Math.pow(1.12, Math.min(maxPw(), 120))) } : null; }
function doAscend(id) {
  const it = findItem(id); if (!it || it.art) return; const c = ascCost(it); if (!c) return;
  if (S.ore < c.ore || (S.ess || 0) < c.ess || (S.hearts || 0) < c.heart || S.gold < c.g) { toast('Not enough materials', '#ff8a8a'); sfx('error'); return; }
  S.ore -= c.ore; S.ess = (S.ess || 0) - c.ess; S.hearts = (S.hearts || 0) - c.heart; S.gold -= c.g;
  const old = it.aff.slice(); it.r++; rollAffixes(it); const add = it.aff.filter(a => !old.some(o => o.k === a.k)); it.aff = old.concat(add).slice(0, RAR[it.r].aff);
  if (it.r >= 4 && !it.u) it.u = pick(it.slot === 'weapon' ? UNQ_W : UNQ_A); it.name = itemName(it); noteFound(it); S.stats.ascended = (S.stats.ascended || 0) + 1; calcStats();
  banner('Item Ascended!', `${it.name} is now ${RAR[it.r].n}`, RAR[it.r].c); sfx('legend'); burst(P.x, P.y, RAR[it.r].c, 40, 240, .9, 4, 1); saveGame(); renderMenu();
}
{ const _smK = MENUS.smith; MENUS.smith = () => { const items = SLOTS.map(sl => S.eq[sl]).filter(it => it && !it.art && it.r >= 1 && it.r <= 3);
  let h = _smK() + `<h3>${ico('up')} Ascension <span class="dim">${ico('ember-heart')} ${S.hearts || 0} Ember Hearts • ${ico('essence')} ${S.ess || 0} essence • ◆ ${S.ore} ore</span></h3><div class="dim">Raise an equipped item one rarity (Uncommon → Rare → Epic → Legendary). It keeps its bonuses and gains a new one; reaching Legendary grants a random legendary power. Ascending to Legendary needs an <b>Ember Heart</b> — guardians drop one the first time you beat them on each difficulty, and sometimes after that. Rarities beyond Legendary can only be found.</div>`;
  h += items.length ? items.map(it => { const c = ascCost(it); return `<div class="smrow"><div style="flex:1"><span style="color:${RAR[it.r].c}">${it.name}</span> <span class="dim">→</span> <span style="color:${RAR[it.r + 1].c}">${RAR[it.r + 1].n}</span></div><span class="btn" onclick="doAscend(${it.id})">Ascend: ${c.ore}◆${c.ess ? ` + ${c.ess}${ico('essence')}` : ''}${c.heart ? ` + ${c.heart}${ico('ember-heart')}` : ''} + ${fmt(c.g)}g</span></div>`; }).join('') : '<div class="dim">Equip an Uncommon, Rare or Epic item to ascend it.</div>';
  return h; }; }
// ---------- feats & wiki ----------
ACH.push(
  { id: 'anc1', n: 'Relic of Ages', d: 'Find an Ancient (or better) item', c: () => Math.max(0, ...Object.keys((S.stats.rar || {})).map(Number).filter(r => r >= 7 && S.stats.rar[r] > 0)), need: 7, sp: 2 },
  { id: 'exa1', n: 'Touched by Light', d: 'Find an Exalted (or better) item', c: () => Math.max(0, ...Object.keys((S.stats.rar || {})).map(Number).filter(r => r >= 8 && S.stats.rar[r] > 0)), need: 8, sp: 2 },
  { id: 'ete1', n: 'Beyond Eternity', d: 'Find an Eternal item', c: () => (S.stats.rar && S.stats.rar[11]) || 0, need: 1, sp: 5 },
  { id: 'asc1', n: 'Ascendant', d: 'Ascend an item at the forge', c: () => S.stats.ascended || 0, need: 1, sp: 0 },
);
WIKI_TXT.items.push(
  ['Rarity Tiers & Drop Odds', 'Common → Uncommon → Rare → Epic → Legendary → Mythic → Ancient → Exalted → Primordial → Divine → Eternal (plus Celestial artifacts, which are forged). Base chance per item: ' + RAR_ODDS.slice().reverse().map(([r, ch, , w]) => `${RAR[r].n} ${ch >= .01 ? (ch * 100).toFixed(1) + '%' : '1 in ' + fmt(Math.round(1 / ch))} (${w})`).join(' • ') + '. Magic find (capped at +400%), difficulty and boss/chest bonuses raise these. Ancient and higher items carry TWO legendary powers.'],
  ['Item Drops', 'Ordinary monsters rarely drop gear (about 2%); elites drop it 20% of the time, champions, chests, vaults and guardians more reliably. Gold, ore and gems still drop often.'],
  ['Ascension & Ember Hearts', 'At the forge you can Ascend an equipped item one rarity at a time, up to Legendary, keeping its bonuses and adding one. Ascending to Legendary costs an Ember Heart: each guardian drops one the first time you beat it on each difficulty (20% after that), and champions occasionally drop them.'],
);
WIKI_TXT.combat.push(['Elite Traits', 'Elites (colored rings) have one trait: Swift, Vampiric, Shielded, Volatile, Frenzied, Giant, Arcane, Blinking, and the newer Unstoppable (cannot be stunned, frozen or knocked back), Enraged (faster and stronger below half life) and Splitting (splits into two smaller copies on death). Elites are more common than before, and much more common on higher difficulties.']);
WIKI_TXT.combat.push(['A Real Challenge', 'Monsters are tough: ordinary foes take several seconds to bring down and elites take a real fight, while their hits hurt. Monsters also grow tougher the deeper you go, so better gear, upgrades, mastery and smart use of skills, dodges and Ember Surge all matter. Everyday gear (Common to Epic) is modest; Legendary and the rare tiers above it are huge power jumps. If you would like a gentler game, turn on Relaxed mode in Settings.']);
