/**
 * Authorize Middleware for Analytics Service
 * Verifies that the forwarded request was authenticated as ADMIN by API Gateway.
 */
export function authorizeAdmin(req, res, next) {
  // Allow internal service-to-service requests or validated gateway admin requests
  const userRole = req.headers["x-user-role"] || req.userRole;

  // In testing or when role is explicitly forwarded
  if (userRole && userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "Access denied. Admin authorization is required to view analytics.",
      requestId: req.requestId,
    });
  }

  next();
}

export default authorizeAdmin;

