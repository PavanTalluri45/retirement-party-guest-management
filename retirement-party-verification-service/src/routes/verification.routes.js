import { Router } from "express";
import {
  verifyConfirmation,
  verifyPhone,
  checkIn,
  getHistoryMe,
  healthCheck,
  getMetrics,
} from "../controllers/verification.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

// Staff authentication and authorization pipeline
const requireStaff = [authenticate, authorize("STAFF", "ADMIN")];

/** Public / Operational Endpoints */
router.get("/health", healthCheck);
router.get("/health/metrics", getMetrics);
router.get("/metrics", getMetrics);

/** Protected Verification Endpoints */
router.post("/verification/confirmation", requireStaff, verifyConfirmation);
router.post("/verification/phone", requireStaff, verifyPhone);
router.post("/verification/check-in", requireStaff, checkIn);
router.get("/verification/history/me", requireStaff, getHistoryMe);

/** Short route aliases */
router.post("/confirmation", requireStaff, verifyConfirmation);
router.post("/phone", requireStaff, verifyPhone);
router.post("/check-in", requireStaff, checkIn);
router.get("/history/me", requireStaff, getHistoryMe);

export default router;
