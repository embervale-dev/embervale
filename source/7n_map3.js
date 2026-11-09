// ================= MAP v3: crisp high-DPI minimap + pannable / zoomable full map =================
// Replaces drawMini (5b_hud + the marker wrappers in 6e_more / 6f_b / 6f_c) and MENUS.map / drawBigMap (6_ui).
// The static layout (floor, walls, fog) is cached per zoom level in an offscreen canvas and only rebuilt when
// exploration changes; markers are drawn every frame. The camera never rotates, so both maps are north-up.
const map3_ZL = [10, 8, 6.2, 4.8, 3.6, 2.6]; // minimap zoom levels, CSS px per tile
const map3_st = { ver: 1, lastM: null, lastTile: -1, cnt: -1, recT: 0, mz: null, zs: 0, fr: 0, drawn: -1, plate: '', mini: null, big: null, loop: false, font: null };
const map3_V = { s: 0, cx: 0, cy: 0, M: null, lid: -1, drag: null };

// ---------- small helpers ----------
function map3_hex(c) { c = String(c || '#888').replace('#', ''); if (c.length === 3) c = c.split('').map(h => h + h).join(''); const n = parseInt(c.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function map3_mix(a, b, t) { const A = map3_hex(a), B = map3_hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
function map3_rgba(c, a) { const [r, g, b] = map3_hex(c); return `rgba(${r},${g},${b},${a})`; }
function map3_esc(s) { return String(s ?? '').replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch])); }
function map3_dpr() { return Math.min(3, Math.max(1, window.devicePixelRatio || 1)); }
function map3_fonts() { if (map3_st.font) return map3_st.font; const cs = getComputedStyle(document.documentElement); const h = cs.getPropertyValue('--f-head').trim() || "'Cinzel',Georgia,serif", b = cs.getPropertyValue('--f-body').trim() || "'Trebuchet MS',sans-serif"; return (map3_st.font = { h, b }); }
function map3_seenAt(i) { return G.inTown || !!M.seen[i]; }
function map3_tileSeen(wx, wy) { const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE); if (tx < 0 || ty < 0 || tx >= M.w || ty >= M.h) return false; return map3_seenAt(ty * M.w + tx); }
function map3_pal() {
  const R = curReg() || TOWN, fl = R.fl || '#4a4a56';
  const floorA = map3_mix(fl, G.inTown ? '#d8c8a4' : '#bdb39c', G.inTown ? .38 : .30);
  return { floorA, floorB: map3_mix(floorA, '#000000', .07), grid: map3_mix(floorA, '#000000', .2), wall: map3_mix(R.wl || '#2a2a34', '#05040a', .4), edge: map3_mix(R.wt || fl, '#f6e8c6', .62), acc: R.torch || '#ffd27a' };
}

// ---------- exploration tracking (only rebuild the layout layer when something new is seen) ----------
function map3_winCount(cx, cy, R) { let n = 0; for (let y = Math.max(0, cy - R); y <= Math.min(M.h - 1, cy + R); y++) for (let x = Math.max(0, cx - R); x <= Math.min(M.w - 1, cx + R); x++) n += M.seen[y * M.w + x]; return n; }
{ const _msN = markSeen; markSeen = function () {
  if (!M || !P) return _msN();
  if (M !== map3_st.lastM) { map3_st.lastM = M; map3_st.ver++; map3_st.lastTile = -1; }
  const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE), key = ty * M.w + tx;
  if (key === map3_st.lastTile) return _msN();
  map3_st.lastTile = key; const b = map3_winCount(tx, ty, 10); _msN(); if (map3_winCount(tx, ty, 10) !== b) map3_st.ver++;
}; }
function map3_recount(force) { // catches map scrolls / resume / anything that writes M.seen directly
  const now = performance.now(); if (!force && now - map3_st.recT < 1000) return; map3_st.recT = now;
  let n = 0; const s = M.seen; for (let i = 0; i < s.length; i++) n += s[i];
  if (n !== map3_st.cnt) { map3_st.cnt = n; map3_st.ver++; }
  if (M !== map3_st.lastM) { map3_st.lastM = M; map3_st.ver++; }
}

// ---------- static layout layer: floor, walls, edges, soft fog ----------
function map3_layer(slot, K, thr) {
  K = Math.max(1, Math.min(K, 4096 / Math.max(M.w, M.h)));
  const L = map3_st[slot], now = performance.now();
  if (L && L.M === M && L.town === G.inTown && Math.abs(L.K - K) < .01 && (L.ver === map3_st.ver || (thr && now - L.at < thr))) return L;
  const cv = (L && L.cv) || document.createElement('canvas'), W = Math.ceil(M.w * K), Hh = Math.ceil(M.h * K);
  cv.width = W; cv.height = Hh; const x = cv.getContext('2d'); x.clearRect(0, 0, W, Hh);
  const pal = map3_pal(), w = M.w, h = M.h, t = M.t, X0 = i => Math.round(i * K), dp = map3_dpr(), grid = slot === 'big' && K / dp >= 12;
  const fl = (tx, ty) => tx >= 0 && ty >= 0 && tx < w && ty < h && t[ty * w + tx] !== 0;
  // floor
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const i = ty * w + tx; if (!t[i] || !map3_seenAt(i)) continue;
    const a = X0(tx), b = X0(ty), cw = X0(tx + 1) - a, ch = X0(ty + 1) - b;
    if (grid) { x.fillStyle = pal.grid; x.fillRect(a, b, cw, ch); }
    x.fillStyle = (((tx * 73856093) ^ (ty * 19349663)) >>> 0) % 3 === 0 ? pal.floorB : pal.floorA;
    if (grid) x.fillRect(a + 1, b + 1, cw - 1, ch - 1); else x.fillRect(a, b, cw, ch);
  }
  // wall bodies (only walls that touch a floor tile)
  x.fillStyle = pal.wall;
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const i = ty * w + tx; if (t[i] || !map3_seenAt(i)) continue;
    if (fl(tx - 1, ty) || fl(tx + 1, ty) || fl(tx, ty - 1) || fl(tx, ty + 1) || fl(tx - 1, ty - 1) || fl(tx + 1, ty - 1) || fl(tx - 1, ty + 1) || fl(tx + 1, ty + 1)) x.fillRect(X0(tx), X0(ty), X0(tx + 1) - X0(tx), X0(ty + 1) - X0(ty));
  }
  // bright edges on every floor / wall boundary
  const ew = Math.max(1.1, Math.min(K * .15, 2.2 * dp)), eh = ew / 2; x.fillStyle = pal.edge;
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const i = ty * w + tx; if (!t[i] || !map3_seenAt(i)) continue;
    const a = X0(tx), b = X0(ty), a2 = X0(tx + 1), b2 = X0(ty + 1);
    if (!fl(tx - 1, ty)) x.fillRect(a - eh, b - eh, ew, b2 - b + ew);
    if (!fl(tx + 1, ty)) x.fillRect(a2 - eh, b - eh, ew, b2 - b + ew);
    if (!fl(tx, ty - 1)) x.fillRect(a - eh, b - eh, a2 - a + ew, ew);
    if (!fl(tx, ty + 1)) x.fillRect(a - eh, b2 - eh, a2 - a + ew, ew);
  }
  // soft fog at the frontier: multiply by a bilinear-upscaled 1px-per-tile mask of what has been seen
  if (!G.inTown) {
    const mc = (L && L.mc) || document.createElement('canvas'); mc.width = w; mc.height = h; const mx = mc.getContext('2d'), im = mx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { im.data[i * 4 + 3] = M.seen[i] ? 255 : 0; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255; }
    mx.putImageData(im, 0, 0);
    x.globalCompositeOperation = 'destination-in'; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(mc, 0, 0, w * K, h * K); x.globalCompositeOperation = 'source-over';
    return (map3_st[slot] = { cv, mc, K, M, ver: map3_st.ver, town: G.inTown, at: now });
  }
  return (map3_st[slot] = { cv, mc: L && L.mc, K, M, ver: map3_st.ver, town: G.inTown, at: now });
}

