import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Users, UserCheck, CalendarCheck, Percent } from "lucide-react";

interface StatsCardsProps {
  totalRsvps: number;
  attending: number;
  attended: number;
}

export function StatsCards({ totalRsvps, attending, attended }: StatsCardsProps) {
  const attendanceRate = attending ? Math.round((attended / attending) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            Total RSVPs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{totalRsvps}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserCheck className="h-4 w-4" />
            Will Attend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-primary">{attending}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarCheck className="h-4 w-4" />
            Actually Attended
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {attended}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Percent className="h-4 w-4" />
            Attendance Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {attendanceRate}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
