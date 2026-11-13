"use client";

import { useState } from "react";
import type { Project } from "@/data/projects";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";
import { ProjectTopology3D } from "@/components/canvas/ProjectTopology3D";

const SCULPTURE_SLUGS = new Set(["cinch", "nexus-researcher", "ares"]);

interface ProjectPreviewPlateProps {
  project: Project;
  indexLabel: string;
  variant?: "featured" | "compact";
}

/**
 * Interactive dark-compute SVG topology explorer derived strictly from
 * project.architecture and project.highlightMetrics. Users can inspect stages
 * directly in place on hover/tap/focus.
 */
export function ProjectPreviewPlate({
  project,
  indexLabel,
  variant = "featured",
}: ProjectPreviewPlateProps) {
  const nodes = project.architecture.nodes;
  const connections = project.architecture.connections;
  const isFeatured = variant === "featured";

  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const supports3D = SCULPTURE_SLUGS.has(project.slug);
  const webglReady = hasMounted && webglSupported && effectiveTier !== "low";

  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"3d" | "2d">(supports3D ? "3d" : "2d");
  const show3DStage = supports3D && viewMode === "3d" && webglReady;

  const svgWidth = 640;
  const svgHeight = isFeatured ? 305 : 245;
  const count = nodes.length;

  const coords = nodes.map((node, i) => {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const x = 68 + t * (svgWidth - 136);
    const wave =
      project.slug === "cinch"
        ? Math.sin(t * Math.PI * 2.2) * 42
        : project.slug === "nexus-researcher"
          ? (i % 2 === 0 ? -30 : 32) + Math.cos(t * Math.PI) * 14
          : project.slug === "ares"
            ? Math.cos(t * Math.PI * 2) * 36
            : project.slug === "mindstack"
              ? i === 1
                ? -42
                : i === 2
                  ? 42
                  : Math.sin(t * Math.PI) * 12
              : Math.sin(t * Math.PI * 1.6 + 0.6) * 30;

    const y = svgHeight * 0.5 + wave;
    return { ...node, x, y, index: i };
  });

  const coordMap = new Map(coords.map((c) => [c.id, c]));
  const activeNode = coords[activeIdx] ?? coords[0];

  return (
    <div className="relative overflow-hidden rounded-[calc(1.5rem-0.375rem)] border border-[rgba(240,246,252,0.08)] bg-[#0D1117]">
      {/* Subtle coordinate matrix */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(240,246,252,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(240,246,252,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top Plate Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/90 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8B949E]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" aria-hidden="true" />
          <span className="truncate font-semibold text-[#E6EDF3]">
            {indexLabel} · {project.category}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {supports3D && webglReady ? (
            <div className="inline-flex rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                aria-pressed={viewMode === "3d"}
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                  viewMode === "3d"
                    ? "bg-[#38BDF8] text-[#0D1117]"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                3D Model
              </button>
              <button
                type="button"
                onClick={() => setViewMode("2d")}
                aria-pressed={viewMode === "2d"}
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                  viewMode === "2d"
                    ? "bg-[#38BDF8] text-[#0D1117]"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                2D Stages
              </button>
            </div>
          ) : (
            <span className="shrink-0 text-[#38BDF8] tabular-nums">
              {nodes.length} STAGES · INTERACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Interactive 3D Sculpture or SVG Topology Canvas */}
      {show3DStage ? (
        <div className="relative z-10 px-2 py-2.5 sm:px-4">
          <div className="relative">
            <ProjectTopology3D
              slug={project.slug}
              className={isFeatured ? "h-48 sm:h-56 w-full" : "h-40 sm:h-44 w-full"}
            />
            <span className="pointer-events-none absolute bottom-1 right-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6E7681]">
              Drag to inspect mesh
            </span>
          </div>
        </div>
      ) : (
        <div className="relative z-10 px-2 py-2.5 sm:px-4">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={`${project.name} interactive architecture topology`}
          className={`w-full ${isFeatured ? "h-48 sm:h-56" : "h-40 sm:h-44"}`}
        >
          <line
            x1="36"
            y1={svgHeight * 0.5}
            x2={svgWidth - 36}
            y2={svgHeight * 0.5}
            stroke="rgba(240,246,252,0.08)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Directed Edges */}
          {connections.map((conn, idx) => {
            const from = coordMap.get(conn.from);
            const to = coordMap.get(conn.to);
            if (!from || !to) return null;

            const isFeedback = to.x < from.x;
            const isConnected =
              from.id === activeNode?.id || to.id === activeNode?.id;
            const midX = (from.x + to.x) * 0.5;
            const ctrlY = isFeedback
              ? Math.max(from.y, to.y) + 52
              : (from.y + to.y) * 0.5 - (idx % 2 === 0 ? 18 : -18);

            return (
              <path
                key={`${conn.from}-${conn.to}-${idx}`}
                d={`M ${from.x} ${from.y} Q ${midX} ${ctrlY} ${to.x} ${to.y}`}
                fill="none"
                stroke={isConnected ? "#38BDF8" : "#8B949E"}
                strokeOpacity={isConnected ? 0.9 : isFeedback ? 0.4 : 0.2}
                strokeWidth={isConnected ? 2.1 : 1.25}
                strokeDasharray={isFeedback ? "5 4" : undefined}
              />
            );
          })}

          {/* Primary Pipeline Spine */}
          {coords.length > 1 && (
            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeOpacity="0.28"
              strokeWidth="1.4"
              points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
            />
          )}

          {/* Interactive Stage Nodes */}
          {coords.map((pt, idx) => {
            const isActive = idx === activeIdx;
            const showLabelBelow = pt.y >= svgHeight * 0.5;
            const shortLabel =
              pt.label.length > 15 ? `${pt.label.slice(0, 13)}..` : pt.label;

            return (
              <g
                key={pt.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${pt.label} stage`}
                aria-pressed={isActive}
                onMouseEnter={() => setActiveIdx(idx)}
                onFocus={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveIdx(idx);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                {/* Invisible generous hit zone */}
                <circle cx={pt.x} cy={pt.y} r={20} fill="transparent" />

                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={14}
                    fill="#38BDF8"
                    fillOpacity="0.16"
                    stroke="#38BDF8"
                    strokeOpacity="0.45"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6.5 : 4.8}
                  fill={isActive ? "#38BDF8" : "#161B22"}
                  stroke={isActive ? "#E6EDF3" : "#8B949E"}
                  strokeWidth="1.75"
                />

                <text
                  x={pt.x}
                  y={showLabelBelow ? pt.y - 14 : pt.y + 18}
                  textAnchor="middle"
                  fill={isActive ? "#7DD3FC" : "#6E7681"}
                  fontSize="9"
                  fontFamily="var(--font-jetbrains-mono), monospace"
                  fontWeight="600"
                >
                  0{idx + 1}
                </text>

                {(isFeatured || isActive || idx % 2 === 0) && (
                  <text
                    x={pt.x}
                    y={showLabelBelow ? pt.y + 20 : pt.y - 16}
                    textAnchor="middle"
                    fill={isActive ? "#E6EDF3" : "#8B949E"}
                    fontSize={isFeatured ? "10" : "9.2"}
                    fontWeight={isActive ? "600" : "400"}
                    fontFamily="var(--font-jetbrains-mono), monospace"
                  >
                    {shortLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        </div>
      )}

      {/* Inline Interactive Stage Telemetry Readout */}
      {activeNode && (
        <div
          aria-live="polite"
          className="relative z-10 flex items-center justify-between gap-3 border-t border-[rgba(240,246,252,0.08)] bg-[#161B22] px-4 py-2.5 font-mono text-[11px]"
        >
          <div className="min-w-0 truncate">
            <span className="font-semibold text-[#38BDF8]">
              0{activeNode.index + 1} {activeNode.label}:
            </span>{" "}
            <span className="text-[#8B949E]">{activeNode.desc}</span>
          </div>
          <span className="shrink-0 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7DD3FC] tabular-nums">
            {project.highlightMetrics[0]?.value} {project.highlightMetrics[0]?.label}
          </span>
        </div>
      )}
    </div>
  );
}
