"use client";

import { Controller } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { RSVPFormValues } from "@/types/rsvp";
import { MEAL_OPTIONS } from "../constants";

interface FamilyMemberCardProps {
  index: number;
  control: Control<RSVPFormValues>;
  register: UseFormRegister<RSVPFormValues>;
  errors: FieldErrors<RSVPFormValues>;
}

export function FamilyMemberCard({
  index,
  control,
  register,
  errors,
}: FamilyMemberCardProps) {
  const memberNumber = index + 2;
  const fieldError = errors.familyMembers?.[index];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest {memberNumber}</CardTitle>
        <CardDescription>Family member</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label
            htmlFor={`family-member-${index}`}
            className="text-sm font-medium text-[#333]"
          >
            Full Name
            <span className="ml-1 text-red-500">*</span>
          </Label>

          <Input
            id={`family-member-${index}`}
            placeholder={`Enter guest ${memberNumber}'s name`}
            className="h-11 bg-white"
            {...register(`familyMembers.${index}.name` as const, {
              required: "Guest name is required",
            })}
          />

          {fieldError?.name && (
            <p className="text-sm text-red-500">{fieldError.name.message}</p>
          )}
        </div>

        {/* Meal */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#333]">
            Meal Preference
            <span className="ml-1 text-red-500">*</span>
          </Label>

          <Controller
            name={`familyMembers.${index}.mealPreference` as const}
            control={control}
            rules={{ validate: (value) => !!value || "Please select a meal preference" }}
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

          {fieldError?.mealPreference && (
            <p className="text-sm text-red-500">{fieldError.mealPreference.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}