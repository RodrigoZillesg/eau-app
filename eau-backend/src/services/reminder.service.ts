import { supabaseAdmin } from '../config/database';
import { EmailService } from './email.service';
import { format } from 'date-fns';

interface EventReminder {
  id: string;
  registration_id?: string;
  event_id: string;
  user_id: string;
  reminder_type: string;
  scheduled_date: string;
  sent_date?: string;
  is_sent: boolean;
  email_to?: string;
  email_subject?: string;
  email_body?: string;
  created_at: string;
  event?: any;
  registration?: any;
  user?: any;
}

export class ReminderService {
  /**
   * Process pending reminders
   */
  static async processPendingReminders(): Promise<void> {
    try {
      const now = new Date();
      console.log(`[${now.toISOString()}] Checking for pending reminders...`);

      // Get all pending reminders that should be sent now
      const { data: reminders, error } = await supabaseAdmin
        .from('event_reminders')
        .select('*')
        .eq('is_sent', false)
        .lte('scheduled_date', now.toISOString())
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching pending reminders:', error);
        return;
      }

      if (!reminders || reminders.length === 0) {
        console.log('No pending reminders to process');
        return;
      }

      console.log(`Found ${reminders.length} pending reminders to process`);

      // Process each reminder
      for (const reminder of reminders) {
        await this.processReminder(reminder);
      }
    } catch (error) {
      console.error('Error processing pending reminders:', error);
    }
  }

  /**
   * Process a single reminder
   */
  private static async processReminder(reminder: any): Promise<void> {
    try {
      console.log(`Processing reminder ${reminder.id} of type ${reminder.reminder_type}`);

      // Get user email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
        reminder.user_id
      );

      if (userError || !userData?.user?.email) {
        console.error(`Could not get user email for reminder ${reminder.id}`);
        await this.updateReminderStatus(reminder.id, false);
        return;
      }

      const userEmail = userData.user.email;
      const userName = userData.user.user_metadata?.full_name || userEmail.split('@')[0];
      
      // Fetch the event separately
      const { data: event, error: eventError } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('id', reminder.event_id)
        .single();

      if (eventError || !event) {
        console.error(`Event not found for reminder ${reminder.id}`);
        await this.updateReminderStatus(reminder.id, false);
        return;
      }

      // Prepare email content based on reminder type
      const emailContent = this.prepareReminderEmail(reminder.reminder_type, event, userName);

      // Send the reminder email
      const result = await EmailService.sendEmail({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html
      });

      if (result.success) {
        console.log(`✅ Reminder ${reminder.id} sent successfully to ${userEmail}`);
        await this.updateReminderStatus(reminder.id, true, userEmail, emailContent.subject, emailContent.html);
      } else {
        console.error(`❌ Failed to send reminder ${reminder.id}: ${result.message}`);
        await this.updateReminderStatus(reminder.id, false, userEmail, emailContent.subject, emailContent.html);
      }
    } catch (error: any) {
      console.error(`Error processing reminder ${reminder.id}:`, error);
      await this.updateReminderStatus(reminder.id, false);
    }
  }

  /**
   * Prepare reminder email content based on type
   */
  private static prepareReminderEmail(
    reminderType: string,
    event: any,
    userName: string
  ): { subject: string; html: string } {
    const eventDate = format(new Date(event.start_date), 'EEEE, MMMM d, yyyy');
    const eventTime = format(new Date(event.start_date), 'h:mm a');
    const eventLocation = event.location_type === 'virtual' 
      ? 'Online Event' 
      : event.venue_name || 'TBA';

    let subject = '';
    let content = '';

    switch (reminderType) {
      case '7_days':
        subject = `📅 Reminder: ${event.title} is in 7 days`;
        content = `
          <h2 style="color: #2c3e50;">Event Coming Up in 7 Days!</h2>
          <p>Dear ${userName},</p>
          <p>This is a reminder that you're registered for <strong>${event.title}</strong> happening in 7 days.</p>
        `;
        break;

      case '3_days':
        subject = `📅 Reminder: ${event.title} is in 3 days`;
        content = `
          <h2 style="color: #2c3e50;">Event Coming Up in 3 Days!</h2>
          <p>Dear ${userName},</p>
          <p>Just 3 days until <strong>${event.title}</strong>! We're looking forward to seeing you.</p>
        `;
        break;

      case '1_day':
        subject = `⏰ Tomorrow: ${event.title}`;
        content = `
          <h2 style="color: #2c3e50;">See You Tomorrow!</h2>
          <p>Dear ${userName},</p>
          <p><strong>${event.title}</strong> is happening tomorrow! Don't forget to mark your calendar.</p>
        `;
        break;

      case '30_min':
        subject = `🔔 Starting Soon: ${event.title}`;
        content = `
          <h2 style="color: #ff6b6b;">Starting in 30 Minutes!</h2>
          <p>Dear ${userName},</p>
          <p><strong>${event.title}</strong> is starting in just 30 minutes!</p>
        `;
        break;

      case 'live':
        subject = `🔴 LIVE NOW: ${event.title}`;
        content = `
          <h2 style="color: #ff0000;">The Event is Starting NOW!</h2>
          <p>Dear ${userName},</p>
          <p><strong>${event.title}</strong> is starting right now! Join us immediately.</p>
        `;
        break;

      default:
        subject = `Reminder: ${event.title}`;
        content = `
          <h2 style="color: #2c3e50;">Event Reminder</h2>
          <p>Dear ${userName},</p>
          <p>This is a reminder about your upcoming event: <strong>${event.title}</strong></p>
        `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">English Australia</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          ${content}
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Event Details:</h3>
            <ul style="color: #4a5568; line-height: 1.8; list-style: none; padding: 0;">
              <li>📅 <strong>Date:</strong> ${eventDate}</li>
              <li>⏰ <strong>Time:</strong> ${eventTime}</li>
              <li>📍 <strong>Location:</strong> ${eventLocation}</li>
              ${event.virtual_link ? `<li>🔗 <strong>Meeting Link:</strong> <a href="${event.virtual_link}" style="color: #667eea;">Join Online</a></li>` : ''}
            </ul>
          </div>

          ${event.description ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #2c3e50;">About the Event:</h3>
              <div style="color: #4a5568; line-height: 1.6;">
                ${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}
              </div>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5180'}/events/${event.slug}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold;">
              View Event Details
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #718096; font-size: 12px; text-align: center;">
            You're receiving this because you're registered for this event.<br>
            To manage your registrations, visit your member portal.
          </p>
        </div>
      </div>
    `;

    return { subject, html };
  }

  /**
   * Update reminder status in database
   */
  private static async updateReminderStatus(
    reminderId: string,
    isSent: boolean,
    emailTo?: string,
    emailSubject?: string,
    emailBody?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        is_sent: isSent
      };

      if (isSent) {
        updateData.sent_date = new Date().toISOString();
      }

      if (emailTo) {
        updateData.email_to = emailTo;
      }
      if (emailSubject) {
        updateData.email_subject = emailSubject;
      }
      if (emailBody) {
        updateData.email_body = emailBody;
      }

      const { error } = await supabaseAdmin
        .from('event_reminders')
        .update(updateData)
        .eq('id', reminderId);

      if (error) {
        console.error(`Error updating reminder ${reminderId} status:`, error);
      }
    } catch (error) {
      console.error(`Error updating reminder ${reminderId} status:`, error);
    }
  }

  /**
   * Retry failed reminders
   */
  static async retryFailedReminders(): Promise<void> {
    // For now, we'll just log this - the event_reminders table doesn't have an attempts field
    console.log('Retry mechanism for failed reminders would go here');
    // In production, you might want to add an attempts field to the table
    // or implement a separate retry tracking mechanism
  }
}