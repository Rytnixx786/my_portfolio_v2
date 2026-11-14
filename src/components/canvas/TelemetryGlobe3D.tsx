"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { CATEGORY_HUES, STATE_HEALTHY, UI_ACCENT } from "@/lib/palette";
import {
  CameraZoomController,
  CanvasZoomHUD,
  type ZoomAction,
  type ZoomSignal,
} from "./CanvasZoomHUD";
import { SpriteLabel3D } from "./SpriteLabel3D";
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
    // Orient corridor midpoint (+164° across Pacific) so Dhaka & US-West arc face camera cleanly
    corridorRotY: -1.18,
    hue: CATEGORY_HUES["Inference & Serving"].hex,
    svgPos: { x: 96, y: 92 },
  },
  {
    id: "fra",
    name: "Frankfurt",
    rtt: "142 ms",
    lat: (50.1109 * Math.PI) / 180,
    lon: (8.6821 * Math.PI) / 180,
    // Orient corridor midpoint (~50°E) cleanly toward camera (+Z)
    corridorRotY: 0.68,
    hue: CATEGORY_HUES["Agents & RAG"].hex,
    svgPos: { x: 138, y: 72 },
  },
  {
    id: "tyo",
    name: "Tokyo",
    rtt: "108 ms",
    lat: (35.6762 * Math.PI) / 180,
    lon: (139.6503 * Math.PI) / 180,
    // Orient corridor midpoint (~115°E) cleanly toward camera (+Z)
    corridorRotY: -0.42,
    hue: CATEGORY_HUES["MLOps & Security"].hex,
    svgPos: { x: 222, y: 94 },
  },
] as const;

// Default hero orientation: Dhaka front-center-right so Dhaka + Eurasia/Asia-Pacific routes immediately read
const DEFAULT_GLOBE_ROT_Y = -0.14;

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const x = -radius * Math.cos(lat) * Math.cos(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.sin(lon);
  return new THREE.Vector3(x, y, z);
}

function shortestAngleDiff(from: number, to: number): number {
  const diff = (to - from + Math.PI) % (Math.PI * 2);
  return diff < 0 ? diff + Math.PI : diff - Math.PI;
}

