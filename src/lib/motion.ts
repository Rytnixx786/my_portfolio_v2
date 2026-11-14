export const MOTION = {
  easeEditorial: "cubic-bezier(0.32, 0.72, 0, 1)",
  gsapEase: "power3.out",
  gsapHeadingEase: "power4.out",
  gsapMetricEase: "power2.out",
  durations: {
    micro: 0.16,
    ui: 0.24,
    crossfade: 0.32,
    metric: 0.42,
    reveal: 0.65,
    kinetic: 0.72,
    kineticScroll: 0.78,
    scroll: 1.05,
  },
  stagger: {
    splitWords: 0.032,
    hero: 0.06,
    bentoGrid: 0.07,
    bentoCap: 0.28,
  },
  scrollTrigger: {
    revealStart: "top 92%",
    bentoStart: "top 88%",
    metricStart: "top 92%",
    scrub: 0.45,
  },
  damp: {
    camera: 4.5,
    hover: 8,
    focus: 8,
  },
  navScrollOffset: -84,
  viewTransitionTimeoutMs: 500,
  fontReadyTimeoutMs: 250,
} as const;

export interface MetricToken {
  text: string;
  isNumeric: boolean;
}

const NUMERIC_TOKEN_RE = /([0-9]+(?:\.[0-9]+)?)/g;

/**
 * Splits a metric string into alternating non-numeric literals and numeric digit runs
 * so ScrambleMetric animates only numbers without garbling labels like "(n=15)" or "tok/s".
 */
export function splitNumericMetricTokens(value: string): MetricToken[] {
  if (!value) return [];
  const tokens: MetricToken[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(NUMERIC_TOKEN_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ text: value.slice(lastIndex, idx), isNumeric: false });
    }
    tokens.push({ text: match[0], isNumeric: true });
    lastIndex = idx + match[0].length;
  }

  if (lastIndex < value.length) {
    tokens.push({ text: value.slice(lastIndex), isNumeric: false });
  }

  return tokens;
}

export function normalizeRoutePath(hrefOrPath: string): string {
  const hashIdx = hrefOrPath.indexOf("#");
  const pathAndQuery = hashIdx === -1 ? hrefOrPath : hrefOrPath.slice(0, hashIdx);
  return (pathAndQuery.split("?")[0] || "/").replace(/\/+$/, "") || "/";
}

export const MOTION_QUALITY_STORAGE_KEY = "portfolio-v2-3d-quality";

export interface PortfolioScrollState {
  scrollY: number;
  progress: number;
  velocity: number;
  direction: 1 | -1 | 0;
}

declare global {
  interface Window {
    __portfolioScroll?: PortfolioScrollState;
  }
}

export function getPortfolioScrollState(): PortfolioScrollState {
  if (typeof window === "undefined" || !window.__portfolioScroll) {
    return { scrollY: 0, progress: 0, velocity: 0, direction: 0 };
  }
  return window.__portfolioScroll;
}

export function setPortfolioScrollState(next: PortfolioScrollState): void {
  if (typeof window === "undefined") return;
  window.__portfolioScroll = next;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

/**
 * Application-level reduced-motion gate controlled by the HUD "2D SAFE" preference
 * (`data-motion="reduced"`) rather than being silently disabled by OS desktop settings.
 */
export function shouldReduceAppMotion(): boolean {
  if (typeof document !== "undefined") {
    const mode = document.documentElement?.dataset?.motion;
    if (mode === "reduced") return true;
    if (mode === "full") return false;
  }
  if (typeof window === "undefined") return false;
  try {
    const saved =
      window.localStorage?.getItem(MOTION_QUALITY_STORAGE_KEY) ??
      window.sessionStorage?.getItem(MOTION_QUALITY_STORAGE_KEY);
    if (saved === "2d") return true;
  } catch {
    // Ignore storage access errors
  }
  return false;
}

interface PendingViewTransition {
  resolve: () => void;
  timer: ReturnType<typeof setTimeout> | null;
}

let pendingViewTransition: PendingViewTransition | null = null;

/**
 * Resolves any active ViewTransition commit promise once Next.js finishes rendering the new route.
 * Safe to call repeatedly (idempotent).
 */
export function completePendingViewTransition(): void {
  if (!pendingViewTransition) return;
  const active = pendingViewTransition;
  pendingViewTransition = null;
  if (active.timer !== null) {
    clearTimeout(active.timer);
  }
  active.resolve();
}

export interface RunViewTransitionOptions {
  /**
   * When true, holds the ViewTransition update promise until completePendingViewTransition()
   * runs on route commit (or timeoutMs elapses), keeping Next.js App Router snapshots in sync.
   */
  waitForCommit?: boolean;
  timeoutMs?: number;
}

/**
 * Progressively enhances navigation or state updates with the browser View Transitions API,
 * falling back directly to navigate() when unsupported or when prefers-reduced-motion is active.
 */
export async function runViewTransition(
  navigate: () => void | Promise<void>,
  options?: RunViewTransitionOptions
): Promise<void> {
  if (
    typeof document === "undefined" ||
    shouldReduceAppMotion() ||
    typeof document.startViewTransition !== "function"
  ) {
    await navigate();
    return;
  }

  const waitForCommit = options?.waitForCommit ?? false;
  const timeoutMs = options?.timeoutMs ?? MOTION.viewTransitionTimeoutMs;

  if (!waitForCommit) {
    let navigated = false;
    try {
      const transition = document.startViewTransition(() => {
        navigated = true;
        return navigate();
      });
      await transition?.finished;
    } catch {
      if (!navigated) {
        await navigate();
      }
    }
    return;
  }

  completePendingViewTransition();

  let navigated = false;
  try {
    const transition = document.startViewTransition(
      () =>
        new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            completePendingViewTransition();
          }, timeoutMs);

          pendingViewTransition = { resolve, timer };
          navigated = true;
          try {
            void Promise.resolve(navigate()).catch((err) => {
              completePendingViewTransition();
              reject(err);
            });
          } catch (err) {
            completePendingViewTransition();
            reject(err);
          }
        })
    );

    await transition?.finished;
  } catch {
    completePendingViewTransition();
    if (!navigated) {
      await navigate();
    }
  }
}
