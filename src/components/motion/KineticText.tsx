"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { EASE, MOTION, splitNumericMetricTokens } from "@/lib/motion";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);

let sharedFontsResolved = false;
let sharedFontsPromise: Promise<void> | null = null;

function subscribeFontsReady(onReady: () => void): () => void {
  if (sharedFontsResolved) {
    onReady();
    return () => {};
  }
  let active = true;
  if (!sharedFontsPromise) {
    sharedFontsPromise = new Promise<void>((resolve) => {
      const done = () => {
        sharedFontsResolved = true;
        resolve();
      };
      const timer = window.setTimeout(done, MOTION.fontReadyTimeoutMs);
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(
          () => {
            window.clearTimeout(timer);
            done();
          },
          () => {
            window.clearTimeout(timer);
            done();
          }
        );
      } else {
        window.clearTimeout(timer);
        window.requestAnimationFrame(done);
      }
    });
  }
  void sharedFontsPromise.then(() => {
    if (active) onReady();
  });
  return () => {
    active = false;
  };
}

interface KineticHeadingProps {
  as?: "h1" | "h2" | "h3" | "span";
  className?: string;
  children: ReactNode;
  immediate?: boolean;
  delay?: number;
  reveal?: "words" | "mask-lines";
}

/**
 * Editorial masked-line or masked-word typographic reveal using GSAP 3.15 SplitText (`mask: "lines"`).
 * Leaves LCP copy visible at paint and plays bidirectionally on scroll unless reduced motion is active.
 */
export function KineticHeading({
  as: Tag = "h2",
  className = "",
  children,
  immediate = false,
  delay = 0,
  reveal = "words",
}: KineticHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [fontsReady, setFontsReady] = useState(() => sharedFontsResolved);
  const appReduced = useAppReducedMotion();

  useEffect(() => {
    if (fontsReady) return;
    return subscribeFontsReady(() => setFontsReady(true));
  }, [fontsReady]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !fontsReady || appReduced) return;

      const rect = el.getBoundingClientRect();
      const alreadyNearTop = immediate || rect.top < window.innerHeight * 0.94;
      let activeTween: gsap.core.Tween | null = null;
      const isLineReveal = reveal === "mask-lines";

      const split = SplitText.create(el, {
        type: isLineReveal ? "lines" : "lines,words",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) => {
          activeTween?.kill();
          const targets = isLineReveal ? self.lines : self.words;
          const staggerVal = isLineReveal ? 0.09 : MOTION.stagger.splitWords;
          activeTween = alreadyNearTop
            ? gsap.from(targets, {
                yPercent: 112,
                duration: immediate
                  ? MOTION.durations.kinetic
                  : MOTION.durations.kineticScroll,
                delay,
                stagger: staggerVal,
                ease: EASE.gsapOut,
                clearProps: "transform",
              })
            : gsap.from(targets, {
                yPercent: 112,
                duration: MOTION.durations.kineticScroll,
                delay,
                stagger: staggerVal,
                ease: EASE.gsapOut,
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
    {
      scope: ref,
      dependencies: [fontsReady, immediate, delay, reveal, appReduced],
      revertOnUpdate: true,
    }
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
  const [fontsReady, setFontsReady] = useState(() => sharedFontsResolved);
  const appReduced = useAppReducedMotion();

  useEffect(() => {
    if (fontsReady) return;
    return subscribeFontsReady(() => setFontsReady(true));
  }, [fontsReady]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !fontsReady || appReduced) return;

      const split = SplitText.create(el, {
        type: "words",
      });

      if (split.words.length === 0) return;

      gsap.set(split.words, { opacity: 0.52, y: 4 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 95%",
          end: "top 68%",
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
    { scope: ref, dependencies: [fontsReady, appReduced], revertOnUpdate: true }
  );

  return (
    <Tag ref={ref as React.RefObject<HTMLParagraphElement>} className={className}>
      {children}
    </Tag>
  );
}

interface OutlineFillTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scroll-scrubbed outline-to-fill display highlight: renders a precision cyan stroke
 * that fills horizontally with sky-blue gradient ink as the finale enters reading focus.
 */
export function OutlineFillText({ children, className = "" }: OutlineFillTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const appReduced = useAppReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (appReduced) {
        gsap.set(el, { clearProps: "backgroundSize" });
        return;
      }

      gsap.fromTo(
        el,
        { "--outline-fill": "0%" },
        {
          "--outline-fill": "100%",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 58%",
            scrub: MOTION.scrollTrigger.scrub,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    { scope: ref, dependencies: [appReduced], revertOnUpdate: true }
  );

  if (appReduced) {
    return <span className={`text-[#38BDF8] ${className}`}>{children}</span>;
  }

  return (
    <span
      ref={ref}
      data-outline-fill
      style={
        {
          "--outline-fill": "100%",
          WebkitTextStroke: "1px rgba(56, 189, 248, 0.78)",
          backgroundImage: "linear-gradient(90deg, #38BDF8 0%, #7DD3FC 100%)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 0",
          backgroundSize: "var(--outline-fill, 100%) 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        } as CSSProperties
      }
      className={`inline-block ${className}`}
    >
      {children}
    </span>
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
    { scope: ref, dependencies: [value, appReduced], revertOnUpdate: true }
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
