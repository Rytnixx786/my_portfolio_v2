"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { useBodyScrollLock, useCopy, useQueryConsole } from "@/hooks/usePortfolioUtils";
import { MOTION, normalizeRoutePath, runViewTransition } from "@/lib/motion";
import { TransitionLink } from "@/components/chrome/TransitionLink";

const SUGGESTIONS = [
  "How does Cinch achieve 4.12ms?",
  "What did Mehedi build at FlyRank?",
  "Explain Nexus Researcher's 91% refusal",
  "How does MindStack enforce groundedness?",
] as const;

export function CommandPalette() {
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const { copied, copy } = useCopy(2000);
  const { query, setQuery, loading, history, submitQuestion } = useQueryConsole([
    {
      q: "sys.status",
      a: "Connected to grounded /api/query index. Ask about benchmarks, architecture tradeoffs, or jump to any case study.",
      citations: [{ label: "Recruiter Brief", href: "/brief" }],
    },
  ]);

  useBodyScrollLock(open);

  const openModal = useCallback(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (document.activeElement instanceof HTMLElement) {
      lastFocusedRef.current = document.activeElement;
    }
    if (!dlg.open) dlg.showModal();
    window.dispatchEvent(new CustomEvent("portfolio:top-layer-raise"));
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const closeModal = useCallback((restoreFocus = true) => {
    const dlg = dialogRef.current;
    if (dlg?.open) dlg.close();
    setOpen(false);
    if (restoreFocus && lastFocusedRef.current?.isConnected) {
      const trigger = lastFocusedRef.current;
      lastFocusedRef.current = null;
      window.requestAnimationFrame(() => trigger.focus());
    } else if (!restoreFocus) {
      lastFocusedRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) closeModal(true);
        else openModal();
      }
    };

    const onOpenEvent = () => openModal();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("portfolio:open-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("portfolio:open-palette", onOpenEvent);
    };
  }, [openModal, closeModal]);

  const handleNavigate = (href: string) => {
    closeModal(false);
    const currentPath = normalizeRoutePath(pathname || "/");
    if (href.startsWith("/#") && currentPath === "/") {
      const id = href.slice(2);
      const el = document.getElementById(id);
      if (el && window.__portfolioScrollTo) {
        window.__portfolioScrollTo(el);
        return;
      }
    }

    const targetPath = normalizeRoutePath(href);
    if (targetPath === currentPath) {
      router.push(href);
      return;
    }

    void runViewTransition(
      () => {
        router.push(href);
      },
      {
        waitForCommit: true,
        timeoutMs: MOTION.viewTransitionTimeoutMs,
      }
    );
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submitQuestion(query);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Interactive system command palette"
      onCancel={(e) => {
        e.preventDefault();
        closeModal();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeModal();
      }}
      className="palette-dialog m-auto max-h-[90dvh] w-[min(740px,94vw)] rounded-3xl border border-[rgba(240,246,252,0.14)] bg-[#161B22] p-0 text-[#E6EDF3] shadow-2xl"
    >
      <div className="flex flex-col overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-[#38BDF8]">
            <TerminalWindow className="h-4 w-4 shrink-0" weight="regular" aria-hidden="true" />
            <span className="whitespace-nowrap font-semibold">command://query</span>
            <span className="hidden whitespace-nowrap text-[#8B949E] sm:inline">· SSE /api/query</span>
          </div>
          <button
            type="button"
            onClick={() => closeModal(true)}
            aria-label="Close command palette"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#9DA7B3] hover:border-[#38BDF8] hover:text-[#E6EDF3]"
          >
            <X className="h-4 w-4" weight="regular" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <MagnifyingGlass className="h-4 w-4 shrink-0 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about Cinch, Nexus, ARES, benchmarks..."
              className="min-w-0 w-full bg-transparent font-sans text-sm text-[#E6EDF3] placeholder:text-[#8B949E] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-[#38BDF8] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#0D1117] disabled:opacity-40"
            >
              <span>{loading ? "..." : "Run"}</span>
              <PaperPlaneRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
            </button>
          </div>
        </form>

        <div
          data-lenis-prevent
          className="max-h-[62dvh] space-y-5 overflow-y-auto p-4 sm:max-h-[55vh] sm:p-5 editorial-scroll"
        >
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
              Suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void submitQuestion(s)}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] px-3.5 py-2 font-mono text-xs text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4" aria-live="polite">
            {history.slice(-2).map((item, idx) => (
              <div key={`${item.q}-${idx}`} className="space-y-1.5">
                <p className="font-mono text-xs text-[#38BDF8]">$ {item.q}</p>
                <p className="font-sans text-sm leading-relaxed text-[#E6EDF3]">{item.a}</p>
                {item.citations && item.citations.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.citations.map((c) => (
                      <TransitionLink
                        key={c.href}
                        href={c.href}
                        onClick={() => closeModal(false)}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
                Case Studies
              </p>
              <ul className="space-y-1">
                {projects.map((p) => (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(`/work/${p.slug}`)}
                      className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2 text-left font-mono text-xs text-[#9DA7B3] hover:bg-[#1C222B] hover:text-[#E6EDF3]"
                    >
                      <span>{p.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
                Navigation & Actions
              </p>
              <ul className="space-y-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2 text-left font-mono text-xs text-[#9DA7B3] hover:bg-[#1C222B] hover:text-[#E6EDF3]"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => void copy(profile.email)}
                    className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2 text-left font-mono text-xs text-[#9DA7B3] hover:bg-[#1C222B] hover:text-[#E6EDF3]"
                  >
                    <span>{copied ? "Copied email!" : `Copy ${profile.email}`}</span>
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#10B981]" weight="regular" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                    )}
                  </button>
                </li>
                <li>
                  <a
                    href={profile.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => closeModal(false)}
                    className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2 text-left font-mono text-xs text-[#38BDF8] hover:bg-[#1C222B]"
                  >
                    <span>Open Resume PDF</span>
                    <FilePdf className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
