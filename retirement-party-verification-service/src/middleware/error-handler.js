/**
 * Centralized Error Handler Middleware
 * Formats errors into standardized JSON responses without leaking internal stack traces.
 */
export function errorHandler(err, req, res, next) {
  const requestId = req.requestId || "unknown";

  // 1. Zod Validation Error
  if (err.name === "ZodError" || err.issues || err.errors) {
    const errorList = (err.issues || err.errors || []).map((e) => ({
      field: Array.isArray(e.path) ? e.path.join(".") : String(e.path || ""),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Request validation failed.",
      errors: errorList,
      requestId,
    });
  }

  // 2. Explicit Domain Error Types
  if (err.type === "VALIDATION_ERROR") {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid input data.",
      errors: err.errors || [],
      requestId,
    });
  }

  if (err.type === "NOT_FOUND" || err.status === 404) {
    return res.status(404).json({
      success: false,
      message: err.message || "Guest not found.",
      requestId,
    });
  }

  if (
    err.type === "ALREADY_CHECKED_IN" ||
    err.type === "DUPLICATE_CHECKIN" ||
    err.status === 409
  ) {
    return res.status(409).json({
      success: false,
      message: err.message || "Guest has already been checked in.",
      data: err.data || null,
      requestId,
    });
  }

  if (err.type === "NOT_ATTENDING") {
    return res.status(422).json({
      success: false,
      message: err.message || "Cannot check in a non-attending guest.",
      requestId,
    });
  }

  if (err.type === "SERVICE_TIMEOUT" || err.status === 504) {
    return res.status(504).json({
      success: false,
      message: "Downstream service request timed out.",
      requestId,
    });
  }

  if (err.type === "SERVICE_UNAVAILABLE" || err.status === 502) {
    return res.status(502).json({
      success: false,
      message: "Downstream registration service is unavailable.",
      requestId,
    });
  }

  // 3. Fallback Internal Server Error
  console.error(`[Error Handler] [${requestId}] Unhandled error:`, err.message);

  return res.status(err.status || 500).json({
    success: false,
    message: "An internal server error occurred.",
    requestId,
  });
}

export default errorHandler;
