"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { ViewportCanvas } from "./ViewportCanvas";

export type PlaygroundCameraPreset = "isometric" | "top" | "orbit";

interface PlaygroundPipeline3DProps {
  tab: "cinch" | "rag";
  scenarioId: string;
  stages: ReadonlyArray<{ id: string; label: string }>;
  activeStages: string[];
  statusColor: "#10B981" | "#38BDF8" | "#F59E0B" | "#EF4444";
  cameraPreset: PlaygroundCameraPreset;
}

const STATION_X = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0] as const;

function CameraTweenController({
  preset,
}: {
  preset: PlaygroundCameraPreset;
}) {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(0, 3.3, 6.2), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, -0.1, 0), []);

  useEffect(() => {
    if (preset === "isometric") {
      targetPos.set(0, 3.3, 6.2);
    } else if (preset === "top") {
      targetPos.set(0, 7.1, 1.35);
    }
  }, [preset, targetPos]);

  useFrame((_, delta) => {
    if (preset === "orbit") return;
    const dt = Math.min(delta, 0.05);
    camera.position.lerp(targetPos, Math.min(1, dt * 4.5));
    camera.lookAt(lookTarget);
  });

  return preset === "orbit" ? (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI * 0.48}
    />
  ) : null;
}

function PipelineDioramaScene({
  tab,
  scenarioId,
  stages,
  activeStages,
  statusColor,
  cameraPreset,
}: PlaygroundPipeline3DProps) {
  const breakerArmRef = useRef<THREE.Group>(null);
  const gpuTowerRef = useRef<THREE.Group>(null);
  const packetsRef = useRef<Array<THREE.Mesh | null>>([]);

  const maxTraversedIdx = Math.max(0, activeStages.length - 1);
  const endX = STATION_X[Math.min(maxTraversedIdx, STATION_X.length - 1)];

  const packetCurve = useMemo(() => {
    if (tab === "cinch" && scenarioId === "cache-hit") {
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(STATION_X[0], 0.42, 0),
        new THREE.Vector3(STATION_X[2], 0.42, 0),
        new THREE.Vector3(STATION_X[3], 0.48, 0),
        new THREE.Vector3(STATION_X[1], 1.28, -0.45),
        new THREE.Vector3(STATION_X[0], 0.42, 0),
      ]);
    }
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(STATION_X[0], 0.42, 0),
      new THREE.Vector3((STATION_X[0] + endX) * 0.5, 0.48, 0),
      new THREE.Vector3(endX, 0.42, 0),
    ]);
  }, [tab, scenarioId, endX]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    if (breakerArmRef.current) {
      const targetRot = scenarioId === "breaker-open" ? -Math.PI * 0.45 : 0;
      breakerArmRef.current.rotation.z +=
        (targetRot - breakerArmRef.current.rotation.z) * Math.min(1, dt * 8);
    }

    if (gpuTowerRef.current) {
      const spinSpeed = scenarioId === "cold-vllm" ? 1.5 : 0.18;
      gpuTowerRef.current.rotation.y += dt * spinSpeed;
    }

    const speed =
      scenarioId === "cold-vllm"
        ? 0.52
        : scenarioId === "cache-hit"
          ? 0.65
          : 0.35;

    packetsRef.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const t = (state.clock.elapsedTime * speed + idx * 0.25) % 1;
      packetCurve.getPointAt(t, mesh.position);
    });
  });

  return (
    <>
      <CameraTweenController preset={cameraPreset} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 7, 5]} intensity={1.25} color="#E6EDF3" />
      <pointLight position={[0, 3.5, 2]} intensity={1.6} color="#38BDF8" />

      {/* Machined Base Deck & Subtle Floor Grid */}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[10.4, 0.2, 3.2]} />
        <meshStandardMaterial color="#161B22" roughness={0.55} metalness={0.45} />
      </mesh>
      <gridHelper
        args={[10.2, 20, "#38BDF8", "#222A36"]}
        position={[0, -0.31, 0]}
      />

      {/* Base Horizontal Bus Spine */}
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 8.2, 12]} />
        <meshBasicMaterial color="#303946" />
      </mesh>

      {/* Active Signal Route Spine */}
      <mesh>
        <tubeGeometry args={[packetCurve, 44, 0.032, 10, false]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.78} />
      </mesh>

      {/* Streaming Token/Request Packets */}
      {[0, 1, 2, 3].map((idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            packetsRef.current[idx] = el;
          }}
        >
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
      ))}

      {/* 6 Architectural Stage Hardware Pedestals */}
      {stages.map((stage, idx) => {
        const x = STATION_X[idx] ?? 0;
        const isTraversed = activeStages.includes(stage.id);
        const isTerminal =
          isTraversed && idx === activeStages.length - 1;

        const nodeAccent = isTerminal
          ? statusColor
          : isTraversed
            ? "#38BDF8"
            : "#30363D";

        const isGpuStage = tab === "cinch" && stage.id === "vllm";
        const isBreakerStage = tab === "cinch" && stage.id === "breaker";

        return (
          <group key={stage.id} position={[x, 0, 0]}>
            {/* Pedestal Base */}
            <RoundedBox args={[1.06, 0.45, 1.06]} radius={0.07} smoothness={3} position={[0, -0.06, 0]}>
              <meshStandardMaterial
                color={isTraversed ? "#1C222B" : "#12161C"}
                roughness={0.35}
                metalness={0.65}
              />
            </RoundedBox>

            {/* Status Rim Ring */}
            <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.32, 0.39, 28]} />
              <meshBasicMaterial
                color={nodeAccent}
                transparent
                opacity={isTraversed ? 0.9 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Stage Core Geometry */}
            {isGpuStage ? (
              <group ref={gpuTowerRef} position={[0, 0.56, 0]}>
                {[0, 0.2, 0.4].map((layerY) => (
                  <mesh key={layerY} position={[0, layerY - 0.15, 0]}>
                    <boxGeometry args={[0.56, 0.1, 0.56]} />
                    <meshStandardMaterial
                      color={isTraversed ? "#38BDF8" : "#161B22"}
                      emissive={isTraversed ? "#38BDF8" : "#000000"}
                      emissiveIntensity={scenarioId === "cold-vllm" ? 0.6 : 0.08}
                      roughness={0.3}
                      metalness={0.7}
                    />
                  </mesh>
                ))}
              </group>
            ) : isBreakerStage ? (
              <group position={[0, 0.42, 0]}>
                <mesh>
                  <boxGeometry args={[0.42, 0.44, 0.42]} />
                  <meshStandardMaterial color="#1C222B" roughness={0.35} metalness={0.6} />
                </mesh>
                <group ref={breakerArmRef} position={[-0.18, 0.22, 0]}>
                  <mesh position={[0.24, 0.18, 0]}>
                    <boxGeometry args={[0.48, 0.08, 0.14]} />
                    <meshStandardMaterial
                      color={scenarioId === "breaker-open" ? "#EF4444" : "#38BDF8"}
                      emissive={scenarioId === "breaker-open" ? "#EF4444" : "#38BDF8"}
                      emissiveIntensity={scenarioId === "breaker-open" ? 0.9 : 0.35}
                    />
                  </mesh>
                </group>
              </group>
            ) : (
              <mesh position={[0, 0.48, 0]}>
                <octahedronGeometry args={[isTerminal ? 0.28 : 0.21, 0]} />
                <meshStandardMaterial
                  color={nodeAccent}
                  emissive={nodeAccent}
                  emissiveIntensity={isTerminal ? 0.85 : isTraversed ? 0.4 : 0.05}
                  roughness={0.28}
                  metalness={0.65}
                />
              </mesh>
            )}

            <Html
              position={[0, 1.15, 0]}
              center
              distanceFactor={8.2}
              zIndexRange={[10, 0]}
            >
              <div
                className={`whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${
                  isTerminal
                    ? "border-[#38BDF8] bg-[#0D1117]/95 font-semibold text-[#E6EDF3]"
                    : isTraversed
                      ? "border-[rgba(240,246,252,0.16)] bg-[#161B22]/90 text-[#8B949E]"
                      : "border-[rgba(240,246,252,0.06)] bg-[#0D1117]/75 text-[#6E7681]"
                }`}
              >
                {stage.label}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

/**
 * Interactive 3D request & token routing diorama coupled live to SystemsPlayground
 * scenario states and Bruno-Simon-style preset camera tweening.
 */
export function PlaygroundPipeline3D(props: PlaygroundPipeline3DProps) {
  return (
    <ViewportCanvas
      className="h-[290px] w-full rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[360px]"
      cameraPosition={[0, 3.3, 6.2]}
      fov={40}
      fallback={null}
    >
      <PipelineDioramaScene {...props} />
    </ViewportCanvas>
  );
}

