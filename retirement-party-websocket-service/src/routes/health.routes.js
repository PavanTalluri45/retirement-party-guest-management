import { Router } from "express";
import { getMetrics } from "../utils/metrics.js";

const router = Router();

/**
 * GET /health
 *
 * Returns service liveness status.
 * No dependencies to check — WebSocket Service intentionally has
 * no MongoDB and no Redis connections.
 */
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "retirement-party-websocket-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/metrics
 *
 * Returns safe runtime metrics (connection counts, event counts).
 * Does not expose tokens, credentials, or personal data.
 */
router.get("/health/metrics", (req, res) => {
  return res.status(200).json({
    success: true,
    data: getMetrics(),
  });
});

export default router;
