// ================= POLISH 2: one-pass buff icons, final rarity caps, rarity info in tooltips, item power, small improvements =================
// ---------- extra buff icons: collected during the frame, written only when they change (keeps their tooltips working) ----------
let wartKey = null;
{ const _uhP2 = updateHUD; updateHUD = function (dt) { WART_BUF = ''; _uhP2(dt); if (!H || !H['h-buffs']) return; let w = document.getElementById('h-wart');
  if (!w) { w = document.createElement('div'); w.id = 'h-wart'; H['h-buffs'].after(w); }
  if (WART_BUF !== wartKey) { wartKey = WART_BUF; w.innerHTML = WART_BUF; } }; }
// ---------- final rarity caps: lineage, awakening and other boosts can never lift an item past the next rarity ----------
function rarBaseUnit(it) { const eil = attuneLvl(it); return it.slot === 'weapon' ? WT[it.t].dmg * Math.pow(1.15, eil) * (typeof WDMG_MUL !== 'undefined' ? WDMG_MUL : 1) : (AT[it.t].base.hp ? AT[it.t].base.hp * Math.pow(1.11, eil) : 0); }
{ const _isP2 = itemStats; itemStats = function (it) { const o = _isP2(it); const r = it.r | 0; if (r >= RAR_TOP()) return o; const cap = rarBaseUnit(it) * RAR[r + 1].m * .98;
  if (it.slot === 'weapon' && o.wdmg > cap) o.wdmg = cap; else if (it.slot !== 'weapon' && o.hp && cap && o.hp > cap) o.hp = cap; return o; }; }
// ---------- item power: one number to compare any two items ----------
function itemPower(it) { const s = itemStats(it); let p = 0; if (it.slot === 'weapon') p = s.wdmg / WT[it.t].cd * .4; else p = (s.hp || 0) * .06 + (s.dr || 0) * 6 + (s.mp || 0) * .3;
  for (const a of it.aff) { const A = AFF[a.k]; if (A) p += a.v / (A.sc ? Math.pow(A.sc, attuneLvl(it)) : 1) * 2; } p *= 1 + RAR_RANK(it.r | 0) * .08; if (it.u) p *= 1.08; if (it.u2) p *= 1.08; return Math.round(p); }
{ const _itP2 = itemTip; itemTip = function (it, cmp) { let h = _itP2(it, cmp); const r = it.art ? 6 : (it.r | 0), eil = attuneLvl(it), au = rarAuraTxt(it);
  h = h.replace(`• Item Level ${it.il}`, `• <span title="Every item scales to your current power">Attuned · power ${eil}</span>`);
  const capped = (it.plus || 0) && RAR[r].m * (1 + .1 * it.plus) > rarCapMul(r);
  const qs = it.aff.length ? it.aff.reduce((a, x) => a + (x.q ?? .5), 0) / it.aff.length : null;
  const info = `<div class="rinfo"><span>Item power <b>${fmt(itemPower(it))}</b></span>${qs !== null ? `<span>Roll quality ${'★'.repeat(Math.max(1, Math.round(qs * 5)))}${'☆'.repeat(5 - Math.max(1, Math.round(qs * 5)))}</span>` : ''}</div>${au ? `<div class="raura">◆ ${RAR[r].n} aura: ${au}</div>` : ''}${capped ? `<div class="rcap">Upgrades have reached the ${RAR[r].n} power limit — ascend or find a rarer item for more</div>` : ''}`;
  const i = h.indexOf('<hr>'); return i < 0 ? h + info : h.slice(0, i) + info + h.slice(i); }; }
// sort the bag by item power, too
{ const _sortP2 = invSorted; invSorted = function (list) { if (INV_SORT !== 'pow') return _sortP2(list); return list.slice().sort((a, b) => itemPower(b) - itemPower(a)); }; }
{ const _ivP2 = MENUS.inv; MENUS.inv = () => _ivP2().replace(`onclick="setInvSort('type')">Type</span>`, `onclick="setInvSort('type')">Type</span><span class="fchip ${INV_SORT === 'pow' ? 'on' : ''}" onclick="setInvSort('pow')">Power</span>`); }
// ---------- small improvements ----------
// 1) Auto-equip and the upgrade markers now agree with the rarity rule: never swap a rarer item for a lesser one of equal power
{ const _gpP2 = gainPct; gainPct = function (it) { const g = _gpP2(it); const slot = it.slot === 'weapon' ? 'weapon' : it.slot, cur = S && S.eq[slot]; if (cur && (cur.r | 0) > (it.r | 0) && g < 3) return Math.min(g, 0); return g; }; }
// 2) a small "rarity ladder" in the wiki so the order is always clear
WIKI_TXT.items.push(['Rarity Always Wins', 'Higher rarity is always stronger: ' + RAR.map(r => r.n).join(' < ') + '. Every item is attuned to your current power, so an old rare item never falls behind a newer common one, and upgrades can raise an item right up to — but never past — the next rarity\'s power. Each bonus rolls inside its rarity\'s own band (shown as ★ roll quality), every tier adds a built-in rarity aura, and rarer items roll more bonuses, sockets and legendary powers. Item power gives one number for quick comparisons (sort your bag by Power).']);
// 3) Esc closes the chat box first instead of opening the menu
addEventListener('keydown', e => { if (e.key === 'Escape' && typeof CHAT !== 'undefined' && CHAT.open) { e.preventDefault(); e.stopImmediatePropagation(); chatClose(); } }, true);
// 4) a clearer bag-full warning right when it happens
{ let wasFull = false; const _uP3 = update; update = function (dt) { _uP3(dt); if (!S || G.mode !== 'play') return; const full = S.inv.length >= S.invMax; if (full && !wasFull && !G.inTown) toast(`${ico('bag')} Your bag is full — new gear stays on the ground. Salvage junk with Shift+Click or visit Haven.`, '#ffb07a'); wasFull = full; }; }
const p2Style = document.createElement('style'); p2Style.textContent = `#h-wart{display:flex;gap:6px;flex-wrap:wrap;max-width:340px;margin-top:6px}#h-wart:empty{display:none}
#tip .rinfo{display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:#d8c8a8;margin:3px 0 2px}#tip .rinfo b{color:#ffd27a}
#tip .raura{font-size:11.5px;color:var(--rc,#c8b898)}#tip .rcap{font-size:11px;color:#ffb07a;margin-top:2px}`; document.head.appendChild(p2Style);
