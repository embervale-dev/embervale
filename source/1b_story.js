// ================= ARTIFACTS, STORY, LORE =================
RAR.push({ n: 'Celestial', c: '#7ffcff', aff: 6, m: 2.5 });
// Celestial artifacts: one per weapon type, each with two unique powers and a signature effect
const ARTI = {
  dawn:     { n: 'Dawnbreaker', t: 'sword', u: 'echo', u2: 'explode', sig: 'sunburst', d: 'Every 5th hit erupts in a sunburst for 300% weapon damage', lore: 'Forged from the first light that ever touched Embervale.' },
  oath:     { n: 'Oathkeeper', t: 'katana', u: 'reaper', u2: 'chain', sig: 'cleave', d: 'Critical hits cleave every foe within 2 tiles for 80% damage', lore: 'The blade of the First Warden, sworn never to fail.' },
  eternity: { n: "Eternity's Edge", t: 'dagger', u: 'echo', u2: 'frost', sig: 'frenzy', d: '+50% attack speed; every kill shaves 1s off all skill cooldowns', lore: 'A dagger that cuts the very threads of time.' },
  cinder:   { n: 'Cinderfang', t: 'axe', u: 'explode', u2: 'storm', sig: 'inferno', d: 'Hits set foes ablaze with Emberflame; burning foes take +25% damage', lore: 'Its edge still smoulders with the Ember\'s first fire.' },
  world:    { n: 'Worldsplitter', t: 'hammer', u: 'giant', u2: 'thunder', sig: 'quake', d: 'Every attack sends 8 shockwaves rippling outward', lore: 'Legend says the valleys of Embervale were carved by its fall.' },
  sky:      { n: 'Skypiercer', t: 'spear', u: 'giant', u2: 'chain', sig: 'storm', d: 'Every hit chains lightning to 4 foes for 40% damage', lore: 'Thrown once at the moon. The moon still bears the scar.' },
  reaver:   { n: 'Voidreaver', t: 'scythe', u: 'vamp', u2: 'reaper', sig: 'rift', d: 'Kills tear open void rifts that drag in and shred foes', lore: "Morvane's own blade, lost when he fell into the dark." },
  chain:    { n: 'Chainbreaker', t: 'flail', u: 'giant', u2: 'explode', sig: 'quake', d: 'Every attack sends 8 shockwaves rippling outward', lore: 'Wielded by the slave who broke the Ashen Legion\'s chains.' },
  colossus: { n: 'Fists of the Colossus', t: 'fists', u: 'echo', u2: 'vamp', sig: 'frenzy', d: '+50% attack speed; every kill shaves 1s off all skill cooldowns', lore: 'Tal built them for the Brass Colossus. They wanted a worthier owner.' },
  heart:    { n: 'Heartseeker', t: 'bow', u: 'pierce', u2: 'multi', sig: 'split', d: 'Projectile hits burst into 2 homing star-shards', lore: 'Its arrows have never missed a heart they were meant for.' },
  thunder:  { n: 'Thunderlord', t: 'xbow', u: 'chain', u2: 'thunder', sig: 'storm', d: 'Every hit chains lightning to 4 foes for 40% damage', lore: 'The Tempest Seraph wept for a century when it was stolen.' },
  kraken:   { n: "Leviathan's Wrath", t: 'cannon', u: 'giant', u2: 'chain', sig: 'quake', d: 'Every attack sends 8 shockwaves rippling outward', lore: 'Each shot carries the weight of the whole sea.' },
  starfall: { n: 'Staff of Starfall', t: 'staff', u: 'multi', u2: 'explode', sig: 'starfall', d: 'Every 3rd attack calls a falling star onto your cursor (250% damage)', lore: "Elowen's master carried it to the edge of the sky." },
  wish:     { n: 'The Last Wish', t: 'wand', u: 'chain', u2: 'multi', sig: 'starfall', d: 'Every 3rd attack calls a falling star onto your cursor (250% damage)', lore: 'Carved from the wishing tree of Haven before it burned.' },
  codex:    { n: 'The Abyssal Codex', t: 'tome', u: 'pierce', u2: 'storm', sig: 'split', d: 'Projectile hits burst into 2 homing star-shards', lore: 'Its final page is blank. It is waiting for your name.' },
  ouro:     { n: 'Ouroboros', t: 'chakram', u: 'multi', u2: 'vamp', sig: 'sunburst', d: 'Every 5th hit erupts in a sunburst for 300% weapon damage', lore: 'It always returns. So does everything it cuts.' },
};
const FORGE_COST = 120; // celestial fragments per artifact
// rough worth of each unique power for gear scoring (fraction of extra damage)
const UVAL = { chain: .12, explode: .12, multi: .3, frost: .08, echo: .25, giant: .12, thunder: .15, reaper: .1, storm: .12, pierce: .15, vamp: .05, orbit: .08, phoenix: 0, haste: .03, colossus: 0, kindled: .05 };

