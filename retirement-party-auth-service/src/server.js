import { config } from "./config/env.js";
import { connectDB, closeDB } from "./config/database.js";
import { ensureIndexes } from "./database/user.db.js";
import app from "./app.js";

async function startServer() {
  try {
    console.log("[Server] Starting Retirement Party Auth Service...");

    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Ensure Database Indexes
    await ensureIndexes();

    // 3. Start listening for incoming connections
    const server = app.listen(config.port, () => {
      console.log(`[Server] Auth Service running in ${config.nodeEnv} mode on http://localhost:${config.port}`);
      console.log(`[Server] Health check available at http://localhost:${config.port}/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log("[Server] HTTP server closed.");
        try {
          await closeDB();
          console.log("[Server] Graceful shutdown complete. Exiting process.");
          process.exit(0);
        } catch (err) {
          console.error("[Server] Error closing database connection:", err);
          process.exit(1);
        }
      });

      // Force shutdown after 10s if graceful fails
      setTimeout(() => {
        console.error("[Server] Forceful shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[Server] Fatal startup error:", error);
    process.exit(1);
  }
}

startServer();

