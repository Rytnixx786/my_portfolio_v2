"use client";

import { ArrowLeft, Compass, TerminalWindow } from "@phosphor-icons/react";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { MagneticButton } from "@/components/motion/MagneticButton";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[82dvh] items-center justify-center overflow-hidden bg-[#0D1117] px-4 py-24 sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        {/* Animated 2D Broken Orbit SVG */}
        <div
          aria-hidden="true"
          className="relative mb-8 flex h-44 w-full max-w-[340px] items-center justify-center rounded-3xl border border-[rgba(240,246,252,0.1)] bg-[#161B22]/60 shadow-[var(--shadow-deep)]"
        >
          <svg viewBox="0 0 320 150" className="h-full w-full">
            <g transform="translate(160 75) rotate(-11)">
              <ellipse
                cx="0"
                cy="0"
                rx="116"
                ry="42"
                fill="none"
                stroke="#38BDF8"
                strokeOpacity="0.28"
                strokeWidth="1.5"
                strokeDasharray="10 9"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="64"
                ry="24"
                fill="none"
                stroke="rgba(240,246,252,0.16)"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="8" fill="#161B22" stroke="#38BDF8" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3" fill="#38BDF8" />
            </g>

            {/* Drifting off-track satellite beacon */}
            <g className="orbit-drift-beacon">
              <circle cx="242" cy="40" r="10" fill="rgba(245,158,11,0.16)" />
              <circle cx="242" cy="40" r="4" fill="#F59E0B" />
            </g>

            <text
              x="22"
              y="26"
              fill="#8B949E"
              fontSize="10"
              fontFamily="var(--font-mono), monospace"
            >
              ROUTE · 404
            </text>
            <text
              x="298"
              y="132"
              textAnchor="end"
              fill="#F59E0B"
              fontSize="10"
              fontFamily="var(--font-mono), monospace"
            >
              0 tok/s
            </text>
          </svg>
        </div>

        <p className="inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-3.5 py-1 font-mono text-xs uppercase tracking-[0.16em] text-[#FCD34D]">
          <span className="h-2 w-2 rounded-full bg-[#F59E0B]" aria-hidden="true" />
          <span>Route Not Found · 404 tok/s</span>
        </p>

        <h1 className="mt-5 font-display text-[clamp(2.8rem,7vw,5.2rem)] font-bold uppercase leading-[0.9] tracking-[-0.02em] text-[#E6EDF3]">
          PATHWAY{" "}
          <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
            unindexed.
          </span>
        </h1>

        <p className="mt-4 max-w-[46ch] font-sans text-base leading-relaxed text-[#9DA7B3]">
          The requested coordinate does not resolve to an active architecture case study or brief.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <MagneticButton>
            <TransitionLink
              href="/"
              className="group inline-flex min-h-[44px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-5 pr-2.5 font-sans text-sm font-semibold text-[#0D1117] transition-[background-color,color,transform] duration-500 ease-[var(--ease-editorial)] hover:bg-[#7DD3FC] active:scale-[0.98]"
            >
              <span>Return to Systems Index</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:-translate-x-[2px] group-hover:scale-105">
                <ArrowLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
              </span>
            </TransitionLink>
          </MagneticButton>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("portfolio:open-palette"))}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.98]"
          >
            <TerminalWindow className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            <span>Open Query Palette</span>
          </button>

          <TransitionLink
            href="/work/cinch"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.1)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
          >
            <Compass className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
            <span>Inspect Cinch</span>
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}
