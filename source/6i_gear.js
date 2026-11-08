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
  if (ST.u.secondwind && P.hp > 0 && P.hp < ST.maxHp * .3 && (P.swCd || 0) <= 0) { P.swT = 4; P.swCd = 30; toast(ico('wind') + ' Second Wind!', '#a0e0ff'); ringFx(P.x, P.y, 70, '#a0e0ff', .5); sfx('shrine'); }
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
  S.ess = (S.ess || 0) - c.ess; S.ore -= c.ore; S.gold -= c.g; it.awk = 1; it.name = '✧ ' + it.name.replace(/^(\u272A|✧) /, ''); S.stats.awakened = (S.stats.awakened || 0) + 1; R3.wkey = null; calcStats();
  banner('Weapon Awakened!', `${it.name} — +15% damage and its Art is empowered`, '#ffd27a'); sfx('legend'); burst(P.x, P.y, '#ffd27a', 40, 240, .9, 4, 1); saveGame(); renderMenu();
}
function temperCost(it) { return { ore: 6 + it.r * 2, g: Math.round(40 * Math.pow(1.12, Math.min(maxPw(), 120))) }; }
function doTemper(sl, k) {
  const it = S.eq[sl]; if (!it) return; const c = temperCost(it);
  if (S.ore < c.ore || S.gold < c.g) { toast('Not enough materials', '#ff8a8a'); sfx('error'); return; }
  S.ore -= c.ore; S.gold -= c.g; it.tmp = k; S.stats.tempered = (S.stats.tempered || 0) + 1; calcStats(); sfx('lvl'); toast(`${ico('hammer')} ${it.name} tempered: <b>${TEMPER[k].n}</b> (${TEMPER[k].d})`, '#e0c070'); saveGame(); renderMenu();
}
let TMP_SL = 'armor';
{ const _smG = MENUS.smith; MENUS.smith = () => { const w = S.eq.weapon, ac = awakenCost(), it = S.eq[TMP_SL];
  let h = _smG() + `<h3>${ico('awaken')} Awakening</h3><div class="dim">Legendary and Mythic weapons can be Awakened once you reach Mastery 10 with their type: +15% damage and their Art is empowered (+25%). Cost: ${ac.ess} ${ico('essence')} essence, ${ac.ore} ◆ ore, ${fmt(ac.g)} gold.</div>`;
  h += w ? (w.awk ? `<div style="color:#ffd27a">${ico('awaken')} ${w.name} is already Awakened.</div>` : canAwaken(w) ? `<span class="btn" onclick="doAwaken()">${ico('awaken')} Awaken ${w.name}</span>` : `<div class="dim">${w.r < 4 ? 'Your main-hand weapon must be Legendary or Mythic.' : `Reach ${WT[w.t].n} Mastery 10 (now ${wmLvl(w.t)}).`}</div>`) : '';
  h += `<h3>${ico('hammer')} Tempering</h3><div class="dim">Add one hand-picked bonus to any equipped armor piece (stronger on higher rarities). Re-tempering replaces it.</div><div>${ARMOR_SLOTS.map(sl => `<span class="btn ${TMP_SL === sl ? 'on' : ''}" style="font-size:12px" onclick="TMP_SL='${sl}';renderMenu()">${AT[sl].ic} ${AT[sl].n}${S.eq[sl] && S.eq[sl].tmp ? ' ' + ico('check') : ''}</span>`).join('')}</div>`;
  if (it) { const c = temperCost(it); h += `<div style="margin:4px 0"><span style="color:${RAR[it.r].c}">${it.name}</span>${it.tmp ? ` — tempered: <b>${TEMPER[it.tmp].n}</b>` : ''} <span class="dim">Cost: ${c.ore} ◆ ore, ${fmt(c.g)} gold</span></div><div>${Object.keys(TEMPER).map(k => `<span class="btn ${it.tmp === k ? 'on' : ''}" style="font-size:12px" title="${TEMPER[k].d}" onclick="doTemper('${TMP_SL}','${k}')">${TEMPER[k].n}<span class="dim"> ${TEMPER[k].d}</span></span>`).join('')}</div>`; }
  else h += '<div class="dim">Nothing equipped in that slot.</div>';
  return h; }; }
