// Armour icons — tiered recipes for every AT slot × weight, plus ring and amulet.
//   Light  = cloth / leather, stitching, feather accents
//   Medium = leather + mail / studs / buckles (metal2)
//   Heavy  = full plate (metal + trim bands + rivets)
'use strict';

let RG = 0;
/** clip `inner` (already sil-clipped markup) to an extra region d */
function within(c, d, inner) {
  const id = 'arg' + (++RG);
  c._defs.set(id, `<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return `<g clip-path="url(#${id})">${inner}</g>`;
}
/** round rivets / studs: pts = [[x,y],...] */
function rivets(c, pts, r = 9, m = 'metal') {
  return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.mat(m)}" stroke="#0b0910" stroke-width="${Math.max(2.5, r * .35)}"/>` +
    `<circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .32}" fill="#fff" opacity=".8"/>`).join('');
}
/** dashed stitching */
function stitch(c, d, w = 4, col = 'rgba(255,238,200,.6)') { return c.line(d, col, w, true, 'stroke-dasharray="9 8"'); }
/** chainmail ring texture filling box x0..x1, y0..y1 (clip it yourself with within) */
function mail(c, x0, y0, x1, y1, s = 18) {
  let dk = '', hi = '', row = 0;
  for (let y = y0; y <= y1; y += s * .62, row++) for (let x = x0 + (row % 2 ? s / 2 : 0); x <= x1; x += s) {
    dk += `M${x - s / 2} ${y.toFixed(1)}a${s / 2} ${s / 2} 0 0 0 ${s} 0`;
    hi += `M${x - s / 2 + 2} ${(y - 3).toFixed(1)}a${s / 2 - 2} ${s / 2 - 2} 0 0 1 ${s - 4} 0`;
  }
  return c.line(dk, 'rgba(0,0,0,.6)', 4) + c.line(hi, 'rgba(255,255,255,.35)', 2.5);
}
const rect = (x0, y0, x1, y1) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
const pick = (c, arr) => arr[c.tier - 1];
// accent feather colour per tier (light gear)
const FEATHER = ['horn', 'cloth_white', 'cloth_green', 'gold', 'crystal', 'gem_void'];
// set stone for ring / amulet: plain stones at low tiers, role gem from tier 3
const STONE = [['#e4dccd', '#968e82', '#45403a'], ['#c9ecd0', '#5f9a70', '#1d3a26'], 'gem', 'gem', 'gem', 'gem'];
const feather = (c, x, y, s, rot) => c.place(`<path d="${c.gi('lorc/feather')}" fill="${c.mat(pick(c, FEATHER))}" stroke="#0b0910" stroke-width="18" stroke-linejoin="round" paint-order="stroke"/>` +
  `<path d="M60 470 C 160 330 280 180 420 60" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="10"/>`, x, y, s, rot);

