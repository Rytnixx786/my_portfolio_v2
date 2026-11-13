"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { STATE_FAULT, STATE_HEALTHY, UI_ACCENT } from "@/lib/palette";
import { ViewportCanvas } from "./ViewportCanvas";

export type PlaygroundCameraPreset = "isometric" | "top" | "orbit";

interface PlaygroundPipeline3DProps {
  tab: "cinch" | "rag";
  scenarioId: string;
  stages: ReadonlyArray<{ id: string; label: string }>;
  activeStages: string[];
  statusColor: "#10B981" | "#38BDF8" | "#F59E0B" | "#EF4444";
  cameraPreset: PlaygroundCameraPreset;
  rpsMultiplier?: number;
  onSelectStage?: (stageId: string) => void;
}

const STATION_X = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0] as const;
const TOKEN_COUNT = 64;

function CameraTweenController({ preset }: { preset: PlaygroundCameraPreset }) {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(0, 3.25, 6.25), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, -0.1, 0), []);

  useEffect(() => {
    if (preset === "isometric") {
      targetPos.set(0, 3.25, 6.25);
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

function InstancedTokenStream({
  statusColor,
  isCacheBypass,
  isFaultBurst,
  rpsMultiplier,
}: {
  statusColor: string;
  isCacheBypass: boolean;
  isFaultBurst: boolean;
  rpsMultiplier: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: TOKEN_COUNT }, (_, idx) => ({
        offset: idx / TOKEN_COUNT,
        lane: ((idx % 5) - 2) * 0.09,
        jitter: ((idx * 17) % 10) / 10 - 0.5,
      })),
    []
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const speed = 0.22 * rpsMultiplier;

    for (let i = 0; i < TOKEN_COUNT; i++) {
      const s = seeds[i];
      const u = (s.offset + t * speed) % 1;

      if (isCacheBypass) {
        const x = -4.0 + u * 8.0;
        const arch = u > 0.35 ? Math.sin(((u - 0.35) / 0.65) * Math.PI) * 1.45 : 0;
        dummy.position.set(x, 0.48 + arch, s.lane);
        dummy.scale.setScalar(1.05);
      } else if (isFaultBurst) {
        const burst = Math.max(0, u - 0.2);
        dummy.position.set(
          -4.0 + Math.min(0.2, u) * 7 + burst * s.jitter * 2.4,
          0.42 - burst * 2.1,
          s.lane + burst * s.jitter * 2.2
        );
        dummy.scale.setScalar(Math.max(0.25, 1.15 - burst));
      } else {
        dummy.position.set(-4.0 + u * 8.0, 0.48 + Math.sin(u * Math.PI * 4) * 0.08, s.lane);
        dummy.scale.setScalar(0.95);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TOKEN_COUNT]}>
      <sphereGeometry args={[0.068, 10, 10]} />
      <meshBasicMaterial color={statusColor} toneMapped={false} />
    </instancedMesh>
  );
}

function PipelineDioramaScene({
  scenarioId,
  stages,
  activeStages,
  statusColor,
  cameraPreset,
  rpsMultiplier = 1,
  onSelectStage,
}: PlaygroundPipeline3DProps) {
  const rigRef = useRef<THREE.Group>(null);
  const isFaultBurst = scenarioId === "breaker-open" || scenarioId === "nli-refusal";
  const isCacheBypass = scenarioId === "cache-hit";

  useFrame((state) => {
    if (!rigRef.current) return;
    if (isFaultBurst) {
      const t = state.clock.elapsedTime;
      rigRef.current.position.x = Math.sin(t * 28) * 0.03;
      rigRef.current.position.y = Math.cos(t * 24) * 0.02;
    } else {
      rigRef.current.position.x *= 0.85;
      rigRef.current.position.y *= 0.85;
    }
  });

  return (
    <group ref={rigRef}>
      <ambientLight intensity={0.62} />
      <directionalLight position={[4, 6, 4]} intensity={1.3} color="#E6EDF3" />
      <pointLight position={[-3.5, 2.2, 2.5]} intensity={1.1} color={UI_ACCENT} />
      <pointLight position={[3.5, 2.2, 2.5]} intensity={0.95} color={statusColor} />

      <CameraTweenController preset={cameraPreset} />

      {/* Ground Telemetry Rail */}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[9.8, 0.08, 2.4]} />
        <meshStandardMaterial color="#11161D" roughness={0.68} metalness={0.45} />
      </mesh>

      <gridHelper args={[10.5, 18, "#263242", "#18202B"]} position={[0, -0.3, 0]} />

      {/* Main Rail Line */}
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 8.2, 10]} />
        <meshBasicMaterial
          color={isFaultBurst ? STATE_FAULT : isCacheBypass ? STATE_HEALTHY : UI_ACCENT}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Station Pedestals */}
      {stages.map((stage, idx) => {
        const isActive = activeStages.includes(stage.id);
        const x = STATION_X[idx] ?? idx * 1.5 - 3.75;
        const pedestalColor = isActive ? statusColor : "#232B38";

        return (
          <group key={stage.id} position={[x, 0.14, 0]}>
            <RoundedBox
              args={[0.92, isActive ? 0.68 : 0.42, 0.92]}
              radius={0.07}
              smoothness={3}
              onClick={(e) => {
                e.stopPropagation();
                onSelectStage?.(stage.id);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <meshStandardMaterial
                color={isActive ? "#1C2430" : "#141920"}
                roughness={0.35}
                metalness={0.75}
                emissive={pedestalColor}
                emissiveIntensity={isActive ? 0.32 : 0.04}
              />
            </RoundedBox>

            <mesh position={[0, isActive ? 0.36 : 0.23, 0]}>
              <boxGeometry args={[0.78, 0.045, 0.78]} />
              <meshBasicMaterial
                color={pedestalColor}
                toneMapped={!isActive}
                transparent
                opacity={isActive ? 0.95 : 0.4}
              />
            </mesh>

            <Html position={[0, isActive ? 0.68 : 0.54, 0]} center style={{ pointerEvents: "none" }}>
              <span
                className={`whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.06em] ${
                  isActive
                    ? "border-[rgba(240,246,252,0.22)] bg-[#0D1117]/95 font-semibold text-[#E6EDF3]"
                    : "border-[rgba(240,246,252,0.08)] bg-[#0D1117]/75 text-[#8B949E]"
                }`}
              >
                {stage.label}
              </span>
            </Html>
          </group>
        );
      })}

      <InstancedTokenStream
        statusColor={statusColor}
        isCacheBypass={isCacheBypass}
        isFaultBurst={isFaultBurst}
        rpsMultiplier={rpsMultiplier}
      />
    </group>
  );
}

/**
 * Interactive 3D pipeline diorama powered by 64 instanced token capsules inside the single root canvas.
 */
export function PlaygroundPipeline3D(props: PlaygroundPipeline3DProps) {
  return (
    <div className="relative h-[265px] w-full overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[315px]">
      <ViewportCanvas cameraPosition={[0, 3.25, 6.25]} fov={38} className="h-full w-full">
        <PipelineDioramaScene {...props} />
      </ViewportCanvas>
    </div>
  );
}
