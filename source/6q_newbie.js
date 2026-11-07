// ================= NEW-PLAYER FRIENDLY: spaced-out Haven, stall intros & first tasks, Haven Guide, next-step hints, menu tips, Novice Ward =================
Object.assign(SPK, { sefa: { n: 'Jeweler Sefa', ic: ico('gem'), col: '#40d0d0' }, ilse: { n: 'Quartermaster Ilse', ic: ico('quartermaster'), col: '#d070d0' }, board: { n: 'Bounty Board', ic: ico('bounty-board'), col: '#c8a070' }, stash: { n: 'Your Stash', ic: ico('chest'), col: '#c89050' }, way: { n: 'The Waystone', ic: ico('vortex'), col: '#ff9a3a' } });
// ---------- every stall: where it stands, what it does, how it introduces itself, and a first task ----------
const STALLS = {
  portal: { pos: [19, 5], role: 'Travel to regions', who: 'way', intro: ['The Waystone hums when you touch it. From here you can travel to any region you have unlocked — and later to Trials and other challenges.', 'Start with the region marked ★ Next. The first floor of the Whispering Woods is a good place to begin.'], task: 'Travel to a region', tip: 'Walk onto the glowing Waystone north of the fountain' },
  shop:   { pos: [7, 8], role: 'Buy & sell gear', who: 'orla', intro: ['Welcome, welcome! I buy anything you drag back from the wilds, and I sell what others bring me.', 'Top row: things to buy. Bottom: your bag — click an item to sell it. I can also make your potions stronger and your bag bigger.'], task: 'Sell an item to Orla', tip: 'Click any item in the Sell area' },
  smith:  { pos: [31, 8], role: 'Upgrade your gear', who: 'brann', intro: ['Hmph. Another hero with dull steel. Bring me gold and Ember Ore and I\'ll make your gear stronger: up to +10.', 'Reforging rerolls an item\'s bonuses with shards. Later I can teach you crafting and more.'], task: 'Upgrade any item once', tip: 'Press an Upgrade button (needs gold + 1 Ember Ore)' },
  board:  { pos: [9, 21], role: 'Bounties: tasks for rewards', who: 'board', intro: ['Notices flutter on the board: three bounties are always posted.', 'They complete on their own while you adventure. When a bar is full, come back (or open Bounties anywhere) and claim the reward.'], task: 'Claim a finished bounty', tip: 'Finish a bounty in the dungeons, then press Claim' },
  sage:   { pos: [29, 21], role: 'Guidance & skill reset', who: 'elowen', intro: ['Whenever you are unsure where to go, come to me. I always know which guardian awaits next.', 'Skill points come from levelling up. Spend them in the Skill Tree (K). If you change your mind, I can reset them for you.'], task: 'Learn a skill in the Skill Tree (K)', tip: 'Press K and click a skill to rank it up' },
  stash:  { pos: [15, 20], role: 'Safe storage', who: 'stash', intro: ['Your stash: a sturdy chest where spare gear is safe forever.', 'Click an item to move it between your bag and the stash. Great for keeping gear for later or for another build.'], task: 'Put an item in your stash', tip: 'Click an item in your bag while the stash is open' },
  jewel:  { pos: [31, 15], role: 'Gems: socket & fuse', who: 'sefa', intro: ['Gems! I live for them. Rare and better gear has sockets — put a gem in and it grants a bonus.', 'Three gems of the same kind and tier fuse into a stronger one. Pick a gem, then click a socket.'], task: 'Socket a gem into your gear', tip: 'Pick a gem, then click an empty socket' },
  curio:  { pos: [7, 15], role: 'Spend Ember Marks', who: 'ilse', intro: ['Ember Marks: the currency of heroes. You earn them from bounties, feats, events and more.', 'Spend them here on colors, auras, companions and supply caches. All cosmetic or convenience — nothing you need.'], task: 'Buy anything with Ember Marks', tip: 'Pick something you like and press its button' },
};
// ---------- spaced-out layout ----------
{ const _btQ = buildTown; buildTown = function () { if (G.npcs) for (const n of G.npcs) { const st = STALLS[n.kind]; if (st) { n.x = (st.pos[0] + .5) * TILE; n.y = (st.pos[1] + .5) * TILE; } } _btQ(); }; }
// ---------- stall intros (first visit) ----------
function stState() { S.stall = S.stall || { intro: {}, task: {} }; return S.stall; }
function stallAt(menu) { if (!G.inTown || !G.npcs) return null; const n = G.npcs.find(x => x.menu === menu && dist(P, x) < 90); return n && STALLS[n.kind] ? n.kind : null; }
{ const _omQ = openMenu; openMenu = function (n) { const k = S && stallAt(n), st = S && stState();
  if (k && !st.intro[k] && !G.tut && G.menu !== 'dialog') { st.intro[k] = 1; const S_ = STALLS[k]; startDialog([...S_.intro.map(l => [S_.who, l]), ['you', `(First task here: ${S_.task}. ${S_.tip}.)`]], () => _omQ(n)); return; }
  _omQ(n); }; }
