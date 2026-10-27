#!/usr/bin/env node
// Composes the final 1920x1080 promo:
//   [on-camera intro] -> screen recording (agent-run wait compressed, caption
//   pills at remapped marks) -> [on-camera closer] -> end card with the outro
//   voice line. Mixes level-matched narration stems with optional ducked music.
// The on-camera clips are optional (env INTRO / OUTRO); without them it
// behaves like v1. Prints the final scene timestamps for the Devpost text.
// Usage: [INTRO=intro.mov] [OUTRO=outro.mov] node compose_promo.js [workdir] [out.mp4] [music.mp3]
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const FFPROBE = '/opt/homebrew/bin/ffprobe';
const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'promo_work');
const OUT = process.argv[3] || path.join(path.dirname(WORK), 'lengua_fina_promo.mp4');
const MUSIC = process.argv[4] || process.env.MUSIC || null;
const INTRO = process.env.INTRO && fs.existsSync(process.env.INTRO) ? process.env.INTRO : null;
const OUTRO = process.env.OUTRO && fs.existsSync(process.env.OUTRO) ? process.env.OUTRO : null;

const tl = JSON.parse(fs.readFileSync(path.join(WORK, 'timeline.json')));
const m = tl.marks;
const RAW = path.join(WORK, 'raw_screen.mp4');
const probe = (f, args) => execFileSync(FFPROBE, ['-v', 'error', ...args, f]).toString().trim();
const durOf = (f) => parseFloat(probe(f, ['-show_entries', 'format=duration', '-of', 'csv=p=0']));
const hasAudio = (f) => probe(f, ['-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0']) !== '';
const T = durOf(RAW);
const f3 = (n) => n.toFixed(3);
const stamp = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ── Retiming: compress the agent-run wait ──────────────────────────────────
const nLog = tl.audio.find((c) => c.name === 'n_log');
const a = Math.min(m.run_start + 1.2, m.run_end);
const b = Math.max(a, m.run_end - 0.5);
let f = 1;
if (b - a > 2) {
  const cueT = nLog ? nLog.t : a;
  const voiceNeeds = nLog && fs.existsSync(nLog.file) ? cueT + durOf(nLog.file) + 0.7 - a : 3;
  const target = Math.min(b - a, Math.max(3, voiceNeeds));
  f = target / (b - a);
}
const mapT = (t) => (t <= a ? t : t < b ? a + (t - a) * f : t - (b - a) * (1 - f));
const MT = mapT(T);
console.log(`run span ${f3(a)}–${f3(b)} compressed x${(1 / f).toFixed(2)} → screen part ${f3(MT)}s (raw ${f3(T)}s)`);

// ── Segment offsets ─────────────────────────────────────────────────────────
const XF = 0.5;
const I = INTRO ? durOf(INTRO) : 0;
const O = OUTRO ? durOf(OUTRO) : 0;
const ofsScreen = INTRO ? I - XF : 0;
const ofsOutro = OUTRO ? ofsScreen + MT - XF : null;
const ofsEnd = OUTRO ? ofsOutro + O - XF : ofsScreen + MT - XF;

// End card: long enough for the outro voice line (spoken over the card).
const outroVoice = path.join(WORK, 'audio', 'n_outro.mp3');
let END_CARD = 3.6;
if (fs.existsSync(outroVoice)) END_CARD = Math.max(END_CARD, 0.4 + durOf(outroVoice) + 1.2);
const TOTAL = ofsEnd + END_CARD;

// ── Captions (overlaid on the screen part only) ─────────────────────────────
const spans = [];
const add = (name, s, e) => {
  if (s == null || e == null) return;
  const S = mapT(s), E = Math.max(mapT(e), mapT(s) + 0.8);
  const file = path.join(WORK, 'captions', `${name}.png`);
  if (fs.existsSync(file)) spans.push({ name, file, s: S, e: Math.min(E, MT - 0.2) });
};
add('c_stats', m.stats, m.copybench - 0.2);
add('c_copy', m.copybench, m.run_click - 0.2);
add('c_run', m.run_click, m.run_start + 0.9);
add('c_log', m.run_start + 1.1, m.run_end + 1.2);
add('c_verdict', m.verdict + 0.2, m.brussels - 0.2);
if (tl.audio.some((c) => c.name === 'n_brussels')) add('c_brussels', m.brussels, m.dutch_nav - 0.2);
add('c_honest', m.honest, m.outro - 0.1);

