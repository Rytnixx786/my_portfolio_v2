export type SimulatorTab = "cinch" | "tally" | "lexicon" | "rag";

export interface StageNodeSpec {
  id: string;
  label: string;
  role: string;
  contract: string;
  faultBehavior: string;
}

export interface TraceSpanSpec {
  stageId: string;
  durationMs: number;
  status: "PASS" | "HIT" | "MISS" | "SKIP" | "TRIP" | "DENY" | "PAUSE";
  metricDelta: string;
  logLine: string;
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
  shortCircuitMode?: "bypass" | "fault" | "pause";
  activeStages: string[];
  summary: string;
  payload: Record<string, string | number | boolean>;
  traceSpans: ReadonlyArray<TraceSpanSpec>;
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
    traceSpans: [
      {
        stageId: "breaker",
        durationMs: 0.18,
        status: "PASS",
        metricDelta: "+0.18 ms",
        logLine: "FSM CLOSED (0/3 panics); downstream vLLM socket healthy",
      },
      {
        stageId: "finops",
        durationMs: 0.41,
        status: "PASS",
        metricDelta: "$0.000",
        logLine: "Tenant spend ledger verified below $25.00 hard cutoff",
      },
      {
        stageId: "pii",
        durationMs: 0.94,
        status: "PASS",
        metricDelta: "masked",
        logLine: "Ingress redactor scrubbed secrets prior to vector key encoding",
      },
      {
        stageId: "cache",
        durationMs: 2.59,
        status: "HIT",
        metricDelta: "cos 0.946",
        logLine: "In-process CPU MiniLM ONNX cache matched at 4.12 ms total (0 GPU)",
      },
    ],
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
    traceSpans: [
      {
        stageId: "breaker",
        durationMs: 0.21,
        status: "PASS",
        metricDelta: "CLOSED",
        logLine: "Worker FSM CLOSED; 8 GB CUDA pool initialized",
      },
      {
        stageId: "finops",
        durationMs: 0.44,
        status: "PASS",
        metricDelta: "authorized",
        logLine: "Pre-flight tenant balance approved for 512 output tokens",
      },
      {
        stageId: "pii",
        durationMs: 1.05,
        status: "PASS",
        metricDelta: "masked",
        logLine: "Ingress PII filter cleared prompt before semantic cache check",
      },
      {
        stageId: "cache",
        durationMs: 2.8,
        status: "MISS",
        metricDelta: "cos 0.61",
        logLine: "Semantic lookup missed (< 0.92); forwarding to admission queue",
      },
      {
        stageId: "limiter",
        durationMs: 4.5,
        status: "PASS",
        metricDelta: "60 RPM ok",
        logLine: "Sliding-window rate governor granted immediate inference slot",
      },
      {
        stageId: "vllm",
        durationMs: 133.0,
        status: "PASS",
        metricDelta: "331.0 tok/s",
        logLine: "Marlin W4A16 INT4 streamed tokens with EBNF grammar enforcement",
      },
    ],
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
    traceSpans: [
      {
        stageId: "breaker",
        durationMs: 45.56,
        status: "TRIP",
        metricDelta: "HTTP 503",
        logLine: "3 worker panics tripped FSM OPEN; failed fast in 45.56 ms with 10s canary timer",
      },
    ],
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
    traceSpans: [
      {
        stageId: "breaker",
        durationMs: 0.19,
        status: "PASS",
        metricDelta: "CLOSED",
        logLine: "Ingress socket healthy ahead of tenant accounting lookup",
      },
      {
        stageId: "finops",
        durationMs: 1.61,
        status: "DENY",
        metricDelta: "HTTP 402",
        logLine: "spent $25.004 >= $25.00 cap; returned 402 with 0 GPU tokens burned",
      },
    ],
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
    traceSpans: [
      {
        stageId: "bm25",
        durationMs: 18.4,
        status: "PASS",
        metricDelta: "sparse k=24",
        logLine: "BM25 index matched API symbols and error tokens across parent chunks",
      },
      {
        stageId: "dense",
        durationMs: 42.6,
        status: "PASS",
        metricDelta: "dense k=24",
        logLine: "ChromaDB 128-token child embeddings returned semantic candidates",
      },
      {
        stageId: "rrf",
        durationMs: 4.2,
        status: "PASS",
        metricDelta: "RRF k=60",
        logLine: "Reciprocal Rank Fusion deduplicated parent IDs without brittle weights",
      },
      {
        stageId: "rerank",
        durationMs: 96.8,
        status: "PASS",
        metricDelta: "top-6 ranked",
        logLine: "Cross-Encoder rescored merged parent passages by query entailment fit",
      },
      {
        stageId: "nli",
        durationMs: 118.0,
        status: "PASS",
        metricDelta: "entail 0.91",
        logLine: "NLI verification cleared >= 0.70 floor (0.91); unlocked SSE synth",
      },
      {
        stageId: "synth",
        durationMs: 340.0,
        status: "PASS",
        metricDelta: "95% grounded",
        logLine: "Resumable Last-Event-ID SSE streamed 4 inline-cited claims",
      },
    ],
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
    traceSpans: [
      {
        stageId: "bm25",
        durationMs: 19.2,
        status: "PASS",
        metricDelta: "sparse k=12",
        logLine: "Lexical retrieval surfaced mismatched version symbols",
      },
      {
        stageId: "dense",
        durationMs: 44.8,
        status: "PASS",
        metricDelta: "cos 0.81",
        logLine: "Vector cosine matched topic vocabulary yet missed evidentiary link",
      },
      {
        stageId: "rrf",
        durationMs: 4.5,
        status: "PASS",
        metricDelta: "RRF k=60",
        logLine: "Merged sparse + dense rankings ahead of contradiction scoring",
      },
      {
        stageId: "rerank",
        durationMs: 104.5,
        status: "PASS",
        metricDelta: "conflict flagged",
        logLine: "Cross-Encoder ranked competing assertions side-by-side",
      },
      {
        stageId: "nli",
        durationMs: 237.0,
        status: "TRIP",
        metricDelta: "0.41 < 0.70",
        logLine: "NLI classifier caught entailment < 0.70 and refused without synthesis (10/15)",
      },
    ],
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
    traceSpans: [
      {
        stageId: "bm25",
        durationMs: 24.5,
        status: "PASS",
        metricDelta: "sparse coverage",
        logLine: "Sparse scan flagged low term coverage across target sub-collections",
      },
      {
        stageId: "dense",
        durationMs: 52.5,
        status: "PASS",
        metricDelta: "8.05 req/s",
        logLine: "Dense chunks retrieved under 8.05 req/s steady evaluation load",
      },
      {
        stageId: "rrf",
        durationMs: 233.0,
        status: "PAUSE",
        metricDelta: "HITL saved",
        logLine: "AsyncPostgresSaver saved graph state and paused stream via Last-Event-ID",
      },
    ],
  },
];

