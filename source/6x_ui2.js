// ================= UI UPGRADE 2: aligned item badges, paper-doll inventory, bag filters & sorting, upgrade markers =================
let INV_F = 'all', INV_SORT = 'rar';
const INV_FILTERS = [['all', 'All'], ['weapon', ico('swords') + ' Weapons'], ['armor', ico('shield') + ' Armor'], ['jewel', ico('jewelry') + ' Jewelry'], ['new', ico('sparkle') + ' New'], ['up', '↑ Upgrades']];
function invMatch(it) { if (INV_F === 'all') return true; if (INV_F === 'weapon') return it.slot === 'weapon'; if (INV_F === 'armor') return WGT_SLOTS.includes(it.slot); if (INV_F === 'jewel') return it.slot === 'ring' || it.slot === 'amulet'; if (INV_F === 'new') return !!it.isNew; if (INV_F === 'up') return isUpgrade(it); return true; }
const UPC = new Map(); let upcT = 0;
function isUpgrade(it) { if (G.t - upcT > 1) { UPC.clear(); upcT = G.t; } if (!UPC.has(it.id)) { let g = 0; try { g = gainPct(it); } catch (e) { } UPC.set(it.id, g); } return UPC.get(it.id) > .5; }
function invSorted(list) { const a = list.slice(); if (INV_SORT === 'rar') a.sort((x, y) => (y.r - x.r) || (y.il - x.il)); else if (INV_SORT === 'lvl') a.sort((x, y) => (y.il - x.il) || (y.r - x.r)); else if (INV_SORT === 'type') a.sort((x, y) => (x.slot + x.t).localeCompare(y.slot + y.t) || (y.r - x.r)); return a; }
function setInvF(f) { INV_F = f; sfx('click'); renderMenu(); } function setInvSort(s) { INV_SORT = s; sfx('click'); renderMenu(); }
function balancedEnd(h, start) { const re = /<div\b|<\/div>/g; re.lastIndex = start; let d = 0, m; while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) return re.lastIndex; } return h.length; }
// cells get an upgrade marker
{ const _cellX = cell; cell = function (it, act) { let h = _cellX(it, act); if (act === 'uiInv' && S && S.inv.includes(it) && isUpgrade(it)) h = h.replace(/<\/div>$/, '<s class="upm" title="Upgrade for you">↑</s></div>'); return h; }; }
{ const _ivX = MENUS.inv; MENUS.inv = () => { let h = _ivX(); if (!S) return h;
  // header: bag capacity bar + currency chips
  const pct = Math.min(100, S.inv.length / S.invMax * 100), full = S.inv.length >= S.invMax;
  h = h.replace(/<h2>Inventory[\s\S]*?<\/h2>/, `<h2 class="invh">${ico('bag')} Inventory <span class="bagcap ${full ? 'full' : ''}"><span class="bagbar"><i style="width:${pct}%"></i></span>${S.inv.length} / ${S.invMax}${full ? ' — full!' : ''}</span><span class="chips"><span class="chip gold">● ${fmt(S.gold)}</span><span class="chip ore">◆ ${S.ore} ore</span><span class="chip shard">✦ ${S.shards} shards</span>${S.ess ? `<span class="chip ess">${ico('essence')} ${S.ess}</span>` : ''}</span></h2>`);
  // paper doll
  h = h.replace('<div class="eq">', '<div class="eq doll"><div class="dollfig">' + ico('person') + '</div>');
  // filtered, sorted bag
  const a = h.indexOf('<div class="grid">'); if (a >= 0) { const b = balancedEnd(h, a); const list = invSorted(S.inv.filter(invMatch)), empties = INV_F === 'all' ? Math.max(0, S.invMax - S.inv.length) : 0;
    const bar = `<div class="invtools"><div class="invf">${INV_FILTERS.map(([k, n]) => `<span class="fchip ${INV_F === k ? 'on' : ''}" onclick="setInvF('${k}')">${n}${k === 'new' ? ` <b>${S.inv.filter(i => i.isNew).length}</b>` : k === 'up' ? ` <b>${S.inv.filter(isUpgrade).length}</b>` : ''}</span>`).join('')}</div><div class="invs">Sort: ${[['rar', 'Rarity'], ['lvl', 'Level'], ['type', 'Type']].map(([k, n]) => `<span class="fchip ${INV_SORT === k ? 'on' : ''}" onclick="setInvSort('${k}')">${n}</span>`).join('')}</div></div>`;
    const grid = `<div class="bagcol">${bar}<div class="grid">${list.map(it => cell(it, 'uiInv')).join('')}${Array.from({ length: empties }, () => '<div class="cell empty"></div>').join('')}${!list.length ? '<div class="dim" style="grid-column:1/-1;padding:16px;text-align:center">Nothing here.</div>' : ''}</div></div>`;
    h = h.slice(0, a) + grid + h.slice(b); }
  h = h.replace('<div class="hint">', '<div class="hint invhint">');
  return h; }; }
// stats: headline summary cards
{ const _shX = statsHTML; statsHTML = function () { const h = _shX(); const w = WT[ST.wt], aps = (1 / w.cd) * atkRate(), dps = pdmg() * aps * (1 + ST.critC / 100 * ST.critD / 100);
  const sum = `<div class="stsum"><div><b>${fmt(dps)}</b><span>DPS</span></div><div><b>${fmt(ST.maxHp)}</b><span>Life</span></div><div><b>${ST.dr.toFixed(0)}%</b><span>Armor</span></div><div><b>${ST.critC.toFixed(0)}%</b><span>Crit</span></div></div>`;
  return h.replace(/(<h3>Lv [^<]*<\/h3>)/, '$1' + sum); }; }
