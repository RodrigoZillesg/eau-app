import React, { useState, useEffect } from 'react';
import { Info, Mail, Key, Settings, Send, Save, ExternalLink, CheckCircle } from 'lucide-react';
import { EmailService } from '../../../services/emailService';
import { showNotification } from '../../../utils/notifications';

export default function EmailJSConfigPage() {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [settings, setSettings] = useState({
    serviceId: '',
    templateIdTest: '',
    templateIdRegistration: '',
    templateIdReminder: '',
    publicKey: '',
  });

  useEffect(() => {
    // Load saved settings from localStorage
    setSettings({
      serviceId: localStorage.getItem('emailjs_service_id') || '',
      templateIdTest: localStorage.getItem('emailjs_template_test') || '',
      templateIdRegistration: localStorage.getItem('emailjs_template_registration') || '',
      templateIdReminder: localStorage.getItem('emailjs_template_reminder') || '',
      publicKey: localStorage.getItem('emailjs_public_key') || '',
    });
  }, []);

  const handleSave = () => {
    setLoading(true);
    
    // Save to localStorage
    localStorage.setItem('emailjs_service_id', settings.serviceId);
    localStorage.setItem('emailjs_template_test', settings.templateIdTest);
    localStorage.setItem('emailjs_template_registration', settings.templateIdRegistration);
    localStorage.setItem('emailjs_template_reminder', settings.templateIdReminder);
    localStorage.setItem('emailjs_public_key', settings.publicKey);
    
    // Initialize EmailJS
    EmailService.initEmailJS(settings.publicKey);
    
    showNotification('success', 'EmailJS settings saved successfully!');
    setLoading(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      showNotification('error', 'Please enter a test email address');
      return;
    }

    if (!settings.serviceId || !settings.templateIdTest || !settings.publicKey) {
      showNotification('error', 'Please configure EmailJS settings first');
      return;
    }

    setSendingTest(true);
    
    try {
      const result = await EmailService.sendTestEmail(testEmail);
      
      if (result.success) {
        showNotification('success', result.message);
      } else {
        showNotification('error', result.message);
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">EmailJS Configuration</h1>
        <p className="text-gray-600 mt-2">
          Configure EmailJS to send emails directly from the browser without a backend server
        </p>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-3 flex-1">
            <h3 className="font-semibold text-blue-900">Quick Setup Guide</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>
                Create a free account at{' '}
                <a 
                  href="https://www.emailjs.com/docs/get-started/sign-up/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  EmailJS.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Add an email service (Gmail, Outlook, or SMTP) in your{' '}
                <a 
                  href="https://dashboard.emailjs.com/admin" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  EmailJS Dashboard
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Create email templates for: Test Email, Event Registration, and Event Reminder</li>
              <li>Copy your Service ID, Template IDs, and Public Key from the dashboard</li>
              <li>Paste them in the form below and save</li>
              <li>Send a test email to verify everything works!</li>
            </ol>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
              <p className="text-xs text-yellow-800">
                <strong>Free Plan Limits:</strong> 200 emails/month, 2 templates. 
                Perfect for testing and small organizations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          EmailJS Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service ID */}
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-2">
              Service ID *
            </label>
            <input
              type="text"
              id="serviceId"
              value={settings.serviceId}
              onChange={(e) => setSettings({ ...settings, serviceId: e.target.value })}
              placeholder="e.g., service_abc123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in: Email Services → Your Service → Service ID
            </p>
          </div>

          {/* Public Key */}
          <div>
            <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-2">
              Public Key *
            </label>
            <input
              type="text"
              id="publicKey"
              value={settings.publicKey}
              onChange={(e) => setSettings({ ...settings, publicKey: e.target.value })}
              placeholder="e.g., AbCdEfGhIjKlMnOpQr"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in: Account → API Keys → Public Key
            </p>
          </div>

          {/* Test Template ID */}
          <div>
            <label htmlFor="templateIdTest" className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Template ID *
            </label>
            <input
              type="text"
              id="templateIdTest"
              value={settings.templateIdTest}
              onChange={(e) => setSettings({ ...settings, templateIdTest: e.target.value })}
              placeholder="e.g., template_test123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Template for sending test emails
            </p>
          </div>

          {/* Registration Template ID */}
          <div>
            <label htmlFor="templateIdRegistration" className="block text-sm font-medium text-gray-700 mb-2">
              Registration Template ID
            </label>
            <input
              type="text"
              id="templateIdRegistration"
              value={settings.templateIdRegistration}
              onChange={(e) => setSettings({ ...settings, templateIdRegistration: e.target.value })}
              placeholder="e.g., template_reg456"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Template for event registration confirmations
            </p>
          </div>

          {/* Reminder Template ID */}
          <div>
            <label htmlFor="templateIdReminder" className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Template ID
            </label>
            <input
              type="text"
              id="templateIdReminder"
              value={settings.templateIdReminder}
              onChange={(e) => setSettings({ ...settings, templateIdReminder: e.target.value })}
              placeholder="e.g., template_rem789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Template for event reminders
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading || !settings.serviceId || !settings.publicKey || !settings.templateIdTest}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      {/* Test Email Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Test Email Sending
        </h2>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="testEmailAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address
            </label>
            <input
              type="email"
              id="testEmailAddress"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleTestEmail}
            disabled={sendingTest || !testEmail || !settings.serviceId || !settings.publicKey}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sendingTest ? 'Sending...' : 'Send Test'}
          </button>
        </div>

        {settings.serviceId && settings.publicKey && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              EmailJS is configured and ready to send emails
            </div>
          </div>
        )}
      </div>

      {/* Template Variables Reference */}
      <div className="bg-gray-50 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Template Variables Reference
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Use these variables in your EmailJS templates:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Common Variables</h4>
            <ul className="space-y-1 text-gray-600 font-mono text-xs">
              <li>{'{{to_email}}'}</li>
              <li>{'{{to_name}}'}</li>
              <li>{'{{from_name}}'}</li>
              <li>{'{{timestamp}}'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Event Variables</h4>
            <ul className="space-y-1 text-gray-600 font-mono text-xs">
              <li>{'{{event_title}}'}</li>
              <li>{'{{event_date}}'}</li>
              <li>{'{{event_time}}'}</li>
              <li>{'{{event_location}}'}</li>
              <li>{'{{virtual_link}}'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">User Variables</h4>
            <ul className="space-y-1 text-gray-600 font-mono text-xs">
              <li>{'{{user_name}}'}</li>
              <li>{'{{user_email}}'}</li>
              <li>{'{{registration_id}}'}</li>
              <li>{'{{reminder_time}}'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help Links */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Need help? Check the{' '}
        <a 
          href="https://www.emailjs.com/docs/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          EmailJS Documentation
        </a>
        {' or '}
        <a 
          href="https://dashboard.emailjs.com/admin/templates" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Manage Your Templates
        </a>
      </div>
    </div>
  );
}