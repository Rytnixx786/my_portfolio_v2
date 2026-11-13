"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Cpu, GitBranch, Lightning } from "@phosphor-icons/react";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";
import {
  PlaygroundPipeline3D,
  type PlaygroundCameraPreset,
} from "@/components/canvas/PlaygroundPipeline3D";
import { SectionReveal } from "./SectionReveal";

type SimulatorTab = "cinch" | "rag";

interface ScenarioSpec {
  id: string;
  label: string;
  trigger: string;
  statusColor: "#10B981" | "#38BDF8" | "#F59E0B" | "#EF4444";
  statusCode: string;
  latency: string;
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
    trigger: "cosine_sim >= 0.92",
    statusColor: "#10B981",
    statusCode: "200 CACHE_HIT",
    latency: "4.12 ms",
    vramOrCost: "0 W GPU",
    activeStages: ["breaker", "finops", "pii", "cache"],
    summary:
      "In-process CPU ONNX semantic cache matches prior vector embedding at cosine >= 0.92 and bypasses GPU inference completely.",
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
    latency: "331.0 tok/s",
    vramOrCost: "4.2 GiB VRAM",
    activeStages: ["breaker", "finops", "pii", "cache", "limiter", "vllm"],
    summary:
      "Cache miss admits request through PID sliding-window scheduler onto Qwen2.5-7B AWQ Marlin INT4 engine with EBNF JSON repair.",
    payload: {
      model: "Qwen2.5-7B-Instruct-AWQ",
      quantization: "Marlin W4A16 INT4",
      throughput_tok_s: 331.0,
      speedup_vs_fp16: "10.86x",
      ttft_reduction: "4.87x",
      status: 200,
    },
  },
  {
    id: "breaker-open",
    label: "Worker OOM",
    trigger: "3 consecutive panics",
    statusColor: "#EF4444",
    statusCode: "503 BREAKER_OPEN",
    latency: "45.56 ms",
    vramOrCost: "Canary Probe 10s",
    activeStages: ["breaker"],
    summary:
      "Instead of stalling callers for 30s TCP socket timeouts, Cinch trips the 3-state circuit breaker in 45.56ms and schedules a single canary probe.",
    payload: {
      breaker_state: "OPEN -> HALF_OPEN",
      fast_fail_ms: 45.56,
      recovery_window_s: 10,
      canary_in_flight: false,
      status: 503,
    },
  },
  {
    id: "finops-cutoff",
    label: "Over Tenant Cap",
    trigger: "micro-dollar cap",
    statusColor: "#F59E0B",
    statusCode: "402 FINOPS_CUTOFF",
    latency: "1.8 ms",
    vramOrCost: "0 tokens burned",
    activeStages: ["breaker", "finops"],
    summary:
      "Pre-flight token ledger rejects exhausted tenant budgets with hard HTTP 402 enforcement before touching GPU memory.",
    payload: {
      guard: "finops_budget_gate",
      allocated_remaining_usd: 0.0,
      gpu_dispatched: false,
      status: 402,
    },
  },
];

const RAG_STAGES = [
  { id: "bm25", label: "01 BM25 Sparse" },
  { id: "dense", label: "02 Chroma Dense" },
  { id: "rrf", label: "03 RRF (k=60)" },
  { id: "rerank", label: "04 Cross-Encoder" },
  { id: "nli", label: "05 NLI Gate" },
  { id: "emit", label: "06 Output / Refuse" },
] as const;

const RAG_SCENARIOS: ReadonlyArray<ScenarioSpec> = [
  {
    id: "grounded",
    label: "Verified Evidence",
    trigger: "NLI entailment pass",
    statusColor: "#10B981",
    statusCode: "200 CITED_ANSWER",
    latency: "95% Grounded",
    vramOrCost: "RRF k=60 + Rerank",
    activeStages: ["bm25", "dense", "rrf", "rerank", "nli", "emit"],
    summary:
      "Hybrid BM25 + dense embeddings fuse via Reciprocal Rank Fusion, cross-encoder reranking, and NLI entailment check before emitting cited output.",
    payload: {
      system: "MindStack + Nexus Gate",
      fusion: "Reciprocal Rank Fusion (k=60)",
      nli_entailment: "ENTAILMENT_PASS",
      qa_groundedness_pct: 95.0,
      decision: "EMIT_WITH_CITATIONS",
    },
  },
  {
    id: "refusal",
    label: "Adversarial / Missing Proof",
    trigger: "Insufficient span",
    statusColor: "#F59E0B",
    statusCode: "200 CALIBRATED_REFUSAL",
    latency: "91% Refusal Acc.",
    vramOrCost: "Zero Hallucination",
    activeStages: ["bm25", "dense", "rrf", "rerank", "nli"],
    summary:
      "When retrieved evidence fails the pre-generation NLI entailment threshold, the LangGraph / RAG gate halts generation with calibrated silence.",
    payload: {
      system: "Nexus Researcher + MindStack",
      nexus_adversarial_refusal_pct: 91.0,
      mindstack_unanswerable_refusal_pct: 66.67,
      hallucinated_claims_emitted: 0,
      decision: "CALIBRATED_REFUSAL",
    },
  },
];

