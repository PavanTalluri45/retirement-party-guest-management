"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAnalyticsSummaryApi } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/dashboard/analytics";

export function useAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchAnalyticsSummaryApi();
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError(response.message || "Failed to load dashboard analytics.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error occurred while fetching analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary,
  };
}

export default useAnalytics;
