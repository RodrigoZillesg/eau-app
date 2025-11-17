import { supabase } from '../lib/supabase/client'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/v1'

export interface MemberData {
  id: string
  first_name: string
  last_name: string
  email: string
  institution_id: string | null
  institution_name: string | null
  user_type: string
}

/**
 * Fetch member data including institution information
 * Uses backend /auth/me endpoint to bypass RLS issues
 */
export async function fetchMemberData(userId: string): Promise<MemberData | null> {
  try {
    console.log('🔍 fetchMemberData called for userId:', userId)
    console.log('🔍 Fetching member data from backend /auth/me...')

    // Get token directly from localStorage (bypass Supabase SDK to avoid hangs)
    const storageKey = 'sb-ypsvoxelitgceclohxfu-auth-token'
    const sessionStr = localStorage.getItem(storageKey)

    console.log('🔍 Session from localStorage:', sessionStr ? 'exists' : 'null')

    if (!sessionStr) {
      console.error('❌ No session in localStorage')
      return null
    }

    const session = JSON.parse(sessionStr)
    const accessToken = session?.access_token

    if (!accessToken) {
      console.error('❌ No access token in session')
      return null
    }

    console.log('🔍 Making fetch request to backend...')

    // Fetch from backend using /auth/me endpoint
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('🔍 Backend response status:', response.status)

    if (!response.ok) {
      console.error('❌ Error fetching member data from backend:', response.statusText)
      return null
    }

    const result = await response.json()
    console.log('🔍 fetchMemberData backend response:', result)

    if (!result.success || !result.data) {
      console.error('❌ No data in backend response')
      return null
    }

    const data = result.data
    const institutionName = data.institutions?.name || null

    const memberData = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      institution_id: data.institution_id,
      institution_name: institutionName,
      user_type: data.user_type
    }

    console.log('✅ fetchMemberData returning:', memberData)
    return memberData
  } catch (error) {
    console.error('❌ Exception fetching member data:', error)
    return null
  }
}
