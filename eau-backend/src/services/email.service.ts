import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../config/database';
import { logError } from '../utils/logger';

interface SMTPSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  reply_to_name?: string;
  enabled: boolean;
  test_mode?: boolean;
  test_email?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Get SMTP settings from database (public method for controller)
   * Returns ALL settings, not just enabled ones (for admin UI)
   */
  static async getSMTPSettings(): Promise<SMTPSettings | null> {
    try {
      console.log('Fetching SMTP settings from database...');
      const { data, error } = await supabaseAdmin
        .from('smtp_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching SMTP settings:', error);
        return null;
      }

      console.log('SMTP settings query result:', data);
      
      // Return the settings directly
      console.log('Returning SMTP settings:', data ? 'Found' : 'Not found');
      return data;
    } catch (error) {
      console.error('Failed to get SMTP settings:', error);
      return null;
    }
  }

  /**
   * Get enabled SMTP settings for sending emails
   * This is the internal method used when actually sending emails
   */
  private static async getEnabledSMTPSettings(): Promise<SMTPSettings | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('smtp_settings')
        .select('*')
        .eq('enabled', true)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching enabled SMTP settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get enabled SMTP settings:', error);
      return null;
    }
  }

  /**
   * Create or update the email transporter with current settings
   */
  private static async getTransporter(): Promise<nodemailer.Transporter | null> {
    try {
      const settings = await this.getEnabledSMTPSettings();
      
      if (!settings || !settings.enabled) {
        console.warn('SMTP settings not found or disabled');
        return null;
      }

      // Create new transporter with current settings
      // For port 587, use STARTTLS (secure: false with requireTLS: true)
      // For port 465, use SSL/TLS (secure: true)
      const isPort587 = settings.smtp_port === 587;
      
      this.transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: isPort587 ? false : settings.smtp_secure, // false for 587 (STARTTLS)
        requireTLS: isPort587 ? true : false, // require STARTTLS for 587
        auth: {
          user: settings.smtp_username,
          pass: settings.smtp_password,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      // Verify transporter configuration
      try {
        await this.transporter.verify();
        console.info('SMTP transporter verified successfully');
      } catch (verifyError) {
        console.error('SMTP verification failed:', verifyError);
        // Continue anyway, as some servers don't support verify
      }

      return this.transporter;
    } catch (error) {
      console.error('Failed to create email transporter:', error);
      return null;
    }
  }

  /**
   * Send an email using the configured SMTP settings
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      // Get fresh settings for each email
      const settings = await this.getEnabledSMTPSettings();
      
      if (!settings || !settings.enabled) {
        return {
          success: false,
          message: 'SMTP is not configured or disabled. Please configure SMTP settings first.'
        };
      }

      const transporter = await this.getTransporter();
      
      if (!transporter) {
        return {
          success: false,
          message: 'Failed to create email transporter'
        };
      }

      // Check if test mode is enabled and redirect to test email
      const finalRecipient = settings.test_mode && settings.test_email 
        ? settings.test_email 
        : options.to;

      // Add test mode notice to subject if in test mode
      const finalSubject = settings.test_mode && settings.test_email
        ? `[TEST MODE] ${options.subject} (Original to: ${options.to})`
        : options.subject;

      // Prepare email options
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.from || `"${settings.from_name}" <${settings.from_email}>`,
        to: finalRecipient,
        subject: finalSubject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      // Add reply-to if configured
      if (settings.reply_to_email) {
        mailOptions.replyTo = settings.reply_to_name 
          ? `"${settings.reply_to_name}" <${settings.reply_to_email}>`
          : settings.reply_to_email;
      }

      // Send the email
      const info = await transporter.sendMail(mailOptions);
      
      console.info(`Email sent successfully to ${options.to}`, info.messageId);
      
      // Log to email_logs table
      await this.logEmail({
        to_email: options.to,
        subject: options.subject,
        status: 'sent',
        message_id: info.messageId,
      });

      return {
        success: true,
        message: `Email sent successfully to ${options.to}`,
        messageId: info.messageId
      };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      
      // Log failed email
      await this.logEmail({
        to_email: options.to,
        subject: options.subject,
        status: 'failed',
        error_message: error.message
      });

      return {
        success: false,
        message: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Send a test email to verify SMTP configuration
   */
  static async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">English Australia</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Test Email Successful! ✅</h2>
          <p style="color: #4a5568; line-height: 1.6;">
            This is a test email from the English Australia Members Portal.
          </p>
          <p style="color: #4a5568; line-height: 1.6;">
            If you're receiving this email, it means your SMTP configuration is working correctly.
          </p>
          <div style="background: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Configuration Details:</h3>
            <ul style="color: #4a5568; line-height: 1.8;">
              <li>Email sent via: Backend Node.js Service</li>
              <li>Time: ${new Date().toLocaleString()}</li>
              <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
            </ul>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #718096; font-size: 12px; text-align: center;">
            This is an automated test email. Please do not reply.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Test Email - English Australia Portal',
      html: htmlContent
    });
  }

  /**
   * Test SMTP connection without sending an email
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = await this.getTransporter();
      
      if (!transporter) {
        return {
          success: false,
          message: 'Failed to create email transporter'
        };
      }

      await transporter.verify();
      
      return {
        success: true,
        message: 'SMTP connection successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'SMTP connection failed'
      };
    }
  }

  /**
   * Log email activity to database
   */
  private static async logEmail(data: {
    to_email: string;
    subject: string;
    status: 'sent' | 'failed';
    message_id?: string;
    error_message?: string;
  }): Promise<void> {
    try {
      await supabaseAdmin
        .from('email_logs')
        .insert({
          to_email: data.to_email,
          subject: data.subject,
          status: data.status,
          message_id: data.message_id,
          error_message: data.error_message,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log email:', error);
      // Don't throw - logging failure shouldn't stop email sending
    }
  }

  /**
   * Send event registration confirmation
   */
  static async sendEventRegistrationConfirmation(data: {
    to: string;
    memberName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
  }): Promise<{ success: boolean; message: string }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">English Australia</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Registration Confirmed! 🎉</h2>
          <p style="color: #4a5568; line-height: 1.6;">
            Dear ${data.memberName},
          </p>
          <p style="color: #4a5568; line-height: 1.6;">
            Your registration for the following event has been confirmed:
          </p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">${data.eventTitle}</h3>
            <p style="color: #4a5568; margin: 10px 0;">
              <strong>Date:</strong> ${data.eventDate}<br>
              <strong>Location:</strong> ${data.eventLocation}
            </p>
          </div>
          <p style="color: #4a5568; line-height: 1.6;">
            We look forward to seeing you at the event!
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #718096; font-size: 12px; text-align: center;">
            If you need to cancel your registration, please log in to your member portal.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `Registration Confirmed: ${data.eventTitle}`,
      html: htmlContent
    });
  }

  /**
   * Send CPD points notification
   */
  static async sendCPDPointsNotification(data: {
    to: string;
    memberName: string;
    activityTitle: string;
    points: number;
    status: 'approved' | 'rejected';
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    const statusColor = data.status === 'approved' ? '#48bb78' : '#f56565';
    const statusEmoji = data.status === 'approved' ? '✅' : '❌';
    const statusText = data.status === 'approved' ? 'Approved' : 'Rejected';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">English Australia</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">CPD Activity ${statusText} ${statusEmoji}</h2>
          <p style="color: #4a5568; line-height: 1.6;">
            Dear ${data.memberName},
          </p>
          <p style="color: #4a5568; line-height: 1.6;">
            Your CPD activity has been ${data.status}:
          </p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <h3 style="color: #2c3e50; margin-top: 0;">${data.activityTitle}</h3>
            <p style="color: #4a5568; margin: 10px 0;">
              <strong>Points:</strong> ${data.points}<br>
              <strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
              ${data.reason ? `<br><strong>Reason:</strong> ${data.reason}` : ''}
            </p>
          </div>
          ${data.status === 'approved' ? `
            <p style="color: #4a5568; line-height: 1.6;">
              Congratulations! Your CPD points have been added to your total.
            </p>
          ` : `
            <p style="color: #4a5568; line-height: 1.6;">
              If you have any questions about this decision, please contact support.
            </p>
          `}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #718096; font-size: 12px; text-align: center;">
            Log in to your member portal to view all your CPD activities.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `CPD Activity ${statusText}: ${data.activityTitle}`,
      html: htmlContent
    });
  }

  /**
   * Save SMTP settings to database
   */
  static async saveSMTPSettings(settings: Partial<SMTPSettings>): Promise<{ success: boolean; message: string }> {
    try {
      // Check if settings already exist
      const { data: existingSettings } = await supabaseAdmin
        .from('smtp_settings')
        .select('id')
        .limit(1);

      let result;
      if (existingSettings && existingSettings.length > 0) {
        // Update existing settings
        result = await supabaseAdmin
          .from('smtp_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings[0].id);
      } else {
        // Insert new settings
        result = await supabaseAdmin
          .from('smtp_settings')
          .insert({
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        throw result.error;
      }

      // Clear transporter to force refresh with new settings
      this.transporter = null;

      return {
        success: true,
        message: 'SMTP settings saved successfully'
      };
    } catch (error: any) {
      console.error('Failed to save SMTP settings:', error);
      return {
        success: false,
        message: error.message || 'Failed to save SMTP settings'
      };
    }
  }
}