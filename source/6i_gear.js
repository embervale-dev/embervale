// ================= GEAR PACK logic =================
// ---------- tougher monsters ----------
{ const _mkE = mkEnemy; mkEnemy = function (type, x, y, o = {}) { const e = _mkE(type, x, y, o); if (e && !e.prop && type !== 'dummy' && type !== 'tsentry' && !G.tutorial) { const dp = Math.max(0, G.pw || 0); e.hp *= MON_HP * (1 + dp * .022); e.maxHp = e.hp; e.dmg *= MON_DMG * (1 + dp * .008); } return e; }; }
{ const _mkB = mkBoss; mkBoss = function (key, x, y) { const e = _mkB(key, x, y); const dp = Math.max(0, G.pw || 0); e.hp *= BOSS_HP * (1 + dp * .022); e.maxHp = e.hp; e.dmg *= BOSS_DMG * (1 + dp * .008); return e; }; }
// foes keep up a little when you return to easier regions over-leveled (rewards scale up with them)
{ const _cpG = calcPw; calcPw = function () { const b = _cpG(); if (G.abyss || G.trial || !S) return b; const lv = Math.round(S.lvl * 1.05) - 8 + S.diff * 28; return Math.max(b, Math.min(b + 10, lv)); }; }
// ---------- armor weights ----------
function wgtOf(it) { if (!it || !WGT_SLOTS.includes(it.slot)) return null; return it.wgt || ['light', 'medium', 'heavy'][it.id % 3]; }
{ const _giG = genItem; genItem = function (il, o = {}) { const it = _giG(il, o); if (WGT_SLOTS.includes(it.slot)) it.wgt = o.wgt || pick(['light', 'medium', 'heavy']); return it; }; }
function wgtCounts() { const c = { light: 0, medium: 0, heavy: 0 }; for (const sl of WGT_SLOTS) { const w = wgtOf(S.eq[sl]); if (w) c[w]++; } return c; }
const _xsG = extraStats;
extraStats = function (s) {
  _xsG(s); const c = { light: 0, medium: 0, heavy: 0 };
  for (const sl of WGT_SLOTS) { const it = S.eq[sl], w = wgtOf(it); if (w) { WGT[w].f(s); c[w]++; } }
  s.disc = c.light >= 4 ? 'light' : c.medium >= 4 ? 'medium' : c.heavy >= 4 ? 'heavy' : null;
  if (s.disc === 'medium') s.dmg += 6; if (s.disc === 'heavy') s.dr += 6;
  for (const sl of ARMOR_SLOTS) { const it = S.eq[sl]; if (it && it.tmp && TEMPER[it.tmp]) TEMPER[it.tmp].f(s, 1 + it.r * .1); }
};
// ---------- defensive hooks ----------
const _hpG = hurtPlayer;
hurtPlayer = function (amt, src) {
  if (P.dodgeT > 0 || P.air > 0 || P.inv > 0 || G.mode !== 'play' || amt <= 0 || amt >= 1e11) return _hpG(amt, src);
  if (ST.disc === 'light' && Math.random() < .08) { dmgText(P.x, P.y - 24, 'Evade', '#9ae0a0', false, 2); P.inv = .25; return; }
  if (ST.disc === 'heavy' && (P.bulT || 0) <= 0) { amt *= .4; P.bulT = 6; ringFx(P.x, P.y, 40, '#a0b0d0', .3); }
  if (ST.u.stoneskin && !(keys.w || keys.a || keys.s || keys.d || keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright)) amt *= .85;
  if ((P.swT || 0) > 0) amt *= .6;
  const r = _hpG(amt, src);
  if (ST.u.secondwind && P.hp > 0 && P.hp < ST.maxHp * .3 && (P.swCd || 0) <= 0) { P.swT = 4; P.swCd = 30; toast('🌬 Second Wind!', '#a0e0ff'); ringFx(P.x, P.y, 70, '#a0e0ff', .5); sfx('shrine'); }
  return r;
};
// ---------- offensive hooks ----------
const _heG = hurtEnemy;
hurtEnemy = function (e, amt, o = {}) {
  if (!e || e.dead) return _heG(e, amt, o);
  if (ST.u.giantslay && !e.prop && e.hp > e.maxHp * .8) amt *= 1.3;
  const r = _heG(e, amt, o);
  if (!e.dead && !e.prop && !o.noProc) {
    if (o.crit && ST.u.bloodlet) { e.bleedN = Math.max(1, e.bleedN || 0); e.bleedT = 3; e.bleedD = Math.max(e.bleedD || 0, amt * .4 / 3 / e.bleedN); }
    if (ST.disc === 'medium' && (P.brT || 0) <= 0) { healP(ST.maxHp * .004); P.brT = .25; }
  }
  return r;
};
let ocN = 0;
{ const _daG = doAttack; doAttack = function () { _daG(); if (ST.u.overcharge && ++ocN % 10 === 0) { const d = pdmg() * 1.5; aoe(P.x, P.y, 150, d, { kb: 200, col: '#ffb04a' }); ringFx(P.x, P.y, 150, '#ffb04a', .45); burst(P.x, P.y, '#ff9a3a', 30, 280, .6, 4, .5); shake(6); sfx('boom'); } }; }
{ const _kG = killEnemy; killEnemy = function (e) { if (e.dead) return; _kG(e); if (ST.u.vampshroud && !e.prop) healP(ST.maxHp * .015); }; }
// ---------- Swap Strike: switching weapons empowers your next 3 seconds ----------
{ const _swG = swapWeapons; swapWeapons = function () { const had = S.eq.weapon2; _swG(); if (had && !G.inTown && (P.swapCd || 0) <= 0) { P.swapT = 3; P.swapCd = 6; dmgText(P.x, P.y - 30, 'Swap Strike!', '#ffd27a', true, 2); } }; }
{ const _pdG = pdmg; pdmg = function () { const d = _pdG(); return P && P.swapT > 0 ? d * 1.2 : d; }; }
{ const _upG = updPlayer; updPlayer = function (dt) { _upG(dt);
  for (const k of ['bulT', 'swT', 'swCd', 'swapT', 'swapCd', 'brT']) if (P[k] > 0) P[k] -= dt;
  if (ST.disc === 'light' && P.dodgeCd > 0) P.dodgeCd -= dt * .33; }; }
