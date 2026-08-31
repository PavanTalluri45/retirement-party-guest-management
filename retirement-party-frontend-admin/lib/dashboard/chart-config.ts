import { type ChartConfig } from "@/components/ui/chart";

export const foodChartConfig = {
  value: {
    label: "RSVPs",
  },
  veg: {
    label: "Vegetarian",
    color: "var(--chart-1)",
  },
  nonveg: {
    label: "Non-Vegetarian",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export const attendanceChartConfig = {
  value: {
    label: "Count",
  },
  total: {
    label: "Total RSVPs",
    color: "var(--chart-3)",
  },
  attending: {
    label: "Will Attend",
    color: "var(--chart-4)",
  },
  attended: {
    label: "Actually Attended",
    color: "var(--chart-5)",
  },
  notAttended: {
    label: "Not Attended",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;
