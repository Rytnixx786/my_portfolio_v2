"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";
import type { DeviceTier } from "@/lib/device-tier";

let spotlightEpoch = 0;
let spotlightListenersBound = false;
const cachedRectMap = new WeakMap<HTMLElement, { rect: DOMRect; epoch: number }>();
const pendingSpotlightMap = new WeakMap<
  HTMLElement,
  {
    rafId: number | null;
    clientX: number;
    clientY: number;
    parallax: boolean;
  }
>();

function ensureSpotlightEpochListeners() {
  if (spotlightListenersBound || typeof window === "undefined") return;
  spotlightListenersBound = true;
  const bump = () => {
    spotlightEpoch += 1;
  };
  window.addEventListener("scroll", bump, { passive: true });
  window.addEventListener("resize", bump, { passive: true });
}

export function primeElementRect(el: HTMLElement): DOMRect {
  ensureSpotlightEpochListeners();
  const rect = el.getBoundingClientRect();
  cachedRectMap.set(el, { rect, epoch: spotlightEpoch });
  return rect;
}

export function getCachedElementRect(el: HTMLElement): DOMRect {
  ensureSpotlightEpochListeners();
  const cached = cachedRectMap.get(el);
  if (cached && cached.epoch === spotlightEpoch) {
    return cached.rect;
  }
  return primeElementRect(el);
}

export function handleSpotlightEnter(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType === "touch") return;
  primeElementRect(event.currentTarget);
}

export function handleSpotlightMove(
  event: ReactPointerEvent<HTMLElement>,
  parallax = false
) {
  if (event.pointerType === "touch") return;
  const el = event.currentTarget;
  let pending = pendingSpotlightMap.get(el);
  if (!pending) {
    pending = {
      rafId: null,
      clientX: event.clientX,
      clientY: event.clientY,
      parallax,
    };
    pendingSpotlightMap.set(el, pending);
  } else {
    pending.clientX = event.clientX;
    pending.clientY = event.clientY;
    pending.parallax = parallax;
  }

  if (pending.rafId !== null) return;
  pending.rafId = window.requestAnimationFrame(() => {
    const state = pendingSpotlightMap.get(el);
    if (!state) return;
    state.rafId = null;
    const rect = getCachedElementRect(el);
    const relX = state.clientX - rect.left;
    const relY = state.clientY - rect.top;
    el.style.setProperty("--mouse-x", `${relX.toFixed(1)}px`);
    el.style.setProperty("--mouse-y", `${relY.toFixed(1)}px`);

    if (state.parallax && rect.width > 0 && rect.height > 0) {
      const nx = relX / rect.width - 0.5;
      const ny = relY / rect.height - 0.5;
      el.style.setProperty("--plate-px", `${(nx * 8).toFixed(2)}px`);
      el.style.setProperty("--plate-py", `${(ny * 8).toFixed(2)}px`);
    }
  });
}

export function handleSpotlightLeave(
  event: ReactPointerEvent<HTMLElement>,
  resetParallax = false
) {
  const el = event.currentTarget;
  const pending = pendingSpotlightMap.get(el);
  if (pending && pending.rafId !== null) {
    window.cancelAnimationFrame(pending.rafId);
    pending.rafId = null;
  }
  if (resetParallax) {
    el.style.setProperty("--plate-px", "0px");
    el.style.setProperty("--plate-py", "0px");
  }
}

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

      setHistory((prev) => [
        ...prev.slice(-4),
        { q: trimmed, a: "Querying verified project index...", citations: [] },
      ]);

      try {
        const timeoutSignal =
          typeof AbortSignal.timeout === "function"
            ? AbortSignal.timeout(10_000)
            : undefined;
        const signal =
          timeoutSignal && typeof AbortSignal.any === "function"
            ? AbortSignal.any([controller.signal, timeoutSignal])
            : controller.signal;

        const res = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
          },
          body: JSON.stringify({ message: trimmed }),
          signal,
        });

        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok) {
          let errMsg = `Query service returned HTTP ${res.status}. Browse /work/[slug] for system specs.`;
          if (contentType.includes("application/json")) {
            try {
              const errData = (await res.json()) as { error?: string; text?: string };
              errMsg = errData.error ?? errData.text ?? errMsg;
            } catch {
              // Keep HTTP status fallback
            }
          }
          setHistory((prev) => {
            const next = [...prev];
            const last = next.length - 1;
            if (last >= 0) {
              next[last] = { q: trimmed, a: errMsg, citations: [] };
            }
            return next;
          });
          return;
        }

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

export interface Render3DContextInput {
  hasMounted: boolean;
  webglSupported: boolean;
  effectiveTier: DeviceTier;
  contextLost: boolean;
  reducedMotion: boolean;
}

/**
 * Pure selector computing 3D eligibility and static-pose mode from WebGL context state.
 */
export function deriveRender3DState<T extends Render3DContextInput>(ctx: T) {
  const canRender3D =
    ctx.hasMounted && ctx.webglSupported && ctx.effectiveTier !== "low" && !ctx.contextLost;

  return {
    ...ctx,
    canRender3D,
    // Keep interactive 3D telemetry/orbit scenes animating smoothly even when OS
    // "Animation effects" sets prefers-reduced-motion; our scenes avoid jarring motion
    // and users can switch to 2D SAFE anytime via the HUD.
    isStaticPose: false,
    dprCap: ctx.effectiveTier === "high" ? 1.75 : 1.25,
  };
}

/**
 * Unified WebGL + static-pose decision hook (Section 7.5).
 * Reduced-motion preserves interactive 3D geometry in a crisp static pose rather than erasing it.
 */
export function useCanRender3D() {
  const ctx = useWebGLContext();
  return deriveRender3DState(ctx);
}

/**
 * Coordinates body scroll lock across drawers, dialogs, and mobile navigation.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(
      new CustomEvent("portfolio:scroll-lock", { detail: { locked: true } })
    );
    return () => {
      document.body.style.overflow = prev;
      window.dispatchEvent(
        new CustomEvent("portfolio:scroll-lock", { detail: { locked: false } })
      );
    };
  }, [locked]);
}

