#!/usr/bin/env node
/**
 * API Integration Test Suite
 * Tests all critical API endpoints for the IELTS Platform
 * 
 * Usage: node backend/src/tests/api-integration-test.js
 */

const axios = require('axios');
const logger = require('../config/logger');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';
let testResults = { passed: 0, failed: 0, tests: [] };

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n▶ ${name}...`, 'blue');
    await fn();
    log(`✓ ${name} passed`, 'green');
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed' });
  } catch (error) {
    log(`✗ ${name} failed: ${error.message}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
  }
}

async function runTests() {
  log('IELTS Platform - API Integration Test Suite', 'yellow');
  log('='.repeat(50), 'yellow');

  // Test data
  let testEmail = `test-${Date.now()}@example.com`;
  let testPassword = 'TestPassword123';
  let authToken = null;
  let userId = null;

  // ─── Auth Tests ─────────────────────────────────────────────────────────────
  await test('POST /auth/register - Register new user', async () => {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: testPassword,
      targetBand: 7.0,
    });

    if (!response.data.success) throw new Error('Registration failed');
    userId = response.data.user.id;
  });

  await test('POST /auth/login - Login user', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword,
    });

    if (!response.data.success) throw new Error('Login failed');
    authToken = response.data.tokens.accessToken;
    if (!authToken) throw new Error('No access token received');
  });

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  // ─── User Routes Tests ───────────────────────────────────────────────────────
  await test('GET /user/profile - Get user profile', async () => {
    const response = await axios.get(`${API_BASE}/user/profile`, { headers: authHeaders });
    if (!response.data.success) throw new Error('Profile fetch failed');
    if (!response.data.user.email) throw new Error('User data incomplete');
  });

  await test('PUT /user/preferences - Update user preferences', async () => {
    const response = await axios.put(
      `${API_BASE}/user/preferences`,
      {
        targetBand: 8.0,
        sectionPreferences: ['reading', 'writing'],
      },
      { headers: authHeaders }
    );
    if (!response.data.success) throw new Error('Preference update failed');
  });

  // ─── Content Routes Tests ────────────────────────────────────────────────────
  await test('GET /content/questions - Get questions', async () => {
    const response = await axios.get(
      `${API_BASE}/content/questions?section=reading&limit=5`,
      { headers: authHeaders }
    );
    if (!response.data.success) throw new Error('Question fetch failed');
    if (!Array.isArray(response.data.questions)) throw new Error('Invalid questions format');
  });

  await test('GET /content/mock-tests - Get mock tests', async () => {
    const response = await axios.get(
      `${API_BASE}/content/mock-tests?limit=5`,
      { headers: authHeaders }
    );
    if (!response.data.success) throw new Error('Mock test fetch failed');
    if (!Array.isArray(response.data.mockTests)) throw new Error('Invalid mock tests format');
  });

  // ─── Submission Routes Tests ─────────────────────────────────────────────────
  await test('POST /submissions - Create reading submission', async () => {
    const response = await axios.post(
      `${API_BASE}/submissions`,
      {
        section: 'reading',
        type: 'practice',
        content: { answers: [] },
      },
      { headers: authHeaders }
    );
    if (!response.data.success) throw new Error('Submission creation failed');
  });

  // ─── Subscription Routes Tests ───────────────────────────────────────────────
  await test('GET /subscription/plans - Get subscription plans', async () => {
    const response = await axios.get(
      `${API_BASE}/subscription/plans`,
      { headers: authHeaders }
    );
    if (!response.data.success) throw new Error('Plan fetch failed');
    if (!Array.isArray(response.data.plans)) throw new Error('Invalid plans format');
  });

  // ─── Admin Routes Tests (if admin) ───────────────────────────────────────────
  // Note: These tests require admin credentials
  await test('GET /admin/users - Get all users (admin only)', async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/admin/users?limit=5`,
        { headers: authHeaders }
      );
      if (response.status === 403) {
        log('  ⓘ Test user is not admin - skipping admin tests', 'yellow');
        return;
      }
      if (!response.data.success) throw new Error('Admin users fetch failed');
    } catch (err) {
      if (err.response?.status === 403) {
        log('  ⓘ Test user is not admin - skipping admin tests', 'yellow');
        return;
      }
      throw err;
    }
  });

  // ─── Error Handling Tests ────────────────────────────────────────────────────
  await test('Error handling - Invalid token', async () => {
    try {
      await axios.get(`${API_BASE}/user/profile`, {
        headers: { Authorization: 'Bearer invalid_token' },
      });
      throw new Error('Should have thrown 401 error');
    } catch (err) {
      if (err.response?.status !== 401) throw err;
    }
  });

  await test('Error handling - Missing required fields', async () => {
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: 'Test',
        email: 'invalid-email',
      });
      throw new Error('Should have thrown validation error');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  // ─── Print Results ───────────────────────────────────────────────────────────
  log('\n' + '='.repeat(50), 'yellow');
  log(`\nTest Results:`, 'yellow');
  log(`  ✓ Passed: ${testResults.passed}`, 'green');
  log(`  ✗ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`  Total: ${testResults.passed + testResults.failed}`, 'blue');

  if (testResults.failed > 0) {
    log('\nFailed Tests:', 'red');
    testResults.tests
      .filter((t) => t.status === 'failed')
      .forEach((t) => {
        log(`  - ${t.name}: ${t.error}`, 'red');
      });
  }

  log('\n' + '='.repeat(50) + '\n', 'yellow');
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\nTest suite error: ${error.message}`, 'red');
  process.exit(1);
});
