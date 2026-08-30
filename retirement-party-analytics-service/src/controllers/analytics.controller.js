import { analyticsService } from "../services/analytics.service.js";
import {
  TrendQuerySchema,
  PaginationQuerySchema,
  validateQuery,
} from "../validators/analytics.validator.js";
import { startTimer } from "../utils/latency.js";
import { metrics } from "../utils/metrics.js";

/**
 * Analytics Controller
 * Handles incoming HTTP requests for analytics endpoints, measures duration,
 * records operational metrics, and formats responses consistently.
 */
export class AnalyticsController {
  constructor(service = analyticsService) {
    this.service = service;
  }

  /**
   * Helper to set performance timing headers and log metrics
   */
  setTimingHeaders(res, { totalMs, dbMs, cacheHit }) {
    const timingParts = [`total;dur=${totalMs}`];
    if (dbMs !== undefined) timingParts.push(`db;dur=${dbMs}`);
    if (cacheHit !== undefined) timingParts.push(`cache;desc="${cacheHit ? "HIT" : "MISS"}"`);

    res.setHeader("Server-Timing", timingParts.join(", "));
    res.setHeader("X-Analytics-Duration-Ms", String(totalMs));
    if (cacheHit !== undefined) {
      res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
    }
  }

  /**
   * GET /analytics/summary
   * Primary dashboard overview
   */
  getSummary = async (req, res, next) => {
    const timer = startTimer();
    try {
      const { data, cacheHit, databaseDurationMs } = await this.service.getSummary();
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs, cacheHit });
      metrics.recordRequest("/analytics/summary", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/summary", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/registrations
   */
  getRegistrations = async (req, res, next) => {
    const timer = startTimer();
    try {
      const { data, databaseDurationMs } = await this.service.getRegistrations();
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs });
      metrics.recordRequest("/analytics/registrations", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/registrations", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/attendance
   */
  getAttendance = async (req, res, next) => {
    const timer = startTimer();
    try {
      const { data, databaseDurationMs } = await this.service.getAttendance();
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs });
      metrics.recordRequest("/analytics/attendance", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/attendance", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/meals
   */
  getMeals = async (req, res, next) => {
    const timer = startTimer();
    try {
      const { data, databaseDurationMs } = await this.service.getMeals();
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs });
      metrics.recordRequest("/analytics/meals", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/meals", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/checkins
   */
  getCheckins = async (req, res, next) => {
    const timer = startTimer();
    try {
      const { data, databaseDurationMs } = await this.service.getCheckins();
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs });
      metrics.recordRequest("/analytics/checkins", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/checkins", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/checkins/trend
   */
  getCheckinTrend = async (req, res, next) => {
    const timer = startTimer();
    try {
      const validatedQuery = validateQuery(TrendQuerySchema, req.query);
      const { data, databaseDurationMs } = await this.service.getCheckinTrend(validatedQuery);
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs });
      metrics.recordRequest("/analytics/checkins/trend", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/checkins/trend", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/staff/checkins
   */
  getStaffCheckins = async (req, res, next) => {
    const timer = startTimer();
    try {
      const { data, databaseDurationMs } = await this.service.getStaffCheckins();
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs });
      metrics.recordRequest("/analytics/staff/checkins", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/staff/checkins", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/checkins/recent
   */
  getRecentCheckins = async (req, res, next) => {
    const timer = startTimer();
    try {
      const validatedQuery = validateQuery(PaginationQuerySchema, req.query);
      const { data, databaseDurationMs } = await this.service.getRecentCheckins(validatedQuery.limit);
      const totalMs = timer.stop();

      this.setTimingHeaders(res, { totalMs, dbMs: databaseDurationMs });
      metrics.recordRequest("/analytics/checkins/recent", totalMs, true);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      metrics.recordRequest("/analytics/checkins/recent", timer.stop(), false);
      next(error);
    }
  };

  /**
   * GET /analytics/metrics
   * Diagnostic latency percentiles and cache statistics
   */
  getMetrics = (req, res) => {
    const snapshot = metrics.getSnapshot();
    return res.status(200).json({
      success: true,
      service: "retirement-party-analytics-service",
      data: snapshot,
    });
  };
}

export const analyticsController = new AnalyticsController();
export default analyticsController;

