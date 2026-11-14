"use client";

import Link from "next/link";
import { ArrowUpRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { projects } from "@/data/projects";
import { getCategoryHue } from "@/lib/palette";

const FLAGSHIP_SLUGS = ["cinch", "nexus-researcher", "ares", "mindstack"] as const;

interface FloatingProjectStack3DProps {
  className?: string;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
}

/**
 * Compact 1-bar flagship orbital selector paired beneath the Hero 3D stage.
 */
export function FloatingProjectStack3D({
  className = "",
  activeIndex = 0,
  onActiveChange,
}: FloatingProjectStack3DProps) {
  const deck = FLAGSHIP_SLUGS.map((slug) => projects.find((p) => p.slug === slug)!);
  const safeIndex = ((activeIndex % deck.length) + deck.length) % deck.length;
  const current = deck[safeIndex];
  const hue = getCategoryHue(current.category);
  const topMetric = current.highlightMetrics[0];

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onActiveChange?.((safeIndex - 1 + deck.length) % deck.length);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onActiveChange?.((safeIndex + 1) % deck.length);
        }
      }}
      className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#161B22]/90 px-3.5 py-2 ${className}`}
      role="region"
      aria-label="Flagship systems quick switcher"
    >
      <div className="flex flex-wrap items-center gap-1">
        {deck.map((item, idx) => {
          const isCurrent = idx === safeIndex;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => onActiveChange?.(idx)}
              aria-label={`Select ${item.name}`}
              aria-pressed={isCurrent}
              className={`min-h-[44px] rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                isCurrent
                  ? "bg-[#38BDF8]/15 font-semibold text-[#7DD3FC]"
                  : "text-[#8B949E] hover:text-[#E6EDF3]"
              }`}
            >
              {item.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {topMetric && (
          <span
            className="hidden font-mono text-xs tabular-nums sm:inline"
            style={{ color: hue.labelText }}
          >
            {topMetric.value}
          </span>
        )}

        <button
          type="button"
          onClick={() => onActiveChange?.((safeIndex - 1 + deck.length) % deck.length)}
          aria-label="Previous featured system"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
        >
          <CaretLeft className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onActiveChange?.((safeIndex + 1) % deck.length)}
          aria-label="Next featured system"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(240,246,252,0.12)] bg-[#0D1117] text-[#9DA7B3] transition-colors hover:border-[#38BDF8] hover:text-[#E6EDF3]"
        >
          <CaretRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
        </button>

        <Link
          href={`/work/${current.slug}`}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-[#0D1117] px-3.5 font-mono text-xs text-[#38BDF8] transition-colors hover:text-[#7DD3FC]"
        >
          <span>Open</span>
          <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