// ---------- first tasks ----------
function stallDone(k) { const st = stState(); if (st.task[k] || G.tutorial) return; st.task[k] = 1; const g = Math.round(60 * Math.pow(1.12, Math.min(maxPw(), 60)));
  S.gold += g; S.marks += 5; S.stats.stallTasks = (S.stats.stallTasks || 0) + 1; sfx('legend');
  const left = Object.keys(STALLS).filter(x => unl(x) && !st.task[x]).length;
  toast(`${ico('check')} Haven Guide: <b>${STALLS[k].task}</b> — +${fmt(g)} gold, +5 Marks${left ? ` • ${left} to go` : ' • Guide complete!'}`, '#9ad0ff');
  if (!left && Object.keys(STALLS).every(x => st.task[x])) { banner('Haven Guide Complete!', 'You know every corner of Haven', '#9ad0ff'); S.marks += 20; } saveGame(); }
const HOOK = (name, k, test) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function (...a) { const before = test ? test.pre(...a) : null; const r = f.apply(this, a); if (!test || test.post(before, ...a)) stallDone(k); return r; }; };
HOOK('sellItem', 'shop', { pre: id => S.inv.length, post: (n) => S.inv.length < n });
HOOK('buyItem', 'shop', { pre: () => S.gold, post: (g) => S.gold < g });
HOOK('upgrade', 'smith', { pre: id => { const it = findItem(id); return it ? it.plus : -1; }, post: (p, id) => { const it = findItem(id); return it && it.plus > p; } });
HOOK('toStash', 'stash', { pre: () => S.stash.length, post: (n) => S.stash.length > n });
HOOK('learn', 'sage', { pre: id => S.sk[id] || 0, post: (r, id) => (S.sk[id] || 0) > r });
HOOK('travel', 'portal');
HOOK('sockGem', 'jewel', { pre: () => JSON.stringify(Object.values(S.eq).map(i => i && i.sock)), post: (b) => JSON.stringify(Object.values(S.eq).map(i => i && i.sock)) !== b });
HOOK('buyMarks', 'curio', { pre: () => S.marks, post: (m) => S.marks < m });
{ const _cqQ = claimQuest; claimQuest = function (i) { const q = S.quests[i]; _cqQ(i); if (q && S.quests[i] !== q) stallDone('board'); }; }
// ---------- Haven Guide tracker (town only, until done) ----------
function guideHTML() { const st = stState(); const ks = Object.keys(STALLS).filter(k => unl(k) && (G.npcs || []).some(n => n.kind === k)); if (!ks.length || ks.every(k => st.task[k])) return '';
  const todo = ks.filter(k => !st.task[k]), shown = todo.slice(0, 4);
  return `<div class="gh">${ico('haven')} Haven Guide <span class="dim">${ks.length - todo.length}/${ks.length} done</span></div>` + shown.map(k => { const n = G.npcs.find(x => x.kind === k); return `<div class="gi">○ <b>${n ? n.ic : ''} ${STALLS[k].task}</b></div>`; }).join('') + (todo.length > 4 ? `<div class="gi dim">+ ${todo.length - 4} more…</div>` : ''); }
