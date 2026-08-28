"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { RSVPFormValues } from "@/types/rsvp";
import { SESSION_STORAGE_KEY } from "../constants";
import { submitRegistration, ApiError } from "@/lib/api";

const DEFAULT_VALUES: RSVPFormValues = {
  fullName: "",
  phoneNumber: "",
  attending: "",
  familyCount: 1,
  mealPreference: "",
  familyMembers: [],
};

/**
 * Custom hook to manage the RSVP form.
 *
 * Preserves `shouldUnregister: true` to prevent validation of unmounted fields.
 * Integrates real API submission through the API Gateway.
 */
export function useRsvpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RSVPFormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
    shouldUnregister: true,
  });

  const attending = form.watch("attending");
  const familyCount = form.watch("familyCount");

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const confirmedData = await submitRegistration(data);

      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(confirmedData)
      );

      router.push("/confirmation");
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError(
          "An unexpected error occurred while saving your RSVP. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    ...form,
    attending,
    familyCount,
    isSubmitting,
    submitError,
    clearError: () => setSubmitError(null),
    onSubmit,
  };
}
