"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lineCount = code.split("\n").length;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  }

  return (
    <div className="double-bezel-outer w-full min-w-0">
      <div className="double-bezel-core min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#38BDF8]">
              {language} · Production excerpt
            </span>
            <span className="hidden font-mono text-[11px] text-[#6E7681] sm:inline">
              {lineCount} lines
            </span>
          </div>

          <button
            type="button"
            onClick={() => void copyCode()}
            aria-label={copied ? "Code copied to clipboard" : "Copy code to clipboard"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
              copied
                ? "border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]"
                : "border-[rgba(240,246,252,0.12)] bg-[#161B22] text-[#8B949E] hover:border-[#38BDF8] hover:text-[#38BDF8]"
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
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="editorial-scroll overflow-x-auto bg-[#0D1117] p-4 font-mono text-xs leading-[1.7] text-[#E6EDF3] sm:p-6 sm:text-[13px]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
