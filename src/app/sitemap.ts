import type { MetadataRoute } from "next";
import { profile } from "@/data/site";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const caseStudies: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${profile.url}/work/${project.slug}`,
    lastModified: new Date("2026-11-13"),
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [
    {
      url: profile.url,
      lastModified: new Date("2026-11-13"),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...caseStudies,
  ];
}

