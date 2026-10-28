#!/usr/bin/env node
// Records the Lengua Fina site as one clip per scene, each sized to its
// narration line (0.3 s lead + line + pad), the hackathon-video skill's way:
//   hero      hero + tamandua; hovering "Run your copy" perks him up      (n_intro)
//   stats     the stat band with its CSA source                          (n_stats)
//   brussels  saved Oct 25 run: Brussels's own reason for dropping it   (n_brussels)
//   scale     saved "Dutch, three ways" run, down to Willemstad          (n_scale)
//   close     back to the hero, tamandua perked                          (n_outro)
// Also writes WORK/shots/truffles.png for the p2_story overlay.
// Use a production build (dev mode makes the page sluggish):
//   npm run build && PORT=3005 npm run start
// Usage: SITE_URL=http://localhost:3005 node record_site.cjs [workdir] [scene,scene...]
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const puppeteer = require('/Users/dorienvandenabbeele/Documents/antigravity/noble-pythagoras/node_modules/puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const SITE = (process.env.SITE_URL || 'http://localhost:3005').replace(/\/$/, '');
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'demo_work');
const OUT = path.join(WORK, 'site');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(WORK, 'shots'), { recursive: true });
const only = process.argv[3] ? process.argv[3].split(',') : null;
const LEAD = 0.3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dur = (f) => {
  try { return parseFloat(execSync(`/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString()); }
  catch { return 3; }
};
const len = (line, pad = 1.0) => LEAD + dur(path.join(WORK, 'audio', `${line}.mp3`)) + pad;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,940', '--force-device-scale-factor=1', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.2 });
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));

  // Each scene: fresh screencast into its own file, real time, with a heartbeat
  // pixel so idle stretches still produce frames (no clock drift).
  async function scene(name, seconds, run) {
    if (only && !only.includes(name)) return;
    const file = path.join(OUT, `${name}.mp4`);
    const ff = spawn(FFMPEG, ['-y', '-use_wallclock_as_timestamps', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-i', '-',
      '-vf', 'scale=1920:1080:flags=lanczos', '-fps_mode', 'cfr', '-r', '30', '-t', seconds.toFixed(2),
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', file]);
    ff.stderr.on('data', () => {});
    ff.stdin.on('error', () => {});
    const closed = new Promise((r) => ff.on('close', r));
    const cdp = await page.target().createCDPSession();
    cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
      try { ff.stdin.write(Buffer.from(data, 'base64')); await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
    const t0 = Date.now();
    await run(() => (Date.now() - t0) / 1000);
    const left = seconds + 0.5 - (Date.now() - t0) / 1000;
    if (left > 0) await sleep(left * 1000);
    await cdp.send('Page.stopScreencast');
    await cdp.detach();
    ff.stdin.end();
    await closed;
    console.log(`✓ ${name}.mp4 (${seconds.toFixed(1)}s)`);
  }
  const skip = (name) => only && !only.includes(name);
  const at = async (now, t) => { const w = t - now(); if (w > 0) await sleep(w * 1000); };
  const scrollTo = (y, ms = 1400) => page.evaluate((target, d) => new Promise((done) => {
    const from = window.scrollY, delta = target - from, start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / d);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, from + delta * e);
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }), y, ms);
  const topOf = (sel, offset = 0) => page.evaluate((s, o) => {
    const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + window.scrollY - o : 0;
  }, sel, offset);
  // Document-Y of a market card's "Dropped" block.
  const droppedY = (city) => page.evaluate((c) => {
    const card = Array.from(document.querySelectorAll('article'))
      .find((a) => (a.querySelector('span')?.innerText || '').trim().toLowerCase() === c.toLowerCase());
    if (!card) return null;
    const d = Array.from(card.querySelectorAll('span')).find((s) => /^dropped$/i.test(s.innerText.trim()));
    return (d || card).getBoundingClientRect().top + window.scrollY;
  }, city);
  const cardY = (city) => page.evaluate((c) => {
    const card = Array.from(document.querySelectorAll('article'))
      .find((a) => (a.querySelector('span')?.innerText || '').trim().toLowerCase() === c.toLowerCase());
    return card ? card.getBoundingClientRect().top + window.scrollY : null;
  }, city);
  const hoverCta = async (on) => {
    const c = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('a, button')).find((e) => /run your copy/i.test(e.innerText));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (c) await page.mouse.move(on ? c.x : 40, on ? c.y : 40, { steps: 18 });
  };
  const fresh = async (q = '', reduced = false) => {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }]);
    await page.goto(SITE + '/' + q, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => {
      const s = document.createElement('style');
      s.textContent = `#fps-hb{position:fixed;right:0;bottom:0;width:2px;height:2px;z-index:99999;animation:fpshb .033s infinite linear}
        @keyframes fpshb{0%{background:#0f0f10}50%{background:#101011}100%{background:#0f0f10}}
        html{scroll-behavior:auto!important}`;
      document.head.appendChild(s);
      const d = document.createElement('div'); d.id = 'fps-hb'; document.body.appendChild(d);
    });
  };

  // ── hero: entrance, the tamandua, then the CTA perks him up ──────────────
  if (!skip('hero')) {
    await page.goto('about:blank');
    await scene('hero', len('n_intro', 1.4), async (now) => {
      await fresh();
      await at(now, 5.0); await hoverCta(true);
    });
  }

  // ── stats: the band with its count-up and the CSA source line ────────────
  if (!skip('stats')) {
    await fresh();
    await page.mouse.move(40, 40);
    const y = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('p')).find((p) => /online shoppers prefer/i.test(p.innerText));
      return el ? el.getBoundingClientRect().top + window.scrollY - 330 : 500;
    });
    await scene('stats', len('n_stats', 1.0), async () => {
      await scrollTo(y, 1600);
    });
  }

  // ── brussels: saved Oct 25 run, the Brussels card's own reason ───────────
  if (!skip('brussels')) {
    await fresh('?demo=chocolate', true);
    const y = await droppedY('Brussels');
    await page.evaluate((v) => window.scrollTo(0, v), Math.max(0, (y ?? 0) - 380));
    await sleep(500);
    await scene('brussels', len('n_brussels', 1.0), async () => {
      await sleep(1500);
      await scrollTo(Math.max(0, (y ?? 0) - 260), 2500);
    });
  }

  // ── scale: saved "Dutch, three ways", down to Willemstad's no-data note ──
  if (!skip('scale')) {
    await fresh('?demo=dutch', true);
    const top = await cardY('Amsterdam');
    await page.evaluate((v) => window.scrollTo(0, v), Math.max(0, (top ?? 0) - 200));
    await sleep(500);
    const wd = await droppedY('Willemstad');
    // Word timings in n_scale: "Willemstad" ~6.8 s, "zero references" ~11.8 s (+LEAD).
    await scene('scale', len('n_scale', 1.0), async (now) => {
      await at(now, 2.6); await scrollTo(Math.max(0, (top ?? 0) - 70), 1600);
      await at(now, 6.9); if (wd !== null) await scrollTo(wd - 300, 2600);
    });
  }

  // ── close: back to the hero, tamandua perked ─────────────────────────────
  if (!skip('close')) {
    await fresh();
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.mouse.move(40, 40);
    await sleep(400);
    await scene('close', len('n_outro', 2.4), async (now) => {
      await scrollTo(0, 1600);
      await at(now, 1.9); await hoverCta(true);
    });
  }

  // ── still for the p2_story overlay: the truffles saved run ───────────────
  if (!skip('shots')) {
    await fresh('?demo=truffles', true);
    const y = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('h2')).find((e) => /el veredicto/i.test(e.innerText));
      return h ? h.getBoundingClientRect().top + window.scrollY - 40 : 0;
    });
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(600);
    await page.screenshot({ path: path.join(WORK, 'shots', 'truffles.png'), clip: { x: 0, y: 0, width: 1600, height: 900 } });
    console.log('✓ shots/truffles.png');
  }

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