// ---------- tooltips ----------
{ const _itG = itemTip; itemTip = function (it, cmp) { let h = _itG(it, cmp); const w = wgtOf(it);
  if (w) { const c = wgtCounts(); h += `<hr><div style="color:${WGT[w].col};font-size:12px">${WGT[w].ic} <b>${WGT[w].n} armor</b>: ${WGT[w].d}</div><div class="dim" style="font-size:11px">${WGT[w].disc[0]} — ${WGT[w].disc[1]} (${c[w]}/4 worn)</div>`; }
  if (it.tmp && TEMPER[it.tmp]) h += `<div style="color:#e0c070;font-size:12px">${ico('hammer')} Tempered — ${TEMPER[it.tmp].n}: ${TEMPER[it.tmp].d} (×${(1 + it.r * .1).toFixed(1)})</div>`;
  if (it.awk) h += `<div style="color:#ffd27a;font-size:12px">${ico('awaken')} Awakened: +15% damage, Art empowered</div>`;
  return h; }; }
{ const _shG = statsHTML; statsHTML = function () { const c = wgtCounts(); return _shG() + `<div style="display:block;margin-top:6px;font-size:12px">${Object.keys(WGT).map(k => `<span style="color:${c[k] >= 4 ? WGT[k].col : '#888'}">${WGT[k].ic} ${WGT[k].n} ${c[k]}/4</span>`).join(' • ')}${ST.disc ? `<div style="color:${WGT[ST.disc].col}">◆ ${WGT[ST.disc].disc[0]} active</div>` : ''}</div>`; }; }
// ---------- buff bar ----------
{ const _uhG = updateHUD; updateHUD = function (dt) { _uhG(dt); if (!S || !P || G.mode === 'title') return; const el = H['h-buffs']; if (!el) return; let h = '';
  if (P.swapT > 0) h += `<div class="buff wart" title="Swap Strike: +20% damage" style="border-color:#ffd27a">${ico('loop')}<span>${Math.ceil(P.swapT)}</span></div>`;
  if (P.swT > 0) h += `<div class="buff wart" title="Second Wind: 40% less damage taken" style="border-color:#a0e0ff">${ico('wind')}<span>${Math.ceil(P.swT)}</span></div>`;
  if (ST.disc === 'heavy' && !(P.bulT > 0)) h += `<div class="buff wart" title="Bulwark ready: the next hit deals 60% less damage" style="border-color:#a0b0d0">${ico('shield')}<span>${ico('check')}</span></div>`;
  WART_BUF += h; }; }
