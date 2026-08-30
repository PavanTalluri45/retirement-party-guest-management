import crypto from "node:crypto";

/**
 * Request Correlation ID Middleware
 * Propagates existing X-Request-ID from API Gateway or generates a new UUID v4.
 */
export function requestIdMiddleware(req, res, next) {
  const incomingId =
    req.headers["x-request-id"] ||
    req.headers["x-correlation-id"] ||
    crypto.randomUUID();

  req.requestId = incomingId;
  res.setHeader("X-Request-ID", incomingId);
  next();
}

export default requestIdMiddleware;

