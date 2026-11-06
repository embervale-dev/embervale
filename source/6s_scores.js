// ================= MUSIC SCORES: one composition per environment =================
// Melodies are written in scale degrees (0 = tonic of the piece's mode, 7 = octave up) so they always sit in key.
// bl = sixteenth-note slots per bar (16 = 4/4, 12 = 6/8 or 3/4, 20 = 5/4). Each piece has two 8-bar sections, A then B, looping.
//   note token  "deg:len"  (len in 16ths)   "r:len" = rest   trailing "." = detached   "@deg" = relative to the bar's chord root
//   chord token "root" + optional 7 / 9 / s (sus2);  "a/b" = two chords in one bar

const PHRD = [0, 1, 4, 5, 7, 8, 10];
const MUS_PIECES = {};

// ---- Title: "The Fading Flame" (wistful, hopeful) ----
MUS_PIECES.title = {
  root: 220, mode: AEO, bpm: 64, bl: 16, lead: 'flute', harm: 'strings', pad: 'strings', rev: .5, perc: null,
  acc: [{ k: 'arp', inst: 'harp', step: 2, pat: [0, 1, 2, 3, 2, 1, 2, 4], vol: .05 }],
  bass: { inst: 'cello', pat: [[0, 0, 15]], vol: .08 },
  A: { ch: '0 5 2 6 0 3 6 4', m: ['4:6 2:2 4:4 7:4', '9:6 7:2 5:4 7:4', '6:6 4:2 6:4 9:4', '8:8 6:4 5:4', '7:6 9:2 11:4 9:4', '10:6 9:2 7:4 5:4', '8:4 6:4 8:4 10:4', '11:6 10:2 8:8'] },
  B: { ch: '5 3 0 6 5 3 6 4', m: ['12:6 11:2 9:4 7:4', '10:6 12:2 14:4 12:4', '11:8 9:4 7:4', '8:4 10:4 8:4 6:4', '9:6 11:2 12:4 14:4', '14:4 12:4 10:8', '13:6 12:2 10:4 8:4', '8:4 10:4 11:8'] },
};
// ---- Haven: a warm 6/8 village jig ----
MUS_PIECES.town = {
  root: 261.6, mode: ION, bpm: 116, bl: 12, lead: 'whistle', harm: 'flute', pad: 'strings', padVol: .012, rev: .2,
  perc: [[0, 'tom', .13], [6, 'tom', .1], [3, 'tamb', .05], [9, 'tamb', .05]], percFrom: 0,
  acc: [{ k: 'strum', inst: 'lute', at: [4, 10], vol: .05 }],
  bass: { inst: 'pluck', pat: [[0, 0, 5], [6, 4, 5]], vol: .1 },
  A: { ch: '0 0 3 4 0 5 4 0', m: ['4:4 5:2 4:4 2:2', '0:4 2:2 4:6', '5:4 4:2 3:4 5:2', '4:4 6:2 8:6', '7:4 8:2 7:4 4:2', '9:4 8:2 7:4 5:2', '6:4 4:2 6:2 8:2 6:2', '7:6 4:2 2:2 0:2'] },
  B: { ch: '5 3 0 4 5 3 4 0', m: ['9:4 11:2 9:4 7:2', '10:4 12:2 14:6', '11:4 9:2 7:4 9:2', '11:4 13:2 11:6', '9:2 9:2 9:2 11:2 12:2 9:2', '10:4 9:2 10:4 12:2', '11:4 8:2 6:4 8:2', '7:12'] },
};
// ---- Whispering Woods: a gentle dorian waltz ----
MUS_PIECES.r0 = {
  root: 220, mode: DOR, bpm: 104, bl: 12, lead: 'flute', harm: 'strings', pad: 'strings', rev: .4,
  perc: [[0, 'tom', .07]], percFrom: 1,
  acc: [{ k: 'arp', inst: 'harp', step: 2, pat: [0, 1, 2, 3, 2, 1], vol: .05 }],
  bass: { inst: 'cello', pat: [[0, 0, 11]], vol: .08 },
  A: { ch: '0 3 0 6 0 3 1 0', m: ['4:4 5:2 4:2 2:4', '5:4 3:4 5:4', '7:6 4:2 2:4', '6:4 8:2 6:2 4:4', '4:6 5:2 7:4', '9:4 7:4 5:4', '8:4 6:4 5:4', '7:12'] },
  B: { ch: '2 6 0 3 2 6 4 0', m: ['9:4 11:4 13:4', '13:6 12:2 11:4', '9:4 11:4 14:4', '12:6 10:2 12:4', '11:4 13:4 11:4', '13:4 10:4 8:4', '11:6 8:2 6:4', '7:8 4:4'] },
};
// ---- Sunken Crypt: cold, sparse, phrygian ----
MUS_PIECES.r1 = {
  root: 196, mode: PHR, bpm: 54, bl: 16, lead: 'choir', harm: null, pad: 'choir', padVol: .014, rev: .75,
  perc: [[0, 'taiko', .12]], percFrom: 1,
  acc: [{ k: 'arp', inst: 'bell', step: 8, pat: [3, 4, 2, 5], vol: .035 }],
  bass: { inst: 'cello', pat: [[0, 0, 15]], vol: .09 },
  A: { ch: '0 0 1 0 5 6 1 0', m: ['4:8 3:4 2:4', '2:8 4:8', '8:8 6:4 5:4', '4:12 r:4', '9:8 7:4 5:4', '6:8 8:4 10:4', '8:8 7:4 8:4', '7:16'] },
  B: { ch: '3 0 5 1 3 6 1 0', m: ['10:8 9:4 7:4', '9:6 11:2 9:8', '12:8 9:4 7:4', '8:8 10:8', '12:8 10:4 9:4', '13:8 10:8', '8:4 10:4 12:8', '11:12 r:4'] },
};
// ---- Ashen Dunes: phrygian-dominant, 3+3+2 desert groove ----
MUS_PIECES.r2 = {
  root: 233.1, mode: PHRD, bpm: 88, bl: 16, lead: 'reed', harm: 'strings', pad: 'strings', padVol: .012, rev: .3,
  perc: [[0, 'tom', .15], [6, 'tom', .1], [10, 'tom', .1], [12, 'tamb', .05], [3, 'tamb', .035]], percFrom: 0,
  acc: [{ k: 'arp', inst: 'lute', step: 2, pat: [0, 2, 4, 2, 0, 2, 4, 3], vol: .05 }],
  bass: { inst: 'pluck', pat: [[0, 0, 5], [6, 0, 5], [12, 4, 3]], vol: .1 },
  A: { ch: '0 0 1 0 0 1 4 0', m: ['4:6 3:6 2:4', '1:6 2:6 0:4', '8:6 7:6 5:4', '4:8 2:4 0:4', '9:6 8:6 7:4', '8:4 10:6 8:6', '11:6 10:6 8:4', '7:12 r:4'] },
  B: { ch: '0 1 0 1 0 4 1 0', m: ['7:2 9:2 11:2 9:2 7:2 9:2 11:4', '8:2 10:2 12:2 10:2 8:2 10:2 12:4', '11:6 12:6 11:4', '12:6 10:6 8:4', '14:6 13:6 11:4', '13:4 11:6 10:6', '12:6 10:6 8:4', '7:8 4:4 r:4'] },
};
// ---- Bloodmoon Marsh: a slow mournful 6/8 ----
MUS_PIECES.r3 = {
  root: 207.7, mode: AEO, bpm: 62, bl: 12, lead: 'clarinet', harm: null, pad: 'choir', padVol: .012, rev: .6,
  perc: [[0, 'taiko', .09]], percFrom: 1,
  acc: [{ k: 'arp', inst: 'harp', step: 4, pat: [0, 2, 1], vol: .05 }],
  bass: { inst: 'cello', pat: [[0, 0, 11]], vol: .09 },
  A: { ch: '0 5 6 0 0 3 4 0', m: ['4:6 2:6', '5:4 7:4 9:4', '8:6 6:6', '4:6 7:6', '9:6 7:6', '5:4 3:4 5:4', '6:6 4:6', '2:12'] },
  B: { ch: '5 6 0 0 5 3 4 0', m: ['9:6 12:6', '13:6 10:6', '11:4 9:4 7:4', '9:12', '12:6 9:6', '10:4 12:4 14:4', '13:6 11:6', '7:12'] },
};
// ---- Frostpeak Hollows: cold, glittering music-box lullaby ----
MUS_PIECES.r4 = {
  root: 246.9, mode: DOR, bpm: 66, bl: 16, lead: 'musicbox', lo: 1, harm: null, pad: 'strings', padVol: .014, rev: .7, perc: null,
  acc: [{ k: 'arp', inst: 'celesta', step: 4, pat: [0, 2, 4, 2], vol: .035 }],
  bass: { inst: 'cello', pat: [[0, 0, 15]], vol: .08 },
  A: { ch: '0 3 0 6 0 3 6 4', m: ['4:4 2:4 4:4 7:4', '7:4 5:4 7:4 10:4', '9:4 7:4 4:4 7:4', '8:8 6:4 8:4', '11:6 9:2 7:4 4:4', '10:4 7:4 5:4 7:4', '8:4 10:4 8:4 6:4', '11:8 8:4 r:4'] },
  B: { ch: '3 0 6 2 3 0 6 4', m: ['10:6 12:2 14:4 12:4', '11:4 14:4 11:4 9:4', '13:6 10:2 8:4 10:4', '9:4 11:4 13:8', '14:6 12:2 10:4 12:4', '14:4 11:4 9:4 7:4', '13:4 15:4 13:4 10:4', '11:12 r:4'] },
};
// ---- Fungal Depths: a quirky 5/4 for marimba ----
MUS_PIECES.r5 = {
  root: 233.1, mode: DOR, bpm: 96, bl: 20, lead: 'marimba', harm: null, pad: 'choir', padVol: .01, rev: .45,
  perc: [[0, 'wood', .07], [6, 'wood', .05], [10, 'wood', .05], [16, 'wood', .05]], percFrom: 1,
  acc: [{ k: 'arp', inst: 'pizz', step: 2, pat: [0, 2, 1, 2, 3, 2, 1, 2, 0, 2], vol: .04 }],
  bass: { inst: 'pluck', pat: [[0, 0, 5], [10, 4, 5]], vol: .09 },
  A: { ch: '0 3 0 6 0 3 2 4', m: ['4:6 2:4 4:6 7:4', '5:6 3:4 5:6 7:4', '9:6 7:4 4:6 2:4', '8:6 6:4 8:6 10:4', '4:4 5:2 4:4 2:4 4:6', '3:6 5:4 7:6 5:4', '6:6 4:4 2:6 4:4', '4:6 6:4 8:10'] },
  B: { ch: '3 6 0 2 3 6 4 0', m: ['10:4 12:2 10:4 7:4 5:6', '13:6 10:4 8:6 10:4', '11:6 9:4 7:6 9:4', '9:4 11:4 13:6 11:6', '12:6 10:4 12:6 14:4', '13:4 10:4 8:6 6:6', '11:6 8:4 11:6 13:4', '7:12 4:4 r:4'] },
};
// ---- Coral Grotto: flowing 6/8, harp ripples ----
MUS_PIECES.r6 = {
  root: 261.6, mode: ION, bpm: 76, bl: 12, lead: 'flute', harm: 'strings', pad: 'strings', rev: .65, perc: null,
  acc: [{ k: 'arp', inst: 'harp', step: 1, pat: [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3], vol: .035 }],
  bass: { inst: 'cello', pat: [[0, 0, 11]], vol: .08 },
  A: { ch: '0 5 3 4 0 5 3 4', m: ['4:4 7:4 9:4', '9:6 7:2 5:4', '10:4 12:4 14:4', '13:6 11:6', '9:4 11:4 14:4', '12:6 9:2 7:4', '10:4 9:4 7:4', '8:6 6:6'] },
  B: { ch: '3 0 4 5 3 0 4 0', m: ['14:4 12:4 10:4', '11:6 9:2 7:4', '11:4 13:4 15:4', '12:6 9:6', '10:4 12:4 14:4', '11:4 14:4 11:4', '13:6 8:6', '7:12'] },
};
// ---- Molten Forge: heavy dorian march with anvils ----
MUS_PIECES.r7 = {
  root: 220, mode: DOR, bpm: 96, bl: 16, lead: 'horn', harm: 'strings', pad: 'strings', padVol: .012, rev: .3,
  perc: [[0, 'taiko', .24], [8, 'taiko', .18], [4, 'anvil', .05], [12, 'anvil', .06], [10, 'wood', .05]], percFrom: 0,
  acc: [{ k: 'pulse', inst: 'cello', step: 2, pat: [0, 0, 4, 0], vol: .06 }],
  bass: { inst: 'pluck', pat: [[0, 0, 7], [8, 0, 7]], vol: .1 },
  A: { ch: '0 0 6 6 0 0 3 6', m: ['4:4 2:2 4:2 7:6 4:2', '4:4 2:2 4:2 9:6 7:2', '6:4 3:2 6:2 8:6 6:2', '6:4 3:2 6:2 10:6 8:2', '7:2 7:2 9:4 11:4 9:4', '7:2 7:2 9:4 11:4 14:4', '10:4 9:2 7:2 5:4 7:4', '8:8 6:4 r:4'] },
  B: { ch: '3 6 0 0 3 6 4 0', m: ['10:6 12:2 14:8', '13:6 15:2 13:8', '14:6 11:2 9:4 7:4', '9:4 11:4 14:8', '12:4 14:4 12:4 10:4', '13:4 15:4 13:4 10:4', '11:6 13:2 11:4 8:4', '7:8 4:4 r:4'] },
};
// ---- Clockwork Halls: precise, mechanical, music-box ticks ----
MUS_PIECES.r8 = {
  root: 246.9, mode: MIX, bpm: 108, bl: 16, lead: 'musicbox', lo: 1, harm: null, pad: 'strings', padVol: .01, rev: .25,
  perc: [[0, 'wood', .08], [4, 'wood', .05], [8, 'wood', .08], [12, 'wood', .05], [2, 'tick', .03], [6, 'tick', .03], [10, 'tick', .03], [14, 'tick', .03]], percFrom: 0,
  acc: [{ k: 'pulse', inst: 'pizz', step: 2, pat: [0, 2, 4, 2], vol: .05 }],
  bass: { inst: 'pluck', pat: [[0, 0, 3], [8, 4, 3]], vol: .09 },
  A: { ch: '0 3 0 6 0 3 6 0', m: ['4:2 7:2 4:2 7:2 9:2 7:2 4:2 2:2', '5:2 7:2 5:2 7:2 10:2 7:2 5:2 3:2', '4:2 7:2 9:2 11:2 9:2 7:2 4:2 2:2', '6:2 8:2 6:2 8:2 10:2 8:2 6:2 3:2', '7:4 4:4 7:4 9:4', '10:4 7:4 5:4 7:4', '8:4 6:4 8:4 10:4', '7:8 r:8'] },
  B: { ch: '3 0 6 0 3 6 4 0', m: ['10:2 12:2 14:2 12:2 10:2 12:2 14:4', '11:2 9:2 11:2 14:2 11:2 9:2 7:4', '13:2 15:2 13:2 10:2 8:2 10:2 13:4', '14:4 11:4 9:4 7:4', '12:2 10:2 12:2 14:2 12:2 10:2 7:4', '13:2 10:2 13:2 15:2 13:2 10:2 8:4', '11:2 13:2 11:2 8:2 6:2 8:2 11:4', '7:2 4:2 2:2 0:2 7:8'] },
};
// ---- Sky Ruins: soaring, majestic, wide open ----
MUS_PIECES.r9 = {
  root: 246.9, mode: ION, bpm: 72, bl: 16, lead: 'horn', harm: 'strings', pad: 'choir', padVol: .014, rev: .8,
  perc: [[0, 'taiko', .12], [8, 'cym', .03]], percFrom: 1,
  acc: [{ k: 'arp', inst: 'harp', step: 2, pat: [0, 1, 2, 3, 4, 5, 4, 3], vol: .045 }],
  bass: { inst: 'cello', pat: [[0, 0, 15]], vol: .09 },
  A: { ch: '0 4 5 3 0 4 3 4', m: ['0:4 4:4 7:8', '8:6 6:2 4:4 6:4', '9:6 7:2 5:4 7:4', '10:8 9:4 7:4', '4:4 7:4 11:8', '13:6 11:2 8:4 6:4', '12:4 10:4 7:4 5:4', '6:8 8:8'] },
  B: { ch: '5 3 0 4 5 3 4 0', m: ['9:6 11:2 12:8', '10:6 12:2 14:8', '14:6 11:2 9:4 11:4', '13:8 11:4 8:4', '12:6 11:2 9:8', '10:6 12:2 14:4 12:4', '13:4 11:4 8:4 6:4', '7:12 r:4'] },
};
// ---- Crystal Spire: shimmering celesta over choir ----
MUS_PIECES.r10 = {
  root: 261.6, mode: AEO, bpm: 70, bl: 16, lead: 'celesta', harm: null, pad: 'choir', padVol: .016, rev: .85, perc: null,
  acc: [{ k: 'arp', inst: 'celesta', step: 4, pat: [2, 3, 4, 5, 4, 3], vol: .03 }],
  bass: { inst: 'cello', pat: [[0, 0, 15]], vol: .08 },
  A: { ch: '0 5 3 4 0 6 5 4', m: ['9:4 r:2 11:2 14:8', '12:6 11:2 9:4 7:4', '10:4 12:4 14:8', '13:6 11:2 8:8', '9:4 11:4 9:4 7:4', '13:4 10:4 8:8', '12:4 9:4 7:4 5:4', '11:12 r:4'] },
  B: { ch: '3 6 0 5 3 6 4 0', m: ['14:4 12:4 10:4 12:4', '13:6 15:2 13:8', '11:4 14:4 16:8', '12:6 14:2 12:8', '10:4 12:4 14:8', '15:4 13:4 10:8', '13:6 11:2 8:4 6:4', '7:16'] },
};
// ---- The Hollow Void: slow, dissonant, vast ----
MUS_PIECES.r11 = {
  root: 196, mode: PHR, bpm: 56, bl: 16, lead: 'choir', harm: null, pad: 'choir', padVol: .018, rev: .9,
  perc: [[0, 'taiko', .2], [8, 'taiko', .1]], percFrom: 0,
  acc: [{ k: 'arp', inst: 'bell', step: 8, pat: [4, 2, 5, 3], vol: .03 }],
  bass: { inst: 'cello', pat: [[0, 0, 15]], vol: .1 },
  A: { ch: '0 1 0 1 6 1 5 0', m: ['11:12 10:4', '8:8 10:8', '9:12 7:4', '8:16', '13:8 10:8', '12:8 8:8', '12:8 9:4 7:4', '7:16'] },
  B: { ch: '3 0 1 6 3 1 0 0', m: ['10:8 12:4 14:4', '11:12 9:4', '12:8 10:8', '13:12 r:4', '14:8 12:4 10:4', '8:8 12:8', '11:8 9:4 7:4', '7:12 r:4'] },
};
// ---- The Abyss: relentless descent ----
{
  const riff = '@7:2 @7:2 @9:4 @7:2 @11:2 @9:4', riff2 = '@9:4 @11:4 @14:4 @11:4';
  MUS_PIECES.abyss = {
    root: 207.7, mode: AEO, bpm: 100, bl: 16, lead: 'horn', lo: -1, harm: 'strings', pad: 'strings', padVol: .014, rev: .55,
    perc: [[0, 'taiko', .24], [6, 'taiko', .12], [8, 'taiko', .18], [14, 'taiko', .1]], percFrom: 0,
    acc: [{ k: 'pulse', inst: 'cello', step: 2, pat: [0, 0, 0, 4, 0, 0, 2, 0], vol: .06 }],
    bass: { inst: 'pluck', pat: [[0, 0, 7], [8, 0, 7]], vol: .1 },
    A: { ch: '0 0 5 6 0 0 3 4', m: [riff, riff, riff, riff, riff, riff, riff, '@7:8 @4:4 r:4'] },
    B: { ch: '5 6 0 0 5 6 4 0', m: [riff2, riff2, riff2, riff2, riff2, riff2, riff2, '@14:8 @11:4 r:4'] },
  };
}
// ---- Guardians: epic battle ----
MUS_PIECES.boss = {
  root: 220, mode: AEO, bpm: 136, bl: 16, lead: 'horn', harm: 'strings', pad: 'strings', padVol: .015, rev: .4,
  perc: [[0, 'taiko', .28], [4, 'snare', .09], [8, 'taiko', .22], [12, 'snare', .1], [14, 'taiko', .12], [2, 'shaker', .04], [6, 'shaker', .04], [10, 'shaker', .04]], percFrom: 0,
  acc: [{ k: 'pulse', inst: 'pizz', step: 1, pat: [0, 0, 4, 0, 0, 4, 0, 4, 0, 0, 4, 0, 0, 4, 2, 4], vol: .045 }],
  bass: { inst: 'pluck', pat: [[0, 0, 3], [4, 0, 3], [8, 0, 3], [12, 0, 3]], vol: .1 },
  A: { ch: '0 0 5 6 0 5 6 4', m: ['7:4 7:2 9:2 11:4 9:4', '7:4 7:2 9:2 11:2 12:2 11:4', '12:4 12:2 14:2 12:4 9:4', '13:4 13:2 15:2 13:4 10:4', '14:6 12:2 11:4 9:4', '12:6 11:2 9:4 7:4', '13:4 10:4 8:4 10:4', '11:8 8:4 r:4'] },
  B: { ch: '3 5 6 0 3 5 4 4', m: ['10:4 12:4 14:4 12:4', '12:4 14:4 16:4 14:4', '13:4 15:4 13:8', '14:6 11:2 9:4 7:4', '10:2 10:2 12:4 14:4 12:4', '12:2 12:2 14:4 16:4 14:4', '11:4 13:4 15:4 13:4', '11:12 r:4'] },
};
MUS_PIECES.trial = { ...MUS_PIECES.boss, mode: DOR, root: 246.9, bpm: 128 };

