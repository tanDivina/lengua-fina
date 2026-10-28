# Lengua Fina: promo script (v3)

About 2:00 to 2:10 once the real clips are in. Flow: cold open, Dorien on
camera, the live demo in Dorien's cloned garden voice, two saved-run beats,
Dorien on camera, end card. Missing clips render as a slate with their script,
so the cut and the timestamps are already close to final.

## The two on-camera clips (Dorien films these)

Film horizontal (phone sideways), 1080p or 4K, eye level, bright open shade,
cacao or garden behind you. Hold a truffle (or an open cacao pod), never a bar:
on camera you only claim what you make. Look into the lens, leave two seconds
of silence before and after, and do two or three takes. Say it your way.

**Opener, about 17 s** → `~/Desktop/LenguaFina_Video/personal/p1_open.mp4`

> This cacao grows right here, on my island in Bocas del Toro.
> I turn it into truffles: unrefined, one hundred percent cacao.
> When I sell chocolate abroad, the hard part isn't the language.
> It's lines like this one: "Smooth as a Brussels praline. Perfect with your Sunday café au lait."
> I'm Belgian. I thought that kind of line was safe.
> In Tokyo, it means nothing. And in Brussels… it's actually worse.

**Closer, about 8 s** → `~/Desktop/LenguaFina_Video/personal/p2_close.mp4`

> I'm Dorien. I'm a translator, and I built Lengua Fina so my copy
> doesn't just speak the language. It tastes local.

Raw phone takes can go anywhere (e.g. `~/Desktop/Personal_Clips_<date>/`);
say which take, and it gets transcribed, trimmed and placed.

## What the viewer sees and hears

| beat | on screen | voice |
|---|---|---|
| cold open, 3.6 s | tamandua, "Smooth as a Brussels praline." struck through, DROPPED in the markets that really dropped it in the recorded run | chime |
| opener | Dorien + name card | Dorien |
| stats | stat band, CSA source caption | n_stats |
| copy | workbench: demo bar copy, Tokyo / Brussels / Austin | n_copy |
| click | Transcreate, live run, "Sped up · real run time" badge | n_run, n_log |
| verdict | the three live cards with taste facts | n_verdict |
| Brussels | saved run Oct 25: "a contest with local chocolate" | n_brussels |
| Willemstad | click "Dutch, three ways", saved run: no Qloo data | n_honest |
| closer | Dorien | Dorien |
| end card | tamandua, links | n_outro |

The Brussels and Willemstad beats use the saved runs because live runs word
their reasoning differently each time; the narration quotes the saved runs,
and the captions say so. The cold open reads the recorded live run.

Voice: `narration.json` (Dorien's "phone, garden, no denoise" clone with the
Rooted settings). No em dashes anywhere.

## Assembly

```bash
cd ~/Projects/lengua-fina
node scripts/promo/generate_narration.js                 # FORCE=1 for all, or: "" n_x,n_y
node scripts/promo/make_overlays.js
npm run build && PORT=3005 npm run start                 # terminal 1: production build, not dev
APP_URL=http://localhost:3005 node scripts/promo/record_promo.js
node scripts/promo/make_overlays.js                      # again: renders the run-time badge
node scripts/promo/make_cold.js
node scripts/promo/compose_promo.js                      # picks up personal/p1_open + p2_close
node scripts/promo/publish_text.js                       # docs/devpost-story.md + Desktop youtube.md
```

Clips only (no narration change): just `compose_promo.js` and `publish_text.js`.
