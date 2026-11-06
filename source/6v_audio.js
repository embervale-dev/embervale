// ================= AUDIO v2: richer SFX, per-region ambience, stingers, adaptive combat music =================
// Everything is synthesised with Web Audio (no files). Sound effects and ambience go through the SFX
// volume (master); music keeps its own slider. Ambience has its own slider in Settings.

// ---------- helpers ----------
function ensureNoise() {
  if (noiseBuf || !AC) return;
  noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = noiseBuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
}
let SENDBUS = null;
function sendBus() {   // small shared echo/room used for bells, sparkles and stingers
  if (SENDBUS) return SENDBUS;
  const inp = AC.createGain(), d1 = AC.createDelay(.6), d2 = AC.createDelay(.6), fb = AC.createGain(), lp = AC.createBiquadFilter(), out = AC.createGain();
  d1.delayTime.value = .11; d2.delayTime.value = .19; fb.gain.value = .36; lp.type = 'lowpass'; lp.frequency.value = 2600; out.gain.value = .55;
  inp.connect(d1); inp.connect(d2); d1.connect(lp); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(out); out.connect(master);
  return SENDBUS = inp;
}
// one oscillator voice: {f, d, type, v, slide, delay, lp, atk, wet, dest}
function vt(o) {
  const t = AC.currentTime + (o.delay || 0) + .001, osc = AC.createOscillator(), g = AC.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f + o.slide), t + o.d);
  let n = osc; if (o.lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); n = f; }
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(o.v || .1, t + (o.atk || .004)); g.gain.exponentialRampToValueAtTime(.0005, t + o.d);
  n.connect(g); g.connect(o.dest || master);
  if (o.wet) { const w = AC.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(sendBus()); }
  osc.start(t); osc.stop(t + o.d + .05);
}
// one filtered-noise voice: {d, v, f, type, q, slide(target freq), delay, atk, dest, wet}
function vn(o) {
  ensureNoise(); const t = AC.currentTime + (o.delay || 0) + .001, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = o.type || 'lowpass'; f.Q.value = o.q || .7; f.frequency.setValueAtTime(o.f, t);
  if (o.slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.slide), t + o.d);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(o.v || .1, t + (o.atk || .004)); g.gain.exponentialRampToValueAtTime(.0005, t + o.d);
  s.connect(f); f.connect(g); g.connect(o.dest || master);
  if (o.wet) { const w = AC.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(sendBus()); }
  s.start(t, Math.random() * .6); s.stop(t + o.d + .05);
}
function bell(f, delay = 0, v = .07, d = 1.1, dest) {   // inharmonic partials = struck metal
  vt({ f, d, v, delay, wet: .45, dest }); vt({ f: f * 2.76, d: d * .6, v: v * .35, delay, dest }); vt({ f: f * 5.4, d: d * .3, v: v * .15, delay, dest });
}
function timpani(delay = 0, v = .3, f = 95) { vt({ f, d: .5, v, slide: -45, delay, type: 'sine' }); vn({ d: .12, v: v * .5, f: 700, delay }); }
const jit = () => .9 + Math.random() * .2;
function duckMusic(sec, lvl) {
  if (!MUS || !MUS.gain || !AC || MUS.pend) return;
  const base = musicVol() * .55, t = AC.currentTime;
  MUS.gain.gain.cancelScheduledValues(t); MUS.gain.gain.setTargetAtTime(base * lvl, t, .08); MUS.gain.gain.setTargetAtTime(base, t + sec, .7);
}

