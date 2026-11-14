import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  answerPortfolioQuery,
  extractCitationsFromText,
  matchPortfolioQuery,
} from "@/lib/query-engine";
import { CATEGORY_HUES } from "@/lib/palette";
import { resolveEffectiveTier, resolveQualityReason } from "@/lib/device-tier";
import { classifyNodeKind } from "@/lib/architecture";
import { projects } from "@/data/projects";
import { profile } from "@/data/site";
import {
  CINCH_SCENARIOS,
  CINCH_STAGES,
  RAG_SCENARIOS,
  RAG_STAGES,
} from "@/data/playground";
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

describe("palette, device tier, and project data integrity", () => {
  it("excludes violet/purple accents from category palette", () => {
    const hexes = Object.values(CATEGORY_HUES).map((h) => h.hex.toLowerCase());
    expect(hexes).not.toContain("#a855f7");
  });

  it("provides Section 15 methodology, evals, nextSteps, and dash-free UI copy on all 6 projects", () => {
    expect(projects).toHaveLength(6);
    for (const project of projects) {
      expect(project.methodology.length).toBeGreaterThan(20);
      expect(project.evalSeries.length).toBeGreaterThanOrEqual(2);
      expect(project.failures.length).toBeGreaterThanOrEqual(1);
      expect(project.reproduceCmd.length).toBeGreaterThan(3);
      expect(project.nextSteps.length).toBeGreaterThan(20);
      expect(/[\u2013\u2014]/.test(project.description)).toBe(false);
    }
  });

  it("validates playground stage contracts, thresholds, and scenario stage IDs", () => {
    const cinchIds = new Set(CINCH_STAGES.map((s) => s.id));
    const ragIds = new Set(RAG_STAGES.map((s) => s.id));
    for (const stage of [...CINCH_STAGES, ...RAG_STAGES]) {
      expect(stage.role.trim().length).toBeGreaterThan(4);
      expect(stage.contract.trim().length).toBeGreaterThan(10);
      expect(stage.faultBehavior.trim().length).toBeGreaterThan(10);
      expect(/[\u2013\u2014]/.test(stage.contract + stage.faultBehavior)).toBe(false);
    }
    for (const sc of CINCH_SCENARIOS) {
      expect(sc.activeStages.length).toBeGreaterThanOrEqual(1);
      expect(sc.activeStages.every((id) => cinchIds.has(id))).toBe(true);
      expect(sc.summary).not.toContain("0 W GPU");
    }
    for (const sc of RAG_SCENARIOS) {
      expect(sc.activeStages.length).toBeGreaterThanOrEqual(1);
      expect(sc.activeStages.every((id) => ragIds.has(id))).toBe(true);
    }
    const refusal = RAG_SCENARIOS.find((s) => s.id === "nli-refusal");
    expect(refusal?.payload.threshold_required).toBe(0.7);
  });

  it("resolves WebGL tiers and diagnostics accurately", () => {
    expect(resolveEffectiveTier("auto", "high", false)).toBe("low");
    expect(resolveEffectiveTier("2d", "high", true)).toBe("low");
    expect(resolveEffectiveTier("balanced", "high", true)).toBe("mid");
    expect(resolveQualityReason("high", "Hardware WebGL2 ready", false, false)).toBe(
      "Manual High (AA + Shaders)"
    );
  });
});

