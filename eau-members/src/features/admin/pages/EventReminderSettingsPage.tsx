import { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  Mail,
  AlertCircle,
  CheckCircle,
  Settings,
  Bell,
  Send
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Switch } from '../../../components/ui/Switch';
import { showNotification } from '../../../lib/notifications';
import { supabase } from '../../../lib/supabase/client';

interface ReminderConfig {
  id: string;
  name: string;
  description: string;
  timing_type: 'before' | 'after' | 'at_start';
  timing_value: number;
  timing_unit: 'minutes' | 'hours' | 'days';
  email_subject: string;
  email_template: string;
  is_active: boolean;
  send_to_all: boolean;
  order_index: number;
}

const DEFAULT_REMINDERS: Omit<ReminderConfig, 'id'>[] = [
  {
    name: 'Registration Confirmation',
    description: 'Sent immediately after registration',
    timing_type: 'after',
    timing_value: 0,
    timing_unit: 'minutes',
    email_subject: 'Registration Confirmed: {{event_title}}',
    email_template: 'registration_confirmation',
    is_active: true,
    send_to_all: false,
    order_index: 0
  },
  {
    name: '7 Days Before',
    description: 'One week reminder',
    timing_type: 'before',
    timing_value: 7,
    timing_unit: 'days',
    email_subject: 'Event in 1 Week: {{event_title}}',
    email_template: 'event_reminder_week',
    is_active: true,
    send_to_all: true,
    order_index: 1
  },
  {
    name: '3 Days Before',
    description: 'Mid-week reminder',
    timing_type: 'before',
    timing_value: 3,
    timing_unit: 'days',
    email_subject: 'Event in 3 Days: {{event_title}}',
    email_template: 'event_reminder_3days',
    is_active: true,
    send_to_all: true,
    order_index: 2
  },
  {
    name: '1 Day Before',
    description: 'Day before reminder',
    timing_type: 'before',
    timing_value: 1,
    timing_unit: 'days',
    email_subject: 'Event Tomorrow: {{event_title}}',
    email_template: 'event_reminder_tomorrow',
    is_active: true,
    send_to_all: true,
    order_index: 3
  },
  {
    name: '30 Minutes Before',
    description: 'Final reminder',
    timing_type: 'before',
    timing_value: 30,
    timing_unit: 'minutes',
    email_subject: 'Starting Soon: {{event_title}}',
    email_template: 'event_starting_soon',
    is_active: true,
    send_to_all: true,
    order_index: 4
  },
  {
    name: 'Event Live',
    description: 'When event goes live',
    timing_type: 'at_start',
    timing_value: 0,
    timing_unit: 'minutes',
    email_subject: '🔴 LIVE NOW: {{event_title}}',
    email_template: 'event_live',
    is_active: true,
    send_to_all: true,
    order_index: 5
  }
];

