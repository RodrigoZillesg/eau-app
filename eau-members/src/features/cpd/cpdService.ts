import { supabase } from '../../lib/supabase/client'
import { showNotification } from '../../lib/notifications'

// Types - ALL IN ONE FILE TO AVOID IMPORT ISSUES
interface CPDActivity {
  id: string
  member_id: string
  category_id: number
  category_name: string
  activity_title: string
  description?: string
  provider?: string
  date_completed: string
  hours: number
  minutes: number
  points: number
  evidence_url?: string
  evidence_filename?: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface CPDCategory {
  id: number
  name: string
  points_per_hour?: number
}

interface CPDFormData {
  category_id: number
  activity_title: string
  description?: string
  provider?: string
  date_completed: string
  hours: number
  minutes: number
  evidence?: File
}

interface CPDSettings {
  id: string
  auto_approval_enabled: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface CPDCategorySettings {
  id: string
  category_id: number
  category_name: string
  points_per_hour: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

const CPD_CATEGORIES: CPDCategory[] = [
  { id: 25, name: 'Learning Circle Interactive Course', points_per_hour: 1 },
  { id: 24, name: 'Mentor TESOL teacher', points_per_hour: 1 },
  { id: 23, name: 'Attend industry webinar', points_per_hour: 1 },
  { id: 15, name: 'Attend industry PD event', points_per_hour: 1 },
  { id: 14, name: 'Attend English Australia PD event', points_per_hour: 1 },
  { id: 17, name: 'Present at industry event (include preparation time)', points_per_hour: 2 },
  { id: 21, name: 'Attend in-house PD or Training event', points_per_hour: 1 },
  { id: 22, name: 'Present at in-house PD event (include preparation time)', points_per_hour: 2 },
  { id: 9, name: 'Attend English Australia webinar', points_per_hour: 1 },
  { id: 12, name: 'Watch recorded webinar', points_per_hour: 1 },
  { id: 18, name: 'Peer-observe someone\'s lesson', points_per_hour: 1 },
  { id: 19, name: 'Be observed teaching (including feedback)', points_per_hour: 1 },
  { id: 20, name: 'Complete professional course', points_per_hour: 1 },
  { id: 10, name: 'Attend Industry Training', points_per_hour: 1 },
  { id: 13, name: 'Read journal article', points_per_hour: 0.5 },
  { id: 11, name: 'Read professional article', points_per_hour: 0.5 },
]

class CPDService {
  static async getUserActivities(userId: string): Promise<CPDActivity[]> {
    try {
      // Check if we're in impersonation mode
      const impersonationSession = localStorage.getItem('eau_impersonation_session')
      let memberId: string
      
      if (impersonationSession) {
        try {
          const session = JSON.parse(impersonationSession)
          // In impersonation mode, impersonatedUserId is actually the member.id
          memberId = session.impersonatedUserId
          console.log('Getting activities for impersonated member:', memberId)
        } catch (e) {
          console.error('Error parsing impersonation session:', e)
          // Fallback to normal flow
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', userId)
            .single()
          
          if (memberError || !memberData) {
            console.error('Error fetching member data:', memberError)
            return []
          }
          memberId = memberData.id
        }
      } else {
        // Normal mode: get member_id from user_id
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        if (memberError || !memberData) {
          console.error('Error fetching member data:', memberError)
          return []
        }
        memberId = memberData.id
      }

      const { data, error } = await supabase
        .from('cpd_activities')
        .select('*')
        .eq('member_id', memberId)
        .order('date_completed', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching CPD activities:', error)
      throw error
    }
  }

  static async createActivity(formData: CPDFormData, userId: string, userEmail: string): Promise<CPDActivity> {
    try {
      // Check if we're in impersonation mode
      const impersonationSession = localStorage.getItem('eau_impersonation_session')
      let memberId: string
      
      if (impersonationSession) {
        try {
          const session = JSON.parse(impersonationSession)
          // In impersonation mode, impersonatedUserId is actually the member.id
          memberId = session.impersonatedUserId
          console.log('Creating activity for impersonated member:', memberId)
        } catch (e) {
          console.error('Error parsing impersonation session:', e)
          // Fallback to normal flow
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', userId)
            .single()
          
          if (memberError || !memberData) {
            console.error('Error fetching member data:', memberError)
            throw new Error('Member record not found for this user')
          }
          memberId = memberData.id
        }
      } else {
        // Normal mode: get member_id from user_id
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        if (memberError || !memberData) {
          console.error('Error fetching member data:', memberError)
          throw new Error('Member record not found for this user')
        }
        memberId = memberData.id
      }
      
      console.log('Using member_id:', memberId)

      // Get settings and category configuration
      const [settings, categorySettings] = await Promise.all([
        CPDService.getCPDSettings(),
        CPDService.getCategorySettings()
      ])

      // Find category configuration
      const categoryConfig = categorySettings.find(c => c.category_id === formData.category_id)
      const fallbackCategory = CPD_CATEGORIES.find(c => c.id === formData.category_id)
      
      // Calculate points based on database configuration, fallback to hardcoded values
      const pointsPerHour = categoryConfig?.points_per_hour || fallbackCategory?.points_per_hour || 1
      const categoryName = categoryConfig?.category_name || fallbackCategory?.name || 'Unknown Category'
      const totalHours = formData.hours + (formData.minutes / 60)
      const points = totalHours * pointsPerHour

      // ALWAYS auto-approve activities (as per client requirements)
      const initialStatus = 'approved'
      const approvalData: any = {
        approved_at: new Date().toISOString()
      }
      
      // Only add approved_by if NOT in impersonation mode
      if (!impersonationSession) {
        approvalData.approved_by = userId  // Use the user's own ID for auto-approval
      }

      // Upload evidence if provided
      let evidence_url = null
      let evidence_filename = null
      
      if (formData.evidence) {
        console.log('Processing evidence file:', formData.evidence.name)
        
        // Since there are no storage buckets configured, we'll save the file as base64
        // This is a temporary solution until storage buckets are properly configured
        try {
          // Convert file to base64
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string
              resolve(result)
            }
            reader.onerror = reject
          })
          reader.readAsDataURL(formData.evidence)
          
          const base64Data = await base64Promise
          
          // For now, store the base64 data as the URL
          // In production, this should be uploaded to a proper storage service
          evidence_url = base64Data
          evidence_filename = formData.evidence.name
          
          console.log('Evidence processed as base64, filename:', evidence_filename)
          
          // Note: Base64 data can be large, so we should limit file size
          if (formData.evidence.size > 2 * 1024 * 1024) { // 2MB limit for base64
            showNotification('warning', 'Certificate file is large and may not save properly. Consider using a smaller file.')
          }
        } catch (error) {
          console.error('Error processing evidence file:', error)
          showNotification('warning', 'Could not process certificate file, but activity will be created')
        }
      }

      // Create activity with proper member_id and user_id
      const activityData: any = {
        member_id: memberId,  // Use the actual member_id from the members table
        category_id: formData.category_id,
        category_name: categoryName,
        activity_title: formData.activity_title,
        description: formData.description || '',
        provider: formData.provider || '',
        date_completed: formData.date_completed,
        hours: formData.hours,
        minutes: formData.minutes,
        points: points,
        evidence_url,
        evidence_filename,
        status: initialStatus,
        // Auto-approved, set approval fields
        ...approvalData
      }
      
      // Only add user_id and created_by if NOT in impersonation mode
      // Since impersonated members don't have user_id in auth.users table
      if (!impersonationSession) {
        activityData.user_id = userId
        activityData.created_by = userId
      }

      console.log('Attempting to insert CPD activity with data:', activityData)
      
      const { data, error } = await supabase
        .from('cpd_activities')
        .insert(activityData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Activity data that failed:', activityData)
        throw error
      }
      
      const message = 'CPD activity added and automatically approved!'
      
      showNotification('success', message)
      return data
    } catch (error) {
      console.error('Error creating CPD activity:', error)
      showNotification('error', 'Failed to add CPD activity')
      throw error
    }
  }

