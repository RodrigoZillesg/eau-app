import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface OpenLearningSSOResponse {
  success: boolean;
  launchData?: {
    url: string;
    method: string;
    params: Record<string, any>;
  };
  sessionToken?: string;
  error?: string;
}

interface OpenLearningStatus {
  isProvisioned: boolean;
  openLearningUserId?: string;
  externalId?: string;
  syncEnabled: boolean;
  lastSynced?: string;
  provisionedAt?: string;
  courseCount: number;
  cpdActivitiesCount: number;
}

interface OpenLearningCourse {
  id: string;
  member_id: string;
  openlearning_course_id: string;
  openlearning_class_id?: string;
  course_name: string;
  course_description?: string;
  completion_date: string;
  completion_percentage?: number;
  certificate_url?: string;
  cpd_activity_id?: string;
  cpd_activity?: any;
  synced_at: string;
}

class OpenLearningService {
  private apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/openlearning`,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  constructor() {
    // Add auth token to all requests
    this.apiClient.interceptors.request.use(async (config) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      return config;
    });
  }

  /**
   * Provision current user in OpenLearning
   */
  async provisionCurrentUser(): Promise<{ success: boolean; openLearningUserId?: string; error?: string }> {
    try {
      const currentUser = JSON.parse(localStorage.getItem('eau_member') || '{}');
      if (!currentUser.id) {
        throw new Error('No user logged in');
      }

      const response = await this.apiClient.post('/provision', {
        memberId: currentUser.id
      });

      return response.data;
    } catch (error: any) {
      console.error('Error provisioning user:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Generate SSO launch URL for current user
   */
  async generateSSOUrl(classId?: string, returnUrl?: string): Promise<OpenLearningSSOResponse> {
    try {
      // Use authenticated endpoint for logged-in users
      const response = await this.apiClient.post('/sso', {
        classId,
        returnUrl: returnUrl || window.location.origin
      });

      return response.data;
    } catch (error: any) {
      console.error('Error generating SSO URL:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Launch OpenLearning SSO in new window or current window
   */
  async launchSSO(classId?: string, newWindow: boolean = true): Promise<void> {
    try {
      // Use the direct SAML Launch URL from OpenLearning
      const launchUrl = 'https://www.openlearning.com/saml-redirect/english-australia/english-australia/';
      
      if (newWindow) {
        // Open in new window/tab
        const newTab = window.open(launchUrl, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
        if (!newTab) {
          throw new Error('Pop-up blocked. Please allow pop-ups for this site and try again.');
        }
      } else {
        // Navigate in current window
        window.location.href = launchUrl;
      }
      
      // Store session info
      sessionStorage.setItem('openlearning_launched', new Date().toISOString());
    } catch (error: any) {
      console.error('Error launching OpenLearning SSO:', error);
      throw new Error(error.message || 'Failed to launch OpenLearning SSO');
    }
  }

  /**
   * Get OpenLearning integration status for current user
   */
  async getStatus(memberId?: string): Promise<{ success: boolean; status?: OpenLearningStatus; error?: string }> {
    try {
      const url = memberId ? `/status/${memberId}` : '/status';
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Error getting OpenLearning status:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get OpenLearning courses for current user or specified member
   */
  async getCourses(memberId?: string): Promise<{ success: boolean; courses?: OpenLearningCourse[]; error?: string }> {
    try {
      const url = memberId ? `/courses/${memberId}` : '/courses';
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Error getting courses:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Sync OpenLearning courses to CPD activities
   */
  async syncCourses(memberId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.apiClient.post('/sync', {
        memberId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error syncing courses:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Bulk provision multiple members (admin only)
   */
  async bulkProvision(memberIds: string[]): Promise<{ 
    success: boolean; 
    results?: {
      provisioned: string[];
      failed: { memberId: string; error: string }[];
      alreadyProvisioned: string[];
    };
    error?: string;
  }> {
    try {
      const response = await this.apiClient.post('/bulk-provision', {
        memberIds
      });
      return response.data;
    } catch (error: any) {
      console.error('Error bulk provisioning:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Check if user is authenticated with OpenLearning
   */
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('openlearning_session');
  }

  /**
   * Clear OpenLearning session
   */
  clearSession(): void {
    sessionStorage.removeItem('openlearning_session');
  }
}

// Export singleton instance
export const openLearningService = new OpenLearningService();

// Export types
export type { OpenLearningSSOResponse, OpenLearningStatus, OpenLearningCourse };