interface EmailLogData {
    recipient_email: string;
    from_email?: string;
    subject?: string;
    email_type: string;
    template_name?: string;
    template_data?: any;
    user_id?: string;
    institution_id?: string;
    metadata?: any;
    status?: 'sent' | 'failed' | 'bounced' | 'pending' | 'queued';
    error_message?: string;
}
export declare class EmailLoggerService {
    /**
     * Log an email that was sent or attempted to be sent
     */
    static logEmail(data: EmailLogData): Promise<string | null>;
    /**
     * Update existing email log with status or error
     */
    static updateEmailLog(messageId: string, updates: Partial<EmailLogData>): Promise<boolean>;
    /**
     * Track email open event
     */
    static trackOpen(messageId: string): Promise<boolean>;
    /**
     * Track email click event
     */
    static trackClick(messageId: string, linkUrl?: string): Promise<boolean>;
    /**
     * Get email statistics for a date range
     */
    static getStatistics(startDate?: Date, endDate?: Date): Promise<any>;
    /**
     * Get email logs with filtering
     */
    static getEmailLogs(filters: {
        email_type?: string;
        status?: string;
        start_date?: Date;
        end_date?: Date;
        recipient_email?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: any[];
        total: number;
    }>;
    /**
     * Generate tracking pixel URL
     */
    static generateTrackingPixel(messageId: string): string;
    /**
     * Generate tracked link URL
     */
    static generateTrackedLink(messageId: string, originalUrl: string): string;
}
export {};
//# sourceMappingURL=emailLogger.service.d.ts.map