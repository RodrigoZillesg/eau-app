import axios, { AxiosInstance } from 'axios';
import { supabaseAdmin as supabase } from '../config/database';

interface OpenLearningConfig {
  institutionId: string;
  apiKey: string;
  baseUrl: string;
}

/**
 * OpenLearning Correct Service - Implementação seguindo documentação oficial
 *
 * Baseado na documentação: https://help.openlearning.com/t/k9slj4/openlearning-api-user-provisioning-and-single-sign-on-with-lti
 * API Docs: https://api.openlearning.com/v2.2/docs
 */
export class OpenLearningCorrectService {
  private axiosInstance: AxiosInstance;
  private config: OpenLearningConfig;

  constructor() {
    // Configuração baseada na documentação oficial
    this.config = {
      institutionId: 'english-australia',
      // API Key gerada em: https://www.openlearning.com/accounts/account-settings/
      // Login: dev@platty.tech / 7E8GC{:M*e\\\
      apiKey: '681bbb338d4d83608d1d6114.c9323f76014106f3a8f6531f958b541a80f3ce39afc3d33244a09b27c6d075bd',
      baseUrl: 'https://api.openlearning.com/v2.2'
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
  }

  /**
   * Provision a managed user account in OpenLearning
   * API: POST /institutions/{institution_id}/managed-users/
   */
  async provisionUser(memberId: string, userData: {
    fullName: string;
    email: string;
    externalId?: string;
  }): Promise<{ success: boolean; openLearningUserId?: string; error?: string }> {
    try {
      console.log('Provisioning user in OpenLearning with official API:', { memberId, userData });

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

      // Prepare form data as per OpenLearning API documentation
      const formData = new URLSearchParams();
      formData.append('full_name', userData.fullName);
      formData.append('external_institution_id', userData.externalId || memberId);
      formData.append('primary_email_address', userData.email);
      formData.append('send_password_email', 'false');
      formData.append('send_welcome_email', 'false');

      const endpoint = `/institutions/${this.config.institutionId}/managed-users/`;
      const url = `${endpoint}?api_key=${this.config.apiKey}`;

      console.log('Making API request to:', url);
      console.log('Form data:', Object.fromEntries(formData));

      const response = await this.axiosInstance.post(url, formData);

      console.log('OpenLearning provision response:', response.data);

      // Extract OpenLearning user ID from response
      // The API v2.2 returns data in a nested structure
      const responseData = response.data.data || response.data;
      const openLearningUserId = responseData.id || responseData.user_id;

      if (!openLearningUserId) {
        console.error('No user ID in response:', response.data);
        return {
          success: false,
          error: 'No user ID returned from OpenLearning'
        };
      }

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
      }

      return {
        success: true,
        openLearningUserId
      };

    } catch (error: any) {
      console.error('Error provisioning OpenLearning user:', error.response?.data || error.message);

      // Check if user already exists (409 Conflict)
      if (error.response?.status === 409) {
        console.log('User already exists in OpenLearning, attempting to retrieve ID...');

        // The error response might contain the existing user ID
        const errorData = error.response?.data?.data || error.response?.data;
        let existingUserId = errorData?.existing_user_id ||
                            errorData?.user_id ||
                            errorData?.id;

        // If we don't have the ID from the error, use the external ID
        if (!existingUserId) {
          console.log('Using external ID as fallback:', userData.externalId || memberId);
          existingUserId = userData.externalId || memberId;
        }

        console.log('Found existing OpenLearning user ID:', existingUserId);

        // Update member record with existing OpenLearning ID
        const { error: updateError } = await supabase
          .from('members')
          .update({
            openlearning_user_id: existingUserId,
            openlearning_external_id: userData.externalId || memberId,
            openlearning_provisioned_at: new Date().toISOString()
          })
          .eq('id', memberId);

        if (updateError) {
          console.error('Error updating member with existing OpenLearning ID:', updateError);
        }

        return {
          success: true,
          openLearningUserId: existingUserId
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Generate SSO launch URL for a member
   * API: POST /institutions/{institution_id}/managed-users/{user_id}/sign-on/
   */
  async generateSSOLaunchUrl(
    memberId: string,
    openLearningUserId: string,
    classId?: string
  ): Promise<{ success: boolean; launchUrl?: string; launchData?: any; error?: string }> {
    try {
      console.log('Generating SSO launch URL with official API:', { memberId, openLearningUserId, classId });

      // Get member's OpenLearning ID if not provided
      if (!openLearningUserId || openLearningUserId === 'temp_user_id') {
        const { data: member } = await supabase
          .from('members')
          .select('openlearning_user_id, openlearning_external_id')
          .eq('id', memberId)
          .single();

        if (!member?.openlearning_user_id && !member?.openlearning_external_id) {
          return {
            success: false,
            error: 'Member not provisioned in OpenLearning'
          };
        }

        openLearningUserId = member.openlearning_user_id || member.openlearning_external_id;
      }

      // Prepare form data for sign-on request
      const formData = new URLSearchParams();
      if (classId) {
        // OpenLearning API expects 'context_id' for course-specific SSO
        formData.append('context_id', classId);
        console.log('Adding context_id to SSO request:', classId);
      }

      const endpoint = `/institutions/${this.config.institutionId}/managed-users/${openLearningUserId}/sign-on/`;
      const url = `${endpoint}?api_key=${this.config.apiKey}`;

      console.log('Making SSO API request to:', url);
      console.log('Form data being sent:', formData.toString());

      const response = await this.axiosInstance.post(url, formData);

      console.log('OpenLearning SSO response received');
      console.log('Full response structure:', JSON.stringify(response.data, null, 2));

      // Handle the response format from OpenLearning v2.2 API
      // The response has a meta/data/pagination structure
      const responseData = response.data.data || response.data;

      if (responseData.url && responseData.method && responseData.params) {
        // This is the correct LTI launch format
        return {
          success: true,
          launchData: {
            url: responseData.url,
            method: responseData.method,
            params: responseData.params
          }
        };
      }

      // If direct URL is returned
      if (responseData.url) {
        return {
          success: true,
          launchUrl: responseData.url,
          launchData: responseData
        };
      }

      console.error('Invalid launch data format:', responseData);
      return {
        success: false,
        error: 'Invalid launch data format from OpenLearning'
      };

    } catch (error: any) {
      console.error('Error generating SSO URL:', error.response?.data || error.message);

      // Try with external ID if OpenLearning ID fails
      if (error.response?.status === 404 && openLearningUserId !== memberId) {
        console.log('Retrying with external ID:', memberId);
        return this.generateSSOLaunchUrl(memberId, memberId, classId);
      }

      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Set the API key (call this after getting the real API key)
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    console.log('API Key updated for OpenLearning service');
  }

  /**
   * Get institution information to verify API key
   */
  async verifyApiKey(): Promise<{ success: boolean; institutionData?: any; error?: string }> {
    try {
      const url = `/users/me/institutions/?api_key=${this.config.apiKey}`;
      const response = await this.axiosInstance.get(url);

      console.log('Institution verification response:', response.data);

      return {
        success: true,
        institutionData: response.data
      };
    } catch (error: any) {
      console.error('Error verifying API key:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get list of courses from OpenLearning institution
   */
  async getCourses(): Promise<{ success: boolean; courses?: any[]; error?: string }> {
    try {
      const url = `/institutions/${this.config.institutionId}/courses/?api_key=${this.config.apiKey}`;
      const response = await this.axiosInstance.get(url);

      console.log('Courses fetched from OpenLearning:', response.data?.data?.length || 0);

      const courses = response.data?.data || [];

      return {
        success: true,
        courses: courses.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.summary || '',
          imageUrl: course.image,
          url: course.url,
          price: course.price,
          selfPaced: course.self_paced
        }))
      };
    } catch (error: any) {
      console.error('Error fetching courses:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export const openLearningCorrectService = new OpenLearningCorrectService();