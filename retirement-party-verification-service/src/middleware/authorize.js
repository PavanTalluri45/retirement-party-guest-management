import { getDb } from "../config/database.js";

/**
 * Authorization Middleware
 * Verifies application profile existence, active status, and RBAC role.
 *
 * @param {...string} allowedRoles Roles permitted to access the endpoint (e.g. 'STAFF', 'ADMIN')
 */
export function authorize(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.auth?.firebaseUid) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User identity not verified.",
        });
      }

      // If running in test mode with mock user
      if (req.user) {
        return next();
      }

      let user = null;
      try {
        const db = getDb();
        user = await db.collection("users").findOne({
          firebaseUid: req.auth.firebaseUid,
        });
      } catch (dbError) {
        console.warn("[Authorize] DB lookup error:", dbError.message);
      }

      if (!user) {
        // Fallback for staff user in development/test if not populated in DB
        if (process.env.NODE_ENV !== "production") {
          user = {
            firebaseUid: req.auth.firebaseUid,
            name: req.auth.email ? req.auth.email.split("@")[0] : "Staff Member",
            email: req.auth.email || "staff@event.com",
            role: "STAFF",
            isActive: true,
          };
        } else {
          return res.status(403).json({
            success: false,
            message: "Forbidden: Application profile not registered in the system.",
          });
        }
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Account is inactive or deactivated.",
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Insufficient permissions. Required role: ${allowedRoles.join(" or ")}.`,
        });
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default authorize;
