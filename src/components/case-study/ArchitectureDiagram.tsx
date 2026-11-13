"use client";

import { useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import type { Project } from "@/data/projects";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";
import { ArchitectureDiagram3D } from "./ArchitectureDiagram3D";

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

const NODE_W = 190;
const NODE_H = 62;

export function ArchitectureDiagram({
  architecture,
  projectName,
}: ArchitectureDiagramProps) {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"2d" | "3d">("2d");

  const webglReady = hasMounted && webglSupported && effectiveTier !== "low";
  const show3D = mode === "3d" && webglReady;

  const nodes = architecture.nodes;
  const connections = architecture.connections;

  const layout = useMemo(() => {
    const count = nodes.length;
    const cols = Math.ceil(count / 2);
    const svgW = 960;
    const svgH = count <= 4 ? 190 : 340;
    const padX = 115;
    const stepX = cols > 1 ? (svgW - padX * 2) / (cols - 1) : 0;

    const positioned: PositionedNode[] = nodes.map((n, idx) => {
      const row = count <= 4 ? 0 : Math.floor(idx / cols);
      const colInRow = count <= 4 ? idx : idx % cols;
      const effectiveCol = row === 1 ? cols - 1 - colInRow : colInRow;
      const x = cols === 1 ? svgW / 2 : padX + effectiveCol * stepX;
      const y = count <= 4 ? 95 : row === 0 ? 82 : 252;
      return {
        id: n.id,
        label: n.label,
        desc: n.desc,
        x,
        y,
        index: idx,
      };
    });

    const byId = new Map(positioned.map((p) => [p.id, p]));
    return { positioned, byId, svgW, svgH };
  }, [nodes]);

  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % nodes.length);
    }, 1600);

    return () => window.clearInterval(timer);
  }, [playing, nodes.length]);

  const activeNode = layout.positioned[activeIndex] ?? layout.positioned[0];
  const outgoing = connections.filter((c) => c.from === activeNode?.id);
  const incoming = connections.filter((c) => c.to === activeNode?.id);

  return (
    <div className="double-bezel-outer w-full min-w-0">
      <div className="double-bezel-core min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3.5 sm:px-6">
          <div className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
            <span
              className={`h-2 w-2 rounded-full ${
                playing ? "bg-[#10B981]" : "bg-[#38BDF8]"
              }`}
              aria-hidden="true"
            />
            <span className="tabular-nums">
              Interactive Flow · Stage {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(nodes.length).padStart(2, "0")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {webglReady && (
              <div
                role="group"
                aria-label="Architecture diagram render mode"
                className="mr-1 inline-flex rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] p-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
              >
                <button
                  type="button"
                  onClick={() => setMode("2d")}
                  aria-pressed={mode === "2d"}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    mode === "2d"
                      ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                      : "text-[#8B949E] hover:text-[#E6EDF3]"
                  }`}
                >
                  2D Blueprint
                </button>
                <button
                  type="button"
                  onClick={() => setMode("3d")}
                  aria-pressed={mode === "3d"}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    mode === "3d"
                      ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                      : "text-[#8B949E] hover:text-[#E6EDF3]"
                  }`}
                >
                  3D Spatial
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setActiveIndex((prev) => (prev - 1 + nodes.length) % nodes.length);
              }}
              aria-label="Previous architecture stage"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.96]"
            >
              <CaretLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                playing
                  ? "border-[#38BDF8] bg-[#38BDF8] font-semibold text-[#0D1117] hover:bg-[#7DD3FC]"
                  : "border-[#38BDF8]/35 bg-[#38BDF8]/12 text-[#7DD3FC] hover:border-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0D1117]"
              }`}
            >
              {playing ? (
                <>
                  <Pause className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                  <span>Step flow</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setActiveIndex((prev) => (prev + 1) % nodes.length);
              }}
              aria-label="Next architecture stage"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.96]"
            >
              <CaretRight className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>
          </div>
        </div>

        {show3D ? (
          <ArchitectureDiagram3D
            architecture={architecture}
            activeIndex={activeIndex}
            onSelectNode={(idx) => {
              setPlaying(false);
              setActiveIndex(idx);
            }}
          />
        ) : (
          <div className="editorial-scroll overflow-x-auto bg-[#0D1117] p-4 sm:p-6">
          <svg
            viewBox={`0 0 ${layout.svgW} ${layout.svgH}`}
            className="h-auto w-full min-w-[660px] select-none"
            role="img"
            aria-label={`${projectName} system architecture diagram`}
          >
            <defs>
              <marker
                id="arrow-muted"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(139, 148, 158, 0.55)" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
              </marker>
            </defs>

            {connections.map((conn, idx) => {
              const from = layout.byId.get(conn.from);
              const to = layout.byId.get(conn.to);
              if (!from || !to) return null;

              const isActiveEdge =
                from.id === activeNode?.id || to.id === activeNode?.id;
              const sameRow = Math.abs(from.y - to.y) < 10;

              let pathD = "";
              let labelX = (from.x + to.x) / 2;
              let labelY = (from.y + to.y) / 2 - 8;

              if (sameRow && Math.abs(from.x - to.x) > 280) {
                const arcOffset = from.y < 150 ? -56 : 56;
                const ctrlY = from.y + arcOffset;
                pathD = `M ${from.x} ${from.y + (from.y < 150 ? -NODE_H / 2 : NODE_H / 2)} Q ${labelX} ${ctrlY} ${to.x} ${to.y + (to.y < 150 ? -NODE_H / 2 : NODE_H / 2)}`;
                labelY = ctrlY + (from.y < 150 ? 12 : -4);
              } else if (sameRow) {
                const dir = to.x > from.x ? 1 : -1;
                const x1 = from.x + dir * (NODE_W / 2);
                const x2 = to.x - dir * (NODE_W / 2 + 4);
                pathD = `M ${x1} ${from.y} L ${x2} ${to.y}`;
              } else {
                const dirY = to.y > from.y ? 1 : -1;
                const x1 = from.x;
                const y1 = from.y + dirY * (NODE_H / 2);
                const x2 = to.x;
                const y2 = to.y - dirY * (NODE_H / 2 + 4);
                const midY = (y1 + y2) / 2;
                pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
                labelX = (x1 + x2) / 2 + 10;
                labelY = midY;
              }

              return (
                <g key={`${conn.from}-${conn.to}-${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isActiveEdge ? "#38BDF8" : "rgba(139, 148, 158, 0.35)"
                    }
                    strokeWidth={isActiveEdge ? 2.1 : 1.25}
                    markerEnd={
                      isActiveEdge ? "url(#arrow-active)" : "url(#arrow-muted)"
                    }
                  />
                  {"label" in conn && conn.label && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      fill={isActiveEdge ? "#7DD3FC" : "#8B949E"}
                      fontSize="11"
                      fontWeight={isActiveEdge ? "600" : "500"}
                      stroke="#0D1117"
                      strokeWidth={4}
                      paintOrder="stroke"
                      strokeLinejoin="round"
                      fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}

            {layout.positioned.map((node) => {
              const isActive = node.index === activeIndex;
              const left = node.x - NODE_W / 2;
              const top = node.y - NODE_H / 2;

              return (
                <g
                  key={node.id}
                  onClick={() => {
                    setPlaying(false);
                    setActiveIndex(node.index);
                  }}
                  className="cursor-pointer [&:focus-visible_rect]:stroke-[#38BDF8] [&:focus-visible_rect]:stroke-[2.5]"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-label={`Inspect stage ${node.index + 1}: ${node.label}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPlaying(false);
                      setActiveIndex(node.index);
                    }
                  }}
                >
                  <rect
                    x={left}
                    y={top}
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill={isActive ? "#1C222B" : "#161B22"}
                    stroke={isActive ? "#38BDF8" : "rgba(240,246,252,0.16)"}
                    strokeWidth={isActive ? 1.8 : 1.15}
                  />
                  {isActive && (
                    <circle
                      cx={left + NODE_W - 14}
                      cy={top + 16}
                      r={3.5}
                      fill="#38BDF8"
                    />
                  )}
                  <text
                    x={left + 12}
                    y={top + 22}
                    fill={isActive ? "#38BDF8" : "#6E7681"}
                    fontSize="11"
                    fontWeight={isActive ? "600" : "500"}
                    fontFamily="var(--font-jetbrains-mono), ui-monospace, monospace"
                  >
                    {String(node.index + 1).padStart(2, "0")}
                  </text>
                  <text
                    x={left + 12}
                    y={top + 43}
                    fill="#E6EDF3"
                    fontSize="13.5"
                    fontWeight={isActive ? "600" : "500"}
                    fontFamily="var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
          </div>
        )}

        {activeNode && (
          <div
            aria-live="polite"
            className="grid grid-cols-1 gap-4 border-t border-[rgba(240,246,252,0.08)] bg-[#161B22] px-4 py-5 sm:px-6 md:grid-cols-12"
          >
            <div className="md:col-span-7">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
                Stage {String(activeNode.index + 1).padStart(2, "0")} ·{" "}
                {activeNode.label}
              </div>
              <p className="mt-1.5 text-base leading-relaxed text-[#E6EDF3]">
                {activeNode.desc}
              </p>
            </div>
            <div className="space-y-2 font-mono text-xs text-[#8B949E] md:col-span-5 md:border-l md:border-[rgba(240,246,252,0.08)] md:pl-6">
              <div>
                <span className="text-[#6E7681]">Incoming: </span>
                <span className="text-[#E6EDF3]">
                  {incoming.length > 0
                    ? incoming
                        .map(
                          (c) =>
                            `${layout.byId.get(c.from)?.label ?? c.from}${
                              "label" in c && c.label ? ` (${c.label})` : ""
                            }`
                        )
                        .join(", ")
                    : "Entry point"}
                </span>
              </div>
              <div>
                <span className="text-[#6E7681]">Outgoing: </span>
                <span className="text-[#E6EDF3]">
                  {outgoing.length > 0
                    ? outgoing
                        .map(
                          (c) =>
                            `${layout.byId.get(c.to)?.label ?? c.to}${
                              "label" in c && c.label ? ` (${c.label})` : ""
                            }`
                        )
                        .join(", ")
                    : "Terminal output"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
