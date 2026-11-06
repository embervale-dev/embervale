// ================= WEAPONS: balance pass, roles, signature arts, mastery, infusions =================
// Balance measured in a combat simulator against the Sword (1.00 single-target DPS):
// melee 1.0-1.25 (shorter reach / more risk = more damage), ranged 0.85-1.05 (safety costs damage),
// area weapons trade single-target damage for big crowd damage. Rarity multipliers are untouched.
const WBAL = {
  sword: { dmg: 8.17, arc: 2.0 }, katana: { dmg: 7.3 }, dagger: { dmg: 4.77 }, axe: { dmg: 19.27 }, hammer: { dmg: 20.98 }, spear: { dmg: 12.74 }, scythe: { dmg: 16.45 }, flail: { dmg: 14.58 }, fists: { dmg: 3.74 },
  bow: { dmg: 7.69, pr: 1 }, xbow: { dmg: 16.47 }, cannon: { dmg: 14.68, splash: 52 }, staff: { dmg: 8.55, splash: 45 }, wand: { dmg: 3.36, cd: .2 },
  tome: { dmg: 2.96, cnt: 3, pr: 1 }, chakram: { dmg: 4.44 }, rapier: { dmg: 5.72 }, glaive: { dmg: 16.3, arc: 2.15 }, shuriken: { dmg: 2.11, pr: 1 }, scepter: { dmg: 7.67, splash: 48 },
};
for (const k in WBAL) Object.assign(WT[k], WBAL[k]);
// role + ratings (1-5): single target, crowds, reach, safety, speed
const WROLE = {
  sword:    ['All-rounder', 3, 3, 2, 3, 3], katana: ['Duelist', 4, 3, 2, 2, 4], dagger: ['Assassin', 4, 1, 1, 1, 5], axe: ['Cleaver', 3, 5, 3, 2, 2],
  hammer:   ['Crusher', 3, 5, 2, 2, 1], spear: ['Lancer', 3, 3, 4, 3, 3], scythe: ['Reaper', 3, 4, 3, 3, 2], flail: ['Whirlwind', 3, 4, 3, 3, 2],
  fists:    ['Brawler', 5, 1, 1, 1, 5], bow: ['Marksman', 3, 2, 5, 5, 3], xbow: ['Sniper', 3, 3, 5, 5, 2], cannon: ['Bombardier', 3, 4, 4, 4, 1],
  staff:    ['Arcanist', 2, 4, 4, 4, 2], wand: ['Sparkcaster', 2, 1, 4, 5, 5], tome: ['Scribe', 3, 3, 2, 3, 3], chakram: ['Ricocheter', 3, 3, 3, 4, 3],
  rapier:   ['Fencer', 4, 2, 3, 2, 5], glaive: ['Moon Dancer', 3, 5, 3, 3, 2], shuriken: ['Shadow', 3, 3, 3, 3, 4], scepter: ['Sovereign', 2, 4, 4, 4, 2],
};
// signature weapon arts — every weapon type plays differently
const WART = {
  sword:    ['Rhythm', 'Every 3rd consecutive swing is a Finisher: +35% damage and a crescent wave that flies forward.'],
  katana:   ['Quickdraw', 'If you haven\'t attacked for 1 second, your next swing always crits and deals +50% damage.'],
  dagger:   ['Bleed', 'Hits open wounds that stack up to 5 times. Each stack deals 8% of the hit\'s damage per second for 3s.'],
  axe:      ['Bloodlust', 'Killing blows grant +6% attack speed for 5s, stacking up to 5 times.'],
  hammer:   ['Earthshaker', 'Slams stun foes for 0.5s. Every 3rd slam releases a wide shockwave for 40% damage.'],
  spear:    ['Sweet Spot', 'Hitting foes with the outer half of the thrust deals +35% damage.'],
  scythe:   ['Soul Reap', 'Kills gather Souls (max 10) for +3% damage each. At 10 Souls your next swing heals 8% life.'],
  flail:    ['Momentum', 'Attacking without pause builds Momentum: +4% attack speed per stack, up to +20%. Stopping resets it.'],
  fists:    ['Flurry', 'Every 5th punch is an Uppercut: +100% damage, a 0.6s stun and a heavy knockback.'],
  bow:      ['Deadeye', 'Arrows deal up to +50% damage the farther they travel. Arrows pierce one foe.'],
  xbow:     ['Heavy Bolt', 'Every 4th bolt is a Heavy Bolt that explodes on impact for full damage in an area.'],
  cannon:   ['Scorched Earth', 'Cannonballs set every foe in the blast ablaze.'],
  staff:    ['Resonance', 'Every 4th orb is Resonant: +50% damage and a blast twice as wide.'],
  wand:     ['Chain Spark', 'Sparks have a 25% chance to arc to a second foe for 70% damage.'],
  tome:     ['Page Storm', 'Every 4th volley unleashes 6 extra homing pages.'],
  chakram:  ['Ricochet', 'On the return trip the chakram deals +40% damage.'],
  rapier:   ['Riposte', 'After a dodge roll, your next 3 thrusts are guaranteed critical hits.'],
  glaive:   ['Crescent', 'Hitting 3 or more foes with one sweep heals 2% of your life.'],
  shuriken: ['Death Mark', 'Hits Mark foes. The 4th Mark detonates for 70% bonus damage.'],
  scepter:  ['Royal Decree', 'Blasts shock foes (they take +20% damage). Every 5th orb also calls lightning onto its target.'],
};
// elemental infusions (Brann's forge) — tint the weapon and add an elemental proc to its attacks
const INFUSE = {
  fire:  { n: 'Emberforged', ic: ico('fire'), col: '#ff7a2a', d: '20% chance on hit to set foes ablaze' },
  frost: { n: 'Rimeforged', ic: ico('snow'), col: '#8ae0ff', d: '20% chance on hit to chill foes (frozen briefly)' },
  storm: { n: 'Stormforged', ic: ico('bolt'), col: '#e8e070', d: '20% chance on hit to shock foes (+20% damage taken)' },
  venom: { n: 'Venomforged', ic: ico('poison'), col: '#8aff5a', d: '20% chance on hit to poison foes' },
  holy:  { n: 'Dawnforged', ic: ico('sparkle'), col: '#fff0b0', d: '20% chance on hit to heal 0.5% of your life' },
};
