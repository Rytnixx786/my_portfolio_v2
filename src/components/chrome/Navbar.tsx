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
  const [isScrolled, setIsScrolled] = useState(false);

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
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 24);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "border-b border-[rgba(240,246,252,0.1)] bg-[#0D1117]/88 shadow-[0_14px_38px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          : "border-b border-[rgba(240,246,252,0.06)] bg-[#0D1117]/65 backdrop-blur-md"
      }`}
    >
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-8"
      >
        {/* Left: Machined Monogram + Identity (visible across all viewports) */}
        <Link
          href="/"
          className="group inline-flex min-w-0 shrink-0 items-center gap-2.5 whitespace-nowrap transition-colors sm:gap-3"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(240,246,252,0.16)] bg-[#161B22] font-mono text-xs font-semibold tracking-wider text-[#E6EDF3] shadow-[inset_0_1px_0_rgba(240,246,252,0.08)] transition-colors group-hover:border-[#38BDF8]/60 group-hover:text-[#38BDF8]">
            {profile.initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#E6EDF3] transition-colors group-hover:text-[#38BDF8] sm:text-xs sm:tracking-[0.16em]">
              {profile.name}
            </span>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E] sm:inline-flex">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                aria-hidden="true"
              />
              <span>AI Systems · Dhaka</span>
            </span>
          </span>
        </Link>

        {/* Center: Clean Architectural Hairline Links with subtle index cues */}
        <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1.5">
          {nav.map((item, idx) => {
            const isActive = activeSection === item.sectionId;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group/nav relative inline-flex h-16 items-center gap-1.5 whitespace-nowrap px-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors xl:px-3 ${
                    isActive
                      ? "font-semibold text-[#E6EDF3]"
                      : "text-[#8B949E] hover:text-[#E6EDF3]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`hidden text-[9px] tabular-nums transition-colors xl:inline ${
                      isActive ? "text-[#38BDF8]" : "text-[#6E7681] group-hover/nav:text-[#9DA7B3]"
                    }`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-[#38BDF8] transition-all duration-300 xl:inset-x-3 ${
                      isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover/nav:scale-x-50 group-hover/nav:opacity-40"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right: Quiet Secondary Utilities (preserving Hero's singular primary CTA) */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("portfolio:open-palette"))}
            aria-label="Open interactive query command palette (Cmd/Ctrl+K)"
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[rgba(240,246,252,0.12)] bg-[#161B22]/80 px-2.5 py-1.5 font-mono text-[11px] text-[#9DA7B3] transition-colors hover:border-[#38BDF8]/50 hover:text-[#E6EDF3] sm:gap-2.5 sm:px-3"
          >
            <TerminalWindow className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            <span className="hidden sm:inline">Query</span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-[rgba(240,246,252,0.12)] sm:inline-block" />
            <kbd className="font-mono text-[10px] tracking-wider text-[#8B949E]">
              Ctrl K
            </kbd>
          </button>

          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#9DA7B3] transition-colors hover:bg-[#161B22]/80 hover:text-[#38BDF8] md:inline-flex"
          >
            <FilePdf className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            <span>Resume</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" weight="regular" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => setOpenedPath((prev) => (prev === pathname ? null : pathname))}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] transition-colors hover:border-[#38BDF8]/60 lg:hidden"
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
        className={`mx-auto max-w-[1400px] overflow-hidden border-t border-[rgba(240,246,252,0.08)] bg-[#0D1117]/98 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          mobileOpen ? "max-h-[460px] px-4 py-4 opacity-100 sm:px-8" : "pointer-events-none max-h-0 px-4 py-0 opacity-0 sm:px-8"
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
                  className={`flex min-h-[44px] items-center justify-between rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                    isActive
                      ? "border border-[#38BDF8]/30 bg-[#38BDF8]/10 font-semibold text-[#7DD3FC]"
                      : "text-[#9DA7B3] hover:bg-[#161B22] hover:text-[#E6EDF3]"
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
          <li className="pt-2">
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpenedPath(null)}
              className="flex min-h-[44px] items-center justify-between rounded-xl border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3]"
            >
              <span className="inline-flex items-center gap-2">
                <FilePdf className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span>Resume PDF</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
