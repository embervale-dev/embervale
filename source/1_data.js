'use strict';
// ================= GAME DATA =================
const TILE = 48;
const NREG = 12, FLOORS = 7, BOSS_F = 6, ABYSS_R = 12, MAXLVL = 150;
const RAR = [
  { n: 'Common', c: '#c8c8c8', aff: 0, m: 1 },
  { n: 'Uncommon', c: '#5fd35f', aff: 1, m: 1.12 },
  { n: 'Rare', c: '#4fa3ff', aff: 2, m: 1.26 },
  { n: 'Epic', c: '#c46bff', aff: 3, m: 1.44 },
  { n: 'Legendary', c: '#ff9a2e', aff: 4, m: 1.65 },
  { n: 'Mythic', c: '#ff3e5e', aff: 5, m: 1.95 },
];
const DIFF = ['Normal', 'Veteran', 'Nightmare', 'Inferno'];
const DIFFC = ['#cfc6b0', '#7ab8ff', '#c46bff', '#ff4a3a'];

// weapon types: k = attack kind
const WT = {
  sword:   { n: 'Sword', ic: ico('w-sword-t3'), dmg: 10, cd: .40, k: 'arc', rng: 74, arc: 1.8, kb: 170, col: '#d6dee6' },
  katana:  { n: 'Katana', ic: ico('w-katana-t3'), dmg: 12, cd: .32, k: 'arc', rng: 82, arc: 1.4, kb: 100, crit: .08, col: '#f0f4ff' },
  dagger:  { n: 'Dagger', ic: ico('w-dagger-t3'), dmg: 6, cd: .21, k: 'arc', rng: 54, arc: 1.2, kb: 60, crit: .12, col: '#d0d0d0' },
  axe:     { n: 'Greataxe', ic: ico('w-axe-t3'), dmg: 24, cd: .85, k: 'arc', rng: 98, arc: 2.6, kb: 320, col: '#b8a890' },
  hammer:  { n: 'Warhammer', ic: ico('w-hammer-t3'), dmg: 30, cd: 1.0, k: 'slam', rng: 84, kb: 380, col: '#a8a8bc' },
  spear:   { n: 'Spear', ic: ico('w-spear-t3'), dmg: 14, cd: .50, k: 'thrust', rng: 135, w: 24, kb: 150, col: '#d8c890' },
  scythe:  { n: 'Scythe', ic: ico('w-scythe-t3'), dmg: 16, cd: .75, k: 'spin', rng: 94, kb: 130, col: '#a89ad8' },
  flail:   { n: 'Flail', ic: ico('w-flail-t3'), dmg: 19, cd: .72, k: 'spin', rng: 86, kb: 240, col: '#9a9aa8' },
  fists:   { n: 'Gauntlets', ic: ico('w-fists-t3'), dmg: 5, cd: .15, k: 'arc', rng: 48, arc: 1.2, kb: 90, col: '#e0a070' },
  bow:     { n: 'Longbow', ic: ico('w-bow-t3'), dmg: 10, cd: .44, k: 'shot', spd: 950, pr: 0, col: '#c89a60', pk: 'arrow' },
  xbow:    { n: 'Crossbow', ic: ico('w-xbow-t3'), dmg: 23, cd: .95, k: 'shot', spd: 1400, pr: 3, col: '#a07a50', pk: 'bolt' },
  cannon:  { n: 'Hand Cannon', ic: ico('w-cannon-t3'), dmg: 27, cd: 1.1, k: 'shot', spd: 720, pr: 0, splash: 75, col: '#ffb060', pk: 'ball' },
  staff:   { n: 'Staff', ic: ico('w-staff-t3'), dmg: 13, cd: .55, k: 'orb', spd: 560, splash: 62, col: '#8ad0ff' },
  wand:    { n: 'Wand', ic: ico('w-wand-t3'), dmg: 5, cd: .14, k: 'shot', spd: 820, pr: 0, home: 4, col: '#ff8af0', pk: 'spark' },
  tome:    { n: 'Tome', ic: ico('w-tome-t3'), dmg: 6, cd: .5, k: 'fan', spd: 650, cnt: 5, col: '#ffd27a' },
  chakram: { n: 'Chakram', ic: ico('w-chakram-t3'), dmg: 11, cd: .6, k: 'boom', spd: 720, col: '#7affd0' },
};
const AT = {
  helm:   { n: 'Helm', ic: ico('a-helm-medium-t3'), base: { hp: 18, dr: 1.5 } },
  armor:  { n: 'Chestplate', ic: ico('a-armor-medium-t3'), base: { hp: 30, dr: 3 } },
  gloves: { n: 'Gloves', ic: ico('a-gloves-medium-t3'), base: { hp: 8, atkSpd: 3 } },
  boots:  { n: 'Boots', ic: ico('a-boots-medium-t3'), base: { hp: 10, moveSpd: 5 } },
  ring:   { n: 'Ring', ic: ico('a-ring-t3'), base: { critC: 3 } },
  amulet: { n: 'Amulet', ic: ico('a-amulet-t3'), base: { mp: 12, skill: 6 } },
};
const ARMOR_SLOTS = ['helm', 'armor', 'gloves', 'boots', 'ring', 'amulet'];
const SLOTS = ['weapon', 'weapon2', ...ARMOR_SLOTS];
const SLOTN = { weapon: 'Main Hand', weapon2: 'Off Hand [Tab]', helm: 'Helm', armor: 'Chest', gloves: 'Gloves', boots: 'Boots', ring: 'Ring', amulet: 'Amulet' };

