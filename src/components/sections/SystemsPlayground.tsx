"use client";

import dynamic from "next/dynamic";
import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Cpu, GitBranch, Lightning, Sliders } from "@phosphor-icons/react";
import type { PlaygroundCameraPreset } from "@/components/canvas/PlaygroundPipeline3D";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { SectionReveal } from "./SectionReveal";

const LazyPlaygroundPipeline3D = dynamic(
  () =>
    import("@/components/canvas/PlaygroundPipeline3D").then(
      (mod) => mod.PlaygroundPipeline3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[265px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] font-mono text-xs text-[#8B949E] sm:h-[315px]">
        Initializing 3D pipeline stage...
      </div>
    ),
  }
);

type SimulatorTab = "cinch" | "rag";

interface ScenarioSpec {
  id: string;
  label: string;
  trigger: string;
  statusColor: "#10B981" | "#38BDF8" | "#F59E0B" | "#EF4444";
  statusCode: string;
  baseLatencyMs: number;
  latencyLabel: string;
  vramOrCost: string;
  activeStages: string[];
  summary: string;
  payload: Record<string, string | number | boolean>;
}

const CINCH_STAGES = [
  { id: "breaker", label: "01 Breaker FSM" },
  { id: "finops", label: "02 FinOps Gate" },
  { id: "pii", label: "03 PII Guard" },
  { id: "cache", label: "04 ONNX Cache" },
  { id: "limiter", label: "05 PID Limiter" },
  { id: "vllm", label: "06 vLLM Marlin" },
] as const;

const CINCH_SCENARIOS: ReadonlyArray<ScenarioSpec> = [
  {
    id: "cache-hit",
    label: "Duplicate Query",
    trigger: "cosine >= 0.92",
    statusColor: "#10B981",
    statusCode: "200 CACHE_HIT",
    baseLatencyMs: 4.12,
    latencyLabel: "4.12 ms",
    vramOrCost: "0 W GPU",
    activeStages: ["breaker", "finops", "pii", "cache"],
    summary:
      "In-process CPU ONNX semantic cache matches prior vector embedding at cosine >= 0.92 and returns response without touching GPU memory.",
    payload: {
      route: "POST /v1/chat/completions",
      cache_hit: true,
      cosine_similarity: 0.946,
      ttft_ms: 4.12,
      gpu_power_watts: 0,
      status: 200,
    },
  },
  {
    id: "cold-vllm",
    label: "Cold Generation",
    trigger: "AWQ Marlin INT4",
    statusColor: "#38BDF8",
    statusCode: "200 STREAM",
    baseLatencyMs: 142,
    latencyLabel: "331.0 tok/s",
    vramOrCost: "4.2 GiB VRAM",
    activeStages: ["breaker", "finops", "pii", "cache", "limiter", "vllm"],
    summary:
      "Cache miss admits request through PID sliding-window queue onto Qwen2.5-7B AWQ Marlin INT4 engine with EBNF JSON grammar repair.",
    payload: {
      model: "Qwen2.5-7B-Instruct-AWQ",
      quantization: "Marlin W4A16 INT4",
      throughput_tok_s: 331.0,
      speedup_vs_fp16: "10.86x",
      status: 200,
    },
  },
  {
    id: "breaker-open",
    label: "Worker OOM",
    trigger: "3 panics in window",
    statusColor: "#EF4444",
    statusCode: "503 BREAKER_OPEN",
    baseLatencyMs: 45.56,
    latencyLabel: "45.56 ms",
    vramOrCost: "Canary Probe 10s",
    activeStages: ["breaker"],
    summary:
      "Circuit breaker trips OPEN after consecutive GPU worker OOM panics, failing fast in 45.56ms instead of stalling callers for 30s timeouts.",
    payload: {
      breaker_state: "OPEN -> HALF_OPEN",
      fast_fail_ms: 45.56,
      recovery_window_s: 10,
      canary_in_flight: false,
      status: 503,
    },
  },
  {
    id: "budget-cutoff",
    label: "Quota Exhausted",
    trigger: "tenant_spend >= cap",
    statusColor: "#F59E0B",
    statusCode: "402 BUDGET_CAP",
    baseLatencyMs: 1.8,
    latencyLabel: "1.80 ms",
    vramOrCost: "0 Tokens Burned",
    activeStages: ["breaker", "finops"],
    summary:
      "Micro-dollar pre-flight accounting rejects requests once tenant quota caps out, returning structured HTTP 402 before allocation.",
    payload: {
      tenant_id: "org_enterprise_04",
      budget_usd: 25.0,
      spent_usd: 25.004,
      action: "HTTP_402_HARD_CUTOFF",
      status: 402,
    },
  },
];

