// Embervale icon engine — turns game-icons.net silhouettes into coloured, bevelled, trimmed icons.
// Recipes (art/recipes/*.js) describe WHAT to paint; this file knows HOW.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GI_CACHE = path.join(__dirname, 'gi');                    // vendored subset (committed)
const GI_SRC = process.env.GI_SRC || '/tmp/gi/icons';           // full clone of github.com/game-icons/icons

// ---------------------------------------------------------------- silhouettes
function loadGI(name) {
  const cached = path.join(GI_CACHE, name + '.svg');
  if (!fs.existsSync(cached)) {
    const src = path.join(GI_SRC, name + '.svg');
    if (!fs.existsSync(src)) throw new Error(`game-icon "${name}" not found (looked in ${GI_CACHE} and ${GI_SRC})`);
    fs.mkdirSync(path.dirname(cached), { recursive: true });
    fs.copyFileSync(src, cached);
  }
  const svg = fs.readFileSync(cached, 'utf8');
  // files are: <path d="M0 0h512v512H0z"/> (black bg) + one or more white paths
  const ds = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]).filter(d => !/^M0 0h512v512H0z$/.test(d.trim()));
  if (!ds.length) throw new Error(`game-icon "${name}" has no shape`);
  return toAbs(ds.join(' '));
}

