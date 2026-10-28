#!/usr/bin/env node
// Composes the final 1920x1080 promo:
//   [cold open] -> [on-camera opener + name card] -> screen recording (waits
//   compressed, caption pills) -> [on-camera closer] -> end card with the
//   outro voice line. Missing on-camera clips are replaced by a slate showing
//   their script, so timing (and the printed chapters) stay close to final.
// Clips: env INTRO / OUTRO, else ~/Desktop/LenguaFina_Video/personal/p1_open.* / p2_close.*
// Usage: node compose_promo.js [workdir] [out.mp4] [music.mp3]
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const FFPROBE = '/opt/homebrew/bin/ffprobe';
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'promo_work');
const OUT = process.argv[3] || path.join(path.dirname(WORK), 'lengua_fina_promo.mp4');
const MUSIC = process.argv[4] || process.env.MUSIC || null;
const PERSONAL = path.join(path.dirname(WORK), 'personal');
const findClip = (env, base) => {
  if (process.env[env] && fs.existsSync(process.env[env])) return process.env[env];
  return ['.mp4', '.mov', '.MOV', '.MP4'].map((e) => path.join(PERSONAL, base + e)).find(fs.existsSync) || null;
};
const INTRO = findClip('INTRO', 'p1_open');
const OUTRO = findClip('OUTRO', 'p2_close');
const SLATE_INTRO = 17, SLATE_OUTRO = 8;
const COLD_FILE = path.join(WORK, 'intro', 'cold.mp4');
const COLD = fs.existsSync(COLD_FILE) ? COLD_FILE : null;

const tl = JSON.parse(fs.readFileSync(path.join(WORK, 'timeline.json')));
const m = tl.marks;
const RAW = path.join(WORK, 'raw_screen.mp4');
const probe = (f, args) => execFileSync(FFPROBE, ['-v', 'error', ...args, f]).toString().trim();
const durOf = (f) => parseFloat(probe(f, ['-show_entries', 'format=duration', '-of', 'csv=p=0']));
const hasAudio = (f) => probe(f, ['-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0']) !== '';
const T = durOf(RAW);
const f3 = (n) => n.toFixed(3);

// No narration line may start before the previous one has finished.
{
  let prevEnd = -Infinity, prevName = '';
  [...tl.audio].sort((x, y) => x.t - y.t).forEach((c) => {
    if (c.t < prevEnd + 0.4) {
      console.log(`  ${c.name} moved ${(prevEnd + 0.4 - c.t).toFixed(2)}s later (overlapped ${prevName})`);
      c.t = prevEnd + 0.4;
    }
    if (fs.existsSync(c.file)) { prevEnd = c.t + durOf(c.file); prevName = c.name; }
  });
}
const stamp = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ── Retiming: compress the agent-run wait and the page change ──────────────
const compress = [];
if (m.pre_click != null && m.run_click != null && m.run_click - m.pre_click > 2) {
  const a = m.pre_click + 0.3, b = m.run_click - 0.9;
  if (b - a > 0.5) compress.push({ a, b, f: 0.6 / (b - a), label: 'cursor travel' });
}
{
  // Idle wait between the click line ending and the first agent event.
  const nRun = tl.audio.find((c) => c.name === 'n_run');
  if (nRun && fs.existsSync(nRun.file) && m.run_start != null) {
    const a = nRun.t + durOf(nRun.file) + 0.6;
    const b = m.run_start - 0.3;
    if (b - a > 1.5) compress.push({ a, b, f: 1.0 / (b - a), label: 'first-event wait' });
  }
}
{
  const nLog = tl.audio.find((c) => c.name === 'n_log');
  // Speed-up starts only once the "live run" line has begun, so the lines
  // before it keep their real-time spacing.
  const a = Math.min(Math.max(m.run_start + 1.2, nLog ? nLog.t + 0.3 : 0), m.run_end);
  const b = Math.max(a, m.run_end - 0.5);
  if (b - a > 2) {
    const cueT = nLog ? nLog.t : a;
    const voiceNeeds = nLog && fs.existsSync(nLog.file) ? cueT + durOf(nLog.file) + 0.7 - a : 3;
    const target = Math.min(b - a, Math.max(3, voiceNeeds));
    compress.push({ a, b, f: target / (b - a), label: 'run' });
  }
}
if (m.brussels_nav != null && m.brussels != null) {
  const a = m.brussels_nav + 0.15;
  const b = m.brussels - 0.05;
  if (b - a > 0.5) compress.push({ a, b, f: 0.25 / (b - a), label: 'page change' });
}
compress.sort((x, y) => x.a - y.a);
const mapT = (t) => {
  let out = t;
  for (const s of compress) {
    if (t >= s.b) out -= (s.b - s.a) * (1 - s.f);
    else if (t > s.a) out -= (t - s.a) * (1 - s.f);
  }
  return out;
};
const MT = mapT(T);
compress.forEach((s) => console.log(`${s.label} ${f3(s.a)}–${f3(s.b)} compressed x${(1 / s.f).toFixed(2)}`));
console.log(`screen part ${f3(MT)}s (raw ${f3(T)}s)`);

