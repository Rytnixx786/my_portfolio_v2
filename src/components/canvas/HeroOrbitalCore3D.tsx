"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { profile } from "@/data/site";
import { HERO_ORBIT_HUES, STATE_HEALTHY, UI_ACCENT } from "@/lib/palette";
import { ViewportCanvas } from "./ViewportCanvas";

const ORBITAL_SYSTEMS = [
  { id: "cinch", code: "01", label: "Cinch", metric: "331 tok/s", hue: HERO_ORBIT_HUES[0] },
  { id: "nexus", code: "02", label: "Nexus", metric: "91% Refusal", hue: HERO_ORBIT_HUES[1] },
  { id: "ares", code: "03", label: "ARES", metric: "92%+ CI", hue: HERO_ORBIT_HUES[2] },
  { id: "mindstack", code: "04", label: "MindStack", metric: "95% Ground", hue: HERO_ORBIT_HUES[3] },
] as const;

interface HeroOrbitalCore3DProps {
  activeSystemIndex: number;
  onSelectSystem: (index: number) => void;
}

/**
 * Interactive particle lattice embedded behind the Orbital Core inside the same single View,
 * responding smoothly to pointer proximity and click shockwaves (uRipples[4]).
 */
function RipplingInferenceLattice({
  activeHue,
  ripplesRef,
}: {
  activeHue: string;
  ripplesRef: React.MutableRefObject<Array<{ x: number; y: number; t: number }>>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const activeHueRef = useRef(activeHue);
  const { pointer } = useThree();

  const { geometry, uniforms } = useMemo(() => {
    const cols = 16;
    const rows = 10;
    const count = cols * rows;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    let i = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const u = c / (cols - 1) - 0.5;
        const v = r / (rows - 1) - 0.5;
        positions[i * 3] = u * 8.4;
        positions[i * 3 + 1] = v * 5.6;
        positions[i * 3 + 2] = -2.2;
        scales[i] = ((c + r) % 3 === 0 ? 2.1 : 1.35);
        i++;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

    const uni = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uBaseColor: { value: new THREE.Color("#223042") },
      uAccentColor: { value: new THREE.Color(HERO_ORBIT_HUES[0]) },
      uRipples: {
        value: [
          new THREE.Vector3(0, 0, -99),
          new THREE.Vector3(0, 0, -99),
          new THREE.Vector3(0, 0, -99),
          new THREE.Vector3(0, 0, -99),
        ],
      },
    };

    return { geometry: geom, uniforms: uni };
  }, []);

  useEffect(() => {
    activeHueRef.current = activeHue;
  }, [activeHue]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    matRef.current.uniforms.uTime.value = t;
    matRef.current.uniforms.uAccentColor.value.set(activeHueRef.current);
    matRef.current.uniforms.uPointer.value.set(pointer.x * 3.5, pointer.y * 2.4);
    const arr = ripplesRef.current;
    for (let i = 0; i < 4; i++) {
      const r = arr[i];
      if (r) {
        matRef.current.uniforms.uRipples.value[i].set(r.x, r.y, r.t);
      }
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          uniform float uTime;
          uniform vec2 uPointer;
          uniform vec3 uRipples[4];
          attribute float aScale;
          varying float vEnergy;

          void main() {
            vec3 pos = position;
            float dPtr = distance(pos.xy, uPointer);
            float attract = exp(-dPtr * 0.65) * 0.48;

            float rippleEnergy = 0.0;
            for (int i = 0; i < 4; i++) {
              float age = uTime - uRipples[i].z;
              if (age > 0.0 && age < 2.2) {
                float dR = abs(distance(pos.xy, uRipples[i].xy) - age * 3.4);
                rippleEnergy += exp(-dR * 2.6) * (1.0 - age / 2.2) * 0.9;
              }
            }

            pos.z += sin(pos.x * 0.9 + uTime * 0.9) * 0.14 + attract + rippleEnergy * 0.45;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = max(1.5, aScale * (18.0 / max(1.0, -mv.z)) * (1.0 + attract + rippleEnergy));
            vEnergy = clamp(0.2 + attract * 0.8 + rippleEnergy, 0.15, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uBaseColor;
          uniform vec3 uAccentColor;
          varying float vEnergy;

          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if (d > 0.5) discard;
            float soft = smoothstep(0.5, 0.08, d);
            vec3 col = mix(uBaseColor, uAccentColor, smoothstep(0.25, 0.95, vEnergy));
            gl_FragColor = vec4(col, soft * mix(0.24, 0.82, vEnergy));
          }
        `}
      />
    </points>
  );
}

/**
 * Portrait holographic slab with aspect-preserving object-cover UV math so the
 * square/portrait photograph never stretches across container geometries.
 */
function PortraitDepthSlab({ accentHue }: { accentHue: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [imgAspect, setImgAspect] = useState(1);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const imgAspectRef = useRef(1);
  const accentHueRef = useRef(accentHue);

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
        const img = loaded.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          setImgAspect(img.width / img.height);
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.minFilter = THREE.LinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        setTexture(loaded);
      },
      undefined,
      () => {
        // Fallback color slate
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

  useEffect(() => {
    textureRef.current = texture;
    imgAspectRef.current = imgAspect;
  }, [texture, imgAspect]);

  useEffect(() => {
    accentHueRef.current = accentHue;
  }, [accentHue]);

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uHasMap: { value: 0.0 },
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(HERO_ORBIT_HUES[0]) },
      uPlaneAspect: { value: 1.98 / 2.26 },
      uImgAspect: { value: 1.0 },
    }),
    []
  );

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.uMap.value = textureRef.current;
      shaderRef.current.uniforms.uHasMap.value = textureRef.current ? 1.0 : 0.0;
      shaderRef.current.uniforms.uImgAspect.value = imgAspectRef.current;
      shaderRef.current.uniforms.uAccent.value.set(accentHueRef.current);
    }
  });

  return (
    <group>
      <RoundedBox args={[2.14, 2.42, 0.16]} radius={0.14} smoothness={4}>
        <meshStandardMaterial color="#151B24" roughness={0.28} metalness={0.82} />
      </RoundedBox>

      {/* Luminous Perimeter Trim (HDR > 1 for selective Bloom) */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.22, 2.5]} />
        <meshBasicMaterial color={accentHue} transparent opacity={0.14} />
      </mesh>

      <mesh position={[0, 0, 0.092]}>
        <planeGeometry args={[1.98, 2.26]} />
        <shaderMaterial
          ref={shaderRef}
          uniforms={uniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform sampler2D uMap;
            uniform float uHasMap;
            uniform float uTime;
            uniform vec3 uAccent;
            uniform float uPlaneAspect;
            uniform float uImgAspect;
            varying vec2 vUv;

            vec2 coverUv(vec2 uv, float planeAspect, float imgAspect) {
              vec2 s = vec2(1.0);
              if (imgAspect > planeAspect) {
                s.x = planeAspect / imgAspect;
              } else {
                s.y = imgAspect / planeAspect;
              }
              return (uv - 0.5) * s + 0.5;
            }

            void main() {
              vec3 col = vec3(0.086, 0.106, 0.133);
              if (uHasMap > 0.5) {
                vec2 uvCover = coverUv(vUv, uPlaneAspect, uImgAspect);
                vec4 texel = texture2D(uMap, uvCover);
                col = texel.rgb;
                float scan = sin(vUv.y * 160.0 - uTime * 2.0) * 0.012;
                col += scan * uAccent * 0.5;
                vec2 centered = vUv - 0.5;
                float edge = smoothstep(0.35, 0.52, max(abs(centered.x), abs(centered.y)));
                col = mix(col, mix(col, uAccent, 0.45), edge * 0.42);
              }
              gl_FragColor = vec4(col, 1.0);
            }
          `}
        />
      </mesh>

      {/* Rear Telemetry Plate */}
      <mesh position={[0, 0, -0.092]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.92, 2.2]} />
        <meshStandardMaterial
          color="#10151C"
          roughness={0.45}
          metalness={0.55}
          emissive={accentHue}
          emissiveIntensity={0.08}
        />
      </mesh>
    </group>
  );
}

