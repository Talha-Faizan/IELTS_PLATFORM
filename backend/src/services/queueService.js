"use strict";

const { Queue } = require("bullmq");
const { getRedisConnection } = require("../config/redis");
const logger = require("../config/logger");

const QUEUE_NAME = "feedback";

let feedbackQueue = null;

function getFeedbackQueue() {
  if (feedbackQueue) return feedbackQueue;

  feedbackQueue = new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: { count: 500, age: 86400 }, // keep last 500 done jobs / 24h
      removeOnFail: { count: 200, age: 604800 },    // keep failed 7 days
    },
  });

  feedbackQueue.on("error", (err) => {
    logger.error("Feedback queue error:", { error: err.message });
  });

  return feedbackQueue;
}

/**
 * Enqueue a writing or speaking feedback job
 */
async function enqueueFeedback(submissionId, section, payload) {
  const queue = getFeedbackQueue();
  const jobName = section === "speaking" ? "speaking-feedback" : "writing-feedback";

  const job = await queue.add(
    jobName,
    { submissionId, section, ...payload },
    { priority: payload.isPremium ? 1 : 2 } // premium jobs process first
  );

  logger.info("Feedback job enqueued", { jobId: job.id, submissionId, section });
  return job.id;
}

module.exports = { getFeedbackQueue, enqueueFeedback };
