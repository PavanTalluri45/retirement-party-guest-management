
"use client";

import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RSVPFormValues } from "@/types/rsvp";
import { FAMILY_COUNT_OPTIONS } from "../constants";

interface FamilyCountSectionProps {
  control: Control<RSVPFormValues>;
}

/**
 * The original version tracked this count in its own `useState` that was
 * never wired back into react-hook-form, so whatever the user picked here
 * was silently discarded — the submitted `familyCount` was always stuck at
 * its default. Binding this Select through a Controller makes the visible
 * selection and the submitted value the same source of truth.
 */
export function FamilyCountSection({ control }: FamilyCountSectionProps) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[#292929]">
          Guests Attending
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#777]">
          How many people will be attending in your family, including you?
        </p>
      </div>

      <Controller
        name="familyCount"
        control={control}
        render={({ field }) => (
          <Select
            value={String(field.value)}
            onValueChange={(value) => field.onChange(Number(value))}
          >
            <SelectTrigger className="h-11 w-full bg-white">
              <SelectValue placeholder="Select number of attendees" />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_COUNT_OPTIONS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} {count === 1 ? "person" : "people"}
                  {count === 1 ? " (Just me)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </section>
  );
}