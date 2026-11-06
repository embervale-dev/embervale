// ================= RARITY & DANGER PACK: new rarities above Mythic, scarcer loot, much tougher monsters =================
// Five new rarities. (Index 6 stays Celestial — forged artifacts.) Each carries TWO legendary powers.
RAR.push(
  { n: 'Ancient',    c: '#e0c27a', aff: 5, m: 2.6 },
  { n: 'Exalted',    c: '#f2f4ff', aff: 6, m: 2.95 },
  { n: 'Primordial', c: '#ff6a1a', aff: 6, m: 3.35 },
  { n: 'Divine',     c: '#ffe94a', aff: 7, m: 3.8 },
  { n: 'Eternal',    c: '#ff5af0', aff: 7, m: 4.4 },
);
// base chance per item roll (before luck / bonuses) and where each tier can appear
const RAR_ODDS = [
  // [rarity index, chance, unlock test, where]
  [11, .000006, () => S.diff >= 3 || (G.abyss && G.depth >= 50), 'Inferno, or Abyss depth 50+'],
  [10, .000015, () => S.diff >= 2 || (G.abyss && G.depth >= 30), 'Nightmare+, or Abyss depth 30+'],
  [9,  .00004, () => S.diff >= 1 || G.abyss, 'Veteran+, or the Abyss'],
  [8,  .0001,  () => G.pw >= 20, 'Bloodmoon Marsh onward (power 20+)'],
  [7,  .00025, () => G.pw >= 10, 'mid Sunken Crypt onward (power 10+)'],
  [5,  .0012,  () => S.diff >= 2 || G.abyss, 'Nightmare+, or the Abyss'],
  [4,  .0035,  () => true, 'everywhere'],
  [3,  .02,    () => true, 'everywhere'],
  [2,  .085,   () => true, 'everywhere'],
  [1,  .3,     () => true, 'everywhere'],
];
// rarity power curve: everyday gear is modest, truly rare gear is a huge jump
[1, 1.07, 1.16, 1.3, 1.6, 2.05, 2.5, 2.8, 3.3, 3.9, 4.6, 5.5].forEach((m, i) => { if (RAR[i]) RAR[i].m = m; });
// all weapon damage is scaled down: fights should be a challenge, not a blender
const WDMG_MUL = .55;
// monsters: MUCH tougher (replaces the earlier gentle bump)
MON_HP = 3.0; MON_DMG = 1.9; BOSS_HP = 2.4; BOSS_DMG = 1.75;
// three new elite traits
Object.assign(ELITES, { Unstoppable: '#c0c0d0', Enraged: '#ff2a2a', Splitting: '#7aff5a' });
// Ascension: a slow, expensive but certain path to a higher rarity (up to Legendary)
const ASCEND = { 1: { ore: 15, ess: 0, heart: 0, g: 1 }, 2: { ore: 35, ess: 1, heart: 0, g: 3 }, 3: { ore: 80, ess: 6, heart: 1, g: 10 } };
