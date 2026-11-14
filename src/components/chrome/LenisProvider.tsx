"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { completePendingViewTransition, MOTION } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export const NAV_SCROLL_OFFSET = -84;

export type PortfolioScrollTarget = string | HTMLElement | number;

export interface PortfolioScrollAdapters {
  lenis: {
    start: () => void;
    scrollTo: (
      target: number | HTMLElement,
      options?: { offset?: number; duration?: number }
    ) => void;
  } | null;
  reduced: boolean;
  getElementById: (id: string) => HTMLElement | null;
  getElementTop: (el: HTMLElement) => number;
  scrollToWindow: (options: { top: number; behavior: ScrollBehavior }) => void;
}

export function executePortfolioScroll(
  target: PortfolioScrollTarget,
  adapters: PortfolioScrollAdapters
): boolean {
  if (typeof target === "number") {
    const safeTop = Math.max(0, target);
    if (adapters.lenis && !adapters.reduced) {
      adapters.lenis.start();
      adapters.lenis.scrollTo(safeTop, {
        duration: MOTION.durations.scroll,
      });
      return true;
    }

    adapters.scrollToWindow({
      top: safeTop,
      behavior: adapters.reduced ? "auto" : "smooth",
    });
    return true;
  }

  const el =
    typeof target === "string"
      ? adapters.getElementById(target.replace(/^#/, ""))
      : target;
  if (!el) return false;

  if (adapters.lenis && !adapters.reduced) {
    adapters.lenis.start();
    adapters.lenis.scrollTo(el, {
      offset: NAV_SCROLL_OFFSET,
      duration: MOTION.durations.scroll,
    });
    return true;
  }

  const top = adapters.getElementTop(el) + NAV_SCROLL_OFFSET;
  adapters.scrollToWindow({
    top: Math.max(0, top),
    behavior: adapters.reduced ? "auto" : "smooth",
  });
  return true;
}

declare global {
  interface Window {
    __portfolioScrollTo?: (target: PortfolioScrollTarget) => void;
  }
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const lenisRef = useRef<Lenis | null>(null);
  const reducedRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const reduced = motionQuery?.matches ?? false;
    reducedRef.current = reduced;

    const updateProgress = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const bar = progressBarRef.current;
      if (bar) {
        bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
      window.dispatchEvent(
        new CustomEvent("portfolio:scroll-progress", { detail: { ratio } })
      );
    };

    let lenis: Lenis | null = null;
    let tickFn: ((time: number) => void) | null = null;
    let unsubScroll: (() => void) | null = null;

    if (!reduced) {
      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
      });
      lenisRef.current = lenis;

      unsubScroll = lenis.on("scroll", () => {
        ScrollTrigger.update();
        updateProgress();
      });

      tickFn = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickFn);
      gsap.ticker.lagSmoothing(0);
    }

    const onScrollLock = (event: Event) => {
      const locked = Boolean((event as CustomEvent<{ locked?: boolean }>).detail?.locked);
      if (locked) {
        lenisRef.current?.stop();
      } else {
        lenisRef.current?.start();
      }
    };
    window.addEventListener("portfolio:scroll-lock", onScrollLock);

    const scrollToTarget = (target: PortfolioScrollTarget) => {
      executePortfolioScroll(target, {
        lenis: lenisRef.current,
        reduced: reducedRef.current,
        getElementById: (id) => document.getElementById(id),
        getElementTop: (el) => el.getBoundingClientRect().top + window.scrollY,
        scrollToWindow: (opts) => window.scrollTo(opts),
      });
    };

    window.__portfolioScrollTo = scrollToTarget;

    const onNativeScroll = () => {
      ScrollTrigger.update();
      updateProgress();
    };
    if (!lenis) {
      window.addEventListener("scroll", onNativeScroll, { passive: true });
    }

    const onHashClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const hashIdx = href.indexOf("#");
      if (hashIdx === -1) return;

      const pathPart = href.slice(0, hashIdx);
      const id = href.slice(hashIdx + 1);
      const currentPath = (pathnameRef.current || "/").replace(/\/+$/, "") || "/";
      const normalizedTarget = pathPart ? pathPart.replace(/\/+$/, "") || "/" : "";
      if (!id || (normalizedTarget && normalizedTarget !== currentPath)) {
        return;
      }

      const destination = document.getElementById(id);
      if (destination) {
        event.preventDefault();
        scrollToTarget(destination);
      }
    };

    document.addEventListener("click", onHashClick);

    let resizeTimer: number | null = null;
    const scheduleRefresh = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        lenisRef.current?.resize();
        ScrollTrigger.refresh();
      }, 120);
    };

    const mainEl = document.getElementById("main-content");
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && mainEl
        ? new ResizeObserver(() => {
            scheduleRefresh();
          })
        : null;
    if (resizeObserver && mainEl) {
      resizeObserver.observe(mainEl);
    }

    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        lenisRef.current?.resize();
        ScrollTrigger.refresh();
      }
    };
    window.addEventListener("resize", onResize, { passive: true });

    const refreshId = window.requestAnimationFrame(() => {
      lenisRef.current?.resize();
      ScrollTrigger.refresh();
      if (window.location.hash) {
        window.setTimeout(() => scrollToTarget(window.location.hash), 80);
      }
    });

    return () => {
      window.cancelAnimationFrame(refreshId);
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("portfolio:scroll-lock", onScrollLock);
      if (!lenis) {
        window.removeEventListener("scroll", onNativeScroll);
      }
      document.removeEventListener("click", onHashClick);
      window.removeEventListener("resize", onResize);
      if (tickFn) {
        gsap.ticker.remove(tickFn);
      }
      unsubScroll?.();
      lenis?.destroy();
      lenisRef.current = null;
      delete window.__portfolioScrollTo;
    };
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      completePendingViewTransition();
      lenisRef.current?.resize();
      ScrollTrigger.refresh();
      if (window.location.hash) {
        window.setTimeout(() => {
          window.__portfolioScrollTo?.(window.location.hash);
        }, 80);
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pathname]);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent"
      >
        <div
          ref={progressBarRef}
          className="h-full w-full origin-left bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      {children}
    </>
  );
}