function HeroOrbitalScene({
  activeSystemIndex,
  onSelectSystem,
  onHoverSystem,
}: HeroOrbitalCore3DProps & { onHoverSystem: (index: number | null) => void }) {
  const coreRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<Array<THREE.Group | null>>([]);
  const ripplesRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const activeIdxRef = useRef(activeSystemIndex);
  const prevIdxRef = useRef(activeSystemIndex);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { pointer, clock } = useThree();

  useEffect(() => {
    activeIdxRef.current = activeSystemIndex;
  }, [activeSystemIndex]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const activeSystem = ORBITAL_SYSTEMS[activeSystemIndex] ?? ORBITAL_SYSTEMS[0];

  const handleStageClick = () => {
    const t = clock.elapsedTime;
    ripplesRef.current = [
      { x: pointer.x * 3.5, y: pointer.y * 2.4, t },
      ...ripplesRef.current.slice(0, 3),
    ];
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (prevIdxRef.current !== activeIdxRef.current) {
      prevIdxRef.current = activeIdxRef.current;
      const targetNode = nodesRef.current[activeIdxRef.current];
      const rx = targetNode ? targetNode.position.x : 0;
      const ry = targetNode ? targetNode.position.y : 0;
      ripplesRef.current = [{ x: rx, y: ry, t }, ...ripplesRef.current.slice(0, 3)];
    }

    if (coreRef.current) {
      const targetRotY = state.pointer.x * 0.24 + Math.sin(t * 0.42) * 0.14;
      const targetRotX = -state.pointer.y * 0.14;
      coreRef.current.rotation.y += (targetRotY - coreRef.current.rotation.y) * Math.min(1, dt * 4);
      coreRef.current.rotation.x += (targetRotX - coreRef.current.rotation.x) * Math.min(1, dt * 4);
    }

    ORBITAL_SYSTEMS.forEach((_, idx) => {
      const node = nodesRef.current[idx];
      if (!node) return;
      const angle = t * 0.36 + (idx * Math.PI) / 2;
      const radiusX = 2.02;
      const radiusZ = 1.18;
      node.position.x = Math.cos(angle) * radiusX;
      node.position.z = Math.sin(angle) * radiusZ;
      node.position.y = Math.sin(angle * 2 + idx) * 0.38;
    });
  });

  return (
    <group onClick={handleStageClick}>
      <ambientLight intensity={0.68} />
      <directionalLight position={[4, 5, 5]} intensity={1.35} color="#E6EDF3" />
      <pointLight position={[-3.2, -1.8, 3.2]} intensity={1.15} color={activeSystem.hue} />
      <pointLight position={[3.2, 2.2, -2.5]} intensity={0.85} color={STATE_HEALTHY} />

      <RipplingInferenceLattice activeHue={activeSystem.hue} ripplesRef={ripplesRef} />

      <group ref={coreRef}>
        <Float speed={1.5} rotationIntensity={0.07} floatIntensity={0.22}>
          <PortraitDepthSlab accentHue={activeSystem.hue} />
        </Float>

        <mesh rotation={[Math.PI / 2 - 0.18, 0.12, 0]}>
          <torusGeometry args={[2.06, 0.015, 16, 110]} />
          <meshBasicMaterial color={activeSystem.hue} transparent opacity={0.48} />
        </mesh>

        <mesh rotation={[Math.PI / 2 + 0.24, -0.2, 0.25]}>
          <torusGeometry args={[1.66, 0.01, 14, 92]} />
          <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.22} />
        </mesh>

        {ORBITAL_SYSTEMS.map((sys, idx) => {
          const isActive = idx === activeSystemIndex;
          const isHovered = idx === hoveredIdx;
          const scale = isActive ? 1.24 : isHovered ? 1.14 : 0.94;

          const nodeMesh = (
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectSystem(idx);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredIdx(idx);
                onHoverSystem(idx);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredIdx(null);
                onHoverSystem(null);
                document.body.style.cursor = "auto";
              }}
            >
              <octahedronGeometry args={[0.17, 0]} />
              <meshStandardMaterial
                color={isActive ? sys.hue : "#1C222B"}
                emissive={sys.hue}
                emissiveIntensity={isActive ? 1.65 : isHovered ? 0.9 : 0.35}
                roughness={0.25}
                metalness={0.75}
                toneMapped={!isActive}
              />
            </mesh>
          );

          return (
            <group
              key={sys.id}
              ref={(el) => {
                nodesRef.current[idx] = el;
              }}
              scale={scale}
            >
              {nodeMesh}
              {isActive && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.24, 0.28, 32]} />
                  <meshBasicMaterial color={sys.hue} side={THREE.DoubleSide} transparent opacity={0.85} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minPolarAngle={Math.PI * 0.32}
        maxPolarAngle={Math.PI * 0.68}
      />
    </group>
  );
}

