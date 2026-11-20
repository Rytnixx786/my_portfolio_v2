// Grounded portfolio metadata verified against README.md and Mehedi_Hasan_Resume.pdf.

export const profile = {
  name: "Mehedi Hasan",
  first: "Mehedi",
  last: "Hasan",
  initials: "MH",
  role: "AI & Backend Systems Engineer",
  location: "Dhaka, Bangladesh",
  timezone: "Asia/Dhaka",
  utc: "UTC+6",
  email: "nafismehedi37@gmail.com",
  github: "https://github.com/Rytnixx786",
  githubHandle: "Rytnixx786",
  linkedin: "https://www.linkedin.com/in/mehedi-hasan-llm",
  linkedinHandle: "mehedi-hasan-llm",
  resume: "/resume/Mehedi_Hasan_Resume.pdf",
  portrait: "/img/mehedi-portrait.jpg",
  heroPortrait: "/img/newdp.jpg",
  url: "https://mehedi-hasan-llm.vercel.app",
  thesis: "I build the deterministic systems around stochastic models.",
  headline: "I build AI systems that stay verifiable after the demo ends.",
  summary:
    "B.Sc. Computer Science & Engineering graduate (BRAC University, Class of 2026) and Back End AI Intern at FlyRank. Building quantized LLM gateways, stateful LangGraph orchestration, grounded RAG, and CI-gated ML pipelines.",
  status: "Open to AI & Backend Engineering Roles",
  availabilityShort: "Dhaka, Bangladesh (UTC+6) · Open to Work",
} as const;

export const nav = [
  { label: "Home", href: "/", sectionId: "top" },
  { label: "Work", href: "/#work", sectionId: "work" },
  { label: "Simulator", href: "/#simulator", sectionId: "simulator" },
  { label: "Background", href: "/#about", sectionId: "about" },
  { label: "Stack", href: "/#expertise", sectionId: "expertise" },
  { label: "Brief", href: "/brief", sectionId: "brief" },
  { label: "Contact", href: "/#contact", sectionId: "contact" },
] as const;

export const principles = [
  {
    k: "01",
    t: "Evidence first",
    d: "When retrieval cannot substantiate a claim, refuse cleanly instead of guessing.",
  },
  {
    k: "02",
    t: "Timed baselines",
    d: "Every latency, throughput, and refusal metric cites its unoptimized baseline.",
  },
  {
    k: "03",
    t: "CI promotion gates",
    d: "Models and prompts ship only after automated regression and slice checks pass.",
  },
] as const;

export const measurementProtocol = [
  {
    step: "01",
    title: "Fixed Baselines",
    metric: "FP16 & single-pass controls",
    detail:
      "Compared directly against 30.48 tok/s CPU-offloaded FP16 vLLM on 8 GB VRAM and 4/15 un-gated single-pass RAG refusal.",
  },
  {
    step: "02",
    title: "Adversarial Suites",
    metric: "Promptfoo + Ragas + pytest",
    detail:
      "Tested in CI against unanswerable and contradictory prompts rather than happy paths.",
  },
  {
    step: "03",
    title: "Fault Injection",
    metric: "45.56ms breaker · WAL outbox",
    detail:
      "Exercised under GPU OOM panics, dropped SSE sockets, and offline sync reconnects.",
  },
] as const;

