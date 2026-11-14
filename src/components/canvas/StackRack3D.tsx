"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { STACK_LAYER_HUES } from "@/lib/palette";
import {
  CameraZoomController,
  CanvasZoomHUD,
  type ZoomAction,
  type ZoomSignal,
} from "./CanvasZoomHUD";
import { SpriteLabel3D } from "./SpriteLabel3D";
import { ViewportCanvas } from "./ViewportCanvas";

interface StackRack3DProps {
  layerCode: string;
  layerName: string;
  tools: readonly string[];
  selectedTool: string | null;
  onSelectTool: (tool: string) => void;
}

function RackCameraFit({
  totalRows,
  draggingRef,
  controlsRef,
  zoomSeq,
}: {
  totalRows: number;
  draggingRef: React.MutableRefObject<boolean>;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  zoomSeq: number;
}) {
  const { camera, frameloop, invalidate } = useThree();
  const target = useMemo(
    () =>
      totalRows >= 3
        ? new THREE.Vector3(0, 3.0, 4.15)
        : new THREE.Vector3(0, 2.55, 3.55),
    [totalRows]
  );
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0.08, 0), []);
  const settlingRef = useRef(true);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (zoomSeq > 0) {
      settlingRef.current = false;
    }
  }, [zoomSeq]);

  useEffect(() => {
    settlingRef.current = true;
    elapsedRef.current = 0;
    if (frameloop === "demand") {
      camera.position.copy(target);
      if (controlsRef.current) {
        controlsRef.current.target.copy(lookTarget);
        controlsRef.current.update();
      }
    }
    invalidate();
  }, [camera, target, lookTarget, frameloop, invalidate, controlsRef]);

  useFrame((state, delta) => {
    if (!settlingRef.current || draggingRef.current) return;
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const cam = state.camera;
    cam.position.lerp(target, 1 - Math.exp(-6 * dt));
    if (controlsRef.current) {
      controlsRef.current.target.lerp(lookTarget, 1 - Math.exp(-6 * dt));
      controlsRef.current.update();
    }
    if (cam.position.distanceTo(target) < 0.04 || elapsedRef.current > 0.7) {
      settlingRef.current = false;
    }
  });

  return null;
}

function KeycapNode({
  label,
  position,
  accentHue,
  isSelected,
  rippleDelay,
  onSelect,
}: {
  label: string;
  position: [number, number, number];
  accentHue: string;
  isSelected: boolean;
  rippleDelay: number;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    if (!groupRef.current) return;
    const wave =
      rippleDelay > 0
        ? Math.sin(Math.max(0, elapsedRef.current - rippleDelay) * 4.5) * 0.018
        : 0;
    const targetY = (isSelected ? -0.14 : hovered ? -0.06 : 0) + wave;
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetY,
      10,
      dt
    );
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.5, 4]} />
        <meshBasicMaterial
          color={isSelected || hovered ? accentHue : "#2C3748"}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.72 : 0.55}
          toneMapped={!isSelected}
        />
      </mesh>

      <group ref={groupRef}>
        <RoundedBox
          args={[1.18, 0.34, 0.84]}
          radius={0.07}
          smoothness={4}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
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
            color={isSelected ? "#264060" : hovered ? "#2C3B52" : "#222C3D"}
            roughness={0.42}
            metalness={0.22}
            emissive={isSelected ? accentHue : hovered ? accentHue : "#162030"}
            emissiveIntensity={isSelected ? 0.45 : hovered ? 0.22 : 0.1}
          />
        </RoundedBox>

        <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.02, 0.68]} />
          <meshBasicMaterial
            color={isSelected ? accentHue : "#9DA7B3"}
            transparent
            opacity={isSelected ? 0.42 : hovered ? 0.24 : 0.12}
            toneMapped={!isSelected}
          />
        </mesh>

        <SpriteLabel3D
          text={label}
          position={[0, 0.42, 0]}
          active={isSelected || hovered}
          accentColor={accentHue}
          worldHeight={0.25}
          maxWorldWidth={1.58}
          minHeightScale={0.82}
        />
      </group>
    </group>
  );
}

/**
 * Interactive Zero-GPU 2D Mechanical Switchboard Rack (2D SAFE mode & WebGL fallback).
 */