const AFF = {
  dmg:    { n: '% Damage', min: 4, max: 14 },
  critC:  { n: '% Crit Chance', min: 2, max: 6 },
  critD:  { n: '% Crit Damage', min: 8, max: 30 },
  atkSpd: { n: '% Attack Speed', min: 3, max: 10 },
  moveSpd:{ n: '% Move Speed', min: 2, max: 7 },
  hp:     { n: ' Max Life', min: 8, max: 22, sc: 1.11, flat: 1 },
  hpReg:  { n: ' Life Regen/s', min: .4, max: 1.6, sc: 1.11, flat: 1 },
  mp:     { n: ' Max Mana', min: 6, max: 20, sc: 1.03, flat: 1 },
  mpReg:  { n: '% Mana Regen', min: 8, max: 25 },
  ls:     { n: '% Life Steal', min: .5, max: 2 },
  cdr:    { n: '% Cooldown Reduction', min: 2, max: 6 },
  dr:     { n: '% Damage Reduction', min: 1, max: 4 },
  luck:   { n: '% Magic Find', min: 5, max: 18 },
  gold:   { n: '% Gold Find', min: 8, max: 30 },
  skill:  { n: '% Skill Damage', min: 5, max: 16 },
  burn:   { n: '% Burn Chance', min: 3, max: 10 },
  frz:    { n: '% Freeze Chance', min: 3, max: 10 },
  shk:    { n: '% Shock Chance', min: 3, max: 10 },
  psn:    { n: '% Poison Chance', min: 3, max: 10 },
  thorns: { n: '% Thorns', min: 10, max: 40 },
  xp:     { n: '% Experience', min: 3, max: 10 },
  surge:  { n: '% Ember Surge Gain', min: 5, max: 15 },
  combo:  { n: '% Combo Damage', min: 5, max: 15 },
};
const AFF_W = ['dmg', 'dmg', 'critC', 'critD', 'atkSpd', 'ls', 'burn', 'frz', 'shk', 'psn', 'skill', 'luck', 'xp', 'combo', 'surge'];
const AFF_A = ['hp', 'hp', 'hpReg', 'mp', 'mpReg', 'dr', 'moveSpd', 'cdr', 'thorns', 'luck', 'gold', 'skill', 'critC', 'critD', 'xp', 'dmg', 'atkSpd', 'surge', 'combo'];
const UNQ = {
  chain:   { n: 'Stormcaller', d: 'Hits have a 30% chance to arc lightning to 3 nearby foes' },
  explode: { n: 'Cinderburst', d: 'Slain enemies explode for 60% weapon damage' },
  multi:   { n: 'Splitting', d: 'Attacks release 2 extra projectiles (melee: a slicing wave)' },
  frost:   { n: 'Rimebound', d: '25% chance on hit to freeze foes solid' },
  echo:    { n: 'Echoing', d: '25% chance for attacks to strike twice' },
  giant:   { n: "Titan's", d: '+40% attack size and range' },
  thunder: { n: 'Thunderous', d: 'Every 6th hit calls down a lightning strike' },
  reaper:  { n: 'Reaping', d: 'Execute non-boss foes below 15% life' },
  storm:   { n: 'Tempest', d: 'Kills call down lightning on 2 nearby foes' },
  pierce:  { n: 'Piercing', d: 'Projectiles pierce 3 extra foes and fly 30% faster' },
  vamp:    { n: 'Bloodsworn', d: '+3% life steal; heal 2% life on kill' },
  orbit:   { n: 'Sunwheel', d: 'Two flame orbs circle you, burning foes' },
  phoenix: { n: 'Phoenix', d: 'Once per floor, cheat death and revive with 50% life' },
  haste:   { n: 'Windrunner', d: 'Kills grant +30% move speed for 3s' },
  colossus:{ n: 'Colossus', d: '+20% max life and +5% damage reduction' },
  kindled: { n: 'Kindled', d: 'Ember Surge charges 60% faster' },
};
const UNQ_W = ['chain', 'explode', 'multi', 'frost', 'echo', 'giant', 'thunder', 'reaper', 'storm', 'pierce'];
const UNQ_A = ['vamp', 'orbit', 'phoenix', 'haste', 'colossus', 'kindled'];
const PRE = [['Rusty', 'Worn', 'Plain', 'Crude', 'Battered'], ['Fine', 'Sturdy', 'Keen', 'Polished', 'Honed'], ['Gleaming', 'Runed', 'Masterwork', 'Tempered', 'Moonlit'], ['Arcane', 'Exalted', 'Draconic', 'Fabled', 'Starforged'], [], []];
const SUF = { dmg: 'of Ruin', critC: 'of Precision', critD: 'of Slaughter', atkSpd: 'of Haste', ls: 'of the Leech', burn: 'of Embers', frz: 'of Winter', shk: 'of Storms', psn: 'of Venom', skill: 'of Sorcery', luck: 'of Fortune', xp: 'of Wisdom', hp: 'of the Bear', hpReg: 'of Mending', mp: 'of the Mind', mpReg: 'of Clarity', dr: 'of the Bulwark', moveSpd: 'of the Wind', cdr: 'of Focus', thorns: 'of Thorns', gold: 'of Greed', surge: 'of Kindling', combo: 'of Momentum' };

