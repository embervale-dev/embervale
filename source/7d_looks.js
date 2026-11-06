// ================= multiplayer: other players show their weapon, armour, aura, companion and title =================
// Each player sends a small 'look' packet when their gear changes (and every few seconds for late joiners).
const LOOK = { key: '', sentT: 0, checkT: 0 };
const LOOK_WGT = ['light', 'medium', 'heavy'];
function myLook() {
  const w = S.eq.weapon, ar = {};
  for (const sl of WGT_SLOTS) { const it = S.eq[sl]; if (it) ar[sl] = { slot: sl, wgt: wgtOf(it), id: it.id | 0, r: it.r | 0 }; }
  return { t: 'look', id: NET.id, w: w ? { t: w.t, r: w.r | 0, inf: w.inf || null, mast: wmLvl(w.t) >= W_GLOW ? 1 : 0 } : null, ar, aura: (S.cos && S.cos.aura) || 'none', pet: (S.cos && S.cos.pet) || null, title: (S.cos && S.cos.title && plain(titleName())) || '' };
}
// never trust a peer's look: only known weapon types, rarities, infusions, auras and pets get through
const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
function cleanLook(m) {
  const rr = v => Math.max(0, Math.min(RAR.length - 1, v | 0));
  const w = m.w && own(WT, m.w.t) ? { t: m.w.t, r: rr(m.w.r), inf: own(INFUSE, m.w.inf) ? m.w.inf : null, mast: m.w.mast ? 1 : 0 } : null;
  const ar = {}; for (const sl of WGT_SLOTS) { const a = m.ar && m.ar[sl]; if (a && LOOK_WGT.includes(a.wgt)) ar[sl] = { slot: sl, wgt: a.wgt, id: Math.abs(a.id | 0), r: rr(a.r) }; }
  const aura = (own(AURAS, m.aura) || /^season\d{1,3}$/.test(m.aura || '')) ? m.aura : 'none';
  const pet = own(PETS, m.pet) ? m.pet : null;
  return { w, ar, aura, pet, title: String(m.title || '').slice(0, 32) };
}
function sendLook(force) { const L = myLook(), key = JSON.stringify(L); if (!force && key === LOOK.key && G.t - LOOK.sentT < 3) return; LOOK.key = key; LOOK.sentT = G.t; if (NET.host) bcast(L); else toHost(L); }
{ const _uL = update; update = function (dt) { _uL(dt); if ((NET.status !== 'host' && NET.status !== 'guest') || !S || !S.eq || !P) return; if ((LOOK.checkT -= dt) > 0) return; LOOK.checkT = .5; sendLook(); }; }
// receive (and the host relays it to everyone else)
{ const _nrL = netRecv; netRecv = function (c, m) {
  if (m && m.t === 'look') { if (NET.host) bcast(m, c.peer); const id = String(m.id || '').replace(/[^\w-]/g, ''); const p = NET.players.get(id); if (p) { p.look = cleanLook(m); p.lookKey = JSON.stringify(p.look); } else (NET.lookWait || (NET.lookWait = new Map())).set(id, m); return; }
  _nrL(c, m);
  if (m && m.t === 'st' && NET.lookWait && NET.lookWait.size) { const id = String(m.id || '').replace(/[^\w-]/g, ''), w = NET.lookWait.get(id), p = NET.players.get(id); if (w && p) { NET.lookWait.delete(id); p.look = cleanLook(w); p.lookKey = JSON.stringify(p.look); } }
  if (m && m.t === 'hello') LOOK.key = '';   // someone new: resend ours right away
}; }
// dress the remote models
function dressRemote(r, L) {
  const hand = r.h.hand; while (hand.children.length) hand.remove(hand.children[0]);
  r.fx = null; if (L.w) { try { const wm = makeWeaponFull(L.w); hand.add(wm); r.fx = wm.userData.fx; } catch (e) { console.warn('remote weapon', e); } }
  try { buildArmorLook(r.h, L.ar); } catch (e) { console.warn('remote armour', e); }
  if (r.petK !== L.pet) { if (r.pet) r.pet.parent && r.pet.parent.remove(r.pet); r.pet = null; r.petK = L.pet;
    if (L.pet && PETS[L.pet]) { const pm = makeEnemyModel({ sh: PETS[L.pet].sh, col: PETS[L.pet].col, pc: PETS[L.pet].col }); pm.g.userData.parts = pm; pm.g.scale.setScalar(.2); R3.scene.add(pm.g); r.pet = pm.g; r.petPos = null; } }
}
{ const _rmL = removeRemote; removeRemote = function (id) { const r = REM.get(id); if (r && r.pet) r.pet.parent && r.pet.parent.remove(r.pet); _rmL(id); }; }
{ const _rL = render3D; render3D = function (dt) { _rL(dt); if (!R3 || NET.status === 'off') return;
  for (const [id, r] of REM) { const p = NET.players.get(id); if (!p || !p.look) { if (r.pet) r.pet.visible = false; continue; }
    if (r.lookKey !== p.lookKey) { r.lookKey = p.lookKey; dressRemote(r, p.look); }
    const vis = r.g.visible, x = p.rx, y = p.ry, face = p.face || 0;
    if (r.pet) { r.pet.visible = vis; if (vis) { const tx = x - Math.cos(face) * 34 + 18, ty = y - Math.sin(face) * 34 + 14; if (!r.petPos) r.petPos = { x: tx, y: ty }; const pp = r.petPos, d = Math.hypot(tx - pp.x, ty - pp.y), k = Math.min(1, dt * 4); pp.x += (tx - pp.x) * k; pp.y += (ty - pp.y) * k;
      r.pet.position.set(pp.x * U, .25 + Math.abs(Math.sin(G.t * 5)) * .08 * (d > 8 ? 1 : .3), pp.y * U); r.pet.rotation.y = d > 4 ? -Math.atan2(ty - pp.y, tx - pp.x) : -face; const pt = r.pet.userData.parts; if (pt) { pt.legs.forEach((l, i) => l.rotation.z = Math.sin(G.t * 12 + i * Math.PI) * .5 * (d > 8 ? 1 : 0)); pt.wings.forEach(w => w.g.rotation.x = w.s * Math.sin(G.t * 16) * .7); } } }
    if (!vis || G.mode !== 'play') continue;
    const ak = p.look.aura;   // aura sparks, same as your own
    if (ak && ak !== 'none' && Math.random() < .6) { let col = auraCol(ak); if (col === 'rainbow') col = '#' + new T3.Color().setHSL((G.t * .3) % 1, 1, .6).getHexString(); if (col) { const a = rnd(0, 6.283); G.parts.push({ x: x + Math.cos(a) * 18, y: y + Math.sin(a) * 18, z: rnd(.1, .4), vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, vz: rnd(.6, 1.4), g: 0, life: .9, max: .9, col, size: 3, amb: 1 }); } }
    if (r.fx && r.fx.col && !G.inTown && Math.random() < (p.sw ? .9 : .2)) { const a = face + rnd(-.6, .6), d = rnd(10, 18 + r.fx.tip * 30); G.parts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, z: rnd(.6, 1.1), vx: rnd(-15, 15), vy: rnd(-15, 15), vz: rnd(.2, .8), g: 0, life: .45, max: .45, col: r.fx.col, size: p.sw ? 4 : 2.5 }); }
  } }; }
// their title under the name tag, like your own
{ const _doL = drawOverlay; drawOverlay = function () { _doL(); if (NET.status === 'off' || !R3 || !S || G.mode === 'title') return; const area = netArea();
  for (const p of NET.players.values()) { if (!p.look || !p.look.title || p.area !== area || area === 'solo') continue; const s = proj(p.rx, p.ry, 1.25); if (!s.vis) continue;
    X.font = 'italic 11px Georgia,serif'; X.textAlign = 'center'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(p.look.title, s.x, s.y); X.fillStyle = '#ffd27a'; X.fillText(p.look.title, s.x, s.y); } }; }
