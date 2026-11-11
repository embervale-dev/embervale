// ================= THE TRADING PLAZA: a market square behind Haven's west gate where players trade items =================
// - Walk through the Plaza Gate on Haven's WEST wall (across the square from the teahouse) into an open-air market.
// - Trade with any player who is also in the Plaza: both sides put up to 6 items (and Ember Shards) on the table.
// - Every item has a fixed TRADE VALUE (rarity, upgrades, bonus quality, legendary powers, sets…), the same on every computer.
//   Like the trading hubs of big online games, a trade only goes through when both sides are CLOSE IN VALUE (within 30%).
// - Both players press Ready, then Accept, then a 3-second countdown runs; any change to either offer cancels the countdown.
// - Appraiser Quill shows what your items are worth and runs the Plaza Exchange (trade junk for one better item).
// ---------- trade values (pure functions of the item, so both players always see the same numbers) ----------
const TV_BASE = [10, 22, 50, 110, 250, 550, 1200, 2600, 5600, 12000, 26000, 56000];
const SHARD_TV = 2, TRADE_MAX = 6, TRADE_FAIR = .7;
function tradeVal(it) { if (!it) return 0; const r = clamp(it.r | 0, 0, TV_BASE.length - 1), aff = Array.isArray(it.aff) ? it.aff : [], q = aff.length ? aff.reduce((a, x) => a + clamp(+x.q || 0, 0, 1), 0) / aff.length : .5;
  const socks = Array.isArray(it.sock) ? it.sock.length : 0, gems = Array.isArray(it.sock) ? it.sock.filter(Boolean).length : 0;
  return Math.round(TV_BASE[r] * (1 + .06 * clamp(it.plus | 0, 0, 10)) * (.85 + .3 * q) * (it.u ? 1.35 : 1) * (it.u2 ? 1.25 : 1) * (it.set ? 1.3 : 1) * (it.art ? 2 : 1) * (it.awk ? 1.2 : 1) * (1 + .04 * socks + .06 * gems)); }
function offerVal(items, sh) { return items.reduce((a, it) => a + tradeVal(it), 0) + (sh | 0) * SHARD_TV; }
function fairness(a, b) { if (!a && !b) return { r: 0, ok: false, txt: 'Put something on the table', col: '#9a8a70' }; const r = Math.min(a, b) / Math.max(a, b);
  return r >= .9 ? { r, ok: true, txt: 'Fair trade', col: '#7aff9a' } : r >= .8 ? { r, ok: true, txt: 'Good trade', col: '#b8ff7a' } : r >= TRADE_FAIR ? { r, ok: true, txt: 'Close enough', col: '#ffd27a' } : { r, ok: false, txt: `Too uneven — values must be within ${Math.round((1 - TRADE_FAIR) * 100)}%`, col: '#ff7a6a' }; }
// ---------- the plaza map and moving in / out ----------
const PLZ = { gate: { x: 4.1, y: 16.5 }, fount: { x: 19.5, y: 15.6 }, exit: { x: 29.4, y: 14.5 }, tables: [{ x: 12.5, y: 18.4 }, { x: 26.5, y: 18.4 }], quill: { x: 21.5, y: 9.4 }, board: { x: 16.5, y: 9.4 } };
{ const _gtP0 = genTown; genTown = function () { if (!G.plaza) return _gtP0(); const m = makeMap(38, 28); m.kind = 'town'; carve(m, 8, 8, 22, 13); m.rooms = [{ x: 8, y: 8, w: 22, h: 13, cx: 19, cy: 14 }];
  return m; }; }
function plazaEnter() { closeMenu(); if (G.mode !== 'play' || !G.inTown) return; G.plazaGo = true; sfx('stairs'); goTown(); }
function plazaLeave() { closeMenu(); if (TR) tradeCancel('left the Plaza'); G.plaza = false; goTown(); placePlayer(5, 16); const g = G.npcs.find(n => n.plz === 'gate'); if (g) g.near = true; }
{ const _gtP = goTown; goTown = function () { const was = G.plaza; G.plaza = !!G.plazaGo; G.plazaGo = false; if (was && !G.plaza && TR) tradeCancel('left the Plaza');
  if (G.plaza && S && S.retPortal) { G.keepRet = S.retPortal; S.retPortal = null; } else if (!G.plaza && G.keepRet && S) { S.retPortal = G.keepRet; G.keepRet = null; }
  _gtP();
  if (G.plaza) { G.teahouse = false; G.npcs = [{ n: 'Back to Haven', x: PLZ.exit.x, y: PLZ.exit.y, col: '#9ad0ff', menu: 'plazaexit', plz: 'exit' }, { n: 'Appraiser Quill', x: PLZ.quill.x, y: PLZ.quill.y + .9, col: '#ffd27a', menu: 'appraise', plz: 'quill', ic: ico('gem') }, { n: 'Trade Board', x: PLZ.board.x, y: PLZ.board.y + .9, col: '#e0b070', menu: 'tradeboard', plz: 'board', ic: ico('scroll') },
      ...PLZ.tables.map((t, i) => ({ n: 'Trade Table', x: t.x, y: t.y - 1, col: '#c0a070', menu: 'tradeboard', plz: 'table' + i }))].map(n => ({ ...n, x: n.x * TILE, y: n.y * TILE, near: false }));
    G.vill = []; placePlayer(27, 14); banner('The Trading Plaza', 'Trade with other players — values must be close', '#ffd27a'); buildLevel(); }
  else plazaGateNpc(); }; }
