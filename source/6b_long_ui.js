// ================= LONG-TERM SYSTEMS: menus =================
function wmBar(t) {
  const l = wmLvl(t), k = S.wm[t] || 0, nx = wmNext(t), pv = l * l * 8;
  return `<div style="font-size:12px;margin-top:2px">🗡 Mastery <b style="color:#ffd27a">${l}/40</b>${l ? ` <span class="up">+${(l * .5).toFixed(1)}% dmg, +${(l * .25).toFixed(1)}% crit dmg</span>` : ''}</div>${nx ? `<div class="qbar"><div style="width:${(k - pv) / (nx - pv) * 100}%"></div></div><div class="dim" style="font-size:11px">${fmt(nx - k)} kills to next level</div>` : '<div class="up" style="font-size:11px">★ Fully mastered</div>'}`;
}
// ---------- Ember Constellation ----------
MENUS.paragon = () => {
  const p = S.para, locked = S.lvl < PARA_UNLOCK;
  let h = tabs('paragon') + `<h2>✦ Ember Constellation <span class="pts">${p.pts} star point${p.pts === 1 ? '' : 's'}</span> <span class="dim">Level ${p.lvl}</span></h2>`;
  if (locked) return h + `<div class="card"><b>The stars are still dark.</b><div class="dim">Reach character level ${PARA_UNLOCK} to awaken the Ember Constellation. From then on, experience also fills a second, endless bar: every Constellation level grants a star point to spend on permanent bonuses — forever.</div></div>`;
  h += `<div class="dim">Experience fills both your level and the Constellation. Each node holds up to ${PARA_MAX} points (${PARA.length * PARA_MAX} in total). Respec freely.</div><div class="qbar" style="height:10px"><div style="width:${p.xp / paraNeed() * 100}%"></div></div><div class="dim">${fmt(p.xp)} / ${fmt(paraNeed())} to Constellation level ${p.lvl + 1}${S.lvl >= MAXLVL ? ' (at max level, experience flows here faster)' : ''}</div><div class="stars">`;
  PARA_C.forEach((c, ci) => {
    const tot = PARA.filter(x => x.c === ci).reduce((a, x) => a + (p.n[x.k] || 0), 0);
    h += `<div><h3 style="color:${c[1]}">${c[2]} ${c[0]} <span class="dim">${tot} pts</span></h3>`;
    for (const x of PARA.filter(x => x.c === ci)) { const v = p.n[x.k] || 0; h += `<div class="star"><div class="sv" style="color:${c[1]}">${v}/${PARA_MAX}</div><div style="flex:1;font-size:12px"><b>${x.n}</b><div class="dim">${x.d(Math.max(v, 1))}${v ? '' : ' (per point)'}</div></div>${v < PARA_MAX && p.pts ? `<span class="btn" style="padding:2px 7px" onclick="spendStar('${x.k}',1)">+1</span><span class="btn" style="padding:2px 7px" onclick="spendStar('${x.k}',10)">+10</span>` : ''}</div>`; }
    h += '</div>';
  });
  return h + `</div><span class="btn" onclick="resetStars()">Reset all stars (free)</span>`;
};
// ---------- Season Journey ----------
MENUS.season = () => {
  const ss = seasonState(), si = seasonInfo(), objs = seasonObjs();
  let h = tabs('season') + `<h2 style="color:${si.col}">🏅 ${si.n} <span class="dim">${si.month} • ends in ${untilStr(si.ends)}</span></h2>
  <div class="card" style="border-color:${si.col}">Season blessing (active for everyone this month): <b style="color:${si.col}">${SEASON_BUFF[si.m][0]}</b><div class="dim">A brand-new Season Journey with fresh objectives arrives every calendar month. Finish all five chapters to earn this season's exclusive title and aura.</div></div>`;
  for (let c = 0; c < 5; c++) {
    const open = chapOpen(c), done = ss.chap.includes(c), list = objs.filter(o => o.c === c);
    h += `<div class="card ${done ? 'done' : open ? '' : 'lock'}"><b style="font-family:Georgia;font-size:16px">Chapter ${c + 1}</b> <span class="dim">Reward: 🔶 ${CHAP_RW[c]} marks${c === 2 ? ' + Crowned Slime companion' : ''}${c === 4 ? ' + season title & aura' : ''}</span> ${done ? '<span class="up">✔ Complete</span>' : open ? '' : '<span class="dim">🔒 finish the previous chapter</span>'}`;
    for (const o of list) {
      const v = sjProg(o), cl = ss.claimed.includes(o.id), ok = v >= o.need;
      h += `<div class="smrow"><div class="nm">${cl ? '✔' : '•'} ${o.t.n(o.need)} <span class="dim">${fmt(v)}/${fmt(o.need)}</span><div class="qbar"><div style="width:${v / o.need * 100}%"></div></div></div>${cl ? '<span class="dim">claimed</span>' : `<span class="btn ${ok && open ? '' : 'dis'}" onclick="claimSJ(${o.id})">Claim 🔶8</span>`}</div>`;
    }
    h += '</div>';
  }
  return h;
};
// ---------- Wardrobe ----------
function ownedColors() { return COLORS.filter((c, i) => i < 3 || S.cos.colors.includes(c[0])); }
function unlockedTitles() { return TITLES.filter(t => t.c()).map(t => ({ k: t.k, n: t.n })).concat(S.cos.stitles.map(n => ({ k: 's:' + n, n }))); }
MENUS.wardrobe = () => {
  const c = S.cos;
  let h = tabs('wardrobe') + `<h2>👑 Wardrobe</h2><div class="dim">Customize your look and choose a companion. Buy more at Quartermaster Ilse in Haven with 🔶 Ember Marks (you have ${S.marks}).</div>`;
  h += `<h3>Title</h3><div>${unlockedTitles().map(t => `<span class="btn ${c.title === t.k ? 'on' : ''}" onclick="S.cos.title='${t.k.replace(/'/g, "\\'")}';renderMenu()">${t.n}</span>`).join('')}</div><div class="dim">Locked titles: ${TITLES.filter(t => !t.c()).map(t => `${t.n} (${t.how})`).join(' • ') || 'none!'}</div>`;
  h += `<h3>Color</h3><div>${COLORS.map(col => { const own = ownedColors().includes(col); return `<span class="sw ${(c.color || CLS[S.cls].col) === col[0] ? 'on' : ''} ${own ? '' : 'lk'}" title="${col[1]}${own ? '' : ' (buy at the Quartermaster)'}" style="background:${col[0]}" ${own ? `onclick="S.cos.color='${col[0]}';renderMenu()"` : ''}></span>`; }).join('')}</div>`;
  h += `<h3>Aura</h3><div>${c.auras.map(a => `<span class="btn ${c.aura === a ? 'on' : ''}" onclick="S.cos.aura='${a}';renderMenu()"><span style="color:${auraCol(a) === 'rainbow' ? '#ff8af0' : auraCol(a) || '#aaa'}">●</span> ${auraName(a)}</span>`).join('')}</div>`;
  h += `<h3>Companion</h3><div class="row">${Object.keys(PETS).map(k => { const P_ = PETS[k], own = c.pets.includes(k); return `<div class="card ${own ? '' : 'lock'} ${c.pet === k ? 'done' : ''}" style="width:238px;padding:6px 9px;cursor:${own ? 'pointer' : 'default'}" ${own ? `onclick="S.cos.pet=S.cos.pet==='${k}'?null:'${k}';calcStats();renderMenu()"` : ''}>${pimg('e', '', own, '', P_)}<b>${own ? P_.n : '???'}</b><div style="font-size:12px" class="${own ? 'up' : 'dim'}">${P_.b}</div><div class="dim" style="font-size:11px">${own ? (c.pet === k ? '✔ Following you' : 'Click to summon') : P_.cost ? `Quartermaster: 🔶 ${P_.cost}` : P_.src}</div></div>`; }).join('')}</div><div class="dim">Every companion also gathers gold from twice as far away.</div>`;
  return h;
};
// pet portraits reuse the bestiary portrait renderer with a custom model description
const _portrait = portrait;
portrait = function (kind, key, desc) { if (desc) { const id = 'pet:' + desc.n; if (PORT[id] !== undefined) return PORT[id]; EN['__pet'] = { ...desc, hp: 1, dmg: 1, spd: 1, r: 1, ai: 'chase' }; delete PORT['e:__pet']; const u = _portrait('e', '__pet'); delete PORT['e:__pet']; delete EN['__pet']; return PORT[id] = u; } return _portrait(kind, key); };
const _pimg = pimg;
pimg = function (kind, key, known, extra = '', desc) { if (!desc) return _pimg(kind, key, known, extra); const u = portrait(kind, key, desc); return u ? `<img class="pimg ${known ? '' : 'unk'}" style="width:64px;height:64px;float:right" src="${u}">` : ''; };
// ---------- Quartermaster (Ember Marks shop) ----------
function buyMarks(cost, fn) { if (S.marks < cost) { toast('Not enough Ember Marks — earn them from Trials, the Season Journey and guardians', '#ff9a6a'); sfx('error'); return; } S.marks -= cost; fn(); sfx('gold'); saveGame(); renderMenu(); }
MENUS.curio = () => {
  let h = `<h2>🔶 Quartermaster Ilse <span style="color:#ff9a6a;font-size:16px">🔶 ${S.marks} Ember Marks</span></h2><div class="dim">"Marks are earned from Daily & Weekly Trials, the Season Journey and slaying guardians. Spend them on companions, cosmetics and supplies."</div>`;
  h += `<h3>Companions</h3><div class="row">` + Object.keys(PETS).filter(k => PETS[k].cost).map(k => { const own = S.cos.pets.includes(k); return `<div class="card" style="width:210px;padding:6px 9px">${pimg('e', '', true, '', PETS[k])}<b>${PETS[k].n}</b><div class="up" style="font-size:12px">${PETS[k].b}</div>${own ? '<div class="dim">Owned</div>' : `<span class="btn ${S.marks < PETS[k].cost ? 'dis' : ''}" onclick="buyMarks(${PETS[k].cost},()=>unlockPet('${k}'))">🔶 ${PETS[k].cost}</span>`}</div>`; }).join('') + '</div>';
  h += `<h3>Colors</h3><div>` + COLORS.filter(c => c[2]).map(c => { const own = S.cos.colors.includes(c[0]); return `<span class="card" style="display:inline-block;padding:4px 8px;margin:3px"><span class="sw" style="background:${c[0]}"></span> ${c[1]} ${own ? '<span class="dim">owned</span>' : `<span class="btn" onclick="buyMarks(${c[2]},()=>S.cos.colors.push('${c[0]}'))">🔶 ${c[2]}</span>`}</span>`; }).join('') + '</div>';
  h += `<h3>Auras</h3><div>` + Object.keys(AURAS).filter(k => AURAS[k][2]).map(k => { const own = S.cos.auras.includes(k); return `<span class="card" style="display:inline-block;padding:4px 8px;margin:3px"><span style="color:${AURAS[k][1] === 'rainbow' ? '#ff8af0' : AURAS[k][1]}">●</span> ${AURAS[k][0]} ${own ? '<span class="dim">owned</span>' : `<span class="btn" onclick="buyMarks(${AURAS[k][2]},()=>S.cos.auras.push('${k}'))">🔶 ${AURAS[k][2]}</span>`}</span>`; }).join('') + '</div>';
  h += `<h3>Supplies</h3>
  <div class="smrow"><div class="nm">💎 Gem Pouch <span class="dim">3 random gems of your current tier</span></div><span class="btn" onclick="buyMarks(15,()=>{for(let i=0;i<3;i++){const g=pick(Object.keys(GEMS)),t=gemTier();addGem(g,t);S.stats.gems++;toast(GEMS[g].ic+' '+GEM_TN[t]+' '+GEMS[g].n);}})">🔶 15</span></div>
  <div class="smrow"><div class="nm">◆ Ember Ore ×8</div><span class="btn" onclick="buyMarks(10,()=>S.ore+=8)">🔶 10</span></div>
  <div class="smrow"><div class="nm">✧ Celestial Fragments ×3 <span class="dim">(${S.frag}/${FORGE_COST})</span></div><span class="btn" onclick="buyMarks(70,()=>S.frag+=3)">🔶 70</span></div>
  <div class="smrow"><div class="nm">🎲 Legendary Cache <span class="dim">a guaranteed Legendary item</span></div><span class="btn" onclick="buyMarks(90,()=>{const it=genItem(maxPw()+1,{r:4});if(S.inv.length<S.invMax){it.isNew=true;S.inv.push(it);noteFound(it);toast('You got: <span style=&quot;color:#ff9a2e&quot;>'+it.name+'</span>');}else{S.marks+=90;toast('Bag full!');}})">🔶 90</span></div>`;
  return h + `<br><span class="btn" onclick="openMenu('wardrobe')">👑 Open Wardrobe</span><span class="btn" onclick="closeMenu()">Leave</span>`;
};
// ---------- Jeweler (gems & sockets) ----------
let SELGEM = null;
function combineCost(t) { return Math.round(25 * Math.pow(1.9, t) * Math.pow(1.06, Math.min(maxPw(), 120))); }
function combineGem(g, t, all) {
  let n = 0;
  do { if (S.gems[g][t] < 3 || t >= 10) break; const c = combineCost(t); if (S.gold < c) { if (!n) { toast('Not enough gold'); sfx('error'); } break; } S.gold -= c; S.gems[g][t] -= 3; addGem(g, t + 1); n++; } while (all);
  if (n) { sfx('magic'); toast(`Created ${n}× ${GEM_TN[t + 1]} ${GEMS[g].n}`, GEMS[g].col); } renderMenu();
}
function sockGem(slot, i) {
  const it = S.eq[slot]; if (!it) return; if (!it.sock) it.sock = new Array(nSock(it)).fill(null);
  const cur = it.sock[i];
  if (cur) { const fee = Math.round(10 * Math.pow(1.1, Math.min(maxPw(), 120)) * cur.t); if (S.gold < fee) { toast(`Removing costs ${fmt(fee)}g`); return; } S.gold -= fee; addGem(cur.g, cur.t); it.sock[i] = null; sfx('click'); }
  else { if (!SELGEM || !S.gems[SELGEM.g][SELGEM.t]) { toast('Select a gem first (click one above)'); return; } S.gems[SELGEM.g][SELGEM.t]--; it.sock[i] = { ...SELGEM }; sfx('item'); if (!S.gems[SELGEM.g][SELGEM.t]) SELGEM = null; }
  afterGear(); renderMenu();
}
MENUS.jewel = () => {
  let h = `<h2>💎 Jeweler Sefa <span class="gold" style="font-size:16px">● ${fmt(S.gold)}</span></h2><div class="dim">"Three gems of a kind fuse into one of the next tier — all the way to Celestial (tier 10). Rare items have 1 socket, Legendary & Mythic 2, Celestial 3."</div><h3>Your gems <span class="dim">click to select, then click an empty socket</span></h3>`;
  for (const g in GEMS) {
    const G_ = GEMS[g], row = []; for (let t = 1; t <= 10; t++) if (S.gems[g][t]) row.push(t);
    h += `<div class="smrow"><div style="width:150px"><b style="color:${G_.col}">${G_.ic} ${G_.n}</b><div class="dim" style="font-size:11px;white-space:nowrap">+${gemVal(g, 1).toFixed(1)}${G_.u} per tier</div></div><div class="nm">${row.map(t => `<span class="gemb ${SELGEM && SELGEM.g === g && SELGEM.t === t ? 'on' : ''}" onclick="SELGEM={g:'${g}',t:${t}};renderMenu()" title="${GEM_TN[t]} ${G_.n}: +${gemVal(g, t).toFixed(1)}${G_.u}">${G_.ic} T${t} ×${S.gems[g][t]}</span>${S.gems[g][t] >= 3 && t < 10 ? `<span class="btn" style="padding:2px 6px;font-size:11px" onclick="combineGem('${g}',${t})">Fuse (${fmt(combineCost(t))}g)</span><span class="btn" style="padding:2px 6px;font-size:11px" onclick="combineGem('${g}',${t},1)">all</span>` : ''}`).join('') || '<span class="dim">none yet — gems drop from elites, guardians, chests and Trials</span>'}</div></div>`;
  }
  h += `<h3>Sockets on your equipped gear</h3>`;
  for (const sl of SLOTS) {
    const it = S.eq[sl]; if (!it) continue; const n = nSock(it); if (!n) { h += `<div class="smrow">${cell(it, 'noop')}<div class="nm"><span style="color:${RAR[it.r].c}">${it.name}</span> <span class="dim">— no sockets (needs Rare or better)</span></div></div>`; continue; }
    if (!it.sock) it.sock = new Array(n).fill(null);
    h += `<div class="smrow">${cell(it, 'noop')}<div class="nm"><span style="color:${RAR[it.r].c}">${it.name}</span> <span class="dim">${SLOTN[sl]}</span><br>${it.sock.map((g, i) => g ? `<span class="sock f" title="${GEM_TN[g.t]} ${GEMS[g.g].n}: +${gemVal(g.g, g.t).toFixed(1)}${GEMS[g.g].u} — click to remove (fee)" onclick="sockGem('${sl}',${i})">${GEMS[g.g].ic}</span>` : `<span class="sock" title="Empty socket" onclick="sockGem('${sl}',${i})">+</span>`).join('')}</div></div>`;
  }
  return h + `<br><span class="btn" onclick="closeMenu()">Leave</span>`;
};
// ---------- Wandering Merchant ----------
MENUS.wander = () => {
  const m = G.merch; if (!m) return '';
  let h = `<h2>🎒 Wandering Merchant</h2><p class="lore">"Psst. Rare goods, straight from the deep. Prices are steep, but you won't see these again — I'm gone when you leave this floor."</p><div class="row">`;
  for (const it of m.items) h += `<div class="ware">${cell(it, 'buyWander')}<div class="${S.gold >= itemVal(it) * 7 ? 'gold' : 'dim'}">${fmt(itemVal(it) * 7)}g</div></div>`;
  if (!m.items.length) h += '<div class="dim">"All sold! Safe travels."</div>';
  return h + `</div><br><span class="btn" onclick="closeMenu()">Leave</span>`;
};
function buyWander(id) { const m = G.merch, i = m.items.findIndex(x => x.id === id); if (i < 0) return; const it = m.items[i], c = itemVal(it) * 7; if (S.gold < c) { toast('Not enough gold'); sfx('error'); return; } if (S.inv.length >= S.invMax) { toast('Inventory full'); return; } S.gold -= c; m.items.splice(i, 1); it.isNew = true; S.inv.push(it); noteFound(it); sfx('gold'); hideTip(); renderMenu(); }
const _findItem2 = findItem; findItem = function (id) { return _findItem2(id) || (G.merch && G.merch.items.find(i => i.id === id)); };
// ---------- Trials on the Waystone ----------
const _portalMenu = MENUS.portal;
MENUS.portal = () => {
  const card = kind => { const T = trialDef(kind), done = trialDone(kind), wk = kind === 'w';
    return `<div class="card" style="border-color:${wk ? '#ff7a5a' : '#ffb07a'}"><b style="font-family:Georgia;font-size:16px;color:${wk ? '#ff8a6a' : '#ffc08a'}">${wk ? '⚔ Weekly Trial' : '☀ Daily Trial'}</b> <span class="dim">${REG[T.reg].n} • ${T.time / 60} min • new trial in ${untilStr(wk ? nextWeek() : nextDay())}</span>
    <div style="margin:3px 0">${T.rules.map(k => `<span style="color:#ff9a6a">${TRULES[k].ic} <b>${TRULES[k].n}</b></span> <span class="dim">${TRULES[k].d}</span>`).join('<br>')}</div>
    <div class="dim">Goal: slay every foe before time runs out. Reward: 🔶 ${wk ? 120 : 30} Ember Marks, ${wk ? '3 Epic+ items, a Legendary, 3 Celestial Fragments' : '2 Epic+ items'} and gems.</div>
    <span class="btn" onclick="startTrial('${kind}')">${done ? 'Practice again (reward claimed ✔)' : 'Begin Trial'}</span></div>`; };
  const h = _portalMenu();
  return h.replace('<div class="regcards">', `<h3>Trials</h3><div class="regcards">${card('d')}${card('w')}</div><h3>Regions</h3><div class="regcards">`);
};
// ---------- save slots & title ----------
function slotSummary(i) { const s = loadGame(i); if (!s) return null; return s; }
MENUS.title = () => {
  const s = loadGame(SLOT);
  return `<div class="title"><h1 class="big">EMBERVALE</h1><div class="sub">~ The Fading Flame ~</div>
  ${s ? `<div class="btn bigb" onclick="continueGame()">Continue — Slot ${SLOT + 1}<br><span class="dim">Lv ${s.lvl} ${CLS[s.cls] ? CLS[s.cls].n : ''} • ${fmtTime((s.stats && s.stats.time) || 0)}</span></div>` : ''}
  <div class="btn bigb" onclick="openMenu('slots')">${s ? 'Save Slots / New Game' : 'New Game'}</div>
  <div class="btn bigb" onclick="G.prevMenu='title';openMenu('wiki')">❓ Wiki & How to Play</div>
  <div class="btn bigb" onclick="openSettingsFromTitle()">Settings</div>
  <div class="dim" style="margin-top:18px;text-shadow:0 1px 3px #000">${seasonInfo().n} is live • Daily & Weekly Trials • 3 save slots • Progress saves automatically</div></div>`;
};
MENUS.slots = () => `<div class="title" style="min-width:560px"><h2>Save Slots</h2>${[0, 1, 2].map(i => { const s = slotSummary(i);
  return `<div class="card" style="text-align:left">${s ? `<b>Slot ${i + 1}: Lv ${s.lvl} ${CLS[s.cls] ? CLS[s.cls].n : ''}</b> <span class="dim">• ${fmtTime((s.stats && s.stats.time) || 0)} • ${(s.done && s.done[0] ? s.done[0].filter(Boolean).length : 0)}/12 shards • ${s.para ? '✦' + s.para.lvl : ''}</span><br><span class="btn" onclick="SLOT=${i};continueGame()">▶ Play</span><span class="btn" onclick="SLOT=${i};openMenu('confirmDel')">🗑 Delete</span>` : `<b>Slot ${i + 1}: empty</b><br><span class="btn" onclick="SLOT=${i};openMenu('class')">✚ New Game</span>`}</div>`; }).join('')}
  <span class="btn" onclick="openMenu('title')">Back</span></div>`;
