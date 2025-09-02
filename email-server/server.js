const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Supabase client with SERVICE ROLE for database access
const supabase = createClient(
  'https://english-australia-eau-supabase.lkobs5.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

// Store SMTP configuration (in production, use database)
let smtpConfig = null;

// Function to get SMTP settings from database
async function getSMTPFromDatabase() {
  try {
    const { data, error } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('enabled', true)
      .single();

    if (error || !data) {
      console.log('No SMTP configuration found in database');
      return null;
    }

    return {
      host: data.smtp_host,
      port: data.smtp_port,
      secure: data.smtp_secure,
      auth: {
        user: data.smtp_username,
        pass: data.smtp_password
      },
      from_email: data.from_email,
      from_name: data.from_name
    };
  } catch (error) {
    console.error('Error fetching SMTP from database:', error);
    return null;
  }
}

// Configure SMTP endpoint
app.post('/api/configure-smtp', (req, res) => {
  const { 
    smtp_host, 
    smtp_port, 
    smtp_secure, 
    smtp_username, 
    smtp_password,
    from_email,
    from_name 
  } = req.body;

  smtpConfig = {
    host: smtp_host,
    port: smtp_port,
    secure: smtp_secure,
    auth: {
      user: smtp_username,
      pass: smtp_password
    },
    from_email,
    from_name
  };

  res.json({ 
    success: true, 
    message: 'SMTP configuration saved successfully' 
  });
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text, useStoredConfig } = req.body;

    let config;
    
    if (useStoredConfig) {
      // ALWAYS fetch from database when useStoredConfig is true
      config = await getSMTPFromDatabase();
      
      if (!config) {
        // Fallback to locally stored config
        config = smtpConfig;
      }
      
      if (!config) {
        return res.status(400).json({
          success: false,
          error: 'No SMTP configuration found. Please configure SMTP settings first.'
        });
      }
    } else if (req.body.smtp_config) {
      // Use configuration from request
      const { 
        smtp_host, 
        smtp_port, 
        smtp_secure, 
        smtp_username, 
        smtp_password,
        from_email,
        from_name 
      } = req.body.smtp_config;

      config = {
        host: smtp_host,
        port: smtp_port,
        secure: smtp_secure,
        auth: {
          user: smtp_username,
          pass: smtp_password
        },
        from_email,
        from_name
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'SMTP configuration not provided'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.from_name}" <${config.from_email}>`,
      to: to,
      subject: subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html: html
    });

    console.log('Email sent:', info.messageId);
    
    // Log the email
    logEmail(to, subject, 'sent');

    res.json({
      success: true,
      message: `Email sent successfully to ${to}`,
      messageId: info.messageId,
      provider: 'SMTP Server'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log the failed email
    logEmail(req.body.to, req.body.subject, 'failed', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to send email via SMTP'
    });
  }
});

// Test SMTP connection endpoint
app.post('/api/test-smtp', async (req, res) => {
  try {
    const { 
      smtp_host, 
      smtp_port, 
      smtp_secure, 
      smtp_username, 
      smtp_password 
    } = req.body;

    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port,
      secure: smtp_secure,
      auth: {
        user: smtp_username,
        pass: smtp_password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    await transporter.verify();

    res.json({
      success: true,
      message: `Successfully connected to ${smtp_host}:${smtp_port}`
    });

  } catch (error) {
    console.error('SMTP connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Store sent emails for testing (in production, use database)
let emailLog = [];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'EAU Email Server',
    timestamp: new Date().toISOString(),
    smtpConfigured: !!smtpConfig
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'EAU Email Server',
    timestamp: new Date().toISOString(),
    smtpConfigured: !!smtpConfig
  });
});

// Get email log
app.get('/api/emails', (req, res) => {
  res.json(emailLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

// Clear email log
app.delete('/api/emails', (req, res) => {
  emailLog = [];
  res.json({ success: true, message: 'Email log cleared' });
});

// Create reminders endpoint
app.post('/api/create-reminders', async (req, res) => {
  try {
    const { registrationId, eventId, userId, event } = req.body;
    
    console.log('🔍 Creating reminders for event:', event.title);
    
    // Get user email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user?.email) {
      throw new Error(`Failed to get user email: ${userError?.message}`);
    }

    const email = user.email;
    const eventStart = new Date(event.start_date);
    
    // Default reminder schedule
    const reminderSchedule = [
      { type: '7_days_before', minutes: 7 * 24 * 60, subject: 'Event in 1 Week' },
      { type: '3_days_before', minutes: 3 * 24 * 60, subject: 'Event in 3 Days' },
      { type: '1_day_before', minutes: 24 * 60, subject: 'Event Tomorrow' },
      { type: '30_min_before', minutes: 30, subject: 'Event Starting Soon' },
      { type: 'event_live', minutes: 0, subject: 'Event is Live Now!' }
    ];

    const reminders = [];
    
    for (const reminder of reminderSchedule) {
      const scheduledDate = new Date(eventStart.getTime() - reminder.minutes * 60 * 1000);
      const now = new Date();
      
      // Only schedule if the reminder date is in the future
      if (scheduledDate > now) {
        reminders.push({
          event_id: eventId,
          registration_id: registrationId,
          user_id: userId,
          reminder_type: reminder.type,
          scheduled_date: scheduledDate.toISOString(),
          email_to: email,
          email_subject: `${reminder.subject}: ${event.title}`,
          is_sent: false
        });
      }
    }
    
    if (reminders.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No future reminders needed',
        created: 0 
      });
    }

    // Insert reminders using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('event_reminders')
      .insert(reminders);

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully created ${reminders.length} reminders`);

    res.json({ 
      success: true, 
      message: `Created ${reminders.length} reminders`,
      created: reminders.length,
      reminders: reminders.map(r => ({ type: r.reminder_type, scheduled: r.scheduled_date }))
    });

  } catch (error) {
    console.error('❌ Error creating reminders:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add email to log
function logEmail(to, subject, status, error = null) {
  emailLog.push({
    id: Date.now().toString(),
    to,
    subject,
    status,
    error,
    timestamp: new Date().toISOString()
  });
}

app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});