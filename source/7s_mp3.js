// ================= MULTIPLAYER 3: anyone can duel anyone, invites instead of interruptions, gifts, inspect, chat commands =================
// - Duel requests no longer get auto-declined because a menu is open: they arrive as a small prompt (Y / N) that never blocks play.
// - Any player can challenge any other player (guest ↔ guest is relayed by the host). Duel buttons sit on the party frames too.
// - Guests who are off adventuring are ASKED before being pulled to the leader's floor; /join (or the button) catches up later.
// - Send items to friends, inspect their gear, keep a head-to-head duel record, offer rematches.
// - Chat commands: /duel name, /gift name, /inspect name, /join, /who, /roll, /help.
// ---------- prompts (one at a time, queued) ----------
const MPQ = []; let MPP = null;
const MPEL = document.createElement('div'); MPEL.id = 'mpprompt'; document.body.appendChild(MPEL);
function mpAsk(key, html, yes, no, secs = 25) { if (MPP && MPP.key === key) return; const q = { key, html, yes, no, t: secs, max: secs }; if (!MPP) MPP = q; else if (!MPQ.some(x => x.key === key)) MPQ.push(q); mpDraw(); sfx('click'); }
function mpAnswer(ok) { const q = MPP; if (!q) return; MPP = MPQ.shift() || null; mpDraw(); try { (ok ? q.yes : q.no) && (ok ? q.yes : q.no)(); } catch (e) { console.warn('mp prompt', e); } }
function mpDraw() { if (!MPP) { MPEL.style.display = 'none'; MPEL.innerHTML = ''; return; } MPEL.style.display = 'block';
  MPEL.innerHTML = `<div class="mppt">${MPP.html}</div><div class="mppb"><span class="btn" onclick="mpAnswer(true)">Accept <kbd>Y</kbd></span><span class="btn" onclick="mpAnswer(false)">Decline <kbd>N</kbd></span></div><div class="mppbar"><i style="width:${Math.max(0, MPP.t / MPP.max) * 100}%"></i></div>`; }
{ const _uM3 = update; update = function (dt) { _uM3(dt); if (!MPP) return; MPP.t -= dt; const bar = MPEL.querySelector('.mppbar i'); if (bar) bar.style.width = Math.max(0, MPP.t / MPP.max) * 100 + '%'; if (MPP.t <= 0) mpAnswer(false); }; }
// prompts tick even while a menu pauses the game
setInterval(() => { if (MPP && G.menu) { MPP.t -= .25; const bar = MPEL.querySelector('.mppbar i'); if (bar) bar.style.width = Math.max(0, MPP.t / MPP.max) * 100 + '%'; if (MPP.t <= 0) mpAnswer(false); } }, 250);
{ const _okM3 = onKey; onKey = function (k, e) { if (MPP && !G.rebind && (k === 'y' || k === 'n') && !(typeof CHAT !== 'undefined' && CHAT.open)) { mpAnswer(k === 'y'); return; } return _okM3(k, e); }; }
// ---------- players ----------
function netOn() { return typeof NET !== 'undefined' && (NET.status === 'host' || NET.status === 'guest'); }
function pName(id) { const p = NET.players.get(id); return p ? p.name : 'A player'; }
function findPlayer(q) { q = String(q || '').trim().toLowerCase(); const all = [...NET.players.values()]; if (!q) return all.length === 1 ? all[0] : null; return all.find(p => p.name.toLowerCase() === q) || all.find(p => p.name.toLowerCase().startsWith(q)) || null; }
function cleanId(id) { return String(id || '').replace(/[^\w-]/g, ''); }
// ---------- duels: prompt instead of a blocking menu, record, rematch ----------
function duelAsk(m) { mpAsk('duel:' + m.from, `${ico('swords')} <b>${esc(m.name || pName(m.from))}</b> challenges you to a duel — first to 3.${G.inTown ? '' : ' <span class="dim">(you will leave this floor)</span>'}`, () => { NET.duelReq = m; duelAnswer(true); }, () => { NET.duelReq = m; duelAnswer(false); }, 20); }
{ const _adM = askDuel; askDuel = function (id) { id = cleanId(id); if (!netOn()) return; if (G.duel) return toast('Finish your current duel first', '#ff8a8a'); if (G.mode !== 'play') return; _adM(id); const p = id; setTimeout(() => { if (NET.pendingDuel === p) { NET.pendingDuel = null; toast(`${ico('globe')} ${esc(pName(p))} didn't answer the duel`, '#9ab0d0'); } }, 22000); }; }
function duelRec(name) { S.duelRec = S.duelRec || {}; return S.duelRec[name] || [0, 0]; }
{ const _dpM = duelPoint; duelPoint = function (iWon) { const D = G.duel; _dpM(iWon); if (!D || D.rec || !(D.me >= 3 || D.them >= 3)) return; D.rec = 1; const nm = pName(D.opp), r = duelRec(nm); r[D.me >= 3 ? 0 : 1]++; S.duelRec[nm] = r; saveGame();
  const opp = D.opp; setTimeout(() => toast(`${ico('swords')} Record vs ${esc(nm)}: <b>${r[0]} – ${r[1]}</b>`, '#ffd27a'), 1600);
  setTimeout(() => { if (netOn() && NET.players.has(opp) && !G.duel) mpAsk('rematch:' + opp, `${ico('swords')} Rematch <b>${esc(nm)}</b>?`, () => askDuel(opp), null, 15); }, 5600); }; }
