"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { getCachedElementRect, primeElementRect } from "@/hooks/usePortfolioUtils";
import { shouldReduceAppMotion } from "@/lib/motion";

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
  const targetRef = useRef({ x: 0, y: 0, scale: 1 });
  const currentRef = useRef({ x: 0, y: 0, scale: 1 });
  const enabledRef = useRef(false);

  useEffect(() => {
    const syncMotion = () => {
      const finePointer =
        window.matchMedia?.("(any-pointer: fine)")?.matches ?? true;
      enabledRef.current = !shouldReduceAppMotion() && finePointer;
    };
    syncMotion();
    window.addEventListener("portfolio:motion-mode", syncMotion);
    const el = wrapRef.current;

    return () => {
      window.removeEventListener("portfolio:motion-mode", syncMotion);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (el) {
        el.style.willChange = "auto";
      }
    };
  }, []);

  const scheduleTick = useCallback(() => {
    if (rafRef.current !== null) return;
    const step = () => {
      const el = wrapRef.current;
      if (!el) {
        rafRef.current = null;
        return;
      }

      const cur = currentRef.current;
      const tgt = targetRef.current;
      cur.x += (tgt.x - cur.x) * 0.16;
      cur.y += (tgt.y - cur.y) * 0.16;
      cur.scale += (tgt.scale - cur.scale) * 0.28;

      el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0) scale(${cur.scale.toFixed(4)})`;

      if (
        Math.abs(tgt.x - cur.x) < 0.08 &&
        Math.abs(tgt.y - cur.y) < 0.08 &&
        Math.abs(tgt.scale - cur.scale) < 0.002 &&
        tgt.x === 0 &&
        tgt.y === 0 &&
        tgt.scale === 1
      ) {
        el.style.transform = "translate3d(0px, 0px, 0) scale(1)";
        el.style.willChange = "auto";
        rafRef.current = null;
        return;
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
  }, []);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabledRef.current || e.pointerType === "touch") return;
      const el = wrapRef.current;
      if (!el) return;
      primeElementRect(el);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabledRef.current || e.pointerType === "touch") return;
      const el = wrapRef.current;
      if (!el) return;

      el.style.willChange = "transform";
      const rect = getCachedElementRect(el);
      const dx = e.clientX - (rect.left + rect.width * 0.5);
      const dy = e.clientY - (rect.top + rect.height * 0.5);

      targetRef.current = {
        ...targetRef.current,
        x: Math.max(-14, Math.min(14, dx * strength)),
        y: Math.max(-10, Math.min(10, dy * strength)),
      };

      scheduleTick();
    },
    [strength, scheduleTick]
  );

  const handlePointerDown = useCallback(() => {
    if (!enabledRef.current) return;
    targetRef.current.scale = 0.97;
    scheduleTick();
  }, [scheduleTick]);

  const handlePointerUp = useCallback(() => {
    if (!enabledRef.current) return;
    targetRef.current.scale = 1;
    scheduleTick();
  }, [scheduleTick]);

  const handlePointerLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0, scale: 1 };
    if (enabledRef.current) {
      scheduleTick();
    }
  }, [scheduleTick]);

  return (
    <div
      ref={wrapRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
      className={`inline-block ${className}`}
    >
      {children}
    </div>
  );
}

