"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttendingFilter, FoodFilter } from "@/lib/dashboard/types";

interface RsvpFiltersProps {
  attendingFilter: AttendingFilter;
  foodFilter: FoodFilter;
  onAttendingFilterChange: (value: AttendingFilter) => void;
  onFoodFilterChange: (value: FoodFilter) => void;
}

export function RsvpFilters({
  attendingFilter,
  foodFilter,
  onAttendingFilterChange,
  onFoodFilterChange,
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

          <div className="w-full sm:w-48">
            <label
              htmlFor="food-filter"
              className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5"
            >
              Food Preference
            </label>
            <Select
              value={foodFilter}
              onValueChange={(value) => {
                if (value === "all" || value === "veg" || value === "nonveg") {
                  onFoodFilterChange(value);
                }
              }}
            >
              <SelectTrigger id="food-filter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="veg">Vegetarian</SelectItem>
                <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
