import express from "express";
import cors from "cors";
import helmet from "helmet";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import verificationRoutes from "./routes/verification.routes.js";

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  })
);

// 3. Request Body Parsing (100kb limit)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// 4. Request Correlation ID
app.use(requestIdMiddleware);

// 5. Request Logging (Structured & Masked)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[Verification Service] [${req.requestId || "no-id"}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// 6. Root Information Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "retirement-party-verification-service",
    message: "Retirement Party Verification Service is active",
    version: "1.0.0",
  });
});

// 7. Mount Verification Routes
app.use(verificationRoutes);

// 8. 404 Route Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId || "unknown",
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);

export default app;
