"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
  const { gl } = useThree();

  useFrame(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    window.requestAnimationFrame(() => {
      if (!unmountingRef.current && gl.domElement.isConnected) {
        onReady?.();
      }
    });
  });

  return null;
}

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
  const safetyTimerRef = useRef<number | null>(null);
  const loopEnabled = activeLoop && !isStaticPose;

  useLayoutEffect(() => {
    unmountingRef.current = false;
    readyFiredRef.current = false;
    return () => {
      unmountingRef.current = true;
      if (safetyTimerRef.current !== null) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, []);

  const notifyReady = () => {
    if (readyFiredRef.current || unmountingRef.current) return;
    readyFiredRef.current = true;
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    onCanvasReady?.();
  };

  return (
    <Canvas
      className="r3f-local-canvas"
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

        safetyTimerRef.current = window.setTimeout(() => {
          if (!unmountingRef.current && canvas.isConnected) {
            notifyReady();
          }
        }, 600);
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
