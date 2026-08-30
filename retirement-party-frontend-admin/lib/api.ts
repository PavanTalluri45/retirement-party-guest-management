import { auth } from "./firebase";
import type { ApplicationUser, ApiResponse } from "@/types/auth";
import type {
  AnalyticsSummary,
  RegistrationStats,
  AttendanceStats,
  MealStats,
  CheckinStats,
  CheckinTrendData,
  StaffCheckinItem,
  RecentCheckinItem,
} from "@/lib/dashboard/analytics";
import type { RsvpRecord } from "@/lib/dashboard/types";

/* ============================================================
 * Types
 * ============================================================ */

interface RegistrationGuest {
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
  registeredAt: string;
  status: string;
}

/* ============================================================
 * Base URLs
 *
 * IMPORTANT:
 * These are TWO SEPARATE services.
 *
 * API Gateway       -> 4000
 * Auth Service      -> 5000
 *
 * Never combine these two URLs.
 * ============================================================ */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const AUTH_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:5000";

/* ============================================================
 * Firebase Authentication
 * ============================================================ */

/**
 * Get current Firebase ID Token
 */
export async function getAuthToken(
  forceRefresh: boolean = false
): Promise<string | null> {
  // Dashboard effects can run before Firebase finishes restoring its session.
  await auth.authStateReady();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  return await currentUser.getIdToken(forceRefresh);
}

/* ============================================================
 * Generic API Fetch
 * ============================================================ */

/**
 * Generic authenticated API fetch wrapper.
 *
 * By default, requests go to the API Gateway.
 *
 * If an endpoint belongs to the Auth Service,
 * pass AUTH_SERVICE_BASE_URL as the third argument.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE_URL
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${baseUrl}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      const errorMsg =
        data.message ||
        `Request failed with status ${response.status}`;

      return {
        success: false,
        message: errorMsg,
        error: errorMsg,
      };
    }

    return data;
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Network error. Please check your connection.";

    return {
      success: false,
      message,
      error: message,
    };
  }
}

/* ============================================================
 * Authentication Service APIs
 *
 * These requests go to:
 * NEXT_PUBLIC_AUTH_SERVICE_URL
 *
 * Example:
 * http://localhost:5000/api/auth/me
 * ============================================================ */

/**
 * Fetch current authenticated user's application profile
 *
 * GET /api/auth/me
 */
export async function fetchMe(): Promise<
  ApiResponse<{ user: ApplicationUser }>
> {
  return await apiFetch<{ user: ApplicationUser }>(
    "/api/auth/me",
    {
      method: "GET",
    },
    AUTH_SERVICE_BASE_URL
  );
}

/**
 * Register Admin application profile
 *
 * POST /api/auth/admin/register
 */
export async function registerAdminApi(
  name: string
): Promise<ApiResponse<{ user: ApplicationUser }>> {
  return await apiFetch<{ user: ApplicationUser }>(
    "/api/auth/admin/register",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
    AUTH_SERVICE_BASE_URL
  );
}

/**
 * Synchronize user session and lastLoginAt
 *
 * POST /api/auth/sync
 */
export async function syncSessionApi(): Promise<
  ApiResponse<{ user: ApplicationUser }>
> {
  return await apiFetch<{ user: ApplicationUser }>(
    "/api/auth/sync",
    {
      method: "POST",
    },
    AUTH_SERVICE_BASE_URL
  );
}

/**
 * Admin: Create a new Staff account
 *
 * POST /api/auth/staff
 */
