"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import {
  CHOREO,
  computeEnvelopePhases,
  createAppMatchMedia,
  EASE,
  MOTION,
  shouldReduceAppMotion,
} from "@/lib/motion";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export interface BidirectionalEnvelopeOptions {
  trigger?: HTMLElement;
  scrub?: number;
  enterOpacity?: number;
  enterY?: number;
  enterScale?: number;
  exitOpacity?: number;
  exitY?: number;
  exitScale?: number;
  exitBlurPx?: number;
  disableExitFade?: boolean;
  settleAtBottom?: boolean;
}

/**
 * Attaches a bidirectional ScrollTrigger scrub envelope:
 * - Phase 1 (Enter): smoothly fades, scales, and rises into the reading zone
 * - Phase 2 (Plateau): locks at crisp opacity 1, scale 1, y 0 while readable (top 15%-65% vh)
 * - Phase 3 (Exit Fade-Out): dims to a legible floor (>= 0.28) with optional micro-blur on text
 */
export function attachBidirectionalScrollEnvelope(
  el: HTMLElement,
  options: BidirectionalEnvelopeOptions = {}
): gsap.core.Timeline | gsap.core.Tween | null {
  if (shouldReduceAppMotion()) return null;

  const {
    trigger,
    scrub = MOTION.scrollTrigger.scrub,
    enterOpacity = 0.08,
    enterY = 44,
    enterScale = 0.94,
    exitOpacity = CHOREO.envelope.exitOpacity,
    exitY = -38,
    exitScale = 0.945,
    exitBlurPx: _exitBlurPx = 0,
    disableExitFade = false,
    settleAtBottom = false,
  } = options;
  void _exitBlurPx;

  const triggerEl = trigger ?? el;

  if (settleAtBottom) {
    return gsap.fromTo(
      el,
      { opacity: Math.max(0.18, enterOpacity), y: Math.min(24, enterY), scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: EASE.gsapOut,
        scrollTrigger: {
          trigger: triggerEl,
          start: "top 98%",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      }
    );
  }

  if (disableExitFade) {
    return gsap.fromTo(
      el,
      { opacity: enterOpacity, y: enterY, scale: enterScale },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: EASE.gsapOut,
        scrollTrigger: {
          trigger: triggerEl,
          start: CHOREO.envelope.start,
          end: "top 58%",
          scrub,
          invalidateOnRefresh: true,
        },
      }
    );
  }

  const vh = window.innerHeight || 800;
  const rectHeight = Math.max(60, triggerEl.offsetHeight || 280);
  const { enterDur, holdDur, exitDur } = computeEnvelopePhases(vh, rectHeight);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start: CHOREO.envelope.start,
      end: CHOREO.envelope.end,
      scrub,
      invalidateOnRefresh: true,
    },
  });

  tl.fromTo(
    el,
    { opacity: enterOpacity, y: enterY, scale: enterScale },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: enterDur,
      ease: EASE.gsapOut,
    },
    0
  ).fromTo(
    el,
    { opacity: 1, y: 0, scale: 1, immediateRender: false },
    {
      opacity: exitOpacity,
      y: exitY,
      scale: exitScale,
      duration: exitDur,
      ease: "sine.inOut",
      immediateRender: false,
    },
    enterDur + holdDur
  );

  return tl;
}

export type SectionRevealVariant =
  | "reveal"
  | "bento-cascade"
  | "scrub-depth"
  | "scroll-fade"
  | "mask-rise"
  | "clip-wipe"
  | "tilt-rise"
  | "settle";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: SectionRevealVariant;
  parallaxY?: number;
  disableExitFade?: boolean;
  settleAtBottom?: boolean;
}

/**
 * GSAP ScrollTrigger wrapper delivering per-chapter choreography presets
 * via gsap.matchMedia (desktopFine / mobile / appReduced) synchronized with Lenis.
 */