// ── Segment layout ──────────────────────────────────────────────────────────
const XF = 0.5, XC = 0.25;
const C = COLD ? durOf(COLD) : 0;
const I = INTRO ? durOf(INTRO) : SLATE_INTRO;
const O = OUTRO ? durOf(OUTRO) : SLATE_OUTRO;
const ofsIntro = COLD ? C - XC : 0;
const ofsScreen = ofsIntro + I - XF;
const ofsOutro = ofsScreen + MT - XF;
const ofsEnd = ofsOutro + O - XF;
const outroVoice = path.join(WORK, 'audio', 'n_outro.mp3');
const END_CARD = Math.max(3.6, fs.existsSync(outroVoice) ? 0.4 + durOf(outroVoice) + 1.2 : 0);
const TOTAL = ofsEnd + END_CARD;

// ── Captions (screen part only) ─────────────────────────────────────────────
const spans = [];
const add = (name, s, e) => {
  if (s == null || e == null) return;
  const S = mapT(s), E = Math.max(mapT(e), mapT(s) + 0.8);
  const file = path.join(WORK, 'captions', `${name}.png`);
  if (fs.existsSync(file)) spans.push({ name, file, s: S, e: Math.min(E, MT - 0.2) });
};
add('c_stats', m.stats, m.copybench - 0.2);
add('c_copy', m.copybench, (m.pre_click ?? m.run_click) - 0.2);
add('c_run', m.run_click, m.run_start + 0.9);
add('c_log', m.run_start + 1.1, m.run_end + 1.2);
{
  const wait = compress.find((s) => s.label === 'first-event wait');
  add('c_speed', wait ? wait.a : m.run_start + 1.2, m.run_end - 0.6);
}
add('c_verdict', m.verdict + 0.2, m.brussels_nav - 0.2);
add('c_brussels', m.brussels + 0.2, m.dutch_nav - 0.2);
add('c_honest', m.honest + 0.3, m.outro - 0.1);

// ── Inputs ──────────────────────────────────────────────────────────────────
const inputs = [];
const addIn = (...args) => { inputs.push(...args); return inputs.filter((x) => x === '-i').length - 1; };
const RAW_IN = addIn('-i', RAW);
const EC_IN = addIn('-i', path.join(WORK, 'endcard.png'));
const capIns = spans.map((c) => addIn('-i', c.file));
const clips = tl.audio.filter((c) => fs.existsSync(c.file));
const clipIns = clips.map((c) => addIn('-i', c.file));
const OUTRO_VOICE = fs.existsSync(outroVoice) ? addIn('-i', outroVoice) : -1;
const COLD_IN = COLD ? addIn('-i', COLD) : -1;
const INTRO_IN = INTRO ? addIn('-i', INTRO) : addIn('-loop', '1', '-t', f3(SLATE_INTRO), '-i', path.join(WORK, 'slate_intro.png'));
const OUTRO_IN = OUTRO ? addIn('-i', OUTRO) : addIn('-loop', '1', '-t', f3(SLATE_OUTRO), '-i', path.join(WORK, 'slate_outro.png'));
const NAME_IN = INTRO && fs.existsSync(path.join(WORK, 'namecard.png')) ? addIn('-loop', '1', '-t', f3(I), '-i', path.join(WORK, 'namecard.png')) : -1;
const MUS = MUSIC && fs.existsSync(MUSIC) ? addIn('-i', MUSIC) : -1;

