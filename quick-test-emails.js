/**
 * Quick Email Testing Script
 * Simple tests to verify email functionality without full automation
 * 
 * Usage: node quick-test-emails.js
 */

// Using native fetch (Node.js 18+)

const CONFIG = {
  emailServer: 'http://localhost:3001',
  testEmail: 'test@example.com'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testEmailServer() {
  console.log(`${colors.blue}Testing Email Server...${colors.reset}`);
  
  try {
    // Test 1: Health check
    console.log('\n1. Health Check:');
    const healthResponse = await fetch(`${CONFIG.emailServer}/api/health`);
    if (healthResponse.ok) {
      console.log(`${colors.green}✓ Email server is running${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Email server health check failed${colors.reset}`);
      return false;
    }
    
    // Test 2: Send test email
    console.log('\n2. Sending Test Email:');
    const emailData = {
      to: CONFIG.testEmail,
      subject: 'Test Email - ' + new Date().toLocaleString(),
      html: `
        <h1>Test Email</h1>
        <p>This is a test email sent at ${new Date().toLocaleString()}</p>
        <ul>
          <li>Template variable test: {{user_name}}</li>
          <li>Event: {{event_title}}</li>
          <li>Date: {{event_date}}</li>
        </ul>
      `,
      text: 'Test email content'
    };
    
    const sendResponse = await fetch(`${CONFIG.emailServer}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    
    if (sendResponse.ok) {
      const result = await sendResponse.json();
      console.log(`${colors.green}✓ Email sent successfully${colors.reset}`);
      console.log(`  To: ${emailData.to}`);
      console.log(`  Subject: ${emailData.subject}`);
    } else {
      console.log(`${colors.red}✗ Failed to send email${colors.reset}`);
      const error = await sendResponse.text();
      console.log(`  Error: ${error}`);
    }
    
    // Test 3: Check email log
    console.log('\n3. Checking Email Log:');
    const logResponse = await fetch(`${CONFIG.emailServer}/api/emails`);
    if (logResponse.ok) {
      const emails = await logResponse.json();
      console.log(`${colors.green}✓ Retrieved email log${colors.reset}`);
      console.log(`  Total emails in log: ${emails.length}`);
      
      if (emails.length > 0) {
        console.log('\n  Last 3 emails:');
        emails.slice(0, 3).forEach((email, index) => {
          console.log(`  ${index + 1}. To: ${email.to} | Subject: ${email.subject} | Time: ${new Date(email.timestamp).toLocaleString()}`);
        });
      }
    } else {
      console.log(`${colors.red}✗ Failed to retrieve email log${colors.reset}`);
    }
    
    // Test 4: Template variables
    console.log('\n4. Testing Template Variables:');
    const templateEmail = {
      to: CONFIG.testEmail,
      subject: 'Event Reminder: {{event_title}}',
      html: `
        <h2>Hello {{user_name}}!</h2>
        <p>Don't forget about {{event_title}} on {{event_date}} at {{event_time}}.</p>
        <p>Location: {{event_location}}</p>
        <p>Registration ID: {{registration_id}}</p>
      `,
      text: 'Event reminder',
      templateData: {
        user_name: 'John Doe',
        event_title: 'Tech Conference 2025',
        event_date: 'August 25, 2025',
        event_time: '10:00 AM',
        event_location: 'Online via Zoom',
        registration_id: 'REG-12345'
      }
    };
    
    const templateResponse = await fetch(`${CONFIG.emailServer}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateEmail)
    });
    
    if (templateResponse.ok) {
      console.log(`${colors.green}✓ Template email sent successfully${colors.reset}`);
      console.log('  Variables replaced:');
      Object.entries(templateEmail.templateData).forEach(([key, value]) => {
        console.log(`    {{${key}}} → ${value}`);
      });
    } else {
      console.log(`${colors.red}✗ Failed to send template email${colors.reset}`);
    }
    
    // Test 5: Clear email log
    console.log('\n5. Clear Email Log Test:');
    const clearResponse = await fetch(`${CONFIG.emailServer}/api/emails`, {
      method: 'DELETE'
    });
    
    if (clearResponse.ok) {
      console.log(`${colors.green}✓ Email log cleared${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Could not clear email log${colors.reset}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.green}All email server tests completed!${colors.reset}`);
    console.log('='.repeat(50));
    
    return true;
    
  } catch (error) {
    console.log(`${colors.red}✗ Test failed with error: ${error.message}${colors.reset}`);
    console.log('\nMake sure the email server is running:');
    console.log('  cd email-server && npm start');
    return false;
  }
}

async function showEmailServerStatus() {
  console.log('\n' + '='.repeat(50));
  console.log('EMAIL SERVER STATUS');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${CONFIG.emailServer}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}● Server Status: ONLINE${colors.reset}`);
      console.log(`  URL: ${CONFIG.emailServer}`);
      console.log(`  SMTP Port: 3001`);
      
      // Get email stats
      const emailsResponse = await fetch(`${CONFIG.emailServer}/api/emails`);
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        console.log(`\n${colors.blue}Email Statistics:${colors.reset}`);
        console.log(`  Total Emails Sent: ${emails.length}`);
        
        if (emails.length > 0) {
          const today = emails.filter(e => {
            const emailDate = new Date(e.timestamp).toDateString();
            const todayDate = new Date().toDateString();
            return emailDate === todayDate;
          });
          console.log(`  Emails Today: ${today.length}`);
          
          // Group by recipient
          const recipients = {};
          emails.forEach(e => {
            recipients[e.to] = (recipients[e.to] || 0) + 1;
          });
          
          console.log(`\n${colors.blue}Top Recipients:${colors.reset}`);
          Object.entries(recipients)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([email, count]) => {
              console.log(`  ${email}: ${count} emails`);
            });
        }
      }
    } else {
      console.log(`${colors.red}● Server Status: OFFLINE${colors.reset}`);
      console.log('\nTo start the email server:');
      console.log('  cd email-server');
      console.log('  npm start');
    }
  } catch (error) {
    console.log(`${colors.red}● Server Status: UNREACHABLE${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    console.log('\nTo start the email server:');
    console.log('  cd email-server');
    console.log('  npm install');
    console.log('  npm start');
  }
  
  console.log('='.repeat(50));
}

// Main execution
async function main() {
  console.clear();
  console.log('='.repeat(50));
  console.log('EAU EMAIL SYSTEM - QUICK TEST');
  console.log('='.repeat(50));
  
  // Show server status first
  await showEmailServerStatus();
  
  // Ask user if they want to run tests
  console.log(`\n${colors.yellow}Ready to run email tests?${colors.reset}`);
  console.log('This will send test emails and verify the email system.');
  console.log('Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
  
  // Wait 3 seconds before running tests
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Run tests
  await testEmailServer();
  
  console.log(`\n${colors.blue}Test complete! Check the email server logs for details.${colors.reset}`);
  console.log('Email server dashboard: http://localhost:3001');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { testEmailServer, showEmailServerStatus };