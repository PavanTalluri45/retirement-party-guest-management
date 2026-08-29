import { verificationService } from "../services/verification.service.js";
import { checkinService } from "../services/checkin.service.js";
import { metricsService } from "../services/metrics.service.js";
import { checkRedisHealth } from "../config/redis.js";
import { getDb } from "../config/database.js";
import {
  PhoneVerificationSchema,
  ConfirmationVerificationSchema,
  CheckInSchema,
  HistoryQuerySchema,
} from "../validators/verification.validator.js";
import { formatServerTiming } from "../utils/latency.js";

/**
 * POST /verification/confirmation
 */
export async function verifyConfirmation(req, res, next) {
  try {
    const parsed = ConfirmationVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid confirmation code format.");
      err.type = "VALIDATION_ERROR";
      err.errors = (parsed.error.issues || parsed.error.errors || []).map((e) => e.message);
      return next(err);
    }

    const { confirmationNumber } = parsed.data;
    const result = await verificationService.verifyByConfirmationNumber(
      confirmationNumber,
      req.requestId
    );

    if (result.timings) {
      res.setHeader("Server-Timing", formatServerTiming(result.timings));
    }
    if (result.meta?.durationMs) {
      res.setHeader("X-Verification-Duration-Ms", String(result.meta.durationMs));
    }

    return res.status(200).json({
      success: true,
      message: "Attendee verified successfully.",
      data: {
        guest: result.guest,
      },
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /verification/phone
 */
export async function verifyPhone(req, res, next) {
  try {
    const parsed = PhoneVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid phone number format.");
      err.type = "VALIDATION_ERROR";
      err.errors = (parsed.error.issues || parsed.error.errors || []).map((e) => e.message);
      return next(err);
    }

    const { phone } = parsed.data;
    const result = await verificationService.verifyByPhone(phone, req.requestId);

    if (result.timings) {
      res.setHeader("Server-Timing", formatServerTiming(result.timings));
    }
    if (result.meta?.durationMs) {
      res.setHeader("X-Verification-Duration-Ms", String(result.meta.durationMs));
    }

    return res.status(200).json({
      success: true,
      message: "Attendee verified successfully.",
      data: {
        guest: result.guest,
      },
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /verification/check-in
 */
export async function checkIn(req, res, next) {
  try {
    const parsed = CheckInSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid check-in payload.");
      err.type = "VALIDATION_ERROR";
      err.errors = (parsed.error.issues || parsed.error.errors || []).map((e) => e.message);
      return next(err);
    }

    const { verificationMethod, value } = parsed.data;

    // Extract staff identity securely from verified authentication context
    const staffId =
      req.user?.firebaseUid ||
      req.user?._id?.toString() ||
      req.auth?.firebaseUid ||
      "staff_anonymous";

    const staffName = req.user?.name || req.auth?.email || "Staff Member";
    const staffEmail = req.user?.email || req.auth?.email || "";

    const result = await checkinService.checkInGuest({
      verificationMethod,
      value,
      staffId,
      staffName,
      staffEmail,
      requestId: req.requestId,
    });

    if (result.timings) {
      res.setHeader("Server-Timing", formatServerTiming(result.timings));
    }
    if (result.meta?.durationMs) {
      res.setHeader("X-CheckIn-Duration-Ms", String(result.meta.durationMs));
    }

    return res.status(200).json({
      success: true,
      message: "Attendee checked in successfully.",
      data: {
        guest: result.guest,
        checkin: result.checkin,
      },
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /verification/history/me
 */
export async function getHistoryMe(req, res, next) {
  try {
    const parsed = HistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const err = new Error("Invalid query parameters.");
      err.type = "VALIDATION_ERROR";
      err.errors = (parsed.error.issues || parsed.error.errors || []).map((e) => e.message);
      return next(err);
    }

    const { page, limit, search } = parsed.data;
    const staffId =
      req.user?.firebaseUid ||
      req.user?._id?.toString() ||
      req.auth?.firebaseUid ||
      "staff_anonymous";

    const result = await checkinService.getStaffHistory({
      staffId,
      page,
      limit,
      search,
    });

    return res.status(200).json({
      success: true,
      data: {
        checkins: result.checkins,
        summary: result.summary,
      },
      pagination: result.pagination,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /health
 *
 * Resilience Strategy:
 * - If Redis is down but MongoDB is up -> service returns 'degraded' (HTTP 200).
 * - MongoDB is the only hard dependency for critical availability.
 */
export async function healthCheck(req, res) {
  let mongoStatus = "connected";
  try {
    const db = getDb();
    await db.command({ ping: 1 });
  } catch (err) {
    mongoStatus = "disconnected";
  }

  const redisHealth = await checkRedisHealth();
  const redisStatus = redisHealth.ok ? "connected" : "unavailable";

  const isDegraded = redisStatus === "unavailable";
  const isHealthy = mongoStatus === "connected";

  const overallStatus = !isHealthy
    ? "unhealthy"
    : isDegraded
    ? "degraded"
    : "healthy";

  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    service: "retirement-party-verification-service",
    status: overallStatus,
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus,
      redisLatencyMs: redisHealth.latencyMs,
    },
  });
}

/**
 * GET /health/metrics or GET /metrics
 */
export async function getMetrics(req, res) {
  const metrics = metricsService.getMetrics();
  return res.status(200).json({
    success: true,
    data: metrics,
  });
}

export default {
  verifyConfirmation,
  verifyPhone,
  checkIn,
  getHistoryMe,
  healthCheck,
  getMetrics,
};
