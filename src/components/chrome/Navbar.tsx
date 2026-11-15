"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FilePdf, TerminalWindow } from "@phosphor-icons/react";
import { nav, profile } from "@/data/site";
import { useBodyScrollLock } from "@/hooks/usePortfolioUtils";
import { QualityToggleHUD } from "@/components/canvas/QualityToggleHUD";
import { subscribeScrollRatio } from "@/components/chrome/LenisProvider";
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
    let lastPct = -1;
    let lastRatioStr = "";

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
      const nextRatioStr = ratio.toFixed(4);
      if (nextRatioStr !== lastRatioStr && headerBarRef.current) {
        lastRatioStr = nextRatioStr;
        headerBarRef.current.style.transform = `scaleX(${nextRatioStr})`;
      }
      const nextPct = Math.round(ratio * 100);
      if (nextPct !== lastPct) {
        lastPct = nextPct;
        if (scrollPctRef.current) {
          scrollPctRef.current.textContent = `${String(nextPct).padStart(2, "0")}%`;
        }
      }
    };

    syncScrollTelemetry();

    const unsubRatio = subscribeScrollRatio((ratio) => {
      syncScrollTelemetry(ratio);
    });

    const onScrollProgress = (event: Event) => {
      const ratio = (event as CustomEvent<{ ratio?: number }>).detail?.ratio;
      syncScrollTelemetry(ratio);
    };

    window.addEventListener("portfolio:scroll-progress", onScrollProgress);
    return () => {
      unsubRatio();
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
        className={`site-navbar-shell fixed inset-x-0 top-0 z-40 mx-auto transition-[max-width,margin-top,border-radius,border-color,background-color,box-shadow] duration-500 ease-[var(--ease-editorial)] ${
          isScrolled && !mobileOpen
            ? "mt-3 max-w-[min(1300px,calc(100vw-1.5rem))] rounded-full border border-[rgba(240,246,252,0.14)] bg-[#0D1117]/88 shadow-[var(--shadow-deep)] backdrop-blur-xl"
            : "mt-0 max-w-full rounded-none border-b border-[rgba(240,246,252,0.06)] bg-[#0D1117]/75 backdrop-blur-md"
        }`}
      >
        <nav
          aria-label="Primary navigation"
          className={`mx-auto flex items-center justify-between gap-1.5 transition-[height,padding] duration-500 ease-[var(--ease-editorial)] ${
            isScrolled && !mobileOpen
              ? "h-14 max-w-full px-3 sm:gap-2.5 sm:px-5 xl:px-6"
              : "h-16 max-w-[1400px] px-3 sm:gap-3 sm:px-6 xl:gap-6 xl:px-8"
          }`}
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
              className={`hidden items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-2.5 py-0.5 font-mono text-xs tabular-nums text-[#8B949E] ${
                isScrolled && !mobileOpen ? "sm:inline-flex lg:hidden xl:inline-flex" : "sm:inline-flex"
              }`}
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
                    className={`group/nav relative inline-flex items-center gap-1.5 whitespace-nowrap px-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors xl:px-3 xl:tracking-[0.12em] ${
                      isScrolled && !mobileOpen ? "h-14" : "h-16"
                    } ${
                      isActive
                        ? "font-semibold text-[#E6EDF3]"
                        : "text-[#8B949E] hover:text-[#E6EDF3]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#38BDF8] transition-[transform,opacity] duration-300 ease-[var(--ease-editorial)] xl:inset-x-3 ${
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
            <span
              aria-hidden="true"
              className={`hidden h-3 w-px bg-[rgba(240,246,252,0.12)] ${
                isScrolled && !mobileOpen ? "" : "xl:inline-block"
              }`}
            />
            <kbd
              className={`hidden font-mono text-xs tracking-wider text-[#8B949E] ${
                isScrolled && !mobileOpen ? "" : "xl:inline"
              }`}
            >
              {shortcutLabel}
            </kbd>
          </button>

          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="OPEN ↗"
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] transition-colors hover:border-[#38BDF8]/60 active:scale-[0.96] lg:hidden"
          >
            <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
              <span
                className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-300 ease-[var(--ease-editorial)] ${
                  mobileOpen ? "translate-y-0 rotate-45" : "-translate-y-[3.5px] rotate-0"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-300 ease-[var(--ease-editorial)] ${
                  mobileOpen ? "translate-y-0 -rotate-45" : "translate-y-[3.5px] rotate-0"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Hairline scroll-synced header border gauge */}
      <div
        aria-hidden="true"
        className={`pointer-events-none h-px overflow-hidden transition-[margin] duration-500 ease-[var(--ease-editorial)] ${
          isScrolled && !mobileOpen ? "mx-7 sm:mx-8" : "w-full"
        }`}
      >
        <div
          ref={headerBarRef}
          className="h-full w-full origin-left bg-gradient-to-r from-[#38BDF8]/75 to-[#7DD3FC]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </header>

      {/* Full-Screen Atmospheric Mobile Navigation Overlay (outside header so blur & rounded pill never trap fixed inset-0) */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        inert={!mobileOpen ? true : undefined}
        className={`fixed inset-0 z-30 flex flex-col justify-between overflow-y-auto bg-[#0D1117]/95 px-6 pt-24 pb-8 backdrop-blur-2xl transition-opacity duration-400 ease-[var(--ease-editorial)] lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-2">
          {nav.map((item, idx) => {
            const isActive = activeSection === item.sectionId;
            return (
              <li
                key={item.href}
                style={{
                  transitionDelay: mobileOpen ? `${idx * 28}ms` : "0ms",
                }}
                className={`transition-[opacity,transform] duration-300 ease-[var(--ease-editorial)] ${
                  mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <TransitionLink
                  href={item.href}
                  onClick={() => setOpenedPath(null)}
                  className={`flex min-h-[56px] items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${
                    isActive
                      ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#7DD3FC]"
                      : "border-[rgba(240,246,252,0.08)] bg-[#161B22]/75 text-[#E6EDF3] hover:border-[#38BDF8]/30"
                  }`}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-[#38BDF8] tabular-nums">
                      0{idx + 1}
                    </span>
                    <span className="font-display text-3xl font-bold uppercase tracking-tight">
                      {item.label}
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                </TransitionLink>
              </li>
            );
          })}
        </ul>

        <div
          style={{
            transitionDelay: mobileOpen ? `${nav.length * 50}ms` : "0ms",
          }}
          className={`mt-8 flex flex-col gap-4 border-t border-[rgba(240,246,252,0.08)] pt-6 transition-[opacity,transform] duration-500 ease-[var(--ease-editorial)] ${
            mobileOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpenedPath(null)}
            className="flex min-h-[48px] items-center justify-between rounded-xl border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3]"
          >
            <span className="inline-flex items-center gap-2">
              <FilePdf className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
              <span>Resume PDF</span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
          </a>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs text-[#8B949E]">
            <span>{profile.location}</span>
            <span className="text-[#10B981]">{profile.status}</span>
          </div>
        </div>
      </div>
    </>
  );
}