export function SystemsPlayground() {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const [tab, setTab] = useState<SimulatorTab>("cinch");
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<PlaygroundCameraPreset>("isometric");

  const stages = tab === "cinch" ? CINCH_STAGES : RAG_STAGES;
  const scenarios = tab === "cinch" ? CINCH_SCENARIOS : RAG_SCENARIOS;
  const current = scenarios[scenarioIdx] ?? scenarios[0];
  const showWebGLStage = hasMounted && webglSupported && effectiveTier !== "low";

  function handleTabChange(next: SimulatorTab) {
    setTab(next);
    setScenarioIdx(0);
  }

  return (
    <section
      id="simulator"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/45 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="flex flex-col justify-between gap-8 border-b border-[rgba(240,246,252,0.08)] pb-10 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7DD3FC]">
                <Lightning className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span>Interactive Systems Sandbox</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]">
                TRACE THE{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  control plane.
                </span>
              </h2>
            </div>

            {/* Architecture Mode Tabs */}
            <div
              role="tablist"
              aria-label="Select architecture simulator"
              className="inline-flex w-fit rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "cinch"}
                onClick={() => handleTabChange("cinch")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  tab === "cinch"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Cinch Gateway</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "rag"}
                onClick={() => handleTabChange("rag")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  tab === "rag"
                    ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                <span>NLI &amp; RAG Gate</span>
              </button>
            </div>
          </div>

          <div className="double-bezel-outer mt-10">
            <div className="double-bezel-core overflow-hidden p-5 sm:p-8">
              {/* Scenario Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(240,246,252,0.08)] pb-6">
                <div className="flex flex-wrap gap-2">
                  {scenarios.map((scenario, idx) => {
                    const selected = idx === scenarioIdx;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => setScenarioIdx(idx)}
                        aria-pressed={selected}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-all duration-300 ${
                          selected
                            ? "border-[#38BDF8] bg-[#1C222B] text-[#E6EDF3]"
                            : "border-[rgba(240,246,252,0.08)] bg-[#0D1117] text-[#8B949E] hover:border-[#38BDF8]/40 hover:text-[#E6EDF3]"
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

                <Link
                  href={tab === "cinch" ? "/work/cinch" : "/work/nexus-researcher"}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#38BDF8] transition-colors hover:text-[#7DD3FC]"
                >
                  <span>Full Case Study</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {/* Interactive 3D Request & Token Routing Diorama */}
              {showWebGLStage && (
                <div className="mt-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8B949E]">
                      Live 3D Control-Plane Simulation · Active Telemetry Path
                    </span>
                    <div
                      role="group"
                      aria-label="3D Simulator Camera Mode"
                      className="inline-flex items-center gap-1 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] p-0.5 font-mono text-[10px] uppercase tracking-[0.1em]"
                    >
                      {(
                        [
                          { id: "isometric", label: "Isometric" },
                          { id: "top", label: "Top Schematic" },
                          { id: "orbit", label: "Free Orbit" },
                        ] as const
                      ).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setCameraPreset(preset.id)}
                          aria-pressed={cameraPreset === preset.id}
                          className={`rounded-full px-2.5 py-1 transition-colors ${
                            cameraPreset === preset.id
                              ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                              : "text-[#8B949E] hover:text-[#E6EDF3]"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <PlaygroundPipeline3D
                    tab={tab}
                    scenarioId={current.id}
                    stages={stages}
                    activeStages={current.activeStages}
                    statusColor={current.statusColor}
                    cameraPreset={cameraPreset}
                  />
                </div>
              )}

              {/* Pipeline Execution Stages */}
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {stages.map((stage, idx) => {
                  const isTraversed = current.activeStages.includes(stage.id);
                  const isTerminalStop =
                    isTraversed &&
                    idx === current.activeStages.length - 1;

                  return (
                    <div
                      key={stage.id}
                      className={`relative rounded-2xl border px-3.5 py-3.5 transition-all duration-300 ${
                        isTerminalStop
                          ? "border-[#38BDF8] bg-[#38BDF8]/12"
                          : isTraversed
                            ? "border-[rgba(240,246,252,0.16)] bg-[#1C222B]"
                            : "border-[rgba(240,246,252,0.06)] bg-[#0D1117]/60 opacity-45"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6E7681]">
                          {isTerminalStop ? "STOP" : isTraversed ? "PASS" : "SKIP"}
                        </span>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: isTerminalStop
                              ? current.statusColor
                              : isTraversed
                                ? "#38BDF8"
                                : "#6E7681",
                          }}
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-2 font-mono text-xs font-semibold text-[#E6EDF3]">
                        {stage.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Live Outcome & Telemetry Payload */}
              <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="flex flex-col justify-between rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-5 lg:col-span-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-3 py-1 font-mono text-[11px] font-semibold text-[#E6EDF3]"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: current.statusColor }}
                          aria-hidden="true"
                        />
                        <span>{current.statusCode}</span>
                      </span>
                      <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#6E7681]">
                        {current.trigger}
                      </span>
                    </div>

                    <p className="mt-4 max-w-[60ch] font-sans text-base leading-relaxed text-[#8B949E]">
                      {current.summary}
                    </p>
                  </div>

                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[rgba(240,246,252,0.08)] pt-4">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E7681]">
                        Measured Outcome
                      </dt>
                      <dd className="mt-1 font-display text-2xl font-bold text-[#E6EDF3] tabular-nums">
                        {current.latency}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E7681]">
                        Resource Footprint
                      </dt>
                      <dd className="mt-1 font-display text-2xl font-bold text-[#38BDF8] tabular-nums">
                        {current.vramOrCost}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Telemetry JSON Output */}
                <div className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-5 font-mono text-xs lg:col-span-6">
                  <div className="mb-3 flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] pb-2.5 text-[10px] uppercase tracking-[0.16em] text-[#6E7681]">
                    <span>Verified Trace Snapshot</span>
                    <span className="text-[#38BDF8]">application/json</span>
                  </div>
                  <pre className="editorial-scroll overflow-x-auto leading-relaxed text-[#E6EDF3]">
                    <code>{JSON.stringify(current.payload, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

