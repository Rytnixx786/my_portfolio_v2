"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
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
    const targetY = (isSelected ? -0.15 : hovered ? -0.07 : 0) + wave;
    groupRef.current.position.y +=
      (targetY - groupRef.current.position.y) * Math.min(1, dt * 12);
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.46, 4]} />
        <meshBasicMaterial
          color={isSelected || hovered ? accentHue : "#222A36"}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.72 : 0.42}
          toneMapped={!isSelected}
        />
      </mesh>

      <group ref={groupRef}>
        <RoundedBox
          args={[1.04, 0.34, 0.78]}
          radius={0.07}
          smoothness={3}
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
            color={isSelected ? "#1D2838" : hovered ? "#1A222E" : "#151A22"}
            roughness={0.34}
            metalness={0.78}
            emissive={isSelected ? accentHue : hovered ? accentHue : "#000000"}
            emissiveIntensity={isSelected ? 0.45 : hovered ? 0.16 : 0}
          />
        </RoundedBox>

        <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.64]} />
          <meshBasicMaterial
            color={isSelected ? accentHue : "#8B949E"}
            transparent
            opacity={isSelected ? 0.48 : hovered ? 0.25 : 0.06}
            toneMapped={!isSelected}
          />
        </mesh>

        <SpriteLabel3D
          text={label}
          position={[0, 0.34, 0]}
          active={isSelected || hovered}
          accentColor={accentHue}
          worldHeight={0.18}
        />
      </group>
    </group>
  );
}

/**
 * Tactile 3D Stack Rack per architecture layer with per-layer hue underglow
 * and keyboard/click neighbor spring feedback.
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
    const totalRows = Math.ceil(tools.length / cols);
    const x = (col - (cols - 1) / 2) * 1.24;
    const z = (row - (totalRows - 1) / 2) * 1.04;
    return [x, 0, z] as [number, number, number];
  });

  return (
    <div className="relative h-[225px] w-full overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[255px]">
      <div className="pointer-events-none absolute left-3 top-2.5 z-30 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
        <span className="font-semibold" style={{ color: accentHue }}>
          {layerCode}
        </span>
        <span>{layerName}</span>
      </div>

      <ViewportCanvas cameraPosition={[0, 2.75, 3.65]} fov={38} className="h-full w-full">
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} color="#E6EDF3" />
        <pointLight position={[-2.5, 2, 2.5]} intensity={0.95} color={accentHue} />

        <mesh position={[0, -0.26, 0]}>
          <boxGeometry args={[4.4, 0.14, 2.75]} />
          <meshStandardMaterial color="#12171E" roughness={0.6} metalness={0.5} />
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
        />
      </ViewportCanvas>
    </div>
  );
}