// ---------- next-step hint (always tells you what to do) ----------
function nextStep() {
  if (!S || !P || G.tutorial || G.tut) return '';
  if (S.sp > 0 && S.lvl >= 2) return `${ico('sparkle')} You have ${S.sp} skill point${S.sp > 1 ? 's' : ''} — press <b>K</b> to spend ${S.sp > 1 ? 'them' : 'it'}`;
  if (S.inv.length >= S.invMax) return ico('bag') + ' Your bag is full — sell at Orla or Shift+Click junk to salvage';
  if (G.inTown) { const st = stState(); const k = Object.keys(STALLS).find(x => unl(x) && (G.npcs || []).some(n => n.kind === x) && !st.task[x] && x !== 'portal' && x !== 'board' && x !== 'jewel' && x !== 'curio');
    if (k && !st.intro[k]) return `${ico('haven')} Visit ${G.npcs.find(n => n.kind === k).n} — ${STALLS[k].role.toLowerCase()}`;
    const r = S.done[S.diff].indexOf(false); return r < 0 ? ico('vortex') + ' Every guardian is beaten — try the Abyss or a harder difficulty at the Waystone' : `${ico('vortex')} Next: walk to the <b>Waystone</b> and travel to <b>${REG[r].n}</b>`; }
  if (G.boss && !G.boss.dead) return ico('skull') + ' Defeat the Guardian — dodge (Space) its red-marked attacks';
  if (G.exit) return ico('vortex') + ' Step into the portal to return to Haven';
  if (G.stairsOpen && G.stairs) return '↓ The stairs are open — follow the green arrow to go deeper';
  if (P.hp < ST.maxHp * .3 && S.pots > 0) return ico('potion') + ' Low life — press <b>1</b> to drink a potion';
  return ico('swords') + ' Slay foes to unseal the stairs (bar at the top)';
}
{ const _uhQ = updateHUD; updateHUD = function (dt) { _uhQ(dt); if (!S || G.mode === 'title' || !M) return;
  const g = hudLine('h-goal'); if (g) setH(g, 'goal', S.opts.nohint ? '' : (() => { const t = nextStep(); return t ? `<span class="nstep">Next:</span> ${t}` : ''; })());
  let gd = $('h-guide'); if (!gd) { const tr = $('h-tr'); if (tr) { gd = document.createElement('div'); gd.id = 'h-guide'; gd.className = 'hpan'; tr.appendChild(gd); } }
  if (gd) { const h = G.inTown && !G.tut ? guideHTML() : ''; setH(gd, 'guide', h); gd.style.display = h ? '' : 'none'; } }; }
// ---------- stall role labels & task markers in Haven ----------
{ const _doQ = drawOverlay; drawOverlay = function () { _doQ(); if (!R3 || !P || !S || !G.inTown || G.hideHud || !G.npcs) return; const st = stState();
  for (const n of G.npcs) { const S_ = STALLS[n.kind]; if (!S_ || dist(n, P) > 700) continue; const s = proj(n.x, n.y, 2.18); if (!s.vis) continue;
    X.textAlign = 'center'; X.font = 'italic 11px "Trebuchet MS",sans-serif'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(S_.role, s.x, s.y); X.fillStyle = '#d8c8a8'; X.fillText(S_.role, s.x, s.y);
    if (!st.task[n.kind] && !G.tut && n.kind !== 'board' || (n.kind === 'board' && !st.task.board && S.quests.some(q => q.have >= q.need))) { const t = proj(n.x, n.y, 3.35); if (t.vis) { const by = t.y + Math.sin(G.t * 4 + n.x) * 3; X.font = 'bold 20px sans-serif'; X.strokeText('!', t.x, by); X.fillStyle = '#ffd54a'; X.fillText('!', t.x, by); } } } }; }
