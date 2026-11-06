// Legendary-power emblems — one overlay per UNQ key (source/1_data.js, 1e_more.js, 1h_gear.js).
// Drawn ON TOP of any weapon / armour icon at the same size (see itemIcon in source/0_icons.js), so:
//   * the centre stays clear — effects hug the edges and corners,
//   * a small round badge in the bottom-right quadrant carries a flat game-icon glyph for the power.
// base: null → no silhouette, so nothing here uses c.paint / c.sub (they clip to the silhouette).
'use strict';

const BX = 410, BY = 410, BR = 88;                       // badge centre + radius (≈172 units across)
const DARK = ['#3b3446', '#1b1724', '#07060b'];
const INK = '#0b0910';

// ---------------------------------------------------------------- helpers
const f1 = v => Math.round(v * 10) / 10;
/** a glowing stroke: dark outline (reads over bright items) + coloured glow + colour + white-hot core */
function glow(d, col, w = 10, core = true) {
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f1(w * 2.6)}" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#glow)"/>`
    + `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 8}" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`
    + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
    + (core ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="${f1(w * .38)}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>` : '');
}
/** a glowing filled blob (any d) */
function glowFill(d, col, hi = '#fff') {
  return `<path d="${d}" fill="${col}" opacity=".6" filter="url(#glow)"/>`
    + `<path d="${d}" fill="${col}" stroke="${INK}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`
    + (hi ? `<path d="${d}" fill="${hi}" opacity=".35"/>` : '');
}
/** glowing dot */
function dot(x, y, r, col) {
  return `<circle cx="${x}" cy="${y}" r="${f1(r * 2.2)}" fill="${col}" opacity=".55" filter="url(#glow)"/>`
    + `<circle cx="${x}" cy="${y}" r="${r + 3.5}" fill="${INK}" opacity=".8"/>`
    + `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/><circle cx="${x}" cy="${y}" r="${f1(r * .45)}" fill="#fff"/>`;
}
/** jagged lightning through points */
const zig = pts => 'M' + pts.map(p => p.join(' ')).join('L');
/** flame tongue standing at x,y (base), height h, width w, leaning by lean */
function flameD(x, y, h, w, lean = 0) {
  return `M${x - w / 2} ${y}C${x - w / 2} ${y - h * .45} ${x - w * .1 + lean * .5} ${y - h * .55} ${x + lean} ${y - h}`
    + `C${x + w * .25 + lean * .4} ${y - h * .6} ${x + w / 2} ${y - h * .4} ${x + w / 2} ${y}Q${x} ${y + w * .35} ${x - w / 2} ${y}Z`;
}
function flame(x, y, h, w, lean, pal) {
  return glowFill(flameD(x, y, h, w, lean), pal[1], null) + `<path d="${flameD(x, y + 2, h * .55, w * .45, lean * .5)}" fill="${pal[0]}"/>`;
}
/** diamond crystal spike from (x,y) pointing at angle a (deg), length L, half-width w */
function spikeD(x, y, a, L, w) {
  const r = a * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r), px = -uy, py = ux;
  const P = (s, t) => `${f1(x + ux * s + px * t)} ${f1(y + uy * s + py * t)}`;
  return `M${P(-L * .12, 0)}L${P(L * .28, w)}L${P(L, 0)}L${P(L * .28, -w)}Z`;
}
/** blood drip hanging from y0 at x, length L, width w */
function dripD(x, y0, L, w) {
  return `M${x - w / 2} ${y0}L${x - w * .35} ${y0 + L - w}C${x - w * .9} ${y0 + L - w * .2} ${x - w * .45} ${y0 + L + w * .55} ${x} ${y0 + L + w * .55}`
    + `C${x + w * .45} ${y0 + L + w * .55} ${x + w * .9} ${y0 + L - w * .2} ${x + w * .35} ${y0 + L - w}L${x + w / 2} ${y0}Z`;
}
/** the round power badge in the bottom-right quadrant */
function badge(c, glyph, pal, o = {}) {
  const s = o.s || .33, gx = BX + (o.dx || 0), gy = BY + (o.dy || 0);
  return [
    `<circle cx="${BX}" cy="${BY}" r="${BR + 14}" fill="${pal[1]}" opacity=".45" filter="url(#glow)"/>`,
    `<circle cx="${BX}" cy="${BY}" r="${BR + 6}" fill="${INK}"/>`,
    `<circle cx="${BX}" cy="${BY}" r="${BR}" fill="${c.mat(pal)}"/>`,
    `<circle cx="${BX}" cy="${BY}" r="${BR - 14}" fill="${c.mat(DARK)}" stroke="${INK}" stroke-width="4"/>`,
    c.place(`<path d="${c.gi(glyph)}" fill="${pal[1]}" opacity=".7" filter="url(#glow)"/><path d="${c.gi(glyph)}" fill="${c.mat(['#ffffff', pal[0], pal[1]])}" stroke="${INK}" stroke-width="14" stroke-linejoin="round" paint-order="stroke"/>`, gx, gy, s, o.rot || 0),
  ].join('');
}
function badgeTop(pal) { // glint on the rim
  return `<path d="M${BX - 70} ${BY - 40} A ${BR - 6} ${BR - 6} 0 0 1 ${BX - 20} ${BY - 79}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>`
    + `<circle cx="${BX}" cy="${BY}" r="${BR - 14}" fill="none" stroke="${pal[0]}" stroke-width="3" opacity=".5"/>`;
}

