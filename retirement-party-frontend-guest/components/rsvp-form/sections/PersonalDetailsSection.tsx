"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizePhoneNumber } from "@/lib/api";
import type { RSVPFormValues } from "@/types/rsvp";

interface PersonalDetailsSectionProps {
  register: UseFormRegister<RSVPFormValues>;
  errors: FieldErrors<RSVPFormValues>;
}

export function PersonalDetailsSection({
  register,
  errors,
}: PersonalDetailsSectionProps) {
  const phoneField = register("phoneNumber", {
    required: "Phone number is required",
    pattern: {
      value: /^[0-9]{10}$/,
      message: "Enter a valid 10-digit phone number",
    },
    setValueAs: (value: string) => sanitizePhoneNumber(value),
  });

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#292929]">Your Details</h2>
        <p className="mt-1 text-sm text-[#777]">
          Please provide your contact information.
        </p>
      </div>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label
            htmlFor="fullName"
            className="text-sm font-medium text-[#333]"
          >
            Full Name
            <span className="-ml-1 text-red-500">*</span>
          </Label>

          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            className="h-11 bg-white"
            {...register("fullName", { required: "Full name is required" })}
          />

          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label
            htmlFor="phoneNumber"
            className="text-sm font-medium text-[#333]"
          >
            Phone Number
            <span className="-ml-1 text-red-500">*</span>
          </Label>

          <Input
            id="phoneNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter your 10-digit phone number"
            className="h-11 bg-white"
            {...phoneField}
            onChange={(event) => {
              const cleaned = sanitizePhoneNumber(event.target.value);
              event.target.value = cleaned;
              phoneField.onChange(event);
            }}
          />

          {errors.phoneNumber && (
            <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>
    </section>
  );
}