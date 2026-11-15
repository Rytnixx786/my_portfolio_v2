"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { MOTION } from "@/lib/motion";
import { LocalCanvasInner } from "./LocalCanvasInner";

interface ViewportCanvasProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  readyGate?: boolean;
  onCanvasReadyChange?: (ready: boolean) => void;
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
  loadingFallback,
  readyGate = true,
  onCanvasReadyChange,
  className = "h-full w-full",
  cameraPosition = [0, 0, 5.5],
  fov = 42,
  maxDpr,
  eager = false,
  style,
}: ViewportCanvasProps) {
  const slotId = useId();
  const {
    hasMounted,
    canRender3D,
    effectiveTier,
    isStaticPose,
    maxSlots,
    activeSlotIds,
    requestSlot,
    releaseSlot,
    setContextLost,
  } = useCanRender3D();

  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [nearView, setNearView] = useState(eager);
  const [glReady, setGlReady] = useState(false);
  const [fallbackDismissed, setFallbackDismissed] = useState(false);
  const [slotWaitElapsed, setSlotWaitElapsed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.bottom >= -280 && rect.top <= vh + 280) {
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
      { rootMargin: "280px 0px" }
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
  const isPoolSaturated = maxSlots > 0 && activeSlotIds.size >= maxSlots;
  const canvasReady = hasSlot && glReady && readyGate;
  const dpr: [number, number] =
    maxDpr ?? (effectiveTier === "high" ? [1, 1.5] : [1, 1.25]);

  useEffect(() => {
    if (hasMounted && canRender3D && nearView && !hasSlot && isPoolSaturated) {
      const timer = window.setTimeout(() => {
        setSlotWaitElapsed(true);
      }, 80);
      return () => window.clearTimeout(timer);
    }
    const raf = window.requestAnimationFrame(() => {
      setSlotWaitElapsed(false);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [hasMounted, canRender3D, nearView, hasSlot, isPoolSaturated]);

  useEffect(() => {
    if (!hasSlot) {
      const raf = window.requestAnimationFrame(() => {
        setGlReady(false);
        setFallbackDismissed(false);
      });
      return () => window.cancelAnimationFrame(raf);
    }
    if (!canvasReady) return;
    const delayMs = isStaticPose ? 0 : Math.round(MOTION.durations.crossfade * 1000);
    const timer = window.setTimeout(() => {
      setFallbackDismissed(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [hasSlot, canvasReady, isStaticPose]);

  useEffect(() => {
    onCanvasReadyChange?.(canvasReady);
  }, [canvasReady, onCanvasReadyChange]);

  const handleCanvasReady = useCallback(() => {
    setGlReady(true);
  }, []);

  // Only render the 2D fallback when 3D is genuinely disabled or denied a saturated pool slot.
  // When a dedicated loadingFallback is provided (e.g., HeroOrbitalCore3D), never mount the 2D
  // fallback just because the viewport is offscreen or booting, avoiding duplicate asset loads and flashes.
  const shouldRender2DFallback =
    hasMounted &&
    (!canRender3D ||
      (!loadingFallback && !nearView) ||
      (!hasSlot && isPoolSaturated && slotWaitElapsed));
  const showUnderlay = !hasSlot || !fallbackDismissed;
  const crossfadeDuration = isStaticPose
    ? "0ms"
    : `${Math.round(MOTION.durations.crossfade * 1000)}ms`;

  return (
    <div
      ref={containerRef}
      data-cursor={hasSlot && canRender3D && !isStaticPose ? "DRAG · ORBIT" : undefined}
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
      {showUnderlay && (
        <div className="relative z-0 h-full w-full">
          {shouldRender2DFallback
            ? fallback
            : (loadingFallback ?? (
                <div className="h-full w-full bg-[#0D1117]" aria-hidden="true" />
              ))}
        </div>
      )}

      {hasSlot && (
        <div
          className="absolute inset-0 z-10 transition-opacity"
          style={{
            opacity: canvasReady ? 1 : 0,
            transitionDuration: crossfadeDuration,
            transitionTimingFunction: MOTION.easeEditorial,
          }}
        >
          <LocalCanvasInner
            cameraPosition={cameraPosition}
            fov={fov}
            dpr={dpr}
            antialias={effectiveTier !== "low"}
            activeLoop={!isStaticPose && inView}
            isStaticPose={isStaticPose}
            onCanvasReady={handleCanvasReady}
            onDecline={() => {
              // Keep slot count stable; local DPR adaptation avoids context thrashing
            }}
            onContextLost={() => setContextLost(true)}
            onContextRestored={() => setContextLost(false)}
          >
            {children}
          </LocalCanvasInner>
        </div>
      )}
    </div>
  );
}
