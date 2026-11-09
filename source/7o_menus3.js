// ================= UI v3: gameplay menus (inventory, item tooltips, skill tree, trade & crafting) =================
// Everything here re-lays-out the HTML the older menu chain produces (all of its buttons, onclicks and
// wrappers keep working) and styles it with the shared UI v3 tokens from 7l_ui3.js. Globals use the m3 prefix.
function m3Frag(h) { const d = document.createElement('div'); d.innerHTML = h; return d; }
function m3IdOf(el) { const m = /(?:tipItem|uiInv|buyItem|sellItem|noop)\((\d+)/.exec((el.getAttribute('onmouseenter') || '') + ' ' + (el.getAttribute('onclick') || '')); return m ? +m[1] : null; }
function m3Rc(it) { return it.set && typeof SETS !== 'undefined' && SETS[it.set] ? SETS[it.set].col : RAR[it.art ? 6 : (it.r | 0)].c; }
// rarity colour on every item cell inside a fragment (used by the frames and glows)
function m3Tint(root, find = findItem) {
  root.querySelectorAll('.cell').forEach(c => { const id = m3IdOf(c); const it = id != null && find(id); if (!it) return;
    c.style.setProperty('--rc', m3Rc(it)); c.classList.add('m3t'); if ((it.art ? 6 : it.r) >= 3) c.classList.add('m3hi'); });
}
function m3Pow(it) { try { return itemPower(it); } catch (e) { return 0; } }
function m3SlotName(sl) { return (SLOTN[sl] || sl).replace(/\s*\[.*\]/, ''); }
const M3_FIG = `<svg class="m3fig" viewBox="0 0 120 260" aria-hidden="true"><defs><radialGradient id="m3fg" cx="50%" cy="42%" r="58%"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".28"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient><linearGradient id="m3fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3049"/><stop offset="1" stop-color="#16111d"/></linearGradient></defs>
<ellipse cx="60" cy="122" rx="60" ry="118" fill="url(#m3fg)"/><ellipse cx="60" cy="248" rx="42" ry="6" fill="rgba(0,0,0,.55)"/>
<g fill="url(#m3fb)" stroke="rgba(232,194,122,.38)" stroke-width="1.2"><circle cx="60" cy="28" r="16"/>
<path d="M52 46 L68 46 L70 54 Q92 56 96 66 L104 112 Q106 140 100 150 L94 150 L92 116 L86 82 L84 128 Q86 134 84 140 L82 244 L66 244 L62 150 L58 150 L54 244 L38 244 L36 140 Q34 134 36 128 L34 82 L28 116 L26 150 L20 150 Q14 140 16 112 L24 66 Q28 56 50 54 Z"/></g></svg>`;

// ---------------------------------------------------------------- inventory ----------------------------------------------------------------
function m3DollSlot(sl) {
  const it = S.eq[sl];
  return `<div class="m3slot ${it ? 'has' : ''}" data-sl="${sl}">${it ? cell(it, 'uiInv') : `<div class="cell empty m3empty" title="${m3SlotName(sl)}: empty">${ico('slot-' + (sl === 'weapon2' ? 'weapon' : sl))}</div>`}<span class="m3sl">${m3SlotName(sl)}</span></div>`;
}
function m3Doll() {
  const L = ['helm', 'amulet', 'armor', 'gloves'], R = ['weapon', 'weapon2', 'ring', 'boots'];
  const gp = SLOTS.reduce((a, sl) => a + (S.eq[sl] ? m3Pow(S.eq[sl]) : 0), 0);
  return `<section class="m3-doll m3p"><div class="m3pt"><span>Equipment</span><span class="m3gp" title="Total item power of everything you wear">${ico('bolt')} ${fmt(gp)}</span></div>
  <div class="m3-dollg"><div class="m3dcol">${L.map(m3DollSlot).join('')}</div><div class="m3figw">${M3_FIG}<div class="m3cls"><b>${CLS[S.cls] ? CLS[S.cls].n : ''}</b><span>Level ${S.lvl}</span></div></div><div class="m3dcol">${R.map(m3DollSlot).join('')}</div></div></section>`;
}
function m3Inv(h) {
  const d = m3Frag(h), wrap = d.querySelector('.invwrap'); if (!wrap) return h;
  const kids = [...d.children], wi = kids.indexOf(wrap), head = kids.find(e => e.tagName === 'H2');
  const bag = wrap.querySelector('.bagcol'), stats = wrap.querySelector('.stats'); if (!bag || wi < 0) return h;
  const tabsEls = kids.slice(0, wi).filter(e => e !== head), acts = [], foot = []; // whatever sits above the bag (the menu tabs) stays on top, untouched
  for (const e of kids.slice(wi + 1)) (e.tagName === 'SPAN' ? acts : foot).push(e);
  const out = document.createElement('div'); tabsEls.forEach(t => out.appendChild(t));
  const root = document.createElement('div'); root.className = 'm3-inv'; out.appendChild(root);
  if (head) { head.classList.add('m3-ih'); root.appendChild(head); }
  const body = document.createElement('div'); body.className = 'm3-ib'; root.appendChild(body);
  body.insertAdjacentHTML('beforeend', m3Doll());
  bag.classList.add('m3-bag', 'm3p'); bag.insertAdjacentHTML('afterbegin', `<div class="m3pt"><span>Backpack</span><span class="dim">${S.inv.length} / ${S.invMax}</span></div>`);
  const grid = bag.querySelector('.grid'); if (grid) grid.classList.add('m3grid');
  if (acts.length) { const a = document.createElement('div'); a.className = 'm3-acts'; acts.forEach(x => a.appendChild(x)); bag.appendChild(a); }
  body.appendChild(bag);
  if (stats) { const sec = document.createElement('section'); sec.className = 'm3-stats m3p'; sec.innerHTML = '<div class="m3pt"><span>Character</span></div>'; sec.appendChild(stats); body.appendChild(sec); }
  wrap.querySelectorAll(':scope > :not(.eq):not(.bagcol):not(.stats)').forEach(x => foot.push(x)); // anything another wrapper added
  if (foot.length) { const f = document.createElement('div'); f.className = 'm3-if'; foot.forEach(x => f.appendChild(x)); root.appendChild(f); }
  m3Tint(root);
  return out.innerHTML;
}
{ const _m3iv = MENUS.inv; MENUS.inv = () => { const h = _m3iv(); if (!S) return h; try { return m3Inv(h); } catch (e) { console.warn('m3 inv', e); return h; } }; }
// bag search: same behaviour, scoped to the backpack grid
invSearch = function (q) { INV_QS = q; const t = q.trim().toLowerCase();
  for (const c of document.querySelectorAll('#panel .bagcol .grid .cell')) { const id = m3IdOf(c); if (id == null) continue; const it = findItem(id);
    c.style.display = !t || (it && (it.name + ' ' + RAR[it.r].n + ' ' + baseName(it) + ' ' + it.aff.map(a => AFF[a.k] ? AFF[a.k].n : '').join(' ')).toLowerCase().includes(t)) ? '' : 'none'; } };

// ---------------------------------------------------------------- item tooltips ----------------------------------------------------------------
function m3StatName(k) { return k === 'wdmg' ? ' Weapon Damage' : k === 'hpPct' ? '% Max Life' : AFF[k] ? AFF[k].n : null; }
function m3StatVal(k, v) { const a = Math.abs(v); return k === 'wdmg' || (AFF[k] && AFF[k].flat) ? fmt(Math.round(a)) : String(Math.round(a * 10) / 10); }
function m3Delta(it, cur) {
  let a, b; try { a = itemStats(it); b = itemStats(cur); } catch (e) { return ''; }
  const rows = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const n = m3StatName(k); if (!n) continue; const dv = (a[k] || 0) - (b[k] || 0);
    if (Math.abs(dv) < (k === 'wdmg' || (AFF[k] && AFF[k].flat) ? .5 : .05)) continue; rows.push([k, n, dv]); }
  if (!rows.length) return `<div class="m3cmp"><div class="m3ch">If equipped</div><div class="dim">No stat changes</div></div>`;
  rows.sort((x, y) => (y[2] > 0) - (x[2] > 0));
  return `<div class="m3cmp"><div class="m3ch">If equipped <span>replaces ${cur.name}</span></div>${rows.map(([k, n, dv]) => `<div class="m3dr ${dv > 0 ? 'up' : 'dn'}"><span>${n.replace(/^[% ]+/, '')}</span><b>${dv > 0 ? '+' : '−'}${m3StatVal(k, dv)}${/^%/.test(n) ? '%' : ''}</b></div>`).join('')}</div>`;
}
function m3Sockets(it) {
  const n = typeof nSock === 'function' ? nSock(it) : 0; if (!n) return '';
  let h = ''; for (let i = 0; i < n; i++) { const g = it.sock && it.sock[i]; const G_ = g && GEMS[g.g];
    h += G_ ? `<span class="m3so on" style="--gc:${G_.col}" title="${GEM_TN[g.t]} ${G_.n}: +${Math.round(gemVal(g.g, g.t) * 10) / 10}${G_.u}">${G_.ic}</span>` : '<span class="m3so" title="Empty socket (Jeweler Sefa in Haven)"></span>'; }
  return `<div class="m3sock"><span>Sockets</span>${h}</div>`;
}
function m3TipCard(tc, x, i, cur) {
  if (!tc || !x || tc.classList.contains('m3it')) return;
  tc.classList.add('m3it'); if (i) tc.classList.add('m3eqd'); tc.style.setProperty('--rc', m3Rc(x));
  const tn = tc.querySelector('.tn'), chip = tc.querySelector('.rchip'); if (!tn) return;
  const sub = tn.nextElementSibling && tn.nextElementSibling.classList.contains('dim') ? tn.nextElementSibling : null;
  const gi = tn.querySelector('.gi-item'); if (gi) gi.remove();
  const head = document.createElement('div'); head.className = 'm3th';
  head.innerHTML = `<div class="m3ti">${icon(x)}${x.plus ? `<b>+${x.plus}</b>` : ''}</div><div class="m3tt"></div>`;
  const tt = head.lastElementChild; if (chip) tt.appendChild(chip); tt.appendChild(tn); if (sub) { sub.classList.add('m3sub'); tt.appendChild(sub); }
  const body = document.createElement('div'); body.className = 'm3tb'; while (tc.firstChild) body.appendChild(tc.firstChild);
  tc.appendChild(head); tc.appendChild(body);
  const so = m3Sockets(x); if (so) { const ri = body.querySelector('.rinfo'); if (ri) ri.insertAdjacentHTML('afterend', so); else body.insertAdjacentHTML('afterbegin', so); }
  if (!i && cur) body.insertAdjacentHTML('beforeend', m3Delta(x, cur));
}
{ const _m3ti = tipItem; tipItem = function (id, ev) { _m3ti(id, ev); try { const it = findItem(id); if (!it) return; const tcs = tip.querySelectorAll('.tc');
  const cur = eqSlotOf(it) ? null : (it.slot === 'weapon' ? S.eq.weapon : S.eq[it.slot]);
  m3TipCard(tcs[0], it, 0, cur); if (cur) m3TipCard(tcs[1], cur, 1); moveTip(ev); } catch (e) { console.warn('m3 tip', e); } }; }