// ---------- enemies ----------
const EN = {
  slime:   { n: 'Slime', ai: 'chase', hp: 26, dmg: 8, spd: 80, r: 15, col: '#6fdc5a', xp: 2, sh: 'blob' },
  wolf:    { n: 'Grey Wolf', ai: 'dash', hp: 24, dmg: 10, spd: 130, r: 14, col: '#8d8a80', xp: 3, sh: 'beast' },
  sprout:  { n: 'Thornsprout', ai: 'shoot', hp: 20, dmg: 7, spd: 55, r: 13, col: '#3f9a35', xp: 3, sh: 'plant', pc: '#c4ff6a', fire: 1.9 },
  bat:     { n: 'Cave Bat', ai: 'swarm', hp: 10, dmg: 5, spd: 175, r: 9, col: '#8a5aa0', xp: 1, sh: 'bat' },
  skel:    { n: 'Skeleton', ai: 'chase', hp: 36, dmg: 10, spd: 95, r: 14, col: '#e6e0c8', xp: 3, sh: 'skull' },
  skarch:  { n: 'Bone Archer', ai: 'shoot', hp: 24, dmg: 9, spd: 75, r: 13, col: '#cfc6a4', xp: 3, sh: 'skull', pc: '#fff1b0', fire: 1.5 },
  ghost:   { n: 'Wraith', ai: 'blink', hp: 30, dmg: 9, spd: 80, r: 14, col: '#a6c4ff', xp: 4, sh: 'ghost', pc: '#8fb0ff', fire: 2.8 },
  necro:   { n: 'Gravecaller', ai: 'summon', hp: 44, dmg: 8, spd: 65, r: 15, col: '#7d5aa0', xp: 6, sh: 'hood', minion: 'skel', fire: 5.5 },
  scorp:   { n: 'Dune Scorpion', ai: 'dash', hp: 40, dmg: 12, spd: 120, r: 16, col: '#c98a3a', xp: 4, sh: 'beast' },
  mummy:   { n: 'Mummy', ai: 'tank', hp: 95, dmg: 16, spd: 58, r: 19, col: '#d2c49a', xp: 7, sh: 'horn' },
  imp:     { n: 'Sand Imp', ai: 'spread', hp: 26, dmg: 9, spd: 105, r: 12, col: '#e6a24e', xp: 4, sh: 'horn', pc: '#ffd070', fire: 2.2, cnt: 3 },
  beetle:  { n: 'Scarab', ai: 'swarm', hp: 12, dmg: 6, spd: 165, r: 9, col: '#3a8a9a', xp: 1, sh: 'bat' },
  lurker:  { n: 'Bog Lurker', ai: 'chase', hp: 48, dmg: 12, spd: 85, r: 16, col: '#4a6a3a', xp: 4, sh: 'blob' },
  leech:   { n: 'Bloodleech', ai: 'swarm', hp: 14, dmg: 7, spd: 180, r: 9, col: '#c02a3a', xp: 1, sh: 'bat' },
  hag:     { n: 'Marsh Hag', ai: 'spread', hp: 38, dmg: 11, spd: 80, r: 14, col: '#6a4a7a', xp: 5, sh: 'hood', pc: '#9aff5a', fire: 2.1, cnt: 4 },
  toad:    { n: 'Giant Toad', ai: 'dash', hp: 60, dmg: 13, spd: 110, r: 18, col: '#7a9a3a', xp: 5, sh: 'blob' },
  icewolf: { n: 'Frost Wolf', ai: 'dash', hp: 44, dmg: 13, spd: 140, r: 15, col: '#bfe6ff', xp: 4, sh: 'beast' },
  yeti:    { n: 'Yeti', ai: 'tank', hp: 120, dmg: 18, spd: 62, r: 21, col: '#eef6ff', xp: 8, sh: 'horn' },
  wisp:    { n: 'Frost Wisp', ai: 'blink', hp: 28, dmg: 10, spd: 90, r: 12, col: '#7fdcff', xp: 4, sh: 'orb', pc: '#bff4ff', fire: 2.4 },
  icet:    { n: 'Ice Totem', ai: 'turret', hp: 70, dmg: 9, spd: 0, r: 17, col: '#6ab8e8', xp: 5, sh: 'turret', pc: '#d0f4ff' },
  shroom:  { n: 'Shroomling', ai: 'chase', hp: 40, dmg: 11, spd: 90, r: 14, col: '#d0605a', xp: 3, sh: 'shroom' },
  spore:   { n: 'Sporebomb', ai: 'bomber', hp: 22, dmg: 20, spd: 150, r: 12, col: '#c8d050', xp: 3, sh: 'blob' },
  myco:    { n: 'Mycelord', ai: 'summon', hp: 60, dmg: 10, spd: 55, r: 17, col: '#9a5ad0', xp: 7, sh: 'shroom', minion: 'spore', fire: 6 },
  crawler: { n: 'Spore Crawler', ai: 'spread', hp: 34, dmg: 10, spd: 80, r: 14, col: '#6aa060', xp: 4, sh: 'beast', pc: '#d8ff70', fire: 2.1, cnt: 5 },
  crab:    { n: 'Reef Crab', ai: 'tank', hp: 110, dmg: 17, spd: 70, r: 19, col: '#e0603a', xp: 7, sh: 'crab' },
  eel:     { n: 'Shock Eel', ai: 'dash', hp: 46, dmg: 14, spd: 150, r: 14, col: '#3ad0e0', xp: 4, sh: 'beast' },
  jelly:   { n: 'Jellyfloat', ai: 'blink', hp: 34, dmg: 11, spd: 85, r: 14, col: '#ff8ad8', xp: 4, sh: 'ghost', pc: '#ffb0f0', fire: 2.3 },
  urchin:  { n: 'Sea Urchin', ai: 'turret', hp: 80, dmg: 10, spd: 0, r: 16, col: '#4a3a7a', xp: 5, sh: 'plant', pc: '#c0a0ff' },
  golem:   { n: 'Magma Golem', ai: 'tank', hp: 140, dmg: 20, spd: 60, r: 22, col: '#8a4a30', xp: 9, sh: 'horn' },
  fimp:    { n: 'Fire Imp', ai: 'spread', hp: 30, dmg: 11, spd: 115, r: 12, col: '#ff6a30', xp: 4, sh: 'horn', pc: '#ff9a40', fire: 1.9, cnt: 3 },
  mslime:  { n: 'Magma Slime', ai: 'chase', hp: 50, dmg: 12, spd: 85, r: 16, col: '#ff7a2a', xp: 4, sh: 'blob' },
  ftur:    { n: 'Forge Turret', ai: 'turret', hp: 80, dmg: 10, spd: 0, r: 17, col: '#b06030', xp: 6, sh: 'turret', pc: '#ffb060' },
  cog:     { n: 'Cogling', ai: 'swarm', hp: 20, dmg: 8, spd: 185, r: 10, col: '#c8a050', xp: 2, sh: 'orb' },
  auto:    { n: 'Automaton', ai: 'chase', hp: 70, dmg: 14, spd: 95, r: 16, col: '#9a9078', xp: 5, sh: 'robot' },
  steam:   { n: 'Steam Cannon', ai: 'turret', hp: 90, dmg: 11, spd: 0, r: 17, col: '#7a6a50', xp: 6, sh: 'turret', pc: '#fff0c0' },
  boombot: { n: 'Boombot', ai: 'bomber', hp: 30, dmg: 22, spd: 160, r: 13, col: '#d0502a', xp: 3, sh: 'robot' },
  harpy:   { n: 'Harpy', ai: 'dash', hp: 44, dmg: 13, spd: 150, r: 14, col: '#c8a0e8', xp: 4, sh: 'bat' },
  sentinel:{ n: 'Sky Sentinel', ai: 'shoot', hp: 56, dmg: 13, spd: 70, r: 16, col: '#e8e0a0', xp: 5, sh: 'turret', pc: '#fff6a0', fire: 1.2 },
  swisp:   { n: 'Storm Wisp', ai: 'blink', hp: 36, dmg: 11, spd: 100, r: 12, col: '#9ad8ff', xp: 4, sh: 'orb', pc: '#e0f0ff', fire: 2.2 },
  knight:  { n: 'Fallen Knight', ai: 'tank', hp: 130, dmg: 19, spd: 75, r: 18, col: '#8a90a8', xp: 8, sh: 'robot' },
  cgolem:  { n: 'Crystal Golem', ai: 'tank', hp: 150, dmg: 20, spd: 65, r: 21, col: '#8a8aff', xp: 9, sh: 'crystal' },
  prism:   { n: 'Prism Sentry', ai: 'turret', hp: 95, dmg: 12, spd: 0, r: 17, col: '#c0a0ff', xp: 6, sh: 'crystal', pc: '#ffffff' },
  shardl:  { n: 'Shardling', ai: 'swarm', hp: 22, dmg: 9, spd: 190, r: 10, col: '#a0e0ff', xp: 2, sh: 'crystal' },
  mirror:  { n: 'Mirror Wraith', ai: 'blink', hp: 48, dmg: 12, spd: 100, r: 14, col: '#e0e0ff', xp: 5, sh: 'ghost', pc: '#c0c0ff', fire: 2.1 },
  voidling:{ n: 'Voidling', ai: 'swarm', hp: 18, dmg: 8, spd: 190, r: 10, col: '#7a4ac8', xp: 2, sh: 'orb' },
  watcher: { n: 'Watcher', ai: 'turret', hp: 90, dmg: 12, spd: 0, r: 18, col: '#a03ac8', xp: 6, sh: 'eye', pc: '#ff70ff' },
  shade:   { n: 'Shade', ai: 'blink', hp: 44, dmg: 12, spd: 110, r: 14, col: '#4a3a6a', xp: 5, sh: 'ghost', pc: '#c070ff', fire: 2 },
  horror:  { n: 'Horror', ai: 'summon', hp: 110, dmg: 16, spd: 60, r: 20, col: '#6a1a7a', xp: 10, sh: 'horn', minion: 'voidling', fire: 5 },
  mimic:   { n: 'Mimic', ai: 'dash', hp: 120, dmg: 16, spd: 150, r: 18, col: '#a0702a', xp: 15, sh: 'chest' },
  gimp:    { n: 'Gilded Imp', ai: 'flee', hp: 70, dmg: 0, spd: 165, r: 12, col: '#ffd54a', xp: 25, sh: 'horn' },
  barrel:  { n: 'Barrel', ai: 'prop', hp: 1, dmg: 0, spd: 0, r: 14, col: '#a0402a', xp: 0, sh: 'barrel' },
  crate:   { n: 'Crate', ai: 'prop', hp: 1, dmg: 0, spd: 0, r: 15, col: '#8a6a3a', xp: 0, sh: 'crate' },
};
const ELITES = { Swift: '#5affb0', Vampiric: '#ff3a5a', Shielded: '#7ab8ff', Volatile: '#ff9a2a', Frenzied: '#ffe040', Giant: '#d07aff' };