// theme key -> piece
for (const k of Object.keys(THEMES)) delete THEMES[k];
for (const k of Object.keys(MUS_PIECES)) THEMES[k] = { piece: k };

// ---------- parsing ----------
const MUS_WARN = [];
function musParseChord(tok) { const m = /^(\d+)([79s]*)$/.exec(tok); if (!m) throw new Error('bad chord ' + tok); return { r: +m[1], x: m[2] }; }
function musParseSec(sec, bl, key, nm) {
  const chs = sec.ch.split(/\s+/).map(t => t.split('/').map(musParseChord));
  return sec.m.map((b, i) => {
    const chords = chs[i]; let s = 0; const notes = [];
    for (const tk of b.split(/\s+/)) {
      const m = /^(@?)(-?\d+|r):(\d+)(\.?)$/.exec(tk); if (!m) throw new Error('bad token ' + tk + ' in ' + key);
      const len = +m[3]; if (m[2] !== 'r') { let d = +m[2]; if (m[1]) d += chords[0].r; notes.push({ s, d, len, st: !!m[4] }); } s += len;
    }
    if (s !== bl) MUS_WARN.push(`${key} ${nm} bar ${i + 1}: ${s} != ${bl}`);
    return { chords, notes };
  });
}
for (const k in MUS_PIECES) { const p = MUS_PIECES[k]; p.secs = [musParseSec(p.A, p.bl, k, 'A'), musParseSec(p.B, p.bl, k, 'B')]; }
