import express from "express";
import cors from "cors";
import registrationRoutes from "./routes/registration.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// 1. CORS — allow all origins for internal/guest access
app.use(cors());

// 2. Request body parsing
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

// 3. Request logging (development only)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[Registration Service] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// 4. Root health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "retirement-party-registration-service",
    message: "Retirement Party Registration Service is running",
    version: "1.0.0",
  });
});

// 5. Routes
app.use(registrationRoutes);

// 6. 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 7. Centralized error handler
app.use(errorHandler);

export default app;

