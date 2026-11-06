// ================= GEAR PACK: melee balance, armor weights, tempering, awakening, new legendary powers =================
// Melee weapons are ~10% weaker than before: walking up to foes shouldn't out-damage everything else.
for (const k of ['sword', 'katana', 'dagger', 'axe', 'hammer', 'spear', 'scythe', 'flail', 'fists', 'rapier', 'glaive']) WT[k].dmg = Math.round(WT[k].dmg * .9 * 100) / 100;
// monsters: a little tougher everywhere, guardians much tougher
let MON_HP = 1.18, MON_DMG = 1.1, BOSS_HP = 1.55, BOSS_DMG = 1.1;
// ---- armor weights (helm, chest, gloves, boots) ----
const WGT = {
  light:  { n: 'Light', ic: '🪶', col: '#9ae0a0', d: '+4% move speed, +2% crit chance', f: s => { s.moveSpd += 4; s.critC += 2; },
            disc: ['Evasion', '4 Light pieces: 8% chance to evade attacks entirely and dodge recharges 25% faster'] },
  medium: { n: 'Medium', ic: '🧥', col: '#e0c070', d: '+3% attack speed, +3% max life', f: s => { s.atkSpd += 3; s.hpPct += 3; },
            disc: ['Battle Rhythm', '4 Medium pieces: hits restore 0.4% life (up to 4 times a second) and +6% damage'] },
  heavy:  { n: 'Heavy', ic: '🛡️', col: '#a0b0d0', d: '+2.5% damage reduction, +5% max life, -2% move speed', f: s => { s.dr += 2.5; s.hpPct += 5; s.moveSpd -= 2; },
            disc: ['Bulwark', '4 Heavy pieces: the first hit every 6s deals 60% less damage, and +6% damage reduction'] },
};
const WGT_SLOTS = ['helm', 'armor', 'gloves', 'boots'];
// ---- tempering (one extra hand-picked stat on any armor piece, at Brann's forge) ----
const TEMPER = {
  vit:   { n: 'Vitality', d: '+6% max life', f: (s, m) => s.hpPct += 6 * m },
  guard: { n: 'Guarding', d: '+2% damage reduction', f: (s, m) => s.dr += 2 * m },
  spike: { n: 'Spiked', d: '+25% thorns', f: (s, m) => s.thorns += 25 * m },
  swift: { n: 'Fleet', d: '+5% move speed', f: (s, m) => s.moveSpd += 5 * m },
  fury:  { n: 'Fury', d: '+4% damage', f: (s, m) => s.dmg += 4 * m },
  focus: { n: 'Focus', d: '+5% cooldown reduction', f: (s, m) => s.cdr += 5 * m },
  keen:  { n: 'Keen', d: '+10% crit damage', f: (s, m) => s.critD += 10 * m },
  mend:  { n: 'Mending', d: '+0.3% life regen per second', f: (s, m) => s.regPct += .3 * m },
};
// ---- six new legendary powers ----
Object.assign(UNQ, {
  bloodlet:   { n: 'Bloodletting', d: 'Critical hits make foes bleed for 40% of the hit over 3s' },
  overcharge: { n: 'Overcharged', d: 'Every 10th attack releases an ember nova for 150% weapon damage' },
  giantslay:  { n: 'Giantslayer', d: '+30% damage to foes above 80% life' },
  secondwind: { n: 'Second Wind', d: 'Dropping below 30% life grants 40% damage reduction for 4s (30s cooldown)' },
  stoneskin:  { n: 'Stoneskin', d: '+15% damage reduction while standing still' },
  vampshroud: { n: 'Vampiric Shroud', d: 'Kills heal 1.5% of your max life' },
});
UNQ_W.push('bloodlet', 'overcharge', 'giantslay'); UNQ_A.push('secondwind', 'stoneskin', 'vampshroud');
Object.assign(UVAL, { bloodlet: .07, overcharge: .09, giantslay: .06, secondwind: .05, stoneskin: .05, vampshroud: .04 });
