import { supabase } from '../lib/supabase/client'

export interface MembershipTypePermissions {
  id: string
  membership_type: string
  can_access_all_documents: boolean
  can_access_premium_documents: boolean
  can_access_paid_events: boolean
  can_access_free_events_only: boolean
  can_access_member_resources: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export class MembershipPermissionsService {
  /**
   * Get permissions for a specific membership type
   */
  static async getPermissionsForType(membershipType: string): Promise<MembershipTypePermissions | null> {
    try {
      const { data, error } = await supabase
        .from('membership_type_permissions')
        .select('*')
        .eq('membership_type', membershipType)
        .single()

      if (error) {
        console.error('Error fetching permissions:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getPermissionsForType:', error)
      return null
    }
  }

  /**
   * Get permissions for current user's membership type
   */
  static async getCurrentUserPermissions(): Promise<MembershipTypePermissions | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Get member's membership type
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('membership_type')
        .eq('id', user.id)
        .single()

      if (memberError || !member) {
        console.error('Error fetching member:', memberError)
        return null
      }

      return this.getPermissionsForType(member.membership_type)
    } catch (error) {
      console.error('Error in getCurrentUserPermissions:', error)
      return null
    }
  }

  /**
   * Check if user can access paid events
   */
  static async canAccessPaidEvents(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!targetUserId) return false

      const { data: member } = await supabase
        .from('members')
        .select('membership_type, membership_status, user_type')
        .eq('id', targetUserId)
        .single()

      if (!member) return false

      // Super Admins and Admins always have access to paid events
      if (member.user_type === 'super_admin' || member.user_type === 'admin') {
        return true
      }

      // Only active members can access paid events
      if (member.membership_status !== 'active') return false

      // If no membership_type is set, default to false (must have a membership type)
      if (!member.membership_type) {
        console.warn('Member has no membership_type set, denying paid event access')
        return false
      }

      const permissions = await this.getPermissionsForType(member.membership_type)
      return permissions?.can_access_paid_events ?? false
    } catch (error) {
      console.error('Error checking paid event access:', error)
      return false
    }
  }

  /**
   * Check if user can access all documents
   */
  static async canAccessAllDocuments(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!targetUserId) return false

      const { data: member } = await supabase
        .from('members')
        .select('membership_type, membership_status')
        .eq('id', targetUserId)
        .single()

      if (!member) return false

      // Only active members can access documents
      if (member.membership_status !== 'active') return false

      const permissions = await this.getPermissionsForType(member.membership_type)
      return permissions?.can_access_all_documents ?? false
    } catch (error) {
      console.error('Error checking document access:', error)
      return false
    }
  }

  /**
   * Check if user can access premium documents
   */
  static async canAccessPremiumDocuments(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!targetUserId) return false

      const { data: member } = await supabase
        .from('members')
        .select('membership_type, membership_status')
        .eq('id', targetUserId)
        .single()

      if (!member) return false

      // Only active members can access premium documents
      if (member.membership_status !== 'active') return false

      const permissions = await this.getPermissionsForType(member.membership_type)
      return permissions?.can_access_premium_documents ?? false
    } catch (error) {
      console.error('Error checking premium document access:', error)
      return false
    }
  }

  /**
   * Check if user can access member resources
   */
  static async canAccessMemberResources(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!targetUserId) return false

      const { data: member } = await supabase
        .from('members')
        .select('membership_type, membership_status')
        .eq('id', targetUserId)
        .single()

      if (!member) return false

      // Only active members can access member resources
      if (member.membership_status !== 'active') return false

      const permissions = await this.getPermissionsForType(member.membership_type)
      return permissions?.can_access_member_resources ?? false
    } catch (error) {
      console.error('Error checking member resource access:', error)
      return false
    }
  }

  /**
   * Check if user is limited to free events only
   */
  static async isLimitedToFreeEventsOnly(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!targetUserId) return true // Default to restricted

      const { data: member } = await supabase
        .from('members')
        .select('membership_type')
        .eq('id', targetUserId)
        .single()

      if (!member) return true

      const permissions = await this.getPermissionsForType(member.membership_type)
      return permissions?.can_access_free_events_only ?? true
    } catch (error) {
      console.error('Error checking free event restriction:', error)
      return true // Default to restricted on error
    }
  }

  /**
   * Get all membership type permissions (for admin use)
   */
  static async getAllPermissions(): Promise<MembershipTypePermissions[]> {
    try {
      const { data, error } = await supabase
        .from('membership_type_permissions')
        .select('*')
        .order('membership_type')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all permissions:', error)
      return []
    }
  }

  /**
   * Update permissions for a membership type (admin only)
   */
  static async updatePermissions(
    membershipType: string,
    updates: Partial<Omit<MembershipTypePermissions, 'id' | 'created_at' | 'updated_at' | 'membership_type'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('membership_type_permissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('membership_type', membershipType)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating permissions:', error)
      return false
    }
  }
}
