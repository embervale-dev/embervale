// ================= UPDATE: fair Arena, brutal Abyss (both tuned to YOUR strength), decluttered bigger menus, camera zoom, feat tracker, bounty upgrade =================
// ---------- your real strength (used to tune the Arena and the Abyss) ----------
function myDps() { if (!ST || !ST.wt) return 1; const w = WT[ST.wt] || WT.sword; const multi = w.k === 'fan' ? Math.max(1, (w.cnt || 1) * .85) : w.k === 'boom' ? 2.2 : 1; return Math.max(1, pdmg() * multi * (1 + Math.min(60, ST.critC) / 100 * ST.critD / 100) * atkRate() / w.cd); }
function myLife() { return Math.max(1, (ST && ST.maxHp) || 100); }
// ---------- ENDLESS ARENA: never out-scales you — each foe is capped by your own damage and life ----------
// wave 1: a foe dies in about half a second and hits for ~3% of your life; each wave adds a little.
function arenaCaps(W, elite, boss) { const t = boss ? 6 + W * .6 : (.5 + W * .1) * (elite ? 2.5 : 1), hit = boss ? Math.min(.35, .05 + W * .005) : Math.min(.3, .025 + W * .004) * (elite ? 1.3 : 1); return { hp: myDps() * t, dmg: myLife() * hit }; }
{ const _uK = update; update = function (dt) { _uK(dt); const A = G.arena; if (!A) return; for (const e of G.ens) { if (e.dead || e.prop || e.arenaFit) continue; e.arenaFit = 1; const c = arenaCaps(A.wave || 1, !!e.elite, !!e.boss); if (e.hp > c.hp) { e.hp = c.hp; e.maxHp = c.hp; } if (e.dmg > c.dmg) e.dmg = c.dmg; } }; }
{ const _saK = startArena; startArena = function () { _saK(); if (typeof regionPw === 'function') G.pw = Math.max(1, regionPw()); }; }
// ---------- THE ABYSS: foes are never weaker than a real challenge for YOUR gear ----------
// depth 1: a normal foe takes ~3s and hits for ~10% of your life. Each depth adds more; deep down it is brutal.
function abyssFloor(d, elite, boss) { const t = boss ? 30 + d * 3 : (3 + d * .5) * (elite ? 3.5 : 1), hit = (boss ? Math.min(1.1, .2 + d * .022) : Math.min(.95, .14 + d * .018) * (elite ? 1.3 : 1)) / Math.max(.4, 1 - Math.min(60, ST.dr || 0) / 100); return { hp: myDps() * t, dmg: myLife() * hit }; }
{ const _mkK = mkEnemy; mkEnemy = function (type, x, y, o = {}) { const e = _mkK(type, x, y, o); if (e && G.abyss && !e.prop && !NET.coopGuest) { const f = abyssFloor(G.depth | 0, !!e.elite, false); if (e.hp < f.hp) { e.hp = f.hp; e.maxHp = f.hp; } if (e.dmg < f.dmg) e.dmg = f.dmg; } return e; }; }
{ const _mbK = mkBoss; mkBoss = function (k, x, y) { const e = _mbK(k, x, y); if (e && G.abyss && !NET.coopGuest) { const f = abyssFloor(G.depth | 0, false, true); if (e.hp < f.hp) { e.hp = f.hp; e.maxHp = f.hp; } if (e.dmg < f.dmg) e.dmg = f.dmg; } return e; }; }
// ---------- camera: closer by default, remembered, adjustable in Settings ----------
camZoom = (S && S.opts && S.opts.camZ) || .82;
addEventListener('wheel', () => { if (S && S.opts) S.opts.camZ = +camZoom.toFixed(3); }, { passive: true });
{ const _ngK = newGame; newGame = function (c) { _ngK(c); camZoom = .82; if (S) S.opts.camZ = camZoom; }; }
{ const _cgK = continueGame; continueGame = function () { _cgK(); camZoom = (S && S.opts.camZ) || .82; }; }
function setCamZ(v) { camZoom = clamp(+v, .65, 1.5); if (S) { S.opts.camZ = camZoom; saveGame(); } }
// ---------- SETTINGS: tabs instead of one long wall ----------
let SET_TAB = 'game';
const SET_TABS = [['game', 'Gameplay'], ['loot', 'Loot'], ['view', 'Display & Audio'], ['keys', 'Controls']];
function setCat(card) { const t = card.textContent.toLowerCase(); if (card.querySelector('.kbb') || t.includes('controls')) return 'keys'; if (/salvage|loot|auto-lock|make room|ignore loot/.test(t)) return 'loot'; if (/music|sound|graphics|shake|damage numbers|interface|camera|fps|weather|contrast|flashes|zoom/.test(t)) return 'view'; return 'game'; }
{ const _rmK = renderMenu; renderMenu = function () { _rmK(); if (G.menu !== 'settings' || !S) return; const grid = panel.querySelector('.setgrid'); if (!grid) return;
  panel.querySelectorAll('.fitpg').forEach(x => x.remove());
  for (const c of [...panel.querySelectorAll(':scope > .card, :scope > div > .card')]) if (c.parentNode !== grid && !c.closest('.setgrid')) grid.appendChild(c);
  const cards = [...grid.children]; cards.forEach(c => c.classList.toggle('sethid', setCat(c) !== SET_TAB));
  if (!panel.querySelector('.settabs')) { const bar = document.createElement('div'); bar.className = 'fitbar settabs'; bar.innerHTML = SET_TABS.map(([k, n]) => `<span class="fitt ${SET_TAB === k ? 'on' : ''}" onclick="SET_TAB='${k}';renderMenu()">${n}</span>`).join(''); grid.parentNode.insertBefore(bar, grid); }
  if (SET_TAB === 'view' && !panel.querySelector('#camz')) { const c = document.createElement('div'); c.className = 'card'; c.id = 'camz'; c.innerHTML = `${ico('eye')} Camera distance <input type="range" min="0.65" max="1.5" step="0.01" value="${camZoom}" oninput="setCamZ(this.value)"> <span class="dim">closer ◂ ▸ further (mouse wheel works too)</span>`; grid.insertBefore(c, grid.firstChild); } if (typeof fitMenu === 'function') fitMenu(); }; }