// ---------- co-op: ask before pulling a busy guest to the leader's floor ----------
{ const _rfM = recvFloor; recvFloor = function (m) { const want = NET.wantFloor; NET.wantFloor = 0;
  if (!want && !NET.coopGuest && S && !G.inTown && G.mode === 'play' && !G.duel && !G.tutorial) { NET.lastFloor = m; mpAsk('floor', `${ico('compass')} <b>${esc(m.name || 'Your leader')}</b> entered a new floor. Join them?<div class="dim">Decline to keep adventuring alone — /join or the party button catches up later.</div>`, () => _rfM(m), null, 30); return; }
  return _rfM(m); }; }
function joinLeader() { if (!netOn() || NET.host) return toast('Only party members can join the leader', '#ff8a8a'); if (NET.coopGuest) return toast('You are already with your party', '#9ad0ff'); NET.wantFloor = 1; toHost({ t: 'wantfloor' }); toast(`${ico('compass')} Asking to join your leader…`, '#9ad0ff'); setTimeout(() => { NET.wantFloor = 0; }, 6000); }
// ---------- gifts ----------
DUEL_T.push('gift', 'insp', 'inspr');
function giftClean(raw) { try { if (!raw || typeof raw !== 'object' || JSON.stringify(raw).length > 6000) return null; const s = raw, slot = String(s.slot || ''), isW = slot === 'weapon';
    if (!(isW || ARMOR_SLOTS.includes(slot))) return null; const t = String(s.t || ''); if (isW ? !WT[t] : !AT[t]) return null;
    const it = { id: IID++, slot, t, r: clamp(s.r | 0, 0, RAR.length - 1), il: clamp(s.il | 0, 0, 500), plus: clamp(s.plus | 0, 0, 10), aff: [], u: s.u && UNQ[s.u] ? s.u : null, name: String(s.name || '').replace(/[<>]/g, '').slice(0, 60) || 'Gift' };
    for (const a of Array.isArray(s.aff) ? s.aff.slice(0, 10) : []) if (a && AFF[a.k] && isFinite(+a.v)) it.aff.push({ k: a.k, v: +a.v, q: clamp(+a.q || 0, 0, 1) });
    if (s.u2 && UNQ[s.u2]) it.u2 = s.u2; if (s.set && typeof SETS !== 'undefined' && SETS[s.set]) it.set = s.set; if (s.art && ARTI[s.art]) it.art = s.art; if (typeof s.wgt === 'string' && /^(light|medium|heavy)$/.test(s.wgt)) it.wgt = s.wgt;
    if (s.awk) it.awk = 1; if (typeof s.tmp === 'string' && s.tmp.length < 20) it.tmp = s.tmp.replace(/[^\w]/g, '');
    if (Array.isArray(s.sock)) it.sock = s.sock.slice(0, 4).map(g => g && GEMS[g.g] ? { g: g.g, t: clamp(g.t | 0, 0, 9) } : null);
    return it; } catch (e) { return null; } }
