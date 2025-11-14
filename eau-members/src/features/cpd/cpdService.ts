import { supabase } from '../../lib/supabase/client'
import { showNotification } from '../../lib/notifications'

// Types - ALL IN ONE FILE TO AVOID IMPORT ISSUES
// UPDATED TO MATCH ACTUAL DATABASE SCHEMA
interface CPDActivity {
  id: string
  user_id: string
  activity_type: string  // Maps to activity type in database
  cpd_category?: string  // Optional category field
  activity_title: string
  description?: string
  provider?: string
  activity_date: string  // Changed from date_completed
  cpd_points: number     // Already correct
  certificate_number?: string
  certificate_url?: string
  evidence_url?: string
  event_id?: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_date?: string  // Changed from approved_at
  rejection_reason?: string
  created_at: string
  updated_at: string
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
      // SIMPLIFIED: Use auth.users.id directly since cpd_activities.user_id references auth.users.id
      console.log('Getting CPD activities for user:', userId)

      const { data, error } = await supabase
        .from('cpd_activities')
        .select('*')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching CPD activities:', error)
      throw error
    }
  }

  static async createActivity(formData: CPDFormData, userId: string, userEmail: string): Promise<CPDActivity> {
    try {
      // ALWAYS use auth.users.id - cpd_activities.user_id references auth.users.id, NOT members.id
      const finalUserId: string = userId
      console.log('Using auth user_id for CPD activity:', finalUserId)

      // Get categories from database API
      const categories = await CPDService.getCPDCategoriesFromAPI()

      // Find category configuration from database
      const categoryConfig = categories.find(c => c.id === formData.category_id)
      const fallbackCategory = CPD_CATEGORIES.find(c => c.id === formData.category_id)

      // Calculate points based on database configuration, fallback to hardcoded values
      const pointsPerHour = categoryConfig?.points_per_hour || fallbackCategory?.points_per_hour || 1
      const categoryName = categoryConfig?.name || fallbackCategory?.name || 'Unknown Category'
      const totalHours = formData.hours + (formData.minutes / 60)
      const points = totalHours * pointsPerHour

      // Check CPD settings for auto-approval configuration
      const cpdSettings = await CPDService.getCPDSettings()
      const shouldAutoApprove = cpdSettings?.auto_approval_enabled ?? false

      const initialStatus = shouldAutoApprove ? 'approved' : 'pending'
      const approvalData: any = shouldAutoApprove ? {
        approved_date: new Date().toISOString(),
        approved_by: userId
      } : {}

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

      // Create activity with proper user_id - MAPPED TO CORRECT DATABASE SCHEMA
      const activityData: any = {
        user_id: finalUserId,  // Use the user_id (member_id if exists, auth user_id otherwise)
        activity_type: categoryName,  // Maps to activity_type column
        cpd_category: categoryName,   // Maps to cpd_category column
        activity_title: formData.activity_title,
        description: formData.description || '',
        provider: formData.provider || '',
        activity_date: formData.date_completed,  // Maps to activity_date column
        cpd_points: points,  // Maps to cpd_points column
        evidence_url,
        status: initialStatus,
        // Auto-approved, set approval fields
        ...approvalData
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

      const message = shouldAutoApprove
        ? 'CPD activity added and automatically approved!'
        : 'CPD activity added successfully! Waiting for admin approval.'

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
      // SIMPLIFIED: Use auth.users.id directly since cpd_activities.user_id references auth.users.id
      console.log('Getting total CPD points for user:', userId)

      const { data, error } = await supabase
        .from('cpd_activities')
        .select('cpd_points')
        .eq('user_id', userId)
        .eq('status', 'approved')

      if (error) throw error

      return data?.reduce((total, activity) => total + (activity.cpd_points || 0), 0) || 0
    } catch (error) {
      console.error('Error calculating total points:', error)
      return 0
    }
  }

  static async getYearlyPoints(userId: string, year: number): Promise<number> {
    try {
      // SIMPLIFIED: Use auth.users.id directly since cpd_activities.user_id references auth.users.id
      console.log('Getting yearly CPD points for user:', userId, 'year:', year)

      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const { data, error } = await supabase
        .from('cpd_activities')
        .select('cpd_points')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .gte('activity_date', startDate)
        .lte('activity_date', endDate)

      if (error) throw error

      return data?.reduce((total, activity) => total + (activity.cpd_points || 0), 0) || 0
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
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
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

  // Paginated version for performance
  static async getAllActivitiesPaginated(filters?: {
    status?: string
    userId?: string
    search?: string
    page?: number
    pageSize?: number
    userIds?: string[] // For institution filtering
  }): Promise<{ data: CPDActivity[], count: number }> {
    try {
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 50
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // First get CPD activities
      let query = supabase
        .from('cpd_activities')
        .select('*', { count: 'exact' })
        .order('activity_date', { ascending: false })

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }

      // Apply institution filter (for Institution Admins)
      if (filters?.userIds && filters.userIds.length > 0) {
        query = query.in('user_id', filters.userIds)
      }

      // Apply search filter - search in activity title AND get member IDs that match
      if (filters?.search) {
        const searchTerm = filters.search.trim()

        // First, try to find members that match the search term
        // Search in first_name, last_name, email, and also try to match full name
        const { data: matchingMembers } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)

        // Also check if the search term matches the full name (first + last)
        const additionalMembers: string[] = []
        if (matchingMembers) {
          for (const member of matchingMembers) {
            const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
            if (fullName.includes(searchTerm.toLowerCase())) {
              additionalMembers.push(member.id)
            }
          }
        }

        // If search contains a space, also search for members with matching first AND last name
        if (searchTerm.includes(' ')) {
          const parts = searchTerm.split(' ')
          const firstName = parts[0]
          const lastName = parts.slice(1).join(' ')

          const { data: exactMatchMembers } = await supabase
            .from('members')
            .select('id')
            .ilike('first_name', `%${firstName}%`)
            .ilike('last_name', `%${lastName}%`)

          if (exactMatchMembers) {
            additionalMembers.push(...exactMatchMembers.map(m => m.id))
          }
        }

        // Combine all member IDs (removing duplicates)
        const userIds = [...new Set([...(matchingMembers?.map(m => m.id) || []), ...additionalMembers])]

        // Search in activity title OR member_id if we found matching members
        if (userIds.length > 0) {
          // Use proper Supabase syntax for IN operator with curly braces
          query = query.or(`activity_title.ilike.%${searchTerm}%,member_id.in.(${userIds.map(id => `"${id}"`).join(',')})`)
        } else {
          // Just search in activity title if no members match
          query = query.ilike('activity_title', `%${searchTerm}%`)
        }
      }

      // Apply range after filters for correct pagination
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error in getAllActivitiesPaginated:', error)
        throw error
      }

      // If no activities, return empty result
      if (!data || data.length === 0) {
        return {
          data: [],
          count: count || 0
        }
      }

      // Get unique user_ids from activities
      const userIds = [...new Set(data.map(activity => activity.user_id).filter(Boolean))]

      // Fetch members data for these user_ids
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('user_id, id, first_name, last_name, email')
        .in('user_id', userIds)

      if (membersError) {
        console.error('Error fetching members data:', membersError)
        // Return activities without member data if members fetch fails
        return {
          data: data.map(activity => ({ ...activity, members: null })),
          count: count || 0
        }
      }

      // Create a map of user_id -> member data
      const membersMap = new Map()
      if (membersData) {
        membersData.forEach(member => {
          membersMap.set(member.user_id, member)
        })
      }

      // Combine activities with member data
      const activitiesWithMembers = data.map(activity => ({
        ...activity,
        members: membersMap.get(activity.user_id) || null
      }))

      return {
        data: activitiesWithMembers,
        count: count || 0
      }
    } catch (error) {
      console.error('Error fetching paginated activities:', error)
      throw error
    }
  }

  // Admin methods for reviewing CPD submissions
  static async getAllPendingActivities(userIds?: string[]): Promise<CPDActivity[]> {
    try {
      let query = supabase
        .from('cpd_activities')
        .select('*')
        .eq('status', 'pending')

      // Filter by member IDs if provided (for Institution Admin)
      if (userIds && userIds.length > 0) {
        query = query.in('user_id', userIds)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

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

  static async getAllActivitiesStats(userIds?: string[]): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    try {
      // Build base queries
      let totalQuery = supabase.from('cpd_activities').select('*', { count: 'exact', head: true })
      let pendingQuery = supabase.from('cpd_activities').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      let approvedQuery = supabase.from('cpd_activities').select('*', { count: 'exact', head: true }).eq('status', 'approved')
      let rejectedQuery = supabase.from('cpd_activities').select('*', { count: 'exact', head: true }).eq('status', 'rejected')

      // Filter by member IDs if provided (for Institution Admin)
      if (userIds && userIds.length > 0) {
        totalQuery = totalQuery.in('user_id', userIds)
        pendingQuery = pendingQuery.in('user_id', userIds)
        approvedQuery = approvedQuery.in('user_id', userIds)
        rejectedQuery = rejectedQuery.in('user_id', userIds)
      }

      const [totalResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
        totalQuery,
        pendingQuery,
        approvedQuery,
        rejectedQuery
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

  static async getPointsStats(userIds?: string[]): Promise<{
    totalPoints: number
    monthlyPoints: number
  }> {
    try {
      // Get start of current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfMonthISO = startOfMonth.toISOString()

      // Build base query for approved activities
      let allQuery = supabase
        .from('cpd_activities')
        .select('cpd_points')
        .eq('status', 'approved')

      // Filter by member IDs if provided (for Institution Admin)
      if (userIds && userIds.length > 0) {
        allQuery = allQuery.in('user_id', userIds)
      }

      const { data: allActivities, error: allError } = await allQuery

      if (allError) throw allError

      // Get current month approved activities
      let monthQuery = supabase
        .from('cpd_activities')
        .select('cpd_points')
        .eq('status', 'approved')
        .gte('created_at', startOfMonthISO)

      // Filter by member IDs if provided (for Institution Admin)
      if (userIds && userIds.length > 0) {
        monthQuery = monthQuery.in('user_id', userIds)
      }

      const { data: monthActivities, error: monthError } = await monthQuery

      if (monthError) throw monthError

      // Calculate totals
      const totalPoints = allActivities?.reduce((sum, activity) => sum + (activity.cpd_points || 0), 0) || 0
      const monthlyPoints = monthActivities?.reduce((sum, activity) => sum + (activity.cpd_points || 0), 0) || 0

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

  // Create CPD activity from event (called after certificate generation)
  static async createEventCPDActivity(params: {
    event_id: string;
    member_id?: string;
    user_id: string;
    event_title: string;
    event_date: string;
    cpd_points?: number;
    cpd_category?: string;
    certificate_number?: string;
    certificate_url?: string;
  }): Promise<CPDActivity | null> {
    try {
      console.log('Creating CPD activity from event:', params);

      // Get member_id if not provided
      let userId = params.user_id;
      if (!userId) {
        const { data: memberData } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', params.user_id)
          .single();

        if (!memberData) {
          console.error('Member not found for user:', params.user_id);
          return null;
        }
        userId = memberData.id;
      }

      // FIXED: Fetch category from database instead of hardcoded array
      const categoryName = params.cpd_category || 'Attend English Australia PD event';

      // Get categories from database API
      const categories = await CPDService.getCPDCategoriesFromAPI();
      const category = categories.find(c => c.name === categoryName);

      if (!category) {
        console.warn(`Category "${categoryName}" not found in database, using fallback from hardcoded array`);
      }

      // Fallback to hardcoded array if database category not found
      const fallbackCategory = CPD_CATEGORIES.find(c => c.name === categoryName) || CPD_CATEGORIES[4];
      const categoryToUse = category || fallbackCategory;

      // Calculate points (use event points if provided, otherwise use category points_per_hour)
      const points = params.cpd_points || categoryToUse.points_per_hour || 1;
      
      // Create the CPD activity
      const activityData = {
        user_id: params.user_id || userId,
        category_id: categoryToUse.id,
        category_name: categoryToUse.name,
        activity_title: `Event: ${params.event_title}`,
        description: `Attended online event "${params.event_title}" on ${params.event_date}${params.certificate_number ? `. Certificate: ${params.certificate_number}` : ''}`,
        provider: 'English Australia',
        date_completed: params.event_date,
        hours: Math.floor(points), // Assume 1 hour per point as default
        minutes: 0,
        points: points,
        evidence_url: params.certificate_url,
        evidence_filename: params.certificate_number ? `Certificate_${params.certificate_number}.pdf` : null,
        status: 'approved' as const, // Auto-approve event CPD activities
        approved_at: new Date().toISOString(),
        approved_by: params.user_id, // Use user_id instead of 'system'
        created_by: params.user_id,
        event_id: params.event_id, // Store event reference if field exists
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting CPD activity:', activityData);
      
      const { data, error } = await supabase
        .from('cpd_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) {
        console.error('Error creating event CPD activity:', error);
        // Don't throw - we don't want to break certificate generation
        return null;
      }

      console.log('CPD activity created successfully:', data);
      showNotification('success', 'CPD points automatically added for event attendance!');
      return data;
    } catch (error) {
      console.error('Error in createEventCPDActivity:', error);
      // Don't throw - we don't want to break certificate generation
      return null;
    }
  }

  // Admin Settings Management
  static async getCPDSettings(): Promise<CPDSettings | null> {
    try {
      // Get all settings and convert to the expected format
      const { data: settings, error } = await supabase
        .from('cpd_settings')
        .select('setting_key, setting_value')

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

      if (!settings || settings.length === 0) {
        return {
          id: 'default',
          auto_approval_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      // Convert key-value pairs to expected format
      const settingsObj: any = {
        id: 'settings',
        auto_approval_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      settings.forEach(setting => {
        if (setting.setting_key === 'auto_approve_events') {
          settingsObj.auto_approval_enabled = setting.setting_value
        }
      })

      return settingsObj
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

  /**
   * Fetch CPD categories from backend API (new cpd_categories table)
   */
  static async getCPDCategoriesFromAPI(): Promise<CPDCategory[]> {
    try {
      // Get Supabase auth token (same way as CPDCategoriesPage.tsx)
      const authData = localStorage.getItem('sb-ypsvoxelitgceclohxfu-auth-token')
      const token = authData ? JSON.parse(authData).access_token : null

      if (!token) {
        throw new Error('No authentication token found')
      }

      const { getApiUrl } = await import('../../config/api')
      const response = await fetch(getApiUrl('/cpd/categories'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch CPD categories: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('Invalid response format from API')
      }

      // Map backend response to CPDCategory format
      return result.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        points_per_hour: cat.points_per_hour,
        description: cat.description
      }))
    } catch (error) {
      console.error('Error fetching CPD categories from API:', error)
      // Return empty array, will fallback to hardcoded categories
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

// Export the service class directly for easier access
export { CPDService };

// Export everything as a single default object (for compatibility)
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