// ---------- vector icons (x, y in the context's current units; k = size scale) ----------
function map3_icon(c, kind, x, y, k, col, a) {
  k = k || 1; const O = 'rgba(6,4,10,.9)';
  c.save(); c.translate(x, y); c.scale(k, k); c.lineJoin = 'round'; c.lineCap = 'round';
  const out = (lw) => { c.strokeStyle = O; c.lineWidth = lw || 2.6; c.stroke(); };
  const glow = (r, cl, al) => { const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, map3_rgba(cl, al)); g.addColorStop(1, map3_rgba(cl, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); };
  const diamond = (r) => { c.beginPath(); c.moveTo(0, -r); c.lineTo(r, 0); c.lineTo(0, r); c.lineTo(-r, 0); c.closePath(); };
  const star = (r, n, ir) => { c.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * ir : r, an = -Math.PI / 2 + i * Math.PI / n; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); };
  switch (kind) {
    case 'player': {
      glow(13, '#ffe6a8', .35); c.rotate(a || 0);
      c.beginPath(); c.moveTo(8.5, 0); c.lineTo(-5.5, -6); c.lineTo(-2.6, 0); c.lineTo(-5.5, 6); c.closePath();
      out(3.2); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = '#e8b04a'; c.lineWidth = 1.1; c.stroke(); break; }
    case 'ally': {
      c.rotate(a || 0); c.beginPath(); c.moveTo(6.5, 0); c.lineTo(-4.5, -5); c.lineTo(-2, 0); c.lineTo(-4.5, 5); c.closePath();
      out(3); c.fillStyle = col || '#7ad0ff'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke(); break; }
    case 'down': { c.beginPath(); c.moveTo(-4, -4); c.lineTo(4, 4); c.moveTo(4, -4); c.lineTo(-4, 4); out(4.5); c.strokeStyle = '#ff6a5a'; c.lineWidth = 2.2; c.stroke(); break; }
    case 'ping': {
      const p = (G.t * 1.6) % 1; c.beginPath(); c.arc(0, 0, 4 + p * 9, 0, 6.283); c.strokeStyle = map3_rgba('#5ad0ff', 1 - p); c.lineWidth = 1.8; c.stroke();
      c.beginPath(); c.moveTo(-4.5, -6); c.lineTo(4.5, -6); c.lineTo(0, 2); c.closePath(); out(); c.fillStyle = '#5ad0ff'; c.fill(); break; }
    case 'stairs': case 'sealed': {
      const op = kind === 'stairs', cl = op ? '#ffb04a' : '#ff5a4a';
      if (op) glow(14, cl, .45 + .2 * Math.sin(G.t * 4));
      c.beginPath(); c.roundRect ? c.roundRect(-6, -6, 12, 12, 2.5) : c.rect(-6, -6, 12, 12); out(3); c.fillStyle = op ? cl : '#3a1414'; c.fill(); c.strokeStyle = cl; c.lineWidth = 1.4; c.stroke();
      c.beginPath(); c.moveTo(-4, 4); c.lineTo(-4, 1.5); c.lineTo(-1.3, 1.5); c.lineTo(-1.3, -1); c.lineTo(1.4, -1); c.lineTo(1.4, -3.5); c.lineTo(4, -3.5); c.lineTo(4, 4); c.closePath(); c.fillStyle = op ? '#3a1e06' : '#ff7a6a'; c.fill(); break; }
    case 'portal': {
      glow(14, '#7ab8ff', .5); c.beginPath(); c.ellipse(0, 0, 5, 6.5, 0, 0, 6.283); out(4.2); c.strokeStyle = '#9ad0ff'; c.lineWidth = 2.4; c.stroke();
      c.beginPath(); c.ellipse(0, 0, 2.2, 3.4, 0, 0, 6.283); c.fillStyle = '#e8f6ff'; c.fill(); break; }
    case 'chest': {
      c.beginPath(); c.rect(-5, -3.8, 10, 7.6); out(); c.fillStyle = '#ffd54a'; c.fill();
      c.fillStyle = '#6a4210'; c.fillRect(-5, -.9, 10, 1.4); c.fillRect(-.9, -1.6, 1.8, 2.8); break; }
    case 'shrine': { star(6, 4, .42); out(); c.fillStyle = col || '#d0a0ff'; c.fill(); c.beginPath(); c.arc(0, 0, 1.4, 0, 6.283); c.fillStyle = '#fff'; c.fill(); break; }
    case 'brazier': {
      glow(10, '#ff9a3a', .4); c.beginPath(); c.moveTo(0, -6.5); c.bezierCurveTo(4.5, -2, 5, 1.5, 4.2, 3); c.arc(0, 2.6, 4.2, 0, Math.PI); c.bezierCurveTo(-5, 1.5, -4.5, -2, 0, -6.5); c.closePath();
      out(); c.fillStyle = '#ff9a3a'; c.fill(); c.beginPath(); c.arc(0, 3, 1.8, 0, 6.283); c.fillStyle = '#ffe8a0'; c.fill(); break; }
    case 'lit': { c.beginPath(); c.arc(0, 0, 3, 0, 6.283); out(); c.fillStyle = '#8a5a2a'; c.fill(); break; }
    case 'dig': { c.beginPath(); c.moveTo(-4.5, -4.5); c.lineTo(4.5, 4.5); c.moveTo(4.5, -4.5); c.lineTo(-4.5, 4.5); out(5); c.strokeStyle = '#ffd27a'; c.lineWidth = 2.6; c.stroke(); break; }
    case 'font': { glow(10, '#7affff', .4); c.beginPath(); c.arc(0, 0, 4.6, 0, 6.283); out(); c.fillStyle = '#4ae0e8'; c.fill(); c.beginPath(); c.arc(-1, -1.2, 1.6, 0, 6.283); c.fillStyle = '#e8ffff'; c.fill(); break; }
    case 'altar': { diamond(5.6); out(); c.fillStyle = '#c070ff'; c.fill(); diamond(2.2); c.fillStyle = '#f0d8ff'; c.fill(); break; }
    case 'cage': {
      c.beginPath(); c.rect(-4.8, -4.8, 9.6, 9.6); out(); c.fillStyle = '#4a3a18'; c.fill(); c.strokeStyle = '#ffe9a0'; c.lineWidth = 1.4; c.stroke();
      c.beginPath(); for (const bx of [-1.6, 1.6]) { c.moveTo(bx, -4.8); c.lineTo(bx, 4.8); } c.stroke(); break; }
    case 'quest': { glow(10, '#9ad0ff', .35); star(6.4, 5, .45); out(); c.fillStyle = '#9ad0ff'; c.fill(); break; }
    case 'npc': { c.beginPath(); c.arc(0, 0, 5.2, 0, 6.283); out(3); c.fillStyle = col || '#d8a040'; c.fill(); c.strokeStyle = '#fff6e0'; c.lineWidth = 1.3; c.stroke(); c.beginPath(); c.arc(0, -1, 1.6, 0, 6.283); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(); break; }
    case 'vill': { c.beginPath(); c.arc(0, 0, 2.4, 0, 6.283); out(2); c.fillStyle = '#e6dcc4'; c.fill(); break; }
    case 'foe': { c.beginPath(); c.arc(0, 0, 2.5, 0, 6.283); out(2); c.fillStyle = col || '#ff5a4a'; c.fill(); break; }
    case 'gimp': { glow(9, '#ffd54a', .5); star(4.6, 4, .5); out(); c.fillStyle = '#ffd54a'; c.fill(); break; }
    case 'elite': { diamond(4.6); out(); c.fillStyle = col || '#ffe040'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = .9; c.stroke(); break; }
    case 'invader': { c.beginPath(); c.moveTo(0, -5.5); c.lineTo(5, 4); c.lineTo(-5, 4); c.closePath(); out(); c.fillStyle = '#ff8a5a'; c.fill(); c.fillStyle = '#2a0a04'; c.fillRect(-.7, -2, 1.4, 3.2); break; }
    case 'boss': {
      glow(16, '#ff3a3a', .45 + .15 * Math.sin(G.t * 5)); c.beginPath(); c.arc(0, 0, 6.6, 0, 6.283); out(3); c.fillStyle = '#e8303a'; c.fill(); c.strokeStyle = '#ffd0c0'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#2a0406'; c.beginPath(); c.arc(-2.3, -.8, 1.5, 0, 6.283); c.arc(2.3, -.8, 1.5, 0, 6.283); c.fill(); c.fillRect(-1.8, 2.4, 3.6, 1.2); break; }
    case 'haz': { c.beginPath(); c.arc(0, 0, a, 0, 6.283); c.fillStyle = map3_rgba(col, .22); c.fill(); c.strokeStyle = map3_rgba(col, .55); c.lineWidth = 1 / k; c.setLineDash([3 / k, 3 / k]); c.stroke(); break; }
    case 'prop': { c.beginPath(); c.arc(0, 0, a, 0, 6.283); c.fillStyle = 'rgba(40,30,22,.55)'; c.fill(); c.strokeStyle = 'rgba(255,240,210,.28)'; c.lineWidth = 1 / k; c.stroke(); break; }
  }
  c.restore();
}

