"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  detectDeviceTier,
  hasWebGLSupport,
  resolveEffectiveTier,
  type DeviceTier,
  type QualityPreference,
} from "@/lib/device-tier";

const STORAGE_KEY = "portfolio-v2-3d-quality";

interface WebGLContextValue {
  hasMounted: boolean;
  hardwareTier: DeviceTier;
  effectiveTier: DeviceTier;
  preference: QualityPreference;
  reducedMotion: boolean;
  webglSupported: boolean;
  setPreference: (next: QualityPreference) => void;
}

const WebGLContext = createContext<WebGLContextValue>({
  hasMounted: false,
  hardwareTier: "low",
  effectiveTier: "low",
  preference: "auto",
  reducedMotion: false,
  webglSupported: false,
  setPreference: () => {},
});

/**
 * Global WebGL quality and reduced-motion provider shared by every 3D stage.
 */
export function WebGLContextProvider({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [hardwareTier, setHardwareTier] = useState<DeviceTier>("low");
  const [preference, setPreferenceState] = useState<QualityPreference>("auto");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(false);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(media?.matches ?? false);

    const detected = detectDeviceTier();
    const supported = hasWebGLSupport();
    setHardwareTier(detected);
    setWebglSupported(supported);

    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY) as QualityPreference | null;
      if (saved === "auto" || saved === "high" || saved === "balanced" || saved === "2d") {
        setPreferenceState(saved);
      }
    } catch {
      // Ignore storage access errors in private browsing contexts
    }

    setHasMounted(true);

    const onMediaChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      setHardwareTier(detectDeviceTier());
    };

    media?.addEventListener?.("change", onMediaChange);
    return () => media?.removeEventListener?.("change", onMediaChange);
  }, []);

  const setPreference = useCallback((next: QualityPreference) => {
    setPreferenceState(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const effectiveTier = useMemo(() => {
    if (!hasMounted) return "low";
    return resolveEffectiveTier(preference, hardwareTier, webglSupported);
  }, [hasMounted, preference, hardwareTier, webglSupported]);

  const value = useMemo<WebGLContextValue>(
    () => ({
      hasMounted,
      hardwareTier,
      effectiveTier,
      preference,
      reducedMotion,
      webglSupported,
      setPreference,
    }),
    [hasMounted, hardwareTier, effectiveTier, preference, reducedMotion, webglSupported, setPreference]
  );

  return <WebGLContext.Provider value={value}>{children}</WebGLContext.Provider>;
}

export function useWebGLContext() {
  return useContext(WebGLContext);
}