// ---------------------------------------------------------------- skill tree ----------------------------------------------------------------
const M3_ROMAN = ['I', 'II', 'III', 'IV', 'V'];
function m3SkNode(s) {
  const r = S.sk[s.id] || 0, can = canLearn(s), max = r >= s.max, hov = `onmouseenter="tipSkill('${s.id}',event)" onmousemove="moveTip(event)" onmouseleave="hideTip()"`;
  return `<div class="m3-node ${s.a ? 'act' : 'pas'} ${r ? 'has' : ''} ${can ? 'can' : ''} ${max ? 'max' : ''}">
  <div class="m3-nt" ${hov} ${can ? `onclick="learn('${s.id}')" title="Click to learn"` : ''}>${s.ic}${can ? '<span class="m3-plus">+</span>' : ''}<span class="m3-rk">${r}<span>/${s.max}</span></span></div>
  <div class="m3-rb"><i style="width:${r / s.max * 100}%"></i></div>
  <div class="m3-nn" ${hov}>${s.n}</div><div class="m3-nk">${s.a ? `Active · ${s.mp} mana · ${s.cd}s` : 'Passive'}</div>
  ${s.a && r ? `<div class="binds">${['Q', 'E', 'R', 'F'].map((k, i) => `<span class="bk ${S.bind[i] === s.id ? 'on' : ''}" title="Bind to ${k}" onclick="bindSkill('${s.id}',${i})">${k}</span>`).join('')}</div>` : ''}
  ${s.a ? runeRow(s, r) : ''}</div>`;
}
MENUS.skills = () => {
  const bar = S.bind.map((id, i) => { const s = id && SKI[id]; return `<div class="m3bind ${s ? 'on' : ''}" ${s ? `onmouseenter="tipSkill('${id}',event)" onmousemove="moveTip(event)" onmouseleave="hideTip()"` : 'title="Empty: learn an active skill and click its key"'}><kbd>${'QERF'[i]}</kbd>${s ? s.ic : ''}</div>`; }).join('');
  let h = tabs('skills') + `<div class="m3-sk"><div class="m3-skh"><div class="m3-skt"><h2>Skill Tree</h2><div class="dim">1 point per level, 2 per guardian slain, more from Feats. Tiers unlock as you invest in a branch. Mix branches freely.</div></div>
  <div class="m3-skbar">${bar}</div><div class="m3-pts ${S.sp ? 'on' : ''}"><b>${S.sp}</b><span>point${S.sp === 1 ? '' : 's'}<br>to spend</span></div></div><div class="m3-tree">`;
  for (let b = 0; b < 3; b++) {
    const bp = branchPts(b), nx = TIER_REQ.find(q => q > bp);
    h += `<section class="m3-br" style="--bc:${BRC[b]}"><header><b>${BR[b]}</b><span class="m3-bp">${bp} pts</span><small>${nx != null ? `${nx - bp} more for tier ${M3_ROMAN[TIER_REQ.indexOf(nx)]}` : 'All tiers open'}</small></header><div class="m3-tiers">`;
    for (let t = 0; t < 5; t++) {
      const locked = bp < TIER_REQ[t];
      h += `<div class="m3-tier ${locked ? 'locked' : ''}"><div class="m3-tl"><span>${M3_ROMAN[t]}</span>${locked ? `<em>${TIER_REQ[t]}</em>` : ''}</div><div class="m3-nodes">${SK.filter(s => s.b === b && s.t === t).map(m3SkNode).join('')}</div></div>`;
    }
    h += `</div></section>`;
  }
  return h + `</div><div class="hint">Hover a skill for details • Click a glowing skill to learn a rank • Click Q/E/R/F to bind active skills • Respec at Sage Elowen in Haven</div></div>`;
};

// ---------------------------------------------------------------- shop ----------------------------------------------------------------
function m3Shop(h) {
  const d = m3Frag(h);
  const row = d.querySelector('.ware') && d.querySelector('.ware').parentElement; if (row) row.classList.add('m3wares');
  d.querySelectorAll('.ware').forEach(w => { const c = w.querySelector('.cell'), id = c && m3IdOf(c), it = id != null && S.shop.find(x => x.id === id); if (!it) return;
    const cost = buyCost(it), ok = S.gold >= cost, r = it.art ? 6 : (it.r | 0); let g = null; try { if (it.slot) g = gainPct(it); } catch (e) { }
    for (const a of ['onmouseenter', 'onmousemove', 'onmouseleave']) { w.setAttribute(a, c.getAttribute(a) || ''); c.removeAttribute(a); }
    c.removeAttribute('onclick'); c.removeAttribute('oncontextmenu'); w.setAttribute('onclick', `buyItem(${it.id})`); c.classList.add('m3t'); if (r >= 3) c.classList.add('m3hi');
    w.className = 'ware m3ware' + (ok ? '' : ' poor'); w.style.setProperty('--rc', m3Rc(it));
    w.innerHTML = c.outerHTML + `<div class="m3wi"><b>${it.name}${it.plus ? ` +${it.plus}` : ''}</b><small>${RAR[r].n} ${baseName(it)}</small>${g != null ? `<span class="${g >= 0 ? 'up' : 'dn'}">${g >= 0 ? '+' : ''}${g.toFixed(1)}% power</span>` : ''}</div><div class="m3price ${ok ? '' : 'no'}">${fmt(cost)}<i>g</i></div>`;
  });
  // sell grid: every item shows what it sells for
  d.querySelectorAll('.grid').forEach(gr => { if (!gr.querySelector('[onclick^="sellItem"]')) return; gr.classList.add('m3sellg');
    gr.querySelectorAll('.cell').forEach(c => { const id = m3IdOf(c), it = id != null && S.inv.find(x => x.id === id); if (!it) return;
      const w = document.createElement('div'); w.className = 'm3sc' + (it.locked ? ' lk' : ''); c.replaceWith(w); w.appendChild(c); w.insertAdjacentHTML('beforeend', `<span>${it.locked ? 'locked' : fmt(Math.round(itemVal(it) * sellMul())) + 'g'}</span>`); }); });
  m3Tint(d, id => S.shop.find(x => x.id === id) || findItem(id));
  return d.innerHTML;
}
{ const _m3sh = MENUS.shop; MENUS.shop = () => { const h = _m3sh(); if (!S) return h; try { return m3Shop(h); } catch (e) { console.warn('m3 shop', e); return h; } }; }

// ---------------------------------------------------------------- smith: before/after previews ----------------------------------------------------------------
function m3Smith(h) {
  const d = m3Frag(h);
  d.querySelectorAll('.smrow').forEach(row => { row.classList.add('m3row');
    const c = row.querySelector('.cell'); const id = c ? m3IdOf(c) : null; const it = id != null && findItem(id); if (it) row.style.setProperty('--rc', m3Rc(it));
    const b = row.querySelector('[onclick^="upgrade("]'); if (!b || !it || (it.plus | 0) >= 10) return;
    const a = m3Pow(it), n = m3Pow({ ...it, plus: (it.plus | 0) + 1, aff: it.aff.map(x => ({ ...x })) }), pc = a ? (n / a - 1) * 100 : 0;
    const nm = row.querySelector('.nm'); if (nm) nm.insertAdjacentHTML('beforeend', `<div class="m3prev">Power <b>${fmt(a)}</b><span class="m3arr">→</span><b class="${pc > .05 ? 'up' : 'dim'}">${fmt(n)}</b> <small class="${pc > .05 ? 'up' : 'dim'}">${pc > .05 ? '+' + pc.toFixed(1) + '%' : 'at the rarity limit'}</small> <span class="dim">at +${(it.plus | 0) + 1}</span></div>`);
  });
  m3Tint(d); return d.innerHTML;
}
{ const _m3sm = MENUS.smith; MENUS.smith = () => { const h = _m3sm(); if (!S) return h; try { return m3Smith(h); } catch (e) { console.warn('m3 smith', e); return h; } }; }
for (const k of ['jewel', 'ench', 'alch', 'curio']) if (MENUS[k]) { const _f = MENUS[k]; MENUS[k] = () => { const h = _f(); if (!S) return h; try { const d = m3Frag(h); d.querySelectorAll('.smrow').forEach(r => r.classList.add('m3row')); m3Tint(d); return d.innerHTML; } catch (e) { return h; } }; }

// ---------------------------------------------------------------- crafting: steps + live preview ----------------------------------------------------------------
function m3Craft(h) {
  const d = m3Frag(h), kids = [...d.children]; const firstH3 = kids.findIndex(e => e.tagName === 'H3'); if (firstH3 < 0) return h;
  const out = document.createElement('div'); kids.slice(0, firstH3).forEach(e => out.appendChild(e));
  const lay = document.createElement('div'); lay.className = 'm3-craft'; out.appendChild(lay);
  const steps = document.createElement('div'); steps.className = 'm3-cfs'; const side = document.createElement('aside'); side.className = 'm3-cfside';
  lay.append(steps, side);
  let cur = null;
  for (const e of kids.slice(firstH3)) {
    if (e.tagName === 'H3') { cur = document.createElement('div'); cur.className = 'm3-step'; steps.appendChild(cur); cur.appendChild(e); continue; }
    if (e.classList.contains('card') || e.classList.contains('bigb') || e.tagName === 'SPAN') { side.appendChild(e); continue; }
    (cur || steps).appendChild(e);
  }
  const isW = CR.slot === 'weapon', R = RAR[CR.r] || RAR[2], A = AFF[CR.aff];
  const what = isW ? (WT[CR.t] ? WT[CR.t].n : 'Weapon') : (AT[CR.slot] ? AT[CR.slot].n : CR.slot);
  const ic = isW ? (WT[CR.t] ? WT[CR.t].ic : ico('slot-weapon')) : (AT[CR.slot] ? AT[CR.slot].ic : '');
  side.insertAdjacentHTML('afterbegin', `<div class="m3-cfp" style="--rc:${R.c}"><div class="m3pt"><span>You will forge</span></div><div class="m3-cfh"><div class="m3ti">${ic}</div><div><div class="m3-cfr">${R.n}</div><b>${what}</b></div></div>
  <div class="m3-cfl">${A ? `<div class="up">◆ Guaranteed: ${A.n.replace(/^[% ]+/, '')} <span class="dim">(+15% roll)</span></div>` : ''}${CR.r === 4 ? `<div class="uq">★ ${CR.u && UNQ[CR.u] ? UNQ[CR.u].n : 'Random legendary power'}</div>` : ''}<div class="dim">Plus random bonuses for its rarity, made at your highest item level.</div></div></div>`);
  return out.innerHTML;
}
{ const _m3cf = MENUS.craft; MENUS.craft = () => { const h = _m3cf(); if (!S) return h; try { return m3Craft(h); } catch (e) { console.warn('m3 craft', e); return h; } }; }

