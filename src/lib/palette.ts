import { converter, formatHex } from "culori";
import type { ProjectCategory } from "@/data/projects";

export const UI_ACCENT = "#38BDF8";
export const UI_ACCENT_HOVER = "#7DD3FC";
export const CANVAS_BG = "#0D1117";
export const SURFACE_BG = "#161B22";
export const SURFACE_MUTED_BG = "#1C222B";

export const STATE_HEALTHY = "#10B981";
export const STATE_WARN = "#F59E0B";
export const STATE_FAULT = "#EF4444";

export interface CategoryHueSpec {
  id: "sky" | "rose" | "lime" | "apricot";
  category: ProjectCategory;
  oklch: string;
  hex: string;
  softBg: string;
  border: string;
  labelText: string;
}

const toRgb = converter("rgb");

function oklchToHex(oklchCss: string, fallback: string): string {
  try {
    const parsed = toRgb(oklchCss);
    return parsed ? (formatHex(parsed) ?? fallback) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Calibrated OKLCH category hues (Section 6.2 & 7.2).
 * Purple/violet (#A855F7) is explicitly excluded; all accents preserve >= 4.5:1 text contrast on #0D1117.
 */
export const CATEGORY_HUES: Record<ProjectCategory, CategoryHueSpec> = {
  "Inference & Serving": {
    id: "sky",
    category: "Inference & Serving",
    oklch: "oklch(0.78 0.14 215)",
    hex: oklchToHex("oklch(0.78 0.14 215)", "#59C5EE"),
    softBg: "rgba(110, 195, 238, 0.12)",
    border: "rgba(110, 195, 238, 0.36)",
    labelText: "#7DD3FC",
  },
  "Agents & RAG": {
    id: "rose",
    category: "Agents & RAG",
    oklch: "oklch(0.78 0.12 350)",
    hex: oklchToHex("oklch(0.78 0.12 350)", "#EB99BB"),
    softBg: "rgba(235, 153, 187, 0.12)",
    border: "rgba(235, 153, 187, 0.36)",
    labelText: "#F5B8D0",
  },
  "MLOps & Security": {
    id: "lime",
    category: "MLOps & Security",
    oklch: "oklch(0.80 0.13 135)",
    hex: oklchToHex("oklch(0.80 0.13 135)", "#A8CE6C"),
    softBg: "rgba(168, 206, 108, 0.12)",
    border: "rgba(168, 206, 108, 0.36)",
    labelText: "#BFE085",
  },
  "Mobile & Systems": {
    id: "apricot",
    category: "Mobile & Systems",
    oklch: "oklch(0.80 0.12 55)",
    hex: oklchToHex("oklch(0.80 0.12 55)", "#EEAE73"),
    softBg: "rgba(238, 174, 115, 0.12)",
    border: "rgba(238, 174, 115, 0.36)",
    labelText: "#F5C293",
  },
};

export const HERO_ORBIT_HUES = [
  CATEGORY_HUES["Inference & Serving"].hex,
  CATEGORY_HUES["MLOps & Security"].hex,
  CATEGORY_HUES["Agents & RAG"].hex,
  CATEGORY_HUES["Agents & RAG"].hex,
  CATEGORY_HUES["MLOps & Security"].hex,
] as const;

export function getCategoryHue(category: string): CategoryHueSpec {
  if (category in CATEGORY_HUES) {
    return CATEGORY_HUES[category as ProjectCategory];
  }
  return CATEGORY_HUES["Inference & Serving"];
}

export const STACK_LAYER_HUES = [
  CATEGORY_HUES["Inference & Serving"].hex,
  CATEGORY_HUES["Agents & RAG"].hex,
  UI_ACCENT,
  CATEGORY_HUES["MLOps & Security"].hex,
  STATE_WARN,
  CATEGORY_HUES["Mobile & Systems"].hex,
] as const;