// ---------- INVENTORY: bigger and decluttered ----------
{ const _ivK = MENUS.inv; MENUS.inv = () => { let h = _ivK(); if (!S) return h; const open = !!S.opts.salvOpen;
  // salvage-by-rarity folds away behind one button
  h = h.replace(/<div class="rpick">[\s\S]*?Locked items \(Alt\+Click\) and equipped gear are never touched\.<\/div><\/div>/, m => open ? m : '');
  h = h.replace(/<div class="hint invhint">[\s\S]*?<\/div>/, '');
  h = h.replace('<span class="btn" onclick="sortInv()">Sort</span>', '');
  h = h.replace(`${ico('broom')} Clean bag</span>`, `${ico('broom')} Clean bag</span><span class="btn ${open ? 'on' : ''}" onclick="S.opts.salvOpen=${!open};renderMenu()">${ico('broom')} Salvage by rarity ${open ? '▴' : '▾'}</span><span class="fchip" title="Click: equip / unequip • Right-click weapon: off hand • Shift+Click: salvage • Alt+Click: lock • Ctrl+Click in Haven: to stash">? Shortcuts</span>`);
  // loadouts on a single compact line
  h = h.replace(/<div class="card" style="margin-top:6px">([^]*?)<b>Loadouts<\/b> <span class="dim">[^<]*<\/span><br>/, '<div class="card lorow">$1<b>Loadouts</b> ');
  return h; }; }
{ const _shK = statsHTML; statsHTML = function () { let h = _shK(); if (!S) return h; const more = !!S.opts.moreStats; const i = h.search(/<div class="stsec">[^<]*(<svg[^>]*>.*?<\/svg>|<img[^>]*>)?[^<]*Utility/); if (i < 0) return h;
  const tail = h.slice(i), head = h.slice(0, i); const end = tail.search(/<div style="display:block;margin-top:6px;font-size:12px">|<div class="uq"/); const extra = end < 0 ? tail : tail.slice(0, end), rest = end < 0 ? '' : tail.slice(end);
  return head + (more ? extra : '') + `<div class="stmore" onclick="S.opts.moreStats=${!more};renderMenu()">${more ? '▴ Fewer stats' : '▾ Utility & element stats'}</div>` + rest; }; }