function plazaGateNpc() { if (!G.inTown || G.plaza || G.teahouse || G.npcs.some(n => n.plz === 'gate')) return; G.npcs.push({ n: 'Trading Plaza', x: PLZ.gate.x * TILE, y: PLZ.gate.y * TILE, col: '#ffd27a', menu: 'plazagate', plz: 'gate', ic: ico('gold'), near: false }); }
{ const _uP = update; update = function (dt) { _uP(dt); if (G.inTown && !G.plaza && !G.teahouse && G.mode === 'play' && !G.npcs.some(n => n.plz === 'gate')) plazaGateNpc(); }; }
{ const _efP = enterFloor; enterFloor = function () { if (G.plaza && TR) tradeCancel('left the Plaza'); G.plaza = false; if (G.keepRet && S) { S.retPortal = G.keepRet; G.keepRet = null; } return _efP.apply(this, arguments); }; }
{ const _naP = netArea; netArea = function () { return G.plaza && S && G.mode !== 'title' ? 'plaza' : _naP(); }; }
// ---------- 3D: the gate on Haven's west wall ----------
function plzGate() { const L = R3.lvl, gx = 3.32, gz = PLZ.gate.y, stone = mat('#9a8e78', { rough: .9 }), stone2 = mat('#857a66', { rough: .9 }), gold = mat('#d8b040', { metal: .8, rough: .35 }), cloth = mat('#2a5a8a', { rough: .95 }), cloth2 = mat('#a8322a', { rough: .95 });
  for (const s of [-1, 1]) { mk(GEO.box, stone, .5, 2.4, .5, gx + .05, 1.2, gz + s * 1.2, L); mk(GEO.box, stone2, .62, .16, .62, gx + .05, 2.46, gz + s * 1.2, L); mk(GEO.sph, gold, .14, .14, .14, gx + .05, 2.64, gz + s * 1.2, L); }
  mk(GEO.box, stone2, .5, .34, 2.9, gx + .05, 2.3, gz, L); mk(GEO.box, mat('#1a120a'), .08, 1.9, 1.9, gx - .22, .95, gz, L, false); mk(GEO.box, mat('#c8a050', { em: .25 }), .02, 1.7, 1.7, gx - .26, .9, gz, L, false);
  mk(GEO.box, mat('#3a2416'), .06, .34, 1.5, gx + .32, 2.3, gz, L, false); mk(GEO.box, mat('#ffd27a', { em: .7 }), .07, .2, 1.3, gx + .34, 2.3, gz, L, false);
  for (const [s, c] of [[-1, cloth], [1, cloth2]]) { const b = mk(GEO.box, c, .03, 1.1, .45, gx + .33, 1.55, gz + s * 1.2, L, false); R3.anim.push(() => { b.rotation.x = Math.sin(G.t * 1.6 + s) * .05; }); }
  hv2Lantern(gx + .4, 1.5, gz - .75, '#ffcf70'); hv2Lantern(gx + .4, 1.5, gz + .75, '#ffcf70');
  // a carpet into the square, a striped canopy and a sign that faces the camera
  mk(GEO.box, mat('#8a2a24', { rough: .95 }), 2.4, .025, 1.3, gx + 1.3, .03, gz, L, false); for (const s2 of [-1, 1]) mk(GEO.box, mat('#d8b040', { rough: .7 }), 2.4, .03, .07, gx + 1.3, .035, gz + s2 * .6, L, false);
  for (let k = 0; k < 6; k++) { const c = mk(GEO.box, mat(k % 2 ? '#efe2c4' : '#2a5a8a', { rough: .95 }), 1.3, .04, .5, gx + .7, 2.7 - .12, gz - 1.25 + k * .5, L); c.rotation.z = -.28; }
  for (const s2 of [-1, 1]) mk(GEO.cylL, mat('#3a2416'), .04, 2.6, .04, gx + 1.32, 1.3, gz + s2 * 1.3, L);
  const sg = new T3.Group(); sg.position.set(gx + 1.45, 2.05, gz + 1.45); sg.rotation.x = -.55; L.add(sg); mk(GEO.box, mat('#3a2416'), 1.5, .5, .06, 0, 0, 0, sg); mk(GEO.box, mat('#ffd27a', { em: .8 }), 1.36, .36, .07, 0, 0, .01, sg, false);
  for (let k = 0; k < 3; k++) mk(GEO.cyl, mat('#d8b040', { metal: .8, rough: .3 }), .08, .02, .08, -.35 + k * .35, 0, .05, sg, false).rotation.x = Math.PI / 2;
  R3.torches.push({ x: gx + .8, y: 1.6, z: gz, col: '#ffcf70' });
  hv2Fig({ body: '#8a6a2a', hatType: 'hair', hair: '#3a2a1a', skin: '#d8a880' }, gx + .45, gz - 1.6, Math.PI / 2); }
{ const _btP = buildTown; buildTown = function () { if (G.plaza) { plzInterior(); return; } const mine = G.npcs.filter(n => n.plz); G.npcs = G.npcs.filter(n => !n.plz); try { _btP(); } finally { G.npcs = G.npcs.filter(n => !n.plz).concat(mine); } if (!G.teahouse) try { plzGate(); } catch (e) { console.warn('plaza gate', e); } }; }  // the town builder puts a stall under every NPC — not under our gate
// ---------- 3D: the plaza itself ----------
function plzInterior() { const L = R3.lvl, X0 = 8, X1 = 30, Z0 = 8, Z1 = 21;
  const stone = mat('#a39a86', { rough: .92 }), stone2 = mat('#8b8270', { rough: .92 }), wood = mat('#7a5232', { rough: .8 }), dark = mat('#3a2416', { rough: .8 }), gold = mat('#d8b040', { metal: .8, rough: .3 }),
    water = basic('#5ac8ff', { op: .7, add: 1, unique: 1 }), green = mat('#4a7a3a', { rough: .7 }), clay = mat('#9a5a36', { rough: .7 }), cream = mat('#efe2c4', { rough: .9 });
  // paving with a sunburst mosaic around the fountain
  const tiles = []; for (let z = Z0; z < Z1; z++) for (let x = X0; x < X1; x++) { const h = hash(x, z), d = Math.hypot(x + .5 - PLZ.fount.x, z + .5 - PLZ.fount.y), ring = d < 3.4 && d > 1.9;
    tiles.push({ x: x + .5, y: .012, z: z + .5, sx: .96, sy: .02, sz: .96, c: ring ? ((Math.floor(Math.atan2(z + .5 - PLZ.fount.y, x + .5 - PLZ.fount.x) * 4) & 1) ? '#c8a050' : '#e0d2b0') : ['#b4ab96', '#a89f8a', '#bdb39c', '#9e9580'][h & 3] }); }
  addInst(tiles, GEO.box, new T3.MeshStandardMaterial({ color: '#ffffff', roughness: .9 }), false).userData.ownMat = true;
  // low colonnade walls with arches and banners
  const banC = ['#2a5a8a', '#a8322a', '#3a7a4a', '#7a3a8a', '#c08a2a'];
  const wallRun = (x0, z0, x1, z1, skip) => { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 2.2), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
    for (let i = 0; i <= n; i++) { const t = i * len / n, x = x0 + dx * t, z = z0 + dz * t; if (skip && skip(x, z)) continue; mk(GEO.box, stone2, .42, 2.2, .42, x, 1.1, z, L); mk(GEO.box, stone, .56, .14, .56, x, 2.26, z, L);
      if (i < n && !(skip && skip(x + dx * len / n / 2, z + dz * len / n / 2))) { const mx = x + dx * len / n / 2, mz = z + dz * len / n / 2, seg = mk(GEO.box, stone, len / n, .9, .3, mx, .45, mz, L); seg.rotation.y = -Math.atan2(dz, dx);
        const top = mk(GEO.box, stone2, len / n, .2, .36, mx, 2.1, mz, L); top.rotation.y = -Math.atan2(dz, dx);
        if (i % 2 === 0) { const b = mk(GEO.box, mat(banC[(i + Math.round(x0 + z0)) % banC.length], { rough: .95 }), .55, .8, .03, mx, 1.55, mz, L, false); b.rotation.y = -Math.atan2(dz, dx); const ph = i * .7; R3.anim.push(() => { b.rotation.z = Math.sin(G.t * 1.3 + ph) * .04; }); } } } };
  wallRun(X0, Z0, X1, Z0); wallRun(X0, Z1, X1, Z1); wallRun(X0, Z0, X0, Z1); wallRun(X1, Z0, X1, Z1, (x, z) => Math.abs(z - PLZ.exit.y) < 1.4);
  // exit arch on the east side
  for (const s of [-1, 1]) mk(GEO.box, stone2, .5, 2.6, .5, X1, 1.3, PLZ.exit.y + s * 1.25, L); mk(GEO.box, stone, .5, .4, 3, X1, 2.75, PLZ.exit.y, L); mk(GEO.box, mat('#9ad0ff', { em: .6 }), .06, .2, 1.4, X1 - .27, 2.75, PLZ.exit.y, L, false);
  // the fountain: two basins, a statue of scales, sparkling water
  const F = PLZ.fount; mk(GEO.cyl, stone2, 1.45, .45, 1.45, F.x, .22, F.y, L); mk(GEO.cyl, mat('#2a6a8a', { rough: .2 }), 1.3, .05, 1.3, F.x, .43, F.y, L, false);
  const w1 = mk(GEO.circ, water, 1.25, 1, 1.25, F.x, .46, F.y, L, false); w1.rotation.x = -Math.PI / 2; mk(GEO.cyl, stone, .3, 1.1, .3, F.x, .9, F.y, L); mk(GEO.cyl, stone2, .7, .14, .7, F.x, 1.45, F.y, L);
  const sc = new T3.Group(); sc.position.set(F.x, 1.55, F.y); L.add(sc); mk(GEO.cyl, gold, .05, .9, .05, 0, .45, 0, sc); const beam = mk(GEO.box, gold, 1.1, .05, .05, 0, .9, 0, sc);
  for (const s of [-1, 1]) { mk(GEO.cylL, gold, .008, .35, .008, s * .5, .72, 0, sc, false); mk(GEO.cyl, gold, .2, .03, .2, s * .5, .55, 0, sc); }
  R3.anim.push(() => { sc.rotation.y = G.t * .25; beam.rotation.z = Math.sin(G.t * .8) * .06; w1.material.opacity = .55 + .12 * Math.sin(G.t * 3); if (Math.random() < .5) G.parts.push({ x: (F.x + rnd(-.25, .25)) * TILE, y: (F.y + rnd(-.25, .25)) * TILE, z: 1.6, vx: rnd(-30, 30), vy: rnd(-30, 30), vz: 1.6, g: 3.2, life: .8, max: .8, col: '#9ae0ff', size: 2 }); });
  R3.torches.push({ x: F.x, y: 1.9, z: F.y, col: '#9ae0ff' });
  // market stalls along the north wall (striped awnings, goods), and trade tables with benches
  const stall = (x, z, c1, c2, goods) => { for (const s of [-1, 1]) for (const t of [-1, 1]) mk(GEO.cylL, dark, .03, 1.7, .03, x + s * .85, .85, z + t * .45, L);
    mk(GEO.box, wood, 1.9, .08, 1.0, x, .78, z, L); mk(GEO.box, dark, 1.85, .7, .06, x, .4, z + .48, L);
    for (let k = 0; k < 6; k++) { const a = mk(GEO.box, mat(k % 2 ? c1 : c2, { rough: .95 }), .33, .04, 1.25, x - .82 + k * .33, 1.78, z + .06, L); a.rotation.x = .22; }
    goods(x, z); };
  const crates = (x, z) => { for (let k = 0; k < 3; k++) mk(GEO.box, wood, .32, .3, .32, x - .55 + k * .55, .98, z - .1, L); };
  const pots = (x, z) => { for (let k = 0; k < 4; k++) mk(GEO.sph, clay, .17, .2, .17, x - .6 + k * .4, 1.0, z - .1, L); };
  const gems = (x, z) => { for (let k = 0; k < 5; k++) { const g = mk(GEO.oct, mat(['#ff5a6a', '#5ab0ff', '#7aff8a', '#c08aff', '#ffd27a'][k], { em: .9 }), .09, .13, .09, x - .6 + k * .3, 1.0, z - .1, L, false); const ph = k; R3.anim.push(() => { g.rotation.y = G.t * 1.5 + ph; }); } };
  const cloth = (x, z) => { for (let k = 0; k < 3; k++) mk(GEO.cyl, mat(['#a8322a', '#2a5a8a', '#c08a2a'][k], { rough: .95 }), .12, .5, .12, x - .5 + k * .5, 1.0, z - .1, L).rotation.z = Math.PI / 2; };
  stall(11, 8.9, '#a8322a', '#efe2c4', crates); stall(14, 8.9, '#2a5a8a', '#efe2c4', cloth); stall(25, 8.9, '#3a7a4a', '#efe2c4', pots); stall(28, 8.9, '#7a3a8a', '#efe2c4', gems);
  for (const t of PLZ.tables) { mk(GEO.box, wood, 1.6, .08, .9, t.x, .72, t.y, L); for (const s of [-1, 1]) for (const u of [-1, 1]) mk(GEO.box, dark, .08, .7, .08, t.x + s * .7, .35, t.y + u * .35, L);
    for (const u of [-1, 1]) { mk(GEO.box, wood, 1.5, .06, .3, t.x, .42, t.y + u * .85, L); for (const s of [-1, 1]) mk(GEO.box, dark, .06, .4, .06, t.x + s * .65, .2, t.y + u * .85, L); }
    const cl = mk(GEO.box, mat('#c8a050', { rough: .9 }), 1.2, .01, .5, t.x, .77, t.y, L, false); const sym = mk(GEO.tor, mat('#ffd27a', { em: 1.6 }), .14, .14, .14, t.x, 1.0, t.y, L, false); R3.anim.push(() => { sym.rotation.y = G.t * 1.2; sym.position.y = 1.0 + Math.sin(G.t * 2) * .05; }); }
  // Appraiser Quill's desk with ledger & loupe, and the Trade Board
  const Q = PLZ.quill; mk(GEO.box, wood, 1.8, .8, .7, Q.x, .4, Q.y + .3, L); mk(GEO.box, mat('#5a1a14', { rough: .5 }), 1.9, .06, .78, Q.x, .82, Q.y + .3, L); mk(GEO.box, cream, .5, .03, .36, Q.x - .4, .86, Q.y + .3, L, false); mk(GEO.tor, gold, .09, .09, .09, Q.x + .4, .9, Q.y + .3, L, false);
  hv2Fig({ body: '#6a3a8a', hatType: 'hair', hair: '#d8d0c0', skin: '#e8c8a8' }, Q.x, Q.y - .25, 0);
  const B = PLZ.board; mk(GEO.box, dark, .12, 1.9, .12, B.x - .8, .95, B.y, L); mk(GEO.box, dark, .12, 1.9, .12, B.x + .8, .95, B.y, L); mk(GEO.box, wood, 1.7, 1.1, .08, B.x, 1.35, B.y, L);
  for (let k = 0; k < 5; k++) { const p = mk(GEO.box, mat(['#efe2c4', '#e8d6a8', '#f4ead0'][k % 3], { rough: .95 }), .3, .38, .01, B.x - .6 + k * .3, 1.3 + (k % 2) * .18, B.y + .05, L, false); p.rotation.z = (k - 2) * .05; }
  // potted trees, lanterns on posts and string lights
  for (const [x, z] of [[9.2, 9.2], [28.8, 9.2], [9.2, 19.8], [28.8, 19.8], [16, 19.8], [23, 19.8]]) { mk(GEO.cyl, clay, .38, .4, .38, x, .2, z, L); mk(GEO.cylL, dark, .05, .9, .05, x, .8, z, L); mk(GEO.sph, green, .55, .5, .55, x, 1.5, z, L); mk(GEO.sph, mat('#5a8a4a', { rough: .7 }), .4, .38, .4, x + .2, 1.75, z - .1, L); }
  for (const [x, z] of [[12, 13], [27, 13], [12, 20.3], [27, 20.3]]) { mk(GEO.cylL, dark, .04, 2.2, .04, x, 1.1, z, L); hv2Lantern(x, 2.25, z, '#ffcf70'); }
  for (let k = 0; k < 14; k++) { const x = 10 + k * 1.4, l = mk(GEO.sph, mat(['#ffd27a', '#ff8a6a', '#9ad0ff', '#9aff9a'][k % 4], { em: 2 }), .06, .06, .06, x, 2.6 + Math.sin(k / 13 * Math.PI) * -.3, 13.2, L, false); R3.flames.push(l); }
}
// ---------- the trade itself ----------
let TR = null;   // { with, mine:[ids], sh, ver, theirs:[items], tsh, tver, lock, tlock, acc, tacc, cd }
DUEL_T.push('treq', 'tok', 'tno', 'toff', 'tlock', 'tacc', 'tcan', 'tdone');
function plazaPeers() { return [...NET.players.values()].filter(p => p.area === 'plaza'); }
function tradeAsk(id) { id = cleanId(id); if (!netOn()) return toast('Host or join a room in Multiplayer first', '#ff8a8a'); if (!G.plaza) return toast('Trades happen in the Trading Plaza — enter through the west gate in Haven', '#ff8a8a');
  const p = NET.players.get(id); if (!p) return; if (p.area !== 'plaza') return toast(`${esc(p.name)} has to be in the Trading Plaza too`, '#ff8a8a'); if (TR) return toast('Finish your current trade first', '#ff8a8a');
  NET.pendingTrade = id; duelSend(id, { t: 'treq', name: netName() }); toast(`${ico('gold')} Trade request sent to ${esc(p.name)}…`, '#ffd27a'); setTimeout(() => { if (NET.pendingTrade === id) { NET.pendingTrade = null; toast(`${esc(p.name)} didn't answer`, '#9ab0d0'); } }, 22000); }
