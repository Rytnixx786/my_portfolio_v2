"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";

/**
 * Shared clipboard copy hook with auto-reset feedback.
 */
export function useCopy(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs]
  );

  return { copied, copy };
}

export interface QueryExchange {
  q: string;
  a: string;
  citations?: Array<{ label: string; href: string }>;
  source?: string;
}

/**
 * Shared /api/query console hook supporting progressive SSE streaming with automatic JSON fallback.
 */
export function useQueryConsole(initialHistory: QueryExchange[]) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QueryExchange[]>(initialHistory);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const submitQuestion = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setQuery("");

      const pendingIdx = Date.now();
      setHistory((prev) => [
        ...prev.slice(-4),
        { q: trimmed, a: "Querying verified project index...", citations: [] },
      ]);

      try {
        const res = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
          },
          body: JSON.stringify({ message: trimmed }),
          signal: controller.signal,
        });

        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("text/event-stream") && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let accumulated = "";
          let citations: Array<{ label: string; href: string }> = [];
          let source = "stream";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const rawEvent of events) {
              const lines = rawEvent.split("\n");
              let eventName = "message";
              const dataLines: string[] = [];

              for (const line of lines) {
                if (line.startsWith("event:")) {
                  eventName = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                  dataLines.push(line.slice(5).trim());
                }
              }

              if (dataLines.length === 0) continue;
              const payloadRaw = dataLines.join("\n");
              try {
                const payload = JSON.parse(payloadRaw) as {
                  chunk?: string;
                  text?: string;
                  citations?: Array<{ label: string; href: string }>;
                  source?: string;
                };
                if (eventName === "meta" || payload.citations) {
                  citations = payload.citations ?? citations;
                  source = payload.source ?? source;
                }
                if (payload.chunk) {
                  accumulated += payload.chunk;
                }
                if (payload.text) {
                  accumulated = payload.text;
                }
                setHistory((prev) => {
                  const next = [...prev];
                  const last = next.length - 1;
                  if (last >= 0) {
                    next[last] = {
                      q: trimmed,
                      a: accumulated || "Streaming...",
                      citations,
                      source,
                    };
                  }
                  return next;
                });
              } catch {
                // Ignore keep-alive comments or partial SSE chunks
              }
            }
          }
          void pendingIdx;
        } else {
          const data = (await res.json()) as {
            text?: string;
            error?: string;
            citations?: Array<{ label: string; href: string }>;
            source?: string;
          };
          const answer =
            data.text ??
            data.error ??
            "Could not reach /api/query. Browse /work/[slug] for complete system metrics.";
          setHistory((prev) => {
            const next = [...prev];
            const last = next.length - 1;
            if (last >= 0) {
              next[last] = {
                q: trimmed,
                a: answer,
                citations: data.citations ?? [],
                source: data.source,
              };
            }
            return next;
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setHistory((prev) => {
          const next = [...prev];
          const last = next.length - 1;
          if (last >= 0) {
            next[last] = {
              q: trimmed,
              a: "Network unavailable. Inspect the case study pages for complete metrics and code.",
              citations: [],
            };
          }
          return next;
        });
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  return { query, setQuery, loading, history, submitQuestion };
}

/**
 * Unified WebGL + static-pose decision hook (Section 7.5).
 * Reduced-motion preserves interactive 3D geometry in a crisp static pose rather than erasing it.
 */
export function useCanRender3D() {
  const ctx = useWebGLContext();
  const canRender3D =
    ctx.hasMounted && ctx.webglSupported && ctx.effectiveTier !== "low" && !ctx.contextLost;

  return {
    ...ctx,
    canRender3D,
    isStaticPose: ctx.reducedMotion,
    dprCap: ctx.effectiveTier === "high" ? 1.85 : 1.35,
  };
}

/**
 * Coordinates body scroll lock + Lenis pause across drawers, dialogs, and mobile navigation.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__portfolioLenis?.stop();
    return () => {
      document.body.style.overflow = prev;
      window.__portfolioLenis?.start();
    };
  }, [locked]);
}

