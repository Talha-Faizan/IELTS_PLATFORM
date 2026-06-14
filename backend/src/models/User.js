const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  targetBand: {
    type: Number,
    min: 1,
    max: 9,
    default: 7.0
  },
  examDate: {
    type: Date,
    default: null
  },
  sectionPreferences: {
    type: [String],
    enum: ['reading', 'listening', 'writing', 'speaking'],
    default: ['reading', 'listening', 'writing', 'speaking']
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'premium', 'grace'],
    default: 'free'
  },
  subscriptionId: {
    type: String,
    default: null
  },
  subscriptionPlan: {
    type: String,
    enum: ['monthly', 'annual', null],
    default: null
  },
  dailyUsage: {
    reading: { type: Number, default: 0 },
    listening: { type: Number, default: 0 },
    writing: { type: Number, default: 0 },
    speaking: { type: Number, default: 0 },
    mockTest: { type: Number, default: 0 }
  },
  lastUsageDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Reset daily usage
userSchema.methods.resetDailyUsage = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastUsageDate || this.lastUsageDate < today) {
    this.dailyUsage = {
      reading: 0,
      listening: 0,
      writing: 0,
      speaking: 0,
      mockTest: 0
    };
    this.lastUsageDate = today;
  }
};

// Check if user can perform action
userSchema.methods.canAccess = function(section) {
  this.resetDailyUsage();

  if (this.subscriptionStatus === 'premium') {
    return { allowed: true, isPremium: true };
  }

  const limits = {
    reading: 10,
    listening: 10,
    writing: 10,
    speaking: 10,
    mockTest: 5
  };

  const currentUsage = this.dailyUsage[section] || 0;
  const limit = limits[section] || 10;

  return {
    allowed: currentUsage < limit,
    isPremium: false,
    remaining: Math.max(0, limit - currentUsage),
    used: currentUsage,
    limit: limit
  };
};

module.exports = mongoose.model('User', userSchema);