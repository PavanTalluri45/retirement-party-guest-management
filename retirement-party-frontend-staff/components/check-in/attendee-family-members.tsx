import { Fragment } from "react";
import type { FamilyMember } from "@/lib/check-in/types";
import { Users } from "lucide-react";

interface AttendeeFamilyMembersProps {
  members: (string | FamilyMember)[];
}

export function AttendeeFamilyMembers({ members }: AttendeeFamilyMembersProps) {
  if (!members || members.length === 0) return null;

  // Normalize entries to { name, mealPreference }
  const normalizedMembers: FamilyMember[] = members.map((m) =>
    typeof m === "string" ? { name: m, mealPreference: "VEG" } : m,
  );

  return (
    <div className="mt-4">
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Accompanied Family Members ({normalizedMembers.length})</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {normalizedMembers.map((member, index) => {
          const pref = (member.mealPreference || "VEG").toUpperCase();
          const isVeg = pref === "VEG" || pref === "VEGETARIAN";

          return (
            <Fragment key={index}>
              {/* Name tile — same size/style as AttendeeDetailsGrid tiles */}
              <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-muted/10 p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Family Member {index + 1}
                </div>
                <div className="mt-1.5 truncate text-sm font-semibold text-foreground">
                  {member.name}
                </div>
              </div>

              {/* Meal preference tile — kept in its own grid cell, aligned under the previous meal tile */}
              <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-muted/10 p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Meal Preference
                </div>
                <div className="mt-1.5">
                  <span className="mt-1.5 truncate text-sm font-semibold text-foreground">
                    {isVeg ? "Vegetarian" : "Non-Vegetarian"}
                  </span>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
