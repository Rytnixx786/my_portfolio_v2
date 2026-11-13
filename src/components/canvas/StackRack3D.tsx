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

function RackCameraFit({ totalRows }: { totalRows: number }) {
  const { camera, invalidate } = useThree();
  const target = useMemo(
    () =>
      totalRows >= 3
        ? new THREE.Vector3(0, 3.0, 4.15)
        : new THREE.Vector3(0, 2.55, 3.55),
    [totalRows]
  );

  useEffect(() => {
    camera.position.copy(target);
    camera.lookAt(0, 0.08, 0);
    invalidate();
  }, [camera, target, invalidate]);

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

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!groupRef.current) return;
    const wave =
      rippleDelay > 0
        ? Math.sin(Math.max(0, state.clock.elapsedTime - rippleDelay) * 8) * 0.03
        : 0;
    const targetY = (isSelected ? -0.14 : hovered ? -0.07 : 0) + wave;
    groupRef.current.position.y +=
      (targetY - groupRef.current.position.y) * Math.min(1, dt * 12);
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
 * Tactile 3D Stack Rack per architecture layer with per-layer hue underglow,
 * balanced row centering, and collision-free sprite labels.
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
        className="h-full w-full"
      >
        <RackCameraFit totalRows={totalRows} />
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
          dampingFactor={0.08}
          minPolarAngle={0.45}
          maxPolarAngle={Math.PI * 0.42}
          touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
      </ViewportCanvas>
    </div>
  );
}