describe("/api/query handler", () => {
  it("returns 400 on invalid JSON body, missing message, or oversized payload", async () => {
    const badJsonReq = new Request("http://localhost:3100/api/query", {
      method: "POST",
      body: "{not-valid-json",
    });
    expect((await POST(badJsonReq)).status).toBe(400);

    const emptyMsgReq = new Request("http://localhost:3100/api/query", {
      method: "POST",
      body: JSON.stringify({ message: "   " }),
    });
    expect((await POST(emptyMsgReq)).status).toBe(400);

    const hugeReq = new Request("http://localhost:3100/api/query", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.77" },
      body: JSON.stringify({ message: "a".repeat(2500) }),
    });
    expect((await POST(hugeReq)).status).toBe(400);
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

  it("streams SSE fallback gracefully when Gemini API returns HTTP 500", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-mock-key";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("upstream error", { status: 500 }));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const req = new Request("http://localhost:3100/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "x-forwarded-for": "198.51.100.99",
        },
        body: JSON.stringify({ message: "xyzzy unmatched custom prompt" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
      const text = await res.text();
      expect(text).toContain("event: meta");
      expect(text).toContain('"source":"fallback"');
      expect(errSpy).toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      errSpy.mockRestore();
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
    }
  });

  it("extracts exact /work/[slug] and FlyRank citations from generated text", () => {
    const multi = extractCitationsFromText(
      "Cinch pairs with MindStack and OFFBoarder, alongside work at FlyRank."
    );
    expect(multi.map((c) => c.href)).toContain("/work/cinch");
    expect(multi.map((c) => c.href)).toContain("/work/mindstack");
    expect(multi.map((c) => c.href)).toContain("/work/offboarder");
    expect(multi.map((c) => c.href)).toContain("/#about");

    expect(extractCitationsFromText("Nexus Researcher and ARES and MaSheba AI").map((c) => c.href)).toEqual([
      "/work/nexus-researcher",
      "/work/ares",
      "/work/masheba-ai",
    ]);

    expect(extractCitationsFromText("General engineering summary without specific slugs")).toEqual([
      { label: "Selected Work", href: "/#work" },
    ]);
  });

  it("emits extracted /work/[slug] citations in SSE event: done for Gemini stream responses", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-mock-key";

    const encoder = new TextEncoder();
    const geminiStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              candidates: [{ content: { parts: [{ text: "Compare Cinch and " }] } }],
            })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              candidates: [
                {
                  content: { parts: [{ text: "ARES promotion gates plus FlyRank billing." }] },
                  finishReason: "STOP",
                },
              ],
            })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(geminiStream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        })
      );

    try {
      const req = new Request("http://localhost:3100/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "x-forwarded-for": "198.51.100.105",
        },
        body: JSON.stringify({ message: "xyzzy compare custom deployment tradeoffs" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const sseText = await res.text();
      expect(sseText).toContain("event: done");
      const doneLine = sseText
        .split("\n\n")
        .find((block) => block.startsWith("event: done"));
      expect(doneLine).toBeDefined();
      const jsonPart = doneLine!.split("\n").find((l) => l.startsWith("data:"))!.slice(5).trim();
      const payload = JSON.parse(jsonPart) as {
        source: string;
        citations: Array<{ label: string; href: string }>;
      };
      expect(payload.source).toBe("gemini");
      expect(payload.citations.some((c) => c.href === "/work/cinch")).toBe(true);
      expect(payload.citations.some((c) => c.href === "/work/ares")).toBe(true);
      expect(payload.citations.some((c) => c.href === "/#about")).toBe(true);
    } finally {
      fetchSpy.mockRestore();
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
    }
  });

  it("emits exact /work/[slug] citations on non-SSE Gemini JSON responses", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-mock-key";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "MindStack hybrid retrieval pairs well with OFFBoarder RLS and MaSheba AI offline inference.",
                  },
                ],
              },
              finishReason: "STOP",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      const req = new Request("http://localhost:3100/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.106",
        },
        body: JSON.stringify({ message: "xyzzy compare deployment tradeoffs across workloads" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const payload = (await res.json()) as {
        source: string;
        citations: Array<{ label: string; href: string }>;
      };
      expect(payload.source).toBe("gemini");
      expect(payload.citations.map((c) => c.href)).toEqual([
        "/work/mindstack",
        "/work/offboarder",
        "/work/masheba-ai",
      ]);
    } finally {
      fetchSpy.mockRestore();
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
    }
  });
});

describe("architecture topology integrity & semantic classification", () => {
  it("validates unique stage IDs and valid connection endpoints on every project", () => {
    for (const project of projects) {
      const nodeIds = project.architecture.nodes.map((n) => n.id);
      const uniqueIds = new Set(nodeIds);
      expect(nodeIds.length).toBeGreaterThanOrEqual(5);
      expect(uniqueIds.size).toBe(nodeIds.length);

      for (const conn of project.architecture.connections) {
        expect(uniqueIds.has(conn.from)).toBe(true);
        expect(uniqueIds.has(conn.to)).toBe(true);
        expect(conn.from).not.toBe(conn.to);
        if ("label" in conn && typeof conn.label === "string") {
          expect(conn.label.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("classifies entry, guard, storage, and compute nodes without false positives", () => {
    expect(classifyNodeKind("circuit_breaker", 0)).toBe("entry");
    expect(classifyNodeKind("query", 0)).toBe("entry");
    expect(classifyNodeKind("query_gen", 1)).toBe("compute");
    expect(classifyNodeKind("gateway", 4)).toBe("compute");
    expect(classifyNodeKind("finops_gate", 1)).toBe("guard");
    expect(classifyNodeKind("gate", 4)).toBe("guard");
    expect(classifyNodeKind("guardrails", 2)).toBe("guard");
    expect(classifyNodeKind("semantic_cache", 3)).toBe("storage");
    expect(classifyNodeKind("db_rls", 2)).toBe("storage");
    expect(classifyNodeKind("golden", 2)).toBe("storage");
    expect(classifyNodeKind("vllm_engine", 5)).toBe("compute");
  });

  it("ensures portrait assets exist on disk and flagship deck slugs resolve cleanly", () => {
    const publicDir = path.resolve(process.cwd(), "public");
    expect(profile.portrait).toBe("/img/mehedi-portrait.jpg");
    expect(fs.existsSync(path.join(publicDir, profile.portrait.replace(/^\//, "")))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, profile.heroPortrait.replace(/^\//, "")))).toBe(true);

    for (const slug of ["cinch", "nexus-researcher", "ares", "mindstack"]) {
      const p = projects.find((item) => item.slug === slug);
      expect(p).toBeDefined();
      expect(p?.highlightMetrics[0]?.value.trim().length).toBeGreaterThan(0);
    }
  });
});
