import { authClient } from "../services/auth-client.js";

/**
 * Authorize Admin Middleware
 *
 * Ensures that the authenticated caller has the 'ADMIN' role.
 * 1. Checks Firebase custom claims if present.
 * 2. Queries Auth Service /auth/me to verify user role in MongoDB.
 * 3. Rejects with 403 if user is not an Admin.
 */
export async function authorizeAdmin(req, res, next) {
  try {
    if (!req.auth || !req.auth.firebaseUid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // 1. Check custom claim first for speed
    if (
      req.auth.decodedToken?.role === "ADMIN" ||
      req.auth.decodedToken?.admin === true
    ) {
      req.userRole = "ADMIN";
      req.headers["x-user-role"] = "ADMIN";
      return next();
    }

    // 2. Validate role via Auth Service
    try {
      const meResult = await authClient.getMe(req);
      const user = meResult?.data?.data?.user || meResult?.data?.user;

      if (meResult.status === 200 && user && user.role === "ADMIN") {
        req.userRole = "ADMIN";
        req.headers["x-user-role"] = "ADMIN";
        return next();
      }

      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Access denied. Admin authorization is required.",
      });
    } catch (authError) {
      console.error("[Gateway AuthorizeAdmin] Failed to verify role with Auth Service:", authError.message);
      return res.status(503).json({
        success: false,
        code: "SERVICE_UNAVAILABLE",
        message: "Authentication service unavailable to verify role permissions.",
      });
    }
  } catch (error) {
    next(error);
  }
}

export default authorizeAdmin;

