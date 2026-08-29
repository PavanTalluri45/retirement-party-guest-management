import { config } from "../config/env.js";
import { proxyRequest } from "../utils/proxy-request.js";

/**
 * Verification Client
 * Proxies staff verification requests to the downstream Verification Service (:5002)
 */
export class VerificationClient {
  constructor(baseUrl = config.verificationServiceUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Forward Confirmation Verification
   * POST /verification/confirmation
   */
  async verifyConfirmation(req) {
    return proxyRequest(`${this.baseUrl}/verification/confirmation`, req, {
      method: "POST",
      body: req.body,
    });
  }

  /**
   * Forward Phone Verification
   * POST /verification/phone
   */
  async verifyPhone(req) {
    return proxyRequest(`${this.baseUrl}/verification/phone`, req, {
      method: "POST",
      body: req.body,
    });
  }

  /**
   * Forward Check-in Execution
   * POST /verification/check-in
   */
  async checkIn(req) {
    return proxyRequest(`${this.baseUrl}/verification/check-in`, req, {
      method: "POST",
      body: req.body,
    });
  }

  /**
   * Forward Check-in History Retrieval
   * GET /verification/history/me
   */
  async getHistoryMe(req) {
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return proxyRequest(`${this.baseUrl}/verification/history/me${queryString}`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Verification Health Check
   * GET /health
   */
  async getHealth(req) {
    return proxyRequest(`${this.baseUrl}/health`, req, {
      method: "GET",
    });
  }

  /**
   * Forward Verification Metrics
   * GET /health/metrics
   */
  async getMetrics(req) {
    return proxyRequest(`${this.baseUrl}/health/metrics`, req, {
      method: "GET",
    });
  }
}

export const verificationClient = new VerificationClient();
export default verificationClient;
