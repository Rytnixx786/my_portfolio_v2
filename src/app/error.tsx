"use client";

import { useEffect } from "react";
import { ArrowCounterClockwise, House } from "@phosphor-icons/react";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { MagneticButton } from "@/components/motion/MagneticButton";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("Portfolio pipeline fault caught by error boundary:", error.message);
  }, [error]);

  return (
    <section className="flex min-h-[80dvh] items-center justify-center bg-[#0D1117] px-4 py-24 sm:px-8">
      <div className="double-bezel-outer w-full max-w-xl">
        <div className="double-bezel-core p-6 text-center sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F43F5E]/40 bg-[#F43F5E]/10 px-3.5 py-1 font-mono text-xs uppercase tracking-[0.16em] text-[#FDA4AF]">
            <span className="h-2 w-2 rounded-full bg-[#F43F5E]" aria-hidden="true" />
            <span>Pipeline Fault · Retry</span>
          </div>

          <h1 className="mt-5 font-display text-[clamp(2.4rem,5vw,3.8rem)] font-bold uppercase leading-[0.94] tracking-tight text-[#E6EDF3]">
            CIRCUIT{" "}
            <span className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
              tripped.
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-[44ch] font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
            An unexpected exception occurred while rendering this route. Re-arm the segment or return to the primary systems index.
          </p>

          {error.digest && (
            <p className="mt-4 inline-block rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-3 py-1.5 font-mono text-xs text-[#8B949E] tabular-nums">
              fault digest · {error.digest}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton>
              <button
                type="button"
                onClick={reset}
                className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-full bg-[#38BDF8] py-2 pl-5 pr-4 font-sans text-sm font-semibold text-[#0D1117] transition-[background-color,color,transform] duration-500 ease-[var(--ease-editorial)] hover:bg-[#7DD3FC] active:scale-[0.98]"
              >
                <ArrowCounterClockwise className="h-4 w-4 transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:-rotate-90" weight="regular" aria-hidden="true" />
                <span>Reset Pipeline</span>
              </button>
            </MagneticButton>

            <TransitionLink
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.14)] bg-[#161B22] px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#E6EDF3] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.98]"
            >
              <House className="h-4 w-4 text-[#38BDF8]" weight="regular" aria-hidden="true" />
              <span>Return Home</span>
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
