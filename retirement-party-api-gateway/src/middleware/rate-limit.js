import rateLimit from "express-rate-limit";

/**
 * General API rate limiter (e.g. 200 requests per 15 minutes per IP)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again after 15 minutes.",
  },
});

/**
 * Stricter rate limiter for sensitive authentication endpoints (e.g. 50 requests per 15 minutes per IP)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication requests, please try again after 15 minutes.",
  },
});

