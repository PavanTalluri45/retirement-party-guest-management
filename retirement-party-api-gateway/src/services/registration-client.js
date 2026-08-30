import { config } from "../config/env.js";
import { proxyRequest } from "../utils/proxy-request.js";

/**
 * HTTP Client to communicate with internal Registration Service
 */
export const registrationClient = {
  /**
   * Health check for registration service
   */
  async checkHealth() {
    const url = `${config.registrationServiceUrl}/health`;
    return await proxyRequest(url, { method: "GET", headers: {} });
  },

  /**
   * Register a new guest
   * POST /registrations
   */
  async register(req) {
    const url = `${config.registrationServiceUrl}/registrations`;
    return await proxyRequest(url, req);
  },

  /**
   * List all registered guests for the admin dashboard
   * GET /registrations
   */
  async getAll(req) {
    const url = `${config.registrationServiceUrl}/registrations`;
    return await proxyRequest(url, req, { method: "GET" });
  },

  /**
   * Look up an attending guest by 4-digit confirmation number
   * GET /registrations/confirmation/:confirmationNumber
   */
  async getByConfirmationNumber(req, confirmationNumber) {
    const url = `${config.registrationServiceUrl}/registrations/confirmation/${encodeURIComponent(confirmationNumber)}`;
    return await proxyRequest(url, req);
  },

  /**
   * Look up a guest by MongoDB ObjectId
   * GET /registrations/id/:id
   */
  async getById(req, id) {
    const url = `${config.registrationServiceUrl}/registrations/id/${encodeURIComponent(id)}`;
    return await proxyRequest(url, req);
  },
};