// ---------- FEATS: "almost there" and a pinned feat on your HUD ----------
function featProg(a) { const v = Math.min(a.need, +a.c() || 0); return v / a.need; }
function pinFeat(id) { S.pinFeat = S.pinFeat === id ? null : id; sfx('click'); renderMenu(); }
{ const _acK = MENUS.achieve; MENUS.achieve = () => { let h = _acK(); const open = ACH.filter(a => !S.ach[a.id]).map(a => [a, featProg(a)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const near = open.length ? `<div class="card near"><b>${ico('target')} Almost there</b> ${open.map(([a, p]) => `<span class="nearf"><b>${a.n}</b> <span class="dim">${fmt(Math.min(a.need, +a.c() || 0))}/${fmt(a.need)}</span> <span class="fchip ${S.pinFeat === a.id ? 'on' : ''}" onclick="pinFeat('${a.id}')">${S.pinFeat === a.id ? 'Pinned' : 'Pin'}</span></span>`).join('')}<div class="dim" style="font-size:11px">A pinned feat shows its progress in the top-left panel.</div></div>` : '';
  const i = h.indexOf('</h2>'); return i < 0 ? h : h.slice(0, i + 5) + near + h.slice(i + 5); }; }
{ const _uhK = updateHUD; updateHUD = function (dt) { _uhK(dt); const el = typeof hudLine === 'function' && hudLine('h-pin'); if (!el || !S) return; const a = S.pinFeat && ACH.find(x => x.id === S.pinFeat); if (a && S.ach[a.id]) { S.pinFeat = null; toast(`${ico('trophy')} Pinned feat complete: <b>${a.n}</b>`, '#ffd27a'); }
  setH(el, 'pin', a && !S.ach[a.id] ? `<span style="color:#ffd27a">${ico('pin')} ${a.n}: ${fmt(Math.min(a.need, +a.c() || 0))} / ${fmt(a.need)}</span>` : ''); }; }
// ---------- BOUNTIES (upgraded): one free reroll per day, and a Bounty Cache for every 3 claimed ----------
function freeRerollLeft() { return S.freeRr !== dayId(); }
{ const _rrK = rerollQuest; rerollQuest = function (i) { if (freeRerollLeft()) { S.freeRr = dayId(); S.quests.splice(i, 1, genQuest()); sfx('click'); toast('Free daily reroll used', '#9ad0ff'); renderMenu(); return; } _rrK(i); }; }
{ const _cqK = claimQuest; claimQuest = function (i) { const q = S.quests[i]; _cqK(i); if (!q || S.quests[i] === q) return; S.bCache = (S.bCache || 0) + 1; if (S.bCache >= 3) { S.bCache = 0; S.marks += 12; const it = genItem(regionPw() + 1, { minR: 3, bonus: .3 }); it.isNew = true; (S.inv.length < S.invMax ? S.inv : S.stash).push(it); noteFound(it); addGem(pick2(Object.keys(GEMS)), gemTier()); banner('Bounty Cache!', `3 bounties done: 12 Marks, a gem and ${RAR[it.r].n} ${it.name}`, '#ffd27a'); sfx('legend'); saveGame(); renderMenu(); } }; }
{ const _qmK = MENUS.quests; MENUS.quests = () => { let h = _qmK(); const n = S.bCache || 0; const bar = `<div class="card" style="padding:6px 12px"><b>${ico('chest')} Bounty Cache</b> <span class="dim">claim 3 bounties for a bonus cache (Epic+ item, gem, 12 Marks)</span> <span class="cachepips">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>${freeRerollLeft() ? ' <span class="up" style="font-size:12px">• 1 free reroll today</span>' : ''}</div>`;
  if (freeRerollLeft()) h = h.replace(/Abandon \(([^)]*)\)/g, 'Reroll (free today)');
  const i = h.indexOf('</div>', h.indexOf('</h2>')); return i < 0 ? h : h.slice(0, i + 6) + bar + h.slice(i + 6); }; }
// ---------- DECLUTTER: denser layouts so menus fit at full size ----------
{ const _rrK2 = runeRow; runeRow = function (s, r) { return s.a && r < 3 ? '' : _rrK2(s, r); }; }
{ const _rmK2 = renderMenu; renderMenu = function () { _rmK2(); if (!S) return; let moved = 0;
  if (G.menu === 'quests') { const cards = [...panel.querySelectorAll('.card')].filter(c => c.querySelector('[onclick^="claimQuest"],[onclick^="rerollQuest"]') && !c.closest('.qrow')); if (cards.length > 1) { const row = document.createElement('div'); row.className = 'qrow'; cards[0].parentNode.insertBefore(row, cards[0]); cards.forEach(c => row.appendChild(c)); moved = 1; }
    const d = [...panel.querySelectorAll('.dim')].find(x => /^Complete bounties anywhere/.test(x.textContent)); if (d) { d.remove(); moved = 1; } }
  if (G.menu === 'shop') { const rows = [...panel.querySelectorAll('.smrow')].filter(r => !r.closest('.smgrid')); if (rows.length > 2) { const g = document.createElement('div'); g.className = 'smgrid'; rows[0].parentNode.insertBefore(g, rows[0]); rows.forEach(r => g.appendChild(r)); moved = 1; } }
  if (moved && typeof fitMenu === 'function') fitMenu(); }; }
// ---------- small extras ----------
// message log: filter chips (All / Loot / Progress / Other) and newest-first paging instead of a scroll box
let LOG_F = 'all', LOG_PG = 0;
function logKind(l) { const t = (l.h || '').replace(/<[^>]*>/g, '').toLowerCase(); if (/salvag|sold|received|found|loot|item|gold|shard|gem|ore|cache|drop/.test(t)) return 'loot'; if (/bount|feat|quest|level|unlock|complete|marks|reward|season|milestone|depth|wave/.test(t)) return 'prog'; return 'other'; }
MENUS.log = () => { const all = G.log.slice().reverse(), list = LOG_F === 'all' ? all : all.filter(l => logKind(l) === LOG_F), per = 12, pages = Math.max(1, Math.ceil(list.length / per)); if (LOG_PG >= pages) LOG_PG = pages - 1;
  const chip = (k, n) => `<span class="fitt ${LOG_F === k ? 'on' : ''}" onclick="LOG_F='${k}';LOG_PG=0;renderMenu()">${n} <span class="dim">${k === 'all' ? all.length : all.filter(l => logKind(l) === k).length}</span></span>`;
  return `<h2>${ico('notebook')} Message Log <span class="dim">this session</span></h2><div class="fitbar">${chip('all', 'All')}${chip('loot', 'Loot')}${chip('prog', 'Progress')}${chip('other', 'Other')}</div>
  <div style="min-width:640px;margin-top:6px">${list.length ? list.slice(LOG_PG * per, LOG_PG * per + per).map(l => `<div class="logl" style="border-left-color:${l.col}"><i>${l.t}</i>${l.h}</div>`).join('') : '<div class="dim">Nothing yet.</div>'}</div>
  ${pages > 1 ? `<div class="fitpg"><span class="btn ${LOG_PG ? '' : 'dis'}" onclick="LOG_PG--;renderMenu()">◀ Newer</span><span class="pgn">Page <b>${LOG_PG + 1}</b> / ${pages}</span><span class="btn ${LOG_PG < pages - 1 ? '' : 'dis'}" onclick="LOG_PG++;renderMenu()">Older ▶</span></div>` : ''}
  <span class="btn" onclick="G.log=[];LOG_PG=0;renderMenu()">Clear</span><span class="btn" onclick="openMenu('pause')">Back</span>`; };

// auto-sort the bag when you pick things up (toggle)
{ let n0 = 0; const _uK2 = update; update = function (dt) { _uK2(dt); if (!S || !S.opts.autoSort) return; if (S.inv.length > n0 && typeof invSorted === 'function') { const s = invSorted(S.inv); S.inv.length = 0; S.inv.push(...s); } n0 = S.inv.length; }; }
{ const _stK = MENUS.settings; MENUS.settings = () => { const h = _stK(); if (!S) return h; const on = !!S.opts.autoSort; return h.replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card">${ico('bag')} Keep the bag sorted automatically <span class="btn ${on ? 'on' : ''}" onclick="setOpt('autoSort',${!on})">${on ? 'On' : 'Off'}</span> <span class="dim">uses your Inventory sort choice</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }; }
WIKI_TXT.world.push(
  ['Arena & Abyss Tuning', 'Both modes now look at your real damage and life. Arena foes are capped so the early waves are a warm-up (a foe dies in about half a second and hits for ~3% of your life on wave 1) and every wave adds a little. Abyss foes are never weaker than a real challenge for your gear: at depth 1 a normal foe takes about 3 seconds and hits for ~10% of your life, and every depth makes them tougher and harder-hitting — elites and guardians much more so.'],
  ['Bounty Cache & Feat Tracker', 'Every 3 bounties you claim fill a Bounty Cache (an Epic+ item, a gem and 12 Marks), and each day your first bounty reroll is free. In Feats, "Almost there" shows your closest feats; pin one to keep its progress in the top-left panel.'],
);
const kStyle = document.createElement('style'); kStyle.textContent = `
.panel{--uiK:1.06}.panel:not(.ttl):not(.dlg){zoom:calc(var(--ui,1) * var(--uiK))}.panel.fitz{zoom:calc(var(--ui,1) * var(--uiK) * var(--fitz,1))!important}
.panel h2{font-size:28px!important}.panel .card{font-size:14.5px}
.grid{grid-template-columns:repeat(8,58px)!important;gap:3px!important}.grid .cell,.eq.doll .cell{width:54px!important;height:54px!important;font-size:30px!important}
.eq.doll{grid-template-columns:repeat(3,70px)!important}
.setgrid>.sethid{display:none!important}
.qrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:8px}.qrow>.card{margin:0!important}
.smgrid{display:grid;grid-template-columns:1fr 1fr;column-gap:18px}
.tier{margin:5px 0!important}
.lorow{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 12px!important;margin-top:6px}
.stmore{grid-column:1/-1;cursor:pointer;text-align:center;font-size:12px;color:#9ad0ff;padding:4px;border-radius:8px;margin-top:4px;background:rgba(122,170,255,.08)}.stmore:hover{background:rgba(122,170,255,.16)}
.near{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}.nearf{display:inline-flex;gap:6px;align-items:center}
.cachepips{display:inline-flex;gap:4px;margin-left:6px;vertical-align:middle}.cachepips i{width:14px;height:8px;border-radius:4px;background:rgba(255,255,255,.12)}.cachepips i.on{background:#ffd27a;box-shadow:0 0 6px #ffd27a}`;
document.head.appendChild(kStyle);
