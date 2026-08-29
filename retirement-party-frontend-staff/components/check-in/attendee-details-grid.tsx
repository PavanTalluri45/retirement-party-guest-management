import type { AttendeeInfo } from "@/lib/check-in/types";

interface AttendeeDetailsGridProps {
  attendee: AttendeeInfo;
}

export function AttendeeDetailsGrid({ attendee }: AttendeeDetailsGridProps) {
  // Calculate how many guests are accompanying the primary attendee
  const accompanyingCount =
    attendee.familyMembers && attendee.familyMembers.length > 0
      ? attendee.familyMembers.length
      : Math.max(0, (attendee.familyCount || 1) - 1);


  // Format primary attendee meal preference
  const rawMeal = Array.isArray(attendee.mealPreferences)
    ? attendee.mealPreferences.join(", ")
    : attendee.mealPreference || attendee.mealPreferences || "VEG";

  const formattedMeal =
    rawMeal.toUpperCase() === "VEG"
      ? "Vegetarian"
      : rawMeal.toUpperCase() === "NON_VEG"
        ? "Non-Vegetarian"
        : rawMeal;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Tile 1: Confirmation # */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5 flex flex-col justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Confirmation Code
        </div>
        <div className="mt-1.5 font-mono text-base font-bold text-foreground">
          {attendee.confirmationNumber || "—"}
        </div>
      </div>

      {/* Tile 2: Registration Timestamp */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5 flex flex-col justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Registered On
        </div>
        <div className="mt-1.5 text-sm font-semibold text-foreground">
          {attendee.createdAt || attendee.registeredAt
            ? new Date(
                attendee.createdAt || attendee.registeredAt!,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </div>
      </div>

      {/* Tile 3: Meal Preference */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5 flex flex-col justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Meal Preference
        </div>
        <div className="mt-1.5 text-sm font-semibold text-foreground">
          {formattedMeal}
        </div>
      </div>

      {/* Tile 4: Party / Family Size */}
      <div className="rounded-lg border border-border/60 bg-muted/10 p-3.5 flex flex-col justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Party / Family Size
        </div>
        <div className="mt-1.5">
          <div className="text-sm font-semibold text-foreground">
            {accompanyingCount === 0
              ? "0 (Solo attendee)"
              : `${accompanyingCount} ${
                  accompanyingCount === 1
                    ? "accompanying guest"
                    : "accompanying guests"
                }`}
          </div>
        </div>
      </div>
    </div>
  );
}
