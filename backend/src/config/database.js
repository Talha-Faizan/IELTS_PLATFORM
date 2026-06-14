const mongoose = require("mongoose");
const logger = require("./logger");

const MONGO_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

let retries = 0;
const MAX_RETRIES = 5;

async function connectDB() {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/ielts_platform",
      MONGO_OPTIONS
    );
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    retries = 0;
  } catch (err) {
    retries++;
    logger.error(`MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}):`, { error: err.message });

    if (retries < MAX_RETRIES) {
      const delay = Math.min(1000 * 2 ** retries, 30000);
      logger.info(`Retrying in ${delay / 1000}s...`);
      setTimeout(connectDB, delay);
    } else {
      logger.error("Max MongoDB retries reached. Exiting.");
      process.exit(1);
    }
  }
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting reconnect...");
  connectDB();
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB error:", { error: err.message });
});

module.exports = connectDB;
