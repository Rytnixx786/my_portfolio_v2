"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { STATE_FAULT, STATE_HEALTHY, UI_ACCENT } from "@/lib/palette";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { PlaygroundPipeline2D } from "@/components/sections/PlaygroundPipeline2D";
import {
  CameraZoomController,
  CanvasZoomHUD,
  type ZoomAction,
  type ZoomSignal,
} from "./CanvasZoomHUD";
import { SpriteLabel3D } from "./SpriteLabel3D";
import { ViewportCanvas } from "./ViewportCanvas";

export type PlaygroundCameraPreset = "isometric" | "top" | "orbit";

interface PlaygroundPipeline3DProps {
  tab: "cinch" | "rag";
  scenarioId: string;
  stages: ReadonlyArray<{ id: string; label: string }>;
  activeStages: string[];
  statusColor: "#10B981" | "#38BDF8" | "#F59E0B" | "#EF4444";
  cameraPreset: PlaygroundCameraPreset;
  presetTrigger?: number;
  focusedStageId?: string | null;
  rpsMultiplier?: number;
  onSelectStage?: (stageId: string) => void;
}

const STATION_X = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0] as const;
const TOKEN_COUNT = 36;
const UP_AXIS = new THREE.Vector3(0, 1, 0);

const PRESET_VANTAGES: Record<PlaygroundCameraPreset, [number, number, number]> = {
  isometric: [3.1, 3.6, 6.1],
  top: [0, 7.6, 2.2],
  orbit: [3.6, 2.8, 5.5],
};

function CameraRigController({
  preset,
  presetTrigger,
  enableWheelZoom,
  zoomSignal,
}: {
  preset: PlaygroundCameraPreset;
  presetTrigger: number;
  enableWheelZoom: boolean;
  zoomSignal: ZoomSignal;
}) {
  const { camera, frameloop, invalidate } = useThree();
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const targetPosRef = useRef(new THREE.Vector3(...PRESET_VANTAGES.isometric));
  const lookTargetRef = useRef(new THREE.Vector3(0, 0.08, 0));
  const offsetVec = useMemo(() => new THREE.Vector3(), []);
  const transitioningRef = useRef(true);
  const transitionElapsedRef = useRef(0);
  const draggingRef = useRef(false);
  const lastInteractElapsedRef = useRef(-10);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const vantage = PRESET_VANTAGES[preset];
    targetPosRef.current.set(vantage[0], vantage[1], vantage[2]);
    lookTargetRef.current.set(0, preset === "top" ? 0 : 0.08, 0);
    transitioningRef.current = true;
    transitionElapsedRef.current = 0;
    lastInteractElapsedRef.current = -10;

    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }

    if (frameloop === "demand") {
      camera.position.copy(targetPosRef.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(lookTargetRef.current);
        controlsRef.current.update();
      }
    }
    invalidate();
  }, [preset, presetTrigger, camera, frameloop, invalidate]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const controls = controlsRef.current;
    const cam = state.camera;
    if (!controls) return;

    if (transitioningRef.current && !draggingRef.current) {
      transitionElapsedRef.current += dt;
      controls.autoRotate = false;

      const alpha = 1 - Math.exp(-6.5 * dt);
      cam.position.lerp(targetPosRef.current, alpha);
      controls.target.lerp(lookTargetRef.current, alpha);
      controls.update();

      if (
        cam.position.distanceTo(targetPosRef.current) < 0.08 ||
        transitionElapsedRef.current > 0.7
      ) {
        cam.position.copy(targetPosRef.current);
        controls.target.copy(lookTargetRef.current);
        controls.update();
        transitioningRef.current = false;
      }
      return;
    }

    if (draggingRef.current) {
      controls.autoRotate = false;
      lastInteractElapsedRef.current = elapsedRef.current;
      return;
    }

    // Resume smooth idle camera motion 2.2s after manual interaction ends (so station clicks never freeze presets)
    const idleReady = elapsedRef.current - lastInteractElapsedRef.current > 2.2;

    if (preset === "orbit") {
      controls.autoRotate = idleReady;
      controls.autoRotateSpeed = 1.65;
      return;
    }

    controls.autoRotate = false;

    if (idleReady) {
      const angularVel =
        preset === "isometric"
          ? Math.cos(elapsedRef.current * 0.55) * 0.24
          : 0.16;
      offsetVec.copy(cam.position).sub(controls.target);
      offsetVec.applyAxisAngle(UP_AXIS, angularVel * dt);
      cam.position.copy(controls.target).add(offsetVec);
    }
  });

  const handleUserZoomTrigger = useCallback(() => {
    transitioningRef.current = false;
    lastInteractElapsedRef.current = elapsedRef.current;
  }, []);

  const defaultTarget: [number, number, number] = [0, preset === "top" ? 0 : 0.08, 0];

  return (
    <>
      <CameraZoomController
        controlsRef={controlsRef}
        defaultPosition={PRESET_VANTAGES[preset]}
        defaultTarget={defaultTarget}
        minDistance={3.2}
        maxDistance={12.5}
        zoomSignal={zoomSignal}
        onUserZoomTrigger={handleUserZoomTrigger}
      />
      <OrbitControls
        ref={controlsRef}
        target={[0, 0.08, 0]}
        enableZoom={enableWheelZoom}
        zoomSpeed={0.8}
        minDistance={3.2}
        maxDistance={12.5}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.68}
        autoRotate={preset === "orbit"}
        autoRotateSpeed={1.65}
        minPolarAngle={0.22}
        maxPolarAngle={Math.PI * 0.39}
        onStart={() => {
          draggingRef.current = true;
          transitioningRef.current = false;
          lastInteractElapsedRef.current = elapsedRef.current;
        }}
        onEnd={() => {
          draggingRef.current = false;
          lastInteractElapsedRef.current = elapsedRef.current;
        }}
        touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </>
  );
}

