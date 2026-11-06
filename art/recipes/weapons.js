// Weapon type icons — one tiered recipe per WT key (source/1_data.js + later additions).
// Each recipe gets c (see art/lib.js makeCtx) at tiers 1..6 and returns { body, top, under }.
//   body  = material regions, clipped to the silhouette, then bevelled
//   top   = details drawn above the bevel (shine lines, gems, runes, engraving)
//   under = behind everything (auras)
'use strict';
const L = require('../lib');

// ---------------------------------------------------------------- local geometry helpers
const r1 = v => Math.round(v * 10) / 10;
const area = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
/** closed polygon d-string; every polygon is wound the same way so overlapping parts union cleanly in a silhouette */
function poly(pts, sign = 1) { const p = Math.sign(area(pts)) === sign ? pts : pts.slice().reverse(); return 'M' + p.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + 'Z'; }
function circ(x, y, r, n = 36, sign = 1) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return poly(p, sign); }
/** ring segment (annulus slice) between radii r0..r1 and angles a0..a1 (degrees) */
function arcBand(x, y, ra, rb, a0, a1, n = 18, sign = 1) {
  const p = [], q = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([x + Math.cos(a) * rb, y + Math.sin(a) * rb]); q.push([x + Math.cos(a) * ra, y + Math.sin(a) * ra]); }
  return poly(p.concat(q.reverse()), sign);
}
const arcLine = (x, y, r, a0, a1, n = 16) => { const p = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push(`${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)}`); } return 'M' + p.join('L'); };
const ptsOf = cmds => cmds.filter(s => s[0] !== 'Z').map(s => s.slice(-2));
const RUNE = [ // little rune glyphs in a unit box (s = along the weapon, w = across)
  [[[-1, -1], [0, 1], [1, -1]]], [[[0, -1], [0, 1]], [[0, -.2], [.9, -1]]], [[[-1, -1], [1, 1]], [[1, -1], [-1, 1]]],
  [[[-.8, 1], [0, -1], [.8, 1]], [[-.4, .2], [.4, .2]]], [[[0, -1], [0, 1]], [[-.9, -.4], [0, .3], [.9, -.4]]], [[[-1, 0], [0, -1], [1, 0], [0, 1], [-1, 0]]],
];
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
/** axis frame from → to.  s = distance along, w = offset across (+ = right of travel) */
function F(from, to) {
  const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const P = (s, w = 0) => [r1(from[0] + ux * s - uy * w), r1(from[1] + uy * s + ux * w)];
  const f = {
    len, P, ax: { from, to },
    poly: (pts, sign = 1) => poly(pts.map(([s, w]) => P(s, w)), sign),
    path: pts => 'M' + pts.map(([s, w]) => P(s, w).join(' ')).join('L'),
    seg: (s0, s1, w = 0, w1 = w) => f.path([[s0, w], [s1, w1]]),
    strip: (s0, s1, w, w1 = w) => f.poly([[s0, -w], [s1, -w1], [s1, w1], [s0, w]]),
    /** slanted wrap lines across a grip */
    ticks: (s0, s1, n, w, slant = 9) => { let d = ''; for (let i = 0; i < n; i++) { const s = s0 + (s1 - s0) * (i + .5) / n; d += f.path([[s - slant, -w], [s + slant, w]]); } return d; },
    /** n rune glyphs spaced along s0..s1 at offset w, glyph half-size h */
    runes: (s0, s1, n, w = 0, h = 9, k0 = 0) => { let d = ''; for (let i = 0; i < n; i++) { const s = s0 + (s1 - s0) * (n === 1 ? .5 : i / (n - 1)); for (const pl of RUNE[(i + k0) % RUNE.length]) d += f.path(pl.map(([a, b]) => [s + a * h * .7, w + b * h])); } return d; },
    /** rust specks scattered along s0..s1 within ±wmax */
    rust: (s0, s1, wmax, n, seed = 1, rmax = 9) => { const R = rng(seed), out = []; for (let i = 0; i < n; i++) { const [x, y] = P(s0 + (s1 - s0) * R(), (R() * 2 - 1) * wmax); out.push([x, y, r1(3 + R() * (rmax - 3))]); } return out; },
  };
  return f;
}
/** standalone rune glyphs at absolute points: [[x,y,rotDeg], ...] */
function runesAt(list, h = 9) { let d = ''; list.forEach(([x, y, rot = 0], i) => { const a = rot * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a); for (const pl of RUNE[i % RUNE.length]) d += 'M' + pl.map(([u, v]) => `${r1(x + (u * ca - v * sa) * h)} ${r1(y + (u * sa + v * ca) * h)}`).join('L'); }); return d; }
/** small 4-point sparkle (unclipped), for tips of polished tiers */
const spark = (x, y, r, a = .9) => `<path d="M${x} ${y - r}Q${x + r * .16} ${y - r * .16} ${x + r} ${y}Q${x + r * .16} ${y + r * .16} ${x} ${y + r}Q${x - r * .16} ${y + r * .16} ${x - r} ${y}Q${x - r * .16} ${y - r * .16} ${x} ${y - r}Z" fill="#fff" opacity="${a}"/>`;
/** transform absolute path commands: uniform scale s about (ox,oy), then translate (tx,ty) */
function xf(cmds, s, ox, oy, tx = 0, ty = 0) {
  const X = x => ox + (x - ox) * s + tx, Y = y => oy + (y - oy) * s + ty;
  return cmds.map(c => { if (c[0] === 'Z') return c; if (c[0] === 'A') return ['A', c[1] * s, c[2] * s, c[3], c[4], c[5], X(c[6]), Y(c[7])];
    const o = [c[0]]; for (let i = 1; i < c.length; i += 2) o.push(X(c[i]), Y(c[i + 1])); return o; });
}
/** an orb/crystal that must look like a gem at every tier (tier 1–2 gem roles are plain metal) */
const orbMat = c => c.tier === 1 ? ['#e4e0d0', '#8f8a7a', '#35322a'] : c.tier === 2 ? 'gem_amber' : 'gem';
const glowDot = (c, x, y, r, m = 'gem', a = .55) => c.T.gemGlow ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${L.MAT[c.T.roles[m] || m][1]}" opacity="${a}" filter="url(#glow)"/>` : '';
const DARK = 'rgba(0,0,0,.42)', LITE = 'rgba(255,255,255,.4)';

module.exports = [
  // ---- REFERENCE RECIPE: copy this pattern ----
  { key: 'w-katana', tiered: true, base: 'delapouite/katana', draw(c) {
    const ax = { from: [150, 345], to: [482, 38] };                       // blade axis: guard → tip
    return {
      body: [
        c.paint(c.sub(0), 'metal'),                                        // blade
        c.paint(c.along(0, .14, ax), 'metal2'),                            // darker blade base near the collar
        c.paint(c.sub(1), 'trim'),                                         // habaki collar
        c.paint(c.sub(2), 'trim'),                                         // tsuba guard
        c.paint(c.sub(3), 'cloth'),                                        // wrapped grip
      ].join(''),
      top: [
        c.shine('M182 322 C 290 210 380 120 470 50', 5, .8),              // edge highlight down the blade
        c.line('M200 318 C 300 214 390 128 452 70', 'rgba(0,0,0,.35)', 4), // hamon / fuller line
        c.line('M48 456 L 96 408 M 40 440 L 80 470 M 62 418 L 96 452', 'rgba(255,255,255,.35)', 5), // grip wrap
        c.rust([[230, 262, 9], [300, 196, 6], [352, 150, 8], [410, 100, 5]]),
        c.engrave('M220 296 C 300 220 360 162 420 106'),
        c.runes('M240 270 l14 -6 M282 230 l10 -12 M326 188 l14 -4 M368 148 l8 -12'),
        c.gem(144, 372, 16),
      ].join(''),
    };
  } },
  // ---- SWORD: classic broadsword — crossguard with E-prongs, ring guard, deep fuller
  { key: 'w-sword', tiered: true, base: 'lorc/broadsword', draw(c) {
    const f = F([45, 469], [485, 29]);                                    // pommel → tip (len 622)
    c.sil = c.sub([0, 2]);                                                 // fill the fuller cut-out so it can be painted
    return {
      body: [
        c.paint(f.strip(250, 660, 200), 'metal'),                          // blade
        c.paint(c.sub(1), c.tier === 1 ? 'iron_dark' : c.tier === 4 ? 'dark' : 'metal2'), // fuller channel
        c.paint(f.strip(135, 252, 300), 'trim'),                           // crossguard + ring
        c.paint(f.strip(41, 137, 300), 'leather'),                         // grip
        c.paint(f.strip(-30, 42, 300), 'trim'),                            // pommel
        c.band(0, 1, { from: f.P(118), to: f.P(137) }),
      ].join(''),
      top: [
        c.shine(f.seg(272, 585, -41), 5, .85),                             // upper edge
        c.line(f.seg(272, 585, 41), 'rgba(0,0,0,.3)', 5),
        c.shine(f.seg(285, 555, -17), 3, .35),                             // fuller lip
        c.line(f.ticks(48, 132, 5, 16), DARK, 5), c.line(f.ticks(48, 132, 5, 16, 12), 'rgba(255,255,255,.18)', 2),
        c.rust(f.rust(270, 600, 38, 11, 3)),
        c.engrave(f.seg(290, 520, -31) + f.seg(290, 520, 31)),
        c.runes(f.runes(305, 545, 5, 0, 8)),
        c.gem(181, 333, 25),
        c.tier >= 3 ? spark(...f.P(598, -12), 16, .8) : '',
      ].join(''),
    };
  } },

  // ---- DAGGER: short, wide leaf blade pointing down-right (opposite diagonal to every sword)
  { key: 'w-dagger', tiered: true, base: 'lorc/broad-dagger', draw(c) {
    const f = F([28, 25], [494, 491]);                                    // pommel → tip (len 659)
    return {
      body: [
        c.paint(c.sub(5), 'metal'),                                        // blade edge
        c.paint(c.sub(6), c.tier === 4 ? 'steel' : c.tier === 1 ? 'iron_dark' : 'metal2'), // raised centre
        c.paint(c.sub(2), 'trim'),                                         // crossguard
        c.paint(c.sub([1, 3, 4]), 'leather'),                              // grip segments
        c.paint(c.sub(0), 'trim'),                                         // pommel
      ].join(''),
      top: [
        c.shine(f.path([[318, -64], [470, -44], [630, -6]]), 6, .85),
        c.line(f.path([[318, 64], [470, 44], [630, 6]]), 'rgba(0,0,0,.3)', 5),
        c.shine(f.seg(300, 560, -12), 3, .3),
        c.line(f.seg(300, 575, 4), 'rgba(0,0,0,.35)', 4),
        c.line(f.ticks(80, 230, 6, 30, 0), 'rgba(0,0,0,.35)', 4),
        c.rust(f.rust(320, 590, 45, 10, 7)),
        c.engrave(f.path([[330, -30], [450, -24], [560, -8]]) + f.path([[330, 30], [450, 24], [560, 8]])),
        c.runes(f.runes(335, 520, 4, 0, 9, 1)),
        c.gem(...f.P(268, 0), 17),
        c.T.gemGlow ? c.gem(...f.P(45, 0), 11, { glow: false }) : '',
        c.tier >= 3 ? spark(...f.P(618, -8), 15, .8) : '',
      ].join(''),
    };
  } },

  // ---- AXE: double-bit battle axe, bright edges, darker cheeks
  { key: 'w-axe', tiered: true, base: 'lorc/battle-axe', draw(c) {
    const f = F([30, 482], [352, 160]);                                   // haft butt → cap (len 455)
    const edge = c.tier === 4 ? 'steel' : 'metal', cheek = c.tier === 4 ? 'steel_black' : c.tier === 1 ? 'iron_dark' : 'metal2';
    return {
      body: [
        c.paint(c.sub([0, 4]), edge),
        c.paint(c.sub([1, 5]), cheek),
        c.paint(c.sub(3), 'trim'),                                         // socket
        c.paint(c.sub(2), 'trim'),                                         // cap
        c.paint(c.sub(6), 'wood'),                                         // haft
        c.paint(f.strip(-20, 95, 40), 'leather'),                          // grip wrap
        c.band(0, 1, { from: f.P(95), to: f.P(112) }),
      ].join(''),
      top: [
        c.shine('M42 268 C 36 182 110 70 240 42', 7, .8),
        c.shine('M244 470 C 330 476 442 402 470 272', 6, .55),
        c.line('M112 262 C 112 178 180 112 262 104', 'rgba(0,0,0,.3)', 4),
        c.line('M250 400 C 334 400 400 334 408 250', 'rgba(0,0,0,.3)', 4),
        c.line(f.ticks(0, 92, 4, 20), DARK, 5),
        c.line(f.seg(110, 250, -6), 'rgba(0,0,0,.3)', 4),                  // wood grain
        c.rust([[60, 200, 9], [120, 120, 7], [180, 70, 8], [300, 460, 9], [400, 410, 7], [450, 330, 8], [150, 220, 6], [330, 380, 6]]),
        c.engrave('M128 248 C 130 186 176 138 240 124 M264 384 C 326 382 376 336 388 272'),
        c.runes(runesAt([[150, 190, -45], [195, 150, -45], [322, 362, -45], [362, 322, -45]], 9)),
        c.gem(258, 255, 19),
      ].join(''),
    };
  } },

  // ---- HAMMER: great block warhammer with face plates and a wrapped haft
  { key: 'w-hammer', tiered: true, base: 'delapouite/thor-hammer', draw(c) {
    const h = F([246, 97], [414, 265]);                                    // across the head, face → face (len 237)
    const f = F([50, 462], [420, 92]);
    return {
      body: [
        c.paint(c.sub(1), 'metal'),                                        // head
        c.paint(c.sub([0, 2]), c.tier === 1 ? 'iron_dark' : 'trim'),       // striking face plates
        c.T.bands ? c.paint(h.strip(22, 40, 90), 'trim') + c.paint(h.strip(197, 215, 90), 'trim') : '',
        c.paint(c.sub(3), 'trim'),                                         // collar
        c.paint(c.sub([4, 5, 6, 7]), 'leather'),                           // wraps
        c.paint(c.sub([8, 9]), 'trim'),                                    // pommel
      ].join(''),
      top: [
        c.shine('M197 160 L 306 51', 6, .8),
        c.shine('M318 52 L 462 196', 4, .45),
        c.line('M360 312 L 462 210', 'rgba(0,0,0,.35)', 5),
        c.line(f.ticks(70, 225, 5, 14, 0), 'rgba(255,255,255,.18)', 3),
        c.rust([[260, 150, 10], [300, 230, 8], [380, 200, 9], [340, 120, 7], [230, 200, 6], [410, 250, 7]]),
        c.engrave(h.poly([[52, -64], [185, -64], [185, 64], [52, 64]])),
        c.runes(h.runes(72, 165, 2, -44, 11) + h.runes(72, 165, 2, 44, 11, 3)),
        c.gem(330, 181, 24),
      ].join(''),
    };
  } },

  // ---- SPEAR: long ash shaft, winged socket, leaf head and a cloth tassel
  { key: 'w-spear', tiered: true, base: 'lorc/spears', draw(c) {
    const f = F([34, 478], [490, 22]);                                     // butt → tip (len 645)
    const W = 60, head = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24; head.push([446 + u * 202, -Math.max(W * Math.pow(Math.sin(Math.PI * Math.pow(u, .42)), 1.25), 17 * (1 - u * 4))]); }
    const headPts = head.concat(head.slice().reverse().map(([s, w]) => [s, -w]));
    const [ax, ay] = f.P(392, 8);
    const tassel = poly([[ax - 16, ay - 6], [ax + 18, ay + 4], [ax + 36, ay + 100], [ax + 10, ay + 118], [ax - 8, ay + 100]]);
    const P = {
      butt: f.poly([[-6, -11], [-6, 11], [4, 20], [30, 20], [30, -20], [4, -20]]),
      shaft: f.strip(20, 410, 17),
      grip: f.strip(140, 245, 20),
      socket: f.poly([[392, -18], [440, -22], [452, -22], [452, 22], [440, 22], [392, 18]]),
      lugs: f.poly([[420, -20], [430, -52], [448, -50], [448, -20]]) + f.poly([[420, 20], [430, 52], [448, 50], [448, 20]]),
      head: f.poly(headPts), tassel, tie: f.strip(384, 402, 21),
    };
    c.sil = Object.values(P).join('');
    return {
      body: [
        c.paint(P.shaft, 'wood'), c.paint(P.grip, 'leather'), c.paint(P.butt, 'trim'),
        c.paint(P.tassel, 'cloth'), c.paint(P.tie, 'trim'),
        c.paint(P.socket, c.tier === 1 ? 'iron_dark' : 'metal2'), c.paint(P.lugs, 'trim'),
        c.paint(P.head, 'metal'),
      ].join(''),
      top: [
        c.line(f.seg(468, 632, 0), 'rgba(0,0,0,.4)', 5),                  // central ridge
        c.shine(f.path(head.slice(3, 22).map(([s, w]) => [s, w * .62])), 5, .8),
        c.line(f.ticks(142, 243, 5, 18), DARK, 5),
        c.line(f.seg(260, 385, 4), 'rgba(0,0,0,.25)', 3),                  // grain
        c.line(`M${ax + 4} ${ay + 24}L${ax + 14} ${ay + 104}M${ax - 2} ${ay + 30}L${ax} ${ay + 96}`, 'rgba(0,0,0,.3)', 3),
        c.rust(f.rust(470, 610, 36, 8, 5, 9)),
        c.engrave(f.path(head.slice(4, 20).map(([s, w]) => [s, w * .34])) + f.path(head.slice(4, 20).map(([s, w]) => [s, -w * .34]))),
        c.runes(f.runes(485, 585, 3, 0, 9)),
        c.gem(...f.P(424, 0), 13),
        c.tier >= 3 ? spark(...f.P(630, -4), 15, .8) : '',
      ].join(''),
    };
  } },

  // ---- RAPIER: needle blade + swept cup hilt with a knuckle bow
  { key: 'w-rapier', tiered: true, base: 'lorc/sword-hilt', draw(c) {
    const f = F([58, 456], [494, 18]);                                     // pommel → tip (len 618)
    const K = 1.42, bow = []; for (let i = 0; i <= 16; i++) { const u = i / 16; bow.push([(8 + u * 100) * K, -(30 + Math.sin(u * Math.PI) * 26 + u * 34) * K]); } // knuckle bow, pommel → quillon
    const bowBand = bow.map(([s, w]) => [s, w - 12]).concat(bow.slice().reverse().map(([s, w]) => [s, w + 12]));
    const P = {
      pommel: circ(...f.P(4, 0), 33),
      grip: f.strip(18, 140, 19, 16),
      bow: f.poly(bowBand) + f.poly([[0, -20], [18, -58], [34, -46], [22, -8]]),
      cup: f.poly([[130, -84], [162, -74], [182, -42], [188, 0], [182, 42], [162, 74], [130, 84], [144, 0]]),
      quillon: f.strip(136, 154, 140) + circ(...f.P(145, 140), 19),
      blade: f.poly([[170, -17], [240, -15], [618, -2.5], [618, 2.5], [240, 15], [170, 17]]),
    };
    c.sil = Object.values(P).join('');
    return {
      body: [
        c.paint(P.blade, 'metal'),
        c.paint(f.strip(170, 222, 19), c.tier === 1 ? 'iron_dark' : 'metal2'), // ricasso
        c.paint(P.grip, c.tier >= 5 ? 'trim' : 'leather'),
        c.paint(P.bow + P.quillon + P.pommel, c.tier === 1 ? 'iron_dull' : 'trim'),
        c.paint(P.cup, c.tier === 1 ? 'iron_dark' : c.tier === 2 ? 'steel' : 'metal2'),
        c.T.bands ? c.paint(f.strip(168, 180, 92), 'trim') : '',
      ].join(''),
      top: [
        c.shine(f.seg(228, 600, -6, -1), 4, .9),
        c.line(f.ticks(24, 136, 7, 18, 7), c.tier >= 5 ? 'rgba(90,60,0,.5)' : DARK, 5),
        c.shine(f.path([[136, -60], [170, -48], [178, 0]]), 5, .55),
        c.rust(f.rust(220, 540, 6, 8, 11, 7)),
        c.engrave(f.path([[142, -54], [166, -28], [170, 0], [166, 28], [142, 54]]), 3),
        c.runes(f.runes(250, 400, 4, 0, 8), 4),
        c.gem(...f.P(160, 0), 16),
        c.tier >= 3 ? spark(...f.P(575, 0), 16, .85) : '',
      ].join(''),
    };
  } },

  // ---- SCYTHE: sweeping crescent blade on a curved snath with a hand nib
  { key: 'w-scythe', tiered: true, base: 'lorc/scythe', draw(c) {
    return {
      body: [
        c.paint(c.sub(1), 'wood'),
        c.paint(poly([[0, 236], [96, 236], [100, 310], [0, 310]]), 'leather'),          // hand nib
        c.paint(poly([[300, 420], [430, 420], [430, 500], [300, 500]]), 'leather'),     // lower grip
        c.paint(c.sub(0), 'metal'),
        c.T.bands ? c.paint(poly([[10, 50], [84, 50], [86, 104], [12, 108]]), 'trim') : '',  // ferrule at the top of the snath
      ].join(''),
      top: [
        c.line('M105 163 C 181 76 394 45 487 128', 'rgba(255,255,255,.32)', 26),        // honed cutting edge
        c.shine('M112 150 C 190 78 390 54 478 122', 5, .9),
        c.line('M95 62 C 170 40 290 26 380 36', 'rgba(0,0,0,.3)', 5),
        c.line('M30 250 L 88 238 M 26 270 L 90 262 M 30 290 L 84 284', DARK, 4),
        c.line('M330 438 L 360 470 M 312 446 L 336 482 M 352 432 L 384 464', DARK, 4),
        c.line('M70 120 C 80 220 200 300 300 360', 'rgba(0,0,0,.25)', 3),
        c.rust([[180, 80, 8], [250, 60, 9], [320, 50, 7], [400, 62, 8], [130, 120, 6], [440, 90, 6]]),
        c.engrave('M150 106 C 230 62 350 48 430 78'),
        c.runes(runesAt([[190, 86, -20], [250, 68, -12], [310, 60, -2], [370, 64, 8]], 8)),
        c.gem(46, 86, 15),
        c.tier >= 3 ? spark(472, 116, 16, .8) : '',
      ].join(''),
    };
  } },

  // ---- FLAIL: spiked ball on a chain, wooden haft
  { key: 'w-flail', tiered: true, base: 'delapouite/flail', draw(c) {
    const f = F([452, 409], [250, 122]);                                  // haft end → top cap
    const spikes = c.tier === 1 ? 'iron_dark' : 'trim';
    return {
      body: [
        c.paint(c.sub(0), c.tier === 1 ? 'iron_dull' : 'metal'),           // chain
        c.paint(c.sub(5), 'wood'),
        c.paint(f.strip(-10, 115, 40), 'leather'),
        c.paint(c.sub([3, 15]), 'trim'),
        c.paint(c.sub(9), 'metal'),                                        // ball
        c.paint(c.sub(8), c.tier === 1 ? 'iron_dark' : 'metal2'),
        c.paint(c.sub([7, 10, 11, 12, 13, 14]), spikes),
        c.band(0, 1, { from: f.P(118), to: f.P(132) }),
      ].join(''),
      top: [
        c.shine('M92 330 C 96 296 120 272 150 262', 6, .75),
        c.line('M232 360 C 222 400 190 424 150 428', 'rgba(0,0,0,.35)', 6),
        c.line(f.ticks(0, 112, 5, 22), DARK, 5),
        c.line(f.seg(140, 330, -5), 'rgba(0,0,0,.25)', 3),
        c.shine(f.seg(140, 330, -12), 3, .3),
        c.rust([[130, 300, 9], [190, 380, 8], [110, 380, 7], [210, 320, 6], [80, 120, 6], [150, 60, 5]]),
        c.engrave(arcLine(160, 343, 62, 0, 360, 30)),
        c.runes(runesAt([[160, 288, 0], [215, 343, 90], [160, 398, 180], [105, 343, 270]], 8)),
        c.gem(160, 343, 22),
      ].join(''),
    };
  } },

  // ---- FISTS: armoured gauntlet fist — plated knuckles, studs, banded bracer
  { key: 'w-fists', tiered: true, base: 'lorc/mailed-fist', draw(c) {
    return {
      body: [
        c.paint(c.sub(8), 'leather'),                                      // hand
        c.paint(c.sub([0, 1, 3, 7, 2, 5]), 'metal'),                       // finger + thumb plates
        c.paint(c.sub([4, 6, 9, 10]), c.tier === 1 ? 'iron_dark' : 'trim'), // knuckle studs
        c.paint(c.sub([11, 13, 14]), c.tier === 1 ? 'iron_dark' : 'trim'),
        c.paint(c.sub(12), 'metal'),
      ].join(''),
      top: [
        c.shine('M186 40 L 214 28 M 268 52 L 296 42 M 342 98 L 372 92 M 410 158 L 440 156 M 92 80 L 118 72', 6, .8),
        c.line('M112 230 C 150 290 230 340 300 360 M 128 186 C 170 250 250 300 330 316', 'rgba(0,0,0,.28)', 4),
        c.line('M120 262 C 160 310 230 346 290 366', 'rgba(255,230,190,.25)', 3, true, 'stroke-dasharray="10 12"'),
        c.shine('M70 336 C 120 380 190 412 262 432', 3, .4),
        c.line('M40 396 C 90 440 160 466 240 478', 'rgba(0,0,0,.3)', 3),
        c.rust([[210, 60, 7], [300, 90, 8], [370, 140, 6], [440, 190, 7], [90, 180, 6], [150, 420, 7], [200, 450, 6]]),
        c.engrave('M150 250 C 190 230 230 250 250 280 C 270 310 310 320 340 300'),
        c.runes(runesAt([[96, 410, 28], [146, 436, 24], [196, 455, 18], [242, 466, 12]], 8)),
        c.gem(248, 300, 22),
      ].join(''),
    };
  } },

  // ---- BOW: recurve bow at rest, straight string, broadhead arrow nocked (arrow = lorc/high-shot scaled; limbs drawn)
  { key: 'w-bow', tiered: true, base: 'lorc/high-shot', draw(c) {
    const G = L.subpaths(L.loadGI('lorc/high-shot')), K = .62;
    const arrow = xf(G[0], K, 493, 20), sign = Math.sign(area(ptsOf(arrow)));
    const A = [22, 104], B = [408, 490], M = [321, 191], C = [2 * M[0] - (A[0] + B[0]) / 2, 2 * M[1] - (A[1] + B[1]) / 2];
    const q = t => [(1 - t) ** 2 * A[0] + 2 * t * (1 - t) * C[0] + t * t * B[0], (1 - t) ** 2 * A[1] + 2 * t * (1 - t) * C[1] + t * t * B[1]];
    const limbPts = (t0, t1, n = 24, wmul = 1) => { const L1 = [], L2 = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, [x, y] = q(t), [x2, y2] = q(Math.min(1, t + .001)), [x0, y0] = q(Math.max(0, t - .001));
      const dx = x2 - x0, dy = y2 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, w = (11 + 15 * Math.sin(Math.PI * t) ** 1.5) * wmul; L1.push([x + nx * w, y + ny * w]); L2.push([x - nx * w, y - ny * w]); } return L1.concat(L2.reverse()); };
    const s = F(A, B);
    const P = {
      limbs: poly(limbPts(0, 1, 32), sign),
      tips: circ(...A, 17, 20, sign) + circ(...B, 17, 20, sign),
      string: s.poly([[0, -5], [s.len, -5], [s.len, 5], [0, 5]], sign),
      arrow: L.fmt(arrow),
    };
    c.sil = P.string + P.limbs + P.tips + P.arrow;
    const a = F([206, 306], [493, 20]);                                   // arrow nock → tip (len ~405)
    const ln = pts => 'M' + pts.map(p => p.map(r1).join(' ')).join('L');
    return {
      body: [
        c.paint(P.limbs, 'wood'),
        c.paint(poly(limbPts(.4, .6, 8, 1.3)), 'leather'),                 // grip
        c.T.bands ? c.paint(poly(limbPts(.37, .4, 2, 1.3)) + poly(limbPts(.6, .63, 2, 1.3)) + poly(limbPts(.06, .1, 2, 1.4)) + poly(limbPts(.9, .94, 2, 1.4)), 'trim') : '',
        c.paint(P.tips, c.tier === 1 ? 'iron_dark' : 'trim'),
        c.paint(P.arrow, 'wood'),
        c.paint(a.strip(330, 420, 60), 'metal'),                           // broadhead
        c.paint(a.strip(-10, 100, 46), c.tier <= 2 ? 'bone' : 'cloth'),     // fletching
        c.paint(P.string, 'string'),
      ].join(''),
      top: [
        c.shine(ln([.08, .2, .32, .44].map(t => { const [x, y] = q(t); return [x - 6, y - 6]; })), 5, .55),
        c.line(ln([.56, .7, .84, .94].map(t => { const [x, y] = q(t); return [x + 7, y + 7]; })), 'rgba(0,0,0,.3)', 4),
        c.line([.43, .47, .51, .55].map(t => { const [x, y] = q(t); return `M${r1(x - 24)} ${r1(y + 4)}L${r1(x + 4)} ${r1(y - 24)}`; }).join(''), DARK, 4),
        c.shine(a.seg(345, 400, -5), 3, .8),
        c.line(a.seg(0, 60, 0), 'rgba(0,0,0,.35)', 4),
        c.rust([[470, 40, 6], [446, 64, 5]]),
        c.engrave(ln([.14, .24, .34].map(t => q(t))) + ln([.66, .76, .86].map(t => q(t)))),
        c.runes(runesAt([.16, .27, .73, .84].map(t => { const [x, y] = q(t); return [x, y, 45]; }), 8)),
        c.gem(...q(.5).map(r1), 15),
        c.tier >= 3 ? spark(480, 32, 15, .8) : '',
      ].join(''),
    };
  } },

  // ---- CROSSBOW: steel prod, wooden stock, stirrup at the front
  { key: 'w-xbow', tiered: true, base: 'carl-olsen/crossbow', draw(c) {
    const f = F([40, 472], [381, 131]);                                   // butt → stirrup (len 482)
    return {
      body: [
        c.paint(c.sub(0), c.tier === 1 ? 'iron_dull' : 'metal'),           // prod
        c.paint(poly([[60, 58], [114, 58], [128, 345], [86, 380], [60, 380]]) + poly([[150, 386], [462, 398], [462, 450], [150, 450]]), 'string'),
        c.paint(f.strip(-20, 470, 34), 'wood'),                            // stock
        c.paint(f.strip(-20, 70, 40), c.tier === 1 ? 'wood_dark' : 'leather'), // butt pad
        c.paint(f.strip(372, 470, 60), c.tier === 1 ? 'iron_dark' : 'metal2'), // prod mount
        c.paint(c.sub(1), 'trim'),                                         // stirrup
        c.band(0, 1, { from: f.P(70), to: f.P(84) }),
        c.band(0, 1, { from: f.P(250), to: f.P(264) }),
      ].join(''),
      top: [
        c.shine('M104 50 C 160 72 230 96 290 140', 5, .7),
        c.shine('M388 210 C 420 260 440 320 470 400', 4, .5),
        c.line(f.seg(90, 360, -10), 'rgba(0,0,0,.25)', 3),
        c.shine(f.seg(90, 360, -18), 3, .25),
        c.rust([[180, 80, 8], [250, 115, 6], [420, 300, 7], [450, 360, 6], [140, 360, 6]]),
        c.engrave(f.seg(110, 230, -14) + f.seg(110, 230, 14)),
        c.runes(runesAt([[200, 80, 25], [260, 110, 35], [420, 280, 70], [445, 345, 75]], 8)),
        c.gem(...f.P(170, 0), 15),
      ].join(''),
    };
  } },

  // ---- CANNON: hand cannon — dark barrel with bronze reinforcing bands, wooden carriage
  { key: 'w-cannon', tiered: true, base: 'lorc/cannon', draw(c) {
    const b = F([110, 206], [500, 206]);                                  // barrel axis breech → muzzle (len 390)
    const bandM = c.tier === 1 ? 'iron_dark' : 'bronze', bands = c.tier >= 3 ? 'trim' : bandM;
    const wheel = []; for (let i = 0; i <= 28; i++) { const t = i / 28 * Math.PI * 2; wheel.push([261 + Math.cos(t) * 98, Math.max(272, 318 + Math.sin(t) * 98)]); }
    return {
      body: [
        c.paint(c.sil, c.tier === 1 ? 'iron_dull' : 'metal2'),           // barrel
        c.paint(b.strip(0, 52, 200) + b.strip(88, 106, 200) + b.strip(232, 250, 200) + b.strip(352, 400, 200), bands),
        c.paint(poly([[0, 420], [0, 360], [140, 250], [200, 300], [110, 420]]), 'wood'),   // trail
        c.paint(poly([[150, 272], [392, 272], [392, 312], [150, 312]]), 'wood'),          // carriage cheek
        c.paint(poly(wheel), 'wood'),                                        // wheel rim
        c.paint(c.sub(2), c.tier === 1 ? 'iron_dark' : 'trim'),              // hub + spokes
        c.paint(poly([[120, 100], [160, 100], [160, 165], [120, 165]]), c.tier === 1 ? 'iron_dark' : 'trim'), // fuse
      ].join(''),
      top: [
        c.shine('M210 156 L 470 174', 7, .6),
        c.line('M200 252 L 380 262', 'rgba(0,0,0,.35)', 6),
        c.line('M30 384 L 140 290', 'rgba(0,0,0,.3)', 3),
        c.line(arcLine(261, 318, 84, 15, 165), 'rgba(0,0,0,.35)', 4),
        c.rust([[250, 180, 9], [320, 200, 8], [400, 190, 9], [440, 230, 7], [180, 210, 7]]),
        c.engrave(b.seg(130, 220, -24) + b.seg(130, 220, 24) + b.seg(270, 340, -26) + b.seg(270, 340, 26)),
        c.runes(b.runes(275, 335, 3, 0, 11)),
        c.gem(...b.P(170, 0), 17),
        c.T.gemGlow ? `<circle cx="134" cy="104" r="18" fill="#ffb040" opacity=".85" filter="url(#glow)"/>` + spark(134, 104, 14, .9) : '',
      ].join(''),
    };
  } },

  // ---- STAFF: crescent-moon staff head cradling a glowing orb
  { key: 'w-staff', tiered: true, base: 'delapouite/crescent-staff', draw(c) {
    const f = F([30, 482], [170, 342]);
    const orb = orbMat(c);
    return {
      under: c.tier >= 3 ? `<circle cx="319" cy="299" r="${60 + c.tier * 6}" fill="${L.MAT[typeof orb === 'string' ? (c.T.roles[orb] || orb) : 'crystal'][1]}" opacity=".3" filter="url(#glow)"/>` : '',
      body: [
        c.paint(c.sub(1), c.tier === 1 ? 'wood_plain' : 'metal'),          // crescent
        c.paint(c.sub([0, 2, 3]), c.tier === 1 ? 'iron_dark' : 'trim'),     // spikes
        c.paint(c.sub(6), 'wood'),                                         // haft
        c.paint(f.strip(-40, 60, 60), 'leather'),
        c.paint(c.sub(5), 'trim'),                                         // collar
        c.paint(c.sub(4), orb),                                            // orb
      ].join(''),
      top: [
        c.shine('M196 110 C 160 150 160 200 176 250', 6, .7),
        c.shine('M250 92 C 330 92 420 150 480 236', 4, .45),
        `<ellipse cx="300" cy="272" rx="22" ry="13" fill="#fff" opacity=".75" transform="rotate(-40 300 272)"/>`,
        c.T.gemGlow ? c.line(arcLine(319, 299, 34, 160, 330), 'rgba(255,255,255,.55)', 4) : '',
        c.line(f.ticks(-30, 55, 4, 40), DARK, 5),
        c.rust([[180, 160, 8], [200, 260, 7], [300, 100, 6], [400, 150, 6], [90, 440, 6]]),
        c.engrave('M206 130 C 186 170 190 220 210 262'),
        c.runes(runesAt([[200, 150, 100], [196, 200, 90], [210, 248, 70], [300, 100, -10], [370, 130, 30]], 8)),
        c.gem(...f.P(150, 0), 13),
      ].join(''),
    };
  } },

  // ---- WAND: short rod tipped with a faceted crystal in a claw setting
  { key: 'w-wand', tiered: true, base: 'lorc/crystal-wand', draw(c) {
    const f = F([20, 492], [200, 312]);
    const orb = orbMat(c);
    return {
      under: c.tier >= 3 ? `<circle cx="380" cy="140" r="${55 + c.tier * 8}" fill="${L.MAT[typeof orb === 'string' ? (c.T.roles[orb] || orb) : 'crystal'][1]}" opacity=".32" filter="url(#glow)"/>` : '',
      body: [
        c.paint(c.sub([0, 1, 2, 3]), orb),                                 // crystal
        `<path d="${c.sub([1, 3])}" fill="#000" opacity=".22" clip-path="url(#sil)"/>`, // shaded facets
        `<path d="${c.sub(0)}" fill="#fff" opacity=".18" clip-path="url(#sil)"/>`,
        c.paint(c.sub(4), c.tier === 1 ? 'iron_dark' : 'trim'),             // claw setting
        c.paint(c.sub(5), c.tier === 1 ? 'iron_dull' : 'trim'),
        c.paint(c.sub(6), c.tier === 1 ? 'iron_dark' : 'metal2'),
        c.paint(c.sub(8), 'wood'),
        c.paint(c.sub(7), c.tier === 1 ? 'iron_dark' : 'trim'),
      ].join(''),
      top: [
        c.shine('M318 152 L 382 92', 5, .85), c.shine('M260 140 L 352 48', 4, .55),
        spark(392, 104, c.tier >= 3 ? 22 : 14, c.tier >= 3 ? .9 : .5),
        c.line(f.ticks(30, 200, 6, 20), DARK, 4),
        c.rust([[60, 440, 5], [110, 390, 6], [150, 350, 5]]),
        c.engrave(f.seg(40, 190, -8)),
        c.runes(f.runes(50, 190, 4, 0, 9)),
        c.gem(...f.P(234, 0), 12),
      ].join(''),
    };
  } },

  // ---- TOME: leather-bound grimoire, metal corners, gilded sigil, clasp
  { key: 'w-tome', tiered: true, base: 'lorc/book-cover', draw(c) {
    const A = [103, 26], B = [392, 49], C = [482, 395], D = [193, 372];
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const corner = (p, q, r, t = .2) => poly([p, lerp(p, q, t), lerp(p, r, t * .8)]);
    const corners = corner(A, B, D) + corner(B, A, C) + corner(C, D, B) + corner(D, C, A);
    const clasp = poly([lerp(B, C, .44), lerp(B, C, .58), lerp(lerp(A, D, .58), lerp(B, C, .58), .8), lerp(lerp(A, D, .44), lerp(B, C, .44), .8)]);
    return {
      body: [
        c.paint(c.sub(0), c.tier === 6 ? 'cloth_royal' : 'leather'),       // cover
        c.paint(c.sub(2), c.tier === 1 ? 'leather_plain' : c.tier === 6 ? 'leather_tooled' : 'wood_dark'), // spine
        c.paint(c.sub([1, 6]), c.tier === 1 ? 'iron_dark' : 'trim'),       // spine caps
        c.paint(c.sub(7), c.tier === 1 ? 'cloth_plain' : 'bone'),          // pages
        c.paint(corners, c.tier === 1 ? 'iron_dull' : 'trim'),
        c.paint(clasp, c.tier === 1 ? 'iron_dark' : 'trim'),
        c.tier === 1 ? '' : c.paint(poly([[60, 150], [175, 150], [175, 166], [60, 166]]) + poly([[70, 280], [190, 280], [190, 296], [70, 296]]), 'trim'), // spine ridges
      ].join(''),
      top: [
        c.tier >= 2 ? `<path d="${c.sub([3, 4, 5])}" fill="${c.mat('trim')}" stroke="#0b0910" stroke-width="3"/>` : '', // gilded sigil
        c.T.gemGlow ? `<path d="${c.sub(4)}" fill="none" stroke="${L.MAT[c.T.roles.gem][1]}" stroke-width="10" opacity=".5" filter="url(#glow)"/>` : '',
        c.line('M118 42 L 196 352', 'rgba(255,255,255,.3)', 4),
        c.line('M160 408 L 440 430 M 158 428 L 438 450 M 158 448 L 436 468', 'rgba(90,70,40,.45)', 3),
        c.line(poly([lerp(A, C, .06), lerp(B, D, .06), lerp(C, A, .06), lerp(D, B, .06)]), 'rgba(255,230,180,.22)', 3, true, 'stroke-dasharray="9 9"'), // stitching
        c.rust([[150, 60, 6], [400, 70, 6], [460, 370, 7], [210, 360, 6]]),
        c.engrave(poly([lerp(A, C, .12), lerp(B, D, .12), lerp(C, A, .12), lerp(D, B, .12)])),
        c.runes(runesAt([[180, 300, 5], [235, 316, 5], [380, 326, 5], [430, 330, 5]], 9)),
        c.gem(316, 336, 17),
      ].join(''),
    };
  } },

  // ---- CHAKRAM: heavy bladed throwing ring — inner ring of hooked blades (delapouite/chakram, inner hole shrunk for a bolder ring)
  { key: 'w-chakram', tiered: true, base: 'delapouite/chakram', draw(c) {
    const G = L.subpaths(L.loadGI('delapouite/chakram')), K = .68;
    c.sil = L.fmt(G[0]) + G.slice(1).map(g => L.fmt(xf(g, K, 256, 256))).join('');
    const ang = (a, r) => [r1(256 + Math.cos(a * Math.PI / 180) * r), r1(256 + Math.sin(a * Math.PI / 180) * r)];
    const wraps = a0 => [0, 1, 2, 3, 4].map(i => { const a = a0 + i * 9; return `M${ang(a, 198).join(' ')}L${ang(a + 5, 240).join(' ')}`; }).join('');
    return {
      body: [
        c.paint(c.sil, c.tier === 4 ? 'steel_pol' : c.tier === 1 ? 'iron_dull' : 'metal'),  // honed inner blades
        c.paint(arcBand(256, 256, 196, 245, 0, 360, 48), c.tier === 1 ? 'iron_dark' : c.tier === 4 ? 'steel_black' : c.tier === 3 ? 'steel' : 'metal2'), // outer rim
        c.T.bands ? c.paint(arcBand(256, 256, 190, 202, 0, 360, 48), 'trim') : '',
        c.paint(arcBand(256, 256, 196, 245, 200, 250, 10) + arcBand(256, 256, 196, 245, 20, 70, 10), 'leather'), // grips
      ].join(''),
      top: [
        c.shine(arcLine(256, 256, 228, 255, 300, 12) + arcLine(256, 256, 228, 75, 120, 12), 5, .7),
        c.shine(arcLine(256, 256, 160, 0, 360, 48), 4, .45),
        c.line(arcLine(256, 256, 232, 300, 345, 12), 'rgba(0,0,0,.3)', 5),
        c.line(wraps(204) + wraps(24), DARK, 5),
        c.rust([[100, 120, 7], [400, 110, 8], [450, 300, 6], [300, 460, 7], [60, 300, 6], [180, 40, 6], [256, 90, 6], [256, 420, 6]]),
        c.engrave(arcLine(256, 256, 218, 95, 185, 18) + arcLine(256, 256, 218, 275, 365, 18)),
        c.runes(runesAt([[...ang(100, 218), 190], [...ang(170, 218), 260], [...ang(280, 218), 10], [...ang(350, 218), 80]], 9)),
        c.gem(...ang(135, 218), 15),
        c.gem(...ang(315, 218), 15),
      ].join(''),
    };
  } },

  // ---- GLAIVE: long single-edged blade on a pole (blade scaled from delapouite/glaive, pole added)
  { key: 'w-glaive', tiered: true, base: 'delapouite/glaive', draw(c) {
    const G = L.subpaths(L.loadGI('delapouite/glaive')), S = .84, T = (x, y) => [r1(489 + (x - 489) * S), r1(25 + (y - 25) * S)];
    const blade = xf(G[0], S, 489, 25), collar = xf(G[1], S, 489, 25), sign = Math.sign(area(ptsOf(collar)));
    const f = F(T(98, 426), [26, 486]);                                   // collar → butt (len ~ 200)
    const P = { pole: f.poly([[-6, -18], [f.len - 18, -18], [f.len - 18, 18], [-6, 18]], sign), butt: f.poly([[f.len - 30, -19], [f.len - 4, -19], [f.len + 14, 0], [f.len - 4, 19], [f.len - 30, 19]], sign) };
    c.sil = L.fmt(blade) + L.fmt(collar) + P.pole + P.butt;
    const tp = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => T(+x, +y).join(' '));
    return {
      body: [
        c.paint(L.fmt(blade), 'metal'),
        c.paint(tp('M98 388 L 137 433 L 300 300 L 250 250 Z'), c.tier === 1 ? 'iron_dark' : 'metal2'), // tang end of blade
        c.paint(P.pole, 'wood'), c.paint(f.strip(60, 150, 18), 'leather'),
        c.paint(L.fmt(collar) + P.butt, 'trim'),
        c.band(0, 1, { from: f.P(18), to: f.P(32) }),
      ].join(''),
      top: [
        c.shine(tp('M222 366 C 260 335 302 296 338 254 C 402 180 458 98 476 42'), 6, .85),
        c.line(tp('M108 388 C 190 314 290 226 364 154'), 'rgba(0,0,0,.35)', 5),
        c.line(tp('M180 345 C 240 296 300 238 360 168'), 'rgba(0,0,0,.25)', 4),
        c.shine(tp('M248 140 C 300 126 340 124 358 140'), 3, .4),
        c.line(f.ticks(64, 146, 4, 18), DARK, 5),
        c.rust([[300, 230, 8], [360, 180, 9], [400, 120, 7], [250, 290, 6], [430, 90, 6]].map(([x, y, r]) => [...T(x, y), r])),
        c.engrave(tp('M200 340 C 260 290 320 230 380 150')),
        c.runes(runesAt([[240, 296, -45], [282, 256, -48], [322, 214, -52], [358, 170, -58]].map(([x, y, a]) => [...T(x, y), a]), 8)),
        c.gem(...T(118, 412), 13),
        c.tier >= 3 ? spark(...T(482, 40), 15, .8) : '',
      ].join(''),
    };
  } },

  // ---- SHURIKEN: four-point throwing star with blood grooves
  { key: 'w-shuriken', tiered: true, base: 'lorc/shuriken', draw(c) {
    return {
      body: [
        c.paint(c.sub(0), 'metal'),
        c.paint(circ(251, 260, 104), c.tier === 1 ? 'iron_dark' : c.tier === 4 ? 'steel' : 'metal2'),
        c.T.bands ? c.paint(arcBand(251, 260, 90, 104, 0, 360, 40), 'trim') : '',
      ].join(''),
      top: [
        c.shine('M124 164 L 121 40 M 346 130 L 462 126', 6, .85),
        c.shine('M30 384 L 150 300 M 380 470 L 376 352', 4, .4),
        c.line('M180 380 L 160 384 M 334 120 L 250 105', 'rgba(0,0,0,.3)', 4),
        c.rust([[130, 90, 7], [420, 140, 8], [80, 360, 7], [370, 420, 8], [300, 200, 6], [190, 330, 6]]),
        c.engrave(arcLine(251, 260, 97, 0, 360, 36)),
        c.runes(runesAt([[132, 100, 90], [410, 130, 0], [76, 372, 180], [374, 420, 270]], 9)),
        c.T.hasGem ? `<circle cx="251" cy="260" r="58" fill="${c.mat('metal2')}" stroke="#0b0910" stroke-width="7"/>` + c.gem(251, 260, 30) : '',
        c.tier >= 3 ? spark(122, 30, 16, .8) + spark(478, 124, 13, .6) : '',
      ].join(''),
    };
  } },

  // ---- SCEPTER: winged royal sceptre with a crescent-moon orb
  { key: 'w-scepter', tiered: true, base: 'delapouite/winged-scepter', draw(c) {
    c.sil = c.sub([0, 2, 3, 4, 5, 7, 8, 9, 10]);                          // fill the orb and shaft inlay so they can be painted
    const orb = orbMat(c);
    return {
      under: c.tier >= 3 ? `<circle cx="256" cy="89" r="${55 + c.tier * 6}" fill="${L.MAT[typeof orb === 'string' ? (c.T.roles[orb] || orb) : 'crystal'][1]}" opacity=".32" filter="url(#glow)"/>` : '',
      body: [
        c.paint(c.sub(0), c.tier === 1 ? 'iron_dull' : 'trim'),
        c.paint(c.sub([2, 3, 7, 8]), 'metal'),
        c.paint(c.sub([4, 5]), c.tier === 1 ? 'iron_dark' : c.tier === 4 ? 'steel' : 'metal2'),
        c.paint(c.sub([9, 10]), c.tier === 1 ? 'iron_dull' : c.tier >= 5 ? 'metal' : 'cloth'),
        c.paint(c.sub(1), orb),
        c.paint(c.sub(6), c.tier >= 3 ? orb : 'dark'),
        c.T.bands ? c.paint(poly([[220, 410], [292, 410], [292, 432], [220, 432]]) + poly([[220, 466], [292, 466], [292, 496], [220, 496]]), c.tier === 2 ? 'steel' : 'metal') : '',
      ].join(''),
      top: [
        c.shine('M60 92 C 110 130 160 160 210 176 M 452 92 C 402 130 352 160 302 176', 4, .5),
        c.shine('M242 182 L 242 480', 3, .45),
        `<ellipse cx="282" cy="70" rx="13" ry="8" fill="#fff" opacity=".7" transform="rotate(-35 282 70)"/>`,
        c.line('M70 300 C 110 330 160 360 210 372 M 442 300 C 402 330 352 360 302 372', 'rgba(0,0,0,.3)', 4),
        c.rust([[100, 120, 7], [400, 120, 7], [150, 230, 6], [360, 230, 6], [245, 300, 5]]),
        c.engrave('M86 214 C 130 232 170 244 208 250 M 426 214 C 382 232 342 244 304 250'),
        c.runes(runesAt([[110, 320, 30], [160, 345, 25], [402, 320, -30], [352, 345, -25]], 9)),
        c.gem(256, 190, 13),
      ].join(''),
    };
  } },
];