// palette per power: [hi, mid, lo]
const PAL = {
  chain: ['#e6f8ff', '#4cc2ff', '#0a3a6a'],       // sky-blue lightning
  explode: ['#fff0a0', '#ff7a1a', '#6a1800'],     // ember orange
  multi: ['#ffe0f6', '#ff5ac8', '#5a0a48'],       // magenta
  frost: ['#ffffff', '#9ee6ff', '#2a6a9a'],       // pale ice
  echo: ['#f0e4ff', '#b88aff', '#3a1a7a'],        // lavender
  giant: ['#ffe6b0', '#e09a40', '#5a3208'],       // bronze
  thunder: ['#fffbd0', '#ffd82a', '#6a5000'],     // yellow
  reaper: ['#eaffd0', '#86f04a', '#1c4a08'],      // grave green
  storm: ['#e8eaff', '#7c86ff', '#1a1a6a'],       // indigo
  pierce: ['#ffffff', '#c8d8ec', '#4a5a74'],      // silver
  vamp: ['#ffb0b8', '#e01834', '#4a0010'],        // crimson
  orbit: ['#fff6c0', '#ffb420', '#7a3a00'],       // sun gold
  phoenix: ['#ffe8a0', '#ff4a1e', '#5a0c00'],     // phoenix red
  haste: ['#e0fff4', '#4ef0b8', '#0a5a40'],       // mint wind
  colossus: ['#f0dcc0', '#b08460', '#3e2412'],    // clay / earth
  kindled: ['#fff2c0', '#ff9a30', '#702a00'],     // warm ember
  bloodlet: ['#ffc0c0', '#ff3a4a', '#600010'],    // bright blood
  overcharge: ['#fffad8', '#ffc83a', '#7a3800'],  // overcharged ember-gold
  giantslay: ['#ffd8c8', '#ff6a4a', '#5a1408'],   // coral red
  secondwind: ['#f0fffe', '#7ef6ff', '#0e5a6a'],  // aqua breath
  stoneskin: ['#ece6da', '#a8a090', '#3a352c'],   // granite
  vampshroud: ['#f0c0ff', '#a83ad8', '#3a0a50'],  // night purple
  executioner: ['#ffc8b0', '#c8302a', '#3a0606'], // dried blood
  soulleech: ['#e0fff8', '#40f0d0', '#06504a'],   // spectral teal
  bulwark: ['#fff6d0', '#f0c050', '#6a4a10'],     // gold
  swiftstep: ['#e8fbff', '#40d8ff', '#064a6a'],   // cyan dash
};

