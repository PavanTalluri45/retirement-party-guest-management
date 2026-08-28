import { config } from "../config/env.js";

/**
 * Centralized Express error handler for the Registration Service.
 *
 * Handles:
 * - VALIDATION_ERROR (Zod parse failures) -> 400
 * - DUPLICATE_PHONE                        -> 409
 * - NOT_FOUND                              -> 404
 * - MongoDB duplicate key (code 11000)     -> 409
 * - All other errors                       -> 500
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Zod validation errors
  if (err.type === "VALIDATION_ERROR") {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: err.errors?.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join(".") : String(e.path || ""),
        message: e.message,
      })),
    });
  }

  // Duplicate phone
  if (err.type === "DUPLICATE_PHONE") {
    return res.status(409).json({
      success: false,
      message: err.message,
    });
  }

  // Not found
  if (err.type === "NOT_FOUND") {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  // MongoDB duplicate key error (e.g., race condition on phone/confirmationNumber)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    const message =
      field === "phone"
        ? "This phone number has already been registered."
        : "A registration conflict occurred. Please try again.";

    return res.status(409).json({
      success: false,
      message,
    });
  }

  // Generic server error — mask details in production
  const isDev = config.nodeEnv !== "production";

  console.error("[Registration Service] Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "An internal server error occurred. Please try again later.",
    ...(isDev && { error: err.message, stack: err.stack }),
  });
}

