"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Briefcase, GraduationCap, MapPin } from "@phosphor-icons/react";
import { principles, profile } from "@/data/site";
import { SectionReveal } from "./SectionReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MANIFESTO_WORDS = [
  "Models",
  "are",
  "stochastic.",
  "Systems",
  "engineering",
  "cannot",
  "be.",
] as const;

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const manifestoRef = useRef<HTMLHeadingElement>(null);
  const portraitWrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = manifestoRef.current;
      const portrait = portraitWrapRef.current;
      if (!el) return;

      const words = el.querySelectorAll<HTMLElement>("[data-scrub-word]");

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (words.length > 0) {
          gsap.fromTo(
            words,
            { opacity: 0.2 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top 92%",
                end: "top 55%",
                scrub: 0.4,
              },
            }
          );
        }

        if (portrait) {
          gsap.fromTo(
            portrait,
            { scale: 0.94 },
            {
              scale: 1,
              ease: "none",
              clearProps: "transform",
              scrollTrigger: {
                trigger: portrait,
                start: "top 95%",
                end: "top 55%",
                scrub: 0.4,
              },
            }
          );
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="overflow-x-clip border-b border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] pb-4 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
          <span>Background</span>
          <span className="text-[#38BDF8]">
            {profile.location} · {profile.utc}
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* Left 5 Cols: Monochrome Portrait */}
          <div ref={portraitWrapRef} className="min-w-0 lg:col-span-5">
            <SectionReveal>
              <div className="double-bezel-outer">
                <div className="double-bezel-core overflow-hidden p-2.5 sm:p-3">
                  <div className="group relative aspect-[4/4.6] overflow-hidden rounded-[calc(1.75rem-0.85rem)] bg-[#0D1117]">
                    <Image
                      src={profile.portrait}
                      alt={`${profile.name} portrait`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover object-top grayscale contrast-125 transition-all duration-700 group-hover:scale-[1.02] group-hover:grayscale-0"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-[#38BDF8]/10 opacity-75"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-3.5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#9DA7B3]">
                    <span className="font-semibold text-[#E6EDF3]">{profile.name}</span>
                    <span className="text-[#38BDF8]">{profile.role}</span>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>

          {/* Right 7 Cols: Manifesto + Principles */}
          <div className="min-w-0 space-y-8 lg:col-span-7">
            <h2
              ref={manifestoRef}
              aria-label="Models are stochastic. Systems engineering cannot be."
              className="font-display text-[clamp(2.35rem,4.6vw,4rem)] font-bold uppercase leading-[0.96] tracking-[-0.02em] text-[#E6EDF3]"
            >
              {MANIFESTO_WORDS.map((word, idx) => (
                <span
                  key={`${word}-${idx}`}
                  data-scrub-word
                  aria-hidden="true"
                  className={`mr-[0.22em] inline-block ${
                    idx >= 3 && idx <= 4 ? "text-[#38BDF8]" : ""
                  }`}
                >
                  {word}
                </span>
              ))}
            </h2>

            <p className="max-w-[60ch] font-sans text-base leading-relaxed text-[#9DA7B3] sm:text-lg">
              {profile.summary}
            </p>

            <div className="flex flex-wrap gap-3 font-mono text-xs text-[#9DA7B3]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3.5 py-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span>FlyRank Intern</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3.5 py-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span>BRAC University CSE</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3.5 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                <span>{profile.location}</span>
              </span>
            </div>

            <ol className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              {principles.map((item) => (
                <li
                  key={item.k}
                  className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-5"
                >
                  <p className="font-mono text-xs font-semibold text-[#38BDF8] tabular-nums">
                    {item.k}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                    {item.t}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-[#9DA7B3]">
                    {item.d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
