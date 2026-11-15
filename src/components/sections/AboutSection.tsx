"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowUpRight,
  Briefcase,
  GraduationCap,
  MapPin,
  Terminal,
} from "@phosphor-icons/react";
import { experience, lab, principles, profile } from "@/data/site";
import { CHOREO, createAppMatchMedia, EASE, MOTION } from "@/lib/motion";
import {
  KineticHeading,
  ScrambleMetric,
  ScrollScrubText,
} from "@/components/motion/KineticText";
import { useAppReducedMotion } from "@/components/motion/useAppReducedMotion";
import { attachBidirectionalScrollEnvelope, SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SPINE_WAYPOINTS = [
  { cx: 8, cy: 22, threshold: 0.02 },
  { cx: 116, cy: 10, threshold: 0.3 },
  { cx: 208, cy: 34, threshold: 0.62 },
  { cx: 352, cy: 22, threshold: 0.96 },
] as const;

/**
 * Unified Background & Experience section combining identity, sticky engineering dial,
 * ScrollTrigger SVG spine trace, FlyRank + BRAC University timeline, principles, and systems lab.
 */
export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const tracePathRef = useRef<SVGPathElement>(null);
  const tracerDotRef = useRef<SVGCircleElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const percentReadoutRef = useRef<HTMLSpanElement>(null);
  const waypointRefs = useRef<Array<SVGCircleElement | null>>([]);
  const [selectedLabIdx, setSelectedLabIdx] = useState(0);
  const [activeMilestone, setActiveMilestone] = useState(0);
  const appReduced = useAppReducedMotion();

  useGSAP(
    () => {
      const el = sectionRef.current;
      const path = tracePathRef.current;
      if (!el || !path) return;

      const totalLength = path.getTotalLength();
      const applySpineProgress = (progress: number) => {
        const clamped = Math.min(1, Math.max(0, progress));
        setActiveMilestone(clamped >= 0.5 ? 1 : 0);

        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${clamped.toFixed(4)})`;
        }
        if (percentReadoutRef.current) {
          const pct = String(Math.round(clamped * 100)).padStart(2, "0");
          percentReadoutRef.current.textContent = `${pct}% · ${
            clamped >= 0.5 ? "PHASE 02/02" : "PHASE 01/02"
          }`;
        }

        const tracer = tracerDotRef.current;
        if (tracer) {
          const pt = path.getPointAtLength(clamped * totalLength);
          tracer.setAttribute("cx", pt.x.toFixed(2));
          tracer.setAttribute("cy", pt.y.toFixed(2));
          tracer.setAttribute("opacity", clamped > 0.01 ? "1" : "0");
        }

        SPINE_WAYPOINTS.forEach((wp, idx) => {
          const node = waypointRefs.current[idx];
          if (!node) return;
          const active = clamped >= wp.threshold;
          node.setAttribute("fill", active ? "#38BDF8" : "#0D1117");
          node.setAttribute("r", active ? "4.6" : "4");
        });
      };

      const milestones = el.querySelectorAll<HTMLElement>("[data-about-milestone]");
      const stickyInner = el.querySelector<HTMLElement>("[data-about-sticky-inner]");

      if (appReduced) {
        gsap.set(path, {
          strokeDasharray: "none",
          strokeDashoffset: 0,
        });
        applySpineProgress(1);
        gsap.set(milestones, { clearProps: "transform,opacity,clipPath,filter" });
        if (stickyInner) gsap.set(stickyInner, { clearProps: "transform,opacity" });
        return;
      }

      gsap.set(path, {
        strokeDasharray: totalLength,
        strokeDashoffset: totalLength,
      });
      applySpineProgress(0);

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          end: "bottom 75%",
          scrub: 0.65,
          onUpdate: (self) => {
            applySpineProgress(self.progress);
          },
        },
      });

      const mm = createAppMatchMedia().register(({ conditions }) => {
        if (conditions.appReduced) {
          gsap.set(milestones, { clearProps: "transform,opacity,clipPath,filter" });
          if (stickyInner) gsap.set(stickyInner, { clearProps: "transform,opacity" });
          return;
        }

        milestones.forEach((card) => {
          gsap.fromTo(
            card,
            {
              clipPath: conditions.desktopFine
                ? "inset(0 28% 0 0 round 1rem)"
                : "inset(0 12% 0 0 round 1rem)",
              opacity: 0.5,
            },
            {
              clipPath: "inset(0 0% 0 0 round 1rem)",
              opacity: 1,
              ease: EASE.gsapOut,
              scrollTrigger: {
                trigger: card,
                start: "top 92%",
                end: "top 68%",
                scrub: MOTION.scrollTrigger.scrub,
                invalidateOnRefresh: true,
              },
            }
          );

          attachBidirectionalScrollEnvelope(card, {
            enterOpacity: 1,
            enterY: 0,
            enterScale: 1,
            exitOpacity: CHOREO.envelope.exitOpacity,
            exitY: -32,
            exitScale: 0.96,
            exitBlurPx: 0,
          });
        });

        if (stickyInner && conditions.desktopFine) {
          gsap.fromTo(
            stickyInner,
            { opacity: 1, scale: 1, y: 0 },
            {
              opacity: 0.34,
              scale: 0.96,
              y: -22,
              ease: "power2.in",
              scrollTrigger: {
                trigger: el,
                start: "bottom 42%",
                end: "bottom 8%",
                scrub: 0.5,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [appReduced] }
  );

  const activeLab = lab[selectedLabIdx] ?? lab[0];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative z-[2] border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-24 sm:py-28 lg:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Sticky Engineering Dial (5 cols) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div data-about-sticky-inner>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#38BDF8]">
                <ScrambleMetric value="03" />{" "}
                <span className="text-[#8B949E]">/</span>{" "}
                <span>Background &amp; Track</span>
              </p>

              <KineticHeading
                as="h2"
                reveal="mask-lines"
                className="velocity-skew-heading mt-4 font-display text-[clamp(2.35rem,4.6vw,3.9rem)] font-bold uppercase leading-[0.94] tracking-[-0.02em] text-[#E6EDF3]"
              >
                SYSTEMS BUILT ON{" "}
                <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  evidence.
                </span>
              </KineticHeading>

              <ScrollScrubText className="mt-4 max-w-[44ch] font-sans text-base leading-relaxed text-[#9DA7B3]">
                {profile.summary}
              </ScrollScrubText>

              {/* Editorial Portrait + Live Track Dial */}
              <div className="mt-8 overflow-hidden rounded-3xl border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.14)] bg-[#0D1117]">
                    <Image
                      src={profile.portrait}
                      alt={`${profile.name} portrait`}
                      fill
                      loading="eager"
                      sizes="96px"
                      className="object-cover object-top"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-display text-xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                      {profile.name}
                    </p>
                    <p className="inline-flex items-center gap-1.5 font-mono text-xs text-[#8B949E]">
                      <MapPin className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                      <span>{profile.location}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] px-3 py-1 font-mono text-xs text-[#9DA7B3]">
                        <Briefcase className="h-3.5 w-3.5 text-[#10B981]" weight="regular" aria-hidden="true" />
                        <span>FlyRank Intern</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] px-3 py-1 font-mono text-xs text-[#9DA7B3]">
                        <GraduationCap className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                        <span>BRACU 2026</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ScrollTrigger SVG Telemetry Trace */}
                <div className="mt-5 border-t border-[rgba(240,246,252,0.08)] pt-4">
                  <div className="mb-2 flex items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-[#8B949E]">
                    <span>Verification Spine</span>
                    <span ref={percentReadoutRef} className="text-[#38BDF8] tabular-nums">
                      00% · PHASE 01/02
                    </span>
                  </div>
                  <div className="mb-2.5 h-1 w-full overflow-hidden rounded-full bg-[rgba(240,246,252,0.08)]">
                    <div
                      ref={progressBarRef}
                      className="h-full w-full origin-left bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC]"
                      style={{ transform: "scaleX(0)" }}
                    />
                  </div>
                  <svg
                    viewBox="0 0 360 44"
                    className="h-11 w-full overflow-visible"
                    aria-hidden="true"
                  >
                    <path
                      d="M 8 22 L 88 22 L 116 10 L 180 10 L 208 34 L 272 34 L 300 22 L 352 22"
                      fill="none"
                      stroke="rgba(240,246,252,0.12)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      ref={tracePathRef}
                      d="M 8 22 L 88 22 L 116 10 L 180 10 L 208 34 L 272 34 L 300 22 L 352 22"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {SPINE_WAYPOINTS.map((wp, i) => (
                      <circle
                        key={wp.cx}
                        ref={(node) => {
                          waypointRefs.current[i] = node;
                        }}
                        cx={wp.cx}
                        cy={wp.cy}
                        r="4"
                        fill="#0D1117"
                        stroke="#38BDF8"
                        strokeWidth="2"
                      />
                    ))}
                    <circle
                      ref={tracerDotRef}
                      cx="8"
                      cy="22"
                      r="6.5"
                      fill="#7DD3FC"
                      fillOpacity="0.95"
                      stroke="#0D1117"
                      strokeWidth="2"
                      opacity="0"
                    />
                  </svg>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Right Scrolling Narrative Column (7 cols) */}
          <div className="space-y-12 lg:col-span-7">
            {/* 1. Experience & Education Timeline */}
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] pb-3">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#8B949E]">
                  Experience &amp; Education
                </h3>
                <span className="font-mono text-xs text-[#38BDF8]">02 Milestones</span>
              </div>

              <div className="relative space-y-6 border-l border-[rgba(240,246,252,0.12)] pl-6 sm:pl-8">
                {experience.map((item, idx) => {
                  const isMilestoneActive = idx === activeMilestone;
                  return (
                    <article
                      key={item.org}
                      data-about-milestone
                      className={`relative rounded-2xl border bg-[#161B22]/75 p-5 transition-colors duration-300 sm:p-6 ${
                        isMilestoneActive
                          ? "border-[#38BDF8]/35"
                          : "border-[rgba(240,246,252,0.08)] hover:border-[rgba(240,246,252,0.18)]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[31px] top-7 h-3 w-3 rounded-full border-2 border-[#38BDF8] transition-[background-color,box-shadow,transform] duration-300 ease-[var(--ease-editorial)] sm:-left-[39px] ${
                          isMilestoneActive
                            ? "bg-[#38BDF8]/30 shadow-[0_0_0_4px_rgba(56,189,248,0.16)]"
                            : "bg-[#0D1117]"
                        }`}
                      />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">
                        {item.org}
                      </span>
                      <span className="rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] px-3 py-1 font-mono text-xs text-[#8B949E] tabular-nums">
                        <ScrambleMetric value={item.period} />
                      </span>
                    </div>

                    <h4 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                      {item.role}
                    </h4>
                    <p className="mt-1 font-mono text-xs text-[#8B949E]">
                      Focus: {item.focus}
                    </p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                      {item.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.stack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-2.5 py-1 font-mono text-xs text-[#9DA7B3]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {"href" in item && item.href && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#0D1117] px-4 py-2 font-mono text-xs text-[#38BDF8] transition-colors hover:border-[#38BDF8] hover:text-[#7DD3FC]"
                        >
                          <span>Repository</span>
                          <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>

            {/* 2. Operating Principles (hairline typographic index) */}
            <SectionReveal variant="bento-cascade">
              <div className="mb-4 flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] pb-3">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#8B949E]">
                  Operating Rules
                </h3>
                <span className="font-mono text-xs text-[#8B949E]">3 Constraints</span>
              </div>

              <ol className="divide-y divide-[rgba(240,246,252,0.08)] border-b border-[rgba(240,246,252,0.08)]">
                {principles.map((p) => (
                  <li
                    key={p.k}
                    data-bento-item
                    className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-12 sm:items-baseline"
                  >
                    <div className="flex items-baseline gap-3 sm:col-span-5">
                      <span className="font-mono text-xs font-semibold text-[#38BDF8] tabular-nums">
                        {p.k}
                      </span>
                      <span className="font-display text-lg font-bold uppercase tracking-tight text-[#E6EDF3]">
                        {p.t}
                      </span>
                    </div>
                    <p className="font-sans text-sm leading-relaxed text-[#9DA7B3] sm:col-span-7">
                      {p.d}
                    </p>
                  </li>
                ))}
              </ol>
            </SectionReveal>

            {/* 3. Research & Low-Level Systems Lab */}
            <SectionReveal variant="reveal">
              <div className="mb-4 flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] pb-3">
                <h3 className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#8B949E]">
                  <Terminal className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                  <span>Research &amp; Low-Level Lab</span>
                </h3>
                <span className="font-mono text-xs text-[#8B949E]">
                  {lab.length} builds
                </span>
              </div>

              <div className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/75 p-4 sm:p-5">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Research and systems builds">
                  {lab.map((entry, idx) => {
                    const isSelected = idx === selectedLabIdx;
                    return (
                      <button
                        key={entry.name}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedLabIdx(idx)}
                        className={`min-h-[44px] rounded-xl border px-3.5 py-2 font-mono text-xs transition-colors ${
                          isSelected
                            ? "border-[#38BDF8] bg-[#38BDF8]/12 font-semibold text-[#E6EDF3]"
                            : "border-[rgba(240,246,252,0.08)] bg-[#0D1117] text-[#9DA7B3] hover:border-[rgba(240,246,252,0.2)] hover:text-[#E6EDF3]"
                        }`}
                      >
                        {entry.name}
                      </button>
                    );
                  })}
                </div>

                {activeLab && (
                  <div
                    key={activeLab.name}
                    className="panel-enter mt-4 flex flex-col justify-between gap-4 rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs uppercase tracking-[0.12em] text-[#38BDF8]">
                          {activeLab.domain}
                        </span>
                        <span aria-hidden="true" className="text-[#8B949E]">·</span>
                        <span className="font-mono text-xs text-[#8B949E]">
                          {activeLab.stack}
                        </span>
                      </div>
                      <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#E6EDF3]">
                        {activeLab.note}
                      </p>
                    </div>

                    {"href" in activeLab && activeLab.href && (
                      <a
                        href={activeLab.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-4 py-2 font-mono text-xs text-[#38BDF8] transition-colors hover:border-[#38BDF8]"
                      >
                        <span>Source</span>
                        <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
