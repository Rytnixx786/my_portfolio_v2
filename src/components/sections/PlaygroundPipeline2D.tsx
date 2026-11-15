"use client";

import { useMemo } from "react";

export interface PlaygroundPipeline2DProps {
  tab: "cinch" | "rag";
  scenarioId: string;
  stages: ReadonlyArray<{ id: string; label: string }>;
  activeStages: string[];
  statusColor: "#10B981" | "#38BDF8" | "#F59E0B" | "#EF4444";
  focusedStageId?: string | null;
  rpsMultiplier?: number;
  onSelectStage?: (stageId: string) => void;
}

const NODE_X = [90, 234, 378, 522, 666, 810] as const;
const BUS_Y = 128;

/**
 * Zero-GPU interactive 2D architectural schematic for SystemsPlayground (2D SAFE mode & WebGL fallback).
 */
export function PlaygroundPipeline2D({
  tab,
  scenarioId,
  stages,
  activeStages,
  statusColor,
  focusedStageId = null,
  rpsMultiplier = 1,
  onSelectStage,
}: PlaygroundPipeline2DProps) {
  const isCacheBypass = scenarioId === "cache-hit";
  const isFaultTrip =
    scenarioId === "breaker-open" ||
    scenarioId === "budget-cutoff" ||
    scenarioId === "nli-refusal";
  const isHitlPause = scenarioId === "hitl-replan";

  const activeIndices = useMemo(
    () =>
      stages
        .map((s, idx) => (activeStages.includes(s.id) ? idx : -1))
        .filter((idx) => idx >= 0),
    [stages, activeStages]
  );

  const lastActiveIdx =
    activeIndices.length > 0 ? activeIndices[activeIndices.length - 1] : 0;
  const startX = NODE_X[0];
  const endX = NODE_X[lastActiveIdx] ?? NODE_X[0];

  const bypassPath = useMemo(() => {
    const hitX = NODE_X[3]; // 04 ONNX Cache
    return `M ${startX} ${BUS_Y} L ${hitX} ${BUS_Y} C ${hitX + 42} ${BUS_Y - 76}, ${startX + 90} ${BUS_Y - 76}, ${startX} ${BUS_Y - 38}`;
  }, [startX]);

  const activeRailPath = `M ${startX} ${BUS_Y} L ${endX} ${BUS_Y}`;
  const animDur = `${Math.max(0.8, 2.1 / Math.max(0.5, rpsMultiplier)).toFixed(2)}s`;

  const scenarioAnnotation = isCacheBypass
    ? "ONNX Cache Hit · Bypassing 05-06 (0 GPU Compute)"
    : isFaultTrip
      ? scenarioId === "breaker-open"
        ? "Breaker Tripped OPEN at 01 · Fast-Fail 503"
        : scenarioId === "budget-cutoff"
          ? "FinOps Hard Cutoff at 02 · HTTP 402"
          : "NLI Entailment < 0.70 at 05 · Calibrated Refusal"
      : isHitlPause
        ? "AsyncPostgresSaver Checkpoint at 03 · HITL Pause"
        : tab === "cinch"
          ? "Full Pipeline Dispatch · AWQ Marlin INT4"
          : "Hybrid RRF + Rerank + NLI · Cited SSE";

  return (
    <div className="relative flex h-[265px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-3.5 sm:h-[315px] sm:p-5">
      {/* Subtle Architectural PCB Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(240,246,252,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(240,246,252,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top HUD Metadata Row */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2.5 py-1 font-mono text-[11px] text-[#E6EDF3] sm:gap-2 sm:px-3 sm:text-xs">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: statusColor }}
            aria-hidden="true"
          />
          <span className="truncate">{scenarioAnnotation}</span>
        </div>

        <span className="shrink-0 whitespace-nowrap rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8B949E] sm:px-2.5 sm:text-xs sm:tracking-[0.12em]">
          2D Safe<span className="hidden sm:inline"> · Vector Trace</span> · {rpsMultiplier.toFixed(1)}x
        </span>
      </div>

      {/* Central Vector Bus & Interactive Station Nodes */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <svg
          viewBox="0 0 900 210"
          className="h-full max-h-[205px] w-full select-none"
          aria-hidden="true"
        >
          <defs>
            <filter id="pg-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base Inactive Bus */}
          <line
            x1={NODE_X[0]}
            y1={BUS_Y}
            x2={NODE_X[5]}
            y2={BUS_Y}
            stroke="rgba(240,246,252,0.1)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Active Signal Conduit */}
          <path
            d={isCacheBypass ? bypassPath : activeRailPath}
            fill="none"
            stroke={statusColor}
            strokeOpacity="0.32"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Flowing Dashed Signal */}
          <path
            d={isCacheBypass ? bypassPath : activeRailPath}
            fill="none"
            stroke={statusColor}
            strokeWidth="2.5"
            strokeDasharray="10 14"
            strokeLinecap="round"
            filter="url(#pg-glow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="48"
              to="0"
              dur={animDur}
              repeatCount="indefinite"
            />
          </path>

          {/* Animated Traveling Telemetry Packets */}
          {[0, 0.33, 0.66].map((beginFrac) => (
            <circle
              key={beginFrac}
              r="4.5"
              fill={statusColor}
              filter="url(#pg-glow)"
            >
              <animateMotion
                dur={animDur}
                begin={`-${(Number.parseFloat(animDur) * beginFrac).toFixed(2)}s`}
                repeatCount="indefinite"
                path={isCacheBypass ? bypassPath : activeRailPath}
              />
            </circle>
          ))}

          {/* Cache Bypass Return Label */}
          {isCacheBypass && (
            <g transform="translate(310, 48)">
              <rect
                x="-92"
                y="-13"
                width="184"
                height="24"
                rx="12"
                fill="#0D1117"
                stroke="#10B981"
                strokeOpacity="0.55"
                strokeWidth="1"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#10B981"
                fontSize="12"
                fontWeight="600"
                fontFamily="var(--font-mono), monospace"
              >
                4.12ms CACHE RETURN
              </text>
            </g>
          )}

          {/* Fault Trip Ring */}
          {isFaultTrip && (
            <g transform={`translate(${endX}, ${BUS_Y})`}>
              <circle
                r="28"
                fill="none"
                stroke={statusColor}
                strokeOpacity="0.5"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d={`M 0 22 L 0 46`}
                stroke={statusColor}
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <text
                x="0"
                y="62"
                textAnchor="middle"
                fill={statusColor}
                fontSize="12"
                fontWeight="600"
                fontFamily="var(--font-mono), monospace"
              >
                GATE ABORT
              </text>
            </g>
          )}

          {/* HITL Pause Halo */}
          {isHitlPause && (
            <g transform={`translate(${endX}, ${BUS_Y})`}>
              <circle
                r="30"
                fill="none"
                stroke="#38BDF8"
                strokeOpacity="0.55"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x="0"
                y="58"
                textAnchor="middle"
                fill="#7DD3FC"
                fontSize="12"
                fontWeight="600"
                fontFamily="var(--font-mono), monospace"
              >
                CHECKPOINT PAUSE
              </text>
            </g>
          )}

          {/* 6 Station Nodes */}
          {stages.map((stage, idx) => {
            const x = NODE_X[idx] ?? 90 + idx * 144;
            const isActive = activeStages.includes(stage.id);
            const isFocused = focusedStageId === stage.id;
            const parts = stage.label.split(" ");
            const code = parts[0] ?? `0${idx + 1}`;
            const name = parts.slice(1).join(" ") || stage.label;

            return (
              <g
                key={stage.id}
                transform={`translate(${x}, ${BUS_Y})`}
                onClick={() => onSelectStage?.(stage.id)}
                style={{ cursor: "pointer" }}
              >
                {/* Selection / Active Halo */}
                {(isFocused || isActive) && (
                  <rect
                    x="-54"
                    y="-27"
                    width="108"
                    height="54"
                    rx="14"
                    fill="none"
                    stroke={isFocused ? "#38BDF8" : statusColor}
                    strokeOpacity={isFocused ? 0.9 : 0.4}
                    strokeWidth={isFocused ? 2 : 1.2}
                  />
                )}

                {/* Station Chassis */}
                <rect
                  x="-50"
                  y="-23"
                  width="100"
                  height="46"
                  rx="11"
                  fill={isActive ? "#161E29" : "#12171F"}
                  stroke={
                    isFocused
                      ? "#38BDF8"
                      : isActive
                        ? statusColor
                        : "rgba(240,246,252,0.14)"
                  }
                  strokeWidth={isActive ? 1.5 : 1}
                />

                {/* Top LED Bar */}
                <rect
                  x="-36"
                  y="-23"
                  width="72"
                  height="3"
                  rx="1.5"
                  fill={isActive ? statusColor : "rgba(240,246,252,0.14)"}
                />

                {/* Code + Status Dot */}
                <text
                  x="-38"
                  y="-5"
                  fill={isActive ? statusColor : "#8B949E"}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="var(--font-mono), monospace"
                >
                  {code}
                </text>
                <circle
                  cx="38"
                  cy="-9"
                  r="3.2"
                  fill={isActive ? statusColor : "rgba(240,246,252,0.16)"}
                />

                {/* Station Name */}
                <text
                  x="0"
                  y="13"
                  textAnchor="middle"
                  fill={isActive ? "#E6EDF3" : "#8B949E"}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="var(--font-sans), sans-serif"
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Interactive Hint */}
      <div className="relative z-10 flex items-center justify-between gap-2 font-mono text-[11px] text-[#8B949E] sm:text-xs">
        <span className="truncate">
          <span className="sm:hidden">Tap node to inspect</span>
          <span className="hidden sm:inline">Click any stage node to inspect contract</span>
        </span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-[#9DA7B3]">
          {activeStages.length}/{stages.length} active
        </span>
      </div>
    </div>
  );
}
