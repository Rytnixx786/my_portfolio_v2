"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { EvalSeriesPoint } from "@/data/projects";
import { MOTION, shouldReduceAppMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function EvalComparisonChart({
  series,
  accentHex,
}: {
  series: ReadonlyArray<EvalSeriesPoint>;
  accentHex: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      if (shouldReduceAppMotion()) return;

      const bars = container.querySelectorAll<HTMLElement>("[data-eval-bar]");
      if (bars.length === 0) return;

      const rect = container.getBoundingClientRect();
      const alreadyNearTop = rect.top < window.innerHeight * 0.94;

      gsap.fromTo(
        bars,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.55,
          stagger: 0.05,
          ease: MOTION.gsapEase,
          transformOrigin: "left center",
          clearProps: "transform",
          ...(alreadyNearTop
            ? {}
            : {
                scrollTrigger: {
                  trigger: container,
                  start: "top 90%",
                  once: true,
                },
              }),
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="double-bezel-outer">
      <div className="double-bezel-core p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(240,246,252,0.08)] pb-3 font-mono text-xs uppercase tracking-[0.12em]">
          <span className="text-[#E6EDF3]">Baseline vs Engineered Control</span>
          <div className="flex items-center gap-4 text-[#9DA7B3]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#303946]" /> Baseline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: accentHex }} /> Engineered
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {series.map((point) => {
            const maxVal = Math.max(point.baseline, point.current, 1);
            const basePct = Math.max(6, Math.round((point.baseline / maxVal) * 100));
            const currPct = Math.max(6, Math.round((point.current / maxVal) * 100));

            return (
              <div
                key={point.label}
                className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-[#9DA7B3]">
                    {point.label}
                  </p>
                  <span className="font-mono text-xs text-[#8B949E]">{point.unit}</span>
                </div>

                <div className="mt-4 space-y-2.5 font-mono text-xs tabular-nums">
                  <div>
                    <div className="mb-1 flex justify-between text-[#8B949E]">
                      <span>Baseline</span>
                      <span>{point.baseline}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#161B22]">
                      <div
                        data-eval-bar
                        className="h-full origin-left rounded-full bg-[#444D5A]"
                        style={{ width: `${basePct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between font-semibold text-[#E6EDF3]">
                      <span>Engineered</span>
                      <span style={{ color: accentHex }}>{point.current}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#161B22]">
                      <div
                        data-eval-bar
                        className="h-full origin-left rounded-full"
                        style={{ width: `${currPct}%`, backgroundColor: accentHex }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

