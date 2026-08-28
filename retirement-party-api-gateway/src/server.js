import { config } from "./config/env.js";
import app from "./app.js";

async function startServer() {
  try {
    console.log("[Gateway] ==================================================");
    console.log("[Gateway] Starting Retirement Party API Gateway...");
    console.log(`[Gateway] Mode: ${config.nodeEnv}`);
    console.log("[Gateway] Connected Downstream Microservices:");
    console.log(`[Gateway]   1. Auth Service:         ${config.authServiceUrl}`);
    console.log(`[Gateway]   2. Registration Service: ${config.registrationServiceUrl}`);
    console.log("[Gateway] ==================================================");

    const server = app.listen(config.port, "0.0.0.0", () => {
      console.log(`[Gateway] API Gateway running on http://0.0.0.0:${config.port}`);
      console.log(`[Gateway]   - Gateway Health:            http://localhost:${config.port}/health`);
      console.log(`[Gateway]   - All Services Health:       http://localhost:${config.port}/health/all`);
      console.log(`[Gateway]   - Auth Service Health:       http://localhost:${config.port}/health/auth`);
      console.log(`[Gateway]   - Registration Health:       http://localhost:${config.port}/health/registration`);
      console.log("[Gateway] ==================================================");
    });

    // Handle port in use or server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `[Gateway] FATAL: Port ${config.port} is already in use by another process.\n` +
          `[Gateway] To resolve, terminate the existing process on port ${config.port} or choose a different port in .env.`
        );
      } else {
        console.error("[Gateway] Server error:", error);
      }
      process.exit(1);
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
