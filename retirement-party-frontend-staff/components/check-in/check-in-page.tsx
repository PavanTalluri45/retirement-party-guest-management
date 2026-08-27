"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendeeVerification } from "@/hooks/use-attendee-verification";
import { CheckInHeader } from "@/components/check-in/check-in-header";
import { VerificationMethodSelector } from "@/components/check-in/verification-method-selector";
import { VerificationForm } from "@/components/check-in/verification-form";
import { StatusBanner } from "@/components/check-in/status-banner";
import { AttendeeCard } from "@/components/check-in/attendee-card";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";

export function CheckInPage() {
  const router = useRouter();
  const { logOut } = useAuth();
  const { appUser } = useAppSelector((state) => state.auth);

  const {
    verificationMethod,
    inputValue,
    attendee,
    loading,
    error,
    success,
    selectMethod,
    updateInputValue,
    submitVerification,
    resetForm,
    checkInAttendee,
  } = useAttendeeVerification();

  const handleViewHistory = () => {
    console.log("View check-in history");
    // Navigate to history page or open modal
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-foreground">
      <CheckInHeader
        onViewHistory={handleViewHistory}
        onLogout={handleLogout}
        staffName={appUser?.name}
        staffEmail={appUser?.email}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Verification Workspace Area */}
        <section className="rounded-xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Verify Attendee
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Choose how you want to identify the attendee
              </p>
            </div>
            {attendee && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="self-start text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 mt-2 sm:mt-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset &amp; Search Next
              </Button>
            )}
          </div>

          <VerificationMethodSelector
            selected={verificationMethod}
            onSelect={selectMethod}
          />

          <div className="mt-6 pt-6 border-t border-border/60">
            <VerificationForm
              method={verificationMethod}
              value={inputValue}
              loading={loading}
              onChange={updateInputValue}
              onSubmit={submitVerification}
            />

            <StatusBanner error={error} success={success} />
          </div>
        </section>

        {/* Attendee Dossier & Check-in Workspace */}
        {attendee && (
          <AttendeeCard
            attendee={attendee}
            loading={loading}
            onCheckIn={checkInAttendee}
            onResetForm={resetForm}
          />
        )}
      </main>
    </div>
  );
}
