"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUp } from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { EASE } from "@/lib/motion";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";
import { SectionReveal } from "@/components/sections/SectionReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const appReduced = useAppReducedMotion();

  useGSAP(
    () => {
      const footer = footerRef.current;
      const wordmark = wordmarkRef.current;
      if (!footer || !wordmark) return;
      if (appReduced) {
        gsap.set(wordmark, { clearProps: "transform,opacity" });
        return;
      }

      gsap.fromTo(
        wordmark,
        { yPercent: 55, opacity: 0.15 },
        {
          yPercent: 0,
          opacity: 1,
          ease: EASE.gsapOut,
          scrollTrigger: {
            trigger: footer,
            start: "top 95%",
            end: "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    { scope: footerRef, dependencies: [appReduced] }
  );

  return (
    <footer
      ref={footerRef}
      role="contentinfo"
      className="overflow-hidden border-t border-[rgba(240,246,252,0.08)] bg-[#0D1117] pt-8 pb-4 text-[#8B949E] sm:pt-10"
    >
      <SectionReveal
        settleAtBottom
        className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 font-mono text-xs sm:flex-row sm:items-center sm:px-8"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[#E6EDF3]">{profile.name}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.role}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.availabilityShort}</span>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <TransitionLink
            href="/brief"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            Recruiter Brief
          </TransitionLink>
          <TransitionLink
            href="/uses"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            Uses
          </TransitionLink>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            Email
          </a>
          <button
            type="button"
            onClick={() => window.__portfolioScrollTo?.(0)}
            className="group inline-flex min-h-[44px] items-center gap-1.5 text-[#9DA7B3] transition-colors hover:text-[#38BDF8]"
          >
            <span>Return to top</span>
            <ArrowUp
              className="h-3.5 w-3.5 transition-transform duration-300 ease-[var(--ease-editorial)] group-hover:-translate-y-0.5"
              weight="regular"
              aria-hidden="true"
            />
          </button>
        </nav>
      </SectionReveal>

      <div
        aria-hidden="true"
        className="mx-auto mt-6 max-w-[1400px] overflow-hidden px-4 sm:mt-8 sm:px-8"
      >
        <div
          ref={wordmarkRef}
          style={{
            WebkitTextStroke: "1px rgba(240, 246, 252, 0.1)",
          }}
          className="select-none whitespace-nowrap pt-2 pb-1 font-display text-[clamp(3.6rem,13.5vw,12.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-[#161B22]"
        >
          {profile.name}
        </div>
      </div>
    </footer>
  );
}

