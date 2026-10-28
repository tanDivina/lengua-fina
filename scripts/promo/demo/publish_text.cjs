#!/usr/bin/env node
// Fills the demo video's timestamps into the submission texts. Re-run after
// every compose (times move when clips or narration change):
//   docs/devpost-story.template.md -> docs/devpost-story.md   ({{t:key}}, {{runtime}})
//   ~/Desktop/LenguaFina_Video/<video name>_youtube.md        (title, description, chapters)
// Usage: node publish_text.cjs [workdir]
const fs = require('fs');
const path = require('path');

const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'demo_work');
const ROOT = path.join(__dirname, '..', '..', '..');
const sc = JSON.parse(fs.readFileSync(path.join(WORK, 'scenes.json'), 'utf8'));
const tl = JSON.parse(fs.readFileSync(path.join(WORK, 'run', 'timeline.json'), 'utf8'));
const stamp = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const seg = Object.fromEntries(sc.scenes.map((s) => [s.key, s.t]));
const T = { ...seg, copy: seg.run, ...sc.moments };
const runSecs = Math.round(tl.marks.run_end - tl.marks.click);
const runtime = runSecs >= 60 ? `${Math.floor(runSecs / 60)} min ${runSecs % 60} s` : `${runSecs} s`;

const fill = (text) => text
  .replace(/\{\{t:(\w+)\}\}/g, (_, k) => { if (T[k] == null) throw new Error(`unknown key ${k}`); return stamp(T[k]); })
  .replace(/\{\{runtime\}\}/g, runtime);
const story = fill(fs.readFileSync(path.join(ROOT, 'docs', 'devpost-story.template.md'), 'utf8'));
fs.writeFileSync(path.join(ROOT, 'docs', 'devpost-story.md'), story);

// Chapters: first at 0:00, at least 3, each at least 10 s (short ones merge into the previous).
const wanted = [
  ['cold', 'The praline problem'],
  ['hero', 'Meet Lengua Fina'],
  ['run', 'Live run against Qloo'],
  ['brussels', 'Brussels drops its own praline (saved run)'],
  ['arch', 'Under the hood: one agent, five tools, one rule'],
  ['numbers', 'Measured: does taste differ by market?'],
  ['scale', 'One language, three rooms, and Willemstad'],
  ['closer', 'Why I built it'],
];
const chapters = [];
for (const [key, title] of wanted) {
  if (seg[key] == null) continue;
  const prev = chapters[chapters.length - 1];
  if (prev && seg[key] - prev.t < 10) continue;
  chapters.push({ t: seg[key], title });
}
if (sc.total - chapters[chapters.length - 1].t < 10) chapters.pop();

const yt = `# YouTube: ${path.basename(sc.out)}

## Title

Lengua Fina: copy that tastes local, grounded in Qloo taste data (Qloo Agentic Hackathon)

## Description

"Smooth as a Brussels praline" sounds like a safe line. Tokyo doesn't read it, and Brussels pushes back.
Lengua Fina is an AI transcreation agent: it asks Qloo what each audience actually loves, drops the references that won't land, and rewrites around the ones that will. Product facts stay as written; only the hooks change.

Everything in the demo is real: a live agent run against the Qloo API on ${tl.ranOn} (real run time ${runtime}, sped up on screen), and two unedited saved runs from Oct 25, 2026, marked as saved runs on screen. The agent can only cite references whose Qloo entity id came back during its own run.

Try it: https://lengua-fina.vercel.app
Code (MIT): https://github.com/tanDivina/lengua-fina

Built with: Qloo Taste AI API (/search, /v2/tags, /v2/insights), Claude Opus 5.5 on the Anthropic SDK tool runner, Next.js, TypeScript, Tailwind CSS, Vercel.

Measured before building: for 30–44-year-olds in Tokyo, Brussels and Austin, Qloo's top-20 artists overlap 0–5% between any two markets and its top-20 brands 0%. Books overlap 33–48%, so the agent leans on the entity types that diverge.
Benchmark: 76% of online shoppers prefer to buy products with information in their own language, and 40% never buy from websites in other languages. Source: CSA Research, "Can't Read, Won't Buy" (8,709 consumers, 29 countries), https://csa-research.com/Blogs-Events/CSA-in-the-Media/Press-Releases/Consumers-Prefer-their-Own-Language

${chapters.map((c) => `${stamp(c.t)} ${c.title}`).join('\n')}

Made by Dorien Van den Abbeele (Divina Endeavors LLC / Hero Apps) in Bocas del Toro, Panama, for the Qloo Agentic Hackathon 2026. Music: Finca Montezuma.

#QlooHackathon #AIagents #localization #transcreation #Qloo
`;
const ytFile = path.join(path.dirname(sc.out), `${path.basename(sc.out, '.mp4')}_youtube.md`);
fs.writeFileSync(ytFile, yt);

for (const [name, text] of [['devpost-story.md', story], [path.basename(ytFile), yt]]) {
  if (text.includes('—')) console.warn(`⚠ em dash in ${name}`);
}
const slates = Object.entries(sc.slates || {}).filter(([, v]) => v).map(([k]) => k);
console.log(`✓ docs/devpost-story.md and ${ytFile}`);
console.log(`  video ${stamp(sc.total)}, run time ${runtime}, chapters: ${chapters.map((c) => `${stamp(c.t)} ${c.title}`).join(' | ')}`);
if (slates.length) console.log(`  ⚠ provisional: ${slates.join(' + ')} still a slate; re-run compose + this after the real clips are in`);
