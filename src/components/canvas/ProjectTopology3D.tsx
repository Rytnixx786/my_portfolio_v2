"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ViewportCanvas } from "./ViewportCanvas";

interface ProjectTopology3DProps {
  slug: string;
  className?: string;
}

function CinchGpuSculpture() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const bypassCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, 0.25, 0.35),
      new THREE.Vector3(-0.35, 0.95, 0.45),
      new THREE.Vector3(0.65, 0.72, -0.15),
      new THREE.Vector3(1.35, 0.15, -0.3),
    ]);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.32;
    }
    if (pulseRef.current) {
      const t = (state.clock.elapsedTime * 0.48) % 1;
      bypassCurve.getPointAt(t, pulseRef.current.position);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stacked GPU VRAM Shards */}
      {[-0.48, -0.16, 0.16, 0.48].map((y, idx) => (
        <group key={y} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[1.38, 0.12, 0.92]} />
            <meshStandardMaterial
              color={idx === 2 ? "#1C222B" : "#161B22"}
              roughness={0.35}
              metalness={0.7}
            />
          </mesh>
          <mesh position={[0.66, 0, 0.42]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color={idx === 3 ? "#10B981" : "#38BDF8"} />
          </mesh>
        </group>
      ))}

      {/* CPU ONNX Semantic Cache Bypass Arc */}
      <mesh>
        <tubeGeometry args={[bypassCurve, 40, 0.024, 8, false]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.8} />
      </mesh>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
    </group>
  );
}

function NexusGraphSculpture() {
  const groupRef = useRef<THREE.Group>(null);

  const ringNodes = useMemo(() => {
    return Array.from({ length: 8 }, (_, idx) => {
      const a = (idx / 8) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(a) * 1.05,
        Math.sin(idx * 1.4) * 0.25,
        Math.sin(a) * 1.05
      );
    });
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.36;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Postgres Checkpointer Core */}
      <mesh>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#1C222B"
          emissive="#38BDF8"
          emissiveIntensity={0.4}
          wireframe
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.015, 12, 80]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.55} />
      </mesh>

      {ringNodes.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[idx % 2 === 0 ? 0.11 : 0.085, 16, 16]} />
          <meshStandardMaterial
            color={idx === 0 || idx === 7 ? "#38BDF8" : "#161B22"}
            emissive={idx % 3 === 0 ? "#38BDF8" : "#10B981"}
            emissiveIntensity={0.65}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function AresGateSculpture() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.55;
    }
  });

  const bars = [
    { x: -0.9, h: 0.72 },
    { x: -0.45, h: 1.05 },
    { x: 0, h: 0.9 },
    { x: 0.45, h: 1.15 },
    { x: 0.9, h: 1.25 },
  ];

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      {/* Threshold CI Gate Plane (92%+) */}
      <mesh position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.35, 1.35]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
        />
      </mesh>

      {bars.map((bar, idx) => (
        <mesh key={bar.x} position={[bar.x, bar.h * 0.5, 0]}>
          <boxGeometry args={[0.26, bar.h, 0.26]} />
          <meshStandardMaterial
            color={idx >= 3 ? "#38BDF8" : "#1C222B"}
            emissive={idx >= 3 ? "#38BDF8" : "#10B981"}
            emissiveIntensity={0.35}
            roughness={0.3}
            metalness={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Interactive procedural 3D hardware/topology miniature tailored to Tier-1
 * flagship architectures (Cinch, Nexus Researcher, ARES).
 */
export function ProjectTopology3D({
  slug,
  className = "h-48 sm:h-56 w-full",
}: ProjectTopology3DProps) {
  return (
    <ViewportCanvas
      className={className}
      cameraPosition={[0, 0.75, 3.25]}
      fov={42}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={1.2} color="#E6EDF3" />
      <pointLight position={[-2.5, 1, 2.5]} intensity={1.6} color="#38BDF8" />

      {slug === "cinch" ? (
        <CinchGpuSculpture />
      ) : slug === "nexus-researcher" ? (
        <NexusGraphSculpture />
      ) : (
        <AresGateSculpture />
      )}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
      />
    </ViewportCanvas>
  );
}

