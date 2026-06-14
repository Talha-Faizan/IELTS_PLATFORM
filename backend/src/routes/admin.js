const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const { handleSingleAudioUpload } = require('../middleware/upload');
const { uploadAudio } = require('../services/storageService');
const User = require('../models/User');
const Question = require('../models/Question');
const MockTest = require('../models/MockTest');
const Submission = require('../models/Submission');
const ExpertReview = require('../models/ExpertReview');
const Subscription = require('../models/Subscription');
const ContentBlock = require('../models/ContentBlock');

// All admin routes require auth + admin role
router.use(auth);
router.use(adminOnly);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit: rawLimit = 20, search, status } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 20, 100);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.subscriptionStatus = status;
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        subscriptionStatus: u.subscriptionStatus,
        emailVerified: u.emailVerified,
        isActive: u.isActive,
        createdAt: u.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (role, status)
// @access  Admin
router.put('/users/:id', [
  body('role').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated',
      user: { id: user._id, role: user.role, isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/upload-audio
// @desc    Upload an audio file for a listening question (returns S3 key)
// @access  Admin
router.post('/upload-audio', handleSingleAudioUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file provided' });
    }

    const { key } = await uploadAudio(
      req.file.buffer,
      `listening/${req.user._id}`,
      req.file.mimetype
    );

    res.status(201).json({
      success: true,
      audioUrl: key,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ success: false, message: 'Audio upload failed' });
  }
});

