"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { foodChartConfig } from "@/lib/dashboard/chart-config";

interface FoodPreferenceChartProps {
  vegCount: number;
  nonVegCount: number;
}

export function FoodPreferenceChart({ vegCount, nonVegCount }: FoodPreferenceChartProps) {
  const foodPreferenceData = [
    { food: "veg", value: vegCount },
    { food: "nonveg", value: nonVegCount },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Food Preferences (Attending Only)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={foodChartConfig}
          className="mx-auto aspect-square max-h-64"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={foodPreferenceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              dataKey="value"
              nameKey="food"
              label={({ name, percent, value }) =>
                Number(value ?? 0) > 0
                  ? `${foodChartConfig[name as keyof typeof foodChartConfig]?.label}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  : null
              }
            >
              <Cell fill="var(--color-veg)" />
              <Cell fill="var(--color-nonveg)" />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="food" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
