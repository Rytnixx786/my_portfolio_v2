"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
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
  resolveMaxWebGLSlots,
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
    syncDocumentMotionMode(nextPref);
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

let lastSyncedReduced: boolean | null = null;

function syncDocumentMotionMode(preference: QualityPreference) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const isReduced = preference === "2d";
  document.documentElement.dataset.motion = isReduced ? "reduced" : "full";
  if (lastSyncedReduced === isReduced) return;
  lastSyncedReduced = isReduced;
  window.dispatchEvent(
    new CustomEvent("portfolio:motion-mode", { detail: { reduced: isReduced } })
  );
}

function updateStoredPreference(next: QualityPreference) {
  const current = getClientEnvSnapshot();
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore storage write errors
  }
  syncDocumentMotionMode(next);
  if (current.preference !== next) {
    cachedClientEnv = { ...current, preference: next };
    emitClientEnvChange();
  }
}

export interface WebGLSlotStore {
  getSlotMaskSnapshot: (id: string) => number;
  subscribeSlot: (id: string, listener: () => void) => () => void;
  setMaxSlots: (nextMax: number) => void;
  requestSlot: (id: string, pinned?: boolean) => void;
  releaseSlot: (id: string) => void;
  setSlotInView: (id: string, inView: boolean) => void;
  focusSlotLoop: (id: string) => void;
  markScrolling: (settleMs?: number) => void;
  getActiveSlotCount: () => number;
  dispose: () => void;
}

export function createWebGLSlotStore(initialMaxSlots = 0): WebGLSlotStore {
  let maxSlots = Math.max(0, initialMaxSlots);
  let slotOrder: Array<{ id: string; pinned: boolean }> = [];
  let activeIds = new Set<string>();
  let inViewOrder: string[] = [];
  let activeLoopIds = new Set<string>();
  let isScrolling = false;
  let scrollSettleTimer: ReturnType<typeof setTimeout> | null = null;

  const listenersById = new Map<string, Set<() => void>>();
  const lastNotifiedMask = new Map<string, number>();

  const computeMask = (id: string): number => {
    const hasSlot = maxSlots > 0 && activeIds.has(id);
    if (hasSlot) {
      const loopAllowed = activeLoopIds.has(id);
      return 2 | (loopAllowed ? 4 : 0);
    }
    const isSaturated = maxSlots > 0 && activeIds.size >= maxSlots;
    return isSaturated ? 1 : 0;
  };

  const recomputeAndNotify = () => {
    if (maxSlots <= 0 || slotOrder.length === 0) {
      activeIds = new Set();
    } else {
      const pinned = slotOrder.filter((item) => item.pinned).slice(-maxSlots);
      const remaining = maxSlots - pinned.length;
      const preloads =
        remaining > 0
          ? slotOrder.filter((item) => !item.pinned).slice(-remaining)
          : [];
      activeIds = new Set([...pinned, ...preloads].map((item) => item.id));
    }

    const maxActiveLoops = isScrolling ? 1 : 2;
    const eligibleLoops = inViewOrder.filter((id) => activeIds.has(id));
    activeLoopIds = new Set(eligibleLoops.slice(-maxActiveLoops));

    for (const [id, subs] of listenersById.entries()) {
      if (subs.size === 0) continue;
      const nextMask = computeMask(id);
      if (lastNotifiedMask.get(id) !== nextMask) {
        lastNotifiedMask.set(id, nextMask);
        for (const cb of subs) {
          cb();
        }
      }
    }
  };

  return {
    getSlotMaskSnapshot: (id: string) => computeMask(id),

    subscribeSlot: (id: string, listener: () => void) => {
      let subs = listenersById.get(id);
      if (!subs) {
        subs = new Set();
        listenersById.set(id, subs);
      }
      subs.add(listener);
      if (!lastNotifiedMask.has(id)) {
        lastNotifiedMask.set(id, computeMask(id));
      }
      return () => {
        const set = listenersById.get(id);
        if (!set) return;
        set.delete(listener);
        if (set.size === 0) {
          listenersById.delete(id);
          lastNotifiedMask.delete(id);
        }
      };
    },

    setMaxSlots: (nextMax: number) => {
      const normalized = Math.max(0, nextMax);
      if (normalized === maxSlots) return;
      maxSlots = normalized;
      recomputeAndNotify();
    },

    requestSlot: (id: string, pinned = false) => {
      const existing = slotOrder.find((item) => item.id === id);
      if (
        existing &&
        existing.pinned === pinned &&
        slotOrder[slotOrder.length - 1]?.id === id
      ) {
        return;
      }
      slotOrder = [...slotOrder.filter((item) => item.id !== id), { id, pinned }];
      recomputeAndNotify();
    },

    releaseSlot: (id: string) => {
      let changed = false;
      if (slotOrder.some((item) => item.id === id)) {
        slotOrder = slotOrder.filter((item) => item.id !== id);
        changed = true;
      }
      if (inViewOrder.includes(id)) {
        inViewOrder = inViewOrder.filter((entry) => entry !== id);
        changed = true;
      }
      if (changed) {
        recomputeAndNotify();
      }
    },

    setSlotInView: (id: string, inView: boolean) => {
      const has = inViewOrder.includes(id);
      if (inView) {
        if (has && inViewOrder[inViewOrder.length - 1] === id) return;
        inViewOrder = [...inViewOrder.filter((entry) => entry !== id), id];
      } else {
        if (!has) return;
        inViewOrder = inViewOrder.filter((entry) => entry !== id);
      }
      recomputeAndNotify();
    },

    focusSlotLoop: (id: string) => {
      if (!inViewOrder.includes(id)) return;
      if (inViewOrder[inViewOrder.length - 1] === id) return;
      inViewOrder = [...inViewOrder.filter((entry) => entry !== id), id];
      recomputeAndNotify();
    },

    markScrolling: (settleMs = 140) => {
      const wasScrolling = isScrolling;
      isScrolling = true;
      if (!wasScrolling) {
        recomputeAndNotify();
      }
      if (scrollSettleTimer !== null) {
        clearTimeout(scrollSettleTimer);
      }
      scrollSettleTimer = setTimeout(() => {
        scrollSettleTimer = null;
        isScrolling = false;
        recomputeAndNotify();
      }, settleMs);
    },

    getActiveSlotCount: () => activeIds.size,

    dispose: () => {
      if (scrollSettleTimer !== null) {
        clearTimeout(scrollSettleTimer);
        scrollSettleTimer = null;
      }
    },
  };
}