// tag the panel with the open menu so the trade-screen styles below stay scoped
{ const _m3rm = renderMenu; renderMenu = function () { _m3rm(); try { panel.setAttribute('data-m3', G.menu || ''); } catch (e) { } }; }

// ---------------------------------------------------------------- styles ----------------------------------------------------------------
{ const st = document.createElement('style'); st.id = 'm3-menus'; st.textContent = `
/* shared panel look */
#panel .m3p{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:var(--r-md);padding:10px 12px 12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 6px 18px rgba(0,0,0,.35);min-width:0}
#panel .m3pt{display:flex;align-items:center;justify-content:space-between;gap:8px;font:600 11px var(--f-head);letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0 0 8px;padding-bottom:6px;border-bottom:1px solid var(--line)}
#panel .m3pt .dim{font:600 11px var(--f-num);letter-spacing:.04em}
#panel .m3gp{color:var(--gold2);font-family:var(--f-num);letter-spacing:.02em}
/* item frames (inventory, doll, shop, smith) */
html body#px #panel :is(.m3-inv,.m3wares,.m3sellg,.m3row) .cell{box-sizing:border-box!important;margin:0!important;border-radius:var(--r-sm)!important;border:1px solid color-mix(in srgb,var(--rc,#4a4058) 80%,#000)!important;
  background:radial-gradient(110% 80% at 50% 105%,color-mix(in srgb,var(--rc,#4a4058) 34%,transparent),transparent 62%),linear-gradient(180deg,#1f1828,#0e0b13)!important;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07)!important;display:flex;align-items:center;justify-content:center;transition:transform .08s,filter .08s,border-color .08s}
html body#px #panel :is(.m3-inv,.m3wares,.m3sellg,.m3row) .cell.m3hi{box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),inset 0 0 12px color-mix(in srgb,var(--rc) 30%,transparent),0 0 10px -2px var(--rc)!important}
html body#px #panel :is(.m3-inv,.m3sellg) .cell:not(.empty):hover{transform:translateY(-1px);filter:brightness(1.18);border-color:var(--rc)!important}
html body#px #panel :is(.m3-inv,.m3wares,.m3sellg,.m3row) .cell .gi-item{width:78%;height:78%}
html body#px #panel .m3-inv .cell.empty{background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.2))!important;border:1px solid rgba(255,255,255,.06)!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.5)!important}
html body#px #panel .m3-inv .cell.m3empty{border:1px dashed var(--line)!important;color:var(--dim)}
html body#px #panel .m3-inv .cell.m3empty .gi{width:46%;height:46%;opacity:.35}
/* ---- inventory ---- */
#panel .m3-inv{container-type:inline-size;font-family:var(--f-body);color:var(--text)}
html body#px #panel .m3-inv h2.m3-ih{display:flex;align-items:center;gap:14px;flex-wrap:wrap;font:600 22px var(--f-head)!important;margin:0 0 10px!important;padding-bottom:8px!important}
#panel .m3-inv .chips{margin-left:auto}#panel .m3-inv .chip{font-family:var(--f-num);background:var(--bg0);border:1px solid var(--line);border-radius:999px}
#panel .m3-ib{display:grid;grid-template-columns:292px minmax(0,1fr) 250px;grid-template-areas:"doll bag stats";gap:12px;align-items:start}
@container (max-width:1020px){#panel .m3-ib{grid-template-columns:280px minmax(0,1fr);grid-template-areas:"doll bag" "stats bag"}}
@container (max-width:640px){#panel .m3-ib{grid-template-columns:minmax(0,1fr);grid-template-areas:"doll" "bag" "stats"}}
#panel .m3-doll{grid-area:doll}#panel .m3-bag{grid-area:bag}#panel .m3-stats{grid-area:stats}
#panel .m3-dollg{display:grid;grid-template-columns:62px minmax(0,1fr) 62px;gap:6px;align-items:stretch}
#panel .m3dcol{display:flex;flex-direction:column;gap:6px}
#panel .m3slot{display:flex;flex-direction:column;align-items:center;gap:2px}
html body#px #panel .m3-inv .m3slot .cell{width:60px!important;height:60px!important;font-size:30px!important}
#panel .m3sl{font:600 9.5px var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);white-space:nowrap}
#panel .m3slot.has .m3sl{color:var(--text)}
#panel .m3figw{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px}
#panel .m3fig{width:100%;max-width:140px;height:auto;max-height:280px;filter:drop-shadow(0 0 14px rgba(255,154,58,.12))}
#panel .m3cls{text-align:center;line-height:1.2;margin-top:2px}#panel .m3cls b{display:block;font:600 14px var(--f-head);color:var(--gold2)}#panel .m3cls span{font-size:11.5px;color:var(--dim)}
#panel .m3-bag{display:flex;flex-direction:column;gap:8px}
#panel .m3-bag .invtools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between}
#panel .m3-bag #invq{flex:1 1 160px;min-width:120px;background:var(--bg0);border:1px solid var(--line);border-radius:var(--r-sm);color:var(--text);font:13px var(--f-body);padding:5px 9px;outline:none}
#panel .m3-bag #invq:focus{border-color:var(--line2);box-shadow:0 0 0 2px rgba(232,194,122,.12)}
#panel .m3-bag .fchip{font-family:var(--f-body);border-radius:999px;background:var(--bg0);border-color:var(--line)}
#panel .m3-bag .fchip.on{background:var(--gold);border-color:var(--gold);color:#1a1008}
html body#px #panel .m3-inv .m3grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr))!important;gap:4px!important;padding:8px!important;margin:0!important;border-radius:var(--r-sm)!important;background:rgba(0,0,0,.28)!important;border:1px solid rgba(0,0,0,.4)!important;box-shadow:inset 0 2px 10px rgba(0,0,0,.45)}
html body#px #panel .m3-inv .m3grid .cell{width:auto!important;height:auto!important;aspect-ratio:1;font-size:28px!important}
#panel .m3-acts{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding-top:2px}
#panel .m3-acts>*{margin:0!important}
#panel .m3-if{margin-top:10px;display:flex;flex-direction:column;gap:8px}
#panel .m3-if .rpick{margin:0}
#panel .m3-if .lorow{margin:0!important}
/* character stats */
html body#px #panel .m3-inv .stats{display:block!important;background:none!important;border:none!important;padding:0!important;margin:0!important;min-width:0!important;font:13px/1.5 var(--f-body)!important}
#panel .m3-inv .stats>h3{font:600 15px var(--f-head)!important;color:var(--gold2)!important;margin:0!important}#panel .m3-inv .stats>h3::after{display:none}
html body#px #panel .m3-inv .stats>div:not(.stsum):not(.stsec):not(.stmore):not(.uq){display:flex;justify-content:space-between;gap:8px;padding:2px 4px!important}
html body#px #panel .m3-inv .stats>div:not(.stsum):not(.stsec):not(.stmore)>span:first-child{color:var(--dim)}
html body#px #panel .m3-inv .stats>div:not(.stsum):not(.stsec):not(.stmore)>span:last-child{color:var(--text);font-family:var(--f-num);font-weight:600}
html body#px #panel .m3-inv .stsum{grid-template-columns:1fr 1fr!important;gap:6px!important;margin:8px 0!important}
html body#px #panel .m3-inv .stsum>div{background:var(--bg0)!important;border:1px solid var(--line)!important;border-radius:var(--r-sm)!important;padding:6px 4px!important}
html body#px #panel .m3-inv .stsum b{font:700 17px var(--f-num)!important;color:var(--gold2)!important}
html body#px #panel .m3-inv .stsec{font:600 10.5px var(--f-head)!important;letter-spacing:.14em!important;color:var(--gold)!important;border-bottom:1px solid var(--line)!important;margin:10px 0 3px!important;padding-bottom:3px!important}
html body#px #panel .m3-inv .sthi{background:linear-gradient(90deg,rgba(255,154,58,.16),transparent)!important;border-radius:var(--r-sm)}
html body#px #panel .m3-inv .sthi span:last-child{color:var(--gold2)!important}
/* ---- item tooltip ---- */
html body#px #tip .tc.m3it.m3it{width:300px!important;padding:0!important;overflow:hidden!important;border-image:none!important;border:1px solid color-mix(in srgb,var(--rc,#8a6a30) 75%,#000)!important;border-radius:var(--r-md)!important;
  background:linear-gradient(180deg,var(--panel2),var(--bg0))!important;box-shadow:var(--shadow),0 0 0 1px rgba(0,0,0,.65),0 0 26px -8px var(--rc)!important;font:13px/1.45 var(--f-body)!important;color:var(--text)!important;filter:none!important}
html body#px #tip .tc.m3it.m3it::before,html body#px #tip .tc.m3it.m3it::after{content:none!important}
#tip .m3th{position:relative;display:flex;gap:10px;align-items:center;padding:10px 12px 9px;background:linear-gradient(180deg,color-mix(in srgb,var(--rc) 36%,#0b0910),color-mix(in srgb,var(--rc) 10%,#0b0910));border-bottom:1px solid color-mix(in srgb,var(--rc) 60%,transparent)}
#tip .m3ti{position:relative;width:54px;height:54px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:var(--r-sm);border:1px solid var(--rc);background:radial-gradient(circle at 50% 62%,color-mix(in srgb,var(--rc) 38%,transparent),#0b0910 74%);box-shadow:0 0 12px -3px var(--rc),inset 0 0 0 1px rgba(0,0,0,.5)}
#tip .m3ti .gi-item{width:46px;height:46px}#tip .m3ti>svg.gi,#tip .m3ti>img.gi{width:34px;height:34px}
#tip .m3ti>b{position:absolute;right:2px;bottom:0;font:700 11px var(--f-num);color:var(--gold2);text-shadow:0 1px 2px #000}
#tip .m3tt{min-width:0;flex:1}
html body#px #tip .tc.m3it.m3it .rchip{display:inline-block;margin:0 0 3px!important;padding:1px 6px!important;border:1px solid color-mix(in srgb,var(--rc) 70%,transparent)!important;border-radius:999px!important;background:rgba(0,0,0,.35)!important;color:var(--rc)!important;font:700 9px var(--f-body)!important;letter-spacing:.14em!important;text-transform:uppercase}
html body#px #tip .tc.m3it.m3it .tn{font:700 16px/1.15 var(--f-head)!important;color:var(--rc)!important;border:none!important;padding:0!important;margin:0!important;text-shadow:0 1px 3px #000,0 0 14px color-mix(in srgb,var(--rc) 50%,transparent)!important;letter-spacing:.01em!important}
#tip .m3sub{font-size:11.5px;margin-top:2px;color:var(--dim)}
#tip .m3tb{padding:8px 12px 10px}
html body#px #tip .tc.m3it.m3it .m3tb hr{border:none!important;border-top:1px solid var(--line)!important;margin:7px 0!important}
#tip .m3it .rinfo{display:flex;gap:12px;margin:0 0 4px}#tip .m3it .rinfo b{color:var(--gold2);font-family:var(--f-num)}
#tip .m3it .up{color:var(--good)}#tip .m3it .dn{color:var(--bad)}#tip .m3it .uq{color:var(--accent)}
#tip .m3sock{display:flex;align-items:center;gap:5px;margin:3px 0 2px;font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.1em}
#tip .m3so{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 35%,#2a2234,#0a080e);border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 2px 4px rgba(0,0,0,.7)}
#tip .m3so.on{border-color:var(--gc);box-shadow:0 0 8px -1px var(--gc),inset 0 0 6px color-mix(in srgb,var(--gc) 40%,transparent)}#tip .m3so .gi{width:13px;height:13px}
#tip .m3cmp{margin-top:8px;padding:7px 8px;border-radius:var(--r-sm);background:rgba(0,0,0,.3);border:1px solid var(--line)}
#tip .m3ch{font:600 10px var(--f-head);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:3px}#tip .m3ch span{font:11px var(--f-body);letter-spacing:0;text-transform:none;color:var(--dim)}
#tip .m3dr{display:flex;justify-content:space-between;gap:8px;font-size:12.5px}#tip .m3dr b{font-family:var(--f-num)}
#tip .m3eqd .m3th::after{content:'Equipped';position:absolute;top:6px;right:8px;font:700 9px var(--f-body);letter-spacing:.14em;text-transform:uppercase;color:#0b0910;background:var(--gold);padding:1px 6px;border-radius:999px}
html body#px #tip .tc.m3it.m3it.m3eqd{opacity:.92}
/* ---- skill tree ---- */
#panel .m3-sk{font-family:var(--f-body);color:var(--text)}
#panel .m3-skh{display:flex;align-items:center;gap:16px;margin-bottom:12px;flex-wrap:wrap}
#panel .m3-skt{flex:1 1 320px;min-width:0}html body#px #panel .m3-skt h2{font:600 22px var(--f-head)!important;margin:0 0 2px!important;padding:0!important;border:none!important}
#panel .m3-skt .dim{font-size:12.5px}
#panel .m3-skbar{display:flex;gap:6px}
#panel .m3bind{position:relative;width:44px;height:44px;border-radius:var(--r-sm);border:1px solid var(--line);background:linear-gradient(180deg,#1f1828,#0e0b13);display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:inset 0 2px 6px rgba(0,0,0,.5)}
#panel .m3bind.on{border-color:var(--line2)}#panel .m3bind kbd{position:absolute;left:3px;top:1px;font:700 10px var(--f-num);color:var(--gold)}
#panel .m3-pts{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--bg0);color:var(--dim)}
#panel .m3-pts b{font:700 26px var(--f-num);color:var(--dim)}#panel .m3-pts span{font-size:11px;line-height:1.15;text-transform:uppercase;letter-spacing:.08em}
#panel .m3-pts.on{border-color:var(--accent);box-shadow:0 0 16px -4px var(--accent)}#panel .m3-pts.on b{color:var(--accent)}
#panel .m3-tree{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@container (max-width:760px){#panel .m3-tree{grid-template-columns:minmax(0,1fr)}}
#panel .m3-sk{container-type:inline-size}
#panel .m3-br{min-width:0;border:1px solid color-mix(in srgb,var(--bc) 35%,var(--line));border-radius:var(--r-md);background:radial-gradient(120% 40% at 50% 0%,color-mix(in srgb,var(--bc) 14%,transparent),transparent 70%),linear-gradient(180deg,var(--panel2),var(--panel));padding:8px 10px 10px}
#panel .m3-br>header{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;padding-bottom:6px;margin-bottom:8px;border-bottom:1px solid color-mix(in srgb,var(--bc) 35%,transparent)}
#panel .m3-br>header b{font:600 16px var(--f-head);color:var(--bc)}#panel .m3-bp{font:600 12px var(--f-num);color:var(--text)}#panel .m3-br>header small{margin-left:auto;font-size:11px;color:var(--dim)}
#panel .m3-tiers{display:flex;flex-direction:column;gap:14px}
#panel .m3-tier{position:relative;display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:start}
#panel .m3-tier+.m3-tier::before{content:'';position:absolute;left:50%;top:-14px;height:14px;width:2px;transform:translateX(-50%);background:linear-gradient(var(--bc),color-mix(in srgb,var(--bc) 40%,transparent));opacity:.7}
#panel .m3-tier.locked::before{background:var(--line)!important;opacity:.6}
#panel .m3-tl{display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:12px}
#panel .m3-tl span{font:600 11px var(--f-head);color:var(--bc)}#panel .m3-tl em{font:normal 600 9.5px var(--f-num);color:var(--bad);white-space:nowrap}
#panel .m3-tier.locked .m3-tl span{color:var(--dim)}
#panel .m3-nodes{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}
#panel .m3-node{flex:0 1 96px;min-width:0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px}
#panel .m3-nt{position:relative;width:50px;height:50px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:30px;border:1px solid var(--line);background:radial-gradient(circle at 50% 60%,rgba(255,255,255,.05),transparent 70%),linear-gradient(180deg,#1f1828,#0e0b13);box-shadow:inset 0 2px 6px rgba(0,0,0,.55);filter:grayscale(.85) brightness(.7);transition:filter .1s,transform .1s,box-shadow .1s}
#panel .m3-node.act .m3-nt{border-radius:50%}
#panel .m3-node.has .m3-nt{filter:none;border-color:color-mix(in srgb,var(--bc) 70%,transparent);box-shadow:inset 0 0 10px color-mix(in srgb,var(--bc) 25%,transparent),0 0 10px -3px var(--bc)}
#panel .m3-node.max .m3-nt{border-color:var(--gold2);box-shadow:inset 0 0 10px rgba(255,217,138,.25),0 0 12px -2px var(--gold2)}
#panel .m3-node.can .m3-nt{filter:none;cursor:pointer;border-color:var(--accent);animation:m3pulse 1.6s ease-in-out infinite}
#panel .m3-node.can .m3-nt:hover{transform:translateY(-1px) scale(1.04)}
@keyframes m3pulse{0%,100%{box-shadow:0 0 6px -2px var(--accent)}50%{box-shadow:0 0 16px 0 var(--accent)}}
#panel .m3-plus{position:absolute;right:-5px;top:-5px;width:18px;height:18px;border-radius:50%;background:var(--accent);color:#1a0d02;font:700 15px/18px var(--f-num);text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.6)}
#panel .m3-rb{width:44px;height:3px;border-radius:2px;background:rgba(0,0,0,.5);overflow:hidden;margin-top:9px}#panel .m3-rb i{display:block;height:100%;background:var(--bc)}
#panel .m3-node.max .m3-rb i{background:var(--gold2)}
#panel .m3-rk{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);padding:0 5px;border-radius:999px;background:var(--bg0);border:1px solid var(--line);font:700 10px/13px var(--f-num);color:var(--text);white-space:nowrap}#panel .m3-rk span{color:var(--dim);font-weight:600}#panel .m3-node.has .m3-rk{border-color:color-mix(in srgb,var(--bc) 60%,transparent)}
#panel .m3-nn{font:600 12px/1.2 var(--f-body);color:var(--text);overflow-wrap:anywhere}
#panel .m3-node:not(.has) .m3-nn{color:var(--dim)}
#panel .m3-nk{font-size:10px;color:var(--dim);line-height:1.2}
#panel .m3-node .binds{display:flex;justify-content:center;gap:2px;margin-top:2px;flex-wrap:wrap}
html body#px #panel .m3-node .bk{min-width:17px;height:17px;padding:0 2px!important;margin:0!important;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;font:700 10px var(--f-num)!important;border-radius:4px!important;border:1px solid var(--line)!important;background:var(--bg0);color:var(--dim);cursor:pointer}
html body#px #panel .m3-node .bk.on{background:var(--gold)!important;border-color:var(--gold)!important;color:#1a1008!important}#panel .m3-node .bk .gi{width:11px;height:11px}
#panel .m3-tier.locked .m3-nodes{opacity:.55}
#panel .m3-sk>.hint{margin-top:10px;font-size:12px;color:var(--dim)}
/* ---- shop ---- */
html body#px #panel .m3wares{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
html body#px #panel .m3ware{display:flex;align-items:center;gap:10px;padding:7px 10px;margin:0!important;text-align:left!important;border:1px solid color-mix(in srgb,var(--rc) 40%,var(--line));border-radius:var(--r-md);background:linear-gradient(90deg,color-mix(in srgb,var(--rc) 12%,var(--panel2)),var(--panel));cursor:pointer;transition:border-color .1s,transform .1s}
#panel .m3ware:hover{border-color:var(--rc);transform:translateY(-1px)}
html body#px #panel .m3ware .cell{width:50px!important;height:50px!important;flex:none}
#panel .m3wi{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}
#panel .m3wi b{color:var(--rc);font:600 13.5px var(--f-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#panel .m3wi small{font-size:11px;color:var(--dim)}#panel .m3wi .up{color:var(--good);font-size:11.5px}#panel .m3wi .dn{color:var(--bad);font-size:11.5px}
#panel .m3price{font:700 15px var(--f-num);color:var(--gold2);white-space:nowrap}#panel .m3price i{font-style:normal;font-size:11px;margin-left:1px;color:var(--gold)}
#panel .m3price.no{color:var(--bad)}#panel .m3ware.poor{opacity:.72}
html body#px #panel .m3sellg{display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr))!important;gap:6px!important;padding:8px!important;border-radius:var(--r-sm);background:rgba(0,0,0,.28);border:1px solid rgba(0,0,0,.4)}
#panel .m3sc{display:flex;flex-direction:column;align-items:center;gap:2px}
html body#px #panel .m3sellg .cell{width:52px!important;height:52px!important}
#panel .m3sc>span{font:700 11px var(--f-num);color:var(--gold2)}#panel .m3sc.lk>span{color:var(--dim);font-weight:600}
/* ---- trade / smith / jeweler rows ---- */
html body#px #panel .m3row{gap:10px;padding:6px 8px!important;margin:4px 0;border:1px solid var(--line)!important;border-radius:var(--r-md);background:linear-gradient(90deg,color-mix(in srgb,var(--rc,#4a4058) 10%,var(--panel2)),var(--panel))}
html body#px #panel .m3row .cell{width:46px!important;height:46px!important;flex:none}
#panel .m3row .nm{flex:1;min-width:0}
#panel .m3prev{font-size:12px;color:var(--dim);margin-top:1px}#panel .m3prev b{font-family:var(--f-num);color:var(--text)}#panel .m3prev b.up,#panel .m3prev .up{color:var(--good)}
#panel .m3arr{margin:0 5px;color:var(--gold)}
/* ---- crafting ---- */
#panel .m3-craft{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:12px;align-items:start;margin-top:8px}
@media (max-width:980px){#panel .m3-craft{grid-template-columns:minmax(0,1fr) 240px}}
#panel .m3-cfs{display:flex;flex-direction:column;gap:8px;min-width:0}
#panel .m3-step{border:1px solid var(--line);border-radius:var(--r-md);background:linear-gradient(180deg,var(--panel2),var(--panel));padding:6px 10px 9px}
html body#px #panel .m3-step h3{margin:0 0 6px!important;font:600 13px var(--f-head)!important;letter-spacing:.08em}
#panel .m3-step .btn{margin:0 4px 4px 0!important}
#panel .m3-cfside{position:sticky;top:0;display:flex;flex-direction:column;gap:8px}
#panel .m3-cfside .card,#panel .m3-cfside .bigb{margin:0!important}
#panel .m3-cfp{border:1px solid color-mix(in srgb,var(--rc) 60%,var(--line));border-radius:var(--r-md);padding:10px 12px;background:radial-gradient(120% 60% at 50% 0%,color-mix(in srgb,var(--rc) 20%,transparent),transparent 70%),linear-gradient(180deg,var(--panel2),var(--panel));box-shadow:0 0 22px -10px var(--rc)}
#panel .m3-cfh{display:flex;align-items:center;gap:10px;margin-bottom:6px}
#panel .m3-cfh .m3ti{width:52px;height:52px;flex:none;display:flex;align-items:center;justify-content:center;font-size:32px;border-radius:var(--r-sm);border:1px solid var(--rc);background:radial-gradient(circle at 50% 62%,color-mix(in srgb,var(--rc) 36%,transparent),#0b0910 74%)}
#panel .m3-cfh b{font:600 15px var(--f-head);color:var(--rc)}#panel .m3-cfr{font:700 9.5px var(--f-body);letter-spacing:.14em;text-transform:uppercase;color:var(--rc)}
#panel .m3-cfl{font-size:12.5px;display:flex;flex-direction:column;gap:2px}#panel .m3-cfl .up{color:var(--good)}#panel .m3-cfl .uq{color:var(--accent)}
`; document.head.appendChild(st); }

