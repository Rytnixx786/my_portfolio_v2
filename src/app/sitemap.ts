import type { MetadataRoute } from "next";
import { profile } from "@/data/site";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-11-13");

  const caseStudies: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${profile.url}/work/${project.slug}`,
    lastModified: updated,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [
    {
      url: profile.url,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${profile.url}/brief`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${profile.url}/uses`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...caseStudies,
  ];
}
