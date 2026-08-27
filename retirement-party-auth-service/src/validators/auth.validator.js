import { z } from "zod";

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
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters"),
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

