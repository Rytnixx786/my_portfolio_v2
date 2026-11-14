"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "@/data/projects";
import { classifyNodeKind, type ArchitectureNodeKind } from "@/lib/architecture";
import {
  CATEGORY_HUES,
  STATE_HEALTHY,
  STATE_WARN,
  UI_ACCENT,
} from "@/lib/palette";
import {
  CameraZoomController,
  CanvasZoomHUD,
  type ZoomAction,
  type ZoomSignal,
} from "@/components/canvas/CanvasZoomHUD";
import { SpriteLabel3D } from "@/components/canvas/SpriteLabel3D";
import { ViewportCanvas } from "@/components/canvas/ViewportCanvas";

interface ArchitectureDiagram3DProps {
  architecture: Project["architecture"];
  activeIndex: number;
  playing?: boolean;
  onSelectNode: (index: number) => void;
}

const UP_VEC = new THREE.Vector3(0, 1, 0);

function nodeColor(kind: ArchitectureNodeKind, active: boolean) {
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
  playing = false,
  onSelectNode,
  defaultCamPos,
  defaultTarget,
  zoomSignal,
  enableWheelZoom,
}: ArchitectureDiagram3DProps & {
  defaultCamPos: [number, number, number];
  defaultTarget: [number, number, number];
  zoomSignal: ZoomSignal;
  enableWheelZoom: boolean;
}) {
  const nodes = architecture.nodes;
  const connections = architecture.connections;
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);
  const nodeGroupRefs = useRef<Array<THREE.Group | null>>([]);
  const elapsedRef = useRef(0);
  const userAdjustedCamRef = useRef(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  const aspect = size.width / Math.max(1, size.height);
  const responsiveCamPos = useMemo<[number, number, number]>(() => {
    if (aspect >= 1.55) return defaultCamPos;
    const scale = Math.min(1.68, 1.52 / Math.max(0.65, aspect));
    return [
      defaultCamPos[0],
      defaultCamPos[1] * (1 + (scale - 1) * 0.42),
      defaultCamPos[2] * scale,
    ];
  }, [aspect, defaultCamPos]);

  useEffect(() => {
    if (zoomSignal.seq > 0) {
      userAdjustedCamRef.current = true;
    }
  }, [zoomSignal.seq]);

  useEffect(() => {
    if (userAdjustedCamRef.current) return;
    camera.position.set(...responsiveCamPos);
    controlsRef.current?.target.set(...defaultTarget);
    controlsRef.current?.update();
    invalidate();
  }, [camera, responsiveCamPos, defaultTarget, invalidate]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const layoutCols = nodes.length <= 4 ? nodes.length : Math.ceil(nodes.length / 2);
  const stepX = layoutCols <= 3 ? 2.15 : 1.92;

  const positioned = useMemo(() => {
    const count = nodes.length;
    const twoTier = count > 4;
    return nodes.map((n, idx) => {
      const row = twoTier && idx >= layoutCols ? 1 : 0;
      const col = row === 0 ? idx : layoutCols - 1 - (idx - layoutCols);
      const x = (col - (layoutCols - 1) / 2) * stepX;
      const y = twoTier ? (row === 0 ? 0.66 : 0.0) : 0.15;
      const z = twoTier ? (row === 0 ? -1.25 : 1.25) : 0;
      return {
        ...n,
        idx,
        row,
        col,
        twoTier,
        kind: classifyNodeKind(n.id, idx),
        vec: new THREE.Vector3(x, y, z),
      };
    });
  }, [nodes, layoutCols, stepX]);

  const byId = useMemo(() => new Map(positioned.map((p) => [p.id, p])), [positioned]);

  const curves = useMemo(() => {
    const edgeSet = new Set(connections.map((c) => `${c.from}->${c.to}`));
    return connections
      .map((conn) => {
        const from = byId.get(conn.from);
        const to = byId.get(conn.to);
        if (!from || !to) return null;

        const hasReverse = edgeSet.has(`${conn.to}->${conn.from}`);
        const forward = from.idx < to.idx;
        const sameRow = from.row === to.row;
        const colSpan = Math.abs(from.col - to.col);
        const mid = from.vec.clone().add(to.vec).multiplyScalar(0.5);

        if (hasReverse) {
          if (sameRow) {
            mid.y += forward ? 0.62 : 0.14;
            mid.z += forward ? 0.28 : -0.28;
          } else {
            mid.y += forward ? 0.56 : 0.12;
            mid.x += forward ? 0.34 : -0.34;
          }
        } else if (sameRow && colSpan > 1) {
          mid.y += 0.95 + colSpan * 0.14;
          mid.z += from.row === 0 ? -0.35 : 0.35;
        } else if (sameRow) {
          mid.y += 0.46;
        } else {
          mid.y += 0.52 + (colSpan > 1 ? 0.32 : 0);
        }

        const curve = new THREE.QuadraticBezierCurve3(from.vec, mid, to.vec);
        const arrowPos = curve.getPointAt(0.8);
        const tangent = curve.getTangentAt(0.8).normalize();
        const arrowQuat = new THREE.Quaternion().setFromUnitVectors(UP_VEC, tangent);

        return {
          key: `${conn.from}-${conn.to}`,
          fromId: conn.from,
          toId: conn.to,
          curve,
          arrowPos,
          arrowQuat,
        };
      })
      .filter(Boolean) as Array<{
      key: string;
      fromId: string;
      toId: string;
      curve: THREE.QuadraticBezierCurve3;
      arrowPos: THREE.Vector3;
      arrowQuat: THREE.Quaternion;
    }>;
  }, [connections, byId]);

  const activeNode = positioned[activeIndex] ?? positioned[0];
  const stageWidth = Math.max(7.2, layoutCols * stepX + 1.8);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const t = elapsedRef.current;

    controlsRef.current?.update();

    positioned.forEach((node, idx) => {
      const grp = nodeGroupRefs.current[idx];
      if (!grp) return;
      const isActive = idx === activeIndex;
      const isHovered = idx === hoveredIdx;
      const targetY =
        node.vec.y +
        (isActive ? 0.16 + Math.sin(t * 3.2) * 0.03 : isHovered ? 0.08 : 0);
      grp.position.y = THREE.MathUtils.damp(grp.position.y, targetY, 9, dt);

      const targetScale = isActive ? 1.12 : isHovered ? 1.06 : 1.0;
      const s = THREE.MathUtils.damp(grp.scale.x, targetScale, 9, dt);
      grp.scale.setScalar(s);
    });

    curves.forEach((c, idx) => {
      const mesh = pulseRefs.current[idx];
      if (!mesh) return;
      const isOutgoing = c.fromId === activeNode?.id;
      const isIncoming = c.toId === activeNode?.id;
      const speed = isOutgoing ? (playing ? 0.85 : 0.62) : isIncoming ? 0.5 : 0.32;
      const u = (t * speed + idx * 0.17) % 1;
      c.curve.getPointAt(u, mesh.position);
    });
  });

  return (
    <group>
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#B2D4FF", "#0D1117", 0.9]} />
      <directionalLight position={[4, 7, 5]} intensity={1.4} color="#E6EDF3" />
      <pointLight position={[-4, 3, 4]} intensity={1.35} decay={0} color={UI_ACCENT} />
      <pointLight position={[4, 2.5, -3]} intensity={0.9} decay={0} color={STATE_HEALTHY} />

      <CameraZoomController
        controlsRef={controlsRef}
        defaultPosition={responsiveCamPos}
        defaultTarget={defaultTarget}
        minDistance={2.8}
        maxDistance={22}
        zoomSignal={zoomSignal}
      />

      {/* Machined Dark Compute Deck */}
      <mesh position={[0, -0.58, 0]}>
        <boxGeometry args={[stageWidth, 0.08, 4.4]} />
        <meshStandardMaterial color="#121822" roughness={0.65} metalness={0.22} />
      </mesh>
      <gridHelper
        args={[stageWidth, 18, "#243242", "#161F2A"]}
        position={[0, -0.535, 0]}
        scale={[1, 1, 4.2 / stageWidth]}
      />

      {curves.map((c, idx) => {
        const isOutgoing = c.fromId === activeNode?.id;
        const isIncoming = c.toId === activeNode?.id;
        const highlighted = isOutgoing || isIncoming;
        const edgeColor = isOutgoing
          ? STATE_HEALTHY
          : isIncoming
            ? UI_ACCENT
            : "#3E4E63";

        return (
          <group key={c.key}>
            <mesh>
              <tubeGeometry
                args={[c.curve, 28, highlighted ? 0.03 : 0.016, 8, false]}
              />
              <meshBasicMaterial
                color={edgeColor}
                transparent
                opacity={highlighted ? 0.92 : 0.45}
                toneMapped={!highlighted}
              />
            </mesh>

            {/* Directional Arrowhead */}
            <mesh position={c.arrowPos} quaternion={c.arrowQuat}>
              <coneGeometry
                args={[highlighted ? 0.072 : 0.048, highlighted ? 0.17 : 0.12, 10]}
              />
              <meshBasicMaterial
                color={edgeColor}
                transparent
                opacity={highlighted ? 0.96 : 0.58}
                toneMapped={!highlighted}
              />
            </mesh>

            {/* Traveling Trace Packet */}
            <mesh
              ref={(el) => {
                pulseRefs.current[idx] = el;
              }}
            >
              <sphereGeometry
                args={[isOutgoing ? 0.082 : highlighted ? 0.065 : 0.042, 12, 12]}
              />
              <meshBasicMaterial
                color={isOutgoing ? STATE_HEALTHY : UI_ACCENT}
                toneMapped={!highlighted}
              />
            </mesh>
          </group>
        );
      })}

      {positioned.map((node) => {
        const isActive = node.idx === activeIndex;
        const isHovered = node.idx === hoveredIdx;
        const hue = nodeColor(node.kind, isActive);
        const labelY = 0.56;
        const pedestalY = node.vec.y - 0.5;
        const hasRiser = node.twoTier && node.row === 0;

        const handleOver = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          setHoveredIdx(node.idx);
          document.body.style.cursor = "pointer";
        };
        const handleOut = () => {
          setHoveredIdx((prev) => (prev === node.idx ? null : prev));
          document.body.style.cursor = "auto";
        };
        const handleClick = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          onSelectNode(node.idx);
        };

        return (
          <group key={node.id}>
            {/* Grounded Stage Pedestal & Active Halo Ring */}
            <group position={[node.vec.x, pedestalY, node.vec.z]}>
              {hasRiser && (
                <mesh position={[0, -0.35, 0]}>
                  <cylinderGeometry args={[0.09, 0.14, 0.66, 16]} />
                  <meshStandardMaterial color="#141C28" roughness={0.6} metalness={0.32} />
                </mesh>
              )}
              <mesh>
                <cylinderGeometry args={[0.42, 0.46, 0.06, 20]} />
                <meshStandardMaterial
                  color={isActive ? "#1D2B3D" : "#151D29"}
                  roughness={0.5}
                  metalness={0.3}
                />
              </mesh>
              <mesh position={[0, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.44, 0.52, 28]} />
                <meshBasicMaterial
                  color={hue}
                  transparent
                  opacity={isActive ? 0.95 : isHovered ? 0.65 : 0.25}
                  toneMapped={!isActive}
                />
              </mesh>
            </group>

            <group
              ref={(el) => {
                nodeGroupRefs.current[node.idx] = el;
              }}
              position={node.vec}
            >
              {node.kind === "guard" ? (
                <mesh
                  onClick={handleClick}
                  onPointerOver={handleOver}
                  onPointerOut={handleOut}
                >
                  <octahedronGeometry args={[0.36, 0]} />
                  <meshStandardMaterial
                    color={isActive ? "#2A3E57" : "#222E40"}
                    emissive={hue}
                    emissiveIntensity={isActive ? 0.78 : isHovered ? 0.48 : 0.3}
                    roughness={0.36}
                    metalness={0.32}
                  />
                </mesh>
              ) : node.kind === "storage" ? (
                <mesh
                  onClick={handleClick}
                  onPointerOver={handleOver}
                  onPointerOut={handleOut}
                >
                  <cylinderGeometry args={[0.34, 0.34, 0.44, 20]} />
                  <meshStandardMaterial
                    color={isActive ? "#2A3E57" : "#222E40"}
                    emissive={hue}
                    emissiveIntensity={isActive ? 0.78 : isHovered ? 0.48 : 0.3}
                    roughness={0.38}
                    metalness={0.32}
                  />
                </mesh>
              ) : (
                <RoundedBox
                  args={[0.92, 0.42, 0.56]}
                  radius={0.08}
                  smoothness={3}
                  onClick={handleClick}
                  onPointerOver={handleOver}
                  onPointerOut={handleOut}
                >
                  <meshStandardMaterial
                    color={isActive ? "#2A3E57" : "#222E40"}
                    roughness={0.36}
                    metalness={0.34}
                    emissive={hue}
                    emissiveIntensity={isActive ? 0.72 : isHovered ? 0.45 : 0.24}
                  />
                </RoundedBox>
              )}

              <SpriteLabel3D
                text={`${String(node.idx + 1).padStart(2, "0")} · ${node.label}`}
                position={[0, labelY, 0]}
                active={isActive || isHovered}
                accentColor={hue}
                worldHeight={0.27}
                maxWorldWidth={layoutCols <= 3 ? 1.88 : 1.66}
                minHeightScale={0.85}
              />
            </group>
          </group>
        );
      })}

      <OrbitControls
        ref={controlsRef}
        target={defaultTarget}
        enableZoom={enableWheelZoom}
        zoomSpeed={0.85}
        enablePan={false}
        minDistance={2.8}
        maxDistance={22}
        minPolarAngle={0.22}
        maxPolarAngle={Math.PI * 0.46}
        minAzimuthAngle={-Math.PI * 0.42}
        maxAzimuthAngle={Math.PI * 0.42}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.65}
        onStart={() => {
          userAdjustedCamRef.current = true;
        }}
        touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </group>
  );
}

