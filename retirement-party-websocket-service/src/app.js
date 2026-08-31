import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import eventRoutes from "./routes/event.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration (Admin Frontend only)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (internal services, curl, etc.)
    if (!origin) return callback(null, true);

    if (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
};

app.use(cors(corsOptions));

// Body Parsers
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// Request Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[WebSocket Service] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
      );
    }
  });
  next();
});

// Root welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "retirement-party-websocket-service",
    message: "Retirement Party WebSocket Service is running",
    version: "1.0.0",
  });
});

// Mount Routes
app.use(healthRoutes);
app.use(eventRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;

