import { randomUUID } from "node:crypto";

/**
 * Extracts X-Request-ID from an Express request object or generates a new UUID.
 * Preserves correlation IDs originating from the API Gateway.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
export function extractRequestId(req) {
  const incomingId =
    req?.headers?.["x-request-id"] ||
    req?.headers?.["x-correlation-id"] ||
    req?.headers?.["request-id"];

  return typeof incomingId === "string" && incomingId.trim()
    ? incomingId.trim()
    : randomUUID();
}

/**
 * Generate a standalone request ID (e.g. for programmatic use).
 * @returns {string}
 */
export function generateRequestId() {
  return randomUUID();
}

export default { extractRequestId, generateRequestId };
