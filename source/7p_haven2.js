// ================= HAVEN 2: the cabbage cart, the teahouse behind the garden gate, and the tile game =================
// Everything lives in this file: town props, the gate riddle, the teahouse interior, the old tea master,
// and the board game (vs. the house or a friend over the multiplayer relay).
const HV2 = { cart: { x: 10.6, y: 14.6, r: .62 }, gate: { x: 34.5, y: 16.5 }, broken: 0, grp: null };
function hv2S() { S.hv2 = S.hv2 || { cab: 0, gate: false, teas: 0, psWins: 0, psGames: 0 }; return S.hv2; }
TITLES.push({ k: 'cabbage', n: 'Friend of Cabbages', c: () => S && S.hv2 && S.hv2.cab >= 10, how: 'Ruin a certain merchant\'s day ten times' },
  { k: 'lotus', n: 'of the White Lotus', c: () => S && S.hv2 && S.hv2.psWins >= 5, how: 'Win five games at the teahouse table' });

// ---------- the teahouse interior is its own little map ----------
{ const _gT = genTown; genTown = function () { if (!G.teahouse) return _gT(); const m = makeMap(38, 28); m.kind = 'town'; carve(m, 13, 9, 12, 9); m.rooms = [{ x: 13, y: 9, w: 12, h: 9, cx: 18, cy: 13 }]; return m; }; }
function hv2Enter() { G.teaGo = true; closeMenu(); sfx('shrine'); goTown(); }
function hv2Leave() { G.teahouse = false; goTown(); placePlayer(32, 16); const g = G.npcs.find(n => n.hv2 === 'gate'); if (g) g.near = true; }
{ const _gtH = goTown; goTown = function () {
  G.teahouse = !!G.teaGo; G.teaGo = false; _gtH();
  if (G.teahouse) {
    G.npcs = [{ n: 'Tile table', x: 17.5, y: 12.5, col: '#e8d6a8', menu: 'paisho', hv2: 'table' }, { n: 'The tea master', x: 22.5, y: 10.6, col: '#d89a4a', menu: 'teamaster', hv2: 'tea' }]
      .map(n => ({ ...n, x: n.x * TILE, y: n.y * TILE, near: false }));
    G.vill = []; placePlayer(18, 16); banner('The Jasmine Dragon', 'Tea, tiles and quiet company', '#e8c27a'); buildLevel();
  } else if (!G.npcs.some(n => n.hv2)) G.npcs.push({ n: 'Doorkeeper', x: HV2.gate.x * TILE, y: HV2.gate.y * TILE, col: '#9ab070', menu: 'teagate', hv2: 'gate', near: false });
}; }
{ const _efH = enterFloor; enterFloor = function () { G.teahouse = false; return _efH.apply(this, arguments); }; }
{ const _naH = netArea; netArea = function () { return G.teahouse && S && G.mode !== 'title' ? 'teahouse' : _naH(); }; }

// ---------- 3D: town props (teahouse front, doorkeeper, cabbage cart) and the interior ----------
{ const _btH = buildTown; buildTown = function () {
  if (G.teahouse) { hv2Interior(); return; }
  const keep = G.npcs; G.npcs = keep.filter(n => !n.hv2); try { _btH(); } finally { G.npcs = keep; }
  try { hv2TownProps(); } catch (e) { console.warn('haven props', e); }
}; }
function hv2Fig(o, x, z, face) { const h = makeHumanoid(o); h.g.position.set(x, 0, z); h.g.rotation.y = face; R3.lvl.add(h.g); const t0 = x * 3.7;
  R3.anim.push(() => { if (typeof applyPose !== 'function' || !h.hips) return; const q = blankPose(); q.rootY = Math.sin(G.t * 2 + t0) * .006; q.headYaw = Math.sin(G.t * .6 + t0) * .25; applyPose(h, q); }); return h; }
