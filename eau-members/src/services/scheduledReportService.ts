import { supabase } from '../lib/supabase';
import { ReportExportService } from './reportExportService';

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6, 0 = Sunday
  dayOfMonth?: number; // 1-31
}

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  report_config: {
    savedReportId?: string;
    configuration?: any; // Direct report configuration
  };
  schedule_config: ScheduleConfig;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  enabled: boolean;
  last_run_at?: string;
  last_run_status?: 'success' | 'failed' | 'running';
  last_run_error?: string;
  next_run_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReportRun {
  id: string;
  scheduled_report_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'success' | 'failed';
  error_message?: string;
  report_data?: any;
  file_url?: string;
  recipients_notified: string[];
  created_at: string;
}

export class ScheduledReportService {
  /**
   * Get all scheduled reports
   */
  static async getScheduledReports(): Promise<ScheduledReport[]> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single scheduled report by ID
   */
  static async getScheduledReport(id: string): Promise<ScheduledReport | null> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new scheduled report
   */
  static async createScheduledReport(report: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduledReport> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert([report])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing scheduled report
   */
  static async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(id: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Toggle enabled status of a scheduled report
   */
  static async toggleScheduledReport(id: string, enabled: boolean): Promise<ScheduledReport> {
    return this.updateScheduledReport(id, { enabled });
  }

  /**
   * Get execution history for a scheduled report
   */
  static async getReportRuns(scheduledReportId: string, limit = 10): Promise<ScheduledReportRun[]> {
    const { data, error } = await supabase
      .from('scheduled_report_runs')
      .select('*')
      .eq('scheduled_report_id', scheduledReportId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Manually trigger a scheduled report
   */
  static async triggerReport(scheduledReportId: string): Promise<ScheduledReportRun> {
    // Get the scheduled report configuration
    const scheduledReport = await this.getScheduledReport(scheduledReportId);
    if (!scheduledReport) {
      throw new Error('Scheduled report not found');
    }

    // Create a run record
    const { data: runRecord, error: runError } = await supabase
      .from('scheduled_report_runs')
      .insert([{
        scheduled_report_id: scheduledReportId,
        status: 'running',
        recipients_notified: []
      }])
      .select()
      .single();

    if (runError) throw runError;

    try {
      // Get the report configuration
      let reportData: any[] = [];

      if (scheduledReport.report_config.savedReportId) {
        // Load saved report configuration
        const { data: savedReport, error: savedError } = await supabase
          .from('saved_reports')
          .select('*')
          .eq('id', scheduledReport.report_config.savedReportId)
          .single();

        if (savedError) throw savedError;

        // Generate the report data based on configuration
        reportData = await this.generateReportData(savedReport.configuration);
      } else if (scheduledReport.report_config.configuration) {
        // Use direct configuration
        reportData = await this.generateReportData(scheduledReport.report_config.configuration);
      }

      // Export the report in the specified format
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${scheduledReport.name.replace(/\s+/g, '_')}_${timestamp}`;

      // For now, we'll just prepare the data
      // In a real implementation, this would save to storage and send emails
      const exportOptions = {
        fileName,
        title: scheduledReport.name,
        description: scheduledReport.description || ''
      };

      // Update run record with success
      const { data: updatedRun, error: updateError } = await supabase
        .from('scheduled_report_runs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'success',
          report_data: reportData,
          recipients_notified: scheduledReport.recipients
        })
        .eq('id', runRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update last run info on scheduled report
      await this.updateScheduledReport(scheduledReportId, {
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        last_run_error: undefined
      });

      return updatedRun;
    } catch (error: any) {
      // Update run record with failure
      await supabase
        .from('scheduled_report_runs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: error.message
        })
        .eq('id', runRecord.id);

      // Update last run info on scheduled report
      await this.updateScheduledReport(scheduledReportId, {
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
        last_run_error: error.message
      });

      throw error;
    }
  }

  /**
   * Generate report data based on configuration
   */
  private static async generateReportData(configuration: any): Promise<any[]> {
    const { fields, filters, orderBy, orderDirection, limit } = configuration;

    // Build query based on configuration
    let query = supabase.from('members').select(fields.join(','));

    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach((filter: any) => {
        const { field, operator, value } = filter;
        switch (operator) {
          case '=':
            query = query.eq(field, value);
            break;
          case '!=':
            query = query.neq(field, value);
            break;
          case '>':
            query = query.gt(field, value);
            break;
          case '>=':
            query = query.gte(field, value);
            break;
          case '<':
            query = query.lt(field, value);
            break;
          case '<=':
            query = query.lte(field, value);
            break;
          case 'like':
            query = query.ilike(field, `%${value}%`);
            break;
          case 'in':
            query = query.in(field, value.split(',').map((v: string) => v.trim()));
            break;
        }
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending: orderDirection !== 'desc' });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  /**
   * Format schedule for display
   */
  static formatSchedule(config: ScheduleConfig): string {
    const time = config.time || '09:00';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    switch (config.frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const dayName = config.dayOfWeek !== undefined ? days[config.dayOfWeek] : 'Monday';
        return `Weekly on ${dayName} at ${time}`;
      case 'monthly':
        const day = config.dayOfMonth || 1;
        const suffix = this.getDaySuffix(day);
        return `Monthly on the ${day}${suffix} at ${time}`;
      default:
        return 'Not scheduled';
    }
  }

  /**
   * Get day suffix for ordinal numbers
   */
  private static getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  /**
   * Validate schedule configuration
   */
  static validateScheduleConfig(config: ScheduleConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate time format
    if (!config.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.time)) {
      errors.push('Invalid time format. Use HH:MM (24-hour format)');
    }

    // Validate frequency-specific fields
    switch (config.frequency) {
      case 'weekly':
        if (config.dayOfWeek === undefined || config.dayOfWeek < 0 || config.dayOfWeek > 6) {
          errors.push('Day of week must be between 0 (Sunday) and 6 (Saturday)');
        }
        break;
      case 'monthly':
        if (config.dayOfMonth === undefined || config.dayOfMonth < 1 || config.dayOfMonth > 31) {
          errors.push('Day of month must be between 1 and 31');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate next run time for a schedule
   */
  static calculateNextRunTime(config: ScheduleConfig): Date {
    const now = new Date();
    const [hours, minutes] = config.time.split(':').map(Number);
    let nextRun = new Date();

    switch (config.frequency) {
      case 'daily':
        nextRun.setHours(hours, minutes, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const targetDay = config.dayOfWeek || 1; // Default to Monday
        nextRun.setHours(hours, minutes, 0, 0);

        // Find next occurrence of target day
        while (nextRun.getDay() !== targetDay || nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'monthly':
        const targetDate = config.dayOfMonth || 1;
        nextRun.setDate(targetDate);
        nextRun.setHours(hours, minutes, 0, 0);

        // If already passed this month, go to next month
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun;
  }
}