export const TALLY_STAGES: ReadonlyArray<StageNodeSpec> = [
  {
    id: "dedup",
    label: "MinHash Split",
    role: "Leakage-proof dataset clustering",
    contract: "Clusters 26,872 Bitext tickets into 22,037 LSH families (Jaccard >= 0.80) before 60/20/20 StratifiedGroupKFold",
    faultBehavior: "Prevents duplicate ticket phrasing from crossing dev, tune, and held-out test splits",
  },
  {
    id: "arm",
    label: "Setup Arm",
    role: "TF-IDF vs Qwen2.5-7B-AWQ evaluator",
    contract: "Routes paired test tickets (n = 5,373) across calibrated Setup A linear model or Setup B INT4 guided_choice",
    faultBehavior: "Exposes when deterministic linear features (99.8%) dominate 7B LLM decoding (90.5%)",
  },
  {
    id: "power",
    label: "GPU / Cost",
    role: "nvidia-smi power & hardware amortizer",
    contract: "Polls 0.5s board wattage (141.45W mean on RTX 3060 Ti) and apportions cost by token share",
    faultBehavior: "Computes cost per correct outcome strictly as Sigma(cost) / count(correct)",
  },
  {
    id: "otel",
    label: "OTel Strip",
    role: "Privacy-enforced telemetry proxy",
    contract: "Emits deterministic trace/span IDs while stripping gen_ai prompt and completion text in collector",
    faultBehavior: "Drops raw user/model text before storage while retaining tokens, latency, and outcome labels",
  },
  {
    id: "ingest",
    label: "FastAPI Ingest",
    role: "OTLP Postgres raw span sink",
    contract: "Sanitizes NaN/Inf JSONB values and inserts idempotently (ON CONFLICT DO NOTHING) into raw.otel_spans",
    faultBehavior: "Guards warehouse ingestion against malformed float payloads or retried batches",
  },
  {
    id: "dbt",
    label: "dbt Marts (46)",
    role: "Contracted warehouse aggregator",
    contract: "Materializes fct_outcomes & mart_cost_per_outcome validated by 46/46 dbt schema and leakage tests",
    faultBehavior: "Fails build immediately if any model call lacks a price-book entry or test split leaks into selection",
  },
] as const;

