import { ImageResponse } from "next/og";
import { getProjectBySlug, projects } from "@/data/projects";
import { profile } from "@/data/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function CaseStudyOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug) ?? projects[0];
  const idx = projects.findIndex((p) => p.slug === project.slug) + 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          backgroundColor: "#0D1117",
          color: "#E6EDF3",
          border: "1px solid rgba(240,246,252,0.12)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#38BDF8",
            fontFamily: "monospace",
          }}
        >
          <span>SYSTEM 0{idx} · {project.category}</span>
          <span style={{ color: "#8B949E" }}>{profile.name}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#38BDF8",
              fontWeight: 500,
            }}
          >
            <span>{project.eyebrow}</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 0.98,
              color: "#E6EDF3",
            }}
          >
            <span>{project.name}</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 25,
              lineHeight: 1.4,
              color: "#8B949E",
              maxWidth: 960,
            }}
          >
            <span>{project.description}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 44,
            borderTop: "1px solid rgba(240,246,252,0.12)",
            paddingTop: 24,
            fontFamily: "monospace",
          }}
        >
          {project.highlightMetrics.slice(0, 4).map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: "#38BDF8" }}>{m.value}</span>
              <span style={{ fontSize: 15, color: "#8B949E" }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
