"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { RSVPFormValues } from "@/types/rsvp";
import { FamilyMemberCard } from "./FamilyMemberCard";

interface FamilyMembersSectionProps {
  control: Control<RSVPFormValues>;
  register: UseFormRegister<RSVPFormValues>;
  errors: FieldErrors<RSVPFormValues>;
  familyCount: number;
}

export function FamilyMembersSection({
  control,
  register,
  errors,
  familyCount,
}: FamilyMembersSectionProps) {
  const guestIndexes = Array.from({ length: familyCount - 1 }, (_, index) => index);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <p className="text-sm font-semibold text-[#333]">Family Members</p>
        <p className="mt-1 text-xs text-[#777]">
          Enter each guest&apos;s name and meal preference.
        </p>
      </div>

      {guestIndexes.map((index) => (
        <FamilyMemberCard
          key={index}
          index={index}
          control={control}
          register={register}
          errors={errors}
        />
      ))}
    </div>
  );
}