export const TALLY_SCENARIOS: ReadonlyArray<ScenarioSpec> = [
  {
    id: "tfidf-win",
    label: "Setup A: TF-IDF",
    trigger: "word 1-2 + char 3-5",
    statusColor: "#10B981",
    statusCode: "200 A_TFIDF",
    baseLatencyMs: 0.046,
    latencyLabel: "0.046 ms p50",
    vramOrCost: "$3.01e-07 / 1k",
    shortCircuitMode: "bypass",
    activeStages: ["dedup", "arm", "otel", "ingest", "dbt"],
    summary:
      "Tuned LogisticRegression + TF-IDF hits 99.8% accuracy in 0.046 ms at 10,276x lower cost than local Qwen2.5-7B-AWQ.",
    payload: {
      setup: "A_tfidf (C=2.0)",
      accuracy_test: 0.9983,
      cost_per_1k_correct_usd: 3.01e-7,
      p50_latency_ms: 0.046,
      roi_100k_mo_usd: 14907.87,
    },
    traceSpans: [
      { stageId: "dedup", durationMs: 0.01, status: "PASS", metricDelta: "22,037 LSH", logLine: "Clustered paraphrase verified on held-out test split (n=5,373)" },
      { stageId: "arm", durationMs: 0.026, status: "PASS", metricDelta: "99.8% Acc", logLine: "TF-IDF + LogReg scored 27 intents with 0 GPU utilization" },
      { stageId: "otel", durationMs: 0.004, status: "HIT", metricDelta: "stripped", logLine: "Deterministic span emitted cleanly without raw ticket text" },
      { stageId: "ingest", durationMs: 0.003, status: "PASS", metricDelta: "0 conflict", logLine: "FastAPI /v1/traces persisted span to raw.otel_spans" },
      { stageId: "dbt", durationMs: 0.003, status: "PASS", metricDelta: "46/46", logLine: "mart_cost_per_outcome committed ($3.01e-07 per 1k correct)" },
    ],
  },
  {
    id: "qwen-eval",
    label: "Setup B: Qwen-7B",
    trigger: "AWQ guided_choice",
    statusColor: "#38BDF8",
    statusCode: "200 B_LOCAL",
    baseLatencyMs: 1298,
    latencyLabel: "1,298 ms p50",
    vramOrCost: "$0.00309 / 1k",
    activeStages: ["dedup", "arm", "power", "otel", "ingest", "dbt"],
    summary:
      "Qwen2.5-7B-Instruct-AWQ via Cinch hits 90.5% accuracy with 141.45W GPU telemetry & prefix-renormalized logprobs.",
    payload: {
      model: "Qwen2.5-7B-Instruct-AWQ",
      accuracy_test: 0.9055,
      mean_power_w: 141.45,
      cost_ratio_b_over_a: "10276x",
      mcnemar_p: "3.36e-142",
    },
    traceSpans: [
      { stageId: "dedup", durationMs: 4.0, status: "PASS", metricDelta: "cluster ok", logLine: "MinHash group verified non-overlapping across tune/test" },
      { stageId: "arm", durationMs: 1120.0, status: "PASS", metricDelta: "90.5% Acc", logLine: "vLLM guided_choice returned valid intent + top_logprobs=20" },
      { stageId: "power", durationMs: 14.0, status: "PASS", metricDelta: "141.45 W", logLine: "RTX 3060 Ti 0.5s power window amortized across token count" },
      { stageId: "otel", durationMs: 18.0, status: "PASS", metricDelta: "stripped", logLine: "Collector deleted prompt/completion fields before storage" },
      { stageId: "ingest", durationMs: 42.0, status: "PASS", metricDelta: "OTLP 200", logLine: "Batch written to raw.otel_spans via psycopg pool" },
      { stageId: "dbt", durationMs: 100.0, status: "PASS", metricDelta: "46/46", logLine: "dbt marts reconciled decision cost ($0.00309 / 1k correct)" },
    ],
  },
  {
    id: "cache-regression",
    label: "Cinch Cache Bug",
    trigger: "99.6% false hits",
    statusColor: "#F59E0B",
    statusCode: "WARN 3.7% ACC",
    baseLatencyMs: 412,
    latencyLabel: "3.3% Precision",
    vramOrCost: "4,672 Broken",
    shortCircuitMode: "fault",
    activeStages: ["dedup", "arm", "otel"],
    summary:
      "Tally audit caught Cinch whole-prompt TF cache hashing the 1,500-token header: 99.6% hit rate dropped accuracy 90.5% -> 3.7%.",
    payload: {
      cache_hit_rate: 0.9959,
      cache_hit_precision: 0.0333,
      accuracy_drop: "90.5% -> 3.7%",
      tickets_regressed: 4672,
    },
    traceSpans: [
      { stageId: "dedup", durationMs: 4.0, status: "PASS", metricDelta: "test n=5373", logLine: "Paired test harness initialized with cache_on flag enabled" },
      { stageId: "arm", durationMs: 392.0, status: "TRIP", metricDelta: "3.3% prec", logLine: "Cinch semantic cache matched shared system prompt across different tickets" },
      { stageId: "otel", durationMs: 16.0, status: "TRIP", metricDelta: "-86.8 pts", logLine: "Accuracy collapsed from 90.5% to 3.7% (4,672 decisions flipped wrong)" },
    ],
  },
];

