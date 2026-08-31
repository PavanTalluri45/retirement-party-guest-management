import { config } from "../config/env.js";

/**
 * WebSocket Notification Client for Verification Service.
 *
 * Dispatches CHECKIN_COMPLETED event to the WebSocket Service
 * via POST /internal/events.
 *
 * CRITICAL FAULT TOLERANCE RULE:
 * WebSocket notification is asynchronous and non-critical.
 * If the WebSocket Service is down, unreachable, or returns an error,
 * this function logs the error and NEVER throws or causes the check-in to fail.
 *
 * @param {object} params
 * @param {string} params.guestId - MongoDB ObjectId of the guest
 * @param {string} [params.confirmationNumber] - 4-digit confirmation code
 * @param {string|Date} params.checkedInAt - ISO 8601 or Date when check-in occurred
 * @param {string} params.checkedInBy - Firebase UID of the staff member
 * @param {'CONFIRMATION'|'PHONE'} params.verificationMethod - Verification method used
 * @param {string} [params.requestId] - Correlation request ID
 * @returns {Promise<void>}
 */
export async function notifyCheckinCompleted({
  guestId,
  confirmationNumber,
  checkedInAt,
  checkedInBy,
  verificationMethod,
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
    event: "CHECKIN_COMPLETED",
    requestId: requestId || "req_default",
    data: {
      guestId: String(guestId),
      confirmationNumber: confirmationNumber || undefined,
      checkedInAt:
        checkedInAt instanceof Date
          ? checkedInAt.toISOString()
          : String(checkedInAt),
      checkedInBy: String(checkedInBy),
      verificationMethod,
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
        `[WebSocket Client] Failed to notify check-in (${response.status}): ${errBody}`
      );
    } else {
      console.log(
        `[WebSocket Client] Successfully notified CHECKIN_COMPLETED for guest ${guestId}`
      );
    }
  } catch (error) {
    // Failure to notify WebSocket Service must NEVER fail the check-in operation
    console.warn(
      `[WebSocket Client] Notification error for CHECKIN_COMPLETED (${error.message}). Check-in remains successful.`
    );
  }
}

export default { notifyCheckinCompleted };

