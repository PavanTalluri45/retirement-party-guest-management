import { config } from "./config/env.js";
import app from "./app.js";

async function startServer() {
  try {
    console.log("[Gateway] Starting Retirement Party API Gateway...");
    console.log(`[Gateway] Target Auth Service URL: ${config.authServiceUrl}`);

    const server = app.listen(config.port, "0.0.0.0", () => {
      console.log(`[Gateway] API Gateway running in ${config.nodeEnv} mode on http://0.0.0.0:${config.port}`);
      console.log(`[Gateway] Health check: http://localhost:${config.port}/health`);
      console.log(`[Gateway] Downstream Auth Service health: http://localhost:${config.port}/health/auth`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Gateway] Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log("[Gateway] HTTP server closed gracefully. Exiting process.");
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error("[Gateway] Forceful shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[Gateway] Fatal startup error:", error);
    process.exit(1);
  }
}

startServer();

