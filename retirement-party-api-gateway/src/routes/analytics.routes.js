import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorize-admin.js";
import { analyticsClient } from "../services/analytics-client.js";

const router = Router();

/** Helper to forward status, data, and response headers */
function sendProxyResponse(res, result) {
  if (result.headers) {
    if (result.headers["server-timing"]) {
      res.setHeader("Server-Timing", result.headers["server-timing"]);
    }
    if (result.headers["x-analytics-duration-ms"]) {
      res.setHeader("X-Analytics-Duration-Ms", result.headers["x-analytics-duration-ms"]);
    }
    if (result.headers["x-cache"]) {
      res.setHeader("X-Cache", result.headers["x-cache"]);
    }
  }
  return res.status(result.status).json(result.data);
}

// Handlers
async function handleSummary(req, res, next) {
  try {
    const result = await analyticsClient.getSummary(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleRegistrations(req, res, next) {
  try {
    const result = await analyticsClient.getRegistrations(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleAttendance(req, res, next) {
  try {
    const result = await analyticsClient.getAttendance(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleMeals(req, res, next) {
  try {
    const result = await analyticsClient.getMeals(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleCheckins(req, res, next) {
  try {
    const result = await analyticsClient.getCheckins(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleCheckinTrend(req, res, next) {
  try {
    const result = await analyticsClient.getCheckinTrend(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleStaffCheckins(req, res, next) {
  try {
    const result = await analyticsClient.getStaffCheckins(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleRecentCheckins(req, res, next) {
  try {
    const result = await analyticsClient.getRecentCheckins(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleMetrics(req, res, next) {
  try {
    const result = await analyticsClient.getMetrics(req);
    return sendProxyResponse(res, result);
  } catch (error) {
    next(error);
  }
}

async function handleAnalyticsHealth(req, res, next) {
  try {
    const result = await analyticsClient.getHealth(req);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
}

// Protected Admin Analytics Routes
router.get("/analytics/summary", authenticate, authorizeAdmin, handleSummary);
router.get("/analytics/registrations", authenticate, authorizeAdmin, handleRegistrations);
router.get("/analytics/attendance", authenticate, authorizeAdmin, handleAttendance);
router.get("/analytics/meals", authenticate, authorizeAdmin, handleMeals);
router.get("/analytics/checkins", authenticate, authorizeAdmin, handleCheckins);
router.get("/analytics/checkins/trend", authenticate, authorizeAdmin, handleCheckinTrend);
router.get("/analytics/staff/checkins", authenticate, authorizeAdmin, handleStaffCheckins);
router.get("/analytics/checkins/recent", authenticate, authorizeAdmin, handleRecentCheckins);
router.get("/analytics/metrics", authenticate, authorizeAdmin, handleMetrics);
router.get("/analytics/health", handleAnalyticsHealth);

// /api Prefixed Aliases
router.get("/api/analytics/summary", authenticate, authorizeAdmin, handleSummary);
router.get("/api/analytics/registrations", authenticate, authorizeAdmin, handleRegistrations);
router.get("/api/analytics/attendance", authenticate, authorizeAdmin, handleAttendance);
router.get("/api/analytics/meals", authenticate, authorizeAdmin, handleMeals);
router.get("/api/analytics/checkins", authenticate, authorizeAdmin, handleCheckins);
router.get("/api/analytics/checkins/trend", authenticate, authorizeAdmin, handleCheckinTrend);
router.get("/api/analytics/staff/checkins", authenticate, authorizeAdmin, handleStaffCheckins);
router.get("/api/analytics/checkins/recent", authenticate, authorizeAdmin, handleRecentCheckins);
router.get("/api/analytics/metrics", authenticate, authorizeAdmin, handleMetrics);
router.get("/api/analytics/health", handleAnalyticsHealth);

export default router;

