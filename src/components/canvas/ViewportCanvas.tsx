"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, type RootState } from "@react-three/fiber";
import type * as THREE from "three";
import { useWebGLContext } from "./WebGLContextProvider";

interface ViewportCanvasProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  maxDpr?: [number, number];
  onCreated?: (state: RootState) => void;
  style?: React.CSSProperties;
}

/**
 * Viewport-aware Three.js canvas wrapper that mounts/unmounts WebGL contexts via
 * IntersectionObserver proximity so simultaneous browser WebGL contexts stay <= 4
 * (preventing Chrome context-loss eviction) and degrades cleanly to 2D-Safe DOM fallbacks.
 */
export function ViewportCanvas({
  children,
  fallback = null,
  className = "h-full w-full",
  cameraPosition = [0, 0, 5.5],
  fov = 42,
  maxDpr,
  onCreated,
  style,
}: ViewportCanvasProps) {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(true);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const mountObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setNearViewport(entry.isIntersecting);
        }
      },
      { rootMargin: "320px 0px" }
    );

    const playObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { rootMargin: "80px 0px" }
    );

    mountObserver.observe(el);
    playObserver.observe(el);
    return () => {
      mountObserver.disconnect();
      playObserver.disconnect();
    };
  }, []);

  const webglReady = hasMounted && webglSupported && effectiveTier !== "low";
  const shouldRenderCanvas = webglReady && nearViewport;
  const dpr: [number, number] =
    maxDpr ?? (effectiveTier === "high" ? [1, 1.85] : [1, 1.3]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={style}>
      {shouldRenderCanvas ? (
        <Canvas
          dpr={dpr}
          frameloop={inView ? "always" : "never"}
          camera={{ position: cameraPosition, fov, near: 0.1, far: 100 }}
          gl={{
            antialias: effectiveTier === "high",
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={(state) => {
            (state.gl as THREE.WebGLRenderer).setClearColor(0x000000, 0);
            onCreated?.(state);
          }}
          className="h-full w-full"
        >
          {children}
        </Canvas>
      ) : (
        fallback
      )}
    </div>
  );
}
