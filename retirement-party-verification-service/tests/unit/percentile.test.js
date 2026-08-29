import {
  calculatePercentile,
  calculateLatencyStats,
} from "../../src/utils/percentile.js";

describe("Percentile & Latency Statistics Calculations", () => {
  describe("calculatePercentile", () => {
    it("should return 0 for empty array", () => {
      expect(calculatePercentile([], 0.5)).toBe(0);
    });

    it("should return single value for 1-element array", () => {
      expect(calculatePercentile([42], 0.95)).toBe(42);
    });

    it("should calculate correct nearest rank percentiles on sorted array", () => {
      // 1 to 100
      const sorted = Array.from({ length: 100 }, (_, i) => i + 1);

      expect(calculatePercentile(sorted, 0.5)).toBe(50);
      expect(calculatePercentile(sorted, 0.95)).toBe(95);
      expect(calculatePercentile(sorted, 0.99)).toBe(99);
      expect(calculatePercentile(sorted, 1.0)).toBe(100);
    });

    it("should clamp indices safely for boundary percentiles", () => {
      const sorted = [10, 20, 30, 40, 50];
      expect(calculatePercentile(sorted, 0.01)).toBe(10);
      expect(calculatePercentile(sorted, 1.0)).toBe(50);
    });
  });

  describe("calculateLatencyStats", () => {
    it("should return zeroes for empty or null samples", () => {
      expect(calculateLatencyStats([])).toEqual({
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      });
      expect(calculateLatencyStats(null)).toEqual({
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      });
    });

    it("should compute min, max, avg, p50, p95, p99 correctly", () => {
      const samples = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const stats = calculateLatencyStats(samples);

      expect(stats.count).toBe(10);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(100);
      expect(stats.avg).toBe(55);
      expect(stats.p50).toBe(50);
      expect(stats.p95).toBe(100);
      expect(stats.p99).toBe(100);
    });
  });
});