const defaultSlotStore = createWebGLSlotStore(0);

export function subscribeSlotStore(id: string, listener: () => void): () => void {
  return defaultSlotStore.subscribeSlot(id, listener);
}

export function getSlotStoreSnapshot(id: string): number {
  return defaultSlotStore.getSlotMaskSnapshot(id);
}

export function requestWebGLSlot(id: string, pinned = false) {
  defaultSlotStore.requestSlot(id, pinned);
}

export function releaseWebGLSlot(id: string) {
  defaultSlotStore.releaseSlot(id);
}

export function setWebGLSlotInView(id: string, inView: boolean) {
  defaultSlotStore.setSlotInView(id, inView);
}

export function focusWebGLSlotLoop(id: string) {
  defaultSlotStore.focusSlotLoop(id);
}

export function markWebGLScrollBurst() {
  defaultSlotStore.markScrolling();
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
  setPreference: () => { },
  setContextLost: () => { },
});

/**
 * Global WebGL quality, reduced-motion, and zero-churn LRU WebGL context slot-pool provider.
 * Slot membership lives in an external store (`subscribeSlotStore`) so only the specific
 * `ViewportCanvas` whose slot allocation or loop budget changes re-renders during scroll.
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

  const eventSourceRef = useRef<HTMLDivElement | null>(null);

  const setPreference = useCallback((next: QualityPreference) => {
    setContextLost(false);
    updateStoredPreference(next);
  }, []);

  useLayoutEffect(() => {
    if (!hasMounted || typeof document === "undefined") return;
    syncDocumentMotionMode(preference);
  }, [hasMounted, preference]);

  const effectiveTier = useMemo(() => {
    if (!hasMounted) return "low";
    return resolveEffectiveTier(preference, hardwareTier, webglSupported);
  }, [hasMounted, preference, hardwareTier, webglSupported]);

  const maxSlots = resolveMaxWebGLSlots(effectiveTier);

  useLayoutEffect(() => {
    defaultSlotStore.setMaxSlots(maxSlots);
  }, [maxSlots]);

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
