#!/usr/bin/env node
// Records the REAL Lengua Fina app (localhost:3000) doing one live run:
// hero -> stats -> the preloaded chocolate copy -> Transcreate -> tasting
// notebook streaming Qloo/Claude tool calls -> verdict cards with taste facts.
// Writes raw_screen.mp4 plus a timeline.json (scene marks + audio cues).
// Usage: node record_promo.js [workdir]
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const puppeteer = require('/Users/dorienvandenabbeele/Documents/antigravity/noble-pythagoras/node_modules/puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const APP = process.env.APP_URL || 'http://localhost:3000';
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'promo_work');
fs.mkdirSync(WORK, { recursive: true });
const RAW = path.join(WORK, 'raw_screen.mp4');
const AUDIO = path.join(WORK, 'audio');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,940', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.2 });
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await page.goto(APP, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => document.body.innerText.includes('read by three different rooms'), { timeout: 30000 });
  await sleep(400);

  // Desktop cursor + click pulse, drawn by the page itself so it is captured.
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #promo-cursor { position: fixed; width: 26px; height: 26px; pointer-events: none; z-index: 999999;
        transition: transform .12s ease; filter: drop-shadow(0 2px 5px rgba(0,0,0,.7)); }
      #promo-cursor.down { transform: scale(0.82); }
      .promo-click { position: fixed; width: 56px; height: 56px; border-radius: 50%; pointer-events: none; z-index: 999998;
        background: radial-gradient(circle, rgba(255,210,74,0.65) 0%, rgba(255,210,74,0) 70%);
        transform: translate(-50%,-50%) scale(.25); animation: promoClick .45s cubic-bezier(.1,.8,.3,1) forwards; }
      @keyframes promoClick { to { transform: translate(-50%,-50%) scale(1.6); opacity: 0; } }
      #fps-heartbeat { position: fixed; bottom: 0; right: 0; width: 2px; height: 2px; z-index: 999997;
        animation: hb .033s infinite linear; }
      @keyframes hb { 0% { background:#0f0f10 } 50% { background:#101011 } 100% { background:#0f0f10 } }
    `;
    document.head.appendChild(style);
    const hb = document.createElement('div'); hb.id = 'fps-heartbeat'; document.body.appendChild(hb);
    const c = document.createElement('div');
    c.id = 'promo-cursor';
    c.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 3l14 9.2-6.6 1 3 6.3-2.7 1.3-3-6.3L5 18.6z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    c.style.left = '820px'; c.style.top = '620px';
    document.body.appendChild(c);
    window.cursorTo = (x, y) => { c.style.left = `${x}px`; c.style.top = `${y}px`; };
    window.cursorClick = (x, y) => {
      c.classList.add('down'); setTimeout(() => c.classList.remove('down'), 160);
      const r = document.createElement('div'); r.className = 'promo-click';
      r.style.left = `${x}px`; r.style.top = `${y}px`;
      document.body.appendChild(r); setTimeout(() => r.remove(), 480);
    };
    // Smallest button whose text contains the query.
    window.findButton = (query) => {
      const els = Array.from(document.querySelectorAll('button, select, [role="tab"]'));
      const hits = els.filter((e) => (e.innerText || '').replace(/\s+/g, ' ').includes(query));
      hits.sort((a, b) => a.offsetWidth * a.offsetHeight - b.offsetWidth * b.offsetHeight);
      return hits[0] ?? null;
    };
    window.centerOf = (query) => {
      const t = window.findButton(query);
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, bottom: r.bottom };
    };
    // Document-Y of the smallest element containing the text (or a selector).
    window.absY = (txt, sel) => {
      if (sel) {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().top + window.scrollY : null;
      }
      const all = Array.from(document.querySelectorAll('section, h1, h2, div, p'));
      const hits = all.filter((e) => (e.innerText || '').toLowerCase().includes(txt.toLowerCase()));
      hits.sort((a, b) => a.offsetWidth * a.offsetHeight - b.offsetWidth * b.offsetHeight);
      return hits[0] ? hits[0].getBoundingClientRect().top + window.scrollY : null;
    };
    window.elemCenter = (txt) => {
      const all = Array.from(document.querySelectorAll('textarea, input, div'));
      const hits = all.filter((e) => (e.value || e.innerText || '').includes(txt));
      hits.sort((a, b) => a.offsetWidth * a.offsetHeight - b.offsetWidth * b.offsetHeight);
      if (!hits[0]) return null;
      const r = hits[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
  });

  // Recorder: wall-clock timestamps keep the video real-time.
  const ff = spawn(FFMPEG, ['-y', '-use_wallclock_as_timestamps', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-i', '-',
    '-vf', 'scale=1920:1080:flags=lanczos', '-vsync', 'cfr', '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', RAW]);
  ff.stderr.on('data', () => {});
  const cdp = await page.target().createCDPSession();
  let frames = 0; let t0 = null; const marks = {}; const audio = [];
  const now = () => (Date.now() - t0) / 1000;
  const mark = (name) => { marks[name] = +now().toFixed(3); console.log(`  ⏱ ${name} @ ${marks[name]}s`); };
  cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
    try { if (t0 === null) t0 = Date.now(); frames++; ff.stdin.write(Buffer.from(data, 'base64')); await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  while (t0 === null) await sleep(20);

  // Voice pacing: each cue knows its clip duration; settle() waits until the
  // narrator finishes plus a breath. Missing clips fall back to 3s estimates.
  const dur = (f) => {
    try { return parseFloat(execSync(`/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString()); }
    catch { return 3; }
  };
  const GAP = 0.9;
  const played = [];
  const speak = (name) => {
    const file = path.join(AUDIO, `${name}.mp3`);
    audio.push({ name, file, t: +now().toFixed(3) });
    played.push({ end: now() + (fs.existsSync(file) ? dur(file) : 3) });
    console.log(`  🔊 ${name} @ ${now().toFixed(2)}s`);
  };
  const settle = async (extra = GAP) => {
    const end = Math.max(0, ...played.map((p) => p.end));
    const wait = end + extra - now();
    if (wait > 0) await sleep(wait * 1000);
  };

  // Cursor choreography.
  let cx = 820, cy = 620;
  async function moveTo(x, y, ms = 550) {
    const fx = cx, fy = cy, steps = Math.max(10, Math.round(ms / 33));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      cx = fx + (x - fx) * e; cy = fy + (y - fy) * e;
      await page.evaluate((a, b) => window.cursorTo(a, b), cx, cy);
      await sleep(ms / steps);
    }
  }
  async function click(query = null) {
    await page.evaluate((a, b) => window.cursorClick(a, b), cx, cy);
    await page.mouse.click(cx, cy);
    if (query) {
      await page.evaluate((q) => {
        const el = window.findButton(q);
        if (el) el.click();
      }, query);
    }
    await sleep(260);
  }
  async function clickOn(query, ms = 550) {
    await page.evaluate((q) => {
      const el = window.findButton(q);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 90 || r.bottom > window.innerHeight - 90) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, query);
    await sleep(300);
    const c = await page.evaluate((q) => window.centerOf(q), query);
    if (!c) throw new Error(`button not found: ${query}`);
    await moveTo(c.x, c.y, ms); await sleep(140); await click(query);
  }
  async function scrollTo(y, ms = 700) {
    await page.evaluate((target, dur) => new Promise((done) => {
      const from = window.scrollY, delta = target - from, start = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - start) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        window.scrollTo(0, from + delta * e);
        k < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    }), y, ms);
    await sleep(120);
  }
  const scrollToText = async (txt, offset = 120, ms = 700, sel = null) => {
    const y = await page.evaluate((t, s) => window.absY(t, s), txt, sel);
    if (y !== null) await scrollTo(Math.max(0, y - offset), ms);
    return y;
  };
  const waitText = (txt, timeout = 20000) =>
    page.waitForFunction((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), { timeout }, txt);

  // ── Scene 1: hero + mascot (silent beat — the on-camera opener precedes it)
  mark('hero'); console.log('Scene 1: hero');
  await sleep(2200);

  // ── Scene 2: stat band ───────────────────────────────────────────────────
  mark('stats'); console.log('Scene 2: stats');
  speak('n_stats');
  await scrollToText('of online shoppers prefer', 200, 900);
  await settle(0.4);

  // ── Scene 3: the copy + markets ──────────────────────────────────────────
  mark('copybench'); console.log('Scene 3: workbench');
  speak('n_copy');
  await scrollToText(null, 90, 900, '#workbench');
  const copyC = await page.evaluate(() => window.elemCenter('Brussels praline'));
  if (copyC) await moveTo(copyC.x, copyC.y, 900);
  await sleep(600);
  const mkt = await page.evaluate(() => window.elemCenter('Tokyo'));
  if (mkt) await moveTo(mkt.x, mkt.y, 800);
  await settle(0.4);

  // ── Scene 4: Transcreate ─────────────────────────────────────────────────
  mark('run_click'); console.log('Scene 4: transcreate');
  speak('n_run');
  await clickOn('Transcreate', 650);
  await waitText('The tasting notebook', 30000);
  // Keep the streaming log scrolled to its newest line.
  await page.evaluate(() => {
    const ol = document.querySelector('section ol');
    if (!ol) return;
    new MutationObserver(() => { ol.scrollTop = ol.scrollHeight; }).observe(ol, { childList: true });
  });
  await scrollToText('The tasting notebook', 240, 800);
  mark('run_start'); console.log('Scene 5: live run (this takes a while)');
  await sleep(400);
  speak('n_log');

  // Wait for the full agent run (3 markets, ~2–3 min; compressed in post).
  await page.waitForFunction(
    () => document.body.innerText.includes('returned by Qloo during this run') || document.body.innerText.includes('Something went wrong') || !!document.querySelector('.text-mandarin'),
    { timeout: 420000 }
  );
  mark('run_end');
  const ok = await page.evaluate(() => document.body.innerText.includes('returned by Qloo during this run'));
  if (!ok) throw new Error('run failed — check the app error state');

  // ── Scene 6: the verdict ─────────────────────────────────────────────────
  await scrollToText('El veredicto', 110, 900);
  mark('verdict'); console.log('Scene 6: verdict');
  speak('n_verdict');
  await sleep(1500);
  await page.evaluate(() => new Promise((done) => {
    const from = window.scrollY, delta = 420, start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / 2600);
      window.scrollTo(0, from + delta * k);
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }));
  await settle(0.3);

  // ── Scene 7: Brussels drops its own praline ──────────────────────────────
  mark('brussels'); console.log('Scene 7: Brussels praline drop');
  const pralineDropped = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('article'));
    return cards.some((c) => /dropped/i.test(c.innerText) && /praline/i.test(c.innerText));
  });
  if (pralineDropped) speak('n_brussels');
  else console.log('⚠ praline not dropped this run — skipping n_brussels');
  await scrollToText('Dropped', 260, 900);
  await settle(0.5);

  // ── Scene 8: Willemstad — honest no-data demo ────────────────────────────
  mark('dutch_nav'); console.log('Scene 8: Dutch demo (Willemstad)');
  await page.goto(`${APP}/?demo=dutch`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    window.absY = (txt, sel) => {
      if (sel) {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().top + window.scrollY : null;
      }
      const all = Array.from(document.querySelectorAll('section, h1, h2, div, p'));
      const hits = all.filter((e) => (e.innerText || '').toLowerCase().includes(txt.toLowerCase()));
      hits.sort((a, b) => a.offsetWidth * a.offsetHeight - b.offsetWidth * b.offsetHeight);
      return hits[0] ? hits[0].getBoundingClientRect().top + window.scrollY : null;
    };
  });
  await sleep(400);
  mark('honest');
  speak('n_honest');
  await scrollToText('Willemstad', 180, 900);
  await settle(0.8);

  // ── Outro beat: a held frame; the on-camera closer + end card follow in post
  mark('outro'); console.log('Outro hold');
  await sleep(1200);
  mark('end');

  await cdp.send('Page.stopScreencast');
  await sleep(300);
  await browser.close();
  await new Promise((r) => { ff.stdin.end(); ff.on('close', r); });
  fs.writeFileSync(path.join(WORK, 'timeline.json'), JSON.stringify({ fps: 30, frames, seconds: marks.end, marks, audio }, null, 2));
  console.log(`\n✅ ${RAW} (${frames} frames, ${marks.end}s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
