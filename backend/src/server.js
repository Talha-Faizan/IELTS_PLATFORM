"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");
const logger = require("./config/logger");
const { apiLimiter, authLimiter, speedLimiter, webhookLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const contentRoutes = require("./routes/content");
const submissionRoutes = require("./routes/submission");
const subscriptionRoutes = require("./routes/subscription");
const adminRoutes = require("./routes/admin");
const speakingRoutes = require("./routes/speaking");

const app = express();

// ─── Trust proxy (for rate limiting behind reverse proxy / Cloud Run) ─────────
app.set("trust proxy", 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false, // Allow audio/video
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature"],
  })
);

// ─── Request parsing ──────────────────────────────────────────────────────────
// Webhook route needs raw body for HMAC verification — set BEFORE json() parser
app.use("/api/subscriptions/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Security sanitization ────────────────────────────────────────────────────
app.use(mongoSanitize());   // Prevent NoSQL injection
app.use(xss());             // Sanitize HTML in request body
app.use(hpp());             // Prevent HTTP parameter pollution

// ─── Request logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.info(msg.trim()) },
      skip: (req) => req.url === "/api/health",
    })
  );
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use("/api/", apiLimiter);
app.use("/api/", speedLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/subscriptions/webhook", webhookLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const { getRedisConnection } = require("./config/redis");

  const checks = { mongo: false, redis: false };

  // MongoDB: readyState 1 = connected
  checks.mongo = mongoose.connection.readyState === 1;

  // Redis: ping
  try {
    const reply = await getRedisConnection().ping();
    checks.redis = reply === "PONG";
  } catch (_) {
    checks.redis = false;
  }

  const allOk = checks.mongo && checks.redis;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    checks,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/speaking", speakingRoutes);

// ─── 404 + Error handling ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Uncaught exceptions / rejections
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception:", { error: err.message, stack: err.stack });
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", { reason: String(reason) });
    process.exit(1);
  });
}

start();

module.exports = app; // For testing
