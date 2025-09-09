import axios, { AxiosInstance } from 'axios';
import { supabaseAdmin as supabase } from '../config/database';

interface OpenLearningConfig {
  apiBaseUrl: string;
  institutionId: string;
  clientId: string;
  clientSecret: string;
  apiKey?: string;
}

interface OpenLearningUser {
  id?: string;
  full_name: string;
  external_institution_id: string;
  primary_email_address: string;
  send_password_email?: boolean;
  send_welcome_email?: boolean;
}

interface OpenLearningSSORequest {
  class_id?: string;
  return_url?: string;
  context?: any;
}

interface OpenLearningSSOResponse {
  url: string;
  method: string;
  params: Record<string, any>;
}

export class OpenLearningService {
  private axiosInstance: AxiosInstance;
  private config: OpenLearningConfig;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      apiBaseUrl: process.env.OPENLEARNING_API_URL || 'https://api.openlearning.com',
      institutionId: process.env.OPENLEARNING_INSTITUTION_ID || 'english-australia',
      clientId: process.env.OPENLEARNING_CLIENT_ID || '1000.EJ1GYWGUO2JSYY38D545AOHEVIGQGS',
      clientSecret: process.env.OPENLEARNING_CLIENT_SECRET || '1f5c48aec5e199565b870f9d87a932ef99f5bf9e00',
      apiKey: process.env.OPENLEARNING_API_KEY
    };

    // Initialize axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: this.config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });

    // Add request interceptor for OAuth if needed
    this.axiosInstance.interceptors.request.use(async (config) => {
      // If we need OAuth token, get it here
      if (!this.config.apiKey) {
        const token = await this.getOAuthToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    });
  }

  /**
   * Get OAuth token using client credentials
   */
  private async getOAuthToken(): Promise<string | null> {
    try {
      const response = await axios.post(`${this.config.apiBaseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting OAuth token:', error);
      await this.logApiError(null, 'get_oauth_token', '', error);
      return null;
    }
  }

  /**
   * Provision a new user in OpenLearning
   */
  async provisionUser(memberId: string, userData: {
    fullName: string;
    email: string;
    externalId?: string;
  }): Promise<{ success: boolean; openLearningUserId?: string; error?: string }> {
    try {
      // Check if user already has OpenLearning ID
      const { data: member } = await supabase
        .from('members')
        .select('openlearning_user_id, openlearning_external_id')
        .eq('id', memberId)
        .single();

      if (member?.openlearning_user_id) {
        return { 
          success: true, 
          openLearningUserId: member.openlearning_user_id 
        };
      }

      // Prepare user data for OpenLearning
      const openLearningUser: OpenLearningUser = {
        full_name: userData.fullName,
        external_institution_id: userData.externalId || memberId,
        primary_email_address: userData.email,
        send_password_email: false,
        send_welcome_email: false
      };

      // Make API call to create user
      const endpoint = `/institutions/${this.config.institutionId}/managed-users/`;
      const response = await this.axiosInstance.post(endpoint, openLearningUser);

      // Log successful API call
      await this.logApiCall(memberId, 'provision_user', endpoint, openLearningUser, response.data, response.status);

      // Extract OpenLearning user ID from response
      const openLearningUserId = response.data.id || response.data.user_id;

      // Update member record with OpenLearning ID
      const { error: updateError } = await supabase
        .from('members')
        .update({
          openlearning_user_id: openLearningUserId,
          openlearning_external_id: userData.externalId || memberId,
          openlearning_provisioned_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (updateError) {
        console.error('Error updating member with OpenLearning ID:', updateError);
        return { 
          success: false, 
          error: 'Failed to update member record' 
        };
      }

      return { 
        success: true, 
        openLearningUserId 
      };

    } catch (error: any) {
      console.error('Error provisioning OpenLearning user:', error);
      
      // Log API error
      await this.logApiError(
        memberId, 
        'provision_user', 
        `/institutions/${this.config.institutionId}/managed-users/`,
        error
      );

      // Check if user already exists (409 Conflict)
      if (error.response?.status === 409) {
        // Try to get existing user ID from error response
        const existingUserId = error.response?.data?.existing_user_id;
        if (existingUserId) {
          // Update member record with existing OpenLearning ID
          await supabase
            .from('members')
            .update({
              openlearning_user_id: existingUserId,
              openlearning_external_id: userData.externalId || memberId
            })
            .eq('id', memberId);
          
          return { 
            success: true, 
            openLearningUserId: existingUserId 
          };
        }
      }

      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  /**
   * Generate SSO launch URL for a member
   */
  async generateSSOLaunchUrl(
    memberId: string, 
    ssoRequest: OpenLearningSSORequest = {}
  ): Promise<{ success: boolean; launchData?: OpenLearningSSOResponse; sessionToken?: string; error?: string }> {
    try {
      // Get member's OpenLearning ID
      const { data: member } = await supabase
        .from('members')
        .select('openlearning_user_id, openlearning_external_id')
        .eq('id', memberId)
        .single();

      if (!member?.openlearning_user_id) {
        return { 
          success: false, 
          error: 'Member not provisioned in OpenLearning' 
        };
      }

      // Generate SSO launch request
      const endpoint = `/institutions/${this.config.institutionId}/managed-users/${member.openlearning_user_id}/sign-on/`;
      const response = await this.axiosInstance.post(endpoint, ssoRequest);

      // Log successful API call
      await this.logApiCall(memberId, 'generate_sso_launch', endpoint, ssoRequest, response.data, response.status);

      // Generate session token
      const sessionToken = this.generateSessionToken();

      // Store SSO session in database
      const { error: sessionError } = await supabase
        .from('openlearning_sso_sessions')
        .insert({
          member_id: memberId,
          session_token: sessionToken,
          launch_url: response.data.url,
          class_id: ssoRequest.class_id,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
        });

      if (sessionError) {
        console.error('Error storing SSO session:', sessionError);
      }

      return { 
        success: true, 
        launchData: response.data,
        sessionToken 
      };

    } catch (error: any) {
      console.error('Error generating SSO launch URL:', error);
      
      // Log API error
      await this.logApiError(
        memberId, 
        'generate_sso_launch',
        `/institutions/${this.config.institutionId}/managed-users/*/sign-on/`,
        error
      );

      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  /**
   * Get course completions for a member
   */
  async getCourseCompletions(memberId: string): Promise<{ success: boolean; courses?: any[]; error?: string }> {
    try {
      // Get member's OpenLearning ID
      const { data: member } = await supabase
        .from('members')
        .select('openlearning_user_id')
        .eq('id', memberId)
        .single();

      if (!member?.openlearning_user_id) {
        return { 
          success: false, 
          error: 'Member not provisioned in OpenLearning' 
        };
      }

      // Get course completions from OpenLearning
      const endpoint = `/institutions/${this.config.institutionId}/managed-users/${member.openlearning_user_id}/completions/`;
      const response = await this.axiosInstance.get(endpoint);

      // Log successful API call
      await this.logApiCall(memberId, 'get_course_completions', endpoint, {}, response.data, response.status);

      return { 
        success: true, 
        courses: response.data.completions || response.data 
      };

    } catch (error: any) {
      console.error('Error getting course completions:', error);
      
      // Log API error
      await this.logApiError(
        memberId, 
        'get_course_completions',
        `/institutions/${this.config.institutionId}/managed-users/*/completions/`,
        error
      );

      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  /**
   * Sync course completions to CPD activities
   */
  async syncCoursesToCPD(memberId: string): Promise<{ success: boolean; syncedCount?: number; error?: string }> {
    try {
      // Get course completions from OpenLearning
      const { success, courses, error } = await this.getCourseCompletions(memberId);
      
      if (!success || !courses) {
        return { success: false, error };
      }

      let syncedCount = 0;

      // Process each course completion
      for (const course of courses) {
        // Check if course already synced
        const { data: existingCourse } = await supabase
          .from('openlearning_courses')
          .select('id, cpd_activity_id')
          .eq('member_id', memberId)
          .eq('openlearning_course_id', course.course_id)
          .eq('openlearning_class_id', course.class_id || '')
          .single();

        if (existingCourse) {
          // Update existing record
          await supabase
            .from('openlearning_courses')
            .update({
              completion_date: course.completion_date,
              completion_percentage: course.completion_percentage,
              certificate_url: course.certificate_url,
              raw_data: course,
              synced_at: new Date().toISOString()
            })
            .eq('id', existingCourse.id);
        } else {
          // Create new CPD activity
          const { data: cpdActivity } = await supabase
            .from('cpd_activities')
            .insert({
              member_id: memberId,
              activity_name: course.course_name || 'OpenLearning Course',
              activity_type: 'online_course',
              provider: 'OpenLearning',
              completion_date: course.completion_date,
              cpd_hours: course.cpd_hours || 1,
              status: 'completed',
              description: course.course_description,
              certificate_url: course.certificate_url,
              external_id: `openlearning_${course.course_id}`
            })
            .select()
            .single();

          // Store OpenLearning course record
          await supabase
            .from('openlearning_courses')
            .insert({
              member_id: memberId,
              openlearning_course_id: course.course_id,
              openlearning_class_id: course.class_id,
              course_name: course.course_name || 'OpenLearning Course',
              course_description: course.course_description,
              completion_date: course.completion_date,
              completion_percentage: course.completion_percentage,
              certificate_url: course.certificate_url,
              cpd_activity_id: cpdActivity?.id,
              raw_data: course,
              synced_at: new Date().toISOString()
            });

          syncedCount++;
        }
      }

      // Update member's last synced timestamp
      await supabase
        .from('members')
        .update({
          openlearning_last_synced: new Date().toISOString()
        })
        .eq('id', memberId);

      return { 
        success: true, 
        syncedCount 
      };

    } catch (error: any) {
      console.error('Error syncing courses to CPD:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Generate a random session token
   */
  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  /**
   * Log API call to database
   */
  private async logApiCall(
    memberId: string | null,
    action: string,
    endpoint: string,
    requestData: any,
    responseData: any,
    statusCode: number
  ): Promise<void> {
    try {
      await supabase
        .from('openlearning_api_logs')
        .insert({
          member_id: memberId,
          action,
          endpoint,
          request_data: requestData,
          response_data: responseData,
          status_code: statusCode
        });
    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  /**
   * Log API error to database
   */
  private async logApiError(
    memberId: string | null,
    action: string,
    endpoint: string,
    error: any
  ): Promise<void> {
    try {
      await supabase
        .from('openlearning_api_logs')
        .insert({
          member_id: memberId,
          action,
          endpoint,
          request_data: error.config?.data,
          response_data: error.response?.data,
          status_code: error.response?.status,
          error_message: error.message
        });
    } catch (logError) {
      console.error('Error logging API error:', logError);
    }
  }
}

// Export singleton instance
export const openLearningService = new OpenLearningService();