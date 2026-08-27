import type { RSVPData, RSVPFormValues, Attending } from "@/types/rsvp";
import { MOCK_CONFIRMATION_NUMBER } from "./constants";

/**
 * Maps raw react-hook-form values into the shape the confirmation
 * screen expects. Pure UI-side mapping only — no network/database calls.
 */
export function buildConfirmationData(data: RSVPFormValues): RSVPData {
  const isAttending = data.attending === "Yes";

  const familyMembers = isAttending
    ? (data.familyMembers ?? [])
        .slice(0, Math.max(data.familyCount - 1, 0))
        .map((member) => ({
          name: member.name,
          mealPreference: member.mealPreference,
        }))
    : [];

  return {
    fullName: data.fullName,
    phoneNumber: data.phoneNumber,
    attending: data.attending as Attending,
    familyCount: isAttending ? data.familyCount : 0,
    mealPreference: isAttending ? data.mealPreference : "",
    familyMembers,
    ...(isAttending ? { confirmationNumber: MOCK_CONFIRMATION_NUMBER } : {}),
  };
}
