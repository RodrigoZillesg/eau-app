"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportSchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const database_1 = require("../config/database");
const email_service_1 = require("./email.service");
const XLSX = __importStar(require("xlsx"));
const jspdf_1 = __importDefault(require("jspdf"));
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
const date_fns_1 = require("date-fns");
class ReportSchedulerService {
    static isRunning = false;
    static jobs = new Map();
    /**
     * Initialize the report scheduler
     */
    static init() {
        console.log('📊 Report Scheduler Service initializing...');
        // Run every hour to check for scheduled reports
        cron.schedule('0 * * * *', async () => {
            await this.checkAndRunScheduledReports();
        });
        // Initial check on startup
        this.checkAndRunScheduledReports();
        console.log('✅ Report Scheduler Service initialized');
    }
    /**
     * Check and run scheduled reports that are due
     */
    static async checkAndRunScheduledReports() {
        if (this.isRunning) {
            console.log('⏳ Report scheduler already running, skipping...');
            return;
        }
        this.isRunning = true;
        console.log('🔍 Checking for scheduled reports to run...');
        try {
            const now = new Date().toISOString();
            // Get all enabled scheduled reports that are due
            const { data: reports, error } = await database_1.supabaseAdmin
                .from('scheduled_reports')
                .select('*')
                .eq('enabled', true)
                .lte('next_run_at', now)
                .is('last_run_status', null)
                .or('last_run_status.neq.running');
            if (error) {
                throw error;
            }
            if (!reports || reports.length === 0) {
                console.log('✅ No scheduled reports to run at this time');
                return;
            }
            console.log(`📊 Found ${reports.length} scheduled reports to run`);
            // Process each report
            for (const report of reports) {
                await this.runScheduledReport(report);
            }
        }
        catch (error) {
            console.error('❌ Error checking scheduled reports:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * Run a single scheduled report
     */
    static async runScheduledReport(report) {
        console.log(`🚀 Running scheduled report: ${report.name}`);
        // Create a run record
        const { data: runRecord, error: runError } = await database_1.supabaseAdmin
            .from('scheduled_report_runs')
            .insert([{
                scheduled_report_id: report.id,
                status: 'running',
                recipients_notified: []
            }])
            .select()
            .single();
        if (runError) {
            console.error(`❌ Error creating run record for ${report.name}:`, runError);
            return;
        }
        try {
            // Update report status to running
            await database_1.supabaseAdmin
                .from('scheduled_reports')
                .update({
                last_run_status: 'running',
                last_run_at: new Date().toISOString()
            })
                .eq('id', report.id);
            // Generate the report data
            let reportData = [];
            let reportConfig = {};
            if (report.report_config.savedReportId) {
                // Load saved report configuration
                const { data: savedReport, error: savedError } = await database_1.supabaseAdmin
                    .from('saved_reports')
                    .select('*')
                    .eq('id', report.report_config.savedReportId)
                    .single();
                if (savedError)
                    throw savedError;
                reportConfig = savedReport.configuration;
            }
            else if (report.report_config.configuration) {
                reportConfig = report.report_config.configuration;
            }
            // Generate report data
            reportData = await this.generateReportData(reportConfig);
            // Export report to desired format
            const exportedFile = await this.exportReport(reportData, report.format, report.name, report.description);
            // Send email to recipients
            if (report.recipients && report.recipients.length > 0) {
                await this.sendReportEmail(report, exportedFile, reportData.length);
            }
            // Update run record with success
            await database_1.supabaseAdmin
                .from('scheduled_report_runs')
                .update({
                completed_at: new Date().toISOString(),
                status: 'success',
                report_data: reportData,
                recipients_notified: report.recipients
            })
                .eq('id', runRecord.id);
            // Calculate next run time
            const nextRunAt = this.calculateNextRunTime(report.schedule_config);
            // Update report with success and next run time
            await database_1.supabaseAdmin
                .from('scheduled_reports')
                .update({
                last_run_status: 'success',
                last_run_error: null,
                next_run_at: nextRunAt
            })
                .eq('id', report.id);
            console.log(`✅ Successfully ran scheduled report: ${report.name}`);
        }
        catch (error) {
            console.error(`❌ Error running scheduled report ${report.name}:`, error);
            // Update run record with failure
            await database_1.supabaseAdmin
                .from('scheduled_report_runs')
                .update({
                completed_at: new Date().toISOString(),
                status: 'failed',
                error_message: error.message
            })
                .eq('id', runRecord.id);
            // Update report with failure
            await database_1.supabaseAdmin
                .from('scheduled_reports')
                .update({
                last_run_status: 'failed',
                last_run_error: error.message
            })
                .eq('id', report.id);
        }
    }
    /**
     * Generate report data based on configuration
     */
    static async generateReportData(configuration) {
        const { fields, filters, orderBy, orderDirection, limit, table = 'members' } = configuration;
        // Build query - start with basic select
        const selectFields = fields ? fields.join(',') : '*';
        let query = database_1.supabaseAdmin.from(table).select(selectFields);
        // Apply filters
        if (filters && filters.length > 0) {
            for (const filter of filters) {
                const { field, operator, value } = filter;
                // Remove table prefix from field if present
                const cleanField = field.includes('.') ? field.split('.')[1] : field;
                switch (operator) {
                    case '=':
                        query = query.eq(cleanField, value);
                        break;
                    case '!=':
                        query = query.neq(cleanField, value);
                        break;
                    case '>':
                        query = query.gt(cleanField, value);
                        break;
                    case '>=':
                        query = query.gte(cleanField, value);
                        break;
                    case '<':
                        query = query.lt(cleanField, value);
                        break;
                    case '<=':
                        query = query.lte(cleanField, value);
                        break;
                    case 'like':
                        query = query.ilike(cleanField, `%${value}%`);
                        break;
                    case 'in':
                        query = query.in(cleanField, value.split(',').map((v) => v.trim()));
                        break;
                }
            }
        }
        // Apply ordering
        if (orderBy) {
            const cleanOrderBy = orderBy.includes('.') ? orderBy.split('.')[1] : orderBy;
            query = query.order(cleanOrderBy, { ascending: orderDirection !== 'desc' });
        }
        // Apply limit
        if (limit) {
            query = query.limit(limit);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return data || [];
    }
    /**
     * Export report to specified format
     */
    static async exportReport(data, exportFormat, title, description) {
        const timestamp = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd_HH-mm');
        const baseFilename = `${title.replace(/\s+/g, '_')}_${timestamp}`;
        switch (exportFormat) {
            case 'pdf':
                return this.exportToPDF(data, baseFilename, title, description);
            case 'excel':
                return this.exportToExcel(data, baseFilename);
            case 'csv':
                return this.exportToCSV(data, baseFilename);
            case 'json':
                return this.exportToJSON(data, baseFilename);
            default:
                throw new Error(`Unsupported format: ${exportFormat}`);
        }
    }
    /**
     * Export to PDF
     */
    static exportToPDF(data, filename, title, description) {
        const doc = new jspdf_1.default({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        // Add title
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        // Add description if provided
        if (description) {
            doc.setFontSize(12);
            doc.text(description, 14, 30);
        }
        // Add timestamp
        doc.setFontSize(10);
        doc.text(`Generated: ${(0, date_fns_1.format)(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 40);
        // Prepare table data
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const rows = data.map(item => headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined)
                    return '';
                if (typeof value === 'object')
                    return JSON.stringify(value);
                return String(value);
            }));
            // Add table
            (0, jspdf_autotable_1.default)(doc, {
                head: [headers],
                body: rows,
                startY: 45,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [41, 128, 185] }
            });
        }
        const pdfContent = doc.output('arraybuffer');
        return {
            content: Buffer.from(pdfContent),
            filename: `${filename}.pdf`,
            mimeType: 'application/pdf'
        };
    }
    /**
     * Export to Excel
     */
    static exportToExcel(data, filename) {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        return {
            content: excelBuffer,
            filename: `${filename}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
    }
    /**
     * Export to CSV
     */
    static exportToCSV(data, filename) {
        if (data.length === 0) {
            return {
                content: '',
                filename: `${filename}.csv`,
                mimeType: 'text/csv'
            };
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined)
                    return '';
                const stringValue = String(value);
                // Escape quotes and wrap in quotes if contains comma
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(','))
        ].join('\n');
        return {
            content: csvContent,
            filename: `${filename}.csv`,
            mimeType: 'text/csv'
        };
    }
    /**
     * Export to JSON
     */
    static exportToJSON(data, filename) {
        return {
            content: JSON.stringify(data, null, 2),
            filename: `${filename}.json`,
            mimeType: 'application/json'
        };
    }
    /**
     * Send report email to recipients
     */
    static async sendReportEmail(report, exportedFile, recordCount) {
        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Scheduled Report: ${report.name}</h2>
        ${report.description ? `<p style="color: #666;">${report.description}</p>` : ''}

        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Report Generated:</strong> ${(0, date_fns_1.format)(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p style="margin: 5px 0;"><strong>Total Records:</strong> ${recordCount}</p>
          <p style="margin: 5px 0;"><strong>Format:</strong> ${report.format.toUpperCase()}</p>
        </div>

        <p style="color: #666;">The report is attached to this email. Please find the ${report.format.toUpperCase()} file attached.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #999; font-size: 12px;">
          This is an automated report from English Australia Unified System.
          To manage your scheduled reports, please log in to the admin panel.
        </p>
      </div>
    `;
        // For now, we'll send without attachments
        // In production, you would upload to storage and include a download link
        // Send email to each recipient
        for (const recipient of report.recipients) {
            try {
                await email_service_1.EmailService.sendEmail({
                    to: recipient,
                    subject: `Scheduled Report: ${report.name}`,
                    html: emailContent
                });
                console.log(`✉️ Report notification sent to ${recipient}`);
            }
            catch (error) {
                console.error(`❌ Failed to send report to ${recipient}:`, error);
            }
        }
    }
    /**
     * Calculate next run time based on schedule configuration
     */
    static calculateNextRunTime(scheduleConfig) {
        const { frequency, time, dayOfWeek, dayOfMonth } = scheduleConfig;
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        let nextRun = new Date();
        switch (frequency) {
            case 'daily':
                nextRun.setHours(hours, minutes, 0, 0);
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;
            case 'weekly':
                const targetDay = dayOfWeek || 1; // Default to Monday
                nextRun.setHours(hours, minutes, 0, 0);
                // Find next occurrence of target day
                while (nextRun.getDay() !== targetDay || nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;
            case 'monthly':
                const targetDate = dayOfMonth || 1;
                nextRun.setDate(targetDate);
                nextRun.setHours(hours, minutes, 0, 0);
                // If already passed this month, go to next month
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
                break;
        }
        return nextRun.toISOString();
    }
}
exports.ReportSchedulerService = ReportSchedulerService;
//# sourceMappingURL=reportScheduler.service.js.map