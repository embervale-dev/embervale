// Builds ../Embervale-offline.html: the same game with every icon embedded, so the one file works on its own.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), dir = path.join(root, 'assets', 'icons'), data = {};
for (const f of fs.readdirSync(dir)) if (f.endsWith('.svg')) data[f.slice(0, -4)] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fs.readFileSync(path.join(dir, f), 'utf8'));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const i = html.indexOf('<script>'); if (i < 0) { console.error('mk_offline: no <script> in index.html'); process.exit(1); }
// the UI fonts are tiny (about 95 KB), so they are embedded too
let nf = 0; html = html.replace(/url\(assets\/fonts\/([\w-]+\.woff2)\)/g, (m, f) => { const fp = path.join(root, 'assets', 'fonts', f); if (!fs.existsSync(fp)) return m; nf++; return `url(data:font/woff2;base64,${fs.readFileSync(fp).toString('base64')})`; });
const j = html.indexOf('<script>');
html = html.slice(0, j) + `<script>const ICON_DATA=${JSON.stringify(data)};</script>\n` + html.slice(j);
fs.writeFileSync(path.join(root, 'Embervale-offline.html'), html);
console.log(`offline build: ${Object.keys(data).length} icons and ${nf} fonts embedded, ${(html.length / 1048576).toFixed(1)} MB`);
