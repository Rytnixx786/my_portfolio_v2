"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, FunnelSimple } from "@phosphor-icons/react";
import {
  PROJECT_CATEGORIES,
  projects,
  type ProjectCategory,
} from "@/data/projects";
import { getCategoryHue } from "@/lib/palette";
import { MOTION } from "@/lib/motion";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { ProjectPreviewPlate } from "./ProjectPreviewPlate";
import { SectionReveal } from "./SectionReveal";
import { KineticHeading, ScrambleMetric } from "@/components/motion/KineticText";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  const gridRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);

  useGSAP(
    () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        return;
      }
      const grid = gridRef.current;
      if (!grid) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = grid.querySelectorAll("[data-bento-item]");
        if (items.length === 0) return;

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
          }
        );
      });
    },
    { scope: gridRef, dependencies: [activeFilter, showAllSystems] }
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);
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

  const visibleProjects =
    activeFilter === "All" && !showAllSystems
      ? byCategory.filter(({ project }) => project.featured)
      : byCategory;

  const hiddenCount = byCategory.length - visibleProjects.length;

  function getCardSpanClass(position: number, total: number): string {
    if (position === 0) return "lg:col-span-12";
    const remaining = total - 1;
    const remIndex = position - 1;
    if (remaining % 2 === 1 && remIndex === remaining - 1) return "lg:col-span-12";
    return remIndex % 2 === 0 ? "lg:col-span-6" : "lg:col-span-6";
  }

  return (
    <section
      id="work"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-28 sm:py-36 lg:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="flex flex-col justify-between gap-6 border-b border-[rgba(240,246,252,0.08)] pb-8 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#38BDF8]">
                01 / Selected Work
              </p>
              <KineticHeading
                as="h2"
                className="mt-4 font-display text-[clamp(2.4rem,5vw,4.3rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]"
              >
                SYSTEM ARCHITECTURES,{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  benchmarked.
                </span>
              </KineticHeading>
            </div>

            <p className="max-w-[42ch] font-sans text-base leading-relaxed text-[#9DA7B3]">
              Flagship architectures first, with category filters and live 3D system topologies.
            </p>
          </div>

          {/* Interactive Category Filter Pills */}
          <div
            role="group"
            aria-label="Filter projects by engineering category"
            className="mt-7 flex flex-wrap items-center gap-2.5"
          >
            <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
              <FunnelSimple className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
              <span>Filter</span>
            </span>

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
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(option.value)}
                  style={
                    isActive && hue
                      ? {
                          borderColor: hue.hex,
                          backgroundColor: hue.softBg,
                          color: "#E6EDF3",
                        }
                      : undefined
                  }
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs transition-all duration-300 ${
                    isActive && !hue
                      ? "border-[#38BDF8] bg-[#38BDF8]/15 font-semibold text-[#E6EDF3]"
                      : isActive
                        ? "font-semibold"
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

            <span
              aria-live="polite"
              className="ml-auto font-mono text-xs text-[#8B949E] tabular-nums"
            >
              Showing {visibleProjects.length} of {projects.length}
            </span>
          </div>
        </SectionReveal>

        <SectionReveal variant="bento-cascade">
          <div
            ref={gridRef}
            className="mt-10 grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-12"
          >
            {visibleProjects.map(({ project, num }, position) => {
              const spanClass = getCardSpanClass(position, visibleProjects.length);
              const isWideCard = spanClass === "lg:col-span-12";
              const hue = getCategoryHue(project.category);

              const handleSpotlightMove = (event: PointerEvent<HTMLDivElement>) => {
                if (event.pointerType === "touch") return;
                const rect = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty(
                  "--mouse-x",
                  `${event.clientX - rect.left}px`
                );
                event.currentTarget.style.setProperty(
                  "--mouse-y",
                  `${event.clientY - rect.top}px`
                );
              };

              return (
                <div key={project.slug} data-bento-item className={spanClass}>
                  <article className="double-bezel-outer group h-full transition-colors duration-300 hover:border-[rgba(240,246,252,0.22)]">
                    <div
                      onPointerMove={handleSpotlightMove}
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
                                className="group/cta inline-flex min-h-[44px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-5 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-colors hover:bg-[#7DD3FC]"
                              >
                                <span>Read case study</span>
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5">
                                  <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                                </span>
                              </TransitionLink>
                            </MagneticButton>
                            <a
                              href={project.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.12)] px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
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
              );
            })}
          </div>
        </SectionReveal>

        {activeFilter === "All" && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllSystems((v) => !v)}
              aria-expanded={showAllSystems}
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-6 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
            >
              <span>
                {showAllSystems
                  ? "Show top 3 featured"
                  : `View all ${projects.length} systems (+${hiddenCount})`}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
