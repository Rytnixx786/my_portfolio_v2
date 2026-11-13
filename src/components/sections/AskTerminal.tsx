"use client";

import { useState, type FormEvent } from "react";
import { PaperPlaneRight, TerminalWindow, CaretDown } from "@phosphor-icons/react";

interface Exchange {
  q: string;
  a: string;
}

const SUGGESTIONS = [
  "How does Cinch achieve 4.12ms?",
  "What did Mehedi build at FlyRank?",
  "Explain Nexus Researcher's 91% refusal",
  "What is his backend stack?",
] as const;

export function AskTerminal() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([
    {
      q: "status",
      a: "Ready. Ask anything about Cinch, Nexus Researcher, ARES, MindStack, OFFBoarder, MaSheba AI, FlyRank, or benchmarks (or press Cmd/Ctrl+K anywhere).",
    },
  ]);

  async function submitQuestion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setQuery("");

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as { text?: string };
      const answer =
        data.text ??
        "Could not reach the query endpoint. Inspect /work/[slug] for full system specifications.";
      setHistory((prev) => [...prev.slice(-4), { q: trimmed, a: answer }]);
    } catch {
      setHistory((prev) => [
        ...prev.slice(-4),
        {
          q: trimmed,
          a: "Network unavailable. Use the case study pages above for complete metrics and code.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submitQuestion(query);
  }

  return (
    <div className="double-bezel-outer mt-14">
      <div className="double-bezel-core overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5 font-mono text-xs text-[#38BDF8]">
            <TerminalWindow className="h-4 w-4" weight="regular" aria-hidden="true" />
            <span className="font-semibold">&gt;_ ask</span>
            <span className="text-[#6E7681]" aria-hidden="true">
              /
            </span>
            <span className="text-[#8B949E]">Grounded /api/query console</span>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors duration-300 hover:border-[#38BDF8] hover:text-[#38BDF8]"
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

        {open && (
          <div className="space-y-4 bg-[#161B22] p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void submitQuestion(s)}
                  className="rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1.5 font-mono text-xs text-[#7DD3FC] transition-colors duration-300 hover:border-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0D1117]"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="editorial-scroll max-h-56 space-y-3 overflow-y-auto rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4 font-mono text-xs leading-relaxed">
              {history.map((item, i) => (
                <div key={`${item.q}-${i}`} className="space-y-1">
                  <div className="font-semibold text-[#E6EDF3]">
                    <span className="text-[#38BDF8]">$</span> {item.q}
                  </div>
                  <div className="text-[#8B949E]">{item.a}</div>
                </div>
              ))}
              {loading && (
                <div className="text-[#38BDF8]">Evaluating query...</div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
              <label htmlFor="ask-terminal-input" className="sr-only">
                Ask a question about Mehedi Hasan&apos;s systems
              </label>
              <input
                id="ask-terminal-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about Cinch, FlyRank, benchmarks, or stack..."
                className="h-11 min-w-0 flex-1 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] px-4 font-mono text-sm text-[#E6EDF3] placeholder:text-[#6E7681] focus:border-[#38BDF8] focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#38BDF8] px-5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#0D1117] transition-all duration-300 hover:bg-[#7DD3FC] active:scale-[0.98] disabled:opacity-45"
              >
                <span>Run</span>
                <PaperPlaneRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
