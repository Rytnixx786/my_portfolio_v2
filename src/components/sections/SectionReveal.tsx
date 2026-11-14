"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "reveal" | "bento-cascade" | "scrub-depth";
  parallaxY?: number;
}

/**
 * GSAP ScrollTrigger wrapper supporting three cohesive motion signatures synced with Lenis:
 * - "reveal": directional entrance for editorial blocks
 * - "bento-cascade": viewport-staggered reveal across `[data-bento-item]` children
 * - "scrub-depth": continuous Lenis-locked scale/translate depth settle
 */
export function SectionReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "reveal",
  parallaxY = 0,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (parallaxY !== 0) {
          gsap.fromTo(
            el,
            { y: parallaxY },
            {
              y: -parallaxY,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: MOTION.scrollTrigger.scrub,
              },
            }
          );
          if (variant === "reveal") return;
        }

        const rect = el.getBoundingClientRect();
        if (variant !== "scrub-depth" && rect.top < window.innerHeight * 0.94) {
          return;
        }

        if (variant === "scrub-depth") {
          gsap.fromTo(
            el,
            { scale: 0.965, y: 22 },
            {
              scale: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: MOTION.scrollTrigger.revealStart,
                end: "top 38%",
                scrub: MOTION.scrollTrigger.scrub,
              },
            }
          );
          return;
        }

        if (variant === "bento-cascade") {
          const items = el.querySelectorAll("[data-bento-item]");
          const targets = items.length > 0 ? items : el;
          const staggerStep =
            items.length > 1
              ? Math.min(
                  MOTION.stagger.bentoGrid,
                  MOTION.stagger.bentoCap / (items.length - 1)
                )
              : 0;
          gsap.fromTo(
            targets,
            { y: 24, scale: 0.985, opacity: 0 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: MOTION.durations.reveal,
              stagger: staggerStep,
              delay: Math.min(delayMs, 200) / 1000,
              ease: MOTION.gsapEase,
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: el,
                start: MOTION.scrollTrigger.bentoStart,
                once: true,
              },
            }
          );
          return;
        }

        gsap.fromTo(
          el,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: MOTION.durations.reveal,
            delay: Math.min(delayMs, 220) / 1000,
            ease: MOTION.gsapEase,
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: el,
              start: MOTION.scrollTrigger.revealStart,
              once: true,
            },
          }
        );
      });
    },
    { scope: ref, dependencies: [delayMs, variant, parallaxY] }
  );

  return (
    <div ref={ref} className={`motion-reduce:transform-none ${className}`}>
      {children}
    </div>
  );
}
