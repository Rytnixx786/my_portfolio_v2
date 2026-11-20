"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, FunnelSimple } from "@phosphor-icons/react";
import {
  PROJECT_CATEGORIES,
  projects,
  type ProjectCategory,
} from "@/data/projects";
import { getCategoryHue } from "@/lib/palette";
import { createAppMatchMedia, MOTION, shouldReduceAppMotion } from "@/lib/motion";
import {
  handleSpotlightEnter,
  handleSpotlightLeave,
  handleSpotlightMove,
} from "@/hooks/usePortfolioUtils";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";
import { useSlidingIndicator } from "@/components/motion/useSlidingIndicator";
import { ProjectPreviewPlate } from "./ProjectPreviewPlate";
import { attachBidirectionalScrollEnvelope, SectionReveal } from "./SectionReveal";
import {
  KineticHeading,
  ScrambleMetric,
  ScrollScrubText,
} from "@/components/motion/KineticText";

gsap.registerPlugin(ScrollTrigger, Flip, useGSAP);

type FilterValue = "All" | ProjectCategory;

const FILTER_OPTIONS: ReadonlyArray<{ label: string; value: FilterValue }> = [
  { label: "All Systems", value: "All" },
  ...PROJECT_CATEGORIES.map((category) => ({
    label: category,
    value: category,
  })),
];

