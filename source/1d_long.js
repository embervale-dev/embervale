// ================= LONG-TERM SYSTEMS: data =================
// ---- Ember Constellation (endless progression) ----
const PARA_C = [['Might', '#ff7a5a', '⚔️'], ['Guard', '#7ab0ff', '🛡️'], ['Swiftness', '#6ad46a', '💨'], ['Fortune', '#ffd54a', '🍀']];
const PARA_MAX = 50;
const PARA = [
  { c: 0, k: 'pDmg', n: 'Ember Might', d: v => `+${(v * .5).toFixed(1)}% damage`, f: (s, v) => s.dmg += v * .5 },
  { c: 0, k: 'pCritD', n: 'Searing Strikes', d: v => `+${v}% critical damage`, f: (s, v) => s.critD += v },
  { c: 0, k: 'pElite', n: 'Giant Slayer', d: v => `+${(v * .6).toFixed(1)}% damage to elites & bosses`, f: (s, v) => s.elite += v * .6 },
  { c: 0, k: 'pSkill', n: 'Kindled Arts', d: v => `+${(v * .6).toFixed(1)}% skill damage`, f: (s, v) => s.skill += v * .6 },
  { c: 1, k: 'pHp', n: 'Hearthheart', d: v => `+${(v * .6).toFixed(1)}% max life`, f: (s, v) => s.hpPct += v * .6 },
  { c: 1, k: 'pDr', n: 'Ashen Skin', d: v => `+${(v * .1).toFixed(1)}% damage reduction`, f: (s, v) => s.dr += v * .1 },
  { c: 1, k: 'pReg', n: 'Undying Flame', d: v => `regenerate ${(v * .02).toFixed(2)}% max life per second`, f: (s, v) => s.regPct += v * .02 },
  { c: 1, k: 'pThorn', n: 'Cinder Barbs', d: v => `+${v * 2}% thorns`, f: (s, v) => s.thorns += v * 2 },
  { c: 2, k: 'pAtk', n: 'Quickened Blood', d: v => `+${(v * .3).toFixed(1)}% attack speed`, f: (s, v) => s.atkSpd += v * .3 },
  { c: 2, k: 'pMove', n: 'Wildfire Stride', d: v => `+${(v * .2).toFixed(1)}% move speed`, f: (s, v) => s.moveSpd += v * .2 },
  { c: 2, k: 'pCdr', n: 'Flicker', d: v => `+${(v * .1).toFixed(1)}% cooldown reduction`, f: (s, v) => s.cdr += v * .1 },
  { c: 2, k: 'pSurge', n: 'Overflowing Ember', d: v => `+${(v * .8).toFixed(1)}% Ember Surge gain`, f: (s, v) => s.surge += v * .8 },
  { c: 3, k: 'pLuck', n: 'Starlit Fortune', d: v => `+${v}% magic find`, f: (s, v) => s.luck += v },
  { c: 3, k: 'pGold', n: 'Golden Hearth', d: v => `+${(v * 1.5).toFixed(1)}% gold find`, f: (s, v) => s.gold += v * 1.5 },
  { c: 3, k: 'pXp', n: 'Old Wisdom', d: v => `+${(v * .4).toFixed(1)}% experience`, f: (s, v) => s.xp += v * .4 },
  { c: 3, k: 'pCombo', n: 'Momentum', d: v => `+${(v * .6).toFixed(1)}% combo damage`, f: (s, v) => s.combo += v * .6 },
];
const PARA_UNLOCK = 30; // character level that awakens the Constellation

// ---- gems ----
const GEMS = {
  ruby:     { n: 'Ruby', ic: '🔴', col: '#ff4a5a', st: 'dmg', v: 1.5, u: '% damage' },
  sapphire: { n: 'Sapphire', ic: '🔵', col: '#4a8aff', st: 'cdr', v: .5, u: '% cooldown reduction' },
  emerald:  { n: 'Emerald', ic: '🟢', col: '#4ae07a', st: 'critD', v: 3, u: '% crit damage' },
  topaz:    { n: 'Topaz', ic: '🟡', col: '#ffd54a', st: 'luck', v: 3, u: '% magic find' },
  amethyst: { n: 'Amethyst', ic: '🟣', col: '#b06aff', st: 'hpPct', v: 1.2, u: '% max life' },
  diamond:  { n: 'Diamond', ic: '⚪', col: '#e8f4ff', st: 'dr', v: .35, u: '% damage reduction' },
  onyx:     { n: 'Onyx', ic: '⚫', col: '#5a5a6a', st: 'ls', v: .2, u: '% life steal' },
  opal:     { n: 'Opal', ic: '🟠', col: '#ffa04a', st: 'atkSpd', v: .7, u: '% attack speed' },
};
const GEM_TN = ['', 'Chipped', 'Flawed', 'Rough', 'Clear', 'Fine', 'Brilliant', 'Radiant', 'Royal', 'Imperial', 'Celestial'];
function gemVal(g, t) { return GEMS[g].v * t * (1 + .05 * t); }
function nSock(it) { return it.r >= 6 ? 3 : it.r >= 4 ? 2 : it.r >= 2 ? 1 : 0; }

