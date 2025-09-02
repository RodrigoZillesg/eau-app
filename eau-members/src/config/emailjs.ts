// EmailJS Configuration
// EmailJS allows sending emails directly from the browser without backend

export const EMAILJS_CONFIG = {
  // These will be set after creating an EmailJS account
  SERVICE_ID: 'service_eau_brevo', // You'll create this in EmailJS dashboard
  TEMPLATE_ID_TEST: 'template_test', // Test email template
  TEMPLATE_ID_REGISTRATION: 'template_registration', // Event registration template
  TEMPLATE_ID_REMINDER: 'template_reminder', // Event reminder template
  PUBLIC_KEY: '', // Will be provided by EmailJS after signup
  
  // EmailJS limits
  MONTHLY_LIMIT: 200, // Free plan limit
  DAILY_LIMIT: 10, // For testing
};

// Template variable mappings
export const EMAIL_TEMPLATES = {
  test: {
    subject: 'Test Email from English Australia',
    variables: {
      to_email: '{{recipient}}',
      to_name: '{{recipientName}}',
      from_name: 'English Australia',
      message: 'This is a test email to verify your email configuration is working correctly.',
      timestamp: new Date().toLocaleString(),
    }
  },
  registration: {
    subject: 'Registration Confirmed: {{eventTitle}}',
    variables: {
      to_email: '{{userEmail}}',
      to_name: '{{userName}}',
      event_title: '{{eventTitle}}',
      event_date: '{{eventDate}}',
      event_time: '{{eventTime}}',
      event_location: '{{eventLocation}}',
      registration_id: '{{registrationId}}',
    }
  },
  reminder: {
    subject: 'Event Reminder: {{eventTitle}}',
    variables: {
      to_email: '{{userEmail}}',
      to_name: '{{userName}}',
      event_title: '{{eventTitle}}',
      event_date: '{{eventDate}}',
      event_time: '{{eventTime}}',
      event_location: '{{eventLocation}}',
      reminder_time: '{{reminderTime}}',
      virtual_link: '{{virtualLink}}',
    }
  }
};