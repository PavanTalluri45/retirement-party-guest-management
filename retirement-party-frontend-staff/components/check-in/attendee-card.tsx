import type { AttendeeInfo, VerificationMeta } from "@/lib/check-in/types";
import { AttendeeProfileHeader } from "@/components/check-in/attendee-profile-header";
import { AttendeeDetailsGrid } from "@/components/check-in/attendee-details-grid";
import { AttendeeFamilyMembers } from "@/components/check-in/attendee-family-members";
import { CheckInActions } from "@/components/check-in/check-in-actions";

interface AttendeeCardProps {
  attendee: AttendeeInfo;
  meta?: VerificationMeta | null;
  loading: boolean;
  onCheckIn: () => void;
  onResetForm: () => void;
}

export function AttendeeCard({
  attendee,
  meta,
  loading,
  onCheckIn,
  onResetForm,
}: AttendeeCardProps) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300 rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <AttendeeProfileHeader attendee={attendee} meta={meta} />

      {/* Structured Metadata Grid */}
      <div className="p-5 sm:p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Attendee Details
        </h3>

        <AttendeeDetailsGrid attendee={attendee} />

        {attendee.familyMembers && attendee.familyMembers.length > 0 && (
          <AttendeeFamilyMembers members={attendee.familyMembers} />
        )}

      </div>

      <CheckInActions
        attendee={attendee}
        loading={loading}
        onCheckIn={onCheckIn}
        onResetForm={onResetForm}
      />
    </section>
  );
}
