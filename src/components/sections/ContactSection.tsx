"use client";

import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  Check,
  Copy,
  EnvelopeSimple,
  FilePdf,
} from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { useCopy } from "@/hooks/usePortfolioUtils";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { KineticHeading } from "@/components/motion/KineticText";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { AskTerminal } from "./AskTerminal";
import { SectionReveal } from "./SectionReveal";

const LazyTelemetryGlobe3D = dynamic(
  () =>
    import("@/components/canvas/TelemetryGlobe3D").then(
      (mod) => mod.TelemetryGlobe3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-[265px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/60 sm:h-[295px]">
        <svg
          viewBox="0 0 240 240"
          className="h-44 w-44 opacity-50"
          aria-hidden="true"
        >
          <circle
            cx="120"
            cy="120"
            r="84"
            fill="none"
            stroke="rgba(56,189,248,0.28)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="120"
            cy="120"
            rx="42"
            ry="84"
            fill="none"
            stroke="rgba(240,246,252,0.12)"
            strokeWidth="1"
          />
          <line
            x1="36"
            y1="120"
            x2="204"
            y2="120"
            stroke="rgba(240,246,252,0.12)"
            strokeWidth="1"
          />
          <line
            x1="120"
            y1="36"
            x2="120"
            y2="204"
            stroke="rgba(240,246,252,0.12)"
            strokeWidth="1"
          />
        </svg>
        <span className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
          Initializing telemetry globe...
        </span>
      </div>
    ),
  }
);

export function ContactSection() {
  const { copied, copy } = useCopy(2000);

  return (
    <section
      id="contact"
      className="overflow-x-clip bg-[#0D1117] py-28 sm:py-36 lg:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 border-b border-[rgba(240,246,252,0.08)] pb-12 lg:grid-cols-12">
          <SectionReveal className="lg:col-span-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#7DD3FC]">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
                <span>{profile.status}</span>
              </div>

              <KineticHeading
                as="h2"
                className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,6.5vw,5.4rem)] font-bold uppercase leading-[0.9] tracking-[-0.02em] text-[#E6EDF3]"
              >
                LET&apos;S BUILD SOMETHING{" "}
                <span className="text-[#38BDF8]">DETERMINISTIC.</span>
              </KineticHeading>

              <p className="mt-5 max-w-[46ch] font-sans text-base leading-relaxed text-[#9DA7B3] sm:text-lg">
                Available for AI engineering, LLM serving, and backend teams.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <MagneticButton>
                  <a
                    href={`mailto:${profile.email}`}
                    className="group inline-flex min-h-[46px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-6 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#7DD3FC] active:scale-[0.98]"
                  >
                    <EnvelopeSimple className="h-4 w-4" weight="regular" aria-hidden="true" />
                    <span>Email · {profile.email}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 text-[#0D1117]">
                      <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                    </span>
                  </a>
                </MagneticButton>

                <button
                  type="button"
                  onClick={() => void copy(profile.email)}
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[#10B981]" weight="regular" aria-hidden="true" />
                      <span className="text-[#10B981]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#9DA7B3]" weight="regular" aria-hidden="true" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>

                <TransitionLink
                  href="/brief"
                  className="group inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  <span>Recruiter Brief</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    weight="regular"
                    aria-hidden="true"
                  />
                </TransitionLink>

                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  <FilePdf className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                  <span>Resume PDF</span>
                </a>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal variant="scrub-depth" className="lg:col-span-5">
            <div className="double-bezel-outer">
              <div className="double-bezel-core overflow-hidden p-3">
                <LazyTelemetryGlobe3D />
              </div>
            </div>
          </SectionReveal>
        </div>

        <AskTerminal />
      </div>
    </section>
  );
}
