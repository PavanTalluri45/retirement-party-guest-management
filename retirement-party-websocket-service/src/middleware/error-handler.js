/**
 * Centralized error handler for the WebSocket Service Express app.
 * Matches the convention used by auth-service and verification-service.
 */
export function errorHandler(err, req, res, next) {
  // Prevent sending headers if response has already started streaming
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "An unexpected error occurred.";

  if (process.env.NODE_ENV !== "test") {
    console.error(
      JSON.stringify({
        level: "error",
        requestId: req?.requestId || "unknown",
        method: req?.method,
        path: req?.originalUrl,
        statusCode,
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      })
    );
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

export default errorHandler;
