"use client";

import { useEffect, useState } from "react";

// Counts a stat up from 0 once on mount; shows the final value under reduced motion.
function Stat({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now() + 350; // let the strip's rise begin first
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(Math.max((t - start) / dur, 0), 1);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <div className="font-display text-5xl font-extrabold tracking-tight text-gold tabular-nums">
      {val}
      {suffix}
    </div>
  );
}
import type { AgentEvent, MarketResult } from "@/lib/agent";
import type { AgeRange } from "@/lib/qloo";
import { DEMOS, DEMO_RAN_AT } from "@/data/demos";
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

// One-click market suggestions. The language is what the agent writes in;
// variants like "German (Austria)" steer regional usage.
const SUGGESTED_MARKETS: { city: string; language: string }[] = [
  { city: "Tokyo", language: "Japanese" },
  { city: "Brussels", language: "French" },
  { city: "Austin", language: "English" },
  { city: "Paris", language: "French" },
  { city: "Berlin", language: "German (Germany)" },
  { city: "Munich", language: "German (Germany)" },
  { city: "Zurich", language: "German (Switzerland)" },
  { city: "Vienna", language: "German (Austria)" },
  { city: "Amsterdam", language: "Dutch (Netherlands)" },
  { city: "Antwerp", language: "Dutch (Flemish)" },
  { city: "Seoul", language: "Korean" },
  { city: "New York", language: "English" },
  { city: "Los Angeles", language: "English" },
  { city: "London", language: "English" },
  { city: "Mexico City", language: "Spanish (Mexico)" },
  { city: "Madrid", language: "Spanish (Spain)" },
  { city: "Milan", language: "Italian" },
  { city: "São Paulo", language: "Portuguese (Brazil)" },
];

const CITY_LANGUAGE = new Map(SUGGESTED_MARKETS.map((s) => [s.city.toLowerCase(), s.language]));

const LANGUAGE_OPTIONS = [
  ...new Set([
    ...SUGGESTED_MARKETS.map((s) => s.language),
    "French (Belgium)",
    "Portuguese (Portugal)",
    "Spanish",
    "German",
    "Dutch",
    "Portuguese",
  ]),
];

type LogItem = { kind: "tool" | "result" | "note"; text: string; names?: string[] };

