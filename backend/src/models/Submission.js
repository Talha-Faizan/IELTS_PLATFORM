const mongoose = require('mongoose');

const feedbackResultSchema = new mongoose.Schema({
  // For Writing
  taskAchievement: {
    bandScore: Number,
    commentary: String,
    suggestions: [String]
  },
  coherenceCohesion: {
    bandScore: Number,
    commentary: String,
    suggestions: [String]
  },
  lexicalResource: {
    bandScore: Number,
    commentary: String,
    suggestions: [String]
  },
  grammaticalRange: {
    bandScore: Number,
    commentary: String,
    suggestions: [String]
  },
  // For Speaking
  fluency: {
    bandScore: Number,
    commentary: String,
    suggestions: [String]
  },
  coherence: {
    bandScore: Number,
    commentary: String,
    suggestions: [String]
  },
  pronunciationProxy: {
    bandScore: Number,
    commentary: String,
    suggestions: [String]
  },
  // Overall
  overallBand: {
    type: Number,
    required: true
  }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  section: {
    type: String,
    enum: ['reading', 'listening', 'writing', 'speaking'],
    required: true
  },
  type: {
    type: String,
    enum: ['practice', 'mock'],
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  mockTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    default: null
  },
  content: {
    // For Reading/L Listening - answers
    answers: [{
      questionId: mongoose.Schema.Types.Mixed,
      answer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean
    }],
    // For Writing - text content
    text: {
      type: String,
      default: null
    },
    // For Speaking - audio URL
    audioUrl: {
      type: String,
      default: null
    },
    // For Speaking - transcripts
    transcript: [{
      part: String,
      text: String
    }]
  },
  // Auto-scored sections
  score: {
    correct: Number,
    total: Number,
    percentage: Number
  },
  // AI estimated band
  bandEstimate: {
    type: Number,
    default: null
  },
  // Feedback status and result
  feedbackStatus: {
    type: String,
    enum: ['pending', 'complete', 'failed', 'not_required'],
    default: 'not_required'
  },
  feedbackResult: {
    type: feedbackResultSchema,
    default: null
  },
  feedbackJobId: {
    type: String,
    default: null
  },
  // Time tracking
  timeSpent: {
    type: Number,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // User rating on AI feedback
  feedbackRating: {
    type: String,
    enum: ['up', 'down', null],
    default: null
  }
}, {
  timestamps: true
});

// Index for user queries
submissionSchema.index({ userId: 1, section: 1, submittedAt: -1 });
submissionSchema.index({ userId: 1, type: 1 });
submissionSchema.index({ feedbackStatus: 1 });

module.exports = mongoose.model('Submission', submissionSchema);