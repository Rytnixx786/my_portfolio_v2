"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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

interface ClientEnvSnapshot {
  hasMounted: boolean;
  hardwareTier: DeviceTier;
  hardwareReason: string;
  webglSupported: boolean;
  reducedMotion: boolean;
  preference: QualityPreference;
}

const SERVER_ENV_SNAPSHOT: ClientEnvSnapshot = {
  hasMounted: false,
  hardwareTier: "low",
  hardwareReason: "Checking GPU",
  webglSupported: false,
  reducedMotion: false,
  preference: "auto",
};

let cachedClientEnv: ClientEnvSnapshot | null = null;
const envListeners = new Set<() => void>();

function readStoredPreference(): QualityPreference {
  try {
    const saved =
      (window.localStorage.getItem(STORAGE_KEY) as QualityPreference | null) ??
      (window.sessionStorage.getItem(STORAGE_KEY) as QualityPreference | null);
    if (saved === "auto" || saved === "high" || saved === "balanced" || saved === "2d") {
      return saved;
    }
  } catch {
    // Ignore private browsing storage restrictions
  }
  return "auto";
}

function getClientEnvSnapshot(): ClientEnvSnapshot {
  if (typeof window === "undefined") {
    return SERVER_ENV_SNAPSHOT;
  }
  if (!cachedClientEnv) {
    const detected = detectHardwareCapability();
    cachedClientEnv = {
      hasMounted: true,
      hardwareTier: detected.tier,
      hardwareReason: detected.reason,
      webglSupported: hasWebGLSupport(),
      reducedMotion: detectMotionPreference() === "reduced",
      preference: readStoredPreference(),
    };
  }
  return cachedClientEnv;
}

function getServerEnvSnapshot(): ClientEnvSnapshot {
  return SERVER_ENV_SNAPSHOT;
}

function emitClientEnvChange() {
  for (const listener of envListeners) {
    listener();
  }
}

function subscribeClientEnv(listener: () => void): () => void {
  envListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      envListeners.delete(listener);
    };
  }

  const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const onMediaChange = (event: MediaQueryListEvent) => {
    const current = getClientEnvSnapshot();
    if (current.reducedMotion !== event.matches) {
      cachedClientEnv = { ...current, reducedMotion: event.matches };
      emitClientEnvChange();
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    const nextPref = readStoredPreference();
    const current = getClientEnvSnapshot();
    if (current.preference !== nextPref) {
      cachedClientEnv = { ...current, preference: nextPref };
      emitClientEnvChange();
    }
  };

  media?.addEventListener?.("change", onMediaChange);
  window.addEventListener("storage", onStorage);

  return () => {
    envListeners.delete(listener);
    media?.removeEventListener?.("change", onMediaChange);
    window.removeEventListener("storage", onStorage);
  };
}

function updateStoredPreference(next: QualityPreference) {
  const current = getClientEnvSnapshot();
  if (current.preference !== next) {
    cachedClientEnv = { ...current, preference: next };
    emitClientEnvChange();
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore storage write errors
  }
}

interface WebGLContextValue {
  hasMounted: boolean;
  hardwareTier: DeviceTier;
  effectiveTier: DeviceTier;
  preference: QualityPreference;
  reducedMotion: boolean;
  webglSupported: boolean;
  contextLost: boolean;
  qualityReason: string;
  maxSlots: number;
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
  maxSlots: 0,
  eventSourceRef: { current: null },
  activeSlotIds: new Set(),
  requestSlot: () => {},
  releaseSlot: () => {},
  setPreference: () => {},
  setContextLost: () => {},
});

/**
 * Global WebGL quality, reduced-motion, and LRU WebGL context slot-pool provider.
 * Caps active container-scoped <Canvas> instances (max 3 on high, 2 on mid) so
 * WebGL scenes stay 100% locked to their DOM containers on scroll without hitting browser context limits.
 */
export function WebGLContextProvider({ children }: { children: ReactNode }) {
  const {
    hasMounted,
    hardwareTier,
    hardwareReason,
    webglSupported,
    reducedMotion,
    preference,
  } = useSyncExternalStore(
    subscribeClientEnv,
    getClientEnvSnapshot,
    getServerEnvSnapshot
  );
  const [contextLost, setContextLost] = useState(false);
  const [slotOrder, setSlotOrder] = useState<Array<{ id: string; pinned: boolean }>>([]);

  const eventSourceRef = useRef<HTMLDivElement | null>(null);

  const setPreference = useCallback((next: QualityPreference) => {
    setContextLost(false);
    updateStoredPreference(next);
  }, []);

  const effectiveTier = useMemo(() => {
    if (!hasMounted) return "low";
    return resolveEffectiveTier(preference, hardwareTier, webglSupported);
  }, [hasMounted, preference, hardwareTier, webglSupported]);

  const maxSlots = effectiveTier === "high" ? 3 : effectiveTier === "mid" ? 2 : 0;

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
      maxSlots,
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
      maxSlots,
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
