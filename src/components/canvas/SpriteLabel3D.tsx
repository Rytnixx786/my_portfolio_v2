"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface SpriteLabel3DProps {
  text: string;
  position?: [number, number, number];
  active?: boolean;
  accentColor?: string;
  worldHeight?: number;
}

/**
 * Pure WebGL pill label rendered onto a disposed CanvasTexture <sprite>.
 * Eliminates drei <Html> React 19 createRoot().unmount() race conditions.
 */
export function SpriteLabel3D({
  text,
  position = [0, 0.5, 0],
  active = false,
  accentColor = "#38BDF8",
  worldHeight = 0.24,
}: SpriteLabel3DProps) {
  const result = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const fontSize = 26;
    const font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.font = font;
    const textWidth = Math.ceil(ctx.measureText(text).width);
    const padX = 22;
    const width = Math.max(64, textWidth + padX * 2);
    const height = 52;

    canvas.width = width;
    canvas.height = height;

    // Re-apply font after resizing canvas
    ctx.font = font;
    ctx.clearRect(0, 0, width, height);

    const r = 14;
    ctx.beginPath();
    ctx.roundRect(2, 2, width - 4, height - 4, r);
    ctx.fillStyle = active ? "rgba(13, 17, 23, 0.94)" : "rgba(13, 17, 23, 0.82)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = active ? accentColor : "rgba(240, 246, 252, 0.16)";
    ctx.stroke();

    ctx.fillStyle = active ? "#E6EDF3" : "#9DA7B3";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2 + 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    const aspect = width / height;
    return { texture, aspect };
  }, [text, active, accentColor]);

  useEffect(() => {
    return () => {
      result?.texture.dispose();
    };
  }, [result]);

  if (!result) return null;

  return (
    <sprite
      position={position}
      scale={[worldHeight * result.aspect, worldHeight, 1]}
      renderOrder={10}
    >
      <spriteMaterial
        map={result.texture}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </sprite>
  );
}

