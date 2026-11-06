// ================= WORLD: maps, collision, pathing =================
let M = null;
function makeMap(w, h) { return { w, h, t: new Uint8Array(w * h), seen: new Uint8Array(w * h), flow: new Int16Array(w * h), rooms: [], kind: 'dungeon' }; }
function carve(m, x, y, w, h, v = 1) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i > 0 && j > 0 && i < m.w - 1 && j < m.h - 1) m.t[j * m.w + i] = v; }
function corridor(m, a, b) {
  let x = a.cx, y = a.cy;
  const hs = () => { while (x !== b.cx) { carve(m, x - 1, y - 1, 3, 3); x += Math.sign(b.cx - x); } };
  const vs = () => { while (y !== b.cy) { carve(m, x - 1, y - 1, 3, 3); y += Math.sign(b.cy - y); } };
  if (Math.random() < .5) { hs(); vs(); } else { vs(); hs(); }
  carve(m, x - 1, y - 1, 3, 3);
}
function genDungeon(floor) {
  const W = 50 + floor * 5, H = 46 + floor * 5; const m = makeMap(W, H);
  const target = 8 + floor * 2;
  for (let tries = 0; tries < 600 && m.rooms.length < target; tries++) {
    const w = ri(7, 13), h = ri(6, 11), x = ri(2, W - w - 3), y = ri(2, H - h - 3);
    if (m.rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
    m.rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) }); carve(m, x, y, w, h);
  }
  for (let i = 1; i < m.rooms.length; i++) {
    let best = 0, bd = 1e9;
    for (let j = 0; j < i; j++) { const d = Math.abs(m.rooms[i].cx - m.rooms[j].cx) + Math.abs(m.rooms[i].cy - m.rooms[j].cy); if (d < bd) { bd = d; best = j; } }
    corridor(m, m.rooms[i], m.rooms[best]);
  }
  for (let k = 0; k < 2; k++) { const a = pick(m.rooms), b = pick(m.rooms); if (a !== b) corridor(m, a, b); }
  // farthest room from start = stairs room
  const d = bfs(m, m.rooms[0].cx, m.rooms[0].cy, 9999);
  let far = m.rooms[m.rooms.length - 1], fd = -1;
  for (const r of m.rooms) { const v = d[r.cy * m.w + r.cx]; if (v > fd) { fd = v; far = r; } }
  m.stairRoom = far;
  return m;
}
function genArena() {
  const m = makeMap(40, 32); m.kind = 'boss'; carve(m, 4, 4, 32, 24);
  for (const [x, y] of [[10, 9], [28, 9], [10, 21], [28, 21]]) carve(m, x, y, 2, 2, 0);
  m.rooms = [{ x: 4, y: 4, w: 32, h: 24, cx: 20, cy: 16 }];
  return m;
}
function genTown() {
  const m = makeMap(38, 28); m.kind = 'town'; carve(m, 3, 3, 32, 22);
  m.rooms = [{ x: 3, y: 3, w: 32, h: 22, cx: 19, cy: 14 }];
  return m;
}
function bfs(m, sx, sy, max) {
  const d = new Int16Array(m.w * m.h).fill(-1); const q = new Int32Array(m.w * m.h); let h = 0, t = 0;
  const s = sy * m.w + sx; if (!m.t[s]) return d; d[s] = 0; q[t++] = s;
  while (h < t) {
    const c = q[h++], cd = d[c]; if (cd >= max) continue;
    const x = c % m.w;
    const ns = [x > 0 ? c - 1 : -1, x < m.w - 1 ? c + 1 : -1, c - m.w, c + m.w];
    for (const n of ns) { if (n < 0 || n >= m.t.length) continue; if (m.t[n] && d[n] < 0) { d[n] = cd + 1; q[t++] = n; } }
  }
  return d;
}
function computeFlow() { if (!M || !P) return; M.flow = bfs(M, Math.floor(P.x / TILE), Math.floor(P.y / TILE), 9999); }
function solid(tx, ty) { if (tx < 0 || ty < 0 || tx >= M.w || ty >= M.h) return true; return M.t[ty * M.w + tx] === 0; }
function solidAt(x, y) { return solid(Math.floor(x / TILE), Math.floor(y / TILE)); }
function hitsWall(x, y, r) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE), y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!solid(tx, ty)) continue;
    const nx = clamp(x, tx * TILE, tx * TILE + TILE), ny = clamp(y, ty * TILE, ty * TILE + TILE);
    if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < r * r) return true;
  }
  return false;
}
function moveEnt(e, dx, dy) {
  const cr = e.boss ? Math.min(e.r, 40) : Math.min(e.r, 20);
  if (!isFinite(dx) || !isFinite(dy)) return true;
  const steps = Math.min(40, Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (cr * .8))));
  const sx = dx / steps, sy = dy / steps; let blocked = false;
  for (let i = 0; i < steps; i++) {
    if (!hitsWall(e.x + sx, e.y, cr)) e.x += sx; else blocked = true;
    if (!hitsWall(e.x, e.y + sy, cr)) e.y += sy; else blocked = true;
  }
  return blocked;
}
function los(a, b) {
  const d = dist(a, b), n = Math.ceil(d / 20);
  for (let i = 1; i < n; i++) { const k = i / n; if (solidAt(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)) return false; }
  return true;
}
function navDir(e) {
  const m = M, tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return ang(e, P);
  const d = m.flow[ty * m.w + tx];
  if (d < 0) return null;
  if (d <= 2 && los(e, P)) return ang(e, P);
  let best = d, bx = -1, by = -1;
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    if (!ox && !oy) continue; const nx = tx + ox, ny = ty + oy;
    if (solid(nx, ny)) continue;
    if (ox && oy && (solid(tx + ox, ty) || solid(tx, ty + oy))) continue;
    const v = m.flow[ny * m.w + nx]; if (v >= 0 && v < best) { best = v; bx = nx; by = ny; }
  }
  if (bx < 0) return ang(e, P);
  return Math.atan2((by + .5) * TILE - e.y, (bx + .5) * TILE - e.x);
}
// random open spot near (x,y) that is in plain sight of it — never behind a wall or outside the map
function randFloorNear(x, y, rmin, rmax, r = 16) {
  const o = { x, y };
  for (let i = 0; i < 40; i++) {
    const a = rnd(0, Math.PI * 2), d = rnd(rmin, rmax) * (i > 25 ? .5 : 1), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    if (!hitsWall(px, py, r) && los(o, { x: px, y: py })) return { x: px, y: py };
  }
  return { x, y };
}
// push an entity back onto open floor if it ever ends up inside rock
function unstick(e) {
  if (!hitsWall(e.x, e.y, Math.min(e.r, 20))) return;
  const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
  for (let rad = 0; rad <= 8; rad++) for (let oy = -rad; oy <= rad; oy++) for (let ox = -rad; ox <= rad; ox++) {
    if (Math.max(Math.abs(ox), Math.abs(oy)) !== rad) continue;
    const cx = (tx + ox + .5) * TILE, cy = (ty + oy + .5) * TILE;
    if (!solid(tx + ox, ty + oy) && !hitsWall(cx, cy, Math.min(e.r, 20))) { e.x = cx; e.y = cy; return; }
  }
}
function markSeen() {
  if (!M || !P) return; const R = 9, px = Math.floor(P.x / TILE), py = Math.floor(P.y / TILE);
  for (let y = py - R; y <= py + R; y++) for (let x = px - R; x <= px + R; x++) {
    if (x < 0 || y < 0 || x >= M.w || y >= M.h) continue;
    if ((x - px) * (x - px) + (y - py) * (y - py) <= R * R) M.seen[y * M.w + x] = 1;
  }
}
