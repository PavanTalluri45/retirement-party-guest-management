import "dotenv/config";

/**
 * Centralized environment configuration for the Analytics Service.
 * Validates required variables at startup so misconfigurations fail fast.
 */

const mongoUri = process.env.MONGO_URI;
if (!mongoUri && process.env.NODE_ENV !== "test") {
  throw new Error("MONGO_URI is required but not set in environment variables.");
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5003", 10),

  /** MongoDB Atlas connection string and database name */
  mongoUri: mongoUri || "",
  dbName: process.env.DB_NAME || "retirement_party",

  /** Upstash Redis Configuration */
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",

  /** Cache TTL settings (seconds) */
  analyticsCacheTtlSeconds: parseInt(
    process.env.ANALYTICS_CACHE_TTL_SECONDS || "15",
    10
  ),

  /** Redis command timeout in milliseconds */
  redisCommandTimeoutMs: parseInt(
    process.env.REDIS_COMMAND_TIMEOUT_MS || "200",
    10
  ),

  /** Max latency samples to preserve in-memory for p50/p95/p99 calculations */
  maxLatencySamples: parseInt(
    process.env.MAX_LATENCY_SAMPLES || "10000",
    10
  ),
};

export default config;

