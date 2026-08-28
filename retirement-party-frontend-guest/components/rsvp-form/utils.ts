import type { RSVPData, RSVPFormValues, Attending } from "@/types/rsvp";

/**
 * Formats client RSVP data with real confirmation number returned from backend.
 */
export function buildConfirmationData(
  data: RSVPFormValues,
  confirmationNumber?: string
): RSVPData {
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
    ...(isAttending && confirmationNumber ? { confirmationNumber } : {}),
  };
}