MENUS.confirmDel = () => `<div class="title"><h2>Delete Slot ${SLOT + 1}?</h2><p class="lore">This permanently erases that character.</p><div class="btn" onclick="deleteSlot(SLOT);openMenu('slots')">Yes, delete it</div><div class="btn" onclick="openMenu('slots')">Cancel</div></div>`;
LOCKED_MENUS.push('slots', 'confirmDel');
WIKI_TXT.world.push(
  ['Ember Constellation', `Awakens at level ${PARA_UNLOCK}. Experience also fills an endless Constellation bar; each level grants a star point for permanent bonuses across Might, Guard, Swiftness and Fortune (16 nodes, up to ${PARA_MAX} points each). Press P.`],
  ['Seasons', 'Every real-world month is a new Season with its own blessing and a 25-objective Season Journey in five chapters. Rewards include Ember Marks, a companion and an exclusive title and aura for finishing. Press Y.'],
  ['Daily & Weekly Trials', 'Found at the Waystone. A special floor with 2–3 twisted rules (Glass Cannon, The Swarm, Giants...). Slay every foe before time runs out. A new Daily Trial every day and a new Weekly Trial every Monday. Rewards: Ember Marks, Epic+ gear, gems, and on weekly trials a Legendary and Celestial Fragments.'],
  ['Ember Marks', 'A currency earned from Trials, Season Journey objectives and guardians. Spend it at Quartermaster Ilse on companions, colors, auras and supplies.'],
  ['Gems & Sockets', 'Gems drop from elites, guardians, chests, Cursed Chests and Trials. Socket them into Rare+ gear at Jeweler Sefa (Rare 1, Legendary/Mythic 2, Celestial 3 sockets). Fuse 3 gems into the next tier, up to tier 10.'],
  ['Companions', 'Pets that follow you, collect gold from far away and grant a small bonus. Buy them, find them from guardians, or earn them from Seasons and Trials. Choose yours in the Wardrobe (G).'],
  ['Weapon Mastery', 'Every kill trains your main-hand weapon type. Mastery levels (up to 40 per type) grant +0.5% damage and +0.25% crit damage each with that weapon type. Track it in the Arsenal.'],
  ['Cursed Chests', 'Purple chests on some floors. Open one to face 3 waves of cursed foes within 60 seconds for excellent loot.'],
  ['Wandering Merchants', 'Hooded traders sometimes appear on dungeon floors selling Epic and Legendary gear — only until you leave the floor.'],
  ['Rested Experience', 'Time away from the game builds a rested bonus (up to 3 days\' worth). Rested experience doubles the experience from kills until it is spent — the blue section of your XP bar.'],
  ['Save Slots', 'Three separate characters can be saved. Manage them from the title screen.'],
  ['Death', 'Falling sends you back to Haven and costs 15% of your gold. Your gear, levels and progress are always kept.'],
);
// ---------- full reset & save export / import ----------
function resetAll() {
  for (let i = 0; i < 3; i++) deleteSlot(i);
  for (const k of Object.keys(localStorage)) if (k.startsWith('embervale')) localStorage.removeItem(k);
  S = null; location.reload();
}
MENUS.confirmReset = () => `<div class="title"><h2 style="color:#ff6a5a">⚠ Reset ALL progress?</h2><p class="lore">This permanently deletes <b>every save slot</b>, settings and progress, and restarts the game completely fresh.<br>Tip: use <b>📤 Export</b> in Save Slots first if you might want your character back.</p><div class="btn" style="border-color:#ff6a5a;color:#ffb0a0" onclick="resetAll()">Yes, erase everything</div><div class="btn" onclick="openMenu('title')">Cancel</div></div>`;
LOCKED_MENUS.push('confirmReset');
function exportSlot(i) {
  const s = loadGame(i); if (!s) return;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(s)], { type: 'application/json' }));
  a.download = `embervale-save-slot${i + 1}-lv${s.lvl}.json`; document.body.appendChild(a); a.click(); a.remove(); toast('Save exported to your Downloads folder');
}
function importSlot(i) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; f.text().then(t => { try { const s = JSON.parse(t); if (!s || !s.cls || !s.lvl) throw 0; localStorage.setItem(slotKey(i), JSON.stringify(s)); toast(`Imported into slot ${i + 1}`); openMenu('slots'); } catch (e) { toast('That file is not an Embervale save', '#ff8a8a'); } }); };
  inp.click();
}
{
  const _title = MENUS.title;
  MENUS.title = () => _title().replace('</div></div>', `</div><div style="margin-top:14px"><span class="btn" style="font-size:12px;opacity:.8;border-color:#a05a4a" onclick="openMenu('confirmReset')">⚠ Reset all progress</span></div></div>`);
  const _slots = MENUS.slots;
  MENUS.slots = () => _slots()
    .replace(/<span class="btn" onclick="SLOT=(\d);openMenu\('confirmDel'\)">🗑 Delete<\/span>/g, (m, i) => `${m}<span class="btn" onclick="exportSlot(${i})">📤 Export</span>`)
    .replace(/<span class="btn" onclick="SLOT=(\d);openMenu\('class'\)">✚ New Game<\/span>/g, (m, i) => `${m}<span class="btn" onclick="importSlot(${i})">📥 Import save</span>`);
}
