import { evidence, experience, lab, profile, stack } from "@/data/site";
import { projects } from "@/data/projects";

export interface QueryCitation {
  label: string;
  href: string;
}

export interface PortfolioQueryMatch {
  answer: string;
  citations: QueryCitation[];
}

const PROJECT_KEYWORDS: Record<string, readonly string[]> = {
  cinch: ["cinch", "serving", "gateway", "vllm", "marlin", "awq", "331", "10.86", "4.12", "finops"],
  tally: ["tally", "bitext", "tfidf", "tf idf", "otlp", "dbt", "minhash", "99.8%", "90.5%", "3.7%", "10 276x", "10 276", "10276x", "logprobs", "cost per correct", "cache bug"],
  lexicon: ["lexicon", "text to sql", "sqlglot", "lexicon ro", "36.2", "l0", "l3", "red team", "sqli", "0 90", "ares pr", "model2vec"],
  "nexus-researcher": ["nexus", "researcher", "langgraph", "multi agent", "multi-agent", "8.05", "91%"],
  ares: ["ares", "promotion", "regression", "mlops", "92%", "drift gate", "champion"],
  mindstack: ["mindstack", "mind stack", "rag", "bm25", "chromadb", "rrf", "95%", "66.7%", "groundedness"],
  offboarder: ["offboarder", "off boarder", "offboarding", "rls", "sod", "audit ledger", "security", "segregation"],
  "masheba-ai": ["masheba", "ma sheba", "maternal", "bangla", "sqlite", "offline", "healthcare", "auc"],
};

function normalizeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9.%+\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesKeyword(normalizedQuery: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Handle percent signs cleanly since '%' is non-word in JS RegExp
  const prefix = "\\b";
  const suffix = /%$/.test(keyword) ? "(?=\\s|$)" : "\\b";
  return new RegExp(`${prefix}${escaped}${suffix}`, "i").test(normalizedQuery);
}

/**
 * Deterministic grounded retrieval across portfolio projects, FlyRank, BRAC University, and benchmarks.
 */
