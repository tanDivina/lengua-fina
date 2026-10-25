"use client";

import { useState } from "react";
import type { AgentEvent, MarketResult } from "@/lib/agent";
import type { AgeRange } from "@/lib/qloo";
import { Waitlist } from "./waitlist";

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: "24_and_younger", label: "≤24" },
  { value: "25_to_29", label: "25–29" },
  { value: "30_to_34", label: "30–34" },
  { value: "35_to_44", label: "35–44" },
  { value: "45_to_54", label: "45–54" },
  { value: "55_and_older", label: "55+" },
];

type Market = { city: string; ages: AgeRange[]; language: string };

// Sample copy for the demo. Its European references are deliberate: the agent
// should find out which of them land in each market.
const SAMPLE_PRODUCT = "70% single-origin dark chocolate bar, cacao from Bocas del Toro, Panama";
const SAMPLE_COPY = `Grown on a small island farm in Bocas del Toro and fermented for six days in wooden boxes, this 70% bar tastes of red fruit, honey and a hint of tobacco. Smooth as a Brussels praline, but darker and wilder. Break off a square with your Sunday café au lait, or pair it with a glass of Port after dinner.`;

const DEFAULT_MARKETS: Market[] = [
  { city: "Tokyo", ages: ["30_to_34", "35_to_44"], language: "Japanese" },
  { city: "Brussels", ages: ["30_to_34", "35_to_44"], language: "French" },
  { city: "Austin", ages: ["30_to_34", "35_to_44"], language: "English" },
];

type LogItem = { kind: "tool" | "result" | "note"; text: string; names?: string[] };

// Wrapper colors for the market cards, cycled in order.
const WRAPPERS = [
  { bg: "#2433c8", fg: "#ffffff", sub: "#dde1ff" },
  { bg: "#ff7a45", fg: "#141414", sub: "#2e2a27" },
  { bg: "#ffd24a", fg: "#141414", sub: "#2e2a27" },
];

// Sample verdict shown before the first run. [Brackets] stand in for real
// Qloo results — never invented values.
const SAMPLE_VERDICT = [
  {
    city: "Tokyo",
    meta: "30–44 · 日本語",
    headline: "[Qloo参照]のようになめらかで、もっと深く、野性的。",
    sub: "Smooth as [Qloo reference], but deeper and wilder.",
    verb: "Dropped",
    refs: ["Brussels praline", "café au lait"],
    struck: true,
    rows: [
      ["[Qloo artist]", "artist"],
      ["[Qloo film]", "film"],
      ["[Qloo brand]", "brand"],
    ],
  },
  {
    city: "Brussels",
    meta: "30–44 · Français",
    headline: "Lisse comme une praline de Bruxelles, mais plus sombre et plus sauvage.",
    sub: "The original reference already lands here, so it stays.",
    verb: "Kept",
    refs: ["Brussels praline"],
    struck: false,
    rows: [
      ["[Qloo artist]", "artist"],
      ["[Qloo book]", "book"],
      ["[Qloo place]", "place"],
    ],
  },
  {
    city: "Austin",
    meta: "30–44 · English",
    headline: "Smooth, dark and a little wild. Break off a square after dinner with [Qloo reference].",
    sub: "Port swapped for something this audience already loves.",
    verb: "Dropped",
    refs: ["a glass of Port"],
    struck: true,
    rows: [
      ["[Qloo artist]", "artist"],
      ["[Qloo TV show]", "TV show"],
      ["[Qloo brand]", "brand"],
    ],
  },
];

