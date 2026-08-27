import { StaffMemberForm } from "@/components/staff/staff-member-form";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function CreateStaffMemberPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-xl mx-auto">
          <StaffMemberForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
