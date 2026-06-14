const express = require('express');
const router = express.Router();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const Question = require('../models/Question');
const MockTest = require('../models/MockTest');
const { getPresignedUrl } = require('../services/storageService');
const logger = require('../config/logger');

// @route   GET /api/content/sections/:section/practice
// @desc    Get practice sets for a section
// @access  Private
router.get('/sections/:section/practice', auth, async (req, res) => {
  try {
    const { section } = req.params;
    const { difficulty, page = 1, limit = 20 } = req.query;

    // Validate section
    if (!['reading', 'listening', 'writing', 'speaking'].includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section'
      });
    }

    // Check usage limits for free users
    const access = req.user.canAccess(section);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Daily limit reached',
        isPremium: false,
        upgradeRequired: true,
        limits: {
          used: access.used,
          limit: access.limit
        }
      });
    }

    const query = {
      section,
      isPublished: true
    };

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const questions = await Question.find(query)
      .select('type difficulty tags timeLimit content.passage content.prompt content.taskType content.cueCard')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    // Group by type for practice sets
    const practiceSets = {};
    questions.forEach(q => {
      if (!practiceSets[q.type]) {
        practiceSets[q.type] = {
          type: q.type,
          difficulty: q.difficulty,
          count: 0,
          ids: []
        };
      }
      practiceSets[q.type].count++;
      practiceSets[q.type].ids.push(q._id);
    });

    res.json({
      success: true,
      section,
      practiceSets: Object.values(practiceSets),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      isPremium: access.isPremium
    });
  } catch (error) {
    console.error('Practice list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/content/sections/:section/practice/list
// @desc    List all published questions for a section (paginated, lightweight)
// @access  Private
router.get('/sections/:section/practice/list', auth, async (req, res) => {
  try {
    const { section } = req.params;
    const { difficulty, type, page = 1, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);

    if (!['reading', 'listening', 'writing', 'speaking'].includes(section)) {
      return res.status(400).json({ success: false, message: 'Invalid section' });
    }

    const query = { section, isPublished: true };
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;

    const access = req.user.canAccess(section);

    const questions = await Question.find(query)
      .select('section type difficulty tags timeLimit content.passage content.prompt content.taskType content.cueCard.topic content.questions content.audioUrl createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Question.countDocuments(query);

    // Build a lightweight summary per question — never leak correct answers
    const items = questions.map((q) => {
      const passage = q.content?.passage;
      const prompt = q.content?.prompt;
      const cueCardTopic = q.content?.cueCard?.topic;
      const itemCount = Array.isArray(q.content?.questions) ? q.content.questions.length : 0;

      // Best-effort title: first line of passage / prompt / cue topic / fallback
      const firstLine = (text) => (text || '').split('\n').map((s) => s.trim()).find(Boolean) || '';
      const title =
        firstLine(passage) ||
        firstLine(prompt) ||
        cueCardTopic ||
        `${section.charAt(0).toUpperCase() + section.slice(1)} ${q.type?.replace(/_/g, ' ') || 'Practice'}`;

      // Short preview (first ~140 chars) — only safe summary fields, never options/answers
      const preview = (passage || prompt || cueCardTopic || '').slice(0, 140);

      return {
        id: q._id,
        section: q.section,
        type: q.type,
        difficulty: q.difficulty,
        tags: q.tags || [],
        timeLimit: q.timeLimit || null,
        title: title.length > 80 ? `${title.slice(0, 77)}…` : title,
        preview,
        itemCount,
        hasAudio: Boolean(q.content?.audioUrl),
        taskType: q.content?.taskType || null,
        createdAt: q.createdAt,
      };
    });

    return res.json({
      success: true,
      section,
      questions: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      access: {
        allowed: access.allowed,
        isPremium: access.isPremium,
        used: access.used,
        limit: access.limit,
        remaining: access.remaining,
      },
    });
  } catch (error) {
    logger.error('Practice list error:', { error: error.message });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/content/sections/:section/practice/:id
// @desc    Get specific question/passage
// @access  Private
router.get('/sections/:section/practice/:id', auth, async (req, res) => {
  try {
    const { section, id } = req.params;

    const question = await Question.findOne({
      _id: id,
      section,
      isPublished: true
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check usage limits
    const access = req.user.canAccess(section);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Daily limit reached',
        upgradeRequired: true
      });
    }

    // For free users, hide correct answers
    const questionData = question.toObject();
    if (!access.isPremium) {
      questionData.content.questions = questionData.content.questions?.map(q => ({
        questionText: q.questionText,
        options: q.options,
        questionNumber: q.questionNumber
      }));
    }

    res.json({
      success: true,
      question: {
        id: question._id,
        section: question.section,
        type: question.type,
        difficulty: question.difficulty,
        timeLimit: question.timeLimit,
        content: questionData.content,
        tags: question.tags
      },
      isPremium: access.isPremium
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/content/mock-tests
// @desc    Get available mock tests
// @access  Private
router.get('/mock-tests', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const mockTests = await MockTest.find({ isPublished: true })
      .select('title description timeLimits createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MockTest.countDocuments({ isPublished: true });

    // Check mock test limit
    const access = req.user.canAccess('mockTest');
    const mockTestUsed = req.user.dailyUsage.mockTest;

    res.json({
      success: true,
      mockTests: mockTests.map(mt => ({
        id: mt._id,
        title: mt.title,
        description: mt.description,
        timeLimits: mt.timeLimits
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      mockTestLimit: {
        used: mockTestUsed,
        limit: access.isPremium ? 'unlimited' : access.limit,
        canTake: access.allowed
      },
      isPremium: access.isPremium
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/content/mock-tests/:id
// @desc    Get mock test structure
// @access  Private
router.get('/mock-tests/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const mockTest = await MockTest.findOne({
      _id: id,
      isPublished: true
    }).populate('sections.reading')
      .populate('sections.listening')
      .populate('sections.writing')
      .populate('sections.speaking');

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Check mock test limit
    const access = req.user.canAccess('mockTest');
    if (!access.allowed && !access.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Mock test limit reached',
        upgradeRequired: true
      });
    }

    res.json({
      success: true,
      mockTest: {
        id: mockTest._id,
        title: mockTest.title,
        description: mockTest.description,
        timeLimits: mockTest.timeLimits,
        sections: {
          reading: mockTest.sections.reading.map(q => ({
            id: q._id,
            type: q.type,
            difficulty: q.difficulty
          })),
          listening: mockTest.sections.listening.map(q => ({
            id: q._id,
            type: q.type,
            difficulty: q.difficulty
          })),
          writing: mockTest.sections.writing.map(q => ({
            id: q._id,
            type: q.type,
            taskType: q.content.taskType
          })),
          speaking: mockTest.sections.speaking.map(q => ({
            id: q._id,
            type: q.type
          }))
        }
      },
      isPremium: access.isPremium
    });
  } catch (error) {
    console.error('Get mock test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/content/audio/:key
// @desc    Generate pre-signed URL for audio
// @access  Private
router.get('/audio/:key(*)', auth, async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ success: false, message: 'Audio key required' });
    }

    const audioUrl = await getPresignedUrl(key);
    return res.json({ success: true, audioUrl, expiresIn: 3600 });
  } catch (error) {
    logger.error('Audio URL error:', { key: req.params.key, error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to generate audio URL' });
  }
});

module.exports = router;
