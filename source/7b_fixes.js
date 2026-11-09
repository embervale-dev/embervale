// ================= safety fixes for duels, co-op state, arena guardians, upgrade markers =================
// leaving a duel any way other than its end screen cleans it up
{ const _gtB = goTown; goTown = function () { if (G.duel && !NET.endingDuel) { const o = G.duel.opp; G.duel = null; duelSend(o, { t: 'duelend' }); } if (NET.coopGuest && !NET.netTown) NET.coopGuest = false; _gtB(); }; }
{ const _edB = endDuel; endDuel = function () { NET.endingDuel = 1; try { _edB(); } finally { NET.endingDuel = 0; } }; }
{ const _qtB = quitToTitle; quitToTitle = function () { if (G.duel) { const o = G.duel.opp; G.duel = null; duelSend(o, { t: 'duelend' }); } NET.coopGuest = false; _qtB(); }; }
{ const _ncB = continueGame; continueGame = function () { G.duel = null; NET.coopGuest = false; _ncB(); }; }
{ const _uB2 = update; update = function (dt) { if (G.duel && pressed.t) pressed.t = false; _uB2(dt); }; }
// a co-op guest who heads off on their own stops being a guest
{ const _efB = enterFloor; enterFloor = function (r, f, d) { if (NET.coopGuest) NET.coopGuest = false; if (G.duel) { const o = G.duel.opp; G.duel = null; duelSend(o, { t: 'duelend' }); } _efB(r, f, d); }; }
{ const _dieB = die; die = function () { if (G.duel && !NET.conns.has(G.duel.opp) && !(NET.conns.size && !NET.host)) G.duel = null; _dieB(); }; }
{ const _nrB = netRecv; netRecv = function (c, m) { if (m && m.t === 'town') NET.netTown = 1; try { _nrB(c, m); } finally { NET.netTown = 0; } }; }
// arena guardians are just very tough arena foes — not real guardian kills
{ const _bdB = bossDefeated; bossDefeated = function (e) { if (G.arena) { G.boss = null; shake(14); banner('Arena Guardian Slain!', `Wave ${G.arena.wave}`, '#ff8a6a'); dropItem(genItem(G.pw + 1, { minR: 2, bonus: .3 }), e.x, e.y); drop('ore', ri(3, 5), e.x, e.y); S.stats.arenaBosses = (S.stats.arenaBosses || 0) + 1; return; } _bdB(e); }; }
// upgrade markers refresh as soon as your gear changes
{ const _csB2 = calcStats; calcStats = function () { _csB2(); if (typeof UPC !== 'undefined') UPC.clear(); }; }
