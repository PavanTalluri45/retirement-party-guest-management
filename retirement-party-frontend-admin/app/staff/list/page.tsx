"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Power,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { listStaffApi, updateStaffStatusApi } from "@/lib/api";
import type { ApplicationUser } from "@/types/auth";
import { cn } from "@/lib/utils";

export function StaffTable({
  staffList,
  isLoading,
  onToggleStatus,
  updatingUid,
}: {
  staffList: ApplicationUser[];
  isLoading: boolean;
  onToggleStatus: (firebaseUid: string, currentStatus: boolean) => Promise<void>;
  updatingUid: string | null;
}) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading staff members...</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">All Staff</h2>
        <span className="text-sm text-muted-foreground">
          {staffList.length} staff member{staffList.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Staff ID
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Last Login
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.length > 0 ? (
              staffList.map((staff) => {
                const isUpdating = updatingUid === staff.firebaseUid;
                const formattedLastLogin = staff.lastLoginAt
                  ? new Date(staff.lastLoginAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "Never";

                return (
                  <TableRow key={staff.firebaseUid}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {staff.firebaseUid.slice(0, 10)}...
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {staff.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {staff.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border font-medium",
                          staff.isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formattedLastLogin}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant={staff.isActive ? "outline" : "default"}
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => onToggleStatus(staff.firebaseUid, staff.isActive)}
                        className={cn(
                          "h-7 text-xs gap-1 cursor-pointer",
                          staff.isActive
                            ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                        {staff.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground py-12"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium text-foreground">No staff members registered yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Create staff accounts so event coordinators can log in to the check-in terminal.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => router.push("/staff/create")}
                      className="mt-2 gap-1.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add First Staff Member
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export default function StaffListPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<ApplicationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const fetchStaffList = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await listStaffApi();
      if (res.success && res.data?.staff) {
        setStaffList(res.data.staff);
      } else {
        setErrorMessage(res.message || "Failed to load staff members.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load staff members.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  const handleToggleStatus = async (firebaseUid: string, currentStatus: boolean) => {
    setUpdatingUid(firebaseUid);
    setStatusMessage(null);
    setErrorMessage(null);

    const newStatus = !currentStatus;

    try {
      const res = await updateStaffStatusApi(firebaseUid, newStatus);
      if (res.success && res.data?.staff) {
        setStaffList((prev) =>
          prev.map((s) => (s.firebaseUid === firebaseUid ? res.data!.staff : s))
        );
        setStatusMessage(
          `Staff member status updated to ${newStatus ? "Active" : "Inactive"}.`
        );
      } else {
        setErrorMessage(res.message || "Failed to update staff status.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update staff status.";
      setErrorMessage(message);
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="w-fit gap-1.5 -ml-2 mb-2 text-muted-foreground cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Staff Members
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and view all registered staff for event operations.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchStaffList}
                disabled={isLoading}
                className="gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                onClick={() => router.push("/staff/create")}
                className="gap-1.5 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                Add Staff Member
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          <StaffTable
            staffList={staffList}
            isLoading={isLoading}
            onToggleStatus={handleToggleStatus}
            updatingUid={updatingUid}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
