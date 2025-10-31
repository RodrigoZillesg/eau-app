import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/authStore'

export interface UserInstitution {
  institutionId: string | null
  institutionName: string | null
  isInstitutionAdmin: boolean
}

/**
 * Get the institution ID for the current user
 */
export async function getUserInstitution(): Promise<UserInstitution> {
  try {
    const { user, roles } = useAuthStore.getState()

    if (!user) {
      return { institutionId: null, institutionName: null, isInstitutionAdmin: false }
    }

    // Super admins see everything
    if (roles.includes('AdminSuper')) {
      return { institutionId: null, institutionName: 'All Institutions', isInstitutionAdmin: false }
    }

    // Get member's institution
    const { data: member } = await supabase
      .from('members')
      .select(`
        institution_id,
        institutions (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (!member || !member.institution_id) {
      return { institutionId: null, institutionName: null, isInstitutionAdmin: false }
    }

    const isInstitutionAdmin = roles.includes('Admin') && !roles.includes('AdminSuper')

    return {
      institutionId: member.institution_id,
      institutionName: member.institutions?.name || null,
      isInstitutionAdmin
    }
  } catch (error) {
    console.error('Error getting user institution:', error)
    return { institutionId: null, institutionName: null, isInstitutionAdmin: false }
  }
}

/**
 * Apply institution filter to a Supabase query
 */
export function applyInstitutionFilter(query: any, institutionId: string | null) {
  if (institutionId) {
    return query.eq('institution_id', institutionId)
  }
  return query
}