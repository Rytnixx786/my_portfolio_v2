"use client";

import { ArrowUp } from "@phosphor-icons/react";
import { profile } from "@/data/site";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { SectionReveal } from "@/components/sections/SectionReveal";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-8 text-[#8B949E] sm:py-10"
    >
      <SectionReveal className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 font-mono text-xs sm:flex-row sm:items-center sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[#E6EDF3]">{profile.name}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.role}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.availabilityShort}</span>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <TransitionLink
            href="/brief"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            Recruiter Brief
          </TransitionLink>
          <TransitionLink
            href="/uses"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            Uses
          </TransitionLink>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex min-h-[44px] items-center transition-colors hover:text-[#38BDF8]"
          >
            Email
          </a>
          <button
            type="button"
            onClick={() => window.__portfolioScrollTo?.(0)}
            className="group inline-flex min-h-[44px] items-center gap-1.5 text-[#9DA7B3] transition-colors hover:text-[#38BDF8]"
          >
            <span>Return to top</span>
            <ArrowUp
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5"
              weight="regular"
              aria-hidden="true"
            />
          </button>
        </nav>
      </SectionReveal>
    </footer>
  );
}

