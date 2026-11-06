// ================= RESUME WHERE YOU LEFT OFF: snapshot the floor on quit, rebuild it on Continue with a 5s frozen countdown =================
const RES_KEYS = ['secret', 'braz', 'qit', 'floorTiles', 'explored', 'expPct', 'cleared', 'altar', 'dig', 'haz', 'chests', 'shrines', 'traps', 'pick', 'stairs', 'exit', 'total', 'killed', 'stairsOpen', 'mod'];
const b64 = a => { let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
const unb64 = (str, T) => { const s = atob(str), a = new T(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
function canResume() { return S && P && M && G.mode === 'play' && !G.inTown && !G.tutorial && !G.trial && !G.gauntlet && P.hp > 0 && G.region !== undefined; }
function snapShot() { // composite the 3D view + overlay into a small JPEG
  try { render3D(0); drawOverlay(); const w = 960, h = Math.round(w * VH / VW), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.drawImage(cv3, 0, 0, w, h); x.drawImage(cv, 0, 0, w, h); return c.toDataURL('image/jpeg', .62); } catch (e) { return null; } }
function captureResume(withShot) {
  if (!canResume()) return;
  const m = {}; for (const k in M) { const v = M[k]; if (k === 'flow') continue; m[k] = v instanceof Uint8Array ? { u8: b64(v) } : v; }
  const ens = G.ens.filter(e => !e.dead && !e.prop && e.type !== 'dummy').map(e => ({ type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, elite: e.elite || null, champ: !!e.champ, name: e.d && e.d.n, boss: !!e.boss, counted: !!e.counted, golden: !!e.golden, nemesis: !!e.nemesis, invader: !!e.invader, minion: !!e.minion, awake: !!e.awake, dmg: e.dmg, r: e.r, xp: e.xp, gold: e.gold }));
  const props = G.ens.filter(e => !e.dead && e.prop).map(e => ({ type: e.type, x: e.x, y: e.y }));
  const g = {}; for (const k of RES_KEYS) if (G[k] !== undefined) g[k] = G[k];
  const prev = S.resume;
  S.resume = { v: 1, t: Date.now(), region: G.region, floor: G.floor, depth: G.depth, abyss: !!G.abyss, pw: G.pw, diff: S.diff, M: m, ens, props, g, P: { x: P.x, y: P.y, hp: P.hp, mp: P.mp, surge: P.surge, face: P.face }, shot: withShot ? snapShot() : (prev && prev.shot) || null };
  try { const str = JSON.stringify(S.resume); if (str.length > 1.6e6) S.resume.shot = null; } catch (e) { S.resume = null; }
}
function clearResume() { if (S && S.resume) S.resume = null; }
// keep the snapshot fresh while playing, drop it when the floor is over
let resT = 0;
{ const _uR = update; update = function (dt) {
  if (G.frozen > 0) { G.frozen -= dt; pressed = {}; mouse.down = false; resumeTick(); if (G.frozen <= 0) endFreeze(); return; }
  _uR(dt); resT -= dt; if (resT <= 0) { resT = 15; if (canResume()) { captureResume(false); saveGame(); } } }; }
{ const _gtR = goTown; goTown = function () { clearResume(); _gtR(); }; }
{ const _efR = enterFloor; enterFloor = function (r, f, d) { clearResume(); _efR(r, f, d); }; }
{ const _dieR = die; die = function () { clearResume(); _dieR(); }; }
// quitting: Save & Quit, closing the tab, switching away
{ const _qtR = quitToTitle; quitToTitle = function () { captureResume(true); _qtR(); }; }
addEventListener('beforeunload', () => { if (canResume()) { captureResume(true); saveGame(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && canResume()) { captureResume(true); saveGame(); } });
// ---------- restore ----------
function restoreLevel(R) {
  resetLevel(); G.inTown = false; G.abyss = R.abyss; G.region = R.region; G.floor = R.floor; G.depth = R.depth; S.diff = R.diff ?? S.diff; G.pw = R.pw;
  const m = {}; for (const k in R.M) { const v = R.M[k]; m[k] = v && v.u8 !== undefined ? unb64(v.u8, Uint8Array) : v; } m.flow = new Int16Array(m.w * m.h); M = m;
  for (const k in R.g) G[k] = R.g[k];
  for (const s of R.ens) {
    const e = s.boss ? mkBoss(s.type, s.x, s.y) : mkEnemy(s.type, s.x, s.y, { elite: !!s.elite, minion: s.minion, awake: s.awake }); if (!e) continue;
    e.elite = s.elite; e.hp = s.hp; e.maxHp = s.maxHp; e.dmg = s.dmg ?? e.dmg; e.r = s.r ?? e.r; e.xp = s.xp ?? e.xp; e.gold = s.gold ?? e.gold; e.counted = s.counted; e.golden = s.golden; e.nemesis = s.nemesis; e.invader = s.invader; e.awake = s.awake;
    if (s.champ) { e.champ = true; e.d = { ...e.d, n: s.name }; } else if (s.nemesis && s.name) e.d = { ...e.d, n: s.name };
    if (s.boss) G.boss = e;
  }
  for (const s of R.props || []) mkEnemy(s.type, s.x, s.y, { prop: true });
  P.x = R.P.x; P.y = R.P.y; P.hp = Math.min(ST.maxHp, R.P.hp); P.mp = Math.min(ST.maxMp, R.P.mp); P.surge = R.P.surge || 0; P.face = R.P.face || 0; P.dodgeT = 0; P.air = 0; P.inv = 1; P.phx = true;
  G.cam.x = P.x; G.cam.y = P.y; G.mode = 'play'; computeFlow(); buildLevel(); calcStats();
}
// ---------- the frozen countdown ----------
const FRZ = document.createElement('div'); FRZ.id = 'freeze'; FRZ.innerHTML = '<img><div class="fz"><div class="fzt">Resuming your expedition</div><div class="fzn">5</div><div class="fzs"></div><div class="fzk">Get ready — press Enter to start now</div></div>'; document.body.appendChild(FRZ);
function startFreeze(R) { G.frozen = 5; const img = FRZ.querySelector('img'); if (R.shot) { img.src = R.shot; img.style.display = ''; } else img.style.display = 'none';
  FRZ.querySelector('.fzs').innerHTML = `${G.abyss ? `Abyss Depth ${G.depth}` : `${REG[G.region].n} — Floor ${G.floor + 1}`} • ${G.ens.filter(e => !e.dead && e.counted).length} foes remain • ${fmt(P.hp)} / ${fmt(ST.maxHp)} life`;
  FRZ.style.display = 'flex'; FRZ.classList.remove('out'); resumeTick(); }
function resumeTick() { const n = FRZ.querySelector('.fzn'), v = Math.max(1, Math.ceil(G.frozen)); if (n.textContent !== String(v)) { n.textContent = v; n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); if (typeof sfx === 'function') sfx('click'); } }
function endFreeze() { G.frozen = 0; FRZ.classList.add('out'); setTimeout(() => { FRZ.style.display = 'none'; }, 450); P.inv = 1.5; toast('▶ Back in action!', '#9ad0ff'); sfx('shrine'); }
addEventListener('keydown', e => { if (G.frozen > 0 && (e.key === 'Enter')) { G.frozen = .01; } });
{ const _cgR = continueGame; continueGame = function () {
  let R = null; try { const s = loadGame(); R = s && s.resume && s.resume.v === 1 ? s.resume : null; } catch (e) { }
  _cgR();
  if (!R) return;
  try { restoreLevel(R); closeMenu(); startFreeze(R); } catch (e) { console.warn('resume failed', e); S.resume = null; goTown(); }
}; }
WIKI_TXT.basics.push(['Continue Where You Left Off', 'If you quit, close the game or switch away while on a dungeon floor, the floor is saved exactly as it was — the map, the surviving monsters, loot on the ground, your position and life. Press Continue and you return to that moment: a frozen picture of the scene counts down from 5, then play resumes. (Trials, the Gauntlet and the tutorial restart from Haven instead.)']);
const frzStyle = document.createElement('style'); frzStyle.textContent = `#freeze{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:#000;transition:opacity .45s}#freeze.out{opacity:0}
#freeze img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.85) brightness(.85)}
#freeze .fz{position:relative;text-align:center;padding:26px 46px;border-radius:20px;background:radial-gradient(ellipse at center,rgba(10,8,16,.75),rgba(10,8,16,.35));border:1px solid rgba(214,168,82,.5);box-shadow:0 0 60px rgba(0,0,0,.7)}
#freeze .fzt{font:22px Georgia,serif;color:#ffe2a8;letter-spacing:2px;text-shadow:0 2px 10px #000}#freeze .fzn{font:bold 110px Georgia,serif;color:#ffd27a;line-height:1.1;text-shadow:0 0 30px rgba(255,170,60,.8),0 4px 16px #000}
#freeze .fzn.pop{animation:fzpop .5s ease-out}@keyframes fzpop{0%{transform:scale(1.5);opacity:.3}100%{transform:scale(1);opacity:1}}
#freeze .fzs{font-size:15px;color:#e8dcc0;margin-top:4px}#freeze .fzk{font-size:12px;color:#a89878;margin-top:10px}`; document.head.appendChild(frzStyle);