const SPK = {
  elowen: { n: 'Sage Elowen', ic: ico('book'), col: '#9ab8ff' },
  morvane: { n: 'Morvane, the Ashen Herald', ic: ico('moon'), col: '#c070ff' },
  you: { n: 'You', ic: ico('fire'), col: '#ffb04a' },
  orla: { n: 'Merchant Orla', ic: ico('gold'), col: '#e0b050' },
  brann: { n: 'Blacksmith Brann', ic: ico('anvil'), col: '#e07a50' },
  warden: { n: 'Freed Warden', ic: ico('sparkle'), col: '#ffe9a0' },
  boss: { n: 'Guardian', ic: ico('skull'), col: '#ff6a5a' },
};
const STORY_INTRO = [
  ['elowen', 'Wake, Kindled one. When I found you, you were nothing but ash in the fountain\'s coals... yet the Ember chose to relight you.'],
  ['elowen', 'Long ago, thirteen Wardens guarded the Ember that warms this valley. Twelve kept their oath. The thirteenth — Morvane — tried to swallow its flame and live forever.'],
  ['elowen', 'He failed. The Ember shattered into twelve shards, and Morvane poured his ash into the hearts of the other Wardens. Each now guards a shard, twisted into a monster.'],
  ['morvane', '...Another spark? How quaint. Run along, little ember. I will snuff you out just as I snuffed out them.'],
  ['elowen', 'He watches through the ash. Pay him no mind. Walk to the Waystone north of the fountain and begin in the Whispering Woods, where Warden Sylva fell.'],
];
// per-region story: warden's true name, arrival, boss taunt, freed-warden words, and Elowen's follow-up
const RSTORY = [
  { w: 'Sylva, Warden of Roots', arrive: [['elowen', 'The Woods remember Sylva\'s song. Now they only whisper. Follow the whispers to her heart — and mind the wolves.']], pre: 'The roots... drink... YOUR... LIGHT!', post: [['warden', 'Kindled... thank you. The rot came from below — from a crown of ash. Morvane still wears it.'], ['elowen', 'One shard returns, and the Ember stirs. Brother Aldric lies beneath the Sunken Crypt. Free him.']] },
  { w: 'Brother Aldric, Keeper of Rest', arrive: [['elowen', 'Aldric once sang the dead to sleep. Now he wakes them. Strike the Gravecallers first, or the dead will never stop rising.']], pre: 'Kneel, little light, and join my choir of bones.', post: [['warden', 'I heard Morvane\'s voice in every hymn... He hides something deeper than death. Seek the desert\'s memory.']] },
  { w: 'Kesh the Sunward', arrive: [['elowen', 'Kesh buried a whole empire beneath these dunes to protect the Ember. Tread carefully — the sand is hungry.']], pre: 'The sun is MINE! You will burn like all the rest!', post: [['warden', 'The ashen crown... it was forged from the Ember\'s very first spark. Morvane did not steal its power. He was born from it.']] },
  { w: 'Morrow the Healer', arrive: [['elowen', 'The Bloodmoon rose the night Morvane fell. Morrow tried to cure his rot... and caught it instead.']], pre: 'Sweet child, let Mother take away your pain... and your heart.', post: [['warden', 'I tried to heal him. He was the Ember\'s thirteenth child — its shadow. Every flame casts one.'], ['morvane', 'Do you see now, ember? I am not the flame\'s enemy. I am its other half.']] },
  { w: 'Rime, the Still Warden', arrive: [['elowen', 'Rime froze his own heart rather than let the ash take it. It was not enough. Break line of sight with the totems.']], pre: 'Be still. Be silent. Be ice.', post: [['warden', 'Ice preserves memory, Kindled. I saw it all: Elowen was there the night the Ember broke.'], ['elowen', '...Yes. I was the Ember\'s keeper, and I failed it. We will speak of it when you bring back more shards.']] },
  { w: 'Myca of the Deep Garden', arrive: [['elowen', 'The Deep Garden fed Haven for centuries. Now its spores burst like cinders. Keep moving.']], pre: 'Grow. Rot. Grow. Rot. Become... soil.', post: [['warden', 'The deepest roots touch the Abyss. Morvane is not in any region at all — he waits beneath every one of them.']] },
  { w: 'Tidewarden Nerei', arrive: [['elowen', 'The Grotto was a sanctuary once. Nerei\'s song kept the tides gentle. Listen... it has become a roar.']], pre: '...THE... DEEP... HUNGERS...', post: [['warden', 'The tide carried his ash to every shore. Only the Ember, made whole, can wash it out.']] },
  { w: 'Vulkar the Smith-Warden', arrive: [['elowen', 'Vulkar forged every Warden\'s blade. If you dream of Celestial steel, his fires remember the way.']], pre: 'My anvil needs a new hammer. Your bones will do nicely!', post: [['warden', 'Starmetal... I forged the Celestial weapons from fallen stars. Gather their fragments, and Brann can finish what I began.'], ['brann', '(Back in Haven) Vulkar\'s notes! With enough Celestial Fragments I can forge an artifact at my anvil. Bring me 120.']] },
  { w: 'Artificer Tal', arrive: [['elowen', 'Tal built a great clock to count the Ember\'s heartbeat. Since the fall, it has been ticking backward.']], pre: 'Calculating... probability of your survival: zero point zero.', post: [['warden', 'The clock showed me the end: the Ember breaks again — unless its shadow is embraced, not destroyed.']] },
  { w: 'Seraphine of the Storm', arrive: [['elowen', 'The Sky Ruins float on Seraphine\'s storms. Watch for her beams — they never strike the same place twice.']], pre: 'You climb so very high... only to fall.', post: [['warden', 'Elowen hid the truth from you: the Ember cannot burn without its shadow. Destroy Morvane, and you destroy the flame.'], ['elowen', '...She speaks true. I hoped you would never have to choose. Go to the Spire. Lumen sees every path.']] },
  { w: 'Lumen, the Prism Warden', arrive: [['elowen', 'Lumen sees every possible future at once. It drove her mad long before the ash ever did.']], pre: 'I see every path. In all of them, you kneel.', post: [['warden', 'No... there is one path where both flames live. It runs through you, Kindled. Only you.']] },
  { w: 'The Unmaker (Morvane\'s vessel)', arrive: [['morvane', 'Welcome home, little ember. Shall we finish what Elowen started a thousand years ago?']], pre: 'Twelve shards in your hand, and still you do not understand. Come — unmake me, and unmake yourself.', post: [['elowen', 'Kindled! The Ember is whole again — but Morvane\'s shadow fled into the Abyss beneath the world.'], ['morvane', 'You cannot kill a shadow while the flame still burns, ember. Come and find me... in the deep.'], ['elowen', 'Then we go deeper — together. Every trial you survive strengthens the Ember and draws him out. The harder paths are open to you now.']] },
];
const ABYSS_STORY = {
  10: [['morvane', 'Deeper still? The dark here remembers me as a child of light. Did Elowen ever tell you that?']],
  25: [['morvane', 'I was the Ember\'s shadow, ember. I only wanted to stand in my own light. Is that so monstrous?']],
  50: [['morvane', 'Fifty floors of my grief, and still you descend. Perhaps... perhaps you truly are the path Lumen saw.'], ['elowen', 'Kindled, if he is willing to listen — offer him the flame. Not as a weapon. As a hearth.']],
  100: [['morvane', 'Enough. You have walked through every shadow I have. Take my hand, ember... let us burn together, as we were always meant to.'], ['elowen', 'The thirteenth Warden returns. The Ember is whole — flame and shadow both. Thank you, Kindled. You saved us all.']],
};
const TRUE_END = [
  ['morvane', 'Inferno itself could not break you... I have run out of darkness to throw at you, ember.'],
  ['you', '(You hold out the Ember. Its light falls across Morvane — and his shadow does not flee.)'],
  ['morvane', '...It does not burn. It is warm. After a thousand years... it is warm.'],
  ['elowen', 'Flame and shadow, at peace at last. Embervale will never fade again. You have earned your place among the Wardens, Kindled — the Fourteenth.'],
];
const PAGES = [
  'The Ember was not lit. It was found — a falling star caught by the first villagers of Haven, still burning.',
  'Thirteen Wardens were chosen, one for each moon of the old calendar. The thirteenth moon is always the darkest.',
  'Sylva planted the Whispering Woods one seed per year. It took her nine hundred years.',
  'Aldric\'s choir sang so beautifully that the dead would climb out of their graves to listen, then politely climb back in.',
  'Before the dunes, Kesh\'s kingdom was a sea of glass made from the Ember\'s heat.',
  'Merchant Orla\'s grandmother sold Morvane his first cloak. She refused to say what colour it was.',
  'The Bloodmoon is not red because of blood. It is red because it is ashamed.',
  'Rime asked Elowen to freeze his heart. She wept as she did it, and her tears froze too. They are the Frostpeak glaciers.',
  'Myca believed every death was simply a seed. She was right, which is the frightening part.',
  'Nerei could sing in a voice so low only whales could hear it. The whales still sing her songs.',
  'Vulkar forged sixteen Celestial weapons from a single fallen star. He hid each one where only the worthy would find it.',
  'Blacksmith Brann is Vulkar\'s great-great-great grandson. He has the same burn scar on his left thumb.',
  'Artificer Tal\'s clock has 13 hours on its face. The 13th is painted black.',
  'Seraphine was the only Warden who could fly. She said the sky was lonely, which is why she made the storms — for company.',
  'Lumen saw ten thousand futures. In 9,999 of them, Embervale fell. She never told anyone about the last one.',
  'The Abyss is not a place. It is the space the Ember\'s light cannot reach — which is why it moves as the Ember grows.',
  'Morvane was born the instant the Ember first cast a shadow. He has never once been warm.',
  'Elowen is not a sage. She is the Ember\'s Keeper, the last mortal who ever touched it bare-handed.',
  'The ashen crown is made from the Ember\'s first cinder. Whoever wears it hears every flame in the world.',
  'Gilded Imps are not greedy. They are collecting gold to buy back the stars.',
  'Mimics were once honest chests. Too many adventurers kicked them.',
  'The Waystone was carved from the Ember\'s hearthstone. It remembers every place the Ember\'s light has touched.',
  'Haven\'s fountain once ran with water. Since the fall it runs with embers, and the children swim in the light.',
  'Some say a Kindled one appears every thousand years, when the Ember is at its dimmest. Some say it is always the same one.',
];
const HINTS = {
  stairs: 'Stairs stay sealed until you slay 70% of a floor\'s foes. The bar at the top-left shows your progress.',
  chest: 'Chests hold gold and gear — but about 1 in 10 is a Mimic!',
  shrine: 'Shrines grant a powerful 40-second buff. Step on them right before a big fight.',
  lowhp: 'Low on life! Press 1 to drink a potion. Potions refill whenever you return to Haven (T).',
  sp: 'You have a skill point! Press K to open the skill tree and bind new skills to Q / E / R / F.',
  surge: 'Your Ember Surge gauge is full — press V to unleash a devastating blast.',
  item: `You found gear! Press I to compare it, or use ${ico('bolt')} Auto-equip to wear your best items automatically.`,
  trap: 'Spike traps glow red just before they strike. Lure monsters onto them!',
  imp: 'A Gilded Imp! Chase it down before it escapes with its treasure.',
  page: `You found a Lost Page! Read it any time in the ${ico('book')} Journal (L).`,
  frag: 'A Celestial Fragment! Collect 120 and Brann can forge a legendary Celestial artifact.',
  elite: 'Elites have a colored ring and special traits. They drop much better loot.',
};
ACH.push(
  { id: 'celes', n: 'Touched by the Stars', d: 'Obtain a Celestial artifact', c: () => S.stats.celestial, need: 1, sp: 3 },
  { id: 'pages', n: 'Loremaster', d: `Collect all ${PAGES.length} Lost Pages`, c: () => S.pages.length, need: PAGES.length, sp: 2 },
  { id: 'pages10', n: 'Curious Mind', d: 'Collect 10 Lost Pages', c: () => S.pages.length, need: 10, sp: 1 },
  { id: 'trueend', n: 'Flame and Shadow', d: 'Reach the true ending', c: () => +!!(S.story.trueend || S.story.abyss100), need: 1, sp: 3 },
);