// region visuals: fl/fl2 floor, wl wall, wt wall top, bg/fog, sky/gnd hemisphere, sun, torch, dec floor decor, wd wall decor
const REG = [
  { n: 'Whispering Woods', boss: 'thornmaw', fl: '#3e5a2a', fl2: '#46632f', wl: '#2c3c20', wt: '#4a6a34', bg: '#0b140a', sky: '#9ac0ff', gnd: '#2a3a1a', sun: '#ffe8c0', torch: '#ffa040', dec: 'grass', wd: 'tree', en: ['slime', 'slime', 'wolf', 'sprout', 'bat', 'bat'] },
  { n: 'Sunken Crypt', boss: 'bishop', fl: '#3a3a46', fl2: '#42424f', wl: '#2a2a34', wt: '#4a4a5c', bg: '#07070c', sky: '#8a8ac0', gnd: '#202028', sun: '#a8b8ff', torch: '#7affb0', dec: 'bones', wd: 'pillar', en: ['skel', 'skel', 'skarch', 'ghost', 'necro', 'bat'] },
  { n: 'Ashen Dunes', boss: 'kesh', fl: '#8a7448', fl2: '#957e50', wl: '#6a5232', wt: '#a08458', bg: '#1a1208', sky: '#ffd090', gnd: '#5a4020', sun: '#ffd8a0', torch: '#ffb050', dec: 'sand', wd: 'rock', en: ['scorp', 'scorp', 'mummy', 'imp', 'beetle', 'beetle'] },
  { n: 'Bloodmoon Marsh', boss: 'morrow', fl: '#36442a', fl2: '#3c4a2e', wl: '#24301c', wt: '#3e5030', bg: '#120808', sky: '#ff7070', gnd: '#2a1a1a', sun: '#ff8a7a', torch: '#ff5a4a', dec: 'reeds', wd: 'deadtree', en: ['lurker', 'lurker', 'leech', 'leech', 'hag', 'toad'] },
  { n: 'Frostpeak Hollows', boss: 'rimeheart', fl: '#6a7e90', fl2: '#748a9c', wl: '#4a5e74', wt: '#a8c8e0', bg: '#0a1220', sky: '#c0e0ff', gnd: '#304860', sun: '#d0e8ff', torch: '#80d0ff', dec: 'snow', wd: 'ice', en: ['icewolf', 'icewolf', 'yeti', 'wisp', 'icet'] },
  { n: 'Fungal Depths', boss: 'mother', fl: '#3c3048', fl2: '#43364f', wl: '#2a1f36', wt: '#4a3a60', bg: '#0a0612', sky: '#c080ff', gnd: '#201030', sun: '#d0a0ff', torch: '#c0ff60', dec: 'shroom', wd: 'bigshroom', en: ['shroom', 'shroom', 'spore', 'myco', 'crawler'] },
  { n: 'Coral Grotto', boss: 'leviathan', fl: '#2c4c5c', fl2: '#325464', wl: '#1a3442', wt: '#3a6a7a', bg: '#03111a', sky: '#60d0ff', gnd: '#103040', sun: '#80e0ff', torch: '#60ffe0', dec: 'coral', wd: 'coral', en: ['crab', 'eel', 'eel', 'jelly', 'jelly', 'urchin'] },
  { n: 'Molten Forge', boss: 'vulkar', fl: '#4a302a', fl2: '#52352e', wl: '#2e1a16', wt: '#5a2a1a', bg: '#140604', sky: '#ff8040', gnd: '#301008', sun: '#ffa060', torch: '#ff6020', dec: 'ember', wd: 'lava', en: ['golem', 'fimp', 'fimp', 'mslime', 'mslime', 'ftur'] },
  { n: 'Clockwork Halls', boss: 'colossus', fl: '#5a5040', fl2: '#625746', wl: '#3e3628', wt: '#8a7448', bg: '#0e0c08', sky: '#ffe0a0', gnd: '#302818', sun: '#ffe8b0', torch: '#ffd070', dec: 'gear', wd: 'pipe', en: ['cog', 'cog', 'auto', 'auto', 'steam', 'boombot'] },
  { n: 'Sky Ruins', boss: 'seraph', fl: '#7a7a90', fl2: '#84849a', wl: '#5a5a74', wt: '#b0b0d0', bg: '#1a2040', sky: '#e0e8ff', gnd: '#404870', sun: '#ffffff', torch: '#a0c0ff', dec: 'cloud', wd: 'column', en: ['harpy', 'harpy', 'sentinel', 'swisp', 'knight'] },
  { n: 'Crystal Spire', boss: 'lumen', fl: '#3c3c5c', fl2: '#444466', wl: '#2a2a48', wt: '#6a6aa8', bg: '#08081a', sky: '#a0a0ff', gnd: '#202040', sun: '#c0c0ff', torch: '#d0a0ff', dec: 'crystal', wd: 'crystal', en: ['cgolem', 'prism', 'shardl', 'shardl', 'mirror', 'mirror'] },
  { n: 'The Hollow Void', boss: 'unmaker', fl: '#2c2038', fl2: '#32243f', wl: '#1a1028', wt: '#3a2058', bg: '#05020a', sky: '#a040ff', gnd: '#100820', sun: '#c080ff', torch: '#c060ff', dec: 'void', wd: 'voidcrystal', en: ['voidling', 'voidling', 'watcher', 'shade', 'shade', 'horror'] },
];
REG.forEach((r, i) => r.req = i === 0 ? 1 : i * 6);
const ABYSS = { n: 'The Abyss', fl: '#2a1418', fl2: '#30171c', wl: '#14080a', wt: '#4a1a2a', bg: '#0a0204', sky: '#ff3050', gnd: '#200810', sun: '#ff6080', torch: '#ff3060', dec: 'void', wd: 'voidcrystal', en: [].concat(...REG.map(r => r.en)) };
const TOWN = { n: 'Haven', fl: '#6a6050', fl2: '#726856', wl: '#4a4032', wt: '#7a6a50', bg: '#141018', sky: '#ffd0a0', gnd: '#3a3020', sun: '#ffc890', torch: '#ffa040', dec: 'town', wd: 'none' };

