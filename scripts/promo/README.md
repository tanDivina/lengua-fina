# Lengua Fina promo pipeline

Records the real app doing one live run (Qloo + Claude) and produces a
1920x1080 promo with narration. Adapted from the D'accord promo pipeline.

v2 opens and closes with Dorien on camera and uses Dorien's cloned voice for
the voice-over — lines, filming notes and assembly steps in `SCRIPT.md`.
On-camera clips are passed as `INTRO=... OUTRO=...` to `compose_promo.js`;
the composer prints the final scene timestamps for the Devpost text.

## One-time setup

Keys: `QLOO_API_KEY` + `ANTHROPIC_API_KEY` in `lengua-fina/.env.local`
(already there). `ELEVENLABS_API_KEY` is read from the env, this repo's
`.env.local`, or `~/Projects/daccord/.env.local`.

## Produce the video

```bash
cd ~/Projects/lengua-fina && npm run dev      # terminal 1 (reads .env.local)
node scripts/promo/generate_narration.js      # once; FORCE=1 to regenerate
node scripts/promo/make_overlays.js           # end card + caption pills
node scripts/promo/record_promo.js            # one real agent run, ~3–4 min
node scripts/promo/compose_promo.js           # writes ~/Desktop/LenguaFina_Video/lengua_fina_promo.mp4
```

Music is optional: `node scripts/promo/compose_promo.js "" "" /path/to/track.mp3`.

Env overrides: `APP_URL`, `LF_VOICE_ID`, `LF_TTS_MODEL`.

The composer compresses the live agent-run wait (never shorter than the
narrator's grounding line) and extends the end card so the outro finishes.
