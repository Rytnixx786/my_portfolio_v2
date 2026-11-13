"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { ViewportCanvas } from "./ViewportCanvas";

function GyroscopeMesh({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = progressRef.current * Math.PI * 2;
    if (outerRef.current) {
      outerRef.current.rotation.y += dt * 0.35;
      outerRef.current.rotation.x = 0.4 + p * 0.35;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x -= dt * 0.45;
      innerRef.current.rotation.z = p * 0.5;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.65 + p;
    }
  });

  return (
    <group>
      <mesh ref={outerRef}>
        <torusGeometry args={[1.05, 0.018, 12, 72]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
      </mesh>
      <mesh ref={innerRef}>
        <torusGeometry args={[0.74, 0.015, 12, 64]} />
        <meshBasicMaterial color="#8B949E" transparent opacity={0.45} />
      </mesh>
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color="#1C222B"
          emissive="#38BDF8"
          emissiveIntensity={0.65}
          wireframe
        />
      </mesh>
    </group>
  );
}

/**
 * Scroll-reactive 3D coordinate gyroscope pinned in the Experience header column.
 */
export function ChronologyGyro3D({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  return (
    <ViewportCanvas
      className="h-36 w-36"
      cameraPosition={[0, 0, 3.1]}
      fov={42}
      fallback={null}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[2, 2, 2]} intensity={1.4} color="#38BDF8" />
      <GyroscopeMesh progressRef={progressRef} />
    </ViewportCanvas>
  );
}

