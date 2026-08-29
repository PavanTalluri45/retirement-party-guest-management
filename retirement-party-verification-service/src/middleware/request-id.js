import crypto from "node:crypto";

/**
 * Request ID Middleware
 * Propagates existing X-Request-ID from Gateway / upstream or generates a unique UUID.
 */
export function requestIdMiddleware(req, res, next) {
  const incomingId =
    req.headers["x-request-id"] ||
    req.headers["x-correlation-id"] ||
    req.headers["request-id"];

  const requestId =
    typeof incomingId === "string" && incomingId.trim()
      ? incomingId.trim()
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
}

export default requestIdMiddleware;
