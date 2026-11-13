"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";

const LazyLocalCanvas = dynamic(
  () => import("./LocalCanvasInner").then((mod) => mod.LocalCanvasInner),
  { ssr: false }
);

interface ViewportCanvasProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  maxDpr?: [number, number];
  eager?: boolean;
  style?: React.CSSProperties;
}

/**
 * Container-scoped WebGL viewport managed by the global LRU context slot pool.
 * Renders <Canvas> directly inside the card's overflow-hidden frame so 3D scenes
 * stay 100% locked to scroll on the GPU compositor with zero displacement or spillover.
 */
export function ViewportCanvas({
  children,
  fallback = null,
  className = "h-full w-full",
  cameraPosition = [0, 0, 5.5],
  fov = 42,
  maxDpr,
  eager = false,
  style,
}: ViewportCanvasProps) {
  const slotId = useId();
  const {
    canRender3D,
    effectiveTier,
    isStaticPose,
    activeSlotIds,
    requestSlot,
    releaseSlot,
    setContextLost,
  } = useCanRender3D();

  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [nearView, setNearView] = useState(eager);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.bottom >= -100 && rect.top <= vh + 100) {
      setNearView(true);
    }
    if (rect.bottom >= -40 && rect.top <= vh + 40) {
      setInView(true);
    }

    const nearObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setNearView(entry.isIntersecting);
        }
      },
      { rootMargin: "100px 0px" }
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { rootMargin: "40px 0px" }
    );

    nearObserver.observe(el);
    activeObserver.observe(el);

    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!canRender3D) {
      releaseSlot(slotId);
      return;
    }
    if (nearView) {
      requestSlot(slotId, eager || inView);
    } else {
      releaseSlot(slotId);
    }
  }, [canRender3D, nearView, inView, eager, slotId, requestSlot, releaseSlot]);

  useEffect(() => {
    return () => {
      releaseSlot(slotId);
    };
  }, [slotId, releaseSlot]);

  const hasSlot = canRender3D && nearView && activeSlotIds.has(slotId);
  const dpr: [number, number] =
    maxDpr ?? (effectiveTier === "high" ? [1, 1.5] : [1, 1.25]);

  return (
    <div
      ref={containerRef}
      data-slot-state={
        hasSlot
          ? "active"
          : !canRender3D
            ? "disabled"
            : !nearView
              ? "out-of-view"
              : "pool-queued"
      }
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: "pan-y", ...style }}
    >
      {hasSlot ? (
        <LazyLocalCanvas
          cameraPosition={cameraPosition}
          fov={fov}
          dpr={dpr}
          antialias={effectiveTier !== "low"}
          activeLoop={!isStaticPose && inView}
          onDecline={() => {
            // Keep slot count stable; local DPR adaptation avoids context thrashing
          }}
          onContextLost={() => setContextLost(true)}
          onContextRestored={() => setContextLost(false)}
        >
          {children}
        </LazyLocalCanvas>
      ) : (
        fallback
      )}
    </div>
  );
}
