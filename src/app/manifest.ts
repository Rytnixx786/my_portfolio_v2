import type { MetadataRoute } from "next";
import { profile } from "@/data/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} - ${profile.role}`,
    short_name: profile.name,
    description: profile.summary,
    start_url: "/",
    display: "standalone",
    background_color: "#0D1117",
    theme_color: "#0D1117",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

