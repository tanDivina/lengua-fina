# Lengua Fina demo video (hackathon-video skill pipeline)

Built from the `hackathon-video` skill templates. Media lives in
`~/Desktop/LenguaFina_Video/`: `demo_work/` (regenerable), `personal/`
(Dorien's clips), output `lengua_fina_demo.mp4`. The composer never
overwrites an existing video; it writes `_2`, `_3`, ... instead.

Structure (about 2:55): cold open → `p1_open` (Dorien) → hero → benchmark →
live run (copy, click, sped-up Qloo tool stream with real run time, verdict)
→ saved-run Brussels → architecture → measured numbers → "one language, three
rooms" + Willemstad → `p2_story` (Dorien) → close. Missing clips render as
slates with their script (see `compose.cjs` for both scripts).

```bash
cd ~/Projects/lengua-fina && npm run build && PORT=3005 npm run start   # terminal 1
cd scripts/promo/demo
node generate_narration.cjs                     # garden clone; "" n_x,n_y for single lines
SITE_URL=http://localhost:3005 node record_site.cjs
SITE_URL=http://localhost:3005 node record_run.cjs    # one real agent run
node record_intro.cjs                           # cold open, arch, numbers, overlays, captions
node compose.cjs
node publish_text.cjs                           # docs/devpost-story.md + <video>_youtube.md
```

After Dorien's clips land in `personal/` (p1_open, p2_story): optional
`personal/overlay_times.json` with word times from whisper, then
`node record_intro.cjs "" overlay,overlay2 && node compose.cjs && node publish_text.cjs`.

Thumbnail: see the render line at the top of `thumbnail.html`.
