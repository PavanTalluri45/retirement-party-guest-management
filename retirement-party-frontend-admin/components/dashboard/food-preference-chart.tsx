"use client";

import { PieChart, Pie, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { foodChartConfig } from "@/lib/dashboard/chart-config";
import { Skeleton } from "@/components/ui/skeleton";

interface FoodPreferenceChartProps {
  vegCount: number;
  nonVegCount: number;
  loading?: boolean;
}

export function FoodPreferenceChart({
  vegCount,
  nonVegCount,
  loading = false,
}: FoodPreferenceChartProps) {
  const foodPreferenceData = [
    { food: "veg", value: vegCount },
    { food: "nonveg", value: nonVegCount },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Food Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="mx-auto aspect-square h-64 rounded-md" /> : <ChartContainer
          config={foodChartConfig}
          className="mx-auto aspect-square max-h-64"
        >
          <PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={foodPreferenceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={70}
              dataKey="value"
              nameKey="food"
              label={({ percent, value }) =>
                Number(value ?? 0) > 0
                  ? `${((percent ?? 0) * 100).toFixed(0)}%`
                  : null
              }
            >
              <Cell fill="var(--color-veg)" />
              <Cell fill="var(--color-nonveg)" />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="food" />} />
          </PieChart>
        </ChartContainer>}
      </CardContent>
    </Card>
  );
}