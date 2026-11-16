"use client";

import dynamic from "next/dynamic";
import { useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowUpRight,
  Check,
  Copy,
  EnvelopeSimple,
  FilePdf,
} from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { createAppMatchMedia, EASE, MOTION } from "@/lib/motion";
import {
  handleSpotlightEnter,
  handleSpotlightLeave,
  handleSpotlightMove,
  useCopy,
} from "@/hooks/usePortfolioUtils";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import {
  KineticHeading,
  OutlineFillText,
  ScrollScrubText,
} from "@/components/motion/KineticText";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";
import { AskTerminal } from "./AskTerminal";
import { SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LazyTelemetryGlobe3D = dynamic(
  () =>
    import("@/components/canvas/TelemetryGlobe3D").then(
      (mod) => mod.TelemetryGlobe3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-[265px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/60 sm:h-[295px]">
        <svg
          viewBox="0 0 240 240"
          className="h-44 w-44 opacity-50"
          aria-hidden="true"
        >
          <circle
            cx="120"
            cy="120"
            r="84"
            fill="none"
            stroke="rgba(56,189,248,0.28)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="120"
            cy="120"
            rx="42"
            ry="84"
            fill="none"
            stroke="rgba(240,246,252,0.12)"
            strokeWidth="1"
          />
          <line
            x1="36"
            y1="120"
            x2="204"
            y2="120"
            stroke="rgba(240,246,252,0.12)"
            strokeWidth="1"
          />
          <line
            x1="120"
            y1="36"
            x2="120"
            y2="204"
            stroke="rgba(240,246,252,0.12)"
            strokeWidth="1"
          />
        </svg>
      </div>
    ),
  }
);

export function ContactSection() {
  const { copied, copy } = useCopy(2000);
  const sectionRef = useRef<HTMLElement>(null);
  const globeWrapRef = useRef<HTMLDivElement>(null);
  const appReduced = useAppReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const globeWrap = globeWrapRef.current;
      if (!section) return;

      const clearFinale = () => {
        if (globeWrap) {
          gsap.set(globeWrap, { clearProps: "transform,opacity" });
        }
        const ctas = section.querySelectorAll<HTMLElement>("[data-contact-cta]");
        if (ctas.length > 0) {
          gsap.set(ctas, { clearProps: "transform,opacity" });
        }
      };

      if (appReduced) {
        clearFinale();
        return;
      }

      const mm = createAppMatchMedia().register(({ conditions }) => {
        if (conditions.appReduced) {
          clearFinale();
          return;
        }

        const ctas = section.querySelectorAll<HTMLElement>("[data-contact-cta]");
        if (ctas.length > 0) {
          gsap.fromTo(
            ctas,
            { y: 22, opacity: 0.15 },
            {
              y: 0,
              opacity: 1,
              duration: 0.56,
              stagger: 0.06,
              ease: EASE.gsapOut,
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: section,
                start: "top 86%",
                end: "top 48%",
                scrub: 0.35,
                invalidateOnRefresh: true,
              },
            }
          );
        }

        if (globeWrap) {
          gsap.fromTo(
            globeWrap,
            {
              scale: conditions.desktopFine ? 0.74 : 0.88,
              rotate: conditions.desktopFine ? -6 : 0,
              opacity: 0.35,
            },
            {
              scale: 1,
              rotate: 0,
              opacity: 1,
              ease: EASE.gsapOut,
              scrollTrigger: {
                trigger: globeWrap,
                start: "top 92%",
                end: "top 44%",
                scrub: MOTION.scrollTrigger.scrub,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [appReduced], revertOnUpdate: true }
  );

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="overflow-x-clip bg-[#0D1117] pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-40 lg:pb-24"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 border-b border-[rgba(240,246,252,0.08)] pb-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#7DD3FC]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
              <span>{profile.status}</span>
            </div>

            <h2 className="velocity-skew-heading mt-5 max-w-4xl font-display text-[clamp(2.7rem,6.5vw,5.4rem)] font-bold uppercase leading-[1.02] tracking-[-0.02em] text-[#E6EDF3] sm:leading-[0.94]">
              <KineticHeading as="span" reveal="mask-lines" className="block">
                LET&apos;S BUILD SOMETHING
              </KineticHeading>
              <OutlineFillText className="mt-1.5 block sm:mt-1">DETERMINISTIC.</OutlineFillText>
            </h2>

            <ScrollScrubText className="mt-5 max-w-[46ch] font-sans text-base leading-relaxed text-[#9DA7B3] sm:text-lg">
              Available for AI engineering, LLM serving, and backend teams.
            </ScrollScrubText>

            <div className="mt-8 flex flex-col items-start gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div data-contact-cta>
                  <MagneticButton>
                    <a
                      href={`mailto:${profile.email}`}
                      className="group inline-flex min-h-[46px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-6 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-[background-color,color,transform] duration-500 ease-[var(--ease-editorial)] hover:bg-[#7DD3FC] active:scale-[0.98]"
                    >
                      <EnvelopeSimple className="h-4 w-4" weight="regular" aria-hidden="true" />
                      <span>Email · {profile.email}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 text-[#0D1117] transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:translate-x-[3px] group-hover:-translate-y-[2px] group-hover:scale-105">
                        <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                      </span>
                    </a>
                  </MagneticButton>
                </div>

                <button
                  data-contact-cta
                  data-cursor={copied ? "COPIED ✓" : "COPY"}
                  type="button"
                  onClick={() => void copy(profile.email)}
                  className={`inline-flex min-h-[46px] items-center gap-2 rounded-full border px-5 font-mono text-xs uppercase tracking-[0.12em] transition-colors active:scale-[0.98] ${
                    copied
                      ? "border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]"
                      : "border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] hover:border-[#38BDF8] hover:text-[#38BDF8]"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[#10B981]" weight="regular" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#9DA7B3]" weight="regular" aria-hidden="true" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div data-contact-cta>
                  <TransitionLink
                    href="/brief"
                    className="group inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.98]"
                  >
                    <span>Recruiter Brief</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform duration-300 ease-[var(--ease-editorial)] group-hover:translate-x-[2px] group-hover:-translate-y-[2px]"
                      weight="regular"
                      aria-hidden="true"
                    />
                  </TransitionLink>
                </div>

                <a
                  data-contact-cta
                  data-cursor="OPEN ↗"
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.98]"
                >
                  <FilePdf className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                  <span>Resume PDF</span>
                </a>
              </div>
            </div>
          </div>

          <div ref={globeWrapRef} className="lg:col-span-5">
            <div
              onPointerEnter={handleSpotlightEnter}
              onPointerMove={(e) => handleSpotlightMove(e, false)}
              onPointerLeave={(e) => handleSpotlightLeave(e, false)}
              style={{ "--spotlight-color": "rgba(56, 189, 248, 0.12)" } as CSSProperties}
              className="double-bezel-outer spotlight-card"
            >
              <div className="double-bezel-core overflow-hidden p-3">
                <LazyTelemetryGlobe3D />
              </div>
            </div>
          </div>
        </div>

        <SectionReveal settleAtBottom>
          <AskTerminal />
        </SectionReveal>
      </div>
    </section>
  );
}
