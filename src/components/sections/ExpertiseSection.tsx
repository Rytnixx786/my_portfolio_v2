"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Cpu, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { stack } from "@/data/site";
import { createAppMatchMedia, EASE } from "@/lib/motion";
import { STACK_LAYER_HUES } from "@/lib/palette";
import { KineticHeading, ScrambleMetric } from "@/components/motion/KineticText";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";
import { useSlidingIndicator } from "@/components/motion/useSlidingIndicator";
import { SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LazyStackRack3D = dynamic(
  () => import("@/components/canvas/StackRack3D").then((mod) => mod.StackRack3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[225px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[255px]">
        <svg viewBox="0 0 260 110" className="h-20 w-52 opacity-50" aria-hidden="true">
          {[0, 1, 2, 3].map((row) => (
            <rect
              key={row}
              x={22 + row * 8}
              y={14 + row * 22}
              width={200 - row * 16}
              height={14}
              rx="5"
              fill="#161B22"
              stroke="rgba(56,189,248,0.3)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    ),
  }
);

let sharedAudioCtx: AudioContext | null = null;

function playMechanicalClick(muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
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
  } catch {
    // Ignore blocked audio context
  }
}

export function ExpertiseSection() {
  const [activeLayerIdx, setActiveLayerIdx] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevLayerIdxRef = useRef<number>(0);
  const hasSwitchedLayerRef = useRef(false);
  const appReduced = useAppReducedMotion();

  const activeLayer = stack[activeLayerIdx];
  const layerHue = STACK_LAYER_HUES[activeLayerIdx] ?? "#38BDF8";

  const {
    containerRef: layerRailRef,
    registerItem: registerLayerTab,
    rect: layerRailRect,
    ready: layerRailReady,
  } = useSlidingIndicator<number>(activeLayerIdx);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const rows = section.querySelectorAll<HTMLElement>("[data-layer-row]");
      const rule = section.querySelector<HTMLElement>("[data-section-rule]");

      if (appReduced) {
        if (rows.length > 0) gsap.set(rows, { clearProps: "transform,opacity" });
        if (rule) gsap.set(rule, { clearProps: "transform" });
        return;
      }

      if (rule) {
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "power2.out",
            transformOrigin: "left center",
            scrollTrigger: {
              trigger: section,
              start: "top 86%",
              end: "top 44%",
              scrub: 0.55,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      const mm = createAppMatchMedia().register(({ conditions }) => {
        if (conditions.appReduced || rows.length === 0) return;

        gsap.fromTo(
          rows,
          {
            rotateX: conditions.desktopFine ? 18 : 6,
            y: conditions.desktopFine ? 20 : 12,
            opacity: 0.12,
            transformPerspective: 1200,
            transformOrigin: "center top",
          },
          {
            rotateX: 0,
            y: 0,
            opacity: 1,
            duration: 0.58,
            stagger: 0.08,
            ease: EASE.gsapOut,
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "bottom 18%",
              toggleActions: "play reverse play reverse",
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [appReduced] }
  );

  useGSAP(
    () => {
      if (!hasSwitchedLayerRef.current) {
        hasSwitchedLayerRef.current = true;
        prevLayerIdxRef.current = activeLayerIdx;
        return;
      }
      const panel = panelRef.current;
      if (!panel || appReduced) return;

      const direction = activeLayerIdx >= prevLayerIdxRef.current ? 1 : -1;
      prevLayerIdxRef.current = activeLayerIdx;

      const innerCore = panel.querySelector<HTMLElement>("[data-layer-panel-core]");
      if (innerCore) {
        gsap.fromTo(
          innerCore,
          { x: direction * 16, opacity: 0.65 },
          {
            x: 0,
            opacity: 1,
            duration: 0.34,
            ease: EASE.gsapOut,
            clearProps: "transform,opacity",
          }
        );
      }

      const pills = panel.querySelectorAll("[data-stack-tool]");
      if (pills.length === 0) return;
      gsap.fromTo(
        pills,
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.32,
          stagger: 0.04,
          ease: EASE.gsapOut,
          clearProps: "transform,opacity",
        }
      );
    },
    { scope: panelRef, dependencies: [activeLayer.code, activeLayerIdx, appReduced] }
  );

  const handleSelectTool = (tool: string) => {
    playMechanicalClick(!soundEnabled);
    setSelectedTool((prev) => (prev === tool ? null : tool));
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      playMechanicalClick(!soundEnabled);
      const next = (activeLayerIdx + 1) % stack.length;
      setActiveLayerIdx(next);
      setSelectedTool(null);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      playMechanicalClick(!soundEnabled);
      const prev = (activeLayerIdx - 1 + stack.length) % stack.length;
      setActiveLayerIdx(prev);
      setSelectedTool(null);
      tabRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      playMechanicalClick(!soundEnabled);
      setActiveLayerIdx(0);
      setSelectedTool(null);
      tabRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      playMechanicalClick(!soundEnabled);
      const last = stack.length - 1;
      setActiveLayerIdx(last);
      setSelectedTool(null);
      tabRefs.current[last]?.focus();
    }
  };

  return (
    <section
      ref={sectionRef}
      id="expertise"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/35 py-28 sm:py-36 lg:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="relative flex flex-col justify-between gap-6 border-b border-[rgba(240,246,252,0.08)] pb-8 lg:flex-row lg:items-end">
            <span
              data-section-rule
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left bg-gradient-to-r from-[#38BDF8]/70 via-[#38BDF8]/25 to-transparent"
            />
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#38BDF8]">
                <ScrambleMetric value="04" />{" "}
                <span className="text-[#8B949E]">/</span>{" "}
                <span>Capabilities</span>
              </p>
              <KineticHeading
                as="h2"
                reveal="mask-lines"
                className="velocity-skew-heading mt-4 font-display text-[clamp(2.4rem,5vw,4.3rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]"
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
        </SectionReveal>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <SectionReveal className="lg:col-span-5">
            <div
              ref={layerRailRef}
              role="tablist"
              aria-label="Engineering stack layers"
              onKeyDown={handleTabKeyDown}
              className="relative flex flex-col divide-y divide-[rgba(240,246,252,0.08)] border-y border-[rgba(240,246,252,0.08)]"
            >
              {layerRailReady && layerRailRect && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 z-20 w-[3px] rounded-r-full transition-[transform,height,background-color] duration-300 ease-[var(--ease-editorial)]"
                  style={{
                    height: layerRailRect.height,
                    transform: `translate3d(0, ${layerRailRect.top}px, 0)`,
                    backgroundColor: layerHue,
                    boxShadow: `0 0 12px ${layerHue}AA`,
                  }}
                />
              )}

              {stack.map((row, idx) => {
                const isSelected = activeLayerIdx === idx;
                const rowHue = STACK_LAYER_HUES[idx] ?? "#38BDF8";
                const registerTab = registerLayerTab(idx);
                return (
                  <button
                    key={row.layer}
                    data-layer-row
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                      registerTab(el);
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
                    className={`relative z-10 flex min-h-[56px] w-full items-center justify-between gap-4 px-3 py-3.5 text-left transition-colors sm:px-4 ${
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
            </SectionReveal>

            <SectionReveal variant="tilt-rise" className="lg:col-span-7">
              <div
                ref={panelRef}
                id={`stack-panel-${activeLayer.code}`}
                role="tabpanel"
                aria-labelledby={`stack-tab-${activeLayer.code}`}
                onPointerMove={(e: PointerEvent<HTMLDivElement>) => {
                  if (e.pointerType === "touch") return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
                }}
                style={{ "--spotlight-color": `${layerHue}1E` } as CSSProperties}
                className="double-bezel-outer spotlight-card"
              >
                <div
                  key={activeLayer.code}
                  data-layer-panel-core
                  className="double-bezel-core space-y-5 p-5 sm:p-6"
                >
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
                          data-stack-tool
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
            </SectionReveal>
          </div>
      </div>
    </section>
  );
}