// Wrapper colors for the market cards, cycled in order.
const WRAPPERS = [
  { bg: "#2433c8", fg: "#ffffff", sub: "#dde1ff" },
  { bg: "#ff7a45", fg: "#141414", sub: "#2e2a27" },
  { bg: "#ffd24a", fg: "#141414", sub: "#2e2a27" },
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

function VerdictCard({
  m,
  wrapper: w,
  copied,
  onCopy,
}: {
  m: MarketResult;
  wrapper: (typeof WRAPPERS)[number];
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <article className="flex flex-col gap-5 rounded-[28px] p-6" style={{ background: w.bg, color: w.fg }}>
      <div className="flex justify-between gap-3 text-[13px] font-semibold uppercase tracking-[0.08em]">
        <span>{m.city}</span>
        <span>{m.language}</span>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.08em]">Transcreation</div>
        <p className="mt-1.5 whitespace-pre-line font-display text-2xl font-bold leading-[1.25]">{m.copy}</p>
      </div>
      {m.backTranslation && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em]">Back-translation</div>
          <p className="mt-1 text-[15px] leading-relaxed" style={{ color: w.sub }}>
            {m.backTranslation}
          </p>
        </div>
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
        onClick={onCopy}
        className="self-start rounded-full border border-current px-5 py-2 text-[15px] font-semibold"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </article>
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
  const [perked, setPerked] = useState(false);
  const [demoId, setDemoId] = useState(DEMOS[0].id);

  // Deep link: /?demo=german opens that saved run.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("demo");
    if (q && DEMOS.some((d) => d.id === q)) setDemoId(q);
  }, []);

  // Fade .reveal sections up once they scroll into view.
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-in)");
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // Re-run when idle sections remount so they get observed again.
  }, [running, error, results]);

  const demo = DEMOS.find((d) => d.id === demoId) ?? DEMOS[0];

  function loadDemo() {
    setProduct(demo.product);
    setCopy(demo.copy);
    setMarkets(demo.markets.map((m) => ({ ...m, ages: [...m.ages] })));
    document.getElementById("workbench")?.scrollIntoView({ behavior: "smooth" });
  }

  function updateMarket(i: number, patch: Partial<Market>) {
    setMarkets((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  function addMarket() {
    setMarkets((ms) => [...ms, { city: "", ages: ["30_to_34", "35_to_44"], language: "English" }]);
  }

  // Chip click: fill the first empty slot, else add a slot, else swap the last one.
  function quickAdd(s: { city: string; language: string }) {
    setMarkets((ms) => {
      const empty = ms.findIndex((m) => !m.city.trim());
      if (empty >= 0)
        return ms.map((m, j) => (j === empty ? { ...m, city: s.city, language: s.language } : m));
      if (ms.length < 3)
        return [...ms, { city: s.city, language: s.language, ages: ["30_to_34", "35_to_44"] }];
      return ms.map((m, j) =>
        j === ms.length - 1 ? { ...m, city: s.city, language: s.language } : m
      );
    });
  }

  // Typing or picking a known city fills in its language, unless the user
  // already wrote a language of their own.
  function updateCity(i: number, city: string) {
    const auto = CITY_LANGUAGE.get(city.trim().toLowerCase());
    const cur = markets[i].language;
    const autofillable = !cur.trim() || LANGUAGE_OPTIONS.includes(cur);
    updateMarket(i, auto && autofillable ? { city, language: auto } : { city });
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
      <div className="rise flex flex-wrap items-center justify-between gap-4">
        <div className="font-display text-[26px] font-extrabold tracking-tight">
          lengua<span className="text-gold">·</span>fina
        </div>
        <div className="text-[13px] text-muted">Every reference, traceable to Qloo.</div>
      </div>

      <header className="mt-12 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="max-w-2xl">
          <p
            className="rise flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[12px] sm:tracking-[0.22em]"
            style={{ "--rise": "0.06s" } as React.CSSProperties}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
            Transcreation agent · taste data by Qloo
          </p>
          <h1
            className="rise mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tighter sm:text-7xl"
            style={{ "--rise": "0.12s" } as React.CSSProperties}
          >
            Your copy, read by <span className="text-[#95a2ff]">three</span>{" "}
            <span className="text-mandarin">different</span> <span className="text-gold">rooms.</span>
          </h1>
          <p
            className="rise mt-5 max-w-xl text-lg leading-relaxed text-muted"
            style={{ "--rise": "0.2s" } as React.CSSProperties}
          >
            Lengua Fina asks Qloo what each audience loves, drops the references that won&apos;t land, and
            rewrites around the ones that will. Every swap comes with its taste facts.
          </p>
          <div
            className="rise mt-7 flex flex-wrap items-center gap-3"
            style={{ "--rise": "0.28s" } as React.CSSProperties}
          >
            <a
              href="#workbench"
              onMouseEnter={() => setPerked(true)}
              onMouseLeave={() => setPerked(false)}
              onFocus={() => setPerked(true)}
              onBlur={() => setPerked(false)}
              className="rounded-full bg-fg px-7 py-3 font-display text-base font-bold text-stage transition hover:bg-gold"
            >
              Run your copy
            </a>
            <a
              href="#verdicto"
              className="rounded-full border border-line px-7 py-3 text-base font-medium text-muted transition hover:border-gold hover:text-fg"
            >
              Read a saved verdict
            </a>
          </div>
        </div>
        <div className="rise shrink-0" style={{ "--rise": "0.2s" } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/tamandua.svg"
            alt=""
            className={`mascot h-52 w-auto sm:h-72 ${running ? "mascot-busy" : ""} ${perked ? "mascot-perk" : ""}`}
          />
        </div>
      </header>

      <section className="rise mt-14 border-y border-line py-7" style={{ "--rise": "0.38s" } as React.CSSProperties}>
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
          <div className="sm:pr-8">
            <Stat to={76} suffix="%" />
            <p className="mt-1.5 text-sm leading-snug text-muted">
              of online shoppers prefer products with information in their own language
            </p>
          </div>
          <div className="sm:px-8">
            <Stat to={40} suffix="%" />
            <p className="mt-1.5 text-sm leading-snug text-muted">
              will never buy from a website in another language
            </p>
          </div>
          <div className="sm:pl-8">
            <div className="font-display text-5xl font-extrabold tracking-tight text-gold">0</div>
            <p className="mt-1.5 text-sm leading-snug text-muted">
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

      <section id="workbench" className="mt-6 scroll-mt-8 rounded-[28px] border border-line bg-panel p-5 sm:p-8">
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
            <datalist id="lf-cities">
              {SUGGESTED_MARKETS.map((s) => (
                <option key={s.city} value={s.city} />
              ))}
            </datalist>
            <datalist id="lf-languages">
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED_MARKETS.filter(
                (s) => !markets.some((m) => m.city.trim().toLowerCase() === s.city.toLowerCase())
              )
                .slice(0, 8)
                .map((s) => (
                  <button
                    key={s.city}
                    type="button"
                    onClick={() => quickAdd(s)}
                    title={s.language}
                    className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:border-gold hover:text-fg"
                  >
                    + {s.city}
                  </button>
                ))}
            </div>
            <div className="mt-3 space-y-3">
              {markets.map((m, i) => (
                <div key={i} className="rounded-xl border border-line bg-stage p-3">
                  <div className="flex gap-2">
                    <input
                      value={m.city}
                      onChange={(e) => updateCity(i, e.target.value)}
                      placeholder="City"
                      list="lf-cities"
                      className="w-1/2 rounded-lg border border-line bg-panel px-2.5 py-1.5 outline-none focus:border-gold"
                    />
                    <input
                      value={m.language}
                      onChange={(e) => updateMarket(i, { language: e.target.value })}
                      placeholder="Language"
                      list="lf-languages"
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
          ].map((s, i) => (
            <div
              key={s.n}
              className="reveal rounded-[28px] border border-line p-6"
              style={{ "--reveal": `${i * 0.1}s` } as React.CSSProperties}
            >
              <div className="font-display text-3xl font-extrabold text-gold">{s.n}</div>
              <h2 className="mt-3 font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </section>
      )}

      {!running && !error && log.length === 0 && !results && (
        <section id="verdicto" className="reveal mt-14 scroll-mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="font-display text-4xl font-extrabold tracking-tight">El veredicto</h2>
            <p className="text-[13px] text-muted">Saved runs of the real agent · {DEMO_RAN_AT}</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {DEMOS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDemoId(d.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  d.id === demoId
                    ? "border-gold bg-gold text-stage"
                    : "border-line text-muted hover:border-gold"
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={loadDemo}
              className="ml-auto text-sm text-gold underline-offset-2 hover:underline"
            >
              Load this example into the form
            </button>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-muted">
            <span className="text-fg">{demo.product}.</span> &ldquo;{demo.copy.slice(0, 120)}…&rdquo;
          </p>
          <div className="mt-5 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {demo.results.map((m, i) => (
              <VerdictCard
                key={demo.id + m.city}
                m={m}
                wrapper={WRAPPERS[i % WRAPPERS.length]}
                copied={copied === demo.id + m.city}
                onCopy={() => copyText(demo.id + m.city, m.copy)}
              />
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            These are unedited results from real runs against Qloo and Claude, saved so you can read them
            without waiting. Every reference was returned by Qloo during its run; the agent can&apos;t submit
            one that wasn&apos;t. Load an example above and run it yourself for a fresh read.
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
            {results.map((m, i) => (
              <VerdictCard
                key={m.city}
                m={m}
                wrapper={WRAPPERS[i % WRAPPERS.length]}
                copied={copied === m.city}
                onCopy={() => copyText(m.city, m.copy)}
              />
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Every reference above was returned by Qloo during this run. The agent can&apos;t submit one that
            wasn&apos;t.
          </p>
        </section>
      )}

      <div className="reveal">
        <Waitlist />
      </div>

      <footer className="mt-12 border-t border-line pt-6 text-sm text-muted">
        Built in Bocas del Toro, Panama, for the Qloo Agentic Hackathon. Taste data by Qloo.
      </footer>
    </main>
  );
}