const BOSS = {
  thornmaw: { n: 'Thornmaw, the Rotting Root', hp: 850, dmg: 10, r: 48, spd: 70, col: '#5c8a2e', pc: '#c4ff6a', sh: 'plant', pats: ['ring', 'summon:sprout', 'slam', 'aimed', 'summon:slime'] },
  bishop:   { n: 'The Hollow Bishop', hp: 1050, dmg: 13, r: 44, spd: 80, col: '#8a6ab0', pc: '#d0a0ff', sh: 'hood', pats: ['spiral', 'summon:skel', 'blink', 'ring', 'aimed'] },
  kesh:     { n: 'Sandtyrant Kesh', hp: 1250, dmg: 15, r: 46, spd: 95, col: '#c98a3a', pc: '#ffd070', sh: 'beast', pats: ['charge', 'rain', 'aimed', 'charge', 'ring'] },
  morrow:   { n: 'Mother Morrow, the Bog Witch', hp: 1350, dmg: 15, r: 46, spd: 75, col: '#5a3a6a', pc: '#9aff5a', sh: 'hood', pats: ['summon:leech', 'rain', 'spiral', 'aimed', 'slam', 'blink'] },
  rimeheart:{ n: 'Rimeheart', hp: 1400, dmg: 15, r: 46, spd: 70, col: '#9ae0ff', pc: '#e0f8ff', sh: 'orb', pats: ['spiral', 'slam', 'ring', 'beam', 'aimed'] },
  mother:   { n: 'Mother Spore', hp: 1500, dmg: 16, r: 52, spd: 50, col: '#b05ad0', pc: '#d8ff70', sh: 'shroom', pats: ['summon:spore', 'rain', 'ring', 'spiral', 'summon:crawler'] },
  leviathan:{ n: 'The Abyssal Leviathan', hp: 1600, dmg: 16, r: 50, spd: 100, col: '#2a8aa0', pc: '#80ffff', sh: 'beast', pats: ['charge', 'ring', 'beam', 'summon:eel', 'spiral', 'charge'] },
  vulkar:   { n: 'Forgelord Vulkar', hp: 1650, dmg: 17, r: 50, spd: 85, col: '#d0502a', pc: '#ffb060', sh: 'horn', pats: ['charge', 'slam', 'rain', 'beam', 'ring'] },
  colossus: { n: 'The Brass Colossus', hp: 1750, dmg: 17, r: 54, spd: 70, col: '#b08a40', pc: '#fff0a0', sh: 'robot', pats: ['beam', 'spiral', 'slam', 'summon:boombot', 'charge', 'ring'] },
  seraph:   { n: 'The Tempest Seraph', hp: 1800, dmg: 17, r: 44, spd: 110, col: '#e8e0ff', pc: '#a0e0ff', sh: 'bat', pats: ['blink', 'spiral', 'beam', 'aimed', 'rain'] },
  lumen:    { n: 'Lumen, the Prismatic Tyrant', hp: 1950, dmg: 18, r: 48, spd: 90, col: '#c0b0ff', pc: '#ffffff', sh: 'crystal', pats: ['beam', 'rain', 'spiral', 'blink', 'ring', 'summon:shardl'] },
  unmaker:  { n: 'The Unmaker', hp: 2300, dmg: 18, r: 56, spd: 80, col: '#7a2ac8', pc: '#ff70ff', sh: 'eye', pats: ['spiral', 'beam', 'summon:shade', 'rain', 'blink', 'charge', 'ring'] },
};