let GIFT_TO = null;
function giftOpen(id) { id = cleanId(id); if (!netOn() || !NET.players.has(id)) return toast('That player is not in your room', '#ff8a8a'); GIFT_TO = id; openMenu('pgift'); }
function giftSend(itemId) { const it = S.inv.find(i => i.id === itemId); if (!it || !GIFT_TO || !NET.players.has(GIFT_TO)) return; if (it.r >= 4 && !confirm(`Give ${it.name} (${RAR[it.r].n}) to ${pName(GIFT_TO)}?`)) return;
  const copy = JSON.parse(JSON.stringify(it)); S.inv.splice(S.inv.indexOf(it), 1); duelSend(GIFT_TO, { t: 'gift', it: copy, name: netName() }); hideTip(); sfx('gold'); toast(`${ico('gift')} Sent <span style="color:${RAR[it.r].c}">${esc(it.name)}</span> to ${esc(pName(GIFT_TO))}`, '#ffd27a'); netPost(`${ico('gift')} You gave <b>${esc(it.name)}</b> to ${esc(pName(GIFT_TO))}`); saveGame(); renderMenu(); }
MENUS.pgift = () => { const to = GIFT_TO && NET.players.get(GIFT_TO); if (!to) return `<h2>${ico('gift')} Send a gift</h2><div class="card">That player has left the room.</div><span class="btn" onclick="closeMenu()">Close</span>`;
  const items = S.inv.slice().sort((a, b) => b.r - a.r);
  return `<h2>${ico('gift')} Send a gift to <span style="color:${esc(to.col)}">${esc(to.name)}</span></h2><div class="dim">Click an item in your bag to give it away. Equipped gear stays with you. Gifts arrive in their bag (or stash when the bag is full).</div>
  <div class="giftg">${items.length ? items.map(it => `<div class="cell giftc" style="border-color:${RAR[it.r].c}" onmouseenter="tipItem(${it.id},event)" onmousemove="moveTip(event)" onmouseleave="hideTip()" onclick="giftSend(${it.id})">${icon(it)}</div>`).join('') : '<div class="dim">Your bag is empty.</div>'}</div>
  <span class="btn" onclick="closeMenu()">Done</span>`; };
// ---------- inspect ----------
function inspAsk(id) { id = cleanId(id); if (!netOn() || !NET.players.has(id)) return; duelSend(id, { t: 'insp' }); toast(`${ico('eye')} Looking at ${esc(pName(id))}'s gear…`, '#9ad0ff'); }
let INSP = null;
function inspData() { const eq = SLOTS.map(sl => S.eq[sl]).filter(Boolean).map(it => ({ n: String(it.name).slice(0, 60), r: it.r | 0, s: SLOTN[eqSlotOf(it)] || it.slot, p: typeof itemPower === 'function' ? Math.round(itemPower(it)) : 0 })); return { eq, dps: Math.round(myDps()), life: ST.maxHp, lvl: S.lvl, cls: S.cls, para: S.para ? S.para.lvl || 0 : 0, atlas: S.atlas ? S.atlas.tier - 1 : 0, abyss: Math.max(...(S.abyssBest || [0])), arena: S.arenaBest || 0, pvp: S.stats.pvpWins || 0 }; }
MENUS.insp = () => { const d = INSP; if (!d) return `<h2>${ico('eye')} Inspect</h2><div class="card">Waiting for their answer…</div><span class="btn" onclick="closeMenu()">Close</span>`;
  return `<h2>${ico('eye')} ${esc(d.name)} <span class="dim" style="font-size:14px">Lv ${d.lvl} ${CLS[d.cls] ? CLS[d.cls].n : ''}</span></h2>
  <div class="card ahd"><span>${ico('might')} <b>${fmt(d.dps)}</b> DPS</span><span>${ico('heart')} <b>${fmt(d.life)}</b> life</span><span>${ico('portal')} Atlas tier <b>${d.atlas}</b></span><span>${ico('skull')} Abyss <b>${d.abyss}</b></span><span>${ico('arena')} Arena wave <b>${d.arena}</b></span><span>${ico('swords')} Duels won <b>${d.pvp}</b></span></div>
  <div class="card">${d.eq.map(e => `<div class="smrow"><span class="dim" style="width:90px">${esc(e.s)}</span><b style="color:${(RAR[e.r] || RAR[0]).c}">${esc(e.n)}</b> <span class="dim">${(RAR[e.r] || RAR[0]).n}${e.p ? ' • power ' + fmt(e.p) : ''}</span></div>`).join('') || '<div class="dim">Nothing equipped.</div>'}</div>
  <span class="btn" onclick="closeMenu()">Close</span>`; };
