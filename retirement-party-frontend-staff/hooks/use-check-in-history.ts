import { useCallback, useEffect, useRef, useState } from "react";
import { getMyCheckInHistoryApi } from "@/lib/api";
import type {
  CheckInRecord,
  CheckInSummary,
  PaginationInfo,
} from "@/lib/check-in/types";

const PAGE_SIZE = 20;

const EMPTY_SUMMARY: CheckInSummary = {
  totalCheckIns: 0,
  todayCheckIns: 0,
  latestCheckIn: null,
};

const EMPTY_PAGINATION: PaginationInfo = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

/**
 * Owns every piece of state the check-in history page needs: the current
 * page of records, the summary tiles, pagination, and the search box.
 * The view component stays presentation-only and just calls what this
 * returns.
 */
export function useCheckInHistory() {
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [summary, setSummary] = useState<CheckInSummary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState<PaginationInfo>(EMPTY_PAGINATION);

  // The text box shows `searchInput` as the user types; `committedSearch`
  // only updates once they submit, and is what's actually been queried.
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasLoadedOnce = useRef(false);

  const fetchHistory = useCallback(async (targetPage: number, query: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyCheckInHistoryApi(targetPage, PAGE_SIZE, query);
      if (response.success && response.data) {
        setCheckins(response.data.checkins ?? []);
        if (response.data.summary) setSummary(response.data.summary);
        if (response.pagination) setPagination(response.pagination);
      } else {
        setError(response.message || "Failed to load check-in history.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error fetching history.");
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    void fetchHistory(1, "");
  }, [fetchHistory]);

  const submitSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      setCommittedSearch(searchInput);
      void fetchHistory(1, searchInput);
    },
    [searchInput, fetchHistory]
  );

  const refresh = useCallback(() => {
    void fetchHistory(pagination.page, committedSearch);
  }, [fetchHistory, pagination.page, committedSearch]);

  const goToPage = useCallback(
    (nextPage: number) => {
      void fetchHistory(nextPage, committedSearch);
    },
    [fetchHistory, committedSearch]
  );

  return {
    checkins,
    summary,
    pagination,
    loading,
    error,
    searchInput,
    committedSearch,
    setSearchInput,
    submitSearch,
    refresh,
    goToPage,
    isInitialLoad: loading && !hasLoadedOnce.current,
  };
}
