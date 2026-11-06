// ================= tutorial hooks for the newer systems =================
{ const _tvT = talkVillager; talkVillager = function (v) { if (G.tut) G.tut.T.talk = true; return _tvT(v); }; }
{ const _uhzT = updHazards; updHazards = function (dt) { _uhzT(dt); if (G.tutorial && P.hp < ST.maxHp * .2) P.hp = ST.maxHp * .2; }; }
// ================= keep world labels from drawing on top of HUD panels =================
let HUD_RECTS = [], hudRectT = 0;
const HUD_CLIP_IDS = ['h-left', 'h-tr', 'h-boss', 'h-slots', 'h-menu', 'tutbox', 'h-target', 'h-xp'];
const _doClip = drawOverlay;
drawOverlay = function () {
  _doClip(); if (!S || G.mode === 'title' || G.hideHud) return;
  if (G.t - hudRectT > .4 || G.t < hudRectT) { hudRectT = G.t; HUD_RECTS = []; for (const id of HUD_CLIP_IDS) { const el = $(id); if (!el || !el.offsetParent) continue; const r = el.getBoundingClientRect(); if (r.width > 4 && r.height > 4) HUD_RECTS.push(r); }
    document.querySelectorAll('.globe').forEach(el => { const r = el.getBoundingClientRect(); if (r.width) HUD_RECTS.push(r); }); }
  X.save(); X.setTransform(DPR, 0, 0, DPR, 0, 0); for (const r of HUD_RECTS) X.clearRect(r.left - 2, r.top - 2, r.width + 4, r.height + 4); X.restore();
};
