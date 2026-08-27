import { adminAuth } from "../config/firebase.js";

/**
 * Authentication Middleware: Verifies Firebase ID Token and extracts identity.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Missing or malformed Bearer token in Authorization header.",
      });
    }

    const idToken = authHeader.split(" ")[1]?.trim();

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing from Authorization header.",
      });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
    } catch (firebaseError) {
      let message = "Invalid or expired authentication token.";
      if (firebaseError.code === "auth/id-token-expired") {
        message = "Authentication token has expired. Please refresh session.";
      } else if (firebaseError.code === "auth/id-token-revoked") {
        message = "Authentication token has been revoked. Please sign in again.";
      }

      return res.status(401).json({
        success: false,
        message,
      });
    }

    if (!decodedToken.uid) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload: missing user identifier.",
      });
    }

    // Attach verified authentication details to request
    req.auth = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || null,
      decodedToken,
    };

    next();
  } catch (error) {
    next(error);
  }
}

