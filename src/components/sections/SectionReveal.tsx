"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "reveal" | "parallax";
}

/**
 * GSAP ScrollTrigger reveal / parallax wrapper using gsap.context() for cleanup.
 * Disables motion when prefers-reduced-motion is enabled.
 */
export function SectionReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "reveal",
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;

    if (variant === "parallax") {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { y: 20 },
          {
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          }
        );
      }, el);

      return () => ctx.revert();
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.72,
          delay: delayMs / 1000,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delayMs, variant]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