// ── Video graph ─────────────────────────────────────────────────────────────
const parts = [];
const norm = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,setsar=1';
if (compress.length) {
  const segs = [];
  let prev = 0;
  compress.forEach((s) => {
    if (s.a > prev) segs.push({ from: prev, to: s.a, f: 1 });
    segs.push({ from: s.a, to: s.b, f: s.f });
    prev = s.b;
  });
  segs.push({ from: prev, to: T, f: 1 });
  segs.forEach((s, i) => {
    const end = i === segs.length - 1 ? '' : `:${f3(s.to)}`;
    parts.push(`[${RAW_IN}:v]trim=${f3(s.from)}${end},setpts=(PTS-STARTPTS)*${s.f.toFixed(5)}[s${i}]`);
  });
  parts.push(`${segs.map((_, i) => `[s${i}]`).join('')}concat=n=${segs.length}:v=1,fps=30[vt]`);
} else {
  parts.push(`[${RAW_IN}:v]fps=30[vt]`);
}
let cur = 'vt';
spans.forEach((c, i) => {
  const d = c.e - c.s;
  parts.push(
    `[${capIns[i]}:v]format=rgba,loop=-1:size=1:start=0,trim=0:${f3(d)},setpts=PTS-STARTPTS,` +
      `fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=${f3(Math.max(0, d - 0.3))}:d=0.3:alpha=1,setpts=PTS+${f3(c.s)}/TB[c${i}]`,
    `[${cur}][c${i}]overlay=0:0:eof_action=pass[v${i}]`
  );
  cur = `v${i}`;
});
parts.push(`[${cur}]format=yuv420p,setsar=1[main]`);

parts.push(`[${INTRO_IN}:v]${norm}[iv0]`);
if (NAME_IN >= 0) {
  parts.push(`[${NAME_IN}:v]format=rgba,fade=t=in:st=0.8:d=0.4:alpha=1,fade=t=out:st=5.2:d=0.4:alpha=1[nc]`);
  parts.push(`[iv0][nc]overlay=0:0:eof_action=pass,format=yuv420p[iv]`);
} else {
  parts.push(`[iv0]null[iv]`);
}
parts.push(`[${OUTRO_IN}:v]${norm}[ov]`);
let chain = 'iv';
if (COLD) {
  parts.push(`[${COLD_IN}:v]${norm}[cv]`);
  parts.push(`[cv][iv]xfade=transition=fade:duration=${XC}:offset=${f3(C - XC)}[x0]`);
  chain = 'x0';
}
parts.push(`[${chain}][main]xfade=transition=fade:duration=${XF}:offset=${f3(ofsScreen)}[x1]`);
parts.push(`[x1][ov]xfade=transition=fade:duration=${XF}:offset=${f3(ofsOutro)}[x2]`);
parts.push(`[${EC_IN}:v]loop=-1:size=1:start=0,trim=duration=${f3(END_CARD + XF)},setpts=PTS-STARTPTS,fps=30,format=yuv420p,setsar=1[ec]`);
parts.push(`[x2][ec]xfade=transition=fade:duration=${XF}:offset=${f3(ofsEnd)}[vout]`);

// ── Audio graph ─────────────────────────────────────────────────────────────
const VOICE_TARGET = -20;
const gainOf = (file) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const mm = /mean_volume:\s*(-?[\d.]+)/.exec(r.stderr || '');
  return VOICE_TARGET - (mm ? parseFloat(mm[1]) : VOICE_TARGET);
};
const aparts = [];
const mixIns = [];
const voiceStem = (inIdx, file, at, label) => {
  const d = Math.round(at * 1000);
  const g = gainOf(file);
  console.log(`  ${label}: ${g >= 0 ? '+' : ''}${g.toFixed(1)} dB @ ${at.toFixed(2)}s`);
  aparts.push(`[${inIdx}:a]volume=${g.toFixed(2)}dB,adelay=${d}|${d},aformat=sample_rates=44100:channel_layouts=stereo[a_${label}]`);
  mixIns.push(`[a_${label}]`);
};
clips.forEach((c, i) => voiceStem(clipIns[i], c.file, ofsScreen + mapT(c.t), c.name));
if (OUTRO_VOICE >= 0) voiceStem(OUTRO_VOICE, outroVoice, ofsEnd + 0.4, 'n_outro');
if (COLD) {
  aparts.push(`[${COLD_IN}:a]aformat=sample_rates=44100:channel_layouts=stereo[a_cold]`);
  mixIns.push('[a_cold]');
}
const clipAudio = (inIdx, file, at, len, label) => {
  const g = gainOf(file);
  const d = Math.round(at * 1000);
  console.log(`  ${label}: ${g >= 0 ? '+' : ''}${g.toFixed(1)} dB @ ${at.toFixed(2)}s`);
  aparts.push(`[${inIdx}:a]volume=${g.toFixed(2)}dB,afade=t=out:st=${f3(Math.max(0, len - 0.5))}:d=0.5,adelay=${d}|${d},aformat=sample_rates=44100:channel_layouts=stereo[a_${label}]`);
  mixIns.push(`[a_${label}]`);
};
if (INTRO && hasAudio(INTRO)) clipAudio(INTRO_IN, INTRO, ofsIntro, I, 'opener');
if (OUTRO && hasAudio(OUTRO)) clipAudio(OUTRO_IN, OUTRO, ofsOutro, O, 'closer');

