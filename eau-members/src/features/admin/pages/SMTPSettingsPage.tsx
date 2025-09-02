import { useState, useEffect } from 'react';
import { Save, Send, AlertCircle, CheckCircle, Eye, EyeOff, TestTube, Settings } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { EmailService, type SMTPSettings } from '../../../services/emailService';
import { showNotification } from '../../../lib/notifications';
import { useAuthStore } from '../../../stores/authStore';

export function SMTPSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);
  
  const [settings, setSettings] = useState<SMTPSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: true,
    smtp_auth_type: 'LOGIN',
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'English Australia',
    reply_to_email: '',
    reply_to_name: '',
    enabled: false,
    test_mode: false,
    test_email: '',
    daily_limit: 1000,
    hourly_limit: 100,
    emails_sent_today: 0,
    emails_sent_this_hour: 0
  });

  // Common SMTP presets
  const smtpPresets = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: true },
    { name: 'Outlook/Office365', host: 'smtp.office365.com', port: 587, secure: true },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: true },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: true },
    { name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, secure: true },
    { name: 'Custom', host: '', port: 587, secure: true }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Check if database is available
      const dbAvailable = await EmailService.checkDatabaseAvailable();
      setUsingLocalStorage(!dbAvailable);
      
      // Load settings
      const result = await EmailService.getSMTPSettings();
      if (result.data) {
        setSettings(result.data);
      }
      setUsingLocalStorage(result.isLocal);
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
      showNotification('error', 'Failed to load SMTP settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: typeof smtpPresets[0]) => {
    setSettings({
      ...settings,
      smtp_host: preset.host,
      smtp_port: preset.port,
      smtp_secure: preset.secure
    });
  };

  const handleSave = async () => {
    // Validation
    if (!settings.smtp_host || !settings.smtp_username || !settings.from_email) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    if (!settings.smtp_password && !settings.id) {
      showNotification('error', 'Password is required for new SMTP configuration');
      return;
    }

    try {
      setLoading(true);
      const success = await EmailService.saveSMTPSettings(settings);
      
      if (success) {
        showNotification('success', 'SMTP settings saved successfully');
        loadSettings(); // Reload to get the updated settings with ID
      } else {
        showNotification('error', 'Failed to save SMTP settings');
      }
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      showNotification('error', 'Failed to save SMTP settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const result = await EmailService.testSMTPConnection(settings);
      
      if (result.success) {
        showNotification('success', result.message);
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      showNotification('error', 'Failed to test SMTP connection');
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showNotification('error', 'Please enter a test email address');
      return;
    }

    try {
      setTesting(true);
      const result = await EmailService.sendTestEmail(testEmail);
      
      if (result.success) {
        showNotification('success', result.message);
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      showNotification('error', 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SMTP Settings</h1>
        <p className="text-gray-600">Configure email sending settings for the system</p>
      </div>

      {/* Email Configuration Options */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-2 text-blue-900">Choose Your Email Setup Method:</p>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="font-semibold text-green-900 mb-1">✅ Option 1: EmailJS (Recommended - Works Immediately!)</p>
                  <p className="text-green-800 mb-2">
                    Send emails directly from the browser. No server setup needed!
                  </p>
                  <a 
                    href="/admin/emailjs-config" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configure EmailJS Now
                  </a>
                </div>
                <div className="p-3 bg-white border border-blue-200 rounded">
                  <p className="font-semibold text-blue-900 mb-1">Option 2: SMTP + Edge Function (Advanced)</p>
                  <p className="text-blue-800">
                    Configure SMTP settings below, then deploy an Edge Function for server-side sending.
                  </p>
                </div>
              </div>
              {usingLocalStorage && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> Settings are being saved locally in your browser.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Setup */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Setup</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {smtpPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset)}
                className={settings.smtp_host === preset.host ? 'border-primary-500 bg-primary-50' : ''}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* SMTP Configuration */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SMTP Server Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp_host">SMTP Host *</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="smtp_port">SMTP Port *</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                placeholder="587"
                required
              />
            </div>

            <div>
              <Label htmlFor="smtp_username">Username *</Label>
              <Input
                id="smtp_username"
                value={settings.smtp_username}
                onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                placeholder="your-email@gmail.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="smtp_password">Password *</Label>
              <div className="relative">
                <Input
                  id="smtp_password"
                  type={showPassword ? 'text' : 'password'}
                  value={settings.smtp_password || ''}
                  onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                  placeholder={settings.id ? '(unchanged)' : 'Enter password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For Gmail, use an App Password instead of your regular password
              </p>
            </div>

            <div>
              <Label htmlFor="from_email">From Email *</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                placeholder="noreply@englishaustralia.com.au"
                required
              />
            </div>

            <div>
              <Label htmlFor="from_name">From Name *</Label>
              <Input
                id="from_name"
                value={settings.from_name}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                placeholder="English Australia"
                required
              />
            </div>

            <div>
              <Label htmlFor="reply_to_email">Reply-To Email</Label>
              <Input
                id="reply_to_email"
                type="email"
                value={settings.reply_to_email || ''}
                onChange={(e) => setSettings({ ...settings, reply_to_email: e.target.value })}
                placeholder="info@englishaustralia.com.au"
              />
            </div>

            <div>
              <Label htmlFor="reply_to_name">Reply-To Name</Label>
              <Input
                id="reply_to_name"
                value={settings.reply_to_name || ''}
                onChange={(e) => setSettings({ ...settings, reply_to_name: e.target.value })}
                placeholder="English Australia Support"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.smtp_secure}
                onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Use TLS/SSL encryption</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">Enable email sending</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.test_mode}
                onChange={(e) => setSettings({ ...settings, test_mode: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Test mode (all emails go to test address)</span>
            </label>

            {settings.test_mode && (
              <div className="ml-6">
                <Label htmlFor="test_email_address">Test Email Address</Label>
                <Input
                  id="test_email_address"
                  type="email"
                  value={settings.test_email || ''}
                  onChange={(e) => setSettings({ ...settings, test_email: e.target.value })}
                  placeholder="test@example.com"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Rate Limits */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="daily_limit">Daily Email Limit</Label>
              <Input
                id="daily_limit"
                type="number"
                value={settings.daily_limit}
                onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Sent today: {settings.emails_sent_today}
              </p>
            </div>

            <div>
              <Label htmlFor="hourly_limit">Hourly Email Limit</Label>
              <Input
                id="hourly_limit"
                type="number"
                value={settings.hourly_limit}
                onChange={(e) => setSettings({ ...settings, hourly_limit: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Sent this hour: {settings.emails_sent_this_hour}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Test Email */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !settings.smtp_host || !settings.smtp_username}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Test if the SMTP server can be reached with current settings
              </p>
            </div>

            <div>
              <Label htmlFor="test_email_to">Send Test Email To</Label>
              <div className="flex gap-2">
                <Input
                  id="test_email_to"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1"
                />
                <Button
                  onClick={handleSendTestEmail}
                  disabled={testing || !settings.enabled || !testEmail}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testing ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Send a test email to verify everything is working
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={loadSettings}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Gmail Configuration Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enable 2-factor authentication in your Google account</li>
                <li>Generate an App Password: Google Account → Security → 2-Step Verification → App passwords</li>
                <li>Use the App Password instead of your regular Gmail password</li>
                <li>SMTP Host: smtp.gmail.com, Port: 587, Enable TLS</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}