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
export declare class EmailService {
    private static transporter;
    /**
     * Get SMTP settings from database (public method for controller)
     * Returns ALL settings, not just enabled ones (for admin UI)
     */
    static getSMTPSettings(): Promise<SMTPSettings | null>;
    /**
     * Get enabled SMTP settings for sending emails
     * This is the internal method used when actually sending emails
     */
    private static getEnabledSMTPSettings;
    /**
     * Create or update the email transporter with current settings
     */
    private static getTransporter;
    /**
     * Send an email using the configured SMTP settings
     */
    static sendEmail(options: EmailOptions): Promise<{
        success: boolean;
        message: string;
        messageId?: string;
    }>;
    /**
     * Send a test email to verify SMTP configuration
     */
    static sendTestEmail(to: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Test SMTP connection without sending an email
     */
    static testConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Log email activity to database
     */
    private static logEmail;
    /**
     * Send event registration confirmation
     */
    static sendEventRegistrationConfirmation(data: {
        to: string;
        memberName: string;
        eventTitle: string;
        eventDate: string;
        eventLocation: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Send CPD points notification
     */
    static sendCPDPointsNotification(data: {
        to: string;
        memberName: string;
        activityTitle: string;
        points: number;
        status: 'approved' | 'rejected';
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Save SMTP settings to database
     */
    static saveSMTPSettings(settings: Partial<SMTPSettings>): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=email.service.d.ts.map