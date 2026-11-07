// ================= MULTIPLAYER 2: fair progression, party frames, revive, pings, better chat, safety =================
const PARTY = { prog: new Map(), rev: {}, marks: [], sayT: 0, unread: 0 };
const pid = v => String(v ?? '').replace(/[^\w-]/g, '').slice(0, 64);
const isNum = v => Number.isFinite(+v);
// ---------- 1. safety: never trust what peers send ----------
const ST_FIELDS = ['x', 'y', 'face', 'hp', 'mhp', 'lvl', 'name', 'cls', 'col', 'area', 'sw', 'dg', 'pose', 'yaw', 'py', 'fx', 'down', 'ms'];
function cleanSt(m) { const o = { t: 'st' }; for (const k of ST_FIELDS) if (m[k] !== undefined) o[k] = m[k];
  for (const k of ['x', 'y', 'face', 'hp', 'mhp', 'yaw', 'py', 'ms']) o[k] = isNum(o[k]) ? +o[k] : 0;
  o.lvl = Math.max(1, Math.min(999, o.lvl | 0)); o.cls = typeof o.cls === 'string' && Object.prototype.hasOwnProperty.call(CLS, o.cls) ? o.cls : 'warrior';
  o.name = String(o.name || 'Kindled').replace(/[<>&"]/g, '').slice(0, 18); o.col = /^#[0-9a-f]{3,8}$/i.test(o.col || '') ? o.col : '#d8643c';
  o.area = String(o.area || 'solo').replace(/[^\w:-]/g, '').slice(0, 24); o.sw = o.sw ? 1 : 0; o.dg = o.dg ? 1 : 0; o.down = o.down ? 1 : 0; o.id = pid(m.id); return o; }
{ const _nrQ = netRecv; netRecv = function (c, m) {
  if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
  // on the host, a direct connection can only speak for itself
  if (NET.host && c && c.peer && ['st', 'look', 'bye', 'chat', 'prog', 'mark', 'revive', 'cantjoin', 'say'].includes(m.t)) m.id = c.peer;
  if (m.t === 'st') m = cleanSt(m);
  if (m.t === 'look' && NET.lookWait && NET.lookWait.size > 24) NET.lookWait.clear();
  switch (m.t) {
    case 'png': send(c, { t: 'pong', ts: +m.ts || 0 }); return;
    case 'pong': if (isNum(m.ts)) { const rtt = Math.max(0, Math.min(9999, performance.now() - m.ts)); if (NET.host) { const p = NET.players.get(c.peer); if (p) p.rtt = rtt; } else NET.rtt = rtt; } return;
    case 'prog': { const id = pid(m.id), d = Array.isArray(m.done) ? m.done.slice(0, 4).map(a => Array.isArray(a) ? a.slice(0, NREG).map(Boolean) : []) : []; PARTY.prog.set(id, { lvl: Math.max(1, m.lvl | 0), maxDiff: Math.max(0, Math.min(3, m.maxDiff | 0)), done: d }); if (NET.host) bcast(m, c.peer); if (G.menu === 'portal' || G.menu === 'mp') renderMenu(); return; }
    case 'cantjoin': { if (NET.host) { const p = NET.players.get(pid(m.id)); toast(`${ico('globe')} <b>${esc(p ? p.name : 'A friend')}</b> can't join this floor — ${esc(String(m.why || '').slice(0, 80))}`, '#ffb07a'); } return; }
    case 'mark': { if (NET.host) bcast(m, c.peer); addMark(m); return; }
    case 'revive': { if (NET.host && pid(m.to) !== NET.id) { const tc = NET.conns.get(pid(m.to)); if (tc) send(tc, m); else bcast(m, c.peer); return; } if (pid(m.to) === NET.id && P.down > 0) { revived((NET.players.get(pid(m.from)) || {}).name); } return; }
    case 'kick': if (!NET.host && c.peer && c.peer.startsWith(PEER_PREFIX)) { toast(`${ico('globe')} The host removed you from the room`, '#ff8a8a'); setTimeout(netLeave, 50); } return;
  }
  _nrQ(c, m);
  if (m.t === 'chat') { const p = NET.players.get(pid(m.id)); if (p) { p.say = String(m.text || '').slice(0, 80); p.sayT = 5; } if (!CHAT.open) { PARTY.unread++; sfx('click'); } }
  if (m.t === 'hello') sendProg(true);
}; }
// ---------- 2. fair progression: you can only join floors you've earned ----------
function myProg() { return { t: 'prog', id: NET.id, lvl: S.lvl, maxDiff: S.maxDiff || 0, done: S.done.map(a => a.map(Boolean)) }; }
let progT = 0; function sendProg(now) { if (NET.status !== 'host' && NET.status !== 'guest' || !S) return; if (!now && (progT -= .5) > 0) return; progT = 10; const m = myProg(); if (NET.host) bcast(m); else toHost(m); }
function canJoin(pr, region, diff, abyss) {   // pr = {lvl, maxDiff, done}
  if (diff > (pr.maxDiff || 0)) return `${DIFF[diff]} is not unlocked yet`;
  if (abyss) return pr.done[diff] && pr.done[diff][NREG - 1] ? '' : `the Abyss needs ${BOSS[REG[NREG - 1].boss].n.split(',')[0]} beaten on ${DIFF[diff]}`;
  const need = reqLvl(region, diff); if (pr.lvl < need) return `needs level ${need} (is ${pr.lvl})`;
  if (region > 0 && !(pr.done[diff] && pr.done[diff][region - 1])) return `${REG[region].n} is not unlocked yet`;
  return '';
}
{ const _rfQ = recvFloor; recvFloor = function (m) {
  const R = m && m.R; if (!R) return;
  const why = canJoin({ lvl: S.lvl, maxDiff: S.maxDiff || 0, done: S.done }, R.region | 0, R.diff | 0, !!R.abyss);
  if (why) { if (NET.lastNo !== m.area) { NET.lastNo = m.area; toast(`${ico('globe')} Your party went to <b>${R.abyss ? 'the Abyss' : REG[R.region | 0].n}</b> on ${DIFF[R.diff | 0]} — you can't join: ${why}. Keep playing; you'll join when they're somewhere you've unlocked.`, '#ffb07a'); toHost({ t: 'cantjoin', id: NET.id, why }); } NET.pendingFloor = null; return; }
  const home = S.diff; _rfQ(m); if (NET.coopGuest) { NET.homeDiff = home; S.diff = R.diff | 0; NET.lastNo = null; } };
}
{ const _gtQ = goTown; goTown = function () { if (NET.homeDiff !== undefined && NET.homeDiff !== null) { S.diff = NET.homeDiff; NET.homeDiff = null; } _gtQ(); }; }
// host: the Waystone shows who can follow you where
function partyLine(region, diff, abyss) { const out = []; for (const [id, p] of NET.players) { const pr = PARTY.prog.get(id); if (!pr) continue; const why = canJoin(pr, region, diff, abyss); out.push(`<span style="color:${why ? '#ff9a7a' : '#7aff7a'}">${why ? '✖' : '✔'} ${esc(p.name)}</span>`); } return out.join(' '); }
{ const _ptQ = MENUS.portal; MENUS.portal = () => { let h = _ptQ(); if (!NET.host || !NET.players.size) return h;
  let reg = 0; h = h.replace(/(<b[^>]*>)(\d+)\. ([^<]+)(<\/b>)/g, (all, a, n, name, b) => { const r = (+n) - 1; if (!REG[r] || REG[r].n !== name.replace(/<[^>]*>/g, '').trim().replace(/ ★ Next$/, '')) return all; reg++; const pl = partyLine(r, S.diff, false); return pl ? all + ` <span class="dim" style="font-size:11px">${pl}</span>` : all; });
  const box = `<div class="card" style="border-color:#5a8ac0"><b>${ico('globe')} Party</b> <span class="dim">Friends can only follow you to floors they have unlocked themselves (level, region and difficulty). ✔ = can join here, ✖ = stays where they are.</span></div>`;
  const i = h.indexOf('</h2>'); return i < 0 ? h : h.slice(0, i + 5) + box + h.slice(i + 5); }; }
// ---------- 3. party bonus: playing together pays ----------
function partyHere() { const a = netArea(); if (!a.startsWith('coop')) return 0; let n = 0; for (const p of NET.players.values()) if (p.area === a) n++; return n; }
{ const _xsQ = extraStats; extraStats = function (s) { _xsQ(s); if (typeof NET === 'undefined' || NET.status === 'off') return; const n = Math.min(3, partyHere()); if (n) { s.xp += 10 * n; s.gold += 10 * n; s.luck += 5 * n; } }; }
let partyN = -1;
// ---------- 4. downed & revive (co-op) ----------
function alliesUp() { const a = netArea(); for (const p of NET.players.values()) if (p.area === a && p.hp > 0 && !p.down) return true; return false; }
{ const _dieQ = die; die = function () { if (!G.duel && !G.arena && netArea().startsWith('coop') && alliesUp() && !(P.down > 0) && !P.downUsed) { P.down = 20; P.hp = 1; P.inv = 99; banner('Downed!', 'An ally can revive you — stand still', '#ff8a6a'); sfx('hurt'); return; } P.down = 0; _dieQ(); }; }
function revived(by) { P.down = 0; P.hp = Math.max(1, ST.maxHp * .4); P.inv = 2; P.downUsed = false; banner('Revived!', by ? `${esc(by)} pulled you back up` : 'Back on your feet', '#7aff7a'); sfx('legend'); burst(P.x, P.y, '#7aff7a', 30, 180, .8, 3, 1); }
{ const _upQ = updPlayer; updPlayer = function (dt) { if (P.down > 0) { P.down -= dt; P.hp = 1; P.inv = 99; mouse.down = false; if (P.down <= 0 || !alliesUp()) { P.down = 0; P.inv = 0; P.downUsed = true; P.hp = 0; die(); P.downUsed = false; } return; } _upQ(dt); }; }
{ const _hpQ = hurtPlayer; hurtPlayer = function (a, s) { if (P.down > 0) return; return _hpQ(a, s); }; }
{ const _rlQ = resetLevel; resetLevel = function () { _rlQ(); if (P) { P.down = 0; P.downUsed = false; } PARTY.rev = {}; PARTY.marks = []; }; }
{ const _uQ = update; update = function (dt) { _uQ(dt); if (NET.status !== 'host' && NET.status !== 'guest' || !S || !P) return;
  sendProg(false);
  if ((NET.pingT = (NET.pingT || 0) - dt) <= 0) { NET.pingT = 3; const m = { t: 'png', ts: performance.now() }; if (NET.host) bcast(m); else toHost(m); }
  // revive friends by standing next to them
  if (G.mode === 'play' && !G.menu && !(P.down > 0)) { const a = netArea(); for (const [id, p] of NET.players) { if (!p.down || p.area !== a) { delete PARTY.rev[id]; continue; } if (Math.hypot(p.rx - P.x, p.ry - P.y) < 60) { PARTY.rev[id] = (PARTY.rev[id] || 0) + dt; if (PARTY.rev[id] >= 2.5) { PARTY.rev[id] = 0; const m = { t: 'revive', to: id, from: NET.id }; if (NET.host) { const c = NET.conns.get(id); if (c) send(c, m); else bcast(m); } else toHost(m); toast(`${ico('heart')} You revived <b>${esc(p.name)}</b>!`, '#7aff7a'); S.stats.revives = (S.stats.revives || 0) + 1; } } else delete PARTY.rev[id]; } }
  for (const p of NET.players.values()) if (p.sayT > 0) p.sayT -= dt; if (PARTY.sayT > 0) PARTY.sayT -= dt;
  PARTY.marks = PARTY.marks.filter(k => (k.t -= dt) > 0);
  const n = partyHere(); if (n !== partyN) { partyN = n; calcStats(); if (n) toast(`${ico('globe')} Party bonus: +${10 * Math.min(3, n)}% XP & gold, +${5 * Math.min(3, n)}% magic find`, '#9ad0ff'); }
}; }
{ const _msQ = myState; myState = function () { const s = _msQ(); s.down = P.down > 0 ? 1 : 0; if (s.down) s.hp = 0; s.ms = NET.host ? 0 : Math.round(NET.rtt || 0); return s; }; }
// ---------- 5. pings: Alt+Click marks a spot for everyone ----------
const MARK_COL = '#5ad0ff';
function addMark(m) { if (!isNum(m.x) || !isNum(m.y)) return; const area = String(m.area || ''); if (area !== netArea()) return; const p = NET.players.get(pid(m.id)); PARTY.marks.push({ x: +m.x, y: +m.y, t: 6, who: m.id === NET.id ? 'You' : (p ? p.name : 'Ally') }); if (PARTY.marks.length > 12) PARTY.marks.shift(); ringFx(+m.x, +m.y, 60, MARK_COL, .6); sfx('shrine'); }
cv.addEventListener('mousedown', e => { if (!e.altKey || e.button !== 0 || NET.status === 'off' || !S || G.mode !== 'play' || G.menu) return; e.stopImmediatePropagation(); mouse.down = false; const W = mouseWorld(); const m = { t: 'mark', id: NET.id, x: Math.round(W.x), y: Math.round(W.y), area: netArea() }; addMark(m); if (NET.host) bcast(m); else toHost(m); }, true);
// ---------- 6. drawing: speech bubbles, downed markers, revive rings, pings ----------
{ const _doQ = drawOverlay; drawOverlay = function () { _doQ(); if (NET.status === 'off' || !R3 || !S || G.mode === 'title') return; const area = netArea();
  const bubble = (x, y, z, txt) => { const s = proj(x, y, z); if (!s.vis) return; X.font = '13px "Trebuchet MS",sans-serif'; const w = Math.min(260, X.measureText(txt).width + 18), bx = s.x - w / 2, by = s.y - 26;
    X.fillStyle = 'rgba(14,11,22,.9)'; X.strokeStyle = 'rgba(154,208,255,.8)'; X.lineWidth = 1.5; X.beginPath(); X.roundRect ? X.roundRect(bx, by, w, 22, 9) : X.rect(bx, by, w, 22); X.fill(); X.stroke();
    X.beginPath(); X.moveTo(s.x - 6, by + 22); X.lineTo(s.x, by + 29); X.lineTo(s.x + 6, by + 22); X.fill(); X.fillStyle = '#ece0c8'; X.textAlign = 'center'; X.fillText(txt.length > 34 ? txt.slice(0, 33) + '…' : txt, s.x, by + 15); };
  for (const [id, p] of NET.players) { if (p.area !== area || area === 'solo') continue;
    if (p.sayT > 0 && p.say) bubble(p.rx, p.ry, 2.1, p.say);
    if (p.down) { const s = proj(p.rx, p.ry, .3); if (s.vis) { X.textAlign = 'center'; X.font = 'bold 13px "Trebuchet MS",sans-serif'; X.lineWidth = 3; X.strokeStyle = '#000'; const t = PARTY.rev[id] ? `Reviving… ${Math.round(PARTY.rev[id] / 2.5 * 100)}%` : 'DOWNED — stand next to them to revive'; X.strokeText(t, s.x, s.y + 22); X.fillStyle = '#ff9a7a'; X.fillText(t, s.x, s.y + 22);
      if (PARTY.rev[id]) { X.beginPath(); X.strokeStyle = '#7aff7a'; X.lineWidth = 4; X.arc(s.x, s.y, 22, -Math.PI / 2, -Math.PI / 2 + PARTY.rev[id] / 2.5 * 6.283); X.stroke(); } } } }
  if (PARTY.sayT > 0 && PARTY.say && P) bubble(P.x, P.y, 2.1, PARTY.say);
  for (const k of PARTY.marks) { const s = proj(k.x, k.y, .2), m = 46; const on = s.vis && s.x > m && s.x < VW - m && s.y > m && s.y < VH - m;
    if (on) { X.textAlign = 'center'; X.font = 'bold 22px sans-serif'; X.lineWidth = 4; X.strokeStyle = '#000'; const by = s.y - 30 + Math.sin(G.t * 6) * 4; X.strokeText('▼', s.x, by); X.fillStyle = MARK_COL; X.fillText('▼', s.x, by); X.font = 'bold 11px "Trebuchet MS",sans-serif'; X.lineWidth = 3; X.strokeText(k.who, s.x, by - 18); X.fillText(k.who, s.x, by - 18); }
    else { const cx = VW / 2, cy = VH / 2, a = Math.atan2(s.y - cy, s.x - cx) + (s.vis ? 0 : Math.PI), r = Math.min(VW, VH) / 2 - 60; X.save(); X.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); X.rotate(a); X.fillStyle = MARK_COL; X.strokeStyle = '#000'; X.lineWidth = 2; X.beginPath(); X.moveTo(14, 0); X.lineTo(-7, -9); X.lineTo(-2, 0); X.lineTo(-7, 9); X.closePath(); X.stroke(); X.fill(); X.restore(); } }
  if (P.down > 0) { X.textAlign = 'center'; X.font = 'bold 26px Georgia,serif'; X.lineWidth = 5; X.strokeStyle = '#000'; const t = `DOWNED — ${Math.ceil(P.down)}s`; X.strokeText(t, VW / 2, VH * .32); X.fillStyle = '#ff7a5a'; X.fillText(t, VW / 2, VH * .32); X.font = '14px "Trebuchet MS",sans-serif'; X.lineWidth = 3; X.strokeText('An ally can revive you by standing next to you', VW / 2, VH * .32 + 24); X.fillStyle = '#ece0c8'; X.fillText('An ally can revive you by standing next to you', VW / 2, VH * .32 + 24); }
}; }
// ---------- 7. party frames ----------
// Your ping, shown faintly in the top-right corner (styled like the credit line).
// Everything is measured to the host: a guest shows its round trip to the host; the host shows
// its slowest guest's round trip. Nothing is shown until the first measurement (~3 s after joining).
const PINGEL = document.createElement('div'); PINGEL.id = 'myping';
PINGEL.style.cssText = 'position:fixed;right:12px;top:1px;z-index:11;font:italic 11px Trebuchet MS,Segoe UI,sans-serif;color:rgba(232,220,192,.45);font-variant-numeric:tabular-nums;text-shadow:0 1px 2px #000;pointer-events:none;letter-spacing:.5px;display:none';
document.body.appendChild(PINGEL);
function myPing() {
  if (!NET.host) return NET.rtt;
  let w = null; for (const p of NET.players.values()) if (p.rtt != null && isNum(p.rtt)) w = Math.max(w ?? 0, p.rtt);
  return w;
}
function pingText(ms) { if (ms == null || !isNum(ms)) return ''; const v = Math.round(ms); return 'Ping ' + (v < 1 ? '<1' : v) + ' ms'; }
const PF = document.createElement('div'); PF.id = 'partyf'; document.body.appendChild(PF); let pfKey = '';
{ const _uhQ = updateHUD; updateHUD = function (dt) { _uhQ(dt); const on = (NET.status === 'host' || NET.status === 'guest') && S && G.mode !== 'title' && !G.hideHud;
  const pt = on ? pingText(myPing()) : ''; PINGEL.style.display = pt ? '' : 'none'; if (PINGEL.textContent !== pt) PINGEL.textContent = pt;
  PF.style.display = on ? '' : 'none'; if (!on) return; const area = netArea(), rows = [];
  const row = (name, lvl, hp, mhp, where, down, ms, me, col) => { const f = Math.max(0, Math.min(1, hp / (mhp || 1))); return `<div class="pfr${me ? ' me' : ''}${down ? ' dn' : ''}"><div class="pfn"><b style="color:${col}">${esc(name)}</b> <span>Lv ${lvl}</span>${ms}</div><div class="pfb"><div style="width:${(down ? 0 : f) * 100}%"></div></div><div class="pfw">${down ? 'DOWNED' : where}</div></div>`; };
  rows.push(row(netName() + ' (you)', S.lvl, P.down > 0 ? 0 : P.hp, ST.maxHp, area.startsWith('coop') ? 'party floor' : G.inTown ? 'Haven' : G.duel ? 'duel' : 'adventuring', P.down > 0, '', 1, (S.cos && S.cos.color) || CLS[S.cls].col));
  for (const p of NET.players.values()) rows.push(row(p.name, p.lvl, p.hp, p.mhp, p.area === area && area !== 'solo' ? 'with you' : p.area === 'town' ? 'Haven' : p.area === 'duel' ? 'duel' : String(p.area).startsWith('coop') ? 'party floor' : 'adventuring', p.down, '', 0, p.col));
  const n = Math.min(3, partyHere()), h = `<div class="pfh">${ico('globe')} Room <b>${esc(NET.code)}</b> <span>${NET.players.size + 1}/${NET_MAX}</span></div>${rows.join('')}${n ? `<div class="pfbonus">Party bonus +${10 * n}% XP & gold</div>` : ''}<div class="pfk">Enter / chat • Alt+Click ping</div>`;
  if (h !== pfKey) { pfKey = h; PF.innerHTML = h; } }; }
// ---------- 8. better chat ----------
const QUICK = ['Help!', 'Follow me', 'Wait for me', 'Ready', 'Heading to Haven', 'Nice!', 'Thanks!', 'Careful — elite!'];
function quickSay(t) { netChat(t); chatClose(); }
{ const _ncQ = netChat; netChat = function (text) { text = String(text || '').trim(); if (!text) return; _ncQ(text); PARTY.say = text.slice(0, 80); PARTY.sayT = 5; }; }
{ const _cbQ = chatBuild; chatBuild = function () { const first = !CHAT.el; _cbQ(); if (!first) return;
  const hd = document.createElement('div'); hd.id = 'chathead'; hd.innerHTML = `${ico('chat')} <b>Party chat</b> <span class="ck">Enter to talk</span><span id="chatunread"></span>`; CHAT.el.insertBefore(hd, CHAT.el.firstChild);
  const q = document.createElement('div'); q.id = 'chatquick'; q.innerHTML = QUICK.map(t => `<span onmousedown="event.preventDefault();quickSay('${t.replace(/'/g, "\\'")}')">${t}</span>`).join(''); CHAT.el.appendChild(q); }; }
chatAdd = function (html, cls) { chatBuild(); const d = document.createElement('div'); d.innerHTML = html; if (cls) d.className = cls; CHAT.log.appendChild(d); while (CHAT.log.children.length > 60) CHAT.log.firstChild.remove();
  setTimeout(() => d.classList.add('fade'), 14000); setTimeout(() => { d.classList.add('old'); chatFit(); }, 60000); CHAT.log.scrollTop = CHAT.log.scrollHeight; chatFit(); };
{ const _coQ = chatOpen; chatOpen = function () { _coQ(); PARTY.unread = 0; }; }
{ const _uC2 = update; update = function (dt) { _uC2(dt); const u = document.getElementById('chatunread'); if (u) { const t = PARTY.unread ? ` ${PARTY.unread} new` : ''; if (u.textContent !== t) u.textContent = t; } }; }
addEventListener('keydown', e => { if (e.key !== 'Enter' || e.repeat) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; if (!S || G.mode !== 'play' || G.menu || !chatOnline() || CHAT.open) return; e.preventDefault(); e.stopImmediatePropagation(); chatOpen(); }, true);
// multiplayer menu: someone chatting no longer wipes what you are typing
{ const _rmQ = renderMenu; renderMenu = function () { const i = document.getElementById('mpmsg'), v = i ? i.value : null, f = i && document.activeElement === i, ss = i ? i.selectionStart : 0; _rmQ(); if (v !== null) { const j = document.getElementById('mpmsg'); if (j) { j.value = v; if (f) { j.focus(); try { j.setSelectionRange(ss, ss); } catch (e) { } } } } }; }
// ---------- 9. host tools: kick ----------
function kickPlayer(id) { id = pid(id); const c = NET.conns.get(id); if (!c) return; send(c, { t: 'kick' }); setTimeout(() => { try { c.close(); } catch (e) { } }, 200); toast(`${ico('globe')} Removed ${esc((NET.players.get(id) || {}).name || 'player')}`, '#9ab0d0'); }
{ const _mpQ = MENUS.mp; MENUS.mp = () => { let h = _mpQ(); if (NET.host) h = h.replace(/<span class="btn" onclick="askDuel\('([\w-]+)'\)">([^<]*)<\/span>/g, (all, id) => all + ` <span class="btn" style="font-size:12px" onclick="kickPlayer('${id}')">Kick</span>`);
  const rows = [...NET.players].map(([id, p]) => { const pr = PARTY.prog.get(id); return pr ? `<div class="dim" style="font-size:12px">${esc(p.name)}: level ${pr.lvl}, up to ${DIFF[pr.maxDiff]}, ${pr.done[0] ? pr.done[0].filter(Boolean).length : 0}/12 guardians on Normal</div>` : ''; }).join('');
  const tips = `<div class="card"><b>Tips</b><div class="dim" style="font-size:12.5px">Press <b>Enter</b> to chat from anywhere (quick messages included) • <b>Alt+Click</b> to ping a spot for everyone • If a friend is downed, stand next to them to revive • Friends only join floors they've unlocked themselves • Playing together gives a party bonus.</div>${rows}</div>`;
  return h.replace('<span class="btn" onclick="netLeave()">', tips + '<span class="btn" onclick="netLeave()">'); }; }
// ---------- styles ----------
const mp2Style = document.createElement('style'); mp2Style.textContent = `
#partyf{position:fixed;left:14px;top:50%;transform:translateY(-50%);z-index:6;width:200px;display:none;pointer-events:none;font:12px 'Trebuchet MS',sans-serif;color:#ece0c8}
#partyf .pfh{font-size:11px;color:#9ad0ff;margin-bottom:4px;text-shadow:0 1px 2px #000}#partyf .pfh span{opacity:.75;margin-left:4px}
#partyf .pfr{background:rgba(12,10,20,.82);border:1px solid rgba(122,170,255,.35);border-radius:10px;padding:5px 8px;margin-bottom:4px;box-shadow:0 3px 10px rgba(0,0,0,.4)}
#partyf .pfr.me{border-color:rgba(214,168,82,.5)}#partyf .pfr.dn{border-color:#ff7a5a;animation:fxPulse 1s infinite}
#partyf .pfn{display:flex;gap:5px;align-items:baseline;white-space:nowrap;overflow:hidden}#partyf .pfn span{color:#a39884;font-size:11px}#partyf .pfn i{margin-left:auto;font-style:normal;font-size:10px;color:#7aff7a}#partyf .pfn i.mid{color:#ffd27a}#partyf .pfn i.bad{color:#ff7a5a}
#partyf .pfb{height:6px;border-radius:6px;background:rgba(0,0,0,.5);overflow:hidden;margin:3px 0 2px}#partyf .pfb div{height:100%;background:linear-gradient(90deg,#3ab04a,#7aff7a);border-radius:6px}
#partyf .pfr.dn .pfb div{background:#ff5a4a}#partyf .pfw{font-size:10px;color:#a39884;text-transform:uppercase;letter-spacing:.6px}
#partyf .pfbonus{font-size:11px;color:#7aff7a;margin:2px 0}#partyf .pfk{font-size:10px;color:#8a8070;margin-top:2px}
#chatbox{bottom:150px!important;width:min(400px,calc(100vw - 100px))!important;font-size:13.5px!important}
#chathead{align-self:flex-start;font-size:11.5px;color:#9ad0ff;background:rgba(10,8,16,.7);border:1px solid rgba(122,170,255,.35);border-radius:9px;padding:2px 9px;text-shadow:0 1px 2px #000}
#chathead .ck{color:#8a8070;margin-left:6px}#chatunread{margin-left:6px;color:#1a1008;background:#ffd27a;border-radius:9px;padding:0 6px;font-weight:bold}#chatunread:empty{display:none}
#chatbox:not(.open) #chatlog div.fade{opacity:.55!important}
#chatlog div{background:rgba(10,8,16,.72)!important;border-left:3px solid rgba(122,170,255,.55)}
#chatquick{display:none;flex-wrap:wrap;gap:4px}#chatbox.open #chatquick{display:flex}
#chatquick span{cursor:pointer;font-size:12px;padding:3px 9px;border-radius:12px;background:rgba(20,16,30,.92);border:1px solid rgba(122,170,255,.45);color:#cfe0f8}#chatquick span:hover{border-color:#9ad0ff;color:#fff}`;
document.head.appendChild(mp2Style);
WIKI_TXT.world.push(['Multiplayer: Fair Play & Party', 'Friends can only follow the host to floors they have unlocked themselves — the right level, the previous region beaten and the difficulty unlocked; otherwise they keep playing where they are. The Waystone shows the host ✔/✖ for each friend. Playing on the same floor gives a party bonus of +10% XP & gold and +5% magic find per ally (up to 3). If you fall while an ally is up, you are Downed for 20s — an ally standing next to you for 2.5s revives you. Press Enter to chat (with quick messages), Alt+Click to ping a spot. Party frames on the left show everyone\'s life, location and connection.']);
ACH.push({ id: 'revive5', n: 'Lifeline', d: 'Revive 5 downed allies', c: () => S.stats.revives || 0, need: 5, sp: 1 });
