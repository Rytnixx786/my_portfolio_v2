"use client";

import { useEffect, useRef, useState } from "react";
import { Cube, Desktop, Gauge } from "@phosphor-icons/react";
import type { QualityPreference } from "@/lib/device-tier";
import { useWebGLContext } from "./WebGLContextProvider";

const OPTIONS: ReadonlyArray<{
  id: QualityPreference;
  shortLabel: string;
  desc: string;
}> = [
  { id: "auto", shortLabel: "AUTO", desc: "Adaptive GPU tier detection" },
  { id: "high", shortLabel: "3D HIGH", desc: "Shaders, AA & HD DPR" },
  { id: "balanced", shortLabel: "3D BAL", desc: "Mid-density WebGL view" },
  { id: "2d", shortLabel: "2D SAFE", desc: "Zero-GPU vector fallback" },
];

/**
 * Floating Deep Compute graphics tier HUD with transparent resolution diagnostics.
 */
export function QualityToggleHUD() {
  const {
    hasMounted,
    preference,
    effectiveTier,
    webglSupported,
    qualityReason,
    contextLost,
    setPreference,
  } = useWebGLContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  if (!hasMounted) return null;

  const activeId: QualityPreference =
    preference !== "auto"
      ? preference
      : effectiveTier === "high"
        ? "high"
        : effectiveTier === "mid"
          ? "balanced"
          : "2d";

  const activeMeta = OPTIONS.find((o) => o.id === activeId) ?? OPTIONS[1];

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div
          role="dialog"
          aria-label="3D graphics quality controls"
          className="w-64 rounded-2xl border border-[rgba(240,246,252,0.14)] bg-[#161B22]/95 p-2.5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] px-2 pb-2 pt-0.5 font-mono text-xs uppercase tracking-[0.12em] text-[#8B949E]">
            <span>WebGL Stage</span>
            <span className={contextLost ? "text-[#F59E0B]" : "text-[#38BDF8]"}>
              {contextLost ? "PAUSED" : webglSupported ? "LRU GPU POOL" : "NO WEBGL"}
            </span>
          </div>

          <p className="px-2 py-2 font-mono text-xs text-[#9DA7B3]">
            {qualityReason}
          </p>

          <div className="flex flex-col gap-1">
            {OPTIONS.map((option) => {
              const selected =
                preference === "auto" ? option.id === "auto" : preference === option.id;
              const disabled = option.id !== "2d" && option.id !== "auto" && !webglSupported;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setPreference(option.id);
                    setOpen(false);
                  }}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    selected
                      ? "border border-[#38BDF8]/40 bg-[#38BDF8]/12 text-[#E6EDF3]"
                      : disabled
                        ? "cursor-not-allowed text-[#8B949E] opacity-40"
                        : "border border-transparent text-[#9DA7B3] hover:bg-[#1C222B] hover:text-[#E6EDF3]"
                  }`}
                >
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em]">
                      {option.shortLabel}
                    </p>
                    <p className="font-sans text-xs text-[#8B949E]">
                      {option.desc}
                    </p>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      selected
                        ? option.id === "2d" || contextLost
                          ? "bg-[#F59E0B]"
                          : "bg-[#10B981]"
                        : "bg-[rgba(240,246,252,0.16)]"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`Graphics mode ${activeMeta.shortLabel}. ${qualityReason}. Click to adjust.`}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22]/90 px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] backdrop-blur-md transition-all duration-300 hover:border-[#38BDF8] hover:text-[#38BDF8]"
      >
        {activeId === "2d" ? (
          <Desktop className="h-3.5 w-3.5 text-[#F59E0B]" weight="regular" aria-hidden="true" />
        ) : activeId === "balanced" ? (
          <Gauge className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
        ) : (
          <Cube className="h-3.5 w-3.5 text-[#10B981]" weight="regular" aria-hidden="true" />
        )}
        <span>{activeMeta.shortLabel}</span>
      </button>
    </div>
  );
}
