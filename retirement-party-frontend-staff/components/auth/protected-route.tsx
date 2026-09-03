"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { appUser, loading: reduxLoading } = useAppSelector(
    (state) => state.auth,
  );

  const isLoading = authLoading || reduxLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      } else if (appUser && appUser.role !== "STAFF") {
        router.replace("/login");
      } else if (appUser && !appUser.isActive) {
        router.replace("/login");
      }
    }
  }, [user, appUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user || appUser?.role !== "STAFF" || !appUser?.isActive) {
    return null;
  }

  return <>{children}</>;
}
