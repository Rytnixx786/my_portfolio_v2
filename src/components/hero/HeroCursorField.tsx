"use client";

import { useEffect, useRef, type RefObject } from "react";
import { shouldReduceAppMotion } from "@/lib/motion";

interface HeroCursorFieldProps {
  containerRef: RefObject<HTMLElement | null>;
  accentColor?: string;
}

interface PulseWave {
  x: number;
  y: number;
  start: number;
}

/**
 * Lightweight 2D Canvas precision blueprint lattice scoped strictly to the Hero section.
 * Responds to fine pointer movement with a damped cyan optical illumination lens,
 * calibrated crosshair ticks, magnetic dot displacement, proximity constellation links,
 * and click telemetry pulses while keeping the native OS cursor intact.
 */
export function HeroCursorField({
  containerRef,
  accentColor = "#38BDF8",
}: HeroCursorFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = shouldReduceAppMotion();
    const isCoarseOnly =
      window.matchMedia?.("(pointer: coarse) and (hover: none)").matches ?? false;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId: number | null = null;
    let inView = true;

    const pointer = { x: -9999, y: -9999, active: false };
    const smoothPtr = { x: -9999, y: -9999, strength: 0 };
    const pulses: PulseWave[] = [];

    const SPACING = 40;
    const INFLUENCE_RADIUS = 200;
    const LINK_RADIUS = 116;

    let points: Array<{ bx: number; by: number; isAnchor: boolean }> = [];

    const rebuildGrid = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const offsetX = (width - (cols - 1) * SPACING) * 0.5;
      const offsetY = (height - (rows - 1) * SPACING) * 0.5;

      points = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          points.push({
            bx: offsetX + c * SPACING,
            by: offsetY + r * SPACING,
            isAnchor: r % 2 === 0 && c % 2 === 0,
          });
        }
      }
    };

    const drawStaticGrid = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.isAnchor) {
          ctx.strokeStyle = "rgba(157, 167, 179, 0.14)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.bx - 2.5, p.by);
          ctx.lineTo(p.bx + 2.5, p.by);
          ctx.moveTo(p.bx, p.by - 2.5);
          ctx.lineTo(p.bx, p.by + 2.5);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(157, 167, 179, 0.12)";
          ctx.beginPath();
          ctx.arc(p.bx, p.by, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const hex = accentColor.replace("#", "");
    const rAcc = Number.parseInt(hex.slice(0, 2), 16) || 56;
    const gAcc = Number.parseInt(hex.slice(2, 4), 16) || 189;
    const bAcc = Number.parseInt(hex.slice(4, 6), 16) || 248;

    const renderFrame = (now: number) => {
      rafId = null;
      if (!inView || isCoarseOnly) return;

      // Smoothly damp cursor coordinates & optical lens strength (fade out cleanly on leave)
      const targetStrength = pointer.active ? 1 : 0;
      smoothPtr.strength += (targetStrength - smoothPtr.strength) * 0.14;

      if (pointer.active) {
        if (smoothPtr.x < -1000) {
          smoothPtr.x = pointer.x;
          smoothPtr.y = pointer.y;
        } else {
          const damp = reducedMotion ? 0.25 : 0.18;
          smoothPtr.x += (pointer.x - smoothPtr.x) * damp;
          smoothPtr.y += (pointer.y - smoothPtr.y) * damp;
        }
      }

      ctx.clearRect(0, 0, width, height);

      while (pulses.length > 0 && now - pulses[0].start > 1250) {
        pulses.shift();
      }

      const hasCursor = smoothPtr.strength > 0.02 && smoothPtr.x > -500;
      const lensStrength = smoothPtr.strength;

      // Calibrated cyan optical spotlight + subtle blueprint alignment hairlines
      if (hasCursor) {
        const grad = ctx.createRadialGradient(
          smoothPtr.x,
          smoothPtr.y,
          0,
          smoothPtr.x,
          smoothPtr.y,
          290
        );
        grad.addColorStop(0, `rgba(${rAcc}, ${gAcc}, ${bAcc}, ${(0.11 * lensStrength).toFixed(3)})`);
        grad.addColorStop(0.4, `rgba(${rAcc}, ${gAcc}, ${bAcc}, ${(0.036 * lensStrength).toFixed(3)})`);
        grad.addColorStop(1, "rgba(13, 17, 23, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Subtle optical reticle ring & clipped crosshairs around pointer (surface effect, native cursor kept)
        ctx.save();
        ctx.strokeStyle = `rgba(${rAcc}, ${gAcc}, ${bAcc}, ${(0.18 * lensStrength).toFixed(3)})`;
        ctx.lineWidth = 0.85;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(smoothPtr.x, smoothPtr.y, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Dual-ring telemetry ripples from background clicks
      for (let k = 0; k < pulses.length; k++) {
        const pulse = pulses[k];
        const age = (now - pulse.start) / 1250;
        const radius = 14 + age * 250;
        const alpha = (1 - age) * 0.36;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rAcc}, ${gAcc}, ${bAcc}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();

        if (age > 0.08) {
          const innerR = 8 + (age - 0.08) * 185;
          const innerAlpha = (1 - age) * 0.2;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, innerR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rAcc}, ${gAcc}, ${bAcc}, ${innerAlpha.toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      const activeNodes: Array<{ x: number; y: number; energy: number }> = [];
      const pushScale = reducedMotion ? 2.8 : 7.5;

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        let x = pt.bx;
        let y = pt.by;
        let energy = 0;

        if (hasCursor) {
          const dx = x - smoothPtr.x;
          const dy = y - smoothPtr.y;
          const dist = Math.hypot(dx, dy);
          if (dist < INFLUENCE_RADIUS && dist > 0.01) {
            const falloff = 1 - dist / INFLUENCE_RADIUS;
            const eased = falloff * falloff * lensStrength;
            const push = eased * pushScale;
            x += (dx / dist) * push;
            y += (dy / dist) * push;
            energy = Math.max(energy, eased);
          }
        }

        if (!reducedMotion) {
          for (let k = 0; k < pulses.length; k++) {
            const pulse = pulses[k];
            const age = (now - pulse.start) / 1250;
            const waveR = 14 + age * 250;
            const dx = x - pulse.x;
            const dy = y - pulse.y;
            const dist = Math.hypot(dx, dy);
            const band = Math.abs(dist - waveR);
            if (band < 40 && dist > 0.01) {
              const waveE = (1 - band / 40) * (1 - age);
              x += (dx / dist) * waveE * 5.2;
              y += (dy / dist) * waveE * 5.2;
              energy = Math.max(energy, waveE * 0.9);
            }
          }
        }

        if (energy > 0.07 && hasCursor) {
          const d = Math.hypot(x - smoothPtr.x, y - smoothPtr.y);
          if (d < LINK_RADIUS) {
            activeNodes.push({ x, y, energy });
          }
        }

        if (pt.isAnchor && energy <= 0.06) {
          ctx.strokeStyle = "rgba(157, 167, 179, 0.14)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x - 2.5, y);
          ctx.lineTo(x + 2.5, y);
          ctx.moveTo(x, y - 2.5);
          ctx.lineTo(x, y + 2.5);
          ctx.stroke();
        } else {
          const radius = (pt.isAnchor ? 1.15 : 0.9) + energy * 1.25;
          const alpha = 0.13 + energy * 0.65;
          ctx.fillStyle =
            energy > 0.05
              ? `rgba(${rAcc}, ${gAcc}, ${bAcc}, ${alpha.toFixed(3)})`
              : "rgba(157, 167, 179, 0.12)";
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Whisper-thin precision constellation links around optical lens
      if (activeNodes.length > 1) {
        ctx.lineWidth = 0.8;
        for (let i = 0; i < activeNodes.length; i++) {
          const a = activeNodes[i];
          for (let j = i + 1; j < activeNodes.length; j++) {
            const b = activeNodes[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < SPACING * 1.55) {
              const linkAlpha = Math.min(a.energy, b.energy) * 0.28;
              ctx.strokeStyle = `rgba(${rAcc}, ${gAcc}, ${bAcc}, ${linkAlpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      const dxSettle = pointer.active ? Math.abs(pointer.x - smoothPtr.x) : 0;
      const dySettle = pointer.active ? Math.abs(pointer.y - smoothPtr.y) : 0;
      const strengthSettling =
        Math.abs(targetStrength - smoothPtr.strength) > 0.015;

      if (
        pointer.active ||
        pulses.length > 0 ||
        strengthSettling ||
        (smoothPtr.x > -500 && (dxSettle > 0.4 || dySettle > 0.4))
      ) {
        rafId = window.requestAnimationFrame(renderFrame);
      } else if (!pointer.active && smoothPtr.strength <= 0.015) {
        smoothPtr.x = -9999;
        smoothPtr.y = -9999;
        smoothPtr.strength = 0;
        drawStaticGrid();
      }
    };

    const scheduleFrame = () => {
      if (rafId === null && inView && !isCoarseOnly) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    rebuildGrid();
    drawStaticGrid();

    if (isCoarseOnly) {
      const onResizeStatic = () => {
        rebuildGrid();
        drawStaticGrid();
      };
      window.addEventListener("resize", onResizeStatic, { passive: true });
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      scheduleFrame();
    };

    const onPointerLeave = () => {
      pointer.active = false;
      scheduleFrame();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, .r3f-local-canvas")) return;
      const rect = container.getBoundingClientRect();
      pulses.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        start: performance.now(),
      });
      if (pulses.length > 4) pulses.shift();
      scheduleFrame();
    };

    const onResize = () => {
      rebuildGrid();
      if (!pointer.active && pulses.length === 0) {
        drawStaticGrid();
      } else {
        scheduleFrame();
      }
    };

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                inView = entry.isIntersecting;
                if (inView && (pointer.active || pulses.length > 0)) {
                  scheduleFrame();
                } else if (!inView && rafId !== null) {
                  window.cancelAnimationFrame(rafId);
                  rafId = null;
                }
              }
            },
            { threshold: 0 }
          )
        : null;

    observer?.observe(container);
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave, { passive: true });
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [containerRef, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
