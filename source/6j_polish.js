// ================= POLISH PACK: level milestones, XP insight, loot upgrade marks, auto-potion, floor clears, daily guardian, off-screen elites, session summary =================
// ---------- session tracking ----------
let SESS = null;
function sessInit() { SESS = { t: S.stats.time, k: S.stats.kills, lv: S.lvl, xp: 0, gold: 0 }; }
// ---------- level-up card & milestones ----------
const LV_CARD = document.createElement('div'); LV_CARD.id = 'lvcard'; document.body.appendChild(LV_CARD);
let lvCardT = 0;
const _gxJ = gainXP;
gainXP = function (x) {
  const l0 = S.lvl, x0 = S.xp, hp0 = ST.maxHp, mp0 = ST.maxMp; _gxJ(x);
  if (SESS) SESS.xp += Math.max(0, S.lvl > l0 ? x * (1 + ST.xp / 100) : S.xp - x0);
  if (S.lvl <= l0) return;
  const rw = [];
  for (let L = l0 + 1; L <= S.lvl; L++) {
    if (L % 5 === 0) { S.marks += 10; addGem(pick2(Object.keys(GEMS)), gemTier()); rw.push('🔶 10 Marks + 💎 a gem'); }
    if (L % 10 === 0) { S.sp += 1; const it = genItem(maxPw() + 1, { minR: 3 }); it.isNew = true; (S.inv.length < S.invMax ? S.inv : S.stash).push(it); noteFound(it); rw.push(`+1 bonus skill point and <span style="color:${RAR[it.r].c}">${it.name}</span>`); }
  }
  const n = S.lvl - l0;
  LV_CARD.innerHTML = `<div class="lt">LEVEL ${S.lvl}</div><div class="ls">❤ +${fmt(ST.maxHp - hp0)} life • 💧 +${fmt(ST.maxMp - mp0)} mana • ✨ +${n} skill point${n > 1 ? 's' : ''} <span class="dim">[K]</span></div>${rw.length ? `<div class="lm">🏅 Milestone: ${rw.join(' • ')}</div>` : `<div class="dim" style="font-size:11px">Next milestone at level ${Math.ceil((S.lvl + 1) / 5) * 5}</div>`}`;
  LV_CARD.classList.remove('on'); void LV_CARD.offsetWidth; LV_CARD.classList.add('on'); lvCardT = 3.6;
};
// ---------- XP tooltip: rate and time to level ----------
{ const _ihJ = initHUD; initHUD = function () { _ihJ(); const xb = $('h-xp'); if (!xb) return; xb.style.pointerEvents = 'auto'; xb.onmousemove = moveTip; xb.onmouseleave = hideTip; xb.onmouseenter = ev => { if (!S || !P) return;
  const rate = SESS && S.stats.time - SESS.t > 30 ? SESS.xp / ((S.stats.time - SESS.t) / 60) : 0, need = xpNeed(S.lvl) - S.xp;
  tipHTML(`<b>Level ${S.lvl}</b>${S.lvl >= MAXLVL ? '<div>Max level reached — experience now feeds the Constellation.</div>' : `<div>${fmt(S.xp)} / ${fmt(xpNeed(S.lvl))} XP — ${fmt(need)} to go</div>`}
  ${rate > 0 && S.lvl < MAXLVL ? `<div class="dim">This session: ${fmt(rate)} XP/min • next level in ~${Math.max(1, Math.round(need / rate))} min</div>` : '<div class="dim">Play a little to see your XP rate.</div>'}
  ${S.rested > 0 ? `<div style="color:#8ab8ff">🛌 Rested: ${fmt(S.rested)} bonus XP (striped blue)</div>` : ''}<div class="dim">Every 5 levels: Marks + a gem. Every 10: a bonus skill point and an Epic+ item.</div>`, ev); }; }; }