const RAG_STAGES = [
  { id: "bm25", label: "01 BM25 Sparse" },
  { id: "dense", label: "02 ChromaDB Dense" },
  { id: "rrf", label: "03 RRF k=60" },
  { id: "rerank", label: "04 Cross-Encoder" },
  { id: "nli", label: "05 NLI Gate" },
  { id: "synth", label: "06 Cited SSE" },
] as const;

const RAG_SCENARIOS: ReadonlyArray<ScenarioSpec> = [
  {
    id: "grounded-pass",
    label: "Verified Evidence",
    trigger: "entailment >= 0.85",
    statusColor: "#10B981",
    statusCode: "200 CITED_PASS",
    baseLatencyMs: 620,
    latencyLabel: "95% Grounded",
    vramOrCost: "RRF k=60 + NLI",
    activeStages: ["bm25", "dense", "rrf", "rerank", "nli", "synth"],
    summary:
      "Hybrid BM25 and dense retrieval fuse via RRF (k=60), pass cross-encoder reranking and NLI verification, and emit inline-cited SSE tokens.",
    payload: {
      rrf_constant_k: 60,
      groundedness_score: 0.95,
      nli_entailment: 0.91,
      citations_attached: 4,
      decision: "SYNTHESIZE_WITH_CITATIONS",
    },
  },
  {
    id: "nli-refusal",
    label: "Conflicting Sources",
    trigger: "entailment < 0.70",
    statusColor: "#EF4444",
    statusCode: "200 REFUSAL_GATE",
    baseLatencyMs: 410,
    latencyLabel: "91% Refusal Acc",
    vramOrCost: "Aborted Safely",
    activeStages: ["bm25", "dense", "rrf", "rerank", "nli"],
    summary:
      "Cross-encoder ranks chunks, but the pre-generation NLI classifier detects contradiction below threshold and refuses cleanly.",
    payload: {
      top_chunk_cosine: 0.81,
      nli_entailment: 0.41,
      threshold_required: 0.7,
      decision: "CALIBRATED_REFUSAL",
    },
  },
  {
    id: "hitl-replan",
    label: "Sparse Ambiguity",
    trigger: "Checkpoint Re-plan",
    statusColor: "#38BDF8",
    statusCode: "PAUSE HITL_CHECK",
    baseLatencyMs: 310,
    latencyLabel: "8.05 req/s Load",
    vramOrCost: "Postgres Saved",
    activeStages: ["bm25", "dense", "rrf"],
    summary:
      "LangGraph checkpoints state in PostgreSQL and suspends execution cleanly via Last-Event-ID until operator approves refined sub-queries.",
    payload: {
      checkpointer: "AsyncPostgresSaver",
      interrupt_node: "human_approval",
      sse_replay_supported: true,
      decision: "REPLAN_SUBQUERIES",
    },
  },
];

