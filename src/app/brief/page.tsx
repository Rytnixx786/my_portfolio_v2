import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, FilePdf } from "@phosphor-icons/react/dist/ssr";
import { evidence, experience, lab, profile, stack } from "@/data/site";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Recruiter Brief & Technical Summary",
  description:
    "Printable one-page recruiter and hiring manager summary covering Mehedi Hasan's FlyRank internship, systems benchmarks, and production code repositories.",
  alternates: { canonical: "/brief" },
};

export default function BriefPage() {
  return (
    <section className="min-h-[100dvh] bg-[#0D1117] pt-28 pb-20 text-[#E6EDF3] sm:pt-32">
      <div className="mx-auto max-w-[980px] px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(240,246,252,0.08)] pb-5 font-mono text-xs uppercase tracking-[0.14em]">
          <Link href="/" className="inline-flex items-center gap-2 text-[#9DA7B3] hover:text-[#38BDF8]">
            <ArrowLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
            <span>Back to Portfolio</span>
          </Link>
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#38BDF8] px-4 py-1.5 font-semibold text-[#0D1117] hover:bg-[#7DD3FC]"
          >
            <FilePdf className="h-4 w-4" weight="regular" aria-hidden="true" />
            <span>Download Resume PDF</span>
          </a>
        </div>

        <header className="border-b border-[rgba(240,246,252,0.08)] py-10">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#38BDF8]">
            One-Page Recruiter Brief · {profile.availabilityShort}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,4.5rem)] font-bold uppercase leading-[0.96] text-[#E6EDF3]">
            {profile.name}
          </h1>
          <p className="mt-3 max-w-[65ch] font-sans text-base leading-relaxed text-[#9DA7B3]">
            {profile.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-4 font-mono text-xs text-[#E6EDF3]">
            <a href={`mailto:${profile.email}`} className="underline decoration-[#38BDF8]">
              {profile.email}
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#38BDF8]">
              github.com/{profile.githubHandle}
            </a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#38BDF8]">
              linkedin.com/in/{profile.linkedinHandle}
            </a>
          </div>
        </header>

        <section className="border-b border-[rgba(240,246,252,0.08)] py-10">
          <h2 className="font-display text-2xl font-bold uppercase text-[#E6EDF3]">
            Experience &amp; Education
          </h2>
          <div className="mt-5 space-y-4">
            {experience.map((item) => (
              <div
                key={item.org}
                className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-5"
              >
                <div className="flex flex-wrap justify-between gap-2 font-mono text-xs text-[#38BDF8]">
                  <span>
                    {item.role} - {item.org}
                  </span>
                  <span>{item.period}</span>
                </div>
                <p className="mt-2 font-sans text-sm leading-relaxed text-[#9DA7B3]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[rgba(240,246,252,0.08)] py-10">
          <h2 className="font-display text-2xl font-bold uppercase text-[#E6EDF3]">
            Measured Systems Matrix
          </h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22]">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] text-[#9DA7B3]">
                  <th className="p-3.5">System</th>
                  <th className="p-3.5">Metric</th>
                  <th className="p-3.5">Baseline</th>
                  <th className="p-3.5">Result</th>
                  <th className="p-3.5">Deep Dive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(240,246,252,0.06)] text-[#E6EDF3]">
                {evidence.map((row) => (
                  <tr key={`${row.project}-${row.label}`}>
                    <td className="p-3.5 font-semibold">{row.project}</td>
                    <td className="p-3.5 text-[#9DA7B3]">{row.label}</td>
                    <td className="p-3.5 text-[#8B949E]">{row.from}</td>
                    <td className="p-3.5 text-[#10B981]">{row.to}</td>
                    <td className="p-3.5">
                      <Link href={row.href} className="inline-flex items-center gap-1 text-[#38BDF8]">
                        <span>Open</span>
                        <ArrowUpRight className="h-3 w-3" weight="regular" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 py-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-[#E6EDF3]">
              Shipped Repositories
            </h2>
            <ul className="mt-4 space-y-2.5 font-sans text-sm text-[#9DA7B3]">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/work/${p.slug}`} className="font-semibold text-[#E6EDF3] hover:text-[#38BDF8]">
                    {p.name}
                  </Link>{" "}
                  - {p.eyebrow}
                </li>
              ))}
              {lab.slice(0, 3).map((l) => (
                <li key={l.name}>
                  <strong className="text-[#E6EDF3]">{l.name}</strong> - {l.note}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-[#E6EDF3]">
              Core Stack Summary
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              {stack.map((layer) => (
                <div key={layer.code}>
                  <dt className="font-mono text-xs uppercase text-[#38BDF8]">{layer.layer}</dt>
                  <dd className="mt-0.5 text-[#9DA7B3]">{layer.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </section>
  );
}

