"use client";

import { useEffect, useRef, useState } from "react";

interface CaseStudySectionNavItem {
  readonly href: string;
  readonly label: string;
}

export function CaseStudySectionNav({
  items,
}: {
  items: ReadonlyArray<CaseStudySectionNavItem>;
}) {
  const [activeHref, setActiveHref] = useState<string>(items[0]?.href ?? "");
  const activeHrefRef = useRef(activeHref);

  useEffect(() => {
    activeHrefRef.current = activeHref;
  }, [activeHref]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || items.length === 0) {
      return;
    }

    const targets = items
      .map((item) => {
        const id = item.href.replace(/^#/, "");
        return { href: item.href, el: document.getElementById(id) };
      })
      .filter((entry): entry is { href: string; el: HTMLElement } => entry.el !== null);

    if (targets.length === 0) return;

    const visibleRatios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const href = `#${entry.target.id}`;
          if (entry.isIntersecting) {
            visibleRatios.set(href, entry.intersectionRect.height);
          } else {
            visibleRatios.delete(href);
          }
        }

        if (visibleRatios.size === 0) return;

        let bestHref = activeHrefRef.current;
        let bestHeight = -1;
        for (const [href, height] of visibleRatios.entries()) {
          if (height > bestHeight) {
            bestHeight = height;
            bestHref = href;
          }
        }
        if (bestHref) {
          setActiveHref(bestHref);
        }
      },
      {
        rootMargin: "-20% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const target of targets) {
      observer.observe(target.el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Case study sections"
      className="sticky top-[72px] z-20 mt-6 flex flex-wrap gap-2 rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117]/95 p-2 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.85)]"
    >
      {items.map((item) => {
        const isActive = activeHref === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "location" : undefined}
            onClick={() => setActiveHref(item.href)}
            className={`inline-flex min-h-[44px] items-center rounded-full border px-3.5 py-2 font-mono text-xs transition-colors ${
              isActive
                ? "border-[#38BDF8]/50 bg-[#38BDF8]/12 font-semibold text-[#7DD3FC]"
                : "border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#9DA7B3] hover:border-[#38BDF8] hover:text-[#E6EDF3]"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