export const LEXICON_STAGES: ReadonlyArray<StageNodeSpec> = [
  {
    id: "retrieve",
    label: "Hybrid RRF",
    role: "BM25 + model2vec schema retriever",
    contract: "Fuses lexical BM25 + potion-base-8M vectors (RRF k=60) + glossary synonyms, pulling rules deterministically",
    faultBehavior: "Achieves 99.0% table & rule retrieval recall across all 120 golden queries while stripping PII cols",
  },
  {
    id: "classify",
    label: "Route Gate",
    role: "Guided-choice safety classifier",
    contract: "Renormalizes token logprobs over 6 routes; deterministic refusal templates burn zero extra LLM tokens",
    faultBehavior: "Halts write_operation, pii_or_sensitive, and out_of_scope queries before SQL synthesis",
  },
  {
    id: "generate",
    label: "Qwen-Coder L3",
    role: "Context-leveled SQL generator",
    contract: "Injects L0 DDL -> L3 verified examples (+36.2 pts CI lift over L0, beating model scaling +18.4 pts)",
    faultBehavior: "Self-corrects SQL violations up to 2 retries within LangGraph cyclic edges",
  },
  {
    id: "sqlguard",
    label: "sqlglot AST",
    role: "Layer-1 deterministic SQL firewall",
    contract: "Enforces single SELECT/set-op, denies 28 write/DDL nodes & 19 funcs/catalogs, and clamps LIMIT 1000",
    faultBehavior: "100% statement & branch coverage; blocked all 46 red-team AST attack vectors",
  },
  {
    id: "ro_exec",
    label: "lexicon_ro DB",
    role: "Layer-2 Postgres read-only boundary",
    contract: "Executes inside BEGIN READ ONLY with statement_timeout = 5000ms against frozen Tally marts.*",
    faultBehavior: "Blocks direct DB privilege abuse (0/44 bypasses even when AST guard is disabled)",
  },
  {
    id: "ares_otlp",
    label: "ARES + OTLP",
    role: "PR gate plugin & live cost export",
    contract: "Publishes GenAI OTLP spans to Tally ($0.000242/q) & enforces 3-seed ARES gates on golden buckets",
    faultBehavior: "Fails CI automatically whenever protected buckets (should_refuse / should_clarify) regress",
  },
] as const;

