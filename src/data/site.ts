// Site-wide verified content sourced from README.md, Mehedi_Hasan_Resume.pdf, and v1 portfolio.ts.

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
  headline: "I build AI systems that stay useful when the demo ends and reality starts.",
  summary:
    "Final-year Computer Science student at BRAC University engineering production-grade AI infrastructure: quantized LLM serving gateways, stateful multi-agent orchestration, grounded hybrid RAG, and offline-first backend architectures.",
  status: "Available 2026 · Open to AI & Backend Roles",
  availabilityShort: "Dhaka, Bangladesh (UTC+6) · Available 2026",
} as const;

export const nav = [
  { label: "Home", href: "/", sectionId: "top" },
  { label: "Work", href: "/#work", sectionId: "work" },
  { label: "About", href: "/#about", sectionId: "about" },
  { label: "Expertise", href: "/#expertise", sectionId: "expertise" },
  { label: "Contact", href: "/#contact", sectionId: "contact" },
] as const;

export const principles = [
  {
    k: "01",
    t: "Evidence first",
    d: "If the retrieval can't prove it, the system refuses. Calibrated silence beats confident fiction.",
  },
  {
    k: "02",
    t: "Show the engineering",
    d: "Benchmarks with baselines, deterministic tests that run in CI, and diagrams of what actually ships.",
  },
  {
    k: "03",
    t: "Gate every promotion",
    d: "No model, prompt, or build reaches users without passing an idempotent regression gate.",
  },
] as const;

export const focusAreas = [
  {
    id: "serving",
    code: "01",
    title: "LLM Serving & Gateway Control Planes",
    description:
      "Self-hosted quantized inference with vLLM and AWQ Marlin INT4, PID concurrency regulation, sub-5ms ONNX semantic caching, 3-state circuit breakers, micro-dollar FinOps cutoffs, and Kubernetes HPA.",
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
    title: "Grounded RAG & Refusal Calibration",
    description:
      "Evidence-first retrieval combining sparse BM25 and dense vector indices via Reciprocal Rank Fusion (k = 60), cross-encoder reranking, pre-generation NLI entailment gates, and CI-backed adversarial evaluation.",
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
    title: "Durable Agent Orchestration",
    description:
      "Cyclic stateful LangGraph workflows backed by PostgreSQL schema-level checkpointing, human-in-the-loop approval interrupts, Redis token-bucket rate limits, and resumable Last-Event-ID SSE streams.",
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
    title: "Backend Systems & Zero-Trust Boundaries",
    description:
      "Observable asynchronous APIs with FastAPI, SQLAlchemy 2.0, PostgreSQL Row-Level Security, Segregation of Duties enforcement, chained SHA-256 audit ledgers, and idempotent Stripe usage metering.",
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
    title: "Offline-First Edge & Product Delivery",
    description:
      "Resilient mobile and web surfaces built for disconnected environments using SQLite WAL outbox sync with microsecond logical clocks, on-device ONNX risk scoring, and strict performance budgets.",
    capabilities: [
      "React Native & Expo Router",
      "SQLite WAL Outbox Sync",
      "On-Device ONNX XGBoost Triage",
      "Next.js 16 & TypeScript 5",
      "Chunked Resumable Media Sync",
    ],
  },
] as const;

export const skillGroups = [
  {
    title: "AI Systems & Serving",
    skills: ["vLLM", "AWQ Marlin", "Semantic Caching", "LangGraph", "Hybrid RAG", "LLM Evals", "Promptfoo"],
  },
  {
    title: "Models & Infra",
    skills: ["Qwen2.5-7B", "ONNX Runtime", "PyTorch", "Kubernetes", "k3d", "Docker", "Prometheus", "OpenTelemetry"],
  },
  {
    title: "Backend & Offline Sync",
    skills: ["Python 3.11+", "FastAPI", "Async SQLAlchemy 2", "Node.js", "PostgreSQL", "Redis", "SQLite WAL", "Supabase"],
  },
  {
    title: "Mobile & Frontend",
    skills: ["React Native", "Expo Router", "Next.js 16", "React 19", "TypeScript 5", "Tailwind CSS v4"],
  },
] as const;

export const evidence = [
  {
    value: "10.86",
    unit: "×",
    label: "Generation throughput",
    from: "30.48 tok/s FP16 baseline",
    to: "331 tok/s",
    context: "Qwen2.5-7B, AWQ Marlin INT4 on an 8 GB VRAM GPU",
    project: "Cinch",
    href: "/work/cinch",
  },
  {
    value: "4.12",
    unit: "ms",
    label: "Semantic cache hit",
    from: ">1,200 ms full LLM round-trip",
    to: "4.12 ms, 0 W GPU",
    context: "In-process ONNX vector cache, cosine >= 0.92",
    project: "Cinch",
    href: "/work/cinch",
  },
  {
    value: "4.87",
    unit: "×",
    label: "Lower time-to-first-token",
    from: "FP16 baseline",
    to: "Prefix cache + speculative decoding",
    context: "Same consumer 8 GB VRAM hardware, 45 ms breaker trip",
    project: "Cinch",
    href: "/work/cinch",
  },
  {
    value: "91",
    unit: "%",
    label: "Adversarial refusal accuracy",
    from: "Unchecked single-pass RAG",
    to: "8-node gated LangGraph",
    context: "8.05 req/s sustained load, 122 passing backend tests",
    project: "Nexus Researcher",
    href: "/work/nexus-researcher",
  },
  {
    value: "95",
    unit: "%",
    label: "QA groundedness",
    from: "26.67% refusal on unanswerable queries",
    to: "66.67% refusal, 95% grounded",
    context: "BM25 + ChromaDB, RRF k = 60, NLI entailment gate",
    project: "MindStack",
    href: "/work/mindstack",
  },
  {
    value: "92",
    unit: "%+",
    label: "Enforced test coverage",
    from: "Ad-hoc notebook checks",
    to: "~420 tests across 72 modules",
    context: "7 GitHub Actions workflows gate every PR",
    project: "ARES",
    href: "/work/ares",
  },
] as const;

