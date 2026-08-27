import { CheckInPage } from "@/components/check-in/check-in-page";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <CheckInPage />
    </ProtectedRoute>
  );
}
