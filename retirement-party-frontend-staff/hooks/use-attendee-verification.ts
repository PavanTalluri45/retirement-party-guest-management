"use client";

import { useState } from "react";
import type { AttendeeInfo, VerificationMethod } from "@/lib/check-in/types";
import { DEMO_ATTENDEE } from "@/lib/check-in/demo-data";

export function useAttendeeVerification() {
  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethod>("code");
  const [inputValue, setInputValue] = useState("");
  const [attendee, setAttendee] = useState<AttendeeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setInputValue("");
    setAttendee(null);
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

  // Placeholder lookup — replace with your real API call.
  const verifyAttendee = async (value: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    setAttendee(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!value) {
      setError("Please enter a verification value");
      setLoading(false);
      return;
    }

    setAttendee(DEMO_ATTENDEE);
    setSuccess("Attendee identity verified");
    setLoading(false);
  };

  const submitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError(
        verificationMethod === "code"
          ? "Please enter the 4-digit code"
          : "Please enter the phone number",
      );
      return;
    }
    verifyAttendee(inputValue.trim());
  };

  // Placeholder check-in — replace with your real API call.
  const checkInAttendee = async () => {
    if (!attendee) return;
    setLoading(true);
    setError("");
    setSuccess("");

    await new Promise((resolve) => setTimeout(resolve, 400));

    const now = new Date().toISOString();
    setAttendee((prev) =>
      prev ? { ...prev, attended: true, attendedAt: now } : prev,
    );
    setSuccess("Attendee marked as checked in!");
    setLoading(false);
  };

  return {
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
  };
}