export async function createStaffApi(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<ApiResponse<{ staff: ApplicationUser }>> {
  return await apiFetch<{ staff: ApplicationUser }>(
    "/api/auth/staff",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    AUTH_SERVICE_BASE_URL
  );
}

/**
 * Admin: List all Staff accounts
 *
 * GET /api/auth/staff
 */
export async function listStaffApi(): Promise<
  ApiResponse<{ staff: ApplicationUser[] }>
> {
  return await apiFetch<{ staff: ApplicationUser[] }>(
    "/api/auth/staff",
    {
      method: "GET",
    },
    AUTH_SERVICE_BASE_URL
  );
}

/**
 * Admin: Update Staff active/inactive status
 *
 * PATCH /api/auth/staff/:firebaseUid/status
 */
export async function updateStaffStatusApi(
  firebaseUid: string,
  isActive: boolean
): Promise<ApiResponse<{ staff: ApplicationUser }>> {
  return await apiFetch<{ staff: ApplicationUser }>(
    `/api/auth/staff/${firebaseUid}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
    AUTH_SERVICE_BASE_URL
  );
}

/**
 * Admin: Revoke Staff active sessions
 *
 * POST /api/auth/staff/:firebaseUid/revoke
 */
export async function revokeStaffSessionsApi(
  firebaseUid: string
): Promise<ApiResponse<{ message: string }>> {
  return await apiFetch<{ message: string }>(
    `/api/auth/staff/${firebaseUid}/revoke`,
    {
      method: "POST",
    },
    AUTH_SERVICE_BASE_URL
  );
}

/* ============================================================
 * Analytics APIs
 *
 * These requests go to:
 * NEXT_PUBLIC_API_URL
 *
 * Example:
 * http://localhost:4000/analytics/summary
 * ============================================================ */

/**
 * Fetch primary dashboard summary
 *
 * GET /analytics/summary
 */
export async function fetchAnalyticsSummaryApi(): Promise<
  ApiResponse<AnalyticsSummary>
> {
  return await apiFetch<AnalyticsSummary>(
    "/analytics/summary",
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/**
 * Fetch registration breakdown
 *
 * GET /analytics/registrations
 */
export async function fetchAnalyticsRegistrationsApi(): Promise<
  ApiResponse<RegistrationStats>
> {
  return await apiFetch<RegistrationStats>(
    "/analytics/registrations",
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/**
 * Fetch attendance metrics
 *
 * GET /analytics/attendance
 */
export async function fetchAnalyticsAttendanceApi(): Promise<
  ApiResponse<AttendanceStats>
> {
  return await apiFetch<AttendanceStats>(
    "/analytics/attendance",
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/**
 * Fetch meal preference counts
 *
 * GET /analytics/meals
 */
export async function fetchAnalyticsMealsApi(): Promise<
  ApiResponse<MealStats>
> {
  return await apiFetch<MealStats>(
    "/analytics/meals",
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/**
 * Fetch check-in statistics
 *
 * GET /analytics/checkins
 */
export async function fetchAnalyticsCheckinsApi(): Promise<
  ApiResponse<CheckinStats>
> {
  return await apiFetch<CheckinStats>(
    "/analytics/checkins",
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/**
 * Fetch check-in trend
 *
 * GET /analytics/checkins/trend
 */
export async function fetchAnalyticsCheckinTrendApi(
  from?: string,
  to?: string,
  granularity: "hour" | "day" = "hour"
): Promise<ApiResponse<CheckinTrendData>> {
  const params = new URLSearchParams();

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  params.set("granularity", granularity);

  return await apiFetch<CheckinTrendData>(
    `/analytics/checkins/trend?${params.toString()}`,
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/**
 * Fetch staff check-in leaderboard
 *
 * GET /analytics/staff/checkins
 */
export async function fetchAnalyticsStaffCheckinsApi(): Promise<
  ApiResponse<{ items: StaffCheckinItem[] }>
> {
  return await apiFetch<{ items: StaffCheckinItem[] }>(
    "/analytics/staff/checkins",
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/**
 * Fetch recent check-ins
 *
 * GET /analytics/checkins/recent
 */
export async function fetchAnalyticsRecentCheckinsApi(
  limit: number = 10
): Promise<ApiResponse<{ items: RecentCheckinItem[] }>> {
  return await apiFetch<{ items: RecentCheckinItem[] }>(
    `/analytics/checkins/recent?limit=${limit}`,
    {
      method: "GET",
    },
    API_BASE_URL
  );
}

/* ============================================================
 * Registration APIs
 *
 * These requests go to:
 * NEXT_PUBLIC_API_URL
 * ============================================================ */

/**
 * Fetch all registrations
 *
 * GET /registrations
 */
export async function fetchRegistrationsApi(): Promise<
  ApiResponse<RsvpRecord[]>
> {
  const response = await apiFetch<RegistrationGuest[]>(
    "/registrations",
    {
      method: "GET",
    },
    API_BASE_URL
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      message: response.message,
      error: response.error,
    };
  }

  return {
    ...response,
    data: response.data.map((guest) => ({
      id: guest.id,
      name: guest.name,
      isAttending: guest.attending ? "Yes" : "No",
      attended: guest.status === "CHECKED_IN" ? "Yes" : "No",
      attendedAt: null,
      status: guest.status,
      foodPreference:
        guest.mealPreference === "VEG" ? "veg" : "nonveg",
      phoneNumber: guest.phone,
      confirmationNumber: guest.confirmationNumber || "-",
      familyCount: guest.familyCount,
      familyMembers: (guest.familyMembers || []).map(
        (member) => member.name
      ),
      createdAtRaw: guest.registeredAt,
    })),
  };
}

/* ============================================================
 * API Object
 * ============================================================ */

const api = {
  // Firebase
  getAuthToken,

  // Generic API
  apiFetch,

  // Auth Service
  fetchMe,
  registerAdminApi,
  syncSessionApi,
  createStaffApi,
  listStaffApi,
  updateStaffStatusApi,
  revokeStaffSessionsApi,

  // Analytics
  fetchAnalyticsSummaryApi,
  fetchAnalyticsRegistrationsApi,
  fetchAnalyticsAttendanceApi,
  fetchAnalyticsMealsApi,
  fetchAnalyticsCheckinsApi,
  fetchAnalyticsCheckinTrendApi,
  fetchAnalyticsStaffCheckinsApi,
  fetchAnalyticsRecentCheckinsApi,

  // Registrations
  fetchRegistrationsApi,
};

export default api;