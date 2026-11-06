// Armour SET pieces — one single (tier 4) recipe per SETS piece (source/1f_features.js): s-<setkey>-<slot>.
// Every set has its own palette (built from its `col`) and a motif drawn as details, so the pieces of a set
// read as a family while each still reads as its slot at 42px.
//   warden  Warden's Vigil        green steel + gold, glowing leaf/vine etching, emeralds
//   hunter  Ashen Hunter          ash-grey + ember orange, feathers and fur, amber gems
//   storm   Stormcaller's Regalia blue + pale silver, lightning-bolt trim, storm sapphires
//   tide    Tidebound Plate       teal + pearl, wave scallops and shells, aquamarines
//   clock   Clockwork Precision   brass + copper, gears and rivets, ruby bearings
//   void    Voidwalker Shroud     deep violet/black + lilac silver, star-flecked void, void gems
'use strict';
const L = require('../lib');

// set palettes (prefixed so they never clash with other recipe files)
Object.assign(L.MAT, {
  set_warden_steel: ['#ffffff', '#c4dccd', '#4a6a5a'], set_warden_green: ['#7fe0a8', '#1f8a52', '#062a16'],
  set_warden_dark: ['#a8d8bc', '#4f8a6c', '#132e22'],
  set_ash: ['#f1ece6', '#9a928b', '#3a3431'], set_ash_dark: ['#b8aea6', '#5e5550', '#211c1a'],
  set_ember: ['#ffe6a8', '#ff9a3a', '#7a2a00'], set_ash_leather: ['#c8b6a6', '#6f5e52', '#28201b'], set_ash_fur: ['#f4ece2', '#b3a698', '#4c4239'],
  set_storm_silver: ['#ffffff', '#cfe2f8', '#5d7ca6'], set_storm_blue: ['#cfe8ff', '#4a8cff', '#0e2a72'],
  set_gem_storm: ['#eef8ff', '#58b8ff', '#0a3a8a'],
  set_tide_teal: ['#ccfff6', '#38bfb0', '#0a4440'], set_tide_deep: ['#8fe8dc', '#1f7f78', '#06302e'],
  set_pearl: ['#ffffff', '#e8f2ee', '#8ea8a4'], set_gem_aqua: ['#e2fffb', '#2ee6d4', '#04524c'],
  set_brass: ['#fff4bc', '#d9a840', '#5c3c08'], set_brass_dark: ['#e6c070', '#8a6420', '#2e1e04'],
  set_void_black: ['#a68cd6', '#3a2860', '#0d0718'], set_void_silver: ['#f6efff', '#bfa6e6', '#54407a'],
  set_void_cloth: ['#a77af0', '#432080', '#120628'],
});

const R = {
  warden: { metal: 'set_warden_steel', metal2: 'set_warden_dark', trim: 'gold', cloth: 'set_warden_green', leather: 'set_warden_dark', gem: 'gem_emer' },
  hunter: { metal: 'set_ash', metal2: 'set_ash_dark', trim: 'set_ember', cloth: 'set_ash_fur', leather: 'set_ash_leather', gem: 'gem_amber' },
  storm: { metal: 'set_storm_silver', metal2: 'set_storm_blue', trim: 'set_storm_silver', cloth: 'set_storm_blue', leather: 'set_storm_blue', gem: 'set_gem_storm' },
  tide: { metal: 'set_tide_teal', metal2: 'set_tide_deep', trim: 'set_pearl', cloth: 'set_tide_deep', leather: 'set_tide_deep', gem: 'set_gem_aqua' },
  clock: { metal: 'set_brass', metal2: 'set_brass_dark', trim: 'copper', cloth: 'set_brass_dark', leather: 'leather_tooled', gem: 'gem_ruby' },
  void: { metal: 'set_void_black', metal2: 'set_void_black', trim: 'set_void_silver', cloth: 'set_void_cloth', leather: 'set_void_black', gem: 'gem_void' },
};
const GLOW = { warden: '#7dffb8', hunter: '#ffa040', storm: '#a8dcff', tide: '#8ffff0', clock: '#ffd870', void: '#d8a8ff' };

