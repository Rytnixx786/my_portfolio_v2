"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import type { Project } from "@/data/projects";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";

const LazyArchitectureDiagram3D = dynamic(
  () =>
    import("./ArchitectureDiagram3D").then((mod) => mod.ArchitectureDiagram3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] font-mono text-xs text-[#8B949E] sm:h-[380px]">
        Loading spatial 3D topology...
      </div>
    ),
  }
);

interface ArchitectureDiagramProps {
  architecture: Project["architecture"];
  projectName: string;
}

interface PositionedNode {
  id: string;
  label: string;
  desc: string;
  x: number;
  y: number;
  index: number;
}

const NODE_W = 186;
const NODE_H = 56;

export function ArchitectureDiagram({
  architecture,
  projectName,
}: ArchitectureDiagramProps) {
  const { canRender3D } = useCanRender3D();
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"2d" | "3d">("2d");

  const show3D = mode === "3d" && canRender3D;
  const nodes = architecture.nodes;
  const connections = architecture.connections;

  const layout = useMemo(() => {
    const count = nodes.length;
    const cols = Math.ceil(count / 2);
    const svgW = 960;
    const svgH = count <= 4 ? 185 : 325;
    const padX = 115;
    const stepX = cols > 1 ? (svgW - padX * 2) / (cols - 1) : 0;

    const positioned: PositionedNode[] = nodes.map((n, idx) => {
      const row = count <= 4 ? 0 : Math.floor(idx / cols);
      const colInRow = count <= 4 ? idx : idx % cols;
      const effectiveCol = row === 1 ? cols - 1 - colInRow : colInRow;
      const x = cols === 1 ? svgW / 2 : padX + effectiveCol * stepX;
      const y = count <= 4 ? 92 : row === 0 ? 78 : 244;
      return { id: n.id, label: n.label, desc: n.desc, x, y, index: idx };
    });

    const byId = new Map(positioned.map((p) => [p.id, p]));
    return { positioned, byId, svgW, svgH };
  }, [nodes]);

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % nodes.length);
    }, 1500);

    return () => window.clearInterval(timer);
  }, [playing, nodes.length]);

  const activeNode = layout.positioned[activeIndex] ?? layout.positioned[0];
  const outgoing = connections.filter((c) => c.from === activeNode?.id);
  const incoming = connections.filter((c) => c.to === activeNode?.id);

  return (
    <div className="double-bezel-outer w-full min-w-0">
      <div className="double-bezel-core min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
                setPlaying((p) => !p);
              }}
              aria-pressed={playing}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-[#E6EDF3] hover:border-[#38BDF8] hover:text-[#38BDF8]"
            >
              {playing ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                  <span>Pause Trace</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-[#10B981]" weight="regular" aria-hidden="true" />
                  <span>Play Trace</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex((i) => (i - 1 + nodes.length) % nodes.length)}
              aria-label="Previous pipeline stage"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#9DA7B3] hover:border-[#38BDF8] hover:text-[#E6EDF3]"
            >
              <CaretLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex((i) => (i + 1) % nodes.length)}
              aria-label="Next pipeline stage"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#9DA7B3] hover:border-[#38BDF8] hover:text-[#E6EDF3]"
            >
              <CaretRight className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>
          </div>

          {canRender3D && (
            <div className="inline-flex rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] p-0.5">
              <button
                type="button"
                onClick={() => setMode("2d")}
                aria-pressed={mode === "2d"}
                className={`rounded-full px-3 py-1 font-mono text-xs uppercase transition-colors ${
                  mode === "2d"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#9DA7B3] hover:text-[#E6EDF3]"
                }`}
              >
                2D Graph
              </button>
              <button
                type="button"
                onClick={() => setMode("3d")}
                aria-pressed={mode === "3d"}
                className={`rounded-full px-3 py-1 font-mono text-xs uppercase transition-colors ${
                  mode === "3d"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#9DA7B3] hover:text-[#E6EDF3]"
                }`}
              >
                3D Spatial
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {show3D ? (
            <LazyArchitectureDiagram3D
              architecture={architecture}
              activeIndex={activeIndex}
              onSelectNode={(idx) => {
                setPlaying(false);
                setActiveIndex(idx);
              }}
            />
          ) : (
            <svg
              viewBox={`0 0 ${layout.svgW} ${layout.svgH}`}
              className="hidden h-auto w-full select-none md:block"
              aria-hidden="true"
            >
              {connections.map((conn) => {
                const from = layout.byId.get(conn.from);
                const to = layout.byId.get(conn.to);
                if (!from || !to) return null;
                const activeEdge =
                  from.id === activeNode?.id || to.id === activeNode?.id;
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2 - 26;

                return (
                  <g key={`${conn.from}-${conn.to}`}>
                    <path
                      d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                      fill="none"
                      stroke={activeEdge ? "#38BDF8" : "rgba(240,246,252,0.16)"}
                      strokeWidth={activeEdge ? 2.4 : 1.3}
                      strokeDasharray={activeEdge ? undefined : "5 5"}
                    />
                  </g>
                );
              })}

              {layout.positioned.map((node) => {
                const isActive = node.index === activeIndex;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x - NODE_W / 2}, ${node.y - NODE_H / 2})`}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={14}
                      fill={isActive ? "#1C293B" : "#161B22"}
                      stroke={isActive ? "#38BDF8" : "rgba(240,246,252,0.14)"}
                      strokeWidth={isActive ? 2 : 1}
                    />
                    <text
                      x={14}
                      y={24}
                      fill={isActive ? "#38BDF8" : "#8B949E"}
                      fontSize="11"
                      fontFamily="var(--font-mono), monospace"
                    >
                      STAGE {String(node.index + 1).padStart(2, "0")}
                    </text>
                    <text
                      x={14}
                      y={42}
                      fill="#E6EDF3"
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="var(--font-sans), sans-serif"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Accessible HTML stage controls (works identically on desktop, mobile & screen readers) */}
          <ol
            aria-label={`${projectName} interactive architecture stages`}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            {layout.positioned.map((node) => {
              const isActive = node.index === activeIndex;
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setPlaying(false);
                      setActiveIndex(node.index);
                    }}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left font-mono text-xs transition-colors ${
                      isActive
                        ? "border-[#38BDF8] bg-[#38BDF8]/12 font-semibold text-[#E6EDF3]"
                        : "border-[rgba(240,246,252,0.08)] bg-[#0D1117] text-[#9DA7B3] hover:border-[rgba(240,246,252,0.22)] hover:text-[#E6EDF3]"
                    }`}
                  >
                    <span className="truncate">
                      <span className="mr-1.5 text-[#38BDF8]">
                        {String(node.index + 1).padStart(2, "0")}
                      </span>
                      {node.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Active Stage Details */}
          {activeNode && (
            <div
              className="rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#0D1117] p-4 sm:p-5"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                  Stage {String(activeNode.index + 1).padStart(2, "0")} · {activeNode.label}
                </p>
                <div className="flex flex-wrap gap-2 font-mono text-xs text-[#8B949E]">
                  {incoming.length > 0 && (
                    <span>In: {incoming.map((c) => c.from).join(", ")}</span>
                  )}
                  {outgoing.length > 0 && (
                    <span>Out: {outgoing.map((c) => c.to).join(", ")}</span>
                  )}
                </div>
              </div>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#E6EDF3] sm:text-base">
                {activeNode.desc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
