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
function easeFit(e, kind) { if (!e || e.prop || !easeOn() || ['dummy', 'tsentry', 'rplayer', 'gimp'].includes(e.type)) return; const c = easeCaps(kind); if (e.hp > c.hp) { e.hp = c.hp; e.maxHp = c.hp; } if (e.dmg > c.dmg) e.dmg = c.dmg; }
{ const _mkE7 = mkEnemy; mkEnemy = function (type, x, y, o = {}) { const e = _mkE7(type, x, y, o); easeFit(e, e && e.elite ? 'elite' : e && e.minion ? 'minion' : 'n'); return e; }; }
{ const _mbE7 = mkBoss; mkBoss = function (k, x, y) { const e = _mbE7(k, x, y); easeFit(e, 'boss'); return e; }; }
WIKI_TXT.basics.push(['Fair Difficulty', 'On story floors no monster is ever tougher than your own strength allows: at the start a normal foe falls in about a second and a half and hits for under 5% of your life, and each region adds a little. Better gear still makes fights faster. Higher difficulties raise these limits. The Abyss, the Rift Atlas and the Endless Arena have their own tuning.']);
