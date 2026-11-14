"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { MOTION, splitNumericMetricTokens } from "@/lib/motion";

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
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let settled = false;

    const markReady = () => {
      if (!alive || settled) return;
      settled = true;
      setFontsReady(true);
    };

    const fallbackTimer = window.setTimeout(
      markReady,
      MOTION.fontReadyTimeoutMs
    );

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(markReady, markReady);
    } else {
      const raf = window.requestAnimationFrame(markReady);
      return () => {
        alive = false;
        window.clearTimeout(fallbackTimer);
        window.cancelAnimationFrame(raf);
      };
    }

    return () => {
      alive = false;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

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
          duration: immediate
            ? MOTION.durations.kinetic
            : MOTION.durations.kineticScroll,
          delay,
          stagger: MOTION.stagger.splitWords,
          ease: MOTION.gsapHeadingEase,
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
  const tokens = splitNumericMetricTokens(value);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const digitSpans = Array.from(
        el.querySelectorAll<HTMLElement>("[data-scramble-digit]")
      );
      if (digitSpans.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.96;

        for (const span of digitSpans) {
          const targetText = span.dataset.target ?? span.textContent ?? "";
          gsap.to(span, {
            duration: MOTION.durations.metric,
            scrambleText: {
              text: targetText,
              chars: "0123456789.",
              revealDelay: hasAnimatedRef.current ? 0.04 : 0.08,
              speed: 0.7,
            },
            ease: MOTION.gsapMetricEase,
            ...(inView || hasAnimatedRef.current
              ? {}
              : {
                  scrollTrigger: {
                    trigger: el,
                    start: MOTION.scrollTrigger.metricStart,
                    once: true,
                  },
                }),
          });
        }
        hasAnimatedRef.current = true;
      });
    },
    { scope: ref, dependencies: [value] }
  );

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {tokens.map((token, idx) =>
        token.isNumeric ? (
          <span
            key={`${idx}-${token.text}`}
            data-scramble-digit
            data-target={token.text}
          >
            {token.text}
          </span>
        ) : (
          <span key={`${idx}-${token.text}`}>{token.text}</span>
        )
      )}
    </span>
  );
}
