"use client";

import { Controller } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { RSVPFormValues } from "@/types/rsvp";
import { MEAL_OPTIONS } from "../constants";
import { FamilyMembersSection } from "./FamilyMembersSection";

interface MealPreferenceSectionProps {
  control: Control<RSVPFormValues>;
  register: UseFormRegister<RSVPFormValues>;
  errors: FieldErrors<RSVPFormValues>;
  watch: UseFormWatch<RSVPFormValues>;
  familyCount: number;
}

export function MealPreferenceSection({
  control,
  register,
  errors,
  watch,
  familyCount,
}: MealPreferenceSectionProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#292929]">
          Meal Preferences
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#777]">
          Everyone can choose their own meal preference.
        </p>
      </div>

      <div className="space-y-6">
        {/* Primary attendee */}
        <Card>
          <CardHeader>
            <CardTitle>{watch("fullName") || "You"}</CardTitle>
            <CardDescription>Primary attendee</CardDescription>
          </CardHeader>

          <CardContent>
            <Controller
              name="mealPreference"
              control={control}
              rules={{
                validate: (value) => !!value || "Please select your meal preference",
              }}
              render={({ field }) => (
                <RadioGroup
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {MEAL_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <RadioGroupItem value={option} />
                      <span
                        className={`text-sm ${
                          field.value === option
                            ? "font-semibold text-[#292929]"
                            : "font-medium text-[#555]"
                        }`}
                      >
                        {option}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />

            {errors.mealPreference && (
              <p className="mt-2 text-sm text-red-500">
                {errors.mealPreference.message}
              </p>
            )}
          </CardContent>
        </Card>

        {familyCount > 1 && (
          <FamilyMembersSection
            control={control}
            register={register}
            errors={errors}
            familyCount={familyCount}
          />
        )}
      </div>
    </section>
  );
}