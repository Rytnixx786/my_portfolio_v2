"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowDownRight, ArrowUpRight, FilePdf } from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { FloatingProjectStack3D } from "./FloatingProjectStack3D";
import { HeroCursorField } from "./HeroCursorField";

gsap.registerPlugin(useGSAP);

const LazyHeroOrbitalCore3D = dynamic(
  () =>
    import("@/components/canvas/HeroOrbitalCore3D").then(
      (mod) => mod.HeroOrbitalCore3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/40 sm:h-[380px] lg:h-[420px]">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#8B949E]">
          Initializing Orbital Stage...
        </span>
      </div>
    ),
  }
);

const HERO_PROOF = [
  { value: "331 tok/s", label: "Qwen2.5-7B INT4", systemIdx: 0 },
  { value: "95%", label: "Grounded RAG", systemIdx: 3 },
  { value: "92%+", label: "CI Test Gate", systemIdx: 2 },
] as const;

/**
 * Clean, spacious above-the-fold Hero section optimized for 1366x768+ laptops:
 * focused identity + interactive cursor precision lattice + 3 high-signal metrics
 * paired with an interactive 3D/2D Orbital Core.
 */
export function HeroEditorial() {
  const [activeSystemIndex, setActiveSystemIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-stagger]", {
          y: 14,
          duration: 0.65,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform",
        });
      });
    },
    { scope: heroRef }
  );

  const handleMetricMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative z-[2] flex min-h-[100dvh] items-center overflow-hidden border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] pt-20 pb-10 sm:pt-24 sm:pb-12"
    >
      {/* Interactive Cursor-Reactive Precision Lattice Field */}
      <HeroCursorField containerRef={heroRef} />

      {/* Subtle Bottom Edge Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 bg-gradient-to-t from-[#0D1117] to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left 7 Cols: Focused Editorial Identity */}
          <div className="min-w-0 lg:col-span-7">
            <p
              data-hero-stagger
              className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22]/75 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9DA7B3] backdrop-blur-sm sm:text-[11px] sm:tracking-[0.15em]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#10B981]" aria-hidden="true" />
              <span>
                {profile.role} · FlyRank Intern · {profile.utc}
              </span>
            </p>

            <h1
              data-hero-stagger
              className="mt-5 max-w-5xl font-display text-[clamp(2.45rem,6.4vw,5.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]"
            >
              RELIABLE{" "}
              <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                ai systems.
              </span>
            </h1>

            <p
              data-hero-stagger
              className="mt-4 max-w-[46ch] font-sans text-base leading-relaxed text-[#9DA7B3] sm:text-lg"
            >
              Quantized serving, grounded RAG, and fault-isolated backends.
            </p>

            <div data-hero-stagger className="mt-7 flex flex-wrap items-center gap-3.5">
              <MagneticButton>
                <a
                  href="#work"
                  className="group inline-flex min-h-[44px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-6 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-colors duration-300 hover:bg-[#7DD3FC] active:scale-[0.98]"
                >
                  <span>Explore Work</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15">
                    <ArrowDownRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                  </span>
                </a>
              </MagneticButton>

              <a
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22]/90 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
              >
                <FilePdf className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span>Resume</span>
              </a>

              <Link
                href="/brief"
                className="inline-flex min-h-[44px] items-center gap-1.5 px-2 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA7B3] transition-colors hover:text-[#38BDF8]"
              >
                <span>Recruiter Brief</span>
                <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-2 border-t border-[rgba(240,246,252,0.08)] pt-6 sm:gap-3">
              {HERO_PROOF.map((stat) => {
                const isSelected = activeSystemIndex === stat.systemIdx;
                return (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => setActiveSystemIndex(stat.systemIdx)}
                    onPointerMove={handleMetricMove}
                    aria-pressed={isSelected}
                    className={`spotlight-card relative min-w-0 overflow-hidden rounded-xl border px-2.5 py-2.5 text-left transition-all duration-200 sm:px-3.5 sm:py-3 ${
                      isSelected
                        ? "border-[#38BDF8]/45 bg-[#38BDF8]/10"
                        : "border-[rgba(240,246,252,0.08)] bg-[#161B22]/45 hover:border-[rgba(240,246,252,0.18)] hover:bg-[#161B22]/80"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 top-0 h-[2px] bg-[#38BDF8] transition-opacity duration-200 ${
                        isSelected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="block font-display text-xl font-bold leading-none text-[#E6EDF3] tabular-nums sm:text-3xl">
                      {stat.value}
                    </span>
                    <span className="mt-1.5 block truncate font-mono text-[10px] text-[#8B949E] sm:text-[11px]">
                      {stat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 5 Cols: Interactive 3D/2D Orbital Stage + Compact Switcher Bar */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-5">
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
