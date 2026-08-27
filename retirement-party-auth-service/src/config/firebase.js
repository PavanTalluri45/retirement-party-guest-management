import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const require = createRequire(import.meta.url);
const serviceAccountPath = path.resolve(process.cwd(), "ServiceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `[Firebase Admin] ServiceAccountKey.json not found at ${serviceAccountPath}. Please ensure the service account key is placed in the service root directory.`
  );
}

const serviceAccount = require(serviceAccountPath);

const apps = getApps();
const app = apps.length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
    });

console.log("[Firebase Admin] Firebase Admin SDK initialized successfully.");

export const adminAuth = getAuth(app);
export const admin = {
  app,
  auth: () => adminAuth,
  credential: { cert },
};
export default admin;

