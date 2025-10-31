import { supabaseAdmin } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

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

export class EmailLoggerService {
  /**
   * Log an email that was sent or attempted to be sent
   */
  static async logEmail(data: EmailLogData): Promise<string | null> {
    try {
      // Generate a unique message ID for tracking
      const messageId = `${uuidv4()}@englishaustralia.com.au`;

      const logEntry = {
        ...data,
        message_id: messageId,
        sent_at: new Date().toISOString(),
        status: data.status || 'sent',
        from_email: data.from_email || 'noreply@englishaustralia.com.au'
      };

      const { error } = await supabaseAdmin
        .from('email_logs')
        .insert(logEntry);

      if (error) {
        console.error('Error logging email:', error);
        return null;
      }

      return messageId;
    } catch (error) {
      console.error('Failed to log email:', error);
      return null;
    }
  }

  /**
   * Update existing email log with status or error
   */
  static async updateEmailLog(
    messageId: string,
    updates: Partial<EmailLogData>
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('email_logs')
        .update(updates)
        .eq('message_id', messageId);

      if (error) {
        console.error('Error updating email log:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update email log:', error);
      return false;
    }
  }

  /**
   * Track email open event
   */
  static async trackOpen(messageId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('track_email_open', { p_message_id: messageId });

      if (error) {
        console.error('Error tracking email open:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Failed to track email open:', error);
      return false;
    }
  }

  /**
   * Track email click event
   */
  static async trackClick(messageId: string, linkUrl?: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('track_email_click', {
          p_message_id: messageId,
          p_link_url: linkUrl
        });

      if (error) {
        console.error('Error tracking email click:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Failed to track email click:', error);
      return false;
    }
  }

  /**
   * Get email statistics for a date range
   */
  static async getStatistics(startDate?: Date, endDate?: Date) {
    try {
      const params: any = {};
      if (startDate) params.p_start_date = startDate.toISOString().split('T')[0];
      if (endDate) params.p_end_date = endDate.toISOString().split('T')[0];

      const { data, error } = await supabaseAdmin
        .rpc('get_email_statistics', params);

      if (error) {
        console.error('Error fetching email statistics:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Failed to fetch email statistics:', error);
      return null;
    }
  }

  /**
   * Get email logs with filtering
   */
  static async getEmailLogs(filters: {
    email_type?: string;
    status?: string;
    start_date?: Date;
    end_date?: Date;
    recipient_email?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabaseAdmin
        .from('email_logs')
        .select('*', { count: 'exact' })
        .order('sent_at', { ascending: false });

      if (filters.email_type) {
        query = query.eq('email_type', filters.email_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.recipient_email) {
        query = query.ilike('recipient_email', `%${filters.recipient_email}%`);
      }
      if (filters.start_date) {
        query = query.gte('sent_at', filters.start_date.toISOString());
      }
      if (filters.end_date) {
        query = query.lte('sent_at', filters.end_date.toISOString());
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching email logs:', error);
        return { logs: [], total: 0 };
      }

      return { logs: data || [], total: count || 0 };
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Generate tracking pixel URL
   */
  static generateTrackingPixel(messageId: string): string {
    const baseUrl = process.env.BACKEND_URL || 'https://eau-app-servico-eau-backend.lkobs5.easypanel.host';
    return `${baseUrl}/api/v1/track/open/${messageId}`;
  }

  /**
   * Generate tracked link URL
   */
  static generateTrackedLink(messageId: string, originalUrl: string): string {
    const baseUrl = process.env.BACKEND_URL || 'https://eau-app-servico-eau-backend.lkobs5.easypanel.host';
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${baseUrl}/api/v1/track/click/${messageId}?url=${encodedUrl}`;
  }
}