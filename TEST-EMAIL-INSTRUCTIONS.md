# Email Notification Testing Guide

## Overview
This guide explains how to test the email notification system for EAU Members, including event registration confirmations, reminders, and CPD point notifications.

## Prerequisites

### 1. Start the Email Server
```bash
cd email-server
npm start
```
The email server will run on http://localhost:3001

### 2. Start the Application
```bash
cd eau-members
npm run dev
```
The application will run on http://localhost:5180

### 3. Install Playwright (for automated tests)
```bash
npm install -D playwright
npx playwright install chromium
```

## Available Test Scripts

### 1. Quick Email Test (Recommended for quick verification)
Tests basic email server functionality without browser automation.

```bash
node quick-test-emails.js
```

This script will:
- ✅ Check if email server is running
- ✅ Send test emails
- ✅ Verify template variable replacement
- ✅ Show email statistics
- ✅ Clear email log

### 2. Full Automated Test Suite
Complete end-to-end testing with browser automation.

```bash
node test-email-notifications.js
```

This script will:
- ✅ Login to the application
- ✅ Register for an event and verify confirmation email
- ✅ Test "Join Live Event" functionality
- ✅ Test admin reminder configuration
- ✅ Verify CPD point notification emails
- ✅ Generate test report with screenshots

## Manual Testing Steps

### Test 1: Event Registration Email
1. Login to the application
2. Go to Events page
3. Click on any event
4. Click "Register for Event"
5. Check email server dashboard: http://localhost:3001
6. Verify confirmation email was sent with:
   - Correct recipient
   - Event details
   - Registration link

### Test 2: Live Event and CPD Points
1. Find or create an event starting within 10 minutes
2. Register for the event
3. Wait until 10 minutes before event start
4. "Join Live Event" button should appear
5. Click the button
6. Verify:
   - Check-in is recorded
   - Redirected to Zoom link
   - CPD points email is sent

### Test 3: Admin Reminder Configuration
1. Login as admin (rrzillesg@gmail.com)
2. Go to Admin Dashboard
3. Click "Event Reminders" button
4. Configure reminders:
   - Add new reminder
   - Edit existing reminders
   - Reorder reminders (drag & drop)
   - Enable/disable reminders
5. Send test reminder
6. Check email server for test email

## Email Server Dashboard

Access the email server dashboard at: **http://localhost:3001**

Features:
- View all sent emails
- Search emails by recipient or subject
- View email content (HTML and text)
- Clear email log
- Export email data

## Template Variables

The following variables are available in email templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{user_name}}` | Recipient's full name | John Doe |
| `{{event_title}}` | Event name | Tech Conference 2025 |
| `{{event_date}}` | Event date | August 25, 2025 |
| `{{event_time}}` | Event start time | 10:00 AM |
| `{{event_location}}` | Event location | Online via Zoom |
| `{{event_link}}` | Link to event page | http://localhost:5180/events/... |
| `{{registration_id}}` | Registration ID | REG-12345 |
| `{{cpd_points}}` | CPD points earned | 5 |

## Troubleshooting

### Email server not running
```bash
cd email-server
npm install
npm start
```

### Emails not being sent
1. Check if email server is running: http://localhost:3001/api/health
2. Check browser console for errors
3. Verify SMTP settings in application

### Template variables not replaced
1. Check that variables are spelled correctly
2. Ensure templateData is passed when sending email
3. Check email server logs for errors

### Test script fails
1. Ensure both servers are running (app and email)
2. Check test user credentials are correct
3. Verify test events exist in database
4. Check screenshots in `test-screenshots/` folder

## Test Data

### Test User
- Email: rrzillesg@gmail.com
- Password: Sairam@2025
- Roles: AdminSuper, Admin, Members

### Test Events (created earlier)
1. Future Tech Conference - September 15, 2025
2. AI Workshop - October 20, 2025
3. Annual EAU Gala - November 30, 2025

## Continuous Testing

For continuous integration, add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Start Email Server
  run: |
    cd email-server
    npm start &
    sleep 5

- name: Start Application
  run: |
    cd eau-members
    npm run dev &
    sleep 10

- name: Run Email Tests
  run: |
    node test-email-notifications.js
```

## Support

If you encounter issues:
1. Check the email server logs
2. Review application console for errors
3. Verify all services are running
4. Check the test reports in `test-screenshots/`

## Next Steps

After testing is complete:
1. Configure production SMTP settings
2. Set up email templates for production
3. Configure reminder schedules
4. Monitor email delivery rates
5. Set up email analytics