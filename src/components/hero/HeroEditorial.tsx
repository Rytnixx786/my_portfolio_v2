"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { HeroInferenceCanvas } from "@/components/canvas/HeroInferenceCanvas";
import { HeroOrbitalCore3D } from "@/components/canvas/HeroOrbitalCore3D";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { FloatingProjectStack3D } from "./FloatingProjectStack3D";

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

export function HeroEditorial() {
  const [activeSystemIndex, setActiveSystemIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const telemetryRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = heroRef.current;
    const h1 = headlineRef.current;
    const tele = telemetryRef.current;
    if (!root || !h1) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      split = SplitText.create(h1, { type: "lines", mask: "lines" });

      gsap.from(split.lines, {
        yPercent: 105,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });

      if (tele) {
        gsap.to(tele, {
          duration: 1.05,
          scrambleText: {
            text: "331 tok/s · 4.12 ms cache · 92%+ CI",
            chars: "0123456789ABCDEF%./+",
            revealDelay: 0.15,
            speed: 0.45,
          },
        });
      }
    }, root);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-[100dvh] flex-col justify-between overflow-x-clip border-b border-[rgba(240,246,252,0.1)] bg-[#0D1117] pt-20 pb-10 sm:pt-24 sm:pb-12"
    >
      {/* Interactive Three.js / GLSL WebGL Inference Field */}
      <HeroInferenceCanvas activeSystemIndex={activeSystemIndex} />

      {/* Subtle Architectural Guide Rails */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-[1400px] border-x border-[rgba(240,246,252,0.05)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-4 sm:px-8">
        {/* Top Masthead Bar */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[rgba(240,246,252,0.08)] pb-3.5 font-mono text-[11px] uppercase tracking-[0.15em] text-[#8B949E]">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-[#E6EDF3]">{profile.name}</span>
            <span className="text-[#6E7681]" aria-hidden="true">
              ·
            </span>
            <span>Dhaka, {profile.utc}</span>
          </div>

          <div className="flex items-center gap-2 text-[#38BDF8] tabular-nums">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
            </span>
            <span ref={telemetryRef}>331 tok/s · 4.12 ms cache · 92%+ CI</span>
          </div>
        </div>

        {/* Main Asymmetric Compute Split */}
        <div className="my-auto grid grid-cols-1 items-center gap-10 py-6 md:grid-cols-12 md:gap-8 lg:gap-12 lg:py-8">
          {/* LEFT COLUMN: Kinetic Headline, Narrative, Focused 2-CTA Strip */}
          <div className="md:col-span-7 md:border-r md:border-[rgba(240,246,252,0.08)] md:pr-8 lg:pr-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#7DD3FC] sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" aria-hidden="true" />
              <span>AI &amp; BACKEND SYSTEMS ENGINEER</span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span className="h-[2px] w-7 bg-[#38BDF8]" aria-hidden="true" />
              <p className="font-display text-xl font-bold uppercase tracking-[0.06em] text-[#E6EDF3] sm:text-2xl">
                {profile.name}
              </p>
            </div>

            <h1
              ref={headlineRef}
              className="mt-3 max-w-4xl font-display text-[clamp(2.65rem,5.2vw,5.5rem)] font-bold uppercase leading-[0.90] tracking-[-0.02em] text-[#E6EDF3]"
            >
              <span className="block">DETERMINISTIC SYSTEMS</span>
              <span className="block">AROUND STOCHASTIC</span>
              <span className="block text-[#38BDF8]">
                MODELS{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#E6EDF3]">
                  in production.
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-[56ch] font-sans text-base leading-relaxed text-[#8B949E] sm:text-[17px]">
              I care about what happens after a model responds—engineering quantized{" "}
              <span className="font-medium text-[#E6EDF3]">vLLM serving gateways</span>,
              stateful <span className="font-medium text-[#E6EDF3]">LangGraph orchestration</span>,
              calibrated hybrid RAG, and CI-gated ML promotion pipelines from Dhaka.
            </p>

            {/* Primary & Secondary Interactive CTAs (Restrained 2-CTA layout per design-taste-frontend) */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <MagneticButton>
                <a
                  href="#simulator"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-6 pr-2 font-sans text-sm font-semibold text-[#0D1117] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#7DD3FC] active:scale-[0.98]"
                >
                  <span>Run 3D Simulator</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 text-[#0D1117] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                  </span>
                </a>
              </MagneticButton>

              <MagneticButton>
                <a
                  href="#work"
                  className="group inline-flex items-center gap-3 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] py-2 pl-6 pr-2 font-sans text-sm font-medium text-[#E6EDF3] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/60 hover:bg-[#1C222B] active:scale-[0.98]"
                >
                  <span>Explore Case Studies</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(240,246,252,0.06)] text-[#E6EDF3] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:bg-[#38BDF8]/15 group-hover:text-[#38BDF8]">
                    <ArrowDownRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                  </span>
                </a>
              </MagneticButton>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[rgba(240,246,252,0.08)] pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B949E]">
              <span className="inline-flex items-center gap-2 text-[#E6EDF3]">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
                <span>
                  {profile.location} ({profile.utc}) · Available 2026
                </span>
              </span>
              <span className="hidden text-[#6E7681] sm:inline" aria-hidden="true">
                /
              </span>
              <span>BRAC University CSE · FlyRank Intern</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive 3D Orbital Core (/img/newdp.jpg) + Synced Flagship Deck */}
          <div className="flex flex-col gap-5 md:col-span-5">
            <HeroOrbitalCore3D
              activeSystemIndex={activeSystemIndex}
              onSelectSystem={setActiveSystemIndex}
            />

            <FloatingProjectStack3D
              activeIndex={activeSystemIndex}
              onActiveChange={setActiveSystemIndex}
            />
          </div>
        </div>

        {/* Bottom Masthead Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(240,246,252,0.08)] pt-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#6E7681]">
          <span>Verified benchmarks from production repositories</span>
          <a
            href="#work"
            className="inline-flex items-center gap-1.5 text-[#E6EDF3] transition-colors duration-300 hover:text-[#38BDF8]"
          >
            <span>Selected Work</span>
            <ArrowDownRight className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
