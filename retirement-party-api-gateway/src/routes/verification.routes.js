import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { verificationClient } from "../services/verification-client.js";

const router = Router();

/** Helper to forward status, data, and response headers */
function sendProxyResponse(res, result) {
  if (result.headers) {
    if (result.headers["server-timing"]) {
      res.setHeader("Server-Timing", result.headers["server-timing"]);
    }
    if (result.headers["x-verification-duration-ms"]) {
      res.setHeader("X-Verification-Duration-Ms", result.headers["x-verification-duration-ms"]);
    }
  }
  return res.status(result.status).json(result.data);
}

/**
 * Handle confirmation verification
 */
async function handleVerifyConfirmation(req, res, next) {
  try {
    const result = await verificationClient.verifyConfirmation(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle phone verification
 */
async function handleVerifyPhone(req, res, next) {
  try {
    const result = await verificationClient.verifyPhone(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle guest check-in
 */
async function handleCheckIn(req, res, next) {
  try {
    const result = await verificationClient.checkIn(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle staff check-in history
 */
async function handleGetHistoryMe(req, res, next) {
  try {
    const result = await verificationClient.getHistoryMe(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle verification service health check
 */
async function handleVerificationHealth(req, res, next) {
  try {
    const result = await verificationClient.getHealth(req);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle verification service metrics
 */
async function handleVerificationMetrics(req, res, next) {
  try {
    const result = await verificationClient.getMetrics(req);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}

// Protected Verification Endpoints (Direct)
router.post("/verification/confirmation", authenticate, handleVerifyConfirmation);
router.post("/verification/phone", authenticate, handleVerifyPhone);
router.post("/verification/check-in", authenticate, handleCheckIn);
router.get("/verification/history/me", authenticate, handleGetHistoryMe);
router.get("/verification/health", handleVerificationHealth);
router.get("/verification/metrics", authenticate, handleVerificationMetrics);

// Protected Verification Endpoints (/api Prefixed Aliases)
router.post("/api/verification/confirmation", authenticate, handleVerifyConfirmation);
router.post("/api/verification/phone", authenticate, handleVerifyPhone);
router.post("/api/verification/check-in", authenticate, handleCheckIn);
router.get("/api/verification/history/me", authenticate, handleGetHistoryMe);
router.get("/api/verification/health", handleVerificationHealth);
router.get("/api/verification/metrics", authenticate, handleVerificationMetrics);

export default router;
