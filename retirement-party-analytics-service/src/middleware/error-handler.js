import { metrics } from "../utils/metrics.js";

/**
 * Centralized Error Handler for Analytics Service
 * Sanitizes internal errors to prevent leaking database URIs, credentials, or stack traces.
 */
export function errorHandler(err, req, res, next) {
  metrics.recordDatabaseError();

  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 400 ? "VALIDATION_ERROR" : "INTERNAL_ERROR");
  const message =
    status < 500
      ? err.message
      : "An unexpected error occurred while processing analytics. Please try again.";

  // Log error internally for debugging
  console.error(
    `[Analytics Error] [${req.requestId || "no-id"}] ${req.method} ${req.originalUrl}:`,
    err.message
  );

  res.status(status).json({
    success: false,
    code,
    message,
    ...(err.details ? { details: err.details } : {}),
    requestId: req.requestId || undefined,
  });
}

export default errorHandler;