// @route   GET /api/admin/content-blocks
// @desc    Get all content blocks
// @access  Admin
router.get('/content-blocks', async (req, res) => {
  try {
    const { section, page = 1, limit: rawLimit = 20 } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 20, 100);

    const query = {};
    if (section) query.section = section;

    const contentBlocks = await ContentBlock.find(query)
      .populate('createdBy', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ContentBlock.countDocuments(query);

    res.json({
      success: true,
      contentBlocks: contentBlocks.map(cb => ({
        id: cb._id,
        section: cb.section,
        title: cb.title,
        contentBody: cb.contentBody,
        order: cb.order,
        createdBy: cb.createdBy?.name,
        createdAt: cb.createdAt
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/content-blocks
// @desc    Create content block
// @access  Admin
router.post('/content-blocks', [
  body('section').isIn(['reading', 'listening', 'writing', 'speaking']),
  body('title').notEmpty(),
  body('contentBody').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const contentBlock = new ContentBlock({
      ...req.body,
      createdBy: req.user._id
    });

    await contentBlock.save();

    res.status(201).json({
      success: true,
      contentBlock: { id: contentBlock._id, section: contentBlock.section, title: contentBlock.title }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/content-blocks/:id
// @desc    Update content block
// @access  Admin
router.put('/content-blocks/:id', async (req, res) => {
  try {
    const contentBlock = await ContentBlock.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!contentBlock) {
      return res.status(404).json({ success: false, message: 'Content block not found' });
    }

    res.json({ success: true, contentBlock: { id: contentBlock._id, section: contentBlock.section, title: contentBlock.title } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/content-blocks/:id
// @desc    Delete content block
// @access  Admin
router.delete('/content-blocks/:id', async (req, res) => {
  try {
    const contentBlock = await ContentBlock.findByIdAndDelete(req.params.id);

    if (!contentBlock) {
      return res.status(404).json({ success: false, message: 'Content block not found' });
    }

    // Optional: Could also delete or update related questions, but standard practice is to leave them orphaned or cascade
    await Question.updateMany({ contentBlockId: req.params.id }, { $set: { contentBlockId: null } });

    res.json({ success: true, message: 'Content block deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/builder/section
// @desc    Unified builder: Creates a ContentBlock and its Questions in one request
// @access  Admin
router.post('/builder/section', [
  body('section').isIn(['reading', 'listening', 'writing', 'speaking']),
  body('title').notEmpty(),
  body('contentBody').optional(),
  body('type').notEmpty(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { section, title, contentBody, type, difficulty = 'medium', questions = [], prompt, taskType, minimumWords, cueCard } = req.body;
    let contentBlockId = null;

    // For Reading and Listening, we create a ContentBlock first
    if (section === 'reading' || section === 'listening') {
      const contentBlock = new ContentBlock({
        section,
        title,
        contentBody: contentBody || "Content pending",
        createdBy: req.user._id
      });
      await contentBlock.save();
      contentBlockId = contentBlock._id;
    }

    // Now create the Question document
    const questionDoc = new Question({
      section,
      type,
      difficulty,
      contentBlockId,
      content: {
        questions, // Array of sub-questions for reading/listening/speaking parts
        prompt, // For writing
        taskType, // For writing (task1, task2)
        minimumWords, // For writing
        cueCard // For speaking part 2
      },
      createdBy: req.user._id,
      isPublished: true
    });

    await questionDoc.save();

    res.status(201).json({
      success: true,
      message: `${section} created successfully via Builder`,
      contentBlockId,
      questionId: questionDoc._id
    });
  } catch (error) {
    console.error('Builder Section Error:', error);
    res.status(500).json({ success: false, message: 'Server error during builder save' });
  }
});

// @route   POST /api/admin/builder/mock-test
// @desc    Unified builder: Assembles a Mock Test from ContentBlocks and Questions
// @access  Admin
router.post('/builder/mock-test', [
  body('title').notEmpty(),
  body('selections').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, difficulty = 'medium', timeLimit = 165, selections } = req.body;
    
    // Validate that the selected reading and listening blocks actually contain 40 questions each?
    // For now, we trust the frontend UI which enforces this, but let's query the DB to be sure they exist.
    // In our MockTest schema, readingQuestions is an array of Question objectIds. Wait!
    // If selections.reading are ContentBlock IDs, we need to map them to Question IDs!
    const readingQuestionDocs = await Question.find({ contentBlockId: { $in: selections.reading || [] } });
    const listeningQuestionDocs = await Question.find({ contentBlockId: { $in: selections.listening || [] } });
    
    const mockTest = new MockTest({
      title,
      description,
      difficulty,
      timeLimit,
      isPublished: true,
      readingQuestions: readingQuestionDocs.map(q => q._id),
      listeningQuestions: listeningQuestionDocs.map(q => q._id),
      writingQuestions: selections.writing || [],
      speakingQuestions: selections.speaking || [],
      createdBy: req.user._id
    });

    await mockTest.save();

    res.status(201).json({
      success: true,
      message: 'Mock test assembled successfully',
      mockTestId: mockTest._id
    });
  } catch (error) {
    console.error('Builder MockTest Error:', error);
    res.status(500).json({ success: false, message: 'Server error during mock test assembly' });
  }
});

// @route   POST /api/admin/content/bulk-upload
// @desc    Bulk upload content blocks and questions from JSON
// @access  Admin
router.post('/content/bulk-upload', async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Payload must be a JSON array' });
    }

    let contentBlocksCreated = 0;
    let questionsCreated = 0;

    for (const item of items) {
      // Create ContentBlock if data exists
      let contentBlockId = null;
      if (item.contentBlock) {
        const cb = new ContentBlock({
          ...item.contentBlock,
          createdBy: req.user._id
        });
        await cb.save();
        contentBlockId = cb._id;
        contentBlocksCreated++;
      }

      // Create Questions
      if (item.questions && Array.isArray(item.questions)) {
        for (const q of item.questions) {
          const question = new Question({
            ...q,
            contentBlockId: contentBlockId || q.contentBlockId,
            createdBy: req.user._id
          });
          await question.save();
          questionsCreated++;
        }
      }
    }

    res.status(201).json({
      success: true,
      stats: { contentBlocksCreated, questionsCreated }
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ success: false, message: 'Server error during bulk upload' });
  }
});

// @route   GET /api/admin/analytics/questions
// @desc    Get question analytics (pass/fail rate)
// @access  Admin
router.get('/analytics/questions', async (req, res) => {
  try {
    const analytics = await Submission.aggregate([
      { $unwind: "$answers" },
      {
        $group: {
          _id: "$answers.questionId",
          totalAttempts: { $sum: 1 },
          failedAttempts: {
            $sum: { $cond: [{ $eq: ["$answers.isCorrect", false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          questionId: "$_id",
          totalAttempts: 1,
          failedAttempts: 1,
          failureRate: {
            $cond: [
              { $gt: ["$totalAttempts", 0] },
              { $divide: ["$failedAttempts", "$totalAttempts"] },
              0
            ]
          }
        }
      }
    ]);

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/questions
// @desc    Get all questions
// @access  Admin
router.get('/questions', async (req, res) => {
  try {
    const { section, type, difficulty, page = 1, limit: rawLimit = 20, isPublished } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 20, 100);

    const query = {};
    if (section) query.section = section;
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const questions = await Question.find(query)
      .populate('createdBy', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      questions: questions.map(q => ({
        id: q._id,
        section: q.section,
        type: q.type,
        difficulty: q.difficulty,
        isPublished: q.isPublished,
        tags: q.tags,
        createdBy: q.createdBy?.name,
        createdAt: q.createdAt
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/questions
// @desc    Create question
// @access  Admin
router.post('/questions', [
  body('section').isIn(['reading', 'listening', 'writing', 'speaking']),
  body('type').notEmpty(),
  body('content').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const question = new Question({
      ...req.body,
      createdBy: req.user._id
    });

    await question.save();

    res.status(201).json({
      success: true,
      question: { id: question._id, section: question.section, type: question.type }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/questions/:id
// @desc    Update question
// @access  Admin
router.put('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, question: { id: question._id, section: question.section } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/questions/:id
// @desc    Delete question
// @access  Admin
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/mock-tests
// @desc    Get mock tests
// @access  Admin
router.get('/mock-tests', async (req, res) => {
  try {
    const { page = 1, limit: rawLimit = 20, isPublished } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 20, 100);

    const query = {};
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const mockTests = await MockTest.find(query)
      .populate('createdBy', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MockTest.countDocuments(query);

    res.json({
      success: true,
      mockTests: mockTests.map(mt => ({
        id: mt._id,
        title: mt.title,
        isPublished: mt.isPublished,
        sections: {
          reading: mt.sections.reading?.length || 0,
          listening: mt.sections.listening?.length || 0,
          writing: mt.sections.writing?.length || 0,
          speaking: mt.sections.speaking?.length || 0
        },
        createdBy: mt.createdBy?.name,
        createdAt: mt.createdAt
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/mock-tests
// @desc    Create mock test
// @access  Admin
router.post('/mock-tests', [
  body('title').notEmpty(),
  body('sections').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mockTest = new MockTest({
      ...req.body,
      createdBy: req.user._id
    });

    await mockTest.save();

    res.status(201).json({ success: true, mockTest: { id: mockTest._id, title: mockTest.title } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/mock-tests/:id
// @desc    Update mock test
// @access  Admin
router.put('/mock-tests/:id', async (req, res) => {
  try {
    const mockTest = await MockTest.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    res.json({ success: true, mockTest: { id: mockTest._id, title: mockTest.title } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/mock-tests/:id
// @desc    Delete mock test
// @access  Admin
router.delete('/mock-tests/:id', async (req, res) => {
  try {
    const mockTest = await MockTest.findByIdAndDelete(req.params.id);

    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    res.json({ success: true, message: 'Mock test deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/expert-reviews
// @desc    Get expert review queue
// @access  Admin
router.get('/expert-reviews', async (req, res) => {
  try {
    const { status, page = 1, limit: rawLimit = 20 } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 20, 100);

    const query = {};
    if (status) query.status = status;

    const reviews = await ExpertReview.find(query)
      .populate('userId', 'name email')
      .populate('reviewerId', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ExpertReview.countDocuments(query);

    res.json({
      success: true,
      reviews: reviews.map(r => ({
        id: r._id,
        submissionId: r.submissionId,
        user: r.userId?.name,
        userEmail: r.userId?.email,
        status: r.status,
        reviewer: r.reviewerId?.name,
        assignedAt: r.assignedAt,
        createdAt: r.createdAt
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/expert-reviews/:id/assign
// @desc    Assign reviewer to expert review
// @access  Admin
router.put('/expert-reviews/:id/assign', [
  body('reviewerId').notEmpty().withMessage('Reviewer ID is required')
], async (req, res) => {
  try {
    const review = await ExpertReview.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          reviewerId: req.body.reviewerId,
          status: 'assigned',
          assignedAt: new Date()
        }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, message: 'Reviewer assigned', review: { id: review._id, status: review.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/expert-reviews/:id/details
// @desc    Get detailed expert review data including submission, questions, content blocks
// @access  Admin
router.get('/expert-reviews/:id/details', async (req, res) => {
  try {
    const review = await ExpertReview.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('reviewerId', 'name');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const submission = await Submission.findById(review.submissionId)
      .populate({
        path: 'answers.questionId',
        populate: {
          path: 'contentBlockId',
          model: 'ContentBlock'
        }
      });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.json({ success: true, review, submission });
  } catch (error) {
    console.error('Fetch review details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/expert-reviews/:id/complete
// @desc    Complete expert review and propagate scores to submission
// @access  Admin
router.put('/expert-reviews/:id/complete', [
  body('reviewerNotes').notEmpty(),
  body('revisedBandEstimate').isFloat({ min: 1, max: 9 }),
  body('scoresOverride').optional().isObject()
], async (req, res) => {
  try {
    const { reviewerNotes, revisedBandEstimate, detailedFeedback, scoresOverride } = req.body;

    const review = await ExpertReview.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          reviewerNotes,
          revisedBandEstimate,
          detailedFeedback,
          status: 'complete',
          completedAt: new Date()
        }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Propagate scores to Submission model
    const submission = await Submission.findById(review.submissionId);
    if (submission) {
      submission.expertFeedback = {
        reviewerId: review.reviewerId,
        reviewerNotes,
        detailedFeedback,
        bandEstimate: revisedBandEstimate,
        scores: scoresOverride || submission.expertFeedback?.scores || {}
      };
      // For MVP, we'll set the overall band to the examiner's estimate.
      submission.bandScore = revisedBandEstimate;
      await submission.save();
    }

    res.json({ success: true, message: 'Review completed', review });
  } catch (error) {
    console.error('Complete review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/metrics
// @desc    Get platform metrics
// @access  Admin
router.get('/metrics', async (req, res) => {
  try {
    // User metrics
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ subscriptionStatus: 'premium' });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Subscription metrics
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const cancelledSubscriptions = await Subscription.countDocuments({ status: 'cancelled' });

    // Submission metrics
    const totalSubmissions = await Submission.countDocuments();
    const submissionsToday = await Submission.countDocuments({
      submittedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Expert review queue
    const pendingReviews = await ExpertReview.countDocuments({ status: { $in: ['queued', 'assigned'] } });

    // Feedback quality (ratings)
    const feedbackRatings = await Submission.aggregate([
      { $match: { feedbackRating: { $exists: true } } },
      { $group: { _id: '$feedbackRating', count: { $sum: 1 } } }
    ]);

    const ratings = {
      up: feedbackRatings.find(r => r._id === 'up')?.count || 0,
      down: feedbackRatings.find(r => r._id === 'down')?.count || 0
    };

    res.json({
      success: true,
      metrics: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          free: totalUsers - premiumUsers,
          newToday: newUsersToday
        },
        subscriptions: {
          active: activeSubscriptions,
          cancelled: cancelledSubscriptions
        },
        submissions: {
          total: totalSubmissions,
          today: submissionsToday
        },
        expertReviews: {
          pending: pendingReviews
        },
        feedbackQuality: {
          positive: ratings.up,
          negative: ratings.down,
          satisfactionRate: ratings.up + ratings.down > 0
            ? Math.round((ratings.up / (ratings.up + ratings.down)) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;