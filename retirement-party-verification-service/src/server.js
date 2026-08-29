import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";
import { connectDB, closeDB } from "./config/database.js";
import { ensureIndexes } from "./repositories/checkin.repository.js";
import { checkRedisHealth } from "./config/redis.js";

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();
    console.log(`[Verification Service] Connected to MongoDB Atlas (${config.dbName})`);

    // 2. Ensure Database Performance Indexes
    await ensureIndexes();

    // 3. Check Upstash Redis Reachability
    const redisHealth = await checkRedisHealth();
    if (redisHealth.ok) {
      console.log(
        `[Verification Service] Upstash Redis cache is READY (${redisHealth.latencyMs}ms ping)`
      );
    } else {
      console.warn(
        `[Verification Service] Upstash Redis cache is DEGRADED (${redisHealth.error || "unreachable"}). Verification service will operate with source fallback.`
      );
    }

    // 4. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log(
        `[Verification Service] Microservice running on http://localhost:${config.port} (env: ${config.nodeEnv})`
      );
    });

    // 5. Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`[Verification Service] Received ${signal}. Closing server...`);
      server.close(async () => {
        await closeDB();
        console.log("[Verification Service] Connections closed. Exiting process.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("[Verification Service] Fatal startup error:", error);
    process.exit(1);
  }
}

startServer();
