import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";
import { ensureIndexes } from "./src/repositories/guest.repository.js";
import { config } from "./src/config/env.js";

async function startServer() {
  try {
    // Connect to MongoDB Atlas
    await connectDB();
    console.log("[Registration Service] MongoDB connected successfully.");

    // Ensure collection indexes exist
    await ensureIndexes();
    console.log("[Registration Service] Database indexes ensured.");

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(
        `[Registration Service] Server running on http://localhost:${config.port}`
      );
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Registration Service] ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { closeDB } = await import("./src/config/database.js");
        await closeDB();
        console.log("[Registration Service] MongoDB connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[Registration Service] Failed to start server:", error);
    process.exit(1);
  }
}

startServer();