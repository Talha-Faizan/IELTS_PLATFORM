"use strict";

require("dotenv").config();
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const { getRedisConnection } = require("../config/redis");
const connectDB = require("../config/database");
const logger = require("../config/logger");
const { generateWritingFeedback, generateSpeakingFeedback, transcribeAudio } = require("../services/aiService");
const { getPresignedUrl } = require("../services/storageService");
const emailService = require("../services/email");

// Models
const Submission = require("../models/Submission");
const User = require("../models/User");
const Question = require("../models/Question");

const QUEUE_NAME = "feedback";
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "3");

async function processWritingFeedback(job) {
  const { submissionId, isPremium } = job.data;
  logger.info("Processing writing feedback", { submissionId, jobId: job.id });

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error(`Submission not found: ${submissionId}`);

  // Get the writing prompt
  const question = submission.questionId
    ? await Question.findById(submission.questionId).lean()
    : null;

  const prompt = question?.content?.prompt || "";
  const taskType = question?.content?.taskType || "task2";
  const text = submission.content.text || "";

  if (!text || text.trim().length < 10) {
    throw new Error("Submission text is too short to score");
  }

  // Call AI
  const feedback = await generateWritingFeedback({ text, prompt, taskType, isPremium });

  // Persist
  submission.feedbackStatus = "complete";
  submission.feedbackResult = isPremium ? feedback : { overallBand: feedback.overallBand };
  submission.bandEstimate = feedback.overallBand;
  await submission.save();

  // Notify user
  const user = await User.findById(submission.userId).select("email name").lean();
  if (user) {
    await emailService.sendFeedbackReadyEmail(user.email, user.name, "Writing");
  }

  logger.info("Writing feedback complete", { submissionId, band: feedback.overallBand });
  return { submissionId, band: feedback.overallBand };
}

async function processSpeakingFeedback(job) {
  const { submissionId, isPremium } = job.data;
  logger.info("Processing speaking feedback", { submissionId, jobId: job.id });

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error(`Submission not found: ${submissionId}`);

  // Get the speaking question for context
  const question = submission.questionId
    ? await Question.findById(submission.questionId).lean()
    : null;

  const questions = question?.content?.questions || [];

  let transcript = submission.content.transcript;

  // Step 1: Transcribe audio if not already done
  if (!transcript || transcript.length === 0) {
    const audioKeys = submission.content.audioUrl;

    if (audioKeys && audioKeys.length > 0) {
      try {
        const { default: axios } = await import("axios");
        // Download audio from S3 pre-signed URL
        const transcripts = [];
        const keys = Array.isArray(audioKeys) ? audioKeys : [audioKeys];

        for (let i = 0; i < keys.length; i++) {
          const url = await getPresignedUrl(keys[i]);
          const audioRes = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
          const buffer = Buffer.from(audioRes.data);
          const partText = await transcribeAudio(buffer, `part${i + 1}.webm`);
          transcripts.push({ part: `Part ${i + 1}`, text: partText });
        }

        transcript = transcripts;
        submission.content.transcript = transcript;
        await submission.save();
      } catch (err) {
        logger.error("Audio transcription failed:", { error: err.message, submissionId });
        // Continue with empty transcript rather than failing completely
        transcript = [];
      }
    }
  }

  // Step 2: Generate AI feedback
  const feedback = await generateSpeakingFeedback({ transcript, questions, isPremium });

  // Persist
  submission.feedbackStatus = "complete";
  submission.feedbackResult = isPremium ? feedback : { overallBand: feedback.overallBand };
  submission.bandEstimate = feedback.overallBand;
  await submission.save();

  // Notify
  const user = await User.findById(submission.userId).select("email name").lean();
  if (user) {
    await emailService.sendFeedbackReadyEmail(user.email, user.name, "Speaking");
  }

  logger.info("Speaking feedback complete", { submissionId, band: feedback.overallBand });
  return { submissionId, band: feedback.overallBand };
}

// ─── Worker boot ──────────────────────────────────────────────────────────────
async function startWorker() {
  await connectDB();
  logger.info(`Feedback worker starting (concurrency: ${CONCURRENCY})`);

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name === "writing-feedback") return processWritingFeedback(job);
      if (job.name === "speaking-feedback") return processSpeakingFeedback(job);
      throw new Error(`Unknown job name: ${job.name}`);
    },
    {
      connection: getRedisConnection(),
      concurrency: CONCURRENCY,
    }
  );

  worker.on("completed", (job, result) => {
    logger.info("Job completed", { jobId: job.id, name: job.name, result });
  });

  worker.on("failed", async (job, err) => {
    logger.error("Job failed", { jobId: job?.id, name: job?.name, error: err.message, attempts: job?.attemptsMade });

    // On final failure — mark submission as failed
    if (job && job.attemptsMade >= job.opts.attempts) {
      try {
        await Submission.findByIdAndUpdate(job.data.submissionId, {
          feedbackStatus: "failed",
        });
        logger.warn("Submission marked as failed", { submissionId: job.data.submissionId });
      } catch (updateErr) {
        logger.error("Could not mark submission failed:", { error: updateErr.message });
      }
    }
  });

  worker.on("error", (err) => {
    logger.error("Worker error:", { error: err.message });
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down worker`);
    try {
      await worker.close();           // stop accepting new jobs, wait for active job to finish
      logger.info("BullMQ worker closed");
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
      const redis = getRedisConnection();
      await redis.quit();
      logger.info("Redis connection closed");
    } catch (err) {
      logger.error("Error during worker shutdown:", { error: err.message });
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received — closing worker...");
    await worker.close();
    await mongoose.connection.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await worker.close();
    await mongoose.connection.close();
    process.exit(0);
  });

  logger.info("Feedback worker ready");
}

startWorker().catch((err) => {
  logger.error("Worker startup failed:", { error: err.message });
  process.exit(1);
});
