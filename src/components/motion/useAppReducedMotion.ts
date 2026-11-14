"use client";

import { useSyncExternalStore } from "react";
import { shouldReduceAppMotion } from "@/lib/motion";

function subscribeAppMotion(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("portfolio:motion-mode", callback);
  return () => {
    window.removeEventListener("portfolio:motion-mode", callback);
  };
}

function getClientMotionSnapshot(): boolean {
  return shouldReduceAppMotion();
}

function getServerMotionSnapshot(): boolean {
  return false;
}

/**
 * Reactively mirrors the app-level motion gate (`data-motion="reduced"` when
 * the user selects "2D SAFE" in the Quality HUD, defaulting to full motion).
 */
export function useAppReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeAppMotion,
    getClientMotionSnapshot,
    getServerMotionSnapshot
  );
}
