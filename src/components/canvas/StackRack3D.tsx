"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { STACK_LAYER_HUES } from "@/lib/palette";
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
}: {
  totalRows: number;
  draggingRef: React.MutableRefObject<boolean>;
}) {
  const { camera, frameloop, invalidate } = useThree();
  const target = useMemo(
    () =>
      totalRows >= 3
        ? new THREE.Vector3(0, 3.0, 4.15)
        : new THREE.Vector3(0, 2.55, 3.55),
    [totalRows]
  );
  const settlingRef = useRef(true);

  useEffect(() => {
    settlingRef.current = true;
    if (frameloop === "demand") {
      camera.position.copy(target);
      camera.lookAt(0, 0.08, 0);
    }
    invalidate();
  }, [camera, target, frameloop, invalidate]);

  useFrame((state, delta) => {
    if (!settlingRef.current || draggingRef.current) return;
    const dt = Math.min(delta, 0.05);
    const cam = state.camera;
    cam.position.lerp(target, 1 - Math.exp(-6 * dt));
    cam.lookAt(0, 0.08, 0);
    if (cam.position.distanceTo(target) < 0.02) {
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
    <div className="relative flex h-full w-full flex-col justify-between bg-[#0D1117] p-4 pt-10">
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
        2D Safe · Keycap Matrix
      </span>

      <div className="relative z-10 my-auto grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
                  : "0 4px 0 #090C10, inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
              className={`group flex min-h-[54px] flex-col justify-between rounded-xl border bg-[#161B22] px-3 py-2 text-left transition-all duration-150 ${
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
  const pulseTime = layerCode ? 0.1 : 0;
  const cols = tools.length <= 4 ? 2 : 3;
  const totalRows = Math.ceil(tools.length / cols);
  const xSpacing = 1.72;
  const zSpacing = 1.18;
  const layerIdx = Math.max(0, Number.parseInt(layerCode, 10) - 1) % STACK_LAYER_HUES.length;
  const accentHue = STACK_LAYER_HUES[layerIdx] ?? STACK_LAYER_HUES[0];
  const draggingRef = useRef(false);

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
    <div className="relative h-[225px] w-full overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[255px]">
      <div className="pointer-events-none absolute left-3 top-2.5 z-30 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
        <span className="font-semibold" style={{ color: accentHue }}>
          {layerCode}
        </span>
        <span>{layerName}</span>
      </div>

      <ViewportCanvas
        cameraPosition={totalRows >= 3 ? [0, 3.0, 4.15] : [0, 2.55, 3.55]}
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
        <RackCameraFit totalRows={totalRows} draggingRef={draggingRef} />
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
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.055}
          rotateSpeed={0.6}
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
