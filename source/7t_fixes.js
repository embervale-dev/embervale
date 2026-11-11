// ================= FIX PASS: unlocks that leaked, multiplayer from the start =================
// ---------- Rifts, the Arena and Abyss challenges never write story progress (they used to unlock floors/regions) ----------
function keepProgress(fn) { return function () { const d = S.diff, keepLast = S.last ? { ...S.last } : null, keepProg = S.prog[d].slice(); const r = fn.apply(this, arguments); S.prog[d] = keepProg; S.last = keepLast; return r; }; }
for (const k of ['startRift', 'startDaily', 'startArena']) if (typeof window[k] === 'function') window[k] = keepProgress(window[k]);
startRift = window.startRift; startDaily = window.startDaily; startArena = window.startArena;
// ---------- the Waystone (and its Resume button) only travels where you have unlocked ----------
function travelWhy(r, f) { const d = S.diff;
  if (r === ABYSS_R) return S.done[d][NREG - 1] ? '' : 'Defeat The Unmaker on this difficulty first';
  if (!REG[r]) return 'Unknown region'; if (r > 0 && !S.done[d][r - 1]) return `${REG[r].n} is locked — defeat the previous Guardian`;
  if (S.lvl < reqLvl(r, d)) return `Reach level ${reqLvl(r, d)} first`;
  if (!S.done[d][r] && f > (S.prog[d][r] | 0)) return `Reach floor ${f + 1} the normal way first`; return ''; }
{ const _trF = travel; travel = function (r, f, depth) { const why = travelWhy(r, f | 0); if (why) { toast(`${ico('lock')} ${why}`, '#ff8a8a'); sfx('error'); return; } return _trF(r, f, depth); }; }
// ---------- co-op: a guest must have earned the Rift Atlas to follow the leader into a Rift ----------
if (typeof floorSnap === 'function') { const _fsF = floorSnap; floorSnap = function () { const R = _fsF(); if (R && G.rift) R.rift = 1; if (R && G.arena) R.arena = 1; return R; }; }
{ const _rfF = recvFloor; recvFloor = function (m) { const R = m && m.R; if (R && R.rift && !(S.done[R.diff | 0] && S.done[R.diff | 0][NREG - 1])) { if (NET.lastNo !== m.area) { NET.lastNo = m.area; toast(`${ico('globe')} Your party entered a Rift — you need to defeat The Unmaker on ${DIFF[R.diff | 0]} to join. Keep playing; you'll join when they're somewhere you've unlocked.`, '#ffb07a'); toHost({ t: 'cantjoin', id: NET.id, why: 'has not unlocked the Rift Atlas' }); } return; } return _rfF(m); }; }
// ---------- multiplayer is available from the very start ----------
UNLOCK.mp.ok = () => true; UNLOCK.mp.how = 'Always available';
