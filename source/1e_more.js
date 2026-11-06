// ================= MORE CONTENT: data =================
// ---- 12 new monsters, one for every region ----
const NEW_EN = {
  treant:      [0, { n: 'Mossback Treant', ai: 'tank', hp: 100, dmg: 14, spd: 55, r: 20, col: '#5a7a3a', xp: 7, sh: 'horn' }, 'An old tree that woke angry. Its slam shakes the whole glade.'],
  banshee:     [1, { n: 'Banshee', ai: 'spread', hp: 30, dmg: 9, spd: 85, r: 13, col: '#d0d8ff', xp: 4, sh: 'ghost', pc: '#e8eeff', fire: 2.3, cnt: 5 }, 'Its scream is a fan of frozen grief.'],
  sandworm:    [2, { n: 'Sandworm', ai: 'dash', hp: 70, dmg: 15, spd: 110, r: 18, col: '#a07a4a', xp: 6, sh: 'beast' }, 'It hears your footsteps through the dunes long before it sees you.'],
  mirefly:     [3, { n: 'Mirefly', ai: 'swarm', hp: 12, dmg: 6, spd: 200, r: 8, col: '#b0ff60', xp: 1, sh: 'bat' }, 'Beautiful at night. Lethal in a swarm.'],
  rimewitch:   [4, { n: 'Rime Witch', ai: 'summon', minion: 'wisp', hp: 55, dmg: 10, spd: 60, r: 15, col: '#a0d8ff', xp: 7, sh: 'hood', fire: 6 }, 'Rime\'s apprentice, still conjuring the cold he taught her.'],
  puffcap:     [5, { n: 'Puffcap', ai: 'bomber', hp: 26, dmg: 22, spd: 140, r: 12, col: '#e08ad0', xp: 3, sh: 'shroom' }, 'It is very happy to see you. Explosively happy.'],
  siren:       [6, { n: 'Siren', ai: 'blink', hp: 40, dmg: 12, spd: 95, r: 14, col: '#40c0c0', xp: 5, sh: 'hood', pc: '#80ffff', fire: 2.4 }, 'Nerei\'s chorus. They vanish into the tide and reappear behind you.'],
  emberhound:  [7, { n: 'Ember Hound', ai: 'dash', hp: 52, dmg: 14, spd: 160, r: 15, col: '#ff5a20', xp: 5, sh: 'beast' }, 'Vulkar\'s forge-dogs. Their breath is molten.'],
  cogspider:   [8, { n: 'Clockwork Spider', ai: 'swarm', hp: 24, dmg: 9, spd: 190, r: 11, col: '#b08a50', xp: 2, sh: 'crab' }, 'Tal built them to repair the clock. Now they repair intruders. Permanently.'],
  griffin:     [9, { n: 'Storm Griffin', ai: 'dash', hp: 60, dmg: 15, spd: 165, r: 17, col: '#d8c890', xp: 6, sh: 'bat' }, 'Seraphine\'s mounts dive from the clouds like lightning.'],
  gemcrawler:  [10, { n: 'Gem Crawler', ai: 'chase', hp: 70, dmg: 14, spd: 100, r: 15, col: '#ff70d0', xp: 5, sh: 'crab' }, 'It eats crystal and sheds gems. Some say the Jeweler breeds them.'],
  nullwalker:  [11, { n: 'Null Walker', ai: 'tank', hp: 140, dmg: 19, spd: 70, r: 20, col: '#2a1a4a', xp: 9, sh: 'robot' }, 'A suit of armor with nothing inside but Morvane\'s will.'],
};
for (const k in NEW_EN) { const [r, d, lore] = NEW_EN[k]; EN[k] = d; REG[r].en.push(k); ABYSS.en.push(k); EN_LORE[k] = lore; }

// ---- 4 new weapon types ----
Object.assign(WT, {
  rapier:   { n: 'Rapier', ic: ico('w-rapier-t3'), dmg: 9, cd: .28, k: 'thrust', rng: 122, w: 16, kb: 60, crit: .15, col: '#e8eef8' },
  glaive:   { n: 'Glaive', ic: ico('w-glaive-t3'), dmg: 20, cd: .8, k: 'arc', rng: 112, arc: 2.9, kb: 220, col: '#c0b0ff' },
  shuriken: { n: 'Shuriken', ic: ico('w-shuriken-t3'), dmg: 7, cd: .34, k: 'fan', spd: 820, cnt: 3, pr: 2, col: '#d8d8e8' },
  scepter:  { n: 'Scepter', ic: ico('w-scepter-t3'), dmg: 15, cd: .62, k: 'orb', spd: 620, splash: 85, col: '#ffd27a' },
});