function TasteFacts({ references }: { references: MarketResult["references"] }) {
  return (
    <div className="rounded-md bg-white px-4 py-3.5 text-sm text-[#111111]">
      <div className="border-b-8 border-[#111111] pb-1 font-display text-[22px] font-extrabold">Taste facts</div>
      <div className="flex justify-between border-b border-[#111111] py-1.5 text-[11px] font-bold uppercase tracking-[0.06em]">
        <span>From Qloo</span>
        <span>Affinity</span>
      </div>
      {references.map((r, i) => (
        <div
          key={r.entity.id + r.phrase}
          className={`py-1.5 ${i === references.length - 1 ? "border-b-4" : "border-b"} border-[#111111]`}
        >
          <div className="flex justify-between gap-3">
            <span>
              <b>{r.entity.name}</b>{" "}
              <span className="text-[#55554f]">{r.entity.type.replace("urn:entity:", "")}</span>
            </span>
            <span>{r.entity.affinity !== null ? r.entity.affinity.toFixed(2) : "—"}</span>
          </div>
          <div className="text-xs text-[#3d3d39]">{r.why}</div>
        </div>
      ))}
      <div className="pt-1.5 text-xs text-[#3d3d39]">Product facts stay as written; only the hooks change.</div>
    </div>
  );
}

