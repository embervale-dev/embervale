// Converts the chosen OpenGameArt tracks into assets/music/<slot>.m4a
// usage: node art/music.js <picks.json>
//   picks.json: { "<slot>": { local: "<path to downloaded master>", master: "<original file URL>", ... } }
// Two-pass EBU R128 loudness normalisation to -16 LUFS, then AAC 96 kbps stereo.
// Non-loop tracks get leading/trailing silence (< -60 dB) trimmed; loop masters are left untouched so they stay seamless.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const picks = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = path.join(__dirname, '..', 'assets', 'music');
fs.mkdirSync(OUT, { recursive: true });
const ff = args => { const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8', maxBuffer: 64 << 20 }); if (r.status) throw new Error(r.stderr.slice(-800)); return r.stderr; };
const TRIM = 'silenceremove=start_periods=1:start_threshold=-60dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse';
for (const [slot, p] of Object.entries(picks)) {
  const loop = /loop/i.test(decodeURIComponent(p.master || ''));
  const pre = loop ? '' : TRIM + ',';
  const m = JSON.parse(ff(['-i', p.local, '-map', 'a:0', '-af', pre + 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']).match(/\{[^{}]*"input_i"[^{}]*\}/g).pop());
  const ln = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  ff(['-y', '-i', p.local, '-map', 'a:0', '-af', pre + ln, '-map_metadata', '-1', '-map_chapters', '-1', '-ar', '44100', '-ac', '2', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', path.join(OUT, slot + '.m4a')]);
  console.log(slot, loop ? 'loop' : 'trim', 'in', m.input_i, 'LUFS');
}
