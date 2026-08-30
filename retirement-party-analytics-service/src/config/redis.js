import { Redis } from "@upstash/redis";
import { config } from "./env.js";

let redisClient = null;
let isConfigured = false;

if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
  try {
    redisClient = new Redis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    });
    isConfigured = true;
  } catch (err) {
    console.warn("[Redis Config] Failed to initialize Upstash Redis:", err.message);
    redisClient = null;
    isConfigured = false;
  }
}

/**
 * Get the active Redis client or null if not configured.
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Check whether Redis is configured.
 */
export function isRedisConfigured() {
  return isConfigured && redisClient !== null;
}

/**
 * Check Upstash Redis reachability and latency.
 * Safe to call at startup or during /health endpoint check.
 */
export async function checkRedisHealth() {
  if (!isRedisConfigured()) {
    return {
      configured: false,
      ok: false,
      status: "unconfigured",
      message: "Upstash Redis credentials not provided. Analytics operates directly on MongoDB.",
    };
  }

  const start = Date.now();
  try {
    const pingPromise = redisClient.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timeout")), config.redisCommandTimeoutMs)
    );

    const pong = await Promise.race([pingPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    return {
      configured: true,
      ok: pong === "PONG" || pong === "OK" || typeof pong === "string",
      status: "connected",
      latencyMs,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      status: "unreachable",
      error: error.message,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Inject custom redis client for testing.
 */
export function setRedisClient(client) {
  redisClient = client;
  isConfigured = client !== null;
}

export default { getRedisClient, isRedisConfigured, checkRedisHealth, setRedisClient };

