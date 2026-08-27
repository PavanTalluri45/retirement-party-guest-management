export type VerificationMethod = "code" | "phone";

export interface AttendeeInfo {
  _id: string;
  fullName: string;
  phoneNumber: string;
  confirmationNumber: string;
  createdAt: string;
  attending: "Yes" | "No";
  mealPreferences: string[] | string;
  familyCount: number;
  familyMembers?: string[];
  attended: boolean;
  attendedAt?: string;
  qrCodeDataUrl?: string;
}
