"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FilePdf, List, TerminalWindow, X } from "@phosphor-icons/react";
import { nav, profile } from "@/data/site";
import { useBodyScrollLock } from "@/hooks/usePortfolioUtils";
import { QualityToggleHUD } from "@/components/canvas/QualityToggleHUD";
import { TransitionLink } from "@/components/chrome/TransitionLink";

const emptySubscribe = () => () => {};

const SECTION_TELEMETRY_CODES: Record<string, string> = {
  top: "00 HERO",
  work: "01 WORK",
  simulator: "02 SIM",
  about: "03 TRACK",
  expertise: "04 STACK",
  contact: "05 CONTACT",
  brief: "06 BRIEF",
};

function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const navWithUaData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platformHint =
    navWithUaData.userAgentData?.platform ?? navigator.userAgent ?? "";
  return /Mac|iPhone|iPad|iPod/i.test(platformHint);
}

export function Navbar() {
  const pathname = usePathname();
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const [scrolledSection, setScrolledSection] = useState<string>("top");
  const [isScrolled, setIsScrolled] = useState(false);
  const shortcutLabel = useSyncExternalStore(
    emptySubscribe,
    () => (isApplePlatform() ? "⌘K" : "Ctrl K"),
    () => "Ctrl K"
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const scrollPctRef = useRef<HTMLSpanElement>(null);
  const headerBarRef = useRef<HTMLDivElement>(null);
  const wasMobileOpenRef = useRef(false);

  const mobileOpen = openedPath === pathname;
  const activeSection = pathname.startsWith("/work")
    ? "work"
    : pathname === "/brief"
      ? "brief"
      : pathname !== "/"
        ? ""
        : scrolledSection;

  const telemetryCode =
    SECTION_TELEMETRY_CODES[activeSection] ??
    (pathname === "/uses" ? "07 USES" : "00 INDEX");

  useBodyScrollLock(mobileOpen);

  useEffect(() => {
    if (mobileOpen) {
      wasMobileOpenRef.current = true;
      const timer = window.setTimeout(() => {
        drawerRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
      }, 60);
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpenedPath(null);
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("keydown", onKeyDown);
      };
    }

    if (wasMobileOpenRef.current) {
      wasMobileOpenRef.current = false;
      menuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncScrollTelemetry = (ratioValue?: number) => {
      const ratio =
        typeof ratioValue === "number"
          ? ratioValue
          : Math.min(
              1,
              Math.max(
                0,
                window.scrollY /
                  Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
              )
            );
      const pct = String(Math.round(ratio * 100)).padStart(2, "0");
      if (scrollPctRef.current) {
        scrollPctRef.current.textContent = `${pct}%`;
      }
      if (headerBarRef.current) {
        headerBarRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
    };

    syncScrollTelemetry();

    const onScrollProgress = (event: Event) => {
      const ratio = (event as CustomEvent<{ ratio?: number }>).detail?.ratio;
      syncScrollTelemetry(ratio);
    };

    window.addEventListener("portfolio:scroll-progress", onScrollProgress);
    return () => {
      window.removeEventListener("portfolio:scroll-progress", onScrollProgress);
    };
  }, [pathname]);

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

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-6 w-px"
      />
      <header
        className={`site-navbar-shell fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "border-b border-[rgba(240,246,252,0.1)] bg-[#0D1117]/88 shadow-[0_14px_38px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            : "border-b border-[rgba(240,246,252,0.06)] bg-[#0D1117]/65 backdrop-blur-md"
        }`}
      >
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 xl:gap-6 xl:px-8"
        >
          {/* Left: Clean Editorial Wordmark + Live Scroll Telemetry Pill */}
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <TransitionLink
              href="/"
              className="inline-flex min-h-[44px] min-w-0 shrink-0 items-center whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:text-[#38BDF8] xl:tracking-[0.18em]"
            >
              {profile.name}
            </TransitionLink>

            <span
              aria-hidden="true"
              className="hidden items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2.5 py-0.5 font-mono text-xs tabular-nums text-[#8B949E] sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
              <span className="text-[#E6EDF3]">{telemetryCode}</span>
              <span className="text-[#8B949E]">·</span>
              <span ref={scrollPctRef} className="min-w-[3ch] text-right text-[#7DD3FC]">
                00%
              </span>
            </span>
          </div>

          {/* Center: Clean Architectural Hairline Links */}
          <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1.5">
            {nav.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <li key={item.href}>
                  <TransitionLink
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`group/nav relative inline-flex h-16 items-center gap-1.5 whitespace-nowrap px-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors xl:px-3 xl:tracking-[0.12em] ${
                      isActive
                        ? "font-semibold text-[#E6EDF3]"
                        : "text-[#8B949E] hover:text-[#E6EDF3]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#38BDF8] transition-all duration-300 xl:inset-x-3 ${
                        isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover/nav:scale-x-50 group-hover/nav:opacity-40"
                      }`}
                    />
                  </TransitionLink>
                </li>
              );
            })}
          </ul>

        {/* Right: Quiet Secondary Utilities (preserving Hero's singular primary CTA) */}
        <div
          className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-2.5"
          onClickCapture={(e) => {
            if (mobileOpen && !(e.target as HTMLElement).closest("[aria-controls='mobile-nav-drawer']")) {
              setOpenedPath(null);
            }
          }}
        >
          <QualityToggleHUD />

          <button
            type="button"
            onClick={() => {
              setOpenedPath(null);
              window.dispatchEvent(new CustomEvent("portfolio:close-quality-hud"));
              window.dispatchEvent(new CustomEvent("portfolio:open-palette"));
            }}
            aria-label="Open interactive query command palette (Cmd/Ctrl+K)"
            className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-lg border border-[rgba(240,246,252,0.12)] bg-[#161B22]/80 font-mono text-xs text-[#9DA7B3] transition-colors hover:border-[#38BDF8]/50 hover:text-[#E6EDF3] sm:h-auto sm:min-h-[44px] sm:w-auto sm:px-2.5 sm:py-2 sm:gap-2 xl:px-3 xl:gap-2.5"
          >
            <TerminalWindow className="h-4 w-4 text-[#38BDF8] sm:h-3.5 sm:w-3.5" weight="regular" aria-hidden="true" />
            <span className="hidden sm:inline">Query</span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-[rgba(240,246,252,0.12)] xl:inline-block" />
            <kbd className="hidden font-mono text-xs tracking-wider text-[#8B949E] xl:inline">
              {shortcutLabel}
            </kbd>
          </button>

          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-2 font-mono text-xs font-medium uppercase tracking-[0.1em] text-[#9DA7B3] transition-colors hover:bg-[#161B22]/80 hover:text-[#38BDF8] md:inline-flex xl:px-3 xl:tracking-[0.12em]"
          >
            <FilePdf className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            <span>Resume</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" weight="regular" aria-hidden="true" />
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => {
              if (!mobileOpen) {
                window.dispatchEvent(new CustomEvent("portfolio:close-quality-hud"));
              }
              setOpenedPath((prev) => (prev === pathname ? null : pathname));
            }}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] transition-colors hover:border-[#38BDF8]/60 lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" weight="regular" aria-hidden="true" />
            ) : (
              <List className="h-4 w-4" weight="regular" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Hairline scroll-synced header border gauge */}
      <div aria-hidden="true" className="pointer-events-none h-px w-full overflow-hidden">
        <div
          ref={headerBarRef}
          className="h-full w-full origin-left bg-gradient-to-r from-[#38BDF8]/75 to-[#7DD3FC]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Mobile Drawer with GPU grid-rows transition + native inert state */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        inert={!mobileOpen ? true : undefined}
        className={`mx-auto grid max-w-[1400px] bg-[#0D1117]/98 backdrop-blur-xl transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-editorial)] lg:hidden ${
          mobileOpen
            ? "grid-rows-[1fr] border-t border-[rgba(240,246,252,0.08)] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col gap-1 px-4 py-4 sm:px-8">
            {nav.map((item, idx) => {
              const isActive = activeSection === item.sectionId;
              return (
                <li
                  key={item.href}
                  style={{
                    transitionDelay: mobileOpen ? `${idx * 35}ms` : "0ms",
                  }}
                  className={`transition-[opacity,transform] duration-200 ${
                    mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                  }`}
                >
                  <TransitionLink
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
                  </TransitionLink>
                </li>
              );
            })}
            <li
              style={{
                transitionDelay: mobileOpen ? `${nav.length * 35}ms` : "0ms",
              }}
              className={`pt-2 transition-[opacity,transform] duration-200 ${
                mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
              }`}
            >
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
      </div>
    </header>
    </>
  );
}
