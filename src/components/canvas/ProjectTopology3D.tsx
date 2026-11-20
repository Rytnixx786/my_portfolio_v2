"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { CATEGORY_HUES, STATE_FAULT, STATE_HEALTHY, STATE_WARN, UI_ACCENT } from "@/lib/palette";
import {
  CameraZoomController,
  CanvasZoomHUD,
  type ZoomAction,
  type ZoomSignal,
} from "./CanvasZoomHUD";
import { ViewportCanvas } from "./ViewportCanvas";

interface ProjectTopology3DProps {
  slug: string;
  className?: string;
}

/**
 * Tally 3D interactive mini-lab: compares TF-IDF Setup A vs Qwen-7B GPU rack Setup B
 * streaming OTLP telemetry into contracted dbt Marts (46/46), plus cache-bug misfire mode.
 */
function TallyCostSculpture({
  mode,
  draggingRef,
}: {
  mode: "tfidf" | "qwen7b" | "cache_bug";
  draggingRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const prismRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const packetStreamRef = useRef<THREE.InstancedMesh>(null);
  const tfidfMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const qwenMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const prismMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const packetPt = useMemo(() => new THREE.Vector3(), []);
  const packetTan = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const elapsedRef = useRef(0);
  const lime = CATEGORY_HUES["MLOps & Security"].hex;
  const { frameloop, gl, invalidate } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    return () => {
      dom.style.cursor = "auto";
    };
  }, [gl]);

  useEffect(() => {
    invalidate();
  }, [mode, invalidate]);

  const curves = useMemo(
    () => ({
      tfidf: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.18, 0.34, 0.34),
        new THREE.Vector3(-0.34, 0.86, 0.28),
        new THREE.Vector3(0.46, 0.48, 0.12),
        new THREE.Vector3(1.12, 0.04, 0),
      ]),
      qwen7b: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.74, 0.28, -0.34),
        new THREE.Vector3(-0.08, 0.56, -0.36),
        new THREE.Vector3(0.56, 0.3, -0.16),
        new THREE.Vector3(1.12, 0.02, 0),
      ]),
      cache_bug: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.18, 0.34, 0.34),
        new THREE.Vector3(-0.42, 0.9, 0.52),
        new THREE.Vector3(0.14, -0.46, -0.42),
        new THREE.Vector3(0.62, 0.52, 0.48),
        new THREE.Vector3(0.92, -0.58, 0.62),
      ]),
    }),
    []
  );

  const STREAM_COUNT = 8;

  useFrame((_, delta) => {
    const isStatic = frameloop === "demand";
    const dt = Math.min(delta, 0.05);
    if (!isStatic) {
      elapsedRef.current += dt;
      if (groupRef.current && !draggingRef.current) {
        groupRef.current.rotation.y += dt * 0.2;
      }
      if (prismRef.current) {
        prismRef.current.rotation.y += dt * (mode === "cache_bug" ? 0.22 : 0.72);
        prismRef.current.position.y = 0.02 + Math.sin(elapsedRef.current * 2.1) * 0.055;
      }
    }

    const activeCurve = curves[mode];
    const speed = mode === "tfidf" ? 0.86 : mode === "qwen7b" ? 0.4 : 0.66;
    const leadT = isStatic ? 0.44 : (elapsedRef.current * speed) % 1;

    if (pulseRef.current) {
      activeCurve.getPointAt(leadT, pulseRef.current.position);
      const scale = isStatic ? 1 : 0.92 + Math.sin(elapsedRef.current * 8.5) * 0.16;
      pulseRef.current.scale.setScalar(scale);
    }

    if (packetStreamRef.current) {
      for (let i = 0; i < STREAM_COUNT; i++) {
        const t = (leadT + (i + 1) / (STREAM_COUNT + 1)) % 1;
        activeCurve.getPointAt(t, packetPt);
        activeCurve.getTangentAt(t, packetTan);
        const jitterY =
          mode === "cache_bug" && !isStatic
            ? Math.sin(elapsedRef.current * 11 + i * 1.9) * 0.055
            : 0;
        const jitterZ =
          mode === "cache_bug" && !isStatic
            ? Math.cos(elapsedRef.current * 9 + i * 2.3) * 0.055
            : 0;
        dummy.position.set(packetPt.x, packetPt.y + jitterY, packetPt.z + jitterZ);
        lookTarget.set(
          packetPt.x + packetTan.x,
          packetPt.y + jitterY + packetTan.y,
          packetPt.z + jitterZ + packetTan.z
        );
        dummy.lookAt(lookTarget);
        const taper = 0.45 + 0.55 * Math.sin(t * Math.PI);
        if (mode === "tfidf") {
          dummy.scale.set(taper * 0.74, taper * 0.74, taper * 1.55);
        } else if (mode === "qwen7b") {
          dummy.scale.set(taper * 1.15, taper * 1.15, taper * 1.25);
        } else {
          dummy.scale.setScalar(taper * 0.9);
        }
        dummy.updateMatrix();
        packetStreamRef.current.setMatrixAt(i, dummy.matrix);
      }
      packetStreamRef.current.instanceMatrix.needsUpdate = true;
    }

    const arrivalGlow = mode === "cache_bug" ? 0 : Math.max(0, 1 - Math.abs(leadT - 0.92) * 5.0);
    if (tfidfMatRef.current) {
      const base = mode === "tfidf" ? 0.62 : mode === "cache_bug" ? 0.48 : 0.12;
      const flicker = mode === "cache_bug" && !isStatic ? Math.abs(Math.sin(elapsedRef.current * 10)) * 0.35 : 0;
      tfidfMatRef.current.emissiveIntensity = base + flicker;
    }
    if (qwenMatRef.current) {
      const base = mode === "qwen7b" ? 0.58 : 0.12;
      const throb = mode === "qwen7b" && !isStatic ? Math.sin(elapsedRef.current * 4) * 0.12 : 0;
      qwenMatRef.current.emissiveIntensity = base + throb;
    }
    if (prismMatRef.current) {
      const base = mode === "cache_bug" ? 0.18 : 0.42;
      prismMatRef.current.emissiveIntensity = isStatic ? base : base + arrivalGlow * 0.55;
    }
  });

  const streamColor =
    mode === "tfidf" ? STATE_HEALTHY : mode === "qwen7b" ? UI_ACCENT : STATE_FAULT;
  const setupAColor = mode === "cache_bug" ? STATE_WARN : STATE_HEALTHY;
  const prismColor = mode === "tfidf" ? lime : mode === "qwen7b" ? UI_ACCENT : STATE_FAULT;

  return (
    <group ref={groupRef}>
      <pointLight position={[0.1, 1.3, 0.85]} intensity={1.2} distance={4.0} color={streamColor} />

      {/* Setup A: Slim glowing emerald TF-IDF column (99.8%, 0.046ms, $3.01e-07/1k) */}
      <group position={[-1.18, -0.02, 0.34]}>
        <RoundedBox args={[0.24, 1.08, 0.24]} radius={0.035} smoothness={3}>
          <meshStandardMaterial
            ref={tfidfMatRef}
            color="#1B2A28"
            emissive={setupAColor}
            emissiveIntensity={0.62}
            roughness={0.28}
            metalness={0.42}
          />
        </RoundedBox>
        <mesh position={[0, 0.57, 0]}>
          <boxGeometry args={[0.26, 0.045, 0.26]} />
          <meshBasicMaterial color={setupAColor} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.126]}>
          <boxGeometry args={[0.042, 0.9, 0.018]} />
          <meshBasicMaterial color={setupAColor} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, -0.57, 0]}>
          <boxGeometry args={[0.34, 0.055, 0.34]} />
          <meshStandardMaterial color="#161B22" roughness={0.5} metalness={0.5} />
        </mesh>
      </group>

      {/* Setup B: Larger heavy Qwen-7B GPU rack (90.5%, 1,298ms, 10,276x cost) */}
      <group position={[-0.74, -0.08, -0.34]}>
        <RoundedBox args={[0.56, 0.96, 0.46]} radius={0.04} smoothness={3}>
          <meshStandardMaterial
            ref={qwenMatRef}
            color="#1E2736"
            emissive={UI_ACCENT}
            emissiveIntensity={0.12}
            roughness={0.36}
            metalness={0.46}
          />
        </RoundedBox>
        {[-0.22, 0, 0.22].map((y) => (
          <group key={y} position={[0, y, 0.236]}>
            <mesh>
              <boxGeometry args={[0.46, 0.05, 0.018]} />
              <meshBasicMaterial
                color={mode === "qwen7b" ? UI_ACCENT : "#475569"}
                transparent
                opacity={mode === "qwen7b" ? 0.88 : 0.4}
              />
            </mesh>
            <mesh position={[0.2, 0.05, 0]}>
              <sphereGeometry args={[0.032, 10, 10]} />
              <meshBasicMaterial
                color={mode === "qwen7b" ? STATE_WARN : "#334155"}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Right rotating crystal prism: dbt Marts (46/46) warehouse contracts */}
      <group ref={prismRef} position={[1.12, 0.02, 0]}>
        <mesh scale={[0.88, 1.32, 0.88]}>
          <octahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial
            ref={prismMatRef}
            color="#1C2836"
            emissive={prismColor}
            emissiveIntensity={0.42}
            roughness={0.22}
            metalness={0.6}
          />
        </mesh>
        <mesh scale={[0.44, 0.72, 0.44]}>
          <octahedronGeometry args={[0.38, 0]} />
          <meshBasicMaterial color={prismColor} toneMapped={false} transparent opacity={0.75} />
        </mesh>
        <mesh rotation={[Math.PI / 2.35, 0.2, 0]}>
          <torusGeometry args={[0.54, 0.02, 8, 6]} />
          <meshBasicMaterial color={prismColor} transparent opacity={0.58} />
        </mesh>
      </group>

      {/* Guide tubes for each route */}
      {(["tfidf", "qwen7b", "cache_bug"] as const).map((routeKey) => {
        const isActive = mode === routeKey;
        const tubeColor =
          routeKey === "tfidf"
            ? STATE_HEALTHY
            : routeKey === "qwen7b"
              ? UI_ACCENT
              : STATE_WARN;
        return (
          <mesh key={routeKey}>
            <tubeGeometry args={[curves[routeKey], 48, isActive ? 0.022 : 0.012, 8, false]} />
            <meshBasicMaterial
              color={tubeColor}
              transparent
              opacity={isActive ? 0.48 : 0.08}
            />
          </mesh>
        );
      })}

      {/* Continuous OTLP telemetry & prediction packet stream */}
      <instancedMesh ref={packetStreamRef} args={[undefined, undefined, STREAM_COUNT]}>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshBasicMaterial color={streamColor} toneMapped={false} />
      </instancedMesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.072, 16, 16]} />
        <meshBasicMaterial
          color={mode === "cache_bug" ? STATE_WARN : streamColor}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Lexicon 3D interactive mini-lab: semantic context rings (L0 -> L3) + octagonal sqlglot AST
 * firewall shielding the Postgres lexicon_ro disc stack from SQLi probes (0/90 bypasses).
 */
