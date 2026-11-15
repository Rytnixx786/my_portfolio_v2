"use client";

import { useEffect, useRef, useState } from "react";
import { shouldReduceAppMotion } from "@/lib/motion";

const INTERACTIVE_SNAP_SELECTOR =
  'a, button, [role="tab"], [role="button"], [role="slider"], [data-cursor-snap]';
const NATIVE_CURSOR_SELECTOR =
  'input, textarea, select, pre, code, [contenteditable="true"], [data-native-cursor]';

/**
 * Precision "Telemetry Reticle" desktop cursor overlay.
 * Combines a zero-lag 5px center dot, smoothly lerped 4-corner brackets that lock onto
 * compact controls, and contextual monospace action badges ([data-cursor]) with
 * automatic suspension over text inputs, touch pointers, and 2D SAFE reduced motion.
 */
export function CustomCursor() {
  const [eligible, setEligible] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillTextRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const computeEligibility = () => {
      const fine =
        window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ??
        false;
      const desktopViewport = (window.innerWidth || 0) >= 1024;
      const next = fine && desktopViewport && !shouldReduceAppMotion();
      setEligible(next);
      if (!next) {
        delete document.documentElement.dataset.customCursor;
      }
    };

    computeEligibility();
    const fineMq = window.matchMedia?.("(hover: hover) and (pointer: fine)");
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
    let visible = false;
    let pressed = false;
    let currentLabel = "";
    let lastTarget: HTMLElement | null = null;

    const ptr = { x: -200, y: -200 };
    const tgt = { x: -200, y: -200, w: 28, h: 28, reticleOpacity: 0.9 };
    const cur = { x: -200, y: -200, w: 28, h: 28, reticleOpacity: 0 };

    const syncTargetUnderPointer = (el: HTMLElement | null) => {
      lastTarget = el;
      if (!el || el.closest(NATIVE_CURSOR_SELECTOR)) {
        delete document.documentElement.dataset.customCursor;
        visible = false;
        if (dotRef.current) dotRef.current.style.opacity = "0";
        if (reticleRef.current) reticleRef.current.style.opacity = "0";
        if (pillRef.current) pillRef.current.style.opacity = "0";
        return;
      }

      document.documentElement.dataset.customCursor = "active";
      visible = true;

      const cursorHintEl = el.closest<HTMLElement>("[data-cursor]");
      const label = cursorHintEl?.getAttribute("data-cursor")?.trim() ?? "";

      if (label !== currentLabel) {
        currentLabel = label;
        if (pillTextRef.current) {
          pillTextRef.current.textContent = label;
        }
      }

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
        tgt.x = rect.left + rect.width * 0.5;
        tgt.y = rect.top + rect.height * 0.5;
        tgt.w = rect.width + 10;
        tgt.h = rect.height + 8;
        tgt.reticleOpacity = 0.95;
      } else if (label) {
        tgt.x = ptr.x;
        tgt.y = ptr.y;
        tgt.w = 34;
        tgt.h = 34;
        tgt.reticleOpacity = 0.88;
      } else if (el.closest("[data-cursor-hero]")) {
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

      if (dotRef.current) {
        dotRef.current.style.opacity = "1";
        dotRef.current.style.transform = `translate3d(${ptr.x.toFixed(1)}px, ${ptr.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${pressed ? 0.72 : 1})`;
      }

      if (pillRef.current) {
        if (label) {
          const vw = window.innerWidth || 1440;
          const vh = window.innerHeight || 900;
          const offsetX = ptr.x > vw - 165 ? -136 : 16;
          const offsetY = ptr.y > vh - 72 ? -36 : 18;
          pillRef.current.style.opacity = "1";
          pillRef.current.style.transform = `translate3d(${(ptr.x + offsetX).toFixed(1)}px, ${(ptr.y + offsetY).toFixed(1)}px, 0)`;
        } else {
          pillRef.current.style.opacity = "0";
        }
      }
    };

    const tick = () => {
      if (!visible) {
        rafId = null;
        return;
      }

      const scaleFactor = pressed ? 0.84 : 1;
      const desiredW = tgt.w * scaleFactor;
      const desiredH = tgt.h * scaleFactor;

      cur.x += (tgt.x - cur.x) * 0.2;
      cur.y += (tgt.y - cur.y) * 0.2;
      cur.w += (desiredW - cur.w) * 0.2;
      cur.h += (desiredH - cur.h) * 0.2;
      cur.reticleOpacity += (tgt.reticleOpacity - cur.reticleOpacity) * 0.22;

      if (reticleRef.current) {
        reticleRef.current.style.opacity = cur.reticleOpacity.toFixed(3);
        reticleRef.current.style.width = `${cur.w.toFixed(1)}px`;
        reticleRef.current.style.height = `${cur.h.toFixed(1)}px`;
        reticleRef.current.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }

      if (
        Math.abs(tgt.x - cur.x) < 0.2 &&
        Math.abs(tgt.y - cur.y) < 0.2 &&
        Math.abs(desiredW - cur.w) < 0.3 &&
        Math.abs(desiredH - cur.h) < 0.3 &&
        Math.abs(tgt.reticleOpacity - cur.reticleOpacity) < 0.01
      ) {
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

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      if (cur.x < -100) {
        cur.x = ptr.x;
        cur.y = ptr.y;
      }
      const target =
        e.target instanceof HTMLElement ? e.target : document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      syncTargetUnderPointer(target);
      ensureTick();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pressed = true;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      syncTargetUnderPointer(
        e.target instanceof HTMLElement ? e.target : lastTarget
      );
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
      if (e.pointerType === "touch") return;
      pressed = false;
      const syncNow = () => {
        const currentEl = document.elementFromPoint(ptr.x, ptr.y) as HTMLElement | null;
        syncTargetUnderPointer(currentEl ?? lastTarget);
        ensureTick();
      };
      window.setTimeout(syncNow, 24);
      window.setTimeout(syncNow, 150);
    };

    const onScroll = () => {
      if (!visible || ptr.x < -100) return;
      const currentEl = document.elementFromPoint(ptr.x, ptr.y) as HTMLElement | null;
      syncTargetUnderPointer(currentEl ?? lastTarget);
      ensureTick();
    };

    const onMouseLeave = () => {
      visible = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (reticleRef.current) reticleRef.current.style.opacity = "0";
      if (pillRef.current) pillRef.current.style.opacity = "0";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      delete document.documentElement.dataset.customCursor;
    };
  }, [eligible]);

  if (!eligible) return null;

  return (
    <div
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

      {/* Lerped 4-Corner Telemetry Brackets */}
      <div
        ref={reticleRef}
        className="fixed left-0 top-0"
        style={{ opacity: 0, width: 28, height: 28 }}
      >
        <span className="absolute left-0 top-0 h-2 w-2 border-l-[1.5px] border-t-[1.5px] border-[#38BDF8]" />
        <span className="absolute right-0 top-0 h-2 w-2 border-r-[1.5px] border-t-[1.5px] border-[#38BDF8]" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b-[1.5px] border-l-[1.5px] border-[#38BDF8]" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-b-[1.5px] border-r-[1.5px] border-[#38BDF8]" />
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
