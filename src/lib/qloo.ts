// Thin client for the Qloo hackathon API (https://hackathon.api.qloo.com).
// Response shapes are parsed defensively: run `npm run validate` once a key is
// available to see the raw shapes and confirm the field names used below.

const BASE_URL = process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com";

export const ENTITY_TYPES = [
  "artist",
  "book",
  "brand",
  "destination",
  "movie",
  "person",
  "place",
  "podcast",
  "tv_show",
  "video_game",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const AGE_RANGES = [
  "24_and_younger",
  "25_to_29",
  "30_to_34",
  "35_to_44",
  "45_to_54",
  "55_and_older",
] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export type QlooEntity = {
  id: string;
  name: string;
  type: string;
  affinity: number | null;
  popularity: number | null;
  tags: string[];
};

export type QlooTag = { id: string; name: string; type: string };

export class QlooError extends Error {
  constructor(
    public status: number,
    public body: string,
    public path: string,
  ) {
    super(`Qloo ${path} returned ${status}: ${body.slice(0, 300)}`);
  }
}

// Private server-side caching is allowed by the hackathon rules.
const cache = new Map<string, { at: number; data: unknown }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

async function qlooGet(path: string, params: Record<string, string | number | undefined>) {
  const key = process.env.QLOO_API_KEY;
  if (!key) throw new Error("QLOO_API_KEY is not set");

  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  const hit = cache.get(url.toString());
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const res = await fetch(url, { headers: { "X-Api-Key": key, accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new QlooError(res.status, text, path);

  const data = JSON.parse(text) as unknown;
  cache.set(url.toString(), { at: Date.now(), data });
  return data;
}

type Raw = Record<string, unknown>;

function asArray(v: unknown): Raw[] {
  return Array.isArray(v) ? (v as Raw[]) : [];
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function toEntity(e: Raw): QlooEntity {
  const query = (e.query ?? {}) as Raw;
  const tags = asArray(e.tags)
    .map((t) => String(t.name ?? ""))
    .filter(Boolean)
    .slice(0, 8);
  const types = asArray(e.types).map(String);
  return {
    id: String(e.entity_id ?? e.id ?? ""),
    name: String(e.name ?? ""),
    type: String(e.subtype ?? e.type ?? types[0] ?? ""),
    affinity: num(query.affinity),
    popularity: num(e.popularity),
    tags,
  };
}

/** Resolve a name to Qloo entities. */
export async function searchEntities(query: string, types?: EntityType[], take = 5) {
  const data = (await qlooGet("/search", {
    query,
    types: types?.map((t) => `urn:entity:${t}`).join(","),
    take,
  })) as Raw;
  return asArray(data.results ?? data.entities)
    .map(toEntity)
    .filter((e) => e.id);
}

/** Find tag IDs by keyword (tags are only usable by ID). */
export async function searchTags(query: string, take = 10): Promise<QlooTag[]> {
  const data = (await qlooGet("/v2/tags", { "filter.query": query, take })) as Raw;
  const results = (data.results ?? {}) as Raw;
  return asArray(results.tags ?? data.tags ?? data.results)
    .map((t) => ({
      id: String(t.id ?? t.tag_id ?? ""),
      name: String(t.name ?? ""),
      type: String(t.type ?? t.subtype ?? ""),
    }))
    .filter((t) => t.id);
}

export type TasteQuery = {
  type: EntityType;
  market?: string;
  ages?: AgeRange[];
  gender?: "male" | "female";
  interestEntities?: string[];
  interestTags?: string[];
  take?: number;
  page?: number;
};

/** What an audience (market + age + optional interests) has affinity for, ranked. */
export async function audienceTaste(q: TasteQuery) {
  const data = (await qlooGet("/v2/insights", {
    "filter.type": `urn:entity:${q.type}`,
    "signal.location.query": q.market,
    "signal.demographics.age": q.ages?.join(","),
    "signal.demographics.gender": q.gender,
    "signal.interests.entities": q.interestEntities?.join(","),
    "signal.interests.tags": q.interestTags?.join(","),
    take: q.take ?? 20,
    page: q.page,
  })) as Raw;
  const results = (data.results ?? {}) as Raw;
  return asArray(results.entities).map(toEntity).filter((e) => e.id);
}

/** Raw passthrough, used only by the validation script to inspect shapes. */
export async function rawGet(path: string, params: Record<string, string | number | undefined>) {
  return qlooGet(path, params);
}
