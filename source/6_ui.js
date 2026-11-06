// ================= UI / MENUS =================
const ov = $('ov'), panel = $('panel'), tip = $('tip');
const MENUS = {};
const LOCKED_MENUS = ['title', 'class', 'dead', 'intro', 'confirm', 'dialog', 'boon'];
const CHAR_TABS = [['inv', '🎒 Inventory', 'I'], ['skills', '✨ Skills', 'K'], ['paragon', '✦ Constellation', 'P'], ['quests', '📜 Bounties', 'J'], ['achieve', '🏆 Feats', 'O'], ['journal', '📖 Journal', 'L'], ['bestiary', '🐺 Bestiary', 'B'], ['arsenal', '⚔️ Arsenal', 'N'], ['wardrobe', '👑 Wardrobe', 'G'], ['map', '🗺️ Map', 'M']];
function openMenu(name) {
  if (G.menu && G.menu !== name && (name === 'help' || name === 'settings' || name === 'wiki')) G.prevMenu = G.menu;
  G.menu = name; ov.classList.add('show'); mouse.down = false; hideTip(); renderMenu();
}
function closeMenu() {
  if (G.menu === 'inv') S.inv.forEach(i => i.isNew = false);
  G.menu = null; ov.classList.remove('show'); hideTip(); if (G.mode === 'play' && S) saveGame();
}
function backMenu() { const p = G.prevMenu; G.prevMenu = null; if (p) openMenu(p); else closeMenu(); }
function renderMenu() {
  const f = MENUS[G.menu]; const st = panel.scrollTop;
  panel.className = 'panel' + (['title', 'class', 'confirm'].includes(G.menu) ? ' ttl' : '') + (G.menu === 'dialog' ? ' dlg' : '') + (TAB_NAMES[G.menu] && S ? ' tabbed' : '');
  ov.style.background = G.menu === 'title' || G.menu === 'class' || G.menu === 'confirm' ? 'radial-gradient(ellipse at center,rgba(0,0,0,.15),rgba(0,0,0,.65))' : G.menu === 'dialog' ? 'linear-gradient(transparent 55%,rgba(0,0,0,.7))' : '';
  ov.classList.toggle('dlgov', G.menu === 'dialog');
  panel.innerHTML = f ? f() : '';
  if (S && G.menu && !TAB_NAMES[G.menu] && !LOCKED_MENUS.includes(G.menu) && !['victory', 'slots', 'report'].includes(G.menu)) panel.insertAdjacentHTML('afterbegin', '<div class="pclose" title="Close (Esc)" onclick="backMenu()">✕</div>');
  panel.scrollTop = st;
  if (G.menu === 'map') { const c = $('mapc'); if (c) drawBigMap(c); }
  if (G.menu === 'wiki') { wikiRender(); const q = $('wikiq'); if (q && WIKI_Q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
}
const TAB_GROUPS = [['🧙 Character', ['inv', 'skills', 'paragon', 'wardrobe']], ['🏆 Progress', ['quests', 'season', 'achieve']], ['📚 Codex', ['journal', 'bestiary', 'arsenal', 'wiki']], ['🗺️ Map', ['map']]];
const TAB_NAMES = { inv: ['🎒 Inventory', 'I'], skills: ['✨ Skills', 'K'], paragon: ['✦ Constellation', 'P'], wardrobe: ['👑 Wardrobe', 'G'], quests: ['📜 Bounties', 'J'], season: ['🏅 Season', 'Y'], achieve: ['🏆 Feats', 'O'], journal: ['📖 Journal', 'L'], bestiary: ['🐺 Bestiary', 'B'], arsenal: ['⚔️ Arsenal', 'N'], wiki: ['❓ Wiki', 'H'], map: ['🗺️ Map', 'M'] };
function tabs(cur) {
  const grp = TAB_GROUPS.find(g => g[1].includes(cur)) || TAB_GROUPS[0];
  return `<div class="tabs grp">${TAB_GROUPS.map(g => `<div class="tab ${g === grp ? 'on' : ''}" onclick="openMenu('${g[1][0]}')">${g[0]}</div>`).join('')}<div style="flex:1"></div><div class="tab" onclick="closeMenu()" title="Close (Esc)">✕</div></div>` +
    (grp[1].length > 1 ? `<div class="tabs sub">${grp[1].map(t => `<div class="tab ${t === cur ? 'on' : ''}" onclick="openMenu('${t}')">${TAB_NAMES[t][0]} <span class="dim">${TAB_NAMES[t][1]}</span></div>`).join('')}</div>` : '');
}
ov.addEventListener('mousedown', e => { if (e.target === ov && G.menu && !LOCKED_MENUS.includes(G.menu)) closeMenu(); });
function onKey(k) {
  initAudio();
  if (G.menu === 'dialog') { if (k === 'escape') dlgSkip(); else if (k === ' ' || k === 'enter' || k === 'e' || k === 'f') dlgNext(); return; }
  if (!S || G.mode === 'title' || G.mode === 'dead' || LOCKED_MENUS.includes(G.menu)) return;
  if (k === 'escape') { if (G.menu) closeMenu(); else openMenu('pause'); return; }
  const map = { i: 'inv', c: 'inv', k: 'skills', m: 'map', j: 'quests', o: 'achieve', l: 'journal', b: 'bestiary', n: 'arsenal', h: 'wiki', p: 'paragon', y: 'season', g: 'wardrobe' };
  if (map[k]) { if (G.menu === map[k]) closeMenu(); else if (!G.menu || TAB_NAMES[G.menu] || G.menu === 'pause') openMenu(map[k]); }
}

// ---------- tooltips ----------
function moveTip(ev) { if (!ev) return; const w = tip.offsetWidth, h = tip.offsetHeight; let x = ev.clientX + 18, y = ev.clientY + 14; if (x + w > innerWidth - 8) x = ev.clientX - w - 14; if (y + h > innerHeight - 8) y = innerHeight - h - 8; tip.style.left = Math.max(4, x) + 'px'; tip.style.top = Math.max(4, y) + 'px'; }
function hideTip() { tip.style.display = 'none'; }
function findItem(id) { return S.inv.find(i => i.id === id) || Object.values(S.eq).find(i => i && i.id === id) || S.shop.find(i => i.id === id); }
function eqSlotOf(it) { for (const k in S.eq) if (S.eq[k] === it) return k; return null; }
function statLine(k, v) { const A = AFF[k]; if (!A) return ''; return `+${A.flat && v >= 10 ? fmt(v) : (Math.round(v * 10) / 10)}${A.n}`; }
function itemTip(it, cmp) {
  const c = RAR[it.r].c, s = itemStats(it);
  let h = `<div class="tn" style="color:${c}">${icon(it)} ${it.name}${it.plus ? ` <span style="color:#ffe9a0">+${it.plus}</span>` : ''}</div>`;
  h += `<div class="dim">${RAR[it.r].n} ${baseName(it)} • Item Level ${it.il}</div><hr>`;
  if (it.slot === 'weapon') { const w = WT[it.t]; h += `<div>Damage: <b>${fmt(s.wdmg)}</b>${w.cnt ? ` × ${w.cnt}` : ''}</div><div>Attacks/sec: ${(1 / w.cd).toFixed(2)} • DPS ${fmt(wDps(it))}</div><div class="dim">${wDesc(w)}</div>`; }
  else for (const k in AT[it.t].base) h += `<div>${statLine(k, s[k] - (it.aff.filter(a => a.k === k).reduce((q, a) => q + a.v * (1 + .05 * it.plus), 0)))}</div>`;
  for (const a of it.aff) h += `<div style="color:#9ad0ff">${statLine(a.k, a.v * (1 + .05 * it.plus))}</div>`;
  if (it.u) h += `<div class="uq">★ ${UNQ[it.u].d}</div>`;
  if (it.u2) h += `<div class="uq">★ ${UNQ[it.u2].d}</div>`;
  if (it.art) h += `<div style="color:#7ffcff;margin-top:4px">✦ <b>Signature:</b> ${ARTI[it.art].d}</div><div class="dim" style="font-style:italic;margin-top:3px">"${ARTI[it.art].lore}"</div>`;
  if (it.locked) h += `<div class="dim">🔒 Locked — Alt+Click to unlock</div>`;
  if (cmp) return h + `<div class="dim" style="margin-top:4px">— Currently equipped —</div>`;
  const eqs = eqSlotOf(it);
  if (eqs) h += `<div class="dim" style="margin-top:4px">Equipped (${SLOTN[eqs]})</div>`;
  else {
    const cur = it.slot === 'weapon' ? S.eq.weapon : S.eq[it.slot];
    if (it.slot === 'weapon') { const a = wDps(it), b = wDps(cur); if (cur) { const p = Math.round((a / b - 1) * 100); h += `<div class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}% raw DPS vs equipped</div>`; } else h += `<div class="up">▲ No weapon equipped</div>`; }
    else if (cur) { const a = itemStats(it), b = itemStats(cur); const d = (a.hp || 0) - (b.hp || 0); if (a.hp || b.hp) h += `<div class="${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'} ${fmt(Math.abs(d))} Life vs equipped</div>`; }
    else h += `<div class="up">▲ Empty slot</div>`;
    if (S.inv.includes(it)) { const g = gainPct(it); h += `<div class="${g >= 0 ? 'up' : 'dn'}" style="font-weight:bold">${g >= 0 ? '▲' : '▼'} ${Math.abs(g).toFixed(1)}% overall power ${it.slot === 'weapon' ? '(as main hand)' : ''}</div><div class="dim">Counts every stat: damage, crit, life steal, elements, uniques, life & more</div>`; }
  }
  h += `<div class="dim">Sell value: <span class="gold">${fmt(itemVal(it))}g</span></div>`;
  return h;
}
function wDesc(w) { return { arc: 'Melee sweep — deflects projectiles', slam: 'Heavy ground slam — area damage', thrust: 'Long-reach piercing thrust', spin: 'Full 360° reap', shot: 'Ranged projectile' + (w.pr ? ' — pierces' : '') + (w.home ? ' — homing' : '') + (w.splash ? ' — explodes' : ''), orb: 'Homing orb that explodes', fan: 'Fires a spread of pages', boom: 'Returning blade — pierces everything' }[w.k]; }
function tipItem(id, ev) {
  const it = findItem(id); if (!it) return; it.isNew = false;
  const cur = eqSlotOf(it) ? null : (it.slot === 'weapon' ? S.eq.weapon : S.eq[it.slot]);
  tip.innerHTML = `<div class="tc">${itemTip(it)}</div>${cur ? `<div class="tc cmp">${itemTip(cur, 1)}</div>` : ''}`;
  tip.style.display = 'flex'; moveTip(ev);
}
function tipSkill(id, ev) {
  const s = SKI[id], r = S.sk[id] || 0;
  let h = `<div class="tn" style="color:${BRC[s.b]}">${s.ic} ${s.n}</div><div class="dim">${s.a ? 'Active skill' : 'Passive'} • Rank ${r}/${s.max}${s.a ? ` • ${s.mp} mana • ${s.cd}s cooldown` : ''}</div><hr>`;
  h += `<div>${s.d(Math.max(1, r))}</div>`; if (r && r < s.max) h += `<div class="dim" style="margin-top:6px">Next rank: ${s.d(r + 1)}</div>`;
  tip.innerHTML = `<div class="tc">${h}</div>`; tip.style.display = 'flex'; moveTip(ev);
}
function cell(it, act) { return `<div class="cell r${it.r}" onmouseenter="tipItem(${it.id},event)" onmousemove="moveTip(event)" onmouseleave="hideTip()" onclick="${act}(${it.id},event)" oncontextmenu="${act}(${it.id},event,1);return false;">${icon(it)}${it.plus ? `<b>+${it.plus}</b>` : ''}${it.isNew ? '<i>NEW</i>' : ''}${it.locked ? '<u>🔒</u>' : ''}</div>`; }

// ---------- inventory ----------
function statsHTML() {
  const w = WT[ST.wt], aps = (1 / w.cd) * atkRate(), d = pdmg();
  const rows = [
    ['Weapon', w.n], ['Damage', fmt(d)], ['Attacks/sec', aps.toFixed(2)], ['Est. DPS', fmt(d * aps * (1 + ST.critC / 100 * ST.critD / 100) * (w.cnt ? 1.6 : 1))],
    ['Crit Chance', ST.critC.toFixed(1) + '%'], ['Crit Damage', '+' + ST.critD.toFixed(0) + '%'], ['Max Life', fmt(ST.maxHp)], ['Life Regen', fmt(ST.hpReg) + '/s'], ['Max Mana', fmt(ST.maxMp)],
    ['Damage Reduction', ST.dr.toFixed(1) + '%'], ['Move Speed', '+' + ST.moveSpd.toFixed(0) + '%'], ['Life Steal', ST.ls.toFixed(1) + '%'], ['Cooldown Red.', ST.cdr.toFixed(0) + '%'], ['Skill Damage', '+' + ST.skill.toFixed(0) + '%'],
    ['Magic Find', '+' + ST.luck.toFixed(0) + '%'], ['Gold Find', '+' + ST.gold.toFixed(0) + '%'], ['Bonus XP', '+' + ST.xp.toFixed(0) + '%'], ['Surge Gain', '+' + ST.surge.toFixed(0) + '%'], ['Combo Bonus', '+' + ST.combo.toFixed(0) + '%'],
    ['Burn/Freeze', `${ST.burn.toFixed(0)}% / ${ST.frz.toFixed(0)}%`], ['Shock/Poison', `${ST.shk.toFixed(0)}% / ${ST.psn.toFixed(0)}%`], ['Thorns', ST.thorns.toFixed(0) + '%'],
  ];
  return `<h3>Lv ${S.lvl} ${CLS[S.cls].n}</h3><div class="dim">XP ${fmt(S.xp)} / ${fmt(xpNeed(S.lvl))}</div>` + rows.map(r => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join('') +
    (Object.keys(ST.u).length ? `<div class="uq" style="color:#ffb05a;display:block;margin-top:6px">${Object.keys(ST.u).map(u => '★ ' + UNQ[u].n).join('<br>')}</div>` : '');
}
MENUS.inv = () => {
  let h = tabs('inv') + `<h2>Inventory <span class="dim">${S.inv.length}/${S.invMax}</span> <span class="gold" style="font-size:15px">● ${fmt(S.gold)}</span> <span class="ore" style="font-size:15px">◆ ${S.ore} ore</span> <span class="shard" style="font-size:15px">✦ ${S.shards} shards</span></h2><div class="invwrap"><div class="eq">`;
  for (const sl of SLOTS) { const it = S.eq[sl]; h += `<div class="eqrow">${it ? cell(it, 'uiInv') : `<div class="cell empty">${sl === 'weapon' || sl === 'weapon2' ? '⚔' : AT[sl].ic}</div>`}<div>${SLOTN[sl]}</div></div>`; }
  h += `</div><div class="grid">`;
  for (const it of S.inv) h += cell(it, 'uiInv');
  for (let i = S.inv.length; i < S.invMax; i++) h += `<div class="cell empty"></div>`;
  h += `</div><div class="stats">${statsHTML()}</div></div>
  <div class="hint">Click: equip / unequip • Right-click weapon: equip to Off Hand • Shift+Click: salvage • Alt+Click: lock/unlock • Hover to compare</div>
  <span class="btn" onclick="salvageJunk(1)">Salvage all Common & Uncommon</span><span class="btn" onclick="salvageJunk(2)">Salvage all Rare & below</span><span class="btn" onclick="sortInv()">Sort</span><span class="btn" onclick="autoEquip()" title="Weighs every stat: damage, crit, attack speed, life steal, elements, unique powers, life, armor and more">⚡ Auto-equip best gear</span>`;
  return h;
};
function afterGear() { calcStats(); P.hp = Math.min(P.hp, ST.maxHp); P.mp = Math.min(P.mp, ST.maxMp); }
function equip(it, slot) { const i = S.inv.indexOf(it); if (i < 0) return; S.inv.splice(i, 1); const old = S.eq[slot]; S.eq[slot] = it; if (old) S.inv.splice(i, 0, old); sfx('click'); }
function uiInv(id, ev, right) {
  const it = findItem(id); if (!it) return; const es = eqSlotOf(it);
  if (ev && ev.altKey) { it.locked = !it.locked; sfx('click'); renderMenu(); hideTip(); return; }
  if (es) { if (S.inv.length >= S.invMax) { toast('Inventory full'); return; } S.eq[es] = null; S.inv.push(it); sfx('click'); }
  else if (ev && ev.shiftKey) { if (it.locked) { toast('That item is locked (Alt+Click to unlock)'); return; } salvage(it); }
  else equip(it, it.slot === 'weapon' ? (right ? 'weapon2' : 'weapon') : it.slot);
  afterGear(); renderMenu(); hideTip();
}
function autoEquip() {
  const before = curScore(); const changes = [];
  for (let pass = 0; pass < 2; pass++) {
    // main hand: best weapon of any type, judged by total character power
    const weps = [S.eq.weapon, S.eq.weapon2, ...S.inv.filter(i => i.slot === 'weapon')].filter(Boolean);
    let best = S.eq.weapon, bs = curScore();
    for (const w of weps) { if (w === S.eq.weapon) continue; const sc = w === S.eq.weapon2 ? (swapEq(), curScore() + (swapEq(), 0)) : scoreWith('weapon', w); if (sc > bs * 1.001) { bs = sc; best = w; } }
    if (best && best !== S.eq.weapon) { if (best === S.eq.weapon2) swapEq(); else equip(best, 'weapon'); changes.push(best); }
    for (const sl of ARMOR_SLOTS) {
      let cand = null, cs = curScore();
      for (const it of S.inv) if (it.slot === sl) { const sc = scoreWith(sl, it); if (sc > cs * 1.001) { cs = sc; cand = it; } }
      if (cand) { equip(cand, sl); changes.push(cand); }
    }
  }
  // off hand: strongest weapon of the opposite style (melee <-> ranged) for versatility, else next best
  const main = S.eq.weapon; const pool = [S.eq.weapon2, ...S.inv.filter(i => i.slot === 'weapon')].filter(Boolean);
  if (main && pool.length) {
    const score2 = w => scoreWith('weapon', w) * (isRanged(w.t) !== isRanged(main.t) ? 1.25 : 1);
    let b2 = S.eq.weapon2, b2s = S.eq.weapon2 ? score2(S.eq.weapon2) : 0;
    for (const w of pool) { const sc = score2(w); if (sc > b2s * 1.001) { b2s = sc; b2 = w; } }
    if (b2 && b2 !== S.eq.weapon2) { const i = S.inv.indexOf(b2); S.inv.splice(i, 1); if (S.eq.weapon2) S.inv.push(S.eq.weapon2); S.eq.weapon2 = b2; changes.push(b2); }
  }
  afterGear(); const gain = (curScore() / before - 1) * 100;
  toast(changes.length ? `⚡ Equipped ${changes.length} item${changes.length > 1 ? 's' : ''} — overall power <span class="up">+${gain.toFixed(1)}%</span>` : 'You are already wearing your best gear!'); sfx(changes.length ? 'lvl' : 'click'); renderMenu();
}
function swapEq() { [S.eq.weapon, S.eq.weapon2] = [S.eq.weapon2, S.eq.weapon]; calcStats(); }
function itemScore(it) { const s = itemStats(it); return (s.hp || 0) + (s.dr || 0) * 20 * Math.pow(1.11, it.il) + it.aff.length * 8 * Math.pow(1.11, it.il) + (it.u ? 40 * Math.pow(1.11, it.il) : 0); }
const SALV = [1, 2, 4, 8, 16, 30, 60];
function salvage(it) { const i = S.inv.indexOf(it); if (i < 0) return; S.inv.splice(i, 1); S.shards += SALV[it.r]; if (it.r >= 3) S.ore += it.r - 2; sfx('gold'); }
function salvageJunk(maxR) { let n = 0, sh = 0; for (const it of S.inv.slice()) if (it.r <= maxR && !it.locked) { sh += SALV[it.r]; salvage(it); n++; } toast(n ? `Salvaged ${n} items for ${sh} shards` : 'Nothing to salvage'); renderMenu(); }
function sortInv() { S.inv.sort((a, b) => b.r - a.r || (a.slot > b.slot ? 1 : -1) || b.il - a.il); renderMenu(); }

// ---------- skills ----------
function branchPts(b) { return SK.filter(s => s.b === b).reduce((a, s) => a + (S.sk[s.id] || 0), 0); }
function canLearn(s) { return S.sp > 0 && (S.sk[s.id] || 0) < s.max && branchPts(s.b) >= TIER_REQ[s.t]; }
function learn(id) {
  const s = SKI[id]; if (!canLearn(s)) return; S.sp--; S.sk[id] = (S.sk[id] || 0) + 1; sfx('lvl');
  if (s.a && S.sk[id] === 1 && !S.bind.includes(id)) { const i = S.bind.indexOf(null); if (i >= 0) S.bind[i] = id; }
  afterGear(); renderMenu();
}
function bindSkill(id, i) { const was = S.bind[i] === id; for (let k = 0; k < 4; k++) if (S.bind[k] === id) S.bind[k] = null; if (!was) S.bind[i] = id; sfx('click'); renderMenu(); }
MENUS.skills = () => {
  let h = tabs('skills') + `<h2>Skill Tree <span class="pts">${S.sp} point${S.sp === 1 ? '' : 's'} available</span></h2><div class="dim">1 point per level, 2 per guardian slain, more from Feats. Tiers unlock as you invest in a branch. Mix branches freely!</div><div class="tree">`;
  for (let b = 0; b < 3; b++) {
    const bp = branchPts(b);
    h += `<div class="branch"><h3 style="color:${BRC[b]}">${BR[b]} <span class="dim">(${bp} pts)</span></h3>`;
    for (let t = 0; t < 5; t++) {
      const locked = bp < TIER_REQ[t];
      h += `<div class="tier ${locked ? 'locked' : ''}">${locked ? `<div class="req">Needs ${TIER_REQ[t]} pts</div>` : ''}`;
      for (const s of SK.filter(s => s.b === b && s.t === t)) {
        const r = S.sk[s.id] || 0;
        h += `<div class="node ${s.a ? 'act' : ''} ${r ? 'has' : ''}" onmouseenter="tipSkill('${s.id}',event)" onmousemove="moveTip(event)" onmouseleave="hideTip()"><div class="nic">${s.ic}</div><div class="nn">${s.n}<br><span class="dim">${s.a ? '◆ Active ' : ''}${r}/${s.max}</span></div>${canLearn(s) ? `<span class="plus" onclick="learn('${s.id}')">+</span>` : ''}`;
        if (s.a) h += runeRow(s, r);
        if (s.a && r) h += `<div class="binds">${['Q', 'E', 'R', 'F'].map((k, i) => `<span class="bk ${S.bind[i] === s.id ? 'on' : ''}" onclick="bindSkill('${s.id}',${i})">${k}</span>`).join('')}</div>`;
        h += `</div>`;
      }
      h += `</div>`;
    }
    h += `</div>`;
  }
  return h + `</div><div class="hint">Hover a skill for details • Click Q/E/R/F to bind active skills • Respec at Sage Elowen in Haven</div>`;
};

// ---------- map / quests / feats / pause ----------
MENUS.map = () => tabs('map') + `<h2>${G.inTown ? 'Haven' : curReg().n} <span class="dim">${G.inTown ? '' : G.abyss ? 'Depth ' + G.depth : 'Floor ' + (G.floor + 1) + ' / ' + FLOORS}</span></h2><canvas id="mapc" width="760" height="540" style="border-radius:8px;cursor:default;display:block"></canvas><div class="hint">🟠 Stairs (red = sealed) • 🟡 Chest • 🔵 Portal • ✦ Shrine • White arrow = you</div>`;
function drawBigMap(c) {
  const cx = c.getContext('2d'), W = c.width, Hh = c.height; cx.fillStyle = '#0a0910'; cx.fillRect(0, 0, W, Hh);
  const s = Math.min(W / M.w, Hh / M.h), ox = (W - M.w * s) / 2, oy = (Hh - M.h * s) / 2;
  cx.fillStyle = G.inTown ? '#8a7a60' : '#5a5a6e';
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { const i = y * M.w + x; if (M.seen[i] && M.t[i]) cx.fillRect(ox + x * s, oy + y * s, Math.ceil(s), Math.ceil(s)); }
  const mk = (wx, wy, col, r, force) => { const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE); if (!force && !M.seen[ty * M.w + tx]) return; cx.fillStyle = col; cx.beginPath(); cx.arc(ox + wx / TILE * s, oy + wy / TILE * s, r, 0, 6.283); cx.fill(); };
  if (G.stairs) mk(G.stairs.x, G.stairs.y, G.stairsOpen ? '#ffb04a' : '#ff4a3a', 7);
  if (G.exit) mk(G.exit.x, G.exit.y, '#7ab8ff', 7, 1);
  for (const ch of G.chests) if (!ch.open) mk(ch.x, ch.y, '#ffd54a', 4);
  for (const sh of G.shrines) if (!sh.used) mk(sh.x, sh.y, sh.s.col, 5);
  for (const n of G.npcs) mk(n.x, n.y, n.col, 6, 1);
  cx.save(); cx.translate(ox + P.x / TILE * s, oy + P.y / TILE * s); cx.rotate(P.face); cx.fillStyle = '#fff'; cx.beginPath(); cx.moveTo(9, 0); cx.lineTo(-6, -6); cx.lineTo(-3, 0); cx.lineTo(-6, 6); cx.closePath(); cx.fill(); cx.restore();
}
MENUS.quests = () => {
  let h = tabs('quests') + `<h2>📜 Bounties <span class="btn" style="font-size:12px" onclick="talkNPC('quests')">💬 Read the notices</span></h2><div class="dim">Complete bounties anywhere and claim rewards from any screen. New bounties replace claimed ones.</div>`;
  S.quests.forEach((q, i) => {
    const done = q.have >= q.need;
    h += `<div class="card ${done ? 'done' : ''}"><b>${q.txt}</b> <span class="dim">${fmt(q.have)} / ${fmt(q.need)}</span><div class="qbar"><div style="width:${q.have / q.need * 100}%"></div></div>
    <span class="dim">Reward: <span class="gold">${fmt(q.rw.gold)}g</span> • <span class="ore">${q.rw.ore} ore</span> • <span class="shard">${q.rw.shards} shards</span>${q.rw.item ? ' • <span style="color:#4fa3ff">Rare+ item</span>' : ''}</span><br>
    ${done ? `<span class="btn" onclick="claimQuest(${i})">Claim Reward</span>` : `<span class="btn" onclick="rerollQuest(${i})">Abandon (${fmt(rerollCost())}g)</span>`}</div>`;
  });
  return h;
};
function rerollCost() { return Math.round(15 * Math.pow(1.1, maxPw())); }
function claimQuest(i) {
  const q = S.quests[i]; if (!q || q.have < q.need) return;
  if (q.rw.item && S.inv.length >= S.invMax) { toast('Make room in your inventory first!', '#ff8a8a'); return; }
  S.gold += q.rw.gold; S.ore += q.rw.ore; S.shards += q.rw.shards;
  if (q.rw.item) { const it = genItem(maxPw() + 1, { minR: 2, bonus: .4 }); it.isNew = true; S.inv.push(it); noteFound(it); toast(`Received: <span style="color:${RAR[it.r].c}">${it.name}</span>`); }
  S.quests.splice(i, 1, genQuest()); sfx('legend'); saveGame(); renderMenu();
}
function rerollQuest(i) { const c = rerollCost(); if (S.gold < c) { toast('Not enough gold'); sfx('error'); return; } S.gold -= c; S.quests.splice(i, 1, genQuest()); sfx('click'); renderMenu(); }
MENUS.achieve = () => {
  const done = ACH.filter(a => S.ach[a.id]).length;
  return tabs('achieve') + `<h2>🏆 Feats <span class="dim">${done} / ${ACH.length}</span></h2><div class="dim">Each feat grants gold and shards — some grant bonus skill points.</div><div class="achg">` +
    ACH.map(a => { const v = Math.min(a.need, a.c()), d = S.ach[a.id]; return `<div class="card ach ${d ? 'done' : 'lk'}"><div class="ai">${d ? '🏆' : '🔒'}</div><div style="flex:1"><b>${a.n}</b>${a.sp ? ` <span class="pts" style="font-size:11px">+${a.sp} SP</span>` : ''}<div class="dim">${a.d}</div><div class="qbar"><div style="width:${v / a.need * 100}%"></div></div><div class="dim">${fmt(v)} / ${fmt(a.need)}</div></div></div>`; }).join('') + '</div>';
};
const HUB = [
  ['inv', '🎒', 'Inventory', 'Gear, stats & auto-equip', 'I'], ['skills', '✨', 'Skills', 'Learn & bind abilities', 'K'], ['paragon', '✦', 'Constellation', 'Endless star bonuses', 'P'], ['wardrobe', '👑', 'Wardrobe', 'Titles, colors & pets', 'G'],
  ['quests', '📜', 'Bounties', 'Tasks & rewards', 'J'], ['season', '🏅', 'Season', 'Monthly journey', 'Y'], ['achieve', '🏆', 'Feats', 'Achievements', 'O'], ['map', '🗺️', 'Map', 'Explored floor', 'M'],
  ['journal', '📖', 'Journal', 'Story & lore pages', 'L'], ['bestiary', '🐺', 'Bestiary', 'Monsters & mastery', 'B'], ['arsenal', '⚔️', 'Arsenal', 'Weapons & artifacts', 'N'], ['wiki', '❓', 'Wiki', 'Everything explained', 'H'],
];
MENUS.pause = () => {
  const badge = k => k === 'skills' && S.sp ? S.sp : k === 'paragon' && S.para.pts ? S.para.pts : k === 'quests' ? (S.quests.filter(q => q.have >= q.need).length || '') : k === 'season' ? ($('mb-sj') ? $('mb-sj').textContent : '') : '';
  return `<div style="min-width:760px"><h2 style="text-align:center">☰ Menu <span class="dim" style="font-size:13px">Playtime ${fmtTime(S.stats.time)} • ${fmt(S.stats.kills)} kills</span></h2>
  <div class="hub">${HUB.map(h => `<div class="hubt" onclick="openMenu('${h[0]}')"><div class="hi">${h[1]}</div><b>${h[2]}</b><div class="dim">${h[3]}</div><span class="hk">${h[4]}</span>${badge(h[0]) ? `<i>${badge(h[0])}</i>` : ''}</div>`).join('')}</div>
  <div style="text-align:center;margin-top:10px"><span class="btn" onclick="closeMenu()">▶ Resume</span><span class="btn" onclick="openMenu('settings')">⚙ Settings</span><span class="btn" onclick="closeMenu();startTutorial()">🎓 Replay Tutorial</span><span class="btn" onclick="saveGame();toast('Game saved')">💾 Save</span><span class="btn" onclick="quitToTitle()">⏏ Save & Quit</span></div></div>`;
};
MENUS.settings = () => {
  const o = S ? S.opts : { vol: .5, quality: 'high', shake: true, nums: true };
  return `<div class="title" style="min-width:460px"><h2>Settings</h2>
  <div class="card">Volume <input type="range" min="0" max="1" step="0.05" value="${o.vol}" oninput="setVol(+this.value)"></div>
  <div class="card">Graphics ${['low', 'medium', 'high'].map(q => `<span class="btn ${o.quality === q ? 'on' : ''}" onclick="setOpt('quality','${q}')">${q[0].toUpperCase() + q.slice(1)}</span>`).join('')}<div class="dim">Low disables shadows & glow for older computers</div></div>
  <div class="card">Screen shake <span class="btn ${o.shake ? 'on' : ''}" onclick="setOpt('shake',${!o.shake})">${o.shake ? 'On' : 'Off'}</span></div>
  <div class="card">Damage numbers ${['All', 'Big hits only', 'Off'].map((n, i) => `<span class="btn ${(o.numMode | 0) === i ? 'on' : ''}" onclick="setOpt('numMode',${i})">${n}</span>`).join('')}</div>
  <div class="card">🌿 Relaxed mode <span class="btn ${o.relaxed ? 'on' : ''}" onclick="setOpt('relaxed',${!o.relaxed})">${o.relaxed ? 'On' : 'Off'}</span><div class="dim">Take 35% less damage and lose no gold when you fall. Great for a calmer adventure — switch any time.</div></div>
  <div class="card">Auto-equip upgrades on pickup <span class="btn ${o.autoEq ? 'on' : ''}" onclick="setOpt('autoEq',${!o.autoEq})">${o.autoEq ? 'On' : 'Off'}</span><div class="dim">Wears found gear automatically when it raises your overall power (keeps your weapon style)</div></div>
  <div class="card">Auto-salvage on pickup ${['Off', 'Common', 'Uncommon & below'].map((n, i) => `<span class="btn ${(o.autoSalv | 0) === i ? 'on' : ''}" onclick="setOpt('autoSalv',${i})">${n}</span>`).join('')}<div class="dim">Never salvages items with unique powers</div></div>
  <div class="card">Show loot labels ${['All', 'Uncommon+', 'Rare+'].map((n, i) => `<span class="btn ${(o.labels | 0) === i ? 'on' : ''}" onclick="setOpt('labels',${i})">${n}</span>`).join('')}</div>
  <div class="card">Tutorial hints <span class="btn ${o.hints ? 'on' : ''}" onclick="setOpt('hints',${!o.hints})">${o.hints ? 'On' : 'Off'}</span></div>
  <div class="btn bigb" onclick="backMenu()">Back</div></div>`;
};
function setOpt(k, v) { if (!S) return; S.opts[k] = v; if (k === 'quality') resize3D(); if (!S._temp) saveGame(); renderMenu(); }
function fmtTime(s) { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return `${h}h ${m}m`; }
function quitToTitle() { saveGame(); G.mode = 'title'; titleScene(); openMenu('title'); }
MENUS.help = () => `<h2>How to Play</h2><div class="invwrap"><table class="keys">
  <tr><td>WASD</td><td>Move</td></tr><tr><td>Mouse</td><td>Aim (wheel = zoom)</td></tr><tr><td>Left Click (hold)</td><td>Attack with your weapon</td></tr>
  <tr><td>Space / Shift / R-Click</td><td>Dodge roll (invulnerable)</td></tr><tr><td>Q E R F</td><td>Use skills</td></tr><tr><td>V / Middle Click</td><td>Unleash Ember Surge</td></tr><tr><td>1</td><td>Drink health potion</td></tr>
  <tr><td>Tab / X</td><td>Swap main & off-hand weapon</td></tr><tr><td>T</td><td>Town portal (channel 1.5s)</td></tr>
  <tr><td>I / C</td><td>Inventory</td></tr><tr><td>K</td><td>Skill tree</td></tr><tr><td>J</td><td>Bounties</td></tr><tr><td>O</td><td>Feats</td></tr><tr><td>M</td><td>Map</td></tr><tr><td>Esc</td><td>Pause / close</td></tr></table>
  <div class="lore" style="max-width:460px;font-size:14px">
  <b>Goal:</b> Recover 12 Ember Shards from the guardians of 12 regions. Each region has 6 floors and a guardian on floor 7.<br>
  <b>Stairs</b> unseal after slaying 70% of a floor's foes.<br>
  <b>Combo:</b> chain hits to build a combo for up to +40% damage. Getting hit halves it.<br>
  <b>Ember Surge:</b> fighting fills the 🔥 gauge. Press V to detonate it and empower yourself.<br>
  <b>Perfect Dodge:</b> roll through an attack at the last moment to slow time and make your next hit a crit.<br>
  <b>Hazards:</b> barrels explode (hit them near foes!), crates hold gold, spike traps glow red before striking. Chase down <span class="gold">Gilded Imps</span> before they escape!<br>
  <b>Floor modifiers</b> like Blood Moon or Gilded Halls change the rules for a floor.<br>
  <b>Loot:</b> <span style="color:#c8c8c8">Common</span> → <span style="color:#5fd35f">Uncommon</span> → <span style="color:#4fa3ff">Rare</span> → <span style="color:#c46bff">Epic</span> → <span style="color:#ff9a2e">Legendary</span> (unique powers) → <span style="color:#ff3e5e">Mythic</span> (Nightmare+ / Abyss).<br>
  <b>Endgame:</b> beat the final guardian to unlock Veteran → Nightmare → Inferno and the endless Abyss.</div></div>
  <span class="btn" onclick="backMenu()">Back</span>`;

// ---------- town menus ----------
function buyCost(it) { return itemVal(it) * 5; }
const SERV = {
  belt: { n: '🧪 Potion Belt', d: () => `Max potions ${S.potMax} → ${S.potMax + 1}`, cost: () => Math.round(150 * Math.pow(2.6, S.potMax - 3)), ok: () => S.potMax < 8, buy: () => { S.potMax++; S.pots = S.potMax; } },
  potency: { n: '❤️ Potion Potency', d: () => `Potions heal ${40 + 5 * S.potLvl}% → ${45 + 5 * S.potLvl}%`, cost: () => Math.round(120 * Math.pow(2.2, S.potLvl)), ok: () => S.potLvl < 10, buy: () => S.potLvl++ },
  satchel: { n: '🎒 Bigger Satchel', d: () => `Inventory ${S.invMax} → ${S.invMax + 5} slots`, cost: () => Math.round(300 * Math.pow(2.3, (S.invMax - 30) / 5)), ok: () => S.invMax < 60, buy: () => S.invMax += 5 },
  gamble: { n: '🎲 Mystery Cache', d: () => 'A random item with boosted rarity', cost: () => Math.round(60 * Math.pow(1.12, maxPw())), ok: () => S.inv.length < S.invMax, buy: () => { const it = genItem(maxPw(), { bonus: .8 }); it.isNew = true; S.inv.push(it); noteFound(it); toast(`You got: <span style="color:${RAR[it.r].c}">${it.name}</span>`); if (it.r >= 4) { sfx('legend'); S.stats.legend++; } } },
};
function buyServ(k) { const s = SERV[k]; const c = s.cost(); if (!s.ok()) { toast('Not available'); return; } if (S.gold < c) { toast('Not enough gold', '#ff8a8a'); sfx('error'); return; } S.gold -= c; s.buy(); sfx('gold'); afterGear(); renderMenu(); }
MENUS.shop = () => {
  let h = `<h2>💰 Merchant Orla <span class="gold" style="font-size:16px">● ${fmt(S.gold)}</span></h2><div class="dim">"Fresh steel from the deep. Stock changes every time you return from an expedition."</div><h3>Wares</h3><div class="row">`;
  for (const it of S.shop) h += `<div class="ware">${cell(it, 'buyItem')}<div class="${S.gold >= buyCost(it) ? 'gold' : 'dim'}">${fmt(buyCost(it))}g</div></div>`;
  if (!S.shop.length) h += '<div class="dim">Sold out!</div>';
  h += `</div><h3>Services</h3>`;
  for (const k in SERV) { const s = SERV[k]; h += `<div class="smrow"><div class="nm">${s.n} <span class="dim">${s.ok() ? s.d() : 'MAXED / unavailable'}</span></div>${s.ok() ? `<span class="btn ${S.gold < s.cost() ? 'dis' : ''}" onclick="buyServ('${k}')">${fmt(s.cost())}g</span>` : ''}</div>`; }
  h += `<h3>Sell <span class="dim">(click an item to sell it)</span></h3><div class="grid">${S.inv.map(it => cell(it, 'sellItem')).join('') || '<div class="dim">Your bag is empty</div>'}</div>
  <span class="btn" onclick="sellJunk()">Sell all Common & Uncommon</span><span class="btn" onclick="talkNPC('shop')">💬 Talk</span><span class="btn" onclick="closeMenu()">Leave</span>`;
  return h;
};
function buyItem(id) { const i = S.shop.findIndex(x => x.id === id); if (i < 0) return; const it = S.shop[i], c = buyCost(it); if (S.gold < c) { toast('Not enough gold', '#ff8a8a'); sfx('error'); return; } if (S.inv.length >= S.invMax) { toast('Inventory full'); return; } S.gold -= c; S.shop.splice(i, 1); S.inv.push(it); noteFound(it); sfx('gold'); hideTip(); renderMenu(); }
function sellItem(id, ev) { const i = S.inv.findIndex(x => x.id === id); if (i < 0) return; if (S.inv[i].locked) { toast('That item is locked'); return; } S.gold += Math.round(itemVal(S.inv[i]) * sellMul()); S.inv.splice(i, 1); sfx('gold'); hideTip(); renderMenu(); }
function sellJunk() { let g = 0; S.inv = S.inv.filter(it => { if (it.r <= 1 && !it.locked) { g += Math.round(itemVal(it) * sellMul()); return false; } return true; }); toast(g ? `Sold for ${fmt(g)} gold` : 'Nothing to sell'); if (g) sfx('gold'); renderMenu(); }
function upCost(it) { return { g: Math.round(30 * Math.pow(1.12, it.il) * (it.plus + 1) * (1 + it.r * .3)), o: it.plus + 1 }; }
function refCost(it) { return 4 * (it.r + 1); }
MENUS.smith = () => {
  let h = `<h2>⚒️ Blacksmith Brann</h2><div><span class="gold">● ${fmt(S.gold)}</span> &nbsp; <span class="ore">◆ ${S.ore} Ember Ore</span> &nbsp; <span class="shard">✦ ${S.shards} Shards</span></div>
  <div class="dim">"Upgrades add +10% base power and +5% affix power per level (max +10). Reforging rerolls an item's affixes. Ore drops from elites, chests and guardians."</div>`;
  const list = [...SLOTS.map(s => S.eq[s]).filter(Boolean), ...S.inv];
  for (const it of list) {
    const u = upCost(it), r = refCost(it), es = eqSlotOf(it);
    h += `<div class="smrow">${cell(it, 'noop')}<div class="nm"><span style="color:${RAR[it.r].c}">${it.name}</span>${it.plus ? ` <b style="color:#ffe9a0">+${it.plus}</b>` : ''} <span class="dim">${es ? '(equipped)' : ''} iLvl ${it.il}</span></div>
    ${it.plus < 10 ? `<span class="btn ${S.gold < u.g || S.ore < u.o ? 'dis' : ''}" onclick="upgrade(${it.id})">Upgrade: ${fmt(u.g)}g + ${u.o}◆</span>` : '<span class="dim">MAX</span>'}
    ${it.r >= 1 ? `<span class="btn ${S.shards < r ? 'dis' : ''}" onclick="reforge(${it.id})">Reforge: ${r}✦</span>` : '<span class="btn" style="visibility:hidden">Reforge: 00✦</span>'}</div>`;
  }
  h += `<h3 style="color:#7ffcff">✦ Celestial Forge <span class="dim">✧ ${S.frag} / ${FORGE_COST} fragments</span></h3>`;
  if (!S.done[0][7]) h += `<div class="dim">"Vulkar's forge-secrets were lost with him. Free the Smith-Warden of the Molten Forge and I can learn them." Celestial Fragments drop from guardians (more on harder difficulties and deep in the Abyss) and, rarely, from elites.</div>`;
  else { h += `<div class="dim">Choose an artifact to forge. Each costs ${FORGE_COST} Celestial Fragments. Artifacts carry two unique powers, a signature effect, six affixes and far greater base power.</div><div class="row" style="margin-top:6px">`;
    for (const k in ARTI) { const A = ARTI[k]; h += `<div class="card" style="width:240px;padding:6px 9px"><b style="color:#7ffcff">${WT[A.t].ic} ${A.n}</b> <span class="dim">${WT[A.t].n}</span><div class="dim" style="font-size:12px">${A.d}</div><span class="btn ${S.frag < FORGE_COST ? 'dis' : ''}" onclick="forgeArt('${k}')">Forge</span></div>`; }
    h += '</div>'; }
  return h + `<br><span class="btn" onclick="talkNPC('smith')">💬 Talk</span><span class="btn" onclick="closeMenu()">Leave</span>`;
};
function forgeArt(k) { if (S.frag < FORGE_COST) return; if (S.inv.length >= S.invMax) { toast('Make room in your inventory first'); return; } S.frag -= FORGE_COST; const it = genArtifact(k, maxPw() + 3); it.isNew = true; S.inv.push(it); S.stats.celestial++; noteFound(it); sfx('legend'); banner('✦ CELESTIAL ARTIFACT FORGED ✦', it.name, RAR[6].c); toast(`Brann hands you <span style="color:#7ffcff">${it.name}</span>`); saveGame(); renderMenu(); }
function noop() { }
function upgrade(id) { const it = findItem(id); if (!it || it.plus >= 10) return; const c = upCost(it); if (S.gold < c.g || S.ore < c.o) { sfx('error'); return; } S.gold -= c.g; S.ore -= c.o; it.plus++; S.stats.upgrades = (S.stats.upgrades || 0) + 1; S.stats.maxPlus = Math.max(S.stats.maxPlus, it.plus); sfx('lvl'); toast(`${it.name} is now +${it.plus}!`); afterGear(); renderMenu(); }
function reforge(id) { const it = findItem(id); if (!it) return; const c = refCost(it); if (S.shards < c) { sfx('error'); return; } S.shards -= c; rollAffixes(it); sfx('magic'); afterGear(); renderMenu(); hideTip(); toast('Affixes rerolled!'); }
function respecCost() { return S.lvl < 10 ? 0 : Math.round(25 * Math.pow(S.lvl, 1.6)); }
function respec() { const c = respecCost(); if (S.gold < c) { toast('Not enough gold'); sfx('error'); return; } S.gold -= c; let n = 0; for (const k in S.sk) n += S.sk[k]; S.sk = {}; S.bind = [null, null, null, null]; S.sp += n; afterGear(); sfx('magic'); toast(`Refunded ${n} skill points`); renderMenu(); }
const LORE = [
  `Eight... no, <b>twelve</b> guardians, once the Ember's protectors, were corrupted and each now holds a shard. Begin in the <b>Whispering Woods</b> — Thornmaw waits at its heart.`,
  `One shard returns! Next, the <b>Sunken Crypt</b>. The Hollow Bishop raises the dead — strike the Gravecallers first.`,
  `The <b>Ashen Dunes</b> burn beneath Sandtyrant Kesh. Watch for his charges — dodge sideways, not back.`,
  `The <b>Bloodmoon Marsh</b> reeks of Mother Morrow's hexes. Her leeches swarm — keep moving and use area attacks.`,
  `Rimeheart chills the <b>Frostpeak Hollows</b>. Frost Totems spin deadly spirals — break line of sight.`,
  `In the <b>Fungal Depths</b>, Mother Spore births explosive young. Keep your distance!`,
  `The <b>Coral Grotto</b> shelters the Abyssal Leviathan. Shock Eels strike fast — watch for their red warnings.`,
  `The <b>Molten Forge</b>: Vulkar's slams and falling slag will test your footwork.`,
  `The <b>Clockwork Halls</b> tick to the Brass Colossus' will. Boombots explode — smash them early.`,
  `High in the <b>Sky Ruins</b>, the Tempest Seraph blinks and storms. Watch the beams.`,
  `The <b>Crystal Spire</b> refracts Lumen's light into killing beams. Mirror Wraiths teleport around you.`,
  `The last shard lies in <b>The Hollow Void</b> with the Unmaker. Everything you've learned will be needed.`];
MENUS.sage = () => {
  const shards = S.done[0].filter(Boolean).length, next = S.done[S.diff].indexOf(false);
  const lore = next < 0 ? `"You have conquered every guardian on ${DIFF[S.diff]}. The Abyss beckons — and harder trials await at the Waystone."` : `"${LORE[next]}"`;
  return `<h2>📘 Sage Elowen</h2><p class="lore">${lore}</p>
  <div class="card">Ember Shards recovered (Normal): <b class="gold">${shards} / ${NREG}</b> • Difficulty unlocked: <b style="color:${DIFFC[S.maxDiff]}">${DIFF[S.maxDiff]}</b> • Abyss best: ${S.abyssBest.map((d, i) => `<span style="color:${DIFFC[i]}">${d}</span>`).join(' / ')}<br>
  <span class="dim">Playtime ${fmtTime(S.stats.time)} • ${fmt(S.stats.kills)} kills • ${fmt(S.stats.elites)} elites • ${S.stats.bosses} guardians • ${S.stats.legend} legendaries • best combo ${S.stats.maxCombo} • ${S.stats.deaths} deaths</span></div>
  <div class="btn" onclick="respec()">Reset all skill points (${respecCost() ? fmt(respecCost()) + 'g' : 'free below Lv 10'})</div>
  ${S.boonPend ? `<div class="btn" style="border-color:#ffe9a0;color:#ffe9a0" onclick="closeMenu();offerBoon()">✨ Receive Warden's Boon (${S.boonPend})</div>` : ''}
  <div class="btn" onclick="talkNPC('sage')">💬 Talk</div><div class="btn" onclick="openMenu('achieve')">🏆 Feats</div><div class="btn" onclick="openMenu('wiki')">❓ Wiki</div><div class="btn" onclick="closeMenu()">Leave</div>`;
};
MENUS.portal = () => {
  const d = S.diff;
  let h = `<h2>🌀 The Waystone</h2><div>Difficulty: ${DIFF.map((n, i) => i <= S.maxDiff ? `<span class="btn ${i === d ? 'on' : ''}" style="color:${DIFFC[i]}" onclick="S.diff=${i};renderMenu()">${n}</span>` : `<span class="btn dis">🔒 ${n}</span>`).join('')}</div>
  <div class="dim">Higher difficulties: much stronger foes, better loot, levels required +25 per tier. Mythic items drop on Nightmare+.</div>
  ${S.last && S.last.diff === d ? `<div class="btn" style="border-color:#7aff7a" onclick="travel(${S.last.r},${S.last.f},${S.last.d || 0})">▶ Resume: ${S.last.r === ABYSS_R ? 'The Abyss, depth ' + S.last.d : REG[S.last.r].n + ' — floor ' + (S.last.f + 1)}</div>` : ''}<div class="regcards">`;
  for (let r = 0; r < NREG; r++) {
    const R = REG[r], unl = r === 0 || S.done[d][r - 1], lv = reqLvl(r, d), lvOk = S.lvl >= lv, pr = S.prog[d][r], done = S.done[d][r];
    h += `<div class="card ${unl && lvOk ? '' : 'lock'} ${done ? 'done' : ''}"><b style="font-family:Georgia;font-size:16px;color:${R.torch}">${r + 1}. ${R.n}</b> ${done ? '<span class="gold">✦</span>' : ''} <span class="dim">Lv ${lv}+ • ${BOSS[R.boss].n}</span><br>`;
    if (!unl) h += `<span class="dim">🔒 Defeat the previous region's guardian</span>`;
    else if (!lvOk) h += `<span style="color:#ff8a6a">🔒 Reach level ${lv} (you are ${S.lvl}) — replay floors & do bounties!</span>`;
    else for (let f = 0; f <= (done ? BOSS_F : pr); f++) h += `<span class="btn" style="padding:4px 9px" onclick="travel(${r},${f})">${f === BOSS_F ? '👑' : f + 1}</span>`;
    h += `</div>`;
  }
  h += '</div>';
  if (S.done[d][NREG - 1]) {
    const best = S.abyssBest[d]; const cps = [1]; for (let c = 6; c <= best; c += 5) cps.push(c);
    h += `<div class="card" style="border-color:#ff5a8a"><b style="font-family:Georgia;font-size:16px;color:#ff7aa0">The Abyss</b> <span class="dim">Endless descent. Every 5th depth holds a guardian. Best: ${best}</span><br>${cps.map(c => `<span class="btn" onclick="travel(${ABYSS_R},0,${c})">Depth ${c}</span>`).join('')}</div>`;
  } else h += `<div class="card lock"><b>The Abyss</b> <span class="dim">🔒 Defeat The Unmaker on this difficulty</span></div>`;
  return h + `<span class="btn" onclick="closeMenu()">Leave</span>`;
};
function travel(r, f, depth) { closeMenu(); sfx('stairs'); enterFloor(r, f, depth); }
MENUS.dead = () => `<div class="title"><h1 style="color:#ff5a5a;font-size:52px;text-shadow:0 0 30px #a00">You Have Fallen</h1><p class="lore">The ember gutters, but does not die.<br>You lost <span class="gold">${fmt(G.lostGold)} gold</span>. Your progress and gear are safe.</p><div class="btn bigb" onclick="revive()">Return to Haven</div></div>`;
function revive() { closeMenu(); goTown(); }
MENUS.victory = () => `<div class="title"><h1 class="big" style="font-size:48px">The Ember Rekindles</h1><p class="lore">The Unmaker shatters, and the twelfth shard blazes in your hand. Haven glows warm again...<br><br>But deep below, something older stirs. <b>The Abyss</b> has opened, and a harder trial — <b style="color:${DIFFC[Math.min(3, S.diff + 1)]}">${DIFF[Math.min(3, S.diff + 1)]}</b> — awaits at the Waystone. Your journey is far from over.</p><div class="btn bigb" onclick="closeMenu()">Continue</div></div>`;

// ---------- title ----------
MENUS.title = () => {
  const s = loadGame();
  return `<div class="title"><h1 class="big">EMBERVALE</h1><div class="sub">~ The Fading Flame ~</div>
  ${s ? `<div class="btn bigb" onclick="continueGame()">Continue<br><span class="dim">Lv ${s.lvl} ${CLS[s.cls] ? CLS[s.cls].n : ''} • ${fmtTime((s.stats && s.stats.time) || 0)}</span></div>` : ''}
  <div class="btn bigb" onclick="${s ? "openMenu('confirm')" : "openMenu('class')"}">New Game</div>
  <div class="btn bigb" onclick="G.prevMenu='title';openMenu('wiki')">❓ Wiki & How to Play</div>
  <div class="btn bigb" onclick="openSettingsFromTitle()">Settings</div>
  <div class="dim" style="margin-top:18px;text-shadow:0 1px 3px #000">A single-player 3D action adventure • 12 regions • endless Abyss • Progress saves automatically</div></div>`;
};
function openSettingsFromTitle() { if (!S) { const s = loadGame(); S = s ? fixSave(s) : newSave('warrior'); S._temp = !s; } G.prevMenu = 'title'; openMenu('settings'); }
MENUS.confirm = () => `<div class="title"><h2>Start a new game?</h2><p class="lore">This will <b style="color:#ff6a5a">erase</b> your current save.</p><div class="btn" onclick="openMenu('class')">Yes, start over</div><div class="btn" onclick="openMenu('title')">Cancel</div></div>`;
MENUS.class = () => `<div class="title"><h2 style="font-size:34px">Choose Your Path</h2><div class="dim" style="text-shadow:0 1px 3px #000">Your class sets your look, starting weapons and skill. Any class can use any weapon and learn any skill.</div><br><div class="cls">
  ${Object.keys(CLS).map(k => `<div class="card" style="background:rgba(14,12,22,.85)" onclick="newGame('${k}')"><div style="font-size:52px">${CLS[k].ic}</div><h3 style="color:${CLS[k].col}">${CLS[k].n}</h3><div class="dim">${CLS[k].d}</div></div>`).join('')}</div>
  <div class="card" style="display:inline-block;margin-top:12px;background:rgba(14,12,22,.85)">🌿 Relaxed mode <span class="btn ${G.relaxNew ? 'on' : ''}" onclick="G.relaxNew=!G.relaxNew;renderMenu()">${G.relaxNew ? 'On' : 'Off'}</span><div class="dim">35% less damage taken, no gold lost on death. Change any time in Settings.</div></div>
  <br><span class="btn" onclick="openMenu('slots')">Back</span></div>`;
MENUS.intro = () => `<div class="title"><h2>The Fading Flame</h2><p class="lore">For a thousand years the Ember burned in the heart of Embervale, and its twelve Wardens kept the dark at bay.<br><br>Then the Wardens turned. The Ember shattered into twelve shards, each now clutched by a corrupted guardian deep within the wilds.<br><br>Only Haven, the last village, still glows. You are its final hope.<br><br><b>Recover the twelve shards. Rekindle the Ember.</b></p>
  <table class="keys" style="margin:auto"><tr><td>WASD</td><td>Move</td></tr><tr><td>Left Click</td><td>Attack</td></tr><tr><td>Space</td><td>Dodge (perfect dodges slow time!)</td></tr><tr><td>Q E R F</td><td>Skills</td></tr><tr><td>V</td><td>Ember Surge (when the 🔥 gauge is full)</td></tr><tr><td>1</td><td>Potion</td></tr><tr><td>I / K</td><td>Inventory / Skills</td></tr></table>
  <div class="dim">Walk up to the <b>Waystone 🌀</b> (north of the fountain) to begin your journey.</div><div class="btn bigb" onclick="closeMenu()">Begin</div></div>`;
function newGame(cls) {
  initAudio(); IID = 1; const opts = S && S.opts ? S.opts : null; S = newSave(cls); if (opts) S.opts = opts;
  const c = CLS[cls];
  const w = genItem(0, { slot: 'weapon', t: c.w, r: 0 }); w.name = 'Trusty ' + WT[c.w].n; S.eq.weapon = w;
  const w2 = genItem(0, { slot: 'weapon', t: c.w2, r: 0 }); w2.name = 'Old ' + WT[c.w2].n; S.eq.weapon2 = w2;
  S.sk[c.sk] = 1; S.bind[0] = c.sk;
  calcStats(); newPlayer(); goTown(); saveGame(); resize3D(); S.story.intro = 1; startDialog(STORY_INTRO, () => startTutorial());
}
function continueGame() {
  initAudio(); const s = loadGame(); if (!s) return; S = fixSave(s); if (master) master.gain.value = S.opts.vol;
  calcStats(); newPlayer(); goTown(); closeMenu(); saveGame(); resize3D();
}
function titleScene() {
  resetLevel(); G.inTown = false; G.abyss = false; G.region = ri(0, NREG - 1); G.floor = 2; M = genDungeon(2);
  for (const r of M.rooms.slice(1, 5)) for (let i = 0; i < 2; i++) G.chests.length < 2 && Math.random() < .3 && G.chests.push({ x: (r.cx + .5) * TILE, y: (r.cy + .5) * TILE, open: false });
  if (typeof buildLevel === 'function' && R3) buildLevel();
}

// ---------- dialog (story) ----------
let DLG = null;
function startDialog(lines, onEnd) { DLG = { lines, i: 0, c: 0, onEnd }; mouse.down = false; openMenu('dialog'); }
function dlgSpeaker(k) { if (k === 'boss') return { n: G.boss ? G.boss.d.n : 'Guardian', ic: '💀', col: '#ff6a5a' }; if (k === 'warden') return { ...SPK.warden, n: RSTORY[G.region] ? RSTORY[G.region].w : SPK.warden.n }; return SPK[k] || SPK.elowen; }
MENUS.dialog = () => {
  if (!DLG) return ''; const [k, txt] = DLG.lines[DLG.i], sp = dlgSpeaker(k);
  return `<div class="dlgbox" onclick="dlgNext()"><div class="dport" style="border-color:${sp.col};box-shadow:0 0 20px ${sp.col}66">${sp.ic}</div><div class="dbody"><div class="dname" style="color:${sp.col}">${sp.n}</div><div class="dtext" id="dtext"></div><div class="dhint">${DLG.i + 1}/${DLG.lines.length} — Click / Space to continue • Esc to skip</div></div></div>`;
};
function dlgTick(dt) {
  if (G.menu !== 'dialog' || !DLG) return; const txt = DLG.lines[DLG.i][1];
  if (DLG.c < txt.length) { DLG.c = Math.min(txt.length, DLG.c + dt * 70); const el = $('dtext'); if (el) el.textContent = txt.slice(0, Math.floor(DLG.c)); if (Math.floor(DLG.c) % 3 === 0) sfx('click'); }
}
function dlgNext() {
  if (!DLG) return; const txt = DLG.lines[DLG.i][1];
  if (DLG.c < txt.length) { DLG.c = txt.length; const el = $('dtext'); if (el) el.textContent = txt; return; }
  DLG.i++; DLG.c = 0; if (DLG.i >= DLG.lines.length) return dlgEnd(); renderMenu();
}
function dlgSkip() { if (DLG) DLG.i = DLG.lines.length; dlgEnd(); }
function dlgEnd() { const f = DLG && DLG.onEnd; DLG = null; closeMenu(); if (f) f(); }
// ---------- journal ----------
MENUS.journal = () => {
  let h = tabs('journal') + `<h2>📖 Journal</h2><div class="dim">The story so far, and the Lost Pages you have found (${S.pages.length}/${PAGES.length}).</div><div class="invwrap"><div style="flex:1;min-width:420px;max-width:560px">`;
  h += `<h3>The Fading Flame</h3>`;
  if (S.story.intro) h += `<div class="card"><b>Prologue</b><div class="dim">${STORY_INTRO.map(l => l[1]).join(' ')}</div></div>`;
  RSTORY.forEach((r, i) => {
    if (!S.story['post' + i] && !S.story['arrive' + i]) return;
    h += `<div class="card ${S.story['post' + i] ? 'done' : ''}"><b style="color:${REG[i].torch}">Chapter ${i + 1}: ${REG[i].n}</b> <span class="dim">— ${r.w}</span><div class="dim">${r.arrive.map(l => l[1]).join(' ')}</div>${S.story['post' + i] ? `<div style="font-size:13px;margin-top:4px">${r.post.map(l => `<b style="color:${dlgSpeakerJ(l[0], i).col}">${dlgSpeakerJ(l[0], i).n}:</b> ${l[1]}`).join('<br>')}</div>` : '<div class="dim"><i>The guardian still waits...</i></div>'}</div>`;
  });
  const mems = RMEM.map((m, i) => S.story['mem' + i] ? `<div class="card" style="font-size:13px"><b style="color:#ffe9a0">✨ Memory of ${RSTORY[i].w}</b><div style="font-style:italic">${m.map(l => l[1]).join(' ')}</div></div>` : '').join('');
  if (mems) h += `<h3>Ember Memories</h3>` + mems;
  for (const d in ABYSS_STORY) if (S.story['abyss' + d]) h += `<div class="card"><b style="color:#ff7aa0">The Abyss — Depth ${d}</b><div style="font-size:13px">${ABYSS_STORY[d].map(l => `<b style="color:${SPK[l[0]].col}">${SPK[l[0]].n}:</b> ${l[1]}`).join('<br>')}</div></div>`;
  if (S.story.trueend) h += `<div class="card done"><b style="color:#ffd27a">Epilogue: Flame and Shadow</b><div style="font-size:13px">${TRUE_END.map(l => l[1]).join(' ')}</div></div>`;
  const next = S.done[0].indexOf(false);
  if (next >= 0) h += `<div class="card"><b>Next:</b> <span class="dim">Free ${RSTORY[next].w} in ${REG[next].n}.</span></div>`;
  else if (!S.story.trueend) h += `<div class="card"><b>Next:</b> <span class="dim">Descend into the Abyss, or conquer Inferno, to find Morvane's shadow.</span></div>`;
  h += `<span class="btn" onclick="replayIntro()">Replay prologue</span></div><div style="flex:1;min-width:320px;max-width:420px"><h3>Lost Pages</h3>`;
  PAGES.forEach((p, i) => h += S.pages.includes(i) ? `<div class="card" style="font-size:13px"><b>Page ${i + 1}</b><div style="font-style:italic;color:#e8dcc0">"${p}"</div></div>` : `<div class="card lock" style="font-size:13px">Page ${i + 1} — <span class="dim">not yet found (pages hide on dungeon floors)</span></div>`);
  return h + '</div></div>';
};
function dlgSpeakerJ(k, i) { if (k === 'warden') return { ...SPK.warden, n: RSTORY[i].w }; return SPK[k] || SPK.elowen; }
function replayIntro() { closeMenu(); startDialog(STORY_INTRO); }

// ---------- NPC talk / boons / stash ----------
function talkNPC(kind) { const stage = Math.min(3, Math.floor(S.done[0].filter(Boolean).length / 3)); startDialog(NPC_TALK[kind][stage], () => openMenu(kind)); }
MENUS.boon = () => `<div class="title"><h2 style="color:#ffe9a0">✨ The Warden's Boon</h2><p class="lore">The freed Warden's spirit lingers, offering you a piece of their power. Choose one blessing — it lasts forever.</p><div class="cls">${(G.boonOpts || []).map(k => { const B = BOONS.find(b => b.k === k); return `<div class="card" style="background:rgba(30,26,16,.9);border-color:#a08a40" onclick="takeBoon('${k}')"><div style="font-size:46px">${B.ic}</div><h3 style="color:#ffe9a0">${B.n}</h3><div>${B.d}</div><div class="dim">Owned: ${S.boons.filter(x => x === k).length}</div></div>`; }).join('')}</div><div class="dim" style="margin-top:8px">Boons received so far: ${S.boons.length}</div></div>`;
MENUS.stash = () => {
  let h = `<h2>🧰 Stash <span class="dim">${S.stash.length}/${S.stashMax}</span></h2><div class="dim">Items in the stash are kept safe. Click an item to move it between your bag and the stash.</div><h3>Stash</h3><div class="grid">`;
  for (const it of S.stash) h += cell(it, 'fromStash'); for (let i = S.stash.length; i < S.stashMax; i++) h += '<div class="cell empty"></div>';
  h += `</div><h3>Bag <span class="dim">${S.inv.length}/${S.invMax}</span></h3><div class="grid">`;
  for (const it of S.inv) h += cell(it, 'toStash');
  return h + `</div><br><span class="btn" onclick="closeMenu()">Close</span>`;
};
function toStash(id) { const i = S.inv.findIndex(x => x.id === id); if (i < 0) return; if (S.stash.length >= S.stashMax) { toast('Stash is full'); return; } S.stash.push(S.inv.splice(i, 1)[0]); sfx('click'); hideTip(); renderMenu(); }
function fromStash(id) { const i = S.stash.findIndex(x => x.id === id); if (i < 0) return; if (S.inv.length >= S.invMax) { toast('Bag is full'); return; } S.inv.push(S.stash.splice(i, 1)[0]); sfx('click'); hideTip(); renderMenu(); }
const _findItemOld = findItem; findItem = function (id) { return _findItemOld(id) || S.stash.find(i => i.id === id); };

// ---------- 3D portraits for codex entries ----------
let PR = null; const PORT = {};
function portrait(kind, key) {
  const id = kind + ':' + key; if (PORT[id] !== undefined) return PORT[id];
  try {
    if (!PR) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const r = new T3.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(128, 128, false); r.outputColorSpace = T3.SRGBColorSpace; r.toneMapping = T3.ACESFilmicToneMapping;
      const sc = new T3.Scene(); sc.add(new T3.HemisphereLight('#ffffff', '#404050', 2.4)); const dl = new T3.DirectionalLight('#ffe8d0', 2.6); dl.position.set(3, 5, 4); sc.add(dl);
      PR = { r, sc, cam: new T3.PerspectiveCamera(32, 1, .1, 60), c };
    }
    let obj;
    if (kind === 'e') { const d = EN[key] || { ...BOSS[key] }; obj = makeEnemyModel(d, !!BOSS[key]).g; obj.rotation.y = -Math.PI / 2 + .55; }
    else { obj = makeWeapon(key); obj.rotation.set(.35, .5, .75); }
    const wrap = new T3.Group(); wrap.add(obj); PR.sc.add(wrap); wrap.updateMatrixWorld(true);
    const box = new T3.Box3().setFromObject(wrap), size = box.getSize(new T3.Vector3()), ctr = box.getCenter(new T3.Vector3());
    const m = Math.max(size.x, size.y, size.z) || 1; wrap.position.sub(ctr);
    PR.cam.position.set(0, m * .35, m * 1.85); PR.cam.lookAt(0, 0, 0);
    PR.r.setClearColor(0x000000, 0); PR.r.render(PR.sc, PR.cam); PORT[id] = PR.c.toDataURL();
    PR.sc.remove(wrap);
  } catch (e) { PORT[id] = ''; }
  return PORT[id];
}
function pimg(kind, key, known, extra = '') { const u = portrait(kind, key); return u ? `<img class="pimg ${known ? '' : 'unk'}" src="${u}" ${extra}>` : `<div class="pimg">?</div>`; }

