// ===== automated smoke test (test build only) =====
(function () {
  const log = [];
  const errs = [];
  window.onerror = (m, s, l, c, e) => { errs.push(m + ' @' + l + ':' + c + ' ' + (e && e.stack)); };
  try {
    localStorage.clear();
    newGame('warrior'); closeMenu(); S.opts.quality = 'low'; resize3D();
    for (const s of SK) S.sk[s.id] = s.a ? 3 : 5;
    calcStats();
    const types = Object.keys(WT);
    const uniqs = Object.keys(UNQ);
    let frameN = 0;
    function sim(frames, label) {
      for (let i = 0; i < frames; i++) {
        frameN++;
        if (i % 120 === 0) {
          // rotate weapons and uniques
          const t = types[(frameN / 120 | 0) % types.length];
          const u = uniqs[(frameN / 120 | 0) % uniqs.length];
          const ak = Object.keys(ARTI); const w = (frameN / 120 | 0) % 2 ? genArtifact(ak[(frameN / 240 | 0) % ak.length], G.pw || 0) : genItem(G.pw || 0, { slot: 'weapon', t, r: 4 }); if (!w.art) w.u = UNQ_W.includes(u) ? u : 'multi';
          S.eq.weapon = w;
          const a = genItem(G.pw || 0, { slot: 'amulet', r: 4 }); a.u = UNQ_A.includes(u) ? u : 'orbit'; S.eq.amulet = a;
          calcStats();
        }
        const tgt = nearestEnemy(P.x, P.y, 2000);
        if (tgt) { mouse.x = VW / 2 + (tgt.x - G.cam.x); mouse.y = VH / 2 + (tgt.y - G.cam.y); }
        mouse.down = true;
        for (const k of ['w', 'a', 's', 'd']) keys[k] = false;
        const goal = tgt && G.killed < G.total * .75 ? tgt : (G.stairs && G.stairsOpen ? G.stairs : G.exit || tgt);
        if (goal) { const a = navToward(goal); if (a !== null) { if (Math.cos(a) > .3) keys.d = true; if (Math.cos(a) < -.3) keys.a = true; if (Math.sin(a) > .3) keys.s = true; if (Math.sin(a) < -.3) keys.w = true; } }
        if (i % 37 === 0) pressed[pick(['q', 'e', 'r', 'f'])] = true;
        if (i % 50 === 0) { const ids = SK.filter(s => s.a).map(s => s.id); S.bind = [pick(ids), pick(ids), pick(ids), pick(ids)]; }
        if (i % 90 === 0) pressed[' '] = true;
        if (i % 200 === 0) pressed['1'] = true;
        if (P.hp < ST.maxHp * .5) P.hp = ST.maxHp;
        P.mp = ST.maxMp;
        update(1 / 60);
        if (i % 150 === 0) { render3D(1 / 15); drawOverlay(); updateHUD(1 / 15); }
        if (i % 300 === 0) { P.surge = 100; pressed.v = true; }
        if (i % 97 === 0 && G.eb.length) { P.dodgeT = .2; }
        if (G.menu) { if (G.menu === 'dialog') { dlgNext(); dlgSkip(); } else closeMenu(); }
        if (G.mode === 'dead') { revive(); }
      }
      console.log('SIM', label, (performance.now()|0)); log.push(`${label}: kills=${S.stats.kills} lvl=${S.lvl} ens=${G.ens.length} floor=${G.floor} abyss=${G.abyss} depth=${G.depth} inTown=${G.inTown} boss=${G.boss ? Math.round(G.boss.hp / G.boss.maxHp * 100) + '%' : 'none'} parts=${G.parts.length}`);
    }
    function navToward(g) {
      const m = M; const d = bfs(m, Math.floor(g.x / TILE), Math.floor(g.y / TILE), 200);
      const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE); const cur = d[ty * m.w + tx];
      if (cur <= 1) return ang(P, g);
      let best = cur, bx = -1, by = -1;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = d[(ty + oy) * m.w + tx + ox]; if (v >= 0 && v < best) { best = v; bx = tx + ox; by = ty + oy; } }
      if (bx < 0) return ang(P, g);
      return Math.atan2((by + .5) * TILE - P.y, (bx + .5) * TILE - P.x);
    }
    enterFloor(0, 0); sim(2400, 'woods f1');
    enterFloor(0, BOSS_F); sim(2400, 'woods boss');
    for (let r = 1; r < NREG; r++) { enterFloor(r, 2); sim(500, REG[r].n + ' f3'); enterFloor(r, BOSS_F); sim(700, REG[r].n + ' boss'); }
    S.done[0][NREG - 1] = true; enterFloor(ABYSS_R, 0, 4); sim(600, 'abyss 4'); enterFloor(ABYSS_R, 0, 5); sim(900, 'abyss 5');
    S.diff = 3; enterFloor(NREG - 1, BOSS_F); sim(600, 'inferno unmaker');
    S.diff = 0;
    for (const m of MODS) { enterFloor(3, 1); G.mod = m.k; sim(200, 'mod ' + m.k); }
    // force a boss kill
    enterFloor(0, BOSS_F); G.boss.hp = 1; hurtEnemy(G.boss, 10, {}); sim(300, 'post-boss');
    log.push('stats pd=' + S.stats.pd + ' surges=' + S.stats.surges + ' combo=' + S.stats.maxCombo + ' barrels=' + S.stats.barrels + ' ach=' + Object.keys(S.ach).length);
    openMenu('title'); log.push('title has reset=' + panel.innerHTML.includes('Reset all progress')); openMenu('slots'); log.push('slots export/import=' + panel.innerHTML.includes('Export') + '/' + panel.innerHTML.includes('Import')); openMenu('confirmReset'); log.push('confirm reset menu=' + panel.innerHTML.includes('erase everything')); closeMenu();
    // polish systems
    enterFloor(2, 1); for (let i = 0; i < 20; i++) update(1 / 60); const th = wantTheme(); try { musicTick(); } catch (e) { errs.push('music ' + e.message); }
    { // streamed OpenGameArt music
      const mchk = (n, c) => { if (!c) errs.push('music check failed: ' + n); };
      mchk('music slots', typeof MUS_SLOTS !== 'undefined' && MUS_SLOTS.length === 17 && ['title', 'town', 'abyss', 'boss', 'trial'].concat([...Array(12)].map((_, i) => 'r' + i)).every(s => MUS_SLOTS.includes(s)));
      mchk('music src', typeof musSrc === 'function' && musSrc('r3') === 'assets/music/r3.m4a');
      mchk('wantTheme in slots', typeof MUS_SLOTS !== 'undefined' && MUS_SLOTS.includes(wantTheme()));
      let mErr = null; try { for (let i = 0; i < 5; i++) musicTick(); } catch (e) { mErr = e; } mchk('music missing files no throw', !mErr);
      mchk('no synth scores', typeof MUS_PIECES === 'undefined' && typeof THEMES === 'undefined');
      // local-file play (file://) drives <audio>.volume directly: volume x .55 x fade level x combat lift, capped at 1
      const near = (a, b) => Math.abs(a - b) < 1e-6;
      mchk('direct volume', typeof musElVol === 'function' && near(musElVol(.3, 1, false), .165) && near(musElVol(.3, .5, true), .3 * .55 * .5 * 1.15) && musElVol(1, 1, true) <= 1 && musElVol(.3, 0, true) === 0);
      mchk('direct mode only on file://', typeof musDirect === 'function' && musDirect() === (location.protocol === 'file:'));
    }
    for (const e of G.ens) if (!e.prop && Math.random() < .5) { e.hp = 0; killEnemy(e); }
    G.hitstop = .05; for (let i = 0; i < 10; i++) update(1 / 60); log.push('theme=' + th + ' hitstop cleared=' + !(G.hitstop > 0));
    G.lastHitBy = 'Dune Scorpion'; P.inv = 0; P.dodgeT = 0; hurtPlayer(1e12, null); openMenu('dead'); log.push('dead recap=' + panel.innerHTML.includes('Slain by')); revive(); for (let i = 0; i < 80; i++) { update(1 / 60); } log.push('report menu=' + G.menu + ' died=' + (G.report && G.report.died)); if (G.menu) { renderMenu(); closeMenu(); }
    H.slots[0].onmouseenter({ clientX: 50, clientY: 50 }); log.push('hud tooltip=' + (tip.style.display === 'flex')); hideTip();
    openMenu('settings'); log.push('settings music=' + panel.innerHTML.includes('Music')); closeMenu();
    goTown(); pressed.t = true; update(1 / 60); log.push('T in town opens=' + G.menu); closeMenu();
    // ---- animation checks ----
    { enterFloor(0, 1); const bad = []; const chk = tag => { render3D(1 / 60); const pl = R3.pl; const vals = [pl.g.position.x, pl.g.position.y, pl.root.rotation.z, pl.root.rotation.y, pl.armR.rotation.z, pl.armR.rotation.y, pl.legL.rotation.z, pl.kneeL.rotation.z, pl.chest.rotation.y, pl.head.rotation.y]; if (vals.some(v => !isFinite(v))) bad.push(tag); };
      for (const t of Object.keys(WT)) { S.eq.weapon = genItem(5, { slot: 'weapon', t, r: 1 }); calcStats(); P.atkCd = 0; doAttack(); for (let i = 0; i < 25; i++) { P.atkCd -= 1 / 60; chk(t); } }
      keys.d = true; for (let i = 0; i < 30; i++) { update(1 / 60); chk('walk'); } keys.d = false;
      P.dodgeT = .24; P.dvx = 600; P.dvy = 0; for (let i = 0; i < 15; i++) { update(1 / 60); chk('dodge'); }
      S.sk.leap = 2; P.cds.leap = 0; P.mp = 1e9; castSkill('leap'); for (let i = 0; i < 40; i++) { update(1 / 60); chk('leap'); }
      S.sk.berserk = 2; P.cds.berserk = 0; castSkill('berserk'); for (let i = 0; i < 30; i++) { update(1 / 60); chk('roar'); }
      S.pots = 2; P.hp = 1; drinkPotion(); for (let i = 0; i < 30; i++) { update(1 / 60); chk('drink'); }
      P.surge = 100; unleashSurge(); for (let i = 0; i < 40; i++) { update(1 / 60); chk('surge'); }
      G.chan = 1.5; for (let i = 0; i < 20; i++) { chk('channel'); G.chan -= 1 / 60; } G.chan = 0;
      AN.cheer = 1.2; for (let i = 0; i < 20; i++) { update(1 / 60); chk('cheer'); }
      P.inv = 0; P.dodgeT = 0; hurtPlayer(1e12, null); for (let i = 0; i < 60; i++) { update(1 / 60); chk('death'); } revive(); for (let i = 0; i < 30; i++) { update(1 / 60); chk('town'); }
      log.push('anim NaN-free=' + (bad.length === 0) + (bad.length ? ' bad:' + [...new Set(bad)].join(',') : '') + ' kneeBend=' + R3.pl.kneeL.rotation.z.toFixed(2)); if (bad.length) errs.push('anim NaN ' + bad.join(',')); if (G.menu) closeMenu(); }
    // ---- 40+ additions ----
    for (const id of ['warcry', 'snare', 'fblink', 'singularity']) { S.sk[id] = 3; P.cds[id] = 0; P.mp = 1e9; enterFloor(4, 1); for (const e of G.ens) e.awake = true; castSkill(id); for (let i = 0; i < 40; i++) update(1 / 60); }
    log.push('new skills cast=' + S.stats.casts);
    for (const k of ['echo', 'sanguine', 'tempest', 'plenty']) P.buffs[k] = 5; enterFloor(5, 2); for (const e of G.ens) e.awake = true; for (let i = 0; i < 200; i++) { P.hp = ST.maxHp; mouse.down = true; update(1 / 60); } mouse.down = false; log.push('shrine buffs ok');
    const el = mkEnemy('skel', P.x + 100, P.y, { awake: true, elite: true }); el.elite = 'Arcane'; const el2 = mkEnemy('skel', P.x - 100, P.y, { awake: true, elite: true }); el2.elite = 'Blinking'; for (let i = 0; i < 400; i++) { P.hp = ST.maxHp; update(1 / 60); } log.push('elite traits eb=' + G.eb.length);
    enterFloor(2, 3); log.push('champion on floor4=' + G.ens.some(e => e.champ));
    S.quests[0] = { t: 'wanted', reg: 1, name: 'Bonepicker', need: 1, have: 0, txt: 'Wanted: Bonepicker', rw: { gold: 10, ore: 1, shards: 1, item: false, marks: 15 } };
    enterFloor(1, 2); const w = G.ens.find(e => e.wanted); log.push('wanted spawned=' + !!w); if (w) killEnemy(w); log.push('wanted done=' + (S.quests[0].have >= 1)); const mk0 = S.marks; claimQuest(0); log.push('wanted marks +' + (S.marks - mk0));
    S.tmaps = 3; let dug = false; for (let tries = 0; tries < 6 && !dug; tries++) { enterFloor(0, 1); if (G.dig) { P.x = G.dig.x; P.y = G.dig.y; for (let i = 0; i < 5; i++) update(1 / 60); dug = G.dig.used; } } log.push('treasure dug=' + dug);
    enterFloor(0, 1); G.font = { x: P.x, y: P.y, used: false }; P.hp = 1; update(1 / 60); log.push('font healed=' + (P.hp >= ST.maxHp * .99));
    G.altar = { x: P.x + 500, y: P.y, used: false, near: false }; S.inv.push(genItem(5, { r: 2 })); offerAltar(S.inv[S.inv.length - 1].id); log.push('altar used=' + G.altar.used);
    let gold = 0; for (let i = 0; i < 2000 && !gold; i++) { const e = mkEnemy('slime', P.x, P.y, {}); if (e.golden) gold = 1; e.dead = true; } log.push('golden spawn seen=' + !!gold);
    S.gold = 1e15; for (const k in HAVEN_B) { buildHaven(k); buildHaven(k); } calcStats(); log.push('haven levels=' + Object.values(S.haven).join(','));
    S.gift = null; claimGift(); log.push('gift claimed=' + (S.gift && S.gift.n)); openMenu('gift'); openMenu('stats'); openMenu('haven'); openMenu('altar'); openMenu('pause'); log.push('hub tiles=' + (panel.innerHTML.match(/class="hubt"/g) || []).length); closeMenu();
    S.cos.pets = ['pup']; S.cos.pet = 'pup'; S.petXp = { pup: 2000 }; calcStats(); log.push('pet lvl=' + petLvl('pup'));
    goTown(); render3D(1 / 60); pressed.u = true; update(1 / 60); updateHUD(1 / 60); log.push('hud hidden=' + ($('hud').style.display === 'none')); pressed.u = true; update(1 / 60);
    S.opts.ui = 1.15; applyUI(); openMenu('settings'); log.push('settings ui=' + panel.innerHTML.includes('Interface size')); closeMenu();
    // tutorial walkthrough
    startTutorial(); dlgSkip(); let guard = 0;
    while (G.tut && guard++ < 80) {
      const g = G.tut, st = TSTEPS[g.i], T = g.T, tg = st.tgt && st.tgt(T);
      if (tg) { P.x = tg.x; P.y = tg.y + 20; }
      for (const e of G.ens) if (!e.dead && e.type !== 'tsentry') { e.hp = 0; killEnemy(e); }
      T.dodges = 3; T.skill = true; T.pot = true; T.surge = true; T.menu = true; T.sk = true; T.talk = true; tutAck();
      if (st.t === 'Secret Rooms' && G.secret && !G.secret.opened) openSecret();
      if (st.t === 'Equip') { const it = S.inv.find(i => i.id === T.item); if (it) equip(it, 'weapon'); }
      if (st.t === 'Chests' && G.chests[0]) G.chests[0].open = true;
      if (st.t === 'Stairs') { P.x = G.stairs.x; P.y = G.stairs.y; }
      for (let i = 0; i < 8; i++) { update(1 / 60); if (G.menu) { if (G.menu === 'dialog') dlgSkip(); else closeMenu(); } }
      if (guard % 4 === 0) { render3D(1 / 60); drawOverlay(); updateHUD(1 / 60); }
    }
    log.push('tutorial done=' + !!S.tutDone + ' steps guard=' + guard + ' inTown=' + G.inTown); if (!S.tutDone || G.tut) errs.push('TUTORIAL did not finish, stuck at step ' + (G.tut ? TSTEPS[G.tut.i].t : '?'));
    // ghost-model check: models in the scene must match live entities after death, pause and level changes
    const ghostCheck = (tag) => { render3D(1 / 60); render3D(1 / 60); const live = G.ens.length + G.allies.length + (G.vill || []).length; const meshes = R3.dyn.children.length; log.push(`ghosts ${tag}: models=${meshes} entities=${live} ${meshes > live ? 'FAIL' : 'ok'}`); if (meshes > live) errs.push('ghost models after ' + tag); };
    enterFloor(2, 1); for (const e of G.ens) e.awake = true; for (let i = 0; i < 60; i++) update(1 / 60); render3D(1 / 60);
    openMenu('pause'); ghostCheck('pause'); closeMenu();
    P.inv = 0; P.dodgeT = 0; hurtPlayer(1e12, null); ghostCheck('death'); revive(); ghostCheck('after-revive-town');
    enterFloor(3, 2); render3D(1 / 60); quitToTitle(); ghostCheck('quit-to-title'); continueGame(); ghostCheck('continue');
    enterFloor(1, 2); render3D(1 / 60); ghostCheck('floor');
    // long-term systems
    S.lvl = Math.max(S.lvl, 40); calcStats(); gainXP(xpNeed(S.lvl) * 6); log.push('para lvl=' + S.para.lvl + ' pts=' + S.para.pts); spendStar('pDmg', 5); openMenu('paragon'); renderMenu();
    for (const k of ['d', 'w']) { startTrial(k); const tr = G.trial; log.push('trial ' + k + ' rules=' + tr.rules.join(',') + ' total=' + G.total + ' stairs=' + !!G.stairs); for (const e of G.ens) if (!e.prop) { e.hp = 0; killEnemy(e); } for (let i = 0; i < 30; i++) update(1 / 60); log.push('trial won=' + tr.done + ' marks=' + S.marks + ' exit=' + !!G.exit); }
    enterFloor(2, 2); G.cursed = { x: P.x + 10, y: P.y, st: 'idle', wave: 0, left: 0, t: 0 }; for (let w = 0; w < 4; w++) { for (let i = 0; i < 5; i++) update(1 / 60); for (const e of G.ens) if (e.cursed && !e.dead) killEnemy(e); for (let i = 0; i < 5; i++) update(1 / 60); } log.push('cursed state=' + G.cursed.st);
    G.merch = { x: P.x, y: P.y, items: genWander(), near: false }; for (let i = 0; i < 3; i++) update(1 / 60); log.push('merchant menu=' + G.menu); S.gold = 1e12; buyWander(G.merch.items[0].id); closeMenu();
    for (let i = 0; i < 20; i++) addGem('ruby', 1); openMenu('jewel'); combineGem('ruby', 1, 1); log.push('ruby t2=' + S.gems.ruby[2] + ' t3=' + S.gems.ruby[3]);
    S.eq.helm = genItem(10, { slot: 'helm', r: 4 }); SELGEM = { g: 'ruby', t: 2 }; sockGem('helm', 0); log.push('socket=' + JSON.stringify(S.eq.helm.sock));
    unlockPet('pup'); S.marks = 9999; openMenu('curio'); buyMarks(10, () => S.ore += 8); openMenu('wardrobe'); S.cos.aura = 'ember'; S.cos.color = '#c8c8d8'; renderMenu();
    seasonState(); S.stats.kills += 99999; const so = seasonObjs(); for (const o of so.filter(o => o.c === 0)) claimSJ(o.id); log.push('season chap=' + S.season.chap.join(',') + ' claimed=' + S.season.claimed.length);
    openMenu('season'); openMenu('portal'); closeMenu();
    goTown(); for (let i = 0; i < 30; i++) { update(1 / 60); } render3D(1 / 60); render3D(1 / 60); drawOverlay(); updateHUD(1 / 60); log.push('pet mesh=' + !!R3.petM + ' wm sword=' + wmLvl('sword'));
    S.lastPlay = Date.now() - 864e5 * 2; grantRested(); log.push('rested=' + Math.round(S.rested));
    SLOT = 2; saveGame(); log.push('slot2 saved=' + !!loadGame(2)); deleteSlot(2); log.push('slot2 deleted=' + !loadGame(2)); SLOT = 0; saveGame();
    log.push('memory placed=' + !!G.memory + ' best entries=' + Object.keys(S.best).length + ' found weapons=' + Object.keys(S.found.w).length);
    S.boonPend = 2; offerBoon(() => log.push('boons done')); takeBoon(G.boonOpts[0]); takeBoon(G.boonOpts[1]); log.push('boons=' + S.boons.length);
    goTown(); for (let i = 0; i < 200; i++) update(1 / 60); render3D(1 / 60); drawOverlay(); log.push('villagers=' + G.vill.length);
    for (const m of ['bestiary', 'arsenal', 'stash', 'wiki']) { openMenu(m); renderMenu(); } WIKI_Q = 'crit'; wikiRender(); log.push('wiki results=' + ($('wikires').children.length)); WIKI_Q = '';
    toStash(S.inv[0] && S.inv[0].id); log.push('stash=' + S.stash.length); talkNPC('sage'); dlgSkip(); closeMenu();
    log.push('portraits=' + Object.keys(PORT).length + ' ok=' + Object.values(PORT).filter(Boolean).length);
    // death
    enterFloor(1, 1); P.inv = 0; P.dodgeT = 0; P.hp = 1; hurtPlayer(99999, null); log.push('dead mode=' + G.mode); revive(); log.push('revived mode=' + G.mode + ' town=' + G.inTown);
    // menus
    goTown(); for (let i = 0; i < 300; i++) { update(1 / 60); if (i % 100 === 0) render3D(1 / 6); }
    for (let i = 0; i < 40; i++) S.inv.push(genItem(10, {}));
    S.inv.length = Math.min(S.inv.length, S.invMax);
    S.gold = 1e9; S.ore = 999; S.shards = 999;
    for (const k of Object.keys(MENUS)) { openMenu(k); renderMenu(); }
    openMenu('inv'); const it = S.inv[0]; uiInv(it.id, {}, 0); uiInv(S.inv[0].id, { shiftKey: true }); tipItem(S.inv[0].id, { clientX: 10, clientY: 10 });
    openMenu('smith'); upgrade(S.eq.weapon.id); reforge(S.eq.weapon.id);
    openMenu('shop'); buyServ('belt'); buyServ('gamble'); buyItem(S.shop[0].id); sellItem(S.inv[0].id); sellJunk();
    openMenu('quests'); S.quests[0].have = S.quests[0].need; claimQuest(0); rerollQuest(1);
    openMenu('sage'); respec();
    openMenu('skills'); learn('vit'); bindSkill('whirl', 0); tipSkill('whirl', { clientX: 1, clientY: 1 });
    S.frag = 500; S.done[0][7] = true; openMenu('smith'); forgeArt('dawn'); log.push('forged=' + S.inv.filter(i => i.art).length + ' frag=' + S.frag);
    for (let i = 0; i < 20; i++) { const it = genItem(30, {}); S.inv.length < S.invMax && S.inv.push(it); }
    const b0 = curScore(); openMenu('inv'); autoEquip(); log.push('autoEquip power ' + b0.toFixed(1) + ' -> ' + curScore().toFixed(1));
    S.inv[0].locked = true; const n0 = S.inv.length; salvageJunk(5); log.push('lock kept=' + S.inv.some(i => i.locked) + ' inv ' + n0 + '->' + S.inv.length);
    openMenu('journal'); S.pages = [0, 1, 2]; S.story.post0 = 1; S.story.arrive0 = 1; renderMenu(); openMenu('settings'); setOpt('autoEq', true); setOpt('autoSalv', true);
    startDialog(STORY_INTRO, () => log.push('dialog done')); for (let i = 0; i < 40; i++) { dlgTick(.05); dlgNext(); }
    openMenu('portal'); openMenu('map'); openMenu('achieve'); openMenu('settings'); setOpt('quality', 'low'); render3D(.016); setOpt('quality', 'high'); autoEquip(); closeMenu();
    quitToTitle(); for (let i = 0; i < 3; i++) { update(1 / 60); render3D(1 / 60); }
    saveGame(); const s2 = fixSave(loadGame()); log.push('save ok lvl=' + s2.lvl + ' inv=' + s2.inv.length);
    continueGame(); sim(200, 'after continue');
    // ---- feature pack (sets, crafting, runes, hazards, secrets, braziers, captives, requests, gauntlet, invasion, loadouts, keybinds) ----
    { const chk = (n, c) => { if (!c) errs.push('FEATURE FAIL ' + n); else log.push('feature ok: ' + n); };
      dlgSkip(); closeMenu(); S.lvl = Math.max(S.lvl, 30); S.shards = 5000; S.ore = 500; S.ess = 5; S.gold = 1e9;
      for (const sl of ['helm', 'armor', 'gloves', 'boots']) S.eq[sl] = genSetItem('warden', sl, 20); calcStats(); const hpSet = ST.maxHp; for (const sl of ['helm', 'armor', 'gloves', 'boots']) S.eq[sl].set = null; calcStats(); const hpNo = ST.maxHp; for (const sl of ['helm', 'armor', 'gloves', 'boots']) S.eq[sl].set = 'warden'; calcStats(); chk('set bonus', hpSet > hpNo);
      CR.slot = 'weapon'; CR.t = 'katana'; CR.r = 4; CR.aff = 'critD'; CR.u = 'echo'; const ci = S.inv.length; if (S.inv.length >= S.invMax) S.inv.pop(); openMenu('craft'); doCraft(); chk('craft', S.inv[S.inv.length - 1].u === 'echo'); closeMenu();
      let hz = 0; for (let i = 0; i < 12; i++) { enterFloor(i, 1); hz += G.haz.length > 0; dlgSkip(); closeMenu(); } chk('hazards every region', hz === 12);
      for (let i = 0; i < 40 && !G.secret; i++) { enterFloor(0, 1); dlgSkip(); closeMenu(); } if (G.secret) { openSecret(); chk('secret room', G.secret.opened); }
      const cg = mkEnemy('cage', P.x + 40, P.y, {}); const r0 = (S.rescued || []).length; hurtEnemy(cg, 10); for (let i = 0; i < 60; i++) update(1 / 60); dlgSkip(); closeMenu(); chk('captive rescued', (S.rescued || []).length === r0 + 1);
      goTown(); const pip = G.vill.find(v => v.n === 'Pip'); if (pip && !S.sq?.done?.pip1) { P.x = pip.x + 20; P.y = pip.y; pip.wt = 99; pip.tx = pip.x; pip.ty = pip.y; pressed = { e: true }; update(1 / 60); dlgSkip(); closeMenu(); chk('haven request accepted', !!S.sq.act.pip1); }
      for (let i = 0; i < 4; i++) S.done[S.diff][i] = true; startGauntlet(); chk('gauntlet starts', !!G.gauntlet && !!G.boss);
      let kills = 0; for (let r = 0; r < 3; r++) { for (let i = 0; i < 900 && !G.boss; i++) { if (G.menu === 'dialog') dlgSkip(); if (G.menu) closeMenu(); update(1 / 60); } if (!G.boss) break; G.boss.hp = 0; killEnemy(G.boss); kills++; }
      chk('gauntlet completes', kills === 3 && !G.gauntlet);
      kbSet('pot', 'z'); enterFloor(0, 1); dlgSkip(); closeMenu(); G.ens = []; G.haz = []; S.pots = 3; P.hp = ST.maxHp * .4; pressed = { z: true }; update(1 / 60); chk('rebound potion key', S.pots === 2); S.opts.kb = {};
      const w1 = S.eq.weapon; loSave(0); const w2 = genItem(10, { slot: 'weapon', t: 'bow' }); S.inv.push(w2); equip(w2, 'weapon'); loLoad(0); chk('loadout', S.eq.weapon === w1);
      const ir = invReg(); enterFloor(ir, 1); dlgSkip(); closeMenu(); chk('invaders', G.ens.some(e => e.invader));
      openMenu('log'); chk('message log', G.log.length > 5); for (const m of ['quests', 'portal', 'settings', 'inv', 'skills', 'wiki', 'achieve']) { openMenu(m); renderMenu(); } closeMenu();
      for (const sl of WGT_SLOTS) S.eq[sl] = genItem(10, { slot: sl, r: 2, wgt: 'heavy' }); calcStats(); chk('armor discipline', ST.disc === 'heavy');
      goTown(); S.ore = 500; S.gold = 1e12; doTemper('helm', 'vit'); chk('temper', S.eq.helm.tmp === 'vit'); const bossT = mkBoss('thornmaw', P.x, P.y); chk('boss hp scaled', bossT.maxHp > BOSS.thornmaw.hp * 1.5); G.ens = G.ens.filter(e => e !== bossT);
      { const x = genItem(30, { slot: 'weapon', t: 'sword', r: 9 }); chk('primordial 2 powers', x.u && x.u2 && x.name.startsWith('Primordial')); let lg = 0; for (let i = 0; i < 20000; i++) if (rollRarity() >= 4) lg++; chk('legendary rare (' + lg + '/20000)', lg < 140); }
      sim(240, 'feature pack sim'); }
  } catch (e) { errs.push('EXC ' + e.message + ' ' + e.stack); }
  const d = document.createElement('pre'); d.id = 'result';
  d.textContent = (errs.length ? 'ERRORS:\n' + errs.join('\n') : 'ALL OK') + '\n' + log.join('\n');
  document.body.appendChild(d);
  document.title = errs.length ? 'TEST FAIL' : 'TEST OK'; console.log('RESULT', d.textContent.replace(/\n/g,' | ')); frame = function () { };
})();
