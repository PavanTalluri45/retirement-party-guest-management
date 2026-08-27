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
 * Synchronize user session and lastLoginAt
 * POST /api/auth/sync
 */
export async function syncSessionApi(): Promise<ApiResponse<{ user: ApplicationUser }>> {
  return await apiFetch<{ user: ApplicationUser }>("/api/auth/sync", {
    method: "POST",
  });
}