export const LEXICON_SCENARIOS: ReadonlyArray<ScenarioSpec> = [
  {
    id: "l3-pass",
    label: "L3 Grounded Pass",
    trigger: "+36.2 pts Context",
    statusColor: "#10B981",
    statusCode: "200 VERIFIED_SQL",
    baseLatencyMs: 640,
    latencyLabel: "60.0% Strict EX",
    vramOrCost: "$0.000242 / q",
    activeStages: ["retrieve", "classify", "generate", "sqlguard", "ro_exec", "ares_otlp"],
    summary:
      "Hybrid RRF retrieves schema + rules at L3, passes sqlglot AST + lexicon_ro READ ONLY execution, and logs $0.000242/q to Tally.",
    payload: {
      model: "Qwen2.5-Coder-7B-AWQ",
      context_level: "L3",
      context_effect_ci: "+36.2 pts (+27.9 to +44.6)",
      retrieval_recall: 0.99,
      tally_cost_per_q_usd: 0.000242,
    },
    traceSpans: [
      { stageId: "retrieve", durationMs: 28.0, status: "PASS", metricDelta: "99.0% recall", logLine: "BM25 + model2vec RRF pulled marts.mart_cost_per_outcome + linked rules" },
      { stageId: "classify", durationMs: 92.0, status: "PASS", metricDelta: "answerable", logLine: "Guided-choice route logprob confidence passed answerable threshold" },
      { stageId: "generate", durationMs: 410.0, status: "PASS", metricDelta: "L3 + examples", logLine: "Synthesized Postgres query grounded in L3 semantic context" },
      { stageId: "sqlguard", durationMs: 6.0, status: "PASS", metricDelta: "LIMIT 1000", logLine: "sqlglot validated AST allowlist, qualified cols, and clamped rows" },
      { stageId: "ro_exec", durationMs: 68.0, status: "PASS", metricDelta: "READ ONLY", logLine: "lexicon_ro returned sanity-checked rows within 5s timeout" },
      { stageId: "ares_otlp", durationMs: 36.0, status: "PASS", metricDelta: "$0.000242/q", logLine: "280/280 spans verified in Tally; 3-seed ARES gate PASS" },
    ],
  },
  {
    id: "sqli-blocked",
    label: "Red-Team SQLi",
    trigger: "DROP / pg_read_file",
    statusColor: "#EF4444",
    statusCode: "403 AST_DENY",
    baseLatencyMs: 95,
    latencyLabel: "0 / 90 Bypass",
    vramOrCost: "DB Untouched",
    shortCircuitMode: "fault",
    activeStages: ["retrieve", "classify", "generate", "sqlguard"],
    summary:
      "Multi-statement injection, pg_catalog inspection, or forbidden DDL node is trapped inside sqlglot AST before any DB connection opens.",
    payload: {
      attack_class: "forbidden_statement | table_not_allowed",
      ast_suite_bypassed: "0 / 46",
      db_layer_bypassed: "0 / 44",
      sqlguard_coverage: "100% stmt + branch",
    },
    traceSpans: [
      { stageId: "retrieve", durationMs: 22.0, status: "PASS", metricDelta: "schema fetched", logLine: "Context loaded for red-team adversarial evaluation prompt" },
      { stageId: "classify", durationMs: 38.0, status: "PASS", metricDelta: "probe active", logLine: "Passed probe payload into SQL generator boundary test" },
      { stageId: "generate", durationMs: 31.0, status: "PASS", metricDelta: "unsafe SQL", logLine: "Candidate emitted multi-statement DROP + pg_catalog read" },
      { stageId: "sqlguard", durationMs: 4.0, status: "DENY", metricDelta: "AST blocked", logLine: "sql_guard rejected multiple_statements + _DENY_SCHEMAS before Postgres" },
    ],
  },
  {
    id: "ares-block",
    label: "PR #1 Gate Block",
    trigger: "Drop Rule Regression",
    statusColor: "#F59E0B",
    statusCode: "FAIL ARES_GATE",
    baseLatencyMs: 480,
    latencyLabel: "Refusal -5.0 pts",
    vramOrCost: "Merge Blocked",
    shortCircuitMode: "pause",
    activeStages: ["retrieve", "classify", "generate", "sqlguard", "ro_exec", "ares_otlp"],
    summary:
      "Deleting rule R-RESOLVED-IS-STATUS nudged EX +5.0 pts while silently dropping should_refuse (0.80 -> 0.75); lexicon-ares-gate blocked PR #1.",
    payload: {
      pr: "Rytnixx786/Lexicon#1",
      majority_ex_delta: "+5.0 pts (41.25%)",
      should_refuse_delta: "0.800 -> 0.750 (FAIL)",
      seed_flip_rate: "0.8% (1/120)",
    },
    traceSpans: [
      { stageId: "retrieve", durationMs: 24.0, status: "PASS", metricDelta: "-1 rule", logLine: "Loaded PR #1 branch context_without_reopen_rule" },
      { stageId: "classify", durationMs: 85.0, status: "PASS", metricDelta: "3 seeds", logLine: "Evaluated 120 golden queries across 3 deterministic replay seeds" },
      { stageId: "generate", durationMs: 280.0, status: "PASS", metricDelta: "EX 41.25%", logLine: "Headline EX rose +5.0 pts masking protected refusal drift" },
      { stageId: "sqlguard", durationMs: 5.0, status: "PASS", metricDelta: "clean AST", logLine: "All executed queries cleared sqlglot AST checks" },
      { stageId: "ro_exec", durationMs: 54.0, status: "PASS", metricDelta: "READ ONLY", logLine: "Snapshot queries verified on Postgres lexicon_eval" },
      { stageId: "ares_otlp", durationMs: 32.0, status: "TRIP", metricDelta: "GATE FAIL", logLine: "lexicon-ares-gate blocked merge: should_refuse 0.75 < champion 0.80" },
    ],
  },
];