// ---------- marker list shared by the minimap and the full map ----------
// each: { k: icon kind, x, y (world px), col, a (angle / radius), lab (full-map label), imp (edge arrow when off-screen), z (draw order) }
function map3_marks(big) {
  const out = [], seen = map3_tileSeen, add = (k, o, extra) => { if (o) out.push({ k, x: o.x, y: o.y, ...extra }); };
  if (G.inTown && typeof TWN !== 'undefined' && TWN.col) for (const p of TWN.col) out.push({ k: 'prop', x: p.x, y: p.y, a: p.r, z: -2 });
  for (const h of G.haz || []) if (seen(h.x, h.y)) out.push({ k: 'haz', x: h.x, y: h.y, a: h.r, col: h.h && h.h.col === '#2a1040' ? '#c080ff' : (h.h && h.h.col) || '#ff7a4a', z: -1, lab: big && h.h ? h.h.n : '' });
  if (G.stairs && (seen(G.stairs.x, G.stairs.y) || G.stairsOpen)) add(G.stairsOpen ? 'stairs' : 'sealed', G.stairs, { imp: G.stairsOpen ? '#ffb04a' : '#ff5a4a', lab: G.stairsOpen ? 'Stairs down' : 'Sealed stairs', z: 5 });
  if (G.exit) add('portal', G.exit, { imp: '#7ab8ff', lab: 'Exit portal', z: 5 });
  for (const ch of G.chests || []) if (!ch.open && seen(ch.x, ch.y)) add('chest', ch, { z: 2 });
  for (const sh of G.shrines || []) if (!sh.used && seen(sh.x, sh.y)) add('shrine', sh, { col: sh.s && sh.s.col, lab: big && sh.s ? sh.s.n || 'Shrine' : '', z: 2 });
  if (G.braz && !G.braz.done) for (const b of G.braz.list) add(b.lit ? 'lit' : 'brazier', b, { imp: b.lit ? null : '#ff9a3a', lab: b.lit ? '' : 'Unlit brazier', z: 3 });
  if (G.dig && !G.dig.used) add('dig', G.dig, { imp: '#ffd27a', lab: 'Dig spot', z: 3 });
  if (G.font && !G.font.used) add('font', G.font, { lab: 'Ember Font', z: 3 });
  if (G.altar && !G.altar.used) add('altar', G.altar, { lab: 'Altar of Exchange', z: 3 });
  for (const q of G.qit || []) if (!q.got) add('quest', q, { imp: '#9ad0ff', lab: q.n, z: 4 });
  for (const v of G.vill || []) add('vill', v, { lab: big ? v.n : '', z: 1, sm: 1 });
  for (const n of G.npcs || []) add('npc', n, { col: n.col, lab: n.n, z: 4 });
  const hunt = G.stairs && !G.stairsOpen && Math.ceil(G.total * .7) - G.killed <= 6;
  for (const e of G.ens || []) {
    if (e.dead) continue;
    if (e.type === 'cage') { add('cage', e, { imp: '#ffe9a0', lab: 'Captive', z: 4 }); continue; }
    if (e.prop) continue;
    if (e.boss) { if (e.awake || seen(e.x, e.y)) add('boss', e, { imp: '#ff3a3a', lab: e.d && e.d.n, z: 6 }); continue; }
    if (e.type === 'gimp') { if (e.awake) add('gimp', e, { lab: big ? 'Treasure goblin' : '', z: 4 }); continue; }
    if (e.invader) { if (e.awake || hunt) add('invader', e, { lab: big ? 'Invader' : '', z: 4 }); continue; }
    if (e.elite || e.champ) { if (e.awake || hunt) add('elite', e, { col: ELITES[e.elite] || '#ffb04a', z: 3, lab: big && e.d ? e.d.n : '' }); continue; }
    if (e.awake || hunt) add('foe', e, { col: e.golden ? '#ffd54a' : hunt && !e.awake ? '#ff7a6a' : '#ff4a3a', z: 1 });
  }
  if (typeof NET !== 'undefined' && NET.players && NET.status !== 'off') { const area = netArea(); if (area !== 'solo' && area !== 'menu') for (const [, p] of NET.players) if (p.area === area && isFinite(p.rx)) out.push({ k: p.down ? 'down' : 'ally', x: p.rx, y: p.ry, a: p.face || 0, col: p.col || '#7ad0ff', imp: p.col || '#7ad0ff', lab: p.name, z: 7 }); }
  if (typeof PARTY !== 'undefined' && PARTY.marks) for (const k of PARTY.marks) out.push({ k: 'ping', x: k.x, y: k.y, imp: '#5ad0ff', lab: k.who ? k.who + "'s ping" : 'Ping', z: 8 });
  return out.sort((a, b) => (a.z || 0) - (b.z || 0));
}