// ---------- UI v3 fixes: round shapes, smaller HUD, menus that fit without scrolling ----------
// The pixel-style base rule `#px *::before{border-radius:0!important}` squared off the round frames,
// and the HUD/menus ran too large. These rules use 3 ids so they beat every theme layer.
{ const st = document.createElement('style'); st.id = 'ui3-fix'; st.textContent = `
html body#px #hud #h-bottom .g3w{background:none!important}
html body#px #hud #h-bottom .g3w,html body#px #hud #h-bottom .g3w::before,html body#px #hud #h-bottom .g3w::after,html body#px #hud #h-bottom .g3w .globe,html body#px #hud #h-bottom .g3w .globe::after{border-radius:50%!important}
html body#px #hud #h-tl#h-tl::before{content:none!important;display:none!important}
html body#px #hud #h-tl#h-tl{padding-left:12px!important}
html body#px #hud #h-tr .hpan.mini,html body#px #hud #h-tr .hpan.mini.map3f{background:none!important;border:0!important;outline:0!important;box-shadow:none!important;border-image:none!important;padding:0!important}
html body#px #hud #h-tr .hpan.mini::before,html body#px #hud #h-tr .hpan.mini::after{content:none!important;display:none!important}
html body#px .panel:not(.ttl):not(.dlg){zoom:calc(var(--ui,1) * .84)!important}
html body#px .panel.fitz{zoom:calc(var(--ui,1) * .84)!important}
`; document.head.appendChild(st); }

