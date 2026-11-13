"use client";

import { useEffect, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";

function DemandLoop({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
    if (!active) return;

    let rafId = 0;
    const tick = () => {
      if (!document.hidden) {
        invalidate();
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(rafId);
  }, [active, invalidate]);

  return null;
}

export function ViewPortalInner({
  children,
  cameraPosition,
  fov,
  activeLoop,
}: {
  children: ReactNode;
  cameraPosition: [number, number, number];
  fov: number;
  activeLoop: boolean;
}) {
  return (
    <View className="h-full w-full">
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        fov={fov}
        near={0.1}
        far={100}
      />
      <DemandLoop active={activeLoop} />
      {children}
    </View>
  );
}

