// ================= FAIR STORY DIFFICULTY: monsters are capped by YOUR strength, so the start is never a wall =================
// Story floors (regions, guardians, trials) cap every foe's life and hit by your own damage and life.
// Floor 1: a normal foe falls in ~1.5 s and hits for ~4% of your life; each step of progress adds a little.
// The caps only ever LOWER a foe — if your gear outgrows the world, fights get easier, as they should.
// The Abyss, Rift Atlas and Endless Arena keep their own tuning.
function easeOn() { return !G.abyss && !G.rift && !G.arena && !G.duel && !G.tutorial && !(typeof NET !== 'undefined' && NET.coopGuest); }
function easeCaps(kind) { const pw = Math.max(0, G.pw | 0), dk = 1 + (S.diff | 0) * .35, hk = 1 + (S.diff | 0) * .3, drk = Math.max(.4, 1 - Math.min(60, (ST && ST.dr) || 0) / 100);
  const t = (kind === 'boss' ? 22 + pw * .6 : (1.5 + pw * .04) * (kind === 'elite' ? 2.8 : kind === 'minion' ? .5 : 1)) * dk;
  const hit = Math.min(.45, (.04 + pw * .0025) * (kind === 'boss' ? 1.6 : kind === 'elite' ? 1.25 : 1) * hk);
  return { hp: myDps() * t, dmg: myLife() * hit / drk }; }
// VETERAN and harder: your gear carries over, so foes get a FLOOR tuned to your strength instead (Normal is untouched).
// Veteran start: a normal foe takes ~2.8 s and hits for ~9% of your life; Nightmare and Inferno push both much further.
const VET_K = [0, 1, 1.4, 1.9], VET_H = [0, 1, 1.25, 1.55];
function vetCaps(kind) { const d = S.diff | 0, rel = Math.max(0, (G.region | 0) * 7 + (G.floor | 0)), drk = Math.max(.4, 1 - Math.min(60, (ST && ST.dr) || 0) / 100);
  const t = (kind === 'boss' ? 30 + rel * .55 : (2.8 + rel * .045) * (kind === 'elite' ? 2.8 : kind === 'minion' ? .5 : 1)) * VET_K[d];
  const hit = Math.min(.5, (.09 + rel * .0022) * (kind === 'boss' ? 1.25 : kind === 'elite' ? 1.2 : 1) * VET_H[d]);
  return { hp: myDps() * t, dmg: myLife() * hit / drk }; }
function easeFit(e, kind) { if (!e || e.prop || !easeOn() || ['dummy', 'tsentry', 'rplayer', 'gimp'].includes(e.type)) return;
  if ((S.diff | 0) >= 1) { const c = vetCaps(kind); e.hp = e.maxHp = clamp(e.hp, c.hp * .85, c.hp * 1.3); e.dmg = clamp(e.dmg, c.dmg * .85, c.dmg * 1.3); return; }
  const c = easeCaps(kind); if (e.hp > c.hp) { e.hp = c.hp; e.maxHp = c.hp; } if (e.dmg > c.dmg) e.dmg = c.dmg; }
{ const _mkE7 = mkEnemy; mkEnemy = function (type, x, y, o = {}) { const e = _mkE7(type, x, y, o); easeFit(e, e && e.elite ? 'elite' : e && e.minion ? 'minion' : 'n'); return e; }; }
{ const _mbE7 = mkBoss; mkBoss = function (k, x, y) { const e = _mbE7(k, x, y); easeFit(e, 'boss'); return e; }; }
WIKI_TXT.basics.push(['Fair Difficulty', 'On story floors no monster is ever tougher than your own strength allows: at the start a normal foe falls in about a second and a half and hits for under 5% of your life, and each region adds a little. Better gear still makes fights faster. On Veteran and harder your gear carries over, so foes are instead never weaker than a real challenge for your strength: a Veteran foe takes about 3 seconds and hits for about 9% of your life at the start, and Nightmare and Inferno are far tougher still. The Abyss, the Rift Atlas and the Endless Arena have their own tuning.']);
// entering a floor records progress AFTER its foes spawn, which can raise your gear's attunement — re-tune once the floor is ready
{ const _efE7 = enterFloor; enterFloor = function (r, f, d) { _efE7(r, f, d); if (!S || !easeOn()) return; calcStats(); for (const e of G.ens) if (!e.dead && !e.prop) easeFit(e, e.boss ? 'boss' : e.elite ? 'elite' : e.minion ? 'minion' : 'n'); }; }
