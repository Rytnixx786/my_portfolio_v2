// Case-study content and verified engineering metadata grounded in README.md and Mehedi_Hasan_Resume.pdf.

export const PROJECT_CATEGORIES = [
  "Inference & Serving",
  "Agents & RAG",
  "MLOps & Security",
  "Mobile & Systems",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export interface EvalSeriesPoint {
  label: string;
  baseline: number;
  current: number;
  unit: string;
}

export const projects = [
  {
    slug: "cinch",
    name: "Cinch",
    featured: true,
    category: "Inference & Serving" as ProjectCategory,
    year: "2025 to 2026",
    role: "Sole Author · Serving & Gateway Architecture",
    timeline: "6 weeks",
    statusLabel: "Open-source benchmarked",
    services: ["LLM Serving", "Async Gateway", "FinOps Control"],
    eyebrow: "Self-hosted LLM serving gateway",
    description:
      "An 8-stage asynchronous FastAPI gateway & AWQ Marlin INT4 serving layer for Qwen2.5-7B on an 8 GB VRAM card with sub-5ms CPU semantic caching, k3d gateway HPA, and per-tenant token cutoffs.",
    impact:
      "10.86x throughput speedup (30.48 -> 331.0 tok/s vs CPU-offloaded FP16 on 8 GB VRAM), 4.12ms ONNX semantic cache hits (zero GPU compute), 45.56ms breaker fast-fail, and 195 CI tests.",
    methodology:
      "Benchmarked Qwen2.5-7B-Instruct on an 8 GB VRAM GPU comparing CPU-offloaded FP16 baseline (30.48 tok/s) against AWQ Marlin W4A16 INT4 with prefix caching, k3d gateway HPA scaling (2 to 6 gateway pods), and pytest fault injection.",
    reproduceCmd: "pytest tests/ -v --cov=gateway && python scripts/bench_throughput.py --quant awq_marlin",
    constraints: [
      "8 GB consumer VRAM card (~4.2 GiB INT4 weights plus activations/KV cache headroom)",
      "Sub-50ms failure isolation requirement so worker OOM crashes never hang downstream callers for 30s",
      "Strict EBNF JSON grammar repair required on 7B parameters for deterministic tool calling",
    ],
    tradeoffs: [
      "Selected in-process CPU ONNX embeddings + TF-IDF cache over external Redis vector search, trading cluster-wide cache sharing on single-node replicas for a 4.12ms hit path with zero GPU compute.",
      "Used AWQ Marlin W4A16 quantization instead of FP16 tensor parallelism, accepting slight perplexity drift in exchange for 10.86x batched throughput vs CPU-offloaded FP16 on 8 GB VRAM.",
    ],
    failures: [
      "Early semantic cache threshold of cosine >= 0.85 triggered false hits on negated follow-up prompts; raised threshold to >= 0.92 and gated cache bypass on system-prompt hashes.",
      "Half-open circuit breaker thundering herd occurred when 12 queued workers probed simultaneously; added a single-flight canary mutex during HALF_OPEN state.",
    ],
    evalSeries: [
      { label: "Throughput", baseline: 30.5, current: 331.0, unit: "tok/s" },
      { label: "Cache Latency", baseline: 1200, current: 4.12, unit: "ms" },
      { label: "Fault Fail", baseline: 30000, current: 45.6, unit: "ms" },
    ] satisfies ReadonlyArray<EvalSeriesPoint>,
    highlightMetrics: [
      { value: "10.86x", label: "Throughput Speedup" },
      { value: "4.12ms", label: "Semantic Cache Hit" },
      { value: "195", label: "CI Deterministic Tests" },
      { value: "45.56ms", label: "Circuit Fast-Fail" },
    ],
    tech: ["Python", "FastAPI", "vLLM", "AWQ Marlin", "Kubernetes", "k3d", "Docker", "Prometheus", "OpenTelemetry", "ONNX"],
    href: "https://github.com/Rytnixx786/Cinch",
    sourceRef: "gateway/circuit_breaker.py",
    codeLabel: "Circuit Breaker FSM",
    challenge:
      "Serving self-hosted LLMs across multi-tenant callers exposes raw vLLM processes to cascading failure: GPU OOM panics stall sockets for 30 seconds, paraphrased prompts burn redundant KV cache cycles, and unguarded JSON generation breaks downstream tool parsers.",
    approach:
      "Engineered Cinch as an 8-stage async FastAPI control plane around AWQ Marlin INT4 workers. Built an in-process ONNX semantic vector cache (cosine >= 0.92) returning exact/paraphrased hits in 4.12ms without GPU compute, a 3-state circuit breaker FSM isolating panics in 45.56ms (HTTP 503) with canary recovery probes, micro-dollar FinOps cutoffs (HTTP 402), EBNF grammar repair, and k3d gateway HPA autoscaling.",
    architecture: {
      nodes: [
        { id: "circuit_breaker", label: "Circuit Breaker FSM", desc: "45.56ms fast-fail with single-flight canary probe recovery" },
        { id: "finops_gate", label: "FinOps Budget Gate", desc: "Pre-flight micro-dollar token cutoff returning HTTP 402" },
        { id: "guardrails", label: "PII & Input Filter", desc: "Regex & heuristic scanner redacting keys before GPU dispatch" },
        { id: "semantic_cache", label: "ONNX Semantic Cache", desc: "CPU cosine >= 0.92 vector lookup in 4.12ms (zero GPU compute)" },
        { id: "rate_limiter", label: "Admission Queue", desc: "60 RPM / 50k TPM sliding-window priority scheduler" },
        { id: "vllm_engine", label: "vLLM Marlin Engine", desc: "INT4 W4A16 inference for Qwen2.5-7B on 8 GB VRAM (~4.2 GiB weights)" },
        { id: "tool_engine", label: "Sandboxed Executor", desc: "Isolated EBNF-repaired Python & SQL tool execution loop" },
        { id: "shadow_replayer", label: "Shadow Replayer", desc: "5% async candidate traffic capture with divergence scoring" },
      ],
      connections: [
        { from: "circuit_breaker", to: "finops_gate", label: "Breaker Closed" },
        { from: "finops_gate", to: "guardrails", label: "Budget OK" },
        { from: "guardrails", to: "semantic_cache" },
        { from: "semantic_cache", to: "rate_limiter", label: "Cache Miss" },
        { from: "rate_limiter", to: "vllm_engine", label: "Admitted" },
        { from: "vllm_engine", to: "tool_engine", label: "Tool Loop" },
        { from: "vllm_engine", to: "shadow_replayer", label: "Async Replay" },
        { from: "tool_engine", to: "vllm_engine", label: "Tool Result" },
      ],
    },
    lessons: [
      "Running ONNX vector embeddings in-process eliminated external vector DB network hops and preserved GPU VRAM for KV cache pages, keeping cache hits at 4.12ms.",
      "Single-flight canary gating in the HALF_OPEN state prevents simultaneous queued requests from crashing a recovering vLLM worker on startup.",
      "Combining prefix caching with AWQ Marlin W4A16 cut Time-To-First-Token by 4.87x alongside a 10.86x raw generation speedup.",
    ],
    codeLanguage: "python",
    codeSnippet: `# Cinch: Circuit Breaker FSM & Canary Recovery (actual excerpt, gateway/circuit_breaker.py)
import time
from enum import Enum
from typing import Optional, Tuple

class BreakerState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreaker:
    """Isolates GPU/vLLM backend panics in <46ms and canary-probes recovery."""
    def __init__(self, failure_threshold: int = 3, recovery_timeout_s: float = 10.0):
        self.state = BreakerState.CLOSED
        self.consecutive_failures = 0
        self.last_failure_time = 0.0
        self.canary_in_flight = False
        self.failure_threshold = failure_threshold
        self.recovery_timeout_s = recovery_timeout_s

    def can_execute(self) -> Tuple[bool, str, Optional[float]]:
        now = time.monotonic()
        if self.state == BreakerState.CLOSED:
            return True, "healthy", None

        if self.state == BreakerState.OPEN:
            elapsed = now - self.last_failure_time
            if elapsed >= self.recovery_timeout_s:
                self.state = BreakerState.HALF_OPEN
                self.canary_in_flight = False
            else:
                remaining = round(self.recovery_timeout_s - elapsed, 2)
                return False, f"Circuit breaker OPEN. Retry in {remaining}s", remaining

        if self.state == BreakerState.HALF_OPEN:
            if not self.canary_in_flight:
                self.canary_in_flight = True
                return True, "canary_probe", None
            return False, "Canary probe in-flight", 2.0

        return True, "healthy", None

    def record_success(self) -> None:
        self.state = BreakerState.CLOSED
        self.consecutive_failures = 0
        self.canary_in_flight = False

    def record_failure(self) -> None:
        self.consecutive_failures += 1
        self.last_failure_time = time.monotonic()
        self.canary_in_flight = False
        if self.consecutive_failures >= self.failure_threshold:
            self.state = BreakerState.OPEN`,
    nextSteps:
      "Add GPU-node sidecar Redis vector cache syncing for multi-node cluster scaling and benchmark AWQ Marlin against FP8 on RTX 4090.",
  },
  {
    slug: "nexus-researcher",
    name: "Nexus Researcher",
    featured: true,
    category: "Agents & RAG" as ProjectCategory,
    year: "2025",
    role: "Sole Author · Agent Orchestration & Backend",
    timeline: "5 weeks",
    statusLabel: "Open-source · 5 ADRs",
    services: ["LangGraph Orchestration", "SSE Replay", "Postgres Checkpointing"],
    eyebrow: "Stateful multi-agent research engine",
    description:
      "A 7-node LangGraph workflow combining four-stage hybrid retrieval (Tavily -> BM25 -> RRF -> cross-encoder rerank), human-in-the-loop query approval, and resumable Last-Event-ID SSE streams.",
    impact:
      "8.05 req/s sustained API throughput, 91% adversarial refusal accuracy, 122 passing backend tests, and 5 documented architectural decision records.",
    methodology:
      "Evaluated against adversarial unanswerable/conflicting web source fixtures alongside sustained load tests across the FastAPI SSE endpoint with PostgreSQL AsyncPostgresSaver state recovery.",
    reproduceCmd: "pytest backend/tests -q && uvicorn app.main:app --reload",
    constraints: [
      "Mid-run process restarts must resume seamlessly via Last-Event-ID without losing scraped citations",
      "Search and crawl spend must halt at an explicit human approval interrupt before fanning out web calls",
      "Outgoing crawls constrained by target rate limits across parallel scraping workers",
    ],
    tradeoffs: [
      "Moved LangGraph checkpoints from Redis to PostgreSQL AsyncPostgresSaver: accepted +12ms cold write overhead for ACID crash recovery and resumable SSE replay.",
      "Placed a mandatory human-in-the-loop checkpoint before scraping rather than fully autonomous loops, trading 1 click for deterministic cost control.",
    ],
    failures: [
      "Unbounded parallel scraping initially triggered HTTP 429 bans from search targets; added a Redis token-bucket limiter per host.",
      "Sparse citations caused synthesizer hallucination when passing top-k chunks unconditionally; added a groundedness >= 0.85 conditional loop back to the planner.",
    ],
    evalSeries: [
      { label: "Adversarial Refusal", baseline: 42, current: 91, unit: "%" },
      { label: "Backend Suite", baseline: 0, current: 122, unit: "tests" },
      { label: "Load Throughput", baseline: 2.4, current: 8.05, unit: "req/s" },
    ] satisfies ReadonlyArray<EvalSeriesPoint>,
    highlightMetrics: [
      { value: "8.05 req/s", label: "Sustained Throughput" },
      { value: "91%", label: "Refusal Accuracy" },
      { value: "122", label: "Passing Tests (5 ADRs)" },
      { value: "7 Nodes", label: "LangGraph StateGraph" },
    ],
    tech: ["LangGraph", "FastAPI", "PostgreSQL", "Redis", "SSE", "React"],
    href: "https://github.com/Rytnixx786/Nexus",
    sourceRef: "backend/graph/workflow.py",
    codeLabel: "LangGraph StateGraph",
    challenge:
      "Single-pass research agents break silently on bad search formulations, waste tokens scraping boilerplate pages, and synthesize fabricated claims whenever retrieved sources contradict or lack proof.",
    approach:
      "Designed a 7-node LangGraph StateGraph separating Planning, Query Formulation, Human Approval interrupt, rate-limited Parallel Scraping, Hybrid Reranking (BM25 -> RRF -> cross-encoder), Refusal Calibration, and Citation Synthesis. State persists in PostgreSQL via AsyncPostgresSaver so disconnected SSE streams resume via Last-Event-ID.",
    architecture: {
      nodes: [
        { id: "planner", label: "Research Planner", desc: "Deconstructs user prompt into verifiable sub-topics" },
        { id: "query_gen", label: "Query Generator", desc: "Builds scoped search queries for Tavily retrieval" },
        { id: "hitl", label: "Human Checkpoint", desc: "Pauses graph so user can approve or prune search queries" },
        { id: "scraper", label: "Parallel Scraper", desc: "Crawls targets under Redis token-bucket rate limits" },
        { id: "extractor", label: "Hybrid Reranker", desc: "BM25 + dense RRF plus cross-encoder sentence ranking" },
        { id: "refusal", label: "Refusal Gate", desc: "Enforces evidence sufficiency before allowing synthesis" },
        { id: "synthesizer", label: "Report Synthesizer", desc: "Streams inline-cited dossier over Last-Event-ID SSE" },
      ],
      connections: [
        { from: "planner", to: "query_gen" },
        { from: "query_gen", to: "hitl" },
        { from: "hitl", to: "scraper", label: "Approved" },
        { from: "scraper", to: "extractor" },
        { from: "extractor", to: "refusal" },
        { from: "refusal", to: "synthesizer", label: "Groundedness >= 0.85" },
        { from: "refusal", to: "planner", label: "Insufficient -> Re-plan" },
      ],
    },
    lessons: [
      "Migrating checkpoint state from ephemeral Redis to PostgreSQL schema tables added 12ms per step while guaranteeing exact resume semantics after crashes.",
      "A Redis token-bucket limiter synced across worker tasks eliminated external host 429 throttling under concurrent load.",
    ],
    codeLanguage: "python",
    codeSnippet: `# Nexus Researcher: Simplified 7-Node StateGraph Topology (backend/graph/workflow.py)
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

class ResearchState(TypedDict):
    topic: str
    sub_queries: List[str]
    is_approved: bool
    scraped_documents: List[Dict[str, Any]]
    groundedness_score: float
    citation_dossier: str

workflow = StateGraph(ResearchState)
workflow.add_node("planner", plan_research_subtopics)
workflow.add_node("query_generator", generate_focused_queries)
workflow.add_node("human_approval", hitl_checkpoint_node)
workflow.add_node("parallel_scraper", scrape_with_rate_limits)
workflow.add_node("extractor", hybrid_rerank_documents)
workflow.add_node("refusal_check", evaluate_groundedness_score)
workflow.add_node("synthesizer", compile_citation_dossier)

workflow.add_edge(START, "planner")
workflow.add_edge("planner", "query_generator")
workflow.add_edge("query_generator", "human_approval")
workflow.add_conditional_edges(
    "human_approval",
    lambda state: "parallel_scraper" if state["is_approved"] else "planner",
)
workflow.add_edge("parallel_scraper", "extractor")
workflow.add_edge("extractor", "refusal_check")
workflow.add_conditional_edges(
    "refusal_check",
    lambda state: "synthesizer" if state["groundedness_score"] >= 0.85 else "planner",
)
workflow.add_edge("synthesizer", END)

async def compile_graph(db_uri: str):
    async with AsyncPostgresSaver.from_conn_string(db_uri) as checkpointer:
        return workflow.compile(checkpointer=checkpointer)`,
    nextSteps:
      "Add multi-provider search fallback beyond Tavily and automate end-to-end replay stress benchmarks across dropped WebSocket/SSE clients.",
  },
  {
    slug: "ares",
    name: "ARES",
    featured: true,
    category: "MLOps & Security" as ProjectCategory,
    year: "2025",
    role: "Sole Author · MLOps & Evaluation Control Plane",
    timeline: "4 weeks",
    statusLabel: "Open-source · CI-enforced",
    services: ["CI Promotion Gates", "Drift Monitoring", "Evaluation API"],
    eyebrow: "ML model regression & promotion gate",
    description:
      "A Python 3.11+ evaluation control plane comparing candidate models against live champions across aggregate F1, p95 latency, KS/PSI drift, and critical demographic slices before permitting promotion.",
    impact:
      "92%+ enforced pytest coverage across 72 test modules (~420 tests), idempotent commit-SHA evaluations, Prometheus telemetry, and automated GitHub Actions PR gates.",
    methodology:
      "Validated with CI coverage enforcement (--cov-fail-under=92) running unit, contract, and property-based gate rules on synthetic drift and slice regression fixtures.",
    reproduceCmd: "pytest --cov=ares --cov-fail-under=92",
    constraints: [
      "Duplicate CI re-runs on the same commit SHA and golden set must never corrupt champion history",
      "Overall accuracy gains must be rejected if critical minority slice F1 regresses below policy",
      "Promotion decisions require immutable audit records accessible via FastAPI and Streamlit",
    ],
    tradeoffs: [
      "Keyed evaluation tables uniquely by (commit_sha, golden_set_version, model_name), trading ad-hoc overwrite flexibility for strict idempotent auditability.",
      "Used Streamlit for the internal operator leaderboard rather than building a second React frontend so engineering time stayed on rules_engine.py and CI workflows.",
    ],
    failures: [
      "Early aggregate-only checks passed candidates that lost 15% F1 on rare demographic slices; added mandatory per-slice floor rules alongside overall delta thresholds.",
      "CI job retries originally inserted duplicate champion records; resolved cleanly via composite idempotency keys.",
    ],
    evalSeries: [
      { label: "CI Coverage", baseline: 0, current: 92, unit: "%" },
      { label: "Test Modules", baseline: 12, current: 72, unit: "files" },
      { label: "Test Cases", baseline: 60, current: 420, unit: "tests" },
    ] satisfies ReadonlyArray<EvalSeriesPoint>,
    highlightMetrics: [
      { value: "92%+", label: "CI Test Coverage" },
      { value: "~420", label: "Tests (72 Modules)" },
      { value: "Commit-SHA", label: "Idempotent Eval Key" },
      { value: "Slice-Gated", label: "Drift & F1 Checks" },
    ],
    tech: ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Redis", "Streamlit", "Docker", "GitHub Actions", "DVC"],
    href: "https://github.com/Rytnixx786/Ares",
    sourceRef: "ares/engine/rules_engine.py",
    codeLabel: "Promotion Gate Engine",
    challenge:
      "Ad-hoc notebook checks let silent regressions reach users: a candidate model improving headline F1 by 2% can simultaneously degrade p95 latency or fail critical underrepresented slices.",
    approach:
      "Built ARES around a declarative rules_engine checking candidate builds against the champion on metric deltas, demographic slice floors, latency budgets, and KS/PSI drift. Results persist idempotently in PostgreSQL via async SQLAlchemy and surface through authenticated FastAPI endpoints and Prometheus metrics.",
    architecture: {
      nodes: [
        { id: "ci", label: "GitHub Actions", desc: "PR workflows invoke regression, quality, and drift gates" },
        { id: "cli", label: "Evaluation CLI", desc: "scripts/run_evaluation.py executes deterministic candidate runs" },
        { id: "golden", label: "Golden Validator", desc: "Verifies dataset SHA checksums, row counts, and slices" },
        { id: "eval", label: "Evaluators", desc: "Classification, latency, and KS/PSI drift extractors" },
        { id: "gate", label: "Promotion Gate", desc: "rules_engine rejects slice, F1, or latency regressions" },
        { id: "db", label: "PostgreSQL Ledger", desc: "Idempotent run history keyed by commit_sha + golden version" },
        { id: "api", label: "FastAPI Service", desc: "API-key protected endpoints + Prometheus exporter" },
        { id: "dash", label: "Streamlit Console", desc: "Operator leaderboard, slice drill-down, and promotion audit" },
      ],
      connections: [
        { from: "ci", to: "cli" },
        { from: "cli", to: "golden" },
        { from: "golden", to: "eval" },
        { from: "eval", to: "gate" },
        { from: "gate", to: "db", label: "Persist Run" },
        { from: "db", to: "api" },
        { from: "api", to: "dash" },
        { from: "gate", to: "api", label: "Pass / Reject" },
      ],
    },
    lessons: [
      "Aggregate accuracy hides severe slice regressions; enforcing explicit per-slice minimum thresholds caught real failure modes masked by global averages.",
      "Composite idempotency keys across commit SHA and dataset digest keep CI retries completely safe and deterministic.",
    ],
    codeLanguage: "python",
    codeSnippet: `# ARES Promotion Gate (ares/engine/rules_engine.py)
class RulesEngine:
    def __init__(self, config: GateConfig):
        self.config = config

    def evaluate(self, candidate: EvalResult, champion: EvalResult) -> GateDecision:
        failures = []

        for metric, max_drop in self.config.metric_gates.items():
            delta = candidate.metrics[metric] - champion.metrics[metric]
            if delta < -max_drop:
                failures.append(f"{metric} regressed {delta:.4f} (limit: -{max_drop})")

        for slice_name, min_f1 in self.config.critical_slices.items():
            slice_f1 = candidate.slices[slice_name]["f1"]
            if slice_f1 < min_f1:
                failures.append(
                    f"Slice '{slice_name}' below floor (f1={slice_f1:.3f} < {min_f1})"
                )

        if candidate.p95_latency_ms > self.config.max_latency_ms:
            failures.append(
                f"p95 latency {candidate.p95_latency_ms}ms > {self.config.max_latency_ms}ms"
            )

        return GateDecision(
            passed=len(failures) == 0,
            failures=failures,
            narrative=self._build_narrative(candidate, champion, failures),
        )`,
    nextSteps:
      "Add OpenTelemetry span attributes for every rejected slice floor and automate golden dataset drift snapshots in GitHub Releases.",
  },
  {
    slug: "mindstack",
    name: "MindStack",
    featured: false,
    category: "Agents & RAG" as ProjectCategory,
    year: "2025",
    role: "Sole Author · Hybrid RAG & Evaluation",
    timeline: "4 weeks",
    statusLabel: "Open-source · Dockerized",
    services: ["Hybrid BM25 + Dense", "NLI Refusal Gate", "Ragas Evals"],
    eyebrow: "Calibrated hybrid RAG platform",
    description:
      "An evidence-only document Q&A engine fusing ChromaDB vectors with BM25 lexical search via Reciprocal Rank Fusion (k = 60), cross-encoder reranking, and an NLI refusal classifier.",
    impact:
      "Measured 95% factual QA groundedness and raised adversarial unanswerable refusal accuracy from 4/15 (26.67%) to 10/15 (66.67%, n = 15) under CI evaluation suites.",
    methodology:
      "Measured using CI-backed adversarial QA suites comparing baseline un-gated vector retrieval against RRF (k = 60) plus NLI entailment gating (>= 0.70) and cross-encoder reranking.",
    reproduceCmd: "docker compose up --build -d && pytest evals/adversarial_suite.py",
    constraints: [
      "Exact code identifiers and error strings frequently miss pure embedding nearest-neighbor search",
      "Unanswerable user queries must trigger an explicit refusal instead of hallucinated synthesis",
    ],
    tradeoffs: [
      "Adopted parent-child chunking (small index child chunks, large parent window passed to generator), trading extra SQLite metadata lookups for intact surrounding context.",
      "Used Reciprocal Rank Fusion (k = 60) over tuned linear score weighting to avoid fragile normalization across BM25 and cosine similarity distributions.",
    ],
    failures: [
      "Raw cosine distance thresholding broke whenever Markdown formatting changed; replaced with cross-encoder + NLI entailment checks.",
    ],
    evalSeries: [
      { label: "Groundedness", baseline: 71, current: 95, unit: "%" },
      { label: "Refusal Accuracy", baseline: 26.7, current: 66.7, unit: "%" },
    ] satisfies ReadonlyArray<EvalSeriesPoint>,
    highlightMetrics: [
      { value: "95%", label: "QA Groundedness" },
      { value: "66.7%", label: "Adversarial Refusal" },
      { value: "k = 60", label: "RRF Fusion Constant" },
      { value: "26.7%->66.7%", label: "Refusal Delta" },
    ],
    tech: ["FastAPI", "React", "Docker", "ChromaDB", "BM25", "Ollama", "Mistral", "SQLite"],
    href: "https://github.com/Rytnixx786/MindStack",
    sourceRef: "backend/retrieval/hybrid.py",
    codeLabel: "RRF + NLI Refusal Gate",
    challenge:
      "Vector-only RAG retrieves semantically adjacent paragraphs while missing exact error codes or identifiers, and unconstrained generators synthesize plausible falsehoods when supporting chunks are absent.",
    approach:
      "Combined ChromaDB dense search with sparse BM25 lexical matching through Reciprocal Rank Fusion (k = 60), followed by cross-encoder reranking and an NLI entailment gate that aborts generation when context support drops below threshold.",
    architecture: {
      nodes: [
        { id: "query", label: "User Query", desc: "Incoming question normalized for dual retrieval" },
        { id: "dense", label: "ChromaDB Dense", desc: "Semantic embedding search across child chunks" },
        { id: "sparse", label: "BM25 Sparse", desc: "Exact lexical token index for identifiers and terms" },
        { id: "rrf", label: "RRF Merger (k=60)", desc: "Rank fusion + cross-encoder reranking" },
        { id: "filter", label: "NLI Refusal Gate", desc: "Verifies entailment support before invoking LLM" },
        { id: "generator", label: "Mistral Generator", desc: "Synthesizes citation-backed answer on parent chunks" },
      ],
      connections: [
        { from: "query", to: "dense" },
        { from: "query", to: "sparse" },
        { from: "dense", to: "rrf" },
        { from: "sparse", to: "rrf" },
        { from: "rrf", to: "filter" },
        { from: "filter", to: "generator", label: "Entailment >= 0.70" },
        { from: "filter", to: "query", label: "Calibrated Refusal" },
      ],
    },
    lessons: [
      "Reciprocal Rank Fusion (k = 60) plus NLI entailment proved far less brittle across formatting noise than arbitrary cosine distance cutoffs.",
      "Retrieving small 128-token child chunks while supplying parent sections to Mistral kept both recall precision and answer completeness high.",
    ],
    codeLanguage: "python",
    codeSnippet: `# MindStack: Reciprocal Rank Fusion & NLI Entailment Gate (backend/retrieval/hybrid.py)
def reciprocal_rank_fusion(dense_results, sparse_results, doc_map, k: int = 60):
    fused_scores: dict[str, float] = {}
    for rank, doc in enumerate(dense_results):
        fused_scores[doc.id] = fused_scores.get(doc.id, 0.0) + 1.0 / (rank + k)
    for rank, doc in enumerate(sparse_results):
        fused_scores[doc.id] = fused_scores.get(doc.id, 0.0) + 1.0 / (rank + k)

    ranked = sorted(fused_scores.items(), key=lambda item: item[1], reverse=True)
    return [doc_map[doc_id] for doc_id, _ in ranked[:5]]

def check_groundedness(answer_draft: str, retrieved_chunks: list[str], nli_model) -> bool:
    entailment_score = nli_model.predict(answer_draft, retrieved_chunks)
    if entailment_score < 0.70:
        raise RefusalException("Insufficient supporting evidence in indexed sources.")
    return True`,
    nextSteps:
      "Expand the adversarial QA eval corpus from n = 15 to 200+ paired edge cases and add parent-chunk citation span highlighting.",
  },
  {
    slug: "offboarder",
    name: "OFFBoarder",
    featured: false,
    category: "MLOps & Security" as ProjectCategory,
    year: "2025",
    role: "Sole Author · Full-Stack Security Architecture",
    timeline: "4 weeks",
    statusLabel: "Open-source platform",
    services: ["Multi-Tenant RLS", "Segregation of Duties", "SHA-256 Ledger"],
    eyebrow: "Zero-trust enterprise offboarding",
    description:
      "A multi-tenant employee offboarding platform enforcing database-level PostgreSQL Row-Level Security, Segregation of Duties (Creator != Approver), Risk Radar scoring, and chained SHA-256 PDF audit evidence packs.",
    impact:
      "Delivered the complete system end to end: Prisma + Postgres RLS schema, SoD enforcement middleware, IP ban/unban lockdown flows, jsPDF evidence packs, and transactional outbox retries.",
    methodology:
      "Verified tenant isolation and Segregation of Duties invariants with server-side integration tests checking cross-tenant session isolation, self-approval rejection, and tamper detection on chained hashes.",
    reproduceCmd: "npm run test:security && npx prisma migrate status",
    constraints: [
      "Application-level WHERE filters are easy to forget; isolation must be enforced inside PostgreSQL RLS policies",
      "An offboarding creator must never be permitted to self-approve or execute high-risk lockdowns",
    ],
    tradeoffs: [
      "Enforced PostgreSQL session variables (`app.current_tenant_id`) via Prisma middleware extensions instead of separate schemas per tenant to keep migrations simple.",
      "Used chained SHA-256 audit rows inside PostgreSQL rather than external blockchain infrastructure for predictable ACID compliance.",
    ],
    failures: [
      "Upstream identity provider rate limits initially desynced audit log timestamps; resolved by moving outbound webhook revocations into a transactional outbox table.",
    ],
    evalSeries: [
      { label: "Isolation Layer", baseline: 1, current: 2, unit: "DB + API" },
      { label: "Audit Hash", baseline: 0, current: 256, unit: "bit SHA" },
    ] satisfies ReadonlyArray<EvalSeriesPoint>,
    highlightMetrics: [
      { value: "SoD Enforced", label: "Creator != Approver" },
      { value: "SHA-256", label: "Chained Audit Ledger" },
      { value: "Postgres RLS", label: "Tenant Isolation" },
      { value: "Outbox Sync", label: "Transactional Retries" },
    ],
    tech: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Supabase", "jsPDF"],
    href: "https://github.com/Rytnixx786/OFF-Boarder",
    sourceRef: "src/lib/middleware/sod.ts",
    codeLabel: "Segregation of Duties Guard",
    challenge:
      "Rushed employee offboarding leaves stale cloud sessions and unilaterally approved actions with mutable logs that fail compliance audits.",
    approach:
      "Built multi-tenant RLS isolation via PostgreSQL session contexts, enforced Segregation of Duties checks requiring distinct creator and security approver identities, and appended every revocation into a hash-chained SHA-256 ledger exportable as jsPDF evidence packs.",
    architecture: {
      nodes: [
        { id: "client", label: "Admin & Employee UI", desc: "Role-scoped workflows for tasks, risk escalation, and evidence" },
        { id: "middleware", label: "SoD Middleware", desc: "Blocks creator self-approval and verifies officer role" },
        { id: "db_rls", label: "Postgres RLS", desc: "Enforces tenant boundary via DB session variables" },
        { id: "revoker", label: "Transactional Outbox", desc: "Dispatches Slack, IP ban, and revocation retries safely" },
        { id: "audit", label: "SHA-256 Audit Ledger", desc: "Chained hash records + jsPDF compliance export" },
      ],
      connections: [
        { from: "client", to: "middleware" },
        { from: "middleware", to: "db_rls", label: "SoD Verified" },
        { from: "db_rls", to: "revoker" },
        { from: "revoker", to: "audit", label: "Hash Chained" },
      ],
    },
    lessons: [
      "Application-level tenant filters invite accidental leaks; pushing tenant context into PostgreSQL RLS policies locks boundaries at the storage engine.",
      "Writing webhook dispatches through a transactional outbox table keeps revocation state and hash audit entries consistent across upstream timeouts.",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// OFFBoarder: Segregation of Duties Guard (src/lib/middleware/sod.ts)
export class SodViolationError extends Error {
  constructor(message: string, public readonly status: 401 | 403 | 404) {
    super(message);
  }
}

export async function enforceSegregationOfDuties(
  prisma: PrismaClient,
  taskId: string,
  actor: { id: string; roles: string[]; tenantId: string }
) {
  const task = await prisma.offboardingTask.findFirst({
    where: { id: taskId, tenantId: actor.tenantId },
  });

  if (!task) throw new SodViolationError("Offboarding task not found.", 404);

  // Creator of the offboarding request cannot approve their own action
  if (task.creatorId === actor.id) {
    throw new SodViolationError(
      "Segregation of Duties violated: creators cannot self-approve tasks.",
      403
    );
  }

  if (!actor.roles.includes("SEC_OFFICER")) {
    throw new SodViolationError("Security officer approval required.", 401);
  }

  return task;
}`,
    nextSteps:
      "Add SCIM 2.0 webhook adapters for Okta/Google Workspace deprovisioning and automate PostgreSQL RLS tenant-boundary fuzzing in CI.",
  },
  {
    slug: "masheba-ai",
    name: "MaSheba AI",
    featured: false,
    category: "Mobile & Systems" as ProjectCategory,
    year: "2025",
    role: "Backend Engineer · Team Build",
    timeline: "Team capstone",
    statusLabel: "Open-source · Live docs",
    services: ["SQLite WAL Sync", "On-Device ONNX (AUC 0.90)", "Clinical FastAPI"],
    eyebrow: "Offline-first Bangla maternal healthcare",
    description:
      "A Bangla maternal health ecosystem for community health workers operating in zero-connectivity rural zones, featuring local SQLite WAL persistence, on-device ONNX XGBoost triage (AUC 0.90), and a Groq -> Gemini -> offline chat cascade.",
    impact:
      "Owned the FastAPI backend, dual-LLM clinical chat cascade, SQLite WAL outbox sync protocol, and ONNX XGBoost maternal risk model achieving 0.90 AUC on-device.",
    methodology:
      "Evaluated the maternal risk triage classifier offline via stratified cross-validation (AUC 0.90) exported to ONNX Runtime, alongside airplane-mode SQLite outbox replay drills.",
    reproduceCmd: "cd backend && pytest tests/sync/ -v",
    constraints: [
      "Rural community workers operate for hours in zero-reception areas; patient intake must never block on HTTP",
      "Bilingual clinical fallback must gracefully degrade from online Groq/Gemini to offline guidance",
    ],
    tradeoffs: [
      "Exported XGBoost triage directly to ONNX on-device instead of cloud scoring so high-risk vital signs flag instantaneously without connectivity.",
      "Used client-generated UUID v4 identifiers plus per-device microsecond wall timestamps (created_us) to avoid primary-key collisions without server round-trips.",
    ],
    failures: [
      "Sequential integer IDs caused primary-key collisions across disconnected devices; migrated cleanly to UUID v4 keys.",
      "Large prescription images starved cellular sync batches; separated media into resumable byte-offset chunk uploads.",
    ],
    evalSeries: [
      { label: "Risk Triage AUC", baseline: 0.72, current: 0.9, unit: "ROC-AUC" },
      { label: "LLM Cascade", baseline: 1, current: 3, unit: "tiers" },
    ] satisfies ReadonlyArray<EvalSeriesPoint>,
    highlightMetrics: [
      { value: "0.90 AUC", label: "ONNX Risk Model" },
      { value: "WAL Sync", label: "Offline SQLite Outbox" },
      { value: "3-Tier", label: "Groq->Gemini->Offline" },
      { value: "PostGIS", label: "Regional CHW Telemetry" },
    ],
    tech: ["FastAPI", "React Native", "Expo Router", "SQLite WAL", "ONNX", "Supabase", "PostGIS"],
    href: "https://github.com/DigontaDas/MaSheba--AI",
    docs: "https://masheba-docs.vercel.app/docs",
    sourceRef: "mobile/services/sync.ts",
    codeLabel: "Parameterized Outbox Sync",
    challenge:
      "Rural health workers lose intermittent cellular links during home visits. Online-only forms lose patient vitals or hang during critical triage moments.",
    approach:
      "Owned the FastAPI backend and SQLite WAL outbox synchronization protocol. Offline mutations queue locally using UUID v4 IDs and flush safely upon network recovery, paired with an on-device ONNX XGBoost model (0.90 AUC) and a Groq -> Gemini -> offline clinical chat cascade.",
    architecture: {
      nodes: [
        { id: "mobile_ui", label: "Expo Bangla UI", desc: "Offline triage intake and on-device ONNX XGBoost (0.90 AUC)" },
        { id: "sqlite", label: "SQLite WAL DB", desc: "Local persistence surviving zero-connectivity visits" },
        { id: "queue", label: "Outbox Sync Queue", desc: "Ordered mutation queue keyed by UUID v4 and timestamp" },
        { id: "sync_engine", label: "Sync Coordinator", desc: "Batches pending rows when cellular link returns" },
        { id: "gateway", label: "FastAPI + Cascade", desc: "Groq -> Gemini -> offline chat + PostGIS sync ingestion" },
      ],
      connections: [
        { from: "mobile_ui", to: "sqlite" },
        { from: "sqlite", to: "queue" },
        { from: "queue", to: "sync_engine" },
        { from: "sync_engine", to: "gateway", label: "Link Restored" },
      ],
    },
    lessons: [
      "Client-generated UUID v4 primary keys and microsecond ordering eliminated multi-device merge collisions during offline field testing.",
      "Decoupling large prescription image uploads into chunked byte-offset transfers prevented slow cellular links from blocking urgent vitals sync.",
    ],
    codeLanguage: "typescript",
    codeSnippet: `// MaSheba AI: Parameterized SQLite Outbox Sync Flush (mobile/services/sync.ts)
export async function flushSyncQueue(db: SQLiteDatabase, endpoint: string) {
  const pending = await db.getAllAsync<{ id: string; payload: string }>(
    "SELECT id, payload FROM sync_queue ORDER BY created_us ASC LIMIT 50"
  );
  if (pending.length === 0) return;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mutations: pending }),
  });

  if (!response.ok) {
    throw new Error(\`Sync batch rejected with status \${response.status}\`);
  }

  const ids = pending.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  await db.runAsync(\`DELETE FROM sync_queue WHERE id IN (\${placeholders})\`, ids);
}`,
    nextSteps:
      "Add end-to-end conflict replay tests for overlapping rural household edits and expose ONNX model quantization diffs per Android ABI.",
  },
] as const;

export type Project = (typeof projects)[number];
export type ProjectSlug = Project["slug"];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getAdjacentProjects(slug: string): {
  prev: Project;
  next: Project;
  index: number;
} {
  const index = Math.max(
    0,
    projects.findIndex((project) => project.slug === slug)
  );
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  return { prev, next, index };
}
