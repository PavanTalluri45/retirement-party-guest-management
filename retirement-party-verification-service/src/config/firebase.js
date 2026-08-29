import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { config } from "./env.js";

const require = createRequire(import.meta.url);

let adminAuthInstance = null;

/**
 * Get or initialize the Firebase Admin Auth instance.
 * Gracefully provides a test-safe auth verifier during automated testing.
 */
export function getAdminAuth() {
  if (adminAuthInstance) return adminAuthInstance;

  // In test environment, return a standard mockable verifier
  if (process.env.NODE_ENV === "test") {
    adminAuthInstance = {
      verifyIdToken: async (token) => {
        if (!token || token === "invalid-token") {
          const err = new Error("Invalid token");
          err.code = "auth/argument-error";
          throw err;
        }
        return {
          uid: "test-firebase-uid",
          email: "staff@event.com",
        };
      },
    };
    return adminAuthInstance;
  }

  const hasEnvCredentials =
    config.firebase.projectId &&
    config.firebase.clientEmail &&
    config.firebase.privateKey;

  const serviceAccountPath = path.resolve(process.cwd(), "ServiceAccountKey.json");
  const hasKeyFile = fs.existsSync(serviceAccountPath);

  try {
    const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
    const { getAuth } = require("firebase-admin/auth");

    let firebaseApp;
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else if (hasEnvCredentials) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
      console.log("[Firebase Admin] Initialized from environment variables.");
    } else if (hasKeyFile) {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("[Firebase Admin] Initialized from ServiceAccountKey.json.");
    }

    if (firebaseApp) {
      adminAuthInstance = getAuth(firebaseApp);
    }
  } catch (error) {
    console.warn(
      `[Firebase Admin] Could not initialize Admin SDK (${error.message}). Running in fallback mode.`
    );
  }

  return adminAuthInstance;
}

/**
 * Injects a mock auth instance for unit/integration tests.
 */
export function setAdminAuth(mockAuth) {
  adminAuthInstance = mockAuth;
}

export const adminAuth = getAdminAuth();
export default { getAdminAuth, setAdminAuth, adminAuth };
