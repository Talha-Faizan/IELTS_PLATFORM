const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Submission = require('../models/Submission');
const SystemConfig = require('../models/SystemConfig');
const { generateStudyPlan } = require('../utils/generateStudyPlan');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
        targetBand: req.user.targetBand,
        examDate: req.user.examDate,
        sectionPreferences: req.user.sectionPreferences,
        subscriptionStatus: req.user.subscriptionStatus,
        subscriptionPlan: req.user.subscriptionPlan,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('targetBand').optional().isFloat({ min: 1, max: 9 }).withMessage('Target band must be between 1 and 9'),
  body('examDate').optional().isISO8601().withMessage('Invalid date format'),
  body('sectionPreferences').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, targetBand, examDate, sectionPreferences } = req.body;

    if (name) req.user.name = name;
    if (targetBand) req.user.targetBand = targetBand;
    if (examDate) req.user.examDate = examDate;
    if (sectionPreferences) req.user.sectionPreferences = sectionPreferences;

    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        targetBand: req.user.targetBand,
        examDate: req.user.examDate,
        sectionPreferences: req.user.sectionPreferences
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/progress
// @desc    Get user progress (premium feature, free view-only summary)
// @access  Private
router.get('/progress', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const isPremium = req.user.subscriptionStatus === 'premium';

    // Get all submissions
    const submissions = await Submission.find({ userId }).sort({ submittedAt: -1 });

    // Calculate progress by section
    const progress = {
      reading: { attempts: 0, avgScore: 0, avgBand: 0 },
      listening: { attempts: 0, avgScore: 0, avgBand: 0 },
      writing: { attempts: 0, avgBand: 0 },
      speaking: { attempts: 0, avgBand: 0 }
    };

    let totalReadingScore = 0, totalReadingBand = 0;
    let totalListeningScore = 0, totalListeningBand = 0;
    let totalWritingBand = 0, writingAttempts = 0;
    let totalSpeakingBand = 0, speakingAttempts = 0;

    submissions.forEach(sub => {
      if (sub.section === 'reading') {
        progress.reading.attempts++;
        if (sub.score) {
          totalReadingScore += sub.score.percentage;
        }
        if (sub.bandEstimate) {
          totalReadingBand += sub.bandEstimate;
        }
      } else if (sub.section === 'listening') {
        progress.listening.attempts++;
        if (sub.score) {
          totalListeningScore += sub.score.percentage;
        }
        if (sub.bandEstimate) {
          totalListeningBand += sub.bandEstimate;
        }
      } else if (sub.section === 'writing') {
        progress.writing.attempts++;
        if (sub.bandEstimate) {
          totalWritingBand += sub.bandEstimate;
        }
      } else if (sub.section === 'speaking') {
        progress.speaking.attempts++;
        if (sub.bandEstimate) {
          totalSpeakingBand += sub.bandEstimate;
        }
      }
    });

    if (progress.reading.attempts > 0) {
      progress.reading.avgScore = Math.round(totalReadingScore / progress.reading.attempts);
      progress.reading.avgBand = Math.round((totalReadingBand / progress.reading.attempts) * 10) / 10;
    }
    if (progress.listening.attempts > 0) {
      progress.listening.avgScore = Math.round(totalListeningScore / progress.listening.attempts);
      progress.listening.avgBand = Math.round((totalListeningBand / progress.listening.attempts) * 10) / 10;
    }
    if (progress.writing.attempts > 0) {
      progress.writing.avgBand = Math.round((totalWritingBand / progress.writing.attempts) * 10) / 10;
    }
    if (progress.speaking.attempts > 0) {
      progress.speaking.avgBand = Math.round((totalSpeakingBand / progress.speaking.attempts) * 10) / 10;
    }

    // Calculate overall band
    const bands = [progress.reading.avgBand, progress.listening.avgBand, progress.writing.avgBand, progress.speaking.avgBand].filter(b => b > 0);
    const overallBand = bands.length > 0 ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10 : 0;

    // Get recent submissions
    const recentSubmissions = submissions.slice(0, 10).map(sub => ({
      id: sub._id,
      section: sub.section,
      type: sub.type,
      bandEstimate: sub.bandEstimate,
      submittedAt: sub.submittedAt
    }));

    // Daily usage (only show for premium)
    const usage = isPremium ? req.user.dailyUsage : null;

    res.json({
      success: true,
      progress: {
        sections: progress,
        overallBand,
        totalSubmissions: submissions.length,
        recentSubmissions,
        usage
      },
      isPremium
    });
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/submissions
// @desc    Get user submissions
// @access  Private
router.get('/submissions', auth, async (req, res) => {
  try {
    const { section, type, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (section) query.section = section;
    if (type) query.type = type;

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('questionId', 'section type difficulty')
      .populate('mockTestId', 'title');

    const total = await Submission.countDocuments(query);

    res.json({
      success: true,
      submissions: submissions.map(sub => ({
        id: sub._id,
        section: sub.section,
        type: sub.type,
        score: sub.score,
        bandEstimate: sub.bandEstimate,
        feedbackStatus: sub.feedbackStatus,
        submittedAt: sub.submittedAt,
        mockTestTitle: sub.mockTestId?.title
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/usage
// @desc    Get current usage limits
// @access  Private
router.get('/usage', auth, async (req, res) => {
  try {
    const isPremium = req.user.subscriptionStatus === 'premium';
    const access = req.user.canAccess('reading'); // Just to trigger reset

    // Fetch dynamic limits from DB, or use defaults if not found
    let config = await SystemConfig.findOne({ key: 'free_tier_limits' });
    const defaultLimits = config?.value || { reading: 10, listening: 2, writing: 2, speaking: 1, mockTest: 1 };

    const limits = {
      reading: { limit: isPremium ? 'unlimited' : defaultLimits.reading, used: req.user.dailyUsage.reading },
      listening: { limit: isPremium ? 'unlimited' : defaultLimits.listening, used: req.user.dailyUsage.listening },
      writing: { limit: isPremium ? 'unlimited' : defaultLimits.writing, used: req.user.dailyUsage.writing },
      speaking: { limit: isPremium ? 'unlimited' : defaultLimits.speaking, used: req.user.dailyUsage.speaking },
      mockTest: { limit: isPremium ? 'unlimited' : defaultLimits.mockTest, used: req.user.dailyUsage.mockTest }
    };

    res.json({
      success: true,
      isPremium,
      limits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/study-plan
// @desc    Get personalized daily study calendar
// @access  Private
router.get('/study-plan', auth, async (req, res) => {
  try {
    const studyPlan = await generateStudyPlan(req.user);
    res.json({
      success: true,
      studyPlan
    });
  } catch (error) {
    console.error('Study plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;