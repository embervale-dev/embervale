// ================= NO-SCROLL LAYOUT: every menu fits the screen (section tabs → pagination → gentle fit) =================
const FIT = { sec: {}, page: {} };
const FIT_DEF = { portal: 'last' };
const FIT_NOPAGE = ['map', 'inv', 'skills', 'paragon', 'craft', 'pause', 'stash', 'shop'];
const FIT_SKIP = ['dialog', 'title', 'class', 'confirm', 'dead', 'intro', 'boon', 'victory', 'report'];
function fitOver() { return panel.scrollHeight - panel.clientHeight > 2 || panel.scrollWidth - panel.clientWidth > 2; }
function isFooter(n) { if (!n || n.nodeType !== 1) return false; if (n.classList.contains('btn') || n.classList.contains('pclose')) return true; const els = n.querySelectorAll('*'); return els.length > 0 && els.length <= 8 && [...n.children].every(c => c.classList.contains('btn')); }
function fitSections(key) {
  // find the element that directly holds the most <h3> section headings
  let best = null, bn = 1; for (const el of [panel, ...panel.querySelectorAll('div')]) { const n = [...el.children].filter(c => c.tagName === 'H3').length; if (n > bn) { bn = n; best = el; } }
  if (!best) return false;
  const kids = [...best.childNodes], heads = kids.filter(c => c.tagName === 'H3');
  let foot = []; for (let i = kids.length - 1; i >= 0; i--) { const k = kids[i]; if (k.nodeType === 3 && !k.textContent.trim()) continue; if (isFooter(k)) foot.unshift(k); else break; }
  const secs = []; let cur = null;
  for (const k of kids) { if (foot.includes(k)) continue; if (k.tagName === 'H3') { cur = { h: k, nodes: [k] }; secs.push(cur); } else if (cur) cur.nodes.push(k); }
  if (secs.length < 2) return false;
  let si = FIT.sec[key] ?? (FIT_DEF[G.menu] === 'last' ? secs.length - 1 : 0); if (si >= secs.length) si = 0;
  secs.forEach((s, i) => s.nodes.forEach(n => { if (n.nodeType === 1) n.style.display = i === si ? '' : 'none'; else if (i !== si) n.textContent = ''; }));
  const bar = document.createElement('div'); bar.className = 'fitbar';
  bar.innerHTML = secs.map((s, i) => { const c0 = s.h.childNodes[0], ic = c0 && c0.nodeType === 1 && c0.classList.contains('gi') ? c0.outerHTML + ' ' : '', tn = ic ? s.h.childNodes[1] : c0; const t = ic + (tn && tn.textContent || s.h.textContent).trim().slice(0, 28); return `<span class="fitt ${i === si ? 'on' : ''}" onclick="FIT.sec['${key}']=${i};FIT.page={};renderMenu()">${t}</span>`; }).join('');
  best.insertBefore(bar, heads[0]);
  return true;
}
function fitPaginate(key) {
  // the visible container with the most similar children gets split into pages
  let best = null, score = 0;
  for (const el of [panel, ...panel.querySelectorAll('div')]) { if (el !== panel && el.offsetParent === null) continue; const ch = [...el.children].filter(c => c.offsetParent !== null || c.style.display === ''); if (ch.length < 6) continue; const cls = {}; for (const c of ch) { const k = c.tagName + '.' + (c.className || '').split(' ')[0]; cls[k] = (cls[k] || 0) + 1; } const top = Math.max(...Object.values(cls)); if (top < 6) continue; const sc = el.offsetHeight * (top / ch.length); if (sc > score) { score = sc; best = el; } }
  if (!best) return false;
  const k0 = Object.entries([...best.children].reduce((a, c) => { const k = c.tagName + '.' + (c.className || '').split(' ')[0]; a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1])[0][0];
  const items = [...best.children].filter(c => c.tagName + '.' + (c.className || '').split(' ')[0] === k0 && c.style.display !== 'none');
  if (items.length < 4) return false;
  const host = best === panel ? panel : best.parentNode; host.querySelectorAll(':scope > .fitpg').forEach(x => x.remove());
  const pg = document.createElement('div'); pg.className = 'fitpg'; if (best === panel) { const first = items[0]; panel.insertBefore(pg, first); } else best.parentNode.insertBefore(pg, best);
  const show = (a, b) => items.forEach((c, i) => c.style.display = i >= a && i < b ? '' : 'none');
  // largest page size that fits
  let lo = 1, hi = items.length; show(0, items.length); if (!fitOver()) { pg.remove(); return false; }
  pg.innerHTML = '<span class="btn">←</span><span class="pgn">Page 1 / 9</span><span class="btn">→</span>';
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); show(0, mid); if (fitOver()) hi = mid - 1; else lo = mid; }
  const per = Math.max(1, lo), pages = Math.ceil(items.length / per); let p = FIT.page[key] || 0; if (p >= pages) p = pages - 1;
  show(p * per, p * per + per); if (pages <= 1) { pg.remove(); return true; }
  pg.innerHTML = `<span class="btn ${p ? '' : 'dis'}" onclick="FIT.page['${key}']=${p - 1};renderMenu()">← Prev</span><span class="pgn">Page <b>${p + 1}</b> / ${pages} <span class="dim">(${items.length} entries)</span></span><span class="btn ${p < pages - 1 ? '' : 'dis'}" onclick="FIT.page['${key}']=${p + 1};renderMenu()">Next →</span>`;
  return true;
}
function fitMenu() {
  panel.classList.toggle('setp', G.menu === 'settings');
  if (!G.menu || FIT_SKIP.includes(G.menu)) { panel.style.zoom = ''; return; }
  panel.style.removeProperty('--fitz'); const inner = panel; inner.classList.remove('fitz');
  const key = G.menu + (G.menu === 'wiki' ? ':' + (WIKI_Q ? 'q' : WIKI_TAB) : '');
  if (!fitOver()) return;
  if (!['stash', 'shop', 'jewel', 'wander', 'craft'].includes(G.menu)) fitSections(key);
  if (!FIT_NOPAGE.includes(G.menu)) for (let pass = 0; pass < 2 && fitOver(); pass++) if (!fitPaginate(key + ':' + pass)) break;
  if (fitOver()) { // gentle final fit: shrink a little (never below 82%)
    const minZ = innerHeight < 760 ? .66 : innerHeight < 900 ? .74 : .82; const r = Math.max(minZ, Math.min(panel.clientHeight / panel.scrollHeight, panel.clientWidth / panel.scrollWidth) - .01); panel.classList.add('fitz'); let z = r; panel.style.setProperty('--fitz', z.toFixed(3)); for (let i = 0; i < 6 && fitOver() && z > minZ - .08; i++) { z -= .025; panel.style.setProperty('--fitz', z.toFixed(3)); } }
}
{ const _rmF = renderMenu; renderMenu = function () { _rmF(); try { fitMenu(); } catch (e) { console.warn('fit', e); } }; }
{ const _wrF = wikiRender; wikiRender = function () { _wrF(); try { if (G.menu === 'wiki' && !FIT.inWiki) { FIT.inWiki = 1; fitPaginate('wiki:' + (WIKI_Q ? 'q' : WIKI_TAB)); FIT.inWiki = 0; } } catch (e) { FIT.inWiki = 0; } }; }
{ const _omF = openMenu; openMenu = function (n) { if (n !== G.menu) FIT.page = {}; _omF(n); }; }
{ const _smF = MENUS.smith; MENUS.smith = () => { const h = _smF(); const i = h.indexOf('<div class="smrow"'); return i < 0 ? h : h.slice(0, i) + '<h3>' + ico('anvil') + ' Upgrade & Reforge</h3>' + h.slice(i); }; }
{ const _stF = MENUS.settings; MENUS.settings = () => { const h = _stF(); const a = h.indexOf('<div class="card"'), backTag = '<div class="btn bigb" onclick="backMenu()">Back</div>', b = h.lastIndexOf(backTag); if (a < 0 || b < a) return h; return h.slice(0, a) + '<div class="setgrid">' + h.slice(a, b) + '</div>' + h.slice(b); }; }
