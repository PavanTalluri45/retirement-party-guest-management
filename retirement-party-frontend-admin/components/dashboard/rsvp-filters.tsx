"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttendingFilter } from "@/lib/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";

interface RsvpFiltersProps {
  attendingFilter: AttendingFilter;
  onAttendingFilterChange: (value: AttendingFilter) => void;
  loading?: boolean;
}

export function RsvpFilters({
  attendingFilter,
  onAttendingFilterChange,
  loading = false,
}: RsvpFiltersProps) {
  if (loading) {
    return (
      <div className="flex justify-end">
        <Skeleton className="h-[62px] w-full rounded-md sm:w-48" />
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="w-full sm:w-48">
        <label
          htmlFor="attending-filter"
          className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5"
        >
          Attending
        </label>
        <Select
          value={attendingFilter}
          onValueChange={(value) => {
            if (value === "all" || value === "yes" || value === "no") {
              onAttendingFilterChange(value);
            }
          }}
        >
          <SelectTrigger id="attending-filter" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Attending</SelectItem>
            <SelectItem value="no">Not Attending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}