import { Redis } from "@upstash/redis";
import { config } from "./env.js";

let redisClient = null;

/**
 * Initialize or return the singleton Upstash Redis client.
 */
export function getRedisClient() {
  if (redisClient) return redisClient;

  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
    console.warn(
      "[Redis Config] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Redis caching will be disabled/degraded."
    );
    return null;
  }

  try {
    redisClient = new Redis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    });
    return redisClient;
  } catch (error) {
    console.error("[Redis Config] Failed to initialize Upstash Redis client:", error.message);
    return null;
  }
}

/**
 * Injects a custom/mock Redis client (useful in tests).
 */
export function setRedisClient(mockClient) {
  redisClient = mockClient;
}

/**
 * Execute a Redis operation wrapped with a strict configurable timeout.
 * If Redis takes longer than REDIS_COMMAND_TIMEOUT_MS or errors, it throws or rejects gracefully.
 *
 * @template T
 * @param {(client: Redis) => Promise<T>} operation
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
export async function executeRedisCommand(operation, timeoutMs = config.redisCommandTimeoutMs) {
  const client = getRedisClient();
  if (!client) {
    throw new Error("Redis client is not available or not configured.");
  }

  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Redis command timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation(client), timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

/**
 * Check whether Upstash Redis is currently reachable.
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string }>}
 */
export async function checkRedisHealth() {
  const start = performance.now();
  try {
    const res = await executeRedisCommand((client) => client.ping(), 500);
    const latencyMs = Math.round(performance.now() - start);
    return { ok: res === "PONG" || res === "OK" || Boolean(res), latencyMs };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs, error: error.message };
  }
}

export default {
  getRedisClient,
  setRedisClient,
  executeRedisCommand,
  checkRedisHealth,
};
