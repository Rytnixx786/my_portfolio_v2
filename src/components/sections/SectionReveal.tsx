"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "reveal" | "parallax";
}

/**
 * Lightweight IntersectionObserver CSS compositor reveal (opacity + translate3d),
 * avoiding GSAP ScrollTrigger jitter during smooth scrolling.
 */
export function SectionReveal({
  children,
  className = "",
  delayMs = 0,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96) return;

    const frame = window.requestAnimationFrame(() => {
      setVisible(false);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "80px 0px", threshold: 0.04 }
    );

    observer.observe(el);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={delayMs ? { transitionDelay: `${Math.min(delayMs, 160)}ms` } : undefined}
      className={`transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
