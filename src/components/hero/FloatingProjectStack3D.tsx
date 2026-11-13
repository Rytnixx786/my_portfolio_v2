"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Cpu,
  Database,
  GitBranch,
  ShieldCheck,
} from "@phosphor-icons/react";
import { projects } from "@/data/projects";
import { getCategoryHue } from "@/lib/palette";

const FLAGSHIP_SLUGS = ["cinch", "nexus-researcher", "ares", "mindstack"] as const;

interface FloatingProjectStack3DProps {
  className?: string;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
}

function SystemGlyph({ slug, color }: { slug: string; color: string }) {
  switch (slug) {
    case "nexus-researcher":
      return <GitBranch className="h-4 w-4" style={{ color }} weight="regular" aria-hidden="true" />;
    case "ares":
      return <ShieldCheck className="h-4 w-4" style={{ color }} weight="regular" aria-hidden="true" />;
    case "mindstack":
      return <Database className="h-4 w-4" style={{ color }} weight="regular" aria-hidden="true" />;
    default:
      return <Cpu className="h-4 w-4" style={{ color }} weight="regular" aria-hidden="true" />;
  }
}

export function FloatingProjectStack3D({
  className = "",
  activeIndex = 0,
  onActiveChange,
}: FloatingProjectStack3DProps) {
  const deck = FLAGSHIP_SLUGS.map((slug) => projects.find((p) => p.slug === slug)!);
  const safeIndex = ((activeIndex % deck.length) + deck.length) % deck.length;
  const current = deck[safeIndex];
  const hue = getCategoryHue(current.category);

  return (
    <div
      className={`double-bezel-outer ${className}`}
      role="region"
      aria-label="Flagship systems quick switcher"
    >
      <div className="double-bezel-core p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 border-b border-[rgba(240,246,252,0.08)] pb-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#9DA7B3]">
            <SystemGlyph slug={current.slug} color={hue.hex} />
            <span className="font-semibold text-[#E6EDF3]">
              0{safeIndex + 1} / 0{deck.length}
            </span>
            <span style={{ color: hue.labelText }}>{current.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onActiveChange?.((safeIndex - 1 + deck.length) % deck.length)}
              aria-label="Previous featured system"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
            >
              <CaretLeft className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onActiveChange?.((safeIndex + 1) % deck.length)}
              aria-label="Next featured system"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
            >
              <CaretRight className="h-4 w-4" weight="regular" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.12em]" style={{ color: hue.labelText }}>
              {current.category}
            </p>
            <p className="mt-1 font-sans text-sm leading-snug text-[#9DA7B3]">
              {current.eyebrow}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {current.highlightMetrics.slice(0, 2).map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] px-3 py-1.5"
              >
                <p className="font-mono text-sm font-bold text-[#E6EDF3] tabular-nums">
                  {m.value}
                </p>
                <p className="font-mono text-xs text-[#8B949E]">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            {deck.map((item, idx) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => onActiveChange?.(idx)}
                aria-label={`Select ${item.name}`}
                aria-pressed={idx === safeIndex}
                className={`rounded-full px-2.5 py-1 font-mono text-xs transition-colors ${
                  idx === safeIndex
                    ? "bg-[#38BDF8]/15 font-semibold text-[#7DD3FC]"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                }`}
              >
                {item.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <Link
            href={`/work/${current.slug}`}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#38BDF8] transition-colors hover:text-[#7DD3FC]"
          >
            <span>Inspect</span>
            <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
