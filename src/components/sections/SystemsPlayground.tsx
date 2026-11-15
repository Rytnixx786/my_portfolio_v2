"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowCounterClockwise,
  ArrowUpRight,
  Cpu,
  GitBranch,
  Lightning,
  Pause,
  Play,
  SkipForward,
  Sliders,
} from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import type { PlaygroundCameraPreset } from "@/components/canvas/PlaygroundPipeline3D";
import {
  CINCH_SCENARIOS,
  CINCH_STAGES,
  computeTraceSpanTimeline,
  RAG_SCENARIOS,
  RAG_STAGES,
  type SimulatorTab,
} from "@/data/playground";
import { createAppMatchMedia, EASE, MOTION } from "@/lib/motion";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { KineticHeading, ScrambleMetric } from "@/components/motion/KineticText";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";
import { useSlidingIndicator } from "@/components/motion/useSlidingIndicator";
import {
  handleSpotlightEnter,
  handleSpotlightLeave,
  handleSpotlightMove,
  useCanRender3D,
} from "@/hooks/usePortfolioUtils";
import { PlaygroundPipeline2D } from "./PlaygroundPipeline2D";
import { attachBidirectionalScrollEnvelope, SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LazyPlaygroundPipeline3D = dynamic(
  () =>
    import("@/components/canvas/PlaygroundPipeline3D").then(
      (mod) => mod.PlaygroundPipeline3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[265px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[315px]">
        <svg viewBox="0 0 360 90" className="h-16 w-72 opacity-55" aria-hidden="true">
          <line x1="28" y1="45" x2="332" y2="45" stroke="rgba(56,189,248,0.35)" strokeWidth="1.2" strokeDasharray="4 6" />
          {[32, 92, 152, 212, 272, 332].map((cx) => (
            <circle key={cx} cx={cx} cy="45" r="7" fill="#161B22" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="1.2" />
          ))}
        </svg>
      </div>
    ),
  }
);

export function SystemsPlayground() {
  const { canRender3D } = useCanRender3D();
  const [tab, setTab] = useState<SimulatorTab>("cinch");
  const [cinchId, setCinchId] = useState(CINCH_SCENARIOS[0].id);
  const [ragId, setRagId] = useState(RAG_SCENARIOS[0].id);
  const [cameraPreset, setCameraPreset] = useState<PlaygroundCameraPreset>("isometric");
  const [presetTrigger, setPresetTrigger] = useState<number>(0);
  const [rpsMultiplier, setRpsMultiplier] = useState<number>(1.0);
  const [piiGuardEnabled, setPiiGuardEnabled] = useState<boolean>(true);
  const [semanticCacheEnabled, setSemanticCacheEnabled] = useState<boolean>(true);
  const [focusedStageId, setFocusedStageId] = useState<string | null>(null);
  const [lastStageId, setLastStageId] = useState<string | null>(null);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayStepIdx, setReplayStepIdx] = useState<number>(-1);
  const didToggleInspectorRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const simPinStageRef = useRef<HTMLDivElement>(null);
  const simShellRef = useRef<HTMLDivElement>(null);
  const telemetryPanelRef = useRef<HTMLDivElement>(null);
  const bootTlRef = useRef<gsap.core.Timeline | null>(null);
  const hasTelemetryChangedRef = useRef(false);
  const appReduced = useAppReducedMotion();

  const scenarios = tab === "cinch" ? CINCH_SCENARIOS : RAG_SCENARIOS;
  const stages = tab === "cinch" ? CINCH_STAGES : RAG_STAGES;
  const rawScenarioId = tab === "cinch" ? cinchId : ragId;
  const activeScenario =
    scenarios.find((s) => s.id === rawScenarioId) ?? scenarios[0];

  const {
    containerRef: tabRailRef,
    registerItem: registerTabItem,
    rect: tabPillRect,
    ready: tabPillReady,
  } = useSlidingIndicator<SimulatorTab>(tab);

  const {
    containerRef: scenarioRailRef,
    registerItem: registerScenarioItem,
    rect: scenarioPillRect,
    ready: scenarioPillReady,
  } = useSlidingIndicator<string>(activeScenario.id);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const pinStage = simPinStageRef.current;
      const simShell = simShellRef.current;
      if (!section) return;

      const clearSimState = () => {
        if (simShell) {
          gsap.set(simShell, { clearProps: "clipPath,transform,opacity" });
        }
        const chips = section.querySelectorAll<HTMLElement>("[data-stage-chip]");
        if (chips.length > 0) {
          gsap.set(chips, { clearProps: "transform,opacity" });
        }
      };

      if (appReduced) {
        clearSimState();
        return;
      }

      const rule = section.querySelector<HTMLElement>("[data-section-rule]");
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

      if (!pinStage || !simShell) return;

      const mm = createAppMatchMedia().register(({ conditions }) => {
        if (conditions.appReduced) {
          clearSimState();
          return;
        }

        if (conditions.desktopFine) {
          const chips = pinStage.querySelectorAll<HTMLElement>("[data-stage-chip]");
          const simHeaderRule = pinStage.querySelector<HTMLElement>("[data-sim-header-rule]");

          // Smooth unclipped entrance before entering pinned inspection band so edge HUD controls
          // ("Request Rate", "Orbit", stage labels) are never cropped or dimmed at anchor scroll.
          gsap.fromTo(
            simShell,
            { y: 24, scale: 0.985, opacity: 0.85 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              ease: EASE.gsapOut,
              scrollTrigger: {
                trigger: pinStage,
                start: "top 88%",
                end: "top 24%",
                scrub: MOTION.scrollTrigger.scrub,
                invalidateOnRefresh: true,
              },
            }
          );

          // Smooth unpinned boot choreography: keeps all interactive workbench panels
          // (3D pipeline, Trace Replay waterfall, Telemetry JSON) reachable without viewport clipping on 768px-900px displays.
          const bootTl = gsap.timeline({
            scrollTrigger: {
              trigger: pinStage,
              start: "top 82%",
              end: "top 28%",
              scrub: MOTION.scrollTrigger.scrub,
              invalidateOnRefresh: true,
              onLeave: () => {
                gsap.set(simShell, { clearProps: "clipPath,transform,opacity" });
              },
            },
          });
          bootTlRef.current = bootTl;

          if (simHeaderRule) {
            bootTl.fromTo(
              simHeaderRule,
              { scaleX: 0 },
              { scaleX: 1, duration: 0.35, ease: EASE.gsapOut },
              0.08
            );
          }

          if (chips.length > 0) {
            bootTl.fromTo(
              chips,
              { y: 8, opacity: 0.65 },
              { y: 0, opacity: 1, stagger: 0.06, duration: 0.3, ease: EASE.gsapOut },
              0.16
            );
          }
          return;
        }

        // Mobile: unpinned gentle scroll envelope
        attachBidirectionalScrollEnvelope(simShell, {
          enterOpacity: 0.16,
          enterY: 24,
          enterScale: 0.97,
        });
      });

      return () => {
        bootTlRef.current = null;
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [appReduced] }
  );

  useGSAP(
    () => {
      if (!hasTelemetryChangedRef.current) {
        hasTelemetryChangedRef.current = true;
        return;
      }
      const el = telemetryPanelRef.current;
      if (!el || appReduced) return;

      gsap.fromTo(
        el,
        { y: 6, opacity: 0.72 },
        {
          y: 0,
          opacity: 1,
          duration: MOTION.durations.ui,
          ease: MOTION.gsapEase,
          clearProps: "transform,opacity",
        }
      );
    },
    {
      scope: telemetryPanelRef,
      dependencies: [tab, activeScenario.id, piiGuardEnabled, semanticCacheEnabled, appReduced],
    }
  );

  useEffect(() => {
    if (!didToggleInspectorRef.current) {
      didToggleInspectorRef.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 320);
    return () => window.clearTimeout(timer);
  }, [focusedStageId, tab]);

  const toggleStageFocus = (stageId: string) => {
    setReplayPlaying(false);
    setFocusedStageId((prev) => {
      const next = prev === stageId ? null : stageId;
      if (next !== null) setLastStageId(next);
      return next;
    });
  };

  const effectiveStages = activeScenario.activeStages.filter((id) => {
    if (!piiGuardEnabled && id === "pii") return false;
    if (!semanticCacheEnabled && id === "cache") return false;
    return true;
  });

  const effectiveSpans = useMemo(() => {
    return activeScenario.traceSpans.map((span) => {
      const piiBypassed = tab === "cinch" && !piiGuardEnabled && span.stageId === "pii";
      const cacheBypassed =
        tab === "cinch" && !semanticCacheEnabled && span.stageId === "cache";
      if (piiBypassed) {
        return {
          ...span,
          durationMs: 0,
          status: "SKIP" as const,
          metricDelta: "Bypassed",
          logLine: "PII Guard disabled in simulator; payload passes unredacted",
        };
      }
      if (cacheBypassed) {
        return {
          ...span,
          durationMs: 0,
          status: "SKIP" as const,
          metricDelta: "Bypassed",
          logLine: "ONNX Cache disabled in simulator; bypassing vector lookup",
        };
      }
      return span;
    });
  }, [activeScenario.traceSpans, piiGuardEnabled, semanticCacheEnabled, tab]);

  const { recordedTotalMs, spanTimeline } = useMemo(
    () => computeTraceSpanTimeline(effectiveSpans),
    [effectiveSpans]
  );

  const activeStepSpan =
    replayStepIdx >= 0 && replayStepIdx < spanTimeline.length
      ? spanTimeline[replayStepIdx]
      : null;

  useEffect(() => {
    if (!replayPlaying || spanTimeline.length === 0) return;
    const stepMs = appReduced ? 550 : 950;
    const timer = window.setTimeout(() => {
      const nextIdx = replayStepIdx + 1;
      if (nextIdx >= spanTimeline.length) {
        setReplayPlaying(false);
        return;
      }
      const nextSpan = spanTimeline[nextIdx];
      setReplayStepIdx(nextIdx);
      if (nextSpan) {
        setFocusedStageId(nextSpan.stageId);
        setLastStageId(nextSpan.stageId);
      }
    }, stepMs);
    return () => window.clearTimeout(timer);
  }, [replayPlaying, replayStepIdx, spanTimeline, appReduced]);

  const selectTab = (nextTab: SimulatorTab) => {
    setReplayPlaying(false);
    setReplayStepIdx(-1);
    setFocusedStageId(null);
    setTab(nextTab);
  };

  const selectScenario = (id: string) => {
    setReplayPlaying(false);
    setReplayStepIdx(-1);
    setFocusedStageId(null);
    if (tab === "cinch") {
      setCinchId(id);
    } else {
      setRagId(id);
    }
  };

  const handleToggleReplay = () => {
    if (spanTimeline.length === 0) return;
    if (replayPlaying) {
      setReplayPlaying(false);
      return;
    }
    const startIdx =
      replayStepIdx >= 0 && replayStepIdx < spanTimeline.length - 1 ? replayStepIdx : 0;
    const startSpan = spanTimeline[startIdx];
    setReplayStepIdx(startIdx);
    if (startSpan) {
      setFocusedStageId(startSpan.stageId);
      setLastStageId(startSpan.stageId);
    }
    setReplayPlaying(true);
  };

  const handleLiveStep = () => {
    if (spanTimeline.length === 0) return;
    setReplayPlaying(false);
    const nextIdx = (replayStepIdx + 1) % spanTimeline.length;
    const nextSpan = spanTimeline[nextIdx];
    setReplayStepIdx(nextIdx);
    if (nextSpan) {
      setFocusedStageId(nextSpan.stageId);
      setLastStageId(nextSpan.stageId);
    }
  };

  const handleResetReplay = () => {
    setReplayPlaying(false);
    setReplayStepIdx(-1);
    setFocusedStageId(null);
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      selectTab(tab === "cinch" ? "rag" : "cinch");
    }
  };

  return (
    <section
      ref={sectionRef}
      id="simulator"
      className="relative z-[2] overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/35 py-24 sm:py-28 lg:py-40"
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
                <ScrambleMetric value="02" />{" "}
                <span className="text-[#8B949E]">/</span>{" "}
                <span>Interactive Pipeline Simulator</span>
              </p>
              <KineticHeading
                as="h2"
                reveal="mask-lines"
                className="velocity-skew-heading mt-4 font-display text-[clamp(2.4rem,5vw,4.2rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]"
              >
                TRACE EXECUTION,{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  not claims.
                </span>
              </KineticHeading>
            </div>

            <div
              ref={tabRailRef}
              role="tablist"
              aria-label="Choose pipeline architecture to simulate"
              onKeyDown={handleTabKeyDown}
              className="relative inline-flex rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] p-1"
            >
              {tabPillReady && tabPillRect && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 rounded-full bg-[#38BDF8] transition-[transform,width,height] duration-300 ease-[var(--ease-editorial)]"
                  style={{
                    width: tabPillRect.width,
                    height: tabPillRect.height,
                    transform: `translate3d(${tabPillRect.left}px, ${tabPillRect.top}px, 0)`,
                  }}
                />
              )}
              <button
                ref={registerTabItem("cinch")}
                type="button"
                role="tab"
                id="tab-cinch"
                aria-selected={tab === "cinch"}
                aria-controls="panel-simulator"
                onClick={() => selectTab("cinch")}
                className={`relative z-10 inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  tab === "cinch"
                    ? tabPillReady
                      ? "font-semibold text-[#0D1117]"
                      : "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#9DA7B3] hover:text-[#E6EDF3]"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                <span>Cinch Gateway</span>
              </button>
              <button
                ref={registerTabItem("rag")}
                type="button"
                role="tab"
                id="tab-rag"
                aria-selected={tab === "rag"}
                aria-controls="panel-simulator"
                onClick={() => selectTab("rag")}
                className={`relative z-10 inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  tab === "rag"
                    ? tabPillReady
                      ? "font-semibold text-[#0D1117]"
                      : "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#9DA7B3] hover:text-[#E6EDF3]"
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                <span>RAG Refusal Gate</span>
              </button>
            </div>
          </div>
        </SectionReveal>

        <div ref={simPinStageRef} className="mt-8">
          <div
            ref={simShellRef}
            id="panel-simulator"
            role="tabpanel"
            aria-labelledby={tab === "cinch" ? "tab-cinch" : "tab-rag"}
            onPointerDownCapture={() => {
              if (bootTlRef.current && bootTlRef.current.progress() < 0.99) {
                bootTlRef.current.progress(1);
                if (simShellRef.current) {
                  gsap.set(simShellRef.current, { clearProps: "clipPath,transform,opacity" });
                }
                const chips = sectionRef.current?.querySelectorAll<HTMLElement>("[data-stage-chip]");
                if (chips && chips.length > 0) {
                  gsap.set(chips, { clearProps: "transform,opacity" });
                }
              }
            }}
            onPointerEnter={handleSpotlightEnter}
            onPointerMove={(e) => handleSpotlightMove(e, false)}
            onPointerLeave={(e) => handleSpotlightLeave(e, false)}
            style={{ "--spotlight-color": "rgba(56, 189, 248, 0.1)" } as CSSProperties}
            className="double-bezel-outer spotlight-card"
          >
          <div className="double-bezel-core overflow-hidden">
            {/* Simulator Header Controls */}
            <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3 sm:px-6">
              <span
                data-sim-header-rule
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-[#38BDF8]/65 to-transparent"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Lightning className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
                  Fault Scenario:
                </span>
                <div ref={scenarioRailRef} className="relative flex flex-wrap items-center gap-2">
                  {scenarioPillReady && scenarioPillRect && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-0 rounded-full border border-[#38BDF8] bg-[#38BDF8]/15 transition-[transform,width,height] duration-300 ease-[var(--ease-editorial)]"
                      style={{
                        width: scenarioPillRect.width,
                        height: scenarioPillRect.height,
                        transform: `translate3d(${scenarioPillRect.left}px, ${scenarioPillRect.top}px, 0)`,
                      }}
                    />
                  )}
                  {scenarios.map((scenario) => {
                    const selected = scenario.id === activeScenario.id;
                    return (
                      <button
                        key={scenario.id}
                        ref={registerScenarioItem(scenario.id)}
                        type="button"
                        onClick={() => selectScenario(scenario.id)}
                        className={`relative z-10 inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-xs transition-colors ${
                          selected
                            ? scenarioPillReady
                              ? "border-transparent bg-transparent font-semibold text-[#E6EDF3]"
                              : "border-[#38BDF8] bg-[#38BDF8]/15 font-semibold text-[#E6EDF3]"
                            : "border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#9DA7B3] hover:text-[#E6EDF3]"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: scenario.statusColor }}
                          aria-hidden="true"
                        />
                        <span>{scenario.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span
                  key={`${tab}-${activeScenario.id}`}
                  className="panel-enter rounded-full px-3 py-1 font-semibold tabular-nums"
                  style={{
                    color: activeScenario.statusColor,
                    backgroundColor: `${activeScenario.statusColor}1A`,
                  }}
                >
                  {activeScenario.statusCode}
                </span>
              </div>
            </div>

            {/* Request Generator Toggles + Camera Views */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117]/80 px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#9DA7B3]">
                  <Sliders className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                  Request Rate: <strong className="text-[#E6EDF3] tabular-nums">{rpsMultiplier.toFixed(1)}x</strong>
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="2.2"
                  step="0.1"
                  value={rpsMultiplier}
                  aria-label="Simulated request stream multiplier"
                  onChange={(e) => setRpsMultiplier(Number(e.target.value))}
                  className="h-11 w-28 cursor-pointer accent-[#38BDF8]"
                />

                {tab === "cinch" && (
                  <>
                    <button
                      type="button"
                      aria-pressed={piiGuardEnabled}
                      onClick={() => setPiiGuardEnabled((v) => !v)}
                      className={`min-h-[44px] rounded-full border px-3.5 py-2 font-mono text-xs transition-colors ${
                        piiGuardEnabled
                          ? "border-[#10B981]/50 bg-[#10B981]/12 text-[#10B981]"
                          : "border-[rgba(240,246,252,0.12)] text-[#8B949E]"
                      }`}
                    >
                      PII Guard: {piiGuardEnabled ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      aria-pressed={semanticCacheEnabled}
                      onClick={() => setSemanticCacheEnabled((v) => !v)}
                      className={`min-h-[44px] rounded-full border px-3.5 py-2 font-mono text-xs transition-colors ${
                        semanticCacheEnabled
                          ? "border-[#38BDF8]/50 bg-[#38BDF8]/12 text-[#7DD3FC]"
                          : "border-[rgba(240,246,252,0.12)] text-[#8B949E]"
                      }`}
                    >
                      ONNX Cache: {semanticCacheEnabled ? "ON" : "OFF"}
                    </button>
                  </>
                )}
              </div>

              {canRender3D && (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-[#8B949E]">Camera:</span>
                  {(["isometric", "top", "orbit"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCameraPreset(preset);
                        setPresetTrigger((n) => n + 1);
                      }}
                      className={`min-h-[44px] rounded-md px-3 py-2 uppercase transition-colors ${
                        cameraPreset === preset
                          ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                          : "bg-[#161B22] text-[#9DA7B3] hover:text-[#E6EDF3]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6 p-4 sm:p-6">
              {canRender3D ? (
                <LazyPlaygroundPipeline3D
                  tab={tab}
                  scenarioId={activeScenario.id}
                  stages={stages}
                  activeStages={effectiveStages}
                  statusColor={activeScenario.statusColor}
                  cameraPreset={cameraPreset}
                  presetTrigger={presetTrigger}
                  focusedStageId={focusedStageId}
                  rpsMultiplier={rpsMultiplier}
                  onSelectStage={toggleStageFocus}
                />
              ) : (
                <PlaygroundPipeline2D
                  tab={tab}
                  scenarioId={activeScenario.id}
                  stages={stages}
                  activeStages={effectiveStages}
                  statusColor={activeScenario.statusColor}
                  focusedStageId={focusedStageId}
                  rpsMultiplier={rpsMultiplier}
                  onSelectStage={toggleStageFocus}
                />
              )}

              {/* Stage Contract Strip */}
              <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {stages.map((stage) => {
                  const isActive = effectiveStages.includes(stage.id);
                  const isFocused = focusedStageId === stage.id;
                  return (
                    <li key={stage.id} data-stage-chip>
                      <button
                        type="button"
                        onClick={() => toggleStageFocus(stage.id)}
                        aria-pressed={isFocused}
                        className={`flex min-h-[44px] w-full items-center justify-between gap-1.5 rounded-xl border px-2.5 py-2.5 text-left font-mono text-[11px] transition-colors sm:gap-2 sm:px-3 sm:text-xs ${
                          isFocused
                            ? "border-[#38BDF8] bg-[#38BDF8]/18 text-[#F0F6FC] ring-1 ring-[#38BDF8]/40"
                            : isActive
                              ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#E6EDF3] hover:border-[#38BDF8]/70"
                              : "border-[rgba(240,246,252,0.08)] bg-[#0D1117] text-[#8B949E] hover:border-[rgba(240,246,252,0.2)] hover:text-[#E6EDF3]"
                        }`}
                      >
                        <span className="truncate font-semibold">{stage.label}</span>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isActive ? "" : "bg-[rgba(240,246,252,0.16)]"
                          }`}
                          style={isActive ? { backgroundColor: activeScenario.statusColor } : undefined}
                        />
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Recorded Live-Trace Replay Player & Waterfall Spans */}
              <div
                data-trace-replay-panel
                className="rounded-2xl border border-[rgba(240,246,252,0.09)] bg-[#0D1117]/95 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] pb-3.5">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] text-[#E6EDF3]">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          replayPlaying ? "animate-pulse bg-[#38BDF8]" : "bg-[#10B981]"
                        }`}
                        aria-hidden="true"
                      />
                      <span>Recorded Trace</span>
                    </span>
                    <span className="rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-2.5 py-0.5 text-[#7DD3FC] tabular-nums">
                      {recordedTotalMs.toFixed(2)} ms
                    </span>
                    {activeStepSpan && (
                      <span className="rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-2.5 py-0.5 text-[#9DA7B3] tabular-nums">
                        Step {replayStepIdx + 1}/{spanTimeline.length}
                      </span>
                    )}
                    <span className="hidden text-[#8B949E] tabular-nums xl:inline">
                      {spanTimeline
                        .map((s) => `${s.durationMs.toFixed(2)}ms`)
                        .join(" -> ")}{" "}
                      = {recordedTotalMs.toFixed(2)}ms
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleReplay}
                      aria-pressed={replayPlaying}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                        replayPlaying
                          ? "border-[#38BDF8] bg-[#38BDF8] text-[#0D1117]"
                          : "border-[#38BDF8]/50 bg-[#38BDF8]/12 text-[#7DD3FC] hover:bg-[#38BDF8] hover:text-[#0D1117]"
                      }`}
                    >
                      {replayPlaying ? (
                        <Pause className="h-3.5 w-3.5" weight="fill" aria-hidden="true" />
                      ) : (
                        <Play className="h-3.5 w-3.5" weight="fill" aria-hidden="true" />
                      )}
                      <span>{replayPlaying ? "Pause Replay" : "Replay Trace"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLiveStep}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-3.5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#7DD3FC]"
                    >
                      <SkipForward className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                      <span>Live Step</span>
                    </button>

                    {replayStepIdx >= 0 && (
                      <button
                        type="button"
                        onClick={handleResetReplay}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#9DA7B3] transition-colors hover:border-[rgba(240,246,252,0.28)] hover:text-[#E6EDF3]"
                      >
                        <ArrowCounterClockwise
                          className="h-3.5 w-3.5"
                          weight="regular"
                          aria-hidden="true"
                        />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {spanTimeline.map((span, idx) => {
                    const stageMeta = stages.find((s) => s.id === span.stageId);
                    const isCurrent = replayStepIdx === idx || focusedStageId === span.stageId;
                    const barColor =
                      span.status === "SKIP"
                        ? "#6E7681"
                        : span.status === "TRIP" || span.status === "DENY"
                          ? "#EF4444"
                          : span.status === "PAUSE"
                            ? "#F59E0B"
                            : activeScenario.statusColor;

                    return (
                      <button
                        key={span.stageId}
                        type="button"
                        data-trace-span={span.stageId}
                        aria-pressed={isCurrent}
                        onClick={() => {
                          setReplayPlaying(false);
                          setReplayStepIdx(idx);
                          setFocusedStageId(span.stageId);
                          setLastStageId(span.stageId);
                        }}
                        className={`grid w-full grid-cols-1 gap-2 rounded-xl border px-3 py-2.5 text-left font-mono text-xs transition-colors sm:grid-cols-[130px_56px_1fr_auto] sm:items-center sm:gap-3 ${
                          isCurrent
                            ? "border-[#38BDF8]/65 bg-[#38BDF8]/[0.09] text-[#F0F6FC]"
                            : "border-[rgba(240,246,252,0.06)] bg-[#161B22]/65 text-[#9DA7B3] hover:border-[rgba(240,246,252,0.18)] hover:text-[#E6EDF3]"
                        }`}
                      >
                        <span className="truncate font-semibold text-[#E6EDF3]">
                          {stageMeta?.label ?? span.stageId}
                        </span>

                        <span
                          className="inline-flex w-fit items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider"
                          style={{
                            color: barColor,
                            backgroundColor: `${barColor}1E`,
                          }}
                        >
                          {span.status}
                        </span>

                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#0D1117]">
                          <div
                            className={`absolute top-0 bottom-0 rounded-full ${
                              appReduced ? "" : "transition-[left,width,opacity] duration-300"
                            }`}
                            style={{
                              left: `${span.offsetPct.toFixed(2)}%`,
                              width: `${span.widthPct.toFixed(2)}%`,
                              backgroundColor: barColor,
                              opacity:
                                replayStepIdx === -1 || replayStepIdx >= idx ? 0.92 : 0.28,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3 tabular-nums sm:justify-end">
                          <span className="text-[#8B949E]">{span.metricDelta}</span>
                          <span className="min-w-[6ch] text-right font-semibold text-[#7DD3FC]">
                            {span.durationMs.toFixed(2)}ms
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div
                  aria-live="polite"
                  className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(240,246,252,0.06)] bg-[#161B22]/90 px-3 py-2 font-mono text-xs text-[#9DA7B3]"
                >
                  <span className="font-semibold text-[#38BDF8]">TRACE LOG:</span>
                  <span className="text-[#E6EDF3]">
                    {activeStepSpan
                      ? `[${activeStepSpan.stageId}] ${activeStepSpan.logLine}`
                      : `Click Replay Trace or Live Step to step through ${activeScenario.label} (${recordedTotalMs.toFixed(2)} ms across ${spanTimeline.length} spans).`}
                  </span>
                </div>
              </div>

              {/* Focused Stage Inspector (live feedback on stage selection) */}
              {(() => {
                const activeInspectorStage = stages.find(
                  (s) => s.id === focusedStageId
                );
                const displayStage =
                  activeInspectorStage ??
                  stages.find((s) => s.id === lastStageId);
                const isInspectorOpen = Boolean(activeInspectorStage);
                const inspectedActive = displayStage
                  ? effectiveStages.includes(displayStage.id)
                  : false;
                return (
                  <div
                    data-open={isInspectorOpen ? "true" : "false"}
                    inert={!isInspectorOpen ? true : undefined}
                    className="reveal-collapsible"
                  >
                    <div className="overflow-hidden">
                      {displayStage && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="rounded-2xl border border-[#38BDF8]/35 bg-[#38BDF8]/[0.07] p-4 sm:p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                              <span className="font-semibold text-[#7DD3FC]">
                                STAGE INSPECTOR · {displayStage.label}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs ${
                                  inspectedActive
                                    ? "bg-[#10B981]/15 text-[#10B981]"
                                    : "bg-[#161B22] text-[#8B949E]"
                                }`}
                              >
                                {inspectedActive ? "Active in Scenario" : "Bypassed / Skipped"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFocusedStageId(null)}
                              className="min-h-[44px] rounded-full border border-[rgba(240,246,252,0.14)] bg-[#0D1117] px-3.5 py-1.5 font-mono text-xs text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
                            >
                              Clear focus
                            </button>
                          </div>
                          <p className="mt-2 font-mono text-xs text-[#9DA7B3]">
                            Role: <span className="text-[#E6EDF3]">{displayStage.role}</span>
                          </p>
                          <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#E6EDF3]">
                            {displayStage.contract}
                          </p>
                          <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#9DA7B3]">
                            Fault behavior: {displayStage.faultBehavior}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Telemetry Summary + JSON Trace */}
              <div ref={telemetryPanelRef} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div aria-live="polite" className="space-y-3 lg:col-span-6">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[#9DA7B3]">
                    <span>Trigger: {activeScenario.trigger}</span>
                    <span>·</span>
                    <span className="text-[#38BDF8] tabular-nums">
                      <ScrambleMetric value={activeScenario.latencyLabel} />
                    </span>
                    <span>·</span>
                    <span>{activeScenario.vramOrCost}</span>
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                    {activeScenario.summary}
                  </p>
                  <div className="pt-1">
                    <TransitionLink
                      href={tab === "cinch" ? "/work/cinch" : "/work/nexus-researcher"}
                      className="group inline-flex min-h-[44px] items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#38BDF8] hover:text-[#7DD3FC]"
                    >
                      <span>Open full architecture notes</span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        weight="regular"
                        aria-hidden="true"
                      />
                    </TransitionLink>
                  </div>
                </div>

                <pre className="editorial-scroll overflow-x-auto rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4 font-mono text-xs leading-relaxed text-[#E6EDF3] lg:col-span-6">
                  <code>
                    {JSON.stringify(
                      {
                        ...activeScenario.payload,
                        recorded_total_ms: Number(recordedTotalMs.toFixed(2)),
                        replay_state: replayPlaying
                          ? "PLAYING"
                          : activeStepSpan
                            ? "STEPPED"
                            : "IDLE",
                        active_trace_span: activeStepSpan
                          ? {
                              stage: activeStepSpan.stageId,
                              status: activeStepSpan.status,
                              duration_ms: activeStepSpan.durationMs,
                              metric_delta: activeStepSpan.metricDelta,
                            }
                          : null,
                        stream_rate_multiplier: Number(rpsMultiplier.toFixed(1)),
                        pii_guard: piiGuardEnabled,
                        semantic_cache: semanticCacheEnabled,
                      },
                      null,
                      2
                    )}
                  </code>
                </pre>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
