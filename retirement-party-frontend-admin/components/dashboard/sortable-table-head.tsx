"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import type { SortConfig } from "@/lib/dashboard/types";

export function SortIcon({
  columnKey,
  sortConfig,
}: {
  columnKey: SortConfig["key"];
  sortConfig: SortConfig;
}) {
  if (sortConfig.key !== columnKey) {
    return (
      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/50" />
    );
  }
  return sortConfig.direction === "ascending" ? (
    <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
  ) : (
    <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
  );
}

export function SortableHead({
  label,
  columnKey,
  sortConfig,
  onSort,
}: {
  label: string;
  columnKey: SortConfig["key"];
  sortConfig: SortConfig;
  onSort: (key: SortConfig["key"]) => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </button>
    </TableHead>
  );
}
