import type { AttendeeInfo } from "@/lib/check-in/types";
import { AttendeeProfileHeader } from "@/components/check-in/attendee-profile-header";
import { AttendeeDetailsGrid } from "@/components/check-in/attendee-details-grid";
import { AttendeeFamilyMembers } from "@/components/check-in/attendee-family-members";
import { AttendeeQrPreview } from "@/components/check-in/attendee-qr-preview";
import { CheckInActions } from "@/components/check-in/check-in-actions";

interface AttendeeCardProps {
  attendee: AttendeeInfo;
  loading: boolean;
  onCheckIn: () => void;
  onResetForm: () => void;
}

export function AttendeeCard({
  attendee,
  loading,
  onCheckIn,
  onResetForm,
}: AttendeeCardProps) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-3 duration-300 rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <AttendeeProfileHeader attendee={attendee} />

      {/* Structured Metadata Grid */}
      <div className="p-5 sm:p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Attendee Details
        </h3>

        <AttendeeDetailsGrid attendee={attendee} />

        {attendee.familyMembers && attendee.familyMembers.length > 0 && (
          <AttendeeFamilyMembers members={attendee.familyMembers} />
        )}

        {attendee.qrCodeDataUrl && (
          <AttendeeQrPreview qrCodeDataUrl={attendee.qrCodeDataUrl} />
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
