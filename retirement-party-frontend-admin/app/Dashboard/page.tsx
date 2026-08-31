"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FoodPreferenceChart } from "@/components/dashboard/food-preference-chart";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { RsvpFilters } from "@/components/dashboard/rsvp-filters";
import { RsvpTable } from "@/components/dashboard/rsvp-table";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAnalytics } from "@/hooks/use-analytics";
import { useWebSocket } from "@/hooks/use-websocket";
import { fetchRegistrationsApi } from "@/lib/api";
import type {
  RsvpRecord,
  SortConfig,
  AttendingFilter,
} from "@/lib/dashboard/types";
import { ITEMS_PER_PAGE } from "@/lib/dashboard/types";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  // Real Analytics API Integration
  const {
    summary,
    loading: analyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics,
  } = useAnalytics();

  const [rsvpData, setRsvpData] = useState<RsvpRecord[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState(true);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const loadRsvps = useCallback(async () => {
    setRsvpLoading(true);
    setRsvpError(null);
    try {
      const response = await fetchRegistrationsApi();
      if (response.success && response.data) {
        setRsvpData(response.data);
      } else {
        setRsvpError(response.message || "Failed to load RSVPs.");
      }
    } catch (error: unknown) {
      setRsvpError(error instanceof Error ? error.message : "Failed to load RSVPs.");
    } finally {
      setRsvpLoading(false);
    }
  }, []);

  // Real-time WebSocket connection
  // When a check-in or registration happens, immediately re-fetch authoritative data via REST
  const { isConnected, isReconnecting } = useWebSocket({
    onCheckinCompleted: useCallback(() => {
      void loadRsvps();
      void refreshAnalytics();
    }, [loadRsvps, refreshAnalytics]),
    onGuestRegistered: useCallback(() => {
      void loadRsvps();
      void refreshAnalytics();
    }, [loadRsvps, refreshAnalytics]),
    onReconnect: useCallback(() => {
      void loadRsvps();
      void refreshAnalytics();
    }, [loadRsvps, refreshAnalytics]),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRsvps();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRsvps]);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "descending",
  });
  const [attendingFilter, setAttendingFilter] = useState<AttendingFilter>("all");

  // Derive display values from real Analytics Service data (with fallback while loading)
  const totalRsvps = summary?.registrations?.total ?? 0;
  const expectedAttendees = summary?.attendance?.expectedAttendees ?? 0;
  const attendedCount = summary?.attendance?.totalAttended ?? 0;
  const attendanceRate = summary?.attendance?.attendancePercentage ?? 0;

  // Sorting for local RSVP Table
  const sortedData = useMemo(() => {
    const sortable = [...rsvpData];
    sortable.sort((a, b) => {
      if (sortConfig.key === "createdAt") {
        const at = new Date(a.createdAtRaw).getTime();
        const bt = new Date(b.createdAtRaw).getTime();
        return sortConfig.direction === "ascending" ? at - bt : bt - at;
      }
      const av = a[sortConfig.key as keyof RsvpRecord];
      const bv = b[sortConfig.key as keyof RsvpRecord];
      if (av == null || bv == null) return 0;
      if (av < bv) return sortConfig.direction === "ascending" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [rsvpData, sortConfig]);

  // Filtering for local RSVP Table
  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      const matchesAttending =
        attendingFilter === "all" ||
        (attendingFilter === "yes" && item.isAttending === "Yes") ||
        (attendingFilter === "no" && item.isAttending !== "Yes");
      return matchesAttending;
    });
  }, [sortedData, attendingFilter]);

  // Pagination for local RSVP Table
  const totalPages = Math.max(
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
    1
  );
  const displayPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = displayPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const requestSort = (key: SortConfig["key"]) => {
    let direction: SortConfig["direction"] = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <DashboardHeader
              isConnected={isConnected}
              isReconnecting={isReconnecting}
            />
          </div>

          {analyticsError && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{analyticsError}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void refreshAnalytics()}
                className="text-destructive hover:bg-destructive/20"
              >
                Retry
              </Button>
            </div>
          )}

          {rsvpError && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <span>{rsvpError}</span>
              <Button variant="ghost" size="sm" onClick={() => void loadRsvps()}>
                Retry
              </Button>
            </div>
          )}

          <StatsCards
            totalRsvps={totalRsvps}
            attending={expectedAttendees}
            attended={attendedCount}
            attendanceRate={attendanceRate}
            loading={analyticsLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FoodPreferenceChart
              vegCount={summary?.meals?.vegetarian ?? 0}
              nonVegCount={summary?.meals?.nonVegetarian ?? 0}
              loading={analyticsLoading}
            />
            <AttendanceChart
              totalRsvps={totalRsvps}
              attending={expectedAttendees}
              attended={attendedCount}
              loading={analyticsLoading}
            />
          </div>

          <RsvpFilters
            attendingFilter={attendingFilter}
            onAttendingFilterChange={(value) => {
              setAttendingFilter(value);
              setCurrentPage(1);
            }}
            loading={rsvpLoading}
          />

          <RsvpTable
            items={rsvpLoading ? [] : currentItems}
            filteredCount={filteredData.length}
            currentPage={displayPage}
            totalPages={totalPages}
            sortConfig={sortConfig}
            onSort={requestSort}
            onPageChange={setCurrentPage}
            loading={rsvpLoading}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
