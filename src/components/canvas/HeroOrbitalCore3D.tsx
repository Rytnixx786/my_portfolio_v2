"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { profile } from "@/data/site";
import { ViewportCanvas } from "./ViewportCanvas";

const ORBITAL_SYSTEMS = [
  { id: "cinch", code: "01", label: "Cinch", metric: "331 tok/s" },
  { id: "nexus", code: "02", label: "Nexus", metric: "91% Refusal" },
  { id: "ares", code: "03", label: "ARES", metric: "92%+ CI" },
  { id: "mindstack", code: "04", label: "MindStack", metric: "95% Ground" },
] as const;

interface HeroOrbitalCore3DProps {
  activeSystemIndex: number;
  onSelectSystem: (index: number) => void;
}

function PortraitDepthSlab() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      profile.heroPortrait,
      (loaded) => {
        if (!active) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.minFilter = THREE.LinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        setTexture(loaded);
      },
      undefined,
      () => {
        // Fallback solid shader state if offline/blocked
      }
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uMap: { value: texture },
        uHasMap: { value: texture ? 1.0 : 0.0 },
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color("#38BDF8") },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform float uTime;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec3 col = vec3(0.086, 0.106, 0.133);
          if (uHasMap > 0.5) {
            vec2 centered = vUv - 0.5;
            vec4 texel = texture2D(uMap, vUv);
            col = texel.rgb;
            float scan = sin(vUv.y * 190.0 - uTime * 2.2) * 0.014;
            col += scan * uAccent * 0.45;
            float edge = smoothstep(0.32, 0.52, max(abs(centered.x), abs(centered.y)));
            col = mix(col, uAccent * 0.55 + col * 0.5, edge * 0.35);
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
    [texture]
  );

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.uMap.value = texture;
      shaderRef.current.uniforms.uHasMap.value = texture ? 1.0 : 0.0;
    }
  });

  return (
    <group>
      {/* Machined Dark Slate Bezel Frame */}
      <RoundedBox args={[2.12, 2.48, 0.12]} radius={0.14} smoothness={4}>
        <meshStandardMaterial color="#161B22" roughness={0.35} metalness={0.65} />
      </RoundedBox>

      {/* Outer Cyan Rim Accent Hairline */}
      <RoundedBox args={[2.17, 2.53, 0.07]} radius={0.15} smoothness={4} position={[0, 0, -0.02]}>
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.35} wireframe />
      </RoundedBox>

      {/* Front Depth-Lit Portrait Plane */}
      <mesh position={[0, 0, 0.068]}>
        <planeGeometry args={[1.9, 2.24]} />
        <shaderMaterial ref={shaderRef} args={[shaderArgs]} />
      </mesh>
    </group>
  );
}

