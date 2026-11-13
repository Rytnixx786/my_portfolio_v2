import { evidence, experience, lab, profile, stack } from "@/data/site";
import { projects } from "@/data/projects";

const PROJECT_ALIASES: Record<string, string[]> = {
  cinch: ["cinch", "serving", "gateway", "vllm", "marlin", "awq", "331", "10.86", "4.12"],
  "nexus-researcher": ["nexus", "researcher", "langgraph", "multi agent", "multi-agent", "8.05"],
  ares: ["ares", "promotion", "regression", "mlops", "92%", "420"],
  mindstack: ["mindstack", "mind stack", "rag", "bm25", "chromadb", "rrf", "95%"],
  offboarder: ["offboarder", "off-boarder", "offboarding", "rls", "sod", "audit"],
  "masheba-ai": ["masheba", "ma sheba", "maternal", "bangla", "sqlite", "offline", "healthcare"],
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministic, zero-latency Q&A engine strictly grounded in portfolio data.
 */
export function answerPortfolioQuery(rawQuery: string): string | null {
  const q = normalize(rawQuery);
  if (!q) return null;

  if (/^(help|commands|ls|\?)$/i.test(q)) {
    return "Try asking about: Cinch, Nexus Researcher, ARES, MindStack, OFFBoarder, MaSheba AI, FlyRank, benchmarks, stack, or contact.";
  }

  if (/^(hi|hello|hey|yo|greetings)\b/i.test(q)) {
    return `Hello — I answer questions about ${profile.name}'s systems engineering work. Ask about Cinch, Nexus Researcher, ARES, MindStack, FlyRank, or benchmarks.`;
  }

  const matchedProjects = projects.filter((p) => {
    const keys = [
      p.name.toLowerCase(),
      p.slug.replace(/-/g, " "),
      ...(PROJECT_ALIASES[p.slug] ?? []),
    ];
    return keys.some((k) => q.includes(k));
  });

  if (matchedProjects.length > 0) {
    return matchedProjects
      .map(
        (p) =>
          `${p.name} (${p.eyebrow}): ${p.description} Measured impact: ${p.impact}`
      )
      .join(" ");
  }

  if (/(flyrank|intern|experience|work history|career)/i.test(q)) {
    const flyrank = experience[0];
    return `${flyrank.org} (${flyrank.period} — ${flyrank.role}): ${flyrank.description} Stack: ${flyrank.stack.join(", ")}.`;
  }

  if (/(benchmark|metric|number|evidence|speed|latency|accuracy|coverage)/i.test(q)) {
    const summary = evidence
      .slice(0, 4)
      .map((e) => `${e.value}${e.unit} ${e.label} (${e.project})`)
      .join("; ");
    return `Verified benchmarks: ${summary}. Every number is linked to its case study under /work/[slug].`;
  }

  if (/(lab|ccta|xv6|simplefs|celloscope|security)/i.test(q)) {
    const list = lab.map((item) => `${item.name} (${item.note})`).join("; ");
    return `Lab & systems builds: ${list}.`;
  }

  if (/(stack|tech|skill|tool|language|python|fastapi|kubernetes)/i.test(q)) {
    const layers = stack.map((s) => `${s.layer}: ${s.items.slice(0, 4).join(", ")}`).join(" | ");
    return layers;
  }

  if (/(who|about|education|brac|university|location|dhaka|thesis)/i.test(q)) {
    return `${profile.name} is an ${profile.role} based in ${profile.location} (${profile.utc}), graduating B.Sc. CSE from BRAC University in 2026. Thesis: "${profile.thesis}"`;
  }

  if (/(resume|cv|pdf)/i.test(q)) {
    return `Download Mehedi's résumé (PDF) at ${profile.resume}.`;
  }

  if (/(contact|email|hire|available|linkedin|github)/i.test(q)) {
    return `${profile.status}. Reach Mehedi at ${profile.email}, GitHub (${profile.githubHandle}), or LinkedIn (${profile.linkedinHandle}).`;
  }

  if (/(project|projects|systems|portfolio|built)/i.test(q)) {
    return `Six flagship systems: ${projects.map((p) => p.name).join(", ")}. Open any case study at /work/<slug> for architecture graphs and code.`;
  }

  return null;
}

export function fallbackPortfolioAnswer(rawQuery: string): string {
  return (
    answerPortfolioQuery(rawQuery) ??
    "I can only answer questions about Mehedi Hasan's shipped systems (Cinch, Nexus Researcher, ARES, MindStack, OFFBoarder, MaSheba AI), FlyRank internship, benchmarks, stack, and contact details."
  );
}