// ---------------------------------------------------------------- path maths
const ARGN = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
function tokenize(d) {
  const out = []; let i = 0;
  const num = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
  while (i < d.length) {
    const ch = d[i];
    if (/[a-zA-Z]/.test(ch)) { out.push(ch); i++; continue; }
    if (/[\s,]/.test(ch)) { i++; continue; }
    const m = d.slice(i).match(num); if (!m) throw new Error('bad path near ' + d.slice(i, i + 20));
    out.push(parseFloat(m[0])); i += m[0].length;
  }
  return out;
}
// parse into [{c:'M',a:[...]},...] — handles arc flags written without separators ("a5 5 0 01 10 10")
function parse(d) {
  const segs = []; let i = 0, cmd = null;
  const s = d.replace(/([aA])([^a-zA-Z]*)/g, (m, c, body) => c + fixArcs(body));
  const t = tokenize(s);
  while (i < t.length) {
    if (typeof t[i] === 'string') cmd = t[i++];
    const up = cmd.toUpperCase(), n = ARGN[up];
    if (n === 0) { segs.push({ c: cmd, a: [] }); continue; }
    segs.push({ c: cmd, a: t.slice(i, i + n) }); i += n;
    if (up === 'M') cmd = cmd === 'M' ? 'L' : 'l';
  }
  return segs;
}
function fixArcs(body) { // split "0 01 10 10" style flag clusters
  const nums = body.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) || []; const out = []; let k = 0;
  const raw = body.replace(/,/g, ' ');
  // walk the raw string so we can split concatenated flags
  let j = 0; const tok = [];
  while (j < raw.length) {
    if (/\s/.test(raw[j])) { j++; continue; }
    const pos = k % 7;
    if (pos === 3 || pos === 4) { tok.push(raw[j]); j++; k++; continue; } // single-char flag
    const m = raw.slice(j).match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/); if (!m) { j++; continue; }
    tok.push(m[0]); j += m[0].length; k++;
  }
  void nums; void out;
  return ' ' + tok.join(' ') + ' ';
}
function toAbs(d) {
  const segs = parse(d); let x = 0, y = 0, sx = 0, sy = 0; const out = [];
  for (const { c, a } of segs) {
    const rel = c === c.toLowerCase(), C = c.toUpperCase();
    const X = v => rel ? x + v : v, Y = v => rel ? y + v : v;
    if (C === 'M') { x = X(a[0]); y = Y(a[1]); sx = x; sy = y; out.push(['M', x, y]); }
    else if (C === 'L') { x = X(a[0]); y = Y(a[1]); out.push(['L', x, y]); }
    else if (C === 'H') { x = rel ? x + a[0] : a[0]; out.push(['L', x, y]); }
    else if (C === 'V') { y = rel ? y + a[0] : a[0]; out.push(['L', x, y]); }
    else if (C === 'C') { const p = [X(a[0]), Y(a[1]), X(a[2]), Y(a[3]), X(a[4]), Y(a[5])]; x = p[4]; y = p[5]; out.push(['C', ...p]); }
    else if (C === 'S') { const p = [X(a[0]), Y(a[1]), X(a[2]), Y(a[3])]; x = p[2]; y = p[3]; out.push(['S', ...p]); }
    else if (C === 'Q') { const p = [X(a[0]), Y(a[1]), X(a[2]), Y(a[3])]; x = p[2]; y = p[3]; out.push(['Q', ...p]); }
    else if (C === 'T') { x = X(a[0]); y = Y(a[1]); out.push(['T', x, y]); }
    else if (C === 'A') { const nx = X(a[5]), ny = Y(a[6]); out.push(['A', a[0], a[1], a[2], a[3], a[4], nx, ny]); x = nx; y = ny; }
    else if (C === 'Z') { out.push(['Z']); x = sx; y = sy; }
  }
  return out;
}
const r2 = v => Math.round(v * 100) / 100;
function fmt(cmds) { return cmds.map(s => s[0] + s.slice(1).map(r2).join(' ')).join(''); }
function subpaths(cmds) { const subs = []; for (const s of cmds) { if (s[0] === 'M') subs.push([]); if (subs.length) subs[subs.length - 1].push(s); } return subs; }
function bboxOf(cmds) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of cmds) { const p = s[0] === 'A' ? s.slice(6) : s.slice(1); for (let i = 0; i + 1 < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); } }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// ---------------------------------------------------------------- materials (hi, mid, lo)
const MAT = {
  iron_dull: ['#a29b90', '#625d57', '#2c2927'], iron_dark: ['#76716b', '#3e3b38', '#191716'],
  steel: ['#f2f5f8', '#9ba8b5', '#3c4753'], steel_pol: ['#ffffff', '#c3d1e0', '#465770'],
  steel_black: ['#c2c8dc', '#5a6078', '#1a1c2a'], silver_pale: ['#ffffff', '#e2e9f3', '#8794b0'],
  bronze: ['#f6c98e', '#b3763a', '#4b2b10'], gold: ['#fff4ae', '#e3aa2a', '#6a4104'], gold_pale: ['#fffce4', '#f2da8e', '#98782e'],
  copper: ['#ffc2a0', '#c26a3a', '#4e200c'],
  wood_plain: ['#a37c54', '#6b4a2c', '#31200f'], wood_oiled: ['#c78f55', '#7c4b22', '#381d09'], wood_dark: ['#835040', '#47241a', '#1c0c07'],
  leather_plain: ['#9c7858', '#644731', '#2e1e11'], leather: ['#b77f4c', '#77492a', '#331b0b'], leather_tooled: ['#94502c', '#5c2b16', '#240f08'],
  cloth_plain: ['#bdb29c', '#7b705d', '#383226'], cloth_red: ['#e05a48', '#952c22', '#3e0d0a'], cloth_royal: ['#8a62e6', '#47309a', '#170d40'],
  cloth_white: ['#ffffff', '#d6e4f0', '#7c8ca8'], cloth_green: ['#8ad07a', '#3d7a34', '#132e10'], cloth_blue: ['#7ab0ff', '#2f5bb5', '#0c1d4a'],
  bone: ['#fffaea', '#dacaa4', '#786846'], horn: ['#e8dcc0', '#9a8462', '#3c2e1a'],
  gem_ruby: ['#ffc2c2', '#e8283a', '#56000f'], gem_sapph: ['#c2e2ff', '#2a6ae6', '#081858'], gem_emer: ['#c8ffd8', '#1fbf5a', '#04401a'],
  gem_amber: ['#fff0b0', '#ff9a1a', '#6a2a00'], gem_void: ['#f0c8ff', '#9a3ae6', '#2a0848'], crystal: ['#f0ffff', '#7ae4ff', '#16568a'],
  string: ['#f4ead2', '#c8b48a', '#6a5a3a'], dark: ['#4a4658', '#24222e', '#0b0a10'],
};
// tier → which material each ROLE uses. Recipes only ever say "metal", "trim", "wood", "leather", "cloth", "gem"...
const TIERS = {
  1: { metal: 'iron_dull', metal2: 'iron_dark', trim: 'iron_dark', wood: 'wood_plain', leather: 'leather_plain', cloth: 'cloth_plain', gem: 'iron_dark', bone: 'bone', string: 'string', dark: 'dark' },
  2: { metal: 'steel', metal2: 'iron_dark', trim: 'bronze', wood: 'wood_oiled', leather: 'leather', cloth: 'cloth_red', gem: 'bronze', bone: 'bone', string: 'string', dark: 'dark' },
  3: { metal: 'steel_pol', metal2: 'steel', trim: 'gold', wood: 'wood_oiled', leather: 'leather', cloth: 'cloth_red', gem: 'gem_sapph', bone: 'bone', string: 'string', dark: 'dark' },
  4: { metal: 'steel_black', metal2: 'steel_black', trim: 'gold', wood: 'wood_dark', leather: 'leather_tooled', cloth: 'cloth_red', gem: 'gem_ruby', bone: 'bone', string: 'string', dark: 'dark' },
  5: { metal: 'silver_pale', metal2: 'steel_pol', trim: 'gold_pale', wood: 'wood_dark', leather: 'leather_tooled', cloth: 'cloth_white', gem: 'crystal', bone: 'bone', string: 'gold_pale', dark: 'dark' },
  6: { metal: 'silver_pale', metal2: 'steel_black', trim: 'gold', wood: 'wood_dark', leather: 'leather_tooled', cloth: 'cloth_royal', gem: 'gem_void', bone: 'bone', string: 'gold_pale', dark: 'dark' },
};
// what extra decoration each tier earns (recipes read these flags)
const TIER_FX = {
  1: { tier: 1, rust: true, bands: false, hasGem: false, gemGlow: false, engrave: false, rune: null },
  2: { tier: 2, rust: false, bands: true, hasGem: false, gemGlow: false, engrave: false, rune: null },
  3: { tier: 3, rust: false, bands: true, hasGem: true, gemGlow: false, engrave: false, rune: null },
  4: { tier: 4, rust: false, bands: true, hasGem: true, gemGlow: true, engrave: true, rune: null },
  5: { tier: 5, rust: false, bands: true, hasGem: true, gemGlow: true, engrave: true, rune: '#7ffcff' },
  6: { tier: 6, rust: false, bands: true, hasGem: true, gemGlow: true, engrave: true, rune: '#ffe27a' },
};
// rarity index (RAR in source/1_data.js + 1b_story.js + 1i_rarity.js) → tier
const RAR_TIER = [1, 2, 2, 3, 4, 4, 5, 5, 5, 6, 6, 6];

