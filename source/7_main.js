// ================= MAIN LOOP =================
let lastT = performance.now(), errShown = false;
function frame(now) {
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  try { update(dt); render3D(dt); drawOverlay(); updateHUD(dt); }
  catch (err) { console.error(err); if (!errShown) { errShown = true; toast('⚠ ' + err.message, '#ff6a6a'); } }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play' && !G.menu && S) openMenu('pause'); });
addEventListener('beforeunload', () => { if (S && !S._temp && G.mode !== 'title') saveGame(); });
resize();
try { init3D(); } catch (e) { document.body.innerHTML = '<div style="color:#fff;font:18px sans-serif;padding:40px">Embervale needs WebGL to run. Please open this file in a modern browser such as Chrome, Edge, Firefox or Safari.<br><br>' + e.message + '</div>'; throw e; }
initHUD();
G.mode = 'title'; titleScene(); openMenu('title'); requestAnimationFrame(frame);