export function SystemsPlayground() {
  const { canRender3D } = useCanRender3D();
  const [tab, setTab] = useState<SimulatorTab>("cinch");
  const [cinchId, setCinchId] = useState(CINCH_SCENARIOS[0].id);
  const [ragId, setRagId] = useState(RAG_SCENARIOS[0].id);
  const [cameraPreset, setCameraPreset] = useState<PlaygroundCameraPreset>("isometric");
  const [rpsMultiplier, setRpsMultiplier] = useState<number>(1.0);
  const [piiGuardEnabled, setPiiGuardEnabled] = useState<boolean>(true);
  const [semanticCacheEnabled, setSemanticCacheEnabled] = useState<boolean>(true);

  const scenarios = tab === "cinch" ? CINCH_SCENARIOS : RAG_SCENARIOS;
  const stages = tab === "cinch" ? CINCH_STAGES : RAG_STAGES;
  const rawScenarioId = tab === "cinch" ? cinchId : ragId;
  const activeScenario =
    scenarios.find((s) => s.id === rawScenarioId) ?? scenarios[0];

  const effectiveStages = activeScenario.activeStages.filter((id) => {
    if (!piiGuardEnabled && id === "pii") return false;
    if (!semanticCacheEnabled && id === "cache") return false;
    return true;
  });

  const handleTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setTab((prev) => (prev === "cinch" ? "rag" : "cinch"));
    }
  };

  return (
    <section
      id="simulator"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/35 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="flex flex-col justify-between gap-6 border-b border-[rgba(240,246,252,0.08)] pb-8 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#7DD3FC]">
                <span>Interactive Pipeline Simulator</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.2rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]">
                TRACE EXECUTION,{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  not claims.
                </span>
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="Choose pipeline architecture to simulate"
              onKeyDown={handleTabKeyDown}
              className="inline-flex rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] p-1"
            >
              <button
                type="button"
                role="tab"
                id="tab-cinch"
                aria-selected={tab === "cinch"}
                aria-controls="panel-simulator"
                onClick={() => setTab("cinch")}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  tab === "cinch"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#9DA7B3] hover:text-[#E6EDF3]"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                <span>Cinch Gateway</span>
              </button>
              <button
                type="button"
                role="tab"
                id="tab-rag"
                aria-selected={tab === "rag"}
                aria-controls="panel-simulator"
                onClick={() => setTab("rag")}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  tab === "rag"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#9DA7B3] hover:text-[#E6EDF3]"
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                <span>RAG Refusal Gate</span>
              </button>
            </div>
          </div>
        </SectionReveal>

        <div
          id="panel-simulator"
          role="tabpanel"
          aria-labelledby={tab === "cinch" ? "tab-cinch" : "tab-rag"}
          className="double-bezel-outer mt-8"
        >
          <div className="double-bezel-core overflow-hidden">
            {/* Simulator Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <Lightning className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
                  Fault Scenario:
                </span>
                {scenarios.map((scenario) => {
                  const selected = scenario.id === activeScenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() =>
                        tab === "cinch" ? setCinchId(scenario.id) : setRagId(scenario.id)
                      }
                      className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                        selected
                          ? "border-[#38BDF8] bg-[#38BDF8]/15 font-semibold text-[#E6EDF3]"
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

              <div className="flex items-center gap-3 font-mono text-xs">
                <span
                  className="rounded-full px-3 py-1 font-semibold tabular-nums"
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
                  className="w-28 accent-[#38BDF8]"
                />

                {tab === "cinch" && (
                  <>
                    <button
                      type="button"
                      aria-pressed={piiGuardEnabled}
                      onClick={() => setPiiGuardEnabled((v) => !v)}
                      className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
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
                      className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
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
                      onClick={() => setCameraPreset(preset)}
                      className={`rounded-md px-2.5 py-1 uppercase transition-colors ${
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
              <LazyPlaygroundPipeline3D
                tab={tab}
                scenarioId={activeScenario.id}
                stages={stages}
                activeStages={effectiveStages}
                statusColor={activeScenario.statusColor}
                cameraPreset={cameraPreset}
                rpsMultiplier={rpsMultiplier}
              />

              {/* Stage Contract Strip */}
              <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {stages.map((stage) => {
                  const isActive = effectiveStages.includes(stage.id);
                  return (
                    <li
                      key={stage.id}
                      className={`rounded-xl border px-3 py-2.5 font-mono text-xs ${
                        isActive
                          ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#E6EDF3]"
                          : "border-[rgba(240,246,252,0.08)] bg-[#0D1117] text-[#8B949E]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{stage.label}</span>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isActive ? "" : "bg-[rgba(240,246,252,0.16)]"
                          }`}
                          style={isActive ? { backgroundColor: activeScenario.statusColor } : undefined}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Telemetry Summary + JSON Trace */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-6">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[#9DA7B3]">
                    <span>Trigger: {activeScenario.trigger}</span>
                    <span>·</span>
                    <span className="text-[#38BDF8]">{activeScenario.latencyLabel}</span>
                    <span>·</span>
                    <span>{activeScenario.vramOrCost}</span>
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                    {activeScenario.summary}
                  </p>
                  <div className="pt-1">
                    <Link
                      href={tab === "cinch" ? "/work/cinch" : "/work/nexus-researcher"}
                      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#38BDF8] hover:text-[#7DD3FC]"
                    >
                      <span>Open full architecture notes</span>
                      <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <pre className="editorial-scroll overflow-x-auto rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4 font-mono text-xs leading-relaxed text-[#E6EDF3] lg:col-span-6">
                  <code>
                    {JSON.stringify(
                      {
                        ...activeScenario.payload,
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
    </section>
  );
}