// ---------- armor shows on your character ----------
// Sculpted shells that follow the body profiles from makeHumanoid (window.HUM3). Each piece is one cached merged
// geometry per (slot, weight, rarity, part); better rarities get richer trim, extra pauldron lames, new helm shapes and glow.
const ARM3_KIT = (() => {
  const PI = Math.PI, hx = (a, b, k) => '#' + new T3.Color(a).lerp(new T3.Color(b), k).getHexString(), GOLD = '#e0b850';
  function pal(r, w) {
    const RC = RAR[r].c;
    if (w === 'heavy') { const a = r <= 2 ? ['#868a92', '#a6acb6', '#c6ced9'][r] : r < 5 ? hx('#aab0ba', RC, .22) : hx('#5c606a', RC, .38);
      return { a, t: r === 0 ? '#5e6066' : r === 1 ? '#727884' : r === 2 ? '#b89048' : hx(GOLD, RC, .3), d: '#141418' }; }
    if (w === 'medium') { const a = r < 2 ? '#6a4628' : hx('#5a3a20', RC, .2);
      return { a, d: shade3(a, .62), m: '#8e939c', t: r < 2 ? '#9a9ea6' : r === 2 ? '#b89048' : hx(GOLD, RC, .3) }; }
    const a = r === 0 ? '#a89878' : hx(shade3(RC, .72), '#b8b0a0', .25);
    return { a, d: shade3(a, .62), t: r <= 1 ? shade3(a, .7) : hx(GOLD, RC, .3) };
  }
  const ring = (r, t, y, x = 0) => new T3.TorusGeometry(r, t, 5, 18).rotateX(PI / 2).translate(x, y, 0);
  const stripes = (n, lo = .78) => (x, y) => lo + (1 - lo) * ((Math.floor((y + 2) * n) & 1));
  // pieces: { n, pv (chest|hips|head|arm|leg|knee), m (metal|cloth|glow), f () => merge parts }
  function pieces(sl, w, r, ht) {
    const L = window.HUM3, { ell, tube, rbox, xf, bt, crv, tor, strap, torsoP, TD, thighR, shinR } = L, c = pal(r, w), out = [], glow = r >= 3, PI2 = L.PI2;
    const grad = (y0, y1, a = .78) => (x, y) => a + (1 - a) * L.cl((y - y0) / (y1 - y0), 0, 1);
    const add = (n, pv, m, f) => out.push({ n, pv, m, f });
    const tp = (ph, y, off) => torsoP(ph, y, off, [0, 0, 0]);
    const keel = (ph, y) => .024 + .012 * Math.pow(Math.max(0, Math.cos(ph)), 14);
    if (sl === 'armor') {
      if (w === 'heavy') {
        add('cuir', 'chest', 'metal', () => { const p = [[tor(0, PI2, .15, .43, keel, 28, 8), c.a, grad(.12, .43, .7)], [tor(0, PI2, .405, .43, .036, 28, 1), c.t], [tor(0, PI2, .145, .162, .034, 28, 1), c.t],
          [tube(.385, .475, crv([[0, .105], [1, .078]]), { nu: 18, nv: 2, dx: .93 }), c.a], [ring(.078, .011, .475), c.t]];
          for (let k = 0; k < 3; k++) { const yt = .165 - .052 * k, yb = yt - .062, o0 = .027 + .005 * k; p.push([tor(0, PI2, yb, yt, (ph, y) => o0 + .008 * (yt - y) / .062, 28, 2), shade3(c.a, .92 - .04 * k)]); if (k === 2 || r >= 2) p.push([tor(0, PI2, yb, yb + .011, o0 + .01, 28, 1), c.t]); }
          if (r >= 4) for (const s of [-1, 1]) p.push([strap(s * .62, .405, s * .13, .2, .018, .036, 8), c.t]);
          return p; });
        add('tass', 'hips', 'metal', () => { const p = [], plate = (a, h) => (y0, y1, off) => L.grid(5, 4, (u, v, q) => { const ph = a - h + u * 2 * h, y = L.lr(y0, y1, v), rr = .19 + .065 * (.05 - y) / .2 + off; q[0] = Math.cos(ph) * rr * .8; q[1] = y; q[2] = Math.sin(ph) * rr; }, false);
          for (const [a, h] of [[.5, .36], [-.5, .36], [1.45, .4], [-1.45, .4], [PI, .7]]) { const f = plate(a, h); p.push([f(.05, -.15, 0), c.a, grad(-.15, .05, .75)], [f(-.135, -.152, .008), c.t]); }
          return p; });
        add('paul', 'arm', 'metal', () => { const s13 = Math.sin(1.3), p = [[ell(.118, .1, .118, { th1: 1.3, nu: 18, nv: 6 }).translate(0, .005, 0), c.a, grad(-.02, .11, .75)], [ring(.118 * s13, .011, .1 * Math.cos(1.3) + .005), c.t]];
          const n = 1 + (r >= 2) + (r >= 4); for (let k = 1; k <= n; k++) { const yt = .03 - .04 * (k - 1), yb = yt - .05, r0 = .108 + .008 * k, r1 = .12 + .01 * k; p.push([tube(yt, yb, crv([[0, r0], [1, r1]]), { nu: 18, nv: 1 }), shade3(c.a, 1 - .07 * k)], [ring(r1, .009, yb), c.t]); }
          if (r >= 4) p.push([new T3.TorusGeometry(.088, .013, 5, 14, PI).translate(0, .02, 0), c.t]);
          return p; });
        if (glow) add('cuirG', 'chest', 'glow', () => { const q = tp(0, .3, .05), p = [[xf(new T3.OctahedronGeometry(1, 0), q[0], .3, 0, 0, 0, 0, .012, .04 + .004 * r, .03), '#fff']];
          if (r >= 5) p.push([tor(0, PI2, .147, .158, .04, 28, 1), '#fff'], [ring(.08, .008, .48), '#fff']);
          return p; });
        if (r >= 5) add('paulG', 'arm', 'glow', () => [[xf(new T3.OctahedronGeometry(1, 0), .118, .04, 0, 0, 0, 0, .012, .028, .02), '#fff']]);
      } else if (w === 'medium') {
        add('brig', 'chest', 'cloth', () => { const p = [[tor(0, PI2, .03, .42, .017, 26, 8), c.a, grad(.03, .42, .72)], [tor(0, PI2, .4, .425, .024, 26, 1), c.d], [tor(0, PI2, -.03, .05, .024, 26, 2), c.d],
          [strap(1.15, .43, -1.3, .06, .04, .025), c.d]]; return p; });
        add('brigM', 'chest', 'metal', () => { const p = [[rbox(.018, .05, .066, .008, 2).translate(tp(0, .01, .03)[0], .01, 0), c.t]];
          for (const y of [.13, .2, .27, .34]) for (const ph of [-.75, -.45, .45, .75]) { const q = tp(ph, y, .02); p.push([new T3.SphereGeometry(.009, 5, 4).translate(q[0], q[1], q[2]), c.t]); }
          return p; });
        add('mail', 'hips', 'cloth', () => [[tube(.04, -.165, (t, ph) => (.18 + .055 * t) * (1 + .02 * t * Math.sin(ph * 9)), { nu: 26, nv: 10, dx: .79 }), c.m, stripes(60)]]);
        add('mpaul', 'arm', 'cloth', () => [[ell(.108, .092, .108, { th1: 1.3, nu: 16, nv: 5 }).translate(0, .005, 0), c.a, grad(-.02, .1, .75)], [tube(.03, -.025, crv([[0, .108], [1, .118]]), { nu: 16, nv: 1 }), c.d]]);
        add('mpaulM', 'arm', 'metal', () => [[ring(.118, .008, -.025), c.t], [ring(.105, .007, .03), c.t]]);
        if (glow) add('brigG', 'chest', 'glow', () => { const q = tp(0, .27, .03); return [[xf(new T3.OctahedronGeometry(1, 0), q[0], q[1], 0, 0, 0, 0, .012, .03, .026), '#fff']]; });
      } else {
        add('vest', 'chest', 'cloth', () => { const p = [[tor(0, PI2, .02, .43, .013, 26, 8), c.a, (x, y, z) => (.8 + .2 * Math.abs(Math.sin(Math.atan2(z, x) * 6))) * (.8 + .2 * L.cl((y - .02) / .41, 0, 1))],
          [strap(1.2, .45, -1.3, .04, .055, .022), c.t], [new T3.TorusGeometry(.09, .03, 6, 18).rotateX(PI / 2).translate(0, .45, 0), c.t]];
          if (r >= 2) p.push([tor(0, PI2, .02, .045, .02, 26, 1), c.t]); return p; });
        add('tab', 'hips', 'cloth', () => { const f = (y0, y1, off) => L.grid(5, 4, (u, v, q) => { const ph = -.42 + u * .84, y = L.lr(y0, y1, v), rr = .2 + .05 * v + off; q[0] = Math.cos(ph) * rr * .82; q[1] = y; q[2] = Math.sin(ph) * rr; }, false);
          return [[f(.05, -.2, 0), c.a, grad(-.2, .05, .8)], [f(-.18, -.205, .006), c.t]]; });
        add('lpad', 'arm', 'cloth', () => [[ell(.094, .08, .094, { th1: 1.25, nu: 14, nv: 4 }).translate(0, 0, 0), c.a], [ring(.094 * Math.sin(1.25), .01, .08 * Math.cos(1.25)), c.t]]);
        if (glow) add('vestG', 'chest', 'glow', () => { const q = tp(.12, .3, .035); return [[xf(new T3.OctahedronGeometry(1, 0), q[0], q[1], q[2], 0, 0, 0, .012, .028, .024), '#fff']]; });
      }
    } else if (sl === 'gloves') {
      if (w === 'heavy') {
        add('vamb', 'arm', 'metal', () => [[tube(-.215, -.35, crv([[0, .066], [1, .058]]), { nu: 14, nv: 2 }), c.a, grad(-.34, -.2, .75)], [ring(.066, .009, -.217), c.t], [ell(.04, .046, .05, { nu: 10, nv: 6 }).translate(-.036, -.205, 0), c.a],
          [rbox(.09, .096, .084, .03).translate(.004, -.368, 0), c.a], [tube(-.31, -.345, crv([[0, .062], [1, .078]]), { nu: 14, nv: 1 }), shade3(c.a, .9)], [ring(.078, .008, -.345), c.t],
          [rbox(.094, .012, .086, .005, 2).translate(.004, -.395, 0), c.t]]);
        if (glow) add('vambG', 'arm', 'glow', () => [[xf(new T3.OctahedronGeometry(1, 0), .05, -.36, 0, 0, 0, 0, .008, .018, .016), '#fff']]);
      } else if (w === 'medium') {
        add('brac', 'arm', 'cloth', () => [[tube(-.215, -.35, crv([[0, .064], [1, .056]]), { nu: 14, nv: 2 }), c.a], [rbox(.086, .092, .08, .028).translate(.004, -.367, 0), c.d]]);
        add('bracM', 'arm', 'metal', () => [[ring(.065, .008, -.24), c.t], [ring(.058, .008, -.32), c.t], [rbox(.026, .05, .072, .01, 2).translate(.042, -.382, 0), c.m]]);
      } else add('wrap', 'arm', 'cloth', () => [[tube(-.24, -.35, crv([[0, .06], [1, .054]]), { nu: 14, nv: 8 }), c.a, stripes(110, .8)], [ring(.06, .01, -.24), c.t]]);
    } else if (sl === 'boots') {
      if (w === 'heavy') {
        add('grev', 'knee', 'metal', () => [[tube(.015, -.165, shinR, { nu: 14, nv: 4, dx: 1.08 }).scale(1.12, 1, 1.12), c.a, grad(-.17, .02, .75)],
          [rbox(.014, .16, .018, .006, 2).translate(.078, -.075, 0), c.t], [ell(.05, .056, .062, { nu: 12, nv: 7 }).translate(.05, .005, 0), c.a], [ell(.03, .03, .072, { nu: 10, nv: 5 }).translate(.045, -.04, 0), c.t],
          [rbox(.215, .076, .108, .034).translate(.036, -.196, 0), shade3(c.a, .9)], [rbox(.012, .066, .104, .005, 2).translate(.075, -.192, 0), c.t], [rbox(.012, .06, .1, .005, 2).translate(.11, -.195, 0), c.t]]);
        add('cuis', 'leg', 'metal', () => [[L.grid(8, 4, (u, v, q) => { const ph = -1.35 + u * 2.7, t = .2 + .6 * v, rr = thighR(t) + .016; q[0] = Math.cos(ph) * rr * .97; q[1] = L.lr(.05, -.25, t); q[2] = Math.sin(ph) * rr; }, false), c.a, grad(-.2, .02, .78)],
          [L.grid(8, 1, (u, v, q) => { const ph = -1.35 + u * 2.7, t = .8 - .05 * v, rr = thighR(t) + .022; q[0] = Math.cos(ph) * rr * .97; q[1] = L.lr(.05, -.25, t); q[2] = Math.sin(ph) * rr; }, false), c.t]]);
      } else if (w === 'medium') {
        add('mboot', 'knee', 'cloth', () => [[tube(.02, -.17, crv([[0, .076], [1, .062]]), { nu: 14, nv: 2 }), c.a, grad(-.17, .02, .75)], [tube(.075, .015, crv([[0, .092], [1, .082]]), { nu: 14, nv: 1 }), c.d],
          [rbox(.2, .08, .102, .034).translate(.035, -.196, 0), c.d]]);
        add('mbootM', 'knee', 'metal', () => [[ell(.034, .04, .046, { nu: 10, nv: 6 }).translate(.066, .045, 0), c.m], [ring(.071, .007, -.09), c.t], [ring(.067, .007, -.13), c.t]]);
      } else add('lboot', 'knee', 'cloth', () => [[tube(.0, -.15, crv([[0, .074], [1, .062]]), { nu: 14, nv: 10 }), c.a, stripes(90, .82)], [new T3.TorusGeometry(.078, .014, 5, 14).rotateX(PI / 2).translate(0, .0, 0), c.t], [rbox(.198, .08, .1, .034).translate(.035, -.196, 0), '#5a4030']]);
    } else if (sl === 'helm') {
      if (w === 'heavy') {
        const great = r >= 2;
        add('helm', 'head', 'metal', () => { const p = [];
          if (!great) { const thm = ph => 1.46 + .45 * (1 - Math.cos(ph)) / 2;
            p.push([L.grid(22, 7, (u, v, q) => { const ph = u * PI2, th = v * thm(ph), s = Math.sin(th); q[0] = .188 * s * Math.cos(ph); q[1] = .205 * Math.cos(th) + .015; q[2] = .178 * s * Math.sin(ph); }, true), c.a, grad(-.15, .22, .72)]);
            p.push([L.grid(22, 1, (u, v, q) => { const ph = u * PI2, th = thm(ph) - .13 + v * .13, s = Math.sin(th); q[0] = .198 * s * Math.cos(ph); q[1] = .205 * Math.cos(th) + .015; q[2] = .187 * s * Math.sin(ph); }, true), c.t]);
            p.push([rbox(.02, .12, .03, .008, 2).translate(.196, -.035, 0), c.a], [new T3.TorusGeometry(.198, .012, 5, 18, PI - 1).rotateZ(.5).scale(1, 1.04, 1).translate(0, .015, 0), c.t]);
            if (r >= 1) for (const s of [-1, 1]) p.push([ell(.196, .207, .188, { th0: 1.45, th1: 2.25, ph0: s > 0 ? .95 : -1.95, ph1: s > 0 ? 1.95 : -.95, nu: 6, nv: 4 }).translate(0, .015, 0), c.a]);
          } else {
            p.push([tube(-.185, .05, crv([[0, .172], [.25, .166], [1, .18]]), { nu: 22, nv: 5, dx: 1.06 }), c.a, grad(-.2, .1, .72)], [ell(.18 * 1.06, .14, .18, { th1: PI / 2, nu: 22, nv: 6 }).translate(0, .05, 0), c.a, grad(.0, .2, .85)],
              [xf(new T3.TorusGeometry(.18, .011, 5, 22), 0, .05, 0, PI / 2, 0, 0, 1.06, 1, 1), c.t], [xf(new T3.TorusGeometry(.172, .011, 5, 22), 0, -.182, 0, PI / 2, 0, 0, 1.06, 1, 1), c.t],
              [new T3.TorusGeometry(.184, .012, 5, 20, PI).scale(1.04, .78, 1).translate(0, .05, 0), c.t], [rbox(.018, .19, .024, .007, 2).translate(.188, -.06, 0), c.t]);
            if (!glow) p.push([rbox(.02, .02, .16, .007, 2).translate(.186, .02, 0), c.d]);
            for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.push([new T3.SphereGeometry(.007, 4, 3).translate(.172, -.075 - .03 * i, s * .07), c.d]);
            if (r >= 5) { p.push([ell(.16, .08, .012, { nu: 16, nv: 6 }).translate(-.02, .19, 0), c.t]);
              for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.push([xf(ell(.1 - .015 * i, .022, .007, { nu: 8, nv: 4 }), -.07, .08 + .035 * i, s * .19, s * .25, 0, .5 + .25 * i), c.t]); }
          }
          return p; });
        if (r === 4) add('horn', 'head', 'cloth', () => [-1, 1].map(s => [bt(2.2, .02, .16, .26, .02, .07, s * .17, [.1, .45, s], [.5, 1, 0]), '#e8dcc0', grad(.05, .3, .75)]));
        if (glow) add('helmG', 'head', 'glow', () => { const p = [[rbox(.02, .02, .16, .007, 2).translate(.186, .02, 0), '#fff']]; if (r >= 6) p.push([new T3.TorusGeometry(.12, .009, 6, 28).rotateX(PI / 2).translate(-.02, .3, 0), '#fff']); return p; });
      } else if (w === 'medium') {
        add('half', 'head', 'metal', () => [[ell(.184, .2, .175, { th1: 1.4, nu: 20, nv: 6 }).translate(0, .015, 0), c.t === '#9a9ea6' ? '#9a9ea6' : hx('#9a9ea6', c.t, .4), grad(-.02, .22, .72)],
          [L.grid(20, 1, (u, v, q) => { const ph = u * PI2, th = 1.3 + .1 * v, s = Math.sin(th); q[0] = .192 * s * Math.cos(ph); q[1] = .2 * Math.cos(th) + .015; q[2] = .183 * s * Math.sin(ph); }, true), c.t]]);
        add('avent', 'head', 'cloth', () => [[L.grid(18, 8, (u, v, q) => { const ph = .95 + u * (PI2 - 1.9), y = L.lr(.04, -.21, v), rr = .182 + .04 * v; q[0] = Math.cos(ph) * rr; q[1] = y; q[2] = Math.sin(ph) * rr; }, false), c.m, stripes(70)]]);
        if (glow) add('halfG', 'head', 'glow', () => [[xf(new T3.OctahedronGeometry(1, 0), .192, .07, 0, 0, 0, 0, .01, .026, .02), '#fff']]);
      } else {
        // light helm keeps the class hat and adds a rarity plume and gem
        const gp = { helm: [.2, .03, 0], hood: [.125, -.16, 0], wizard: [.178, .15, .04], hair: [.17, .1, 0] }[ht] || [.17, .1, 0];
        if (ht === 'hair') add('circ', 'head', 'metal', () => [[xf(new T3.TorusGeometry(.158, .009, 5, 24), 0, .085, 0, PI / 2 - .12, 0, 0), c.t]]);
        if (r >= 1) add('plume', 'head', 'cloth', () => [[bt(1.3, .02, .12, .24, -.02, ht === 'wizard' ? .17 : .16, ht === 'hood' ? .19 : .16, [-.7, 1, .35], [-1, 0, 0]), c.t, grad(.15, .4, .7)]]);
        if (r >= 2) add('lgem', 'head', 'glow', () => [[xf(new T3.OctahedronGeometry(1, 0), gp[0], gp[1], gp[2], 0, 0, 0, .01, .024, .02), '#fff']]);
      }
    }
    return out;
  }
  const hidesHat = (sl, w) => sl === 'helm' && (w === 'heavy' || w === 'medium');
  return { pieces, hidesHat };
})();
function buildArmorLook(pl = R3.pl, eq = S.eq) {   // also used for other players' models (multiplayer)
  if (!pl) return; if (pl.armorG) { pl.armorG.forEach(o => o.parent && o.parent.remove(o)); } pl.armorG = [];
  if (!window.HUM3) makeHumanoid({ body: '#888888' });
  const L = window.HUM3; let hide = false;
  for (const sl of ['armor', 'helm', 'gloves', 'boots']) {
    const it = eq && eq[sl]; if (!it) continue; const w = wgtOf(it) || 'medium', r = Math.max(0, Math.min(RAR.length - 1, it.r | 0));
    if (ARM3_KIT.hidesHat(sl, w)) hide = true;
    for (const pc of ARM3_KIT.pieces(sl, w, r, pl.hatType)) {
      const geo = gx('a3|' + sl + '|' + w + '|' + r + '|' + (pl.hatType || '') + '|' + pc.n, () => L.merge(pc.f()));
      const m = pc.m === 'glow' ? mat(RAR[r].c, { em: 1.1 + .25 * Math.max(0, r - 3), rough: .4 }) : pc.m === 'cloth' ? L.clothDS : (r >= 2 ? L.metal : L.metalW);
      const pvs = pc.pv === 'arm' ? [pl.armL, pl.armR] : pc.pv === 'leg' ? [pl.legL, pl.legR] : pc.pv === 'knee' ? [pl.kneeL, pl.kneeR] : [pl[pc.pv]];
      for (const p of pvs) { if (!p) continue; const me = new T3.Mesh(geo, m); me.castShadow = pc.m !== 'glow'; p.add(me); pl.armorG.push(me); }
    }
  }
  if (pl.hat) pl.hat.forEach(m => { m.visible = !hide; });
}
{ const _rpG = render3D; render3D = function (dt) { if (R3 && R3.pl && S && S.eq) { const key = ['armor', 'helm', 'gloves', 'boots'].map(sl => { const it = S.eq[sl]; return it ? it.id + ':' + it.r : '-'; }).join('|'); if (R3.alKey !== key || R3.alPl !== R3.pl) { R3.alKey = key; R3.alPl = R3.pl; try { buildArmorLook(); } catch (e) { } } } _rpG(dt); }; }
// ---------- feats & wiki ----------
ACH.push(
  { id: 'disc1', n: 'Disciplined', d: 'Wear 4 armor pieces of the same weight', c: () => Math.max(...Object.values(wgtCounts())), need: 4, sp: 1 },
  { id: 'tmp1', n: 'Tempered Steel', d: 'Temper an armor piece', c: () => S.stats.tempered || 0, need: 1, sp: 0 },
  { id: 'awk1', n: 'Awakener', d: 'Awaken a Legendary weapon', c: () => S.stats.awakened || 0, need: 1, sp: 2 },
);
WIKI_TXT.weapons.push(
  ['Armor Weights', 'Every helm, chestplate, gloves and boots is Light ' + WGT.light.ic + ', Medium ' + WGT.medium.ic + ' or Heavy ' + WGT.heavy.ic + '. Light: +4% move speed, +2% crit. Medium: +3% attack speed, +3% life. Heavy: +2.5% damage reduction, +5% life, -2% move speed. Wear all 4 pieces of one weight for a Discipline: Evasion (Light — 8% chance to evade, faster dodge), Battle Rhythm (Medium — hits heal 0.4% life up to 4×/s, +6% damage) or Bulwark (Heavy — the first hit every 6s deals 60% less, +6% damage reduction). Heavy and Medium chests show as shoulder armor on your character.'],
  ['Tempering', 'At Brann\'s forge you can temper any equipped armor piece (helm, chest, gloves, boots, ring or amulet) with one hand-picked bonus: Vitality, Guarding, Spiked, Fleet, Fury, Focus, Keen or Mending. Higher rarity pieces get a stronger temper. Re-tempering replaces it.'],
  ['Awakening', 'Legendary and Mythic weapons can be Awakened at the forge once you reach Mastery 10 with that weapon type. An Awakened weapon (✧) deals +15% damage and its Art is empowered by 25% — stacking with the Mastery 15 bonus.'],
  ['Swap Strike', 'Keep a second weapon in your Off Hand. Swapping (Tab / X) in a fight grants +20% damage for 3 seconds (6s cooldown) — great for switching between a ranged opener and a melee finisher.'],
  ['Monster Scaling', 'Monsters get stronger the deeper you go. If you return to an easier region far above its level, foes there scale up a little with you (and so does their loot), so old areas stay worth playing.'],
);