const LazyPortraitFallback = (
  <div className="flex h-full w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#161B22]">
    <Image
      src={profile.heroPortrait}
      alt={`${profile.name} portrait`}
      width={224}
      height={256}
      className="h-56 w-48 rounded-2xl object-cover shadow-2xl sm:h-64 sm:w-56"
    />
  </div>
);

export function HeroOrbitalCore3D({
  activeSystemIndex,
  onSelectSystem,
}: HeroOrbitalCore3DProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const displaySys =
    ORBITAL_SYSTEMS[hoveredIdx ?? activeSystemIndex] ?? ORBITAL_SYSTEMS[0];

  return (
    <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
      <div className="pointer-events-none absolute left-3 top-3 z-30 inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#0D1117]/90 px-3 py-1 font-mono text-xs text-[#E6EDF3] backdrop-blur-md">
        <span style={{ color: displaySys.hue }}>{displaySys.code}</span>
        <span className="font-semibold">{displaySys.label}</span>
        <span className="text-[#9DA7B3]">· {displaySys.metric}</span>
      </div>

      <ViewportCanvas
        eager
        cameraPosition={[0, 0.25, 5.25]}
        fov={40}
        fallback={LazyPortraitFallback}
        className="h-full w-full"
      >
        <HeroOrbitalScene
          activeSystemIndex={activeSystemIndex}
          onSelectSystem={onSelectSystem}
          onHoverSystem={setHoveredIdx}
        />
      </ViewportCanvas>
    </div>
  );
}
