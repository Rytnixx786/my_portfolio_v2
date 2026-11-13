"use client";

import { Component, type ReactNode, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, View } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { DeviceTier } from "@/lib/device-tier";

interface EffectBoundaryProps {
  children: ReactNode;
}

class PostProcessingBoundary extends Component<
  EffectBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

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
 * All 3D scenes across the site portal into this single GL context via drei <View.Port />.
 */
export function Scene3DRoot({
  effectiveTier,
  reducedMotion,
  eventSource,
  onDowngrade,
  onContextLost,
  onContextRestored,
}: Scene3DRootProps) {
  const dpr: [number, number] = effectiveTier === "high" ? [1, 1.85] : [1, 1.35];

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

      {effectiveTier === "high" && !reducedMotion && (
        <PostProcessingBoundary>
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom
              mipmapBlur
              luminanceThreshold={0.95}
              luminanceSmoothing={0.25}
              intensity={0.42}
              radius={0.58}
            />
            <Vignette eskil={false} offset={0.2} darkness={0.42} />
          </EffectComposer>
        </PostProcessingBoundary>
      )}
    </Canvas>
  );
}

