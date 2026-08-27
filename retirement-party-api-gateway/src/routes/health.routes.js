import { Router } from "express";
import { authClient } from "../services/auth-client.js";

const router = Router();

/**
 * Gateway self-health check
 * GET /health
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "retirement-party-api-gateway",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Auth Service health check from Gateway
 * GET /health/auth
 */
router.get("/health/auth", async (req, res) => {
  try {
    const result = await authClient.checkHealth();
    res.status(result.status).json({
      gateway: "healthy",
      authService: result.data,
    });
  } catch (error) {
    res.status(503).json({
      gateway: "healthy",
      authService: {
        success: false,
        status: "unreachable",
        message: error.message,
      },
    });
  }
});

export default router;

