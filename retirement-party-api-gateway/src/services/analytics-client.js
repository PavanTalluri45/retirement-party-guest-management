import { config } from "../config/env.js";
import { proxyRequest } from "../utils/proxy-request.js";

/**
 * Analytics Client
 * Proxies admin analytics requests to the downstream Analytics Service (:5003)
 */
export class AnalyticsClient {
  constructor(baseUrl = config.analyticsServiceUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Forward Summary
   * GET /analytics/summary
   */
  async getSummary(req) {
    return proxyRequest(`${this.baseUrl}/analytics/summary`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Registrations
   * GET /analytics/registrations
   */
  async getRegistrations(req) {
    return proxyRequest(`${this.baseUrl}/analytics/registrations`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Attendance
   * GET /analytics/attendance
   */
  async getAttendance(req) {
    return proxyRequest(`${this.baseUrl}/analytics/attendance`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Meals
   * GET /analytics/meals
   */
  async getMeals(req) {
    return proxyRequest(`${this.baseUrl}/analytics/meals`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Checkins
   * GET /analytics/checkins
   */
  async getCheckins(req) {
    return proxyRequest(`${this.baseUrl}/analytics/checkins`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Checkin Trend
   * GET /analytics/checkins/trend
   */
  async getCheckinTrend(req) {
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return proxyRequest(`${this.baseUrl}/analytics/checkins/trend${queryString}`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Staff Checkins
   * GET /analytics/staff/checkins
   */
  async getStaffCheckins(req) {
    return proxyRequest(`${this.baseUrl}/analytics/staff/checkins`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Recent Checkins
   * GET /analytics/checkins/recent
   */
  async getRecentCheckins(req) {
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return proxyRequest(`${this.baseUrl}/analytics/checkins/recent${queryString}`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Analytics Metrics
   * GET /analytics/metrics
   */
  async getMetrics(req) {
    return proxyRequest(`${this.baseUrl}/analytics/metrics`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Analytics Health Check
   * GET /health
   */
  async getHealth(req) {
    return proxyRequest(`${this.baseUrl}/health`, req, {
      method: "GET",
    });
  }
}

export const analyticsClient = new AnalyticsClient();
export default analyticsClient;

