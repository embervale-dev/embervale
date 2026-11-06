// ================= MUSIC v2: composed fantasy-medieval tunes =================
// Replaces the old random-arpeggio ambience with real looping melodies:
// lute arpeggios + flute lead + warm bass + soft strings + light hand percussion.
// Tunes are written in scale degrees (0 = tonic, 7 = octave up) so any key/mode can play them.
// One bar = 8 eighth-note slots. Tokens: number = new note, '-' = hold, '.' = rest.
const TUNE_SRC = {
  // Heroic, soaring adventure theme (I V vi IV ...)
  HERO: [
    { ch: [0, 4, 5, 3, 0, 4, 3, 4], mel: ['4 - 4 5 7 - 6 5', '6 - 7 8 8 - 7 6', '7 - 7 8 9 - 8 7', '5 - 5 6 7 - 6 5', '7 - 7 9 11 - 9 7', '8 - 8 9 8 - 6 4', '5 - 5 7 7 - 5 3', '4 - 5 6 6 - 4 .'] },
    { ch: [5, 3, 0, 4, 5, 3, 0, 4], mel: ['9 - 9 8 7 - 9 -', '7 - 7 6 5 - 7 -', '4 - 5 7 9 - 7 4', '6 - 8 - 11 - 8 6', '9 - 11 - 12 - 11 9', '10 - 9 7 7 - 5 .', '7 - 4 5 7 - 9 11', '11 - 9 8 6 - 8 .'] },
  ],
  // Bouncy tavern / village folk tune
  FOLK: [
    { ch: [0, 3, 0, 4, 0, 3, 4, 0], mel: ['4 5 7 . 7 5 4 2', '3 4 5 . 7 5 3 .', '4 5 7 . 9 7 9 11', '8 . 6 7 4 . . .', '4 5 7 . 7 5 4 2', '3 4 5 . 7 9 7 5', '6 . 8 . 6 7 8 9', '7 - - - 4 5 7 .'] },
    { ch: [5, 3, 0, 4, 5, 3, 4, 0], mel: ['9 . 9 8 7 . 9 .', '7 . 7 6 5 . 7 .', '4 5 7 . 9 . 7 .', '8 . 6 . 4 6 8 .', '9 . 9 11 12 . 11 9', '10 . 9 7 7 . 5 .', '6 . 8 . 11 . 9 8', '7 - 4 5 7 - - -'] },
  ],
  // Rolling 3+3+2 travelling theme, a little more medieval in rhythm
  QUEST: [
    { ch: [0, 5, 3, 4, 0, 5, 4, 0], mel: ['4 - - 7 - - 9 -', '9 - - 8 - - 7 -', '7 - - 5 - - 7 8', '8 - - 6 - - 4 -', '7 - - 9 - - 11 -', '12 - - 11 - - 9 -', '8 - - 6 - - 8 -', '7 - - - 4 5 7 .'] },
    { ch: [3, 0, 4, 5, 3, 0, 4, 4], mel: ['7 - - 7 - - 10 -', '9 - - 7 - - 4 -', '8 - - 8 - - 11 -', '9 - - 7 - - 9 -', '10 - - 9 - - 7 -', '7 - - 9 - - 11 -', '11 - - 8 - - 6 -', '8 - 6 . 4 . 6 8'] },
  ],
  // Driving minor-key march for danger, bosses and trials (still tuneful)
  MARCH: [
    { ch: [0, 5, 6, 0, 0, 5, 6, 4], mel: ['7 . 7 8 7 . 5 4', '9 . 9 10 9 . 7 5', '8 . 8 9 10 . 8 6', '7 . 4 . 7 . 9 11', '11 . 11 12 11 . 9 7', '12 . 12 11 9 . 7 9', '10 . 10 9 8 . 6 8', '8 . 6 . 4 . 6 .'] },
    { ch: [5, 6, 0, 4, 5, 6, 0, 4], mel: ['12 - - 11 - - 9 -', '10 - - 9 - - 8 -', '7 - 9 - 11 - 9 7', '8 - 6 - 4 - 6 8', '12 - - 14 - - 12 -', '13 - - 12 - - 10 -', '11 - 9 - 7 - 9 11', '8 . 8 . 6 . 4 .'] },
  ],
};
const TUNES = {};
for (const k in TUNE_SRC) TUNES[k] = TUNE_SRC[k].map(sec => ({
  ch: sec.ch,
  bars: sec.mel.map(b => { const out = []; let cur = null; b.split(' ').forEach((x, i) => { if (x === '-') { if (cur) cur.len++; } else if (x === '.') cur = null; else { cur = { s: i, d: +x, len: 1 }; out.push(cur); } }); return out; }),
}));

