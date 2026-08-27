"use client";

import { useState, useMemo } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FoodPreferenceChart } from "@/components/dashboard/food-preference-chart";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { RsvpFilters } from "@/components/dashboard/rsvp-filters";
import { RsvpTable } from "@/components/dashboard/rsvp-table";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MOCK_RSVPS, ITEMS_PER_PAGE } from "@/lib/dashboard/mock-data";
import type {
  RsvpRecord,
  SortConfig,
  AttendingFilter,
  FoodFilter,
} from "@/lib/dashboard/types";

export default function DashboardPage() {
  const [rsvpData, setRsvpData] = useState<RsvpRecord[]>(MOCK_RSVPS);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "descending",
  });
  const [attendingFilter, setAttendingFilter] = useState<AttendingFilter>("all");
  const [foodFilter, setFoodFilter] = useState<FoodFilter>("all");

  // Derived stats (computed live from mock data, incl. local check-ins)
  const stats = useMemo(() => {
    const totalRsvps = rsvpData.length;
    const attending = rsvpData.filter((r) => r.isAttending === "Yes").length;
    const attended = rsvpData.filter((r) => r.attended).length;
    const vegCount = rsvpData.filter(
      (r) => r.isAttending === "Yes" && r.foodPreference === "veg",
    ).length;
    const nonVegCount = rsvpData.filter(
      (r) => r.isAttending === "Yes" && r.foodPreference === "nonveg",
    ).length;
    return { totalRsvps, attending, attended, vegCount, nonVegCount };
  }, [rsvpData]);

  // Sorting
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

  // Filtering
  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      const matchesAttending =
        attendingFilter === "all" ||
        (attendingFilter === "yes" && item.isAttending === "Yes") ||
        (attendingFilter === "no" && item.isAttending !== "Yes");
      const matchesFood =
        foodFilter === "all" || item.foodPreference === foodFilter;
      return matchesAttending && matchesFood;
    });
  }, [sortedData, attendingFilter, foodFilter]);

  // Pagination
  const totalPages = Math.max(
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
    1,
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

  const toggleAttended = (id: string) => {
    setRsvpData((prev) =>
      prev.map((item) =>
        item.id === id && !item.attended
          ? { ...item, attended: true, attendedAt: new Date().toISOString() }
          : item,
      ),
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <DashboardHeader />

          <StatsCards
            totalRsvps={stats.totalRsvps}
            attending={stats.attending}
            attended={stats.attended}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FoodPreferenceChart
              vegCount={stats.vegCount}
              nonVegCount={stats.nonVegCount}
            />
            <AttendanceChart
              totalRsvps={stats.totalRsvps}
              attending={stats.attending}
              attended={stats.attended}
            />
          </div>

          <RsvpFilters
            attendingFilter={attendingFilter}
            foodFilter={foodFilter}
            onAttendingFilterChange={(value) => {
              setAttendingFilter(value);
              setCurrentPage(1);
            }}
            onFoodFilterChange={(value) => {
              setFoodFilter(value);
              setCurrentPage(1);
            }}
          />

          <RsvpTable
            items={currentItems}
            filteredCount={filteredData.length}
            currentPage={displayPage}
            totalPages={totalPages}
            sortConfig={sortConfig}
            onSort={requestSort}
            onToggleAttended={toggleAttended}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
