import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import {
  initializeApp,
  cert,
  getApps,
  getApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { config } from "./env.js";

const require = createRequire(import.meta.url);

/**
 * Firebase Admin SDK initialization for the API Gateway.
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
 * The Gateway verifies Firebase ID tokens before forwarding
 * authenticated requests to internal services.
 */

let firebaseApp;

/*
 * Firebase environment credentials.
 *
 * These remain supported as a fallback.
 */
const hasEnvCredentials =
  Boolean(config.firebase?.projectId) &&
  Boolean(config.firebase?.clientEmail) &&
  Boolean(config.firebase?.privateKey);

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
 * Prefer Render Secret File.
 */
const serviceAccountPath = fs.existsSync(renderServiceAccountPath)
  ? renderServiceAccountPath
  : localServiceAccountPath;

const hasKeyFile = fs.existsSync(serviceAccountPath);

/*
 * Reuse an existing Firebase Admin application if one
 * has already been initialized.
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
 * On Render this comes from:
 * /etc/secrets/ServiceAccountKey.json
 *
 * Locally this comes from:
 * ServiceAccountKey.json
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
 * Gateway cannot operate securely without Firebase credentials.
 */
else {
  console.error(
    "[Firebase Admin] FATAL: No Firebase credentials found.\n" +
      "Checked:\n" +
      `- ${renderServiceAccountPath}\n` +
      `- ${localServiceAccountPath}\n` +
      "- FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY"
  );

  process.exit(1);
}

export const adminAuth = getAuth(firebaseApp);

export default adminAuth;