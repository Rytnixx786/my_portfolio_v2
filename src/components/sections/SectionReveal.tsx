"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION, shouldReduceAppMotion } from "@/lib/motion";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface BidirectionalEnvelopeOptions {
  trigger?: HTMLElement;
  scrub?: number;
  enterOpacity?: number;
  enterY?: number;
  enterScale?: number;
  exitOpacity?: number;
  exitY?: number;
  exitScale?: number;
  disableExitFade?: boolean;
  settleAtBottom?: boolean;
}

/**
 * Attaches a bidirectional ScrollTrigger scrub envelope:
 * - Phase 1 (Enter): smoothly fades, scales, and rises into the reading zone
 * - Phase 2 (Plateau): locks at crisp opacity 1, scale 1, y 0 while active
 * - Phase 3 (Exit Fade-Out): smoothly dims, scales back, and recedes as it exits top
 */
export function attachBidirectionalScrollEnvelope(
  el: HTMLElement,
  options: BidirectionalEnvelopeOptions = {}
): gsap.core.Timeline | gsap.core.Tween | null {
  if (shouldReduceAppMotion()) return null;

  const {
    trigger,
    scrub = MOTION.scrollTrigger.scrub,
    enterOpacity = 0.05,
    enterY = 48,
    enterScale = 0.93,
    exitOpacity = 0.05,
    exitY = -46,
    exitScale = 0.935,
    disableExitFade = false,
    settleAtBottom = false,
  } = options;

  const triggerEl = trigger ?? el;

  if (settleAtBottom) {
    return gsap.fromTo(
      el,
      { opacity: Math.max(0.14, enterOpacity), y: Math.min(24, enterY), scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power2.out",
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
        ease: "power2.out",
        scrollTrigger: {
          trigger: triggerEl,
          start: "top 96%",
          end: "top 60%",
          scrub,
          invalidateOnRefresh: true,
        },
      }
    );
  }

  const vh = window.innerHeight || 800;
  const rectHeight = Math.max(80, triggerEl.offsetHeight || 280);
  // Active viewport travel from "top 96%" (bottom edge) to "bottom 10%" (below fixed navbar)
  const totalTravel = Math.max(1, 0.86 * vh + rectHeight);
  // Enter finishes cleanly once top reaches ~58% viewport height
  const enterDur = Math.min(0.4, Math.max(0.14, (0.38 * vh) / totalTravel));
  // Exit begins around bottom 44% and completes smoothly at bottom 10% (below navbar)
  const exitDur = Math.min(0.38, Math.max(0.16, (0.34 * vh) / totalTravel));
  const holdDur = Math.max(0.16, 1 - enterDur - exitDur);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start: "top 96%",
      end: "bottom 10%",
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
      ease: "power2.out",
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

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "reveal" | "bento-cascade" | "scrub-depth" | "scroll-fade";
  parallaxY?: number;
  disableExitFade?: boolean;
  settleAtBottom?: boolean;
}

/**
 * GSAP ScrollTrigger wrapper delivering continuous bidirectional enter -> hold -> exit fade-out
 * depth choreography synchronized with Lenis scroll telemetry.
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

      if (appReduced) {
        gsap.set(el, { clearProps: "transform,opacity" });
        const bentoItems = el.querySelectorAll("[data-bento-item]");
        if (bentoItems.length > 0) {
          gsap.set(bentoItems, { clearProps: "transform,opacity" });
        }
        return;
      }

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

      if (variant === "bento-cascade") {
        const items = el.querySelectorAll<HTMLElement>("[data-bento-item]");
        if (items.length > 0) {
          items.forEach((item) => {
            attachBidirectionalScrollEnvelope(item, {
              enterOpacity: 0.12,
              enterY: 36,
              enterScale: 0.955,
              exitOpacity: 0.1,
              exitY: -32,
              exitScale: 0.96,
              disableExitFade,
              settleAtBottom,
            });
          });
          return;
        }
      }

      const isScrubDepth = variant === "scrub-depth" || variant === "scroll-fade";
      attachBidirectionalScrollEnvelope(el, {
        enterOpacity: isScrubDepth ? 0.1 : 0.14,
        enterY: isScrubDepth ? 48 : 34,
        enterScale: isScrubDepth ? 0.935 : 0.965,
        exitOpacity: isScrubDepth ? 0.08 : 0.12,
        exitY: isScrubDepth ? -46 : -32,
        exitScale: isScrubDepth ? 0.945 : 0.968,
        disableExitFade,
        settleAtBottom,
      });
    },
    { scope: ref, dependencies: [variant, parallaxY, disableExitFade, settleAtBottom, appReduced] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
