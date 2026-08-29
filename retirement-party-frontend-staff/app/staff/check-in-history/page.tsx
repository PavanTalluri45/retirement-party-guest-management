import { ProtectedRoute } from "@/components/auth/protected-route";
import { CheckInHistoryView } from "@/components/check-in-history";

export default function CheckInHistoryPage() {
  return (
    <ProtectedRoute>
      <CheckInHistoryView />
    </ProtectedRoute>
  );
}
