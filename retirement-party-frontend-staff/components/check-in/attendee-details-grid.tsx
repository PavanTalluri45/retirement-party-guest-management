import type { AttendeeInfo } from "@/lib/check-in/types";

interface AttendeeDetailsGridProps {
  attendee: AttendeeInfo;
}

export function AttendeeDetailsGrid({ attendee }: AttendeeDetailsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Tile 1: Confirmation # */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Confirmation Code
        </div>
        <div className="mt-1.5 text-base font-semibold text-foreground">
          {attendee.confirmationNumber}
        </div>
      </div>

      {/* Tile 2: Registration Timestamp */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Registered On
        </div>
        <div className="mt-1.5 text-sm font-semibold text-foreground">
          {new Date(attendee.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Tile 3: Meal Preference */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Meal Preference
        </div>
        <div className="mt-1.5 text-sm font-semibold text-foreground">
          {Array.isArray(attendee.mealPreferences)
            ? attendee.mealPreferences.join(", ")
            : attendee.mealPreferences || "Standard"}
        </div>
      </div>

      {/* Tile 4: Party / Family Size */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Party Size
        </div>
        <div className="mt-1.5 text-sm font-semibold text-foreground">
          {attendee.familyCount > 0
            ? `${attendee.familyCount} additional ${
                attendee.familyCount === 1 ? "guest" : "guests"
              }`
            : "Solo attendee"}
        </div>
      </div>
    </div>
  );
}
