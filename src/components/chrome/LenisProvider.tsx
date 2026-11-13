"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

declare global {
  interface Window {
    __portfolioLenis?: Lenis;
  }
}

/**
 * Coordinates Lenis inertial smooth scrolling with GSAP ScrollTrigger ticks
 * while gracefully falling back to native scroll under prefers-reduced-motion.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (reduced) {
      const refreshId = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
      return () => {
        window.cancelAnimationFrame(refreshId);
      };
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    window.__portfolioLenis = lenis;
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
        lenis.scrollTo(destination, { offset: -76 });
      }
    };

    document.addEventListener("click", onHashClick);

    const refreshId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    const onResize = () => {
      ScrollTrigger.refresh();
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
