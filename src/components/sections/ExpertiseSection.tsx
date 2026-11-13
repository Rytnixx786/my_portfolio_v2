"use client";

import { useState } from "react";
import { CaretDown, CheckCircle, Cpu } from "@phosphor-icons/react";
import { focusAreas, stack } from "@/data/site";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";
import { StackRack3D } from "@/components/canvas/StackRack3D";
import { SectionReveal } from "./SectionReveal";

export function ExpertiseSection() {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const [activeLayerIdx, setActiveLayerIdx] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [expandedFocusId, setExpandedFocusId] = useState<string>(
    focusAreas[0].id
  );

  const activeLayer = stack[activeLayerIdx];
  const show3DRack = hasMounted && webglSupported && effectiveTier !== "low";

  return (
    <section
      id="expertise"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/35 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="flex flex-col justify-between gap-6 border-b border-[rgba(240,246,252,0.08)] pb-10 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7DD3FC]">
                <span>Capabilities</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]">
                STACK BY{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  layer.
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B949E]">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-55 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
              </span>
              <span>Inference to interface · Zero inflated bars</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Layer Selector Tabs */}
            <div
              role="tablist"
              aria-label="Engineering stack layers"
              className="flex flex-col divide-y divide-[rgba(240,246,252,0.08)] border-y border-[rgba(240,246,252,0.08)] lg:col-span-5"
            >
              {stack.map((row, idx) => {
                const isSelected = activeLayerIdx === idx;
                return (
                  <button
                    key={row.layer}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`stack-panel-${row.code}`}
                    onClick={() => {
                      setActiveLayerIdx(idx);
                      setSelectedTool(null);
                    }}
                    className={`group flex w-full items-center justify-between gap-4 px-3 py-4 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-4 ${
                      isSelected
                        ? "bg-[#161B22] text-[#E6EDF3]"
                        : "bg-transparent text-[#8B949E] hover:bg-[#161B22]/60 hover:text-[#E6EDF3]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          isSelected ? "text-[#38BDF8]" : "text-[#6E7681]"
                        }`}
                      >
                        {row.code}
                      </span>
                      <span className="truncate font-display text-2xl font-bold uppercase tracking-tight">
                        {row.layer}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6E7681] tabular-nums">
                        {row.items.length} tools
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full transition-transform duration-300 ${
                          isSelected
                            ? "scale-100 bg-[#38BDF8]"
                            : "scale-75 bg-[rgba(240,246,252,0.16)] group-hover:bg-[#38BDF8]/55"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Layer Detail Well */}
            <div
              id={`stack-panel-${activeLayer.code}`}
              role="tabpanel"
              className="min-w-0 lg:col-span-7"
            >
              <div className="double-bezel-outer">
                <div className="double-bezel-core p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] pb-4">
                    <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
                      <Cpu className="h-4 w-4" weight="regular" aria-hidden="true" />
                      <span>Layer {activeLayer.code} · Verified Production Stack</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#10B981]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
                      Active Scope
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3] sm:text-4xl">
                    {activeLayer.layer}
                  </h3>
                  <p className="mt-2 max-w-[60ch] font-sans text-base leading-relaxed text-[#8B949E]">
                    {activeLayer.summary}
                  </p>

                  {show3DRack && (
                    <div className="mt-6">
                      <StackRack3D
                        layerCode={activeLayer.code}
                        layerName={activeLayer.layer}
                        tools={activeLayer.items}
                        selectedTool={selectedTool}
                        onSelectTool={(tool) =>
                          setSelectedTool((prev) => (prev === tool ? null : tool))
                        }
                      />
                    </div>
                  )}

                  <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {activeLayer.items.map((tool) => {
                      const isToolSelected = selectedTool === tool;
                      return (
                        <li key={tool}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTool((prev) => (prev === tool ? null : tool))
                            }
                            aria-pressed={isToolSelected}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 font-mono text-xs transition-colors ${
                              isToolSelected
                                ? "border-[#38BDF8] bg-[#38BDF8]/12 text-[#7DD3FC]"
                                : "border-[rgba(240,246,252,0.08)] bg-[#0D1117] text-[#E6EDF3] hover:border-[#38BDF8]/40"
                            }`}
                          >
                            <span className="truncate font-medium">{tool}</span>
                            <CheckCircle
                              className="h-4 w-4 shrink-0 text-[#38BDF8]"
                              weight="regular"
                              aria-hidden="true"
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-8 border-t border-[rgba(240,246,252,0.08)] pt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6E7681]">
                      Complete Stack Matrix
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {stack.map((layer, idx) => (
                        <button
                          key={layer.layer}
                          type="button"
                          onClick={() => {
                      setActiveLayerIdx(idx);
                      setSelectedTool(null);
                    }}
                          className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                            idx === activeLayerIdx
                              ? "border-[#38BDF8]/45 bg-[#38BDF8]/10"
                              : "border-[rgba(240,246,252,0.08)] bg-[#1C222B] hover:border-[#38BDF8]/30"
                          }`}
                        >
                          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#38BDF8]">
                            {layer.code} · {layer.layer}
                          </span>
                          <span className="mt-1 block truncate font-sans text-xs text-[#8B949E]">
                            {layer.items.join(" · ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Architectural Focus Areas */}
          <div className="mt-16 border-t border-[rgba(240,246,252,0.08)] pt-12">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#38BDF8]">
                  System Capabilities
                </p>
                <h3 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                  ARCHITECTURAL FOCUS AREAS
                </h3>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6E7681]">
                Select an area to inspect patterns
              </p>
            </div>

            <div className="mt-6 divide-y divide-[rgba(240,246,252,0.08)] border-y border-[rgba(240,246,252,0.08)]">
              {focusAreas.map((area) => {
                const isOpen = expandedFocusId === area.id;
                return (
                  <div key={area.id} className="bg-transparent">
                    <button
                      type="button"
                      onClick={() => setExpandedFocusId(isOpen ? "" : area.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[#38BDF8]"
                    >
                      <div className="flex min-w-0 items-baseline gap-4">
                        <span className="font-mono text-xs font-semibold text-[#38BDF8]">
                          {area.code}
                        </span>
                        <span className="font-display text-2xl font-bold uppercase tracking-tight text-[#E6EDF3] sm:text-3xl">
                          {area.title}
                        </span>
                      </div>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#8B949E] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                          isOpen ? "rotate-180 border-[#38BDF8] text-[#38BDF8]" : ""
                        }`}
                      >
                        <CaretDown className="h-4 w-4" weight="regular" aria-hidden="true" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="grid grid-cols-1 gap-6 pb-6 pl-0 sm:pl-9 lg:grid-cols-12">
                        <p className="max-w-[65ch] font-sans text-base leading-relaxed text-[#8B949E] lg:col-span-7">
                          {area.description}
                        </p>
                        <ul className="flex flex-wrap content-start gap-2 lg:col-span-5">
                          {area.capabilities.map((cap) => (
                            <li
                              key={cap}
                              className="rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[11px] text-[#7DD3FC]"
                            >
                              {cap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