// ---------------------------------------------------------------- motif helpers (return SVG markup)
const n = v => Math.round(v * 10) / 10;
/** glowing stroke, clipped to the silhouette unless clip=false */
function glow(d, col, w = 6, clip = true) {
  const cp = clip ? 'clip-path="url(#sil)"' : '';
  return `<g ${cp}><path d="${d}" fill="none" stroke="${col}" stroke-width="${w * 2.6}" stroke-linecap="round" stroke-linejoin="round" opacity=".45" filter="url(#glow)"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
/** filled flat shape with dark outline */
function flat(d, col, extra = '') { return `<path d="${d}" fill="${col}" stroke="#0b0910" stroke-width="5" stroke-linejoin="round" paint-order="stroke" ${extra}/>`; }
/** 4-point sparkle star */
function starD(x, y, r, k = .22) { const q = r * k; return `M${n(x)} ${n(y - r)}L${n(x + q)} ${n(y - q)}L${n(x + r)} ${n(y)}L${n(x + q)} ${n(y + q)}L${n(x)} ${n(y + r)}L${n(x - q)} ${n(y + q)}L${n(x - r)} ${n(y)}L${n(x - q)} ${n(y - q)}Z`; }
function sparkle(x, y, r, col = '#fff', clip = false) {
  return `<g ${clip ? 'clip-path="url(#sil)"' : ''}><circle cx="${x}" cy="${y}" r="${r * .9}" fill="${col}" opacity=".5" filter="url(#glow)"/><path d="${starD(x, y, r)}" fill="#fff"/></g>`;
}
/** leaf: base at x,y, pointing along angle (deg) */
function leafD(x, y, len, ang, wid = .42) {
  const a = ang * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, w = len * wid;
  const tx = x + ux * len, ty = y + uy * len, mx = x + ux * len * .45, my = y + uy * len * .45;
  return `M${n(x)} ${n(y)}Q${n(mx + px * w)} ${n(my + py * w)} ${n(tx)} ${n(ty)}Q${n(mx - px * w)} ${n(my - py * w)} ${n(x)} ${n(y)}Z`;
}
/** vine: a stroke path + leaves [[x,y,len,ang],...] in glowing green */
function vine(d, leaves, col = GLOW.warden, w = 5) {
  return `<g clip-path="url(#sil)"><path d="${d}" fill="none" stroke="#0b2a18" stroke-width="${w + 5}" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" stroke="#ffd36a" stroke-width="${w}" stroke-linecap="round"/>`
    + leaves.map(([x, y, l, a]) => `<path d="${leafD(x, y, l * 1.15, a, .5)}" fill="${col}" opacity=".6" filter="url(#glow)"/><path d="${leafD(x, y, l * 1.15, a, .5)}" fill="${col}" stroke="#0b2a18" stroke-width="4" paint-order="stroke"/>`).join('') + '</g>';
}
/** lightning bolt polygon, top at x,y, height h, leaning by rotation rot */
function boltD(x, y, h, rot = 0) {
  const pts = [[.18, 0], [-.22, .56], [.04, .54], [-.16, 1], [.3, .4], [.04, .42], [.32, 0]];
  const a = rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return 'M' + pts.map(([px, py]) => { const X = px * h, Y = py * h; return `${n(x + X * c - Y * s)} ${n(y + X * s + Y * c)}`; }).join('L') + 'Z';
}
function bolt(x, y, h, rot = 0, col = '#e8f6ff') {
  const d = boltD(x, y, h, rot);
  return `<path d="${d}" fill="${GLOW.storm}" opacity=".6" filter="url(#glow)"/><path d="${d}" fill="${col}" stroke="#0b1a3a" stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>`;
}
/** zig-zag lightning line through points */
function zig(pts) { return 'M' + pts.map(p => p.map(n).join(' ')).join('L'); }
/** gear outline with n teeth (evenodd hole) */
function gearD(x, y, r, teeth = 8, hole = .38) {
  const pts = []; const ri = r * .76;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, st = Math.PI * 2 / teeth;
    for (const [f, rr] of [[0, ri], [.12, r], [.42, r], [.54, ri]]) { const a = a0 + st * f; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  }
  const h = r * hole;
  return 'M' + pts.map(p => p.map(n).join(' ')).join('L') + `ZM${n(x + h)} ${n(y)}A${n(h)} ${n(h)} 0 1 0 ${n(x - h)} ${n(y)}A${n(h)} ${n(h)} 0 1 0 ${n(x + h)} ${n(y)}Z`;
}
function gear(c, x, y, r, teeth = 8, m = 'trim', rot = 0) {
  return `<path d="${gearD(x, y, r, teeth)}" fill-rule="evenodd" fill="${c.mat(m)}" stroke="#1a0f02" stroke-width="5" stroke-linejoin="round" paint-order="stroke" transform="rotate(${rot} ${x} ${y})"/>`
    + `<circle cx="${x}" cy="${y}" r="${n(r * .16)}" fill="#fff6c8"/>`;
}
/** wave scallops along a horizontal line from x0 to x1 at y */
function wavesD(x0, x1, y, amp = 14, count = 4) {
  const w = (x1 - x0) / count; let d = `M${n(x0)} ${n(y)}`;
  for (let i = 0; i < count; i++) { const a = x0 + i * w; d += `Q${n(a + w * .25)} ${n(y - amp)} ${n(a + w * .5)} ${n(y)}T${n(a + w)} ${n(y)}`; }
  return d;
}
/** curling wave crest: spiral hook starting at x,y, size s, mirrored when flip */
function curlD(x, y, s, flip = false) {
  const f = flip ? -1 : 1;
  return `M${n(x - f * s)} ${n(y + s * .5)}C${n(x - f * s * .5)} ${n(y - s * .6)} ${n(x + f * s * .8)} ${n(y - s * .7)} ${n(x + f * s * .7)} ${n(y + s * .05)}C${n(x + f * s * .6)} ${n(y + s * .45)} ${n(x + f * s * .1)} ${n(y + s * .4)} ${n(x + f * s * .2)} ${n(y)}`;
}
/** scallop shell badge at x,y radius r */
function shell(x, y, r, col = 'url(#m_set_pearl)') {
  let d = `M${n(x)} ${n(y + r * .7)}`; const rib = [];
  d += `L${n(x - r)} ${n(y - r * .1)}A${n(r)} ${n(r * .95)} 0 0 1 ${n(x + r)} ${n(y - r * .1)}Z`;
  for (let i = 1; i < 6; i++) { const a = Math.PI + (i / 6) * Math.PI; rib.push(`M${n(x)} ${n(y + r * .7)}L${n(x + Math.cos(a) * r * .92)} ${n(y - r * .1 + Math.sin(a) * r * .88)}`); }
  return `<path d="${d}" fill="${col}" stroke="#062a28" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/><path d="${rib.join('')}" stroke="#2b7f78" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${n(x - r * .35)} ${n(y + r * .78)}h${n(r * .7)}" stroke="#062a28" stroke-width="7" stroke-linecap="round"/>`;
}
/** feather: quill from x,y towards ang, length len */
function feather(x, y, len, ang, vane = '#9a928b', tip = GLOW.hunter) {
  const a = ang * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, w = len * .2;
  const P = (t, o) => `${n(x + ux * len * t + px * o)} ${n(y + uy * len * t + py * o)}`;
  const body = `M${P(.12, 0)}C${P(.3, w * 1.3)} ${P(.8, w)} ${P(1, 0)}C${P(.8, -w)} ${P(.3, -w * 1.3)} ${P(.12, 0)}Z`;
  const tipD = `M${P(.72, w * .85)}C${P(.86, w * .6)} ${P(.96, w * .25)} ${P(1, 0)}C${P(.96, -w * .25)} ${P(.86, -w * .6)} ${P(.72, -w * .85)}Z`;
  const notches = [.35, .5, .62].map(t => `M${P(t, 0)}L${P(t + .1, w * 1.05)}M${P(t + .05, 0)}L${P(t + .14, -w * 1.05)}`).join('');
  return `<path d="${body}" fill="${vane}" stroke="#141010" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/><path d="${tipD}" fill="${tip}"/><path d="${notches}" stroke="#141010" stroke-width="3" fill="none"/><path d="M${P(0, 0)}L${P(.97, 0)}" stroke="#f6efe6" stroke-width="3.5" stroke-linecap="round"/>`;
}
/** fur tufts along a line: list of [x,y] tips → small spiky strokes */
function furD(x0, x1, y, h = 22, count = 7, dir = 1) {
  const w = (x1 - x0) / count; let d = `M${n(x0)} ${n(y)}`;
  for (let i = 0; i < count; i++) { const a = x0 + i * w; d += `L${n(a + w * .5)} ${n(y + dir * h * (i % 2 ? .8 : 1.1))}L${n(a + w)} ${n(y)}`; }
  return d;
}
/** scattered void stars */
function stars(list) { return list.map(([x, y, r]) => r > 9 ? sparkle(x, y, r, GLOW.void, true) : `<circle cx="${x}" cy="${y}" r="${r * .45}" fill="#f4e8ff" clip-path="url(#sil)"/>`).join(''); }

