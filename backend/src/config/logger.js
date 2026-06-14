const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const isDev = process.env.NODE_ENV !== "production";

// Dev console format
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    let out = `${timestamp} [${level}] ${message}`;
    if (stack) out += `\n${stack}`;
    if (Object.keys(meta).length) out += ` ${JSON.stringify(meta)}`;
    return out;
  })
);

// Production JSON format
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const transports = [new winston.transports.Console()];

if (!isDev) {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join("logs", "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
      zippedArchive: true,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join("logs", "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
    })
  );
}

const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: isDev ? devFormat : prodFormat,
  transports,
  exitOnError: false,
});

module.exports = logger;
