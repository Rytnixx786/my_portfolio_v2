import Link from "next/link";
import { profile } from "@/data/site";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-[rgba(240,246,252,0.08)] bg-[#0D1117] py-8 text-[#8B949E]"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 font-mono text-xs sm:flex-row sm:items-center sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[#E6EDF3]">{profile.name}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.role}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.availabilityShort}</span>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-5">
          <Link href="/brief" className="transition-colors hover:text-[#38BDF8]">
            Recruiter Brief
          </Link>
          <Link href="/uses" className="transition-colors hover:text-[#38BDF8]">
            Uses
          </Link>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#38BDF8]"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#38BDF8]"
          >
            LinkedIn
          </a>
          <a href={`mailto:${profile.email}`} className="transition-colors hover:text-[#38BDF8]">
            Email
          </a>
        </nav>
      </div>
    </footer>
  );
}

