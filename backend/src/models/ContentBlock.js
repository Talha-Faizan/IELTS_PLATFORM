const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
  section: {
    type: String,
    enum: ['reading', 'listening', 'writing', 'speaking'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  contentBody: {
    type: String,
    required: true // Text for reading/writing prompts, Audio URL for listening
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

contentBlockSchema.index({ section: 1 });

module.exports = mongoose.model('ContentBlock', contentBlockSchema);
