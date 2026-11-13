import { describe, expect, it } from "vitest";
import { answerPortfolioQuery, matchPortfolioQuery } from "@/lib/query-engine";
import { CATEGORY_HUES } from "@/lib/palette";
import { projects } from "@/data/projects";
import { POST } from "@/app/api/query/route";

describe("query-engine grounded retrieval", () => {
  it("matches Cinch queries cleanly with citations", () => {
    const res = matchPortfolioQuery("How does Cinch achieve 4.12ms semantic cache?");
    expect(res).not.toBeNull();
    expect(res?.answer).toContain("331.0 tok/s");
    expect(res?.citations.some((c) => c.href === "/work/cinch")).toBe(true);
  });

  it("matches exact percent values like 95% and 92% without stripping %", () => {
    const mindstack = matchPortfolioQuery("What achieved 95% groundedness?");
    expect(mindstack?.answer).toContain("MindStack");

    const ares = matchPortfolioQuery("Which project has 92% pytest coverage?");
    expect(ares?.answer).toContain("ARES");
  });

  it("enforces word boundaries so unrelated words do not false-trigger", () => {
    expect(answerPortfolioQuery("Tell me about ragtime jazz")).toBeNull();
  });

  it("routes security/offboarding to OFFBoarder and billing/Stripe to FlyRank", () => {
    expect(matchPortfolioQuery("Explain security offboarding audit logs")?.answer).toContain(
      "OFFBoarder"
    );
    expect(matchPortfolioQuery("What did Mehedi build at FlyRank?")?.answer).toContain(
      "FlyRank"
    );
  });
});

describe("palette and data integrity", () => {
  it("excludes violet/purple accents from category palette", () => {
    const hexes = Object.values(CATEGORY_HUES).map((h) => h.hex.toLowerCase());
    expect(hexes).not.toContain("#a855f7");
  });

  it("provides Section 15 methodology and evaluation series on all 6 projects", () => {
    expect(projects).toHaveLength(6);
    for (const project of projects) {
      expect(project.methodology.length).toBeGreaterThan(20);
      expect(project.evalSeries.length).toBeGreaterThanOrEqual(2);
      expect(project.failures.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("/api/query handler", () => {
  it("returns 400 on invalid JSON body or missing message", async () => {
    const badJsonReq = new Request("http://localhost:3100/api/query", {
      method: "POST",
      body: "{not-valid-json",
    });
    const res1 = await POST(badJsonReq);
    expect(res1.status).toBe(400);

    const emptyMsgReq = new Request("http://localhost:3100/api/query", {
      method: "POST",
      body: JSON.stringify({ message: "   " }),
    });
    const res2 = await POST(emptyMsgReq);
    expect(res2.status).toBe(400);
  });

  it("streams grounded SSE responses when text/event-stream is requested", async () => {
    const sseReq = new Request("http://localhost:3100/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "x-forwarded-for": "198.51.100.42",
      },
      body: JSON.stringify({ message: "Tell me about MaSheba AI AUC" }),
    });
    const res = await POST(sseReq);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const bodyText = await res.text();
    expect(bodyText).toContain("MaSheba AI");
    expect(bodyText).toContain("0.90 AUC");
  });
});

