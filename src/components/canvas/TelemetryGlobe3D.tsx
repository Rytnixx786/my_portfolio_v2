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
    svgPos: { x: 64, y: 92 },
  },
  {
    id: "fra",
    name: "Frankfurt",
    rtt: "142 ms",
    lat: (50.1109 * Math.PI) / 180,
    lon: (8.6821 * Math.PI) / 180,
    hue: CATEGORY_HUES["Agents & RAG"].hex,
    svgPos: { x: 132, y: 74 },
  },
  {
    id: "tyo",
    name: "Tokyo",
    rtt: "108 ms",
    lat: (35.6762 * Math.PI) / 180,
    lon: (139.6503 * Math.PI) / 180,
    hue: CATEGORY_HUES["MLOps & Security"].hex,
    svgPos: { x: 256, y: 96 },
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
  draggingRef,
  onSelect,
}: {
  selectedId: string;
  draggingRef: React.MutableRefObject<boolean>;
  onSelect: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const packetRefs = useRef<Array<THREE.Mesh | null>>([]);
  const elapsedRef = useRef(0);

  const dhakaPos = useMemo(() => latLonToVec3(DHAKA_LAT, DHAKA_LON, 1.32), []);

  const routes = useMemo(() => {
    return REGIONS.map((region) => {
      const target = latLonToVec3(region.lat, region.lon, 1.32);
      const mid = dhakaPos.clone().add(target).multiplyScalar(0.5).normalize().multiplyScalar(1.88);
      const curve = new THREE.QuadraticBezierCurve3(dhakaPos, mid, target);
      return { ...region, target, curve };
    });
  }, [dhakaPos]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const t = elapsedRef.current;

    if (groupRef.current && !draggingRef.current) {
      groupRef.current.rotation.y += dt * 0.14;
    }
    if (pulseRef.current) {
      const s = 1 + Math.sin(t * 2.8) * 0.24;
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
        <torusGeometry args={[1.64, 0.011, 10, 96]} />
        <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.42} />
      </mesh>

      {/* Multi-Hue Latency Arcs + Traveling Packets */}
      {routes.map((route, idx) => {
        const isSelected = selectedId === route.id;
        return (
          <group key={route.id}>
            <mesh>
              <tubeGeometry args={[route.curve, 40, isSelected ? 0.022 : 0.014, 8, false]} />
              <meshBasicMaterial
                color={route.hue}
                transparent
                opacity={isSelected ? 0.9 : 0.4}
              />
            </mesh>

            <mesh
              ref={(el) => {
                packetRefs.current[idx] = el;
              }}
            >
              <sphereGeometry args={[0.042, 12, 12]} />
              <meshBasicMaterial color={route.hue} toneMapped={false} />
            </mesh>

            <mesh
              position={route.target}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(route.id);
              }}
            >
              <sphereGeometry args={[isSelected ? 0.068 : 0.05, 14, 14]} />
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

/**
 * Interactive Zero-GPU 2D Telemetry Graticule (2D SAFE mode & WebGL fallback).
 */
function Globe2DFallback({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const dhaka = { x: 184, y: 122 };

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#0D1117] px-3 pb-11 pt-9">
      <span className="pointer-events-none absolute bottom-12 right-2.5 z-20 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E]">
        2D Safe · Graticule
      </span>

      <svg
        viewBox="0 0 320 200"
        className="h-full max-h-[210px] w-full select-none"
        role="img"
        aria-label="Dhaka global latency telemetry map"
      >
        {/* Wireframe Globe Graticule */}
        <circle
          cx="160"
          cy="104"
          r="82"
          fill="#10151D"
          stroke="rgba(240,246,252,0.14)"
          strokeWidth="1.2"
        />
        <ellipse
          cx="160"
          cy="104"
          rx="82"
          ry="30"
          fill="none"
          stroke="rgba(56,189,248,0.22)"
          strokeWidth="1"
        />
        <ellipse
          cx="160"
          cy="104"
          rx="36"
          ry="82"
          fill="none"
          stroke="rgba(240,246,252,0.08)"
          strokeWidth="1"
        />
        <line
          x1="78"
          y1="104"
          x2="242"
          y2="104"
          stroke="rgba(240,246,252,0.08)"
          strokeDasharray="3 3"
        />

        {/* Latency Arcs */}
        {REGIONS.map((region) => {
          const isSelected = region.id === selectedId;
          const mx = (dhaka.x + region.svgPos.x) / 2;
          const my = Math.min(dhaka.y, region.svgPos.y) - 34;
          const pathD = `M ${dhaka.x} ${dhaka.y} Q ${mx} ${my} ${region.svgPos.x} ${region.svgPos.y}`;

          return (
            <g
              key={region.id}
              onClick={() => onSelect(region.id)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={pathD}
                fill="none"
                stroke={region.hue}
                strokeOpacity={isSelected ? 0.92 : 0.35}
                strokeWidth={isSelected ? 2.2 : 1.2}
                strokeDasharray={isSelected ? "6 4" : "3 4"}
              >
                {isSelected && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur="1.1s"
                    repeatCount="indefinite"
                  />
                )}
              </path>

              {isSelected && (
                <circle r="3.4" fill={region.hue}>
                  <animateMotion dur="1.6s" repeatCount="indefinite" path={pathD} />
                </circle>
              )}

              <circle
                cx={region.svgPos.x}
                cy={region.svgPos.y}
                r={isSelected ? 6 : 4.2}
                fill={region.hue}
                fillOpacity={isSelected ? 1 : 0.65}
              />

              <text
                x={region.svgPos.x}
                y={region.svgPos.y - 11}
                textAnchor="middle"
                fill={isSelected ? "#E6EDF3" : "#8B949E"}
                fontSize="9.5"
                fontWeight={isSelected ? "700" : "500"}
                fontFamily="var(--font-mono), monospace"
              >
                {region.name}
              </text>
            </g>
          );
        })}

        {/* Dhaka Origin Beacon */}
        <circle cx={dhaka.x} cy={dhaka.y} r="10" fill="#10B981" fillOpacity="0.2" />
        <circle cx={dhaka.x} cy={dhaka.y} r="4.5" fill="#10B981" />
        <text
          x={dhaka.x}
          y={dhaka.y + 16}
          textAnchor="middle"
          fill="#10B981"
          fontSize="9.5"
          fontWeight="600"
          fontFamily="var(--font-mono), monospace"
        >
          Dhaka
        </text>
      </svg>
    </div>
  );
}

export function TelemetryGlobe3D() {
  const [selectedId, setSelectedId] = useState<string>(REGIONS[0].id);
  const draggingRef = useRef(false);
  const activeRegion = REGIONS.find((r) => r.id === selectedId) ?? REGIONS[0];

  return (
    <div className="relative h-[265px] w-full overflow-hidden rounded-2xl sm:h-[295px]">
      <div className="pointer-events-none absolute left-2.5 top-2.5 z-30 inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#0D1117]/90 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-[#10B981] backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
        <span>Dhaka · UTC+6</span>
      </div>

      <ViewportCanvas
        cameraPosition={[0, 0.3, 4.1]}
        fov={38}
        fallback={<Globe2DFallback selectedId={selectedId} onSelect={setSelectedId} />}
        className="h-full w-full"
      >
        <ambientLight intensity={0.5} />
        <hemisphereLight args={["#9CC9FF", "#0D1117", 0.75]} />
        <directionalLight position={[4, 4, 4]} intensity={1.15} color="#E6EDF3" />
        <pointLight position={[-3, 1.5, 2]} intensity={1.35} decay={0} color={UI_ACCENT} />

        <GlobeAssembly
          selectedId={selectedId}
          draggingRef={draggingRef}
          onSelect={setSelectedId}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.65}
          onStart={() => {
            draggingRef.current = true;
          }}
          onEnd={() => {
            draggingRef.current = false;
          }}
          touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
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
