import "dotenv/config";

/**
 * Centralized environment configuration for the Registration Service.
 * Validates required variables at startup so failures surface immediately.
 */

const mongoUri = process.env.MONGO_URI;
if (!mongoUri && process.env.NODE_ENV !== "test") {
  throw new Error("MONGO_URI is required but not set in environment variables.");
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT || "5001", 10),

  /** MongoDB Atlas connection string */
  mongoUri: mongoUri || "",

  /** Database name */
  dbName: process.env.DB_NAME || "retirement_party",

  /** WebSocket Service URL and Internal Token */
  websocketServiceUrl:
    process.env.WEBSOCKET_SERVICE_URL || "http://localhost:4001",
  internalServiceToken:
    process.env.INTERNAL_SERVICE_TOKEN || "",
};

