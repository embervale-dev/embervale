#!/usr/bin/env node
// Lists every emoji / pictograph still in the game source.  Usage: node art/audit.js [file ...]
// Exit code 1 if any remain.  Plain typographic marks (arrows, stars, bullets, x) are allowed.
'use strict';
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'source');
const ALLOW = new Set([...'→←↑↓↔★☆✦✧✕×☰◆◇•○●·…—–']);
const RX = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{24FF}\u{25A0}-\u{25FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}\u{200D}\u{2122}\u{2139}\u{24C2}]/gu;
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(SRC).filter(f => /\.(js|html)$/.test(f) && !f.startsWith('0_')).map(f => path.join(SRC, f));
let n = 0; const tally = {};
for (const f of files) {
  if (/vendor|three\.bundle/.test(f)) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const hits = [...line.matchAll(RX)].map(m => m[0]).filter(ch => !ALLOW.has(ch) && ch !== '️' && ch !== '‍');
    if (hits.length) { n += hits.length; const b = path.basename(f); tally[b] = (tally[b] || 0) + hits.length; if (process.env.V !== '0') console.log(`${b}:${i + 1}: ${[...new Set(hits)].join(' ')}`); }
  });
}
console.log(`\n${n} emoji left`, tally);
process.exit(n ? 1 : 0);
