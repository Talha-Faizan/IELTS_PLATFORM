const mongoose = require('mongoose');

const mockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  sections: {
    reading: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }],
    listening: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }],
    writing: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }],
    speaking: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }]
  },
  timeLimits: {
    reading: { type: Number, default: 60 },
    listening: { type: Number, default: 30 },
    writing: { type: Number, default: 60 },
    speaking: { type: Number, default: 15 }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Validate that all sections are present before publishing
mockTestSchema.pre('save', function(next) {
  if (this.isPublished) {
    const sections = ['reading', 'listening', 'writing', 'speaking'];
    for (const section of sections) {
      if (!this.sections[section] || this.sections[section].length === 0) {
        return next(new Error(`Cannot publish mock test without ${section} section`));
      }
    }
  }
  next();
});

module.exports = mongoose.model('MockTest', mockTestSchema);