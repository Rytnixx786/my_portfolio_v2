"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { MOTION, splitNumericMetricTokens } from "@/lib/motion";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";

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
 * Leaves LCP copy visible at paint and plays bidirectionally on scroll unless reduced motion is active.
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
  const appReduced = useAppReducedMotion();

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
      if (!el || !fontsReady || appReduced) return;

      const rect = el.getBoundingClientRect();
      const alreadyNearTop = immediate || rect.top < window.innerHeight * 0.94;
      let activeTween: gsap.core.Tween | null = null;

      const split = SplitText.create(el, {
        type: "lines,words",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) => {
          activeTween?.kill();
          activeTween = alreadyNearTop
            ? gsap.from(self.words, {
                yPercent: 112,
                duration: immediate
                  ? MOTION.durations.kinetic
                  : MOTION.durations.kineticScroll,
                delay,
                stagger: MOTION.stagger.splitWords,
                ease: MOTION.gsapHeadingEase,
                clearProps: "transform",
              })
            : gsap.from(self.words, {
                yPercent: 112,
                duration: MOTION.durations.kineticScroll,
                delay,
                stagger: MOTION.stagger.splitWords,
                ease: MOTION.gsapHeadingEase,
                scrollTrigger: {
                  trigger: el,
                  start: "top 90%",
                  end: "bottom 6%",
                  toggleActions: "play reverse play reverse",
                },
              });
          return activeTween;
        },
      });

      return () => {
        activeTween?.kill();
        split.revert();
      };
    },
    { scope: ref, dependencies: [fontsReady, immediate, delay, appReduced] }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

interface ScrollScrubTextProps {
  as?: "p" | "div";
  className?: string;
  children: ReactNode;
}

/**
 * Scroll-scrubbed word-by-word illumination paragraph: words smoothly reveal from
 * dimmed ink into crisp full contrast synchronized with viewport scroll progress.
 */
export function ScrollScrubText({
  as: Tag = "p",
  className = "",
  children,
}: ScrollScrubTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const appReduced = useAppReducedMotion();

  useEffect(() => {
    let alive = true;
    const markReady = () => {
      if (alive) setFontsReady(true);
    };
    const timer = window.setTimeout(markReady, MOTION.fontReadyTimeoutMs);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(markReady, markReady);
    } else {
      window.requestAnimationFrame(markReady);
    }
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !fontsReady || appReduced) return;

      const split = SplitText.create(el, {
        type: "words",
      });

      if (split.words.length === 0) return;

      gsap.set(split.words, { opacity: 0.24, y: 5 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          end: "top 52%",
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
      });
      tl.to(split.words, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power2.out",
      });

      return () => {
        tl.kill();
        split.revert();
      };
    },
    { scope: ref, dependencies: [fontsReady, appReduced] }
  );

  return (
    <Tag ref={ref as React.RefObject<HTMLParagraphElement>} className={className}>
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
  const appReduced = useAppReducedMotion();
  const tokens = splitNumericMetricTokens(value);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || appReduced) return;

      const digitSpans = Array.from(
        el.querySelectorAll<HTMLElement>("[data-scramble-digit]")
      );
      if (digitSpans.length === 0) return;

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
    },
    { scope: ref, dependencies: [value, appReduced] }
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
