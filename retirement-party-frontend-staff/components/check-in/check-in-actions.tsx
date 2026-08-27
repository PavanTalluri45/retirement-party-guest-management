import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttendeeInfo } from "@/lib/check-in/types";

interface CheckInActionsProps {
  attendee: AttendeeInfo;
  loading: boolean;
  onCheckIn: () => void;
  onResetForm: () => void;
}

export function CheckInActions({
  attendee,
  loading,
  onCheckIn,
  onResetForm,
}: CheckInActionsProps) {
  return (
    <div className="border-t border-border/70 bg-muted/30 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Check-In Status
          </div>
          <div className="mt-1 flex items-center gap-2">
            {attendee.attended ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Checked in
                {attendee.attendedAt && (
                  <span className="font-semibold text-muted-foreground">
                    • at{" "}
                    {new Date(attendee.attendedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                Not checked in yet
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          {!attendee.attended && attendee.attending === "Yes" && (
            <Button size="lg" onClick={onCheckIn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing</span>
                </>
              ) : (
                <span>Check In Attendee</span>
              )}
            </Button>
          )}

          {attendee.attended && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Entry Authorized & Recorded
            </div>
          )}

          {attendee.attending !== "Yes" && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive">
              <AlertCircle className="h-4 w-4" />
              Registration Not Confirmed
            </div>
          )}

          {/* Secondary Action: Verify Another */}
          <Button variant="outline" size="lg" onClick={onResetForm}>
            Verify Another Attendee
          </Button>
        </div>
      </div>
    </div>
  );
}
