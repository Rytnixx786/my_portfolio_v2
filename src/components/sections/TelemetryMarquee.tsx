import { evidence } from "@/data/site";

const MARQUEE_ITEMS = [
  ...evidence.map((item) => ({
    metric: `${item.value}${item.unit}`,
    label: `${item.project} · ${item.label}`,
    context: item.to,
  })),
  {
    metric: "14-STAGE",
    label: "Async FastAPI Gateway · Cinch",
    context: "PID + FinOps + k3d HPA",
  },
  {
    metric: "95.2%",
    label: "3D CCTA Stenosis · CAD-RADS",
    context: "RASNet + SegResNet PyTorch 3D",
  },
] as const;

export function TelemetryMarquee() {
  return (
    <section
      aria-label="Verified system telemetry summary"
      className="group relative overflow-hidden border-y border-[rgba(240,246,252,0.08)] bg-[#161B22]/70 py-3.5"
    >
      {/* Edge Vignettes for Smooth Fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0D1117] to-transparent sm:w-28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0D1117] to-transparent sm:w-28"
      />

      <div className="animate-telemetry-marquee flex w-max items-center gap-6 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:px-4">
        {[0, 1].map((pass) => (
          <div
            key={pass}
            aria-hidden={pass === 1}
            className={`flex shrink-0 items-center gap-6 ${
              pass === 1 ? "motion-reduce:hidden" : ""
            }`}
          >
            {MARQUEE_ITEMS.map((entry, idx) => (
              <div
                key={`${pass}-${entry.label}-${idx}`}
                className="flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em]"
              >
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-2 py-0.5 font-semibold text-[#38BDF8] tabular-nums">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                    aria-hidden="true"
                  />
                  {entry.metric}
                </span>
                <span className="font-medium text-[#E6EDF3]">{entry.label}</span>
                <span className="text-[#8B949E]">{entry.context}</span>
                <span className="pl-2 text-[#6E7681]" aria-hidden="true">
                  /
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

