/**
 * TypeScript Interfaces for Analytics API responses
 */

export interface RegistrationStats {
  total: number;
  attending: number;
  notAttending: number;
}

export interface AttendanceStats {
  expectedAttendees: number;
  totalAttended: number;
  remaining: number;
  attendancePercentage: number;
}

export interface MealStats {
  vegetarian: number;
  nonVegetarian: number;
}

export interface CheckinStats {
  total: number;
  today: number;
}

export interface CheckinTrendItem {
  date: string;
  count: number;
}

export interface CheckinTrendData {
  granularity: "hour" | "day";
  items: CheckinTrendItem[];
}

export interface StaffCheckinItem {
  staffId: string;
  staffName: string;
  staffEmail?: string;
  checkIns: number;
}

export interface RecentCheckinItem {
  id: string;
  guestId: string;
  guestName: string;
  confirmationNumber: string | null;
  familyCount: number;
  mealPreference: "VEG" | "NON_VEG";
  verificationMethod: "CONFIRMATION" | "PHONE";
  checkedInByName: string;
  checkedInAt: string | null;
}

export interface AnalyticsSummary {
  registrations: RegistrationStats;
  attendance: AttendanceStats;
  meals: MealStats;
}

