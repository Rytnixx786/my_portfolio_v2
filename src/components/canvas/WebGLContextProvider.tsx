"use client";

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
  activeSlotIds: ReadonlySet<string>;
  requestSlot: (id: string, pinned?: boolean) => void;
  releaseSlot: (id: string) => void;
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
  activeSlotIds: new Set(),
  requestSlot: () => {},
  releaseSlot: () => {},
  setPreference: () => {},
  setContextLost: () => {},
});

/**
 * Global WebGL quality, reduced-motion, and LRU WebGL context slot-pool provider.
 * Caps active container-scoped <Canvas> instances (max 4 on high, 3 on mid) so
 * WebGL scenes stay 100% locked to their DOM containers on scroll without hitting browser context limits.
 */
export function WebGLContextProvider({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [hardwareTier, setHardwareTier] = useState<DeviceTier>("low");
  const [hardwareReason, setHardwareReason] = useState("Checking GPU");
  const [preference, setPreferenceState] = useState<QualityPreference>("auto");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [slotOrder, setSlotOrder] = useState<Array<{ id: string; pinned: boolean }>>([]);

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

  const maxSlots = effectiveTier === "high" ? 8 : effectiveTier === "mid" ? 6 : 0;

  const activeSlotIds = useMemo<ReadonlySet<string>>(() => {
    if (maxSlots <= 0 || slotOrder.length === 0) {
      return new Set();
    }
    // Always preserve actively visible (in-view) slots before near-view preload slots
    const pinned = slotOrder.filter((item) => item.pinned).slice(-maxSlots);
    const remaining = maxSlots - pinned.length;
    const preloads =
      remaining > 0
        ? slotOrder.filter((item) => !item.pinned).slice(-remaining)
        : [];
    return new Set([...pinned, ...preloads].map((item) => item.id));
  }, [maxSlots, slotOrder]);

  const requestSlot = useCallback((id: string, pinned = false) => {
    setSlotOrder((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.pinned === pinned && prev[prev.length - 1]?.id === id) {
        return prev;
      }
      return [...prev.filter((item) => item.id !== id), { id, pinned }];
    });
  }, []);

  const releaseSlot = useCallback((id: string) => {
    setSlotOrder((prev) => {
      if (!prev.some((item) => item.id === id)) return prev;
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const qualityReason = useMemo(
    () => resolveQualityReason(preference, hardwareReason, reducedMotion, contextLost),
    [preference, hardwareReason, reducedMotion, contextLost]
  );

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
      activeSlotIds,
      requestSlot,
      releaseSlot,
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
      activeSlotIds,
      requestSlot,
      releaseSlot,
      setPreference,
    ]
  );

  return (
    <WebGLContext.Provider value={value}>
      <div ref={eventSourceRef} className="relative min-h-[100dvh]">
        {children}
      </div>
    </WebGLContext.Provider>
  );
}

export function useWebGLContext() {
  return useContext(WebGLContext);
}