// ---------------------------------------------------------------- shared edge motifs
const fx = {
  arcs(col) { // crackling lightning hugging the top-left, top and left edges
    return [
      glow(zig([[22, 196], [52, 150], [34, 128], [70, 86], [56, 66], [96, 30]]), col, 14),
      glow(zig([[150, 22], [196, 48], [222, 24], [262, 44], [296, 16]]), col, 11),
      glow(zig([[476, 60], [492, 104], [470, 128], [496, 168]]), col, 10),
      glow(zig([[60, 86], [92, 96]]), col, 5), glow(zig([[222, 24], [232, 52]]), col, 4),
      dot(96, 30, 7, col), dot(296, 16, 6, col), dot(22, 196, 6, col),
    ].join('');
  },
  embers(pal, n = 9) { // embers drifting up off the top edge
    const P = [[70, 92, 11], [118, 46, 9], [168, 74, 7], [214, 28, 10], [262, 60, 7], [310, 22, 9], [356, 52, 7], [404, 30, 8], [452, 72, 10], [36, 150, 7], [480, 132, 7]];
    return P.slice(0, n).map(([x, y, r]) => dot(x, y, r, pal[1])).join('');
  },
};

// ---------------------------------------------------------------- recipes
const R = {};

R.chain = (c, p) => ({ top: fx.arcs(p[1]), glyph: 'lorc/arcing-bolt' });

R.explode = (c, p) => ({
  top: [
    // burst rays out of the top-left corner + embers up the top edge
    glow('M30 30L96 96M20 92L72 112M92 20L112 72', p[1], 11),
    glowFill('M58 58L74 20L86 56L122 42L96 74L132 92L92 96L100 132L74 104L46 126L58 92L20 84L54 72Z', p[1]),
    `<path d="M70 66L78 46L84 66L100 62L88 76L104 86L86 86L88 104L76 90L62 100L68 84L50 80L66 74Z" fill="${p[0]}"/>`,
    fx.embers(p, 11).slice(0),
  ].join(''), glyph: 'lorc/bright-explosion' });

R.multi = (c, p) => ({ // three slicing waves fanning off the top-left and top-right
  top: [
    glow('M40 200Q30 100 110 40', p[1], 14), glow('M84 210Q74 130 150 70', p[1], 9),
    glow('M300 30Q400 28 470 96', p[1], 14), glow('M320 70Q400 70 450 130', p[1], 9),
    glow('M14 330Q8 280 24 250', p[1], 7),
    `<path d="M110 40l-26 4 10 -24z M470 96l-6 -26 22 12z" fill="${p[0]}" stroke="${INK}" stroke-width="5" paint-order="stroke"/>`,
  ].join(''), glyph: 'delapouite/split-arrows' });

R.frost = (c, p) => {
  const cluster = (x, y, a) => [[a, 140, 22], [a - 36, 96, 16], [a + 36, 96, 16], [a - 66, 60, 12], [a + 66, 60, 12]]
    .map(([aa, L, w]) => spikeD(x, y, aa, L, w)).join('');
  const d = cluster(0, 0, 45) + cluster(512, 0, 135) + cluster(0, 512, -45);
  return { top: [
    `<path d="${d}" fill="${p[1]}" opacity=".6" filter="url(#glow)"/>`,
    `<path d="${d}" fill="${c.mat(['#ffffff', p[1], p[2]])}" stroke="${INK}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>`,
    `<path d="M10 10L100 100M502 10L412 100M10 502L100 412" stroke="#fff" stroke-width="4" opacity=".8"/>`,
    ...[[150, 36], [250, 18], [36, 160], [476, 170], [180, 480]].map(([x, y]) => `<path d="M${x} ${y - 14}V${y + 14}M${x - 12} ${y - 7}L${x + 12} ${y + 7}M${x - 12} ${y + 7}L${x + 12} ${y - 7}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M${x} ${y - 14}V${y + 14}M${x - 12} ${y - 7}L${x + 12} ${y + 7}M${x - 12} ${y + 7}L${x + 12} ${y - 7}" stroke="#eaffff" stroke-width="4" stroke-linecap="round"/>`),
  ].join(''), glyph: 'lorc/snowflake-2' };
};

