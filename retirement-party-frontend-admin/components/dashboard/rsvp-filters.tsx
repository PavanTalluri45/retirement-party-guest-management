"use client";

import { Card, CardContent } from "@/components/ui/card";
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
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <label
              htmlFor="attending-filter"
              className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5"
            >
              Attending
            </label>
            {loading ? <Skeleton className="h-10 w-full rounded-md" /> : <Select
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
            </Select>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
