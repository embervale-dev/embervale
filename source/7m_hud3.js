// ================= UI v3: in-game HUD =================
// One consistent gold-trim look for everything drawn over the 3D view: life/mana globes, skill bar,
// XP bar, region/objective tracker, currencies, buffs, boss bar, target frame, combo, banner, toasts,
// side menu buttons, party frames and the ping label. Pure restyle plus a thin wrapper around the
// globes: every element id, child order and tooltip that older code relies on is left in place.
// Selectors are anchored on `html body#px #hud` (or a doubled id) so they outrank both the pixel and the
// smooth theme layers in head.html. Colours and fonts come from the shared tokens in 7l_ui3.js.
const hud3_P = 'html body#px';
const hud3_css = (P => `
:root{
  --h3-trim:linear-gradient(180deg,#f2d28c 0%,#a27a36 34%,#5a4119 62%,#c9a25a 100%);
  --h3-trim-dim:linear-gradient(180deg,rgba(214,168,82,.75),rgba(110,80,34,.6) 50%,rgba(170,130,60,.7));
  --h3-fill:linear-gradient(180deg,rgba(33,26,43,.93),rgba(14,11,20,.95));
  --h3-drop:0 6px 18px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,232,176,.08);
}
/* ---------- shared panel frame ---------- */
${P} #hud .hpan:not(.mini),${P} #hud #h-target#h-target,${P} #hud #h-slots#h-slots{
  border:1px solid transparent!important;border-image:none!important;outline:none!important;backdrop-filter:none!important;
  background:var(--h3-fill) padding-box,var(--h3-trim-dim) border-box!important;background-size:auto!important;
  border-radius:var(--r-md)!important;box-shadow:var(--h3-drop)!important;color:var(--text)}

/* ---------- top-left: region and objective tracker ---------- */
${P} #hud #h-left{left:12px;top:12px;gap:6px}
${P} #hud #h-tl#h-tl{position:relative;padding:8px 12px 8px 15px!important;min-width:206px;max-width:290px;font-family:var(--f-body)}
${P} #hud #h-tl#h-tl::before{content:''!important;position:absolute;left:5px;top:9px;bottom:9px;width:2px;border-radius:2px;background:var(--racc,var(--gold2));box-shadow:0 0 8px var(--racc,var(--gold2));opacity:.85}
${P} #hud #h-reg#h-reg{font:700 16px/1.2 var(--f-head)!important;color:var(--gold2)!important;letter-spacing:.05em!important;text-shadow:0 1px 2px #000,0 0 12px rgba(255,170,60,.25)!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${P} #hud #h-sub{font:12px/1.3 var(--f-body);color:var(--dim);margin-top:1px}
${P} #hud #h-pips .fpips{gap:3px!important;margin:6px 0 3px!important}
${P} #hud #h-pips .fpips i{width:15px!important;height:4px!important;border:none!important;border-radius:2px!important;background:rgba(255,255,255,.1)!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.4)!important;box-sizing:border-box}
${P} #hud #h-pips .fpips i.d{background:linear-gradient(90deg,#a87a2e,var(--gold))!important}
${P} #hud #h-pips .fpips i.c{background:var(--gold2)!important;box-shadow:0 0 6px var(--gold2)!important}
${P} #hud #h-pips .fpips i.b{width:22px!important;background:rgba(255,110,90,.22)!important}
${P} #hud #h-pips .fpips i.b.d,${P} #hud #h-pips .fpips i.b.c{background:linear-gradient(90deg,#b8402f,#ff8a6a)!important}
${P} #hud #h-pips .dngr{font-size:11px;color:var(--dim);letter-spacing:.02em}
${P} #hud #h-obj{font:600 12.5px/1.35 var(--f-body);margin-top:6px;padding-top:5px;border-top:1px solid var(--line)}
${P} #hud #h-obj:empty,${P} #hud #h-mod:empty{display:none}
${P} #hud #h-obj .pbar{height:4px!important;border:none!important;outline:none!important;border-radius:2px!important;background:rgba(0,0,0,.55)!important;margin-top:4px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)}
${P} #hud #h-obj .pbar div{background:linear-gradient(90deg,#c9762a,var(--accent))!important;border-radius:2px!important}
${P} #hud #h-mod{font-size:11.5px;margin-top:4px}
${P} #hud #h-tl .hline{font:12px/1.35 var(--f-body);margin-top:4px}
${P} #hud #h-tl #h-goal{border-top:1px solid var(--line);padding-top:4px;color:var(--text)}
${P} #hud #h-tl .nstep{color:var(--info);font:700 9.5px var(--f-num);letter-spacing:.1em}
${P} #hud #h-tl #h-exp{font-size:11.5px!important;color:var(--info)!important}
/* currency row */
${P} #hud #h-res#h-res{border-radius:999px!important;padding:4px 12px!important;gap:9px!important;font:600 12.5px/1.4 var(--f-num);font-variant-numeric:tabular-nums;color:var(--text)}
${P} #hud #h-res b{color:var(--gold2);font-weight:700}
/* buffs */
${P} #hud #h-buffs,${P} #hud #h-wart{gap:5px}
${P} #hud #h-buffs .buff{width:30px!important;height:30px!important;box-sizing:border-box;border-width:1.5px!important;border-style:solid!important;border-image:none!important;border-radius:7px!important;font-size:16px!important;background:radial-gradient(circle at 50% 30%,#2e2538,#0e0b14 80%)!important;box-shadow:0 2px 6px rgba(0,0,0,.6),inset 0 0 6px rgba(0,0,0,.6)!important}
${P} #hud #h-buffs .buff span{right:1px!important;bottom:0!important;font:700 9px/1.1 var(--f-num)!important;color:#fff!important;text-shadow:0 0 2px #000,0 0 2px #000!important}
/* bounty and guide panels under the minimap */
${P} #hud #h-q#h-q{padding:7px 10px!important;font:12px/1.35 var(--f-body)}
${P} #hud #h-q .qh{font:700 12px var(--f-head);color:var(--gold2);letter-spacing:.04em}
${P} #hud #h-q .qi{font-size:11.5px;color:var(--text)}${P} #hud #h-q .qi span{color:var(--dim);font-variant-numeric:tabular-nums}${P} #hud #h-q .qi.qd{color:var(--good)}
${P} #hud #h-guide .gh{font:700 12px var(--f-head)!important;color:var(--info)!important;letter-spacing:.04em}

/* ---------- bottom bar ---------- */
${P} #hud #h-bottom{bottom:8px;gap:10px;align-items:flex-end}
${P} #hud #h-bottom .hcenter{align-items:stretch;gap:5px;margin-bottom:5px}
/* globes: wrapper ring + gem, glass orb inside */
${P} #hud .g3w{position:relative;width:112px;height:112px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.85),0 8px 18px rgba(0,0,0,.6)}
${P} #hud .g3w::before{content:'';position:absolute;inset:0;border-radius:50%;pointer-events:none;
  background:conic-gradient(from 215deg,#5e431a,#f4d892 10%,#8a6526 22%,#3a2a10 34%,#c9a25a 46%,#f6dc98 56%,#7a5a24 70%,#2e200c 82%,#c9a25a 92%,#5e431a);
  -webkit-mask:radial-gradient(circle closest-side,transparent 47px,#000 48px);mask:radial-gradient(circle closest-side,transparent 47px,#000 48px)}
${P} #hud .g3w::after{content:'';position:absolute;inset:8px;border-radius:50%;pointer-events:none;z-index:3;box-shadow:0 0 0 1px rgba(0,0,0,.8),0 0 0 2px rgba(255,230,160,.3),inset 0 0 0 1px rgba(255,255,255,.06)}
${P} #hud .g3gem{position:absolute;left:50%;top:-3px;width:13px;height:13px;margin-left:-6.5px;transform:rotate(45deg);z-index:4;border:1.5px solid #e8c27a;box-shadow:0 0 0 1px #1a1206,0 2px 4px rgba(0,0,0,.7);pointer-events:none}
${P} #hud .g3w.hp .g3gem{background:radial-gradient(circle at 35% 35%,#ffb0a0,#c41e2a 55%,#5a0610)}
${P} #hud .g3w.mp .g3gem{background:radial-gradient(circle at 35% 35%,#c0d8ff,#2a5ad8 55%,#0a1a5c)}
${P} #hud .g3w .globe{width:96px!important;height:96px!important;box-sizing:border-box;border:none!important;outline:none!important;border-radius:50%!important;
  background:radial-gradient(circle at 50% 40%,#1a1220,#07050a 75%)!important;box-shadow:inset 0 0 22px rgba(0,0,0,.95),inset 0 -6px 14px rgba(0,0,0,.6)!important;animation:none!important;overflow:hidden}
${P} #hud .g3w .globe.hp .liq{background:radial-gradient(120% 95% at 50% 12%,#ff7a62 0%,#d0202c 42%,#7a0816 78%,#4a030c 100%)!important;box-shadow:inset 0 2px 0 rgba(255,190,170,.35);border-radius:0!important}
${P} #hud .g3w .globe.mp .liq{background:radial-gradient(120% 95% at 50% 12%,#8cbcff 0%,#2f62e0 42%,#10288a 78%,#081452 100%)!important;box-shadow:inset 0 2px 0 rgba(190,215,255,.35);border-radius:0!important}
${P} #hud .g3w .globe .liq::before{display:block!important;content:''!important;position:absolute;left:-50%;top:-5px;width:200%;height:10px;opacity:.45;
  background:radial-gradient(ellipse at 25% 100%,rgba(255,255,255,.35) 0 30%,transparent 31%) 0 0/50% 100% repeat-x!important;animation:fxWave 3s linear infinite!important}
${P} #hud .g3w .globe .shine{display:block!important;left:18%!important;top:8%!important;width:44%!important;height:26%!important;border-radius:50%!important;z-index:1;background:radial-gradient(rgba(255,255,255,.28),rgba(255,255,255,0) 70%)!important}
${P} #hud .g3w .globe::after{content:'';position:absolute;inset:0;border-radius:50%;z-index:1;pointer-events:none;background:radial-gradient(70% 40% at 50% 100%,rgba(255,255,255,.12),transparent 70%)}
${P} #hud .g3w .globe .gt{z-index:2;font:700 16px/1.05 var(--f-num)!important;color:#fff;letter-spacing:.02em!important;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px #000,0 0 6px rgba(0,0,0,.9)!important}
${P} #hud .g3w .globe .gt small{font-size:10px;font-weight:600;opacity:.75;display:block;margin-top:1px}
${P} #hud .g3w .globe.low{animation:hud3_low 1s ease-in-out infinite!important}
@keyframes hud3_low{0%,100%{box-shadow:inset 0 0 22px rgba(0,0,0,.95),inset 0 -6px 14px rgba(0,0,0,.6)}40%{box-shadow:inset 0 0 26px rgba(255,40,40,.85),inset 0 -6px 14px rgba(0,0,0,.6)}}
/* skill bar */
${P} #hud #h-slots#h-slots{padding:6px!important;gap:5px!important;align-items:flex-end;justify-content:center;border-radius:var(--r-lg)!important}
${P} #hud #h-slots .slot{box-sizing:border-box!important;width:52px!important;height:52px!important;border:1px solid #3d3122!important;border-image:none!important;border-radius:8px!important;outline:none!important;overflow:hidden;animation:none!important;filter:none!important;
  background:radial-gradient(circle at 50% 30%,#2c2436,#0f0b15 78%)!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.7),inset 0 3px 8px rgba(0,0,0,.7)!important;transition:border-color .15s}
${P} #hud #h-slots .slot.ready{border-color:#a8824a!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.7),inset 0 0 10px rgba(255,200,110,.12),0 0 0 1px rgba(232,194,122,.12)!important}
${P} #hud #h-slots .slot:hover{border-color:var(--gold2)!important}
${P} #hud #h-slots .slot.emp{opacity:.45}
${P} #hud #h-slots :is(#slv,#slp,#slw){width:52px!important;height:52px!important}
${P} #hud #h-slots #slv{margin-left:8px;border-radius:50%!important}
${P} #hud #h-slots :is(#slv,#slp,#slw) .ic{font-size:27px!important}
${P} #hud #h-slots :is(#slv,#slp,#slw) .ic{font-size:21px!important}
${P} #hud #h-slots .slot .ic2{font-size:13px!important;opacity:.7;z-index:1}
${P} #hud #h-slots .slot .cd{z-index:1}
${P} #hud #h-slots .slot .cdt{z-index:2;font:800 17px var(--f-num)!important;color:#fff;text-shadow:0 0 3px #000,0 1px 2px #000!important}
${P} #hud #h-slots #slv .cdt{font-size:11px!important}
${P} #hud #h-slots #slp .cdt{inset:auto 2px 2px auto!important;font:700 9.5px/12px var(--f-num)!important;background:rgba(8,6,12,.85);border-radius:4px;padding:0 3px}
${P} #hud #h-slots .slot .key{z-index:3;left:2px!important;top:2px!important;font:700 9.5px/13px var(--f-num)!important;color:var(--gold2)!important;background:rgba(8,6,12,.85)!important;border:1px solid rgba(214,168,82,.35);border-radius:4px!important;padding:0 3px!important;text-shadow:none!important}
${P} #hud #h-slots #slv .key{left:50%!important;top:auto!important;bottom:1px;transform:translateX(-50%)}
${P} #hud #h-slots .slot .mpc{z-index:3;right:2px!important;bottom:2px!important;font:700 9.5px/12px var(--f-num)!important;color:var(--info)!important;background:rgba(6,12,30,.85)!important;border-radius:4px!important;padding:0 3px!important;text-shadow:none!important}
${P} #hud #h-slots .slot .mpc:empty{display:none}
${P} #hud #h-slots .slot.hud3cd .ic{filter:saturate(.35) brightness(.7)}
${P} #hud #h-slots .slot.nomp:not(#slp) .ic{filter:saturate(.5) brightness(.75)}
${P} #hud #h-slots .slot.nomp:not(#slp)::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(40,70,210,.12),rgba(30,60,200,.45))}
${P} #hud #h-slots .slot.nomp .mpc{color:var(--bad)!important;background:rgba(40,6,8,.9)!important}
${P} #hud #h-slots #slp.nomp .ic{filter:grayscale(.9) brightness(.6)}
${P} #hud #h-slots .slot.flash{animation:hud3_flash .55s ease-out!important}
@keyframes hud3_flash{0%{box-shadow:0 0 0 0 rgba(255,217,138,.95),inset 0 0 18px rgba(255,217,138,.75)}100%{box-shadow:0 0 0 10px rgba(255,217,138,0),inset 0 0 10px rgba(255,200,110,.12)}}
${P} #hud #h-slots #slv.full{border-color:#ffb04a!important;box-shadow:0 0 14px rgba(255,138,42,.75),inset 0 0 10px rgba(255,138,42,.55)!important;animation:fxPulse 1s infinite!important}
/* XP bar */
${P} #hud #h-xp#h-xp{width:auto;min-width:0!important;height:13px!important;margin-top:0!important;box-sizing:border-box;border:1px solid transparent!important;outline:none!important;border-radius:7px!important;overflow:hidden;animation:none;
  background:linear-gradient(180deg,#0a070e,#17111e) padding-box,var(--h3-trim-dim) border-box!important;box-shadow:0 3px 8px rgba(0,0,0,.55),inset 0 1px 3px rgba(0,0,0,.8)!important}
${P} #hud #h-xp .lvb{width:40px!important;font:700 9px/11px var(--f-head)!important;letter-spacing:.06em;color:var(--gold2)!important;background:linear-gradient(180deg,#5a3e14,#24180a)!important;border:none!important;border-right:1px solid rgba(214,168,82,.5)!important;border-radius:0!important;text-shadow:0 1px 1px #000!important}
${P} #hud #h-xp .trk{left:40px!important;border-radius:0!important}
${P} #hud #h-xp .fill{background:linear-gradient(180deg,#ffe9a8 0%,#f0b445 50%,#b5721a 100%)!important;box-shadow:0 0 8px rgba(255,180,60,.5)!important;transition:width .35s ease-out!important;border-radius:0!important}
${P} #hud #h-xp .ticks{background:repeating-linear-gradient(90deg,transparent 0,transparent calc(10% - 1px),rgba(0,0,0,.4) calc(10% - 1px),rgba(0,0,0,.4) 10%)!important}
${P} #hud #h-xp .xpt{font:600 9.5px/11px var(--f-num)!important;color:rgba(255,246,224,.85)!important;letter-spacing:.02em!important;text-shadow:0 0 2px #000,0 1px 1px #000!important}
${P} #hud #h-xp.lvup{animation:hud3_lv 1.2s ease-out!important}
@keyframes hud3_lv{0%{box-shadow:0 0 24px 6px rgba(255,210,122,.9)}100%{box-shadow:0 3px 8px rgba(0,0,0,.55)}}

/* ---------- left side menu buttons ---------- */
${P} #hud #h-menu{left:12px;bottom:12px;gap:6px;grid-template-columns:40px;transform:scale(var(--ui,1));transform-origin:bottom left}
${P} #hud #h-menu .mb{box-sizing:border-box;width:40px!important;height:40px!important;border:1px solid transparent!important;border-image:none!important;border-radius:var(--r-md)!important;font-size:17px!important;color:var(--text);
  background:var(--h3-fill) padding-box,var(--h3-trim-dim) border-box!important;box-shadow:0 3px 10px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,232,176,.08)!important;transition:transform .12s,filter .12s}
${P} #hud #h-menu .mb:hover{transform:translateY(-1px)!important;filter:brightness(1.18);background:var(--h3-fill) padding-box,var(--h3-trim) border-box!important;box-shadow:0 0 12px rgba(255,180,70,.4),0 3px 10px rgba(0,0,0,.5)!important}
${P} #hud #h-menu .mb span{left:3px!important;bottom:2px!important;font:700 8px/8px var(--f-num)!important;color:var(--dim)!important}
${P} #hud #h-menu .mb i{right:-4px;top:-4px;font:700 9px/13px var(--f-num)!important;padding:0 4px!important;border-radius:7px!important;border:1px solid #0b0910!important;background:var(--good)!important;color:#0b0910!important}
${P} #hud #h-menu .mb i.l{right:auto;left:-4px;background:var(--gold2)!important}

/* ---------- boss bar ---------- */
${P} #hud #h-boss{top:12px;width:min(520px,46vw);transform:translateX(-50%) scale(var(--ui,1));transform-origin:top center}
${P} #hud #h-boss .bn{display:flex;align-items:center;justify-content:center;height:24px;white-space:nowrap;font:700 17px/24px var(--f-head)!important;color:var(--gold2)!important;letter-spacing:.06em;text-shadow:0 0 14px rgba(255,80,40,.55),0 2px 2px #000!important}
${P} #hud #h-boss .bn::before,${P} #hud #h-boss .bn::after{content:''!important;flex:0 0 64px;height:1px;margin:0 10px;background:linear-gradient(90deg,transparent,var(--line2))}
${P} #hud #h-boss .bn::after{background:linear-gradient(270deg,transparent,var(--line2))}
${P} #hud #h-boss .bn span{margin-left:.35em;font-size:13px;letter-spacing:.08em}
${P} #hud #h-boss .bbar{margin-top:4px;height:18px!important;box-sizing:border-box;border:1px solid transparent!important;outline:none!important;border-radius:4px!important;overflow:hidden;
  background:linear-gradient(180deg,#1a0709,#0b0305) padding-box,var(--h3-trim) border-box!important;box-shadow:0 0 18px rgba(255,60,30,.3),0 4px 12px rgba(0,0,0,.6)!important}
${P} #hud #h-boss .bfill{background:linear-gradient(180deg,#ff7a62 0%,#d42a2a 45%,#7a0c14 100%)!important;box-shadow:inset 0 1px 0 rgba(255,220,200,.35);border-radius:0!important}
${P} #hud #h-boss .btrail{background:#ffe2a0!important;opacity:.5;border-radius:0!important}
${P} #hud #h-boss .bmark{z-index:2;width:2px!important;margin-left:-1px;background:rgba(255,236,190,.8)!important;box-shadow:0 0 3px rgba(0,0,0,.9)}
${P} #hud #h-boss .bt{position:absolute;left:0;right:0;top:28px;height:18px;margin:0!important;z-index:3;font:700 11px/18px var(--f-num)!important;color:#fff!important;letter-spacing:.04em!important;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px #000,0 0 4px #000!important;pointer-events:none}

/* ---------- target frame ---------- */
${P} #hud #h-target#h-target{top:12px;width:280px;padding:6px 10px!important;transform:translateX(-50%) scale(var(--ui,1));transform-origin:top center}
${P} #hud #h-target .tn{font:700 13px/1.3 var(--f-head)!important;color:var(--text)!important;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${P} #hud #h-target .tbar{height:9px!important;margin:4px 0 3px!important;border:1px solid rgba(0,0,0,.85)!important;outline:none!important;border-radius:3px!important;background:#1a0709!important;box-shadow:0 0 0 1px rgba(214,168,82,.3)!important;overflow:hidden}
${P} #hud #h-target .tbar div{background:linear-gradient(180deg,#ff7a62,#c42228 55%,#7a0c14)!important;border-radius:0!important}
${P} #hud #h-target .ti{font:11.5px/1.3 var(--f-num);color:var(--text);font-variant-numeric:tabular-nums}

/* ---------- combo, banner, hint ---------- */
${P} #hud #h-combo{transform:rotate(-3deg) scale(var(--ui,1));transform-origin:top right}
${P} #hud #h-combo .cn{font:700 40px/1 var(--f-head)!important;text-shadow:0 0 16px rgba(255,150,50,.6),0 3px 3px #000!important}
${P} #hud #h-combo .cl{font:700 10px var(--f-head)!important;letter-spacing:.3em!important;color:var(--gold)}
${P} #hud #h-combo .cb{font:600 11.5px var(--f-body);color:var(--gold2)}
${P} #hud #h-combo .cbar{height:3px!important;border-radius:2px!important;background:rgba(255,255,255,.12)!important;border:none!important;outline:none!important}
${P} #hud #h-combo .cbar div{background:var(--gold2)!important;border-radius:2px!important}
${P} #hud #h-banner .a{font:700 40px/1.15 var(--f-head)!important;letter-spacing:.08em;text-shadow:0 0 24px rgba(255,160,60,.45),0 2px 4px #000,0 0 2px #000!important}
${P} #hud #h-banner .b{display:inline-block;margin-top:4px;padding:2px 74px;font:italic 18px var(--f-body)!important;color:var(--text);text-shadow:0 2px 3px #000!important;
  background:linear-gradient(90deg,transparent,var(--line2)) left center/62px 1px no-repeat,linear-gradient(270deg,transparent,var(--line2)) right center/62px 1px no-repeat}
${P} #hud #h-banner .b:empty{display:none}
${P} #hud #hintbox#hintbox{border:1px solid transparent!important;border-image:none!important;border-radius:var(--r-md)!important;font:14px/1.4 var(--f-body);color:#dbe9ff;
  background:linear-gradient(180deg,rgba(16,24,40,.95),rgba(10,14,26,.95)) padding-box,linear-gradient(180deg,#8ac4ff,#2a4a7a) border-box!important;box-shadow:var(--h3-drop)!important}

/* ---------- toasts and level card ---------- */
${P} #toast#toast div{border:1px solid transparent!important;border-image:none!important;border-radius:var(--r-md)!important;padding:6px 16px!important;font:600 14px/1.35 var(--f-body)!important;
  background:var(--h3-fill) padding-box,var(--h3-trim-dim) border-box!important;box-shadow:0 6px 18px rgba(0,0,0,.55)!important}
${P} #lvcard#lvcard .lt{font-family:var(--f-head)!important;letter-spacing:.12em}
${P} #lvcard#lvcard .ls,${P} #lvcard#lvcard .lm{font-family:var(--f-body)}

/* ---------- party frames and ping ---------- */
${P} #partyf#partyf{left:12px;width:190px;font:12px/1.3 var(--f-body);color:var(--text);transform:translateY(-50%) scale(var(--ui,1));transform-origin:left center}
${P} #partyf#partyf .pfh{font:700 11px var(--f-head);color:var(--gold2);letter-spacing:.04em;margin-bottom:5px}
${P} #partyf#partyf .pfr{border:1px solid transparent;border-radius:var(--r-sm);padding:5px 8px;margin-bottom:4px;background:var(--h3-fill) padding-box,linear-gradient(180deg,rgba(138,196,255,.5),rgba(60,90,140,.4)) border-box;box-shadow:0 3px 10px rgba(0,0,0,.45)}
${P} #partyf#partyf .pfr.me{background:var(--h3-fill) padding-box,var(--h3-trim-dim) border-box}
${P} #partyf#partyf .pfr.dn{background:var(--h3-fill) padding-box,linear-gradient(180deg,#ff7a6a,#7a1a12) border-box}
${P} #partyf#partyf .pfn b{font-weight:700}${P} #partyf#partyf .pfn span{color:var(--dim)}
${P} #partyf#partyf .pfn i{font:700 10px var(--f-num);color:var(--good)}${P} #partyf#partyf .pfn i.mid{color:var(--gold2)}${P} #partyf#partyf .pfn i.bad{color:var(--bad)}
${P} #partyf#partyf .pfb{height:6px;border-radius:3px;background:rgba(0,0,0,.6);box-shadow:inset 0 0 0 1px rgba(0,0,0,.6)}
${P} #partyf#partyf .pfb div{background:linear-gradient(180deg,#9af09a,#2f9a3f);border-radius:3px}
${P} #partyf#partyf .pfw{font-size:9.5px;color:var(--dim);letter-spacing:.08em}
${P} #partyf#partyf .pfbonus{color:var(--good);font-size:11px}${P} #partyf#partyf .pfk{color:var(--dim);font-size:10px}
${P} #myping#myping{font:600 11px var(--f-num)!important;font-style:normal!important;color:rgba(236,226,204,.55)!important;letter-spacing:.04em!important}
`)(hud3_P);
{ const st = document.createElement('style'); st.id = 'hud3-style'; st.textContent = hud3_css; document.head.appendChild(st); }