  static async updateActivity(id: string, updates: Partial<CPDActivity>): Promise<CPDActivity> {
    try {
      const { data, error } = await supabase
        .from('cpd_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      showNotification('success', 'CPD activity updated successfully!')
      return data
    } catch (error) {
      console.error('Error updating CPD activity:', error)
      showNotification('error', 'Failed to update CPD activity')
      throw error
    }
  }

  static async deleteActivity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cpd_activities')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showNotification('success', 'CPD activity deleted successfully!')
    } catch (error) {
      console.error('Error deleting CPD activity:', error)
      showNotification('error', 'Failed to delete CPD activity')
      throw error
    }
  }

  static async getTotalPoints(userId: string): Promise<number> {
    try {
      // Check if we're in impersonation mode
      const impersonationSession = localStorage.getItem('eau_impersonation_session')
      let memberId: string
      
      if (impersonationSession) {
        try {
          const session = JSON.parse(impersonationSession)
          // In impersonation mode, impersonatedUserId is actually the member.id
          memberId = session.impersonatedUserId
        } catch (e) {
          console.error('Error parsing impersonation session:', e)
          // Fallback to normal flow
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', userId)
            .single()
          
          if (memberError || !memberData) {
            console.error('Error fetching member data:', memberError)
            return 0
          }
          memberId = memberData.id
        }
      } else {
        // Normal mode: get member_id from user_id
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        if (memberError || !memberData) {
          console.error('Error fetching member data:', memberError)
          return 0
        }
        memberId = memberData.id
      }

      const { data, error } = await supabase
        .from('cpd_activities')
        .select('points')
        .eq('member_id', memberId)
        .eq('status', 'approved')

      if (error) throw error
      
      return data?.reduce((total, activity) => total + (activity.points || 0), 0) || 0
    } catch (error) {
      console.error('Error calculating total points:', error)
      return 0
    }
  }

