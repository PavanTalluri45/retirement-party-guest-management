"use client";

import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import type { RSVPFormValues } from "@/types/rsvp";

interface AttendanceSectionProps {
  control: Control<RSVPFormValues>;
  errors: FieldErrors<RSVPFormValues>;
}

export function AttendanceSection({ control, errors }: AttendanceSectionProps) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[#292929]">Attendance</h2>
        <p className="mt-1 text-sm text-[#777]">
          Let us know whether you can join the celebration.
        </p>
      </div>

      <Controller
        name="attending"
        control={control}
        rules={{ required: "Please select your attendance" }}
        render={({ field }) => (
          <RadioGroup
            value={field.value ?? ""}
            onValueChange={field.onChange}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="cursor-pointer">
              <Card
                size="sm"
                className={`transition-colors ${
                  field.value === "Yes"
                    ? "border border-[#b8b8b8] bg-[#f8f8f8]"
                    : "border border-[#e3e0d9] bg-white"
                }`}
              >
                <CardContent className="flex flex-row items-start gap-3">
                  <RadioGroupItem value="Yes" className="mt-0.5" />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        field.value === "Yes" ? "text-[#292929]" : "text-[#555]"
                      }`}
                    >
                      Yes, I&apos;ll be there
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#777]">
                      I&apos;ll join the retirement celebration.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </label>

            <label className="cursor-pointer">
              <Card
                size="sm"
                className={`transition-colors ${
                  field.value === "No"
                    ? "border border-[#b8b8b8] bg-[#f8f8f8]"
                    : "border border-[#e3e0d9] bg-white"
                }`}
              >
                <CardContent className="flex flex-row items-start gap-3">
                  <RadioGroupItem value="No" className="mt-0.5" />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        field.value === "No" ? "text-[#292929]" : "text-[#555]"
                      }`}
                    >
                      Sorry, I can&apos;t make it
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#777]">
                      I&apos;ll be unable to attend.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </label>
          </RadioGroup>
        )}
      />

      {errors.attending && (
        <p className="mt-2 text-sm text-red-500">{errors.attending.message}</p>
      )}
    </section>
  );
}