const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Plan IDs (from Razorpay dashboard)
const PLANS = {
  monthly: process.env.RAZORPAY_MONTHLY_PLAN_ID || 'plan_monthly_id',
  annual: process.env.RAZORPAY_ANNUAL_PLAN_ID || 'plan_annual_id'
};

// @route   POST /api/subscriptions/create-order
// @desc    Create Razorpay subscription order
// @access  Private
router.post('/create-order', auth, [
  body('plan').isIn(['monthly', 'annual']).withMessage('Invalid plan')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { plan } = req.body;
    const isPremium = req.user.subscriptionStatus === 'premium';

    if (isPremium) {
      return res.status(400).json({
        success: false,
        message: 'Already a premium user'
      });
    }

    // Create subscription in Razorpay
    const subscription = await razorpay.subscriptions.create({
      plan_id: PLANS[plan],
      customer_notify: 1,
      total_count: plan === 'monthly' ? 12 : 1, // 12 months for monthly, 1 year for annual
      start_at: Math.floor(Date.now() / 1000) + 300 // Start after 5 minutes
    });

    // Store subscription reference in user (temporary, will be confirmed via webhook)
    req.user.subscriptionId = subscription.id;
    req.user.subscriptionPlan = plan;
    await req.user.save();

    res.json({
      success: true,
      subscriptionId: subscription.id,
      orderId: subscription.id,
      plan,
      status: subscription.status
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// @route   POST /api/subscriptions/webhook
// @desc    Handle Razorpay webhook events
// @access  Public (verified by signature)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature - req.body is a Buffer, pass it directly for HMAC
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Parse the Buffer to event object
    const event = JSON.parse(req.body.toString('utf8'));
    const { event: eventType, payload } = event;

    // Handle different event types
    switch (eventType) {
      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      case 'subscription.renewed':
        await handleSubscriptionRenewed(payload);
        break;
      case 'subscription.halted':
        await handleSubscriptionFailed(payload);
        break;
      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;
      default:
        console.log('Unhandled webhook event:', eventType);
    }

    res.json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Helper functions for webhook handling
async function handleSubscriptionActivated(payload) {
  // Idempotency: skip if this paymentId was already processed
  const paymentId = payload?.payment?.entity?.id || payload?.subscription?.entity?.id;
  if (paymentId) {
    const alreadyProcessed = await Subscription.findOne({
      'webhookEvents.paymentId': paymentId
    });
    if (alreadyProcessed) {
      console.log('Webhook already processed, skipping', { paymentId });
      return;
    }
  }

  const subscriptionId = payload.subscription.entity.id;
  const user = await User.findOne({ subscriptionId });

  if (!user) {
    console.log('User not found for subscription:', subscriptionId);
    return;
  }

  user.subscriptionStatus = 'premium';

  // Store or update subscription record
  let subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
  if (!subscription) {
    subscription = new Subscription({
      userId: user._id,
      razorpaySubscriptionId: subscriptionId,
      razorpayPlanId: payload.subscription.entity.plan_id,
      plan: payload.subscription.entity.plan_id === PLANS.annual ? 'annual' : 'monthly',
      status: 'active',
      currentPeriodStart: new Date(payload.subscription.entity.start_at * 1000),
      currentPeriodEnd: new Date(payload.subscription.entity.end_at * 1000)
    });
  } else {
    subscription.status = 'active';
    subscription.currentPeriodStart = new Date(payload.subscription.entity.start_at * 1000);
    subscription.currentPeriodEnd = new Date(payload.subscription.entity.end_at * 1000);
  }

  await subscription.save();
  await user.save();

  // Record webhook event for idempotency
  if (paymentId && subscription) {
    await Subscription.updateOne(
      { _id: subscription._id },
      { $push: { webhookEvents: { event: 'subscription.activated', paymentId } } }
    );
  }

  // Send welcome email
  const emailService = require('../services/email');
  await emailService.sendPremiumWelcomeEmail(user.email, user.name);
}

async function handleSubscriptionCancelled(payload) {
  // Idempotency: skip if this paymentId was already processed
  const paymentId = payload?.payment?.entity?.id || payload?.subscription?.entity?.id;
  if (paymentId) {
    const alreadyProcessed = await Subscription.findOne({
      'webhookEvents.paymentId': paymentId
    });
    if (alreadyProcessed) {
      console.log('Webhook already processed, skipping', { paymentId });
      return;
    }
  }

  const subscriptionId = payload.subscription.entity.id;
  const user = await User.findOne({ subscriptionId });

  if (!user) return;

  user.subscriptionStatus = 'free';
  await user.save();

  const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
  if (subscription) {
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    // Record webhook event for idempotency
    if (paymentId) {
      await Subscription.updateOne(
        { _id: subscription._id },
        { $push: { webhookEvents: { event: 'subscription.cancelled', paymentId } } }
      );
    }
  }

  // Send cancellation email
  const emailService = require('../services/email');
  await emailService.sendSubscriptionCancelledEmail(user.email, user.name);
}

async function handleSubscriptionRenewed(payload) {
  // Idempotency: skip if this paymentId was already processed
  const paymentId = payload?.payment?.entity?.id || payload?.subscription?.entity?.id;
  if (paymentId) {
    const alreadyProcessed = await Subscription.findOne({
      'webhookEvents.paymentId': paymentId
    });
    if (alreadyProcessed) {
      console.log('Webhook already processed, skipping', { paymentId });
      return;
    }
  }

  const subscriptionId = payload.subscription.entity.id;
  const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

  if (!subscription) return;

  subscription.currentPeriodStart = new Date(payload.subscription.entity.start_at * 1000);
  subscription.currentPeriodEnd = new Date(payload.subscription.entity.end_at * 1000);
  await subscription.save();

  // Record webhook event for idempotency
  if (paymentId && subscription) {
    await Subscription.updateOne(
      { _id: subscription._id },
      { $push: { webhookEvents: { event: 'subscription.renewed', paymentId } } }
    );
  }
}

async function handleSubscriptionFailed(payload) {
  // Idempotency: skip if this paymentId was already processed
  const paymentId = payload?.payment?.entity?.id || payload?.subscription?.entity?.id;
  if (paymentId) {
    const alreadyProcessed = await Subscription.findOne({
      'webhookEvents.paymentId': paymentId
    });
    if (alreadyProcessed) {
      console.log('Webhook already processed, skipping', { paymentId });
      return;
    }
  }

  const subscriptionId = payload.subscription.entity.id;
  const user = await User.findOne({ subscriptionId });

  if (!user) return;

  user.subscriptionStatus = 'grace';
  await user.save();

  // Record webhook event for idempotency
  if (paymentId) {
    const subscription = await Subscription.findOne({ userId: user._id });
    if (subscription) {
      await Subscription.updateOne(
        { _id: subscription._id },
        { $push: { webhookEvents: { event: 'subscription.failed', paymentId } } }
      );
    }
  }

  // Send payment failed email
  const emailService = require('../services/email');
  await emailService.sendPaymentFailedEmail(user.email, user.name);
}

async function handleSubscriptionPaused(payload) {
  // Idempotency: skip if this paymentId was already processed
  const paymentId = payload?.payment?.entity?.id || payload?.subscription?.entity?.id;
  if (paymentId) {
    const alreadyProcessed = await Subscription.findOne({
      'webhookEvents.paymentId': paymentId
    });
    if (alreadyProcessed) {
      console.log('Webhook already processed, skipping', { paymentId });
      return;
    }
  }

  const subscriptionId = payload.subscription.entity.id;
  const user = await User.findOne({ subscriptionId });

  if (!user) return;

  user.subscriptionStatus = 'grace';
  await user.save();

  // Record webhook event for idempotency
  if (paymentId) {
    const subscription = await Subscription.findOne({ userId: user._id });
    if (subscription) {
      await Subscription.updateOne(
        { _id: subscription._id },
        { $push: { webhookEvents: { event: 'subscription.paused', paymentId } } }
      );
    }
  }
}

// @route   GET /api/subscriptions/status
// @desc    Get subscription status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active'
    });

    res.json({
      success: true,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : null,
      userStatus: req.user.subscriptionStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', auth, async (req, res) => {
  try {
    const isPremium = req.user.subscriptionStatus === 'premium';
    if (!isPremium) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    if (!req.user.subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID not found'
      });
    }

    // Cancel in Razorpay
    await razorpay.subscriptions.cancel(req.user.subscriptionId);

    // Update user status
    req.user.subscriptionStatus = 'free';
    await req.user.save();

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: req.user.subscriptionId },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled. You will have access until the end of billing period.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

module.exports = router;