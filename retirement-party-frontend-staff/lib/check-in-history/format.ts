import type { CheckInRecord } from "@/lib/check-in/types";

export function formatClock(date: string | Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatShortDateTime(date: string | Date): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRecordKey(record: CheckInRecord): string {
  return record.id || record._id || record.guestId;
}

export interface VerificationMeta {
  label: string;
  className: string;
}

/**
 * Maps a verification method to its display label and text color.
 * Confirmation-number check-ins read in indigo, phone check-ins in amber —
 * plain colored text, no pill/border. Extend here if new verification
 * methods are added on the backend.
 */
export function getVerificationMeta(method: string): VerificationMeta {
  if (method === "CONFIRMATION") {
    return { label: "Code", className: "text-indigo-700 dark:text-indigo-300" };
  }
  return { label: "Phone", className: "text-amber-700 dark:text-amber-300" };
}

export type PageEntry = number | "ellipsis";

/**
 * Builds a compact page list for the pagination bar: first page, last page,
 * the current page and its immediate neighbors, and an "ellipsis" marker
 * for any gap in between.
 */
export function getPageNumbers(current: number, total: number): PageEntry[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: PageEntry[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page++) pages.push(page);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}