function LexiconSqlSculpture({
  mode,
  draggingRef,
}: {
  mode: "l0" | "l2" | "l3" | "sqli";
  draggingRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const contextRingRefs = useRef<Array<THREE.Mesh | null>>([]);
  const shieldGroupRef = useRef<THREE.Group>(null);
  const shieldMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const shieldDiscMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pgDiscMatsRef = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const packetStreamRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const packetPt = useMemo(() => new THREE.Vector3(), []);
  const packetTan = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const elapsedRef = useRef(0);
  const rose = CATEGORY_HUES["Agents & RAG"].hex;
  const { frameloop, gl, invalidate } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    return () => {
      dom.style.cursor = "auto";
    };
  }, [gl]);

  useEffect(() => {
    invalidate();
  }, [mode, invalidate]);

  const curves = useMemo(
    () => ({
      clean: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.14, 0.02, 0),
        new THREE.Vector3(-0.52, 0.07, 0.05),
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0.56, -0.02, -0.05),
        new THREE.Vector3(1.14, 0.02, 0),
      ]),
      deflectTop: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.14, 0.06, 0.08),
        new THREE.Vector3(-0.56, 0.04, 0.04),
        new THREE.Vector3(-0.08, 0.03, 0.02),
        new THREE.Vector3(-0.46, 0.72, 0.46),
        new THREE.Vector3(-0.9, 0.98, 0.68),
      ]),
      deflectBottom: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.14, -0.04, -0.08),
        new THREE.Vector3(-0.56, 0.01, -0.04),
        new THREE.Vector3(-0.08, -0.01, -0.02),
        new THREE.Vector3(-0.48, -0.68, -0.44),
        new THREE.Vector3(-0.92, -0.94, -0.66),
      ]),
    }),
    []
  );

  const STREAM_COUNT = 9;
  const litRingCount = mode === "l0" ? 1 : mode === "l2" ? 3 : mode === "l3" ? 4 : 3;

  useFrame((_, delta) => {
    const isStatic = frameloop === "demand";
    const dt = Math.min(delta, 0.05);
    if (!isStatic) {
      elapsedRef.current += dt;
      if (groupRef.current && !draggingRef.current) {
        groupRef.current.rotation.y += dt * 0.18;
      }
      contextRingRefs.current.forEach((ring, idx) => {
        if (!ring) return;
        const active = idx < litRingCount;
        const speed = active ? (idx % 2 === 0 ? 0.36 : -0.36) : 0.06;
        ring.rotation.z += dt * speed;
      });
    }

    const isSqli = mode === "sqli";
    const activeCount = isSqli ? 8 : mode === "l0" ? 3 : mode === "l2" ? 6 : 9;
    const speed = isSqli ? 0.76 : mode === "l0" ? 0.38 : mode === "l2" ? 0.6 : 0.92;
    const leadT = isStatic ? 0.35 : (elapsedRef.current * speed) % 1;

    if (packetStreamRef.current) {
      for (let i = 0; i < STREAM_COUNT; i++) {
        if (i >= activeCount) {
          dummy.position.set(0, -10, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          packetStreamRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
        const t = (leadT + (i + 1) / (activeCount + 1)) % 1;
        const curve = isSqli
          ? i % 2 === 0
            ? curves.deflectTop
            : curves.deflectBottom
          : curves.clean;
        curve.getPointAt(t, packetPt);
        curve.getTangentAt(t, packetTan);
        dummy.position.copy(packetPt);
        lookTarget.copy(packetPt).add(packetTan);
        dummy.lookAt(lookTarget);
        const taper = 0.45 + 0.55 * Math.sin(t * Math.PI);
        const width = isSqli ? 0.95 : mode === "l3" ? 0.95 : 0.75;
        dummy.scale.set(taper * width, taper * width, taper * (isSqli ? 1.15 : 1.55));
        dummy.updateMatrix();
        packetStreamRef.current.setMatrixAt(i, dummy.matrix);
      }
      packetStreamRef.current.instanceMatrix.needsUpdate = true;
    }

    if (shieldGroupRef.current && !isStatic) {
      if (isSqli) {
        shieldGroupRef.current.rotation.z = Math.sin(elapsedRef.current * 14) * 0.045;
      } else {
        shieldGroupRef.current.rotation.z = THREE.MathUtils.damp(
          shieldGroupRef.current.rotation.z,
          0,
          8,
          dt
        );
      }
    }

    const sqliFlash = isSqli && !isStatic ? 0.5 + 0.5 * Math.sin(elapsedRef.current * 10) : 0;
    if (shieldMatRef.current) {
      shieldMatRef.current.emissiveIntensity = isSqli ? 0.65 + sqliFlash * 0.75 : 0.48;
    }
    if (shieldDiscMatRef.current) {
      shieldDiscMatRef.current.opacity = isSqli ? 0.24 + sqliFlash * 0.24 : 0.14;
    }

    pgDiscMatsRef.current.forEach((mat, idx) => {
      if (!mat) return;
      if (isSqli) {
        mat.emissiveIntensity = 0.08;
      } else {
        const base = mode === "l3" ? 0.42 : mode === "l2" ? 0.26 : 0.14;
        const ripple = isStatic ? 0 : Math.max(0, Math.sin(elapsedRef.current * 4 - idx * 0.8)) * 0.18;
        mat.emissiveIntensity = base + ripple;
      }
    });
  });

  const isSqli = mode === "sqli";
  const streamColor = isSqli
    ? STATE_FAULT
    : mode === "l0"
      ? rose
      : mode === "l2"
        ? UI_ACCENT
        : STATE_HEALTHY;
  const shieldColor = isSqli ? STATE_FAULT : STATE_HEALTHY;
  const contextRings = [-0.42, -0.14, 0.14, 0.42];

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 1.25, 0.9]} intensity={1.15} distance={4.0} color={streamColor} />

      {/* Left stacked octagonal Semantic Context Rings (L0 -> L3) */}
      <group position={[-1.14, 0, 0]}>
        {contextRings.map((y, idx) => {
          const isLit = idx < litRingCount;
          const ringColor = idx % 2 === 0 ? rose : UI_ACCENT;
          return (
            <mesh
              key={y}
              ref={(el) => {
                contextRingRefs.current[idx] = el;
              }}
              position={[0, y, 0]}
              rotation={[Math.PI / 2, 0, Math.PI / 8]}
            >
              <torusGeometry args={[0.36 - idx * 0.02, 0.044, 8, 8]} />
              <meshStandardMaterial
                color={isLit ? ringColor : "#1E2736"}
                emissive={isLit ? ringColor : "#0D1117"}
                emissiveIntensity={isLit ? (mode === "l3" ? 0.82 : 0.55) : 0.05}
                roughness={0.28}
                metalness={0.45}
                toneMapped={!isLit}
              />
            </mesh>
          );
        })}
      </group>

      {/* Center octagonal sqlglot AST security shield */}
      <group ref={shieldGroupRef} position={[0, 0.02, 0]}>
        <mesh rotation={[0, Math.PI / 2, Math.PI / 8]}>
          <torusGeometry args={[0.56, 0.055, 8, 8]} />
          <meshStandardMaterial
            ref={shieldMatRef}
            color={shieldColor}
            emissive={shieldColor}
            emissiveIntensity={isSqli ? 0.95 : 0.48}
            roughness={0.24}
            metalness={0.5}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, Math.PI / 8]}>
          <circleGeometry args={[0.5, 8]} />
          <meshBasicMaterial
            ref={shieldDiscMatRef}
            color={shieldColor}
            transparent
            opacity={isSqli ? 0.34 : 0.14}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Right 3-disc cylinder stack: Postgres marts.* (lexicon_ro RO) */}
      <group position={[1.14, -0.02, 0]}>
        {[-0.3, 0, 0.3].map((y, idx) => (
          <group key={y} position={[0, y, 0]}>
            <mesh>
              <cylinderGeometry args={[0.42, 0.42, 0.16, 24]} />
              <meshStandardMaterial
                ref={(el) => {
                  pgDiscMatsRef.current[idx] = el;
                }}
                color="#1E2736"
                emissive={isSqli ? STATE_HEALTHY : UI_ACCENT}
                emissiveIntensity={isSqli ? 0.08 : 0.28}
                roughness={0.34}
                metalness={0.42}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.43, 0.016, 8, 24]} />
              <meshBasicMaterial
                color={isSqli ? STATE_HEALTHY : mode === "l3" ? STATE_HEALTHY : UI_ACCENT}
                transparent
                opacity={isSqli ? 0.48 : 0.72}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Beam / Deflection guide tubes */}
      {isSqli ? (
        <>
          <mesh>
            <tubeGeometry args={[curves.deflectTop, 36, 0.018, 8, false]} />
            <meshBasicMaterial color={STATE_FAULT} transparent opacity={0.35} />
          </mesh>
          <mesh>
            <tubeGeometry args={[curves.deflectBottom, 36, 0.018, 8, false]} />
            <meshBasicMaterial color={STATE_FAULT} transparent opacity={0.35} />
          </mesh>
        </>
      ) : (
        <mesh>
          <tubeGeometry args={[curves.clean, 48, 0.022, 8, false]} />
          <meshBasicMaterial color={streamColor} transparent opacity={0.42} />
        </mesh>
      )}

      {/* Animated SQL query / injection probe stream */}
      <instancedMesh ref={packetStreamRef} args={[undefined, undefined, STREAM_COUNT]}>
        <sphereGeometry args={[0.044, 10, 10]} />
        <meshBasicMaterial color={streamColor} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/**
 * Cinch 3D interactive mini-lab: toggle between semantic cache hit (0W GPU bypass),
 * AWQ Marlin quantization, or circuit breaker fast-fail directly inside the plate.
 */
