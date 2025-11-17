import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '../types/permissions'

interface MemberData {
  id: string
  first_name: string
  last_name: string
  email: string
  institution_id: string | null
  institution_name: string | null
  user_type: string
}

interface AuthState {
  user: User | null
  memberData: MemberData | null
  roles: UserRole[]
  isLoading: boolean
  rolesLoaded: boolean
  setUser: (user: User | null) => void
  setMemberData: (memberData: MemberData | null) => void
  setRoles: (roles: UserRole[]) => void
  setIsLoading: (isLoading: boolean) => void
  setRolesLoaded: (loaded: boolean) => void
  hasRole: (role: UserRole) => boolean
  getEffectiveRoles: () => UserRole[]
  getEffectiveUserId: () => string | undefined
  reset: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  memberData: null,
  roles: [],
  isLoading: true,
  rolesLoaded: false,

  setUser: (user) => set({ user }),

  setMemberData: (memberData) => set({ memberData }),

  setRoles: (roles) => set({ roles, rolesLoaded: true }),
  
  setIsLoading: (isLoading) => {
    console.log('🔷 STORE: setIsLoading called with:', isLoading)
    set({ isLoading })
  },
  
  setRolesLoaded: (loaded) => set({ rolesLoaded: loaded }),

  hasRole: (role) => {
    const state = get()
    
    // During impersonation, use the impersonated user's roles from session
    const impersonationSession = localStorage.getItem('eau_impersonation_session')
    if (impersonationSession) {
      try {
        const session = JSON.parse(impersonationSession)
        const impersonatedRoles = session.impersonatedRoles || ['Members']
        return impersonatedRoles.includes(role)
      } catch {
        // If session parsing fails, fall back to state roles
        return state.roles.includes(role)
      }
    }

    // Use actual roles
    return state.roles.includes(role)
  },
  
  getEffectiveRoles: () => {
    const state = get()

    // During impersonation, use the impersonated user's roles from session
    const impersonationSession = localStorage.getItem('eau_impersonation_session')
    if (impersonationSession) {
      try {
        const session = JSON.parse(impersonationSession)
        const impersonatedRoles = session.impersonatedRoles || ['Members']
        return impersonatedRoles
      } catch {
        // If session parsing fails, fall back to state roles
        return state.roles
      }
    }

    // Return actual roles
    return state.roles
  },
  
  getEffectiveUserId: () => {
    const state = get()
    
    // During impersonation, use the impersonated user's ID from session
    const impersonationSession = localStorage.getItem('eau_impersonation_session')
    if (impersonationSession) {
      try {
        const session = JSON.parse(impersonationSession)
        return session.impersonatedUserId
      } catch {
        // If session parsing fails, fall back to state user
        return state.user?.id
      }
    }
    
    // Otherwise return actual user ID
    return state.user?.id
  },
  
  reset: () => {
    // CRITICAL: Clear role cache on logout to ensure clean state
    sessionStorage.removeItem('eau_cached_roles')
    console.log('🧹 Role cache cleared on logout')
    set({ user: null, memberData: null, roles: [], isLoading: false, rolesLoaded: false })
  },
}))

export type { UserRole }