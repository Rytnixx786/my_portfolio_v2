"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "@/data/projects";
import {
  CATEGORY_HUES,
  STATE_HEALTHY,
  STATE_WARN,
  UI_ACCENT,
} from "@/lib/palette";
import { SpriteLabel3D } from "@/components/canvas/SpriteLabel3D";
import { ViewportCanvas } from "@/components/canvas/ViewportCanvas";

interface ArchitectureDiagram3DProps {
  architecture: Project["architecture"];
  activeIndex: number;
  onSelectNode: (index: number) => void;
}

function classifyNodeKind(id: string): "entry" | "storage" | "guard" | "compute" {
  const k = id.toLowerCase();
  if (/db|sql|pg|audit|ledger|golden|cache|queue|rls/.test(k)) return "storage";
  if (/gate|guard|breaker|refusal|sod|finops|hitl|filter|middleware/.test(k)) return "guard";
  if (/client|ui|query|ci|planner/.test(k)) return "entry";
  return "compute";
}

function nodeColor(kind: ReturnType<typeof classifyNodeKind>, active: boolean) {
  if (active) return UI_ACCENT;
  switch (kind) {
    case "storage":
      return CATEGORY_HUES["MLOps & Security"].hex;
    case "guard":
      return STATE_WARN;
    case "entry":
      return STATE_HEALTHY;
    default:
      return CATEGORY_HUES["Inference & Serving"].hex;
  }
}

function SpatialDagScene({
  architecture,
  activeIndex,
  onSelectNode,
}: ArchitectureDiagram3DProps) {
  const nodes = architecture.nodes;
  const connections = architecture.connections;
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const positioned = useMemo(() => {
    const count = nodes.length;
    return nodes.map((n, idx) => {
      const x = (idx - (count - 1) / 2) * 1.36;
      const y = Math.sin(idx * 1.1) * 0.45;
      const z = idx % 2 === 0 ? 0.56 : -0.56;
      return {
        ...n,
        idx,
        kind: classifyNodeKind(n.id),
        vec: new THREE.Vector3(x, y, z),
      };
    });
  }, [nodes]);

  const byId = useMemo(() => new Map(positioned.map((p) => [p.id, p])), [positioned]);

  const curves = useMemo(() => {
    return connections
      .map((conn) => {
        const from = byId.get(conn.from);
        const to = byId.get(conn.to);
        if (!from || !to) return null;
        const mid = from.vec.clone().add(to.vec).multiplyScalar(0.5);
        mid.y += 0.45;
        const curve = new THREE.QuadraticBezierCurve3(from.vec, mid, to.vec);
        return {
          key: `${conn.from}-${conn.to}`,
          fromId: conn.from,
          toId: conn.to,
          curve,
        };
      })
      .filter(Boolean) as Array<{
      key: string;
      fromId: string;
      toId: string;
      curve: THREE.QuadraticBezierCurve3;
    }>;
  }, [connections, byId]);

  const activeNode = positioned[activeIndex] ?? positioned[0];

  useEffect(() => {
    if (!controlsRef.current || !activeNode) return;
    controlsRef.current.target.lerp(activeNode.vec, 0.45);
    controlsRef.current.update();
  }, [activeNode]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    curves.forEach((c, idx) => {
      const mesh = pulseRefs.current[idx];
      if (!mesh) return;
      const u = (t * 0.48 + idx * 0.16) % 1;
      c.curve.getPointAt(u, mesh.position);
    });
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#9CC9FF", "#0D1117", 0.75]} />
      <directionalLight position={[5, 6, 5]} intensity={1.35} color="#E6EDF3" />
      <pointLight position={[-4, 3, 4]} intensity={1.4} decay={0} color={UI_ACCENT} />

      <gridHelper args={[14, 24, "#243040", "#171E28"]} position={[0, -1.25, 0]} />

      {curves.map((c, idx) => {
        const highlighted = c.fromId === activeNode?.id || c.toId === activeNode?.id;
        return (
          <group key={c.key}>
            <mesh>
              <tubeGeometry args={[c.curve, 24, highlighted ? 0.032 : 0.017, 8, false]} />
              <meshBasicMaterial
                color={highlighted ? UI_ACCENT : "#384659"}
                transparent
                opacity={highlighted ? 0.92 : 0.46}
                toneMapped={!highlighted}
              />
            </mesh>
            <mesh
              ref={(el) => {
                pulseRefs.current[idx] = el;
              }}
            >
              <sphereGeometry args={[highlighted ? 0.068 : 0.045, 10, 10]} />
              <meshBasicMaterial
                color={highlighted ? STATE_HEALTHY : UI_ACCENT}
                toneMapped={!highlighted}
              />
            </mesh>
          </group>
        );
      })}

      {positioned.map((node) => {
        const isActive = node.idx === activeIndex;
        const hue = nodeColor(node.kind, isActive);

        return (
          <group key={node.id} position={node.vec}>
            {node.kind === "guard" ? (
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.idx);
                }}
              >
                <octahedronGeometry args={[0.38, 0]} />
                <meshStandardMaterial
                  color={isActive ? "#263950" : "#1E293B"}
                  emissive={hue}
                  emissiveIntensity={isActive ? 0.72 : 0.24}
                  roughness={0.38}
                  metalness={0.32}
                />
              </mesh>
            ) : node.kind === "storage" ? (
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.idx);
                }}
              >
                <cylinderGeometry args={[0.36, 0.36, 0.46, 18]} />
                <meshStandardMaterial
                  color={isActive ? "#263950" : "#1E293B"}
                  emissive={hue}
                  emissiveIntensity={isActive ? 0.72 : 0.24}
                  roughness={0.4}
                  metalness={0.32}
                />
              </mesh>
            ) : (
              <RoundedBox
                args={[0.96, 0.46, 0.6]}
                radius={0.08}
                smoothness={3}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.idx);
                }}
                onPointerOver={() => {
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "auto";
                }}
              >
                <meshStandardMaterial
                  color={isActive ? "#263950" : "#1E293B"}
                  roughness={0.38}
                  metalness={0.34}
                  emissive={hue}
                  emissiveIntensity={isActive ? 0.68 : 0.18}
                />
              </RoundedBox>
            )}

            <SpriteLabel3D
              text={`${String(node.idx + 1).padStart(2, "0")} · ${node.label}`}
              position={[0, 0.5, 0]}
              active={isActive}
              accentColor={hue}
              worldHeight={0.23}
              maxWorldWidth={1.38}
              minHeightScale={0.78}
            />
          </group>
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minDistance={4.2}
        maxDistance={12}
        enableDamping
        dampingFactor={0.07}
        touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </group>
  );
}

/**
 * Spatial 3D architecture topology stage with semantic node geometries and critical-path pulses.
 */
export function ArchitectureDiagram3D(props: ArchitectureDiagram3DProps) {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[380px]">
      <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-wrap items-center gap-3 rounded-lg border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-3 py-1 font-mono text-xs text-[#9DA7B3]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Entry
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#59C5EE]" /> Compute
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Guard
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#A8CE6C]" /> Storage
        </span>
      </div>

      <ViewportCanvas cameraPosition={[0, 2.8, 9.8]} fov={42} className="h-full w-full">
        <SpatialDagScene {...props} />
      </ViewportCanvas>
    </div>
  );
}