// ---------- inventory: live 3D preview of your own character (gear, weapon, colours) ----------
const m3_pv = { r: null, sc: null, cam: null, h: null, key: '', cv: null, yaw: 0, drag: null, raf: 0, t0: 0 };
function m3_pvKey() { const e = S.eq || {}; return [S.cls, S.cos && S.cos.color, ...Object.keys(e).sort().map(k => e[k] ? k + ':' + e[k].t + ':' + e[k].r + ':' + (e[k].inf || '') : k)].join('|'); }
function m3_pvBuild() {
  const P3 = m3_pv; if (!P3.r) {
    P3.cv = document.createElement('canvas'); P3.cv.className = 'm3pv';
    P3.r = new T3.WebGLRenderer({ canvas: P3.cv, antialias: true, alpha: true }); P3.r.outputColorSpace = T3.SRGBColorSpace; P3.r.toneMapping = T3.ACESFilmicToneMapping;
    P3.sc = new T3.Scene(); P3.cam = new T3.PerspectiveCamera(30, 1, .1, 50);
    P3.sc.add(new T3.HemisphereLight('#cfd8ff', '#2a2018', 1.1)); const k = new T3.DirectionalLight('#ffe6c0', 2.2); k.position.set(2, 3, 3); P3.sc.add(k); const rim = new T3.DirectionalLight('#ff9a50', 1.2); rim.position.set(-2, 2, -3); P3.sc.add(rim);
    P3.cv.addEventListener('pointerdown', e => { P3.drag = { x: e.clientX, y: P3.yaw }; P3.cv.setPointerCapture(e.pointerId); });
    P3.cv.addEventListener('pointermove', e => { if (P3.drag) P3.yaw = P3.drag.y + (e.clientX - P3.drag.x) * .012; });
    P3.cv.addEventListener('pointerup', () => { P3.drag = null; });
  }
  const key = m3_pvKey(); if (P3.h && P3.key === key) return; P3.key = key;
  if (P3.h) P3.sc.remove(P3.h.g);
  const col = S.cos && S.cos.color || CLS[S.cls].col;
  const h = makeHumanoid({ body: col, cape: shade3(col, .45), hatType: { warrior: 'helm', ranger: 'hood', mage: 'wizard' }[S.cls] });
  try { buildArmorLook(h, S.eq); } catch (e) { console.warn('preview armour', e); }
  try { if (S.eq.weapon) h.hand.add(makeWeaponFull(S.eq.weapon)); } catch (e) { console.warn('preview weapon', e); }
  // no ground disc, and no additive glow sprites (they only look right with the game's bloom)
  h.g.traverse(o => { if (o.isMesh && (o.geometry === GEO.circ || o.userData.wglow || (o.material && o.material.blending === T3.AdditiveBlending))) o.visible = false; });
  P3.h = h; P3.sc.add(h.g);
}
function m3_pvLoop() {
  const P3 = m3_pv; P3.raf = 0; if (!['inv', 'wardrobe'].includes(G.menu) || !P3.cv || !P3.cv.isConnected) return;
  const w = P3.cv.clientWidth, hh = P3.cv.clientHeight; if (w && hh) {
    const d = Math.min(2, devicePixelRatio || 1); if (P3.cv.width !== Math.round(w * d) || P3.cv.height !== Math.round(hh * d)) { P3.r.setPixelRatio(d); P3.r.setSize(w, hh, false); P3.cam.aspect = w / hh; P3.cam.updateProjectionMatrix(); }
    const t = performance.now() / 1000; if (!P3.drag) P3.yaw *= .96;   // drifts back to facing you after a drag
    P3.h.g.rotation.y = -Math.PI / 2 + .35 * Math.sin(t * .5) + P3.yaw;   // models face +X; this turns them toward the camera
    if (typeof applyPose === 'function' && P3.h.hips) { const q = blankPose(); q.rootY = Math.sin(t * 2) * .006; q.headYaw = Math.sin(t * .7) * .15; applyPose(P3.h, q); }
    P3.cam.position.set(0, .95, 3.6); P3.cam.lookAt(0, .72, 0); P3.r.render(P3.sc, P3.cam);
  }
  P3.raf = requestAnimationFrame(m3_pvLoop);
}
{ const _rmPV = renderMenu; renderMenu = function () { _rmPV(); if (G.menu !== 'inv' || !S) return;
  const w = document.querySelector('#panel .m3figw'); if (!w) return;
  try { m3_pvBuild(); const svg = w.querySelector('.m3fig'); if (svg) svg.replaceWith(m3_pv.cv); else if (!m3_pv.cv.isConnected) w.prepend(m3_pv.cv); if (!m3_pv.raf) m3_pv.raf = requestAnimationFrame(m3_pvLoop); } catch (e) { console.warn('3D preview', e); }
}; }

