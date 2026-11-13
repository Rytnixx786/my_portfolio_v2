"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ChartBar, Terminal } from "@phosphor-icons/react";
import { experience, lab, measurementProtocol } from "@/data/site";
import { SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger);

export function ExperienceSection() {
  const [activeLabIdx, setActiveLabIdx] = useState(0);
  const activeLab = lab[activeLabIdx];

  const pinScopeRef = useRef<HTMLDivElement>(null);
  const dialRingRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const scope = pinScopeRef.current;
    const ring = dialRingRef.current;
    if (!scope || !ring) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.to(ring, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: scope,
          start: "top 80%",
          end: "bottom 60%",
          scrub: 0.4,
        },
      });
    }, scope);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="experience"
      className="border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        {/* Track Record + SVG Chronology Dial */}
        <div ref={pinScopeRef} className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#7DD3FC]">
                <span>Track Record</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(2.3rem,4.5vw,3.8rem)] font-bold uppercase leading-[0.94] tracking-[-0.02em] text-[#E6EDF3]">
                EXPERIENCE &amp;{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  training.
                </span>
              </h2>
              <p className="mt-4 max-w-sm font-sans text-base leading-relaxed text-[#9DA7B3]">
                Production metering at FlyRank paired with systems engineering at BRAC University.
              </p>

              {/* Lightweight Scroll-Synchronized SVG Chronology Gauge */}
              <div className="mt-6 inline-flex items-center gap-4 rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] px-4 py-3">
                <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90" aria-hidden="true">
                  <circle
                    cx="22"
                    cy="22"
                    r="17"
                    fill="none"
                    stroke="rgba(240,246,252,0.12)"
                    strokeWidth="3"
                  />
                  <circle
                    ref={dialRingRef}
                    cx="22"
                    cy="22"
                    r="17"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={106.8}
                    strokeDashoffset={74}
                  />
                </svg>
                <div className="font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
                  <p className="font-semibold text-[#E6EDF3]">Timeline Progress</p>
                  <p className="mt-0.5 text-[#38BDF8]">2022 to 2026</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            {experience.map((item) => (
              <div key={item.org} className="double-bezel-outer">
                <div className="double-bezel-core p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                      {item.period} · {item.focus}
                    </span>
                    {"href" in item && item.href && (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-[#9DA7B3] hover:text-[#38BDF8]"
                      >
                        <span>Repo</span>
                        <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-[#E6EDF3] sm:text-3xl">
                    {item.role} · <span className="text-[#38BDF8]">{item.org}</span>
                  </h3>
                  <p className="mt-3 max-w-[62ch] font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                    {item.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] px-3 py-1 font-mono text-xs text-[#9DA7B3]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Concise Verification Protocol (Replaces redundant Evidence Ledger Matrix) */}
        <SectionReveal className="mt-16 border-t border-[rgba(240,246,252,0.08)] pt-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                <ChartBar className="h-4 w-4" weight="regular" aria-hidden="true" />
                <span>How I Measure</span>
              </div>
              <h3 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                Verification Methodology
              </h3>
            </div>
            <p className="max-w-md font-sans text-sm text-[#9DA7B3]">
              Every metric on this site links directly to a baseline control, CI suite, or fault
              injection script.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
            {measurementProtocol.map((block) => (
              <div
                key={block.step}
                className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-5 sm:p-6"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[#38BDF8]">{block.step}</span>
                  <span className="text-[#10B981]">{block.metric}</span>
                </div>
                <h4 className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                  {block.title}
                </h4>
                <p className="mt-2 font-sans text-sm leading-relaxed text-[#9DA7B3]">
                  {block.detail}
                </p>
              </div>
            ))}
          </div>
        </SectionReveal>

        {/* Systems & Research Archive Tabs */}
        <SectionReveal className="mt-16 border-t border-[rgba(240,246,252,0.08)] pt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
              <Terminal className="h-4 w-4" weight="regular" aria-hidden="true" />
              <span>Kernel &amp; Clinical Research Builds</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div
              role="tablist"
              aria-label="Additional systems and kernel builds"
              className="flex flex-wrap gap-2 lg:col-span-7"
            >
              {lab.map((entry, idx) => {
                const selected = idx === activeLabIdx;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveLabIdx(idx)}
                    className={`min-h-[44px] rounded-xl border px-4 py-2 text-left font-mono text-xs transition-colors ${
                      selected
                        ? "border-[#38BDF8] bg-[#38BDF8]/12 font-semibold text-[#E6EDF3]"
                        : "border-[rgba(240,246,252,0.08)] bg-[#161B22] text-[#9DA7B3] hover:text-[#E6EDF3]"
                    }`}
                  >
                    <span className="block text-[#E6EDF3]">{entry.name}</span>
                    <span className="mt-0.5 block text-[#8B949E]">{entry.domain}</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#161B22] p-5 lg:col-span-5">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#38BDF8]">{activeLab.domain}</span>
                <span className="text-[#8B949E]">{activeLab.stack}</span>
              </div>
              <h4 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                {activeLab.name}
              </h4>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#9DA7B3]">
                {activeLab.note}
              </p>
              {"href" in activeLab && activeLab.href && (
                <a
                  href={activeLab.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#38BDF8] hover:text-[#7DD3FC]"
                >
                  <span>Inspect repository</span>
                  <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
