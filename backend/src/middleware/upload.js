"use strict";

const multer = require("multer");
const { AppError } = require("./errorHandler");

const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"];
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB

// Store audio in memory buffer — we upload to S3 in the route
const audioStorage = multer.memoryStorage();

const audioFilter = (req, file, cb) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_AUDIO_TYPES.join(", ")}`, 400), false);
  }
};

const uploadAudioMiddleware = multer({
  storage: audioStorage,
  limits: { fileSize: MAX_AUDIO_SIZE, files: 3 }, // max 3 parts for speaking
  fileFilter: audioFilter,
}).array("audio", 3);

// Single-file variant for admin question audio uploads
const uploadSingleAudioMiddleware = multer({
  storage: audioStorage,
  limits: { fileSize: MAX_AUDIO_SIZE },
  fileFilter: audioFilter,
}).single("audio");

// Promisified wrapper for cleaner route handlers
const handleAudioUpload = (req, res, next) => {
  uploadAudioMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Audio file too large (max 50MB)", 413));
      }
      return next(new AppError(err.message, 400));
    }
    if (err) return next(err);
    next();
  });
};

const handleSingleAudioUpload = (req, res, next) => {
  uploadSingleAudioMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Audio file too large (max 50MB)", 413));
      }
      return next(new AppError(err.message, 400));
    }
    if (err) return next(err);
    next();
  });
};

module.exports = { handleAudioUpload, handleSingleAudioUpload };
