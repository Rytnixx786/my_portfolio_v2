"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ArrowCounterClockwise, Minus, Plus } from "@phosphor-icons/react";

export type ZoomAction = "in" | "out" | "reset";

export interface ZoomSignal {
  action: ZoomAction;
  seq: number;
}

interface CanvasZoomHUDProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  className?: string;
}

/**
 * Compact machined dark-compute Zoom In / Zoom Out / Reset HUD overlay for 3D viewports.
 */
export function CanvasZoomHUD({
  onZoomIn,
  onZoomOut,
  onReset,
  className = "right-3 top-3",
}: CanvasZoomHUDProps) {
  return (
    <div
      role="group"
      aria-label="3D viewport zoom controls"
      className={`absolute z-30 inline-flex items-center gap-0.5 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22]/90 p-0.5 shadow-lg backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
        className="flex h-11 w-11 items-center justify-center rounded-full text-[#9DA7B3] transition-colors hover:bg-[#1C222B] hover:text-[#38BDF8] active:scale-95"
      >
        <Plus className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
        className="flex h-11 w-11 items-center justify-center rounded-full text-[#9DA7B3] transition-colors hover:bg-[#1C222B] hover:text-[#38BDF8] active:scale-95"
      >
        <Minus className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
      </button>
      <span
        aria-hidden="true"
        className="mx-0.5 h-3.5 w-px bg-[rgba(240,246,252,0.12)]"
      />
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset camera view"
        title="Reset camera view"
        className="flex h-11 w-11 items-center justify-center rounded-full text-[#9DA7B3] transition-colors hover:bg-[#1C222B] hover:text-[#38BDF8] active:scale-95"
      >
        <ArrowCounterClockwise className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
      </button>
    </div>
  );
}

interface CameraZoomControllerProps {
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  defaultPosition: [number, number, number];
  defaultTarget?: [number, number, number];
  minDistance: number;
  maxDistance: number;
  zoomSignal: ZoomSignal;
  onUserZoomTrigger?: () => void;
}

/**
 * Smoothly applies button-triggered Zoom In / Zoom Out / Reset commands
 * to an R3F OrbitControls camera without fighting manual wheel or drag gestures.
 */
export function CameraZoomController({
  controlsRef,
  defaultPosition,
  defaultTarget = [0, 0, 0],
  minDistance,
  maxDistance,
  zoomSignal,
  onUserZoomTrigger,
}: CameraZoomControllerProps) {
  const { camera, frameloop, invalidate } = useThree();
  const modeRef = useRef<"idle" | "dolly" | "reset">("idle");
  const desiredDistRef = useRef<number | null>(null);
  const lastSeqRef = useRef(0);
  const offsetVec = useRef(new THREE.Vector3());
  const defaultPosVec = useRef(new THREE.Vector3(...defaultPosition));
  const defaultTargetVec = useRef(new THREE.Vector3(...defaultTarget));

  useEffect(() => {
    defaultPosVec.current.set(...defaultPosition);
  }, [defaultPosition]);

  useEffect(() => {
    defaultTargetVec.current.set(...defaultTarget);
  }, [defaultTarget]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onControlStart = () => {
      modeRef.current = "idle";
      desiredDistRef.current = null;
    };
    controls.addEventListener("start", onControlStart);
    return () => {
      controls.removeEventListener("start", onControlStart);
    };
  }, [controlsRef]);

  useEffect(() => {
    if (zoomSignal.seq === 0 || zoomSignal.seq === lastSeqRef.current) return;
    lastSeqRef.current = zoomSignal.seq;

    const controls = controlsRef.current;
    const target = controls ? controls.target : defaultTargetVec.current;

    onUserZoomTrigger?.();

    if (zoomSignal.action === "reset") {
      modeRef.current = "reset";
      desiredDistRef.current = null;
      if (frameloop === "demand") {
        camera.position.copy(defaultPosVec.current);
        if (controls) {
          controls.target.copy(defaultTargetVec.current);
          controls.update();
        }
        modeRef.current = "idle";
      }
      invalidate();
      return;
    }

    offsetVec.current.copy(camera.position).sub(target);
    const currDist = Math.max(0.01, offsetVec.current.length());
    const baseDist =
      modeRef.current === "dolly" && desiredDistRef.current !== null
        ? desiredDistRef.current
        : currDist;
    const factor = zoomSignal.action === "in" ? 0.76 : 1.3;
    const nextDist = THREE.MathUtils.clamp(baseDist * factor, minDistance, maxDistance);

    desiredDistRef.current = nextDist;
    modeRef.current = "dolly";

    if (frameloop === "demand") {
      offsetVec.current.normalize().multiplyScalar(nextDist);
      camera.position.copy(target).add(offsetVec.current);
      controls?.update();
      modeRef.current = "idle";
      desiredDistRef.current = null;
    }
    invalidate();
  }, [zoomSignal, camera, controlsRef, frameloop, invalidate, minDistance, maxDistance, onUserZoomTrigger]);

  useFrame((_, delta) => {
    if (modeRef.current === "idle") return;
    const dt = Math.min(delta, 0.05);
    const alpha = 1 - Math.exp(-10 * dt);
    const controls = controlsRef.current;

    if (modeRef.current === "reset") {
      camera.position.lerp(defaultPosVec.current, alpha);
      if (controls) {
        controls.target.lerp(defaultTargetVec.current, alpha);
        controls.update();
      }
      const posDone = camera.position.distanceTo(defaultPosVec.current) < 0.025;
      const targetDone = !controls || controls.target.distanceTo(defaultTargetVec.current) < 0.025;
      if (posDone && targetDone) {
        camera.position.copy(defaultPosVec.current);
        if (controls) {
          controls.target.copy(defaultTargetVec.current);
          controls.update();
        }
        modeRef.current = "idle";
      }
      return;
    }

    if (modeRef.current === "dolly" && desiredDistRef.current !== null) {
      const target = controls ? controls.target : defaultTargetVec.current;
      offsetVec.current.copy(camera.position).sub(target);
      const currDist = Math.max(0.01, offsetVec.current.length());
      const nextDist = THREE.MathUtils.lerp(currDist, desiredDistRef.current, alpha);
      offsetVec.current.normalize().multiplyScalar(nextDist);
      camera.position.copy(target).add(offsetVec.current);
      controls?.update();

      if (Math.abs(nextDist - desiredDistRef.current) < 0.02) {
        offsetVec.current.normalize().multiplyScalar(desiredDistRef.current);
        camera.position.copy(target).add(offsetVec.current);
        controls?.update();
        modeRef.current = "idle";
      }
    }
  });

  return null;
}
