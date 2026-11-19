// Builds the browser demo for itch.io (and castledefense.app/play) into demo/ and demo.zip: node tools/demo.js
// With --beta it builds Jack's private test site into beta/ instead (no zip): Cloudflare Pages runs
// `node tools/build.js && node tools/demo.js --beta` on every push to main and serves beta/ behind Cloudflare Access.
// The beta sets window.MTD_BETA too: the admin buttons show (as with ?debug), every stage and colour is open, and a small
// tag in the corner names the commit it was built from.
// (run node tools/build.js first). The same game as the website, with three changes:
// 1) Fonts from the files themselves (vendor/fonts, as in the app), so the page asks no other site for anything.
// 2) window.MTD_DEMO is set before the game starts: no offline helper (sw.js) and no update check, which only make sense on
//    our own site (itch.io serves the files from its own address, and a new version is a new upload).
// 3) Nothing to change in the game for the demo itself: outside the app there is no store, so Stages 1 to 3 play as normal,
//    and the full game's Unlock, the covered stages and the locked colours open the offer card, whose button is Apple's
//    "Download on the App Store" badge linking to the game's App Store page.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const BETA = process.argv.includes('--beta');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, BETA ? 'beta' : 'demo'), ZIP = path.join(ROOT, 'demo.zip');
const copy = (from, to = from) => { const d = path.join(OUT, to); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(ROOT, from), d); };
fs.rmSync(OUT, { recursive: true, force: true }); if (!BETA) fs.rmSync(ZIP, { force: true }); fs.mkdirSync(OUT);

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '').replace(/<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/, '<link href="fonts/fonts.css" rel="stylesheet">');
if (/fonts\.googleapis/.test(html)) throw new Error('the Google Fonts link was not replaced');
if (!/<head>/.test(html)) throw new Error('no <head>');
const sha = (process.env.CF_PAGES_COMMIT_SHA || (() => { try { return execSync('git rev-parse HEAD', { cwd: ROOT }).toString(); } catch (e) { return ''; } })()).trim().slice(0, 7);
html = html.replace('<head>', '<head>\n<script>window.MTD_DEMO = true;' + (BETA ? ' window.MTD_BETA = true;' : '') + '</script>');
if (BETA) html += `\n<div id="betaTag" style="position:fixed;left:4px;bottom:2px;z-index:99;font:10px sans-serif;color:#fff8;pointer-events:none">beta ${sha}</div>\n`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// the files the game loads (as the app copies them), and the fonts
const files = ['vendor/three.min.js', 'apple-touch-icon.png', 'icon-512.png', 'favicon.png'];
for (const d of ['maps', 'maps/thumb']) for (const f of fs.readdirSync(path.join(ROOT, d)).sort()) if (/\.(jpg|png)$/.test(f) && f !== 'overview.jpg') files.push(d + '/' + f);
for (const d of ['audio/music', 'audio/sfx']) { const fl = fs.readdirSync(path.join(ROOT, d));
  for (const f of fl) if (f.endsWith('.m4a') || (f.endsWith('.mp3') && !fl.includes(f.replace(/\.mp3$/, '.m4a')))) files.push(d + '/' + f); }
files.forEach(f => copy(f));
for (const f of fs.readdirSync(path.join(ROOT, 'vendor/fonts'))) copy('vendor/fonts/' + f, 'fonts/' + f);
if (BETA) { fs.writeFileSync(path.join(OUT, '_headers'), '/*\n  Cache-Control: no-cache\n'); console.log('built beta/ · ' + sha); process.exit(0); }
// itch.io wants index.html at the top of the zip
execSync(`cd "${OUT}" && zip -qr -X "${ZIP}" .`);
const n = execSync(`cd "${OUT}" && find . -type f | wc -l`).toString().trim();
console.log(`built demo/ and demo.zip · ${n} files · ${(fs.statSync(ZIP).size / 1048576).toFixed(1)} MB zipped`);
