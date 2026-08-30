import analyticsRepository from "../repositories/analytics.repository.js";
import { analyticsCache } from "./analytics-cache.service.js";
import { startTimer } from "../utils/latency.js";

const SUMMARY_CACHE_KEY = "analytics:v1:summary";

export class AnalyticsService {
  constructor(repo = analyticsRepository, cache = analyticsCache) {
    this.repo = repo;
    this.cache = cache;
  }

  /**
   * Get primary dashboard summary.
   * Returns aggregated registrations, attendance, and meals.
   * Leverages short-TTL cache if configured.
   */
  async getSummary() {
    const dbTimer = startTimer();

    // 1. Check cache
    const cached = await this.cache.get(SUMMARY_CACHE_KEY);
    if (cached) {
      return {
        data: cached,
        cacheHit: true,
        databaseDurationMs: 0,
      };
    }

    // 2. Compute in parallel from MongoDB
    const [registrations, attendance, meals] = await Promise.all([
      this.repo.getRegistrationStats(),
      this.repo.getAttendanceSummary(),
      this.repo.getMealStats(),
    ]);

    const data = {
      registrations,
      attendance,
      meals,
    };

    const databaseDurationMs = dbTimer.stop();

    // 3. Cache result in background
    void this.cache.set(SUMMARY_CACHE_KEY, data);

    return {
      data,
      cacheHit: false,
      databaseDurationMs,
    };
  }

  /**
   * Get registration breakdown
   */
  async getRegistrations() {
    const dbTimer = startTimer();
    const data = await this.repo.getRegistrationStats();
    return {
      data,
      databaseDurationMs: dbTimer.stop(),
    };
  }

  /**
   * Get attendance overview
   */
  async getAttendance() {
    const dbTimer = startTimer();
    const data = await this.repo.getAttendanceSummary();
    return {
      data,
      databaseDurationMs: dbTimer.stop(),
    };
  }

  /**
   * Get meal preferences
   */
  async getMeals() {
    const dbTimer = startTimer();
    const data = await this.repo.getMealStats();
    return {
      data,
      databaseDurationMs: dbTimer.stop(),
    };
  }

  /**
   * Get checkin stats
   */
  async getCheckins() {
    const dbTimer = startTimer();
    const data = await this.repo.getCheckinStats();
    return {
      data,
      databaseDurationMs: dbTimer.stop(),
    };
  }

  /**
   * Get checkin trend
   */
  async getCheckinTrend(params) {
    const dbTimer = startTimer();
    const data = await this.repo.getCheckinTrend(params);
    return {
      data,
      databaseDurationMs: dbTimer.stop(),
    };
  }

  /**
   * Get staff leaderboard
   */
  async getStaffCheckins() {
    const dbTimer = startTimer();
    const data = await this.repo.getStaffCheckinStats();
    return {
      data,
      databaseDurationMs: dbTimer.stop(),
    };
  }

  /**
   * Get recent checkins
   */
  async getRecentCheckins(limit) {
    const dbTimer = startTimer();
    const data = await this.repo.getRecentCheckins(limit);
    return {
      data,
      databaseDurationMs: dbTimer.stop(),
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