// ---- 4 new skills ----
SK.push(
  { id: 'warcry', b: 0, t: 1, n: 'War Cry', ic: ico('sk-warcry'), a: 1, max: 5, mp: 20, cd: 12, d: r => `Roar: blast nearby foes back, stun them 1.5s and gain +${15 + 5 * r}% damage for 6s.` },
  { id: 'snare', b: 1, t: 2, n: "Hunter's Net", ic: ico('sk-huntersnet'), a: 1, max: 5, mp: 20, cd: 9, d: r => `Hurl a net at the cursor that roots foes for ${(2 + .3 * r).toFixed(1)}s and deals ${100 + 30 * r}% weapon damage.` },
  { id: 'fblink', b: 2, t: 1, n: 'Frost Blink', ic: ico('sk-frostblink'), a: 1, max: 5, mp: 15, cd: 5, d: r => `Teleport to the cursor, freezing foes at both ends for ${80 + 20 * r}% weapon damage.` },
  { id: 'singularity', b: 2, t: 3, n: 'Singularity', ic: ico('sk-singularity'), a: 1, max: 5, mp: 45, cd: 16, d: r => `Open a black hole at the cursor for 4s that drags foes in and deals ${40 + 10 * r}% weapon damage 4×/s.` },
);
SK.forEach(s => SKI[s.id] = s);
// skill icon colours: gradient-painted by element/theme (see icoC in 0_icons.js)
const SK_COL = {
  vit: '#ff4a5a', whirl: '#c8d4e4', brut: '#ff6a3a', slam: '#c89a5a', iron: '#a8b4c8', berserk: '#ff3a2a', blood: '#e0203a', leap: '#ffb04a',
  fury: '#ff7a2a', blades: '#d8e4f4', warcry: '#ffcc4a',
  swift: '#5affb0', shadow: '#9a7aff', prec: '#ffe060', arrows: '#e8c890', quick: '#7ae0ff', poison: '#7aff3a', deadeye: '#ff5a4a',
  wolves: '#9ad0ff', fortune: '#ffd84a', knives: '#d0d8e8', snare: '#c8a070',
  arcane: '#b07aff', fireball: '#ff8a2a', elem: '#ff9af0', nova: '#8ae8ff', focus: '#7ab8ff', chain: '#ffe85a', power: '#d27aff',
  heal: '#5aff7a', meteor: '#ff5a1a', warp: '#7affe0', fblink: '#a8f0ff', singularity: '#a04aff',
};
for (const s of SK) if (SK_COL[s.id]) s.ic = icoC(icoKeyOf(s.ic), SK_COL[s.id]);

// ---- 4 new legendary powers ----
Object.assign(UNQ, {
  executioner: { n: 'Executioner\'s', d: '+50% damage to foes below 30% life' },
  soulleech:   { n: 'Soul-Drinking', d: 'Kills restore 5% mana and 1% life' },
  bulwark:     { n: 'Bulwark', d: '15% chance to completely block an attack' },
  swiftstep:   { n: 'Swiftstep', d: 'Dodge recharges 40% faster and grants a burst of speed' },
});
UNQ_W.push('executioner', 'soulleech'); UNQ_A.push('bulwark', 'swiftstep');
Object.assign(UVAL, { executioner: .12, soulleech: .04, bulwark: .06, swiftstep: .03 });

// ---- 4 new shrines, 2 new floor modifiers, 2 new elite traits ----
SHRINES.push(
  { k: 'echo', n: 'Shrine of Echoes', d: 'skills recharge twice as fast', col: '#a0c0ff' },
  { k: 'sanguine', n: 'Shrine of Blood', d: 'heal for 5% of all damage dealt', col: '#ff3a5a' },
  { k: 'tempest', n: 'Shrine of Storms', d: 'lightning strikes nearby foes', col: '#e0f0ff' },
  { k: 'plenty', n: 'Shrine of Plenty', d: 'foes drop double gold', col: '#ffe080' },
);
MODS.push(
  { k: 'haunted', n: 'Haunted', d: 'Restless spirits keep appearing • +40% experience', col: '#a0b0ff' },
  { k: 'bounty', n: 'Bountiful', d: 'Extra chests and double Ember Ore', col: '#80ff80' },
);
ELITES.Arcane = '#c080ff'; ELITES.Blinking = '#80ffe0';

// ---- champions & wanted bounties ----
const CHAMP_NAMES = [
  ['Grizzlemaw the Old', 'Thornbark', 'Ol\' Mossjaw'], ['Sexton Grimm', 'The Weeping Knight', 'Bonepicker'], ['Dunewraith Asha', 'King Scorpius', 'The Glass Tyrant'],
  ['Old Mother Rot', 'Bloodtooth', 'The Bog King'], ['Winterfang', 'Hailstone', 'The Frozen Duke'], ['Sporelord Puff', 'The Mycelial Mind', 'Rotcap'],
  ['Saltblade', 'The Drowned Captain', 'Pearl-Eye'], ['Cinderjaw', 'Slagheart', 'The Molten Twins'], ['Unit 13', 'Gearwright Prime', 'The Mainspring'],
  ['Galewing', 'Thunderhoof', 'The Sky Reaver'], ['Prism-Eater', 'Shardqueen Vey', 'The Facet'], ['The Hollow Prince', 'Nullbringer', 'Echo of Morvane'],
];
// ---- Haven restoration ----
const HAVEN_B = {
  library:   { n: 'Grand Library', ic: ico('library'), d: l => `+${4 * l}% experience`, f: (s, l) => s.xp += 4 * l },
  armory:    { n: 'Town Armory', ic: ico('shield'), d: l => `+${3 * l}% damage and +${l}% damage reduction`, f: (s, l) => { s.dmg += 3 * l; s.dr += l; } },
  infirmary: { n: 'Infirmary', ic: ico('infirmary'), d: l => `+${l} potion refilled on every new floor, +${10 * l}% life regen`, f: (s, l) => s.hpReg *= 1 + .1 * l },
  market:    { n: 'Market Square', ic: ico('shop'), d: l => `Items sell for +${15 * l}% gold`, f: () => { } },
  inn:       { n: 'The Warm Hearth Inn', ic: ico('bed'), d: l => `Rested bonus holds +${l} more day${l > 1 ? 's' : ''} and builds ${25 * l}% faster`, f: () => { } },
};
const HAVEN_COST = [600, 4500, 30000];
// ---- daily gifts & fortune wheel ----
const GIFTS = [['● Gold', 'gold'], [ico('gem') + ' 2 Gems', 'gems'], [ico('marks') + ' 15 Marks', 'marks'], ['◆ 6 Ember Ore', 'ore'], ['✦ 25 Shards', 'shards'], ['✧ 2 Celestial Fragments', 'frag'], [ico('gift') + ' Legendary + 40 Marks', 'big']];
