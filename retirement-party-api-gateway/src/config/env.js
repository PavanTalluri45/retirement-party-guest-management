import "dotenv/config";

/**
 * Centralized environment configuration for the API Gateway.
 * Validates required variables at startup so failures surface immediately.
 */
export const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT || "4000", 10),

  /** Internal URL of the Auth Service — never exposed to the client */
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:5000",

  /** Internal URL of the Registration Service — never exposed to the client */
  registrationServiceUrl: process.env.REGISTRATION_SERVICE_URL || "http://localhost:5001",

  /** Internal URL of the Verification Service — never exposed to the client */
  verificationServiceUrl: process.env.VERIFICATION_SERVICE_URL || "http://localhost:5002",


  /** Comma-separated allowed CORS origins */
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
      ],

  /** Firebase Admin SDK credentials (env-var path) */
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
  },
};
