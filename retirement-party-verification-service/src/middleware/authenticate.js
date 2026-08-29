import { getAdminAuth } from "../config/firebase.js";

/**
 * Authentication Middleware
 *
 * Verifies the incoming Bearer Firebase ID Token.
 * Attaches decoded identity to `req.auth`.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const idToken = authHeader.slice(7).trim();

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const authVerifier = getAdminAuth();

    if (!authVerifier) {
      return res.status(500).json({
        success: false,
        message: "Authentication service not configured.",
      });
    }

    let decodedToken;
    try {
      decodedToken = await authVerifier.verifyIdToken(idToken, true);
    } catch (firebaseError) {
      let message = "Invalid or expired authentication token.";
      if (firebaseError.code === "auth/id-token-expired") {
        message = "Authentication token has expired. Please sign in again.";
      } else if (firebaseError.code === "auth/id-token-revoked") {
        message = "Authentication token has been revoked. Please sign in again.";
      }
      return res.status(401).json({ success: false, message });
    }


    if (!decodedToken.uid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    req.auth = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || null,
      idToken,
      decodedToken,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
