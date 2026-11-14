"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type KeyboardEvent } from "react";
import { Cpu, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { stack } from "@/data/site";
import { STACK_LAYER_HUES } from "@/lib/palette";
import { KineticHeading } from "@/components/motion/KineticText";
import { SectionReveal } from "./SectionReveal";

const LazyStackRack3D = dynamic(
  () => import("@/components/canvas/StackRack3D").then((mod) => mod.StackRack3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[225px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] font-mono text-xs text-[#8B949E] sm:h-[255px]">
        Loading interactive keycap rack...
      </div>
    ),
  }
);

function playMechanicalClick(muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
    window.setTimeout(() => void ctx.close(), 90);
  } catch {
    // Ignore blocked audio context
  }
}

export function ExpertiseSection() {
  const [activeLayerIdx, setActiveLayerIdx] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeLayer = stack[activeLayerIdx];
  const layerHue = STACK_LAYER_HUES[activeLayerIdx] ?? "#38BDF8";

  const handleSelectTool = (tool: string) => {
    playMechanicalClick(!soundEnabled);
    setSelectedTool((prev) => (prev === tool ? null : tool));
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (activeLayerIdx + 1) % stack.length;
      setActiveLayerIdx(next);
      setSelectedTool(null);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (activeLayerIdx - 1 + stack.length) % stack.length;
      setActiveLayerIdx(prev);
      setSelectedTool(null);
      tabRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveLayerIdx(0);
      setSelectedTool(null);
      tabRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = stack.length - 1;
      setActiveLayerIdx(last);
      setSelectedTool(null);
      tabRefs.current[last]?.focus();
    }
  };

  return (
    <section
      id="expertise"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/35 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="flex flex-col justify-between gap-6 border-b border-[rgba(240,246,252,0.08)] pb-8 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#7DD3FC]">
                <span>Capabilities</span>
              </div>
              <KineticHeading
                as="h2"
                className="mt-4 font-display text-[clamp(2.4rem,5vw,4.3rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]"
              >
                STACK BY{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  layer.
                </span>
              </KineticHeading>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[#9DA7B3]">
              <button
                type="button"
                aria-pressed={soundEnabled}
                onClick={() => setSoundEnabled((v) => !v)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
              >
                {soundEnabled ? (
                  <SpeakerHigh className="h-3.5 w-3.5 text-[#10B981]" weight="regular" aria-hidden="true" />
                ) : (
                  <SpeakerSlash className="h-3.5 w-3.5 text-[#8B949E]" weight="regular" aria-hidden="true" />
                )}
                <span>Click Audio: {soundEnabled ? "ON" : "MUTED"}</span>
              </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div
              role="tablist"
              aria-label="Engineering stack layers"
              onKeyDown={handleTabKeyDown}
              className="flex flex-col divide-y divide-[rgba(240,246,252,0.08)] border-y border-[rgba(240,246,252,0.08)] lg:col-span-5"
            >
              {stack.map((row, idx) => {
                const isSelected = activeLayerIdx === idx;
                const rowHue = STACK_LAYER_HUES[idx] ?? "#38BDF8";
                return (
                  <button
                    key={row.layer}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`stack-tab-${row.code}`}
                    tabIndex={isSelected ? 0 : -1}
                    aria-selected={isSelected}
                    aria-controls={`stack-panel-${row.code}`}
                    onClick={() => {
                      playMechanicalClick(!soundEnabled);
                      setActiveLayerIdx(idx);
                      setSelectedTool(null);
                    }}
                    className={`flex min-h-[56px] w-full items-center justify-between gap-4 px-3 py-3.5 text-left transition-colors sm:px-4 ${
                      isSelected
                        ? "bg-[#161B22] text-[#E6EDF3]"
                        : "bg-transparent text-[#9DA7B3] hover:bg-[#161B22]/60 hover:text-[#E6EDF3]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span
                        className="font-mono text-xs font-semibold tabular-nums"
                        style={{ color: isSelected ? rowHue : "#8B949E" }}
                      >
                        {row.code}
                      </span>
                      <span className="truncate font-display text-2xl font-bold uppercase tracking-tight">
                        {row.layer}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#8B949E] tabular-nums">
                      {row.items.length} tools
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              id={`stack-panel-${activeLayer.code}`}
              role="tabpanel"
              aria-labelledby={`stack-tab-${activeLayer.code}`}
              className="double-bezel-outer lg:col-span-7"
            >
              <div className="double-bezel-core space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em]"
                    style={{ color: layerHue }}
                  >
                    <Cpu className="h-4 w-4" weight="regular" aria-hidden="true" />
                    <span>
                      Layer {activeLayer.code} · {activeLayer.layer}
                    </span>
                  </div>
                  {selectedTool && (
                    <span className="rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/12 px-3 py-0.5 font-mono text-xs text-[#7DD3FC]">
                      Selected: {selectedTool}
                    </span>
                  )}
                </div>

                <p className="font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                  {activeLayer.summary}
                </p>

                <LazyStackRack3D
                  layerCode={activeLayer.code}
                  layerName={activeLayer.layer}
                  tools={activeLayer.items}
                  selectedTool={selectedTool}
                  onSelectTool={handleSelectTool}
                />

                <div className="flex flex-wrap gap-2">
                  {activeLayer.items.map((tool) => {
                    const isPicked = selectedTool === tool;
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => handleSelectTool(tool)}
                        aria-pressed={isPicked}
                        className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 font-mono text-xs transition-colors ${
                          isPicked
                            ? "border-[#38BDF8] bg-[#38BDF8]/15 font-semibold text-[#E6EDF3]"
                            : "border-[rgba(240,246,252,0.1)] bg-[#0D1117] text-[#9DA7B3] hover:text-[#E6EDF3]"
                        }`}
                      >
                        {tool}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
