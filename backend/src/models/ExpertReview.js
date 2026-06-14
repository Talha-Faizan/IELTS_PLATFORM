const mongoose = require('mongoose');

const expertReviewSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['queued', 'assigned', 'in_progress', 'complete'],
    default: 'queued'
  },
  reviewerNotes: {
    type: String,
    default: null
  },
  revisedBandEstimate: {
    type: Number,
    default: null
  },
  // Additional feedback beyond AI
  detailedFeedback: {
    type: String,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

expertReviewSchema.index({ status: 1 });
expertReviewSchema.index({ userId: 1 });
expertReviewSchema.index({ reviewerId: 1 });

module.exports = mongoose.model('ExpertReview', expertReviewSchema);