#!/usr/bin/env node
// Renders intro.html frame by frame (the hackathon-video skill's approach):
//   WORK/intro/cold.mp4      cold open (3.6 s) + soft chime as the strike lands; markets read from the run take
//   WORK/intro/arch.mp4      architecture, timed to n_arch's words
//   WORK/intro/numbers.mp4   measured numbers, timed to n_numbers's words
//   WORK/intro/overlay.mov   transparent layer for p1_open (name card, the praline quote)
//   WORK/intro/overlay2.mov  transparent layer for p2_story (truffles saved run)
//   WORK/captions/*.png      caption pills
// Usage: node record_intro.cjs [workdir] [cold,arch,numbers,overlay,overlay2,captions]
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const puppeteer = require('/Users/dorienvandenabbeele/Documents/antigravity/noble-pythagoras/node_modules/puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'demo_work');
const only = process.argv[3] ? process.argv[3].split(',') : null;
const want = (k) => !only || only.includes(k);
const MASCOT = 'file://' + path.join(__dirname, '..', '..', '..', 'public', 'mascot', 'tamandua.svg');
const clip = (b) => ['.mp4', '.mov', '.MOV', '.MP4'].map((e) => path.join(WORK, '..', 'personal', b + e)).find(fs.existsSync);
const dur = (f) => parseFloat(execSync(`/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString());
const line = (n) => dur(path.join(WORK, 'audio', `${n}.mp3`));
const COLD = 3.6, CHIME_AT = 1.45, LEAD = 0.3;

const CAPTIONS = {
  c_stats: '76% prefer to buy in their own language · CSA Research',
  c_copy: 'Demo copy · European hooks · Tokyo, Brussels, Austin',
  c_run: 'Live run · real Qloo calls',
  c_log: '0 inventable references: grounded or rejected',
  c_verdict: 'Taste facts: Qloo entities + affinity scores',
  c_brussels: 'Saved run, Oct 25 · Brussels: a contest with local chocolate',
  c_scale: 'Saved run, Oct 25 · one language, three rooms',
  c_willemstad: 'Willemstad: no Qloo data, zero references, and it says so',
};

const run = (args) => new Promise((res, rej) => {
  const p = spawn(FFMPEG, args); let err = ''; p.stderr.on('data', (d) => { err += d; });
  p.on('close', (c) => (c ? rej(new Error(`ffmpeg ${c}\n${err.slice(-1500)}`)) : res()));
});

async function open(browser, params) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const qs = new URLSearchParams({ mascot: MASCOT, ...params }).toString();
  await page.goto('file://' + path.join(__dirname, 'intro.html') + '?' + qs, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
  return page;
}

async function render(browser, params, seconds, out, alpha) {
  const page = await open(browser, params);
  const enc = alpha ? ['-c:v', 'png', '-pix_fmt', 'rgba'] : ['-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p'];
  const ff = spawn(FFMPEG, ['-y', '-framerate', '30', '-f', 'image2pipe', '-vcodec', alpha ? 'png' : 'mjpeg', '-i', '-', ...enc, out]);
  ff.stderr.on('data', () => {});
  const closed = new Promise((r) => ff.on('close', r));
  const total = Math.round(seconds * 30);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.seek(t), i / 30);
    const buf = alpha ? await page.screenshot({ type: 'png', omitBackground: true }) : await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await closed;
  await page.close();
  console.log(`✓ ${path.basename(out)} (${seconds.toFixed(2)}s, ${total} frames)`);
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1', '--allow-file-access-from-files'] });
  const dir = path.join(WORK, 'intro');
  fs.mkdirSync(dir, { recursive: true });

  if (want('cold')) {
    const tl = JSON.parse(fs.readFileSync(path.join(WORK, 'run', 'timeline.json'), 'utf8'));
    const mk = tl.pralineDropped || [];
    if (!mk.length) throw new Error('No market dropped the praline in the run take; the cold open would not be true.');
    const where = mk.length === 3 ? `in ${mk[0]}, ${mk[1]} and ${mk[2]}` : `in ${mk.join(' and ')}`;
    const src = `by the agent, from Qloo taste data · live run, ${tl.ranOn}`;
    const silent = path.join(dir, 'cold_v.mp4');
    await render(browser, { scene: 'cold', where, src }, COLD, silent, false);
    const bell = (f, d) => `sine=f=${f}:d=${d}:r=48000,afade=t=out:st=0:d=${d}:curve=exp`;
    await run(['-y', '-i', silent, '-filter_complex',
      `${bell(1318, 1.2)},volume=0.22[a1];${bell(1976, 0.9)},volume=0.12[a2];[a1][a2]amix=inputs=2:normalize=0,adelay=${CHIME_AT * 1000}|${CHIME_AT * 1000},aformat=channel_layouts=stereo,apad,atrim=0:${COLD}[a]`,
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', path.join(dir, 'cold.mp4')]);
    fs.unlinkSync(silent);
    console.log(`  cold open: "${where}" / "${src}"`);
  }
  if (want('arch')) await render(browser, { scene: 'arch' }, LEAD + line('n_arch') + 1.4, path.join(dir, 'arch.mp4'), false);
  if (want('numbers')) await render(browser, { scene: 'numbers' }, LEAD + line('n_numbers') + 1.4, path.join(dir, 'numbers.mp4'), false);

  // Overlay cue times can be overridden from personal/overlay_times.json once the clip is transcribed.
  const times = fs.existsSync(path.join(WORK, '..', 'personal', 'overlay_times.json'))
    ? JSON.parse(fs.readFileSync(path.join(WORK, '..', 'personal', 'overlay_times.json'), 'utf8')) : {};
  const p1 = clip('p1_open'), p2 = clip('p2_story');
  if (want('overlay')) {
    if (p1) await render(browser, { scene: 'overlay', ...(times.p1 || {}) }, dur(p1), path.join(dir, 'overlay.mov'), true);
    else console.log('… overlay skipped: no personal/p1_open yet');
  }
  if (want('overlay2')) {
    const shot = path.join(WORK, 'shots', 'truffles.png');
    if (p2 && fs.existsSync(shot)) await render(browser, { scene: 'overlay2', shot: 'file://' + shot, ...(times.p2 || {}) }, dur(p2), path.join(dir, 'overlay2.mov'), true);
    else console.log('… overlay2 skipped: needs personal/p2_story and shots/truffles.png');
  }
  if (want('captions')) {
    const cdir = path.join(WORK, 'captions');
    fs.mkdirSync(cdir, { recursive: true });
    const page = await open(browser, { scene: 'caption', text: '' });
    for (const [name, text] of Object.entries(CAPTIONS)) {
      await page.evaluate((t) => { document.getElementById('cap-text').innerHTML = t; document.getElementById('cap-text').classList.remove('corner'); }, text);
      await page.screenshot({ path: path.join(cdir, `${name}.png`), omitBackground: true });
    }
    const tlf = path.join(WORK, 'run', 'timeline.json');
    if (fs.existsSync(tlf)) {
      const m = JSON.parse(fs.readFileSync(tlf, 'utf8')).marks;
      const s = Math.round(m.run_end - m.click);
      const label = `<b>Sped up</b> · real run time ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      await page.evaluate((t) => { const el = document.getElementById('cap-text'); el.innerHTML = t; el.classList.add('corner'); }, label);
      await page.screenshot({ path: path.join(cdir, 'c_speed.png'), omitBackground: true });
    }
    await page.close();
    console.log(`✓ captions (${Object.keys(CAPTIONS).length}${fs.existsSync(tlf) ? ' + speed badge' : ''})`);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
