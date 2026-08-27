import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AttendeeInfo } from "@/lib/check-in/types";

interface AttendeeProfileHeaderProps {
  attendee: AttendeeInfo;
}

export function AttendeeProfileHeader({ attendee }: AttendeeProfileHeaderProps) {
  return (
    <div className="border-b border-border/70 bg-muted/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Primary Identity */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {attendee.fullName}
              </h2>
              <Badge
                variant={attendee.attending === "Yes" ? "default" : "destructive"}
                className="text-[11px] font-semibold"
              >
                {attendee.attending === "Yes" ? "ATTENDING" : "NOT ATTENDING"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm font-semibold text-muted-foreground">
                Code:{" "}
                <span className="text-foreground font-semibold">
                  {attendee.confirmationNumber}
                </span>
              </span>

              <span className="text-sm font-semibold text-muted-foreground">
                Phone:{" "}
                <span className="text-foreground font-semibold">
                  {attendee.phoneNumber}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Verification Confirmation Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="h-3.5 w-3.5" />
          <span>Verified Guest</span>
        </div>
      </div>
    </div>
  );
}
