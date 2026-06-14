const IORedis = require("ioredis");
const logger = require("./logger");

let client = null;

function getRedisConnection() {
  if (client) return client;

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  client = new IORedis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("connect", () => logger.info("Redis connected"));
  client.on("ready", () => logger.info("Redis ready"));
  client.on("error", (err) => logger.error("Redis error:", { error: err.message }));
  client.on("close", () => logger.warn("Redis connection closed"));
  client.on("reconnecting", () => logger.info("Redis reconnecting..."));

  return client;
}

module.exports = { getRedisConnection };
