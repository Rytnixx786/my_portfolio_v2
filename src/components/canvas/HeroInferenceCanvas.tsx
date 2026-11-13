"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DeviceTier } from "@/lib/device-tier";
import { useWebGLContext } from "./WebGLContextProvider";

interface HeroInferenceCanvasProps {
  activeSystemIndex?: number;
}

interface FieldMeshProps {
  tier: Exclude<DeviceTier, "low">;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  activeSystemIndex: number;
}

const VERTEX_SHADER = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uSystemPhase;
  attribute float aScale;
  attribute float aSeed;
  varying float vEnergy;

  void main() {
    vec3 pos = position;
    float waveA = sin(pos.x * 0.72 + uTime * 0.85 + uSystemPhase) * 0.36;
    float waveB = cos(pos.y * 0.85 + uTime * 0.65 - uSystemPhase * 0.6) * 0.28;

    float distToPointer = distance(pos.xy * 0.14, uPointer);
    float attract = exp(-distToPointer * 2.2) * 0.92;

    pos.z += waveA + waveB + attract;
    pos.x += (uPointer.x * 0.48) * aSeed * 0.28;
    pos.y += (uPointer.y * 0.36) * aSeed * 0.22;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = max(1.6, aScale * (27.0 / -mvPosition.z) * (1.0 + attract * 0.7));

    vEnergy = clamp(0.28 + attract * 0.72 + (waveA + 0.36) * 0.45, 0.15, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  varying float vEnergy;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;

    float soft = smoothstep(0.5, 0.08, d);
    vec3 col = mix(uBaseColor, uAccentColor, smoothstep(0.32, 0.95, vEnergy));
    float alpha = soft * mix(0.26, 0.88, vEnergy);
    gl_FragColor = vec4(col, alpha);
  }
`;

function InferenceField({
  tier,
  pointerRef,
  activeSystemIndex,
}: FieldMeshProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const wireRef = useRef<THREE.LineSegments>(null);
  const smoothPointer = useRef(new THREE.Vector2(0, 0));
  const targetPhaseRef = useRef(0);

  useEffect(() => {
    targetPhaseRef.current = activeSystemIndex * 1.35;
  }, [activeSystemIndex]);

  const { geometry, lineGeometry, shaderMaterial } = useMemo(() => {
    const cols = tier === "high" ? 40 : 24;
    const rows = tier === "high" ? 24 : 14;
    const count = cols * rows;

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);

    const spreadX = 14.8;
    const spreadY = 8.6;

    let ptr = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const u = cols > 1 ? c / (cols - 1) - 0.5 : 0;
        const v = rows > 1 ? r / (rows - 1) - 0.5 : 0;
        const jitterX = Math.sin(idx * 12.9898) * 0.09;
        const jitterY = Math.cos(idx * 78.233) * 0.09;

        positions[ptr++] = u * spreadX + jitterX;
        positions[ptr++] = v * spreadY + jitterY;
        positions[ptr++] = ((idx % 5) - 2) * 0.06;

        scales[idx] = 0.85 + ((idx % 7) / 7) * 0.75;
        seeds[idx] = 0.4 + ((idx % 11) / 11) * 0.8;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const lineVerts: number[] = [];
    for (let r = 0; r < rows - 1; r += 2) {
      for (let c = 0; c < cols - 1; c += 2) {
        const i = (r * cols + c) * 3;
        const right = (r * cols + (c + 2 < cols ? c + 2 : c + 1)) * 3;
        const down = ((r + 2 < rows ? r + 2 : r + 1) * cols + c) * 3;

        lineVerts.push(
          positions[i],
          positions[i + 1],
          positions[i + 2],
          positions[right],
          positions[right + 1],
          positions[right + 2]
        );
        lineVerts.push(
          positions[i],
          positions[i + 1],
          positions[i + 2],
          positions[down],
          positions[down + 1],
          positions[down + 2]
        );
      }
    }

    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineVerts, 3));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uSystemPhase: { value: 0 },
        uBaseColor: { value: new THREE.Color("#263445") },
        uAccentColor: { value: new THREE.Color("#38BDF8") },
      },
    });

    return { geometry: geo, lineGeometry: lGeo, shaderMaterial: mat };
  }, [tier]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      lineGeometry.dispose();
      shaderMaterial.dispose();
    };
  }, [geometry, lineGeometry, shaderMaterial]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    smoothPointer.current.x +=
      (pointerRef.current.x - smoothPointer.current.x) * Math.min(1, dt * 6);
    smoothPointer.current.y +=
      (pointerRef.current.y - smoothPointer.current.y) * Math.min(1, dt * 6);

    shaderMaterial.uniforms.uPointer.value.copy(smoothPointer.current);
    shaderMaterial.uniforms.uSystemPhase.value +=
      (targetPhaseRef.current - shaderMaterial.uniforms.uSystemPhase.value) *
      Math.min(1, dt * 4);

    if (pointsRef.current && wireRef.current) {
      const targetRotY = smoothPointer.current.x * 0.09;
      const targetRotX = -smoothPointer.current.y * 0.07;
      pointsRef.current.rotation.y +=
        (targetRotY - pointsRef.current.rotation.y) * Math.min(1, dt * 4);
      pointsRef.current.rotation.x +=
        (targetRotX - pointsRef.current.rotation.x) * Math.min(1, dt * 4);
      wireRef.current.rotation.copy(pointsRef.current.rotation);
    }
  });

  return (
    <group position={[0.9, 0.15, -0.8]}>
      <lineSegments ref={wireRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.075}
          depthWrite={false}
        />
      </lineSegments>
      <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />
    </group>
  );
}

export function HeroInferenceCanvas({
  activeSystemIndex = 0,
}: HeroInferenceCanvasProps) {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = wrapperRef.current;
    if (el && typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setInView(entry.isIntersecting);
          }
        },
        { rootMargin: "120px 0px" }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      pointerRef.current = { x: nx, y: ny };
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  const showWebGL = hasMounted && webglSupported && effectiveTier !== "low";

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 55% at 72% 32%, rgba(56, 189, 248, 0.095) 0%, rgba(22, 27, 34, 0.35) 52%, rgba(13, 17, 23, 0) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(rgba(139, 148, 158, 0.22) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {showWebGL && (
        <Canvas
          frameloop={inView ? "always" : "never"}
          dpr={effectiveTier === "high" ? [1, 1.75] : [1, 1.25]}
          camera={{ position: [0, 0, 7.6], fov: 44 }}
          gl={{
            antialias: effectiveTier === "high",
            alpha: true,
            powerPreference: "high-performance",
          }}
          className="h-full w-full"
        >
          <InferenceField
            tier={effectiveTier}
            pointerRef={pointerRef}
            activeSystemIndex={activeSystemIndex}
          />
        </Canvas>
      )}

      <div
        className="absolute inset-x-0 bottom-0 h-28"
        style={{
          background:
            "linear-gradient(to top, #0D1117 0%, rgba(13, 17, 23, 0) 100%)",
        }}
      />
    </div>
  );
}
