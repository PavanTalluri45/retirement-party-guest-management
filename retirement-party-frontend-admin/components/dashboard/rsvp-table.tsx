"use client";

import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/dashboard/format";
import { ITEMS_PER_PAGE } from "@/lib/dashboard/types";
import { SortableHead } from "./sortable-table-head";
import type { RsvpRecord, SortConfig } from "@/lib/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";

interface RsvpTableProps {
  items: RsvpRecord[];
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  sortConfig: SortConfig;
  onSort: (key: SortConfig["key"]) => void;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function RsvpTable({
  items,
  filteredCount,
  currentPage,
  totalPages,
  sortConfig,
  onSort,
  onPageChange,
  loading = false,
}: RsvpTableProps) {
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">All RSVPs</h2>
        <span className="text-sm text-muted-foreground">
          Showing {filteredCount > 0 ? indexOfFirstItem + 1 : 0}-
          {Math.min(indexOfLastItem, filteredCount)} of {filteredCount} RSVPs
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Name" columnKey="name" sortConfig={sortConfig} onSort={onSort} />
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Phone
              </TableHead>
              <SortableHead label="Attending" columnKey="isAttending" sortConfig={sortConfig} onSort={onSort} />
              <SortableHead label="Attended" columnKey="attended" sortConfig={sortConfig} onSort={onSort} />
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Confirmation #
              </TableHead>
              <SortableHead label="Date" columnKey="createdAt" sortConfig={sortConfig} onSort={onSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: 6 }, (_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full min-w-20 rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">
                      {person.name}
                    </div>
                    {person.familyMembers.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{person.familyMembers.join(", ")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {person.phoneNumber}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border font-medium",
                        person.isAttending === "Yes"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive",
                      )}
                    >
                      {person.isAttending}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border font-medium",
                          person.attended === "Yes"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {person.attended}
                      </Badge>
                      {person.attended === "Yes" && person.attendedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(person.attendedAt)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-foreground">
                    {person.confirmationNumber}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(person.createdAtRaw)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  No matching RSVPs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredCount > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Showing{" "}
            <span className="font-medium text-foreground">
              {indexOfFirstItem + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(indexOfLastItem, filteredCount)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filteredCount}
            </span>{" "}
            results
          </p>

          <div className="flex items-center gap-1 mx-auto sm:mx-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2)
                pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
