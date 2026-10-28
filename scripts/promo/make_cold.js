#!/usr/bin/env node
// Renders the 3.6 s cold open (cold.html) frame by frame into WORK/intro/cold.mp4,
// with a soft two-partial chime as the strike lands. The "where" line comes
// from the recorded run (timeline.json pralineDropped), so it always matches
// the run that is in the video.
// Usage: node make_cold.js [workdir]
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('/Users/dorienvandenabbeele/Documents/antigravity/noble-pythagoras/node_modules/puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'promo_work');
const COLD = 3.6, CHIME_AT = 1.45;

const run = (args) => new Promise((res, rej) => {
  const p = spawn(FFMPEG, args); let err = ''; p.stderr.on('data', (d) => { err += d; });
  p.on('close', (c) => (c ? rej(new Error(`ffmpeg ${c}\n${err.slice(-1500)}`)) : res()));
});

async function main() {
  const tl = JSON.parse(fs.readFileSync(path.join(WORK, 'timeline.json'), 'utf8'));
  const markets = tl.pralineDropped || [];
  if (!markets.length) { console.error('No market dropped the praline in this run; cold open would not be true. Aborting.'); process.exit(1); }
  const where = markets.length === 3 ? `in ${markets[0]}, ${markets[1]} and ${markets[2]}` : `in ${markets.join(' and ')}`;
  const src = `by the agent, from Qloo taste data · live run, ${tl.ranOn}`;

  const dir = path.join(WORK, 'intro');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const mascot = 'file://' + path.join(__dirname, '..', '..', 'public', 'mascot', 'tamandua.svg');
  await page.goto('file://' + path.join(__dirname, 'cold.html') +
    `?where=${encodeURIComponent(where)}&src=${encodeURIComponent(src)}&mascot=${encodeURIComponent(mascot)}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });

  const silent = path.join(dir, 'cold_v.mp4');
  const ff = spawn(FFMPEG, ['-y', '-framerate', '30', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p', silent]);
  ff.stderr.on('data', () => {});
  const closed = new Promise((r) => ff.on('close', r));
  const total = Math.round(COLD * 30);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.seek(t), i / 30);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await closed;
  await browser.close();

  const bell = (f, d) => `sine=f=${f}:d=${d}:r=48000,afade=t=out:st=0:d=${d}:curve=exp`;
  await run(['-y', '-i', silent, '-filter_complex',
    `${bell(1318, 1.2)},volume=0.22[a1];${bell(1976, 0.9)},volume=0.12[a2];[a1][a2]amix=inputs=2:normalize=0,adelay=${CHIME_AT * 1000}|${CHIME_AT * 1000},aformat=channel_layouts=stereo,apad,atrim=0:${COLD}[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', path.join(dir, 'cold.mp4')]);
  fs.unlinkSync(silent);
  console.log(`✓ cold.mp4 (${COLD}s): "${where}" / "${src}"`);
}
main().catch((e) => { console.error(e); process.exit(1); });
