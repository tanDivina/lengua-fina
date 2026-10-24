import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import {
  AGE_RANGES,
  ENTITY_TYPES,
  audienceTaste,
  searchEntities,
  searchTags,
  type AgeRange,
  type QlooEntity,
} from "./qloo";
import { groundDraft, type MarketResult } from "./grounding";

export type { GroundedReference, MarketResult } from "./grounding";

const MODEL = "claude-opus-5-5";

export type MarketSpec = { city: string; ages: AgeRange[]; language: string };

export type LocalizeInput = {
  copy: string;
  product: string;
  markets: MarketSpec[];
};

export type AgentEvent =
  | { type: "note"; text: string }
  | { type: "tool"; name: string; label: string }
  | { type: "tool_result"; name: string; label: string; names: string[] }
  | { type: "result"; markets: MarketResult[] }
  | { type: "error"; message: string };

const SYSTEM = `You are Lengua Fina, a transcreation agent for translators and small producers who sell abroad.

Literal translation keeps the words but loses the references: comparisons, pairings, "if you love X" hooks and cultural nods that land at home and fall flat elsewhere. Your job is to adapt product copy for each target market so its cultural references are ones that audience actually has affinity for, according to Qloo's taste data.

How to work:
1. Read the source copy. List the cultural references and hooks it relies on.
2. For each market, use market_taste across a few entity types (artists, films, books, brands, places, podcasts, TV) to learn what that audience has affinity for. Use find_tags or find_entity first if a product signal (e.g. a chocolate or coffee tag) would sharpen the results.
3. Use check_reference on the source copy's own references to see whether they rank for each audience. Flag the ones that don't.
4. Rewrite the copy per market in the requested language. Keep every product fact unchanged (origin, percentages, ingredients, process). Change only the framing, the references and the hooks.
5. Finish by calling submit_localization exactly once with all markets.

Rules:
- Every cultural reference you add must be an entity returned by a Qloo tool in this session, cited by its entity id. Never add a reference you did not get from Qloo.
- Never state numbers, percentages or scores that a tool did not return.
- Use few references: one or two well-chosen ones per market beat a list.
- When the target language is not English, include an English back-translation.
- Write like a skilled human copywriter: concrete, warm, no hype words.`;

function label(e: QlooEntity) {
  return e.affinity === null ? e.name : `${e.name} (affinity ${e.affinity.toFixed(2)})`;
}

function compact(entities: QlooEntity[]) {
  return entities.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    affinity: e.affinity,
    tags: e.tags.slice(0, 5),
  }));
}

const ageEnum = z.enum(AGE_RANGES);
const typeEnum = z.enum(ENTITY_TYPES);

