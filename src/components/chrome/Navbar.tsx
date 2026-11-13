"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FilePdf, TerminalWindow } from "@phosphor-icons/react";
import { nav, profile } from "@/data/site";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("top");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/work")) {
      setActiveSection("work");
      return;
    }
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionIds = ["work", "simulator", "about", "expertise", "contact"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const heroEl =
      document.getElementById("hero") ??
      document.querySelector<HTMLElement>("main > section:first-child, main > div:first-child");

    if (sections.length === 0 && !heroEl) {
      setActiveSection("top");
      return;
    }

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
        setActiveSection(bestId);
      },
      {
        rootMargin: "-18% 0px -48% 0px",
        threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1],
      }
    );

    if (heroEl && !sectionIds.includes(heroEl.id)) {
      observer.observe(heroEl);
    }
    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__portfolioLenis?.stop();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.__portfolioLenis?.start();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const handleLinkClick = (sectionId: string) => {
    setMobileOpen(false);
    if (pathname === "/") {
      setActiveSection(sectionId);
    }
  };

  const openCommandPalette = () => {
    setMobileOpen(false);
    window.dispatchEvent(new CustomEvent("portfolio:open-palette"));
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
          {/* Brand Monogram */}
          <Link
            href="/"
            onClick={() => handleLinkClick("top")}
            className="group inline-flex items-center gap-3 text-[#E6EDF3] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#38BDF8]"
            aria-label={`${profile.name} home`}
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(240,246,252,0.12)] bg-[#161B22] font-display text-base font-semibold tracking-tight text-[#E6EDF3] shadow-[inset_0_1px_0_rgba(240,246,252,0.08)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-[#38BDF8]/45 group-hover:bg-[#38BDF8]/12 group-hover:text-[#7DD3FC]">
              {profile.initials}
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#0D1117] bg-[#38BDF8]"
                aria-hidden="true"
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold uppercase tracking-tight text-[#E6EDF3]">
                {profile.name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8B949E]">
                Deep Compute Systems
              </span>
            </span>
          </Link>

          {/* Desktop Center Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 p-1 shadow-[inset_0_1px_0_rgba(240,246,252,0.05)] md:flex"
          >
            {nav.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleLinkClick(item.sectionId)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.04em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isActive
                      ? "bg-[#38BDF8]/15 text-[#7DD3FC]"
                      : "text-[#8B949E] hover:bg-[#1C222B] hover:text-[#E6EDF3]"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {isActive && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]"
                        aria-hidden="true"
                      />
                    )}
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open systems command palette"
              className="hidden items-center gap-2 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3 py-1.5 font-mono text-[11px] text-[#8B949E] transition-colors hover:border-[#38BDF8]/45 hover:text-[#E6EDF3] sm:inline-flex"
            >
              <TerminalWindow className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
              <span className="hidden lg:inline">Ask</span>
              <kbd className="rounded border border-[rgba(240,246,252,0.12)] bg-[#0D1117] px-1.5 py-0.5 text-[10px] text-[#6E7681]">
                ⌘K
              </kbd>
            </button>

            <a
              href={profile.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B949E] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/40 hover:text-[#E6EDF3] active:scale-[0.98] lg:inline-flex"
            >
              <FilePdf className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
              <span>CV</span>
            </a>

            <Link
              href="/#contact"
              onClick={() => handleLinkClick("contact")}
              className="group hidden items-center gap-2.5 rounded-full bg-[#38BDF8] py-1.5 pl-4 pr-1.5 text-xs font-semibold tracking-[0.03em] text-[#0D1117] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#7DD3FC] active:scale-[0.98] sm:inline-flex"
            >
              <span>Let&apos;s Talk</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0D1117]/15 text-[#0D1117] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
              </span>
            </Link>

            {/* Mobile Hamburger Morph */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#E6EDF3] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/50 hover:bg-[#1C222B] active:scale-[0.96] md:hidden"
            >
              <span className="relative flex h-3.5 w-4 flex-col items-center justify-center">
                <span
                  className={`absolute h-[1.5px] w-4 rounded-full bg-[#E6EDF3] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    mobileOpen ? "translate-y-0 rotate-45" : "-translate-y-[3.5px] rotate-0"
                  }`}
                />
                <span
                  className={`absolute h-[1.5px] w-4 rounded-full bg-[#E6EDF3] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    mobileOpen ? "translate-y-0 -rotate-45" : "translate-y-[3.5px] rotate-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Editorial Overlay */}
      <div
        id="mobile-nav-drawer"
        aria-hidden={!mobileOpen}
        className={`fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col justify-between bg-[#0D1117]/95 px-5 py-8 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6E7681]">
            Navigation
          </p>
          {nav.map((item, idx) => {
            const isActive = activeSection === item.sectionId;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleLinkClick(item.sectionId)}
                tabIndex={mobileOpen ? 0 : -1}
                style={{
                  transitionDelay: mobileOpen ? `${idx * 55}ms` : "0ms",
                }}
                className={`flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] py-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  mobileOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#6E7681]">0{idx + 1}</span>
                  <span
                    className={`font-display text-3xl uppercase tracking-tight ${
                      isActive ? "text-[#38BDF8]" : "text-[#E6EDF3]"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
                <ArrowUpRight
                  className={`h-5 w-5 ${isActive ? "text-[#38BDF8]" : "text-[#8B949E]"}`}
                  weight="light"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            transitionDelay: mobileOpen ? `${nav.length * 55}ms` : "0ms",
          }}
          className={`flex flex-col gap-3 border-t border-[rgba(240,246,252,0.08)] pt-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mobileOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={openCommandPalette}
            tabIndex={mobileOpen ? 0 : -1}
            className="inline-flex w-full items-center justify-between rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3]"
          >
            <span>Open Ask Console</span>
            <TerminalWindow className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
          </button>

          <Link
            href="/#contact"
            onClick={() => handleLinkClick("contact")}
            tabIndex={mobileOpen ? 0 : -1}
            className="group inline-flex w-full items-center justify-between rounded-full bg-[#38BDF8] py-2 pl-5 pr-2 text-sm font-semibold text-[#0D1117] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#7DD3FC] active:scale-[0.98]"
          >
            <span>Let&apos;s Talk</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15">
              <ArrowUpRight className="h-4 w-4" weight="light" aria-hidden="true" />
            </span>
          </Link>

          <div className="flex items-center justify-between pt-2 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={mobileOpen ? 0 : -1}
              className="inline-flex items-center gap-1.5 hover:text-[#38BDF8]"
            >
              <FilePdf className="h-4 w-4 text-[#38BDF8]" weight="light" aria-hidden="true" />
              <span>Résumé PDF</span>
            </a>
            <span>{profile.utc}</span>
          </div>
        </div>
      </div>
    </>
  );
}