// ---------- sound effects ----------
const STEP = { r0: 'grass', r1: 'stone', r2: 'sand', r3: 'mud', r4: 'snow', r5: 'mud', r6: 'wet', r7: 'metal', r8: 'metal', r9: 'stone', r10: 'crystal', r11: 'soft', town: 'stone', abyss: 'soft' };
const SFX2 = {
  swing() { const j = jit(); vn({ d: .12, v: .1, f: 3400 * j, type: 'bandpass', q: .9, slide: 1200 }); },
  shoot() { const j = jit(); vt({ f: 880 * j, d: .09, type: 'triangle', v: .07, slide: -480 }); vn({ d: .03, v: .05, f: 3000, type: 'highpass' }); },
  eshoot() { vt({ f: 420 * jit(), d: .07, type: 'square', v: .028, slide: -170, lp: 1500 }); },
  magic() { const j = jit(); vt({ f: 520 * j, d: .24, v: .08, slide: 520, wet: .3 }); vt({ f: 780 * j, d: .2, v: .04, slide: 600, delay: .03, type: 'triangle', wet: .3 }); vn({ d: .18, v: .03, f: 5000, type: 'highpass' }); },
  hit() { const j = jit(); vn({ d: .08, v: .16, f: 1900, slide: 500 }); vt({ f: 170 * j, d: .1, type: 'square', v: .05, slide: -80, lp: 900 }); },
  crit() { const j = jit(); vn({ d: .12, v: .2, f: 3200, slide: 700 }); vt({ f: 190 * j, d: .12, type: 'square', v: .06, slide: -90, lp: 1100 }); vt({ f: 1500 * j, d: .2, type: 'triangle', v: .05, slide: -300, delay: .01, wet: .35 }); },
  kill() { const j = jit(); vt({ f: 340 * j, d: .18, type: 'triangle', v: .09, slide: -220 }); vn({ d: .1, v: .07, f: 1200, slide: 300, delay: .02 }); },
  hurt() { vt({ f: 200 * jit(), d: .26, type: 'sawtooth', v: .12, slide: -110, lp: 800 }); vn({ d: .2, v: .16, f: 900, slide: 250 }); },
  dodge() { vn({ d: .16, v: .09, f: 1500, type: 'bandpass', q: .7, slide: 5200 }); },
  zap() { vt({ f: 1900 * jit(), d: .15, type: 'sawtooth', v: .05, slide: -1600, lp: 4000 }); vn({ d: .12, v: .05, f: 6000, type: 'highpass' }); },
  boom() { vt({ f: 120, d: .5, v: .3, slide: -85 }); vn({ d: .6, v: .3, f: 1400, slide: 120 }); vn({ d: .25, v: .1, f: 4000, type: 'highpass', delay: .02 }); },
  gold() { const j = jit(); vt({ f: 1500 * j, d: .09, v: .05, wet: .4 }); vt({ f: 2000 * j, d: .12, v: .045, delay: .05, wet: .4 }); },
  item() { vt({ f: 620, d: .12, type: 'triangle', v: .1 }); vt({ f: 930, d: .18, type: 'triangle', v: .08, delay: .07, wet: .25 }); },
  potion() { vt({ f: 280, d: .14, v: .1, slide: 260 }); vt({ f: 360, d: .16, v: .09, slide: 340, delay: .12 }); vt({ f: 520, d: .3, v: .05, delay: .26, wet: .35 }); },
  legend() { [523, 659, 784, 1046, 1319].forEach((f, i) => bell(f, i * .09, .09, 1.4)); vt({ f: 262, d: .9, type: 'sawtooth', v: .04, lp: 700, atk: .15, delay: .1, wet: .3 }); },
  lvl() { [392, 494, 587, 784].forEach((f, i) => vt({ f, d: .32, type: 'sawtooth', v: .06, lp: 1900, atk: .02, delay: i * .1, wet: .25 })); bell(1568, .42, .08, 1.3); },
  shrine() { [660, 880, 1100].forEach((f, i) => bell(f, i * .08, .06, 1.5)); },
  stairs() { [300, 400, 500, 700].forEach((f, i) => vt({ f, d: .26, v: .08, delay: i * .07, wet: .4 })); vn({ d: .5, v: .06, f: 400, slide: 3500, type: 'bandpass' }); },
  click() { vt({ f: 880, d: .04, type: 'square', v: .035, lp: 3000 }); },
  error() { vt({ f: 190, d: .09, type: 'square', v: .05, lp: 800 }); vt({ f: 140, d: .13, type: 'square', v: .05, lp: 800, delay: .09 }); },
  chest() { vt({ f: 150, d: .3, type: 'sawtooth', v: .05, slide: 130, lp: 450 }); vn({ d: .12, v: .08, f: 900, delay: .28 }); [880, 1320, 1760].forEach((f, i) => bell(f, .32 + i * .07, .05, .9)); },
  open() { vn({ d: .1, v: .04, f: 900, type: 'bandpass', slide: 2600 }); vt({ f: 500, d: .1, v: .03, slide: 250 }); },
  close() { vn({ d: .1, v: .035, f: 2600, type: 'bandpass', slide: 800 }); vt({ f: 700, d: .1, v: .03, slide: -250 }); },
  tick() { vt({ f: 1500, d: .025, v: .018, lp: 4000 }); },
  step() {
    if (!(S && G.mode === 'play')) return;
    const k = STEP[G.inTown ? 'town' : G.abyss ? 'abyss' : 'r' + G.region] || 'stone', j = jit();
    switch (k) {
      case 'grass': vn({ d: .08, v: .03, f: 3200 * j, type: 'bandpass', q: .8 }); break;
      case 'sand': vn({ d: .1, v: .03, f: 2400 * j, type: 'highpass' }); break;
      case 'snow': vn({ d: .07, v: .04, f: 4200 * j, type: 'bandpass', q: 1.2 }); vn({ d: .05, v: .03, f: 3600, type: 'bandpass', q: 1.2, delay: .045 }); break;
      case 'mud': vn({ d: .1, v: .04, f: 500 * j }); vt({ f: 170 * j, d: .09, v: .02, slide: -60 }); break;
      case 'wet': vn({ d: .07, v: .03, f: 1500 * j }); vt({ f: 520 * j, d: .05, v: .012, slide: -200 }); break;
      case 'metal': vn({ d: .05, v: .03, f: 2000 * j }); vt({ f: 700 * j, d: .12, v: .012, wet: .1 }); break;
      case 'crystal': vn({ d: .05, v: .025, f: 3000 * j, type: 'highpass' }); vt({ f: 2400 * j, d: .1, v: .008 }); break;
      case 'soft': vn({ d: .08, v: .025, f: 600 * j }); break;
      default: vn({ d: .05, v: .035, f: 1300 * j }); vt({ f: 110 * j, d: .05, v: .02 });
    }
  },
  // ----- stingers -----
  boss() {
    timpani(0, .32); timpani(.4, .28, 80);
    [110, 116.5, 164.8].forEach(f => vt({ f, d: 2, type: 'sawtooth', v: .05, lp: 520, atk: .7 }));
    vt({ f: 55, d: 2.2, type: 'sawtooth', v: .16, slide: -12, lp: 260, atk: .3 }); vn({ d: 1.4, v: .1, f: 250, slide: 1500, type: 'bandpass', q: .6 });
    bell(220, 1.0, .05, 1.8); duckMusic(2.4, .25);
  },
  bossdown() {
    timpani(0, .3); timpani(.22, .3, 110);
    [262, 330, 392, 523].forEach(f => vt({ f, d: 1.7, type: 'sawtooth', v: .05, lp: 1700, atk: .09, delay: .32, wet: .3 }));
    [784, 988, 1175, 1568, 1976].forEach((f, i) => bell(f, .55 + i * .1, .07, 1.5));
    duckMusic(3.2, .3);
  },
  death() {
    vt({ f: 392, d: 1.9, type: 'triangle', v: .12, slide: -200, lp: 1200, wet: .35 }); vt({ f: 196, d: 2.1, type: 'sine', v: .12, slide: -90, delay: .15 });
    vt({ f: 80, d: 2.4, type: 'sawtooth', v: .12, slide: -30, lp: 260, atk: .2 }); vn({ d: 1.6, v: .14, f: 1200, slide: 80 });
    duckMusic(4.5, .12);
  },
  heart() { vt({ f: 62, d: .16, v: .22, slide: -18 }); vt({ f: 56, d: .18, v: .18, slide: -16, delay: .17 }); },
};

