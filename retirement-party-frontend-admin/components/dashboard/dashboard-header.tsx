"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";

interface DashboardHeaderProps {
  isConnected?: boolean;
  isReconnecting?: boolean;
}

export function DashboardHeader({
  isConnected,
  isReconnecting,
}: DashboardHeaderProps = {}) {
  const router = useRouter();
  const { logOut } = useAuth();
  const { appUser } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const displayName = appUser?.name || "Admin";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "A";

  return (
    <div className="flex w-full flex-row items-start justify-between gap-4 sm:items-center">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Retirement Party Admin Dashboard
          </h1>

          {/* Real-time connection badge */}
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}

          {isReconnecting && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Reconnecting...
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Overview of RSVPs, attendance, and check-in status.
        </p>
      </div>

      {/* Admin Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-full p-0 hover:bg-muted/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40 select-none">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-64">
          {/* Admin Profile */}
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {appUser?.email || "admin@example.com"}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Staff by Company */}
          <DropdownMenuItem
            onClick={() => router.push("/staff/list")}
            className="cursor-pointer"
          >
            Staff by Company
          </DropdownMenuItem>

          {/* Add Staff Member */}
          <DropdownMenuItem
            onClick={() => router.push("/staff/create")}
            className="cursor-pointer"
          >
            Add Staff Member
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Log Out */}
          <DropdownMenuItem
            onClick={handleLogout}
            variant="destructive"
            className="cursor-pointer"
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