function OrbitalRingSystem({
  activeSystemIndex,
  onSelectSystem,
}: HeroOrbitalCore3DProps) {
  const ringGroupRef = useRef<THREE.Group>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (ringGroupRef.current && hoveredIdx === null) {
      ringGroupRef.current.rotation.y += dt * 0.22;
    }
  });

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <group rotation={[0.24, -0.18, 0.08]}>
      {/* Tilted Inner Ring crossing in front of & behind portrait */}
      <mesh rotation={[Math.PI * 0.44, 0.2, 0]}>
        <torusGeometry args={[1.92, 0.014, 16, 110]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.55} />
      </mesh>

      {/* Outer Counter-Tilted Slate Ring */}
      <mesh rotation={[-Math.PI * 0.36, -0.28, 0.14]}>
        <torusGeometry args={[2.22, 0.01, 16, 110]} />
        <meshBasicMaterial color="#8B949E" transparent opacity={0.35} />
      </mesh>

      {/* Orbiting Interactive System Nodes */}
      <group ref={ringGroupRef}>
        {ORBITAL_SYSTEMS.map((sys, idx) => {
          const angle = (idx / ORBITAL_SYSTEMS.length) * Math.PI * 2;
          const radius = 2.08;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = Math.sin(angle * 2) * 0.58;

          const isActive = idx === activeSystemIndex;
          const isHovered = idx === hoveredIdx;

          return (
            <group key={sys.id} position={[x, y, z]}>
              <mesh
                scale={isActive ? 1.32 : isHovered ? 1.22 : 0.95}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSystem(idx);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredIdx(idx);
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  setHoveredIdx(null);
                  document.body.style.cursor = "auto";
                }}
              >
                <octahedronGeometry args={[0.14, 0]} />
                <meshStandardMaterial
                  color={isActive ? "#38BDF8" : isHovered ? "#7DD3FC" : "#1C222B"}
                  emissive={isActive ? "#38BDF8" : "#10B981"}
                  emissiveIntensity={isActive ? 0.95 : isHovered ? 0.5 : 0.15}
                  roughness={0.25}
                  metalness={0.75}
                />
              </mesh>

              {(isActive || isHovered) && (
                <Html
                  position={[0, 0.28, 0]}
                  center
                  distanceFactor={6.5}
                  zIndexRange={[10, 0]}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSystem(idx)}
                    className="whitespace-nowrap rounded-full border border-[#38BDF8]/60 bg-[#0D1117]/95 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E6EDF3] shadow-lg"
                  >
                    <span className="text-[#38BDF8]">{sys.code}</span> {sys.label} · {sys.metric}
                  </button>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Interactive Hero centerpiece combining a shader-lit /img/newdp.jpg slab with
 * orbiting raycasted system satellites in Three.js, plus a zero-GPU 2D fallback.
 */
export function HeroOrbitalCore3D({
  activeSystemIndex,
  onSelectSystem,
}: HeroOrbitalCore3DProps) {
  const staticFallback = (
    <div className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-end sm:p-5 md:flex-col md:items-start lg:flex-row lg:items-end">
      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between self-stretch py-1">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#38BDF8]">
            Systems Architect
          </span>
          <p className="mt-1.5 font-display text-3xl font-bold uppercase leading-[0.92] text-[#E6EDF3]">
            {profile.first}
            <br />
            {profile.last}
          </p>
        </div>

        <div className="mt-4 space-y-1 border-t border-[rgba(240,246,252,0.08)] pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8B949E]">
          <p className="truncate text-[#E6EDF3]">
            {profile.location} · {profile.utc}
          </p>
          <p className="truncate text-[#6E7681]">vLLM · LangGraph · RAG · CI</p>
        </div>
      </div>

      <div className="relative mx-auto shrink-0 pr-2.5 pt-2.5 sm:mx-0 md:mx-auto lg:mx-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-1 h-40 w-40 rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/10 sm:h-44 sm:w-44"
        />
        <div className="relative z-10 rounded-[1.35rem] border border-[rgba(240,246,252,0.12)] bg-[#0D1117] p-1.5">
          <div className="overflow-hidden rounded-[calc(1.35rem-0.375rem)] bg-[#161B22]">
            <img
              src={profile.heroPortrait}
              alt="Mehedi Hasan, AI and Backend Systems Engineer"
              width={420}
              height={420}
              fetchPriority="high"
              decoding="sync"
              className="h-48 w-44 object-cover object-top contrast-[1.06] saturate-[0.88] sm:h-52 sm:w-48"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="double-bezel-outer">
      <div className="double-bezel-core overflow-hidden">
        <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] bg-[#161B22]/95 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#8B949E]">
          <span className="font-semibold text-[#E6EDF3]">
            {profile.first} {profile.last} · Core
          </span>
          <span className="text-[#38BDF8]">Drag to orbit · Click nodes</span>
        </div>

        <ViewportCanvas
          className="h-[250px] w-full sm:h-[272px]"
          cameraPosition={[0, 0.15, 5.1]}
          fov={40}
          fallback={staticFallback}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[3, 4, 5]} intensity={1.15} color="#E6EDF3" />
          <pointLight position={[-3, 1.5, 3]} intensity={1.8} color="#38BDF8" />

          <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.18}>
            <PortraitDepthSlab />
          </Float>

          <OrbitalRingSystem
            activeSystemIndex={activeSystemIndex}
            onSelectSystem={onSelectSystem}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            minPolarAngle={Math.PI * 0.34}
            maxPolarAngle={Math.PI * 0.64}
            minAzimuthAngle={-Math.PI * 0.38}
            maxAzimuthAngle={Math.PI * 0.38}
          />
        </ViewportCanvas>
      </div>
    </div>
  );
}

