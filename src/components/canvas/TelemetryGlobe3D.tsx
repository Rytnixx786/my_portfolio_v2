"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ViewportCanvas } from "./ViewportCanvas";

// Dhaka coordinates: 23.8103° N, 90.4125° E
const DHAKA_LAT = (23.8103 * Math.PI) / 180;
const DHAKA_LON = (90.4125 * Math.PI) / 180;

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const x = -radius * Math.cos(lat) * Math.cos(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

function GlobeAssembly() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const dhakaPos = useMemo(() => latLonToVec3(DHAKA_LAT, DHAKA_LON, 1.32), []);

  const arcCurve = useMemo(() => {
    const remote = latLonToVec3((37.7749 * Math.PI) / 180, (-122.4194 * Math.PI) / 180, 1.32);
    const mid = dhakaPos.clone().add(remote).multiplyScalar(0.5).normalize().multiplyScalar(1.9);
    return new THREE.QuadraticBezierCurve3(dhakaPos, mid, remote);
  }, [dhakaPos]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.14;
    }
    if (pulseRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.28;
      pulseRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef} rotation={[0.18, -2.05, 0]}>
      {/* Slate Wireframe Globe */}
      <mesh>
        <icosahedronGeometry args={[1.3, 3]} />
        <meshBasicMaterial color="#303946" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Inner Dark Obsidian Core */}
      <mesh>
        <sphereGeometry args={[1.26, 28, 28]} />
        <meshStandardMaterial color="#0F141B" roughness={0.75} metalness={0.25} />
      </mesh>

      {/* Equator Telemetry Orbit */}
      <mesh rotation={[Math.PI / 2, 0.12, 0]}>
        <torusGeometry args={[1.65, 0.01, 10, 88]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.45} />
      </mesh>

      {/* Remote Deployment Telemetry Arc */}
      <mesh>
        <tubeGeometry args={[arcCurve, 36, 0.014, 8, false]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.7} />
      </mesh>

      {/* Dhaka Beacon */}
      <group position={dhakaPos}>
        <mesh>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial color="#10B981" />
        </mesh>
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.32} />
        </mesh>
        <Html position={[0, 0.2, 0]} center distanceFactor={5.8} zIndexRange={[8, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-[#38BDF8]/50 bg-[#0D1117]/90 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#E6EDF3]">
            Dhaka · UTC+6
          </div>
        </Html>
      </group>
    </group>
  );
}

/**
 * Interactive draggable 3D telemetry globe centered on Dhaka (UTC+6).
 */
export function TelemetryGlobe3D() {
  return (
    <ViewportCanvas
      className="h-[220px] w-full sm:h-[260px]"
      cameraPosition={[0, 0.25, 3.85]}
      fov={40}
      fallback={null}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 4]} intensity={1.1} color="#E6EDF3" />
      <pointLight position={[-3, 1, 2]} intensity={1.4} color="#38BDF8" />
      <GlobeAssembly />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
      />
    </ViewportCanvas>
  );
}

