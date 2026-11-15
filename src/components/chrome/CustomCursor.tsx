"use client";

import { useEffect, useRef, useState } from "react";
import { shouldReduceAppMotion } from "@/lib/motion";

const INTERACTIVE_SNAP_SELECTOR =
  'a, button:not(:disabled):not([aria-disabled="true"]), [role="tab"]:not([aria-disabled="true"]), [role="button"]:not([aria-disabled="true"]), [role="slider"]:not([aria-disabled="true"]), [data-cursor-snap]:not([disabled]):not([aria-disabled="true"])';
const NATIVE_CURSOR_SELECTOR =
  'input, textarea, select, pre, code, button:disabled, [aria-disabled="true"], [contenteditable="true"], [data-native-cursor]';

export const RETICLE_CORNER_SIZE = 9;

export interface ReticleCornerCoordinates {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function computeReticleCornerPositions(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  cornerSize: number = RETICLE_CORNER_SIZE
): ReticleCornerCoordinates {
  const halfW = Math.max(cornerSize * 0.5, width * 0.5);
  const halfH = Math.max(cornerSize * 0.5, height * 0.5);
  return {
    left: centerX - halfW,
    right: centerX + halfW - cornerSize,
    top: centerY - halfH,
    bottom: centerY + halfH - cornerSize,
  };
}

/**
 * Precision "Telemetry Reticle" desktop cursor overlay.
 * Combines a zero-lag 5px center dot, smoothly lerped 4-corner brackets that lock onto
 * compact controls, and contextual monospace action badges ([data-cursor]) with
 * automatic suspension over text inputs, touch pointers, and 2D SAFE reduced motion.
 */
export function CustomCursor() {
  const [eligible, setEligible] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<HTMLDivElement>(null);
  const blRef = useRef<HTMLDivElement>(null);
  const brRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillTextRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const computeEligibility = () => {
      const fine =
        window.matchMedia?.("(hover: hover) and (any-pointer: fine)")?.matches ??
        false;
      const desktopViewport = (window.innerWidth || 0) >= 1024;
      const next = fine && desktopViewport && !shouldReduceAppMotion();
      setEligible(next);
      if (!next) {
        delete document.documentElement.dataset.customCursor;
      }
    };

    computeEligibility();
    const fineMq = window.matchMedia?.("(hover: hover) and (any-pointer: fine)");
    const motionMq = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    fineMq?.addEventListener?.("change", computeEligibility);
    motionMq?.addEventListener?.("change", computeEligibility);
    window.addEventListener("resize", computeEligibility);
    window.addEventListener("portfolio:motion-mode", computeEligibility);

    return () => {
      fineMq?.removeEventListener?.("change", computeEligibility);
      motionMq?.removeEventListener?.("change", computeEligibility);
      window.removeEventListener("resize", computeEligibility);
      window.removeEventListener("portfolio:motion-mode", computeEligibility);
      delete document.documentElement.dataset.customCursor;
    };
  }, []);

  useEffect(() => {
    if (!eligible) return;

    let rafId: number | null = null;
    let scrollSettleTimer: number | null = null;
    const pointerUpTimers = new Set<number>();
    let isDialogOpen = Boolean(document.querySelector("dialog[open]"));
    let insideWindow = false;
    let visible = false;
    let pressed = false;
    let lastDatasetActive: boolean | null = null;
    let currentLabel = "";
    let lastTarget: Element | null = null;
    let pendingTarget: Element | null = null;
    let hasPendingSync = false;
    let rectDirty = true;

    let cachedTargetEl: Element | null = null;
    let cachedSnapEl: Element | null = null;
    let cachedIsNative = false;
    let cachedLabel = "";
    let cachedInHero = false;
    let cachedSnapActive = false;
    let cachedSnapLeft = 0;
    let cachedSnapTop = 0;
    let cachedSnapWidth = 0;
    let cachedSnapHeight = 0;
    let snapTrackFrames = 0;

    let viewportW = window.innerWidth || 1440;
    let viewportH = window.innerHeight || 900;

    const ptr = { x: -200, y: -200 };
    const tgt = { x: -200, y: -200, w: 28, h: 28, reticleOpacity: 0.9 };
    const cur = { x: -200, y: -200, w: 28, h: 28, reticleOpacity: 0 };

    const overlay = overlayRef.current;

    const setCursorDatasetActive = (active: boolean) => {
      if (lastDatasetActive === active) return;
      lastDatasetActive = active;
      if (active) {
        document.documentElement.dataset.customCursor = "active";
      } else {
        delete document.documentElement.dataset.customCursor;
      }
    };

    const raiseToTopLayer = () => {
      if (!overlay || typeof overlay.showPopover !== "function") {
        delete document.documentElement.dataset.cursorTopLayer;
        return;
      }
      try {
        if (overlay.matches(":popover-open")) {
          overlay.hidePopover?.();
        }
        overlay.showPopover();
        if (overlay.matches(":popover-open")) {
          document.documentElement.dataset.cursorTopLayer = "true";
        } else {
          delete document.documentElement.dataset.cursorTopLayer;
        }
      } catch {
        delete document.documentElement.dataset.cursorTopLayer;
      }
    };

    const syncTargetUnderPointer = (el: Element | null) => {
      lastTarget = el;
      const targetChanged = el !== cachedTargetEl;
      const wasVisible = visible;

      if (targetChanged || rectDirty) {
        cachedTargetEl = el;
        rectDirty = false;

        if (!el || el.closest(NATIVE_CURSOR_SELECTOR)) {
          cachedIsNative = true;
          cachedLabel = "";
          cachedInHero = false;
          cachedSnapActive = false;
          cachedSnapEl = null;
        } else {
          cachedIsNative = false;
          const cursorHintEl = el.closest<HTMLElement>("[data-cursor]");
          cachedLabel = cursorHintEl?.getAttribute("data-cursor")?.trim() ?? "";
          cachedInHero = Boolean(el.closest("[data-cursor-hero]"));

          const snapEl = el.closest<HTMLElement>(INTERACTIVE_SNAP_SELECTOR);
          const rect = snapEl?.getBoundingClientRect();
          if (
            snapEl &&
            rect &&
            rect.width > 0 &&
            rect.width <= 380 &&
            rect.height > 0 &&
            rect.height <= 120
          ) {
            cachedSnapActive = true;
            cachedSnapEl = snapEl;
            cachedSnapLeft = rect.left;
            cachedSnapTop = rect.top;
            cachedSnapWidth = rect.width;
            cachedSnapHeight = rect.height;
            snapTrackFrames = Math.max(snapTrackFrames, 3);
          } else {
            cachedSnapActive = false;
            cachedSnapEl = null;
          }
        }
      }

      if (cachedIsNative) {
        setCursorDatasetActive(false);
        visible = false;
        cachedSnapActive = false;
        cachedSnapEl = null;
        cur.reticleOpacity = 0;
        cur.w = 28;
        cur.h = 28;
        if (dotRef.current) dotRef.current.style.opacity = "0";
        if (reticleRef.current) reticleRef.current.style.opacity = "0";
        if (pillRef.current) pillRef.current.style.opacity = "0";
        return;
      }

      setCursorDatasetActive(true);
      visible = true;

      if (!wasVisible) {
        cur.x = ptr.x;
        cur.y = ptr.y;
        cur.reticleOpacity = 0;
      }

      if (cachedLabel !== currentLabel) {
        currentLabel = cachedLabel;
        if (pillTextRef.current) {
          pillTextRef.current.textContent = cachedLabel;
        }
      }

      if (cachedSnapActive) {
        tgt.x = cachedSnapLeft + cachedSnapWidth * 0.5;
        tgt.y = cachedSnapTop + cachedSnapHeight * 0.5;
        tgt.w = cachedSnapWidth + 10;
        tgt.h = cachedSnapHeight + 8;
        tgt.reticleOpacity = 0.95;
      } else if (cachedLabel) {
        tgt.x = ptr.x;
        tgt.y = ptr.y;
        tgt.w = 34;
        tgt.h = 34;
        tgt.reticleOpacity = 0.88;
      } else if (cachedInHero) {
        tgt.x = ptr.x;
        tgt.y = ptr.y;
        tgt.w = 14;
        tgt.h = 14;
        tgt.reticleOpacity = 0.28;
      } else {
        tgt.x = ptr.x;
        tgt.y = ptr.y;
        tgt.w = 26;
        tgt.h = 26;
        tgt.reticleOpacity = 0.65;
      }
    };

    const updateImmediatePointerLayers = () => {
      if (!visible) return;
      if (dotRef.current) {
        dotRef.current.style.opacity = "1";
        dotRef.current.style.transform = `translate3d(${ptr.x.toFixed(1)}px, ${ptr.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${pressed ? 0.72 : 1})`;
      }
      if (pillRef.current) {
        if (cachedLabel) {
          const offsetX = ptr.x > viewportW - 165 ? -136 : 16;
          const offsetY = ptr.y > viewportH - 72 ? -36 : 18;
          pillRef.current.style.opacity = "1";
          pillRef.current.style.transform = `translate3d(${(ptr.x + offsetX).toFixed(1)}px, ${(ptr.y + offsetY).toFixed(1)}px, 0)`;
        } else {
          pillRef.current.style.opacity = "0";
        }
      }
    };

    const tick = () => {
      if (hasPendingSync) {
        hasPendingSync = false;
        const resolvedTarget =
          (pendingTarget && pendingTarget.isConnected ? pendingTarget : null) ??
          document.elementFromPoint(ptr.x, ptr.y);
        syncTargetUnderPointer(resolvedTarget);
        updateImmediatePointerLayers();
      }

      if (!visible) {
        rafId = null;
        return;
      }

      let snapRectMoved = false;
      if (cachedSnapActive) {
        if (!cachedSnapEl || !cachedSnapEl.isConnected) {
          cachedSnapActive = false;
          cachedSnapEl = null;
          cachedTargetEl = null;
          rectDirty = true;
          const fallbackEl = document.elementFromPoint(ptr.x, ptr.y);
          syncTargetUnderPointer(fallbackEl);
          updateImmediatePointerLayers();
          if (!visible) {
            rafId = null;
            return;
          }
        } else {
          const liveRect = cachedSnapEl.getBoundingClientRect();
          if (
            liveRect.width > 0 &&
            liveRect.width <= 380 &&
            liveRect.height > 0 &&
            liveRect.height <= 120
          ) {
            if (
              Math.abs(liveRect.left - cachedSnapLeft) >= 0.05 ||
              Math.abs(liveRect.top - cachedSnapTop) >= 0.05 ||
              Math.abs(liveRect.width - cachedSnapWidth) >= 0.05 ||
              Math.abs(liveRect.height - cachedSnapHeight) >= 0.05
            ) {
              cachedSnapLeft = liveRect.left;
              cachedSnapTop = liveRect.top;
              cachedSnapWidth = liveRect.width;
              cachedSnapHeight = liveRect.height;
              tgt.x = cachedSnapLeft + cachedSnapWidth * 0.5;
              tgt.y = cachedSnapTop + cachedSnapHeight * 0.5;
              tgt.w = cachedSnapWidth + 10;
              tgt.h = cachedSnapHeight + 8;
              snapRectMoved = true;
            }
          } else {
            cachedSnapActive = false;
            cachedSnapEl = null;
            cachedTargetEl = null;
            rectDirty = true;
            hasPendingSync = true;
          }
        }
      }

      if (snapTrackFrames > 0) {
        snapTrackFrames -= 1;
      }

      const scaleFactor = pressed ? 0.84 : 1;
      const desiredW = tgt.w * scaleFactor;
      const desiredH = tgt.h * scaleFactor;

      cur.x += (tgt.x - cur.x) * 0.22;
      cur.y += (tgt.y - cur.y) * 0.22;
      cur.w += (desiredW - cur.w) * 0.22;
      cur.h += (desiredH - cur.h) * 0.22;
      cur.reticleOpacity += (tgt.reticleOpacity - cur.reticleOpacity) * 0.24;

      const settled =
        !hasPendingSync &&
        !snapRectMoved &&
        snapTrackFrames === 0 &&
        Math.abs(tgt.x - cur.x) < 0.2 &&
        Math.abs(tgt.y - cur.y) < 0.2 &&
        Math.abs(desiredW - cur.w) < 0.3 &&
        Math.abs(desiredH - cur.h) < 0.3 &&
        Math.abs(tgt.reticleOpacity - cur.reticleOpacity) < 0.01;

      if (settled) {
        cur.x = tgt.x;
        cur.y = tgt.y;
        cur.w = desiredW;
        cur.h = desiredH;
        cur.reticleOpacity = tgt.reticleOpacity;
      }

      const { left, right, top, bottom } = computeReticleCornerPositions(
        cur.x,
        cur.y,
        cur.w,
        cur.h
      );
      const leftPx = left.toFixed(1);
      const rightPx = right.toFixed(1);
      const topPx = top.toFixed(1);
      const bottomPx = bottom.toFixed(1);

      if (reticleRef.current) {
        reticleRef.current.style.opacity = cur.reticleOpacity.toFixed(3);
      }
      if (tlRef.current) {
        tlRef.current.style.transform = `translate3d(${leftPx}px, ${topPx}px, 0)`;
      }
      if (trRef.current) {
        trRef.current.style.transform = `translate3d(${rightPx}px, ${topPx}px, 0)`;
      }
      if (blRef.current) {
        blRef.current.style.transform = `translate3d(${leftPx}px, ${bottomPx}px, 0)`;
      }
      if (brRef.current) {
        brRef.current.style.transform = `translate3d(${rightPx}px, ${bottomPx}px, 0)`;
      }

      if (settled) {
        rafId = null;
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const ensureTick = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const hideCursor = () => {
      insideWindow = false;
      visible = false;
      pressed = false;
      hasPendingSync = false;
      cachedSnapActive = false;
      cachedSnapEl = null;
      cachedTargetEl = null;
      lastTarget = null;
      pendingTarget = null;
      snapTrackFrames = 0;
      cur.x = -200;
      cur.y = -200;
      cur.w = 28;
      cur.h = 28;
      cur.reticleOpacity = 0;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      setCursorDatasetActive(false);
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (reticleRef.current) reticleRef.current.style.opacity = "0";
      if (pillRef.current) pillRef.current.style.opacity = "0";
    };

    const resetPressed = () => {
      if (!pressed) return;
      pressed = false;
      updateImmediatePointerLayers();
      ensureTick();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        hideCursor();
        return;
      }
      insideWindow = true;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      if (cur.x < -100) {
        cur.x = ptr.x;
        cur.y = ptr.y;
      }
      if (cachedSnapActive) {
        snapTrackFrames = Math.max(snapTrackFrames, 3);
      }
      pendingTarget = e.target instanceof Element ? e.target : null;
      hasPendingSync = true;
      ensureTick();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        hideCursor();
        return;
      }
      if (e.button === 1) return;
      insideWindow = true;
      pressed = true;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      if (cur.x < -100) {
        cur.x = ptr.x;
        cur.y = ptr.y;
      }
      if (cachedSnapActive) {
        snapTrackFrames = Math.max(snapTrackFrames, 3);
      }
      pendingTarget = e.target instanceof Element ? e.target : lastTarget;
      rectDirty = true;
      hasPendingSync = true;
      ensureTick();

      if (visible && pulseRef.current) {
        const pulse = pulseRef.current;
        pulse.style.setProperty("--px", `${ptr.x.toFixed(1)}px`);
        pulse.style.setProperty("--py", `${ptr.y.toFixed(1)}px`);
        pulse.classList.remove("cursor-pulse-active");
        void pulse.offsetWidth;
        pulse.classList.add("cursor-pulse-active");
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        hideCursor();
        return;
      }
      if (e.button === 1) return;
      pressed = false;
      if (cachedSnapActive) {
        snapTrackFrames = Math.max(snapTrackFrames, 3);
      }
      updateImmediatePointerLayers();
      ensureTick();
      for (const delay of [24, 150]) {
        const tid = window.setTimeout(() => {
          pointerUpTimers.delete(tid);
          if (!insideWindow || ptr.x < -100) return;
          rectDirty = true;
          pendingTarget = null;
          hasPendingSync = true;
          ensureTick();
        }, delay);
        pointerUpTimers.add(tid);
      }
    };

    const syncPointerFromViewport = () => {
      if (!insideWindow || ptr.x < -100) return;
      rectDirty = true;
      pendingTarget = null;
      hasPendingSync = true;
      ensureTick();
    };

    const onScroll = () => {
      rectDirty = true;
      if (!insideWindow || ptr.x < -100) return;
      if (isDialogOpen) {
        pendingTarget = null;
        hasPendingSync = true;
        ensureTick();
        return;
      }
      if (cachedSnapActive) {
        cachedSnapActive = false;
        cachedSnapEl = null;
        cachedTargetEl = null;
        snapTrackFrames = 0;
        tgt.x = ptr.x;
        tgt.y = ptr.y;
        tgt.w = cachedInHero ? 14 : 26;
        tgt.h = cachedInHero ? 14 : 26;
        tgt.reticleOpacity = cachedInHero ? 0.28 : 0.65;
        ensureTick();
      }
      if (scrollSettleTimer !== null) {
        window.clearTimeout(scrollSettleTimer);
      }
      scrollSettleTimer = window.setTimeout(() => {
        scrollSettleTimer = null;
        syncPointerFromViewport();
      }, 120);
    };

    const onViewportResize = () => {
      viewportW = window.innerWidth || 1440;
      viewportH = window.innerHeight || 900;
      rectDirty = true;
    };

    const onMouseLeave = () => {
      hideCursor();
    };

    const onTopLayerRaise = () => {
      raiseToTopLayer();
      syncPointerFromViewport();
      window.requestAnimationFrame(syncPointerFromViewport);
    };

    raiseToTopLayer();

    const dialogObserver = new MutationObserver((mutations) => {
      let sawDialogOpen = false;
      let sawDialogClose = false;
      for (const m of mutations) {
        if (m.target instanceof HTMLDialogElement) {
          if (m.target.open) {
            sawDialogOpen = true;
          } else {
            sawDialogClose = true;
          }
        }
      }
      if (sawDialogOpen) {
        isDialogOpen = true;
        onTopLayerRaise();
      } else if (sawDialogClose) {
        isDialogOpen = Boolean(document.querySelector("dialog[open]"));
        syncPointerFromViewport();
        window.requestAnimationFrame(syncPointerFromViewport);
      }
    });
    dialogObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["open"],
      subtree: true,
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", resetPressed, { passive: true });
    window.addEventListener("contextmenu", resetPressed, { passive: true });
    window.addEventListener("blur", hideCursor);
    window.addEventListener("touchstart", hideCursor, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onViewportResize, { passive: true });
    window.addEventListener("portfolio:top-layer-raise", onTopLayerRaise);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    return () => {
      dialogObserver.disconnect();
      if (scrollSettleTimer !== null) window.clearTimeout(scrollSettleTimer);
      for (const tid of pointerUpTimers) window.clearTimeout(tid);
      pointerUpTimers.clear();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", resetPressed);
      window.removeEventListener("contextmenu", resetPressed);
      window.removeEventListener("blur", hideCursor);
      window.removeEventListener("touchstart", hideCursor);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onViewportResize);
      window.removeEventListener("portfolio:top-layer-raise", onTopLayerRaise);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      try {
        if (overlay?.matches?.(":popover-open")) {
          overlay.hidePopover?.();
        }
      } catch {
        // Ignore teardown errors
      }
      delete document.documentElement.dataset.customCursor;
      delete document.documentElement.dataset.cursorTopLayer;
    };
  }, [eligible]);

  if (!eligible) return null;

  return (
    <div
      ref={overlayRef}
      popover="manual"
      data-custom-cursor-overlay
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {/* Zero-lag 5px Cyan Core Point */}
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-[5px] w-[5px] rounded-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-opacity duration-150"
        style={{ opacity: 0 }}
      />

      {/* Lerped 4-Corner Telemetry Brackets (4 independent unscaled 9x9 corners via pure GPU translate3d) */}
      <div
        ref={reticleRef}
        data-cursor-reticle
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0,
          willChange: "opacity",
        }}
      >
        <div
          ref={tlRef}
          data-cursor-corner="tl"
          className="absolute left-0 top-0 h-[9px] w-[9px] border-t-[1.5px] border-l-[1.5px] border-[#38BDF8]"
          style={{ willChange: "transform" }}
        />
        <div
          ref={trRef}
          data-cursor-corner="tr"
          className="absolute left-0 top-0 h-[9px] w-[9px] border-t-[1.5px] border-r-[1.5px] border-[#38BDF8]"
          style={{ willChange: "transform" }}
        />
        <div
          ref={blRef}
          data-cursor-corner="bl"
          className="absolute left-0 top-0 h-[9px] w-[9px] border-b-[1.5px] border-l-[1.5px] border-[#38BDF8]"
          style={{ willChange: "transform" }}
        />
        <div
          ref={brRef}
          data-cursor-corner="br"
          className="absolute left-0 top-0 h-[9px] w-[9px] border-b-[1.5px] border-r-[1.5px] border-[#38BDF8]"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* Contextual Action Label Pill */}
      <div
        ref={pillRef}
        className="fixed left-0 top-0 rounded-full border border-[#38BDF8]/45 bg-[#0D1117]/92 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7DD3FC] shadow-[0_10px_28px_rgba(0,0,0,0.75)] backdrop-blur-md transition-opacity duration-150"
        style={{ opacity: 0 }}
      >
        <span ref={pillTextRef} />
      </div>

      {/* Click Telemetry Pulse Ring */}
      <div
        ref={pulseRef}
        className="fixed left-0 top-0 h-8 w-8 rounded-full border border-[#38BDF8]/70 opacity-0"
      />
    </div>
  );
}
