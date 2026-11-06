// ================= MUSIC ENGINE v3 =================
// Plays the compositions in 6s_scores.js: lead melody, a second voice on the repeat, pad, bass line,
// accompaniment (arpeggio / strum / pulse), percussion and a lush convolution reverb.
// Everything is synthesised with Web Audio; no audio files.

// ---------- reverb + buses ----------
function musMakeIR(sec) {
  const sr = AC.sampleRate, n = Math.floor(sr * sec), b = AC.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let lp = 0;
    for (let i = 0; i < n; i++) { const t = i / n; lp += ((Math.random() * 2 - 1) - lp) * (.25 + .6 * (1 - t)); d[i] = lp * Math.pow(1 - t, 2.4) * Math.exp(-t * 1.6) * (i < sr * .02 ? i / (sr * .02) : 1); }
  }
  return b;
}
function musInit() {
  // voices -> MUS.gain (volume / ducking) -> makeup gain -> compressor -> out; reverb is a parallel send
  MUS.gain = AC.createGain(); MUS.gain.gain.value = 0;
  const boost = AC.createGain(), comp = AC.createDynamicsCompressor();
  boost.gain.value = 3.4; comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .01; comp.release.value = .25;
  MUS.gain.connect(boost); boost.connect(comp); comp.connect(AC.destination);
  try {
    const conv = AC.createConvolver(); conv.buffer = musMakeIR(2.8); MUS.wet = AC.createGain(); MUS.wet.gain.value = .3;
    boost.connect(conv); conv.connect(MUS.wet); MUS.wet.connect(comp);
  } catch (e) { MUS.wet = null; }
  MUS.next = AC.currentTime + .1;
}

