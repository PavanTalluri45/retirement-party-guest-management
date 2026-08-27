"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VerificationMethod } from "@/lib/check-in/types";

interface VerificationFormProps {
  method: VerificationMethod;
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function VerificationForm({
  method,
  value,
  loading,
  onChange,
  onSubmit,
}: VerificationFormProps) {
  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      <label
        htmlFor="verify-input"
        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {method === "code"
          ? "Attendee 4-Digit Confirmation Code"
          : "Registered Mobile Number"}
      </label>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            id="verify-input"
            type={method === "phone" ? "tel" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              method === "code" ? "Enter 4-digit code" : "Enter full phone number"
            }
            maxLength={method === "code" ? 4 : 20}
            autoComplete="off"
            className="h-11 text-base tracking-wide transition-all"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="h-11 px-6 font-medium shadow-xs gap-2 sm:w-auto w-full cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying</span>
            </>
          ) : (
            <span>Verify</span>
          )}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {method === "code"
          ? "Ask attendee for the 4-digit code shown in their invitation"
          : "Enter the complete phone number provided during registration."}
      </p>
    </form>
  );
}
