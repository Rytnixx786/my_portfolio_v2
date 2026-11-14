import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ArrowUpRight, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { getAdjacentProjects, getProjectBySlug, projects } from "@/data/projects";
import { profile } from "@/data/site";
import { getCategoryHue } from "@/lib/palette";
import { ArchitectureDiagram } from "@/components/case-study/ArchitectureDiagram";
import { CaseStudySectionNav } from "@/components/case-study/CaseStudySectionNav";
import { CodeBlock } from "@/components/case-study/CodeBlock";
import { CopyButton } from "@/components/case-study/CopyButton";
import { EvalComparisonChart } from "@/components/case-study/EvalComparisonChart";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { SectionReveal } from "@/components/sections/SectionReveal";

export const dynamicParams = false;

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

  const canonical = `/work/${slug}`;
  const ogImage = `/work/${slug}/opengraph-image`;

  return {
    title: `${project.name} - ${project.eyebrow}`,
    description: project.description,
    alternates: { canonical },
    openGraph: {
      title: `${project.name} - Case Study`,
      description: project.impact,
      url: canonical,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} - Case Study`,
      description: project.impact,
      images: [ogImage],
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
  const hue = getCategoryHue(project.category);

  const wordCount = [
    project.description,
    project.impact,
    project.methodology,
    project.challenge,
    project.approach,
    ...project.constraints,
    ...project.tradeoffs,
    ...project.failures,
    ...project.lessons,
    project.nextSteps,
  ]
    .join(" ")
    .trim()
    .split(/\s+/).length;
  const readMinutes = Math.max(2, Math.ceil(wordCount / 180));

  const tocItems = [
    { href: "#benchmarks", label: "Benchmarks" },
    { href: "#architecture", label: "Architecture" },
    { href: "#topology", label: "Topology" },
    { href: "#failures", label: "Failures" },
    { href: "#implementation", label: "Code" },
    { href: "#next-steps", label: "Next Steps" },
  ] as const;

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.name,
    description: project.description,
    codeRepository: project.href,
    programmingLanguage: project.tech,
    dateCreated: `${project.year}-01-01`,
    author: {
      "@type": "Person",
      "@id": `${profile.url}/#person`,
      name: profile.name,
      url: profile.url,
    },
    url: `${profile.url}/work/${project.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: profile.url },
      { "@type": "ListItem", position: 2, name: "Selected Work", item: `${profile.url}/#work` },
      {
        "@type": "ListItem",
        position: 3,
        name: project.name,
        item: `${profile.url}/work/${project.slug}`,
      },
    ],
  };

  return (
    <article className="min-h-[100dvh] overflow-x-clip bg-[#0D1117] pt-28 pb-24 text-[#E6EDF3] sm:pt-32 sm:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([softwareJsonLd, breadcrumbJsonLd]),
        }}
      />

      <div className="mx-auto max-w-[1160px] px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(240,246,252,0.08)] pb-6 font-mono text-xs uppercase tracking-[0.14em]">
          <TransitionLink
            href="/#work"
            className="group inline-flex min-h-[44px] items-center gap-2 text-[#9DA7B3] transition-colors hover:text-[#38BDF8]"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              weight="regular"
              aria-hidden="true"
            />
            <span>All systems</span>
          </TransitionLink>
          <span
            className="inline-flex items-center rounded-full border px-3.5 py-1 text-xs tabular-nums"
            style={{
              borderColor: hue.border,
              backgroundColor: hue.softBg,
              color: hue.labelText,
            }}
          >
            Case Study {indexLabel} / {String(projects.length).padStart(2, "0")}
          </span>
        </div>

        {/* Header & Provenance */}
        <header className="border-b border-[rgba(240,246,252,0.08)] py-12 sm:py-16">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.12em]">
            <span
              className="inline-flex items-center rounded-full border px-3.5 py-1"
              style={{
                borderColor: hue.border,
                backgroundColor: hue.softBg,
                color: hue.labelText,
              }}
            >
              {project.category}
            </span>
            <span className="text-[#9DA7B3]">{project.role}</span>
            <span className="text-[#8B949E]" aria-hidden="true">
              ·
            </span>
            <span className="text-[#8B949E]">
              {project.year} ({project.timeline})
            </span>
            <span className="text-[#8B949E]" aria-hidden="true">
              ·
            </span>
            <span className="text-[#8B949E] tabular-nums">
              {readMinutes} min read
            </span>
          </div>

          <CaseStudySectionNav items={tocItems} />

          <h1 className="mt-5 font-display text-[clamp(2.85rem,8vw,6.2rem)] font-bold uppercase leading-[0.98] tracking-[-0.02em] text-[#E6EDF3]">
            {project.name}
          </h1>

          <p className="mt-5 max-w-[65ch] font-sans text-lg leading-relaxed text-[#9DA7B3] sm:text-xl">
            {project.description}
          </p>

          <p
            className="mt-5 max-w-[65ch] border-l-2 pl-4 font-sans text-base leading-relaxed text-[#E6EDF3] sm:text-[17px]"
            style={{ borderColor: hue.hex }}
          >
            {project.impact}
          </p>

          {/* Metrics Strip */}
          <div className="double-bezel-outer mt-10">
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[calc(1.75rem-0.375rem)] border border-[rgba(240,246,252,0.08)] bg-[rgba(240,246,252,0.06)] sm:grid-cols-2 md:grid-cols-4">
              {project.highlightMetrics.map((metric) => (
                <div key={metric.label} className="bg-[#161B22] p-5 sm:p-6">
                  <dt className="font-mono text-xs uppercase tracking-[0.12em] text-[#8B949E]">
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
                  className="rounded-full border border-[rgba(240,246,252,0.1)] bg-[#161B22] px-3 py-1 font-mono text-xs text-[#9DA7B3]"
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
                className="group inline-flex min-h-[44px] items-center gap-3 rounded-full bg-[#38BDF8] py-2 pl-5 pr-2 text-sm font-semibold text-[#0D1117] transition-all duration-300 hover:bg-[#7DD3FC]"
              >
                <span>Source repository</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1117]/15">
                  <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                </span>
              </a>

              {docsUrl && (
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[rgba(240,246,252,0.12)] bg-[#161B22] px-5 py-2 text-sm font-medium text-[#E6EDF3] hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  <span>Live docs</span>
                  <ArrowUpRight className="h-4 w-4" weight="regular" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Baseline vs Engineered Visual Chart + Reproducibility */}
        <SectionReveal>
          <section id="benchmarks" className="scroll-mt-28 space-y-6 border-b border-[rgba(240,246,252,0.08)] py-14">
            <EvalComparisonChart series={project.evalSeries} accentHex={hue.hex} />

            <div className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                    Measurement Methodology &amp; Verification
                  </p>
                  <p className="mt-2 max-w-[68ch] font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                    {project.methodology}
                  </p>
                </div>
                <CopyButton text={project.reproduceCmd} label="Copy command" />
              </div>
              <pre className="editorial-scroll mt-4 overflow-x-auto rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-4 py-3 font-mono text-xs text-[#E6EDF3]">
                <code>$ {project.reproduceCmd}</code>
              </pre>
            </div>
          </section>
        </SectionReveal>

        {/* Problem & Architecture */}
        <SectionReveal>
          <section id="architecture" className="scroll-mt-28 grid grid-cols-1 gap-6 border-b border-[rgba(240,246,252,0.08)] py-14 md:grid-cols-2 md:gap-8">
            <div className="double-bezel-outer">
              <div className="double-bezel-core h-full p-6 sm:p-8">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                  Problem Statement
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
                  The <em className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">problem</em>
                </h2>
                <p className="mt-4 max-w-[65ch] font-sans text-base leading-[1.75] text-[#9DA7B3]">
                  {project.challenge}
                </p>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-core h-full p-6 sm:p-8">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                  System Architecture
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
                  The <em className="font-serif-detail font-normal italic lowercase text-[#38BDF8]">architecture</em>
                </h2>
                <p className="mt-4 max-w-[65ch] font-sans text-base leading-[1.75] text-[#9DA7B3]">
                  {project.approach}
                </p>
              </div>
            </div>
          </section>
        </SectionReveal>

        {/* Constraints & Key Tradeoffs */}
        <SectionReveal>
          <section className="grid grid-cols-1 gap-6 border-b border-[rgba(240,246,252,0.08)] py-14 md:grid-cols-2 md:gap-8">
            <div className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                Hard Constraints
              </p>
              <ul className="mt-4 space-y-3">
                {project.constraints.map((c) => (
                  <li key={c} className="font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                    • {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#161B22] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#10B981]">
                Engineering Tradeoffs
              </p>
              <ul className="mt-4 space-y-3">
                {project.tradeoffs.map((t) => (
                  <li key={t} className="font-sans text-sm leading-relaxed text-[#9DA7B3] sm:text-base">
                    • {t}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </SectionReveal>

        {/* Interactive Topology */}
        <SectionReveal>
          <section id="topology" className="scroll-mt-28 border-b border-[rgba(240,246,252,0.08)] py-14">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
                  Execution Topology
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
                  Interactive Stage Graph
                </h2>
              </div>
              <p className="font-mono text-xs text-[#8B949E]">
                Toggle between 2D Graph and 3D Spatial Orbit stages
              </p>
            </div>
            <ArchitectureDiagram
              architecture={project.architecture}
              projectName={project.name}
            />
          </section>
        </SectionReveal>

        {/* What I Got Wrong + Engineering Lessons */}
        <SectionReveal>
          <section id="failures" className="scroll-mt-28 border-b border-[rgba(240,246,252,0.08)] py-14">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#F59E0B]">
              Failure Analysis &amp; Lessons
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
              What broke early &amp; what shipped
            </h2>

            <div className="mt-8 space-y-4">
              {project.failures.map((failure) => (
                <div
                  key={failure}
                  className="flex items-start gap-4 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/8 p-5"
                >
                  <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]" weight="regular" aria-hidden="true" />
                  <p className="font-sans text-sm leading-relaxed text-[#E6EDF3] sm:text-base">
                    {failure}
                  </p>
                </div>
              ))}
            </div>

            <ol className="mt-6 space-y-4">
              {project.lessons.map((lesson, idx) => (
                <li key={lesson} className="double-bezel-outer">
                  <div className="double-bezel-core flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 font-mono text-xs font-semibold text-[#7DD3FC]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="max-w-[68ch] font-sans text-base leading-[1.75] text-[#9DA7B3]">
                      {lesson}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div
              id="next-steps"
              className="scroll-mt-28 mt-8 rounded-2xl border border-[#38BDF8]/25 bg-[#38BDF8]/[0.06] p-6"
            >
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#7DD3FC]">
                If I Did It Again &middot; Next Steps
              </p>
              <p className="mt-2.5 max-w-[68ch] font-sans text-sm leading-relaxed text-[#E6EDF3] sm:text-base">
                {project.nextSteps}
              </p>
            </div>
          </section>
        </SectionReveal>

        {/* Server-Side Shiki Highlighted Snippet */}
        <SectionReveal>
          <section id="implementation" className="scroll-mt-28 border-b border-[rgba(240,246,252,0.08)] py-14">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#38BDF8]">
              Core Implementation
            </p>
            <h2 className="mb-8 mt-2 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-[#E6EDF3] sm:text-4xl">
              Implementation excerpt
            </h2>
            <CodeBlock
              language={project.codeLanguage}
              code={project.codeSnippet}
              label={project.codeLabel}
              sourceRef={project.sourceRef}
            />
          </section>
        </SectionReveal>

        {/* Adjacent Case Studies */}
        <nav
          aria-label="Adjacent case studies"
          className="grid grid-cols-1 gap-4 pt-12 md:grid-cols-2"
        >
          <TransitionLink
            href={`/work/${prev.slug}`}
            className="double-bezel-outer group block transition-colors hover:border-[#38BDF8]/45"
          >
            <div className="double-bezel-core flex h-full flex-col justify-between p-6 group-hover:bg-[#1C222B]">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E] group-hover:text-[#38BDF8]">
                <ArrowLeft
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                  weight="regular"
                  aria-hidden="true"
                />
                <span>Previous system</span>
              </div>
              <div className="mt-3">
                <div className="font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                  {prev.name}
                </div>
                <div className="mt-1 font-sans text-sm text-[#9DA7B3]">{prev.eyebrow}</div>
              </div>
            </div>
          </TransitionLink>

          <TransitionLink
            href={`/work/${next.slug}`}
            className="double-bezel-outer group block text-left transition-colors hover:border-[#38BDF8]/45 md:text-right"
          >
            <div className="double-bezel-core flex h-full flex-col justify-between p-6 group-hover:bg-[#1C222B]">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#8B949E] group-hover:text-[#38BDF8] md:justify-end">
                <span>Next system</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  weight="regular"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3">
                <div className="font-display text-3xl font-bold uppercase tracking-tight text-[#E6EDF3]">
                  {next.name}
                </div>
                <div className="mt-1 font-sans text-sm text-[#9DA7B3]">{next.eyebrow}</div>
              </div>
            </div>
          </TransitionLink>
        </nav>
      </div>
    </article>
  );
}
