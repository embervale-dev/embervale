// ================= LONG-TERM PACK 3: skill mastery, monster trophies =================
// ---------- Skill Mastery ----------
const SKM_MAX = 20;
function skmLvl(id) { const x = ((S.skm || {})[id]) || 0; return Math.min(SKM_MAX, Math.floor(Math.sqrt(x / 6))); }
function skmNext(id) { const l = skmLvl(id); return l >= SKM_MAX ? null : (l + 1) * (l + 1) * 6; }
let SKM_MUL = 1;
{ const _pdZ = pdmg; pdmg = function () { return _pdZ() * SKM_MUL; }; }
{ const _csZ = castSkill; castSkill = function (id) { const c0 = id && (P.cds[id] || 0); SKM_MUL = id ? 1 + skmLvl(id) * .02 : 1; try { _csZ(id); } finally { SKM_MUL = 1; }
  if (id && (P.cds[id] || 0) > c0 && !G.inTown && !G.tutorial) { S.skm = S.skm || {}; const l0 = skmLvl(id); S.skm[id] = (S.skm[id] || 0) + 1; const l1 = skmLvl(id); if (l1 > l0) { toast(`${SKI[id].ic} <b>${SKI[id].n}</b> Mastery ${l1}${l1 >= SKM_MAX ? ' — mastered!' : ''} (+${l1 * 2}% damage)`, '#9ae0ff'); sfx('shrine'); } } }; }
{ const _tsZ = tipSkill; tipSkill = function (id, ev) { _tsZ(id, ev); const sk = SKI[id]; if (!sk || !sk.a) return; const c = tip.querySelector('.tc'); if (!c) return; const l = skmLvl(id), nx = skmNext(id);
  c.insertAdjacentHTML('beforeend', `<hr><div style="color:#9ae0ff;font-size:12px">◆ Skill Mastery ${l} / ${SKM_MAX} (+${l * 2}% damage)${nx ? ` <span class="dim">— ${fmt((S.skm || {})[id] || 0)} / ${fmt(nx)} casts</span>` : ' <span class="up">Mastered</span>'}</div>`); }; }
// ---------- Monster Trophies ----------
function trophyCount() { return Object.keys(S.troph || {}).length; }
{ const _kZ = killEnemy; killEnemy = function (e) { if (e.dead) return; _kZ(e); if (e.prop || e.type === 'dummy' || G.tutorial || !EN[e.type] && !BOSS[e.type]) return; S.troph = S.troph || {}; if (S.troph[e.type]) return;
  const ch = e.boss ? .12 : e.champ ? .05 : e.elite ? .006 : .0015; if (Math.random() < ch * (1 + Math.min(300, luckEff()) / 300)) { S.troph[e.type] = 1; const n = (e.boss ? BOSS[e.type] : EN[e.type]).n, c = trophyCount();
    banner('Monster Trophy!', `${n} trophy — ${c} collected${c % 5 === 0 ? ' • +1% damage!' : ''}`, '#e0c27a'); sfx('legend'); calcStats(); saveGame(); } }; }
{ const _xsZ = extraStats; extraStats = function (s) { _xsZ(s); if (S) s.dmg += Math.floor(trophyCount() / 5); }; }
LEDGER.push({ k: 'tr', n: 'Monster trophies', ic: ico('trophy'), c: () => trophyCount(), t: [3, 10, 25, 50], b: '+1% life', f: s => s.hpPct += 1 });
{ const _bsZ = MENUS.bestiary; MENUS.bestiary = () => { const h = _bsZ(); const n = trophyCount(), tot = Object.keys(EN).filter(k => EN[k].ai !== 'prop' && !['dummy', 'tsentry', 'cage'].includes(k)).length + Object.keys(BOSS).length;
  return h.replace('</h2>', `</h2><div class="card" style="padding:6px 12px">${ico('trophy')} <b>Monster Trophies: ${n} / ${tot}</b> <span class="dim">— rare drops (guardians 12%, champions 5%, others very rare). Every 5 trophies: +1% damage forever (now +${Math.floor(n / 5)}%).</span>${n ? `<div style="font-size:12px;color:#e0c27a">${Object.keys(S.troph).map(k => (EN[k] || BOSS[k] || {}).n).filter(Boolean).join(' • ')}</div>` : ''}</div>`); }; }
ACH.push(
  { id: 'skm10', n: 'Practiced Caster', d: 'Reach Skill Mastery 10 with any skill', c: () => Math.max(0, ...Object.keys(S.skm || {}).map(skmLvl)), need: 10, sp: 1 },
  { id: 'skm20', n: 'Grand Master', d: 'Master a skill (Mastery 20)', c: () => Math.max(0, ...Object.keys(S.skm || {}).map(skmLvl)), need: 20, sp: 2 },
  { id: 'tro10', n: 'Trophy Hunter', d: 'Collect 10 monster trophies', c: () => trophyCount(), need: 10, sp: 1 },
  { id: 'tro40', n: 'Grand Taxidermist', d: 'Collect 40 monster trophies', c: () => trophyCount(), need: 40, sp: 3 },
);
WIKI_TXT.skills.push(['Skill Mastery', 'Every active skill levels up as you use it (Mastery 1–20): each level gives that skill +2% damage. Check its tooltip for progress.']);
WIKI_TXT.world.push(['Monster Trophies', 'Each monster type and guardian can drop a one-time trophy (guardians 12%, champions 5%, elites and others rarely). Every 5 trophies gives +1% damage permanently, and the Ledger has a trophy collection too. See them in the Bestiary.']);
