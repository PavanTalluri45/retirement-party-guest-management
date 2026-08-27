import type { MealPreference } from "@/types/rsvp";

export const MEAL_OPTIONS: MealPreference[] = ["Veg", "Non-Veg"];

export const FAMILY_COUNT_OPTIONS = [1, 2, 3, 4] as const;

export const SESSION_STORAGE_KEY = "retirement-rsvp-ui-data";

/**
 * UI-only mock confirmation number. There is intentionally no API,
 * database, or Firebase call anywhere in this feature — sessionStorage
 * is used purely so the confirmation screen can read back what was
 * entered on this screen.
 */
export const MOCK_CONFIRMATION_NUMBER = "0142";
