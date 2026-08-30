import express from "express";
import cors from "cors";
import helmet from "helmet";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import healthRoutes from "./routes/health.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-User-Role"],
  })
);

// 3. Request Body Parsing
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// 4. Request Correlation ID
app.use(requestIdMiddleware);

// 5. Structured Request Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[Analytics Service] [${req.requestId || "no-id"}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// 6. Service Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "retirement-party-analytics-service",
    message: "Retirement Party Analytics Service is active (Read-Only)",
    version: "1.0.0",
  });
});

// 7. Mount Routes
app.use(healthRoutes);
app.use(analyticsRoutes);

// 8. 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId || undefined,
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);

export default app;

