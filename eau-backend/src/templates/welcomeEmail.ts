export interface WelcomeEmailData {
  recipientName: string
  recipientEmail: string
  institutionName: string
  temporaryPassword?: string
  resetPasswordUrl: string
  loginUrl: string
  supportEmail: string
}

export const generateWelcomeEmailHTML = (data: WelcomeEmailData): string => {
  const currentYear = new Date().getFullYear()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to English Australia</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: white;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
    }
    .header img {
      max-width: 200px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-box {
      background-color: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .welcome-box h2 {
      margin: 0 0 10px;
      color: #1e3a8a;
      font-size: 20px;
    }
    .credentials-box {
      background-color: #fef3c7;
      border: 2px solid #f59e0b;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .credentials-box h3 {
      margin: 0 0 15px;
      color: #92400e;
      font-size: 18px;
    }
    .credentials-item {
      margin: 10px 0;
      padding: 10px;
      background-color: #ffffff;
      border-radius: 4px;
    }
    .credentials-item strong {
      color: #1e3a8a;
      display: inline-block;
      width: 100px;
    }
    .credentials-item code {
      background-color: #f3f4f6;
      padding: 4px 8px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #dc2626;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 30px;
      background-color: #3b82f6;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .button.secondary {
      background-color: #10b981;
      margin-left: 10px;
    }
    .button.secondary:hover {
      background-color: #059669;
    }
    .steps {
      background-color: #f9fafb;
      padding: 25px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .steps h3 {
      margin: 0 0 20px;
      color: #1e3a8a;
      font-size: 18px;
    }
    .step {
      display: flex;
      align-items: flex-start;
      margin: 15px 0;
    }
    .step-number {
      background-color: #3b82f6;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .step-content h4 {
      margin: 0 0 5px;
      color: #1e3a8a;
      font-size: 16px;
    }
    .step-content p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .features {
      margin: 30px 0;
    }
    .features h3 {
      color: #1e3a8a;
      font-size: 18px;
      margin-bottom: 15px;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .feature-list li {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
    }
    .feature-list li:last-child {
      border-bottom: none;
    }
    .feature-icon {
      color: #10b981;
      margin-right: 10px;
      font-size: 20px;
    }
    .support-box {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }
    .support-box h3 {
      color: #1e3a8a;
      margin: 0 0 10px;
      font-size: 18px;
    }
    .support-box p {
      margin: 5px 0;
      color: #4b5563;
    }
    .support-box a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }
    .footer {
      background-color: #1e293b;
      color: #e2e8f0;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }
    .footer .social {
      margin: 20px 0;
    }
    .footer .social a {
      margin: 0 10px;
    }
    @media (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .button {
        display: block;
        margin: 10px 0;
      }
      .button.secondary {
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://eauapp.platty.tech/logo-500.png" alt="English Australia" />
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Welcome Message -->
      <div class="welcome-box">
        <h2>Welcome, ${data.recipientName}!</h2>
        <p>
          We're excited to have you as part of the English Australia community. 
          Your account has been successfully created for <strong>${data.institutionName}</strong>.
        </p>
      </div>

      <!-- Login Credentials -->
      <div class="credentials-box">
        <h3>🔐 Your Login Credentials</h3>
        <div class="credentials-item">
          <strong>Email:</strong> <code>${data.recipientEmail}</code>
        </div>
        ${data.temporaryPassword ? `
        <div class="credentials-item">
          <strong>Password:</strong> <code>${data.temporaryPassword}</code>
        </div>
        <p style="color: #dc2626; margin-top: 15px; font-size: 14px;">
          ⚠️ <strong>Important:</strong> This is a temporary password. You'll be prompted to change it on your first login.
        </p>
        ` : ''}
      </div>

      <!-- Action Buttons -->
      <div class="button-container">
        ${data.temporaryPassword ? `
          <a href="${data.loginUrl}" class="button">Login Now</a>
        ` : `
          <a href="${data.resetPasswordUrl}" class="button">Set Your Password</a>
        `}
      </div>

      <!-- Getting Started Steps -->
      <div class="steps">
        <h3>🚀 Getting Started</h3>
        
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Set Your Password</h4>
            <p>${data.temporaryPassword ? 'Login with your temporary password and set a new one' : 'Click the button above to create your secure password'}</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Complete Your Profile</h4>
            <p>Add your professional information and preferences</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Explore Features</h4>
            <p>Discover events, track CPD points, and connect with colleagues</p>
          </div>
        </div>
      </div>

      <!-- Features List -->
      <div class="features">
        <h3>✨ What You Can Do</h3>
        <ul class="feature-list">
          <li>
            <span class="feature-icon">📚</span>
            <span>Track your Continuing Professional Development (CPD) activities</span>
          </li>
          <li>
            <span class="feature-icon">📅</span>
            <span>Register for professional development events and workshops</span>
          </li>
          <li>
            <span class="feature-icon">🏆</span>
            <span>Earn certificates and track your achievements</span>
          </li>
          <li>
            <span class="feature-icon">👥</span>
            <span>Connect with other English Australia members</span>
          </li>
          <li>
            <span class="feature-icon">📊</span>
            <span>Access your institution's membership information</span>
          </li>
        </ul>
      </div>

      <!-- Support Section -->
      <div class="support-box">
        <h3>Need Help?</h3>
        <p>Our support team is here to assist you</p>
        <p>
          📧 Email: <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>
        </p>
        <p style="margin-top: 15px;">
          <a href="${data.loginUrl}/help">Visit our Help Center</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© ${currentYear} English Australia. All rights reserved.</p>
      <div class="social">
        <a href="https://www.englishaustralia.com.au">Website</a>
        <a href="https://twitter.com/englishaustralia">Twitter</a>
        <a href="https://www.linkedin.com/company/english-australia">LinkedIn</a>
      </div>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
        You received this email because an account was created for you at English Australia.
        <br>
        If you believe this was a mistake, please contact support immediately.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export const generateWelcomeEmailText = (data: WelcomeEmailData): string => {
  return `
Welcome to English Australia!

Dear ${data.recipientName},

We're excited to have you as part of the English Australia community. Your account has been successfully created for ${data.institutionName}.

YOUR LOGIN CREDENTIALS
----------------------
Email: ${data.recipientEmail}
${data.temporaryPassword ? `Password: ${data.temporaryPassword}

IMPORTANT: This is a temporary password. You'll be prompted to change it on your first login.` : ''}

GET STARTED
-----------
${data.temporaryPassword ? 
  `1. Login at: ${data.loginUrl}` : 
  `1. Set your password at: ${data.resetPasswordUrl}`}
2. Complete your profile
3. Explore events and CPD tracking features

WHAT YOU CAN DO
---------------
• Track your Continuing Professional Development (CPD) activities
• Register for professional development events and workshops
• Earn certificates and track your achievements
• Connect with other English Australia members
• Access your institution's membership information

NEED HELP?
----------
Our support team is here to assist you:
Email: ${data.supportEmail}

Best regards,
The English Australia Team

© ${new Date().getFullYear()} English Australia. All rights reserved.
  `.trim()
}