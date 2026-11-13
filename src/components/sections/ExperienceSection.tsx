"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ChartBar, Terminal } from "@phosphor-icons/react";
import { evidence, experience, lab } from "@/data/site";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";
import { ChronologyGyro3D } from "@/components/canvas/ChronologyGyro3D";
import { SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger);

export function ExperienceSection() {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const [activeLabIdx, setActiveLabIdx] = useState(0);
  const activeLab = lab[activeLabIdx];

  const pinScopeRef = useRef<HTMLDivElement>(null);
  const pinTargetRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const showGyro = hasMounted && webglSupported && effectiveTier !== "low";

  useEffect(() => {
    const scope = pinScopeRef.current;
    const target = pinTargetRef.current;
    if (!scope || !target) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const trigger = ScrollTrigger.create({
        trigger: scope,
        pin: target,
        start: "top 108px",
        end: "bottom 75%",
        pinSpacing: false,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
      });
      return () => trigger.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      id="experience"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        {/* Part 1: Scroll-Pinned Experience & Training */}
        <div
          ref={pinScopeRef}
          className="grid grid-cols-1 gap-12 lg:grid-cols-12"
        >
          <div className="lg:col-span-4">
            <div ref={pinTargetRef}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7DD3FC]">
                <span>Track Record</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,4.8vw,4rem)] font-bold uppercase leading-[0.94] tracking-[-0.02em] text-[#E6EDF3]">
                EXPERIENCE &amp;{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  training.
                </span>
              </h2>
              <p className="mt-4 max-w-sm font-sans text-base leading-relaxed text-[#8B949E]">
                Production metering pipelines at FlyRank, independent end-to-end AI
                infrastructure, and systems-level CS foundations at BRAC University.
              </p>

              {showGyro && (
                <div className="mt-6 hidden items-center gap-4 rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/75 px-4 py-3 lg:inline-flex">
                  <ChronologyGyro3D progressRef={scrollProgressRef} />
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E]">
                    <p className="font-semibold text-[#E6EDF3]">Scroll Telemetry</p>
                    <p className="mt-1 text-[#38BDF8]">2022 → 2026</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <ol className="relative border-l border-[rgba(240,246,252,0.12)] pl-6 sm:pl-10">
              {experience.map((entry, idx) => (
                <li
                  key={entry.org}
                  className={`relative ${
                    idx === experience.length - 1 ? "pb-2" : "pb-12"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[29px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#0D1117] ring-1 sm:-left-[45px] ${
                      idx === 0
                        ? "bg-[#38BDF8] ring-[#38BDF8]/50"
                        : "bg-[#8B949E] ring-[rgba(240,246,252,0.2)]"
                    }`}
                  />

                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[rgba(240,246,252,0.08)] pb-2.5">
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#38BDF8]">
                      {entry.period}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E7681]">
                      {entry.focus}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                      {entry.org}
                    </h3>
                    <span className="font-sans text-base font-medium text-[#8B949E]">
                      — {entry.role}
                    </span>
                  </div>

                  <p className="mt-3 max-w-[65ch] font-sans text-base leading-relaxed text-[#8B949E]">
                    {entry.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {entry.stack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3 py-1 font-mono text-[11px] text-[#8B949E]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {"href" in entry && entry.href && (
                      <a
                        href={entry.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 py-1 pl-3.5 pr-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#7DD3FC] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#38BDF8] hover:text-[#0D1117]"
                      >
                        <span>Repository</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0D1117]/40 text-[#38BDF8] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#0D1117]/20 group-hover:text-[#0D1117]">
                          <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                        </span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Part 2: Verified Benchmark Proof Points */}
        <SectionReveal>
          <div className="mt-20 border-t border-[rgba(240,246,252,0.08)] pt-16">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#38BDF8]">
                  <ChartBar className="h-4 w-4" weight="regular" aria-hidden="true" />
                  <span>MEASURED BENCHMARKS</span>
                </div>
                <h3 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3] sm:text-4xl">
                  VERIFIED PROOF POINTS
                </h3>
              </div>
              <p className="max-w-md font-sans text-sm leading-relaxed text-[#8B949E]">
                Every headline metric links directly to its proving case study,
                baseline comparison, and test suite.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              {evidence.map((item) => (
                <Link
                  key={`${item.project}-${item.label}`}
                  href={item.href}
                  className="double-bezel-outer group block transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/45"
                >
                  <div className="double-bezel-core flex h-full flex-col justify-between p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
                          <span>{item.project}</span>
                        </span>
                        <div className="mt-2 flex items-baseline gap-1 font-display text-4xl font-bold tracking-tight text-[#E6EDF3] tabular-nums sm:text-5xl">
                          <span>{item.value}</span>
                          <span className="text-2xl text-[#38BDF8]">
                            {item.unit}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-base font-medium text-[#E6EDF3]">
                          {item.label}
                        </p>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#1C222B] text-[#E6EDF3] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-[#38BDF8] group-hover:bg-[#38BDF8] group-hover:text-[#0D1117]">
                        <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-1.5 border-t border-[rgba(240,246,252,0.08)] pt-4 font-mono text-xs sm:grid-cols-2">
                      <p className="text-[#6E7681]">
                        From: <span className="text-[#8B949E]">{item.from}</span>
                      </p>
                      <p className="text-[#6E7681]">
                        To: <span className="font-medium text-[#E6EDF3]">{item.to}</span>
                      </p>
                      <p className="pt-1 font-sans text-xs text-[#8B949E] sm:col-span-2">
                        {item.context}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Part 3: Compact Lab & Kernel Archive */}
          <div className="mt-20 border-t border-[rgba(240,246,252,0.08)] pt-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#38BDF8]">
                  <Terminal className="h-4 w-4" weight="regular" aria-hidden="true" />
                  <span>SYSTEMS &amp; KERNEL ARCHIVE</span>
                </div>
                <h3 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3] sm:text-4xl">
                  LAB &amp;{" "}
                  <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                    kernel work.
                  </span>
                </h3>
                <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-[#8B949E]">
                  Focused systems builds beyond the six flagship case studies—medical
                  volumetric imaging, C file systems, RISC-V scheduling, and billing engines.
                </p>

                <div className="double-bezel-outer mt-6">
                  <div className="double-bezel-core-muted p-5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#38BDF8]">
                      <span>{activeLab.domain}</span>
                      <span className="text-[#8B949E]">{activeLab.stack}</span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                      {activeLab.name}
                    </p>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-[#8B949E]">
                      {activeLab.note}
                    </p>

                    {"href" in activeLab && activeLab.href && (
                      <a
                        href={activeLab.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-4 inline-flex items-center gap-2 rounded-full bg-[#38BDF8] py-1.5 pl-4 pr-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0D1117] transition-all duration-300 hover:bg-[#7DD3FC]"
                      >
                        <span>Inspect Repo</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0D1117]/15">
                          <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <ul className="divide-y divide-[rgba(240,246,252,0.08)] border-y border-[rgba(240,246,252,0.08)]">
                  {lab.map((item, idx) => {
                    const isSelected = activeLabIdx === idx;
                    return (
                      <li key={item.name}>
                        <div
                          onMouseEnter={() => setActiveLabIdx(idx)}
                          className={`flex flex-col justify-between gap-2 px-3 py-4 transition-colors duration-300 sm:flex-row sm:items-center sm:px-4 ${
                            isSelected
                              ? "bg-[#161B22]"
                              : "hover:bg-[#161B22]/60"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveLabIdx(idx)}
                            onFocus={() => setActiveLabIdx(idx)}
                            className="flex min-w-0 items-baseline gap-3.5 text-left"
                          >
                            <span
                              className={`font-mono text-xs font-semibold tabular-nums ${
                                isSelected ? "text-[#38BDF8]" : "text-[#6E7681]"
                              }`}
                            >
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="truncate font-display text-xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                              {item.name}
                            </span>
                            <span className="hidden truncate font-sans text-xs text-[#6E7681] md:inline">
                              — {item.domain}
                            </span>
                          </button>

                          <div className="flex shrink-0 items-center gap-3 pl-7 sm:pl-0">
                            <span className="font-mono text-[11px] text-[#8B949E]">
                              {item.stack}
                            </span>
                            {"href" in item && item.href && (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${item.name} on GitHub`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#1C222B] text-[#8B949E] transition-all duration-300 hover:border-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0D1117]"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
