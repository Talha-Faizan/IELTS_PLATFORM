"use strict";

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleAudioUpload } = require("../middleware/upload");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const Submission = require("../models/Submission");
const Question = require("../models/Question");
const ExpertReview = require("../models/ExpertReview");
const { uploadAudio } = require("../services/storageService");
const { enqueueFeedback } = require("../services/queueService");
const emailService = require("../services/email");
const logger = require("../config/logger");

// ─── POST /api/submissions — Create new submission ────────────────────────────
router.post(
  "/",
  auth,
  [
    body("section").isIn(["reading", "listening", "writing", "speaking"]),
    body("type").isIn(["practice", "mock"]),
    body("questionId").optional().isMongoId(),
    body("mockTestId").optional().isMongoId(),
    body("timeSpent").optional().isInt({ min: 0 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { section, type, questionId, mockTestId, content, timeSpent } = req.body;
    const isPremium = req.user.subscriptionStatus === "premium";

    // Enforce usage limits for free users
    const access = req.user.canAccess(section);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: `Daily ${section} limit reached (${access.used}/${access.limit})`,
        upgradeRequired: true,
        limits: { used: access.used, limit: access.limit },
      });
    }

    // Also check mock test lifetime limit for free users
    if (type === "mock" && !isPremium) {
      const mockAccess = req.user.canAccess("mockTest");
      if (!mockAccess.allowed) {
        return res.status(403).json({
          success: false,
          message: "Free mock test limit reached (1 total). Upgrade to Premium for unlimited.",
          upgradeRequired: true,
        });
      }
    }

    let score = null;
    let answers = [];
    let feedbackStatus = "not_required";

    // ── Auto-score: Reading / Listening ──────────────────────────────────────
    if (section === "reading" || section === "listening") {
      if (!questionId) throw new AppError("questionId is required for Reading/Listening submissions", 400);

      const question = await Question.findById(questionId).lean();
      if (!question) throw new AppError("Question not found", 404);

      answers = (content?.answers || []).map((ans) => {
        const q = question.content.questions.find(
          (item) => item.questionNumber === ans.questionNumber
        );
        let isCorrect = false;
        let correctAnswerString = null;
        
        if (q) {
          if (typeof q.correctAnswer === "number" && q.options && q.options.length > 0) {
            // It's an index for a multiple choice question
            correctAnswerString = q.options[q.correctAnswer];
            isCorrect = ans.answer === correctAnswerString;
          } else {
            correctAnswerString = q.correctAnswer;
            isCorrect = JSON.stringify(ans.answer) === JSON.stringify(q.correctAnswer);
          }
        }
        
        return { questionId: ans.questionNumber, answer: ans.answer, isCorrect };
      });

      const correct = answers.filter((a) => a.isCorrect).length;
      score = { correct, total: answers.length, percentage: answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0 };
    }

    // ── Async AI feedback: Writing / Speaking ─────────────────────────────────
    if (section === "writing" || section === "speaking") {
      if (section === "writing" && !content?.text?.trim()) {
        throw new AppError("Writing submission requires essay text", 400);
      }
      feedbackStatus = "pending";
    }

    // ── Create submission record ───────────────────────────────────────────────
    const submission = new Submission({
      userId: req.user._id,
      section,
      type,
      questionId: questionId || null,
      mockTestId: mockTestId || null,
      content: {
        answers,
        text: content?.text || null,
        audioUrl: content?.audioUrl || null,
        transcript: content?.transcript || null,
      },
      score,
      timeSpent: timeSpent || null,
      feedbackStatus,
    });

    await submission.save();

    // ── Enqueue AI feedback job ────────────────────────────────────────────────
    if (feedbackStatus === "pending") {
      const jobId = await enqueueFeedback(submission._id.toString(), section, { isPremium });
      submission.feedbackJobId = jobId;
      await submission.save();
    }

    // ── Increment usage counters (free users) ─────────────────────────────────
    if (!isPremium) {
      req.user.dailyUsage[section] = (req.user.dailyUsage[section] || 0) + 1;
      if (type === "mock") {
        req.user.dailyUsage.mockTest = (req.user.dailyUsage.mockTest || 0) + 1;
      }
      await req.user.save();
    }

    logger.info("Submission created", { submissionId: submission._id, section, userId: req.user._id });

    return res.status(201).json({
      success: true,
      submission: {
        id: submission._id,
        section: submission.section,
        type: submission.type,
        score: submission.score,
        feedbackStatus: submission.feedbackStatus,
        submittedAt: submission.submittedAt,
      },
      isPremium,
    });
  })
);

// ─── POST /api/submissions/audio — Upload speaking audio → S3 ────────────────
router.post(
  "/audio",
  auth,
  handleAudioUpload,
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError("No audio files uploaded", 400);
    }

    const userId = req.user._id.toString();
    const uploadedKeys = [];

    for (const file of req.files) {
      const { key } = await uploadAudio(
        file.buffer,
        `speaking/${userId}`,
        file.mimetype
      );
      uploadedKeys.push(key);
    }

    logger.info("Speaking audio uploaded", { userId, keys: uploadedKeys });

    return res.json({ success: true, audioKeys: uploadedKeys });
  })
);

