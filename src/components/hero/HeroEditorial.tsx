"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDownRight, FilePdf } from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { createAppMatchMedia, MOTION, setPortfolioScrollState } from "@/lib/motion";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { KineticHeading } from "@/components/motion/KineticText";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";
import { HeroOrbitalBootSilhouette } from "./HeroOrbitalBootSilhouette";
import { HeroSystemSwitcher } from "./HeroSystemSwitcher";
import { HeroCursorField } from "./HeroCursorField";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LazyHeroOrbitalCore3D = dynamic(
  () =>
    import("@/components/canvas/HeroOrbitalCore3D").then(
      (mod) => mod.HeroOrbitalCore3D
    ),
  {
    ssr: false,
    loading: () => (
      <HeroOrbitalBootSilhouette className="h-[280px] w-full sm:h-[360px] lg:h-[400px] xl:h-[420px]" />
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
  const appReduced = useAppReducedMotion();

  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero) return;

      const clearHeroState = () => {
        setPortfolioScrollState({ heroProgress: 0 });
        gsap.set(hero, { clearProps: "transform" });
        gsap.set(["[data-hero-copy]", "[data-hero-stage]", "[data-hero-exit-veil]"], {
          clearProps: "transform,opacity,filter",
        });
      };

      if (appReduced) {
        clearHeroState();
        return;
      }

      // 3-beat entrance: Beat 1 eyebrow -> Beat 2 KineticHeading -> Beat 3 copy/CTAs + stage settle
      const tl = gsap.timeline({ defaults: { ease: MOTION.gsapEase } });
      tl.from("[data-hero-beat='1']", {
        y: 12,
        duration: 0.45,
        clearProps: "transform",
      })
        .from(
          "[data-hero-beat='3']",
          {
            y: 16,
            duration: MOTION.durations.reveal,
            stagger: MOTION.stagger.hero,
            clearProps: "transform",
          },
          0.14
        )
        .from(
          "[data-hero-stage-enter]",
          {
            y: 14,
            duration: MOTION.durations.reveal,
            clearProps: "transform",
          },
          0.18
        );

      const mm = createAppMatchMedia().register(({ conditions }) => {
        if (conditions.appReduced) {
          clearHeroState();
          return;
        }

        if (conditions.desktopFine) {
          // Desktop pinned curtain: hold #hero in place while #work slides over it cleanly
          const pinTl = gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "+=70%",
              pin: true,
              pinSpacing: false,
              scrub: MOTION.scrollTrigger.scrub,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                setPortfolioScrollState({ heroProgress: self.progress });
              },
              onLeaveBack: () => {
                setPortfolioScrollState({ heroProgress: 0 });
              },
            },
          });

          pinTl
            .fromTo(
              "[data-hero-copy]",
              { y: 0, scale: 1, opacity: 1 },
              { y: -60, scale: 0.96, opacity: 0.16, ease: "power1.in" },
              0
            )
            .fromTo(
              "[data-hero-stage]",
              { y: 0, scale: 1, opacity: 1 },
              { y: -22, scale: 0.9, opacity: 0.34, ease: "power1.in" },
              0
            )
            .fromTo(
              "[data-hero-exit-veil]",
              { opacity: 0 },
              { opacity: 0.8, ease: "none" },
              0
            );
          return;
        }

        // Mobile fallback: zero pin, smooth unpinned recession
        const mobileExitTl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom 28%",
            scrub: MOTION.scrollTrigger.scrub,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setPortfolioScrollState({ heroProgress: self.progress });
            },
          },
        });

        mobileExitTl
          .fromTo(
            "[data-hero-copy]",
            { y: 0, opacity: 1 },
            { y: -36, opacity: 0.25, ease: "power1.in" },
            0
          )
          .fromTo(
            "[data-hero-stage]",
            { scale: 1, opacity: 1 },
            { scale: 0.94, opacity: 0.36, ease: "power1.in" },
            0
          )
          .fromTo(
            "[data-hero-exit-veil]",
            { opacity: 0 },
            { opacity: 0.65, ease: "none" },
            0
          );
      });

      return () => {
        mm.revert();
        setPortfolioScrollState({ heroProgress: 0 });
      };
    },
    { scope: heroRef, dependencies: [appReduced], revertOnUpdate: true }
  );

  return (
    <section
      ref={heroRef}
      id="hero"
      data-cursor-hero
      className="relative z-[2] flex min-h-[100dvh] items-center overflow-hidden bg-[#0D1117] pt-24 pb-14 sm:pt-24 sm:pb-16 lg:pt-20 lg:pb-12"
    >
      {/* Interactive Cursor-Reactive Precision Lattice Field */}
      <HeroCursorField containerRef={heroRef} />

      {/* Scroll-Driven Hero Darkening Curtain Veil */}
      <div
        data-hero-exit-veil
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[15] bg-[radial-gradient(ellipse_at_center,rgba(13,17,23,0.45)_0%,#0D1117_82%)] opacity-0"
      />

      {/* Subtle Bottom Edge Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 bg-gradient-to-t from-[#0D1117] to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left 7 Cols: Focused Editorial Identity */}
          <div data-hero-copy className="min-w-0 lg:col-span-7">
            <p
              data-hero-beat="1"
              className="inline-flex max-w-full items-center gap-2.5 border-0 bg-transparent px-0 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA7B3]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#10B981]" aria-hidden="true" />
              <span className="min-w-0">{profile.role}</span>
            </p>

            <KineticHeading
              as="h1"
              immediate
              delay={0.05}
              className="velocity-skew-heading mt-4 max-w-5xl font-display text-[clamp(2.45rem,6.4vw,5.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3] sm:mt-5"
            >
              RELIABLE{" "}
              <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                ai systems.
              </span>
            </KineticHeading>

            <p
              data-hero-beat="3"
              className="mt-3 max-w-[46ch] font-sans text-base leading-relaxed text-[#9DA7B3] sm:mt-4 sm:text-lg"
            >
              Quantized serving, grounded RAG, and fault-isolated backends.
            </p>

            <div data-hero-beat="3" className="mt-5 flex flex-wrap items-center gap-3.5 sm:mt-7">
              <MagneticButton>
                <a
                  href="#work"
                  className="group inline-flex min-h-[44px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-6 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-[background-color,color,transform] duration-500 ease-[var(--ease-editorial)] hover:bg-[#7DD3FC] active:scale-[0.98]"
                >
                  <span>Explore Work</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:translate-x-[3px] group-hover:translate-y-[2px] group-hover:scale-105">
                    <ArrowDownRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                  </span>
                </a>
              </MagneticButton>

              <a
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="OPEN ↗"
                className="group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22]/90 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.98]"
              >
                <FilePdf
                  className="h-4 w-4 text-[#38BDF8] transition-transform duration-200 group-hover:-translate-y-0.5"
                  weight="regular"
                  aria-hidden="true"
                />
                <span>Resume</span>
              </a>
            </div>
          </div>

          {/* Right 5 Cols: Interactive 3D/2D Orbital Stage + Compact Switcher Bar */}
          <div data-hero-stage className="min-w-0 lg:col-span-5">
            <div data-hero-stage-enter className="flex min-w-0 flex-col gap-3">
              <LazyHeroOrbitalCore3D
                activeSystemIndex={activeSystemIndex}
                onSelectSystem={setActiveSystemIndex}
              />
              <HeroSystemSwitcher
                activeIndex={activeSystemIndex}
                onActiveChange={setActiveSystemIndex}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