// ---------- minimap ----------
function map3_miniSize() { const el = H.mini && H.mini.parentElement, w = el ? el.clientWidth : 0; return w >= 80 ? w : 190; }
function map3_zoomIdx() {
  if (!S) return 2; if (S.opts.map3z == null) S.opts.map3z = S.opts.mz ? 4 : 2;
  if (map3_st.mz !== null && !!S.opts.mz !== map3_st.mz) S.opts.map3z = S.opts.mz ? 4 : 2; // the old click toggle (6f_c) still works
  map3_st.mz = !!S.opts.mz; return Math.max(0, Math.min(map3_ZL.length - 1, S.opts.map3z | 0));
}
function map3_zoom(d) { if (!S) return; S.opts.map3z = Math.max(0, Math.min(map3_ZL.length - 1, map3_zoomIdx() + d)); S.opts.mz = S.opts.map3z >= 3; map3_st.mz = S.opts.mz; map3_st.drawn = -1; sfx('click'); drawMini(); }
function map3_plateTxt() {
  if (G.inTown) return '<b>Haven</b>';
  const R = curReg(); let f = '';
  if (G.abyss) f = 'Depth ' + G.depth; else if (G.tutorial || G.trial || G.arena || G.duel) f = ''; else f = G.floor === BOSS_F ? 'Lair' : 'F' + (G.floor + 1) + '/' + FLOORS;
  return `<b>${map3_esc(R.n)}</b>${f ? `<i>${f}</i>` : ''}`;
}
function map3_miniInit() {
  const box = H.mini && H.mini.parentElement; if (!box || box.classList.contains('map3f')) return;
  box.classList.add('map3f');
  const pl = document.createElement('div'); pl.className = 'map3pl'; box.appendChild(pl);
  const zb = document.createElement('div'); zb.className = 'map3zb';
  zb.innerHTML = '<span title="Zoom in" data-d="-1">+</span><span title="Zoom out" data-d="1">&minus;</span>';
  zb.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); const d = e.target.closest('[data-d]'); if (d) map3_zoom(+d.dataset.d); });
  box.appendChild(zb);
}
drawMini = function () {
  if (!M || !P || !H.mini || !H.mctx) return;
  if (map3_st.drawn === map3_st.fr) return; map3_st.drawn = map3_st.fr;
  map3_miniInit(); map3_recount();
  const cvs = H.mini, c = H.mctx, sz = map3_miniSize(), d = map3_dpr(), px = Math.round(sz * d);
  if (cvs.width !== px || cvs.height !== px) { cvs.width = cvs.height = px; }
  if (cvs.style.width !== sz + 'px') { cvs.style.width = cvs.style.height = sz + 'px'; }
  const zi = map3_zoomIdx(), sT = map3_ZL[zi]; map3_st.zs = map3_st.zs ? map3_st.zs + (sT - map3_st.zs) * .25 : sT; if (Math.abs(map3_st.zs - sT) < .02) map3_st.zs = sT;
  const s = map3_st.zs, L = map3_layer('mini', sT * d, 160), cx = sz / 2, cy = sz / 2, ring = 7, r = sz / 2 - ring, pal = map3_pal();
  const ptx = P.x / TILE, pty = P.y / TILE;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, sz, sz);
  c.save(); c.beginPath(); c.arc(cx, cy, r, 0, 6.283); c.clip();
  const bg = c.createRadialGradient(cx, cy, 0, cx, cy, r); bg.addColorStop(0, '#16121e'); bg.addColorStop(1, '#08070c'); c.fillStyle = bg; c.fillRect(0, 0, sz, sz);
  // layout layer, snapped to device pixels so edges stay crisp
  const lk = s / (L.K / d), ox = Math.round((cx - ptx * s) * d) / d, oy = Math.round((cy - pty * s) * d) / d;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(L.cv, ox, oy, L.cv.width / d * lk, L.cv.height / d * lk);
  // markers
  const toM = (wx, wy) => [cx + (wx / TILE - ptx) * s, cy + (wy / TILE - pty) * s];
  const arrows = [];
  for (const m of map3_marks(false)) {
    const [mx, my] = toM(m.x, m.y), dd = Math.hypot(mx - cx, my - cy);
    if (m.k === 'haz' || m.k === 'prop') { if (dd < r + m.a / TILE * s) map3_icon(c, m.k, mx, my, 1, m.col, m.a / TILE * s); continue; }
    if (dd > r - 6) { if (m.imp) arrows.push([Math.atan2(my - cy, mx - cx), m.imp]); continue; }
    map3_icon(c, m.k, mx, my, m.k === 'foe' || m.k === 'vill' ? 1 : .92, m.col, m.a);
  }
  map3_icon(c, 'player', cx, cy, 1, null, P.face);
  // rim shading
  const vg = c.createRadialGradient(cx, cy, r * .68, cx, cy, r); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = vg; c.fillRect(0, 0, sz, sz);
  c.restore();
  // edge arrows for important off-screen targets
  for (const [an, col] of arrows) { c.save(); c.translate(cx + Math.cos(an) * (r - 7), cy + Math.sin(an) * (r - 7)); c.rotate(an); c.beginPath(); c.moveTo(5.5, 0); c.lineTo(-4, -5); c.lineTo(-1.5, 0); c.lineTo(-4, 5); c.closePath(); c.strokeStyle = 'rgba(6,4,10,.95)'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); c.fillStyle = col; c.fill(); c.restore(); }
  // frame: dark band, gold rings, ticks, north marker
  c.beginPath(); c.arc(cx, cy, r + ring / 2, 0, 6.283); c.strokeStyle = '#120e18'; c.lineWidth = ring; c.stroke();
  c.beginPath(); c.arc(cx, cy, r + .6, 0, 6.283); c.strokeStyle = 'rgba(232,194,122,.95)'; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.arc(cx, cy, sz / 2 - .8, 0, 6.283); c.strokeStyle = 'rgba(160,122,52,.9)'; c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = 'rgba(232,194,122,.55)'; c.lineWidth = 1;
  for (let i = 0; i < 24; i++) { const an = i / 24 * 6.283, l = i % 6 === 0 ? 4 : 2; c.beginPath(); c.moveTo(cx + Math.cos(an) * (r + 1.5), cy + Math.sin(an) * (r + 1.5)); c.lineTo(cx + Math.cos(an) * (r + 1.5 + l), cy + Math.sin(an) * (r + 1.5 + l)); c.stroke(); }
  c.beginPath(); c.arc(cx, 7.5, 7.5, 0, 6.283); c.fillStyle = '#120e18'; c.fill(); c.strokeStyle = 'rgba(232,194,122,.95)'; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = '#ffd98a'; c.font = `700 9.5px ${map3_fonts().h}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', cx, 8);
  // region plate (HTML, so it uses the UI fonts)
  const pt = map3_plateTxt(); if (pt !== map3_st.plate) { map3_st.plate = pt; const el = H.mini.parentElement.querySelector('.map3pl'); if (el) el.innerHTML = pt; }
};
{ const _uhN3 = updateHUD; updateHUD = function (dt) { map3_st.fr++; _uhN3(dt); if (S && P && M && G.mode === 'play') drawMini(); }; }

// ---------- full map ----------
function map3_fit() {
  const c = $('mapc'); if (!c || !M) return; const W = c.clientWidth, Hh = c.clientHeight; if (!W || !Hh) return;
  let x0 = M.w, y0 = M.h, x1 = 0, y1 = 0;
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { const i = y * M.w + x; if (M.t[i] && map3_seenAt(i)) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } }
  if (x1 < x0) { x0 = 0; y0 = 0; x1 = M.w - 1; y1 = M.h - 1; }
  const pad = 3, bw = x1 - x0 + 1 + pad * 2, bh = y1 - y0 + 1 + pad * 2;
  map3_V.s = Math.max(4, Math.min(44, Math.min(W / bw, Hh / bh))); map3_V.cx = (x0 + x1 + 1) / 2; map3_V.cy = (y0 + y1 + 1) / 2;
}
function map3_bigZoom(f, sx, sy) { const c = $('mapc'); if (!c) return; const W = c.clientWidth, Hh = c.clientHeight; if (sx == null) { sx = W / 2; sy = Hh / 2; }
  const wx = map3_V.cx + (sx - W / 2) / map3_V.s, wy = map3_V.cy + (sy - Hh / 2) / map3_V.s; map3_V.s = Math.max(3, Math.min(60, map3_V.s * f));
  map3_V.cx = wx - (sx - W / 2) / map3_V.s; map3_V.cy = wy - (sy - Hh / 2) / map3_V.s; }
function map3_me() { if (!P) return; map3_V.cx = P.x / TILE; map3_V.cy = P.y / TILE; map3_V.s = Math.max(map3_V.s, 18); }
function map3_focus(i) { const n = (G.npcs || [])[i]; if (!n) return; map3_V.cx = n.x / TILE; map3_V.cy = n.y / TILE; map3_V.s = Math.max(map3_V.s, 26); map3_V.hl = { x: n.x, y: n.y, t: G.t }; }
function map3_bind(c) {
  if (c.map3) return; c.map3 = 1; map3_V.s = 0; // a freshly opened map always starts fitted to the explored area
  const sc = () => { const b = c.getBoundingClientRect(); return b.width / (c.clientWidth || 1) || 1; };
  c.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); const b = c.getBoundingClientRect(), k = sc(); map3_bigZoom(e.deltaY > 0 ? 1 / 1.18 : 1.18, (e.clientX - b.left) / k, (e.clientY - b.top) / k); }, { passive: false });
  c.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); map3_V.drag = { x: e.clientX, y: e.clientY, cx: map3_V.cx, cy: map3_V.cy, k: sc() }; c.style.cursor = 'grabbing'; });
  c.addEventListener('dblclick', e => { e.stopPropagation(); map3_me(); });
  c.addEventListener('mousemove', e => { const b = c.getBoundingClientRect(), k = sc(); map3_V.hov = [(e.clientX - b.left) / k, (e.clientY - b.top) / k]; });
  c.addEventListener('mouseleave', () => { map3_V.hov = null; });
  const legend = c.closest('.map3w'); if (legend) legend.querySelectorAll('canvas[data-k]').forEach(lc => { const d = map3_dpr(); lc.width = lc.height = 20 * d; const x = lc.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); map3_icon(x, lc.dataset.k, 10, 10, lc.dataset.k === 'foe' || lc.dataset.k === 'vill' ? 1.3 : 1, lc.dataset.c || null, lc.dataset.k === 'haz' ? 7 : lc.dataset.k === 'player' || lc.dataset.k === 'ally' ? -Math.PI / 2 : 0); });
}
addEventListener('mousemove', e => { const D = map3_V.drag; if (!D) return; map3_V.cx = D.cx - (e.clientX - D.x) / D.k / map3_V.s; map3_V.cy = D.cy - (e.clientY - D.y) / D.k / map3_V.s; });
addEventListener('mouseup', () => { if (!map3_V.drag) return; map3_V.drag = null; const c = $('mapc'); if (c) c.style.cursor = ''; });
function map3_label(c, t, x, y, col, f) { c.font = f; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(6,4,10,.92)'; c.strokeText(t, x, y); c.fillStyle = col; c.fillText(t, x, y); }
drawBigMap = function (c) {
  if (!c || !M || !P) return;
  if (!map3_st.loop) { map3_st.loop = true; const tick = () => { const cv = G.menu === 'map' && $('mapc'); if (!cv) { map3_st.loop = false; map3_V.drag = null; return; } drawBigMap(cv); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
  map3_bind(c); map3_recount();
  const d = map3_dpr(), W = c.clientWidth, Hh = c.clientHeight; if (!W || !Hh) return;
  if (c.width !== Math.round(W * d) || c.height !== Math.round(Hh * d)) { c.width = Math.round(W * d); c.height = Math.round(Hh * d); }
  if (map3_V.M !== M || map3_V.lid !== G.levelId || !map3_V.s) { map3_V.M = M; map3_V.lid = G.levelId; map3_fit(); }
  const x = c.getContext('2d'), s = map3_V.s, F = map3_fonts();
  x.setTransform(d, 0, 0, d, 0, 0);
  const bg = x.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, Math.max(W, Hh) * .7); bg.addColorStop(0, '#15111c'); bg.addColorStop(1, '#060509'); x.fillStyle = bg; x.fillRect(0, 0, W, Hh);
  // faint backdrop grid every 4 tiles for a sense of scale
  const ox = W / 2 - map3_V.cx * s, oy = Hh / 2 - map3_V.cy * s, gs = 4 * s;
  x.strokeStyle = 'rgba(214,168,82,.05)'; x.lineWidth = 1; x.beginPath();
  for (let gx = ((ox % gs) + gs) % gs; gx < W; gx += gs) { x.moveTo(Math.round(gx) + .5, 0); x.lineTo(Math.round(gx) + .5, Hh); }
  for (let gy = ((oy % gs) + gs) % gs; gy < Hh; gy += gs) { x.moveTo(0, Math.round(gy) + .5); x.lineTo(W, Math.round(gy) + .5); } x.stroke();
  // layer (rebuilt at the current zoom once it differs enough, so it stays sharp)
  let L = map3_st.big; const want = s * d;
  if (!L || L.M !== M || L.ver !== map3_st.ver || L.town !== G.inTown || Math.abs(L.K - want) / want > .12) L = map3_layer('big', want);
  const lk = s / (L.K / d); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(L.cv, Math.round(ox * d) / d, Math.round(oy * d) / d, L.cv.width / d * lk, L.cv.height / d * lk);
  // markers + labels
  const k = Math.max(1, Math.min(1.7, s / 14)), toS = (wx, wy) => [ox + wx / TILE * s, oy + wy / TILE * s], labs = [];
  for (const m of map3_marks(true)) {
    const [mx, my] = toS(m.x, m.y);
    if (m.k === 'haz' || m.k === 'prop') { const rr = m.a / TILE * s; if (mx > -rr && my > -rr && mx < W + rr && my < Hh + rr) map3_icon(x, m.k, mx, my, 1, m.col, rr); continue; }
    if (mx < -20 || my < -20 || mx > W + 20 || my > Hh + 20) continue;
    map3_icon(x, m.k, mx, my, m.k === 'foe' || m.k === 'vill' ? k * .9 : k, m.col, m.a);
    if (m.lab && (m.k === 'npc' || s >= 9 || (map3_V.hov && Math.hypot(map3_V.hov[0] - mx, map3_V.hov[1] - my) < 14))) labs.push([m, mx, my]);
  }
  if (G.inTown && typeof TWN !== 'undefined' && TWN.col && TWN.col.length) { const f = TWN.col.reduce((a, b) => b.r > a.r ? b : a); const [fx, fy] = toS(f.x, f.y); map3_label(x, 'Ember Fountain', fx, fy, '#ffd98a', `italic 600 ${Math.round(11 * k)}px ${F.b}`); }
  const [px, py] = toS(P.x, P.y); const pr = (G.t * 1.2) % 1;
  x.beginPath(); x.arc(px, py, (8 + pr * 16) * k, 0, 6.283); x.strokeStyle = `rgba(255,230,168,${.7 * (1 - pr)})`; x.lineWidth = 1.6; x.stroke();
  map3_icon(x, 'player', px, py, k * 1.1, null, P.face);
  for (const [m, mx, my] of labs) { const npc = m.k === 'npc', col = npc ? map3_mix(m.col || '#d8a040', '#ffffff', .45) : m.k === 'vill' ? '#cfc6b2' : m.imp || '#ece2cc';
    map3_label(x, m.lab, mx, my + (npc ? -13 : 12) * k, col, `${npc ? '700 ' + Math.round(12.5 * k) : '600 ' + Math.round(11 * k)}px ${F.b}`); }
  if (map3_V.hl && G.t - map3_V.hl.t < 2.5) { const [hx, hy] = toS(map3_V.hl.x, map3_V.hl.y), p = ((G.t - map3_V.hl.t) * 1.4) % 1; x.beginPath(); x.arc(hx, hy, 10 + p * 22, 0, 6.283); x.strokeStyle = `rgba(255,217,138,${1 - p})`; x.lineWidth = 2; x.stroke(); }
  // compass
  x.save(); x.translate(26, 26); x.beginPath(); x.arc(0, 0, 15, 0, 6.283); x.fillStyle = 'rgba(18,14,24,.85)'; x.fill(); x.strokeStyle = 'rgba(232,194,122,.7)'; x.lineWidth = 1.2; x.stroke();
  x.beginPath(); x.moveTo(0, -12); x.lineTo(3.6, -5); x.lineTo(-3.6, -5); x.closePath(); x.fillStyle = '#ffd98a'; x.fill();
  x.font = `700 10px ${F.h}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffd98a'; x.fillText('N', 0, 3.5); x.restore();
};

