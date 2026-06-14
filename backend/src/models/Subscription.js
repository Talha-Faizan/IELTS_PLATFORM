const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  razorpaySubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  // Razorpay plan IDs
  razorpayPlanId: {
    type: String,
    required: true
  },
  // For webhook idempotency
  webhookEvents: [{
    event: String,
    paymentId: String,
    processedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ razorpaySubscriptionId: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);