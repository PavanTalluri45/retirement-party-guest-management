"use client";

import { History, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CheckInHeaderProps {
  onViewHistory: () => void;
  onLogout: () => void;
  staffName?: string;
  staffEmail?: string;
}

export function CheckInHeader({
  onViewHistory,
  onLogout,
  staffName,
  staffEmail,
}: CheckInHeaderProps) {
  const displayName = staffName || "Staff Member";
  const displayEmail = staffEmail || "staff@event.com";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "SM";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                Event Check-in
              </h1>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Staff Terminal
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Verify attendees and manage event entry
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative flex h-10 w-10 items-center justify-center rounded-full p-0 hover:bg-muted/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40 select-none"
            aria-label="User menu"
          >
            <Avatar size="lg">
              <AvatarImage src="" alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-medium" role="none">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onViewHistory}
              className="cursor-pointer gap-2"
            >
              <History className="h-4 w-4" />
              <span>Check-in History</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