/**
 * Spatial 3D architecture topology stage with semantic node geometries,
 * directional critical-path trace pulses, crisp legible sprite labels, and zoom controls.
 */
export function ArchitectureDiagram3D(props: ArchitectureDiagram3DProps) {
  const count = props.architecture.nodes.length;
  const defaultCamPos = useMemo<[number, number, number]>(
    () => [0, 3.8, count <= 6 ? 6.6 : 7.4],
    [count]
  );
  const defaultTarget = useMemo<[number, number, number]>(() => [0, 0.35, 0], []);
  const [zoomSignal, setZoomSignal] = useState<ZoomSignal>({ action: "reset", seq: 0 });
  const [wheelEngaged, setWheelEngaged] = useState(false);

  const triggerZoom = useCallback((action: ZoomAction) => {
    setZoomSignal((prev) => ({ action, seq: prev.seq + 1 }));
  }, []);

  return (
    <div
      data-lenis-prevent-wheel={wheelEngaged ? "true" : undefined}
      onPointerDown={() => setWheelEngaged(true)}
      onPointerLeave={() => setWheelEngaged(false)}
      className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] sm:h-[410px]"
    >
      {/* Legend Pill (bottom-left on narrow mobile so it never collides with Zoom HUD; top-left on sm+) */}
      <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-30 flex flex-wrap items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22]/90 px-2.5 py-1 font-mono text-[10px] text-[#9DA7B3] backdrop-blur-md sm:bottom-auto sm:left-3 sm:top-3 sm:gap-3 sm:px-3 sm:text-xs">
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

      {/* Zoom In / Zoom Out / Reset Controls */}
      <CanvasZoomHUD
        onZoomIn={() => triggerZoom("in")}
        onZoomOut={() => triggerZoom("out")}
        onReset={() => triggerZoom("reset")}
      />

      {/* Interaction Hint */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-30 hidden rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/85 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8B949E] backdrop-blur-md sm:inline-flex">
        Drag to orbit · +/- or click &amp; scroll to zoom · Click stage
      </div>

      {/* Live Trace Indicator */}
      {props.playing && (
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-30 inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/40 bg-[#0D1117]/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#10B981] backdrop-blur-md sm:bottom-3 sm:left-auto sm:right-3 sm:top-auto sm:gap-2 sm:px-3 sm:text-[11px]">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
          <span className="tabular-nums">
            Tracing {String(props.activeIndex + 1).padStart(2, "0")}/
            {String(count).padStart(2, "0")}
          </span>
        </div>
      )}

      <ViewportCanvas
        cameraPosition={defaultCamPos}
        fov={40}
        className="h-full w-full"
      >
        <SpatialDagScene
          {...props}
          defaultCamPos={defaultCamPos}
          defaultTarget={defaultTarget}
          zoomSignal={zoomSignal}
          enableWheelZoom={wheelEngaged}
        />
      </ViewportCanvas>
    </div>
  );
}
