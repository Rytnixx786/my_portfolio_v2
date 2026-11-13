import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { stack } from "@/data/site";

export const metadata: Metadata = {
  title: "Uses & Engineering Tooling",
  description:
    "The languages, serving runtimes, databases, testing frameworks, and evaluation pipelines behind my AI infrastructure builds.",
  alternates: { canonical: "/uses" },
};

export default function UsesPage() {
  return (
    <section className="min-h-[100dvh] bg-[#0D1117] pt-28 pb-20 text-[#E6EDF3] sm:pt-32">
      <div className="mx-auto max-w-[980px] px-4 sm:px-8">
        <div className="border-b border-[rgba(240,246,252,0.08)] pb-5 font-mono text-xs uppercase tracking-[0.14em]">
          <Link href="/" className="inline-flex items-center gap-2 text-[#9DA7B3] hover:text-[#38BDF8]">
            <ArrowLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
            <span>Back to Portfolio</span>
          </Link>
        </div>

        <header className="py-10">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#38BDF8]">
            Colophon &amp; Runtime Setup
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,4.5rem)] font-bold uppercase leading-[0.96] text-[#E6EDF3]">
            Engineering Tooling
          </h1>
          <p className="mt-3 max-w-[60ch] font-sans text-base leading-relaxed text-[#9DA7B3]">
            Tools, protocols, and evaluation stacks chosen for deterministic reproducibility on both
            local 8 GB VRAM GPUs and container clusters.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {stack.map((group) => (
            <div
              key={group.code}
              className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-6"
            >
              <p className="font-mono text-xs text-[#38BDF8]">
                {group.code} · {group.layer}
              </p>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#9DA7B3]">
                {group.summary}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((tool) => (
                  <li
                    key={tool}
                    className="rounded-full border border-[rgba(240,246,252,0.1)] bg-[#0D1117] px-3 py-1 font-mono text-xs text-[#E6EDF3]"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

