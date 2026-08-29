import type { CheckInRecord } from "@/lib/check-in/types";
import { ConfirmationChip } from "./confirmation-chip";
import { VerificationBadge } from "./verification-badge";
import { formatClock, getRecordKey } from "@/lib/check-in-history/format";

interface HistoryCardListProps {
  checkins: CheckInRecord[];
}

export function HistoryCardList({ checkins }: HistoryCardListProps) {
  return (
    <div className="divide-y divide-border/70 sm:hidden">
      {checkins.map((record) => (
        <div key={getRecordKey(record)} className="space-y-2.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {record.guestName}
            </span>
            <VerificationBadge method={record.verificationMethod} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <ConfirmationChip code={record.confirmationNumber} />
            <span>{formatClock(record.checkedInAt)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{record.guestPhone}</span>
            <span>
              Party of {record.familyCount} · {record.mealPreference || "VEG"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