// ---------- instruments (f = Hz, t = start, d = duration, v = volume) ----------
function muEnv(g, t, a, v, d, r) { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setTargetAtTime(v * .78, t + a, .25); g.gain.setTargetAtTime(0, t + d, r); }
function muOsc(type, f, t, end, det) { const o = AC.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.start(t); o.stop(end); return o; }
function muVib(o, f, t, rate, depth, delay) { const l = AC.createOscillator(), g = AC.createGain(); l.frequency.value = rate; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(f * depth, t + delay + .35); l.connect(g); g.connect(o.frequency); l.start(t); l.stop(t + 12); }
function muFilt(type, f, q) { const x = AC.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; }
function muBreath(t, f, v) { if (!noiseBuf) return; const s = AC.createBufferSource(), x = muFilt('bandpass', f * 3, 2), g = AC.createGain(); s.buffer = noiseBuf; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0005, t + .12); s.connect(x); x.connect(g); g.connect(MUS.gain); s.start(t, Math.random() * .5); s.stop(t + .15); }
const MUI = {
  flute(f, t, d, v) { const e = t + d + .5, g = AC.createGain(), x = muFilt('lowpass', 3400), a = muOsc('sine', f, t, e), b = muOsc('triangle', f, t, e), bg = AC.createGain(); bg.gain.value = .22; muVib(a, f, t, 5.3, .004, .1); a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); muEnv(g, t, .05, v, d, .09); muBreath(t, f, v * .35); },
  whistle(f, t, d, v) { const e = t + d + .4, g = AC.createGain(), x = muFilt('lowpass', 4200), a = muOsc('sine', f, t, e), b = muOsc('sine', f * 2, t, e), bg = AC.createGain(); bg.gain.value = .12; muVib(a, f, t, 5.8, .003, .15); a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); muEnv(g, t, .03, v * .9, d, .06); muBreath(t, f, v * .3); },
  clarinet(f, t, d, v) { const e = t + d + .5, g = AC.createGain(), x = muFilt('lowpass', 1500), a = muOsc('square', f, t, e), b = muOsc('triangle', f, t, e), bg = AC.createGain(); bg.gain.value = .5; muVib(a, f, t, 4.8, .003, .2); a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); muEnv(g, t, .06, v * .8, d, .1); },
  reed(f, t, d, v) { const e = t + d + .5, g = AC.createGain(), x = muFilt('bandpass', 1300, 1.2), x2 = muFilt('lowpass', 2800), a = muOsc('sawtooth', f, t, e), b = muOsc('square', f * 1.003, t, e), bg = AC.createGain(); bg.gain.value = .4; muVib(a, f, t, 5.5, .005, .12); a.connect(x2); b.connect(bg); bg.connect(x2); x2.connect(x); x.connect(g); g.connect(MUS.gain); muEnv(g, t, .04, v * 1.6, d, .1); },
  horn(f, t, d, v) { const e = t + d + .6, g = AC.createGain(), x = muFilt('lowpass', 1150), a = muOsc('sawtooth', f, t, e), b = muOsc('sine', f, t, e); const bg = AC.createGain(); bg.gain.value = .7; muVib(a, f, t, 4.6, .002, .3); a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); muEnv(g, t, .11, v * 1.1, d, .16); },
  strings(f, t, d, v) { const e = t + d + .8, g = AC.createGain(), x = muFilt('lowpass', 2000); for (const dt of [-8, 0, 8]) { const o = muOsc('sawtooth', f, t, e, dt); muVib(o, f, t, 5, .002, .25); const og = AC.createGain(); og.gain.value = .34; o.connect(og); og.connect(x); } x.connect(g); g.connect(MUS.gain); muEnv(g, t, .16, v * .8, d, .2); },
  choir(f, t, d, v) { const e = t + d + 1.2, g = AC.createGain(), f1 = muFilt('bandpass', 750, 3), f2 = muFilt('bandpass', 1150, 4), s = AC.createGain(); for (const dt of [-10, 0, 10]) { const o = muOsc('sawtooth', f, t, e, dt); muVib(o, f, t, 4.6, .003, .4); o.connect(f1); o.connect(f2); } f1.connect(s); f2.connect(s); s.gain.value = 1.8; s.connect(g); g.connect(MUS.gain); muEnv(g, t, .35, v, d, .45); },
  celesta(f, t, d, v) { const e = t + 1.6, g = AC.createGain(); for (const [m, a] of [[1, 1], [4, .28], [9.2, .08]]) { const o = muOsc('sine', f * m, t, e), og = AC.createGain(); og.gain.value = a; o.connect(og); og.connect(g); } g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v * .9, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + 1.5); },
  musicbox(f, t, d, v) { const e = t + 1.1, g = AC.createGain(); for (const [m, a] of [[1, 1], [3, .22], [5.9, .06]]) { const o = muOsc('sine', f * m, t, e), og = AC.createGain(); og.gain.value = a; o.connect(og); og.connect(g); } g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .003); g.gain.exponentialRampToValueAtTime(.0005, t + 1); },
  bell(f, t, d, v) { const e = t + 2.4, g = AC.createGain(); for (const [m, a] of [[1, 1], [2.76, .4], [5.4, .15]]) { const o = muOsc('sine', f * m, t, e), og = AC.createGain(); og.gain.value = a; o.connect(og); og.connect(g); } g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.0005, t + 2.2); },
  marimba(f, t, d, v) { const e = t + .6, g = AC.createGain(), x = muFilt('lowpass', 2600); for (const [m, a] of [[1, 1], [4, .18]]) { const o = muOsc('sine', f * m, t, e), og = AC.createGain(); og.gain.value = a; o.connect(og); og.connect(x); } x.connect(g); g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v * 1.3, t + .003); g.gain.exponentialRampToValueAtTime(.0005, t + .45); },
  harp(f, t, d, v) { const e = t + 1.6, g = AC.createGain(), x = muFilt('lowpass', 3200); for (const [m, a] of [[1, 1], [2, .3], [3, .12]]) { const o = muOsc(m === 1 ? 'triangle' : 'sine', f * m, t, e), og = AC.createGain(); og.gain.value = a; o.connect(og); og.connect(x); } x.connect(g); g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + 1.4); },
  lute(f, t, d, v) { const e = t + .9, g = AC.createGain(), x = muFilt('lowpass', 1), a = muOsc('triangle', f, t, e), b = muOsc('sawtooth', f, t, e), bg = AC.createGain(); bg.gain.value = .3; x.frequency.setValueAtTime(3000, t); x.frequency.exponentialRampToValueAtTime(500, t + .4); a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + .8); },
  pizz(f, t, d, v) { const e = t + .4, g = AC.createGain(), x = muFilt('lowpass', 1800), a = muOsc('triangle', f, t, e), b = muOsc('sine', f * 2, t, e), bg = AC.createGain(); bg.gain.value = .3; a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .003); g.gain.exponentialRampToValueAtTime(.0005, t + .3); },
  pluck(f, t, d, v) { const e = t + d + .3, g = AC.createGain(), x = muFilt('lowpass', 520), a = muOsc('triangle', f, t, e), b = muOsc('sawtooth', f, t, e), bg = AC.createGain(); bg.gain.value = .35; a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0005, t + Math.max(.3, d)); },
  cello(f, t, d, v) { const e = t + d + .5, g = AC.createGain(), x = muFilt('lowpass', 700), a = muOsc('sawtooth', f, t, e), b = muOsc('triangle', f, t, e), bg = AC.createGain(); bg.gain.value = .6; muVib(a, f, t, 4.4, .0025, .3); a.connect(x); b.connect(bg); bg.connect(x); x.connect(g); g.connect(MUS.gain); muEnv(g, t, .09, v * .9, d, .14); },
};
function muPad(inst, f, t, d, v, lp) {   // sustained chord tone
  const e = t + d + 1.4, g = AC.createGain(), x = muFilt('lowpass', Math.min(lp || 1000, 1100));
  if (inst === 'choir') { const f1 = muFilt('bandpass', 700, 2.5), f2 = muFilt('bandpass', 1100, 3), s = AC.createGain(); for (const dt of [-9, 9]) { const o = muOsc('sawtooth', f, t, e, dt); o.connect(f1); o.connect(f2); } f1.connect(s); f2.connect(s); s.gain.value = 1.7; s.connect(g); }
  else { for (const dt of [-7, 7]) { const o = muOsc('sawtooth', f, t, e, dt); o.connect(x); } x.connect(g); }
  g.connect(MUS.gain); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .7); g.gain.setTargetAtTime(0, t + d - .1, .45);
}

