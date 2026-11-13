"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

/**
 * GPU-accelerated magnetic wrapper for primary interactive buttons and links.
 * Disables offset on touch pointers and when prefers-reduced-motion is active.
 */
export function MagneticButton({
  children,
  className = "",
  strength = 0.24,
}: MagneticButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const enabledRef = useRef(false);

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? false;
    enabledRef.current = !reduced && finePointer;

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const tick = useCallback(() => {
    const el = wrapRef.current;
    if (!el) {
      rafRef.current = null;
      return;
    }

    const cur = currentRef.current;
    const tgt = targetRef.current;
    cur.x += (tgt.x - cur.x) * 0.16;
    cur.y += (tgt.y - cur.y) * 0.16;

    el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;

    if (
      Math.abs(tgt.x - cur.x) < 0.08 &&
      Math.abs(tgt.y - cur.y) < 0.08 &&
      tgt.x === 0 &&
      tgt.y === 0
    ) {
      el.style.transform = "translate3d(0px, 0px, 0)";
      rafRef.current = null;
      return;
    }

    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabledRef.current || e.pointerType === "touch") return;
      const el = wrapRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width * 0.5);
      const dy = e.clientY - (rect.top + rect.height * 0.5);

      targetRef.current = {
        x: Math.max(-14, Math.min(14, dx * strength)),
        y: Math.max(-10, Math.min(10, dy * strength)),
      };

      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    },
    [strength, tick]
  );

  const handlePointerLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    if (enabledRef.current && rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(tick);
    }
  }, [tick]);

  return (
    <div
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}

