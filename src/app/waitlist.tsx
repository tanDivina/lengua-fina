"use client";

import Script from "next/script";
import { useState } from "react";

// Hero Inbox: Dorien's central inbox for every site's forms.
const SITE = "lengua-fina.vercel.app";

declare global {
  interface Window {
    HeroInbox?: { submit: (data: Record<string, unknown>, opts?: { notify?: boolean }) => Promise<unknown> };
  }
}

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (website) {
      setState("done"); // bots get the thank-you and nothing is sent
      return;
    }
    if (!window.HeroInbox) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      await window.HeroInbox.submit({ site: SITE, form: "waitlist", email, lang: "en", page: "/" });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="mt-14 rounded-[28px] border border-line bg-panel p-6 sm:p-8">
      <Script src="https://hero-inbox-2026.web.app/inbox.js" strategy="lazyOnload" />
      <h2 className="font-display text-3xl font-extrabold tracking-tight">
        Sell abroad, or translate for people who do?
      </h2>
      <p className="mt-2 max-w-xl text-muted">
        Leave your email and I&apos;ll let you know when Lengua Fina handles full product pages and more
        languages.
      </p>
      {state === "done" ? (
        <p className="mt-4 font-medium text-gold">Thank you. I&apos;ll be in touch.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-full border border-line bg-stage px-4 py-2.5 outline-none focus:border-gold"
          />
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="rounded-full bg-fg px-5 py-2.5 font-semibold text-stage transition hover:bg-gold disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Keep me posted"}
          </button>
        </form>
      )}
      {state === "error" && <p className="mt-2 text-sm text-mandarin">That didn&apos;t go through. Please try again.</p>}
    </section>
  );
}
