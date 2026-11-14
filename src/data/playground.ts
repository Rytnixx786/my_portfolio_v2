export type SimulatorTab = "cinch" | "rag";

export interface StageNodeSpec {
  id: string;
  label: string;
  role: string;
  contract: string;
  faultBehavior: string;
}

export interface ScenarioSpec {
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

export const CINCH_STAGES: ReadonlyArray<StageNodeSpec> = [
  {
    id: "breaker",
    label: "Breaker FSM",
    role: "Fail-fast worker isolator",
    contract: "3-state FSM (CLOSED / OPEN / HALF_OPEN) guarding downstream vLLM sockets",
    faultBehavior: "Trips OPEN after 3 worker panics; returns HTTP 503 in 45.56 ms with single-flight canary probes",
  },
  {
    id: "finops",
    label: "FinOps Gate",
    role: "Pre-flight tenant budget enforcer",
    contract: "Checks accumulated tenant spend ledger against per-org cap before tokenization",
    faultBehavior: "Rejects over-budget callers with HTTP 402 in 1.80 ms (zero GPU tokens burned)",
  },
  {
    id: "pii",
    label: "PII Guard",
    role: "Ingress secret & PII redactor",
    contract: "Scans and masks API tokens, emails, and secrets prior to cache/model dispatch",
    faultBehavior: "Can be bypassed explicitly in simulator to inspect unredacted upstream risk",
  },
  {
    id: "cache",
    label: "ONNX Cache",
    role: "In-process CPU semantic vector lookup",
    contract: "Matches paraphrased queries via cosine >= 0.92 against embedded prompt signatures",
    faultBehavior: "Cache hits short-circuit inference at 4.12 ms using zero GPU compute",
  },
  {
    id: "limiter",
    label: "Admission Queue",
    role: "Token & request sliding-window governor",
    contract: "Enforces 60 RPM / 50k TPM priority scheduling ahead of KV cache pressure",
    faultBehavior: "Queues excess bursts smoothly when concurrency multiplier climbs above baseline",
  },
  {
    id: "vllm",
    label: "vLLM Marlin",
    role: "Quantized W4A16 inference & EBNF grammar",
    contract: "Streams Qwen2.5-7B AWQ Marlin INT4 tokens up to 331.0 tok/s on 8 GB VRAM",
    faultBehavior: "Skipped completely on cache hits, HTTP 402 budget stops, or HTTP 503 open breakers",
  },
] as const;

export const CINCH_SCENARIOS: ReadonlyArray<ScenarioSpec> = [
  {
    id: "cache-hit",
    label: "Duplicate Query",
    trigger: "cosine >= 0.92",
    statusColor: "#10B981",
    statusCode: "200 CACHE_HIT",
    baseLatencyMs: 4.12,
    latencyLabel: "4.12 ms",
    vramOrCost: "0 GPU Compute",
    activeStages: ["breaker", "finops", "pii", "cache"],
    summary:
      "In-process CPU ONNX vector cache hits at cosine >= 0.92, returning in 4.12 ms with zero GPU compute.",
    payload: {
      route: "POST /v1/chat/completions",
      cache_hit: true,
      cosine_similarity: 0.946,
      ttft_ms: 4.12,
      gpu_compute_active: false,
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
    vramOrCost: "8 GB Card (~4.2 GiB weights)",
    activeStages: ["breaker", "finops", "pii", "cache", "limiter", "vllm"],
    summary:
      "Admission limiter schedules Qwen2.5-7B AWQ Marlin INT4 at 331.0 tok/s (10.86x vs CPU-offloaded FP16 on 8 GB VRAM).",
    payload: {
      model: "Qwen2.5-7B-Instruct-AWQ",
      quantization: "Marlin W4A16 INT4",
      throughput_tok_s: 331.0,
      speedup_vs_8gb_fp16_offload: "10.86x",
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
      "Breaker trips OPEN after 3 worker panics, failing fast in 45.56 ms instead of 30s hangs.",
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
      "Pre-flight FinOps gate rejects capped tenants with HTTP 402 before GPU allocation.",
    payload: {
      tenant_id: "org_enterprise_04",
      budget_usd: 25.0,
      spent_usd: 25.004,
      action: "HTTP_402_HARD_CUTOFF",
      status: 402,
    },
  },
];

export const RAG_STAGES: ReadonlyArray<StageNodeSpec> = [
  {
    id: "bm25",
    label: "BM25 Sparse",
    role: "Exact lexical & identifier matcher",
    contract: "Indexes symbols, error strings, and code identifiers missed by embeddings",
    faultBehavior: "Provides high-precision lexical candidates into RRF merge",
  },
  {
    id: "dense",
    label: "ChromaDB Dense",
    role: "Semantic child-chunk vector index",
    contract: "Retrieves top-k 128-token semantically related passages with parent IDs",
    faultBehavior: "Down-weighted cleanly by RRF when phrasing diverges from source vocabulary",
  },
  {
    id: "rrf",
    label: "RRF k=60",
    role: "Reciprocal Rank Fusion merger",
    contract: "Combines sparse + dense rankings with 1 / (rank + 60) without score calibration brittleness",
    faultBehavior: "Returns graph execution to planner when candidate coverage is sparse",
  },
  {
    id: "rerank",
    label: "Cross-Encoder",
    role: "Pairwise passage relevance scorer",
    contract: "Re-orders merged parent passages cleanly ahead of NLI verification",
    faultBehavior: "Drops noisy borderline chunks before synthesis context assembly",
  },
  {
    id: "nli",
    label: "NLI Gate",
    role: "Pre-generation entailment verifier",
    contract: "Requires entailment >= 0.70 against retrieved evidence before emitting claims",
    faultBehavior: "Aborts generation cleanly when entailment drops below 0.70 threshold",
  },
  {
    id: "synth",
    label: "Cited SSE",
    role: "Grounded stream synthesizer",
    contract: "Streams inline-cited dossier over Last-Event-ID resumable SSE backed by Postgres",
    faultBehavior: "Bypassed entirely whenever NLI refusal gate or HITL pause intercepts",
  },
] as const;

export const RAG_SCENARIOS: ReadonlyArray<ScenarioSpec> = [
  {
    id: "grounded-pass",
    label: "Verified Evidence",
    trigger: "entailment >= 0.70",
    statusColor: "#10B981",
    statusCode: "200 CITED_PASS",
    baseLatencyMs: 620,
    latencyLabel: "95% Grounded",
    vramOrCost: "RRF k=60 + NLI",
    activeStages: ["bm25", "dense", "rrf", "rerank", "nli", "synth"],
    summary:
      "BM25 + dense vectors fuse via RRF (k=60), pass rerank + NLI check (>= 0.70), and stream cited SSE tokens.",
    payload: {
      rrf_constant_k: 60,
      groundedness_score: 0.95,
      nli_entailment: 0.91,
      threshold_required: 0.7,
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
    latencyLabel: "10/15 Refusal (n=15)",
    vramOrCost: "Aborted Safely",
    activeStages: ["bm25", "dense", "rrf", "rerank", "nli"],
    summary:
      "Pre-generation NLI classifier catches low entailment (< 0.70) and aborts generation cleanly.",
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
      "LangGraph persists AsyncPostgresSaver checkpoints and pauses via Last-Event-ID for HITL review.",
    payload: {
      checkpointer: "AsyncPostgresSaver",
      interrupt_node: "human_approval",
      sse_replay_supported: true,
      decision: "REPLAN_SUBQUERIES",
    },
  },
];
