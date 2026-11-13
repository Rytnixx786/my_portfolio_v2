"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface SpriteLabel3DProps {
  text: string;
  position?: [number, number, number];
  active?: boolean;
  accentColor?: string;
  worldHeight?: number;
  maxWorldWidth?: number;
  minHeightScale?: number;
}

/**
 * Pure WebGL pill label rendered onto a disposed high-DPI CanvasTexture <sprite>.
 * Clamps extreme widths cleanly while preserving readable vertical height via minHeightScale.
 */
export function SpriteLabel3D({
  text,
  position = [0, 0.5, 0],
  active = false,
  accentColor = "#38BDF8",
  worldHeight = 0.24,
  maxWorldWidth,
  minHeightScale = 0.72,
}: SpriteLabel3DProps) {
  const result = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const fontSize = 36;
    const font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.font = font;
    const textWidth = Math.ceil(ctx.measureText(text).width);
    const padX = 28;
    const width = Math.max(96, textWidth + padX * 2);
    const height = 76;

    canvas.width = width;
    canvas.height = height;

    // Re-apply font after resizing canvas
    ctx.font = font;
    ctx.clearRect(0, 0, width, height);

    const r = 20;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, height - 8, r);
    ctx.fillStyle = active ? "rgba(13, 17, 23, 0.97)" : "rgba(18, 25, 35, 0.94)";
    ctx.fill();
    ctx.lineWidth = active ? 3.5 : 2.2;
    ctx.strokeStyle = active ? accentColor : "rgba(240, 246, 252, 0.34)";
    ctx.stroke();

    ctx.fillStyle = active ? "#F8FAFC" : "#E6EDF3";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2 + 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
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

  const rawW = worldHeight * result.aspect;
  const clampFactor =
    maxWorldWidth && rawW > maxWorldWidth ? maxWorldWidth / rawW : 1;
  const finalW = rawW * clampFactor;
  const finalH = worldHeight * Math.max(minHeightScale, clampFactor);

  return (
    <sprite
      position={position}
      scale={[finalW, finalH, 1]}
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
