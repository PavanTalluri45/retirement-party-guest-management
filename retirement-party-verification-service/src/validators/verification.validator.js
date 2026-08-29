import { z } from "zod";

/**
 * Validation schema for POST /verification/phone
 */
export const PhoneVerificationSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required." })
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, {
      message: "Phone number must be exactly 10 digits.",
    }),
});

/**
 * Validation schema for POST /verification/confirmation
 */
export const ConfirmationVerificationSchema = z.object({
  confirmationNumber: z
    .string({ required_error: "Confirmation code is required." })
    .trim()
    .regex(/^[0-9]{4}$/, "Confirmation code must be exactly 4 digits."),
});

/**
 * Validation schema for POST /verification/check-in
 */
export const CheckInSchema = z.object({
  verificationMethod: z.enum(["CONFIRMATION", "PHONE"], {
    required_error: "Verification method is required (CONFIRMATION or PHONE).",
  }),
  value: z
    .string({ required_error: "Verification value is required." })
    .trim()
    .min(1, "Verification value cannot be empty."),
});

/**
 * Validation schema for GET /verification/history/me query params
 */
export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().optional().default(""),
});

export default {
  PhoneVerificationSchema,
  ConfirmationVerificationSchema,
  CheckInSchema,
  HistoryQuerySchema,
};
