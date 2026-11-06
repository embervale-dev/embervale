// ================= HUD (DOM) =================
const H = {};
const HC = {}; // cache of last-set strings
function setH(el, k, v) { if (HC[k] !== v) { HC[k] = v; el.innerHTML = v; } }
function setS(el, k, prop, v) { const kk = k + prop; if (HC[kk] !== v) { HC[kk] = v; el.style[prop] = v; } }
function initHUD() {
  const slots = ['Q', 'E', 'R', 'F'].map((k, i) => `<div class="slot" id="sl${i}"><div class="ic"></div><div class="cd"></div><div class="cdt"></div><div class="key">${k}</div><div class="mpc"></div></div>`).join('');
  $('hud').innerHTML = `
  <div id="h-left"><div id="h-tl" class="hpan"><div id="h-reg"></div><div id="h-sub"></div><div id="h-obj"></div><div id="h-mod"></div></div>
  <div id="h-res" class="hpan"></div>
  <div id="h-buffs"></div></div>
  <div id="h-tr"><div class="hpan mini"><canvas id="mini" width="190" height="190"></canvas></div><div id="h-q" class="hpan"></div></div>
  <div id="h-boss"><div class="bn"></div><div class="bbar"><div class="btrail"></div><div class="bfill"></div><div class="bmark" style="left:50%"></div><div class="bmark" style="left:20%"></div></div><div class="bt"></div></div>
  <div id="h-combo"><div class="cn">0</div><div class="cl">COMBO</div><div class="cb"></div><div class="cbar"><div></div></div></div>
  <div id="h-bottom">
    <div class="globe hp"><div class="liq"></div><div class="shine"></div><div class="gt"></div></div>
    <div class="hcenter">
      <div id="h-slots">${slots}
        <div class="slot surge" id="slv"><div class="ic">${ico('fire')}</div><div class="cd"></div><div class="cdt"></div><div class="key">V</div></div>
        <div class="slot" id="slp"><div class="ic">${ico('potion')}</div><div class="cdt"></div><div class="key">1</div></div>
        <div class="slot wep" id="slw"><div class="ic"></div><div class="ic2"></div><div class="key">Tab</div></div>
      </div>
      <div id="h-xp"><div class="lvb"></div><div class="trk"><div class="fill"></div><div class="ticks"></div><span class="xpt"></span></div></div>
    </div>
    <div class="globe mp"><div class="liq"></div><div class="shine"></div><div class="gt"></div></div>
  </div>
  <div id="lootfeed"></div>
  <div id="h-banner"><div class="a"></div><div class="b"></div></div>
  <div id="h-menu">${[['inv', ico('bag'), 'Inventory', 'I'], ['skills', ico('sparkle'), 'Skills & Constellation', 'K'], ['map', ico('map'), 'Map', 'M'], ['season', ico('medal'), 'Season Journey', 'Y'], ['pause', '☰', 'Menu — everything else', 'Esc']].map(b => `<div class="mb" onclick="hudBtn('${b[0]}')" title="${b[2]} [${b[3]}]">${b[1]}<span>${b[3]}</span>${b[0] === 'skills' ? '<i id="mb-sp"></i><i id="mb-para" class="l"></i>' : b[0] === 'pause' ? '<i id="mb-q"></i>' : b[0] === 'season' ? '<i id="mb-sj"></i>' : ''}</div>`).join('')}</div>
  <div id="h-target"><div class="tn"></div><div class="tbar"><div></div></div><div class="ti"></div></div>
  <div id="hintbox"></div><div id="h-vig"></div><div id="h-hurt"></div>`;
  for (const id of ['h-target', 'mb-sp', 'mb-q', 'h-reg', 'h-sub', 'h-obj', 'h-mod', 'h-res', 'h-buffs', 'h-q', 'h-boss', 'h-combo', 'h-xp', 'h-banner', 'h-vig', 'h-hurt', 'mini', 'slv', 'slp', 'slw']) H[id] = $(id);
  H.hpL = $('hud').querySelector('.globe.hp .liq'); H.hpT = $('hud').querySelector('.globe.hp .gt');
  H.mpL = $('hud').querySelector('.globe.mp .liq'); H.mpT = $('hud').querySelector('.globe.mp .gt');
  H.slots = [0, 1, 2, 3].map(i => $('sl' + i));
  H.mctx = H.mini.getContext('2d');
}
let hudT = 0, miniT = 0, bossTrail = 1;
function updateHUD(dt) {
  const hud = $('hud');
  const show = G.mode !== 'title' && S && P && M;
  hud.style.display = show ? 'block' : 'none'; if (!show) return;
  // globes
  const hpk = clamp(P.hp / ST.maxHp, 0, 1), mpk = clamp(P.mp / ST.maxMp, 0, 1);
  setS(H.hpL, 'hpl', 'height', (hpk * 100).toFixed(1) + '%'); setS(H.mpL, 'mpl', 'height', (mpk * 100).toFixed(1) + '%');
  setH(H.hpT, 'hpt', `${fmt(Math.max(0, P.hp))}<small>/${fmt(ST.maxHp)}</small>`); setH(H.mpT, 'mpt', `${fmt(P.mp)}<small>/${fmt(ST.maxMp)}</small>`);
  // skills
  H.slots.forEach((el, i) => {
    const id = S.bind[i], ic = el.children[0], cd = el.children[1], cdt = el.children[2], mpc = el.children[4];
    if (!id) { setH(ic, 'si' + i, ''); setS(cd, 'sc' + i, 'background', 'none'); setH(cdt, 'st' + i, ''); setH(mpc, 'sm' + i, ''); el.classList.add('emp'); return; }
    el.classList.remove('emp');
    const sk = SKI[id], c = P.cds[id] || 0, mx = sk.cd * (1 - ST.cdr / 100) * (RUNES[runeOf(id)] ? RUNES[runeOf(id)].cd : 1);
    setH(ic, 'si' + i, sk.ic); setH(mpc, 'sm' + i, sk.mp);
    const pct = c > 0 ? Math.round(c / mx * 100) : 0;
    setS(cd, 'sc' + i, 'background', pct ? `conic-gradient(rgba(5,5,12,.78) ${pct}%, transparent ${pct}%)` : 'none');
    setH(cdt, 'st' + i, c > 0 ? (c < 10 ? c.toFixed(1) : Math.ceil(c)) : '');
    el.classList.toggle('nomp', c <= 0 && P.mp < sk.mp);
    el.classList.toggle('ready', c <= 0 && P.mp >= sk.mp);
  });
  const sp = Math.floor(P.surge);
  setS(H.slv.children[1], 'svc', 'background', `conic-gradient(rgba(255,140,40,.55) ${sp}%, rgba(5,5,12,.7) ${sp}%)`);
  setH(H.slv.children[2], 'svt', sp >= 100 ? '' : sp + '%'); H.slv.classList.toggle('full', sp >= 100);
  setH(H.slp.children[1], 'pt', `${S.pots}/${S.potMax}`); H.slp.classList.toggle('nomp', S.pots <= 0);
  setH(H.slw.children[0], 'w1', S.eq.weapon ? icon(S.eq.weapon) : ico('fist')); setH(H.slw.children[1], 'w2', S.eq.weapon2 ? icon(S.eq.weapon2) : '');
  // xp
  const xk = S.lvl >= MAXLVL ? 1 : S.xp / xpNeed(S.lvl);
  const XB = H['h-xp']; setS(XB.querySelector('.fill'), 'xp', 'width', (xk * 100).toFixed(2) + '%');
  setH(XB.querySelector('.lvb'), 'xpl', S.lvl >= MAXLVL ? 'MAX' : `Lv ${S.lvl}`);
  setH(XB.querySelector('.xpt'), 'xpt', S.lvl >= MAXLVL ? 'MAX LEVEL' : `${fmt(S.xp)} / ${fmt(xpNeed(S.lvl))} XP  •  ${(xk * 100).toFixed(1)}%`);
  if (XB._k !== undefined && xk > XB._k + .0005) { XB.classList.remove('gain'); void XB.offsetWidth; XB.classList.add('gain'); }
  if (XB._lv !== undefined && S.lvl > XB._lv) { XB.classList.remove('lvup'); void XB.offsetWidth; XB.classList.add('lvup'); }
  XB._k = xk; XB._lv = S.lvl;
  // combo
  const cb = H['h-combo'];
  if (P.combo >= 10 && !G.inTown) {
    cb.style.display = 'block'; setH(cb.children[0], 'cn', P.combo); setH(cb.children[2], 'cbn', `+${Math.round(comboBonus() * 100)}% damage`);
    setS(cb.children[3].children[0], 'cbw', 'width', (clamp(P.comboT / 3, 0, 1) * 100).toFixed(0) + '%');
    const tier = P.combo >= 200 ? '#ff4a6a' : P.combo >= 100 ? '#ff9a2e' : P.combo >= 50 ? '#ffd54a' : '#ffffff';
    setS(cb.children[0], 'cnc', 'color', tier);
  } else cb.style.display = 'none';
  // boss
  const bb = H['h-boss'];
  if (G.boss && !G.boss.dead) {
    const b = G.boss, k = clamp(b.hp / b.maxHp, 0, 1); bossTrail = Math.max(k, bossTrail - dt * .25);
    bb.style.display = 'block'; setH(bb.children[0], 'bn', b.d.n + (b.des ? ' <span style="color:#ff2a6a">— DESPERATE</span>' : b.enr ? ' <span style="color:#ff6a5a">— ENRAGED</span>' : ''));
    setS(bb.querySelector('.bfill'), 'bf', 'width', (k * 100).toFixed(2) + '%'); setS(bb.querySelector('.btrail'), 'btr', 'width', (bossTrail * 100).toFixed(2) + '%');
    setH(bb.children[2], 'bt', `${fmt(b.hp)} / ${fmt(b.maxHp)}`);
  } else { bb.style.display = 'none'; bossTrail = 1; }
  // banner
  const bn = H['h-banner'];
  if (G.banner) { const b = G.banner, a = clamp(b.t, 0, 1) * clamp((3.2 - b.t) * 3, 0, 1); bn.style.opacity = a; setH(bn.children[0], 'ba', b.a); setH(bn.children[1], 'bb', b.b); setS(bn.children[0], 'bac', 'color', b.col); }
  else bn.style.opacity = 0;
  // target frame: the foe under your cursor
  const tg = H['h-target'];
  if (!G.inTown && !G.boss && R3) {
    const W = mouseWorld(); let t = null, bd = 70;
    for (const e of G.ens) { if (e.dead || e.prop) continue; const d = Math.hypot(e.x - W.x, e.y - W.y) - e.r; if (d < bd) { bd = d; t = e; } }
    if (t) {
      tg.style.display = 'block'; const b = S.best[t.type] || { k: 0 }, hb = hunterBonus(t.type);
      setH(tg.children[0], 'tn', `${t.elite ? `<span style="color:${ELITES[t.elite]}">${eliteName(t)}</span> ` : ''}${t.d.n}`);
      setS(tg.children[1].children[0], 'tb', 'width', (clamp(t.hp / t.maxHp, 0, 1) * 100).toFixed(1) + '%');
      const st = [t.burn > 0 ? ico('fire') : '', t.psn > 0 ? ico('poison') : '', t.frz > 0 ? ico('snow') : '', t.shk > 0 ? ico('bolt') : '', t.stun > 0 ? ico('stun') : ''].join('');
      setH(tg.children[2], 'ti', `${fmt(t.hp)} / ${fmt(t.maxHp)} ${st} <span class="dim">• slain ${b.k}${hb ? ` • +${hb * 100}% dmg` : ''}</span>`);
    } else tg.style.display = 'none';
  } else tg.style.display = 'none';
  // vignettes
  H['h-vig'].style.opacity = hpk < .3 ? (.55 + .25 * Math.sin(G.t * 6)) * (1 - hpk / .3) : 0;
  H['h-hurt'].style.opacity = Math.max(0, G.hurtFlash * 2);
  // slower text panels
  hudT -= dt;
  if (hudT <= 0) {
    hudT = .12;
    const R = curReg();
    setH(H['h-reg'], 'reg', G.inTown ? 'Haven' : R.n);
    setH(H['h-sub'], 'sub', (G.inTown ? 'The last free village' : G.abyss ? `Abyss Depth ${G.depth}` : `Floor ${G.floor + 1} / ${FLOORS}${G.floor === BOSS_F ? ' — Guardian' : ''}`) + ` <span style="color:${DIFFC[S.diff]}">• ${DIFF[S.diff]}</span>`);
    let obj = '';
    if (G.inTown) obj = `<span class="dim">Visit the ${ico('portal')} Waystone to travel</span>`;
    else if (G.boss) obj = `<span style="color:#ff7a6a">${ico('swords')} Defeat the guardian</span>`;
    else if (G.exit) obj = `<span style="color:#7ab8ff">${ico('portal')} The portal is open</span>`;
    else if (G.stairs) { const need = Math.ceil(G.total * .7); obj = G.stairsOpen ? `<span style="color:#7aff7a">↓ Stairs open</span> <span class="dim">${G.killed}/${G.total} slain</span>` : `<span style="color:#ffb07a">${ico('lock')} Slay ${need - G.killed} more to unseal</span><div class="pbar"><div style="width:${G.killed / need * 100}%"></div></div>`; }
    setH(H['h-obj'], 'obj', obj);
    setH(H['h-mod'], 'mod', G.mod ? `<span style="color:${modDef().col}">✦ ${modDef().n}</span> <span class="dim">${modDef().d}</span>` : '');
    let dsum = 0; const D = G.dps || []; for (let i = 0; i < D.length; i += 2) if (D[i] > G.t - 5) dsum += D[i + 1];
    setH(H['mb-sp'], 'mbsp', S.sp > 0 ? S.sp : ''); const qd = S.quests.filter(q => q.have >= q.need).length; setH(H['mb-q'], 'mbq', qd ? qd : '');
    setH(H['h-res'], 'res', (dsum > 0 && !G.inTown ? `<span class="dpsm">${ico('swords')} ${fmt(dsum / 5)} DPS</span> ` : '') + `<b>Lv ${S.lvl}</b>${S.para.lvl ? ` <span style="color:#ffd27a">✦${S.para.lvl}</span>` : ''} <span style="color:#ff9a6a">${ico('marks')} ${S.marks}</span> <span class="gold">● ${fmt(S.gold)}</span> <span class="ore">◆ ${S.ore}</span> <span class="shard">✦ ${S.shards}</span>${S.sp > 0 ? ` <span class="spn">+${S.sp} skill pt${S.sp > 1 ? 's' : ''} [K]</span>` : ''}`);
    const BI = { fury: [ico('fire'), '#ff4a3a'], haste: [ico('wind'), '#4aff8a'], fortune: [ico('clover'), '#ffd84a'], wisdom: [ico('book'), '#4ab8ff'], aegis: [ico('shield'), '#d0d0ff'], berserk: [ico('sk-berserk'), '#ff3a3a'], regen: [ico('heart'), '#7aff9a'], windrun: [ico('tornado'), '#9affd0'], surge: [ico('sun'), '#ff9a2a'], echo: [ico('loop'), '#a0c0ff'], sanguine: [ico('blood'), '#ff3a5a'], tempest: [ico('storm'), '#e0f0ff'], plenty: [ico('gold'), '#ffe080'], warcry: [ico('sk-warcry'), '#ffb04a'] };
    let bh = ''; for (const k in P.buffs) if (P.buffs[k] > 0 && BI[k]) bh += `<div class="buff" title="${BUFF_D[k] || k}" style="border-color:${BI[k][1]}">${BI[k][0]}<span>${Math.ceil(P.buffs[k])}</span></div>`;
    if (G.warp > 0) bh += `<div class="buff" title="Time Warp: foes are slowed" style="border-color:#c0a0ff">${ico('hourglass')}<span>${Math.ceil(G.warp)}</span></div>`;
    if (P.nextCrit) bh += `<div class="buff" title="Your next hit is a guaranteed critical" style="border-color:#ffd54a">${ico('explosion')}<span>crit</span></div>`;
    setH(H['h-buffs'], 'buffs', bh);
    const qr = S.quests.filter(q => q.have >= q.need).length;
    H['h-q'].style.display = G.tutorial ? 'none' : '';
    setH(H['h-q'], 'q', `<div class="qh" onclick="S.opts.qtrack=!S.opts.qtrack" style="cursor:pointer;pointer-events:auto">${ico('scroll')} Bounties ${qr ? `<span style="color:#7aff7a">${qr} ready!</span>` : `<span class="dim">${S.quests.length} active</span>`} <span class="dim">${S.opts.qtrack ? '↓' : '→'}</span></div>` + (S.opts.qtrack ? S.quests.map(q => `<div class="qi ${q.have >= q.need ? 'qd' : ''}">${q.have >= q.need ? ico('check') : '•'} ${q.txt} <span>${fmt(q.have)}/${fmt(q.need)}</span></div>`).join('') : ''));
  }
  miniT -= dt; if (miniT <= 0) { miniT = .1; drawMini(); }
}
function drawMini() {
  const c = H.mctx, W = 190, s = miniS(), R = Math.floor(W / s / 2);
  c.clearRect(0, 0, W, W);
  const ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
  c.fillStyle = G.inTown ? '#8a7a60' : '#6a6a80';
  for (let dy = -R; dy < R; dy++) for (let dx = -R; dx < R; dx++) {
    const tx = ptx + dx, ty = pty + dy; if (tx < 0 || ty < 0 || tx >= M.w || ty >= M.h) continue;
    const i = ty * M.w + tx; if (M.seen[i] && M.t[i]) c.fillRect((dx + R) * s, (dy + R) * s, s, s);
  }
  const mark = (wx, wy, col, r = 3, force) => { const dx = wx / TILE - ptx, dy = wy / TILE - pty; if (Math.abs(dx) >= R || Math.abs(dy) >= R) return; if (!force && !M.seen[Math.floor(wy / TILE) * M.w + Math.floor(wx / TILE)]) return; c.fillStyle = col; c.beginPath(); c.arc((dx + R) * s, (dy + R) * s, r, 0, 6.283); c.fill(); };
  if (G.stairs) mark(G.stairs.x, G.stairs.y, G.stairsOpen ? '#ffb04a' : '#ff4a3a', 4.5);
  if (G.exit) mark(G.exit.x, G.exit.y, '#7ab8ff', 5, 1);
  for (const ch of G.chests) if (!ch.open) mark(ch.x, ch.y, '#ffd54a', 2.5);
  for (const sh of G.shrines) if (!sh.used) mark(sh.x, sh.y, sh.s.col, 3);
  for (const n of G.npcs) mark(n.x, n.y, n.col, 4, 1);
  const hunt = G.stairs && !G.stairsOpen && Math.ceil(G.total * .7) - G.killed <= 6;
  for (const e of G.ens) {
    if (e.prop) continue;
    if (e.type === 'gimp' && e.awake) mark(e.x, e.y, '#ffd54a', 3.5, 1);
    else if (hunt) mark(e.x, e.y, '#ff4a4a', 2.5, 1);
    else if (e.awake && (e.elite || e.boss)) mark(e.x, e.y, e.boss ? '#ff3a3a' : ELITES[e.elite], 3);
    else if (e.awake) mark(e.x, e.y, 'rgba(255,90,90,.7)', 1.6);
  }
  c.save(); c.translate(R * s, R * s); c.rotate(P.face); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4); c.lineTo(-2, 0); c.lineTo(-4, 4); c.closePath(); c.fill(); c.restore();
}

function hudBtn(m) { if (!S || G.mode !== 'play' || LOCKED_MENUS.includes(G.menu)) return; sfx('click'); if (G.menu === m) closeMenu(); else openMenu(m); }
