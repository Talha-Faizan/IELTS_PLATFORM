#!/usr/bin/env node
/**
 * Seed Admin User
 * Creates the first admin user for the IELTS Platform
 * Usage: node backend/src/seeds/createAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const logger = require("../config/logger");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ielts.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        logger.info(`✓ Admin already exists: ${ADMIN_EMAIL}`);
        process.exit(0);
      } else {
        // Promote existing user to admin
        existingAdmin.role = "admin";
        await existingAdmin.save();
        logger.info(`✓ Promoted existing user to admin: ${ADMIN_EMAIL}`);
        process.exit(0);
      }
    }

    // Create new admin
    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      emailVerified: true,
      isActive: true,
    });

    await admin.save();
    logger.info(`✓ Admin user created successfully!`);
    logger.info(`  Email: ${ADMIN_EMAIL}`);
    logger.info(`  Password: ${ADMIN_PASSWORD}`);
    logger.info(`  Access: http://localhost:3000/admin-access`);

    process.exit(0);
  } catch (error) {
    logger.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
