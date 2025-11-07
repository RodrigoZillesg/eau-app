export declare class ReminderService {
    /**
     * Process pending reminders
     */
    static processPendingReminders(): Promise<void>;
    /**
     * Process a single reminder
     */
    private static processReminder;
    /**
     * Prepare reminder email content based on type
     */
    private static prepareReminderEmail;
    /**
     * Update reminder status in database
     */
    private static updateReminderStatus;
    /**
     * Retry failed reminders
     */
    static retryFailedReminders(): Promise<void>;
}
//# sourceMappingURL=reminder.service.d.ts.map