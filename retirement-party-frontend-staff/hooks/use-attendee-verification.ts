"use client";

import { useState, type FormEvent } from "react";
import type {
  AttendeeInfo,
  VerificationMethod,
  VerificationMeta,
} from "@/lib/check-in/types";
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
  const [verificationMeta, setVerificationMeta] =
    useState<VerificationMeta | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * Reset the current verification form and attendee state.
   */
  const resetForm = () => {
    setInputValue("");
    setAttendee(null);
    setVerificationMeta(null);
    setError("");
    setSuccess("");
  };

  /**
   * Change verification method.
   *
   * Changing between confirmation number and phone number
   * also clears the previous verification result.
   */
  const selectMethod = (method: VerificationMethod) => {
    setVerificationMethod(method);
    resetForm();
  };

  /**
   * Update verification input.
   */
  const updateInputValue = (value: string) => {
    setInputValue(value);

    if (error) {
      setError("");
    }
  };

  /**
   * Raw guest response returned by the Verification Service.
   *
   * This intentionally contains no QR-related fields.
   */
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

    familyMembers?: Array<
      string | {
        name?: string;
        mealPreference?: string;
      }
    >;

    checkedIn?: boolean;
    status?: string;

    checkedInAt?: string;
    attendedAt?: string;
  }

  /**
   * Convert the Verification Service guest response
   * into the Staff Frontend AttendeeInfo structure.
   */
  const formatGuestForUI = (
    guest: RawGuestResponse
  ): AttendeeInfo => {
    const isCheckedIn =
      guest.checkedIn === true ||
      guest.status === "CHECKED_IN";

    const familyMembers =
      (guest.familyMembers ?? []).map((member) => {
        if (typeof member === "string") {
          return {
            name: member,
            mealPreference: "VEG",
          };
        }

        return {
          name: member?.name || "Family Member",
          mealPreference:
            member?.mealPreference || "VEG",
        };
      });

    return {
      _id: guest.id || guest._id || "",
      id: guest.id || guest._id || "",

      fullName:
        guest.name ||
        guest.fullName ||
        "Guest",

      name:
        guest.name ||
        guest.fullName ||
        "Guest",

      phoneNumber:
        guest.phone ||
        guest.phoneNumber ||
        "",

      phone:
        guest.phone ||
        guest.phoneNumber ||
        "",

      confirmationNumber:
        guest.confirmationNumber ||
        "",

      createdAt:
        guest.registeredAt ||
        guest.createdAt ||
        new Date().toISOString(),

      registeredAt:
        guest.registeredAt ||
        guest.createdAt,

      attending:
        guest.attending === true ||
        guest.attending === "Yes"
          ? "Yes"
          : "No",

      mealPreferences:
        guest.mealPreference ||
        guest.mealPreferences ||
        "VEG",

      familyCount:
        guest.familyCount ?? 1,

      familyMembers,

      attended: isCheckedIn,

      checkedIn: isCheckedIn,

      attendedAt:
        guest.checkedInAt ||
        guest.attendedAt,

      checkedInAt:
        guest.checkedInAt ||
        guest.attendedAt,

      status:
        guest.status ||
        (isCheckedIn
          ? "CHECKED_IN"
          : "REGISTERED"),
    };
  };

  /**
   * Verify an attendee using either:
   *
   * - 4-digit confirmation number
   * - phone number
   *
   * The request timing is measured on the client so the
   * Staff UI can display the actual request duration.
   */
  const verifyAttendee = async (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError(
        verificationMethod === "code"
          ? "Please enter the 4-digit code"
          : "Please enter the phone number"
      );

      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setAttendee(null);
    setVerificationMeta(null);

    const clientStart = performance.now();

    try {
      let response;

      if (verificationMethod === "code") {
        response =
          await verifyAttendeeByConfirmation(
            trimmedValue
          );
      } else {
        response =
          await verifyAttendeeByPhone(
            trimmedValue
          );
      }

      const clientDurationMs = Math.round(
        performance.now() - clientStart
      );

      /*
       * The Verification API must return:
       *
       * {
       *   success: true,
       *   data: {
       *     guest: ...
       *   }
       * }
       */
      if (
        !response.success ||
        !response.data?.guest
      ) {
        setError(
          response.message ||
            "Guest verification failed. Please check the code or phone number."
        );

        return;
      }

      const formattedAttendee =
        formatGuestForUI(
          response.data.guest
        );

      setAttendee(formattedAttendee);

      const meta: VerificationMeta = {
        cache:
          response.meta?.cache ||
          "MISS",

        durationMs:
          response.meta?.durationMs,

        clientDurationMs,

        requestId:
          response.meta?.requestId,
      };

      setVerificationMeta(meta);

      setSuccess(
        "Attendee identity verified successfully."
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to verify attendee. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle verification form submission.
   */
  const submitVerification = (
    event: FormEvent
  ) => {
    event.preventDefault();

    const trimmedValue =
      inputValue.trim();

    if (!trimmedValue) {
      setError(
        verificationMethod === "code"
          ? "Please enter the 4-digit code"
          : "Please enter the phone number"
      );

      return;
    }

    void verifyAttendee(trimmedValue);
  };

  /**
   * Check in the currently verified attendee.
   */
  const checkInAttendee = async () => {
    if (!attendee) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const method =
      verificationMethod === "code"
        ? "CONFIRMATION"
        : "PHONE";

    const value =
      verificationMethod === "code"
        ? attendee.confirmationNumber ||
          inputValue.trim()
        : attendee.phoneNumber ||
          inputValue.trim();

    if (!value) {
      setError(
        "Unable to determine the attendee verification value."
      );

      setLoading(false);
      return;
    }

    try {
      const response =
        await checkInAttendeeApi(
          method,
          value
        );

      if (!response.success) {
        setError(
          response.message ||
            "Failed to check in attendee."
        );

        return;
      }

      const checkedInAt =
        response.data?.checkin
          ?.checkedInAt ||
        new Date().toISOString();

      /*
       * Update the local attendee state immediately
       * so the Staff UI reflects the successful check-in
       * without requiring another verification request.
       */
      setAttendee((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          attended: true,

          checkedIn: true,

          attendedAt: checkedInAt,

          checkedInAt,

          status: "CHECKED_IN",
        };
      });

      setSuccess(
        "Attendee successfully checked in! Entry authorized."
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error executing check-in.";

      setError(message);
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