function StackRack2DFallback({
  layerCode,
  layerName,
  tools,
  selectedTool,
  accentHue,
  onSelectTool,
}: StackRack3DProps & { accentHue: string }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-[#0D1117] p-3.5 pt-9 sm:p-4 sm:pt-10">
      {/* Subtle Architectural Matrix Dots */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(rgba(240, 246, 252, 0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <span className="pointer-events-none absolute right-3 top-2.5 z-20 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E]">
        2D Safe · Keycaps
      </span>

      <div className="relative z-10 my-auto grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
        {tools.map((tool, idx) => {
          const isPicked = selectedTool === tool;
          return (
            <button
              key={`${layerCode}-${tool}`}
              type="button"
              onClick={() => onSelectTool(tool)}
              aria-pressed={isPicked}
              style={{
                borderColor: isPicked ? accentHue : "rgba(240,246,252,0.12)",
                boxShadow: isPicked
                  ? `0 0 0 1px ${accentHue}55, inset 0 2px 0 rgba(255,255,255,0.08)`
                  : "0 3px 0 #090C10, inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
              className={`group flex min-h-[44px] flex-col justify-between rounded-xl border bg-[#161B22] px-2.5 py-1.5 text-left transition-all duration-150 sm:min-h-[50px] sm:px-3 sm:py-2 ${
                isPicked
                  ? "translate-y-[2px] bg-[#1C2634]"
                  : "hover:border-[rgba(240,246,252,0.28)] hover:bg-[#1C222B]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: isPicked ? accentHue : "#6E7681" }}
                >
                  K{String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: isPicked ? accentHue : "rgba(240,246,252,0.18)",
                  }}
                  aria-hidden="true"
                />
              </div>
              <span className="truncate font-mono text-xs font-semibold text-[#E6EDF3]">
                {tool}
              </span>
            </button>
          );
        })}
      </div>

      <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6E7681]">
        {layerName} · Click any keycap to inspect
      </p>
    </div>
  );
}

/**
 * Tactile 3D Stack Rack per architecture layer with per-layer hue underglow,
 * balanced row centering, collision-free sprite labels, and tactile 2D keycap fallback.
 */
export function StackRack3D({
  layerCode,
  layerName,
  tools,
  selectedTool,
  onSelectTool,
}: StackRack3DProps) {
  const { canRender3D } = useCanRender3D();
  const pulseTime = layerCode ? 0.1 : 0;
  const cols = tools.length <= 4 ? 2 : 3;
  const totalRows = Math.ceil(tools.length / cols);
  const xSpacing = 1.72;
  const zSpacing = 1.18;
  const layerIdx = Math.max(0, Number.parseInt(layerCode, 10) - 1) % STACK_LAYER_HUES.length;
  const accentHue = STACK_LAYER_HUES[layerIdx] ?? STACK_LAYER_HUES[0];
  const draggingRef = useRef(false);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const [wheelEngaged, setWheelEngaged] = useState(false);
  const [zoomSignal, setZoomSignal] = useState<ZoomSignal>({ action: "reset", seq: 0 });

  const triggerZoom = useCallback((action: ZoomAction) => {
    setZoomSignal((prev) => ({ action, seq: prev.seq + 1 }));
  }, []);

  const defaultCamPos = useMemo<[number, number, number]>(
    () => (totalRows >= 3 ? [0, 3.0, 4.15] : [0, 2.55, 3.55]),
    [totalRows]
  );
  const defaultTarget = useMemo<[number, number, number]>(() => [0, 0.08, 0], []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const positions = tools.map((_, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const rowItems = Math.min(cols, tools.length - row * cols);
    const x = (col - (rowItems - 1) / 2) * xSpacing;
    const z = (row - (totalRows - 1) / 2) * zSpacing;
    return [x, 0, z] as [number, number, number];
  });

  const baseW = cols * xSpacing + 0.55;
  const baseD = totalRows * zSpacing + 0.55;

  return (
    <div
      data-lenis-prevent-wheel={wheelEngaged ? "true" : undefined}
      onPointerDown={() => {
        if (canRender3D) setWheelEngaged(true);
      }}
      onPointerLeave={() => setWheelEngaged(false)}
      className="relative h-[290px] w-full overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[265px]"
    >
      <div className="pointer-events-none absolute left-3 top-2.5 z-30 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
        <span className="font-semibold" style={{ color: accentHue }}>
          {layerCode}
        </span>
        <span>{layerName}</span>
      </div>

      {canRender3D && (
        <CanvasZoomHUD
          className="right-3 top-2.5"
          onZoomIn={() => triggerZoom("in")}
          onZoomOut={() => triggerZoom("out")}
          onReset={() => triggerZoom("reset")}
        />
      )}

      <ViewportCanvas
        cameraPosition={defaultCamPos}
        fov={40}
        fallback={
          <StackRack2DFallback
            layerCode={layerCode}
            layerName={layerName}
            tools={tools}
            selectedTool={selectedTool}
            accentHue={accentHue}
            onSelectTool={onSelectTool}
          />
        }
        className="h-full w-full"
      >
        <RackCameraFit
          totalRows={totalRows}
          draggingRef={draggingRef}
          controlsRef={controlsRef}
          zoomSeq={zoomSignal.seq}
        />
        <CameraZoomController
          controlsRef={controlsRef}
          defaultPosition={defaultCamPos}
          defaultTarget={defaultTarget}
          minDistance={2.2}
          maxDistance={8.5}
          zoomSignal={zoomSignal}
        />
        <ambientLight intensity={0.62} />
        <hemisphereLight args={["#B8D9FF", "#0D1117", 1.0]} />
        <directionalLight position={[2, 7, 5]} intensity={1.3} color="#E6EDF3" />
        <pointLight position={[-3.2, 3.0, 2.8]} intensity={1.25} decay={0} color={accentHue} />
        <pointLight position={[3.2, 3.0, 2.8]} intensity={0.95} decay={0} color="#38BDF8" />

        <mesh position={[0, -0.26, 0]}>
          <boxGeometry args={[baseW, 0.14, baseD]} />
          <meshStandardMaterial color="#17202C" roughness={0.58} metalness={0.18} />
        </mesh>

        {tools.map((tool, idx) => (
          <KeycapNode
            key={`${layerCode}-${tool}`}
            label={tool}
            position={positions[idx]}
            accentHue={accentHue}
            isSelected={selectedTool === tool}
            rippleDelay={pulseTime > 0 ? idx * 0.05 : 0}
            onSelect={() => onSelectTool(tool)}
          />
        ))}

        <OrbitControls
          ref={controlsRef}
          target={[0, 0.08, 0]}
          enableZoom={wheelEngaged}
          zoomSpeed={0.8}
          minDistance={2.2}
          maxDistance={8.5}
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.62}
          minPolarAngle={0.45}
          maxPolarAngle={Math.PI * 0.42}
          onStart={() => {
            draggingRef.current = true;
          }}
          onEnd={() => {
            draggingRef.current = false;
          }}
          touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
      </ViewportCanvas>
    </div>
  );
}
