import { getDb } from "../config/database.js";
import * as authService from "../services/auth.service.js";

/**
 * Health Check handler
 */
export async function healthCheck(req, res, next) {
  try {
    const db = getDb();
    await db.command({ ping: 1 });

    return res.status(200).json({
      success: true,
      service: "retirement-party-auth-service",
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      service: "retirement-party-auth-service",
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
}

/**
 * Admin registration handler
 * POST /api/auth/admin/register
 */
export async function adminRegister(req, res, next) {
  try {
    const { firebaseUid, email } = req.auth;
    const user = await authService.registerAdmin(firebaseUid, email, req.body);

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * User session synchronization handler
 * POST /api/auth/sync
 */
export async function sync(req, res, next) {
  try {
    const { firebaseUid, email } = req.auth;
    const user = await authService.syncUser(firebaseUid, email);

    return res.status(200).json({
      success: true,
      message: "User session synchronized",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const { firebaseUid } = req.auth;
    const user = await authService.getCurrentUser(firebaseUid);

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin creates a new Staff member
 * POST /api/auth/staff
 */
export async function createStaff(req, res, next) {
  try {
    const staff = await authService.createStaff(req.body);

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin lists all staff members
 * GET /api/auth/staff
 */
export async function listStaff(req, res, next) {
  try {
    const staffList = await authService.listStaff();

    return res.status(200).json({
      success: true,
      data: { staff: staffList },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin gets a specific staff member
 * GET /api/auth/staff/:firebaseUid
 */
export async function getStaff(req, res, next) {
  try {
    const { firebaseUid } = req.params;
    const staff = await authService.getStaff(firebaseUid);

    return res.status(200).json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin updates staff status (active / inactive)
 * PATCH /api/auth/staff/:firebaseUid/status
 */
export async function updateStaffStatus(req, res, next) {
  try {
    const { firebaseUid } = req.params;
    const { isActive } = req.body;

    const staff = await authService.updateStaffStatus(firebaseUid, isActive);

    return res.status(200).json({
      success: true,
      message: `Staff account ${isActive ? "activated" : "deactivated"} successfully`,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin revokes staff sessions / refresh tokens
 * POST /api/auth/staff/:firebaseUid/revoke
 */
export async function revokeStaff(req, res, next) {
  try {
    const { firebaseUid } = req.params;
    const result = await authService.revokeStaffSessions(firebaseUid);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