// per-theme: tune, key (Hz), mode, tempo (quarter-note bpm), percussion level 0-3
const MD_ION = ION, MD_MIX = MIX, MD_DOR = DOR, MD_AEO = AEO;
for (const k of Object.keys(THEMES)) delete THEMES[k];
Object.assign(THEMES, {
  title:  { tune: 'HERO',  root: 220,   mode: MD_AEO, bpm: 60,  perc: 0, lp: 2400 },  // the fading flame: wistful, hopeful
  town:   { tune: 'FOLK',  root: 261.6, mode: MD_ION, bpm: 84,  perc: 0, lp: 3000 },  // Haven: warm hearth
  r0:  { tune: 'HERO',  root: 246.9, mode: MD_DOR, bpm: 72,  perc: 0, lp: 2600 },     // Whispering Woods
  r1:  { tune: 'QUEST', root: 196,   mode: MD_AEO, bpm: 58,  perc: 0, lp: 1800 },     // Sunken Crypt
  r2:  { tune: 'QUEST', root: 233.1, mode: MD_AEO, bpm: 76,  perc: 1, lp: 2400 },     // Ashen Dunes
  r3:  { tune: 'MARCH', root: 207.7, mode: MD_AEO, bpm: 60,  perc: 0, lp: 1700 },     // Bloodmoon Marsh
  r4:  { tune: 'HERO',  root: 246.9, mode: MD_AEO, bpm: 64,  perc: 0, lp: 2800 },     // Frostpeak Hollows
  r5:  { tune: 'QUEST', root: 233.1, mode: MD_DOR, bpm: 64,  perc: 0, lp: 1900 },     // Fungal Depths
  r6:  { tune: 'HERO',  root: 277.2, mode: MD_ION, bpm: 68,  perc: 0, lp: 2400 },     // Coral Grotto
  r7:  { tune: 'MARCH', root: 220,   mode: MD_DOR, bpm: 92,  perc: 2, lp: 2400 },     // Molten Forge
  r8:  { tune: 'QUEST', root: 246.9, mode: MD_DOR, bpm: 96,  perc: 1, lp: 2600 },     // Clockwork Halls
  r9:  { tune: 'HERO',  root: 293.7, mode: MD_ION, bpm: 70,  perc: 0, lp: 3000 },     // Sky Ruins
  r10: { tune: 'QUEST', root: 261.6, mode: MD_AEO, bpm: 64,  perc: 0, lp: 2600 },     // Crystal Spire
  r11: { tune: 'MARCH', root: 196,   mode: MD_AEO, bpm: 56,  perc: 0, lp: 1500 },     // The Hollow Void
  abyss: { tune: 'MARCH', root: 207.7, mode: MD_AEO, bpm: 80, perc: 1, lp: 1900 },
  boss:  { tune: 'MARCH', root: 220,   mode: MD_AEO, bpm: 108, perc: 3, lp: 2600 },
  trial: { tune: 'MARCH', root: 246.9, mode: MD_DOR, bpm: 100, perc: 2, lp: 2600 },
});

// ---------- instruments ----------
function mlead(f, t, dur, vol) {   // breathy flute with gentle vibrato
  const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter(), lfo = AC.createOscillator(), lg = AC.createGain();
  o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 3600;
  lfo.frequency.value = 5.2; lg.gain.value = f * .005; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  const g2 = AC.createGain(); g2.gain.value = .3; o2.connect(g2);
  const end = t + Math.max(.12, dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .035); g.gain.setTargetAtTime(vol * .72, t + .06, .15); g.gain.setTargetAtTime(0, end - .05, .05);
  o.connect(fl); g2.connect(fl); fl.connect(g); g.connect(MUS.gain);
  o.start(t); o2.start(t); lfo.start(t); o.stop(end + .3); o2.stop(end + .3); lfo.stop(end + .3);
}
function mlute(f, t, dur, vol) {   // plucked string
  const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
  o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.002;
  const g2 = AC.createGain(); g2.gain.value = .25; o2.connect(g2);
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(2800, t); fl.frequency.exponentialRampToValueAtTime(450, t + .35);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(fl); g2.connect(fl); fl.connect(g); g.connect(MUS.gain); o.start(t); o2.start(t); o.stop(t + dur + .05); o2.stop(t + dur + .05);
}
function mbass(f, t, dur, vol) {
  const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 520;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(fl); fl.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + dur + .05);
}
function mpad(f, t, dur, vol, lp) {  // soft strings
  const g = AC.createGain(), fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = Math.min(lp, 1100);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .5); g.gain.setTargetAtTime(0, t + dur - .3, .25);
  fl.connect(g); g.connect(MUS.gain);
  for (const dt of [-7, 7]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; o.connect(fl); o.start(t); o.stop(t + dur + 1.2); }
}
function mperc(kind, t, vol) {
  if (kind === 'kick') { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + .14); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + .22); return; }
  if (!noiseBuf) return;
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(), g = AC.createGain();
  const hat = kind === 'hat'; f.type = hat ? 'highpass' : 'bandpass'; f.frequency.value = hat ? 7500 : 1500; if (!hat) f.Q.value = .8;
  const d = hat ? .045 : .13; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(f); f.connect(g); g.connect(MUS.gain); s.start(t, Math.random() * .5); s.stop(t + d + .02);
}