module.exports = [
  // =============================================================== HELMS
  { key: 'a-helm-light', tiered: true, base: 'lorc/hood', draw(c) {
    const opening = 'M76 343C102 278 142 180 193 174C213 172 234 184 257 218C329 97 398 256 438 343C400 362 360 392 330 424L186 424C160 392 120 364 76 343Z';
    const rim = 'M76 343C102 278 142 180 193 174C213 172 234 184 257 218C329 97 398 256 438 343';
    const eyeCol = c.T.rune || (c.tier === 4 ? '#ff5a3a' : null);
    return {
      under: `<path d="${opening}" fill="${c.mat('dark')}"/>`,
      body: [
        c.fillAll('cloth'),
        c.paint('M0 345L512 345L512 512L0 512Z', 'leather'),                 // leather hem on the flaps
        c.line(rim, c.mat('leather'), 30),                                    // leather-lined opening
        c.paint(c.sub([1, 2]), 'dark'),                                       // shadowed eyes
      ].join(''),
      top: [
        stitch(c, 'M70 352C100 280 140 190 193 186C215 184 236 196 257 230C330 112 395 262 444 352', 4),
        c.line('M257 40C252 100 254 150 257 205', 'rgba(0,0,0,.35)', 7),        // centre seam
        stitch(c, 'M245 48C240 100 242 150 245 200', 3, 'rgba(255,238,200,.4)'),
        c.shine('M236 52C160 100 76 230 36 350', 6, .55),
        c.line('M100 352L176 420M412 352L336 424', 'rgba(0,0,0,.35)', 5),
        c.rust([[150, 140, 10], [360, 160, 8], [300, 80, 7], [420, 300, 9]]),
        c.engrave('M140 300C160 250 175 225 190 205M372 300C352 250 337 225 322 205'),
        c.runes('M220 100l12 -14M276 86l12 14M232 130l20 0'),
        eyeCol ? `<ellipse cx="190" cy="300" rx="30" ry="18" fill="${eyeCol}" opacity=".6" filter="url(#glow)"/><ellipse cx="322" cy="300" rx="30" ry="18" fill="${eyeCol}" opacity=".6" filter="url(#glow)"/><ellipse cx="190" cy="300" rx="20" ry="10" fill="${eyeCol}"/><ellipse cx="322" cy="300" rx="20" ry="10" fill="${eyeCol}"/>` : '',
        feather(c, 420, 190, .42, 10),
        c.gem(257, 252, 14),
      ].join(''),
    };
  } },
  { key: 'a-helm-medium', tiered: true, base: 'delapouite/light-helm', draw(c) {
    return {
      body: [
        c.paint(c.sub([1, 2]), 'leather'),                                   // boiled-leather cap
        c.paint(c.sub(0), 'metal2'),                                          // iron crest strip
        c.paint(c.sub(3), c.T.bands ? 'trim' : 'metal2'),                    // brow band
        c.paint(c.sub([4, 6, 9]), 'leather'),
        c.paint(c.sub(5), 'metal2'),                                          // nasal
        c.paint(c.sub([7, 8]), 'metal2'),                                     // mail cheek guards
      ].join(''),
      top: [
        within(c, c.sub([7, 8]), mail(c, 80, 290, 430, 490, 17)),
        stitch(c, 'M135 170C135 110 160 70 205 58M377 170C377 110 352 70 307 58', 4),
        c.shine('M130 160C132 110 158 72 200 60', 6, .6),
        c.shine('M240 40V170', 4, .6),
        rivets(c, [[256, 60], [256, 110], [256, 158]], 9, 'metal'),
        rivets(c, [[130, 216], [180, 216], [332, 216], [382, 216]], 8, 'metal'),
        c.rust([[150, 120, 9], [350, 140, 8], [110, 400, 7], [400, 340, 8]]),
        c.engrave('M150 165C155 120 175 90 205 75M362 165C357 120 337 90 307 75'),
        c.runes('M150 130l10 -14M175 100l12 -8M362 130l-10 -14M337 100l-12 -8'),
        c.gem(256, 216, 15),
      ].join(''),
    };
  } },
  { key: 'a-helm-heavy', tiered: true, base: 'delapouite/black-knight-helm', draw(c) {
    return {
      body: [
        c.paint(c.sub(1), 'metal'),
        c.paint(rect(250, 60, 512, 512), 'metal2', 'opacity=".55"'),         // shaded right half
        c.paint(c.sub(0), c.T.bands ? 'trim' : 'metal2'),                    // crown plate
        c.band(0, 1, { from: [256, 72], to: [256, 102], width: 300 }),       // top rim
        c.band(0, 1, { from: [256, 448], to: [256, 480], width: 300 }),      // bottom rim
        c.paint(c.sub(7), c.T.bands ? 'trim' : 'metal2'),                    // central ridge
      ].join(''),
      top: [
        c.shine('M84 90L76 440', 7, .6),
        c.shine('M130 112H240', 4, .5),
        c.line('M70 104H442M68 446H444', 'rgba(0,0,0,.4)', 5),
        rivets(c, [[96, 88], [416, 88], [92, 464], [420, 464], [92, 240], [420, 240]], 10, c.T.bands ? 'trim' : 'metal2'),
        c.rust([[120, 260, 12], [380, 400, 10], [300, 120, 8], [170, 420, 9], [400, 230, 7]]),
        c.engrave('M100 400C130 380 150 395 170 420M412 400C382 380 362 395 342 420M120 130C150 140 180 135 200 125M392 130C362 140 332 135 312 125'),
        c.runes('M110 210l14 -10M140 214l0 -16M372 210l14 -10M402 214l0 -16'),
        c.gem(256, 124, 16),
      ].join(''),
    };
  } },

  // =============================================================== CHEST
  { key: 'a-armor-light', tiered: true, base: 'lucasms/shirt', draw(c) {   // quilted gambeson
    return {
      body: [
        c.paint(c.sub(0), 'cloth'),
        c.paint('M0 290L75 290L75 400L0 400ZM437 290L512 290L512 400L437 400Z', 'leather'),   // leather cuffs
        c.paint(c.sub(6), 'leather'),                                         // belt
        c.paint(c.sub(7), 'cloth'),
        c.paint(rect(0, 398, 512, 512), 'dark', 'opacity=".35"'),
      ].join(''),
      top: [
        stitch(c, 'M150 120V352M200 150V352M312 150V352M362 120V352', 4),
        stitch(c, 'M110 200H232M110 270H232M280 200H402M280 270H402', 3, 'rgba(255,238,200,.4)'),
        stitch(c, 'M60 150C40 200 30 260 22 300M452 150C472 200 482 260 490 300', 4),
        c.line('M190 410V490M256 410V495M322 410V490', 'rgba(0,0,0,.4)', 6),  // skirt pleats
        c.line('M176 40C220 60 240 90 256 150C272 90 292 60 336 40', c.mat('leather'), 16),     // collar
        c.shine('M60 110C40 160 20 230 14 300', 6, .5),
        c.shine('M150 368H360', 3, .45),
        c.rust([[130, 300, 10], [380, 220, 9], [300, 460, 8], [80, 200, 7]]),
        c.paint(rect(236, 362, 276, 394), c.T.bands ? 'trim' : 'metal2'),   // buckle
        c.engrave('M120 160C150 175 160 200 150 230M392 160C362 175 352 200 362 230'),
        c.runes('M196 440l0 -18M256 450l0 -18M316 440l0 -18'),
        c.gem(256, 378, 13),
      ].join(''),
    };
  } },
  { key: 'a-armor-medium', tiered: true, base: 'delapouite/leather-armor', draw(c) {  // studded leather over mail
    return {
      body: [
        c.paint(c.sub([1, 2, 5, 10]), 'leather'),
        c.paint(c.sub(0), 'metal2'),
        c.paint(c.sub(4), 'metal2'),
        c.paint(c.sub([6, 7, 8, 9, 3]), c.T.bands ? 'trim' : 'metal2'),
      ].join(''),
      top: [
        within(c, c.sub(4), mail(c, 110, 160, 400, 320, 17)),
        within(c, c.sub(0), mail(c, 150, 30, 360, 115, 15)),
        stitch(c, 'M128 90C125 150 120 200 125 230M384 90C387 150 392 200 387 230', 4),
        stitch(c, 'M140 440C200 430 310 430 372 440', 4),
        c.shine('M112 70C108 130 100 190 110 240', 6, .55),
        rivets(c, [[160, 120], [190, 190], [150, 220], [352, 120], [322, 190], [362, 220], [200, 300], [312, 300], [256, 340]], 9, 'metal'),
        rivets(c, [[160, 465], [210, 470], [256, 472], [302, 470], [352, 465]], 8, 'metal'),
        c.rust([[160, 160, 10], [350, 180, 9], [256, 290, 8], [200, 460, 8]]),
        c.engrave('M170 100C200 120 210 160 200 200M342 100C312 120 302 160 312 200'),
        c.runes('M226 300l10 -16M256 280l0 -18M286 300l-10 -16'),
        c.gem(256, 138, 13),
      ].join(''),
    };
  } },
  { key: 'a-armor-heavy', tiered: true, base: 'lorc/breastplate', draw(c) {   // plate cuirass
    return {
      body: [
        c.paint(c.sub([7, 8]), 'metal'),
        c.paint(c.sub(7), 'metal2', 'opacity=".45"'),
        c.paint(c.sub([1, 2, 5, 6]), 'metal'),
        c.paint(c.sub([3, 4]), 'metal2'),
        c.paint(c.sub([9, 10, 13, 14]), 'metal'),
        c.paint(c.sub([11, 12]), 'metal2'),
        c.paint(c.sub(0), c.T.bands ? 'trim' : 'metal2'),
        c.band(0, 1, { from: [256, 318], to: [256, 360], width: 300 }),
      ].join(''),
      top: [
        c.shine('M140 150C122 210 126 280 165 330', 8, .7),
        c.shine('M290 140C320 160 340 190 350 220', 5, .4),
        c.line('M190 240C210 250 230 250 246 240M322 240C302 250 282 250 266 240', 'rgba(0,0,0,.3)', 5),
        rivets(c, [[150, 345], [215, 350], [297, 350], [362, 345], [210, 100], [302, 100]], 9, c.T.bands ? 'trim' : 'metal2'),
        c.rust([[180, 200, 12], [330, 280, 10], [150, 400, 8], [380, 430, 8], [300, 180, 7]]),
        c.engrave('M150 180C170 220 200 230 230 220M362 180C342 220 312 230 282 220M170 280C190 300 220 300 240 290M342 280C322 300 292 300 272 290'),
        c.runes('M160 450l20 -16M200 430l0 -18M312 430l0 -18M352 450l-20 -16'),
        c.gem(256, 200, 17),
      ].join(''),
    };
  } },

  // =============================================================== GLOVES
  { key: 'a-gloves-light', tiered: true, base: 'delapouite/hand-bandage', draw(c) {   // cloth hand wraps
    return {
      body: [
        c.paint(c.sub([0, 1]), 'leather'),
        c.paint(c.sub([2, 3, 4, 5, 6, 7, 8, 9]), pick(c, ['cloth_plain', 'string', 'cloth', 'cloth', 'cloth', 'cloth'])),
        c.paint(c.sub(9), 'leather'),
      ].join(''),
      top: [
        c.line('M210 150L215 60M150 180L110 100M270 140L300 50M330 165L360 90', 'rgba(0,0,0,.3)', 5),
        c.shine('M60 160C100 220 140 250 170 260', 5, .5),
        stitch(c, 'M200 285C260 250 330 230 450 215', 4),
        stitch(c, 'M180 400C230 395 280 405 330 420', 4),
        c.shine('M220 220C280 210 340 200 440 205', 4, .5),
        c.rust([[300, 300, 10], [200, 430, 8], [120, 340, 7], [250, 120, 8]]),
        c.engrave('M200 330C240 320 290 310 340 300'),
        c.runes('M210 440l14 -10M250 450l14 -10M290 455l14 -10'),
        c.gem(300, 292, 13),
      ].join(''),
    };
  } },
  { key: 'a-gloves-medium', tiered: true, base: 'lorc/mailed-fist', draw(c) {   // leather glove + iron knuckles + mail cuff
    return {
      body: [
        c.paint(c.sub([0, 1, 2, 3, 5, 7, 8]), 'leather'),
        c.paint(c.sub([4, 6, 9, 10]), 'metal2'),
        c.paint(c.sub([11, 13]), 'metal2'),
        c.paint(c.sub([12, 14]), c.T.bands ? 'trim' : 'leather'),
      ].join(''),
      top: [
        within(c, c.sub([11, 13]), mail(c, 20, 300, 290, 495, 16)),
        stitch(c, 'M120 230C140 300 180 340 240 360M180 220C250 200 330 210 380 260', 4),
        c.shine('M110 250C120 300 150 330 190 350', 6, .5),
        c.shine('M190 40L230 30M270 55L320 60', 5, .45),
        rivets(c, [[184, 134], [267, 167], [342, 213], [408, 267]], 13, 'metal'),
        rivets(c, [[150, 410], [210, 440], [260, 460]], 7, 'metal'),
        c.rust([[200, 280, 10], [300, 320, 9], [120, 400, 8], [380, 200, 7]]),
        c.engrave('M170 270C210 250 260 250 300 280'),
        c.runes('M160 320l14 -6M200 340l12 -10M240 350l12 -10'),
        c.gem(270, 300, 15),
      ].join(''),
    };
  } },
  { key: 'a-gloves-heavy', tiered: true, base: 'delapouite/gauntlet', draw(c) {   // plate gauntlet
    return {
      body: [
        c.paint(c.sub([1, 2, 3]), 'metal'),
        c.paint(c.sub([4]), 'metal2'),
        c.paint(c.sub([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), 'metal'),
        c.paint(c.sub([6, 8, 11, 14, 9]), 'metal2', 'opacity=".5"'),
        c.paint(c.sub(0), c.T.bands ? 'trim' : 'metal2'),
      ].join(''),
      top: [
        c.shine('M110 90C120 150 140 200 170 240', 7, .7),
        c.shine('M140 255C200 270 250 285 310 300', 5, .5),
        c.line('M140 300C200 320 260 330 320 340', 'rgba(0,0,0,.3)', 5),
        rivets(c, [[150, 260], [300, 300], [130, 190], [280, 330]], 9, c.T.bands ? 'trim' : 'metal2'),
        c.rust([[150, 150, 10], [250, 310, 9], [340, 420, 7], [180, 400, 7]]),
        c.engrave('M120 120C150 140 160 180 150 220M180 280C220 300 260 300 300 290'),
        c.runes('M140 130l0 -18M150 170l12 -12M170 210l14 -6'),
        c.gem(220, 300, 15),
      ].join(''),
    };
  } },

  // =============================================================== BOOTS
  { key: 'a-boots-light', tiered: true, base: 'lorc/leather-boot', draw(c) {   // soft folded boot + feather
    return {
      body: [
        c.paint(c.sub(1), 'leather'),
        c.paint(c.sub(0), 'cloth'),
        c.paint(rect(100, 462, 512, 512), 'dark'),                            // thin sole
        c.paint(rect(130, 300, 330, 330), c.T.bands ? 'trim' : 'leather', 'opacity=".9"'),   // ankle tie
      ].join(''),
      top: [
        stitch(c, 'M150 452C250 452 350 456 470 460', 4),
        stitch(c, 'M118 60C200 50 300 50 380 70', 4),
        c.line('M290 200C300 260 300 320 290 380', 'rgba(0,0,0,.35)', 6),
        c.shine('M150 190C150 280 152 360 160 440', 7, .5),
        c.shine('M120 40C180 30 260 28 330 36', 5, .5),
        c.rust([[200, 250, 10], [380, 400, 9], [250, 120, 8], [180, 400, 7]]),
        c.engrave('M180 230C220 260 230 300 210 350M330 420C360 400 400 400 440 420'),
        c.runes('M180 100l12 -16M230 96l0 -18M280 100l-12 -16'),
        feather(c, 360, 70, .42, 20),
        c.gem(235, 315, 13),
      ].join(''),
    };
  } },
  { key: 'a-boots-medium', tiered: true, base: 'lorc/boots', draw(c) {   // buckled leather boots, iron toe caps
    return {
      body: [
        c.paint(c.sub([0, 1]), 'leather'),
        c.paint('M380 430A132 140 0 0 1 512 290V430Z', 'metal2'),              // right toe cap
        c.paint('M0 300A118 130 0 0 1 118 430H0Z', 'metal2'),                   // left toe cap
        c.paint(rect(0, 405, 512, 430), 'dark'),                              // soles
        c.paint(c.sub([2, 3]), c.T.bands ? 'trim' : 'metal2'),                // buckles
      ].join(''),
      top: [
        c.shine('M250 110C252 200 252 280 248 380', 7, .5),
        c.shine('M40 360C60 330 80 318 100 316', 5, .5),
        c.shine('M410 300C450 310 480 340 495 380', 5, .5),
        stitch(c, 'M300 112C305 200 305 280 300 330', 4),
        stitch(c, 'M210 175C212 250 212 320 210 400', 4),
        rivets(c, [[470, 380], [452, 345], [40, 380], [62, 348]], 8, 'metal'),
        rivets(c, [[340, 110], [290, 150], [250, 210], [200, 190], [150, 210]], 7, 'metal'),
        c.rust([[300, 230, 10], [150, 300, 9], [420, 360, 8], [60, 390, 7]]),
        c.engrave('M270 170C300 190 320 230 310 270M180 230C160 250 160 280 175 310'),
        c.runes('M270 380l12 -14M320 380l0 -18M130 380l12 -14'),
        c.gem(340, 293, 12),
      ].join(''),
    };
  } },
  { key: 'a-boots-heavy', tiered: true, base: 'delapouite/metal-boot', draw(c) {   // greave + sabaton
    return {
      body: [
        c.paint(c.sub([0, 7, 8, 9]), 'metal'),
        c.paint(c.sub(1), 'metal2'),
        c.paint(c.sub(8), 'metal2', 'opacity=".45"'),
        c.paint(c.sub(14), c.T.bands ? 'trim' : 'metal2'),
        c.band(0, 1, { from: [180, 24], to: [180, 62], width: 200 }),
      ].join(''),
      top: [
        c.shine('M120 80C140 180 140 260 110 330', 7, .7),
        c.shine('M100 330C140 330 180 340 200 360', 4, .5),
        c.shine('M340 390C380 395 410 410 425 440', 5, .6),
        c.line('M200 400L195 450', 'rgba(0,0,0,.3)', 5),
        c.rust([[150, 150, 11], [210, 250, 9], [280, 420, 8], [380, 420, 7], [120, 390, 8]]),
        c.engrave('M140 100C160 140 160 200 140 250M100 380C140 375 180 390 200 420'),
        c.runes('M150 280l14 -12M175 300l0 -16M300 430l12 -10'),
        c.gem(250, 405, 13),
      ].join(''),
    };
  } },

  // =============================================================== JEWELLERY
  { key: 'a-ring', tiered: true, base: 'delapouite/power-ring', draw(c) {
    const stone = pick(c, STONE);
    return {
      body: [
        c.fillAll(c.tier === 1 ? 'metal' : 'trim'),
        c.paint(c.sub(2), c.tier === 1 ? 'metal' : 'trim'),
        c.paint(c.sub(2), 'dark', 'opacity=".3"'),
      ].join(''),
      top: [
        c.shine('M60 70C120 80 180 100 220 120', 6, .6),
        c.shine('M50 150C120 200 220 300 330 470', 4, .35),
        c.rust([[120, 120, 9], [300, 400, 8], [380, 300, 7], [150, 300, 8]]),
        c.engrave('M100 110C140 120 170 135 200 150M330 360C345 390 360 420 370 450'),
        c.runes('M80 200l14 -6M130 240l12 -10M180 290l12 -12M230 340l10 -14'),
        c.gem(290, 205, 54, { always: true, mat: stone }),
      ].join(''),
    };
  } },
  { key: 'a-amulet', tiered: true, base: 'lorc/gem-pendant', draw(c) {
    const stone = pick(c, STONE);
    return {
      body: [
        c.fillAll(c.tier === 1 ? 'metal' : 'trim'),
        c.paint(c.sub(8), stone),
      ].join(''),
      top: [
        c.shine('M30 30C70 80 120 130 180 160', 4, .45),
        c.shine('M160 240L250 192', 5, .55),
        c.rust([[100, 80, 7], [380, 90, 7], [200, 450, 8], [330, 440, 7]]),
        c.engrave('M160 300V360M352 300V360'),
        c.runes('M200 430l12 10M300 430l-12 10M256 455v-14'),
        c.T.gemGlow ? `<circle cx="252" cy="335" r="80" fill="${c.MAT[c.T.roles.gem][1]}" opacity=".45" filter="url(#glow)" clip-path="url(#sil)"/>` : '',
        c.gem(252, 166, 11, { always: c.tier >= 2, mat: c.tier >= 3 ? 'gem' : 'trim' }),
      ].join(''),
    };
  } },
];
