"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Briefcase, GraduationCap, MapPin } from "@phosphor-icons/react";
import { principles, profile } from "@/data/site";
import { PortraitShaderCanvas } from "@/components/canvas/PortraitShaderCanvas";
import { SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger);

const MANIFESTO_WORDS = [
  "Models",
  "are",
  "stochastic.",
  "Production",
  "infrastructure",
  "cannot",
  "be.",
] as const;

export function AboutSection() {
  const manifestoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = manifestoRef.current;
    if (!el) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    const words = el.querySelectorAll<HTMLElement>("[data-scrub-word]");
    if (words.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.22 },
        {
          opacity: 1,
          stagger: 0.14,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            end: "top 42%",
            scrub: 0.5,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] pb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6E7681]">
          <span>Background</span>
          <span className="text-[#38BDF8]">
            {profile.location} · {profile.utc}
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-14">
          {/* Left Column: Multi-Plane Parallax Monochrome Portrait + Hardware Ledger */}
          <div className="min-w-0 lg:col-span-5">
            <SectionReveal variant="parallax">
              <div className="relative pt-3 sm:pr-3">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1 top-0 h-28 w-28 rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/10 sm:h-36 sm:w-36"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 -left-3 h-24 w-24 rounded-full border border-dashed border-[#38BDF8]/30"
                />

                <div className="double-bezel-outer relative z-10">
                  <div className="double-bezel-core overflow-hidden p-2.5 sm:p-3">
                    <div className="relative overflow-hidden rounded-[calc(1.75rem-0.85rem)] bg-[#0D1117]">
                      <PortraitShaderCanvas />
                      <div className="flex items-center justify-between border-t border-[rgba(240,246,252,0.08)] bg-[#161B22]/95 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8B949E]">
                        <span className="font-semibold text-[#E6EDF3]">
                          {profile.name}
                        </span>
                        <span className="text-[#38BDF8]">
                          Dhaka · {profile.utc}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>

            <dl className="mt-8 divide-y divide-[rgba(240,246,252,0.08)] border-y border-[rgba(240,246,252,0.08)]">
              <div className="flex items-start justify-between gap-4 py-3.5">
                <dt className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6E7681]">
                  <GraduationCap
                    className="h-4 w-4 shrink-0 text-[#38BDF8]"
                    weight="regular"
                    aria-hidden="true"
                  />
                  <span>Education</span>
                </dt>
                <dd className="text-right font-sans text-sm font-medium text-[#E6EDF3]">
                  B.Sc. CSE · BRAC University (2022–2026)
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 py-3.5">
                <dt className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6E7681]">
                  <Briefcase
                    className="h-4 w-4 shrink-0 text-[#38BDF8]"
                    weight="regular"
                    aria-hidden="true"
                  />
                  <span>Internship</span>
                </dt>
                <dd className="text-right font-sans text-sm font-medium text-[#E6EDF3]">
                  FlyRank · AI &amp; Back End (June 2026)
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 py-3.5">
                <dt className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6E7681]">
                  <MapPin
                    className="h-4 w-4 shrink-0 text-[#38BDF8]"
                    weight="regular"
                    aria-hidden="true"
                  />
                  <span>Base</span>
                </dt>
                <dd className="text-right font-sans text-sm font-medium text-[#E6EDF3]">
                  {profile.location} ({profile.utc})
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Column: Scrubbed Manifesto + Bio + Operating Principles */}
          <div className="min-w-0 lg:col-span-7 lg:border-l lg:border-[rgba(240,246,252,0.08)] lg:pl-12">
            <SectionReveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7DD3FC]">
                <span>Systems-First Engineer</span>
              </div>

              <h2
                ref={manifestoRef}
                className="mt-5 font-display text-[clamp(2.5rem,5vw,4.3rem)] font-bold uppercase leading-[0.94] tracking-[-0.02em] text-[#E6EDF3]"
              >
                {MANIFESTO_WORDS.map((word, idx) => {
                  const isAccent = idx >= 3;
                  const isItalic = word === "be.";
                  return (
                    <span
                      key={word}
                      data-scrub-word=""
                      className={`mr-[0.22em] inline-block ${
                        isItalic
                          ? "font-serif-detail font-normal italic lowercase text-[#E6EDF3]"
                          : isAccent
                            ? "text-[#38BDF8]"
                            : "text-[#E6EDF3]"
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </h2>

              <div className="mt-7 space-y-5 font-sans text-base leading-relaxed text-[#8B949E] sm:text-[17px]">
                <p className="max-w-[65ch]">
                  I&apos;m <strong className="font-semibold text-[#E6EDF3]">Mehedi Hasan</strong>,
                  a final-year B.Sc. Computer Science &amp; Engineering student at{" "}
                  <strong className="font-semibold text-[#E6EDF3]">BRAC University</strong>{" "}
                  working from Dhaka (UTC+6). My focus sits at the boundary where probabilistic
                  models meet hard systems guarantees—latency budgets, circuit breakers, database
                  isolation, and verifiable CI promotion gates.
                </p>

                <p className="max-w-[65ch]">
                  At <strong className="font-semibold text-[#E6EDF3]">FlyRank</strong> (June 2026),
                  I engineered multi-tenant usage metering, a tiered pricing engine, and
                  asynchronous Stripe webhook reconciliation in FastAPI and SQLAlchemy 2. Alongside
                  production backend work, I build low-level systems from scratch—including a custom
                  C file system (<span className="font-mono text-sm text-[#7DD3FC]">SimpleFS</span>)
                  and a lottery scheduler for RISC-V{" "}
                  <span className="font-mono text-sm text-[#7DD3FC]">xv6</span>.
                </p>

                <p className="max-w-[65ch]">
                  Whether I&apos;m serving AWQ Marlin INT4 weights on an 8 GB workstation GPU or
                  calibrating NLI refusal gates for hybrid RAG, every system I ship is built to
                  measure its own behavior and fail honestly when proof is missing.
                </p>
              </div>

              <div className="mt-10 border-t border-[rgba(240,246,252,0.08)] pt-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6E7681]">
                  Operating Principles
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {principles.map((item) => (
                    <div
                      key={item.k}
                      className="rounded-[1.25rem] border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-5 transition-colors duration-300 hover:border-[#38BDF8]/40"
                    >
                      <span className="font-mono text-xs font-semibold text-[#38BDF8]">
                        {item.k}
                      </span>
                      <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                        {item.t}
                      </h3>
                      <p className="mt-2 font-sans text-sm leading-relaxed text-[#8B949E]">
                        {item.d}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