// ─── GET /api/submissions/:id — Fetch submission with feedback ────────────────
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate("questionId", "section type difficulty content.prompt content.taskType content.questions")
      .populate("mockTestId", "title")
      .lean();

    if (!submission) throw new AppError("Submission not found", 404);

    const isPremium = req.user.subscriptionStatus === "premium";

    const response = {
      id: submission._id,
      section: submission.section,
      type: submission.type,
      score: submission.score,
      bandEstimate: submission.bandEstimate,
      feedbackStatus: submission.feedbackStatus,
      submittedAt: submission.submittedAt,
      timeSpent: submission.timeSpent,
      isPremium,
      mockTestTitle: submission.mockTestId?.title,
    };

    // Include answers with explanations
    if (submission.content?.answers?.length > 0) {
      const originalQuestions = submission.questionId?.content?.questions || [];
      response.answers = submission.content.answers.map(ans => {
        const q = originalQuestions.find(oq => oq.questionNumber === ans.questionId);
        
        // Resolve correct answer string if it's an index
        let resolvedCorrectAnswer = q?.correctAnswer;
        if (q && typeof q.correctAnswer === "number" && q.options && q.options.length > 0) {
          resolvedCorrectAnswer = q.options[q.correctAnswer];
        }

        return {
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect: ans.isCorrect,
          correctAnswer: resolvedCorrectAnswer || null,
          explanation: q?.explanation || null
        };
      });
    }

    // Submitted writing text
    if (submission.content?.text) {
      response.text = submission.content.text;
    }

    // Transcript (speaking)
    if (submission.content?.transcript) {
      response.transcript = submission.content.transcript;
    }

    if (submission.feedbackRating) {
      response.feedbackRating = submission.feedbackRating;
    }

    // AI feedback — gated for free users
    if (submission.feedbackStatus === "complete" && submission.feedbackResult) {
      if (isPremium) {
        response.feedbackResult = submission.feedbackResult;
      } else {
        response.feedbackResult = { overallBand: submission.feedbackResult.overallBand };
        response.upgradeRequired = true;
      }
    }

    return res.json({ success: true, submission: response });
  })
);

// ─── PUT /api/submissions/:id/draft — Autosave writing draft ─────────────────
router.put(
  "/:id/draft",
  auth,
  [body("text").notEmpty().withMessage("Text is required")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user._id,
      section: "writing",
    });

    if (!submission) throw new AppError("Writing submission not found", 404);
    if (submission.feedbackStatus === "complete") {
      throw new AppError("Cannot edit a submitted draft", 400);
    }

    submission.content.text = req.body.text;
    await submission.save();

    return res.json({ success: true, message: "Draft saved", savedAt: new Date() });
  })
);

// ─── POST /api/submissions/:id/expert-review — Request human review ───────────
router.post(
  "/:id/expert-review",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.subscriptionStatus !== "premium") {
      throw new AppError("Expert review is available for premium users only", 403, "PREMIUM_REQUIRED");
    }

    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!submission) throw new AppError("Submission not found", 404);

    if (!["writing", "speaking"].includes(submission.section)) {
      throw new AppError("Expert review only available for Writing and Speaking", 400);
    }

    // Idempotency — prevent duplicate reviews
    const existing = await ExpertReview.findOne({ submissionId: submission._id });
    if (existing) {
      return res.json({ success: true, expertReview: { id: existing._id, status: existing.status }, message: "Review already requested" });
    }

    const review = new ExpertReview({
      submissionId: submission._id,
      userId: req.user._id,
      status: "queued",
    });
    await review.save();

    await emailService.sendExpertReviewConfirmation(req.user.email, req.user.name);

    logger.info("Expert review requested", { reviewId: review._id, submissionId: submission._id });

    return res.status(201).json({
      success: true,
      message: "Expert review requested. Expected turnaround: 48 hours.",
      expertReview: { id: review._id, status: review.status },
    });
  })
);

// ─── POST /api/submissions/feedback-rating — Thumbs up/down on AI feedback ───
router.post(
  "/feedback-rating",
  auth,
  [
    body("submissionId").isMongoId().withMessage("Invalid submission ID"),
    body("rating").isIn(["up", "down"]).withMessage("Rating must be 'up' or 'down'"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const { submissionId, rating } = req.body;

    const submission = await Submission.findOne({ _id: submissionId, userId: req.user._id });
    if (!submission) throw new AppError("Submission not found", 404);

    submission.feedbackRating = rating;
    await submission.save();

    logger.info("Feedback rated", { submissionId, rating, userId: req.user._id });

    return res.json({ success: true, message: "Rating saved" });
  })
);

module.exports = router;