export function matchPortfolioQuery(query: string): PortfolioQueryMatch | null {
  const q = normalizeQuery(query);
  if (!q) return null;

  if (
    /\b(tally|bitext|minhash|dbt|46\s+46|otlp|10\s*276x?|tf\s*idf|logprobs?|cost\s+per\s+correct|cache\s+bug)\b/i.test(
      q
    ) ||
    /(?:^|\s)(?:99\.8%|90\.5%|3\.7%)(?=\s|$)/.test(q)
  ) {
    if (/\b(cache\s+bug|false\s+hits?|4\s*672|system\s+header)\b/i.test(q) || /(?:^|\s)(?:3\.7%|3\.3%|99\.6%)(?=\s|$)/.test(q)) {
      return {
        answer:
          "Tally's paired Bitext evaluation caught a critical regression in Cinch's whole-prompt semantic cache: hashing the shared 1,500-token system header produced a 99.6% hit rate with only 3.3% precision, collapsing Qwen2.5-7B accuracy from 90.5% to 3.7% (4,672 decisions broken).",
        citations: [
          { label: "Tally Case Study", href: "/work/tally" },
          { label: "Cinch Case Study", href: "/work/cinch" },
        ],
      };
    }

    return {
      answer:
        "Tally measures cost per correct outcome (sigma cost / # correct) across 26,872 MinHash-deduplicated Bitext tickets (22,037 LSH families, n = 5,373 held-out test pairs). Tuned TF-IDF achieved 99.8% accuracy in 0.046ms vs 90.5% for local Qwen2.5-7B-AWQ (1,298ms) at 10,276x lower cost ($3.01e-07 vs $0.00309 per 1k correct), backed by privacy-stripped OTLP telemetry and 46/46 passing dbt contract tests.",
      citations: [
        { label: "Tally Case Study", href: "/work/tally" },
        { label: "GitHub Repo", href: "https://github.com/Rytnixx786/Tally" },
      ],
    };
  }

  if (
    /\b(lexicon|sqlglot|lexicon\s+ro|l0|l3|text\s+to\s+sql|0\s+90|red\s+team|sqli|ares\s+pr|pr\s+1|pr\s+gate|model2vec|should\s+refuse)\b/i.test(
      q
    ) ||
    /(?:^|\s)\+?36\.2\b/i.test(q)
  ) {
    const mentionsAresGate = /\bares\b/i.test(q) || /\b(pr\s+1|pr\s+gate|should\s+refuse)\b/i.test(q);
    const mentionsSecurity = /\b(sqlglot|lexicon\s+ro|0\s+90|0\s+46|0\s+44|red\s+team|sqli|injection|read\s+only|ast)\b/i.test(
      q
    );

    if (mentionsAresGate) {
      return {
        answer:
          "Lexicon enforces 3-seed CI evaluation gates via lexicon-ares-gate across 120 golden queries. In PR #1, removing rule R-RESOLVED-IS-STATUS nudged EX +5.0 pts while silently dropping should_refuse recall (0.800 -> 0.750), so ARES blocked the merge. Runtime queries stay protected behind 2-layer sqlglot AST + lexicon_ro READ ONLY guards (0/90 red-team bypasses) at $0.000242/query.",
        citations: [
          { label: "Lexicon Case Study", href: "/work/lexicon" },
          { label: "ARES Case Study", href: "/work/ares" },
        ],
      };
    }

    if (mentionsSecurity) {
      return {
        answer:
          "Lexicon enforces a 2-layer deterministic security boundary over Tally's Postgres warehouse: an 8-step sqlglot AST firewall (100% statement and branch coverage; blocks 28 write/DDL nodes and 19 functions/catalogs, clamps LIMIT 1000) paired with a lexicon_ro BEGIN READ ONLY Postgres role (5s statement_timeout), yielding 0/90 red-team SQLi bypasses (0/46 AST, 0/44 direct DB).",
        citations: [
          { label: "Lexicon Case Study", href: "/work/lexicon" },
          { label: "GitHub Repo", href: "https://github.com/Rytnixx786/Lexicon" },
        ],
      };
    }

    return {
      answer:
        "Lexicon is a 9-node LangGraph text-to-SQL analyst over Tally's warehouse marts. Across a 3-model x 4-context-level (L0..L3) factorial ablation on 120 golden queries, structured context delivered +36.2 pts lift (95% CI +27.9 to +44.6) vs +18.4 pts from model scaling, with 99.0% hybrid BM25 + model2vec RRF recall, 0/90 red-team SQLi bypasses (sqlglot + lexicon_ro), ARES PR gates, and $0.000242/query live Tally cost.",
      citations: [
        { label: "Lexicon Case Study", href: "/work/lexicon" },
        { label: "GitHub Repo", href: "https://github.com/Rytnixx786/Lexicon" },
      ],
    };
  }

  for (const [slug, aliases] of Object.entries(PROJECT_KEYWORDS)) {
    if (aliases.some((alias) => matchesKeyword(q, alias))) {
      const p = projects.find((item) => item.slug === slug);
      if (p) {
        return {
          answer: `${p.name} (${p.eyebrow}): ${p.description} Measured outcome: ${p.impact}`,
          citations: [
            { label: `${p.name} Case Study`, href: `/work/${p.slug}` },
            { label: "GitHub Repo", href: p.href },
          ],
        };
      }
    }
  }

  if (/\b(flyrank|intern|internship|billing|stripe|metering|experience|work history)\b/i.test(q)) {
    const flyrank = experience[0];
    return {
      answer: `At ${flyrank.org} (${flyrank.period}, ${flyrank.role}), Mehedi built ${flyrank.focus} backend pipelines: ${flyrank.description}`,
      citations: flyrank.href ? [{ label: "FlyRank Capstone", href: flyrank.href }] : [],
    };
  }

  if (/\b(stack|tech|tools|skills|languages|framework|frameworks)\b/i.test(q)) {
    const summary = stack
      .slice(0, 4)
      .map((s) => `${s.layer}: ${s.items.slice(0, 4).join(", ")}`)
      .join(" · ");
    return {
      answer: `Core architecture stack: ${summary}.`,
      citations: [{ label: "Capabilities Matrix", href: "/#expertise" }],
    };
  }

  if (/\b(benchmark|metric|metrics|number|evidence|speed|latency|accuracy|coverage|throughput)\b/i.test(q)) {
    const summary = evidence
      .map((e) => `${e.value}${e.unit} ${e.label} (${e.project})`)
      .join("; ");
    return {
      answer: `Verified benchmarks: ${summary}.`,
      citations: evidence.slice(0, 3).map((e) => ({ label: e.project, href: e.href })),
    };
  }

  if (/\b(lab|research|medical|ccta|kernel|xv6|simplefs|celloscope)\b/i.test(q)) {
    const labSummary = lab
      .map((item) => `${item.name} (${item.note})`)
      .join("; ");
    return {
      answer: `Systems research and clinical builds: ${labSummary}.`,
      citations: [{ label: "Background & Timeline", href: "/#about" }],
    };
  }

  if (/\b(contact|email|github|linkedin|hire|resume|cv|available|brief)\b/i.test(q)) {
    return {
      answer: `Reach ${profile.name} at ${profile.email}, GitHub (${profile.githubHandle}), LinkedIn (${profile.linkedinHandle}), or inspect the recruiter brief.`,
      citations: [
        { label: "Recruiter Brief", href: "/brief" },
        { label: "Resume PDF", href: profile.resume },
      ],
    };
  }

  if (/\b(who\s+is|who\s+are\s+you|about\s+(mehedi|you|him|this)|mehedi|education|brac|university|location|dhaka|thesis|background|bio)\b/i.test(q)) {
    return {
      answer: `${profile.name} is an ${profile.role} based in ${profile.location}, holding a B.Sc. in Computer Science & Engineering from BRAC University (2026) and interning at FlyRank. Core thesis: "${profile.thesis}"`,
      citations: [{ label: "Background", href: "/#about" }],
    };
  }

  return null;
}

