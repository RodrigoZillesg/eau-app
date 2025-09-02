import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '../types/permissions'

interface AuthState {
  user: User | null
  roles: UserRole[]
  isLoading: boolean
  rolesLoaded: boolean
  setUser: (user: User | null) => void
  setRoles: (roles: UserRole[]) => void
  setIsLoading: (isLoading: boolean) => void
  setRolesLoaded: (loaded: boolean) => void
  hasRole: (role: UserRole) => boolean
  reset: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  roles: [],
  isLoading: true,
  rolesLoaded: false,
  
  setUser: (user) => set({ user }),
  
  setRoles: (roles) => set({ roles, rolesLoaded: true }),
  
  setIsLoading: (isLoading) => {
    console.log('🔷 STORE: setIsLoading called with:', isLoading)
    set({ isLoading })
  },
  
  setRolesLoaded: (loaded) => set({ rolesLoaded: loaded }),
  
  hasRole: (role) => get().roles.includes(role),
  
  reset: () => set({ user: null, roles: [], isLoading: false, rolesLoaded: false }),
}))

export type { UserRole }