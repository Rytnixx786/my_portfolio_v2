"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";

const LazyViewPortal = dynamic(
  () => import("./ViewPortalInner").then((mod) => mod.ViewPortalInner),
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
 * Viewport-aware single-context <View> container (Section 7.3).
 * Latches mounted once entered so textures & GLSL shaders never recompile when scrolling back,
 * while pausing frame ticks cleanly when off-screen.
 */
export function ViewportCanvas({
  children,
  fallback = null,
  className = "h-full w-full",
  cameraPosition = [0, 0, 5.5],
  fov = 42,
  eager = false,
  style,
}: ViewportCanvasProps) {
  const { canRender3D, isStaticPose } = useCanRender3D();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [hasEntered, setHasEntered] = useState(eager);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const visible = entry.isIntersecting;
          setInView(visible);
          if (visible) {
            setHasEntered(true);
          }
        }
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ touchAction: "pan-y", ...style }}
    >
      {canRender3D && hasEntered ? (
        <LazyViewPortal
          cameraPosition={cameraPosition}
          fov={fov}
          activeLoop={!isStaticPose && inView}
        >
          {children}
        </LazyViewPortal>
      ) : (
        fallback
      )}
    </div>
  );
}
