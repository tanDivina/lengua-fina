#!/usr/bin/env node
// Records ONE real agent run on the Lengua Fina site as a raw take (the web
// equivalent of the skill's scrcpy phone take): workbench with the demo copy,
// the Transcreate click, the tasting notebook streaming Qloo tool calls, then
// the verdict cards. compose.cjs cuts it: waits sped up, real run time stamped.
// Writes WORK/run/raw.mp4 + WORK/run/timeline.json (marks in take seconds,
// which markets struck the praline line, the run date).
// Usage: SITE_URL=http://localhost:3005 node record_run.cjs [workdir]
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const puppeteer = require('/Users/dorienvandenabbeele/Documents/antigravity/noble-pythagoras/node_modules/puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const SITE = (process.env.SITE_URL || 'http://localhost:3005').replace(/\/$/, '');
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'demo_work');
const DIR = path.join(WORK, 'run');
fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dur = (n) => parseFloat(execSync(`/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "${path.join(WORK, 'audio', n + '.mp3')}"`).toString());

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 600000,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,940', '--force-device-scale-factor=1'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.2 });
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await page.goto(SITE + '/', { waitUntil: 'networkidle0', timeout: 60000 });

  // Cursor + click pulse drawn by the page, heartbeat pixel, workbench in view.
  const wbY = await page.evaluate(() => {
    const s = document.createElement('style');
    s.textContent = `#pc{position:fixed;width:26px;height:26px;pointer-events:none;z-index:999999;transition:transform .12s;filter:drop-shadow(0 2px 5px rgba(0,0,0,.7))}
      #pc.down{transform:scale(.82)}
      .pclick{position:fixed;width:56px;height:56px;border-radius:50%;pointer-events:none;z-index:999998;
        background:radial-gradient(circle,rgba(255,210,74,.65) 0%,rgba(255,210,74,0) 70%);transform:translate(-50%,-50%) scale(.25);animation:pk .45s cubic-bezier(.1,.8,.3,1) forwards}
      @keyframes pk{to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
      #fps-hb{position:fixed;right:0;bottom:0;width:2px;height:2px;z-index:99999;animation:fpshb .033s infinite linear}
      @keyframes fpshb{0%{background:#0f0f10}50%{background:#101011}100%{background:#0f0f10}}
      html{scroll-behavior:auto!important}`;
    document.head.appendChild(s);
    const hb = document.createElement('div'); hb.id = 'fps-hb'; document.body.appendChild(hb);
    const c = document.createElement('div'); c.id = 'pc';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 3l14 9.2-6.6 1 3 6.3-2.7 1.3-3-6.3L5 18.6z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    c.style.left = '700px'; c.style.top = '600px'; document.body.appendChild(c);
    window.cur = (x, y) => { c.style.left = x + 'px'; c.style.top = y + 'px'; };
    window.pulse = (x, y) => {
      c.classList.add('down'); setTimeout(() => c.classList.remove('down'), 160);
      const r = document.createElement('div'); r.className = 'pclick'; r.style.left = x + 'px'; r.style.top = y + 'px';
      document.body.appendChild(r); setTimeout(() => r.remove(), 480);
    };
    return document.getElementById('workbench').getBoundingClientRect().top + window.scrollY - 70;
  });
  await page.evaluate((y) => window.scrollTo(0, y), wbY);
  await sleep(600);

  const ff = spawn(FFMPEG, ['-y', '-use_wallclock_as_timestamps', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-i', '-',
    '-vf', 'scale=1920:1080:flags=lanczos', '-fps_mode', 'cfr', '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', path.join(DIR, 'raw.mp4')]);
  ff.stderr.on('data', () => {});
  const closed = new Promise((r) => ff.on('close', r));
  const cdp = await page.target().createCDPSession();
  let t0 = null; const marks = {};
  const now = () => (Date.now() - t0) / 1000;
  const mark = (k) => { marks[k] = +now().toFixed(3); console.log(`  ⏱ ${k} @ ${marks[k]}s`); };
  cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
    try { if (t0 === null) t0 = Date.now(); ff.stdin.write(Buffer.from(data, 'base64')); await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  while (t0 === null) await sleep(20);

  let cx = 700, cy = 600;
  const moveTo = async (x, y, ms = 700) => {
    const fx = cx, fy = cy, n = Math.max(10, Math.round(ms / 33));
    for (let i = 0; i <= n; i++) {
      const t = i / n, e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      cx = fx + (x - fx) * e; cy = fy + (y - fy) * e;
      await page.evaluate((a, b) => window.cur(a, b), cx, cy);
      await sleep(ms / n);
    }
  };
  const center = (sel, text) => page.evaluate((s, t) => {
    const el = Array.from(document.querySelectorAll(s)).find((e) => !t || (e.value || e.innerText || '').includes(t));
    if (!el) return null;
    const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel, text);
  const scrollTo = (y, ms = 900) => page.evaluate((target, d) => new Promise((done) => {
    const from = window.scrollY, delta = target - from, start = performance.now();
    const step = (t) => { const k = Math.min(1, (t - start) / d); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      window.scrollTo(0, from + delta * e); k < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  }), y, ms);

  // ── copy: the demo copy and its three rooms (n_copy) ──────────────────────
  mark('copy');
  const ta = await center('textarea', 'Brussels praline');
  if (ta) await moveTo(ta.x, ta.y, 1100);
  await sleep(1600);
  const tk = await center('input', 'Tokyo');
  if (tk) await moveTo(tk.x, tk.y, 900);
  const copyEnd = 0.3 + dur('n_copy') + 0.6;
  while (now() - marks.copy < copyEnd) await sleep(50);

  // ── click (n_run starts on the real click) ────────────────────────────────
  const btn = await center('button', 'Transcreate');
  await moveTo(btn.x, btn.y, 650);
  await sleep(150);
  await page.evaluate((a, b) => window.pulse(a, b), cx, cy);
  await page.mouse.click(cx, cy);
  mark('click');

  // ── stream: first agent event, then follow the notebook ──────────────────
  await page.waitForFunction(() => /the tasting notebook/i.test(document.body.innerText), { timeout: 120000 });
  mark('first_event');
  await page.evaluate(() => {
    const ol = document.querySelector('section ol');
    if (ol) new MutationObserver(() => { ol.scrollTop = ol.scrollHeight; }).observe(ol, { childList: true });
  });
  const nbY = await page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('h2')).find((e) => /tasting notebook/i.test(e.innerText));
    return h ? h.getBoundingClientRect().top + window.scrollY - 240 : window.scrollY + 300;
  });
  await scrollTo(nbY, 1000);
  await page.waitForFunction(
    () => document.body.innerText.includes('returned by Qloo during this run') || !!document.querySelector('p.text-mandarin'),
    { timeout: 420000 });
  mark('run_end');
  if (!(await page.evaluate(() => document.body.innerText.includes('returned by Qloo during this run')))) {
    throw new Error('run failed: ' + (await page.evaluate(() => document.querySelector('p.text-mandarin')?.innerText)));
  }

  // ── verdict: the three live cards, slow scroll into the taste facts ──────
  const vY = await page.evaluate(() => {
    const hs = Array.from(document.querySelectorAll('h2')).filter((e) => /el veredicto/i.test(e.innerText));
    const h = hs[hs.length - 1];
    return h ? h.getBoundingClientRect().top + window.scrollY - 110 : window.scrollY + 600;
  });
  await scrollTo(vY, 900);
  mark('verdict');
  await sleep(1500);
  await scrollTo(vY + 520, Math.round((dur('n_verdict') - 1.0) * 1000));
  await sleep(1400);
  mark('end');

  const pralineDropped = await page.evaluate(() =>
    Array.from(document.querySelectorAll('article'))
      .filter((c) => Array.from(c.querySelectorAll('span.line-through')).some((s) => /praline/i.test(s.innerText)))
      .map((c) => (c.querySelector('span')?.innerText || '').trim())
      .map((s) => s.charAt(0) + s.slice(1).toLowerCase()));
  await cdp.send('Page.stopScreencast');
  await browser.close();
  ff.stdin.end();
  await closed;
  const ranOn = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  fs.writeFileSync(path.join(DIR, 'timeline.json'), JSON.stringify({ ranOn, pralineDropped, marks }, null, 2));
  console.log(`✓ run/raw.mp4, run ${(marks.run_end - marks.click).toFixed(1)}s, praline dropped in: ${pralineDropped.join(', ') || 'none'}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