// ── Inputs ──────────────────────────────────────────────────────────────────
const inputs = ['-i', RAW, '-i', path.join(WORK, 'endcard.png')];
spans.forEach((c) => inputs.push('-i', c.file));
const CAP0 = 2;
const clips = tl.audio.filter((c) => fs.existsSync(c.file));
const AUD0 = CAP0 + spans.length;
clips.forEach((c) => inputs.push('-i', c.file));
let idx = AUD0 + clips.length;
let OUTRO_VOICE = -1;
if (fs.existsSync(outroVoice)) { OUTRO_VOICE = idx++; inputs.push('-i', outroVoice); }
let INTRO_IN = -1, OUTRO_IN = -1, MUS = -1;
if (INTRO) { INTRO_IN = idx++; inputs.push('-i', INTRO); }
if (OUTRO) { OUTRO_IN = idx++; inputs.push('-i', OUTRO); }
if (MUSIC && fs.existsSync(MUSIC)) { MUS = idx++; inputs.push('-i', MUSIC); }

// ── Video graph ─────────────────────────────────────────────────────────────
const parts = [];
if (f < 1) {
  parts.push(
    `[0:v]trim=0:${f3(a)},setpts=PTS-STARTPTS[s0]`,
    `[0:v]trim=${f3(a)}:${f3(b)},setpts=(PTS-STARTPTS)*${f.toFixed(5)}[s1]`,
    `[0:v]trim=${f3(b)},setpts=PTS-STARTPTS[s2]`,
    `[s0][s1][s2]concat=n=3:v=1,fps=30[vt]`
  );
} else {
  parts.push(`[0:v]fps=30[vt]`);
}
let cur = 'vt';
spans.forEach((c, i) => {
  const d = c.e - c.s;
  parts.push(
    `[${CAP0 + i}:v]format=rgba,loop=-1:size=1:start=0,trim=0:${f3(d)},setpts=PTS-STARTPTS,` +
      `fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=${f3(Math.max(0, d - 0.3))}:d=0.3:alpha=1,setpts=PTS+${f3(c.s)}/TB[c${i}]`,
    `[${cur}][c${i}]overlay=0:0:eof_action=pass[v${i}]`
  );
  cur = `v${i}`;
});
parts.push(`[${cur}]format=yuv420p,setsar=1[main]`);
const prepClip = (inIdx, label) =>
  `[${inIdx}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,setsar=1[${label}]`;
let chain = 'main';
if (INTRO) {
  parts.push(prepClip(INTRO_IN, 'iv'));
  parts.push(`[iv][main]xfade=transition=fade:duration=${XF}:offset=${f3(I - XF)}[x1]`);
  chain = 'x1';
}
if (OUTRO) {
  parts.push(prepClip(OUTRO_IN, 'ov'));
  parts.push(`[${chain}][ov]xfade=transition=fade:duration=${XF}:offset=${f3(ofsOutro)}[x2]`);
  chain = 'x2';
}
parts.push(`[1:v]loop=-1:size=1:start=0,trim=duration=${f3(END_CARD + XF)},setpts=PTS-STARTPTS,fps=30,format=yuv420p,setsar=1[ec]`);
parts.push(`[${chain}][ec]xfade=transition=fade:duration=${XF}:offset=${f3(ofsEnd)}[vout]`);

