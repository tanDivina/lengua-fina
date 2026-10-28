# Devpost draft: Lengua Fina

> Superseded: the live story is `devpost-story.template.md`, rendered with video timestamps into `devpost-story.md` by `scripts/promo/publish_text.js`.

> Everything below is from real runs — no invented numbers or examples.

**Tagline:** Translation keeps the words. Lengua Fina keeps the meaning, using what each audience actually loves.

## Inspiration

I'm a Belgian translator living on an island in Bocas del Toro, Panama, where I grow cacao and make chocolate. When I write about my chocolate for buyers abroad, the hard part is never the grammar. It's the references. "Smooth as a Brussels praline" means something in Brussels and very little in Tokyo. Translation tools carry the words across and leave the meaning behind, and an LLM on its own guesses at what another culture likes.

In Spanish, *lengua* means both language and tongue: the thing you speak with and the thing you taste with. That's the problem in one word.

The language half is well measured: in [CSA Research's "Can't Read, Won't Buy" survey](https://csa-research.com/Blogs-Events/CSA-in-the-Media/Press-Releases/Consumers-Prefer-their-Own-Language) of 8,709 consumers in 29 countries, 76% prefer to buy products with information in their own language and 40% never buy from websites in other languages. Translation clears that bar. Lengua Fina is for what's left: copy that's in the right language but still reads foreign.

## What it does

Lengua Fina is a transcreation agent — the creative end of localization: product facts stay as written, and the cultural hooks are rewritten from what each audience measurably loves.

You paste your product copy and pick up to three markets (city, age group, language). Lengua Fina:

1. Asks Qloo which artists, films, books, brands and places each audience has affinity for, optionally narrowed by a product signal such as a chocolate tag.
2. Checks the references in your original copy against each audience and flags the ones that won't land.
3. Rewrites the copy per market. Product facts stay the same; the hooks change. Each new reference comes with its Qloo source and affinity.

From a real run (Oct 25, saved on the site as the "70% dark chocolate" example): for **Tokyo**, "your Sunday café au lait" was flagged as a generic French breakfast drink with no local hook and became espresso from CAMELBACK sandwich&espresso, a Tokyo spot with 0.99 affinity for that audience. For **Austin**, "smooth as a Brussels praline" became "more Heartless Bastards than easy listening" (artist, 0.99), and the café au lait became Sunday-morning Chameleon Coffee (brand, 0.98). For **Brussels**, the agent dropped the praline comparison for a reason no translation tool would give you: comparing the bar to the city's own praline invites a contest with local chocolate — and brought in Tamino (0.99) as the after-dinner soundtrack instead. In all three markets it kept the Port pairing but marked it unverified, because Qloo has no entity for Port wine as a drink. It flags what it can't check rather than inventing support.

## How we built it

- An agent on Claude Opus 5.5 (Anthropic SDK tool runner) with five tools over the Qloo hackathon API: `/search`, `/v2/tags` and `/v2/insights` (location + age signals, interest tags).
- **Grounding by construction:** the agent's final answer goes through a check that rejects any reference whose Qloo entity id wasn't returned during that run. If it tries to slip one in, it gets sent back to fix it. You can't get a made-up reference out of Lengua Fina.
- A validation script that compares Qloo's taste profiles across markets with no LLM involved, which we used to confirm the idea before building on it. For 30–44-year-olds in Tokyo, Brussels and Austin, the top-20 artists overlap 0–5% between any two markets and the top-20 brands 0%, with recognisably local names in every list (NUMBER GIRL and 木村カエラ in Tokyo; Tamino and Yseult in Brussels; Heartless Bastards in Austin). Books overlap far more (33–48%), so the agent leans on the entity types that actually diverge.
- Next.js on Vercel, streaming the agent's steps to the page so you can watch it work.

## Challenges

- Qloo's "chocolate" tags turn out to be place categories (chocolate shops, chocolate artisans), and adding one as an interest signal didn't change the artist or brand insights at all. The product signal is a hint, not a filter — the market signal does the real work.
- Not every entity type diverges: books overlap 33–48% across our three test markets. The agent has to know which lanes carry local taste.
- Not every market has data. In the "Dutch, three ways" demo (same copy for Amsterdam, Willemstad and Antwerp), Qloo turned out to have no taste profile for a Willemstad audience — and the grounding rule held: the agent said so, reframed the copy around the shared Caribbean Sea, and shipped zero references for that market rather than inventing one. Meanwhile Amsterdam got "koffie verkeerd" and Maaike Ouboter, and Antwerp got "koffie met melk", "porto" and Tamino: one language, three rooms.

- A full three-market run takes two to three minutes of real API work. We stream every tool call and its results to the page as it happens (the "tasting notebook"), and the site ships with unedited saved runs so judges can read a verdict instantly — then load the same example and run it fresh.

## What we're proud of

- Every reference is traceable to Qloo data.
- It's built for a real job I do, with a product I make.

## What's next

- Full product pages and email campaigns, not just short copy.
- A translator mode: show the original, the literal translation and the transcreation side by side for client review.
- More product signals beyond food and drink (crafts, cosmetics, tourism).

## Built with

Qloo Taste AI API, Claude (Anthropic API), Next.js, TypeScript, Tailwind CSS, Vercel.
