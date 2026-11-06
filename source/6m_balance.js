// ================= BALANCE PACK: skills scale from weapon DPS (not per-hit), per-skill tuning =================
// Before: skills used per-hit weapon damage, so slow heavy weapons made every skill ~2.5x stronger.
function wNorm() { const w = WT[ST.wt] || WT.sword; let k = .4 / w.cd; if (w.cnt) k *= Math.min(w.cnt, 3) * .7; return k; }
const SK_BAL = { whirl: .45, slam: .8, leap: .9, blades: .53, arrows: .48, poison: .9, wolves: .15, knives: .8, fireball: .23, chain: 1.1, meteor: .38, fblink: .9, singularity: .46 };
let SK_ACTIVE = 0;
{ const _pdB = pdmg; pdmg = function () { const d = _pdB(); return SK_ACTIVE ? d * SK_ACTIVE : d; }; }
{ const _csB = castSkill; castSkill = function (id) { const k = id ? wNorm() * (SK_BAL[id] ?? 1) : 1; SK_ACTIVE = k; try { _csB(id); } finally { SK_ACTIVE = 0; } }; }
// Ember Surge, thorns and companion sparks also scale from weapon DPS now (and Surge is a little less explosive)
{ const _usB = unleashSurge; unleashSurge = function () { SK_ACTIVE = wNorm() * .7; try { _usB(); } finally { SK_ACTIVE = 0; } }; }
{ const _hpB = hurtPlayer; hurtPlayer = function (a, src) { const prev = SK_ACTIVE; SK_ACTIVE = wNorm(); try { return _hpB(a, src); } finally { SK_ACTIVE = prev; } }; }
{ const _uB = update; update = function (dt) { const n0 = G.pp ? G.pp.length : 0; _uB(dt); const k = S && S.cos && S.cos.pet; if (k && PETS[k] && G.pp) for (let i = n0; i < G.pp.length; i++) { const b = G.pp[i]; if (b.child && b.kind === 'spark' && b.col === PETS[k].col && !b.normed) { b.normed = 1; b.dmg *= wNorm(); } } }; }
// skill descriptions show the REAL numbers for your current weapon
for (const s of SK) { if (!s.d) continue; const d0 = s.d; s.d = r => { let t = d0(r); if (!ST || !ST.wt) return t; const k = wNorm() * (SK_BAL[s.id] ?? 1); const pd = pdmg(); return t.replace(/(\d+)% weapon damage/g, (m, n) => `<b style="color:#ffd27a">${fmt(Math.max(1, n * k / 100 * pd))}</b> damage`); }; }
WIKI_TXT.skills = WIKI_TXT.skills || [];
WIKI_TXT.skills.push(['Skill Power', 'Skill damage is based on your weapon\'s damage per second, not per hit, so every weapon powers skills equally (a slow Warhammer no longer makes skills twice as strong). Skill tooltips always show the real numbers for the weapon you are holding. Skills add roughly a third to a half of your attack damage against a single foe, and much more against groups — use them together with your attacks.']);
