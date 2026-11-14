"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);

interface KineticHeadingProps {
  as?: "h1" | "h2" | "h3";
  className?: string;
  children: ReactNode;
  immediate?: boolean;
  delay?: number;
}

/**
 * Editorial masked-line typographic reveal using GSAP 3.15 SplitText (`mask: "lines"`).
 * Leaves LCP copy visible at paint (transforms words upward from line masks without hiding container)
 * and safely skips DOM splitting when prefers-reduced-motion is enabled.
 */
export function KineticHeading({
  as: Tag = "h2",
  className = "",
  children,
  immediate = false,
  delay = 0,
}: KineticHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [fontsReady, setFontsReady] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    let alive = true;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) setFontsReady(true);
      });
    } else {
      const raf = window.requestAnimationFrame(() => {
        if (alive) setFontsReady(true);
      });
      return () => {
        alive = false;
        window.cancelAnimationFrame(raf);
      };
    }
    return () => {
      alive = false;
    };
  }, [immediate]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !fontsReady) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(el, {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
        });

        const rect = el.getBoundingClientRect();
        const alreadyNearTop = immediate || rect.top < window.innerHeight * 0.94;

        gsap.from(split.words, {
          yPercent: 112,
          duration: immediate ? 0.72 : 0.78,
          delay,
          stagger: 0.032,
          ease: "power4.out",
          clearProps: "transform",
          ...(alreadyNearTop
            ? {}
            : {
                scrollTrigger: {
                  trigger: el,
                  start: "top 88%",
                  once: true,
                },
              }),
        });

        return () => {
          split.revert();
        };
      });
    },
    { scope: ref, dependencies: [fontsReady, immediate, delay] }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

interface ScrambleMetricProps {
  value: string;
  className?: string;
}

/**
 * Single-pass tabular telemetry scramble decoder for numerical counters and status strings.
 * Renders the exact static value synchronously and decodes once on view/update.
 */
export function ScrambleMetric({ value, className = "" }: ScrambleMetricProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.96;

        gsap.to(el, {
          duration: 0.42,
          scrambleText: {
            text: value,
            chars: "0123456789.%ms",
            revealDelay: hasAnimatedRef.current ? 0.04 : 0.1,
            speed: 0.7,
          },
          ease: "power2.out",
          ...(inView || hasAnimatedRef.current
            ? {}
            : {
                scrollTrigger: {
                  trigger: el,
                  start: "top 92%",
                  once: true,
                },
              }),
        });
        hasAnimatedRef.current = true;
      });
    },
    { scope: ref, dependencies: [value] }
  );

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value}
    </span>
  );
}
