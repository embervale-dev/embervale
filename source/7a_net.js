// ================= ONLINE MULTIPLAYER (peer-to-peer via WebRTC; PeerJS only helps players find each other) =================
// Lobby with room codes • see friends in Haven • chat • co-op PvE (host's floor is shared) • PvP duels (first to 3)
const NET = { peer: null, host: false, code: '', id: '', conns: new Map(), players: new Map(), status: 'off', err: '', coopGuest: false, area: '', nid: 0, chat: [], duel: null, lastSend: 0, lastEns: 0, swapTo: null };
const PVP_SCALE = .3, NET_MAX = 4, PEER_PREFIX = 'embervale-dev-';
// our own TURN relay (coturn on the VPS): 'turns' on 443 gets through networks that block UDP (e.g. school wifi). PeerJS's public relay stays as a fallback.
const NET_ICE = { iceServers: [
  { urls: 'stun:turn.neonxsl.dev:3478' },
  { urls: ['turns:turn.neonxsl.dev:443?transport=tcp', 'turn:turn.neonxsl.dev:3478?transport=udp', 'turn:turn.neonxsl.dev:3478?transport=tcp'], username: 'embervale', credential: '640bed7b5eca1953d9f201c893e030ec' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
] };
// add ?relay=1 to the URL to force every connection through the relay (to test the school-wifi path from home)
if (/[?&]relay=1\b/.test(location.search)) NET_ICE.iceTransportPolicy = 'relay';
function netName() { return (S && S.netName) || (S && CLS[S.cls] ? `Kindled ${CLS[S.cls].n}` : 'Kindled'); }
function loadPeerJS() { return new Promise((res, rej) => { if (window.Peer) return res(); const s = document.createElement('script'); s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; s.onload = () => res(); s.onerror = () => rej(new Error('Could not load the multiplayer library — you need an internet connection.')); document.head.appendChild(s); }); }
function netArea() { if (!S || G.mode === 'title') return 'menu'; if (G.duel) return 'duel'; if (G.inTown) return 'town'; if (NET.host && NET.conns.size && !G.tutorial && !G.trial) return 'coop:' + G.levelId; if (NET.coopGuest) return NET.area; return 'solo'; }
let CHK = 0; const CHUNKS = new Map();
function send(conn, m) { try { if (!conn || !conn.open) return; const str = JSON.stringify(m); if (str.length < 12000) { conn.send(m); return; } const id = ++CHK + '_' + Math.random().toString(36).slice(2, 7), n = Math.ceil(str.length / 12000); for (let i = 0; i < n; i++) conn.send({ t: 'chunk', id, i, n, d: str.slice(i * 12000, (i + 1) * 12000) }); } catch (e) { console.warn('net send failed', m && m.t, e && e.message); } }
function recvChunk(c, m) { let b = CHUNKS.get(m.id); if (!b) { b = { n: m.n, parts: [], got: 0, t: Date.now() }; CHUNKS.set(m.id, b); } if (b.parts[m.i] === undefined) { b.parts[m.i] = m.d; b.got++; } if (b.got === b.n) { CHUNKS.delete(m.id); try { netRecv(c, JSON.parse(b.parts.join(''))); } catch (e) { console.warn('net chunk parse', e.message); } } for (const [k, v] of CHUNKS) if (Date.now() - v.t > 30000) CHUNKS.delete(k); }
function bcast(m, except) { for (const [id, c] of NET.conns) if (id !== except) send(c, m); }
function toHost(m) { const c = [...NET.conns.values()][0]; send(c, m); }
function netPost(text) { NET.chat.push(text); if (NET.chat.length > 40) NET.chat.shift(); if (G.menu === 'mp') renderMenu(); }
// ---------- hosting & joining ----------
function netTeardown() { try { NET.peer && NET.peer.destroy(); } catch (e) { } NET.peer = null; NET.conns.clear(); NET.players.clear(); if (NET.lookWait) NET.lookWait.clear(); if (typeof clearRemoteMeshes === 'function') clearRemoteMeshes(); }
async function netHost() { netTeardown(); try { NET.status = 'connecting'; renderMenu(); await loadPeerJS(); const code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
  const p = new Peer(PEER_PREFIX + code, { debug: 0, config: NET_ICE }); NET.peer = p; NET.host = true; NET.code = code;
  p.on('open', id => { NET.id = id; NET.status = 'host'; netPost(`${ico('globe')} Room <b>${code}</b> is open — share the code with friends`); sfx('shrine'); renderMenu(); });
  p.on('connection', c => { if (NET.conns.size >= NET_MAX - 1) { c.on('open', () => { send(c, { t: 'full' }); setTimeout(() => c.close(), 300); }); return; } wireConn(c); });
  p.on('error', e => netFail(e)); } catch (e) { netFail(e); } }
async function netJoin(code) { netTeardown(); code = String(code || '').trim().toUpperCase(); if (code.length < 4) { toast('Enter the room code your friend shared', '#ff8a8a'); return; }
  try { NET.status = 'connecting'; renderMenu(); await loadPeerJS(); const p = new Peer(undefined, { debug: 0, config: NET_ICE }); NET.peer = p; NET.host = false; NET.code = code;
    p.on('open', id => { NET.id = id; const c = p.connect(PEER_PREFIX + code, { reliable: true, serialization: 'json' }); wireConn(c); setTimeout(() => { if (NET.status === 'connecting') netFail(new Error('No room with that code (or the host is offline).')); }, 12000); });
    p.on('error', e => netFail(e)); } catch (e) { netFail(e); } }
function netFail(e) { NET.err = (e && (e.type === 'unavailable-id' ? 'That room code is taken — try again.' : e.type === 'peer-unavailable' ? 'No room with that code (or the host is offline).' : e.message)) || 'Connection failed'; NET.status = 'off'; try { NET.peer && NET.peer.destroy(); } catch (x) { } NET.peer = null; NET.conns.clear(); NET.players.clear(); if (G.menu === 'mp') renderMenu(); toast(ico('globe') + ' ' + NET.err, '#ff8a8a'); }
function netLeave() { bcast({ t: 'bye', id: NET.id }); try { NET.peer && NET.peer.destroy(); } catch (e) { } NET.peer = null; NET.conns.clear(); NET.players.clear(); NET.status = 'off'; NET.coopGuest = false; NET.host = false; if (G.duel) endDuel(null); clearRemoteMeshes(); toast(ico('globe') + ' Left the room', '#9ab0d0'); renderMenu(); }
function wireConn(c) {
  c.on('open', () => { NET.conns.set(c.peer, c); if (!NET.host) { NET.status = 'guest'; send(c, { t: 'hello', id: NET.id, name: netName() }); netPost(ico('globe') + ' Connected to the room'); sfx('shrine'); } renderMenu(); });
  c.on('data', m => netRecv(c, m));
  c.on('close', () => { if (G.duel && G.duel.opp === c.peer) endDuel(); NET.conns.delete(c.peer); const p = NET.players.get(c.peer); NET.players.delete(c.peer); if (p) netPost(`${ico('wave')} ${esc(p.name)} left`); if (NET.host) bcast({ t: 'bye', id: c.peer }); else if (c.peer.startsWith(PEER_PREFIX)) { netPost(ico('globe') + ' The host closed the room'); NET.status = 'off'; NET.coopGuest = false; if (G.duel) endDuel(null);  setTimeout(netTeardown, 0); } removeRemote(c.peer); renderMenu(); });
}
// ---------- messages ----------
function netRecv(c, m) {
  if (!m || !m.t) return;
  if (m.t === 'chunk') return recvChunk(c, m);
  if (NET.host && ['st', 'chat', 'bye'].includes(m.t)) bcast(m, c.peer);   // relay to everyone else
  if (DUEL_T.includes(m.t)) {   // duel messages: the host relays guest-to-guest ones and stamps the true sender
    if (NET.host) { m.from = c.peer; if (m.to && m.to !== NET.id) { send(NET.conns.get(m.to), m); return; } }
    else if (!c.peer.startsWith(PEER_PREFIX)) return;
    m.from = String(m.from || '').replace(/[^\w-]/g, '');
  }
  switch (m.t) {
    case 'full': netFail(new Error('That room is full (4 players).')); break;
    case 'hello': netPost(`${ico('wave')} <b>${esc(m.name)}</b> joined`); sfx('click'); if (NET.host && !G.inTown && netArea().startsWith('coop')) setTimeout(() => sendFloor(c), 400); break;
    case 'st': { m.col = /^#[0-9a-f]{3,8}$/i.test(m.col || '') ? m.col : '#d8643c'; m.lvl = Math.max(1, Math.min(999, m.lvl | 0)); m.id = String(m.id || '').replace(/[^\w-]/g, ''); m.name = String(m.name || 'Kindled').slice(0, 18); const isNew = !NET.players.has(m.id); const p = NET.players.get(m.id) || {}; Object.assign(p, m, { seen: performance.now() }); if (p.tx === undefined) { p.rx = m.x; p.ry = m.y; } p.tx = m.x; p.ty = m.y; NET.players.set(m.id, p); if (isNew && G.menu === 'mp') renderMenu(); break; }
    case 'chat': m.col = /^#[0-9a-f]{3,8}$/i.test(m.col || '') ? m.col : '#9ad0ff'; netPost(`<b style="color:${m.col}">${esc(m.name)}:</b> ${esc(m.text)}`); if (G.menu && G.menu !== 'mp') toast(`${ico('chat')} <b>${esc(m.name)}:</b> ${esc(m.text)}`, '#9ad0ff'); break;
    case 'bye': { const p = NET.players.get(m.id); if (p) netPost(`${ico('wave')} ${esc(p.name)} left`); NET.players.delete(m.id); removeRemote(m.id); if (G.duel && G.duel.opp === m.id) endDuel(); break; }
    case 'floor': if (!NET.host) recvFloor(m); break;
    case 'ens': if (NET.coopGuest && !G.inTown && m.area === NET.area) recvEns(m); break;
    case 'town': if (NET.coopGuest) { NET.coopGuest = false; toast(ico('globe') + ' The party returned to Haven', '#9ad0ff'); goTown(); } break;
    case 'hit': if (NET.host) { const e = G.ens.find(x => x.nid === m.nid && !x.dead); if (e) { NET.applying = 1; try { hurtEnemy(e, m.amt, { noProc: true, crit: m.crit, col: '#9ad0ff' }); } finally { NET.applying = 0; } } } break;
    case 'dmg': if (G.mode === 'play' && !G.inTown) hurtPlayer(m.amt, null); break;
    case 'duelreq': if (m.from && m.from !== NET.id) { if (G.mode !== 'play' || G.boss || G.duel || NET.duelReq || (G.menu && !['mp', 'pause'].includes(G.menu))) { duelSend(m.from, { t: 'duelno', reason: 'busy' }); break; } NET.duelReq = m; openMenu('duelask'); } break;
    case 'duelok': if (NET.pendingDuel && NET.pendingDuel === m.from) { NET.pendingDuel = null; if (NET.host) bcast({ t: 'town' }, m.from); startDuel(m.from, 0); } break;
    case 'duelno': if (NET.pendingDuel && NET.pendingDuel === m.from) { NET.pendingDuel = null; toast(`${ico('globe')} ${m.reason === 'busy' ? 'They are busy right now' : 'Duel declined'}`, '#9ab0d0'); } break;
    case 'duel': if (!NET.host && c.peer.startsWith(PEER_PREFIX)) startDuel(m.from, 1); break;
    case 'pvp': if (G.duel && G.duel.opp === m.from && G.mode === 'play') { G.lastHitBy = (NET.players.get(m.from) || {}).name || 'a rival'; hurtPlayer(m.amt, null); } break;
    case 'pvpdead': if (G.duel && G.duel.opp === m.from) duelPoint(true); break;
    case 'duelend': if (G.duel && G.duel.opp === m.from) endDuel(null); break;
  }
}
function esc(s) { return String(s ?? '').replace(/[<>&"]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch])).slice(0, 160); }
function netChat(text) { text = String(text || '').trim(); if (!text || NET.status === 'off') return; const m = { t: 'chat', id: NET.id, name: netName(), text, col: (S.cos && S.cos.color) || CLS[S.cls].col }; if (NET.host) bcast(m); else toHost(m); netPost(`<b style="color:${m.col}">${esc(m.name)} (you):</b> ${esc(text)}`); }
// ---------- presence: send my state ----------
function myState() { return { t: 'st', id: NET.id, name: netName(), lvl: S.lvl, cls: S.cls, col: (S.cos && S.cos.color) || CLS[S.cls].col, x: P.x, y: P.y, face: P.face, hp: P.hp, mhp: ST.maxHp, area: netArea(), sw: P.swingT > 0 ? 1 : 0, dg: P.dodgeT > 0 ? 1 : 0 }; }
{ const _uN = update; update = function (dt) { _uN(dt); if (NET.status !== 'host' && NET.status !== 'guest' || !S || !P) return; const now = performance.now();
  if (now - NET.lastSend > 50) { NET.lastSend = now; const st = myState(); if (NET.host) bcast(st); else toHost(st); }
  if (NET.host && now - NET.lastEns > 100 && netArea().startsWith('coop') && G.mode === 'play') { NET.lastEns = now; sendEns(); }
  for (const [id, p] of NET.players) { p.rx += (p.tx - p.rx) * Math.min(1, dt * 12); p.ry += (p.ty - p.ry) * Math.min(1, dt * 12); if (now - (p.seen || 0) > 15000) { NET.players.delete(id); removeRemote(id); } }
  if (G.duel) duelTick(dt); if (NET.pendingFloor && !G.menu && !(typeof MPS !== 'undefined' && MPS.held)) recvFloor(NET.pendingFloor); }; }
// ---------- remote player models ----------
const REM = new Map();
function removeRemote(id) { const r = REM.get(id); if (r) { r.g.parent && r.g.parent.remove(r.g); REM.delete(id); } }
function clearRemoteMeshes() { for (const id of [...REM.keys()]) removeRemote(id); }
{ const _rN = render3D; render3D = function (dt) { _rN(dt); if (!R3 || NET.status === 'off') return; const area = netArea();
  for (const [id, p] of NET.players) { const same = p.area === area && area !== 'menu' && area !== 'solo'; let r = REM.get(id);
    if (!same) { if (r) r.g.visible = false; continue; }
    if (!r || r.col !== p.col || r.cls !== p.cls) { removeRemote(id); const h = makeHumanoid({ body: p.col || '#d8643c', cape: shade3(p.col || '#d8643c', .45), hatType: { warrior: 'helm', ranger: 'hood', mage: 'wizard' }[p.cls] || 'helm' }); h.g.traverse(o => { if (o.isMesh) o.receiveShadow = false; }); R3.scene.add(h.g); r = { g: h.g, h, col: p.col, cls: p.cls, mv: 0 }; REM.set(id, r); }
    r.g.visible = true; const ox = r.g.position.x; r.g.position.set(p.rx * U, 0, p.ry * U); r.g.rotation.y = -p.face; const sp = Math.abs(r.g.position.x - ox) * 60; r.mv += dt * 10 * Math.min(1, sp * 4);
    const k = Math.min(1, sp * 4); r.h.legL.rotation.z = Math.sin(r.mv) * .7 * k; r.h.legR.rotation.z = -Math.sin(r.mv) * .7 * k; r.h.armR.rotation.z = p.sw ? -1.6 : Math.sin(r.mv) * .4 * k; r.g.scale.setScalar(p.dg ? .8 : 1); } }; }
{ const _doN = drawOverlay; drawOverlay = function () { _doN(); if (NET.status === 'off' || !R3 || !S || G.mode === 'title') return; const area = netArea();
  for (const [id, p] of NET.players) { if (p.area !== area || area === 'solo') continue; const s = proj(p.rx, p.ry, 1.55); if (!s.vis) continue;
    X.textAlign = 'center'; X.font = 'bold 12px "Trebuchet MS",sans-serif'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; const t = `${p.name} • Lv ${p.lvl}`; X.strokeText(t, s.x, s.y - 8); X.fillStyle = '#9ad0ff'; X.fillText(t, s.x, s.y - 8);
    const w = 46, f = Math.max(0, Math.min(1, p.hp / (p.mhp || 1))); X.fillStyle = 'rgba(0,0,0,.7)'; X.fillRect(s.x - w / 2 - 1, s.y - 3, w + 2, 6); X.fillStyle = G.duel ? '#ff5a4a' : '#5ae07a'; X.fillRect(s.x - w / 2, s.y - 2, w * f, 4); } }; }
// ---------- CO-OP: host shares the floor, runs the monsters ----------
{ const _mkN = mkEnemy; mkEnemy = function (type, x, y, o) { const e = _mkN(type, x, y, o); if (e && NET.host) e.nid = ++NET.nid; return e; }; }
{ const _mbN = mkBoss; mkBoss = function (k, x, y) { const e = _mbN(k, x, y); if (e && NET.host) e.nid = ++NET.nid; return e; }; }
function floorSnap() { for (const e of G.ens) if (!e.dead && !e.prop && !e.nid) e.nid = ++NET.nid; captureResume(false); const R = S.resume; S.resume = null; if (!R) return null; const live = G.ens.filter(e => !e.dead && !e.prop && e.type !== 'dummy'); R.ens.forEach((s, i) => s.nid = live[i] && live[i].nid); R.shot = null; if (R.g) { R.g.pick = []; R.g.chests = (R.g.chests || []).map(c => ({ ...c, open: true })); } return JSON.parse(JSON.stringify(R, (k, v) => k && k[0] === '_' ? undefined : v)); }
function sendFloor(conn) { const R = floorSnap(); if (!R) { console.warn('net: no floor snapshot'); return; } const m = { t: 'floor', R, area: netArea(), name: netName() }; if (conn) send(conn, m); else bcast(m); }
{ const _efN = enterFloor; enterFloor = function (r, f, d) { _efN(r, f, d); if (NET.host && NET.conns.size && !G.tutorial && !G.trial && !G.duel) setTimeout(() => { sendFloor(); toast(ico('globe') + ' Your party follows you to this floor', '#9ad0ff'); }, 250); }; }
{ const _gtN = goTown; goTown = function () { const was = NET.host && NET.conns.size && !G.inTown; _gtN(); if (was) bcast({ t: 'town' }); }; }
function recvFloor(m) { if (G.duel || G.tutorial) return; if (G.menu && G.menu !== 'mp' && G.menu !== 'pause') { if (!NET.pendingFloor) toast(`${ico('globe')} ${esc(m.name)} entered a new floor — you'll join as soon as you close this`, '#9ad0ff'); NET.pendingFloor = m; return; } NET.pendingFloor = null;
  try { closeMenu(); const hp = P.hp, mp = P.mp, myDiff = S.diff; restoreLevel(m.R); NET.floorDiff = S.diff; S.diff = myDiff; P.hp = Math.min(ST.maxHp, Math.max(1, hp)); P.mp = Math.min(ST.maxMp, mp); const live = G.ens.filter(e => !e.dead && !e.prop); m.R.ens.forEach((s, i) => { if (live[i]) live[i].nid = s.nid; }); NET.coopGuest = true; NET.area = m.area; G.later = []; banner('Party Expedition', `${G.abyss ? 'Abyss Depth ' + G.depth : REG[G.region].n + ' — Floor ' + (G.floor + 1)}`, '#9ad0ff'); } catch (e) { console.warn(e); toast(ico('globe') + ' Could not sync the floor', '#ff8a8a'); } }
function sendEns() { const a = []; for (const e of G.ens) if (e.nid && !e.prop) a.push([e.nid, Math.round(e.x), Math.round(e.y), Math.round(e.hp), Math.round(e.maxHp), +(e.face || 0).toFixed(2), e.dead ? 1 : 0, e.type, e.boss ? 1 : 0, e.elite || 0]);
  const eb = G.eb.slice(0, 80).map(b => [Math.round(b.x), Math.round(b.y), +b.vx.toFixed(0), +b.vy.toFixed(0), b.r, Math.round(b.dmg), b.col, +(b.life || 2).toFixed(2)]); bcast({ t: 'ens', area: netArea(), a, eb, stairs: G.stairsOpen ? 1 : 0, exit: G.exit ? [G.exit.x, G.exit.y] : null, killed: G.killed }); }
function recvEns(m) { const seen = new Set();
  for (const [nid, x, y, hp, mhp, face, dead, type, boss, elite] of m.a) { seen.add(nid); let e = G.ens.find(q => q.nid === nid);
    if (!e && !dead) { e = boss ? mkBoss(type, x, y) : mkEnemy(type, x, y, { awake: true, elite: !!elite }); if (!e) continue; e.nid = nid; e.elite = elite || null; if (boss) G.boss = e; }
    if (!e) continue; e.nx = x; e.ny = y; e.face = face; e.maxHp = mhp; if (!e.dead) { if (dead) { e.hp = 0; killEnemy(e); } else e.hp = hp; } }
  for (const e of G.ens) if (e.nid && !seen.has(e.nid) && !e.dead) { e.dead = true; }
  G.eb = m.eb.map(([x, y, vx, vy, r, dmg, col, life]) => ({ x, y, vx, vy, r, dmg, col, life, src: 'party foe' }));
  G.stairsOpen = !!m.stairs; if (m.exit && !G.exit) G.exit = { x: m.exit[0], y: m.exit[1] }; G.killed = m.killed; }
// guests: monsters follow the host's positions instead of thinking for themselves
{ const _ueN = updEnemy; updEnemy = function (e, edt, dt) {
  if (NET.coopGuest && e.nid !== undefined && !e.prop) { if (e.nx !== undefined) { const k = Math.min(1, dt * 10); const dx = (e.nx - e.x) * k, dy = (e.ny - e.y) * k; e.x += dx; e.y += dy; e.mv = (e.mv || 0) + Math.hypot(dx, dy); } if (e.flash > 0) e.flash -= dt; return; }
  if (NET.host && NET.conns.size && netArea().startsWith('coop') && !e.prop) { // monsters chase whoever is closest
    let best = null, bd = dist(e, P); const area = netArea(); for (const [id, p] of NET.players) if (p.area === area && p.hp > 0) { const d = Math.hypot(p.rx - e.x, p.ry - e.y); if (d < bd) { bd = d; best = [id, p]; } }
    if (best) { const px = P.x, py = P.y; P.x = best[1].rx; P.y = best[1].ry; NET.swapTo = best[0]; try { _ueN(e, edt, dt); } finally { P.x = px; P.y = py; NET.swapTo = null; } return; } }
  _ueN(e, edt, dt); }; }
{ const _hpN = hurtPlayer; hurtPlayer = function (amt, src) { if (NET.swapTo) { const c = NET.conns.get(NET.swapTo); send(c, { t: 'dmg', amt }); return; } return _hpN(amt, src); }; }
{ const _heN = hurtEnemy; hurtEnemy = function (e, amt, o = {}) { if (e && e.type === 'rplayer') { if (G.duel && !G.duel.wait) { duelSend(e.rid, { t: 'pvp', amt: amt * PVP_SCALE }); dmgText(e.x, e.y - 30, Math.round(amt * PVP_SCALE), o.crit ? '#ffd54a' : '#ffffff', o.crit, 2); } return; }
  if (NET.coopGuest && e && e.nid !== undefined && !NET.applying) { toHost({ t: 'hit', nid: e.nid, amt, crit: !!o.crit }); }
  return _heN(e, amt, o); }; }
// guests follow the host through stairs and portals
{ const _nfN = nextFloor; nextFloor = function () { if (NET.coopGuest) { if (!NET.stairT || G.t - NET.stairT > 3) { NET.stairT = G.t; toast(ico('globe') + ' The host leads the way — wait for them to take the stairs', '#9ad0ff'); } return; } _nfN(); }; }
if (typeof bossExit === 'function') { const _bxN = bossExit; bossExit = function () { if (NET.coopGuest) { if (!NET.stairT || G.t - NET.stairT > 3) { NET.stairT = G.t; toast(ico('globe') + ' The host chooses where the party goes next', '#9ad0ff'); } return false; } return _bxN(); }; }
{ const _dieN = die; die = function () { if (G.duel) { duelSend(G.duel.opp, { t: 'pvpdead' }); duelPoint(false); return; } if (NET.coopGuest) NET.coopGuest = false; _dieN(); }; }
// ---------- PvP DUELS ----------
EN.rplayer = { n: 'Rival', ai: 'dummy', hp: 1e9, dmg: 0, spd: 0, r: 15, col: '#ff5a4a', xp: 0, sh: 'rplayer' };
{ const _memN = makeEnemyModel; makeEnemyModel = function (d, b) { if (d.sh !== 'rplayer') return _memN(d, b); const g = new T3.Group(), inner = new T3.Group(); g.add(inner); return { g, inner, body: mat('#ffffff').clone(), legs: [], wings: [], spin: [] }; }; }
// duel messages carry `to`; guests can only reach the host, so the host relays them to the right player
const DUEL_T = ['duelreq', 'duelok', 'duelno', 'duel', 'pvp', 'pvpdead', 'duelend'];
function duelSend(to, m) { m.to = to; m.from = NET.id; send(NET.conns.get(to) || (NET.host ? null : [...NET.conns.values()][0]), m); }
function askDuel(id) { if (G.duel || !id || id === NET.id) return; const p = NET.players.get(id); if (p && p.area === 'duel') { toast(ico('globe') + ' They are already dueling', '#9ab0d0'); return; } NET.pendingDuel = id; duelSend(id, { t: 'duelreq', name: netName() }); toast(ico('swords') + ' Duel request sent…', '#ff8a6a'); }
function duelAnswer(yes) { const m = NET.duelReq; NET.duelReq = null; closeMenu(); if (!m || !m.from) return; if (yes) { duelSend(m.from, { t: 'duelok' }); startDuel(m.from, 1); } else duelSend(m.from, { t: 'duelno' }); }
MENUS.duelask = () => `<div style="text-align:center;min-width:420px"><h2>${ico('swords')} Duel challenge</h2><div style="margin:8px 0 12px"><b>${esc((NET.duelReq || {}).name || 'A player')}</b> challenges you to a duel — first to 3.</div><span class="btn" onclick="duelAnswer(true)">Accept</span><span class="btn" onclick="duelAnswer(false)">Decline</span></div>`;
function startDuel(opp, side) { closeMenu(); resetLevel(); G.inTown = false; G.abyss = false; G.region = 9; G.floor = 0; G.pw = calcPw(); M = genArena(); G.duel = { opp, me: 0, them: 0, round: 1, cd: 3 }; NET.coopGuest = false;
  duelSpawn(side); computeFlow(); buildLevel(); G.mode = 'play'; banner('Duel!', `${esc((NET.players.get(opp) || {}).name || 'Rival')} • first to 3`, '#ff6a5a'); sfx('boss'); }
function duelSpawn(side) { const s = G.duel.side = side ?? G.duel.side; placePlayer(20, s ? 9 : 22); calcStats(); P.hp = ST.maxHp; P.mp = ST.maxMp; P.cds = {}; P.inv = 1.5; G.ens = G.ens.filter(e => e.type !== "rplayer"); const e = mkEnemy('rplayer', P.x, P.y + (s ? 300 : -300), {}); if (e) { e.rid = G.duel.opp; e.hp = e.maxHp = 1e9; } }
function duelTick(dt) { const p = NET.players.get(G.duel.opp), e = G.ens.find(x => x.type === 'rplayer'); if (p && e) { e.x = p.rx; e.y = p.ry; e.hp = e.maxHp = 1e9; e.dead = false; e.rhp = Math.max(0, +p.hp || 0); e.rmhp = Math.max(1, +p.mhp || 1); e.rname = p.name; } }
function duelPoint(iWon) { const D = G.duel; if (!D || D.wait) return; if (iWon) D.me++; else D.them++; D.wait = 1; banner(iWon ? 'Point to you!' : 'Your rival scores', `${D.me} — ${D.them}`, iWon ? '#7aff7a' : '#ff6a5a'); sfx(iWon ? 'legend' : 'hurt');
  if (D.me >= 3 || D.them >= 3) { const win = D.me >= 3; S.stats.pvpWins = (S.stats.pvpWins || 0) + (win ? 1 : 0); S.stats.pvpDuels = (S.stats.pvpDuels || 0) + 1; setTimeout(() => { banner(win ? ico('trophy') + ' VICTORY' : 'Defeat', win ? 'You won the duel!' : 'Better luck next time', win ? '#ffd27a' : '#ff6a5a'); }, 900); setTimeout(() => endDuel(), 4200); return; }
  setTimeout(() => { if (!G.duel) return; D.wait = 0; D.round++; duelSpawn(); banner(`Round ${D.round}`, 'Fight!', '#ff8a6a'); }, 2500); }
function endDuel() { if (!G.duel) return; const opp = G.duel.opp; G.duel = null; duelSend(opp, { t: 'duelend' }); goTown(); }
// ---------- the Multiplayer menu ----------
UNLOCK.mp = { n: 'Multiplayer', ic: ico('globe'), kind: 'menu', how: 'Reach level 5', ok: () => S.lvl >= 5 };
HUB.push(['mp', ico('globe'), 'Multiplayer', 'Play with friends', '']);
if (typeof HUB_GROUPS !== 'undefined') HUB_GROUPS[2][1].push('mp');
MENUS.mp = () => {
  const st = NET.status, on = st === 'host' || st === 'guest';
  let h = `<h2>${ico('globe')} Multiplayer <span class="dim" style="font-size:14px">${on ? (NET.host ? 'hosting' : 'joined') + ` room <b style="color:#ffd27a;letter-spacing:2px">${NET.code}</b>` : 'play online with up to 3 friends'}</span></h2>`;
  if (!on) {
    h += `<div class="regcards"><div class="card"><b>${ico('home')} Host a room</b><div class="dim">Get a 5-letter code and share it with your friends.</div><span class="btn ${st === 'connecting' ? 'dis' : ''}" onclick="netHost()">${st === 'connecting' ? 'Connecting…' : 'Host'}</span></div>
      <div class="card"><b>${ico('key')} Join a room</b><div class="dim">Enter the code your friend gave you.</div><input id="mpcode" maxlength="6" placeholder="CODE" style="width:110px;text-transform:uppercase;letter-spacing:3px;font-size:16px;padding:5px 8px;border-radius:8px;border:1px solid #7a5c36;background:#120e18;color:#ffe2a8"> <span class="btn ${st === 'connecting' ? 'dis' : ''}" onclick="netJoin(document.getElementById('mpcode').value)">Join</span></div></div>
      <div class="card">Your name: <input id="mpname" maxlength="18" value="${esc(netName())}" style="padding:4px 8px;border-radius:8px;border:1px solid #7a5c36;background:#120e18;color:#ffe2a8" onchange="S.netName=this.value.trim().slice(0,18);saveGame()"></div>
      ${NET.err ? `<div class="dim" style="color:#ff9a8a">${esc(NET.err)}</div>` : ''}
      <div class="dim" style="font-size:12px">How it works: you connect directly to your friends' browsers (WebRTC). A free public service (PeerJS) only introduces you — the game itself stays on your computers. Needs an internet connection.</div>`;
  } else {
    const list = [...NET.players.values()];
    h += `<div class="card"><b>Players (${list.length + 1}/${NET_MAX})</b><div class="smrow"><div style="flex:1">${ico('star')} <b>${esc(netName())}</b> (you) • Lv ${S.lvl} ${CLS[S.cls].n}</div><span class="dim">${netArea()}</span></div>${list.map(p => `<div class="smrow"><div style="flex:1"><b style="color:${esc(p.col)}">${esc(p.name)}</b> • Lv ${+p.lvl || 1} ${CLS[p.cls] ? CLS[p.cls].n : ''}</div><span class="dim">${p.area === 'town' ? 'in Haven' : String(p.area).startsWith('coop') ? 'in your party' : p.area === 'duel' ? 'dueling' : 'adventuring'}</span>${!G.duel && p.area !== 'duel' ? ` <span class="btn" onclick="askDuel('${String(p.id).replace(/[^\w-]/g, '')}')">${ico('swords')} Duel</span>` : ''}</div>`).join('') || '<div class="dim">Waiting for friends… share the code above.</div>'}</div>
      <div class="regcards"><div class="card"><b>${ico('compass')} Co-op expedition</b><div class="dim">${NET.host ? 'Travel from the Waystone as usual — everyone in the room joins your floor. Monsters chase whoever is closest; everyone gets loot and XP. Take the stairs and the party follows.' : 'When the host enters a floor you join them automatically. The host leads through stairs and portals.'}</div></div>
      <div class="card"><b>${ico('swords')} PvP duel</b><div class="dim">Press Duel next to any player to challenge them. First to 3 wins. Damage between players is reduced so duels last.</div></div></div>
      <div class="card"><b>${ico('chat')} Chat</b><div class="mpchat">${NET.chat.slice(-8).map(t => `<div>${t}</div>`).join('') || '<div class="dim">No messages yet.</div>'}</div><input id="mpmsg" maxlength="140" placeholder="Say something… (Enter to send)" style="width:70%;padding:5px 8px;border-radius:8px;border:1px solid #7a5c36;background:#120e18;color:#ffe2a8" onkeydown="if(event.key==='Enter'){netChat(this.value);this.value='';}"> <span class="btn" onclick="const i=document.getElementById('mpmsg');netChat(i.value);i.value=''">Send</span></div>
      <span class="btn" onclick="netLeave()">${ico('door')} Leave room</span>${G.duel ? ' <span class="btn" onclick="endDuel()">End duel</span>' : ''}`;
  }
  return h + ` <span class="btn" onclick="backHub()">Back</span>`;
};
// typing in the menu must not trigger game hotkeys
document.addEventListener('keydown', e => { if (e.target && (e.target.id === 'mpmsg' || e.target.id === 'mpcode' || e.target.id === 'mpname')) e.stopPropagation(); });
ACH.push({ id: 'pvp1', n: 'Duelist', d: 'Win a PvP duel', c: () => S.stats.pvpWins || 0, need: 1, sp: 1 }, { id: 'pvp10', n: 'Arena Legend', d: 'Win 10 PvP duels', c: () => S.stats.pvpWins || 0, need: 10, sp: 2 });
WIKI_TXT.world.push(['Multiplayer', 'Open ' + ico('globe') + ' Multiplayer from the ☰ Menu (or Arena Master Tyr). Host a room to get a 5-letter code, friends join with it (up to 4 players). In Haven you see each other and can chat. Co-op: when the host enters a dungeon floor everyone joins it — monsters chase the closest player, everyone gets their own loot and XP, and the party follows the host through stairs. PvP: the host can start a duel (first to 3, reduced damage). Needs an internet connection; players connect directly to each other.']);
const mpStyle = document.createElement('style'); mpStyle.textContent = `.mpchat{max-height:150px;overflow:auto;font-size:12.5px;margin:4px 0 6px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.25)}.mpchat div{padding:1px 0}`; document.head.appendChild(mpStyle);
{ const _seN = seeE; seeE = function (e) { if (e && e.type === 'rplayer') return; return _seN(e); }; }
{ const _crN = canResume; canResume = function () { return _crN() && !G.duel && !G.arena && !NET.coopGuest; }; }