// ---------- percussion ----------
function muDrum(kind, t, v) {
  const nz = (type, fq, q, d, vol, dt = 0) => { if (!noiseBuf) return; const s = AC.createBufferSource(), x = muFilt(type, fq, q), g = AC.createGain(); s.buffer = noiseBuf; g.gain.setValueAtTime(vol, t + dt); g.gain.exponentialRampToValueAtTime(.0005, t + dt + d); s.connect(x); x.connect(g); g.connect(MUS.gain); s.start(t + dt, Math.random() * .5); s.stop(t + dt + d + .02); };
  const sn = (f0, f1, d, vol, type = 'sine') => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0005, t + d); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + d + .03); };
  switch (kind) {
    case 'kick': sn(120, 42, .2, v); break;
    case 'tom': sn(150, 85, .22, v); nz('lowpass', 900, .7, .06, v * .5); break;
    case 'taiko': sn(95, 44, .55, v * 1.2); sn(190, 80, .25, v * .35, 'triangle'); nz('lowpass', 700, .7, .12, v * .6); break;
    case 'snare': nz('bandpass', 1900, .8, .13, v); sn(210, 140, .08, v * .4, 'triangle'); break;
    case 'tamb': nz('highpass', 6500, .7, .09, v); nz('bandpass', 8500, 3, .06, v * .6, .02); break;
    case 'shaker': nz('highpass', 7500, .7, .06, v); break;
    case 'wood': sn(1050, 760, .05, v); nz('bandpass', 2500, 2, .03, v * .4); break;
    case 'tick': nz('bandpass', 4200, 3, .02, v); break;
    case 'anvil': for (const [m, a] of [[1, 1], [1.58, .6], [2.4, .35]]) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 560 * m; g.gain.setValueAtTime(v * a, t); g.gain.exponentialRampToValueAtTime(.0005, t + .55); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + .6); } nz('highpass', 3000, .7, .04, v); break;
    case 'cym': nz('highpass', 5000, .6, 1.4, v); break;
  }
}

