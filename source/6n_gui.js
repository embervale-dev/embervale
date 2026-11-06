// ================= GUI OVERHAUL: floor pips, danger readout, skill-ready flash, heartbeat, minimap label, grouped hub, title embers =================
// ---------- title-screen embers ----------
const EMB = document.createElement('div'); EMB.className = 'embers';
for (let i = 0; i < 34; i++) { const e = document.createElement('i'); const s = 2 + Math.random() * 4; e.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${7 + Math.random() * 9}s;animation-delay:${-Math.random() * 14}s;opacity:0;background:${Math.random() < .3 ? '#ffd27a' : '#ff8a2a'}`; EMB.appendChild(e); }
document.body.appendChild(EMB);
// ---------- HUD additions ----------
let slotPrev = [0, 0, 0, 0], guiInit = false;
const _uhN = updateHUD;
updateHUD = function (dt) {
  _uhN(dt);
  EMB.style.display = G.mode === 'title' || G.menu === 'title' || G.menu === 'slots' || G.menu === 'class' ? 'block' : 'none';
  if (!S || !P || G.mode === 'title' || !M) return;
  if (!guiInit) { guiInit = true; const mm = document.querySelector('.mini'); if (mm && !mm.querySelector('.mzl')) { const z = document.createElement('span'); z.className = 'mzl'; mm.appendChild(z); } }
  // region accent + floor pips + danger
  const tl = $('h-tl'); if (tl) { const R = curReg(); tl.style.setProperty('--racc', G.inTown ? '#ffd27a' : G.abyss ? '#ff5a8a' : (R.torch || '#ffd27a'));
    let pp = $('h-pips'); if (!pp) { pp = document.createElement('div'); pp.id = 'h-pips'; const sub = $('h-sub'); if (sub) sub.after(pp); }
    let html = '';
    if (!G.inTown && !G.abyss && !G.tutorial && !G.trial) { html = '<div class="fpips">' + Array.from({ length: FLOORS }, (_, i) => `<i class="${i === BOSS_F ? 'b ' : ''}${i < G.floor ? 'd' : i === G.floor ? 'c' : ''}"></i>`).join('') + '</div>'; }
    if (!G.inTown && !G.tutorial) { const ml = Math.max(1, Math.round((G.pw - S.diff * 28) * .86) + 1), gap = ml - S.lvl, col = gap >= 6 ? '#ff5a4a' : gap >= 2 ? '#ffb04a' : gap <= -8 ? '#7aa0c0' : '#7aff7a', word = gap >= 6 ? 'Deadly' : gap >= 2 ? 'Dangerous' : gap <= -8 ? 'Trivial' : 'Fair';
      html += `<div class="dngr">Threat: <b style="color:${col}">${word}</b> <span class="dim">• foes ~Lv ${ml}${S.diff ? ' ' + DIFF[S.diff] : ''}</span></div>`; }
    setH(pp, 'pips', html); }
  // skill ready flash
  for (let i = 0; i < 4; i++) { const id = S.bind[i], c = id ? (P.cds[id] || 0) : 0, el = $('sl' + i); if (el && slotPrev[i] > 0 && c <= 0 && id) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } slotPrev[i] = c; }
  // low life heartbeat
  const hg = document.querySelector('.globe.hp'); if (hg) hg.classList.toggle('low', P.hp > 0 && P.hp < ST.maxHp * .3 && !G.inTown);
  const mz = document.querySelector('.mzl'); if (mz) { const t = S.opts.mz ? 'wide' : 'close'; if (mz.textContent !== t) mz.textContent = t; }
};
// ---------- grouped menu hub ----------
const HUB_GROUPS = [['🧙 Character', ['inv', 'skills', 'paragon', 'wardrobe']], ['🏆 Progress', ['quests', 'season', 'achieve', 'ledger', 'stats']], ['🏡 Haven & Log', ['haven', 'exped', 'gift', 'log']], ['📚 Codex & World', ['map', 'journal', 'bestiary', 'arsenal', 'wiki']]];
{ const _paN = MENUS.pause; MENUS.pause = () => { const h = _paN(); const re = /<div class="hubt" onclick="openMenu\('(\w+)'\)">[\s\S]*?<span class="hk">[\s\S]*?<\/span>(?:<i>[\s\S]*?<\/i>)?<\/div>/g; const tiles = {}; let m; while ((m = re.exec(h))) tiles[m[1]] = m[0];
  const a = h.indexOf('<div class="hub">'); if (a < 0) return h; const used = new Set(); let grid = '<div class="hub">';
  for (const [n, keys] of HUB_GROUPS) { const t = keys.filter(k => tiles[k]); if (!t.length) continue; grid += `<div class="hubsec">${n}</div>` + t.map(k => { used.add(k); return tiles[k]; }).join(''); }
  const rest = Object.keys(tiles).filter(k => !used.has(k)); if (rest.length) grid += `<div class="hubsec">✨ More</div>` + rest.map(k => tiles[k]).join('');
  grid += '</div>'; let b = a, depth = 0; const reTag = /<div\b|<\/div>/g; reTag.lastIndex = a; let t; while ((t = reTag.exec(h))) { depth += t[0] === '</div>' ? -1 : 1; if (depth === 0) { b = reTag.lastIndex; break; } }
  return h.slice(0, a) + grid + h.slice(b); }; }
// ---------- character stats: grouped sections with highlights ----------
{ const _shN = statsHTML; statsHTML = function () { let h = _shN();
  const sec = (before, title, ic) => { h = h.replace(`<div><span>${before}</span>`, `<div class="stsec">${ic} ${title}</div><div><span>${before}</span>`); };
  sec('Weapon', 'Offense', '⚔'); sec('Max Life', 'Defense', '🛡'); sec('Magic Find', 'Utility', '✨'); sec('Burn/Freeze', 'Elements', '🔥');
  h = h.replace(/<div><span>Est\. DPS<\/span><span>([^<]*)<\/span><\/div>/, '<div class="sthi"><span>Est. DPS</span><span>$1</span></div>');
  return h; }; }
// ---------- rare things look rare: rarity-themed tooltips, item frames, names and loot feed ----------
{ const _tiN = tipItem; tipItem = function (id, ev) { _tiN(id, ev); const it = findItem(id); if (!it) return; const tcs = tip.querySelectorAll('.tc');
  const cur = eqSlotOf(it) ? null : (it.slot === 'weapon' ? S.eq.weapon : S.eq[it.slot]);
  [it, cur].forEach((x, i) => { const tc = tcs[i]; if (!x || !tc) return; const r = x.art ? 6 : x.r; tc.classList.add('rt' + r); tc.style.setProperty('--rc', RAR[r].c);
    const tn = tc.querySelector('.tn'); if (tn && !tc.querySelector('.rchip')) tn.insertAdjacentHTML('beforebegin', `<div class="rchip">${x.art ? '✦ Celestial Artifact' : RAR[r].n}${x.set ? ' • ◈ Set' : ''}${i ? ' • equipped' : ''}</div>`); }); moveTip(ev); }; }
{ const _feN = feed; feed = function (html, col) { _feN(html, col); const f = $('lootfeed'); const d = f && f.lastElementChild; if (!d || !col) return; const r = RAR.findIndex(x => x.c === col); if (r >= 4) { d.classList.add('lf' + Math.min(r, 8)); d.style.setProperty('--rc', col); } }; }
