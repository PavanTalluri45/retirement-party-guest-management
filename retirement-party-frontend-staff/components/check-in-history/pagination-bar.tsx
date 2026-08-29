import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { PaginationInfo } from "@/lib/check-in/types";
import { getPageNumbers } from "@/lib/check-in-history/format";

interface PaginationBarProps {
  pagination: PaginationInfo;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ pagination, loading, onPageChange }: PaginationBarProps) {
  if (pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit, hasPrev, hasNext } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const prevDisabled = !hasPrev || loading;
  const nextDisabled = !hasNext || loading;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="text-xs tabular-nums text-muted-foreground">
        Showing {from}–{to} of {total} check-ins
      </div>

      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (!prevDisabled) onPageChange(page - 1);
              }}
              aria-disabled={prevDisabled}
              className={prevDisabled ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>

          {pageNumbers.map((entry, i) =>
            entry === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  href="#"
                  isActive={entry === page}
                  onClick={(e) => {
                    e.preventDefault();
                    if (entry !== page) onPageChange(entry);
                  }}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (!nextDisabled) onPageChange(page + 1);
              }}
              aria-disabled={nextDisabled}
              className={nextDisabled ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