  static async getYearlyPoints(userId: string, year: number): Promise<number> {
    try {
      // Check if we're in impersonation mode
      const impersonationSession = localStorage.getItem('eau_impersonation_session')
      let memberId: string
      
      if (impersonationSession) {
        try {
          const session = JSON.parse(impersonationSession)
          // In impersonation mode, impersonatedUserId is actually the member.id
          memberId = session.impersonatedUserId
        } catch (e) {
          console.error('Error parsing impersonation session:', e)
          // Fallback to normal flow
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', userId)
            .single()
          
          if (memberError || !memberData) {
            console.error('Error fetching member data:', memberError)
            return 0
          }
          memberId = memberData.id
        }
      } else {
        // Normal mode: get member_id from user_id
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        if (memberError || !memberData) {
          console.error('Error fetching member data:', memberError)
          return 0
        }
        memberId = memberData.id
      }

      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      const { data, error } = await supabase
        .from('cpd_activities')
        .select('points')
        .eq('member_id', memberId)
        .eq('status', 'approved')
        .gte('date_completed', startDate)
        .lte('date_completed', endDate)

      if (error) throw error
      
      return data?.reduce((total, activity) => total + (activity.points || 0), 0) || 0
    } catch (error) {
      console.error('Error calculating yearly points:', error)
      return 0
    }
  }

  // Admin methods for managing CPD activities
  static async getAllActivities(filters?: {
    status?: string
    userId?: string
    search?: string
  }): Promise<CPDActivity[]> {
    try {
      let query = supabase
        .from('cpd_activities')
        .select(`
          *,
          members(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.userId) {
        query = query.eq('member_id', filters.userId)
      }
      if (filters?.search) {
        query = query.ilike('activity_title', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all activities:', error)
      return []
    }
  }

  // Admin methods for reviewing CPD submissions
  static async getAllPendingActivities(): Promise<CPDActivity[]> {
    try {
      const { data, error } = await supabase
        .from('cpd_activities')
        .select(`
          *,
          members!inner(first_name, last_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pending activities:', error)
      throw error
    }
  }

  static async getPendingActivitiesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('cpd_activities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error counting pending activities:', error)
      return 0
    }
  }

