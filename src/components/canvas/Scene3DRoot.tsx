"use client";

import { type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, View } from "@react-three/drei";
import * as THREE from "three";
import type { DeviceTier } from "@/lib/device-tier";

interface Scene3DRootProps {
  effectiveTier: DeviceTier;
  reducedMotion: boolean;
  eventSource: RefObject<HTMLDivElement | null>;
  onDowngrade: () => void;
  onContextLost: () => void;
  onContextRestored: () => void;
}

/**
 * Single root fixed WebGL <Canvas> (Section 7.3).
 * Keeps full-viewport compositor clean (no 100vw full-screen EffectComposer pass stalled on scroll)
 * and layers cleanly beneath Navbar (z-40) and interactive DOM UI.
 */
export function Scene3DRoot({
  effectiveTier,
  eventSource,
  onDowngrade,
  onContextLost,
  onContextRestored,
}: Scene3DRootProps) {
  const dpr: [number, number] = effectiveTier === "high" ? [1, 1.75] : [1, 1.25];

  return (
    <Canvas
      dpr={dpr}
      frameloop="demand"
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      gl={{
        antialias: effectiveTier === "high",
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={(state) => {
        const gl = state.gl;
        gl.setClearColor(0x000000, 0);
        const canvas = gl.domElement;

        canvas.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost();
          },
          false
        );

        canvas.addEventListener(
          "webglcontextrestored",
          () => {
            onContextRestored();
          },
          false
        );
      }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          if (effectiveTier === "high") {
            onDowngrade();
          }
        }}
      />

      <View.Port />
    </Canvas>
  );
}