export function SelectedWorkSection() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [showAllSystems, setShowAllSystems] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const hasInteractedRef = useRef(false);
  const prevFilterKeyRef = useRef(`${activeFilter}:${showAllSystems}`);
  const appReduced = useAppReducedMotion();

  const {
    containerRef: filterRailRef,
    registerItem: registerFilterItem,
    rect: filterPillRect,
    ready: filterPillReady,
  } = useSlidingIndicator<FilterValue>(activeFilter);

  const activeFilterHue =
    activeFilter === "All" ? null : getCategoryHue(activeFilter);

  const isStackMode = activeFilter === "All" && !showAllSystems;

  const captureGridFlip = () => {
    const grid = gridRef.current;
    if (!grid) return;
    if (shouldReduceAppMotion()) {
      flipStateRef.current = null;
      return;
    }
    const items = grid.querySelectorAll("[data-bento-item]");
    flipStateRef.current = items.length > 0 ? Flip.getState(items) : null;
  };

  const handleSelectFilter = (next: FilterValue) => {
    if (next === activeFilter) return;
    captureGridFlip();
    setActiveFilter(next);
  };

  const handleToggleShowAll = () => {
    captureGridFlip();
    setShowAllSystems((v) => !v);
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || appReduced) return;
      const rule = section.querySelector<HTMLElement>("[data-section-rule]");
      if (!rule) return;

      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "power2.out",
          transformOrigin: "left center",
          scrollTrigger: {
            trigger: section,
            start: "top 86%",
            end: "top 44%",
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [appReduced], revertOnUpdate: true }
  );

  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;

      const items = grid.querySelectorAll<HTMLElement>("[data-bento-item]");
      if (items.length === 0) return;

      const capturedFlip = flipStateRef.current;
      flipStateRef.current = null;

      if (appReduced) {
        gsap.set(items, { clearProps: "transform,opacity" });
        items.forEach((item) => {
          const stackScale = item.querySelector("[data-stack-scale]");
          const dimmer = item.querySelector("[data-stack-dimmer]");
          if (stackScale) gsap.set(stackScale, { clearProps: "transform" });
          if (dimmer) gsap.set(dimmer, { opacity: 0 });
        });
        return;
      }

      const appMm = createAppMatchMedia();
      let disposed = false;

      const setupCardMotion = () => {
        if (disposed) return;
        appMm.register(({ conditions }) => {
          if (conditions.appReduced) {
            gsap.set(items, { clearProps: "transform,opacity" });
            return;
          }

          if (conditions.desktopFine && isStackMode && items.length > 1) {
            attachBidirectionalScrollEnvelope(items[0], {
              disableExitFade: true,
              enterOpacity: 0.14,
              enterY: 34,
              enterScale: 0.965,
            });

            for (let i = 0; i < items.length - 1; i++) {
              const stackScale = items[i].querySelector<HTMLElement>("[data-stack-scale]");
              const dimmer = items[i].querySelector<HTMLElement>("[data-stack-dimmer]");
              const nextWrapper = items[i + 1];

              if (stackScale) {
                gsap.fromTo(
                  stackScale,
                  { scale: 1, yPercent: 0 },
                  {
                    scale: 0.94,
                    yPercent: -2,
                    ease: "none",
                    scrollTrigger: {
                      trigger: nextWrapper,
                      start: "top 86%",
                      end: "top 24%",
                      scrub: MOTION.scrollTrigger.scrub,
                      invalidateOnRefresh: true,
                    },
                  }
                );
              }
              if (dimmer) {
                gsap.fromTo(
                  dimmer,
                  { opacity: 0 },
                  {
                    opacity: 0.48,
                    ease: "none",
                    scrollTrigger: {
                      trigger: nextWrapper,
                      start: "top 86%",
                      end: "top 24%",
                      scrub: MOTION.scrollTrigger.scrub,
                      invalidateOnRefresh: true,
                    },
                  }
                );
              }
            }

            attachBidirectionalScrollEnvelope(items[items.length - 1], {
              disableExitFade: true,
              enterOpacity: 0.2,
              enterY: 28,
              enterScale: 0.975,
            });
            return;
          }

          items.forEach((item) => {
            const stackScale = item.querySelector("[data-stack-scale]");
            const dimmer = item.querySelector("[data-stack-dimmer]");
            if (stackScale) gsap.set(stackScale, { clearProps: "transform" });
            if (dimmer) gsap.set(dimmer, { opacity: 0 });
            attachBidirectionalScrollEnvelope(item, {
              enterOpacity: 0.14,
              enterY: conditions.mobile ? 22 : 34,
              enterScale: conditions.mobile ? 0.97 : 0.955,
            });
          });
        });
      };

      const cleanup = () => {
        disposed = true;
        appMm.mm.revert();
      };

      const filterKey = `${activeFilter}:${showAllSystems}`;
      const filterChanged = prevFilterKeyRef.current !== filterKey;
      prevFilterKeyRef.current = filterKey;

      if (!hasInteractedRef.current || !filterChanged) {
        hasInteractedRef.current = true;
        setupCardMotion();
        return cleanup;
      }

      if (capturedFlip) {
        Flip.from(capturedFlip, {
          targets: items,
          duration: 0.44,
          ease: MOTION.gsapEase,
          stagger: 0.035,
          scale: false,
          simple: true,
          clearProps: "transform",
          onEnter: (elements) =>
            gsap.fromTo(
              elements,
              { y: 16, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.34,
                stagger: 0.04,
                ease: MOTION.gsapEase,
                clearProps: "transform,opacity",
              }
            ),
          onComplete: () => {
            if (disposed) return;
            setupCardMotion();
            ScrollTrigger.refresh();
          },
        });
        return cleanup;
      }

      const staggerStep =
        items.length > 1
          ? Math.min(0.05, MOTION.stagger.bentoCap / (items.length - 1))
          : 0;

      gsap.fromTo(
        items,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.36,
          stagger: staggerStep,
          ease: MOTION.gsapEase,
          clearProps: "transform,opacity",
          onComplete: () => {
            if (disposed) return;
            setupCardMotion();
            ScrollTrigger.refresh();
          },
        }
      );

      return cleanup;
    },
    {
      scope: gridRef,
      dependencies: [activeFilter, showAllSystems, appReduced],
      revertOnUpdate: true,
    }
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 720);
    return () => window.clearTimeout(timer);
  }, [activeFilter, showAllSystems]);

  const indexedProjects = projects.map((project, idx) => ({
    project,
    num: String(idx + 1).padStart(2, "0"),
  }));

  const byCategory =
    activeFilter === "All"
      ? indexedProjects
      : indexedProjects.filter(({ project }) => project.category === activeFilter);

  const featuredProjects = projects.filter((project) => project.featured);

  const visibleProjects =
    activeFilter === "All" && !showAllSystems
      ? byCategory.filter(({ project }) => project.featured)
      : byCategory;

  const hiddenCount = byCategory.length - visibleProjects.length;

  function getCardSpanClass(position: number, total: number): string {
    if (isStackMode) return "md:col-span-2 lg:col-span-12 lg:sticky lg:top-[calc(84px+var(--stack-i)*18px)]";
    if (position === 0) return "md:col-span-2 lg:col-span-12";
    const remaining = total - 1;
    const remIndex = position - 1;
    if (remaining % 2 === 1 && remIndex === remaining - 1) return "md:col-span-2 lg:col-span-12";
    return remIndex % 2 === 0 ? "md:col-span-1 lg:col-span-6" : "md:col-span-1 lg:col-span-6";
  }

  return (
    <section
      ref={sectionRef}
      id="work"
      className="relative z-[3] -mt-6 overflow-x-clip rounded-t-[1.75rem] border-t border-t-[rgba(56,189,248,0.22)] border-b border-b-[rgba(240,246,252,0.08)] bg-[linear-gradient(180deg,#111722_0%,#0D1117_140px)] py-24 shadow-[0_-32px_84px_rgba(2,8,23,0.94)] sm:-mt-8 sm:rounded-t-[2.25rem] md:py-28 lg:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="relative flex flex-col justify-between gap-6 border-b border-[rgba(240,246,252,0.08)] pb-8 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#38BDF8]">
                <ScrambleMetric value="01" />{" "}
                <span className="text-[#8B949E]">/</span>{" "}
                <span>Selected Work</span>
              </p>
              <KineticHeading
                as="h2"
                reveal="mask-lines"
                className="velocity-skew-heading mt-4 font-display text-[clamp(2.4rem,5vw,4.3rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]"
              >
                SYSTEM ARCHITECTURES,{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  benchmarked.
                </span>
              </KineticHeading>
            </div>

            <ScrollScrubText className="max-w-[42ch] font-sans text-base leading-relaxed text-[#9DA7B3]">
              Flagship architectures first, with category filters and live 3D system topologies.
            </ScrollScrubText>

            <span
              data-section-rule
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left bg-gradient-to-r from-[#38BDF8]/70 via-[#38BDF8]/25 to-transparent"
            />
          </div>

          {/* Interactive Category Filter Pills with GPU Sliding Active Rail */}
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
              <FunnelSimple className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
              <span>Filter</span>
            </span>

            <div
              ref={filterRailRef}
              role="group"
              aria-label="Filter projects by engineering category"
              className="relative flex flex-wrap items-center gap-2.5"
            >
              {filterPillReady && filterPillRect && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 rounded-full border transition-[transform,width,height,background-color,border-color] duration-300 ease-[var(--ease-editorial)]"
                  style={{
                    width: filterPillRect.width,
                    height: filterPillRect.height,
                    transform: `translate3d(${filterPillRect.left}px, ${filterPillRect.top}px, 0)`,
                    borderColor: activeFilterHue ? activeFilterHue.hex : "#38BDF8",
                    backgroundColor: activeFilterHue
                      ? activeFilterHue.softBg
                      : "rgba(56, 189, 248, 0.15)",
                  }}
                />
              )}

              {FILTER_OPTIONS.map((option) => {
                const isActive = activeFilter === option.value;
                const hue = option.value === "All" ? null : getCategoryHue(option.value);
                const count =
                  option.value === "All"
                    ? projects.length
                    : projects.filter((p) => p.category === option.value).length;

                return (
                  <button
                    key={option.value}
                    ref={registerFilterItem(option.value)}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectFilter(option.value)}
                    style={
                      isActive && hue && !filterPillReady
                        ? {
                            borderColor: hue.hex,
                            backgroundColor: hue.softBg,
                            color: "#E6EDF3",
                          }
                        : undefined
                    }
                    className={`relative z-10 inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs transition-colors duration-300 ${
                      isActive
                        ? filterPillReady
                          ? "border-transparent bg-transparent font-semibold text-[#E6EDF3]"
                          : !hue
                            ? "border-[#38BDF8] bg-[#38BDF8]/15 font-semibold text-[#E6EDF3]"
                            : "font-semibold"
                        : "border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#9DA7B3] hover:border-[rgba(240,246,252,0.25)] hover:text-[#E6EDF3]"
                    }`}
                  >
                    {hue && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: hue.hex }}
                        aria-hidden="true"
                      />
                    )}
                    <span>{option.label}</span>
                    <span className="text-[#8B949E] tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>

            <span
              aria-live="polite"
              className="ml-auto font-mono text-xs tracking-[0.12em] text-[#8B949E] tabular-nums"
            >
              {String(visibleProjects.length).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
            </span>
          </div>
        </SectionReveal>

          <div
            ref={gridRef}
            className={`mt-10 grid grid-flow-dense grid-cols-1 md:grid-cols-2 lg:grid-cols-12 ${
              isStackMode ? "gap-8 pb-6" : "gap-6"
            }`}
          >
            {visibleProjects.map(({ project, num }, position) => {
              const spanClass = getCardSpanClass(position, visibleProjects.length);
              const isWideCard = isStackMode || spanClass.includes("lg:col-span-12");
              const hue = getCategoryHue(project.category);

              return (
                <div
                  key={project.slug}
                  data-bento-item
                  data-stack-card={isStackMode ? "true" : undefined}
                  style={
                    isStackMode
                      ? ({
                          "--stack-i": position,
                          zIndex: 10 + position,
                        } as CSSProperties)
                      : undefined
                  }
                  className={spanClass}
                >
                  <div data-stack-scale className="h-full">
                  <article
                    data-cursor="VIEW CASE ↗"
                    onPointerEnter={handleSpotlightEnter}
                    onPointerMove={(event) => {
                      const canParallax =
                        (window.matchMedia?.("(hover: hover) and (any-pointer: fine)")
                          ?.matches ??
                          true) &&
                        !shouldReduceAppMotion();
                      handleSpotlightMove(event, canParallax);
                    }}
                    onPointerLeave={(event) => handleSpotlightLeave(event, true)}
                    className="bento-tilt-card double-bezel-outer group relative h-full hover:border-[rgba(240,246,252,0.22)]"
                  >
                    <div
                      data-stack-dimmer
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-[#06090F] opacity-0"
                    />
                    <div
                      style={{ "--spotlight-color": hue.softBg } as CSSProperties}
                      className="double-bezel-core spotlight-card flex h-full flex-col justify-between overflow-hidden p-5 sm:p-7"
                    >
                      <div className={isWideCard ? "grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center" : "flex flex-col gap-6"}>
                        <div className={isWideCard ? "lg:col-span-6" : ""}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.12em]"
                              style={{
                                borderColor: hue.border,
                                backgroundColor: hue.softBg,
                                color: hue.labelText,
                              }}
                            >
                              <span>{num}</span>
                              <span aria-hidden="true">·</span>
                              <span>{project.category}</span>
                            </span>
                            <span className="font-mono text-xs text-[#8B949E]">
                              {project.role}
                            </span>
                          </div>

                          <h3 className="mt-4 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold uppercase leading-[0.98] tracking-tight text-[#E6EDF3]">
                            {project.name}
                          </h3>
                          <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-[#38BDF8]">
                            {project.eyebrow}
                          </p>
                          <p className="mt-3 line-clamp-3 max-w-[54ch] font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                            {project.description}
                          </p>

                          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {project.highlightMetrics.slice(0, 3).map((m) => (
                              <div
                                key={m.label}
                                className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-3 py-2.5"
                              >
                                <dd className="font-display text-xl font-bold leading-none text-[#E6EDF3] tabular-nums sm:text-2xl">
                                  <ScrambleMetric value={m.value} />
                                </dd>
                                <dt className="mt-1 font-mono text-xs text-[#8B949E]">
                                  {m.label}
                                </dt>
                              </div>
                            ))}
                          </dl>

                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <MagneticButton>
                              <TransitionLink
                                href={`/work/${project.slug}`}
                                className="group/cta inline-flex min-h-[44px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-5 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-[background-color,color,transform] duration-500 ease-[var(--ease-editorial)] hover:bg-[#7DD3FC] active:scale-[0.98]"
                              >
                                <span>Read case study</span>
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 transition-transform duration-500 ease-[var(--ease-editorial)] group-hover/cta:translate-x-[3px] group-hover/cta:-translate-y-[2px] group-hover/cta:scale-105">
                                  <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                                </span>
                              </TransitionLink>
                            </MagneticButton>
                            <a
                              href={project.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-cursor="OPEN ↗"
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.12)] px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3] active:scale-[0.98]"
                            >
                              <span>Source</span>
                              <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                            </a>
                          </div>
                        </div>

                        <div className={isWideCard ? "lg:col-span-6" : ""}>
                          <ProjectPreviewPlate
                            project={project}
                            indexLabel={num}
                            variant={isWideCard ? "featured" : "compact"}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                  </div>
                </div>
              );
            })}
          </div>

        {activeFilter === "All" && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleToggleShowAll}
              aria-expanded={showAllSystems}
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-6 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
            >
              <span>
                {showAllSystems
                  ? `Show top ${featuredProjects.length} featured`
                  : `View all ${projects.length} systems (+${hiddenCount})`}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
