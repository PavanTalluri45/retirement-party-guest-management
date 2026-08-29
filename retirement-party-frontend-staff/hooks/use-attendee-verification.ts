"use client";

import { useState } from "react";
import type { AttendeeInfo, VerificationMethod, VerificationMeta } from "@/lib/check-in/types";
import {
  verifyAttendeeByConfirmation,
  verifyAttendeeByPhone,
  checkInAttendeeApi,
} from "@/lib/api";

export function useAttendeeVerification() {
  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethod>("code");
  const [inputValue, setInputValue] = useState("");
  const [attendee, setAttendee] = useState<AttendeeInfo | null>(null);
  const [verificationMeta, setVerificationMeta] = useState<VerificationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setInputValue("");
    setAttendee(null);
    setVerificationMeta(null);
    setError("");
    setSuccess("");
  };

  const selectMethod = (method: VerificationMethod) => {
    setVerificationMethod(method);
    resetForm();
  };

  const updateInputValue = (value: string) => {
    setInputValue(value);
    if (error) setError("");
  };

  interface RawGuestResponse {
    id?: string;
    _id?: string;
    name?: string;
    fullName?: string;
    phone?: string;
    phoneNumber?: string;
    confirmationNumber?: string;
    registeredAt?: string;
    createdAt?: string;
    attending?: boolean | string;
    mealPreference?: string;
    mealPreferences?: string | string[];
    familyCount?: number;
    familyMembers?: Array<string | { name?: string; mealPreference?: string }>;
    checkedIn?: boolean;
    status?: string;
    checkedInAt?: string;
    attendedAt?: string;
    qrCodeDataUrl?: string;
  }

  /**
   * Format raw guest response from Verification API to match UI conventions
   */
  const formatGuestForUI = (guest: RawGuestResponse): AttendeeInfo => {
    return {
      _id: guest.id || guest._id || "",
      id: guest.id || guest._id || "",
      fullName: guest.name || guest.fullName || "Guest",
      name: guest.name || guest.fullName || "Guest",
      phoneNumber: guest.phone || guest.phoneNumber || "",
      phone: guest.phone || guest.phoneNumber || "",
      confirmationNumber: guest.confirmationNumber || "",
      createdAt: guest.registeredAt || guest.createdAt || new Date().toISOString(),
      registeredAt: guest.registeredAt || guest.createdAt,
      attending:
        guest.attending === true || guest.attending === "Yes" ? "Yes" : "No",
      mealPreferences: guest.mealPreference || guest.mealPreferences || "VEG",
      familyCount: guest.familyCount ?? 1,
      familyMembers: (guest.familyMembers || []).map((m) => {
        if (typeof m === "string") {
          return { name: m, mealPreference: "VEG" };
        }
        return {
          name: m?.name || "Family Member",
          mealPreference: m?.mealPreference || "VEG",
        };
      }),
      attended: guest.checkedIn === true || guest.status === "CHECKED_IN",
      checkedIn: guest.checkedIn === true || guest.status === "CHECKED_IN",
      attendedAt: guest.checkedInAt || guest.attendedAt,
      checkedInAt: guest.checkedInAt || guest.attendedAt,
      status: guest.status || (guest.checkedIn ? "CHECKED_IN" : "REGISTERED"),
      qrCodeDataUrl: guest.qrCodeDataUrl,
    };
  };

  /**
   * Real API Verification with High-Resolution Timing
   */
  const verifyAttendee = async (value: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    setAttendee(null);
    setVerificationMeta(null);

    const clientStart = performance.now();

    try {
      let response;
      if (verificationMethod === "code") {
        response = await verifyAttendeeByConfirmation(value);
      } else {
        response = await verifyAttendeeByPhone(value);
      }

      const clientDurationMs = Math.round(performance.now() - clientStart);

      if (!response.success || !response.data?.guest) {
        setError(response.message || "Guest verification failed. Please check the code or phone number.");
        setLoading(false);
        return;
      }

      const formatted = formatGuestForUI(response.data.guest);
      setAttendee(formatted);

      const meta: VerificationMeta = {
        cache: response.meta?.cache || "MISS",
        durationMs: response.meta?.durationMs,
        clientDurationMs,
        requestId: response.meta?.requestId,
      };
      setVerificationMeta(meta);

      setSuccess("Attendee identity verified successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify attendee. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError(
        verificationMethod === "code"
          ? "Please enter the 4-digit code"
          : "Please enter the phone number"
      );
      return;
    }
    verifyAttendee(inputValue.trim());
  };

  /**
   * Real API Check-In Execution
   */
  const checkInAttendee = async () => {
    if (!attendee) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const method = verificationMethod === "code" ? "CONFIRMATION" : "PHONE";
    const value =
      verificationMethod === "code"
        ? attendee.confirmationNumber || inputValue
        : attendee.phoneNumber || inputValue;

    try {
      const response = await checkInAttendeeApi(method, value);

      if (!response.success) {
        setError(response.message || "Failed to check in attendee.");
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();
      setAttendee((prev) =>
        prev
          ? {
              ...prev,
              attended: true,
              checkedIn: true,
              attendedAt: response.data?.checkin?.checkedInAt || now,
              checkedInAt: response.data?.checkin?.checkedInAt || now,
              status: "CHECKED_IN",
            }
          : prev
      );

      setSuccess("Attendee successfully checked in! Entry authorized.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing check-in.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    verificationMethod,
    inputValue,
    attendee,
    verificationMeta,
    loading,
    error,
    success,
    selectMethod,
    updateInputValue,
    submitVerification,
    resetForm,
    checkInAttendee,
  };
}

export default useAttendeeVerification;
