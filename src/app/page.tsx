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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-5xl tracking-tight text-cacao">Lengua Fina</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          Translation keeps the words and loses the references. Lengua Fina rewrites your product copy for each
          market using the artists, films, books and brands that audience actually loves, according to Qloo&apos;s
          taste data. Every reference it adds is traceable.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section className="space-y-6">
          <label className="block">
            <span className="text-sm font-medium">Product</span>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-card px-3 py-2 outline-none focus:border-cacao"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Source copy</span>
            <textarea
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
              rows={7}
              className="mt-1.5 w-full rounded-lg border border-line bg-card px-3 py-2 leading-relaxed outline-none focus:border-cacao"
            />
          </label>

          <div>
            <span className="text-sm font-medium">Markets</span>
            <div className="mt-1.5 space-y-3">
              {markets.map((m, i) => (
                <div key={i} className="rounded-lg border border-line bg-card p-3">
                  <div className="flex gap-2">
                    <input
                      value={m.city}
                      onChange={(e) => updateMarket(i, { city: e.target.value })}
                      placeholder="City"
                      className="w-1/2 rounded-md border border-line bg-paper px-2 py-1.5 outline-none focus:border-cacao"
                    />
                    <input
                      value={m.language}
                      onChange={(e) => updateMarket(i, { language: e.target.value })}
                      placeholder="Language"
                      className="w-1/2 rounded-md border border-line bg-paper px-2 py-1.5 outline-none focus:border-cacao"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {AGE_OPTIONS.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAge(i, a.value)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs ${
                          m.ages.includes(a.value)
                            ? "border-cacao bg-cacao text-paper"
                            : "border-line text-muted hover:border-cacao"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                    {markets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMarket(i)}
                        className="ml-auto text-xs text-muted underline-offset-2 hover:text-warn hover:underline"
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
                className="mt-2 text-sm text-cacao underline-offset-2 hover:underline"
              >
                Add a market
              </button>
            )}
          </div>

          <button
            onClick={run}
            disabled={running}
            className="w-full rounded-lg bg-cacao px-4 py-3 font-medium text-paper transition hover:opacity-90 disabled:opacity-60"
          >
            {running ? "Reading the room…" : "Transcreate"}
          </button>
        </section>

        <section className="min-w-0 space-y-6">
          {!running && !error && log.length === 0 && !results && (
            <div className="rounded-lg border border-dashed border-line p-6">
              <h2 className="font-display text-2xl text-cacao">How it works</h2>
              <ol className="mt-4 space-y-4 text-muted">
                <li>
                  <span className="font-medium text-ink">1. It reads the room.</span> For each market, the agent asks
                  Qloo which artists, films, books, brands and places that audience has affinity for.
                </li>
                <li>
                  <span className="font-medium text-ink">2. It tests your references.</span> It checks whether the
                  comparisons in your copy rank with that audience, and flags the ones that won&apos;t land.
                </li>
                <li>
                  <span className="font-medium text-ink">3. It rewrites, with receipts.</span> Product facts stay
                  the same; the hooks change. Every new reference comes from Qloo data and shows its source. The agent
                  can&apos;t submit a reference Qloo didn&apos;t return.
                </li>
              </ol>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-warn/40 bg-card px-4 py-3 text-warn">{error}</p>
          )}

          {log.length > 0 && (
            <div className="rounded-lg border border-line bg-card p-4">
              <h2 className="mb-3 text-sm font-medium text-muted">What the agent is doing</h2>
              <ol className="max-h-80 space-y-2 overflow-y-auto text-sm">
                {log.map((item, i) => (
                  <li key={i} className={item.kind === "note" ? "italic text-muted" : ""}>
                    {item.kind === "result" ? (
                      <span className="text-leaf">
                        ↳ {item.names?.length ? item.names.join(" · ") : "no results"}
                      </span>
                    ) : (
                      item.text
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {results?.map((m) => (
            <article key={m.city} className="rounded-lg border border-line bg-card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl text-cacao">
                  {m.city} <span className="text-base text-muted">· {m.language}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => copyText(m.city, m.copy)}
                  className="shrink-0 text-sm text-muted underline-offset-2 hover:text-cacao hover:underline"
                >
                  {copied === m.city ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line leading-relaxed">{m.copy}</p>
              {m.backTranslation && (
                <p className="mt-3 border-l-2 border-line pl-3 text-sm leading-relaxed text-muted">
                  {m.backTranslation}
                </p>
              )}

              {m.references.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted">References, from Qloo</h3>
                  <ul className="mt-2 space-y-2">
                    {m.references.map((r) => (
                      <li key={r.entity.id + r.phrase} className="text-sm">
                        <span className="font-medium text-leaf">{r.entity.name}</span>{" "}
                        <span className="text-muted">
                          ({r.entity.type.replace("urn:entity:", "")}
                          {r.entity.affinity !== null && `, affinity ${r.entity.affinity.toFixed(2)}`})
                        </span>
                        <span className="block text-muted">{r.why}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {m.flags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Won&apos;t land here</h3>
                  <ul className="mt-2 space-y-2">
                    {m.flags.map((f, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium text-warn">“{f.original}”</span>{" "}
                        <span>{f.problem}</span>
                        <span className="block text-muted">{f.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </section>
      </div>

      <Waitlist />

      <footer className="mt-10 text-sm text-muted">
        Built in Bocas del Toro, Panama, for the Qloo Agentic Hackathon. Taste data by Qloo.
      </footer>
    </main>
  );
}
