import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../stores/authStore';

interface ImpersonationSession {
  originalUserId: string;
  originalEmail: string;
  originalRoles: string[];
  impersonatedUserId: string;
  impersonatedEmail: string;
  impersonatedRoles: string[];
  startedAt: string;
}

class ImpersonationService {
  private readonly SESSION_KEY = 'eau_impersonation_session';
  private readonly ORIGINAL_USER_KEY = 'eau_original_user_data';
  
  /**
   * Check if current user can impersonate (must be SuperAdmin)
   */
  canImpersonate(): boolean {
    const roles = useAuthStore.getState().roles;
    return roles.includes('AdminSuper');
  }

  /**
   * Check if currently impersonating
   */
  isImpersonating(): boolean {
    return !!localStorage.getItem(this.SESSION_KEY);
  }

  /**
   * Get current impersonation session
   */
  getSession(): ImpersonationSession | null {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return null;
    
    try {
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }

  /**
   * Start impersonating a user
   */
  async startImpersonation(targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user can impersonate
      if (!this.canImpersonate()) {
        return { success: false, error: 'Only SuperAdmin can impersonate users' };
      }

      // Check if already impersonating
      if (this.isImpersonating()) {
        return { success: false, error: 'Already impersonating. Please exit current session first.' };
      }

      // Get current user state
      const currentState = useAuthStore.getState();
      const originalUser = currentState.user;
      const originalRoles = currentState.roles;
      const originalMemberData = localStorage.getItem('eau_member');

      if (!originalUser) {
        return { success: false, error: 'No user logged in' };
      }

      // Save original user data for restoration
      localStorage.setItem(this.ORIGINAL_USER_KEY, originalMemberData || '{}');

      // Get target user details
      const { data: targetMember, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (memberError || !targetMember) {
        return { success: false, error: 'Target user not found' };
      }

      // Get target user roles
      const { data: targetRoles, error: rolesError } = await supabase
        .from('member_roles')
        .select('role')
        .eq('member_id', targetUserId);

      if (rolesError) {
        console.error('Error fetching target user roles:', rolesError);
        return { success: false, error: 'Failed to fetch target user roles' };
      }

      let targetRoleNames = targetRoles?.map(r => r.role) || ['Members'];
      
      // Normalize role names to match the expected case (Members not member)
      targetRoleNames = targetRoleNames.map(role => {
        if (role === 'member') return 'Members';
        if (role === 'admin') return 'Admin';
        if (role === 'adminsuper') return 'AdminSuper';
        return role;
      });
      
      // Ensure user always has at least Members role
      if (targetRoleNames.length === 0) {
        targetRoleNames.push('Members');
      }

      // Save original session
      const impersonationSession: ImpersonationSession = {
        originalUserId: originalUser.id,
        originalEmail: originalUser.email || '',
        originalRoles: originalRoles,
        impersonatedUserId: targetMember.id,
        impersonatedEmail: targetMember.email,
        impersonatedRoles: targetRoleNames,
        startedAt: new Date().toISOString()
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(impersonationSession));

      // Update auth store with target user
      currentState.setUser({
        id: targetMember.id,
        email: targetMember.email,
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: targetMember.created_at
      });
      currentState.setRoles(targetRoleNames);

      // Store target member data
      localStorage.setItem('eau_member', JSON.stringify(targetMember));

      return { success: true };
    } catch (error: any) {
      console.error('Error starting impersonation:', error);
      return { success: false, error: error.message || 'Failed to start impersonation' };
    }
  }

  /**
   * Stop impersonating and restore original session
   */
  async stopImpersonation(): Promise<{ success: boolean; error?: string }> {
    try {
      const session = this.getSession();
      if (!session) {
        return { success: false, error: 'No impersonation session active' };
      }

      // Get original user data from saved backup
      const originalUserData = localStorage.getItem(this.ORIGINAL_USER_KEY);
      if (!originalUserData) {
        return { success: false, error: 'Original user data not found' };
      }

      let originalMember;
      try {
        originalMember = JSON.parse(originalUserData);
      } catch {
        return { success: false, error: 'Invalid original user data' };
      }

      // Restore original session
      const currentState = useAuthStore.getState();
      currentState.setUser({
        id: originalMember.id,
        email: originalMember.email,
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: originalMember.created_at
      });
      currentState.setRoles(session.originalRoles);

      // Restore original member data
      localStorage.setItem('eau_member', JSON.stringify(originalMember));

      // Clear impersonation session and backup data
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.ORIGINAL_USER_KEY);

      return { success: true };
    } catch (error: any) {
      console.error('Error stopping impersonation:', error);
      return { success: false, error: error.message || 'Failed to stop impersonation' };
    }
  }

  /**
   * Get display info for impersonation banner
   */
  getDisplayInfo(): { isImpersonating: boolean; originalEmail?: string; targetEmail?: string } {
    const session = this.getSession();
    if (!session) {
      return { isImpersonating: false };
    }

    return {
      isImpersonating: true,
      originalEmail: session.originalEmail,
      targetEmail: session.impersonatedEmail
    };
  }
}

export const impersonationService = new ImpersonationService();