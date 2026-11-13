"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { profile } from "@/data/site";
import { useWebGLContext } from "./WebGLContextProvider";
import { ViewportCanvas } from "./ViewportCanvas";

function MonochromePortraitMesh({
  pointerRef,
  hoverRef,
}: {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  hoverRef: React.MutableRefObject<boolean>;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const smoothPtr = useRef(new THREE.Vector2(0.5, 0.5));
  const smoothHover = useRef(0);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(profile.portrait, (loaded) => {
      if (!active) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.minFilter = THREE.LinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      setTexture(loaded);
    });
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
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0.0 },
        uTime: { value: 0.0 },
        uAccent: { value: new THREE.Color("#38BDF8") },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform vec2 uPointer;
        uniform float uHover;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float d = distance(uv, uPointer);
          pos.z += exp(-d * 5.0) * 0.14 * uHover;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform vec2 uPointer;
        uniform float uHover;
        uniform float uTime;
        uniform vec3 uAccent;
        varying vec2 vUv;

        void main() {
          vec3 col = vec3(0.086, 0.106, 0.133);
          if (uHasMap > 0.5) {
            float d = distance(vUv, uPointer);
            vec2 dir = normalize(vUv - uPointer + 0.0001);
            float ripple = sin(d * 28.0 - uTime * 3.0) * exp(-d * 6.0) * 0.006 * uHover;
            vec4 tex = texture2D(uMap, vUv + dir * ripple);

            float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
            lum = clamp((lum - 0.5) * 1.24 + 0.48, 0.0, 1.0);
            vec3 mono = vec3(lum);

            float spotlight = exp(-d * 4.5) * uHover * 0.35;
            col = mix(mono, mono * 0.85 + uAccent * 0.42, spotlight);
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
    [texture]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    smoothPtr.current.x +=
      (pointerRef.current.x - smoothPtr.current.x) * Math.min(1, dt * 8);
    smoothPtr.current.y +=
      (pointerRef.current.y - smoothPtr.current.y) * Math.min(1, dt * 8);

    const targetH = hoverRef.current ? 1.0 : 0.0;
    smoothHover.current += (targetH - smoothHover.current) * Math.min(1, dt * 6);

    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uMap.value = texture;
      matRef.current.uniforms.uHasMap.value = texture ? 1.0 : 0.0;
      matRef.current.uniforms.uPointer.value.copy(smoothPtr.current);
      matRef.current.uniforms.uHover.value = smoothHover.current;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[4.0, 4.6, 24, 24]} />
      <shaderMaterial ref={matRef} args={[shaderArgs]} />
    </mesh>
  );
}

/**
 * Cursor-reactive WebGL monochrome shader portrait over crisp static <img> fallback.
 */
export function PortraitShaderCanvas() {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const hoverRef = useRef(false);

  const showShader = hasMounted && webglSupported && effectiveTier !== "low";

  const staticImg = (
    <img
      src={profile.portrait}
      alt="Monochrome editorial portrait of Mehedi Hasan"
      width={640}
      height={760}
      loading="lazy"
      decoding="async"
      className="aspect-[4/4.6] w-full object-cover object-top grayscale contrast-125 brightness-95 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02]"
    />
  );

  if (!showShader) {
    return staticImg;
  }

  return (
    <div
      className="relative aspect-[4/4.6] w-full overflow-hidden bg-[#0D1117]"
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: 1 - (e.clientY - rect.top) / rect.height,
        };
      }}
    >
      <ViewportCanvas
        className="h-full w-full"
        cameraPosition={[0, 0, 5.1]}
        fov={48}
        fallback={staticImg}
      >
        <MonochromePortraitMesh pointerRef={pointerRef} hoverRef={hoverRef} />
      </ViewportCanvas>
    </div>
  );
}

