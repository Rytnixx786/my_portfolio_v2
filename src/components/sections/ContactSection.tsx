"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  EnvelopeSimple,
  FilePdf,
} from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { useCopy } from "@/hooks/usePortfolioUtils";
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
      <div className="flex h-[265px] w-full items-center justify-center rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]/60 font-mono text-xs text-[#8B949E] sm:h-[295px]">
        Loading telemetry globe...
      </div>
    ),
  }
);

export function ContactSection() {
  const { copied, copy } = useCopy(2000);

  return (
    <section
      id="contact"
      className="overflow-x-clip bg-[#0D1117] pt-20 pb-16 sm:pt-28 sm:pb-20"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="grid grid-cols-1 items-center gap-10 border-b border-[rgba(240,246,252,0.08)] pb-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#7DD3FC]">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
                <span>{profile.status}</span>
              </div>

              <h2 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,6.5vw,5.4rem)] font-bold uppercase leading-[0.9] tracking-[-0.02em] text-[#E6EDF3]">
                LET&apos;S BUILD SOMETHING{" "}
                <span className="text-[#38BDF8]">DETERMINISTIC.</span>
              </h2>

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

                <Link
                  href="/brief"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-mono text-xs uppercase tracking-[0.12em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  <span>Recruiter Brief</span>
                  <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                </Link>

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

            <div className="lg:col-span-5">
              <div className="double-bezel-outer">
                <div className="double-bezel-core overflow-hidden p-3">
                  <LazyTelemetryGlobe3D />
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>

        <AskTerminal />
      </div>
    </section>
  );
}
