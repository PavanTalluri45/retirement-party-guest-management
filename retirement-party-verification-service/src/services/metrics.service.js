import { config } from "../config/env.js";
import { calculateLatencyStats } from "../utils/percentile.js";

/**
 * Ring Buffer for Bounded In-Memory Latency Samples
 *
 * DSA Properties:
 * - Insert: O(1)
 * - Space Complexity: O(K) where K = max capacity (default 10,000)
 * - Extraction for sorting: O(N) copy, O(N log N) sort
 */
class LatencyRingBuffer {
  constructor(capacity = config.maxLatencySamples) {
    this.capacity = capacity;
    this.buffer = new Float64Array(capacity);
    this.writeIndex = 0;
    this.count = 0;
  }

  push(value) {
    if (typeof value !== "number" || isNaN(value)) return;
    this.buffer[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  toArray() {
    if (this.count === 0) return [];
    const result = new Array(this.count);
    if (this.count < this.capacity) {
      for (let i = 0; i < this.count; i++) {
        result[i] = this.buffer[i];
      }
    } else {
      let idx = 0;
      for (let i = this.writeIndex; i < this.capacity; i++) {
        result[idx++] = this.buffer[i];
      }
      for (let i = 0; i < this.writeIndex; i++) {
        result[idx++] = this.buffer[i];
      }
    }
    return result;
  }

  clear() {
    this.writeIndex = 0;
    this.count = 0;
  }
}

/**
 * Metrics Service
 * Centralized observability for verification, caching, check-ins, and latencies.
 */
export class MetricsService {
  constructor() {
    this.counters = {
      requestsTotal: 0,
      cacheHit: 0,
      cacheMiss: 0,
      cacheError: 0,
      sourceSuccess: 0,
      sourceError: 0,
      guestNotFound: 0,
      checkinSuccess: 0,
      checkinDuplicate: 0,
      checkinError: 0,
    };

    this.verificationDurationBuffer = new LatencyRingBuffer();
    this.cacheLookupBuffer = new LatencyRingBuffer();
    this.sourceLookupBuffer = new LatencyRingBuffer();
    this.checkinDurationBuffer = new LatencyRingBuffer();
  }

  increment(metric, amount = 1) {
    if (this.counters[metric] !== undefined) {
      this.counters[metric] += amount;
    }
  }

  recordVerificationLatency(durationMs) {
    this.verificationDurationBuffer.push(durationMs);
  }

  recordCacheLookupLatency(durationMs) {
    this.cacheLookupBuffer.push(durationMs);
  }

  recordSourceLookupLatency(durationMs) {
    this.sourceLookupBuffer.push(durationMs);
  }

  recordCheckinLatency(durationMs) {
    this.checkinDurationBuffer.push(durationMs);
  }

  getHitRate() {
    const hits = this.counters.cacheHit;
    const misses = this.counters.cacheMiss;
    const totalLookups = hits + misses;
    if (totalLookups === 0) return 0;
    return Number(((hits / totalLookups) * 100).toFixed(2));
  }

  getMetrics() {
    const hits = this.counters.cacheHit;
    const misses = this.counters.cacheMiss;
    const totalLookups = hits + misses;
    const hitRateRatio = totalLookups > 0 ? Number((hits / totalLookups).toFixed(4)) : 0;

    const verificationStats = calculateLatencyStats(this.verificationDurationBuffer.toArray());
    const cacheLookupStats = calculateLatencyStats(this.cacheLookupBuffer.toArray());
    const sourceLookupStats = calculateLatencyStats(this.sourceLookupBuffer.toArray());
    const checkinStats = calculateLatencyStats(this.checkinDurationBuffer.toArray());

    return {
      service: "retirement-party-verification-service",
      timestamp: new Date().toISOString(),
      counters: { ...this.counters },
      caching: {
        hits,
        misses,
        errors: this.counters.cacheError,
        hitRate: `${this.getHitRate()}%`,
        hitRateRatio,
        lookupDuration: cacheLookupStats,
      },
      verification: {
        requests: this.counters.requestsTotal,
        notFound: this.counters.guestNotFound,
        durationMs: verificationStats,
      },
      sourceService: {
        success: this.counters.sourceSuccess,
        errors: this.counters.sourceError,
        durationMs: sourceLookupStats,
      },
      checkin: {
        success: this.counters.checkinSuccess,
        duplicates: this.counters.checkinDuplicate,
        errors: this.counters.checkinError,
        durationMs: checkinStats,
      },
    };
  }

  reset() {
    Object.keys(this.counters).forEach((k) => (this.counters[k] = 0));
    this.verificationDurationBuffer.clear();
    this.cacheLookupBuffer.clear();
    this.sourceLookupBuffer.clear();
    this.checkinDurationBuffer.clear();
  }
}

export const metricsService = new MetricsService();
export default metricsService;
