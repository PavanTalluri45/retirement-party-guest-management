"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { RSVPFormValues } from "@/types/rsvp";
import { SESSION_STORAGE_KEY } from "../constants";
import { buildConfirmationData } from "../utils";

const DEFAULT_VALUES: RSVPFormValues = {
  fullName: "",
  phoneNumber: "",
  attending: "",
  familyCount: 1,
  mealPreference: "",
  familyMembers: [],
};

/**
 * THE BUG (and the fix):
 *
 * `mealPreference` and every `familyMembers.*` field only render
 * conditionally (when attending === "Yes", and only up to the current
 * family count). React Hook Form's default is `shouldUnregister: false`,
 * meaning a field that has ever mounted STAYS registered — with its
 * validation rules still active — even after the JSX that renders it
 * unmounts.
 *
 * Concretely: pick "Attending: Yes", bump the guest count up, then back
 * down (or flip to "No"). The now-hidden guest/meal fields are still
 * registered as required, still empty, so `handleSubmit` keeps failing
 * validation on every click — with no visible error, since the field
 * that's technically invalid isn't even on screen. That's the "phantom
 * validation error" that blocked navigation to /confirmation.
 *
 * `shouldUnregister: true` makes RHF drop a field's value + validation
 * state as soon as it unmounts, so only fields the user can currently
 * see are ever validated.
 */
export function useRsvpForm() {
  const router = useRouter();

  const form = useForm<RSVPFormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
    shouldUnregister: true,
  });

  const attending = form.watch("attending");
  const familyCount = form.watch("familyCount");

  const onSubmit = form.handleSubmit((data) => {
    const confirmationData = buildConfirmationData(data);

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(confirmationData));

    router.push("/confirmation");
  });

  return {
    ...form,
    attending,
    familyCount,
    onSubmit,
  };
}