function tradeOpen(id) { TR = { with: id, mine: [], sh: 0, ver: 0, theirs: [], tsh: 0, tver: 0, lock: false, tlock: false, acc: false, tacc: false, cd: 0 }; openMenu('trade'); sfx('click'); }
function myOffer() { return TR.mine.map(id => S.inv.find(i => i.id === id)).filter(Boolean); }
function tradeSync() { if (!TR) return; TR.ver++; TR.lock = TR.tlock = TR.acc = TR.tacc = false; TR.cd = 0; duelSend(TR.with, { t: 'toff', items: myOffer().map(it => JSON.parse(JSON.stringify(it))), sh: TR.sh, ver: TR.ver }); renderMenu(); }
function tradeAdd(id) { if (!TR || TR.cd) return; const it = S.inv.find(i => i.id === id); if (!it) return; if (it.locked) return toast('Locked items cannot be traded (Alt+Click to unlock)', '#ff8a8a'); if (TR.mine.includes(id)) return; if (TR.mine.length >= TRADE_MAX) return toast(`Up to ${TRADE_MAX} items per side`, '#ff8a8a'); TR.mine.push(id); hideTip(); sfx('click'); tradeSync(); }
function tradeRem(id) { if (!TR || TR.cd) return; TR.mine = TR.mine.filter(x => x !== id); hideTip(); sfx('click'); tradeSync(); }
function tradeShards(d) { if (!TR || TR.cd) return; TR.sh = clamp((TR.sh | 0) + d, 0, S.shards | 0); tradeSync(); }
function tradeLock() { if (!TR || TR.cd) return; TR.lock = !TR.lock; if (!TR.lock) TR.acc = false; duelSend(TR.with, { t: 'tlock', on: TR.lock, ver: TR.ver, tver: TR.tver }); sfx('click'); renderMenu(); }
function tradeAccept() { if (!TR || !TR.lock || !TR.tlock) return; const f = fairness(offerVal(myOffer(), TR.sh), offerVal(TR.theirs, TR.tsh)); if (!f.ok) return toast(f.txt, '#ff8a8a'); TR.acc = true; duelSend(TR.with, { t: 'tacc', ver: TR.ver, tver: TR.tver }); sfx('click'); tradeCheck(); renderMenu(); }
function tradeCheck() { if (TR && TR.acc && TR.tacc && !TR.cd) { TR.cd = 3; sfx('shrine'); } }
function tradeCancel(why, quiet) { if (!TR) return; if (TR.cd && !quiet && why !== 'left the Plaza') { toast('The trade is finishing — hold on a moment', '#ffd27a'); return; } const w = TR.with; TR = null; if (!quiet) duelSend(w, { t: 'tcan', why: why || '' }); if (G.menu === 'trade') closeMenu(); toast(`${ico('gold')} Trade cancelled${why ? ' — ' + esc(why) : ''}`, '#c8b898'); }
function tradeExec() { const T = TR; if (!T) return; const mine = myOffer();
  if (mine.length !== T.mine.length || (S.shards | 0) < T.sh) { tradeCancel('your offer changed'); return; }
  const got = T.theirs.map(giftClean).filter(Boolean); if (got.length !== T.theirs.length) { tradeCancel('their offer could not be read'); return; }
  for (const it of mine) S.inv.splice(S.inv.indexOf(it), 1); S.shards -= T.sh; S.shards += T.tsh | 0;
  for (const it of got) { it.isNew = true; (S.inv.length < S.invMax ? S.inv : S.stash).push(it); noteFound(it); }
  const v1 = offerVal(mine, T.sh), v2 = offerVal(got, T.tsh); S.trades = S.trades || []; S.trades.unshift({ at: Date.now(), with: pName(T.with), gave: mine.map(i => [i.name, i.r]), got: got.map(i => [i.name, i.r]), sh: T.sh, tsh: T.tsh, v1, v2 }); S.trades.length = Math.min(S.trades.length, 15);
  S.stats.trades = (S.stats.trades || 0) + 1; TR = null; closeMenu(); sfx('legend'); banner('Trade complete!', `You received ${got.length} item${got.length === 1 ? '' : 's'}${T.tsh ? ` and ${T.tsh} shards` : ''}`, '#ffd27a');
  netPost(`${ico('gold')} Traded with <b>${esc(pName(T.with))}</b>: gave ${mine.length} item(s), got ${got.length}`); calcStats(); saveGame(); }
{ const _uTR = update; update = function (dt) { _uTR(dt); tradeTick(dt); }; }
setInterval(() => { if (G.menu === 'trade') tradeTick(.25, true); }, 250);   // menus pause the game loop, the trade clock keeps running
let TR_TT = 0; function tradeTick(dt, fromTimer) { if (!TR || !TR.cd) return; if (!fromTimer && G.menu === 'trade') return; TR.cd -= dt; const el = document.getElementById('trcd'); if (el) el.textContent = Math.max(1, Math.ceil(TR.cd));
  if (TR.cd <= 0) { TR.cd = 0; tradeExec(); } }
{ const _nrTR = netRecv; netRecv = function (c, m) { _nrTR(c, m); if (!m || !['treq', 'tok', 'tno', 'toff', 'tlock', 'tacc', 'tcan', 'tdone'].includes(m.t) || (m.to && m.to !== NET.id)) return; const from = cleanId(m.from);
  if (m.t === 'treq') { if (!G.plaza || TR || G.mode !== 'play') { duelSend(from, { t: 'tno', why: G.plaza ? 'busy' : 'not in the Plaza' }); return; }
    mpAsk('trade:' + from, `${ico('gold')} <b>${esc(String(m.name || pName(from)).slice(0, 18))}</b> wants to trade with you.`, () => { if (TR || !G.plaza) return; duelSend(from, { t: 'tok' }); tradeOpen(from); }, () => duelSend(from, { t: 'tno', why: 'declined' }), 20); return; }
  if (m.t === 'tok' && NET.pendingTrade === from) { NET.pendingTrade = null; if (!TR && G.plaza) tradeOpen(from); else duelSend(from, { t: 'tcan', why: 'busy' }); return; }
  if (m.t === 'tno' && NET.pendingTrade === from) { NET.pendingTrade = null; toast(`${ico('gold')} ${esc(pName(from))}: ${m.why === 'declined' ? 'trade declined' : esc(String(m.why || 'busy'))}`, '#9ab0d0'); return; }
  if (!TR || TR.with !== from) return;
  if (m.t === 'toff') { const items = (Array.isArray(m.items) ? m.items.slice(0, TRADE_MAX) : []).map(giftClean).filter(Boolean); TR.theirs = items; TR.tsh = clamp(m.sh | 0, 0, 1e9); TR.tver = m.ver | 0; TR.lock = TR.tlock = TR.acc = TR.tacc = false; TR.cd = 0; if (G.menu === 'trade') renderMenu(); return; }
  if (m.t === 'tlock') { TR.tlock = !!m.on && (m.ver | 0) === TR.tver && (m.tver | 0) === TR.ver; if (!TR.tlock) { TR.tacc = false; TR.cd = 0; } if (G.menu === 'trade') renderMenu(); return; }
  if (m.t === 'tacc') { if ((m.ver | 0) === TR.tver && (m.tver | 0) === TR.ver && TR.tlock) { TR.tacc = true; tradeCheck(); } if (G.menu === 'trade') renderMenu(); return; }
  if (m.t === 'tcan') { tradeCancel(m.why ? `${pName(from)}: ${String(m.why).slice(0, 40)}` : `${pName(from)} cancelled`, true); return; } }; }
{ const _nrTR2 = netRecv; netRecv = function (c, m) { _nrTR2(c, m); if (m && m.t === 'bye' && TR && TR.with === cleanId(m.id)) tradeCancel('they left the room', true); }; }
{ const _cmTR = closeMenu; closeMenu = function () { const was = G.menu; if (was === 'trade' && TR && TR.cd) { toast('The trade is finishing — hold on a moment', '#ffd27a'); return; } _cmTR(); if (was === 'trade' && TR) tradeCancel('closed the trade window'); }; }
function trCell(it, click, theirs, i) { return `<div class="cell trc" style="border-color:${RAR[it.r].c}" ${theirs ? `onmouseenter="tradeTip(${i},event)"` : `onmouseenter="tipItem(${it.id},event)"`} onmousemove="moveTip(event)" onmouseleave="hideTip()" ${click ? `onclick="${click}"` : ''}>${icon(it)}<span class="trv">${fmt(tradeVal(it))}</span></div>`; }
function tradeTip(i, ev) { const it = TR && TR.theirs[i]; if (!it) return; tip.innerHTML = `<div class="tc">${itemTip(it, 1)}<div class="dim" style="margin-top:4px">Trade value <b style="color:#ffd27a">${fmt(tradeVal(it))}</b></div></div>`; tip.style.display = 'flex'; moveTip(ev); }
MENUS.trade = () => { if (!TR) return `<h2>${ico('gold')} Trade</h2><div class="card">No trade open.</div><span class="btn" onclick="closeMenu()">Close</span>`;
  const mine = myOffer(), vM = offerVal(mine, TR.sh), vT = offerVal(TR.theirs, TR.tsh), f = fairness(vM, vT), them = pName(TR.with), bag = S.inv.filter(it => !TR.mine.includes(it.id)).sort((a, b) => tradeVal(b) - tradeVal(a));
  const slots = (list, click, theirs) => Array.from({ length: TRADE_MAX }, (_, i) => list[i] ? trCell(list[i], click ? click(list[i]) : '', theirs, i) : '<div class="cell trc empty"></div>').join('');
  const pct = vM + vT ? vM / (vM + vT) * 100 : 50;
  const stat = (l, a) => `<span class="trst ${a ? 'on' : ''}">${a ? '✓ ' : ''}${l}</span>`;
  return `<h2>${ico('gold')} Trade with <span style="color:#9ad0ff">${esc(them)}</span> <span class="dim" style="font-size:13px">values must be within ${Math.round((1 - TRADE_FAIR) * 100)}%</span></h2>
  <div class="trw"><div class="card trside"><div class="trh"><b>Your offer</b> <span class="trval">${fmt(vM)}</span></div><div class="trgrid">${slots(mine, it => `tradeRem(${it.id})`)}</div>
      <div class="trsh">${ico('sparkle')} Shards <span class="btn" onclick="tradeShards(-${Math.max(1, Math.round((S.shards | 0) / 20))})">−</span> <b>${fmt(TR.sh)}</b> <span class="btn" onclick="tradeShards(${Math.max(1, Math.round((S.shards | 0) / 20))})">+</span> <span class="dim">of ${fmt(S.shards | 0)}</span></div>
      <div class="trflags">${stat('Ready', TR.lock)}${stat('Accepted', TR.acc)}</div></div>
    <div class="trmid"><div class="trmeter"><i style="width:${pct}%"></i></div><div class="trfair" style="color:${f.col}">${f.txt}</div><div class="dim" style="font-size:11.5px">${vM + vT ? `${Math.round(f.r * 100)}% match` : ''}</div>
      ${TR.cd ? `<div class="trcd">Trading in <b id="trcd">${Math.ceil(TR.cd)}</b>…</div>` : ''}
      <span class="btn ${TR.lock ? 'on' : ''} ${TR.cd ? 'dis' : ''}" onclick="tradeLock()">${TR.lock ? 'Unready' : 'Ready'}</span>
      <span class="btn ${TR.lock && TR.tlock && f.ok && !TR.acc ? '' : 'dis'}" onclick="tradeAccept()">${TR.acc ? 'Accepted' : 'Accept'}</span>
      <span class="btn ${TR.cd ? 'dis' : ''}" onclick="tradeCancel('cancelled')">Cancel</span></div>
    <div class="card trside"><div class="trh"><b>${esc(them)}'s offer</b> <span class="trval">${fmt(vT)}</span></div><div class="trgrid">${slots(TR.theirs, null, true)}</div>
      <div class="trsh">${ico('sparkle')} Shards <b>${fmt(TR.tsh)}</b></div><div class="trflags">${stat('Ready', TR.tlock)}${stat('Accepted', TR.tacc)}</div></div></div>
  <div class="card"><b>${ico('bag')} Your bag</b> <span class="dim">click to offer • locked items stay home • equipped gear can't be traded</span><div class="trbag">${bag.map(it => trCell(it, `tradeAdd(${it.id})`)).join('') || '<span class="dim">Your bag is empty.</span>'}</div></div>`; };
