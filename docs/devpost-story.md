**Video guide:** 1:00 live run against Qloo · 1:18 the verdict with taste facts · 1:27 Brussels drops its own praline · 1:38 under the hood · 1:54 measured: does taste differ by market? · 2:15 Willemstad, where Qloo has no data

## Inspiration

I'm a Belgian translator living on an island in Bocas del Toro, Panama, where I grow cacao and make truffles from unrefined 100% cacao. When I write about chocolate for buyers abroad, the hard part is never the grammar. It's the references. "Smooth as a Brussels praline" sounds like a safe line to a Belgian, but Tokyo doesn't read it, and even Brussels pushes back (see 1:27 in the video). Translation tools carry the words across and leave the meaning behind, and an LLM on its own guesses at what another culture likes.

In Spanish, _lengua_ means both language and tongue: the thing you speak with and the thing you taste with. That's the problem in one word.

The language half is well measured: in [CSA Research's "Can't Read, Won't Buy" survey](https://csa-research.com/Blogs-Events/CSA-in-the-Media/Press-Releases/Consumers-Prefer-their-Own-Language) of 8,709 consumers in 29 countries, 76% prefer to buy products with information in their own language and 40% never buy from websites in other languages. Translation clears that bar. Lengua Fina is for what's left: copy that's in the right language but still reads foreign.

## What it does

Lengua Fina is a transcreation agent, the creative end of localization: product facts stay as written, and the cultural hooks are rewritten from what each audience measurably loves.

You paste your product copy and pick up to three markets: city, age group, language (0:51 in the video). Lengua Fina:

1. Asks Qloo which artists, films, books, brands and places each audience has affinity for, optionally narrowed by a product signal such as a chocolate tag. You can watch every tool call stream in at 1:04; the live run in the video took 58 s of real API work, sped up on screen.
2. Checks the references in your original copy against each audience and flags the ones that won't land.
3. Rewrites the copy per market. Product facts stay the same; the hooks change. Each new reference comes with its Qloo source and affinity score, shown as "taste facts" at 1:18.

From a real run (Oct 25, saved on the site as the "70% dark chocolate" example, and shown at 1:27): for **Tokyo**, "your Sunday café au lait" was flagged as a generic French breakfast drink with no local hook and became espresso from CAMELBACK sandwich&espresso, a Tokyo spot with 0.99 affinity for that audience. For **Austin**, "smooth as a Brussels praline" became "more Heartless Bastards than easy listening" (artist, 0.99), and the café au lait became Sunday-morning Chameleon Coffee (brand, 0.98). For **Brussels**, the agent dropped the praline comparison for a reason no translation tool would give you: comparing the bar to the city's own praline invites a contest with local chocolate. It brought in Tamino (0.99) as the after-dinner soundtrack instead. In all three markets it kept the Port pairing but marked it unverified, because Qloo has no entity for Port wine as a drink. It flags what it can't check rather than inventing support.

## Try it yourself

Open https://lengua-fina.vercel.app (no sign-in).

1. **Read a verdict first.** Pick a saved run under "El veredicto". Under each rewrite, "Dropped" says why a reference won't land with that audience, and the taste facts show which Qloo entity replaced it, with its affinity score.
2. **Run one live.** Click "Load this example into the form", then Transcreate. It takes one to three minutes, and the tasting notebook shows every Qloo call as it happens. The wording will differ from the saved run; the grounding won't.
3. **Bring your own line.** Paste copy with a strong local hook: a breakfast, a team, a band. Compare cities that share a language, like Amsterdam and Antwerp, or try one Qloo may not cover, like Willemstad, and watch it say so instead of guessing.

The public demo allows 6 live runs per visitor per hour.

## How we built it

- An agent on Claude (Anthropic SDK tool runner) with five tools over the Qloo hackathon API: `/search`, `/v2/tags` and `/v2/insights` (location + age signals, interest tags).
- **Grounding by construction:** the agent's final answer goes through a check that rejects any reference whose Qloo entity id wasn't returned during that run. If it tries to slip one in, it gets sent back to fix it. You can't get a made-up reference out of Lengua Fina (the architecture is at 1:38 in the video).
- A validation script that compares Qloo's taste profiles across markets with no LLM involved, which we used to confirm the idea before building on it (1:54 in the video). For 30–44-year-olds in Tokyo, Brussels and Austin, the top-20 artists overlap 0–5% between any two markets and the top-20 brands 0%, with recognisably local names in every list (NUMBER GIRL and 木村カエラ in Tokyo; Tamino and Yseult in Brussels; Heartless Bastards in Austin). Books overlap far more (33–48%), so the agent leans on the entity types that actually diverge.
- Next.js on Vercel, streaming the agent's steps to the page so you can watch it work.

## Challenges we ran into

- Qloo's "chocolate" tags turn out to be place categories (chocolate shops, chocolate artisans), and adding one as an interest signal didn't change the artist or brand insights at all. The product signal is a hint, not a filter; the market signal does the real work.
- Not every entity type diverges: books overlap 33–48% across our three test markets. The agent has to know which lanes carry local taste.
- Not every market has data. In the "Dutch, three ways" demo (same copy for Amsterdam, Willemstad and Antwerp, shown at 2:15), Qloo turned out to have no taste profile for a Willemstad audience, and the grounding rule held: the agent said so, reframed the copy around the shared Caribbean Sea, and shipped zero references for that market rather than inventing one. Meanwhile Amsterdam got "koffie verkeerd" and Maaike Ouboter, and Antwerp got "koffie met melk", "porto" and Tamino: one language, three rooms.
- A full three-market run takes one to three minutes of real API work, and live runs word their reasoning a little differently each time. We stream every tool call and its results to the page as it happens (the "tasting notebook"), and the site ships with unedited saved runs so judges can read a verdict instantly, then load the same example and run it fresh.

## Accomplishments that we're proud of

- Every reference is traceable to Qloo data.
- It's built for a real job I do, with a product I make: the "100% cacao truffles" tab on the site is a saved run on my actual truffle copy (unrefined cacao mass, cane sugar, coconut milk, a pinch of salt).

## What's next for Lengua Fina

- Full product pages and email campaigns, not just short copy.
- A translator mode: show the original, the literal translation and the transcreation side by side for client review.
- More product signals beyond food and drink (crafts, cosmetics, tourism).
