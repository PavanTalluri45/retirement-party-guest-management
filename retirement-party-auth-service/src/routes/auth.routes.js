import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import {
  validateBody,
  adminRegisterSchema,
  createStaffSchema,
  updateStaffStatusSchema,
} from "../validators/auth.validator.js";

const router = Router();

/**
 * Public Health Check
 * GET /health
 */
router.get("/health", authController.healthCheck);

/**
 * Admin Registration
 * POST /api/auth/admin/register
 * Requires: Firebase ID Token from newly created Admin user
 */
router.post(
  "/api/auth/admin/register",
  authenticate,
  validateBody(adminRegisterSchema),
  authController.adminRegister
);

/**
 * Session Synchronization
 * POST /api/auth/sync
 * Requires: Firebase ID Token
 */
router.post(
  "/api/auth/sync",
  authenticate,
  authController.sync
);

/**
 * Current User Profile
 * GET /api/auth/me
 * Requires: Firebase ID Token (ADMIN or STAFF)
 */
router.get(
  "/api/auth/me",
  authenticate,
  authorize("ADMIN", "STAFF"),
  authController.getMe
);

/**
 * Admin Create Staff Member
 * POST /api/auth/staff
 * Requires: Firebase ID Token with ADMIN role
 */
router.post(
  "/api/auth/staff",
  authenticate,
  authorize("ADMIN"),
  validateBody(createStaffSchema),
  authController.createStaff
);

/**
 * Admin List All Staff
 * GET /api/auth/staff
 * Requires: Firebase ID Token with ADMIN role
 */
router.get(
  "/api/auth/staff",
  authenticate,
  authorize("ADMIN"),
  authController.listStaff
);

/**
 * Admin Get Specific Staff Member
 * GET /api/auth/staff/:firebaseUid
 * Requires: Firebase ID Token with ADMIN role
 */
router.get(
  "/api/auth/staff/:firebaseUid",
  authenticate,
  authorize("ADMIN"),
  authController.getStaff
);

/**
 * Admin Update Staff Status (Active / Deactivated)
 * PATCH /api/auth/staff/:firebaseUid/status
 * Requires: Firebase ID Token with ADMIN role
 */
router.patch(
  "/api/auth/staff/:firebaseUid/status",
  authenticate,
  authorize("ADMIN"),
  validateBody(updateStaffStatusSchema),
  authController.updateStaffStatus
);

/**
 * Admin Revoke Staff Sessions / Refresh Tokens
 * POST /api/auth/staff/:firebaseUid/revoke
 * Requires: Firebase ID Token with ADMIN role
 */
router.post(
  "/api/auth/staff/:firebaseUid/revoke",
  authenticate,
  authorize("ADMIN"),
  authController.revokeStaff
);

export default router;

