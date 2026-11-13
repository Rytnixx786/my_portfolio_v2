"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FilePdf, List, TerminalWindow, X } from "@phosphor-icons/react";
import { nav, profile } from "@/data/site";
import { useBodyScrollLock } from "@/hooks/usePortfolioUtils";

export function Navbar() {
  const pathname = usePathname();
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const [scrolledSection, setScrolledSection] = useState<string>("top");

  const mobileOpen = openedPath === pathname;
  const activeSection = pathname.startsWith("/work")
    ? "work"
    : pathname === "/brief"
      ? "brief"
      : pathname !== "/"
        ? ""
        : scrolledSection;

  useBodyScrollLock(mobileOpen);

  useEffect(() => {
    if (pathname !== "/") return;

    const sectionIds = ["work", "simulator", "about", "expertise", "contact"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const heroEl = document.getElementById("hero");

    const visibleHeights = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const rawId = entry.target.id;
          const id = !rawId || rawId === "hero" ? "top" : rawId;
          if (entry.isIntersecting) {
            visibleHeights.set(id, entry.intersectionRect.height);
          } else {
            visibleHeights.delete(id);
          }
        }

        if (visibleHeights.size === 0) return;

        let bestId = "top";
        let bestHeight = -1;
        for (const [id, height] of visibleHeights.entries()) {
          if (height > bestHeight) {
            bestHeight = height;
            bestId = id;
          }
        }
        setScrolledSection(bestId);
      },
      {
        rootMargin: "-18% 0px -48% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    if (heroEl) observer.observe(heroEl);
    for (const section of sections) observer.observe(section);

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-3.5 sm:px-8 sm:pt-4">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22]/90 px-4 shadow-xl backdrop-blur-xl sm:px-5"
      >
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:text-[#38BDF8]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/12 text-[#38BDF8]">
            {profile.initials}
          </span>
          <span className="hidden sm:inline">{profile.name}</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const isActive = activeSection === item.sectionId;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? "bg-[#38BDF8]/15 font-semibold text-[#7DD3FC]"
                      : "text-[#9DA7B3] hover:text-[#E6EDF3]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("portfolio:open-palette"))}
            aria-label="Open interactive query command palette (Cmd/Ctrl+K)"
            className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] px-3 py-1.5 font-mono text-xs text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
          >
            <TerminalWindow className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            <span className="hidden sm:inline">Query</span>
            <kbd className="rounded bg-[#1C222B] px-1.5 py-0.5 text-xs text-[#E6EDF3]">
              Ctrl K
            </kbd>
          </button>

          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-[36px] items-center gap-1.5 rounded-full bg-[#38BDF8] px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#0D1117] transition-colors hover:bg-[#7DD3FC] md:inline-flex"
          >
            <FilePdf className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
            <span>Resume</span>
            <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => setOpenedPath((prev) => (prev === pathname ? null : pathname))}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] text-[#E6EDF3] lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" weight="regular" aria-hidden="true" />
            ) : (
              <List className="h-4 w-4" weight="regular" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer with native inert state */}
      <div
        id="mobile-nav-drawer"
        inert={!mobileOpen ? true : undefined}
        className={`mx-auto mt-2 max-w-[1400px] overflow-hidden rounded-3xl border border-[rgba(240,246,252,0.12)] bg-[#161B22]/98 shadow-2xl backdrop-blur-xl transition-all duration-300 lg:hidden ${
          mobileOpen ? "max-h-[420px] p-4 opacity-100" : "pointer-events-none max-h-0 p-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const isActive = activeSection === item.sectionId;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpenedPath(null)}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] ${
                    isActive
                      ? "bg-[#38BDF8]/15 font-semibold text-[#7DD3FC]"
                      : "text-[#9DA7B3] hover:bg-[#1C222B] hover:text-[#E6EDF3]"
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
