// ================= LONG-TERM SYSTEMS: rendering & HUD =================
function buildExtras() {
  const L = R3.lvl;
  if (G.cursed) {
    const c = G.cursed, g = new T3.Group(); g.position.set(c.x * U, 0, c.y * U); L.add(g);
    mk(GEO.box, mat('#3a1a4a'), .7, .42, .48, 0, .21, 0, g); for (const x of [-.26, .26]) mk(GEO.box, mat('#9a60ff', { em: 1.2 }), .05, .44, .5, x, .22, 0, g);
    const lid = mk(GEO.box, mat('#4a2a5a'), .72, .14, .5, 0, .5, 0, g);
    const skull = mk(GEO.sph, mat('#e8e0ff', { em: .6 }), .1, .1, .1, 0, .33, .25, g, false);
    const ring = mk(GEO.ring, basic('#c060ff', { op: .7, add: 1, unique: 1 }), .8, 1, .8, 0, .04, 0, g, false);
    R3.torches.push({ x: c.x * U, y: 1, z: c.y * U, col: '#a040ff' });
    R3.anim.push(() => {
      const done = c.st === 'done' || c.st === 'failed'; lid.position.y = c.st === 'done' ? .75 : .5; lid.rotation.x = c.st === 'done' ? -1 : 0;
      ring.visible = !done; ring.scale.setScalar(c.st === 'active' ? 2.4 + Math.sin(G.t * 6) * .2 : .8 + Math.sin(G.t * 3) * .08); ring.rotation.y = G.t;
      skull.visible = c.st !== 'done'; if (!done && Math.random() < .3) G.parts.push({ x: c.x + rnd(-16, 16), y: c.y + rnd(-12, 12), z: .4, vx: 0, vy: 0, vz: 1, g: 0, life: .8, max: .8, col: '#b060ff', size: 3 });
    });
  }
  if (G.merch) {
    const m = G.merch, h = makeHumanoid({ body: '#7a5a3a', hatType: 'hood', hat: '#4a3a2a', cape: '#5a3a1a' });
    h.g.position.set(m.x * U, 0, m.y * U); h.g.rotation.y = Math.PI / 2; L.add(h.g);
    mk(GEO.box, mat('#6a4a2a'), .35, .45, .3, -.25, .75, 0, h.g); mk(GEO.sphL, mat('#ffd040', { em: 2 }), .07, .07, .07, .3, .6, .2, h.g, false);
    R3.torches.push({ x: m.x * U, y: 1.4, z: m.y * U, col: '#ffcf6b' });
    R3.anim.push(() => npcAnim(h, { kind: 'shop', x: m.x, y: m.y }, 3));
  }
}
function renderExtras(dt) {
  if (!P || !S || G.mode === 'title') { if (R3.petM) R3.petM.visible = false; return; }
  // companion pet
  const pk = S.cos.pet;
  if (R3.petK !== pk) {
    if (R3.petM) R3.scene.remove(R3.petM); R3.petM = null; R3.petK = pk;
    if (pk && PETS[pk]) { const p = typeof makePetModel === 'function' ? makePetModel(pk) : makeEnemyModel({ sh: PETS[pk].sh, col: PETS[pk].col, pc: PETS[pk].col }); p.g.userData.parts = p; p.g.scale.setScalar(.2); R3.petM = p.g; R3.scene.add(p.g); R3.petPos = { x: P.x, y: P.y }; }
  }
  if (R3.petM) {
    const pp = R3.petPos, tx = P.x - Math.cos(P.face) * 34 + 18, ty = P.y - Math.sin(P.face) * 34 + 14, d = Math.hypot(tx - pp.x, ty - pp.y);
    const k = Math.min(1, dt * 4); pp.x += (tx - pp.x) * k; pp.y += (ty - pp.y) * k;
    const g = R3.petM, pt = g.userData.parts; g.visible = G.mode !== 'dead';
    g.position.set(pp.x * U, .25 + Math.abs(Math.sin(G.t * 5)) * .08 * (d > 8 ? 1 : .3), pp.y * U);
    g.rotation.y = d > 4 ? -Math.atan2(ty - pp.y, tx - pp.x) : -P.face;
    pt.legs.forEach((l, i) => l.rotation.z = Math.sin(G.t * 12 + i * Math.PI) * .5 * (d > 8 ? 1 : 0)); pt.wings.forEach(w => w.g.rotation.x = w.s * Math.sin(G.t * 16) * .7); if (pt.tick) pt.tick(G.t, d);
  }
  // aura
  const ak = S.cos.aura;
  if (ak && ak !== 'none' && G.mode === 'play' && Math.random() < .6) {
    let col = auraCol(ak); if (col === 'rainbow') col = '#' + new T3.Color().setHSL((G.t * .3) % 1, 1, .6).getHexString();
    const a = rnd(0, 6.283); G.parts.push({ x: P.x + Math.cos(a) * 18, y: P.y + Math.sin(a) * 18, z: rnd(.1, .4), vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, vz: rnd(.6, 1.4), g: 0, life: .9, max: .9, col, size: 3, amb: 1 });
  }
}
const _drawOverlay = drawOverlay;
drawOverlay = function () {
  _drawOverlay();
  if (!R3 || !P || G.mode === 'title' || !M) return;
  const label = (x, y, z, txt, col, font = 'bold 12px "Trebuchet MS",sans-serif') => { const s = proj(x, y, z); if (!s.vis) return; X.font = font; X.textAlign = 'center'; X.lineWidth = 3; X.strokeStyle = 'rgba(0,0,0,.85)'; X.strokeText(txt, s.x, s.y); X.fillStyle = col; X.fillText(txt, s.x, s.y); };
  const c = G.cursed; if (c && dist(c, P) < 420) label(c.x, c.y, 1.2, c.st === 'idle' ? 'Cursed Chest — open to begin the challenge' : c.st === 'active' ? `Wave ${c.wave}/3 — ${Math.ceil(c.t)}s` : c.st === 'done' ? 'Curse broken' : 'Crumbled', '#d090ff');
  if (G.merch && dist(G.merch, P) < 420) label(G.merch.x, G.merch.y, 2, 'Wandering Merchant', '#ffd27a');
  if (S.cos.title && G.mode === 'play') { const t = titleName(); if (t) label(P.x, P.y, 1.25, t, '#ffd27a', 'italic 11px Georgia,serif'); }
};
function titleName() { const k = S.cos.title; if (!k) return ''; if (k.startsWith('s:')) return k.slice(2); const T = TITLES.find(t => t.k === k); return T ? T.n : ''; }
// HUD additions
const _updateHUD = updateHUD;
updateHUD = function (dt) {
  _updateHUD(dt);
  if (!S || !P || G.mode === 'title' || !M) return;
  const tr = G.trial;
  if (tr) { HC.sub = null; H['h-sub'].innerHTML = `${tr.kind === 'w' ? ico('swords') + ' Weekly Trial' : ico('sun') + ' Daily Trial'} <span style="color:${DIFFC[S.diff]}">• ${DIFF[S.diff]}</span>${tr.reward ? '' : ' <span class="dim">(practice)</span>'}`; HC.objT = null; HC.modT = null; const lt = Math.max(0, tr.left); setH(H['h-obj'], 'objT', tr.done ? `<span style="color:#7aff7a">${ico('check')} Trial over — take the portal</span>` : `<span style="color:${lt < 30 ? '#ff5a5a' : '#ffb07a'}">${ico('timer')} ${Math.floor(lt / 60)}:${String(Math.floor(lt % 60)).padStart(2, '0')}</span> — slay every foe (${G.killed}/${G.total})<div class="pbar"><div style="width:${G.killed / Math.max(1, G.total) * 100}%"></div></div>`); setH(H['h-mod'], 'modT', tr.rules.map(k => `<span style="color:#ff9a6a">${TRULES[k].ic} ${TRULES[k].n}</span>`).join(' • ')); HC.obj = null; HC.mod = null; }
  const xb = $('h-xp'); if (xb) { let r = xb.querySelector('.rest'); if (!r) { r = document.createElement('div'); r.className = 'rest'; xb.querySelector('.trk').insertBefore(r, xb.querySelector('.ticks')); } const xk = S.lvl >= MAXLVL ? 1 : S.xp / xpNeed(S.lvl); setS(r, 'rst', 'left', (xk * 100).toFixed(2) + '%'); setS(r, 'rsw', 'width', (Math.min(1 - xk, S.rested / xpNeed(Math.min(S.lvl, MAXLVL))) * 100).toFixed(2) + '%'); }
  const sp = $('mb-para'); if (sp) setH(sp, 'mbpa', S.para.pts > 0 ? S.para.pts : '');
  const sj = $('mb-sj'); if (sj) { const ss = S.season; let n = 0; if (ss) for (const o of seasonObjs()) if (!ss.claimed.includes(o.id) && chapOpen(o.c) && sjProg(o) >= o.need) n++; setH(sj, 'mbsj', n || ''); }
};
