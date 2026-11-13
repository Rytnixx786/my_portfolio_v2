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
  variant?: "reveal" | "parallax";
}

/**
 * GSAP ScrollTrigger reveal driven cleanly by useGSAP() + matchMedia.
 * Leaves above-the-fold elements immediately visible and preserves layout if reduced motion is active.
 */
export function SectionReveal({
  children,
  className = "",
  delayMs = 0,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.94) {
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
    { scope: ref, dependencies: [delayMs] }
  );

  return (
    <div ref={ref} className={`motion-reduce:transform-none ${className}`}>
      {children}
    </div>
  );
}
