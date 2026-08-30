import { z } from "zod";

const passwordStrengthError =
  "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, number, and special character.";

export function validateStrongPassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return (
    hasLength &&
    hasNumber &&
    hasLowercase &&
    hasUppercase &&
    hasSpecialChar
  );
}

/**
 * Validator schema for Admin registration.
 * Role cannot be provided or manipulated by the client.
 */
export const adminRegisterSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name cannot be empty")
      .max(100, "Name cannot exceed 100 characters"),
  })
  .strict({ message: "Unrecognized fields in request body" });

/**
 * Validator schema for Admin creating a Staff member.
 * Role cannot be provided or manipulated by the client.
 */
export const createStaffSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name cannot be empty")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Invalid email address format")
      .max(255, "Email cannot exceed 255 characters")
      .toLowerCase(),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, passwordStrengthError)
      .max(128, "Password cannot exceed 128 characters")
      .refine((value) => validateStrongPassword(value), {
        message: passwordStrengthError,
      }),
  })
  .strict({ message: "Unrecognized fields in request body" });

/**
 * Validator schema for updating Staff active status.
 */
export const updateStaffStatusSchema = z
  .object({
    isActive: z.boolean({
      required_error: "isActive boolean is required",
      invalid_type_error: "isActive must be a boolean",
    }),
  })
  .strict({ message: "Unrecognized fields in request body" });

/**
 * Middleware factory for request body validation
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