function GlobeAssembly({
  selectedId,
  resetSeq,
  draggingRef,
  onSelect,
}: {
  selectedId: string;
  resetSeq: number;
  draggingRef: React.MutableRefObject<boolean>;
  onSelect: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const targetRingRef = useRef<THREE.Mesh>(null);
  const packetRefs = useRef<Array<THREE.Mesh | null>>([]);
  const elapsedRef = useRef(0);
  const focusAngleRef = useRef<number | null>(null);
  const lastSelectedRef = useRef<string>(selectedId);
  const lastResetSeqRef = useRef<number>(resetSeq);
  const { invalidate } = useThree();

  const dhakaPos = useMemo(() => latLonToVec3(DHAKA_LAT, DHAKA_LON, 1.32), []);

  const routes = useMemo(() => {
    return REGIONS.map((region) => {
      const target = latLonToVec3(region.lat, region.lon, 1.32);
      const mid = dhakaPos
        .clone()
        .add(target)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(1.86);
      const curve = new THREE.QuadraticBezierCurve3(dhakaPos, mid, target);
      return { ...region, target, curve };
    });
  }, [dhakaPos]);

  // Deterministic Fibonacci surface lattice points for high-contrast spatial curvature without external textures
  const latticeGeometry = useMemo(() => {
    const count = 240;
    const positions = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));
    const r = 1.285;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      positions[i * 3] = Math.cos(theta) * radiusAtY * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = Math.sin(theta) * radiusAtY * r;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  useEffect(() => {
    return () => {
      latticeGeometry.dispose();
    };
  }, [latticeGeometry]);

  useEffect(() => {
    if (lastSelectedRef.current !== selectedId) {
      lastSelectedRef.current = selectedId;
      const active = REGIONS.find((r) => r.id === selectedId);
      if (active) {
        focusAngleRef.current = active.corridorRotY;
        invalidate();
      }
    }
  }, [selectedId, invalidate]);

  useEffect(() => {
    if (lastResetSeqRef.current !== resetSeq) {
      lastResetSeqRef.current = resetSeq;
      focusAngleRef.current = DEFAULT_GLOBE_ROT_Y;
      invalidate();
    }
  }, [resetSeq, invalidate]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const t = elapsedRef.current;

    if (groupRef.current && !draggingRef.current) {
      if (focusAngleRef.current !== null) {
        const diff = shortestAngleDiff(
          groupRef.current.rotation.y,
          focusAngleRef.current
        );
        if (Math.abs(diff) < 0.012) {
          groupRef.current.rotation.y = focusAngleRef.current;
          focusAngleRef.current = null;
        } else {
          groupRef.current.rotation.y += diff * Math.min(1, dt * 5.2);
        }
      } else {
        groupRef.current.rotation.y += dt * 0.095;
      }
    } else if (draggingRef.current) {
      focusAngleRef.current = null;
    }

    if (pulseRef.current) {
      const s = 1 + Math.sin(t * 2.8) * 0.25;
      pulseRef.current.scale.set(s, s, s);
    }

    if (targetRingRef.current) {
      targetRingRef.current.rotation.z = t * 1.1;
      const rs = 1 + Math.sin(t * 3.2) * 0.1;
      targetRingRef.current.scale.setScalar(rs);
    }

    routes.forEach((r, idx) => {
      const mesh = packetRefs.current[idx];
      if (!mesh) return;
      const u = (t * 0.36 + idx * 0.32) % 1;
      r.curve.getPointAt(u, mesh.position);
    });
  });

  const activeRoute = routes.find((r) => r.id === selectedId) ?? routes[0];
  const targetQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      activeRoute.target.clone().normalize()
    );
    return q;
  }, [activeRoute.target]);
  const dhakaLabelPos = useMemo(
    () => [dhakaPos.x * 1.12, dhakaPos.y - 0.2, dhakaPos.z * 1.12] as [number, number, number],
    [dhakaPos]
  );

  return (
    <group ref={groupRef} position={[0, 0.04, 0]} rotation={[0.2, DEFAULT_GLOBE_ROT_Y, 0]}>
      {/* Luminous Geodesic Mesh */}
      <mesh>
        <icosahedronGeometry args={[1.29, 3]} />
        <meshBasicMaterial color="#385676" wireframe transparent opacity={0.44} />
      </mesh>

      {/* Deep Illuminated Oceanic Core (avoids crushed black silhouette) */}
      <mesh>
        <sphereGeometry args={[1.255, 32, 32]} />
        <meshStandardMaterial
          color="#131E2D"
          emissive="#0C223B"
          emissiveIntensity={0.45}
          roughness={0.58}
          metalness={0.28}
        />
      </mesh>

      {/* Surface Coordinate Dots */}
      <points geometry={latticeGeometry}>
        <pointsMaterial
          color="#7DD3FC"
          size={0.026}
          transparent
          opacity={0.45}
          sizeAttenuation
        />
      </points>

      {/* Crisp Latitude Parallels & Longitude Meridians */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.295, 0.0055, 8, 96]} />
        <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.34} />
      </mesh>
      <mesh position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.004, 8, 72]} />
        <meshBasicMaterial color="#4B6B8F" transparent opacity={0.32} />
      </mesh>
      <mesh position={[0, -0.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.004, 8, 72]} />
        <meshBasicMaterial color="#4B6B8F" transparent opacity={0.24} />
      </mesh>
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((angle, i) => (
        <mesh key={i} rotation={[0, angle, 0]}>
          <torusGeometry args={[1.292, 0.0038, 8, 84]} />
          <meshBasicMaterial color="#3D5A7A" transparent opacity={0.26} />
        </mesh>
      ))}

      {/* Soft Atmosphere Halo */}
      <mesh>
        <sphereGeometry args={[1.38, 28, 28]} />
        <meshBasicMaterial
          color={UI_ACCENT}
          transparent
          opacity={0.11}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Inclined Orbital Telemetry Track */}
      <mesh rotation={[Math.PI / 2, 0.14, 0]}>
        <torusGeometry args={[1.56, 0.009, 10, 96]} />
        <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.45} />
      </mesh>

      {/* Multi-Hue Latency Arcs + Traveling Packets + Clickable Region Nodes */}
      {routes.map((route, idx) => {
        const isSelected = selectedId === route.id;
        return (
          <group key={route.id}>
            <mesh>
              <tubeGeometry
                args={[route.curve, 44, isSelected ? 0.023 : 0.013, 8, false]}
              />
              <meshBasicMaterial
                color={route.hue}
                transparent
                opacity={isSelected ? 0.96 : 0.42}
              />
            </mesh>

            <mesh
              ref={(el) => {
                packetRefs.current[idx] = el;
              }}
            >
              <sphereGeometry args={[isSelected ? 0.048 : 0.036, 12, 12]} />
              <meshBasicMaterial color={route.hue} toneMapped={false} />
            </mesh>

            <mesh
              position={route.target}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(route.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[isSelected ? 0.072 : 0.052, 14, 14]} />
              <meshBasicMaterial color={route.hue} toneMapped={!isSelected} />
            </mesh>

            {isSelected && (
              <SpriteLabel3D
                text={`${route.name} · ${route.rtt}`}
                position={[
                  route.target.x * 1.14,
                  route.target.y > 0.72 ? route.target.y - 0.19 : route.target.y + 0.18,
                  route.target.z * 1.14,
                ]}
                active
                accentColor={route.hue}
                worldHeight={0.21}
                maxWorldWidth={1.38}
                minHeightScale={0.78}
              />
            )}
          </group>
        );
      })}

      {/* Active Region Target Halo */}
      <group position={activeRoute.target} quaternion={targetQuat}>
        <mesh ref={targetRingRef}>
          <ringGeometry args={[0.095, 0.128, 24]} />
          <meshBasicMaterial
            color={activeRoute.hue}
            side={THREE.DoubleSide}
            transparent
            opacity={0.82}
          />
        </mesh>
      </group>

      {/* Dhaka Origin Beacon + Label */}
      <group position={dhakaPos}>
        <mesh>
          <sphereGeometry args={[0.072, 16, 16]} />
          <meshBasicMaterial color={STATE_HEALTHY} toneMapped={false} />
        </mesh>
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.125, 16, 16]} />
          <meshBasicMaterial color={STATE_HEALTHY} transparent opacity={0.3} />
        </mesh>
      </group>

      <SpriteLabel3D
        text="DAC · Origin"
        position={dhakaLabelPos}
        active
        accentColor={STATE_HEALTHY}
        worldHeight={0.19}
        maxWorldWidth={1.15}
        minHeightScale={0.76}
      />
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
  const dhaka = { x: 182, y: 118 };

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#0D1117] px-3 pb-12 pt-9">
      <span className="pointer-events-none absolute right-2.5 top-2.5 z-20 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-[#8B949E]">
        2D Safe · Graticule
      </span>

      <svg
        viewBox="0 0 320 200"
        className="h-full max-h-[205px] w-full select-none"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="globe2d-clip">
            <circle cx="160" cy="104" r="81" />
          </clipPath>
          <radialGradient id="globe2d-core" cx="42%" cy="36%" r="68%">
            <stop offset="0%" stopColor="#1B2B40" />
            <stop offset="65%" stopColor="#121B28" />
            <stop offset="100%" stopColor="#0C1119" />
          </radialGradient>
        </defs>

        {/* Illuminated Graticule Sphere */}
        <circle
          cx="160"
          cy="104"
          r="82"
          fill="url(#globe2d-core)"
          stroke="rgba(56,189,248,0.32)"
          strokeWidth="1.25"
        />

        <g clipPath="url(#globe2d-clip)">
          <ellipse
            cx="160"
            cy="104"
            rx="82"
            ry="28"
            fill="none"
            stroke="rgba(56,189,248,0.22)"
            strokeWidth="1"
          />
          <ellipse
            cx="160"
            cy="68"
            rx="72"
            ry="18"
            fill="none"
            stroke="rgba(240,246,252,0.08)"
            strokeWidth="0.9"
          />
          <ellipse
            cx="160"
            cy="140"
            rx="72"
            ry="18"
            fill="none"
            stroke="rgba(240,246,252,0.06)"
            strokeWidth="0.9"
          />
          <ellipse
            cx="160"
            cy="104"
            rx="38"
            ry="82"
            fill="none"
            stroke="rgba(240,246,252,0.1)"
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
          <line
            x1="160"
            y1="22"
            x2="160"
            y2="186"
            stroke="rgba(240,246,252,0.06)"
            strokeDasharray="3 3"
          />
        </g>

        {/* Latency Arcs & Interior Nodes (all comfortably inside r=82 sphere) */}
        {REGIONS.map((region) => {
          const isSelected = region.id === selectedId;
          const mx = (dhaka.x + region.svgPos.x) / 2;
          const my = Math.min(dhaka.y, region.svgPos.y) - 28;
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
                strokeOpacity={isSelected ? 0.94 : 0.35}
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
                fillOpacity={isSelected ? 1 : 0.68}
              />

              <text
                x={region.svgPos.x}
                y={region.svgPos.y - 10}
                textAnchor="middle"
                fill={isSelected ? "#E6EDF3" : "#9DA7B3"}
                fontSize="11"
                fontWeight={isSelected ? "700" : "500"}
                fontFamily="var(--font-mono), monospace"
              >
                {region.name}
              </text>
            </g>
          );
        })}

        {/* Dhaka Origin Beacon */}
        <circle cx={dhaka.x} cy={dhaka.y} r="10" fill="#10B981" fillOpacity="0.22" />
        <circle cx={dhaka.x} cy={dhaka.y} r="4.5" fill="#10B981" />
        <text
          x={dhaka.x}
          y={dhaka.y + 15}
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