const SHRINES = [
  { k: 'fury', n: 'Shrine of Fury', d: '+50% damage', col: '#ff4a3a' },
  { k: 'haste', n: 'Shrine of Haste', d: '+35% attack & move speed', col: '#4aff8a' },
  { k: 'fortune', n: 'Shrine of Fortune', d: '+100% magic & gold find', col: '#ffd84a' },
  { k: 'wisdom', n: 'Shrine of Wisdom', d: '+50% experience', col: '#4ab8ff' },
  { k: 'aegis', n: 'Shrine of Aegis', d: '-30% damage taken', col: '#d0d0ff' },
];
const MODS = [
  { k: 'blood', n: 'Blood Moon', d: 'Foes deal +30% damage • +50% experience', col: '#ff5a5a' },
  { k: 'gild', n: 'Gilded Halls', d: '+100% gold • Gilded Imps abound', col: '#ffd54a' },
  { k: 'swarm', n: 'Swarming', d: '+40% more foes, but they are frailer', col: '#9aff6a' },
  { k: 'elite', n: 'Elite Hunt', d: 'Elites everywhere • +50% magic find', col: '#c46bff' },
  { k: 'dark', n: 'Deep Darkness', d: 'Your light dims • +60% magic find', col: '#9090b0' },
  { k: 'arcane', n: 'Arcane Storm', d: 'Skills recharge 40% faster • foes attack faster', col: '#6ab0ff' },
];