// ---------- awakening & tempering at the forge ----------
{ const _isG = itemStats; itemStats = function (it) { const o = _isG(it); if (it.awk && o.wdmg) o.wdmg *= 1.15; return o; }; }
{ const _apG = artPow; artPow = function () { return _apG() + (S.eq.weapon && S.eq.weapon.awk ? .25 : 0); }; }
function canAwaken(it) { return it && it.slot === 'weapon' && it.r >= 4 && !it.awk && wmLvl(it.t) >= 10; }
function awakenCost() { return { ess: 3, ore: 20, g: Math.round(200 * Math.pow(1.12, Math.min(maxPw(), 120))) }; }
function doAwaken() {
  const it = S.eq.weapon, c = awakenCost(); if (!canAwaken(it)) return;
  if ((S.ess || 0) < c.ess || S.ore < c.ore || S.gold < c.g) { toast('Not enough materials', '#ff8a8a'); sfx('error'); return; }
  S.ess = (S.ess || 0) - c.ess; S.ore -= c.ore; S.gold -= c.g; it.awk = 1; it.name = '✪ ' + it.name.replace(/^✪ /, ''); S.stats.awakened = (S.stats.awakened || 0) + 1; R3.wkey = null; calcStats();
  banner('Weapon Awakened!', `${it.name} — +15% damage and its Art is empowered`, '#ffd27a'); sfx('legend'); burst(P.x, P.y, '#ffd27a', 40, 240, .9, 4, 1); saveGame(); renderMenu();
}
function temperCost(it) { return { ore: 6 + it.r * 2, g: Math.round(40 * Math.pow(1.12, Math.min(maxPw(), 120))) }; }
function doTemper(sl, k) {
  const it = S.eq[sl]; if (!it) return; const c = temperCost(it);
  if (S.ore < c.ore || S.gold < c.g) { toast('Not enough materials', '#ff8a8a'); sfx('error'); return; }
  S.ore -= c.ore; S.gold -= c.g; it.tmp = k; S.stats.tempered = (S.stats.tempered || 0) + 1; calcStats(); sfx('lvl'); toast(`🔨 ${it.name} tempered: <b>${TEMPER[k].n}</b> (${TEMPER[k].d})`, '#e0c070'); saveGame(); renderMenu();
}
let TMP_SL = 'armor';
{ const _smG = MENUS.smith; MENUS.smith = () => { const w = S.eq.weapon, ac = awakenCost(), it = S.eq[TMP_SL];
  let h = _smG() + `<h3>✪ Awakening</h3><div class="dim">Legendary and Mythic weapons can be Awakened once you reach Mastery 10 with their type: +15% damage and their Art is empowered (+25%). Cost: ${ac.ess} 🜃 essence, ${ac.ore} ◆ ore, ${fmt(ac.g)} gold.</div>`;
  h += w ? (w.awk ? `<div style="color:#ffd27a">✪ ${w.name} is already Awakened.</div>` : canAwaken(w) ? `<span class="btn" onclick="doAwaken()">✪ Awaken ${w.name}</span>` : `<div class="dim">${w.r < 4 ? 'Your main-hand weapon must be Legendary or Mythic.' : `Reach ${WT[w.t].n} Mastery 10 (now ${wmLvl(w.t)}).`}</div>`) : '';
  h += `<h3>🔨 Tempering</h3><div class="dim">Add one hand-picked bonus to any equipped armor piece (stronger on higher rarities). Re-tempering replaces it.</div><div>${ARMOR_SLOTS.map(sl => `<span class="btn ${TMP_SL === sl ? 'on' : ''}" style="font-size:12px" onclick="TMP_SL='${sl}';renderMenu()">${AT[sl].ic} ${AT[sl].n}${S.eq[sl] && S.eq[sl].tmp ? ' ✔' : ''}</span>`).join('')}</div>`;
  if (it) { const c = temperCost(it); h += `<div style="margin:4px 0"><span style="color:${RAR[it.r].c}">${it.name}</span>${it.tmp ? ` — tempered: <b>${TEMPER[it.tmp].n}</b>` : ''} <span class="dim">Cost: ${c.ore} ◆ ore, ${fmt(c.g)} gold</span></div><div>${Object.keys(TEMPER).map(k => `<span class="btn ${it.tmp === k ? 'on' : ''}" style="font-size:12px" title="${TEMPER[k].d}" onclick="doTemper('${TMP_SL}','${k}')">${TEMPER[k].n}<span class="dim"> ${TEMPER[k].d}</span></span>`).join('')}</div>`; }
  else h += '<div class="dim">Nothing equipped in that slot.</div>';
  return h; }; }
