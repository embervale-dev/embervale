// ================= UI v3: shared design tokens (used by the menu, HUD and map layers) =================
// Every UI v3 file reads these variables, so the whole interface stays one consistent look.
{ const st = document.createElement('style'); st.id = 'ui3-tokens'; st.textContent = `:root{
  --f-head:'Cinzel','Trajan Pro','Georgia',serif; --f-body:'Alegreya Sans','Trebuchet MS','Segoe UI',sans-serif; --f-num:'Alegreya Sans','Trebuchet MS',sans-serif;
  --bg0:#0b0910; --panel:#15111b; --panel2:#1d1726; --panel3:#271f32; --line:rgba(214,168,82,.28); --line2:rgba(214,168,82,.55);
  --text:#ece2cc; --dim:#aaa08e; --gold:#e8c27a; --gold2:#ffd98a; --accent:#ff9a3a; --good:#7ee07e; --bad:#ff7a6a; --info:#8ac4ff;
  --r-sm:4px; --r-md:6px; --r-lg:8px; --shadow:0 10px 40px rgba(0,0,0,.6);
  --ui3pad:24px;
}`; document.head.appendChild(st); }

// ================= UI v3: the menu shell (one fixed frame for every menu, game-style components) =================
// Size and title-bar logic live in 6_ui.js (ui3_kind, ui3_size, ui3_head). Classes on #panel:
//   .ui3f = fixed window for tabbed menus, .ui3m = medium popup sized to its content, .ui3s = small dialog; neither = unframed (title screen, class pick, NPC dialogue).
// Selector prefixes: "html body#px" applies to both styles, "html body#px.smooth" only to Smooth (Pixel keeps its pixel-art frames).
{
  const svg = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  const corner = r => svg(`<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><g transform='rotate(${r} 15 15)'><path d='M1.5 29V9.5l8-8H29' fill='none' stroke='#e8c27a' stroke-width='1.4'/><path d='M5.5 29V11.2l5.7-5.7H29' fill='none' stroke='#e8c27a' stroke-opacity='.35'/><rect x='2.3' y='2.3' width='3.4' height='3.4' fill='#ffd98a' transform='rotate(45 4 4)'/></g></svg>`);
  const noise = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 .9 0 0 0 0 .75 .07 0 0 0 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);
  const C = { tl: corner(0), tr: corner(90), br: corner(180), bl: corner(270) };
  const P = 'html body#px', M = 'html body#px.smooth', F = ':is(.ui3f,.ui3s,.ui3m)';
  const st = document.createElement('style'); st.id = 'ui3-menus'; st.textContent = `
/* ---------- fonts and numbers (both styles) ---------- */
${P} :is(#ov,#tip,#toast){font-family:var(--f-body);font-variant-numeric:tabular-nums lining-nums}
${P} #panel{font-size:15px;line-height:1.45;color:var(--text)}
${P} #panel :is(h1,h2,h3,.tabs.grp .tab,.fitt,.hubsec,.hubt b,.btn.bigb),${P} .dname,${P} #tip .tn{font-family:var(--f-head)!important;font-weight:600}
${P} :is(#ov,#tip) [style*="font-family:Georgia"]{font-family:var(--f-head)!important}
${P} #panel :is(.dim,.hint){font-size:14px}${P} #panel .card{font-size:15px}${P} #panel :is(p,.lore){font-size:16px}
${P} #panel .lore{margin-left:auto;margin-right:auto}

/* ---------- the fixed frame (both styles) ---------- */
${P} #panel${F}{width:var(--ui3w,min(1180px,94vw))!important;height:var(--ui3h,min(780px,90vh))!important;min-width:0!important;max-width:none!important;max-height:none!important;
  box-sizing:border-box!important;padding:0 var(--ui3pad) 22px!important;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-gutter:stable;
  scrollbar-width:thin;scrollbar-color:#6a5030 transparent;position:relative}
${P} #panel.ui3m{height:auto!important;max-height:var(--ui3h,86vh)!important;padding-bottom:24px!important}
${P} #panel.ui3s{height:auto!important;max-height:var(--ui3h,86vh)!important;padding-bottom:24px!important;text-align:center}
${P} #panel.ui3s .title{min-width:0}
${P} #panel${F}>:first-child:not(.ui3-head){margin-top:22px}
/* header: tab bar or title bar, sticks to the top while the body scrolls */
${P} #panel .ui3-head{position:sticky;top:0;z-index:8;margin:0 calc(-1 * var(--ui3pad)) 14px;padding:0 var(--ui3pad)}
${P} #panel .ui3-tb{display:flex;align-items:center;justify-content:center;gap:14px;min-height:58px;padding:10px 64px 8px;box-sizing:border-box}
${P} #panel .ui3-tb.ui3-noh{min-height:50px}
${P} #panel .ui3-tb>h2{margin:0!important;padding:0!important;border:none!important;font-size:24px!important;letter-spacing:2px!important;text-align:center;flex:0 1 auto}
${P} #panel .ui3-tb>.pclose{position:absolute!important;right:16px;top:50%!important;transform:translateY(-50%);float:none!important;margin:0!important}
${P} #panel>.pclose{position:sticky!important;top:12px!important;float:right;margin:12px -8px 0 8px!important;z-index:9}
${P} #panel .pclose{width:32px!important;height:32px!important;line-height:30px!important;box-sizing:border-box;text-align:center;font-size:15px!important;cursor:pointer;padding:0!important}
${P} #panel .ui3-tabhead{padding-top:12px}
${P} #panel .ui3-tabhead .tabs{margin:0!important;padding:0!important;border:none!important;display:flex;align-items:flex-end;flex-wrap:wrap}
${P} #panel .ui3-tabhead .tabs.grp{gap:2px}
${P} #panel .ui3-tabhead .tabs.grp .tab{font-size:15px!important;letter-spacing:1px;padding:9px 18px 10px!important;position:relative;white-space:nowrap}
${P} #panel .ui3-tabhead .tabs.sub{gap:6px;padding:10px 0 12px!important;align-items:center}
${P} #panel .ui3-tabhead .tabs.sub .tab{font-size:14.5px!important;padding:5px 14px!important;white-space:nowrap}
${P} #panel .ui3-sp{flex:1}
${P} #panel .ui3-tabhead .tabs.grp .tab.ui3-x{align-self:center;width:34px;height:34px;padding:0!important;display:flex;align-items:center;justify-content:center;margin-bottom:4px;font-family:var(--f-body)!important;font-size:16px!important}
${P} #panel .ui3-key{font:600 12px var(--f-body);margin-left:6px;padding:0 5px;border:1px solid currentColor;border-radius:3px;opacity:.55}
${P} #panel.tabbed .ui3-tabhead+h2,${P} #panel.tabbed .ui3-tabhead~h2:first-of-type{font-size:24px!important;letter-spacing:1.5px!important;margin:2px 0 10px!important}
/* pixel style keeps its frames; only give its header a solid backing */
html body#px:not(.smooth) #panel .ui3-head{background:var(--bg,#1c1722)!important;border-bottom:2px solid #3b3144!important}
html body#px:not(.smooth) #panel .ui3-tabhead .tabs.grp{border-bottom:2px solid #3b3144!important;margin:0 calc(-1 * var(--ui3pad))!important;padding:0 var(--ui3pad)!important}

/* ---------- open / close animation (under 150ms) ---------- */
@keyframes ui3in{from{opacity:0}to{opacity:1}}
@keyframes ui3pop{from{opacity:0;transform:translateY(6px) scale(.975)}to{opacity:1;transform:none}}
@keyframes ui3out{to{opacity:0}}
${P} #ov.show{animation:ui3in .12s ease-out}
${P} #ov.show #panel${F}{animation:ui3pop .13s cubic-bezier(.2,.9,.3,1)!important}
${P} #ov.ui3-out{display:flex!important;pointer-events:none!important;animation:ui3out .1s ease-in forwards}
${P} #ov.ui3-out #panel{transform:scale(.985);transition:transform .1s ease-in}
@media (prefers-reduced-motion:reduce){${P} #ov.show,${P} #ov.show #panel${F},${P} #ov.ui3-out{animation:none!important}}

/* ================= SMOOTH style: dark ornate panel with thin gold trim ================= */
${M} #panel${F}{border:1px solid rgba(214,168,82,.6)!important;border-image:none!important;border-radius:4px!important;background-color:#120e17!important;
  background-image:${C.tl},${C.tr},${C.bl},${C.br},radial-gradient(ellipse 75% 45% at 50% 0%,rgba(232,194,122,.075),transparent 70%),${noise},linear-gradient(180deg,#1b1622 0%,#130f18 50%,#0e0b12 100%)!important;
  background-position:left 4px top 4px,right 4px top 4px,left 4px bottom 4px,right 4px bottom 4px,0 0,0 0,0 0!important;background-repeat:no-repeat,no-repeat,no-repeat,no-repeat,no-repeat,repeat,no-repeat!important;
  background-size:30px 30px,30px 30px,30px 30px,30px 30px,100% 100%,180px 180px,100% 100%!important;background-clip:padding-box!important;
  box-shadow:0 0 0 1px #050307,0 0 0 4px #18131d,0 0 0 5px rgba(214,168,82,.28),0 30px 90px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,228,170,.08),inset 0 0 90px rgba(0,0,0,.45)!important}
${M} #panel .ui3-head{background-color:#19141f!important;background-image:${C.tl},${C.tr},linear-gradient(180deg,#201927,#17121d)!important;background-position:left 4px top 4px,right 4px top 4px,0 0!important;background-repeat:no-repeat!important;background-size:30px 30px,30px 30px,100% 100%!important;
  border-bottom:1px solid rgba(214,168,82,.35)!important;box-shadow:0 10px 18px -10px rgba(0,0,0,.75),0 1px 0 rgba(0,0,0,.6)!important}
${M} #panel .ui3-tb>h2{color:var(--gold2)!important;text-shadow:0 0 18px rgba(255,190,90,.25),0 2px 2px #000!important}
${M} #panel .ui3-tb::before,${M} #panel .ui3-tb::after{content:'';flex:0 1 150px;height:1px;background:linear-gradient(90deg,transparent,rgba(214,168,82,.6))}
${M} #panel .ui3-tb::after{background:linear-gradient(90deg,rgba(214,168,82,.6),transparent)}
${M} #panel .ui3-tb.ui3-noh::before,${M} #panel .ui3-tb.ui3-noh::after{content:none}
${M} #panel h2{color:var(--gold2)!important;border-bottom:1px solid rgba(214,168,82,.22)!important;text-shadow:0 2px 2px #000!important}
${M} #panel h3{letter-spacing:1px;font-size:17px}
/* close buttons */
${M} #panel .pclose,${M} #panel .ui3-tabhead .tabs.grp .tab.ui3-x{border:1px solid rgba(214,168,82,.4)!important;border-radius:4px!important;background:linear-gradient(180deg,#2a2030,#1a1420)!important;color:#d8c8a8!important;box-shadow:inset 0 1px 0 rgba(255,235,190,.08)!important;transition:background .08s,color .08s,border-color .08s}
${M} #panel .pclose:hover,${M} #panel .ui3-tabhead .tabs.grp .tab.ui3-x:hover{background:linear-gradient(180deg,#7a2a22,#4e1812)!important;border-color:#ff8a6a!important;color:#fff!important}
${M} #panel .tab.ui3-x:active{transform:translateY(1px)}
/* tabs: engraved top tabs, pill sub-tabs */
${M} #panel .ui3-tabhead .tabs.grp .tab{color:var(--dim)!important;border:1px solid transparent!important;border-bottom:none!important;border-radius:4px 4px 0 0!important;background:none!important;text-shadow:0 1px 1px #000!important;transition:color .08s,background .08s}
${M} #panel .ui3-tabhead .tabs.grp .tab:not(.ui3-x):hover{color:var(--text)!important;background:linear-gradient(180deg,rgba(232,194,122,.07),transparent)!important}
${M} #panel .ui3-tabhead .tabs.grp .tab.on:not(.ui3-x){color:var(--gold2)!important;border-color:rgba(214,168,82,.35)!important;background:linear-gradient(180deg,rgba(232,194,122,.16),rgba(232,194,122,.03))!important;text-shadow:0 0 12px rgba(255,200,100,.45),0 1px 1px #000!important}
${M} #panel .ui3-tabhead .tabs.grp .tab.on:not(.ui3-x)::after{content:'';position:absolute;left:50%;bottom:-4px;width:7px;height:7px;margin-left:-4px;transform:rotate(45deg);background:var(--gold2);border:1px solid #18131d;box-shadow:0 0 8px rgba(255,200,100,.6)}
${M} #panel .ui3-tabhead .tabs.grp{border-bottom:1px solid rgba(214,168,82,.22)!important;margin:0 calc(-1 * var(--ui3pad))!important;padding:0 var(--ui3pad)!important}
${M} #panel .tabs.sub .tab{border:1px solid rgba(255,255,255,.08)!important;border-radius:999px!important;background:rgba(0,0,0,.28)!important;color:var(--dim)!important;transition:color .08s,border-color .08s,background .08s}
${M} #panel .tabs.sub .tab:hover{color:var(--text)!important;border-color:rgba(214,168,82,.45)!important}
${M} #panel .tabs.sub .tab.on{color:#1d1206!important;background:linear-gradient(180deg,#f3cf7f,#cf9a46)!important;border-color:#ffe2a0!important;text-shadow:none!important;box-shadow:0 0 10px rgba(255,190,90,.3)!important}
/* section tabs inside a menu (settings tabs, long sections): segmented control */
${M} #panel .fitbar{border-radius:6px!important;border:1px solid rgba(255,255,255,.07)!important;background:rgba(0,0,0,.3)!important;padding:4px!important;gap:4px!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.5)!important}
${M} #panel .fitt{font-size:14px!important;letter-spacing:.6px;border-radius:4px!important;border:1px solid transparent!important;color:var(--dim)!important;padding:6px 14px!important;transition:color .08s,background .08s}
${M} #panel .fitt:hover{color:var(--text)!important;background:rgba(232,194,122,.07)!important}
${M} #panel .fitt.on{color:#1d1206!important;background:linear-gradient(180deg,#f3cf7f,#cf9a46)!important;border-color:#ffe2a0!important;text-shadow:none!important;box-shadow:none!important}
/* buttons: bronze plates with hover, pressed, active and disabled states */
${M} #panel .btn{font-family:var(--f-body);font-weight:700;font-size:15px;letter-spacing:.3px;line-height:1.25;color:#f6e3b8!important;padding:7px 16px!important;border:1px solid #9a7438!important;border-radius:4px!important;
  background:linear-gradient(180deg,#5d4421 0%,#3b2a13 52%,#2c1f0d 100%)!important;box-shadow:inset 0 1px 0 rgba(255,228,170,.28),inset 0 -1px 0 rgba(0,0,0,.45),0 2px 4px rgba(0,0,0,.45)!important;text-shadow:0 1px 1px rgba(0,0,0,.85)!important;transition:filter .08s,border-color .08s,transform .05s!important}
${M} #panel .btn:hover{filter:brightness(1.2);border-color:var(--gold2)!important;transform:none!important;box-shadow:inset 0 1px 0 rgba(255,235,190,.35),0 0 12px rgba(255,190,90,.28),0 2px 4px rgba(0,0,0,.45)!important}
${M} #panel .btn:active{filter:brightness(.92);transform:translateY(1px)!important;padding:7px 16px!important;box-shadow:inset 0 2px 5px rgba(0,0,0,.6)!important}
${M} #panel .btn.on{color:#1d1206!important;background:linear-gradient(180deg,#f6d68a,#d4a04a 55%,#b27c2e)!important;border-color:#ffe6a8!important;text-shadow:none!important;box-shadow:inset 0 1px 0 rgba(255,250,220,.6),0 0 12px rgba(255,190,90,.35)!important}
${M} #panel .btn.dis{opacity:.4!important;filter:grayscale(.6)}
${M} #panel .btn.bigb{font-family:var(--f-head)!important;font-size:18px!important;letter-spacing:1.5px;padding:12px 30px!important;border-radius:5px!important}
/* cards, hub tiles */
${M} #panel .card{border-style:solid!important;border-width:1px!important;border-radius:6px!important;background:linear-gradient(180deg,rgba(255,240,210,.04),rgba(255,240,210,.012))!important;box-shadow:inset 0 1px 0 rgba(255,235,190,.04)!important;transition:border-color .1s,box-shadow .1s!important}
${M} #panel .card:not([style*="border-color"]){border-color:rgba(214,168,82,.2)!important}
${M} #panel .card:not([style*="border-color"]):hover{border-color:rgba(214,168,82,.45)!important}
${M} #panel .card.done{background:linear-gradient(180deg,rgba(232,194,122,.1),rgba(232,194,122,.02))!important}
${M} #panel .card.done:not([style*="border-color"]){border-color:rgba(232,194,122,.55)!important}
${M} #panel .card[onclick]{cursor:pointer}
${M} #panel .bcopt{border-radius:6px!important;border-color:rgba(214,168,82,.35)}${M} #panel .bcopt:hover{border-color:var(--gold2)}
${M} #panel .hubt{border:1px solid rgba(214,168,82,.22)!important;border-radius:6px!important;background:radial-gradient(circle at 50% 0%,rgba(255,200,110,.09),transparent 70%),linear-gradient(180deg,rgba(255,240,210,.04),rgba(0,0,0,.2))!important;transition:border-color .08s,transform .08s,box-shadow .08s!important}
${M} #panel .hubt:hover{border-color:var(--gold2)!important;transform:translateY(-2px)!important;box-shadow:0 6px 16px rgba(0,0,0,.5),0 0 14px rgba(255,190,90,.2)!important}
${M} #panel .hubt:active{transform:translateY(0)!important}
${P} #panel .hubt b{font-size:15px!important;letter-spacing:.5px}
${P} #panel .hubsec{font-size:13px!important;letter-spacing:2.5px!important}
${M} #panel .hubsec{color:var(--gold)!important}
/* inputs */
${P} #panel :is(input[type=text],input[type=search],input[type=number],input:not([type]),select,textarea){font:15px var(--f-body);color:var(--text)}
${M} #panel :is(input[type=text],input[type=search],input[type=number],input:not([type]),select,textarea){background:#0c0910!important;border:1px solid rgba(214,168,82,.35)!important;border-radius:4px!important;padding:6px 10px;outline:none}
${M} #panel :is(input,select,textarea):focus{border-color:var(--gold2)!important;box-shadow:0 0 0 2px rgba(232,194,122,.2)!important}
/* small dialogs */
${M} #panel.ui3s .ui3-tb>h2{font-size:22px!important}

/* ---------- tooltips, NPC dialogue (fonts for both; frames for Smooth). Toast visuals are owned by the HUD layer (7m_hud3.js). ---------- */
${P} #tip .tc{font-family:var(--f-body);font-size:14.5px;line-height:1.45}
${M} #tip .tc{border-radius:6px!important;background:linear-gradient(180deg,rgba(29,23,36,.99),rgba(13,10,17,.99))!important}
${P} .dlgbox{font-family:var(--f-body)}${P} .dlgbox .dname{letter-spacing:1px}

/* ---------- reusable components for menu bodies (scope under your own container to restyle) ---------- */
.ui3-sec{display:flex;align-items:center;gap:10px;margin:14px 0 8px;font:600 13px var(--f-head);letter-spacing:2.5px;text-transform:uppercase;color:var(--gold)}
.ui3-sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--line2),transparent)}
.ui3-well{background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.06);border-radius:var(--r-md);box-shadow:inset 0 1px 4px rgba(0,0,0,.5);padding:10px}
.ui3-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:999px;background:rgba(0,0,0,.35);border:1px solid var(--line);font:600 14px var(--f-num);font-variant-numeric:tabular-nums;color:var(--text)}
.ui3-stat{display:flex;flex-direction:column;align-items:center;padding:8px 6px;border-radius:var(--r-md);background:rgba(232,194,122,.06);border:1px solid var(--line)}
.ui3-stat b{font:700 18px var(--f-num);font-variant-numeric:tabular-nums;color:var(--gold2)}.ui3-stat span{font:600 12px var(--f-body);letter-spacing:1.2px;text-transform:uppercase;color:var(--dim)}
.ui3-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.06)}.ui3-row:hover{background:rgba(232,194,122,.05)}
.ui3-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}.ui3-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 12px}
.ui3-num{font-family:var(--f-num);font-variant-numeric:tabular-nums lining-nums}
`; document.head.appendChild(st); }
// Interface size changes the panel zoom after the menu re-renders, so refit the frame whenever it is applied.
{ const _au3 = applyUI; applyUI = function () { _au3.apply(this, arguments); try { if (G.menu) ui3_size(); } catch (e) { } }; }
