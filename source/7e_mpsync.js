// ================= multiplayer: friends' animations & attacks, and no pausing while online =================
// 1) Your animation pose (rolls, swings, casts, cheers…) rides along with your position, so friends see exactly what you do.
// 2) Your projectiles, melee arcs and skill rings are sent as cosmetic "ghosts": friends see them, but they never hit anything.
// 3) In a room, menus don't freeze the world (otherwise a host in a menu froze every monster for everyone).
const MPS = { seen: new WeakSet(), fx: [], bgLast: 0 };
const MP_ONLINE = () => NET.status === 'host' || NET.status === 'guest';
const MP_TOGETHER = () => { if (!MP_ONLINE()) return false; const a = netArea(); if (a === 'solo' || a === 'menu') return false; for (const p of NET.players.values()) if (p.area === a) return true; return false; };
let MENU_GEN = 0; { const _om = openMenu, _cm = closeMenu; openMenu = function (n) { MENU_GEN++; return _om(n); }; closeMenu = function () { MENU_GEN++; return _cm(); }; }
const ANG_KEYS = new Set(['pitch', 'spin']);
const angLerp = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
const PP_KINDS = ['arrow', 'bolt', 'knife', 'spark', 'orb', 'fire', 'page', 'wave', 'ball', 'boom'];
const okCol = c => (typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c)) ? c : '#ffffff';
const num = (v, lo, hi) => { v = +v; return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0; };
G.gpp = [];
// ---------- capture what *you* do ----------
{ const _upS = updPlayer; updPlayer = function (dt) { const s0 = G.swings.length, r0 = G.rings.length; _upS(dt); if (!MP_ONLINE()) return;
  for (const s of G.swings.slice(s0)) MPS.fx.push(['s', Math.round(s.x), Math.round(s.y), +s.a.toFixed(2), +(s.arc || 0).toFixed(2), Math.round(s.r || 0), Math.round(s.thrust || 0), Math.round(s.w || 0), +s.max.toFixed(2), s.col]);
  for (const g of G.rings.slice(r0)) MPS.fx.push(['r', Math.round(g.x), Math.round(g.y), Math.round(g.r), g.col, +g.max.toFixed(2)]); }; }
function capturePP() { for (const b of G.pp) { if (MPS.seen.has(b)) continue; MPS.seen.add(b); if (MP_ONLINE()) MPS.fx.push(['p', Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), b.r, b.col, b.kind, +(b.life || 1).toFixed(2)]); } }
{ const _msS = myState; myState = function () { const s = _msS(); capturePP();
  if (R3 && R3.pl && typeof AN !== 'undefined' && AN.cur) { s.pose = POSE_KEYS.map(k => +(AN.cur[k] || 0).toFixed(2)); s.yaw = +R3.pl.g.rotation.y.toFixed(2); s.py = +R3.pl.g.position.y.toFixed(2); }
  if (MPS.fx.length) { s.fx = MPS.fx.slice(-40); MPS.fx = []; } return s; }; }
