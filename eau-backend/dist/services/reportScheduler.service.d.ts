interface ScheduledReport {
    id: string;
    name: string;
    description?: string;
    report_config: {
        savedReportId?: string;
        configuration?: any;
    };
    schedule_config: {
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
    };
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv' | 'json';
    enabled: boolean;
    next_run_at?: string;
}
export declare class ReportSchedulerService {
    private static isRunning;
    private static jobs;
    /**
     * Initialize the report scheduler
     */
    static init(): void;
    /**
     * Check and run scheduled reports that are due
     */
    static checkAndRunScheduledReports(): Promise<void>;
    /**
     * Run a single scheduled report
     */
    static runScheduledReport(report: ScheduledReport): Promise<void>;
    /**
     * Generate report data based on configuration
     */
    private static generateReportData;
    /**
     * Export report to specified format
     */
    private static exportReport;
    /**
     * Export to PDF
     */
    private static exportToPDF;
    /**
     * Export to Excel
     */
    private static exportToExcel;
    /**
     * Export to CSV
     */
    private static exportToCSV;
    /**
     * Export to JSON
     */
    private static exportToJSON;
    /**
     * Send report email to recipients
     */
    private static sendReportEmail;
    /**
     * Calculate next run time based on schedule configuration
     */
    private static calculateNextRunTime;
}
export {};
//# sourceMappingURL=reportScheduler.service.d.ts.map