// ---------- bestiary ----------
function enemyRegions(t) { const r = []; REG.forEach((R, i) => { if (R.en.includes(t)) r.push(i); }); return r; }
function stars(v, max) { const n = clamp(Math.round(v), 1, 5); return '★'.repeat(n) + '<span class="dim">' + '★'.repeat(5 - n) + '</span>'; }
function beastCard(t, isBoss) {
  const d = isBoss ? BOSS[t] : EN[t], b = S.best[t], known = !!b, k = b ? b.k : 0;
  const tiers = [25, 100, 500], next = tiers.find(x => k < x), hb = hunterBonus(t);
  const regs = isBoss ? [REG.findIndex(R => R.boss === t)] : enemyRegions(t);
  const where = regs.length ? regs.map(i => REG[i].n).join(', ') : t === 'mimic' ? 'Any chest' : t === 'gimp' ? 'Rare, any floor' : 'Anywhere';
  const ai = isBoss ? 'boss' : d.ai;
  return `<div class="card bc ${known ? '' : 'lock'}">${pimg('e', t, known)}<div style="flex:1"><b style="font-size:15px;color:${known ? (isBoss ? '#ff8a6a' : '#ffe2a8') : '#888'}">${known ? d.n : '???'}</b>${isBoss ? ' <span class="dim">Guardian</span>' : ''}
    <div class="dim">📍 ${where}</div>
    ${known ? `<div style="font-size:12px;margin:3px 0">${isBoss ? BOSS_LORE[t] : EN_LORE[t] || ''}</div><div style="font-size:12px;color:#9ad0ff">${AID[ai]}</div>
    <div style="font-size:11px">Life ${stars(d.hp / (isBoss ? 450 : 28), 5)} Damage ${stars(d.dmg / (isBoss ? 3.6 : 3.4), 5)} Speed ${stars((d.spd || 0) / 38, 5)}</div>
    <div style="font-size:12px">Slain: <b>${fmt(k)}</b> ${hb ? `<span class="up">• +${hb * 100}% damage vs this foe</span>` : ''}</div>
    ${next ? `<div class="qbar" title="Hunter's Knowledge"><div style="width:${k / next * 100}%"></div></div><div class="dim" style="font-size:11px">${next - k} more for Hunter's Knowledge +${tiers.indexOf(next) * 5 + 5}%</div>` : '<div class="up" style="font-size:11px">★ Mastered</div>'}`
      : `<div class="dim">Not yet encountered.</div>`}</div></div>`;
}
MENUS.bestiary = () => {
  const all = [...new Set(REG.flatMap(R => R.en))].concat(['mimic', 'gimp']);
  const seen = all.filter(t => S.best[t]).length + Object.keys(BOSS).filter(t => S.best[t]).length, tot = all.length + Object.keys(BOSS).length;
  const slain = Object.values(S.best).reduce((a, b) => a + b.k, 0);
  let h = tabs('bestiary') + `<h2>🐺 Bestiary <span class="dim">${seen}/${tot} discovered • ${fmt(slain)} slain</span></h2><div class="dim">Every creature you face is recorded here. Slay 25 / 100 / 500 of a kind for Hunter's Knowledge (+5% / +10% / +15% damage against it).</div>`;
  const shown = new Set();
  REG.forEach((R, i) => {
    const list = R.en.filter(t => !shown.has(t)); list.forEach(t => shown.add(t)); const ul = [...new Set(list)];
    h += `<h3 style="color:${R.torch}">${i + 1}. ${R.n}</h3><div class="bgrid">${beastCard(R.boss, true)}${ul.map(t => beastCard(t)).join('')}</div>`;
  });
  h += `<h3>Rare Creatures</h3><div class="bgrid">${beastCard('mimic')}${beastCard('gimp')}</div>`;
  return h;
};

