import { config } from "../config/env.js";

/**
 * WebSocket Notification Client for Registration Service.
 *
 * Dispatches GUEST_REGISTERED event to the WebSocket Service
 * via POST /internal/events.
 *
 * CRITICAL FAULT TOLERANCE RULE:
 * WebSocket notification is asynchronous and non-critical.
 * If the WebSocket Service is down, unreachable, or returns an error,
 * this function logs the error and NEVER throws or causes the registration to fail.
 *
 * @param {object} params
 * @param {string} params.guestId - MongoDB ObjectId of the guest
 * @param {string} [params.confirmationNumber] - 4-digit confirmation code
 * @param {string|Date} params.registeredAt - ISO 8601 or Date when registration occurred
 * @param {string} [params.requestId] - Correlation request ID
 * @returns {Promise<void>}
 */
export async function notifyGuestRegistered({
  guestId,
  confirmationNumber,
  registeredAt,
  requestId,
}) {
  const websocketServiceUrl = config.websocketServiceUrl;
  const internalToken = config.internalServiceToken;

  if (!websocketServiceUrl) {
    console.warn(
      "[WebSocket Client] WEBSOCKET_SERVICE_URL not configured. Skipping notification."
    );
    return;
  }

  const payload = {
    event: "GUEST_REGISTERED",
    requestId: requestId || "req_default",
    data: {
      guestId: String(guestId),
      confirmationNumber: confirmationNumber || undefined,
      registeredAt:
        registeredAt instanceof Date
          ? registeredAt.toISOString()
          : String(registeredAt),
    },
  };

  try {
    const url = `${websocketServiceUrl}/internal/events`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internalToken}`,
        "X-Request-ID": requestId || "req_default",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000), // 3-second network timeout
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.warn(
        `[WebSocket Client] Failed to notify registration (${response.status}): ${errBody}`
      );
    } else {
      console.log(
        `[WebSocket Client] Successfully notified GUEST_REGISTERED for guest ${guestId}`
      );
    }
  } catch (error) {
    // Failure to notify WebSocket Service must NEVER fail the registration operation
    console.warn(
      `[WebSocket Client] Notification error for GUEST_REGISTERED (${error.message}). Registration remains successful.`
    );
  }
}

export default { notifyGuestRegistered };

