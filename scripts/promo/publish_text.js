#!/usr/bin/env node
// Fills the video timestamps into the submission texts. Run after every
// compose (timestamps move when clips or narration change):
//   docs/devpost-story.template.md -> docs/devpost-story.md   ({{t:key}}, {{runtime}})
//   ~/Desktop/LenguaFina_Video/youtube.md                     (title, description, chapters)
// Usage: node publish_text.js [workdir]
const fs = require('fs');
const path = require('path');

const WORK = process.argv[2] || path.join(process.env.HOME, 'Desktop', 'LenguaFina_Video', 'promo_work');
const ROOT = path.join(__dirname, '..', '..');
const sc = JSON.parse(fs.readFileSync(path.join(WORK, 'scenes.json'), 'utf8'));
const tl = JSON.parse(fs.readFileSync(path.join(WORK, 'timeline.json'), 'utf8'));
const stamp = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const T = Object.fromEntries(sc.scenes.map((s) => [s.key, s.t]));
const runSecs = Math.round(tl.marks.run_end - tl.marks.run_click);
const runtime = `${Math.floor(runSecs / 60)} min ${runSecs % 60} s`;

const fill = (text) => text
  .replace(/\{\{t:(\w+)\}\}/g, (_, k) => {
    if (T[k] == null) throw new Error(`unknown scene key ${k}`);
    return stamp(T[k]);
  })
  .replace(/\{\{runtime\}\}/g, runtime);

const story = fill(fs.readFileSync(path.join(ROOT, 'docs', 'devpost-story.template.md'), 'utf8'));
fs.writeFileSync(path.join(ROOT, 'docs', 'devpost-story.md'), story);

// Chapters: first at 0:00, each at least 10 s (short ones merge into the previous).
const wanted = [
  ['cold', 'The praline problem'],
  ['stats', 'Translation fixes the words, not the references'],
  ['click', 'Live run: the agent asks Qloo'],
  ['verdict', 'The verdict, with taste facts'],
  ['brussels', 'Brussels drops its own praline (saved run)'],
  ['willemstad', 'Willemstad: no Qloo data, nothing invented (saved run)'],
  ['closer', 'Why I built it'],
];
const chapters = [];
for (const [key, title] of wanted) {
  const t = T[key];
  const prev = chapters[chapters.length - 1];
  if (prev && t - prev.t < 10) continue;
  chapters.push({ t, title });
}
const last = chapters[chapters.length - 1];
if (sc.total - last.t < 10) chapters.pop();

const yt = `# YouTube: Lengua Fina

## Title

Lengua Fina: copy that tastes local, grounded in Qloo taste data (Qloo Agentic Hackathon)

## Description

"Smooth as a Brussels praline" sounds like a safe line. Tokyo doesn't read it, and Brussels pushes back.
Lengua Fina is an AI transcreation agent: it asks Qloo what each audience actually loves, drops the references that won't land, and rewrites around the ones that will. Product facts stay as written; only the hooks change.

Everything in the demo is real: a live agent run against the Qloo API on ${tl.ranOn} (real run time ${runtime}, sped up on screen), and two unedited saved runs from Oct 25, 2026, marked as saved runs on screen. The agent can only cite references whose Qloo entity id came back during its own run.

Try it: https://lengua-fina.vercel.app
Code (MIT): https://github.com/tanDivina/lengua-fina

Built with: Qloo Taste AI API (/search, /v2/tags, /v2/insights), Claude (Anthropic SDK tool runner), Next.js, TypeScript, Tailwind CSS, Vercel.

Measured before building: for 30–44-year-olds in Tokyo, Brussels and Austin, Qloo's top-20 artists overlap 0–5% between any two markets and its top-20 brands 0%. Books overlap 33–48%, so the agent leans on the entity types that diverge.
Benchmark: 76% of online shoppers prefer to buy products with information in their own language, and 40% never buy from websites in other languages. Source: CSA Research, "Can't Read, Won't Buy" (8,709 consumers, 29 countries), https://csa-research.com/Blogs-Events/CSA-in-the-Media/Press-Releases/Consumers-Prefer-their-Own-Language

${chapters.map((c) => `${stamp(c.t)} ${c.title}`).join('\n')}

Made by Dorien Van den Abbeele (Divina Endeavors LLC / Hero Apps) in Bocas del Toro, Panama, for the Qloo Agentic Hackathon 2026.

#QlooHackathon #AIagents #localization #transcreation #Qloo
`;
const ytFile = path.join(path.dirname(WORK), 'youtube.md');
fs.writeFileSync(ytFile, yt);

for (const [name, text] of [['devpost-story.md', story], ['youtube.md', yt]]) {
  if (text.includes('—')) console.warn(`⚠ em dash in ${name}`);
}
const slates = Object.entries(sc.slates || {}).filter(([, v]) => v).map(([k]) => k);
console.log(`✓ docs/devpost-story.md and ${ytFile}`);
console.log(`  video ${stamp(sc.total)}, run time ${runtime}, chapters: ${chapters.map((c) => stamp(c.t)).join(' ')}`);
if (slates.length) console.log(`  ⚠ provisional: ${slates.join(' + ')} still a slate, re-run after the real clips are in`);
