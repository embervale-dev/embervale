// ================= INTERFACE STYLE: smooth rounded (default) or pixel =================
// Global preference (not per save) so it also applies on the title screen.
let UI_STYLE = 'smooth';
try { if (localStorage.getItem('embervale_uistyle') === 'pixel') UI_STYLE = 'pixel'; } catch (e) { }
function applyUIStyle() { document.body.classList.toggle('smooth', UI_STYLE === 'smooth'); }
function setUIStyle(v) { UI_STYLE = v === 'smooth' ? 'smooth' : 'pixel'; try { localStorage.setItem('embervale_uistyle', UI_STYLE); } catch (e) { } applyUIStyle(); renderMenu(); }
applyUIStyle();
{ const _stU = MENUS.settings; MENUS.settings = () => _stU().replace('<div class="btn bigb" onclick="backMenu()">Back</div>',
  `<div class="card">${ico('palette')} Interface style ${[['smooth', 'Smooth rounded'], ['pixel', 'Pixel']].map(([v, n]) => `<span class="btn ${UI_STYLE === v ? 'on' : ''}" onclick="setUIStyle('${v}')">${n}</span>`).join('')}<div class="dim">Smooth: ornate gold-trimmed panels. Pixel: hard-edged retro frames. Both use the same fixed-size menu window.</div></div><div class="btn bigb" onclick="backMenu()">Back</div>`); }
