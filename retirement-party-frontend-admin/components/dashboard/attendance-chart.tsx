"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
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
import { attendanceChartConfig } from "@/lib/dashboard/chart-config";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceChartProps {
  totalRsvps: number;
  attending: number;
  attended: number;
  notAttended: number;
  loading?: boolean;
}

export function AttendanceChart({
  totalRsvps,
  attending,
  attended,
  notAttended,
  loading = false,
}: AttendanceChartProps) {
  if (loading) {
    return <Skeleton className="h-[360px] w-full rounded-xl" />;
  }

  const attendanceData = [
    { metric: "total", value: totalRsvps },
    { metric: "attending", value: attending },
    { metric: "attended", value: attended },
    { metric: "notAttended", value: notAttended },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={attendanceChartConfig} className="h-64 w-full">
          <BarChart
            data={attendanceData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="metric"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) =>
                attendanceChartConfig[
                  value as keyof typeof attendanceChartConfig
                ]?.label ?? value
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <Cell fill="var(--color-total)" />
              <Cell fill="var(--color-attending)" />
              <Cell fill="var(--color-attended)" />
              <Cell fill="var(--color-notAttended)" />
            </Bar>
            <ChartLegend content={<ChartLegendContent nameKey="metric" />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}