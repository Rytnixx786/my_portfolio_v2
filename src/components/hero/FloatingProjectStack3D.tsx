"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Cpu,
  Database,
  GitBranch,
  ShieldCheck,
} from "@phosphor-icons/react";
import { projects, type Project } from "@/data/projects";

const FLAGSHIP_SLUGS = ["cinch", "nexus-researcher", "ares", "mindstack"] as const;

type FlagshipSlug = (typeof FLAGSHIP_SLUGS)[number];

interface FloatingProjectStack3DProps {
  className?: string;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
}

function SystemGlyph({ slug }: { slug: string }) {
  switch (slug as FlagshipSlug) {
    case "cinch":
      return <Cpu className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />;
    case "nexus-researcher":
      return <GitBranch className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />;
    case "ares":
      return <ShieldCheck className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />;
    case "mindstack":
      return <Database className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />;
    default:
      return <Cpu className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />;
  }
}

function MiniArchitecturePreview({ slug }: { slug: string }) {
  if (slug === "cinch") {
    return (
      <svg viewBox="0 0 280 46" className="h-11 w-full" fill="none" aria-hidden="true">
        <line x1="20" y1="23" x2="260" y2="23" stroke="rgba(240,246,252,0.12)" strokeWidth="1.5" />
        <line
          x1="20"
          y1="23"
          x2="188"
          y2="23"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        {[
          { x: 20, label: "FSM", active: false },
          { x: 96, label: "CACHE", active: true },
          { x: 172, label: "PID", active: false },
          { x: 248, label: "vLLM", active: true },
        ].map((node) => (
          <g key={node.label}>
            <rect
              x={node.x - 16}
              y="11"
              width="32"
              height="24"
              rx="6"
              fill={node.active ? "rgba(56,189,248,0.14)" : "#161B22"}
              stroke={node.active ? "#38BDF8" : "rgba(240,246,252,0.16)"}
              strokeWidth="1.2"
            />
            <text
              x={node.x}
              y="26"
              textAnchor="middle"
              fill={node.active ? "#7DD3FC" : "#8B949E"}
              fontSize="7"
              fontFamily="var(--font-mono), monospace"
              fontWeight="600"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "nexus-researcher") {
    return (
      <svg viewBox="0 0 280 46" className="h-11 w-full" fill="none" aria-hidden="true">
        <path d="M 28 24 L 96 24 L 164 24 L 236 24" stroke="rgba(240,246,252,0.14)" strokeWidth="1.5" />
        <path
          d="M 236 14 C 200 2, 64 2, 28 14"
          stroke="#38BDF8"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        {[
          { x: 28, label: "PLAN", active: false },
          { x: 96, label: "HITL", active: true },
          { x: 164, label: "PG", active: false },
          { x: 236, label: "GATE", active: true },
        ].map((node) => (
          <g key={node.label}>
            <circle
              cx={node.x}
              cy="24"
              r="14"
              fill={node.active ? "rgba(56,189,248,0.14)" : "#161B22"}
              stroke={node.active ? "#38BDF8" : "rgba(240,246,252,0.16)"}
              strokeWidth="1.2"
            />
            <text
              x={node.x}
              y="26.5"
              textAnchor="middle"
              fill={node.active ? "#7DD3FC" : "#8B949E"}
              fontSize="6.5"
              fontFamily="var(--font-mono), monospace"
              fontWeight="600"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (slug === "ares") {
    return (
      <svg viewBox="0 0 280 46" className="h-11 w-full" fill="none" aria-hidden="true">
        <line x1="10" y1="12" x2="270" y2="12" stroke="#38BDF8" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="3 3" />
        {[
          { x: 18, h: 24, label: "F1" },
          { x: 74, h: 28, label: "SLICE" },
          { x: 130, h: 22, label: "P95" },
          { x: 186, h: 26, label: "DRIFT" },
          { x: 242, h: 30, label: "CI" },
        ].map((bar) => (
          <g key={bar.label}>
            <rect
              x={bar.x}
              y={40 - bar.h}
              width="24"
              height={bar.h}
              rx="4"
              fill="rgba(56,189,248,0.12)"
              stroke="#38BDF8"
              strokeWidth="1.1"
            />
            <text
              x={bar.x + 12}
              y="34"
              textAnchor="middle"
              fill="#7DD3FC"
              fontSize="6.5"
              fontFamily="var(--font-mono), monospace"
              fontWeight="600"
            >
              {bar.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 280 46" className="h-11 w-full" fill="none" aria-hidden="true">
      <path d="M 52 14 L 136 23 L 52 32" stroke="rgba(240,246,252,0.16)" strokeWidth="1.4" />
      <path d="M 136 23 L 228 23" stroke="#38BDF8" strokeWidth="1.6" />
      <rect x="14" y="5" width="44" height="15" rx="4" fill="#161B22" stroke="rgba(240,246,252,0.18)" strokeWidth="1.1" />
      <text x="36" y="15" textAnchor="middle" fill="#8B949E" fontSize="6.5" fontFamily="var(--font-mono), monospace">
        BM25
      </text>
      <rect x="14" y="26" width="44" height="15" rx="4" fill="#161B22" stroke="rgba(240,246,252,0.18)" strokeWidth="1.1" />
      <text x="36" y="36" textAnchor="middle" fill="#8B949E" fontSize="6.5" fontFamily="var(--font-mono), monospace">
        DENSE
      </text>
      <rect x="114" y="13" width="46" height="20" rx="5" fill="rgba(56,189,248,0.14)" stroke="#38BDF8" strokeWidth="1.2" />
      <text x="137" y="25.5" textAnchor="middle" fill="#7DD3FC" fontSize="6.5" fontFamily="var(--font-mono), monospace" fontWeight="600">
        RRF k=60
      </text>
      <rect x="206" y="13" width="58" height="20" rx="5" fill="#E6EDF3" />
      <text x="235" y="25.5" textAnchor="middle" fill="#0D1117" fontSize="6.5" fontFamily="var(--font-mono), monospace" fontWeight="700">
        NLI GATE
      </text>
    </svg>
  );
}

export function FloatingProjectStack3D({
  className = "",
  activeIndex: controlledIndex,
  onActiveChange,
}: FloatingProjectStack3DProps) {
  const flagshipProjects = useMemo<Project[]>(() => {
    const bySlug = new Map(projects.map((p) => [p.slug, p]));
    return FLAGSHIP_SLUGS.map((slug) => bySlug.get(slug)).filter(
      (p): p is Project => Boolean(p)
    );
  }, []);

  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDesktop3D, setIsDesktop3D] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 35 });
  const currentRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 35 });
  const hoveringRef = useRef(false);

  const total = flagshipProjects.length;
  const activeProject = flagshipProjects[activeIndex] ?? flagshipProjects[0];

  const selectIndex = useCallback(
    (next: number) => {
      setInternalIndex(next);
      onActiveChange?.(next);
    },
    [onActiveChange]
  );

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopMq = window.matchMedia("(min-width: 768px)");

    const sync = () => {
      setReducedMotion(motionMq.matches);
      setIsDesktop3D(desktopMq.matches && !motionMq.matches);
    };

    sync();
    motionMq.addEventListener("change", sync);
    desktopMq.addEventListener("change", sync);
    return () => {
      motionMq.removeEventListener("change", sync);
      desktopMq.removeEventListener("change", sync);
    };
  }, []);

  const animateTilt = useCallback(() => {
    const rig = rigRef.current;
    if (!rig) {
      rafRef.current = null;
      return;
    }

    const cur = currentRef.current;
    const tgt = targetRef.current;
    const ease = 0.12;

    cur.rx += (tgt.rx - cur.rx) * ease;
    cur.ry += (tgt.ry - cur.ry) * ease;
    cur.gx += (tgt.gx - cur.gx) * ease;
    cur.gy += (tgt.gy - cur.gy) * ease;

    rig.style.setProperty("--stack-rx", `${cur.rx.toFixed(2)}deg`);
    rig.style.setProperty("--stack-ry", `${cur.ry.toFixed(2)}deg`);
    rig.style.setProperty("--stack-gx", `${cur.gx.toFixed(1)}%`);
    rig.style.setProperty("--stack-gy", `${cur.gy.toFixed(1)}%`);

    const settled =
      !hoveringRef.current &&
      Math.abs(tgt.rx - cur.rx) < 0.03 &&
      Math.abs(tgt.ry - cur.ry) < 0.03;

    if (settled) {
      rig.style.setProperty("--stack-rx", "0deg");
      rig.style.setProperty("--stack-ry", "0deg");
      rafRef.current = null;
      return;
    }

    rafRef.current = window.requestAnimationFrame(animateTilt);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDesktop3D || reducedMotion || e.pointerType === "touch") return;
      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      hoveringRef.current = true;
      targetRef.current = {
        rx: -ny * 10,
        ry: nx * 12,
        gx: (nx + 0.5) * 100,
        gy: (ny + 0.5) * 100,
      };

      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(animateTilt);
      }
    },
    [animateTilt, isDesktop3D, reducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    hoveringRef.current = false;
    targetRef.current = { rx: 0, ry: 0, gx: 50, gy: 35 };
    if (isDesktop3D && !reducedMotion && rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(animateTilt);
    }
  }, [animateTilt, isDesktop3D, reducedMotion]);

  const goNext = useCallback(() => {
    selectIndex((activeIndex + 1) % total);
  }, [activeIndex, selectIndex, total]);

  const goPrev = useCallback(() => {
    selectIndex((activeIndex - 1 + total) % total);
  }, [activeIndex, selectIndex, total]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  if (!activeProject) return null;

  return (
    <div
      className={`w-full select-none ${className}`}
      onKeyDown={handleKeyDown}
      aria-roledescription="interactive project stack"
      aria-label="Flagship AI Systems 3D Stack"
    >
      <style>{`
        @keyframes stackGentleFloat {
          0%, 100% { transform: translate3d(0, 0px, 0); }
          50% { transform: translate3d(0, -6px, 0); }
        }
        .hero-stack-float {
          animation: stackGentleFloat 6.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-stack-float {
            animation: none !important;
          }
        }
      `}</style>

      {/* Stack Header Label */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#8B949E]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" aria-hidden="true" />
          <span>Production Systems Stack</span>
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6E7681] tabular-nums">
          0{activeIndex + 1} / 0{total}
        </span>
      </div>

      {/* Desktop 3D Perspective Stage */}
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative w-full"
        style={isDesktop3D ? { perspective: "1200px" } : undefined}
      >
        <div
          ref={rigRef}
          className={`relative w-full ${
            isDesktop3D ? "hero-stack-float h-[356px] sm:h-[344px] md:h-[360px] lg:h-[340px]" : ""
          }`}
          style={
            isDesktop3D
              ? {
                  transformStyle: "preserve-3d",
                  transform: "rotateX(var(--stack-rx, 0deg)) rotateY(var(--stack-ry, 0deg))",
                  willChange: "transform",
                }
              : undefined
          }
        >
          {flagshipProjects.map((project, idx) => {
            const offset = (idx - activeIndex + total) % total;
            const isActive = offset === 0;

            if (!isDesktop3D && !isActive) {
              return null;
            }

            const desktopTransform =
              offset === 0
                ? "translate3d(0px, 0px, 36px) rotateZ(0deg) scale(1)"
                : offset === 1
                  ? "translate3d(8px, 14px, -12px) rotateZ(1deg) scale(0.96)"
                  : offset === 2
                    ? "translate3d(15px, 26px, -54px) rotateZ(1.8deg) scale(0.92)"
                    : "translate3d(20px, 36px, -92px) rotateZ(2.4deg) scale(0.88)";

            const desktopOpacity =
              offset === 0 ? 1 : offset === 1 ? 0.88 : offset === 2 ? 0.65 : 0.42;

            return (
              <div
                key={project.slug}
                onClick={!isActive ? () => selectIndex(idx) : undefined}
                role={!isActive ? "button" : undefined}
                tabIndex={!isActive ? 0 : undefined}
                onKeyDown={
                  !isActive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectIndex(idx);
                        }
                      }
                    : undefined
                }
                aria-label={!isActive ? `Bring ${project.name} to front` : undefined}
                className={
                  isDesktop3D
                    ? `absolute inset-x-0 top-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isActive
                          ? "z-30"
                          : offset === 1
                            ? "z-20 cursor-pointer"
                            : offset === 2
                              ? "z-10 cursor-pointer"
                              : "z-0 cursor-pointer"
                      }`
                    : "relative w-full"
                }
                style={
                  isDesktop3D
                    ? {
                        transform: desktopTransform,
                        opacity: desktopOpacity,
                        transformStyle: "preserve-3d",
                      }
                    : undefined
                }
              >
                {/* Double-Bezel Outer Shell */}
                <div
                  className={`rounded-[1.5rem] p-1.5 transition-colors duration-500 ${
                    isActive
                      ? "bg-[#161B22] ring-1 ring-[#38BDF8]/35"
                      : "bg-[#161B22]/90 ring-1 ring-[rgba(240,246,252,0.08)] hover:ring-[#38BDF8]/30"
                  }`}
                >
                  {/* Double-Bezel Inner Core */}
                  <div
                    className={`relative overflow-hidden rounded-[calc(1.5rem-0.375rem)] border p-4 sm:p-5 ${
                      isActive
                        ? "border-[#38BDF8]/20 bg-[#1C222B]"
                        : "border-[rgba(240,246,252,0.08)] bg-[#161B22]"
                    }`}
                  >
                    {/* Dynamic electric cyan spotlight following pointer */}
                    {isActive && isDesktop3D && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-75"
                        style={{
                          background:
                            "radial-gradient(circle at var(--stack-gx, 50%) var(--stack-gy, 35%), rgba(56, 189, 248, 0.11) 0%, rgba(28, 34, 43, 0) 62%)",
                        }}
                      />
                    )}

                    {/* Top Electric Cyan Accent Hairline */}
                    <div
                      aria-hidden="true"
                      className={`absolute inset-x-5 top-0 h-[2px] rounded-full transition-opacity duration-500 ${
                        isActive
                          ? "bg-[#38BDF8] opacity-100"
                          : "bg-[rgba(240,246,252,0.12)] opacity-60"
                      }`}
                    />

                    <div className="relative z-10 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <SystemGlyph slug={project.slug} />
                            <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[#38BDF8]">
                              {project.eyebrow}
                            </span>
                          </div>
                          <h2 className="mt-1 truncate font-display text-[1.4rem] font-bold uppercase leading-none tracking-[-0.01em] text-[#E6EDF3] lg:text-[1.65rem]">
                            {project.name}
                          </h2>
                        </div>

                        {isActive ? (
                          <Link
                            href={`/work/${project.slug}`}
                            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/12 py-1 pl-3 pr-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#7DD3FC] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0D1117] active:scale-[0.98]"
                          >
                            <span>Inspect</span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0D1117]/40 text-[#7DD3FC] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#0D1117]/20 group-hover:text-[#0D1117]">
                              <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                            </span>
                          </Link>
                        ) : (
                          <span className="shrink-0 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#6E7681]">
                            0{idx + 1}
                          </span>
                        )}
                      </div>

                      {/* Micro-Topology Plate */}
                      <div className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117]/80 px-2.5 py-1.5">
                        <MiniArchitecturePreview slug={project.slug} />
                      </div>

                      {/* Top 2 Metrics */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {project.highlightMetrics.slice(0, 2).map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] px-3 py-2"
                          >
                            <div className="font-display text-lg font-bold leading-none tracking-tight text-[#E6EDF3] tabular-nums sm:text-xl">
                              {metric.value}
                            </div>
                            <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[#8B949E]">
                              {metric.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Stack Pills */}
                      <div className="flex items-center justify-between gap-2 border-t border-[rgba(240,246,252,0.08)] pt-2.5">
                        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                          {project.tech.slice(0, 3).map((item) => (
                            <span
                              key={item}
                              className="whitespace-nowrap rounded-md border border-[rgba(240,246,252,0.06)] bg-[#161B22] px-2 py-0.5 font-mono text-[10px] text-[#8B949E]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6E7681] xl:inline">
                          /work/{project.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Stack Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 md:mt-8">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label="Select flagship project"
        >
          {flagshipProjects.map((project, idx) => {
            const selected = idx === activeIndex;
            return (
              <button
                key={project.slug}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectIndex(idx)}
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
                  selected
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "border border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#8B949E] hover:border-[#38BDF8]/45 hover:text-[#E6EDF3]"
                }`}
              >
                {project.name === "Nexus Researcher" ? "Nexus" : project.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous flagship project"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#E6EDF3] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/50 hover:bg-[#1C222B] hover:text-[#38BDF8] active:scale-[0.95]"
          >
            <CaretLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next flagship project"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#E6EDF3] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/50 hover:bg-[#1C222B] hover:text-[#38BDF8] active:scale-[0.95]"
          >
            <CaretRight className="h-4 w-4" weight="regular" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FloatingProjectStack3D;