export default function Home() {
  const [product, setProduct] = useState(SAMPLE_PRODUCT);
  const [copy, setCopy] = useState(SAMPLE_COPY);
  const [markets, setMarkets] = useState<Market[]>(DEFAULT_MARKETS);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogItem[]>([]);
  const [results, setResults] = useState<MarketResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function updateMarket(i: number, patch: Partial<Market>) {
    setMarkets((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  function addMarket() {
    setMarkets((ms) => [...ms, { city: "", ages: ["30_to_34", "35_to_44"], language: "English" }]);
  }

  function removeMarket(i: number) {
    setMarkets((ms) => ms.filter((_, j) => j !== i));
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
  }

  function toggleAge(i: number, age: AgeRange) {
    const m = markets[i];
    const ages = m.ages.includes(age) ? m.ages.filter((a) => a !== age) : [...m.ages, age];
    if (ages.length) updateMarket(i, { ages });
  }

  function handle(e: AgentEvent) {
    if (e.type === "tool") setLog((l) => [...l, { kind: "tool", text: e.label }]);
    else if (e.type === "tool_result")
      setLog((l) => [...l, { kind: "result", text: e.label, names: e.names }]);
    else if (e.type === "note") setLog((l) => [...l, { kind: "note", text: e.text }]);
    else if (e.type === "result") setResults(e.markets);
    else if (e.type === "error") setError(e.message);
  }

  async function run() {
    setRunning(true);
    setLog([]);
    setResults(null);
    setError(null);
    try {
      const res = await fetch("/api/localize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product, copy, markets: markets.filter((m) => m.city.trim()) }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (line.startsWith("data: ")) handle(JSON.parse(line.slice(6)) as AgentEvent);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="font-display text-[26px] font-extrabold tracking-tight">
          lengua<span className="text-gold">·</span>fina
        </div>
        <div className="text-[13px] text-muted">Every reference, traceable to Qloo.</div>
      </div>

      <header className="mt-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tighter sm:text-7xl">
            Your copy, read by three different rooms.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Lengua Fina asks Qloo what each audience loves, drops the references that won&apos;t land, and
            rewrites around the ones that will. Every swap comes with its taste facts.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/tamandua.svg"
          alt=""
          className={`mascot h-48 w-auto shrink-0 sm:h-60 ${running ? "mascot-busy" : ""}`}
        />
      </header>

      <section className="mt-10 rounded-[28px] border border-line px-6 py-5 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <div className="font-display text-4xl font-extrabold text-gold">76%</div>
            <p className="mt-1 text-sm leading-snug text-muted">
              of online shoppers prefer products with information in their own language
            </p>
          </div>
          <div>
            <div className="font-display text-4xl font-extrabold text-gold">40%</div>
            <p className="mt-1 text-sm leading-snug text-muted">
              will never buy from a website in another language
            </p>
          </div>
          <div>
            <div className="font-display text-4xl font-extrabold text-gold">0</div>
            <p className="mt-1 text-sm leading-snug text-muted">
              references the agent can invent — it can only cite what Qloo returned in the run
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">
          Language figures:{" "}
          <a
            href="https://csa-research.com/Blogs-Events/CSA-in-the-Media/Press-Releases/Consumers-Prefer-their-Own-Language"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-gold"
          >
            CSA Research, &ldquo;Can&apos;t Read, Won&apos;t Buy&rdquo;
          </a>{" "}
          — 8,709 consumers, 29 countries.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] border border-line bg-panel p-5 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Product</span>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-stage px-3.5 py-2.5 outline-none focus:border-gold"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Source copy</span>
              <textarea
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={8}
                className="mt-2 w-full rounded-xl border border-line bg-stage px-3.5 py-2.5 leading-relaxed outline-none focus:border-gold"
              />
            </label>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Markets</span>
            <div className="mt-2 space-y-3">
              {markets.map((m, i) => (
                <div key={i} className="rounded-xl border border-line bg-stage p-3">
                  <div className="flex gap-2">
                    <input
                      value={m.city}
                      onChange={(e) => updateMarket(i, { city: e.target.value })}
                      placeholder="City"
                      className="w-1/2 rounded-lg border border-line bg-panel px-2.5 py-1.5 outline-none focus:border-gold"
                    />
                    <input
                      value={m.language}
                      onChange={(e) => updateMarket(i, { language: e.target.value })}
                      placeholder="Language"
                      className="w-1/2 rounded-lg border border-line bg-panel px-2.5 py-1.5 outline-none focus:border-gold"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {AGE_OPTIONS.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAge(i, a.value)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          m.ages.includes(a.value)
                            ? "border-gold bg-gold text-stage"
                            : "border-line text-muted hover:border-gold"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                    {markets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMarket(i)}
                        className="ml-auto text-xs text-muted underline-offset-2 hover:text-mandarin hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {markets.length < 3 && (
              <button
                type="button"
                onClick={addMarket}
                className="mt-2 text-sm text-gold underline-offset-2 hover:underline"
              >
                Add a market
              </button>
            )}
          </div>
        </div>

        <button
          onClick={run}
          disabled={running}
          className="mt-8 w-full rounded-full bg-fg px-6 py-4 font-display text-lg font-bold text-stage transition hover:bg-gold disabled:opacity-60"
        >
          {running ? "Reading the room…" : "Transcreate"}
        </button>
      </section>

      {!running && !error && log.length === 0 && !results && (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "1",
              title: "It reads the room.",
              body: "For each market, the agent asks Qloo which artists, films, books, brands and places that audience has affinity for.",
            },
            {
              n: "2",
              title: "It tests your references.",
              body: "Comparisons in your copy that don't rank with that audience get flagged and dropped.",
            },
            {
              n: "3",
              title: "It rewrites, with receipts.",
              body: "Product facts stay as written; the hooks change. Every new reference comes from Qloo with its affinity score. The agent can't submit one Qloo didn't return.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-[28px] border border-line p-6">
              <div className="font-display text-3xl font-extrabold text-gold">{s.n}</div>
              <h2 className="mt-3 font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </section>
      )}

      {!running && !error && log.length === 0 && !results && (
        <section className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="font-display text-4xl font-extrabold tracking-tight">El veredicto</h2>
            <p className="text-[13px] text-muted">
              Sample layout · [brackets] stand in for real Qloo results
            </p>
          </div>
          <div className="mt-6 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SAMPLE_VERDICT.map((m, i) => {
              const w = WRAPPERS[i % WRAPPERS.length];
              return (
                <article
                  key={m.city}
                  className="flex flex-col gap-5 rounded-[28px] p-6"
                  style={{ background: w.bg, color: w.fg }}
                >
                  <div className="flex justify-between gap-3 text-[13px] font-semibold uppercase tracking-[0.08em]">
                    <span>{m.city}</span>
                    <span>{m.meta}</span>
                  </div>
                  <p className="font-display text-2xl font-bold leading-[1.25]">{m.headline}</p>
                  <p className="text-[15px] leading-relaxed" style={{ color: w.sub }}>
                    {m.sub}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em]">{m.verb}</span>
                    {m.refs.map((r) => (
                      <span key={r} className={m.struck ? "line-through decoration-2" : ""}>
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="rounded-md bg-white px-4 py-3.5 text-sm text-[#111111]">
                    <div className="border-b-8 border-[#111111] pb-1 font-display text-[22px] font-extrabold">
                      Taste facts
                    </div>
                    <div className="flex justify-between border-b border-[#111111] py-1.5 text-[11px] font-bold uppercase tracking-[0.06em]">
                      <span>From Qloo</span>
                      <span>Affinity</span>
                    </div>
                    {m.rows.map(([name, type], j) => (
                      <div
                        key={name}
                        className={`flex justify-between gap-3 py-1.5 ${
                          j === m.rows.length - 1 ? "border-b-4" : "border-b"
                        } border-[#111111]`}
                      >
                        <span>
                          <b>{name}</b> <span className="text-[#55554f]">{type}</span>
                        </span>
                        <span>[x.xx]</span>
                      </div>
                    ))}
                    <div className="pt-1.5 text-xs text-[#3d3d39]">
                      Product facts unchanged: 70%, six-day ferment, Bocas del Toro.
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-muted">
            Run it and these fill in with real Qloo entities and affinities. The agent can&apos;t submit a
            reference Qloo didn&apos;t return.
          </p>
        </section>
      )}

      {error && (
        <p className="mt-8 rounded-xl border border-mandarin/50 bg-panel px-4 py-3 text-mandarin">{error}</p>
      )}

      {log.length > 0 && (
        <section className="mt-8 rounded-[28px] border border-line bg-panel p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">The tasting notebook</h2>
          <ol className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {log.map((item, i) => (
              <li key={i} className={item.kind === "note" ? "italic text-muted" : ""}>
                {item.kind === "result" ? (
                  <span className="text-gold">↳ {item.names?.length ? item.names.join(" · ") : "no results"}</span>
                ) : (
                  item.text
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {results && results.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">El veredicto</h2>
          <div className="mt-6 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((m, i) => {
              const w = WRAPPERS[i % WRAPPERS.length];
              return (
                <article
                  key={m.city}
                  className="flex flex-col gap-5 rounded-[28px] p-6"
                  style={{ background: w.bg, color: w.fg }}
                >
                  <div className="flex justify-between gap-3 text-[13px] font-semibold uppercase tracking-[0.08em]">
                    <span>{m.city}</span>
                    <span>{m.language}</span>
                  </div>
                  <p className="whitespace-pre-line font-display text-2xl font-bold leading-[1.25]">{m.copy}</p>
                  {m.backTranslation && (
                    <p className="text-[15px] leading-relaxed" style={{ color: w.sub }}>
                      {m.backTranslation}
                    </p>
                  )}

                  {m.flags.length > 0 && (
                    <div className="text-[15px]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em]">Dropped</span>
                        {m.flags.map((f, j) => (
                          <span key={j} className="line-through decoration-2">
                            {f.original}
                          </span>
                        ))}
                      </div>
                      {m.flags.map((f, j) => (
                        <p key={j} className="mt-1.5 text-sm leading-snug" style={{ color: w.sub }}>
                          {f.problem} {f.evidence}
                        </p>
                      ))}
                    </div>
                  )}

                  {m.references.length > 0 && <TasteFacts references={m.references} />}

                  <button
                    type="button"
                    onClick={() => copyText(m.city, m.copy)}
                    className="self-start rounded-full border border-current px-5 py-2 text-[15px] font-semibold"
                  >
                    {copied === m.city ? "Copied" : "Copy"}
                  </button>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-muted">
            Every reference above was returned by Qloo during this run. The agent can&apos;t submit one that
            wasn&apos;t.
          </p>
        </section>
      )}

      <Waitlist />

      <footer className="mt-12 border-t border-line pt-6 text-sm text-muted">
        Built in Bocas del Toro, Panama, for the Qloo Agentic Hackathon. Taste data by Qloo.
      </footer>
    </main>
  );
}