export function SectionReveal({
  children,
  className = "",
  variant = "reveal",
  parallaxY = 0,
  disableExitFade = false,
  settleAtBottom = false,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const appReduced = useAppReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const clearAll = () => {
        gsap.set(el, { clearProps: "transform,opacity,clipPath,filter" });
        const bentoItems = el.querySelectorAll("[data-bento-item]");
        if (bentoItems.length > 0) {
          gsap.set(bentoItems, { clearProps: "transform,opacity,clipPath,filter" });
        }
      };

      if (appReduced) {
        clearAll();
        return;
      }

      const mm = createAppMatchMedia().register(({ conditions }) => {
        if (conditions.appReduced) {
          clearAll();
          return;
        }

        const isMobile = conditions.mobile;

        if (parallaxY !== 0 && conditions.desktopFine) {
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

        if (variant === "bento-cascade") {
          const items = el.querySelectorAll<HTMLElement>("[data-bento-item]");
          if (items.length > 0) {
            items.forEach((item) => {
              attachBidirectionalScrollEnvelope(item, {
                enterOpacity: 0.14,
                enterY: isMobile ? 22 : 34,
                enterScale: isMobile ? 0.97 : 0.955,
                exitOpacity: CHOREO.envelope.exitOpacity,
                exitY: isMobile ? -18 : -30,
                exitScale: 0.96,
                exitBlurPx: 0,
                disableExitFade,
                settleAtBottom,
              });
            });
            return;
          }
        }

        if (variant === "clip-wipe") {
          gsap.fromTo(
            el,
            {
              clipPath: isMobile ? "inset(0 18% 0 0)" : "inset(0 100% 0 0)",
              opacity: 0.25,
            },
            {
              clipPath: "inset(0 0% 0 0)",
              opacity: 1,
              ease: EASE.gsapOut,
              scrollTrigger: {
                trigger: el,
                start: "top 92%",
                end: "top 64%",
                scrub: MOTION.scrollTrigger.scrub,
                invalidateOnRefresh: true,
              },
            }
          );
          if (!disableExitFade && !settleAtBottom) {
            attachBidirectionalScrollEnvelope(el, {
              enterOpacity: 1,
              enterY: 0,
              enterScale: 1,
              exitOpacity: CHOREO.envelope.exitOpacity,
              exitY: -22,
              exitScale: 0.98,
              exitBlurPx: 0,
            });
          }
          return;
        }

        if (variant === "tilt-rise") {
          gsap.fromTo(
            el,
            {
              rotateX: conditions.desktopFine ? 16 : 6,
              y: isMobile ? 20 : 30,
              opacity: 0.16,
              transformPerspective: 1200,
              transformOrigin: "center top",
            },
            {
              rotateX: 0,
              y: 0,
              opacity: 1,
              ease: EASE.gsapOut,
              scrollTrigger: {
                trigger: el,
                start: "top 92%",
                end: "top 60%",
                scrub: MOTION.scrollTrigger.scrub,
                invalidateOnRefresh: true,
              },
            }
          );
          return;
        }

        if (variant === "mask-rise") {
          const split = SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: MOTION.durations.kineticScroll,
                stagger: 0.08,
                ease: EASE.gsapOut,
                scrollTrigger: {
                  trigger: el,
                  start: "top 90%",
                  end: "bottom 10%",
                  toggleActions: "play reverse play reverse",
                },
              }),
          });
          return () => split.revert();
        }

        const isSettle = variant === "settle" || settleAtBottom;
        const isScrubDepth = variant === "scrub-depth" || variant === "scroll-fade";
        attachBidirectionalScrollEnvelope(el, {
          enterOpacity: isScrubDepth ? 0.14 : 0.18,
          enterY: isMobile ? 22 : isScrubDepth ? 42 : 30,
          enterScale: isScrubDepth ? 0.945 : 0.97,
          exitOpacity: CHOREO.envelope.exitOpacity,
          exitY: isMobile ? -18 : isScrubDepth ? -38 : -28,
          exitScale: isScrubDepth ? 0.955 : 0.972,
          exitBlurPx: 0,
          disableExitFade: disableExitFade || isSettle,
          settleAtBottom: isSettle,
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: ref, dependencies: [variant, parallaxY, disableExitFade, settleAtBottom, appReduced] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
