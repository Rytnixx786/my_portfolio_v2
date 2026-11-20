"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  focusWebGLSlotLoop,
  getSlotStoreSnapshot,
  isWebGLScrollBursting,
  releaseWebGLSlot,
  requestWebGLSlot,
  setWebGLSlotInView,
  subscribeSlotStore,
  subscribeWebGLScrollBurst,
} from "@/components/canvas/WebGLContextProvider";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { shouldShowViewport2DFallback } from "@/lib/device-tier";
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
  occluded?: boolean;
  style?: React.CSSProperties;
}

// Serialize non-eager WebGL context creation across frames and defer during active
// scroll bursts so scrolling never stalls on synchronous WebGL2 / GLSL shader compilation.
let nextCanvasMountSlotMs = 0;
function claimStaggeredMountDelayMs(): number {
  const now = performance.now();
  const scheduled = Math.max(now, nextCanvasMountSlotMs);
  nextCanvasMountSlotMs = scheduled + 75;
  return Math.max(0, scheduled - now);
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
  occluded = false,
  style,
}: ViewportCanvasProps) {
  const slotId = useId();
  const {
    hasMounted,
    canRender3D,
    effectiveTier,
    isStaticPose,
    setContextLost,
  } = useCanRender3D();

  const subscribeSlot = useCallback(
    (listener: () => void) => subscribeSlotStore(slotId, listener),
    [slotId]
  );
  const slotMask = useSyncExternalStore(
    subscribeSlot,
    () => getSlotStoreSnapshot(slotId),
    () => 0
  );
  const rawHasSlot = (slotMask & 2) !== 0;
  const isPoolSaturated = !rawHasSlot && (slotMask & 1) !== 0;
  const loopAllowed = (slotMask & 4) !== 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [nearView, setNearView] = useState(eager);
  const [mountAllowed, setMountAllowed] = useState(eager);
  const [glReady, setGlReady] = useState(false);
  const [fallbackDismissed, setFallbackDismissed] = useState(false);
  const [slotWaitElapsed, setSlotWaitElapsed] = useState(false);
  const prevHasSlotRef = useRef(false);
  const readyThisMountRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.bottom >= -240 && rect.top <= vh + 240) {
      setNearView(true);
    }
    if (rect.bottom >= 0 && rect.top <= vh) {
      setInView(true);
    }

    // Asymmetric hysteresis: acquire within 240px of entry, retain until 900px outside viewport
    const enterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNearView(true);
          }
        }
      },
      { rootMargin: "240px 0px" }
    );

    const exitObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            setNearView(false);
          }
        }
      },
      { rootMargin: "900px 0px" }
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { rootMargin: "0px" }
    );

    enterObserver.observe(el);
    exitObserver.observe(el);
    activeObserver.observe(el);

    return () => {
      enterObserver.disconnect();
      exitObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  const effectiveInView = inView && !occluded;

  useEffect(() => {
    if (!canRender3D) {
      releaseWebGLSlot(slotId);
      return;
    }
    if (nearView) {
      requestWebGLSlot(slotId, effectiveInView);
    } else {
      releaseWebGLSlot(slotId);
    }
  }, [canRender3D, nearView, effectiveInView, slotId]);

  useEffect(() => {
    setWebGLSlotInView(slotId, canRender3D && effectiveInView);
  }, [canRender3D, effectiveInView, slotId]);

  useEffect(() => {
    return () => {
      releaseWebGLSlot(slotId);
    };
  }, [slotId]);

  const rawAllocatedSlot = canRender3D && nearView && rawHasSlot;

  useEffect(() => {
    if (!rawAllocatedSlot) {
      if (!eager) {
        const raf = window.requestAnimationFrame(() => setMountAllowed(false));
        return () => window.cancelAnimationFrame(raf);
      }
      return;
    }
    if (eager || mountAllowed) return;

    let cancelled = false;
    let timerId: number | null = null;

    const scheduleMount = () => {
      if (cancelled || timerId !== null || isWebGLScrollBursting()) return;
      const delay = claimStaggeredMountDelayMs();
      timerId = window.setTimeout(() => {
        timerId = null;
        if (cancelled || isWebGLScrollBursting()) return;
        setMountAllowed(true);
      }, delay);
    };

    const unsubScroll = subscribeWebGLScrollBurst((scrolling) => {
      if (!scrolling) {
        scheduleMount();
      }
    });

    scheduleMount();

    return () => {
      cancelled = true;
      unsubScroll();
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [rawAllocatedSlot, eager, mountAllowed]);

  const hasSlot = rawAllocatedSlot && (eager || mountAllowed);
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
    const wasActive = prevHasSlotRef.current;
    prevHasSlotRef.current = hasSlot;

    if (!hasSlot) {
      readyThisMountRef.current = false;
      const raf = window.requestAnimationFrame(() => {
        setGlReady(false);
        setFallbackDismissed(false);
      });
      return () => window.cancelAnimationFrame(raf);
    }

    if (!wasActive && !readyThisMountRef.current) {
      const raf = window.requestAnimationFrame(() => {
        if (!readyThisMountRef.current) {
          setGlReady(false);
          setFallbackDismissed(false);
        }
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
    if (!prevHasSlotRef.current) return;
    readyThisMountRef.current = true;
    setGlReady(true);
  }, []);

  // Gate offscreen 2D fallbacks so off-screen SVG/SMIL/RAF layers stay unmounted until within 240px
  const isNearOrActive = eager || nearView || inView;
  const shouldRender2DFallback =
    isNearOrActive &&
    shouldShowViewport2DFallback({
      hasMounted,
      canRender3D,
      hasLoadingFallback: Boolean(loadingFallback),
      hasSlot,
      isPoolSaturated,
      slotWaitElapsed,
    });
  const showUnderlay = !hasSlot || !fallbackDismissed;
  const crossfadeDuration = isStaticPose
    ? "0ms"
    : `${Math.round(MOTION.durations.crossfade * 1000)}ms`;

  return (
    <div
      ref={containerRef}
      onPointerEnter={() => focusWebGLSlotLoop(slotId)}
      onPointerDown={() => focusWebGLSlotLoop(slotId)}
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
        <div
          className="relative z-0 h-full w-full transition-opacity"
          style={{
            opacity: canvasReady ? 0 : 1,
            transitionDuration: crossfadeDuration,
            transitionTimingFunction: MOTION.easeEditorial,
            pointerEvents: canvasReady ? "none" : undefined,
          }}
        >
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
            activeLoop={!isStaticPose && effectiveInView && (loopAllowed || !glReady)}
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