R.echo = (c, p) => ({ // concentric ripples in the top-left corner, faint echo arcs top-right
  top: [
    glow('M20 150A130 130 0 0 1 150 20', p[1], 10), glow('M20 220A200 200 0 0 1 220 20', p[1], 7, false),
    glow('M20 290A270 270 0 0 1 290 20', p[1], 4, false),
    glow('M492 150A130 130 0 0 0 362 20', p[1], 6, false), glow('M492 220A200 200 0 0 0 292 20', p[1], 3, false),
    dot(40, 40, 10, p[1]),
  ].join(''), glyph: 'lorc/echo-ripples' });

R.giant = (c, p) => ({ // huge bronze corner brackets: everything is bigger
  top: [
    glow('M20 150V20H150', p[1], 18, false), glow('M362 20H492V150', p[1], 18, false), glow('M20 362V492H150', p[1], 18, false),
    glow('M60 60L120 120M120 120V82M120 120H82', p[0], 8, false),
    glow('M452 60L392 120M392 120V82M392 120H430', p[0], 8, false),
    glow('M60 452L120 392M120 392V430M120 392H82', p[0], 8, false),
  ].join(''), glyph: 'delapouite/giant', s: .3 });

R.thunder = (c, p) => ({ // big bolt striking down the left edge + a cloud lip on top
  top: [
    `<path d="M10 60Q30 10 90 26Q120 -6 170 20Q210 4 240 34Q200 50 140 44Q80 60 10 60Z" fill="#3a3a52" stroke="${INK}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`,
    glowFill('M84 40L38 170H74L30 300L118 140H80L128 40Z', p[1], null),
    `<path d="M100 54L64 156H92L66 238L104 152H82Z" fill="#fff" opacity=".8"/>`,
    glow(zig([[180, 44], [200, 90], [186, 110], [206, 150]]), p[1], 6),
    dot(30, 300, 9, p[1]),
  ].join(''), glyph: 'lorc/thunder-struck' });

R.reaper = (c, p) => ({ // a curved scythe blade sweeping round the top-left corner + wisps
  top: [
    `<path d="M24 260C10 130 110 20 260 24C150 54 70 120 62 250Z" fill="${p[1]}" opacity=".5" filter="url(#glow)"/>`,
    c.shape('M24 260C10 130 110 20 260 24C150 54 70 120 62 250Z', ['#f4ffe8', '#9fb8a0', '#2a3a2c']),
    `<path d="M40 230C36 140 100 54 220 34" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>`,
    glow('M470 40q-20 30 0 60t0 60', p[1], 6, false), glow('M420 30q-14 20 0 40t0 40', p[1], 4, false),
    dot(470, 40, 6, p[1]),
  ].join(''), glyph: 'lorc/reaper-scythe' });

R.storm = (c, p) => ({ // storm cloud along the top with two forks raining off it
  top: [
    `<path d="M40 70Q30 24 86 28Q110 -4 160 16Q200 -6 240 22Q290 4 320 34Q370 24 380 60Q350 84 300 72Q250 90 200 74Q150 92 100 78Q60 90 40 70Z" fill="${c.mat(['#8a8cb8', '#45466e', '#1c1c34'])}" stroke="${INK}" stroke-width="8" stroke-linejoin="round" paint-order="stroke"/>`,
    glow(zig([[110, 80], [86, 130], [112, 140], [70, 210]]), p[1], 9),
    glow(zig([[300, 76], [322, 112], [300, 124], [330, 170]]), p[1], 7),
    glow(zig([[470, 40], [488, 90], [470, 110], [492, 160]]), p[1], 6),
    `<path d="M120 26Q160 14 200 30" stroke="#fff" stroke-width="5" fill="none" opacity=".4" stroke-linecap="round"/>`,
  ].join(''), glyph: 'lorc/lightning-storm' });