export async function runLocalization(input: LocalizeInput, emit: (e: AgentEvent) => void) {
  const client = new Anthropic();

  // Every entity Qloo returned during this run. submit_localization only
  // accepts references whose id is in here.
  const seen = new Map<string, QlooEntity>();
  const remember = (list: QlooEntity[]) => list.forEach((e) => seen.set(e.id, e));
  let result: MarketResult[] | null = null;

  const findEntity = betaZodTool({
    name: "find_entity",
    description:
      "Resolve a name (artist, film, brand, place, book...) to Qloo entities with their ids. Use to look up references from the source copy.",
    inputSchema: z.object({
      query: z.string(),
      types: z.array(typeEnum).optional().describe("Restrict to these entity types"),
    }),
    run: async ({ query, types }) => {
      emit({ type: "tool", name: "find_entity", label: `Looking up “${query}”` });
      const found = await searchEntities(query, types, 5);
      remember(found);
      emit({ type: "tool_result", name: "find_entity", label: query, names: found.map((e) => e.name) });
      return JSON.stringify(compact(found));
    },
  });

  const findTags = betaZodTool({
    name: "find_tags",
    description:
      "Find Qloo tag ids by keyword (e.g. 'chocolate', 'specialty coffee'). Tags can be passed to market_taste as a product signal.",
    inputSchema: z.object({ query: z.string() }),
    run: async ({ query }) => {
      emit({ type: "tool", name: "find_tags", label: `Finding tags for “${query}”` });
      const tags = await searchTags(query, 10);
      emit({ type: "tool_result", name: "find_tags", label: query, names: tags.map((t) => t.name) });
      return JSON.stringify(tags);
    },
  });

  const marketTaste = betaZodTool({
    name: "market_taste",
    description:
      "Ranked list of entities of one type that an audience has affinity for. The audience is a city plus age ranges, optionally narrowed by interest tags or entities (e.g. people who like chocolate). Returns ids, names, affinity and tags.",
    inputSchema: z.object({
      market: z.string().describe("City or locality name, e.g. 'Tokyo'"),
      ages: z.array(ageEnum).min(1),
      type: typeEnum,
      interest_tag_ids: z.array(z.string()).optional(),
      interest_entity_ids: z.array(z.string()).optional(),
      take: z.number().int().min(5).max(50).optional(),
    }),
    run: async (q) => {
      emit({ type: "tool", name: "market_taste", label: `${q.market}: top ${q.type.replace("_", " ")}s` });
      const list = await audienceTaste({
        type: q.type,
        market: q.market,
        ages: q.ages,
        interestTags: q.interest_tag_ids,
        interestEntities: q.interest_entity_ids,
        take: q.take ?? 20,
      });
      remember(list);
      emit({
        type: "tool_result",
        name: "market_taste",
        label: `${q.market} · ${q.type}`,
        names: list.slice(0, 6).map(label),
      });
      return JSON.stringify(compact(list));
    },
  });

  const checkReference = betaZodTool({
    name: "check_reference",
    description:
      "Check whether a specific entity (by id) ranks among the top 100 of its type for an audience. Use on references from the source copy to decide whether they will land in a market.",
    inputSchema: z.object({
      entity_id: z.string(),
      type: typeEnum,
      market: z.string(),
      ages: z.array(ageEnum).min(1),
    }),
    run: async ({ entity_id, type, market, ages }) => {
      const name = seen.get(entity_id)?.name ?? entity_id;
      emit({ type: "tool", name: "check_reference", label: `Does “${name}” land in ${market}?` });
      const pages = await Promise.all(
        [1, 2].map((page) => audienceTaste({ type, market, ages, take: 50, page })),
      );
      const ranked = pages.flat();
      remember(ranked);
      const index = ranked.findIndex((e) => e.id === entity_id);
      const verdict =
        index === -1
          ? `${name} is not in the top ${ranked.length} ${type}s for this audience in ${market}.`
          : `${name} ranks #${index + 1} of ${ranked.length} ${type}s for this audience in ${market}.`;
      emit({ type: "tool_result", name: "check_reference", label: market, names: [verdict] });
      return verdict;
    },
  });

  const submit = betaZodTool({
    name: "submit_localization",
    description: "Submit the final localized copy for all markets. Call exactly once, at the end.",
    inputSchema: z.object({
      markets: z.array(
        z.object({
          city: z.string(),
          language: z.string(),
          copy: z.string(),
          back_translation: z.string().nullable().describe("English back-translation, or null if the copy is English"),
          references: z.array(
            z.object({
              phrase: z.string().describe("The words in the copy that carry the reference"),
              entity_id: z.string().describe("Qloo entity id returned earlier in this session"),
              why: z.string().describe("One sentence on why it fits this audience, citing only tool data"),
            }),
          ),
          flags: z.array(
            z.object({
              original: z.string().describe("Reference or hook from the source copy"),
              problem: z.string(),
              evidence: z.string().describe("The check_reference or market_taste finding behind the flag"),
            }),
          ),
        }),
      ),
    }),
    run: async ({ markets }) => {
      const outcome = groundDraft(markets, seen);
      if (!outcome.ok) {
        emit({
          type: "note",
          text: `Rejected ${outcome.unknown.length} reference(s) that Qloo never returned; asking for a fix.`,
        });
        return `Rejected. These references were not returned by any Qloo tool in this session: ${outcome.unknown.join("; ")}. Replace them with entities you retrieved, or remove them, then call submit_localization again.`;
      }
      result = outcome.markets;
      return "Accepted.";
    },
  });

  const marketList = input.markets
    .map((m) => `- ${m.city}, ages ${m.ages.join(" + ")}, write in ${m.language}`)
    .join("\n");

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    max_iterations: 30,
    betas: ["server-side-fallback-2026-07-01", "thinking-display-updates-2026-08-18"],
    fallbacks: "default",
    thinking: { type: "adaptive", display: "updates" },
    output_config: { effort: "medium" },
    system: SYSTEM,
    tools: [findEntity, findTags, marketTaste, checkReference, submit],
    messages: [
      {
        role: "user",
        content: `Product: ${input.product}\n\nSource copy:\n"""\n${input.copy}\n"""\n\nTarget markets:\n${marketList}`,
      },
    ],
  });

  let last: Anthropic.Beta.BetaMessage | null = null;
  for await (const message of runner) {
    last = message;
    for (const block of message.content) {
      if (block.type === "thinking" && block.thinking.trim()) emit({ type: "note", text: block.thinking.trim() });
    }
  }

  if (result) {
    emit({ type: "result", markets: result });
  } else if (last?.stop_reason === "refusal") {
    emit({ type: "error", message: "The model declined this request." });
  } else {
    emit({ type: "error", message: "The agent stopped before submitting a result. Try again or simplify the copy." });
  }
}
