import * as cron from 'node-cron';
import { ReminderService } from '../services/reminder.service';

/**
 * Initialize reminder cron jobs
 */
export function initializeReminderCron(): void {
  console.log('🕐 Initializing reminder cron jobs...');

  // Process reminders every minute
  // In production, you might want to run this less frequently (e.g., every 5 minutes)
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Running reminder check...');
    await ReminderService.processPendingReminders();
  });

  // Retry failed reminders every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 Retrying failed reminders...');
    await ReminderService.retryFailedReminders();
  });

  console.log('✅ Reminder cron jobs initialized successfully');
  
  // Run immediately on startup
  console.log('🚀 Running initial reminder check...');
  ReminderService.processPendingReminders();
}