R.pierce = (c, p) => ({ // speed streaks along top and left with a sharp arrowhead flying out top-right
  top: [
    glow('M30 40H250', p[1], 12), glow('M80 76H210', p[1], 8, false), glow('M40 104V300', p[1], 11), glow('M76 150V250', p[1], 7, false),
    c.shape('M300 30L420 30L400 8L496 40L400 72L420 50L300 50Z', ['#ffffff', '#c8d8ec', '#4a5a74']),
    `<path d="M410 30L480 40" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  ].join(''), glyph: 'lorc/supersonic-arrow' });

R.vamp = (c, p) => {
  const d = [[60, 50, 14], [104, 74, 18], [150, 40, 12], [200, 60, 16], [250, 34, 11], [300, 56, 15], [356, 40, 12], [420, 70, 14]]
    .map(([x, L, w]) => dripD(x, 0, L, w)).join('');
  const lip = 'M10 -2H500V14Q470 28 440 18Q400 30 360 16Q320 28 280 18Q240 30 200 16Q150 30 110 18Q60 28 10 14Z';
  return { top: [
    `<path d="${lip + d}" fill="${p[1]}" opacity=".45" filter="url(#glow)"/>`,
    `<path d="${lip + d}" fill="${c.mat(['#ff5a6a', '#b0001c', '#3a0008'])}" stroke="${INK}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>`,
    ...[[104, 88, 6], [200, 72, 5], [300, 66, 5]].map(([x, y, r]) => `<circle cx="${x - 3}" cy="${y}" r="${r}" fill="#fff" opacity=".6"/>`),
    `<path d="${dripD(20, 160, 46, 14)}" fill="#b0001c" stroke="${INK}" stroke-width="5" paint-order="stroke"/>`,
  ].join(''), glyph: 'lorc/heart-drop' };
};

R.orbit = (c, p) => ({ // a burning ring circling the whole icon with two flame orbs on it
  under: `<ellipse cx="256" cy="256" rx="232" ry="232" fill="none" stroke="${p[1]}" stroke-width="20" opacity=".35" filter="url(#glow)"/>`,
  top: [
    `<path d="M40 340A232 232 0 0 1 340 40" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" opacity=".8"/>`,
    `<path d="M40 340A232 232 0 0 1 340 40" fill="none" stroke="${p[1]}" stroke-width="6" stroke-linecap="round" stroke-dasharray="26 18"/>`,
    `<path d="M472 172A232 232 0 0 1 488 240" fill="none" stroke="${p[1]}" stroke-width="6" stroke-linecap="round"/>`,
    dot(92, 92, 22, p[1]), flame(92, 104, 70, 40, 20, p), dot(440, 120, 15, p[1]), flame(440, 130, 50, 28, 14, p),
  ].join(''), glyph: 'lorc/fire-ring' });

R.phoenix = (c, p) => {
  const wing = 'M0 0C-40 -30 -60 -90 -40 -150C-30 -110 -10 -90 10 -80C0 -120 6 -160 30 -190C30 -140 40 -110 60 -96C64 -130 80 -150 100 -160C90 -110 90 -60 60 -20C40 0 20 6 0 0Z';
  return { top: [
    `<g transform="translate(70 230) rotate(-14)"><path d="${wing}" fill="${p[1]}" opacity=".6" filter="url(#glow)"/><path d="${wing}" fill="${c.mat(['#ffe8a0', '#ff6a1e', '#7a0c00'])}" stroke="${INK}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/></g>`,
    `<g transform="translate(442 230) rotate(14) scale(-1 1)"><path d="${wing}" fill="${p[1]}" opacity=".6" filter="url(#glow)"/><path d="${wing}" fill="${c.mat(['#ffe8a0', '#ff6a1e', '#7a0c00'])}" stroke="${INK}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/></g>`,
    flame(256, 40, 50, 30, 0, p), dot(200, 28, 5, p[1]), dot(312, 28, 5, p[1]),
  ].join(''), glyph: 'lorc/eagle-emblem', s: .31 };
};

