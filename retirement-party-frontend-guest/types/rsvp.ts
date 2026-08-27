export type Attending = "Yes" | "No";

export type MealPreference = "Veg" | "Non-Veg";

export interface FamilyMember {
  name: string;
  mealPreference: MealPreference | "";
}

export interface RSVPFormValues {
  fullName: string;
  phoneNumber: string;
  attending: Attending | "";
  familyCount: number;
  mealPreference: MealPreference | "";
  familyMembers: FamilyMember[];
}

export interface RSVPData {
  fullName: string;
  phoneNumber: string;
  attending: Attending;
  familyCount: number;
  mealPreference: MealPreference | "";
  familyMembers: FamilyMember[];

  // Only created/displayed when attending === "Yes".
  confirmationNumber?: string;
}