// ---------- journal: a two-page book with a chapter index and a Lost Pages grid ----------
const m3J = { sel: null, page: null };
function m3_jEntries() {
  const E = [];
  if (S.story.intro) E.push({ k: 'pro', t: 'Prologue', s: 'The Fading Flame', col: 'var(--gold2)', body: `<p>${STORY_INTRO.map(l => l[1]).join(' ')}</p>` });
  RSTORY.forEach((r, i) => { if (!S.story['post' + i] && !S.story['arrive' + i]) return; const done = !!S.story['post' + i];
    E.push({ k: 'c' + i, t: `${i + 1}. ${REG[i].n}`, s: r.w, col: REG[i].torch, done, body: `<p>${r.arrive.map(l => l[1]).join(' ')}</p>` + (done ? r.post.map(l => { const sp = dlgSpeakerJ(l[0], i); return `<p class="m3jq"><b style="color:${sp.col}">${sp.n}</b>${l[1]}</p>`; }).join('') : '<p class="m3jw">The guardian still waits...</p>') });
    if (S.story['mem' + i] && RMEM[i]) E.push({ k: 'm' + i, t: 'Memory of ' + r.w, s: 'Ember Memory', col: '#ffe9a0', body: `<p class="m3jm">${RMEM[i].map(l => l[1]).join(' ')}</p>` }); });
  for (const d in ABYSS_STORY) if (S.story['abyss' + d]) E.push({ k: 'a' + d, t: 'The Abyss, depth ' + d, s: 'Below the world', col: '#ff7aa0', body: ABYSS_STORY[d].map(l => `<p class="m3jq"><b style="color:${SPK[l[0]].col}">${SPK[l[0]].n}</b>${l[1]}</p>`).join('') });
  if (S.story.trueend) E.push({ k: 'end', t: 'Epilogue', s: 'Flame and Shadow', col: '#ffd27a', body: `<p>${TRUE_END.map(l => l[1]).join(' ')}</p>` });
  return E;
}
MENUS.journal = () => {
  const E = m3_jEntries(); if (!E.find(e => e.k === m3J.sel)) m3J.sel = E.length ? E[E.length - 1].k : null;
  const cur = E.find(e => e.k === m3J.sel), next = S.done[0].indexOf(false);
  const goal = next >= 0 ? `Free ${RSTORY[next].w} in ${REG[next].n}.` : !S.story.trueend ? 'Descend into the Abyss, or conquer Inferno, to find Morvane\'s shadow.' : 'The tale is told. The Ember burns on.';
  const idx = E.map(e => `<div class="m3ji${e.k === m3J.sel ? ' on' : ''}" onclick="m3J.sel='${e.k}';renderMenu()"><i style="background:${e.col}"></i><span><b>${e.t}</b><small>${e.s}</small></span></div>`).join('') || '<div class="dim">Your story has not begun yet.</div>';
  const pg = m3J.page != null && S.pages.includes(m3J.page) ? m3J.page : null;
  const pages = PAGES.map((p, i) => S.pages.includes(i) ? `<div class="m3pg${pg === i ? ' on' : ''}" onclick="m3J.page=${pg === i ? 'null' : i};renderMenu()">${i + 1}</div>` : `<div class="m3pg lock" title="Not yet found. Pages hide on dungeon floors.">${i + 1}</div>`).join('');
  return tabs('journal') + `<div class="m3j">
  <aside class="m3jl"><div class="m3jh">Chapters</div><div class="m3jlist">${idx}</div><div class="m3jgoal"><span>Next</span>${goal}</div><span class="btn" onclick="replayIntro()">Replay prologue</span></aside>
  <article class="m3jr">${cur ? `<div class="m3jt" style="--c:${cur.col}"><small>${cur.s}</small><h2>${cur.t}</h2></div><div class="m3jb">${cur.body}</div>` : '<div class="dim">Nothing written yet.</div>'}</article>
  <aside class="m3jp"><div class="m3jh">Lost Pages <span>${S.pages.length}/${PAGES.length}</span></div><div class="m3pgs">${pages}</div>${pg != null ? `<div class="m3pgt"><small>Page ${pg + 1}</small>"${PAGES[pg]}"</div>` : '<div class="m3pgt dim">Pick a found page to read it. Pages hide on dungeon floors.</div>'}</aside></div>`;
};

// ---------- flatter look: fewer gradients, quieter glows, no corner brackets ----------
{ const st = document.createElement('style'); st.id = 'ui3-flat'; st.textContent = `
html body#px.smooth #panel:is(.ui3f,.ui3s,.ui3m){background:#141019!important;box-shadow:0 0 0 1px #050307,0 24px 70px rgba(0,0,0,.7)!important;border-color:rgba(214,168,82,.45)!important}
html body#px.smooth #panel .ui3-head{background:#18131e!important;box-shadow:none!important}
html body#px.smooth #panel .ui3-tb::before,html body#px.smooth #panel .ui3-tb::after{content:none!important}
html body#px.smooth #panel :is(h2,.ui3-tb>h2){text-shadow:none!important}
html body#px.smooth #panel .btn{background:#33261a!important;border-color:#6e5330!important;box-shadow:none!important;text-shadow:none!important}
html body#px.smooth #panel .btn:hover{background:#45331f!important;filter:none!important;box-shadow:none!important}
html body#px.smooth #panel :is(.btn.on,.tabs.sub .tab.on,.fitt.on){background:#d2a453!important;border-color:#e8c27a!important;box-shadow:none!important;color:#1b1206!important}
html body#px.smooth #panel .tabs.sub .tab{font-style:normal!important}
html body#px.smooth #panel .ui3-tabhead .tabs.grp .tab.on:not(.ui3-x){background:#1f1927!important;box-shadow:none!important}
html body#px.smooth #panel .ui3-tabhead .tabs.grp .tab:not(.ui3-x):hover{background:rgba(255,255,255,.03)!important}
html body#px.smooth #panel .card,html body#px.smooth #panel .card.done{background:#1a1520!important;box-shadow:none!important}
html body#px.smooth #panel .card.done{background:#1f1a1c!important}
html body#px.smooth #panel .hubt{background:#1a1520!important;box-shadow:none!important}
html body#px.smooth #panel .hubt:hover{transform:none!important;box-shadow:none!important;background:#211a28!important}
html body#px.smooth #panel .pclose{background:#211a28!important;box-shadow:none!important}
html body#px #hud{--h3-trim:linear-gradient(#8f6d38,#8f6d38);--h3-trim-dim:linear-gradient(rgba(150,115,60,.6),rgba(150,115,60,.6));--h3-fill:linear-gradient(rgba(18,14,23,.9),rgba(18,14,23,.9))}
html body#px #hud #h-bottom .g3w::before{background:#8f6d38!important}
/* inventory 3D preview */
#panel .m3figw canvas.m3pv{width:100%;height:300px;display:block;cursor:grab;touch-action:none}
#panel .m3figw canvas.m3pv:active{cursor:grabbing}
/* journal */
#panel .m3j{display:grid;grid-template-columns:240px minmax(0,1fr) 250px;gap:16px;height:calc(var(--ui3h,700px) - 120px);min-height:420px}
#panel .m3j>*{min-height:0;background:#18131d;border:1px solid rgba(214,168,82,.18);border-radius:8px;padding:12px}
#panel .m3jl,#panel .m3jp{display:flex;flex-direction:column;gap:10px}
#panel .m3jh{font:600 13px var(--f-head);letter-spacing:2px;text-transform:uppercase;color:var(--gold);display:flex;justify-content:space-between}
#panel .m3jh span{color:var(--dim);font-family:var(--f-num)}
#panel .m3jlist{flex:1;overflow:auto;display:flex;flex-direction:column;gap:2px;margin:0 -4px;padding:0 4px}
#panel .m3ji{display:flex;gap:9px;align-items:center;padding:6px 8px;border-radius:6px;cursor:pointer}
#panel .m3ji:hover{background:rgba(255,255,255,.04)}#panel .m3ji.on{background:rgba(214,168,82,.12)}
#panel .m3ji i{width:8px;height:8px;border-radius:50%;flex:none}
#panel .m3ji span{display:flex;flex-direction:column;min-width:0}#panel .m3ji b{font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#panel .m3ji small{font-size:12px;color:var(--dim)}
#panel .m3jgoal{font-size:13px;color:var(--text);padding:8px 10px;border-radius:6px;background:rgba(0,0,0,.25)}
#panel .m3jgoal span{display:block;font:600 11px var(--f-head);letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:2px}
#panel .m3jr{overflow:auto;padding:20px 28px;background:#1c1712}
#panel .m3jt small{font:600 12px var(--f-head);letter-spacing:2px;text-transform:uppercase;color:var(--c)}
#panel .m3jt h2{margin:2px 0 12px!important;padding:0 0 10px!important;font-size:24px!important;border-bottom:1px solid rgba(214,168,82,.2)!important}
#panel .m3jb p{font-size:16px;line-height:1.65;color:#e6dac2;margin:0 0 12px}
#panel .m3jb .m3jq b{display:block;font-size:13px;letter-spacing:.5px;margin-bottom:1px}
#panel .m3jb .m3jw,#panel .m3jb .m3jm{font-style:italic;color:var(--dim)}#panel .m3jb .m3jm{color:#efe0b0}
#panel .m3pgs{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
#panel .m3pg{aspect-ratio:1;display:grid;place-items:center;border-radius:5px;font:700 13px var(--f-num);background:#2a2216;border:1px solid #6e5330;color:var(--gold2);cursor:pointer}
#panel .m3pg:hover,#panel .m3pg.on{background:#d2a453;color:#1b1206}
#panel .m3pg.lock{background:rgba(0,0,0,.25);border-color:rgba(255,255,255,.05);color:#4a4252;cursor:default}
#panel .m3pgt{flex:1;overflow:auto;font-size:14.5px;line-height:1.55;font-style:italic;color:#e8dcc0}
#panel .m3pgt small{display:block;font:600 11px var(--f-head);font-style:normal;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:4px}
@media (max-width:1000px){#panel .m3j{grid-template-columns:200px minmax(0,1fr);height:auto}#panel .m3jp{grid-column:1/-1}}
`; document.head.appendChild(st); }

