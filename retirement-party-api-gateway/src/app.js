import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { generalLimiter } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error-handler.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import registrationRoutes from "./routes/registration.routes.js";

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// 3. General Rate Limiting
app.use(generalLimiter);

// 4. Request Body Parsing (100kb limit)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// 5. Request Logging (SAFE: No tokens, passwords, or credentials logged)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[Gateway] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 6. Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "retirement-party-api-gateway",
    message: "Retirement Party API Gateway is active",
    version: "1.0.0",
  });
});

// 7. Mount Routes
app.use(healthRoutes);
app.use(authRoutes);
app.use(registrationRoutes);

// 8. 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);

export default app;

