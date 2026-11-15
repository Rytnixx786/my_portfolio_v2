import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  answerPortfolioQuery,
  extractCitationsFromText,
  matchPortfolioQuery,
} from "@/lib/query-engine";
import { CATEGORY_HUES } from "@/lib/palette";
import { resolveEffectiveTier, resolveQualityReason, detectMotionPreference } from "@/lib/device-tier";
import { classifyNodeKind } from "@/lib/architecture";
import {
  CHOREO,
  MOTION,
  completePendingViewTransition,
  computeEnvelopePhases,
  normalizeRoutePath,
  prefersReducedMotion,
  resolveMatchMediaConditions,
  runViewTransition,
  splitNumericMetricTokens,
} from "@/lib/motion";
import { deriveRender3DState } from "@/hooks/usePortfolioUtils";
import { executePortfolioScroll, NAV_SCROLL_OFFSET } from "@/components/chrome/LenisProvider";
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
    expect(resolveQualityReason("high", "Hardware WebGL2 ready", true, false)).toBe(
      "Manual High (AA + Shaders)"
    );
    expect(resolveQualityReason("balanced", "Hardware WebGL2 ready", true, false)).toBe(
      "Balanced WebGL"
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

describe("motion contract, ScrambleMetric numeric parsing, scroll-to-top, and 3D reduced motion", () => {
  it("exposes bounded MOTION tokens and prefersReducedMotion handles SSR and matchMedia", () => {
    expect(MOTION.stagger.bentoCap).toBeLessThanOrEqual(0.3);
    expect(MOTION.navScrollOffset).toBe(NAV_SCROLL_OFFSET);
    expect(MOTION.viewTransitionTimeoutMs).toBe(500);
    expect(MOTION.fontReadyTimeoutMs).toBe(250);

    // SSR (no window) -> false
    expect(prefersReducedMotion()).toBe(false);

    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
      }),
    });
    try {
      expect(prefersReducedMotion()).toBe(true);
      expect(detectMotionPreference()).toBe("reduced");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("runViewTransition falls back safely and completes pending transitions on timeout or commit", async () => {
    let navigated = 0;
    await runViewTransition(() => {
      navigated += 1;
    });
    expect(navigated).toBe(1);

    // When document.startViewTransition is available and waitForCommit is true
    vi.stubGlobal("document", {
      startViewTransition: (cb: () => Promise<void> | void) => {
        const updatePromise = Promise.resolve(cb());
        return { finished: updatePromise };
      },
    });
    try {
      let committed = false;
      const vtPromise = runViewTransition(
        () => {
          committed = true;
        },
        { waitForCommit: true, timeoutMs: 250 }
      );
      expect(committed).toBe(true);
      completePendingViewTransition();
      await vtPromise;

      // Timeout fallback resolves cleanly if commit callback never runs
      const timeoutPromise = runViewTransition(() => {}, {
        waitForCommit: true,
        timeoutMs: 15,
      });
      await timeoutPromise;
    } finally {
      completePendingViewTransition();
      vi.unstubAllGlobals();
    }

    // Synchronous throw in document.startViewTransition still invokes navigate() and does not reject
    vi.stubGlobal("document", {
      startViewTransition: () => {
        throw new Error("Transition aborted");
      },
    });
    try {
      let fallbackNav = 0;
      await expect(
        runViewTransition(
          () => {
            fallbackNav += 1;
          },
          { waitForCommit: true, timeoutMs: 50 }
        )
      ).resolves.toBeUndefined();
      expect(fallbackNav).toBe(1);
    } finally {
      completePendingViewTransition();
      vi.unstubAllGlobals();
    }

    expect(normalizeRoutePath("/work/cinch/")).toBe("/work/cinch");
    expect(normalizeRoutePath("/#work")).toBe("/");
    expect(normalizeRoutePath("/brief?ref=nav#top")).toBe("/brief");
  });

  it("splitNumericMetricTokens isolates numeric runs without garbling labels", () => {
    expect(splitNumericMetricTokens("")).toEqual([]);

    expect(splitNumericMetricTokens("10/15 Refusal (n=15)")).toEqual([
      { text: "10", isNumeric: true },
      { text: "/", isNumeric: false },
      { text: "15", isNumeric: true },
      { text: " Refusal (n=", isNumeric: false },
      { text: "15", isNumeric: true },
      { text: ")", isNumeric: false },
    ]);

    expect(splitNumericMetricTokens("SoD Enforced")).toEqual([
      { text: "SoD Enforced", isNumeric: false },
    ]);

    expect(splitNumericMetricTokens("4.12ms")).toEqual([
      { text: "4.12", isNumeric: true },
      { text: "ms", isNumeric: false },
    ]);

    expect(splitNumericMetricTokens("331.0 tok/s")).toEqual([
      { text: "331.0", isNumeric: true },
      { text: " tok/s", isNumeric: false },
    ]);

    expect(splitNumericMetricTokens("SHA-256")).toEqual([
      { text: "SHA-", isNumeric: false },
      { text: "256", isNumeric: true },
    ]);
  });

  it("executePortfolioScroll handles numeric 0 (Return to top) for Lenis and reduced motion", () => {
    const lenisScrollTo = vi.fn();
    const lenisStart = vi.fn();
    const scrollToWindow = vi.fn();

    const lenisOk = executePortfolioScroll(0, {
      lenis: { start: lenisStart, scrollTo: lenisScrollTo },
      reduced: false,
      getElementById: () => null,
      getElementTop: () => 0,
      scrollToWindow,
    });
    expect(lenisOk).toBe(true);
    expect(lenisStart).toHaveBeenCalledTimes(1);
    expect(lenisScrollTo).toHaveBeenCalledWith(0, {
      duration: MOTION.durations.scroll,
    });
    expect(scrollToWindow).not.toHaveBeenCalled();

    // Negative clamp & reduced-motion native window.scrollTo fallback
    const nativeOk = executePortfolioScroll(-40, {
      lenis: { start: lenisStart, scrollTo: lenisScrollTo },
      reduced: true,
      getElementById: () => null,
      getElementTop: () => 0,
      scrollToWindow,
    });
    expect(nativeOk).toBe(true);
    expect(scrollToWindow).toHaveBeenCalledWith({ top: 0, behavior: "auto" });

    // Missing selector returns false safely
    expect(
      executePortfolioScroll("#nonexistent", {
        lenis: null,
        reduced: false,
        getElementById: () => null,
        getElementTop: () => 0,
        scrollToWindow,
      })
    ).toBe(false);
  });

  it("deriveRender3DState keeps interactive 3D live under reduced motion while honoring low tier and context loss", () => {
    const reducedHigh = deriveRender3DState({
      hasMounted: true,
      webglSupported: true,
      effectiveTier: "high",
      contextLost: false,
      reducedMotion: true,
    });
    expect(reducedHigh.canRender3D).toBe(true);
    expect(reducedHigh.isStaticPose).toBe(false);
    expect(reducedHigh.dprCap).toBe(1.75);

    const reducedMid = deriveRender3DState({
      hasMounted: true,
      webglSupported: true,
      effectiveTier: "mid",
      contextLost: false,
      reducedMotion: true,
    });
    expect(reducedMid.canRender3D).toBe(true);
    expect(reducedMid.isStaticPose).toBe(false);
    expect(reducedMid.dprCap).toBe(1.25);

    const reducedLow = deriveRender3DState({
      hasMounted: true,
      webglSupported: true,
      effectiveTier: "low",
      contextLost: false,
      reducedMotion: true,
    });
    expect(reducedLow.canRender3D).toBe(false);
    expect(reducedLow.isStaticPose).toBe(false);

    const lostContext = deriveRender3DState({
      hasMounted: true,
      webglSupported: true,
      effectiveTier: "high",
      contextLost: true,
      reducedMotion: false,
    });
    expect(lostContext.canRender3D).toBe(false);
    expect(lostContext.isStaticPose).toBe(false);

    // Effective tier resolver under reduced motion remains "high" unless hardware/override is low or WebGL unsupported
    expect(resolveEffectiveTier("auto", "high", true)).toBe("high");
    expect(resolveEffectiveTier("2d", "high", true)).toBe("low");
    expect(resolveEffectiveTier("auto", "low", true)).toBe("low");
    expect(resolveEffectiveTier("high", "high", false)).toBe("low");
  });

  it("CHOREO envelope phases keep reading zone opaque (>= 35% vh exit threshold, floor >= 0.25) and matchMedia conditions map deterministically", () => {
    expect(CHOREO.envelope.exitOpacity).toBeGreaterThanOrEqual(0.25);

    const vh = 900;
    for (const h of [90, 280, 480, 760]) {
      const { enterDur, holdDur, exitDur, exitStart } = computeEnvelopePhases(vh, h);
      expect(enterDur + holdDur + exitDur).toBeCloseTo(1, 5);
      expect(exitStart).toBeGreaterThanOrEqual(CHOREO.envelope.exitFrom);
      // Verify bottom y coordinate when exit begins is never above 35% viewport height
      const totalTravel = 0.84 * vh + h;
      const bottomAtExitStart = 0.08 * vh + (1 - exitStart) * totalTravel;
      expect(bottomAtExitStart).toBeLessThanOrEqual(0.355 * vh);
    }

    expect(
      resolveMatchMediaConditions({ width: 1440, finePointer: true, appReduced: false })
    ).toEqual({ desktopFine: true, mobile: false, appReduced: false });
    expect(
      resolveMatchMediaConditions({ width: 1440, finePointer: false, appReduced: false })
    ).toEqual({ desktopFine: false, mobile: true, appReduced: false });
    expect(
      resolveMatchMediaConditions({ width: 375, finePointer: true, appReduced: false })
    ).toEqual({ desktopFine: false, mobile: true, appReduced: false });
    expect(
      resolveMatchMediaConditions({ width: 1440, finePointer: true, appReduced: true })
    ).toEqual({ desktopFine: false, mobile: false, appReduced: true });
  });
});
