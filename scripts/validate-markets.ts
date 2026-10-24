// Go/no-go check for Lengua Fina: does Qloo return clearly different taste
// profiles for different markets? Pure Qloo data, no LLM involved.
//
//   npm run validate                      # default markets + ages
//   npm run validate -- Tokyo Brussels "Mexico City"
//
// Raw responses go to scripts/out/ (gitignored: Qloo data must not be
// committed to a public repo).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { audienceTaste, rawGet, searchTags, type AgeRange, type EntityType, type QlooEntity } from "../src/lib/qloo";

const markets = process.argv.slice(2).length ? process.argv.slice(2) : ["Tokyo", "Brussels", "Austin"];
const ages: AgeRange[] = ["30_to_34", "35_to_44"];
const types: EntityType[] = ["artist", "movie", "brand", "book"];
const outDir = join(__dirname, "out");
mkdirSync(outDir, { recursive: true });

function jaccard(a: QlooEntity[], b: QlooEntity[]) {
  const A = new Set(a.map((e) => e.id));
  const B = new Set(b.map((e) => e.id));
  const inter = [...A].filter((id) => B.has(id)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
}

async function main() {
  // 1. Show raw shapes once, so the parser in src/lib/qloo.ts can be confirmed.
  const rawInsights = await rawGet("/v2/insights", {
    "filter.type": "urn:entity:artist",
    "signal.location.query": markets[0],
    take: 2,
  });
  writeFileSync(join(outDir, "raw-insights.json"), JSON.stringify(rawInsights, null, 2));
  const rawSearch = await rawGet("/search", { query: "chocolate", take: 2 });
  writeFileSync(join(outDir, "raw-search.json"), JSON.stringify(rawSearch, null, 2));
  console.log(`Raw samples written to ${outDir}\n`);

  // 2. Optional product signal: a chocolate tag, if Qloo has one.
  let chocolateTag: string | undefined;
  try {
    const tags = await searchTags("chocolate", 5);
    console.log("Tags for 'chocolate':", tags.map((t) => `${t.name} (${t.id})`).join(", ") || "none");
    chocolateTag = tags[0]?.id;
  } catch (err) {
    console.log("Tag search failed:", (err as Error).message);
  }

  // 3. Same query per market; compare overlap.
  const summary: Record<string, unknown> = {};
  for (const type of types) {
    for (const withProduct of chocolateTag ? [false, true] : [false]) {
      const label = `${type}${withProduct ? " + chocolate tag" : ""}`;
      const byMarket: Record<string, QlooEntity[]> = {};
      for (const market of markets) {
        try {
          byMarket[market] = await audienceTaste({
            type,
            market,
            ages,
            interestTags: withProduct && chocolateTag ? [chocolateTag] : undefined,
            take: 20,
          });
        } catch (err) {
          console.log(`  ${label} / ${market}: ${(err as Error).message}`);
          byMarket[market] = [];
        }
      }

      console.log(`\n=== ${label} (ages ${ages.join(", ")}) ===`);
      for (const market of markets) {
        const top = byMarket[market].slice(0, 8).map((e) => e.name);
        console.log(`  ${market.padEnd(12)} ${top.join(" · ") || "(no results)"}`);
      }
      const pairs: string[] = [];
      for (let i = 0; i < markets.length; i++) {
        for (let j = i + 1; j < markets.length; j++) {
          const overlap = jaccard(byMarket[markets[i]], byMarket[markets[j]]);
          pairs.push(`${markets[i]}/${markets[j]} ${(overlap * 100).toFixed(0)}%`);
        }
      }
      console.log(`  overlap of top 20: ${pairs.join(", ")}`);
      summary[label] = byMarket;
    }
  }

  writeFileSync(join(outDir, "markets.json"), JSON.stringify(summary, null, 2));
  console.log(`\nVerdict guide: low overlap (< ~40%) with recognisably local names = Lengua Fina works.`);
  console.log(`High overlap or global-only names = switch to the Beacon fallback.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
