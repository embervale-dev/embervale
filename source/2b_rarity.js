// ================= RARITY ORDER GUARANTEE =================
// Rule: a higher rarity is ALWAYS stronger than a lower one.
//  1) Attunement — every item scales to your current power, so an old Celestial never falls behind a fresh Rare.
//  2) Rarity power caps — upgrades can push an item right up to (but never past) the next rarity's base power.
//  3) Rarity bands — each bonus rolls inside its rarity's own band; bands never overlap, so the same bonus is
//     always bigger on a rarer item. Higher rarities also roll more bonuses, more sockets and legendary powers.
//  4) Rarity aura — every rarity tier adds a small built-in bonus on top.
const RAR_RANK = r => r;                       // index order is power order (Celestial sits between Mythic and Ancient)
const RAR_TOP = () => RAR.length - 1;
const BAND_SPAN = 2.6;                          // the best possible roll is 2.6x the old max
function attuneLvl(it) { const il = it.il | 0; if (typeof S === 'undefined' || !S || typeof maxPw !== 'function') return il; let mp = 0; try { mp = maxPw(); } catch (e) { } return mp | 0; }
function rarCapMul(r) { return r < RAR_TOP() ? RAR[r + 1].m * .97 : Infinity; }
function rarPowMul(it) { const r = it.r | 0, raw = RAR[r].m * (1 + .1 * (it.plus || 0)); return Math.min(raw, rarCapMul(r)); }
function affBand(k, r) { const A = AFF[k]; if (!A) return [0, 0]; const lo = A.min, R = (A.max * BAND_SPAN) / A.min, N = RAR.length; return [lo * Math.pow(R, r / N), lo * Math.pow(R, (r + 1) / N)]; }
function affScale(k, eil) { const A = AFF[k]; return A && A.sc ? Math.pow(A.sc, eil) : 1; }
function affVal(it, a, eil) {
  const [bl, bh] = affBand(a.k, it.r | 0), sc = affScale(a.k, eil);
  if (a.q === undefined) { const base = a.v / affScale(a.k, it.il | 0); a.q = Math.max(0, Math.min(1, bh > bl ? (base - bl) / (bh - bl) : .5)); }
  const v = Math.min((bl + (bh - bl) * a.q) * (1 + .05 * (it.plus || 0)), bh) * sc;   // upgrades stay inside the band
  return v >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
}
function rarAura(it, o) { const n = RAR_RANK(it.r | 0); if (!n) return; if (it.slot === 'weapon') o.critD = (o.critD || 0) + 3 * n; else if (it.slot === 'ring' || it.slot === 'amulet') o.dmg = (o.dmg || 0) + .6 * n; else o.hpPct = (o.hpPct || 0) + .8 * n; }
function rarAuraTxt(it) { const n = RAR_RANK(it.r | 0); if (!n) return ''; return it.slot === 'weapon' ? `+${3 * n}% crit damage` : (it.slot === 'ring' || it.slot === 'amulet') ? `+${(.6 * n).toFixed(1)}% damage` : `+${(.5 * n).toFixed(1)}% max life`; }
itemStats = function (it) {
  const o = {}, eil = attuneLvl(it), rm = rarPowMul(it);
  if (it.slot === 'weapon') o.wdmg = WT[it.t].dmg * Math.pow(1.15, eil) * rm;
  else { const b = AT[it.t].base; for (const k in b) { let v = b[k]; if (k === 'hp') v *= Math.pow(1.11, eil); if (k === 'mp') v *= Math.pow(1.03, eil); o[k] = v * rm; } }
  for (const a of it.aff) { a.v = affVal(it, a, eil); o[a.k] = (o[a.k] || 0) + a.v; }
  if (it.sock) for (const g of it.sock) if (g) o[GEMS[g.g].st] = (o[GEMS[g.g].st] || 0) + gemVal(g.g, g.t);
  rarAura(it, o);
  return o;
};
// new rolls get a quality inside their rarity band
{ const _raR = rollAffixes; rollAffixes = function (it) { _raR(it); for (const a of it.aff) { a.q = Math.random(); a.v = affVal(it, a, it.il | 0); } }; }