const LUTE_ARP = [0, 4, 7, 4, 9, 4, 7, 4];   // rolling root-fifth-octave-third pattern, in chord-degree offsets

musicTick = function () {
  if (!AC || AC.state !== 'running') return;
  if (!MUS.gain) { MUS.gain = AC.createGain(); MUS.gain.gain.value = 0; MUS.gain.connect(AC.destination); MUS.next = AC.currentTime + .1;
    const dl = AC.createDelay(1.5), fb = AC.createGain(), wet = AC.createGain(), lpf = AC.createBiquadFilter();   // soft hall-like echo
    dl.delayTime.value = .44; fb.gain.value = .4; wet.gain.value = .32; lpf.type = 'lowpass'; lpf.frequency.value = 1700;
    MUS.gain.connect(dl); dl.connect(lpf); lpf.connect(fb); fb.connect(dl); lpf.connect(wet); wet.connect(AC.destination); }
  const want = wantTheme();
  if (want !== MUS.theme) { MUS.gain.gain.cancelScheduledValues(AC.currentTime); MUS.gain.gain.setTargetAtTime(0, AC.currentTime, .25); if (!MUS.pend || MUS.pend.k !== want) MUS.pend = { k: want, at: AC.currentTime + .9 }; }
  if (MUS.pend && AC.currentTime >= MUS.pend.at) { MUS.theme = MUS.pend.k; MUS.pend = null; MUS.step = 0; MUS.next = AC.currentTime + .05; MUS.gain.gain.setTargetAtTime(musicVol() * .55, AC.currentTime, .6); }
  const T = THEMES[MUS.theme]; if (!T || MUS.pend) return;
  const tune = TUNES[T.tune], e8 = 30 / T.bpm, md = T.mode, L = md.length;
  const sc = (deg, oct = 0) => T.root * Math.pow(2, (md[((deg % L) + L) % L] + 12 * (oct + Math.floor(deg / L))) / 12);
  while (MUS.next < AC.currentTime + .25) {
    const s = MUS.step, t = MUS.next, pos = s % 8, bar = Math.floor(s / 8) % 8, secI = Math.floor(s / 64) % 2, sec = tune[secI], ch = sec.ch[bar];
    // strings: one soft chord per bar
    if (pos === 0) for (const k of [0, 2, 4]) mpad(sc(ch + k, -1), t, e8 * 8, .026, T.lp);
    // bass on beats 1 and 3 (root, then fifth)
    if (pos === 0) mbass(sc(ch, -2), t, e8 * 3.6, .16);
    if (pos === 4) mbass(sc(ch + 4, -2), t, e8 * 3, .12);
    // lute arpeggio
    mlute(sc(ch + LUTE_ARP[pos], -1), t, e8 * 2.6, pos % 4 === 0 ? .075 : .055);
    // flute melody (+ harmony a third below in the B section)
    for (const n of sec.bars[bar]) if (n.s === pos) {
      mlead(sc(n.d, 0), t, e8 * n.len * .96, .09);
      if (secI === 1) mlead(sc(n.d - 2, 0), t, e8 * n.len * .96, .045);
    }
    // hand percussion
    const p = T.perc;
    if (p >= 1) {
      if (pos === 0) mperc('kick', t, p === 1 ? .16 : .22);
      if (p >= 2 && pos === 4) mperc('kick', t, .2);
      if (p >= 3 && pos === 7 && bar % 2 === 1) mperc('kick', t, .16);
      if (p >= 2 && (pos === 2 || pos === 6)) mperc('snare', t, .07);
      if (p === 1 && (pos === 3 || pos === 7)) mperc('hat', t, .025);
      if (p >= 2 && pos % 2 === 1) mperc('hat', t, .035);
    }
    MUS.step++; MUS.next += e8;
  }
};