function buildScenarioCurve(scenarioId: string, lastActiveIdx: number): THREE.CatmullRomCurve3 {
  const endX = STATION_X[Math.max(0, Math.min(5, lastActiveIdx))] ?? 4.0;

  if (scenarioId === "cache-hit") {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.2, 0.46, 0),
      new THREE.Vector3(-2.4, 0.46, 0),
      new THREE.Vector3(-0.8, 0.46, 0),
      new THREE.Vector3(0.8, 0.54, 0),
      new THREE.Vector3(1.1, 1.15, 0.35),
      new THREE.Vector3(-1.4, 1.38, 0.45),
      new THREE.Vector3(-3.9, 0.82, 0.25),
    ]);
  }

  if (scenarioId === "breaker-open" || scenarioId === "budget-cutoff" || scenarioId === "nli-refusal") {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.2, 0.46, 0),
      new THREE.Vector3((-4.2 + endX) * 0.5, 0.46, 0),
      new THREE.Vector3(endX, 0.5, 0),
      new THREE.Vector3(endX + 0.35, 0.22, 0.55),
      new THREE.Vector3(endX + 0.55, -0.18, 0.95),
    ]);
  }

  if (scenarioId === "hitl-replan") {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.2, 0.46, 0),
      new THREE.Vector3(-2.4, 0.46, 0),
      new THREE.Vector3(-0.8, 0.52, 0),
      new THREE.Vector3(-0.35, 0.72, 0.42),
      new THREE.Vector3(-0.8, 0.85, 0),
      new THREE.Vector3(-1.25, 0.72, -0.42),
      new THREE.Vector3(-0.8, 0.52, 0),
    ]);
  }

  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.2, 0.46, 0),
    new THREE.Vector3(-2.4, 0.5, 0),
    new THREE.Vector3(-0.8, 0.46, 0),
    new THREE.Vector3(0.8, 0.5, 0),
    new THREE.Vector3(2.4, 0.46, 0),
    new THREE.Vector3(4.2, 0.46, 0),
  ]);
}