export function answerPortfolioQuery(query: string): string | null {
  return matchPortfolioQuery(query)?.answer ?? null;
}

export function fallbackPortfolioMatch(query: string): PortfolioQueryMatch {
  return (
    matchPortfolioQuery(query) ?? {
      answer: `No exact local match for "${query.trim().slice(0, 60)}". Ask about Cinch, Tally, Lexicon, Nexus Researcher, ARES, MindStack, OFFBoarder, MaSheba AI, FlyRank, benchmarks, or contact details.`,
      citations: [
        { label: "Selected Work", href: "/#work" },
        { label: "Recruiter Brief", href: "/brief" },
      ],
    }
  );
}

export function fallbackPortfolioAnswer(query: string): string {
  return fallbackPortfolioMatch(query).answer;
}

const CITATION_PATTERNS: ReadonlyArray<{
  slug: string;
  patterns: readonly RegExp[];
}> = [
  {
    slug: "cinch",
    patterns: [/\/work\/cinch\b/i, /\bcinch\b/i],
  },
  {
    slug: "tally",
    patterns: [/\/work\/tally\b/i, /\btally\b/i],
  },
  {
    slug: "lexicon",
    patterns: [/\/work\/lexicon\b/i, /\blexicon\b/i],
  },
  {
    slug: "nexus-researcher",
    patterns: [/\/work\/nexus-researcher\b/i, /\bnexus[\s-]+researcher\b/i, /\bnexus\b/i],
  },
  {
    slug: "ares",
    patterns: [/\/work\/ares\b/i, /\bares\b/i],
  },
  {
    slug: "mindstack",
    patterns: [/\/work\/mindstack\b/i, /\bmind[\s-]?stack\b/i],
  },
  {
    slug: "offboarder",
    patterns: [/\/work\/offboarder\b/i, /\boff[\s-]?boarder\b/i],
  },
  {
    slug: "masheba-ai",
    patterns: [/\/work\/masheba-ai\b/i, /\bma[\s-]?sheba(?:\s+ai)?\b/i],
  },
];

/**
 * Dynamically extracts exact /work/[slug] and FlyRank citations referenced inside
 * generated Gemini responses so SSE `event: done` and JSON replies cite specific pages.
 */
export function extractCitationsFromText(text: string): QueryCitation[] {
  const hits: Array<{ index: number; citation: QueryCitation }> = [];
  const seenHrefs = new Set<string>();

  for (const entry of CITATION_PATTERNS) {
    let earliest = -1;
    for (const pattern of entry.patterns) {
      const match = pattern.exec(text);
      if (match && (earliest === -1 || match.index < earliest)) {
        earliest = match.index;
      }
    }
    if (earliest !== -1) {
      const project = projects.find((p) => p.slug === entry.slug);
      if (project) {
        const href = `/work/${project.slug}`;
        if (!seenHrefs.has(href)) {
          seenHrefs.add(href);
          hits.push({
            index: earliest,
            citation: { label: `${project.name} Case Study`, href },
          });
        }
      }
    }
  }

  const flyrankMatch = /\bflyrank\b/i.exec(text);
  if (flyrankMatch) {
    const flyrank = experience[0];
    if (flyrank?.href && !seenHrefs.has(flyrank.href)) {
      seenHrefs.add(flyrank.href);
      hits.push({
        index: flyrankMatch.index,
        citation: { label: "FlyRank Capstone", href: flyrank.href },
      });
    }
    const aboutHref = "/#about";
    if (!seenHrefs.has(aboutHref)) {
      seenHrefs.add(aboutHref);
      hits.push({
        index: flyrankMatch.index + 1,
        citation: { label: "Experience & Track", href: aboutHref },
      });
    }
  }

  hits.sort((a, b) => a.index - b.index);
  const citations = hits.map((h) => h.citation);

  return citations.length > 0
    ? citations
    : [{ label: "Selected Work", href: "/#work" }];
}
