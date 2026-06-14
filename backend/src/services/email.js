const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ieltsplatform.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"IELTS Platform" <${FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

const emailService = {
  // Verification email
  sendVerificationEmail: async (email, token, name) => {
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    const subject = 'Verify your IELTS Platform account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Welcome to IELTS Platform, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address to get started.</p>
        <p style="margin: 20px 0;">
          <a href="${verifyUrl}" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </p>
        <p>Or copy this link: ${verifyUrl}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Password reset email
  sendPasswordResetEmail: async (email, token, name) => {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Reset your IELTS Platform password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Reset Your Password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </p>
        <p>Or copy this link: ${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Welcome email (after email verification)
  sendWelcomeEmail: async (email, name) => {
    const subject = 'Welcome to IELTS Platform - Start Your Journey!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Welcome, ${name}!</h2>
        <p>Your account has been verified. You're now ready to start your IELTS preparation journey.</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>Practice Reading and Listening with instant feedback</li>
          <li>Get AI-powered Writing feedback with band estimates</li>
          <li>Record and practice Speaking</li>
          <li>Take full mock tests under real exam conditions</li>
        </ul>
        <p style="margin: 20px 0;">
          <a href="${FRONTEND_URL}/dashboard" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a>
        </p>
        <p>Set your target band score in your profile to get personalized recommendations!</p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Premium welcome email
  sendPremiumWelcomeEmail: async (email, name) => {
    const subject = 'Welcome to Premium - Unlock Your Full Potential!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Welcome to Premium, ${name}!</h2>
        <p>Congratulations on upgrading to Premium! You now have full access to all features:</p>
        <ul>
          <li>Unlimited practice across all sections</li>
          <li>Unlimited full mock tests</li>
          <li>Detailed AI feedback with per-criterion band breakdowns</li>
          <li>Expert human review for Writing and Speaking</li>
          <li>Progress analytics and improvement tracking</li>
        </ul>
        <p style="margin: 20px 0;">
          <a href="${FRONTEND_URL}/dashboard" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Start Practicing</a>
        </p>
        <p>Your first expert review is on us! Submit your best Writing or Speaking attempt for human feedback.</p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Subscription cancelled email
  sendSubscriptionCancelledEmail: async (email, name) => {
    const subject = 'Subscription Cancelled - IELTS Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">We're Sorry to See You Go, ${name}</h2>
        <p>Your Premium subscription has been cancelled.</p>
        <p>You'll continue to have Premium access until the end of your billing period.</p>
        <p>We'd love to have you back! If there's anything we can improve, please let us know.</p>
        <p style="margin: 20px 0;">
          <a href="${FRONTEND_URL}/pricing" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reactivate Subscription</a>
        </p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Payment failed email
  sendPaymentFailedEmail: async (email, name) => {
    const subject = 'Payment Issue - IELTS Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Payment Issue, ${name}</h2>
        <p>We couldn't process your payment. Your account is now in a grace period.</p>
        <p>Please update your payment method to avoid losing Premium access.</p>
        <p style="margin: 20px 0;">
          <a href="${FRONTEND_URL}/billing" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Update Payment</a>
        </p>
        <p style="color: #666; font-size: 14px;">You have 3 days to update your payment method.</p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Expert review confirmation
  sendExpertReviewConfirmation: async (email, name) => {
    const subject = 'Expert Review Request Received - IELTS Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Expert Review Request Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Your request for expert review has been received and added to our queue.</p>
        <p>Our expert reviewers will review your submission within 48 hours.</p>
        <p>You'll receive an email notification once your review is complete.</p>
        <p>Track your review status on your dashboard!</p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Expert review ready notification
  sendExpertReviewReadyEmail: async (email, name, section) => {
    const subject = `Your ${section.charAt(0).toUpperCase() + section.slice(1)} Expert Review is Ready!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Expert Review Complete!</h2>
        <p>Hi ${name},</p>
        <p>Your ${section} expert review is ready. Our reviewer has provided detailed feedback and a revised band estimate.</p>
        <p style="margin: 20px 0;">
          <a href="${FRONTEND_URL}/submissions" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Review</a>
        </p>
        <p>Use this feedback to further improve your score!</p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // AI feedback ready notification
  sendFeedbackReadyEmail: async (email, name, section) => {
    const subject = `Your ${section.charAt(0).toUpperCase() + section.slice(1)} Feedback is Ready!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">AI Feedback Ready!</h2>
        <p>Hi ${name},</p>
        <p>Your ${section} submission has been scored and analyzed.</p>
        <p style="margin: 20px 0;">
          <a href="${FRONTEND_URL}/submissions" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Feedback</a>
        </p>
      </div>
    `;
    return sendEmail(email, subject, html);
  },

  // Subscription renewal reminder
  sendRenewalReminderEmail: async (email, name, daysLeft) => {
    const subject = `Your Premium renews in ${daysLeft} days`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2E4A;">Subscription Renewal Reminder</h2>
        <p>Hi ${name},</p>
        <p>Your Premium subscription will automatically renew in ${daysLeft} days.</p>
        <p>Continue your IELTS preparation without interruption!</p>
        <p style="margin: 20px 0;">
          <a href="${FRONTEND_URL}/dashboard" style="background-color: #F5A623; color: #1A2E4A; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Continue Practicing</a>
        </p>
      </div>
    `;
    return sendEmail(email, subject, html);
  }
};

module.exports = emailService;