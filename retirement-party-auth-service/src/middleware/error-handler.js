import { ZodError } from "zod";

/**
 * Centralized Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  // Prevent double sending headers
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[Error] ${err.name || "AppError"}: ${err.message}`);

  // Handle Zod Validation Errors
  if (err instanceof ZodError || err.name === "ZodError") {
    const issues = err.issues || err.errors || [];
    const errorDetails = issues.map((e) => e.message).join("; ");
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${errorDetails || err.message}`,
    });
  }

  // Handle MongoDB Duplicate Key Errors
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${duplicateField} already exists.`,
    });
  }

  // Handle Firebase Admin SDK Errors
  if (err.code?.startsWith("auth/")) {
    switch (err.code) {
      case "auth/email-already-exists":
        return res.status(409).json({
          success: false,
          message: "An account with this email address already exists.",
        });
      case "auth/invalid-email":
        return res.status(400).json({
          success: false,
          message: "The provided email address is invalid.",
        });
      case "auth/invalid-password":
        return res.status(400).json({
          success: false,
          message: "The provided password does not meet security requirements.",
        });
      case "auth/user-not-found":
        return res.status(404).json({
          success: false,
          message: "User not found in authentication system.",
        });
      case "auth/uid-already-exists":
        return res.status(409).json({
          success: false,
          message: "User identity identifier already exists.",
        });
      default:
        return res.status(400).json({
          success: false,
          message: err.message || "Authentication provider error.",
        });
    }
  }

  // Custom HTTP status errors
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction
      ? "An internal server error occurred."
      : (err.message || "Internal server error"),
  });
}