// ---------------------------------------------------------------- the per-icon context handed to recipes
function makeCtx(baseName, tier, overrides = {}) {
  const sil = baseName ? loadGI(baseName) : [];
  const subs = subpaths(sil);
  const T = Object.assign({}, TIER_FX[tier], { roles: Object.assign({}, TIERS[tier], overrides.roles || {}) }, overrides.fx || {});
  const defs = new Map(); let uid = 0;
  const id = p => `${p}${++uid}`;

  function matId(m) { // role name | preset name | [hi,mid,lo]
    let stops, key; const v = Array.isArray(m) ? m : (T.roles[m] || m);
    if (Array.isArray(v)) { stops = v; key = 'c' + v.join('').replace(/#/g, ''); }
    else { stops = MAT[v]; key = v; if (!stops) throw new Error('unknown material/role ' + m); }
    const gid = 'm_' + key;
    if (!defs.has(gid)) defs.set(gid, `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${stops[0]}"/><stop offset=".45" stop-color="${stops[1]}"/><stop offset="1" stop-color="${stops[2]}"/></linearGradient>`);
    return gid;
  }
  const bb = bboxOf(sil.length ? sil : [['M', 0, 0], ['L', 512, 512]]);
  const c = {
    T, tier, sil: fmt(sil), bbox: bb, nsub: subs.length,
    MAT, // raw presets, for custom palettes
    /** d-string for subpath(s) i (number or array) */
    sub(i) { return (Array.isArray(i) ? i : [i]).map(k => { if (!subs[k]) throw new Error(`${baseName}: no subpath ${k} (has ${subs.length})`); return fmt(subs[k]); }).join(''); },
    /** bbox of a subpath — handy for placing gems/bands */
    subBox(i) { return bboxOf(subs[i]); },
    mat(m) { return `url(#${matId(m)})`; },
    /** polygon strip across the weapon axis between fractions a..b (0 = from, 1 = to). Default axis: bottom-left → top-right of bbox */
    along(a, b, o = {}) {
      const f = o.from || [bb.x0, bb.y1], t = o.to || [bb.x1, bb.y0], w = o.width || 900;
      const dx = t[0] - f[0], dy = t[1] - f[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy * w, py = ux * w;
      const P = s => [f[0] + dx * s, f[1] + dy * s];
      const A = P(a), B = P(b);
      return `M${r2(A[0] + px)} ${r2(A[1] + py)}L${r2(B[0] + px)} ${r2(B[1] + py)}L${r2(B[0] - px)} ${r2(B[1] - py)}L${r2(A[0] - px)} ${r2(A[1] - py)}Z`;
    },
    /** point at fraction s along an axis (same defaults as along) */
    at(s, o = {}) { const f = o.from || [bb.x0, bb.y1], t = o.to || [bb.x1, bb.y0]; return [r2(f[0] + (t[0] - f[0]) * s), r2(f[1] + (t[1] - f[1]) * s)]; },
    /** fill a region (any d) with a material, clipped to the silhouette */
    paint(d, m, extra = '') { return `<path d="${d}" fill="${c.mat(m)}" clip-path="url(#sil)" ${extra}/>`; },
    /** fill the whole silhouette */
    fillAll(m) { return `<path d="${c.sil}" fill="${c.mat(m)}"/>`; },
    /** a filled shape NOT clipped (sits on top of / outside the silhouette) */
    shape(d, m, extra = '') { return `<path d="${d}" fill="${c.mat(m)}" stroke="#0b0910" stroke-width="7" stroke-linejoin="round" paint-order="stroke" ${extra}/>`; },
    /** thin decorative line; clip=true keeps it inside the silhouette */
    line(d, col = 'rgba(0,0,0,.45)', w = 6, clip = true, extra = '') { return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${clip ? 'clip-path="url(#sil)"' : ''} ${extra}/>`; },
    /** bright edge highlight line */
    shine(d, w = 5, a = .75) { return c.line(d, `rgba(255,255,255,${a})`, w); },
    /** trim band across the axis (only drawn when the tier has bands) */
    band(a, b, o = {}) { return T.bands ? c.paint(c.along(a, b, o), o.mat || 'trim') : ''; },
    /** gem at x,y radius r — only when the tier has gems; glows at higher tiers */
    gem(x, y, r, o = {}) {
      if (!T.hasGem && !o.always) return '';
      const m = o.mat || 'gem', g = [];
      if (T.gemGlow || o.glow) { const gv = Array.isArray(m) ? m : (T.roles[m] || m), col = (Array.isArray(gv) ? gv : MAT[gv])[1]; g.push(`<circle cx="${x}" cy="${y}" r="${r * 2.1}" fill="${col}" opacity=".55" filter="url(#glow)"/>`); }
      g.push(`<circle cx="${x}" cy="${y}" r="${r + 5}" fill="${c.mat('trim')}" stroke="#0b0910" stroke-width="5"/>`);
      g.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c.mat(m)}"/>`);
      g.push(`<ellipse cx="${x - r * .32}" cy="${y - r * .36}" rx="${r * .38}" ry="${r * .24}" fill="#fff" opacity=".85" transform="rotate(-35 ${x - r * .32} ${y - r * .36})"/>`);
      return g.join('');
    },
    /** engraving lines (tier 4+) */
    engrave(d, w = 4) { return T.engrave ? c.line(d, 'rgba(255,230,160,.55)', w) : ''; },
    /** glowing rune marks (tier 5+). d = any path of small strokes */
    runes(d, w = 6) { if (!T.rune) return ''; return `<g clip-path="url(#sil)"><path d="${d}" fill="none" stroke="${T.rune}" stroke-width="${w * 2.4}" stroke-linecap="round" opacity=".55" filter="url(#glow)"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${w * .7}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${T.rune}" stroke-width="${w}" stroke-linecap="round" opacity=".9"/></g>`; },
    /** rust specks scattered inside region d (tier 1 only) */
    rust(points) { if (!T.rust) return ''; return `<g clip-path="url(#sil)">${points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7a3a12" opacity=".55"/>`).join('')}</g>`; },
    /** soft coloured aura behind the icon */
    aura(col, r = 230, a = .5) { return `<circle cx="256" cy="256" r="${r}" fill="${col}" opacity="${a}" filter="url(#aura)"/>`; },
    /** a raw game-icon (other than the base) as a d-string, e.g. to add a second element */
    gi(name) { return fmt(loadGI(name)); },
    /** transform helper for a gi() path */
    place(d, x, y, s = 1, rot = 0) { return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-256 -256)">${d}</g>`; },
  };
  c._defs = defs;
  return c;
}