const uiStyle2 = document.createElement('style'); uiStyle2.textContent = `
/* --- item badges always pinned to their corners (fixes NEW / +level / lock misalignment) --- */
html body#px .cell>i,html body#px .cell>b,html body#px .cell>u,html body#px .cell>s{position:absolute!important;z-index:4!important;line-height:1!important;pointer-events:none;text-decoration:none}
html body#px .cell>i{left:2px!important;top:2px!important;right:auto!important;font:bold 8px 'Trebuchet MS',sans-serif!important;letter-spacing:.5px;padding:2px 3px!important;border-radius:4px!important;background:#3ac03a!important;color:#06200a!important;border:none!important;text-shadow:none!important;box-shadow:0 0 6px rgba(58,192,58,.7)!important}
html body#px .cell>b{right:3px!important;bottom:2px!important;left:auto!important;top:auto!important;font:bold 11px 'Trebuchet MS',sans-serif!important;color:#fff3c8!important}
html body#px .cell>u{right:2px!important;top:2px!important;font-size:10px!important}
html body#px .cell>s{left:2px!important;bottom:2px!important;font:bold 10px sans-serif!important;color:#7aff7a!important;text-shadow:0 0 4px #000,0 0 6px #3ac03a!important}
/* --- inventory layout --- */
.invh{display:flex!important;align-items:center;gap:14px;flex-wrap:wrap}
.bagcap{display:inline-flex;align-items:center;gap:8px;font:13px 'Trebuchet MS',sans-serif;color:#d8c8a8}.bagcap.full{color:#ff8a6a}
.bagbar{display:inline-block;width:110px;height:8px;border-radius:8px;background:rgba(0,0,0,.45);overflow:hidden;border:1px solid #3b3144}.bagbar i{display:block;height:100%;background:linear-gradient(90deg,#c78a2a,#ffd27a)}.bagcap.full .bagbar i{background:linear-gradient(90deg,#c0402a,#ff7a5a)}
.chips{display:inline-flex;gap:6px;margin-left:auto}.chip{font:bold 12.5px 'Trebuchet MS',sans-serif;padding:3px 10px;border-radius:14px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08)}
.chip.gold{color:#ffd54a}.chip.ore{color:#8ab8ff}.chip.shard{color:#ff8af0}.chip.ess{color:#ffb05a}
.invwrap{gap:16px!important;align-items:stretch!important}
.eq.doll{position:relative;min-width:208px!important;display:grid!important;grid-template-columns:repeat(3,64px)!important;grid-template-rows:repeat(4,auto);gap:6px 8px!important;justify-content:center;align-content:start;padding:10px 8px;border-radius:14px;background:radial-gradient(ellipse at 50% 45%,rgba(255,210,122,.07),transparent 70%),rgba(0,0,0,.18);border:1px solid #3b3144}
.dollfig{grid-area:2/2/4/3;display:flex;align-items:center;justify-content:center;font-size:64px;opacity:.12;pointer-events:none}
.eq.doll .eqrow:nth-child(2){grid-area:2/1}.eq.doll .eqrow:nth-child(3){grid-area:2/3}.eq.doll .eqrow:nth-child(4){grid-area:1/2}.eq.doll .eqrow:nth-child(5){grid-area:2/2;z-index:1}
.eq.doll .eqrow:nth-child(6){grid-area:3/1}.eq.doll .eqrow:nth-child(7){grid-area:4/2}.eq.doll .eqrow:nth-child(8){grid-area:3/3}.eq.doll .eqrow:nth-child(9){grid-area:1/3}
.eq.doll .eqrow{font-size:10.5px!important;gap:2px;text-align:center}.eq.doll .eqrow .cell{margin:0!important}
.bagcol{display:flex;flex-direction:column;gap:6px}
.invtools{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.invf,.invs{display:flex;gap:4px;flex-wrap:wrap;align-items:center;font-size:12px;color:#a39884}
.fchip{cursor:pointer;padding:3px 9px;border-radius:12px;font:12px 'Trebuchet MS',sans-serif;color:#c8b898;background:rgba(0,0,0,.28);border:1px solid #3b3144;transition:.1s}.fchip:hover{color:#ffe2a8;border-color:#7a5c36}.fchip.on{color:#1a1008;background:#f2c466;border-color:#f2c466;font-weight:bold}.fchip b{font-size:10px;opacity:.8}
.grid{grid-template-columns:repeat(8,52px)!important;gap:2px!important;padding:6px;border-radius:12px;background:rgba(0,0,0,.18);border:1px solid #3b3144}
.invhint{font-size:11.5px!important;opacity:.8}
.stsum{display:grid!important;grid-template-columns:repeat(4,1fr);gap:6px;margin:4px 0 6px;grid-column:1/-1}.stsum>div{display:block!important;text-align:center;padding:6px 2px;border-radius:10px;background:rgba(255,210,122,.07);border:1px solid rgba(193,154,85,.3)}.stsum b{display:block;font:bold 16px Georgia,serif;color:#ffd27a}.stsum span{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#a39884}
`; document.head.appendChild(uiStyle2);
