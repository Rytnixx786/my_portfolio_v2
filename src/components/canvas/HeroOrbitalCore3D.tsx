"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
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

const ORBIT_RADIUS = 2.18;
const INNER_ORBIT_RADIUS = 1.82;

interface HeroOrbitalCore3DProps {
  activeSystemIndex: number;
  onSelectSystem: (index: number) => void;
}

/**
 * Interactive particle lattice embedded behind the Orbital Core inside the same View,
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
  const activeColorRef = useRef(new THREE.Color(activeHue));
  const targetColorRef = useRef(new THREE.Color(activeHue));
  const elapsedRef = useRef(0);
  const smoothPtrRef = useRef(new THREE.Vector2(0, 0));
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
        positions[i * 3 + 2] = -2.25;
        scales[i] = (c + r) % 3 === 0 ? 2.0 : 1.3;
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
    targetColorRef.current.set(activeHue);
  }, [activeHue]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    if (!matRef.current) return;

    activeColorRef.current.lerp(targetColorRef.current, Math.min(1, dt * 6));
    smoothPtrRef.current.x = THREE.MathUtils.damp(
      smoothPtrRef.current.x,
      pointer.x * 3.5,
      7,
      dt
    );
    smoothPtrRef.current.y = THREE.MathUtils.damp(
      smoothPtrRef.current.y,
      pointer.y * 2.4,
      7,
      dt
    );

    matRef.current.uniforms.uTime.value = elapsedRef.current;
    matRef.current.uniforms.uAccentColor.value.copy(activeColorRef.current);
    matRef.current.uniforms.uPointer.value.copy(smoothPtrRef.current);
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
            float attract = exp(-dPtr * 0.65) * 0.44;

            float rippleEnergy = 0.0;
            for (int i = 0; i < 4; i++) {
              float age = uTime - uRipples[i].z;
              if (age > 0.0 && age < 2.2) {
                float dR = abs(distance(pos.xy, uRipples[i].xy) - age * 3.4);
                rippleEnergy += exp(-dR * 2.6) * (1.0 - age / 2.2) * 0.85;
              }
            }

            pos.z += sin(pos.x * 0.9 + uTime * 0.85) * 0.12 + attract + rippleEnergy * 0.4;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = max(1.5, aScale * (17.0 / max(1.0, -mv.z)) * (1.0 + attract + rippleEnergy));
            vEnergy = clamp(0.2 + attract * 0.75 + rippleEnergy, 0.15, 1.0);
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
            gl_FragColor = vec4(col, soft * mix(0.22, 0.76, vEnergy));
          }
        `}
      />
    </points>
  );
}

/**
 * Machined obsidian portrait enclosure with SDF-rounded cutout and chamfered accent lip.
 * Zero rectangular overhang planes.
 */
