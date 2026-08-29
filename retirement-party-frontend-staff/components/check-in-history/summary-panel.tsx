import type { CheckInSummary } from "@/lib/check-in/types";
import { formatClock } from "@/lib/check-in-history/format";

interface SummaryPanelProps {
  summary: CheckInSummary;
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  const metrics = [
    { label: "Total check-ins", value: summary.totalCheckIns.toLocaleString() },
    {
      label: "Most recent",
      value: summary.latestCheckIn ? formatClock(summary.latestCheckIn) : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      {metrics.map(({ label, value }) => (
        <div key={label} className="px-5 py-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 truncate text-xl font-bold tabular-nums tracking-tight text-foreground">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