// ---------- Waystone: recommended region ----------
{ const _ptQ = MENUS.portal; MENUS.portal = () => { let h = _ptQ(); const r = S.done[S.diff].indexOf(false); if (r >= 0) { const tag = `${r + 1}. ${REG[r].n}`; const i = h.indexOf(tag); if (i >= 0) h = h.slice(0, i + tag.length) + ' <span class="recb">★ Next</span>' + h.slice(i + tag.length); } return h; }; }
// ---------- short tips at the top of menus (first few visits) ----------
const MENU_TIP = {
  inv: 'Click an item to equip it • ' + ico('bolt') + ' Auto-equip picks your best gear • hover to compare • Shift+Click salvages junk for shards.',
  skills: 'Spend skill points by clicking a skill. Active skills need binding: click Q / E / R / F under a skill to put it on your bar.',
  shop: 'Top row: gear for sale. Bottom: your bag — click to sell. Services make potions stronger and your bag bigger.',
  smith: 'Upgrade makes an item stronger (+1 to +10, needs gold & Ember Ore). Reforge rerolls its bonuses (needs shards).',
  quests: 'Bounties fill up on their own while you play. When the bar is full, press Claim for the reward.',
  portal: 'Choose a region and floor. Start with the ★ Next region. The Threat line (top-left, in dungeons) shows if foes are too strong.',
  stash: 'Click items to move them between your bag and the stash. The stash is safe storage that never runs out of time.',
  jewel: 'Pick a gem, then click an empty socket on your gear. Three of a kind fuse into the next tier.',
  curio: 'Ember Marks come from bounties, feats and events. Everything here is cosmetic or convenience.',
  sage: 'Elowen always knows which guardian is next, and can reset your skill points for gold.',
  achieve: 'Feats complete automatically and pay gold and shards — some grant extra skill points.',
  wardrobe: 'Pick a title, color, aura and companion. Companions follow you, fight beside you and give a bonus.',
  paragon: 'Star points come from experience after level 30. Click a star to put a point in it.',
};
function tipOff(m) { S.tipOff = S.tipOff || {}; S.tipOff[m] = 1; saveGame(); renderMenu(); }
for (const m in MENU_TIP) { const f = MENUS[m]; if (!f) continue; MENUS[m] = (...a) => { let h = f(...a); if (!S) return h; S.tipN = S.tipN || {}; S.tipOff = S.tipOff || {}; if (S.tipOff[m] || (S.tipN[m] || 0) > 4) return h;
  const bar = `<div class="mtip">${ico('idea')} ${MENU_TIP[m]} <span class="mtx" onclick="tipOff('${m}')" title="Hide this tip">✕</span></div>`; const i = h.indexOf('</h2>'); return i < 0 ? bar + h : h.slice(0, i + 5) + bar + h.slice(i + 5); }; }
{ const _omT = openMenu; openMenu = function (n) { if (S && MENU_TIP[n] && n !== G.menu) { S.tipN = S.tipN || {}; S.tipN[n] = (S.tipN[n] || 0) + 1; } _omT(n); }; }
// ---------- Novice Ward: a gentle start in the first two regions ----------
function noviceWard() { return S && S.lvl < 10 && S.diff === 0 && !G.abyss && !G.trial && G.region <= 1 && !G.inTown && !S.opts.noward; }
{ const _hpQ = hurtPlayer; hurtPlayer = function (amt, src) { return _hpQ(noviceWard() && amt < 1e11 ? amt * .7 : amt, src); }; }
{ const _uhW = updateHUD; updateHUD = function (dt) { _uhW(dt); const el = H && H['h-buffs']; if (!el || !S || G.mode === 'title') return; if (noviceWard()) WART_BUF += ('<div class="buff wart" title="Novice Ward: you take 30% less damage in the first two regions until level 10" style="border-color:#9ad0ff">' + ico('beginner') + '<span>30%</span></div>'); }; }
{ const _stQ = MENUS.settings; MENUS.settings = () => { const h = _stQ(); if (!S) return h; const o = S.opts; return h.replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card">${ico('compass')} "Next step" hints <span class="btn ${!o.nohint ? 'on' : ''}" onclick="setOpt('nohint',${!o.nohint})">${!o.nohint ? 'On' : 'Off'}</span> &nbsp; ${ico('beginner')} Novice Ward <span class="btn ${!o.noward ? 'on' : ''}" onclick="setOpt('noward',${!o.noward})">${!o.noward ? 'On' : 'Off'}</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }; }
// ---------- feats & wiki ----------
ACH.push({ id: 'guide', n: 'At Home in Haven', d: 'Complete every Haven Guide task', c: () => Object.keys(STALLS).filter(k => S.stall && S.stall.task && S.stall.task[k]).length, need: Object.keys(STALLS).length, sp: 1 });
WIKI_TXT.basics.unshift(['Haven at a Glance', Object.keys(STALLS).map(k => `${STALLS[k].who === 'way' ? ico('vortex') + ' Waystone' : (SPK[STALLS[k].who] || {}).n || k} — ${STALLS[k].role}`).join(' • ') + '. Each stall explains itself the first time you visit and has a first task (tracked by the Haven Guide) with a small reward. The "Next:" line in the top-left always tells you what to do next, and the Novice Ward softens damage in the first two regions until level 10.']);
const nbStyle = document.createElement('style'); nbStyle.textContent = `
#h-guide{margin-top:8px;padding:8px 12px;font-size:12px;max-width:200px}#h-guide .gh{font:bold 12px Georgia,serif;color:#9ad0ff;margin-bottom:3px}#h-guide .gi{color:#e8dcc0;line-height:1.5}#h-guide .gi.ok{color:#7aff7a;opacity:.7;text-decoration:line-through}
.nstep{color:#9ad0ff;font-weight:bold;text-transform:uppercase;font-size:10px;letter-spacing:1px;margin-right:2px}#h-goal{font-size:12px;color:#f0e6d0;margin-top:5px;padding-top:4px;border-top:1px solid rgba(255,255,255,.08)}
.recb{display:inline-block;font:bold 10px 'Trebuchet MS';letter-spacing:1px;color:#1a1408;background:linear-gradient(#ffe28a,#ffb030);border-radius:8px;padding:1px 7px;margin-left:6px;vertical-align:middle;box-shadow:0 0 10px rgba(255,190,80,.6);animation:pulse 2s infinite}
.mtip{position:relative;margin:2px 0 10px;padding:7px 34px 7px 12px;border-radius:10px;font-size:13px;color:#dfe8f8;background:linear-gradient(90deg,rgba(90,140,230,.16),rgba(90,140,230,.04));border:1px solid rgba(122,170,255,.35)}.mtx{position:absolute;right:10px;top:6px;cursor:pointer;color:#9ab0d0}.mtx:hover{color:#fff}`;
document.head.appendChild(nbStyle);
