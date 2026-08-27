import { ZodError } from "zod";

/**
 * Centralized Error Handler Middleware for API Gateway
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Safe logging without credentials or sensitive tokens
  console.error(`[Gateway Error] ${err.name || "Error"}: ${err.message}`);

  // Handle Zod Validation Errors
  if (err instanceof ZodError || err.name === "ZodError") {
    const issues = err.issues || err.errors || [];
    const errorDetails = issues.map((e) => e.message).join("; ");
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${errorDetails || err.message}`,
    });
  }

  // Handle Downstream Service Connectivity / Proxy Errors (e.g. Auth Service down)
  if (err.name === "ProxyError" || err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return res.status(502).json({
      success: false,
      message: "Authentication service is temporarily unavailable. Please try again shortly.",
    });
  }

  // Handle explicit HTTP Status Errors
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction
      ? "An internal gateway error occurred."
      : (err.message || "Internal server error"),
  });
}