// ── Audio graph ─────────────────────────────────────────────────────────────
const VOICE_TARGET = -20;
const gainOf = (file) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const mm = /mean_volume:\s*(-?[\d.]+)/.exec(r.stderr || '');
  return VOICE_TARGET - (mm ? parseFloat(mm[1]) : VOICE_TARGET);
};
const aparts = [];
const mixIns = [];
clips.forEach((c, i) => {
  const d = Math.round((ofsScreen + mapT(c.t)) * 1000);
  const g = gainOf(c.file);
  console.log(`  stem ${c.name}: ${g >= 0 ? '+' : ''}${g.toFixed(1)} dB @ ${(d / 1000).toFixed(2)}s`);
  aparts.push(`[${AUD0 + i}:a]volume=${g.toFixed(2)}dB,adelay=${d}|${d},aformat=sample_rates=44100:channel_layouts=stereo[a${i}]`);
  mixIns.push(`[a${i}]`);
});
if (OUTRO_VOICE >= 0) {
  const d = Math.round((ofsEnd + 0.4) * 1000);
  const g = gainOf(outroVoice);
  console.log(`  stem n_outro: ${g >= 0 ? '+' : ''}${g.toFixed(1)} dB @ ${(d / 1000).toFixed(2)}s`);
  aparts.push(`[${OUTRO_VOICE}:a]volume=${g.toFixed(2)}dB,adelay=${d}|${d},aformat=sample_rates=44100:channel_layouts=stereo[aov]`);
  mixIns.push('[aov]');
}
const clipAudio = (inIdx, file, delaySec, len, label) => {
  const g = gainOf(file);
  const d = Math.round(delaySec * 1000);
  console.log(`  clip audio ${label}: ${g >= 0 ? '+' : ''}${g.toFixed(1)} dB @ ${delaySec.toFixed(2)}s`);
  aparts.push(`[${inIdx}:a]volume=${g.toFixed(2)}dB,afade=t=out:st=${f3(Math.max(0, len - 0.5))}:d=0.5,adelay=${d}|${d},aformat=sample_rates=44100:channel_layouts=stereo[${label}]`);
  mixIns.push(`[${label}]`);
};
if (INTRO && hasAudio(INTRO)) clipAudio(INTRO_IN, INTRO, 0, I, 'ain');
if (OUTRO && hasAudio(OUTRO)) clipAudio(OUTRO_IN, OUTRO, ofsOutro, O, 'aout_clip');

let mix;
if (mixIns.length) {
  const voices = `${mixIns.join('')}amix=inputs=${mixIns.length}:normalize=0:dropout_transition=0,apad=whole_dur=${f3(TOTAL)}`;
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
} else {
  mix = `anullsrc=r=44100:cl=stereo,atrim=0:${f3(TOTAL)}[aout]`;
}

const filter = [...parts, ...aparts, mix].join(';\n');
const fscript = path.join(WORK, 'filter.txt');
fs.writeFileSync(fscript, filter);
const args = ['-y', ...inputs, '-filter_complex_script', fscript, '-map', '[vout]', '-map', '[aout]', '-t', f3(TOTAL),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT];
console.log(`composing ${OUT} (${TOTAL.toFixed(1)}s)`);
execFileSync(FFMPEG, args, { stdio: ['ignore', 'inherit', 'pipe'] });

// ── Final timestamps for the Devpost text ───────────────────────────────────
const at = (t) => ofsScreen + mapT(t);
console.log('\nFinal scene timestamps:');
if (INTRO) console.log(`  0:00  on-camera opener`);
const rows = [
  ['stat band (76/40/0)', m.stats],
  ['workbench: copy + markets', m.copybench],
  ['Transcreate click (live run starts)', m.run_click],
  ['tasting notebook: Qloo tool stream', m.run_start],
  ['verdict cards + taste facts', m.verdict],
  ['Brussels drops its own praline', m.brussels],
  ['Willemstad: no data, says so', m.honest],
];
rows.forEach(([label, t]) => { if (t != null) console.log(`  ${stamp(at(t))}  ${label}`); });
if (OUTRO) console.log(`  ${stamp(ofsOutro)}  on-camera closer`);
console.log(`  ${stamp(ofsEnd)}  end card (outro voice line)`);
console.log('done');