// ---------- skills ----------
const TIER_REQ = [0, 4, 8, 13, 18];
const BR = ['Warrior', 'Ranger', 'Mage'], BRC = ['#ff7a5a', '#6ad46a', '#7ab0ff'];
const SK = [
  { id: 'vit', b: 0, t: 0, n: 'Vitality', ic: ico('sk-vitality'), max: 10, d: r => `+${8 * r}% Max Life` },
  { id: 'whirl', b: 0, t: 0, n: 'Whirlwind', ic: ico('sk-whirlwind'), a: 1, max: 5, mp: 22, cd: 7, d: r => `Spin for 2.5s, striking all nearby foes for ${35 + 8 * r}% weapon damage ~6×/s. Shreds projectiles.` },
  { id: 'brut', b: 0, t: 1, n: 'Brutality', ic: ico('sk-brutality'), max: 10, d: r => `+${4 * r}% Damage` },
  { id: 'slam', b: 0, t: 1, n: 'Ground Slam', ic: ico('sk-groundslam'), a: 1, max: 5, mp: 25, cd: 7, d: r => `Smash the earth for ${300 + 60 * r}% weapon damage and stun foes for 1.2s.` },
  { id: 'iron', b: 0, t: 2, n: 'Iron Skin', ic: ico('sk-ironskin'), max: 10, d: r => `+${2 * r}% Damage Reduction` },
  { id: 'berserk', b: 0, t: 2, n: 'Berserk', ic: ico('sk-berserk'), a: 1, max: 5, mp: 30, cd: 20, d: r => `For 6s gain +${40 + 5 * r}% attack speed and +${20 + 5 * r}% damage.` },
  { id: 'blood', b: 0, t: 3, n: 'Bloodthirst', ic: ico('sk-bloodthirst'), max: 10, d: r => `+${(0.6 * r).toFixed(1)}% Life Steal` },
  { id: 'leap', b: 0, t: 3, n: 'Titan Leap', ic: ico('sk-titanleap'), a: 1, max: 5, mp: 25, cd: 8, d: r => `Leap to the cursor, crashing down for ${250 + 50 * r}% weapon damage. Invulnerable mid-air.` },
  { id: 'fury', b: 0, t: 4, n: "Warlord's Fury", ic: ico('sk-fury'), max: 10, d: r => `+${10 * r}% Critical Damage` },
  { id: 'blades', b: 0, t: 4, n: 'Blade Storm', ic: ico('sk-bladestorm'), a: 1, max: 5, mp: 40, cd: 16, d: r => `${4 + Math.floor(r / 2)} spectral blades orbit you for 8s, each hit dealing ${60 + 15 * r}% weapon damage.` },
  { id: 'swift', b: 1, t: 0, n: 'Swiftness', ic: ico('sk-swiftness'), max: 10, d: r => `+${3 * r}% Move Speed` },
  { id: 'shadow', b: 1, t: 0, n: 'Shadow Step', ic: ico('sk-shadowstep'), a: 1, max: 5, mp: 15, cd: 5, d: r => `Teleport to the cursor, bursting for ${150 + 30 * r}% weapon damage. Your next attack is a guaranteed crit.` },
  { id: 'prec', b: 1, t: 1, n: 'Precision', ic: ico('sk-precision'), max: 10, d: r => `+${2 * r}% Crit Chance` },
  { id: 'arrows', b: 1, t: 1, n: 'Arrow Rain', ic: ico('sk-arrowrain'), a: 1, max: 5, mp: 28, cd: 9, d: r => `Rain arrows on an area for 3s, dealing ${50 + 10 * r}% weapon damage ~3×/s.` },
  { id: 'quick', b: 1, t: 2, n: 'Quick Hands', ic: ico('sk-quickhands'), max: 10, d: r => `+${4 * r}% Attack Speed` },
  { id: 'poison', b: 1, t: 2, n: 'Venom Cloud', ic: ico('sk-venomcloud'), a: 1, max: 5, mp: 25, cd: 10, d: r => `A toxic cloud for 5s dealing ${60 + 16 * r}% weapon damage per second and slowing foes.` },
  { id: 'deadeye', b: 1, t: 3, n: "Hunter's Mark", ic: ico('sk-huntersmark'), max: 10, d: r => `+${6 * r}% Damage to Elites & Bosses` },
  { id: 'wolves', b: 1, t: 3, n: 'Spirit Wolves', ic: ico('sk-wolves'), a: 1, max: 5, mp: 40, cd: 20, d: r => `Summon ${1 + Math.floor((r + 1) / 2)} spirit wolves for 15s. Each bite deals ${50 + 12 * r}% weapon damage.` },
  { id: 'fortune', b: 1, t: 4, n: 'Fortune', ic: ico('sk-fortune'), max: 10, d: r => `+${10 * r}% Magic Find and Gold Find` },
  { id: 'knives', b: 1, t: 4, n: 'Fan of Knives', ic: ico('sk-knives'), a: 1, max: 5, mp: 25, cd: 6, d: r => `Unleash ${16 + 2 * r} piercing knives in all directions for ${80 + 20 * r}% weapon damage.` },
  { id: 'arcane', b: 2, t: 0, n: 'Arcane Mind', ic: ico('sk-arcanemind'), max: 10, d: r => `+${10 * r}% Max Mana and Mana Regen` },
  { id: 'fireball', b: 2, t: 0, n: 'Fireball', ic: ico('sk-fireball'), a: 1, max: 5, mp: 14, cd: 2.5, d: r => `Hurl a fireball that explodes for ${220 + 45 * r}% weapon damage and burns.` },
  { id: 'elem', b: 2, t: 1, n: 'Elementalist', ic: ico('sk-elementalist'), max: 10, d: r => `+${3 * r}% chance to Burn, Freeze, Shock and Poison` },
  { id: 'nova', b: 2, t: 1, n: 'Frost Nova', ic: ico('sk-frostnova'), a: 1, max: 5, mp: 25, cd: 8, d: r => `A blast of frost for ${120 + 25 * r}% weapon damage, freezing foes for 2.5s and erasing projectiles.` },
  { id: 'focus', b: 2, t: 2, n: 'Focus', ic: ico('sk-focus'), max: 10, d: r => `+${3 * r}% Cooldown Reduction` },
  { id: 'chain', b: 2, t: 2, n: 'Chain Lightning', ic: ico('sk-chainlightning'), a: 1, max: 5, mp: 20, cd: 3.5, d: r => `Lightning leaps between ${5 + r} foes for ${150 + 30 * r}% weapon damage each.` },
  { id: 'power', b: 2, t: 3, n: 'Spellpower', ic: ico('sk-spellpower'), max: 10, d: r => `+${8 * r}% Skill Damage` },
  { id: 'heal', b: 2, t: 3, n: 'Healing Light', ic: ico('sk-healinglight'), a: 1, max: 5, mp: 35, cd: 18, d: r => `Instantly heal ${25 + 3 * r}% life, then regenerate 3% life/s for 5s.` },
  { id: 'meteor', b: 2, t: 4, n: 'Meteor', ic: ico('sk-meteor'), a: 1, max: 5, mp: 50, cd: 14, d: r => `Call down a meteor that lands after 1s for ${600 + 120 * r}% weapon damage in a huge area.` },
  { id: 'warp', b: 2, t: 4, n: 'Time Warp', ic: ico('sk-timewarp'), a: 1, max: 5, mp: 50, cd: 30, d: r => `Slow all enemies and their projectiles to 40% speed for ${5 + 0.5 * r}s.` },
];
const SKI = {}; SK.forEach(s => SKI[s.id] = s);

