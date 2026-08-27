import type { AttendeeInfo } from "./types";

// Demo record used only to preview the UI states below.
// Swap scanQrCode()/checkInAttendee() in use-attendee-verification.ts
// for real API calls when wiring this up.
export const DEMO_ATTENDEE: AttendeeInfo = {
  _id: "demo-1",
  fullName: "Priya Sharma",
  phoneNumber: "+91 98765 43210",
  confirmationNumber: "4821",
  createdAt: "2026-08-20T10:30:00.000Z",
  attending: "Yes",
  mealPreferences: ["Vegetarian"],
  familyCount: 2,
  familyMembers: ["Rahul Sharma", "Aanya Sharma"],
  attended: false,
};
