// ================= MUSIC: streamed OpenGameArt tracks, one per area =================
// Each area ("slot", from wantTheme()) has a looping file in assets/music/ (credits: assets/music/CREDITS.md).
// A slot's <audio> element is created the first time the player enters it and kept for reuse.
// Routing: <audio> -> MediaElementSource -> per-track gain (crossfades) -> MUS.lift (combat lift)
//          -> MUS.gain (music volume x .55, ducking; see setMusicVol / duckMusic) -> speakers.
// Fades are computed here on musicTick (every 60 ms) rather than with automation curves, so an
// area change in the middle of a fade can always take over smoothly from the current level.

const MUS_SLOTS = ['title', 'town', 'r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'abyss', 'boss', 'trial'];
const MUS_FADE = 1.5, MUS_LIFT = 1.15;
function musSrc(slot) { return 'assets/music/' + slot + '.m4a'; }
// Opened as a local file (file://), browsers block routing <audio> into Web Audio, so there the
// element's own volume is driven instead (no ducking). MUS.forceDirect overrides, for testing.
function musDirect() { return MUS.forceDirect !== undefined ? MUS.forceDirect : location.protocol === 'file:'; }
function musElVol(vol, level, lift) { return level <= 0 ? 0 : Math.min(1, vol * .55 * level * (lift ? MUS_LIFT : 1)); }

function musInit() {
  MUS.gain = AC.createGain(); MUS.gain.gain.value = 0; MUS.gain.connect(AC.destination);
  MUS.lift = AC.createGain(); MUS.lift.gain.value = 1; MUS.lift.connect(MUS.gain);
  MUS.tracks = {}; MUS.liftOn = false;
}
// the slot's track, created on first use; a track that failed to load is rebuilt (retried)
function musTrack(slot) {
  const old = MUS.tracks[slot];
  if (old && old.ok !== false) return old;
  if (old) { try { old.el.pause(); old.el.removeAttribute('src'); if (old.src) old.src.disconnect(); if (old.g) old.g.disconnect(); } catch (e) { } }
  const el = new Audio(), direct = musDirect(), t = { el, g: null, ok: null, v: 0, from: 0, to: 0, t0: 0 };
  el.loop = true; el.preload = 'auto';
  el.addEventListener('error', () => { t.ok = false; });
  el.addEventListener('canplay', () => { if (t.ok === null) t.ok = true; });
  if (direct) { el.volume = 0; el.src = musSrc(slot); return MUS.tracks[slot] = t; }
  el.crossOrigin = 'anonymous'; el.src = musSrc(slot);
  t.g = AC.createGain(); t.g.gain.value = 0; t.src = AC.createMediaElementSource(el); t.src.connect(t.g); t.g.connect(MUS.lift);
  return MUS.tracks[slot] = t;
}
function musFadeTo(t, to, now) { t.from = t.v; t.to = to; t.t0 = now; }
// equal-power level of a track at time `now`
function musLevel(t, now) {
  const x = Math.min(1, Math.max(0, (now - t.t0) / MUS_FADE));
  return t.to > t.from ? t.from + (t.to - t.from) * Math.sin(x * Math.PI / 2) : t.to + (t.from - t.to) * Math.cos(x * Math.PI / 2);
}
musicTick = function () {
  if (!AC || AC.state !== 'running') return;
  if (!MUS.gain) musInit();
  const now = AC.currentTime, want = wantTheme();
  if (want !== MUS.theme) {
    const first = MUS.theme === null; MUS.theme = want;
    for (const s in MUS.tracks) if (s !== want) musFadeTo(MUS.tracks[s], 0, now);
    const t = musTrack(want);
    if (t.v < .01) { try { t.el.currentTime = 0; } catch (e) { } }   // fresh entry restarts; mid-fade-out it just continues
    musFadeTo(t, 1, now);
    const p = t.el.play(); if (p) p.catch(e => { if (e && e.name !== 'AbortError') t.ok = false; });
    if (first) MUS.gain.gain.setTargetAtTime(musicVol() * .55, now, .7);
  }
  const lift = !!MUS.combat;
  if (lift !== MUS.liftOn) { MUS.liftOn = lift; MUS.lift.gain.setTargetAtTime(lift ? MUS_LIFT : 1, now, .5); }
  for (const s in MUS.tracks) {
    const t = MUS.tracks[s];
    if (t.g && t.v === t.to && (t.to > 0 || t.el.paused)) continue;
    t.v = musLevel(t, now);
    if (now - t.t0 >= MUS_FADE) t.v = t.to;
    if (t.g) t.g.gain.setTargetAtTime(t.v, now, .03);
    else t.el.volume = musElVol(musicVol(), t.v, MUS.liftOn);   // direct mode follows the volume slider every tick
    if (t.to === 0 && t.v === 0 && !t.el.paused) t.el.pause();
  }
};
