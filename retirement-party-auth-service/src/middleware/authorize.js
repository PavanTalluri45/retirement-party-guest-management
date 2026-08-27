import { findUserByFirebaseUid } from "../database/user.db.js";

/**
 * Authorization Middleware: Checks user existence, active status, and RBAC roles.
 * Usage: authorize("ADMIN"), authorize("STAFF"), authorize("ADMIN", "STAFF")
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

      const user = await findUserByFirebaseUid(req.auth.firebaseUid);

      if (!user) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Application profile not registered in the system.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Account is inactive or deactivated. Please contact an administrator.",
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Insufficient permissions. Required role: ${allowedRoles.join(" or ")}.`,
        });
      }

      // Attach application user to request
      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
}

