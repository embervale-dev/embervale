// ================= in-game chat: press / to talk to your multiplayer room =================
// Recent messages show bottom-left and fade out; / opens the input, Enter sends, Esc closes.
const CHAT = { el: null, log: null, inp: null, open: false, shown: false, hinted: false };
function chatOnline() { return (NET.status === 'host' || NET.status === 'guest') && S && G.mode !== 'title'; }
function chatBuild() {
  if (CHAT.el) return;
  const d = document.createElement('div'); d.id = 'chatbox';
  d.innerHTML = '<div id="chatlog"></div><input id="chatin" maxlength="140" autocomplete="off" spellcheck="false" placeholder="Say something… (Enter to send, Esc to close)">';
  document.body.appendChild(d); CHAT.el = d; CHAT.log = d.querySelector('#chatlog'); CHAT.inp = d.querySelector('#chatin');
  CHAT.inp.addEventListener('keydown', e => {
    e.stopPropagation();   // typing must not trigger game hotkeys
    if (e.key === 'Enter') { e.preventDefault(); const v = CHAT.inp.value; CHAT.inp.value = ''; netChat(v); chatClose(); }
    else if (e.key === 'Escape') { e.preventDefault(); chatClose(); }
  });
  CHAT.inp.addEventListener('keyup', e => e.stopPropagation());
  CHAT.inp.addEventListener('blur', () => { if (CHAT.open) chatClose(); });
}
function chatAdd(html, cls) {
  chatBuild(); const d = document.createElement('div'); d.innerHTML = html; if (cls) d.className = cls;
  CHAT.log.appendChild(d); while (CHAT.log.children.length > 40) CHAT.log.firstChild.remove();
  setTimeout(() => d.classList.add('old'), 10000); CHAT.log.scrollTop = CHAT.log.scrollHeight;
}
function chatOpen() {
  chatBuild(); CHAT.open = true; CHAT.el.classList.add('open');
  for (const k in keys) keys[k] = false; pressed = {}; mouse.down = false;   // stop walking/attacking while typing
  CHAT.inp.value = ''; CHAT.inp.focus(); CHAT.log.scrollTop = CHAT.log.scrollHeight;
}
function chatClose() { if (!CHAT.el) return; CHAT.open = false; CHAT.el.classList.remove('open'); CHAT.inp.blur(); }
// every room message (chat, joins, leaves) also lands in the in-game log
{ const _npC = netPost; netPost = function (text) { _npC(text); chatAdd(text); }; }
// show the box only while you're in a room and in the game
{ const _uC = update; update = function (dt) { _uC(dt); const on = !!chatOnline();
  if (on !== CHAT.shown) { CHAT.shown = on; chatBuild(); CHAT.el.style.display = on ? 'flex' : 'none'; if (!on) chatClose();
    if (on && !CHAT.hinted) { CHAT.hinted = true; chatAdd('Press <b>/</b> to chat', 'hint'); } } }; }
// "/" opens chat (only on the main game screen, never while typing elsewhere)
addEventListener('keydown', e => {
  if (e.key !== '/' || e.repeat) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (!S || G.mode === 'title' || G.menu) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (chatOnline()) chatOpen(); else toast('💬 Chat works in a multiplayer room — open ☰ Menu → 🌐 Multiplayer', '#9ad0ff');
}, true);
const chatStyle = document.createElement('style');
chatStyle.textContent = `
#chatbox{position:fixed;left:72px;bottom:140px;width:min(360px,calc(100vw - 88px));z-index:5;display:none;flex-direction:column;gap:6px;pointer-events:none;font-size:13px;line-height:1.35}
#chatlog{display:flex;flex-direction:column;gap:3px;max-height:190px;overflow:hidden;padding:2px}
#chatlog div{align-self:flex-start;max-width:100%;padding:3px 9px;border-radius:8px;background:rgba(10,8,16,.62);color:#ece0c8;text-shadow:0 1px 2px #000;overflow-wrap:anywhere;transition:opacity .6s}
#chatlog div.hint{color:#a39884;font-style:italic}
#chatbox:not(.open) #chatlog div.old{opacity:0}
#chatbox.open{pointer-events:auto}
#chatbox.open #chatlog{overflow-y:auto;background:rgba(10,8,16,.55);border:1px solid rgba(214,168,82,.35);border-radius:10px;padding:6px}
#chatbox.open #chatlog div{background:none;padding:1px 2px}
#chatin{display:none;width:100%;box-sizing:border-box;padding:7px 10px;border-radius:9px;border:1px solid rgba(214,168,82,.7);background:rgba(14,11,22,.94);color:#ffe2a8;font:inherit;outline:none;box-shadow:0 6px 18px rgba(0,0,0,.45)}
#chatin:focus{border-color:var(--gold,#ffd27a)}
#chatbox.open #chatin{display:block}`;
document.head.appendChild(chatStyle);
