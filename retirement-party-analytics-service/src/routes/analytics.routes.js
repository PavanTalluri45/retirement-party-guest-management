import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { authorizeAdmin } from "../middleware/authorize.js";

const router = Router();

// Apply admin authorization check to analytics routes
router.use("/analytics", authorizeAdmin);

// Core Dashboard Endpoints
router.get("/analytics/summary", analyticsController.getSummary);
router.get("/analytics/registrations", analyticsController.getRegistrations);
router.get("/analytics/attendance", analyticsController.getAttendance);
router.get("/analytics/meals", analyticsController.getMeals);
router.get("/analytics/checkins", analyticsController.getCheckins);
router.get("/analytics/checkins/trend", analyticsController.getCheckinTrend);
router.get("/analytics/staff/checkins", analyticsController.getStaffCheckins);
router.get("/analytics/checkins/recent", analyticsController.getRecentCheckins);
router.get("/analytics/metrics", analyticsController.getMetrics);

export default router;

