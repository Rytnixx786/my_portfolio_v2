"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CATEGORY_HUES, STATE_FAULT, STATE_HEALTHY, UI_ACCENT } from "@/lib/palette";
import { ViewportCanvas } from "./ViewportCanvas";

interface ProjectTopology3DProps {
  slug: string;
  className?: string;
}

/**
 * Cinch 3D interactive mini-lab: toggle between semantic cache hit (0W GPU bypass),
 * AWQ Marlin quantization, or circuit breaker fast-fail directly inside the plate.
 */
function CinchGpuSculpture({
  mode,
}: {
  mode: "cache" | "marlin" | "breaker";
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const hue = CATEGORY_HUES["Inference & Serving"].hex;

  const bypassCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, 0.25, 0.35),
      new THREE.Vector3(-0.35, 1.05, 0.45),
      new THREE.Vector3(0.65, 0.78, -0.15),
      new THREE.Vector3(1.35, 0.15, -0.3),
    ]);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.26;
    }
    if (pulseRef.current) {
      const speed = mode === "cache" ? 0.65 : mode === "marlin" ? 0.42 : 0.9;
      const t = (state.clock.elapsedTime * speed) % 1;
      bypassCurve.getPointAt(t, pulseRef.current.position);
    }
  });

  const pulseColor =
    mode === "cache" ? STATE_HEALTHY : mode === "breaker" ? STATE_FAULT : hue;

  return (
    <group ref={groupRef}>
      {[-0.48, -0.16, 0.16, 0.48].map((y, idx) => (
        <group key={y} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[1.38, 0.12, 0.92]} />
            <meshStandardMaterial
              color={idx === 2 ? "#1C222B" : "#161B22"}
              emissive={mode === "marlin" ? hue : "#000000"}
              emissiveIntensity={mode === "marlin" ? 0.22 : 0}
              roughness={0.35}
              metalness={0.7}
            />
          </mesh>
          <mesh position={[0.66, 0, 0.42]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial
              color={mode === "breaker" && idx === 0 ? STATE_FAULT : pulseColor}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      <mesh>
        <tubeGeometry args={[bypassCurve, 40, 0.026, 8, false]} />
        <meshBasicMaterial color={pulseColor} transparent opacity={0.42} />
      </mesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.075, 14, 14]} />
        <meshBasicMaterial color={pulseColor} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Nexus Researcher 3D interactive mini-lab: click any LangGraph node or toggle HITL gate approval.
 */
function NexusDagSculpture({
  hitlApproved,
  activeNodeIdx,
  onSelectNode,
}: {
  hitlApproved: boolean;
  activeNodeIdx: number;
  onSelectNode: (idx: number, label: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rose = CATEGORY_HUES["Agents & RAG"].hex;

  const nodes = useMemo(
    () => [
      { id: "PLAN", pos: new THREE.Vector3(-1.3, 0.2, 0.35) },
      { id: "QUERY", pos: new THREE.Vector3(-0.75, -0.25, -0.35) },
      { id: "HITL", pos: new THREE.Vector3(-0.15, 0.55, 0.35) },
      { id: "CRAWL", pos: new THREE.Vector3(0.45, -0.15, -0.45) },
      { id: "NLI", pos: new THREE.Vector3(0.95, 0.45, 0.25) },
      { id: "CITE", pos: new THREE.Vector3(1.38, -0.1, -0.1) },
    ],
    []
  );

  const lineGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pts: number[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      pts.push(
        nodes[i].pos.x,
        nodes[i].pos.y,
        nodes[i].pos.z,
        nodes[i + 1].pos.x,
        nodes[i + 1].pos.y,
        nodes[i + 1].pos.z
      );
    }
    geom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  }, [nodes]);

  useEffect(() => {
    return () => {
      lineGeom.dispose();
    };
  }, [lineGeom]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial
          color={hitlApproved ? rose : "#F59E0B"}
          transparent
          opacity={0.58}
        />
      </lineSegments>

      {nodes.map((node, idx) => {
        const isHitl = node.id === "HITL";
        const isSelected = idx === activeNodeIdx;
        const color = isHitl
          ? hitlApproved
            ? STATE_HEALTHY
            : "#F59E0B"
          : isSelected
            ? UI_ACCENT
            : rose;

        return (
          <group key={node.id} position={node.pos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(idx, node.id);
              }}
            >
              <octahedronGeometry args={[isSelected ? 0.22 : 0.16, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected || isHitl ? 1.15 : 0.35}
                roughness={0.3}
                metalness={0.6}
                toneMapped={!isSelected}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * ARES 3D interactive mini-lab: threshold plane slices champion/candidate slice bars in real time.
 */
function AresGateSculpture({ threshold }: { threshold: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const lime = CATEGORY_HUES["MLOps & Security"].hex;

  const slices = useMemo(
    () => [
      { id: "F1", val: 0.94, x: -0.9 },
      { id: "Acc", val: 0.91, x: -0.3 },
      { id: "Slice-A", val: 0.78, x: 0.3 },
      { id: "Drift", val: 0.88, x: 0.9 },
    ],
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.24;
    }
  });

  const planeY = -0.55 + threshold * 1.1;

  return (
    <group ref={groupRef}>
      {slices.map((s) => {
        const passed = s.val >= threshold;
        const height = s.val * 1.15;
        const col = passed ? lime : STATE_FAULT;
        return (
          <mesh key={s.id} position={[s.x, -0.55 + height * 0.5, 0]}>
            <boxGeometry args={[0.3, height, 0.3]} />
            <meshStandardMaterial
              color={col}
              emissive={col}
              emissiveIntensity={passed ? 0.35 : 0.9}
              roughness={0.35}
              metalness={0.6}
              toneMapped={passed}
            />
          </mesh>
        );
      })}

      {/* Live Threshold Promotion Plane */}
      <mesh position={[0, planeY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 0.95]} />
        <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Interactive 3D mini-labs mounted inside flagship Selected Work cards.
 */
export function ProjectTopology3D({ slug, className = "" }: ProjectTopology3DProps) {
  const [cinchMode, setCinchMode] = useState<"cache" | "marlin" | "breaker">("cache");
  const [hitlApproved, setHitlApproved] = useState(true);
  const [nexusNode, setNexusNode] = useState<{ idx: number; label: string }>({
    idx: 2,
    label: "HITL",
  });
  const [aresThreshold, setAresThreshold] = useState(0.82);

  return (
    <div className={`relative h-[225px] w-full sm:h-[260px] ${className}`}>
      <ViewportCanvas cameraPosition={[0, 0.85, 3.65]} fov={38} className="h-full w-full">
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 4]} intensity={1.15} color="#E6EDF3" />
        <pointLight position={[-2.5, -1.5, 2.5]} intensity={0.85} color={UI_ACCENT} />

        {slug === "cinch" && <CinchGpuSculpture mode={cinchMode} />}
        {slug === "nexus-researcher" && (
          <NexusDagSculpture
            hitlApproved={hitlApproved}
            activeNodeIdx={nexusNode.idx}
            onSelectNode={(idx, label) => setNexusNode({ idx, label })}
          />
        )}
        {slug === "ares" && <AresGateSculpture threshold={aresThreshold} />}

        <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.08} />
      </ViewportCanvas>

      {/* Bottom Mini-Lab Control Bar */}
      <div className="absolute bottom-2.5 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(240,246,252,0.12)] bg-[#161B22]/90 px-3 py-1.5 backdrop-blur-md">
        {slug === "cinch" && (
          <>
            <span className="font-mono text-xs text-[#9DA7B3]">Route Probe:</span>
            <div className="flex items-center gap-1.5">
              {(["cache", "marlin", "breaker"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCinchMode(m)}
                  className={`rounded-md px-2 py-0.5 font-mono text-xs uppercase transition-colors ${
                    cinchMode === m
                      ? "bg-[#38BDF8] font-semibold text-[#0D1117]"
                      : "bg-[#0D1117] text-[#9DA7B3] hover:text-[#E6EDF3]"
                  }`}
                >
                  {m === "cache" ? "4.12ms Cache" : m === "marlin" ? "331 tok/s" : "OOM Fail"}
                </button>
              ))}
            </div>
          </>
        )}

        {slug === "nexus-researcher" && (
          <>
            <span className="font-mono text-xs text-[#9DA7B3]">
              Node: <strong className="text-[#E6EDF3]">{nexusNode.label}</strong>
            </span>
            <button
              type="button"
              onClick={() => setHitlApproved((v) => !v)}
              className={`rounded-md px-2.5 py-0.5 font-mono text-xs uppercase transition-colors ${
                hitlApproved
                  ? "bg-[#10B981]/20 text-[#10B981]"
                  : "bg-[#F59E0B]/20 text-[#F59E0B]"
              }`}
            >
              {hitlApproved ? "Approved -> Scrape" : "Paused (Edit Queries)"}
            </button>
          </>
        )}

        {slug === "ares" && (
          <label className="flex w-full items-center justify-between gap-3 font-mono text-xs text-[#9DA7B3]">
            <span>Min Slice F1 Gate: {(aresThreshold * 100).toFixed(0)}%</span>
            <input
              type="range"
              min="0.65"
              max="0.95"
              step="0.01"
              value={aresThreshold}
              onChange={(e) => setAresThreshold(Number(e.target.value))}
              className="w-28 accent-[#A8CE6C]"
            />
          </label>
        )}
      </div>
    </div>
  );
}
