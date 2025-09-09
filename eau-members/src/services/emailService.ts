import { supabase } from '../lib/supabase/client';
import { getApiUrl } from '../config/api';

export interface SMTPSettings {
  id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_auth_type: string;
  smtp_username: string;
  smtp_password?: string;
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  reply_to_name?: string;
  enabled: boolean;
  test_mode: boolean;
  test_email?: string;
  daily_limit: number;
  hourly_limit: number;
  emails_sent_today: number;
  emails_sent_this_hour: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  category: 'event' | 'cpd' | 'member' | 'system';
  variables: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailJob {
  id: string;
  to_email: string;
  to_name?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  template_id?: string;
  variables?: Record<string, any>;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  max_attempts: number;
  scheduled_for?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export class EmailService {
  /**
   * Check if SMTP table exists in database
   */
  static async checkDatabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('smtp_settings')
        .select('id')
        .limit(1);
      
      if (!error) {
        return true;
      }
      
      const errorMessage = error.message?.toLowerCase() || '';
      const isMissingTable = errorMessage.includes('relation') || 
                             errorMessage.includes('does not exist') ||
                             errorMessage.includes('not found');
      
      return !isMissingTable;
    } catch {
      return false;
    }
  }

  /**
   * Get SMTP settings
   */
  static async getSMTPSettings(): Promise<{ data: SMTPSettings | null; isLocal: boolean }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          data: null,
          isLocal: false
        };
      }

      const response = await fetch(getApiUrl('/email/settings'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          data: result.data,
          isLocal: result.isLocal || false
        };
      }
    } catch (error) {
      console.error('Error getting SMTP settings:', error);
    }

    return { data: null, isLocal: false };
  }

  /**
   * Save SMTP settings
   */
  static async saveSMTPSettings(settings: Partial<SMTPSettings>): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'You must be logged in to save SMTP settings'
        };
      }

      const response = await fetch(getApiUrl('/email/settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message || (result.success ? 'SMTP settings saved successfully' : 'Failed to save SMTP settings')
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to save SMTP settings'
      };
    }
  }

  /**
   * Test SMTP connection using backend
   */
  static async testSMTPConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'You must be logged in to test SMTP connection'
        };
      }

      const response = await fetch(getApiUrl('/email/test-connection'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to test SMTP connection'
      };
    }
  }

  /**
   * Send test email via backend
   */
  static async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'You must be logged in to send test emails'
        };
      }

      const response = await fetch(getApiUrl('/email/test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ to })
      });

      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message || (data.success ? `Test email sent to ${to}` : 'Failed to send test email')
      };
    } catch (error: any) {
      console.error('Error sending test email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send test email'
      };
    }
  }

  /**
   * Send generic email via backend
   */
  static async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'You must be logged in to send emails'
        };
      }

      const response = await fetch(getApiUrl('/email/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Send event registration confirmation
   */
  static async sendEventRegistrationConfirmation(params: {
    to: string;
    memberName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'You must be logged in to send emails'
        };
      }

      const response = await fetch(getApiUrl('/email/event-registration'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error: any) {
      console.error('Error sending event registration email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send event registration email'
      };
    }
  }

  /**
   * Send CPD notification
   */
  static async sendCPDNotification(params: {
    to: string;
    memberName: string;
    activityTitle: string;
    points: number;
    status: 'approved' | 'rejected';
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'You must be logged in to send emails'
        };
      }

      const response = await fetch(getApiUrl('/email/cpd-notification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error: any) {
      console.error('Error sending CPD notification:', error);
      return {
        success: false,
        message: error.message || 'Failed to send CPD notification'
      };
    }
  }

  /**
   * Get email templates
   */
  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  /**
   * Save email template
   */
  static async saveEmailTemplate(template: Partial<EmailTemplate>): Promise<{ success: boolean; message: string }> {
    try {
      if (template.id) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            ...template,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            ...template,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      return {
        success: true,
        message: 'Email template saved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to save email template'
      };
    }
  }

  /**
   * Delete email template
   */
  static async deleteEmailTemplate(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'Email template deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete email template'
      };
    }
  }

  /**
   * Get email logs
   */
  static async getEmailLogs(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }
  }
}