// ---------- show what *they* do ----------
function ghostFx(m) { if (!Array.isArray(m.fx) || m.area !== netArea()) return;
  for (const f of m.fx.slice(0, 40)) { if (!Array.isArray(f)) continue;
    if (f[0] === 'p' && PP_KINDS.includes(f[7]) && G.gpp.length < 150) G.gpp.push({ x: num(f[1], -1e5, 1e5), y: num(f[2], -1e5, 1e5), vx: num(f[3], -3000, 3000), vy: num(f[4], -3000, 3000), r: num(f[5], 1, 60), col: okCol(f[6]), kind: f[7], life: num(f[8], .05, 3), spin: 0, ghost: 1 });
    else if (f[0] === 's' && G.swings.length < 60) { const s = { x: num(f[1], -1e5, 1e5), y: num(f[2], -1e5, 1e5), ax: num(f[1], -1e5, 1e5), ay: num(f[2], -1e5, 1e5), rid: String(m.id || '').replace(/[^\w-]/g, ''), a: num(f[3], -20, 20), r: num(f[5], 0, 600), t: num(f[8], .05, .5), max: num(f[8], .05, .5), col: okCol(f[9]) }; if (f[6]) { s.thrust = num(f[6], 0, 800); s.w = num(f[7], 1, 300); } else s.arc = num(f[4], 0, 6.3); G.swings.push(s); }
    else if (f[0] === 'r' && G.rings.length < 80) G.rings.push({ x: num(f[1], -1e5, 1e5), y: num(f[2], -1e5, 1e5), r: num(f[3], 1, 800), col: okCol(f[4]), t: num(f[5], .05, 2), max: num(f[5], .05, 2) }); } }
{ const _nrS = netRecv; netRecv = function (c, m) { _nrS(c, m); if (m && m.t === 'st') { const p = NET.players.get(String(m.id || '').replace(/[^\w-]/g, '')); if (p) { p.pose = Array.isArray(m.pose) && m.pose.length === POSE_KEYS.length ? m.pose.map(v => num(v, -20, 20)) : null; p.yaw = num(m.yaw, -20, 20); p.py = num(m.py, -1, 5); } ghostFx(m); } }; }
// ghost projectiles just fly (no hits) and stop at walls
function updGhosts(dt) { if (!G.gpp.length) return; for (const b of G.gpp) { b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.kind === 'boom') b.spin += dt * 20; if (b.life <= 0 || (M && solidAt(b.x, b.y))) b.dead = true; } G.gpp = G.gpp.filter(b => !b.dead); }
{ const _uG = update; update = function (dt) { _uG(dt); for (const s of G.swings) if (s.rid) { const p = NET.players.get(s.rid); if (p) { s.ax = p.rx; s.ay = p.ry; } } if (G.mode === 'play' && !G.menu) updGhosts(dt); else if (G.mode !== 'play') G.gpp = []; }; }
// friends' models play their real pose
{ const _rS = render3D; render3D = function (dt) { _rS(dt); if (!R3 || NET.status === 'off') return; const k = Math.min(1, dt * 20);
  for (const [id, r] of REM) { const p = NET.players.get(id); if (!p || !p.pose || !r.g.visible) continue;
    if (!r.cur) { r.cur = blankPose(); r.yaw = p.yaw; }
    POSE_KEYS.forEach((key, i) => { r.cur[key] = ANG_KEYS.has(key) ? angLerp(r.cur[key], p.pose[i], k) : r.cur[key] + (p.pose[i] - r.cur[key]) * k; });
    applyPose(r.h, r.cur); r.yaw = angLerp(r.yaw, p.yaw, k); r.g.rotation.y = r.yaw; r.g.scale.setScalar(1);
    const f = p.face || 0; r.g.position.set(p.rx * U + Math.cos(f) * r.cur.lunge, p.py || 0, p.ry * U + Math.sin(f) * r.cur.lunge); } }; }
// ghosts are drawn with the normal projectile renderer (outermost wrapper, so every renderer sees them)
{ const _rG = render3D; render3D = function (dt) { if (!G.gpp.length) return _rG(dt); const real = G.pp; G.pp = real.concat(G.gpp); try { _rG(dt); } finally { G.pp = real; } }; }
// ---------- no pausing while online ----------
// With a menu open the world keeps running; you just can't move or attack until you close it.
{ const _uP = update; update = function (dt) {
  if (!MP_TOGETHER() || !S || G.mode !== 'play' || !G.menu || G.menu === 'title') return _uP(dt);
  const menu = G.menu, ks = Object.assign({}, keys), md = mouse.down, gen = MENU_GEN;
  for (const k in keys) keys[k] = false; mouse.down = false; pressed = {}; G.menu = null; MPS.held = true;
  try { _uP(dt); } finally { MPS.held = false; Object.assign(keys, ks); mouse.down = md; pressed = {}; if (G.menu === null && MENU_GEN === gen) G.menu = menu; }
  if (G.menu === 'dialog' && typeof dlgTick === 'function') dlgTick(dt);
}; }
// a hidden tab gets no animation frames — keep the world (and your connection) ticking in the background
setInterval(() => { const now = performance.now(), el = Math.min(1, (now - (MPS.bgLast || now)) / 1000); MPS.bgLast = now;
  if (!document.hidden || !MP_TOGETHER() || !S || G.mode !== 'play') return;
  try { for (let t = el; t > 0; t -= .05) update(Math.min(.05, t)); } catch (e) { console.warn('bg tick', e); } }, 100);
{ const _paS = MENUS.pause; MENUS.pause = () => { const h = _paS(); return MP_TOGETHER() ? `<div class="dim" style="text-align:center;color:#9ad0ff;margin-bottom:6px">${ico('globe')} Online with your party — the game keeps running while this menu is open</div>` + h : h; }; }