const CLS = {
  warrior: { n: 'Warrior', col: '#d8643c', w: 'sword', w2: 'spear', sk: 'whirl', ic: ico('swords'), d: 'A stalwart blade-bearer. Starts with a Sword, a Spear and Whirlwind.' },
  ranger: { n: 'Ranger', col: '#4fb466', w: 'bow', w2: 'dagger', sk: 'shadow', ic: ico('cls-ranger'), d: 'A swift hunter of the wilds. Starts with a Longbow, a Dagger and Shadow Step.' },
  mage: { n: 'Mage', col: '#5a80f0', w: 'staff', w2: 'wand', sk: 'fireball', ic: ico('cls-mage'), d: 'A wielder of elemental fire. Starts with a Staff, a Wand and Fireball.' },
};

// ---------- achievements: c = progress fn, need, reward ----------
const ACH = [
  { id: 'k100', n: 'Monster Slayer', d: 'Slay 100 foes', c: () => S.stats.kills, need: 100, sp: 0 },
  { id: 'k1k', n: 'Butcher of Embervale', d: 'Slay 1,000 foes', c: () => S.stats.kills, need: 1000, sp: 1 },
  { id: 'k10k', n: 'Legion Breaker', d: 'Slay 10,000 foes', c: () => S.stats.kills, need: 10000, sp: 1 },
  { id: 'k50k', n: 'Extinction Event', d: 'Slay 50,000 foes', c: () => S.stats.kills, need: 50000, sp: 2 },
  { id: 'e25', n: 'Elite Hunter', d: 'Slay 25 elites', c: () => S.stats.elites, need: 25, sp: 0 },
  { id: 'e300', n: 'Champion of Champions', d: 'Slay 300 elites', c: () => S.stats.elites, need: 300, sp: 1 },
  { id: 'b1', n: 'First Shard', d: 'Defeat your first guardian', c: () => S.stats.bosses, need: 1, sp: 0 },
  { id: 'b6', n: 'Halfway to Dawn', d: 'Recover 6 Ember Shards (Normal)', c: () => S.done[0].filter(Boolean).length, need: 6, sp: 1 },
  { id: 'b12', n: 'The Ember Rekindled', d: 'Recover all 12 Ember Shards (Normal)', c: () => S.done[0].filter(Boolean).length, need: 12, sp: 2 },
  { id: 'vet', n: 'Veteran', d: 'Defeat The Unmaker on Veteran', c: () => +S.done[1][11], need: 1, sp: 2 },
  { id: 'night', n: 'Nightmare Walker', d: 'Defeat The Unmaker on Nightmare', c: () => +S.done[2][11], need: 1, sp: 2 },
  { id: 'inferno', n: 'Inferno Incarnate', d: 'Defeat The Unmaker on Inferno', c: () => +S.done[3][11], need: 1, sp: 3 },
  { id: 'l10', n: 'Apprentice', d: 'Reach level 10', c: () => S.lvl, need: 10, sp: 0 },
  { id: 'l30', n: 'Adept', d: 'Reach level 30', c: () => S.lvl, need: 30, sp: 1 },
  { id: 'l60', n: 'Master', d: 'Reach level 60', c: () => S.lvl, need: 60, sp: 1 },
  { id: 'l100', n: 'Grandmaster', d: 'Reach level 100', c: () => S.lvl, need: 100, sp: 2 },
  { id: 'l150', n: 'Ascendant', d: 'Reach level 150', c: () => S.lvl, need: 150, sp: 3 },
  { id: 'leg1', n: 'Touched by Legend', d: 'Find a Legendary item', c: () => S.stats.legend, need: 1, sp: 0 },
  { id: 'leg30', n: 'Hoarder of Myths', d: 'Find 30 Legendary items', c: () => S.stats.legend, need: 30, sp: 1 },
  { id: 'myth', n: 'Blood-Red Fortune', d: 'Find a Mythic item', c: () => S.stats.mythic, need: 1, sp: 1 },
  { id: 'pd50', n: 'Untouchable', d: 'Perform 50 Perfect Dodges', c: () => S.stats.pd, need: 50, sp: 1 },
  { id: 'c100', n: 'Combo Artist', d: 'Reach a 100-hit combo', c: () => S.stats.maxCombo, need: 100, sp: 0 },
  { id: 'c500', n: 'Unstoppable', d: 'Reach a 500-hit combo', c: () => S.stats.maxCombo, need: 500, sp: 1 },
  { id: 'imp5', n: 'Gold Digger', d: 'Catch 5 Gilded Imps', c: () => S.stats.imps, need: 5, sp: 0 },
  { id: 'surge25', n: 'Living Flame', d: 'Unleash Ember Surge 25 times', c: () => S.stats.surges, need: 25, sp: 1 },
  { id: 'ab10', n: 'Into the Abyss', d: 'Reach Abyss depth 10', c: () => Math.max(...S.abyssBest), need: 10, sp: 1 },
  { id: 'ab30', n: 'Abyssal Diver', d: 'Reach Abyss depth 30', c: () => Math.max(...S.abyssBest), need: 30, sp: 2 },
  { id: 'up10', n: 'Master Smith', d: 'Upgrade an item to +10', c: () => S.stats.maxPlus, need: 10, sp: 1 },
  { id: 'boom', n: 'Kaboom', d: 'Smash 100 barrels and crates', c: () => S.stats.barrels, need: 100, sp: 0 },
  { id: 'floors', n: 'Deep Delver', d: 'Descend 150 floors', c: () => S.stats.floors, need: 150, sp: 1 },
];
