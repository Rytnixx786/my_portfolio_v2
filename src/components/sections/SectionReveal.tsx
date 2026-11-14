"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "reveal" | "bento-cascade" | "scrub-depth";
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
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
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
                start: "top 92%",
                end: "top 38%",
                scrub: 0.65,
              },
            }
          );
          return;
        }

        if (variant === "bento-cascade") {
          const items = el.querySelectorAll("[data-bento-item]");
          const targets = items.length > 0 ? items : el;
          gsap.fromTo(
            targets,
            { y: 24, scale: 0.985, opacity: 0 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.68,
              stagger: 0.08,
              delay: Math.min(delayMs, 200) / 1000,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
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
            duration: 0.65,
            delay: Math.min(delayMs, 220) / 1000,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              once: true,
            },
          }
        );
      });
    },
    { scope: ref, dependencies: [delayMs, variant] }
  );

  return (
    <div ref={ref} className={`motion-reduce:transform-none ${className}`}>
      {children}
    </div>
  );
}
