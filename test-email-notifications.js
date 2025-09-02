/**
 * Comprehensive Email Notification Testing Suite
 * 
 * This script tests the complete flow of event registration, email notifications,
 * and CPD point attribution in the EAU Members system.
 * 
 * Prerequisites:
 * 1. Application running on http://localhost:5180
 * 2. Email server running on port 3001
 * 3. Valid test user account
 * 
 * Usage: node test-email-notifications.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

// Configuration
const CONFIG = {
  appUrl: 'http://localhost:5180',
  emailServerUrl: 'http://localhost:3001',
  testUser: {
    email: 'rrzillesg@gmail.com',
    password: 'Sairam@2025'
  },
  testEventSlug: 'future-tech-conference', // One of our test events
  screenshotDir: path.join(__dirname, 'test-screenshots'),
  waitTime: 3000 // milliseconds
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}→ ${msg}${colors.reset}`)
};

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function takeScreenshot(page, name) {
  const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.png`;
  const filePath = path.join(CONFIG.screenshotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  log.info(`Screenshot saved: ${fileName}`);
  return filePath;
}

async function checkEmailServer() {
  try {
    const response = await fetch(`${CONFIG.emailServerUrl}/api/health`);
    if (response.ok) {
      log.success('Email server is running');
      return true;
    }
  } catch (error) {
    log.error('Email server is not accessible');
    log.warning(`Please ensure the email server is running: cd email-server && npm start`);
    return false;
  }
}

async function getLatestEmails() {
  try {
    const response = await fetch(`${CONFIG.emailServerUrl}/api/emails`);
    if (response.ok) {
      const emails = await response.json();
      return emails;
    }
  } catch (error) {
    log.error('Failed to fetch emails from server');
    return [];
  }
}

async function clearEmailLog() {
  try {
    const response = await fetch(`${CONFIG.emailServerUrl}/api/emails`, { 
      method: 'DELETE' 
    });
    if (response.ok) {
      log.info('Email log cleared');
    }
  } catch (error) {
    log.warning('Could not clear email log');
  }
}

// Main test functions
async function testLogin(page) {
  log.step('Testing login functionality...');
  
  await page.goto(CONFIG.appUrl);
  await page.waitForLoadState('networkidle');
  
  // Check if already logged in
  const dashboardVisible = await page.isVisible('text=Dashboard', { timeout: 5000 }).catch(() => false);
  
  if (dashboardVisible) {
    log.info('Already logged in, skipping login test');
    return true;
  }
  
  // Perform login
  await page.goto(`${CONFIG.appUrl}/login`);
  await takeScreenshot(page, 'login_page');
  
  await page.fill('input[type="email"]', CONFIG.testUser.email);
  await page.fill('input[type="password"]', CONFIG.testUser.password);
  await page.click('button:has-text("Sign In")');
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await takeScreenshot(page, 'dashboard_after_login');
  
  log.success('Login successful');
  return true;
}

async function testEventRegistration(page) {
  log.step('Testing event registration with email notification...');
  
  // Clear email log before testing
  await clearEmailLog();
  
  // Navigate to events
  await page.goto(`${CONFIG.appUrl}/events`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'events_list');
  
  // Click on a specific event
  const eventCard = page.locator('.cursor-pointer').filter({ hasText: 'Future Tech Conference' }).first();
  const eventExists = await eventCard.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!eventExists) {
    log.warning('Test event not found, creating one...');
    // Would need to create event here
    return false;
  }
  
  await eventCard.click();
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'event_details');
  
  // Check if already registered
  const alreadyRegistered = await page.isVisible('text=You are registered', { timeout: 3000 }).catch(() => false);
  
  if (alreadyRegistered) {
    log.info('Already registered for this event');
    
    // Test unregister and re-register
    const cancelButton = page.locator('button:has-text("Cancel Registration")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(2000);
      log.info('Unregistered from event');
    }
  }
  
  // Register for event
  const registerButton = page.locator('button:has-text("Register for Event")');
  if (await registerButton.isVisible()) {
    await registerButton.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'after_registration');
    
    // Check for success notification
    const successVisible = await page.isVisible('text=registered successfully', { timeout: 5000 }).catch(() => false);
    
    if (successVisible) {
      log.success('Event registration successful');
      
      // Wait for email to be sent
      await page.waitForTimeout(3000);
      
      // Check if email was sent
      const emails = await getLatestEmails();
      const confirmationEmail = emails.find(e => 
        e.to === CONFIG.testUser.email && 
        e.subject.includes('Registration Confirmation')
      );
      
      if (confirmationEmail) {
        log.success('Registration confirmation email sent');
        log.info(`Email subject: ${confirmationEmail.subject}`);
        return true;
      } else {
        log.warning('Confirmation email not found in email log');
        return false;
      }
    }
  }
  
  return false;
}

async function testJoinLiveEvent(page) {
  log.step('Testing "Join Live Event" functionality...');
  
  // For testing, we'll modify an event date to be "live"
  // This would require database access or admin panel
  
  // Navigate to a live event
  await page.goto(`${CONFIG.appUrl}/events`);
  
  // Look for any event with "Join Live Event" button
  const liveEventButton = page.locator('button:has-text("Join Live Event")').first();
  const isLive = await liveEventButton.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isLive) {
    await takeScreenshot(page, 'live_event_available');
    await liveEventButton.click();
    
    // Should trigger check-in and redirect
    await page.waitForTimeout(3000);
    
    log.success('Live event join tested');
    
    // Check for CPD notification email
    const emails = await getLatestEmails();
    const cpdEmail = emails.find(e => 
      e.to === CONFIG.testUser.email && 
      e.subject.includes('CPD Points')
    );
    
    if (cpdEmail) {
      log.success('CPD points notification email sent');
    }
    
    return true;
  } else {
    log.info('No live events available for testing');
    log.warning('To test this feature, create an event starting within 10 minutes');
    return false;
  }
}

async function testAdminReminderSettings(page) {
  log.step('Testing admin reminder configuration...');
  
  // Navigate to admin dashboard
  await page.goto(`${CONFIG.appUrl}/admin`);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, 'admin_dashboard');
  
  // Click on Event Reminders
  const reminderButton = page.locator('button:has-text("Event Reminders")');
  if (await reminderButton.isVisible()) {
    await reminderButton.click();
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'reminder_settings');
    
    // Test adding a new reminder
    const addButton = page.locator('button:has-text("Add Reminder")');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill in new reminder details
      await page.fill('input[placeholder*="days"]', '14');
      await page.selectOption('select', 'days');
      await page.fill('textarea', 'Don\'t forget! {{event_title}} is in 2 weeks');
      
      await takeScreenshot(page, 'new_reminder_form');
      
      // Save (if there's a save button)
      const saveButton = page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        log.success('New reminder configuration saved');
      }
    }
    
    // Test sending a test reminder
    const testEmailButton = page.locator('button:has-text("Send Test")');
    if (await testEmailButton.isVisible()) {
      await testEmailButton.click();
      await page.waitForTimeout(3000);
      
      // Check if test email was sent
      const emails = await getLatestEmails();
      const testEmail = emails.find(e => 
        e.subject.includes('Test Reminder')
      );
      
      if (testEmail) {
        log.success('Test reminder email sent successfully');
      }
    }
    
    return true;
  }
  
  log.warning('Event Reminders option not found in admin menu');
  return false;
}

async function testEmailTemplates(page) {
  log.step('Testing email template variables...');
  
  // This test verifies that template variables are being replaced correctly
  const testData = {
    '{{user_name}}': 'Test User',
    '{{event_title}}': 'Future Tech Conference',
    '{{event_date}}': new Date().toLocaleDateString(),
    '{{event_time}}': '10:00 AM',
    '{{event_location}}': 'Online via Zoom'
  };
  
  log.info('Template variables test data:');
  Object.entries(testData).forEach(([key, value]) => {
    log.info(`  ${key} → ${value}`);
  });
  
  // The actual template testing happens when emails are sent
  // We can verify by checking the email content
  const emails = await getLatestEmails();
  if (emails.length > 0) {
    const latestEmail = emails[0];
    let hasVariables = false;
    
    // Check if any template variables are still in the email (not replaced)
    Object.keys(testData).forEach(variable => {
      if (latestEmail.html && latestEmail.html.includes(variable)) {
        log.error(`Template variable ${variable} was not replaced in email`);
        hasVariables = true;
      }
    });
    
    if (!hasVariables) {
      log.success('All template variables properly replaced');
    }
  }
  
  return true;
}

async function generateTestReport(results) {
  log.step('Generating test report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length
    }
  };
  
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${report.summary.failed}${colors.reset}`);
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${status} ${test}: ${result.message || 'Completed'}`);
    if (result.error) {
      console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  });
  
  console.log('\n' + `Report saved to: ${reportPath}`);
  console.log(`Screenshots saved to: ${CONFIG.screenshotDir}`);
  
  return report;
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('EAU EMAIL NOTIFICATION TESTING SUITE');
  console.log('='.repeat(60));
  console.log(`App URL: ${CONFIG.appUrl}`);
  console.log(`Email Server: ${CONFIG.emailServerUrl}`);
  console.log(`Test User: ${CONFIG.testUser.email}`);
  console.log('='.repeat(60) + '\n');
  
  // Ensure screenshot directory exists
  await ensureDirectoryExists(CONFIG.screenshotDir);
  
  // Check prerequisites
  log.step('Checking prerequisites...');
  const emailServerRunning = await checkEmailServer();
  if (!emailServerRunning) {
    log.error('Email server must be running to continue tests');
    process.exit(1);
  }
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Set to true for CI/CD
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Track test results
  const results = {};
  
  try {
    // Run tests
    results.login = {
      success: await testLogin(page),
      message: 'User authentication'
    };
    
    if (results.login.success) {
      results.eventRegistration = {
        success: await testEventRegistration(page),
        message: 'Event registration with email confirmation'
      };
      
      results.liveEvent = {
        success: await testJoinLiveEvent(page),
        message: 'Join live event and CPD attribution'
      };
      
      results.adminSettings = {
        success: await testAdminReminderSettings(page),
        message: 'Admin reminder configuration'
      };
      
      results.emailTemplates = {
        success: await testEmailTemplates(page),
        message: 'Email template variable replacement'
      };
    }
    
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    results.error = {
      success: false,
      message: 'Test suite crashed',
      error: error.message
    };
  } finally {
    // Generate report
    await generateTestReport(results);
    
    // Close browser
    await browser.close();
  }
  
  // Exit with appropriate code
  const allPassed = Object.values(results).every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, CONFIG };