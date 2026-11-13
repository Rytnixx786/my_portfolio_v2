"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "@/data/projects";
import { ViewportCanvas } from "@/components/canvas/ViewportCanvas";

interface ArchitectureDiagram3DProps {
  architecture: Project["architecture"];
  activeIndex: number;
  onSelectNode: (index: number) => void;
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

  const positioned = useMemo(() => {
    const count = nodes.length;
    return nodes.map((n, idx) => {
      const x = (idx - (count - 1) / 2) * 1.45;
      const y = Math.sin(idx * 1.1) * 0.45;
      const z = idx % 2 === 0 ? 0.55 : -0.55;
      return {
        ...n,
        idx,
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

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (controlsRef.current && activeNode) {
      controlsRef.current.target.lerp(activeNode.vec, Math.min(1, dt * 4));
      controlsRef.current.update();
    }

    curves.forEach((item, idx) => {
      const mesh = pulseRefs.current[idx];
      if (!mesh) return;
      const t = (state.clock.elapsedTime * 0.42 + idx * 0.17) % 1;
      item.curve.getPointAt(t, mesh.position);
    });
  });

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} color="#E6EDF3" />
      <pointLight position={[0, 3, 2]} intensity={1.5} color="#38BDF8" />

      <gridHelper args={[14, 24, "#38BDF8", "#1C222B"]} position={[0, -1.1, 0]} />

      {/* 3D Curved Tube Edges & Streaming Signal Spheres */}
      {curves.map((item, idx) => {
        const isActiveEdge =
          item.fromId === activeNode?.id || item.toId === activeNode?.id;
        return (
          <group key={item.key}>
            <mesh>
              <tubeGeometry args={[item.curve, 28, isActiveEdge ? 0.028 : 0.015, 8, false]} />
              <meshBasicMaterial
                color={isActiveEdge ? "#38BDF8" : "#4A5568"}
                transparent
                opacity={isActiveEdge ? 0.85 : 0.35}
              />
            </mesh>
            <mesh
              ref={(el) => {
                pulseRefs.current[idx] = el;
              }}
            >
              <sphereGeometry args={[isActiveEdge ? 0.065 : 0.035, 12, 12]} />
              <meshBasicMaterial color={isActiveEdge ? "#10B981" : "#38BDF8"} />
            </mesh>
          </group>
        );
      })}

      {/* 3D Interactive Stage Nodes */}
      {positioned.map((node) => {
        const isSelected = node.idx === activeIndex;
        return (
          <group key={node.id} position={node.vec}>
            <RoundedBox
              args={[0.85, 0.42, 0.56]}
              radius={0.07}
              smoothness={3}
              scale={isSelected ? 1.15 : 1}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.idx);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <meshStandardMaterial
                color={isSelected ? "#38BDF8" : "#161B22"}
                emissive={isSelected ? "#38BDF8" : "#000000"}
                emissiveIntensity={isSelected ? 0.45 : 0}
                roughness={0.32}
                metalness={0.62}
              />
            </RoundedBox>

            <Html position={[0, 0.46, 0]} center distanceFactor={7.8} zIndexRange={[10, 0]}>
              <button
                type="button"
                onClick={() => onSelectNode(node.idx)}
                className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition-colors ${
                  isSelected
                    ? "border-[#38BDF8] bg-[#0D1117]/95 font-semibold text-[#7DD3FC]"
                    : "border-[rgba(240,246,252,0.14)] bg-[#161B22]/90 text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                0{node.idx + 1} · {node.label}
              </button>
            </Html>
          </group>
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI * 0.48}
      />
    </>
  );
}

/**
 * Interactive 3D spatial DAG topology viewer for /work/[slug] case studies.
 */
export function ArchitectureDiagram3D(props: ArchitectureDiagram3DProps) {
  return (
    <ViewportCanvas
      className="h-[310px] w-full bg-[#0D1117] sm:h-[360px]"
      cameraPosition={[0, 2.35, 5.8]}
      fov={42}
      fallback={null}
    >
      <SpatialDagScene {...props} />
    </ViewportCanvas>
  );
}

