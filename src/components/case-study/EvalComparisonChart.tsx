import type { EvalSeriesPoint } from "@/data/projects";

export function EvalComparisonChart({
  series,
  accentHex,
}: {
  series: ReadonlyArray<EvalSeriesPoint>;
  accentHex: string;
}) {
  return (
    <div className="double-bezel-outer">
      <div className="double-bezel-core p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(240,246,252,0.08)] pb-3 font-mono text-xs uppercase tracking-[0.12em]">
          <span className="text-[#E6EDF3]">Baseline vs Engineered Control</span>
          <div className="flex items-center gap-4 text-[#9DA7B3]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#303946]" /> Baseline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: accentHex }} /> Engineered
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {series.map((point) => {
            const maxVal = Math.max(point.baseline, point.current, 1);
            const basePct = Math.max(6, Math.round((point.baseline / maxVal) * 100));
            const currPct = Math.max(6, Math.round((point.current / maxVal) * 100));

            return (
              <div
                key={point.label}
                className="rounded-2xl border border-[rgba(240,246,252,0.08)] bg-[#0D1117] p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-[#9DA7B3]">
                    {point.label}
                  </p>
                  <span className="font-mono text-xs text-[#8B949E]">{point.unit}</span>
                </div>

                <div className="mt-4 space-y-2.5 font-mono text-xs tabular-nums">
                  <div>
                    <div className="mb-1 flex justify-between text-[#8B949E]">
                      <span>Baseline</span>
                      <span>{point.baseline}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#161B22]">
                      <div
                        className="h-full rounded-full bg-[#444D5A]"
                        style={{ width: `${basePct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between font-semibold text-[#E6EDF3]">
                      <span>Engineered</span>
                      <span style={{ color: accentHex }}>{point.current}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#161B22]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${currPct}%`, backgroundColor: accentHex }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