function map3_side() {
  if (!M || !S) return '';
  const R = curReg(), rows = [], obj = [];
  const head = G.inTown ? `<div class="map3t">Haven</div><div class="map3sub">The last lit town of the valley</div>`
    : `<div class="map3t">${map3_esc(R.n)}</div><div class="map3sub">${G.abyss ? 'Abyss depth ' + G.depth : G.tutorial ? 'Tutorial' : G.floor === BOSS_F ? 'Guardian lair' : 'Floor ' + (G.floor + 1) + ' of ' + FLOORS}${S.diff && typeof DIFF !== 'undefined' ? ' &middot; ' + DIFF[S.diff] : ''}</div>`;
  let body = '';
  if (!G.inTown) {
    let fl = 0, sn = 0; for (let i = 0; i < M.t.length; i++) if (M.t[i]) { fl++; if (M.seen[i]) sn++; }
    const pct = G.floorTiles ? Math.min(1, G.expPct || 0) : fl ? sn / fl : 0, p = Math.floor(pct * 100);
    rows.push(`<div class="map3row"><span>Explored</span><b>${G.explored ? 'Complete' : p + '%'}</b></div><div class="map3bar"><i style="width:${p}%"></i></div>`);
    const alive = (G.ens || []).filter(e => !e.dead && !e.prop && !e.minion && e.type !== 'cage' && e.type !== 'dummy').length;
    rows.push(`<div class="map3row"><span>Foes remaining</span><b>${alive}</b></div>`);
    if (G.total) rows.push(`<div class="map3row"><span>Foes slain</span><b>${G.killed} / ${G.total}</b></div>`);
    const ch = (G.chests || []).filter(c => !c.open && map3_tileSeen(c.x, c.y)).length; if (ch) rows.push(`<div class="map3row"><span>Chests in sight</span><b>${ch}</b></div>`);
    if (G.boss && !G.boss.dead) obj.push(['boss', `Slay <b>${map3_esc(G.boss.d && G.boss.d.n)}</b>`]);
    if (G.stairs) { const need = Math.max(0, Math.ceil(G.total * .7) - G.killed); obj.push(G.stairsOpen ? ['stairs', 'Stairs are <b class="map3ok">open</b>'] : ['sealed', `Stairs sealed: slay <b>${need}</b> more`]); }
    if (G.exit) obj.push(['portal', 'Exit portal is open']);
    if (G.braz && !G.braz.done) obj.push(['brazier', `Light the braziers <b>${G.braz.list.filter(b => b.lit).length} / 3</b>`]);
    const cg = (G.ens || []).filter(e => e.type === 'cage' && !e.dead).length; if (cg) obj.push(['cage', `Free the captive${cg > 1 ? 's' : ''} (${cg})`]);
    for (const q of G.qit || []) if (!q.got) obj.push(['quest', `Find <b>${map3_esc(q.n)}</b>`]);
    if (G.dig && !G.dig.used) obj.push(['dig', 'Dig up the buried treasure']);
    if (G.gauntlet) obj.push(['elite', `Gauntlet ${G.gauntlet.i + 1} / 3`]);
    if (!G.explored && G.floorTiles && !G.boss) obj.push(['player', 'Explore 95% for a bonus']);
  }
  body += `<div class="map3card">${head}${rows.length ? '<div style="margin-top:8px">' + rows.join('') + '</div>' : ''}</div>`;
  const li = (k, t, c) => `<div><canvas data-k="${k}"${c ? ` data-c="${c}"` : ''}></canvas><span>${t}</span></div>`;
  if (obj.length) body += `<div class="map3card"><div class="map3h3">Objectives</div><div class="map3obj">${obj.map(([k, t]) => li(k, t)).join('')}</div></div>`;
  if (G.inTown) {
    const n = (G.npcs || []).map((v, i) => `<div class="map3npc" onclick="map3_focus(${i})" title="Show on map"><canvas data-k="npc" data-c="${map3_esc(v.col)}"></canvas><span>${map3_esc(v.n)}</span></div>`).join('');
    body += `<div class="map3card"><div class="map3h3">Townsfolk &amp; stalls</div><div class="map3obj">${n}</div></div>`;
    body += `<div class="map3card"><div class="map3h3">Legend</div><div class="map3leg">${li('player', 'You')}${li('npc', 'Stall / NPC', '#d8a040')}${li('vill', 'Villager')}${li('ally', 'Ally')}${li('ping', 'Ping')}</div></div>`;
  } else {
    body += `<div class="map3card"><div class="map3h3">Legend</div><div class="map3leg">${[['player', 'You'], ['ally', 'Ally'], ['stairs', 'Stairs'], ['sealed', 'Sealed stairs'], ['portal', 'Exit portal'], ['chest', 'Chest'], ['shrine', 'Shrine', '#d0a0ff'], ['brazier', 'Brazier'], ['quest', 'Quest item'], ['cage', 'Captive'], ['dig', 'Dig spot'], ['font', 'Ember Font'], ['altar', 'Altar'], ['foe', 'Foe'], ['elite', 'Elite', '#ffe040'], ['boss', 'Boss'], ['gimp', 'Goblin'], ['invader', 'Invader'], ['haz', 'Hazard', '#ff7a4a'], ['ping', 'Ping']].map(a => li(...a)).join('')}</div></div>`;
  }
  return body;
}
MENUS.map = () => tabs('map') + `<div class="map3w"><div class="map3v"><canvas id="mapc"></canvas>
  <div class="map3ctl"><b onclick="map3_bigZoom(1.25)" title="Zoom in">+</b><b onclick="map3_bigZoom(.8)" title="Zoom out">&minus;</b><b onclick="map3_fit()" title="Fit explored area" class="map3sm">Fit</b><b onclick="map3_me()" title="Centre on you" class="map3sm">You</b></div>
  <div class="map3tip">Drag to pan &middot; wheel to zoom &middot; double-click to centre on you</div></div>
  <aside class="map3s">${map3_side()}</aside></div>`;

