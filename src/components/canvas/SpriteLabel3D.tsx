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

const LABEL_CANVAS_CACHE_MAX = 64;
const labelCanvasCache = new Map<
  string,
  { canvas: HTMLCanvasElement; aspect: number }
>();

function getOrDrawLabelCanvas(
  text: string,
  active: boolean,
  accentColor: string
): { canvas: HTMLCanvasElement; aspect: number } | null {
  if (typeof document === "undefined") return null;
  const key = `${text}|${active ? 1 : 0}|${accentColor}`;
  const cached = labelCanvasCache.get(key);
  if (cached) {
    // Refresh LRU order
    labelCanvasCache.delete(key);
    labelCanvasCache.set(key, cached);
    return cached;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const fontSize = 36;
  const font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.font = font;
  const textWidth = Math.ceil(ctx.measureText(text).width);
  const padX = 28;
  const width = Math.max(96, textWidth + padX * 2);
  const height = 74;

  canvas.width = width;
  canvas.height = height;

  ctx.font = font;
  ctx.clearRect(0, 0, width, height);

  const r = 18;
  ctx.beginPath();
  ctx.roundRect(4, 4, width - 8, height - 8, r);
  ctx.fillStyle = active ? "rgba(13, 17, 23, 0.98)" : "rgba(16, 22, 31, 0.94)";
  ctx.fill();
  ctx.lineWidth = active ? 3.5 : 2.2;
  ctx.strokeStyle = active ? accentColor : "rgba(240, 246, 252, 0.36)";
  ctx.stroke();

  ctx.fillStyle = active ? "#F8FAFC" : "#E6EDF3";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 1);

  const entry = { canvas, aspect: width / height };
  labelCanvasCache.set(key, entry);
  if (labelCanvasCache.size > LABEL_CANVAS_CACHE_MAX) {
    const oldest = labelCanvasCache.keys().next().value;
    if (oldest !== undefined) labelCanvasCache.delete(oldest);
  }
  return entry;
}

/**
 * Pure WebGL pill label rendered onto a high-DPI CanvasTexture <sprite> with clean disposal
 * and bounded LRU 2D canvas caching to eliminate tab-switch / hover frame spikes.
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
    const entry = getOrDrawLabelCanvas(text, active, accentColor);
    if (!entry) return null;

    const texture = new THREE.CanvasTexture(entry.canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    return { texture, aspect: entry.aspect };
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