function CinchGpuSculpture({
  mode,
  draggingRef,
}: {
  mode: "cache" | "marlin" | "breaker";
  draggingRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const packetStreamRef = useRef<THREE.InstancedMesh>(null);
  const slabMatsRef = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const packetPt = useMemo(() => new THREE.Vector3(), []);
  const packetTan = useMemo(() => new THREE.Vector3(), []);
  const elapsedRef = useRef(0);
  const hue = CATEGORY_HUES["Inference & Serving"].hex;
  const { frameloop, gl, invalidate } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    return () => {
      dom.style.cursor = "auto";
    };
  }, [gl]);

  useEffect(() => {
    invalidate();
  }, [mode, invalidate]);

  const bypassCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, 0.25, 0.35),
      new THREE.Vector3(-0.35, 1.05, 0.45),
      new THREE.Vector3(0.65, 0.78, -0.15),
      new THREE.Vector3(1.35, 0.15, -0.3),
    ]);
  }, []);

  const STREAM_COUNT = 5;

  useFrame((_, delta) => {
    const isStatic = frameloop === "demand";
    const dt = Math.min(delta, 0.05);
    if (!isStatic) {
      elapsedRef.current += dt;
      if (groupRef.current && !draggingRef.current) {
        groupRef.current.rotation.y += dt * 0.22;
      }
    }
    const speed = mode === "cache" ? 0.62 : mode === "marlin" ? 0.42 : 0.85;
    const leadT = isStatic ? 0.42 : (elapsedRef.current * speed) % 1;

    if (pulseRef.current) {
      bypassCurve.getPointAt(leadT, pulseRef.current.position);
      const scale = isStatic ? 1 : 0.95 + Math.sin(elapsedRef.current * 8) * 0.14;
      pulseRef.current.scale.setScalar(scale);
    }

    if (packetStreamRef.current) {
      for (let i = 0; i < STREAM_COUNT; i++) {
        const t = (leadT + (i + 1) / (STREAM_COUNT + 1)) % 1;
        bypassCurve.getPointAt(t, packetPt);
        bypassCurve.getTangentAt(t, packetTan);
        dummy.position.copy(packetPt);
        dummy.lookAt(packetPt.clone().add(packetTan));
        const taper = 0.45 + 0.55 * Math.sin(t * Math.PI);
        dummy.scale.set(taper * 0.8, taper * 0.8, taper * 1.45);
        dummy.updateMatrix();
        packetStreamRef.current.setMatrixAt(i, dummy.matrix);
      }
      packetStreamRef.current.instanceMatrix.needsUpdate = true;
    }

    // Pulse top cache-bypass slab when stream crosses apex (~t=0.35)
    const apexProx = Math.max(0, 1 - Math.abs(leadT - 0.35) * 4.5);
    slabMatsRef.current.forEach((mat, idx) => {
      if (!mat) return;
      const base = mode === "marlin" ? 0.34 : 0.1;
      const boost = idx === 2 ? apexProx * 0.48 : idx === 3 && mode === "breaker" ? apexProx * 0.32 : 0;
      mat.emissiveIntensity = isStatic ? base : base + boost;
    });
  });

  const pulseColor =
    mode === "cache" ? STATE_HEALTHY : mode === "breaker" ? STATE_FAULT : hue;

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 1.35, 0.9]} intensity={1.15} distance={3.8} color={pulseColor} />

      {[-0.48, -0.16, 0.16, 0.48].map((y, idx) => (
        <group key={y} position={[0, y, 0]}>
          <RoundedBox args={[1.38, 0.12, 0.92]} radius={0.03} smoothness={3}>
            <meshStandardMaterial
              ref={(el) => {
                slabMatsRef.current[idx] = el;
              }}
              color={idx === 2 ? "#283447" : "#1E2736"}
              emissive={idx === 2 ? pulseColor : hue}
              emissiveIntensity={mode === "marlin" ? 0.34 : 0.1}
              roughness={0.34}
              metalness={0.38}
            />
          </RoundedBox>
          <mesh position={[0, 0.062, 0.458]}>
            <boxGeometry args={[1.28, 0.016, 0.012]} />
            <meshBasicMaterial color={idx === 2 ? pulseColor : hue} transparent opacity={idx === 2 ? 0.65 : 0.25} />
          </mesh>
          <mesh position={[0.66, 0, 0.42]}>
            <sphereGeometry args={[0.045, 14, 14]} />
            <meshBasicMaterial
              color={mode === "breaker" && idx === 0 ? STATE_FAULT : pulseColor}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      <mesh>
        <tubeGeometry args={[bypassCurve, 48, 0.025, 10, false]} />
        <meshBasicMaterial color={pulseColor} transparent opacity={0.44} />
      </mesh>

      <instancedMesh ref={packetStreamRef} args={[undefined, undefined, STREAM_COUNT]}>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshBasicMaterial color={pulseColor} toneMapped={false} />
      </instancedMesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.075, 16, 16]} />
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
  draggingRef,
  onSelectNode,
}: {
  hitlApproved: boolean;
  activeNodeIdx: number;
  draggingRef: React.MutableRefObject<boolean>;
  onSelectNode: (idx: number, label: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<Array<THREE.Mesh | null>>([]);
  const rose = CATEGORY_HUES["Agents & RAG"].hex;
  const { frameloop, gl, invalidate } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    return () => {
      dom.style.cursor = "auto";
    };
  }, [gl]);

  useEffect(() => {
    invalidate();
  }, [hitlApproved, activeNodeIdx, invalidate]);

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
    const isStatic = frameloop === "demand";
    const dt = Math.min(delta, 0.05);
    if (!isStatic && groupRef.current && !draggingRef.current) {
      groupRef.current.rotation.y += dt * 0.18;
    }
    nodes.forEach((_, idx) => {
      const mesh = nodeRefs.current[idx];
      if (!mesh) return;
      const target = idx === activeNodeIdx ? 1.28 : 0.95;
      const next = isStatic ? target : THREE.MathUtils.damp(mesh.scale.x, target, 8, dt);
      mesh.scale.setScalar(next);
    });
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
              ref={(el) => {
                nodeRefs.current[idx] = el;
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(idx, node.id);
              }}
              onPointerOver={() => {
                gl.domElement.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                gl.domElement.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[0.16, 20, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected || isHitl ? 1.05 : 0.35}
                roughness={0.28}
                metalness={0.45}
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
function AresGateSculpture({
  threshold,
  draggingRef,
}: {
  threshold: number;
  draggingRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const lime = CATEGORY_HUES["MLOps & Security"].hex;
  const { frameloop, gl, invalidate } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    return () => {
      dom.style.cursor = "auto";
    };
  }, [gl]);

  const slices = useMemo(
    () => [
      { id: "F1", val: 0.94, x: -0.9 },
      { id: "Acc", val: 0.91, x: -0.3 },
      { id: "Slice-A", val: 0.78, x: 0.3 },
      { id: "Drift", val: 0.88, x: 0.9 },
    ],
    []
  );

  const targetPlaneY = -0.55 + threshold * 1.1;

  useEffect(() => {
    invalidate();
  }, [threshold, invalidate]);

  useFrame((_, delta) => {
    const isStatic = frameloop === "demand";
    const dt = Math.min(delta, 0.05);
    if (!isStatic && groupRef.current && !draggingRef.current) {
      groupRef.current.rotation.y += dt * 0.2;
    }
    if (planeRef.current) {
      planeRef.current.position.y = isStatic
        ? targetPlaneY
        : THREE.MathUtils.damp(planeRef.current.position.y, targetPlaneY, 10, dt);
    }
  });

  return (
    <group ref={groupRef}>
      {slices.map((s) => {
        const passed = s.val >= threshold;
        const height = s.val * 1.15;
        const col = passed ? lime : STATE_FAULT;
        return (
          <RoundedBox
            key={s.id}
            args={[0.3, height, 0.3]}
            radius={0.04}
            smoothness={3}
            position={[s.x, -0.55 + height * 0.5, 0]}
          >
            <meshStandardMaterial
              color={col}
              emissive={col}
              emissiveIntensity={passed ? 0.35 : 0.9}
              roughness={0.36}
              metalness={0.3}
              toneMapped={passed}
            />
          </RoundedBox>
        );
      })}

      {/* Live Threshold Promotion Plane */}
      <mesh ref={planeRef} position={[0, targetPlaneY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 0.95]} />
        <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const SLUG_HUE_MAP: Record<string, string> = {
  cinch: CATEGORY_HUES["Inference & Serving"].hex,
  tally: CATEGORY_HUES["MLOps & Security"].hex,
  lexicon: CATEGORY_HUES["Agents & RAG"].hex,
  "nexus-researcher": CATEGORY_HUES["Agents & RAG"].hex,
  ares: CATEGORY_HUES["MLOps & Security"].hex,
  mindstack: CATEGORY_HUES["Agents & RAG"].hex,
  offboarder: CATEGORY_HUES["MLOps & Security"].hex,
  "masheba-ai": CATEGORY_HUES["Mobile & Systems"].hex,
};

function TopologySlotFallback({ slug }: { slug: string }) {
  const accent = SLUG_HUE_MAP[slug] ?? CATEGORY_HUES["MLOps & Security"].hex;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0D1117] px-4"
      style={{
        backgroundImage:
          "radial-gradient(rgba(240, 246, 252, 0.07) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <svg viewBox="0 0 280 96" className="w-full max-w-[260px]" aria-hidden="true">
        <path
          d="M 28 52 Q 86 18 140 48 T 252 44"
          fill="none"
          stroke={accent}
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        {[28, 96, 178, 252].map((cx, i) => (
          <g key={cx} transform={`translate(${cx}, ${i % 2 === 0 ? 50 : 44})`}>
            <circle r="10" fill="#161B22" stroke={accent} strokeWidth="1.5" />
            <circle r="3.5" fill={accent} />
          </g>
        ))}
      </svg>
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#8B949E]">
        2D Topology · Scroll into view for live 3D
      </span>
    </div>
  );
}

const TOPOLOGY_CAM_POS: [number, number, number] = [0, 0.85, 3.65];

/**
 * Interactive 3D mini-labs mounted inside flagship Selected Work cards.
 */
export function ProjectTopology3D({ slug, className = "" }: ProjectTopology3DProps) {
  const { canRender3D } = useCanRender3D();
  const [cinchMode, setCinchMode] = useState<"cache" | "marlin" | "breaker">("cache");
  const [tallyMode, setTallyMode] = useState<"tfidf" | "qwen7b" | "cache_bug">("tfidf");
  const [lexiconMode, setLexiconMode] = useState<"l0" | "l2" | "l3" | "sqli">("l3");
  const [hitlApproved, setHitlApproved] = useState(true);
  const [nexusNode, setNexusNode] = useState<{ idx: number; label: string }>({
    idx: 2,
    label: "HITL",
  });
  const [aresThreshold, setAresThreshold] = useState(0.82);
  const [wheelEngaged, setWheelEngaged] = useState(false);
  const [stageReady, setStageReady] = useState(false);
  const [zoomSignal, setZoomSignal] = useState<ZoomSignal>({ action: "reset", seq: 0 });
  const draggingRef = useRef(false);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  const triggerZoom = useCallback((action: ZoomAction) => {
    setZoomSignal((prev) => ({ action, seq: prev.seq + 1 }));
  }, []);

  return (
    <div
      data-lenis-prevent-wheel={wheelEngaged ? "true" : undefined}
      onPointerDown={(e) => {
        if (e.button === 0 && canRender3D) setWheelEngaged(true);
      }}
      onPointerLeave={() => setWheelEngaged(false)}
      className={`relative h-[252px] w-full overflow-hidden rounded-b-[calc(1.5rem-0.375rem)] sm:h-[260px] ${className}`}
    >
      {canRender3D && stageReady && (
        <CanvasZoomHUD
          onZoomIn={() => triggerZoom("in")}
          onZoomOut={() => triggerZoom("out")}
          onReset={() => triggerZoom("reset")}
        />
      )}

      <ViewportCanvas
        onCanvasReadyChange={setStageReady}
        cameraPosition={TOPOLOGY_CAM_POS}
        fov={38}
        fallback={<TopologySlotFallback slug={slug} />}
        className="h-full w-full"
      >
        <ambientLight intensity={0.5} />
        <hemisphereLight args={["#9CC9FF", "#0D1117", 0.75]} />
        <directionalLight position={[3, 4, 4]} intensity={1.2} color="#E6EDF3" />
        <pointLight position={[-2.5, -1.5, 2.5]} intensity={1.35} decay={0} color={UI_ACCENT} />

        {slug === "cinch" && <CinchGpuSculpture mode={cinchMode} draggingRef={draggingRef} />}
        {slug === "tally" && <TallyCostSculpture mode={tallyMode} draggingRef={draggingRef} />}
        {slug === "lexicon" && (
          <LexiconSqlSculpture mode={lexiconMode} draggingRef={draggingRef} />
        )}
        {slug === "nexus-researcher" && (
          <NexusDagSculpture
            hitlApproved={hitlApproved}
            activeNodeIdx={nexusNode.idx}
            draggingRef={draggingRef}
            onSelectNode={(idx, label) => setNexusNode({ idx, label })}
          />
        )}
        {slug === "ares" && (
          <AresGateSculpture threshold={aresThreshold} draggingRef={draggingRef} />
        )}

        <CameraZoomController
          controlsRef={controlsRef}
          defaultPosition={TOPOLOGY_CAM_POS}
          minDistance={2.0}
          maxDistance={7.0}
          zoomSignal={zoomSignal}
        />

        <OrbitControls
          ref={controlsRef}
          enableZoom={wheelEngaged}
          zoomSpeed={0.8}
          minDistance={2.0}
          maxDistance={7.0}
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
          touches={{ ONE: undefined, TWO: undefined }}
        />
      </ViewportCanvas>

      {/* Bottom Mini-Lab Control Bar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(240,246,252,0.12)] bg-[#161B22]/95 px-2.5 py-1.5 sm:left-3 sm:right-3 sm:px-3">
        {slug === "cinch" && (
          <>
            <span className="hidden font-mono text-xs text-[#9DA7B3] sm:inline">Route Probe:</span>
            <div className="flex w-full items-center gap-1.5 sm:w-auto">
              {(["cache", "marlin", "breaker"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCinchMode(m)}
                  className={`min-h-[44px] flex-1 whitespace-nowrap rounded-md px-2 py-2 font-mono text-xs uppercase transition-colors sm:flex-initial sm:px-2.5 ${
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

        {slug === "tally" && (
          <>
            <span className="hidden font-mono text-xs text-[#9DA7B3] xl:inline">Cost Probe:</span>
            <div className="flex w-full items-center gap-1.5 xl:w-auto">
              {(
                [
                  { id: "tfidf", label: "TF-IDF 99.8%" },
                  { id: "qwen7b", label: "Qwen-7B 90.5%" },
                  { id: "cache_bug", label: "Cache Bug 3.7%" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTallyMode(item.id)}
                  aria-pressed={tallyMode === item.id}
                  className={`min-h-[44px] flex-1 whitespace-nowrap rounded-md px-1.5 py-2 font-mono text-[11px] uppercase transition-colors sm:px-2.5 sm:text-xs xl:flex-initial ${
                    tallyMode === item.id
                      ? item.id === "cache_bug"
                        ? "bg-[#EF4444] font-semibold text-[#0D1117]"
                        : "bg-[#38BDF8] font-semibold text-[#0D1117]"
                      : "bg-[#0D1117] text-[#9DA7B3] hover:text-[#E6EDF3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}

        {slug === "lexicon" && (
          <>
            <span className="hidden font-mono text-xs text-[#9DA7B3] xl:inline">Context Lift:</span>
            <div className="flex w-full items-center gap-1 sm:gap-1.5 xl:w-auto">
              {(
                [
                  { id: "l0", label: "L0 15%" },
                  { id: "l2", label: "L2 34%" },
                  { id: "l3", label: "L3 +36.2" },
                  { id: "sqli", label: "SQLi 0/90" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLexiconMode(item.id)}
                  aria-pressed={lexiconMode === item.id}
                  className={`min-h-[44px] flex-1 whitespace-nowrap rounded-md px-1 py-2 font-mono text-[11px] uppercase transition-colors sm:px-2.5 sm:text-xs xl:flex-initial ${
                    lexiconMode === item.id
                      ? item.id === "sqli"
                        ? "bg-[#EF4444] font-semibold text-[#0D1117]"
                        : "bg-[#38BDF8] font-semibold text-[#0D1117]"
                      : "bg-[#0D1117] text-[#9DA7B3] hover:text-[#E6EDF3]"
                  }`}
                >
                  {item.label}
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
              className={`min-h-[44px] rounded-md px-3 py-2 font-mono text-xs uppercase transition-colors ${
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
              className="h-11 w-28 cursor-pointer accent-[#A8CE6C]"
            />
          </label>
        )}
      </div>
    </div>
  );
}