function InstancedPacketStream({
  scenarioId,
  lastActiveIdx,
  statusColor,
  rpsMultiplier,
}: {
  scenarioId: string;
  lastActiveIdx: number;
  statusColor: string;
  rpsMultiplier: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const elapsedRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointVec = useMemo(() => new THREE.Vector3(), []);
  const tangentVec = useMemo(() => new THREE.Vector3(), []);

  const curve = useMemo(
    () => buildScenarioCurve(scenarioId, lastActiveIdx),
    [scenarioId, lastActiveIdx]
  );

  const seeds = useMemo(
    () =>
      Array.from({ length: TOKEN_COUNT }, (_, idx) => ({
        offset: idx / TOKEN_COUNT,
        laneZ: ((idx % 3) - 1) * 0.1,
      })),
    []
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;

    const speed =
      (scenarioId === "cache-hit" ? 0.36 : scenarioId === "hitl-replan" ? 0.26 : 0.3) *
      rpsMultiplier;

    for (let i = 0; i < TOKEN_COUNT; i++) {
      const s = seeds[i];
      const u = (s.offset + elapsedRef.current * speed) % 1;

      curve.getPointAt(u, pointVec);
      curve.getTangentAt(u, tangentVec).normalize();

      dummy.position.set(pointVec.x, pointVec.y, pointVec.z + s.laneZ);
      dummy.quaternion.setFromUnitVectors(UP_AXIS, tangentVec);

      const fadeEdge = Math.sin(u * Math.PI);
      const scaleVal = 0.65 + fadeEdge * 0.45;
      dummy.scale.set(scaleVal, scaleVal * 1.15, scaleVal);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.022, 10, false]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.34} />
      </mesh>

      <instancedMesh ref={meshRef} args={[undefined, undefined, TOKEN_COUNT]}>
        <capsuleGeometry args={[0.032, 0.11, 6, 10]} />
        <meshBasicMaterial color={statusColor} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function StationPedestal({
  stage,
  x,
  isActive,
  isFocused,
  statusColor,
  pulsePhase,
  onSelect,
}: {
  stage: { id: string; label: string };
  x: number;
  isActive: boolean;
  isFocused: boolean;
  statusColor: string;
  pulsePhase: number;
  onSelect?: () => void;
}) {
  const bodyRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const elapsedRef = useRef(0);

  const pedestalColor = isFocused ? UI_ACCENT : isActive ? statusColor : "#2B3647";

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    if (bodyRef.current) {
      const wave = isActive ? Math.sin(elapsedRef.current * 2.6 + pulsePhase) * 0.035 : 0;
      const targetY = (isFocused ? 0.16 : isActive ? 0.08 : 0) + (hovered ? 0.06 : 0) + wave;
      bodyRef.current.position.y = THREE.MathUtils.damp(
        bodyRef.current.position.y,
        targetY,
        8,
        dt
      );
    }
    if (ringRef.current) {
      const targetScale = isFocused
        ? 1.15
        : isActive
          ? 1.0 + Math.sin(elapsedRef.current * 3 + pulsePhase) * 0.08
          : 0.7;
      const next = THREE.MathUtils.damp(ringRef.current.scale.x, targetScale, 8, dt);
      ringRef.current.scale.set(next, next, 1);
    }
  });

  return (
    <group position={[x, 0.12, 0]}>
      <mesh ref={ringRef} position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52, 0.59, 32]} />
        <meshBasicMaterial
          color={pedestalColor}
          transparent
          opacity={isFocused ? 0.92 : isActive ? 0.45 : 0.12}
          toneMapped={!isActive && !isFocused}
        />
      </mesh>

      <group ref={bodyRef}>
        <RoundedBox
          args={[0.94, isActive ? 0.64 : 0.4, 0.94]}
          radius={0.08}
          smoothness={3}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <meshStandardMaterial
            color={isFocused ? "#233246" : isActive ? "#1D2634" : "#171F2C"}
            roughness={0.36}
            metalness={0.32}
            emissive={pedestalColor}
            emissiveIntensity={isFocused ? 0.55 : isActive ? 0.32 : 0.06}
          />
        </RoundedBox>

        <mesh position={[0, isActive ? 0.335 : 0.215, 0]}>
          <boxGeometry args={[0.78, 0.04, 0.78]} />
          <meshBasicMaterial
            color={pedestalColor}
            toneMapped={!isActive && !isFocused}
            transparent
            opacity={isFocused ? 1 : isActive ? 0.92 : 0.4}
          />
        </mesh>

        <SpriteLabel3D
          text={stage.label}
          position={[0, isActive ? 0.68 : 0.54, 0]}
          active={isActive || isFocused || hovered}
          accentColor={pedestalColor}
          worldHeight={0.24}
          maxWorldWidth={1.42}
        />
      </group>
    </group>
  );
}

