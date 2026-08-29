"use client";

import { useRouter } from "next/navigation";
import { CheckInHeader } from "@/components/check-in/check-in-header";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";
import { useCheckInHistory } from "@/hooks/use-check-in-history";
import { HistoryToolbar } from "./history-toolbar";
import { SummaryPanel } from "./summary-panel";
import { HistoryTable } from "./history-table";
import { HistoryCardList } from "./history-card-list";
import { LoadingState } from "./loading-state";
import { EmptyState } from "./empty-state";
import { ErrorBanner } from "./error-banner";
import { PaginationBar } from "./pagination-bar";

export function CheckInHistoryView() {
  const router = useRouter();
  const { logOut } = useAuth();
  const { appUser } = useAppSelector((state) => state.auth);

  const {
    checkins,
    summary,
    pagination,
    loading,
    error,
    committedSearch,
    goToPage,
    isInitialLoad,
  } = useCheckInHistory();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-foreground dark:bg-zinc-950">
      <CheckInHeader
        onViewHistory={() => {}}
        onLogout={handleLogout}
        staffName={appUser?.name}
        staffEmail={appUser?.email}
      />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <HistoryToolbar />

        <SummaryPanel summary={summary} />

        {error && <ErrorBanner message={error} />}

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
          {isInitialLoad ? (
            <LoadingState />
          ) : checkins.length === 0 ? (
            <EmptyState
              searchActive={Boolean(committedSearch)}
              searchTerm={committedSearch}
            />
          ) : (
            <>
              <HistoryTable checkins={checkins} />
              <HistoryCardList checkins={checkins} />
              <PaginationBar
                pagination={pagination}
                loading={loading}
                onPageChange={goToPage}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
