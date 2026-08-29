export type VerificationMethod = "code" | "phone";

export interface FamilyMember {
  name: string;
  mealPreference?: "VEG" | "NON_VEG" | string;
}

export interface AttendeeInfo {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  confirmationNumber?: string;
  createdAt?: string;
  registeredAt?: string;
  attending?: "Yes" | "No" | boolean;
  mealPreferences?: string[] | string;
  mealPreference?: string;
  familyCount: number;
  familyMembers?: (string | FamilyMember)[];
  attended?: boolean;
  checkedIn?: boolean;
  attendedAt?: string;
  checkedInAt?: string;
  status?: string;}

export interface VerificationMeta {
  cache?: "HIT" | "MISS";
  source?: string;
  durationMs?: number;
  clientDurationMs?: number;
  requestId?: string;
}

export interface CheckInRecord {
  id?: string;
  _id?: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  confirmationNumber?: string;
  familyCount: number;
  familyMembers?: Array<string | { name?: string; mealPreference?: string }>;
  mealPreference: string;
  verificationMethod: string;
  checkedInBy: string;
  checkedInByName?: string;
  checkedInByEmail?: string;
  checkedInAt: string;
  result: string;
}

export interface CheckInSummary {
  totalCheckIns: number;
  todayCheckIns: number;
  latestCheckIn: string | null;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
