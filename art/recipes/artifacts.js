// Celestial ARTIFACT icons — one bespoke recipe per ARTI entry (source/1b_story.js), key `x-<artikey>`.
// The rarest items in the game: ornate silhouettes of the right weapon family, custom palettes from the name/lore,
// glowing runes/gems and a subtle elemental effect that hugs the silhouette (never a round aura blob).
'use strict';
const { MAT } = require('../lib');

// ---- artifact palettes [hi, mid, lo] (registered into MAT so roles / gems can use them by name)
const PAL = {
  x_sunsteel: ['#ffffff', '#fff3c8', '#c99a38'], x_sungold: ['#fffbd8', '#ffc93a', '#8a4d00'], x_sungem: ['#ffffff', '#ffd23a', '#c45a00'],
  x_dawnwing: ['#ffffff', '#fff6dc', '#c8a868'],
  x_moonsteel: ['#ffffff', '#dfe7ff', '#6878ac'], x_indigo: ['#c4caff', '#4a5ad0', '#141a60'], x_vermil: ['#ffb49a', '#e8361e', '#5a0a04'],
  x_chrono: ['#ffffff', '#c4f2ff', '#3a7cae'], x_clock: ['#f6ffff', '#cfeefa', '#5a8eb0'], x_frostgem: ['#ffffff', '#6ae8ff', '#0a4a8a'],
  x_obsidian: ['#54445a', '#1a1018', '#030103'], x_molten: ['#ffb04a', '#c8300a', '#3a0400'], x_char: ['#6a4a3a', '#2e1a12', '#0a0504'],
  x_embergem: ['#fff6b0', '#ff6a00', '#6a0c00'],
  x_granite: ['#b4a894', '#5a4e42', '#1a1510'], x_earthgold: ['#fff2b0', '#e8b030', '#6a4008'], x_earthgem: ['#e8ffd0', '#7ad040', '#1a4a08'],
  x_azure: ['#e6f6ff', '#5aaef6', '#0c3a8a'], x_skywhite: ['#ffffff', '#e8f6ff', '#86aed6'], x_stormgem: ['#ffffff', '#8ae8ff', '#1a5ac8'],
  x_void: ['#f0c8ff', '#8a34e0', '#1a0440'], x_voidwood: ['#6a4a8a', '#2a1640', '#08020e'], x_ashbone: ['#f4ecff', '#b0a4c8', '#3a3052'],
  x_verdigris: ['#c8fff0', '#38a890', '#0a3a32'], x_ironblue: ['#d8e0ec', '#6a7484', '#1c222c'], x_liberty: ['#ffffff', '#ffe08a', '#c06a10'],
  x_brass: ['#fff2b8', '#d8a030', '#5a3206'], x_copper: ['#ffd0b0', '#c8683a', '#4a1a08'],
  x_crimson: ['#ffb8c4', '#d8102e', '#48000e'], x_rosegold: ['#fff0e8', '#f0a898', '#8a4a40'], x_heartgem: ['#ffe0e8', '#ff2a5a', '#6a0018'],
  x_storm: ['#c4c0ff', '#4a40b0', '#100a3a'], x_stormdark: ['#7a74b0', '#2a2460', '#08061e'], x_volt: ['#ffffff', '#ffe84a', '#c87a00'],
  x_abyss: ['#a8fff0', '#1a8a8e', '#032830'], x_pearl: ['#ffffff', '#e8f0f4', '#90a4b4'], x_coral: ['#ffc4b0', '#e05a6a', '#4a0a2a'],
  x_moonsilver: ['#ffffff', '#e4ecff', '#8090c0'], x_night: ['#a8c4ff', '#1c2c9a', '#03082c'], x_stargold: ['#ffffff', '#ffe68a', '#c88a10'],
  x_birch: ['#fff8ec', '#e8d4b8', '#8a6a4a'], x_wishstar: ['#ffffff', '#ffc8ea', '#d0508e'], x_wishgem: ['#ffffff', '#ff8ad0', '#8a1a5a'],
  x_abyssleather: ['#4e6a6a', '#122024', '#020608'], x_eldritch: ['#e0fff0', '#40f0a8', '#04503a'], x_parch: ['#fffaf0', '#e4d8bc', '#8a7a5a'],
  x_serpent: ['#d4ffb8', '#2aa848', '#04301a'], x_serpentgold: ['#fffad0', '#f0c030', '#7a4a00'],
};
for (const k in PAL) if (!MAT[k]) MAT[k] = PAL[k];

