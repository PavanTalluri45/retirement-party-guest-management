import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
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

// Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

app.use(limiter);

// Body Parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Root welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "retirement-party-auth-service",
    message: "Retirement Party Authentication Service is running",
    version: "1.0.0",
  });
});

// Mount Routes
app.use(authRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;

