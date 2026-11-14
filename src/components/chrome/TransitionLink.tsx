"use client";

import { useEffect, type ComponentProps, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MOTION,
  completePendingViewTransition,
  normalizeRoutePath,
  prefersReducedMotion,
  runViewTransition,
} from "@/lib/motion";

type LinkProps = ComponentProps<typeof Link>;

function resolveHrefString(href: LinkProps["href"]): string | null {
  if (typeof href === "string") return href;
  if (href && typeof href === "object") {
    const pathname = href.pathname ?? "";
    const query =
      href.query && typeof href.query === "object"
        ? `?${new URLSearchParams(
            Object.entries(href.query).reduce<Record<string, string>>((acc, [k, v]) => {
              if (v !== undefined && v !== null) acc[k] = String(v);
              return acc;
            }, {})
          ).toString()}`
        : "";
    const hash = href.hash ? (href.hash.startsWith("#") ? href.hash : `#${href.hash}`) : "";
    return `${pathname}${query}${hash}`;
  }
  return null;
}

function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("//")
  );
}

/**
 * Progressive Next.js <Link> wrapper using document.startViewTransition synchronized on
 * route pathname commit (with a 500ms timeout fallback). Preserves same-page Lenis hash
 * scrolling, modified/external clicks, and prefers-reduced-motion.
 */
export function TransitionLink({
  href,
  onClick,
  target,
  download,
  ...rest
}: LinkProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    completePendingViewTransition();
  }, [pathname]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    if ((target && target !== "_self") || download !== undefined) {
      return;
    }

    const hrefStr = resolveHrefString(href);
    if (!hrefStr || isExternalHref(hrefStr)) {
      return;
    }

    // Same-page hash link: let LenisProvider smooth-scroll without ViewTransition
    if (hrefStr.startsWith("#")) {
      return;
    }

    const targetPath = normalizeRoutePath(hrefStr);
    const currentPath = normalizeRoutePath(pathname || "/");

    // Bypass ViewTransition when staying on the same route (whether hash or same-page click)
    if (targetPath === currentPath) {
      return;
    }

    if (
      typeof document === "undefined" ||
      typeof document.startViewTransition !== "function" ||
      prefersReducedMotion()
    ) {
      return;
    }

    event.preventDefault();
    void runViewTransition(
      () => {
        router.push(hrefStr);
      },
      {
        waitForCommit: true,
        timeoutMs: MOTION.viewTransitionTimeoutMs,
      }
    );
  };

  return (
    <Link
      href={href}
      target={target}
      download={download}
      onClick={handleClick}
      {...rest}
    />
  );
}
