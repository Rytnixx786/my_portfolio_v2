"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { profile } from "@/data/site";
import { useCanRender3D } from "@/hooks/usePortfolioUtils";
import { HERO_ORBIT_HUES, STATE_HEALTHY, UI_ACCENT } from "@/lib/palette";
import {
  CameraZoomController,
  CanvasZoomHUD,
  type ZoomAction,
  type ZoomSignal,
} from "./CanvasZoomHUD";
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
 * Sleek machined obsidian portrait enclosure with SDF-rounded cutout and
 * anti-aliased hairline accent bezel rendered directly in the fragment shader
 * (zero z-fighting or stacked box artifacts).
 */
function PortraitDepthSlab({ accentHue }: { accentHue: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [imgAspect, setImgAspect] = useState(1);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const imgAspectRef = useRef(1);
  const currentAccentRef = useRef(new THREE.Color(accentHue));
  const targetAccentRef = useRef(new THREE.Color(accentHue));
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
      uAccent: { value: new THREE.Color(HERO_ORBIT_HUES[0]) },
      uPlaneAspect: { value: 1.98 / 2.26 },
      uImgAspect: { value: 1.0 },
    }),
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    currentAccentRef.current.lerp(targetAccentRef.current, Math.min(1, dt * 6));

    if (shaderRef.current) {
      shaderRef.current.uniforms.uMap.value = textureRef.current;
      shaderRef.current.uniforms.uHasMap.value = textureRef.current ? 1.0 : 0.0;
      shaderRef.current.uniforms.uImgAspect.value = imgAspectRef.current;
      shaderRef.current.uniforms.uAccent.value.copy(currentAccentRef.current);
    }
    if (backMatRef.current) {
      backMatRef.current.emissive.copy(currentAccentRef.current);
    }
  });

  return (
    <group>
      {/* Slim Precision Obsidian Chassis (clean silhouette, zero bulky rim) */}
      <RoundedBox args={[2.04, 2.32, 0.08]} radius={0.12} smoothness={5}>
        <meshStandardMaterial
          ref={backMatRef}
          color="#0E131B"
          roughness={0.4}
          metalness={0.42}
          emissive={accentHue}
          emissiveIntensity={0.025}
        />
      </RoundedBox>

      {/* Front Portrait Shader with SDF Rounded Cutout + Crisp Hairline Rim */}
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[1.98, 2.26]} />
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
              vec2 p = (vUv - 0.5) * vec2(1.98, 2.26);
              float d = sdRoundedBox(p, vec2(0.97, 1.11), 0.115);
              float mask = 1.0 - smoothstep(-0.008, 0.008, d);
              if (mask < 0.01) discard;

              vec3 col = vec3(0.086, 0.106, 0.133);
              if (uHasMap > 0.5) {
                vec2 uvCover = coverUv(vUv, uPlaneAspect, uImgAspect);
                vec4 texel = texture2D(uMap, uvCover);
                col = texel.rgb;
              }

              // Subtle vignette + razor-clean SDF hairline border
              float borderBand = smoothstep(-0.024, -0.008, d) * (1.0 - smoothstep(-0.008, 0.006, d));
              float innerGlow = smoothstep(-0.085, 0.0, d) * 0.22;
              col = mix(col, mix(col, uAccent, 0.45), innerGlow);
              col = mix(col, mix(vec3(0.9, 0.94, 0.98), uAccent, 0.65), borderBand * 0.72);

              gl_FragColor = vec4(col, mask);
            }
          `}
        />
      </mesh>
    </group>
  );
}

const HERO_CAM_POS: [number, number, number] = [0, 0.2, 5.55];

function HeroOrbitalScene({
  activeSystemIndex,
  onSelectSystem,
  onHoverSystem,
  enableWheelZoom,
  zoomSignal,
}: HeroOrbitalCore3DProps & {
  onHoverSystem: (index: number | null) => void;
  enableWheelZoom: boolean;
  zoomSignal: ZoomSignal;
}) {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const tiltGroupRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<Array<THREE.Group | null>>([]);
  const gimbalsRef = useRef<Array<THREE.Mesh | null>>([]);
  const activeIdxRef = useRef(activeSystemIndex);
  const hoveredIdxRef = useRef<number | null>(null);
  const orbitSpeedRef = useRef(0.38);
  const orbitAngleRef = useRef(0);
  const elapsedRef = useRef(0);
  const currentRingColorRef = useRef(new THREE.Color(HERO_ORBIT_HUES[0]));
  const targetRingColorRef = useRef(new THREE.Color(HERO_ORBIT_HUES[0]));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const t = elapsedRef.current;

    // Smoothly damp angular velocity when hovering a node (no abrupt speed step)
    const targetSpeed = hoveredIdxRef.current !== null ? 0.1 : 0.38;
    orbitSpeedRef.current = THREE.MathUtils.damp(orbitSpeedRef.current, targetSpeed, 6, dt);
    orbitAngleRef.current += dt * orbitSpeedRef.current;

    currentRingColorRef.current.lerp(targetRingColorRef.current, Math.min(1, dt * 6));
    if (ringMatRef.current) {
      ringMatRef.current.color.copy(currentRingColorRef.current);
    }

    // Gentle vertical float without fighting OrbitControls rotation
    if (tiltGroupRef.current) {
      tiltGroupRef.current.position.y = Math.sin(t * 1.05) * 0.032;
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 0.22;
    }

    ORBITAL_SYSTEMS.forEach((_, idx) => {
      const node = nodesRef.current[idx];
      if (!node) return;
      const angle = orbitAngleRef.current + (idx * Math.PI) / 2;
      node.position.set(
        Math.cos(angle) * ORBIT_RADIUS,
        0,
        Math.sin(angle) * ORBIT_RADIUS
      );

      const isActive = idx === activeIdxRef.current;
      const isHovered = idx === hoveredIdxRef.current;
      const targetScale = isActive ? 1.24 : isHovered ? 1.14 : 0.94;
      const nextScale = THREE.MathUtils.damp(node.scale.x, targetScale, 8, dt);
      node.scale.setScalar(nextScale);

      const gimbal = gimbalsRef.current[idx];
      if (gimbal) {
        gimbal.rotation.x = t * 0.85 + idx;
        gimbal.rotation.y = t * 0.65 + idx * 0.7;
      }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#9CC9FF", "#0D1117", 0.85]} />
      <directionalLight position={[4, 5, 5]} intensity={1.3} color="#E6EDF3" />
      <pointLight position={[-3.2, -1.8, 3.2]} intensity={1.4} decay={0} color={activeSystem.hue} />
      <pointLight position={[3.2, 2.2, -2.5]} intensity={0.95} decay={0} color={STATE_HEALTHY} />

      <group ref={tiltGroupRef}>
        <PortraitDepthSlab accentHue={activeSystem.hue} />

        {/* Synchronized Inclined Orbital Plane (dips below face in front, rises behind head in back) */}
        <group rotation={[0.4, 0.12, -0.15]}>
          {/* Primary Track Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ORBIT_RADIUS, 0.0085, 16, 128]} />
            <meshBasicMaterial
              ref={ringMatRef}
              color={activeSystem.hue}
              transparent
              opacity={0.58}
            />
          </mesh>

          {/* Secondary Inner Reference Ring */}
          <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[INNER_ORBIT_RADIUS, 0.0045, 12, 96]} />
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
                  <sphereGeometry args={[0.08, 20, 20]} />
                  <meshStandardMaterial
                    color={isActive ? sys.hue : "#232E3F"}
                    emissive={sys.hue}
                    emissiveIntensity={isActive ? 1.45 : isHovered ? 0.95 : 0.48}
                    roughness={0.24}
                    metalness={0.38}
                    toneMapped={!isActive}
                  />
                </mesh>

                <mesh
                  ref={(el) => {
                    gimbalsRef.current[idx] = el;
                  }}
                >
                  <torusGeometry args={[0.142, 0.01, 14, 40]} />
                  <meshBasicMaterial
                    color={sys.hue}
                    transparent
                    opacity={isActive ? 0.92 : isHovered ? 0.72 : 0.45}
                  />
                </mesh>

                {isActive && (
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.195, 0.006, 10, 40]} />
                    <meshBasicMaterial color={sys.hue} transparent opacity={0.6} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>
      </group>

      <CameraZoomController
        controlsRef={controlsRef}
        defaultPosition={HERO_CAM_POS}
        minDistance={3.2}
        maxDistance={9.2}
        zoomSignal={zoomSignal}
      />

      <OrbitControls
        ref={controlsRef}
        enableZoom={enableWheelZoom}
        zoomSpeed={0.8}
        minDistance={3.2}
        maxDistance={9.2}
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        rotateSpeed={0.58}
        minPolarAngle={Math.PI * 0.36}
        maxPolarAngle={Math.PI * 0.64}
        minAzimuthAngle={-Math.PI * 0.32}
        maxAzimuthAngle={Math.PI * 0.32}
        touches={{ ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </group>
  );
}

/**
 * Living Zero-WebGL 2D Orbital Stage shown in 2D SAFE mode or without WebGL.
 * Features split back/front 2.5D orbital arcs, smooth rAF depth-sorted orbital beacons,
 * proportional portrait scaling across mobile & desktop, and subtle pointer tilt.
 */
function HeroOrbital2DFallback({
  activeSystemIndex,
  onSelectSystem,
}: HeroOrbitalCore3DProps) {
  const active = ORBITAL_SYSTEMS[activeSystemIndex] ?? ORBITAL_SYSTEMS[0];
  const stageRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const beaconRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hoveredRef = useRef(false);
  const speedRef = useRef(0.36);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const finePointer =
      window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;

    const tiltDeg = (-10 * Math.PI) / 180;
    const cosTilt = Math.cos(tiltDeg);
    const sinTilt = Math.sin(tiltDeg);

    let theta = 0.42;
    let lastTs = performance.now();
    let rafId: number | null = null;
    let inView = true;

    const positionBeacons = (baseAngle: number) => {
      const rect = stage.getBoundingClientRect();
      const w = rect.width || 440;
      const h = rect.height || 360;
      const svgScale = Math.min(w / 440, h / 360);
      const cxOffset = 0;
      const cyOffset = 18 * svgScale;
      const rx = 186 * svgScale;
      const ry = 76 * svgScale;

      for (let idx = 0; idx < ORBITAL_SYSTEMS.length; idx++) {
        const btn = beaconRefs.current[idx];
        if (!btn) continue;

        const a = baseAngle + (idx * Math.PI) / 2;
        const ex = Math.cos(a) * rx;
        const ey = Math.sin(a) * ry;

        const x = cxOffset + (ex * cosTilt - ey * sinTilt);
        const y = cyOffset + (ex * sinTilt + ey * cosTilt);

        // Depth factor: sin(a) >= 0 passes in front of portrait, < 0 passes behind portrait
        const depth = Math.sin(a);
        const isFront = depth >= -0.05;
        const scale = 0.84 + (depth + 1) * 0.12;
        const opacity = isFront ? 1 : 0.62;

        btn.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) scale(${scale.toFixed(3)})`;
        btn.style.zIndex = isFront ? "25" : "5";
        btn.style.opacity = opacity.toFixed(2);
      }
    };

    positionBeacons(theta);

    const tick = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      if (inView) {
        const targetSpeed = hoveredRef.current ? 0.08 : 0.36;
        speedRef.current += (targetSpeed - speedRef.current) * Math.min(1, dt * 6);
        theta += dt * speedRef.current;
        positionBeacons(theta);
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                inView = entry.isIntersecting;
                if (inView && rafId === null) {
                  lastTs = performance.now();
                  rafId = window.requestAnimationFrame(tick);
                }
              }
            },
            { threshold: 0 }
          )
        : null;

    observer?.observe(stage);
    rafId = window.requestAnimationFrame(tick);

    const onPointerMove = (e: PointerEvent) => {
      if (!finePointer || e.pointerType === "touch" || !portraitRef.current) return;
      const rect = stage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      portraitRef.current.style.transform = `perspective(900px) rotateY(${(nx * 5).toFixed(2)}deg) rotateX(${(-ny * 4).toFixed(2)}deg)`;
    };

    const onPointerLeave = () => {
      if (!portraitRef.current) return;
      portraitRef.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    };

    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    stage.addEventListener("pointerleave", onPointerLeave, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0E131B]/65"
    >
      {/* Calibrated Radial Atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-56 w-56 rounded-full opacity-18 blur-3xl transition-colors duration-500"
        style={{ backgroundColor: active.hue }}
      />

      {/* Back-Half Orbital Arcs (z-[4] — passes cleanly BEHIND portrait) */}
      <svg
        viewBox="0 0 440 360"
        className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
        aria-hidden="true"
      >
        <g transform="translate(220 198) rotate(-10)">
          <path
            d="M -186 0 A 186 76 0 0 1 186 0"
            fill="none"
            stroke={active.hue}
            strokeOpacity="0.22"
            strokeWidth="1.2"
          />
          <path
            d="M -154 0 A 154 58 0 0 1 154 0"
            fill="none"
            stroke="#38BDF8"
            strokeOpacity="0.14"
            strokeDasharray="4 6"
            strokeWidth="1"
          />
        </g>
      </svg>

      {/* Proportional Machined Portrait Frame (z-10) */}
      <div
        ref={portraitRef}
        className="relative z-10 rounded-[1.2rem] border bg-[#111720]/95 p-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] transition-[border-color,transform] duration-200 ease-out will-change-transform"
        style={{ borderColor: `${active.hue}55` }}
      >
        <div className="relative h-40 w-36 overflow-hidden rounded-[0.95rem] border border-[rgba(240,246,252,0.1)] bg-[#0D1117] sm:h-48 sm:w-44 lg:h-52 lg:w-48">
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
            className="pointer-events-none absolute inset-0 rounded-[0.95rem] ring-1 ring-inset ring-white/10"
          />
        </div>
      </div>

      {/* Front-Half Orbital Arcs (z-[20] — wraps cleanly IN FRONT of lower portrait) */}
      <svg
        viewBox="0 0 440 360"
        className="pointer-events-none absolute inset-0 z-[20] h-full w-full"
        aria-hidden="true"
      >
        <g transform="translate(220 198) rotate(-10)">
          <path
            d="M 186 0 A 186 76 0 0 1 -186 0"
            fill="none"
            stroke={active.hue}
            strokeOpacity="0.62"
            strokeWidth="1.45"
          />
          <path
            d="M 154 0 A 154 58 0 0 1 -154 0"
            fill="none"
            stroke="#38BDF8"
            strokeOpacity="0.24"
            strokeDasharray="5 6"
            strokeWidth="1"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="44"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>

      {/* Depth-Sorted Orbiting 2D Planet Beacons */}
      {ORBITAL_SYSTEMS.map((sys, idx) => {
        const isActive = idx === activeSystemIndex;
        const isHovered = idx === hoveredIdx;
        return (
          <button
            key={sys.id}
            ref={(el) => {
              beaconRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => onSelectSystem(idx)}
            onMouseEnter={() => {
              hoveredRef.current = true;
              setHoveredIdx(idx);
            }}
            onMouseLeave={() => {
              hoveredRef.current = false;
              setHoveredIdx(null);
            }}
            aria-label={`Select ${sys.label} (${sys.metric})`}
            aria-pressed={isActive}
            style={{
              left: "50%",
              top: "50%",
            }}
            className="group absolute flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none"
          >
            {/* Tilted Outer Gimbal Ring */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border transition-all duration-200"
              style={{
                borderColor: sys.hue,
                opacity: isActive ? 0.92 : isHovered ? 0.78 : 0.52,
                transform: `rotate(-24deg) scale(${isActive ? 1.18 : isHovered ? 1.08 : 0.94})`,
                boxShadow: isActive ? `0 0 14px -2px ${sys.hue}88` : undefined,
              }}
            />
            {/* Inner Core Orb */}
            <span
              aria-hidden="true"
              className="relative h-3.5 w-3.5 rounded-full transition-transform duration-200 group-hover:scale-110"
              style={{
                backgroundColor: sys.hue,
                boxShadow: `0 0 10px ${sys.hue}AA`,
              }}
            />
            {/* Compact Micro-Tag on Active / Hover */}
            {(isActive || isHovered) && (
              <span
                className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border bg-[#0D1117]/95 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#E6EDF3] shadow-lg backdrop-blur-md"
                style={{ borderColor: `${sys.hue}66` }}
              >
                {sys.label}
              </span>
            )}
          </button>
        );
      })}

      {/* 2D Safe Indicator positioned top-right away from bottom-right HUD pill */}
      <span className="pointer-events-none absolute right-3 top-3 z-30 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117]/88 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E] backdrop-blur-md">
        2D Safe
      </span>
    </div>
  );
}

export function HeroOrbitalCore3D({
  activeSystemIndex,
  onSelectSystem,
}: HeroOrbitalCore3DProps) {
  const { canRender3D } = useCanRender3D();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [wheelEngaged, setWheelEngaged] = useState(false);
  const [zoomSignal, setZoomSignal] = useState<ZoomSignal>({ action: "reset", seq: 0 });

  const triggerZoom = useCallback((action: ZoomAction) => {
    setZoomSignal((prev) => ({ action, seq: prev.seq + 1 }));
  }, []);

  const displaySys =
    ORBITAL_SYSTEMS[hoveredIdx ?? activeSystemIndex] ?? ORBITAL_SYSTEMS[0];

  return (
    <div
      data-lenis-prevent-wheel={wheelEngaged ? "true" : undefined}
      onPointerDown={() => {
        if (canRender3D) setWheelEngaged(true);
      }}
      onPointerLeave={() => setWheelEngaged(false)}
      className="relative h-[320px] w-full overflow-hidden rounded-2xl sm:h-[380px] lg:h-[420px]"
    >
      <div className="pointer-events-none absolute left-3 top-3 z-30 inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#0D1117]/88 px-3 py-1 font-mono text-xs text-[#E6EDF3] backdrop-blur-md">
        <span style={{ color: displaySys.hue }}>{displaySys.code}</span>
        <span className="font-semibold">{displaySys.label}</span>
        <span className="text-[#9DA7B3]">· {displaySys.metric}</span>
      </div>

      {canRender3D && (
        <CanvasZoomHUD
          onZoomIn={() => triggerZoom("in")}
          onZoomOut={() => triggerZoom("out")}
          onReset={() => triggerZoom("reset")}
        />
      )}

      <ViewportCanvas
        eager
        cameraPosition={HERO_CAM_POS}
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
          enableWheelZoom={wheelEngaged}
          zoomSignal={zoomSignal}
        />
      </ViewportCanvas>
    </div>
  );
}
