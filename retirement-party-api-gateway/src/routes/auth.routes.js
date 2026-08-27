import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rate-limit.js";
import { authClient } from "../services/auth-client.js";

const router = Router();

// Apply auth rate limiter
router.use(authLimiter);

/**
 * Current User Profile
 * GET /auth/me or GET /api/auth/me
 */
const handleGetMe = async (req, res, next) => {
  try {
    const result = await authClient.getMe(req);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.get("/auth/me", authenticate, handleGetMe);
router.get("/api/auth/me", authenticate, handleGetMe);

/**
 * Session Synchronization
 * POST /auth/sync or POST /api/auth/sync
 */
const handleSync = async (req, res, next) => {
  try {
    const result = await authClient.sync(req);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.post("/auth/sync", authenticate, handleSync);
router.post("/api/auth/sync", authenticate, handleSync);

/**
 * Admin Registration
 * POST /auth/admin/register or POST /api/auth/admin/register
 */
const handleAdminRegister = async (req, res, next) => {
  try {
    const result = await authClient.adminRegister(req);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.post("/auth/admin/register", authenticate, handleAdminRegister);
router.post("/api/auth/admin/register", authenticate, handleAdminRegister);

/**
 * Admin Create Staff Member
 * POST /auth/staff or POST /api/auth/staff
 */
const handleCreateStaff = async (req, res, next) => {
  try {
    const result = await authClient.createStaff(req);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.post("/auth/staff", authenticate, handleCreateStaff);
router.post("/api/auth/staff", authenticate, handleCreateStaff);

/**
 * Admin List All Staff
 * GET /auth/staff or GET /api/auth/staff
 */
const handleListStaff = async (req, res, next) => {
  try {
    const result = await authClient.listStaff(req);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.get("/auth/staff", authenticate, handleListStaff);
router.get("/api/auth/staff", authenticate, handleListStaff);

/**
 * Admin Get Specific Staff Member
 * GET /auth/staff/:firebaseUid or GET /api/auth/staff/:firebaseUid
 */
const handleGetStaff = async (req, res, next) => {
  try {
    const result = await authClient.getStaff(req, req.params.firebaseUid);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.get("/auth/staff/:firebaseUid", authenticate, handleGetStaff);
router.get("/api/auth/staff/:firebaseUid", authenticate, handleGetStaff);

/**
 * Admin Update Staff Status
 * PATCH /auth/staff/:firebaseUid/status or PATCH /api/auth/staff/:firebaseUid/status
 */
const handleUpdateStaffStatus = async (req, res, next) => {
  try {
    const result = await authClient.updateStaffStatus(req, req.params.firebaseUid);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.patch("/auth/staff/:firebaseUid/status", authenticate, handleUpdateStaffStatus);
router.patch("/api/auth/staff/:firebaseUid/status", authenticate, handleUpdateStaffStatus);

/**
 * Admin Revoke Staff Sessions
 * POST /auth/staff/:firebaseUid/revoke or POST /api/auth/staff/:firebaseUid/revoke
 */
const handleRevokeStaff = async (req, res, next) => {
  try {
    const result = await authClient.revokeStaff(req, req.params.firebaseUid);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
router.post("/auth/staff/:firebaseUid/revoke", authenticate, handleRevokeStaff);
router.post("/api/auth/staff/:firebaseUid/revoke", authenticate, handleRevokeStaff);

export default router;

