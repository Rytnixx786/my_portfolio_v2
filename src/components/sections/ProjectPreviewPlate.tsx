"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Project } from "@/data/projects";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { getCategoryHue } from "@/lib/palette";

const LazyProjectTopology3D = dynamic(
  () =>
    import("@/components/canvas/ProjectTopology3D").then(
      (mod) => mod.ProjectTopology3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[225px] w-full items-center justify-center bg-[#0D1117] font-mono text-xs text-[#8B949E] sm:h-[260px]">
        Loading interactive 3D topology...
      </div>
    ),
  }
);

const SCULPTURE_SLUGS = new Set(["cinch", "nexus-researcher", "ares"]);

interface ProjectPreviewPlateProps {
  project: Project;
  indexLabel: string;
  variant?: "featured" | "compact";
}

/**
 * Interactive topology preview supporting lazy-loaded 3D mini-labs on flagship
 * cards alongside an accessible SVG + HTML stage selector list.
 */
export function ProjectPreviewPlate({
  project,
  indexLabel,
  variant = "featured",
}: ProjectPreviewPlateProps) {
  const nodes = project.architecture.nodes;
  const connections = project.architecture.connections;
  const isFeatured = variant === "featured";
  const hue = getCategoryHue(project.category);

  const { canRender3D } = useCanRender3D();
  const supports3D = SCULPTURE_SLUGS.has(project.slug);

  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"3d" | "2d">(supports3D ? "3d" : "2d");
  const show3DStage = supports3D && viewMode === "3d" && canRender3D;

  const svgWidth = 640;
  const svgHeight = isFeatured ? 235 : 205;
  const count = nodes.length;

  const coords = nodes.map((node, i) => {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const x = 64 + t * (svgWidth - 128);
    const wave =
      project.slug === "cinch"
        ? Math.sin(t * Math.PI * 2.2) * 34
        : project.slug === "nexus-researcher"
          ? (i % 2 === 0 ? -24 : 26) + Math.cos(t * Math.PI) * 12
          : project.slug === "ares"
            ? Math.cos(t * Math.PI * 2) * 30
            : Math.sin(t * Math.PI * 1.6 + 0.6) * 26;

    const y = svgHeight * 0.5 + wave;
    return { ...node, x, y, index: i };
  });

  const coordMap = new Map(coords.map((c) => [c.id, c]));
  const activeNode = coords[activeIdx] ?? coords[0];

  return (
    <div className="relative overflow-hidden rounded-[calc(1.5rem-0.375rem)] border border-[rgba(240,246,252,0.08)] bg-[#0D1117] transition-transform duration-700 ease-out group-hover:scale-[1.015]">
      {/* Category Hue Hairline */}
      <div className="h-[2px] w-full" style={{ backgroundColor: hue.hex }} aria-hidden="true" />

      {/* Top Plate Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/90 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: hue.hex }}
            aria-hidden="true"
          />
          <span className="truncate font-semibold text-[#E6EDF3]">
            {indexLabel} · {project.category}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {supports3D && canRender3D ? (
            <div className="inline-flex rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                aria-pressed={viewMode === "3d"}
                className={`min-h-[44px] min-w-[44px] rounded-full px-3 py-1 font-mono text-xs uppercase transition-colors ${
                  viewMode === "3d"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => setViewMode("2d")}
                aria-pressed={viewMode === "2d"}
                className={`min-h-[44px] min-w-[44px] rounded-full px-3 py-1 font-mono text-xs uppercase transition-colors ${
                  viewMode === "2d"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                Graph
              </button>
            </div>
          ) : (
            <span className="shrink-0 font-mono text-xs text-[#8B949E] tabular-nums">
              2D Graph · {nodes.length} stages
            </span>
          )}
        </div>
      </div>

      {show3DStage ? (
        <LazyProjectTopology3D slug={project.slug} />
      ) : (
        <div
          className="relative p-3 sm:p-4"
          style={{
            backgroundImage:
              "radial-gradient(rgba(240, 246, 252, 0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="h-auto w-full select-none"
            aria-hidden="true"
          >
            {connections.map((conn) => {
              const from = coordMap.get(conn.from);
              const to = coordMap.get(conn.to);
              if (!from || !to) return null;
              const isHighlighted =
                from.id === activeNode?.id || to.id === activeNode?.id;
              const mx = (from.x + to.x) / 2;
              const my = Math.min(from.y, to.y) - 24;

              return (
                <path
                  key={`${conn.from}-${conn.to}`}
                  d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={isHighlighted ? hue.hex : "rgba(240,246,252,0.16)"}
                  strokeWidth={isHighlighted ? 2.4 : 1.2}
                  strokeDasharray={isHighlighted ? undefined : "4 4"}
                />
              );
            })}

            {coords.map((node) => {
              const isActive = node.index === activeIdx;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setActiveIdx(node.index)}
                  style={{ cursor: "pointer" }}
                >
                  {isActive && (
                    <circle
                      r={22}
                      fill="none"
                      stroke={hue.hex}
                      strokeOpacity={0.35}
                      strokeWidth={1.2}
                    />
                  )}
                  <circle
                    r={isActive ? 16 : 12}
                    fill={isActive ? hue.softBg : "#161B22"}
                    stroke={isActive ? hue.hex : "rgba(240,246,252,0.22)"}
                    strokeWidth={isActive ? 2 : 1.2}
                  />
                  <text
                    y={4}
                    textAnchor="middle"
                    fill={isActive ? "#E6EDF3" : "#9DA7B3"}
                    fontSize="12"
                    fontFamily="var(--font-mono), monospace"
                    fontWeight="600"
                  >
                    {node.index + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Accessible HTML stage switcher buttons (replaces SVG-trapped buttons) */}
          <ol
            aria-label={`${project.name} execution stages`}
            className="mt-2 flex flex-wrap gap-1.5"
          >
            {coords.map((node) => {
              const isActive = node.index === activeIdx;
              return (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => setActiveIdx(node.index)}
                    aria-pressed={isActive}
                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-xs transition-colors ${
                      isActive
                        ? "border-[#38BDF8] bg-[#38BDF8]/12 font-semibold text-[#E6EDF3]"
                        : "border-[rgba(240,246,252,0.08)] bg-[#161B22] text-[#9DA7B3] hover:border-[rgba(240,246,252,0.22)] hover:text-[#E6EDF3]"
                    }`}
                  >
                    <span style={{ color: isActive ? hue.labelText : "#8B949E" }}>
                      {String(node.index + 1).padStart(2, "0")}
                    </span>
                    <span>{node.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {activeNode && (
            <div className="mt-3 rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] px-3.5 py-2.5">
              <p className="font-mono text-xs font-semibold text-[#E6EDF3]">
                {activeNode.label}
              </p>
              <p className="mt-0.5 font-sans text-xs leading-relaxed text-[#9DA7B3]">
                {activeNode.desc}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