// ---------- arsenal ----------
MENUS.arsenal = () => {
  const F = S.found; const wf = Object.keys(WT).filter(t => F.w[t]).length, uf = Object.keys(UNQ).filter(u => F.u[u]).length, af = Object.keys(ARTI).filter(a => F.art[a]).length;
  let h = tabs('arsenal') + `<h2>⚔️ Arsenal <span class="dim">${wf}/${Object.keys(WT).length} weapon types • ${uf}/${Object.keys(UNQ).length} powers • ${af}/${Object.keys(ARTI).length} artifacts</span></h2><div class="dim">Every weapon, armor piece, legendary power and artifact you have found.</div>`;
  h += `<h3>Weapons</h3><div class="bgrid">` + Object.keys(WT).map(t => { const w = WT[t], n = F.w[t] || 0, br = F.r[t]; return `<div class="card bc ${n ? '' : 'lock'}">${pimg('w', t, n)}<div style="flex:1"><b style="font-size:15px">${w.ic} ${w.n}</b> ${br !== undefined && br >= 0 ? `<span style="color:${RAR[br].c};font-size:12px">best: ${RAR[br].n}</span>` : ''}<div style="font-size:12px;color:#9ad0ff">${wDesc(w)}</div><div style="font-size:12px">Base damage ${w.dmg}${w.cnt ? ' ×' + w.cnt : ''} • ${(1 / w.cd).toFixed(2)} attacks/s${w.crit ? ` • +${w.crit * 100}% crit` : ''}</div><div class="dim">Found: ${n}</div>${wmBar(t)}</div></div>`; }).join('') + '</div>';
  h += `<h3>Armor</h3><div class="bgrid">` + Object.keys(AT).map(t => { const a = AT[t], n = F.a[t] || 0, br = F.r[t]; return `<div class="card bc ${n ? '' : 'lock'}"><div class="pimg" style="font-size:48px;display:flex;align-items:center;justify-content:center">${a.ic}</div><div style="flex:1"><b style="font-size:15px">${a.n}</b> ${br !== undefined && br >= 0 ? `<span style="color:${RAR[br].c};font-size:12px">best: ${RAR[br].n}</span>` : ''}<div style="font-size:12px">Base: ${Object.keys(a.base).map(k => statLine(k, a.base[k])).join(', ')}</div><div class="dim">Found: ${n}</div></div></div>`; }).join('') + '</div>';
  h += `<h3>Legendary Powers</h3><div class="bgrid">` + Object.keys(UNQ).map(u => { const n = F.u[u] || 0; return `<div class="card ${n ? '' : 'lock'}" style="font-size:13px"><b style="color:${n ? '#ffb05a' : '#888'}">★ ${n ? UNQ[u].n : '???'}</b> <span class="dim">${UNQ_W.includes(u) ? 'weapon' : 'armor/jewelry'}</span><div>${n ? UNQ[u].d : 'Find a Legendary item with this power to reveal it.'}</div>${n ? `<div class="dim">Found ${n}×</div>` : ''}</div>`; }).join('') + '</div>';
  h += `<h3 style="color:#7ffcff">✦ Celestial Artifacts</h3><div class="dim">The rarest weapons in Embervale. Drop from guardians (best odds on high difficulties and deep in the Abyss) or forge them at the Blacksmith from ${FORGE_COST} Celestial Fragments. You have ✧ ${S.frag}.</div><div class="bgrid">` +
    Object.keys(ARTI).map(k => { const A = ARTI[k], n = F.art[k]; return `<div class="card bc ${n ? 'done' : 'lock'}" ${n ? 'style="border-color:#7ffcff"' : ''}>${pimg('w', A.t, n, n ? 'style="filter:drop-shadow(0 0 8px #7ffcff)"' : '')}<div style="flex:1"><b style="font-size:15px;color:${n ? '#7ffcff' : '#888'}">${n ? A.n : '??? ' + WT[A.t].n}</b><div style="font-size:12px">${n ? A.d : 'An undiscovered Celestial ' + WT[A.t].n.toLowerCase() + '.'}</div>${n ? `<div class="dim" style="font-style:italic">"${A.lore}"</div><div style="font-size:11px;color:#ffb05a">★ ${UNQ[A.u].n} • ★ ${UNQ[A.u2].n}</div>` : ''}</div></div>`; }).join('') + '</div>';
  return h;
};

