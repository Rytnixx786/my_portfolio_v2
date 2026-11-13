"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useCopy } from "@/hooks/usePortfolioUtils";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const { copied, copy } = useCopy(1800);

  return (
    <button
      type="button"
      onClick={() => void copy(text)}
      aria-label={copied ? "Copied to clipboard" : `Copy ${label.toLowerCase()} to clipboard`}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 py-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors ${
        copied
          ? "border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]"
          : "border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#9DA7B3] hover:border-[#38BDF8] hover:text-[#38BDF8]"
      }`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#10B981]" weight="regular" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" weight="regular" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

