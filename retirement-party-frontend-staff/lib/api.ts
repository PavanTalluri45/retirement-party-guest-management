import { auth } from "./firebase";
import type { ApplicationUser, ApiResponse } from "@/types/auth";
import type {
  AttendeeInfo,
  CheckInRecord,
  CheckInSummary,
  PaginationInfo,
  VerificationMeta,
} from "./check-in/types";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Get current Firebase ID Token
 */
export async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken(forceRefresh);
}

/**
 * Generic authenticated API fetch wrapper with Gateway routing
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<
  ApiResponse<T> & {
    pagination?: PaginationInfo;
    meta?: VerificationMeta;
  }
> {

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${GATEWAY_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      return {
        success: false,
        message: errorMsg,
        error: errorMsg,
        ...data,
      };
    }

    return data;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Network error. Please check your connection.";
    return {
      success: false,
      message,
      error: message,
    };
  }
}

/**
 * Fetch current authenticated user's application profile
 * GET /api/auth/me
 */
export async function fetchMe(): Promise<ApiResponse<{ user: ApplicationUser }>> {
  return await apiFetch<{ user: ApplicationUser }>("/api/auth/me", {
    method: "GET",
  });
}

/**
 * Synchronize user session and lastLoginAt
 * POST /api/auth/sync
 */
export async function syncSessionApi(): Promise<ApiResponse<{ user: ApplicationUser }>> {
  return await apiFetch<{ user: ApplicationUser }>("/api/auth/sync", {
    method: "POST",
  });
}

/**
 * Verify Attendee by 4-digit Confirmation Code
 * POST /verification/confirmation
 */
export async function verifyAttendeeByConfirmation(
  confirmationNumber: string
): Promise<ApiResponse<{ guest: AttendeeInfo }> & { meta?: VerificationMeta }> {
  return await apiFetch<{ guest: AttendeeInfo }>("/verification/confirmation", {
    method: "POST",
    body: JSON.stringify({ confirmationNumber }),
  });
}

/**
 * Verify Attendee by 10-digit Phone Number
 * POST /verification/phone
 */
export async function verifyAttendeeByPhone(
  phone: string
): Promise<ApiResponse<{ guest: AttendeeInfo }> & { meta?: VerificationMeta }> {
  return await apiFetch<{ guest: AttendeeInfo }>("/verification/phone", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

/**
 * Check In Verified Attendee
 * POST /verification/check-in
 */
export async function checkInAttendeeApi(
  verificationMethod: "CONFIRMATION" | "PHONE",
  value: string
): Promise<
  ApiResponse<{ guest: AttendeeInfo; checkin: CheckInRecord }> & { meta?: VerificationMeta }
> {
  return await apiFetch<{ guest: AttendeeInfo; checkin: CheckInRecord }>("/verification/check-in", {
    method: "POST",
    body: JSON.stringify({
      verificationMethod,
      value,
    }),
  });
}

/**
 * Get Authenticated Staff Member's Check-In History and Summary
 * GET /verification/history/me
 */
export async function getMyCheckInHistoryApi(
  page: number = 1,
  limit: number = 20,
  search: string = ""
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });

  return await apiFetch<{ checkins: CheckInRecord[]; summary: CheckInSummary }>(
    `/verification/history/me?${query.toString()}`,
    {
      method: "GET",
    }
  );
}

const api = {
  getAuthToken,
  apiFetch,
  fetchMe,
  syncSessionApi,
  verifyAttendeeByConfirmation,
  verifyAttendeeByPhone,
  checkInAttendeeApi,
  getMyCheckInHistoryApi,
};

export default api;
