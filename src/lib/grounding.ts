import type { QlooEntity } from "./qloo";

export type DraftReference = { phrase: string; entity_id: string; why: string };
export type DraftFlag = { original: string; problem: string; evidence: string };
export type DraftMarket = {
  city: string;
  language: string;
  copy: string;
  back_translation: string | null;
  references: DraftReference[];
  flags: DraftFlag[];
};

export type GroundedReference = {
  phrase: string;
  why: string;
  entity: Pick<QlooEntity, "id" | "name" | "type" | "affinity">;
};

export type MarketResult = {
  city: string;
  language: string;
  copy: string;
  backTranslation: string | null;
  references: GroundedReference[];
  flags: DraftFlag[];
};

export type GroundingOutcome =
  | { ok: true; markets: MarketResult[] }
  | { ok: false; unknown: string[] };

/**
 * Accept the agent's draft only if every reference points at an entity Qloo
 * actually returned during this run. Returns the rejected references otherwise.
 */
export function groundDraft(markets: DraftMarket[], seen: ReadonlyMap<string, QlooEntity>): GroundingOutcome {
  const unknown = markets.flatMap((m) =>
    m.references.filter((r) => !seen.has(r.entity_id)).map((r) => `${m.city}: "${r.phrase}" (${r.entity_id})`),
  );
  if (unknown.length) return { ok: false, unknown };

  return {
    ok: true,
    markets: markets.map((m) => ({
      city: m.city,
      language: m.language,
      copy: m.copy,
      backTranslation: m.back_translation,
      flags: m.flags,
      references: m.references.map((r) => {
        const e = seen.get(r.entity_id)!;
        return { phrase: r.phrase, why: r.why, entity: { id: e.id, name: e.name, type: e.type, affinity: e.affinity } };
      }),
    })),
  };
}
