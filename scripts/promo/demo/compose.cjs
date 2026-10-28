#!/usr/bin/env node
// Composes the Lengua Fina demo video (1920x1080), hackathon-video skill structure:
//   cold open → Dorien on camera (p1_open) → hero → benchmark → live run →
//   saved-run Brussels → architecture → measured numbers → one language, three
//   rooms → Dorien on camera (p2_story) → close
// Inputs: site/<scene>.mp4 (record_site.cjs), run/raw.mp4 (record_run.cjs),
//   intro/*.mp4|mov (record_intro.cjs), audio/ (garden clone), captions/,
//   ../personal/p1_open + p2_story (.mov/.mp4). Missing clips become slates.
// Music: tropical.mp3 (Finca Montezuma track), looped, ducked under voices.
// Never overwrites: if the output exists, writes <name>_2.mp4, _3, ...
// Also writes WORK/scenes.json (segment + moment times) for publish_text.cjs.
// Usage: node compose.cjs [workdir] [out.mp4]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const FFPROBE = '/opt/homebrew/bin/ffprobe';
const MAGICK = '/opt/homebrew/bin/magick';
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'demo_work');
const PERSONAL = path.join(path.dirname(WORK), 'personal');
const MUSIC = process.env.MUSIC || path.join(process.env.HOME, 'finca-montezuma-promo', 'public', 'audio', 'tropical.mp3');
const SEG = path.join(WORK, 'seg');
fs.mkdirSync(SEG, { recursive: true });
const LEAD = 0.3;
const STAGE = '#0f0f10', PANEL = '#19191b', FG = '#f5f5f2', GOLD = '#ffd24a', MANDARIN = '#ff7a45';
const SANS = '/System/Library/Fonts/Supplemental/Arial.ttf';
const SANS_B = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
const MUSIC_DB = -21;

function freeName(p) {
  if (!fs.existsSync(p)) return p;
  const { dir, name, ext } = path.parse(p);
  for (let i = 2; ; i++) { const q = path.join(dir, `${name}_${i}${ext}`); if (!fs.existsSync(q)) return q; }
}
const OUT = freeName(process.argv[3] || path.join(path.dirname(WORK), 'lengua_fina_demo.mp4'));

