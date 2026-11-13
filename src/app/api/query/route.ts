import { NextResponse } from "next/server";
import { answerPortfolioQuery, fallbackPortfolioAnswer } from "@/lib/query-engine";
import { profile } from "@/data/site";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

export async function POST(request: Request) {
  let message = "";

  try {
    const body = (await request.json()) as { message?: unknown };
    if (!body?.message || typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }
    message = body.message.trim().slice(0, 400);

    const local = answerPortfolioQuery(message);
    if (local) {
      return NextResponse.json({ text: local, source: "local" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        text: fallbackPortfolioAnswer(message),
        source: "local",
      });
    }

    const systemInstruction = `You are the concise terminal assistant for ${profile.name} (${profile.role}, ${profile.location}, BRAC University B.Sc. CSE 2026).
Thesis: "${profile.thesis}"
Key facts:
- FlyRank AI & Back End Engineering Intern (June 2026): multi-tenant usage metering, tiered pricing, Stripe webhook reconciliation.
- Cinch: 14-stage async FastAPI gateway + vLLM AWQ Marlin INT4, 10.86x speedup (331 tok/s), 4.12ms ONNX semantic cache (0W GPU), 45ms circuit breaker, 195 tests.
- Nexus Researcher: 8-node LangGraph multi-agent workflow, PostgreSQL checkpointer, SSE streaming, 91% refusal accuracy, 8.05 req/s, 122 backend tests.
- ARES: ML model regression & promotion control plane, 92%+ pytest coverage, commit-SHA idempotent evals, Prometheus + Streamlit.
- MindStack: Hybrid BM25 + ChromaDB RRF (k=60) + NLI gate, 95% groundedness, 66.7% refusal accuracy.
- OFFBoarder: Multi-tenant offboarding, Postgres RLS, Segregation of Duties, SHA-256 chained audit ledger.
- MaSheba AI: Offline-first Bangla maternal health app, SQLite outbox sync, ONNX XGBoost triage.
- Contact: ${profile.email}, GitHub ${profile.github}, LinkedIn ${profile.linkedin}.
Answer in 1-3 crisp, complete sentences strictly grounded in these facts.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        text: fallbackPortfolioAnswer(message),
        source: "fallback",
      });
    }

    const data = (await res.json()) as GeminiResponse;
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!text) {
      return NextResponse.json({
        text: fallbackPortfolioAnswer(message),
        source: "fallback",
      });
    }

    return NextResponse.json({ text, source: "gemini" });
  } catch {
    return NextResponse.json({
      text: fallbackPortfolioAnswer(message),
      source: "fallback",
    });
  }
}