// ---------- tooltips ----------
{ const _itG = itemTip; itemTip = function (it, cmp) { let h = _itG(it, cmp); const w = wgtOf(it);
  if (w) { const c = wgtCounts(); h += `<hr><div style="color:${WGT[w].col};font-size:12px">${WGT[w].ic} <b>${WGT[w].n} armor</b>: ${WGT[w].d}</div><div class="dim" style="font-size:11px">${WGT[w].disc[0]} — ${WGT[w].disc[1]} (${c[w]}/4 worn)</div>`; }
  if (it.tmp && TEMPER[it.tmp]) h += `<div style="color:#e0c070;font-size:12px">🔨 Tempered — ${TEMPER[it.tmp].n}: ${TEMPER[it.tmp].d} (×${(1 + it.r * .1).toFixed(1)})</div>`;
  if (it.awk) h += `<div style="color:#ffd27a;font-size:12px">✪ Awakened: +15% damage, Art empowered</div>`;
  return h; }; }
{ const _shG = statsHTML; statsHTML = function () { const c = wgtCounts(); return _shG() + `<div style="display:block;margin-top:6px;font-size:12px">${Object.keys(WGT).map(k => `<span style="color:${c[k] >= 4 ? WGT[k].col : '#888'}">${WGT[k].ic} ${WGT[k].n} ${c[k]}/4</span>`).join(' • ')}${ST.disc ? `<div style="color:${WGT[ST.disc].col}">◆ ${WGT[ST.disc].disc[0]} active</div>` : ''}</div>`; }; }
// ---------- buff bar ----------
{ const _uhG = updateHUD; updateHUD = function (dt) { _uhG(dt); if (!S || !P || G.mode === 'title') return; const el = H['h-buffs']; if (!el) return; let h = '';
  if (P.swapT > 0) h += `<div class="buff wart" title="Swap Strike: +20% damage" style="border-color:#ffd27a">🔁<span>${Math.ceil(P.swapT)}</span></div>`;
  if (P.swT > 0) h += `<div class="buff wart" title="Second Wind: 40% less damage taken" style="border-color:#a0e0ff">🌬<span>${Math.ceil(P.swT)}</span></div>`;
  if (ST.disc === 'heavy' && !(P.bulT > 0)) h += `<div class="buff wart" title="Bulwark ready: the next hit deals 60% less damage" style="border-color:#a0b0d0">🛡️<span>✔</span></div>`;
  if (h) el.insertAdjacentHTML('beforeend', h); }; }