const GLOBE_CAM_POS: [number, number, number] = [0, 0.22, 4.85];

export function TelemetryGlobe3D() {
  const { canRender3D } = useCanRender3D();
  const [selectedId, setSelectedId] = useState<string>(REGIONS[0].id);
  const [wheelEngaged, setWheelEngaged] = useState(false);
  const [zoomSignal, setZoomSignal] = useState<ZoomSignal>({ action: "reset", seq: 0 });
  const [resetSeq, setResetSeq] = useState(0);
  const draggingRef = useRef(false);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const activeRegion = REGIONS.find((r) => r.id === selectedId) ?? REGIONS[0];

  const triggerZoom = useCallback((action: ZoomAction) => {
    setZoomSignal((prev) => ({ action, seq: prev.seq + 1 }));
    if (action === "reset") {
      setResetSeq((n) => n + 1);
    }
  }, []);

  return (
    <div
      data-lenis-prevent-wheel={wheelEngaged ? "true" : undefined}
      onPointerDown={() => {
        if (canRender3D) setWheelEngaged(true);
      }}
      onPointerLeave={() => setWheelEngaged(false)}
      className="relative h-[265px] w-full overflow-hidden rounded-2xl sm:h-[295px]"
    >
      <div className="pointer-events-none absolute left-2.5 top-2.5 z-30 inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#0D1117]/90 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-[#10B981] backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
        <span>Dhaka · UTC+6</span>
      </div>

      {canRender3D && (
        <CanvasZoomHUD
          className="right-2.5 top-2.5"
          onZoomIn={() => triggerZoom("in")}
          onZoomOut={() => triggerZoom("out")}
          onReset={() => triggerZoom("reset")}
        />
      )}

      <ViewportCanvas
        cameraPosition={GLOBE_CAM_POS}
        fov={38}
        fallback={<Globe2DFallback selectedId={selectedId} onSelect={setSelectedId} />}
        className="h-full w-full"
      >
        <ambientLight intensity={0.72} />
        <hemisphereLight args={["#9CC9FF", "#111A26", 0.95]} />
        <directionalLight position={[4, 4, 5]} intensity={1.35} color="#E6EDF3" />
        <pointLight position={[-3, 1.5, 2.5]} intensity={1.45} decay={0} color={UI_ACCENT} />

        <GlobeAssembly
          selectedId={selectedId}
          resetSeq={resetSeq}
          draggingRef={draggingRef}
          onSelect={setSelectedId}
        />

        <CameraZoomController
          controlsRef={controlsRef}
          defaultPosition={GLOBE_CAM_POS}
          minDistance={2.75}
          maxDistance={8.0}
          zoomSignal={zoomSignal}
          onUserZoomTrigger={() => {
            if (canRender3D) setWheelEngaged(true);
          }}
        />

        <OrbitControls
          ref={controlsRef}
          enableZoom={wheelEngaged}
          zoomSpeed={0.8}
          minDistance={2.75}
          maxDistance={8.0}
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
