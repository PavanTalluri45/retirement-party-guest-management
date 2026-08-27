import "dotenv/config";

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
  dbName: process.env.DB_NAME || "retirement_party",
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
};

if (!config.mongoUri) {
  throw new Error("MONGODB_URI or MONGO_URI environment variable is required.");
}