// ---- small drawing helpers
const R = v => Math.round(v * 10) / 10;
const poly = pts => 'M' + pts.map(p => R(p[0]) + ' ' + R(p[1])).join('L') + 'Z';
const star = (x, y, ro, ri, n = 5, rot = -90) => poly([...Array(n * 2)].map((_, i) => { const a = (rot + i * 180 / n) * Math.PI / 180, r = i % 2 ? ri : ro; return [x + r * Math.cos(a), y + r * Math.sin(a)]; }));
const spark = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
const heart = (x, y, s) => `M${x} ${y + s * .95}C${x - s * 1.5} ${y + s * .05} ${x - s * .95} ${y - s * 1.05} ${x} ${y - s * .38}C${x + s * .95} ${y - s * 1.05} ${x + s * 1.5} ${y + s * .05} ${x} ${y + s * .95}Z`;
/** glowing stroke: soft coloured bloom + coloured line + white-hot core */
const glow = (d, col, w = 6, clip = false, a = .7) => `<g ${clip ? 'clip-path="url(#sil)"' : ''} fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke="${col}" stroke-width="${w * 2.6}" opacity="${a}" filter="url(#glow)"/><path d="${d}" stroke="${col}" stroke-width="${w}"/><path d="${d}" stroke="#fff" stroke-width="${w * .4}" opacity=".9"/></g>`;
/** glowing filled shape (sparkles, stars, eyes) */
const glowFill = (d, col, core = '#fff', a = .75) => `<path d="${d}" fill="${col}" opacity="${a}" filter="url(#glow)"/><path d="${d}" fill="${col}" stroke="#0b0910" stroke-width="4" paint-order="stroke"/><path d="${d}" fill="${core}" opacity=".55"/>`;
const dot = (x, y, r, col, a = .9) => `<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${col}" opacity="${a * .6}" filter="url(#glow)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${a}"/><circle cx="${x}" cy="${y}" r="${r * .45}" fill="#fff"/>`;
/** elemental rim light hugging the silhouette (drawn under everything) */
const rim = (c, col, w = 30, a = .55) => `<path d="${c.sil}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" opacity="${a}" filter="url(#glow)"/>`;
const zig = (pts) => 'M' + pts.map(p => p.join(' ')).join('L');

