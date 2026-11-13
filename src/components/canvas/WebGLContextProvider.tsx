"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  detectHardwareCapability,
  detectMotionPreference,
  hasWebGLSupport,
  resolveEffectiveTier,
  resolveQualityReason,
  type DeviceTier,
  type QualityPreference,
} from "@/lib/device-tier";

const STORAGE_KEY = "portfolio-v2-3d-quality";

const LazyScene3DRoot = dynamic(
  () => import("./Scene3DRoot").then((mod) => mod.Scene3DRoot),
  { ssr: false }
);

interface WebGLContextValue {
  hasMounted: boolean;
  hardwareTier: DeviceTier;
  effectiveTier: DeviceTier;
  preference: QualityPreference;
  reducedMotion: boolean;
  webglSupported: boolean;
  contextLost: boolean;
  qualityReason: string;
  eventSourceRef: React.RefObject<HTMLDivElement | null>;
  setPreference: (next: QualityPreference) => void;
  setContextLost: (lost: boolean) => void;
}

const WebGLContext = createContext<WebGLContextValue>({
  hasMounted: false,
  hardwareTier: "low",
  effectiveTier: "low",
  preference: "auto",
  reducedMotion: false,
  webglSupported: false,
  contextLost: false,
  qualityReason: "Initializing",
  eventSourceRef: { current: null },
  setPreference: () => {},
  setContextLost: () => {},
});

/**
 * Global WebGL quality + reduced-motion provider hosting the single root <Canvas> (<Scene3DRoot>).
 * WebGL runtime JS is lazy-loaded strictly on the client after hardware capability checks pass.
 */
export function WebGLContextProvider({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [hardwareTier, setHardwareTier] = useState<DeviceTier>("low");
  const [hardwareReason, setHardwareReason] = useState("Checking GPU");
  const [preference, setPreferenceState] = useState<QualityPreference>("auto");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const eventSourceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const motion = detectMotionPreference();
      setReducedMotion(motion === "reduced");

      const detected = detectHardwareCapability();
      const supported = hasWebGLSupport();
      setHardwareTier(detected.tier);
      setHardwareReason(detected.reason);
      setWebglSupported(supported);

      try {
        const saved =
          (window.localStorage.getItem(STORAGE_KEY) as QualityPreference | null) ??
          (window.sessionStorage.getItem(STORAGE_KEY) as QualityPreference | null);
        if (saved === "auto" || saved === "high" || saved === "balanced" || saved === "2d") {
          setPreferenceState(saved);
        }
      } catch {
        // Ignore private browsing storage restrictions
      }

      setHasMounted(true);
    });

    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMediaChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    media?.addEventListener?.("change", onMediaChange);
    return () => {
      window.cancelAnimationFrame(rafId);
      media?.removeEventListener?.("change", onMediaChange);
    };
  }, []);

  const setPreference = useCallback((next: QualityPreference) => {
    setPreferenceState(next);
    setContextLost(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const effectiveTier = useMemo(() => {
    if (!hasMounted) return "low";
    return resolveEffectiveTier(preference, hardwareTier, webglSupported);
  }, [hasMounted, preference, hardwareTier, webglSupported]);

  const qualityReason = useMemo(
    () => resolveQualityReason(preference, hardwareReason, reducedMotion, contextLost),
    [preference, hardwareReason, reducedMotion, contextLost]
  );

  const mountRootCanvas =
    hasMounted && webglSupported && effectiveTier !== "low" && !contextLost;

  const value = useMemo<WebGLContextValue>(
    () => ({
      hasMounted,
      hardwareTier,
      effectiveTier,
      preference,
      reducedMotion,
      webglSupported,
      contextLost,
      qualityReason,
      eventSourceRef,
      setPreference,
      setContextLost,
    }),
    [
      hasMounted,
      hardwareTier,
      effectiveTier,
      preference,
      reducedMotion,
      webglSupported,
      contextLost,
      qualityReason,
      setPreference,
    ]
  );

  return (
    <WebGLContext.Provider value={value}>
      <div ref={eventSourceRef} className="relative min-h-[100dvh]">
        {mountRootCanvas && (
          <LazyScene3DRoot
            effectiveTier={effectiveTier}
            reducedMotion={reducedMotion}
            eventSource={eventSourceRef}
            onDowngrade={() => setPreference("balanced")}
            onContextLost={() => setContextLost(true)}
            onContextRestored={() => setContextLost(false)}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </WebGLContext.Provider>
  );
}

export function useWebGLContext() {
  return useContext(WebGLContext);
}
