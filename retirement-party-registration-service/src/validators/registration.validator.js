import { z } from "zod";

/** Valid meal preferences (backend canonical values) */
const MealPreferenceEnum = z.enum(["VEG", "NON_VEG"]);

/** Family member schema */
const FamilyMemberSchema = z.object({
  name: z
    .string({ required_error: "Family member name is required." })
    .trim()
    .min(1, "Family member name cannot be empty.")
    .max(100, "Family member name must be 100 characters or less."),
  mealPreference: MealPreferenceEnum,
});

/**
 * Zod schema for POST /registrations request body.
 *
 * Frontend sends:
 *   attending: true | false
 *   mealPreference: "VEG" | "NON_VEG"
 *   familyCount: 1..4
 *   familyMembers: [{ name, mealPreference }] (length = familyCount - 1 for attending)
 */
export const RegistrationSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required." })
      .trim()
      .min(1, "Name cannot be empty.")
      .max(100, "Name must be 100 characters or less."),

    phone: z
      .string({ required_error: "Phone number is required." })
      .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),

    attending: z.boolean({ required_error: "Attending field is required." }),

    familyCount: z
      .number()
      .int()
      .min(1, "Family count must be at least 1.")
      .max(4, "Family count must not exceed 4.")
      .optional(),

    mealPreference: MealPreferenceEnum.optional(),

    familyMembers: z.array(FamilyMemberSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attending) {
      // Attending guests must provide familyCount, mealPreference, and familyMembers
      if (data.familyCount === undefined || data.familyCount === null) {
        ctx.addIssue({
          path: ["familyCount"],
          code: "custom",
          message: "Family count is required when attending.",
        });
      }

      if (!data.mealPreference) {
        ctx.addIssue({
          path: ["mealPreference"],
          code: "custom",
          message: "Meal preference is required when attending.",
        });
      }

      const count = data.familyCount ?? 1;
      const expectedExtraMembers = count - 1;
      const members = data.familyMembers ?? [];

      if (members.length !== expectedExtraMembers) {
        ctx.addIssue({
          path: ["familyMembers"],
          code: "custom",
          message: `Family members array must have ${expectedExtraMembers} entr${expectedExtraMembers === 1 ? "y" : "ies"} (familyCount - 1 = ${expectedExtraMembers}).`,
        });
      }
    }
    // Non-attending: no additional requirements
  });

/** Schema for :confirmationNumber URL param */
export const ConfirmationNumberParamSchema = z.object({
  confirmationNumber: z
    .string()
    .regex(/^[0-9]{4}$/, "Confirmation number must be exactly 4 digits."),
});

/** Schema for :id URL param */
export const IdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid ID format."),
});

