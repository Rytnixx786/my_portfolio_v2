"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import type { Project } from "@/data/projects";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { classifyNodeKind, type ArchitectureNodeKind } from "@/lib/architecture";

const LazyArchitectureDiagram3D = dynamic(
  () =>
    import("./ArchitectureDiagram3D").then((mod) => mod.ArchitectureDiagram3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[340px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] font-mono text-xs text-[#8B949E] sm:h-[410px]">
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
  row: number;
  col: number;
  index: number;
  kind: ArchitectureNodeKind;
}

const NODE_W = 178;
const NODE_H = 56;

function kindDotColor(kind: PositionedNode["kind"]): string {
  switch (kind) {
    case "entry":
      return "#10B981";
    case "guard":
      return "#F59E0B";
    case "storage":
      return "#A8CE6C";
    default:
      return "#59C5EE";
  }
}

function quadPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function quadAngleDeg(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

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
    const cols = count <= 4 ? count : Math.ceil(count / 2);
    const svgW = 1080;
    const svgH = count <= 4 ? 216 : 374;
    const padX = 104;
    const stepX = cols > 1 ? (svgW - padX * 2) / (cols - 1) : 0;

    const positioned: PositionedNode[] = nodes.map((n, idx) => {
      const row = count <= 4 ? 0 : Math.floor(idx / cols);
      const colInRow = count <= 4 ? idx : idx % cols;
      const effectiveCol = row === 1 ? cols - 1 - colInRow : colInRow;
      const x = cols === 1 ? svgW / 2 : padX + effectiveCol * stepX;
      const y = count <= 4 ? 105 : row === 0 ? 104 : 264;
      return {
        id: n.id,
        label: n.label,
        desc: n.desc,
        x,
        y,
        row,
        col: effectiveCol,
        index: idx,
        kind: classifyNodeKind(n.id, idx),
      };
    });

    const byId = new Map(positioned.map((p) => [p.id, p]));
    const edgeSet = new Set(connections.map((c) => `${c.from}->${c.to}`));

    const routedEdges = connections
      .map((conn) => {
        const from = byId.get(conn.from);
        const to = byId.get(conn.to);
        if (!from || !to) return null;

        const hasReverse = edgeSet.has(`${conn.to}->${conn.from}`);
        const sameRow = from.row === to.row;
        const colSpan = Math.abs(from.col - to.col);

        let p0 = { x: from.x, y: from.y };
        let p2 = { x: to.x, y: to.y };
        let ctrl = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

        if (hasReverse) {
          const forward = from.index < to.index;
          const offset = forward ? -46 : 46;
          p0 = { x: from.x, y: from.y + (forward ? -10 : 10) };
          p2 = { x: to.x, y: to.y + (forward ? -10 : 10) };
          ctrl = {
            x: (p0.x + p2.x) / 2,
            y: (p0.y + p2.y) / 2 + offset,
          };
        } else if (sameRow && colSpan > 1) {
          const arcDir = from.row === 0 ? -78 : 78;
          p0 = { x: from.x, y: from.y + (from.row === 0 ? -NODE_H / 2 : NODE_H / 2) };
          p2 = { x: to.x, y: to.y + (to.row === 0 ? -NODE_H / 2 : NODE_H / 2) };
          ctrl = {
            x: (p0.x + p2.x) / 2,
            y: (p0.y + p2.y) / 2 + arcDir,
          };
        } else if (sameRow) {
          const goingRight = to.x > from.x;
          p0 = { x: from.x + (goingRight ? NODE_W / 2 : -NODE_W / 2), y: from.y };
          p2 = { x: to.x + (goingRight ? -NODE_W / 2 : NODE_W / 2), y: to.y };
          ctrl = {
            x: (p0.x + p2.x) / 2,
            y: from.y + (from.row === 0 ? -24 : 24),
          };
        } else {
          const goingDown = to.y > from.y;
          p0 = { x: from.x, y: from.y + (goingDown ? NODE_H / 2 : -NODE_H / 2) };
          p2 = { x: to.x, y: to.y + (goingDown ? -NODE_H / 2 : NODE_H / 2) };
          const dx = to.x - from.x;
          ctrl = {
            x: (p0.x + p2.x) / 2 + (Math.abs(dx) < 8 ? 22 : goingDown ? 18 : -18),
            y: (p0.y + p2.y) / 2,
          };
        }

        const pathD = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} Q ${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        const arrowT = sameRow && colSpan === 1 && !hasReverse ? 0.82 : 0.86;
        const arrowPt = quadPoint(p0, ctrl, p2, arrowT);
        const arrowDeg = quadAngleDeg(p0, ctrl, p2, arrowT);
        const labelPt = quadPoint(p0, ctrl, p2, 0.5);

        return {
          key: `${conn.from}-${conn.to}`,
          fromId: conn.from,
          toId: conn.to,
          label: "label" in conn ? conn.label : undefined,
          pathD,
          arrowPt,
          arrowDeg,
          labelPt,
        };
      })
      .filter(Boolean) as Array<{
      key: string;
      fromId: string;
      toId: string;
      label?: string;
      pathD: string;
      arrowPt: { x: number; y: number };
      arrowDeg: number;
      labelPt: { x: number; y: number };
    }>;

    return { positioned, byId, routedEdges, svgW, svgH };
  }, [nodes, connections]);

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % nodes.length);
    }, 1450);

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
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
              className={`inline-flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors ${
                playing
                  ? "border-[#10B981]/60 bg-[#10B981]/15 text-[#10B981] hover:border-[#10B981]"
                  : "border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] hover:border-[#38BDF8] hover:text-[#38BDF8]"
              }`}
            >
              {playing ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-[#10B981]" weight="fill" aria-hidden="true" />
                  <span>Pause Trace</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-[#10B981]" weight="fill" aria-hidden="true" />
                  <span>Play Trace</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setActiveIndex((i) => (i - 1 + nodes.length) % nodes.length);
              }}
              aria-label="Previous pipeline stage"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
            >
              <CaretLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setActiveIndex((i) => (i + 1) % nodes.length);
              }}
              aria-label="Next pipeline stage"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
            >
              <CaretRight className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>

            {playing && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/35 bg-[#10B981]/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#10B981] tabular-nums">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
                Stage {String(activeIndex + 1).padStart(2, "0")}/
                {String(nodes.length).padStart(2, "0")}
              </span>
            )}
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
              playing={playing}
              onSelectNode={(idx) => {
                setPlaying(false);
                setActiveIndex(idx);
              }}
            />
          ) : (
            <div
              className="relative overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-2 sm:p-4"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(240, 246, 252, 0.055) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            >
              {/* Semantic Legend */}
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 px-2 pt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8B949E]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Entry
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#59C5EE]" /> Compute
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Guard
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#A8CE6C]" /> Storage
                  </span>
                </div>
                <span className="hidden sm:inline">Click any stage node to inspect</span>
              </div>

              <svg
                viewBox={`0 0 ${layout.svgW} ${layout.svgH}`}
                className="block h-auto w-full select-none"
                role="img"
                aria-label={`${projectName} 2D architecture stage graph`}
              >
                {/* Edges */}
                {layout.routedEdges.map((edge) => {
                  const isOutgoing = edge.fromId === activeNode?.id;
                  const isIncoming = edge.toId === activeNode?.id;
                  const activeEdge = isOutgoing || isIncoming;
                  const strokeColor = isOutgoing
                    ? "#10B981"
                    : isIncoming
                      ? "#38BDF8"
                      : "rgba(240,246,252,0.18)";

                  return (
                    <g key={edge.key}>
                      <path
                        d={edge.pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={activeEdge ? 2.4 : 1.35}
                        strokeDasharray={activeEdge ? undefined : "5 5"}
                        strokeOpacity={activeEdge ? 0.95 : 0.7}
                      />

                      {/* Animated Trace Packet on Active Outgoing/Incoming Edges */}
                      {activeEdge && (
                        <circle
                          r={isOutgoing ? 4.4 : 3.4}
                          fill={isOutgoing ? "#10B981" : "#38BDF8"}
                        >
                          <animateMotion
                            dur={playing ? "0.95s" : "1.5s"}
                            repeatCount="indefinite"
                            path={edge.pathD}
                          />
                        </circle>
                      )}

                      {/* Directional Arrowhead */}
                      <polygon
                        points="-5,-3.6 5,0 -5,3.6"
                        fill={strokeColor}
                        fillOpacity={activeEdge ? 0.98 : 0.65}
                        transform={`translate(${edge.arrowPt.x.toFixed(1)}, ${edge.arrowPt.y.toFixed(1)}) rotate(${edge.arrowDeg.toFixed(1)})`}
                      />
                    </g>
                  );
                })}

                {/* Interactive Stage Nodes */}
                {layout.positioned.map((node) => {
                  const isActive = node.index === activeIndex;
                  const dotHex = kindDotColor(node.kind);
                  return (
                    <g
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Stage ${node.index + 1}: ${node.label}`}
                      transform={`translate(${node.x - NODE_W / 2}, ${node.y - NODE_H / 2})`}
                      onClick={() => {
                        setPlaying(false);
                        setActiveIndex(node.index);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setPlaying(false);
                          setActiveIndex(node.index);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {isActive && (
                        <rect
                          x={-3}
                          y={-3}
                          width={NODE_W + 6}
                          height={NODE_H + 6}
                          rx={16}
                          fill="none"
                          stroke="#38BDF8"
                          strokeOpacity={0.35}
                          strokeWidth={1.5}
                        />
                      )}
                      <rect
                        width={NODE_W}
                        height={NODE_H}
                        rx={14}
                        fill={isActive ? "#1C293B" : "#161B22"}
                        stroke={isActive ? "#38BDF8" : "rgba(240,246,252,0.16)"}
                        strokeWidth={isActive ? 2 : 1}
                      />
                      <circle
                        cx={NODE_W - 16}
                        cy={18}
                        r={3.5}
                        fill={dotHex}
                        fillOpacity={isActive ? 1 : 0.72}
                      />
                      <text
                        x={14}
                        y={22}
                        fill={isActive ? "#38BDF8" : "#8B949E"}
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="var(--font-mono), monospace"
                      >
                        {String(node.index + 1).padStart(2, "0")}
                      </text>
                      <text
                        x={14}
                        y={41}
                        fill="#E6EDF3"
                        fontSize="11.5"
                        fontWeight="600"
                        fontFamily="var(--font-sans), sans-serif"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}

                {/* Active Edge Label Pills (overlay pass so never occluded by stage cards) */}
                {layout.routedEdges.map((edge) => {
                  const isOutgoing = edge.fromId === activeNode?.id;
                  const isIncoming = edge.toId === activeNode?.id;
                  if ((!isOutgoing && !isIncoming) || !edge.label) return null;
                  const pillW = Math.max(72, edge.label.length * 6.6 + 18);

                  return (
                    <g
                      key={`lbl-${edge.key}`}
                      transform={`translate(${edge.labelPt.x.toFixed(1)}, ${edge.labelPt.y.toFixed(1)})`}
                      className="pointer-events-none"
                    >
                      <rect
                        x={-pillW / 2}
                        y={-10}
                        width={pillW}
                        height={20}
                        rx={10}
                        fill="#0D1117"
                        stroke={isOutgoing ? "#10B981" : "#38BDF8"}
                        strokeOpacity={0.75}
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        fill={isOutgoing ? "#10B981" : "#7DD3FC"}
                        fontSize="9.5"
                        fontWeight="600"
                        fontFamily="var(--font-mono), monospace"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
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
