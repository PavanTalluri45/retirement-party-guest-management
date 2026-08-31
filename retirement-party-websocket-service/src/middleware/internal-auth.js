import { config } from "../config/env.js";

/**
 * Internal service authentication middleware for POST /internal/events.
 *
 * Verifies that the calling service (Verification, Registration) has supplied
 * the correct shared INTERNAL_SERVICE_TOKEN in the Authorization header.
 *
 * SECURITY NOTES:
 * - This token must NEVER appear in frontend code or browser APIs.
 * - It is only ever sent service-to-service over the internal network.
 * - In production, use a secrets manager (GCP Secret Manager, AWS Secrets Manager, etc.)
 *   to supply this value rather than a plain .env file.
 */
export function internalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Internal service authentication required.",
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Internal service authentication required.",
    });
  }

  if (token !== config.internalServiceToken) {
    return res.status(401).json({
      success: false,
      message: "Invalid internal service token.",
    });
  }

  next();
}

export default internalAuth;