const voices = `${mixIns.join('')}amix=inputs=${mixIns.length}:normalize=0:dropout_transition=0,apad=whole_dur=${f3(TOTAL)}`;
let mix;
if (MUS >= 0) {
  aparts.push(`[${MUS}:a]dynaudnorm=f=400:g=15:p=0.7:m=8,volume=0.07,afade=t=in:d=1.5,atrim=0:${f3(TOTAL)},afade=t=out:st=${f3(TOTAL - 2.5)}:d=2.5,aformat=sample_rates=44100:channel_layouts=stereo[am]`);
  mix = [
    `${voices},asplit=2[vx][vsc]`,
    `[am][vsc]sidechaincompress=threshold=0.015:ratio=8:attack=60:release=700:makeup=1[duck]`,
    `[duck][vx]amix=inputs=2:normalize=0:dropout_transition=0,volume=4dB,alimiter=limit=0.89:attack=5:release=60:level=false[aout]`,
  ].join(';\n');
} else {
  mix = `${voices},volume=3dB,alimiter=limit=0.89:attack=5:release=60:level=false[aout]`;
}

const filter = [...parts, ...aparts, mix].join(';\n');
const fscript = path.join(WORK, 'filter.txt');
fs.writeFileSync(fscript, filter);
const args = ['-y', ...inputs, '-/filter_complex', fscript, '-map', '[vout]', '-map', '[aout]', '-t', f3(TOTAL),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT];
console.log(`composing ${OUT} (${TOTAL.toFixed(1)}s)${INTRO ? '' : ' [opener slate]'}${OUTRO ? '' : ' [closer slate]'}`);
try {
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'inherit', 'pipe'] });
} catch (e) {
  console.error('ffmpeg failed:\n' + (e.stderr ? e.stderr.toString().slice(-3000) : e.message));
  process.exit(1);
}

// ── Scene timestamps (Devpost text + YouTube chapters) ──────────────────────
const at = (t) => ofsScreen + mapT(t);
const rows = [
  ['cold', 0, 'cold open: the praline line, struck'],
  ['opener', ofsIntro, `Dorien on camera${INTRO ? '' : ' (slate)'}`],
  ['stats', at(m.stats), 'stat band (76/40/0)'],
  ['copy', at(m.copybench), 'workbench: copy + markets'],
  ['click', at(m.run_click), 'Transcreate click (live run starts)'],
  ['notebook', at(m.run_start), 'tasting notebook: Qloo tool stream'],
  ['verdict', at(m.verdict), 'verdict cards + taste facts'],
  ['brussels', at(m.brussels), 'saved run: Brussels drops the praline'],
  ['willemstad', at(m.dutch_nav), 'saved run: Willemstad, no data, says so'],
  ['closer', ofsOutro, `Dorien on camera${OUTRO ? '' : ' (slate)'}`],
  ['end', ofsEnd, 'end card'],
];
fs.writeFileSync(path.join(WORK, 'scenes.json'), JSON.stringify({ total: TOTAL, slates: { opener: !INTRO, closer: !OUTRO }, scenes: rows.map(([key, t, label]) => ({ key, t: +t.toFixed(2), label })) }, null, 2));
console.log('\nScene timestamps:');
rows.forEach(([, t, label]) => console.log(`  ${stamp(t)}  ${label}`));
console.log(`  total ${stamp(TOTAL)} (${TOTAL.toFixed(1)}s)`);