module.exports = [
  // ------------------------------------------------------------------ Dawnbreaker (sword) — sunlit gold & white, sunburst
  { key: 'x-dawn', tier: 6, base: 'lorc/winged-sword', roles: { trim: 'x_sungold', gem: 'x_sungem' }, fx: { rune: '#ffe680' }, draw(c) {
    const cx = 259, cy = 146;
    const rays = [...Array(16)].map((_, i) => { const a = (i * 22.5 - 90 + 11.25) * Math.PI / 180, long = i % 2 ? 150 : 205, w = i % 2 ? 7 : 11;
      const px = -Math.sin(a) * w, py = Math.cos(a) * w;
      return poly([[cx + Math.cos(a) * 40 + px, cy + Math.sin(a) * 40 + py], [cx + Math.cos(a) * long, cy + Math.sin(a) * long], [cx + Math.cos(a) * 40 - px, cy + Math.sin(a) * 40 - py]]); }).join('');
    return {
      under: `<path d="${rays}" fill="#ffd862" opacity=".55" filter="url(#glow)"/><path d="${rays}" fill="#fff2b0" opacity=".85"/>` + rim(c, '#ffd25a', 26, .5),
      body: [
        c.paint(c.sub(4), 'x_sunsteel'),
        c.paint(c.sub([2, 3]), 'x_dawnwing'),
        c.paint(c.sub([5, 6, 9, 10]), 'x_dawnwing'),
        c.paint(c.sub([7, 8]), 'x_sungold'),
        c.paint(c.sub(1), 'x_sungold'),
        c.paint(c.sub(0), 'x_sungold'),
      ].join(''),
      top: [
        c.shine('M228 190 L222 400', 5, .9), c.shine('M60 172 L190 180', 4, .7), c.shine('M330 172 L470 160', 4, .6),
        c.line('M216 384 L260 470 L300 410', 'rgba(150,90,10,.45)', 4),
        c.runes('M233 214 l0 16 M233 254 l6 10 M233 294 l0 16 M233 334 l-5 10 M284 214 l0 16 M284 254 l-6 10 M284 294 l0 16 M284 334 l5 10', 5),
        c.engrave('M60 186 C 110 192 150 200 190 210 M452 186 C 400 192 360 200 330 210', 3),
        c.gem(cx, cy, 17),
        glowFill(spark(260, 470, 24), '#fff3b0'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Oathkeeper (katana) — moonlit steel, indigo wrap, vermilion oath-cord
  { key: 'x-oath', tier: 6, base: 'delapouite/katana', roles: { trim: 'gold', gem: 'gem_ruby' }, fx: { rune: '#9cd2ff' }, draw(c) {
    const tc = [120, 382];
    const lobes = [...Array(4)].map((_, i) => { const a = (45 + i * 90) * Math.PI / 180; return `M${tc[0] + Math.cos(a) * 30} ${tc[1] + Math.sin(a) * 30}m-24 0a24 24 0 1 0 48 0a24 24 0 1 0 -48 0`; }).join('');
    return {
      under: glow('M168 330 C 280 222 380 128 474 46', '#8cc8ff', 10, false, .45),
      body: [
        c.paint(c.sub(0), 'x_moonsteel'),
        c.paint(c.along(0, .12, { from: [150, 345], to: [482, 38] }), 'steel_black'),
        c.paint(c.sub(1), 'gold'),
        c.paint(c.sub(3), 'x_indigo'),
        c.shape(lobes, 'gold'),
        c.shape(`M${tc[0]} ${tc[1]}m-30 0a30 30 0 1 0 60 0a30 30 0 1 0 -60 0`, 'x_indigo'),
        // oath cord + tassel hanging from the pommel
        `<path d="M40 470 C 60 506 96 512 118 494 C 132 484 140 470 150 470" fill="none" stroke="#0b0910" stroke-width="26" stroke-linecap="round"/>`,
        `<path d="M40 470 C 60 506 96 512 118 494 C 132 484 140 470 150 470" fill="none" stroke="${c.mat('x_vermil')}" stroke-width="15" stroke-linecap="round"/>`,
        c.shape('M144 462 L174 452 L212 512 L196 526 L176 530 L160 520 Z', 'x_vermil'),
        c.line('M168 470 L190 516 M158 476 L176 524', 'rgba(80,0,0,.5)', 3, false),
        c.shape('M136 454 L164 444 L172 464 L144 474 Z', 'gold'),
      ].join(''),
      top: [
        c.shine('M182 318 C 290 210 380 118 474 44', 5, .9),
        c.line('M202 318 C 230 300 240 284 262 268 C 290 256 300 236 326 218 C 352 202 360 182 390 160 C 414 142 424 120 452 96', 'rgba(255,255,255,.55)', 4),
        c.runes('M226 280 l12 -4 M232 268 l-2 12 M286 226 l12 -4 M292 214 l-2 12 M346 172 l12 -4 M352 160 l-2 12 M404 120 l10 -4', 4),
        c.line('M48 456 L 96 408 M 40 440 L 80 470 M 62 418 L 96 452', 'rgba(255,220,140,.6)', 5),
        ...[[58, 446], [80, 424]].map(([x, y]) => `<path d="M${x - 9} ${y}L${x} ${y - 9}L${x + 9} ${y}L${x} ${y + 9}Z" fill="${c.mat('gold')}" stroke="#0b0910" stroke-width="3"/>`),
        c.gem(tc[0], tc[1], 13),
        glowFill(spark(470, 48, 20), '#cfe8ff'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Eternity's Edge (dagger) — frozen time: ice-silver blade, clock pommel
  { key: 'x-eternity', tier: 6, base: 'lorc/sacrificial-dagger', roles: { trim: 'gold_pale', gem: 'x_frostgem' }, fx: { rune: '#9ff4ff' }, draw(c) {
    const pc = [51, 53], pr = 40;
    const ticks = [...Array(12)].map((_, i) => { const a = i * 30 * Math.PI / 180, r0 = i % 3 ? 26 : 21; return `M${R(pc[0] + Math.cos(a) * r0)} ${R(pc[1] + Math.sin(a) * r0)}L${R(pc[0] + Math.cos(a) * 31)} ${R(pc[1] + Math.sin(a) * 31)}`; }).join('');
    return {
      under: rim(c, '#7ae8ff', 26, .5),
      body: [
        c.paint(c.sub(2), 'x_chrono'),
        c.paint(c.sub(0), 'gold_pale'),
        c.paint(c.along(.18, .5, { from: [60, 60], to: [190, 180], width: 30 }), 'x_indigo'),
        c.shape(`M${pc[0]} ${pc[1]}m-${pr} 0a${pr} ${pr} 0 1 0 ${pr * 2} 0a${pr} ${pr} 0 1 0 -${pr * 2} 0`, 'gold'),
        `<circle cx="${pc[0]}" cy="${pc[1]}" r="32" fill="${c.mat('x_clock')}" stroke="#0b0910" stroke-width="4"/>`,
      ].join(''),
      top: [
        c.line(ticks, '#2a4a6a', 4, false),
        c.line(`M${pc[0]} ${pc[1]} L${pc[0] + 1} ${pc[1] - 20} M${pc[0]} ${pc[1]} L${pc[0] + 15} ${pc[1] + 9}`, '#1a2a44', 5, false),
        `<circle cx="${pc[0]}" cy="${pc[1]}" r="4" fill="#ffd86a"/>`,
        c.shine('M262 196 C 340 270 420 350 488 470', 5, .9),
        c.line('M232 222 C 300 300 380 380 450 440', 'rgba(20,60,110,.45)', 5),
        c.runes('M262 262 l10 4 M296 300 l6 10 M330 336 l10 4 M364 372 l6 10 M398 408 l10 4', 5),
        glow('M222 182 l16 10 M244 156 l14 14', '#bff6ff', 4, true),
        c.gem(205, 132, 13),
        glowFill(spark(486, 476, 22), '#c8f8ff'), glowFill(spark(440, 498, 11), '#c8f8ff'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Cinderfang (axe) — obsidian with molten cracks & embers
  { key: 'x-cinder', tier: 6, base: 'lorc/battle-axe', roles: { trim: 'x_molten', gem: 'x_embergem' }, fx: { rune: '#ffb040' }, draw(c) {
    const cracks = 'M120 140 L150 170 L140 200 L178 226 M200 110 L196 150 L226 168 M150 236 L190 228 M320 330 L350 316 L362 356 L400 360 M300 384 L336 392 L340 430 M360 290 L388 300';
    return {
      under: rim(c, '#ff5a10', 30, .6),
      body: [
        c.paint(c.sub([1, 5]), 'x_obsidian'),
        c.paint(c.sub([0, 4]), 'x_molten'),
        c.paint(c.sub([3, 2]), 'x_obsidian'),
        c.paint(c.sub(6), 'x_char'),
      ].join(''),
      top: [
        glow(cracks, '#ff6a14', 5, true),
        glow('M196 260 L230 230 M300 224 L280 250', '#ff8a2a', 4, true),
        c.shine('M60 120 C 90 70 150 40 210 30', 4, .7),
        c.shine('M330 470 C 400 440 450 390 480 320', 4, .6),
        c.line('M40 470 L170 340', 'rgba(255,120,40,.35)', 5),
        c.runes('M70 448 l10 -10 M100 418 l10 -10 M130 388 l10 -10', 4),
        c.gem(258, 255, 16),
        dot(318, 46, 6, '#ffb040'), dot(352, 92, 4, '#ff8020'), dot(296, 18, 3.5, '#ffd060'), dot(470, 150, 4, '#ff9030'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Worldsplitter (hammer) — granite head split by a golden fissure, quake rings
  { key: 'x-world', tier: 6, base: 'delapouite/thor-hammer', roles: { trim: 'x_earthgold', gem: 'x_earthgem' }, fx: { rune: '#ffe070' }, draw(c) {
    const fissure = 'M246 98 L268 132 L250 156 L290 182 L282 214 L322 236 L318 268 L352 296';
    return {
      under: rim(c, '#ffc040', 22, .4),
      body: [
        c.paint(c.sub(1), 'x_granite'),
        c.paint(c.sub([0, 2]), 'x_earthgold'),
        c.paint(c.sub([3, 5, 7]), 'x_earthgold'),
        c.paint(c.sub([4, 6, 8]), 'leather_tooled'),
        c.paint(c.sub(9), 'x_earthgold'),
      ].join(''),
      top: [
        c.line('M210 160 L254 140 M300 66 L320 96 M380 140 L420 160 M360 250 L400 240 M226 200 L250 220', 'rgba(20,12,6,.55)', 5),
        glow(fissure, '#ffbe3a', 7, true),
        glow('M290 182 L340 168 L370 186 M282 214 L240 230', '#ffbe3a', 4, true),
        c.shine('M196 156 L304 48', 5, .7),
        c.runes('M396 120 l12 12 l12 -12 M420 178 l14 0 M370 90 l0 14', 5),
        c.gem(330, 166, 15),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Skypiercer (spear) — azure and cloud-white, chained lightning, sparks off the tips
  { key: 'x-sky', tier: 6, base: 'delapouite/magic-trident', roles: { trim: 'gold_pale', gem: 'x_stormgem' }, fx: { rune: '#a8f0ff' }, draw(c) {
    return {
      under: rim(c, '#6ad8ff', 28, .55),
      body: [
        c.paint(c.sub(0), 'x_azure'),
        c.paint(c.sub(1), 'x_skywhite'),
        c.paint(c.sub(2), 'gold_pale'),
        c.paint(c.sub([3, 4]), 'silver_pale'),
        c.paint(c.sub(5), 'gold_pale'),
      ].join(''),
      top: [
        glow(zig([[300, 236], [340, 210], [336, 186], [384, 152], [380, 128], [440, 76]]), '#5ad8ff', 8, true),
        c.shine('M250 40 L230 250', 4, .7), c.shine('M300 300 L460 236', 4, .6),
        c.runes('M80 420 l12 -12 M104 396 l12 -12 M128 372 l12 -12', 4),
        c.gem(206, 304, 14),
        glowFill(spark(496, 14, 20), '#bff2ff'), glowFill(spark(232, 10, 14), '#bff2ff'), glowFill(spark(498, 380, 13), '#bff2ff'),
        glow(zig([[470, 260], [500, 290], [488, 300], [520, 330]]), '#8ae4ff', 3.5, false, .7),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Voidreaver (scythe) — Morvane's void-purple blade, skull with burning eye
  { key: 'x-reaver', tier: 6, base: 'lorc/reaper-scythe', roles: { trim: 'x_void', gem: 'gem_void' }, fx: { rune: '#d890ff' }, draw(c) {
    return {
      under: rim(c, '#9a3aff', 32, .6),
      body: [
        c.paint(c.sub(0), 'x_void'),
        c.paint(c.sub(1), 'x_voidwood'),
        c.paint(c.sub(2), 'x_ashbone'),
      ].join(''),
      top: [
        glow('M120 92 C 200 60 300 50 380 70 C 430 84 460 110 480 150', '#e0a8ff', 4, true),
        c.line('M190 120 L230 100 L250 124 L290 98 L310 126 L350 100', 'rgba(20,0,40,.5)', 5),
        c.runes('M56 120 l8 14 M76 170 l10 10 M100 220 l6 14 M124 268 l10 10 M148 316 l6 14 M172 364 l10 10', 5),
        c.shine('M30 62 L250 490', 4, .35),
        `<path d="${c.sub(3)}" fill="#6a10c0"/>` + dot(387, 363, 15, '#d070ff'),
        `<path d="${c.sub(4)}" fill="#3a0a6a"/>`,
        c.line('M300 470 L310 494 M330 476 L334 494 M360 476 L360 494', 'rgba(40,20,70,.6)', 5),
        glowFill(spark(110, 36, 18), '#e8b8ff'), glowFill(spark(498, 210, 14), '#e8b8ff'), dot(470, 250, 5, '#c070ff'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Chainbreaker (flail) — verdigris bronze ball, a shattered glowing link
  { key: 'x-chain', tier: 6, base: 'delapouite/flail', roles: { trim: 'x_liberty', gem: 'gem_emer' }, fx: { rune: '#ffe9a0' }, draw(c) {
    return {
      under: rim(c, '#ffd27a', 22, .4),
      body: [
        c.paint(c.sub(0), 'x_ironblue'),
        c.paint(c.sub(9), 'x_verdigris'),
        c.paint(c.sub([7, 8, 10, 11, 12, 13, 14]), 'x_liberty'),
        c.paint(c.sub(5), 'leather_tooled'),
        c.paint(c.sub(3), 'x_liberty'),
        c.paint(c.sub(15), 'x_liberty'),
        c.paint(c.along(.42, .5, { from: [240, 120], to: [470, 420] }), 'x_liberty'),
        c.paint(c.along(.75, .83, { from: [240, 120], to: [470, 420] }), 'x_liberty'),
      ].join(''),
      top: [
        c.engrave('M100 300 C 130 280 190 280 230 310 M110 370 C 150 390 200 390 240 360', 4),
        c.runes('M140 330 l12 0 M170 320 l0 14 M200 334 l12 -6', 5),
        c.gem(170, 340, 16),
        c.shine('M90 270 C 110 250 140 240 170 240', 5, .7),
        // the broken link: white-hot split + flying shards
        glow('M190 22 L204 30 M196 40 L210 44', '#fff0b0', 5, false, .9),
        `<path d="M218 6 l18 -8 l6 12 l-14 10 z M250 30 l16 2 l-2 14 l-16 -4 z" fill="${c.mat('x_ironblue')}" stroke="#0b0910" stroke-width="4"/>`,
        dot(232, 40, 4, '#ffe080'), dot(262, 10, 3, '#ffe080'),
        glow('M70 470 C 100 500 160 506 210 486', '#ffe9a0', 4, false, .5),
        glow('M260 470 C 290 490 330 486 350 466', '#ffe9a0', 4, false, .5),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Fists of the Colossus (fists) — brass gauntlet, four gem knuckles, gear engraving
  { key: 'x-colossus', tier: 6, base: 'lorc/mailed-fist', roles: { trim: 'x_brass', gem: 'gem_amber' }, fx: { rune: '#ffd060' }, draw(c) {
    const gc = [236, 290];
    const gear = [...Array(8)].map((_, i) => { const a = i * 45 * Math.PI / 180; return `M${R(gc[0] + Math.cos(a) * 38)} ${R(gc[1] + Math.sin(a) * 38)}L${R(gc[0] + Math.cos(a) * 54)} ${R(gc[1] + Math.sin(a) * 54)}`; }).join('');
    const ring = r => `M${gc[0] - r} ${gc[1]}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 -${r * 2} 0`;
    return {
      under: rim(c, '#ffb040', 24, .45),
      body: [
        c.paint(c.sub([0, 1, 2, 3, 7, 5]), 'x_brass'),
        c.paint(c.sub(8), 'x_copper'),
        c.paint(c.sub([11, 13]), 'x_brass'),
        c.paint(c.sub([12, 14]), 'x_copper'),
        c.paint(c.sub(4), 'gem_ruby'), c.paint(c.sub(6), 'gem_amber'), c.paint(c.sub(9), 'gem_sapph'), c.paint(c.sub(10), 'gem_emer'),
      ].join(''),
      top: [
        glow(ring(28) + gear, '#ffd070', 6, true, .55),
        c.line(ring(46), 'rgba(255,220,140,.7)', 5),
        `<circle cx="${gc[0]}" cy="${gc[1]}" r="12" fill="${c.mat('gem_amber')}" stroke="#0b0910" stroke-width="4"/>`,
        ...[[4, '#ff4a5a'], [6, '#ffb020'], [9, '#4a8aff'], [10, '#2ae070']].map(([k, col]) => { const b = c.subBox(k), x = b.cx, y = b.cy;
          return `<circle cx="${x}" cy="${y}" r="${b.w * .7}" fill="${col}" opacity=".45" filter="url(#glow)"/><ellipse cx="${x - b.w * .17}" cy="${y - b.w * .17}" rx="${b.w * .16}" ry="${b.w * .1}" fill="#fff" opacity=".85" transform="rotate(-35 ${x - b.w * .17} ${y - b.w * .17})"/>`; }),
        c.shine('M60 160 L72 270', 4, .6), c.shine('M200 30 L250 40 M270 50 L340 80', 4, .7),
        c.line('M110 340 L120 350 M150 370 L160 380 M300 380 L310 390 M370 300 L380 310', 'rgba(60,20,0,.6)', 7),
        c.runes('M80 420 l14 -6 M130 440 l14 -6 M180 460 l14 -6', 4),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Heartseeker (bow) — crimson recurve, rose-gold string, heart gem, homing shards
  { key: 'x-heart', tier: 6, base: 'lorc/pocket-bow', roles: { trim: 'x_rosegold', gem: 'x_heartgem' }, fx: { rune: '#ff9ab4' }, draw(c) {
    return {
      under: rim(c, '#ff2a5a', 28, .55),
      body: [
        c.fillAll('x_crimson'),
        c.paint('M0 0 L512 0 L512 64 L64 64 L64 512 L0 512 Z', 'x_rosegold'),
        c.paint(c.along(.12, .78, { from: [70, 70], to: [430, 430], width: 22 }), 'silver_pale'),
        c.paint(c.sub(1), 'x_rosegold'),
        c.paint(c.sub(3), 'x_heartgem'),
        c.paint(c.sub([2, 4]), 'x_rosegold'),
      ].join(''),
      top: [
        c.shine('M520 20 C 470 100 420 190 380 230', 4, .7),
        c.runes('M440 120 l10 6 M418 168 l10 6 M190 420 l6 10 M150 440 l6 10', 4),
        `<path d="${heart(306, 304, 26)}" fill="${c.mat('trim')}" stroke="#0b0910" stroke-width="6"/>`,
        `<path d="${heart(306, 304, 30)}" fill="#ff2a5a" opacity=".55" filter="url(#glow)"/>`,
        `<path d="${heart(306, 304, 17)}" fill="${c.mat('x_heartgem')}"/>`,
        `<ellipse cx="298" cy="296" rx="5" ry="3.5" fill="#fff" opacity=".9" transform="rotate(-35 298 296)"/>`,
        glowFill(star(470, 400, 22, 9, 4, -45), '#ff8aaa'), glowFill(star(410, 480, 16, 6, 4, -45), '#ff8aaa'),
        glow('M440 430 C 470 420 480 410 470 400 M420 452 C 420 470 414 478 410 480', '#ff7aa0', 3, false, .6),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Thunderlord (crossbow) — storm-indigo frame, a bolt of living lightning
  { key: 'x-thunder', tier: 6, base: 'carl-olsen/crossbow', roles: { trim: 'x_volt', gem: 'x_volt' }, fx: { rune: '#ffe84a' }, draw(c) {
    return {
      under: rim(c, '#ffe040', 24, .45),
      body: [
        c.fillAll('x_storm'),
        c.paint(c.along(0, .7, { from: [30, 480], to: [470, 40], width: 40 }), 'x_stormdark'),
        c.paint(c.along(.0, .08, { from: [30, 480], to: [470, 40], width: 60 }), 'x_volt'),
        c.paint(c.along(.68, .74, { from: [30, 480], to: [470, 40], width: 60 }), 'x_volt'),
        c.paint(c.sub(1), 'x_volt'),
        c.paint(c.sub(2), 'x_stormgem'),
      ].join(''),
      top: [
        glow(zig([[140, 384], [196, 340], [186, 318], [252, 266], [244, 244], [326, 176]]), '#ffe84a', 6, false),
        glow(zig([[120, 60], [150, 90], [140, 104], [190, 140]]), '#fff27a', 4, true),
        glow(zig([[470, 380], [440, 352], [454, 336], [410, 300]]), '#fff27a', 4, true),
        c.shine('M60 40 C 200 60 300 110 380 180', 4, .5),
        c.runes('M80 440 l12 -12 M104 416 l12 -12', 4),
        dot(432, 80, 10, '#bff2ff'),
        glow(zig([[500, 150], [522, 172], [508, 178], [530, 204]]), '#fff27a', 4, false, .7),
        glow(zig([[150, -6], [176, 6], [164, 16], [190, 26]]), '#fff27a', 3.5, false, .7),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Leviathan's Wrath (cannon) — deep-sea teal barrel, coral tentacle coiled round it
  { key: 'x-kraken', tier: 6, base: 'lorc/cannon', roles: { trim: 'gold', gem: 'x_pearl' }, fx: { rune: '#7affe8' }, draw(c) {
    const tent = 'M150 380 C 120 300 170 230 250 220 C 320 212 360 190 352 150 C 346 120 312 112 300 132 C 294 146 306 158 318 152 C 330 150 334 170 320 180 C 296 194 270 160 286 126 C 310 84 380 98 390 150 C 400 210 330 250 262 254 C 200 258 170 300 182 370 Z';
    return {
      under: rim(c, '#2affd8', 26, .45),
      body: [
        c.paint(c.sub(0), 'x_abyss'),
        c.paint(c.along(.88, 1, { from: [100, 214], to: [494, 214], width: 120 }), 'gold'),
        c.paint(c.along(.6, .66, { from: [100, 214], to: [494, 214], width: 120 }), 'gold'),
        c.paint('M0 280 L512 280 L512 512 L0 512 Z', 'x_abyss'),
        c.paint(c.sub(2), 'x_pearl'),
        c.shape(tent, 'x_coral'),
      ].join(''),
      top: [
        `<circle cx="261" cy="316" r="62" fill="none" stroke="${c.mat('gold')}" stroke-width="10" />`,
        ...[[176, 330, 6], [168, 290, 6.5], [190, 254, 7], [236, 238, 7], [292, 232, 6.5], [338, 214, 6], [366, 182, 5.5], [374, 146, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffe0d0" stroke="#6a1030" stroke-width="2.5"/>`),
        c.shine('M210 150 L480 170', 5, .7),
        c.runes('M410 200 l0 18 M436 200 l8 16 M462 200 l0 18', 5),
        c.gem(261, 316, 13),
        glow('M500 150 C 530 160 532 190 512 200 M506 230 C 530 236 536 260 518 270', '#8afff0', 4, false, .65),
        dot(530, 128, 5, '#aaffff'), dot(538, 232, 4, '#aaffff'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Staff of Starfall (staff) — moon-silver crescent, starry night-blue orb
  { key: 'x-starfall', tier: 6, base: 'delapouite/crescent-staff', roles: { trim: 'x_stargold', gem: 'x_night' }, fx: { rune: '#bcd4ff' }, draw(c) {
    const ob = c.subBox(4), ox = ob.cx, oy = ob.cy, orr = ob.w / 2;
    return {
      under: rim(c, '#7aa4ff', 24, .45),
      body: [
        c.paint(c.sub(1), 'x_moonsilver'),
        c.paint(c.along(0, .45, { from: [30, 480], to: [300, 210], width: 60 }), 'x_night'),
        c.paint(c.sub([0, 2, 3]), 'x_stargold'),
        c.paint(c.sub([5, 6]), 'x_stargold'),
        c.paint(c.sub(4), 'x_night'),
      ].join(''),
      top: [
        `<circle cx="${ox}" cy="${oy}" r="${orr + 8}" fill="#5a8aff" opacity=".45" filter="url(#glow)"/>`,
        `<circle cx="${ox}" cy="${oy}" r="${orr}" fill="${c.mat('x_night')}" stroke="#0b0910" stroke-width="5"/>`,
        `<ellipse cx="${ox + 6}" cy="${oy + 4}" rx="${orr * .8}" ry="${orr * .32}" fill="#8a5aff" opacity=".35" transform="rotate(-30 ${ox} ${oy})" filter="url(#glow)"/>`,
        `<path d="${star(ox - 8, oy - 6, 13, 5)}" fill="#fff"/>`,
        ...[[14, 16, 2.5], [-20, 22, 2], [22, -18, 2], [-24, -20, 1.6], [4, 30, 1.6], [28, 6, 1.8]].map(([dx, dy, r]) => `<circle cx="${ox + dx}" cy="${oy + dy}" r="${r}" fill="#fff"/>`),
        c.shine('M170 230 C 156 170 170 120 220 90', 5, .8),
        c.runes('M60 450 l12 -12 M84 426 l12 -12 M108 402 l12 -12', 4),
        glow('M500 20 L 432 88', '#bcd4ff', 4, false, .6),
        glowFill(star(424, 96, 20, 8), '#ffe88a'),
        glowFill(spark(420, 260, 14), '#d8e4ff'), glowFill(spark(250, 20, 11), '#d8e4ff'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ The Last Wish (wand) — pale wishing-tree wood, rose-gold wish star, embers at the burnt end
  { key: 'x-wish', tier: 6, base: 'lorc/fairy-wand', roles: { trim: 'gold_pale', gem: 'x_wishgem' }, fx: { rune: '#ffb8e4' }, draw(c) {
    return {
      under: rim(c, '#ff8ad0', 24, .45),
      body: [
        c.paint(c.sub(1), 'x_wishstar'),
        c.paint(c.along(0, .62, { from: [18, 492], to: [300, 210], width: 40 }), 'x_birch'),
        c.paint(c.along(0, .1, { from: [18, 492], to: [300, 210], width: 40 }), 'x_char'),
        c.paint(c.along(.5, .56, { from: [18, 492], to: [300, 210], width: 40 }), 'gold_pale'),
        c.paint(c.along(.26, .3, { from: [18, 492], to: [300, 210], width: 40 }), 'gold_pale'),
        c.paint(c.sub(0), 'x_wishstar'), c.paint(c.sub(2), 'x_stargold'), c.paint(c.sub(3), 'crystal'),
        c.paint(c.sub(4), 'cloth_royal'), c.paint(c.sub(5), 'x_wishgem'), c.paint(c.sub(6), 'x_stargold'),
        c.shape('M150 360 C 170 330 200 330 214 344 C 196 360 172 368 150 360 Z', 'gem_emer'),
        c.shape('M110 404 C 92 376 98 350 114 340 C 124 360 124 384 110 404 Z', 'gem_emer'),
      ].join(''),
      top: [
        `<path d="${star(372, 152, 70, 30)}" fill="#ff8ad0" opacity=".25" filter="url(#glow)"/>`,
        c.gem(372, 154, 18),
        c.line('M372 70 L372 110 M300 130 L336 140 M444 130 L408 140', 'rgba(255,255,255,.7)', 4),
        c.runes('M190 330 l8 -8 M232 286 l8 -8', 4),
        c.shine('M60 440 L250 250', 3, .45),
        dot(40, 470, 5, '#ff8a20'), dot(56, 490, 3.5, '#ffb040'), dot(26, 448, 3, '#ffc060'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ The Abyssal Codex (tome) — black abyss leather, eldritch green glare, silver clasps
  { key: 'x-codex', tier: 6, base: 'lorc/evil-book', roles: { trim: 'silver_pale', gem: 'x_eldritch' }, fx: { rune: '#60ffb8' }, draw(c) {
    return {
      under: rim(c, '#30e0a0', 26, .45),
      body: [
        c.paint(c.sub(0), 'silver_pale'),
        c.paint(c.sub(1), 'x_abyssleather'),
        c.paint(c.sub(2), 'x_eldritch'),
        c.paint(c.sub(6), 'x_parch'),
      ].join(''),
      top: [
        `<g filter="url(#glow)" opacity=".85"><path d="${c.sub([3, 4, 5])}" fill="#3affa8"/></g>`,
        `<path d="${c.sub([3, 4, 5])}" fill="${c.mat('x_eldritch')}"/>`,
        `<path d="${c.sub([3, 4])}" fill="#fff" opacity=".55" transform="translate(4 4)"/>`,
        c.runes('M108 110 l10 10 M114 160 l10 -8 M120 210 l10 10 M126 260 l10 -8', 4),
        c.engrave('M200 70 L460 82 M168 350 L440 360', 3),
        ...[[60, 60], [466, 62], [100, 372], [450, 380]].map(([x, y]) => `<path d="M${x - 14} ${y}L${x} ${y - 14}L${x + 14} ${y}L${x} ${y + 14}Z" fill="${c.mat('silver_pale')}" stroke="#0b0910" stroke-width="4"/>`),
        c.line('M170 400 L440 412 M160 424 L436 436', 'rgba(120,100,60,.45)', 3),
        glowFill(star(492, 410, 18, 6, 4, -45), '#7affc8'), glowFill(star(28, 300, 14, 5, 4, -45), '#7affc8'),
      ].join(''),
    };
  } },

  // ------------------------------------------------------------------ Ouroboros (chakram) — emerald serpent ring edged with golden blades
  { key: 'x-ouro', tier: 6, base: 'lorc/ouroboros', roles: { trim: 'x_serpentgold', gem: 'gem_ruby' }, fx: { rune: '#ffe070' }, draw(c) {
    const cx = 258, cy = 263, ro = 222;
    const teeth = [...Array(10)].map((_, i) => i * 36 + 108).filter(d => (d % 360) < 270 || (d % 360) > 320).map(d => { const a = d * Math.PI / 180, b = a + .22;
      return poly([[cx + Math.cos(a - .12) * (ro - 12), cy + Math.sin(a - .12) * (ro - 12)], [cx + Math.cos(b) * (ro + 34), cy + Math.sin(b) * (ro + 34)], [cx + Math.cos(a + .2) * (ro - 12), cy + Math.sin(a + .2) * (ro - 12)]]); }).join('');
    const scales = [...Array(30)].map((_, k) => c.subBox(k + 2)).map(b => `<circle cx="${R(b.cx)}" cy="${R(b.cy)}" r="${R(b.w / 2 - 1)}" fill="url(#m_x_serpentgold)"/>`).join('');
    return {
      under: rim(c, '#4aff7a', 22, .4) + `<path d="${teeth}" fill="#ffd040" opacity=".5" filter="url(#glow)"/>`,
      body: [
        c.shape(teeth, 'x_serpentgold'),
        c.paint(c.sub(0), 'x_serpent'),
      ].join(''),
      top: [
        c.mat('x_serpentgold') && scales,
        c.line(`M${cx - 166} ${cy}a166 166 0 1 0 332 0a166 166 0 1 0 -332 0`, c.mat('x_serpentgold'), 14),
        c.line(`M${cx - 160} ${cy}a160 160 0 1 0 320 0a160 160 0 1 0 -320 0`, 'rgba(255,255,255,.7)', 3),
        c.engrave(`M${cx - 212} ${cy}a212 212 0 1 0 424 0a212 212 0 1 0 -424 0`, 3),
        dot(378, 56, 9, '#ff3a3a'),
        c.shine('M60 200 C 80 130 140 80 210 60', 5, .6),
        glowFill(star(470, 120, 16, 6, 4, -45), '#ffe070'),
      ].join(''),
    };
  } },
];