// ---------- page layouts: constellation, wardrobe, bounties, season, feats, stats, bestiary, arsenal, wiki, inventory footer ----------
// The page HTML still comes from the original menus (other files patch it), so each page is re-laid out
// with scoped CSS plus a few small DOM touch-ups after it renders.
function m3_after() {
  const m = G.menu, pn = panel; if (!m || !S) return;
  if (m === 'paragon') pn.querySelectorAll('.star .sv').forEach(e => { const [v, mx] = e.textContent.split('/').map(Number); if (mx) e.style.setProperty('--p', (v / mx * 100).toFixed(1) + '%'); });
  if (m === 'wardrobe') pn.querySelectorAll('.dim').forEach(e => { if (!e.textContent.startsWith('Locked titles:') || e.dataset.m3) return; e.dataset.m3 = 1;
    const L = TITLES.filter(t => !t.c()); e.className = 'm3lk'; e.innerHTML = L.length ? L.map(t => `<span title="${t.how.replace(/"/g, '')}">${ico('lock')} ${t.n}<small>${t.how}</small></span>`).join('') : ''; });
  if (m === 'inv') { const bag = pn.querySelector('.m3-bag'); pn.querySelectorAll('#panel > .card, #panel .m3-ib ~ .card').forEach(c => { if (/Loadouts/.test(c.textContent) && bag && !c.classList.contains('m3-load')) { c.classList.add('m3-load'); bag.appendChild(c); } }); }
  if (m === 'wiki') { const t = pn.querySelector(':scope > .tabs:not(.grp):not(.sub), .ui3-head ~ .tabs'), r = pn.querySelector('#wikires'); if (t && r && !t.parentElement.classList.contains('m3wk')) { const w = document.createElement('div'); w.className = 'm3wk'; t.before(w); w.append(t, r); } }
}
{ const _rmA = renderMenu; renderMenu = function () { _rmA(); try { m3_after(); } catch (e) { console.warn('m3 page', e); } }; }
{ const st = document.createElement('style'); st.id = 'm3-pages'; st.textContent = `
/* shared page bits */
html body#px #panel[data-m3] h2 .dim{font:500 14px var(--f-body)!important;letter-spacing:0!important;text-transform:none!important;color:var(--dim)!important;margin-left:10px}
html body#px #panel[data-m3] .qbar{height:6px!important;border-radius:4px!important;background:rgba(0,0,0,.45)!important;border:0!important;overflow:hidden;margin:6px 0 4px!important}
html body#px #panel[data-m3] .qbar>div{background:#d2a453!important;border-radius:4px!important;box-shadow:none!important}
html body#px #panel[data-m3] .fitbar{background:none!important;border:0!important;padding:0!important;gap:6px!important;flex-wrap:wrap}
html body#px #panel[data-m3] .fitt{font:600 13px var(--f-body)!important;letter-spacing:.3px!important;text-transform:none!important;padding:5px 12px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:999px!important;background:rgba(0,0,0,.25)!important}
html body#px #panel[data-m3] .fitt.on{background:#d2a453!important;color:#1b1206!important;border-color:#e8c27a!important}
/* constellation */
html body#px #panel[data-m3="paragon"] .stars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:12px}
html body#px #panel[data-m3="paragon"] .stars>div{background:#18131d;border:1px solid rgba(214,168,82,.16);border-radius:8px;padding:10px}
html body#px #panel[data-m3="paragon"] .stars h3{font-size:15px!important;margin:0 0 8px!important;padding:0 0 8px!important;border-bottom:1px solid rgba(255,255,255,.06)!important}
html body#px #panel[data-m3="paragon"] .star{display:grid;grid-template-columns:44px minmax(0,1fr);grid-template-rows:auto auto;column-gap:10px;row-gap:6px;align-items:center;padding:8px!important;margin:0 0 6px!important;background:rgba(0,0,0,.22)!important;border:1px solid rgba(255,255,255,.05)!important;border-radius:6px!important}
html body#px #panel[data-m3="paragon"] .star .sv{grid-row:1/3;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font:700 11px var(--f-num)!important;background:radial-gradient(closest-side,#18131d 78%,transparent 80% 100%),conic-gradient(currentColor var(--p,0%),rgba(255,255,255,.08) 0)}
html body#px #panel[data-m3="paragon"] .star>div:nth-child(2){font-size:13px!important;line-height:1.3}
html body#px #panel[data-m3="paragon"] .star>div:nth-child(2) b{font-size:14px;display:block;color:var(--text)}
html body#px #panel[data-m3="paragon"] .star .btn{grid-column:2;padding:2px 10px!important;font-size:12px!important;margin:0 4px 0 0!important;justify-self:start}
html body#px #panel[data-m3="paragon"] .star .btn+.btn{grid-column:2;grid-row:2;margin-left:44px!important}
/* wardrobe */
html body#px #panel[data-m3="wardrobe"] .m3lk{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
html body#px #panel[data-m3="wardrobe"] .m3lk span{display:flex;flex-direction:column;padding:6px 10px;border-radius:6px;background:rgba(0,0,0,.25);border:1px dashed rgba(255,255,255,.1);color:var(--dim);font-size:13px;font-weight:600}
html body#px #panel[data-m3="wardrobe"] .m3lk small{font-weight:400;font-size:11.5px;opacity:.8}
html body#px #panel[data-m3="wardrobe"] .sw{width:42px!important;height:42px!important;border-radius:8px!important;margin:4px!important;border:2px solid rgba(255,255,255,.12)!important;display:inline-block;cursor:pointer}
html body#px #panel[data-m3="wardrobe"] .sw.on{border-color:var(--gold2)!important;outline:2px solid rgba(232,194,122,.35)}
html body#px #panel[data-m3="wardrobe"] .sw.lk{opacity:.25;cursor:default}
html body#px #panel[data-m3="wardrobe"] .row{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
html body#px #panel[data-m3="wardrobe"] .row>.card{width:auto!important;min-height:84px}
/* bounties */
html body#px #panel[data-m3="quests"]>.card,html body#px #panel[data-m3="quests"] .card{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:16px;align-items:center;padding:12px 14px!important;margin:0 0 8px!important}
html body#px #panel[data-m3="quests"] .card>b{font-size:15.5px}
html body#px #panel[data-m3="quests"] .card>*{grid-column:1}
html body#px #panel[data-m3="quests"] .card br{display:none}
html body#px #panel[data-m3="quests"] .card>.btn{grid-column:2;grid-row:1/7;align-self:center}
html body#px #panel[data-m3="quests"] .card.done{border-color:rgba(126,224,126,.45)!important}
/* season */
html body#px #panel[data-m3="season"] .card{padding:12px 14px!important;margin:0 0 10px!important}
html body#px #panel[data-m3="season"] .card>b{font-family:var(--f-head)!important;font-size:16px!important;letter-spacing:1px}
html body#px #panel[data-m3="season"] .smrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:8px 0!important;border-top:1px solid rgba(255,255,255,.05)}
html body#px #panel[data-m3="season"] .smrow .nm{font-size:14px}
/* feats */
html body#px #panel[data-m3="achieve"] .achg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin-top:10px}
html body#px #panel[data-m3="achieve"] .card.ach{display:flex;gap:10px;align-items:flex-start;padding:10px 12px!important;margin:0!important}
html body#px #panel[data-m3="achieve"] .card.ach .ai{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:6px;background:rgba(0,0,0,.3)}
html body#px #panel[data-m3="achieve"] .card.ach.lk{opacity:.7}
html body#px #panel[data-m3="achieve"] .card.ach.done .ai{background:rgba(210,164,83,.18)}
html body#px #panel[data-m3="achieve"] .card.ach b{font-size:14.5px}
html body#px #panel[data-m3="achieve"] .card.ach .dim{font-size:13px!important}
/* stats */
html body#px #panel[data-m3="stats"] h2+div{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))!important;gap:8px!important;min-width:0!important}
html body#px #panel[data-m3="stats"] .smrow{display:flex;flex-direction:column-reverse;align-items:flex-start;gap:2px;padding:12px 14px!important;background:#18131d;border:1px solid rgba(214,168,82,.14);border-radius:8px}
html body#px #panel[data-m3="stats"] .smrow b{font:700 22px var(--f-num)!important;color:var(--gold2)!important}
html body#px #panel[data-m3="stats"] .smrow .nm{font-size:13px;color:var(--dim)}
/* bestiary + arsenal */
html body#px #panel:is([data-m3="bestiary"],[data-m3="arsenal"]) .bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:10px}
html body#px #panel:is([data-m3="bestiary"],[data-m3="arsenal"]) .card.bc,html body#px #panel:is([data-m3="bestiary"],[data-m3="arsenal"]) .bgrid>.card{display:flex;gap:12px;padding:10px 12px!important;margin:0!important;font-size:13px}
html body#px #panel:is([data-m3="bestiary"],[data-m3="arsenal"]) .pimg{width:76px!important;height:76px!important;float:none!important;flex:none;border-radius:8px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.06)}
html body#px #panel:is([data-m3="bestiary"],[data-m3="arsenal"]) .card.lock{opacity:.55}
html body#px #panel:is([data-m3="bestiary"],[data-m3="arsenal"]) h3{font-size:16px!important;margin:16px 0 8px!important}
/* wiki: section list on the left, results on the right */
html body#px #panel[data-m3="wiki"] .m3wk{display:grid;grid-template-columns:200px minmax(0,1fr);gap:16px;align-items:start}
html body#px #panel[data-m3="wiki"] .m3wk>.tabs{display:flex;flex-direction:column;gap:2px;position:sticky;top:120px;background:#18131d;border:1px solid rgba(214,168,82,.16)!important;border-radius:8px;padding:6px!important}
html body#px #panel[data-m3="wiki"] .m3wk>.tabs .tab{text-align:left;font:600 14px var(--f-body)!important;letter-spacing:.2px!important;text-transform:none!important;padding:7px 10px!important;border-radius:6px!important;border:0!important;background:none!important;color:var(--dim)!important}
html body#px #panel[data-m3="wiki"] .m3wk>.tabs .tab:hover{background:rgba(255,255,255,.04)!important;color:var(--text)!important}
html body#px #panel[data-m3="wiki"] .m3wk>.tabs .tab.on{background:rgba(214,168,82,.14)!important;color:var(--gold2)!important}
html body#px #panel[data-m3="wiki"] #wikires{min-width:0!important}
html body#px #panel[data-m3="wiki"] #wikiq{width:320px!important;background:#100c14!important;border:1px solid rgba(214,168,82,.3)!important;border-radius:6px!important;font:15px var(--f-body)!important}
/* inventory: equal-height panels, loadouts folded into the backpack panel */
html body#px #panel[data-m3="inv"] .m3-ib{align-items:stretch!important}
html body#px #panel[data-m3="inv"] .m3-load{margin:12px 0 0!important;padding:10px 0 0!important;background:none!important;border:0!important;border-top:1px solid rgba(255,255,255,.06)!important;border-radius:0!important;display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px}
html body#px #panel[data-m3="inv"] .m3-load .btn{padding:4px 10px!important;font-size:13px!important;margin:0!important}
`; document.head.appendChild(st); }