  static async getAllActivitiesStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    try {
      const [totalResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
        supabase.from('cpd_activities').select('*', { count: 'exact', head: true }),
        supabase.from('cpd_activities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('cpd_activities').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('cpd_activities').select('*', { count: 'exact', head: true }).eq('status', 'rejected')
      ])

      return {
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0
      }
    } catch (error) {
      console.error('Error getting activities stats:', error)
      return { total: 0, pending: 0, approved: 0, rejected: 0 }
    }
  }

  static async getPointsStats(): Promise<{
    totalPoints: number
    monthlyPoints: number
  }> {
    try {
      // Get start of current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfMonthISO = startOfMonth.toISOString()

      // Get all approved activities
      const { data: allActivities, error: allError } = await supabase
        .from('cpd_activities')
        .select('points')
        .eq('status', 'approved')

      if (allError) throw allError

      // Get current month approved activities
      const { data: monthActivities, error: monthError } = await supabase
        .from('cpd_activities')
        .select('points')
        .eq('status', 'approved')
        .gte('created_at', startOfMonthISO)

      if (monthError) throw monthError

      // Calculate totals
      const totalPoints = allActivities?.reduce((sum, activity) => sum + (activity.points || 0), 0) || 0
      const monthlyPoints = monthActivities?.reduce((sum, activity) => sum + (activity.points || 0), 0) || 0

      return {
        totalPoints,
        monthlyPoints
      }
    } catch (error) {
      console.error('Error getting points stats:', error)
      return { totalPoints: 0, monthlyPoints: 0 }
    }
  }

  static async approveActivity(id: string, adminUserId: string): Promise<CPDActivity> {
    try {
      const { data, error } = await supabase
        .from('cpd_activities')
        .update({
          status: 'approved',
          approved_by: adminUserId,
          approved_at: new Date().toISOString(),
          updated_by: adminUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      showNotification('success', 'CPD activity approved successfully!')
      return data
    } catch (error) {
      console.error('Error approving activity:', error)
      showNotification('error', 'Failed to approve activity')
      throw error
    }
  }

  static async rejectActivity(id: string, adminUserId: string, reason: string): Promise<CPDActivity> {
    try {
      const { data, error } = await supabase
        .from('cpd_activities')
        .update({
          status: 'rejected',
          approved_by: adminUserId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_by: adminUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      showNotification('success', 'CPD activity rejected')
      return data
    } catch (error) {
      console.error('Error rejecting activity:', error)
      showNotification('error', 'Failed to reject activity')
      throw error
    }
  }

  // Admin Settings Management
  static async getCPDSettings(): Promise<CPDSettings | null> {
    try {
      const { data, error } = await supabase
        .from('cpd_settings')
        .select('*')
        .single()

      if (error) {
        // If table doesn't exist, return default settings
        if (error.code === '42P01' || error.message.includes('404') || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('CPD Settings table not found, using default settings. Please run the setup SQL.')
          return {
            id: 'default',
            auto_approval_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error fetching CPD settings:', error)
      // Return default settings as fallback
      return {
        id: 'default',
        auto_approval_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  static async updateCPDSettings(updates: Partial<CPDSettings>): Promise<CPDSettings> {
    try {
      // First, get the current settings record to find its ID
      const currentSettings = await CPDService.getCPDSettings()
      
      if (!currentSettings || currentSettings.id === 'default') {
        // If no settings exist, create a new one
        const { data, error } = await supabase
          .from('cpd_settings')
          .insert({
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        showNotification('success', 'CPD settings created successfully!')
        return data
      }

      // Update the existing record using its ID
      const { data, error } = await supabase
        .from('cpd_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSettings.id)
        .select()
        .single()

      if (error) {
        // If table doesn't exist, show specific error
        if (error.code === '42P01' || error.message.includes('404') || error.message.includes('relation') || error.message.includes('does not exist')) {
          showNotification('error', 'CPD Settings table not found. Please run the setup SQL first.')
          throw new Error('Tables not created. Please run the setup SQL in Supabase Studio.')
        }
        throw error
      }
      
      showNotification('success', 'CPD settings updated successfully!')
      return data
    } catch (error) {
      console.error('Error updating CPD settings:', error)
      const errorMessage = (error as Error).message?.includes('Tables not created') 
        ? 'Please run the setup SQL first'
        : 'Failed to update CPD settings'
      showNotification('error', errorMessage)
      throw error
    }
  }

  static async getCategorySettings(): Promise<CPDCategorySettings[]> {
    try {
      const { data, error } = await supabase
        .from('cpd_category_settings')
        .select('*')
        .eq('is_active', true)
        .order('category_name')

      if (error) {
        // If table doesn't exist, return empty array (will use hardcoded fallback)
        if (error.code === '42P01' || error.message.includes('404') || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('CPD Category Settings table not found, using hardcoded categories. Please run the setup SQL.')
          return []
        }
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error fetching category settings:', error)
      return []
    }
  }

  static async updateCategorySettings(
    categoryId: number, 
    updates: Partial<CPDCategorySettings>
  ): Promise<CPDCategorySettings> {
    try {
      const { data, error } = await supabase
        .from('cpd_category_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('category_id', categoryId)
        .select()
        .single()

      if (error) {
        // If table doesn't exist, show specific error
        if (error.code === '42P01' || error.message.includes('404') || error.message.includes('relation') || error.message.includes('does not exist')) {
          showNotification('error', 'CPD Category Settings table not found. Please run the setup SQL first.')
          throw new Error('Tables not created. Please run the setup SQL in Supabase Studio.')
        }
        throw error
      }
      
      showNotification('success', 'Category settings updated successfully!')
      return data
    } catch (error) {
      console.error('Error updating category settings:', error)
      const errorMessage = (error as Error).message?.includes('Tables not created') 
        ? 'Please run the setup SQL first'
        : 'Failed to update category settings'
      showNotification('error', errorMessage)
      throw error
    }
  }
}

// Export everything as a single default object
export default {
  CPDService,
  CPD_CATEGORIES,
  // Export types by name for TypeScript
} as {
  CPDService: typeof CPDService;
  CPD_CATEGORIES: typeof CPD_CATEGORIES;
}

// Export types separately for TypeScript
export type { CPDActivity, CPDCategory, CPDFormData, CPDSettings, CPDCategorySettings }