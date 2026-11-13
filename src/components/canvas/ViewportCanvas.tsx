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
  style?: React.CSSProperties;
}

/**
 * Viewport-aware single-context <View> container (Section 7.3).
 * Renders children into the single root Scene3DRoot canvas when visible,
 * falling back cleanly to 2D SVG/DOM plates with 0 KB initial Three.js bundle.
 */
export function ViewportCanvas({
  children,
  fallback = null,
  className = "h-full w-full",
  cameraPosition = [0, 0, 5.5],
  fov = 42,
  style,
}: ViewportCanvasProps) {
  const { canRender3D, isStaticPose } = useCanRender3D();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { rootMargin: "160px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={style}>
      {canRender3D && inView ? (
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
