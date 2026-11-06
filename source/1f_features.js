// ================= FEATURE PACK: data =================
// ---- Item sets: 4 pieces each, bonuses at 2 and 4 pieces. Drop in their home regions. ----
const SETS = {
  warden:  { n: "Warden's Vigil", col: '#5ae0a0', reg: [0, 1, 2], pieces: ['helm', 'armor', 'gloves', 'boots'], b: [['+15% max life', s => s.hpPct += 15], ['+8% damage reduction and +3% life steal', s => { s.dr += 8; s.ls += 3; }]] },
  hunter:  { n: 'Ashen Hunter', col: '#ffb060', reg: [2, 3, 4], pieces: ['helm', 'gloves', 'boots', 'ring'], b: [['+18% attack speed', s => s.atkSpd += 18], ['+35% critical damage and +6% crit chance', s => { s.critD += 35; s.critC += 6; }]] },
  storm:   { n: "Stormcaller's Regalia", col: '#80c0ff', reg: [4, 5, 6], pieces: ['helm', 'armor', 'ring', 'amulet'], b: [['+22% skill damage', s => s.skill += 22], ['+25% shock chance and +12% cooldown reduction', s => { s.shk += 25; s.cdr += 12; }]] },
  tide:    { n: 'Tidebound Plate', col: '#40d0c0', reg: [5, 6, 7], pieces: ['helm', 'armor', 'gloves', 'boots'], b: [['+30% thorns and +10% max life', s => { s.thorns += 30; s.hpPct += 10; }], ['+12% damage reduction and regenerate 0.6% life per second', s => { s.dr += 12; s.regPct += .6; }]] },
  clock:   { n: 'Clockwork Precision', col: '#e0c060', reg: [7, 8, 9], pieces: ['gloves', 'boots', 'ring', 'amulet'], b: [['+15% move speed', s => s.moveSpd += 15], ['+30% Ember Surge gain and +40% combo damage', s => { s.surge += 30; s.combo += 40; }]] },
  void:    { n: 'Voidwalker Shroud', col: '#c080ff', reg: [9, 10, 11], pieces: ['helm', 'armor', 'boots', 'amulet'], b: [['+12% damage', s => s.dmg += 12], ['+30% damage to elites & bosses and +10% damage', s => { s.elite += 30; s.dmg += 10; }]] },
};
// ---- Skill runes: one modifier per active skill (unlocked at rank 3) ----
const RUNES = {
  emp:   { n: 'Empowered', ic: ico('rune-empowered'), d: '+35% damage, +25% mana cost', dmg: 1.35, mp: 1.25, cd: 1 },
  swift: { n: 'Swift', ic: ico('fast'), d: '-30% cooldown', dmg: 1, mp: 1, cd: .7 },
  eff:   { n: 'Efficient', ic: ico('mana'), d: '-45% mana cost', dmg: 1, mp: .55, cd: 1 },
};
// ---- Regional floor hazards ----
const HAZ = [
  { k: 'thorns', n: 'Bramble Patch', col: '#3a6a20', dps: .5, slow: .3, en: 1 }, { k: 'curse', n: 'Cursed Ground', col: '#4a3a6a', dps: .3, mana: 8 },
  { k: 'quicksand', n: 'Quicksand', col: '#b08a50', slow: .55 }, { k: 'bog', n: 'Blood Bog', col: '#5a2a2a', dps: .35, slow: .35, en: 1 },
  { k: 'ice', n: 'Black Ice', col: '#a0e0ff', slide: 1 }, { k: 'spores', n: 'Spore Cloud', col: '#9ac040', dps: .55, en: 1 },
  { k: 'current', n: 'Riptide', col: '#3a90b0', push: 170 }, { k: 'lava', n: 'Lava Pool', col: '#ff5a10', dps: 1.4, en: 1 },
  { k: 'steam', n: 'Steam Vent', col: '#b0b0b0', burst: 1 }, { k: 'gust', n: 'Gale', col: '#e0e8ff', push: 210 },
  { k: 'shards', n: 'Shard Field', col: '#c0a0ff', dps: .7, en: 1 }, { k: 'null', n: 'Null Zone', col: '#2a1040', dps: .4, mana: 14, en: 1 },
];
// ---- Captives & villager requests ----
const CAPTIVES = [
  ['Bram', '#7a8a5a', '#3a2a1a', ['Thank you for saving me, Kindled!', 'I was a woodcutter before the wolves came.', 'Haven feels like home again.']],
  ['Iris', '#c07a9a', '#e0c060', ['I sing at the inn now. Come listen sometime!', 'The Crypt... I don\'t like to talk about it.']],
  ['Dorran', '#6a6a8a', '#2a2a2a', ['I owe you my life.', 'I\'m helping Brann at the forge now.', 'Sharp steel saves lives.']],
  ['Lysa', '#5aa0a0', '#a05a2a', ['The coral was beautiful once.', 'I knit scarves for the guards now.']],
  ['Old Fen', '#8a7a5a', '#d8d8d8', ['Back in my day we had TWO moons.', 'Don\'t tell Hennik, but I\'m the better storyteller.']],
  ['Kip', '#d0a040', '#5a3a1a', ['Can I hold your sword? Just once?', 'I\'m going to be a Warden like you!']],
  ['Sorrel', '#6aa060', '#3a5a2a', ['Mushrooms are delicious once you remove the screaming ones.', 'I tend the garden now.']],
  ['Mira', '#a06ad0', '#2a1a3a', ['I studied the stars in the Spire.', 'The night sky looks brighter since you returned.']],
];
const SIDEQ = [
  { id: 'pip1', who: 'Pip', t: 'Wolf Trouble', give: 'Grey wolves keep stealing our chickens! Could you slay 15 of them in the Whispering Woods?', done: 'You did it! The chickens are saved! Here — I made you this badge myself.', goal: { k: 'kill', t: 'wolf', n: 15 }, rw: { marks: 20, gold: 300, title: 'Chicken Saviour' } },
  { id: 'hen1', who: 'Old Hennik', t: "Hennik's Locket", give: 'I lost my late wife\'s locket in the Sunken Crypt, decades ago. If you find it on your travels down there, I\'d be ever so grateful.', done: 'My locket... I can see her face again. Take this, it\'s all I have.', goal: { k: 'find', item: "Hennik's Locket", reg: 1, n: 1 }, rw: { marks: 30, gold: 800, gems: 3 } },
  { id: 'mar1', who: 'Marla', t: 'Glowcap Supper', give: 'I make the best glowcap stew in the valley — but glowcaps only grow in the Fungal Depths. Bring me 5?', done: 'Smell that! Here, take a bowl — and this, for the trouble.', goal: { k: 'find', item: 'Glowcap Mushroom', reg: 5, n: 5 }, rw: { marks: 35, gold: 1500, color: '#40ff9a' } },
  { id: 'tom1', who: 'Tomas', t: 'Catch the Imp', give: 'A Gilded Imp stole my lucky coin! Catch one for me — any of them, they all look the same.', done: 'HA! You caught one! Here\'s a share of its gold. Keep the coin, it\'s clearly unlucky for me.', goal: { k: 'kill', t: 'gimp', n: 1 }, rw: { marks: 25, gold: 1000 } },
  { id: 'pip2', who: 'Pip', after: 'pip1', t: 'The Sand King', give: 'Mum says Sandtyrant Kesh is the scariest thing in the world. Is that true? Can you beat him?', done: 'You beat KESH?! You\'re the best Warden EVER. I\'m telling everyone!', goal: { k: 'kill', t: 'kesh', n: 1 }, rw: { marks: 40, title: "Pip's Hero" } },
  { id: 'hen2', who: 'Old Hennik', after: 'hen1', t: 'The Old Medal', give: 'When I was young I served Rime himself. I left my Warden medal in Frostpeak when I fled. Would you fetch it?', done: 'My medal... I thought I would never hold it again. You deserve it more than I do.', goal: { k: 'find', item: "Rime's Medal", reg: 4, n: 1 }, rw: { marks: 45, gold: 3000, frag: 3 } },
  { id: 'mar2', who: 'Marla', after: 'mar1', t: 'Leech Remedy', give: 'My brother came back from the Bloodmoon Marsh covered in leech bites. Slay 30 Bloodleeches so it doesn\'t happen again?', done: 'He\'s already feeling better just hearing it. Thank you, truly.', goal: { k: 'kill', t: 'leech', n: 30 }, rw: { marks: 40, gold: 4000, gems: 4 } },
  { id: 'tom2', who: 'Tomas', after: 'tom1', t: 'Page Turner', give: 'I love stories. If you find 10 Lost Pages, will you read them to me?', done: 'That was the best story ever. Here — I found this in the attic. It glows!', goal: { k: 'pages', n: 10 }, rw: { marks: 50, frag: 5 } },
];
const ROOM_SECRETS = ['A forgotten treasury', 'An old Warden cache', 'A smuggler\'s stash', 'A sealed shrine'];
