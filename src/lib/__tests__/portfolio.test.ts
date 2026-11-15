import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  answerPortfolioQuery,
  extractCitationsFromText,
  matchPortfolioQuery,
} from "@/lib/query-engine";
import { CATEGORY_HUES } from "@/lib/palette";
import {
  CANVAS_RESIZE_CONFIG,
  resolveEffectiveTier,
  resolveMaxWebGLSlots,
  resolveQualityReason,
  detectMotionPreference,
  shouldShowViewport2DFallback,
} from "@/lib/device-tier";
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
import { createWebGLSlotStore } from "@/components/canvas/WebGLContextProvider";
import {
  computeReticleCornerPositions,
  RETICLE_CORNER_SIZE,
} from "@/components/chrome/CustomCursor";
import { executePortfolioScroll, NAV_SCROLL_OFFSET } from "@/components/chrome/LenisProvider";
import { projects } from "@/data/projects";
import { profile } from "@/data/site";
import {
  CINCH_SCENARIOS,
  CINCH_STAGES,
  computeTraceSpanTimeline,
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

  it("prevents scroll-debounce starvation and black #0D1117 underlays across WebGL slots", () => {
    // R3F resize config must disable scroll debounce so ResizeObserver never stalls at 0x0 during slow scroll
    expect(CANVAS_RESIZE_CONFIG).toEqual({ scroll: false, debounce: 0 });
    expect(resolveMaxWebGLSlots("high")).toBe(6);
    expect(resolveMaxWebGLSlots("mid")).toBe(3);
    expect(resolveMaxWebGLSlots("low")).toBe(0);

    // Pre-mount SSR guard keeps hydration deterministic
    expect(
      shouldShowViewport2DFallback({
        hasMounted: false,
        canRender3D: true,
        hasLoadingFallback: false,
        hasSlot: true,
        isPoolSaturated: false,
        slotWaitElapsed: false,
      })
    ).toBe(false);

    // Vector-SVG scenes (no custom loadingFallback) keep 2D underlay mounted while WebGL initializes or waits
    expect(
      shouldShowViewport2DFallback({
        hasMounted: true,
        canRender3D: true,
        hasLoadingFallback: false,
        hasSlot: true,
        isPoolSaturated: false,
        slotWaitElapsed: false,
      })
    ).toBe(true);

    // Hero (hasLoadingFallback=true) avoids duplicate portrait loads while actively initializing
    expect(
      shouldShowViewport2DFallback({
        hasMounted: true,
        canRender3D: true,
        hasLoadingFallback: true,
        hasSlot: true,
        isPoolSaturated: false,
        slotWaitElapsed: false,
      })
    ).toBe(false);

    // Hero still falls back to 2D if saturated GPU pool refuses a slot past grace delay
    expect(
      shouldShowViewport2DFallback({
        hasMounted: true,
        canRender3D: true,
        hasLoadingFallback: true,
        hasSlot: false,
        isPoolSaturated: true,
        slotWaitElapsed: true,
      })
    ).toBe(true);

    const localCanvasSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/canvas/LocalCanvasInner.tsx"),
      "utf8"
    );
    expect(localCanvasSrc).toContain("resize={CANVAS_RESIZE_CONFIG}");
  });

  it("keeps cursor visible above Top-Layer CommandPalette dialog and prevents Simulator clip cropping", () => {
    const cursorSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/chrome/CustomCursor.tsx"),
      "utf8"
    );
    const paletteSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/chrome/CommandPalette.tsx"),
      "utf8"
    );
    const cssSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8"
    );
    const simSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/SystemsPlayground.tsx"),
      "utf8"
    );

    expect(cursorSrc).toContain('popover="manual"');
    expect(cursorSrc).toContain("showPopover");
    expect(cursorSrc).toContain("capture: true");
    expect(cursorSrc).toContain("button:disabled");
    expect(paletteSrc).toContain("portfolio:top-layer-raise");
    expect(cssSrc).toContain("dialog[open]");
    expect(cssSrc).toContain("cursor: not-allowed !important");
    expect(simSrc).not.toContain("inset(8% 5%");
  });

  it("never dismisses 2D fallback blindly before a sized WebGL frame renders and avoids blank loading placeholders", () => {
    const localCanvasSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/canvas/LocalCanvasInner.tsx"),
      "utf8"
    );
    const previewPlateSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/ProjectPreviewPlate.tsx"),
      "utf8"
    );
    const archDiagramSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/case-study/ArchitectureDiagram.tsx"),
      "utf8"
    );
    const archDiagram3DSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/case-study/ArchitectureDiagram3D.tsx"),
      "utf8"
    );
    const viewportCanvasSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/canvas/ViewportCanvas.tsx"),
      "utf8"
    );
    const stackRackSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/canvas/StackRack3D.tsx"),
      "utf8"
    );
    const globeSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/canvas/TelemetryGlobe3D.tsx"),
      "utf8"
    );
    const heroCoreSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/canvas/HeroOrbitalCore3D.tsx"),
      "utf8"
    );

    expect(localCanvasSrc).toContain("gl.domElement.width <= 0");
    expect(localCanvasSrc).not.toContain("safetyTimerRef");
    expect(previewPlateSrc).not.toContain("Loading interactive 3D topology...");
    expect(archDiagramSrc).not.toContain("Loading spatial 3D topology...");
    expect(archDiagram3DSrc).not.toContain("Loading spatial 3D topology...");
    expect(viewportCanvasSrc).toContain("opacity: canvasReady ? 0 : 1");
    expect(stackRackSrc).toContain("distScale");
    expect(stackRackSrc).toContain("max-w-[calc(100%-184px)]");
    expect(globeSrc).toContain("max-w-[calc(100%-180px)]");
    expect(heroCoreSrc).toContain("max-w-[calc(100%-182px)]");
  });

  it("isolates WebGL slot notifications per subscriber and budgets continuous render loops during scroll", () => {
    vi.useFakeTimers();
    const store = createWebGLSlotStore(6);
    try {
      const heroCalls = vi.fn();
      const work1Calls = vi.fn();
      const unsubHero = store.subscribeSlot("hero", heroCalls);
      const unsubWork1 = store.subscribeSlot("work-1", work1Calls);

      store.requestSlot("hero", true);
      expect(heroCalls).toHaveBeenCalledTimes(1);
      expect(work1Calls).toHaveBeenCalledTimes(0);

      store.requestSlot("work-1", true);
      expect(heroCalls).toHaveBeenCalledTimes(1);
      expect(work1Calls).toHaveBeenCalledTimes(1);

      store.requestSlot("work-2", false);
      store.requestSlot("work-3", false);
      store.requestSlot("sim", false);
      store.requestSlot("stack", false);
      // Unrelated subscriber still stays completely quiet while pool fills cleanly to 6
      expect(store.getActiveSlotCount()).toBe(6);
      expect(heroCalls).toHaveBeenCalledTimes(1);
      expect(work1Calls).toHaveBeenCalledTimes(1);

      // Pinned slots stay active even if preloads exceed 6
      store.requestSlot("globe", false);
      expect((store.getSlotMaskSnapshot("hero") & 2) !== 0).toBe(true);
      expect((store.getSlotMaskSnapshot("work-1") & 2) !== 0).toBe(true);

      // Frame budgeting allows <= 2 continuous in-view loops at rest, <= 1 during scroll bursts
      store.setSlotInView("hero", true);
      store.setSlotInView("work-1", true);
      store.setSlotInView("work-2", true);
      const loopCountAtRest = ["hero", "work-1", "work-2"].filter(
        (id) => (store.getSlotMaskSnapshot(id) & 4) !== 0
      ).length;
      expect(loopCountAtRest).toBe(2);

      store.markScrolling(140);
      const loopCountWhileScrolling = ["hero", "work-1", "work-2"].filter(
        (id) => (store.getSlotMaskSnapshot(id) & 4) !== 0
      ).length;
      expect(loopCountWhileScrolling).toBe(1);

      vi.advanceTimersByTime(150);
      const loopCountAfterSettle = ["hero", "work-1", "work-2"].filter(
        (id) => (store.getSlotMaskSnapshot(id) & 4) !== 0
      ).length;
      expect(loopCountAfterSettle).toBe(2);

      // Interacting with paused in-view slot immediately promotes its loop budget
      store.focusSlotLoop("hero");
      expect((store.getSlotMaskSnapshot("hero") & 4) !== 0).toBe(true);

      unsubHero();
      unsubWork1();
    } finally {
      store.dispose();
      vi.useRealTimers();
    }
  });

  it("enforces traceSpans integrity and recorded timing sums across all simulator scenarios", () => {
    for (const s of [...CINCH_SCENARIOS, ...RAG_SCENARIOS]) {
      expect(s.traceSpans.length).toBe(s.activeStages.length);
      expect(s.traceSpans.map((sp) => sp.stageId)).toEqual(s.activeStages);
      const sumMs = s.traceSpans.reduce((acc, sp) => acc + sp.durationMs, 0);
      expect(sumMs).toBeCloseTo(s.baseLatencyMs, 2);
      for (const sp of s.traceSpans) {
        expect(sp.durationMs).toBeGreaterThan(0);
        expect(sp.metricDelta.length).toBeGreaterThan(0);
        expect(sp.logLine.length).toBeGreaterThan(10);
        expect(sp.logLine).not.toMatch(/[\u2013\u2014]/);
        expect(sp.metricDelta).not.toMatch(/[\u2013\u2014]/);
      }
    }

    const cacheHit = CINCH_SCENARIOS.find((s) => s.id === "cache-hit");
    expect(cacheHit?.traceSpans.map((sp) => sp.durationMs)).toEqual([0.18, 0.41, 0.94, 2.59]);

    // Terminal bypassed/micro spans must clamp offsetPct inside [0, 100 - widthPct] so SKIP bars never clip past track edges
    const bypassedLast = computeTraceSpanTimeline([
      { stageId: "breaker", durationMs: 0.18, status: "PASS", metricDelta: "ok", logLine: "ok log line here" },
      { stageId: "finops", durationMs: 0.41, status: "PASS", metricDelta: "ok", logLine: "ok log line here" },
      { stageId: "pii", durationMs: 0.94, status: "PASS", metricDelta: "ok", logLine: "ok log line here" },
      { stageId: "onnx", durationMs: 0, status: "SKIP", metricDelta: "Cache off", logLine: "bypassed onnx cache" },
    ]);
    expect(bypassedLast.recordedTotalMs).toBeCloseTo(1.53, 4);
    const skipRow = bypassedLast.spanTimeline[3];
    expect(skipRow.widthPct).toBe(4);
    expect(skipRow.offsetPct).toBe(96);
    expect(skipRow.offsetPct + skipRow.widthPct).toBeLessThanOrEqual(100);

    for (const s of [...CINCH_SCENARIOS, ...RAG_SCENARIOS]) {
      const { spanTimeline } = computeTraceSpanTimeline(s.traceSpans);
      for (const row of spanTimeline) {
        expect(row.offsetPct).toBeGreaterThanOrEqual(0);
        expect(row.widthPct).toBeGreaterThanOrEqual(4);
        expect(row.offsetPct + row.widthPct).toBeLessThanOrEqual(100.001);
      }
    }
  });

  it("guards scroll compositor fast-path, GPU cursor transforms, batched Hero lattice, and Safari backdrop parity", () => {
    const lenisSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/chrome/LenisProvider.tsx"),
      "utf8"
    );
    const cssSrc = fs.readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8"
    );
    const heroSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/hero/HeroEditorial.tsx"),
      "utf8"
    );
    const cursorSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/chrome/CustomCursor.tsx"),
      "utf8"
    );
    const latticeSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/hero/HeroCursorField.tsx"),
      "utf8"
    );
    const simSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/sections/SystemsPlayground.tsx"),
      "utf8"
    );
    const viewportCanvasSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/canvas/ViewportCanvas.tsx"),
      "utf8"
    );
    const motionSrc = fs.readFileSync(
      path.join(process.cwd(), "src/lib/motion.ts"),
      "utf8"
    );

    expect(lenisSrc).not.toContain("--scroll-velocity-abs");
    expect(lenisSrc).not.toContain("--scroll-velocity-signed");
    expect(lenisSrc).toContain("subscribeScrollRatio");
    expect(heroSrc).not.toContain('filter: "blur(');
    expect(cssSrc).toContain("-webkit-backdrop-filter: blur(12px)");
    expect(cssSrc).not.toContain("rotateX(var(--card-rx");
    expect(cursorSrc).not.toContain("scale3d(");
    expect(cursorSrc).toContain("translate3d(");
    expect(cursorSrc).toContain("tlRef");
    expect(cursorSrc).toContain("trRef");
    expect(cursorSrc).toContain("blRef");
    expect(cursorSrc).toContain("brRef");
    expect(cursorSrc).toContain("h-[9px] w-[9px]");
    expect(cursorSrc).toContain("border-t-[1.5px]");
    expect(cursorSrc).toContain("border-l-[1.5px]");
    expect(cursorSrc).toContain("border-r-[1.5px]");
    expect(cursorSrc).toContain("border-b-[1.5px]");
    expect(cursorSrc).not.toContain(".style.width =");
    expect(cursorSrc).not.toContain(".style.height =");
    expect(cursorSrc).not.toMatch(/\.style\.(width|height)\s*=/);
    expect(cursorSrc).toContain("cachedSnapEl");
    expect(cursorSrc).toContain("isConnected");
    expect(cursorSrc).toContain('"pointercancel"');
    expect(cursorSrc).toContain('"blur"');
    expect(cursorSrc).toContain("isDialogOpen");
    expect(cursorSrc).toContain("pointerUpTimers");
    expect(cursorSrc).toContain('"touchstart"');
    expect(latticeSrc).toContain("Path2D");
    expect(latticeSrc).toContain('clip("evenodd")');
    expect(latticeSrc).toContain('"touchstart"');
    expect(simSrc).toContain("Replay Trace");
    expect(simSrc).toContain("Live Step");
    expect(simSrc).not.toContain("pin: true");
    expect(viewportCanvasSrc).toContain("rootMargin: \"900px 0px\"");
    expect(motionSrc).toContain("(any-pointer: fine)");
  });

  it("positions 4 independent 9x9 cursor corner brackets symmetrically without non-uniform scaling", () => {
    expect(RETICLE_CORNER_SIZE).toBe(9);

    // Wide pill snap (e.g. "Explore Work" 168x48 + 10x8 reticle padding = 178x56)
    const wide = computeReticleCornerPositions(500, 300, 178, 56);
    expect(wide.left).toBe(411);
    expect(wide.right + RETICLE_CORNER_SIZE).toBe(589);
    expect(wide.right + RETICLE_CORNER_SIZE - wide.left).toBe(178);
    expect(wide.top).toBe(272);
    expect(wide.bottom + RETICLE_CORNER_SIZE).toBe(328);
    expect(wide.bottom + RETICLE_CORNER_SIZE - wide.top).toBe(56);

    // Press compression narrows corner offsets symmetrically
    const pressedWide = computeReticleCornerPositions(500, 300, 178 * 0.84, 56 * 0.84);
    expect(pressedWide.left).toBeGreaterThan(wide.left);
    expect(pressedWide.right).toBeLessThan(wide.right);
    expect(pressedWide.top).toBeGreaterThan(wide.top);
    expect(pressedWide.bottom).toBeLessThan(wide.bottom);
    expect((pressedWide.left + pressedWide.right + RETICLE_CORNER_SIZE) * 0.5).toBeCloseTo(500, 4);
    expect((pressedWide.top + pressedWide.bottom + RETICLE_CORNER_SIZE) * 0.5).toBeCloseTo(300, 4);

    // Compact hero state (14x14) and tiny/zero degenerate dimensions never invert corners
    const hero = computeReticleCornerPositions(240, 180, 14, 14);
    expect(hero.right).toBeGreaterThanOrEqual(hero.left);
    expect(hero.bottom).toBeGreaterThanOrEqual(hero.top);
    expect(hero.right + RETICLE_CORNER_SIZE - hero.left).toBe(14);

    const tiny = computeReticleCornerPositions(100, 100, 0, -5);
    expect(tiny.left).toBe(95.5);
    expect(tiny.right).toBe(95.5);
    expect(tiny.top).toBe(95.5);
    expect(tiny.bottom).toBe(95.5);
  });
});