// ---------- styles ----------
{ const st = document.createElement('style'); st.id = 'map3-css'; st.textContent = `
html body #h-tr div.hpan.mini.map3f{width:var(--map3-size,190px)!important;height:var(--map3-size,190px)!important;padding:0!important;border:0!important;outline:0!important;background:none!important;box-shadow:none!important;border-radius:50%!important;overflow:visible!important;position:relative!important;margin-bottom:18px!important;box-sizing:content-box!important}
html body #h-tr div.hpan.mini.map3f::after,html body #h-tr div.hpan.mini.map3f::before{content:none!important;display:none!important}
html body #h-tr div.hpan.mini.map3f .mzl{display:none!important}
html body #h-tr div.hpan.mini.map3f #mini{border-radius:50%!important;background:none!important;display:block;cursor:zoom-in;filter:drop-shadow(0 6px 14px rgba(0,0,0,.65))}
.map3pl{position:absolute;left:50%;bottom:-11px;transform:translateX(-50%);display:flex;align-items:baseline;gap:6px;max-width:calc(100% - 20px);padding:3px 11px 4px;border-radius:999px;background:linear-gradient(#1d1726,#120e18);border:1px solid var(--line2,rgba(214,168,82,.55));box-shadow:0 3px 10px rgba(0,0,0,.6);white-space:nowrap;pointer-events:none}
.map3pl b{font:700 11px var(--f-head,Georgia,serif);letter-spacing:.05em;color:var(--gold2,#ffd98a);overflow:hidden;text-overflow:ellipsis}
.map3pl i{font:600 11px var(--f-body,sans-serif);font-style:normal;color:var(--dim,#a39a88)}
.map3zb{position:absolute;right:-6px;bottom:22px;display:flex;flex-direction:column;gap:4px;pointer-events:auto}
.map3zb span{width:21px;height:21px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(#271f32,#15111b);border:1px solid var(--line2,rgba(214,168,82,.55));color:var(--gold2,#ffd98a);font:700 14px/1 var(--f-body,sans-serif);cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.6);user-select:none}
.map3zb span:hover{border-color:var(--gold2,#ffd98a);background:#2e2440}
.map3w{display:flex;gap:14px;flex:1 1 auto;height:min(66vh,640px);min-height:360px;margin-top:10px;font-family:var(--f-body);color:var(--text)}
.map3v{position:relative;flex:1 1 auto;min-width:0;border:1px solid var(--line2);border-radius:var(--r-md);overflow:hidden;background:#07060a;box-shadow:inset 0 0 40px rgba(0,0,0,.7)}
.map3v #mapc{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;border-radius:0}
.map3ctl{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:6px}
.map3ctl b{min-width:34px;height:32px;padding:0 6px;box-sizing:border-box;display:grid;place-items:center;border-radius:8px;background:rgba(21,17,27,.9);border:1px solid var(--line2);color:var(--gold2);font:700 17px var(--f-body);cursor:pointer;user-select:none}
.map3ctl b.map3sm{font-size:12px;font-weight:600}
.map3ctl b:hover{background:var(--panel3);border-color:var(--gold2)}
.map3tip{position:absolute;left:10px;bottom:8px;font-size:12px;color:var(--dim);background:rgba(11,9,16,.8);padding:3px 9px;border-radius:6px;pointer-events:none}
.map3s{flex:0 0 250px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;min-height:0}
.map3card{background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-md);padding:10px 12px}
.map3t{font:700 17px var(--f-head);color:var(--gold2);letter-spacing:.04em;line-height:1.2}
.map3sub{color:var(--dim);font-size:13px;margin-top:2px}
.map3row{display:flex;justify-content:space-between;font-size:14px;padding:2px 0;color:var(--dim)}
.map3row b{color:var(--text)}
.map3bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;margin:3px 0 6px}
.map3bar i{display:block;height:100%;background:linear-gradient(90deg,#b07a30,var(--gold2))}
.map3h3{font:700 11px var(--f-head);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
.map3obj>div,.map3leg>div{display:flex;align-items:center;gap:7px;font-size:13.5px;padding:2px 0;min-width:0}
.map3obj span,.map3leg span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.map3obj b{color:var(--gold2)} .map3obj b.map3ok{color:var(--good)}
.map3leg{display:grid;grid-template-columns:1fr 1fr;gap:1px 8px}
.map3w canvas[data-k]{width:20px;height:20px;flex:0 0 20px}
.map3npc{cursor:pointer;border-radius:6px;padding:2px 4px!important;margin:0 -4px}
.map3npc:hover{background:var(--panel3);color:var(--gold2)}
@media (max-width:900px){.map3s{flex-basis:200px}.map3leg{grid-template-columns:1fr}}
`; document.head.appendChild(st); }
