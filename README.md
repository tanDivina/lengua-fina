# Lengua Fina

A transcreation agent for translators and small producers who sell abroad.

Translation keeps the words and loses the references. "Smooth as a Brussels praline" works in Brussels and means little in Tokyo. Lengua Fina rewrites product copy for each target market using cultural references that audience actually has affinity for, according to [Qloo](https://qloo.com)'s taste graph, and flags the source copy's references that won't land.

In Spanish, *lengua* means both language and tongue: the thing you speak with and the thing you taste with.

## How it works

An agent (Claude Opus 5.5, via the Anthropic SDK tool runner) gets the copy, the product and up to three markets (city, age ranges, language). It has five tools:

| Tool | Qloo endpoint | Purpose |
|---|---|---|
| `find_entity` | `/search` | Resolve references in the source copy to Qloo entities |
| `find_tags` | `/v2/tags` | Find product tags (e.g. chocolate) to narrow an audience |
| `market_taste` | `/v2/insights` | What an audience (city + ages + interests) has affinity for, per entity type |
| `check_reference` | `/v2/insights` | Whether a given reference ranks in the top 100 for an audience |
| `submit_localization` | – | Final copy per market, with references cited by Qloo entity id |

**Grounding check:** `submit_localization` rejects any reference whose entity id was not returned by a Qloo tool during that run, and sends the agent back to fix it. Every reference shown in the UI links back to real Qloo data.

## Run locally

```bash
cp .env.example .env.local   # add QLOO_API_KEY and ANTHROPIC_API_KEY
npm install
npm run validate             # checks that Qloo returns different taste profiles per market
npm run dev
```

`npm run validate -- Tokyo Brussels "Mexico City"` compares any markets you like. Raw Qloo responses go to `scripts/out/`, which is gitignored: Qloo data must not be committed.

## Stack

Next.js 15, TypeScript, Tailwind, `@anthropic-ai/sdk`, Zod. Deployed on Vercel.

## License

MIT
