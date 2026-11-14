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
      answer: `No exact local match for "${query.trim().slice(0, 60)}". Ask about Cinch, Nexus Researcher, ARES, MindStack, OFFBoarder, MaSheba AI, FlyRank, benchmarks, or contact details.`,
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
