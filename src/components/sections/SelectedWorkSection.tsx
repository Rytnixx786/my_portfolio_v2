"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FunnelSimple } from "@phosphor-icons/react";
import {
  PROJECT_CATEGORIES,
  projects,
  type ProjectCategory,
} from "@/data/projects";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { ProjectPreviewPlate } from "./ProjectPreviewPlate";
import { SectionReveal } from "./SectionReveal";

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

  const indexedProjects = projects.map((project, idx) => ({
    project,
    num: String(idx + 1).padStart(2, "0"),
  }));

  const filtered =
    activeFilter === "All"
      ? indexedProjects
      : indexedProjects.filter(({ project }) => project.category === activeFilter);

  function getCardSpanClass(position: number, total: number): string {
    if (position === 0) return "lg:col-span-12";

    const remaining = total - 1;
    const remIndex = position - 1;
    const isLastOdd = remaining % 2 === 1 && remIndex === remaining - 1;
    if (isLastOdd) return "lg:col-span-12";

    const pairIndex = Math.floor(remIndex / 2);
    const isFirstInPair = remIndex % 2 === 0;
    if (pairIndex % 2 === 0) {
      return isFirstInPair ? "lg:col-span-7" : "lg:col-span-5";
    }
    return isFirstInPair ? "lg:col-span-5" : "lg:col-span-7";
  }

  return (
    <section
      id="work"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="flex flex-col justify-between gap-8 border-b border-[rgba(240,246,252,0.08)] pb-10 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7DD3FC]">
                <span>Selected Work</span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-[#E6EDF3]">
                PRODUCTION ARCHITECTURES,{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  benchmarked.
                </span>
              </h2>
            </div>

            <p className="max-w-[46ch] font-sans text-base leading-relaxed text-[#8B949E]">
              Six end-to-end engineering builds—hover or tap any pipeline stage directly
              inside a topology plate to trace live contracts, or open its deep dive.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div
            role="group"
            aria-label="Filter projects by engineering category"
            className="mt-8 flex flex-wrap items-center gap-2.5"
          >
            <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6E7681]">
              <FunnelSimple className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
              <span>Filter</span>
            </span>

            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.value;
              const count =
                option.value === "All"
                  ? projects.length
                  : projects.filter((p) => p.category === option.value).length;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveFilter(option.value)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                    isActive
                      ? "border-[#38BDF8] bg-[#38BDF8] font-semibold text-[#0D1117]"
                      : "border-[rgba(240,246,252,0.1)] bg-[#161B22] text-[#8B949E] hover:border-[#38BDF8]/45 hover:text-[#E6EDF3]"
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none tabular-nums ${
                      isActive
                        ? "bg-[#0D1117]/20 text-[#0D1117]"
                        : "bg-[#1C222B] text-[#6E7681]"
                    }`}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionReveal>

        {/* Gapless Dense Asymmetric Project Grid */}
        <div
          key={activeFilter}
          className="mt-10 grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
        >
          {filtered.map(({ project, num }, position) => {
            const spanClass = getCardSpanClass(position, filtered.length);
            const isWideSpread = spanClass === "lg:col-span-12";
            const isFlippedSpread = isWideSpread && position % 2 === 1;

            return (
              <article
                key={project.slug}
                id={`system-${project.slug}`}
                className={`min-w-0 ${spanClass}`}
              >
                <div className="double-bezel-outer group h-full transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/40">
                  <div
                    className={`double-bezel-core flex h-full flex-col justify-between p-5 sm:p-7 ${
                      isWideSpread
                        ? "lg:grid lg:grid-cols-12 lg:items-center lg:gap-10 lg:p-9"
                        : "gap-6"
                    }`}
                  >
                    {/* Interactive Architecture Topology Plate */}
                    <div
                      className={`min-w-0 ${
                        isWideSpread
                          ? `lg:col-span-6 ${isFlippedSpread ? "lg:order-2" : ""}`
                          : ""
                      }`}
                    >
                      <ProjectPreviewPlate
                        project={project}
                        indexLabel={num}
                        variant={isWideSpread ? "featured" : "compact"}
                      />
                    </div>

                    {/* Editorial Copy & Verified Benchmarks */}
                    <div
                      className={`flex min-w-0 flex-1 flex-col justify-between ${
                        isWideSpread
                          ? `mt-6 lg:col-span-6 lg:mt-0 ${isFlippedSpread ? "lg:order-1" : ""}`
                          : ""
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(240,246,252,0.08)] pb-3 font-mono text-[11px] uppercase tracking-[0.14em]">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="font-semibold text-[#38BDF8] tabular-nums">
                              {num}
                            </span>
                            <span className="text-[#6E7681]" aria-hidden="true">
                              /
                            </span>
                            <span className="truncate text-[#8B949E]">
                              {project.category}
                            </span>
                          </div>
                          <span className="shrink-0 text-[#6E7681] tabular-nums">
                            {project.year}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B949E]">
                            {project.eyebrow}
                          </p>
                          <h3 className="mt-1.5 font-display text-3xl font-bold uppercase tracking-[-0.01em] text-[#E6EDF3] sm:text-4xl">
                            <Link
                              href={`/work/${project.slug}`}
                              className="transition-colors duration-300 hover:text-[#38BDF8]"
                            >
                              {project.name}
                            </Link>
                          </h3>
                        </div>

                        <p className="mt-3 max-w-[60ch] font-sans text-base leading-relaxed text-[#8B949E]">
                          {project.description}
                        </p>

                        <dl
                          className={`mt-6 grid gap-3 border-y border-[rgba(240,246,252,0.08)] py-4 ${
                            isWideSpread ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"
                          }`}
                        >
                          {(isWideSpread
                            ? project.highlightMetrics
                            : project.highlightMetrics.slice(0, 2)
                          ).map((metric) => (
                            <div key={metric.label} className="min-w-0">
                              <dt className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[#6E7681]">
                                {metric.label}
                              </dt>
                              <dd className="mt-1 font-display text-2xl font-bold tracking-tight text-[#E6EDF3] tabular-nums">
                                {metric.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-1.5">
                          {project.services.map((service) => (
                            <span
                              key={service}
                              className="rounded-full border border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8B949E]"
                            >
                              {service}
                            </span>
                          ))}
                        </div>

                        <MagneticButton strength={0.18}>
                          <Link
                            href={`/work/${project.slug}`}
                            className="group/btn inline-flex items-center gap-2.5 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#1C222B] py-1.5 pl-4 pr-1.5 font-sans text-xs font-medium text-[#E6EDF3] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0D1117] active:scale-[0.98]"
                          >
                            <span>View Case Study</span>
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0D1117]/60 text-[#38BDF8] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-105 group-hover/btn:bg-[#0D1117]/20 group-hover/btn:text-[#0D1117]">
                              <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                            </span>
                          </Link>
                        </MagneticButton>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
