import { config } from "../config/env.js";

/**
 * Registration Service HTTP Client
 * Communicates with the Registration Microservice (:5001) with timeout and request tracing.
 */
export class RegistrationClient {
  constructor(baseUrl = config.registrationServiceUrl, timeoutMs = config.registrationServiceTimeoutMs) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Internal request helper with timeout and request ID propagation.
   */
  async _request(path, requestId) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (requestId) {
      headers["X-Request-ID"] = requestId;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      if (response.status === 404) {
        const error = new Error(`Guest not found at downstream service (${path})`);
        error.type = "NOT_FOUND";
        error.status = 404;
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const error = new Error(
          `Downstream registration service returned status ${response.status}: ${errorText}`
        );
        error.type = "SERVICE_UNAVAILABLE";
        error.status = 502;
        throw error;
      }

      const body = await response.json();
      return body.data || body;
    } catch (error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        const timeoutError = new Error(
          `Registration service timed out after ${this.timeoutMs}ms (${url})`
        );
        timeoutError.type = "SERVICE_TIMEOUT";
        timeoutError.status = 504;
        throw timeoutError;
      }

      if (error.type) throw error;

      const networkError = new Error(
        `Failed to reach Registration Service at ${url}: ${error.message}`
      );
      networkError.type = "SERVICE_UNAVAILABLE";
      networkError.status = 502;
      throw networkError;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Look up guest by 4-digit confirmation number.
   * @param {string} confirmationNumber
   * @param {string} [requestId]
   */
  async fetchGuestByConfirmation(confirmationNumber, requestId) {
    return this._request(`/registrations/confirmation/${encodeURIComponent(confirmationNumber)}`, requestId);
  }

  /**
   * Look up guest by registered 10-digit phone number.
   * @param {string} phone
   * @param {string} [requestId]
   */
  async fetchGuestByPhone(phone, requestId) {
    return this._request(`/registrations/phone/${encodeURIComponent(phone)}`, requestId);
  }

  /**
   * Look up guest by MongoDB ObjectId.
   * @param {string} id
   * @param {string} [requestId]
   */
  async fetchGuestById(id, requestId) {
    return this._request(`/registrations/id/${encodeURIComponent(id)}`, requestId);
  }
}

export const registrationClient = new RegistrationClient();
export default registrationClient;
