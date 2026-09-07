import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { config } from "./env.js";

const require = createRequire(import.meta.url);

let adminAuthInstance = null;

/**
 * Get or initialize Firebase Admin Auth.
 *
 * Credential priority:
 *
 * 1. Local ServiceAccountKey.json
 *    <service-root>/ServiceAccountKey.json
 *
 * 2. Firebase environment variables
 *    FIREBASE_PROJECT_ID
 *    FIREBASE_CLIENT_EMAIL
 *    FIREBASE_PRIVATE_KEY
 *
 * Tests use a lightweight mock verifier.
 */
export function getAdminAuth() {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }

  /*
   * Test environment
   *
   * This prevents automated tests from requiring real Firebase
   * credentials.
   */
  if (process.env.NODE_ENV === "test") {
    adminAuthInstance = {
      verifyIdToken: async (token) => {
        if (!token || token === "invalid-token") {
          const error = new Error("Invalid token");
          error.code = "auth/argument-error";
          throw error;
        }

        return {
          uid: "test-firebase-uid",
          email: "staff@event.com",
        };
      },
    };

    return adminAuthInstance;
  }

  /*
   * Firebase environment credentials.
   *
   * These are kept as a fallback so the service remains compatible
   * with environments where Firebase credentials are provided through
   * environment variables.
   */
  const hasEnvCredentials =
    Boolean(config.firebase?.projectId) &&
    Boolean(config.firebase?.clientEmail) &&
    Boolean(config.firebase?.privateKey);

  /*
   * Local development credential location.
   */
  const localServiceAccountPath = path.resolve(
    process.cwd(),
    "ServiceAccountKey.json"
  );

  const serviceAccountPath = localServiceAccountPath;
  const hasKeyFile = fs.existsSync(serviceAccountPath);

  try {
    const {
      initializeApp,
      cert,
      getApps,
      getApp,
    } = require("firebase-admin/app");

    const { getAuth } = require("firebase-admin/auth");

    let firebaseApp;

    /*
     * Reuse an already initialized Firebase app.
     */
    if (getApps().length > 0) {
      firebaseApp = getApp();

      console.log(
        "[Firebase Admin] Reusing existing Firebase Admin SDK instance."
      );
    }

    /*
     * Local ServiceAccountKey.json takes priority.
     */
    else if (hasKeyFile) {
      const serviceAccount = require(serviceAccountPath);

      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });

      console.log(
        `[Firebase Admin] Initialized from ServiceAccountKey.json at ${serviceAccountPath}.`
      );
    }

    /*
     * Environment credentials are the fallback.
     */
    else if (hasEnvCredentials) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });

      console.log(
        "[Firebase Admin] Initialized from environment variables."
      );
    }

    /*
     * No credentials available.
     */
    else {
      throw new Error(
        "[Firebase Admin] No Firebase credentials found.\n" +
          "Checked:\n" +
          `- ${localServiceAccountPath}\n` +
          "- FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY"
      );
    }

    adminAuthInstance = getAuth(firebaseApp);

    return adminAuthInstance;
  } catch (error) {
    /*
     * Do not silently continue in production.
     *
     * The Verification Service needs Firebase authentication,
     * so starting without Firebase Admin would only move the
     * failure somewhere else and make debugging worse.
     */
    console.error(
      `[Firebase Admin] Initialization failed: ${error.message}`
    );

    throw error;
  }
}

/**
 * Inject a mock Firebase Auth instance for tests.
 */
export function setAdminAuth(mockAuth) {
  adminAuthInstance = mockAuth;
}

/*
 * Initialize Firebase Auth when this module is loaded.
 */
export const adminAuth = getAdminAuth();

export default {
  getAdminAuth,
  setAdminAuth,
  adminAuth,
};