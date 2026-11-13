export type DeviceTier = "high" | "mid" | "low";
export type QualityPreference = "auto" | "high" | "balanced" | "2d";

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

/**
 * Checks whether hardware-accelerated WebGL is available in this browser session.
 */
export function hasWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "");
      if (/SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(renderer)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Classifies client hardware and user motion preferences into a rendering tier
 * so heavy WebGL scenes never overwhelm constrained devices or reduced-motion setups.
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "low";

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return "low";
  }

  const nav = navigator as NavigatorWithHints;

  if (nav.connection?.saveData) {
    return "low";
  }

  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) {
    return "low";
  }

  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2) {
    return "low";
  }

  if (!hasWebGLSupport()) {
    return "low";
  }

  const isSmallScreen = window.innerWidth < 768;
  const limitedMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const limitedCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;

  if (isSmallScreen || limitedMemory || limitedCores) {
    return "mid";
  }

  return "high";
}

/**
 * Resolves the active runtime rendering tier from manual quality preference and hardware hints.
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
