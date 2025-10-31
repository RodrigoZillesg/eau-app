import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { logError } from '../utils/logger';
import { supabaseAdmin } from '../config/database';

export class EmailController {
  /**
   * Send a test email
   */
  static async sendTestEmail(req: Request, res: Response) {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required'
        });
      }

      const result = await EmailService.sendTestEmail(to);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in sendTestEmail:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send test email'
      });
    }
  }

  /**
   * Test SMTP connection
   */
  static async testConnection(req: Request, res: Response) {
    try {
      const result = await EmailService.testConnection();
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in testConnection:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to test SMTP connection'
      });
    }
  }

  /**
   * Send a generic email
   */
  static async sendEmail(req: Request, res: Response) {
    try {
      const { to, subject, html, text } = req.body;

      if (!to || !subject || (!html && !text)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: to, subject, and either html or text'
        });
      }

      const result = await EmailService.sendEmail({
        to,
        subject,
        html: html || `<p>${text}</p>`,
        text
      });
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in sendEmail:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send email'
      });
    }
  }

  /**
   * Send event registration confirmation
   */
  static async sendEventRegistration(req: Request, res: Response) {
    try {
      const { to, memberName, eventTitle, eventDate, eventLocation } = req.body;

      if (!to || !memberName || !eventTitle || !eventDate || !eventLocation) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const result = await EmailService.sendEventRegistrationConfirmation({
        to,
        memberName,
        eventTitle,
        eventDate,
        eventLocation
      });
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in sendEventRegistration:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send event registration email'
      });
    }
  }

  /**
   * Send CPD points notification
   */
  static async sendCPDNotification(req: Request, res: Response) {
    try {
      const { to, memberName, activityTitle, points, status, reason } = req.body;

      if (!to || !memberName || !activityTitle || points === undefined || !status) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const result = await EmailService.sendCPDPointsNotification({
        to,
        memberName,
        activityTitle,
        points,
        status,
        reason
      });
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in sendCPDNotification:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send CPD notification email'
      });
    }
  }

  /**
   * Get SMTP settings
   */
  static async getSMTPSettings(req: Request, res: Response) {
    try {
      const result = await EmailService.getSMTPSettings();
      
      return res.status(200).json({
        success: true,
        data: result,
        isLocal: false
      });
    } catch (error: any) {
      console.error('Error in getSMTPSettings:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get SMTP settings'
      });
    }
  }

  /**
   * Save SMTP settings
   */
  static async saveSMTPSettings(req: Request, res: Response) {
    try {
      const settings = req.body;

      if (!settings.smtp_host || !settings.smtp_username || !settings.from_email) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: smtp_host, smtp_username, from_email'
        });
      }

      const result = await EmailService.saveSMTPSettings(settings);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      console.error('Error in saveSMTPSettings:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to save SMTP settings'
      });
    }
  }

  /**
   * Create event reminders
   */
  static async createReminders(req: Request, res: Response) {
    try {
      const { registrationId, eventId, userId, event } = req.body;

      if (!registrationId || !eventId || !userId || !event) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: registrationId, eventId, userId, event'
        });
      }

      console.log(`📅 Creating reminders for event: ${event.title}`);

      const eventDate = new Date(event.start_date);
      const now = new Date();

      // Calculate reminder times
      const reminders = [];

      // 7 days before
      const sevenDaysBefore = new Date(eventDate);
      sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
      if (sevenDaysBefore > now) {
        reminders.push({
          registration_id: registrationId,
          event_id: eventId,
          user_id: userId,
          reminder_type: '7_days',
          scheduled_date: sevenDaysBefore.toISOString(),
          is_sent: false
        });
      }

      // 3 days before
      const threeDaysBefore = new Date(eventDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
      if (threeDaysBefore > now) {
        reminders.push({
          registration_id: registrationId,
          event_id: eventId,
          user_id: userId,
          reminder_type: '3_days',
          scheduled_date: threeDaysBefore.toISOString(),
          is_sent: false
        });
      }

      // 1 day before
      const oneDayBefore = new Date(eventDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      if (oneDayBefore > now) {
        reminders.push({
          registration_id: registrationId,
          event_id: eventId,
          user_id: userId,
          reminder_type: '1_day',
          scheduled_date: oneDayBefore.toISOString(),
          is_sent: false
        });
      }

      // 30 minutes before
      const thirtyMinBefore = new Date(eventDate);
      thirtyMinBefore.setMinutes(thirtyMinBefore.getMinutes() - 30);
      if (thirtyMinBefore > now) {
        reminders.push({
          registration_id: registrationId,
          event_id: eventId,
          user_id: userId,
          reminder_type: '30_min',
          scheduled_date: thirtyMinBefore.toISOString(),
          is_sent: false
        });
      }

      // Live notification (at event start time)
      if (eventDate > now) {
        reminders.push({
          registration_id: registrationId,
          event_id: eventId,
          user_id: userId,
          reminder_type: 'live',
          scheduled_date: eventDate.toISOString(),
          is_sent: false
        });
      }

      console.log(`📧 Inserting ${reminders.length} reminders`);

      // Insert reminders using admin client (bypasses RLS)
      if (reminders.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('event_reminders')
          .insert(reminders)
          .select();

        if (error) {
          console.error('Error inserting reminders:', error);
          return res.status(500).json({
            success: false,
            message: `Failed to create reminders: ${error.message}`
          });
        }

        console.log(`✅ Created ${reminders.length} reminders for event ${event.title}`);
        return res.status(200).json({
          success: true,
          message: `Created ${reminders.length} reminders`,
          reminders: data
        });
      } else {
        console.log('⚠️ Event is in the past or too close, no reminders created');
        return res.status(200).json({
          success: true,
          message: 'No reminders created (event is in the past or too close)',
          reminders: []
        });
      }
    } catch (error: any) {
      console.error('Error in createReminders:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create reminders'
      });
    }
  }
}