export function EventReminderSettingsPage() {
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Form state for new/edit reminder
  const [formData, setFormData] = useState<Partial<ReminderConfig>>({
    name: '',
    description: '',
    timing_type: 'before',
    timing_value: 1,
    timing_unit: 'days',
    email_subject: '',
    email_template: '',
    is_active: true,
    send_to_all: true
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      
      // Try to load from database
      const { data, error } = await supabase
        .from('event_reminder_configs')
        .select('*')
        .order('order_index');

      if (error) {
        // Table might not exist, use defaults
        console.log('Using default reminders configuration');
        const defaultWithIds = DEFAULT_REMINDERS.map((r, index) => ({
          ...r,
          id: `default-${index}`
        }));
        setReminders(defaultWithIds);
      } else if (data && data.length > 0) {
        setReminders(data);
      } else {
        // No configs saved, use defaults
        const defaultWithIds = DEFAULT_REMINDERS.map((r, index) => ({
          ...r,
          id: `default-${index}`
        }));
        setReminders(defaultWithIds);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      // Use defaults on error
      const defaultWithIds = DEFAULT_REMINDERS.map((r, index) => ({
        ...r,
        id: `default-${index}`
      }));
      setReminders(defaultWithIds);
    } finally {
      setLoading(false);
    }
  };

  const saveReminders = async () => {
    try {
      setSaving(true);

      // Save to localStorage as backup
      localStorage.setItem('event_reminder_configs', JSON.stringify(reminders));

      // Try to save to database
      try {
        // First, delete existing configs
        await supabase
          .from('event_reminder_configs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        // Insert new configs
        const { error } = await supabase
          .from('event_reminder_configs')
          .insert(reminders.map(r => ({
            ...r,
            id: r.id.startsWith('default-') ? undefined : r.id // Let DB generate ID for defaults
          })));

        if (error) throw error;

        showNotification('success', 'Reminder settings saved successfully!');
      } catch (dbError) {
        console.log('Saved to localStorage only:', dbError);
        showNotification('success', 'Settings saved locally');
      }
    } catch (error) {
      console.error('Error saving reminders:', error);
      showNotification('error', 'Failed to save reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReminder = () => {
    setFormData({
      name: '',
      description: '',
      timing_type: 'before',
      timing_value: 1,
      timing_unit: 'days',
      email_subject: '',
      email_template: '',
      is_active: true,
      send_to_all: true
    });
    setEditingId(null);
    setShowAddForm(true);
  };

  const handleEditReminder = (reminder: ReminderConfig) => {
    setFormData(reminder);
    setEditingId(reminder.id);
    setShowAddForm(true);
    
    // Scroll to form after a brief delay to ensure it's rendered
    setTimeout(() => {
      formRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }, 100);
  };

  const handleSaveReminder = () => {
    if (!formData.name || !formData.email_subject) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    if (editingId) {
      // Update existing
      setReminders(reminders.map(r => 
        r.id === editingId 
          ? { ...r, ...formData } as ReminderConfig
          : r
      ));
    } else {
      // Add new
      const newReminder: ReminderConfig = {
        id: `custom-${Date.now()}`,
        name: formData.name!,
        description: formData.description || '',
        timing_type: formData.timing_type as 'before' | 'after' | 'at_start',
        timing_value: formData.timing_value!,
        timing_unit: formData.timing_unit as 'minutes' | 'hours' | 'days',
        email_subject: formData.email_subject!,
        email_template: formData.email_template || formData.name!.toLowerCase().replace(/\s+/g, '_'),
        is_active: formData.is_active!,
        send_to_all: formData.send_to_all!,
        order_index: reminders.length
      };
      setReminders([...reminders, newReminder]);
    }

    setShowAddForm(false);
    setEditingId(null);
  };

  const handleDeleteReminder = (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      setReminders(reminders.filter(r => r.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, is_active: !r.is_active } : r
    ));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newReminders = [...reminders];
    [newReminders[index - 1], newReminders[index]] = [newReminders[index], newReminders[index - 1]];
    newReminders.forEach((r, i) => r.order_index = i);
    setReminders(newReminders);
  };

  const handleMoveDown = (index: number) => {
    if (index === reminders.length - 1) return;
    const newReminders = [...reminders];
    [newReminders[index], newReminders[index + 1]] = [newReminders[index + 1], newReminders[index]];
    newReminders.forEach((r, i) => r.order_index = i);
    setReminders(newReminders);
  };

  const sendTestReminder = async (reminder: ReminderConfig) => {
    if (!testEmail) {
      showNotification('error', 'Please enter a test email address');
      return;
    }

    setSendingTest(reminder.id);
    try {
      // Create test email template
      const testTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🧪 Test Reminder</h1>
            <p style="margin: 12px 0 0 0; opacity: 0.9;">EAU Event Reminder System</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hello <strong>Test User</strong>,</p>
            <p>This is a test of the <strong>${reminder.name}</strong> reminder configuration.</p>
            
            <div style="background: #f8fafc; border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a;">📅 Sample Event Title</h2>
              <div style="font-size: 16px; line-height: 1.8;">
                <div><strong>📆 Date:</strong> August 25, 2025</div>
                <div><strong>🕐 Time:</strong> 10:00 AM</div>
                <div><strong>📍 Location:</strong> Online via Zoom</div>
                <div><strong>⏰ Reminder Type:</strong> ${getTimingDescription(reminder)}</div>
              </div>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 8px 0; color: #856404;">📧 Reminder Details</h3>
              <p style="margin: 0; color: #856404;"><strong>Subject:</strong> ${reminder.email_subject}</p>
              <p style="margin: 8px 0 0 0; color: #856404;"><strong>Template:</strong> ${reminder.email_template}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="http://localhost:5180/events" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Events</a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b;">
            <strong>EAU Members</strong> | Email Reminder Test<br>
            Sent at ${new Date().toLocaleString()}
          </div>
        </div>
      `;

      // Send test email via email server
      const response = await fetch('http://localhost:3001/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: `[TEST] ${reminder.email_subject.replace(/\{\{([^}]+)\}\}/g, 'Sample Event Title')}`,
          html: testTemplate,
          text: `Test reminder: ${reminder.name} - ${getTimingDescription(reminder)}`,
          useStoredConfig: true
        })
      });

      if (response.ok) {
        showNotification('success', `Test reminder "${reminder.name}" sent to ${testEmail}`);
      } else {
        const error = await response.text();
        console.error('Email send error:', error);
        showNotification('error', 'Failed to send test reminder. Check SMTP configuration.');
      }
    } catch (error) {
      console.error('Test reminder error:', error);
      showNotification('error', 'Failed to send test reminder');
    } finally {
      setSendingTest(null);
    }
  };

  const getTimingDescription = (reminder: ReminderConfig) => {
    if (reminder.timing_type === 'at_start') {
      return 'At event start';
    }
    if (reminder.timing_type === 'after') {
      return `${reminder.timing_value} ${reminder.timing_unit} after registration`;
    }
    return `${reminder.timing_value} ${reminder.timing_unit} before event`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary-600" />
          Event Reminder Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure automated email reminders for event registrations
        </p>
      </div>

      {/* Test Email Input */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <Mail className="h-5 w-5 text-gray-500" />
          <div className="flex-1">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="Enter email for testing reminders"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>
      </Card>

      {/* Reminders List */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Configured Reminders</h2>
          <Button onClick={handleAddReminder}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>

        <div className="space-y-4">
          {reminders.map((reminder, index) => (
            <div
              key={reminder.id}
              className={`border rounded-lg p-4 ${
                reminder.is_active ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {reminder.name}
                    </h3>
                    {reminder.is_active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {getTimingDescription(reminder)}
                    </span>
                    <span className="text-gray-500">
                      Subject: {reminder.email_subject}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Move Up/Down */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === reminders.length - 1}
                  >
                    ↓
                  </Button>

                  {/* Toggle Active */}
                  <Switch
                    checked={reminder.is_active}
                    onCheckedChange={() => handleToggleActive(reminder.id)}
                  />

                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditReminder(reminder)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  {testEmail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendTestReminder(reminder)}
                      disabled={sendingTest === reminder.id}
                    >
                      {sendingTest === reminder.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {!reminder.id.startsWith('default-') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {reminders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No reminders configured. Click "Add Reminder" to create one.
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="p-6 mb-6" ref={formRef}>
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Reminder' : 'Add New Reminder'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Reminder Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 2 Hours Before"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <div>
              <Label>Timing</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={formData.timing_value}
                  onChange={(e) => setFormData({ ...formData, timing_value: parseInt(e.target.value) })}
                  className="w-20"
                />
                <select
                  value={formData.timing_unit}
                  onChange={(e) => setFormData({ ...formData, timing_unit: e.target.value as any })}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
                <select
                  value={formData.timing_type}
                  onChange={(e) => setFormData({ ...formData, timing_type: e.target.value as any })}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="before">Before Event</option>
                  <option value="after">After Registration</option>
                  <option value="at_start">At Event Start</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="email_subject">Email Subject *</Label>
              <Input
                id="email_subject"
                value={formData.email_subject}
                onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                placeholder="Use {{event_title}} for dynamic content"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="email_template">Template Name</Label>
              <Input
                id="email_template"
                value={formData.email_template}
                onChange={(e) => setFormData({ ...formData, email_template: e.target.value })}
                placeholder="Template identifier (e.g., reminder_2hours)"
              />
            </div>

            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span>Active</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.send_to_all}
                  onChange={(e) => setFormData({ ...formData, send_to_all: e.target.checked })}
                />
                <span>Send to all registrants</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReminder}>
              {editingId ? 'Update' : 'Add'} Reminder
            </Button>
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={loadReminders}
          disabled={saving}
        >
          Reset to Defaults
        </Button>
        <Button 
          onClick={saveReminders}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-blue-900 font-semibold mb-1">Available Variables</h4>
            <p className="text-blue-800 text-sm mb-2">
              You can use these variables in email subjects and templates:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
              <code>{'{{event_title}}'}</code>
              <code>{'{{event_date}}'}</code>
              <code>{'{{event_time}}'}</code>
              <code>{'{{event_location}}'}</code>
              <code>{'{{user_name}}'}</code>
              <code>{'{{user_email}}'}</code>
              <code>{'{{registration_id}}'}</code>
              <code>{'{{event_link}}'}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}