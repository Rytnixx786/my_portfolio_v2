"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CATEGORY_HUES, STATE_HEALTHY, UI_ACCENT } from "@/lib/palette";
import { ViewportCanvas } from "./ViewportCanvas";

const DHAKA_LAT = (23.8103 * Math.PI) / 180;
const DHAKA_LON = (90.4125 * Math.PI) / 180;

const REGIONS = [
  {
    id: "usw",
    name: "US-West",
    rtt: "194 ms",
    lat: (37.7749 * Math.PI) / 180,
    lon: (-122.4194 * Math.PI) / 180,
    hue: CATEGORY_HUES["Inference & Serving"].hex,
  },
  {
    id: "fra",
    name: "Frankfurt",
    rtt: "142 ms",
    lat: (50.1109 * Math.PI) / 180,
    lon: (8.6821 * Math.PI) / 180,
    hue: CATEGORY_HUES["Agents & RAG"].hex,
  },
  {
    id: "tyo",
    name: "Tokyo",
    rtt: "108 ms",
    lat: (35.6762 * Math.PI) / 180,
    lon: (139.6503 * Math.PI) / 180,
    hue: CATEGORY_HUES["MLOps & Security"].hex,
  },
] as const;

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const x = -radius * Math.cos(lat) * Math.cos(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

function GlobeAssembly({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const packetRefs = useRef<Array<THREE.Mesh | null>>([]);

  const dhakaPos = useMemo(() => latLonToVec3(DHAKA_LAT, DHAKA_LON, 1.32), []);

  const routes = useMemo(() => {
    return REGIONS.map((region) => {
      const target = latLonToVec3(region.lat, region.lon, 1.32);
      const mid = dhakaPos.clone().add(target).multiplyScalar(0.5).normalize().multiplyScalar(1.88);
      const curve = new THREE.QuadraticBezierCurve3(dhakaPos, mid, target);
      return { ...region, target, curve };
    });
  }, [dhakaPos]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.14;
    }
    if (pulseRef.current) {
      const s = 1 + Math.sin(t * 3.1) * 0.28;
      pulseRef.current.scale.set(s, s, s);
    }
    routes.forEach((r, idx) => {
      const mesh = packetRefs.current[idx];
      if (!mesh) return;
      const u = (t * 0.34 + idx * 0.32) % 1;
      r.curve.getPointAt(u, mesh.position);
    });
  });

  return (
    <group ref={groupRef} rotation={[0.18, -2.05, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.3, 3]} />
        <meshBasicMaterial color="#303946" wireframe transparent opacity={0.48} />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.26, 28, 28]} />
        <meshStandardMaterial color="#0F141B" roughness={0.75} metalness={0.25} />
      </mesh>

      {/* Soft Atmosphere Rim */}
      <mesh>
        <sphereGeometry args={[1.38, 28, 28]} />
        <meshBasicMaterial
          color={UI_ACCENT}
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0.12, 0]}>
        <torusGeometry args={[1.64, 0.011, 10, 88]} />
        <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.42} />
      </mesh>

      {/* Multi-Hue Latency Arcs + Traveling Packets */}
      {routes.map((route, idx) => {
        const isSelected = selectedId === route.id;
        return (
          <group key={route.id}>
            <mesh>
              <tubeGeometry args={[route.curve, 32, isSelected ? 0.022 : 0.014, 8, false]} />
              <meshBasicMaterial
                color={route.hue}
                transparent
                opacity={isSelected ? 0.88 : 0.42}
              />
            </mesh>

            <mesh
              ref={(el) => {
                packetRefs.current[idx] = el;
              }}
            >
              <sphereGeometry args={[0.04, 10, 10]} />
              <meshBasicMaterial color={route.hue} toneMapped={false} />
            </mesh>

            <mesh
              position={route.target}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(route.id);
              }}
            >
              <sphereGeometry args={[isSelected ? 0.068 : 0.05, 12, 12]} />
              <meshBasicMaterial color={route.hue} toneMapped={!isSelected} />
            </mesh>
          </group>
        );
      })}

      {/* Dhaka Origin Beacon */}
      <group position={dhakaPos}>
        <mesh>
          <sphereGeometry args={[0.068, 16, 16]} />
          <meshBasicMaterial color={STATE_HEALTHY} toneMapped={false} />
        </mesh>
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.115, 16, 16]} />
          <meshBasicMaterial color={STATE_HEALTHY} transparent opacity={0.28} />
        </mesh>
      </group>
    </group>
  );
}

const Globe2DFallback = (
  <svg viewBox="0 0 260 260" className="h-full w-full p-4" fill="none" aria-hidden="true">
    <circle cx="130" cy="130" r="95" stroke="#303946" strokeWidth="1" strokeDasharray="3 3" />
    <ellipse cx="130" cy="130" rx="95" ry="38" stroke="rgba(56,189,248,0.28)" strokeWidth="1" />
    <path d="M135 128 Q 95 72 52 96" stroke="#59C5EE" strokeWidth="1.5" strokeDasharray="4 3" />
    <path d="M135 128 Q 115 74 108 72" stroke="#EB99BB" strokeWidth="1.5" strokeDasharray="4 3" />
    <path d="M135 128 Q 175 78 202 104" stroke="#A8CE6C" strokeWidth="1.5" strokeDasharray="4 3" />
    <circle cx="135" cy="128" r="5" fill="#10B981" />
    <text x="144" y="132" fill="#E6EDF3" fontSize="10" fontFamily="monospace">
      Dhaka UTC+6
    </text>
  </svg>
);

export function TelemetryGlobe3D() {
  const [selectedId, setSelectedId] = useState<string>(REGIONS[0].id);
  const activeRegion = REGIONS.find((r) => r.id === selectedId) ?? REGIONS[0];

  return (
    <div className="relative h-[265px] w-full sm:h-[295px]">
      <div className="pointer-events-none absolute left-2.5 top-2.5 z-30 inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#0D1117]/90 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-[#10B981] backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
        <span>Dhaka · UTC+6</span>
      </div>

      <ViewportCanvas
        cameraPosition={[0, 0.3, 4.1]}
        fov={38}
        fallback={Globe2DFallback}
        className="h-full w-full"
      >
        <ambientLight intensity={0.62} />
        <directionalLight position={[4, 4, 4]} intensity={1.1} color="#E6EDF3" />
        <pointLight position={[-3, 1.5, 2]} intensity={0.95} color={UI_ACCENT} />

        <GlobeAssembly selectedId={selectedId} onSelect={setSelectedId} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
        />
      </ViewportCanvas>

      <div className="absolute bottom-2 left-2 right-2 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-3 py-1.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {REGIONS.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => setSelectedId(region.id)}
              className={`rounded-md px-2 py-0.5 font-mono text-xs transition-colors ${
                selectedId === region.id
                  ? "bg-[#38BDF8]/15 font-semibold text-[#E6EDF3]"
                  : "text-[#8B949E] hover:text-[#E6EDF3]"
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs tabular-nums" style={{ color: activeRegion.hue }}>
          ~{activeRegion.rtt}
        </span>
      </div>
    </div>
  );
}