// ---- pets & cosmetics ----
const PETS = {
  sprite:    { n: 'Ember Sprite', sh: 'orb', col: '#ff9a3a', b: '+5% experience', f: s => s.xp += 5, cost: 60 },
  slimelet:  { n: 'Slimelet', sh: 'blob', col: '#6fdc5a', b: '+8% gold find', f: s => s.gold += 8, cost: 120 },
  pup:       { n: 'Wolf Pup', sh: 'beast', col: '#b0aaa0', b: '+3% move speed', f: s => s.moveSpd += 3, cost: 160 },
  batling:   { n: 'Batling', sh: 'bat', col: '#8a5aa0', b: '+0.8% life steal', f: s => s.ls += .8, cost: 220 },
  golemite:  { n: 'Golemite', sh: 'horn', col: '#8a4a30', b: '+4% max life', f: s => s.hpPct += 4, cost: 260 },
  ghostling: { n: 'Ghostling', sh: 'ghost', col: '#a6c4ff', b: '+3% cooldown reduction', f: s => s.cdr += 3, cost: 320 },
  mote:      { n: 'Crystal Mote', sh: 'crystal', col: '#a0a0ff', b: '+10% magic find', f: s => s.luck += 10, src: 'Rare guardian drop' },
  drone:     { n: 'Brass Drone', sh: 'robot', col: '#c8a050', b: '+5% skill damage', f: s => s.skill += 5, src: 'Rare guardian drop' },
  thorny:    { n: 'Tiny Thornmaw', sh: 'plant', col: '#5c8a2e', b: '+5% elite damage', f: s => s.elite += 5, src: 'Rare guardian drop' },
  seraphling:{ n: 'Seraphling', sh: 'bat', col: '#e8e0ff', b: '+4% attack speed', f: s => s.atkSpd += 4, src: 'Rare guardian drop' },
  impling:   { n: 'Gilded Impling', sh: 'horn', col: '#ffd54a', b: '+20% gold find', f: s => s.gold += 20, src: 'Catch 25 Gilded Imps' },
  shade:     { n: "Morvane's Shade", sh: 'ghost', col: '#5a3a8a', b: '+5% damage', f: s => s.dmg += 5, src: 'Reach the true ending' },
  crowned:   { n: 'Crowned Slime', sh: 'blob', col: '#ff6af0', b: '+6% damage to elites, +5% gold', f: s => { s.elite += 6; s.gold += 5; }, src: 'Season Journey chapter 3' },
  trialfox:  { n: 'Trial Fox', sh: 'beast', col: '#ff8a3a', b: '+4% crit damage, +2% crit', f: s => { s.critD += 4; s.critC += 2; }, src: 'Complete 10 Trials' },
};
const BOSS_PETS = ['mote', 'drone', 'thorny', 'seraphling'];
const COLORS = [['#d8643c', 'Ember'], ['#4fb466', 'Ranger'], ['#5a80f0', 'Arcane'], ['#c8c8d8', 'Silver', 30], ['#2a2a34', 'Shadow', 30], ['#e8c040', 'Gold', 40], ['#c040a0', 'Orchid', 30], ['#40c0c0', 'Tide', 30], ['#8a2a2a', 'Crimson', 30], ['#f0f0f0', 'Ivory', 40], ['#6a40c0', 'Void', 50], ['#40ff9a', 'Venom', 50]];
const AURAS = { none: ['None', '', 0], ember: ['Ember Halo', '#ff8a2a', 80], frost: ['Frostbreath', '#9ae8ff', 80], verdant: ['Verdant Bloom', '#7aff7a', 80], void: ['Void Whispers', '#b060ff', 150], gold: ['Golden Radiance', '#ffd54a', 200], storm: ['Stormcloak', '#e0f0ff', 150], rainbow: ['Prismatic', 'rainbow', 400] };
const TITLES = [
  { k: 'kindled', n: 'the Kindled', c: () => true, how: 'Start your journey' },
  { k: 'friend', n: 'Warden-Friend', c: () => S.done[0].filter(Boolean).length >= 6, how: 'Free 6 Wardens' },
  { k: 'rekindler', n: 'Rekindler of the Ember', c: () => S.done[0][11], how: 'Free all 12 Wardens' },
  { k: 'veteran', n: 'the Veteran', c: () => S.done[1][11], how: 'Beat Veteran' },
  { k: 'night', n: 'Nightmare Walker', c: () => S.done[2][11], how: 'Beat Nightmare' },
  { k: 'inferno', n: 'Inferno-Born', c: () => S.done[3][11], how: 'Beat Inferno' },
  { k: 'diver', n: 'Abyss Diver', c: () => Math.max(...S.abyssBest) >= 25, how: 'Reach Abyss depth 25' },
  { k: 'deep', n: 'Lord of the Deep', c: () => Math.max(...S.abyssBest) >= 75, how: 'Reach Abyss depth 75' },
  { k: 'hunter', n: 'Master Hunter', c: () => Object.values(S.best).filter(b => b.k >= 100).length >= 20, how: 'Slay 100 of 20 monster types' },
  { k: 'starsmith', n: 'Star-Smith', c: () => S.stats.celestial >= 3, how: 'Own 3 Celestial artifacts' },
  { k: 'constel', n: 'Constellation Bearer', c: () => (S.para.lvl || 0) >= 100, how: 'Reach Constellation level 100' },
  { k: 'wmaster', n: 'Weaponmaster', c: () => Object.keys(S.wm).filter(t => wmLvl(t) >= 20).length >= 5, how: 'Mastery 20 with 5 weapon types' },
  { k: 'trial', n: 'Trialblazer', c: () => S.stats.trials >= 25, how: 'Complete 25 Trials' },
  { k: 'lore', n: 'Loremaster', c: () => S.pages.length >= PAGES.length, how: 'Find every Lost Page' },
  { k: 'gilded', n: 'the Gilded', c: () => S.stats.imps >= 25, how: 'Catch 25 Gilded Imps' },
  { k: 'jeweler', n: 'Gem-Sage', c: () => Object.values(S.gems).some(a => a.slice(7).some(n => n > 0)) || (S.stats.gemMax || 0) >= 7, how: 'Create a Royal (tier 8) gem' },
];
// ---- seasons (one per real-world month) ----
const SEASONS = [
  ['Frostfall', '#9ae8ff'], ['Heartfire', '#ff6a8a'], ['the Bloom', '#ffb0e0'], ['Storms', '#a0c8ff'], ['Verdance', '#7aff7a'], ['Sunfire', '#ffb040'],
  ['Starfall', '#c0a0ff'], ['Embertide', '#ff8a2a'], ['the Harvest', '#e0a040'], ['Shadows', '#9a60ff'], ['Ashen Skies', '#c0b0a0'], ['Winterlight', '#e0f0ff'],
];
const SJ_T = [
  { k: 'kills', n: v => `Slay ${fmt(v)} foes`, base: [250, 700, 1600, 3200, 6000] },
  { k: 'elites', n: v => `Slay ${v} elites`, base: [12, 35, 80, 160, 300] },
  { k: 'bosses', n: v => `Defeat ${v} guardians`, base: [2, 5, 10, 18, 30] },
  { k: 'floors', n: v => `Descend ${v} floors`, base: [8, 20, 40, 75, 120] },
  { k: 'legend', n: v => `Find ${v} Legendary items`, base: [1, 3, 6, 10, 16] },
  { k: 'pd', n: v => `Perform ${v} Perfect Dodges`, base: [8, 25, 50, 100, 170] },
  { k: 'surges', n: v => `Unleash ${v} Ember Surges`, base: [4, 12, 25, 50, 80] },
  { k: 'imps', n: v => `Catch ${v} Gilded Imps`, base: [1, 2, 3, 5, 8] },
  { k: 'barrels', n: v => `Smash ${v} barrels or crates`, base: [15, 50, 110, 220, 350] },
  { k: 'trials', n: v => `Complete ${v} Trial${v === 1 ? '' : 's'}`, base: [1, 2, 4, 7, 11] },
  { k: 'gems', n: v => `Find ${v} gems`, base: [4, 12, 25, 50, 80] },
  { k: 'cursed', n: v => `Conquer ${v} Cursed Chests`, base: [1, 2, 4, 6, 9] },
  { k: 'upgrades', n: v => `Upgrade items ${v} times`, base: [2, 6, 12, 20, 32] },
  { k: 'combo', n: v => `Reach a ${v}-hit combo`, base: [25, 50, 90, 160, 280], max: 1 },
];
// ---- trials ----
const TRULES = {
  glass: { n: 'Glass Cannon', d: 'You deal +100% damage but take +100% damage', ic: '💎' },
  swarm: { n: 'The Swarm', d: 'Twice as many foes', ic: '🐝' },
  elites: { n: 'Champions', d: 'Every foe is an elite', ic: '👑' },
  nopot: { n: 'Abstinence', d: 'Potions are disabled', ic: '🚫' },
  haste: { n: 'Frenzy', d: 'Foes move and attack 30% faster', ic: '⚡' },
  volatile: { n: 'Volatile', d: 'Every foe bursts into bolts on death', ic: '💥' },
  blood: { n: 'Bloodlust', d: 'Foes deal +50% damage; you gain +5% life steal', ic: '🩸' },
  fragile: { n: 'Fragile', d: 'No life regeneration', ic: '🥀' },
  giants: { n: 'Giants', d: 'Foes are huge and have double life', ic: '🗿' },
  marks: { n: 'Marksmen', d: 'Only ranged and spellcasting foes', ic: '🏹' },
};
const RANGED_AI = ['shoot', 'spread', 'blink', 'turret', 'summon'];
