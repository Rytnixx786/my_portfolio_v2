import { codeToHtml } from "shiki";
import { CopyButton } from "./CopyButton";

interface CodeBlockProps {
  language: string;
  code: string;
  label?: string;
  sourceRef?: string;
}

/**
 * Server-rendered Shiki syntax highlighter shipping zero highlighter JS to the browser.
 */
export async function CodeBlock({
  language,
  code,
  label = "Implementation Excerpt",
  sourceRef,
}: CodeBlockProps) {
  const lineCount = code.split("\n").length;

  let highlightedHtml = "";
  try {
    highlightedHtml = await codeToHtml(code, {
      lang: language === "typescript" ? "typescript" : "python",
      theme: "github-dark-default",
    });
  } catch {
    highlightedHtml = "";
  }

  return (
    <div className="double-bezel-outer w-full min-w-0">
      <div className="double-bezel-core min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,246,252,0.08)] bg-[#1C222B] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="uppercase tracking-[0.14em] text-[#38BDF8]">
              {language} · {label}
            </span>
            {sourceRef && (
              <span className="rounded bg-[#0D1117] px-2 py-0.5 text-[#9DA7B3]">
                {sourceRef}
              </span>
            )}
            <span className="hidden text-[#8B949E] sm:inline">{lineCount} lines</span>
          </div>

          <CopyButton text={code} label="Copy snippet" />
        </div>

        {highlightedHtml ? (
          <div
            className="editorial-scroll overflow-x-auto bg-[#0D1117] p-4 font-mono text-xs leading-[1.7] sm:p-6 sm:text-[13px] [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="editorial-scroll overflow-x-auto bg-[#0D1117] p-4 font-mono text-xs leading-[1.7] text-[#E6EDF3] sm:p-6 sm:text-[13px]">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