export const focusAreas = [
  {
    id: "serving",
    code: "01",
    category: "Inference & Serving" as const,
    title: "LLM Serving & Gateway Control Planes",
    description:
      "Quantized AWQ Marlin serving with 60 RPM / 50k TPM admission control, 4.12ms ONNX semantic cache, 3-state circuit breaker, and FinOps cutoffs.",
    capabilities: [
      "vLLM + AWQ Marlin INT4",
      "In-process ONNX Semantic Cache",
      "3-State Circuit Breaker FSM",
      "EBNF / AST JSON Grammar Repair",
      "Kubernetes HPA & FinOps Cutoffs",
    ],
  },
  {
    id: "rag",
    code: "02",
    category: "Agents & RAG" as const,
    title: "Grounded RAG & Refusal Calibration",
    description:
      "Hybrid BM25 and dense vector fusion via RRF (k = 60), cross-encoder reranking, and NLI entailment gates.",
    capabilities: [
      "Hybrid BM25 + Dense Vector Search",
      "Reciprocal Rank Fusion (k = 60)",
      "Cross-Encoder Reranking",
      "NLI Entailment Refusal Gates",
      "Ragas & Promptfoo Eval Harnesses",
    ],
  },
  {
    id: "agents",
    code: "03",
    category: "Agents & RAG" as const,
    title: "Durable Agent Orchestration",
    description:
      "Stateful LangGraph pipelines backed by PostgreSQL checkpoints, human approval interrupts, and Last-Event-ID SSE replay.",
    capabilities: [
      "LangGraph StateGraph Workflows",
      "AsyncPostgresSaver Checkpoints",
      "Human-in-the-Loop Interrupts",
      "Last-Event-ID Resumable SSE",
      "Token-Budget Ledgers",
    ],
  },
  {
    id: "backend",
    code: "04",
    category: "MLOps & Security" as const,
    title: "Backend Systems & Zero-Trust Boundaries",
    description:
      "Async FastAPI APIs enforcing PostgreSQL Row-Level Security, Segregation of Duties, chained SHA-256 audit logs, and Stripe metering.",
    capabilities: [
      "FastAPI Async & Pydantic v2",
      "PostgreSQL Row-Level Security",
      "Chained SHA-256 Audit Ledgers",
      "Transactional Outbox Retries",
      "Stripe Metering & Webhook Sync",
    ],
  },
  {
    id: "edge",
    code: "05",
    category: "Mobile & Systems" as const,
    title: "Offline-First Edge & Product Delivery",
    description:
      "Offline-ready React Native and Next.js interfaces using SQLite WAL outbox queues and on-device ONNX inference (0.90 AUC).",
    capabilities: [
      "React Native & Expo Router",
      "SQLite WAL Outbox Sync",
      "On-Device ONNX XGBoost (AUC 0.90)",
      "Next.js 16 & TypeScript 5",
      "Chunked Resumable Media Sync",
    ],
  },
] as const;

export const evidence = [
  {
    value: "10.86",
    unit: "×",
    label: "Generation throughput",
    from: "30.48 tok/s FP16 offload (8 GB VRAM)",
    to: "331 tok/s",
    context: "Qwen2.5-7B-Instruct, AWQ Marlin INT4 on 8 GB VRAM GPU",
    project: "Cinch",
    href: "/work/cinch",
  },
  {
    value: "4.12",
    unit: "ms",
    label: "Semantic cache hit",
    from: ">1,200 ms cold GPU round-trip",
    to: "4.12 ms, zero GPU compute",
    context: "In-process ONNX vector cache, cosine >= 0.92",
    project: "Cinch",
    href: "/work/cinch",
  },
  {
    value: "10,276",
    unit: "×",
    label: "Cost/correct savings (TF-IDF vs Qwen-7B)",
    from: "$0.00309 / 1k correct (Qwen2.5-7B, 90.5% acc)",
    to: "$3.01e-07 / 1k correct (TF-IDF, 99.8% acc)",
    context: "5,373 held-out paired tickets, 46/46 dbt contracts, 99.6% false-cache detection",
    project: "Tally",
    href: "/work/tally",
  },
  {
    value: "+36.2",
    unit: "pts",
    label: "Context ablation lift (L3 vs L0)",
    from: "15.0% L0 DDL baseline (+18.4 pts model size effect)",
    to: "60.0% strict EX (0/90 red-team SQLi bypasses)",
    context: "3-model x 4-level factorial ablation (120 golden queries), 99.0% RRF recall",
    project: "Lexicon",
    href: "/work/lexicon",
  },
  {
    value: "91",
    unit: "%",
    label: "Adversarial refusal accuracy",
    from: "Single-shot search synthesis",
    to: "7-node gated LangGraph",
    context: "8.05 req/s sustained load, 122 backend tests, 5 ADRs",
    project: "Nexus Researcher",
    href: "/work/nexus-researcher",
  },
  {
    value: "92",
    unit: "%+",
    label: "Enforced CI coverage",
    from: "Manual notebook checks",
    to: "~420 tests across 72 modules",
    context: "Commit-SHA idempotent evals + slice gates (also powers Lexicon PR gates)",
    project: "ARES",
    href: "/work/ares",
  },
] as const;