export interface TraceTimelineRow extends TraceSpanSpec {
  startMs: number;
  offsetPct: number;
  widthPct: number;
}

/**
 * Projects sequential execution spans onto [0..100%] timeline coordinates,
 * clamping zero-duration bypassed spans and micro-bars inside [0, 100 - widthPct]
 * so terminal SKIP/micro bars never clip past the right edge of overflow-hidden tracks.
 */
export function computeTraceSpanTimeline(spans: ReadonlyArray<TraceSpanSpec>): {
  recordedTotalMs: number;
  spanTimeline: TraceTimelineRow[];
} {
  let cursor = 0;
  const rawTotal = spans.reduce((acc, s) => acc + Math.max(0, s.durationMs), 0);
  const total = Math.max(0.01, rawTotal);
  const spanTimeline: TraceTimelineRow[] = [];

  for (const span of spans) {
    const dur = Math.max(0, span.durationMs);
    const startMs = cursor;
    cursor += dur;
    const widthPct =
      dur <= 0 ? 4 : Math.max(6, Math.min(100, (dur / total) * 100));
    const offsetPct = Math.max(
      0,
      Math.min(100 - widthPct, (startMs / total) * 100)
    );
    spanTimeline.push({
      ...span,
      durationMs: dur,
      startMs,
      offsetPct,
      widthPct,
    });
  }

  return {
    recordedTotalMs: rawTotal,
    spanTimeline,
  };
}
