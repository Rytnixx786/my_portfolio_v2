"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, FilePdf } from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { FloatingProjectStack3D } from "./FloatingProjectStack3D";

const LazyHeroOrbitalCore3D = dynamic(
  () =>
    import("@/components/canvas/HeroOrbitalCore3D").then(
      (mod) => mod.HeroOrbitalCore3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/60 sm:h-[370px] lg:h-[400px]">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#8B949E]">
          Loading 3D Core...
        </span>
      </div>
    ),
  }
);

/**
 * Compact above-the-fold Hero section designed to fit cleanly on 1366x768 laptops
 * with <= 4 text groups on the editorial column and a unified lazy-loaded 3D stage.
 */
export function HeroEditorial() {
  const [activeSystemIndex, setActiveSystemIndex] = useState(0);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] flex-col justify-between overflow-x-clip border-b border-[rgba(240,246,252,0.1)] bg-[#0D1117] pt-24 pb-8 sm:pt-28 sm:pb-10"
    >
      {/* Subtle architectural guide rails */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-[1400px] border-x border-[rgba(240,246,252,0.05)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-4 sm:px-8">
        {/* Top Masthead Strip */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[rgba(240,246,252,0.08)] pb-3 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA7B3]">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-[#E6EDF3]">{profile.name}</span>
            <span className="text-[#8B949E]" aria-hidden="true">
              ·
            </span>
            <span>
              {profile.location} ({profile.utc})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#38BDF8] tabular-nums">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
            </span>
            <span>331 tok/s · 4.12ms cache · 92%+ CI</span>
          </div>
        </div>

        {/* Main 12-Col Hero Grid */}
        <div className="my-auto grid grid-cols-1 items-center gap-8 py-6 lg:grid-cols-12 lg:gap-10">
          {/* Left 7 Cols: Focused 4-Element Editorial Identity */}
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1 font-mono text-xs uppercase tracking-[0.16em] text-[#7DD3FC]">
              <span>{profile.role} · FlyRank Intern</span>
            </p>

            <h1 className="mt-5 font-display text-[clamp(2.9rem,6.4vw,5.4rem)] font-bold uppercase leading-[0.94] tracking-[-0.02em] text-[#E6EDF3]">
              DETERMINISTIC SYSTEMS FOR{" "}
              <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                stochastic ai.
              </span>
            </h1>

            <p className="mt-5 max-w-[54ch] font-sans text-base leading-relaxed text-[#9DA7B3] sm:text-lg">
              {profile.headline}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <MagneticButton>
                <a
                  href="#work"
                  className="group inline-flex min-h-[44px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-6 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#7DD3FC] active:scale-[0.98]"
                >
                  <span>Explore Selected Work</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:translate-y-0.5">
                    <ArrowDownRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                  </span>
                </a>
              </MagneticButton>

              <Link
                href="/brief"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors duration-300 hover:border-[#38BDF8] hover:text-[#38BDF8]"
              >
                <span>Recruiter Brief</span>
                <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
              </Link>

              <a
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA7B3] transition-colors duration-300 hover:border-[#38BDF8] hover:text-[#E6EDF3]"
              >
                <FilePdf className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span>Resume</span>
              </a>
            </div>
          </div>

          {/* Right 5 Cols: Interactive 3D Core + Flagship Switcher */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <LazyHeroOrbitalCore3D
              activeSystemIndex={activeSystemIndex}
              onSelectSystem={setActiveSystemIndex}
            />
            <FloatingProjectStack3D
              activeIndex={activeSystemIndex}
              onActiveChange={setActiveSystemIndex}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
