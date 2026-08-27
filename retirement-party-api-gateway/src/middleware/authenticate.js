import { adminAuth } from "../config/firebase.js";

/**
 * Authentication Middleware
 *
 * Verifies that the incoming request carries a valid Firebase ID Token.
 * On success, attaches `req.auth` with the decoded token payload.
 * On failure, returns 401 without leaking internal Firebase error details.
 *
 * The ORIGINAL bearer token is preserved on `req.auth.idToken` so that
 * downstream proxy calls can forward it unchanged to the Auth Service.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1. Header must exist and follow "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const idToken = authHeader.slice(7).trim(); // "Bearer ".length === 7

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // 2. Verify the Firebase ID Token using the Admin SDK
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
    } catch (firebaseError) {
      // Map Firebase error codes to safe user-facing messages
      let message = "Invalid or expired authentication token.";
      if (firebaseError.code === "auth/id-token-expired") {
        message = "Authentication token has expired. Please sign in again.";
      } else if (firebaseError.code === "auth/id-token-revoked") {
        message = "Authentication token has been revoked. Please sign in again.";
      }

      // Never expose Firebase internal error messages or stack traces
      return res.status(401).json({ success: false, message });
    }

    if (!decodedToken.uid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    // 3. Attach verified identity to the request object
    req.auth = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || null,
      idToken,         // ← original token, forwarded as-is to Auth Service
      decodedToken,    // ← full decoded payload (uid, email, exp, iat, …)
    };

    next();
  } catch (error) {
    // Unexpected errors go to the centralized error handler
    next(error);
  }
}
