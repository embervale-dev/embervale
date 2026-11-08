// ================= FEATURE PACK A: item sets, crafting, skill runes, fighting companions =================
// ---------- item sets ----------
function genSetItem(key, slot, il) {
  const S_ = SETS[key]; slot = slot || pick(S_.pieces);
  const it = genItem(il, { slot, r: 4 }); it.u = null; it.set = key; it.name = `${S_.n} ${AT[slot].n}`; return it;
}
function setCounts() { const c = {}; for (const sl of ARMOR_SLOTS) { const it = S.eq[sl]; if (it && it.set) c[it.set] = (c[it.set] || 0) + 1; } return c; }
const _xsA = extraStats;
extraStats = function (s) { _xsA(s); const c = setCounts(); for (const k in c) { const B = SETS[k].b; if (c[k] >= 2) B[0][1](s); if (c[k] >= 4) B[1][1](s); } };
function setHTML(k) {
  const S_ = SETS[k], c = setCounts()[k] || 0;
  return `<hr><div style="color:${S_.col};font-weight:bold">${ico('set-piece')} ${S_.n} (${c}/4 worn)</div>` +
    S_.pieces.map(p => { const on = S.eq[p] && S.eq[p].set === k; return `<div style="font-size:12px;color:${on ? S_.col : '#777'}">${on ? ico('check') : '○'} ${AT[p].n}</div>`; }).join('') +
    S_.b.map((b, i) => `<div style="font-size:12px;color:${c >= (i ? 4 : 2) ? '#7aff7a' : '#888'}">(${i ? 4 : 2}) ${b[0]}</div>`).join('');
}
const _itA = itemTip; itemTip = function (it, cmp) { const h = _itA(it, cmp); return it.set ? h + setHTML(it.set) : h; };
const _cellA = cell; cell = function (it, act) { const h = _cellA(it, act); return it.set ? h.replace(`class="cell r${it.r}"`, 'class="cell rset" style="--sc:' + SETS[it.set].col + '"') : h; };
const _shA = statsHTML; statsHTML = function () { const c = setCounts(); let h = _shA(); const keys = Object.keys(c); if (keys.length) h += `<div style="display:block;margin-top:6px">${keys.map(k => `<div style="color:${SETS[k].col};display:block">${ico('set-piece')} ${SETS[k].n} ${c[k]}/4</div>`).join('')}</div>`; return h; };
function setDropRoll(e) {
  const ch = e.boss ? .18 : e.champ ? .12 : e.elite ? .015 : 0; if (!ch || Math.random() > ch * (1 + luckEff() / 300)) return;
  const pool = Object.keys(SETS).filter(k => G.abyss || SETS[k].reg.includes(G.region)); if (!pool.length) return;
  dropItem(genSetItem(pick(pool), null, G.pw + 1), e.x, e.y); toast(ico('set-piece') + ' A Set item dropped!', '#5ae0a0');
}
const _kA = killEnemy; killEnemy = function (e) { if (e.dead) return; _kA(e); if (!e.prop) setDropRoll(e); };
const _nfA = noteFound; noteFound = function (it) { _nfA(it); if (it.set) { S.found.set = S.found.set || {}; const f = S.found.set[it.set] = S.found.set[it.set] || {}; f[it.slot] = 1; } };
// ---------- crafting at Brann's workbench ----------
const CR = { slot: 'weapon', t: 'sword', r: 3, aff: 'dmg', u: '' };
const CR_COST = { 2: { sh: 30, ore: 3, ess: 0, g: 1 }, 3: { sh: 80, ore: 8, ess: 0, g: 3 }, 4: { sh: 220, ore: 16, ess: 1, g: 8 } };
function craftCost() { const c = CR_COST[CR.r]; return { sh: c.sh, ore: c.ore, ess: c.ess + (CR.r === 4 && CR.u ? 1 : 0), g: Math.round(c.g * 60 * Math.pow(1.12, Math.min(maxPw(), 120))) }; }
function canCraft() { const c = craftCost(); return S.shards >= c.sh && S.ore >= c.ore && (S.ess || 0) >= c.ess && S.gold >= c.g && S.inv.length < S.invMax; }
function doCraft() {
  if (!canCraft()) { toast('Missing materials or bag space', '#ff8a8a'); sfx('error'); return; }
  const c = craftCost(); S.shards -= c.sh; S.ore -= c.ore; S.ess = (S.ess || 0) - c.ess; S.gold -= c.g;
  const it = genItem(maxPw() + 1, { slot: CR.slot === 'weapon' ? 'weapon' : CR.slot, t: CR.slot === 'weapon' ? CR.t : undefined, r: CR.r });
  const A = AFF[CR.aff]; if (A) { let v = rnd(A.min, A.max) * (1 + .12 * it.r) * 1.15; if (A.sc) v *= Math.pow(A.sc, it.il); const nv = { k: CR.aff, v: v >= 100 ? Math.round(v) : Math.round(v * 10) / 10, q: .8 + Math.random() * .2 }; const i = it.aff.findIndex(a => a.k === CR.aff); if (i >= 0) it.aff[i] = nv; else if (it.aff.length) it.aff[0] = nv; else it.aff.push(nv); }
  if (CR.r === 4 && CR.u) it.u = CR.u; it.name = itemName(it); it.isNew = true; it.crafted = 1;
  S.inv.push(it); noteFound(it); S.stats.crafted = (S.stats.crafted || 0) + 1; sfx('lvl'); burst(P.x, P.y, '#ffb04a', 30, 200, .7, 3, 1);
  toast(`${ico('craft')} Crafted <span style="color:${RAR[it.r].c}">${it.name}</span>!`); saveGame(); renderMenu();
}
const _salvA = salvage; salvage = function (it) { const leg = it.r >= 4; _salvA(it); if (leg) { S.ess = (S.ess || 0) + (it.r >= 5 ? 2 : 1); } };
MENUS.craft = () => {
  const isW = CR.slot === 'weapon', pool = [...new Set(isW ? AFF_W : AFF_A)], c = craftCost();
  if (!pool.includes(CR.aff)) CR.aff = pool[0];
  const uPool = isW ? UNQ_W : UNQ_A; if (CR.u && !uPool.includes(CR.u)) CR.u = '';
  const opt = (arr, cur, fn) => arr.map(([v, n]) => `<span class="btn ${cur === v ? 'on' : ''}" style="padding:3px 9px;font-size:12px" onclick="${fn}('${v}')">${n}</span>`).join('');
  const have = (n, h) => `<span style="color:${h >= n ? '#7aff7a' : '#ff7a6a'}">${fmt(n)}</span>`;
  return `<h2>${ico('craft')} Brann's Workbench</h2><div class="dim">"Tell me what you need, and I'll forge it. No luck involved — just good steel and the right materials." Crafted items are made at your highest item level.</div>
  <h3>1. Slot</h3><div>${opt([['weapon', ico('swords') + ' Weapon'], ...ARMOR_SLOTS.map(s => [s, AT[s].ic + ' ' + AT[s].n])], CR.slot, 'crSlot')}</div>
  ${isW ? `<h3>2. Weapon type</h3><div>${opt(Object.keys(WT).map(t => [t, WT[t].ic + ' ' + WT[t].n]), CR.t, 'crT')}</div>` : ''}
  <h3>${isW ? 3 : 2}. Rarity</h3><div>${opt([['2', 'Rare'], ['3', 'Epic'], ['4', 'Legendary']], String(CR.r), 'crR')}</div>
  <h3>${isW ? 4 : 3}. Guaranteed bonus <span class="dim">(rolled 15% stronger than normal)</span></h3><div>${opt(pool.map(k => [k, AFF[k].n.replace(/^[% ]+/, '')]), CR.aff, 'crA')}</div>
  ${CR.r === 4 ? `<h3>Legendary power <span class="dim">(choosing one costs +1 essence)</span></h3><div>${opt([['', ico('dice') + ' Random'], ...uPool.map(u => [u, UNQ[u].n])], CR.u, 'crU')}</div>${CR.u ? `<div class="dim" style="color:#ffb05a">★ ${UNQ[CR.u].d}</div>` : ''}` : ''}
  <div class="card" style="margin-top:10px">Cost: ${have(c.sh, S.shards)} ✦ shards • ${have(c.ore, S.ore)} ◆ ore • ${have(c.g, S.gold)} gold${c.ess ? ` • ${have(c.ess, S.ess || 0)} ${ico('essence')} Legendary Essence` : ''}<div class="dim">You have ${fmt(S.shards)} ✦, ${S.ore} ◆, ${fmt(S.gold)} gold, ${S.ess || 0} ${ico('essence')} essence. Essence comes from salvaging Legendary (1) and Mythic (2) items.</div></div>
  <div class="btn bigb ${canCraft() ? '' : 'dis'}" onclick="doCraft()">${ico('craft')} Craft</div><span class="btn" onclick="openMenu('smith')">Back to Brann</span>`;
};
function crSlot(v) { CR.slot = v; renderMenu(); } function crT(v) { CR.t = v; renderMenu(); } function crR(v) { CR.r = +v; renderMenu(); } function crA(v) { CR.aff = v; renderMenu(); } function crU(v) { CR.u = v; renderMenu(); }
{ const _smA = MENUS.smith; MENUS.smith = () => _smA().replace('<h2>' + ico('anvil') + ' Blacksmith Brann</h2>', `<h2>${ico('anvil')} Blacksmith Brann <span class="btn" style="font-size:13px" onclick="openMenu('craft')">${ico('craft')} Craft gear</span></h2>`); }
// ---------- skill runes ----------
function runeOf(id) { return (S.runes || {})[id]; }
function setRune(id, k) { S.runes = S.runes || {}; S.runes[id] = S.runes[id] === k ? null : k; sfx('click'); renderMenu(); }
function runeRow(s, r) {
  if (!s.a) return ''; if (r < 3) return `<div class="dim" style="font-size:10px;width:100%">Rune slot unlocks at rank 3</div>`;
  return `<div class="binds" style="margin-top:2px">${Object.keys(RUNES).map(k => `<span class="bk ${runeOf(s.id) === k ? 'on' : ''}" title="${RUNES[k].n}: ${RUNES[k].d}" onclick="setRune('${s.id}','${k}')">${RUNES[k].ic}</span>`).join('')}</div>`;
}
let RUNE_MUL = 1;
const _pdR = pdmg; pdmg = function () { return _pdR() * RUNE_MUL; };
const _csR = castSkill;
castSkill = function (id) {
  const rn = id && RUNES[runeOf(id)]; if (!rn) return _csR(id);
  const sk = SKI[id], mp0 = sk.mp, cd0 = sk.cd; sk.mp = Math.round(mp0 * rn.mp); sk.cd = cd0 * rn.cd; RUNE_MUL = rn.dmg;
  try { _csR(id); } finally { sk.mp = mp0; sk.cd = cd0; RUNE_MUL = 1; }
};
const _tsR = tipSkill; tipSkill = function (id, ev) { _tsR(id, ev); const rn = RUNES[runeOf(id)]; if (rn) { const c = tip.querySelector('.tc'); if (c) c.innerHTML += `<hr><div style="color:#ffd27a">${rn.ic} ${rn.n} rune: ${rn.d}</div>`; } };
// ---------- fighting companions ----------
const _uA = update;
update = function (dt) {
  _uA(dt);
  if (G.mode !== 'play' || G.menu || !S || !P || G.inTown || !S.cos.pet) return;
  G.petT = (G.petT || 0) - dt; if (G.petT > 0) return;
  const src = R3 && R3.petPos ? R3.petPos : P, t = nearestEnemy(src.x, src.y, 400); if (!t) { G.petT = .3; return; }
  G.petT = 2.2 - petLvl(S.cos.pet) * .06; const a = Math.atan2(t.y - src.y, t.x - src.x), col = PETS[S.cos.pet].col;
  G.pp.push({ x: src.x, y: src.y, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 6, dmg: pdmg() * (.1 + .01 * petLvl(S.cos.pet)), pr: 0, hit: new Set(), life: 1, kind: 'spark', home: 5, splash: 0, skill: 1, col, out: 0, ret: false, spin: 0, child: 1 });
};
