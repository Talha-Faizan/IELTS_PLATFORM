"use strict";

const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { RedisStore } = require("rate-limit-redis");
const { getRedisConnection } = require("../config/redis");

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 15 min
const max = parseInt(process.env.RATE_LIMIT_MAX || "100");
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX || "10");

function makeRedisStore(prefix) {
  return new RedisStore({
    sendCommand: (...args) => getRedisConnection().call(...args),
    prefix,
  });
}

// General API limiter
const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore("rl:api:"),
  message: { success: false, message: "Too many requests. Please try again later." },
  skip: (req) => req.method === "OPTIONS",
});

// Stricter limiter for auth routes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore("rl:auth:"),
  message: { success: false, message: "Too many auth attempts. Please try again in 15 minutes." },
});

// Slow down requests progressively after threshold
const speedLimiter = slowDown({
  windowMs,
  delayAfter: Math.floor(max * 0.7),
  delayMs: (hits) => hits * 200, // Add 200ms per request over threshold
});

// Webhook: no rate limit, but verify signature in route
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: makeRedisStore("rl:webhook:"),
  message: { success: false, message: "Webhook rate limit exceeded." },
});

module.exports = { apiLimiter, authLimiter, speedLimiter, webhookLimiter };
