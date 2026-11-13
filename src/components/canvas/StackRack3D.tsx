"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
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
  isSelected,
  onSelect,
}: {
  label: string;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!groupRef.current) return;
    const targetY = isSelected ? -0.14 : hovered ? -0.07 : 0;
    groupRef.current.position.y +=
      (targetY - groupRef.current.position.y) * Math.min(1, dt * 12);
  });

  return (
    <group position={position}>
      {/* Glowing Base Socket */}
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.46, 4]} />
        <meshBasicMaterial
          color={isSelected || hovered ? "#38BDF8" : "#222A36"}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.7 : 0.4}
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
            color={isSelected ? "#38BDF8" : hovered ? "#1F2937" : "#161B22"}
            emissive={isSelected ? "#38BDF8" : hovered ? "#38BDF8" : "#000000"}
            emissiveIntensity={isSelected ? 0.32 : hovered ? 0.16 : 0}
            roughness={0.32}
            metalness={0.62}
          />
        </RoundedBox>

        <Html
          position={[0, 0.22, 0]}
          center
          distanceFactor={7.2}
          zIndexRange={[10, 0]}
        >
          <button
            type="button"
            onClick={onSelect}
            className={`pointer-events-auto whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.06em] transition-colors ${
              isSelected
                ? "bg-[#0D1117] text-[#38BDF8]"
                : hovered
                  ? "bg-[#0D1117]/90 text-[#E6EDF3]"
                  : "bg-[#0D1117]/75 text-[#8B949E]"
            }`}
          >
            {label}
          </button>
        </Html>
      </group>
    </group>
  );
}

/**
 * Interactive 3D mechanical compute keycap deck allowing visitors to depress
 * individual production tools across the active engineering layer.
 */
export function StackRack3D({
  layerCode,
  layerName,
  tools,
  selectedTool,
  onSelectTool,
}: StackRack3DProps) {
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const visibleTools = tools.slice(0, 6);
  const cols = visibleTools.length <= 3 ? visibleTools.length : 3;

  return (
    <ViewportCanvas
      className="h-[230px] w-full rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[260px]"
      cameraPosition={[0, 2.75, 4.15]}
      fov={40}
      fallback={null}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 6, 4]} intensity={1.3} color="#E6EDF3" />
      <pointLight position={[-2.5, 2.5, 2]} intensity={1.5} color="#38BDF8" />

      {/* Mechanical Compute Backplate */}
      <group rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[4.45, 0.22, 2.45]} radius={0.09} smoothness={3} position={[0, -0.32, 0]}>
          <meshStandardMaterial color="#11161D" roughness={0.5} metalness={0.55} />
        </RoundedBox>
        <gridHelper args={[4.3, 12, "#38BDF8", "#1F2630"]} position={[0, -0.2, 0]} />

        {visibleTools.map((tool, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const x = (col - (cols - 1) / 2) * 1.32;
          const z = visibleTools.length > 3 ? (row === 0 ? -0.52 : 0.52) : 0;

          return (
            <KeycapNode
              key={`${layerCode}-${tool}`}
              label={tool}
              position={[x, 0, z]}
              isSelected={selectedTool === tool}
              onSelect={() => onSelectTool(tool)}
            />
          );
        })}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI * 0.45}
      />

      <Html position={[-1.95, -0.85, 1.15]} zIndexRange={[5, 0]}>
        <span className="pointer-events-none whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em] text-[#6E7681]">
          {layerCode} · {layerName} · Click keys or drag
        </span>
      </Html>
    </ViewportCanvas>
  );
}
