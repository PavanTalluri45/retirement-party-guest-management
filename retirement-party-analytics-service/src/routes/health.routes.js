import { Router } from "express";
import { getClient, getDb } from "../config/database.js";
import { checkRedisHealth } from "../config/redis.js";

const router = Router();

/**
 * Health check endpoint for Analytics Service
 * GET /health
 */
router.get("/health", async (req, res) => {
  let mongoStatus = "disconnected";
  let isMongoHealthy = false;

  try {
    const client = getClient();
    if (client) {
      await client.db("admin").command({ ping: 1 });
      mongoStatus = "connected";
      isMongoHealthy = true;
    } else {
      const db = getDb();
      if (db) {
        if (typeof db.command === "function") {
          await db.command({ ping: 1 });
        }
        mongoStatus = "connected";
        isMongoHealthy = true;
      }
    }
  } catch (err) {
    mongoStatus = "error";
  }

  const redisHealth = await checkRedisHealth();

  // If MongoDB is healthy, the service is operational (Redis is an optional optimization)
  const status = isMongoHealthy ? (redisHealth.ok || !redisHealth.configured ? "healthy" : "degraded") : "unhealthy";
  const statusCode = isMongoHealthy ? 200 : 503;

  return res.status(statusCode).json({
    success: isMongoHealthy,
    service: "retirement-party-analytics-service",
    status,
    dependencies: {
      mongodb: mongoStatus,
      redis: redisHealth.status,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
