"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOTION_QUALITY_STORAGE_KEY, shouldReduceAppMotion } from "@/lib/motion";

export const INTRO_SEEN_STORAGE_KEY = "portfolio-v2-intro-seen";

/**
 * First-visit session boot curtain (<= 820ms total, skippable via click/Esc).
 * Pre-paint synchronization is driven via `html[data-intro="pending"]` set in layout <head>
 * so repeat navigations, sub-routes, and 2D SAFE users never experience a curtain flash or LCP delay.
 */
export function IntroBoot() {
  const [mounted, setMounted] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const finishedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const exitTimerRef = useRef<number | null>(null);

  const finishBoot = useCallback((immediate = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    try {
      window.sessionStorage?.setItem(INTRO_SEEN_STORAGE_KEY, "1");
    } catch {
      // Ignore storage access errors in restricted contexts
    }

    if (immediate) {
      delete document.documentElement.dataset.intro;
      setMounted(false);
      return;
    }

    setProgress(100);
    setExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      delete document.documentElement.dataset.intro;
      setMounted(false);
    }, 320);
  }, []);

  useEffect(() => {
    finishedRef.current = false;
    const isPending = document.documentElement.dataset.intro === "pending";
    const reduced =
      shouldReduceAppMotion() ||
      window.localStorage?.getItem(MOTION_QUALITY_STORAGE_KEY) === "2d";

    if (!isPending || reduced) {
      delete document.documentElement.dataset.intro;
      const frame = window.requestAnimationFrame(() => setMounted(false));
      return () => window.cancelAnimationFrame(frame);
    }

    const COUNT_DURATION_MS = 480;
    const FAILSAFE_MS = 1050;
    const start = performance.now();

    const step = (now: number) => {
      if (finishedRef.current) return;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / COUNT_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(step);
      } else {
        finishBoot(false);
      }
    };

    rafRef.current = window.requestAnimationFrame(step);

    const failsafeTimer = window.setTimeout(() => {
      finishBoot(true);
    }, FAILSAFE_MS);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finishBoot(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      window.clearTimeout(failsafeTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finishBoot]);

  if (!mounted) return null;

  const dashOffset = 289 * (1 - progress / 100);

  return (
    <div
      data-intro-curtain
      aria-hidden="true"
      onClick={() => finishBoot(true)}
      style={{
        clipPath: exiting ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 320ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
      className="fixed inset-0 z-[120] flex cursor-pointer select-none flex-col items-center justify-center bg-[#0D1117]/96 backdrop-blur-xl"
    >
      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90">
            <circle
              cx="52"
              cy="52"
              r="46"
              fill="none"
              stroke="rgba(240, 246, 252, 0.08)"
              strokeWidth="1.5"
            />
            <circle
              cx="52"
              cy="52"
              r="46"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="289"
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="absolute font-mono text-sm font-semibold text-[#7DD3FC] tabular-nums">
            {String(progress).padStart(2, "0")}%
          </span>
        </div>

        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#E6EDF3]">
            MEHEDI HASAN <span className="text-[#38BDF8]">{"//"}</span> DEEP COMPUTE
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8B949E]">
            INITIALIZING TELEMETRY STAGE · CLICK OR ESC TO SKIP
          </p>
        </div>
      </div>
    </div>
  );
}
