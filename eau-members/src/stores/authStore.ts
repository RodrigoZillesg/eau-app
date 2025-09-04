import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '../types/permissions'

interface AuthState {
  user: User | null
  roles: UserRole[]
  isLoading: boolean
  rolesLoaded: boolean
  simulatedRole: UserRole | null
  setUser: (user: User | null) => void
  setRoles: (roles: UserRole[]) => void
  setIsLoading: (isLoading: boolean) => void
  setRolesLoaded: (loaded: boolean) => void
  setSimulatedRole: (role: UserRole | null) => void
  hasRole: (role: UserRole) => boolean
  getEffectiveRoles: () => UserRole[]
  reset: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  roles: [],
  isLoading: true,
  rolesLoaded: false,
  simulatedRole: null,
  
  setUser: (user) => set({ user }),
  
  setRoles: (roles) => set({ roles, rolesLoaded: true }),
  
  setIsLoading: (isLoading) => {
    console.log('🔷 STORE: setIsLoading called with:', isLoading)
    set({ isLoading })
  },
  
  setRolesLoaded: (loaded) => set({ rolesLoaded: loaded }),
  
  setSimulatedRole: (role) => {
    // Save to localStorage for persistence
    if (role) {
      localStorage.setItem('simulatedRole', role)
    } else {
      localStorage.removeItem('simulatedRole')
    }
    set({ simulatedRole: role })
  },
  
  hasRole: (role) => {
    const state = get()
    // Only use simulated role if user is authenticated and roles are loaded
    if (state.simulatedRole && !import.meta.env.PROD && state.user && state.rolesLoaded) {
      return state.simulatedRole === role
    }
    // Otherwise use actual roles
    return state.roles.includes(role)
  },
  
  getEffectiveRoles: () => {
    const state = get()
    // Only use simulated role if user is authenticated and roles are loaded
    if (state.simulatedRole && !import.meta.env.PROD && state.user && state.rolesLoaded) {
      return [state.simulatedRole]
    }
    // Otherwise return actual roles
    return state.roles
  },
  
  reset: () => {
    localStorage.removeItem('simulatedRole')
    set({ user: null, roles: [], isLoading: false, rolesLoaded: false, simulatedRole: null })
  },
}))

export type { UserRole }