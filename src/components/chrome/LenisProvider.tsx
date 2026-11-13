"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export const NAV_SCROLL_OFFSET = -84;

declare global {
  interface Window {
    __portfolioScrollTo?: (target: string | HTMLElement) => void;
  }
}

/**
 * Native compositor scrolling paired with GSAP ScrollTrigger updates and smooth anchor navigation.
 * Avoids wheel hijacking so Drei <View.Port /> scissor regions stay locked 1:1 with scroll frames.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const scrollToTarget = (target: string | HTMLElement) => {
      const el =
        typeof target === "string"
          ? document.getElementById(target.replace(/^#/, ""))
          : target;
      if (!el) return;

      const top =
        el.getBoundingClientRect().top + window.scrollY + NAV_SCROLL_OFFSET;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: reduced ? "auto" : "smooth",
      });
    };

    window.__portfolioScrollTo = scrollToTarget;

    const onScroll = () => {
      ScrollTrigger.update();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

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
        scrollToTarget(destination);
      }
    };

    document.addEventListener("click", onHashClick);

    const refreshId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (window.location.hash) {
        window.setTimeout(() => scrollToTarget(window.location.hash), 60);
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
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onHashClick);
      window.removeEventListener("resize", onResize);
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