const W = GLOW;
module.exports = [
  // ================================================================ WARDEN'S VIGIL — green steel, gold, leaf & vine
  { key: 's-warden-helm', tier: 4, base: 'kier-heyl/elf-helmet', roles: R.warden, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([0, 1]), 'cloth'), c.paint(c.sub(2), 'metal'), c.paint(c.sub(3), 'trim'), c.paint(c.sub(4), 'gem')].join(''),
      top: [
        vine('M196 456 C150 340 118 210 100 56', [[170, 380, 40, 200], [146, 300, 40, 195], [128, 220, 38, 190], [112, 140, 34, 190]]),
        vine('M316 456 C362 340 394 210 412 56', [[342, 380, 40, -20], [366, 300, 40, -15], [384, 220, 38, -10], [400, 140, 34, -10]]),
        vine('M186 170 Q256 80 326 170', [[220, 120, 30, -60], [292, 120, 30, -120]]),
        c.shine('M175 100 Q256 30 337 100', 5, .7),
        c.gem(256, 258, 17),
      ].join(''),
    };
  } },
  { key: 's-warden-armor', tier: 4, base: 'delapouite/cape-armor', roles: R.warden, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([6, 7]), 'cloth'), c.paint(c.sub([0, 1]), 'metal'), c.paint(c.sub(2), 'trim'), c.paint(c.sub(5), 'metal2'), c.paint(c.sub([8, 9, 11]), 'metal'), c.paint(c.sub(10), 'trim')].join(''),
      top: [
        vine('M140 440 Q256 370 372 440', [[180, 418, 30, 150], [220, 400, 30, -70], [292, 400, 30, -110], [332, 418, 30, 30]]),
        vine('M120 160 Q256 120 392 160', [[170, 145, 26, -100], [342, 145, 26, -80]]),
        vine('M110 470 C100 380 90 300 70 210', [[98, 360, 30, 200], [86, 280, 28, 195]]),
        vine('M402 470 C412 380 422 300 442 210', [[414, 360, 30, -20], [426, 280, 28, -15]]),
        c.shine('M40 40 Q100 30 160 60', 5, .6), c.shine('M352 60 Q412 30 472 40', 5, .6),
        c.gem(125, 122, 13), c.gem(387, 122, 13), c.gem(256, 312, 17),
      ].join(''),
    };
  } },
  { key: 's-warden-gloves', tier: 4, base: 'lorc/fist', roles: R.warden, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([5, 7]), 'cloth'), c.paint(c.sub(8), 'trim'), c.paint(c.sub(4), 'metal')].join(''),
      top: [
        vine('M90 300 C130 250 180 260 200 330 M250 370 C290 300 360 280 430 300', [[120, 270, 30, -100], [180, 290, 30, 60], [300, 320, 30, -100], [380, 290, 30, -60]]),
        c.line('M120 70 l0 50 M220 50 l0 50 M316 60 l0 150 M412 80 l0 130', 'rgba(255,255,255,.55)', 5),
        c.engrave('M150 440 Q268 460 386 440', 4),
        c.gem(150, 160, 14), c.gem(262, 300, 19),
      ].join(''),
    };
  } },
  { key: 's-warden-boots', tier: 4, base: 'darkzaitzev/tabi-boot', roles: R.warden, draw(c) {
    return {
      body: [c.fillAll('cloth'), c.paint('M270 520 L270 420 Q320 360 410 392 L520 430 L520 520Z', 'metal'), c.paint('M0 44 L520 44 L520 74 L0 74Z', 'trim'), c.paint('M0 452 L520 452 L520 520 L0 520Z', 'metal2'), c.paint(c.sub(0), 'trim')].join(''),
      top: [
        vine('M236 60 C262 160 232 260 262 330 C290 390 360 400 420 430', [[250, 120, 32, -20], [246, 210, 32, 200], [258, 300, 30, -10], [330, 395, 30, -80], [390, 418, 28, -100]]),
        c.shine('M300 375 Q380 380 440 420', 5, .7),
        c.gem(220, 80, 14),
      ].join(''),
    };
  } },

  // ================================================================ ASHEN HUNTER — ash grey, ember orange, feathers & fur
  { key: 's-hunter-helm', tier: 4, base: 'delapouite/warlock-hood', roles: R.hunter, draw(c) {
    return {
      body: [c.fillAll('cloth'), c.paint(c.sub([5, 6]), 'metal'), c.paint(c.sub([3]), 'metal2'), c.paint(c.sub([4, 7, 0]), 'trim'), c.paint(c.sub([8, 9, 10, 11]), 'trim')].join(''),
      top: [
        c.line('M150 70 l12 26 M180 60 l8 30 M205 56 l6 30 M310 60 l-8 30 M338 66 l-10 28 M362 80 l-12 24', 'rgba(70,58,48,.7)', 5),
        c.line(furD(80, 205, 470, 16, 5, -1) + furD(307, 432, 470, 16, 5, -1), 'rgba(250,240,228,.85)', 5),
        glow('M110 260 Q140 360 150 470 M402 260 Q372 360 362 470', W.hunter, 4),
        `<ellipse cx="226" cy="262" rx="18" ry="11" fill="${W.hunter}" filter="url(#glow)"/><ellipse cx="286" cy="262" rx="18" ry="11" fill="${W.hunter}" filter="url(#glow)"/><ellipse cx="226" cy="262" rx="11" ry="6" fill="#ffe6a8"/><ellipse cx="286" cy="262" rx="11" ry="6" fill="#ffe6a8"/>`,
        feather(360, 175, 230, -62), feather(380, 185, 190, -35, '#cfc6bd'),
        c.gem(256, 176, 16),
      ].join(''),
    };
  } },
  { key: 's-hunter-gloves', tier: 4, base: 'delapouite/gloves', roles: R.hunter, draw(c) {
    const ax = { from: [90, 450], to: [390, 70], width: 300 };
    return {
      body: [c.fillAll('leather'), c.paint(c.sub([1, 2, 3, 4, 5]), 'metal2'), c.paint(c.sub(1), 'cloth'), c.paint(c.along(.74, .82, ax), 'trim')].join(''),
      top: [
        c.line(furD(60, 220, 180, 18, 6), '#f4ece2', 5),
        glow('M110 420 Q200 330 250 250 M170 450 Q240 360 290 290', W.hunter, 4),
        c.line('M360 120 l20 14 M340 100 l20 14 M380 140 l18 14', 'rgba(40,30,25,.7)', 4),
        feather(330, 110, 170, 30), feather(320, 130, 140, 60, '#cfc6bd'),
        c.gem(262, 232, 18),
      ].join(''),
    };
  } },
  { key: 's-hunter-boots', tier: 4, base: 'delapouite/fur-boot', roles: R.hunter, draw(c) {
    return {
      body: [c.fillAll('leather'), c.paint(c.sub(0), 'cloth'), c.paint(c.sub(9), 'metal2'), c.paint('M300 520 L300 360 Q370 340 450 380 L450 520Z', 'metal'), c.paint('M0 140 L520 140 L520 172 L0 172Z', 'trim'), c.paint('M0 400 L520 400 L520 430 L0 430Z', 'trim')].join(''),
      top: [
        c.line('M100 70 l14 30 M140 50 l10 34 M180 60 l12 36 M220 52 l10 34 M262 62 l12 32 M300 50 l8 30', 'rgba(60,50,40,.7)', 5),
        glow('M110 250 Q160 230 190 200 M110 330 Q160 310 200 280', W.hunter, 4),
        feather(290, 120, 190, -55), feather(300, 130, 160, -30, '#cfc6bd'),
        c.gem(170, 95, 16), c.gem(380, 415, 12),
      ].join(''),
    };
  } },
  { key: 's-hunter-ring', tier: 4, base: 'lorc/fire-ring', roles: R.hunter, draw(c) {
    return {
      body: [c.fillAll('trim'), c.paint('M30 330 A226 150 0 1 0 482 330 A226 150 0 1 0 30 330Z M70 330 A186 112 0 1 1 442 330 A186 112 0 1 1 70 330Z', 'metal', 'fill-rule="evenodd"')].join(''),
      top: [
        c.line('M80 380 Q256 500 432 380', 'rgba(255,190,110,.75)', 4),
        feather(70, 250, 150, -80),
        c.gem(256, 462, 26),
      ].join(''),
    };
  } },
  // ================================================================ STORMCALLER'S REGALIA — blue, pale silver, lightning
  { key: 's-storm-helm', tier: 4, base: 'delapouite/spartan-helmet', roles: R.storm, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub(0), 'cloth'), c.paint(c.sub([2, 3, 4]), 'trim'), c.paint(c.sub([5, 6]), 'metal')].join(''),
      top: [
        glow(zig([[70, 400], [110, 300], [90, 280], [150, 170], [130, 150], [220, 60], [300, 40], [380, 60]]), '#e8f6ff', 5),
        bolt(300, 250, 150, 0),
        c.gem(250, 200, 16),
      ].join(''),
    };
  } },
  { key: 's-storm-armor', tier: 4, base: 'delapouite/abdominal-armor', roles: R.storm, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([0, 1]), 'metal2'), c.paint(c.sub([3, 4]), 'metal2'), c.paint(c.sub([7, 8]), 'metal2')].join(''),
      top: [
        bolt(250, 70, 190, 0),
        glow(zig([[80, 230], [130, 200], [120, 240], [180, 215]]), '#e8f6ff', 4), glow(zig([[432, 230], [382, 200], [392, 240], [332, 215]]), '#e8f6ff', 4),
        c.gem(95, 100, 14), c.gem(417, 100, 14),
      ].join(''),
    };
  } },
  { key: 's-storm-ring', tier: 4, base: 'lorc/cloud-ring', roles: R.storm, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub(1), 'metal2'), c.paint(c.sub(2), 'metal')].join(''),
      top: [
        glow(zig([[380, 120], [420, 200], [395, 210], [440, 300]]), '#e8f6ff', 5),
        bolt(160, 230, 150, 15),
        c.gem(150, 160, 20),
      ].join(''),
    };
  } },
  { key: 's-storm-amulet', tier: 4, base: 'lucasms/necklace', roles: R.storm, draw(c) {
    return {
      body: [c.fillAll('trim'), c.paint(c.sub(1), 'metal2')].join(''),
      top: [
        bolt(230, 330, 150, 0),
        c.gem(252, 400, 26),
        sparkle(150, 120, 14, W.storm), sparkle(360, 120, 14, W.storm),
      ].join(''),
    };
  } },
  // ================================================================ TIDEBOUND PLATE — teal, pearl, waves & shells
  { key: 's-tide-helm', tier: 4, base: 'lorc/crested-helmet', roles: R.tide, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub(0), 'gem'), c.paint(c.sub(1), 'trim'), c.paint(c.sub(2), 'metal')].join(''),
      top: [
        c.line('M230 40 L240 170 M253 30 L256 170 M276 40 L270 170', 'rgba(4,60,56,.6)', 4),
        glow(wavesD(140, 372, 440, 18, 3), W.tide, 5),
        glow(curlD(170, 330, 34) + curlD(342, 330, 34, true), W.tide, 4),
        c.shine('M150 250 Q256 220 362 250', 5, .7),
        shell(256, 196, 34),
      ].join(''),
    };
  } },
  { key: 's-tide-armor', tier: 4, base: 'lorc/scale-mail', roles: R.tide, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([0, 7]), 'trim'), c.paint(c.sub([1, 3, 4, 5]), 'metal2')].join(''),
      top: [
        glow(wavesD(150, 362, 380, 14, 4), W.tide, 4),
        c.line('M110 200 q14 14 28 0 q14 14 28 0 M330 200 q14 14 28 0 q14 14 28 0 M150 260 q14 14 28 0 M340 260 q14 14 28 0', 'rgba(255,255,255,.55)', 4),
        shell(256, 230, 44),
      ].join(''),
    };
  } },
  { key: 's-tide-gloves', tier: 4, base: 'lorc/grab', roles: R.tide, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub(1), 'trim'), c.paint('M0 330 L200 330 L240 520 L0 520Z', 'metal2')].join(''),
      top: [
        glow(wavesD(170, 400, 330, 16, 4), W.tide, 5),
        c.line('M200 120 q20 20 40 0 q20 20 40 0', 'rgba(255,255,255,.55)', 4),
        shell(290, 230, 36),
        c.gem(100, 315, 14),
      ].join(''),
    };
  } },
  { key: 's-tide-boots', tier: 4, base: 'lorc/steeltoe-boots', roles: R.tide, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([2, 3]), 'metal2'), c.paint('M0 80 L520 80 L520 130 L0 130Z', 'trim'), c.paint('M0 330 L520 330 L520 352 L0 352Z', 'trim')].join(''),
      top: [
        glow(wavesD(70, 240, 250, 14, 2), W.tide, 5), glow(wavesD(290, 460, 250, 14, 2), W.tide, 5),
        glow(curlD(110, 400, 30) + curlD(360, 400, 30), W.tide, 4),
        shell(160, 185, 30), shell(380, 185, 30),
        c.gem(200, 342, 11), c.gem(440, 342, 11),
      ].join(''),
    };
  } },
  // ================================================================ CLOCKWORK PRECISION — brass, copper, gears
  { key: 's-clock-gloves', tier: 4, base: 'lorc/metal-hand', roles: R.clock, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([4, 5, 6, 7]), 'trim'), c.paint(c.sub(9), 'metal')].join(''),
      top: [
        gear(c, 230, 390, 62, 10, 'trim', 8),
        c.gem(230, 390, 14),
      ].join(''),
    };
  } },
  { key: 's-clock-boots', tier: 4, base: 'delapouite/ski-boot', roles: R.clock, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([0, 1, 2]), 'trim'), c.paint(c.sub(3), 'metal')].join(''),
      top: [
        gear(c, 150, 380, 50, 9, 'trim', 0),
        c.gem(150, 380, 11),
      ].join(''),
    };
  } },
  { key: 's-clock-ring', tier: 4, base: 'delapouite/globe-ring', roles: R.clock, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub(2), 'trim')].join(''),
      top: [
        gear(c, 256, 82, 74, 10, 'trim', 0),
        c.gem(256, 82, 22),
      ].join(''),
    };
  } },
  { key: 's-clock-amulet', tier: 4, base: 'skoll/pocket-watch', roles: R.clock, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub(6), 'trim'), c.paint('M102 367 A92 92 0 1 0 286 367 A92 92 0 1 0 102 367Z', 'set_pearl')].join(''),
      top: [
        gear(c, 370, 310, 40, 8, 'trim', 0),
        c.gem(190, 395, 10),
      ].join(''),
    };
  } },
  // ================================================================ VOIDWALKER SHROUD — deep violet, lilac silver, starry void
  { key: 's-void-helm', tier: 4, base: 'delapouite/overlord-helm', roles: R.void, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub(2), 'trim'), c.paint(c.sub([7, 8, 9, 10, 11, 12, 13, 14]), 'trim')].join(''),
      top: [
        stars([[180, 120, 4], [330, 140, 5], [190, 360, 4], [320, 380, 4], [170, 260, 12]]),
        `<ellipse cx="216" cy="202" rx="14" ry="10" fill="${W.void}" filter="url(#glow)"/><ellipse cx="296" cy="202" rx="14" ry="10" fill="${W.void}" filter="url(#glow)"/>`,
        c.gem(256, 120, 16),
      ].join(''),
    };
  } },
  { key: 's-void-armor', tier: 4, base: 'lorc/robe', roles: R.void, draw(c) {
    return {
      body: [c.fillAll('cloth'), c.paint(c.sub(0), 'metal'), c.paint('M0 462 L520 462 L520 520 L0 520Z', 'trim'), c.paint(c.sub([2, 3]), 'trim')].join(''),
      top: [
        c.line('M256 190 L230 470 M256 190 L282 470', '#e4d6ff', 7),
        glow('M200 240 L120 330 M312 240 L392 330', W.void, 4),
        stars([[160, 300, 4], [340, 260, 5], [180, 420, 5], [330, 400, 4], [370, 330, 12], [150, 380, 11], [250, 90, 4]]),
        c.gem(256, 188, 22),
      ].join(''),
    };
  } },
  { key: 's-void-boots', tier: 4, base: 'delapouite/leg-armor', roles: R.void, draw(c) {
    return {
      body: [c.fillAll('metal'), c.paint(c.sub([0, 1, 4, 5]), 'trim'), c.paint(c.sub([6, 7]), 'cloth')].join(''),
      top: [
        stars([[130, 200, 4], [190, 290, 5], [150, 150, 10], [320, 180, 4], [380, 280, 5], [360, 220, 10], [100, 450, 4], [420, 460, 4]]),
        glow('M170 120 L190 330 M342 120 L322 330', W.void, 4),
        c.gem(134, 72, 14), c.gem(378, 72, 14),
      ].join(''),
    };
  } },
  { key: 's-void-amulet', tier: 4, base: 'delapouite/intricate-necklace', roles: R.void, draw(c) {
    return {
      body: [c.fillAll('trim'), c.paint(c.sub(5), 'gem')].join(''),
      top: [
        sparkle(256, 347, 22, W.void),
        stars([[110, 200, 10], [400, 200, 10]]),
      ].join(''),
    };
  } },
];
