"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowDownRight, FilePdf } from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { KineticHeading } from "@/components/motion/KineticText";
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
      <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/40 sm:h-[380px] lg:h-[420px]">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#8B949E]">
          Initializing Orbital Stage...
        </span>
      </div>
    ),
  }
);

/**
 * Clean, spacious above-the-fold Hero section optimized for 1366x768+ laptops:
 * focused identity + interactive cursor precision lattice paired with
 * an interactive 3D/2D Orbital Core and compact system switcher.
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

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative z-[2] flex min-h-[100dvh] items-center overflow-hidden border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] pt-20 pb-16 sm:pt-24 sm:pb-14 lg:pt-20 lg:pb-8"
    >
      {/* Interactive Cursor-Reactive Precision Lattice Field */}
      <HeroCursorField containerRef={heroRef} />

      {/* Subtle Bottom Edge Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 bg-gradient-to-t from-[#0D1117] to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left 7 Cols: Focused Editorial Identity */}
          <div className="min-w-0 lg:col-span-7">
            <p
              data-hero-stagger
              className="inline-flex max-w-full items-center gap-2.5 border-0 bg-transparent px-0 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA7B3]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#10B981]" aria-hidden="true" />
              <span className="min-w-0">{profile.role}</span>
            </p>

            <KineticHeading
              as="h1"
              immediate
              className="mt-4 max-w-5xl font-display text-[clamp(2.45rem,6.4vw,5.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3] sm:mt-5"
            >
              RELIABLE{" "}
              <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                ai systems.
              </span>
            </KineticHeading>

            <p
              data-hero-stagger
              className="mt-3 max-w-[46ch] font-sans text-base leading-relaxed text-[#9DA7B3] sm:mt-4 sm:text-lg"
            >
              Quantized serving, grounded RAG, and fault-isolated backends.
            </p>

            <div data-hero-stagger className="mt-5 flex flex-wrap items-center gap-3.5 sm:mt-7">
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
