# Lengua Fina — promo v2 script (Dorien on camera + cloned voice-over)

Target length ~95 seconds. Two clips are recorded by Dorien on camera; the rest
is the cloned voice over the real screen recording. Target timestamps below are
planning values — the composer prints the real ones, which then go into the
Devpost text.

## The two on-camera clips (record these)

Film horizontal (phone sideways), 1080p or 4K, eye level, bright open shade
(no hard sun), garden or cacao trees behind you. Hold the bar so the wrapper
is readable. Look into the lens. Leave ~2 seconds of silence before and after
each take. Two or three takes each; keep the one that feels thrown-away casual.

**CLIP 1 — the opener (~14 s) → save as `intro.mov` (or .mp4)**

> This chocolate grows right here, on my island in Bocas del Toro.
> And this is the sentence I wrote to sell it:
> "Smooth as a Brussels praline. Break off a square with your Sunday café au lait."
> In Brussels, that sentence sells chocolate. In Tokyo… it sells nothing.

(Alternative last beat, pick whichever feels better out loud:
"Perfect for Brussels. Invisible in Tokyo.")

**CLIP 2 — the closer (~8 s) → save as `outro.mov` (or .mp4)**

> I'm Dorien. I'm a translator — and I built Lengua Fina so my copy
> doesn't just speak the language. It tastes local.

Optional B-roll (nice to have, 10 s): snapping a square off the bar, close up.

Drop both files in `~/Desktop/LenguaFina_Video/` and say "assemble".

## Voice-over lines (cloned voice — generated, no recording needed)

Pick the clone first: listen to the three files in
`~/Desktop/LenguaFina_Video/voice_picker/` and say which one
(phone_plus_vlog / vlog_cleaned / phone_garden).

| cue | plays over | line |
|---|---|---|
| n_stats | stat band | Seventy-six percent of shoppers prefer to buy in their own language. Translation fixes the words. It doesn't fix the references. |
| n_copy | workbench | So here's my real copy, with its very European hooks — and three rooms to win: Tokyo, Brussels, and Austin. |
| n_run | Transcreate click | One click. The agent asks Qloo what each room actually loves — artists, films, books, brands, places — filtered by city and age. |
| n_log | live tasting notebook | This is a live run, not a mockup. Every reference gets tested against Qloo's taste data, and every replacement must come from what Qloo returned in this very run. The agent cannot invent a reference. Grounded, or rejected. |
| n_verdict | verdict cards | The verdict: three rewrites, each with its taste facts — the exact Qloo entities, and their affinity scores, behind every swap. |
| n_brussels | Brussels card "Dropped" | Brussels even dropped my own praline line. Comparing my bar to the city's praline starts a contest with local chocolate — a fight no translation tool would have seen. |
| n_honest | Willemstad demo card | And when Qloo has no data — Port wine, or a Willemstad audience — my agent says so. Flagged, never faked. |
| n_outro | end card | Lengua Fina. Every reference, traceable to Qloo. Built for the Qloo Agentic Hackathon. |

## Shape of the final cut (target timestamps)

| target | scene | voice | judging criterion it carries |
|---|---|---|---|
| 0:00 | ON CAMERA opener, the bar, the sentence | Dorien live | impact: real seller, real product |
| 0:14 | hero + stat band (76 / 40 / 0) | clone | impact: measured problem |
| 0:24 | workbench: copy + three markets | clone | design: complete product |
| 0:36 | Transcreate → live tool stream | clone | tech: real Qloo calls, grounding rule |
| 0:52 | verdict cards + taste facts | clone | tech+design: affinities on screen |
| 1:05 | Brussels drops its own praline | clone | idea: non-obvious, taste-driven |
| 1:13 | Willemstad: no data → says so | clone | tech: honest failure mode |
| 1:22 | ON CAMERA closer | Dorien live | memorable bookend |
| 1:30 | end card | clone | links |

## Assembly (after the clips exist)

```bash
cd ~/Projects/lengua-fina
LF_VOICE_ID=<chosen clone id> FORCE=1 node scripts/promo/generate_narration.js
node scripts/promo/make_overlays.js
# terminal 1: npm run dev   (watch the port! 3000 may be taken → use APP_URL)
APP_URL=http://localhost:3001 node scripts/promo/record_promo.js
INTRO=~/Desktop/LenguaFina_Video/intro.mov OUTRO=~/Desktop/LenguaFina_Video/outro.mov \
  node scripts/promo/compose_promo.js
```

The composer prints the final scene timestamps; put those into the Devpost
story (e.g. "at 0:52 in the video, every reference carries its Qloo affinity").