export const experience = [
  {
    period: "June 2026",
    role: "AI & Back End Engineering Intern",
    org: "FlyRank",
    focus: "Metering & billing",
    description:
      "Built multi-tenant usage metering: idempotent usage-event ingestion, a tiered pricing engine, and asynchronous Stripe webhook reconciliation.",
    stack: ["FastAPI", "SQLAlchemy 2", "Stripe", "Pydantic v2"],
    href: "https://github.com/Rytnixx786/flyrank-capstone-metering-billing",
  },
  {
    period: "2025 — Now",
    role: "Independent AI Systems Builder",
    org: "Self-directed",
    focus: "Serving, retrieval, agents, MLOps",
    description:
      "Designed and shipped Cinch, Nexus Researcher, ARES, MindStack, OFFBoarder, and MaSheba AI end to end, each backed by CI-gated tests, Prometheus observability, and measured benchmarks.",
    stack: ["vLLM", "LangGraph", "FastAPI", "PostgreSQL", "Kubernetes"],
  },
  {
    period: "2022 — 2026",
    role: "B.Sc. Computer Science & Engineering",
    org: "BRAC University",
    focus: "Systems & AI",
    description:
      "Final-year CS coursework across operating systems, relational databases, computer networks, and AI, extended through systems builds including SimpleFS in C and a RISC-V xv6 lottery scheduler.",
    stack: ["C", "POSIX", "RISC-V xv6", "Algorithms", "Databases"],
  },
] as const;

export const lab = [
  {
    name: "3D CCTA Stenosis Engine",
    domain: "Volumetric medical AI",
    note: "RASNet + SegResNet; 95.2% adjacent CAD-RADS agreement",
    stack: "PyTorch 3D",
  },
  {
    name: "SimpleFS",
    domain: "Operating systems",
    note: "Custom file system in C with superblocks and inode tables",
    stack: "C · POSIX",
  },
  {
    name: "xv6 Lottery Scheduler",
    domain: "Kernel scheduling",
    note: "Probabilistic CPU scheduling for the RISC-V xv6 kernel",
    stack: "C · RISC-V",
  },
  {
    name: "Autonomous Security AI",
    domain: "Cyber-defense agent",
    note: "Streaming telemetry anomaly detection with an analyst feedback loop",
    stack: "Python · scikit-learn",
    href: "https://github.com/Rytnixx786/autonomous-security-ai",
  },
  {
    name: "Celloscope Assessment",
    domain: "Clinical extraction",
    note: "3-layer clean architecture, zero-credential mock mode, 25 contract tests",
    stack: "FastAPI · Docker",
    href: "https://github.com/Rytnixx786/celloscope-assessment",
  },
  {
    name: "FlyRank Metering & Billing",
    domain: "Usage-based billing",
    note: "Idempotent ingestion, tiered pricing, Stripe webhook reconciliation",
    stack: "FastAPI · Stripe",
    href: "https://github.com/Rytnixx786/flyrank-capstone-metering-billing",
  },
] as const;

export const stack = [
  {
    code: "01",
    layer: "Serving & inference",
    summary: "Low-latency quantized serving, semantic caching, and GPU fault isolation.",
    items: ["vLLM", "AWQ Marlin INT4", "ONNX Runtime", "Semantic caching", "PID admission control"],
  },
  {
    code: "02",
    layer: "Retrieval & agents",
    summary: "Evidence-gated hybrid search and durable cyclic state graphs.",
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
    summary: "Multi-tenant isolation, vector stores, and offline-first edge sync.",
    items: ["PostgreSQL 16", "pgvector", "Row-Level Security", "Redis 7", "ChromaDB", "SQLite WAL", "PostGIS"],
  },
  {
    code: "05",
    layer: "Ops & MLOps",
    summary: "Automated regression gates, container orchestration, and telemetry.",
    items: ["Docker", "Kubernetes + HPA", "GitHub Actions", "Prometheus", "OpenTelemetry", "DVC", "MLflow"],
  },
  {
    code: "06",
    layer: "Interfaces",
    summary: "Resilient operator dashboards, case-study webs, and mobile field apps.",
    items: ["TypeScript 5", "Next.js 16", "React 19", "React Native + Expo", "Tailwind CSS v4", "Streamlit"],
  },
] as const;

export type FocusArea = (typeof focusAreas)[number];
export type EvidenceItem = (typeof evidence)[number];
export type ExperienceItem = (typeof experience)[number];
export type LabItem = (typeof lab)[number];
export type StackLayer = (typeof stack)[number];