// Put each globe inside a framed wrapper (ornate ring + crest gem). The globe element itself, its
// children, its classes and its tooltip handlers are untouched, so all the code that updates it still works.
function hud3_wrapGlobes() {
  for (const k of ['hp', 'mp']) {
    const g = document.querySelector('#h-bottom .globe.' + k); if (!g || (g.parentNode && g.parentNode.classList.contains('g3w'))) continue;
    const w = document.createElement('div'); w.className = 'g3w ' + k; g.parentNode.insertBefore(w, g); w.appendChild(g);
    const gem = document.createElement('i'); gem.className = 'g3gem'; w.appendChild(gem);
  }
}
{ const _ihH3 = initHUD; initHUD = function () { _ihH3(); hud3_wrapGlobes(); }; }
// Mark skill slots that are cooling down so their icon dims under the radial sweep.
const hud3_cd = [false, false, false, false];
{ const _uhH3 = updateHUD; updateHUD = function (dt) { _uhH3(dt);
  if (!S || !P || !H.slots || G.mode === 'title') return;
  for (let i = 0; i < 4; i++) { const id = S.bind[i], on = !!(id && (P.cds[id] || 0) > 0); if (on !== hud3_cd[i]) { hud3_cd[i] = on; const el = H.slots[i]; if (el) el.classList.toggle('hud3cd', on); } }
}; }
