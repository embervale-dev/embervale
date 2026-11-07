# OpenGameArt soundtrack — design

## Goal
Replace Embervale's synthesised background music with real recorded tracks from OpenGameArt.org, one per game area, so the soundtrack sounds genuinely good and fits each place.

## Requirements
- 17 slots, one track each: `title`, `town` (Haven), `r0`–`r11` (Whispering Woods … The Hollow Void), `abyss`, `boss`, `trial`.
- Licences: **CC0 or CC-BY only** (no CC-BY-SA, GPL, OGA-BY, NC). Every track credited.
- Mood arc follows progression: Haven + early regions warm/folky → deeper regions darker/atmospheric → bosses + Abyss epic orchestral. Each region keeps its own flavour (e.g. Ashen Dunes = middle-eastern, Frostpeak = icy, Molten Forge = heavy/percussive, Clockwork Halls = mechanical).
- The user picks the final tracks by ear from shortlists.

## 1. Curation
- Search OpenGameArt for 2–3 candidates per slot that match mood + licence.
- Download candidates into a scratch dir outside the repo (untrusted downloads, own empty dir).
- Build a local audition page (`music-audition.html` in scratch, not committed): one row per slot with region name, target mood, and each candidate's player, title, author, licence, length, source link.
- User picks one per slot or asks for more options; repeat until all 17 are chosen.

## 2. Runtime
- Chosen tracks are converted with ffmpeg to AAC `.m4a`, ~96 kbps stereo, loudness-normalised (target ≈ −16 LUFS) so areas sit at similar volume; stored as `assets/music/<slot>.m4a`.
- Lazy load: a slot's file is fetched only when the player first enters it; decoded/streaming element kept for reuse.
- Playback: `<audio loop>` elements routed via `MediaElementAudioSourceNode` into the existing `MUS.gain`, so the music volume slider (`setMusicVol`) and `duckMusic` keep working unchanged.
- Switching slots (`wantTheme()` result changes) → ~1.5 s equal-power crossfade between the old and new element; the old one pauses after the fade.
- Combat: no adaptive layer (would clash with recorded tempo/key). Combat gives a small volume lift (~+15%); bosses use the `boss` track.
- Failure (missing file, decode error, autoplay blocked): that slot stays silent, nothing throws; retried on next area change.
- Remove the old synth music: `source/6s_music.js`, `source/6s_scores.js`, the synth music parts of `source/6d_polish.js` (THEMES, `mnote` and scheduler; keep `MUS`, `musicVol`, `setMusicVol`, `wantTheme` or their replacements), and their entries in `source/build.sh`. New code lives in one file, `source/6s_music.js` (rewritten).

## 3. Credits
- `assets/music/CREDITS.md`: slot → title, author, licence, OpenGameArt URL, "converted to AAC" note.
- Same credits in `README.md` and the in-game credits screen (next to game-icons.net).

## Testing
- Playwright: each slot change requests the right file, crossfade happens, volume slider and ducking affect the music, no console errors, missing-file case stays silent.
- The user listens in-game to judge sound and loudness.

## Out of scope
- Adaptive/stem-based music, per-floor variation within a region, offline single-file bundling of music.