function hv2Lantern(x, y, z, col) { mk(GEO.cylL, mat('#2a1a10'), .012, .18, .012, x, y + .2, z, R3.lvl, false); const l = mk(GEO.sph, mat(col, { em: 2.2 }), .1, .14, .1, x, y, z, R3.lvl, false); R3.flames.push(l); R3.torches.push({ x, y, z, col }); }
function hv2TownProps() {
  const L = R3.lvl, wood = mat('#6a4428'), dark = mat('#3a2416'), green = mat('#3f6a3a', { rough: .6 }), red = mat('#9a2a20');
  // teahouse front on the east edge
  const gx = HV2.gate.x + 1.05, gz = HV2.gate.y;
  mk(GEO.box, mat('#c9b48a'), .3, 2.1, 2.6, gx + .25, 1.05, gz, L);
  mk(GEO.box, dark, .32, 1.5, 1.1, gx + .12, .75, gz, L); mk(GEO.box, mat('#1a0f08'), .1, 1.36, .96, gx - .02, .7, gz, L, false);
  for (const s of [-1, 1]) mk(GEO.box, red, .18, 1.9, .16, gx, .95, gz + s * .66, L);
  const roof = mk(GEO.box, green, .9, .12, 3.0, gx - .2, 2.08, gz, L); roof.rotation.z = -.32;
  for (const s of [-1, 1]) { const tip = mk(GEO.coneL, green, .1, .3, .1, gx - .55, 2.0, gz + s * 1.5, L); tip.rotation.x = s * -.9; }
  mk(GEO.box, mat('#2a1a10'), .06, .38, .9, gx - .14, 1.72, gz, L); mk(GEO.box, mat('#e8c27a', { em: .5 }), .07, .22, .72, gx - .16, 1.72, gz, L, false);
  hv2Lantern(gx - .3, 1.45, gz - .95, '#ffb050'); hv2Lantern(gx - .3, 1.45, gz + .95, '#ffb050');
  hv2Fig({ body: '#4f6a46', hatType: 'hair', hair: '#e0ddd0', skin: '#e2c09a' }, HV2.gate.x + .15, gz + .8, Math.PI);
  // the cabbage cart: plank bed, spoked wheels, a striped canopy, and a heaped load of leafy cabbages
  const g = new T3.Group(); g.position.set(HV2.cart.x, 0, HV2.cart.y); g.rotation.y = .4; L.add(g); HV2.grp = g;
  const plank = mat('#8a6238', { rough: .85 }), plank2 = mat('#76522e', { rough: .85 }), iron = mat('#3a3a40', { metal: .7, rough: .45 });
  for (let k = 0; k < 5; k++) mk(GEO.box, k % 2 ? plank : plank2, 1.14, .05, .14, 0, .5, -.28 + k * .14, g);
  for (const s2 of [-1, 1]) { for (let k = 0; k < 2; k++) mk(GEO.box, k ? plank : plank2, 1.14, .09, .04, 0, .58 + k * .1, s2 * .35, g); mk(GEO.box, plank2, .04, .19, .74, s2 * .55, .63, 0, g); }
  for (const s2 of [-1, 1]) { const wg = new T3.Group(); wg.position.set(-.12, .27, s2 * .42); g.add(wg);
    const rim = mk(GEO.tor, plank2, .26, .26, .4, 0, 0, 0, wg); for (let k = 0; k < 6; k++) { const sp = mk(GEO.box, plank, .02, .48, .03, 0, 0, 0, wg); sp.rotation.z = k * Math.PI / 6; }
    mk(GEO.cyl, iron, .05, .08, .05, 0, 0, 0, wg).rotation.x = Math.PI / 2; }
  for (const s2 of [-1, 1]) { const sh = mk(GEO.box, plank, .9, .045, .045, .95, .44, s2 * .18, g); sh.rotation.z = -.12; }
  mk(GEO.box, plank2, .05, .44, .05, .5, .22, -.28, g); mk(GEO.box, plank2, .05, .44, .05, .5, .22, .28, g);
  for (const [px, pz] of [[-.5, -.3], [-.5, .3], [.5, -.3], [.5, .3]]) mk(GEO.cylL, plank2, .02, .9, .02, px, 1.05, pz, g);
  for (let k = 0; k < 6; k++) mk(GEO.box, mat(k % 2 ? '#e8dcc0' : '#6a8a4a', { rough: .9 }), .2, .03, .76, -.5 + k * .2, 1.52 + Math.sin(k / 5 * Math.PI) * .05, 0, g);
  // cabbage: a pale core wrapped in curled leaves (built once, instanced)
  if (!HV2.cabGeo) { const parts = [], add = (geo, col, m4) => { geo = geo.toNonIndexed(); geo.applyMatrix4(m4); const n = geo.attributes.position.count, cc = new Float32Array(n * 3), c3 = new T3.Color(col); for (let q = 0; q < n; q++) { cc[q * 3] = c3.r; cc[q * 3 + 1] = c3.g; cc[q * 3 + 2] = c3.b; } geo.setAttribute('color', new T3.BufferAttribute(cc, 3)); parts.push(geo); };
    const M4 = () => new T3.Matrix4(), e = new T3.Euler(), q4 = new T3.Quaternion();
    add(new T3.SphereGeometry(.62, 12, 9), '#cfe3a2', M4().makeScale(1, .92, 1));
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, leaf = new T3.SphereGeometry(1, 10, 7, 0, 1.5, .15, 1.75); e.set(-.35 - (k % 2) * .15, a, 0); q4.setFromEuler(e);
      add(leaf, k % 2 ? '#7fb24e' : '#93c25e', M4().compose(new T3.Vector3(Math.sin(a) * .08, -.05, Math.cos(a) * .08), q4, new T3.Vector3(.78, .74, .78))); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .4, leaf = new T3.SphereGeometry(1, 8, 6, 0, 1.3, .9, 1.2); e.set(.15, a, 0); q4.setFromEuler(e); add(leaf, '#5f9440', M4().compose(new T3.Vector3(0, -.12, 0), q4, new T3.Vector3(.95, .7, .95))); }
    let tot = 0; parts.forEach(p => tot += p.attributes.position.count); const pos = new Float32Array(tot * 3), col = new Float32Array(tot * 3); let o = 0;
    parts.forEach(p => { pos.set(p.attributes.position.array, o * 3); col.set(p.attributes.color.array, o * 3); o += p.attributes.position.count; });
    const G2 = new T3.BufferGeometry(); G2.setAttribute('position', new T3.BufferAttribute(pos, 3)); G2.setAttribute('color', new T3.BufferAttribute(col, 3)); G2.computeVertexNormals(); HV2.cabGeo = G2;
    HV2.cabMat = new T3.MeshStandardMaterial({ vertexColors: true, roughness: .75, side: T3.DoubleSide }); }
  const spots = []; for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 4 - r; c2++) for (let d = 0; d < 3 - r; d++) spots.push([-.39 + c2 * .26 + r * .13, .68 + r * .17, -.22 + d * .22 + r * .11]);
  const cab = new T3.InstancedMesh(HV2.cabGeo, HV2.cabMat, spots.length); cab.castShadow = true; cab.receiveShadow = true;
  spots.forEach(([cx, cy, cz], k) => { const m4 = new T3.Matrix4(), sc = .15 + (k % 3) * .012; m4.compose(new T3.Vector3(cx, cy, cz), new T3.Quaternion().setFromEuler(new T3.Euler((k % 4) * .3, k * 1.7, (k % 3) * .25)), new T3.Vector3(sc, sc, sc)); cab.setMatrixAt(k, m4); });
  g.add(cab);
  // a crate and a basket of spares on the ground
  mk(GEO.box, plank, .4, .32, .4, .2, .16, -.75, g); const sp2 = new T3.InstancedMesh(HV2.cabGeo, HV2.cabMat, 3); [[.12, .38, -.8], [.28, .38, -.7], [.2, .5, -.75]].forEach(([cx, cy, cz], k) => { const m4 = new T3.Matrix4(); m4.compose(new T3.Vector3(cx, cy, cz), new T3.Quaternion().setFromEuler(new T3.Euler(0, k * 2, .3)), new T3.Vector3(.14, .14, .14)); sp2.setMatrixAt(k, m4); }); sp2.castShadow = true; g.add(sp2);
  // the merchant: apron and a wide straw hat
  const mh = hv2Fig({ body: '#6a7a4a', hatType: 'hair', hair: '#2a1a10', skin: '#d8a878' }, HV2.cart.x + .1, HV2.cart.y - .9, -1.2);
  if (mh.head) { const hat = mat('#d8c07a', { rough: .9 }); mk(GEO.cyl, hat, .3, .02, .3, 0, .2, 0, mh.head); mk(GEO.cone, hat, .16, .14, .16, 0, .27, 0, mh.head); }
  if (mh.chest) mk(GEO.box, mat('#e8dcc0', { rough: .9 }), .03, .34, .22, .17, .05, 0, mh.chest);
  R3.anim.push(() => { const b = HV2.broken > G.t; cab.visible = !b; g.rotation.z = b ? .18 : 0; });
}
function hv2Interior() {
  const L = R3.lvl, wood = mat('#6a4428'), dark = mat('#3a2416'), floor = mat('#7a5232', { rough: .8 });
  mk(GEO.box, floor, 12, .02, 9, 19, .011, 13.5, L, false);
  // tea bar along the top wall, shelves of tins behind it
  mk(GEO.box, wood, 4.2, .9, .6, 21.5, .45, 9.9, L); mk(GEO.box, mat('#8a5c34'), 4.3, .06, .7, 21.5, .92, 9.9, L);
  for (let i = 0; i < 10; i++) mk(GEO.cyl, mat(['#3a6a5a', '#8a3a2a', '#c8a050'][i % 3], { metal: .4, rough: .4 }), .09, .2, .09, 19.8 + i * .38, 1.1, 9.35, L);
  mk(GEO.cyl, mat('#4a4a50', { metal: .8, rough: .3 }), .16, .22, .16, 20.6, 1.06, 10, L); mk(GEO.sph, mat('#e8e0d0'), .05, .04, .05, 21.2, 1.0, 10.05, L);
  // the tile table: low table, board top with the classic quartered pattern, cushions
  mk(GEO.cyl, dark, .9, .4, .9, 17.5, .2, 12.5, L);
  const bt = document.createElement('canvas'); bt.width = bt.height = 256; const x = bt.getContext('2d');
  x.fillStyle = '#b48a5c'; x.beginPath(); x.arc(128, 128, 126, 0, 6.3); x.fill();
  for (let q = 0; q < 4; q++) { x.save(); x.translate(128, 128); x.rotate(q * Math.PI / 2); x.fillStyle = 'rgba(140,50,36,.18)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(118, -118 * .42); x.lineTo(118 * .42, -118); x.closePath(); x.fill(); x.restore(); }
  x.strokeStyle = 'rgba(40,20,10,.5)'; x.lineWidth = 1; for (let i = 1; i < 9; i++) { x.beginPath(); x.moveTo(i * 28.4, 0); x.lineTo(i * 28.4, 256); x.stroke(); x.beginPath(); x.moveTo(0, i * 28.4); x.lineTo(256, i * 28.4); x.stroke(); }
  const tex = new T3.CanvasTexture(bt); tex.colorSpace = T3.SRGBColorSpace; const bm = new T3.MeshStandardMaterial({ map: tex, roughness: .6 });
  const top = mk(GEO.circ, bm, .82, 1, .82, 17.5, .415, 12.5, L, false); top.userData.ownMat = true;
  for (const [cx, cz] of [[16.3, 12.5], [18.7, 12.5]]) mk(GEO.cyl, mat('#8a2a3a', { rough: .9 }), .34, .1, .34, cx, .05, cz, L);
  // lanterns, plants, the door out
  for (const [lx, lz] of [[14.2, 10], [23.8, 14], [14.2, 16.5], [23.8, 16.5]]) hv2Lantern(lx, 1.7, lz, '#ffb060');
  for (const [px, pz] of [[13.8, 13.5], [24.2, 11.5]]) { mk(GEO.cyl, mat('#6a3a2a'), .25, .4, .25, px, .2, pz, L); mk(GEO.ico, mat('#3a7a3a', { flat: true }), .45, .55, .45, px, .8, pz, L); }
  mk(GEO.box, mat('#1a0f08'), 1.2, 1.5, .1, 18.5, .75, 17.95, L, false);
  for (const s of [-1, 1]) mk(GEO.box, mat('#9a2a20'), .14, 1.7, .14, 18.5 + s * .65, .85, 17.9, L);
  hv2Fig({ body: '#c8742a', hatType: 'hair', hair: '#d8d4cc', skin: '#e0b48a', cape: '#5a3a1a' }, 22.5, 10.8, Math.PI / 2);
  R3.sun.intensity = .35; R3.hemi.intensity = .55; R3.scene.fog = new T3.Fog('#120c08', 12, 30); R3.scene.background = new T3.Color('#120c08');
}

// ---------- cart: walls you off, a dodge roll smashes it ----------
{ const _uH = update; update = function (dt) { _uH(dt); if (!P || !S || !G.inTown) return;
  if (G.teahouse) { if (P.y > 17.55 * TILE && Math.abs(P.x - 18.5 * TILE) < TILE) hv2Leave(); return; }
  const c = HV2.cart, cx = c.x * TILE, cy = c.y * TILE, d = Math.hypot(P.x - cx, P.y - cy), rr = c.r * TILE + P.r * .6;
  if (d >= rr || HV2.broken > G.t) return;
  if (P.dodgeT > 0) { HV2.broken = G.t + 12; const s = hv2S(); s.cab++; saveGame();
    for (let i = 0; i < 18; i++) G.parts.push({ x: cx + rnd(-15, 15), y: cy + rnd(-15, 15), z: .7, vx: rnd(-160, 160), vy: rnd(-160, 160), vz: rnd(1, 3), g: 6, life: 1.2, max: 1.2, col: ['#7ab84a', '#9ad060', '#5e9a3a'][i % 3], size: 6 });
    dmgText(cx, cy - 40, 'MY CABBAGES!', '#9ad060', true, 2.2); sfx('hurt');
    if (s.cab === 10) toast(ico('star') + ' New title: <b>Friend of Cabbages</b>', '#9ad060');
  } else { const k = rr / Math.max(d, .01); P.x = cx + (P.x - cx) * k; P.y = cy + (P.y - cy) * k; }
}; }

// ---------- the garden gate ----------
function hv2Norm(s) { return String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function hv2Lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
function hv2Answer(t) { const a = hv2Norm(t), want = 'one who has eaten the fruit and tasted its mysteries';
  const words = ['eaten', 'fruit', 'tasted', 'myster'].filter(w => a.includes(w)).length, sim = 1 - hv2Lev(a, want) / want.length; return words >= 3 || sim >= .7; }
function hv2Knock() { const i = document.getElementById('hv2ans'), v = i ? i.value : '';
  if (hv2Answer(v)) { hv2S().gate = true; saveGame(); toast('The doorkeeper smiles and steps aside.', '#e8c27a'); hv2Enter(); }
  else { HV2.wrong = (HV2.wrong || 0) + 1; sfx('error'); renderMenu(); } }
MENUS.teagate = () => {
  const s = hv2S();
  if (s.gate) return `<div class="hv2gate"><h2>The garden gate</h2><p>The doorkeeper recognises you and opens the gate.</p><span class="btn bigb" onclick="hv2Enter()">Go inside</span> <span class="btn" onclick="closeMenu()">Not now</span></div>`;
  return `<div class="hv2gate"><h2>The garden gate</h2><p class="hv2q">"Who knocks at the garden gate?"</p>
  <input id="hv2ans" maxlength="90" autocomplete="off" placeholder="Answer the doorkeeper..." onkeydown="event.stopPropagation();if(event.key==='Enter')hv2Knock()">
  ${HV2.wrong ? `<p class="dim">"I don't know you." The gate stays shut.</p>` : '<p class="dim">The doorkeeper waits, arms folded.</p>'}
  <div><span class="btn" onclick="hv2Knock()">Answer</span> <span class="btn" onclick="closeMenu()">Walk away</span></div></div>`;
};
{ const _rmG = renderMenu; renderMenu = function () { _rmG(); if (G.menu === 'teagate') { const i = document.getElementById('hv2ans'); if (i) setTimeout(() => i.focus(), 30); } }; }
UI3_SMALL.push('teagate', 'psask');

// ---------- the tea master ----------
const HV2_SAY = [
  'Sometimes life is like a dark tunnel. Keep walking, and you will find the light.',
  'Pride is a heavy pack. Set it down and see how far you walk.',
  'A good cup of tea is a small thing. Small things are where peace lives.',
  'You lost today? Then you learned today. Sit, the water is still hot.',
  'Leaves do not hurry to fall, and the tree is never late.',
  'It is wise to draw strength from many places. A single root breaks in the wind.',
  'Hope is something you give yourself. Nobody can hand it to you across the counter.',
  'Even the coldest night is followed by a sunrise. I would know, I have watched many.',
];
MENUS.teamaster = () => { const s = hv2S(), line = HV2_SAY[(s.teas + (HV2.sayI || 0)) % HV2_SAY.length], until = S.teaUntil || 0, on = until > Date.now();
  return `<div class="hv2tea"><h2>The tea master</h2><p class="hv2q">"${line}"</p>
  <p class="dim">${on ? `Your jasmine tea still warms you (${Math.ceil((until - Date.now()) / 60000)} min left): +10% experience.` : 'A cup of jasmine tea restores you and gives +10% experience for 10 minutes.'}</p>
  <div><span class="btn ${on ? 'dis' : ''}" onclick="hv2Tea()">Share a cup of jasmine tea</span> <span class="btn" onclick="HV2.sayI=(HV2.sayI||0)+1;renderMenu()">Ask for advice</span> <span class="btn" onclick="closeMenu()">Leave</span></div></div>`; };
function hv2Tea() { if ((S.teaUntil || 0) > Date.now()) return; const s = hv2S(); s.teas++; S.teaUntil = Date.now() + 600000; calcStats(); P.hp = ST.maxHp; P.mp = ST.maxMp; sfx('shrine'); toast('Jasmine tea: +10% experience for 10 minutes', '#e8c27a'); saveGame(); renderMenu(); }
{ const _csH = calcStats; calcStats = function () { const r = _csH.apply(this, arguments); if (S && (S.teaUntil || 0) > Date.now()) ST.xp = (ST.xp || 0) + 10; return r; }; }
{ let chk = 0; const _uT = update; update = function (dt) { _uT(dt); if (S && S.teaUntil && (chk -= dt) <= 0) { chk = 5; if (S.teaUntil < Date.now()) { S.teaUntil = 0; calcStats(); } } }; }

// ---------- the tile game ----------
// 7x7 board with the corners cut off (37 points). Each player holds 6 flowers and 1 white lotus.
// Place every tile from your hand first; after that, move one tile to a neighbouring free point.
// Four in a line (any direction) is a harmony and wins. A lotus counts for either player.
const PSG = { on: false, mode: null, me: 0, opp: null, oppName: '', turn: 0, b: null, hand: null, win: -1, n: 0, sel: -1, pend: null };
const psOK = i => { const x = i % 7, y = (i / 7) | 0; return Math.abs(x - 3) + Math.abs(y - 3) <= 4; };
const PS_DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
function psNew(mode, me, opp, name) { Object.assign(PSG, { on: true, mode, me, opp, oppName: name || 'The house', turn: 0, b: new Array(49).fill(-1), hand: [{ f: 6, l: 1 }, { f: 6, l: 1 }], win: -1, n: 0, sel: -1 }); }
function psOwn(v, p) { return v === p || v === 2; }   // 0/1 = player flowers, 2 = lotus
function psWins(b, p) { for (let i = 0; i < 49; i++) { if (!psOK(i)) continue; const x = i % 7, y = (i / 7) | 0;
  for (const [dx, dy] of PS_DIRS) { let k = 0, f = 0; for (; k < 4; k++) { const xx = x + dx * k, yy = y + dy * k, j = yy * 7 + xx; if (xx < 0 || yy < 0 || xx > 6 || yy > 6 || !psOK(j) || !psOwn(b[j], p)) break; if (b[j] === p) f++; } if (k === 4 && f >= 1) return true; } } return false; }
function psMoves(st, p) { const out = [], h = st.hand[p];
  if (h.f + h.l > 0) { for (let i = 0; i < 49; i++) if (psOK(i) && st.b[i] < 0) { if (h.f) out.push({ k: 'p', i, t: p }); if (h.l) out.push({ k: 'p', i, t: 2 }); } return out; }
  for (let i = 0; i < 49; i++) { if (st.b[i] !== p) continue; const x = i % 7, y = (i / 7) | 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy, j = yy * 7 + xx; if (xx >= 0 && yy >= 0 && xx < 7 && yy < 7 && psOK(j) && st.b[j] < 0) out.push({ k: 'm', i, j }); } }
  return out; }
function psApply(st, p, mv) { const b = st.b.slice(), hand = st.hand.map(h => ({ ...h }));
  if (mv.k === 'p') { b[mv.i] = mv.t; if (mv.t === 2) hand[p].l--; else hand[p].f--; } else { b[mv.j] = b[mv.i]; b[mv.i] = -1; } return { b, hand }; }
function psLegal(p, mv) { return psMoves(PSG, p).some(m => m.k === mv.k && m.i === mv.i && (m.k === 'p' ? m.t === mv.t : m.j === mv.j)); }
function psPlay(p, mv, remote) {
  if (!PSG.on || PSG.win >= 0 || PSG.turn !== p || !psLegal(p, mv)) return false;
  const r = psApply(PSG, p, mv); PSG.b = r.b; PSG.hand = r.hand; PSG.n++; PSG.sel = -1; sfx('click');
  if (psWins(PSG.b, p)) PSG.win = p; else if (PSG.n >= 90) PSG.win = 2; else { PSG.turn = 1 - p; if (!psMoves(PSG, PSG.turn).length) PSG.turn = p; }
  if (!remote && PSG.mode === 'net') duelSend(PSG.opp, { t: 'psmv', mv });
  if (PSG.win >= 0) psOver();
  if (G.menu === 'paisho') renderMenu();
  if (PSG.mode === 'bot' && PSG.win < 0 && PSG.turn !== PSG.me) setTimeout(psBot, 550);
  return true; }
function psOver() { const s = hv2S(); s.psGames++; if (PSG.win === PSG.me) { s.psWins++; sfx('legend'); if (s.psWins === 5) toast(ico('star') + ' New title: <b>of the White Lotus</b>', '#e8c27a'); } saveGame(); }
function psScore(b, p) { let sc = 0; for (let i = 0; i < 49; i++) { if (!psOK(i)) continue; const x = i % 7, y = (i / 7) | 0;
  for (const [dx, dy] of PS_DIRS) { let mine = 0, theirs = 0, ok = true; for (let k = 0; k < 4; k++) { const xx = x + dx * k, yy = y + dy * k, j = yy * 7 + xx; if (xx < 0 || yy < 0 || xx > 6 || yy > 6 || !psOK(j)) { ok = false; break; } if (b[j] === p) mine++; else if (b[j] === 1 - p) theirs++; else if (b[j] === 2) { mine += .6; } }
    if (!ok) continue; if (!theirs) sc += mine * mine; if (!mine) sc -= theirs * theirs * 1.1; } } return sc; }
function psBot() { if (!PSG.on || PSG.win >= 0 || PSG.mode !== 'bot') return; const p = 1 - PSG.me, ms = psMoves(PSG, p); if (!ms.length) return;
  let best = null, bs = -1e9;
  for (const mv of ms) { const r = psApply(PSG, p, mv); if (psWins(r.b, p)) { best = mv; break; }
    const opp = psMoves({ b: r.b, hand: r.hand }, 1 - p); let danger = false; for (const o of opp) { if (psWins(psApply({ b: r.b, hand: r.hand }, 1 - p, o).b, 1 - p)) { danger = true; break; } }
    const s = psScore(r.b, p) - (danger ? 500 : 0) + Math.random() * 1.5 - (mv.t === 2 && PSG.n < 6 ? 3 : 0); if (s > bs) { bs = s; best = mv; } }
  psPlay(p, best); }
function psClick(i) { if (!PSG.on || PSG.win >= 0 || PSG.turn !== PSG.me) return; const h = PSG.hand[PSG.me];
  if (h.f + h.l > 0) { if (PSG.b[i] < 0) psPlay(PSG.me, { k: 'p', i, t: PSG.useLotus && h.l ? 2 : h.f ? PSG.me : 2 }); PSG.useLotus = false; return; }
  if (PSG.b[i] === PSG.me) { PSG.sel = PSG.sel === i ? -1 : i; renderMenu(); return; }
  if (PSG.sel >= 0 && PSG.b[i] < 0) psPlay(PSG.me, { k: 'm', i: PSG.sel, j: i }); }
// tiles are round wooden discs carved with a flower: a red rose, a white jasmine, and the white lotus
const PS_SVG = (() => {
  const petals = (n, r, w, col, rot = 0) => Array.from({ length: n }, (_, i) => `<ellipse cx="0" cy="${-r}" rx="${w}" ry="${r}" fill="${col}" transform="rotate(${rot + i * 360 / n})"/>`).join('');
  const disc = (face, rim) => `<circle r="47" fill="${rim}"/><circle r="41" fill="${face}"/>`;
  // natural wood tiles with carved, nearly monochrome flowers
  const rose = disc('#d9c29a', '#8a6a44') + petals(5, 16, 9, '#8a3a2c') + '<circle r="5" fill="#d9c29a"/>';
  const jasmine = disc('#5a3c26', '#2e1d12') + petals(6, 17, 6.5, '#e6d6b4') + '<circle r="5" fill="#5a3c26"/>';
  const lotus = disc('#efe6d2', '#b09a70') + petals(8, 18, 6, '#d6c6a2', 22.5) + petals(8, 13, 5, '#fbf7ee') + '<circle r="5" fill="#c9a86a"/>';
  const wrap = (g, k) => `<svg class="pst ${k}" viewBox="-50 -50 100 100" aria-hidden="true">${g}</svg>`;
  return { 0: wrap(rose, 'p0'), 1: wrap(jasmine, 'p1'), 2: wrap(lotus, 'l') };
})();
// the board: a wooden circle, a carved grid through the points, faint red and white gardens
const PS_BOARD = (() => {
  const S = 426, c = S / 2, R = 206, at = k => 51 + k * 54; let g = '';
  for (let k = 0; k < 7; k++) { const v = at(k), h = Math.sqrt(Math.max(0, R * R - (v - c) * (v - c))); g += `<line x1="${v}" y1="${c - h}" x2="${v}" y2="${c + h}"/><line x1="${c - h}" y1="${v}" x2="${c + h}" y2="${v}"/>`; }
  const tri = (a, col) => { const p = [[0, 0], [Math.cos(a - .42) * R, Math.sin(a - .42) * R], [Math.cos(a + .42) * R, Math.sin(a + .42) * R]].map(q => (q[0] + c).toFixed(1) + ',' + (q[1] + c).toFixed(1)).join(' '); return `<polygon points="${p}" fill="${col}"/>`; };
  let gard = ''; for (let q = 0; q < 4; q++) { gard += tri(q * Math.PI / 2 + Math.PI / 4, 'rgba(140,50,36,.16)'); gard += tri(q * Math.PI / 2, 'rgba(255,248,230,.22)'); }
  return `<svg class="psbg" viewBox="0 0 ${S} ${S}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${R + 8}" fill="#4a2f1c"/><circle cx="${c}" cy="${c}" r="${R}" fill="#b48a5c"/>${gard}<g stroke="rgba(60,36,20,.45)" stroke-width="1.2">${g}</g><circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#3a2416" stroke-width="2"/></svg>`;
})();
function psTile(v) { return v < 0 ? '' : PS_SVG[v]; }
function psLeave() { if (PSG.on && PSG.mode === 'net' && PSG.win < 0) duelSend(PSG.opp, { t: 'psend' }); PSG.on = false; renderMenu(); }
MENUS.paisho = () => {
  const s = hv2S();
  if (!PSG.on) { const pl = (NET.status === 'host' || NET.status === 'guest') ? [...NET.players.values()] : [];
    return `<div class="hv2ps"><h2>The tile table</h2><p>Place your seven tiles, then move them one step at a time. Four in a line is a harmony and wins. The white lotus counts for both players.</p>
    <div class="hv2psl"><span class="btn bigb" onclick="psNew('bot',0,null);renderMenu()">Play the house</span></div>
    <h4>Play a friend</h4>${pl.length ? pl.map(p => `<div class="hv2pr"><b style="color:${esc(p.col)}">${esc(p.name)}</b><span class="btn" onclick="psInvite('${String(p.id).replace(/[^\w-]/g, '')}')">Invite</span></div>`).join('') : '<p class="dim">Join a multiplayer room to invite friends to a game.</p>'}
    <p class="dim">Games won here: ${s.psWins} of ${s.psGames}</p><span class="btn" onclick="closeMenu()">Leave the table</span></div>`; }
  const me = PSG.me, h = PSG.hand, myTurn = PSG.turn === me && PSG.win < 0, place = h[me].f + h[me].l > 0;
  const status = PSG.win === 2 ? 'The garden is still. A draw.' : PSG.win === me ? 'Harmony! You win.' : PSG.win >= 0 ? `${esc(PSG.oppName)} found harmony first.` : myTurn ? (place ? 'Your turn: place a tile.' : 'Your turn: pick a tile, then a free point next to it.') : `${esc(PSG.oppName)} is thinking...`;
  const cells = PSG.b.map((v, i) => psOK(i) ? `<div class="psc${PSG.sel === i ? ' sel' : ''}${myTurn && (place ? v < 0 : v === me || (PSG.sel >= 0 && v < 0)) ? ' can' : ''}" onclick="psClick(${i})">${psTile(v)}</div>` : '<div class="psx"></div>').join('');
  const handRow = p => `<div class="psh${PSG.turn === p && PSG.win < 0 ? ' on' : ''}"><b>${p === me ? 'You' : esc(PSG.oppName)}</b><span>${PS_SVG[p].repeat(h[p].f)}${h[p].l ? PS_SVG[2] : ''}</span>${h[p].f + h[p].l ? '' : '<em>all tiles in play</em>'}</div>`;
  return `<div class="hv2ps"><h2>The tile table</h2>${handRow(1 - me)}<div class="psb">${PS_BOARD}${cells}</div>${handRow(me)}
  <p class="hv2st">${status}</p><div>${myTurn && place && h[me].l ? `<span class="btn ${PSG.useLotus ? 'on' : ''}" onclick="PSG.useLotus=!PSG.useLotus;renderMenu()">Place the lotus next</span>` : ''}
  ${PSG.win >= 0 ? `<span class="btn" onclick="${PSG.mode === 'bot' ? "psNew('bot',0,null);renderMenu()" : 'psLeave()'}">${PSG.mode === 'bot' ? 'Play again' : 'Back'}</span>` : `<span class="btn" onclick="psLeave()">Resign</span>`} <span class="btn" onclick="closeMenu()">Close</span></div></div>`;
};
// friends: invites and moves ride the duel relay (the host forwards them and stamps who sent them)
DUEL_T.push('psreq', 'psok', 'psno', 'psmv', 'psend');
function psInvite(id) { PSG.pend = id; duelSend(id, { t: 'psreq', name: netName() }); toast('Invitation sent', '#e8c27a'); }
MENUS.psask = () => `<div class="hv2gate"><h2>A game of tiles?</h2><p><b>${esc((PSG.ask || {}).name || 'A friend')}</b> invites you to the tile table.</p><span class="btn" onclick="psAnswer(true)">Play</span> <span class="btn" onclick="psAnswer(false)">Not now</span></div>`;
function psAnswer(yes) { const a = PSG.ask; PSG.ask = null; if (!a) { closeMenu(); return; } if (yes) { duelSend(a.from, { t: 'psok', name: netName() }); psNew('net', 1, a.from, a.name); openMenu('paisho'); } else { duelSend(a.from, { t: 'psno' }); closeMenu(); } }
{ const _nrP = netRecv; netRecv = function (c, m) { _nrP(c, m); if (!m || !m.t || !String(m.t).startsWith('ps') || (m.to && m.to !== NET.id)) return;
  const f = m.from;
  if (m.t === 'psreq') { if (PSG.on || G.menu && !['mp', 'pause', 'paisho'].includes(G.menu) || G.duel) { duelSend(f, { t: 'psno' }); return; } PSG.ask = { from: f, name: String(m.name || 'A friend').slice(0, 18) }; openMenu('psask'); }
  else if (m.t === 'psok' && PSG.pend === f) { PSG.pend = null; psNew('net', 0, f, String(m.name || 'Friend').slice(0, 18)); if (G.menu === 'paisho') renderMenu(); else openMenu('paisho'); }
  else if (m.t === 'psno' && PSG.pend === f) { PSG.pend = null; toast('They can\'t play right now', '#9ab0d0'); }
  else if (m.t === 'psmv' && PSG.on && PSG.mode === 'net' && PSG.opp === f && m.mv) { const v = m.mv, mv = { k: v.k === 'm' ? 'm' : 'p', i: v.i | 0, j: v.j | 0, t: v.t === 2 ? 2 : 1 - PSG.me }; psPlay(1 - PSG.me, mv, true); }
  else if (m.t === 'psend' && PSG.on && PSG.opp === f) { if (PSG.win < 0) { PSG.win = PSG.me; psOver(); } toast(`${esc(PSG.oppName)} left the table`, '#9ab0d0'); if (G.menu === 'paisho') renderMenu(); }
}; }

{ const st = document.createElement('style'); st.id = 'hv2-css'; st.textContent = `
#panel .hv2gate,#panel .hv2tea{text-align:center;padding:4px 8px}
#panel .hv2q{font-size:19px;font-style:italic;color:#efe0b8;margin:10px 0 14px;line-height:1.5}
#panel #hv2ans{width:min(440px,90%);font:16px var(--f-body);padding:9px 12px;border-radius:6px;border:1px solid rgba(214,168,82,.45);background:#100c14;color:var(--text);margin-bottom:6px}
#panel .hv2ps{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
#panel .hv2ps>p{max-width:520px;font-size:14.5px;margin:0}
#panel .hv2ps h4{margin:10px 0 0;font:600 15px var(--f-body);color:var(--text)}
#panel .hv2pr{display:flex;gap:12px;align-items:center;justify-content:space-between;width:min(320px,90%);padding:6px 10px;background:#1a1520;border-radius:6px}
#panel .psb{position:relative;display:grid;grid-template-columns:repeat(7,50px);grid-template-rows:repeat(7,50px);gap:4px;padding:26px;width:426px;height:426px;box-sizing:border-box;filter:drop-shadow(0 12px 22px rgba(0,0,0,.55))}
#panel .psb .psbg{position:absolute;inset:0;width:100%;height:100%}
#panel .psc{border-radius:50%!important;display:grid;place-items:center;position:relative}
#panel .psc::after{content:'';position:absolute;width:5px;height:5px;border-radius:50%!important;background:rgba(50,30,16,.55)}
#panel .psc:has(.pst)::after{display:none}
#panel .psc.can{cursor:pointer}#panel .psc.can:hover{background:rgba(255,240,210,.28)!important}
#panel .psc.sel{box-shadow:0 0 0 2px #f2e6c8!important}
#panel .psx{visibility:hidden}
#panel svg.pst{width:44px;height:44px;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.45))}
#panel .psh{display:flex;gap:10px;align-items:center;min-height:34px;padding:4px 12px;border-radius:999px!important;border:1px solid transparent}
#panel .psh.on{border-color:rgba(214,168,82,.5);background:rgba(214,168,82,.08)}
#panel .psh b{font-size:15px;min-width:74px;text-align:right}#panel .psh span{display:flex;gap:3px}#panel .psh svg.pst{width:26px;height:26px}
#panel .psh em{font-size:13px;color:var(--dim)}
#panel .hv2st{font-size:16px;color:var(--gold2);margin:4px 0}
`; document.head.appendChild(st); }