// ---------- wiki ----------
let WIKI_TAB = 'basics', WIKI_Q = '';
function wikiEntries() {
  const E = [];
  for (const sec in WIKI_TXT) for (const [t, b] of WIKI_TXT[sec]) E.push({ sec, t, b });
  E.push({ sec: 'controls', t: 'Keyboard & Mouse', b: 'WASD move • Mouse aim • Left click attack • Space/Shift/Right-click dodge • Q E R F skills • V or middle-click Ember Surge • 1 potion • Tab/X swap weapons • T town portal • Wheel zoom • I inventory • K skills • J bounties • L journal • B bestiary • N arsenal • O feats • M map • H wiki • Esc pause. All panels can also be opened with the buttons at the bottom-left.' });
  E.push({ sec: 'controls', t: 'Inventory', b: 'Click to equip/unequip • Right-click a weapon to put it in your off hand • Shift+Click salvage • Alt+Click lock • Hover to compare with your equipped item.' });
  for (const k in AFF) E.push({ sec: 'stats', t: AFF[k].n.replace(/^[% ]+/, ''), b: { dmg: 'Increases all weapon and skill damage.', critC: 'Chance for a hit to critically strike.', critD: 'Extra damage dealt by critical hits.', atkSpd: 'How fast you attack.', moveSpd: 'How fast you move.', hp: 'Maximum life.', hpReg: 'Life regenerated every second.', mp: 'Maximum mana for skills.', mpReg: 'Faster mana regeneration.', ls: 'Heals you for a share of damage dealt (capped per hit).', cdr: 'Skills recharge faster (max 50%).', dr: 'Reduces all damage taken (max 70%).', luck: 'Better chance of high-rarity drops.', gold: 'More gold from all sources.', skill: 'Boosts damage dealt by skills.', burn: 'Chance to ignite foes, dealing damage over 3s.', frz: 'Chance to chill foes, halving their speed.', shk: 'Chance to shock foes (+20% damage taken) and arc to a neighbour.', psn: 'Chance to poison foes; poison stacks.', thorns: 'Reflects a share of your weapon damage at attackers.', xp: 'More experience from kills.', surge: 'Ember Surge charges faster.', combo: 'Increases the damage bonus from combos.' }[k] });
  for (const k in WT) { const w = WT[k]; E.push({ sec: 'weapons', t: w.ic + ' ' + w.n, b: `${wDesc(w)}. Base damage ${w.dmg}${w.cnt ? ' ×' + w.cnt : ''}, ${(1 / w.cd).toFixed(2)} attacks per second${w.crit ? `, +${w.crit * 100}% crit chance` : ''}.` }); }
  for (const k in AT) E.push({ sec: 'weapons', t: AT[k].ic + ' ' + AT[k].n, b: 'Armor piece. Base: ' + Object.keys(AT[k].base).map(x => statLine(x, AT[k].base[x])).join(', ') + '.' });
  for (const k in UNQ) E.push({ sec: 'weapons', t: '★ ' + UNQ[k].n + ' (legendary power)', b: UNQ[k].d + (UNQ_W.includes(k) ? ' — weapons only.' : ' — armor and jewelry.') });
  RAR.forEach((r, i) => E.push({ sec: 'items', t: r.n + ' rarity', b: `${r.aff} affix${r.aff === 1 ? '' : 'es'}, ×${r.m} base power${i >= 4 ? (i === 6 ? ', two unique powers and a signature effect' : ', one unique power') : ''}.` }));
  for (const k in ARTI) { const A = ARTI[k]; E.push({ sec: 'artifacts', t: '✦ ' + (S.found && S.found.art[k] ? A.n : '??? (undiscovered ' + WT[A.t].n + ')'), b: S.found && S.found.art[k] ? `${A.d}. Powers: ${UNQ[A.u].n} and ${UNQ[A.u2].n}. "${A.lore}"` : 'Find or forge this artifact to reveal its secrets.' }); }
  for (const sk of SK) E.push({ sec: 'skills', t: sk.ic + ' ' + sk.n + ` (${BR[sk.b]}${sk.a ? ', active' : ', passive'})`, b: sk.d(1) + (sk.a ? ` Costs ${sk.mp} mana, ${sk.cd}s cooldown.` : '') + ` Max rank ${sk.max}. Unlocks at ${TIER_REQ[sk.t]} points in the branch.` });
  REG.forEach((R, i) => E.push({ sec: 'regions', t: `${i + 1}. ${R.n}`, b: `Level ${R.req}+ on Normal. Guardian: ${BOSS[R.boss].n}. Foes: ${[...new Set(R.en)].map(t => EN[t].n).join(', ')}.` }));
  for (const m of MODS) E.push({ sec: 'regions', t: '✦ Floor modifier: ' + m.n, b: m.d + '. About 1 floor in 4 has a modifier.' });
  for (const sh of SHRINES) E.push({ sec: 'regions', t: sh.n, b: sh.d + ' for 40 seconds.' });
  for (const el in ELITES) E.push({ sec: 'regions', t: 'Elite trait: ' + el, b: { Swift: '45% faster.', Vampiric: 'Heals when it hits you.', Shielded: 'Takes 40% less damage.', Volatile: 'Explodes into a ring of bolts on death.', Frenzied: 'Attacks much faster.', Giant: 'Huge and extra tough.', Arcane: 'Periodically fires a ring of arcane bolts.', Blinking: 'Teleports next to you every few seconds.' }[el] });
  DIFF.forEach((d, i) => E.push({ sec: 'regions', t: 'Difficulty: ' + d, b: i === 0 ? 'The story difficulty.' : `Much stronger foes and better loot. Level requirements +${i * 25}. ${i >= 2 ? 'Mythic items can drop.' : ''}` }));
  for (const sk of SK.filter(x => x.a)) void sk;
  return E;
}
const WIKI_SECS = [['basics', '🏠 Basics'], ['combat', '⚔️ Combat'], ['controls', '⌨️ Controls'], ['stats', '📊 Stats'], ['items', '💎 Items'], ['weapons', '🗡 Gear'], ['artifacts', '✦ Artifacts'], ['skills', '✨ Skills'], ['regions', '🗺 World'], ['world', '🌟 Features']];
MENUS.wiki = () => `${S ? tabs('wiki') : ''}<h2>❓ Embervale Wiki <input id="wikiq" placeholder="Search everything..." value="${WIKI_Q.replace(/"/g, '')}" oninput="WIKI_Q=this.value;wikiRender()" style="margin-left:14px;font-size:14px;padding:5px 10px;border-radius:7px;border:1px solid #8a6a30;background:#120e18;color:#ffe2a8;width:260px"></h2>
  <div class="tabs" style="flex-wrap:wrap">${WIKI_SECS.map(s => `<div class="tab ${WIKI_TAB === s[0] && !WIKI_Q ? 'on' : ''}" onclick="WIKI_TAB='${s[0]}';WIKI_Q='';renderMenu()">${s[1]}</div>`).join('')}${S ? '' : '<div style="flex:1"></div><div class="tab" onclick="backMenu()">✕</div>'}</div>
  <div id="wikires" style="min-width:760px"></div>`;
function wikiRender() {
  const el = $('wikires'); if (!el) return; const q = WIKI_Q.trim().toLowerCase();
  const list = wikiEntries().filter(e => q ? (e.t + ' ' + e.b).toLowerCase().includes(q) : e.sec === WIKI_TAB);
  el.innerHTML = (list.length ? list.map(e => `<div class="card" style="font-size:14px"><b style="color:#ffcf6b">${e.t}</b>${q ? ` <span class="dim">— ${WIKI_SECS.find(s => s[0] === e.sec)[1]}</span>` : ''}<div style="margin-top:2px;line-height:1.45">${e.b}</div></div>`).join('') : '<div class="dim">No results.</div>') +
    (!q && WIKI_TAB === 'world' ? `<div class="card"><span class="btn" onclick="openMenu('bestiary')">🐺 Open Bestiary</span><span class="btn" onclick="openMenu('arsenal')">⚔️ Open Arsenal</span><span class="btn" onclick="openMenu('journal')">📖 Open Journal</span></div>` : '');
}