// ---------- upgrade marks on ground loot ----------
function pickMark(p) { if (!p.gpT || G.t - p.gpT > 2) { p.gpT = G.t; try { p.gp = gainPct(p.it); } catch (e) { p.gp = 0; } } return p.gp > .5 ? ` ▲${p.gp >= 10 ? Math.round(p.gp) : p.gp.toFixed(1)}%` : ''; }
// ---------- auto-potion (optional) ----------
let apT = 0;
const _uJ = update;
update = function (dt) {
  if (S && !SESS) sessInit();
  _uJ(dt);
  if (lvCardT > 0) { lvCardT -= dt; if (lvCardT <= 0) LV_CARD.classList.remove('on'); }
  if (G.mode !== 'play' || G.menu || !S || !P || G.inTown) return;
  const th = S.opts.autopot || 0; apT -= dt;
  if (th && apT <= 0 && S.pots > 0 && P.hp > 0 && P.hp < ST.maxHp * th) { apT = 1.5; drinkPotion(); dmgText(P.x, P.y - 34, 'Auto-potion', '#ff9aa0', false, 2); }
  // floor cleared bonus
  if (!G.cleared && G.total > 0 && G.killed >= G.total && !G.boss && !G.trial && !G.tutorial) {
    G.cleared = true; S.stats.cleared = (S.stats.cleared || 0) + 1; const g = Math.round(Math.pow(1.12, G.pw) * 30 * (1 + goldEff() / 100)); S.gold += g; gainXP(Math.round(xpNeed(S.lvl) * .06) / (1 + ST.xp / 100));
    drop('ore', 2, P.x, P.y); feed(`🧹 <b>Floor cleared!</b> Every foe slain: <span class="gold">+${fmt(g)} gold</span>, +6% XP, 2 ◆ ore`, '#7aff7a'); sfx('shrine');
  }
};
{ const _rlJ = resetLevel; resetLevel = function () { _rlJ(); G.cleared = false; }; }
{ const _stJ = MENUS.settings; MENUS.settings = () => { const h = _stJ(); if (!S) return h; const o = S.opts.autopot || 0;
  return h.replace('<div class="btn bigb" onclick="backMenu()">Back</div>', `<div class="card">🧪 Auto-potion ${[[0, 'Off'], [.25, 'Below 25%'], [.4, 'Below 40%']].map(([v, n]) => `<span class="btn ${o === v ? 'on' : ''}" onclick="setOpt('autopot',${v})">${n}</span>`).join('')}<div class="dim">Drinks a health potion automatically when your life drops below the threshold.</div></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }; }
// ---------- first guardian of the day ----------
{ const _bdJ = bossDefeated; bossDefeated = function (e) { _bdJ(e); if (G.trial || G.gauntlet) return; const d = dayId(); if (S.dailyBoss === d) return; S.dailyBoss = d; S.marks += 20;
  for (let i = 0; i < 2; i++) dropItem(genItem(G.pw + 1, { minR: 2, bonus: .3 }), e.x, e.y); dropGem(e.x, e.y);
  G.later.push({ t: 1.2, fn: () => toast('☀ First Guardian of the day: +20 Marks, 2 bonus Rare+ items and a gem!', '#ffd27a') }); }; }
// ---------- off-screen elite & champion pointers ----------
const _doJ = drawOverlay;
drawOverlay = function () {
  _doJ(); if (!R3 || !P || !S || G.mode !== 'play' || G.menu || G.inTown || G.hideHud) return;
  const m = 60; let n = 0;
  for (const e of G.ens) {
    if (e.dead || e.prop || !(e.elite || e.champ) || e.boss || n > 5) continue; const d = dist(e, P); if (d > 900) continue;
    const s = proj(e.x, e.y, 1); if (s.vis && s.x > m && s.x < VW - m && s.y > m && s.y < VH - m) continue; n++;
    const cx = VW / 2, cy = VH / 2, a = Math.atan2(s.y - cy, s.x - cx) + (s.vis ? 0 : Math.PI), rx = VW / 2 - 40, ry = VH / 2 - 40, k = Math.min(rx / Math.abs(Math.cos(a) || 1e-6), ry / Math.abs(Math.sin(a) || 1e-6));
    const ex = cx + Math.cos(a) * k, ey = cy + Math.sin(a) * k, col = e.champ ? '#ffd27a' : (ELITES[e.elite] || '#ff8a6a');
    X.save(); X.translate(ex, ey); X.rotate(a); X.globalAlpha = .55 + .45 * Math.max(0, 1 - d / 900); X.fillStyle = col; X.strokeStyle = '#000'; X.lineWidth = 2;
    X.beginPath(); X.moveTo(12, 0); X.lineTo(-6, -8); X.lineTo(-2, 0); X.lineTo(-6, 8); X.closePath(); X.stroke(); X.fill(); X.restore();
  }
};
// ---------- session summary in the menu ----------
{ const _paJ = MENUS.pause; MENUS.pause = () => { const h = _paJ(); if (!SESS) return h; const t = S.stats.time - SESS.t, mins = t / 60;
  const parts = [`<b>${fmtTime(t)}</b>`, `${fmt(S.stats.kills - SESS.k)} kills`]; if (S.lvl - SESS.lv > 0) parts.push(`+${S.lvl - SESS.lv} level${S.lvl - SESS.lv > 1 ? 's' : ''}`); if (mins > .5) parts.push(`${fmt(SESS.xp / mins)} XP/min`);
  const line = `<div style="text-align:center;margin:-6px 0 10px;font-size:13px;color:#c8b890">📅 This session: ${parts.join(' • ')}</div>`;
  return h.replace('<div class="hub">', line + '<div class="hub">'); }; }
{ const _cgJ = continueGame; continueGame = function () { _cgJ(); sessInit(); }; const _ngJ = newGame; newGame = function (c) { _ngJ(c); if (S) sessInit(); }; }
// ---------- feats & wiki ----------
ACH.push({ id: 'clr25', n: 'Clean Sweep', d: 'Clear every foe on 25 floors', c: () => S.stats.cleared || 0, need: 25, sp: 1 });
WIKI_TXT.basics.push(
  ['Levels & Milestones', 'The bar under your skills is your level bar: the badge shows your level, the gold fill your XP and the striped blue part your Rested bonus. Hover it for your XP rate and time to the next level. Every 5 levels you earn Marks and a gem; every 10 levels a bonus skill point and an Epic+ item.'],
  ['Floor Clears & Daily Guardian', 'Slay every foe on a floor (not just the 70% that opens the stairs) for a Floor Cleared bonus of gold, XP and ore. The first Guardian you defeat each day drops 2 extra Epic+ items, a gem and 20 Marks.'],
  ['Handy Helpers', 'Ground loot labels show ▲ and the power gain when an item would be an upgrade. Colored arrows at the screen edge point to elites and champions just out of view. Settings → Auto-potion can drink potions for you at low life. The ☰ Menu shows a summary of your current session.'],
);
