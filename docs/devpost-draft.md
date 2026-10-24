# Devpost draft: Lengua Fina

> Draft. Lines in [brackets] need real results from a run with the Qloo key. Don't publish numbers or examples we haven't seen.

**Tagline:** Translation keeps the words. Lengua Fina keeps the meaning, using what each audience actually loves.

## Inspiration

I'm a Belgian translator living on an island in Bocas del Toro, Panama, where I grow cacao and make chocolate. When I write about my chocolate for buyers abroad, the hard part is never the grammar. It's the references. "Smooth as a Brussels praline" means something in Brussels and very little in Tokyo. Translation tools carry the words across and leave the meaning behind, and an LLM on its own guesses at what another culture likes.

In Spanish, *lengua* means both language and tongue: the thing you speak with and the thing you taste with. That's the problem in one word.

## What it does

You paste your product copy and pick up to three markets (city, age group, language). Lengua Fina:

1. Asks Qloo which artists, films, books, brands and places each audience has affinity for, optionally narrowed by a product signal such as a chocolate tag.
2. Checks the references in your original copy against each audience and flags the ones that won't land.
3. Rewrites the copy per market. Product facts stay the same; the hooks change. Each new reference comes with its Qloo source and affinity.

[Example from a real run: one flagged reference and one replacement, per market.]

## How we built it

- An agent on Claude Opus 5.5 (Anthropic SDK tool runner) with five tools over the Qloo hackathon API: `/search`, `/v2/tags` and `/v2/insights` (location + age signals, interest tags).
- **Grounding by construction:** the agent's final answer goes through a check that rejects any reference whose Qloo entity id wasn't returned during that run. If it tries to slip one in, it gets sent back to fix it. You can't get a made-up reference out of Lengua Fina.
- A validation script that compares Qloo's taste profiles across markets with no LLM involved, which we used to confirm the idea before building on it. [Overlap results.]
- Next.js on Vercel, streaming the agent's steps to the page so you can watch it work.

## Challenges

[Fill in from the build: e.g. Qloo response shapes, locality matching, keeping the agent from over-stuffing references.]

## What we're proud of

- Every reference is traceable to Qloo data.
- It's built for a real job I do, with a product I make.

## What's next

- Full product pages and email campaigns, not just short copy.
- A translator mode: show the original, the literal translation and the transcreation side by side for client review.
- More product signals beyond food and drink (crafts, cosmetics, tourism).

## Built with

Qloo Taste AI API, Claude (Anthropic API), Next.js, TypeScript, Tailwind CSS, Vercel.