// ---------- Plaza menus ----------
MENUS.plazagate = () => `<h2>${ico('gold')} The Trading Plaza</h2><div class="card">Through this gate lies the market square where adventurers trade gear. Every item has a <b>trade value</b>; a trade only goes through when both offers are within ${Math.round((1 - TRADE_FAIR) * 100)}% of each other, and both of you must press Ready and then Accept.<div class="dim" style="margin-top:4px">Appraiser Quill can value your items any time — and runs the Plaza Exchange, even when you're alone.</div></div>
  <span class="btn" onclick="plazaEnter()">${ico('door')} Enter the Plaza</span> <span class="btn" onclick="closeMenu()">Not now</span>`;
MENUS.plazaexit = () => `<h2>${ico('door')} Leave the Plaza</h2><div class="card">Head back to Haven's square?</div><span class="btn" onclick="plazaLeave()">Back to Haven</span> <span class="btn" onclick="closeMenu()">Stay</span>`;
MENUS.tradeboard = () => { const on = netOn(), peers = on ? plazaPeers() : [], hist = S.trades || [];
  return `<h2>${ico('scroll')} Trade Board</h2>
  <div class="card"><b>Traders in the Plaza</b> ${!on ? `<div class="dim">You're playing alone — open ${ico('globe')} Multiplayer (☰ Menu) to host or join a room, then meet your friends here.</div><span class="btn" onclick="openMenu('mp')">Open Multiplayer</span>` : peers.length ? peers.map(p => `<div class="smrow"><b style="color:${esc(p.col)}">${esc(p.name)}</b> <span class="dim">Lv ${p.lvl}</span><span style="flex:1"></span><span class="btn" onclick="closeMenu();tradeAsk('${cleanId(p.id)}')">${ico('gold')} Trade</span><span class="btn" onclick="closeMenu();inspAsk('${cleanId(p.id)}')">${ico('eye')}</span></div>`).join('') : '<div class="dim">Nobody else is here yet. Friends in your room can walk in through the west gate in Haven.</div>'}</div>
  <div class="card"><b>How trading works</b><div class="dim">1. Press Trade next to a player (or type /trade name). 2. Both of you click items from your bags (up to ${TRADE_MAX}) and add shards. 3. The meter shows both values — the trade is only allowed when they're within ${Math.round((1 - TRADE_FAIR) * 100)}%. 4. Both press <b>Ready</b>, then <b>Accept</b>; after a 3-second countdown the items swap. Changing anything restarts the steps, so nobody can switch items at the last second.</div></div>
  <div class="card"><b>Your recent trades</b>${hist.length ? hist.slice(0, 6).map(t => `<div class="smrow"><span class="dim" style="width:110px">${new Date(t.at).toLocaleDateString()}</span><span>with <b>${esc(t.with)}</b>: gave ${t.gave.map(([n, r]) => `<span style="color:${(RAR[r] || RAR[0]).c}">${esc(n)}</span>`).join(', ') || '—'}${t.sh ? ` +${t.sh} shards` : ''} • got ${t.got.map(([n, r]) => `<span style="color:${(RAR[r] || RAR[0]).c}">${esc(n)}</span>`).join(', ') || '—'}${t.tsh ? ` +${t.tsh} shards` : ''}</span></div>`).join('') : '<div class="dim">No trades yet.</div>'}</div>
  <span class="btn" onclick="closeMenu()">Close</span>`; };
// Appraiser Quill: value guide + the Plaza Exchange (junk for one better item)
let EXC = [];
function excToggle(id) { const it = S.inv.find(i => i.id === id); if (!it) return; if (EXC.includes(id)) EXC = EXC.filter(x => x !== id); else { if (it.locked) return toast('Locked items stay with you', '#ff8a8a'); if (EXC.length >= 8) return toast('Up to 8 items at once', '#ff8a8a'); EXC.push(id); } hideTip(); sfx('click'); renderMenu(); }
function excResult() { const items = EXC.map(id => S.inv.find(i => i.id === id)).filter(Boolean), v = items.reduce((a, it) => a + tradeVal(it), 0) * .7; let r = -1; for (let i = 0; i < TV_BASE.length; i++) if (TV_BASE[i] <= v) r = i; return { items, v, r: Math.min(r, (S.maxDiff | 0) >= 2 ? TV_BASE.length - 1 : 8) }; }
function excDo() { const x = excResult(); if (x.r < 0 || x.items.length < 2) return toast('Offer at least two items worth a Common or more', '#ff8a8a'); if (x.r <= Math.max(...x.items.map(i => i.r))) return toast('The exchange only gives you something RARER than what you put in — add more', '#ff8a8a');
  if (x.items.some(i => i.r >= 4) && !confirm(`Exchange ${x.items.length} items (including Legendary or better) for one ${RAR[x.r].n} item?`)) return;
  for (const it of x.items) S.inv.splice(S.inv.indexOf(it), 1); EXC = []; const it = genItem(regionPw() + 1, { r: x.r }); it.isNew = true; S.inv.push(it); noteFound(it); S.stats.exch = (S.stats.exch || 0) + 1; sfx('legend'); banner('Plaza Exchange', `You received ${RAR[it.r].n} ${it.name}`, RAR[it.r].c); saveGame(); renderMenu(); }
MENUS.appraise = () => { EXC = EXC.filter(id => S.inv.some(i => i.id === id)); const x = excResult(), bag = S.inv.slice().sort((a, b) => tradeVal(b) - tradeVal(a));
  return `<h2>${ico('gem')} Appraiser Quill</h2><div class="dim">"Rarity is most of it — then upgrades, how well the bonuses rolled, legendary powers, sets and sockets."</div>
  <div class="card"><b>Value guide</b><div class="tvg">${RAR.map((R, i) => `<span style="color:${R.c}">${R.n} <b>~${fmt(TV_BASE[i] || 0)}</b></span>`).join('')}<span>${ico('sparkle')} 1 shard = ${SHARD_TV}</span></div></div>
  <div class="card"><b>${ico('loop')} Plaza Exchange</b> <span class="dim">pick 2–8 items: Quill gives you ONE random item of the best rarity worth about 70% of their value (always rarer than what you put in)</span>
    <div class="trbag">${bag.map(it => `<div class="cell trc ${EXC.includes(it.id) ? 'sel' : ''}" style="border-color:${RAR[it.r].c}" onmouseenter="tipItem(${it.id},event)" onmousemove="moveTip(event)" onmouseleave="hideTip()" onclick="excToggle(${it.id})">${icon(it)}<span class="trv">${fmt(tradeVal(it))}</span></div>`).join('') || '<span class="dim">Your bag is empty.</span>'}</div>
    <div style="margin-top:6px">${x.items.length ? `Offering <b>${x.items.length}</b> worth <b style="color:#ffd27a">${fmt(Math.round(x.v / .7))}</b> → ${x.r >= 0 ? `<b style="color:${RAR[x.r].c}">${RAR[x.r].n}</b> item` : 'not enough yet'}` : '<span class="dim">Click items above to select them.</span>'} <span class="btn ${x.items.length >= 2 && x.r > Math.max(-1, ...x.items.map(i => i.r)) ? '' : 'dis'}" onclick="excDo()">Exchange</span>${EXC.length ? ' <span class="btn" onclick="EXC=[];renderMenu()">Clear</span>' : ''}</div></div>
  <span class="btn" onclick="closeMenu()">Close</span>`; };
// ---------- quick access: party frames, chat, the MP menu ----------
{ const _uhTR = updateHUD; updateHUD = function (dt) { _uhTR(dt); if (typeof PF === 'undefined' || PF.style.display === 'none' || !G.plaza) return; const rows = [...PF.querySelectorAll('.pfr')].filter(r => !r.classList.contains('me')), ps = [...NET.players.values()];
  rows.forEach((r, i) => { const p = ps[i], a = r.querySelector('.pfa'); if (!p || !a || a.querySelector('.pftr') || p.area !== 'plaza') return; const b = document.createElement('span'); b.className = 'pfab pftr'; b.title = 'Trade'; b.innerHTML = ico('gold'); b.onclick = () => tradeAsk(p.id); a.prepend(b); }); }; }
{ const _ncTR = netChat; netChat = function (text) { const t = String(text || '').trim(); const m = /^\/trade\s*(.*)$/i.exec(t); if (!m) return _ncTR(text); const p = findPlayer(m[1]); if (!p) { if (typeof chatAdd === 'function') chatAdd(`<span class="dim">${m[1] ? `No player called "${esc(m[1])}"` : 'Who? For example /trade Mira'}</span>`); return; } tradeAsk(p.id); }; }
ACH.push({ id: 'trade1', n: 'Merchant at Heart', d: 'Complete a trade in the Trading Plaza', c: () => S.stats.trades || 0, need: 1, sp: 1 }, { id: 'trade10', n: 'Plaza Regular', d: 'Complete 10 trades', c: () => S.stats.trades || 0, need: 10, sp: 2 }, { id: 'exch5', n: 'Upcycler', d: 'Use the Plaza Exchange 5 times', c: () => S.stats.exch || 0, need: 5, sp: 1 });
WIKI_TXT.world.push(['The Trading Plaza', 'Walk through the gate on Haven\'s west wall. Trade with any player in your room who is also in the Plaza (Trade Board, party frames or /trade name). Each side offers up to 6 items plus shards; every item has a trade value from its rarity, upgrades, bonus quality, powers, set and sockets, and a trade is only allowed when both sides are within 30%. Both press Ready, then Accept, and the swap happens after a 3-second countdown — any change restarts the steps. Appraiser Quill shows values and runs the Plaza Exchange: give 2–8 items, get one rarer item worth about 70% of them.']);
{ const st = document.createElement('style'); st.textContent = `
.trw{display:grid;grid-template-columns:1fr 210px 1fr;gap:10px;align-items:stretch}.trside{margin:0!important}.trh{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.trval{font:700 18px var(--f-num,'Trebuchet MS');color:#ffd27a}
.trgrid{display:grid;grid-template-columns:repeat(3,56px);gap:6px;justify-content:center}.trc{position:relative;width:54px!important;height:54px!important;cursor:pointer}.trc.empty{opacity:.35;cursor:default;border-style:dashed!important}.trc.sel,.trbag .cell.trc.sel{outline:3px solid #ffd27a!important;outline-offset:1px;box-shadow:0 0 14px #ffd27a!important;transform:translateY(-2px)}
.trv{position:absolute;right:2px;bottom:1px;font:700 9.5px var(--f-num,'Trebuchet MS');color:#ffe2a8;text-shadow:0 1px 2px #000}
.trsh{display:flex;align-items:center;gap:6px;justify-content:center;margin-top:8px;font-size:13px}.trflags{display:flex;gap:6px;justify-content:center;margin-top:6px}.trst{font-size:11.5px;padding:2px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.15);color:#9a8a70}.trst.on{color:#0b0910;background:#7aff9a;border-color:#7aff9a;font-weight:700}
.trmid{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center}.trmeter{width:100%;height:12px;border-radius:6px;background:rgba(122,170,255,.35);overflow:hidden;border:1px solid rgba(214,168,82,.4)}.trmeter i{display:block;height:100%;background:linear-gradient(90deg,#ffd27a,#ffb04a)}
.trfair{font:700 15px var(--f-head,'Georgia')}.trcd{font:700 16px var(--f-head,'Georgia');color:#7aff9a}.trbag{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.tvg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12.5px;margin-top:4px}`; document.head.appendChild(st); }

// round colliders in the plaza (fountain and trade tables) — solid tiles would draw wall blocks
const PLZ_COL = [[PLZ.fount.x, PLZ.fount.y, 1.6], ...PLZ.tables.map(t => [t.x, t.y, 1.0])];
{ const _uPc = update; update = function (dt) { _uPc(dt); if (!G.plaza || !P) return; for (const [cx, cy, r] of PLZ_COL) { const dx = P.x - cx * TILE, dy = P.y - cy * TILE, d = Math.hypot(dx, dy), R = r * TILE + (P.r || 12); if (d < R && d > .01) { P.x = cx * TILE + dx / d * R; P.y = cy * TILE + dy / d * R; } } }; }
// the top-left panel names the Plaza
{ const _uhPn = updateHUD; updateHUD = function (dt) { _uhPn(dt); if (!G.plaza) return; const a = document.getElementById('h-reg'), b = document.getElementById('h-sub'); if (a) setH(a, 'reg', 'Trading Plaza'); if (b) setH(b, 'sub', `<span class="dim">${netOn() ? `${plazaPeers().length} other trader${plazaPeers().length === 1 ? '' : 's'} here` : 'Trade with friends in your room'}</span>`); }; }
