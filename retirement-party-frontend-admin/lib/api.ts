import { auth } from "./firebase";
import type { ApplicationUser, ApiResponse } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:5000";

/**
 * Get current Firebase ID Token
 */
export async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken(forceRefresh);
}

/**
 * Generic authenticated API fetch wrapper
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      return {
        success: false,
        message: errorMsg,
        error: errorMsg,
      };
    }

    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error. Please check your connection.";
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
 * Register Admin application profile
 * POST /api/auth/admin/register
 */
export async function registerAdminApi(name: string): Promise<ApiResponse<{ user: ApplicationUser }>> {
  return await apiFetch<{ user: ApplicationUser }>("/api/auth/admin/register", {
    method: "POST",
    body: JSON.stringify({ name }),
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
 * Admin: Create a new Staff account
 * POST /api/auth/staff
 */
export async function createStaffApi(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<ApiResponse<{ staff: ApplicationUser }>> {
  return await apiFetch<{ staff: ApplicationUser }>("/api/auth/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Admin: List all Staff accounts
 * GET /api/auth/staff
 */
export async function listStaffApi(): Promise<ApiResponse<{ staff: ApplicationUser[] }>> {
  return await apiFetch<{ staff: ApplicationUser[] }>("/api/auth/staff", {
    method: "GET",
  });
}

/**
 * Admin: Update Staff active/inactive status
 * PATCH /api/auth/staff/:firebaseUid/status
 */
export async function updateStaffStatusApi(
  firebaseUid: string,
  isActive: boolean
): Promise<ApiResponse<{ staff: ApplicationUser }>> {
  return await apiFetch<{ staff: ApplicationUser }>(`/api/auth/staff/${firebaseUid}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

/**
 * Admin: Revoke Staff active sessions
 * POST /api/auth/staff/:firebaseUid/revoke
 */
export async function revokeStaffSessionsApi(
  firebaseUid: string
): Promise<ApiResponse<{ message: string }>> {
  return await apiFetch<{ message: string }>(`/api/auth/staff/${firebaseUid}/revoke`, {
    method: "POST",
  });
}
