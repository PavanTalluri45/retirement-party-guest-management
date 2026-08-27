import { config } from "../config/env.js";
import { proxyRequest } from "../utils/proxy-request.js";

/**
 * HTTP Client to communicate with internal Auth Service
 */
export const authClient = {
  /**
   * Health check
   */
  async checkHealth() {
    const url = `${config.authServiceUrl}/health`;
    return await proxyRequest(url, { method: "GET", headers: {} });
  },

  /**
   * Get authenticated user profile
   * GET /api/auth/me
   */
  async getMe(req) {
    const url = `${config.authServiceUrl}/api/auth/me`;
    return await proxyRequest(url, req);
  },

  /**
   * Sync user login session
   * POST /api/auth/sync
   */
  async sync(req) {
    const url = `${config.authServiceUrl}/api/auth/sync`;
    return await proxyRequest(url, req);
  },

  /**
   * Register Admin account
   * POST /api/auth/admin/register
   */
  async adminRegister(req) {
    const url = `${config.authServiceUrl}/api/auth/admin/register`;
    return await proxyRequest(url, req);
  },

  /**
   * Create new Staff account
   * POST /api/auth/staff
   */
  async createStaff(req) {
    const url = `${config.authServiceUrl}/api/auth/staff`;
    return await proxyRequest(url, req);
  },

  /**
   * List all Staff accounts
   * GET /api/auth/staff
   */
  async listStaff(req) {
    const url = `${config.authServiceUrl}/api/auth/staff`;
    return await proxyRequest(url, req);
  },

  /**
   * Get specific Staff member by UID
   * GET /api/auth/staff/:firebaseUid
   */
  async getStaff(req, firebaseUid) {
    const url = `${config.authServiceUrl}/api/auth/staff/${encodeURIComponent(firebaseUid)}`;
    return await proxyRequest(url, req);
  },

  /**
   * Update Staff status (Active/Inactive)
   * PATCH /api/auth/staff/:firebaseUid/status
   */
  async updateStaffStatus(req, firebaseUid) {
    const url = `${config.authServiceUrl}/api/auth/staff/${encodeURIComponent(firebaseUid)}/status`;
    return await proxyRequest(url, req);
  },

  /**
   * Revoke Staff sessions
   * POST /api/auth/staff/:firebaseUid/revoke
   */
  async revokeStaff(req, firebaseUid) {
    const url = `${config.authServiceUrl}/api/auth/staff/${encodeURIComponent(firebaseUid)}/revoke`;
    return await proxyRequest(url, req);
  },
};

