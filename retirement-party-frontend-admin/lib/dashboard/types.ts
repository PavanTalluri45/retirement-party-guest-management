export type Attending = "Yes" | "No";
export type FoodPreference = "veg" | "nonveg";
export type GuestStatus = "REGISTERED" | "CHECKED_IN" | "CANCELLED" | string;

export interface RsvpRecord {
  id: string;
  name: string;
  isAttending: Attending;
  attended: Attending;
  attendedAt: string | null;
  status: GuestStatus;
  foodPreference: FoodPreference;
  phoneNumber: string;
  confirmationNumber: string;
  familyCount: number;
  familyMembers: string[];
  createdAtRaw: string;
}

export interface SortConfig {
  key: keyof RsvpRecord | "createdAt";
  direction: "ascending" | "descending";
}

export type StaffStatus = "Active" | "Inactive";

export interface StaffMember {
  employeeId: string;
  name: string;
  email: string;
  status: StaffStatus;
}


export type AttendingFilter = "all" | "yes" | "no";
export type FoodFilter = "all" | FoodPreference;

export const ITEMS_PER_PAGE = 10;