// ---------- message handling ----------
{ const _nrM = netRecv; netRecv = function (c, m) { _nrM(c, m); if (!m || !m.t) return;
  if (m.t === 'wantfloor' && NET.host) { if (!G.inTown && netArea().startsWith('coop')) sendFloor(c); else send(c, { t: 'chatsys', text: 'Your leader is in Haven right now.' }); return; }
  if (m.t === 'chatsys' && !NET.host) { toast(`${ico('globe')} ${esc(m.text)}`, '#9ad0ff'); return; }
  if (!['gift', 'insp', 'inspr'].includes(m.t) || (m.to && m.to !== NET.id)) return; const from = cleanId(m.from);
  if (m.t === 'gift') { const it = giftClean(m.it); if (!it || !S) return; it.isNew = true; const toBag = S.inv.length < S.invMax; (toBag ? S.inv : S.stash).push(it); noteFound(it); sfx('legend'); const who = esc(String(m.name || pName(from)).slice(0, 18));
    banner('A gift!', `${who} sent you ${RAR[it.r].n} ${it.name}`, RAR[it.r].c); netPost(`${ico('gift')} <b>${who}</b> gave you <span style="color:${RAR[it.r].c}">${esc(it.name)}</span>${toBag ? '' : ' (sent to your stash)'}`); saveGame(); }
  if (m.t === 'insp' && S) duelSend(from, { t: 'inspr', d: inspData() });
  if (m.t === 'inspr' && m.d && typeof m.d === 'object') { const d = m.d, num = v => clamp(+v || 0, 0, 1e15); INSP = { name: pName(from), lvl: num(d.lvl), cls: String(d.cls || ''), dps: num(d.dps), life: num(d.life), atlas: num(d.atlas), abyss: num(d.abyss), arena: num(d.arena), pvp: num(d.pvp),
    eq: (Array.isArray(d.eq) ? d.eq.slice(0, 10) : []).map(e => ({ n: String(e && e.n || '').slice(0, 60), r: clamp((e && e.r) | 0, 0, RAR.length - 1), s: String(e && e.s || '').slice(0, 20), p: num(e && e.p) })) }; openMenu('insp'); } }; }
// ---------- chat commands ----------
const CMD_HELP = '/duel name • /gift name • /inspect name • /join • /who • /roll [max] • /help';
{ const _ncM = netChat; netChat = function (text) { text = String(text || '').trim(); if (!text.startsWith('/')) return _ncM(text); const [cmd, ...rest] = text.slice(1).split(/\s+/), arg = rest.join(' '), say = t => chatAdd ? chatAdd(`<span class="dim">${t}</span>`) : toast(t);
  const need = () => { const p = findPlayer(arg); if (!p) say(arg ? `No player called "${esc(arg)}" in the room` : 'Who? Add a name, for example /duel Mira'); return p; };
  switch ((cmd || '').toLowerCase()) {
    case 'duel': { const p = need(); if (p) askDuel(p.id); break; }
    case 'gift': case 'give': { const p = need(); if (p) giftOpen(p.id); break; }
    case 'inspect': case 'look': { const p = need(); if (p) inspAsk(p.id); break; }
    case 'join': joinLeader(); break;
    case 'who': say(`${ico('globe')} ${[netName() + ' (you)', ...[...NET.players.values()].map(p => `${esc(p.name)} Lv ${p.lvl}`)].join(' • ')}`); break;
    case 'roll': { const mx = clamp(parseInt(arg) || 100, 2, 1000000); _ncM(`🎲 rolled ${1 + Math.floor(Math.random() * mx)} (1–${mx})`); break; }
    default: say(CMD_HELP);
  } }; }
