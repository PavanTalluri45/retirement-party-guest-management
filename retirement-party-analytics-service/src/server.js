import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";
import { connectDB, closeDB } from "./config/database.js";
import { ensureIndexes } from "./repositories/analytics.repository.js";
import { checkRedisHealth } from "./config/redis.js";

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();
    console.log(`[Analytics Service] Connected to MongoDB Atlas (${config.dbName})`);

    // 2. Ensure Database Performance Indexes
    await ensureIndexes();

    // 3. Check Upstash Redis Reachability (if configured)
    const redisHealth = await checkRedisHealth();
    if (redisHealth.ok) {
      console.log(
        `[Analytics Service] Upstash Redis cache is READY (${redisHealth.latencyMs}ms ping, TTL: ${config.analyticsCacheTtlSeconds}s)`
      );
    } else {
      console.log(
        `[Analytics Service] Running in direct MongoDB aggregation mode (${redisHealth.status}).`
      );
    }

    // 4. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log(
        `[Analytics Service] Microservice running on http://localhost:${config.port} (env: ${config.nodeEnv})`
      );
    });

    // 5. Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`[Analytics Service] Received ${signal}. Closing server...`);
      server.close(async () => {
        await closeDB();
        console.log("[Analytics Service] Connections closed. Exiting process.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("[Analytics Service] Fatal startup error:", error);
    process.exit(1);
  }
}

startServer();

