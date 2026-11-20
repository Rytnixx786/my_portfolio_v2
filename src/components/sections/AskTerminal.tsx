"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CaretDown, PaperPlaneRight, TerminalWindow } from "@phosphor-icons/react";
import { useQueryConsole } from "@/hooks/usePortfolioUtils";
import { TransitionLink } from "@/components/chrome/TransitionLink";

gsap.registerPlugin(ScrollTrigger);

const SUGGESTIONS = [
  "How does Cinch achieve 4.12ms?",
  "Why did Tally flag Cinch's 3.7% cache bug?",
  "How does Lexicon get +36.2 pts & 0/90 SQLi?",
  "Explain Nexus Researcher's 91% refusal",
] as const;

/**
 * Grounded engineering Q&A terminal using progressive SSE streaming.
 * Starts collapsed by default to keep initial homepage height focused (Phase 2).
 */
export function AskTerminal() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const didToggleRef = useRef(false);
  const { query, setQuery, loading, history, submitQuestion } = useQueryConsole([
    {
      q: "status",
      a: "Ready. Ask anything about Cinch, Tally, Lexicon, Nexus Researcher, ARES, MindStack, OFFBoarder, MaSheba AI, FlyRank, or press Ctrl/Cmd+K anywhere.",
      citations: [{ label: "Recruiter Brief", href: "/brief" }],
    },
  ]);

  useEffect(() => {
    if (!didToggleRef.current) {
      didToggleRef.current = true;
      return;
    }
    const timers: number[] = [];
    if (open) {
      timers.push(window.setTimeout(() => inputRef.current?.focus(), 140));
    }
    timers.push(window.setTimeout(() => ScrollTrigger.refresh(), 300));
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submitQuestion(query);
  }

  return (
    <div className="double-bezel-outer mt-12">
      <div className="double-bezel-core overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5 font-mono text-xs text-[#38BDF8]">
            <TerminalWindow className="h-4 w-4" weight="regular" aria-hidden="true" />
            <span className="font-semibold">&gt;_ ask</span>
            <span className="text-[#8B949E]" aria-hidden="true">
              /
            </span>
            <span className="text-[#9DA7B3]">Interactive /api/query console (SSE)</span>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="ask-terminal-body"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] transition-colors duration-300 hover:border-[#38BDF8] hover:text-[#38BDF8]"
          >
            <span>{open ? "Collapse" : "Open console"}</span>
            <CaretDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
              weight="regular"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          id="ask-terminal-body"
          data-open={open ? "true" : "false"}
          inert={!open ? true : undefined}
          className="reveal-collapsible"
        >
          <div className="overflow-hidden">
            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void submitQuestion(item)}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] px-3.5 py-2 font-mono text-xs text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div
                data-lenis-prevent
                className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4 editorial-scroll"
                aria-live="polite"
              >
                {history.map((exchange, idx) => (
                  <div key={`${exchange.q}-${idx}`} className="space-y-1.5">
                    <p className="font-mono text-xs text-[#38BDF8]">$ {exchange.q}</p>
                    <p className="font-sans text-sm leading-relaxed text-[#E6EDF3]">
                      {exchange.a}
                    </p>
                    {exchange.citations && exchange.citations.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {exchange.citations.map((c) => (
                          <TransitionLink
                            key={c.href}
                            href={c.href}
                            className="inline-flex min-h-[44px] items-center rounded-md border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-xs text-[#7DD3FC] hover:bg-[#38BDF8]/20"
                          >
                            {c.label} ↗
                          </TransitionLink>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Ask a grounded engineering question"
                  placeholder="Ask about Cinch, Tally, Lexicon, ARES, FlyRank, or stack..."
                  className="min-h-[44px] flex-1 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] px-4 font-sans text-sm text-[#E6EDF3] placeholder:text-[#8B949E] focus:border-[#38BDF8] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#38BDF8] px-6 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#0D1117] transition-colors hover:bg-[#7DD3FC] disabled:opacity-45"
                >
                  <span>{loading ? "Streaming..." : "Send"}</span>
                  <PaperPlaneRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
