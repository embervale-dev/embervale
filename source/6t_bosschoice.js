// ================= AFTER A GUARDIAN: choose to push on to the next level or head home =================
let EXIT_ARMED = true;
function bossExit() { // returns true when it handled the portal this frame
  if (!EXIT_ARMED) return false;
  EXIT_ARMED = false; sfx('stairs'); openMenu('bosschoice'); return true;
}
{ const _uX = update; update = function (dt) { _uX(dt); if (!EXIT_ARMED && G.exit && P && dist(P, G.exit) > 70) EXIT_ARMED = true; if (!G.exit) EXIT_ARMED = true; }; }
function bcNext() { closeMenu();
  if (G.abyss) { nextFloor(); return; }
  const r = G.region + 1; if (r < NREG) { if (S.lvl < reqLvl(r, S.diff)) { toast(`You need level ${reqLvl(r, S.diff)} for ${REG[r].n}`, '#ff8a8a'); goTown(); return; } enterFloor(r, 0); return; }
  if (S.done[S.diff].every(Boolean)) enterFloor(ABYSS_R, 0, 1); else goTown(); }
function bcHome() { closeMenu(); goTown(); }
MENUS.bosschoice = () => {
  const items = G.pick.filter(p => p.k === 'item').length, pots = `${S.pots}/${S.potMax}`, life = `${fmt(P.hp)} / ${fmt(ST.maxHp)}`;
  let next = '', note = '';
  if (G.gauntlet || G.trial) next = '';
  else if (G.abyss) { next = `▼ Descend to Abyss Depth ${G.depth + 1}`; note = 'Foes grow stronger with every depth.'; }
  else if (G.region + 1 < NREG) { const r = G.region + 1, rec = reqLvl(r, S.diff); next = `▶ Continue to ${REG[r].n} — Floor 1`; note = `Recommended level ${rec}+ • you are level ${S.lvl}${S.lvl < rec ? ' <span style="color:#ff9a6a">(it will be tough!)</span>' : ' <span class="up">(ready)</span>'}`; }
  else if (S.done[S.diff].every(Boolean)) { next = '▼ Enter the Abyss — Depth 1'; note = 'The endless descent. How deep can you go?'; }
  const title = G.abyss ? `Abyss Depth ${G.depth} Cleared` : `${REG[G.region].n} Conquered!`;
  return `<div style="min-width:560px;max-width:640px;text-align:center"><h2>💀 ${title}</h2>
    <div class="dim" style="margin-bottom:10px">Where to next, Kindled?</div>
    <div class="bcstat">❤ ${life} &nbsp;•&nbsp; 🧪 ${pots} potions &nbsp;•&nbsp; 🎒 ${S.inv.length}/${S.invMax} bag${items ? ` &nbsp;•&nbsp; <span style="color:#ffb04a">⚠ ${items} item${items > 1 ? 's' : ''} still on the ground</span>` : ''}</div>
    ${next ? `<div class="bcopt" onclick="bcNext()"><b>${next}</b><div class="dim">${note}<br>Keep your current life and potions — no trip home.</div></div>` : ''}
    <div class="bcopt" onclick="bcHome()"><b>🏡 Return to Haven</b><div class="dim">Refill life and potions, sell and upgrade your loot, then travel again from the Waystone.</div></div>
    <div class="dim" style="margin-top:8px;font-size:12px">Press Esc to stay here and keep exploring — step back into the portal to choose again.</div></div>`;
};
const bcStyle = document.createElement('style'); bcStyle.textContent = `.bcstat{font-size:13px;color:#e8dcc0;background:rgba(0,0,0,.25);border-radius:10px;padding:6px 10px;margin:0 0 12px}
.bcopt{cursor:pointer;text-align:left;margin:8px 0;padding:12px 16px;border-radius:12px;border:1px solid rgba(193,154,85,.45);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(0,0,0,.15));transition:border-color .12s,background .12s}
.bcopt:hover{border-color:#f2c466;background:linear-gradient(180deg,rgba(242,196,102,.12),rgba(0,0,0,.1))}.bcopt b{font-size:17px;color:#f4d9a0}.bcopt .dim{font-size:12.5px;margin-top:3px}`; document.head.appendChild(bcStyle);
WIKI_TXT.basics.push(['After a Guardian', 'Defeating a Guardian opens a portal. Step into it to choose: continue straight to the next region\'s first floor (keeping your current life and potions), or return to Haven to refill, sell and upgrade. In the Abyss you choose between descending deeper and going home. Press Esc to stay and finish exploring.']);
