import { Router } from "express";
import { authClient } from "../services/auth-client.js";
import { registrationClient } from "../services/registration-client.js";
import { verificationClient } from "../services/verification-client.js";
import { analyticsClient } from "../services/analytics-client.js";

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
    services: ["auth", "registration", "verification", "analytics"],
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

/**
 * Registration Service health check from Gateway
 * GET /health/registration
 */
router.get("/health/registration", async (req, res) => {
  try {
    const result = await registrationClient.checkHealth();
    res.status(result.status).json({
      gateway: "healthy",
      registrationService: result.data,
    });
  } catch (error) {
    res.status(503).json({
      gateway: "healthy",
      registrationService: {
        success: false,
        status: "unreachable",
        message: error.message,
      },
    });
  }
});

/**
 * Verification Service health check from Gateway
 * GET /health/verification
 */
router.get("/health/verification", async (req, res) => {
  try {
    const result = await verificationClient.getHealth(req);
    res.status(result.status).json({
      gateway: "healthy",
      verificationService: result.data,
    });
  } catch (error) {
    res.status(503).json({
      gateway: "healthy",
      verificationService: {
        success: false,
        status: "unreachable",
        message: error.message,
      },
    });
  }
});

/**
 * Analytics Service health check from Gateway
 * GET /health/analytics
 */
router.get("/health/analytics", async (req, res) => {
  try {
    const result = await analyticsClient.getHealth(req);
    res.status(result.status).json({
      gateway: "healthy",
      analyticsService: result.data,
    });
  } catch (error) {
    res.status(503).json({
      gateway: "healthy",
      analyticsService: {
        success: false,
        status: "unreachable",
        message: error.message,
      },
    });
  }
});

/**
 * Consolidated health check for all downstream services
 * GET /health/all
 */
router.get("/health/all", async (req, res) => {
  const [authRes, regRes, verRes, anaRes] = await Promise.allSettled([
    authClient.checkHealth(),
    registrationClient.checkHealth(),
    verificationClient.getHealth(req),
    analyticsClient.getHealth(req),
  ]);

  const authHealth =
    authRes.status === "fulfilled"
      ? authRes.value.data
      : { success: false, status: "unreachable", message: authRes.reason?.message };

  const regHealth =
    regRes.status === "fulfilled"
      ? regRes.value.data
      : { success: false, status: "unreachable", message: regRes.reason?.message };

  const verHealth =
    verRes.status === "fulfilled"
      ? verRes.value.data
      : { success: false, status: "unreachable", message: verRes.reason?.message };

  const anaHealth =
    anaRes.status === "fulfilled"
      ? anaRes.value.data
      : { success: false, status: "unreachable", message: anaRes.reason?.message };

  const allHealthy =
    authRes.status === "fulfilled" &&
    authRes.value.status === 200 &&
    regRes.status === "fulfilled" &&
    regRes.value.status === 200 &&
    verRes.status === "fulfilled" &&
    verRes.value.status === 200 &&
    anaRes.status === "fulfilled" &&
    anaRes.value.status === 200;

  res.status(allHealthy ? 200 : 207).json({
    gateway: "healthy",
    overallStatus: allHealthy ? "healthy" : "degraded",
    services: {
      authService: authHealth,
      registrationService: regHealth,
      verificationService: verHealth,
      analyticsService: anaHealth,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
