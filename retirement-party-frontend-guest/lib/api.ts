import type { RSVPFormValues, RSVPData, Attending, MealPreference } from "@/types/rsvp";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL;

export function sanitizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

/**
 * Backend API response contract
 */
interface RegistrationApiResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    name: string;
    phone: string;
    attending: boolean;
    familyCount: number;
    mealPreference?: "VEG" | "NON_VEG" | null;
    familyMembers?: Array<{
      name: string;
      mealPreference: "VEG" | "NON_VEG";
    }>;
    confirmationNumber?: string;
    registeredAt?: string;
  };
}

/**
 * Submit guest RSVP registration to the API Gateway.
 * Maps form values to backend contract and returns the confirmed RSVPData.
 */
export async function submitRegistration(
  formValues: RSVPFormValues
): Promise<RSVPData> {
  const isAttending = formValues.attending === "Yes";
  const cleanPhoneNumber = sanitizePhoneNumber(formValues.phoneNumber);

  // Build payload according to backend validation schema
  const payload: Record<string, unknown> = {
    name: formValues.fullName.trim(),
    phone: cleanPhoneNumber,
    attending: isAttending,
  };

  if (isAttending) {
    const familyCount = Number(formValues.familyCount) || 1;
    const mealPreference =
      formValues.mealPreference === "Veg" ? "VEG" : "NON_VEG";

    const extraMembersCount = Math.max(familyCount - 1, 0);
    const familyMembers = (formValues.familyMembers || [])
      .slice(0, extraMembersCount)
      .map((member) => ({
        name: member.name.trim(),
        mealPreference:
          member.mealPreference === "Veg" ? "VEG" : "NON_VEG",
      }));

    payload.familyCount = familyCount;
    payload.mealPreference = mealPreference;
    payload.familyMembers = familyMembers;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please check your internet connection and try again.",
      0
    );
  }

  let result: RegistrationApiResponse;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      `Unexpected response from server (${response.status}). Please try again.`,
      response.status
    );
  }

  if (!response.ok || !result.success) {
    if (response.status === 409) {
      throw new ApiError(
        result.message || "This phone number has already been registered for the event.",
        409
      );
    }

    if (response.status === 400) {
      throw new ApiError(
        result.message || "Please check the information entered and try again.",
        400
      );
    }

    if (response.status === 502 || response.status === 503) {
      throw new ApiError(
        "The registration service is temporarily unavailable. Please try again shortly.",
        response.status
      );
    }

    throw new ApiError(
      result.message || "An unexpected error occurred while saving your RSVP.",
      response.status
    );
  }

  const data = result.data;
  if (!data) {
    throw new ApiError("Invalid response received from server.", 500);
  }

  // Convert backend canonical values back to UI presentation types
  const mappedMealPreference: MealPreference | "" =
    data.mealPreference === "VEG"
      ? "Veg"
      : data.mealPreference === "NON_VEG"
      ? "Non-Veg"
      : "";

  const mappedFamilyMembers = (data.familyMembers || []).map((m) => ({
    name: m.name,
    mealPreference: (m.mealPreference === "VEG" ? "Veg" : "Non-Veg") as MealPreference,
  }));

  const confirmedData: RSVPData = {
    fullName: data.name,
    phoneNumber: data.phone,
    attending: (data.attending ? "Yes" : "No") as Attending,
    familyCount: data.familyCount || (data.attending ? 1 : 0),
    mealPreference: mappedMealPreference,
    familyMembers: mappedFamilyMembers,
    ...(data.confirmationNumber
      ? { confirmationNumber: data.confirmationNumber }
      : {}),
  };

  return confirmedData;
}

