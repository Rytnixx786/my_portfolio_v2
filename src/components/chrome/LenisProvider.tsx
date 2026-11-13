"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export const NAV_SCROLL_OFFSET = -84;

declare global {
  interface Window {
    __portfolioLenis?: Lenis;
    __portfolioScrollTo?: (target: string | HTMLElement) => void;
  }
}

/**
 * Coordinates crisp Lenis wheel scrolling with GSAP ScrollTrigger ticks,
 * leaving touch scroll native (syncTouch: false) and avoiding CSS scroll-behavior conflicts.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const scrollToTarget = (
      target: string | HTMLElement,
      lenis?: Lenis
    ) => {
      const el =
        typeof target === "string"
          ? document.getElementById(target.replace(/^#/, ""))
          : target;
      if (!el) return;

      if (lenis && !reduced) {
        lenis.start();
        lenis.scrollTo(el, { offset: NAV_SCROLL_OFFSET, force: true });
      } else {
        const top =
          el.getBoundingClientRect().top + window.scrollY + NAV_SCROLL_OFFSET;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: "auto",
        });
      }
    };

    if (reduced) {
      window.__portfolioScrollTo = (target) => scrollToTarget(target);
      const refreshId = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        if (window.location.hash) {
          scrollToTarget(window.location.hash);
        }
      });
      return () => {
        window.cancelAnimationFrame(refreshId);
        delete window.__portfolioScrollTo;
      };
    }

    const lenis = new Lenis({
      lerp: 0.14,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
    });

    window.__portfolioLenis = lenis;
    window.__portfolioScrollTo = (target) => scrollToTarget(target, lenis);
    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

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
      if (!id || (pathPart && pathPart !== "/" && pathPart !== pathname)) {
        return;
      }

      const destination = document.getElementById(id);
      if (destination) {
        event.preventDefault();
        scrollToTarget(destination, lenis);
      }
    };

    document.addEventListener("click", onHashClick);

    const refreshId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (window.location.hash) {
        window.setTimeout(() => scrollToTarget(window.location.hash, lenis), 60);
      }
    });

    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        ScrollTrigger.refresh();
      }
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.cancelAnimationFrame(refreshId);
      document.removeEventListener("click", onHashClick);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      if (window.__portfolioLenis === lenis) {
        delete window.__portfolioLenis;
      }
      delete window.__portfolioScrollTo;
    };
  }, [pathname]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pathname]);

  return <>{children}</>;
}
