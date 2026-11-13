"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  FilePdf,
  MagnifyingGlass,
  PaperPlaneRight,
  TerminalWindow,
  X,
} from "@phosphor-icons/react";
import { projects } from "@/data/projects";
import { nav, profile } from "@/data/site";

interface Exchange {
  q: string;
  a: string;
}

const SUGGESTIONS = [
  "How does Cinch achieve 4.12ms?",
  "What did Mehedi build at FlyRank?",
  "Explain Nexus Researcher's 91% refusal",
  "How does MindStack enforce groundedness?",
] as const;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([
    {
      q: "sys.status",
      a: "Connected to grounded profile query engine (/api/query). Ask about benchmarks, architectures, or jump directly to any case study.",
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  const closePalette = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    const onOpenEvent = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("portfolio:open-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("portfolio:open-palette", onOpenEvent);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      window.__portfolioLenis?.stop();
      window.setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      document.body.style.overflow = "";
      window.__portfolioLenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      window.__portfolioLenis?.start();
    };
  }, [open]);

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
        "Could not reach /api/query. Browse /work/[slug] for complete system metrics.";
      setHistory((prev) => [...prev.slice(-4), { q: trimmed, a: answer }]);
    } catch {
      setHistory((prev) => [
        ...prev.slice(-4),
        {
          q: trimmed,
          a: "Network request failed. Inspect case study pages for offline architecture specifications.",
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

  function navigateTo(href: string) {
    closePalette();
    if (href.startsWith("/#") && window.location.pathname === "/") {
      const id = href.slice(2);
      const target = document.getElementById(id);
      if (target) {
        if (window.__portfolioLenis) {
          window.__portfolioLenis.scrollTo(target, { offset: -76 });
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
        return;
      }
    }
    router.push(href);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  }

  if (!open) return null;

  const trimmedLower = query.trim().toLowerCase();
  const matchingProjects = trimmedLower
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedLower) ||
          p.category.toLowerCase().includes(trimmedLower) ||
          p.tech.some((t) => t.toLowerCase().includes(trimmedLower))
      )
    : projects.slice(0, 4);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Systems Command Palette and Ask Terminal"
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#0D1117]/80 px-4 pt-[8vh] pb-6 backdrop-blur-md sm:pt-[11vh]"
      onClick={closePalette}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="double-bezel-outer w-full max-w-2xl shadow-[0_28px_70px_-16px_rgba(0,0,0,0.75)]"
      >
        <div className="double-bezel-core overflow-hidden bg-[#161B22]">
          {/* Header Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 border-b border-[rgba(240,246,252,0.1)] bg-[#1C222B] px-4 py-3.5"
          >
            <MagnifyingGlass
              className="h-4 w-4 shrink-0 text-[#38BDF8]"
              weight="regular"
              aria-hidden="true"
            />
            <label htmlFor="cmd-palette-input" className="sr-only">
              Search systems or ask /api/query a question
            </label>
            <input
              ref={inputRef}
              id="cmd-palette-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about Cinch, FlyRank, benchmarks... or filter routes"
              className="min-w-0 flex-1 bg-transparent font-mono text-sm text-[#E6EDF3] placeholder:text-[#6E7681] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#38BDF8] px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0D1117] transition-colors hover:bg-[#7DD3FC] disabled:opacity-40"
            >
              <span>Query</span>
              <PaperPlaneRight className="h-3 w-3" weight="regular" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={closePalette}
              aria-label="Close command palette"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#8B949E] transition-colors hover:border-[#38BDF8]/45 hover:text-[#E6EDF3]"
            >
              <X className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>
          </form>

          <div className="editorial-scroll max-h-[68vh] space-y-5 overflow-y-auto p-4 sm:p-5">
            {/* Suggested Queries */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6E7681]">
                Grounded /api/query Prompts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void submitQuestion(item)}
                    className="rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[11px] text-[#7DD3FC] transition-colors hover:border-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0D1117]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Grounded Output Console */}
            <div className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-3.5 font-mono text-xs leading-relaxed">
              <div className="mb-2 flex items-center gap-2 border-b border-[rgba(240,246,252,0.08)] pb-2 text-[10px] uppercase tracking-[0.14em] text-[#38BDF8]">
                <TerminalWindow className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                <span>Response Stream</span>
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-[#10B981]"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-2.5">
                {history.map((item, idx) => (
                  <div key={`${item.q}-${idx}`} className="space-y-0.5">
                    <div className="font-semibold text-[#E6EDF3]">
                      <span className="text-[#38BDF8]">$</span> {item.q}
                    </div>
                    <div className="text-[#8B949E]">{item.a}</div>
                  </div>
                ))}
                {loading && (
                  <div className="text-[#38BDF8]">Evaluating grounded index...</div>
                )}
              </div>
            </div>

            {/* Quick Case Study Jumps */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6E7681]">
                System Case Studies
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {matchingProjects.map((project) => (
                  <button
                    key={project.slug}
                    type="button"
                    onClick={() => navigateTo(`/work/${project.slug}`)}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-3.5 py-2.5 text-left transition-colors hover:border-[#38BDF8]/45"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold uppercase tracking-tight text-[#E6EDF3] group-hover:text-[#38BDF8]">
                        {project.name}
                      </p>
                      <p className="truncate font-mono text-[10px] text-[#8B949E]">
                        {project.highlightMetrics[0]?.value}{" "}
                        {project.highlightMetrics[0]?.label}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-[#6E7681] transition-transform group-hover:translate-x-0.5 group-hover:text-[#38BDF8]"
                      weight="regular"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Section Jumps & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(240,246,252,0.08)] pt-3.5">
              <div className="flex flex-wrap gap-1.5">
                {nav.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigateTo(item.href)}
                    className="rounded-full border border-[rgba(240,246,252,0.1)] bg-[#1C222B] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8B949E] transition-colors hover:border-[#38BDF8]/45 hover:text-[#E6EDF3]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyEmail()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#1C222B] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#E6EDF3] hover:border-[#38BDF8]/45"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                      <span className="text-[#10B981]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-[#38BDF8]" aria-hidden="true" />
                      <span>Email</span>
                    </>
                  )}
                </button>
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#7DD3FC] hover:bg-[#38BDF8] hover:text-[#0D1117]"
                >
                  <FilePdf className="h-3 w-3" aria-hidden="true" />
                  <span>CV</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

