export type CapabilityTier = "full" | "basic" | "none";
export type MotionPreference = "full" | "reduced";

// Backwards-compatible aliases kept for component contracts
export type DeviceTier = "high" | "mid" | "low";
export type QualityPreference = "auto" | "high" | "balanced" | "2d";

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

let cachedWebGLSupport: boolean | null = null;

/**
 * Checks whether hardware-accelerated WebGL is available in this browser session.
 * Memoizes the result and releases the temporary probe context immediately.
 */
export function hasWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedWebGLSupport !== null) return cachedWebGLSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!gl) {
      cachedWebGLSupport = false;
      return false;
    }

    let supported = true;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "");
      if (/SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(renderer)) {
        supported = false;
      }
    }

    gl.getExtension("WEBGL_lose_context")?.loseContext();
    cachedWebGLSupport = supported;
    return supported;
  } catch {
    cachedWebGLSupport = false;
    return false;
  }
}

/**
 * Signal 1 (Section 7.5): Pure hardware/network capability without conflating prefers-reduced-motion.
 */
export function detectHardwareCapability(): {
  capability: CapabilityTier;
  tier: DeviceTier;
  reason: string;
} {
  if (typeof window === "undefined") {
    return { capability: "none", tier: "low", reason: "Server pre-render" };
  }

  const nav = navigator as NavigatorWithHints;

  if (nav.connection?.saveData) {
    return { capability: "none", tier: "low", reason: "Save-Data enabled" };
  }

  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) {
    return { capability: "none", tier: "low", reason: "Low memory (<=2 GB)" };
  }

  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2) {
    return { capability: "none", tier: "low", reason: "Constrained CPU cores" };
  }

  if (!hasWebGLSupport()) {
    return { capability: "none", tier: "low", reason: "Software / no WebGL" };
  }

  const isSmallScreen = window.innerWidth < 768;
  const limitedMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const limitedCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;

  if (isSmallScreen || limitedMemory || limitedCores) {
    return {
      capability: "basic",
      tier: "mid",
      reason: isSmallScreen ? "Mobile viewport" : "Mid-spec hardware",
    };
  }

  return { capability: "full", tier: "high", reason: "Hardware WebGL2 ready" };
}

/**
 * Signal 2 (Section 7.5): User motion preference (controls idle spin / scrub, NOT hiding 3D geometry).
 */
export function detectMotionPreference(): MotionPreference {
  if (typeof window === "undefined") return "reduced";
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full";
}

export function detectDeviceTier(): DeviceTier {
  return detectHardwareCapability().tier;
}

/**
 * Resolves the active runtime rendering tier from manual quality preference and hardware capability.
 */
export function resolveEffectiveTier(
  preference: QualityPreference,
  hardwareTier: DeviceTier,
  webglSupported: boolean
): DeviceTier {
  if (!webglSupported) return "low";
  if (preference === "2d") return "low";
  if (preference === "balanced") return "mid";
  if (preference === "high") return "high";
  return hardwareTier;
}

export function resolveQualityReason(
  preference: QualityPreference,
  hardwareReason: string,
  reducedMotion: boolean,
  contextLost: boolean
): string {
  if (contextLost) return "GPU context paused - click to reload";
  if (preference === "2d") return "Manual 2D plate mode";
  if (preference === "high") return "Manual High (AA + Shaders)";
  if (preference === "balanced") return "Balanced WebGL";
  return reducedMotion ? `${hardwareReason} · Reduced motion` : hardwareReason;
}

/**
 * Resolves the concurrent WebGL canvas slot cap per active rendering tier.
 * `high` allows 4 active slots so 3 sticky-stacked work cards + a preloading simulator coexist.
 */
export function resolveMaxWebGLSlots(tier: DeviceTier): number {
  if (tier === "high") return 4;
  if (tier === "mid") return 2;
  return 0;
}

/**
 * Prevent @react-three/fiber's default `debounce: { scroll: 50 }` from sharing
 * its timeout with `ResizeObserver` in `react-use-measure`, which otherwise keeps
 * `containerRect` at 0x0 during continuous slow wheel / middle-button scrolling.
 */
export const CANVAS_RESIZE_CONFIG = {
  scroll: false,
  debounce: 0,
} as const;

export interface ViewportFallbackPolicyInput {
  hasMounted: boolean;
  canRender3D: boolean;
  hasLoadingFallback: boolean;
  hasSlot: boolean;
  isPoolSaturated: boolean;
  slotWaitElapsed: boolean;
}

/**
 * Determines whether the rich 2D fallback should render in the ViewportCanvas underlay.
 * Vector-SVG scenes (no custom loadingFallback) stay rendered until WebGL paints frame 1.
 */
export function shouldShowViewport2DFallback({
  hasMounted,
  canRender3D,
  hasLoadingFallback,
  hasSlot,
  isPoolSaturated,
  slotWaitElapsed,
}: ViewportFallbackPolicyInput): boolean {
  if (!hasMounted) return false;
  if (!canRender3D) return true;
  if (!hasLoadingFallback) return true;
  return !hasSlot && isPoolSaturated && slotWaitElapsed;
}