R.haste = (c, p) => ({ // swirling wind lines along left and top edges
  top: [
    glow('M20 300C10 200 40 120 110 70C150 40 200 30 250 34', p[1], 13),
    glow('M60 260C56 190 90 130 150 100C170 92 190 88 200 96C210 106 196 120 180 116', p[1], 9),
    glow('M300 22C360 18 420 36 470 70', p[1], 10),
    glow('M330 56C380 56 420 70 450 96', p[1], 3, false),
    glow('M24 380C18 350 20 330 30 320', p[1], 5, false),
  ].join(''), glyph: 'lorc/wingfoot' });

R.colossus = (c, p) => ({ // heavy stone shoulder-plates in the top corners + a stone foot bottom-left
  top: [
    c.shape('M8 8H150L132 44L64 52L48 126L8 150Z', ['#f0dcc0', '#9a7454', '#3e2412']),
    c.shape('M504 8H362L380 44L448 52L464 126L504 150Z', ['#f0dcc0', '#9a7454', '#3e2412']),
    c.shape('M8 504V380L44 396L52 448L120 464L140 504Z', ['#f0dcc0', '#9a7454', '#3e2412']),
    `<path d="M30 30L56 60M24 94L44 100M90 22L96 40M482 30L456 60M488 94L468 100M422 22L416 40M30 480L56 452M90 488L96 470" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".7"/>`,
    `<path d="M14 14H140M498 14H372" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/>`,
  ].join(''), glyph: 'delapouite/rock-golem', s: .3 });

R.kindled = (c, p) => ({ // a row of small flames licking up from the bottom-left + embers
  top: [
    flame(30, 500, 110, 44, -6, p), flame(80, 504, 80, 36, 6, p), flame(132, 506, 60, 30, 10, p), flame(26, 380, 60, 28, -4, p),
    fx.embers(p, 6),
  ].join(''), glyph: 'lorc/burning-embers' });

R.bloodlet = (c, p) => {
  const slash = (x0, y0, x1, y1, w) => { // tapered crescent from (x0,y0) to (x1,y1), bulging toward the corner
    const mx = (x0 + x1) / 2 - 30, my = (y0 + y1) / 2 - 30;
    return `M${x0} ${y0}Q${mx} ${my} ${x1} ${y1}Q${mx + w} ${my + w} ${x0} ${y0}Z`;
  };
  const d = slash(20, 180, 180, 20, 34) + slash(56, 232, 232, 56, 40) + slash(110, 262, 262, 110, 30);
  const bl = ['#ff5a6a', '#d0102a', '#3a0008'];
  return { top: [
    `<path d="${d}" fill="${p[1]}" opacity=".55" filter="url(#glow)"/>`,
    `<path d="${d}" fill="${c.mat(bl)}" stroke="${INK}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`,
    `<path d="${dripD(64, 150, 40, 15) + dripD(118, 190, 56, 17) + dripD(170, 222, 36, 13)}" fill="${c.mat(bl)}" stroke="${INK}" stroke-width="6" paint-order="stroke"/>`,
    `<path d="M40 150Q60 60 150 40M80 196Q104 100 196 80" fill="none" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/>`,
  ].join(''), glyph: 'lorc/dripping-blade' };
};