export const experience = [
  {
    period: "June 2026",
    role: "AI & Back End Engineering Intern (Capstone Track)",
    org: "FlyRank",
    focus: "Usage metering & Stripe billing",
    description:
      "Engineered multi-tenant usage metering in FastAPI and SQLAlchemy 2: idempotent usage-event ingestion, a tiered pricing calculation engine, and asynchronous Stripe webhook state reconciliation.",
    stack: ["FastAPI", "SQLAlchemy 2", "Stripe SDK", "Pydantic v2"],
    href: "https://github.com/Rytnixx786/flyrank-capstone-metering-billing",
  },
  {
    period: "B.Sc. CSE, 2026",
    role: "B.Sc. Computer Science & Engineering",
    org: "BRAC University",
    focus: "Systems, databases & AI",
    description:
      "Core CS coursework in operating systems, relational databases, computer networks, and artificial intelligence, paired with low-level C implementations including SimpleFS and a RISC-V xv6 lottery scheduler.",
    stack: ["C", "POSIX", "RISC-V xv6", "PostgreSQL", "Algorithms"],
  },
] as const;

export const lab = [
  {
    name: "3D CCTA Stenosis Engine",
    domain: "Volumetric medical AI",
    note: "RASNet + SegResNet achieving 95.2% adjacent (+/-1 CAD-RADS) agreement",
    stack: "PyTorch 3D",
  },
  {
    name: "SimpleFS",
    domain: "Operating systems",
    note: "Custom C file system implementing superblocks, bitmaps, and inode tables",
    stack: "C · POSIX",
  },
  {
    name: "xv6 Lottery Scheduler",
    domain: "Kernel scheduling",
    note: "Probabilistic proportional-share CPU scheduler for RISC-V xv6",
    stack: "C · RISC-V",
  },
  {
    name: "Autonomous Security AI",
    domain: "Cyber-defense agent",
    note: "Streaming telemetry anomaly detection with analyst recalibration loop",
    stack: "Python · scikit-learn",
    href: "https://github.com/Rytnixx786/autonomous-security-ai",
  },
  {
    name: "Celloscope Assessment",
    domain: "Clinical extraction",
    note: "Strict 3-layer clean architecture, zero-credential mock mode, 25 contract tests",
    stack: "FastAPI · Docker",
    href: "https://github.com/Rytnixx786/celloscope-assessment",
  },
] as const;

export const stack = [
  {
    code: "01",
    layer: "Serving & inference",
    summary: "Quantized GPU serving, sub-5ms CPU caching, and fast-fail fault isolation.",
    items: ["vLLM", "AWQ Marlin INT4", "ONNX Runtime", "Semantic caching", "Sliding-window queue"],
  },
  {
    code: "02",
    layer: "Retrieval & agents",
    summary: "Evidence-gated hybrid search and durable cyclic LangGraph workflows.",
    items: ["LangGraph", "Hybrid BM25 + dense", "RRF (k = 60)", "Cross-encoder rerank", "NLI refusal gates", "Ragas"],
  },
  {
    code: "03",
    layer: "Backend",
    summary: "Asynchronous service boundaries, typed contracts, and task queues.",
    items: ["Python 3.11+", "FastAPI", "Async SQLAlchemy 2", "Pydantic v2", "Celery", "Node.js", "Prisma"],
  },
  {
    code: "04",
    layer: "Data",
    summary: "Multi-tenant RLS, dbt warehouse contracts, vector indices, and offline SQLite WAL sync.",
    items: ["PostgreSQL 16", "dbt-postgres", "pgvector", "Row-Level Security", "MinHash LSH", "ChromaDB", "SQLite WAL", "PostGIS"],
  },
  {
    code: "05",
    layer: "Ops & MLOps",
    summary: "ARES CI regression gates, container autoscaling, OTLP privacy strip, and Prometheus metrics.",
    items: ["Docker", "Kubernetes + HPA", "GitHub Actions", "OpenTelemetry", "Prometheus", "sqlglot", "MLflow"],
  },
  {
    code: "06",
    layer: "Interfaces",
    summary: "Resilient operator dashboards, case-study webs, and mobile field apps.",
    items: ["TypeScript 5", "Next.js 16", "React 19", "React Native + Expo", "Tailwind CSS v4", "Streamlit", "Plotly"],
  },
] as const;

export type FocusArea = (typeof focusAreas)[number];
export type EvidenceItem = (typeof evidence)[number];
export type ExperienceItem = (typeof experience)[number];
export type LabItem = (typeof lab)[number];
export type StackLayer = (typeof stack)[number];