// ---------- popups with section tabs (settings and others) keep one height, so switching sections never resizes them ----------
{ const _rmFx = renderMenu; renderMenu = function () { _rmFx(); try {
  const fixed = panel.classList.contains('ui3m') && panel.querySelector('.fitbar');
  panel.classList.toggle('ui3fix', !!fixed);
  if (fixed) { const z = parseFloat(getComputedStyle(panel).zoom) || 1, ui = (S && S.opts && +S.opts.ui) || 1; panel.style.setProperty('--ui3h', (Math.min(780 * ui, innerHeight * .9) / z).toFixed(1) + 'px'); }
} catch (e) { } }; }

// ---------- wardrobe: a dressing room with your character on the left ----------
const m3W = { pet: null };
function m3_wPet(k) { const P_ = PETS[k], own = S.cos.pets.includes(k), on = S.cos.pet === k, img = own ? portrait('e', '', P_) : '';
  return `<button class="m3wp${on ? ' on' : ''}${own ? '' : ' lk'}${m3W.pet === k ? ' sel' : ''}" onclick="m3W.pet='${k}';renderMenu()" title="${own ? P_.n : 'Locked'}">${img ? `<img src="${img}" alt="">` : `<span>${ico('lock')}</span>`}</button>`; }
MENUS.wardrobe = () => {
  const c = S.cos, cur = (c.color || CLS[S.cls].col), titles = unlockedTitles(), locked = TITLES.filter(t => !t.c());
  const pk = m3W.pet && PETS[m3W.pet] ? m3W.pet : c.pet || Object.keys(PETS).find(k => c.pets.includes(k)) || Object.keys(PETS)[0], P_ = PETS[pk], own = c.pets.includes(pk), ev = S.petEvo && S.petEvo[pk];
  const ec = typeof evoCost === 'function' ? evoCost() : { marks: 150, frag: 5 };
  const petInfo = `<div class="m3wpi"><b>${own ? P_.n : 'Unknown companion'}</b><p>${P_.b}${own ? ` <span class="dim">at level ${petLvl(pk)} of 10${ev ? ', evolved' : ''}</span>` : ''}</p>
    ${own ? `<div class="m3wpa"><span class="btn ${c.pet === pk ? 'on' : ''}" onclick="S.cos.pet=S.cos.pet==='${pk}'?null:'${pk}';calcStats();renderMenu()">${c.pet === pk ? 'Following you' : 'Summon'}</span>${!ev && petLvl(pk) >= 10 ? `<span class="btn" onclick="evolvePet('${pk}')">Evolve for ${ec.marks} marks and ${ec.frag} fragments</span>` : ''}</div>`
      : `<p class="dim">${P_.cost ? `Sold by Quartermaster Ilse for ${P_.cost} Ember Marks.` : P_.src + '.'}</p>`}</div>`;
  return tabs('wardrobe') + `<div class="m3w">
  <div class="m3wl"><div class="m3figw"><svg class="m3fig"></svg></div><div class="m3wn"><b>${esc(netName ? netName() : 'Kindled')}</b><span>${(titles.find(t => t.k === c.title) || {}).n || ''}</span></div><p class="m3wm">${ico('marks')} ${fmt(S.marks)} Ember Marks <span>More cosmetics at Quartermaster Ilse in Haven.</span></p></div>
  <div class="m3wr">
    <section><h4>Title</h4><div class="m3wt">${titles.map(t => `<button class="${c.title === t.k ? 'on' : ''}" onclick="S.cos.title='${t.k.replace(/'/g, "\\'")}';renderMenu()">${t.n}</button>`).join('')}${locked.map(t => `<button class="lk" title="${t.how.replace(/"/g, '')}" disabled>${t.n}</button>`).join('')}</div><p class="m3wh">${locked.length} more to earn. Hover a dimmed title to see how.</p></section>
    <section><h4>Colour</h4><div class="m3ws">${COLORS.map(col => { const o = ownedColors().includes(col); return `<button class="${cur === col[0] ? 'on' : ''}${o ? '' : ' lk'}" style="--c:${col[0]}" title="${col[1]}${o ? '' : ', sold by the Quartermaster'}" ${o ? `onclick="S.cos.color='${col[0]}';renderMenu()"` : 'disabled'}></button>`; }).join('')}</div></section>
    <section><h4>Aura</h4><div class="m3wt">${c.auras.map(a => { const ac = auraCol(a); return `<button class="${c.aura === a ? 'on' : ''}" onclick="S.cos.aura='${a}';renderMenu()"><i style="background:${ac === 'rainbow' ? 'conic-gradient(#ff6a6a,#ffd36a,#6aff9a,#6ad0ff,#c46aff,#ff6a6a)' : ac || 'transparent'}"></i>${auraName(a)}</button>`; }).join('')}</div></section>
    <section><h4>Companion <span>${c.pets.length} of ${Object.keys(PETS).length}</span></h4><div class="m3wg">${Object.keys(PETS).map(m3_wPet).join('')}</div>${petInfo}<p class="m3wh">Every companion also picks up gold from twice as far away.</p></section>
  </div></div>`;
};
{ const _rmW = renderMenu; renderMenu = function () { _rmW(); if (G.menu !== 'wardrobe' || !S) return;
  const w = document.querySelector('#panel .m3w .m3figw'); if (!w) return;
  try { m3_pvBuild(); m3_pvPet(); const svg = w.querySelector('.m3fig'); if (svg) svg.replaceWith(m3_pv.cv); if (!m3_pv.raf) m3_pv.raf = requestAnimationFrame(m3_pvLoop); } catch (e) { console.warn('wardrobe preview', e); }
}; }
// the companion stands beside you in the preview (wardrobe only)
function m3_pvPet() { const P3 = m3_pv, k = S.cos.pet; if (P3.petK === k) return; P3.petK = k; if (P3.pet) { P3.sc.remove(P3.pet.g); P3.pet = null; }
  if (k && typeof makePetModel === 'function') { try { const p = makePetModel(k); p.g.scale.setScalar(.2); p.g.position.set(.55, 0, .35); p.g.rotation.y = -Math.PI / 2 - .5; P3.sc.add(p.g); P3.pet = p; } catch (e) { } } }
{ const _lp = m3_pvLoop; m3_pvLoop = function () { const P3 = m3_pv; if (P3.pet) { P3.pet.g.visible = G.menu === 'wardrobe'; if (P3.pet.tick) P3.pet.tick(performance.now() / 1000, 0); } _lp(); }; }
{ const st = document.createElement('style'); st.id = 'm3-wardrobe'; st.textContent = `
html body#px #panel.ui3fix{height:var(--ui3h,80vh)!important;max-height:none!important}
#panel .m3w{display:grid;grid-template-columns:300px minmax(0,1fr);gap:28px;align-items:start}
#panel .m3wl{position:sticky;top:110px;text-align:center}
#panel .m3wl .m3figw{background:radial-gradient(60% 50% at 50% 60%,rgba(232,194,122,.08),transparent 70%);border-bottom:1px solid rgba(214,168,82,.2);min-height:0}
#panel .m3wl canvas.m3pv{height:380px}
#panel .m3wn{margin-top:12px;display:flex;flex-direction:column;gap:2px}
#panel .m3wn b{font:600 21px var(--f-head);color:var(--text);letter-spacing:.5px}
#panel .m3wn span{font-size:15px;color:var(--gold)}
#panel .m3wm{margin:14px 0 0;font-size:14px;color:var(--text)}#panel .m3wm span{display:block;color:var(--dim);font-size:13px;margin-top:2px}
#panel .m3wr section{padding:0 0 18px;margin:0 0 18px;border-bottom:1px solid rgba(255,255,255,.06)}
#panel .m3wr section:last-child{border:0}
#panel .m3wr h4{margin:0 0 10px;font:600 16px var(--f-body);color:var(--text);display:flex;gap:10px;align-items:baseline}
#panel .m3wr h4 span{font-size:13px;font-weight:400;color:var(--dim)}
#panel .m3wh{margin:8px 0 0;font-size:13px;color:var(--dim)}
#panel .m3wt{display:flex;flex-wrap:wrap;gap:6px}
#panel .m3wt button{font:600 14px var(--f-body);color:var(--text);background:#211a28;border:1px solid #3a2f44;border-radius:6px;padding:6px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
#panel .m3wt button:hover:not(:disabled){border-color:#7a6040}
#panel .m3wt button.on{background:#3a2c18;border-color:var(--gold);color:var(--gold2)}
#panel .m3wt button.lk{background:none;border-style:dashed;border-color:#2e2636;color:#6a6072;cursor:help}
#panel .m3wt button i{width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.2)}
#panel .m3ws{display:flex;flex-wrap:wrap;gap:8px}
#panel .m3ws button{width:34px;height:34px;border-radius:50%;background:var(--c);border:2px solid #140f19;box-shadow:0 0 0 1px #3a2f44;cursor:pointer;padding:0}
#panel .m3ws button.on{box-shadow:0 0 0 2px var(--gold2)}
#panel .m3ws button.lk{opacity:.22;cursor:default}
#panel .m3wg{display:grid;grid-template-columns:repeat(auto-fill,64px);gap:8px}
#panel .m3wp{width:64px;height:64px;padding:0;border-radius:8px;background:#1d1724;border:1px solid #3a2f44;cursor:pointer;display:grid;place-items:center;overflow:hidden}
#panel .m3wp img{width:100%;height:100%;object-fit:cover}
#panel .m3wp.lk{background:#141018;border-style:dashed;border-color:#2e2636;color:#4e4558}
#panel .m3wp.on{border-color:var(--gold)}#panel .m3wp.sel{box-shadow:0 0 0 2px var(--gold2)}
#panel .m3wpi{margin-top:12px;padding:12px 14px;background:#1a1520;border-radius:8px}
#panel .m3wpi b{font-size:16px;color:var(--text)}#panel .m3wpi p{margin:4px 0 0;font-size:14px;color:var(--good)}#panel .m3wpi p.dim{color:var(--dim)}
#panel .m3wpa{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
@media (max-width:900px){#panel .m3w{grid-template-columns:1fr}#panel .m3wl{position:static}}
`; document.head.appendChild(st); }