R.overcharge = (c, p) => ({ // a ring of sparks pulsing round the edge with crackle at each quarter
  under: `<circle cx="256" cy="256" r="236" fill="none" stroke="${p[1]}" stroke-width="16" opacity=".35" filter="url(#glow)"/>`,
  top: [
    `<path d="M24 256A232 232 0 0 1 256 24A232 232 0 0 1 488 256" fill="none" stroke="${INK}" stroke-width="14" opacity=".8"/>`,
    `<path d="M24 256A232 232 0 0 1 256 24A232 232 0 0 1 488 256" fill="none" stroke="${p[1]}" stroke-width="6" stroke-dasharray="4 22" stroke-linecap="round"/>`,
    glow(zig([[60, 92], [96, 100], [92, 70], [124, 74]]), p[1], 7), glow(zig([[452, 92], [416, 100], [420, 70], [388, 74]]), p[1], 7),
    glow(zig([[226, 10], [246, 40], [266, 16], [286, 44]]), p[1], 7),
    dot(24, 256, 10, p[1]), dot(256, 24, 10, p[1]), dot(488, 256, 10, p[1]),
  ].join(''), glyph: 'lorc/sparky-bomb' });

R.giantslay = (c, p) => ({ // a cracked giant's skull-crest top-left, crack lines + a falling sword mark
  top: [
    glow(zig([[20, 20], [70, 60], [56, 90], [110, 120], [100, 160]]), p[1], 14, false),
    glow(zig([[70, 60], [110, 50], [140, 80]]), p[1], 10, false),
    glow(zig([[56, 90], [24, 120]]), p[1], 8, false),
    c.shape('M470 20L494 44L362 176L350 188L330 192L334 172L346 160Z', ['#ffffff', '#c8d0dc', '#4a5262']),
    c.shape('M330 150L376 196L368 204L322 158Z', ['#ffe6b0', '#e09a40', '#5a3208']),
  ].join(''), glyph: 'lorc/sword-in-stone', s: .31 });

R.secondwind = (c, p) => ({ // breath gusts curling in from the left edge and over the top
  top: [
    glow('M10 120C60 110 90 140 80 170C70 196 40 190 44 168', p[1], 13),
    glow('M10 220C80 210 140 230 150 270', p[1], 9),
    glow('M140 20C200 40 250 40 300 20C330 10 360 24 350 50C340 70 316 60 320 44', p[1], 12),
    glow('M400 30C440 30 470 50 490 80', p[1], 5, false),
    dot(10, 120, 6, p[1]),
  ].join(''), glyph: 'delapouite/lungs' });

R.stoneskin = (c, p) => {
  const st = ['#ece6da', '#a8a090', '#3a352c'];
  return { top: [ // jagged granite plates fused to the corners + edges
    c.shape('M6 6L130 6L118 40L74 48L58 96L22 120L6 112Z', st), c.shape('M140 6H236L228 30H150Z', st),
    c.shape('M506 6L382 6L394 40L438 48L454 96L490 120L506 112Z', st), c.shape('M6 506L6 382L40 394L48 438L96 454L120 490L112 506Z', st),
    c.shape('M6 150L30 140L34 236L6 250Z', st),
    `<path d="M40 14L62 38M98 18L90 40M24 70L46 80M472 14L450 38M414 18L422 40M488 70L466 80M14 472L38 450M18 414L40 422M70 488L80 466" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`,
    `<path d="M14 14H120M392 14H498" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`,
  ].join(''), glyph: 'lorc/stone-block', s: .3 };
};