// ---------- armor shows on your character ----------
function buildArmorLook(pl = R3.pl, eq = S.eq) {   // also used for other players' models (multiplayer)
  if (!pl) return; if (pl.armorG) { pl.armorG.forEach(o => o.parent && o.parent.remove(o)); } pl.armorG = [];
  const ch = eq.armor, w = wgtOf(ch), hm = eq.helm, gl = eq.gloves, bt = eq.boots;
  const tint = it => it ? (it.r >= 3 ? mat(shade3(RAR[it.r].c, .8), { metal: .7, rough: .3, em: .15 + .05 * (it.r - 3) }) : null) : null;
  if (w === 'heavy' || w === 'medium') for (const arm of [pl.armL, pl.armR]) {
    const m = tint(ch) || (w === 'heavy' ? mat('#8a8a98', { metal: .8, rough: .3 }) : mat('#6a4a2a', { rough: .7 }));
    const p = mk(GEO.hemi, m, w === 'heavy' ? .17 : .14, w === 'heavy' ? .12 : .09, w === 'heavy' ? .17 : .14, 0, .02, 0, arm); pl.armorG.push(p);
    if (w === 'heavy') { const r = mk(GEO.torThin, mat('#d8b040', { metal: .9, rough: .25 }), .17, .17, .17, 0, .02, 0, arm, false); r.rotation.x = Math.PI / 2; pl.armorG.push(r); }
  }
  if (w === 'light' && pl.torso) { const s = mk(GEO.tor, tint(ch) || mat('#5a7a5a', { rough: .8 }), .16, .16, .1, 0, .3, 0, pl.torso, false); s.rotation.x = Math.PI / 2; pl.armorG.push(s); }
  if (wgtOf(gl) === 'heavy' || (gl && gl.r >= 3)) for (const arm of [pl.armL, pl.armR]) { const c = mk(GEO.cyl, tint(gl) || mat('#8a8a98', { metal: .8 }), .07, .1, .07, 0, -.3, 0, arm); pl.armorG.push(c); }
  if (bt && (wgtOf(bt) === 'heavy' || bt.r >= 3)) for (const leg of [pl.legL, pl.legR]) { const c = mk(GEO.cyl, tint(bt) || mat('#8a8a98', { metal: .8 }), .1, .1, .1, 0, -.3, 0, leg); pl.armorG.push(c); }
  if (hm && hm.r >= 3 && pl.torso) { const g = mk(GEO.oct, mat(RAR[hm.r].c, { em: 1.6, flat: true }), .04, .05, .04, .12, .62, 0, pl.torso, false); pl.armorG.push(g); }
}
{ const _rpG = render3D; render3D = function (dt) { if (R3 && R3.pl && S && S.eq) { const key = ['armor', 'helm', 'gloves', 'boots'].map(sl => { const it = S.eq[sl]; return it ? it.id + ':' + it.r : '-'; }).join('|'); if (R3.alKey !== key || R3.alPl !== R3.pl) { R3.alKey = key; R3.alPl = R3.pl; try { buildArmorLook(); } catch (e) { } } } _rpG(dt); }; }
// ---------- feats & wiki ----------
ACH.push(
  { id: 'disc1', n: 'Disciplined', d: 'Wear 4 armor pieces of the same weight', c: () => Math.max(...Object.values(wgtCounts())), need: 4, sp: 1 },
  { id: 'tmp1', n: 'Tempered Steel', d: 'Temper an armor piece', c: () => S.stats.tempered || 0, need: 1, sp: 0 },
  { id: 'awk1', n: 'Awakener', d: 'Awaken a Legendary weapon', c: () => S.stats.awakened || 0, need: 1, sp: 2 },
);
WIKI_TXT.weapons.push(
  ['Armor Weights', 'Every helm, chestplate, gloves and boots is Light 🪶, Medium 🧥 or Heavy 🛡️. Light: +4% move speed, +2% crit. Medium: +3% attack speed, +3% life. Heavy: +2.5% damage reduction, +5% life, -2% move speed. Wear all 4 pieces of one weight for a Discipline: Evasion (Light — 8% chance to evade, faster dodge), Battle Rhythm (Medium — hits heal 0.4% life up to 4×/s, +6% damage) or Bulwark (Heavy — the first hit every 6s deals 60% less, +6% damage reduction). Heavy and Medium chests show as shoulder armor on your character.'],
  ['Tempering', 'At Brann\'s forge you can temper any equipped armor piece (helm, chest, gloves, boots, ring or amulet) with one hand-picked bonus: Vitality, Guarding, Spiked, Fleet, Fury, Focus, Keen or Mending. Higher rarity pieces get a stronger temper. Re-tempering replaces it.'],
  ['Awakening', 'Legendary and Mythic weapons can be Awakened at the forge once you reach Mastery 10 with that weapon type. An Awakened weapon (✪) deals +15% damage and its Art is empowered by 25% — stacking with the Mastery 15 bonus.'],
  ['Swap Strike', 'Keep a second weapon in your Off Hand. Swapping (Tab / X) in a fight grants +20% damage for 3 seconds (6s cooldown) — great for switching between a ranged opener and a melee finisher.'],
  ['Monster Scaling', 'Monsters get stronger the deeper you go. If you return to an easier region far above its level, foes there scale up a little with you (and so does their loot), so old areas stay worth playing.'],
);