// route: new implementation if we have one, else the old one. Never let audio break the game.
{
  const _sfxOld = sfx, _sfxT = {};
  sfx = function (n) {
    if (!AC) return; const now = performance.now(), gap = (n === 'step' ? 30 : 45);
    if (_sfxT[n] && now - _sfxT[n] < gap) return; _sfxT[n] = now;
    try { if (SFX2[n]) SFX2[n](); else _sfxOld(n); } catch (e) { }
  };
}

// menu open/close and hover ticks
{
  const _om = openMenu, _cm = closeMenu;
  openMenu = function (name) { const was = G.menu; _om.apply(this, arguments); if (!was) sfx('open'); };
  closeMenu = function () { const was = G.menu; _cm.apply(this, arguments); if (was) sfx('close'); };
  let lastEl = null;
  document.addEventListener('mouseover', e => {
    const el = e.target && e.target.closest && e.target.closest('.btn,.cell,.tab,.hubt,.mb,.slot,.fitt,.card[onclick],.bcopt');
    if (el && el !== lastEl) sfx('tick'); lastEl = el || null;
  });
}

// ---------- ambience ----------
const AMB = { out: null, bus: null, key: null, nodes: [], evs: [], pend: null };
function avol() { return S && S.opts.avol !== undefined ? S.opts.avol : .6; }
function setAmbVol(v) { if (S) S.opts.avol = v; if (AMB.out && AC) AMB.out.gain.setTargetAtTime(v, AC.currentTime, .1); }
const bedW = (f, g, o = {}) => ({ t: 'bandpass', f, g, q: .6, ...o });                 // noise bed
const bedD = (f, g, type = 'sine', o = {}) => ({ osc: 1, f, g, type, ...o });          // drone
const chirp = (d) => { const base = 2300 + Math.random() * 1800, n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) vt({ f: base * (1 + i * .05), d: .09, v: .035, slide: 900 * (Math.random() < .5 ? 1 : -1), delay: i * .11, dest: d, wet: .25 }); };
const pent = [0, 2, 4, 7, 9];
const chime = (d, lo = 880) => bell(lo * Math.pow(2, pent[Math.random() * 5 | 0] / 12) * (Math.random() < .35 ? 2 : 1), 0, .03, 2, d);
const drip = d => { const f = 900 + Math.random() * 900; vt({ f, d: .12, v: .05, slide: -300, dest: d, wet: .6 }); vt({ f: f * 1.5, d: .08, v: .02, delay: .03, dest: d, wet: .6 }); };
const clang = d => { const f = 520 + Math.random() * 300; vn({ d: .03, v: .05, f: 3000, dest: d }); vt({ f, d: .6, v: .045, dest: d, wet: .4 }); vt({ f: f * 1.58, d: .4, v: .025, dest: d }); vt({ f: f * 2.4, d: .25, v: .015, dest: d }); };
const crackle = d => { const n = 2 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) vn({ d: .015 + Math.random() * .02, v: .03 + Math.random() * .04, f: 1500 + Math.random() * 3000, type: 'highpass', delay: i * (.02 + Math.random() * .06), dest: d }); };
const frog = d => { const f = 110 + Math.random() * 60, n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) vt({ f, d: .09, v: .04, type: 'square', lp: 500, slide: -30, delay: i * .13, dest: d }); };
const bubble = d => { const f = 300 + Math.random() * 400; vt({ f, d: .12, v: .04, slide: f, dest: d, wet: .3 }); };
const creak = d => { vt({ f: 130 + Math.random() * 50, d: .7, v: .03, type: 'sawtooth', slide: -30, lp: 400, atk: .15, dest: d }); vn({ d: .6, v: .02, f: 700, type: 'bandpass', q: 3, dest: d }); };
const moan = d => { const f = 95 + Math.random() * 30; vt({ f, d: 2.2, v: .04, type: 'sawtooth', slide: -22, lp: 280, atk: .8, dest: d, wet: .5 }); };
const whisper = d => { const f = 1400 + Math.random() * 1200; vn({ d: 1.1, v: .035, f, slide: f * .6, type: 'bandpass', q: 5, atk: .3, dest: d, wet: .5 }); vn({ d: .9, v: .02, f: f * 1.3, slide: f, type: 'bandpass', q: 6, atk: .4, delay: .15, dest: d }); };
const clunk = d => { vt({ f: 95, d: .3, v: .07, slide: -45, dest: d }); vn({ d: .12, v: .04, f: 800, dest: d }); };
const tick = (hi) => d => { vn({ d: .018, v: .05, f: hi ? 4200 : 3300, type: 'bandpass', q: 3, dest: d }); vt({ f: hi ? 1500 : 1200, d: .03, v: .012, dest: d }); };
const beat = d => { vt({ f: 52, d: .22, v: .16, slide: -14, dest: d }); vt({ f: 48, d: .24, v: .13, slide: -12, delay: .2, dest: d }); };
const gust = d => vn({ d: 2.4, v: .05, f: 500, slide: 1500, type: 'bandpass', q: .8, atk: 1, dest: d });
const AMBDEF = {
  title: { beds: [bedW(420, .045, { lfo: .06, ld: .6 })], ev: [] },
  town: { beds: [bedW(500, .035, { lfo: .08, ld: .6 }), bedW(2600, .01, { t: 'highpass' })], ev: [{ fn: chirp, every: 7 }, { fn: crackle, every: 2.4 }, { fn: clang, every: 20 }] },
  r0: { beds: [bedW(550, .05, { lfo: .1, ld: .7, sw: [.05, 120] }), bedW(3500, .008, { t: 'highpass', lfo: .3, ld: .8 })], ev: [{ fn: chirp, every: 4.5 }, { fn: chime, every: 60 }] },
  r1: { beds: [bedD(55, .05), bedD(82.5, .02, 'sine', { det: 7 }), bedW(180, .03, { t: 'lowpass' })], ev: [{ fn: drip, every: 3.2 }, { fn: moan, every: 24 }, { fn: creak, every: 16 }] },
  r2: { beds: [bedW(700, .07, { lfo: .13, ld: .7, sw: [.07, 250] }), bedW(4000, .018, { t: 'highpass', lfo: .2, ld: .6 })], ev: [{ fn: gust, every: 9 }] },
  r3: { beds: [bedW(260, .035, { t: 'lowpass' }), bedW(5200, .012, { t: 'bandpass', q: 6, lfo: 9, ld: .8 })], ev: [{ fn: frog, every: 3.5 }, { fn: bubble, every: 4 }, { fn: moan, every: 40 }] },
  r4: { beds: [bedW(480, .08, { q: 1.4, lfo: .09, ld: .8, sw: [.06, 260] }), bedW(2200, .02, { q: 2, lfo: .15, ld: .8 })], ev: [{ fn: creak, every: 14 }, { fn: gust, every: 10 }] },
  r5: { beds: [bedD(62, .045), bedD(93, .02, 'triangle', { lfo: .3 }), bedW(300, .02, { t: 'lowpass' })], ev: [{ fn: bubble, every: 2.2 }, { fn: drip, every: 5 }] },
  r6: { beds: [bedW(240, .06, { t: 'lowpass', lfo: .12, ld: .6 }), bedD(70, .025)], ev: [{ fn: bubble, every: 1.4 }, { fn: drip, every: 9 }, { fn: chime, every: 40 }] },
  r7: { beds: [bedW(120, .07, { t: 'lowpass', lfo: .2, ld: .5 }), bedD(48, .05, 'sawtooth', { lp: 160 }), bedW(3000, .012, { t: 'highpass', lfo: .5, ld: 1 })], ev: [{ fn: clang, every: 3.5 }, { fn: crackle, every: 1.2 }, { fn: gust, every: 14 }] },
  r8: { beds: [bedD(60, .03, 'sawtooth', { lp: 200, lfo: .7 }), bedW(900, .02, { q: 2, lfo: 1.4, ld: .7 })], ev: [{ fn: tick(0), every: .55, reg: 1 }, { fn: tick(1), every: .55, reg: 1, off: .275 }, { fn: clunk, every: 8 }] },
  r9: { beds: [bedW(2300, .05, { t: 'highpass', lfo: .08, ld: .7 }), bedW(900, .03, { lfo: .11, ld: .8, sw: [.05, 400] })], ev: [{ fn: chime, every: 4 }, { fn: gust, every: 12 }] },
  r10: { beds: [bedD(110, .02, 'sine', { det: 5, lfo: .2 }), bedD(165, .015, 'sine', { det: -4 }), bedW(4500, .008, { t: 'highpass' })], ev: [{ fn: d => chime(d, 1320), every: 2.6 }, { fn: drip, every: 12 }] },
  r11: { beds: [bedD(41, .06), bedD(43.4, .05), bedD(82, .02, 'sine', { lfo: .13 }), bedW(300, .03, { t: 'lowpass', lfo: .05, ld: .9 })], ev: [{ fn: whisper, every: 9 }, { fn: moan, every: 20 }] },
  abyss: { beds: [bedD(44, .06), bedW(160, .05, { t: 'lowpass', lfo: .1, ld: .6 })], ev: [{ fn: beat, every: 1.15, reg: 1 }, { fn: whisper, every: 14 }] },
};
function ambKey() { if (!S || G.mode === 'title') return 'title'; if (G.inTown || G.tutorial) return 'town'; if (G.abyss) return 'abyss'; return 'r' + (G.region || 0); }
function ambStop(nodes, bus) {
  if (bus) { bus.gain.cancelScheduledValues(AC.currentTime); bus.gain.setTargetAtTime(0, AC.currentTime, .35); }
  setTimeout(() => { for (const n of nodes) { try { n.stop(); } catch (e) { } try { n.disconnect(); } catch (e) { } } if (bus) try { bus.disconnect(); } catch (e) { } }, 1800);
}
function ambBuild(key) {
  const def = AMBDEF[key] || AMBDEF.title; ensureNoise();
  const bus = AC.createGain(); bus.gain.value = 0; bus.connect(AMB.out); bus.gain.setTargetAtTime(1, AC.currentTime, .9);
  const nodes = [];
  for (const b of def.beds) {
    if (b.osc) {
      const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(); o.type = b.type; o.frequency.value = b.f; if (b.det) o.detune.value = b.det;
      f.type = 'lowpass'; f.frequency.value = b.lp || 600; g.gain.value = b.g; o.connect(f); f.connect(g); g.connect(bus); o.start(); nodes.push(o);
      if (b.lfo) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = b.lfo; lg.gain.value = b.g * .5; l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l); }
    } else {
      const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; s.loop = true;
      f.type = b.t; f.frequency.value = b.f; f.Q.value = b.q; g.gain.value = b.g; s.connect(f); f.connect(g); g.connect(bus); s.start(0, Math.random() * .8); nodes.push(s);
      if (b.lfo) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = b.lfo; lg.gain.value = b.g * (b.ld === undefined ? .5 : b.ld); l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l); }
      if (b.sw) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = b.sw[0]; lg.gain.value = b.sw[1]; l.connect(lg); lg.connect(f.frequency); l.start(); nodes.push(l); }
    }
  }
  const now = AC.currentTime;
  AMB.evs = def.ev.map(e => ({ ...e, next: now + (e.off || 0) + (e.reg ? .1 : 1 + Math.random() * e.every) }));
  AMB.bus = bus; AMB.nodes = nodes;
}
let lowHpT = 0, combatT = 0, ambCheck = 0;
function ambTick() {
  if (!AC || AC.state !== 'running' || !master) return;
  const t = AC.currentTime;
  if (!AMB.out) { AMB.out = AC.createGain(); AMB.out.gain.value = avol(); AMB.out.connect(master); }
  const key = ambKey();
  if (key !== AMB.key) { if (AMB.bus) ambStop(AMB.nodes, AMB.bus); AMB.key = key; AMB.nodes = []; AMB.evs = []; AMB.bus = null; AMB.hold = t + .6; }
  if (!AMB.bus && t >= (AMB.hold || 0)) ambBuild(key);
  if (AMB.bus) for (const e of AMB.evs) if (t >= e.next) { try { e.fn(AMB.bus); } catch (x) { } e.next = t + (e.reg ? e.every : -Math.log(1 - Math.random()) * e.every + .4); }
  // adaptive combat music + low-life heartbeat (checked a few times per second)
  const now = performance.now();
  if (now - ambCheck > 250) {
    ambCheck = now;
    if (S && G.mode === 'play' && !G.inTown && !G.tutorial) {
      let near = false; try { near = !!nearestEnemy(P.x, P.y, 420); } catch (e) { }
      if (near) combatT = now + 5000;
      MUS.combat = now < combatT || !!G.boss;
      if (P.hp > 0 && ST.maxHp && P.hp / ST.maxHp < .25 && now - lowHpT > 1100) { lowHpT = now; SFX2.heart(); }
    } else MUS.combat = false;
  }
}
setInterval(() => { try { ambTick(); } catch (e) { } }, 60);

// Settings: ambience slider
{
  const _stA = MENUS.settings;
  MENUS.settings = () => _stA().replace('<div class="btn bigb" onclick="backMenu()">Back</div>',
    `<div class="card">🌲 Ambience <input type="range" min="0" max="1" step="0.05" value="${avol()}" oninput="setAmbVol(+this.value)"> <span class="dim">Wind, creatures and the sounds of each region.</span></div><div class="btn bigb" onclick="backMenu()">Back</div>`);
}