R.vampshroud = (c, p) => {
  const bat = 'M0 0C-10 -14 -26 -18 -44 -12C-36 -6 -34 2 -36 10C-28 4 -20 4 -14 10C-10 4 -4 2 0 6C4 2 10 4 14 10C20 4 28 4 36 10C34 2 36 -6 44 -12C26 -18 10 -14 0 0Z';
  return { top: [ // a tattered dark cloak edge across the top with bats flitting off it
    `<path d="M0 0H512V30L480 70L460 40L420 90L392 44L350 74L320 36L280 64L240 30L200 66L170 34L130 80L100 40L60 92L36 50L0 80Z" fill="${p[1]}" opacity=".45" filter="url(#glow)"/>`,
    c.shape('M0 0H512V30L480 70L460 40L420 90L392 44L350 74L320 36L280 64L240 30L200 66L170 34L130 80L100 40L60 92L36 50L0 80Z', ['#7a3a9a', '#3a1250', '#120418']),
    ...[[70, 150, 2.4], [446, 150, 2], [40, 250, 1.6]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="${bat}" fill="${p[1]}" opacity=".6" filter="url(#glow)"/><path d="${bat}" fill="#1a0a24" stroke="${p[1]}" stroke-width="3" stroke-linejoin="round"/></g>`),
  ].join(''), glyph: 'lorc/batwing-emblem' };
};

R.executioner = (c, p) => ({ // a heavy axe-blade crescent in the top-left with a blood edge
  top: [
    `<path d="M10 210C10 100 100 10 210 10L180 70C120 80 80 120 70 180Z" fill="${p[1]}" opacity=".45" filter="url(#glow)"/>`,
    c.shape('M10 210C10 100 100 10 210 10L180 70C120 80 80 120 70 180Z', ['#d8dce4', '#6a707e', '#1e2028']),
    `<path d="M16 200C18 104 104 18 200 16" fill="none" stroke="${c.mat(['#ff6a5a', '#c8302a', '#3a0606'])}" stroke-width="12"/>`,
    `<path d="${dripD(46, 120, 30, 12) + dripD(100, 52, 22, 10)}" fill="#c8302a" stroke="${INK}" stroke-width="4" paint-order="stroke"/>`,
    glow('M470 30L490 50M440 30L490 80', p[1], 5, false),
  ].join(''), glyph: 'delapouite/executioner-hood', s: .31 });

R.soulleech = (c, p) => ({ // spectral wisps being drawn in from the top corners
  top: [
    glow('M30 30C60 80 30 120 70 160C100 190 140 170 150 140', p[1], 12),
    glow('M482 30C450 80 482 120 442 160C412 190 372 170 362 140', p[1], 12),
    glow('M220 10C240 40 270 40 290 10', p[1], 5, false),
    dot(30, 30, 12, p[1]), dot(482, 30, 12, p[1]), dot(256, 30, 6, p[1]),
    ...[[30, 30], [482, 30]].map(([x, y]) => `<circle cx="${x - 4}" cy="${y - 2}" r="2.5" fill="${INK}"/><circle cx="${x + 4}" cy="${y - 2}" r="2.5" fill="${INK}"/>`),
  ].join(''), glyph: 'delapouite/soul' });

R.bulwark = (c, p) => {
  const g = ['#fff6d0', '#e0a830', '#5a3a08'];
  return { top: [ // gilded shield-rim brackets in three corners with rivets
    c.shape('M8 8H170L150 30H30V150L8 170Z', g), c.shape('M504 8H342L362 30H482V150L504 170Z', g), c.shape('M8 504V342L30 362V482H150L170 504Z', g),
    ...[[50, 50], [462, 50], [50, 462]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${c.mat(g)}" stroke="${INK}" stroke-width="6"/><circle cx="${x - 4}" cy="${y - 4}" r="4" fill="#fff"/>`),
    `<path d="M16 16H150M496 16H362" stroke="#fff" stroke-width="4" opacity=".7" stroke-linecap="round"/>`,
  ].join(''), glyph: 'lorc/shield-reflect' };
};

R.swiftstep = (c, p) => ({ // after-image dash streaks trailing off the left edge
  top: [
    glow('M8 120H150', p[1], 15), glow('M30 166H120', p[1], 10, false), glow('M8 210H84', p[1], 7, false),
    glow('M8 320H96', p[1], 12), glow('M30 358H74', p[1], 7, false),
    glow('M370 24H490', p[1], 10), glow('M414 56H490', p[1], 7, false),
  ].join(''), glyph: 'lorc/sprint' });

// ---------------------------------------------------------------- export
module.exports = Object.keys(PAL).map(k => ({
  key: 'e-' + k, base: null, tier: 4,
  draw(c) {
    const p = PAL[k], r = R[k](c, p);
    return { under: r.under || '', body: badge(c, r.glyph, p, { s: r.s }), top: r.top + badgeTop(p) };
  },
}));