// ---------- scheduler ----------
function musTheme(key) {
  const T = THEMES[key]; return T && MUS_PIECES[T.piece];
}
function wantTheme() {
  if (G.mode === 'title' || !S) return 'title';
  if (G.inTown || G.tutorial) return 'town';
  if (G.trial) return 'trial';
  if (G.boss) return 'boss';
  if (G.abyss) return 'abyss';
  return 'r' + G.region;
}
musicTick = function () {
  if (!AC || AC.state !== 'running') return;
  if (!MUS.gain) musInit();
  const want = wantTheme();
  if (want !== MUS.theme) { MUS.gain.gain.cancelScheduledValues(AC.currentTime); MUS.gain.gain.setTargetAtTime(0, AC.currentTime, .3); if (!MUS.pend || MUS.pend.k !== want) MUS.pend = { k: want, at: AC.currentTime + 1.1 }; }
  if (MUS.pend && AC.currentTime >= MUS.pend.at) {
    MUS.theme = MUS.pend.k; MUS.pend = null; MUS.step = 0; MUS.next = AC.currentTime + .08;
    MUS.gain.gain.setTargetAtTime(musicVol() * .55, AC.currentTime, .7);
    const P0 = musTheme(MUS.theme); if (MUS.wet && P0) MUS.wet.gain.setTargetAtTime(P0.rev, AC.currentTime, .3);
  }
  const P = musTheme(MUS.theme); if (!P || MUS.pend) return;
  const bl = P.bl, e16 = 15 / P.bpm, md = P.mode, L = md.length, loopBars = 16;
  const sc = (deg, oct = 0) => P.root * Math.pow(2, (md[((deg % L) + L) % L] + 12 * (oct + Math.floor(deg / L))) / 12);
  while (MUS.next < AC.currentTime + .3) {
    const s = MUS.step, t = MUS.next, pos = s % bl, barG = Math.floor(s / bl), bi = barG % loopBars, pass = Math.floor(barG / loopBars);
    const sec = P.secs[Math.floor(bi / 8)], bar = sec.bars ? sec.bars[bi % 8] : sec[bi % 8];
    const ch = bar.chords, seg = ch.length === 2 && pos >= bl / 2 ? 1 : 0, c = ch[seg], root = c.r;
    const segStart = seg ? bl / 2 : 0, segLen = (ch.length === 2 ? bl / 2 : bl) * e16;
    const tones = [root, root + 2, root + 4, root + 7, root + 9, root + 11];
    if (c.x.includes('s')) tones[1] = root + 1;
    const second = pass % 2 === 1, hum = (Math.random() - .5) * .008;
    // pad: one soft chord per chord segment
    if (pos === segStart && P.pad) { const pv = P.padVol || .018; for (const k of [0, 1, 2]) muPad(P.pad, sc(tones[k], -1), t, segLen, pv, 900); if (c.x.includes('7')) muPad(P.pad, sc(root + 6, -1), t, segLen, pv * .7, 900); }
    // bass line
    if (P.bass) for (const [bp, off, ln] of P.bass.pat) if (bp === pos) (MUI[P.bass.inst] || MUI.pluck)(sc(root + off, -2), t, ln * e16, P.bass.vol || .09);
    // accompaniment
    for (const a of P.acc || []) {
      if (a.k === 'arp' || a.k === 'pulse') { if (pos % a.step === 0) { const i = pos / a.step, ti = a.pat[i % a.pat.length], acc = pos % 8 === 0 ? 1.15 : 1, deg = a.k === 'pulse' ? root + ti : tones[ti % tones.length]; (MUI[a.inst] || MUI.harp)(sc(deg, -1), t + hum, e16 * a.step * 1.8, a.vol * acc); } }
      else if (a.k === 'strum' && a.at.includes(pos)) { [0, 1, 2].forEach((k, j) => (MUI[a.inst] || MUI.lute)(sc(tones[k], -1), t + j * .018, e16 * 4, a.vol)); }
    }
    // melody
    for (const n of bar.notes) if (n.s === pos) {
      const strong = pos % 4 === 0 ? 1.08 : .94, d = n.len * e16 * (n.st ? .5 : .95), f = sc(n.d, P.lo || 0), v = .105 * strong * (.92 + Math.random() * .16);
      const li = MUI[P.lead] || MUI.flute; li(f, t + hum, d, v);
      if (second && P.harm && Math.floor(bi / 8) === 1) (MUI[P.harm] || MUI.strings)(sc(n.d - 2, P.lo || 0), t + hum, d, v * .5);
      if (second && !P.harm && Math.floor(bi / 8) === 1 && P.lead !== 'choir') li(f * 2, t + hum + .004, d, v * .22);
    }
    // percussion (enters on the second time round, or at once where the piece asks for it); combat adds a pulse
    const pf = P.percFrom === undefined ? 1 : P.percFrom;
    if (P.perc && pass >= pf) for (const [pp, kind, vol] of P.perc) if (pp === pos) muDrum(kind, t, vol);
    if (MUS.combat) {
      if (pos === 0) muDrum('taiko', t, .2); if (pos === Math.floor(bl / 2)) muDrum('tom', t, .13);
      if (!(P.perc && pass >= pf) && pos % 4 === 2) muDrum('shaker', t, .035);
    }
    MUS.step++; MUS.next += e16;
  }
};
