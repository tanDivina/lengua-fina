#!/usr/bin/env node
// Renders the end card and caption overlays (1920x1080 PNGs, captions with
// alpha) in the app's own visual language: stage #0f0f10, fg #f5f5f2,
// gold #ffd24a, Bricolage Grotesque (Google Fonts, falls back to system).
// Usage: node make_overlays.js [workdir]
const fs = require('fs');
const path = require('path');
const puppeteer = require('/Users/dorienvandenabbeele/Documents/antigravity/noble-pythagoras/node_modules/puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'promo_work');
fs.mkdirSync(path.join(WORK, 'captions'), { recursive: true });

const CAPTIONS = {
  c_hook: 'An agent that reads the room',
  c_stats: '76% buy in their own language — CSA Research',
  c_copy: 'Real product · European hooks · 3 markets',
  c_run: 'Live run — no mockups',
  c_log: '0 inventable references: grounded or rejected',
  c_verdict: 'Taste facts: Qloo entities + affinity scores',
  c_honest: 'No Qloo data? Flagged, never faked',
};

const MASCOT = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'mascot', 'tamandua.svg'), 'utf8');

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400..700&display=swap">`;

const captionHtml = (text) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1920px; height: 1080px; background: transparent; font-family: Inter, system-ui, sans-serif;
         display: flex; align-items: flex-end; justify-content: center; padding-bottom: 54px; }
  .pill { background: rgba(15,15,16,0.92); border: 2px solid #ffd24a; border-radius: 44px;
          padding: 20px 44px; color: #f5f5f2; font-size: 34px; font-weight: 600; letter-spacing: -0.2px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.55); }
</style></head><body><div class="pill">${text}</div></body></html>`;

const endcardHtml = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1920px; height: 1080px; background: #0f0f10; font-family: Inter, system-ui, sans-serif;
         display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; }
  .mascot { height: 240px; }
  .mascot svg { height: 240px; width: auto; }
  h1 { color: #f5f5f2; font-family: 'Bricolage Grotesque', Inter, sans-serif; font-size: 132px;
       font-weight: 800; letter-spacing: -3px; }
  h1 .dot { color: #ffd24a; }
  .tag { color: #b8b8b2; font-size: 42px; font-weight: 500; letter-spacing: -0.5px; }
  .tag b { color: #ffd24a; font-weight: 700; }
  .foot { margin-top: 24px; color: #b8b8b2; opacity: .8; font-size: 25px;
          font-family: ui-monospace, Menlo, monospace; }
</style></head><body>
  <div class="mascot">${MASCOT}</div>
  <h1>lengua<span class="dot">·</span>fina</h1>
  <div class="tag">Every reference, <b>traceable to Qloo</b>.</div>
  <div class="foot">lengua-fina.vercel.app &nbsp;·&nbsp; github.com/tanDivina/lengua-fina &nbsp;·&nbsp; Qloo Agentic Hackathon 2026</div>
</body></html>`;

async function shoot(page, html, out, transparent) {
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 150));
  await page.screenshot({ path: out, omitBackground: transparent });
  console.log(`✓ ${path.basename(out)}`);
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await shoot(page, endcardHtml, path.join(WORK, 'endcard.png'), false);
  for (const [name, text] of Object.entries(CAPTIONS)) {
    await shoot(page, captionHtml(text), path.join(WORK, 'captions', `${name}.png`), true);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
