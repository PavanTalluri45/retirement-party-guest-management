import "dotenv/config";

/**
 * Centralized environment configuration for the Verification Service.
 * Validates required variables at startup so misconfigurations fail fast.
 */

const mongoUri = process.env.MONGO_URI;
if (!mongoUri && process.env.NODE_ENV !== "test") {
  throw new Error("MONGO_URI is required but not set in environment variables.");
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5002", 10),

  /** MongoDB Atlas connection string and database name */
  mongoUri: mongoUri || "",
  dbName: process.env.DB_NAME || "retirement_party",

  /** Registration Service URL */
  registrationServiceUrl:
    process.env.REGISTRATION_SERVICE_URL || "http://localhost:5001",

  /** Upstash Redis Configuration */
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  redisUrl: process.env.REDIS_URL || "",

  /** Cache TTL settings (seconds) */
  verificationCacheTtlSeconds: parseInt(
    process.env.VERIFICATION_CACHE_TTL_SECONDS || "60",
    10
  ),
  verificationNegativeCacheTtlSeconds: parseInt(
    process.env.VERIFICATION_NEGATIVE_CACHE_TTL_SECONDS || "10",
    10
  ),

  /** Timeout settings (milliseconds) */
  redisCommandTimeoutMs: parseInt(
    process.env.REDIS_COMMAND_TIMEOUT_MS || "200",
    10
  ),
  registrationServiceTimeoutMs: parseInt(
    process.env.REGISTRATION_SERVICE_TIMEOUT_MS || "1500",
    10
  ),

  /** Bounded in-memory latency samples */
  maxLatencySamples: parseInt(
    process.env.MAX_LATENCY_SAMPLES || "10000",
    10
  ),

  /** Firebase Admin SDK credentials (env-var path) */
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
  },

  /** WebSocket Service URL and Internal Token */
  websocketServiceUrl:
    process.env.WEBSOCKET_SERVICE_URL || "http://localhost:4001",
  internalServiceToken:
    process.env.INTERNAL_SERVICE_TOKEN || "",
};
