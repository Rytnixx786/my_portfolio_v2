"use client";

import { useState } from "react";
import { Cube, Desktop, Gauge } from "@phosphor-icons/react";
import type { QualityPreference } from "@/lib/device-tier";
import { useWebGLContext } from "./WebGLContextProvider";

const OPTIONS: ReadonlyArray<{
  id: QualityPreference;
  shortLabel: string;
  desc: string;
}> = [
  { id: "high", shortLabel: "3D HIGH", desc: "Full shaders & particles" },
  { id: "balanced", shortLabel: "3D BAL", desc: "Mid-density WebGL" },
  { id: "2d", shortLabel: "2D SAFE", desc: "Static zero-GPU plates" },
];

/**
 * Floating Deep Compute graphics tier HUD allowing visitors to switch between
 * full WebGL shaders, balanced mode, or 2D static fallbacks at any time.
 */
export function QualityToggleHUD() {
  const { hasMounted, preference, effectiveTier, webglSupported, setPreference } =
    useWebGLContext();
  const [open, setOpen] = useState(false);

  if (!hasMounted) return null;

  const activeId: QualityPreference =
    preference !== "auto"
      ? preference
      : effectiveTier === "high"
        ? "high"
        : effectiveTier === "mid"
          ? "balanced"
          : "2d";

  const activeMeta = OPTIONS.find((o) => o.id === activeId) ?? OPTIONS[0];

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
      {open && (
        <div
          role="dialog"
          aria-label="3D graphics quality controls"
          className="w-60 rounded-2xl border border-[rgba(240,246,252,0.12)] bg-[#161B22]/95 p-2 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] px-2.5 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E]">
            <span>WebGL Stage Tier</span>
            <span className="text-[#38BDF8]">
              {webglSupported ? "GPU READY" : "NO WEBGL"}
            </span>
          </div>

          <div className="mt-1.5 flex flex-col gap-1">
            {OPTIONS.map((option) => {
              const selected = activeId === option.id;
              const disabled = option.id !== "2d" && !webglSupported;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setPreference(option.id);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    selected
                      ? "border border-[#38BDF8]/40 bg-[#38BDF8]/12 text-[#E6EDF3]"
                      : disabled
                        ? "cursor-not-allowed opacity-40 text-[#6E7681]"
                        : "border border-transparent text-[#8B949E] hover:bg-[#1C222B] hover:text-[#E6EDF3]"
                  }`}
                >
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]">
                      {option.shortLabel}
                    </p>
                    <p className="font-sans text-[11px] text-[#8B949E]">
                      {option.desc}
                    </p>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selected
                        ? option.id === "2d"
                          ? "bg-[#F59E0B]"
                          : "bg-[#10B981]"
                        : "bg-[rgba(240,246,252,0.14)]"
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
        aria-label="Toggle 3D WebGL graphics quality mode"
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22]/90 px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E6EDF3] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/60 hover:text-[#38BDF8] active:scale-[0.97]"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            effectiveTier === "low" ? "bg-[#F59E0B]" : "bg-[#10B981]"
          }`}
          aria-hidden="true"
        />
        {effectiveTier === "high" ? (
          <Cube className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
        ) : effectiveTier === "mid" ? (
          <Gauge className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
        ) : (
          <Desktop className="h-3.5 w-3.5 text-[#8B949E]" weight="regular" aria-hidden="true" />
        )}
        <span>{activeMeta.shortLabel}</span>
      </button>
    </div>
  );
}