const A = (n) => path.join(WORK, 'audio', `${n}.mp3`);
const CAP = (n) => path.join(WORK, 'captions', `${n}.png`);
const dur = (f) => parseFloat(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const hasAudio = (f) => execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', f]).toString().trim() !== '';
const ff = (args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const V_OUT = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30'];
const A_OUT = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2'];
const find = (base) => ['.mov', '.mp4', '.MOV', '.MP4'].map((e) => path.join(PERSONAL, base + e)).find(fs.existsSync);
const f3 = (n) => n.toFixed(3);

function mix(cues, firstInput, len) {
  if (!cues.length) return `anullsrc=r=48000:cl=stereo,atrim=0:${f3(len)}[aout]`;
  const parts = cues.map((c, i) => {
    const ms = Math.max(0, Math.round(c.t * 1000));
    return `[${firstInput + i}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${c.vol ?? 1},adelay=${ms}|${ms}[a${i}]`;
  });
  return [...parts, `${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0:dropout_transition=0,apad,atrim=0:${f3(len)}[aout]`].join(';');
}
// Caption pills: [{name, from, to}] over video label vin → vout.
function captions(caps, firstInput, vin) {
  let fc = ''; let last = vin;
  caps.forEach((c, i) => {
    const d = c.to - c.from;
    fc += `;[${firstInput + i}:v]format=rgba,loop=-1:size=1:start=0,trim=0:${f3(d)},setpts=PTS-STARTPTS,` +
      `fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=${f3(Math.max(0, d - 0.3))}:d=0.3:alpha=1,setpts=PTS+${f3(c.from)}/TB[cp${i}]` +
      `;[${last}][cp${i}]overlay=0:0:eof_action=pass[cv${i}]`;
    last = `cv${i}`;
  });
  return { fc, last };
}

let n = 0, clock = 0;
const segs = [], scenes = [], moments = {};
const next = () => path.join(SEG, `${String(++n).padStart(2, '0')}.mp4`);
const push = (out, key, label) => { scenes.push({ key, t: +clock.toFixed(2), label }); const d = dur(out); segs.push(out); clock += d; return d; };

// A recorded or rendered clip with narration cues [{line, t}] and caption pills [{name, from, to}].
function scene(rel, key, label, cues, caps = []) {
  const v = path.join(WORK, rel);
  const len = dur(v); const out = next();
  const cs = cues.map((c) => ({ ...c, file: A(c.line) }));
  const cp = caps.filter((c) => fs.existsSync(CAP(c.name))).map((c) => ({ ...c, to: Math.min(c.to ?? len - 0.2, len - 0.2) }));
  const capFirst = 1 + cs.length;
  const { fc, last } = captions(cp, capFirst, '0:v');
  ff(['-i', v, ...cs.flatMap((c) => ['-i', c.file]), ...cp.flatMap((c) => ['-i', CAP(c.name)]),
    '-filter_complex', `[0:v]null[base0]${fc.replaceAll('[0:v]', '[base0]')};[${cp.length ? last : 'base0'}]scale=1920:1080,setsar=1,format=yuv420p[vout];` + mix(cs, 1, len),
    '-map', '[vout]', '-map', '[aout]', ...V_OUT, ...A_OUT, '-t', f3(len), out]);
  push(out, key, label);
  console.log(`✓ ${path.basename(out)} ${rel} ${len.toFixed(1)}s`);
}

// A slate holding a personal clip's place, showing what to say.
function slate(key, label, script, seconds) {
  const png = path.join(WORK, `slate_${key}.png`);
  execFileSync(MAGICK, ['-size', '1920x1080', `xc:${PANEL}`,
    '-font', SANS_B, '-fill', MANDARIN, '-pointsize', '32', '-gravity', 'north', '-annotate', '+0+190', label.toUpperCase(),
    '(', '-size', '1440x', '-background', 'none', '-font', SANS, '-fill', FG, '-pointsize', '50', '-interline-spacing', '10', '-gravity', 'center', `caption:${script}`, ')',
    '-gravity', 'center', '-geometry', '+0+50', '-composite', png]);
  const out = next();
  ff(['-loop', '1', '-t', String(seconds), '-i', png, '-filter_complex', `[0:v]scale=1920:1080,format=yuv420p[v];` + mix([], 1, seconds),
    '-map', '[v]', '-map', '[aout]', ...V_OUT, ...A_OUT, '-t', String(seconds), out]);
  push(out, key, `${label} (slate)`);
  console.log(`… ${path.basename(out)} SLATE ${label} ${seconds}s`);
}

// Dorien on camera: centred, side strips from a blurred copy, optional overlay. Own sound kept.
function personal(base, key, label, script, seconds, overlay) {
  const f = find(base);
  if (!f) return slate(key, label, script, seconds);
  const len = dur(f); const out = next();
  const ov = overlay && fs.existsSync(path.join(WORK, overlay)) ? path.join(WORK, overlay) : null;
  const v = `[0:v]split[bg0][fg0];[bg0]scale=1920:-2,crop=1920:1080:0:(ih-1080)*0.55,boxblur=28:2,eq=brightness=-0.07:saturation=0.85[bg];` +
    `[fg0]scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0` + (ov ? `[base];[base][1:v]overlay=0:0:eof_action=pass` : '') + `,setsar=1,format=yuv420p[v]`;
  const a = hasAudio(f) ? `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-16:TP=-1.5[aout]` : `anullsrc=r=48000:cl=stereo,atrim=0:${len}[aout]`;
  ff(['-i', f, ...(ov ? ['-i', ov] : []), '-filter_complex', `${v};${a}`, '-map', '[v]', '-map', '[aout]', ...V_OUT, ...A_OUT, '-t', f3(len), out]);
  push(out, key, label);
  console.log(`✓ ${path.basename(out)} personal ${path.basename(f)} ${len.toFixed(1)}s${ov ? ' + overlay' : ''}`);
}

// A pre-rendered clip with its own sound (the cold open).
function own(rel, key, label) {
  const f = path.join(WORK, rel);
  if (!fs.existsSync(f)) return;
  const out = next();
  ff(['-i', f, '-filter_complex', `[0:v]scale=1920:1080,setsar=1,format=yuv420p[v];[0:a]aformat=sample_rates=48000:channel_layouts=stereo[aout]`,
    '-map', '[v]', '-map', '[aout]', ...V_OUT, ...A_OUT, '-t', f3(dur(f)), out]);
  push(out, key, label);
  console.log(`✓ ${path.basename(out)} ${rel}`);
}

// The live run take: copy (real time) → click to first event (real time) →
// the stream sped up just enough to carry the lines, real run time stamped →
// the verdict (real time).
function liveRun() {
  const raw = path.join(WORK, 'run', 'raw.mp4');
  const tl = JSON.parse(fs.readFileSync(path.join(WORK, 'run', 'timeline.json'), 'utf8'));
  const m = tl.marks;
  const T = dur(raw);
  const dRun = dur(A('n_run')), dLog = dur(A('n_log'));
  // Output times: copy plays to the click, n_run starts on the click.
  const runOut = m.click;
  const logOut = runOut + dRun + 0.4;
  const streamOut0 = m.first_event;
  const streamOut1 = Math.max(logOut + dLog + 0.8, streamOut0 + 4);
  const k = (m.run_end - m.first_event) / (streamOut1 - streamOut0);
  const verdictOut = streamOut1 + (m.verdict - m.run_end);
  const len = streamOut1 + (T - m.run_end);
  const pieces = [
    { a: 0, b: m.first_event, k: 1 },
    { a: m.first_event, b: m.run_end, k },
    { a: m.run_end, b: T, k: 1 },
  ];
  const cues = [
    { line: 'n_copy', t: LEAD },
    { line: 'n_run', t: runOut },
    { line: 'n_log', t: logOut },
    { line: 'n_verdict', t: verdictOut + 0.3 },
  ].map((c) => ({ ...c, file: A(c.line) }));
  const caps = [
    { name: 'c_copy', from: 0.4, to: m.click - 0.2 },
    { name: 'c_run', from: m.click, to: streamOut0 + 0.5 },
    { name: 'c_log', from: streamOut0 + 0.6, to: streamOut1 },
    { name: 'c_speed', from: streamOut0 + 0.6, to: streamOut1 - 0.2 },
    { name: 'c_verdict', from: verdictOut + 0.3, to: len - 0.3 },
  ].filter((c) => fs.existsSync(CAP(c.name)));
  let fc = `[0:v]fps=30,split=${pieces.length}${pieces.map((_, i) => `[p${i}]`).join('')};`;
  fc += pieces.map((p, i) => `[p${i}]trim=${f3(p.a)}:${f3(p.b)},setpts=(PTS-STARTPTS)/${p.k.toFixed(4)}[q${i}]`).join(';');
  fc += ';' + pieces.map((_, i) => `[q${i}]`).join('') + `concat=n=${pieces.length}:v=1:a=0,fps=30[rv]`;
  const capFirst = 1 + cues.length;
  const c = captions(caps, capFirst, 'rv');
  fc += c.fc + `;[${c.last}]scale=1920:1080,setsar=1,format=yuv420p[vout];` + mix(cues, 1, len);
  const out = next();
  ff(['-i', raw, ...cues.flatMap((x) => ['-i', x.file]), ...caps.flatMap((x) => ['-i', CAP(x.name)]),
    '-filter_complex', fc, '-map', '[vout]', '-map', '[aout]', ...V_OUT, ...A_OUT, '-t', f3(len), out]);
  const start = clock;
  moments.click = start + runOut; moments.notebook = start + streamOut0; moments.verdict = start + verdictOut;
  push(out, 'run', 'live run: copy, click, Qloo tool stream, verdict');
  console.log(`✓ ${path.basename(out)} live run ${len.toFixed(1)}s (real run ${(m.run_end - m.click).toFixed(1)}s, stream x${k.toFixed(2)})`);
}

fs.readdirSync(SEG).forEach((f) => fs.unlinkSync(path.join(SEG, f)));

own('intro/cold.mp4', 'cold', 'cold open: the praline line, struck');
personal('p1_open', 'opener', 'Your clip P1: opener, about 17 s',
  "This cacao grows right here, on my island in Bocas del Toro. I turn it into truffles: unrefined, one hundred percent cacao. When I sell chocolate abroad, the hard part isn't the language. It's lines like this one: \"Smooth as a Brussels praline. Perfect with your Sunday café au lait.\" I'm Belgian. I thought that kind of line was safe. In Tokyo, it means nothing. And in Brussels... it's actually worse.",
  17, 'intro/overlay.mov');
scene('site/hero.mp4', 'hero', 'meet Lengua Fina', [{ line: 'n_intro', t: LEAD }]);
scene('site/stats.mp4', 'stats', 'benchmark: 76% (CSA Research)', [{ line: 'n_stats', t: LEAD }], [{ name: 'c_stats', from: 0.6 }]);
liveRun();
scene('site/brussels.mp4', 'brussels', 'saved run: Brussels drops the praline', [{ line: 'n_brussels', t: LEAD }], [{ name: 'c_brussels', from: 0.5 }]);
scene('intro/arch.mp4', 'arch', 'under the hood', [{ line: 'n_arch', t: LEAD }]);
scene('intro/numbers.mp4', 'numbers', 'measured: taste differs by market', [{ line: 'n_numbers', t: LEAD }]);
{
  const t0 = clock;
  scene('site/scale.mp4', 'scale', 'one language, three rooms; Willemstad', [{ line: 'n_scale', t: LEAD }],
    [{ name: 'c_scale', from: 0.5, to: LEAD + 6.5 }, { name: 'c_willemstad', from: LEAD + 6.9 }]);
  moments.willemstad = t0 + LEAD + 6.6;
}
personal('p2_story', 'closer', 'Your clip P2: why I built it, about 18 s',
  "I'm Dorien. I translate for a living, and I make truffles from my own cacao. Lengua Fina already rewrites my truffle copy for Tokyo, Brussels and Austin. Next, I'm bringing it to the small businesses I translate and build websites for, so their copy doesn't just speak the language. It tastes local.",
  18, 'intro/overlay2.mov');
scene('site/close.mp4', 'close', 'close', [{ line: 'n_outro', t: LEAD }]);

// Concatenate picture + voice.
const list = path.join(SEG, 'list.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
const joined = path.join(WORK, 'joined.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]);
const T = dur(joined);

// Music bed: loop with a crossfade, duck under every voice, fade out at the end.
const md = dur(MUSIC);
const loops = Math.ceil(T / (md - 3)) + 1;
let mfc = '';
for (let i = 0; i < loops; i++) mfc += `[${1 + i}:a]aformat=sample_rates=48000:channel_layouts=stereo[m${i}];`;
let last = 'm0';
for (let i = 1; i < loops; i++) { mfc += `[${last}][m${i}]acrossfade=d=3[mx${i}];`; last = `mx${i}`; }
mfc += `[${last}]atrim=0:${f3(T)},volume=${MUSIC_DB}dB,afade=t=in:d=1.5,afade=t=out:st=${f3(T - 3)}:d=3[bed];`;
mfc += `[0:a]asplit=2[voice][key];[bed][key]sidechaincompress=threshold=0.02:ratio=8:attack=40:release=600[ducked];`;
mfc += `[voice][ducked]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[aout]`;
ff(['-i', joined, ...Array.from({ length: loops }, () => ['-i', MUSIC]).flat(), '-filter_complex', mfc,
  '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', ...A_OUT, '-movflags', '+faststart', OUT]);

const total = dur(OUT);
const sc = { out: OUT, total, slates: { opener: !find('p1_open'), closer: !find('p2_story') },
  scenes, moments: Object.fromEntries(Object.entries(moments).map(([k, v]) => [k, +v.toFixed(2)])) };
fs.writeFileSync(path.join(WORK, 'scenes.json'), JSON.stringify(sc, null, 2));
const stamp = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
console.log('\nScenes:');
scenes.forEach((s) => console.log(`  ${stamp(s.t)}  ${s.label}`));
console.log(`\n✅ ${OUT} (${stamp(total)}, ${total.toFixed(1)}s, ${segs.length} segments)`);
if (total >= 180) console.log('⚠ over 3:00: trim per the skill (narration repeating Dorien first, then long lines, then holds)');
