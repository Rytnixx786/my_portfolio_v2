"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CANVAS_RESIZE_CONFIG } from "@/lib/device-tier";

// Filter upstream @react-three/fiber internal THREE.Clock deprecation noise on Three r183+
// while forwarding every other Three.js warning/error untouched.
let consoleConfigured = false;
function configureThreeConsole() {
  if (consoleConfigured || typeof window === "undefined") return;
  consoleConfigured = true;
  if (typeof THREE.setConsoleFunction === "function") {
    THREE.setConsoleFunction((type, message, ...params) => {
      if (
        type === "warn" &&
        typeof message === "string" &&
        message.includes("Clock: This module has been deprecated")
      ) {
        return;
      }
      const fn =
        type === "error"
          ? console.error
          : type === "warn"
            ? console.warn
            : console.log;
      fn(message, ...params);
    });
  }
}
configureThreeConsole();

/**
 * Triggers an immediate demand frame and keeps frameloop synchronized
 * when activeLoop flips between paused (offscreen) and active (onscreen).
 */
function CanvasLifecycle({ activeLoop }: { activeLoop: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const mode = activeLoop ? "always" : "demand";
    setFrameloop(mode);
    invalidate();
    const rafId = window.requestAnimationFrame(() => {
      setFrameloop(mode);
      invalidate();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [activeLoop, setFrameloop, invalidate]);

  return null;
}

function FirstFrameNotifier({
  onReady,
  unmountingRef,
}: {
  onReady?: () => void;
  unmountingRef: React.RefObject<boolean>;
}) {
  const firedRef = useRef(false);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    firedRef.current = false;
    return () => {
      firedRef.current = false;
    };
  }, []);

  // Re-nudge demand frameloop whenever layout dimensions resolve or settle before frame 1
  useEffect(() => {
    if (firedRef.current || size.width <= 0 || size.height <= 0) return;
    invalidate();
    const t1 = window.setTimeout(() => {
      if (!firedRef.current && !unmountingRef.current) invalidate();
    }, 180);
    const t2 = window.setTimeout(() => {
      if (!firedRef.current && !unmountingRef.current) invalidate();
    }, 520);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [size.width, size.height, invalidate, unmountingRef]);

  useFrame(() => {
    if (firedRef.current) return;
    if (
      size.width <= 0 ||
      size.height <= 0 ||
      gl.domElement.width <= 0 ||
      gl.domElement.height <= 0
    ) {
      return;
    }
    firedRef.current = true;
    window.requestAnimationFrame(() => {
      if (!unmountingRef.current && gl.domElement.isConnected) {
        onReady?.();
      }
    });
  });

  return null;
}

/**
 * Re-exported from `@/lib/device-tier` for component consumers & tests.
 */
export { CANVAS_RESIZE_CONFIG };

export function LocalCanvasInner({
  children,
  cameraPosition,
  fov,
  dpr,
  antialias,
  activeLoop,
  isStaticPose = false,
  onCanvasReady,
  onContextLost,
  onContextRestored,
}: {
  children: ReactNode;
  cameraPosition: [number, number, number];
  fov: number;
  dpr: [number, number];
  antialias: boolean;
  activeLoop: boolean;
  isStaticPose?: boolean;
  onCanvasReady?: () => void;
  onDecline?: () => void;
  onContextLost: () => void;
  onContextRestored: () => void;
}) {
  const unmountingRef = useRef(false);
  const readyFiredRef = useRef(false);
  const onCanvasReadyRef = useRef(onCanvasReady);
  const loopEnabled = activeLoop && !isStaticPose;

  useLayoutEffect(() => {
    onCanvasReadyRef.current = onCanvasReady;
  }, [onCanvasReady]);

  useLayoutEffect(() => {
    unmountingRef.current = false;
    readyFiredRef.current = false;

    return () => {
      unmountingRef.current = true;
    };
  }, []);

  const notifyReady = () => {
    if (readyFiredRef.current || unmountingRef.current) return;
    readyFiredRef.current = true;
    onCanvasReadyRef.current?.();
  };

  return (
    <Canvas
      className="r3f-local-canvas"
      resize={CANVAS_RESIZE_CONFIG}
      dpr={dpr}
      frameloop={loopEnabled ? "always" : "demand"}
      camera={{ position: cameraPosition, fov, near: 0.1, far: 100 }}
      gl={{
        antialias,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.06,
      }}
      onCreated={(state) => {
        const gl = state.gl;
        gl.setClearColor(0x000000, 0);
        const canvas = gl.domElement;

        canvas.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            if (unmountingRef.current || !canvas.isConnected) return;
            onContextLost();
          },
          false
        );

        canvas.addEventListener(
          "webglcontextrestored",
          () => {
            if (unmountingRef.current || !canvas.isConnected) return;
            onContextRestored();
          },
          false
        );

        state.invalidate();
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "pan-y",
      }}
    >
      {children}
      <CanvasLifecycle activeLoop={loopEnabled} />
      <FirstFrameNotifier onReady={notifyReady} unmountingRef={unmountingRef} />
    </Canvas>
  );
}
