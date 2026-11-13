"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  EnvelopeSimple,
  FilePdf,
} from "@phosphor-icons/react";
import { nav, profile } from "@/data/site";
import { useWebGLContext } from "@/components/canvas/WebGLContextProvider";
import { TelemetryGlobe3D } from "@/components/canvas/TelemetryGlobe3D";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { AskTerminal } from "./AskTerminal";
import { SectionReveal } from "./SectionReveal";

export function ContactSection() {
  const { hasMounted, effectiveTier, webglSupported } = useWebGLContext();
  const [copied, setCopied] = useState(false);
  const showGlobe = hasMounted && webglSupported && effectiveTier !== "low";

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  }

  return (
    <footer
      id="contact"
      className="overflow-x-clip bg-[#0D1117] pt-24 pb-14 sm:pt-32"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <SectionReveal>
          <div className="grid grid-cols-1 items-center gap-10 border-b border-[rgba(240,246,252,0.08)] pb-14 lg:grid-cols-12">
            <div className={showGlobe ? "lg:col-span-8" : "lg:col-span-12"}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7DD3FC]">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
                <span>{profile.status}</span>
              </div>

              <h2 className="mt-6 max-w-5xl font-display text-[clamp(2.85rem,7vw,6rem)] font-bold uppercase leading-[0.9] tracking-[-0.02em] text-[#E6EDF3]">
                LET&apos;S BUILD SOMETHING{" "}
                <span className="text-[#38BDF8]">DETERMINISTIC.</span>
              </h2>

              <p className="mt-5 max-w-[56ch] font-sans text-base leading-relaxed text-[#8B949E] sm:text-lg">
                Open to AI systems, LLM serving, and backend engineering roles in
                2026. Reach out directly by email or interrogate my verified benchmarks below.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3.5">
                <MagneticButton>
                  <a
                    href={`mailto:${profile.email}`}
                    className="group inline-flex items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-6 pr-2 font-sans text-sm font-semibold text-[#0D1117] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#7DD3FC] active:scale-[0.98]"
                  >
                    <EnvelopeSimple className="h-4 w-4" weight="regular" aria-hidden="true" />
                    <span>Let&apos;s Talk · {profile.email}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 text-[#0D1117] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                      <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                    </span>
                  </a>
                </MagneticButton>

                <button
                  type="button"
                  onClick={() => void copyEmail()}
                  className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.98]"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[#10B981]" weight="regular" aria-hidden="true" />
                      <span className="text-[#10B981]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#8B949E]" weight="regular" aria-hidden="true" />
                      <span>Copy email</span>
                    </>
                  )}
                </button>

                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-sans text-sm font-medium text-[#E6EDF3] transition-all duration-300 hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                </a>

                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 font-sans text-sm font-medium text-[#E6EDF3] transition-all duration-300 hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
                </a>

                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/10 px-5 font-sans text-sm font-medium text-[#7DD3FC] transition-all duration-300 hover:border-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0D1117]"
                >
                  <FilePdf className="h-4 w-4" weight="regular" aria-hidden="true" />
                  <span>Résumé (PDF)</span>
                  <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                </a>
              </div>
            </div>

            {showGlobe && (
              <div className="double-bezel-outer lg:col-span-4">
                <div className="double-bezel-core overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.08)] bg-[#161B22] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B949E]">
                    <span className="font-semibold text-[#E6EDF3]">Telemetry Node</span>
                    <span className="text-[#38BDF8]">Drag Globe</span>
                  </div>
                  <TelemetryGlobe3D />
                </div>
              </div>
            )}
          </div>

          <AskTerminal />

          <div className="mt-14 flex flex-col justify-between gap-6 border-t border-[rgba(240,246,252,0.08)] pt-8 md:flex-row md:items-center">
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E] transition-colors hover:text-[#38BDF8]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#6E7681]">
              <span>
                © 2026 {profile.name} · {profile.location} ({profile.utc})
              </span>
            </div>
          </div>
        </SectionReveal>
      </div>
    </footer>
  );
}