const FILTERS = `
<filter id="bev" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b"/><feSpecularLighting in="b" surfaceScale="6" specularConstant=".85" specularExponent="22" lighting-color="#fff" result="s"><feDistantLight azimuth="225" elevation="48"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/><feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="aura" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="34"/></filter>
<filter id="drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#000" flood-opacity=".6"/></filter>`;

/** Assemble a finished icon.  body = painted regions (beveled), top = details above the bevel, under = things behind (auras) */
function finish(c, { body = '', top = '', under = '', noOutline = false } = {}) {
  const defs = [...c._defs.values()].join('') + FILTERS + (c.sil ? `<clipPath id="sil"><path d="${c.sil}"/></clipPath>` : '');
  const gloss = c.sil ? `<g clip-path="url(#sil)"><path d="${c.sil}" fill="none" stroke="#000" stroke-opacity=".42" stroke-width="12"/><rect x="0" y="0" width="512" height="512" fill="url(#gl)"/></g>` : '';
  const glossDef = `<linearGradient id="gl" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  const outline = c.sil && !noOutline ? `<path d="${c.sil}" fill="#0b0910" stroke="#0b0910" stroke-width="22" stroke-linejoin="round"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -28 568 568"><defs>${defs}${glossDef}</defs>${under}<g filter="url(#drop)">${outline}<g filter="url(#bev)">${body}</g>${gloss}${top}</g></svg>`;
}

module.exports = { loadGI, toAbs, fmt, subpaths, bboxOf, makeCtx, finish, MAT, TIERS, TIER_FX, RAR_TIER, ROOT, GI_SRC, GI_CACHE };