// ---------- party frames: quick buttons for every other player ----------
{ const _uhM = updateHUD; updateHUD = function (dt) { _uhM(dt); if (typeof PF === 'undefined') return; if (PF.style.display === '') PF.style.display = 'block'; // 7f set '' which fell back to the stylesheet's display:none, so party frames never showed
  if (PF.style.display === 'none' || PF.querySelector('.pfa')) return; const rows = [...PF.querySelectorAll('.pfr')].filter(r => !r.classList.contains('me')), ps = [...NET.players.values()];
  rows.forEach((r, i) => { const p = ps[i]; if (!p) return; const id = cleanId(p.id), n = r.querySelector('.pfn'); if (!n) return; const a = document.createElement('span'); a.className = 'pfa';
    a.innerHTML = `${!G.duel && p.area !== 'duel' ? `<span class="pfab" onclick="askDuel('${id}')" title="Challenge to a duel">${ico('swords')}</span>` : ''}<span class="pfab" onclick="giftOpen('${id}')" title="Send a gift">${ico('gift')}</span><span class="pfab" onclick="inspAsk('${id}')" title="Inspect gear">${ico('eye')}</span>`; n.appendChild(a); });
  if (!NET.host && !NET.coopGuest && !PF.querySelector('.pfjoin')) { const j = document.createElement('div'); j.className = 'pfjoin'; j.innerHTML = `<span onclick="joinLeader()">${ico('compass')} Join my leader</span>`; PF.appendChild(j); } }; }
// ---------- Multiplayer menu: records and actions ----------
{ const _mpM = MENUS.mp; MENUS.mp = () => { let h = _mpM(); if (!netOn()) return h;
  for (const p of NET.players.values()) { const id = cleanId(p.id), r = duelRec(p.name), btn = `<span class="btn" onclick="askDuel('${id}')">${ico('swords')} Duel</span>`;
    h = h.replace(btn, `${r[0] + r[1] ? `<span class="dim" title="Your duel record against them">${r[0]}–${r[1]}</span> ` : ''}${btn}<span class="btn" onclick="giftOpen('${id}')">${ico('gift')}</span><span class="btn" onclick="inspAsk('${id}')">${ico('eye')}</span>`); }
  const extra = `<div class="card"><b>${ico('chat')} Chat commands</b> <span class="dim">${CMD_HELP}</span>${!NET.host && !NET.coopGuest ? ` <span class="btn" onclick="joinLeader()">${ico('compass')} Join my leader's floor</span>` : ''}</div>`;
  return h.replace('<div class="card"><b>' + ico('chat') + ' Chat</b>', extra + '<div class="card"><b>' + ico('chat') + ' Chat</b>'); }; }
// keep the wiki honest
for (const e of WIKI_TXT.world) if (e[0] === 'Multiplayer') e[1] = e[1].replace('PvP: the host can start a duel (first to 3, reduced damage).', 'PvP: ANY player can challenge any other (party frames, the Multiplayer menu or /duel name) — first to 3, reduced damage, with a head-to-head record and rematches. Guests who are off adventuring are asked before joining the leader; /join catches up later. Send items with /gift name, check gear with /inspect name.');
{ const st = document.createElement('style'); st.textContent = `
#mpprompt{display:none;position:fixed;left:50%;top:92px;transform:translateX(-50%);z-index:40;min-width:320px;max-width:460px;padding:10px 14px 8px;border-radius:12px;background:rgba(21,17,27,.96);border:1px solid rgba(214,168,82,.55);box-shadow:0 8px 30px rgba(0,0,0,.6);font:14px var(--f-body,'Trebuchet MS'),sans-serif;color:#ece0c8;text-align:center}
#mpprompt .mppb{display:flex;gap:8px;justify-content:center;margin-top:8px}#mpprompt kbd{font:700 10px var(--f-num,'Trebuchet MS');padding:0 4px;border-radius:3px;background:rgba(0,0,0,.4);border:1px solid rgba(214,168,82,.4);margin-left:4px}
#mpprompt .mppbar{height:3px;margin-top:8px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}#mpprompt .mppbar i{display:block;height:100%;background:#ffd27a}
#partyf .pfa{pointer-events:auto;margin-left:auto;display:inline-flex;gap:3px}#partyf .pfa .pfab{cursor:pointer;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:5px;background:rgba(0,0,0,.35);border:1px solid rgba(214,168,82,.3);font-style:normal}#partyf .pfa .pfab:hover{background:rgba(214,168,82,.25)}
#partyf .pfn{display:flex;align-items:center;gap:4px}#partyf .pfjoin{pointer-events:auto;margin-top:4px}#partyf .pfjoin span{cursor:pointer;font-size:11.5px;color:#9ad0ff;padding:2px 8px;border-radius:7px;background:rgba(122,170,255,.12);border:1px solid rgba(122,170,255,.35)}
.giftg{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}.giftc{cursor:pointer;width:52px!important;height:52px!important}`; document.head.appendChild(st); }
