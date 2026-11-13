import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getAdjacentProjects, getProjectBySlug, projects } from "@/data/projects";
import { ArchitectureDiagram } from "@/components/case-study/ArchitectureDiagram";
import { CodeBlock } from "@/components/case-study/CodeBlock";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: `${project.name} — ${project.eyebrow}`,
    description: project.description,
    openGraph: {
      title: `${project.name} — Case Study`,
      description: project.impact,
      type: "article",
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { prev, next, index } = getAdjacentProjects(slug);
  const indexLabel = String(index + 1).padStart(2, "0");
  const docsUrl = "docs" in project ? project.docs : undefined;

  return (
    <article className="min-h-[100dvh] overflow-x-clip bg-[#0D1117] pt-28 pb-24 text-[#E6EDF3] sm:pt-32 sm:pb-32">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(240,246,252,0.08)] pb-6 font-mono text-xs uppercase tracking-[0.16em]">
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-[#8B949E] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#38BDF8]"
          >
            <ArrowLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
            <span>All systems</span>
          </Link>
          <span className="inline-flex items-center rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3.5 py-1 text-[11px] tracking-[0.16em] text-[#38BDF8] tabular-nums">
            Case Study {indexLabel} / {String(projects.length).padStart(2, "0")}
          </span>
        </div>

        <header className="border-b border-[rgba(240,246,252,0.08)] py-12 sm:py-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#7DD3FC]">
              {project.category}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E]">
              {project.eyebrow}
            </span>
            <span
              className="hidden font-mono text-xs text-[#6E7681] sm:inline"
              aria-hidden="true"
            >
              ·
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#6E7681]">
              {project.year}
            </span>
          </div>

          <h1 className="mt-5 font-display text-[clamp(2.85rem,8vw,6.5rem)] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[#E6EDF3]">
            {project.name}
          </h1>

          <p className="mt-6 max-w-[65ch] font-sans text-lg leading-relaxed text-[#8B949E] sm:text-xl">
            {project.description}
          </p>

          <p className="mt-5 max-w-[65ch] border-l-2 border-[#38BDF8] pl-4 font-sans text-base leading-relaxed text-[#E6EDF3] sm:text-[17px]">
            {project.impact}
          </p>

          {project.services.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#6E7681]">
              <span>Scope:</span>
              {project.services.map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-[rgba(240,246,252,0.08)] bg-[#161B22] px-2.5 py-0.5 text-[#8B949E]"
                >
                  {service}
                </span>
              ))}
            </div>
          )}

          {/* Metrics Strip — Double-Bezel */}
          <div className="double-bezel-outer mt-10">
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[calc(1.75rem-0.375rem)] border border-[rgba(240,246,252,0.08)] bg-[rgba(240,246,252,0.06)] sm:grid-cols-2 md:grid-cols-4">
              {project.highlightMetrics.map((metric) => (
                <div key={metric.label} className="bg-[#161B22] p-5 sm:p-6">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6E7681]">
                    {metric.label}
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-bold leading-none tracking-tight text-[#E6EDF3] tabular-nums sm:text-4xl">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3 py-1 font-mono text-xs text-[#8B949E]"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-5 pr-2 text-sm font-semibold text-[#0D1117] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#7DD3FC] active:scale-[0.98]"
              >
                <span>Source repository</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                  <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                </span>
              </a>

              {docsUrl && (
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] py-2 pl-5 pr-2 text-sm font-medium text-[#E6EDF3] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8] hover:text-[#38BDF8] active:scale-[0.98]"
                >
                  <span>Live docs</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1C222B] text-[#E6EDF3] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:bg-[#38BDF8]/15 group-hover:text-[#38BDF8]">
                    <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                  </span>
                </a>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 border-b border-[rgba(240,246,252,0.08)] py-16 md:grid-cols-2 md:gap-8">
          <div className="double-bezel-outer">
            <div className="double-bezel-core h-full p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
                Problem Statement
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
                The{" "}
                <em className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  problem
                </em>
              </h2>
              <p className="mt-4 max-w-[65ch] font-sans text-base leading-[1.75] text-[#8B949E] sm:text-[17px]">
                {project.challenge}
              </p>
            </div>
          </div>

          <div className="double-bezel-outer">
            <div className="double-bezel-core h-full p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
                System Architecture
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
                The{" "}
                <em className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">
                  architecture
                </em>
              </h2>
              <p className="mt-4 max-w-[65ch] font-sans text-base leading-[1.75] text-[#8B949E] sm:text-[17px]">
                {project.approach}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[rgba(240,246,252,0.08)] py-16">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
                Execution Topology
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
                Execution topology
              </h2>
            </div>
            <p className="font-mono text-xs text-[#6E7681]">
              Click any stage or step through the request flow
            </p>
          </div>
          <ArchitectureDiagram
            architecture={project.architecture}
            projectName={project.name}
          />
        </section>

        <section className="border-b border-[rgba(240,246,252,0.08)] py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
            Engineering Notes
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
            Engineering lessons
          </h2>
          <ol className="mt-8 space-y-4">
            {project.lessons.map((lesson, idx) => (
              <li key={lesson} className="double-bezel-outer">
                <div className="double-bezel-core flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 font-mono text-xs font-medium text-[#7DD3FC]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="max-w-[68ch] font-sans text-base leading-[1.75] text-[#8B949E] sm:text-[17px]">
                    {lesson}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-b border-[rgba(240,246,252,0.08)] py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
            Core Implementation
          </p>
          <h2 className="mb-8 mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
            Implementation excerpt
          </h2>
          <CodeBlock language={project.codeLanguage} code={project.codeSnippet} />
        </section>

        <nav
          aria-label="Adjacent case studies"
          className="grid grid-cols-1 gap-4 pt-14 md:grid-cols-2"
        >
          <Link
            href={`/work/${prev.slug}`}
            className="double-bezel-outer group block transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/45 active:scale-[0.99]"
          >
            <div className="double-bezel-core flex h-full flex-col justify-between p-6 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[#1C222B]">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6E7681] transition-colors duration-300 group-hover:text-[#38BDF8]">
                <ArrowLeft className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
                <span>Previous system</span>
              </div>
              <div className="mt-3">
                <div className="font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3]">
                  {prev.name}
                </div>
                <div className="mt-1.5 font-sans text-sm text-[#8B949E]">
                  {prev.eyebrow}
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={`/work/${next.slug}`}
            className="double-bezel-outer group block text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#38BDF8]/45 active:scale-[0.99] md:text-right"
          >
            <div className="double-bezel-core flex h-full flex-col justify-between p-6 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[#1C222B]">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6E7681] transition-colors duration-300 group-hover:text-[#38BDF8] md:justify-end">
                <span>Next system</span>
                <ArrowRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
              </div>
              <div className="mt-3">
                <div className="font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3]">
                  {next.name}
                </div>
                <div className="mt-1.5 font-sans text-sm text-[#8B949E]">
                  {next.eyebrow}
                </div>
              </div>
            </div>
          </Link>
        </nav>
      </div>
    </article>
  );
}
