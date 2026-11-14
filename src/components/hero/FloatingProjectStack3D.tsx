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
 * Machined flagship orbital deck controller paired beneath the Hero 3D stage.
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
  const secondaryMetric = current.highlightMetrics[1];

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
      style={{
        boxShadow: `inset 0 1px 0 rgba(240,246,252,0.08), 0 18px 40px -24px ${hue.hex}55`,
      }}
      className={`relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-[rgba(240,246,252,0.12)] bg-gradient-to-b from-[#161B22]/95 to-[#0D1117]/95 p-2.5 backdrop-blur-md sm:p-3.5 ${className}`}
      role="region"
      aria-label="Flagship systems quick switcher"
    >
      {/* Subtle category-synced top edge hairline shimmer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px transition-colors duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${hue.hex}99, transparent)`,
        }}
      />

      {/* Top Segmented System Rail */}
      <div className="flex flex-nowrap items-center gap-1 rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117]/85 p-1">
        {deck.map((item, idx) => {
          const isCurrent = idx === safeIndex;
          const itemHue = getCategoryHue(item.category);
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => onActiveChange?.(idx)}
              aria-label={`Select ${item.name}`}
              aria-pressed={isCurrent}
              style={
                isCurrent
                  ? {
                      backgroundColor: itemHue.softBg,
                      borderColor: itemHue.border,
                      color: itemHue.labelText,
                      boxShadow: `inset 0 1px 0 rgba(240,246,252,0.08)`,
                    }
                  : undefined
              }
              className={`inline-flex min-h-[44px] flex-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-1.5 py-1 text-center font-mono text-[11px] transition-all sm:px-2.5 sm:text-xs ${
                isCurrent
                  ? "font-semibold"
                  : "border-transparent text-[#8B949E] hover:bg-[#161B22]/80 hover:text-[#E6EDF3]"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full transition-opacity"
                style={{
                  backgroundColor: itemHue.hex,
                  opacity: isCurrent ? 1 : 0.35,
                }}
              />
              <span>{item.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Telemetry Spec Panel (locked 2-tier height, 0.0px shift across systems) */}
      <div className="hidden rounded-xl border border-[rgba(240,246,252,0.07)] bg-[#0D1117]/70 px-3 py-2 sm:block">
        <div className="flex items-center justify-between gap-3 font-mono text-[11px] leading-none">
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="whitespace-nowrap font-semibold uppercase tracking-[0.1em]"
              style={{ color: hue.labelText }}
            >
              {String(safeIndex + 1).padStart(2, "0")}/04
            </span>
            <span className="text-[#8B949E]">·</span>
            <span className="whitespace-nowrap uppercase tracking-[0.08em] text-[#E6EDF3]">
              {current.category}
            </span>
          </div>
          <span className="min-w-0 truncate text-right text-[#9DA7B3]">
            {current.eyebrow}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[rgba(240,246,252,0.06)] pt-2">
          {topMetric && (
            <div className="flex min-w-0 items-baseline justify-between gap-2">
              <span className="truncate whitespace-nowrap font-mono text-[11px] text-[#9DA7B3]">
                {topMetric.label}
              </span>
              <span
                className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold tabular-nums"
                style={{ color: hue.labelText }}
              >
                {topMetric.value}
              </span>
            </div>
          )}
          {secondaryMetric && (
            <div className="flex min-w-0 items-baseline justify-between gap-2 border-l border-[rgba(240,246,252,0.08)] pl-3">
              <span className="truncate whitespace-nowrap font-mono text-[11px] text-[#9DA7B3]">
                {secondaryMetric.label}
              </span>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-[#E6EDF3] tabular-nums">
                {secondaryMetric.value}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action & Controls Row */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-2">
          {topMetric && (
            <div className="flex min-w-0 items-center gap-1.5 sm:hidden">
              <span
                className="shrink-0 font-mono text-xs font-semibold tabular-nums"
                style={{ color: hue.labelText }}
              >
                {topMetric.value}
              </span>
              <span className="truncate font-mono text-[11px] text-[#8B949E]">
                {topMetric.label}
              </span>
            </div>
          )}
          <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
            {current.tech.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[rgba(240,246,252,0.08)] bg-[#0D1117]/80 px-2 py-0.5 font-mono text-[11px] text-[#9DA7B3]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
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
            style={{
              borderColor: hue.border,
              backgroundColor: hue.softBg,
              color: hue.labelText,
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 font-mono text-xs font-medium transition-opacity hover:opacity-90"
          >
            <span>Open</span>
            <ArrowUpRight className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
