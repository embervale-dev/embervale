// ================= PROGRESSIVE UNLOCKS + dialog fixes =================
// ---------- dialogs: never show raw markup, and never cut each other off ----------
const DLG_Q = [];
{ const _sdP = startDialog; startDialog = function (lines, onEnd) {
  const clean = (lines || []).map(l => [l[0], String(l[1] ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()]).filter(l => l[1]);
  if (!clean.length) { if (onEnd) onEnd(); return; }
  if (G.menu === 'dialog' && DLG) { DLG_Q.push([clean, onEnd]); return; }
  _sdP(clean, onEnd); }; }
{ const _deP = dlgEnd; dlgEnd = function () { _deP(); if (DLG_Q.length && !DLG && G.menu !== 'dialog') { const [l, f] = DLG_Q.shift(); setTimeout(() => startDialog(l, f), 30); } }; }

// ---------- what unlocks when ----------
// every feature is introduced when it becomes useful instead of all at once
const firstBoss = () => (S.stats.bosses || 0) >= 1 || S.done[0].some(Boolean);
const UNLOCK = {
  // Haven stalls (npc kinds)
  stash:   { n: 'Your Stash', ic: ico('chest'), kind: 'npc', how: 'Reach level 2', ok: () => S.lvl >= 2 },
  board:   { n: 'Bounty Board', ic: ico('bounty-board'), kind: 'npc', how: 'Reach level 3', ok: () => S.lvl >= 3 },
  smith:   { n: 'Blacksmith Brann', ic: ico('anvil'), kind: 'npc', how: 'Reach level 4', ok: () => S.lvl >= 4 },
  jewel:   { n: 'Jeweler Sefa', ic: ico('gem'), kind: 'npc', how: 'Reach level 8 or find a gem', ok: () => S.lvl >= 8 || Object.values(S.gems || {}).some(t => Object.values(t || {}).some(n => n > 0)) },
  curio:   { n: 'Quartermaster Ilse', ic: ico('quartermaster'), kind: 'npc', how: 'Reach level 11 or earn 40 Ember Marks', ok: () => S.lvl >= 11 || (S.marks || 0) >= 40 },
  // menus
  quests:   { n: 'Bounties', ic: ico('scroll'), kind: 'menu', how: 'Reach level 3', ok: () => S.lvl >= 3 },
  achieve:  { n: 'Feats', ic: ico('trophy'), kind: 'menu', how: 'Reach level 2', ok: () => S.lvl >= 2 || S.tutDone },
  arsenal:  { n: 'Arsenal', ic: ico('swords'), kind: 'menu', how: 'Reach level 3', ok: () => S.lvl >= 3 },
  stats:    { n: 'Statistics', ic: ico('chart'), kind: 'menu', how: 'Reach level 4', ok: () => S.lvl >= 4 },
  gift:     { n: 'Daily Gift', ic: ico('gift'), kind: 'menu', how: 'Reach level 3', ok: () => S.lvl >= 3 },
  wardrobe: { n: 'Wardrobe', ic: ico('crown'), kind: 'menu', how: 'Reach level 6', ok: () => S.lvl >= 6 || (S.cos && (S.cos.pets || []).length > 0) },
  season:   { n: 'Season Journey', ic: ico('medal'), kind: 'menu', how: 'Reach level 8', ok: () => S.lvl >= 8 },
  haven:    { n: 'Restore Haven', ic: ico('restore'), kind: 'menu', how: 'Defeat your first Guardian', ok: firstBoss },
  exped:    { n: 'Expeditions', ic: ico('compass'), kind: 'menu', how: 'Defeat your first Guardian', ok: firstBoss },
  ledger:   { n: 'Ledger & Renown', ic: ico('book'), kind: 'menu', how: 'Reach level 10', ok: () => S.lvl >= 10 },
  paragon:  { n: 'Constellation', ic: '✦', kind: 'menu', how: `Reach level ${PARA_UNLOCK}`, ok: () => S.lvl >= PARA_UNLOCK - 5 },
  // systems inside menus
  requests: { n: 'Haven Requests', ic: ico('haven'), kind: 'sys', how: 'Finish the tutorial or reach level 4', ok: () => S.tutDone || S.lvl >= 4 || !!G.tut },
  craft:    { n: 'Crafting', ic: ico('tools'), kind: 'sys', how: 'Reach level 6', ok: () => S.lvl >= 6 },
  infuse:   { n: 'Elemental Infusion', ic: ico('fire'), kind: 'sys', how: 'Reach level 10', ok: () => S.lvl >= 10 },
  temper:   { n: 'Tempering', ic: ico('hammer'), kind: 'sys', how: 'Reach level 12', ok: () => S.lvl >= 12 },
  ascend:   { n: 'Ascension', ic: ico('up'), kind: 'sys', how: 'Defeat your first Guardian', ok: firstBoss },
  awaken:   { n: 'Awakening', ic: ico('awaken'), kind: 'sys', how: 'Own a Legendary weapon', ok: () => [...S.inv, ...Object.values(S.eq)].some(i => i && i.slot === 'weapon' && i.r >= 4) },
  trials:   { n: 'Daily & Weekly Trials', ic: ico('sun'), kind: 'sys', how: 'Reach level 8', ok: () => S.lvl >= 8 },
  invasion: { n: 'Weekly Invasion', ic: ico('warn'), kind: 'sys', how: 'Defeat 2 Guardians', ok: () => (S.stats.bosses || 0) >= 2 },
  gauntlet: { n: 'Guardian Gauntlet', ic: ico('swords'), kind: 'sys', how: 'Defeat 3 Guardians', ok: () => S.done[S.diff].filter(Boolean).length >= 3 },
  hunts:    { n: 'Weekly Hunts', ic: ico('hunt'), kind: 'sys', how: 'Reach level 12', ok: () => S.lvl >= 12 },
};
function unl(k) { if (!S) return true; const u = UNLOCK[k]; if (!u) return true; if (S.unl && S.unl[k]) return true; return !!u.ok(); }
function lockedHow(k) { const u = UNLOCK[k]; return u ? `${u.ic} ${u.n} unlocks later — ${u.how}.` : ''; }
// celebrate unlocks once
let unlT = 0;
function checkUnlocks(silent) { if (!S || G.tutorial) return; S.unl = S.unl || {}; const fresh = [];
  for (const k in UNLOCK) if (!S.unl[k] && UNLOCK[k].ok()) { S.unl[k] = 1; fresh.push(k); }
  if (silent || !fresh.length) return;
  const town = fresh.filter(k => UNLOCK[k].kind === 'npc');
  fresh.forEach((k, i) => G.later.push({ t: .6 + i * 1.4, fn: () => { const u = UNLOCK[k]; toast(`${ico('unlock')} <b>New ${u.kind === 'npc' ? 'in Haven' : u.kind === 'menu' ? 'in the Menu' : 'feature'}:</b> ${u.ic} ${u.n}${u.kind === 'npc' ? ' has opened a stall — pay them a visit!' : ''}`, '#9ad0ff'); sfx('shrine'); } }));
  if (town.length && G.inTown) G.later.push({ t: .2, fn: () => buildLevel() });
  saveGame(); }
{ const _uP2 = update; update = function (dt) { _uP2(dt); unlT -= dt; if (unlT <= 0 && S && G.mode === 'play') { unlT = 1; checkUnlocks(); } }; }
// existing characters: quietly mark what they already have (no flood of notices)
{ const _cgP = continueGame; continueGame = function () { _cgP(); if (S && !S.unlInit) { S.unlInit = 1; checkUnlocks(true); } }; }
{ const _ngP = newGame; newGame = function (c) { _ngP(c); if (S) S.unlInit = 1; }; }

// ---------- Haven: hide stalls that aren't open yet ----------
{ const _btP = buildTown; buildTown = function () { if (S && G.npcs) G.npcs = G.npcs.filter(n => !UNLOCK[n.kind] || UNLOCK[n.kind].kind !== 'npc' || unl(n.kind) || false); _btP(); }; }
// ---------- Menu: only show what's unlocked ----------
{ const _paP = MENUS.pause; MENUS.pause = () => { const all = HUB.slice(); const keep = all.filter(h => unl(h[0])); const hidden = all.length - keep.length; HUB.length = 0; HUB.push(...keep);
  let h; try { h = _paP(); } finally { HUB.length = 0; HUB.push(...all); }
  if (hidden) { const lockedKeys = all.filter(x => !unl(x[0])).map(x => x[0]); const next = Object.keys(UNLOCK).filter(k => lockedKeys.includes(k)).map(k => UNLOCK[k])[0]; h = h.replace('<div style="text-align:center;margin-top:10px">', `<div class="unlhint">${ico('lock')} ${hidden} more feature${hidden > 1 ? 's' : ''} unlock as you progress${next ? ` — next: <b>${next.ic} ${next.n}</b> (${next.how.toLowerCase()})` : ''}</div><div style="text-align:center;margin-top:10px">`); }
  return h; }; }
{ const _tbP = tabs; tabs = function (cur) { const saved = TAB_GROUPS.map(g => [g[0], g[1].slice()]); for (const g of TAB_GROUPS) g[1] = g[1].filter(k => k === cur || unl(k)); const live = TAB_GROUPS.filter(g => g[1].length); const keep = TAB_GROUPS.slice(); TAB_GROUPS.length = 0; TAB_GROUPS.push(...live);
  try { return _tbP(cur); } finally { TAB_GROUPS.length = 0; keep.forEach((g, i) => { g[1] = saved[i][1]; TAB_GROUPS.push(g); }); } }; }
{ const _omP = openMenu; openMenu = function (n) { if (S && UNLOCK[n] && UNLOCK[n].kind === 'menu' && !unl(n) && !G.tut) { toast(lockedHow(n), '#9ab0d0'); sfx('error'); return; } _omP(n); }; }
// HUD: Season button & bounty tracker appear when unlocked
{ const _uhP = updateHUD; updateHUD = function (dt) { _uhP(dt); if (!S || G.mode === 'title') return; const sb = document.querySelector(`[onclick="hudBtn('season')"]`); if (sb) sb.style.display = unl('season') ? '' : 'none'; const q = $('h-q'); if (q) q.style.visibility = unl('quests') ? '' : 'hidden'; }; }

// ---------- sections inside menus ----------
function cutSection(h, title) { const mt = new RegExp('<h3>(?:<svg[^>]*>[\\s\\S]*?</svg>|<img[^>]*>|[^<\\w\\s]{1,2})?\\s*' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).exec(h); const a = mt ? mt.index : -1; if (a < 0) return h; let b = h.indexOf('<h3', a + 4); if (b < 0) { const ft = h.lastIndexOf('<span class="btn" onclick="backHub()'); b = ft > a ? ft : h.length; } return h.slice(0, a) + h.slice(b); }
{ const _smP = MENUS.smith; MENUS.smith = () => { let h = _smP();
  if (!unl('craft')) h = h.replace(/<span class="btn" style="font-size:13px" onclick="openMenu\('craft'\)">(?:<svg[^>]*>[\s\S]*?<\/svg>|[^<\w\s]{1,2})?\s*Craft gear<\/span>/, '');
  if (!unl('infuse')) h = cutSection(h, 'Elemental Infusion'); if (!unl('temper')) h = cutSection(h, 'Tempering'); if (!unl('ascend')) h = cutSection(h, 'Ascension'); if (!unl('awaken')) h = cutSection(h, 'Awakening');
  if (!S.done[0][7] && !S.frag) h = cutSection(h, '✦ Celestial Forge');
  return h; }; }
{ const _ocP = openMenu; openMenu = function (n) { if (n === 'craft' && S && !unl('craft')) { toast(lockedHow('craft'), '#9ab0d0'); return; } _ocP(n); }; }
{ const _ptP = MENUS.portal; MENUS.portal = () => { let h = _ptP(); if (!unl('trials')) h = cutBlock(h, '<h3>Trials</h3>'); const ch = unl('invasion') || unl('gauntlet'); if (!ch) h = cutBlock(h, '<h3>Challenges</h3>'); return h; }; }
function cutBlock(h, head) { const a = h.indexOf(head); if (a < 0) return h; const s0 = h.indexOf('<div class="regcards">', a); if (s0 < 0) return h; let d = 0, i = s0; const re = /<div\b|<\/div>/g; re.lastIndex = s0; let m; while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) { i = re.lastIndex; break; } } return h.slice(0, a) + h.slice(i); }
{ const _qmP = MENUS.quests; MENUS.quests = () => { let h = _qmP(); if (!unl('hunts')) h = cutSection(h, 'Weekly Hunts'); if (!unl('requests')) h = cutSection(h, 'Haven Requests'); return h; }; }
// villager requests wait until unlocked (villagers still chat)
{ const _sqP = sqFor; sqFor = function (who) { return unl('requests') ? _sqP(who) : null; }; }
// invasion spawns only once it's unlocked
{ const _ivP = invaded; invaded = function () { return unl('invasion') && _ivP(); }; }
// ---------- unlock roadmap in the wiki & sage ----------
WIKI_TXT.basics.push(['Unlocking Features', 'Embervale opens up as you play so you are never swamped: ' + Object.values(UNLOCK).map(u => `${u.ic} ${u.n} — ${u.how.toLowerCase()}`).join(' • ') + '.']);
const unlStyle = document.createElement('style'); unlStyle.textContent = `.unlhint{text-align:center;margin:8px auto 0;font-size:12.5px;color:#a8b8d0;background:rgba(122,170,255,.06);border:1px dashed rgba(122,170,255,.3);border-radius:10px;padding:5px 12px;max-width:640px}`; document.head.appendChild(unlStyle);
