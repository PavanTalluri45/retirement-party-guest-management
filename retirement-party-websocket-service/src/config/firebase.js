import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

let adminAuthInstance = null;

/**
 * Firebase Admin SDK initialization for the WebSocket Service.
 *
 * Credential priority:
 *
 * 1. Render Secret File
 *    /etc/secrets/ServiceAccountKey.json
 *
 * 2. Local ServiceAccountKey.json
 *    <service-root>/ServiceAccountKey.json
 *
 * 3. Firebase environment variables
 *    FIREBASE_PROJECT_ID
 *    FIREBASE_CLIENT_EMAIL
 *    FIREBASE_PRIVATE_KEY
 *
 * Test mode uses a mock verifier.
 *
 * This service only uses Firebase Admin for:
 * - Verifying Firebase ID tokens during Socket.IO authentication.
 *
 * It does not use Firestore or any Firebase database.
 */

/**
 * Get or initialize Firebase Admin Auth.
 */
export function getAdminAuth() {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }

  /*
   * Test environment.
   *
   * This keeps Jest tests independent from real Firebase credentials.
   */
  if (process.env.NODE_ENV === "test") {
    adminAuthInstance = {
      verifyIdToken: async (token) => {
        if (
          !token ||
          token === "invalid-token" ||
          token === "expired-token"
        ) {
          const error = new Error("Invalid token");
          error.code = "auth/argument-error";
          throw error;
        }

        return {
          uid: "test-firebase-uid",
          email: "admin@event.com",
        };
      },
    };

    return adminAuthInstance;
  }

  /*
   * Local development credential path.
   */
  const localServiceAccountPath = path.resolve(
    process.cwd(),
    "ServiceAccountKey.json"
  );

  /*
   * Render Secret File path.
   */
  const renderServiceAccountPath =
    "/etc/secrets/ServiceAccountKey.json";

  /*
   * Prefer the Render Secret File when available.
   *
   * If running locally, fall back to the local file.
   */
  const serviceAccountPath = fs.existsSync(renderServiceAccountPath)
    ? renderServiceAccountPath
    : localServiceAccountPath;

  const hasKeyFile = fs.existsSync(serviceAccountPath);

  /*
   * Firebase environment credentials remain supported
   * as a fallback.
   */
  const hasEnvCredentials =
    Boolean(process.env.FIREBASE_PROJECT_ID) &&
    Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
    Boolean(process.env.FIREBASE_PRIVATE_KEY);

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
     * Reuse existing Firebase Admin application.
     */
    if (getApps().length > 0) {
      firebaseApp = getApp();

      console.log(
        "[Firebase Admin] Reusing existing Firebase Admin SDK instance."
      );
    }

    /*
     * Prefer ServiceAccountKey.json.
     *
     * Render:
     * /etc/secrets/ServiceAccountKey.json
     *
     * Local:
     * <service-root>/ServiceAccountKey.json
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
     * Fallback to environment credentials.
     */
    else if (hasEnvCredentials) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
            /\\n/g,
            "\n"
          ),
        }),
      });

      console.log(
        "[Firebase Admin] Initialized from environment variables."
      );
    }

    /*
     * No Firebase credentials available.
     */
    else {
      throw new Error(
        "[Firebase Admin] No Firebase credentials found.\n" +
          "Checked:\n" +
          `- ${renderServiceAccountPath}\n` +
          `- ${localServiceAccountPath}\n` +
          "- FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY"
      );
    }

    /*
     * Create Firebase Auth instance.
     */
    adminAuthInstance = getAuth(firebaseApp);

    return adminAuthInstance;
  } catch (error) {
    /*
     * Do not silently continue when Firebase initialization fails.
     *
     * Socket authentication depends on Firebase Admin.
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

/**
 * Initialize Firebase Admin Auth.
 */
export const adminAuth = getAdminAuth();

export default {
  getAdminAuth,
  setAdminAuth,
  adminAuth,
};