function PortraitDepthSlab({ accentHue }: { accentHue: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [imgAspect, setImgAspect] = useState(1);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const trimMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const imgAspectRef = useRef(1);
  const currentAccentRef = useRef(new THREE.Color(accentHue));
  const targetAccentRef = useRef(new THREE.Color(accentHue));
  const elapsedRef = useRef(0);
  const { invalidate } = useThree();

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
        invalidate();
      },
      undefined,
      () => {
        // Fallback color slate
      }
    );

    return () => {
      active = false;
    };
  }, [invalidate]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  useEffect(() => {
    textureRef.current = texture;
    imgAspectRef.current = imgAspect;
    if (shaderRef.current) {
      shaderRef.current.uniforms.uMap.value = texture;
      shaderRef.current.uniforms.uHasMap.value = texture ? 1.0 : 0.0;
      shaderRef.current.uniforms.uImgAspect.value = imgAspect;
    }
    invalidate();
  }, [texture, imgAspect, invalidate]);

  useEffect(() => {
    targetAccentRef.current.set(accentHue);
  }, [accentHue]);

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uHasMap: { value: 0.0 },
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(HERO_ORBIT_HUES[0]) },
      uPlaneAspect: { value: 1.94 / 2.22 },
      uImgAspect: { value: 1.0 },
    }),
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    currentAccentRef.current.lerp(targetAccentRef.current, Math.min(1, dt * 6));

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsedRef.current;
      shaderRef.current.uniforms.uMap.value = textureRef.current;
      shaderRef.current.uniforms.uHasMap.value = textureRef.current ? 1.0 : 0.0;
      shaderRef.current.uniforms.uImgAspect.value = imgAspectRef.current;
      shaderRef.current.uniforms.uAccent.value.copy(currentAccentRef.current);
    }
    if (trimMatRef.current) {
      trimMatRef.current.emissive.copy(currentAccentRef.current);
      trimMatRef.current.color.copy(currentAccentRef.current);
    }
  });

  return (
    <group>
      {/* Outer Machined Obsidian Chassis */}
      <RoundedBox args={[2.14, 2.42, 0.13]} radius={0.14} smoothness={8}>
        <meshStandardMaterial color="#161E29" roughness={0.34} metalness={0.58} />
      </RoundedBox>

      {/* Recessed Accent Chamfer Lip */}
      <RoundedBox args={[2.01, 2.29, 0.14]} radius={0.12} smoothness={6}>
        <meshStandardMaterial
          ref={trimMatRef}
          color={accentHue}
          emissive={accentHue}
          emissiveIntensity={0.28}
          roughness={0.35}
          metalness={0.45}
        />
      </RoundedBox>

      {/* Inner Dark Well */}
      <RoundedBox args={[1.97, 2.25, 0.145]} radius={0.11} smoothness={6}>
        <meshStandardMaterial color="#0D1117" roughness={0.55} metalness={0.25} />
      </RoundedBox>

      {/* Front Portrait Shader with SDF Rounded Cutout */}
      <mesh position={[0, 0, 0.076]}>
        <planeGeometry args={[1.92, 2.2]} />
        <shaderMaterial
          ref={shaderRef}
          uniforms={uniforms}
          transparent
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

            float sdRoundedBox(vec2 p, vec2 b, float r) {
              vec2 q = abs(p) - b + r;
              return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
            }

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
              vec2 p = (vUv - 0.5) * vec2(1.92, 2.2);
              float d = sdRoundedBox(p, vec2(0.95, 1.09), 0.105);
              float mask = 1.0 - smoothstep(-0.008, 0.008, d);
              if (mask < 0.01) discard;

              vec3 col = vec3(0.086, 0.106, 0.133);
              if (uHasMap > 0.5) {
                vec2 uvCover = coverUv(vUv, uPlaneAspect, uImgAspect);
                vec4 texel = texture2D(uMap, uvCover);
                col = texel.rgb;
                float rim = smoothstep(-0.065, 0.0, d);
                col = mix(col, mix(col, uAccent, 0.35), rim * 0.4);
              }
              gl_FragColor = vec4(col, mask);
            }
          `}
        />
      </mesh>

      {/* Rear Telemetry Plate */}
      <RoundedBox args={[1.92, 2.2, 0.02]} radius={0.1} smoothness={4} position={[0, 0, -0.068]}>
        <meshStandardMaterial
          color="#10151C"
          roughness={0.42}
          metalness={0.45}
          emissive={accentHue}
          emissiveIntensity={0.08}
        />
      </RoundedBox>
    </group>
  );
}

function HeroOrbitalScene({
  activeSystemIndex,
  onSelectSystem,
  onHoverSystem,
}: HeroOrbitalCore3DProps & { onHoverSystem: (index: number | null) => void }) {
  const coreRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<Array<THREE.Group | null>>([]);
  const gimbalsRef = useRef<Array<THREE.Mesh | null>>([]);
  const ripplesRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const activeIdxRef = useRef(activeSystemIndex);
  const prevIdxRef = useRef(activeSystemIndex);
  const hoveredIdxRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const elapsedRef = useRef(0);
  const currentRingColorRef = useRef(new THREE.Color(HERO_ORBIT_HUES[0]));
  const targetRingColorRef = useRef(new THREE.Color(HERO_ORBIT_HUES[0]));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { pointer } = useThree();

  useEffect(() => {
    activeIdxRef.current = activeSystemIndex;
    const sys = ORBITAL_SYSTEMS[activeSystemIndex] ?? ORBITAL_SYSTEMS[0];
    targetRingColorRef.current.set(sys.hue);
  }, [activeSystemIndex]);

  useEffect(() => {
    hoveredIdxRef.current = hoveredIdx;
  }, [hoveredIdx]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const activeSystem = ORBITAL_SYSTEMS[activeSystemIndex] ?? ORBITAL_SYSTEMS[0];

  const handleStageClick = () => {
    if (draggingRef.current) return;
    ripplesRef.current = [
      { x: pointer.x * 3.5, y: pointer.y * 2.4, t: elapsedRef.current },
      ...ripplesRef.current.slice(0, 3),
    ];
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const t = elapsedRef.current;

    if (prevIdxRef.current !== activeIdxRef.current) {
      prevIdxRef.current = activeIdxRef.current;
      const targetNode = nodesRef.current[activeIdxRef.current];
      const rx = targetNode ? targetNode.position.x : 0;
      const ry = targetNode ? targetNode.position.y : 0;
      ripplesRef.current = [{ x: rx, y: ry, t }, ...ripplesRef.current.slice(0, 3)];
    }

    currentRingColorRef.current.lerp(targetRingColorRef.current, Math.min(1, dt * 6));
    if (ringMatRef.current) {
      ringMatRef.current.color.copy(currentRingColorRef.current);
    }

    if (coreRef.current) {
      const targetRotY = draggingRef.current
        ? 0
        : state.pointer.x * 0.16 + Math.sin(t * 0.45) * 0.06;
      const targetRotX = draggingRef.current ? 0 : -state.pointer.y * 0.09;
      const targetPosY = Math.sin(t * 1.15) * 0.06;

      coreRef.current.rotation.y = THREE.MathUtils.damp(
        coreRef.current.rotation.y,
        targetRotY,
        4.5,
        dt
      );
      coreRef.current.rotation.x = THREE.MathUtils.damp(
        coreRef.current.rotation.x,
        targetRotX,
        4.5,
        dt
      );
      coreRef.current.position.y = THREE.MathUtils.damp(
        coreRef.current.position.y,
        targetPosY,
        4,
        dt
      );
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 0.18;
    }

    ORBITAL_SYSTEMS.forEach((_, idx) => {
      const node = nodesRef.current[idx];
      if (!node) return;
      const angle = t * 0.34 + (idx * Math.PI) / 2;
      node.position.set(
        Math.cos(angle) * ORBIT_RADIUS,
        0,
        Math.sin(angle) * ORBIT_RADIUS
      );

      const isActive = idx === activeIdxRef.current;
      const isHovered = idx === hoveredIdxRef.current;
      const targetScale = isActive ? 1.24 : isHovered ? 1.12 : 0.92;
      const nextScale = THREE.MathUtils.damp(node.scale.x, targetScale, 8, dt);
      node.scale.setScalar(nextScale);

      const gimbal = gimbalsRef.current[idx];
      if (gimbal) {
        gimbal.rotation.x = t * 0.9 + idx;
        gimbal.rotation.y = t * 0.65 + idx * 0.7;
      }
    });
  });

  return (
    <group onClick={handleStageClick}>
      <ambientLight intensity={0.58} />
      <hemisphereLight args={["#9CC9FF", "#0D1117", 0.82]} />
      <directionalLight position={[4, 5, 5]} intensity={1.35} color="#E6EDF3" />
      <pointLight position={[-3.2, -1.8, 3.2]} intensity={1.55} decay={0} color={activeSystem.hue} />
      <pointLight position={[3.2, 2.2, -2.5]} intensity={1.1} decay={0} color={STATE_HEALTHY} />

      <RipplingInferenceLattice activeHue={activeSystem.hue} ripplesRef={ripplesRef} />

      <group ref={coreRef}>
        <PortraitDepthSlab accentHue={activeSystem.hue} />

        {/* Synchronized Inclined Orbital Plane (dips below face in front, rises behind head in back) */}
        <group rotation={[0.42, 0.14, -0.15]}>
          {/* Primary Track Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ORBIT_RADIUS, 0.009, 16, 160]} />
            <meshBasicMaterial
              ref={ringMatRef}
              color={activeSystem.hue}
              transparent
              opacity={0.56}
            />
          </mesh>

          {/* Secondary Inner Reference Ring */}
          <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[INNER_ORBIT_RADIUS, 0.005, 12, 128]} />
            <meshBasicMaterial color={UI_ACCENT} transparent opacity={0.22} />
          </mesh>

          {/* Track-Locked Gimbaled Satellite Beacons */}
          {ORBITAL_SYSTEMS.map((sys, idx) => {
            const isActive = idx === activeSystemIndex;
            const isHovered = idx === hoveredIdx;

            return (
              <group
                key={sys.id}
                ref={(el) => {
                  nodesRef.current[idx] = el;
                }}
              >
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
                  <sphereGeometry args={[0.078, 24, 24]} />
                  <meshStandardMaterial
                    color={isActive ? sys.hue : "#232E3F"}
                    emissive={sys.hue}
                    emissiveIntensity={isActive ? 1.55 : isHovered ? 0.95 : 0.42}
                    roughness={0.22}
                    metalness={0.4}
                    toneMapped={!isActive}
                  />
                </mesh>

                <mesh
                  ref={(el) => {
                    gimbalsRef.current[idx] = el;
                  }}
                >
                  <torusGeometry args={[0.138, 0.011, 16, 48]} />
                  <meshBasicMaterial
                    color={sys.hue}
                    transparent
                    opacity={isActive ? 0.92 : isHovered ? 0.72 : 0.45}
                  />
                </mesh>

                {isActive && (
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.19, 0.006, 12, 48]} />
                    <meshBasicMaterial color={sys.hue} transparent opacity={0.6} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        rotateSpeed={0.55}
        minPolarAngle={Math.PI * 0.35}
        maxPolarAngle={Math.PI * 0.65}
        minAzimuthAngle={-Math.PI * 0.32}
        maxAzimuthAngle={Math.PI * 0.32}
        onStart={() => {
          draggingRef.current = true;
        }}
        onEnd={() => {
          window.setTimeout(() => {
            draggingRef.current = false;
          }, 40);
        }}
        touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </group>
  );
}

/**
 * Interactive Zero-GPU 2D Telemetry Orbital Stage shown in 2D SAFE mode or without WebGL.
 */
function HeroOrbital2DFallback({
  activeSystemIndex,
  onSelectSystem,
}: HeroOrbitalCore3DProps) {
  const active = ORBITAL_SYSTEMS[activeSystemIndex] ?? ORBITAL_SYSTEMS[0];
  const nodePositions = [
    { left: "12%", top: "30%" },
    { left: "84%", top: "24%" },
    { left: "84%", top: "74%" },
    { left: "14%", top: "74%" },
  ] as const;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#0D1117]">
      {/* Subtle Architectural Coordinate Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(rgba(56, 189, 248, 0.16) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Ambient Single-Accent Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-64 w-64 rounded-full opacity-20 blur-3xl transition-colors duration-500"
        style={{ backgroundColor: active.hue }}
      />

      {/* Precision Inclined Orbital Rings SVG */}
      <svg
        viewBox="0 0 420 340"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <g transform="translate(210 170) rotate(-11)">
          <ellipse
            cx="0"
            cy="0"
            rx="172"
            ry="66"
            fill="none"
            stroke={active.hue}
            strokeOpacity="0.42"
            strokeWidth="1.4"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="142"
            ry="48"
            fill="none"
            stroke="#38BDF8"
            strokeOpacity="0.22"
            strokeDasharray="4 5"
            strokeWidth="1"
          />
        </g>
      </svg>

      {/* Machined Double-Bezel Portrait Frame */}
      <div
        className="relative z-10 rounded-[1.45rem] border bg-[#161B22] p-1.5 shadow-2xl transition-colors duration-300"
        style={{ borderColor: `${active.hue}66` }}
      >
        <div className="relative h-52 w-44 overflow-hidden rounded-[1.1rem] border border-[rgba(240,246,252,0.1)] bg-[#0D1117] sm:h-60 sm:w-52">
          <Image
            src={profile.heroPortrait}
            alt={`${profile.name} portrait`}
            width={224}
            height={256}
            priority
            className="h-full w-full object-cover object-top"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[1.1rem] ring-1 ring-inset ring-white/10"
          />
        </div>
      </div>

      {/* Interactive 2D Orbital System Beacons */}
      {ORBITAL_SYSTEMS.map((sys, idx) => {
        const isActive = idx === activeSystemIndex;
        const pos = nodePositions[idx];
        return (
          <button
            key={sys.id}
            type="button"
            onClick={() => onSelectSystem(idx)}
            aria-label={`Select ${sys.label} (${sys.metric})`}
            aria-pressed={isActive}
            style={{
              left: pos.left,
              top: pos.top,
              borderColor: isActive ? sys.hue : "rgba(240,246,252,0.14)",
              backgroundColor: isActive ? "rgba(22, 27, 34, 0.96)" : "rgba(13, 17, 23, 0.9)",
            }}
            className="absolute z-20 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] text-[#E6EDF3] backdrop-blur-md transition-all duration-200 hover:scale-105"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: sys.hue }}
              aria-hidden="true"
            />
            <span className="font-semibold">{sys.label}</span>
          </button>
        );
      })}

      {/* 2D Safe Indicator */}
      <span className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E]">
        2D Safe · Vector
      </span>
    </div>
  );
}

export function HeroOrbitalCore3D({
  activeSystemIndex,
  onSelectSystem,
}: HeroOrbitalCore3DProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const displaySys =
    ORBITAL_SYSTEMS[hoveredIdx ?? activeSystemIndex] ?? ORBITAL_SYSTEMS[0];

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl sm:h-[380px] lg:h-[420px]">
      <div className="pointer-events-none absolute left-3 top-3 z-30 inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#0D1117]/90 px-3 py-1 font-mono text-xs text-[#E6EDF3] backdrop-blur-md">
        <span style={{ color: displaySys.hue }}>{displaySys.code}</span>
        <span className="font-semibold">{displaySys.label}</span>
        <span className="text-[#9DA7B3]">· {displaySys.metric}</span>
      </div>

      <ViewportCanvas
        eager
        cameraPosition={[0, 0.2, 5.55]}
        fov={40}
        fallback={
          <HeroOrbital2DFallback
            activeSystemIndex={activeSystemIndex}
            onSelectSystem={onSelectSystem}
          />
        }
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
