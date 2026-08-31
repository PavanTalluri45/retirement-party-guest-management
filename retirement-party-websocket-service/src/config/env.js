import "dotenv/config";

/**
 * Centralized environment configuration for the WebSocket Service.
 * Validates required variables at startup so misconfigurations fail fast.
 *
 * This service deliberately has NO MongoDB and NO Redis connections.
 * It is a lightweight notification broker only.
 */

const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN;
if (!internalServiceToken && process.env.NODE_ENV !== "test") {
  throw new Error(
    "INTERNAL_SERVICE_TOKEN is required but not set in environment variables."
  );
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4001", 10),

  /**
   * Comma-separated list of allowed CORS origins (Admin Frontend).
   * Never use "*" in production.
   */
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000"],

  /**
   * Shared secret used to authenticate internal service-to-service calls.
   * Services (Verification, Registration) send this in the Authorization header.
   * Never expose this in frontend code or browser APIs.
   */
  internalServiceToken: internalServiceToken || "test-internal-token",

  /**
   * Auth Service base URL — used during socket handshake to verify
   * that the connecting user is an active ADMIN without querying MongoDB directly.
   */
  authServiceUrl:
    process.env.AUTH_SERVICE_URL || "http://localhost:5000",
};