function PipelineDioramaScene({
  scenarioId,
  stages,
  activeStages,
  statusColor,
  cameraPreset,
  presetTrigger = 0,
  focusedStageId = null,
  rpsMultiplier = 1,
  onSelectStage,
  enableWheelZoom,
  zoomSignal,
}: PlaygroundPipeline3DProps & {
  enableWheelZoom: boolean;
  zoomSignal: ZoomSignal;
}) {
  const isFaultBurst =
    scenarioId === "breaker-open" ||
    scenarioId === "budget-cutoff" ||
    scenarioId === "nli-refusal";
  const isCacheBypass = scenarioId === "cache-hit";

  const activeIndices = stages
    .map((s, idx) => (activeStages.includes(s.id) ? idx : -1))
    .filter((idx) => idx >= 0);
  const lastActiveIdx =
    activeIndices.length > 0 ? activeIndices[activeIndices.length - 1] : 0;

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <group>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#9CC9FF", "#0D1117", 0.85]} />
      <directionalLight position={[4, 6, 4]} intensity={1.35} color="#E6EDF3" />
      <pointLight position={[-3.5, 2.2, 2.5]} intensity={1.35} decay={0} color={UI_ACCENT} />
      <pointLight position={[3.5, 2.2, 2.5]} intensity={1.25} decay={0} color={statusColor} />

      <CameraRigController
        preset={cameraPreset}
        presetTrigger={presetTrigger}
        enableWheelZoom={enableWheelZoom}
        zoomSignal={zoomSignal}
      />

      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[9.8, 0.08, 2.5]} />
        <meshStandardMaterial color="#141A23" roughness={0.6} metalness={0.25} />
      </mesh>

      <gridHelper args={[11, 20, "#243242", "#17202B"]} position={[0, -0.3, 0]} />

      <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 8.4, 10]} />
        <meshBasicMaterial
          color={isFaultBurst ? STATE_FAULT : isCacheBypass ? STATE_HEALTHY : "#2A3646"}
          transparent
          opacity={0.35}
        />
      </mesh>

      {stages.map((stage, idx) => {
        const isActive = activeStages.includes(stage.id);
        const isFocused = focusedStageId === stage.id;
        const x = STATION_X[idx] ?? idx * 1.5 - 3.75;

        return (
          <StationPedestal
            key={stage.id}
            stage={stage}
            x={x}
            isActive={isActive}
            isFocused={isFocused}
            statusColor={statusColor}
            pulsePhase={idx * 0.65}
            onSelect={() => onSelectStage?.(stage.id)}
          />
        );
      })}

      <InstancedPacketStream
        scenarioId={scenarioId}
        lastActiveIdx={lastActiveIdx}
        statusColor={statusColor}
        rpsMultiplier={rpsMultiplier}
      />
    </group>
  );
}

/**
 * Interactive 3D pipeline diorama with smooth camera presets (Isometric, Top, Orbit),
 * directional telemetry capsules, and a zero-GPU interactive 2D vector schematic fallback.
 */
export function PlaygroundPipeline3D(props: PlaygroundPipeline3DProps) {
  const { canRender3D } = useCanRender3D();
  const [wheelEngaged, setWheelEngaged] = useState(false);
  const [zoomSignal, setZoomSignal] = useState<ZoomSignal>({ action: "reset", seq: 0 });
  const initialPos = PRESET_VANTAGES[props.cameraPreset] ?? PRESET_VANTAGES.isometric;

  const triggerZoom = useCallback((action: ZoomAction) => {
    setZoomSignal((prev) => ({ action, seq: prev.seq + 1 }));
  }, []);

  return (
    <div
      data-lenis-prevent-wheel={wheelEngaged ? "true" : undefined}
      onPointerDown={() => {
        if (canRender3D) setWheelEngaged(true);
      }}
      onPointerLeave={() => setWheelEngaged(false)}
      className="relative h-[265px] w-full overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[315px]"
    >
      {canRender3D && (
        <CanvasZoomHUD
          onZoomIn={() => triggerZoom("in")}
          onZoomOut={() => triggerZoom("out")}
          onReset={() => triggerZoom("reset")}
        />
      )}

      <ViewportCanvas
        cameraPosition={initialPos}
        fov={38}
        className="h-full w-full"
        fallback={
          <PlaygroundPipeline2D
            tab={props.tab}
            scenarioId={props.scenarioId}
            stages={props.stages}
            activeStages={props.activeStages}
            statusColor={props.statusColor}
            focusedStageId={props.focusedStageId}
            rpsMultiplier={props.rpsMultiplier}
            onSelectStage={props.onSelectStage}
          />
        }
      >
        <PipelineDioramaScene
          {...props}
          enableWheelZoom={wheelEngaged}
          zoomSignal={zoomSignal}
        />
      </ViewportCanvas>

      {canRender3D && (
        <span className="pointer-events-none absolute bottom-2.5 right-3 z-20 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/85 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.1em] text-[#8B949E] backdrop-blur-md">
          Drag to orbit · +/- or click &amp; scroll to zoom · Click station
        </span>
      )}
    </div>
  );
}
